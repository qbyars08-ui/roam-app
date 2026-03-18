// =============================================================================
// ROAM — Web-Only Trip Timeline Editor
// Horizontal day-by-day timeline with morning/afternoon/evening slots
// =============================================================================
import React, { useCallback, useMemo, useRef, useState } from 'react';
import {
  Modal,
  Platform,
  Pressable,
  ScrollView,
  StyleSheet,
  Text,
  TextInput,
  View,
  type TextStyle,
  type ViewStyle,
} from 'react-native';
import {
  ChevronDown,
  ChevronUp,
  Clock,
  DollarSign,
  MapPin,
  Plus,
  Thermometer,
  Cloud,
  Sun,
  CloudRain,
  CloudSnow,
  CloudLightning,
  Lightbulb,
  Star,
} from 'lucide-react-native';
import { COLORS, FONTS, SPACING, RADIUS } from '../../lib/constants';
import type { Itinerary, ItineraryDay, TimeSlotActivity } from '../../lib/types/itinerary';

// ---------------------------------------------------------------------------
// Types
// ---------------------------------------------------------------------------
interface WeatherDay {
  date: string;
  tempHigh: number;
  tempLow: number;
  condition: string;
}

interface TripTimelineProps {
  itinerary: Itinerary;
  destination: string;
  onActivityEdit?: (dayIndex: number, slot: string, newActivity: string) => void;
  weatherDays?: WeatherDay[];
  compact?: boolean;
}

type SlotKey = 'morning' | 'afternoon' | 'evening';

// ---------------------------------------------------------------------------
// Guard: web only
// ---------------------------------------------------------------------------
if (Platform.OS !== 'web') {
  // eslint-disable-next-line @typescript-eslint/no-unused-vars
  const _noop = null;
}

// ---------------------------------------------------------------------------
// Helpers
// ---------------------------------------------------------------------------
const SLOT_LABELS: Record<SlotKey, string> = {
  morning: 'Morning',
  afternoon: 'Afternoon',
  evening: 'Evening',
};

const SLOT_TIME_RANGES: Record<SlotKey, string> = {
  morning: '8 AM - 12 PM',
  afternoon: '12 PM - 6 PM',
  evening: '6 PM - 11 PM',
};

const COLUMN_WIDTH = 300;
const COLUMN_WIDTH_COMPACT = 240;

function getWeatherIcon(condition: string) {
  const c = condition.toLowerCase();
  if (c.includes('rain') || c.includes('drizzle')) return CloudRain;
  if (c.includes('snow') || c.includes('sleet')) return CloudSnow;
  if (c.includes('thunder') || c.includes('storm')) return CloudLightning;
  if (c.includes('cloud') || c.includes('overcast')) return Cloud;
  return Sun;
}

function parseCostNumber(cost: string): number {
  const match = cost.match(/[\d,.]+/);
  if (!match) return 0;
  return parseFloat(match[0].replace(/,/g, ''));
}

// ---------------------------------------------------------------------------
// Sub-components
// ---------------------------------------------------------------------------

function WeatherBadge({ weather }: { weather: WeatherDay }) {
  const Icon = getWeatherIcon(weather.condition);
  return (
    <View style={badgeStyles.container}>
      <Icon size={14} color={COLORS.accent} strokeWidth={1.5} />
      <Text style={badgeStyles.temp}>
        {Math.round(weather.tempHigh)}/{Math.round(weather.tempLow)}
      </Text>
    </View>
  );
}

const badgeStyles = StyleSheet.create({
  container: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
    backgroundColor: COLORS.sageVeryFaint,
    borderRadius: RADIUS.pill,
    paddingHorizontal: 8,
    paddingVertical: 3,
    borderWidth: 1,
    borderColor: COLORS.sageFaint,
  } as ViewStyle,
  temp: {
    fontFamily: FONTS.mono,
    fontSize: 11,
    color: COLORS.accent,
  } as TextStyle,
});

// ---------------------------------------------------------------------------
// Activity Card
// ---------------------------------------------------------------------------
function ActivityCard({
  activity,
  slotKey,
  compact,
}: {
  activity: TimeSlotActivity;
  slotKey: SlotKey;
  compact?: boolean;
}) {
  const [expanded, setExpanded] = useState(false);

  const toggleExpanded = useCallback(() => {
    setExpanded((prev) => !prev);
  }, []);

  const ExpandIcon = expanded ? ChevronUp : ChevronDown;

  return (
    <Pressable
      onPress={toggleExpanded}
      style={({ pressed }) => [
        cardStyles.container,
        pressed && cardStyles.pressed,
      ]}
    >
      {/* Slot label pill */}
      <View style={cardStyles.slotLabel}>
        <Text style={cardStyles.slotLabelText}>{SLOT_LABELS[slotKey]}</Text>
      </View>

      {/* Activity name */}
      <Text
        style={[cardStyles.activityName, compact && cardStyles.activityNameCompact]}
        numberOfLines={expanded ? undefined : 2}
      >
        {activity.activity}
      </Text>

      {/* Location row */}
      <View style={cardStyles.metaRow}>
        <MapPin size={12} color={COLORS.muted} strokeWidth={1.5} />
        <Text style={cardStyles.metaText} numberOfLines={1}>
          {activity.location}
        </Text>
      </View>

      {/* Time + Cost row */}
      <View style={cardStyles.metaRow}>
        {activity.time ? (
          <>
            <Clock size={12} color={COLORS.muted} strokeWidth={1.5} />
            <Text style={cardStyles.metaText}>{activity.time}</Text>
            <View style={cardStyles.metaDot} />
          </>
        ) : null}
        <DollarSign size={12} color={COLORS.muted} strokeWidth={1.5} />
        <Text style={cardStyles.metaText}>{activity.cost}</Text>
      </View>

      {/* Expand toggle */}
      <View style={cardStyles.expandRow}>
        <ExpandIcon size={14} color={COLORS.muted} strokeWidth={1.5} />
      </View>

      {/* Expanded details */}
      {expanded && (
        <View style={cardStyles.expandedContent}>
          {activity.tip ? (
            <View style={cardStyles.tipRow}>
              <Lightbulb size={12} color={COLORS.action} strokeWidth={1.5} />
              <Text style={cardStyles.tipText}>{activity.tip}</Text>
            </View>
          ) : null}
          {activity.neighborhood ? (
            <View style={cardStyles.tipRow}>
              <Star size={12} color={COLORS.action} strokeWidth={1.5} />
              <Text style={cardStyles.tipText}>{activity.neighborhood}</Text>
            </View>
          ) : null}
          {activity.duration ? (
            <View style={cardStyles.tipRow}>
              <Clock size={12} color={COLORS.action} strokeWidth={1.5} />
              <Text style={cardStyles.tipText}>{activity.duration} min</Text>
            </View>
          ) : null}
          {activity.transitToNext ? (
            <View style={cardStyles.tipRow}>
              <MapPin size={12} color={COLORS.action} strokeWidth={1.5} />
              <Text style={cardStyles.tipText}>{activity.transitToNext}</Text>
            </View>
          ) : null}
        </View>
      )}
    </Pressable>
  );
}

const cardStyles = StyleSheet.create({
  container: {
    backgroundColor: COLORS.surface1,
    borderRadius: RADIUS.md,
    borderWidth: 1,
    borderColor: COLORS.border,
    padding: SPACING.sm,
    marginBottom: SPACING.sm,
  } as ViewStyle,
  pressed: {
    opacity: 0.85,
  } as ViewStyle,
  slotLabel: {
    alignSelf: 'flex-start',
    backgroundColor: COLORS.sageVeryFaint,
    borderRadius: RADIUS.pill,
    paddingHorizontal: 8,
    paddingVertical: 2,
    marginBottom: 6,
  } as ViewStyle,
  slotLabelText: {
    fontFamily: FONTS.mono,
    fontSize: 10,
    color: COLORS.action,
    textTransform: 'uppercase',
    letterSpacing: 0.8,
  } as TextStyle,
  activityName: {
    fontFamily: FONTS.headerMedium,
    fontSize: 14,
    color: COLORS.accent,
    marginBottom: 6,
    lineHeight: 20,
  } as TextStyle,
  activityNameCompact: {
    fontSize: 12,
    lineHeight: 17,
  } as TextStyle,
  metaRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
    marginBottom: 3,
  } as ViewStyle,
  metaText: {
    fontFamily: FONTS.body,
    fontSize: 11,
    color: COLORS.muted,
    flexShrink: 1,
  } as TextStyle,
  metaDot: {
    width: 3,
    height: 3,
    borderRadius: 1.5,
    backgroundColor: COLORS.muted,
    opacity: 0.5,
    marginHorizontal: 2,
  } as ViewStyle,
  expandRow: {
    alignItems: 'center',
    marginTop: 4,
  } as ViewStyle,
  expandedContent: {
    marginTop: 8,
    paddingTop: 8,
    borderTopWidth: 1,
    borderTopColor: COLORS.border,
    gap: 6,
  } as ViewStyle,
  tipRow: {
    flexDirection: 'row',
    alignItems: 'flex-start',
    gap: 6,
  } as ViewStyle,
  tipText: {
    fontFamily: FONTS.body,
    fontSize: 11,
    color: COLORS.creamDim,
    flex: 1,
    lineHeight: 16,
  } as TextStyle,
});

// ---------------------------------------------------------------------------
// Dashed Connector
// ---------------------------------------------------------------------------
function DashedConnector() {
  return (
    <View style={connectorStyles.container}>
      {[0, 1, 2, 3, 4].map((i) => (
        <View key={i} style={connectorStyles.dash} />
      ))}
    </View>
  );
}

const connectorStyles = StyleSheet.create({
  container: {
    alignItems: 'center',
    paddingVertical: 2,
    gap: 3,
  } as ViewStyle,
  dash: {
    width: 1,
    height: 4,
    backgroundColor: COLORS.sageMuted,
    borderRadius: 1,
  } as ViewStyle,
});

// ---------------------------------------------------------------------------
// Add Activity Modal
// ---------------------------------------------------------------------------
function AddActivityModal({
  visible,
  onClose,
  onSubmit,
  slotKey,
  dayNumber,
}: {
  visible: boolean;
  onClose: () => void;
  onSubmit: (text: string) => void;
  slotKey: SlotKey;
  dayNumber: number;
}) {
  const [text, setText] = useState('');

  const handleSubmit = useCallback(() => {
    const trimmed = text.trim();
    if (trimmed.length === 0) return;
    onSubmit(trimmed);
    setText('');
    onClose();
  }, [text, onSubmit, onClose]);

  const handleClose = useCallback(() => {
    setText('');
    onClose();
  }, [onClose]);

  return (
    <Modal visible={visible} transparent animationType="fade">
      <Pressable style={modalStyles.overlay} onPress={handleClose}>
        <Pressable style={modalStyles.content} onPress={() => {}}>
          <Text style={modalStyles.title}>
            Add Activity - Day {dayNumber} {SLOT_LABELS[slotKey]}
          </Text>
          <TextInput
            style={modalStyles.input}
            value={text}
            onChangeText={setText}
            placeholder="Describe the activity..."
            placeholderTextColor={COLORS.muted}
            multiline
            autoFocus
          />
          <View style={modalStyles.actions}>
            <Pressable onPress={handleClose} style={modalStyles.cancelBtn}>
              <Text style={modalStyles.cancelText}>Cancel</Text>
            </Pressable>
            <Pressable
              onPress={handleSubmit}
              style={[
                modalStyles.submitBtn,
                text.trim().length === 0 && modalStyles.submitBtnDisabled,
              ]}
            >
              <Text style={modalStyles.submitText}>Add</Text>
            </Pressable>
          </View>
        </Pressable>
      </Pressable>
    </Modal>
  );
}

const modalStyles = StyleSheet.create({
  overlay: {
    flex: 1,
    backgroundColor: COLORS.overlay,
    justifyContent: 'center',
    alignItems: 'center',
    padding: SPACING.lg,
  } as ViewStyle,
  content: {
    backgroundColor: COLORS.surface2,
    borderRadius: RADIUS.md,
    padding: SPACING.lg,
    width: '100%',
    maxWidth: 400,
    borderWidth: 1,
    borderColor: COLORS.border,
  } as ViewStyle,
  title: {
    fontFamily: FONTS.headerMedium,
    fontSize: 16,
    color: COLORS.accent,
    marginBottom: SPACING.md,
  } as TextStyle,
  input: {
    backgroundColor: COLORS.surface1,
    borderRadius: RADIUS.sm,
    borderWidth: 1,
    borderColor: COLORS.border,
    padding: SPACING.sm,
    fontFamily: FONTS.body,
    fontSize: 14,
    color: COLORS.accent,
    minHeight: 80,
    textAlignVertical: 'top',
    marginBottom: SPACING.md,
  } as TextStyle,
  actions: {
    flexDirection: 'row',
    justifyContent: 'flex-end',
    gap: SPACING.sm,
  } as ViewStyle,
  cancelBtn: {
    paddingHorizontal: SPACING.md,
    paddingVertical: SPACING.sm,
    borderRadius: RADIUS.pill,
    backgroundColor: COLORS.surface1,
    borderWidth: 1,
    borderColor: COLORS.border,
  } as ViewStyle,
  cancelText: {
    fontFamily: FONTS.bodyMedium,
    fontSize: 13,
    color: COLORS.muted,
  } as TextStyle,
  submitBtn: {
    paddingHorizontal: SPACING.md,
    paddingVertical: SPACING.sm,
    borderRadius: RADIUS.pill,
    backgroundColor: COLORS.action,
  } as ViewStyle,
  submitBtnDisabled: {
    opacity: 0.4,
  } as ViewStyle,
  submitText: {
    fontFamily: FONTS.bodyMedium,
    fontSize: 13,
    color: COLORS.bg,
  } as TextStyle,
});

// ---------------------------------------------------------------------------
// Day Column
// ---------------------------------------------------------------------------
function DayColumn({
  day,
  dayIndex,
  weather,
  isCurrentDay,
  compact,
  onActivityEdit,
}: {
  day: ItineraryDay;
  dayIndex: number;
  weather?: WeatherDay;
  isCurrentDay: boolean;
  compact?: boolean;
  onActivityEdit?: (dayIndex: number, slot: string, newActivity: string) => void;
}) {
  const [addModalSlot, setAddModalSlot] = useState<SlotKey | null>(null);

  const columnWidth = compact ? COLUMN_WIDTH_COMPACT : COLUMN_WIDTH;

  const totalCost = useMemo(() => {
    const slots: SlotKey[] = ['morning', 'afternoon', 'evening'];
    return slots.reduce((sum, s) => sum + parseCostNumber(day[s].cost), 0);
  }, [day]);

  const handleAddActivity = useCallback(
    (slotKey: SlotKey) => {
      setAddModalSlot(slotKey);
    },
    [],
  );

  const handleSubmitActivity = useCallback(
    (text: string) => {
      if (addModalSlot && onActivityEdit) {
        onActivityEdit(dayIndex, addModalSlot, text);
      }
    },
    [addModalSlot, dayIndex, onActivityEdit],
  );

  const handleCloseModal = useCallback(() => {
    setAddModalSlot(null);
  }, []);

  const slots: SlotKey[] = ['morning', 'afternoon', 'evening'];

  return (
    <View
      style={[
        colStyles.container,
        { width: columnWidth },
        isCurrentDay && colStyles.currentDay,
      ]}
    >
      {/* Day header */}
      <View style={colStyles.header}>
        <View style={colStyles.headerTop}>
          <Text style={colStyles.dayNumber}>Day {day.day}</Text>
          {weather ? <WeatherBadge weather={weather} /> : null}
        </View>
        <Text style={colStyles.theme} numberOfLines={1}>
          {day.theme}
        </Text>
      </View>

      {/* Time slot labels */}
      <View style={colStyles.timeLabels}>
        {slots.map((slot) => (
          <Text key={slot} style={colStyles.timeLabel}>
            {SLOT_TIME_RANGES[slot]}
          </Text>
        ))}
      </View>

      {/* Activity cards with connectors */}
      <View style={colStyles.cardStack}>
        {slots.map((slot, idx) => (
          <React.Fragment key={slot}>
            <ActivityCard
              activity={day[slot]}
              slotKey={slot}
              compact={compact}
            />
            {idx < slots.length - 1 && <DashedConnector />}
          </React.Fragment>
        ))}
      </View>

      {/* Add activity buttons */}
      {onActivityEdit ? (
        <View style={colStyles.addButtons}>
          {slots.map((slot) => (
            <Pressable
              key={slot}
              onPress={() => handleAddActivity(slot)}
              style={({ pressed }) => [
                colStyles.addBtn,
                pressed && colStyles.addBtnPressed,
              ]}
            >
              <Plus size={12} color={COLORS.action} strokeWidth={1.5} />
              <Text style={colStyles.addBtnText}>Add to {SLOT_LABELS[slot].toLowerCase()}</Text>
            </Pressable>
          ))}
        </View>
      ) : null}

      {/* Daily cost footer */}
      <View style={colStyles.footer}>
        <DollarSign size={14} color={COLORS.accent} strokeWidth={1.5} />
        <Text style={colStyles.footerCost}>
          {day.dailyCost || `$${totalCost}`}
        </Text>
        <Text style={colStyles.footerLabel}>daily total</Text>
      </View>

      {/* Add Activity Modal */}
      {addModalSlot !== null && (
        <AddActivityModal
          visible={addModalSlot !== null}
          onClose={handleCloseModal}
          onSubmit={handleSubmitActivity}
          slotKey={addModalSlot}
          dayNumber={day.day}
        />
      )}
    </View>
  );
}

const colStyles = StyleSheet.create({
  container: {
    backgroundColor: COLORS.bg,
    borderRadius: RADIUS.md,
    borderWidth: 1,
    borderColor: COLORS.border,
    padding: SPACING.sm,
    marginRight: SPACING.sm,
    flexShrink: 0,
  } as ViewStyle,
  currentDay: {
    borderColor: COLORS.sageBorder,
    borderWidth: 2,
  } as ViewStyle,
  header: {
    marginBottom: SPACING.sm,
    paddingBottom: SPACING.sm,
    borderBottomWidth: 1,
    borderBottomColor: COLORS.border,
  } as ViewStyle,
  headerTop: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 4,
  } as ViewStyle,
  dayNumber: {
    fontFamily: FONTS.header,
    fontSize: 16,
    color: COLORS.accent,
  } as TextStyle,
  theme: {
    fontFamily: FONTS.body,
    fontSize: 12,
    color: COLORS.muted,
  } as TextStyle,
  timeLabels: {
    marginBottom: SPACING.xs,
    gap: 2,
  } as ViewStyle,
  timeLabel: {
    fontFamily: FONTS.mono,
    fontSize: 9,
    color: COLORS.muted,
    opacity: 0.5,
  } as TextStyle,
  cardStack: {
    flex: 1,
  } as ViewStyle,
  addButtons: {
    marginTop: SPACING.sm,
    gap: 4,
  } as ViewStyle,
  addBtn: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
    paddingVertical: 4,
    paddingHorizontal: 8,
    borderRadius: RADIUS.pill,
    borderWidth: 1,
    borderColor: COLORS.sageFaint,
    borderStyle: 'dashed',
  } as ViewStyle,
  addBtnPressed: {
    backgroundColor: COLORS.sageVeryFaint,
  } as ViewStyle,
  addBtnText: {
    fontFamily: FONTS.body,
    fontSize: 11,
    color: COLORS.action,
  } as TextStyle,
  footer: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
    marginTop: SPACING.sm,
    paddingTop: SPACING.sm,
    borderTopWidth: 1,
    borderTopColor: COLORS.border,
  } as ViewStyle,
  footerCost: {
    fontFamily: FONTS.header,
    fontSize: 14,
    color: COLORS.accent,
  } as TextStyle,
  footerLabel: {
    fontFamily: FONTS.mono,
    fontSize: 10,
    color: COLORS.muted,
    marginLeft: 2,
  } as TextStyle,
});

// ---------------------------------------------------------------------------
// Main Component
// ---------------------------------------------------------------------------
export default function TripTimeline({
  itinerary,
  destination,
  onActivityEdit,
  weatherDays,
  compact = false,
}: TripTimelineProps) {
  // Guard: render nothing on native
  if (Platform.OS !== 'web') {
    return null;
  }

  const scrollRef = useRef<ScrollView>(null);
  const columnWidth = compact ? COLUMN_WIDTH_COMPACT : COLUMN_WIDTH;

  // Determine current day (day 1 = today heuristic — just highlight first day)
  const currentDayIndex = 0;

  const weatherMap = useMemo(() => {
    if (!weatherDays) return new Map<number, WeatherDay>();
    const map = new Map<number, WeatherDay>();
    weatherDays.forEach((w, i) => {
      map.set(i, w);
    });
    return map;
  }, [weatherDays]);

  const scrollToDay = useCallback(
    (dayIndex: number) => {
      scrollRef.current?.scrollTo({
        x: dayIndex * (columnWidth + SPACING.sm),
        animated: true,
      });
    },
    [columnWidth],
  );

  return (
    <View style={styles.root}>
      {/* Day nav pills */}
      <ScrollView
        horizontal
        showsHorizontalScrollIndicator={false}
        style={styles.navRow}
        contentContainerStyle={styles.navContent}
      >
        {itinerary.days.map((day, idx) => (
          <Pressable
            key={day.day}
            onPress={() => scrollToDay(idx)}
            style={({ pressed }) => [
              styles.navPill,
              idx === currentDayIndex && styles.navPillActive,
              pressed && styles.navPillPressed,
            ]}
          >
            <Text
              style={[
                styles.navPillText,
                idx === currentDayIndex && styles.navPillTextActive,
              ]}
            >
              Day {day.day}
            </Text>
          </Pressable>
        ))}
      </ScrollView>

      {/* Destination label */}
      <View style={styles.destRow}>
        <MapPin size={14} color={COLORS.action} strokeWidth={1.5} />
        <Text style={styles.destText}>{destination}</Text>
        <View style={styles.destDivider} />
        <Text style={styles.destDays}>
          {itinerary.days.length} days
        </Text>
        <View style={styles.destDivider} />
        <Text style={styles.destBudget}>{itinerary.totalBudget}</Text>
      </View>

      {/* Horizontal scrollable timeline */}
      <ScrollView
        ref={scrollRef}
        horizontal
        showsHorizontalScrollIndicator={false}
        contentContainerStyle={styles.timelineContent}
        style={styles.timelineScroll}
      >
        {itinerary.days.map((day, idx) => (
          <DayColumn
            key={day.day}
            day={day}
            dayIndex={idx}
            weather={weatherMap.get(idx)}
            isCurrentDay={idx === currentDayIndex}
            compact={compact}
            onActivityEdit={onActivityEdit}
          />
        ))}
      </ScrollView>
    </View>
  );
}

// ---------------------------------------------------------------------------
// Styles
// ---------------------------------------------------------------------------
const styles = StyleSheet.create({
  root: {
    flex: 1,
    backgroundColor: COLORS.bg,
  } as ViewStyle,
  navRow: {
    maxHeight: 44,
    borderBottomWidth: 1,
    borderBottomColor: COLORS.border,
  } as ViewStyle,
  navContent: {
    paddingHorizontal: SPACING.md,
    paddingVertical: SPACING.sm,
    gap: SPACING.xs,
    alignItems: 'center',
  } as ViewStyle,
  navPill: {
    paddingHorizontal: SPACING.md,
    paddingVertical: 4,
    borderRadius: RADIUS.pill,
    backgroundColor: COLORS.surface1,
    borderWidth: 1,
    borderColor: COLORS.border,
    marginRight: SPACING.xs,
  } as ViewStyle,
  navPillActive: {
    backgroundColor: COLORS.sageLight,
    borderColor: COLORS.sageBorder,
  } as ViewStyle,
  navPillPressed: {
    opacity: 0.7,
  } as ViewStyle,
  navPillText: {
    fontFamily: FONTS.mono,
    fontSize: 12,
    color: COLORS.muted,
  } as TextStyle,
  navPillTextActive: {
    color: COLORS.accent,
  } as TextStyle,
  destRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
    paddingHorizontal: SPACING.md,
    paddingVertical: SPACING.sm,
  } as ViewStyle,
  destText: {
    fontFamily: FONTS.headerMedium,
    fontSize: 14,
    color: COLORS.accent,
  } as TextStyle,
  destDivider: {
    width: 1,
    height: 14,
    backgroundColor: COLORS.border,
    marginHorizontal: 4,
  } as ViewStyle,
  destDays: {
    fontFamily: FONTS.mono,
    fontSize: 12,
    color: COLORS.muted,
  } as TextStyle,
  destBudget: {
    fontFamily: FONTS.mono,
    fontSize: 12,
    color: COLORS.action,
  } as TextStyle,
  timelineScroll: {
    flex: 1,
  } as ViewStyle,
  timelineContent: {
    padding: SPACING.md,
    paddingRight: SPACING.xl,
  } as ViewStyle,
});
