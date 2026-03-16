// =============================================================================
// ROAM — Trip Journal Screen
// Daily travel diary with mood tracking, highlights, tags, and notes.
// Creates deep engagement + content for sharing.
// =============================================================================
import React, { useCallback, useEffect, useMemo, useRef, useState } from 'react';
import {
  Animated,
  FlatList,
  KeyboardAvoidingView,
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
import { useLocalSearchParams, useRouter } from 'expo-router';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { useFocusEffect } from '@react-navigation/native';
import { LinearGradient } from 'expo-linear-gradient';
import { format, addDays, parseISO } from 'date-fns';
import {
  ArrowLeft,
  Plus,
  BookOpen,
  Calendar,
  Check,
  X,
  ChevronRight,
} from 'lucide-react-native';
import * as Haptics from '../lib/haptics';
import { COLORS, FONTS, SPACING, RADIUS } from '../lib/constants';
import { useAppStore, type Trip } from '../lib/store';
import {
  getJournalForTrip,
  saveJournalEntry,
  createJournalEntry,
  JOURNAL_MOODS,
  JOURNAL_TAGS,
  getMoodColor,
  getMoodLabel,
  computeTripVibeScore,
  type JournalEntry,
  type JournalMood,
} from '../lib/trip-journal';
import { track } from '../lib/analytics';
import { captureEvent } from '../lib/posthog';
import { withComingSoon } from '../lib/with-coming-soon';

// ---------------------------------------------------------------------------
// Mood Selector
// ---------------------------------------------------------------------------
function MoodSelector({
  selected,
  onSelect,
}: {
  selected: JournalMood | null;
  onSelect: (mood: JournalMood) => void;
}) {
  return (
    <View style={styles.moodRow}>
      {JOURNAL_MOODS.map((mood) => (
        <Pressable
          key={mood.id}
          onPress={() => {
            Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
            onSelect(mood.id);
          }}
          style={({ pressed }) => [
            styles.moodBtn,
            selected === mood.id && { borderColor: mood.color, backgroundColor: mood.color + '15' },
            { opacity: pressed ? 0.7 : 1 },
          ]}
        >
          <View style={[styles.moodDot, { backgroundColor: mood.color }]} />
          <Text
            style={[
              styles.moodLabel,
              selected === mood.id && { color: mood.color },
            ]}
          >
            {mood.label}
          </Text>
        </Pressable>
      ))}
    </View>
  );
}

// ---------------------------------------------------------------------------
// Tag Picker
// ---------------------------------------------------------------------------
function TagPicker({
  selected,
  onToggle,
}: {
  selected: string[];
  onToggle: (tag: string) => void;
}) {
  return (
    <View style={styles.tagsWrap}>
      {JOURNAL_TAGS.map((tag) => {
        const isSelected = selected.includes(tag);
        return (
          <Pressable
            key={tag}
            onPress={() => {
              Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
              onToggle(tag);
            }}
            style={({ pressed }) => [
              styles.tagChip,
              isSelected && styles.tagChipActive,
              { opacity: pressed ? 0.7 : 1 },
            ]}
          >
            <Text style={[styles.tagText, isSelected && styles.tagTextActive]}>
              {tag}
            </Text>
          </Pressable>
        );
      })}
    </View>
  );
}

// ---------------------------------------------------------------------------
// Day Card
// ---------------------------------------------------------------------------
function DayCard({
  entry,
  dayNumber,
  date,
  onPress,
}: {
  entry: JournalEntry | null;
  dayNumber: number;
  date: string;
  onPress: () => void;
}) {
  const dateStr = format(parseISO(date), 'EEE, MMM d');

  if (!entry) {
    return (
      <Pressable
        onPress={() => {
          Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
          onPress();
        }}
        style={({ pressed }) => [
          styles.dayCard,
          styles.dayCardEmpty,
          { opacity: pressed ? 0.85 : 1 },
        ]}
      >
        <View style={styles.dayCardHeader}>
          <Text style={styles.dayCardNumber}>Day {dayNumber}</Text>
          <Text style={styles.dayCardDate}>{dateStr}</Text>
        </View>
        <View style={styles.dayCardEmptyBody}>
          <Plus size={18} color={COLORS.creamMuted} strokeWidth={2} />
          <Text style={styles.dayCardEmptyText}>Add journal entry</Text>
        </View>
      </Pressable>
    );
  }

  const moodColor = getMoodColor(entry.mood);

  return (
    <Pressable
      onPress={() => {
        Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
        onPress();
      }}
      style={({ pressed }) => [
        styles.dayCard,
        { borderColor: moodColor + '40', opacity: pressed ? 0.85 : 1 },
      ]}
    >
      <View style={styles.dayCardHeader}>
        <View style={styles.dayCardHeaderLeft}>
          <View style={[styles.moodIndicator, { backgroundColor: moodColor }]} />
          <Text style={styles.dayCardNumber}>Day {dayNumber}</Text>
        </View>
        <Text style={styles.dayCardDate}>{dateStr}</Text>
      </View>
      {entry.highlight ? (
        <Text style={styles.dayCardHighlight} numberOfLines={2}>
          {entry.highlight}
        </Text>
      ) : null}
      {entry.tags.length > 0 && (
        <View style={styles.dayCardTags}>
          {entry.tags.slice(0, 4).map((tag) => (
            <View key={tag} style={styles.dayCardTag}>
              <Text style={styles.dayCardTagText}>{tag}</Text>
            </View>
          ))}
          {entry.tags.length > 4 && (
            <Text style={styles.dayCardTagMore}>+{entry.tags.length - 4}</Text>
          )}
        </View>
      )}
      <ChevronRight
        size={16}
        color={COLORS.creamMuted}
        strokeWidth={2}
        style={styles.dayCardChevron}
      />
    </Pressable>
  );
}

// ---------------------------------------------------------------------------
// Main Screen
// ---------------------------------------------------------------------------
function TripJournalScreen() {
  const router = useRouter();
  const insets = useSafeAreaInsets();
  const params = useLocalSearchParams<{ tripId?: string; destination?: string }>();
  const trips = useAppStore((s) => s.trips);

  const trip = useMemo(
    () => trips.find((t) => t.id === params.tripId) ?? null,
    [trips, params.tripId]
  );

  const [entries, setEntries] = useState<JournalEntry[]>([]);
  const [editModal, setEditModal] = useState(false);
  const [editDay, setEditDay] = useState(1);
  const [editDate, setEditDate] = useState('');
  const [editMood, setEditMood] = useState<JournalMood | null>(null);
  const [editHighlight, setEditHighlight] = useState('');
  const [editNotes, setEditNotes] = useState('');
  const [editTags, setEditTags] = useState<string[]>([]);
  const [editingEntry, setEditingEntry] = useState<JournalEntry | null>(null);

  useEffect(() => {
    track({ type: 'screen_view', screen: 'trip-journal' });
  }, []);

  useFocusEffect(
    useCallback(() => {
      if (!params.tripId) return;
      getJournalForTrip(params.tripId).then(setEntries).catch(() => setEntries([]));
    }, [params.tripId])
  );

  // Build day list from trip
  const dayList = useMemo(() => {
    if (!trip) return [];
    const startDate = parseISO(trip.createdAt);
    return Array.from({ length: trip.days }, (_, i) => ({
      dayNumber: i + 1,
      date: addDays(startDate, i).toISOString().split('T')[0],
      entry: entries.find((e) => e.dayNumber === i + 1) ?? null,
    }));
  }, [trip, entries]);

  const vibeScore = useMemo(() => computeTripVibeScore(entries), [entries]);

  const handleOpenDay = useCallback(
    (dayNumber: number, date: string, existingEntry: JournalEntry | null) => {
      setEditDay(dayNumber);
      setEditDate(date);
      if (existingEntry) {
        setEditingEntry(existingEntry);
        setEditMood(existingEntry.mood);
        setEditHighlight(existingEntry.highlight);
        setEditNotes(existingEntry.notes);
        setEditTags([...existingEntry.tags]);
      } else {
        setEditingEntry(null);
        setEditMood(null);
        setEditHighlight('');
        setEditNotes('');
        setEditTags([]);
      }
      setEditModal(true);
    },
    []
  );

  const handleSave = useCallback(async () => {
    if (!editMood || !params.tripId) return;
    Haptics.notificationAsync(Haptics.NotificationFeedbackType.Success);

    const entry = editingEntry
      ? { ...editingEntry, mood: editMood, highlight: editHighlight, notes: editNotes, tags: editTags, updatedAt: new Date().toISOString() }
      : createJournalEntry({
          tripId: params.tripId,
          dayNumber: editDay,
          date: editDate,
          mood: editMood,
          highlight: editHighlight,
          notes: editNotes,
          tags: editTags,
        });

    await saveJournalEntry(entry);
    captureEvent('journal_entry_saved', { tripId: params.tripId, dayNumber: editDay, mood: editMood });

    // Refresh
    const updated = await getJournalForTrip(params.tripId);
    setEntries(updated);
    setEditModal(false);
  }, [editMood, editHighlight, editNotes, editTags, editDay, editDate, editingEntry, params.tripId]);

  const handleToggleTag = useCallback((tag: string) => {
    setEditTags((prev) =>
      prev.includes(tag) ? prev.filter((t) => t !== tag) : [...prev, tag]
    );
  }, []);

  const handleBack = useCallback(() => {
    Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
    router.back();
  }, [router]);

  const destination = params.destination ?? trip?.destination ?? 'Your Trip';
  const entriesCount = entries.length;
  const totalDays = trip?.days ?? 0;

  return (
    <View style={[styles.container, { paddingTop: insets.top }]}>
      {/* Header */}
      <View style={styles.header}>
        <Pressable onPress={handleBack} hitSlop={12}>
          <ArrowLeft size={24} color={COLORS.cream} strokeWidth={2} />
        </Pressable>
        <View style={styles.headerCenter}>
          <Text style={styles.headerTitle}>Trip Journal</Text>
          <Text style={styles.headerSub}>{destination}</Text>
        </View>
        <BookOpen size={20} color={COLORS.sage} strokeWidth={2} />
      </View>

      {/* Stats bar */}
      <View style={styles.statsBar}>
        <View style={styles.statItem}>
          <Text style={styles.statValue}>{entriesCount}/{totalDays}</Text>
          <Text style={styles.statLabel}>entries</Text>
        </View>
        {vibeScore > 0 && (
          <View style={styles.statItem}>
            <Text style={styles.statValue}>{vibeScore.toFixed(1)}</Text>
            <Text style={styles.statLabel}>vibe score</Text>
          </View>
        )}
        {entries.length > 0 && (
          <View style={styles.statItem}>
            <Text style={styles.statValue}>
              {entries.reduce((acc, e) => acc + e.tags.length, 0)}
            </Text>
            <Text style={styles.statLabel}>moments</Text>
          </View>
        )}
      </View>

      {/* Day list */}
      <FlatList
        data={dayList}
        keyExtractor={(item) => String(item.dayNumber)}
        contentContainerStyle={styles.listContent}
        showsVerticalScrollIndicator={false}
        renderItem={({ item }) => (
          <DayCard
            entry={item.entry}
            dayNumber={item.dayNumber}
            date={item.date}
            onPress={() => handleOpenDay(item.dayNumber, item.date, item.entry)}
          />
        )}
        ListEmptyComponent={
          <View style={styles.emptyState}>
            <BookOpen size={40} color={COLORS.creamMuted} strokeWidth={1.5} />
            <Text style={styles.emptyTitle}>No trip selected</Text>
            <Text style={styles.emptySubtitle}>
              Open this from a saved trip to start journaling.
            </Text>
          </View>
        }
      />

      {/* Edit Modal */}
      <Modal
        visible={editModal}
        animationType="slide"
        presentationStyle="pageSheet"
        onRequestClose={() => setEditModal(false)}
      >
        <KeyboardAvoidingView
          behavior={Platform.OS === 'ios' ? 'padding' : undefined}
          style={styles.modalContainer}
        >
          <View style={[styles.modalInner, { paddingTop: insets.top + SPACING.md }]}>
            {/* Modal header */}
            <View style={styles.modalHeader}>
              <Pressable onPress={() => setEditModal(false)} hitSlop={12}>
                <X size={24} color={COLORS.cream} strokeWidth={2} />
              </Pressable>
              <Text style={styles.modalTitle}>Day {editDay}</Text>
              <Pressable
                onPress={handleSave}
                hitSlop={12}
                disabled={!editMood}
                style={({ pressed }) => [{ opacity: editMood ? (pressed ? 0.7 : 1) : 0.3 }]}
              >
                <Check size={24} color={COLORS.sage} strokeWidth={2} />
              </Pressable>
            </View>

            <ScrollView
              contentContainerStyle={styles.modalScroll}
              showsVerticalScrollIndicator={false}
            >
              {/* Date */}
              <View style={styles.modalDateRow}>
                <Calendar size={14} color={COLORS.creamMuted} strokeWidth={2} />
                <Text style={styles.modalDate}>
                  {editDate ? format(parseISO(editDate), 'EEEE, MMMM d, yyyy') : ''}
                </Text>
              </View>

              {/* Mood */}
              <Text style={styles.sectionLabel}>How was today?</Text>
              <MoodSelector selected={editMood} onSelect={setEditMood} />

              {/* Highlight */}
              <Text style={styles.sectionLabel}>Best moment</Text>
              <TextInput
                style={styles.highlightInput}
                value={editHighlight}
                onChangeText={setEditHighlight}
                placeholder="The one thing you want to remember..."
                placeholderTextColor={COLORS.creamDim}
                maxLength={150}
              />

              {/* Tags */}
              <Text style={styles.sectionLabel}>Quick tags</Text>
              <TagPicker selected={editTags} onToggle={handleToggleTag} />

              {/* Notes */}
              <Text style={styles.sectionLabel}>Notes</Text>
              <TextInput
                style={styles.notesInput}
                value={editNotes}
                onChangeText={setEditNotes}
                placeholder="Write about your day..."
                placeholderTextColor={COLORS.creamDim}
                multiline
                textAlignVertical="top"
                maxLength={2000}
              />
            </ScrollView>
          </View>
        </KeyboardAvoidingView>
      </Modal>
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
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: SPACING.lg,
    paddingVertical: SPACING.md,
  } as ViewStyle,
  headerCenter: {
    alignItems: 'center',
  } as ViewStyle,
  headerTitle: {
    fontFamily: FONTS.header,
    fontSize: 20,
    color: COLORS.cream,
  } as TextStyle,
  headerSub: {
    fontFamily: FONTS.mono,
    fontSize: 11,
    color: COLORS.sage,
    letterSpacing: 1,
    textTransform: 'uppercase',
    marginTop: 2,
  } as TextStyle,
  // Stats
  statsBar: {
    flexDirection: 'row',
    justifyContent: 'center',
    gap: SPACING.xl,
    paddingVertical: SPACING.md,
    marginHorizontal: SPACING.lg,
    borderBottomWidth: 1,
    borderBottomColor: COLORS.border,
    marginBottom: SPACING.sm,
  } as ViewStyle,
  statItem: {
    alignItems: 'center',
  } as ViewStyle,
  statValue: {
    fontFamily: FONTS.header,
    fontSize: 20,
    color: COLORS.cream,
  } as TextStyle,
  statLabel: {
    fontFamily: FONTS.mono,
    fontSize: 9,
    color: COLORS.creamMuted,
    letterSpacing: 0.5,
    textTransform: 'uppercase',
    marginTop: 2,
  } as TextStyle,
  // List
  listContent: {
    paddingHorizontal: SPACING.lg,
    paddingBottom: SPACING.xxxl,
    gap: SPACING.sm,
  } as ViewStyle,
  // Day card
  dayCard: {
    backgroundColor: COLORS.bgCard,
    borderRadius: RADIUS.lg,
    borderWidth: 1,
    borderColor: COLORS.border,
    padding: SPACING.md,
    position: 'relative',
  } as ViewStyle,
  dayCardEmpty: {
    borderStyle: 'dashed',
  } as ViewStyle,
  dayCardHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: SPACING.xs,
  } as ViewStyle,
  dayCardHeaderLeft: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: SPACING.xs,
  } as ViewStyle,
  moodIndicator: {
    width: 8,
    height: 8,
    borderRadius: 4,
  } as ViewStyle,
  dayCardNumber: {
    fontFamily: FONTS.bodySemiBold,
    fontSize: 15,
    color: COLORS.cream,
  } as TextStyle,
  dayCardDate: {
    fontFamily: FONTS.mono,
    fontSize: 11,
    color: COLORS.creamMuted,
    letterSpacing: 0.3,
  } as TextStyle,
  dayCardEmptyBody: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: SPACING.sm,
    paddingVertical: SPACING.md,
  } as ViewStyle,
  dayCardEmptyText: {
    fontFamily: FONTS.body,
    fontSize: 14,
    color: COLORS.creamMuted,
  } as TextStyle,
  dayCardHighlight: {
    fontFamily: FONTS.body,
    fontSize: 14,
    color: COLORS.cream,
    lineHeight: 20,
    marginBottom: SPACING.xs,
  } as TextStyle,
  dayCardTags: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 4,
  } as ViewStyle,
  dayCardTag: {
    backgroundColor: COLORS.bgGlass,
    borderRadius: RADIUS.full,
    paddingHorizontal: SPACING.sm,
    paddingVertical: 2,
  } as ViewStyle,
  dayCardTagText: {
    fontFamily: FONTS.mono,
    fontSize: 10,
    color: COLORS.creamMuted,
    letterSpacing: 0.3,
  } as TextStyle,
  dayCardTagMore: {
    fontFamily: FONTS.mono,
    fontSize: 10,
    color: COLORS.sage,
    alignSelf: 'center',
  } as TextStyle,
  dayCardChevron: {
    position: 'absolute',
    right: SPACING.md,
    top: '50%',
  } as ViewStyle,
  // Empty
  emptyState: {
    alignItems: 'center',
    justifyContent: 'center',
    paddingTop: SPACING.xxxl,
    gap: SPACING.sm,
  } as ViewStyle,
  emptyTitle: {
    fontFamily: FONTS.header,
    fontSize: 22,
    color: COLORS.cream,
  } as TextStyle,
  emptySubtitle: {
    fontFamily: FONTS.body,
    fontSize: 14,
    color: COLORS.creamMuted,
    textAlign: 'center',
    lineHeight: 20,
    paddingHorizontal: SPACING.xl,
  } as TextStyle,
  // Modal
  modalContainer: {
    flex: 1,
    backgroundColor: COLORS.bg,
  } as ViewStyle,
  modalInner: {
    flex: 1,
  } as ViewStyle,
  modalHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: SPACING.lg,
    paddingBottom: SPACING.md,
    borderBottomWidth: 1,
    borderBottomColor: COLORS.border,
  } as ViewStyle,
  modalTitle: {
    fontFamily: FONTS.header,
    fontSize: 20,
    color: COLORS.cream,
  } as TextStyle,
  modalScroll: {
    paddingHorizontal: SPACING.lg,
    paddingTop: SPACING.lg,
    paddingBottom: SPACING.xxxl,
  } as ViewStyle,
  modalDateRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: SPACING.sm,
    marginBottom: SPACING.lg,
  } as ViewStyle,
  modalDate: {
    fontFamily: FONTS.mono,
    fontSize: 12,
    color: COLORS.creamMuted,
    letterSpacing: 0.3,
  } as TextStyle,
  sectionLabel: {
    fontFamily: FONTS.bodySemiBold,
    fontSize: 14,
    color: COLORS.cream,
    marginBottom: SPACING.sm,
    marginTop: SPACING.lg,
  } as TextStyle,
  // Mood
  moodRow: {
    flexDirection: 'row',
    gap: SPACING.xs,
  } as ViewStyle,
  moodBtn: {
    flex: 1,
    alignItems: 'center',
    gap: 4,
    paddingVertical: SPACING.sm,
    borderRadius: RADIUS.md,
    borderWidth: 1,
    borderColor: COLORS.border,
    backgroundColor: COLORS.bgCard,
  } as ViewStyle,
  moodDot: {
    width: 10,
    height: 10,
    borderRadius: 5,
  } as ViewStyle,
  moodLabel: {
    fontFamily: FONTS.mono,
    fontSize: 9,
    color: COLORS.creamMuted,
    letterSpacing: 0.3,
  } as TextStyle,
  // Highlight
  highlightInput: {
    fontFamily: FONTS.body,
    fontSize: 16,
    color: COLORS.cream,
    backgroundColor: COLORS.bgCard,
    borderRadius: RADIUS.md,
    borderWidth: 1,
    borderColor: COLORS.border,
    padding: SPACING.md,
    minHeight: 48,
  } as TextStyle,
  // Tags
  tagsWrap: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: SPACING.xs,
  } as ViewStyle,
  tagChip: {
    paddingHorizontal: SPACING.sm + 2,
    paddingVertical: SPACING.xs + 1,
    borderRadius: RADIUS.full,
    borderWidth: 1,
    borderColor: COLORS.border,
    backgroundColor: COLORS.bgCard,
  } as ViewStyle,
  tagChipActive: {
    borderColor: COLORS.sage,
    backgroundColor: COLORS.sage + '15',
  } as ViewStyle,
  tagText: {
    fontFamily: FONTS.mono,
    fontSize: 11,
    color: COLORS.creamMuted,
    letterSpacing: 0.3,
  } as TextStyle,
  tagTextActive: {
    color: COLORS.sage,
  } as TextStyle,
  // Notes
  notesInput: {
    fontFamily: FONTS.body,
    fontSize: 15,
    color: COLORS.cream,
    backgroundColor: COLORS.bgCard,
    borderRadius: RADIUS.md,
    borderWidth: 1,
    borderColor: COLORS.border,
    padding: SPACING.md,
    minHeight: 120,
    lineHeight: 22,
  } as TextStyle,
});

export default withComingSoon(TripJournalScreen, {
  routeName: 'trip-journal',
  title: 'Trip Journal',
});
