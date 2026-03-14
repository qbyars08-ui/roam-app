/**
 * Unit tests for lib/analytics.ts
 * Covers track() for all 8 event types and trackEvent().
 * Uses the global supabase mock from jest.setup.js.
 */
import { supabase } from '../lib/supabase';
import { track, trackEvent, type AnalyticsEvent } from '../lib/analytics';

// ---------------------------------------------------------------------------
// Helpers — capture what analytics inserts into the DB
// ---------------------------------------------------------------------------
let insertSpy: jest.Mock;

beforeEach(() => {
  jest.clearAllMocks();
  // Override from() to capture insert args while staying Promise-compatible
  insertSpy = jest.fn().mockResolvedValue({ data: null, error: null });
  (supabase.from as jest.Mock).mockReturnValue({ insert: insertSpy });
});

// ---------------------------------------------------------------------------
// trackEvent()
// ---------------------------------------------------------------------------

describe('trackEvent', () => {
  it('inserts into analytics_events with the given event_type', async () => {
    await trackEvent('page_view', { screen: 'home' });
    expect(supabase.from).toHaveBeenCalledWith('analytics_events');
    expect(insertSpy).toHaveBeenCalledTimes(1);
    const row = insertSpy.mock.calls[0][0] as Record<string, unknown>;
    expect(row.event_type).toBe('page_view');
    expect(row.payload).toEqual({ screen: 'home' });
  });

  it('uses empty object as payload when none provided', async () => {
    await trackEvent('onboarding_complete');
    const row = insertSpy.mock.calls[0][0] as Record<string, unknown>;
    expect(row.payload).toEqual({});
  });

  it('includes session_id in every row', async () => {
    await trackEvent('test_event');
    const row = insertSpy.mock.calls[0][0] as Record<string, unknown>;
    expect(typeof row.session_id).toBe('string');
    expect((row.session_id as string).startsWith('sess_')).toBe(true);
  });

  it('does not throw when supabase insert fails', async () => {
    insertSpy.mockRejectedValueOnce(new Error('DB connection lost'));
    await expect(trackEvent('error_event')).resolves.toBeUndefined();
  });

  it('does not throw when getSession fails', async () => {
    (supabase.auth.getSession as jest.Mock).mockRejectedValueOnce(new Error('auth down'));
    await expect(trackEvent('auth_fail_event')).resolves.toBeUndefined();
  });
});

// ---------------------------------------------------------------------------
// track() — all 8 event types
// ---------------------------------------------------------------------------

describe('track — tap', () => {
  it('sets event_type, screen, and action', async () => {
    const event: AnalyticsEvent = { type: 'tap', screen: 'discover', action: 'destination_card' };
    await track(event);
    const row = insertSpy.mock.calls[0][0] as Record<string, unknown>;
    expect(row.event_type).toBe('tap');
    expect(row.screen).toBe('discover');
    expect(row.action).toBe('destination_card');
  });

  it('forwards optional payload', async () => {
    const event: AnalyticsEvent = { type: 'tap', screen: 'plan', action: 'generate', payload: { budget: 'mid' } };
    await track(event);
    const row = insertSpy.mock.calls[0][0] as Record<string, unknown>;
    expect((row.payload as Record<string, unknown>).budget).toBe('mid');
  });
});

describe('track — screen_view', () => {
  it('sets event_type and screen', async () => {
    await track({ type: 'screen_view', screen: 'itinerary' });
    const row = insertSpy.mock.calls[0][0] as Record<string, unknown>;
    expect(row.event_type).toBe('screen_view');
    expect(row.screen).toBe('itinerary');
  });
});

describe('track — flow_step', () => {
  it('encodes flow and step into payload', async () => {
    await track({ type: 'flow_step', flow: 'onboarding', step: 2 });
    const row = insertSpy.mock.calls[0][0] as Record<string, unknown>;
    expect(row.event_type).toBe('flow_step');
    const payload = row.payload as Record<string, unknown>;
    expect(payload.flow).toBe('onboarding');
    expect(payload.step).toBe(2);
  });
});

describe('track — flow_abandon', () => {
  it('encodes flow and step into payload', async () => {
    await track({ type: 'flow_abandon', flow: 'trip_creation', step: 3 });
    const row = insertSpy.mock.calls[0][0] as Record<string, unknown>;
    expect(row.event_type).toBe('flow_abandon');
    const payload = row.payload as Record<string, unknown>;
    expect(payload.flow).toBe('trip_creation');
    expect(payload.step).toBe(3);
  });
});

describe('track — feature_use', () => {
  it('encodes feature into payload', async () => {
    await track({ type: 'feature_use', feature: 'chaos_mode' });
    const row = insertSpy.mock.calls[0][0] as Record<string, unknown>;
    expect(row.event_type).toBe('feature_use');
    const payload = row.payload as Record<string, unknown>;
    expect(payload.feature).toBe('chaos_mode');
  });
});

describe('track — error', () => {
  it('sets screen and encodes message in payload', async () => {
    await track({ type: 'error', screen: 'plan', message: 'generate failed' });
    const row = insertSpy.mock.calls[0][0] as Record<string, unknown>;
    expect(row.event_type).toBe('error');
    expect(row.screen).toBe('plan');
    const payload = row.payload as Record<string, unknown>;
    expect(payload.message).toBe('generate failed');
  });
});

describe('track — session_start', () => {
  it('inserts with event_type session_start', async () => {
    await track({ type: 'session_start' });
    const row = insertSpy.mock.calls[0][0] as Record<string, unknown>;
    expect(row.event_type).toBe('session_start');
    expect(row.payload).toEqual({});
  });
});

describe('track — session_end', () => {
  it('encodes duration_seconds in payload', async () => {
    await track({ type: 'session_end', duration_seconds: 342 });
    const row = insertSpy.mock.calls[0][0] as Record<string, unknown>;
    expect(row.event_type).toBe('session_end');
    const payload = row.payload as Record<string, unknown>;
    expect(payload.duration_seconds).toBe(342);
  });
});

describe('track — error resilience', () => {
  it('never throws when supabase insert rejects', async () => {
    insertSpy.mockRejectedValueOnce(new Error('network error'));
    await expect(track({ type: 'session_start' })).resolves.toBeUndefined();
  });

  it('never throws when getSession rejects', async () => {
    (supabase.auth.getSession as jest.Mock).mockRejectedValueOnce(new Error('auth down'));
    await expect(track({ type: 'screen_view', screen: 'home' })).resolves.toBeUndefined();
  });

  it('uses null user_id when no session', async () => {
    (supabase.auth.getSession as jest.Mock).mockResolvedValueOnce({
      data: { session: null }, error: null,
    });
    await track({ type: 'session_start' });
    const row = insertSpy.mock.calls[0][0] as Record<string, unknown>;
    expect(row.user_id).toBeNull();
  });

  it('uses real user_id when session is present', async () => {
    (supabase.auth.getSession as jest.Mock).mockResolvedValueOnce({
      data: { session: { user: { id: 'user-abc-123' } } }, error: null,
    });
    await track({ type: 'tap', screen: 'home', action: 'button' });
    const row = insertSpy.mock.calls[0][0] as Record<string, unknown>;
    expect(row.user_id).toBe('user-abc-123');
  });
});
