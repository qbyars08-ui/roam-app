// =============================================================================
// ROAM — Destination Photo Edge Function
// Returns a photo URL for a destination search query.
// Strategy: Cache → Google Places → Pexels fallback
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

// ── Google Places photo resolver (3 API calls) ─────────────────────────────
async function tryGooglePlaces(
  encodedQuery: string,
  apiKey: string,
): Promise<{ photoUrl: string; placeId: string } | null> {
  try {
    const searchUrl = `https://maps.googleapis.com/maps/api/place/textsearch/json?query=${encodedQuery}&key=${apiKey}`;
    const searchRes = await fetch(searchUrl);
    const searchData = await searchRes.json();

    if (
      searchData.status !== "OK" ||
      !searchData.results?.length
    ) {
      return null;
    }

    const placeId = searchData.results[0].place_id;
    const detailsUrl = `https://maps.googleapis.com/maps/api/place/details/json?place_id=${placeId}&fields=photos&key=${apiKey}`;
    const detailsRes = await fetch(detailsUrl);
    const detailsData = await detailsRes.json();

    if (
      detailsData.status !== "OK" ||
      !detailsData.result?.photos?.length
    ) {
      return null;
    }

    const photoRef = detailsData.result.photos[0].photo_reference;
    const photoApiUrl = `https://maps.googleapis.com/maps/api/place/photo?maxwidth=600&photo_reference=${photoRef}&key=${apiKey}`;
    const photoRes = await fetch(photoApiUrl, { redirect: "manual" });
    const photoUrl = photoRes.headers.get("location");
    if (!photoUrl) return null;

    return { photoUrl, placeId };
  } catch {
    return null;
  }
}

// ── Pexels photo search (1 API call, free 200 req/hr) ──────────────────────
async function tryPexels(
  encodedQuery: string,
  apiKey: string,
): Promise<string | null> {
  try {
    const url = `https://api.pexels.com/v1/search?query=${encodedQuery}+travel+destination&per_page=1&orientation=landscape`;
    const res = await fetch(url, {
      headers: { Authorization: apiKey },
    });
    if (!res.ok) return null;

    const data = await res.json();
    const photo = data.photos?.[0];
    if (!photo) return null;

    return photo.src?.large ?? photo.src?.medium ?? photo.src?.original ?? null;
  } catch {
    return null;
  }
}

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
    const googleApiKey = Deno.env.get("GOOGLE_PLACES_KEY") ?? "";
    const pexelsApiKey = Deno.env.get("PEXELS_API_KEY") ?? "";

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

    // Service-role client for cache
    const supabaseAdmin = createClient(supabaseUrl, supabaseServiceRoleKey);

    // ── Parse request ───────────────────────────────────────────────────
    const { query } = (await req.json()) as { query: string };

    if (!query || typeof query !== "string") {
      return new Response(
        JSON.stringify({ error: "query must be a non-empty string" }),
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

    const encodedQuery = encodeURIComponent(query);
    let photoUrl: string | null = null;
    let cacheId: string | null = null;

    // ── Try Google Places first (if key is configured) ───────────────
    if (googleApiKey) {
      const google = await tryGooglePlaces(encodedQuery, googleApiKey);
      if (google) {
        photoUrl = google.photoUrl;
        cacheId = `destphoto_${google.placeId}`;
      }
    }

    // ── Pexels fallback (if Google missed or no key) ─────────────────
    if (!photoUrl && pexelsApiKey) {
      photoUrl = await tryPexels(encodedQuery, pexelsApiKey);
      if (photoUrl) {
        cacheId = `destphoto_pexels_${searchKey}`;
      }
    }

    // ── Cache result ────────────────────────────────────────────────────
    if (photoUrl && cacheId) {
      await supabaseAdmin.from("venues").upsert(
        {
          place_id: cacheId,
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
