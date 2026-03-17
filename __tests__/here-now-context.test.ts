/**
 * Test Suite: here-now-context — getTimeOfDay and getContextualMessage
 *
 * Pure functions only — no React hooks, no API calls.
 * CurrentWeather is constructed inline; Itinerary is null for most tests.
 */

import {
  getTimeOfDay,
  getContextualMessage,
  type TimeOfDay,
  type HereNowContext,
} from '../lib/here-now-context';
import type { CurrentWeather } from '../lib/apis/openweather';

// ---------------------------------------------------------------------------
// Fixture helpers
// ---------------------------------------------------------------------------

function makeWeather(overrides: Partial<CurrentWeather> = {}): CurrentWeather {
  return {
    temp: 22,
    feelsLike: 21,
    condition: 'Clear',
    icon: '01d',
    humidity: 55,
    windSpeed: 10,
    uvIndex: 4,
    ...overrides,
  };
}

function contextAt(hour: number, weather: CurrentWeather | null = null): HereNowContext {
  return getContextualMessage({
    destination: 'Tokyo',
    weather,
    hour,
    itinerary: null,
    currentDay: 0,
  });
}

// ---------------------------------------------------------------------------
// getTimeOfDay
// ---------------------------------------------------------------------------

describe('getTimeOfDay', () => {
  it('returns morning for hour 6', () => {
    expect(getTimeOfDay(6)).toBe('morning');
  });

  it('returns morning for hour 7', () => {
    expect(getTimeOfDay(7)).toBe('morning');
  });

  it('returns morning for hour 10 (upper morning boundary)', () => {
    expect(getTimeOfDay(10)).toBe('morning');
  });

  it('returns afternoon for hour 11 (lower afternoon boundary)', () => {
    expect(getTimeOfDay(11)).toBe('afternoon');
  });

  it('returns afternoon for hour 14', () => {
    expect(getTimeOfDay(14)).toBe('afternoon');
  });

  it('returns afternoon for hour 16 (upper afternoon boundary)', () => {
    expect(getTimeOfDay(16)).toBe('afternoon');
  });

  it('returns evening for hour 17 (lower evening boundary)', () => {
    expect(getTimeOfDay(17)).toBe('evening');
  });

  it('returns evening for hour 19', () => {
    expect(getTimeOfDay(19)).toBe('evening');
  });

  it('returns evening for hour 21 (upper evening boundary)', () => {
    expect(getTimeOfDay(21)).toBe('evening');
  });

  it('returns latenight for hour 22', () => {
    expect(getTimeOfDay(22)).toBe('latenight');
  });

  it('returns latenight for hour 2', () => {
    expect(getTimeOfDay(2)).toBe('latenight');
  });

  it('returns latenight for hour 0 (midnight)', () => {
    expect(getTimeOfDay(0)).toBe('latenight');
  });

  it('returns latenight for hour 5 (pre-dawn)', () => {
    expect(getTimeOfDay(5)).toBe('latenight');
  });
});

// ---------------------------------------------------------------------------
// getContextualMessage — greeting content
// ---------------------------------------------------------------------------

describe('getContextualMessage — morning greeting', () => {
  it('greeting starts with "Good morning"', () => {
    const ctx = contextAt(7);
    expect(ctx.greeting).toContain('Good morning');
  });

  it('greeting includes the destination', () => {
    const ctx = contextAt(9);
    expect(ctx.greeting).toContain('Tokyo');
  });

  it('mood is calm in the morning', () => {
    const ctx = contextAt(8);
    expect(ctx.mood).toBe('calm');
  });

  it('suggestion is a non-empty string', () => {
    const ctx = contextAt(7);
    expect(ctx.suggestion.length).toBeGreaterThan(0);
  });
});

describe('getContextualMessage — afternoon', () => {
  it('suggestion mentions golden hour', () => {
    const ctx = contextAt(14);
    // The afternoon path always injects a golden hour string
    expect(ctx.suggestion.toLowerCase()).toContain('golden hour');
  });

  it('mood is adventurous in the afternoon', () => {
    const ctx = contextAt(13);
    expect(ctx.mood).toBe('adventurous');
  });

  it('greeting mentions Afternoon', () => {
    const ctx = contextAt(15);
    expect(ctx.greeting).toContain('Afternoon');
  });
});

describe('getContextualMessage — evening', () => {
  it('mood is energetic in the evening', () => {
    const ctx = contextAt(19);
    expect(ctx.mood).toBe('energetic');
  });

  it('suggestion includes the destination when no itinerary', () => {
    const ctx = contextAt(20);
    expect(ctx.suggestion).toContain('Tokyo');
  });
});

describe('getContextualMessage — late night', () => {
  it('mood is reflective at late night', () => {
    const ctx = contextAt(2);
    expect(ctx.mood).toBe('reflective');
  });

  it('suggestion is non-empty at late night', () => {
    const ctx = contextAt(23);
    expect(ctx.suggestion.length).toBeGreaterThan(0);
  });
});

// ---------------------------------------------------------------------------
// getContextualMessage — timeInfo field
// ---------------------------------------------------------------------------

describe('getContextualMessage — timeInfo field', () => {
  it('returns a non-empty timeInfo string', () => {
    const ctx = contextAt(10);
    expect(ctx.timeInfo.length).toBeGreaterThan(0);
  });

  it('includes weather condition when weather is provided', () => {
    const ctx = getContextualMessage({
      destination: 'Tokyo',
      weather: makeWeather({ condition: 'Sunny' }),
      hour: 10,
      itinerary: null,
      currentDay: 0,
    });
    expect(ctx.timeInfo).toContain('Sunny');
  });
});

// ---------------------------------------------------------------------------
// getContextualMessage — weatherOverride
// ---------------------------------------------------------------------------

describe('getContextualMessage — weatherOverride', () => {
  it('sets weatherOverride when it is raining', () => {
    const ctx = getContextualMessage({
      destination: 'Tokyo',
      weather: makeWeather({ condition: 'Rain' }),
      hour: 14,
      itinerary: null,
      currentDay: 0,
    });
    expect(ctx.weatherOverride).toBeDefined();
    expect(ctx.weatherOverride).toContain('Tokyo');
  });

  it('weatherOverride for rain mentions indoor alternative', () => {
    const ctx = getContextualMessage({
      destination: 'Tokyo',
      weather: makeWeather({ condition: 'Heavy Rain' }),
      hour: 14,
      itinerary: null,
      currentDay: 0,
    });
    expect(ctx.weatherOverride?.toLowerCase()).toContain('indoor');
  });

  it('sets weatherOverride when temp is above 35°C', () => {
    const ctx = getContextualMessage({
      destination: 'Dubai',
      weather: makeWeather({ temp: 42, condition: 'Clear' }),
      hour: 14,
      itinerary: null,
      currentDay: 0,
    });
    expect(ctx.weatherOverride).toBeDefined();
    expect(ctx.weatherOverride).toContain('42');
  });

  it('weatherOverride for heat mentions heat warning', () => {
    const ctx = getContextualMessage({
      destination: 'Dubai',
      weather: makeWeather({ temp: 38, condition: 'Clear' }),
      hour: 12,
      itinerary: null,
      currentDay: 0,
    });
    expect(ctx.weatherOverride?.toLowerCase()).toContain('heat');
  });

  it('does NOT set weatherOverride when weather is null', () => {
    const ctx = getContextualMessage({
      destination: 'Tokyo',
      weather: null,
      hour: 14,
      itinerary: null,
      currentDay: 0,
    });
    expect(ctx.weatherOverride).toBeUndefined();
  });

  it('does NOT set weatherOverride for normal conditions (22°C Clear)', () => {
    const ctx = getContextualMessage({
      destination: 'Tokyo',
      weather: makeWeather({ temp: 22, condition: 'Clear' }),
      hour: 14,
      itinerary: null,
      currentDay: 0,
    });
    expect(ctx.weatherOverride).toBeUndefined();
  });

  it('sets weatherOverride for drizzle condition', () => {
    const ctx = getContextualMessage({
      destination: 'London',
      weather: makeWeather({ condition: 'Light Drizzle' }),
      hour: 10,
      itinerary: null,
      currentDay: 0,
    });
    expect(ctx.weatherOverride).toBeDefined();
  });
});

// ---------------------------------------------------------------------------
// getContextualMessage — return shape invariants
// ---------------------------------------------------------------------------

describe('getContextualMessage — return shape', () => {
  const hours = [0, 7, 11, 14, 19, 22];

  for (const hour of hours) {
    it(`returns a complete HereNowContext at hour ${hour}`, () => {
      const ctx = contextAt(hour);
      expect(typeof ctx.greeting).toBe('string');
      expect(typeof ctx.timeInfo).toBe('string');
      expect(typeof ctx.suggestion).toBe('string');
      expect(['calm', 'energetic', 'reflective', 'adventurous']).toContain(ctx.mood);
    });
  }
});
