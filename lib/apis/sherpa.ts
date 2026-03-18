// ROAM — Sherpa Visa/Entry Requirements Client (via travel-proxy edge function)
import AsyncStorage from '@react-native-async-storage/async-storage';
import { supabase } from '../supabase';
import { ensureValidSession } from '../ensure-session';

// ---------------------------------------------------------------------------
// Types
// ---------------------------------------------------------------------------

export interface VisaResult {
  visaType: 'visa_free' | 'visa_on_arrival' | 'e_visa' | 'visa_required';
  maxStay: number | null; // days
  processingTime: string | null;
  documentsNeeded: string[];
  officialLink: string | null;
  notes: string | null;
}

export interface EntryRequirements {
  destination: string;
  covidRestrictions: string | null;
  healthDeclaration: boolean;
  insuranceRequired: boolean;
  customsForms: string | null;
  currencyRestrictions: string | null;
  notes: string[];
}

// ---------------------------------------------------------------------------
// Cache constants
// ---------------------------------------------------------------------------

const CACHE_PREFIX = 'roam_sherpa_';
const TTL = 24 * 60 * 60 * 1000; // 24 hours

// ---------------------------------------------------------------------------
// Cache helpers
// ---------------------------------------------------------------------------

async function readCache<T>(key: string): Promise<T | null> {
  try {
    const raw = await AsyncStorage.getItem(CACHE_PREFIX + key);
    if (!raw) return null;
    const { data, fetchedAt } = JSON.parse(raw) as { data: T; fetchedAt: number };
    if (Date.now() - fetchedAt > TTL) return null;
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
// Session guard — shared via lib/ensure-session.ts
// ---------------------------------------------------------------------------

// ---------------------------------------------------------------------------
// Public API
// ---------------------------------------------------------------------------

export async function getVisaRequirements(
  passportCountry: string,
  destinationCountry: string,
): Promise<VisaResult | null> {
  const cacheKey = `visa_${passportCountry}_${destinationCountry}`;
  const cached = await readCache<VisaResult>(cacheKey);
  if (cached) return cached;

  if (!(await ensureValidSession())) return null;

  try {
    const { data, error } = await supabase.functions.invoke('travel-proxy', {
      body: {
        provider: 'sherpa',
        action: 'visa_requirements',
        params: { passportCountry, destinationCountry },
      },
    });
    if (error || !data?.data) return null;

    const visa = data.data as VisaResult;
    await writeCache(cacheKey, visa);
    return visa;
  } catch {
    return null;
  }
}

export async function getEntryRequirements(
  destination: string,
): Promise<EntryRequirements | null> {
  const cacheKey = `entry_${destination}`;
  const cached = await readCache<EntryRequirements>(cacheKey);
  if (cached) return cached;

  if (!(await ensureValidSession())) return null;

  try {
    const { data, error } = await supabase.functions.invoke('travel-proxy', {
      body: {
        provider: 'sherpa',
        action: 'entry_requirements',
        params: { destination },
      },
    });
    if (error || !data?.data) return null;

    const entry = data.data as EntryRequirements;
    await writeCache(cacheKey, entry);
    return entry;
  } catch {
    return null;
  }
}
