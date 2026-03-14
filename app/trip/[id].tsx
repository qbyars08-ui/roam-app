// =============================================================================
// ROAM — Public Trip Sharing (Unique URLs)
// Fetches shared trip by UUID, renders public view, "Steal this trip" CTA
// =============================================================================
import React, { useCallback, useEffect, useState } from 'react';
import {
  View,
  Text,
  ScrollView,
  Pressable,
  StyleSheet,
  Platform,
  Linking,
  type TextStyle,
  type ViewStyle,
} from 'react-native';
import { useLocalSearchParams, useRouter } from 'expo-router';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import * as Clipboard from 'expo-clipboard';
import * as Haptics from '../../lib/haptics';
import { COLORS, FONTS, SPACING, RADIUS } from '../../lib/constants';
import { SkeletonCard } from '../../components/premium/LoadingStates';
import { getSharedTrip, type SharedTrip } from '../../lib/sharing';
import { parseItinerary } from '../../lib/types/itinerary';
import { useAppStore } from '../../lib/store';

const BASE_URL = 'https://roamappwait.netlify.app';

export default function PublicTripScreen() {
  const { id } = useLocalSearchParams<{ id: string }>();
  const router = useRouter();
  const insets = useSafeAreaInsets();
  const setPlanWizard = useAppStore((s) => s.setPlanWizard);

  const [trip, setTrip] = useState<SharedTrip | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [copied, setCopied] = useState(false);

  useEffect(() => {
    if (!id) {
      // eslint-disable-next-line react-hooks/set-state-in-effect -- sync validation
      setError('Invalid link');
      // eslint-disable-next-line react-hooks/set-state-in-effect -- sync validation
      setLoading(false);
      return;
    }
    getSharedTrip(id)
      .then((t) => {
        // eslint-disable-next-line react-hooks/set-state-in-effect -- async data load
        setTrip(t);
        // eslint-disable-next-line react-hooks/set-state-in-effect -- async data load
        setError(t ? null : 'Trip not found');
      })
      .catch(() => {
        // eslint-disable-next-line react-hooks/set-state-in-effect -- async error handling
        setError('Could not load trip');
      })
      .finally(() => {
        // eslint-disable-next-line react-hooks/set-state-in-effect -- async data load
        setLoading(false);
      });
  }, [id]);

  const shareUrl = id ? `${BASE_URL}/trip/${id}` : '';
  const deepLink = id ? `roam://trip/${id}` : '';

  const handleCopyLink = useCallback(async () => {
    if (!shareUrl) return;
    Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Medium);
    await Clipboard.setStringAsync(shareUrl);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  }, [shareUrl]);

  const handleStealTrip = useCallback(() => {
    if (!trip) return;
    Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Medium);
    setPlanWizard({ destination: trip.destination });
    router.replace('/(tabs)/generate');
  }, [trip, setPlanWizard, router]);

  const handleOpenInApp = useCallback(() => {
    if (!deepLink) return;
    Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Medium);
    Linking.openURL(deepLink).catch(() => {});
  }, [deepLink]);

  if (loading) {
    return (
      <View style={[styles.screen, { paddingTop: insets.top, paddingHorizontal: SPACING.lg }]}>
        <SkeletonCard width="100%" height={200} borderRadius={RADIUS.lg} style={{ marginBottom: SPACING.lg }} />
        <SkeletonCard width="100%" height={120} borderRadius={RADIUS.lg} style={{ marginBottom: SPACING.md }} />
        <SkeletonCard width="100%" height={80} borderRadius={RADIUS.md} />
      </View>
    );
  }

  if (error || !trip) {
    return (
      <View style={[styles.screen, styles.centerContent, { paddingTop: insets.top }]}>
        <Text style={styles.errorText}>{error ?? 'Trip not found'}</Text>
        <Pressable onPress={() => router.back()} style={styles.backBtn}>
          <Text style={styles.backBtnText}>Go back</Text>
        </Pressable>
      </View>
    );
  }

  let parsed: ReturnType<typeof parseItinerary> | null = null;
  try {
    parsed = parseItinerary(trip.itinerary);
  } catch {
    parsed = null;
  }

  return (
    <View style={[styles.screen, { paddingTop: insets.top }]}>
      <ScrollView
        style={styles.scroll}
        contentContainerStyle={[styles.scrollContent, { paddingBottom: insets.bottom + SPACING.xxl }]}
        showsVerticalScrollIndicator={false}
        scrollEventThrottle={16}
      >
        {/* Header with destination */}
        <View style={styles.hero}>
          <View style={styles.heroOverlay} />
          <Text style={styles.brand}>ROAM</Text>
          <Text style={styles.destination}>{trip.destination}</Text>
          <Text style={styles.meta}>{trip.days} days</Text>
        </View>

        {parsed && (
          <View style={styles.card}>
            <Text style={styles.cardTitle}>Itinerary</Text>
            {parsed.days.map((day, i) => (
              <View key={i} style={styles.dayRow}>
                <Text style={styles.dayLabel}>Day {day.day}</Text>
                <Text style={styles.dayTheme}>{day.theme}</Text>
                <Text style={styles.dayActivities}>
                  {day.morning.activity} → {day.afternoon.activity} → {day.evening.activity}
                </Text>
              </View>
            ))}
          </View>
        )}

        {/* Steal this trip */}
        <Pressable
          style={({ pressed }) => [styles.stealBtn, { opacity: pressed ? 0.9 : 1 }]}
          onPress={handleStealTrip}
        >
          <Text style={styles.stealBtnText}>Steal this trip</Text>
          <Text style={styles.stealBtnSub}>Plan your own version in ROAM</Text>
        </Pressable>

        {/* Copy link */}
        <Pressable
          style={({ pressed }) => [styles.copyBtn, { opacity: pressed ? 0.9 : 1 }]}
          onPress={handleCopyLink}
        >
          <Text style={styles.copyBtnText}>
            {copied ? 'Copied to clipboard' : 'Copy link'}
          </Text>
        </Pressable>

        {Platform.OS !== 'web' && (
          <Pressable
            style={({ pressed }) => [styles.openAppBtn, { opacity: pressed ? 0.9 : 1 }]}
            onPress={handleOpenInApp}
          >
            <Text style={styles.openAppBtnText}>Open in ROAM app</Text>
          </Pressable>
        )}

        <Text style={styles.footer}>Shared with ROAM</Text>
      </ScrollView>
    </View>
  );
}

const styles = StyleSheet.create({
  screen: {
    flex: 1,
    backgroundColor: COLORS.bg,
  } as ViewStyle,
  centerContent: {
    justifyContent: 'center',
    alignItems: 'center',
  } as ViewStyle,
  scroll: { flex: 1 } as ViewStyle,
  scrollContent: {
    paddingHorizontal: SPACING.lg,
  } as ViewStyle,
  loadingText: {
    fontFamily: FONTS.body,
    fontSize: 14,
    color: COLORS.creamMuted,
    marginTop: SPACING.md,
  } as TextStyle,
  errorText: {
    fontFamily: FONTS.body,
    fontSize: 16,
    color: COLORS.coral,
    textAlign: 'center',
  } as TextStyle,
  backBtn: {
    marginTop: SPACING.lg,
    padding: SPACING.md,
  } as ViewStyle,
  backBtnText: {
    fontFamily: FONTS.bodySemiBold,
    fontSize: 16,
    color: COLORS.sage,
  } as TextStyle,
  hero: {
    height: 200,
    justifyContent: 'flex-end',
    padding: SPACING.lg,
    marginBottom: SPACING.lg,
    backgroundColor: COLORS.bgCard,
    borderRadius: RADIUS.lg,
    borderWidth: 1,
    borderColor: COLORS.border,
  } as ViewStyle,
  heroOverlay: {
    ...StyleSheet.absoluteFillObject,
    backgroundColor: COLORS.overlaySoft,
    borderRadius: RADIUS.lg,
  } as ViewStyle,
  brand: {
    fontFamily: FONTS.header,
    fontSize: 14,
    color: COLORS.gold,
    letterSpacing: 4,
  } as TextStyle,
  destination: {
    fontFamily: FONTS.header,
    fontSize: 36,
    color: COLORS.cream,
    marginTop: SPACING.xs,
  } as TextStyle,
  meta: {
    fontFamily: FONTS.body,
    fontSize: 14,
    color: COLORS.creamMuted,
    marginTop: 4,
  } as TextStyle,
  card: {
    backgroundColor: COLORS.bgCard,
    borderRadius: RADIUS.lg,
    borderWidth: 1,
    borderColor: COLORS.border,
    padding: SPACING.lg,
    marginBottom: SPACING.lg,
  } as ViewStyle,
  cardTitle: {
    fontFamily: FONTS.bodySemiBold,
    fontSize: 16,
    color: COLORS.cream,
    marginBottom: SPACING.md,
  } as TextStyle,
  dayRow: {
    marginBottom: SPACING.md,
  } as ViewStyle,
  dayLabel: {
    fontFamily: FONTS.mono,
    fontSize: 11,
    color: COLORS.sage,
    letterSpacing: 1,
  } as TextStyle,
  dayTheme: {
    fontFamily: FONTS.bodyMedium,
    fontSize: 14,
    color: COLORS.cream,
  } as TextStyle,
  dayActivities: {
    fontFamily: FONTS.body,
    fontSize: 12,
    color: COLORS.creamMuted,
    lineHeight: 18,
  } as TextStyle,
  stealBtn: {
    backgroundColor: COLORS.sage,
    borderRadius: RADIUS.lg,
    padding: SPACING.lg,
    alignItems: 'center',
    marginBottom: SPACING.md,
  } as ViewStyle,
  stealBtnText: {
    fontFamily: FONTS.bodySemiBold,
    fontSize: 18,
    color: COLORS.bg,
  } as TextStyle,
  stealBtnSub: {
    fontFamily: FONTS.body,
    fontSize: 12,
    color: COLORS.bg,
    opacity: 0.8,
    marginTop: 4,
  } as TextStyle,
  copyBtn: {
    backgroundColor: COLORS.bgCard,
    borderRadius: RADIUS.md,
    padding: SPACING.md,
    alignItems: 'center',
    marginBottom: SPACING.sm,
    borderWidth: 1,
    borderColor: COLORS.border,
  } as ViewStyle,
  copyBtnText: {
    fontFamily: FONTS.body,
    fontSize: 14,
    color: COLORS.cream,
  } as TextStyle,
  openAppBtn: {
    padding: SPACING.md,
    alignItems: 'center',
    marginBottom: SPACING.md,
  } as ViewStyle,
  openAppBtnText: {
    fontFamily: FONTS.body,
    fontSize: 14,
    color: COLORS.sage,
  } as TextStyle,
  footer: {
    fontFamily: FONTS.mono,
    fontSize: 10,
    color: COLORS.creamMuted,
    textAlign: 'center',
    marginTop: SPACING.lg,
  } as TextStyle,
});
