// =============================================================================
// ROAM — Grain Texture Overlay
// Subtle visual noise — the anti-AI-slop signature detail.
// Makes the dark background feel tactile and analog, not flat and digital.
// Native: scattered SVG dots. Web: CSS noise filter.
// =============================================================================
import React from 'react';
import { StyleSheet, View, Platform } from 'react-native';
import Svg, { Circle } from 'react-native-svg';

const GRAIN_COUNT = 600;
const CANVAS = 200;

function generateDots() {
  const dots: Array<{ cx: number; cy: number; r: number; o: number }> = [];
  let seed = 42;
  const rand = () => {
    seed = (seed * 16807 + 0) % 2147483647;
    return (seed - 1) / 2147483646;
  };
  for (let i = 0; i < GRAIN_COUNT; i++) {
    dots.push({
      cx: rand() * CANVAS,
      cy: rand() * CANVAS,
      r: rand() * 0.7 + 0.2,
      o: rand() * 0.06 + 0.01,
    });
  }
  return dots;
}

const DOTS = generateDots();

export default function GrainOverlay() {
  if (Platform.OS === 'web') {
    return (
      <View
        style={styles.container}
        pointerEvents="none"
        accessibilityRole="none"
      >
        <View
          style={[
            StyleSheet.absoluteFill,
            {
              backgroundImage:
                'url("data:image/svg+xml,%3Csvg viewBox=\'0 0 256 256\' xmlns=\'http://www.w3.org/2000/svg\'%3E%3Cfilter id=\'n\'%3E%3CfeTurbulence type=\'fractalNoise\' baseFrequency=\'0.85\' numOctaves=\'4\' stitchTiles=\'stitch\'/%3E%3C/filter%3E%3Crect width=\'100%25\' height=\'100%25\' filter=\'url(%23n)\' opacity=\'0.03\'/%3E%3C/svg%3E")',
              backgroundRepeat: 'repeat',
              backgroundSize: '128px 128px',
            },
          ]}
        />
      </View>
    );
  }

  return (
    <View style={styles.container} pointerEvents="none">
      <Svg width={CANVAS} height={CANVAS} viewBox={`0 0 ${CANVAS} ${CANVAS}`}>
        {DOTS.map((d, i) => (
          <Circle
            key={i}
            cx={d.cx}
            cy={d.cy}
            r={d.r}
            fill="#E8F5E1"
            opacity={d.o}
          />
        ))}
      </Svg>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    ...StyleSheet.absoluteFillObject,
    zIndex: 1,
    overflow: 'hidden',
  },
});
