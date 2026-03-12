// =============================================================================
// ROAM — Skeleton Shimmer Loader
// Animated placeholder for loading content
// =============================================================================
import React, { useEffect, useRef } from 'react';
import { Animated, StyleSheet, type ViewStyle } from 'react-native';
import { COLORS, RADIUS } from '../../lib/constants';

// ---------------------------------------------------------------------------
// Types
// ---------------------------------------------------------------------------
interface SkeletonProps {
  /** Width of the skeleton block */
  width: number | `${number}%`;
  /** Height of the skeleton block */
  height: number;
  /** Border radius (defaults to RADIUS.md) */
  borderRadius?: number;
  /** Additional style overrides */
  style?: ViewStyle;
}

// ---------------------------------------------------------------------------
// Component
// ---------------------------------------------------------------------------
export default function Skeleton({
  width,
  height,
  borderRadius = RADIUS.md,
  style,
}: SkeletonProps) {
  const opacity = useRef(new Animated.Value(0.3)).current;

  useEffect(() => {
    const animation = Animated.loop(
      Animated.sequence([
        Animated.timing(opacity, {
          toValue: 0.7,
          duration: 800,
          useNativeDriver: true,
        }),
        Animated.timing(opacity, {
          toValue: 0.3,
          duration: 800,
          useNativeDriver: true,
        }),
      ])
    );
    animation.start();
    return () => animation.stop();
  }, [opacity]);

  return (
    <Animated.View
      style={[
        styles.base,
        { width, height, borderRadius, opacity },
        style,
      ]}
    />
  );
}

// ---------------------------------------------------------------------------
// Prebuilt skeleton patterns
// ---------------------------------------------------------------------------

/** Full-width card skeleton */
export function SkeletonCard({ style }: { style?: ViewStyle }) {
  return (
    <Animated.View style={[styles.card, style]}>
      <Skeleton width="100%" height={160} borderRadius={RADIUS.lg} />
      <Skeleton width="60%" height={16} style={{ marginTop: 12 }} />
      <Skeleton width="40%" height={12} style={{ marginTop: 8 }} />
    </Animated.View>
  );
}

/** Grid of two skeleton cards side by side */
export function SkeletonGrid() {
  return (
    <Animated.View style={styles.grid}>
      <Animated.View style={styles.gridCol}>
        <Skeleton width="100%" height={180} borderRadius={RADIUS.lg} />
        <Skeleton width="70%" height={14} style={{ marginTop: 10 }} />
      </Animated.View>
      <Animated.View style={styles.gridCol}>
        <Skeleton width="100%" height={180} borderRadius={RADIUS.lg} />
        <Skeleton width="70%" height={14} style={{ marginTop: 10 }} />
      </Animated.View>
    </Animated.View>
  );
}

// ---------------------------------------------------------------------------
// Styles
// ---------------------------------------------------------------------------
const styles = StyleSheet.create({
  base: {
    backgroundColor: COLORS.bgElevated,
  } as ViewStyle,
  card: {
    paddingHorizontal: 0,
  } as ViewStyle,
  grid: {
    flexDirection: 'row',
    gap: 12,
  } as ViewStyle,
  gridCol: {
    flex: 1,
  } as ViewStyle,
});
