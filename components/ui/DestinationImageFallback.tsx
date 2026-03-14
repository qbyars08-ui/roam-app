import React, { useMemo } from 'react';
import { StyleSheet, Text, View } from 'react-native';
import { LinearGradient } from 'expo-linear-gradient';

import { COLORS, FONTS, RADIUS, SPACING } from '../../lib/constants';

// ---------------------------------------------------------------------------
// Theme color mapping — unique accent per destination
// ---------------------------------------------------------------------------
const DESTINATION_THEME_COLORS: Record<string, string> = {
  Tokyo: '#E8899E',
  Paris: '#9B8EC4',
  Bali: '#7CAF8A',
  'New York': '#5B9BD5',
  Barcelona: '#E8614A',
  Rome: '#C9A84C',
  London: '#8899AA',
  Bangkok: '#F0A05E',
  Marrakech: '#D4A574',
  Lisbon: '#F5EDD8',
  'Cape Town': '#60A5FA',
  Seoul: '#B488D9',
  'Buenos Aires': '#E8614A',
  Istanbul: '#C9A84C',
  Sydney: '#5B9BD5',
  Reykjavik: '#94A3B8',
};

const DEFAULT_THEME_COLOR = '#7CAF8A';

/**
 * Converts a hex color string to an rgba string at the given opacity.
 */
function hexToRgba(hex: string, alpha: number): string {
  const cleaned = hex.replace('#', '');
  const r = parseInt(cleaned.substring(0, 2), 16);
  const g = parseInt(cleaned.substring(2, 4), 16);
  const b = parseInt(cleaned.substring(4, 6), 16);
  return `rgba(${r},${g},${b},${alpha})`;
}

// ---------------------------------------------------------------------------
// Props
// ---------------------------------------------------------------------------
interface DestinationImageFallbackProps {
  destination: string;
  country?: string;
  height?: number;
}

// ---------------------------------------------------------------------------
// Component
// ---------------------------------------------------------------------------
function DestinationImageFallback({
  destination,
  country,
  height = 200,
}: DestinationImageFallbackProps) {
  const gradientColors = useMemo(() => {
    const themeColor =
      DESTINATION_THEME_COLORS[destination] ?? DEFAULT_THEME_COLOR;
    return [hexToRgba(themeColor, 0.4), COLORS.bg] as const;
  }, [destination]);

  return (
    <LinearGradient
      colors={[gradientColors[0], gradientColors[1]]}
      start={{ x: 0.5, y: 0 }}
      end={{ x: 0.5, y: 1 }}
      style={[styles.container, { height, borderRadius: RADIUS.xl }]}
    >
      <View style={styles.content}>
        <Text style={styles.destinationText}>{destination}</Text>
        {country ? (
          <Text style={styles.countryText}>{country}</Text>
        ) : null}
      </View>
    </LinearGradient>
  );
}

// ---------------------------------------------------------------------------
// Styles
// ---------------------------------------------------------------------------
const styles = StyleSheet.create({
  container: {
    overflow: 'hidden',
    justifyContent: 'center',
    alignItems: 'center',
  },
  content: {
    alignItems: 'center',
    gap: SPACING.xs,
  },
  destinationText: {
    fontFamily: FONTS.header,
    fontSize: 28,
    color: COLORS.white,
    textAlign: 'center',
  },
  countryText: {
    fontFamily: FONTS.mono,
    fontSize: 13,
    color: COLORS.creamMuted,
    textAlign: 'center',
  },
});

export default DestinationImageFallback;
