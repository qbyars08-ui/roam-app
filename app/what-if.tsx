// =============================================================================
// ROAM — "What if I just went?" Screen
// The information that makes the impossible feel possible.
// =============================================================================

import React, { useCallback, useMemo, useState } from 'react';
import {
  Pressable,
  ScrollView,
  StyleSheet,
  Text,
  TextInput,
  View,
} from 'react-native';
import { LinearGradient } from 'expo-linear-gradient';
import { useRouter } from 'expo-router';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { Coffee, Heart, Home, Map, Plane, Tv, Utensils, X } from 'lucide-react-native';
import { calculateWhatIf, type WhatIfResult } from '../lib/what-if-calculator';
import { COLORS, DESTINATIONS, FONTS, RADIUS, SPACING } from '../lib/constants';
import * as Haptics from '../lib/haptics';

// ---------------------------------------------------------------------------
// Constants
// ---------------------------------------------------------------------------

const DAY_OPTIONS = [3, 5, 7, 10, 14] as const;
type DayOption = (typeof DAY_OPTIONS)[number];

const SAVINGS_PRESETS = [5, 10, 15, 20, 30] as const;

// ---------------------------------------------------------------------------
// Sub-components
// ---------------------------------------------------------------------------

function CloseButton({ onPress }: { onPress: () => void }) {
  return (
    <Pressable
      onPress={onPress}
      style={styles.closeButton}
      hitSlop={{ top: 12, bottom: 12, left: 12, right: 12 }}
      accessibilityRole="button"
      accessibilityLabel="Close"
    >
      <X color={COLORS.creamMuted} size={22} strokeWidth={2} />
    </Pressable>
  );
}

function DayPill({
  days,
  selected,
  onPress,
}: {
  days: DayOption;
  selected: boolean;
  onPress: () => void;
}) {
  return (
    <Pressable
      onPress={onPress}
      style={[styles.dayPill, selected && styles.dayPillSelected]}
      accessibilityRole="button"
      accessibilityState={{ selected }}
    >
      <Text style={[styles.dayPillText, selected && styles.dayPillTextSelected]}>
        {days}d
      </Text>
    </Pressable>
  );
}

function BreakdownCard({
  icon,
  label,
  amount,
}: {
  icon: React.ReactNode;
  label: string;
  amount: number;
}) {
  return (
    <View style={styles.breakdownCard}>
      <View style={styles.breakdownIcon}>{icon}</View>
      <Text style={styles.breakdownLabel}>{label}</Text>
      <Text style={styles.breakdownAmount}>${amount.toLocaleString()}</Text>
    </View>
  );
}

function ComparisonRow({
  icon,
  label,
}: {
  icon: React.ReactNode;
  label: string;
}) {
  return (
    <View style={styles.comparisonRow}>
      <View style={styles.comparisonIcon}>{icon}</View>
      <Text style={styles.comparisonText}>{label}</Text>
    </View>
  );
}

function SavingsChip({
  amount,
  selected,
  onPress,
}: {
  amount: number;
  selected: boolean;
  onPress: () => void;
}) {
  return (
    <Pressable
      onPress={onPress}
      style={[styles.savingsChip, selected && styles.savingsChipSelected]}
      accessibilityRole="button"
      accessibilityState={{ selected }}
    >
      <Text style={[styles.savingsChipText, selected && styles.savingsChipTextSelected]}>
        ${amount}/day
      </Text>
    </Pressable>
  );
}

function DestinationChip({
  label,
  onPress,
}: {
  label: string;
  onPress: () => void;
}) {
  return (
    <Pressable
      onPress={onPress}
      style={styles.destChip}
      accessibilityRole="button"
    >
      <Text style={styles.destChipText}>{label}</Text>
    </Pressable>
  );
}

// ---------------------------------------------------------------------------
// Main screen
// ---------------------------------------------------------------------------

export default function WhatIfScreen() {
  const router = useRouter();
  const insets = useSafeAreaInsets();

  const [query, setQuery] = useState('');
  const [selectedDest, setSelectedDest] = useState<string | null>(null);
  const [selectedDays, setSelectedDays] = useState<DayOption>(7);
  const [savingsPerDay, setSavingsPerDay] = useState<number>(10);
  const [bookmarked, setBookmarked] = useState(false);

  // Autocomplete suggestions — filter on query
  const suggestions = useMemo(() => {
    const q = query.trim().toLowerCase();
    if (!q || selectedDest) return [];
    return DESTINATIONS.filter((d) => d.label.toLowerCase().startsWith(q)).slice(0, 6);
  }, [query, selectedDest]);

  // Calculator result
  const result: WhatIfResult | null = useMemo(() => {
    if (!selectedDest) return null;
    return calculateWhatIf(selectedDest, selectedDays);
  }, [selectedDest, selectedDays]);

  const savingMonths = useMemo(() => {
    if (!result) return null;
    const months = result.savingMonths(savingsPerDay);
    return months === Infinity ? null : months;
  }, [result, savingsPerDay]);

  // Handlers
  const handleClose = useCallback(() => {
    void Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
    router.back();
  }, [router]);

  const handleSelectDest = useCallback(
    (label: string) => {
      void Haptics.selectionAsync();
      setSelectedDest(label);
      setQuery(label);
    },
    [],
  );

  const handleClearDest = useCallback(() => {
    void Haptics.selectionAsync();
    setSelectedDest(null);
    setQuery('');
    setBookmarked(false);
  }, []);

  const handleSelectDays = useCallback(
    (days: DayOption) => {
      void Haptics.selectionAsync();
      setSelectedDays(days);
    },
    [],
  );

  const handleSelectSavings = useCallback(
    (amount: number) => {
      void Haptics.selectionAsync();
      setSavingsPerDay(amount);
    },
    [],
  );

  const handleBookmark = useCallback(() => {
    void Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Medium);
    setBookmarked((prev) => !prev);
  }, []);

  const handleQueryChange = useCallback(
    (text: string) => {
      setQuery(text);
      if (selectedDest && text !== selectedDest) {
        setSelectedDest(null);
        setBookmarked(false);
      }
    },
    [selectedDest],
  );

  return (
    <View style={[styles.root, { paddingTop: insets.top }]}>
      <LinearGradient
        colors={[COLORS.gradientForestDeep, COLORS.bg]}
        locations={[0, 0.5]}
        style={StyleSheet.absoluteFill}
        pointerEvents="none"
      />

      {/* Header row */}
      <View style={styles.headerRow}>
        <View style={styles.headerTextBlock}>
          <Text style={styles.headerTitle}>What if I just went?</Text>
          <Text style={styles.headerSubtitle}>No commitment. Just the math.</Text>
        </View>
        <CloseButton onPress={handleClose} />
      </View>

      <ScrollView
        style={styles.scroll}
        contentContainerStyle={[
          styles.scrollContent,
          { paddingBottom: insets.bottom + SPACING.xxl },
        ]}
        keyboardShouldPersistTaps="handled"
        showsVerticalScrollIndicator={false}
      >
        {/* ------------------------------------------------------------------ */}
        {/* Input section                                                        */}
        {/* ------------------------------------------------------------------ */}
        <View style={styles.section}>
          <Text style={styles.sectionLabel}>DESTINATION</Text>
          <View style={styles.inputWrapper}>
            <TextInput
              style={styles.textInput}
              value={query}
              onChangeText={handleQueryChange}
              placeholder="Search destinations..."
              placeholderTextColor={COLORS.creamMuted}
              autoCorrect={false}
              autoCapitalize="words"
              returnKeyType="done"
              accessibilityLabel="Destination search"
            />
            {selectedDest ? (
              <Pressable onPress={handleClearDest} hitSlop={8}>
                <X color={COLORS.creamMuted} size={18} strokeWidth={2} />
              </Pressable>
            ) : null}
          </View>

          {/* Autocomplete chips */}
          {suggestions.length > 0 ? (
            <View style={styles.suggestionRow}>
              {suggestions.map((d) => (
                <DestinationChip
                  key={d.label}
                  label={d.label}
                  onPress={() => handleSelectDest(d.label)}
                />
              ))}
            </View>
          ) : null}
        </View>

        {/* Days selector */}
        <View style={styles.section}>
          <Text style={styles.sectionLabel}>HOW LONG?</Text>
          <View style={styles.dayRow}>
            {DAY_OPTIONS.map((days) => (
              <DayPill
                key={days}
                days={days}
                selected={selectedDays === days}
                onPress={() => handleSelectDays(days)}
              />
            ))}
          </View>
        </View>

        {/* ------------------------------------------------------------------ */}
        {/* Results                                                              */}
        {/* ------------------------------------------------------------------ */}
        {result ? (
          <>
            {/* Big total */}
            <View style={styles.totalBlock}>
              <Text style={styles.totalCost}>
                ${result.totalCost.toLocaleString()}
              </Text>
              <Text style={styles.totalSubtitle}>
                for {result.days} days in {result.destination}
              </Text>
            </View>

            {/* Breakdown 2x2 grid */}
            <View style={styles.section}>
              <Text style={styles.sectionLabel}>BREAKDOWN</Text>
              <View style={styles.breakdownGrid}>
                <BreakdownCard
                  icon={<Plane color={COLORS.sage} size={18} strokeWidth={2} />}
                  label="Flights"
                  amount={result.breakdown.flights}
                />
                <BreakdownCard
                  icon={<Home color={COLORS.sage} size={18} strokeWidth={2} />}
                  label="Accommodation"
                  amount={result.breakdown.accommodation}
                />
                <BreakdownCard
                  icon={<Utensils color={COLORS.sage} size={18} strokeWidth={2} />}
                  label="Food"
                  amount={result.breakdown.food}
                />
                <BreakdownCard
                  icon={<Map color={COLORS.sage} size={18} strokeWidth={2} />}
                  label="Activities"
                  amount={result.breakdown.activities}
                />
              </View>
            </View>

            {/* Fun comparisons */}
            <View style={styles.section}>
              <Text style={styles.sectionLabel}>PERSPECTIVE</Text>
              <View style={styles.comparisonsCard}>
                <ComparisonRow
                  icon={<Coffee color={COLORS.gold} size={18} strokeWidth={2} />}
                  label={`That's ${result.lattes.toLocaleString()} lattes you won't drink`}
                />
                <View style={styles.divider} />
                <ComparisonRow
                  icon={<Tv color={COLORS.gold} size={18} strokeWidth={2} />}
                  label={`That's ${result.streamingMonths} months of streaming services`}
                />
              </View>
            </View>

            {/* Savings calculator */}
            <View style={styles.section}>
              <Text style={styles.sectionLabel}>SAVINGS CALCULATOR</Text>
              <View style={styles.savingsCard}>
                <Text style={styles.savingsQuestion}>
                  How much could you save per day?
                </Text>
                <View style={styles.savingsChipRow}>
                  {SAVINGS_PRESETS.map((amount) => (
                    <SavingsChip
                      key={amount}
                      amount={amount}
                      selected={savingsPerDay === amount}
                      onPress={() => handleSelectSavings(amount)}
                    />
                  ))}
                </View>
                <View style={styles.savingsResult}>
                  {savingMonths !== null ? (
                    <>
                      <Text style={styles.savingsMonthsBig}>{savingMonths}</Text>
                      <Text style={styles.savingsMonthsLabel}>
                        {savingMonths === 1 ? 'month' : 'months'} saving ${savingsPerDay}/day
                      </Text>
                    </>
                  ) : (
                    <Text style={styles.savingsMutedLabel}>
                      Enter a daily savings amount above
                    </Text>
                  )}
                </View>
              </View>
            </View>

            {/* Encouragement */}
            <Text style={styles.encouragement}>{result.encouragement}</Text>

            {/* Dream about this button */}
            <Pressable
              onPress={handleBookmark}
              style={({ pressed }) => [
                styles.dreamButton,
                bookmarked && styles.dreamButtonBookmarked,
                pressed && styles.dreamButtonPressed,
              ]}
              accessibilityRole="button"
              accessibilityLabel={
                bookmarked ? 'Saved to bookmarks' : 'Dream about this'
              }
            >
              <Heart
                color={bookmarked ? COLORS.coral : COLORS.cream}
                size={20}
                strokeWidth={2}
                fill={bookmarked ? COLORS.coral : 'none'}
              />
              <Text
                style={[
                  styles.dreamButtonText,
                  bookmarked && styles.dreamButtonTextBookmarked,
                ]}
              >
                {bookmarked ? 'Saved to dreams' : 'Dream about this →'}
              </Text>
            </Pressable>
          </>
        ) : (
          /* Empty state placeholder */
          <View style={styles.emptyState}>
            <Plane color={COLORS.sageMuted} size={40} strokeWidth={1.5} />
            <Text style={styles.emptyStateText}>
              Pick a destination to see what it would actually cost.
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
  root: {
    flex: 1,
    backgroundColor: COLORS.bg,
  },
  scroll: {
    flex: 1,
  },
  scrollContent: {
    paddingHorizontal: SPACING.md,
    paddingTop: SPACING.sm,
  },

  // Header
  headerRow: {
    flexDirection: 'row',
    alignItems: 'flex-start',
    justifyContent: 'space-between',
    paddingHorizontal: SPACING.md,
    paddingTop: SPACING.md,
    paddingBottom: SPACING.sm,
  },
  headerTextBlock: {
    flex: 1,
    marginRight: SPACING.md,
  },
  headerTitle: {
    fontFamily: FONTS.header,
    fontSize: 34,
    fontStyle: 'italic',
    color: COLORS.cream,
    lineHeight: 40,
  },
  headerSubtitle: {
    fontFamily: FONTS.body,
    fontSize: 13,
    color: COLORS.creamMuted,
    marginTop: 4,
  },
  closeButton: {
    width: 36,
    height: 36,
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: COLORS.bgElevated,
    borderRadius: RADIUS.full,
    marginTop: 4,
  },

  // Sections
  section: {
    marginBottom: SPACING.lg,
  },
  sectionLabel: {
    fontFamily: FONTS.mono,
    fontSize: 11,
    color: COLORS.creamMuted,
    letterSpacing: 1.2,
    marginBottom: SPACING.sm,
  },

  // Destination input
  inputWrapper: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: COLORS.bgElevated,
    borderRadius: RADIUS.md,
    borderWidth: 1,
    borderColor: COLORS.border,
    paddingHorizontal: SPACING.md,
    paddingVertical: SPACING.sm + 2,
    gap: SPACING.sm,
  },
  textInput: {
    flex: 1,
    fontFamily: FONTS.body,
    fontSize: 16,
    color: COLORS.cream,
    padding: 0,
  },
  suggestionRow: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: SPACING.sm,
    marginTop: SPACING.sm,
  },
  destChip: {
    backgroundColor: COLORS.sageSubtle,
    borderWidth: 1,
    borderColor: COLORS.sageBorder,
    borderRadius: RADIUS.full,
    paddingHorizontal: SPACING.md,
    paddingVertical: SPACING.xs + 2,
  },
  destChipText: {
    fontFamily: FONTS.bodyMedium,
    fontSize: 14,
    color: COLORS.sage,
  },

  // Day pills
  dayRow: {
    flexDirection: 'row',
    gap: SPACING.sm,
  },
  dayPill: {
    flex: 1,
    paddingVertical: SPACING.sm,
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: COLORS.bgElevated,
    borderRadius: RADIUS.md,
    borderWidth: 1,
    borderColor: COLORS.border,
  },
  dayPillSelected: {
    backgroundColor: COLORS.sageSubtle,
    borderColor: COLORS.sageBorder,
  },
  dayPillText: {
    fontFamily: FONTS.bodyMedium,
    fontSize: 14,
    color: COLORS.creamMuted,
  },
  dayPillTextSelected: {
    color: COLORS.sage,
  },

  // Total cost block
  totalBlock: {
    alignItems: 'center',
    paddingVertical: SPACING.xl,
    marginBottom: SPACING.md,
  },
  totalCost: {
    fontFamily: FONTS.header,
    fontSize: 64,
    color: COLORS.cream,
    lineHeight: 72,
  },
  totalSubtitle: {
    fontFamily: FONTS.body,
    fontSize: 15,
    color: COLORS.creamMuted,
    marginTop: SPACING.xs,
  },

  // Breakdown grid
  breakdownGrid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: SPACING.sm,
  },
  breakdownCard: {
    width: '47.5%',
    backgroundColor: COLORS.bgCard,
    borderRadius: RADIUS.md,
    borderWidth: 1,
    borderColor: COLORS.border,
    padding: SPACING.md,
    gap: SPACING.xs,
  },
  breakdownIcon: {
    marginBottom: 2,
  },
  breakdownLabel: {
    fontFamily: FONTS.body,
    fontSize: 12,
    color: COLORS.creamMuted,
  },
  breakdownAmount: {
    fontFamily: FONTS.header,
    fontSize: 26,
    color: COLORS.cream,
    lineHeight: 30,
  },

  // Comparisons
  comparisonsCard: {
    backgroundColor: COLORS.bgCard,
    borderRadius: RADIUS.md,
    borderWidth: 1,
    borderColor: COLORS.border,
    overflow: 'hidden',
  },
  comparisonRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: SPACING.md,
    padding: SPACING.md,
  },
  comparisonIcon: {
    width: 36,
    height: 36,
    borderRadius: RADIUS.full,
    backgroundColor: COLORS.goldSubtle,
    alignItems: 'center',
    justifyContent: 'center',
  },
  comparisonText: {
    flex: 1,
    fontFamily: FONTS.body,
    fontSize: 14,
    color: COLORS.creamSoft,
    lineHeight: 20,
  },
  divider: {
    height: 1,
    backgroundColor: COLORS.border,
    marginHorizontal: SPACING.md,
  },

  // Savings calculator
  savingsCard: {
    backgroundColor: COLORS.bgCard,
    borderRadius: RADIUS.md,
    borderWidth: 1,
    borderColor: COLORS.border,
    padding: SPACING.md,
    gap: SPACING.md,
  },
  savingsQuestion: {
    fontFamily: FONTS.body,
    fontSize: 14,
    color: COLORS.creamMuted,
  },
  savingsChipRow: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: SPACING.sm,
  },
  savingsChip: {
    paddingHorizontal: SPACING.md,
    paddingVertical: SPACING.xs + 2,
    borderRadius: RADIUS.full,
    backgroundColor: COLORS.bgElevated,
    borderWidth: 1,
    borderColor: COLORS.border,
  },
  savingsChipSelected: {
    backgroundColor: COLORS.sageSubtle,
    borderColor: COLORS.sageBorder,
  },
  savingsChipText: {
    fontFamily: FONTS.mono,
    fontSize: 13,
    color: COLORS.creamMuted,
  },
  savingsChipTextSelected: {
    color: COLORS.sage,
  },
  savingsResult: {
    alignItems: 'center',
    paddingTop: SPACING.sm,
    paddingBottom: SPACING.xs,
  },
  savingsMonthsBig: {
    fontFamily: FONTS.header,
    fontSize: 56,
    color: COLORS.cream,
    lineHeight: 62,
  },
  savingsMonthsLabel: {
    fontFamily: FONTS.body,
    fontSize: 14,
    color: COLORS.creamMuted,
    marginTop: 4,
  },
  savingsMutedLabel: {
    fontFamily: FONTS.body,
    fontSize: 13,
    color: COLORS.creamMuted,
    fontStyle: 'italic',
  },

  // Encouragement
  encouragement: {
    fontFamily: FONTS.header,
    fontSize: 20,
    fontStyle: 'italic',
    color: COLORS.creamSoft,
    textAlign: 'center',
    lineHeight: 28,
    paddingHorizontal: SPACING.md,
    marginBottom: SPACING.xl,
    marginTop: SPACING.xs,
  },

  // Dream button
  dreamButton: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: SPACING.sm,
    backgroundColor: COLORS.sageSubtle,
    borderWidth: 1,
    borderColor: COLORS.sageBorder,
    borderRadius: RADIUS.lg,
    paddingVertical: SPACING.md,
    paddingHorizontal: SPACING.xl,
    marginBottom: SPACING.lg,
  },
  dreamButtonBookmarked: {
    backgroundColor: COLORS.coralSubtle,
    borderColor: COLORS.coralBorder,
  },
  dreamButtonPressed: {
    opacity: 0.75,
  },
  dreamButtonText: {
    fontFamily: FONTS.bodySemiBold,
    fontSize: 16,
    color: COLORS.cream,
  },
  dreamButtonTextBookmarked: {
    color: COLORS.coral,
  },

  // Empty state
  emptyState: {
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: SPACING.xxxl,
    gap: SPACING.md,
  },
  emptyStateText: {
    fontFamily: FONTS.body,
    fontSize: 15,
    color: COLORS.creamMuted,
    textAlign: 'center',
    paddingHorizontal: SPACING.xl,
    lineHeight: 22,
  },
});
