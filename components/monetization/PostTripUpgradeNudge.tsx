// =============================================================================
// ROAM — Post-Trip Upgrade Nudge
// Shown on itinerary screen for free users after trip generation
// Gentle nudge to upgrade with contextual messaging
// =============================================================================
import React, { useCallback, useMemo } from 'react';
import { Pressable, StyleSheet, Text, View, type TextStyle, type ViewStyle } from 'react-native';
import { useRouter } from 'expo-router';
import { LinearGradient } from 'expo-linear-gradient';
import { Sparkles, Gift, ArrowRight } from 'lucide-react-native';
import * as Haptics from '../../lib/haptics';
import { COLORS, FONTS, SPACING, RADIUS, FREE_TRIPS_PER_MONTH } from '../../lib/constants';
import { useAppStore } from '../../lib/store';

interface Props {
  destination?: string;
}

export default function PostTripUpgradeNudge({ destination }: Props) {
  const router = useRouter();
  const isPro = useAppStore((s) => s.isPro);
  const tripsThisMonth = useAppStore((s) => s.tripsThisMonth);

  const handleUpgrade = useCallback(() => {
    Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Medium);
    router.push({ pathname: '/paywall', params: { reason: 'limit', destination } });
  }, [router, destination]);

  const handleReferral = useCallback(() => {
    Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
    router.push('/referral');
  }, [router]);

  const nudgeVariant = useMemo(() => {
    if (tripsThisMonth >= FREE_TRIPS_PER_MONTH) {
      return {
        title: 'Loved this trip?',
        subtitle: 'Upgrade to Pro for unlimited trips and premium features.',
        ctaLabel: 'See Pro plans',
        showReferral: true,
      };
    }
    return {
      title: 'Planning more adventures?',
      subtitle: `You have ${Math.max(0, FREE_TRIPS_PER_MONTH - tripsThisMonth)} free trip${FREE_TRIPS_PER_MONTH - tripsThisMonth !== 1 ? 's' : ''} left this month. Go Pro for unlimited.`,
      ctaLabel: 'Unlock unlimited',
      showReferral: true,
    };
  }, [tripsThisMonth]);

  if (isPro) return null;

  return (
    <View style={styles.container}>
      <View style={styles.card}>
        <View style={styles.headerRow}>
          <Sparkles size={18} color={COLORS.gold} strokeWidth={2} />
          <Text style={styles.title}>{nudgeVariant.title}</Text>
        </View>
        <Text style={styles.subtitle}>{nudgeVariant.subtitle}</Text>

        <View style={styles.actions}>
          <Pressable
            onPress={handleUpgrade}
            style={({ pressed }) => [
              styles.ctaWrapper,
              { transform: [{ scale: pressed ? 0.97 : 1 }] },
            ]}
          >
            <LinearGradient
              colors={[COLORS.gold, COLORS.goldDark]}
              start={{ x: 0, y: 0 }}
              end={{ x: 1, y: 0 }}
              style={styles.ctaGradient}
            >
              <Text style={styles.ctaText}>{nudgeVariant.ctaLabel}</Text>
              <ArrowRight size={16} color={COLORS.bg} strokeWidth={2.5} />
            </LinearGradient>
          </Pressable>

          {nudgeVariant.showReferral && (
            <Pressable
              onPress={handleReferral}
              style={({ pressed }) => [
                styles.referralBtn,
                { opacity: pressed ? 0.7 : 1 },
              ]}
            >
              <Gift size={14} color={COLORS.sage} strokeWidth={2} />
              <Text style={styles.referralText}>Or earn free Pro</Text>
            </Pressable>
          )}
        </View>
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    paddingHorizontal: SPACING.md,
    paddingVertical: SPACING.md,
  } as ViewStyle,
  card: {
    backgroundColor: COLORS.bgCard,
    borderRadius: RADIUS.lg,
    borderWidth: 1,
    borderColor: COLORS.goldBorder,
    padding: SPACING.lg,
    gap: SPACING.sm,
  } as ViewStyle,
  headerRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: SPACING.sm,
  } as ViewStyle,
  title: {
    fontFamily: FONTS.bodySemiBold,
    fontSize: 16,
    color: COLORS.cream,
  } as TextStyle,
  subtitle: {
    fontFamily: FONTS.body,
    fontSize: 14,
    color: COLORS.creamMuted,
    lineHeight: 20,
  } as TextStyle,
  actions: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: SPACING.md,
    marginTop: SPACING.xs,
  } as ViewStyle,
  ctaWrapper: {
    borderRadius: RADIUS.md,
    overflow: 'hidden',
  } as ViewStyle,
  ctaGradient: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: SPACING.xs,
    paddingHorizontal: SPACING.lg,
    paddingVertical: SPACING.sm + 2,
    borderRadius: RADIUS.md,
  } as ViewStyle,
  ctaText: {
    fontFamily: FONTS.bodySemiBold,
    fontSize: 14,
    color: COLORS.bg,
  } as TextStyle,
  referralBtn: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: SPACING.xs,
    paddingVertical: SPACING.sm,
    paddingHorizontal: SPACING.sm,
  } as ViewStyle,
  referralText: {
    fontFamily: FONTS.body,
    fontSize: 13,
    color: COLORS.sage,
  } as TextStyle,
});
