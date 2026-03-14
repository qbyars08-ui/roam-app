/**
 * Unit tests for lib/affiliates.ts
 * Covers: AFFILIATE_PARTNERS (buildUrl, estimateLabel for all 4 partners),
 * getCityCode fallback, encodeCity, trackAffiliateClick, openAffiliateLink,
 * CATEGORY_LABELS, CATEGORY_ICONS.
 */
import { supabase } from '../lib/supabase';
import { useAppStore } from '../lib/store';
import { Linking } from 'react-native';
import {
  AFFILIATE_PARTNERS,
  CATEGORY_LABELS,
  CATEGORY_ICONS,
  trackAffiliateClick,
  openAffiliateLink,
  type AffiliateParams,
} from '../lib/affiliates';
// Linking is mocked globally via jest.setup.js

// ---------------------------------------------------------------------------
// Supabase insert spy
// ---------------------------------------------------------------------------

let insertSpy: jest.Mock;

beforeEach(() => {
  jest.clearAllMocks();
  insertSpy = jest.fn().mockResolvedValue({ data: null, error: null });
  (supabase.from as jest.Mock).mockReturnValue({ insert: insertSpy });
  useAppStore.setState({ session: null });
  // Re-apply default implementations after clearAllMocks
  (Linking.canOpenURL as jest.Mock).mockResolvedValue(true);
  (Linking.openURL as jest.Mock).mockResolvedValue(undefined);
});

// ---------------------------------------------------------------------------
// AFFILIATE_PARTNERS array shape
// ---------------------------------------------------------------------------

describe('AFFILIATE_PARTNERS — structure', () => {
  it('has exactly 4 partners', () => {
    expect(AFFILIATE_PARTNERS).toHaveLength(4);
  });

  it('each partner has id, name, category, color, buildUrl, estimateLabel', () => {
    for (const p of AFFILIATE_PARTNERS) {
      expect(typeof p.id).toBe('string');
      expect(typeof p.name).toBe('string');
      expect(['flights', 'hotels', 'experiences', 'car-rental']).toContain(p.category);
      expect(typeof p.color).toBe('string');
      expect(typeof p.buildUrl).toBe('function');
      expect(typeof p.estimateLabel).toBe('function');
    }
  });

  it('has one partner per category', () => {
    const categories = AFFILIATE_PARTNERS.map((p) => p.category);
    expect(new Set(categories).size).toBe(4);
  });
});

// ---------------------------------------------------------------------------
// Skyscanner — flights partner
// ---------------------------------------------------------------------------

describe('Skyscanner partner', () => {
  const partner = AFFILIATE_PARTNERS.find((p) => p.id === 'skyscanner')!;
  const base: AffiliateParams = { destination: 'Tokyo' };

  it('exists with correct metadata', () => {
    expect(partner).toBeDefined();
    expect(partner.category).toBe('flights');
    expect(partner.name).toBe('Skyscanner');
  });

  it('builds URL with known city code (TYO for Tokyo)', () => {
    const url = partner.buildUrl(base);
    expect(url).toContain('/TYO/');
    expect(url).toContain('associateId=roam');
  });

  it('falls back to 3-char uppercase for unknown destinations', () => {
    const url = partner.buildUrl({ destination: 'Zanzibar' });
    expect(url).toContain('/ZAN/');
  });

  it('always returns "Find cheap flights" as estimateLabel', () => {
    expect(partner.estimateLabel(base)).toBe('Find cheap flights');
    expect(partner.estimateLabel({ destination: 'Paris', days: 7 })).toBe('Find cheap flights');
  });
});

// ---------------------------------------------------------------------------
// Booking.com — hotels partner
// ---------------------------------------------------------------------------

describe('Booking.com partner', () => {
  const partner = AFFILIATE_PARTNERS.find((p) => p.id === 'booking')!;

  it('builds URL with URL-encoded city name', () => {
    const url = partner.buildUrl({ destination: 'New York' });
    expect(url).toContain('new-york');
    expect(url).toContain('aid=roam');
    expect(url).toContain('booking.com');
  });

  it('lowercases the city in the URL', () => {
    const url = partner.buildUrl({ destination: 'PARIS' });
    expect(url).toContain('paris');
    expect(url).not.toContain('PARIS');
  });

  it('replaces spaces with hyphens', () => {
    const url = partner.buildUrl({ destination: 'Buenos Aires' });
    expect(url).toContain('buenos-aires');
  });

  it('estimateLabel shows calculated price when days provided', () => {
    const label = partner.estimateLabel({ destination: 'Rome', days: 4 });
    expect(label).toContain('4 nights');
    expect(label).toContain('$180'); // 4 * 45
  });

  it('estimateLabel shows "Find hotels" when no days', () => {
    expect(partner.estimateLabel({ destination: 'Rome' })).toBe('Find hotels');
  });

  it('estimateLabel calculates cost correctly: days * 45', () => {
    expect(partner.estimateLabel({ destination: 'Bali', days: 7 })).toContain('$315');
    expect(partner.estimateLabel({ destination: 'Bali', days: 1 })).toContain('$45');
  });
});

// ---------------------------------------------------------------------------
// GetYourGuide — experiences partner
// ---------------------------------------------------------------------------

describe('GetYourGuide partner', () => {
  const partner = AFFILIATE_PARTNERS.find((p) => p.id === 'getyourguide')!;

  it('builds URL with partner_id=roam', () => {
    const url = partner.buildUrl({ destination: 'Barcelona' });
    expect(url).toContain('getyourguide.com');
    expect(url).toContain('partner_id=roam');
    expect(url).toContain('barcelona');
  });

  it('always returns "Book tours & activities" as estimateLabel', () => {
    expect(partner.estimateLabel({ destination: 'Seoul' })).toBe('Book tours & activities');
  });
});

// ---------------------------------------------------------------------------
// Rentalcars — car-rental partner
// ---------------------------------------------------------------------------

describe('Rentalcars partner', () => {
  const partner = AFFILIATE_PARTNERS.find((p) => p.id === 'rentalcars')!;

  it('builds URL with affiliateCode=roam', () => {
    const url = partner.buildUrl({ destination: 'Lisbon' });
    expect(url).toContain('rentalcars.com');
    expect(url).toContain('affiliateCode=roam');
    expect(url).toContain('lisbon');
  });

  it('estimateLabel shows calculated price when days provided', () => {
    const label = partner.estimateLabel({ destination: 'Dubai', days: 5 });
    expect(label).toContain('5 days');
    expect(label).toContain('$125'); // 5 * 25
  });

  it('estimateLabel shows "Rent a car" when no days', () => {
    expect(partner.estimateLabel({ destination: 'Dubai' })).toBe('Rent a car');
  });

  it('estimateLabel calculates cost correctly: days * 25', () => {
    expect(partner.estimateLabel({ destination: 'Bali', days: 3 })).toContain('$75');
    expect(partner.estimateLabel({ destination: 'Bali', days: 10 })).toContain('$250');
  });
});

// ---------------------------------------------------------------------------
// getCityCode fallback — tested via buildUrl
// ---------------------------------------------------------------------------

describe('getCityCode fallback', () => {
  const skyscanner = AFFILIATE_PARTNERS.find((p) => p.id === 'skyscanner')!;

  it('uses exact CITY_CODES entry for known cities', () => {
    expect(skyscanner.buildUrl({ destination: 'Paris' })).toContain('/PAR/');
    expect(skyscanner.buildUrl({ destination: 'Bali' })).toContain('/DPS/');
    expect(skyscanner.buildUrl({ destination: 'London' })).toContain('/LON/');
  });

  it('takes first 3 chars uppercase for unknown destinations', () => {
    const url = skyscanner.buildUrl({ destination: 'Auckland' });
    expect(url).toContain('/AUC/');
  });

  it('handles short destination names (< 3 chars) without crashing', () => {
    expect(() => skyscanner.buildUrl({ destination: 'LA' })).not.toThrow();
  });
});

// ---------------------------------------------------------------------------
// trackAffiliateClick
// ---------------------------------------------------------------------------

describe('trackAffiliateClick', () => {
  it('inserts into affiliate_clicks with correct fields', async () => {
    await trackAffiliateClick('skyscanner', 'Tokyo', 'trip-123');
    expect(supabase.from).toHaveBeenCalledWith('affiliate_clicks');
    const row = insertSpy.mock.calls[0][0] as Record<string, unknown>;
    expect(row.partner_id).toBe('skyscanner');
    expect(row.destination).toBe('Tokyo');
    expect(row.trip_id).toBe('trip-123');
    expect(typeof row.clicked_at).toBe('string');
  });

  it('sets trip_id to null when not provided', async () => {
    await trackAffiliateClick('booking', 'Paris');
    const row = insertSpy.mock.calls[0][0] as Record<string, unknown>;
    expect(row.trip_id).toBeNull();
  });

  it('truncates partnerId to 50 chars', async () => {
    const longId = 'p'.repeat(100);
    await trackAffiliateClick(longId, 'Paris');
    const row = insertSpy.mock.calls[0][0] as Record<string, unknown>;
    expect((row.partner_id as string).length).toBe(50);
  });

  it('truncates destination to 200 chars', async () => {
    const longDest = 'd'.repeat(300);
    await trackAffiliateClick('skyscanner', longDest);
    const row = insertSpy.mock.calls[0][0] as Record<string, unknown>;
    expect((row.destination as string).length).toBe(200);
  });

  it('truncates tripId to 64 chars', async () => {
    const longTrip = 't'.repeat(100);
    await trackAffiliateClick('booking', 'Tokyo', longTrip);
    const row = insertSpy.mock.calls[0][0] as Record<string, unknown>;
    expect((row.trip_id as string).length).toBe(64);
  });

  it('uses logged-in user_id when session is present', async () => {
    useAppStore.setState({ session: { user: { id: 'uid-abc' } } as any });
    await trackAffiliateClick('skyscanner', 'Seoul');
    const row = insertSpy.mock.calls[0][0] as Record<string, unknown>;
    expect(row.user_id).toBe('uid-abc');
  });

  it('sets user_id to null when no session', async () => {
    useAppStore.setState({ session: null });
    await trackAffiliateClick('skyscanner', 'Seoul');
    const row = insertSpy.mock.calls[0][0] as Record<string, unknown>;
    expect(row.user_id).toBeNull();
  });

  it('never throws even when supabase insert fails', async () => {
    insertSpy.mockRejectedValueOnce(new Error('insert failed'));
    await expect(trackAffiliateClick('booking', 'Rome')).resolves.toBeUndefined();
  });
});

// ---------------------------------------------------------------------------
// openAffiliateLink
// ---------------------------------------------------------------------------

describe('openAffiliateLink', () => {
  const booking = AFFILIATE_PARTNERS.find((p) => p.id === 'booking')!;
  const params: AffiliateParams = { destination: 'Tokyo', days: 5 };

  it('calls Linking.canOpenURL with the built URL', async () => {
    await openAffiliateLink(booking, params);
    expect((Linking.canOpenURL as jest.Mock)).toHaveBeenCalledTimes(1);
    const calledUrl = (Linking.canOpenURL as jest.Mock).mock.calls[0][0] as string;
    expect(calledUrl).toContain('booking.com');
  });

  it('calls Linking.openURL when canOpenURL returns true', async () => {
    (Linking.canOpenURL as jest.Mock).mockResolvedValueOnce(true);
    await openAffiliateLink(booking, params);
    expect((Linking.openURL as jest.Mock)).toHaveBeenCalledTimes(1);
  });

  it('still calls Linking.openURL when canOpenURL returns false (fallback)', async () => {
    (Linking.canOpenURL as jest.Mock).mockResolvedValueOnce(false);
    await openAffiliateLink(booking, params);
    expect((Linking.openURL as jest.Mock)).toHaveBeenCalledTimes(1);
    // URL should start with https when it's already an http URL
    const url = (Linking.openURL as jest.Mock).mock.calls[0][0] as string;
    expect(url.startsWith('https')).toBe(true);
  });

  it('never throws when Linking.openURL rejects', async () => {
    (Linking.openURL as jest.Mock).mockRejectedValueOnce(new Error('cannot open'));
    await expect(openAffiliateLink(booking, params)).resolves.toBeUndefined();
  });
});

// ---------------------------------------------------------------------------
// CATEGORY_LABELS and CATEGORY_ICONS
// ---------------------------------------------------------------------------

describe('CATEGORY_LABELS', () => {
  it('has all 4 categories', () => {
    expect(CATEGORY_LABELS.flights).toBe('Flights');
    expect(CATEGORY_LABELS.hotels).toBe('Hotels');
    expect(CATEGORY_LABELS.experiences).toBe('Experiences');
    expect(CATEGORY_LABELS['car-rental']).toBe('Car Rental');
  });
});

describe('CATEGORY_ICONS', () => {
  it('has entries for all 4 categories', () => {
    expect('flights' in CATEGORY_ICONS).toBe(true);
    expect('hotels' in CATEGORY_ICONS).toBe(true);
    expect('experiences' in CATEGORY_ICONS).toBe(true);
    expect('car-rental' in CATEGORY_ICONS).toBe(true);
  });
});
