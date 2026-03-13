// =============================================================================
// ROAM — Pre-Trip Hype Mode
// Countdown screen with daily destination intel
// =============================================================================
import React, { useCallback, useEffect, useState } from 'react';
import {
  Alert,
  Platform,
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
import { useRouter, useLocalSearchParams } from 'expo-router';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { LinearGradient } from 'expo-linear-gradient';
import * as Haptics from '../lib/haptics';
import { COLORS, FONTS, SPACING, RADIUS } from '../lib/constants';
import { X, Rocket, Share2 } from 'lucide-react-native';
import {
  setHypeTrip,
  getHypeTrips,
  getDaysUntil,
  getHypeContent,
  type HypeTrip,
} from '../lib/hype';
import { scheduleTripCountdown } from '../lib/notifications';
import { withComingSoon } from '../lib/with-coming-soon';

// ---------------------------------------------------------------------------
// Hype Screen
// ---------------------------------------------------------------------------
function HypeScreen() {
  const router = useRouter();
  const insets = useSafeAreaInsets();
  const params = useLocalSearchParams<{ tripId?: string; destination?: string }>();

  const [hypeTrip, setHypeTripState] = useState<HypeTrip | null>(null);
  const [dateInput, setDateInput] = useState('');
  const [showDateInput, setShowDateInput] = useState(false);
  const [loading, setLoading] = useState(true);

  // Load existing hype trip on mount
  useEffect(() => {
    const load = async () => {
      const trips = await getHypeTrips();
      const match = trips.find((t) => t.tripId === params.tripId);
      if (match) {
        setHypeTripState(match);
      }
      setLoading(false);
    };
    load();
  }, [params.tripId]);

  const daysUntil = hypeTrip ? getDaysUntil(hypeTrip.departureDate) : 0;
  const hypeContent = hypeTrip
    ? getHypeContent(hypeTrip.destination, daysUntil)
    : null;

  // Calculate progress: percentage of time elapsed since hype was set
  const progress = (() => {
    if (!hypeTrip) return 0;
    const created = new Date(hypeTrip.createdAt).getTime();
    const departure = new Date(hypeTrip.departureDate).getTime();
    const now = Date.now();
    const totalSpan = departure - created;
    if (totalSpan <= 0) return 1;
    const elapsed = now - created;
    return Math.min(1, Math.max(0, elapsed / totalSpan));
  })();

  const handleSetDate = useCallback(async () => {
    const trimmed = dateInput.trim();

    // Validate YYYY-MM-DD format
    if (!/^\d{4}-\d{2}-\d{2}$/.test(trimmed)) {
      Alert.alert('Invalid format', 'Please enter a date as YYYY-MM-DD');
      return;
    }

    const parsed = new Date(trimmed);
    if (isNaN(parsed.getTime())) {
      Alert.alert('Invalid date', 'That date does not appear to be valid');
      return;
    }

    const tripId = params.tripId ?? `hype-${Date.now()}`;
    const destination = params.destination ?? 'your destination';

    await setHypeTrip(tripId, destination, trimmed);
    await scheduleTripCountdown(tripId, destination, trimmed);
    Haptics.notificationAsync(Haptics.NotificationFeedbackType.Success);

    // Reload
    const trips = await getHypeTrips();
    const match = trips.find((t) => t.tripId === tripId);
    if (match) {
      setHypeTripState(match);
    }
    setShowDateInput(false);
    setDateInput('');
  }, [dateInput, params.tripId, params.destination]);

  const handleShare = useCallback(async () => {
    if (!hypeTrip) return;
    Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);

    await Share.share({
      message: `I'm going to ${hypeTrip.destination} in ${daysUntil} day${daysUntil === 1 ? '' : 's'}! Countdown powered by ROAM`,
    });
  }, [hypeTrip, daysUntil]);

  if (loading) {
    return (
      <View style={[styles.container, { paddingTop: insets.top }]}>
        <View style={styles.loadingContainer}>
          <Text style={styles.loadingText}>Getting hyped...</Text>
        </View>
      </View>
    );
  }

  const destination = hypeTrip?.destination ?? params.destination ?? 'Your Trip';
  const hasHypeTrip = !!hypeTrip;

  return (
    <View style={[styles.container, { paddingTop: insets.top }]}>
      {/* Close button */}
      <View style={styles.headerRow}>
        <View style={styles.headerSpacer} />
        <Pressable
          onPress={() => router.back()}
          hitSlop={12}
          style={({ pressed }) => [
            styles.closeBtn,
            { opacity: pressed ? 0.6 : 1 },
          ]}
        >
          <X size={18} color={COLORS.cream} strokeWidth={2} />
        </Pressable>
      </View>

      <ScrollView
        contentContainerStyle={styles.scrollContent}
        showsVerticalScrollIndicator={false}
      >
        {/* Countdown number */}
        {hasHypeTrip ? (
          <>
            <View style={styles.countdownContainer}>
              <LinearGradient
                colors={[COLORS.goldHighlight, COLORS.goldVeryFaint]}
                style={styles.countdownGlow}
              >
                <Text style={styles.countdownNumber}>
                  {daysUntil}
                </Text>
                <Text style={styles.countdownLabel}>
                  {daysUntil === 1 ? 'day' : 'days'} until{' '}
                  <Text style={styles.countdownDestination}>
                    {destination}
                  </Text>
                </Text>
              </LinearGradient>
            </View>

            {/* Progress bar */}
            <View style={styles.progressSection}>
              <View style={styles.progressLabelRow}>
                <Text style={styles.progressLabel}>TRIP PROGRESS</Text>
                <Text style={styles.progressPercent}>
                  {Math.round(progress * 100)}%
                </Text>
              </View>
              <View style={styles.progressBar}>
                <LinearGradient
                  colors={[COLORS.gold, COLORS.goldBright]}
                  start={{ x: 0, y: 0 }}
                  end={{ x: 1, y: 0 }}
                  style={[
                    styles.progressFill,
                    { width: `${Math.round(progress * 100)}%` } as ViewStyle,
                  ]}
                />
              </View>
            </View>

            {/* Daily hype card */}
            {hypeContent && (
              <View style={styles.hypeCard}>
                <LinearGradient
                  colors={[COLORS.goldMutedLight, COLORS.sageSubtle]}
                  style={styles.hypeCardGradient}
                >
                  {null}
                  <Text style={styles.hypeTitle}>{hypeContent.title}</Text>
                  <Text style={styles.hypeTip}>{hypeContent.tip}</Text>
                </LinearGradient>
              </View>
            )}

            {/* Action buttons */}
            <View style={styles.actionsContainer}>
              {/* Share button */}
              <Pressable
                onPress={handleShare}
                style={({ pressed }) => [
                  styles.shareButton,
                  { transform: [{ scale: pressed ? 0.95 : 1 }] },
                ]}
              >
                <LinearGradient
                  colors={[COLORS.sage, COLORS.sageDark]}
                  style={styles.shareGradient}
                >
                  <View style={styles.shareBtnInner}>
                    <Share2 size={16} color={COLORS.bg} strokeWidth={2} />
                    <Text style={styles.shareButtonText}>Share countdown</Text>
                  </View>
                </LinearGradient>
              </Pressable>

              {/* Change date */}
              <Pressable
                onPress={() => setShowDateInput(true)}
                style={styles.changeDateBtn}
              >
                <Text style={styles.changeDateText}>Change departure date</Text>
              </Pressable>
            </View>
          </>
        ) : (
          /* No hype trip set yet — show setup state */
          <View style={styles.setupContainer}>
            <Rocket size={48} color={COLORS.gold} strokeWidth={1.5} style={{ marginBottom: SPACING.md }} />
            <Text style={styles.setupTitle}>
              Set your departure date
            </Text>
            <Text style={styles.setupSubtitle}>
              Start the countdown to {destination}
            </Text>
          </View>
        )}

        {/* Date input section */}
        {(showDateInput || !hasHypeTrip) && (
          <View style={styles.dateInputSection}>
            <Text style={styles.dateInputLabel}>DEPARTURE DATE</Text>
            <TextInput
              style={styles.dateInput}
              placeholder="YYYY-MM-DD"
              placeholderTextColor={COLORS.creamMuted}
              value={dateInput}
              onChangeText={setDateInput}
              keyboardType={Platform.OS === 'ios' ? 'numbers-and-punctuation' : 'default'}
              maxLength={10}
              autoFocus={!hasHypeTrip}
            />
            <Pressable
              onPress={handleSetDate}
              style={({ pressed }) => [
                styles.setDateButton,
                { transform: [{ scale: pressed ? 0.95 : 1 }] },
              ]}
            >
              <LinearGradient
                colors={[COLORS.gold, COLORS.goldDark2]}
                style={styles.setDateGradient}
              >
                <Text style={styles.setDateText}>
                  {hasHypeTrip ? 'Update date' : 'Start countdown'}
                </Text>
              </LinearGradient>
            </Pressable>
            {showDateInput && (
              <Pressable
                onPress={() => setShowDateInput(false)}
                style={styles.cancelBtn}
              >
                <Text style={styles.cancelText}>Cancel</Text>
              </Pressable>
            )}
          </View>
        )}
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
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingHorizontal: SPACING.md,
    paddingVertical: SPACING.sm,
  } as ViewStyle,
  headerSpacer: {
    width: 36,
  } as ViewStyle,
  closeBtn: {
    width: 36,
    height: 36,
    borderRadius: RADIUS.full,
    backgroundColor: COLORS.bgGlass,
    alignItems: 'center',
    justifyContent: 'center',
  } as ViewStyle,
  scrollContent: {
    paddingHorizontal: SPACING.lg,
    paddingBottom: SPACING.xxxl,
  } as ViewStyle,
  loadingContainer: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
  } as ViewStyle,
  loadingText: {
    fontFamily: FONTS.body,
    fontSize: 16,
    color: COLORS.creamMuted,
  } as TextStyle,

  // Countdown
  countdownContainer: {
    alignItems: 'center',
    marginTop: SPACING.xl,
  } as ViewStyle,
  countdownGlow: {
    alignItems: 'center',
    paddingVertical: SPACING.xxl,
    paddingHorizontal: SPACING.xl,
    borderRadius: RADIUS.xl,
    width: '100%',
  } as ViewStyle,
  countdownNumber: {
    fontFamily: FONTS.header,
    fontSize: 80,
    color: COLORS.gold,
    lineHeight: 88,
  } as TextStyle,
  countdownLabel: {
    fontFamily: FONTS.body,
    fontSize: 16,
    color: COLORS.creamMuted,
    marginTop: SPACING.xs,
  } as TextStyle,
  countdownDestination: {
    fontFamily: FONTS.headerMedium,
    fontSize: 18,
    color: COLORS.cream,
  } as TextStyle,

  // Progress
  progressSection: {
    marginTop: SPACING.xl,
    gap: SPACING.sm,
  } as ViewStyle,
  progressLabelRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
  } as ViewStyle,
  progressLabel: {
    fontFamily: FONTS.mono,
    fontSize: 10,
    color: COLORS.sage,
    letterSpacing: 1.5,
  } as TextStyle,
  progressPercent: {
    fontFamily: FONTS.monoMedium,
    fontSize: 12,
    color: COLORS.gold,
    letterSpacing: 0.5,
  } as TextStyle,
  progressBar: {
    height: 6,
    backgroundColor: COLORS.bgCard,
    borderRadius: 3,
    overflow: 'hidden',
  } as ViewStyle,
  progressFill: {
    height: '100%',
    borderRadius: 3,
  } as ViewStyle,

  // Hype card
  hypeCard: {
    marginTop: SPACING.xl,
    borderRadius: RADIUS.lg,
    borderWidth: 1,
    borderColor: COLORS.border,
    overflow: 'hidden',
  } as ViewStyle,
  hypeCardGradient: {
    padding: SPACING.lg,
    alignItems: 'center',
    gap: SPACING.sm,
  } as ViewStyle,
  hypeEmoji: {
    fontSize: 40,
  } as TextStyle,
  hypeTitle: {
    fontFamily: FONTS.header,
    fontSize: 22,
    color: COLORS.cream,
    textAlign: 'center',
  } as TextStyle,
  hypeTip: {
    fontFamily: FONTS.body,
    fontSize: 15,
    color: COLORS.creamMuted,
    textAlign: 'center',
    lineHeight: 22,
  } as TextStyle,

  // Actions
  actionsContainer: {
    marginTop: SPACING.xl,
    gap: SPACING.md,
    alignItems: 'center',
  } as ViewStyle,
  shareButton: {
    width: '100%',
    borderRadius: RADIUS.lg,
    overflow: 'hidden',
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
  changeDateBtn: {
    paddingVertical: SPACING.sm,
  } as ViewStyle,
  changeDateText: {
    fontFamily: FONTS.bodyMedium,
    fontSize: 14,
    color: COLORS.creamMuted,
    textDecorationLine: 'underline',
  } as TextStyle,

  // Setup (no hype trip yet)
  setupContainer: {
    alignItems: 'center',
    marginTop: SPACING.xxxl,
    gap: SPACING.sm,
  } as ViewStyle,
  setupTitle: {
    fontFamily: FONTS.header,
    fontSize: 28,
    color: COLORS.cream,
    textAlign: 'center',
  } as TextStyle,
  setupSubtitle: {
    fontFamily: FONTS.body,
    fontSize: 15,
    color: COLORS.creamMuted,
    textAlign: 'center',
  } as TextStyle,

  // Date input
  dateInputSection: {
    marginTop: SPACING.xl,
    gap: SPACING.md,
    alignItems: 'center',
  } as ViewStyle,
  dateInputLabel: {
    fontFamily: FONTS.mono,
    fontSize: 10,
    color: COLORS.sage,
    letterSpacing: 1.5,
    alignSelf: 'flex-start',
  } as TextStyle,
  dateInput: {
    width: '100%',
    backgroundColor: COLORS.bgGlass,
    borderRadius: RADIUS.md,
    borderWidth: 1,
    borderColor: COLORS.border,
    paddingHorizontal: SPACING.md,
    paddingVertical: SPACING.md,
    fontFamily: FONTS.mono,
    fontSize: 18,
    color: COLORS.cream,
    textAlign: 'center',
    letterSpacing: 2,
  } as TextStyle,
  setDateButton: {
    width: '100%',
    borderRadius: RADIUS.lg,
    overflow: 'hidden',
  } as ViewStyle,
  setDateGradient: {
    paddingVertical: SPACING.md + 2,
    alignItems: 'center',
    borderRadius: RADIUS.lg,
  } as ViewStyle,
  setDateText: {
    fontFamily: FONTS.bodySemiBold,
    fontSize: 16,
    color: COLORS.bg,
  } as TextStyle,
  cancelBtn: {
    paddingVertical: SPACING.sm,
  } as ViewStyle,
  cancelText: {
    fontFamily: FONTS.bodyMedium,
    fontSize: 14,
    color: COLORS.creamMuted,
    textDecorationLine: 'underline',
  } as TextStyle,
});

export default withComingSoon(HypeScreen, { routeName: 'hype', title: 'Hype' });
