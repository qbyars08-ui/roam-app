// =============================================================================
// ROAM — Paywall Screen (3-tier: Free / Pro / Global Pass)
// Dark glass cards, gold-highlighted Pro, "Best Value" annual badge
// =============================================================================
import React, { useCallback, useEffect, useRef, useState } from 'react';
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

import { Check, X } from 'lucide-react-native';
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

// =============================================================================
// Tier definitions
// =============================================================================
interface TierFeature {
  text: string;
  included: boolean;
}

interface Tier {
  id: 'free' | 'pro' | 'global';
  name: string;
  price: string;
  period: string;
  badge?: string;
  features: TierFeature[];
  highlighted: boolean;
}

function buildTiers(monthlyPrice: string, annualPrice: string): Tier[] {
  return [
  {
    id: 'free',
    name: 'Free',
    price: '$0',
    period: 'forever',
    features: [
      { text: '1 AI trip per month', included: true },
      { text: 'Basic chat assistant', included: true },
      { text: 'Offline PREP mode', included: false },
      { text: 'Travel Twin & Trip Chemistry', included: false },
      { text: 'Memory Lane journal', included: false },
      { text: 'Priority AI responses', included: false },
    ],
    highlighted: false,
  },
  {
    id: 'pro',
    name: 'ROAM Pro',
    price: monthlyPrice,
    period: '/month',
    features: [
      { text: 'Unlimited AI trips', included: true },
      { text: 'Offline PREP mode', included: true },
      { text: 'All premium features', included: true },
      { text: 'Priority AI (faster responses)', included: true },
      { text: 'Travel Twin matching', included: true },
      { text: 'Trip Chemistry (group travel)', included: true },
    ],
    highlighted: true,
  },
  {
    id: 'global',
    name: 'Global Pass',
    price: annualPrice,
    period: '/year',
    badge: 'Best Value',
    features: [
      { text: 'Everything in Pro', included: true },
      { text: 'Early access to new features', included: true },
      { text: '"Founding Member" badge', included: true },
      { text: 'Priority support', included: true },
      { text: 'Exclusive destination drops', included: true },
      { text: 'Shape the ROAM roadmap', included: true },
    ],
    highlighted: false,
  },
]; }

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

  const [selectedTier, setSelectedTier] = useState<'pro' | 'global'>('global');
  const [loading, setLoading] = useState(false);
  const [restoring, setRestoring] = useState(false);
  const [packages, setPackages] = useState<OfferingPackages>({ monthly: null, annual: null });

  // Entrance animations
  const headerOpacity = useRef(new Animated.Value(0)).current;
  const headerY = useRef(new Animated.Value(20)).current;
  const cardsOpacity = useRef(new Animated.Value(0)).current;
  const cardsY = useRef(new Animated.Value(30)).current;

  // Load offerings for live prices
  useEffect(() => {
    getOfferings().then(setPackages).catch(() => {});
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
        Animated.timing(cardsOpacity, {
          toValue: 1, duration: 600, useNativeDriver: true,
        }),
        Animated.timing(cardsY, {
          toValue: 0, duration: 600, easing: Easing.out(Easing.cubic),
          useNativeDriver: true,
        }),
      ]),
    ]).start();
  }, []);

  // Dynamic headline based on trigger reason (growth hooks with destination-aware fallback)
  const upgradeContext = params.reason === 'limit' ? 'trip_limit' as const
    : params.reason === 'milestone' ? 'post_trip' as const
    : params.reason === 'feature' ? 'feature_locked' as const
    : 'default' as const;
  const upgradeMsg = getUpgradeMessage(upgradeContext);
  const socialProof = getPaywallSocialProof();

  const headline = (() => {
    // Use destination-aware messaging when available
    switch (params.reason) {
      case 'limit':
        return params.destination
          ? `You just planned ${params.destination}.\nUnlock unlimited trips and keep the momentum.`
          : upgradeMsg.headline;
      case 'feature':
        return params.feature
          ? `${params.feature} is a Pro feature.\nUpgrade to unlock your full travel toolkit.`
          : upgradeMsg.headline;
      case 'chaos':
        return 'Chaos Mode needs fuel.\nGo Pro for unlimited random trips.';
      case 'group':
        return 'Group planning unlocked with Pro.\nPlan trips together, split the fun.';
      default:
        return upgradeMsg.headline;
    }
  })();

  useEffect(() => {
    track({ type: 'screen_view', screen: 'paywall', payload: { reason: params.reason ?? 'default' } }).catch(() => {});
    recordGrowthEvent('paywall_view').catch(() => {});
  }, []);

  const handleClose = useCallback(() => {
    if (router.canGoBack()) {
      router.back();
    } else {
      router.replace('/(tabs)');
    }
  }, [router]);

  // All useCallback hooks must be declared before any early return (Rules of Hooks)
  const handlePurchase = useCallback(async () => {
    if (loading) return;
    setLoading(true);
    try {
      const success = selectedTier === 'global'
        ? await purchaseGlobal()
        : await purchasePro();

      if (success) {
        setIsPro(true);
        if (session?.user?.id && !String(session.user.id).startsWith('guest-')) {
          syncProStatusToSupabase(session.user.id, true).catch(() => {});
        }
        track({ type: 'tap', screen: 'paywall', action: 'purchase_success', payload: { tier: selectedTier } }).catch(() => {});
        recordGrowthEvent('purchase_success').catch(() => {});
        handleClose();
      }
    } catch (err) {
      Alert.alert('Something went wrong', 'Try again — we\u2019ll be here.');
    } finally {
      setLoading(false);
    }
  }, [selectedTier, loading, setIsPro, handleClose, session?.user?.id]);

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
        Alert.alert('Nothing to restore', 'We didn\u2019t find an active subscription on this account. If you subscribed with a different email, try that one.');
      }
    } catch (err) {
      Alert.alert('Couldn\u2019t restore', 'Check your connection and give it another shot.');
    } finally {
      setRestoring(false);
    }
  }, [restoring, setIsPro, handleClose, session?.user?.id]);

  // Guest: show waitlist email capture instead of purchase tiers
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
  const tiers = buildTiers(monthlyPrice, annualPrice);

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
        {/* Header */}
        <Animated.View
          style={[
            styles.heroSection,
            { opacity: headerOpacity, transform: [{ translateY: headerY }] },
          ]}
        >
          <Text style={styles.heroTitle}>ROAM Pro</Text>
          <Text style={styles.heroSubtitle}>{headline}</Text>
          <View style={styles.socialProofRow}>
            <View style={styles.socialProofDot} />
            <Text style={styles.socialProof}>{socialProof.upgradeCount}</Text>
          </View>
          <Text style={styles.socialProofSub}>{upgradeMsg.subtext}</Text>
        </Animated.View>

        {/* Tier Cards */}
        <Animated.View
          style={{ opacity: cardsOpacity, transform: [{ translateY: cardsY }] }}
        >
          {tiers.map((tier) => {
            const isSelected =
              tier.id === selectedTier || (tier.id === 'free' && false);
            const isFree = tier.id === 'free';

            return (
              <Pressable
                key={tier.id}
                onPress={() => {
                  if (!isFree) setSelectedTier(tier.id as 'pro' | 'global');
                }}
                style={({ pressed }) => [
                  styles.tierCard,
                  tier.highlighted && styles.tierCardHighlighted,
                  isSelected && !isFree && styles.tierCardSelected,
                  { opacity: pressed && !isFree ? 0.9 : 1 },
                ]}
              >
                {/* Badge */}
                {tier.badge && (
                  <View style={styles.bestValueBadge}>
                    <Text style={styles.bestValueText}>{t('paywall.bestValue')}</Text>
                  </View>
                )}

                {/* Tier header */}
                <View style={styles.tierHeader}>
                  <View style={styles.tierNameRow}>
                    {!isFree && (
                      <View style={[styles.radioOuter, isSelected && styles.radioOuterSelected]}>
                        {isSelected && <View style={styles.radioInner} />}
                      </View>
                    )}
                    <Text style={[styles.tierName, tier.highlighted && styles.tierNameGold]}>
                      {tier.id === 'free' ? t('common.free') : tier.name}
                    </Text>
                  </View>
                  <View style={styles.priceRow}>
                    <Text style={styles.tierPrice}>{tier.price}</Text>
                    <Text style={styles.tierPeriod}>{tier.period}</Text>
                  </View>
                </View>

                {/* Features */}
                <View style={styles.tierFeatures}>
                  {tier.features.map((f: TierFeature, i: number) => (
                    <View key={i} style={styles.featureRow}>
                      <View style={[styles.featureIconWrap, !f.included && styles.featureIconMuted]}>
                        {f.included ? (
                          <Check size={14} color={COLORS.sage} strokeWidth={2.5} />
                        ) : (
                          <X size={14} color={COLORS.creamVeryFaint} strokeWidth={2.5} />
                        )}
                      </View>
                      <Text style={[styles.featureText, !f.included && styles.featureTextMuted]}>
                        {f.text}
                      </Text>
                    </View>
                  ))}
                </View>
              </Pressable>
            );
          })}
        </Animated.View>

        {/* CTA */}
        <Pressable
          onPress={handlePurchase}
          disabled={loading}
          style={({ pressed }) => [
            styles.ctaWrapper,
            { opacity: loading ? 0.6 : pressed ? 0.9 : 1, transform: [{ scale: pressed && !loading ? 0.98 : 1 }] },
          ]}
        >
          <LinearGradient
            colors={[COLORS.gold, COLORS.goldDark]}
            start={{ x: 0, y: 0 }}
            end={{ x: 1, y: 0 }}
            style={styles.ctaGradient}
          >
            <Text style={styles.ctaText}>
              {loading
                ? 'Unlocking your trips...'
                : selectedTier === 'global'
                  ? `Start Global Pass — ${annualPrice}/year`
                  : `Start Pro — ${monthlyPrice}/month`}
            </Text>
          </LinearGradient>
        </Pressable>

        <Text style={styles.trialNote}>Cancel whenever. No guilt trips — just real ones.</Text>

        {/* Restore */}
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
    marginBottom: SPACING.xl,
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
    marginBottom: SPACING.md,
  } as TextStyle,
  socialProofRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
    marginBottom: 4,
  } as ViewStyle,
  socialProofDot: {
    width: 6,
    height: 6,
    borderRadius: 3,
    backgroundColor: COLORS.sage,
  } as ViewStyle,
  socialProof: {
    fontFamily: FONTS.mono,
    fontSize: 12,
    color: COLORS.sage,
    letterSpacing: 0.5,
  } as TextStyle,
  socialProofSub: {
    fontFamily: FONTS.body,
    fontSize: 13,
    color: COLORS.creamDim,
    textAlign: 'center',
    marginTop: 2,
  } as TextStyle,

  // Tier cards
  tierCard: {
    backgroundColor: COLORS.bgCard,
    borderRadius: RADIUS.lg,
    borderWidth: 1,
    borderColor: COLORS.border,
    padding: SPACING.lg,
    marginBottom: SPACING.md,
    overflow: 'hidden',
  } as ViewStyle,
  tierCardHighlighted: {
    borderColor: COLORS.gold,
    borderWidth: 2,
    backgroundColor: COLORS.goldVeryFaint,
  } as ViewStyle,
  tierCardSelected: {
    borderColor: COLORS.gold,
    backgroundColor: COLORS.goldVeryFaint,
  } as ViewStyle,
  bestValueBadge: {
    position: 'absolute',
    top: 0,
    right: 0,
    backgroundColor: COLORS.sage,
    paddingHorizontal: SPACING.sm + 4,
    paddingVertical: SPACING.xs + 2,
    borderBottomLeftRadius: RADIUS.sm,
  } as ViewStyle,
  bestValueText: {
    fontFamily: FONTS.monoMedium,
    fontSize: 10,
    color: COLORS.bg,
    letterSpacing: 1,
    textTransform: 'uppercase',
  } as TextStyle,
  tierHeader: {
    marginBottom: SPACING.md,
  } as ViewStyle,
  tierNameRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: SPACING.sm,
    marginBottom: SPACING.xs,
  } as ViewStyle,
  tierName: {
    fontFamily: FONTS.bodySemiBold,
    fontSize: 20,
    color: COLORS.cream,
  } as TextStyle,
  tierNameGold: {
    color: COLORS.gold,
  } as TextStyle,
  priceRow: {
    flexDirection: 'row',
    alignItems: 'baseline',
    gap: 4,
  } as ViewStyle,
  tierPrice: {
    fontFamily: FONTS.header,
    fontSize: 36,
    color: COLORS.cream,
  } as TextStyle,
  tierPeriod: {
    fontFamily: FONTS.mono,
    fontSize: 12,
    color: COLORS.creamMuted,
  } as TextStyle,
  tierFeatures: {
    gap: SPACING.sm,
  } as ViewStyle,
  featureRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: SPACING.sm,
  } as ViewStyle,
  featureIconWrap: {
    width: 18,
    alignItems: 'center',
    justifyContent: 'center',
  } as ViewStyle,
  featureIconMuted: {
    opacity: 0.4,
  } as ViewStyle,
  featureText: {
    fontFamily: FONTS.body,
    fontSize: 14,
    color: COLORS.cream,
    flex: 1,
  } as TextStyle,
  featureTextMuted: {
    color: COLORS.creamDimLight,
  } as TextStyle,

  // Radio
  radioOuter: {
    width: 20,
    height: 20,
    borderRadius: RADIUS.full,
    borderWidth: 2,
    borderColor: COLORS.border,
    alignItems: 'center',
    justifyContent: 'center',
  } as ViewStyle,
  radioOuterSelected: {
    borderColor: COLORS.gold,
  } as ViewStyle,
  radioInner: {
    width: 10,
    height: 10,
    borderRadius: RADIUS.full,
    backgroundColor: COLORS.gold,
  } as ViewStyle,

  // CTA
  ctaWrapper: {
    borderRadius: RADIUS.lg,
    overflow: 'hidden',
    marginTop: SPACING.md,
    marginBottom: SPACING.sm,
  } as ViewStyle,
  ctaGradient: {
    height: 58,
    alignItems: 'center',
    justifyContent: 'center',
    borderRadius: RADIUS.lg,
  } as ViewStyle,
  ctaText: {
    fontFamily: FONTS.bodySemiBold,
    fontSize: 17,
    color: COLORS.bg,
    letterSpacing: 0.3,
  } as TextStyle,
  trialNote: {
    fontFamily: FONTS.body,
    fontSize: 13,
    color: COLORS.creamDim,
    textAlign: 'center',
    marginBottom: SPACING.lg,
  } as TextStyle,
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
