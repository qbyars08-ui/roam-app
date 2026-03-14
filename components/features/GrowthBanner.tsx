// =============================================================================
// ROAM — Growth Banner
// Contextual, dismissible banners that drive action on key screens.
// Shows referral, upgrade, or streak prompts based on smart triggers.
// =============================================================================
import React, { useCallback, useEffect, useRef, useState } from 'react';
import {
  Animated,
  Easing,
  Pressable,
  StyleSheet,
  Text,
  View,
  type TextStyle,
  type ViewStyle,
} from 'react-native';
import { useRouter } from 'expo-router';
import { ArrowRight, Gift, Sparkles, Users, X } from 'lucide-react-native';

import { COLORS, FONTS, SPACING, RADIUS } from '../../lib/constants';
import { impactAsync, ImpactFeedbackStyle } from '../../lib/haptics';
import { useAppStore } from '../../lib/store';
import { track } from '../../lib/analytics';

export type BannerVariant = 'refer' | 'upgrade' | 'streak' | 'share';

interface GrowthBannerProps {
  variant: BannerVariant;
  onDismiss?: () => void;
}

const BANNER_CONFIG: Record<
  BannerVariant,
  {
    Icon: typeof Gift;
    title: string;
    subtitle: string;
    ctaLabel: string;
    route: string;
    bgColor: string;
    borderColor: string;
    accentColor: string;
  }
> = {
  refer: {
    Icon: Users,
    title: 'Invite 3 friends, get Pro free',
    subtitle: 'Share your referral link and unlock a month of unlimited trips.',
    ctaLabel: 'Share link',
    route: '/referral',
    bgColor: COLORS.sageSubtle,
    borderColor: COLORS.sageBorder,
    accentColor: COLORS.sage,
  },
  upgrade: {
    Icon: Sparkles,
    title: 'Unlock unlimited trips',
    subtitle: 'Go Pro and never hit a wall. Plans start at $9.99/mo.',
    ctaLabel: 'See plans',
    route: '/paywall',
    bgColor: COLORS.goldFaint,
    borderColor: COLORS.goldBorder,
    accentColor: COLORS.gold,
  },
  streak: {
    Icon: Gift,
    title: 'Keep your streak alive',
    subtitle: 'Open ROAM daily to build your explorer streak.',
    ctaLabel: 'Explore',
    route: '/(tabs)',
    bgColor: COLORS.coralSubtle,
    borderColor: COLORS.coralBorder,
    accentColor: COLORS.coral,
  },
  share: {
    Icon: Gift,
    title: 'Share your trip',
    subtitle: 'Show off your AI-planned itinerary. Your friends will want one.',
    ctaLabel: 'Share',
    route: '/share-card',
    bgColor: COLORS.sageSubtle,
    borderColor: COLORS.sageBorder,
    accentColor: COLORS.sage,
  },
};

export default function GrowthBanner({ variant, onDismiss }: GrowthBannerProps) {
  const router = useRouter();
  const isPro = useAppStore((s) => s.isPro);
  const [dismissed, setDismissed] = useState(false);
  const slideAnim = useRef(new Animated.Value(-80)).current;
  const opacityAnim = useRef(new Animated.Value(0)).current;

  const config = BANNER_CONFIG[variant];

  useEffect(() => {
    Animated.parallel([
      Animated.timing(slideAnim, {
        toValue: 0,
        duration: 400,
        easing: Easing.out(Easing.cubic),
        useNativeDriver: true,
      }),
      Animated.timing(opacityAnim, {
        toValue: 1,
        duration: 400,
        useNativeDriver: true,
      }),
    ]).start();
  }, [opacityAnim, slideAnim]);

  const handleDismiss = useCallback(() => {
    Animated.parallel([
      Animated.timing(slideAnim, {
        toValue: -80,
        duration: 250,
        useNativeDriver: true,
      }),
      Animated.timing(opacityAnim, {
        toValue: 0,
        duration: 250,
        useNativeDriver: true,
      }),
    ]).start(() => {
      setDismissed(true);
      onDismiss?.();
    });
  }, [onDismiss, opacityAnim, slideAnim]);

  const handleCTA = useCallback(() => {
    impactAsync(ImpactFeedbackStyle.Light).catch(() => {});
    track({
      type: 'tap',
      screen: 'growth_banner',
      action: `cta_${variant}`,
    }).catch(() => {});
    handleDismiss();
    router.push(config.route as never);
  }, [variant, config.route, router, handleDismiss]);

  if (dismissed) return null;
  if (variant === 'upgrade' && isPro) return null;

  return (
    <Animated.View
      style={[
        styles.container,
        {
          backgroundColor: config.bgColor,
          borderColor: config.borderColor,
          opacity: opacityAnim,
          transform: [{ translateY: slideAnim }],
        },
      ]}
    >
      {/* Dismiss */}
      <Pressable
        onPress={handleDismiss}
        hitSlop={8}
        accessibilityRole="button"
        accessibilityLabel="Dismiss"
        style={styles.closeBtn}
      >
        <X size={14} color={COLORS.creamMuted} strokeWidth={2} />
      </Pressable>

      <View style={styles.content}>
        <View style={[styles.iconWrap, { backgroundColor: config.bgColor }]}>
          <config.Icon size={18} color={config.accentColor} strokeWidth={2} />
        </View>

        <View style={styles.textWrap}>
          <Text style={styles.title} numberOfLines={1}>{config.title}</Text>
          <Text style={styles.subtitle} numberOfLines={2}>{config.subtitle}</Text>
        </View>

        <Pressable
          onPress={handleCTA}
          style={({ pressed }) => [
            styles.ctaBtn,
            { backgroundColor: config.accentColor, opacity: pressed ? 0.8 : 1 },
          ]}
        >
          <Text style={styles.ctaText}>{config.ctaLabel}</Text>
          <ArrowRight size={14} color={COLORS.bg} strokeWidth={2} />
        </Pressable>
      </View>
    </Animated.View>
  );
}

const styles = StyleSheet.create({
  container: {
    marginHorizontal: SPACING.md,
    marginBottom: SPACING.md,
    borderRadius: RADIUS.lg,
    borderWidth: 1,
    padding: SPACING.md,
    overflow: 'hidden',
  } as ViewStyle,
  closeBtn: {
    position: 'absolute',
    top: SPACING.sm,
    right: SPACING.sm,
    zIndex: 2,
    width: 24,
    height: 24,
    borderRadius: RADIUS.full,
    alignItems: 'center',
    justifyContent: 'center',
  } as ViewStyle,
  content: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: SPACING.sm,
  } as ViewStyle,
  iconWrap: {
    width: 36,
    height: 36,
    borderRadius: RADIUS.full,
    alignItems: 'center',
    justifyContent: 'center',
  } as ViewStyle,
  textWrap: {
    flex: 1,
    gap: 2,
  } as ViewStyle,
  title: {
    fontFamily: FONTS.bodySemiBold,
    fontSize: 13,
    color: COLORS.cream,
  } as TextStyle,
  subtitle: {
    fontFamily: FONTS.body,
    fontSize: 11,
    color: COLORS.creamDim,
    lineHeight: 16,
  } as TextStyle,
  ctaBtn: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
    paddingHorizontal: SPACING.sm + 4,
    paddingVertical: SPACING.xs + 2,
    borderRadius: RADIUS.full,
  } as ViewStyle,
  ctaText: {
    fontFamily: FONTS.bodySemiBold,
    fontSize: 11,
    color: COLORS.bg,
  } as TextStyle,
});
