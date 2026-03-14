/**
 * Tests for components/ui/DestinationImageFallback.tsx
 *
 * Tests gradient color selection, text content, and height prop.
 * Uses react-test-renderer with act() to ensure hooks (useMemo) execute.
 */
import React from 'react';
import renderer, { act } from 'react-test-renderer';

// ---------------------------------------------------------------------------
// Mock expo-linear-gradient — capture gradient props for color assertions.
// Note: jest.mock factories cannot reference out-of-scope bindings (except
// variables prefixed with 'mock'), so we use require() inside the factory.
// ---------------------------------------------------------------------------
const mockGradientLog: Array<{ colors: string[]; style: unknown }> = [];

jest.mock('expo-linear-gradient', () => ({
  LinearGradient: (mockProps: { colors: string[]; style?: unknown; children?: unknown }) => {
    // Record props every time the component renders
    mockGradientLog.push({ colors: mockProps.colors, style: mockProps.style });
    const { View } = require('react-native');
    const ReactModule = require('react');
    return ReactModule.createElement(
      View,
      { testID: 'linear-gradient', style: mockProps.style },
      mockProps.children,
    );
  },
}));

// Suppress act() warnings from useMemo scheduling
jest.spyOn(console, 'error').mockImplementation(() => {});

import DestinationImageFallback from '../components/ui/DestinationImageFallback';

// ---------------------------------------------------------------------------
// Helper — render and return JSON tree
// ---------------------------------------------------------------------------
function render(destination: string, extra?: { country?: string; height?: number }) {
  let tree!: renderer.ReactTestRenderer;
  act(() => {
    tree = renderer.create(
      <DestinationImageFallback destination={destination} {...extra} />
    );
  });
  return tree.toJSON();
}

beforeEach(() => {
  mockGradientLog.length = 0;
});

// ---------------------------------------------------------------------------
// Render — smoke tests
// ---------------------------------------------------------------------------

describe('DestinationImageFallback — renders without crashing', () => {
  it('renders for a known destination', () => {
    expect(() => render('Tokyo')).not.toThrow();
  });

  it('renders for an unknown destination', () => {
    expect(() => render('Atlantis')).not.toThrow();
  });

  it('renders for an empty string destination', () => {
    expect(() => render('')).not.toThrow();
  });

  it('renders a non-null tree', () => {
    expect(render('Paris')).not.toBeNull();
  });
});

// ---------------------------------------------------------------------------
// Text content
// ---------------------------------------------------------------------------

describe('DestinationImageFallback — text content', () => {
  it('shows the destination name in the rendered tree', () => {
    const text = JSON.stringify(render('Seoul'));
    expect(text).toContain('Seoul');
  });

  it('shows country text when country prop is provided', () => {
    const text = JSON.stringify(render('Seoul', { country: 'South Korea' }));
    expect(text).toContain('Seoul');
    expect(text).toContain('South Korea');
  });

  it('does not render country text when country prop is omitted', () => {
    const text = JSON.stringify(render('Bali'));
    expect(text).toContain('Bali');
    // The only text node is the destination name — no "undefined" or extra node
    expect(text).not.toContain('Indonesia');
    expect(text).not.toContain('undefined');
  });
});

// ---------------------------------------------------------------------------
// Gradient color selection — known destinations
// ---------------------------------------------------------------------------

describe('DestinationImageFallback — known destination colors', () => {
  type Case = { destination: string; r: number; g: number; b: number };
  const cases: Case[] = [
    { destination: 'Tokyo',     r: 232, g: 137, b: 158 }, // cherry blossom
    { destination: 'Paris',     r: 155, g: 142, b: 196 }, // lavender
    { destination: 'Bali',      r: 124, g: 175, b: 138 }, // tropical green
    { destination: 'New York',  r:  91, g: 155, b: 213 }, // steel blue
    { destination: 'Barcelona', r: 232, g:  97, b:  74 }, // coral
    { destination: 'Rome',      r: 201, g: 168, b:  76 }, // gold
    { destination: 'London',    r: 136, g: 153, b: 170 }, // slate
    { destination: 'Bangkok',   r: 240, g: 160, b:  94 }, // amber
  ];

  for (const { destination, r, g, b } of cases) {
    it(`${destination} — first gradient stop contains rgba(${r},${g},${b},0.4)`, () => {
      render(destination);
      const last = mockGradientLog[mockGradientLog.length - 1];
      expect(last).toBeDefined();
      expect(last.colors[0]).toBe(`rgba(${r},${g},${b},0.4)`);
    });
  }
});

// ---------------------------------------------------------------------------
// Gradient color selection — unknown destination uses default sage green
// ---------------------------------------------------------------------------

describe('DestinationImageFallback — default color for unknown destinations', () => {
  // DEFAULT_THEME_COLOR = '#7CAF8A' → r=124 g=175 b=138
  it('unknown city uses default color rgba(124,175,138,0.4)', () => {
    render('Narnia');
    const last = mockGradientLog[mockGradientLog.length - 1];
    expect(last.colors[0]).toBe('rgba(124,175,138,0.4)');
  });

  it('empty destination string uses default color', () => {
    render('');
    const last = mockGradientLog[mockGradientLog.length - 1];
    expect(last.colors[0]).toBe('rgba(124,175,138,0.4)');
  });
});

// ---------------------------------------------------------------------------
// Gradient structure
// ---------------------------------------------------------------------------

describe('DestinationImageFallback — gradient structure', () => {
  it('has exactly 2 gradient stops', () => {
    render('Rome');
    const last = mockGradientLog[mockGradientLog.length - 1];
    expect(last.colors).toHaveLength(2);
  });

  it('first stop is rgba (destination color at 0.4 opacity)', () => {
    render('Tokyo');
    const last = mockGradientLog[mockGradientLog.length - 1];
    expect(last.colors[0]).toMatch(/^rgba\(\d+,\d+,\d+,0\.4\)$/);
  });

  it('second stop is COLORS.bg (dark background)', () => {
    render('Paris');
    const last = mockGradientLog[mockGradientLog.length - 1];
    expect(typeof last.colors[1]).toBe('string');
    expect(last.colors[1]).not.toBe(last.colors[0]);
  });
});

// ---------------------------------------------------------------------------
// Height prop
// ---------------------------------------------------------------------------

describe('DestinationImageFallback — height prop', () => {
  it('defaults to 200', () => {
    render('Tokyo');
    const last = mockGradientLog[mockGradientLog.length - 1];
    const styleArr = last.style as Array<{ height?: number }>;
    const heightObj = Array.isArray(styleArr)
      ? styleArr.find((s) => s?.height !== undefined)
      : (last.style as { height?: number });
    expect(heightObj?.height ?? (last.style as { height?: number })?.height).toBe(200);
  });

  it('applies custom height', () => {
    render('Tokyo', { height: 400 });
    const last = mockGradientLog[mockGradientLog.length - 1];
    const styleArr = last.style as Array<{ height?: number }>;
    const heightObj = Array.isArray(styleArr)
      ? styleArr.find((s) => s?.height !== undefined)
      : (last.style as { height?: number });
    expect(heightObj?.height ?? (last.style as { height?: number })?.height).toBe(400);
  });
});
