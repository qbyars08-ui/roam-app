// =============================================================================
// ROAM — Subscription Card
// Shows current plan details, expiry date, and manage/upgrade actions
// =============================================================================
import React, { useCallback, useEffect, useState } from 'react';
import {
  Linking,
  Platform,
  Pressable,
  StyleSheet,
  Text,
  View,
  type TextStyle,
  type ViewStyle,
} from 'react-native';
import { useRouter } from 'expo-router';
import { LinearGradient } from 'expo-linear-gradient';
import { Crown, ArrowRight, Settings, Gift } from 'lucide-react-native';
import * as Haptics from '../../lib/haptics';
import { COLORS, FONTS, SPACING, RADIUS, FREE_TRIPS_PER_MONTH } from '../../lib/constants';
import { useAppStore } from '../../lib/store';
import { getCurrentPlan, type PlanType } from '../../lib/revenue-cat';

const PLAN_LABELS: Record<PlanType, string> = {
  free: 'Free',
  pro: 'ROAM Pro',
  global: 'Global Pass',
};

const PLAN_DETAILS: Record<PlanType, string> = {
  free: `${FREE_TRIPS_PER_MONTH} trip per month`,
  pro: 'Unlimited trips + all features',
  global: 'Unlimited trips + founding perks',
};

export default function SubscriptionCard() {
  const router = useRouter();
  const isPro = useAppStore((s) => s.isPro);
  const tripsThisMonth = useAppStore((s) => s.tripsThisMonth);
  const [plan, setPlan] = useState<PlanType>('free');

  useEffect(() => {
    getCurrentPlan().then(setPlan).catch(() => {});
  }, [isPro]);

  const handleUpgrade = useCallback(() => {
    Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Medium);
    router.push('/paywall');
  }, [router]);

  const handleManage = useCallback(() => {
    Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
    if (Platform.OS === 'ios') {
      Linking.openURL('https://apps.apple.com/account/subscriptions');
    } else if (Platform.OS === 'android') {
      Linking.openURL('https://play.google.com/store/account/subscriptions');
    } else {
      router.push('/paywall');
    }
  }, [router]);

  const handleReferral = useCallback(() => {
    Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
    router.push('/referral');
  }, [router]);

  if (isPro) {
    return (
      <View style={styles.proCard}>
        <LinearGradient
          colors={[COLORS.goldSubtle, COLORS.goldVeryFaint]}
          start={{ x: 0, y: 0 }}
          end={{ x: 1, y: 1 }}
          style={styles.proGradient}
        >
          <View style={styles.proHeader}>
            <Crown size={20} color={COLORS.gold} strokeWidth={2} />
            <Text style={styles.proTitle}>{PLAN_LABELS[plan]}</Text>
          </View>
          <Text style={styles.proDetail}>{PLAN_DETAILS[plan]}</Text>

          <View style={styles.proActions}>
            <Pressable
              onPress={handleManage}
              style={({ pressed }) => [styles.manageBtn, { opacity: pressed ? 0.7 : 1 }]}
            >
              <Settings size={14} color={COLORS.creamMuted} strokeWidth={2} />
              <Text style={styles.manageBtnText}>Manage subscription</Text>
            </Pressable>
            <Pressable
              onPress={handleReferral}
              style={({ pressed }) => [styles.referralBtn, { opacity: pressed ? 0.7 : 1 }]}
            >
              <Gift size={14} color={COLORS.sage} strokeWidth={2} />
              <Text style={styles.referralBtnText}>Share with friends</Text>
            </Pressable>
          </View>
        </LinearGradient>
      </View>
    );
  }

  return (
    <View style={styles.freeCard}>
      <View style={styles.freeHeader}>
        <View style={styles.freeBadge}>
          <Text style={styles.freeBadgeText}>FREE PLAN</Text>
        </View>
        <Text style={styles.freeTrips}>
          {tripsThisMonth}/{FREE_TRIPS_PER_MONTH} trips used
        </Text>
      </View>
      <Text style={styles.freeDetail}>
        Upgrade to unlock unlimited trips, all premium features, and priority AI.
      </Text>
      <Pressable
        onPress={handleUpgrade}
        style={({ pressed }) => [
          styles.upgradeBtn,
          { transform: [{ scale: pressed ? 0.97 : 1 }] },
        ]}
      >
        <LinearGradient
          colors={[COLORS.gold, COLORS.goldDark]}
          start={{ x: 0, y: 0 }}
          end={{ x: 1, y: 0 }}
          style={styles.upgradeGradient}
        >
          <Text style={styles.upgradeBtnText}>Upgrade to Pro</Text>
          <ArrowRight size={16} color={COLORS.bg} strokeWidth={2.5} />
        </LinearGradient>
      </Pressable>
    </View>
  );
}

const styles = StyleSheet.create({
  proCard: {
    borderRadius: RADIUS.lg,
    overflow: 'hidden',
    borderWidth: 1,
    borderColor: COLORS.goldBorder,
  } as ViewStyle,
  proGradient: {
    padding: SPACING.lg,
    gap: SPACING.sm,
  } as ViewStyle,
  proHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: SPACING.sm,
  } as ViewStyle,
  proTitle: {
    fontFamily: FONTS.bodySemiBold,
    fontSize: 18,
    color: COLORS.gold,
  } as TextStyle,
  proDetail: {
    fontFamily: FONTS.body,
    fontSize: 14,
    color: COLORS.creamMuted,
  } as TextStyle,
  proActions: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: SPACING.lg,
    marginTop: SPACING.sm,
  } as ViewStyle,
  manageBtn: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: SPACING.xs,
  } as ViewStyle,
  manageBtnText: {
    fontFamily: FONTS.body,
    fontSize: 13,
    color: COLORS.creamMuted,
    textDecorationLine: 'underline',
  } as TextStyle,
  referralBtn: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: SPACING.xs,
  } as ViewStyle,
  referralBtnText: {
    fontFamily: FONTS.body,
    fontSize: 13,
    color: COLORS.sage,
  } as TextStyle,
  freeCard: {
    backgroundColor: COLORS.bgCard,
    borderRadius: RADIUS.lg,
    borderWidth: 1,
    borderColor: COLORS.border,
    padding: SPACING.lg,
    gap: SPACING.sm,
  } as ViewStyle,
  freeHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
  } as ViewStyle,
  freeBadge: {
    backgroundColor: COLORS.bgGlass,
    paddingHorizontal: SPACING.sm,
    paddingVertical: 2,
    borderRadius: RADIUS.full,
    borderWidth: 1,
    borderColor: COLORS.border,
  } as ViewStyle,
  freeBadgeText: {
    fontFamily: FONTS.mono,
    fontSize: 10,
    color: COLORS.creamMuted,
    letterSpacing: 1,
  } as TextStyle,
  freeTrips: {
    fontFamily: FONTS.mono,
    fontSize: 11,
    color: COLORS.creamMuted,
    letterSpacing: 0.5,
  } as TextStyle,
  freeDetail: {
    fontFamily: FONTS.body,
    fontSize: 14,
    color: COLORS.creamMuted,
    lineHeight: 20,
  } as TextStyle,
  upgradeBtn: {
    borderRadius: RADIUS.md,
    overflow: 'hidden',
    marginTop: SPACING.xs,
  } as ViewStyle,
  upgradeGradient: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: SPACING.xs,
    paddingVertical: SPACING.sm + 4,
    borderRadius: RADIUS.md,
  } as ViewStyle,
  upgradeBtnText: {
    fontFamily: FONTS.bodySemiBold,
    fontSize: 15,
    color: COLORS.bg,
  } as TextStyle,
});
