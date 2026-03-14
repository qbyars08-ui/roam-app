// =============================================================================
// ROAM — Weather Forecast (free, no API key)
// Uses Open-Meteo Weather Forecast API — completely free, no registration
// =============================================================================
import AsyncStorage from '@react-native-async-storage/async-storage';

export interface DailyForecast {
  date: string;              // YYYY-MM-DD
  tempMax: number;           // Celsius
  tempMin: number;           // Celsius
  precipitationChance: number; // 0-100 %
  weatherCode: number;       // WMO code
  weatherLabel: string;      // Human-readable label
  weatherIcon: string;       // Icon name (lucide-react-native compatible)
  uvIndexMax: number;        // 0-11+
  uvLabel: string;           // 'Low' | 'Moderate' | 'High' | 'Very High' | 'Extreme'
  windSpeedMax: number;      // km/h
}

export interface WeatherForecast {
  days: DailyForecast[];
  fetchedAt: number;
}

const CACHE_KEY = 'roam_weather_forecast';
const CACHE_TTL = 3 * 60 * 60 * 1000; // 3 hours

const WMO_CODES: Record<number, { label: string; icon: string }> = {
  0:  { label: 'Clear sky',          icon: 'Sun' },
  1:  { label: 'Mainly clear',       icon: 'Sun' },
  2:  { label: 'Partly cloudy',      icon: 'CloudSun' },
  3:  { label: 'Overcast',           icon: 'Cloud' },
  45: { label: 'Fog',                icon: 'CloudFog' },
  48: { label: 'Rime fog',           icon: 'CloudFog' },
  51: { label: 'Light drizzle',      icon: 'CloudDrizzle' },
  53: { label: 'Moderate drizzle',   icon: 'CloudDrizzle' },
  55: { label: 'Dense drizzle',      icon: 'CloudDrizzle' },
  56: { label: 'Freezing drizzle',   icon: 'CloudSnow' },
  57: { label: 'Heavy freezing drizzle', icon: 'CloudSnow' },
  61: { label: 'Slight rain',        icon: 'CloudRain' },
  63: { label: 'Moderate rain',      icon: 'CloudRain' },
  65: { label: 'Heavy rain',         icon: 'CloudRainWind' },
  66: { label: 'Freezing rain',      icon: 'CloudSnow' },
  67: { label: 'Heavy freezing rain', icon: 'CloudSnow' },
  71: { label: 'Slight snow',        icon: 'Snowflake' },
  73: { label: 'Moderate snow',      icon: 'Snowflake' },
  75: { label: 'Heavy snow',         icon: 'Snowflake' },
  77: { label: 'Snow grains',        icon: 'Snowflake' },
  80: { label: 'Slight showers',     icon: 'CloudRain' },
  81: { label: 'Moderate showers',   icon: 'CloudRain' },
  82: { label: 'Violent showers',    icon: 'CloudRainWind' },
  85: { label: 'Slight snow showers', icon: 'Snowflake' },
  86: { label: 'Heavy snow showers', icon: 'Snowflake' },
  95: { label: 'Thunderstorm',       icon: 'CloudLightning' },
  96: { label: 'Thunderstorm with hail', icon: 'CloudLightning' },
  99: { label: 'Thunderstorm with heavy hail', icon: 'CloudLightning' },
};

function getWeatherInfo(code: number): { label: string; icon: string } {
  return WMO_CODES[code] ?? { label: 'Unknown', icon: 'Cloud' };
}

function getUvLabel(uv: number): string {
  if (uv <= 2) return 'Low';
  if (uv <= 5) return 'Moderate';
  if (uv <= 7) return 'High';
  if (uv <= 10) return 'Very High';
  return 'Extreme';
}

export async function getWeatherForecast(
  lat: number,
  lng: number,
  forecastDays = 7,
): Promise<WeatherForecast | null> {
  const cacheKey = `${CACHE_KEY}::${lat.toFixed(2)}_${lng.toFixed(2)}_${forecastDays}`;

  try {
    const cached = await AsyncStorage.getItem(cacheKey);
    if (cached) {
      const parsed: WeatherForecast = JSON.parse(cached);
      if (Date.now() - parsed.fetchedAt < CACHE_TTL) {
        return parsed;
      }
    }
  } catch {
    // Cache miss
  }

  try {
    const params = [
      `latitude=${lat}`,
      `longitude=${lng}`,
      `daily=temperature_2m_max,temperature_2m_min,precipitation_probability_max,weathercode,uv_index_max,wind_speed_10m_max`,
      `forecast_days=${Math.min(forecastDays, 16)}`,
      `timezone=auto`,
    ].join('&');

    const url = `https://api.open-meteo.com/v1/forecast?${params}`;
    const response = await fetch(url);
    if (!response.ok) return null;

    const data = await response.json();
    const daily = data.daily;
    if (!daily || !daily.time) return null;

    const days: DailyForecast[] = daily.time.map((date: string, i: number) => {
      const code = daily.weathercode?.[i] ?? 0;
      const info = getWeatherInfo(code);
      const uv = daily.uv_index_max?.[i] ?? 0;

      return {
        date,
        tempMax: daily.temperature_2m_max?.[i] ?? 0,
        tempMin: daily.temperature_2m_min?.[i] ?? 0,
        precipitationChance: daily.precipitation_probability_max?.[i] ?? 0,
        weatherCode: code,
        weatherLabel: info.label,
        weatherIcon: info.icon,
        uvIndexMax: uv,
        uvLabel: getUvLabel(uv),
        windSpeedMax: daily.wind_speed_10m_max?.[i] ?? 0,
      };
    });

    const result: WeatherForecast = { days, fetchedAt: Date.now() };

    try {
      await AsyncStorage.setItem(cacheKey, JSON.stringify(result));
    } catch {
      // Non-critical
    }

    return result;
  } catch {
    return null;
  }
}

/**
 * Get a short packing suggestion based on forecast conditions.
 */
export function getPackingSuggestions(forecast: WeatherForecast): string[] {
  const suggestions: string[] = [];
  const maxTemp = Math.max(...forecast.days.map((d) => d.tempMax));
  const minTemp = Math.min(...forecast.days.map((d) => d.tempMin));
  const maxRain = Math.max(...forecast.days.map((d) => d.precipitationChance));
  const maxUv = Math.max(...forecast.days.map((d) => d.uvIndexMax));
  const hasSnow = forecast.days.some((d) =>
    [71, 73, 75, 77, 85, 86].includes(d.weatherCode),
  );

  if (maxTemp > 30) suggestions.push('Lightweight, breathable clothing');
  if (minTemp < 10) suggestions.push('Warm layers and a jacket');
  if (minTemp < 0) suggestions.push('Heavy winter coat, gloves, and hat');
  if (maxRain > 50) suggestions.push('Rain jacket or umbrella');
  if (maxUv > 5) suggestions.push('Sunscreen SPF 50+ and sunglasses');
  if (maxUv > 7) suggestions.push('Wide-brim hat for UV protection');
  if (hasSnow) suggestions.push('Waterproof boots');

  if (suggestions.length === 0) {
    suggestions.push('Light layers for comfortable weather');
  }

  return suggestions;
}
