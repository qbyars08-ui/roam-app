/**
 * Test Suite: daily-brief — getDailyBrief and getChecklistItems
 *
 * Pure functions only — no hooks, no mocks needed.
 * useDailyBrief (React hook) is excluded; it requires Sonar and a render context.
 */

import {
  getDailyBrief,
  getChecklistItems,
  type DailyBrief,
  type ChecklistItem,
} from '../lib/daily-brief';

const VALID_CATEGORIES: DailyBrief['category'][] = [
  'weather',
  'event',
  'tip',
  'prep',
  'excitement',
];

// ---------------------------------------------------------------------------
// getDailyBrief — structure and content
// ---------------------------------------------------------------------------

describe('getDailyBrief — basic structure', () => {
  it('returns an object with all required fields', () => {
    const brief = getDailyBrief('Tokyo', 20, 100);
    expect(typeof brief.headline).toBe('string');
    expect(typeof brief.subtext).toBe('string');
    expect(typeof brief.category).toBe('string');
    expect(typeof brief.icon).toBe('string');
  });

  it('headline is a non-empty string', () => {
    const brief = getDailyBrief('Paris', 10, 50);
    expect(brief.headline.length).toBeGreaterThan(0);
  });

  it('subtext is a non-empty string', () => {
    const brief = getDailyBrief('Paris', 10, 50);
    expect(brief.subtext.length).toBeGreaterThan(0);
  });

  it('icon is a non-empty string', () => {
    const brief = getDailyBrief('Paris', 10, 50);
    expect(brief.icon.length).toBeGreaterThan(0);
  });

  it('category is always one of the valid values', () => {
    const destinations = ['Tokyo', 'Paris', 'Bangkok', 'New York', 'Sydney'];
    const daysValues = [0, 5, 15, 35, 100];
    for (const dest of destinations) {
      for (const days of daysValues) {
        const brief = getDailyBrief(dest, days, 180);
        expect(VALID_CATEGORIES).toContain(brief.category);
      }
    }
  });

  it('headline includes the destination name', () => {
    const brief = getDailyBrief('Lisbon', 20, 100);
    expect(brief.headline).toContain('Lisbon');
  });

  it('headline includes the destination name for different cities', () => {
    const brief = getDailyBrief('Bali', 5, 200);
    expect(brief.headline).toContain('Bali');
  });
});

describe('getDailyBrief — determinism and variation', () => {
  it('returns the same brief for the same inputs (deterministic)', () => {
    const a = getDailyBrief('Tokyo', 20, 100);
    const b = getDailyBrief('Tokyo', 20, 100);
    expect(a.headline).toBe(b.headline);
    expect(a.category).toBe(b.category);
  });

  it('different dayOfYear produces a different headline at some point', () => {
    // With 20 template variants the seed cycles, so day 1 vs day 15 should differ
    const headlines = new Set<string>();
    for (let day = 1; day <= 20; day++) {
      const brief = getDailyBrief('Tokyo', 20, day);
      headlines.add(brief.headline);
    }
    // Should have more than 1 unique headline across 20 days
    expect(headlines.size).toBeGreaterThan(1);
  });

  it('different destinations on the same dayOfYear can produce different briefs', () => {
    const tokyo = getDailyBrief('Tokyo', 20, 100);
    const paris = getDailyBrief('Paris', 20, 100);
    // Destinations differ so headlines must differ
    expect(tokyo.headline).not.toBe(paris.headline);
  });
});

describe('getDailyBrief — phase filtering', () => {
  it('daysUntil > 30 returns only prep or excitement categories', () => {
    // Run several dayOfYear values to get diverse template picks
    for (let day = 1; day <= 20; day++) {
      const brief = getDailyBrief('Tokyo', 60, day);
      expect(['prep', 'excitement']).toContain(brief.category);
    }
  });

  it('daysUntil 1–6 returns tip or excitement categories', () => {
    for (let day = 1; day <= 20; day++) {
      const brief = getDailyBrief('Tokyo', 3, day);
      expect(['tip', 'excitement', 'packing']).toContain(brief.category);
    }
  });

  it('daysUntil 7–13 returns tip, weather, event, or prep categories', () => {
    const allowed = ['tip', 'weather', 'event', 'prep'];
    for (let day = 1; day <= 20; day++) {
      const brief = getDailyBrief('Tokyo', 10, day);
      expect(allowed).toContain(brief.category);
    }
  });
});

// ---------------------------------------------------------------------------
// getChecklistItems — phase-gated items
// ---------------------------------------------------------------------------

describe('getChecklistItems — structure', () => {
  it('returns an array', () => {
    const items = getChecklistItems(20);
    expect(Array.isArray(items)).toBe(true);
  });

  it('every item has id, label, and category', () => {
    const items = getChecklistItems(20);
    for (const item of items) {
      expect(typeof item.id).toBe('string');
      expect(item.id.length).toBeGreaterThan(0);
      expect(typeof item.label).toBe('string');
      expect(item.label.length).toBeGreaterThan(0);
      expect(typeof item.category).toBe('string');
    }
  });
});

describe('getChecklistItems — phase filtering', () => {
  it('returns documents/health items when daysUntil > 30', () => {
    const items = getChecklistItems(60);
    const categories = items.map((i) => i.category);
    expect(categories.some((c) => c === 'documents' || c === 'health')).toBe(true);
  });

  it('includes passport-validity item when daysUntil > 30', () => {
    const items = getChecklistItems(60);
    const ids = items.map((i) => i.id);
    expect(ids).toContain('passport-validity');
  });

  it('returns logistics items when daysUntil is 14–29', () => {
    const items = getChecklistItems(20);
    const categories = items.map((i) => i.category);
    expect(categories.some((c) => c === 'logistics' || c === 'digital')).toBe(true);
  });

  it('includes notify-bank item when daysUntil is in 14–29 range', () => {
    const items = getChecklistItems(20);
    const ids = items.map((i) => i.id);
    expect(ids).toContain('notify-bank');
  });

  it('returns packing items when daysUntil is 7–13', () => {
    const items = getChecklistItems(10);
    const ids = items.map((i) => i.id);
    expect(ids).toContain('packing-list');
  });

  it('returns final prep items when daysUntil is 1–6', () => {
    const items = getChecklistItems(3);
    const ids = items.map((i) => i.id);
    expect(ids).toContain('hotel-address');
    expect(ids).toContain('charge-devices');
  });

  it('does NOT return 30+ day items when daysUntil is 3', () => {
    const items = getChecklistItems(3);
    const ids = items.map((i) => i.id);
    expect(ids).not.toContain('passport-validity');
    expect(ids).not.toContain('visa-research');
  });

  it('does NOT return final-prep items when daysUntil is 30', () => {
    const items = getChecklistItems(30);
    const ids = items.map((i) => i.id);
    expect(ids).not.toContain('hotel-address');
    expect(ids).not.toContain('charge-devices');
  });

  it('returns items for departure day when daysUntil is 0', () => {
    const items = getChecklistItems(0);
    const ids = items.map((i) => i.id);
    expect(ids).toContain('depart-checklist');
    expect(ids).toContain('flight-status');
  });
});
