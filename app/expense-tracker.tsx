// =============================================================================
// ROAM — Expense Tracker
// Track actual spending vs AI budget estimate. Beautiful category breakdown,
// daily spending chart, and budget comparison. Pure engagement feature.
// =============================================================================
import React, { useCallback, useEffect, useMemo, useState } from 'react';
import {
  Alert,
  Dimensions,
  Modal,
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
import * as Haptics from '../lib/haptics';
import { COLORS, FONTS, SPACING, RADIUS } from '../lib/constants';
import { useAppStore } from '../lib/store';
import { parseItinerary, type Itinerary } from '../lib/types/itinerary';
import { getDestinationTheme } from '../lib/destination-themes';
import {
  getExpensesForTrip,
  addExpense,
  removeExpense,
  createExpense,
  formatCurrency,
  getTripExpenseSummary,
  EXPENSE_CATEGORIES,
  type Expense,
  type ExpenseCategory,
  type TripExpenseSummary,
} from '../lib/expense-tracker';
import {
  ChevronLeft, Plus, Trash2, TrendingUp, TrendingDown,
  Wallet, X, Check, DollarSign,
} from 'lucide-react-native';

const { width: SCREEN_WIDTH } = Dimensions.get('window');
const BAR_MAX_WIDTH = SCREEN_WIDTH - SPACING.lg * 2 - 80;

// =============================================================================
// Category breakdown bar
// =============================================================================
const CategoryBar = React.memo(function CategoryBar({
  category,
  amount,
  maxAmount,
  currency,
}: {
  category: (typeof EXPENSE_CATEGORIES)[number];
  amount: number;
  maxAmount: number;
  currency: string;
}) {
  const width = maxAmount > 0 ? (amount / maxAmount) * BAR_MAX_WIDTH : 0;

  if (amount === 0) return null;

  return (
    <View style={styles.catBarRow}>
      <Text style={styles.catBarEmoji}>{category.emoji}</Text>
      <View style={styles.catBarInfo}>
        <View style={styles.catBarLabelRow}>
          <Text style={styles.catBarLabel}>{category.label}</Text>
          <Text style={styles.catBarAmount}>{formatCurrency(amount, currency)}</Text>
        </View>
        <View style={styles.catBarTrack}>
          <View
            style={[
              styles.catBarFill,
              { width: Math.max(4, width) },
            ]}
          />
        </View>
      </View>
    </View>
  );
});

// =============================================================================
// Main Screen
// =============================================================================
function ExpenseTrackerScreen() {
  const { tripId } = useLocalSearchParams<{ tripId?: string }>();
  const router = useRouter();
  const insets = useSafeAreaInsets();
  const trips = useAppStore((s) => s.trips);

  const trip = useMemo(
    () => trips.find((t) => t.id === tripId) ?? null,
    [trips, tripId]
  );

  const itinerary = useMemo<Itinerary | null>(() => {
    if (!trip?.itinerary) return null;
    try {
      return parseItinerary(trip.itinerary);
    } catch {
      return null;
    }
  }, [trip?.itinerary]);

  const theme = useMemo(
    () => (trip ? getDestinationTheme(trip.destination) : null),
    [trip?.destination]
  );

  const [expenses, setExpenses] = useState<Expense[]>([]);
  const [summary, setSummary] = useState<TripExpenseSummary | null>(null);
  const [showAddModal, setShowAddModal] = useState(false);

  // Add expense form state
  const [newAmount, setNewAmount] = useState('');
  const [newCategory, setNewCategory] = useState<ExpenseCategory>('food');
  const [newNote, setNewNote] = useState('');
  const [newDay, setNewDay] = useState(1);

  const currency = 'USD'; // Will be dynamic from user prefs

  // Load expenses
  const refreshExpenses = useCallback(async () => {
    if (!tripId) return;
    const exps = await getExpensesForTrip(tripId);
    setExpenses(exps);
    const sum = await getTripExpenseSummary(tripId, currency);
    setSummary(sum);
  }, [tripId, currency]);

  useEffect(() => {
    refreshExpenses();
  }, [refreshExpenses]);

  // AI budget estimate from itinerary
  const aiBudgetEstimate = useMemo(() => {
    if (!itinerary?.totalBudget) return null;
    const match = itinerary.totalBudget.match(/[\d,]+/);
    if (!match) return null;
    return parseInt(match[0].replace(/,/g, ''), 10);
  }, [itinerary?.totalBudget]);

  // Budget comparison
  const budgetDiff = useMemo(() => {
    if (!aiBudgetEstimate || !summary) return null;
    const diff = summary.totalSpent - aiBudgetEstimate;
    const pct = Math.round((diff / aiBudgetEstimate) * 100);
    return { diff, pct, over: diff > 0 };
  }, [aiBudgetEstimate, summary]);

  // Max category amount for bar scaling
  const maxCategoryAmount = useMemo(() => {
    if (!summary) return 0;
    return Math.max(...Object.values(summary.byCategory));
  }, [summary]);

  // Handle add expense
  const handleAddExpense = useCallback(async () => {
    const amount = parseFloat(newAmount);
    if (isNaN(amount) || amount <= 0) {
      Alert.alert('Invalid amount', 'Please enter a valid amount.');
      return;
    }
    if (!tripId) return;

    const expense = createExpense({
      tripId,
      amount,
      currency,
      category: newCategory,
      note: newNote.trim(),
      dayNumber: newDay,
    });

    await addExpense(expense);
    Haptics.notificationAsync(Haptics.NotificationFeedbackType.Success);
    setNewAmount('');
    setNewNote('');
    setShowAddModal(false);
    await refreshExpenses();
  }, [tripId, newAmount, newCategory, newNote, newDay, currency, refreshExpenses]);

  // Handle delete expense
  const handleDeleteExpense = useCallback(
    async (expenseId: string) => {
      Alert.alert('Delete expense?', 'This can\'t be undone.', [
        { text: 'Cancel', style: 'cancel' },
        {
          text: 'Delete',
          style: 'destructive',
          onPress: async () => {
            await removeExpense(expenseId);
            Haptics.notificationAsync(Haptics.NotificationFeedbackType.Success);
            await refreshExpenses();
          },
        },
      ]);
    },
    [refreshExpenses]
  );

  if (!trip || !theme) {
    return (
      <View style={[styles.screen, { paddingTop: insets.top }]}>
        <View style={styles.emptyCenter}>
          <Text style={styles.emptyTitle}>No trip found</Text>
          <Pressable onPress={() => router.back()} style={styles.backPill}>
            <Text style={styles.backPillText}>Go back</Text>
          </Pressable>
        </View>
      </View>
    );
  }

  return (
    <View style={[styles.screen, { paddingTop: insets.top }]}>
      {/* Header */}
      <View style={styles.header}>
        <Pressable onPress={() => router.back()} hitSlop={12}>
          <ChevronLeft size={28} color={COLORS.cream} strokeWidth={2} />
        </Pressable>
        <View style={styles.headerCenter}>
          <Text style={styles.headerTitle}>Expenses</Text>
          <Text style={styles.headerSub}>{trip.destination}</Text>
        </View>
        <Pressable
          onPress={() => {
            Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Medium);
            setShowAddModal(true);
          }}
          hitSlop={12}
        >
          <Plus size={24} color={COLORS.sage} strokeWidth={2} />
        </Pressable>
      </View>

      <ScrollView
        contentContainerStyle={[styles.scrollContent, { paddingBottom: insets.bottom + 100 }]}
        showsVerticalScrollIndicator={false}
      >
        {/* Total spending card */}
        <View style={[styles.totalCard, { borderColor: theme.primary }]}>
          <Text style={styles.totalLabel}>TOTAL SPENT</Text>
          <Text style={[styles.totalAmount, { color: theme.primary }]}>
            {formatCurrency(summary?.totalSpent ?? 0, currency)}
          </Text>
          <Text style={styles.totalExpenseCount}>
            {summary?.expenseCount ?? 0} expense{(summary?.expenseCount ?? 0) !== 1 ? 's' : ''}
          </Text>

          {/* Budget comparison */}
          {aiBudgetEstimate && budgetDiff && (
            <View style={styles.budgetComparison}>
              <View style={styles.budgetCompRow}>
                <Wallet size={14} color={COLORS.creamMuted} strokeWidth={2} />
                <Text style={styles.budgetCompLabel}>
                  AI Estimate: {formatCurrency(aiBudgetEstimate, currency)}
                </Text>
              </View>
              <View style={styles.budgetCompRow}>
                {budgetDiff.over ? (
                  <TrendingUp size={14} color={COLORS.coral} strokeWidth={2} />
                ) : (
                  <TrendingDown size={14} color={COLORS.sage} strokeWidth={2} />
                )}
                <Text
                  style={[
                    styles.budgetCompDiff,
                    { color: budgetDiff.over ? COLORS.coral : COLORS.sage },
                  ]}
                >
                  {budgetDiff.over ? '+' : ''}{budgetDiff.pct}% (
                  {budgetDiff.over ? '+' : ''}{formatCurrency(budgetDiff.diff, currency)})
                </Text>
              </View>
            </View>
          )}
        </View>

        {/* Category breakdown */}
        {summary && summary.totalSpent > 0 && (
          <View style={styles.breakdownCard}>
            <Text style={styles.breakdownTitle}>By Category</Text>
            {EXPENSE_CATEGORIES.map((cat) => (
              <CategoryBar
                key={cat.id}
                category={cat}
                amount={summary.byCategory[cat.id]}
                maxAmount={maxCategoryAmount}
                currency={currency}
              />
            ))}
          </View>
        )}

        {/* Recent expenses */}
        <View style={styles.recentSection}>
          <Text style={styles.recentTitle}>Recent Expenses</Text>
          {expenses.length === 0 ? (
            <View style={styles.emptyExpenses}>
              <DollarSign size={32} color={COLORS.creamMuted} strokeWidth={1.5} />
              <Text style={styles.emptyExpensesTitle}>No expenses yet</Text>
              <Text style={styles.emptyExpensesSub}>
                Tap + to start tracking your spending on this trip.
              </Text>
            </View>
          ) : (
            expenses.map((expense) => {
              const cat = EXPENSE_CATEGORIES.find((c) => c.id === expense.category);
              return (
                <Pressable
                  key={expense.id}
                  onLongPress={() => handleDeleteExpense(expense.id)}
                  style={({ pressed }) => [
                    styles.expenseRow,
                    { opacity: pressed ? 0.7 : 1 },
                  ]}
                >
                  <Text style={styles.expenseEmoji}>{cat?.emoji ?? '\u{1F4CC}'}</Text>
                  <View style={{ flex: 1 }}>
                    <Text style={styles.expenseNote}>
                      {expense.note || cat?.label || expense.category}
                    </Text>
                    <Text style={styles.expenseDay}>
                      Day {expense.dayNumber} · {new Date(expense.createdAt).toLocaleDateString('en-US', { month: 'short', day: 'numeric' })}
                    </Text>
                  </View>
                  <Text style={styles.expenseAmount}>
                    {formatCurrency(expense.amount, expense.currency)}
                  </Text>
                </Pressable>
              );
            })
          )}
        </View>
      </ScrollView>

      {/* Add expense FAB */}
      <Pressable
        onPress={() => {
          Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Medium);
          setShowAddModal(true);
        }}
        style={({ pressed }) => [
          styles.fab,
          {
            backgroundColor: theme.primary,
            bottom: insets.bottom + 20,
            opacity: pressed ? 0.85 : 1,
          },
        ]}
      >
        <Plus size={28} color="#000" strokeWidth={2.5} />
      </Pressable>

      {/* Add expense modal */}
      <Modal
        visible={showAddModal}
        transparent
        animationType="slide"
        onRequestClose={() => setShowAddModal(false)}
      >
        <Pressable style={styles.modalBackdrop} onPress={() => setShowAddModal(false)}>
          <Pressable
            style={[styles.modalContent, { paddingBottom: insets.bottom + SPACING.lg }]}
            onPress={(e) => e.stopPropagation()}
          >
            <View style={styles.modalHeader}>
              <Text style={styles.modalTitle}>Add Expense</Text>
              <Pressable onPress={() => setShowAddModal(false)} hitSlop={12}>
                <X size={24} color={COLORS.cream} strokeWidth={2} />
              </Pressable>
            </View>

            {/* Amount */}
            <View style={styles.amountInputWrap}>
              <Text style={styles.amountPrefix}>$</Text>
              <TextInput
                style={styles.amountInput}
                value={newAmount}
                onChangeText={setNewAmount}
                keyboardType="decimal-pad"
                placeholder="0.00"
                placeholderTextColor={COLORS.creamMuted}
                autoFocus
              />
            </View>

            {/* Category selector */}
            <Text style={styles.modalFieldLabel}>Category</Text>
            <ScrollView
              horizontal
              showsHorizontalScrollIndicator={false}
              contentContainerStyle={styles.catScroll}
            >
              {EXPENSE_CATEGORIES.map((cat) => {
                const active = newCategory === cat.id;
                return (
                  <Pressable
                    key={cat.id}
                    onPress={() => {
                      Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
                      setNewCategory(cat.id);
                    }}
                    style={[styles.catPill, active && styles.catPillActive]}
                  >
                    <Text style={styles.catPillEmoji}>{cat.emoji}</Text>
                    <Text style={[styles.catPillText, active && styles.catPillTextActive]}>
                      {cat.label}
                    </Text>
                  </Pressable>
                );
              })}
            </ScrollView>

            {/* Note */}
            <Text style={styles.modalFieldLabel}>Note (optional)</Text>
            <TextInput
              style={styles.noteInput}
              value={newNote}
              onChangeText={setNewNote}
              placeholder="What was this for?"
              placeholderTextColor={COLORS.creamMuted}
            />

            {/* Day selector */}
            <Text style={styles.modalFieldLabel}>Day</Text>
            <ScrollView
              horizontal
              showsHorizontalScrollIndicator={false}
              contentContainerStyle={styles.dayScroll}
            >
              {Array.from({ length: trip.days }, (_, i) => i + 1).map((day) => {
                const active = newDay === day;
                return (
                  <Pressable
                    key={day}
                    onPress={() => {
                      Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
                      setNewDay(day);
                    }}
                    style={[styles.dayChip, active && { backgroundColor: theme.primary, borderColor: theme.primary }]}
                  >
                    <Text style={[styles.dayChipText, active && { color: '#000' }]}>
                      {day}
                    </Text>
                  </Pressable>
                );
              })}
            </ScrollView>

            {/* Submit */}
            <Pressable
              onPress={handleAddExpense}
              style={({ pressed }) => [
                styles.submitBtn,
                { backgroundColor: theme.primary, opacity: pressed ? 0.85 : 1 },
              ]}
            >
              <Check size={20} color="#000" strokeWidth={2.5} />
              <Text style={styles.submitBtnText}>Add Expense</Text>
            </Pressable>
          </Pressable>
        </Pressable>
      </Modal>
    </View>
  );
}

export default ExpenseTrackerScreen;

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
    color: COLORS.creamMuted,
    letterSpacing: 1,
  } as TextStyle,
  scrollContent: {
    paddingHorizontal: SPACING.lg,
    gap: SPACING.lg,
  } as ViewStyle,

  // Total card
  totalCard: {
    backgroundColor: COLORS.bgCard,
    borderRadius: RADIUS.xl,
    borderWidth: 1,
    padding: SPACING.xl,
    alignItems: 'center',
    gap: SPACING.xs,
  } as ViewStyle,
  totalLabel: {
    fontFamily: FONTS.mono,
    fontSize: 10,
    color: COLORS.creamMuted,
    letterSpacing: 2,
  } as TextStyle,
  totalAmount: {
    fontFamily: FONTS.header,
    fontSize: 48,
  } as TextStyle,
  totalExpenseCount: {
    fontFamily: FONTS.mono,
    fontSize: 11,
    color: COLORS.creamMuted,
  } as TextStyle,
  budgetComparison: {
    marginTop: SPACING.md,
    gap: SPACING.xs,
    width: '100%',
  } as ViewStyle,
  budgetCompRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: SPACING.sm,
    justifyContent: 'center',
  } as ViewStyle,
  budgetCompLabel: {
    fontFamily: FONTS.mono,
    fontSize: 12,
    color: COLORS.creamMuted,
  } as TextStyle,
  budgetCompDiff: {
    fontFamily: FONTS.bodySemiBold,
    fontSize: 14,
  } as TextStyle,

  // Breakdown
  breakdownCard: {
    backgroundColor: COLORS.bgCard,
    borderRadius: RADIUS.xl,
    borderWidth: 1,
    borderColor: COLORS.border,
    padding: SPACING.lg,
    gap: SPACING.md,
  } as ViewStyle,
  breakdownTitle: {
    fontFamily: FONTS.header,
    fontSize: 18,
    color: COLORS.cream,
  } as TextStyle,
  catBarRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: SPACING.sm,
  } as ViewStyle,
  catBarEmoji: {
    fontSize: 20,
    width: 28,
    textAlign: 'center',
  } as TextStyle,
  catBarInfo: {
    flex: 1,
    gap: 4,
  } as ViewStyle,
  catBarLabelRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
  } as ViewStyle,
  catBarLabel: {
    fontFamily: FONTS.body,
    fontSize: 13,
    color: COLORS.cream,
  } as TextStyle,
  catBarAmount: {
    fontFamily: FONTS.mono,
    fontSize: 12,
    color: COLORS.creamMuted,
  } as TextStyle,
  catBarTrack: {
    height: 6,
    backgroundColor: COLORS.bgGlass,
    borderRadius: 3,
    overflow: 'hidden',
  } as ViewStyle,
  catBarFill: {
    height: '100%',
    backgroundColor: COLORS.sage,
    borderRadius: 3,
  } as ViewStyle,

  // Recent expenses
  recentSection: {
    gap: SPACING.sm,
  } as ViewStyle,
  recentTitle: {
    fontFamily: FONTS.header,
    fontSize: 18,
    color: COLORS.cream,
  } as TextStyle,
  expenseRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: SPACING.md,
    backgroundColor: COLORS.bgCard,
    borderRadius: RADIUS.lg,
    borderWidth: 1,
    borderColor: COLORS.border,
    padding: SPACING.md,
  } as ViewStyle,
  expenseEmoji: {
    fontSize: 24,
  } as TextStyle,
  expenseNote: {
    fontFamily: FONTS.bodySemiBold,
    fontSize: 14,
    color: COLORS.cream,
  } as TextStyle,
  expenseDay: {
    fontFamily: FONTS.mono,
    fontSize: 11,
    color: COLORS.creamMuted,
    marginTop: 2,
  } as TextStyle,
  expenseAmount: {
    fontFamily: FONTS.header,
    fontSize: 18,
    color: COLORS.cream,
  } as TextStyle,

  // Empty
  emptyExpenses: {
    alignItems: 'center',
    paddingVertical: SPACING.xl,
    gap: SPACING.sm,
  } as ViewStyle,
  emptyExpensesTitle: {
    fontFamily: FONTS.header,
    fontSize: 18,
    color: COLORS.cream,
  } as TextStyle,
  emptyExpensesSub: {
    fontFamily: FONTS.body,
    fontSize: 13,
    color: COLORS.creamMuted,
    textAlign: 'center',
    lineHeight: 20,
  } as TextStyle,

  // FAB
  fab: {
    position: 'absolute',
    right: SPACING.lg,
    width: 56,
    height: 56,
    borderRadius: 28,
    alignItems: 'center',
    justifyContent: 'center',
    elevation: 6,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.3,
    shadowRadius: 8,
  } as ViewStyle,

  // Modal
  modalBackdrop: {
    flex: 1,
    backgroundColor: 'rgba(0,0,0,0.7)',
    justifyContent: 'flex-end',
  } as ViewStyle,
  modalContent: {
    backgroundColor: COLORS.bgCard,
    borderTopLeftRadius: RADIUS.xl,
    borderTopRightRadius: RADIUS.xl,
    padding: SPACING.lg,
    gap: SPACING.md,
  } as ViewStyle,
  modalHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
  } as ViewStyle,
  modalTitle: {
    fontFamily: FONTS.header,
    fontSize: 22,
    color: COLORS.cream,
  } as TextStyle,
  modalFieldLabel: {
    fontFamily: FONTS.mono,
    fontSize: 11,
    color: COLORS.creamMuted,
    letterSpacing: 1,
    textTransform: 'uppercase',
    marginTop: SPACING.xs,
  } as TextStyle,
  amountInputWrap: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: SPACING.xs,
  } as ViewStyle,
  amountPrefix: {
    fontFamily: FONTS.header,
    fontSize: 36,
    color: COLORS.creamMuted,
  } as TextStyle,
  amountInput: {
    fontFamily: FONTS.header,
    fontSize: 36,
    color: COLORS.cream,
    flex: 1,
  } as TextStyle,
  noteInput: {
    fontFamily: FONTS.body,
    fontSize: 15,
    color: COLORS.cream,
    backgroundColor: COLORS.bg,
    borderRadius: RADIUS.md,
    borderWidth: 1,
    borderColor: COLORS.border,
    padding: SPACING.md,
  } as TextStyle,
  catScroll: {
    gap: SPACING.sm,
  } as ViewStyle,
  catPill: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
    backgroundColor: COLORS.bgGlass,
    borderRadius: RADIUS.full,
    borderWidth: 1,
    borderColor: COLORS.border,
    paddingHorizontal: SPACING.md,
    paddingVertical: 8,
  } as ViewStyle,
  catPillActive: {
    backgroundColor: COLORS.sageLight,
    borderColor: COLORS.sage,
  } as ViewStyle,
  catPillEmoji: {
    fontSize: 14,
  } as TextStyle,
  catPillText: {
    fontFamily: FONTS.bodySemiBold,
    fontSize: 12,
    color: COLORS.creamMuted,
  } as TextStyle,
  catPillTextActive: {
    color: COLORS.sage,
  } as TextStyle,
  dayScroll: {
    gap: SPACING.sm,
  } as ViewStyle,
  dayChip: {
    width: 36,
    height: 36,
    borderRadius: 18,
    backgroundColor: COLORS.bgGlass,
    borderWidth: 1,
    borderColor: COLORS.border,
    alignItems: 'center',
    justifyContent: 'center',
  } as ViewStyle,
  dayChipText: {
    fontFamily: FONTS.bodySemiBold,
    fontSize: 14,
    color: COLORS.cream,
  } as TextStyle,
  submitBtn: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: SPACING.sm,
    paddingVertical: SPACING.md,
    borderRadius: RADIUS.md,
    marginTop: SPACING.sm,
  } as ViewStyle,
  submitBtnText: {
    fontFamily: FONTS.bodySemiBold,
    fontSize: 16,
    color: '#000',
  } as TextStyle,

  // Empty state
  emptyCenter: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
    gap: SPACING.md,
  } as ViewStyle,
  emptyTitle: {
    fontFamily: FONTS.header,
    fontSize: 22,
    color: COLORS.cream,
  } as TextStyle,
  backPill: {
    backgroundColor: COLORS.sage,
    paddingHorizontal: SPACING.xl,
    paddingVertical: SPACING.sm,
    borderRadius: RADIUS.md,
  } as ViewStyle,
  backPillText: {
    fontFamily: FONTS.bodySemiBold,
    fontSize: 14,
    color: COLORS.bg,
  } as TextStyle,
});
