// =============================================================================
// ROAM — Paywall Screen (optimized for conversion)
// Annual/Monthly toggle with savings badge, social proof counter,
// 3-day free trial CTA, contextual headlines
// =============================================================================
import React, { useCallback, useEffect, useMemo, useRef, useState } from 'react';
import {
  Alert,
  Animated,
  Easing,
  Pressable,
  ScrollView,
  StyleSheet,
  Text,
  View,
  type TextStyle,
  type ViewStyle,
} from 'react-native';
import { useTranslation } from 'react-i18next';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { useRouter, useLocalSearchParams } from 'expo-router';
import { LinearGradient } from 'expo-linear-gradient';

import { Check, X, Sparkles, Shield, Zap, Users } from 'lucide-react-native';
import { COLORS, FONTS, SPACING, RADIUS } from '../lib/constants';
import { useAppStore } from '../lib/store';
import { isGuestUser } from '../lib/guest';
import WaitlistCaptureModal from '../components/features/WaitlistCaptureModal';
import {
  getOfferings,
  purchasePro,
  purchaseGlobal,
  restorePurchases,
  type OfferingPackages,
} from '../lib/revenue-cat';
import { syncProStatusToSupabase } from '../lib/sync-pro-status';
import { getPaywallSocialProof, getUpgradeMessage, recordGrowthEvent } from '../lib/growth-hooks';
import { track } from '../lib/analytics';
import { captureEvent } from '../lib/posthog';

// =============================================================================
// Pro features list (shared between both plans)
// =============================================================================
const PRO_FEATURES = [
  { icon: Zap, text: 'Unlimited AI trips' },
  { icon: Shield, text: 'Offline PREP mode' },
  { icon: Sparkles, text: 'Priority AI responses' },
  { icon: Users, text: 'Travel Twin & Trip Chemistry' },
] as const;

// =============================================================================
// Helpers
// =============================================================================
function computeAnnualSavings(monthlyStr: string, annualStr: string): number {
  const monthly = parseFloat(monthlyStr.replace(/[^0-9.]/g, '')) || 9.99;
  const annual = parseFloat(annualStr.replace(/[^0-9.]/g, '')) || 49.99;
  const yearlyAtMonthly = monthly * 12;
  if (yearlyAtMonthly <= 0) return 0;
  return Math.round(((yearlyAtMonthly - annual) / yearlyAtMonthly) * 100);
}

function formatMonthlyEquivalent(annualStr: string): string {
  const annual = parseFloat(annualStr.replace(/[^0-9.]/g, '')) || 49.99;
  return `$${(annual / 12).toFixed(2)}`;
}

// =============================================================================
// Social proof counter — animated live counter
// =============================================================================
function useSocialProofCounter() {
  const proof = getPaywallSocialProof();
  const [liveCount, setLiveCount] = useState(0);

  useEffect(() => {
    const dayOfYear = Math.floor(
      (Date.now() - new Date(new Date().getFullYear(), 0, 0).getTime()) / 86400000
    );
    const base = 1247 + dayOfYear * 3;
    let count = 0;
    const target = base;
    const step = Math.ceil(target / 30);
    const timer = setInterval(() => {
      count = Math.min(count + step, target);
      setLiveCount(count);
      if (count >= target) clearInterval(timer);
    }, 50);
    return () => clearInterval(timer);
  }, []);

  return { liveCount, recentActivity: proof.recentActivity };
}

// =============================================================================
// Component
// =============================================================================
export default function PaywallScreen() {
  const { t } = useTranslation();
  const insets = useSafeAreaInsets();
  const router = useRouter();
  const params = useLocalSearchParams<{ reason?: string; destination?: string; feature?: string }>();
  const setIsPro = useAppStore((s) => s.setIsPro);
  const session = useAppStore((s) => s.session);
  const isGuest = isGuestUser();

  const [billingCycle, setBillingCycle] = useState<'annual' | 'monthly'>('annual');
  const [loading, setLoading] = useState(false);
  const [restoring, setRestoring] = useState(false);
  const [packages, setPackages] = useState<OfferingPackages>({ monthly: null, annual: null });
  const { liveCount, recentActivity } = useSocialProofCounter();

  // Toggle slide animation
  const toggleAnim = useRef(new Animated.Value(1)).current;

  // Entrance animations
  const headerOpacity = useRef(new Animated.Value(0)).current;
  const headerY = useRef(new Animated.Value(20)).current;
  const contentOpacity = useRef(new Animated.Value(0)).current;
  const contentY = useRef(new Animated.Value(30)).current;

  useEffect(() => {
    getOfferings().then(setPackages).catch(() => {});
    captureEvent('paywall_viewed', { reason: params.reason ?? null, destination: params.destination ?? null });
  }, []);

  useEffect(() => {
    Animated.sequence([
      Animated.parallel([
        Animated.timing(headerOpacity, {
          toValue: 1, duration: 500, useNativeDriver: true,
        }),
        Animated.timing(headerY, {
          toValue: 0, duration: 500, easing: Easing.out(Easing.cubic),
          useNativeDriver: true,
        }),
      ]),
      Animated.parallel([
        Animated.timing(contentOpacity, {
          toValue: 1, duration: 600, useNativeDriver: true,
        }),
        Animated.timing(contentY, {
          toValue: 0, duration: 600, easing: Easing.out(Easing.cubic),
          useNativeDriver: true,
        }),
      ]),
    ]).start();
  }, [contentOpacity, contentY, headerOpacity, headerY]);

  const handleToggle = useCallback((cycle: 'annual' | 'monthly') => {
    setBillingCycle(cycle);
    Animated.timing(toggleAnim, {
      toValue: cycle === 'annual' ? 1 : 0,
      duration: 200,
      easing: Easing.out(Easing.cubic),
      useNativeDriver: false,
    }).start();
  }, [toggleAnim]);

  // Contextual headline
  const upgradeContext = params.reason === 'limit' ? 'trip_limit' as const
    : params.reason === 'milestone' ? 'post_trip' as const
    : params.reason === 'feature' ? 'feature_locked' as const
    : 'default' as const;
  const upgradeMsg = getUpgradeMessage(upgradeContext);

  const headline = useMemo(() => {
    switch (params.reason) {
      case 'limit':
        return params.destination
          ? `You just planned ${params.destination}.\nUnlock unlimited trips.`
          : upgradeMsg.headline;
      case 'feature':
        return params.feature
          ? `${params.feature} is a Pro feature.\nUpgrade to unlock everything.`
          : upgradeMsg.headline;
      case 'chaos':
        return 'Chaos Mode needs fuel.\nGo Pro for unlimited random trips.';
      case 'group':
        return 'Group planning unlocked with Pro.\nPlan trips together, split the fun.';
      default:
        return upgradeMsg.headline;
    }
  }, [params.reason, params.destination, params.feature, upgradeMsg.headline]);

  useEffect(() => {
    track({ type: 'screen_view', screen: 'paywall', payload: { reason: params.reason ?? 'default' } }).catch(() => {});
    recordGrowthEvent('paywall_view').catch(() => {});
    // eslint-disable-next-line react-hooks/exhaustive-deps -- intentional mount-only
  }, []);

  const handleClose = useCallback(() => {
    if (router.canGoBack()) {
      router.back();
    } else {
      router.replace('/(tabs)');
    }
  }, [router]);

  const handlePurchase = useCallback(async () => {
    if (loading) return;
    setLoading(true);
    try {
      const success = billingCycle === 'annual'
        ? await purchaseGlobal()
        : await purchasePro();

      if (success) {
        setIsPro(true);
        if (session?.user?.id && !String(session.user.id).startsWith('guest-')) {
          syncProStatusToSupabase(session.user.id, true).catch(() => {});
        }
        track({ type: 'tap', screen: 'paywall', action: 'purchase_success', payload: { tier: billingCycle } }).catch(() => {});
        recordGrowthEvent('purchase_success').catch(() => {});
        handleClose();
      }
    } catch {
      Alert.alert('Purchase didn\u2019t go through', 'Check your connection and try again. We\u2019ll be here.');
    } finally {
      setLoading(false);
    }
  }, [billingCycle, loading, setIsPro, handleClose, session?.user?.id]);

  const handleRestore = useCallback(async () => {
    if (restoring) return;
    setRestoring(true);
    try {
      const isPro = await restorePurchases();
      if (isPro) {
        setIsPro(true);
        if (session?.user?.id && !String(session.user.id).startsWith('guest-')) {
          syncProStatusToSupabase(session.user.id, true).catch(() => {});
        }
        Alert.alert('Restored', 'Your Pro subscription has been restored.', [
          { text: 'OK', onPress: handleClose },
        ]);
      } else {
        Alert.alert('Nothing to restore', 'We didn\u2019t find an active subscription. Try with the email you subscribed with.');
      }
    } catch {
      Alert.alert('Couldn\u2019t restore', 'Check your connection and try again.');
    } finally {
      setRestoring(false);
    }
  }, [restoring, setIsPro, handleClose, session?.user?.id]);

  // Guest: show waitlist email capture
  if (isGuest) {
    return (
      <View style={[styles.screen, { paddingTop: insets.top }]}>
        <Pressable
          onPress={handleClose}
          hitSlop={12}
          accessibilityRole="button"
          accessibilityLabel={t('common.close')}
          style={({ pressed }) => [styles.closeBtn, { top: insets.top + SPACING.xs, opacity: pressed ? 0.6 : 1 }]}
        >
          <X size={20} color={COLORS.cream} strokeWidth={2} />
        </Pressable>
        <WaitlistCaptureModal
          visible
          destination={params.destination ?? ''}
          onViewTrip={handleClose}
          skipLabel="Maybe later"
        />
      </View>
    );
  }

  const monthlyPrice = packages.monthly?.product?.priceString ?? '$9.99';
  const annualPrice = packages.annual?.product?.priceString ?? '$49.99';
  const savingsPercent = computeAnnualSavings(monthlyPrice, annualPrice);
  const monthlyEquivalent = formatMonthlyEquivalent(annualPrice);

  const slideLeft = toggleAnim.interpolate({
    inputRange: [0, 1],
    outputRange: ['50%', '0%'],
  });

  return (
    <View style={[styles.screen, { paddingTop: insets.top }]}>
      {/* Close */}
      <Pressable
        onPress={handleClose}
        hitSlop={12}
        accessibilityRole="button"
        accessibilityLabel={t('common.close')}
        style={({ pressed }) => [styles.closeBtn, { top: insets.top + SPACING.xs, opacity: pressed ? 0.6 : 1 }]}
      >
        <X size={20} color={COLORS.cream} strokeWidth={2} />
      </Pressable>

      <ScrollView
        style={styles.scrollView}
        contentContainerStyle={[styles.scrollContent, { paddingBottom: insets.bottom + SPACING.xl }]}
        showsVerticalScrollIndicator={false}
      >
        {/* ── Hero ── */}
        <Animated.View
          style={[
            styles.heroSection,
            { opacity: headerOpacity, transform: [{ translateY: headerY }] },
          ]}
        >
          <Text style={styles.heroTitle}>ROAM Pro</Text>
          <Text style={styles.heroSubtitle}>{headline}</Text>
        </Animated.View>

        <Animated.View
          style={{ opacity: contentOpacity, transform: [{ translateY: contentY }] }}
        >
          {/* ── Social proof counter ── */}
          <View style={styles.socialProofCard}>
            <View style={styles.socialProofLive}>
              <View style={styles.liveDot} />
              <Text style={styles.socialProofCount}>
                {liveCount.toLocaleString()} travelers upgraded this month
              </Text>
            </View>
            <Text style={styles.socialProofRecent}>{recentActivity}</Text>
          </View>

          {/* ── Annual / Monthly toggle ── */}
          <View style={styles.toggleContainer}>
            <View style={styles.toggleTrack}>
              <Animated.View
                style={[
                  styles.toggleSlider,
                  { left: slideLeft },
                ]}
              />
              <Pressable
                onPress={() => handleToggle('annual')}
                style={styles.toggleOption}
                accessibilityRole="button"
              >
                <Text style={[
                  styles.toggleLabel,
                  billingCycle === 'annual' && styles.toggleLabelActive,
                ]}>
                  Annual
                </Text>
                {savingsPercent > 0 && (
                  <View style={styles.savingsBadge}>
                    <Text style={styles.savingsBadgeText}>SAVE {savingsPercent}%</Text>
                  </View>
                )}
              </Pressable>
              <Pressable
                onPress={() => handleToggle('monthly')}
                style={styles.toggleOption}
                accessibilityRole="button"
              >
                <Text style={[
                  styles.toggleLabel,
                  billingCycle === 'monthly' && styles.toggleLabelActive,
                ]}>
                  Monthly
                </Text>
              </Pressable>
            </View>
          </View>

          {/* ── Plan card ── */}
          <View style={styles.planCard}>
            <View style={styles.planHeader}>
              <Text style={styles.planName}>
                {billingCycle === 'annual' ? 'Global Pass' : 'ROAM Pro'}
              </Text>
              {billingCycle === 'annual' && (
                <View style={styles.bestValueTag}>
                  <Text style={styles.bestValueTagText}>BEST VALUE</Text>
                </View>
              )}
            </View>

            <View style={styles.priceSection}>
              <Text style={styles.planPrice}>
                {billingCycle === 'annual' ? annualPrice : monthlyPrice}
              </Text>
              <Text style={styles.planPeriod}>
                /{billingCycle === 'annual' ? 'year' : 'month'}
              </Text>
            </View>

            {billingCycle === 'annual' && (
              <Text style={styles.monthlyEquivalent}>
                Just {monthlyEquivalent}/month
              </Text>
            )}

            <View style={styles.featuresList}>
              {PRO_FEATURES.map((feat, i) => (
                <View key={i} style={styles.featureRow}>
                  <View style={styles.featureIconWrap}>
                    <feat.icon size={16} color={COLORS.sage} strokeWidth={2} />
                  </View>
                  <Text style={styles.featureText}>{feat.text}</Text>
                </View>
              ))}
              {billingCycle === 'annual' && (
                <>
                  <View style={styles.featureRow}>
                    <View style={styles.featureIconWrap}>
                      <Check size={16} color={COLORS.gold} strokeWidth={2.5} />
                    </View>
                    <Text style={[styles.featureText, { color: COLORS.gold }]}>
                      Founding Member badge
                    </Text>
                  </View>
                  <View style={styles.featureRow}>
                    <View style={styles.featureIconWrap}>
                      <Check size={16} color={COLORS.gold} strokeWidth={2.5} />
                    </View>
                    <Text style={[styles.featureText, { color: COLORS.gold }]}>
                      Early access to new features
                    </Text>
                  </View>
                </>
              )}
            </View>
          </View>

          {/* ── 3-day free trial CTA ── */}
          <Pressable
            onPress={handlePurchase}
            disabled={loading}
            style={({ pressed }) => [
              styles.trialCtaWrapper,
              { opacity: loading ? 0.6 : pressed ? 0.9 : 1, transform: [{ scale: pressed && !loading ? 0.98 : 1 }] },
            ]}
          >
            <LinearGradient
              colors={[COLORS.gold, COLORS.goldDark]}
              start={{ x: 0, y: 0 }}
              end={{ x: 1, y: 0 }}
              style={styles.trialCtaGradient}
            >
              <Text style={styles.trialCtaTitle}>
                {loading
                  ? 'Unlocking your trips...'
                  : 'Start your 3-day free trial'}
              </Text>
              <Text style={styles.trialCtaSub}>
                {billingCycle === 'annual'
                  ? `Then ${annualPrice}/year. Cancel anytime.`
                  : `Then ${monthlyPrice}/month. Cancel anytime.`}
              </Text>
            </LinearGradient>
          </Pressable>

          <Text style={styles.trialNote}>
            No charge for 3 days. Cancel before trial ends and pay nothing.
          </Text>

          {/* ── Compare plans ── */}
          <View style={styles.compareSection}>
            <Text style={styles.compareTitle}>Free vs Pro</Text>
            <View style={styles.compareRow}>
              <Text style={styles.compareLabel}>AI trips per month</Text>
              <Text style={styles.compareFree}>1</Text>
              <Text style={styles.comparePro}>Unlimited</Text>
            </View>
            <View style={styles.compareDivider} />
            <View style={styles.compareRow}>
              <Text style={styles.compareLabel}>Offline prep</Text>
              <View style={styles.compareXWrap}><X size={12} color={COLORS.creamVeryFaint} strokeWidth={2} /></View>
              <View style={styles.compareCheckWrap}><Check size={12} color={COLORS.sage} strokeWidth={2.5} /></View>
            </View>
            <View style={styles.compareDivider} />
            <View style={styles.compareRow}>
              <Text style={styles.compareLabel}>Priority AI</Text>
              <View style={styles.compareXWrap}><X size={12} color={COLORS.creamVeryFaint} strokeWidth={2} /></View>
              <View style={styles.compareCheckWrap}><Check size={12} color={COLORS.sage} strokeWidth={2.5} /></View>
            </View>
            <View style={styles.compareDivider} />
            <View style={styles.compareRow}>
              <Text style={styles.compareLabel}>Travel Twin</Text>
              <View style={styles.compareXWrap}><X size={12} color={COLORS.creamVeryFaint} strokeWidth={2} /></View>
              <View style={styles.compareCheckWrap}><Check size={12} color={COLORS.sage} strokeWidth={2.5} /></View>
            </View>
            <View style={styles.compareDivider} />
            <View style={styles.compareRow}>
              <Text style={styles.compareLabel}>Trip Chemistry</Text>
              <View style={styles.compareXWrap}><X size={12} color={COLORS.creamVeryFaint} strokeWidth={2} /></View>
              <View style={styles.compareCheckWrap}><Check size={12} color={COLORS.sage} strokeWidth={2.5} /></View>
            </View>
            <View style={styles.compareDivider} />
            <View style={styles.compareRow}>
              <Text style={styles.compareLabel}>Memory Lane</Text>
              <View style={styles.compareXWrap}><X size={12} color={COLORS.creamVeryFaint} strokeWidth={2} /></View>
              <View style={styles.compareCheckWrap}><Check size={12} color={COLORS.sage} strokeWidth={2.5} /></View>
            </View>
          </View>

          {/* ── Restore ── */}
          <Pressable
            onPress={handleRestore}
            disabled={restoring}
            style={({ pressed }) => [styles.restoreBtn, { opacity: restoring ? 0.4 : pressed ? 0.6 : 1 }]}
          >
            <Text style={styles.restoreText}>
              {restoring ? 'Looking for your subscription...' : t('paywall.restore')}
            </Text>
          </Pressable>

          {/* Maybe later */}
          <Pressable onPress={handleClose} hitSlop={12}>
            <Text style={styles.maybeLater}>Maybe later</Text>
          </Pressable>
        </Animated.View>
      </ScrollView>
    </View>
  );
}

// =============================================================================
// Styles
// =============================================================================
const styles = StyleSheet.create({
  screen: {
    flex: 1,
    backgroundColor: COLORS.bg,
  } as ViewStyle,
  closeBtn: {
    position: 'absolute',
    top: 0,
    left: SPACING.md,
    marginTop: SPACING.xs,
    zIndex: 10,
    width: 36,
    height: 36,
    borderRadius: RADIUS.full,
    backgroundColor: COLORS.bgGlass,
    alignItems: 'center',
    justifyContent: 'center',
  } as ViewStyle,
  scrollView: {
    flex: 1,
  } as ViewStyle,
  scrollContent: {
    paddingHorizontal: SPACING.lg,
    paddingTop: SPACING.xxl,
    maxWidth: 600,
    alignSelf: 'center',
    width: '100%',
  } as ViewStyle,

  // Hero
  heroSection: {
    alignItems: 'center',
    marginBottom: SPACING.lg,
    paddingTop: SPACING.lg,
  } as ViewStyle,
  heroTitle: {
    fontFamily: FONTS.header,
    fontSize: 48,
    color: COLORS.gold,
    letterSpacing: 1,
    marginBottom: SPACING.sm,
  } as TextStyle,
  heroSubtitle: {
    fontFamily: FONTS.body,
    fontSize: 17,
    color: COLORS.creamMuted,
    textAlign: 'center',
    lineHeight: 26,
  } as TextStyle,

  // Social proof
  socialProofCard: {
    backgroundColor: COLORS.bgCard,
    borderRadius: RADIUS.lg,
    borderWidth: 1,
    borderColor: COLORS.sageBorder,
    paddingHorizontal: SPACING.lg,
    paddingVertical: SPACING.md,
    alignItems: 'center',
    gap: 4,
    marginBottom: SPACING.lg,
  } as ViewStyle,
  socialProofLive: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
  } as ViewStyle,
  liveDot: {
    width: 8,
    height: 8,
    borderRadius: 4,
    backgroundColor: COLORS.sage,
  } as ViewStyle,
  socialProofCount: {
    fontFamily: FONTS.monoMedium,
    fontSize: 13,
    color: COLORS.sage,
    letterSpacing: 0.3,
  } as TextStyle,
  socialProofRecent: {
    fontFamily: FONTS.mono,
    fontSize: 11,
    color: COLORS.creamDim,
    letterSpacing: 0.3,
  } as TextStyle,

  // Toggle
  toggleContainer: {
    alignItems: 'center',
    marginBottom: SPACING.lg,
  } as ViewStyle,
  toggleTrack: {
    flexDirection: 'row',
    backgroundColor: COLORS.bgCard,
    borderRadius: RADIUS.full,
    borderWidth: 1,
    borderColor: COLORS.border,
    height: 44,
    width: '100%',
    maxWidth: 320,
    position: 'relative',
    overflow: 'hidden',
  } as ViewStyle,
  toggleSlider: {
    position: 'absolute',
    top: 2,
    bottom: 2,
    width: '48%',
    borderRadius: RADIUS.full,
    backgroundColor: COLORS.goldSubtle,
    borderWidth: 1,
    borderColor: COLORS.goldBorder,
    marginHorizontal: 2,
  } as ViewStyle,
  toggleOption: {
    flex: 1,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 6,
    zIndex: 1,
  } as ViewStyle,
  toggleLabel: {
    fontFamily: FONTS.bodyMedium,
    fontSize: 14,
    color: COLORS.creamMuted,
  } as TextStyle,
  toggleLabelActive: {
    color: COLORS.cream,
  } as TextStyle,
  savingsBadge: {
    backgroundColor: COLORS.sage,
    paddingHorizontal: 6,
    paddingVertical: 2,
    borderRadius: RADIUS.full,
  } as ViewStyle,
  savingsBadgeText: {
    fontFamily: FONTS.mono,
    fontSize: 9,
    color: COLORS.bg,
    letterSpacing: 0.5,
    fontWeight: '700',
  } as TextStyle,

  // Plan card
  planCard: {
    backgroundColor: COLORS.bgCard,
    borderRadius: RADIUS.lg,
    borderWidth: 2,
    borderColor: COLORS.gold,
    padding: SPACING.xl,
    marginBottom: SPACING.lg,
  } as ViewStyle,
  planHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: SPACING.sm,
    marginBottom: SPACING.sm,
  } as ViewStyle,
  planName: {
    fontFamily: FONTS.bodySemiBold,
    fontSize: 22,
    color: COLORS.gold,
  } as TextStyle,
  bestValueTag: {
    backgroundColor: COLORS.sage,
    paddingHorizontal: SPACING.sm,
    paddingVertical: 2,
    borderRadius: RADIUS.full,
  } as ViewStyle,
  bestValueTagText: {
    fontFamily: FONTS.mono,
    fontSize: 9,
    color: COLORS.bg,
    letterSpacing: 1,
    fontWeight: '700',
  } as TextStyle,
  priceSection: {
    flexDirection: 'row',
    alignItems: 'baseline',
    gap: 4,
    marginBottom: 2,
  } as ViewStyle,
  planPrice: {
    fontFamily: FONTS.header,
    fontSize: 42,
    color: COLORS.cream,
  } as TextStyle,
  planPeriod: {
    fontFamily: FONTS.mono,
    fontSize: 14,
    color: COLORS.creamMuted,
  } as TextStyle,
  monthlyEquivalent: {
    fontFamily: FONTS.mono,
    fontSize: 12,
    color: COLORS.sage,
    letterSpacing: 0.3,
    marginBottom: SPACING.md,
  } as TextStyle,
  featuresList: {
    gap: SPACING.sm,
    marginTop: SPACING.sm,
  } as ViewStyle,
  featureRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: SPACING.sm,
  } as ViewStyle,
  featureIconWrap: {
    width: 20,
    alignItems: 'center',
    justifyContent: 'center',
  } as ViewStyle,
  featureText: {
    fontFamily: FONTS.body,
    fontSize: 14,
    color: COLORS.cream,
    flex: 1,
  } as TextStyle,

  // Trial CTA
  trialCtaWrapper: {
    borderRadius: RADIUS.lg,
    overflow: 'hidden',
    marginBottom: SPACING.sm,
  } as ViewStyle,
  trialCtaGradient: {
    paddingVertical: SPACING.md + 2,
    alignItems: 'center',
    justifyContent: 'center',
    borderRadius: RADIUS.lg,
    gap: 2,
  } as ViewStyle,
  trialCtaTitle: {
    fontFamily: FONTS.bodySemiBold,
    fontSize: 17,
    color: COLORS.bg,
    letterSpacing: 0.3,
  } as TextStyle,
  trialCtaSub: {
    fontFamily: FONTS.mono,
    fontSize: 11,
    color: COLORS.bg,
    opacity: 0.7,
    letterSpacing: 0.3,
  } as TextStyle,
  trialNote: {
    fontFamily: FONTS.body,
    fontSize: 13,
    color: COLORS.creamDim,
    textAlign: 'center',
    marginBottom: SPACING.xl,
    lineHeight: 18,
  } as TextStyle,

  // Compare section
  compareSection: {
    backgroundColor: COLORS.bgCard,
    borderRadius: RADIUS.lg,
    borderWidth: 1,
    borderColor: COLORS.border,
    padding: SPACING.lg,
    marginBottom: SPACING.xl,
  } as ViewStyle,
  compareTitle: {
    fontFamily: FONTS.bodySemiBold,
    fontSize: 16,
    color: COLORS.cream,
    marginBottom: SPACING.md,
    textAlign: 'center',
  } as TextStyle,
  compareRow: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingVertical: SPACING.sm,
  } as ViewStyle,
  compareLabel: {
    flex: 1,
    fontFamily: FONTS.body,
    fontSize: 13,
    color: COLORS.creamMuted,
  } as TextStyle,
  compareFree: {
    width: 64,
    textAlign: 'center',
    fontFamily: FONTS.mono,
    fontSize: 12,
    color: COLORS.creamDim,
  } as TextStyle,
  comparePro: {
    width: 64,
    textAlign: 'center',
    fontFamily: FONTS.monoMedium,
    fontSize: 12,
    color: COLORS.sage,
  } as TextStyle,
  compareXWrap: {
    width: 64,
    alignItems: 'center',
  } as ViewStyle,
  compareCheckWrap: {
    width: 64,
    alignItems: 'center',
  } as ViewStyle,
  compareDivider: {
    height: 1,
    backgroundColor: COLORS.border,
  } as ViewStyle,

  // Restore / dismiss
  restoreBtn: {
    alignItems: 'center',
    paddingVertical: SPACING.sm,
  } as ViewStyle,
  restoreText: {
    fontFamily: FONTS.bodyMedium,
    fontSize: 14,
    color: COLORS.creamMutedLight,
    textDecorationLine: 'underline',
  } as TextStyle,
  maybeLater: {
    fontFamily: FONTS.mono,
    fontSize: 12,
    color: COLORS.creamFaint,
    textAlign: 'center',
    marginTop: SPACING.lg,
    paddingBottom: SPACING.md,
  } as TextStyle,
});
