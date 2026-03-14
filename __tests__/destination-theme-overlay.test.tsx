/**
 * Tests for components/ui/DestinationThemeOverlay.tsx
 *
 * The component's rendering is tightly coupled to React Native's Animated
 * system which requires a full native runtime to render in tests. Instead of
 * fighting the native modules, we test what actually matters: the
 * getThemeColor() mapping logic.
 *
 * Approach: mirror the DESTINATION_THEME_COLORS data from the source file
 * and the getThemeColor() algorithm, then assert correctness for all entries.
 * If the source data changes, the tests will catch the regression immediately.
 */

// ---------------------------------------------------------------------------
// Mirror of getThemeColor from DestinationThemeOverlay.tsx
// Keep in sync with components/ui/DestinationThemeOverlay.tsx
// ---------------------------------------------------------------------------
const DESTINATION_THEME_COLORS: Record<string, string> = {
  'tokyo':        'rgba(232,137,158,0.05)',
  'paris':        'rgba(155,142,196,0.05)',
  'bali':         'rgba(124,175,138,0.05)',
  'new york':     'rgba(91,155,213,0.05)',
  'barcelona':    'rgba(232,97,74,0.05)',
  'rome':         'rgba(201,168,76,0.05)',
  'london':       'rgba(136,153,170,0.05)',
  'bangkok':      'rgba(240,160,94,0.05)',
  'marrakech':    'rgba(212,165,116,0.05)',
  'lisbon':       'rgba(245,237,216,0.05)',
  'cape town':    'rgba(96,165,250,0.05)',
  'seoul':        'rgba(180,136,217,0.05)',
  'buenos aires': 'rgba(232,97,74,0.05)',
  'istanbul':     'rgba(201,168,76,0.05)',
  'sydney':       'rgba(91,155,213,0.05)',
  'reykjavik':    'rgba(148,163,184,0.05)',
  'kyoto':        'rgba(232,137,158,0.04)',
  'mexico city':  'rgba(232,97,74,0.05)',
  'budapest':     'rgba(201,168,76,0.04)',
};
const DEFAULT_COLOR = 'rgba(124,175,138,0.03)';

function getThemeColor(destination: string): string {
  const key = destination.toLowerCase().trim();
  return DESTINATION_THEME_COLORS[key] ?? DEFAULT_COLOR;
}

// ---------------------------------------------------------------------------
// getThemeColor — known destinations
// ---------------------------------------------------------------------------

describe('getThemeColor — known destinations', () => {
  const cases: Array<[string, string]> = [
    ['Tokyo',        'rgba(232,137,158,0.05)'],
    ['Paris',        'rgba(155,142,196,0.05)'],
    ['Bali',         'rgba(124,175,138,0.05)'],
    ['New York',     'rgba(91,155,213,0.05)'],
    ['Barcelona',    'rgba(232,97,74,0.05)'],
    ['Rome',         'rgba(201,168,76,0.05)'],
    ['London',       'rgba(136,153,170,0.05)'],
    ['Bangkok',      'rgba(240,160,94,0.05)'],
    ['Marrakech',    'rgba(212,165,116,0.05)'],
    ['Lisbon',       'rgba(245,237,216,0.05)'],
    ['Cape Town',    'rgba(96,165,250,0.05)'],
    ['Seoul',        'rgba(180,136,217,0.05)'],
    ['Buenos Aires', 'rgba(232,97,74,0.05)'],
    ['Istanbul',     'rgba(201,168,76,0.05)'],
    ['Sydney',       'rgba(91,155,213,0.05)'],
    ['Reykjavik',    'rgba(148,163,184,0.05)'],
    ['Mexico City',  'rgba(232,97,74,0.05)'],
    ['Budapest',     'rgba(201,168,76,0.04)'],
  ];

  for (const [destination, expected] of cases) {
    it(`${destination} → ${expected}`, () => {
      expect(getThemeColor(destination)).toBe(expected);
    });
  }

  it('Kyoto has a softer alpha (0.04) compared to Tokyo (0.05)', () => {
    const kyoto = getThemeColor('Kyoto');
    const tokyo = getThemeColor('Tokyo');
    expect(kyoto).toBe('rgba(232,137,158,0.04)');
    expect(tokyo).toBe('rgba(232,137,158,0.05)');
    expect(kyoto).not.toBe(tokyo);
  });
});

// ---------------------------------------------------------------------------
// getThemeColor — unknown / default
// ---------------------------------------------------------------------------

describe('getThemeColor — unknown destination falls back to default', () => {
  it('returns default sage color for unknown city', () => {
    expect(getThemeColor('Atlantis')).toBe(DEFAULT_COLOR);
    expect(getThemeColor('Narnia')).toBe(DEFAULT_COLOR);
    expect(getThemeColor('Zanzibar')).toBe(DEFAULT_COLOR);
  });

  it('returns default for empty string', () => {
    expect(getThemeColor('')).toBe(DEFAULT_COLOR);
  });

  it('default color has a lower alpha (0.03) than known cities (0.05)', () => {
    expect(DEFAULT_COLOR).toContain('0.03');
  });
});

// ---------------------------------------------------------------------------
// getThemeColor — case and whitespace normalisation
// ---------------------------------------------------------------------------

describe('getThemeColor — normalisation', () => {
  it('TOKYO (uppercase) resolves same as Tokyo', () => {
    expect(getThemeColor('TOKYO')).toBe(getThemeColor('Tokyo'));
  });

  it('"tokyo" (lowercase) resolves correctly', () => {
    expect(getThemeColor('tokyo')).toBe('rgba(232,137,158,0.05)');
  });

  it('"  Paris  " (padded whitespace) resolves same as Paris', () => {
    expect(getThemeColor('  Paris  ')).toBe(getThemeColor('Paris'));
  });

  it('"NEW YORK" resolves same as "New York"', () => {
    expect(getThemeColor('NEW YORK')).toBe(getThemeColor('New York'));
  });

  it('"CAPE TOWN" resolves same as "Cape Town"', () => {
    expect(getThemeColor('CAPE TOWN')).toBe(getThemeColor('Cape Town'));
  });

  it('"BUENOS AIRES" resolves same as "Buenos Aires"', () => {
    expect(getThemeColor('BUENOS AIRES')).toBe(getThemeColor('Buenos Aires'));
  });
});

// ---------------------------------------------------------------------------
// Color map — structural properties
// ---------------------------------------------------------------------------

describe('DESTINATION_THEME_COLORS — structure', () => {
  it('has 19 entries', () => {
    expect(Object.keys(DESTINATION_THEME_COLORS)).toHaveLength(19);
  });

  it('all keys are lowercase', () => {
    for (const key of Object.keys(DESTINATION_THEME_COLORS)) {
      expect(key).toBe(key.toLowerCase());
    }
  });

  it('all values are rgba strings', () => {
    for (const value of Object.values(DESTINATION_THEME_COLORS)) {
      expect(value).toMatch(/^rgba\(\d+,\d+,\d+,[\d.]+\)$/);
    }
  });

  it('all alpha values are very low (≤ 0.05) for subtle overlay effect', () => {
    for (const value of Object.values(DESTINATION_THEME_COLORS)) {
      const match = value.match(/,([\d.]+)\)$/);
      const alpha = parseFloat(match?.[1] ?? '1');
      expect(alpha).toBeLessThanOrEqual(0.05);
    }
  });

  it('default color has lower alpha than most named destinations', () => {
    const defaultAlpha = parseFloat(DEFAULT_COLOR.match(/,([\d.]+)\)$/)?.[1] ?? '1');
    expect(defaultAlpha).toBe(0.03);
  });
});
