// =============================================================================
// ROAM — Streak Badge
// Fire emoji + streak count in a surface2 pill with pulse animation
// =============================================================================
import React, { useEffect, useRef } from 'react';
import {
  Animated,
  Easing,
  StyleSheet,
  Text,
  type TextStyle,
  type ViewStyle,
} from 'react-native';
import { COLORS, FONTS, RADIUS, SPACING } from '../../lib/constants';

interface StreakBadgeProps {
  streak: number;
  size?: 'sm' | 'md';
}

const SIZE_CONFIG = {
  sm: { fontSize: 11, height: 24, px: SPACING.sm, iconSize: 12 },
  md: { fontSize: 13, height: 30, px: SPACING.md - 4, iconSize: 14 },
} as const;

export default function StreakBadge({ streak, size = 'md' }: StreakBadgeProps) {
  const pulseAnim = useRef(new Animated.Value(1)).current;
  const prevStreak = useRef(streak);

  useEffect(() => {
    if (streak > prevStreak.current && streak > 0) {
      // Pulse when streak increases
      Animated.sequence([
        Animated.timing(pulseAnim, {
          toValue: 1.2,
          duration: 300,
          easing: Easing.out(Easing.ease),
          useNativeDriver: true,
        }),
        Animated.timing(pulseAnim, {
          toValue: 1,
          duration: 300,
          easing: Easing.inOut(Easing.ease),
          useNativeDriver: true,
        }),
      ]).start();
    }
    prevStreak.current = streak;
  }, [streak, pulseAnim]);

  if (streak < 1) return null;

  const cfg = SIZE_CONFIG[size];

  return (
    <Animated.View
      style={[
        styles.badge,
        {
          height: cfg.height,
          paddingHorizontal: cfg.px,
          transform: [{ scale: pulseAnim }],
        },
      ]}
    >
      <Text style={{ fontSize: cfg.iconSize, lineHeight: cfg.height }}>
        {'\uD83D\uDD25'}
      </Text>
      <Text style={[styles.count, { fontSize: cfg.fontSize }]}>
        {streak}
      </Text>
    </Animated.View>
  );
}

const styles = StyleSheet.create({
  badge: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: COLORS.surface2,
    borderRadius: RADIUS.pill,
    gap: SPACING.xs,
  } as ViewStyle,
  count: {
    fontFamily: FONTS.mono,
    color: COLORS.cream,
    letterSpacing: 0.5,
  } as TextStyle,
});
