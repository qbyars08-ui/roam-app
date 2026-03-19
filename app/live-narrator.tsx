// =============================================================================
// ROAM — Live Narrator
// Full-screen immersive narration experience. Meditation meets travel.
// The narration text IS the UI.
// =============================================================================

import React, { useCallback, useEffect, useMemo, useRef, useState } from 'react';
import {
  Animated,
  Easing,
  Linking,
  Pressable,
  ScrollView,
  StyleSheet,
  Text,
  TextInput,
  View,
  type TextStyle,
  type ViewStyle,
} from 'react-native';
import { LinearGradient } from 'expo-linear-gradient';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { useRouter } from 'expo-router';
import { useTranslation } from 'react-i18next';
import {
  ChevronLeft,
  Headphones,
  Pause,
  Play,
  RefreshCw,
  Send,
} from 'lucide-react-native';
import { COLORS, FONTS, RADIUS, SPACING } from '../lib/constants';
import { useAppStore, type Trip } from '../lib/store';
import * as Haptics from '../lib/haptics';
import { getCurrentWeather, type CurrentWeather } from '../lib/apis/openweather';
import { getTimeOfDay, type TimeOfDay } from '../lib/here-now-context';
import { parseItinerary, type Itinerary } from '../lib/types/itinerary';
import { getDestinationCoords } from '../lib/air-quality';
import {
  getNarrationForMoment,
  type NarrationResult,
} from '../lib/live-narration';
import { narrateText, stopNarration } from '../lib/elevenlabs';
import { fetchSonarResult } from '../lib/sonar';

// ---------------------------------------------------------------------------
// Time-of-day gradient presets
// ---------------------------------------------------------------------------

const TIME_GRADIENTS: Record<TimeOfDay, readonly [string, string, string]> = {
  morning: ['rgba(201,168,76,0.03)', '#0A0A0A', '#0A0A0A'],
  afternoon: ['#0A0A0A', '#0A0A0A', '#0A0A0A'],
  evening: ['rgba(91,158,111,0.03)', '#0A0A0A', '#0A0A0A'],
  latenight: ['#050505', '#0A0A0A', '#0A0A0A'],
};

// ---------------------------------------------------------------------------
// Waveform bar animation component
// ---------------------------------------------------------------------------

function WaveformBars({ active }: { active: boolean }) {
  const bars = useRef(
    Array.from({ length: 5 }, () => new Animated.Value(0.3)),
  ).current;

  useEffect(() => {
    if (!active) {
      bars.forEach((b) => b.setValue(0.3));
      return;
    }

    const animations = bars.map((bar, i) =>
      Animated.loop(
        Animated.sequence([
          Animated.timing(bar, {
            toValue: 0.4 + Math.random() * 0.6,
            duration: 300 + i * 80,
            easing: Easing.inOut(Easing.ease),
            useNativeDriver: true,
          }),
          Animated.timing(bar, {
            toValue: 0.2 + Math.random() * 0.3,
            duration: 250 + i * 60,
            easing: Easing.inOut(Easing.ease),
            useNativeDriver: true,
          }),
        ]),
      ),
    );

    animations.forEach((a) => a.start());

    return () => {
      animations.forEach((a) => a.stop());
    };
  }, [active, bars]);

  return (
    <View style={waveStyles.container}>
      {bars.map((bar, i) => (
        <Animated.View
          key={i}
          style={[
            waveStyles.bar,
            { transform: [{ scaleY: bar }] },
          ]}
        />
      ))}
    </View>
  );
}

const waveStyles = StyleSheet.create({
  container: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 3,
    height: 24,
  } satisfies ViewStyle,
  bar: {
    width: 3,
    height: 24,
    borderRadius: 2,
    backgroundColor: COLORS.sage,
  } satisfies ViewStyle,
});

// ---------------------------------------------------------------------------
// Word-by-word fade-in text
// ---------------------------------------------------------------------------

function FadeInText({
  text,
  onVenueTap,
}: {
  text: string;
  onVenueTap: (venue: string) => void;
}) {
  const words = useMemo(() => text.split(/\s+/), [text]);
  const opacities = useRef<Animated.Value[]>([]);

  // Reset opacities when text changes
  useEffect(() => {
    opacities.current = words.map(() => new Animated.Value(0));
    const anims = opacities.current.map((opacity, i) =>
      Animated.timing(opacity, {
        toValue: 1,
        duration: 120,
        delay: i * 35,
        useNativeDriver: true,
        easing: Easing.out(Easing.ease),
      }),
    );
    Animated.stagger(15, anims).start();
  }, [text, words]);

  // Simple heuristic: capitalize multi-word proper nouns or known patterns
  const isVenueLike = useCallback((word: string): boolean => {
    if (word.length < 3) return false;
    // Words that start with uppercase in the middle of a sentence
    const cleaned = word.replace(/[.,!?;:'"]/g, '');
    return (
      cleaned.length > 2 &&
      cleaned[0] === cleaned[0].toUpperCase() &&
      cleaned[0] !== cleaned[0].toLowerCase() &&
      // Exclude common sentence starters
      !['The', 'This', 'That', 'Here', 'There', 'Just', 'But', 'And', 'For', 'Its', 'Your', 'You', "It's", 'When', 'Head', 'Walk', 'Try', 'Get', 'Take', 'Make', 'Keep', 'Ask', 'Look', 'Turn', 'Go', 'Stop', 'Find', 'Grab'].includes(cleaned)
    );
  }, []);

  return (
    <Text style={fadeStyles.container}>
      {words.map((word, i) => {
        const opacity = opacities.current[i] ?? new Animated.Value(1);
        const isVenue = isVenueLike(word);

        if (isVenue) {
          return (
            <Animated.Text key={`${word}-${i}`} style={{ opacity }}>
              <Text
                style={fadeStyles.venueWord}
                onPress={() => {
                  Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
                  onVenueTap(word.replace(/[.,!?;:'"]/g, ''));
                }}
              >
                {word}{' '}
              </Text>
            </Animated.Text>
          );
        }

        return (
          <Animated.Text key={`${word}-${i}`} style={[fadeStyles.word, { opacity }]}>
            {word}{' '}
          </Animated.Text>
        );
      })}
    </Text>
  );
}

const fadeStyles = StyleSheet.create({
  container: {
    fontSize: 20,
    lineHeight: 32,
    fontFamily: FONTS.body,
    color: COLORS.creamBright,
    flexDirection: 'row',
    flexWrap: 'wrap',
  } satisfies TextStyle,
  word: {
    fontSize: 20,
    lineHeight: 32,
    fontFamily: FONTS.body,
    color: COLORS.creamBright,
  } satisfies TextStyle,
  venueWord: {
    fontSize: 20,
    lineHeight: 32,
    fontFamily: FONTS.bodyMedium,
    color: COLORS.sage,
    textDecorationLine: 'underline',
    textDecorationColor: COLORS.sageLight,
  } satisfies TextStyle,
});

// ---------------------------------------------------------------------------
// Main Screen
// ---------------------------------------------------------------------------

export default function LiveNarratorScreen(): React.JSX.Element {
  const { t } = useTranslation();
  const insets = useSafeAreaInsets();
  const router = useRouter();
  const { trips, activeTripId } = useAppStore();

  const activeTrip: Trip | null = useMemo(
    () => trips.find((tr) => tr.id === activeTripId) ?? trips[0] ?? null,
    [trips, activeTripId],
  );
  const destination = activeTrip?.destination ?? '';
  const vibes = activeTrip?.vibes ?? [];

  const itinerary: Itinerary | null = useMemo(() => {
    if (!activeTrip?.itinerary) return null;
    try { return parseItinerary(activeTrip.itinerary); } catch { return null; }
  }, [activeTrip?.itinerary]);

  const currentDay = useMemo(() => {
    if (!activeTrip?.createdAt || !activeTrip?.days) return 0;
    const start = new Date(activeTrip.createdAt).setHours(0, 0, 0, 0);
    const today = new Date().setHours(0, 0, 0, 0);
    const elapsed = Math.floor((today - start) / 86400000);
    return Math.max(0, Math.min(elapsed, activeTrip.days - 1));
  }, [activeTrip?.createdAt, activeTrip?.days]);

  // State
  const [weather, setWeather] = useState<CurrentWeather | null>(null);
  const [narration, setNarration] = useState<NarrationResult | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [isPlaying, setIsPlaying] = useState(false);
  const [askInput, setAskInput] = useState('');
  const [askResponse, setAskResponse] = useState<string | null>(null);
  const [isAsking, setIsAsking] = useState(false);
  const autoRefreshRef = useRef<ReturnType<typeof setInterval> | null>(null);

  const now = useMemo(() => new Date(), []);
  const timeOfDay = useMemo(() => getTimeOfDay(now.getHours()), [now]);
  const gradientColors = useMemo(
    () => TIME_GRADIENTS[timeOfDay] as unknown as [string, string, string],
    [timeOfDay],
  );

  const formattedTime = useMemo(() => {
    const h = now.getHours();
    const m = String(now.getMinutes()).padStart(2, '0');
    const period = h < 12 ? 'AM' : 'PM';
    const dh = h % 12 === 0 ? 12 : h % 12;
    return `${dh}:${m} ${period}`;
  }, [now]);

  const weatherLabel = useMemo(() => {
    if (!weather) return '';
    return `${Math.round(weather.temp)}°C · ${weather.condition}`;
  }, [weather]);

  // Next activity from itinerary
  const nextActivityInfo = useMemo(() => {
    if (!itinerary) return null;
    const day = itinerary.days[currentDay];
    if (!day) return null;
    const hourNow = now.getHours();
    if (hourNow < 12) return { label: day.afternoon.activity, time: day.afternoon.time ?? 'Afternoon' };
    if (hourNow < 17) return { label: day.evening.activity, time: day.evening.time ?? 'Evening' };
    return null;
  }, [itinerary, currentDay, now]);

  // Coords for the destination
  const coords = useMemo(() => getDestinationCoords(destination), [destination]);

  // ---------------------------------------------------------------------------
  // Fetch narration
  // ---------------------------------------------------------------------------

  const fetchNarration = useCallback(async () => {
    if (!destination || !coords) return;
    setIsLoading(true);
    try {
      const w = await getCurrentWeather(destination).catch(() => null);
      setWeather(w);

      const result = await getNarrationForMoment(
        destination,
        coords.lat,
        coords.lng,
        itinerary,
        w,
        currentDay,
        vibes,
      );
      setNarration(result);
    } catch {
      // narration fetch failed — keep previous
    } finally {
      setIsLoading(false);
    }
  }, [destination, coords, itinerary, currentDay, vibes]);

  useEffect(() => {
    fetchNarration();

    // Auto-refresh every 15 minutes
    autoRefreshRef.current = setInterval(() => {
      fetchNarration();
    }, 15 * 60 * 1000);

    return () => {
      if (autoRefreshRef.current) clearInterval(autoRefreshRef.current);
      stopNarration();
    };
  }, [fetchNarration]);

  // ---------------------------------------------------------------------------
  // Handlers
  // ---------------------------------------------------------------------------

  const handleBack = useCallback(() => {
    Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
    stopNarration();
    router.back();
  }, [router]);

  const handlePlayPause = useCallback(async () => {
    Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Medium);
    if (isPlaying) {
      await stopNarration();
      setIsPlaying(false);
      return;
    }
    if (!narration) return;
    setIsPlaying(true);
    try {
      await narrateText(narration.audioText, {
        onEnd: () => setIsPlaying(false),
        onError: () => setIsPlaying(false),
      });
    } catch {
      setIsPlaying(false);
    }
  }, [isPlaying, narration]);

  const handleRefresh = useCallback(() => {
    Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
    fetchNarration();
  }, [fetchNarration]);

  const handleVenueTap = useCallback((venue: string) => {
    const query = `${venue} ${destination}`;
    const url = `https://www.google.com/maps/search/?api=1&query=${encodeURIComponent(query)}`;
    Linking.openURL(url).catch(() => {});
  }, [destination]);

  const handleAsk = useCallback(async () => {
    if (!askInput.trim() || !destination) return;
    Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
    setIsAsking(true);
    setAskResponse(null);
    try {
      const result = await fetchSonarResult(destination, 'narration', {
        budget: `I'm currently in ${destination}. ${askInput.trim()}. Answer in 2-3 sentences like a friend, not a guidebook.`,
      });
      setAskResponse(result.answer);
    } catch {
      setAskResponse('Could not get an answer right now. Try again in a moment.');
    } finally {
      setIsAsking(false);
      setAskInput('');
    }
  }, [askInput, destination]);

  // ---------------------------------------------------------------------------
  // Render
  // ---------------------------------------------------------------------------

  return (
    <LinearGradient colors={gradientColors} style={styles.root}>
      <ScrollView
        style={styles.scroll}
        contentContainerStyle={[
          styles.content,
          { paddingTop: insets.top + SPACING.md, paddingBottom: insets.bottom + 120 },
        ]}
        showsVerticalScrollIndicator={false}
      >
        {/* Header: back + location + time */}
        <View style={styles.header}>
          <Pressable onPress={handleBack} hitSlop={12} accessibilityLabel="Go back" accessibilityRole="button">
            <ChevronLeft size={24} color={COLORS.creamDim} strokeWidth={1.5} />
          </Pressable>
          <View style={styles.headerRight}>
            <Text style={styles.locationLabel}>{destination}</Text>
            <Text style={styles.timeLabel}>
              {formattedTime}{weatherLabel ? ` · ${weatherLabel}` : ''}
            </Text>
          </View>
        </View>

        {/* Narration text — the soul of the screen */}
        <View style={styles.narrationSection}>
          {isLoading && !narration ? (
            <View style={styles.loadingContainer}>
              <Headphones size={28} color={COLORS.sageMedium} strokeWidth={1.5} />
              <Text style={styles.loadingText}>
                {t('liveNarrator.listening', { defaultValue: 'Reading the city...' })}
              </Text>
            </View>
          ) : narration ? (
            <FadeInText text={narration.text} onVenueTap={handleVenueTap} />
          ) : (
            <Text style={styles.errorText}>
              {t('liveNarrator.noData', { defaultValue: 'No narration available. Pull to refresh.' })}
            </Text>
          )}
        </View>

        {/* Ask something */}
        <View style={styles.askSection}>
          <View style={styles.askInputRow}>
            <TextInput
              style={styles.askInput}
              placeholder={t('liveNarrator.askPlaceholder', { defaultValue: 'Ask something about here...' })}
              placeholderTextColor={COLORS.muted}
              value={askInput}
              onChangeText={setAskInput}
              onSubmitEditing={handleAsk}
              returnKeyType="send"
              editable={!isAsking}
            />
            <Pressable
              onPress={handleAsk}
              style={[styles.askSendBtn, (!askInput.trim() || isAsking) && styles.askSendBtnDisabled]}
              disabled={!askInput.trim() || isAsking}
              accessibilityLabel="Send question"
              accessibilityRole="button"
            >
              <Send size={16} color={(!askInput.trim() || isAsking) ? COLORS.muted : COLORS.bg} strokeWidth={1.5} />
            </Pressable>
          </View>
          {isAsking && (
            <Text style={styles.askLoading}>
              {t('liveNarrator.thinking', { defaultValue: 'Thinking...' })}
            </Text>
          )}
          {askResponse && (
            <View style={styles.askResponseContainer}>
              <Text style={styles.askResponseText}>{askResponse}</Text>
            </View>
          )}
        </View>

        {/* Next activity card */}
        {nextActivityInfo && (
          <View style={styles.nextCard}>
            <Text style={styles.nextLabel}>
              {t('liveNarrator.nextUp', { defaultValue: 'NEXT UP' })}
            </Text>
            <Text style={styles.nextActivity}>{nextActivityInfo.label}</Text>
            <Text style={styles.nextTime}>{nextActivityInfo.time}</Text>
          </View>
        )}
      </ScrollView>

      {/* Bottom audio controls — fixed */}
      <View style={[styles.audioBar, { paddingBottom: insets.bottom + SPACING.md }]}>
        {/* Refresh button */}
        <Pressable
          onPress={handleRefresh}
          style={styles.refreshBtn}
          accessibilityLabel={t('liveNarrator.newNarration', { defaultValue: 'New narration' })}
          accessibilityRole="button"
        >
          <RefreshCw size={18} color={COLORS.creamDim} strokeWidth={1.5} />
        </Pressable>

        {/* Play / Pause pill */}
        <Pressable
          onPress={handlePlayPause}
          style={[styles.playPill, !narration && styles.playPillDisabled]}
          disabled={!narration}
          accessibilityLabel={isPlaying ? 'Pause' : 'Play'}
          accessibilityRole="button"
        >
          {isPlaying ? (
            <Pause size={20} color={COLORS.bg} strokeWidth={1.5} />
          ) : (
            <Play size={20} color={COLORS.bg} strokeWidth={1.5} />
          )}
          <Text style={styles.playPillText}>
            {isPlaying
              ? t('liveNarrator.pause', { defaultValue: 'Pause' })
              : t('liveNarrator.listen', { defaultValue: 'Listen' })}
          </Text>
        </Pressable>

        {/* Waveform */}
        <WaveformBars active={isPlaying} />
      </View>
    </LinearGradient>
  );
}

// ---------------------------------------------------------------------------
// Styles
// ---------------------------------------------------------------------------

const styles = StyleSheet.create({
  root: {
    flex: 1,
  } satisfies ViewStyle,
  scroll: {
    flex: 1,
  } satisfies ViewStyle,
  content: {
    paddingHorizontal: SPACING.lg,
  } satisfies ViewStyle,

  // Header
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: SPACING.sm,
    marginBottom: SPACING.xxl,
  } satisfies ViewStyle,
  headerRight: {
    flex: 1,
    alignItems: 'flex-end',
  } satisfies ViewStyle,
  locationLabel: {
    fontFamily: FONTS.mono,
    fontSize: 13,
    color: COLORS.creamDim,
    letterSpacing: 0.5,
  } satisfies TextStyle,
  timeLabel: {
    fontFamily: FONTS.mono,
    fontSize: 11,
    color: COLORS.muted,
    marginTop: 2,
  } satisfies TextStyle,

  // Narration
  narrationSection: {
    minHeight: 200,
    marginBottom: SPACING.xl,
  } satisfies ViewStyle,
  loadingContainer: {
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: SPACING.xxxl,
    gap: SPACING.md,
  } satisfies ViewStyle,
  loadingText: {
    fontFamily: FONTS.body,
    fontSize: 16,
    color: COLORS.muted,
  } satisfies TextStyle,
  errorText: {
    fontFamily: FONTS.body,
    fontSize: 16,
    color: COLORS.muted,
    textAlign: 'center',
    paddingVertical: SPACING.xxl,
  } satisfies TextStyle,

  // Ask
  askSection: {
    marginBottom: SPACING.xl,
  } satisfies ViewStyle,
  askInputRow: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: COLORS.surface1,
    borderRadius: RADIUS.md,
    borderWidth: 1,
    borderColor: COLORS.border,
    paddingHorizontal: SPACING.md,
    gap: SPACING.sm,
  } satisfies ViewStyle,
  askInput: {
    flex: 1,
    fontFamily: FONTS.body,
    fontSize: 15,
    color: COLORS.creamBright,
    paddingVertical: SPACING.md,
  } satisfies TextStyle,
  askSendBtn: {
    width: 32,
    height: 32,
    borderRadius: RADIUS.full,
    backgroundColor: COLORS.sage,
    alignItems: 'center',
    justifyContent: 'center',
  } satisfies ViewStyle,
  askSendBtnDisabled: {
    backgroundColor: COLORS.surface2,
  } satisfies ViewStyle,
  askLoading: {
    fontFamily: FONTS.mono,
    fontSize: 12,
    color: COLORS.muted,
    marginTop: SPACING.sm,
  } satisfies TextStyle,
  askResponseContainer: {
    marginTop: SPACING.md,
    padding: SPACING.md,
    backgroundColor: COLORS.sageVeryFaint,
    borderRadius: RADIUS.md,
    borderLeftWidth: 3,
    borderLeftColor: COLORS.sage,
  } satisfies ViewStyle,
  askResponseText: {
    fontFamily: FONTS.body,
    fontSize: 15,
    lineHeight: 24,
    color: COLORS.creamBright,
  } satisfies TextStyle,

  // Next card
  nextCard: {
    backgroundColor: COLORS.surface1,
    borderRadius: RADIUS.md,
    padding: SPACING.lg,
    borderWidth: 1,
    borderColor: COLORS.border,
  } satisfies ViewStyle,
  nextLabel: {
    fontFamily: FONTS.mono,
    fontSize: 11,
    color: COLORS.sage,
    letterSpacing: 1,
    marginBottom: SPACING.xs,
  } satisfies TextStyle,
  nextActivity: {
    fontFamily: FONTS.headerMedium,
    fontSize: 17,
    color: COLORS.creamBright,
  } satisfies TextStyle,
  nextTime: {
    fontFamily: FONTS.mono,
    fontSize: 12,
    color: COLORS.muted,
    marginTop: SPACING.xs,
  } satisfies TextStyle,

  // Audio bar
  audioBar: {
    position: 'absolute',
    bottom: 0,
    left: 0,
    right: 0,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: SPACING.md,
    paddingHorizontal: SPACING.lg,
    paddingTop: SPACING.md,
    backgroundColor: COLORS.bgDarkGreenDeep,
  } satisfies ViewStyle,
  refreshBtn: {
    width: 40,
    height: 40,
    borderRadius: RADIUS.full,
    backgroundColor: COLORS.surface1,
    alignItems: 'center',
    justifyContent: 'center',
    borderWidth: 1,
    borderColor: COLORS.border,
  } satisfies ViewStyle,
  playPill: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: SPACING.sm,
    backgroundColor: COLORS.sage,
    paddingHorizontal: SPACING.lg,
    paddingVertical: SPACING.md,
    borderRadius: RADIUS.pill,
  } satisfies ViewStyle,
  playPillDisabled: {
    backgroundColor: COLORS.surface2,
  } satisfies ViewStyle,
  playPillText: {
    fontFamily: FONTS.bodyMedium,
    fontSize: 15,
    color: COLORS.bg,
  } satisfies TextStyle,
});
