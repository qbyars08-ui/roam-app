// =============================================================================
// ROAM — Import Bookings Screen
// Paste confirmation emails to extract structured reservation data.
// =============================================================================
import React, { useCallback, useMemo, useState } from 'react';
import {
  Pressable,
  ScrollView,
  StyleSheet,
  Text,
  TextInput,
  View,
  type TextStyle,
  type ViewStyle,
} from 'react-native';
import { useRouter } from 'expo-router';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { useTranslation } from 'react-i18next';
import {
  ArrowLeft,
  Plane,
  Hotel,
  MapPin,
  UtensilsCrossed,
  Bus,
  ClipboardPaste,
  Plus,
  Trash2,
  type LucideIcon,
} from 'lucide-react-native';
import * as Haptics from '../lib/haptics';
import { COLORS, FONTS, SPACING, RADIUS } from '../lib/constants';
import {
  parseReservationText,
  formatReservationDate,
  type Reservation,
  type ReservationType,
} from '../lib/reservation-parser';

// ---------------------------------------------------------------------------
// Type icon mapping
// ---------------------------------------------------------------------------
const TYPE_ICONS: Readonly<Record<ReservationType, LucideIcon>> = {
  flight: Plane,
  hotel: Hotel,
  activity: MapPin,
  restaurant: UtensilsCrossed,
  transport: Bus,
};

const TYPE_LABELS: Readonly<Record<ReservationType, string>> = {
  flight: 'Flight',
  hotel: 'Hotel',
  activity: 'Activity',
  restaurant: 'Restaurant',
  transport: 'Transport',
};

// ---------------------------------------------------------------------------
// Component
// ---------------------------------------------------------------------------
export default function ImportBookingsScreen() {
  const router = useRouter();
  const insets = useSafeAreaInsets();
  const { t } = useTranslation();

  const [inputText, setInputText] = useState('');
  const [parsedReservations, setParsedReservations] = useState<readonly Reservation[]>([]);
  const [addedIds, setAddedIds] = useState<readonly number[]>([]);

  const handleParse = useCallback(() => {
    Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Medium);
    const results = parseReservationText(inputText);
    setParsedReservations(results);
    setAddedIds([]);
  }, [inputText]);

  const handleAddToTrip = useCallback((index: number) => {
    Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
    setAddedIds((prev) => (prev.includes(index) ? prev : [...prev, index]));
  }, []);

  const handleClear = useCallback(() => {
    Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
    setInputText('');
    setParsedReservations([]);
    setAddedIds([]);
  }, []);

  const canParse = useMemo(() => inputText.trim().length > 10, [inputText]);
  const hasResults = parsedReservations.length > 0;

  return (
    <View style={[styles.container, { paddingTop: insets.top }]}>
      {/* Header */}
      <View style={styles.header}>
        <Pressable onPress={() => { Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light); router.back(); }} hitSlop={12}>
          <ArrowLeft size={22} color={COLORS.cream} strokeWidth={1.5} />
        </Pressable>
        <Text style={styles.headerTitle}>
          {t('importBookings.title', { defaultValue: 'Import Bookings' })}
        </Text>
        <View style={styles.headerSpacer} />
      </View>

      <ScrollView
        style={styles.scroll}
        contentContainerStyle={[styles.scrollContent, { paddingBottom: insets.bottom + SPACING.xl }]}
        keyboardShouldPersistTaps="handled"
        showsVerticalScrollIndicator={false}
      >
        {/* Input area */}
        <View style={styles.inputSection}>
          <Text style={styles.sectionLabel}>
            {t('importBookings.pasteLabel', { defaultValue: 'Confirmation email' })}
          </Text>
          <TextInput
            style={styles.textInput}
            value={inputText}
            onChangeText={setInputText}
            placeholder={t('importBookings.placeholder', {
              defaultValue: 'Paste a booking confirmation email and we\'ll extract the details',
            })}
            placeholderTextColor={COLORS.muted}
            multiline
            numberOfLines={12}
            textAlignVertical="top"
          />

          {/* Actions */}
          <View style={styles.buttonRow}>
            {inputText.length > 0 && (
              <Pressable onPress={handleClear} style={styles.clearButton}>
                <Trash2 size={16} color={COLORS.muted} strokeWidth={1.5} />
                <Text style={styles.clearButtonText}>
                  {t('importBookings.clear', { defaultValue: 'Clear' })}
                </Text>
              </Pressable>
            )}
            <Pressable
              onPress={handleParse}
              style={[styles.parseButton, !canParse && styles.parseButtonDisabled]}
              disabled={!canParse}
            >
              <ClipboardPaste size={18} color={canParse ? COLORS.bg : COLORS.muted} strokeWidth={1.5} />
              <Text style={[styles.parseButtonText, !canParse && styles.parseButtonTextDisabled]}>
                {t('importBookings.parse', { defaultValue: 'Parse' })}
              </Text>
            </Pressable>
          </View>
        </View>

        {/* Results */}
        {hasResults && (
          <View style={styles.resultsSection}>
            <Text style={styles.sectionLabel}>
              {t('importBookings.found', {
                defaultValue: `Found ${String(parsedReservations.length)} reservation${parsedReservations.length !== 1 ? 's' : ''}`,
              })}
            </Text>

            {parsedReservations.map((reservation, index) => {
              const Icon = TYPE_ICONS[reservation.type];
              const isAdded = addedIds.includes(index);

              return (
                <View key={`${reservation.type}-${reservation.date}-${index}`} style={styles.card}>
                  <View style={styles.cardHeader}>
                    <View style={styles.typeBadge}>
                      <Icon size={16} color={COLORS.action} strokeWidth={1.5} />
                      <Text style={styles.typeBadgeText}>
                        {TYPE_LABELS[reservation.type]}
                      </Text>
                    </View>
                    {reservation.confirmationCode && (
                      <Text style={styles.confCode}>
                        {reservation.confirmationCode}
                      </Text>
                    )}
                  </View>

                  <Text style={styles.cardTitle} numberOfLines={2}>
                    {reservation.title}
                  </Text>

                  <Text style={styles.cardDate}>
                    {formatReservationDate(reservation.date)}
                    {reservation.time ? ` at ${reservation.time}` : ''}
                    {reservation.endDate
                      ? ` — ${formatReservationDate(reservation.endDate)}`
                      : ''}
                  </Text>

                  {reservation.location && (
                    <Text style={styles.cardLocation} numberOfLines={1}>
                      {reservation.location}
                    </Text>
                  )}

                  <Pressable
                    onPress={() => handleAddToTrip(index)}
                    style={[styles.addButton, isAdded && styles.addButtonDone]}
                    disabled={isAdded}
                  >
                    <Plus
                      size={16}
                      color={isAdded ? COLORS.action : COLORS.bg}
                      strokeWidth={1.5}
                    />
                    <Text style={[styles.addButtonText, isAdded && styles.addButtonTextDone]}>
                      {isAdded
                        ? t('importBookings.added', { defaultValue: 'Added' })
                        : t('importBookings.addToTrip', { defaultValue: 'Add to trip' })}
                    </Text>
                  </Pressable>
                </View>
              );
            })}
          </View>
        )}

        {/* Empty state — shown only after parse with no results */}
        {!hasResults && inputText.length > 10 && parsedReservations.length === 0 && addedIds.length === 0 && (
          <View style={styles.emptyState}>
            <ClipboardPaste size={40} color={COLORS.muted} strokeWidth={1.5} />
            <Text style={styles.emptyText}>
              {t('importBookings.empty', {
                defaultValue: 'Paste a booking confirmation email and we\'ll extract the details',
              })}
            </Text>
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
  } satisfies ViewStyle,

  header: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: SPACING.lg,
    paddingVertical: SPACING.md,
  } satisfies ViewStyle,

  headerTitle: {
    flex: 1,
    textAlign: 'center',
    fontFamily: FONTS.header,
    fontSize: 18,
    color: COLORS.cream,
  } satisfies TextStyle,

  headerSpacer: {
    width: 22,
  } satisfies ViewStyle,

  scroll: {
    flex: 1,
  } satisfies ViewStyle,

  scrollContent: {
    paddingHorizontal: SPACING.lg,
    gap: SPACING.lg,
  } satisfies ViewStyle,

  inputSection: {
    gap: SPACING.sm,
  } satisfies ViewStyle,

  sectionLabel: {
    fontFamily: FONTS.mono,
    fontSize: 12,
    color: COLORS.muted,
    letterSpacing: 0.5,
  } satisfies TextStyle,

  textInput: {
    backgroundColor: COLORS.surface1,
    borderRadius: RADIUS.md,
    borderWidth: 1,
    borderColor: COLORS.border,
    padding: SPACING.md,
    fontFamily: FONTS.body,
    fontSize: 14,
    color: COLORS.cream,
    minHeight: 200,
    lineHeight: 20,
  } satisfies TextStyle,

  buttonRow: {
    flexDirection: 'row',
    justifyContent: 'flex-end',
    alignItems: 'center',
    gap: SPACING.sm,
  } satisfies ViewStyle,

  clearButton: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: SPACING.xs,
    paddingVertical: SPACING.sm,
    paddingHorizontal: SPACING.md,
  } satisfies ViewStyle,

  clearButtonText: {
    fontFamily: FONTS.bodyMedium,
    fontSize: 14,
    color: COLORS.muted,
  } satisfies TextStyle,

  parseButton: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: SPACING.xs,
    backgroundColor: COLORS.action,
    paddingVertical: SPACING.sm + 2,
    paddingHorizontal: SPACING.lg,
    borderRadius: RADIUS.pill,
  } satisfies ViewStyle,

  parseButtonDisabled: {
    backgroundColor: COLORS.surface2,
  } satisfies ViewStyle,

  parseButtonText: {
    fontFamily: FONTS.bodyMedium,
    fontSize: 14,
    color: COLORS.bg,
  } satisfies TextStyle,

  parseButtonTextDisabled: {
    color: COLORS.muted,
  } satisfies TextStyle,

  resultsSection: {
    gap: SPACING.md,
  } satisfies ViewStyle,

  card: {
    backgroundColor: COLORS.surface1,
    borderRadius: RADIUS.md,
    borderWidth: 1,
    borderColor: COLORS.border,
    padding: SPACING.md,
    gap: SPACING.sm,
  } satisfies ViewStyle,

  cardHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
  } satisfies ViewStyle,

  typeBadge: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: SPACING.xs,
    backgroundColor: COLORS.sageVeryFaint,
    paddingVertical: SPACING.xs,
    paddingHorizontal: SPACING.sm,
    borderRadius: RADIUS.pill,
  } satisfies ViewStyle,

  typeBadgeText: {
    fontFamily: FONTS.mono,
    fontSize: 11,
    color: COLORS.action,
    letterSpacing: 0.3,
  } satisfies TextStyle,

  confCode: {
    fontFamily: FONTS.mono,
    fontSize: 12,
    color: COLORS.creamDim,
  } satisfies TextStyle,

  cardTitle: {
    fontFamily: FONTS.headerMedium,
    fontSize: 16,
    color: COLORS.cream,
  } satisfies TextStyle,

  cardDate: {
    fontFamily: FONTS.body,
    fontSize: 13,
    color: COLORS.creamSoft,
  } satisfies TextStyle,

  cardLocation: {
    fontFamily: FONTS.body,
    fontSize: 13,
    color: COLORS.muted,
  } satisfies TextStyle,

  addButton: {
    flexDirection: 'row',
    alignItems: 'center',
    alignSelf: 'flex-start',
    gap: SPACING.xs,
    backgroundColor: COLORS.action,
    paddingVertical: SPACING.xs + 2,
    paddingHorizontal: SPACING.md,
    borderRadius: RADIUS.pill,
    marginTop: SPACING.xs,
  } satisfies ViewStyle,

  addButtonDone: {
    backgroundColor: COLORS.sageVeryFaint,
    borderWidth: 1,
    borderColor: COLORS.sageBorder,
  } satisfies ViewStyle,

  addButtonText: {
    fontFamily: FONTS.bodyMedium,
    fontSize: 13,
    color: COLORS.bg,
  } satisfies TextStyle,

  addButtonTextDone: {
    color: COLORS.action,
  } satisfies TextStyle,

  emptyState: {
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: SPACING.xxl,
    gap: SPACING.md,
  } satisfies ViewStyle,

  emptyText: {
    fontFamily: FONTS.body,
    fontSize: 14,
    color: COLORS.muted,
    textAlign: 'center',
    lineHeight: 20,
    maxWidth: 260,
  } satisfies TextStyle,
});
