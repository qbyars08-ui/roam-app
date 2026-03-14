// =============================================================================
// ROAM — Waitlist capture modal (web guest flow)
// "Save this trip and get early access" → email → waitlist → referral link
// =============================================================================
import React, { useState, useEffect } from 'react';
import {
  Modal,
  Pressable,
  ScrollView,
  StyleSheet,
  Text,
  TextInput,
  View,
  Platform,
  Share as RNShare,
  type ViewStyle,
  type TextStyle,
} from 'react-native';
import * as Clipboard from 'expo-clipboard';
import { Check } from 'lucide-react-native';
import { COLORS, FONTS, SPACING, RADIUS } from '../../lib/constants';
import { joinWaitlist, getGuestReferralUrl, getEmailFromUrl, getStoredRef, type WaitlistResult } from '../../lib/waitlist-guest';
interface WaitlistCaptureModalProps {
  visible: boolean;
  /** Optional — used in share message and CTA; when empty, "trips" / "Go back" */
  destination?: string;
  onViewTrip: () => void;
  /** Optional — skip/secondary CTA text (default: "View my trip first") */
  skipLabel?: string;
}

export default function WaitlistCaptureModal({
  visible,
  destination = '',
  onViewTrip,
  skipLabel = 'View my trip first',
}: WaitlistCaptureModalProps) {
  const [email, setEmail] = useState('');
  const [loading, setLoading] = useState(false);
  const [wasReferred, setWasReferred] = useState(false);

  useEffect(() => {
    const prefill = getEmailFromUrl();
    if (prefill?.trim()) setEmail(prefill.trim());
    getStoredRef().then((ref) => setWasReferred(!!ref));
  }, []);
  const [error, setError] = useState<string | null>(null);
  const [result, setResult] = useState<WaitlistResult | null>(null);

  const handleSubmit = async () => {
    const trimmed = email.trim();
    if (!trimmed) {
      setError('Enter your email');
      return;
    }
    setError(null);
    setLoading(true);
    try {
      const r = await joinWaitlist(trimmed);
      setResult(r);
    } catch (e: unknown) {
      setError(e instanceof Error ? e.message : 'Something went wrong. Try again.');
    } finally {
      setLoading(false);
    }
  };

  const referralUrl = result ? getGuestReferralUrl(result.referralCode) : '';
  const destLabel = destination.trim() || 'trips';
  const shareMessage = `I just got a ${destLabel} itinerary from ROAM — an AI that plans your whole trip in 30 seconds. Try it: ${referralUrl}`;

  const handleCopy = async () => {
    if (referralUrl) {
      await Clipboard.setStringAsync(referralUrl);
    }
  };

  const handleShare = async () => {
    if (Platform.OS === 'web') {
      if (typeof navigator !== 'undefined' && navigator.share) {
        try {
          await navigator.share({
            title: 'ROAM — AI Travel Planner',
            text: shareMessage,
            url: referralUrl,
          });
        } catch {
          handleCopy();
        }
      } else {
        handleCopy();
      }
    } else if (RNShare?.share) {
      await RNShare.share({ message: shareMessage, url: referralUrl, title: 'Join ROAM' });
    } else {
      handleCopy();
    }
  };

  if (!visible) return null;

  return (
    <Modal visible transparent animationType="fade">
      <View style={styles.overlay}>
        <View style={styles.card}>
          <ScrollView
            showsVerticalScrollIndicator={false}
            contentContainerStyle={styles.scrollContent}
          >
            {!result ? (
              <>
                <Text style={styles.title}>Save this trip and get early access</Text>
                {wasReferred && (
                  <Text style={styles.referredBanner}>
                    A friend invited you — you both get 1 extra free trip when you share
                  </Text>
                )}
                <Text style={styles.sub}>
                  Join the waitlist — we'll give you a referral link to share. 3 friends = 1 month Pro free.
                </Text>
                <TextInput
                  style={styles.input}
                  placeholder="your@email.com"
                  placeholderTextColor={COLORS.creamMuted}
                  value={email}
                  onChangeText={(t) => { setEmail(t); setError(null); }}
                  keyboardType="email-address"
                  autoCapitalize="none"
                  autoCorrect={false}
                  editable={!loading}
                />
                {error && <Text style={styles.errorText}>{error}</Text>}
                <Pressable
                  onPress={handleSubmit}
                  disabled={loading}
                  style={({ pressed }) => [
                    styles.submitBtn,
                    { opacity: pressed || loading ? 0.85 : 1 },
                  ]}
                >
                  <Text style={styles.submitText}>{loading ? 'Joining...' : 'Join waitlist'}</Text>
                </Pressable>
                <Pressable onPress={onViewTrip} style={styles.skipBtn}>
                  <Text style={styles.skipText}>{skipLabel}</Text>
                </Pressable>
              </>
            ) : (
              <>
                <View style={styles.checkWrap}>
                  <Check size={28} color={COLORS.sage} strokeWidth={2.5} />
                </View>
                <Text style={styles.successTitle}>You're #{result.position} on the waitlist</Text>
                <Text style={styles.successSub}>Share your link to move up — 3 friends = 1 month Pro free</Text>

                <View style={[styles.shareCard, { borderColor: COLORS.border }]}>
                  <Text style={styles.shareLabel}>Your referral link</Text>
                  <Text style={styles.shareUrl} numberOfLines={2} selectable>{referralUrl}</Text>
                  <View style={styles.shareRow}>
                    <Pressable
                      onPress={handleCopy}
                      style={({ pressed }) => [styles.shareBtn, styles.copyBtn, { opacity: pressed ? 0.85 : 1 }]}
                    >
                      <Text style={styles.shareBtnText}>Copy</Text>
                    </Pressable>
                    <Pressable
                      onPress={handleShare}
                      style={({ pressed }) => [styles.shareBtn, styles.shareBtnPrimary, { opacity: pressed ? 0.85 : 1 }]}
                    >
                      <Text style={[styles.shareBtnText, { color: COLORS.bg }]}>Share</Text>
                    </Pressable>
                  </View>
                </View>

                <Text style={styles.ctaText}>Share this with 3 friends → unlock Pro free for 1 month</Text>

                <Pressable
                  onPress={onViewTrip}
                  style={({ pressed }) => [styles.viewTripBtn, { opacity: pressed ? 0.9 : 1 }]}
                >
                  <Text style={styles.viewTripText}>
                    {destination.trim() ? `View my ${destination} trip` : 'Go back'}
                  </Text>
                </Pressable>
              </>
            )}
          </ScrollView>
        </View>
      </View>
    </Modal>
  );
}

const styles = StyleSheet.create({
  overlay: {
    flex: 1,
    backgroundColor: COLORS.overlayDark,
    justifyContent: 'center',
    alignItems: 'center',
    padding: SPACING.lg,
  } as ViewStyle,
  card: {
    backgroundColor: COLORS.bgCard,
    borderRadius: RADIUS.xl,
    borderWidth: 1,
    borderColor: COLORS.border,
    maxWidth: 400,
    width: '100%',
    maxHeight: '85%',
  } as ViewStyle,
  scrollContent: {
    padding: SPACING.xl,
  } as ViewStyle,
  title: {
    fontFamily: FONTS.header,
    fontSize: 24,
    color: COLORS.cream,
    textAlign: 'center',
    marginBottom: SPACING.sm,
  } as TextStyle,
  referredBanner: {
    fontFamily: FONTS.bodySemiBold,
    fontSize: 14,
    color: COLORS.sage,
    textAlign: 'center',
    marginBottom: SPACING.sm,
    paddingHorizontal: SPACING.sm,
  } as TextStyle,
  sub: {
    fontFamily: FONTS.body,
    fontSize: 14,
    color: COLORS.creamMuted,
    textAlign: 'center',
    marginBottom: SPACING.lg,
    lineHeight: 22,
  } as TextStyle,
  input: {
    fontFamily: FONTS.body,
    fontSize: 16,
    color: COLORS.cream,
    backgroundColor: COLORS.bg,
    borderWidth: 1,
    borderColor: COLORS.border,
    borderRadius: RADIUS.lg,
    paddingHorizontal: SPACING.md,
    paddingVertical: 14,
    marginBottom: SPACING.sm,
  } as TextStyle,
  errorText: {
    fontFamily: FONTS.body,
    fontSize: 13,
    color: COLORS.coral,
    marginBottom: SPACING.sm,
  } as TextStyle,
  submitBtn: {
    backgroundColor: COLORS.gold,
    paddingVertical: 14,
    borderRadius: RADIUS.lg,
    alignItems: 'center',
    marginBottom: SPACING.sm,
  } as ViewStyle,
  submitText: {
    fontFamily: FONTS.bodySemiBold,
    fontSize: 16,
    color: COLORS.bg,
  } as TextStyle,
  skipBtn: {
    alignItems: 'center',
    paddingVertical: SPACING.sm,
  } as ViewStyle,
  skipText: {
    fontFamily: FONTS.body,
    fontSize: 14,
    color: COLORS.sage,
  } as TextStyle,
  checkWrap: {
    width: 56,
    height: 56,
    borderRadius: 28,
    backgroundColor: COLORS.sageLight,
    borderWidth: 2,
    borderColor: COLORS.sage,
    alignSelf: 'center',
    alignItems: 'center',
    justifyContent: 'center',
    marginBottom: SPACING.md,
  } as ViewStyle,
  successTitle: {
    fontFamily: FONTS.header,
    fontSize: 22,
    color: COLORS.cream,
    textAlign: 'center',
    marginBottom: SPACING.xs,
  } as TextStyle,
  successSub: {
    fontFamily: FONTS.body,
    fontSize: 14,
    color: COLORS.creamMuted,
    textAlign: 'center',
    marginBottom: SPACING.lg,
    lineHeight: 22,
  } as TextStyle,
  shareCard: {
    backgroundColor: COLORS.bg,
    borderRadius: RADIUS.lg,
    borderWidth: 1,
    padding: SPACING.md,
    marginBottom: SPACING.md,
  } as ViewStyle,
  shareLabel: {
    fontFamily: FONTS.mono,
    fontSize: 11,
    color: COLORS.creamMuted,
    letterSpacing: 1,
    marginBottom: SPACING.xs,
  } as TextStyle,
  shareUrl: {
    fontFamily: FONTS.mono,
    fontSize: 12,
    color: COLORS.cream,
    marginBottom: SPACING.sm,
  } as TextStyle,
  shareRow: {
    flexDirection: 'row',
    gap: SPACING.sm,
  } as ViewStyle,
  shareBtn: {
    flex: 1,
    paddingVertical: 10,
    borderRadius: RADIUS.md,
    alignItems: 'center',
  } as ViewStyle,
  copyBtn: {
    backgroundColor: COLORS.bgCard,
    borderWidth: 1,
    borderColor: COLORS.border,
  } as ViewStyle,
  shareBtnPrimary: {
    backgroundColor: COLORS.sage,
  } as ViewStyle,
  shareBtnText: {
    fontFamily: FONTS.bodySemiBold,
    fontSize: 14,
    color: COLORS.cream,
  } as TextStyle,
  ctaText: {
    fontFamily: FONTS.body,
    fontSize: 13,
    color: COLORS.sage,
    textAlign: 'center',
    marginBottom: SPACING.lg,
  } as TextStyle,
  viewTripBtn: {
    backgroundColor: COLORS.gold,
    paddingVertical: 14,
    borderRadius: RADIUS.lg,
    alignItems: 'center',
  } as ViewStyle,
  viewTripText: {
    fontFamily: FONTS.bodySemiBold,
    fontSize: 16,
    color: COLORS.bg,
  } as TextStyle,
});
