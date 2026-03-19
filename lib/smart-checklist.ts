// =============================================================================
// ROAM — Smart Checklist Engine
// Personalized, countdown-aware checklist that adapts to the actual trip
// =============================================================================
import { useState, useEffect, useCallback, useMemo } from 'react';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { getVisaInfo, destinationToCountryCode } from './visa-intel';
import { DESTINATIONS, HIDDEN_DESTINATIONS } from './constants';
import type { TravelProfile } from './types/travel-profile';

// ---------------------------------------------------------------------------
// Types
// ---------------------------------------------------------------------------

export type ChecklistCategory =
  | 'documents'
  | 'health'
  | 'packing'
  | 'logistics'
  | 'digital'
  | 'money';

export type ChecklistSource = 'system' | 'sonar' | 'user';

export type ChecklistItem = {
  readonly id: string;
  readonly category: ChecklistCategory;
  readonly text: string;
  /** Days before departure when this item becomes relevant */
  readonly dueByDays: number;
  readonly isUrgent: boolean;
  readonly isCompleted: boolean;
  readonly source: ChecklistSource;
};

export type ChecklistCategorySummary = {
  readonly category: ChecklistCategory;
  readonly label: string;
  readonly icon: string;
  readonly total: number;
  readonly completed: number;
};

// ---------------------------------------------------------------------------
// Category metadata
// ---------------------------------------------------------------------------

const CATEGORY_META: Record<ChecklistCategory, { label: string; icon: string }> = {
  documents: { label: 'Documents', icon: 'FileText' },
  health: { label: 'Health', icon: 'Heart' },
  money: { label: 'Money', icon: 'Wallet' },
  digital: { label: 'Digital', icon: 'Smartphone' },
  logistics: { label: 'Logistics', icon: 'MapPin' },
  packing: { label: 'Packing', icon: 'Briefcase' },
};

// ---------------------------------------------------------------------------
// Destination lookup helper
// ---------------------------------------------------------------------------

function findDestination(name: string) {
  const lower = name.toLowerCase().trim();
  const all = [...DESTINATIONS, ...HIDDEN_DESTINATIONS];
  return all.find((d) => d.label.toLowerCase() === lower) ?? null;
}

// ---------------------------------------------------------------------------
// Core generator
// ---------------------------------------------------------------------------

export function generateTripChecklist(
  destination: string,
  daysUntil: number,
  profile?: TravelProfile,
  accounts?: readonly string[],
): readonly ChecklistItem[] {
  const items: ChecklistItem[] = [];
  const dest = findDestination(destination);
  const countryCode = destinationToCountryCode(destination);
  const passport = profile?.passportNationality ?? 'US';

  const makeItem = (
    id: string,
    category: ChecklistCategory,
    text: string,
    dueByDays: number,
    source: ChecklistSource = 'system',
  ): ChecklistItem => ({
    id,
    category,
    text,
    dueByDays,
    isUrgent: dueByDays >= daysUntil,
    isCompleted: false,
    source,
  });

  // ── Documents (30+ days) ──
  items.push(makeItem('doc-passport', 'documents', 'Verify passport is valid 6+ months after return', 45));
  if (countryCode) {
    const visa = getVisaInfo(destination, passport);
    if (visa && visa.info.status !== 'visa_free') {
      const label = visa.info.status === 'e_visa'
        ? `Apply for ${destination} e-visa online`
        : visa.info.status === 'visa_on_arrival'
          ? `Prepare documents for ${destination} visa on arrival`
          : `Apply for ${destination} visa at embassy`;
      items.push(makeItem('doc-visa', 'documents', label, 45));
    }
  }
  items.push(makeItem('doc-insurance', 'documents', 'Purchase travel insurance', 30));
  items.push(makeItem('doc-copies', 'documents', 'Make digital copies of passport and ID', 14));

  // ── Health (21+ days) ──
  items.push(makeItem('health-vaccines', 'health', 'Check recommended vaccinations for ' + destination, 30));
  items.push(makeItem('health-prescriptions', 'health', 'Refill prescriptions and pack extras', 14));
  items.push(makeItem('health-kit', 'health', 'Assemble travel health kit (first aid, meds, sunscreen)', 7));

  // ── Money (14+ days) ──
  items.push(makeItem('money-bank', 'money', 'Notify bank of travel dates to avoid card blocks', 14));
  if (dest) {
    items.push(makeItem(
      'money-currency',
      'money',
      `Get local currency (${dest.currencyCode}) or confirm ATM plan`,
      7,
    ));
    items.push(makeItem(
      'money-exchange',
      'money',
      `Check ${dest.currencyCode}/${profile?.passportNationality === 'AT' ? 'EUR' : 'USD'} exchange rate`,
      14,
    ));
  } else {
    items.push(makeItem('money-currency', 'money', 'Get local currency or confirm ATM plan', 7));
  }
  items.push(makeItem('money-budget', 'money', 'Set daily spending budget', 14));

  // ── Digital (7+ days) ──
  items.push(makeItem('digital-maps', 'digital', 'Download offline maps for ' + destination, 7));
  items.push(makeItem('digital-roam', 'digital', 'Download ROAM offline pack', 7));
  items.push(makeItem('digital-esim', 'digital', 'Order eSIM or travel SIM card', 7));
  items.push(makeItem('digital-phrases', 'digital', 'Download translation phrases for local language', 7));
  if (dest && dest.languages.length > 0 && dest.languages[0] !== 'English') {
    items.push(makeItem(
      'digital-lang',
      'digital',
      `Learn 5 basic phrases in ${dest.languages[0]}`,
      7,
    ));
  }

  // ── Logistics (3+ days) ──
  items.push(makeItem('logistics-checkin', 'logistics', 'Check in online when window opens', 3));
  items.push(makeItem('logistics-hotel', 'logistics', 'Confirm hotel or accommodation booking', 3));
  items.push(makeItem('logistics-transport', 'logistics', 'Arrange airport transport both ways', 3));
  items.push(makeItem('logistics-emergency', 'logistics', 'Share itinerary with emergency contact', 3));

  // ── Packing (1-3 days) ──
  items.push(makeItem('pack-weather', 'packing', `Pack weather-appropriate clothing for ${destination}`, 3));
  items.push(makeItem('pack-chargers', 'packing', 'Pack chargers and power bank', 3));
  if (dest) {
    const needsAdapter = !['US'].includes(dest.country);
    if (needsAdapter) {
      items.push(makeItem('pack-adapter', 'packing', `Pack power adapter for ${dest.country}`, 3));
    }
  }
  items.push(makeItem('pack-docs', 'packing', 'Pack copies of important documents', 1));
  items.push(makeItem('pack-essentials', 'packing', 'Final check: passport, wallet, phone, keys', 1));

  // ── Linked account items ──
  if (accounts && accounts.length > 0) {
    for (const account of accounts) {
      const lower = account.toLowerCase();
      if (lower.includes('delta') || lower.includes('united') || lower.includes('american')) {
        items.push(makeItem(
          `account-${lower.replace(/\s+/g, '-')}`,
          'logistics',
          `Check in on ${account} app`,
          1,
          'system',
        ));
      }
      if (lower.includes('marriott') || lower.includes('hilton') || lower.includes('hyatt')) {
        items.push(makeItem(
          `account-${lower.replace(/\s+/g, '-')}`,
          'logistics',
          `Confirm ${account} reservation`,
          3,
          'system',
        ));
      }
    }
  }

  return items;
}

// ---------------------------------------------------------------------------
// Urgent items filter
// ---------------------------------------------------------------------------

export function getUrgentItems(
  checklist: readonly ChecklistItem[],
  daysUntil: number,
): readonly ChecklistItem[] {
  return checklist.filter(
    (item) => !item.isCompleted && item.dueByDays >= daysUntil,
  );
}

// ---------------------------------------------------------------------------
// Category summaries
// ---------------------------------------------------------------------------

export function getCategorySummaries(
  checklist: readonly ChecklistItem[],
): readonly ChecklistCategorySummary[] {
  const categories: ChecklistCategory[] = ['documents', 'health', 'money', 'digital', 'logistics', 'packing'];
  return categories.map((cat) => {
    const catItems = checklist.filter((i) => i.category === cat);
    return {
      category: cat,
      label: CATEGORY_META[cat].label,
      icon: CATEGORY_META[cat].icon,
      total: catItems.length,
      completed: catItems.filter((i) => i.isCompleted).length,
    };
  });
}

// ---------------------------------------------------------------------------
// Persistence helpers
// ---------------------------------------------------------------------------

const STORAGE_PREFIX = '@roam/checklist/';

async function loadCheckedIds(tripId: string): Promise<Set<string>> {
  try {
    const raw = await AsyncStorage.getItem(STORAGE_PREFIX + tripId);
    if (raw) return new Set(JSON.parse(raw) as string[]);
  } catch { /* silent */ }
  return new Set();
}

async function saveCheckedIds(tripId: string, ids: Set<string>): Promise<void> {
  try {
    await AsyncStorage.setItem(STORAGE_PREFIX + tripId, JSON.stringify([...ids]));
  } catch { /* silent */ }
}

async function loadCustomItems(tripId: string): Promise<ChecklistItem[]> {
  try {
    const raw = await AsyncStorage.getItem(STORAGE_PREFIX + tripId + '/custom');
    if (raw) return JSON.parse(raw) as ChecklistItem[];
  } catch { /* silent */ }
  return [];
}

async function saveCustomItems(tripId: string, items: readonly ChecklistItem[]): Promise<void> {
  try {
    await AsyncStorage.setItem(STORAGE_PREFIX + tripId + '/custom', JSON.stringify(items));
  } catch { /* silent */ }
}

// ---------------------------------------------------------------------------
// React hook
// ---------------------------------------------------------------------------

export function useSmartChecklist(
  tripId: string | undefined,
  destination: string | undefined,
  daysUntil: number,
  profile?: TravelProfile,
  accounts?: readonly string[],
): {
  checklist: readonly ChecklistItem[];
  toggle: (id: string) => void;
  urgentCount: number;
  progress: number;
  addCustomItem: (text: string, category: ChecklistCategory) => void;
} {
  const [checkedIds, setCheckedIds] = useState<Set<string>>(new Set());
  const [customItems, setCustomItems] = useState<readonly ChecklistItem[]>([]);
  const [loaded, setLoaded] = useState(false);

  // Load persisted state
  useEffect(() => {
    if (!tripId) return;
    Promise.all([loadCheckedIds(tripId), loadCustomItems(tripId)]).then(
      ([ids, customs]) => {
        setCheckedIds(ids);
        setCustomItems(customs);
        setLoaded(true);
      },
    );
  }, [tripId]);

  // Generate base checklist
  const baseChecklist = useMemo(() => {
    if (!destination) return [];
    return generateTripChecklist(destination, daysUntil, profile, accounts);
  }, [destination, daysUntil, profile, accounts]);

  // Merge with completion state and custom items
  const checklist = useMemo(() => {
    const merged = baseChecklist.map((item) => ({
      ...item,
      isCompleted: checkedIds.has(item.id),
      isUrgent: !checkedIds.has(item.id) && item.dueByDays >= daysUntil,
    }));
    const customs = customItems.map((item) => ({
      ...item,
      isCompleted: checkedIds.has(item.id),
      isUrgent: !checkedIds.has(item.id) && item.dueByDays >= daysUntil,
    }));
    return [...merged, ...customs];
  }, [baseChecklist, customItems, checkedIds, daysUntil]);

  const toggle = useCallback((id: string) => {
    if (!tripId) return;
    setCheckedIds((prev) => {
      const next = new Set(prev);
      if (next.has(id)) {
        next.delete(id);
      } else {
        next.add(id);
      }
      saveCheckedIds(tripId, next);
      return next;
    });
  }, [tripId]);

  const addCustomItem = useCallback((text: string, category: ChecklistCategory) => {
    if (!tripId) return;
    const newItem: ChecklistItem = {
      id: `custom-${Date.now().toString(36)}`,
      category,
      text,
      dueByDays: daysUntil,
      isUrgent: false,
      isCompleted: false,
      source: 'user',
    };
    setCustomItems((prev) => {
      const updated = [...prev, newItem];
      saveCustomItems(tripId, updated);
      return updated;
    });
  }, [tripId, daysUntil]);

  const urgentCount = useMemo(
    () => checklist.filter((i) => i.isUrgent && !i.isCompleted).length,
    [checklist],
  );

  const progress = useMemo(() => {
    if (checklist.length === 0) return 0;
    return Math.round((checklist.filter((i) => i.isCompleted).length / checklist.length) * 100);
  }, [checklist]);

  return { checklist: loaded ? checklist : [], toggle, urgentCount, progress, addCustomItem };
}
