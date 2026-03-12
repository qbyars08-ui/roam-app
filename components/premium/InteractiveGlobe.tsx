// =============================================================================
// ROAM — 3D Interactive Globe (web only)
// Uses CSS sphere as fallback; full Three.js requires createPortal for web
// =============================================================================
import React from 'react';
import { View, Text, StyleSheet, Dimensions, Platform } from 'react-native';
import { COLORS, FONTS } from '../../lib/constants';

const { width: W } = Dimensions.get('window');
const GLOBE_SIZE = Math.min(W * 0.6, 240);

export default function InteractiveGlobe() {
  if (Platform.OS !== 'web') {
    return null;
  }

  return (
    <View style={styles.container}>
      {/* Placeholder: styled sphere-looking element; full Three.js in separate PR */}
      <View style={styles.globe}>
        <View style={styles.globeInner} />
        <Text style={styles.hint}>Spin to explore</Text>
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    height: 200,
    alignItems: 'center',
    justifyContent: 'center',
  },
  globe: {
    width: GLOBE_SIZE,
    height: GLOBE_SIZE,
    borderRadius: GLOBE_SIZE / 2,
    backgroundColor: 'rgba(10,31,26,0.9)',
    borderWidth: 1,
    borderColor: 'rgba(74,222,128,0.3)',
    alignItems: 'center',
    justifyContent: 'center',
  },
  globeInner: {
    width: GLOBE_SIZE * 0.7,
    height: GLOBE_SIZE * 0.7,
    borderRadius: GLOBE_SIZE / 2,
    borderWidth: 0.5,
    borderColor: 'rgba(74,222,128,0.2)',
  },
  hint: {
    position: 'absolute',
    bottom: -24,
    fontFamily: FONTS.mono,
    fontSize: 11,
    color: COLORS.creamMuted,
    letterSpacing: 1,
  },
});
