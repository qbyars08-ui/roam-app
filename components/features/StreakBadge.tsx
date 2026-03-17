// =============================================================================
// ROAM — Streak Badge
// Compact visual streak counter for profile, tabs, and milestones
// =============================================================================
import React, { useEffect, useState, useRef } from 'react';
import {
  Animated,
  Easing,
  StyleSheet,
  Text,
  type TextStyle,
  type ViewStyle,
} from 'react-native';
import { Flame, Zap } from 'lucide-react-native';
import { COLORS, FONTS, RADIUS } from '../../lib/constants';
import { getCurrentStreak } from '../../lib/streaks';

interface StreakBadgeProps {
  size?: 'sm' | 'md' | 'lg';
  showLabel?: boolean;
  animated?: boolean;
}

const SIZE_MAP = {
  sm: { icon: 14, text: 11, pad: 6, gap: 3, height: 26 },
  md: { icon: 16, text: 13, pad: 8, gap: 4, height: 30 },
  lg: { icon: 20, text: 16, pad: 10, gap: 6, height: 36 },
} as const;

function getStreakTier(count: number): {
  color: string;
  bg: string;
  border: string;
  label: string;
} {
  if (count >= 30) {
    return {
      color: COLORS.gold,
      bg: COLORS.goldFaint,
      border: COLORS.goldBorder,
      label: 'Legendary',
    };
  }
  if (count >= 14) {
    return {
      color: COLORS.coral,
      bg: COLORS.coralSubtle,
      border: COLORS.coralBorder,
      label: 'On fire',
    };
  }
  if (count >= 7) {
    return {
      color: COLORS.amber,
      bg: COLORS.warningSubtle,
      border: COLORS.warningBorder,
      label: 'Hot streak',
    };
  }
  if (count >= 3) {
    return {
      color: COLORS.sage,
      bg: COLORS.sageSubtle,
      border: COLORS.sageBorder,
      label: 'Building',
    };
  }
  return {
    color: COLORS.creamMuted,
    bg: COLORS.bgGlass,
    border: COLORS.border,
    label: 'Starting',
  };
}

export default function StreakBadge({
  size = 'md',
  showLabel = false,
  animated = true,
}: StreakBadgeProps) {
  const [streak, setStreak] = useState(0);
  const pulseAnim = useRef(new Animated.Value(1)).current;

  useEffect(() => {
    getCurrentStreak().then(setStreak).catch(() => {});
  }, []);

  useEffect(() => {
    if (!animated || streak < 3) return;
    const loop = Animated.loop(
      Animated.sequence([
        Animated.timing(pulseAnim, {
          toValue: 1.15,
          duration: 800,
          easing: Easing.inOut(Easing.ease),
          useNativeDriver: true,
        }),
        Animated.timing(pulseAnim, {
          toValue: 1,
          duration: 800,
          easing: Easing.inOut(Easing.ease),
          useNativeDriver: true,
        }),
      ])
    );
    loop.start();
    return () => loop.stop();
  }, [animated, pulseAnim, streak]);

  if (streak < 1) return null;

  const dims = SIZE_MAP[size];
  const tier = getStreakTier(streak);
  const IconComp = streak >= 7 ? Flame : Zap;

  return (
    <Animated.View
      style={[
        styles.badge,
        {
          backgroundColor: tier.bg,
          borderColor: tier.border,
          paddingHorizontal: dims.pad,
          height: dims.height,
          gap: dims.gap,
          transform: [{ scale: animated && streak >= 3 ? pulseAnim : 1 }],
        },
      ]}
    >
      <IconComp size={dims.icon} color={tier.color} strokeWidth={1.5} />
      <Text style={[styles.count, { fontSize: dims.text, color: tier.color }]}>
        {streak}
      </Text>
      {showLabel && (
        <Text style={[styles.label, { fontSize: dims.text - 2, color: tier.color }]}>
          {tier.label}
        </Text>
      )}
    </Animated.View>
  );
}

const styles = StyleSheet.create({
  badge: {
    flexDirection: 'row',
    alignItems: 'center',
    borderRadius: RADIUS.full,
    borderWidth: 1,
  } as ViewStyle,
  count: {
    fontFamily: FONTS.monoMedium,
    letterSpacing: 0.5,
  } as TextStyle,
  label: {
    fontFamily: FONTS.mono,
    letterSpacing: 0.3,
    marginLeft: 2,
  } as TextStyle,
});
