// =============================================================================
// ROAM — Sonar Proxy Edge Function
// Perplexity Sonar live travel intelligence with server-side cache (6hr TTL)
// =============================================================================
import { createClient } from "https://esm.sh/@supabase/supabase-js@2.43.4";

const ALLOWED_ORIGINS = [
  "https://roamapp.app",
  "https://roamtravel.app",
  "http://localhost:8081",
  "http://localhost:19006",
];

function getCorsHeaders(req: Request) {
  const origin = req.headers.get("origin") ?? "";
  const allowedOrigin = ALLOWED_ORIGINS.includes(origin) ? origin : ALLOWED_ORIGINS[0];
  return {
    "Access-Control-Allow-Origin": allowedOrigin,
    "Access-Control-Allow-Headers":
      "authorization, x-client-info, apikey, content-type",
    "Access-Control-Allow-Methods": "POST, OPTIONS",
  };
}

const MAX_DESTINATION_LENGTH = 200;
const CACHE_TTL_MS = 6 * 60 * 60 * 1000; // 6 hours
const RATE_LIMIT_PER_MINUTE = 20;

const VALID_QUERY_TYPES = [
  "urgent",
  "pulse",
  "prep",
  "events",
  "safety",
  "flights",
  "food",
  "local",
  "health",
  "hostels",
  "local_eats",
  "safety_detail",
  "meetups",
] as const;

type SonarQueryType = (typeof VALID_QUERY_TYPES)[number];

// ---------------------------------------------------------------------------
// Query templates — destination-specific prompts for each query type
// ---------------------------------------------------------------------------
function buildQuery(
  destination: string,
  queryType: SonarQueryType,
  context?: { dates?: string; budget?: string; personaModifier?: string }
): { system: string; user: string } {
  const dateCtx = context?.dates ? ` Travel dates: ${context.dates}.` : "";
  const budgetCtx = context?.budget ? ` Budget: ${context.budget}.` : "";
  const personaCtx = context?.personaModifier
    ? ` Traveler persona context: ${context.personaModifier}`
    : "";
  const extra = dateCtx + budgetCtx + personaCtx;

  const templates: Record<SonarQueryType, { system: string; user: string }> = {
    urgent: {
      system:
        "You are a travel urgency agent. Reply with exactly ONE short sentence (under 15 words) that a traveler to this destination needs to know right now. Examples: 'Cherry blossoms peak this week in Tokyo.' or 'Heavy rain expected Thursday in Barcelona.' No bullet points, no preamble, no quotes.",
      user: `What is the one most urgent or timely thing a traveler should know about ${destination} right now? Reply with only one short sentence.`,
    },
    pulse: {
      system:
        "You are a real-time travel intelligence agent. Give current, specific information about what is happening at a destination RIGHT NOW. Include weather, events, crowd levels, and anything a traveler should know today. Be specific with names, dates, and details. Keep it concise — 3-5 bullet points max.",
      user: `What is happening in ${destination} right now? Include current weather, any events or festivals this week, crowd conditions, and anything a traveler arriving today should know.${extra}`,
    },
    prep: {
      system:
        "You are a pre-departure travel intelligence agent. Provide current, actionable preparation advice for an upcoming trip. Focus on things that change — visa updates, health advisories, currency tips, local customs to know, current scams to avoid. Not evergreen generic advice.",
      user: `What does a traveler need to know before visiting ${destination} right now? Current visa situation, health advisories, things that have changed recently, active scams, and practical prep tips.${extra}`,
    },
    events: {
      system:
        "You are a live events intelligence agent. Find specific events, festivals, concerts, exhibitions, and happenings at a destination in the next 2 weeks. Include exact dates, venues, ticket info where available. Only include confirmed events.",
      user: `What specific events, festivals, exhibitions, concerts, or happenings are taking place in ${destination} in the next 2 weeks? Include exact dates, venues, and any ticket or reservation info.${extra}`,
    },
    safety: {
      system:
        "You are a travel safety intelligence agent. Provide current safety information — not generic 'be careful' advice. Include specific neighborhoods to avoid at night, current protest activity, recent incidents travelers should know about, and any active advisories.",
      user: `What is the current safety situation in ${destination}? Specific neighborhoods to be cautious in, any recent incidents, protest activity, active travel advisories, and practical safety tips for right now.${extra}`,
    },
    flights: {
      system:
        "You are a flight deal intelligence agent. Find current flight pricing trends, deals, and booking tips for a destination. Include specific airlines, approximate prices, best booking windows, and any current promotions.",
      user: `What are the current flight deals and pricing trends for flights to ${destination}? Best airlines for this route, approximate prices, any current sales or promotions, and smart booking tips.${extra}`,
    },
    food: {
      system:
        "You are a live food intelligence agent. Find what is genuinely trending in a destination's food scene RIGHT NOW — new openings, seasonal dishes, restaurants with current buzz. Not evergreen 'top 10' lists from 2023.",
      user: `What is happening in ${destination}'s food scene right now? New restaurant openings, seasonal dishes available this month, places with current buzz, and any food events or markets happening.${extra}`,
    },
    local: {
      system:
        "You are a local intelligence agent. Provide the kind of tips only someone living in a city would know — current local sentiment, neighborhoods changing, new spots locals love, things tourists always get wrong. Be opinionated.",
      user: `What would a local in ${destination} want a visitor to know right now? Local-only tips, neighborhoods worth exploring, things tourists always get wrong, and current local sentiment about tourism.${extra}`,
    },
    health: {
      system:
        "You are a travel health intelligence agent. Provide practical, specific health information for travelers visiting a destination. Cover: (1) tap water safety — is it safe to drink? (2) required and recommended vaccines with timing e.g. '4 weeks before travel', (3) food safety rules specific to this destination, (4) any current health advisories or disease outbreaks. Be specific and actionable. No generic advice. Format as short, clear bullet points per section.",
      user: `What are the current health and safety considerations for travelers visiting ${destination}? Cover tap water safety, required/recommended vaccines with timing, food safety rules, and any active health advisories.${extra}`,
    },
    hostels: {
      system:
        "You are a hostel intelligence agent for solo travelers. Find the best hostels in a destination specifically for meeting people and social experiences. Include specific hostel names, approximate price per night, social atmosphere rating, neighborhood location, and what makes each great for solo travelers wanting to meet other travelers. Focus on hostels with legendary common areas, organized events, rooftop bars, or strong social culture.",
      user: `What are the best hostels in ${destination} for solo travelers who want to meet people? Include: hostel name, approximate price per night, social rating (how good for meeting people), neighborhood/location, and what specifically makes it great for solo travelers. Focus on places with great common areas and social atmosphere.${extra}`,
    },
    local_eats: {
      system:
        "You are a local food intelligence agent. Find authentic local food that residents actually eat — not tourist restaurants. Be specific about dishes, neighborhoods, and why locals go there. Include street food, market stalls, and family-run spots that tourists rarely find. Avoid any chain restaurants or tourist-facing establishments.",
      user: `What do locals in ${destination} actually eat? Give me authentic local food spots that tourists miss. Include: specific dish names, neighborhood where to find it, price range, and why locals go there instead of tourist places. Focus on street food, market stalls, and family-run restaurants.${extra}`,
    },
    safety_detail: {
      system:
        "You are a detailed travel safety intelligence agent. Provide specific, actionable safety information for travelers. Be direct about which neighborhoods are safe vs risky at night, specific common scams with how they work and how to avoid them, emergency numbers, what to actually do if robbed, and which transportation options are safe vs unsafe. Do not give vague generic advice — be specific about areas, times, and tactics.",
      user: `Give me detailed safety information for ${destination}. Include: which specific neighborhoods are safe at night vs which to avoid, the most common scams tourists fall for and exactly how they work, local emergency numbers (police, ambulance, fire), what to do step-by-step if you get robbed, and which transportation options (taxi, rideshare, local bus) are safe and which to avoid.${extra}`,
    },
    meetups: {
      system:
        "You are a solo traveler social events intelligence agent. Find current meetups, social events, and group activities specifically for travelers in a destination this week. Focus on events where solo travelers can meet other travelers. Include hostel events, pub crawls, walking tours, language exchanges, and coworking meetups. Provide specific names, dates, venues, and prices where available.",
      user: `What are the current meetups, social events, and group activities for travelers in ${destination} this week? Include: hostel events, pub crawls, walking tours, language exchanges, coworking meetups, and any group activities where solo travelers can meet other travelers. Be specific with names, dates, venues, and prices.${extra}`,
    },
  };

  return templates[queryType];
}

// ---------------------------------------------------------------------------
// Parse citations from Perplexity response
// ---------------------------------------------------------------------------
interface PerplexityCitation {
  url: string;
  title?: string;
}

function parseCitations(
  citations: PerplexityCitation[] | undefined
): Array<{ url: string; domain: string; title?: string }> {
  if (!citations || !Array.isArray(citations)) return [];
  return citations.slice(0, 5).map((c) => {
    let domain = "";
    try {
      domain = new URL(c.url).hostname.replace(/^www\./, "");
    } catch {
      domain = c.url;
    }
    return { url: c.url, domain, title: c.title };
  });
}

// ---------------------------------------------------------------------------
// Main handler
// ---------------------------------------------------------------------------
Deno.serve(async (req: Request) => {
  const corsHeaders = getCorsHeaders(req);

  if (req.method === "OPTIONS") {
    return new Response("ok", { headers: corsHeaders });
  }

  try {
    // ── Auth: verify JWT via Supabase ──────────────────────────────────
    const authHeader = req.headers.get("Authorization");
    if (!authHeader || !authHeader.startsWith("Bearer ")) {
      return new Response(
        JSON.stringify({ error: "Missing or invalid Authorization header" }),
        {
          status: 401,
          headers: { ...corsHeaders, "Content-Type": "application/json" },
        }
      );
    }

    const jwt = authHeader.replace("Bearer ", "");
    const supabaseUrl = Deno.env.get("SUPABASE_URL")!;
    const supabaseAnonKey = Deno.env.get("SUPABASE_ANON_KEY")!;

    const supabaseUser = createClient(supabaseUrl, supabaseAnonKey, {
      global: { headers: { Authorization: `Bearer ${jwt}` } },
    });

    const {
      data: { user },
      error: userError,
    } = await supabaseUser.auth.getUser();
    if (userError || !user) {
      return new Response(
        JSON.stringify({ error: "Invalid or expired token" }),
        {
          status: 401,
          headers: { ...corsHeaders, "Content-Type": "application/json" },
        }
      );
    }

    // ── Rate limit: 20 req/min per user ─────────────────────────────────
    const supabaseAdmin = createClient(
      supabaseUrl,
      Deno.env.get("SUPABASE_SERVICE_ROLE_KEY")!
    );

    // Admin bypass
    const adminEmails = (Deno.env.get("ADMIN_TEST_EMAILS") ?? "")
      .split(",")
      .map((e) => e.trim().toLowerCase());
    const isAdmin = adminEmails.includes(user.email?.toLowerCase() ?? "");

    if (!isAdmin) {
      const { data: count } = await supabaseAdmin.rpc(
        "increment_edge_rate_limit",
        {
          p_user_id: user.id,
          p_endpoint: "sonar-proxy",
        }
      );
      if ((count as number) > RATE_LIMIT_PER_MINUTE) {
        return new Response(
          JSON.stringify({
            error: "Rate limit exceeded. Try again in a minute.",
          }),
          {
            status: 429,
            headers: { ...corsHeaders, "Content-Type": "application/json" },
          }
        );
      }
    }

    // ── Validate Perplexity API key ─────────────────────────────────────
    const perplexityKey = Deno.env.get("PERPLEXITY_API_KEY");
    if (!perplexityKey) {
      return new Response(
        JSON.stringify({ error: "Sonar service unavailable" }),
        {
          status: 503,
          headers: { ...corsHeaders, "Content-Type": "application/json" },
        }
      );
    }

    // ── Parse + validate body ───────────────────────────────────────────
    let body: Record<string, unknown>;
    try {
      body = await req.json();
    } catch {
      return new Response(JSON.stringify({ error: "Invalid JSON body" }), {
        status: 400,
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }

    const destination = body.destination as string | undefined;
    if (
      !destination ||
      typeof destination !== "string" ||
      destination.length > MAX_DESTINATION_LENGTH
    ) {
      return new Response(
        JSON.stringify({ error: "destination is required (max 200 chars)" }),
        {
          status: 400,
          headers: { ...corsHeaders, "Content-Type": "application/json" },
        }
      );
    }

    const queryType = body.queryType as string | undefined;
    if (
      !queryType ||
      !VALID_QUERY_TYPES.includes(queryType as SonarQueryType)
    ) {
      return new Response(
        JSON.stringify({
          error: `queryType must be one of: ${VALID_QUERY_TYPES.join(", ")}`,
        }),
        {
          status: 400,
          headers: { ...corsHeaders, "Content-Type": "application/json" },
        }
      );
    }

    const context = body.context as
      | { dates?: string; budget?: string; personaModifier?: string }
      | undefined;

    // ── Cache check ─────────────────────────────────────────────────────
    const destKey = destination.toLowerCase().trim();
    const { data: cached } = await supabaseAdmin
      .from("sonar_cache")
      .select("result, created_at")
      .eq("destination", destKey)
      .eq("query_type", queryType)
      .gt("expires_at", new Date().toISOString())
      .single();

    if (cached) {
      return new Response(
        JSON.stringify({
          ...cached.result,
          isLive: false,
          cachedAt: cached.created_at,
        }),
        {
          headers: { ...corsHeaders, "Content-Type": "application/json" },
        }
      );
    }

    // ── Build query + call Perplexity Sonar ─────────────────────────────
    const { system: systemPrompt, user: userQuery } = buildQuery(
      destination,
      queryType as SonarQueryType,
      context
    );

    const perplexityRes = await fetch(
      "https://api.perplexity.ai/chat/completions",
      {
        method: "POST",
        headers: {
          Authorization: `Bearer ${perplexityKey}`,
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          model: "sonar",
          messages: [
            { role: "system", content: systemPrompt },
            { role: "user", content: userQuery },
          ],
          return_citations: true,
          return_images: false,
          search_recency_filter: "week",
        }),
      }
    );

    if (!perplexityRes.ok) {
      const errText = await perplexityRes.text().catch(() => "Unknown error");
      console.error(
        `[sonar-proxy] Perplexity API error ${perplexityRes.status}: ${errText}`
      );
      return new Response(
        JSON.stringify({ error: "Sonar query failed" }),
        {
          status: 502,
          headers: { ...corsHeaders, "Content-Type": "application/json" },
        }
      );
    }

    const perplexityData = await perplexityRes.json();
    const answer =
      perplexityData.choices?.[0]?.message?.content ?? "No results found.";
    const rawCitations = perplexityData.citations ?? [];
    const citations = parseCitations(rawCitations);
    const now = new Date().toISOString();

    const result = {
      answer,
      citations,
      destination,
      queryType,
      timestamp: now,
      isLive: true,
    };

    // ── Cache upsert ────────────────────────────────────────────────────
    await supabaseAdmin
      .from("sonar_cache")
      .upsert(
        {
          destination: destKey,
          query_type: queryType,
          result,
          expires_at: new Date(Date.now() + CACHE_TTL_MS).toISOString(),
        },
        { onConflict: "destination,query_type" }
      )
      .then(() => {})
      .catch((err: unknown) => {
        console.error("[sonar-proxy] Cache upsert failed:", err);
      });

    return new Response(JSON.stringify(result), {
      headers: { ...corsHeaders, "Content-Type": "application/json" },
    });
  } catch (err) {
    console.error("[sonar-proxy] Unhandled error:", err);
    return new Response(
      JSON.stringify({ error: "Internal server error" }),
      {
        status: 500,
        headers: {
          ...getCorsHeaders(req),
          "Content-Type": "application/json",
        },
      }
    );
  }
});
