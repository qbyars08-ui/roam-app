// =============================================================================
// ROAM — CRAFT Proactive Suggestions
// Context-aware conversation starters that make CRAFT feel like a travel agent
// who remembers you, not a chatbot waiting for input.
// =============================================================================

import type { TravelerDNA, BudgetTier, TravelStyle } from './personalization-engine';
import type { Trip } from './store';

// ---------------------------------------------------------------------------
// Types
// ---------------------------------------------------------------------------

export interface CraftSuggestion {
  readonly text: string;
  readonly category: 'refine' | 'explore' | 'practical' | 'insider';
  readonly priority: number; // 1 = highest
}

// ---------------------------------------------------------------------------
// Suggestion generators — each returns 1-3 suggestions based on context
// ---------------------------------------------------------------------------

function budgetSuggestions(
  destination: string,
  budget: BudgetTier
): readonly CraftSuggestion[] {
  const suggestions: CraftSuggestion[] = [];

  if (budget === 'backpacker') {
    suggestions.push({
      text: `Where can I eat well in ${destination} for under $5?`,
      category: 'practical',
      priority: 2,
    });
    suggestions.push({
      text: `What's free to do in ${destination} that tourists miss?`,
      category: 'explore',
      priority: 3,
    });
  } else if (budget === 'luxury' || budget === 'no-limit') {
    suggestions.push({
      text: `What's the one splurge-worthy dinner in ${destination}?`,
      category: 'insider',
      priority: 2,
    });
    suggestions.push({
      text: `Best boutique hotel that's not on every top-10 list?`,
      category: 'refine',
      priority: 3,
    });
  } else {
    suggestions.push({
      text: `Where should I save vs. splurge in ${destination}?`,
      category: 'practical',
      priority: 3,
    });
  }

  return suggestions;
}

function styleSuggestions(
  destination: string,
  styles: readonly TravelStyle[]
): readonly CraftSuggestion[] {
  const suggestions: CraftSuggestion[] = [];
  const primary = styles[0];

  const styleMap: Record<string, CraftSuggestion[]> = {
    food: [
      {
        text: `What should I eat on my first night in ${destination}?`,
        category: 'insider',
        priority: 1,
      },
      {
        text: `Any food markets or street food I shouldn't miss?`,
        category: 'explore',
        priority: 3,
      },
    ],
    culture: [
      {
        text: `What cultural thing do most tourists get wrong about ${destination}?`,
        category: 'insider',
        priority: 1,
      },
      {
        text: `Any galleries or exhibitions happening right now?`,
        category: 'explore',
        priority: 3,
      },
    ],
    adventure: [
      {
        text: `What's the best day trip from ${destination}?`,
        category: 'explore',
        priority: 1,
      },
      {
        text: `Any hikes or outdoor activities worth doing?`,
        category: 'explore',
        priority: 3,
      },
    ],
    nightlife: [
      {
        text: `Where do locals actually go out in ${destination}?`,
        category: 'insider',
        priority: 1,
      },
      {
        text: `Best rooftop bar or late-night spot?`,
        category: 'explore',
        priority: 3,
      },
    ],
    relaxation: [
      {
        text: `Best quiet neighborhoods to wander without an agenda?`,
        category: 'explore',
        priority: 1,
      },
      {
        text: `Any spas or onsen worth booking ahead?`,
        category: 'practical',
        priority: 3,
      },
    ],
    nature: [
      {
        text: `Best nature escape within an hour of ${destination}?`,
        category: 'explore',
        priority: 1,
      },
      {
        text: `When's golden hour? Best spot for sunset photos?`,
        category: 'insider',
        priority: 3,
      },
    ],
  };

  if (primary && styleMap[primary]) {
    suggestions.push(...styleMap[primary]);
  }

  return suggestions;
}

function companionSuggestions(
  destination: string,
  companions: string
): readonly CraftSuggestion[] {
  const suggestions: CraftSuggestion[] = [];

  if (companions === 'solo') {
    suggestions.push({
      text: `Best hostels or spots to meet other travelers?`,
      category: 'practical',
      priority: 2,
    });
    suggestions.push({
      text: `Is ${destination} safe for solo travelers at night?`,
      category: 'practical',
      priority: 4,
    });
  } else if (companions === 'couple') {
    suggestions.push({
      text: `Most romantic dinner spot that's not a tourist trap?`,
      category: 'insider',
      priority: 2,
    });
  } else if (companions === 'family') {
    suggestions.push({
      text: `What's fun for kids AND adults in ${destination}?`,
      category: 'explore',
      priority: 2,
    });
    suggestions.push({
      text: `Any restaurants with good kids' menus?`,
      category: 'practical',
      priority: 4,
    });
  } else if (companions === 'friends') {
    suggestions.push({
      text: `Best group activity we can't do at home?`,
      category: 'explore',
      priority: 2,
    });
  }

  return suggestions;
}

function practicalSuggestions(destination: string): readonly CraftSuggestion[] {
  return [
    {
      text: `What's the best way to get from the airport to the city center?`,
      category: 'practical',
      priority: 5,
    },
    {
      text: `Do I need cash or are cards accepted everywhere?`,
      category: 'practical',
      priority: 5,
    },
    {
      text: `Any neighborhoods I should avoid?`,
      category: 'practical',
      priority: 5,
    },
  ];
}

function returnVisitorSuggestions(
  destination: string,
  previousTrips: readonly Trip[]
): readonly CraftSuggestion[] {
  const visited = previousTrips.some(
    (t) => t.destination?.toLowerCase() === destination.toLowerCase()
  );

  if (visited) {
    return [
      {
        text: `I've been here before — show me something new`,
        category: 'insider',
        priority: 1,
      },
      {
        text: `What's changed since my last visit?`,
        category: 'insider',
        priority: 2,
      },
    ];
  }

  return [];
}

// ---------------------------------------------------------------------------
// Main: generate personalized suggestions
// ---------------------------------------------------------------------------

export function generateCraftSuggestions(
  destination: string,
  dna: TravelerDNA | null,
  previousTrips: readonly Trip[] = []
): readonly CraftSuggestion[] {
  const all: CraftSuggestion[] = [];

  // Return visitor check first (highest priority)
  all.push(...returnVisitorSuggestions(destination, previousTrips));

  if (dna && dna.confidence > 0) {
    all.push(...budgetSuggestions(destination, dna.budget_tier));
    all.push(...styleSuggestions(destination, dna.styles));
    all.push(...companionSuggestions(destination, dna.companions));
  }

  // Always include practical suggestions
  all.push(...practicalSuggestions(destination));

  // Sort by priority (lower = higher priority), dedupe, take top 5
  const sorted = [...all].sort((a, b) => a.priority - b.priority);
  const seen = new Set<string>();
  const unique: CraftSuggestion[] = [];

  for (const s of sorted) {
    if (!seen.has(s.text) && unique.length < 5) {
      seen.add(s.text);
      unique.push(s);
    }
  }

  return unique;
}

// ---------------------------------------------------------------------------
// Quick suggestions — for when we have no DNA (first-time user)
// ---------------------------------------------------------------------------

export function getQuickSuggestions(
  destination: string
): readonly CraftSuggestion[] {
  return [
    {
      text: `What should I do on my first day?`,
      category: 'explore',
      priority: 1,
    },
    {
      text: `Best food in ${destination}?`,
      category: 'insider',
      priority: 2,
    },
    {
      text: `How many days do I actually need?`,
      category: 'practical',
      priority: 3,
    },
    {
      text: `What's overrated that I can skip?`,
      category: 'insider',
      priority: 4,
    },
  ];
}
