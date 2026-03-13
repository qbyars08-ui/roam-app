// =============================================================================
// ROAM — Amadeus Flight Search Proxy
// Keeps AMADEUS_KEY and AMADEUS_SECRET server-side. Client calls this instead
// of Amadeus API directly.
// =============================================================================
import { createClient } from "https://esm.sh/@supabase/supabase-js@2.43.4";

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
    "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type",
    "Access-Control-Allow-Methods": "POST, OPTIONS",
  };
}

const BASE = "https://test.api.amadeus.com";

const AIRLINE_NAMES: Record<string, string> = {
  AA: "American Airlines", UA: "United", DL: "Delta", WN: "Southwest",
  B6: "JetBlue", NK: "Spirit", F9: "Frontier", AS: "Alaska",
  HA: "Hawaiian", BA: "British Airways", LH: "Lufthansa",
  AF: "Air France", KL: "KLM", IB: "Iberia", AY: "Finnair",
  SK: "SAS", LX: "Swiss", OS: "Austrian", TP: "TAP Portugal",
  TK: "Turkish Airlines", EK: "Emirates", QR: "Qatar Airways",
  EY: "Etihad", SQ: "Singapore Airlines", CX: "Cathay Pacific",
  NH: "ANA", JL: "JAL", OZ: "Asiana", KE: "Korean Air",
  QF: "Qantas", NZ: "Air New Zealand", AC: "Air Canada",
  AM: "Aeromexico", AV: "Avianca", LA: "LATAM", G3: "Gol",
  FR: "Ryanair", U2: "easyJet", W6: "Wizz Air", VY: "Vueling",
  TG: "Thai Airways", GA: "Garuda", MH: "Malaysia Airlines",
  BR: "EVA Air", CI: "China Airlines", CA: "Air China",
  MU: "China Eastern", CZ: "China Southern", AI: "Air India",
  ET: "Ethiopian", SA: "South African", MS: "EgyptAir",
  RJ: "Royal Jordanian", SV: "Saudi Arabian",
};

function formatDuration(iso: string): string {
  const match = iso.match(/PT(?:(\d+)H)?(?:(\d+)M)?/);
  if (!match) return iso;
  const h = match[1] ? `${match[1]}h` : "";
  const m = match[2] ? `${match[2]}m` : "";
  return `${h} ${m}`.trim();
}

async function getAmadeusToken(): Promise<string> {
  const apiKey = Deno.env.get("AMADEUS_KEY");
  const apiSecret = Deno.env.get("AMADEUS_SECRET");
  if (!apiKey || !apiSecret) {
    throw new Error("AMADEUS_KEY and AMADEUS_SECRET must be set in Supabase env");
  }

  const res = await fetch(`${BASE}/v1/security/oauth2/token`, {
    method: "POST",
    headers: { "Content-Type": "application/x-www-form-urlencoded" },
    body: `grant_type=client_credentials&client_id=${encodeURIComponent(apiKey)}&client_secret=${encodeURIComponent(apiSecret)}`,
  });

  if (!res.ok) {
    const text = await res.text();
    console.error("[amadeus-proxy] Token error:", res.status, text);
    throw new Error("Amadeus auth failed");
  }

  const data = await res.json();
  return data.access_token;
}

Deno.serve(async (req: Request) => {
  const corsHeaders = getCorsHeaders(req);
  if (req.method === "OPTIONS") {
    return new Response("ok", { headers: corsHeaders });
  }

  try {
    const authHeader = req.headers.get("Authorization");
    if (!authHeader || !authHeader.startsWith("Bearer ")) {
      return new Response(
        JSON.stringify({ error: "Missing or invalid Authorization header" }),
        { status: 401, headers: { ...corsHeaders, "Content-Type": "application/json" } },
      );
    }

    const jwt = authHeader.replace("Bearer ", "");
    const supabaseUrl = Deno.env.get("SUPABASE_URL")!;
    const supabaseAnonKey = Deno.env.get("SUPABASE_ANON_KEY")!;
    const supabaseUser = createClient(supabaseUrl, supabaseAnonKey, {
      global: { headers: { Authorization: `Bearer ${jwt}` } },
    });
    const { data: { user }, error: userError } = await supabaseUser.auth.getUser();
    if (userError || !user) {
      return new Response(
        JSON.stringify({ error: "Invalid or expired token" }),
        { status: 401, headers: { ...corsHeaders, "Content-Type": "application/json" } },
      );
    }

    const body = await req.json();
    const { origin, destination, departureDate, returnDate, adults = 1, maxOffers = 5 } = body;

    if (!origin || !destination || !departureDate || !returnDate) {
      return new Response(
        JSON.stringify({ error: "origin, destination, departureDate, returnDate required" }),
        { status: 400, headers: { ...corsHeaders, "Content-Type": "application/json" } },
      );
    }

    const token = await getAmadeusToken();

    const url = new URL(`${BASE}/v2/shopping/flight-offers`);
    url.searchParams.set("originLocationCode", String(origin));
    url.searchParams.set("destinationLocationCode", String(destination));
    url.searchParams.set("departureDate", String(departureDate));
    url.searchParams.set("returnDate", String(returnDate));
    url.searchParams.set("adults", String(adults));
    url.searchParams.set("max", String(Math.min(maxOffers, 10)));
    url.searchParams.set("currencyCode", "USD");
    url.searchParams.set("nonStop", "false");

    const res = await fetch(url.toString(), {
      headers: { Authorization: `Bearer ${token}` },
    });

    if (!res.ok) {
      const errBody = await res.text();
      console.error("[amadeus-proxy] Search error:", res.status, errBody);
      return new Response(
        JSON.stringify({ error: "Flight search failed" }),
        { status: res.status, headers: { ...corsHeaders, "Content-Type": "application/json" } },
      );
    }

    const data = await res.json();
    const rawOffers = data.data ?? [];

    const offers = rawOffers.map((offer: Record<string, unknown>) => {
      const price = parseFloat((offer.price as Record<string, string>).total);
      const currency = (offer.price as Record<string, string>).currency;
      const itineraries = offer.itineraries as Array<Record<string, unknown>>;
      const outbound = itineraries[0];
      const returnFlight = itineraries[1];
      const segments = outbound.segments as Array<Record<string, unknown>>;
      const mainCarrier = (segments[0]?.carrierCode as string) ?? "XX";

      return {
        airline: mainCarrier,
        airlineName: AIRLINE_NAMES[mainCarrier] ?? mainCarrier,
        price,
        currency,
        departureDate,
        returnDate,
        outboundDuration: formatDuration(outbound.duration as string),
        returnDuration: returnFlight ? formatDuration(returnFlight.duration as string) : "",
        stops: segments.length - 1,
        origin,
        destination,
        bookingUrl: `https://www.google.com/travel/flights?q=flights+from+${origin}+to+${destination}+on+${departureDate}`,
      };
    });

    offers.sort((a: { price: number }, b: { price: number }) => a.price - b.price);

    return new Response(
      JSON.stringify({
        offers,
        cheapest: offers[0] ?? null,
        origin,
        destination,
        searchedAt: new Date().toISOString(),
      }),
      { status: 200, headers: { ...corsHeaders, "Content-Type": "application/json" } },
    );
  } catch (err) {
    console.error("[amadeus-proxy] Error:", err);
    return new Response(
      JSON.stringify({ error: "Internal server error" }),
      { status: 500, headers: { ...corsHeaders, "Content-Type": "application/json" } },
    );
  }
});
