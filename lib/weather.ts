// =============================================================================
// ROAM — Weather Integration (OpenWeatherMap)
// =============================================================================

// ---------------------------------------------------------------------------
// Types
// ---------------------------------------------------------------------------

export interface WeatherDay {
  date: string;
  tempMin: number;
  tempMax: number;
  humidity: number;
  description: string;
  icon: string;
  /** Wind speed in m/s */
  windSpeed: number;
  /** Probability of precipitation (0-1) */
  pop: number;
}

export interface WeatherForecast {
  current: {
    temp: number;
    description: string;
    icon: string;
    humidity: number;
    windSpeed: number;
  };
  days: WeatherDay[];
  packingHint: string;
}

// ---------------------------------------------------------------------------
// Open-Meteo fallback (free, no API key required)
// ---------------------------------------------------------------------------
import { geocodeCity } from './geocoding';
import {
  getWeatherForecast as getOpenMeteoForecast,
  type DailyForecast,
} from './weather-forecast';

const WMO_LABEL_MAP: Record<string, string> = {
  Sun: 'clear sky', CloudSun: 'partly cloudy', Cloud: 'overcast',
  CloudFog: 'foggy', CloudDrizzle: 'drizzle', CloudRain: 'rain',
  CloudRainWind: 'heavy rain', CloudSnow: 'snow', Snowflake: 'snow',
  CloudLightning: 'thunderstorm',
};

function openMeteoToWeatherDay(day: DailyForecast): WeatherDay {
  return {
    date: day.date,
    tempMin: Math.round(day.tempMin),
    tempMax: Math.round(day.tempMax),
    humidity: 0,
    description: WMO_LABEL_MAP[day.weatherIcon] ?? day.weatherLabel,
    icon: '',
    windSpeed: Math.round((day.windSpeedMax / 3.6) * 10) / 10,
    pop: day.precipitationChance / 100,
  };
}

async function getWeatherViaOpenMeteo(
  destination: string,
  options?: WeatherForecastOptions,
): Promise<WeatherForecast> {
  const geo = await geocodeCity(destination);
  if (!geo) throw new Error(`Could not geocode "${destination}"`);

  const forecastDays = options?.days ?? 7;
  const result = await getOpenMeteoForecast(geo.latitude, geo.longitude, forecastDays);
  if (!result || result.days.length === 0) {
    throw new Error('Open-Meteo returned no forecast data');
  }

  let days = result.days.map(openMeteoToWeatherDay);
  if (options?.startDate) {
    const idx = days.findIndex((d) => d.date >= options.startDate!);
    if (idx > 0) days = days.slice(idx);
  }
  if (options?.days != null && options.days > 0) {
    days = days.slice(0, options.days);
  }

  return {
    current: {
      temp: Math.round(days[0]?.tempMax ?? 20),
      description: days[0]?.description ?? 'Unknown',
      icon: '',
      humidity: 0,
      windSpeed: days[0]?.windSpeed ?? 0,
    },
    days,
    packingHint: generatePackingHint(days),
  };
}

// ---------------------------------------------------------------------------
// Internal helpers (OpenWeatherMap — used when API key is present)
// ---------------------------------------------------------------------------

const API_KEY = process.env.EXPO_PUBLIC_OPENWEATHER_KEY ?? '';
const BASE = 'https://api.openweathermap.org';

interface GeoResult {
  lat: number;
  lon: number;
  name: string;
  country: string;
}

async function geocode(destination: string): Promise<GeoResult> {
  const url = `${BASE}/geo/1.0/direct?q=${encodeURIComponent(destination)}&limit=1&appid=${API_KEY}`;
  const res = await fetch(url);
  if (!res.ok) throw new Error(`Geocoding failed: ${res.status}`);
  const data: GeoResult[] = await res.json();
  if (!data.length) throw new Error(`No geocoding results for "${destination}"`);
  return data[0];
}

function iconUrl(code: string): string {
  return `https://openweathermap.org/img/wn/${code}@2x.png`;
}

function generatePackingHint(days: WeatherDay[]): string {
  if (days.length === 0) return 'Check local forecasts before packing.';

  const avgTemp =
    days.reduce((sum, d) => sum + (d.tempMax + d.tempMin) / 2, 0) / days.length;
  const maxPop = Math.max(...days.map((d) => d.pop));
  const maxWind = Math.max(...days.map((d) => d.windSpeed));

  const hints: string[] = [];

  if (avgTemp < 10) hints.push('Pack warm layers and a heavy coat');
  else if (avgTemp < 20) hints.push('Bring a light jacket and layers');
  else if (avgTemp > 30) hints.push('Pack breathable, lightweight clothing');
  else hints.push('Comfortable layers should work well');

  if (maxPop > 0.5) hints.push('bring an umbrella or rain jacket');
  else if (maxPop > 0.25) hints.push('a compact umbrella is a good idea');

  if (maxWind > 8) hints.push('expect some wind \u2014 a windbreaker helps');

  if (avgTemp > 25) hints.push("don't forget sunscreen and a hat");

  return hints.join('; ') + '.';
}

// ---------------------------------------------------------------------------
// Public API
// ---------------------------------------------------------------------------

/** Options for aligning forecast to trip dates */
export interface WeatherForecastOptions {
  /** Trip start date YYYY-MM-DD — aligns forecast days to trip (OpenWeatherMap returns next 5 days from today) */
  startDate?: string;
  /** Max days to return (default: all forecast days, up to 5) */
  days?: number;
}

/**
 * Fetch a 5-day weather forecast for a destination using OpenWeatherMap's
 * free-tier 5-day / 3-hour endpoint, aggregated into daily summaries.
 * When startDate is provided, aligns forecast to trip start (day 0 = startDate).
 */
export async function getWeatherForecast(
  destination: string,
  options?: WeatherForecastOptions
): Promise<WeatherForecast> {
  // Fall back to Open-Meteo (free, no API key) when OpenWeatherMap key is missing
  if (!API_KEY || API_KEY.trim() === '') {
    return getWeatherViaOpenMeteo(destination, options);
  }

  const { getCachedForecast, setCachedForecast } = await import('./weather-cache');
  const cached = await getCachedForecast(destination, options?.startDate);
  if (cached) return cached;

  const geo = await geocode(destination);

  // Current weather
  const currentUrl = `${BASE}/data/2.5/weather?lat=${geo.lat}&lon=${geo.lon}&units=metric&appid=${API_KEY}`;
  const currentRes = await fetch(currentUrl);
  if (!currentRes.ok) throw new Error(`Current weather failed: ${currentRes.status}`);
  const currentData = await currentRes.json();

  // 5-day / 3-hour forecast
  const forecastUrl = `${BASE}/data/2.5/forecast?lat=${geo.lat}&lon=${geo.lon}&units=metric&appid=${API_KEY}`;
  const forecastRes = await fetch(forecastUrl);
  if (!forecastRes.ok) throw new Error(`Forecast failed: ${forecastRes.status}`);
  const forecastData = await forecastRes.json();

  // Aggregate 3-hour slots into daily summaries
  const dailyMap = new Map<
    string,
    {
      temps: number[];
      humidity: number[];
      wind: number[];
      pop: number[];
      descs: string[];
      icons: string[];
    }
  >();

  for (const slot of forecastData.list) {
    const date = slot.dt_txt.split(' ')[0] as string;
    if (!dailyMap.has(date)) {
      dailyMap.set(date, {
        temps: [],
        humidity: [],
        wind: [],
        pop: [],
        descs: [],
        icons: [],
      });
    }
    const bucket = dailyMap.get(date)!;
    bucket.temps.push(slot.main.temp);
    bucket.humidity.push(slot.main.humidity);
    bucket.wind.push(slot.wind.speed);
    bucket.pop.push(slot.pop ?? 0);
    bucket.descs.push(slot.weather[0].description);
    bucket.icons.push(slot.weather[0].icon);
  }

  let days: WeatherDay[] = [];
  const sortedDates = [...dailyMap.keys()].sort();
  for (const date of sortedDates) {
    const bucket = dailyMap.get(date)!;
    // Pick the most common description
    const descFreq = new Map<string, number>();
    for (const d of bucket.descs) descFreq.set(d, (descFreq.get(d) ?? 0) + 1);
    const topDesc = [...descFreq.entries()].sort((a, b) => b[1] - a[1])[0][0];

    // Pick the most common icon (prefer daytime icons ending with 'd')
    const dayIcons = bucket.icons.filter((i) => i.endsWith('d'));
    const iconPool = dayIcons.length > 0 ? dayIcons : bucket.icons;
    const iconFreq = new Map<string, number>();
    for (const i of iconPool) iconFreq.set(i, (iconFreq.get(i) ?? 0) + 1);
    const topIcon = [...iconFreq.entries()].sort((a, b) => b[1] - a[1])[0][0];

    days.push({
      date,
      tempMin: Math.round(Math.min(...bucket.temps)),
      tempMax: Math.round(Math.max(...bucket.temps)),
      humidity: Math.round(
        bucket.humidity.reduce((a, b) => a + b, 0) / bucket.humidity.length
      ),
      description: topDesc,
      icon: iconUrl(topIcon),
      windSpeed: Math.round(Math.max(...bucket.wind) * 10) / 10,
      pop: Math.round(Math.max(...bucket.pop) * 100) / 100,
    });
  }

  // Align to startDate when provided (OpenWeatherMap returns next 5 days from today)
  if (options?.startDate && days.length > 0) {
    const today = new Date().toISOString().split('T')[0];
    const startIdx = days.findIndex((d) => d.date >= options.startDate!);
    if (startIdx >= 0) {
      days = days.slice(startIdx);
    }
  }
  if (options?.days != null && options.days > 0) {
    days = days.slice(0, options.days);
  }

  const packingHint = generatePackingHint(days);
  const forecast: WeatherForecast = {
    current: {
      temp: Math.round(currentData.main.temp),
      description: currentData.weather[0].description,
      icon: iconUrl(currentData.weather[0].icon),
      humidity: currentData.main.humidity,
      windSpeed: currentData.wind.speed,
    },
    days,
    packingHint,
  };
  await setCachedForecast(destination, forecast, options?.startDate);
  return forecast;
}

// ---------------------------------------------------------------------------
// Best months helper - static lookup (no API call)
// ---------------------------------------------------------------------------

const BEST_MONTHS: Record<string, string> = {
  tokyo: 'March\u2013May (cherry blossoms) or October\u2013November (autumn foliage)',
  paris: 'April\u2013June or September\u2013October (mild weather, fewer crowds)',
  bali: 'April\u2013October (dry season)',
  'new york': 'April\u2013June or September\u2013November',
  barcelona: 'May\u2013June or September\u2013October',
  rome: 'April\u2013June or September\u2013October',
  london: 'May\u2013September',
  bangkok: 'November\u2013February (cool, dry season)',
  marrakech: 'March\u2013May or September\u2013November',
  lisbon: 'March\u2013May or September\u2013October',
  'cape town': 'November\u2013March (Southern Hemisphere summer)',
  reykjavik: 'June\u2013August (midnight sun)',
  seoul: 'April\u2013May (spring) or September\u2013November (autumn)',
  'buenos aires': 'October\u2013December (Southern Hemisphere spring)',
  istanbul: 'April\u2013May or September\u2013November',
  sydney: 'September\u2013November or March\u2013May',
  'mexico city': 'March\u2013May (warm, dry)',
  dubai: 'November\u2013March (pleasant temperatures)',
  kyoto: 'March\u2013May (cherry blossoms) or October\u2013November (autumn)',
  amsterdam: 'April\u2013May (tulip season) or June\u2013August',
};

/**
 * Returns a human-readable recommendation for the best months to visit.
 * Falls back to a generic message for unknown destinations.
 */
export function getBestMonthsToVisit(destination: string): string {
  const key = destination.toLowerCase().trim();
  return (
    BEST_MONTHS[key] ??
    'Check local climate guides \u2014 shoulder seasons often offer the best balance of weather and crowds.'
  );
}
