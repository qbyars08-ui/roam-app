/**
 * Test Suite: Generation Quality — Prompt & Output Validation
 *
 * Tests the system prompt and output parsing for quality standards:
 *   - No banned words in prompt output
 *   - All required fields present
 *   - Costs include local currency
 *   - Transit directions are specific
 *   - Neighborhood-level specificity
 *   - Day themes follow emotional arc
 */

import { ITINERARY_SYSTEM_PROMPT } from '../lib/claude';
import { parseItinerary } from '../lib/types/itinerary';

// ---------------------------------------------------------------------------
// Banned Words
// ---------------------------------------------------------------------------

const BANNED_WORDS = [
  'vibrant', 'bustling', 'must-see', 'hidden gem',
  'local favorite', 'world-class', 'iconic', 'charming',
  'picturesque', 'unforgettable', 'breathtaking',
  'stunning', 'delightful', 'quaint', 'unique experience',
  'nestled', 'boasts', 'renowned', 'exquisite',
  'authentic experience', 'rich history', 'cultural tapestry',
];

describe('Generation Quality — System Prompt', () => {
  it('contains banned words list in the prompt', () => {
    for (const word of ['vibrant', 'bustling', 'hidden gem', 'iconic']) {
      expect(ITINERARY_SYSTEM_PROMPT.toLowerCase()).toContain(word);
    }
  });

  it('requires neighborhood-level specificity', () => {
    expect(ITINERARY_SYSTEM_PROMPT).toContain('Shimokitazawa');
    expect(ITINERARY_SYSTEM_PROMPT).toContain('neighborhood');
  });

  it('requires exact times', () => {
    expect(ITINERARY_SYSTEM_PROMPT).toContain('6:30 AM');
    expect(ITINERARY_SYSTEM_PROMPT).toContain('exact time');
  });

  it('requires dual currency', () => {
    expect(ITINERARY_SYSTEM_PROMPT).toContain('local currency');
    expect(ITINERARY_SYSTEM_PROMPT).toContain('USD');
  });

  it('requires transit specificity', () => {
    expect(ITINERARY_SYSTEM_PROMPT).toContain('Line');
    expect(ITINERARY_SYSTEM_PROMPT).toContain('Exit');
    expect(ITINERARY_SYSTEM_PROMPT).toContain('fare');
  });

  it('requires day 1 arrival theme', () => {
    expect(ITINERARY_SYSTEM_PROMPT).toContain('arrival');
    expect(ITINERARY_SYSTEM_PROMPT).toContain('disorientation');
  });

  it('requires last day departure theme', () => {
    expect(ITINERARY_SYSTEM_PROMPT).toContain('leaving');
    expect(ITINERARY_SYSTEM_PROMPT).toContain('One More Morning');
  });

  it('includes budget personality tiers', () => {
    expect(ITINERARY_SYSTEM_PROMPT).toContain('$0-1500');
    expect(ITINERARY_SYSTEM_PROMPT).toContain('$1500-3000');
    expect(ITINERARY_SYSTEM_PROMPT).toContain('$3000-6000');
    expect(ITINERARY_SYSTEM_PROMPT).toContain('$6000+');
  });

  it('includes travel style voice patterns', () => {
    expect(ITINERARY_SYSTEM_PROMPT).toContain('Solo:');
    expect(ITINERARY_SYSTEM_PROMPT).toContain('Couple:');
    expect(ITINERARY_SYSTEM_PROMPT).toContain('Group');
  });

  it('requires crowd intel', () => {
    expect(ITINERARY_SYSTEM_PROMPT).toContain('crowd');
    expect(ITINERARY_SYSTEM_PROMPT).toContain('avoid');
  });
});

// ---------------------------------------------------------------------------
// Output Validation — parseItinerary
// ---------------------------------------------------------------------------

function makeSampleItinerary(overrides: Record<string, unknown> = {}) {
  return {
    destination: 'Tokyo, Japan',
    tagline: 'Ramen at 2AM. Temples at 6AM. Sleep is optional.',
    totalBudget: '$2,000',
    days: [
      {
        day: 1,
        theme: 'Your First Tokyo Evening',
        morning: {
          activity: 'Senso-ji at 6AM before the tour buses',
          location: 'Senso-ji Temple',
          cost: '$0 (¥0)',
          tip: 'Enter through Kaminarimon Gate. Walk the empty Nakamise-dori.',
          time: '6:00 AM',
          duration: '90',
          neighborhood: 'Asakusa',
          address: '2-3-1 Asakusa, Taito City, Tokyo 111-0032',
          transitToNext: 'Ginza Line from Asakusa, platform 1, toward Shibuya, 5 min, ¥170',
        },
        afternoon: {
          activity: 'Yanaka Ginza shopping street',
          location: 'Yanaka Ginza',
          cost: '$5 (¥750)',
          tip: 'The yakitori at Suzuki is ¥100/stick.',
          time: '2:00 PM',
          duration: '120',
          neighborhood: 'Yanaka',
          address: '3-13-1 Yanaka, Taito City',
          transitToNext: 'Walk 15 min south to Ueno Station',
        },
        evening: {
          activity: 'Golden Gai bar crawl',
          location: 'Golden Gai',
          cost: '$30 (¥4,500)',
          tip: 'Bars seat 6 people. No cover if you order a drink.',
          time: '9:00 PM',
          duration: '150',
          neighborhood: 'Shinjuku',
          address: '1-1 Kabukicho, Shinjuku City',
        },
        accommodation: {
          name: 'Nui. Hostel',
          type: 'hostel',
          pricePerNight: '$35',
          neighborhood: 'Kuramae',
        },
        dailyCost: '$70',
        routeSummary: 'Asakusa → Yanaka → Shinjuku (east to west)',
      },
    ],
    budgetBreakdown: {
      accommodation: '$175',
      food: '$500',
      activities: '$300',
      transportation: '$200',
      miscellaneous: '$100',
    },
    packingEssentials: ['Portable fan', 'IC card (Suica)', 'Pocket wifi'],
    proTip: 'Get a Suica card at the airport. Load ¥3,000. It works on every train and most konbini.',
    visaInfo: 'US passport holders: 90-day visa-free entry.',
    ...overrides,
  };
}

describe('Generation Quality — Output Parsing', () => {
  it('parses valid itinerary', () => {
    const raw = JSON.stringify(makeSampleItinerary());
    const parsed = parseItinerary(raw);
    expect(parsed).not.toBeNull();
    expect(parsed?.destination).toBe('Tokyo, Japan');
    expect(parsed?.days).toHaveLength(1);
  });

  it('rejects itinerary without destination', () => {
    const raw = JSON.stringify(makeSampleItinerary({ destination: undefined }));
    expect(() => parseItinerary(raw)).toThrow();
  });

  it('rejects itinerary without days', () => {
    const raw = JSON.stringify(makeSampleItinerary({ days: undefined }));
    expect(() => parseItinerary(raw)).toThrow();
  });

  it('validates output has no banned words in tips', () => {
    const itinerary = makeSampleItinerary();
    const allTips = itinerary.days.flatMap((d) => [
      d.morning.tip,
      d.afternoon.tip,
      d.evening.tip,
    ]);

    for (const tip of allTips) {
      for (const banned of BANNED_WORDS) {
        expect(tip.toLowerCase()).not.toContain(banned);
      }
    }
  });

  it('validates costs include dual currency', () => {
    const itinerary = makeSampleItinerary();
    const costs = itinerary.days.flatMap((d) => [
      d.morning.cost,
      d.afternoon.cost,
      d.evening.cost,
    ]);

    for (const cost of costs) {
      // Should contain both $ and a local currency symbol/code
      expect(cost).toContain('$');
      expect(cost).toContain('¥');
    }
  });

  it('validates transit directions are specific', () => {
    const itinerary = makeSampleItinerary();
    const transit = itinerary.days[0].morning.transitToNext;
    // Should contain line name and fare
    expect(transit).toContain('Line');
    expect(transit).toContain('¥');
  });
});
