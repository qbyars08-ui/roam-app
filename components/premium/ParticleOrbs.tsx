// =============================================================================
// ROAM — Floating light orbs in background
// =============================================================================
import React, { useEffect, useRef } from 'react';
import { View, StyleSheet, Animated, Dimensions } from 'react-native';
import { COLORS } from '../../lib/constants';

const { width: W, height: H } = Dimensions.get('window');
const ORB_COUNT = 6;

export default function ParticleOrbs() {
  const orbs = useRef(
    Array.from({ length: ORB_COUNT }, () => ({
      opacity: new Animated.Value(0.06 + Math.random() * 0.1),
      scale: new Animated.Value(0.4 + Math.random() * 0.5),
    }))
  ).current;

  useEffect(() => {
    const animations = orbs.map((orb, i) =>
      Animated.loop(
        Animated.sequence([
          Animated.timing(orb.opacity, { toValue: 0.2, duration: 3000 + i * 400, useNativeDriver: true }),
          Animated.timing(orb.opacity, { toValue: 0.06, duration: 3000 + i * 400, useNativeDriver: true }),
        ])
      )
    );
    animations.forEach((a) => a.start());
    return () => animations.forEach((a) => a.stop());
  }, []);

  const positions = [
    { left: W * 0.1, top: H * 0.15 },
    { left: W * 0.6, top: H * 0.2 },
    { left: W * 0.15, top: H * 0.5 },
    { left: W * 0.7, top: H * 0.45 },
    { left: W * 0.35, top: H * 0.75 },
    { left: W * 0.8, top: H * 0.7 },
  ];

  return (
    <View style={styles.container} pointerEvents="none">
      {orbs.map((orb, i) => (
        <Animated.View
          key={i}
          style={[
            styles.orb,
            positions[i],
            {
              transform: [{ scale: orb.scale }],
              opacity: orb.opacity,
            },
          ]}
        />
      ))}
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    ...StyleSheet.absoluteFillObject,
    zIndex: -1,
  },
  orb: {
    position: 'absolute',
    width: 120,
    height: 120,
    borderRadius: 60,
    backgroundColor: COLORS.successLight,
  },
});
