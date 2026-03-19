// =============================================================================
// ROAM — Travel Accounts (Airlines, Hotels, Loyalty, Rental)
// Connect your travel accounts so ROAM becomes your single travel hub.
// =============================================================================
import { useState, useEffect, useCallback } from 'react';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { supabase } from './supabase';
import { useAppStore } from './store';

// ---------------------------------------------------------------------------
// Types
// ---------------------------------------------------------------------------
export type AccountType = 'airline' | 'hotel' | 'loyalty' | 'rental';

export type TravelAccount = {
  readonly id: string;
  readonly provider: string;
  readonly accountType: AccountType;
  readonly displayName: string;
  readonly memberNumber?: string;
  readonly tier?: string;
  readonly miles?: number;
  readonly points?: number;
  readonly linkedAt: string;
};

// ---------------------------------------------------------------------------
// Supported Providers
// ---------------------------------------------------------------------------
type ProviderDef = {
  readonly name: string;
  readonly accountType: AccountType;
  readonly color: string;
};

export const SUPPORTED_PROVIDERS: readonly ProviderDef[] = [
  // Airlines
  { name: 'Delta', accountType: 'airline', color: '#C5162E' },
  { name: 'United', accountType: 'airline', color: '#0770E3' },
  { name: 'American', accountType: 'airline', color: '#0078D2' },
  { name: 'Southwest', accountType: 'airline', color: '#304CB2' },
  { name: 'JetBlue', accountType: 'airline', color: '#003876' },
  { name: 'Alaska', accountType: 'airline', color: '#01426A' },
  { name: 'British Airways', accountType: 'airline', color: '#075AAA' },
  // Hotels
  { name: 'Marriott', accountType: 'hotel', color: '#8B0000' },
  { name: 'Hilton', accountType: 'hotel', color: '#104C97' },
  { name: 'IHG', accountType: 'hotel', color: '#1B3D2F' },
  { name: 'Hyatt', accountType: 'hotel', color: '#8B6508' },
  { name: 'Airbnb', accountType: 'hotel', color: '#FF5A5F' },
  // Rental
  { name: 'Hertz', accountType: 'rental', color: '#FFD700' },
  { name: 'Enterprise', accountType: 'rental', color: '#007A33' },
  { name: 'National', accountType: 'rental', color: '#00573F' },
] as const;

export function getProviderDef(name: string): ProviderDef | undefined {
  return SUPPORTED_PROVIDERS.find((p) => p.name === name);
}

// ---------------------------------------------------------------------------
// AsyncStorage persistence key
// ---------------------------------------------------------------------------
const STORAGE_KEY = 'roam_travel_accounts';

async function persistLocal(accounts: TravelAccount[]): Promise<void> {
  try {
    await AsyncStorage.setItem(STORAGE_KEY, JSON.stringify(accounts));
  } catch {
    // silent
  }
}

async function loadLocal(): Promise<TravelAccount[]> {
  try {
    const raw = await AsyncStorage.getItem(STORAGE_KEY);
    return raw ? (JSON.parse(raw) as TravelAccount[]) : [];
  } catch {
    return [];
  }
}

// ---------------------------------------------------------------------------
// CRUD — Supabase + local cache
// ---------------------------------------------------------------------------
export async function addTravelAccount(
  provider: string,
  memberNumber?: string,
  tier?: string,
): Promise<TravelAccount | null> {
  const userId = useAppStore.getState().session?.user?.id;
  const providerDef = getProviderDef(provider);
  if (!providerDef) return null;

  const newAccount: TravelAccount = {
    id: `${Date.now().toString(36)}${Math.random().toString(36).slice(2, 8)}`,
    provider,
    accountType: providerDef.accountType,
    displayName: provider,
    memberNumber: memberNumber || undefined,
    tier: tier || undefined,
    miles: 0,
    points: 0,
    linkedAt: new Date().toISOString(),
  };

  // Persist to Supabase if authenticated
  if (userId) {
    try {
      const { data } = await supabase
        .from('travel_accounts')
        .insert({
          user_id: userId,
          provider,
          account_type: providerDef.accountType,
          member_number: memberNumber || null,
          tier: tier || null,
        })
        .select('id')
        .single();
      if (data) {
        const withServerId: TravelAccount = { ...newAccount, id: data.id as string };
        const current = await loadLocal();
        await persistLocal([...current, withServerId]);
        return withServerId;
      }
    } catch {
      // Fall through to local-only
    }
  }

  const current = await loadLocal();
  await persistLocal([...current, newAccount]);
  return newAccount;
}

export async function removeTravelAccount(id: string): Promise<void> {
  const userId = useAppStore.getState().session?.user?.id;

  if (userId) {
    try {
      await supabase.from('travel_accounts').delete().eq('id', id).eq('user_id', userId);
    } catch {
      // silent
    }
  }

  const current = await loadLocal();
  await persistLocal(current.filter((a) => a.id !== id));
}

export async function getTravelAccounts(userId?: string): Promise<TravelAccount[]> {
  if (userId) {
    try {
      const { data } = await supabase
        .from('travel_accounts')
        .select('*')
        .eq('user_id', userId)
        .order('linked_at', { ascending: false });

      if (data && data.length > 0) {
        const mapped: TravelAccount[] = (data as Record<string, unknown>[]).map((row) => ({
          id: row.id as string,
          provider: row.provider as string,
          accountType: row.account_type as AccountType,
          displayName: row.provider as string,
          memberNumber: (row.member_number as string) || undefined,
          tier: (row.tier as string) || undefined,
          miles: (row.miles as number) ?? 0,
          points: (row.points as number) ?? 0,
          linkedAt: row.linked_at as string,
        }));
        await persistLocal(mapped);
        return mapped;
      }
    } catch {
      // Fall through to local
    }
  }

  return loadLocal();
}

// ---------------------------------------------------------------------------
// Intelligence — which accounts matter for a destination
// ---------------------------------------------------------------------------
const AIRLINE_HUBS: Record<string, string[]> = {
  Delta: ['Atlanta', 'New York', 'Detroit', 'Minneapolis', 'Salt Lake City', 'Seattle', 'Los Angeles'],
  United: ['Houston', 'Chicago', 'Denver', 'Newark', 'San Francisco', 'Washington'],
  American: ['Dallas', 'Miami', 'Charlotte', 'Philadelphia', 'Phoenix', 'Chicago'],
  Southwest: ['Dallas', 'Las Vegas', 'Denver', 'Chicago', 'Baltimore', 'Oakland'],
  JetBlue: ['New York', 'Boston', 'Fort Lauderdale', 'Orlando', 'San Juan'],
  Alaska: ['Seattle', 'Portland', 'Los Angeles', 'San Francisco', 'Anchorage'],
  'British Airways': ['London', 'Paris', 'Barcelona', 'Rome', 'Dubai'],
};

export function getRelevantAccounts(
  destination: string,
  accounts: readonly TravelAccount[],
): TravelAccount[] {
  const dest = destination.toLowerCase();

  return accounts.filter((account) => {
    // Hotels are always relevant
    if (account.accountType === 'hotel') return true;
    // Rentals are always relevant
    if (account.accountType === 'rental') return true;
    // Airlines: check hub proximity
    const hubs = AIRLINE_HUBS[account.provider];
    if (hubs) {
      return hubs.some((hub) => dest.includes(hub.toLowerCase()));
    }
    return true;
  });
}

// ---------------------------------------------------------------------------
// React Hook
// ---------------------------------------------------------------------------
export function useTravelAccounts() {
  const [accounts, setAccounts] = useState<TravelAccount[]>([]);
  const [loading, setLoading] = useState(true);
  const userId = useAppStore((s) => s.session?.user?.id);

  useEffect(() => {
    let cancelled = false;
    setLoading(true);
    getTravelAccounts(userId).then((result) => {
      if (!cancelled) {
        setAccounts(result);
        setLoading(false);
      }
    });
    return () => { cancelled = true; };
  }, [userId]);

  const add = useCallback(
    async (provider: string, memberNumber?: string, tier?: string) => {
      const account = await addTravelAccount(provider, memberNumber, tier);
      if (account) {
        setAccounts((prev) => [account, ...prev]);
      }
      return account;
    },
    [],
  );

  const remove = useCallback(async (id: string) => {
    await removeTravelAccount(id);
    setAccounts((prev) => prev.filter((a) => a.id !== id));
  }, []);

  return { accounts, add, remove, loading } as const;
}
