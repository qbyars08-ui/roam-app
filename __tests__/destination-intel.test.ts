/**
 * Tests for DestinationIntelCard dependency modules.
 *
 * DestinationIntelCard (app/(tabs)/prep.tsx) is a private, non-exported component.
 * Its business logic lives entirely in these dependency modules — testing them
 * gives full coverage of the component's data pipeline:
 *
 *   getTimezoneByDestination  ← lib/timezone.ts
 *   getCountryCode            ← lib/public-holidays.ts
 *   getPublicHolidays         ← lib/public-holidays.ts
 *   geocodeCity               ← lib/geocoding.ts
 *   getWeatherForecast        ← lib/weather-forecast.ts
 *   getExchangeRates          ← lib/exchange-rates.ts
 */
import AsyncStorage from '@react-native-async-storage/async-storage';

import { getTimezoneByDestination } from '../lib/timezone';
import {
  getCountryCode,
  getPublicHolidays,
  getHolidaysDuringTrip,
  type PublicHoliday,
} from '../lib/public-holidays';
import { geocodeCity } from '../lib/geocoding';
import { getWeatherForecast, type DailyForecast } from '../lib/weather-forecast';
import {
  getExchangeRates,
  convertCurrency,
  type ExchangeRateData,
} from '../lib/exchange-rates';

// ---------------------------------------------------------------------------
// Global fetch mock (used by geocodeCity, getWeatherForecast, getExchangeRates,
// getPublicHolidays)
// ---------------------------------------------------------------------------

const mockFetch = jest.fn();
(global as any).fetch = mockFetch;

beforeEach(() => {
  jest.clearAllMocks();
  (AsyncStorage.getItem as jest.Mock).mockResolvedValue(null);
  (AsyncStorage.setItem as jest.Mock).mockResolvedValue(undefined);
  mockFetch.mockReset();
});

// ===========================================================================
// getTimezoneByDestination (lib/timezone.ts)
// ===========================================================================

describe('getTimezoneByDestination', () => {
  it('returns Asia/Tokyo for "Tokyo"', () => {
    expect(getTimezoneByDestination('Tokyo')).toBe('Asia/Tokyo');
  });

  it('returns Asia/Tokyo for "Kyoto"', () => {
    expect(getTimezoneByDestination('Kyoto')).toBe('Asia/Tokyo');
  });

  it('returns Europe/Paris for "Paris"', () => {
    expect(getTimezoneByDestination('Paris')).toBe('Europe/Paris');
  });

  it('returns Europe/London for "London"', () => {
    expect(getTimezoneByDestination('London')).toBe('Europe/London');
  });

  it('returns America/New_York for "New York"', () => {
    expect(getTimezoneByDestination('New York')).toBe('America/New_York');
  });

  it('returns Australia/Sydney for "Sydney"', () => {
    expect(getTimezoneByDestination('Sydney')).toBe('Australia/Sydney');
  });

  it('returns Africa/Johannesburg for "Cape Town"', () => {
    expect(getTimezoneByDestination('Cape Town')).toBe('Africa/Johannesburg');
  });

  it('returns null for unknown destinations', () => {
    expect(getTimezoneByDestination('Atlantis')).toBeNull();
  });

  it('returns null for empty string', () => {
    expect(getTimezoneByDestination('')).toBeNull();
  });

  it('is case-insensitive (TOKYO → Asia/Tokyo)', () => {
    expect(getTimezoneByDestination('TOKYO')).toBe('Asia/Tokyo');
  });

  it('trims whitespace before lookup', () => {
    expect(getTimezoneByDestination('  paris  ')).toBe('Europe/Paris');
  });

  it('Medellín variant is handled', () => {
    const tz = getTimezoneByDestination('Medellín');
    expect(tz).not.toBeNull();
  });
});

// ===========================================================================
// getCountryCode (lib/public-holidays.ts)
// ===========================================================================

describe('getCountryCode', () => {
  it('returns JP for Tokyo', () => {
    expect(getCountryCode('Tokyo')).toBe('JP');
  });

  it('returns FR for Paris', () => {
    expect(getCountryCode('Paris')).toBe('FR');
  });

  it('returns ID for Bali', () => {
    expect(getCountryCode('Bali')).toBe('ID');
  });

  it('returns TH for Bangkok', () => {
    expect(getCountryCode('Bangkok')).toBe('TH');
  });

  it('returns GB for London', () => {
    expect(getCountryCode('London')).toBe('GB');
  });

  it('returns ES for Barcelona', () => {
    expect(getCountryCode('Barcelona')).toBe('ES');
  });

  it('returns IT for Rome', () => {
    expect(getCountryCode('Rome')).toBe('IT');
  });

  it('returns KR for Seoul', () => {
    expect(getCountryCode('Seoul')).toBe('KR');
  });

  it('returns null for unknown destination', () => {
    expect(getCountryCode('Atlantis')).toBeNull();
  });

  it('is case-insensitive', () => {
    expect(getCountryCode('TOKYO')).toBe('JP');
    expect(getCountryCode('paris')).toBe('FR');
  });

  it('trims whitespace', () => {
    expect(getCountryCode('  Bali  ')).toBe('ID');
  });
});

// ===========================================================================
// getPublicHolidays (lib/public-holidays.ts)
// ===========================================================================

describe('getPublicHolidays', () => {
  it('returns holidays from API on cache miss', async () => {
    const mockHolidays = [
      { date: '2026-05-03', name: 'Constitution Day', localName: 'Kenpou Kinenbi', fixed: true, global: true },
      { date: '2026-05-04', name: 'Greenery Day', localName: 'Midori no Hi', fixed: true, global: true },
    ];
    mockFetch.mockResolvedValueOnce({
      ok: true,
      json: async () => mockHolidays,
    });

    const result = await getPublicHolidays('JP', 2026);
    expect(result).toHaveLength(2);
    expect(result[0].name).toBe('Constitution Day');
    expect(result[0].date).toBe('2026-05-03');
  });

  it('returns cached holidays when cache is valid', async () => {
    const cached = {
      holidays: [{ date: '2026-01-01', name: 'New Year', localName: 'お正月', isFixed: true, isGlobal: true }],
      fetchedAt: Date.now(),
    };
    (AsyncStorage.getItem as jest.Mock).mockResolvedValueOnce(JSON.stringify(cached));

    const result = await getPublicHolidays('JP');
    expect(result[0].name).toBe('New Year');
    expect(mockFetch).not.toHaveBeenCalled();
  });

  it('returns [] on API error', async () => {
    mockFetch.mockResolvedValueOnce({ ok: false, status: 500 });
    const result = await getPublicHolidays('XX');
    expect(result).toEqual([]);
  });

  it('returns [] on network throw', async () => {
    mockFetch.mockRejectedValueOnce(new Error('network fail'));
    const result = await getPublicHolidays('JP');
    expect(result).toEqual([]);
  });

  it('re-fetches when cached data is stale', async () => {
    const stale = {
      holidays: [{ date: '2025-01-01', name: 'Old New Year', localName: '', isFixed: true, isGlobal: true }],
      fetchedAt: Date.now() - 8 * 24 * 60 * 60 * 1000, // 8 days ago (TTL = 7 days)
    };
    (AsyncStorage.getItem as jest.Mock).mockResolvedValueOnce(JSON.stringify(stale));
    mockFetch.mockResolvedValueOnce({
      ok: true,
      json: async () => [{ date: '2026-01-01', name: 'New Year 2026', localName: '', fixed: true, global: true }],
    });

    const result = await getPublicHolidays('JP');
    expect(result[0].name).toBe('New Year 2026');
  });
});

// ===========================================================================
// getHolidaysDuringTrip (lib/public-holidays.ts)
// ===========================================================================

describe('getHolidaysDuringTrip', () => {
  const holidays: PublicHoliday[] = [
    { date: '2026-05-01', name: 'Labour Day', localName: 'Labour Day', isFixed: true, isGlobal: true },
    { date: '2026-05-15', name: 'Mid-trip Day', localName: 'Mid', isFixed: false, isGlobal: false },
    { date: '2026-06-01', name: 'After Trip', localName: 'After', isFixed: true, isGlobal: true },
  ];

  it('returns holidays within the trip date range', () => {
    // Trip: May 1–10
    const result = getHolidaysDuringTrip(holidays, '2026-05-01', 10);
    expect(result.some((h) => h.name === 'Labour Day')).toBe(true);
  });

  it('excludes holidays after the trip ends', () => {
    // Trip: May 1–10 — Mid-trip Day (May 15) should be excluded
    const result = getHolidaysDuringTrip(holidays, '2026-05-01', 10);
    expect(result.some((h) => h.name === 'Mid-trip Day')).toBe(false);
  });

  it('returns empty array when no holidays in range', () => {
    const result = getHolidaysDuringTrip(holidays, '2026-07-01', 5);
    expect(result).toHaveLength(0);
  });
});

// ===========================================================================
// geocodeCity (lib/geocoding.ts)
// ===========================================================================

describe('geocodeCity', () => {
  it('returns cached result when cache is valid', async () => {
    const cached = {
      name: 'Tokyo',
      latitude: 35.6762,
      longitude: 139.6503,
      elevation: 40,
      timezone: 'Asia/Tokyo',
      countryCode: 'JP',
      country: 'Japan',
      population: 13960000,
      fetchedAt: Date.now(),
    };
    (AsyncStorage.getItem as jest.Mock).mockResolvedValueOnce(JSON.stringify(cached));

    const result = await geocodeCity('Tokyo');
    expect(result?.latitude).toBeCloseTo(35.6762);
    expect(result?.countryCode).toBe('JP');
    expect(mockFetch).not.toHaveBeenCalled();
  });

  it('fetches from API on cache miss and returns result', async () => {
    mockFetch.mockResolvedValueOnce({
      ok: true,
      json: async () => ({
        results: [{
          name: 'Paris',
          latitude: 48.8566,
          longitude: 2.3522,
          elevation: 35,
          timezone: 'Europe/Paris',
          country_code: 'FR',
          country: 'France',
          population: 2161000,
        }],
      }),
    });

    const result = await geocodeCity('Paris');
    expect(result?.name).toBe('Paris');
    expect(result?.latitude).toBeCloseTo(48.8566);
    expect(result?.countryCode).toBe('FR');
  });

  it('returns null on API error', async () => {
    mockFetch.mockResolvedValueOnce({ ok: false, status: 404 });
    expect(await geocodeCity('Nonexistent City')).toBeNull();
  });

  it('returns null when API returns no results', async () => {
    mockFetch.mockResolvedValueOnce({
      ok: true,
      json: async () => ({ results: [] }),
    });
    expect(await geocodeCity('Nowhere')).toBeNull();
  });

  it('returns null on network error', async () => {
    mockFetch.mockRejectedValueOnce(new Error('network fail'));
    expect(await geocodeCity('Tokyo')).toBeNull();
  });

  it('normalises city name to lowercase before cache key', async () => {
    const cached = {
      name: 'TOKYO',
      latitude: 35.67,
      longitude: 139.65,
      elevation: 0,
      timezone: 'Asia/Tokyo',
      countryCode: 'JP',
      country: 'Japan',
      population: 0,
      fetchedAt: Date.now(),
    };
    (AsyncStorage.getItem as jest.Mock).mockResolvedValueOnce(JSON.stringify(cached));
    // TOKYO should normalise to 'tokyo' cache key and hit cache
    const result = await geocodeCity('TOKYO');
    expect(result).not.toBeNull();
    expect(mockFetch).not.toHaveBeenCalled();
  });
});

// ===========================================================================
// getWeatherForecast (lib/weather-forecast.ts)
// ===========================================================================

describe('getWeatherForecast', () => {
  it('returns forecast from API on cache miss', async () => {
    mockFetch.mockResolvedValueOnce({
      ok: true,
      json: async () => ({
        daily: {
          time: ['2026-04-01', '2026-04-02'],
          temperature_2m_max: [22, 18],
          temperature_2m_min: [12, 10],
          precipitation_probability_max: [10, 80],
          weathercode: [1, 61],
          uv_index_max: [3, 1],
          wind_speed_10m_max: [15, 25],
        },
      }),
    });

    const result = await getWeatherForecast(35.68, 139.65);
    expect(result).not.toBeNull();
    expect(result!.days).toHaveLength(2);
    expect(result!.days[0].tempMax).toBe(22);
    expect(result!.days[0].tempMin).toBe(12);
    expect(result!.days[0].precipitationChance).toBe(10);
  });

  it('returns cached forecast when valid', async () => {
    const cached = {
      days: [{ date: '2026-04-01', tempMax: 20, tempMin: 10, precipitationChance: 5, weatherCode: 0, weatherLabel: 'Clear sky', weatherIcon: 'Sun', uvIndexMax: 4, uvLabel: 'Moderate', windSpeedMax: 12 }],
      fetchedAt: Date.now(),
    };
    (AsyncStorage.getItem as jest.Mock).mockResolvedValueOnce(JSON.stringify(cached));

    const result = await getWeatherForecast(35.68, 139.65);
    expect(result!.days[0].weatherLabel).toBe('Clear sky');
    expect(mockFetch).not.toHaveBeenCalled();
  });

  it('returns null on API failure', async () => {
    mockFetch.mockResolvedValueOnce({ ok: false, status: 500 });
    expect(await getWeatherForecast(0, 0)).toBeNull();
  });

  it('returns null when daily data is missing', async () => {
    mockFetch.mockResolvedValueOnce({
      ok: true,
      json: async () => ({ error: true }),
    });
    expect(await getWeatherForecast(35, 139)).toBeNull();
  });

  it('returns null on network error', async () => {
    mockFetch.mockRejectedValueOnce(new Error('fetch failed'));
    expect(await getWeatherForecast(35, 139)).toBeNull();
  });

  it('maps WMO code 0 to "Clear sky"', async () => {
    mockFetch.mockResolvedValueOnce({
      ok: true,
      json: async () => ({
        daily: {
          time: ['2026-04-01'],
          temperature_2m_max: [25],
          temperature_2m_min: [15],
          precipitation_probability_max: [0],
          weathercode: [0],
          uv_index_max: [5],
          wind_speed_10m_max: [10],
        },
      }),
    });
    const result = await getWeatherForecast(0, 0);
    expect(result!.days[0].weatherLabel).toBe('Clear sky');
    expect(result!.days[0].weatherIcon).toBe('Sun');
  });

  it('maps WMO code 95 to "Thunderstorm"', async () => {
    mockFetch.mockResolvedValueOnce({
      ok: true,
      json: async () => ({
        daily: {
          time: ['2026-04-01'],
          temperature_2m_max: [18],
          temperature_2m_min: [12],
          precipitation_probability_max: [90],
          weathercode: [95],
          uv_index_max: [1],
          wind_speed_10m_max: [45],
        },
      }),
    });
    const result = await getWeatherForecast(0, 0);
    expect(result!.days[0].weatherLabel).toBe('Thunderstorm');
  });
});

// ===========================================================================
// getExchangeRates + convertCurrency (lib/exchange-rates.ts)
// ===========================================================================

describe('getExchangeRates', () => {
  it('returns rates from API on cache miss', async () => {
    mockFetch.mockResolvedValueOnce({
      ok: true,
      json: async () => ({
        base: 'USD',
        date: '2026-03-14',
        rates: { EUR: 0.92, JPY: 149.5, GBP: 0.79 },
      }),
    });

    const result = await getExchangeRates('USD');
    expect(result).not.toBeNull();
    expect(result!.rates.JPY).toBeCloseTo(149.5);
    expect(result!.base).toBe('USD');
  });

  it('returns cached rates when valid', async () => {
    const cached = {
      base: 'USD',
      date: '2026-03-14',
      rates: { EUR: 0.91, JPY: 148 },
      fetchedAt: Date.now(),
    };
    (AsyncStorage.getItem as jest.Mock).mockResolvedValueOnce(JSON.stringify(cached));

    const result = await getExchangeRates('USD');
    expect(result!.rates.EUR).toBe(0.91);
    expect(mockFetch).not.toHaveBeenCalled();
  });

  it('returns null on API failure', async () => {
    mockFetch.mockResolvedValueOnce({ ok: false, status: 503 });
    expect(await getExchangeRates('USD')).toBeNull();
  });

  it('returns null when API returns no rates field', async () => {
    mockFetch.mockResolvedValueOnce({
      ok: true,
      json: async () => ({ message: 'not found' }),
    });
    expect(await getExchangeRates('USD')).toBeNull();
  });

  it('returns null on network error', async () => {
    mockFetch.mockRejectedValueOnce(new Error('network down'));
    expect(await getExchangeRates()).toBeNull();
  });
});

describe('convertCurrency', () => {
  const rates: ExchangeRateData = {
    base: 'USD',
    date: '2026-03-14',
    rates: { EUR: 0.92, JPY: 149.5, GBP: 0.79 },
    fetchedAt: Date.now(),
  };

  it('converts USD → JPY correctly', () => {
    expect(convertCurrency(1, 'USD', 'JPY', rates)).toBeCloseTo(149.5);
  });

  it('converts USD → EUR correctly', () => {
    expect(convertCurrency(100, 'USD', 'EUR', rates)).toBeCloseTo(92);
  });

  it('returns same amount when from === to', () => {
    expect(convertCurrency(50, 'USD', 'USD', rates)).toBe(50);
  });

  it('returns null when target currency not in rates', () => {
    expect(convertCurrency(10, 'USD', 'XYZ', rates)).toBeNull();
  });

  it('converts cross-rates via base (JPY → EUR)', () => {
    // Should convert JPY → USD → EUR
    const result = convertCurrency(149.5, 'JPY', 'EUR', rates);
    expect(result).not.toBeNull();
    expect(result!).toBeCloseTo(0.92, 1);
  });
});
