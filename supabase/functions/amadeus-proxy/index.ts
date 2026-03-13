// =============================================================================
// ROAM — Amadeus Flight Search Proxy
// Keeps AMADEUS_KEY and AMADEUS_SECRET server-side only.
// Handles OAuth token exchange and flight-offers search.
// =============================================================================

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers":
    "authorization, x-client-info, apikey, content-type",
  "Access-Control-Allow-Methods": "POST, OPTIONS",
};

const BASE = "https://test.api.amadeus.com";

// ---------------------------------------------------------------------------
// In-memory token cache (survives across requests within the same isolate)
// ---------------------------------------------------------------------------
let cachedToken: { access_token: string; expires_at: number } | null = null;

async function getToken(apiKey: string, apiSecret: string): Promise<string> {
  if (cachedToken && cachedToken.expires_at > Date.now() + 60_000) {
    return cachedToken.access_token;
  }

  const res = await fetch(`${BASE}/v1/security/oauth2/token`, {
    method: "POST",
    headers: { "Content-Type": "application/x-www-form-urlencoded" },
    body: `grant_type=client_credentials&client_id=${apiKey}&client_secret=${apiSecret}`,
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
// Handler
// ---------------------------------------------------------------------------
Deno.serve(async (req: Request) => {
  if (req.method === "OPTIONS") {
    return new Response("ok", { headers: corsHeaders });
  }

  try {
    const apiKey = Deno.env.get("AMADEUS_KEY");
    const apiSecret = Deno.env.get("AMADEUS_SECRET");

    if (!apiKey || !apiSecret) {
      return new Response(
        JSON.stringify({ error: "Amadeus credentials not configured" }),
        { status: 500, headers: { ...corsHeaders, "Content-Type": "application/json" } },
      );
    }

    const body = await req.json();
    const { origin, destination, departureDate, returnDate, adults = 1, max = 5 } = body;

    if (!origin || !destination || !departureDate || !returnDate) {
      return new Response(
        JSON.stringify({ error: "origin, destination, departureDate, returnDate are required" }),
        { status: 400, headers: { ...corsHeaders, "Content-Type": "application/json" } },
      );
    }

    const token = await getToken(apiKey, apiSecret);

    const url = new URL(`${BASE}/v2/shopping/flight-offers`);
    url.searchParams.set("originLocationCode", origin);
    url.searchParams.set("destinationLocationCode", destination);
    url.searchParams.set("departureDate", departureDate);
    url.searchParams.set("returnDate", returnDate);
    url.searchParams.set("adults", String(adults));
    url.searchParams.set("max", String(max));
    url.searchParams.set("currencyCode", "USD");
    url.searchParams.set("nonStop", "false");

    const flightRes = await fetch(url.toString(), {
      headers: { Authorization: `Bearer ${token}` },
    });

    if (!flightRes.ok) {
      const errBody = await flightRes.text();
      return new Response(
        JSON.stringify({ error: `Amadeus flight search failed: ${flightRes.status}`, details: errBody }),
        { status: flightRes.status, headers: { ...corsHeaders, "Content-Type": "application/json" } },
      );
    }

    const data = await flightRes.json();

    return new Response(JSON.stringify(data), {
      status: 200,
      headers: { ...corsHeaders, "Content-Type": "application/json" },
    });
  } catch (err) {
    return new Response(
      JSON.stringify({ error: "Internal server error" }),
      { status: 500, headers: { ...corsHeaders, "Content-Type": "application/json" } },
    );
  }
});
