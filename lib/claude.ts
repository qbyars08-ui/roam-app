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

export const ITINERARY_SYSTEM_PROMPT = `You are ROAM — you sound like someone who lived in this city for a year, not a travel website.

CRITICAL: Respond with ONLY valid JSON. No markdown, no explanation, no extra text.

JSON schema:

{
  "destination": "City, Country",
  "tagline": "One line that makes someone want to book a flight. Under 10 words. Not generic — reference something only THIS city has. Bad: 'A city of culture and cuisine'. Good: 'Steak for $8. Bookshops open at midnight.'",
  "totalBudget": "$X,XXX",
  "days": [
    {
      "day": 1,
      "theme": "A story chapter title, not a category. 'Your First Tokyo Evening' not 'Arrival Day'. 'The Day You Eat Too Much' not 'Food & Culture'. Make it feel like something that happens to YOU, in THIS city.",
      "morning": {
        "activity": "THE specific thing to do — not 'visit the temple' but 'Senso-ji at 6AM before the tour buses arrive, then walk the empty Nakamise-dori'",
        "location": "The actual place name locals use",
        "cost": "$XX (also ¥X,XXX in local currency)",
        "tip": "The thing you'd text a friend: 'Order the #3 set, sit at the counter, the guy on the left is the master.' Not 'arrive early for the best experience.'",
        "time": "6:00 AM",
        "duration": "90",
        "neighborhood": "Asakusa",
        "address": "2-3-1 Asakusa, Taito City, Tokyo 111-0032",
        "transitToNext": "Walk 3 min to Asakusa Station, take Ginza Line to Ueno (5 min, platform 1, ¥170)"
      },
      "afternoon": {
        "activity": "Not 'explore the area' — the actual activity with why NOW is the right time for it",
        "location": "Real place",
        "cost": "$XX (local currency equivalent)",
        "tip": "Insider knowledge: what to order, where to sit, what most tourists miss",
        "time": "2:00 PM",
        "duration": "120",
        "neighborhood": "Yanaka",
        "address": "Full navigable address",
        "transitToNext": "Specific: which train line, which direction, which exit, how many minutes, fare"
      },
      "evening": {
        "activity": "Specific activity with the WHY — why THIS restaurant, why THIS bar, why THIS spot at THIS time",
        "location": "Real place",
        "cost": "$XX (local currency equivalent)",
        "tip": "The kind of advice that makes someone say 'how did you know that'",
        "time": "7:00 PM",
        "duration": "150",
        "neighborhood": "Shimokitazawa",
        "address": "Full address"
      },
      "accommodation": {
        "name": "A real place you'd tell a friend to book — not the #1 TripAdvisor result",
        "type": "hotel | hostel | airbnb | resort",
        "pricePerNight": "$XX",
        "neighborhood": "Shimokitazawa"
      },
      "dailyCost": "$XXX",
      "routeSummary": "Asakusa → Yanaka → Shimokitazawa (east to west, no backtracking)"
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
  "proTip": "The one thing that separates someone who went to this city from someone who KNOWS this city",
  "visaInfo": "Current visa requirements for US passport holders"
}

THE SPECIFICITY STANDARD — this is what separates ROAM from every other travel app:
- BAD: "Visit Tsukiji Market" → GOOD: "Tsukiji Outer Market at 7AM — go to Sushi Dai if the line is under 30 people, otherwise Daiwa Sushi next door is just as good and half the wait"
- BAD: "Take the subway" → GOOD: "Take the Ginza Line from Asakusa (platform 1, toward Shibuya), get off at Ueno, take exit 7 — you'll be facing the park entrance. ¥170, 5 minutes."
- BAD: "Try local food" → GOOD: "Ichiran Ramen in Shibuya — go to the basement floor (less crowded). Order extra firm noodles, extra garlic. ¥980."
- BAD: "Explore the neighborhood" → GOOD: "Walk Yanaka Ginza shopping street — the yakitori at Suzuki is ¥100/stick and worth the 5 minute wait. Continue to Yanaka Cemetery, which sounds weird but it's one of the most peaceful walks in Tokyo."
- BAD: "Visit a temple" → GOOD: "Meiji Shrine at 6:30AM. Enter through the main torii on Omotesando side. On weekday mornings you might see a traditional wedding procession. The inner garden costs ¥500 and has the best iris flowers in June."

COSTS — Always include both USD and local currency: "$12 (¥1,800)" or "$25 (€23)". Travelers need local currency for cash payments.

DAY THEMES — Each day is a chapter in a story. Not labels, not categories.
Day 1 is always about arrival and first impressions: "Your First _____ Evening"
The last day is always bittersweet: "One Last Morning in _____"
Middle days tell a narrative arc — the day you go deep, the day you go far, the day you slow down.

TIPS — The tip field is the most important text in the entire itinerary. It's the thing that makes someone screenshot this and send it to their group chat. Test each tip: "Would a local friend actually say this?" If it sounds like a travel blog, rewrite it.

REQUIRED: Every morning/afternoon/evening MUST include ALL fields:
  - "time": exact clock time. The time MATTERS — "6:00 AM" because the temple is empty, "10:30 PM" because that's when the jazz bar gets good. Explain why in the tip if the time is non-obvious.
  - "duration": minutes as string. Realistic — temple is 60-90min, ramen is 45min, a full market exploration is 180min.
  - "neighborhood": the district locals use. Not the city name.
  - "address": Google Maps-friendly. Real addresses only.
  - "transitToNext": Line name, direction, exit number, walking directions, fare. Skip for evening (last slot).
- "routeSummary": neighborhoods flowing geographically, no zigzagging.
- visaInfo: current 2025-2026 policies for US passport holders.
- packingEssentials: destination-specific. "Portable fan for August humidity" not "comfortable shoes."

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
// callClaudeStreaming — SSE streaming for trip generation
// Returns accumulated text via onChunk callback for real-time UI updates.
// ---------------------------------------------------------------------------

export interface StreamingCallbacks {
  onChunk: (accumulated: string, delta: string) => void;
  onMeta?: (tripsUsed: number, limit: number | null) => void;
  onDone: (fullText: string, tripsUsed: number, limit: number | null) => void;
  onError: (error: Error) => void;
}

export async function callClaudeStreaming(
  systemPrompt: string,
  userMessage: string,
  callbacks: StreamingCallbacks,
): Promise<void> {
  await ensureValidSession();

  const session = useAppStore.getState().session;
  const jwt = session?.access_token ?? '';
  const supabaseUrl = process.env.EXPO_PUBLIC_SUPABASE_URL ?? '';
  const supabaseAnonKey = process.env.EXPO_PUBLIC_SUPABASE_ANON_KEY ?? '';

  const url = `${supabaseUrl}/functions/v1/claude-proxy`;

  try {
    const response = await fetch(url, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        Authorization: `Bearer ${jwt}`,
        apikey: supabaseAnonKey,
      },
      body: JSON.stringify({
        system: systemPrompt,
        message: userMessage,
        isTripGeneration: true,
        stream: true,
      }),
    });

    if (!response.ok) {
      const errorData = await response.json().catch(() => ({ error: 'Stream request failed' }));
      if (errorData.code === 'LIMIT_REACHED') {
        callbacks.onError(new TripLimitReachedError(errorData.tripsUsed ?? 0, errorData.limit ?? 1));
      } else {
        callbacks.onError(new Error(errorData.error ?? `HTTP ${response.status}`));
      }
      return;
    }

    const reader = response.body?.getReader();
    if (!reader) {
      callbacks.onError(new Error('No readable stream'));
      return;
    }

    const decoder = new TextDecoder();
    let accumulated = '';
    let tripsUsed = 0;
    let limit: number | null = null;
    let buffer = '';

    while (true) {
      const { done, value } = await reader.read();
      if (done) break;

      buffer += decoder.decode(value, { stream: true });
      const lines = buffer.split('\n');
      buffer = lines.pop() ?? '';

      for (const line of lines) {
        if (!line.startsWith('data: ')) continue;
        const payload = line.slice(6).trim();
        if (!payload) continue;

        try {
          const event = JSON.parse(payload);

          if (event.type === 'meta') {
            tripsUsed = event.tripsUsed ?? 0;
            limit = event.limit ?? null;
            callbacks.onMeta?.(tripsUsed, limit);
          } else if (event.type === 'text') {
            accumulated += event.text;
            callbacks.onChunk(accumulated, event.text);
          } else if (event.type === 'done') {
            // Stream complete
          }
        } catch {
          // Skip malformed JSON
        }
      }
    }

    callbacks.onDone(accumulated, tripsUsed, limit);
  } catch (err: unknown) {
    callbacks.onError(err instanceof Error ? err : new Error(String(err)));
  }
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
// generateItineraryStreaming — stream-first version of generateItinerary
// Shows real-time progress via onProgress callback.
// ---------------------------------------------------------------------------

export async function generateItineraryStreaming(params: {
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
  onProgress?: (info: { daysFound: number; totalDays: number; text: string }) => void;
}): Promise<{ itinerary: Itinerary; tripsUsed: number; limit: number }> {
  const profile = params.travelProfile ?? (
    useAppStore.getState().hasCompletedProfile
      ? useAppStore.getState().travelProfile
      : null
  );

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
      // Weather fetch failed
    }
  }

  const prompt = buildTripPrompt({
    ...params,
    travelProfile: profile,
    weather: weatherCtx,
    groupSize: params.groupSize,
  });

  return new Promise((resolve, reject) => {
    callClaudeStreaming(ITINERARY_SYSTEM_PROMPT, prompt, {
      onChunk(accumulated, _delta) {
        // Count "day": patterns to track generation progress
        const dayMatches = accumulated.match(/"day"\s*:\s*\d+/g);
        const daysFound = dayMatches ? dayMatches.length : 0;
        const statusMessages = [
          `Building your ${params.destination} trip...`,
          `Day ${Math.min(daysFound, params.days)} of ${params.days}...`,
          `Crafting Day ${Math.min(daysFound, params.days)} recommendations...`,
        ];
        const text = daysFound > 0 ? statusMessages[1] : statusMessages[0];
        params.onProgress?.({ daysFound, totalDays: params.days, text });
      },
      onDone(fullText, tripsUsed, limit) {
        try {
          const itinerary = parseItinerary(fullText);
          resolve({
            itinerary,
            tripsUsed,
            limit: limit ?? 1,
          });
        } catch (parseErr) {
          reject(parseErr instanceof Error ? parseErr : new Error('Failed to parse itinerary'));
        }
      },
      onError(error) {
        reject(error);
      },
    });
  });
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
