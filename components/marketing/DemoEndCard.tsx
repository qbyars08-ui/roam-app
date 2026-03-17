// =============================================================================
// ROAM — Demo End Card
// Full-screen component for the end of demo videos
// =============================================================================
import React from 'react';
import { StyleSheet, Text, View, type TextStyle, type ViewStyle } from 'react-native';
import { COLORS, FONTS } from '../../lib/constants';

// ---------------------------------------------------------------------------
// Props
// ---------------------------------------------------------------------------
interface DemoEndCardProps {
  tagline?: string;
  url?: string;
}

// ---------------------------------------------------------------------------
// Component
// ---------------------------------------------------------------------------
export default function DemoEndCard({
  tagline = 'The only travel app you need.',
  url = 'roamapp.app',
}: DemoEndCardProps) {
  return (
    <View style={styles.container}>
      {/* Sage glow behind ROAM text */}
      <View style={styles.glowCircle} />

      <Text style={styles.brandName}>ROAM</Text>
      <Text style={styles.tagline}>{tagline}</Text>
      <Text style={styles.url}>{url}</Text>
    </View>
  );
}

// ---------------------------------------------------------------------------
// Styles
// ---------------------------------------------------------------------------
const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: COLORS.bg,
    alignItems: 'center',
    justifyContent: 'center',
  } as ViewStyle,

  glowCircle: {
    position: 'absolute',
    width: 200,
    height: 200,
    borderRadius: 100,
    backgroundColor: COLORS.sageSubtle,
    shadowColor: COLORS.sage,
    shadowOffset: { width: 0, height: 0 },
    shadowOpacity: 0.6,
    shadowRadius: 80,
    elevation: 0,
  } as ViewStyle,

  brandName: {
    fontFamily: FONTS.header,
    fontSize: 72,
    color: COLORS.cream,
    textAlign: 'center',
    zIndex: 1,
  } as TextStyle,

  tagline: {
    fontFamily: FONTS.body,
    fontSize: 18,
    color: COLORS.creamMuted,
    textAlign: 'center',
    marginTop: 16,
    zIndex: 1,
  } as TextStyle,

  url: {
    fontFamily: FONTS.mono,
    fontSize: 14,
    color: COLORS.sage,
    textAlign: 'center',
    marginTop: 12,
    zIndex: 1,
  } as TextStyle,
});
