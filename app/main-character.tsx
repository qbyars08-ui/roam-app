// =============================================================================
// ROAM — Main Character Itinerary
// AI flags cinematic "main character moments" in your trip.
// Exportable shot list + shareable moment cards.
// =============================================================================
import React, { useRef, useState, useMemo, useCallback, useEffect } from 'react';
import {
  Animated,
  Pressable,
  ScrollView,
  StyleSheet,
  Text,
  View,
  type TextStyle,
  type ViewStyle,
} from 'react-native';
import { useRouter, useLocalSearchParams } from 'expo-router';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { LinearGradient } from 'expo-linear-gradient';
import * as Haptics from 'expo-haptics';
import ViewShot, { captureRef } from 'react-native-view-shot';
import * as Sharing from 'expo-sharing';
import { COLORS, FONTS, SPACING, RADIUS } from '../lib/constants';
import { useAppStore } from '../lib/store';
import { parseItinerary } from '../lib/types/itinerary';
import { callClaude } from '../lib/claude';

// =============================================================================
// Types
// =============================================================================
interface MainCharacterMoment {
  day: number;
  time: string;
  location: string;
  moment: string;
  whyCinematic: string;
  bestTime: string;
  shotAngle: string;
  caption: string;
  vibeTag: string;
}

interface MainCharacterData {
  destination: string;
  narrativeArc: string;
  moments: MainCharacterMoment[];
  shotListTitle: string;
}

// =============================================================================
// System Prompt
// =============================================================================
const MAIN_CHARACTER_PROMPT = `You are ROAM's Main Character Energy engine. Given a trip itinerary, identify 3-5 cinematic "main character moments" — the scenes that would make someone's trip look like a movie.

CRITICAL: Respond with ONLY valid JSON. No markdown, no explanation, no extra text.

JSON schema:
{
  "destination": "City, Country",
  "narrativeArc": "One sentence describing the story arc of this trip — like a movie logline",
  "shotListTitle": "Creative title for the shot list card — e.g. 'The Tokyo Cut', 'A Roman Holiday'",
  "moments": [
    {
      "day": 1,
      "time": "Golden hour (5:30-6:15pm)",
      "location": "Exact real location name",
      "moment": "What happens in this scene — written like a screenplay direction, present tense, vivid",
      "whyCinematic": "Why this moment is visually/emotionally cinematic — 1 sentence",
      "bestTime": "Exact time window for the best light/mood/crowd level",
      "shotAngle": "Camera direction: '0.5x wide from the steps' or 'portrait mode, shoot into the sun'",
      "caption": "Ready-to-post Instagram/TikTok caption — no hashtags, just vibes",
      "vibeTag": "golden-hour | chaos | quiet-flex | discovery | main-character | plot-twist"
    }
  ]
}

Rules:
- 3-5 moments per trip, spread across different days
- Each moment should feel like a different SCENE in a movie
- Be extremely specific about locations, times, and angles
- Captions should be effortless, not tryhard — the kind people screenshot
- The narrative arc should make the whole trip feel like a story
- vibeTag must be one of: golden-hour, chaos, quiet-flex, discovery, main-character, plot-twist`;

// =============================================================================
// Vibe Colors
// =============================================================================
const VIBE_COLORS: Record<string, string> = {
  'golden-hour': '#C9A84C',
  'chaos': '#C0392B',
  'quiet-flex': '#7CAF8A',
  'discovery': '#5B9BD5',
  'main-character': '#9B59B6',
  'plot-twist': '#E67E22',
};

const VIBE_LABELS: Record<string, string> = {
  'golden-hour': 'Golden Hour',
  'chaos': 'Beautiful Chaos',
  'quiet-flex': 'Quiet Flex',
  'discovery': 'Discovery',
  'main-character': 'Main Character',
  'plot-twist': 'Plot Twist',
};

// =============================================================================
// Main Screen
// =============================================================================
export default function MainCharacterScreen() {
  const router = useRouter();
  const insets = useSafeAreaInsets();
  const { tripId } = useLocalSearchParams<{ tripId: string }>();
  const trips = useAppStore((s) => s.trips);
  const [data, setData] = useState<MainCharacterData | null>(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const cardRef = useRef<ViewShot>(null);

  // Animations
  const fadeIn = useRef(new Animated.Value(0)).current;
  const momentAnims = useRef(
    Array.from({ length: 5 }, () => new Animated.Value(0))
  ).current;

  // Find trip
  const trip = useMemo(() => {
    if (tripId) return trips.find((t) => t.id === tripId) ?? null;
    return trips[0] ?? null;
  }, [tripId, trips]);

  // Parse itinerary
  const itinerary = useMemo(() => {
    if (!trip?.itinerary) return null;
    try {
      return parseItinerary(trip.itinerary);
    } catch {
      return null;
    }
  }, [trip]);

  // Generate moments
  const generateMoments = useCallback(async () => {
    if (!itinerary) return;

    setLoading(true);
    setError(null);
    Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Medium);

    try {
      const itineraryContext = itinerary.days
        .map(
          (d) =>
            `Day ${d.day} (${d.theme}): Morning — ${d.morning.activity} at ${d.morning.location}. Afternoon — ${d.afternoon.activity} at ${d.afternoon.location}. Evening — ${d.evening.activity} at ${d.evening.location}.`
        )
        .join('\n');

      const prompt = `Here's a ${itinerary.days.length}-day itinerary for ${itinerary.destination}:\n\n${itineraryContext}\n\nFind the main character moments in this trip.`;

      const response = await callClaude(MAIN_CHARACTER_PROMPT, prompt, false);
      const parsed = JSON.parse(response.content) as MainCharacterData;

      setData(parsed);

      // Animate
      fadeIn.setValue(0);
      momentAnims.forEach((a) => a.setValue(0));

      Animated.timing(fadeIn, {
        toValue: 1,
        duration: 500,
        useNativeDriver: true,
      }).start(() => {
        Animated.stagger(
          120,
          momentAnims.slice(0, parsed.moments.length).map((anim) =>
            Animated.spring(anim, {
              toValue: 1,
              tension: 50,
              friction: 8,
              useNativeDriver: true,
            })
          )
        ).start();
      });

      Haptics.notificationAsync(Haptics.NotificationFeedbackType.Success);
    } catch {
      setError(
        "Couldn't find your main character moments. Try again — every trip has a story."
      );
      Haptics.notificationAsync(Haptics.NotificationFeedbackType.Error);
    } finally {
      setLoading(false);
    }
  }, [itinerary, fadeIn, momentAnims]);

  // Auto-generate on mount if we have an itinerary
  useEffect(() => {
    if (itinerary && !data && !loading) {
      generateMoments();
    }
  }, [itinerary]); // eslint-disable-line react-hooks/exhaustive-deps

  const handleShare = useCallback(async () => {
    if (!cardRef.current) return;
    Haptics.notificationAsync(Haptics.NotificationFeedbackType.Success);
    try {
      const uri = await captureRef(cardRef, {
        format: 'png',
        quality: 1,
        result: 'tmpfile',
      });
      await Sharing.shareAsync(uri, {
        mimeType: 'image/png',
        dialogTitle: 'Share your Shot List',
      });
    } catch {
      // cancelled
    }
  }, []);

  // No trip state
  if (!trip || !itinerary) {
    return (
      <View style={[styles.screen, { paddingTop: insets.top }]}>
        <View style={styles.header}>
          <Pressable onPress={() => router.back()} hitSlop={12}>
            <Text style={styles.backBtn}>{'\u2190'}</Text>
          </Pressable>
          <Text style={styles.headerTitle}>Main Character</Text>
          <View style={{ width: 24 }} />
        </View>
        <View style={styles.emptyCenter}>
          <Text style={styles.emptyTitle}>No itinerary to direct</Text>
          <Text style={styles.emptyBody}>
            Plan a trip first, then come back to find your cinematic moments.
          </Text>
        </View>
      </View>
    );
  }

  return (
    <View style={[styles.screen, { paddingTop: insets.top }]}>
      {/* Header */}
      <View style={styles.header}>
        <Pressable onPress={() => router.back()} hitSlop={12}>
          <Text style={styles.backBtn}>{'\u2190'}</Text>
        </Pressable>
        <View>
          <Text style={styles.headerEyebrow}>CINEMATIC MOMENTS</Text>
          <Text style={styles.headerTitle}>Main Character</Text>
        </View>
        <Pressable onPress={generateMoments} hitSlop={12} disabled={loading}>
          <Text style={[styles.refreshBtn, loading && { opacity: 0.4 }]}>
            {'\u21BB'}
          </Text>
        </Pressable>
      </View>

      <ScrollView
        style={styles.scroll}
        contentContainerStyle={styles.scrollContent}
        showsVerticalScrollIndicator={false}
      >
        {/* Loading */}
        {loading && (
          <View style={styles.loadingCenter}>
            <Text style={styles.loadingText}>
              Finding your cinematic moments...
            </Text>
            <Text style={styles.loadingSubtext}>
              Every trip has a story. We're finding yours.
            </Text>
          </View>
        )}

        {/* Error */}
        {error && (
          <View style={styles.errorCard}>
            <Text style={styles.errorText}>{error}</Text>
            <Pressable
              onPress={generateMoments}
              style={({ pressed }) => [
                styles.retryBtn,
                { opacity: pressed ? 0.7 : 1 },
              ]}
            >
              <Text style={styles.retryText}>Try Again</Text>
            </Pressable>
          </View>
        )}

        {/* Results */}
        {data && (
          <>
            {/* Narrative Arc */}
            <Animated.View style={[styles.arcCard, { opacity: fadeIn }]}>
              <Text style={styles.arcEyebrow}>THE STORY</Text>
              <Text style={styles.arcTitle}>{data.shotListTitle}</Text>
              <Text style={styles.arcBody}>{data.narrativeArc}</Text>
              <Text style={styles.arcDest}>{data.destination}</Text>
            </Animated.View>

            {/* Shot List Card (shareable) */}
            <ViewShot ref={cardRef} options={{ format: 'png', quality: 1 }}>
              <LinearGradient
                colors={[COLORS.bg, '#0a1f1a', COLORS.bg]}
                style={styles.shotListCard}
              >
                {/* Shot List Header */}
                <View style={styles.shotListHeader}>
                  <Text style={styles.shotListBrand}>ROAM</Text>
                  <Text style={styles.shotListTitle}>
                    {data.shotListTitle}
                  </Text>
                  <Text style={styles.shotListDest}>
                    {data.destination}
                  </Text>
                </View>

                {/* Moments */}
                {data.moments.map((moment, i) => (
                  <Animated.View
                    key={`${moment.day}-${moment.time}`}
                    style={{
                      opacity: momentAnims[i] ?? fadeIn,
                      transform: [
                        {
                          translateX: (momentAnims[i] ?? fadeIn).interpolate({
                            inputRange: [0, 1],
                            outputRange: [-30, 0],
                          }),
                        },
                      ],
                    }}
                  >
                    <MomentCard moment={moment} index={i} />
                  </Animated.View>
                ))}

                {/* Footer */}
                <View style={styles.shotListFooter}>
                  <Text style={styles.shotListFooterText}>
                    Go somewhere that changes you.
                  </Text>
                </View>
              </LinearGradient>
            </ViewShot>

            {/* Share Button */}
            <Pressable
              style={({ pressed }) => [
                styles.shareBtn,
                { opacity: pressed ? 0.85 : 1 },
              ]}
              onPress={handleShare}
            >
              <LinearGradient
                colors={['#9B59B6', '#9B59B6CC']}
                style={styles.shareBtnGradient}
              >
                <Text style={styles.shareBtnText}>
                  Share your Shot List
                </Text>
              </LinearGradient>
            </Pressable>
          </>
        )}

        <View style={{ height: 40 }} />
      </ScrollView>
    </View>
  );
}

// =============================================================================
// Moment Card
// =============================================================================
function MomentCard({
  moment,
  index,
}: {
  moment: MainCharacterMoment;
  index: number;
}) {
  const vibeColor = VIBE_COLORS[moment.vibeTag] ?? COLORS.sage;
  const vibeLabel = VIBE_LABELS[moment.vibeTag] ?? moment.vibeTag;

  return (
    <View style={styles.momentCard}>
      {/* Scene number */}
      <View style={styles.sceneRow}>
        <View style={[styles.sceneBadge, { backgroundColor: vibeColor }]}>
          <Text style={styles.sceneNum}>SCENE {index + 1}</Text>
        </View>
        <View style={[styles.vibeBadge, { borderColor: vibeColor }]}>
          <Text style={[styles.vibeLabel, { color: vibeColor }]}>
            {vibeLabel}
          </Text>
        </View>
      </View>

      {/* Day + Time */}
      <View style={styles.dayTimeRow}>
        <Text style={styles.dayText}>Day {moment.day}</Text>
        <Text style={styles.timeText}>{moment.time}</Text>
      </View>

      {/* Location */}
      <Text style={styles.locationText}>{moment.location}</Text>

      {/* The Moment */}
      <Text style={styles.momentText}>{moment.moment}</Text>

      {/* Why Cinematic */}
      <Text style={styles.whyText}>{moment.whyCinematic}</Text>

      {/* Shot Details */}
      <View style={styles.detailsGrid}>
        <View style={styles.detailItem}>
          <Text style={styles.detailLabel}>BEST TIME</Text>
          <Text style={styles.detailValue}>{moment.bestTime}</Text>
        </View>
        <View style={styles.detailItem}>
          <Text style={styles.detailLabel}>SHOT ANGLE</Text>
          <Text style={styles.detailValue}>{moment.shotAngle}</Text>
        </View>
      </View>

      {/* Caption */}
      <View style={styles.captionRow}>
        <Text style={styles.captionLabel}>CAPTION</Text>
        <Text style={styles.captionText}>{'\u201C'}{moment.caption}{'\u201D'}</Text>
      </View>
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
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: SPACING.lg,
    paddingVertical: SPACING.md,
  } as ViewStyle,
  backBtn: {
    fontSize: 24,
    color: COLORS.cream,
  } as TextStyle,
  headerEyebrow: {
    fontFamily: FONTS.mono,
    fontSize: 10,
    color: COLORS.sage,
    letterSpacing: 2,
    textAlign: 'center',
  } as TextStyle,
  headerTitle: {
    fontFamily: FONTS.header,
    fontSize: 24,
    color: COLORS.cream,
    textAlign: 'center',
  } as TextStyle,
  refreshBtn: {
    fontSize: 24,
    color: COLORS.sage,
  } as TextStyle,
  scroll: {
    flex: 1,
  } as ViewStyle,
  scrollContent: {
    paddingHorizontal: SPACING.lg,
    paddingBottom: SPACING.xl,
  } as ViewStyle,

  // Empty
  emptyCenter: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
    paddingHorizontal: SPACING.xl,
    gap: SPACING.sm,
  } as ViewStyle,
  emptyTitle: {
    fontFamily: FONTS.header,
    fontSize: 22,
    color: COLORS.cream,
    textAlign: 'center',
  } as TextStyle,
  emptyBody: {
    fontFamily: FONTS.body,
    fontSize: 14,
    color: COLORS.creamMuted,
    textAlign: 'center',
    lineHeight: 22,
  } as TextStyle,

  // Loading
  loadingCenter: {
    alignItems: 'center',
    paddingVertical: SPACING.xxl,
    gap: SPACING.sm,
  } as ViewStyle,
  loadingText: {
    fontFamily: FONTS.body,
    fontSize: 16,
    color: COLORS.cream,
    textAlign: 'center',
  } as TextStyle,
  loadingSubtext: {
    fontFamily: FONTS.body,
    fontSize: 13,
    color: COLORS.creamMuted,
    textAlign: 'center',
  } as TextStyle,

  // Error
  errorCard: {
    backgroundColor: COLORS.coralLight,
    borderRadius: RADIUS.md,
    padding: SPACING.md,
    marginBottom: SPACING.lg,
    alignItems: 'center',
    gap: SPACING.sm,
  } as ViewStyle,
  errorText: {
    fontFamily: FONTS.body,
    fontSize: 14,
    color: COLORS.coral,
    textAlign: 'center',
  } as TextStyle,
  retryBtn: {
    backgroundColor: 'rgba(192,57,43,0.15)',
    borderRadius: RADIUS.full,
    paddingHorizontal: SPACING.lg,
    paddingVertical: 8,
  } as ViewStyle,
  retryText: {
    fontFamily: FONTS.bodySemiBold,
    fontSize: 13,
    color: COLORS.coral,
  } as TextStyle,

  // Arc Card
  arcCard: {
    backgroundColor: COLORS.bgGlass,
    borderRadius: RADIUS.lg,
    borderWidth: 1,
    borderColor: COLORS.border,
    padding: SPACING.lg,
    marginBottom: SPACING.lg,
    alignItems: 'center',
  } as ViewStyle,
  arcEyebrow: {
    fontFamily: FONTS.mono,
    fontSize: 10,
    color: '#9B59B6',
    letterSpacing: 2,
    marginBottom: 4,
  } as TextStyle,
  arcTitle: {
    fontFamily: FONTS.header,
    fontSize: 26,
    color: COLORS.cream,
    textAlign: 'center',
    marginBottom: 4,
  } as TextStyle,
  arcBody: {
    fontFamily: FONTS.body,
    fontSize: 14,
    color: COLORS.creamMuted,
    textAlign: 'center',
    lineHeight: 22,
    marginBottom: SPACING.sm,
  } as TextStyle,
  arcDest: {
    fontFamily: FONTS.mono,
    fontSize: 11,
    color: COLORS.sage,
    letterSpacing: 2,
  } as TextStyle,

  // Shot List Card (shareable)
  shotListCard: {
    borderRadius: RADIUS.lg,
    padding: SPACING.lg,
    marginBottom: SPACING.lg,
  } as ViewStyle,
  shotListHeader: {
    alignItems: 'center',
    marginBottom: SPACING.lg,
  } as ViewStyle,
  shotListBrand: {
    fontFamily: FONTS.mono,
    fontSize: 12,
    color: COLORS.sage,
    letterSpacing: 3,
    marginBottom: 4,
  } as TextStyle,
  shotListTitle: {
    fontFamily: FONTS.header,
    fontSize: 24,
    color: COLORS.cream,
    textAlign: 'center',
  } as TextStyle,
  shotListDest: {
    fontFamily: FONTS.mono,
    fontSize: 11,
    color: COLORS.creamMuted,
    letterSpacing: 1,
    marginTop: 2,
  } as TextStyle,
  shotListFooter: {
    alignItems: 'center',
    marginTop: SPACING.md,
  } as ViewStyle,
  shotListFooterText: {
    fontFamily: FONTS.mono,
    fontSize: 10,
    color: 'rgba(245,237,216,0.3)',
    letterSpacing: 1,
  } as TextStyle,

  // Moment Card
  momentCard: {
    backgroundColor: 'rgba(255,255,255,0.04)',
    borderRadius: RADIUS.lg,
    borderWidth: 1,
    borderColor: 'rgba(255,255,255,0.06)',
    padding: SPACING.lg,
    marginBottom: SPACING.md,
  } as ViewStyle,
  sceneRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: SPACING.sm,
  } as ViewStyle,
  sceneBadge: {
    borderRadius: RADIUS.full,
    paddingHorizontal: SPACING.sm,
    paddingVertical: 3,
  } as ViewStyle,
  sceneNum: {
    fontFamily: FONTS.mono,
    fontSize: 10,
    color: COLORS.white,
    letterSpacing: 2,
    fontWeight: '700',
  } as TextStyle,
  vibeBadge: {
    borderRadius: RADIUS.full,
    borderWidth: 1,
    paddingHorizontal: SPACING.sm,
    paddingVertical: 3,
  } as ViewStyle,
  vibeLabel: {
    fontFamily: FONTS.mono,
    fontSize: 10,
    letterSpacing: 1,
  } as TextStyle,

  // Day + Time
  dayTimeRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    marginBottom: 4,
  } as ViewStyle,
  dayText: {
    fontFamily: FONTS.mono,
    fontSize: 12,
    color: COLORS.cream,
    letterSpacing: 1,
  } as TextStyle,
  timeText: {
    fontFamily: FONTS.mono,
    fontSize: 11,
    color: COLORS.creamMuted,
  } as TextStyle,

  // Location
  locationText: {
    fontFamily: FONTS.header,
    fontSize: 20,
    color: COLORS.cream,
    marginBottom: SPACING.sm,
  } as TextStyle,

  // Moment description
  momentText: {
    fontFamily: FONTS.body,
    fontSize: 14,
    color: 'rgba(245,237,216,0.85)',
    lineHeight: 22,
    fontStyle: 'italic',
    marginBottom: SPACING.sm,
  } as TextStyle,

  // Why cinematic
  whyText: {
    fontFamily: FONTS.body,
    fontSize: 13,
    color: COLORS.creamMuted,
    lineHeight: 20,
    marginBottom: SPACING.md,
  } as TextStyle,

  // Details Grid
  detailsGrid: {
    flexDirection: 'row',
    gap: SPACING.md,
    marginBottom: SPACING.md,
  } as ViewStyle,
  detailItem: {
    flex: 1,
    gap: 2,
  } as ViewStyle,
  detailLabel: {
    fontFamily: FONTS.mono,
    fontSize: 9,
    color: COLORS.creamMuted,
    letterSpacing: 2,
  } as TextStyle,
  detailValue: {
    fontFamily: FONTS.body,
    fontSize: 12,
    color: COLORS.cream,
    lineHeight: 18,
  } as TextStyle,

  // Caption
  captionRow: {
    backgroundColor: 'rgba(155,89,182,0.1)',
    borderRadius: RADIUS.sm,
    padding: SPACING.sm,
    gap: 4,
  } as ViewStyle,
  captionLabel: {
    fontFamily: FONTS.mono,
    fontSize: 9,
    color: '#9B59B6',
    letterSpacing: 2,
  } as TextStyle,
  captionText: {
    fontFamily: FONTS.body,
    fontSize: 13,
    color: 'rgba(245,237,216,0.8)',
    fontStyle: 'italic',
    lineHeight: 20,
  } as TextStyle,

  // Share Button
  shareBtn: {
    borderRadius: RADIUS.lg,
    overflow: 'hidden',
    marginBottom: SPACING.lg,
  } as ViewStyle,
  shareBtnGradient: {
    paddingVertical: SPACING.md,
    alignItems: 'center',
    borderRadius: RADIUS.lg,
  } as ViewStyle,
  shareBtnText: {
    fontFamily: FONTS.bodySemiBold,
    fontSize: 16,
    color: COLORS.white,
    letterSpacing: 0.5,
  } as TextStyle,
});
