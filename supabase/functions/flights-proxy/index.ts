// =============================================================================
// ROAM — Flights Proxy Edge Function
// Server-side proxy for Amadeus API (handles OAuth token refresh)
// 30min cache for searches, JWT auth, rate limiting
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
  const allowed = ALLOWED_ORIGINS.includes(origin) ? origin : ALLOWED_ORIGINS[0];
  return {
    "Access-Control-Allow-Origin": allowed,
    "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type",
    "Access-Control-Allow-Methods": "POST, OPTIONS",
  };
}

const SEARCH_CACHE_TTL_MS = 30 * 60 * 1000; // 30 min
const CALENDAR_CACHE_TTL_MS = 24 * 60 * 60 * 1000; // 24 hr
const RATE_LIMIT = 20;
const VALID_ACTIONS = ["search_flights", "price_calendar", "cheapest_dates"] as const;
type FlightsAction = (typeof VALID_ACTIONS)[number];

const AMADEUS_BASE = "https://api.amadeus.com";

// ── Amadeus OAuth token management ──
let cachedToken: { token: string; expiresAt: number } | null = null;

async function getAmadeusToken(): Promise<string | null> {
  if (cachedToken && Date.now() < cachedToken.expiresAt) {
    return cachedToken.token;
  }

  const clientId = Deno.env.get("AMADEUS_CLIENT_ID");
  const clientSecret = Deno.env.get("AMADEUS_CLIENT_SECRET");
  if (!clientId || !clientSecret) return null;

  try {
    const res = await fetch(`${AMADEUS_BASE}/v1/security/oauth2/token`, {
      method: "POST",
      headers: { "Content-Type": "application/x-www-form-urlencoded" },
      body: `grant_type=client_credentials&client_id=${clientId}&client_secret=${clientSecret}`,
    });

    if (!res.ok) return null;
    const data = await res.json();
    cachedToken = {
      token: data.access_token,
      expiresAt: Date.now() + (data.expires_in - 60) * 1000,
    };
    return cachedToken.token;
  } catch {
    return null;
  }
}

Deno.serve(async (req: Request) => {
  const cors = getCorsHeaders(req);
  if (req.method === "OPTIONS") return new Response("ok", { headers: cors });

  try {
    // ── Auth ──
    const authHeader = req.headers.get("Authorization");
    if (!authHeader?.startsWith("Bearer ")) {
      return new Response(JSON.stringify({ error: "Unauthorized" }), {
        status: 401, headers: { ...cors, "Content-Type": "application/json" },
      });
    }

    const jwt = authHeader.replace("Bearer ", "");
    const supabaseUrl = Deno.env.get("SUPABASE_URL")!;
    const supabaseUser = createClient(supabaseUrl, Deno.env.get("SUPABASE_ANON_KEY")!, {
      global: { headers: { Authorization: `Bearer ${jwt}` } },
    });
    const { data: { user }, error: userErr } = await supabaseUser.auth.getUser();
    if (userErr || !user) {
      return new Response(JSON.stringify({ error: "Invalid token" }), {
        status: 401, headers: { ...cors, "Content-Type": "application/json" },
      });
    }

    // ── Rate limit ──
    const supabaseAdmin = createClient(supabaseUrl, Deno.env.get("SUPABASE_SERVICE_ROLE_KEY")!);
    const adminEmails = (Deno.env.get("ADMIN_TEST_EMAILS") ?? "").split(",").map((e) => e.trim().toLowerCase());
    if (!adminEmails.includes(user.email?.toLowerCase() ?? "")) {
      const { data: count } = await supabaseAdmin.rpc("increment_edge_rate_limit", {
        p_user_id: user.id, p_endpoint: "flights-proxy",
      });
      if ((count as number) > RATE_LIMIT) {
        return new Response(JSON.stringify({ error: "Rate limit exceeded" }), {
          status: 429, headers: { ...cors, "Content-Type": "application/json" },
        });
      }
    }

    // ── Amadeus token ──
    const token = await getAmadeusToken();
    if (!token) {
      return new Response(JSON.stringify({ error: "Amadeus not configured" }), {
        status: 503, headers: { ...cors, "Content-Type": "application/json" },
      });
    }

    // ── Parse body ──
    let body: Record<string, unknown>;
    try { body = await req.json(); } catch {
      return new Response(JSON.stringify({ error: "Invalid JSON" }), {
        status: 400, headers: { ...cors, "Content-Type": "application/json" },
      });
    }

    const action = body.action as string;
    const params = body.params as Record<string, unknown> ?? {};
    if (!action || !VALID_ACTIONS.includes(action as FlightsAction)) {
      return new Response(JSON.stringify({ error: `Invalid action. Use: ${VALID_ACTIONS.join(", ")}` }), {
        status: 400, headers: { ...cors, "Content-Type": "application/json" },
      });
    }

    // ── Cache check ──
    const cacheKey = `flights_${action}_${JSON.stringify(params)}`;
    const { data: cached } = await supabaseAdmin
      .from("sonar_cache")
      .select("result, created_at")
      .eq("destination", cacheKey)
      .eq("query_type", "flights")
      .gt("expires_at", new Date().toISOString())
      .single();

    if (cached) {
      return new Response(JSON.stringify({ ...cached.result, cached: true }), {
        headers: { ...cors, "Content-Type": "application/json" },
      });
    }

    const headers = { Authorization: `Bearer ${token}`, "Content-Type": "application/json" };
    let result: unknown;
    let ttl = SEARCH_CACHE_TTL_MS;

    if (action === "search_flights") {
      const { origin, destination, date, passengers } = params as {
        origin: string; destination: string; date: string; passengers?: number;
      };
      const pax = passengers ?? 1;
      const url = `${AMADEUS_BASE}/v2/shopping/flight-offers?originLocationCode=${encodeURIComponent(origin)}&destinationLocationCode=${encodeURIComponent(destination)}&departureDate=${date}&adults=${pax}&max=10&currencyCode=USD`;
      const res = await fetch(url, { headers });
      if (!res.ok) {
        return new Response(JSON.stringify({ error: "Amadeus search failed" }), {
          status: 502, headers: { ...cors, "Content-Type": "application/json" },
        });
      }
      const data = await res.json();
      result = (data.data ?? []).map((offer: any) => {
        const seg = offer.itineraries?.[0]?.segments ?? [];
        const firstSeg = seg[0];
        const lastSeg = seg[seg.length - 1];
        return {
          id: offer.id,
          price: offer.price?.total ?? "0",
          currency: offer.price?.currency ?? "USD",
          airline: firstSeg?.carrierCode ?? "??",
          airlineLogo: null,
          duration: offer.itineraries?.[0]?.duration ?? "",
          stops: Math.max(0, seg.length - 1),
          departureTime: firstSeg?.departure?.at ?? "",
          arrivalTime: lastSeg?.arrival?.at ?? "",
          origin: firstSeg?.departure?.iataCode ?? origin,
          destination: lastSeg?.arrival?.iataCode ?? destination,
          bookingLink: `https://www.google.com/travel/flights?q=flights+from+${origin}+to+${destination}+on+${date}`,
        };
      });
    } else if (action === "price_calendar") {
      const { origin, destination, month } = params as { origin: string; destination: string; month: string };
      // Use flight-dates API for cheapest dates in a month
      const url = `${AMADEUS_BASE}/v1/shopping/flight-dates?origin=${origin}&destination=${destination}&departureDate=${month}-01&oneWay=false&viewBy=DATE`;
      const res = await fetch(url, { headers });
      if (res.ok) {
        const data = await res.json();
        const prices = (data.data ?? []).map((d: any) => d.price?.total ? parseFloat(d.price.total) : 9999);
        const minPrice = Math.min(...prices);
        result = (data.data ?? []).map((d: any) => ({
          date: d.departureDate,
          price: parseFloat(d.price?.total ?? "0"),
          currency: d.price?.currency ?? "USD",
          isLowest: parseFloat(d.price?.total ?? "9999") === minPrice,
        }));
      } else {
        result = [];
      }
      ttl = CALENDAR_CACHE_TTL_MS;
    } else if (action === "cheapest_dates") {
      const { origin, destination } = params as { origin: string; destination: string };
      const url = `${AMADEUS_BASE}/v1/shopping/flight-dates?origin=${origin}&destination=${destination}&oneWay=false&viewBy=DATE`;
      const res = await fetch(url, { headers });
      if (res.ok) {
        const data = await res.json();
        result = (data.data ?? []).slice(0, 10).map((d: any) => ({
          departureDate: d.departureDate,
          returnDate: d.returnDate ?? "",
          price: parseFloat(d.price?.total ?? "0"),
          currency: d.price?.currency ?? "USD",
        }));
      } else {
        result = [];
      }
      ttl = CALENDAR_CACHE_TTL_MS;
    }

    // ── Cache upsert ──
    await supabaseAdmin.from("sonar_cache").upsert({
      destination: cacheKey,
      query_type: "flights",
      result: { data: result },
      expires_at: new Date(Date.now() + ttl).toISOString(),
    }, { onConflict: "destination,query_type" }).catch(() => {});

    return new Response(JSON.stringify({ data: result, cached: false }), {
      headers: { ...cors, "Content-Type": "application/json" },
    });
  } catch (err) {
    console.error("[flights-proxy]", err);
    return new Response(JSON.stringify({ error: "Internal server error" }), {
      status: 500, headers: { ...getCorsHeaders(req), "Content-Type": "application/json" },
    });
  }
});
