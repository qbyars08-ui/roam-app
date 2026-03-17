// =============================================================================
// ROAM — Travel Proxy Edge Function
// Unified proxy for: TripAdvisor, Sherpa, Rome2Rio, GetYourGuide,
//                    Eventbrite, Foursquare
// Each provider has its own API key and endpoints.
// JWT auth, rate limiting, 24hr cache via sonar_cache table.
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
const VALID_PROVIDERS = [
  "tripadvisor", "sherpa", "rome2rio", "getyourguide", "eventbrite", "foursquare",
] as const;
type Provider = (typeof VALID_PROVIDERS)[number];

// ---------------------------------------------------------------------------
// Provider handlers
// ---------------------------------------------------------------------------

async function handleTripAdvisor(
  action: string,
  params: Record<string, unknown>,
  apiKey: string
): Promise<unknown> {
  const base = "https://api.content.tripadvisor.com/api/v1";
  const headers = { accept: "application/json" };

  if (action === "search_locations") {
    const { destination, category } = params as { destination: string; category?: string };
    const cat = category ?? "restaurants";
    const url = `${base}/location/search?key=${apiKey}&searchQuery=${encodeURIComponent(destination)}&category=${cat}&language=en`;
    const res = await fetch(url, { headers });
    if (!res.ok) return [];
    const data = await res.json();
    return (data.data ?? []).slice(0, 15).map((l: any) => ({
      locationId: l.location_id,
      name: l.name,
      rating: null,
      numReviews: 0,
      priceLevel: null,
      category: cat,
      address: l.address_obj?.address_string ?? "",
      photoUrl: null,
    }));
  }

  if (action === "location_details") {
    const { locationId } = params as { locationId: string };
    const url = `${base}/location/${locationId}/details?key=${apiKey}&language=en&currency=USD`;
    const res = await fetch(url, { headers });
    if (!res.ok) return null;
    const l = await res.json();
    return {
      locationId: l.location_id,
      name: l.name,
      rating: l.rating ? parseFloat(l.rating) : null,
      numReviews: parseInt(l.num_reviews ?? "0", 10),
      priceLevel: l.price_level ?? null,
      address: l.address_obj?.address_string ?? "",
      phone: l.phone ?? null,
      website: l.website ?? null,
      hours: l.hours?.weekday_text ?? null,
      photos: [],
      cuisine: (l.cuisine ?? []).map((c: any) => c.localized_name),
      rankingString: l.ranking_data?.ranking_string ?? null,
    };
  }

  if (action === "location_reviews") {
    const { locationId } = params as { locationId: string };
    const url = `${base}/location/${locationId}/reviews?key=${apiKey}&language=en`;
    const res = await fetch(url, { headers });
    if (!res.ok) return [];
    const data = await res.json();
    return (data.data ?? []).slice(0, 5).map((r: any) => ({
      id: r.id?.toString() ?? "",
      rating: r.rating ?? 0,
      title: r.title ?? "",
      text: r.text ?? "",
      author: r.user?.username ?? "Traveler",
      date: r.published_date ?? "",
    }));
  }

  return null;
}

async function handleFoursquare(
  action: string,
  params: Record<string, unknown>,
  apiKey: string
): Promise<unknown> {
  const base = "https://api.foursquare.com/v3";
  const headers = { Authorization: apiKey, Accept: "application/json" };

  if (action === "search_places") {
    const { query, lat, lng, categories, radius } = params as {
      query: string; lat: number; lng: number; categories?: string[]; radius?: number;
    };
    const r = radius ?? 2000;
    let url = `${base}/places/search?query=${encodeURIComponent(query)}&ll=${lat},${lng}&radius=${r}&limit=20`;
    if (categories?.length) url += `&categories=${categories.join(",")}`;
    const res = await fetch(url, { headers });
    if (!res.ok) return [];
    const data = await res.json();
    return (data.results ?? []).map((p: any) => ({
      fsqId: p.fsq_id,
      name: p.name,
      category: p.categories?.[0]?.name ?? "Place",
      address: p.location?.formatted_address ?? "",
      distance: p.distance ?? 0,
      rating: null,
      price: p.price ?? null,
      location: { lat: p.geocodes?.main?.latitude ?? 0, lng: p.geocodes?.main?.longitude ?? 0 },
      photoUrl: null,
    }));
  }

  if (action === "place_details") {
    const { fsqId } = params as { fsqId: string };
    const url = `${base}/places/${fsqId}?fields=fsq_id,name,categories,location,tel,website,hours,rating,price,photos,tips,social_media`;
    const res = await fetch(url, { headers });
    if (!res.ok) return null;
    const p = await res.json();
    return {
      fsqId: p.fsq_id,
      name: p.name,
      category: p.categories?.[0]?.name ?? "Place",
      address: p.location?.formatted_address ?? "",
      phone: p.tel ?? null,
      website: p.website ?? null,
      hours: p.hours?.display ?? null,
      rating: p.rating ? p.rating / 2 : null, // FSQ uses 0-10, normalize to 0-5
      price: p.price ?? null,
      photos: (p.photos ?? []).slice(0, 5).map((ph: any) => `${ph.prefix}300x300${ph.suffix}`),
      tips: (p.tips ?? []).slice(0, 5).map((t: any) => ({
        text: t.text ?? "",
        agreeCount: t.agree_count ?? 0,
        createdAt: t.created_at ?? "",
      })),
      socialMedia: p.social_media ?? {},
    };
  }

  if (action === "place_tips") {
    const { fsqId } = params as { fsqId: string };
    const url = `${base}/places/${fsqId}/tips?limit=10`;
    const res = await fetch(url, { headers });
    if (!res.ok) return [];
    const data = await res.json();
    return (data ?? []).map((t: any) => ({
      text: t.text ?? "",
      agreeCount: t.agree_count ?? 0,
      createdAt: t.created_at ?? "",
    }));
  }

  return null;
}

async function handleRome2Rio(
  action: string,
  params: Record<string, unknown>,
  apiKey: string
): Promise<unknown> {
  if (action !== "get_routes") return null;
  const { origin, destination } = params as { origin: string; destination: string };
  const url = `https://free.rome2rio.com/api/1.5/json/Search?key=${apiKey}&oName=${encodeURIComponent(origin)}&dName=${encodeURIComponent(destination)}&currencyCode=USD`;
  const res = await fetch(url);
  if (!res.ok) return [];
  const data = await res.json();

  const modeMap: Record<string, string> = {
    plane: "flight", train: "train", bus: "bus", ferry: "ferry", car: "car", walk: "walk",
  };

  return (data.routes ?? []).slice(0, 6).map((route: any) => ({
    name: route.name ?? "",
    mode: modeMap[route.segments?.[0]?.segmentKind ?? ""] ?? "car",
    duration: route.totalDuration ?? 0,
    price: route.indicativePrice
      ? { low: route.indicativePrice.priceLow ?? 0, high: route.indicativePrice.priceHigh ?? 0, currency: "USD" }
      : null,
    segments: (route.segments ?? []).map((s: any) => ({
      mode: s.segmentKind ?? "",
      from: s.sName ?? "",
      to: s.tName ?? "",
      duration: s.transitDuration ?? s.duration ?? 0,
      operator: data.agencies?.[s.agencies?.[0]?.agency]?.name ?? null,
    })),
    bookingUrl: null,
  }));
}

async function handleSherpa(
  action: string,
  params: Record<string, unknown>,
  apiKey: string
): Promise<unknown> {
  // Sherpa Group's Traveller API
  const base = "https://requirements-api.joinsherpa.com/v3";
  const headers = {
    Authorization: `Bearer ${apiKey}`,
    Accept: "application/json",
  };

  if (action === "visa_requirements") {
    const { passportCountry, destinationCountry } = params as { passportCountry: string; destinationCountry: string };
    const url = `${base}/restrictions?departure=${passportCountry}&destination=${destinationCountry}&travellerNationality=${passportCountry}`;
    const res = await fetch(url, { headers });
    if (!res.ok) return null;
    const data = await res.json();
    const visa = data.data?.[0];
    if (!visa) return null;
    return {
      visaType: visa.category ?? "visa_required",
      maxStay: visa.maxStay ?? null,
      processingTime: visa.processingTime ?? null,
      documentsNeeded: visa.documents ?? [],
      officialLink: visa.links?.[0]?.url ?? null,
      notes: visa.description ?? null,
    };
  }

  if (action === "entry_requirements") {
    const { destination } = params as { destination: string };
    const url = `${base}/restrictions?destination=${destination}`;
    const res = await fetch(url, { headers });
    if (!res.ok) return null;
    const data = await res.json();
    return {
      destination,
      covidRestrictions: null,
      healthDeclaration: false,
      insuranceRequired: false,
      customsForms: null,
      currencyRestrictions: null,
      notes: (data.data ?? []).map((r: any) => r.description ?? "").filter(Boolean),
    };
  }

  return null;
}

async function handleEventbrite(
  action: string,
  params: Record<string, unknown>,
  apiKey: string
): Promise<unknown> {
  if (action !== "search_events") return null;
  const { destination, startDate, endDate } = params as {
    destination: string; startDate?: string; endDate?: string;
  };
  const base = "https://www.eventbriteapi.com/v3";
  let url = `${base}/events/search/?q=${encodeURIComponent(destination)}&expand=venue&token=${apiKey}`;
  if (startDate) url += `&start_date.range_start=${startDate}T00:00:00`;
  if (endDate) url += `&start_date.range_end=${endDate}T23:59:59`;

  const res = await fetch(url);
  if (!res.ok) return [];
  const data = await res.json();

  return (data.events ?? []).slice(0, 15).map((e: any) => ({
    id: e.id,
    name: e.name?.text ?? "",
    date: e.start?.local ?? "",
    endDate: e.end?.local ?? null,
    venue: e.venue?.name ?? "",
    address: e.venue?.address?.localized_address_display ?? "",
    price: e.is_free ? null : "Paid",
    currency: null,
    url: e.url ?? "",
    category: "",
    imageUrl: e.logo?.url ?? null,
    isFree: e.is_free ?? false,
  }));
}

async function handleGetYourGuide(
  action: string,
  params: Record<string, unknown>,
  apiKey: string
): Promise<unknown> {
  // GetYourGuide Partner API
  const base = "https://api.getyourguide.com/1";
  const headers = { "X-Access-Token": apiKey, Accept: "application/json" };

  if (action === "search_activities") {
    const { destination, date, category } = params as { destination: string; date?: string; category?: string };
    let url = `${base}/activities?q=${encodeURIComponent(destination)}&currency=USD&limit=15`;
    if (date) url += `&date=${date}`;
    if (category) url += `&category=${encodeURIComponent(category)}`;
    const res = await fetch(url, { headers });
    if (!res.ok) return [];
    const data = await res.json();
    return (data.data?.activities ?? data.activities ?? []).map((a: any) => ({
      id: a.id?.toString() ?? "",
      name: a.title ?? a.name ?? "",
      price: a.price?.values?.amount ?? a.retail_price?.amount ?? 0,
      currency: a.price?.values?.currency ?? "USD",
      duration: a.duration ?? "",
      rating: a.overall_rating ?? null,
      reviewCount: a.number_of_ratings ?? 0,
      photoUrl: a.pictures?.[0]?.url ?? a.cover_image_url ?? null,
      category: a.categories?.[0]?.name ?? "",
      bookingUrl: `https://www.getyourguide.com/activity/${a.id}?partner_id=ROAM`,
    }));
  }

  if (action === "activity_details") {
    const { activityId } = params as { activityId: string };
    const url = `${base}/activities/${activityId}?currency=USD`;
    const res = await fetch(url, { headers });
    if (!res.ok) return null;
    const a = (await res.json()).data ?? await res.json();
    return {
      id: a.id?.toString() ?? activityId,
      name: a.title ?? "",
      description: a.abstract ?? "",
      price: a.price?.values?.amount ?? 0,
      currency: a.price?.values?.currency ?? "USD",
      duration: a.duration ?? "",
      rating: a.overall_rating ?? null,
      reviewCount: a.number_of_ratings ?? 0,
      photos: (a.pictures ?? []).map((p: any) => p.url),
      includes: a.inclusions ?? [],
      excludes: a.exclusions ?? [],
      meetingPoint: a.meeting_point ?? null,
      bookingUrl: `https://www.getyourguide.com/activity/${activityId}?partner_id=ROAM`,
    };
  }

  return null;
}

// ---------------------------------------------------------------------------
// Provider key mapping
// ---------------------------------------------------------------------------
const PROVIDER_KEYS: Record<Provider, string> = {
  tripadvisor: "TRIPADVISOR_API_KEY",
  sherpa: "SHERPA_API_KEY",
  rome2rio: "ROME2RIO_API_KEY",
  getyourguide: "GETYOURGUIDE_API_KEY",
  eventbrite: "EVENTBRITE_API_KEY",
  foursquare: "FOURSQUARE_API_KEY",
};

const PROVIDER_HANDLERS: Record<
  Provider,
  (action: string, params: Record<string, unknown>, key: string) => Promise<unknown>
> = {
  tripadvisor: handleTripAdvisor,
  sherpa: handleSherpa,
  rome2rio: handleRome2Rio,
  getyourguide: handleGetYourGuide,
  eventbrite: handleEventbrite,
  foursquare: handleFoursquare,
};

// ---------------------------------------------------------------------------
// Main handler
// ---------------------------------------------------------------------------
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
        p_user_id: user.id, p_endpoint: "travel-proxy",
      });
      if ((count as number) > RATE_LIMIT) {
        return new Response(JSON.stringify({ error: "Rate limit exceeded" }), {
          status: 429, headers: { ...cors, "Content-Type": "application/json" },
        });
      }
    }

    // ── Parse body ──
    let body: Record<string, unknown>;
    try { body = await req.json(); } catch {
      return new Response(JSON.stringify({ error: "Invalid JSON" }), {
        status: 400, headers: { ...cors, "Content-Type": "application/json" },
      });
    }

    const provider = body.provider as string;
    const action = body.action as string;
    const params = body.params as Record<string, unknown> ?? {};

    if (!provider || !VALID_PROVIDERS.includes(provider as Provider)) {
      return new Response(JSON.stringify({ error: `Invalid provider. Use: ${VALID_PROVIDERS.join(", ")}` }), {
        status: 400, headers: { ...cors, "Content-Type": "application/json" },
      });
    }
    if (!action) {
      return new Response(JSON.stringify({ error: "action is required" }), {
        status: 400, headers: { ...cors, "Content-Type": "application/json" },
      });
    }

    // ── Check API key ──
    const keyName = PROVIDER_KEYS[provider as Provider];
    const apiKey = Deno.env.get(keyName);
    if (!apiKey) {
      return new Response(JSON.stringify({ error: `${provider} not configured`, needsKey: keyName }), {
        status: 503, headers: { ...cors, "Content-Type": "application/json" },
      });
    }

    // ── Cache check ──
    const cacheKey = `${provider}_${action}_${JSON.stringify(params)}`;
    const { data: cached } = await supabaseAdmin
      .from("sonar_cache")
      .select("result, created_at")
      .eq("destination", cacheKey)
      .eq("query_type", provider)
      .gt("expires_at", new Date().toISOString())
      .single();

    if (cached) {
      return new Response(JSON.stringify({ ...cached.result, cached: true }), {
        headers: { ...cors, "Content-Type": "application/json" },
      });
    }

    // ── Execute ──
    const handler = PROVIDER_HANDLERS[provider as Provider];
    const result = await handler(action, params, apiKey);

    // ── Cache upsert ──
    await supabaseAdmin.from("sonar_cache").upsert({
      destination: cacheKey,
      query_type: provider,
      result: { data: result },
      expires_at: new Date(Date.now() + CACHE_TTL_MS).toISOString(),
    }, { onConflict: "destination,query_type" }).catch(() => {});

    return new Response(JSON.stringify({ data: result, cached: false }), {
      headers: { ...cors, "Content-Type": "application/json" },
    });
  } catch (err) {
    console.error("[travel-proxy]", err);
    return new Response(JSON.stringify({ error: "Internal server error" }), {
      status: 500, headers: { ...getCorsHeaders(req), "Content-Type": "application/json" },
    });
  }
});
