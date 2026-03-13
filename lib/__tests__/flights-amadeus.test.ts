/**
 * Test Suite: lib/flights-amadeus.ts — Airport lookup, duration formatting
 * Critical path: destination airport resolution drives all flight searches.
 */
import {
  getDestinationAirport,
  formatDuration,
  US_AIRPORTS,
} from '../flights-amadeus';

// ── getDestinationAirport ──────────────────────────────────────────────────

describe('getDestinationAirport', () => {
  it('returns the correct IATA code for an exact match', () => {
    expect(getDestinationAirport('tokyo')).toBe('NRT');
    expect(getDestinationAirport('paris')).toBe('CDG');
    expect(getDestinationAirport('london')).toBe('LHR');
    expect(getDestinationAirport('dubai')).toBe('DXB');
  });

  it('is case-insensitive for exact matches', () => {
    expect(getDestinationAirport('TOKYO')).toBe('NRT');
    expect(getDestinationAirport('Paris')).toBe('CDG');
    expect(getDestinationAirport('NEW YORK')).toBe('JFK');
  });

  it('trims leading and trailing whitespace before matching', () => {
    expect(getDestinationAirport('  tokyo  ')).toBe('NRT');
    expect(getDestinationAirport(' paris')).toBe('CDG');
  });

  it('returns correct code via partial match — "Tokyo, Japan" → NRT', () => {
    expect(getDestinationAirport('Tokyo, Japan')).toBe('NRT');
  });

  it('returns correct code via partial match — "Paris, France" → CDG', () => {
    expect(getDestinationAirport('Paris, France')).toBe('CDG');
  });

  it('returns correct code via partial match — "New York City" → JFK', () => {
    expect(getDestinationAirport('New York City')).toBe('JFK');
  });

  it('handles destinations with spaces in the IATA map — "Hoi An" → DAD', () => {
    expect(getDestinationAirport('hoi an')).toBe('DAD');
    expect(getDestinationAirport('Hoi An, Vietnam')).toBe('DAD');
  });

  it('handles accented destination names — "Medellín" → MDE', () => {
    expect(getDestinationAirport('Medellín')).toBe('MDE');
    expect(getDestinationAirport('medellin')).toBe('MDE');
  });

  it('returns null for a completely unknown destination', () => {
    expect(getDestinationAirport('Atlantis')).toBeNull();
    expect(getDestinationAirport('Narnia')).toBeNull();
    expect(getDestinationAirport('')).toBeNull();
  });

  it('returns null for a random string with no matching airport', () => {
    expect(getDestinationAirport('xyzzy-unknown-place-9999')).toBeNull();
  });
});

// ── formatDuration ─────────────────────────────────────────────────────────

describe('formatDuration', () => {
  it('formats a duration with both hours and minutes', () => {
    expect(formatDuration('PT2H30M')).toBe('2h 30m');
  });

  it('formats a duration with hours only', () => {
    expect(formatDuration('PT14H')).toBe('14h');
  });

  it('formats a duration with minutes only', () => {
    expect(formatDuration('PT45M')).toBe('45m');
  });

  it('formats a long-haul flight duration', () => {
    expect(formatDuration('PT16H55M')).toBe('16h 55m');
  });

  it('formats single-digit hours and minutes', () => {
    expect(formatDuration('PT1H5M')).toBe('1h 5m');
  });

  it('returns the raw string when the ISO format is unrecognized', () => {
    expect(formatDuration('invalid')).toBe('invalid');
    expect(formatDuration('')).toBe('');
  });
});

// ── US_AIRPORTS ────────────────────────────────────────────────────────────

describe('US_AIRPORTS', () => {
  it('contains at least 20 airports', () => {
    expect(US_AIRPORTS.length).toBeGreaterThanOrEqual(20);
  });

  it('has no duplicate IATA codes', () => {
    const codes = US_AIRPORTS.map((a) => a.code);
    const unique = new Set(codes);
    // If there are duplicates, show which ones
    if (unique.size !== codes.length) {
      const seen = new Set<string>();
      const dupes = codes.filter((c) => (seen.has(c) ? true : !seen.add(c)));
      throw new Error(`Duplicate IATA codes found: ${dupes.join(', ')}`);
    }
    expect(unique.size).toBe(codes.length);
  });

  it('has no duplicate city names', () => {
    const cities = US_AIRPORTS.map((a) => a.city);
    const unique = new Set(cities);
    expect(unique.size).toBe(cities.length);
  });

  it('every code is exactly 3 uppercase letters', () => {
    for (const airport of US_AIRPORTS) {
      expect(airport.code).toMatch(/^[A-Z]{3}$/);
    }
  });

  it('every entry has a non-empty city name', () => {
    for (const airport of US_AIRPORTS) {
      expect(airport.city.trim().length).toBeGreaterThan(0);
    }
  });

  it('includes major hub airports — JFK, LAX, ORD, SFO, MIA, ATL', () => {
    const codes = new Set(US_AIRPORTS.map((a) => a.code));
    for (const hub of ['JFK', 'LAX', 'ORD', 'SFO', 'MIA', 'ATL']) {
      expect(codes.has(hub)).toBe(true);
    }
  });
});
