// =============================================================================
// ROAM — Daily Brief Generator
// Contextual countdown messages: deterministic per-day + live Sonar overlay
// =============================================================================

import { useState, useEffect } from 'react';
import { useSonarQuery } from './sonar';

// ---------------------------------------------------------------------------
// Types
// ---------------------------------------------------------------------------

export type DailyBrief = {
  headline: string;
  subtext: string;
  category: 'weather' | 'event' | 'tip' | 'prep' | 'excitement';
  icon: string; // lucide icon name
};

export type ChecklistItem = {
  id: string;
  label: string;
  category: 'documents' | 'health' | 'logistics' | 'packing' | 'digital';
  daysRange: [number, number]; // show when daysUntil is in this range
};

// ---------------------------------------------------------------------------
// Deterministic seeded hash — stable per (destination + dayOfYear)
// ---------------------------------------------------------------------------

function seededHash(destination: string, dayOfYear: number): number {
  const input = `${destination.toLowerCase()}-${dayOfYear}`;
  let hash = 0;
  for (let i = 0; i < input.length; i++) {
    hash = (hash * 31 + input.charCodeAt(i)) >>> 0;
  }
  return hash;
}

function pickFromPool<T>(pool: T[], seed: number): T {
  return pool[seed % pool.length];
}

// ---------------------------------------------------------------------------
// Brief template pool — destination-aware, specific
// ---------------------------------------------------------------------------

type BriefTemplate = Omit<DailyBrief, 'headline'> & {
  headline: (destination: string) => string;
};

const BRIEF_TEMPLATES: BriefTemplate[] = [
  {
    headline: (d) => `Street food culture in ${d} rewards early risers`,
    subtext: 'Markets and hawker stalls peak before 9am — go before tourists arrive.',
    category: 'tip',
    icon: 'UtensilsCrossed',
  },
  {
    headline: (d) => `Book the must-do activity in ${d} this week`,
    subtext: 'Popular experiences sell out 2–3 weeks before peak travel dates.',
    category: 'prep',
    icon: 'CalendarCheck',
  },
  {
    headline: (d) => `Neighborhood transport in ${d} beats taxis`,
    subtext: 'Download the local transit app before you land — offline maps save time.',
    category: 'tip',
    icon: 'MapPin',
  },
  {
    headline: (d) => `Currency tips for ${d}: notify your bank now`,
    subtext: 'Foreign transaction blocks are the #1 trip disruption. One call prevents it.',
    category: 'prep',
    icon: 'CreditCard',
  },
  {
    headline: (d) => `Seasonal festivals may overlap with your ${d} trip`,
    subtext: 'Check local event calendars — some streets close, hotels fill fast.',
    category: 'event',
    icon: 'Sparkles',
  },
  {
    headline: (d) => `The weather window for ${d} looks favorable`,
    subtext: 'Pack layers — mornings and evenings are cooler than the daily high suggests.',
    category: 'weather',
    icon: 'Cloud',
  },
  {
    headline: (d) => `Hidden gems in ${d} require advance planning`,
    subtext: 'Some sites limit daily visitors — tickets open 30 days out.',
    category: 'prep',
    icon: 'Gem',
  },
  {
    headline: (d) => `${d} travelers swear by one neighborhood above all others`,
    subtext: 'Stay or eat where locals go — a 10-minute walk from the main drag changes everything.',
    category: 'tip',
    icon: 'Compass',
  },
  {
    headline: (d) => `Local SIM cards in ${d}: cheaper than roaming`,
    subtext: 'Pick one up at the airport on arrival. Most support eSIM now.',
    category: 'tip',
    icon: 'Wifi',
  },
  {
    headline: (d) => `Jet lag strategy for ${d}: start shifting sleep now`,
    subtext: 'Adjust bedtime 20 minutes earlier each night — you\'ll land already synced.',
    category: 'prep',
    icon: 'Moon',
  },
  {
    headline: (d) => `Restaurant reservations in ${d} fill fast`,
    subtext: 'The best tables book 2 weeks out. OpenTable or local equivalent works.',
    category: 'tip',
    icon: 'BookOpen',
  },
  {
    headline: (d) => `Travel insurance for ${d}: costs less than one missed flight`,
    subtext: 'Medical coverage is the essential part — the rest is bonus.',
    category: 'prep',
    icon: 'ShieldCheck',
  },
  {
    headline: (d) => `${d} at sunrise is a different city`,
    subtext: 'Iconic spots are empty before 7am. Worth the early alarm.',
    category: 'tip',
    icon: 'Sunrise',
  },
  {
    headline: (d) => `Visa for ${d}: verify requirements this week`,
    subtext: 'Processing times shift seasonally — don\'t assume last year\'s rules still apply.',
    category: 'prep',
    icon: 'FileCheck',
  },
  {
    headline: (d) => `Pack light for ${d} — laundry services are everywhere`,
    subtext: 'A half-full bag means freedom. Most guesthouses offer same-day wash.',
    category: 'prep',
    icon: 'Backpack',
  },
  {
    headline: (d) => `Translation apps work offline in ${d}`,
    subtext: 'Download the language pack before you fly — Wi-Fi isn\'t always reliable.',
    category: 'tip',
    icon: 'Languages',
  },
  {
    headline: (d) => `${d} counts down — this trip is almost real`,
    subtext: 'You\'ve planned it. Now it\'s just a matter of getting there.',
    category: 'excitement',
    icon: 'Rocket',
  },
  {
    headline: (d) => `The best photos in ${d} aren't at the main sites`,
    subtext: 'Walk two blocks off the tourist path. That\'s where the real shots live.',
    category: 'tip',
    icon: 'Camera',
  },
  {
    headline: (d) => `Check your passport validity before ${d}`,
    subtext: 'Many countries require 6 months validity beyond your departure date.',
    category: 'prep',
    icon: 'Passport',
  },
  {
    headline: (d) => `${d} has a day worth planning around`,
    subtext: 'One perfect day — market in the morning, hidden lunch spot, sunset from the right hill.',
    category: 'excitement',
    icon: 'Star',
  },
];

// ---------------------------------------------------------------------------
// Pure function: getDailyBrief
// ---------------------------------------------------------------------------

export function getDailyBrief(
  destination: string,
  daysUntil: number,
  dayOfYear: number,
): DailyBrief {
  const hash = seededHash(destination, dayOfYear);

  // Filter templates by phase relevance to keep messages contextually appropriate
  let eligible = BRIEF_TEMPLATES;
  if (daysUntil > 30) {
    eligible = BRIEF_TEMPLATES.filter((t) =>
      ['prep', 'excitement'].includes(t.category),
    );
  } else if (daysUntil >= 14) {
    eligible = BRIEF_TEMPLATES.filter((t) =>
      ['prep', 'tip', 'logistics'].includes(t.category),
    );
  } else if (daysUntil >= 7) {
    eligible = BRIEF_TEMPLATES.filter((t) =>
      ['tip', 'weather', 'event', 'prep'].includes(t.category),
    );
  } else if (daysUntil >= 1) {
    eligible = BRIEF_TEMPLATES.filter((t) =>
      ['tip', 'excitement', 'packing'].includes(t.category),
    );
  }

  // Ensure we always have something to show
  const pool = eligible.length > 0 ? eligible : BRIEF_TEMPLATES;
  const template = pickFromPool(pool, hash);

  return {
    headline: template.headline(destination),
    subtext: template.subtext,
    category: template.category,
    icon: template.icon,
  };
}

// ---------------------------------------------------------------------------
// Checklist items — adaptive by phase
// ---------------------------------------------------------------------------

export const CHECKLIST_ITEMS: ChecklistItem[] = [
  // 30+ days — documents & insurance
  { id: 'passport-validity', label: 'Check passport has 6+ months validity', category: 'documents', daysRange: [30, 999] },
  { id: 'visa-research', label: 'Research visa requirements', category: 'documents', daysRange: [30, 999] },
  { id: 'travel-insurance', label: 'Compare travel insurance plans', category: 'health', daysRange: [30, 999] },
  { id: 'vaccination-check', label: 'Check recommended vaccinations', category: 'health', daysRange: [30, 999] },

  // 14–29 days — logistics & bookings
  { id: 'notify-bank', label: 'Notify bank of travel dates', category: 'logistics', daysRange: [14, 29] },
  { id: 'offline-maps', label: 'Download offline maps (Maps.me or Google)', category: 'digital', daysRange: [14, 29] },
  { id: 'book-activities', label: 'Book must-do activities in advance', category: 'logistics', daysRange: [14, 29] },
  { id: 'restaurant-reservations', label: 'Make restaurant reservations', category: 'logistics', daysRange: [14, 29] },
  { id: 'airport-transport', label: 'Arrange airport transfer both ways', category: 'logistics', daysRange: [14, 29] },

  // 7–13 days — prep & packing begins
  { id: 'online-checkin', label: 'Check in online when window opens', category: 'logistics', daysRange: [7, 13] },
  { id: 'packing-list', label: 'Write packing list and start gathering', category: 'packing', daysRange: [7, 13] },
  { id: 'language-phrases', label: 'Download language phrase app', category: 'digital', daysRange: [7, 13] },
  { id: 'sim-card', label: 'Order travel SIM or enable eSIM plan', category: 'digital', daysRange: [7, 13] },
  { id: 'prescriptions', label: 'Refill any prescriptions needed', category: 'health', daysRange: [7, 13] },

  // 1–6 days — final prep
  { id: 'hotel-address', label: 'Save hotel address in local script', category: 'documents', daysRange: [1, 6] },
  { id: 'charge-devices', label: 'Charge all devices and power bank', category: 'digital', daysRange: [1, 6] },
  { id: 'pack-daybag', label: 'Pack carry-on with essentials accessible', category: 'packing', daysRange: [1, 6] },
  { id: 'print-bookings', label: 'Screenshot or print hotel/flight confirmations', category: 'documents', daysRange: [1, 6] },
  { id: 'cash', label: 'Get local currency or confirm ATM plan', category: 'logistics', daysRange: [1, 6] },

  // Departure day
  { id: 'depart-checklist', label: 'Passport, wallet, phone, keys', category: 'documents', daysRange: [0, 0] },
  { id: 'flight-status', label: 'Check flight status for delays', category: 'logistics', daysRange: [0, 0] },
  { id: 'transport-to-airport', label: 'Confirm transport to airport', category: 'logistics', daysRange: [0, 0] },
  { id: 'home-check', label: 'Lock up, unplug, set thermostat', category: 'logistics', daysRange: [0, 0] },
];

export function getChecklistItems(daysUntil: number): ChecklistItem[] {
  return CHECKLIST_ITEMS.filter((item) => {
    const [min, max] = item.daysRange;
    return daysUntil >= min && daysUntil <= max;
  });
}

// ---------------------------------------------------------------------------
// React hook: useDailyBrief
// Combines pure getDailyBrief with live Sonar data when available
// ---------------------------------------------------------------------------

export function useDailyBrief(
  destination: string | undefined,
  daysUntil: number,
): { brief: DailyBrief | null; isLoading: boolean; isLive: boolean } {
  const today = new Date();
  const startOfYear = new Date(today.getFullYear(), 0, 0);
  const dayOfYear = Math.floor(
    (today.getTime() - startOfYear.getTime()) / (1000 * 60 * 60 * 24),
  );

  const [brief, setBrief] = useState<DailyBrief | null>(null);

  // Sonar events query for live overlays
  const { data: sonarData, isLoading, isLive } = useSonarQuery(destination, 'events');

  useEffect(() => {
    if (!destination) {
      setBrief(null);
      return;
    }

    const base = getDailyBrief(destination, daysUntil, dayOfYear);

    // Overlay live Sonar answer as headline when available and within 14 days
    if (sonarData?.answer && daysUntil <= 14 && daysUntil >= 1) {
      const liveHeadline = sonarData.answer.split('.')[0].trim();
      if (liveHeadline.length > 10 && liveHeadline.length < 80) {
        setBrief({
          headline: liveHeadline,
          subtext: base.subtext,
          category: 'event',
          icon: 'Sparkles',
        });
        return;
      }
    }

    setBrief(base);
  }, [destination, daysUntil, dayOfYear, sonarData]);

  return { brief, isLoading: !brief && isLoading, isLive };
}
