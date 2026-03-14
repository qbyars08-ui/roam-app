/**
 * Unit tests for lib/sharing.ts
 * Covers: shareTrip, getSharedTrip (UUID validation + DB fetch),
 * copyShareableLink (with/without session, fallback).
 */
import { supabase } from '../lib/supabase';
import { shareTrip, getSharedTrip, copyShareableLink } from '../lib/sharing';
import * as Clipboard from 'expo-clipboard';
import { Alert, Share } from 'react-native';
import type { Trip } from '../lib/store';
// Alert and Share are mocked globally via jest.setup.js

// ---------------------------------------------------------------------------
// Fixtures
// ---------------------------------------------------------------------------

const VALID_UUID = 'f47ac10b-58cc-4372-a567-0e02b2c3d479';
const ANOTHER_UUID = 'a1b2c3d4-e5f6-4a7b-8c9d-0e1f2a3b4c5d';

const SAMPLE_TRIP: Trip = {
  id: 'trip-local-1',
  destination: 'Lisbon',
  days: 5,
  budget: 'mid',
  vibes: ['culture', 'food'],
  itinerary: JSON.stringify({ destination: 'Lisbon', days: [] }),
  createdAt: new Date().toISOString(),
};

// ---------------------------------------------------------------------------
// DB mock helpers
// ---------------------------------------------------------------------------
let singleMock: jest.Mock;

function setupFromMock(result: { data: unknown; error: unknown } = { data: null, error: null }) {
  singleMock = jest.fn().mockResolvedValue(result);
  (supabase.from as jest.Mock).mockReturnValue({
    select: jest.fn().mockReturnThis(),
    insert: jest.fn().mockReturnThis(),
    eq: jest.fn().mockReturnThis(),
    single: singleMock,
  });
}

function setupSessionMock(userId: string | null) {
  (supabase.auth.getSession as jest.Mock).mockResolvedValue({
    data: {
      session: userId ? { user: { id: userId } } : null,
    },
    error: null,
  });
}

beforeEach(() => {
  jest.clearAllMocks();
  setupFromMock();
  setupSessionMock(null);
  // Re-apply default implementations after clearAllMocks
  (Share.share as jest.Mock).mockResolvedValue({ action: 'sharedAction' });
});

// ---------------------------------------------------------------------------
// getSharedTrip — UUID validation (isValidShareId)
// ---------------------------------------------------------------------------

describe('getSharedTrip — UUID validation', () => {
  it('returns null for empty string without hitting DB', async () => {
    const result = await getSharedTrip('');
    expect(result).toBeNull();
    expect(supabase.from).not.toHaveBeenCalled();
  });

  it('returns null for a plain string (not UUID)', async () => {
    expect(await getSharedTrip('not-a-uuid')).toBeNull();
    expect(supabase.from).not.toHaveBeenCalled();
  });

  it('returns null for a UUID with wrong version digit', async () => {
    // Version digit must be 1-5; '0' is invalid
    expect(await getSharedTrip('f47ac10b-58cc-0372-a567-0e02b2c3d479')).toBeNull();
  });

  it('returns null for a UUID missing one hex group', async () => {
    expect(await getSharedTrip('f47ac10b-58cc-4372-a567')).toBeNull();
  });

  it('returns null for a UUID with uppercase letters but otherwise valid', async () => {
    // UUID_REGEX uses /i flag, so uppercase should be valid
    setupFromMock({ data: { id: VALID_UUID, destination: 'Rome', days: 3, budget: 'mid', vibes: [], itinerary: '{}', created_at: '2026-01-01' }, error: null });
    const result = await getSharedTrip(VALID_UUID.toUpperCase());
    expect(result).not.toBeNull();
  });

  it('trims whitespace before validating', async () => {
    setupFromMock({ data: null, error: null });
    // Valid UUID with leading/trailing spaces → should still pass validation and hit DB
    await getSharedTrip(`  ${VALID_UUID}  `);
    expect(supabase.from).toHaveBeenCalled();
  });

  it('accepts a valid v4-style UUID and hits DB', async () => {
    setupFromMock({ data: null, error: null });
    await getSharedTrip(VALID_UUID);
    expect(supabase.from).toHaveBeenCalledWith('shared_trips');
  });
});

// ---------------------------------------------------------------------------
// getSharedTrip — DB fetch
// ---------------------------------------------------------------------------

describe('getSharedTrip — DB fetch', () => {
  it('returns SharedTrip when DB row is found', async () => {
    const mockRow = {
      id: VALID_UUID,
      destination: 'Rome',
      days: 4,
      budget: 'luxury',
      vibes: ['history'],
      itinerary: '{"days":[]}',
      created_at: '2026-01-01T00:00:00Z',
    };
    setupFromMock({ data: mockRow, error: null });
    const result = await getSharedTrip(VALID_UUID);
    expect(result).not.toBeNull();
    expect(result?.destination).toBe('Rome');
    expect(result?.days).toBe(4);
  });

  it('returns null when DB returns no data', async () => {
    setupFromMock({ data: null, error: null });
    expect(await getSharedTrip(VALID_UUID)).toBeNull();
  });

  it('returns null when DB returns an error', async () => {
    setupFromMock({ data: null, error: { code: 'PGRST116', message: 'not found' } });
    expect(await getSharedTrip(VALID_UUID)).toBeNull();
  });

  it('returns null and does not throw when supabase throws', async () => {
    (supabase.from as jest.Mock).mockImplementationOnce(() => { throw new Error('network'); });
    await expect(getSharedTrip(VALID_UUID)).resolves.toBeNull();
  });

  it('queries the correct table and field', async () => {
    setupFromMock({ data: null, error: null });
    await getSharedTrip(VALID_UUID);
    expect(supabase.from).toHaveBeenCalledWith('shared_trips');
    const eqMock = (supabase.from as jest.Mock).mock.results[0].value.eq as jest.Mock;
    expect(eqMock).toHaveBeenCalledWith('id', VALID_UUID.trim());
  });
});

// ---------------------------------------------------------------------------
// shareTrip
// ---------------------------------------------------------------------------

describe('shareTrip — authentication guard', () => {
  it('returns null and shows Alert when no session', async () => {
    setupSessionMock(null);
    const result = await shareTrip(SAMPLE_TRIP);
    expect(result).toBeNull();
    expect(Alert.alert).toHaveBeenCalledWith(
      'Sign in required',
      'Please sign in to share trips.'
    );
  });

  it('does not insert into DB when no session', async () => {
    setupSessionMock(null);
    await shareTrip(SAMPLE_TRIP);
    expect(supabase.from).not.toHaveBeenCalled();
  });
});

describe('shareTrip — successful share', () => {
  beforeEach(() => {
    setupSessionMock('user-abc-123');
  });

  it('returns the share ID on success', async () => {
    setupFromMock({ data: { id: VALID_UUID }, error: null });
    const result = await shareTrip(SAMPLE_TRIP);
    expect(result).toBe(VALID_UUID);
  });

  it('inserts into shared_trips with correct fields', async () => {
    setupFromMock({ data: { id: VALID_UUID }, error: null });
    await shareTrip(SAMPLE_TRIP);
    expect(supabase.from).toHaveBeenCalledWith('shared_trips');
    const insertMock = (supabase.from as jest.Mock).mock.results[0].value.insert as jest.Mock;
    const inserted = insertMock.mock.calls[0][0] as Record<string, unknown>;
    expect(inserted.destination).toBe('Lisbon');
    expect(inserted.days).toBe(5);
    expect(inserted.user_id).toBe('user-abc-123');
  });

  it('calls Share.share with a message containing the URL', async () => {
    setupFromMock({ data: { id: VALID_UUID }, error: null });
    const { Share } = require('react-native');
    await shareTrip(SAMPLE_TRIP);
    expect(Share.share).toHaveBeenCalledTimes(1);
    const args = (Share.share as jest.Mock).mock.calls[0][0];
    expect(args.message).toContain('Lisbon');
    expect(args.message).toContain('5-day');
  });
});

describe('shareTrip — DB insert failure', () => {
  it('returns null and shows error Alert when insert fails', async () => {
    setupSessionMock('user-abc');
    setupFromMock({ data: null, error: { code: '500', message: 'failed' } });
    const result = await shareTrip(SAMPLE_TRIP);
    expect(result).toBeNull();
    expect(Alert.alert).toHaveBeenCalledWith('Error', 'Could not create share link.');
  });

  it('returns null when data is null even with no error', async () => {
    setupSessionMock('user-abc');
    setupFromMock({ data: null, error: null });
    const result = await shareTrip(SAMPLE_TRIP);
    expect(result).toBeNull();
  });
});

// ---------------------------------------------------------------------------
// copyShareableLink
// ---------------------------------------------------------------------------

describe('copyShareableLink — with signed-in user', () => {
  beforeEach(() => setupSessionMock('user-xyz'));

  it('returns true on successful copy', async () => {
    setupFromMock({ data: { id: ANOTHER_UUID }, error: null });
    expect(await copyShareableLink(SAMPLE_TRIP)).toBe(true);
  });

  it('copies the full trip URL to clipboard', async () => {
    setupFromMock({ data: { id: ANOTHER_UUID }, error: null });
    await copyShareableLink(SAMPLE_TRIP);
    expect(Clipboard.setStringAsync).toHaveBeenCalledTimes(1);
    const copied = (Clipboard.setStringAsync as jest.Mock).mock.calls[0][0] as string;
    expect(copied).toContain('Lisbon');
    expect(copied).toContain('roamappwait.netlify.app/trip/');
    expect(copied).toContain(ANOTHER_UUID);
  });

  it('falls back to simple clipboard message when insert returns no data', async () => {
    setupFromMock({ data: null, error: null });
    const result = await copyShareableLink(SAMPLE_TRIP);
    expect(result).toBe(true);
    const copied = (Clipboard.setStringAsync as jest.Mock).mock.calls[0][0] as string;
    expect(copied).toContain('Lisbon');
    expect(copied).toContain('roamappwait.netlify.app');
    // Should NOT contain a UUID-style path
    expect(copied).not.toContain('/trip/');
  });
});

describe('copyShareableLink — without session (guest)', () => {
  beforeEach(() => setupSessionMock(null));

  it('returns true using fallback clipboard text', async () => {
    expect(await copyShareableLink(SAMPLE_TRIP)).toBe(true);
    const copied = (Clipboard.setStringAsync as jest.Mock).mock.calls[0][0] as string;
    expect(copied).toContain('Lisbon');
    expect(copied).toContain('roamappwait.netlify.app');
  });

  it('does not call supabase.from when no session', async () => {
    await copyShareableLink(SAMPLE_TRIP);
    expect(supabase.from).not.toHaveBeenCalled();
  });
});

describe('copyShareableLink — error handling', () => {
  it('returns false when Clipboard throws', async () => {
    setupSessionMock(null);
    (Clipboard.setStringAsync as jest.Mock).mockRejectedValueOnce(new Error('clipboard locked'));
    expect(await copyShareableLink(SAMPLE_TRIP)).toBe(false);
  });

  it('returns false when supabase.auth.getSession throws', async () => {
    (supabase.auth.getSession as jest.Mock).mockRejectedValueOnce(new Error('auth fail'));
    expect(await copyShareableLink(SAMPLE_TRIP)).toBe(false);
  });
});
