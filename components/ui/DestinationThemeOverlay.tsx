// =============================================================================
// ROAM — Destination Theme Overlay
// Subtle per-destination background tint — makes the app feel alive
// =============================================================================
import React, { useEffect, useRef, useMemo } from 'react';
import { Animated, StyleSheet, type ViewStyle } from 'react-native';

// Destination → theme color mapping
const DESTINATION_THEME_COLORS: Record<string, string> = {
  'tokyo': 'rgba(232,137,158,0.05)',       // cherry blossom pink
  'paris': 'rgba(155,142,196,0.05)',       // lavender purple
  'bali': 'rgba(124,175,138,0.05)',        // tropical green
  'new york': 'rgba(91,155,213,0.05)',     // steel blue
  'barcelona': 'rgba(232,97,74,0.05)',     // terracotta coral
  'rome': 'rgba(201,168,76,0.05)',         // ochre gold
  'london': 'rgba(136,153,170,0.05)',      // slate grey
  'bangkok': 'rgba(240,160,94,0.05)',      // amber gold
  'marrakech': 'rgba(212,165,116,0.05)',   // sand tan
  'lisbon': 'rgba(245,237,216,0.05)',      // warm cream
  'cape town': 'rgba(96,165,250,0.05)',    // ocean blue
  'seoul': 'rgba(180,136,217,0.05)',       // purple
  'buenos aires': 'rgba(232,97,74,0.05)', // tango red
  'istanbul': 'rgba(201,168,76,0.05)',     // byzantine gold
  'sydney': 'rgba(91,155,213,0.05)',       // harbour blue
  'reykjavik': 'rgba(148,163,184,0.05)',   // glacier grey
  'kyoto': 'rgba(232,137,158,0.04)',       // sakura pink (softer)
  'mexico city': 'rgba(232,97,74,0.05)',   // warm coral
  'budapest': 'rgba(201,168,76,0.04)',     // danube gold
};

function getThemeColor(destination: string): string {
  const key = destination.toLowerCase().trim();
  return DESTINATION_THEME_COLORS[key] ?? 'rgba(124,175,138,0.03)'; // default subtle sage
}

interface DestinationThemeOverlayProps {
  destination: string | null;
}

export default function DestinationThemeOverlay({ destination }: DestinationThemeOverlayProps) {
  const opacity = useRef(new Animated.Value(0)).current;

  const themeColor = useMemo(
    () => (destination ? getThemeColor(destination) : 'transparent'),
    [destination]
  );

  useEffect(() => {
    if (destination) {
      Animated.timing(opacity, {
        toValue: 1,
        duration: 800,
        useNativeDriver: true,
      }).start();
    } else {
      Animated.timing(opacity, {
        toValue: 0,
        duration: 400,
        useNativeDriver: true,
      }).start();
    }
  }, [destination, opacity]);

  if (!destination) return null;

  return (
    <Animated.View
      style={[
        styles.overlay,
        { backgroundColor: themeColor, opacity },
      ]}
      pointerEvents="none"
    />
  );
}

const styles = StyleSheet.create({
  overlay: {
    ...StyleSheet.absoluteFillObject,
    zIndex: 0,
  } as ViewStyle,
});
