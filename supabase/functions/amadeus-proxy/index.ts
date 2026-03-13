// =============================================================================
// ROAM — Amadeus Flight Search Proxy
// Keeps API_KEY + API_SECRET server-side. Client sends JWT + search params.
// =============================================================================
import { createClient } from "https://esm.sh/@supabase/supabase-js@2";

const ALLOWED_ORIGINS = [
  "https://tryroam.netlify.app",
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

const AMADEUS_BASE = "https://test.api.amadeus.com";

// ---------------------------------------------------------------------------
// Amadeus OAuth — cached in memory (edge function warm instances reuse this)
// ---------------------------------------------------------------------------
let cachedToken: { access_token: string; expires_at: number } | null = null;

async function getAmadeusToken(): Promise<string> {
  const key = Deno.env.get("AMADEUS_KEY");
  const secret = Deno.env.get("AMADEUS_SECRET");

  if (!key || !secret) {
    throw new Error("Amadeus credentials not configured on server");
  }

  // Return cached token if still valid (with 60s buffer)
  if (cachedToken && cachedToken.expires_at > Date.now() + 60_000) {
    return cachedToken.access_token;
  }

  const res = await fetch(`${AMADEUS_BASE}/v1/security/oauth2/token`, {
    method: "POST",
    headers: { "Content-Type": "application/x-www-form-urlencoded" },
    body: `grant_type=client_credentials&client_id=${key}&client_secret=${secret}`,
  });

  if (!res.ok) {
    throw new Error(`Amadeus OAuth failed: ${res.status}`);
  }

  const data = await res.json();
  cachedToken = {
    access_token: data.access_token,
    expires_at: Date.now() + data.expires_in * 1000,
  };

  return cachedToken.access_token;
}

// ---------------------------------------------------------------------------
// Input validation
// ---------------------------------------------------------------------------
const IATA_RE = /^[A-Z]{3}$/;
const DATE_RE = /^\d{4}-\d{2}-\d{2}$/;

function validateSearchParams(body: Record<string, unknown>): {
  origin: string;
  destination: string;
  departureDate: string;
  returnDate: string;
  adults: number;
  maxOffers: number;
} {
  const origin = String(body.origin ?? "").toUpperCase().trim();
  const destination = String(body.destination ?? "").toUpperCase().trim();
  const departureDate = String(body.departureDate ?? "");
  const returnDate = String(body.returnDate ?? "");
  const adults = Math.min(Math.max(Number(body.adults) || 1, 1), 9);
  const maxOffers = Math.min(Math.max(Number(body.maxOffers) || 5, 1), 20);

  if (!IATA_RE.test(origin)) throw new Error("Invalid origin IATA code");
  if (!IATA_RE.test(destination)) throw new Error("Invalid destination IATA code");
  if (!DATE_RE.test(departureDate)) throw new Error("Invalid departure date");
  if (!DATE_RE.test(returnDate)) throw new Error("Invalid return date");

  return { origin, destination, departureDate, returnDate, adults, maxOffers };
}

// ---------------------------------------------------------------------------
// Handler
// ---------------------------------------------------------------------------
Deno.serve(async (req: Request) => {
  const corsHeaders = getCorsHeaders(req);

  if (req.method === "OPTIONS") {
    return new Response("ok", { headers: corsHeaders });
  }

  try {
    // ── Auth: verify JWT ──
    const authHeader = req.headers.get("authorization");
    if (!authHeader) {
      return new Response(
        JSON.stringify({ error: "Missing authorization header" }),
        { status: 401, headers: { ...corsHeaders, "Content-Type": "application/json" } },
      );
    }

    const supabaseUrl = Deno.env.get("SUPABASE_URL") ?? "";
    const supabaseAnonKey = Deno.env.get("SUPABASE_ANON_KEY") ?? "";
    const supabase = createClient(supabaseUrl, supabaseAnonKey, {
      global: { headers: { Authorization: authHeader } },
    });

    const { data: { user }, error: authError } = await supabase.auth.getUser();
    if (authError || !user) {
      return new Response(
        JSON.stringify({ error: "Unauthorized" }),
        { status: 401, headers: { ...corsHeaders, "Content-Type": "application/json" } },
      );
    }

    // ── Parse + validate params ──
    const body = await req.json();
    const params = validateSearchParams(body);

    // ── Get Amadeus token + search ──
    const token = await getAmadeusToken();

    const url = new URL(`${AMADEUS_BASE}/v2/shopping/flight-offers`);
    url.searchParams.set("originLocationCode", params.origin);
    url.searchParams.set("destinationLocationCode", params.destination);
    url.searchParams.set("departureDate", params.departureDate);
    url.searchParams.set("returnDate", params.returnDate);
    url.searchParams.set("adults", String(params.adults));
    url.searchParams.set("max", String(params.maxOffers));
    url.searchParams.set("currencyCode", "USD");
    url.searchParams.set("nonStop", "false");

    const amadeusRes = await fetch(url.toString(), {
      headers: { Authorization: `Bearer ${token}` },
    });

    if (!amadeusRes.ok) {
      const errBody = await amadeusRes.text();
      console.error("Amadeus API error:", amadeusRes.status, errBody);
      return new Response(
        JSON.stringify({ error: "Flight search failed", status: amadeusRes.status }),
        { status: 502, headers: { ...corsHeaders, "Content-Type": "application/json" } },
      );
    }

    const amadeusData = await amadeusRes.json();

    // ── Return raw Amadeus response (client does the parsing) ──
    return new Response(JSON.stringify(amadeusData), {
      headers: { ...corsHeaders, "Content-Type": "application/json" },
    });
  } catch (err) {
    const message = err instanceof Error ? err.message : "Internal server error";
    return new Response(
      JSON.stringify({ error: message }),
      { status: 500, headers: { ...corsHeaders, "Content-Type": "application/json" } },
    );
  }
});
