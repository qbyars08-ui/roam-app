// =============================================================================
// ROAM — Destination Photo Edge Function
// Returns a Google Places photo URL for a destination search query
// =============================================================================

import { createClient } from "https://esm.sh/@supabase/supabase-js@2.43.4";

// ── CORS ────────────────────────────────────────────────────────────────────
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

// Cache for 30 days — destination photos rarely change
const CACHE_DAYS = 30;

// ── Main handler ────────────────────────────────────────────────────────────
Deno.serve(async (req: Request) => {
  const corsHeaders = getCorsHeaders(req);

  // ── CORS preflight ────────────────────────────────────────────────────
  if (req.method === "OPTIONS") {
    return new Response("ok", { headers: corsHeaders });
  }

  try {
    // ── Auth ─────────────────────────────────────────────────────────────
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
    const supabaseServiceRoleKey = Deno.env.get("SUPABASE_SERVICE_ROLE_KEY")!;
    const googleApiKey = Deno.env.get("GOOGLE_PLACES_KEY")!;

    // Verify JWT
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

    // Service-role client for rate limit + cache
    const supabaseAdmin = createClient(supabaseUrl, supabaseServiceRoleKey);

    // ── Rate limit: 60 req/min per user ─────────────────────────────────
    const RATE_LIMIT_PER_MINUTE = 60;
    const { data: count } = await supabaseAdmin.rpc("increment_edge_rate_limit", {
      p_user_id: user.id,
      p_endpoint: "destination-photo",
    });
    if ((count as number) > RATE_LIMIT_PER_MINUTE) {
      return new Response(
        JSON.stringify({ error: "Rate limit exceeded. Try again in a minute." }),
        { status: 429, headers: { ...corsHeaders, "Content-Type": "application/json" } },
      );
    }

    // ── Parse request ───────────────────────────────────────────────────
    const { query } = (await req.json()) as { query: string };

    const MAX_QUERY_LENGTH = 200;
    if (!query || typeof query !== "string" || query.length > MAX_QUERY_LENGTH) {
      return new Response(
        JSON.stringify({ error: `query must be a non-empty string (max ${MAX_QUERY_LENGTH} chars)` }),
        {
          status: 400,
          headers: { ...corsHeaders, "Content-Type": "application/json" },
        }
      );
    }

    const searchKey = `destphoto::${query.toLowerCase().trim()}`;

    // ── Check cache ─────────────────────────────────────────────────────
    const cacheExpiry = new Date();
    cacheExpiry.setDate(cacheExpiry.getDate() - CACHE_DAYS);

    const { data: cached } = await supabaseAdmin
      .from("venues")
      .select("data")
      .eq("search_key", searchKey)
      .gte("updated_at", cacheExpiry.toISOString())
      .single();

    if (cached?.data) {
      return new Response(
        JSON.stringify({ photo_url: (cached.data as { photo_url: string }).photo_url }),
        {
          status: 200,
          headers: { ...corsHeaders, "Content-Type": "application/json" },
        }
      );
    }

    // ── Text Search ─────────────────────────────────────────────────────
    const encodedQuery = encodeURIComponent(query);
    const searchUrl = `https://maps.googleapis.com/maps/api/place/textsearch/json?query=${encodedQuery}&key=${googleApiKey}`;
    const searchRes = await fetch(searchUrl);
    const searchData = await searchRes.json();

    if (
      searchData.status !== "OK" ||
      !searchData.results ||
      searchData.results.length === 0
    ) {
      return new Response(JSON.stringify({ photo_url: null }), {
        status: 200,
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }

    const placeId = searchData.results[0].place_id;

    // ── Place Details (just photos) ─────────────────────────────────────
    const detailsUrl = `https://maps.googleapis.com/maps/api/place/details/json?place_id=${placeId}&fields=photos&key=${googleApiKey}`;
    const detailsRes = await fetch(detailsUrl);
    const detailsData = await detailsRes.json();

    if (
      detailsData.status !== "OK" ||
      !detailsData.result?.photos ||
      detailsData.result.photos.length === 0
    ) {
      return new Response(JSON.stringify({ photo_url: null }), {
        status: 200,
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }

    const photoRef = detailsData.result.photos[0].photo_reference;

    // ── Resolve photo URL (follow redirect to get CDN URL) ──────────────
    const photoApiUrl = `https://maps.googleapis.com/maps/api/place/photo?maxwidth=600&photo_reference=${photoRef}&key=${googleApiKey}`;
    const photoRes = await fetch(photoApiUrl, { redirect: "manual" });
    const photoUrl = photoRes.headers.get("location") ?? null;

    // ── Cache result ────────────────────────────────────────────────────
    if (photoUrl) {
      await supabaseAdmin.from("venues").upsert(
        {
          place_id: `destphoto_${placeId}`,
          search_key: searchKey,
          data: { photo_url: photoUrl },
          updated_at: new Date().toISOString(),
        },
        { onConflict: "place_id" }
      );
    }

    return new Response(JSON.stringify({ photo_url: photoUrl }), {
      status: 200,
      headers: { ...corsHeaders, "Content-Type": "application/json" },
    });
  } catch {
    return new Response(
      JSON.stringify({ error: "Internal server error" }),
      {
        status: 500,
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      }
    );
  }
});
