// =============================================================================
// ROAM — Invite Friends Screen
// Share your referral code, collect waitlist emails
// =============================================================================
import React, { useCallback, useEffect, useMemo, useState } from 'react';
import {
  Alert,
  Animated,
  Dimensions,
  Pressable,
  ScrollView,
  Share,
  StyleSheet,
  Text,
  TextInput,
  View,
  type TextStyle,
  type ViewStyle,
} from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { useRouter } from 'expo-router';
import { LinearGradient } from 'expo-linear-gradient';
import {
  ArrowLeft,
  Copy,
  Gift,
  Heart,
  Link2,
  Mail,
  MessageCircle,
  Send,
  Share2,
  Sparkles,
  Users,
  Check,
} from 'lucide-react-native';
import * as Haptics from '../lib/haptics';
import { COLORS, FONTS, SPACING, RADIUS } from '../lib/constants';
import {
  getReferralCode,
  getInviteCount,
  incrementInviteCount,
  submitToWaitlist,
} from '../lib/waitlist';
import * as Clipboard from 'expo-clipboard';

const { width: SCREEN_WIDTH } = Dimensions.get('window');
// Use SCREEN_WIDTH for potential future responsive layouts
void SCREEN_WIDTH;

export default function InviteScreen() {
  const insets = useSafeAreaInsets();
  const router = useRouter();
  const [referralCode, setReferralCode] = useState('');
  const [inviteCount, setInviteCount] = useState(0);
  const [email, setEmail] = useState('');
  const [submitting, setSubmitting] = useState(false);
  const [submitted, setSubmitted] = useState(false);
  const [waitlistPosition, setWaitlistPosition] = useState<number | null>(null);
  const [copied, setCopied] = useState(false);
  const fadeAnim = useMemo(() => new Animated.Value(0), []);
  const slideAnim = useMemo(() => new Animated.Value(30), []);

  useEffect(() => {
    getReferralCode().then(setReferralCode);
    getInviteCount().then(setInviteCount);
    Animated.parallel([
      Animated.timing(fadeAnim, { toValue: 1, duration: 600, useNativeDriver: true }),
      Animated.spring(slideAnim, { toValue: 0, useNativeDriver: true, tension: 50, friction: 9 }),
    ]).start();
  }, [fadeAnim, slideAnim]);

  const shareLink = useMemo(
    () => `https://roamtravel.app/join?ref=${referralCode}`,
    [referralCode],
  );

  const handleShare = useCallback(async () => {
    Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Medium);
    try {
      await Share.share({
        message: `I'm using ROAM to plan my trips with AI — it's insane. Join the waitlist: ${shareLink}`,
        url: shareLink,
      });
      const count = await incrementInviteCount();
      setInviteCount(count);
    } catch {
      // User cancelled share
    }
  }, [shareLink]);

  const handleCopyLink = useCallback(async () => {
    Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
    await Clipboard.setStringAsync(shareLink);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  }, [shareLink]);

  const handleSubmitEmail = useCallback(async () => {
    if (!email.trim()) return;
    Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Medium);
    setSubmitting(true);
    const result = await submitToWaitlist(email, referralCode);
    setSubmitting(false);
    if (result.success) {
      setSubmitted(true);
      setWaitlistPosition(result.position ?? null);
      Haptics.notificationAsync(Haptics.NotificationFeedbackType.Success);
    } else {
      Alert.alert('Heads up', result.error ?? 'Something went wrong');
    }
  }, [email, referralCode]);

  return (
    <View style={[styles.container, { paddingTop: insets.top }]}>
      {/* Header */}
      <View style={styles.header}>
        <Pressable
          onPress={() => router.back()}
          style={({ pressed }) => [styles.backBtn, { opacity: pressed ? 0.7 : 1 }]}
          accessibilityLabel="Go back"
        >
          <ArrowLeft size={22} color={COLORS.cream} strokeWidth={2} />
        </Pressable>
        <Text style={styles.headerTitle}>Invite Friends</Text>
        <View style={styles.headerSpacer} />
      </View>

      <ScrollView
        showsVerticalScrollIndicator={false}
        contentContainerStyle={styles.scroll}
      >
        <Animated.View style={{ opacity: fadeAnim, transform: [{ translateY: slideAnim }] }}>
          {/* Hero */}
          <View style={styles.heroSection}>
            <View style={styles.emojiRow}>
              <Text style={styles.heroEmoji}>🌍</Text>
              <Text style={styles.heroEmoji}>✈️</Text>
              <Text style={styles.heroEmoji}>🗺️</Text>
            </View>
            <Text style={styles.heroTitle}>Travel is better{'\n'}with friends</Text>
            <Text style={styles.heroSub}>
              Share ROAM with your crew. They join the waitlist, you get early access perks.
            </Text>
          </View>

          {/* Stats row */}
          <View style={styles.statsRow}>
            <View style={styles.statCard}>
              <Text style={styles.statNumber}>{inviteCount}</Text>
              <Text style={styles.statLabel}>Friends invited</Text>
            </View>
            <View style={styles.statDivider} />
            <View style={styles.statCard}>
              <Text style={styles.statNumber}>{referralCode}</Text>
              <Text style={styles.statLabel}>Your code</Text>
            </View>
          </View>

          {/* Share buttons */}
          <View style={styles.shareSection}>
            <Text style={styles.sectionTitle}>Share your link</Text>

            {/* Link preview */}
            <Pressable
              onPress={handleCopyLink}
              style={({ pressed }) => [styles.linkPreview, { opacity: pressed ? 0.85 : 1 }]}
            >
              <Link2 size={16} color={COLORS.sage} strokeWidth={2} />
              <Text style={styles.linkText} numberOfLines={1}>{shareLink}</Text>
              {copied ? (
                <Check size={16} color={COLORS.sage} strokeWidth={2} />
              ) : (
                <Copy size={16} color={COLORS.creamDim} strokeWidth={2} />
              )}
            </Pressable>

            {/* Share CTA */}
            <Pressable
              onPress={handleShare}
              style={({ pressed }) => [{ opacity: pressed ? 0.9 : 1 }]}
            >
              <LinearGradient
                colors={[COLORS.sage, COLORS.sageDark]}
                start={{ x: 0, y: 0 }}
                end={{ x: 1, y: 0 }}
                style={styles.shareCta}
              >
                <Share2 size={18} color={COLORS.bg} strokeWidth={2} />
                <Text style={styles.shareCtaText}>Share with friends</Text>
              </LinearGradient>
            </Pressable>

            {/* Quick share row */}
            <View style={styles.quickShareRow}>
              <Pressable onPress={handleShare} style={styles.quickShareBtn}>
                <MessageCircle size={20} color={COLORS.cream} strokeWidth={2} />
                <Text style={styles.quickShareLabel}>iMessage</Text>
              </Pressable>
              <Pressable onPress={handleShare} style={styles.quickShareBtn}>
                <Send size={20} color={COLORS.cream} strokeWidth={2} />
                <Text style={styles.quickShareLabel}>WhatsApp</Text>
              </Pressable>
              <Pressable onPress={handleCopyLink} style={styles.quickShareBtn}>
                <Copy size={20} color={COLORS.cream} strokeWidth={2} />
                <Text style={styles.quickShareLabel}>Copy</Text>
              </Pressable>
            </View>
          </View>

          {/* Direct email invite */}
          <View style={styles.emailSection}>
            <Text style={styles.sectionTitle}>Or add them directly</Text>
            {submitted ? (
              <View style={styles.successCard}>
                <Sparkles size={24} color={COLORS.gold} strokeWidth={2} />
                <Text style={styles.successTitle}>You're in! 🎉</Text>
                {waitlistPosition != null && (
                  <Text style={styles.successSub}>
                    Position #{waitlistPosition} on the waitlist
                  </Text>
                )}
                <Text style={styles.successDetail}>
                  We'll send early access as soon as spots open up.
                </Text>
              </View>
            ) : (
              <View style={styles.emailInputRow}>
                <TextInput
                  style={styles.emailInput}
                  placeholder="friend@email.com"
                  placeholderTextColor={COLORS.creamMuted}
                  value={email}
                  onChangeText={setEmail}
                  keyboardType="email-address"
                  autoCapitalize="none"
                  autoCorrect={false}
                />
                <Pressable
                  onPress={handleSubmitEmail}
                  disabled={submitting || !email.trim()}
                  style={({ pressed }) => [
                    styles.emailSubmitBtn,
                    (!email.trim() || submitting) && styles.emailSubmitDisabled,
                    { opacity: pressed ? 0.8 : 1 },
                  ]}
                >
                  <Mail size={18} color={COLORS.bg} strokeWidth={2} />
                </Pressable>
              </View>
            )}
          </View>

          {/* Perks */}
          <View style={styles.perksSection}>
            <Text style={styles.sectionTitle}>Why share ROAM?</Text>
            {[
              { icon: Gift, text: 'Earn free Pro months for every friend who joins' },
              { icon: Users, text: 'Plan group trips together seamlessly' },
              { icon: Heart, text: 'Help your friends travel smarter' },
              { icon: Sparkles, text: 'Get early access to new features' },
            ].map((perk, i) => (
              <View key={i} style={styles.perkRow}>
                <perk.icon size={18} color={COLORS.sage} strokeWidth={2} />
                <Text style={styles.perkText}>{perk.text}</Text>
              </View>
            ))}
          </View>
        </Animated.View>
      </ScrollView>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: COLORS.bg,
  } as ViewStyle,
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: SPACING.md,
    paddingVertical: SPACING.sm,
  } as ViewStyle,
  backBtn: {
    minHeight: 44,
    minWidth: 44,
    alignItems: 'center',
    justifyContent: 'center',
  } as ViewStyle,
  headerTitle: {
    fontFamily: FONTS.header,
    fontSize: 20,
    color: COLORS.cream,
  } as TextStyle,
  headerSpacer: {
    width: 44,
  } as ViewStyle,
  scroll: {
    paddingHorizontal: SPACING.lg,
    paddingBottom: 100,
  } as ViewStyle,
  heroSection: {
    alignItems: 'center',
    marginTop: SPACING.xl,
    marginBottom: SPACING.xl,
  } as ViewStyle,
  emojiRow: {
    flexDirection: 'row',
    gap: SPACING.md,
    marginBottom: SPACING.md,
  } as ViewStyle,
  heroEmoji: {
    fontSize: 36,
  } as TextStyle,
  heroTitle: {
    fontFamily: FONTS.header,
    fontSize: 32,
    color: COLORS.cream,
    textAlign: 'center',
    lineHeight: 38,
  } as TextStyle,
  heroSub: {
    fontFamily: FONTS.body,
    fontSize: 15,
    color: COLORS.creamSoft,
    textAlign: 'center',
    marginTop: SPACING.sm,
    lineHeight: 22,
    maxWidth: 300,
  } as TextStyle,
  statsRow: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: COLORS.bgCard,
    borderRadius: RADIUS.lg,
    borderWidth: 1,
    borderColor: COLORS.border,
    padding: SPACING.lg,
    marginBottom: SPACING.xl,
  } as ViewStyle,
  statCard: {
    flex: 1,
    alignItems: 'center',
  } as ViewStyle,
  statDivider: {
    width: 1,
    height: 40,
    backgroundColor: COLORS.border,
  } as ViewStyle,
  statNumber: {
    fontFamily: FONTS.mono,
    fontSize: 18,
    color: COLORS.gold,
    letterSpacing: 1,
  } as TextStyle,
  statLabel: {
    fontFamily: FONTS.mono,
    fontSize: 11,
    color: COLORS.creamDim,
    marginTop: 4,
    letterSpacing: 0.5,
  } as TextStyle,
  shareSection: {
    marginBottom: SPACING.xl,
  } as ViewStyle,
  sectionTitle: {
    fontFamily: FONTS.header,
    fontStyle: 'italic',
    fontSize: 22,
    color: COLORS.cream,
    marginBottom: SPACING.md,
  } as TextStyle,
  linkPreview: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: COLORS.bgCard,
    borderRadius: RADIUS.md,
    borderWidth: 1,
    borderColor: COLORS.border,
    paddingHorizontal: SPACING.md,
    paddingVertical: SPACING.sm + 2,
    gap: SPACING.sm,
    marginBottom: SPACING.md,
  } as ViewStyle,
  linkText: {
    flex: 1,
    fontFamily: FONTS.mono,
    fontSize: 13,
    color: COLORS.creamSoft,
  } as TextStyle,
  shareCta: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    borderRadius: RADIUS.lg,
    paddingVertical: SPACING.md,
    gap: SPACING.sm,
    minHeight: 52,
  } as ViewStyle,
  shareCtaText: {
    fontFamily: FONTS.bodySemiBold,
    fontSize: 16,
    color: COLORS.bg,
  } as TextStyle,
  quickShareRow: {
    flexDirection: 'row',
    justifyContent: 'center',
    gap: SPACING.xl,
    marginTop: SPACING.lg,
  } as ViewStyle,
  quickShareBtn: {
    alignItems: 'center',
    gap: 6,
  } as ViewStyle,
  quickShareLabel: {
    fontFamily: FONTS.mono,
    fontSize: 11,
    color: COLORS.creamDim,
  } as TextStyle,
  emailSection: {
    marginBottom: SPACING.xl,
  } as ViewStyle,
  emailInputRow: {
    flexDirection: 'row',
    gap: SPACING.sm,
  } as ViewStyle,
  emailInput: {
    flex: 1,
    backgroundColor: COLORS.bgCard,
    borderRadius: RADIUS.md,
    borderWidth: 1,
    borderColor: COLORS.border,
    paddingHorizontal: SPACING.md,
    paddingVertical: SPACING.sm + 2,
    fontFamily: FONTS.body,
    fontSize: 15,
    color: COLORS.cream,
    minHeight: 48,
  } as TextStyle,
  emailSubmitBtn: {
    backgroundColor: COLORS.sage,
    borderRadius: RADIUS.md,
    alignItems: 'center',
    justifyContent: 'center',
    width: 48,
    minHeight: 48,
  } as ViewStyle,
  emailSubmitDisabled: {
    opacity: 0.4,
  } as ViewStyle,
  successCard: {
    alignItems: 'center',
    backgroundColor: COLORS.bgCard,
    borderRadius: RADIUS.lg,
    borderWidth: 1,
    borderColor: COLORS.sageBorder,
    padding: SPACING.xl,
    gap: SPACING.sm,
  } as ViewStyle,
  successTitle: {
    fontFamily: FONTS.header,
    fontSize: 24,
    color: COLORS.cream,
  } as TextStyle,
  successSub: {
    fontFamily: FONTS.mono,
    fontSize: 14,
    color: COLORS.gold,
  } as TextStyle,
  successDetail: {
    fontFamily: FONTS.body,
    fontSize: 14,
    color: COLORS.creamSoft,
    textAlign: 'center',
  } as TextStyle,
  perksSection: {
    marginBottom: SPACING.xl,
  } as ViewStyle,
  perkRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: SPACING.md,
    paddingVertical: SPACING.sm,
  } as ViewStyle,
  perkText: {
    fontFamily: FONTS.body,
    fontSize: 15,
    color: COLORS.creamSoft,
    flex: 1,
  } as TextStyle,
});
