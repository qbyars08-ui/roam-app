// =============================================================================
// ROAM — Trip Journal: Auto-Generated Travel Story
// Merges itinerary + trip_moments + weather into a scrollable narrative.
// Editable day sections, saved to trip_journals table as JSONB.
// =============================================================================
import React, { useCallback, useEffect, useMemo, useState } from 'react';
import {
  ActivityIndicator,
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
import { format, addDays, parseISO } from 'date-fns';
import { ArrowLeft, BookOpen, Edit3, Check, X, Feather } from 'lucide-react-native';
import { useTranslation } from 'react-i18next';
import * as Haptics from '../lib/haptics';
import { COLORS, FONTS, SPACING, RADIUS } from '../lib/constants';
import { useAppStore } from '../lib/store';
import { supabase } from '../lib/supabase';
import { parseItinerary, type ItineraryDay } from '../lib/types/itinerary';
import { track } from '../lib/analytics';

// ---------------------------------------------------------------------------
// Types
// ---------------------------------------------------------------------------
interface TripMoment {
  id: string;
  trip_id: string;
  day_number: number;
  caption: string;
  created_at: string;
}

interface JournalDaySection {
  dayNumber: number;
  date: string;
  autoText: string;       // AI-assembled narrative
  userText: string;       // User-edited override
  moments: TripMoment[];
  weather: string | null; // e.g. "22°C, Partly cloudy"
  theme: string;
  neighborhoods: string[];
  dailyCost: string;
  tip: string;
}

interface SavedJournal {
  tripId: string;
  sections: JournalDaySection[];
  savedAt: string;
}

// ---------------------------------------------------------------------------
// Helpers
// ---------------------------------------------------------------------------
function buildDayNarrative(day: ItineraryDay, date: Date, weather: string | null): string {
  const dateStr = format(date, 'EEEE, MMMM d');
  const slots = [day.morning, day.afternoon, day.evening];
  const neighborhoods = [...new Set(slots.map((s) => s.neighborhood).filter(Boolean))];

  const intro = weather
    ? `${dateStr}. Outside: ${weather}.`
    : `${dateStr}.`;

  const activities = slots
    .filter((s) => s.activity)
    .map((s, i) => {
      const prefix = i === 0 ? 'Morning' : i === 1 ? 'Afternoon' : 'Evening';
      const cost = s.cost && s.cost !== '$0' ? ` (${s.cost})` : '';
      return `${prefix}: ${s.activity} at ${s.location}${cost}.`;
    })
    .join(' ');

  const hoodLine = neighborhoods.length > 0
    ? `The neighborhood: ${neighborhoods.join(' → ')}.`
    : '';

  const costLine = day.dailyCost ? `Daily spend: ${day.dailyCost}.` : '';

  return [intro, activities, hoodLine, costLine].filter(Boolean).join('\n');
}

function extractNeighborhoods(day: ItineraryDay): string[] {
  return [...new Set(
    [day.morning, day.afternoon, day.evening]
      .map((s) => s.neighborhood)
      .filter((n): n is string => Boolean(n))
  )];
}

function extractBestTip(day: ItineraryDay): string {
  const tips = [day.morning.tip, day.afternoon.tip, day.evening.tip].filter(Boolean);
  return tips[0] ?? '';
}

// ---------------------------------------------------------------------------
// Edit Modal
// ---------------------------------------------------------------------------
function EditModal({
  visible,
  section,
  onSave,
  onClose,
}: {
  visible: boolean;
  section: JournalDaySection | null;
  onSave: (dayNumber: number, text: string) => void;
  onClose: () => void;
}) {
  const { t } = useTranslation();
  const insets = useSafeAreaInsets();
  const [text, setText] = useState('');

  useEffect(() => {
    if (section) {
      setText(section.userText || section.autoText);
    }
  }, [section]);

  const handleSave = useCallback(() => {
    if (!section) return;
    Haptics.notificationAsync(Haptics.NotificationFeedbackType.Success);
    onSave(section.dayNumber, text);
  }, [section, text, onSave]);

  if (!section) return null;

  return (
    <Modal visible={visible} animationType="slide" presentationStyle="pageSheet" onRequestClose={onClose}>
      <KeyboardAvoidingView
        behavior={Platform.OS === 'ios' ? 'padding' : undefined}
        style={styles.modalContainer}
      >
        <View style={[styles.modalInner, { paddingTop: insets.top + SPACING.md }]}>
          <View style={styles.modalHeader}>
            <Pressable onPress={onClose} hitSlop={12}>
              <X size={22} color={COLORS.cream} strokeWidth={1.5} />
            </Pressable>
            <Text style={styles.modalTitle}>
              {t('tripStory.editDay', { defaultValue: 'Day' })} {section.dayNumber}
            </Text>
            <Pressable onPress={handleSave} hitSlop={12}>
              <Check size={22} color={COLORS.sage} strokeWidth={1.5} />
            </Pressable>
          </View>
          <ScrollView contentContainerStyle={styles.modalScroll} showsVerticalScrollIndicator={false}>
            <Text style={styles.modalHint}>
              {t('tripStory.editHint', { defaultValue: 'Edit your story for this day. The original is preserved below.' })}
            </Text>
            <TextInput
              style={styles.editInput}
              value={text}
              onChangeText={setText}
              multiline
              textAlignVertical="top"
              autoFocus
              placeholder={t('tripStory.editPlaceholder', { defaultValue: 'Write about this day...' })}
              placeholderTextColor={COLORS.creamDim}
            />
            {section.userText !== '' && section.userText !== section.autoText && (
              <>
                <Text style={styles.originalLabel}>
                  {t('tripStory.originalLabel', { defaultValue: 'Auto-generated original:' })}
                </Text>
                <Text style={styles.originalText}>{section.autoText}</Text>
              </>
            )}
          </ScrollView>
        </View>
      </KeyboardAvoidingView>
    </Modal>
  );
}

// ---------------------------------------------------------------------------
// Day Story Section
// ---------------------------------------------------------------------------
function DayStorySection({
  section,
  onEdit,
}: {
  section: JournalDaySection;
  onEdit: () => void;
}) {
  const { t } = useTranslation();
  const displayText = section.userText || section.autoText;
  const isEdited = section.userText !== '';

  return (
    <View style={styles.daySection}>
      {/* Day header */}
      <View style={styles.daySectionHeader}>
        <View style={styles.dayHeaderLeft}>
          <View style={styles.dayAccentLine} />
          <View>
            <Text style={styles.dayNumber}>
              {t('tripStory.day', { defaultValue: 'Day' })} {section.dayNumber}
            </Text>
            <Text style={styles.dayTheme}>{section.theme}</Text>
          </View>
        </View>
        <Pressable
          onPress={() => {
            Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
            onEdit();
          }}
          hitSlop={12}
          style={({ pressed }) => [styles.editBtn, { opacity: pressed ? 0.6 : 1 }]}
        >
          <Edit3 size={14} color={isEdited ? COLORS.sage : COLORS.creamMuted} strokeWidth={1.5} />
        </Pressable>
      </View>

      {/* Weather pill */}
      {section.weather ? (
        <Text style={styles.weatherPill}>{section.weather}</Text>
      ) : null}

      {/* Narrative body */}
      <Text style={styles.storyBody}>{displayText}</Text>

      {/* User moments */}
      {section.moments.map((moment) => (
        <View key={moment.id} style={styles.momentBlock}>
          <View style={styles.momentBorder} />
          <Text style={styles.momentText}>{moment.caption}</Text>
        </View>
      ))}

      {/* Pro tip */}
      {section.tip ? (
        <View style={styles.tipBlock}>
          <Feather size={12} color={COLORS.sage} strokeWidth={1.5} />
          <Text style={styles.tipText}>{section.tip}</Text>
        </View>
      ) : null}

      {/* Neighborhoods + cost row */}
      {(section.neighborhoods.length > 0 || section.dailyCost) ? (
        <View style={styles.metaRow}>
          {section.neighborhoods.length > 0 && (
            <Text style={styles.metaText}>{section.neighborhoods.join(' → ')}</Text>
          )}
          {section.dailyCost ? (
            <Text style={styles.metaCost}>{section.dailyCost}</Text>
          ) : null}
        </View>
      ) : null}

      {/* Divider */}
      <View style={styles.divider} />
    </View>
  );
}

// ---------------------------------------------------------------------------
// Main Screen
// ---------------------------------------------------------------------------
function TripStoryScreen() {
  const { t } = useTranslation();
  const router = useRouter();
  const insets = useSafeAreaInsets();
  const params = useLocalSearchParams<{ tripId?: string }>();
  const trips = useAppStore((s) => s.trips);
  const session = useAppStore((s) => s.session);

  const trip = useMemo(
    () => trips.find((tr) => tr.id === params.tripId) ?? null,
    [trips, params.tripId]
  );

  const [sections, setSections] = useState<JournalDaySection[]>([]);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [editSection, setEditSection] = useState<JournalDaySection | null>(null);
  const [editModalOpen, setEditModalOpen] = useState(false);
  const [saveSuccess, setSaveSuccess] = useState(false);

  useEffect(() => {
    track({ type: 'screen_view', screen: 'trip-story' });
  }, []);

  // Build sections from itinerary + moments + weather
  useEffect(() => {
    if (!trip) {
      setLoading(false);
      return;
    }

    let cancelled = false;

    async function build() {
      setLoading(true);

      // 1. Parse itinerary
      let days: ItineraryDay[] = [];
      try {
        if (trip && trip.itinerary) {
          const parsed = parseItinerary(trip.itinerary);
          days = parsed.days;
        }
      } catch {
        // malformed itinerary — continue with empty days
      }

      // 2. Fetch trip_moments from Supabase
      let moments: TripMoment[] = [];
      if (trip && session?.user?.id) {
        try {
          const { data } = await supabase
            .from('trip_moments')
            .select('id, trip_id, day_number, caption, created_at')
            .eq('trip_id', trip.id)
            .order('created_at', { ascending: true });
          if (data) moments = data as TripMoment[];
        } catch {
          // offline — skip
        }
      }

      // 3. Check for saved journal overrides
      let savedSections: Record<number, string> = {};
      if (trip && session?.user?.id) {
        try {
          const { data } = await supabase
            .from('trip_journals')
            .select('content')
            .eq('trip_id', trip.id)
            .eq('user_id', session.user.id)
            .maybeSingle();
          if (data?.content) {
            const saved = data.content as SavedJournal;
            if (Array.isArray(saved.sections)) {
              saved.sections.forEach((s) => {
                savedSections[s.dayNumber] = s.userText;
              });
            }
          }
        } catch {
          // no saved journal
        }
      }

      if (cancelled || !trip) return;

      // 4. Assemble sections
      const startDate = parseISO(trip.createdAt);
      const built: JournalDaySection[] = [];

      const numDays = trip.days;
      for (let i = 0; i < numDays; i++) {
        const dayNumber = i + 1;
        const date = addDays(startDate, i);
        const dayData = days[i] ?? null;
        const dayMoments = moments.filter((m) => m.day_number === dayNumber);

        const autoText = dayData
          ? buildDayNarrative(dayData, date, null)
          : `${format(date, 'EEEE, MMMM d')}. No itinerary data available for this day.`;

        built.push({
          dayNumber,
          date: date.toISOString().split('T')[0],
          autoText,
          userText: savedSections[dayNumber] ?? '',
          moments: dayMoments,
          weather: null,
          theme: dayData?.theme ?? '',
          neighborhoods: dayData ? extractNeighborhoods(dayData) : [],
          dailyCost: dayData?.dailyCost ?? '',
          tip: dayData ? extractBestTip(dayData) : '',
        });
      }

      setSections(built);
      setLoading(false);
    }

    build().catch(() => setLoading(false));
    return () => { cancelled = true; };
  }, [trip, session]);

  const handleEdit = useCallback((section: JournalDaySection) => {
    setEditSection(section);
    setEditModalOpen(true);
  }, []);

  const handleSaveEdit = useCallback((dayNumber: number, text: string) => {
    setSections((prev) =>
      prev.map((s) => s.dayNumber === dayNumber ? { ...s, userText: text } : s)
    );
    setEditModalOpen(false);
  }, []);

  const handleSaveToSupabase = useCallback(async () => {
    if (!trip || !session?.user?.id) return;
    Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Medium);
    setSaving(true);

    try {
      const payload: SavedJournal = {
        tripId: trip.id,
        sections,
        savedAt: new Date().toISOString(),
      };

      await supabase.from('trip_journals').upsert(
        {
          trip_id: trip.id,
          user_id: session.user.id,
          content: payload,
          updated_at: new Date().toISOString(),
        },
        { onConflict: 'trip_id,user_id' }
      );

      Haptics.notificationAsync(Haptics.NotificationFeedbackType.Success);
      setSaveSuccess(true);
      setTimeout(() => setSaveSuccess(false), 2500);
    } catch {
      Haptics.notificationAsync(Haptics.NotificationFeedbackType.Error);
    } finally {
      setSaving(false);
    }
  }, [trip, session, sections]);

  const handleBack = useCallback(() => {
    Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
    router.back();
  }, [router]);

  const destination = trip?.destination ?? 'Your Trip';
  const editedCount = sections.filter((s) => s.userText !== '').length;

  // -------------------------------------------------------------------------
  // Render
  // -------------------------------------------------------------------------
  return (
    <View style={[styles.container, { paddingTop: insets.top }]}>
      {/* Header */}
      <View style={styles.header}>
        <Pressable onPress={handleBack} hitSlop={12}>
          <ArrowLeft size={22} color={COLORS.cream} strokeWidth={1.5} />
        </Pressable>
        <View style={styles.headerCenter}>
          <Text style={styles.headerTitle}>
            {t('tripStory.title', { defaultValue: 'Your Story' })}
          </Text>
          <Text style={styles.headerSub}>{destination}</Text>
        </View>
        <Pressable
          onPress={handleSaveToSupabase}
          hitSlop={12}
          disabled={saving || sections.length === 0}
          style={({ pressed }) => [{ opacity: saving ? 0.4 : pressed ? 0.7 : 1 }]}
        >
          {saving ? (
            <ActivityIndicator size="small" color={COLORS.sage} />
          ) : saveSuccess ? (
            <Check size={20} color={COLORS.sage} strokeWidth={1.5} />
          ) : (
            <BookOpen size={20} color={COLORS.sage} strokeWidth={1.5} />
          )}
        </Pressable>
      </View>

      {/* Edited count chip */}
      {editedCount > 0 && (
        <View style={styles.editedChip}>
          <Text style={styles.editedChipText}>
            {editedCount} {editedCount === 1
              ? t('tripStory.dayEdited', { defaultValue: 'day edited' })
              : t('tripStory.daysEdited', { defaultValue: 'days edited' })}
          </Text>
        </View>
      )}

      {loading ? (
        <View style={styles.loadingState}>
          <ActivityIndicator size="large" color={COLORS.sage} />
          <Text style={styles.loadingText}>
            {t('tripStory.building', { defaultValue: 'Building your story...' })}
          </Text>
        </View>
      ) : sections.length === 0 ? (
        <View style={styles.emptyState}>
          <BookOpen size={40} color={COLORS.creamMuted} strokeWidth={1.5} />
          <Text style={styles.emptyTitle}>
            {t('tripStory.noTrip', { defaultValue: 'No trip found' })}
          </Text>
          <Text style={styles.emptySubtitle}>
            {t('tripStory.openFromTrip', { defaultValue: 'Open this screen from a saved trip.' })}
          </Text>
        </View>
      ) : (
        <ScrollView
          contentContainerStyle={[styles.scrollContent, { paddingBottom: insets.bottom + SPACING.xxxl }]}
          showsVerticalScrollIndicator={false}
        >
          {/* Story intro */}
          <View style={styles.storyIntro}>
            <Text style={styles.storyDestination}>{destination}</Text>
            {trip && (
              <Text style={styles.storyMeta}>
                {format(parseISO(trip.createdAt), 'MMMM yyyy')} · {trip.days} days
              </Text>
            )}
          </View>

          {/* Day sections */}
          {sections.map((section) => (
            <DayStorySection
              key={section.dayNumber}
              section={section}
              onEdit={() => handleEdit(section)}
            />
          ))}

          {/* Save CTA */}
          <Pressable
            onPress={handleSaveToSupabase}
            disabled={saving}
            style={({ pressed }) => [styles.saveCta, { opacity: saving ? 0.5 : pressed ? 0.8 : 1 }]}
          >
            {saving ? (
              <ActivityIndicator size="small" color={COLORS.bg} />
            ) : (
              <Text style={styles.saveCtaText}>
                {saveSuccess
                  ? t('tripStory.saved', { defaultValue: 'Saved' })
                  : t('tripStory.saveStory', { defaultValue: 'Save story' })}
              </Text>
            )}
          </Pressable>
        </ScrollView>
      )}

      {/* Edit Modal */}
      <EditModal
        visible={editModalOpen}
        section={editSection}
        onSave={handleSaveEdit}
        onClose={() => setEditModalOpen(false)}
      />
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

  // Header
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: SPACING.lg,
    paddingVertical: SPACING.md,
    borderBottomWidth: 1,
    borderBottomColor: COLORS.border,
  } as ViewStyle,
  headerCenter: {
    alignItems: 'center',
  } as ViewStyle,
  headerTitle: {
    fontFamily: FONTS.header,
    fontSize: 18,
    color: COLORS.cream,
  } as TextStyle,
  headerSub: {
    fontFamily: FONTS.mono,
    fontSize: 10,
    color: COLORS.sage,
    letterSpacing: 1,
    textTransform: 'uppercase',
    marginTop: 2,
  } as TextStyle,

  // Edited chip
  editedChip: {
    alignSelf: 'center',
    marginTop: SPACING.sm,
    backgroundColor: COLORS.sageLight,
    borderRadius: RADIUS.pill,
    paddingHorizontal: SPACING.md,
    paddingVertical: SPACING.xs,
  } as ViewStyle,
  editedChipText: {
    fontFamily: FONTS.mono,
    fontSize: 10,
    color: COLORS.sage,
    letterSpacing: 0.5,
  } as TextStyle,

  // Loading
  loadingState: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
    gap: SPACING.md,
  } as ViewStyle,
  loadingText: {
    fontFamily: FONTS.body,
    fontSize: 14,
    color: COLORS.creamMuted,
  } as TextStyle,

  // Empty
  emptyState: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
    gap: SPACING.sm,
    paddingHorizontal: SPACING.xl,
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
  } as TextStyle,

  // Scroll
  scrollContent: {
    paddingHorizontal: SPACING.lg,
    paddingTop: SPACING.xl,
  } as ViewStyle,

  // Story intro
  storyIntro: {
    marginBottom: SPACING.xl,
  } as ViewStyle,
  storyDestination: {
    fontFamily: FONTS.header,
    fontSize: 32,
    color: COLORS.cream,
    lineHeight: 38,
  } as TextStyle,
  storyMeta: {
    fontFamily: FONTS.mono,
    fontSize: 11,
    color: COLORS.muted,
    letterSpacing: 0.5,
    marginTop: SPACING.xs,
  } as TextStyle,

  // Day section
  daySection: {
    marginBottom: SPACING.xl,
  } as ViewStyle,
  daySectionHeader: {
    flexDirection: 'row',
    alignItems: 'flex-start',
    justifyContent: 'space-between',
    marginBottom: SPACING.sm,
  } as ViewStyle,
  dayHeaderLeft: {
    flexDirection: 'row',
    alignItems: 'flex-start',
    gap: SPACING.sm,
    flex: 1,
  } as ViewStyle,
  dayAccentLine: {
    width: 3,
    height: 40,
    backgroundColor: COLORS.sage,
    borderRadius: RADIUS.pill,
    marginTop: 2,
  } as ViewStyle,
  dayNumber: {
    fontFamily: FONTS.header,
    fontSize: 24,
    color: COLORS.sage,
    lineHeight: 28,
  } as TextStyle,
  dayTheme: {
    fontFamily: FONTS.body,
    fontSize: 13,
    color: COLORS.muted,
    lineHeight: 18,
    marginTop: 1,
  } as TextStyle,
  editBtn: {
    padding: SPACING.xs,
  } as ViewStyle,

  // Weather
  weatherPill: {
    fontFamily: FONTS.mono,
    fontSize: 11,
    color: COLORS.creamMuted,
    letterSpacing: 0.3,
    marginBottom: SPACING.sm,
  } as TextStyle,

  // Story body
  storyBody: {
    fontFamily: FONTS.body,
    fontSize: 16,
    color: COLORS.creamBright,
    lineHeight: 26,
    marginBottom: SPACING.md,
  } as TextStyle,

  // User moment quote block
  momentBlock: {
    flexDirection: 'row',
    marginBottom: SPACING.md,
    gap: SPACING.sm,
  } as ViewStyle,
  momentBorder: {
    width: 2,
    backgroundColor: COLORS.sageBorder,
    borderRadius: RADIUS.pill,
  } as ViewStyle,
  momentText: {
    flex: 1,
    fontFamily: FONTS.body,
    fontSize: 15,
    color: COLORS.creamSoft,
    lineHeight: 24,
    fontStyle: 'italic',
  } as TextStyle,

  // Tip block
  tipBlock: {
    flexDirection: 'row',
    alignItems: 'flex-start',
    gap: SPACING.xs,
    backgroundColor: COLORS.sageFaint,
    borderRadius: RADIUS.md,
    padding: SPACING.sm + 2,
    marginBottom: SPACING.sm,
  } as ViewStyle,
  tipText: {
    flex: 1,
    fontFamily: FONTS.body,
    fontSize: 13,
    color: COLORS.creamDim,
    lineHeight: 20,
  } as TextStyle,

  // Meta row
  metaRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginTop: SPACING.xs,
  } as ViewStyle,
  metaText: {
    fontFamily: FONTS.mono,
    fontSize: 10,
    color: COLORS.muted,
    letterSpacing: 0.3,
    flex: 1,
  } as TextStyle,
  metaCost: {
    fontFamily: FONTS.mono,
    fontSize: 10,
    color: COLORS.sage,
    letterSpacing: 0.3,
  } as TextStyle,

  // Divider
  divider: {
    height: 1,
    backgroundColor: COLORS.border,
    marginTop: SPACING.lg,
  } as ViewStyle,

  // Save CTA
  saveCta: {
    backgroundColor: COLORS.sage,
    borderRadius: RADIUS.pill,
    paddingVertical: SPACING.md,
    alignItems: 'center',
    marginTop: SPACING.xl,
    marginHorizontal: SPACING.lg,
  } as ViewStyle,
  saveCtaText: {
    fontFamily: FONTS.bodySemiBold,
    fontSize: 15,
    color: COLORS.bg,
    letterSpacing: 0.3,
  } as TextStyle,

  // Edit Modal
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
    fontSize: 18,
    color: COLORS.cream,
  } as TextStyle,
  modalScroll: {
    paddingHorizontal: SPACING.lg,
    paddingTop: SPACING.lg,
    paddingBottom: SPACING.xxxl,
  } as ViewStyle,
  modalHint: {
    fontFamily: FONTS.body,
    fontSize: 13,
    color: COLORS.muted,
    lineHeight: 20,
    marginBottom: SPACING.md,
  } as TextStyle,
  editInput: {
    fontFamily: FONTS.body,
    fontSize: 16,
    color: COLORS.cream,
    lineHeight: 26,
    backgroundColor: COLORS.bgCard,
    borderRadius: RADIUS.md,
    borderWidth: 1,
    borderColor: COLORS.border,
    padding: SPACING.md,
    minHeight: 200,
  } as TextStyle,
  originalLabel: {
    fontFamily: FONTS.mono,
    fontSize: 10,
    color: COLORS.muted,
    letterSpacing: 0.5,
    textTransform: 'uppercase',
    marginTop: SPACING.xl,
    marginBottom: SPACING.sm,
  } as TextStyle,
  originalText: {
    fontFamily: FONTS.body,
    fontSize: 14,
    color: COLORS.creamDim,
    lineHeight: 22,
    opacity: 0.6,
  } as TextStyle,
});

export default TripStoryScreen;
