// =============================================================================
// ROAM — Venue Enrichment Edge Function
// Looks up venues via Google Places Text Search + Details, caches in Supabase
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

// ── Cache duration: 7 days ──────────────────────────────────────────────────
const CACHE_DAYS = 7;

// ── Types ───────────────────────────────────────────────────────────────────
interface VenueQuery {
  name: string;
  city: string;
}

interface EnrichedVenue {
  place_id: string;
  name: string;
  photo_url: string | null;
  rating: number | null;
  user_ratings_total: number | null;
  formatted_address: string | null;
  opening_hours: {
    open_now: boolean | null;
    weekday_text: string[];
  } | null;
  website: string | null;
  maps_url: string;
  lat: number | null;
  lng: number | null;
}

// ── Helpers ─────────────────────────────────────────────────────────────────

/**
 * Strip common AI-generated verb prefixes from activity names
 * so we get a cleaner search query for Google Places.
 * "Visit the Senso-ji Temple" → "Senso-ji Temple"
 */
function cleanActivityName(raw: string): string {
  return raw
    .replace(
      /^(?:Visit(?:\s+the)?|Explore(?:\s+the)?|Head\s+to(?:\s+the)?|Check\s+out(?:\s+the)?|Walk\s+through(?:\s+the)?|Stop\s+by(?:\s+the)?|Stroll\s+through(?:\s+the)?|Try(?:\s+the)?|Experience(?:\s+the)?|Grab\s+.*?\s+at(?:\s+the)?|Wander\s+through(?:\s+the)?|Discover(?:\s+the)?|Go\s+to(?:\s+the)?)\s+/i,
      ""
    )
    .trim();
}

/**
 * Build a normalized cache key from venue name + city.
 * "Senso-ji Temple" + "Tokyo" → "senso-ji temple::tokyo"
 */
function buildSearchKey(name: string, city: string): string {
  return `${cleanActivityName(name).toLowerCase()}::${city.toLowerCase().trim()}`;
}

/**
 * Process items in batches to respect Google's QPS limits.
 */
async function batchProcess<T, R>(
  items: T[],
  fn: (item: T) => Promise<R>,
  batchSize: number
): Promise<R[]> {
  const results: R[] = [];
  for (let i = 0; i < items.length; i += batchSize) {
    const batch = items.slice(i, i + batchSize);
    const batchResults = await Promise.all(batch.map(fn));
    results.push(...batchResults);
  }
  return results;
}

/**
 * Resolve a Google Places photo reference to its final CDN URL
 * without leaking the API key to the client.
 */
async function resolvePhotoUrl(
  photoReference: string,
  apiKey: string
): Promise<string | null> {
  try {
    const url = `https://maps.googleapis.com/maps/api/place/photo?maxwidth=400&photo_reference=${photoReference}&key=${apiKey}`;
    const res = await fetch(url, { redirect: "manual" });
    return res.headers.get("location") ?? null;
  } catch {
    return null;
  }
}

/**
 * Fetch venue data from Google Places Text Search + Details APIs.
 */
async function fetchVenueFromGoogle(
  name: string,
  city: string,
  apiKey: string
): Promise<EnrichedVenue | null> {
  const cleanedName = cleanActivityName(name);
  const query = encodeURIComponent(`${cleanedName} in ${city}`);

  // ── Step 1: Text Search ───────────────────────────────────────────────
  const searchUrl = `https://maps.googleapis.com/maps/api/place/textsearch/json?query=${query}&key=${apiKey}`;
  const searchRes = await fetch(searchUrl);
  const searchData = await searchRes.json();

  if (
    searchData.status !== "OK" ||
    !searchData.results ||
    searchData.results.length === 0
  ) {
    return null;
  }

  const placeId = searchData.results[0].place_id;

  // ── Step 2: Place Details ─────────────────────────────────────────────
  const fields =
    "place_id,name,rating,user_ratings_total,formatted_address,opening_hours,website,photos,url,geometry";
  const detailsUrl = `https://maps.googleapis.com/maps/api/place/details/json?place_id=${placeId}&fields=${fields}&key=${apiKey}`;
  const detailsRes = await fetch(detailsUrl);
  const detailsData = await detailsRes.json();

  if (detailsData.status !== "OK" || !detailsData.result) {
    return null;
  }

  const place = detailsData.result;

  // ── Step 3: Resolve photo URL ─────────────────────────────────────────
  let photoUrl: string | null = null;
  if (place.photos && place.photos.length > 0) {
    photoUrl = await resolvePhotoUrl(place.photos[0].photo_reference, apiKey);
  }

  // ── Build enriched venue ──────────────────────────────────────────────
  return {
    place_id: place.place_id,
    name: place.name ?? cleanedName,
    photo_url: photoUrl,
    rating: place.rating ?? null,
    user_ratings_total: place.user_ratings_total ?? null,
    formatted_address: place.formatted_address ?? null,
    opening_hours: place.opening_hours
      ? {
          open_now: place.opening_hours.open_now ?? null,
          weekday_text: place.opening_hours.weekday_text ?? [],
        }
      : null,
    website: place.website ?? null,
    maps_url:
      place.url ??
      `https://www.google.com/maps/place/?q=place_id:${place.place_id}`,
    lat: place.geometry?.location?.lat ?? null,
    lng: place.geometry?.location?.lng ?? null,
  };
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
    const googleApiKey = Deno.env.get("GOOGLE_PLACES_KEY")!;

    // Client scoped to the calling user (respects RLS)
    const supabaseUser = createClient(supabaseUrl, supabaseAnonKey, {
      global: { headers: { Authorization: `Bearer ${jwt}` } },
    });

    // Verify the JWT
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

    // ── Rate limit: 30 req/min per user ─────────────────────────────────
    const RATE_LIMIT_PER_MINUTE = 30;
    const { data: count } = await supabaseAdmin.rpc("increment_edge_rate_limit", {
      p_user_id: user.id,
      p_endpoint: "enrich-venues",
    });
    if ((count as number) > RATE_LIMIT_PER_MINUTE) {
      return new Response(
        JSON.stringify({ error: "Rate limit exceeded. Try again in a minute." }),
        { status: 429, headers: { ...corsHeaders, "Content-Type": "application/json" } },
      );
    }

    // ── Parse request ───────────────────────────────────────────────────
    const { venues } = (await req.json()) as { venues: VenueQuery[] };

    if (!Array.isArray(venues) || venues.length === 0) {
      return new Response(
        JSON.stringify({ error: "venues must be a non-empty array" }),
        {
          status: 400,
          headers: { ...corsHeaders, "Content-Type": "application/json" },
        }
      );
    }

    if (venues.length > 30) {
      return new Response(
        JSON.stringify({ error: "Maximum 30 venues per request" }),
        {
          status: 400,
          headers: { ...corsHeaders, "Content-Type": "application/json" },
        }
      );
    }

    // ── Build search keys ───────────────────────────────────────────────
    const searchKeys = venues.map((v) => buildSearchKey(v.name, v.city));

    // ── Check cache ─────────────────────────────────────────────────────
    const cacheExpiry = new Date();
    cacheExpiry.setDate(cacheExpiry.getDate() - CACHE_DAYS);

    const { data: cachedRows } = await supabaseAdmin
      .from("venues")
      .select("search_key, data")
      .in("search_key", searchKeys)
      .gte("updated_at", cacheExpiry.toISOString());

    // Build a map of cached results
    const cacheMap = new Map<string, EnrichedVenue>();
    if (cachedRows) {
      for (const row of cachedRows) {
        cacheMap.set(row.search_key, row.data as EnrichedVenue);
      }
    }

    // ── Identify cache misses ───────────────────────────────────────────
    const missIndices: number[] = [];
    for (let i = 0; i < venues.length; i++) {
      if (!cacheMap.has(searchKeys[i])) {
        missIndices.push(i);
      }
    }

    // ── Fetch cache misses from Google ──────────────────────────────────
    if (missIndices.length > 0) {
      const fetchResults = await batchProcess(
        missIndices,
        async (idx) => {
          const venue = venues[idx];
          const result = await fetchVenueFromGoogle(
            venue.name,
            venue.city,
            googleApiKey
          );
          return { idx, searchKey: searchKeys[idx], result };
        },
        5 // 5 concurrent requests per batch
      );

      // Upsert successful results into cache
      const toUpsert = fetchResults
        .filter((r) => r.result !== null)
        .map((r) => ({
          place_id: r.result!.place_id,
          search_key: r.searchKey,
          data: r.result!,
          updated_at: new Date().toISOString(),
        }));

      if (toUpsert.length > 0) {
        await supabaseAdmin
          .from("venues")
          .upsert(toUpsert, { onConflict: "place_id" });
      }

      // Add fetched results to cache map
      for (const r of fetchResults) {
        if (r.result) {
          cacheMap.set(r.searchKey, r.result);
        }
      }
    }

    // ── Build response in input order ───────────────────────────────────
    const results: (EnrichedVenue | null)[] = searchKeys.map(
      (key) => cacheMap.get(key) ?? null
    );

    return new Response(JSON.stringify({ venues: results }), {
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
