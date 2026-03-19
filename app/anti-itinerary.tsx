// =============================================================================
// ROAM — The Anti-Itinerary
// 2-3 anchor moments per day. Intentional blank space. Real-time gap filling.
// Ultra-minimal. The blank spaces ARE the design.
// =============================================================================

import React, { useState, useCallback, useMemo, useEffect, useRef } from 'react';
import {
  View,
  Text,
  Pressable,
  ScrollView,
  StyleSheet,
  Animated,
  ActivityIndicator,
} from 'react-native';
import { useLocalSearchParams, useRouter } from 'expo-router';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { useTranslation } from 'react-i18next';
import {
  ArrowLeft,
  Compass,
  Lock,
  Zap,
  Eye,
  EyeOff,
} from 'lucide-react-native';
import * as Haptics from '../lib/haptics';
import { COLORS, FONTS, SPACING, RADIUS } from '../lib/constants';
import { getTimeOfDay } from '../lib/here-now-context';
import {
  generateAntiItinerary,
  useLiveGapFiller,
  type AntiItinerary,
  type AntiItineraryDay,
  type AnchorMoment,
  type BlankSpace,
  type LiveSuggestion,
} from '../lib/anchor-moments';
import { generateAntiTrip } from '../lib/claude';
import { trackEvent } from '../lib/analytics';

// ---------------------------------------------------------------------------
// FadeIn wrapper — simple Animated.View with opacity
// ---------------------------------------------------------------------------

function FadeIn({
  delay = 0,
  children,
}: {
  delay?: number;
  children: React.ReactNode;
}) {
  const opacity = useRef(new Animated.Value(0)).current;

  useEffect(() => {
    Animated.timing(opacity, {
      toValue: 1,
      duration: 600,
      delay,
      useNativeDriver: true,
    }).start();
  }, [delay, opacity]);

  return <Animated.View style={{ opacity }}>{children}</Animated.View>;
}

// ---------------------------------------------------------------------------
// Main Screen
// ---------------------------------------------------------------------------

export default function AntiItineraryScreen() {
  const insets = useSafeAreaInsets();
  const router = useRouter();
  const { t } = useTranslation();
  const params = useLocalSearchParams<{
    destination?: string;
    days?: string;
    style?: string;
  }>();

  const destination = params.destination ?? '';
  const days = parseInt(params.days ?? '3', 10);
  const style = params.style ?? 'balanced';

  // State
  const [antiItinerary, setAntiItinerary] = useState<AntiItinerary | null>(null);
  const [isGenerating, setIsGenerating] = useState(false);
  const [generateError, setGenerateError] = useState<string | null>(null);
  const [hideAnchors, setHideAnchors] = useState(false);
  const [lockedSuggestions, setLockedSuggestions] = useState<readonly LiveSuggestion[]>([]);
  const [selectedDay, setSelectedDay] = useState(1);

  // Time context
  const currentHour = new Date().getHours();
  const timeOfDay = getTimeOfDay(currentHour);

  // Live gap filler — only when traveling (has anti-itinerary + destination)
  const {
    suggestions: liveSuggestions,
    isLoading: isFillingGaps,
    refresh: refreshGaps,
  } = useLiveGapFiller(
    antiItinerary ? destination : undefined,
    null, // would come from expo-location in production
    timeOfDay === 'latenight' ? 'latenight' : timeOfDay,
    [],
  );

  // Generate on mount if destination provided
  useEffect(() => {
    if (destination && !antiItinerary && !isGenerating) {
      handleGenerate();
    }
  }, [destination]);

  const handleGenerate = useCallback(async () => {
    if (!destination) return;
    setIsGenerating(true);
    setGenerateError(null);

    try {
      // Try Claude anti-trip first, fall back to Sonar
      let result: AntiItinerary;
      try {
        result = await generateAntiTripWrapper(destination, days, style);
      } catch {
        result = await generateAntiItinerary(destination, days, style);
      }
      setAntiItinerary(result);
      trackEvent('anti_itinerary_viewed', { destination, days });
    } catch (err: unknown) {
      const msg = err instanceof Error ? err.message : 'Failed to generate';
      setGenerateError(msg);
    } finally {
      setIsGenerating(false);
    }
  }, [destination, days, style]);

  const handleLockSuggestion = useCallback((suggestion: LiveSuggestion) => {
    Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Medium);
    setLockedSuggestions((prev) => [...prev, suggestion]);
    trackEvent('suggestion_locked', { text: suggestion.text });
  }, []);

  const handleToggleAnchors = useCallback(() => {
    Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
    setHideAnchors((prev) => !prev);
  }, []);

  const handleWhatNow = useCallback(() => {
    Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Medium);
    refreshGaps();
  }, [refreshGaps]);

  const currentDay = useMemo(() => {
    if (!antiItinerary) return null;
    return antiItinerary.days.find((d) => d.day === selectedDay) ?? antiItinerary.days[0] ?? null;
  }, [antiItinerary, selectedDay]);

  const handleBack = useCallback(() => {
    Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
    router.back();
  }, [router]);

  // -----------------------------------------------------------------------
  // Render
  // -----------------------------------------------------------------------

  return (
    <View style={[styles.container, { paddingTop: insets.top }]}>
      {/* Header */}
      <View style={styles.header}>
        <Pressable onPress={handleBack} hitSlop={12} style={styles.backBtn}>
          <ArrowLeft size={20} color={COLORS.creamDim} strokeWidth={1.5} />
        </Pressable>
        <View style={styles.headerCenter}>
          <Text style={styles.badge}>ANTI-ITINERARY</Text>
          {destination ? (
            <Text style={styles.headerDest}>{destination}</Text>
          ) : null}
        </View>
        <Pressable onPress={handleToggleAnchors} hitSlop={12}>
          {hideAnchors ? (
            <EyeOff size={18} color={COLORS.muted} strokeWidth={1.5} />
          ) : (
            <Eye size={18} color={COLORS.muted} strokeWidth={1.5} />
          )}
        </Pressable>
      </View>

      {/* Loading state */}
      {isGenerating ? (
        <View style={styles.loadingWrap}>
          <ActivityIndicator size="small" color={COLORS.sage} />
          <Text style={styles.loadingText}>
            Finding the unmissable moments...
          </Text>
          <Text style={styles.loadingSubtext}>
            Everything else is blank space.
          </Text>
        </View>
      ) : generateError ? (
        <View style={styles.loadingWrap}>
          <Text style={styles.errorText}>{generateError}</Text>
          <Pressable onPress={handleGenerate} style={styles.retryBtn}>
            <Text style={styles.retryText}>Try again</Text>
          </Pressable>
        </View>
      ) : !antiItinerary && !destination ? (
        <EmptyState onBack={handleBack} />
      ) : antiItinerary && currentDay ? (
        <>
          {/* Day selector */}
          {antiItinerary.days.length > 1 ? (
            <ScrollView
              horizontal
              showsHorizontalScrollIndicator={false}
              contentContainerStyle={styles.daySelector}
            >
              {antiItinerary.days.map((d) => (
                <Pressable
                  key={d.day}
                  onPress={() => {
                    Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
                    setSelectedDay(d.day);
                  }}
                  style={[
                    styles.dayPill,
                    d.day === selectedDay && styles.dayPillActive,
                  ]}
                >
                  <Text
                    style={[
                      styles.dayPillText,
                      d.day === selectedDay && styles.dayPillTextActive,
                    ]}
                  >
                    {d.day}
                  </Text>
                </Pressable>
              ))}
            </ScrollView>
          ) : null}

          {/* Day content */}
          <ScrollView
            style={styles.scroll}
            contentContainerStyle={[
              styles.scrollContent,
              { paddingBottom: insets.bottom + 100 },
            ]}
            showsVerticalScrollIndicator={false}
          >
            <DayView
              day={currentDay}
              hideAnchors={hideAnchors}
              liveSuggestions={liveSuggestions}
              lockedSuggestions={lockedSuggestions}
              isFillingGaps={isFillingGaps}
              onLockSuggestion={handleLockSuggestion}
            />
          </ScrollView>

          {/* Floating "What should I do right now?" button */}
          <View
            style={[
              styles.fabWrap,
              { bottom: insets.bottom + SPACING.lg },
            ]}
          >
            <Pressable onPress={handleWhatNow} style={styles.fab}>
              <Compass size={18} color={COLORS.bg} strokeWidth={1.5} />
              <Text style={styles.fabText}>What should I do right now?</Text>
            </Pressable>
          </View>
        </>
      ) : null}
    </View>
  );
}

// ---------------------------------------------------------------------------
// DayView — renders a single day of the anti-itinerary
// ---------------------------------------------------------------------------

function DayView({
  day,
  hideAnchors,
  liveSuggestions,
  lockedSuggestions,
  isFillingGaps,
  onLockSuggestion,
}: {
  day: AntiItineraryDay;
  hideAnchors: boolean;
  liveSuggestions: readonly LiveSuggestion[];
  lockedSuggestions: readonly LiveSuggestion[];
  isFillingGaps: boolean;
  onLockSuggestion: (s: LiveSuggestion) => void;
}) {
  return (
    <View>
      {/* Large day number */}
      <FadeIn delay={0}>
        <Text style={styles.dayNumber}>{String(day.day).padStart(2, '0')}</Text>
      </FadeIn>

      {/* Philosophy */}
      <FadeIn delay={100}>
        <Text style={styles.philosophy}>{day.philosophy}</Text>
      </FadeIn>

      {/* Interleave anchors and spaces */}
      {day.spaces.map((space, i) => (
        <View key={`space_${i}`}>
          {/* Anchor before this space (if exists and not hidden) */}
          {!hideAnchors && day.anchors[i] ? (
            <FadeIn delay={200 + i * 150}>
              <AnchorCard anchor={day.anchors[i]} />
            </FadeIn>
          ) : null}

          {/* Blank space */}
          <FadeIn delay={300 + i * 150}>
            <BlankSpaceCard
              space={space}
              suggestions={liveSuggestions}
              lockedSuggestions={lockedSuggestions}
              isLoading={isFillingGaps}
              onLock={onLockSuggestion}
            />
          </FadeIn>
        </View>
      ))}

      {/* Final anchor if more anchors than spaces */}
      {!hideAnchors && day.anchors.length > day.spaces.length ? (
        <FadeIn delay={500}>
          <AnchorCard anchor={day.anchors[day.anchors.length - 1]} />
        </FadeIn>
      ) : null}
    </View>
  );
}

// ---------------------------------------------------------------------------
// AnchorCard — a bold, specific, unmissable moment
// ---------------------------------------------------------------------------

function AnchorCard({ anchor }: { anchor: AnchorMoment }) {
  return (
    <View style={styles.anchorCard}>
      <Text style={styles.anchorTime}>{anchor.time}</Text>
      <Text style={styles.anchorActivity}>{anchor.activity}</Text>
      {anchor.location ? (
        <Text style={styles.anchorLocation}>{anchor.location}</Text>
      ) : null}
      <Text style={styles.anchorWhy}>{anchor.why}</Text>
      <View style={styles.flexBadge}>
        <Text style={styles.flexText}>
          {anchor.flexWindow} min flex
        </Text>
      </View>
    </View>
  );
}

// ---------------------------------------------------------------------------
// BlankSpaceCard — intentional emptiness, fills with live suggestions
// ---------------------------------------------------------------------------

function BlankSpaceCard({
  space,
  suggestions,
  lockedSuggestions,
  isLoading,
  onLock,
}: {
  space: BlankSpace;
  suggestions: readonly LiveSuggestion[];
  lockedSuggestions: readonly LiveSuggestion[];
  isLoading: boolean;
  onLock: (s: LiveSuggestion) => void;
}) {
  const lockedIds = useMemo(
    () => new Set(lockedSuggestions.map((s) => s.id)),
    [lockedSuggestions],
  );

  // Show locked suggestions that were promoted from this space
  const locked = lockedSuggestions.filter((s) => !lockedIds.has(''));

  return (
    <View style={styles.blankCard}>
      <View style={styles.blankHeader}>
        <Text style={styles.blankLabel}>{space.label}</Text>
        <Text style={styles.blankTime}>
          {space.startTime} — {space.endTime}
        </Text>
      </View>

      {/* Live suggestions fill in */}
      {suggestions.length > 0 ? (
        <View style={styles.suggestionsWrap}>
          {suggestions.slice(0, 2).map((suggestion) => (
            <FadeIn key={suggestion.id} delay={200}>
              <SuggestionRow
                suggestion={suggestion}
                isLocked={lockedIds.has(suggestion.id)}
                onLock={() => onLock(suggestion)}
              />
            </FadeIn>
          ))}
        </View>
      ) : isLoading ? (
        <View style={styles.blankFilling}>
          <ActivityIndicator size="small" color={COLORS.muted} />
          <Text style={styles.blankFillingText}>Sensing what is nearby...</Text>
        </View>
      ) : null}
    </View>
  );
}

// ---------------------------------------------------------------------------
// SuggestionRow — a live suggestion with lock button
// ---------------------------------------------------------------------------

function SuggestionRow({
  suggestion,
  isLocked,
  onLock,
}: {
  suggestion: LiveSuggestion;
  isLocked: boolean;
  onLock: () => void;
}) {
  return (
    <View style={[styles.suggestionRow, isLocked && styles.suggestionLocked]}>
      <View style={styles.suggestionContent}>
        <Text style={styles.suggestionText} numberOfLines={2}>
          {suggestion.text}
        </Text>
        <Text style={styles.suggestionDetail} numberOfLines={1}>
          {suggestion.detail}
        </Text>
      </View>
      <Pressable
        onPress={onLock}
        hitSlop={8}
        style={styles.lockBtn}
        disabled={isLocked}
      >
        {isLocked ? (
          <Lock size={14} color={COLORS.sage} strokeWidth={1.5} />
        ) : (
          <Lock size={14} color={COLORS.muted} strokeWidth={1.5} />
        )}
      </Pressable>
    </View>
  );
}

// ---------------------------------------------------------------------------
// EmptyState — no destination provided
// ---------------------------------------------------------------------------

function EmptyState({ onBack }: { onBack: () => void }) {
  return (
    <View style={styles.emptyWrap}>
      <Zap size={32} color={COLORS.sage} strokeWidth={1.5} />
      <Text style={styles.emptyTitle}>
        Choose a destination first
      </Text>
      <Text style={styles.emptySubtitle}>
        Generate a trip from the Plan tab, then open Anti-Itinerary mode.
      </Text>
      <Pressable onPress={onBack} style={styles.emptyBtn}>
        <Text style={styles.emptyBtnText}>Go to Plan</Text>
      </Pressable>
    </View>
  );
}

// ---------------------------------------------------------------------------
// Helper — wraps Claude anti-trip generation into AntiItinerary shape
// ---------------------------------------------------------------------------

async function generateAntiTripWrapper(
  destination: string,
  days: number,
  style: string,
): Promise<AntiItinerary> {
  const response = await generateAntiTrip(destination, days, style);
  const content = response.content;

  // Parse the response into days
  const parsedDays: AntiItineraryDay[] = [];
  const philosophies = [
    'The best trips have room to breathe.',
    'Leave space for what you cannot plan.',
    'Wander without direction. Find without searching.',
    'The gaps are where the stories happen.',
    'Not every hour needs a plan.',
  ];

  for (let d = 1; d <= days; d++) {
    const dayRegex = new RegExp(
      `Day\\s*${d}[:\\s]*([\\s\\S]*?)(?=Day\\s*${d + 1}[:\\s]|$)`,
      'i',
    );
    const match = content.match(dayRegex);
    const section = match?.[1]?.trim() ?? '';

    const anchors: AnchorMoment[] = [];
    const lines = section
      .split('\n')
      .map((l: string) => l.trim())
      .filter((l: string) => l.length > 10);

    for (const line of lines.slice(0, 3)) {
      const timePart = line.match(/(\d{1,2}:\d{2}\s*(?:AM|PM))/i);
      const rest = line
        .replace(/(\d{1,2}:\d{2}\s*(?:AM|PM))/i, '')
        .replace(/^[\s—–-]+/, '')
        .trim();

      if (rest) {
        const parts = rest.split(/\s*[—–]\s*/);
        anchors.push({
          time: timePart?.[1] ?? '10:00 AM',
          activity: parts[0] ?? rest,
          location: '',
          why: parts[1] ?? 'This defines the place.',
          isUnmissable: true,
          flexWindow: 60,
        });
      }
    }

    // Build blank spaces between anchors
    const spaces: BlankSpace[] = [];
    if (anchors.length === 0) {
      spaces.push(
        { startTime: '8:00 AM', endTime: '12:00 PM', label: 'morning wander', fillStrategy: 'serendipity' },
        { startTime: '12:00 PM', endTime: '5:00 PM', label: 'afternoon drift', fillStrategy: 'nearby-trending' },
        { startTime: '5:00 PM', endTime: '10:00 PM', label: 'evening explore', fillStrategy: 'food-discovery' },
      );
    } else {
      spaces.push({
        startTime: '8:00 AM',
        endTime: anchors[0].time,
        label: 'morning wander',
        fillStrategy: 'serendipity',
      });
      for (let i = 0; i < anchors.length - 1; i++) {
        spaces.push({
          startTime: anchors[i].time,
          endTime: anchors[i + 1].time,
          label: 'afternoon drift',
          fillStrategy: 'nearby-trending',
        });
      }
      spaces.push({
        startTime: anchors[anchors.length - 1].time,
        endTime: '10:00 PM',
        label: 'evening explore',
        fillStrategy: 'food-discovery',
      });
    }

    parsedDays.push({
      day: d,
      anchors,
      spaces,
      philosophy: philosophies[(d - 1) % philosophies.length],
    });
  }

  return {
    destination,
    days: parsedDays,
    totalDays: days,
    style,
  };
}

// ---------------------------------------------------------------------------
// Styles — ultra-minimal, lots of whitespace, poetry not spreadsheet
// ---------------------------------------------------------------------------

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: COLORS.bg,
  },

  // Header
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: SPACING.lg,
    paddingVertical: SPACING.md,
    gap: SPACING.md,
  },
  backBtn: {
    padding: SPACING.xs,
  },
  headerCenter: {
    flex: 1,
  },
  badge: {
    fontFamily: FONTS.mono,
    fontSize: 10,
    color: COLORS.sage,
    letterSpacing: 2,
  },
  headerDest: {
    fontFamily: FONTS.header,
    fontSize: 18,
    color: COLORS.cream,
    marginTop: 2,
  },

  // Day selector
  daySelector: {
    paddingHorizontal: SPACING.lg,
    paddingBottom: SPACING.md,
    gap: SPACING.sm,
  },
  dayPill: {
    width: 40,
    height: 40,
    borderRadius: 20,
    backgroundColor: COLORS.surface1,
    alignItems: 'center',
    justifyContent: 'center',
    borderWidth: 1,
    borderColor: COLORS.border,
  },
  dayPillActive: {
    backgroundColor: COLORS.sageSubtle,
    borderColor: COLORS.sageBorder,
  },
  dayPillText: {
    fontFamily: FONTS.mono,
    fontSize: 14,
    color: COLORS.muted,
  },
  dayPillTextActive: {
    color: COLORS.sage,
  },

  // Scroll
  scroll: {
    flex: 1,
  },
  scrollContent: {
    paddingHorizontal: SPACING.lg,
  },

  // Day number — large, mono, sage
  dayNumber: {
    fontFamily: FONTS.mono,
    fontSize: 64,
    color: COLORS.sage,
    opacity: 0.3,
    marginTop: SPACING.xl,
    marginBottom: SPACING.xs,
  },

  // Philosophy
  philosophy: {
    fontFamily: FONTS.body,
    fontSize: 15,
    color: COLORS.creamDim,
    lineHeight: 22,
    marginBottom: SPACING.xxl,
  },

  // Anchor card
  anchorCard: {
    marginBottom: SPACING.lg,
    paddingVertical: SPACING.lg,
    borderLeftWidth: 2,
    borderLeftColor: COLORS.sage,
    paddingLeft: SPACING.lg,
  },
  anchorTime: {
    fontFamily: FONTS.mono,
    fontSize: 12,
    color: COLORS.sage,
    letterSpacing: 1,
    marginBottom: SPACING.xs,
  },
  anchorActivity: {
    fontFamily: FONTS.header,
    fontSize: 18,
    color: COLORS.cream,
    lineHeight: 24,
    marginBottom: SPACING.xs,
  },
  anchorLocation: {
    fontFamily: FONTS.mono,
    fontSize: 11,
    color: COLORS.muted,
    marginBottom: SPACING.xs,
  },
  anchorWhy: {
    fontFamily: FONTS.body,
    fontSize: 14,
    color: COLORS.creamDim,
    lineHeight: 20,
  },
  flexBadge: {
    marginTop: SPACING.sm,
    alignSelf: 'flex-start',
    backgroundColor: COLORS.sageVeryFaint,
    borderRadius: RADIUS.sm,
    paddingHorizontal: SPACING.sm,
    paddingVertical: 2,
  },
  flexText: {
    fontFamily: FONTS.mono,
    fontSize: 10,
    color: COLORS.muted,
  },

  // Blank space card
  blankCard: {
    marginBottom: SPACING.xl,
    borderWidth: 1,
    borderColor: COLORS.border,
    borderStyle: 'dashed',
    borderRadius: RADIUS.md,
    padding: SPACING.lg,
  },
  blankHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: SPACING.sm,
  },
  blankLabel: {
    fontFamily: FONTS.body,
    fontSize: 15,
    color: COLORS.muted,
  },
  blankTime: {
    fontFamily: FONTS.mono,
    fontSize: 10,
    color: COLORS.muted,
    opacity: 0.6,
  },
  blankFilling: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: SPACING.sm,
    marginTop: SPACING.sm,
  },
  blankFillingText: {
    fontFamily: FONTS.body,
    fontSize: 13,
    color: COLORS.muted,
  },

  // Suggestions
  suggestionsWrap: {
    marginTop: SPACING.sm,
    gap: SPACING.sm,
  },
  suggestionRow: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: COLORS.surface1,
    borderRadius: RADIUS.sm,
    padding: SPACING.md,
    gap: SPACING.md,
  },
  suggestionLocked: {
    borderWidth: 1,
    borderColor: COLORS.sageBorder,
    backgroundColor: COLORS.sageVeryFaint,
  },
  suggestionContent: {
    flex: 1,
  },
  suggestionText: {
    fontFamily: FONTS.bodyMedium,
    fontSize: 13,
    color: COLORS.cream,
    lineHeight: 18,
  },
  suggestionDetail: {
    fontFamily: FONTS.mono,
    fontSize: 11,
    color: COLORS.muted,
    marginTop: 2,
  },
  lockBtn: {
    padding: SPACING.xs,
  },

  // FAB
  fabWrap: {
    position: 'absolute',
    left: SPACING.lg,
    right: SPACING.lg,
    alignItems: 'center',
  },
  fab: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: COLORS.sage,
    borderRadius: RADIUS.pill,
    paddingVertical: 14,
    paddingHorizontal: SPACING.lg,
    gap: SPACING.sm,
    shadowColor: COLORS.black,
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.3,
    shadowRadius: 12,
    elevation: 8,
  },
  fabText: {
    fontFamily: FONTS.bodyMedium,
    fontSize: 14,
    color: COLORS.bg,
  },

  // Loading / Error
  loadingWrap: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
    gap: SPACING.md,
    paddingHorizontal: SPACING.xxl,
  },
  loadingText: {
    fontFamily: FONTS.bodyMedium,
    fontSize: 16,
    color: COLORS.cream,
    textAlign: 'center',
  },
  loadingSubtext: {
    fontFamily: FONTS.body,
    fontSize: 14,
    color: COLORS.muted,
    textAlign: 'center',
  },
  errorText: {
    fontFamily: FONTS.body,
    fontSize: 14,
    color: COLORS.coral,
    textAlign: 'center',
  },
  retryBtn: {
    backgroundColor: COLORS.surface1,
    borderRadius: RADIUS.pill,
    paddingVertical: SPACING.sm,
    paddingHorizontal: SPACING.lg,
    borderWidth: 1,
    borderColor: COLORS.border,
  },
  retryText: {
    fontFamily: FONTS.bodyMedium,
    fontSize: 14,
    color: COLORS.cream,
  },

  // Empty state
  emptyWrap: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
    gap: SPACING.md,
    paddingHorizontal: SPACING.xxl,
  },
  emptyTitle: {
    fontFamily: FONTS.header,
    fontSize: 20,
    color: COLORS.cream,
    textAlign: 'center',
  },
  emptySubtitle: {
    fontFamily: FONTS.body,
    fontSize: 14,
    color: COLORS.muted,
    textAlign: 'center',
    lineHeight: 20,
  },
  emptyBtn: {
    backgroundColor: COLORS.sage,
    borderRadius: RADIUS.pill,
    paddingVertical: SPACING.sm,
    paddingHorizontal: SPACING.xl,
    marginTop: SPACING.md,
  },
  emptyBtnText: {
    fontFamily: FONTS.bodyMedium,
    fontSize: 14,
    color: COLORS.bg,
  },
});
