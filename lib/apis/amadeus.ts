// ROAM — Amadeus Flights API Client (via flights-proxy edge function)
import AsyncStorage from '@react-native-async-storage/async-storage';
import { supabase } from '../supabase';

// ---------------------------------------------------------------------------
// Types
// ---------------------------------------------------------------------------

export interface FlightOffer {
  id: string;
  price: string;
  currency: string;
  airline: string;
  airlineLogo: string | null;
  duration: string;
  stops: number;
  departureTime: string;
  arrivalTime: string;
  origin: string;
  destination: string;
  bookingLink: string;
}

export interface PriceCalendarDay {
  date: string;
  price: number;
  currency: string;
  isLowest: boolean;
}

export interface CheapDate {
  departureDate: string;
  returnDate: string;
  price: number;
  currency: string;
}

// ---------------------------------------------------------------------------
// Cache constants
// ---------------------------------------------------------------------------

const CACHE_PREFIX = 'roam_flights_';
const TTL_SEARCH = 30 * 60 * 1000;       // 30 minutes
const TTL_CALENDAR = 24 * 60 * 60 * 1000; // 24 hours

// ---------------------------------------------------------------------------
// Cache helpers
// ---------------------------------------------------------------------------

async function readCache<T>(key: string, ttl: number): Promise<T | null> {
  try {
    const raw = await AsyncStorage.getItem(CACHE_PREFIX + key);
    if (!raw) return null;
    const { data, fetchedAt } = JSON.parse(raw) as { data: T; fetchedAt: number };
    if (Date.now() - fetchedAt > ttl) return null;
    return data;
  } catch {
    return null;
  }
}

async function writeCache<T>(key: string, data: T): Promise<void> {
  try {
    await AsyncStorage.setItem(
      CACHE_PREFIX + key,
      JSON.stringify({ data, fetchedAt: Date.now() }),
    );
  } catch {
    // non-fatal
  }
}

// ---------------------------------------------------------------------------
// Session guard
// ---------------------------------------------------------------------------

async function ensureSession(): Promise<boolean> {
  try {
    const { data } = await supabase.auth.getSession();
    return !!data.session;
  } catch {
    return false;
  }
}

// ---------------------------------------------------------------------------
// Public API
// ---------------------------------------------------------------------------

export async function searchFlights(
  origin: string,
  destination: string,
  date: string,
  passengers: number = 1,
): Promise<FlightOffer[] | null> {
  const cacheKey = `search_${origin}_${destination}_${date}_${passengers}`;
  const cached = await readCache<FlightOffer[]>(cacheKey, TTL_SEARCH);
  if (cached) return cached;

  if (!(await ensureSession())) return null;

  try {
    const { data, error } = await supabase.functions.invoke('flights-proxy', {
      body: { action: 'search_flights', origin, destination, date, passengers },
    });
    if (error || !data?.offers) return null;

    const offers = data.offers as FlightOffer[];
    await writeCache(cacheKey, offers);
    return offers;
  } catch {
    return null;
  }
}

export async function getFlightPriceCalendar(
  origin: string,
  destination: string,
  month: string,
): Promise<PriceCalendarDay[] | null> {
  const cacheKey = `calendar_${origin}_${destination}_${month}`;
  const cached = await readCache<PriceCalendarDay[]>(cacheKey, TTL_CALENDAR);
  if (cached) return cached;

  if (!(await ensureSession())) return null;

  try {
    const { data, error } = await supabase.functions.invoke('flights-proxy', {
      body: { action: 'price_calendar', origin, destination, month },
    });
    if (error || !data?.days) return null;

    const days = data.days as PriceCalendarDay[];
    await writeCache(cacheKey, days);
    return days;
  } catch {
    return null;
  }
}

export async function getCheapestDates(
  origin: string,
  destination: string,
): Promise<CheapDate[] | null> {
  const cacheKey = `cheapdates_${origin}_${destination}`;
  const cached = await readCache<CheapDate[]>(cacheKey, TTL_CALENDAR);
  if (cached) return cached;

  if (!(await ensureSession())) return null;

  try {
    const { data, error } = await supabase.functions.invoke('flights-proxy', {
      body: { action: 'cheapest_dates', origin, destination },
    });
    if (error || !data?.dates) return null;

    const dates = data.dates as CheapDate[];
    await writeCache(cacheKey, dates);
    return dates;
  } catch {
    return null;
  }
}
