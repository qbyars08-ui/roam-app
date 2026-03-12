// =============================================================================
// ROAM — Shimmer overlay while image loads
// Subtle animated gradient sweep over base color
// =============================================================================
import React, { useEffect, useRef } from 'react';
import { Animated, StyleSheet, View } from 'react-native';
import { LinearGradient } from 'expo-linear-gradient';
import { COLORS } from '../../lib/constants';

interface ShimmerOverlayProps {
  visible: boolean;
  style?: object;
}

export default function ShimmerOverlay({ visible, style }: ShimmerOverlayProps) {
  const translateX = useRef(new Animated.Value(0)).current;

  useEffect(() => {
    if (!visible) return;
    translateX.setValue(0);
    const anim = Animated.loop(
      Animated.timing(translateX, {
        toValue: 1,
        duration: 1600,
        useNativeDriver: true,
      })
    );
    anim.start();
    return () => anim.stop();
  }, [visible, translateX]);

  if (!visible) return null;

  return (
    <View style={[StyleSheet.absoluteFill, styles.base, style]} pointerEvents="none">
      <Animated.View
        style={[
          StyleSheet.absoluteFill,
          {
            transform: [
              {
                translateX: translateX.interpolate({
                  inputRange: [0, 1],
                  outputRange: [-100, 300],
                }),
              },
            ],
          },
        ]}
      >
        <LinearGradient
          colors={[
            'transparent',
            'rgba(255,255,255,0.06)',
            'rgba(255,255,255,0.1)',
            'rgba(255,255,255,0.06)',
            'transparent',
          ]}
          locations={[0, 0.25, 0.5, 0.75, 1]}
          start={{ x: 0, y: 0.5 }}
          end={{ x: 1, y: 0.5 }}
          style={[StyleSheet.absoluteFill, { width: 80 }]}
        />
      </Animated.View>
    </View>
  );
}

const styles = StyleSheet.create({
  base: {
    backgroundColor: COLORS.bgElevated,
  },
});
