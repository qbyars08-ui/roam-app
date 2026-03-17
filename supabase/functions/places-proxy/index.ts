// =============================================================================
// ROAM — Google Places Proxy Edge Function
// Server-side proxy for Google Places API (keeps API key secure)
// 24hr cache in Supabase, JWT auth, rate limiting
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

const CACHE_TTL_MS = 24 * 60 * 60 * 1000;
const RATE_LIMIT = 30;
const VALID_ACTIONS = ["search_nearby", "place_details", "place_photos"] as const;
type PlacesAction = (typeof VALID_ACTIONS)[number];

const PLACES_BASE = "https://maps.googleapis.com/maps/api/place";

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
        p_user_id: user.id, p_endpoint: "places-proxy",
      });
      if ((count as number) > RATE_LIMIT) {
        return new Response(JSON.stringify({ error: "Rate limit exceeded" }), {
          status: 429, headers: { ...cors, "Content-Type": "application/json" },
        });
      }
    }

    // ── API key ──
    const apiKey = Deno.env.get("GOOGLE_PLACES_KEY") ?? Deno.env.get("GOOGLE_API_KEY") ?? Deno.env.get("GOOGLE_PLACES_API_KEY");
    if (!apiKey) {
      return new Response(JSON.stringify({ error: "Google Places not configured" }), {
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
    if (!action || !VALID_ACTIONS.includes(action as PlacesAction)) {
      return new Response(JSON.stringify({ error: `Invalid action. Use: ${VALID_ACTIONS.join(", ")}` }), {
        status: 400, headers: { ...cors, "Content-Type": "application/json" },
      });
    }

    // ── Cache check ──
    const cacheKey = `places_${action}_${JSON.stringify(params)}`;
    const { data: cached } = await supabaseAdmin
      .from("sonar_cache")
      .select("result, created_at")
      .eq("destination", cacheKey)
      .eq("query_type", "places")
      .gt("expires_at", new Date().toISOString())
      .single();

    if (cached) {
      return new Response(JSON.stringify({ ...cached.result, cached: true }), {
        headers: { ...cors, "Content-Type": "application/json" },
      });
    }

    // ── Execute API call ──
    let result: unknown;

    if (action === "search_nearby") {
      const { lat, lng, type, radius } = params as { lat: number; lng: number; type: string; radius?: number };
      const r = radius ?? 1500;
      const url = `${PLACES_BASE}/nearbysearch/json?location=${lat},${lng}&radius=${r}&type=${encodeURIComponent(type)}&key=${apiKey}`;
      const res = await fetch(url);
      const data = await res.json();
      result = (data.results ?? []).slice(0, 20).map((p: any) => ({
        placeId: p.place_id,
        name: p.name,
        rating: p.rating ?? null,
        userRatingsTotal: p.user_ratings_total ?? 0,
        priceLevel: p.price_level ?? null,
        vicinity: p.vicinity ?? "",
        location: p.geometry?.location ?? { lat: 0, lng: 0 },
        types: p.types ?? [],
        photoRef: p.photos?.[0]?.photo_reference ?? null,
        openNow: p.opening_hours?.open_now ?? null,
      }));
    } else if (action === "place_details") {
      const { placeId } = params as { placeId: string };
      const fields = "place_id,name,rating,user_ratings_total,price_level,formatted_address,formatted_phone_number,website,opening_hours,geometry,photos,reviews";
      const url = `${PLACES_BASE}/details/json?place_id=${encodeURIComponent(placeId)}&fields=${fields}&key=${apiKey}`;
      const res = await fetch(url);
      const data = await res.json();
      const p = data.result;
      if (!p) { result = null; } else {
        result = {
          placeId: p.place_id,
          name: p.name,
          rating: p.rating ?? null,
          userRatingsTotal: p.user_ratings_total ?? 0,
          priceLevel: p.price_level ?? null,
          address: p.formatted_address ?? "",
          phone: p.formatted_phone_number ?? null,
          website: p.website ?? null,
          hours: p.opening_hours?.weekday_text ?? null,
          location: p.geometry?.location ?? { lat: 0, lng: 0 },
          photos: (p.photos ?? []).slice(0, 5).map((ph: any) =>
            `${PLACES_BASE}/photo?maxwidth=600&photo_reference=${ph.photo_reference}&key=${apiKey}`
          ),
          reviews: (p.reviews ?? []).slice(0, 5).map((r: any) => ({
            author: r.author_name ?? "Anonymous",
            rating: r.rating ?? 0,
            text: r.text ?? "",
            timeAgo: r.relative_time_description ?? "",
          })),
        };
      }
    } else if (action === "place_photos") {
      const { placeId, maxPhotos } = params as { placeId: string; maxPhotos?: number };
      const max = Math.min(maxPhotos ?? 5, 10);
      const url = `${PLACES_BASE}/details/json?place_id=${encodeURIComponent(placeId)}&fields=photos&key=${apiKey}`;
      const res = await fetch(url);
      const data = await res.json();
      result = (data.result?.photos ?? []).slice(0, max).map((ph: any) =>
        `${PLACES_BASE}/photo?maxwidth=600&photo_reference=${ph.photo_reference}&key=${apiKey}`
      );
    }

    // ── Cache upsert ──
    await supabaseAdmin.from("sonar_cache").upsert({
      destination: cacheKey,
      query_type: "places",
      result: { data: result },
      expires_at: new Date(Date.now() + CACHE_TTL_MS).toISOString(),
    }, { onConflict: "destination,query_type" }).catch(() => {});

    return new Response(JSON.stringify({ data: result, cached: false }), {
      headers: { ...cors, "Content-Type": "application/json" },
    });
  } catch (err) {
    console.error("[places-proxy]", err);
    return new Response(JSON.stringify({ error: "Internal server error" }), {
      status: 500, headers: { ...getCorsHeaders(req), "Content-Type": "application/json" },
    });
  }
});
