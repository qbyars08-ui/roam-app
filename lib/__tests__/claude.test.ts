/**
 * Test Suite: lib/claude.ts — AI proxy, prompt builder
 * Critical path: every AI call in ROAM goes through callClaude().
 */
import { callClaude, buildTripPrompt, TripLimitReachedError } from '../claude';
import { supabase } from '../supabase';
import type { TravelProfile } from '../types/travel-profile';

const mockInvoke = supabase.functions.invoke as jest.Mock;

// ── callClaude ─────────────────────────────────────────────────────────────

describe('callClaude', () => {
  beforeEach(() => {
    mockInvoke.mockReset();
  });

  it('returns content, tripsUsed, and limit on success', async () => {
    mockInvoke.mockResolvedValueOnce({
      data: { content: 'Tokyo itinerary text', tripsUsed: 2, limit: 5 },
      error: null,
    });

    const result = await callClaude('system prompt', 'user message');

    expect(result.content).toBe('Tokyo itinerary text');
    expect(result.tripsUsed).toBe(2);
    expect(result.limit).toBe(5);
  });

  it('throws TripLimitReachedError with correct properties when code is LIMIT_REACHED', async () => {
    mockInvoke.mockResolvedValueOnce({
      data: { code: 'LIMIT_REACHED', tripsUsed: 1, limit: 1 },
      error: null,
    });

    let caught: unknown;
    try {
      await callClaude('sys', 'msg', true);
    } catch (err) {
      caught = err;
    }

    expect(caught).toBeInstanceOf(TripLimitReachedError);
    expect((caught as TripLimitReachedError).tripsUsed).toBe(1);
    expect((caught as TripLimitReachedError).limit).toBe(1);
    expect((caught as TripLimitReachedError).name).toBe('TripLimitReachedError');
  });

  it('throws a descriptive Error when the edge function returns an error object', async () => {
    mockInvoke.mockResolvedValueOnce({
      data: null,
      error: { message: 'Function unavailable' },
    });

    await expect(callClaude('sys', 'msg')).rejects.toThrow(
      'Claude proxy error: Function unavailable'
    );
  });

  it('throws when data contains a top-level error field', async () => {
    mockInvoke.mockResolvedValueOnce({
      data: { error: 'Internal server error' },
      error: null,
    });

    await expect(callClaude('sys', 'msg')).rejects.toThrow('Internal server error');
  });

  it('forwards the correct body — including isTripGeneration — to the proxy', async () => {
    mockInvoke.mockResolvedValueOnce({
      data: { content: 'ok', tripsUsed: 1, limit: 5 },
      error: null,
    });

    await callClaude('my-system', 'my-message', true);

    expect(mockInvoke).toHaveBeenCalledWith('claude-proxy', {
      body: { system: 'my-system', message: 'my-message', isTripGeneration: true },
    });
  });

  it('defaults isTripGeneration to false when omitted', async () => {
    mockInvoke.mockResolvedValueOnce({
      data: { content: 'ok', tripsUsed: 0, limit: 1 },
      error: null,
    });

    await callClaude('sys', 'msg');

    expect(mockInvoke).toHaveBeenCalledWith('claude-proxy', {
      body: { system: 'sys', message: 'msg', isTripGeneration: false },
    });
  });
});

// ── buildTripPrompt ────────────────────────────────────────────────────────

describe('buildTripPrompt', () => {
  it('includes destination, days, budget, and vibes in output', () => {
    const result = buildTripPrompt({
      destination: 'Tokyo',
      days: 5,
      budget: 'moderate',
      vibes: ['food', 'culture'],
    });

    expect(result).toContain('Tokyo');
    expect(result).toContain('5-day');
    expect(result).toContain('moderate');
    expect(result).toContain('food');
    expect(result).toContain('culture');
  });

  it('falls back to "general sightseeing" when vibes is empty', () => {
    const result = buildTripPrompt({
      destination: 'Paris',
      days: 3,
      budget: 'budget',
      vibes: [],
    });

    expect(result).toContain('general sightseeing');
  });

  it('injects TRAVELER PROFILE block when travelProfile is provided', () => {
    const profile: TravelProfile = {
      passportNationality: 'US',
      travelFrequency: 'few-times-year',
      pace: 7,
      budgetStyle: 8,
      transport: ['metro'],
      crowdTolerance: 6,
      foodAdventurousness: 9,
      accommodation: 'boutique',
      tripPurposes: ['food'],
    };

    const result = buildTripPrompt({
      destination: 'Bangkok',
      days: 4,
      budget: 'moderate',
      vibes: ['food'],
      travelProfile: profile,
    });

    expect(result).toContain('TRAVELER PROFILE');
    expect(result).toContain('US passport');
    // pace 7/10 should appear in the profile string
    expect(result).toContain('7/10');
  });

  it('omits TRAVELER PROFILE when travelProfile is null', () => {
    const result = buildTripPrompt({
      destination: 'Tokyo',
      days: 3,
      budget: 'moderate',
      vibes: ['culture'],
      travelProfile: null,
    });

    expect(result).not.toContain('TRAVELER PROFILE');
  });

  it('includes rain percentage annotation and IMPORTANT block when precipitation > 40%', () => {
    const result = buildTripPrompt({
      destination: 'Tokyo',
      days: 1,
      budget: 'moderate',
      vibes: ['culture'],
      weather: {
        days: [
          {
            date: '2026-03-15',
            tempMin: 12,
            tempMax: 18,
            description: 'heavy rain',
            pop: 0.55,
          },
        ],
      },
    });

    expect(result).toContain('55% chance of rain');
    expect(result).toContain('IMPORTANT: If rain is forecast');
  });

  it('omits rain percentage when precipitation is at or below 30%', () => {
    const result = buildTripPrompt({
      destination: 'Tokyo',
      days: 1,
      budget: 'moderate',
      vibes: ['culture'],
      weather: {
        days: [
          {
            date: '2026-03-15',
            tempMin: 15,
            tempMax: 22,
            description: 'partly cloudy',
            pop: 0.3,
          },
        ],
      },
    });

    expect(result).not.toContain('chance of rain');
    // IMPORTANT block is still injected whenever weather is provided
    expect(result).toContain('IMPORTANT: If rain is forecast');
  });

  it('includes weather dates and temperature range in output', () => {
    const result = buildTripPrompt({
      destination: 'Reykjavik',
      days: 1,
      budget: 'moderate',
      vibes: ['nature'],
      weather: {
        days: [
          {
            date: '2026-03-15',
            tempMin: -2,
            tempMax: 4,
            description: 'snow showers',
            pop: 0.6,
          },
        ],
      },
    });

    expect(result).toContain('2026-03-15');
    expect(result).toContain('-2');
    expect(result).toContain('snow showers');
  });
});
