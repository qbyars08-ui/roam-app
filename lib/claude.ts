// =============================================================================
// ROAM — Claude AI Integration (via Supabase Edge Function proxy)
// =============================================================================

import { Platform } from 'react-native';
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
        "tip": "The kind of tip a local friend would whisper to you"
      },
      "afternoon": {
        "activity": "Specific activity",
        "location": "Real place name",
        "cost": "$XX",
        "tip": "What to order, where to sit, when to go"
      },
      "evening": {
        "activity": "Specific activity",
        "location": "Real place name",
        "cost": "$XX",
        "tip": "Insider knowledge, not 'arrive early'"
      },
      "accommodation": {
        "name": "Real name — the place you'd actually book",
        "type": "hotel | hostel | airbnb | resort",
        "pricePerNight": "$XX"
      },
      "dailyCost": "$XXX"
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

A pace-1, budget-1, crowd-1 user in Tokyo should get completely different recs than a pace-10, budget-10, crowd-10 user.`;

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
// Direct Anthropic API call — used as fallback when edge function unavailable
// ---------------------------------------------------------------------------

const ANTHROPIC_KEY = process.env.ANTHROPIC_API_KEY ?? process.env.EXPO_PUBLIC_ANTHROPIC_API_KEY ?? '';

async function callAnthropicDirect(
  systemPrompt: string,
  userMessage: string
): Promise<string> {
  const res = await fetch('https://api.anthropic.com/v1/messages', {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      'x-api-key': ANTHROPIC_KEY,
      'anthropic-version': '2023-06-01',
      'anthropic-dangerous-direct-browser-access': 'true',
    },
    body: JSON.stringify({
      model: 'claude-sonnet-4-20250514',
      max_tokens: 4096,
      system: systemPrompt,
      messages: [{ role: 'user', content: userMessage }],
    }),
  });

  if (!res.ok) {
    const errBody = await res.text();
    throw new Error(`Anthropic API ${res.status}: ${errBody}`);
  }

  const json = await res.json();
  const textBlock = json.content?.find((b: { type: string }) => b.type === 'text');
  return textBlock?.text ?? '';
}

// ---------------------------------------------------------------------------
// callClaude — try Supabase edge function, fall back to direct API
// ---------------------------------------------------------------------------

export async function callClaude(
  systemPrompt: string,
  userMessage: string,
  /** If true, this counts as a trip generation (rate-limited) */
  isTripGeneration = false
): Promise<ClaudeResponse> {
  // On web, never use direct API — keys would be bundled and exposed.
  // In dev (native), direct API avoids edge function when not deployed.
  if (Platform.OS !== 'web' && ANTHROPIC_KEY) {
    console.info('[claude] Using direct Anthropic API');
    const content = await callAnthropicDirect(systemPrompt, userMessage);
    return { content, tripsUsed: 0, limit: 99 };
  }

  // Production path — Supabase edge function
  const { data, error } = await supabase.functions.invoke('claude-proxy', {
    body: {
      system: systemPrompt,
      message: userMessage,
      isTripGeneration,
    },
  });

  if (error) {
    const message =
      typeof error === 'object' && 'message' in error
        ? (error as { message: string }).message
        : String(error);
    throw new Error(`Claude proxy error: ${message}`);
  }

  if (data?.code === 'LIMIT_REACHED') {
    throw new TripLimitReachedError(data.tripsUsed ?? 0, data.limit ?? 1);
  }

  if (data?.error) throw new Error(data.error);

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
  vibes: string[];
  travelProfile?: TravelProfile | null;
  weather?: WeatherContext | null;
}): string {
  const vibeList = params.vibes.length > 0 ? params.vibes.join(', ') : 'general sightseeing';

  const lines = [
    `Plan a ${params.days}-day trip to ${params.destination}.`,
    `Budget tier: ${params.budget}.`,
    `Travel vibes: ${vibeList}.`,
  ];

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
  /** Trip start date YYYY-MM-DD — aligns forecast to trip days (default: today) */
  startDate?: string;
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

  const prompt = buildTripPrompt({ ...params, travelProfile: profile, weather: weatherCtx });
  const response = await callClaude(ITINERARY_SYSTEM_PROMPT, prompt, true);

  const itinerary = parseItinerary(response.content);

  return {
    itinerary,
    tripsUsed: response.tripsUsed,
    limit: response.limit,
  };
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
