// =============================================================================
// ROAM — Weather Intelligence Edge Function
// Fetches 7-day forecast via OpenWeatherMap One Call 3.0
// Returns travel-specific weather advice for a destination + date range
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
    "Access-Control-Allow-Headers":
      "authorization, x-client-info, apikey, content-type",
    "Access-Control-Allow-Methods": "POST, OPTIONS",
  };
}

const MAX_DESTINATION_LENGTH = 200;

interface WeatherDay {
  date: string;
  tempHigh: number;
  tempLow: number;
  description: string;
  icon: string;
  rainChance: number;
  humidity: number;
  windSpeed: number;
}

interface WeatherIntel {
  destination: string;
  days: WeatherDay[];
  summary: string;
  packingAdvice: string[];
  itineraryTips: string[];
  bestOutdoorDays: number[];
  rainyDays: number[];
}

// City coordinates for geocoding (top 30 ROAM destinations)
const CITY_COORDS: Record<string, { lat: number; lon: number }> = {
  "tokyo": { lat: 35.6762, lon: 139.6503 },
  "paris": { lat: 48.8566, lon: 2.3522 },
  "bali": { lat: -8.3405, lon: 115.092 },
  "new york": { lat: 40.7128, lon: -74.006 },
  "barcelona": { lat: 41.3874, lon: 2.1686 },
  "rome": { lat: 41.9028, lon: 12.4964 },
  "london": { lat: 51.5074, lon: -0.1278 },
  "bangkok": { lat: 13.7563, lon: 100.5018 },
  "marrakech": { lat: 31.6295, lon: -7.9811 },
  "lisbon": { lat: 38.7223, lon: -9.1393 },
  "cape town": { lat: -33.9249, lon: 18.4241 },
  "reykjavik": { lat: 64.1466, lon: -21.9426 },
  "seoul": { lat: 37.5665, lon: 126.978 },
  "buenos aires": { lat: -34.6037, lon: -58.3816 },
  "istanbul": { lat: 41.0082, lon: 28.9784 },
  "sydney": { lat: -33.8688, lon: 151.2093 },
  "mexico city": { lat: 19.4326, lon: -99.1332 },
  "dubai": { lat: 25.2048, lon: 55.2708 },
  "kyoto": { lat: 35.0116, lon: 135.7681 },
  "amsterdam": { lat: 52.3676, lon: 4.9041 },
  "medellin": { lat: 6.2476, lon: -75.5658 },
  "tbilisi": { lat: 41.7151, lon: 44.8271 },
  "chiang mai": { lat: 18.7883, lon: 98.9853 },
  "porto": { lat: 41.1579, lon: -8.6291 },
  "oaxaca": { lat: 17.0732, lon: -96.7266 },
  "dubrovnik": { lat: 42.6507, lon: 18.0944 },
  "budapest": { lat: 47.4979, lon: 19.0402 },
  "hoi an": { lat: 15.8801, lon: 108.338 },
  "cartagena": { lat: 10.391, lon: -75.5144 },
  "jaipur": { lat: 26.9124, lon: 75.7873 },
  "queenstown": { lat: -45.0312, lon: 168.6626 },
};

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

    const apiKey = Deno.env.get("OPENWEATHERMAP_KEY");
    if (!apiKey) {
      return new Response(
        JSON.stringify({ error: "Weather service unavailable" }),
        { status: 503, headers: { ...corsHeaders, "Content-Type": "application/json" } },
      );
    }

    let body: Record<string, unknown>;
    try {
      body = await req.json();
    } catch {
      return new Response(
        JSON.stringify({ error: "Invalid JSON body" }),
        { status: 400, headers: { ...corsHeaders, "Content-Type": "application/json" } },
      );
    }

    const destination = body.destination as string | undefined;
    if (!destination || typeof destination !== "string" || destination.length > MAX_DESTINATION_LENGTH) {
      return new Response(
        JSON.stringify({ error: "destination is required (max 200 chars)" }),
        { status: 400, headers: { ...corsHeaders, "Content-Type": "application/json" } },
      );
    }

    // Get coordinates
    const key = destination.toLowerCase();
    let coords = CITY_COORDS[key];

    // Fallback: use OpenWeatherMap geocoding
    if (!coords) {
      const geoRes = await fetch(
        `https://api.openweathermap.org/geo/1.0/direct?q=${encodeURIComponent(destination)}&limit=1&appid=${apiKey}`,
      );
      const geoData = await geoRes.json();
      if (geoData?.[0]) {
        coords = { lat: geoData[0].lat, lon: geoData[0].lon };
      }
    }

    if (!coords) {
      return new Response(
        JSON.stringify({ error: "Could not find coordinates for destination" }),
        { status: 404, headers: { ...corsHeaders, "Content-Type": "application/json" } },
      );
    }

    // Fetch 7-day forecast (One Call 3.0)
    const weatherRes = await fetch(
      `https://api.openweathermap.org/data/3.0/onecall?lat=${coords.lat}&lon=${coords.lon}&exclude=minutely,hourly,alerts&units=metric&appid=${apiKey}`,
    );

    if (!weatherRes.ok) {
      // Fallback to 5-day free API
      const fallbackRes = await fetch(
        `https://api.openweathermap.org/data/2.5/forecast?lat=${coords.lat}&lon=${coords.lon}&units=metric&appid=${apiKey}`,
      );
      const fallbackData = await fallbackRes.json();
      const intel = parseFallbackForecast(destination, fallbackData);
      return new Response(JSON.stringify(intel), {
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }

    const data = await weatherRes.json();
    const intel = parseOneCallForecast(destination, data);

    return new Response(JSON.stringify(intel), {
      headers: { ...corsHeaders, "Content-Type": "application/json" },
    });
  } catch {
    return new Response(
      JSON.stringify({ error: "Internal server error" }),
      { status: 500, headers: { ...corsHeaders, "Content-Type": "application/json" } },
    );
  }
});

// ---------------------------------------------------------------------------
// Parse One Call 3.0 response
// ---------------------------------------------------------------------------
function parseOneCallForecast(destination: string, data: any): WeatherIntel {
  const daily = (data.daily ?? []).slice(0, 7);

  const days: WeatherDay[] = daily.map((d: any) => ({
    date: new Date(d.dt * 1000).toISOString().split("T")[0],
    tempHigh: Math.round(d.temp.max),
    tempLow: Math.round(d.temp.min),
    description: d.weather?.[0]?.description ?? "Unknown",
    icon: d.weather?.[0]?.icon ?? "01d",
    rainChance: Math.round((d.pop ?? 0) * 100),
    humidity: d.humidity ?? 0,
    windSpeed: Math.round(d.wind_speed ?? 0),
  }));

  return buildIntel(destination, days);
}

// ---------------------------------------------------------------------------
// Parse 5-day fallback (free tier)
// ---------------------------------------------------------------------------
function parseFallbackForecast(destination: string, data: any): WeatherIntel {
  const forecasts = data.list ?? [];
  // Group by date, take noon reading
  const byDate = new Map<string, any[]>();
  for (const f of forecasts) {
    const date = f.dt_txt?.split(" ")[0];
    if (date) {
      if (!byDate.has(date)) byDate.set(date, []);
      byDate.get(date)!.push(f);
    }
  }

  const days: WeatherDay[] = [];
  for (const [date, readings] of byDate) {
    if (days.length >= 7) break;
    const temps = readings.map((r: any) => r.main.temp);
    const maxRain = Math.max(...readings.map((r: any) => r.pop ?? 0));
    const noon = readings.find((r: any) => r.dt_txt?.includes("12:00")) ?? readings[0];

    days.push({
      date,
      tempHigh: Math.round(Math.max(...temps)),
      tempLow: Math.round(Math.min(...temps)),
      description: noon.weather?.[0]?.description ?? "Unknown",
      icon: noon.weather?.[0]?.icon ?? "01d",
      rainChance: Math.round(maxRain * 100),
      humidity: noon.main?.humidity ?? 0,
      windSpeed: Math.round(noon.wind?.speed ?? 0),
    });
  }

  return buildIntel(destination, days);
}

// ---------------------------------------------------------------------------
// Build travel-specific intelligence from forecast
// ---------------------------------------------------------------------------
function buildIntel(destination: string, days: WeatherDay[]): WeatherIntel {
  const rainyDays = days
    .map((d, i) => (d.rainChance >= 50 ? i + 1 : -1))
    .filter((i) => i >= 0);

  const bestOutdoorDays = days
    .map((d, i) => (d.rainChance < 30 && d.tempHigh >= 15 && d.tempHigh <= 35 ? i + 1 : -1))
    .filter((i) => i >= 0);

  const avgHigh = Math.round(days.reduce((s, d) => s + d.tempHigh, 0) / (days.length || 1));
  const avgLow = Math.round(days.reduce((s, d) => s + d.tempLow, 0) / (days.length || 1));

  // Summary
  const rainCount = rainyDays.length;
  let summary = `${destination}: ${avgHigh}°C highs, ${avgLow}°C lows.`;
  if (rainCount === 0) summary += " Clear skies all week.";
  else if (rainCount <= 2) summary += ` Light rain likely on ${rainCount} day${rainCount > 1 ? "s" : ""}.`;
  else summary += ` Expect rain ${rainCount} out of ${days.length} days. Pack accordingly.`;

  // Packing advice
  const packingAdvice: string[] = [];
  if (avgHigh > 28) packingAdvice.push("Light, breathable fabrics. Sunscreen is non-negotiable.");
  if (avgHigh < 10) packingAdvice.push("Layer up. Thermal base + warm jacket essential.");
  if (rainCount >= 2) packingAdvice.push("Bring a packable rain jacket or compact umbrella.");
  if (avgHigh > 20 && days.some((d) => d.humidity > 70))
    packingAdvice.push("High humidity — skip cotton, wear quick-dry synthetics.");

  // Itinerary tips
  const itineraryTips: string[] = [];
  for (let i = 0; i < days.length; i++) {
    const d = days[i];
    if (d.rainChance >= 60) {
      itineraryTips.push(
        `Day ${i + 1} (${d.date}): ${d.rainChance}% rain — plan indoor activities.`,
      );
    }
    if (d.tempHigh >= 35) {
      itineraryTips.push(
        `Day ${i + 1}: ${d.tempHigh}°C — avoid midday outdoor activities. Go early morning or evening.`,
      );
    }
    if (d.windSpeed >= 20) {
      itineraryTips.push(
        `Day ${i + 1}: Strong winds (${d.windSpeed} m/s) — skip boat tours if possible.`,
      );
    }
  }
  if (bestOutdoorDays.length > 0) {
    itineraryTips.push(
      `Best days for outdoor activities: Day${bestOutdoorDays.length > 1 ? "s" : ""} ${bestOutdoorDays.join(", ")}.`,
    );
  }

  return {
    destination,
    days,
    summary,
    packingAdvice,
    itineraryTips,
    bestOutdoorDays,
    rainyDays,
  };
}
