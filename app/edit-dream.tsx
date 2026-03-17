// =============================================================================
// ROAM — Add/Edit Dream Trip Modal
// Form for creating or editing a dream trip idea
// =============================================================================
import React, { useCallback, useEffect, useMemo, useState } from 'react';
import {
  KeyboardAvoidingView,
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
import {
  ChevronLeft,
  ChevronRight,
  Minus,
  Plus,
} from 'lucide-react-native';
import { useTranslation } from 'react-i18next';

import * as Haptics from '../lib/haptics';
import { COLORS, FONTS, SPACING, RADIUS } from '../lib/constants';
import { useDreamStore, type DreamTripInsert } from '../lib/dream-store';

// ---------------------------------------------------------------------------
// Tag options
// ---------------------------------------------------------------------------
const TAG_OPTIONS = [
  'foodie',
  'adventure',
  'relaxation',
  'culture',
  'romantic',
  'budget',
  'luxury',
  'solo',
  'family',
  'friends',
] as const;

const PRIORITY_OPTIONS: Array<{ id: 'next' | 'soon' | 'someday'; label: string }> = [
  { id: 'next', label: 'Next' },
  { id: 'soon', label: 'Soon' },
  { id: 'someday', label: 'Someday' },
];

// ---------------------------------------------------------------------------
// Main Screen
// ---------------------------------------------------------------------------
export default function EditDreamScreen(): React.JSX.Element {
  const router = useRouter();
  const insets = useSafeAreaInsets();
  const { t } = useTranslation();
  const { id } = useLocalSearchParams<{ id?: string }>();

  const dreams = useDreamStore((s) => s.dreams);
  const addDream = useDreamStore((s) => s.addDream);
  const updateDream = useDreamStore((s) => s.updateDream);
  const promoteDreamToTrip = useDreamStore((s) => s.promoteDreamToTrip);

  const existingDream = useMemo(
    () => (id ? dreams.find((d) => d.id === id) : undefined),
    [id, dreams],
  );
  const isEditing = Boolean(existingDream);

  // Form state
  const [destination, setDestination] = useState(existingDream?.destination ?? '');
  const [title, setTitle] = useState(existingDream?.title ?? '');
  const [travelMonth, setTravelMonth] = useState(existingDream?.travelMonth ?? '');
  const [budget, setBudget] = useState(
    existingDream?.estimatedBudget != null ? String(existingDream.estimatedBudget) : '',
  );
  const [days, setDays] = useState(existingDream?.estimatedDays ?? 7);
  const [tags, setTags] = useState<string[]>(existingDream?.tags ?? []);
  const [notes, setNotes] = useState(existingDream?.notes ?? '');
  const [priority, setPriority] = useState<'next' | 'soon' | 'someday'>(
    existingDream?.priority ?? 'someday',
  );

  const canSave = destination.trim().length > 0;

  // -----------------------------------------------------------------------
  // Handlers
  // -----------------------------------------------------------------------
  const handleBack = useCallback(() => {
    Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light).catch(() => {});
    router.back();
  }, [router]);

  const handleToggleTag = useCallback((tag: string) => {
    Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light).catch(() => {});
    setTags((prev) =>
      prev.includes(tag) ? prev.filter((t) => t !== tag) : [...prev, tag],
    );
  }, []);

  const handleSave = useCallback(async () => {
    if (!canSave) return;
    Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Medium).catch(() => {});

    const dreamData: DreamTripInsert = {
      destination: destination.trim(),
      title: title.trim() || null,
      notes: notes.trim() || null,
      photoUrl: existingDream?.photoUrl ?? null,
      estimatedBudget: budget ? Number(budget) : null,
      estimatedDays: days > 0 ? days : null,
      travelMonth: travelMonth.trim() || null,
      priority,
      tags,
      inspirationLinks: existingDream?.inspirationLinks ?? [],
    };

    if (isEditing && existingDream) {
      await updateDream(existingDream.id, dreamData);
    } else {
      await addDream(dreamData);
    }
    router.back();
  }, [
    canSave,
    destination,
    title,
    notes,
    budget,
    days,
    travelMonth,
    priority,
    tags,
    existingDream,
    isEditing,
    addDream,
    updateDream,
    router,
  ]);

  const handlePromote = useCallback(() => {
    if (!existingDream) return;
    Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Heavy).catch(() => {});
    promoteDreamToTrip(existingDream.id);
    router.replace('/(tabs)/plan' as never);
  }, [existingDream, promoteDreamToTrip, router]);

  // -----------------------------------------------------------------------
  // Render
  // -----------------------------------------------------------------------
  return (
    <View style={[styles.root, { paddingTop: insets.top }]}>
      {/* Header */}
      <View style={styles.header}>
        <Pressable onPress={handleBack} hitSlop={8} style={styles.backBtn}>
          <ChevronLeft size={22} color={COLORS.cream} strokeWidth={1.5} />
        </Pressable>
        <Text style={styles.headerTitle}>
          {isEditing
            ? t('editDream.editTitle', { defaultValue: 'Edit Dream' })
            : t('editDream.addTitle', { defaultValue: 'New Dream' })}
        </Text>
        <View style={{ width: 40 }} />
      </View>

      <KeyboardAvoidingView
        behavior={Platform.OS === 'ios' ? 'padding' : undefined}
        style={{ flex: 1 }}
      >
        <ScrollView
          style={styles.scroll}
          contentContainerStyle={{ paddingBottom: insets.bottom + 120 }}
          showsVerticalScrollIndicator={false}
          keyboardShouldPersistTaps="handled"
        >
          {/* Destination */}
          <Text style={styles.label}>
            {t('editDream.destination', { defaultValue: 'Destination' })}
            <Text style={styles.required}> *</Text>
          </Text>
          <TextInput
            style={styles.input}
            value={destination}
            onChangeText={setDestination}
            placeholder={t('editDream.destinationPlaceholder', { defaultValue: 'Where do you want to go?' })}
            placeholderTextColor={COLORS.muted}
            autoCapitalize="words"
            returnKeyType="next"
          />

          {/* Title */}
          <Text style={styles.label}>
            {t('editDream.tripTitle', { defaultValue: 'What are you calling this trip?' })}
          </Text>
          <TextInput
            style={styles.input}
            value={title}
            onChangeText={setTitle}
            placeholder={t('editDream.titlePlaceholder', { defaultValue: 'e.g. Summer in Japan' })}
            placeholderTextColor={COLORS.muted}
            autoCapitalize="words"
            returnKeyType="next"
          />

          {/* When */}
          <Text style={styles.label}>
            {t('editDream.when', { defaultValue: 'When' })}
          </Text>
          <View style={styles.row}>
            <TextInput
              style={[styles.input, { flex: 1 }]}
              value={travelMonth}
              onChangeText={setTravelMonth}
              placeholder={t('editDream.whenPlaceholder', { defaultValue: '2026-06 or Anytime' })}
              placeholderTextColor={COLORS.muted}
              autoCapitalize="none"
              returnKeyType="next"
            />
          </View>

          {/* Budget */}
          <Text style={styles.label}>
            {t('editDream.budget', { defaultValue: 'Budget' })}
          </Text>
          <TextInput
            style={styles.input}
            value={budget}
            onChangeText={setBudget}
            placeholder={t('editDream.budgetPlaceholder', { defaultValue: 'Total estimated budget ($)' })}
            placeholderTextColor={COLORS.muted}
            keyboardType="numeric"
            returnKeyType="next"
          />

          {/* How long */}
          <Text style={styles.label}>
            {t('editDream.howLong', { defaultValue: 'How long (days)' })}
          </Text>
          <View style={styles.stepperRow}>
            <Pressable
              onPress={() => {
                Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light).catch(() => {});
                setDays((d) => Math.max(1, d - 1));
              }}
              style={styles.stepperBtn}
            >
              <Minus size={18} color={COLORS.cream} strokeWidth={1.5} />
            </Pressable>
            <Text style={styles.stepperValue}>{days}</Text>
            <Pressable
              onPress={() => {
                Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light).catch(() => {});
                setDays((d) => d + 1);
              }}
              style={styles.stepperBtn}
            >
              <Plus size={18} color={COLORS.cream} strokeWidth={1.5} />
            </Pressable>
          </View>

          {/* Tags */}
          <Text style={styles.label}>
            {t('editDream.tags', { defaultValue: 'Tags' })}
          </Text>
          <View style={styles.tagsWrap}>
            {TAG_OPTIONS.map((tag) => {
              const selected = tags.includes(tag);
              return (
                <Pressable
                  key={tag}
                  onPress={() => handleToggleTag(tag)}
                  style={[
                    styles.tagChip,
                    selected && styles.tagChipSelected,
                  ]}
                >
                  <Text
                    style={[
                      styles.tagChipText,
                      selected && styles.tagChipTextSelected,
                    ]}
                  >
                    {tag}
                  </Text>
                </Pressable>
              );
            })}
          </View>

          {/* Notes */}
          <Text style={styles.label}>
            {t('editDream.notes', { defaultValue: 'Notes' })}
          </Text>
          <TextInput
            style={[styles.input, styles.multiline]}
            value={notes}
            onChangeText={setNotes}
            placeholder={t('editDream.notesPlaceholder', { defaultValue: 'Anything you want to remember...' })}
            placeholderTextColor={COLORS.muted}
            multiline
            numberOfLines={4}
            textAlignVertical="top"
          />

          {/* Priority */}
          <Text style={styles.label}>
            {t('editDream.priority', { defaultValue: 'Priority' })}
          </Text>
          <View style={styles.priorityRow}>
            {PRIORITY_OPTIONS.map((opt) => {
              const selected = priority === opt.id;
              return (
                <Pressable
                  key={opt.id}
                  onPress={() => {
                    Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light).catch(() => {});
                    setPriority(opt.id);
                  }}
                  style={[
                    styles.priorityPill,
                    selected && styles.priorityPillSelected,
                  ]}
                >
                  <Text
                    style={[
                      styles.priorityText,
                      selected && styles.priorityTextSelected,
                    ]}
                  >
                    {t(`editDream.priority_${opt.id}`, { defaultValue: opt.label })}
                  </Text>
                </Pressable>
              );
            })}
          </View>

          {/* Save */}
          <Pressable
            onPress={handleSave}
            disabled={!canSave}
            accessibilityLabel={t('editDream.saveDream', { defaultValue: 'Save Dream' })}
            accessibilityRole="button"
            style={({ pressed }) => [
              styles.saveBtn,
              !canSave && styles.saveBtnDisabled,
              { opacity: pressed && canSave ? 0.85 : 1 },
            ]}
          >
            <Text style={styles.saveBtnText}>
              {t('editDream.saveDream', { defaultValue: 'Save Dream' })}
            </Text>
          </Pressable>

          {/* Promote to trip (edit mode only) */}
          {isEditing && (
            <Pressable
              onPress={handlePromote}
              accessibilityLabel={t('editDream.planThisTrip', { defaultValue: 'Plan this trip' })}
              accessibilityRole="button"
              style={({ pressed }) => [
                styles.promoteBtn,
                { opacity: pressed ? 0.85 : 1 },
              ]}
            >
              <Text style={styles.promoteBtnText}>
                {t('editDream.planThisTrip', { defaultValue: 'Plan this trip' })}
              </Text>
              <ChevronRight size={18} color={COLORS.sage} strokeWidth={1.5} />
            </Pressable>
          )}
        </ScrollView>
      </KeyboardAvoidingView>
    </View>
  );
}

// ---------------------------------------------------------------------------
// Styles
// ---------------------------------------------------------------------------
const styles = StyleSheet.create({
  root: { flex: 1, backgroundColor: COLORS.bg } as ViewStyle,
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: SPACING.md,
    paddingVertical: SPACING.sm,
  } as ViewStyle,
  backBtn: {
    width: 40,
    height: 40,
    borderRadius: RADIUS.full,
    alignItems: 'center',
    justifyContent: 'center',
  } as ViewStyle,
  headerTitle: {
    fontFamily: FONTS.header,
    fontSize: 20,
    color: COLORS.cream,
  } as TextStyle,
  scroll: { flex: 1, paddingHorizontal: SPACING.lg } as ViewStyle,
  label: {
    fontFamily: FONTS.mono,
    fontSize: 11,
    color: COLORS.muted,
    letterSpacing: 0.5,
    marginTop: SPACING.lg,
    marginBottom: SPACING.sm,
    textTransform: 'uppercase',
  } as TextStyle,
  required: {
    color: COLORS.coral,
  } as TextStyle,
  input: {
    backgroundColor: COLORS.surface1,
    borderWidth: 1,
    borderColor: COLORS.border,
    borderRadius: RADIUS.md,
    paddingHorizontal: SPACING.md,
    paddingVertical: SPACING.sm + 4,
    fontFamily: FONTS.body,
    fontSize: 15,
    color: COLORS.cream,
  } as TextStyle,
  multiline: {
    minHeight: 100,
    paddingTop: SPACING.sm + 4,
  } as TextStyle,
  row: {
    flexDirection: 'row',
    gap: SPACING.sm,
  } as ViewStyle,
  stepperRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: SPACING.md,
  } as ViewStyle,
  stepperBtn: {
    width: 40,
    height: 40,
    borderRadius: RADIUS.full,
    backgroundColor: COLORS.surface1,
    borderWidth: 1,
    borderColor: COLORS.border,
    alignItems: 'center',
    justifyContent: 'center',
  } as ViewStyle,
  stepperValue: {
    fontFamily: FONTS.header,
    fontSize: 24,
    color: COLORS.cream,
    minWidth: 40,
    textAlign: 'center',
  } as TextStyle,
  tagsWrap: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: SPACING.sm,
  } as ViewStyle,
  tagChip: {
    paddingHorizontal: SPACING.md,
    paddingVertical: SPACING.sm,
    borderRadius: RADIUS.pill,
    backgroundColor: COLORS.surface1,
    borderWidth: 1,
    borderColor: COLORS.border,
  } as ViewStyle,
  tagChipSelected: {
    backgroundColor: COLORS.sageSubtle,
    borderColor: COLORS.sageBorder,
  } as ViewStyle,
  tagChipText: {
    fontFamily: FONTS.bodyMedium,
    fontSize: 13,
    color: COLORS.muted,
  } as TextStyle,
  tagChipTextSelected: {
    color: COLORS.sage,
  } as TextStyle,
  priorityRow: {
    flexDirection: 'row',
    gap: SPACING.sm,
  } as ViewStyle,
  priorityPill: {
    flex: 1,
    paddingVertical: SPACING.sm + 2,
    borderRadius: RADIUS.pill,
    backgroundColor: COLORS.surface1,
    borderWidth: 1,
    borderColor: COLORS.border,
    alignItems: 'center',
  } as ViewStyle,
  priorityPillSelected: {
    backgroundColor: COLORS.sageSubtle,
    borderColor: COLORS.sageBorder,
  } as ViewStyle,
  priorityText: {
    fontFamily: FONTS.bodyMedium,
    fontSize: 14,
    color: COLORS.muted,
  } as TextStyle,
  priorityTextSelected: {
    color: COLORS.sage,
  } as TextStyle,
  saveBtn: {
    marginTop: SPACING.xl,
    paddingVertical: SPACING.md,
    borderRadius: RADIUS.pill,
    backgroundColor: COLORS.sage,
    alignItems: 'center',
  } as ViewStyle,
  saveBtnDisabled: {
    opacity: 0.4,
  } as ViewStyle,
  saveBtnText: {
    fontFamily: FONTS.headerMedium,
    fontSize: 16,
    color: COLORS.bg,
  } as TextStyle,
  promoteBtn: {
    marginTop: SPACING.md,
    paddingVertical: SPACING.md,
    borderRadius: RADIUS.pill,
    backgroundColor: COLORS.surface1,
    borderWidth: 1,
    borderColor: COLORS.sageBorder,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: SPACING.xs,
  } as ViewStyle,
  promoteBtnText: {
    fontFamily: FONTS.headerMedium,
    fontSize: 16,
    color: COLORS.sage,
  } as TextStyle,
});
