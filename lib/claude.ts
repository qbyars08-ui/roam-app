// =============================================================================
// ROAM — Claude AI Integration (via Supabase Edge Function proxy)
// =============================================================================

// Platform import removed — direct API calls eliminated for security
import { supabase } from './supabase';
import { parseItinerary, type Itinerary } from './types/itinerary';
import { type TravelProfile, profileToPromptString } from './types/travel-profile';
import { useAppStore } from './store';

// ---------------------------------------------------------------------------
// System prompts
// ---------------------------------------------------------------------------

export const ITINERARY_SYSTEM_PROMPT = `You are ROAM — a travel planner that sounds like your most well-traveled friend, not a corporate chatbot.

CRITICAL: Respond with ONLY valid JSON. No markdown, no explanation, no extra text.

JSON schema:

{
  "destination": "City, Country",
  "tagline": "Punchy, specific — think magazine headline, not brochure. Under 10 words.",
  "totalBudget": "$X,XXX",
  "days": [
    {
      "day": 1,
      "theme": "Evocative theme like 'The Day You Eat Too Much' not 'Food & Culture Day'",
      "morning": {
        "activity": "Specific — not 'explore the area'",
        "location": "Real place name — the actual spot",
        "cost": "$XX",
        "tip": "The kind of tip a local friend would whisper to you",
        "time": "9:00 AM",
        "duration": "90",
        "neighborhood": "Shibuya",
        "address": "Google Maps-friendly address",
        "transitToNext": "15 min walk through Cat Street"
      },
      "afternoon": {
        "activity": "Specific activity",
        "location": "Real place name",
        "cost": "$XX",
        "tip": "What to order, where to sit, when to go",
        "time": "2:00 PM",
        "duration": "120",
        "neighborhood": "Harajuku",
        "address": "Full address for navigation",
        "transitToNext": "Take Yamanote Line, 2 stops to Shinjuku (8 min)"
      },
      "evening": {
        "activity": "Specific activity",
        "location": "Real place name",
        "cost": "$XX",
        "tip": "Insider knowledge, not 'arrive early'",
        "time": "6:00 PM",
        "duration": "150",
        "neighborhood": "Shinjuku",
        "address": "Full address"
      },
      "accommodation": {
        "name": "Real name — the place you'd actually book",
        "type": "hotel | hostel | airbnb | resort",
        "pricePerNight": "$XX",
        "neighborhood": "Shinjuku"
      },
      "dailyCost": "$XXX",
      "routeSummary": "Shibuya → Harajuku → Shinjuku"
    }
  ],
  "budgetBreakdown": {
    "accommodation": "$X,XXX",
    "food": "$XXX",
    "activities": "$XXX",
    "transportation": "$XXX",
    "miscellaneous": "$XXX"
  },
  "packingEssentials": ["item1", "item2", "item3"],
  "proTip": "One piece of advice that saves real money or real time",
  "visaInfo": "Current visa requirements for US passport holders"
}

Voice guidelines:
- Sound like someone who's BEEN there. Be specific and opinionated.
- Name the actual restaurant, the specific dish, the exact street.
- Tips should be texts to a friend: "Order the #3, skip the appetizers"
- REAL places only. If unsure, pick one you're confident about.
- packingEssentials: destination-specific. "Reef-safe sunscreen" not just "sunscreen."
- CRITICAL: Each morning/afternoon/evening slot MUST include ALL of these fields:
  - "time": exact clock time in 12-hour format (e.g. "9:00 AM", "2:30 PM"). Never "Morning" or "Evening".
  - "duration": estimated minutes as a string (e.g. "90", "120"). Be realistic — a temple visit is 60-90 min, a food tour is 180 min.
  - "neighborhood": the district or area (e.g. "Shibuya", "Roma Norte", "Alfama"). Critical for route planning.
  - "address": a Google Maps-friendly address users can tap to navigate.
  - "transitToNext": how to get to the next activity. Be specific: "15 min walk along the canal" or "Take Metro Line 3, get off at Zócalo (12 min)". Skip for the last activity of the day (evening).
- "routeSummary": a quick route overview for the day, e.g. "Shibuya → Harajuku → Shinjuku"
- visaInfo: current 2025-2026 policies for US passport holders.

PERSONALIZATION — Travel Style Profile:
When a user's Travel Style Profile is provided, it MUST shape every recommendation:
- Pace 1-3: Fewer activities per day, deeper exploration of each spot, rest time built in
- Pace 7-10: Pack the days, multiple neighborhoods, early mornings + late nights
- Budget 1-3: Hostels, street food, free activities, public transit only
- Budget 7-10: Luxury hotels, fine dining, private tours, rideshare/taxi
- Crowd tolerance 1-3: Skip anything that appears on "Top 10" lists. Find the local-only spots.
- Crowd tolerance 7-10: Include the famous landmarks and popular restaurants
- Food 1-3: Familiar cuisines, recognizable dishes, sit-down restaurants
- Food 7-10: Street stalls, markets, hole-in-the-wall spots, the dish only locals order
- Transport preferences: Only suggest their preferred transport modes
- Accommodation style: Match exactly — never suggest hostels to a luxury traveler
- Trip purposes: Weight the itinerary heavily toward their stated purposes

TRAVEL FREQUENCY (how often they travel) — critical for tone and depth:
- first-trip: More tips, safety info, explanations. Explain things a first-timer wouldn't know. Include "pro tip" style guidance. Don't assume they've done this before.
- once-a-year: Moderate guidance. Some context, not overwhelming.
- few-times-year: Standard level. Assume they know basics.
- constantly: Minimal hand-holding. Advanced recommendations only. Skip basics, visa reminders, packing 101. Get straight to the good stuff.

A pace-1, budget-1, crowd-1 user in Tokyo should get completely different recs than a pace-10, budget-10, crowd-10 user.

SPATIAL INTELLIGENCE — The "Hokkaido Problem" (CRITICAL):
Never schedule activities that are geographically impossible in sequence. Rules:
- ALL activities within a single day MUST be in the same city/district or reachable within 30 minutes by the transit mode available in that destination.
- If a destination has multiple areas (e.g., Kyoto temples are spread across the city), group activities by neighborhood per day, not randomly.
- "transitToNext" MUST reflect a REAL, feasible route — not a fantasy. If it takes 3 hours by train, it cannot be a morning→afternoon transition. Schedule it across different days instead.
- If suggesting a day trip to a nearby area (e.g., Kamakura from Tokyo, Sintra from Lisbon), the ENTIRE day should be dedicated to that trip. Do not mix a day trip with activities back in the main city.
- Before finalizing each day, mentally verify: "Can a person physically get from Activity A to Activity B in the time between them?" If not, restructure.
- The "routeSummary" field should show neighborhoods flowing geographically, not zigzagging across the city.`;

export const CHAT_SYSTEM_PROMPT = `You're the friend who's been everywhere and always knows a spot. You're ROAM's travel chat — knowledgeable, honest, opinionated, and never boring.

Voice:
- Talk like a real person, not a brochure. "Skip the tourist restaurants on the main strip" > "Consider exploring local dining options."
- Be honest about downsides — "March is shoulder season so some restaurants will be closed, but the upside is no crowds."
- Keep responses tight. Under 250 words unless they ask for a deep dive.
- Name real places. The specific restaurant, the exact neighborhood, the actual trail name.
- If you don't know, say "Not sure on that one" — never make something up.
- When they ask about safety, be real but not fearful. Practical advice, not disclaimers.
- Never generate itinerary JSON — tell them to hit the Plan tab for that.
- Use formatting (bold, bullets) when it helps readability, but don't overdo it.
- If the user asks about pet-friendly travel, dog parks, vet clinics, pet policies, or traveling with pets, give detailed, city-specific answers including: pet-friendly hotel chains (Kimpton, Loews, La Quinta), airline pet policies (under-seat carriers under 20lbs on most US carriers), local dog parks, and any breed restrictions for the destination.`;

// ---------------------------------------------------------------------------
// Types
// ---------------------------------------------------------------------------

export interface ClaudeResponse {
  content: string;
  tripsUsed: number;
  limit: number;
}

export class TripLimitReachedError extends Error {
  tripsUsed: number;
  limit: number;

  constructor(tripsUsed: number, limit: number) {
    super(
      `You\u2019ve used your free trip this month. Upgrade to Pro to keep planning \u2014 or come back next month, we won\u2019t judge.`
    );
    this.name = 'TripLimitReachedError';
    this.tripsUsed = tripsUsed;
    this.limit = limit;
  }
}

// ---------------------------------------------------------------------------
// ensureValidSession — upgrade fake guest sessions to real anonymous auth
// ---------------------------------------------------------------------------
// Guest users get a fake session with access_token: '' which can't authenticate
// to the edge function. This helper upgrades them to a real Supabase anonymous
// session so API calls work. Called before every edge function invocation.
// ---------------------------------------------------------------------------

async function ensureValidSession(): Promise<void> {
  const session = useAppStore.getState().session;

  // No session at all, or fake guest session with empty access_token
  const needsUpgrade =
    !session ||
    !session.access_token ||
    String(session.user?.id).startsWith('guest-');

  if (!needsUpgrade) return;

  try {
    const { data, error } = await supabase.auth.signInAnonymously();
    if (!error && data.session) {
      useAppStore.getState().setSession(data.session);
    }
  } catch {
    // If anonymous auth fails, the API call will fail with 401 —
    // that's fine, the caller will show the error
  }
}

// ---------------------------------------------------------------------------
// callClaude — all AI calls route through Supabase edge function (secure)
// ---------------------------------------------------------------------------
// SECURITY: Direct Anthropic API calls removed. The API key must NEVER be
// bundled in client code. All requests go through claude-proxy edge function
// which validates JWTs, enforces rate limits, and keeps the key server-side.
// ---------------------------------------------------------------------------

export async function callClaude(
  systemPrompt: string,
  userMessage: string,
  /** If true, this counts as a trip generation (rate-limited) */
  isTripGeneration = false
): Promise<ClaudeResponse> {
  // Ensure we have a real JWT before calling the edge function
  await ensureValidSession();

  // Client-side timeout: 90s for trip generation, 30s for chat
  const timeoutMs = isTripGeneration ? 90_000 : 30_000;
  const controller = new AbortController();
  const timer = setTimeout(() => controller.abort(), timeoutMs);

  let data: Record<string, unknown> | null = null;
  let error: unknown = null;

  try {
    const result = await supabase.functions.invoke('claude-proxy', {
      body: {
        system: systemPrompt,
        message: userMessage,
        isTripGeneration,
      },
    });
    data = result.data;
    error = result.error;
  } catch (err: unknown) {
    clearTimeout(timer);
    if (err instanceof DOMException && err.name === 'AbortError') {
      throw new Error('Request timed out. Check your connection and try again.');
    }
    throw err;
  } finally {
    clearTimeout(timer);
  }

  if (error) {
    const message =
      typeof error === 'object' && 'message' in error
        ? (error as { message: string }).message
        : String(error);
    throw new Error(`Claude proxy error: ${message}`);
  }

  if (data?.code === 'LIMIT_REACHED') {
    throw new TripLimitReachedError((data.tripsUsed as number) ?? 0, (data.limit as number) ?? 1);
  }

  if (data?.error) throw new Error(String(data.error));

  if (!data) throw new Error('No response from Claude proxy');

  return {
    content: data.content as string,
    tripsUsed: (data.tripsUsed as number) ?? 0,
    limit: (data.limit as number) ?? 1,
  };
}

export async function callClaudeWithMessages(
  systemPrompt: string,
  messages: Array<{ role: 'user' | 'assistant'; content: string }>,
  isTripGeneration = false
): Promise<ClaudeResponse> {
  // Ensure we have a real JWT before calling the edge function
  await ensureValidSession();

  const timeoutMs = isTripGeneration ? 90_000 : 30_000;
  const timeoutId = setTimeout(() => {}, timeoutMs); // placeholder for abort

  let data: Record<string, unknown> | null = null;
  let error: unknown = null;

  try {
    const result = await Promise.race([
      supabase.functions.invoke('claude-proxy', {
        body: {
          system: systemPrompt,
          messages: messages.map((m) => ({ role: m.role, content: m.content })),
          isTripGeneration,
        },
      }),
      new Promise<never>((_, reject) =>
        setTimeout(() => reject(new Error('Request timed out. Check your connection and try again.')), timeoutMs)
      ),
    ]);
    data = result.data;
    error = result.error;
  } finally {
    clearTimeout(timeoutId);
  }

  if (error) {
    const msg = typeof error === 'object' && 'message' in error ? (error as { message: string }).message : String(error);
    throw new Error(`Claude proxy error: ${msg}`);
  }
  if (data?.code === 'LIMIT_REACHED') {
    throw new TripLimitReachedError((data.tripsUsed as number) ?? 0, (data.limit as number) ?? 1);
  }
  if (data?.error) throw new Error(String(data.error));

  if (!data) throw new Error('No response from Claude proxy');

  return {
    content: data.content as string,
    tripsUsed: (data.tripsUsed as number) ?? 0,
    limit: (data.limit as number) ?? 1,
  };
}

// ---------------------------------------------------------------------------
// buildTripPrompt — build the user message for itinerary generation
// ---------------------------------------------------------------------------

export interface WeatherContext {
  days: Array<{
    date: string;
    tempMin: number;
    tempMax: number;
    description: string;
    pop: number; // precipitation probability 0-1
  }>;
}

export function buildTripPrompt(params: {
  destination: string;
  days: number;
  budget: string;
  vibes: readonly string[];
  travelProfile?: TravelProfile | null;
  weather?: WeatherContext | null;
  groupSize?: number;
  pace?: string;
  accommodationStyle?: string;
  morningType?: string;
  tripComposition?: string;
  dietary?: readonly string[];
  transport?: readonly string[];
  mustVisit?: string;
  avoidList?: string;
  specialRequests?: string;
}): string {
  // Validate required params at runtime
  const dest = params.destination?.trim();
  if (!dest) throw new Error('Destination is required');
  if (!params.days || params.days < 1 || params.days > 30) {
    throw new Error('Trip duration must be between 1 and 30 days');
  }
  if (!params.budget?.trim()) throw new Error('Budget tier is required');

  const vibeList = params.vibes.length > 0 ? params.vibes.join(', ') : 'general sightseeing';

  const lines = [
    `Plan a ${params.days}-day trip to ${dest}.`,
    `Budget tier: ${params.budget}.`,
    `Travel vibes: ${vibeList}.`,
  ];

  if (params.groupSize != null && params.groupSize > 1) {
    lines.push(`Group size: ${params.groupSize} travelers.`);
  }

  // ── Trip customization (from quick mode builder) ──
  if (params.tripComposition) {
    lines.push(`Trip composition: ${params.tripComposition}.`);
  }

  if (params.pace) {
    lines.push(`Travel pace: ${params.pace}. Match the number of activities per time slot to this pace exactly.`);
  }

  if (params.morningType) {
    const morningTimes: Record<string, string> = {
      'early-bird': 'Start mornings at 6:30-7:00 AM. This traveler wants to catch sunrise and beat crowds.',
      'regular': 'Start mornings around 9:00 AM. Standard pacing.',
      'sleep-in': 'Start mornings at 11:00 AM or later. This traveler is NOT a morning person — no sunrise temples.',
    };
    lines.push(morningTimes[params.morningType] ?? `Morning preference: ${params.morningType}.`);
  }

  if (params.accommodationStyle) {
    lines.push(`Accommodation preference: ${params.accommodationStyle}. Only suggest this type of accommodation.`);
  }

  if (params.transport && params.transport.length > 0) {
    lines.push(`Preferred transport: ${params.transport.join(', ')}. Only use these modes in transitToNext directions.`);
  }

  if (params.dietary && params.dietary.length > 0) {
    lines.push(`Dietary requirements: ${params.dietary.join(', ')}. ALL food recommendations MUST respect these restrictions — no exceptions.`);
  }

  if (params.mustVisit) {
    lines.push('');
    lines.push('--- MUST-VISIT SPOTS (work these into the itinerary, do NOT skip them) ---');
    lines.push(params.mustVisit);
    lines.push('---');
  }

  if (params.avoidList) {
    lines.push('');
    lines.push('--- AVOID LIST (do NOT include any of these) ---');
    lines.push(params.avoidList);
    lines.push('---');
  }

  if (params.specialRequests) {
    lines.push('');
    lines.push('--- SPECIAL REQUESTS (incorporate these into the plan) ---');
    lines.push(params.specialRequests);
    lines.push('---');
  }

  // Inject travel profile if available
  if (params.travelProfile) {
    lines.push('');
    lines.push('--- TRAVELER PROFILE (personalize every recommendation to this) ---');
    lines.push(profileToPromptString(params.travelProfile));
    lines.push('---');
  }

  // Inject weather forecast if available — AI adjusts outdoor activities for rain
  if (params.weather && params.weather.days.length > 0) {
    lines.push('');
    lines.push('--- WEATHER FORECAST (adapt activities to these conditions) ---');
    for (const day of params.weather.days) {
      const rainChance = Math.round(day.pop * 100);
      lines.push(
        `${day.date}: ${day.tempMin}°C–${day.tempMax}°C, ${day.description}${
          rainChance > 30 ? ` (${rainChance}% chance of rain)` : ''
        }`
      );
    }
    lines.push('IMPORTANT: If rain is forecast (>40% chance), swap outdoor activities for indoor alternatives on those days. Museums, covered markets, indoor food halls, teamLab, etc. In your tips, add: "ROAM adjusted Day X for rain — [what we changed, e.g. moved hiking to Day Y, added teamLab Planets]" so the traveler sees the adjustment.');
    lines.push('---');
  }

  lines.push('');
  lines.push('Provide a complete itinerary with real place names, costs, and insider tips.');

  return lines.join('\n');
}

// ---------------------------------------------------------------------------
// generateItinerary — convenience wrapper that parses JSON output
// ---------------------------------------------------------------------------

export async function generateItinerary(params: {
  destination: string;
  days: number;
  budget: string;
  vibes: string[];
  travelProfile?: TravelProfile | null;
  weather?: WeatherContext | null;
  startDate?: string;
  groupSize?: number;
  pace?: string;
  accommodationStyle?: string;
  morningType?: string;
  tripComposition?: string;
  dietary?: string[];
  transport?: string[];
  mustVisit?: string;
  avoidList?: string;
  specialRequests?: string;
}): Promise<{ itinerary: Itinerary; tripsUsed: number; limit: number }> {
  // Auto-inject travel profile from store if not explicitly provided
  const profile = params.travelProfile ?? (
    useAppStore.getState().hasCompletedProfile
      ? useAppStore.getState().travelProfile
      : null
  );

  // Fetch weather forecast to inject into the prompt (non-blocking — if it fails, skip)
  // AI will swap outdoor→indoor activities on rainy days
  let weatherCtx = params.weather ?? null;
  if (!weatherCtx) {
    try {
      const { getWeatherForecast } = await import('./weather');
      const forecast = await getWeatherForecast(params.destination, {
        startDate: params.startDate ?? new Date().toISOString().split('T')[0],
        days: params.days,
      });
      if (forecast.days.length > 0) {
        weatherCtx = {
          days: forecast.days.slice(0, params.days).map((d) => ({
            date: d.date,
            tempMin: d.tempMin,
            tempMax: d.tempMax,
            description: d.description,
            pop: d.pop,
          })),
        };
      }
    } catch {
      // Weather fetch failed — generate without it
    }
  }

  const prompt = buildTripPrompt({
    ...params,
    travelProfile: profile,
    weather: weatherCtx,
    groupSize: params.groupSize,
  });
  const response = await callClaude(ITINERARY_SYSTEM_PROMPT, prompt, true);

  const itinerary = parseItinerary(response.content);

  return {
    itinerary,
    tripsUsed: response.tripsUsed,
    limit: response.limit,
  };
}

// ---------------------------------------------------------------------------
// Conversation mode — trip planning dialogue
// ---------------------------------------------------------------------------

export const CONVERSATION_GENERATE_SYSTEM = `You are ROAM — a travel planner. You are having a conversation to plan a trip.

RULES:
1. Ask ONE question at a time. Never more.
2. Never offer more than 3 options in any response.
3. Match the user's energy — casual or specific.
4. Remember everything. Reference earlier answers naturally.
5. When destination, duration, budget, and at least one vibe are confirmed, say exactly: "Ready to build your trip?" and stop. Do not add anything after that.
6. Never use emojis.
7. Keep every response under 30 words. Punchy, direct, no filler.
8. Extract: destination (city/region), days (number), budget (budget / mid / luxury), group size (number), vibes (adventure, culture, relaxed, party, foodie, digital nomad).`;

export async function sendConversationMessage(
  messages: Array<{ role: 'user' | 'assistant'; content: string }>
): Promise<{ content: string }> {
  const response = await callClaudeWithMessages(CONVERSATION_GENERATE_SYSTEM, messages, false);
  return { content: response.content };
}

// ---------------------------------------------------------------------------
// sendChatMessage — convenience wrapper for the chat assistant
// ---------------------------------------------------------------------------

export async function sendChatMessage(
  message: string
): Promise<{ content: string }> {
  const response = await callClaude(CHAT_SYSTEM_PROMPT, message, false);
  return { content: response.content };
}
