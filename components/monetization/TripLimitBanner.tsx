// =============================================================================
// ROAM — Trip Limit Banner
// Shows remaining free trips / upgrade prompt for free-tier users
// =============================================================================
import React, { useCallback, useMemo } from 'react';
import { Pressable, StyleSheet, Text, View, type TextStyle, type ViewStyle } from 'react-native';
import { useRouter } from 'expo-router';
import { useTranslation } from 'react-i18next';
import { Sparkles, Zap } from 'lucide-react-native';
import * as Haptics from '../../lib/haptics';
import { COLORS, FONTS, SPACING, RADIUS, FREE_TRIPS_PER_MONTH } from '../../lib/constants';
import { useCanGenerateTrip } from '../../lib/pro-gate';
import { isGuestUser } from '../../lib/guest';

export default function TripLimitBanner() {
  const { t } = useTranslation();
  const router = useRouter();
  const { canGenerate, remaining, isPro } = useCanGenerateTrip();
  const isGuest = isGuestUser();

  const handleUpgrade = useCallback(() => {
    Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Medium);
    router.push({ pathname: '/paywall', params: { reason: 'limit' } });
  }, [router]);

  const bannerContent = useMemo(() => {
    if (isPro) {
      return {
        icon: 'sparkles' as const,
        label: t('tripLimit.pro', { defaultValue: 'PRO' }),
        message: t('tripLimit.unlimitedTrips', { defaultValue: 'Unlimited trips' }),
        color: COLORS.gold,
        showUpgrade: false,
      };
    }

    if (isGuest) {
      return {
        icon: 'zap' as const,
        label: t('tripLimit.guest', { defaultValue: 'GUEST' }),
        message: t('tripLimit.signUpToKeepPlanning', { defaultValue: 'Sign up to keep planning' }),
        color: COLORS.sage,
        showUpgrade: true,
      };
    }

    if (!canGenerate) {
      return {
        icon: 'zap' as const,
        label: t('tripLimit.limitReached', { defaultValue: 'LIMIT REACHED' }),
        message: t('tripLimit.upgradeForUnlimited', { defaultValue: 'Upgrade for unlimited trips' }),
        color: COLORS.coral,
        showUpgrade: true,
      };
    }

    return {
      icon: 'zap' as const,
      label: `${remaining}/${FREE_TRIPS_PER_MONTH}`,
      message: remaining === 1
        ? t('tripLimit.lastFreeTrip', { defaultValue: 'Last free trip' })
        : t('tripLimit.freeTripsLeft', { defaultValue: `${remaining} free trips left` }),
      color: remaining === 1 ? COLORS.coral : COLORS.sage,
      showUpgrade: true,
    };
  }, [isPro, isGuest, canGenerate, remaining, t]);

  if (isPro) return null;

  return (
    <Pressable
      onPress={bannerContent.showUpgrade ? handleUpgrade : undefined}
      style={({ pressed }) => [
        styles.banner,
        { borderColor: bannerContent.color + '40', opacity: pressed && bannerContent.showUpgrade ? 0.85 : 1 },
      ]}
    >
      <View style={styles.leftSection}>
        {bannerContent.icon === 'sparkles' ? (
          <Sparkles size={16} color={bannerContent.color} strokeWidth={1.5} />
        ) : (
          <Zap size={16} color={bannerContent.color} strokeWidth={1.5} />
        )}
        <View style={[styles.labelBadge, { backgroundColor: bannerContent.color + '20' }]}>
          <Text style={[styles.labelText, { color: bannerContent.color }]}>
            {bannerContent.label}
          </Text>
        </View>
        <Text style={styles.message}>{bannerContent.message}</Text>
      </View>
      {bannerContent.showUpgrade && (
        <Text style={[styles.upgradeText, { color: bannerContent.color }]}>{t('tripLimit.upgrade', { defaultValue: 'Upgrade' })}</Text>
      )}
    </Pressable>
  );
}

const styles = StyleSheet.create({
  banner: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    backgroundColor: COLORS.bgCard,
    borderRadius: RADIUS.md,
    borderWidth: 1,
    paddingHorizontal: SPACING.md,
    paddingVertical: SPACING.sm + 2,
    marginHorizontal: SPACING.md,
    marginTop: SPACING.sm,
  } as ViewStyle,
  leftSection: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: SPACING.sm,
    flex: 1,
  } as ViewStyle,
  labelBadge: {
    paddingHorizontal: SPACING.xs + 2,
    paddingVertical: 1,
    borderRadius: RADIUS.full,
  } as ViewStyle,
  labelText: {
    fontFamily: FONTS.mono,
    fontSize: 10,
    letterSpacing: 0.5,
  } as TextStyle,
  message: {
    fontFamily: FONTS.body,
    fontSize: 13,
    color: COLORS.creamMuted,
    flex: 1,
  } as TextStyle,
  upgradeText: {
    fontFamily: FONTS.monoMedium,
    fontSize: 11,
    letterSpacing: 0.5,
  } as TextStyle,
});
