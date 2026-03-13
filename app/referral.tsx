// =============================================================================
// ROAM — Referral Screen (Modal)
// Share your code, track referrals, earn free trips
// =============================================================================
import React, { useCallback, useEffect, useState } from 'react';
import {
  Pressable,
  ScrollView,
  StyleSheet,
  Text,
  View,
  type TextStyle,
  type ViewStyle,
} from 'react-native';
import { useRouter } from 'expo-router';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { LinearGradient } from 'expo-linear-gradient';
import * as Haptics from '../lib/haptics';
import * as Clipboard from 'expo-clipboard';
import { X, Gift, Copy, Check, Share2 } from 'lucide-react-native';
import { COLORS, FONTS, SPACING, RADIUS } from '../lib/constants';
import { useAppStore } from '../lib/store';
import {
  getReferralCode,
  getReferralStats,
  getReferralUrl,
  shareReferralLink,
  type ReferralStats,
} from '../lib/referral';

// ---------------------------------------------------------------------------
// How-it-works steps
// ---------------------------------------------------------------------------
const STEPS = [
  { num: '1', title: 'Share your link', desc: 'Send it to friends who love to travel' },
  { num: '2', title: 'They join the waitlist', desc: 'Your friend signs up with your link' },
  { num: '3', title: 'You earn Pro', desc: '3 friends = 1 month free. 10 friends = 1 year free.' },
];

const MILESTONE_1_MONTH = 3;
const MILESTONE_1_YEAR = 10;

export default function ReferralScreen() {
  const router = useRouter();
  const insets = useSafeAreaInsets();

  const session = useAppStore((s) => s.session);
  const userId = session?.user?.id ?? '';

  const [stats, setStats] = useState<ReferralStats>({
    code: '',
    referralsCount: 0,
    freeTripsEarned: 0,
    proMonthsEarned: 0,
    nextMilestoneMessage: null,
  });
  const [copied, setCopied] = useState(false);

  // Load stats on mount
  useEffect(() => {
    if (!userId) return;
    getReferralStats(userId).then(setStats);
  }, [userId]);

  // Fallback code for display even before async finishes
  const code = stats.code || (userId ? getReferralCode(userId) : 'ROAM0000');

  // ---------------------------------------------------------------------------
  // Actions
  // ---------------------------------------------------------------------------
  const referralUrl = getReferralUrl(code);

  const handleCopy = useCallback(async () => {
    Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
    await Clipboard.setStringAsync(referralUrl);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  }, [referralUrl]);

  const handleShare = useCallback(async () => {
    Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Medium);
    await shareReferralLink(code);
  }, [code]);

  // ---------------------------------------------------------------------------
  // Render
  // ---------------------------------------------------------------------------
  return (
    <View style={[styles.container, { paddingTop: insets.top }]}>
      {/* Close button */}
      <View style={styles.headerRow}>
        <Pressable
          onPress={() => { Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light); router.back(); }}
          hitSlop={12}
          accessibilityRole="button"
          accessibilityLabel="Close"
          style={({ pressed }) => [
            styles.closeBtn,
            { opacity: pressed ? 0.6 : 1 },
          ]}
        >
          <X size={22} color={COLORS.cream} strokeWidth={2} />
        </Pressable>
      </View>

      <ScrollView
        contentContainerStyle={styles.scrollContent}
        showsVerticalScrollIndicator={false}
      >
        {/* Hero header */}
        <View style={styles.heroIconWrap}>
          <Gift size={48} color={COLORS.gold} strokeWidth={1.5} />
        </View>
        <Text style={styles.heroTitle}>Give a trip, get a trip</Text>
        <Text style={styles.heroSubtitle}>
          Share your link. 3 friends = 1 month Pro free. 10 friends = 1 year Pro free.
        </Text>

        {/* Referral link card */}
        <View style={styles.codeCard}>
          <Text style={styles.codeLabel}>YOUR REFERRAL LINK</Text>
          <Text style={[styles.codeText, { fontSize: 14, letterSpacing: 0 }]} numberOfLines={2}>{referralUrl}</Text>
          <Pressable
            onPress={handleCopy}
            accessibilityRole="button"
            accessibilityLabel={copied ? 'Copied' : 'Copy referral link'}
            style={({ pressed }) => [
              styles.copyBtn,
              { opacity: pressed ? 0.7 : 1 },
            ]}
          >
            <View style={styles.copyBtnInner}>
              {copied ? (
                <>
                  <Check size={18} color={COLORS.cream} strokeWidth={2} />
                  <Text style={styles.copyBtnText}>Copied!</Text>
                </>
              ) : (
                <>
                  <Copy size={18} color={COLORS.cream} strokeWidth={2} />
                  <Text style={styles.copyBtnText}>Copy Link</Text>
                </>
              )}
            </View>
          </Pressable>
        </View>

        {/* Share button */}
        <Pressable
          onPress={handleShare}
          style={({ pressed }) => [
            styles.shareButton,
            { transform: [{ scale: pressed ? 0.97 : 1 }] },
          ]}
        >
          <LinearGradient
            colors={[COLORS.sage, COLORS.sageDark]}
            style={styles.shareGradient}
          >
            <View style={styles.shareBtnInner}>
              <Share2 size={20} color={COLORS.bg} strokeWidth={2} />
              <Text style={styles.shareButtonText}>Share with friends</Text>
            </View>
          </LinearGradient>
        </Pressable>

        {/* Progress tracker */}
        <View style={styles.progressSection}>
          <Text style={styles.progressTitle}>
            {stats.referralsCount} referral{stats.referralsCount !== 1 ? 's' : ''}
          </Text>
          <Text style={styles.progressSubtitle}>
            {stats.referralsCount >= MILESTONE_1_YEAR
              ? 'You unlocked 1 year of Pro'
              : stats.referralsCount >= MILESTONE_1_MONTH
              ? `${stats.proMonthsEarned} month${stats.proMonthsEarned !== 1 ? 's' : ''} Pro earned`
              : stats.nextMilestoneMessage ?? 'Share your link to get started'}
          </Text>
          {/* Progress bar: 0→3 (first month) or 3→10 (year) */}
          {stats.referralsCount < MILESTONE_1_YEAR && (
            <View style={styles.progressBarWrap}>
              <View style={styles.progressBarBg}>
                <View
                  style={[
                    styles.progressBarFill,
                    {
                      width: `${Math.min(
                        100,
                        stats.referralsCount >= MILESTONE_1_MONTH
                          ? ((stats.referralsCount - MILESTONE_1_MONTH) / (MILESTONE_1_YEAR - MILESTONE_1_MONTH)) * 100
                          : (stats.referralsCount / MILESTONE_1_MONTH) * 100
                      )}%`,
                    },
                  ]}
                />
              </View>
              <View style={styles.progressLabels}>
                <Text style={styles.progressLabel}>
                  {stats.referralsCount < MILESTONE_1_MONTH
                    ? `${stats.referralsCount}/${MILESTONE_1_MONTH} to first month`
                    : `${stats.referralsCount}/${MILESTONE_1_YEAR} to 1 year`}
                </Text>
              </View>
            </View>
          )}
        </View>

        {/* Stats row */}
        <View style={styles.statsRow}>
          <View style={styles.statCard}>
            <Text style={styles.statValue}>{stats.referralsCount}</Text>
            <Text style={styles.statLabel}>TOTAL REFERRALS</Text>
          </View>
          <View style={styles.statCard}>
            <Text style={styles.statValue}>{stats.proMonthsEarned}</Text>
            <Text style={styles.statLabel}>PRO MONTHS EARNED</Text>
          </View>
        </View>

        {/* How it works */}
        <View style={styles.howSection}>
          <Text style={styles.howTitle}>How it works</Text>
          {STEPS.map((step, i) => (
            <View key={i} style={styles.stepRow}>
              <View style={styles.stepBadge}>
                <Text style={styles.stepNum}>{step.num}</Text>
              </View>
              <View style={styles.stepContent}>
                <Text style={styles.stepTitle}>{step.title}</Text>
                <Text style={styles.stepDesc}>{step.desc}</Text>
              </View>
            </View>
          ))}
        </View>
      </ScrollView>
    </View>
  );
}

// ---------------------------------------------------------------------------
// Styles
// ---------------------------------------------------------------------------
const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: COLORS.bg,
  } as ViewStyle,
  headerRow: {
    flexDirection: 'row',
    justifyContent: 'flex-end',
    paddingHorizontal: SPACING.md,
    paddingVertical: SPACING.sm,
  } as ViewStyle,
  closeBtn: {
    width: 36,
    height: 36,
    borderRadius: RADIUS.full,
    backgroundColor: COLORS.bgGlass,
    alignItems: 'center',
    justifyContent: 'center',
  } as ViewStyle,
  closeBtnText: {
    fontSize: 16,
    color: COLORS.cream,
  } as TextStyle,
  scrollContent: {
    paddingHorizontal: SPACING.lg,
    paddingBottom: SPACING.xxxl,
  } as ViewStyle,

  // Hero
  heroIconWrap: {
    alignItems: 'center',
    marginTop: SPACING.md,
  } as ViewStyle,
  heroTitle: {
    fontFamily: FONTS.header,
    fontSize: 32,
    color: COLORS.cream,
    textAlign: 'center',
    marginTop: SPACING.md,
  } as TextStyle,
  heroSubtitle: {
    fontFamily: FONTS.body,
    fontSize: 15,
    color: COLORS.creamMuted,
    textAlign: 'center',
    lineHeight: 22,
    marginTop: SPACING.sm,
    paddingHorizontal: SPACING.md,
  } as TextStyle,

  // Code card
  codeCard: {
    backgroundColor: COLORS.bgCard,
    borderRadius: RADIUS.xl,
    borderWidth: 1.5,
    borderColor: COLORS.gold,
    padding: SPACING.xl,
    alignItems: 'center',
    gap: SPACING.md,
    marginTop: SPACING.xl,
  } as ViewStyle,
  codeLabel: {
    fontFamily: FONTS.mono,
    fontSize: 10,
    color: COLORS.gold,
    letterSpacing: 2,
  } as TextStyle,
  codeText: {
    fontFamily: FONTS.monoMedium,
    fontSize: 32,
    color: COLORS.cream,
    letterSpacing: 4,
  } as TextStyle,
  copyBtn: {
    backgroundColor: COLORS.bgGlass,
    paddingHorizontal: SPACING.lg,
    paddingVertical: SPACING.sm,
    borderRadius: RADIUS.full,
    borderWidth: 1,
    borderColor: COLORS.border,
  } as ViewStyle,
  copyBtnInner: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: SPACING.sm,
  } as ViewStyle,
  copyBtnText: {
    fontFamily: FONTS.bodyMedium,
    fontSize: 13,
    color: COLORS.cream,
  } as TextStyle,

  // Share button
  shareButton: {
    width: '100%',
    borderRadius: RADIUS.lg,
    overflow: 'hidden',
    marginTop: SPACING.lg,
  } as ViewStyle,
  shareGradient: {
    paddingVertical: SPACING.md + 2,
    alignItems: 'center',
    borderRadius: RADIUS.lg,
  } as ViewStyle,
  shareBtnInner: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: SPACING.sm,
  } as ViewStyle,
  shareButtonText: {
    fontFamily: FONTS.bodySemiBold,
    fontSize: 16,
    color: COLORS.bg,
  } as TextStyle,

  // Progress
  progressSection: {
    backgroundColor: COLORS.bgGlass,
    borderRadius: RADIUS.lg,
    borderWidth: 1,
    borderColor: COLORS.border,
    padding: SPACING.xl,
    alignItems: 'center',
    gap: SPACING.md,
    marginTop: SPACING.xl,
  } as ViewStyle,
  progressTitle: {
    fontFamily: FONTS.headerMedium,
    fontSize: 20,
    color: COLORS.cream,
  } as TextStyle,
  progressSubtitle: {
    fontFamily: FONTS.body,
    fontSize: 14,
    color: COLORS.creamMuted,
    marginTop: 4,
    textAlign: 'center',
  } as TextStyle,
  progressBarWrap: {
    width: '100%',
    marginTop: SPACING.lg,
    gap: SPACING.sm,
  } as ViewStyle,
  progressBarBg: {
    height: 8,
    backgroundColor: COLORS.bgCard,
    borderRadius: RADIUS.full,
    overflow: 'hidden',
  } as ViewStyle,
  progressBarFill: {
    height: '100%',
    backgroundColor: COLORS.sage,
    borderRadius: RADIUS.full,
  } as ViewStyle,
  progressLabels: {
    flexDirection: 'row',
    justifyContent: 'space-between',
  } as ViewStyle,
  progressLabel: {
    fontFamily: FONTS.mono,
    fontSize: 11,
    color: COLORS.creamMuted,
    letterSpacing: 0.5,
  } as TextStyle,
  dotsRow: {
    flexDirection: 'row',
    gap: SPACING.md,
  } as ViewStyle,
  dot: {
    width: 44,
    height: 44,
    borderRadius: RADIUS.full,
    alignItems: 'center',
    justifyContent: 'center',
  } as ViewStyle,
  dotFilled: {
    backgroundColor: COLORS.sage,
  } as ViewStyle,
  dotEmpty: {
    backgroundColor: COLORS.bgCard,
    borderWidth: 1.5,
    borderColor: COLORS.border,
  } as ViewStyle,
  dotCheck: {
    fontSize: 18,
    color: COLORS.bg,
    fontWeight: '700',
  } as TextStyle,

  // Stats
  statsRow: {
    flexDirection: 'row',
    gap: SPACING.md,
    marginTop: SPACING.lg,
  } as ViewStyle,
  statCard: {
    flex: 1,
    backgroundColor: COLORS.bgGlass,
    borderRadius: RADIUS.lg,
    borderWidth: 1,
    borderColor: COLORS.border,
    padding: SPACING.lg,
    alignItems: 'center',
    gap: SPACING.xs,
  } as ViewStyle,
  statValue: {
    fontFamily: FONTS.header,
    fontSize: 32,
    color: COLORS.cream,
  } as TextStyle,
  statLabel: {
    fontFamily: FONTS.mono,
    fontSize: 10,
    color: COLORS.sage,
    letterSpacing: 1,
  } as TextStyle,

  // How it works
  howSection: {
    marginTop: SPACING.xl,
    gap: SPACING.md,
  } as ViewStyle,
  howTitle: {
    fontFamily: FONTS.header,
    fontSize: 22,
    color: COLORS.cream,
    marginBottom: SPACING.xs,
  } as TextStyle,
  stepRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: SPACING.md,
    backgroundColor: COLORS.bgCard,
    borderRadius: RADIUS.lg,
    borderWidth: 1,
    borderColor: COLORS.border,
    padding: SPACING.md,
  } as ViewStyle,
  stepBadge: {
    width: 36,
    height: 36,
    borderRadius: RADIUS.full,
    backgroundColor: COLORS.sageLight,
    alignItems: 'center',
    justifyContent: 'center',
  } as ViewStyle,
  stepNum: {
    fontFamily: FONTS.bodySemiBold,
    fontSize: 15,
    color: COLORS.sage,
  } as TextStyle,
  stepContent: {
    flex: 1,
    gap: 2,
  } as ViewStyle,
  stepTitle: {
    fontFamily: FONTS.bodyMedium,
    fontSize: 15,
    color: COLORS.cream,
  } as TextStyle,
  stepDesc: {
    fontFamily: FONTS.body,
    fontSize: 13,
    color: COLORS.creamMuted,
  } as TextStyle,
});
