/**
 * Test Suite: generateItinerary end-to-end
 *
 * Tests the full generateItinerary() pipeline:
 *   buildTripPrompt → callClaude → parseItinerary → return typed Itinerary
 *
 * The Supabase edge function (callClaude) and weather module are mocked so
 * no real network calls are made.  All real logic under test:
 *   - buildTripPrompt validation + content
 *   - parseItinerary shape validation
 *   - TripLimitReachedError propagation
 *   - Weather / profile pass-through
 */

// supabase and AsyncStorage mocked globally in jest.setup.js

import { supabase } from '../lib/supabase';
import { useAppStore } from '../lib/store';
import {
  generateItinerary,
  buildTripPrompt,
  TripLimitReachedError,
} from '../lib/claude';

// ---------------------------------------------------------------------------
// Helpers
// ---------------------------------------------------------------------------

function makeValidItineraryJSON(destination = 'Paris, France') {
  return JSON.stringify({
    destination,
    tagline: 'City of lights and croissants',
    totalBudget: '$3,000',
    days: [
      {
        day: 1,
        theme: 'Your First Paris Evening',
        morning: {
          activity: 'Walk along the Seine',
          location: 'Quai des Tuileries',
          cost: '$0',
          tip: 'Start at Pont Neuf and walk east toward Île de la Cité',
        },
        afternoon: {
          activity: 'Lunch at a bistro in Le Marais',
          location: 'Café de la Paix, Le Marais',
          cost: '$25 (€23)',
          tip: 'Order the steak frites — never the tourist menu',
        },
        evening: {
          activity: 'Eiffel Tower at dusk',
          location: 'Champ de Mars',
          cost: '$18 (€17)',
          tip: 'Buy tickets online 2 weeks ahead; the summit line is 3x shorter than the 2nd floor',
        },
        accommodation: {
          name: 'Hôtel des Grands Boulevards',
          type: 'hotel',
          pricePerNight: '$210',
        },
        dailyCost: '$253',
      },
    ],
    budgetBreakdown: {
      accommodation: '$1,470',
      food: '$630',
      activities: '$350',
      transportation: '$280',
      miscellaneous: '$270',
    },
    packingEssentials: ['Comfortable walking shoes', 'Pocket umbrella', 'Paris Museum Pass'],
    proTip: "Avoid the Louvre on Mondays — it is closed. Go to Musee d'Orsay instead and spend a full morning.",
    visaInfo: 'US citizens: visa-free for up to 90 days in Schengen zone.',
  });
}

const BASE_PARAMS = {
  destination: 'Paris, France',
  days: 7,
  budget: 'mid',
  vibes: ['culture', 'food'] as string[],
} as const;

// Typed reference to the mocked supabase functions
const mockInvoke = supabase.functions.invoke as jest.Mock;

beforeEach(() => {
  jest.clearAllMocks();
  // Reset store to logged-in state so ensureValidSession is a no-op
  useAppStore.setState({
    session: {
      user: { id: 'user-real-123', email: 'test@roam.app' },
      access_token: 'valid-jwt',
      refresh_token: '',
      expires_in: 3600,
      token_type: 'bearer',
    } as any,
    isPro: false,
    tripsThisMonth: 0,
    hasCompletedProfile: false,
  });
});

// ---------------------------------------------------------------------------
// buildTripPrompt validation (pure — no mocks needed)
// ---------------------------------------------------------------------------

describe('buildTripPrompt — input validation', () => {
  it('throws when destination is empty', () => {
    expect(() =>
      buildTripPrompt({ ...BASE_PARAMS, destination: '' })
    ).toThrow('Destination is required');
  });

  it('throws when destination is whitespace only', () => {
    expect(() =>
      buildTripPrompt({ ...BASE_PARAMS, destination: '   ' })
    ).toThrow('Destination is required');
  });

  it('throws when days is 0', () => {
    expect(() =>
      buildTripPrompt({ ...BASE_PARAMS, days: 0 })
    ).toThrow('Trip duration must be between 1 and 30 days');
  });

  it('throws when days exceeds 30', () => {
    expect(() =>
      buildTripPrompt({ ...BASE_PARAMS, days: 31 })
    ).toThrow('Trip duration must be between 1 and 30 days');
  });

  it('throws when budget is empty', () => {
    expect(() =>
      buildTripPrompt({ ...BASE_PARAMS, budget: '' })
    ).toThrow('Budget tier is required');
  });

  it('includes destination, days, budget, and vibes in output', () => {
    const prompt = buildTripPrompt(BASE_PARAMS);
    expect(prompt).toContain('Paris, France');
    expect(prompt).toContain('7-day');
    expect(prompt).toContain('mid');
    expect(prompt).toContain('culture, food');
  });

  it('falls back to "general sightseeing" when vibes is empty', () => {
    const prompt = buildTripPrompt({ ...BASE_PARAMS, vibes: [] });
    expect(prompt).toContain('general sightseeing');
  });
});

// ---------------------------------------------------------------------------
// generateItinerary — happy path (mocked edge function)
// ---------------------------------------------------------------------------

describe('generateItinerary — happy path', () => {
  beforeEach(() => {
    mockInvoke.mockResolvedValue({
      data: {
        content: makeValidItineraryJSON(),
        tripsUsed: 1,
        limit: 1,
      },
      error: null,
    });
  });

  it('returns a typed Itinerary object', async () => {
    const result = await generateItinerary({ ...BASE_PARAMS });
    expect(result.itinerary).toBeDefined();
    expect(result.itinerary.destination).toBe('Paris, France');
  });

  it('returns tripsUsed and limit from the edge function response', async () => {
    const result = await generateItinerary({ ...BASE_PARAMS });
    expect(result.tripsUsed).toBe(1);
    expect(result.limit).toBe(1);
  });

  it('calls the edge function exactly once', async () => {
    await generateItinerary({ ...BASE_PARAMS });
    expect(mockInvoke).toHaveBeenCalledTimes(1);
  });

  it('passes isTripGeneration: true to the edge function', async () => {
    await generateItinerary({ ...BASE_PARAMS });
    const callBody = mockInvoke.mock.calls[0][1].body;
    expect(callBody.isTripGeneration).toBe(true);
  });

  it('includes destination and budget in the user message sent to AI', async () => {
    await generateItinerary({ ...BASE_PARAMS });
    const callBody = mockInvoke.mock.calls[0][1].body;
    expect(callBody.message).toContain('Paris, France');
    expect(callBody.message).toContain('mid');
  });

  it('parses all itinerary days correctly', async () => {
    const result = await generateItinerary({ ...BASE_PARAMS });
    expect(result.itinerary.days).toHaveLength(1);
    expect(result.itinerary.days[0].day).toBe(1);
  });
});

// ---------------------------------------------------------------------------
// generateItinerary — LIMIT_REACHED propagation
// ---------------------------------------------------------------------------

describe('generateItinerary — trip limit enforcement', () => {
  it('throws TripLimitReachedError when edge function returns LIMIT_REACHED', async () => {
    mockInvoke.mockResolvedValue({
      data: { code: 'LIMIT_REACHED', tripsUsed: 1, limit: 1 },
      error: null,
    });

    await expect(generateItinerary({ ...BASE_PARAMS })).rejects.toThrow(
      TripLimitReachedError
    );
  });

  it('TripLimitReachedError has correct tripsUsed and limit values', async () => {
    mockInvoke.mockResolvedValue({
      data: { code: 'LIMIT_REACHED', tripsUsed: 1, limit: 1 },
      error: null,
    });

    let caught: TripLimitReachedError | null = null;
    try {
      await generateItinerary({ ...BASE_PARAMS });
    } catch (e) {
      caught = e as TripLimitReachedError;
    }

    expect(caught).toBeInstanceOf(TripLimitReachedError);
    expect(caught!.tripsUsed).toBe(1);
    expect(caught!.limit).toBe(1);
  });

  it('TripLimitReachedError name is "TripLimitReachedError"', async () => {
    mockInvoke.mockResolvedValue({
      data: { code: 'LIMIT_REACHED', tripsUsed: 1, limit: 1 },
      error: null,
    });

    let caught: Error | null = null;
    try {
      await generateItinerary({ ...BASE_PARAMS });
    } catch (e) {
      caught = e as Error;
    }

    expect(caught!.name).toBe('TripLimitReachedError');
  });
});

// ---------------------------------------------------------------------------
// generateItinerary — malformed JSON handling
// ---------------------------------------------------------------------------

describe('generateItinerary — malformed JSON from AI', () => {
  it('throws a parse error when AI returns plain text instead of JSON', async () => {
    mockInvoke.mockResolvedValue({
      data: {
        content: 'Sorry, I cannot help with that.',
        tripsUsed: 1,
        limit: 1,
      },
      error: null,
    });

    await expect(generateItinerary({ ...BASE_PARAMS })).rejects.toThrow(
      /Failed to parse itinerary JSON/
    );
  });

  it('throws a parse error when AI returns JSON missing required fields', async () => {
    mockInvoke.mockResolvedValue({
      data: {
        content: JSON.stringify({ destination: 'Paris' }), // missing days, etc.
        tripsUsed: 1,
        limit: 1,
      },
      error: null,
    });

    await expect(generateItinerary({ ...BASE_PARAMS })).rejects.toThrow();
  });

  it('throws when edge function returns an error field', async () => {
    mockInvoke.mockResolvedValue({
      data: { error: 'Anthropic API rate limit exceeded' },
      error: null,
    });

    await expect(generateItinerary({ ...BASE_PARAMS })).rejects.toThrow(
      'Anthropic API rate limit exceeded'
    );
  });

  it('throws when edge function returns null data', async () => {
    mockInvoke.mockResolvedValue({ data: null, error: null });

    await expect(generateItinerary({ ...BASE_PARAMS })).rejects.toThrow(
      'No response from Claude proxy'
    );
  });

  it('throws when edge function itself errors', async () => {
    mockInvoke.mockResolvedValue({
      data: null,
      error: { message: 'Edge function 500' },
    });

    await expect(generateItinerary({ ...BASE_PARAMS })).rejects.toThrow(
      'Claude proxy error: Edge function 500'
    );
  });
});
