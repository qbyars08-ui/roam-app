// =============================================================================
// ROAM — Trip Timeline Screen
// Vertical timeline view of the entire trip with drag-to-reorder days
// =============================================================================
import React, { useCallback, useMemo, useState } from 'react';
import {
  Linking,
  Platform,
  Pressable,
  ScrollView,
  StyleSheet,
  Text,
  View,
  type TextStyle,
  type ViewStyle,
} from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { useLocalSearchParams, useRouter } from 'expo-router';
import {
  UtensilsCrossed,
  Landmark,
  Mountain,
  Train,
  Palmtree,
  ChevronLeft,
  MapPin,
  GripVertical,
  ChevronDown,
  ChevronUp,
} from 'lucide-react-native';
import * as Haptics from '../lib/haptics';
import { useTranslation } from 'react-i18next';

import { COLORS, FONTS, SPACING, RADIUS } from '../lib/constants';
import { useAppStore } from '../lib/store';
import { parseItinerary, type Itinerary } from '../lib/types/itinerary';
import {
  buildTimeline,
  reorderDays,
  getTimelineStats,
  type TimelineEvent,
  type TimeSlot,
  type ActivityCategory,
} from '../lib/timeline-engine';

// ---------------------------------------------------------------------------
// Helpers
// ---------------------------------------------------------------------------

const SLOT_COLORS: Record<TimeSlot, string> = {
  morning: COLORS.sage,
  afternoon: COLORS.gold,
  evening: COLORS.coral,
};

const SLOT_LABELS: Record<TimeSlot, string> = {
  morning: 'Morning',
  afternoon: 'Afternoon',
  evening: 'Evening',
};

function CategoryIcon({ category, size = 16 }: { category: ActivityCategory; size?: number }) {
  const color = COLORS.creamDim;
  const sw = 1.5;
  switch (category) {
    case 'food':
      return <UtensilsCrossed size={size} color={color} strokeWidth={sw} />;
    case 'culture':
      return <Landmark size={size} color={color} strokeWidth={sw} />;
    case 'adventure':
      return <Mountain size={size} color={color} strokeWidth={sw} />;
    case 'transport':
      return <Train size={size} color={color} strokeWidth={sw} />;
    case 'relaxation':
      return <Palmtree size={size} color={color} strokeWidth={sw} />;
    default:
      return <Landmark size={size} color={color} strokeWidth={sw} />;
  }
}

// ---------------------------------------------------------------------------
// Activity Card
// ---------------------------------------------------------------------------

interface ActivityCardProps {
  event: TimelineEvent;
  onPress: () => void;
  expanded: boolean;
}

function ActivityCard({ event, onPress, expanded }: ActivityCardProps) {
  const dotColor = SLOT_COLORS[event.slot];

  return (
    <Pressable
      onPress={onPress}
      style={({ pressed }) => [
        styles.activityCard,
        { opacity: pressed ? 0.85 : 1 },
      ]}
    >
      {/* Dot + slot label */}
      <View style={styles.activityHeader}>
        <View style={[styles.slotDot, { backgroundColor: dotColor }]} />
        <Text style={styles.slotLabel}>{SLOT_LABELS[event.slot]}</Text>
        <View style={styles.categoryIconWrap}>
          <CategoryIcon category={event.category} />
        </View>
        {expanded ? (
          <ChevronUp size={14} color={COLORS.muted} strokeWidth={1.5} />
        ) : (
          <ChevronDown size={14} color={COLORS.muted} strokeWidth={1.5} />
        )}
      </View>

      {/* Main info */}
      <View style={styles.activityBody}>
        <Text style={styles.activityTime}>{event.time}</Text>
        <Text style={styles.activityName} numberOfLines={expanded ? undefined : 1}>
          {event.activity}
        </Text>
        <View style={styles.activityMeta}>
          <MapPin size={12} color={COLORS.muted} strokeWidth={1.5} />
          <Text style={styles.activityLocation} numberOfLines={1}>
            {event.location}
          </Text>
        </View>
        {event.cost !== '$0' && event.cost !== 'Free' && (
          <Text style={styles.activityCost}>{event.cost}</Text>
        )}
      </View>

      {/* Expanded details */}
      {expanded && (
        <View style={styles.expandedSection}>
          {event.tip ? (
            <Text style={styles.expandedTip}>{event.tip}</Text>
          ) : null}
          {event.neighborhood ? (
            <Text style={styles.expandedNeighborhood}>
              {event.neighborhood}
            </Text>
          ) : null}
          {event.transitToNext ? (
            <Text style={styles.expandedTransit}>
              Next: {event.transitToNext}
            </Text>
          ) : null}
          {event.address ? (
            <Pressable
              onPress={() => {
                const query = encodeURIComponent(event.address ?? event.location);
                const url = Platform.select({
                  ios: `maps:0,0?q=${query}`,
                  android: `geo:0,0?q=${query}`,
                  default: `https://www.google.com/maps/search/?api=1&query=${query}`,
                });
                Linking.openURL(url);
              }}
              style={({ pressed }) => [
                styles.mapsButton,
                { opacity: pressed ? 0.7 : 1 },
              ]}
            >
              <MapPin size={14} color={COLORS.sage} strokeWidth={1.5} />
              <Text style={styles.mapsButtonText}>Open in Maps</Text>
            </Pressable>
          ) : null}
        </View>
      )}
    </Pressable>
  );
}

// ---------------------------------------------------------------------------
// Main Screen
// ---------------------------------------------------------------------------

export default function TripTimelineScreen() {
  const insets = useSafeAreaInsets();
  const router = useRouter();
  const { t } = useTranslation();
  const params = useLocalSearchParams<{ data?: string; tripId?: string }>();
  const trips = useAppStore((s) => s.trips);

  // Parse itinerary from params
  const itinerary = useMemo<Itinerary | null>(() => {
    if (params.data) {
      try {
        return parseItinerary(params.data);
      } catch {
        return null;
      }
    }
    if (params.tripId) {
      const found = trips.find((tr) => tr.id === params.tripId);
      if (found?.itinerary) {
        try {
          return parseItinerary(found.itinerary);
        } catch {
          return null;
        }
      }
    }
    return null;
  }, [params.data, params.tripId, trips]);

  const [currentItinerary, setCurrentItinerary] = useState<Itinerary | null>(
    itinerary,
  );
  const [expandedKey, setExpandedKey] = useState<string | null>(null);

  const timeline = useMemo(
    () => (currentItinerary ? buildTimeline(currentItinerary) : []),
    [currentItinerary],
  );

  const stats = useMemo(
    () => getTimelineStats(timeline),
    [timeline],
  );

  // Group events by day
  const eventsByDay = useMemo(() => {
    const grouped = new Map<number, TimelineEvent[]>();
    for (const ev of timeline) {
      const list = grouped.get(ev.dayIndex) ?? [];
      list.push(ev);
      grouped.set(ev.dayIndex, list);
    }
    return grouped;
  }, [timeline]);

  const handleToggleExpand = useCallback((dayIndex: number, slot: TimeSlot) => {
    const key = `${dayIndex}-${slot}`;
    setExpandedKey((prev) => (prev === key ? null : key));
    Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
  }, []);

  const handleDayReorder = useCallback(
    (fromIndex: number, toIndex: number) => {
      if (!currentItinerary) return;
      Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Medium);
      setCurrentItinerary(reorderDays(currentItinerary, fromIndex, toIndex));
    },
    [currentItinerary],
  );

  if (!currentItinerary) {
    return (
      <View style={[styles.container, { paddingTop: insets.top }]}>
        <Text style={styles.errorText}>No itinerary data found.</Text>
      </View>
    );
  }

  const dayCount = currentItinerary.days.length;

  return (
    <View style={[styles.container, { paddingTop: insets.top }]}>
      {/* Header */}
      <View style={styles.header}>
        <Pressable
          onPress={() => router.back()}
          hitSlop={12}
          style={({ pressed }) => ({ opacity: pressed ? 0.6 : 1 })}
        >
          <ChevronLeft size={24} color={COLORS.cream} strokeWidth={1.5} />
        </Pressable>
        <View style={styles.headerCenter}>
          <Text style={styles.headerTitle}>Timeline</Text>
          <Text style={styles.headerSubtitle}>
            {currentItinerary.destination}
          </Text>
        </View>
        <View style={{ width: 24 }} />
      </View>

      {/* Timeline content */}
      <ScrollView
        style={styles.scrollView}
        contentContainerStyle={[
          styles.scrollContent,
          { paddingBottom: insets.bottom + 80 },
        ]}
        showsVerticalScrollIndicator={false}
      >
        {Array.from({ length: dayCount }, (_, dayIdx) => {
          const day = currentItinerary.days[dayIdx];
          const dayEvents = eventsByDay.get(dayIdx) ?? [];
          const isLast = dayIdx === dayCount - 1;

          return (
            <View key={dayIdx} style={styles.dayRow}>
              {/* Timeline spine */}
              <View style={styles.spineColumn}>
                {/* Day node */}
                <View style={styles.dayNode}>
                  <Text style={styles.dayNumber}>{day.day}</Text>
                </View>
                {/* Vertical line (skip on last day) */}
                {!isLast && <View style={styles.spineLine} />}
              </View>

              {/* Day content */}
              <View style={styles.dayContent}>
                {/* Day header */}
                <View style={styles.dayHeader}>
                  <Text style={styles.dayTheme}>{day.theme}</Text>
                  <Pressable
                    onLongPress={() => {
                      if (dayIdx > 0) {
                        handleDayReorder(dayIdx, dayIdx - 1);
                      }
                    }}
                    delayLongPress={400}
                    hitSlop={8}
                    style={({ pressed }) => [
                      styles.gripHandle,
                      { opacity: pressed ? 0.5 : 0.3 },
                    ]}
                  >
                    <GripVertical size={16} color={COLORS.muted} strokeWidth={1.5} />
                  </Pressable>
                </View>

                {/* Activity cards */}
                {dayEvents.map((ev) => {
                  const key = `${ev.dayIndex}-${ev.slot}`;
                  return (
                    <ActivityCard
                      key={key}
                      event={ev}
                      expanded={expandedKey === key}
                      onPress={() => handleToggleExpand(ev.dayIndex, ev.slot)}
                    />
                  );
                })}
              </View>
            </View>
          );
        })}
      </ScrollView>

      {/* Stats bar */}
      <View style={[styles.statsBar, { paddingBottom: insets.bottom + 8 }]}>
        <View style={styles.statItem}>
          <Text style={styles.statValue}>{stats.totalActivities}</Text>
          <Text style={styles.statLabel}>Activities</Text>
        </View>
        <View style={styles.statDivider} />
        <View style={styles.statItem}>
          <Text style={styles.statValue}>
            ${Math.round(stats.totalCost)}
          </Text>
          <Text style={styles.statLabel}>Est. Cost</Text>
        </View>
        <View style={styles.statDivider} />
        <View style={styles.statItem}>
          <Text style={styles.statValue}>{dayCount}</Text>
          <Text style={styles.statLabel}>
            {dayCount === 1 ? 'Day' : 'Days'}
          </Text>
        </View>
        <View style={styles.statDivider} />
        <View style={styles.statItem}>
          <Text style={styles.statValue}>
            {stats.mostCommonCategory.charAt(0).toUpperCase() +
              stats.mostCommonCategory.slice(1)}
          </Text>
          <Text style={styles.statLabel}>Top Vibe</Text>
        </View>
      </View>
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

  errorText: {
    fontFamily: FONTS.body,
    fontSize: 16,
    color: COLORS.muted,
    textAlign: 'center',
    marginTop: 100,
  } as TextStyle,

  // Header
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: SPACING.md,
    paddingVertical: SPACING.sm,
    borderBottomWidth: 1,
    borderBottomColor: COLORS.border,
  } as ViewStyle,
  headerCenter: {
    flex: 1,
    alignItems: 'center',
  } as ViewStyle,
  headerTitle: {
    fontFamily: FONTS.header,
    fontSize: 18,
    color: COLORS.cream,
  } as TextStyle,
  headerSubtitle: {
    fontFamily: FONTS.mono,
    fontSize: 11,
    color: COLORS.muted,
    marginTop: 2,
  } as TextStyle,

  // Scroll
  scrollView: {
    flex: 1,
  } as ViewStyle,
  scrollContent: {
    paddingTop: SPACING.lg,
    paddingHorizontal: SPACING.md,
  } as ViewStyle,

  // Day row
  dayRow: {
    flexDirection: 'row',
    marginBottom: SPACING.xs,
  } as ViewStyle,

  // Spine column
  spineColumn: {
    width: 48,
    alignItems: 'center',
  } as ViewStyle,
  dayNode: {
    width: 44,
    height: 44,
    borderRadius: 22,
    backgroundColor: COLORS.sageSubtle,
    borderWidth: 2,
    borderColor: COLORS.sage,
    alignItems: 'center',
    justifyContent: 'center',
  } as ViewStyle,
  dayNumber: {
    fontFamily: FONTS.mono,
    fontSize: 20,
    color: COLORS.sage,
  } as TextStyle,
  spineLine: {
    width: 2,
    flex: 1,
    backgroundColor: COLORS.sage,
    opacity: 0.4,
    marginVertical: 4,
  } as ViewStyle,

  // Day content
  dayContent: {
    flex: 1,
    marginLeft: SPACING.sm,
    paddingBottom: SPACING.lg,
  } as ViewStyle,
  dayHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    marginBottom: SPACING.sm,
    paddingTop: SPACING.xs + 4,
  } as ViewStyle,
  dayTheme: {
    fontFamily: FONTS.headerMedium,
    fontSize: 16,
    color: COLORS.cream,
    flex: 1,
  } as TextStyle,
  gripHandle: {
    padding: 4,
  } as ViewStyle,

  // Activity card
  activityCard: {
    backgroundColor: COLORS.surface1,
    borderRadius: RADIUS.md,
    borderWidth: 1,
    borderColor: COLORS.border,
    padding: SPACING.sm + 4,
    marginBottom: SPACING.sm,
  } as ViewStyle,
  activityHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 6,
  } as ViewStyle,
  slotDot: {
    width: 8,
    height: 8,
    borderRadius: 4,
  } as ViewStyle,
  slotLabel: {
    fontFamily: FONTS.mono,
    fontSize: 10,
    color: COLORS.muted,
    marginLeft: 6,
    flex: 1,
    textTransform: 'uppercase',
    letterSpacing: 0.5,
  } as TextStyle,
  categoryIconWrap: {
    marginRight: 6,
  } as ViewStyle,
  activityBody: {
    marginLeft: 14,
  } as ViewStyle,
  activityTime: {
    fontFamily: FONTS.mono,
    fontSize: 12,
    color: COLORS.creamDim,
    marginBottom: 2,
  } as TextStyle,
  activityName: {
    fontFamily: FONTS.bodyMedium,
    fontSize: 16,
    color: COLORS.cream,
    marginBottom: 4,
  } as TextStyle,
  activityMeta: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
  } as ViewStyle,
  activityLocation: {
    fontFamily: FONTS.body,
    fontSize: 14,
    color: COLORS.muted,
    flex: 1,
  } as TextStyle,
  activityCost: {
    fontFamily: FONTS.mono,
    fontSize: 13,
    color: COLORS.gold,
    marginTop: 4,
  } as TextStyle,

  // Expanded section
  expandedSection: {
    marginTop: SPACING.sm,
    marginLeft: 14,
    paddingTop: SPACING.sm,
    borderTopWidth: 1,
    borderTopColor: COLORS.border,
  } as ViewStyle,
  expandedTip: {
    fontFamily: FONTS.body,
    fontSize: 13,
    color: COLORS.creamDim,
    lineHeight: 20,
    marginBottom: 6,
  } as TextStyle,
  expandedNeighborhood: {
    fontFamily: FONTS.mono,
    fontSize: 11,
    color: COLORS.muted,
    marginBottom: 4,
  } as TextStyle,
  expandedTransit: {
    fontFamily: FONTS.body,
    fontSize: 12,
    color: COLORS.muted,
    marginBottom: 8,
  } as TextStyle,
  mapsButton: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
    backgroundColor: COLORS.sageSubtle,
    paddingVertical: 6,
    paddingHorizontal: 12,
    borderRadius: RADIUS.pill,
    alignSelf: 'flex-start',
  } as ViewStyle,
  mapsButtonText: {
    fontFamily: FONTS.monoMedium,
    fontSize: 12,
    color: COLORS.sage,
  } as TextStyle,

  // Stats bar
  statsBar: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-around',
    backgroundColor: COLORS.surface1,
    borderTopWidth: 1,
    borderTopColor: COLORS.border,
    paddingTop: SPACING.sm + 4,
    paddingHorizontal: SPACING.md,
  } as ViewStyle,
  statItem: {
    alignItems: 'center',
  } as ViewStyle,
  statValue: {
    fontFamily: FONTS.mono,
    fontSize: 15,
    color: COLORS.cream,
  } as TextStyle,
  statLabel: {
    fontFamily: FONTS.body,
    fontSize: 11,
    color: COLORS.muted,
    marginTop: 2,
  } as TextStyle,
  statDivider: {
    width: 1,
    height: 28,
    backgroundColor: COLORS.border,
  } as ViewStyle,
});
