// =============================================================================
// ROAM — Breathing line loader (horizontal sound-wave pulse)
// No spinning circles — subtle, sage green
// =============================================================================
import React, { useEffect, useRef } from 'react';
import { View, Animated, StyleSheet } from 'react-native';
import { COLORS } from '../../lib/constants';

interface BreathingLineProps {
  width?: number;
  height?: number;
  color?: string;
}

export default function BreathingLine({
  width = 80,
  height = 4,
  color = COLORS.sage,
}: BreathingLineProps) {
  const anim = useRef(new Animated.Value(0.3)).current;

  useEffect(() => {
    const loop = Animated.loop(
      Animated.sequence([
        Animated.timing(anim, {
          toValue: 1,
          duration: 800,
          useNativeDriver: true,
        }),
        Animated.timing(anim, {
          toValue: 0.3,
          duration: 800,
          useNativeDriver: true,
        }),
      ])
    );
    loop.start();
    return () => loop.stop();
  }, [anim]);

  const scaleX = anim.interpolate({
    inputRange: [0.3, 1],
    outputRange: [0.3, 1],
  });

  return (
    <View style={[styles.container, { width, height }]}>
      <Animated.View
        style={[
          styles.line,
          {
            width,
            height,
            backgroundColor: color,
            transform: [{ scaleX }],
          },
        ]}
      />
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    justifyContent: 'center',
    alignItems: 'center',
    overflow: 'hidden',
  },
  line: {
    borderRadius: 2,
    transformOrigin: 'center',
  },
});
