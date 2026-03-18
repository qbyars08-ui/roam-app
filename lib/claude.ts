// =============================================================================
// ROAM — Claude AI Integration (via Supabase Edge Function proxy)
// =============================================================================

// Platform import removed — direct API calls eliminated for security
import { supabase } from './supabase';
import { parseItinerary, type Itinerary } from './types/itinerary';
import { type TravelProfile, profileToPromptString } from './types/travel-profile';
import { useAppStore } from './store';
import { getPersonaConfig, type TravelerPersona } from './traveler-persona';
import { type TravelPreference, getPreferencesSummary } from './travel-preferences';

// ---------------------------------------------------------------------------
// System prompts
// ---------------------------------------------------------------------------

export const ITINERARY_SYSTEM_PROMPT = `You are a traveler who has lived in every city you write about. You have strong opinions. You write like a close friend texting honest advice — not a travel website, not a brochure, not a guidebook.

CRITICAL: Respond with ONLY valid JSON. No markdown, no explanation, no extra text.

BANNED WORDS — NEVER use these anywhere in your response (tagline, themes, tips, activity names, anything). If you catch yourself writing any, delete and rewrite:
vibrant, bustling, must-see, hidden gem, local favorite, world-class, iconic, charming, picturesque, unforgettable, breathtaking, stunning, delightful, quaint, unique experience, nestled, boasts, renowned, exquisite, authentic experience, rich history, cultural tapestry

NON-NEGOTIABLE FOR EVERY OUTPUT:
- Neighborhood-level only: use district/neighborhood names (e.g. Shibuya, Le Marais, Canggu, Hongdae), never the city name for locations.
- Specific times: every morning/afternoon/evening has "time" like "6:30 AM" or "2:00 PM", never "morning" or "afternoon".
- Local currency costs: every cost as "$XX (¥X,XXX)" or "$XX (€XX)" or equivalent — both USD and local currency.
- Real transit directions: every transitToNext has line name, direction, exit, duration, and fare in local currency (skip only for evening slot).

JSON schema:

{
  "destination": "City, Country",
  "tagline": "One line that makes someone want to book a flight. Under 10 words. Not generic — reference something only THIS city has. Bad: 'A city of culture and cuisine'. Good: 'Steak for $8. Bookshops open at midnight.'",
  "totalBudget": "$X,XXX",
  "days": [
    {
      "day": 1,
      "theme": "DAY 1 MUST convey arrival + disorientation (the good kind): 'Your First Tokyo Evening' or 'Lost in the Right Direction'. LAST DAY MUST reference leaving: 'One More Morning Before the Flight' or 'The Last Espresso'. MIDDLE DAYS are the heart of the trip — each a narrative chapter, not a category.",
      "morning": {
        "activity": "THE specific thing to do — not 'visit the temple' but 'Senso-ji at 6AM before the tour buses arrive, then walk the empty Nakamise-dori'. Always explain WHY this specific place, not just what it is.",
        "location": "The actual place name locals use",
        "cost": "$XX (¥X,XXX) — always both USD and local currency",
        "tip": "The thing you'd text a friend: 'Order the #3 set, sit at the counter, the guy on the left is the master.' Not 'arrive early for the best experience.' Include what specifically to order.",
        "time": "6:30 AM — exact time, not 'morning'. The time MATTERS.",
        "duration": "90",
        "neighborhood": "Asakusa — neighborhood level, not city level",
        "address": "2-3-1 Asakusa, Taito City, Tokyo 111-0032",
        "transitToNext": "Hibiya Line from Ebisu, 3 stops, Exit 1C, 8 min, ¥168 (~$1.10) — exact line, direction, exit, time, fare"
      },
      "afternoon": { "...same fields, same specificity..." },
      "evening": { "...same fields, same specificity..." },
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

HONEST CROWD INTEL — Tell them when to avoid:
"Skip after 10AM — tour buses arrive." "Go on a Tuesday, never Saturday." "The wait is 45 min on weekends but 5 min on weekdays." Always include this.

COSTS — Always include both USD and local currency: "$12 (¥1,800)" or "$25 (€23)". Travelers need local currency for cash payments.

DAY THEMES — Each day is a chapter in a story, following an emotional arc:
Day 1: arrival + disorientation (the good kind) — "Your First _____ Evening"
Middle days: the heart of the trip — each builds on the last
Last day MUST reference leaving: "One More Morning Before the Flight"

TIPS — The tip field is the most important text in the entire itinerary. It's the thing that makes someone screenshot this and send it to their group chat. Test each tip: "Would a local friend actually say this?" If it sounds like a travel blog, rewrite it. ALWAYS include what specifically to order at restaurants.

REQUIRED: Every morning/afternoon/evening MUST include ALL fields:
  - "time": exact clock time like "6:30 AM". Never "morning" or "afternoon".
  - "duration": minutes as string. Realistic — temple is 60-90min, ramen is 45min, a full market exploration is 180min.
  - "neighborhood": the district locals use. Never the city name.
  - "address": Google Maps-friendly. Real addresses only.
  - "transitToNext": Line name, direction, exit number, walking directions, fare in local currency + USD. Skip for evening (last slot).
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

NEIGHBORHOOD RULE — Never use the city name when you mean a neighborhood.
"Shimokitazawa" not "Tokyo". "Le Marais" not "Paris". "Canggu" not "Bali".
"Trastevere" not "Rome". "Hongdae" not "Seoul". "Kreuzberg" not "Berlin".
Every location, every tip, every transit instruction uses the neighborhood name.
The city name appears once in the destination field. After that: neighborhoods only.

SEASONAL AWARENESS — The current month matters more than anything.
March: cherry blossoms in Japan, shoulder season in Europe, dry season in SE Asia.
Factor in: weather (specific temperatures, rain chance), crowds (high/low season),
events happening NOW, what's blooming/harvesting, sunset times, daylight hours.
If it's March and you're recommending Tokyo: "Ueno Park cherry blossoms peak
mid-March to early April — go at 6AM before the blue tarps claim every spot."
If it's August and you're recommending Bangkok: "It rains every afternoon at 3PM.
Plan indoor activities 2-5PM. The rain stops and the city smells incredible."
Never give season-blind recommendations.

BUDGET PERSONALITY — The budget changes how you talk, not just what you recommend.
The budget tier should be obvious from the VOICE alone, not just the prices.

$0-1500 total trip: Hostel voice. Street food focus. Free activities. Local transport only.
  "This hostel in Yanaka is ¥2,800/night and the owner makes you breakfast."
  "The free walking tour from Ueno at 10AM is better than any paid one."
  "You don't need money for this — the best views in the city are all free."

$1500-3000 total trip: Mid-range. Mix of experiences. Occasional splurge with a reason.
  "Upgrade to the river view room — it's $30 more and the reason you came."
  "Save on lunch (konbini onigiri, seriously good) so you can splurge on this dinner."

$3000-6000 total trip: Quality focus. Fewer activities but each one exceptional.
  "Skip the crowded spots. You're here for three things done well, not twelve done fast."
  "This restaurant only seats 8 people. Book it. Cancel everything else if you have to."

$6000+ total trip: No compromises. Specific luxury recs. Private options where they add real value.
  "The Trunk Hotel in Shibuya is worth every yen — the rooftop at sunset is the view nobody talks about."
  "Book the omakase at Den. It's ¥35,000 and it will be the best meal of your life."
  "Private car to Kamakura. Yes it costs more. You won't spend 90 minutes standing on a train."

TRAVEL STYLE VOICE — Who you're traveling with changes everything, including how you write.

Solo: Use "you" not "we." Lean into the solo advantage.
  "You'll naturally meet people at the hostel bar around 9PM."
  "The solo advantage here is sitting at the counter — you'll end up talking to the chef."
  "Table for one. Counter seat. You'll get served first and leave with a story."
  "This neighborhood is safe to walk alone at 2AM."

Couple: Slow down the pacing. Emphasize moments, not checkboxes.
  "This is where you'll want to slow down and just sit."
  "Better than it sounds on paper because the light at this hour makes everything look like a film."
  "Skip the group tour. Do this one alone together."
  "Book a table by the window. Trust me on this one."

Group (3-6): Split costs, shared experiences, logistics matter.
  "Split 4 ways this becomes $12 each."
  "The group dynamic actually helps here — sharing plates is the entire point."
  "Get the sharing plates. Order everything. Fight over the last piece."
  "This rooftop fits your whole crew and the sunset is free."

Large group (7+): Logistics are the trip. Plan around them.
  "Book ahead. They can't seat you without a reservation this size."
  "Split into two taxis — it's cheaper than waiting for a van."
  "The group rate at this museum saves ¥800/person — ask at the counter."

SPATIAL INTELLIGENCE — The "Hokkaido Problem" (CRITICAL):
Never schedule activities that are geographically impossible in sequence. Rules:
- ALL activities within a single day MUST be in the same city/district or reachable within 30 minutes by the transit mode available in that destination.
- If a destination has multiple areas (e.g., Kyoto temples are spread across the city), group activities by neighborhood per day, not randomly.
- "transitToNext" MUST reflect a REAL, feasible route — not a fantasy. If it takes 3 hours by train, it cannot be a morning→afternoon transition. Schedule it across different days instead.
- If suggesting a day trip to a nearby area (e.g., Kamakura from Tokyo, Sintra from Lisbon), the ENTIRE day should be dedicated to that trip. Do not mix a day trip with activities back in the main city.
- Before finalizing each day, mentally verify: "Can a person physically get from Activity A to Activity B in the time between them?" If not, restructure.
- The "routeSummary" field should show neighborhoods flowing geographically, not zigzagging across the city.`;

// ---------------------------------------------------------------------------
// SPARK mode — fast, opinionated, one shot. "Trust me."
// ---------------------------------------------------------------------------
export const SPARK_SYSTEM_PROMPT = ITINERARY_SYSTEM_PROMPT;

// ---------------------------------------------------------------------------
// CRAFT mode — deeply personalized from full conversation context
// ---------------------------------------------------------------------------
export const CRAFT_SYSTEM_PROMPT = `You are building a completely personalized trip for a specific person. You have their exact preferences, budget, travel style, and what would make this trip perfect for them.

This is NOT a generic itinerary. Every single recommendation is chosen specifically for this person.

If they want business class: Find the best value business class option for their route and dates. Specific airline. Specific reason why. What to look for when booking.

If they have a tight budget: Every dollar accounted for. Where to splurge (worth it). Where to save (doesn't matter). Honest about tradeoffs.

If they're traveling with family: Every activity works for everyone. Logistics thought through. Backup plans included.

If they're solo: Specific advice for solo travelers. Where to meet people. Where to go alone. Safety specific to this person.

The output should feel like it was written by someone who knows them. Not a template. A plan.

CRITICAL: Respond with ONLY valid JSON. No markdown, no explanation, no extra text.

Use the same JSON schema as the main itinerary (destination, tagline, totalBudget, days array with morning/afternoon/evening, accommodation, dailyCost, routeSummary, budgetBreakdown, packingEssentials, proTip, visaInfo).

DAY THEMES: Reference something specific they said. Examples: "Day 3 — The temple morning you asked for", "Day 5 — Business class home. You earned it."

FLIGHT SECTION: If they asked about flights, include a specific recommendation in your response before the JSON: airline, route, why, where to book, price range. Then output the full JSON.

HOTEL: Not just a name. A reason tied to what they said (e.g. "you said design matters — this is the best design hotel in Tokyo under $300/night").

BUDGET BREAKDOWN: Line by line. Flights, hotel, daily spending, activities, buffer, total, remaining from their budget. Feels like a financial plan.`;

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
// CRAFT follow-up — refine itinerary through conversation (no JSON)
// ---------------------------------------------------------------------------
export const CRAFT_FOLLOW_UP_SYSTEM = `You are ROAM. The user has a personalized trip itinerary and is chatting with you. You have FULL context: the full itinerary (destination, days, every activity with times, neighborhoods, costs, transit, tips) plus the planning conversation. They can ask anything: changes, more details, alternatives, flights, hotels, food, timing, or general questions.

RESPONSE FORMAT:
1. Always start with a plain language explanation of what you changed or your answer. Be specific and actionable.
2. If the user's request modifies the itinerary (changing activities, adding restaurants, swapping days, adjusting budget, etc.), you MUST include the COMPLETE updated itinerary as a JSON block at the END of your response, wrapped in <itinerary_json>...</itinerary_json> tags. Use the exact same JSON schema as the original itinerary (destination, tagline, totalBudget, days, budgetBreakdown, packingEssentials, proTip, visaInfo). Output the FULL itinerary, not just the changed parts.
3. If the user is asking a question that does NOT change the itinerary (general advice, flight tips, "tell me more", etc.), do NOT include the JSON block — just answer in plain text.

Guidelines:
- If they want a cheaper hotel: suggest alternatives and update the itinerary JSON with the new accommodation.
- If they want more food: add specific restaurants and update the itinerary JSON with the new activities.
- If they want less walking: adjust transport/order and update the itinerary JSON.
- If they ask about flights/cabin: give a recommendation (no itinerary change needed).
- If they ask "what else" or "tell me more": add detail, alternatives, or pro tips (no itinerary change needed).

Keep the plain language part under 200 words. Sound like a travel planner who has the full context. Never use emojis. Conversation can continue indefinitely — answer each message with full context.`;

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

  console.log('[ROAM] ensureValidSession: needsUpgrade=', needsUpgrade, 'hasSession=', !!session, 'hasToken=', !!session?.access_token);

  if (!needsUpgrade) {
    // Even if we have a token, check if it's expired and refresh
    const { data: { session: refreshed } } = await supabase.auth.getSession();
    if (refreshed && refreshed.access_token !== session?.access_token) {
      console.log('[ROAM] Session refreshed');
      useAppStore.getState().setSession(refreshed);
    }
    return;
  }

  // Try up to 2 times to get a real anonymous session
  for (let attempt = 1; attempt <= 2; attempt++) {
    try {
      console.log('[ROAM] Upgrading to anonymous session (attempt', attempt, ')...');
      const { data, error } = await supabase.auth.signInAnonymously();
      if (!error && data.session) {
        console.log('[ROAM] Anonymous session created, userId=', data.session.user.id);
        useAppStore.getState().setSession(data.session);
        return; // Success
      }
      if (error) {
        console.error('[ROAM] Anonymous auth error (attempt', attempt, '):', error.message);
      }
    } catch (err) {
      console.error('[ROAM] Anonymous auth threw (attempt', attempt, '):', err instanceof Error ? err.message : String(err));
    }

    // Brief pause before retry
    if (attempt < 2) {
      await new Promise((r) => setTimeout(r, 500));
    }
  }

  // Both attempts failed — check if Supabase already has a session we can use
  const { data: { session: existing } } = await supabase.auth.getSession();
  if (existing?.access_token) {
    console.log('[ROAM] Found existing Supabase session, using that');
    useAppStore.getState().setSession(existing);
    return;
  }

  // Truly no auth available — throw so the caller shows a real error
  throw new Error('Unable to authenticate. Check your internet connection and try again.');
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
    console.log('[ROAM] callClaudeWithMessages: invoking claude-proxy, msgs=', messages.length, 'isTripGen=', isTripGeneration);
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
    console.log('[ROAM] callClaudeWithMessages: result.data type=', typeof data, 'result.error=', error ? String(error) : 'none');
    if (data && typeof data === 'object') {
      console.log('[ROAM] callClaudeWithMessages: data keys=', Object.keys(data as Record<string, unknown>));
    } else if (data) {
      console.log('[ROAM] callClaudeWithMessages: raw data=', String(data).slice(0, 200));
    }
  } catch (invokeErr) {
    clearTimeout(timeoutId);
    console.error('[ROAM] callClaudeWithMessages invoke threw:', invokeErr instanceof Error ? invokeErr.message : String(invokeErr));
    throw invokeErr;
  } finally {
    clearTimeout(timeoutId);
  }

  if (error) {
    const msg = typeof error === 'object' && 'message' in error ? (error as { message: string }).message : String(error);
    console.error('[ROAM] callClaudeWithMessages proxy error:', msg);
    throw new Error(`Claude proxy error: ${msg}`);
  }
  if (data?.code === 'LIMIT_REACHED') {
    throw new TripLimitReachedError((data.tripsUsed as number) ?? 0, (data.limit as number) ?? 1);
  }
  if (data?.error) {
    console.error('[ROAM] callClaudeWithMessages data.error:', String(data.error));
    throw new Error(String(data.error));
  }

  // Handle case where data is a string (some SDK versions return unparsed JSON)
  if (typeof data === 'string') {
    const rawStr = data as unknown as string;
    try {
      data = JSON.parse(rawStr) as Record<string, unknown>;
      console.log('[ROAM] callClaudeWithMessages: parsed string data, keys=', Object.keys(data));
    } catch {
      console.error('[ROAM] callClaudeWithMessages: data is non-JSON string:', rawStr.slice(0, 200));
      throw new Error('Invalid response format from Claude proxy');
    }
  }

  if (!data) {
    console.error('[ROAM] callClaudeWithMessages: data is null/undefined');
    throw new Error('No response from Claude proxy');
  }

  const content = (data as Record<string, unknown>).content;
  if (!content || typeof content !== 'string') {
    console.error('[ROAM] callClaudeWithMessages: missing content field. data=', JSON.stringify(data).slice(0, 300));
    throw new Error('No content in Claude proxy response');
  }

  return {
    content: content as string,
    tripsUsed: ((data as Record<string, unknown>).tripsUsed as number) ?? 0,
    limit: ((data as Record<string, unknown>).limit as number) ?? 1,
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
// callClaudeStreamingWithMessages — SSE streaming with multi-turn messages
// Used for follow-up conversations where we need streaming responses.
// ---------------------------------------------------------------------------

export async function callClaudeStreamingWithMessages(
  systemPrompt: string,
  messages: Array<{ role: 'user' | 'assistant'; content: string }>,
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
        messages: messages.map((m) => ({ role: m.role, content: m.content })),
        isTripGeneration: false,
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
// generateCraftItineraryStreaming — CRAFT mode: full conversation context → personalized itinerary
// ---------------------------------------------------------------------------
export async function generateCraftItineraryStreaming(
  contextBlock: string,
  callbacks: StreamingCallbacks
): Promise<void> {
  const userMessage = `${contextBlock}\n\nGenerate the complete itinerary as valid JSON only. Use the exact schema: destination, tagline, totalBudget, days (each with day, theme, morning, afternoon, evening, accommodation, dailyCost, routeSummary), budgetBreakdown, packingEssentials, proTip, visaInfo.`;
  return callClaudeStreaming(CRAFT_SYSTEM_PROMPT, userMessage, callbacks);
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
  travelerPersona?: TravelerPersona | null;
  travelPreferences?: readonly TravelPreference[] | null;
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

  // Inject traveler persona if available
  if (params.travelerPersona) {
    const personaCfg = getPersonaConfig(params.travelerPersona);
    lines.push('');
    lines.push('--- TRAVELER PERSONA (override all defaults with this persona) ---');
    lines.push(personaCfg.itineraryPromptModifier);
    lines.push('---');
  }

  // Inject travel profile if available
  if (params.travelProfile) {
    lines.push('');
    lines.push('--- TRAVELER PROFILE (personalize every recommendation to this) ---');
    lines.push(profileToPromptString(params.travelProfile));
    lines.push('---');
  }

  // Inject learned travel preferences from CRAFT sessions
  if (params.travelPreferences && params.travelPreferences.length > 0) {
    const prefsSummary = getPreferencesSummary(params.travelPreferences);
    if (prefsSummary) {
      lines.push('');
      lines.push('--- LEARNED PREFERENCES (from previous trip planning sessions) ---');
      lines.push(prefsSummary);
      lines.push('Use these as defaults unless the user explicitly overrides them in this session.');
      lines.push('---');
    }
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
  travelerPersona?: TravelerPersona | null;
}): Promise<{ itinerary: Itinerary; tripsUsed: number; limit: number }> {
  // Auto-inject travel profile from store if not explicitly provided
  const profile = params.travelProfile ?? (
    useAppStore.getState().hasCompletedProfile
      ? useAppStore.getState().travelProfile
      : null
  );
  // Auto-inject persona from store if not explicitly provided
  const persona = params.travelerPersona ?? useAppStore.getState().travelerPersona ?? null;

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
    travelerPersona: persona,
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
  travelerPersona?: TravelerPersona | null;
  onProgress?: (info: { daysFound: number; totalDays: number; text: string }) => void;
}): Promise<{ itinerary: Itinerary; tripsUsed: number; limit: number }> {
  const profile = params.travelProfile ?? (
    useAppStore.getState().hasCompletedProfile
      ? useAppStore.getState().travelProfile
      : null
  );
  // Auto-inject persona from store if not explicitly provided
  const persona = params.travelerPersona ?? useAppStore.getState().travelerPersona ?? null;

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
    travelerPersona: persona,
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
          // Reject clearly when stream returned non-JSON or refusal (e.g. "Sorry, I cannot help with that.")
          const trimmed = fullText?.trim() ?? '';
          if (trimmed.length < 200) {
            reject(new Error('The trip came back too short — try again and we\'ll build a full itinerary.'));
            return;
          }
          const looksLikeRefusal = /^(Sorry|I cannot|I can't|I'm unable)/i.test(trimmed);
          if (looksLikeRefusal) {
            reject(new Error('We couldn\'t generate that trip this time. Try again or tweak your destination or dates.'));
            return;
          }
          const afterFence = trimmed.replace(/^```(?:json)?\s*\n?/i, '').trim();
          if (!afterFence.startsWith('{')) {
            reject(new Error('The trip didn\'t come back in the right format. One more try usually fixes it.'));
            return;
          }
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
