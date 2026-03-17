// =============================================================================
// ROAM — Here Now Context Generator
// Generates time-of-day and weather-aware contextual messages for I Am Here Now.
// Pure functions only — no API calls, no hooks.
// =============================================================================

import type { CurrentWeather } from './apis/openweather';
import type { Itinerary } from './types/itinerary';

// ---------------------------------------------------------------------------
// Types
// ---------------------------------------------------------------------------

export type TimeOfDay = 'morning' | 'afternoon' | 'evening' | 'latenight';

export type HereNowContext = {
  greeting: string;
  timeInfo: string;
  suggestion: string;
  mood: 'calm' | 'energetic' | 'reflective' | 'adventurous';
  weatherOverride?: string;
};

// ---------------------------------------------------------------------------
// Helpers
// ---------------------------------------------------------------------------

function formatTime(hour: number, minute: number): string {
  const period = hour < 12 ? 'AM' : 'PM';
  const displayHour = hour % 12 === 0 ? 12 : hour % 12;
  const displayMin = String(minute).padStart(2, '0');
  return `${displayHour}:${displayMin} ${period}`;
}

function formatTemp(temp: number | undefined): string {
  if (temp === undefined || temp === null) return '';
  return `${Math.round(temp)}°C`;
}

/** Estimate minutes until sunset. Uses a fixed 18:45 default if no sunset data. */
function minutesUntilSunset(currentHour: number, currentMinute: number): { hours: number; minutes: number } {
  // Estimate sunset at 18:45 local time (reasonable midpoint across latitudes)
  const sunsetHour = 18;
  const sunsetMinute = 45;
  const totalNow = currentHour * 60 + currentMinute;
  const totalSunset = sunsetHour * 60 + sunsetMinute;
  const diff = Math.max(0, totalSunset - totalNow);
  return { hours: Math.floor(diff / 60), minutes: diff % 60 };
}

function buildWeatherOverride(destination: string, weather: CurrentWeather): string | undefined {
  const condition = weather.condition.toLowerCase();
  const isRaining = condition.includes('rain') || condition.includes('drizzle') || condition.includes('shower');

  if (isRaining) {
    return `Raining in ${destination} right now. Indoor alternative: find a cafe, museum, or covered market nearby.`;
  }
  if (weather.temp > 35) {
    return `Heat warning: ${Math.round(weather.temp)}°C in ${destination}. Stay hydrated, seek shade, and limit outdoor exposure midday.`;
  }
  if (weather.temp < 0) {
    return `Cold warning: ${Math.round(weather.temp)}°C in ${destination}. Layer up and watch for icy surfaces.`;
  }
  return undefined;
}

// ---------------------------------------------------------------------------
// Exports
// ---------------------------------------------------------------------------

/** Returns the time-of-day bucket for a given hour (0-23). */
export function getTimeOfDay(hour: number): TimeOfDay {
  if (hour >= 6 && hour < 11) return 'morning';
  if (hour >= 11 && hour < 17) return 'afternoon';
  if (hour >= 17 && hour < 22) return 'evening';
  return 'latenight';
}

/** Build a rich HereNowContext from live destination, weather, time, and itinerary. */
export function getContextualMessage(params: {
  destination: string;
  weather: CurrentWeather | null;
  hour: number;
  itinerary: Itinerary | null;
  currentDay: number;
}): HereNowContext {
  const { destination, weather, hour, itinerary, currentDay } = params;
  const minute = new Date().getMinutes();
  const timeOfDay = getTimeOfDay(hour);

  // Clamp to valid day index (0-based)
  const dayIndex = Math.max(0, currentDay);
  const day = itinerary?.days?.[dayIndex] ?? null;

  const tempStr = weather ? formatTemp(weather.temp) : '';
  const conditionStr = weather?.condition ?? '';
  const weatherPart = [tempStr, conditionStr].filter(Boolean).join(' · ');
  const timeStr = formatTime(hour, minute);
  const timeInfo = [timeStr, weatherPart].filter(Boolean).join(' · ');

  let greeting: string;
  let suggestion: string;
  let mood: HereNowContext['mood'];

  switch (timeOfDay) {
    case 'morning': {
      greeting = `Good morning in ${destination}.`;
      const morningActivity = day?.morning?.activity;
      const breakfastHint = day?.morning?.location || day?.morning?.tip;
      suggestion = breakfastHint
        ? `Breakfast idea: ${breakfastHint}`
        : morningActivity
          ? `Start your morning: ${morningActivity}`
          : `Start with a good breakfast nearby — ask the front desk for a local spot.`;
      mood = 'calm';
      break;
    }
    case 'afternoon': {
      greeting = `Afternoon in ${destination}.`;
      const { hours: h, minutes: m } = minutesUntilSunset(hour, minute);
      const goldenHourStr = h > 0
        ? `Golden hour in ${h}h ${m}m.`
        : m > 0 ? `Golden hour in ${m} minutes.` : `Golden hour is now.`;
      const afternoonActivity = day?.afternoon?.activity;
      const viewpointHint = afternoonActivity
        ? `Best spot this afternoon: ${afternoonActivity}`
        : `Scout a viewpoint before the light fades.`;
      suggestion = `${goldenHourStr} ${viewpointHint}`;
      mood = 'adventurous';
      break;
    }
    case 'evening': {
      greeting = `The city shifts.`;
      const eveningActivity = day?.evening?.activity;
      suggestion = eveningActivity
        ? `Tonight: ${eveningActivity}`
        : `${destination} at night has its own energy — follow it.`;
      mood = 'energetic';
      break;
    }
    case 'latenight': {
      greeting = `Still going.`;
      suggestion = day?.evening?.tip
        ? `Late-night tip: ${day.evening.tip}`
        : `The best late-night spots in ${destination} rarely have signs.`;
      mood = 'reflective';
      break;
    }
  }

  const weatherOverride = weather ? buildWeatherOverride(destination, weather) : undefined;

  return {
    greeting,
    timeInfo,
    suggestion,
    mood,
    ...(weatherOverride !== undefined ? { weatherOverride } : {}),
  };
}
