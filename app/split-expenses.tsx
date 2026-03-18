// =============================================================================
// ROAM — Split Expenses Screen
// Group trip cost splitting and settlement tracker
// =============================================================================

import React, { useCallback, useEffect, useMemo, useRef, useState } from 'react';
import {
  Alert,
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
  TouchableOpacity,
  View,
  type TextStyle,
  type ViewStyle,
} from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { useRouter } from 'expo-router';
import {
  ArrowLeft,
  Check,
  ChevronDown,
  Plus,
  Receipt,
  ShoppingBag,
  Utensils,
  Train,
  Hotel,
  Music,
  Wine,
  HelpCircle,
  X,
} from 'lucide-react-native';
import { useTranslation } from 'react-i18next';
import * as Haptics from '../lib/haptics';
import { COLORS, FONTS, RADIUS, SPACING } from '../lib/constants';
import { useAppStore } from '../lib/store';
import {
  useExpenseStore,
  type ExpenseCategory,
  type TripExpense,
} from '../lib/expense-store';

// ---------------------------------------------------------------------------
// Category meta
// ---------------------------------------------------------------------------

const CATEGORY_META: Record<
  ExpenseCategory,
  { label: string; Icon: any; color: string; bg: string }
> = {
  food: {
    label: 'Food',
    Icon: Utensils,
    color: COLORS.coral,
    bg: COLORS.coralSubtle,
  },
  transport: {
    label: 'Transport',
    Icon: Train,
    color: COLORS.blueAccent,
    bg: 'rgba(91,155,213,0.15)',
  },
  accommodation: {
    label: 'Accommodation',
    Icon: Hotel,
    color: COLORS.gold,
    bg: COLORS.goldSubtle,
  },
  activities: {
    label: 'Activities',
    Icon: Music,
    color: COLORS.sage,
    bg: COLORS.sageSoft,
  },
  drinks: {
    label: 'Drinks',
    Icon: Wine,
    color: COLORS.lavender,
    bg: 'rgba(180,136,217,0.15)',
  },
  shopping: {
    label: 'Shopping',
    Icon: ShoppingBag,
    color: COLORS.amber,
    bg: 'rgba(240,160,94,0.15)',
  },
  other: {
    label: 'Other',
    Icon: HelpCircle,
    color: COLORS.muted,
    bg: COLORS.surface2,
  },
};

const CATEGORIES = Object.keys(CATEGORY_META) as ExpenseCategory[];

// ---------------------------------------------------------------------------
// Helpers
// ---------------------------------------------------------------------------

function formatCurrency(amount: number, currency = 'USD'): string {
  return new Intl.NumberFormat('en-US', {
    style: 'currency',
    currency,
    minimumFractionDigits: 2,
    maximumFractionDigits: 2,
  }).format(amount);
}

function formatDate(isoString: string): string {
  const date = new Date(isoString);
  return date.toLocaleDateString('en-US', { month: 'short', day: 'numeric' });
}

function getUserDisplayName(userId: string, currentUserId: string): string {
  if (userId === currentUserId) return 'You';
  // Shorten UUID for display when no profile data
  return `User ${userId.slice(0, 6)}`;
}

// ---------------------------------------------------------------------------
// Category Bar Chart
// ---------------------------------------------------------------------------

function CategoryBarChart({
  categorySpend,
  currency,
  total,
}: {
  categorySpend: Record<ExpenseCategory, number>;
  currency: string;
  total: number;
}) {
  const categories = CATEGORIES.filter((c) => categorySpend[c] > 0).sort(
    (a, b) => categorySpend[b] - categorySpend[a],
  );

  if (categories.length === 0) {
    return null;
  }

  return (
    <View style={styles.categoryChart}>
      {categories.map((cat) => {
        const meta = CATEGORY_META[cat];
        const amount = categorySpend[cat];
        const pct = total > 0 ? amount / total : 0;
        const { Icon } = meta;

        return (
          <View key={cat} style={styles.categoryRow}>
            <View style={[styles.categoryIconBg, { backgroundColor: meta.bg }]}>
              <Icon size={14} color={meta.color} strokeWidth={1.5} />
            </View>
            <Text style={styles.categoryLabel}>{meta.label}</Text>
            <View style={styles.categoryBarTrack}>
              <View
                style={[
                  styles.categoryBarFill,
                  { width: `${Math.round(pct * 100)}%` as unknown as number, backgroundColor: meta.color },
                ]}
              />
            </View>
            <Text style={styles.categoryAmount}>{formatCurrency(amount, currency)}</Text>
          </View>
        );
      })}
    </View>
  );
}

// ---------------------------------------------------------------------------
// Expense Row
// ---------------------------------------------------------------------------

function ExpenseRow({
  expense,
  currentUserId,
  onLongPress,
}: {
  expense: TripExpense;
  currentUserId: string;
  onLongPress: (expense: TripExpense) => void;
}) {
  const meta = CATEGORY_META[expense.category];
  const { Icon } = meta;

  return (
    <Pressable
      onLongPress={() => onLongPress(expense)}
      style={({ pressed }) => [styles.expenseRow, { opacity: pressed ? 0.75 : 1 }]}
      accessibilityLabel={`${expense.description}, ${formatCurrency(expense.amount, expense.currency)}, paid by ${getUserDisplayName(expense.paidBy, currentUserId)}`}
      accessibilityRole="button"
    >
      <View style={[styles.expenseCategoryIcon, { backgroundColor: meta.bg }]}>
        <Icon size={16} color={meta.color} strokeWidth={1.5} />
      </View>
      <View style={styles.expenseInfo}>
        <Text style={styles.expenseDescription} numberOfLines={1}>
          {expense.description}
        </Text>
        <Text style={styles.expenseMeta}>
          {meta.label} · {getUserDisplayName(expense.paidBy, currentUserId)} paid · {formatDate(expense.createdAt)}
        </Text>
      </View>
      <Text style={styles.expenseAmount}>
        {formatCurrency(expense.amount, expense.currency)}
      </Text>
    </Pressable>
  );
}

// ---------------------------------------------------------------------------
// Debt Row
// ---------------------------------------------------------------------------

function DebtRow({
  fromUser,
  toUser,
  amount,
  currency,
  currentUserId,
  onSettle,
}: {
  fromUser: string;
  toUser: string;
  amount: number;
  currency: string;
  currentUserId: string;
  onSettle: () => void;
}) {
  const isCurrentUserOwes = fromUser === currentUserId;
  const fromLabel = getUserDisplayName(fromUser, currentUserId);
  const toLabel = getUserDisplayName(toUser, currentUserId);

  return (
    <View style={styles.debtRow}>
      <View style={styles.debtInfo}>
        <Text style={styles.debtText}>
          <Text style={isCurrentUserOwes ? styles.debtYou : styles.debtOther}>
            {fromLabel}
          </Text>
          <Text style={styles.debtArrow}>{' owes '}</Text>
          <Text style={!isCurrentUserOwes ? styles.debtYou : styles.debtOther}>
            {toLabel}
          </Text>
        </Text>
        <Text style={styles.debtAmount}>{formatCurrency(amount, currency)}</Text>
      </View>
      {isCurrentUserOwes && (
        <Pressable
          onPress={onSettle}
          style={({ pressed }) => [styles.settleBtn, { opacity: pressed ? 0.8 : 1 }]}
          accessibilityLabel={`Settle ${formatCurrency(amount, currency)} with ${toLabel}`}
          accessibilityRole="button"
        >
          <Check size={14} color={COLORS.bg} strokeWidth={2} />
          <Text style={styles.settleBtnText}>Settle</Text>
        </Pressable>
      )}
    </View>
  );
}

// ---------------------------------------------------------------------------
// Add Expense Bottom Sheet
// ---------------------------------------------------------------------------

function AddExpenseSheet({
  visible,
  tripId,
  currentUserId,
  onClose,
}: {
  visible: boolean;
  tripId: string;
  currentUserId: string;
  onClose: () => void;
}) {
  const { t } = useTranslation();
  const addExpense = useExpenseStore((s) => s.addExpense);
  const slideAnim = useRef(new Animated.Value(400)).current;

  const [description, setDescription] = useState('');
  const [amountText, setAmountText] = useState('');
  const [category, setCategory] = useState<ExpenseCategory>('food');
  const [showCategoryPicker, setShowCategoryPicker] = useState(false);
  const [submitting, setSubmitting] = useState(false);

  useEffect(() => {
    if (visible) {
      Animated.spring(slideAnim, {
        toValue: 0,
        useNativeDriver: true,
        tension: 60,
        friction: 10,
      }).start();
    } else {
      Animated.timing(slideAnim, {
        toValue: 400,
        duration: 200,
        useNativeDriver: true,
      }).start();
    }
  }, [visible, slideAnim]);

  const handleSubmit = useCallback(async () => {
    const amount = parseFloat(amountText.replace(/[^0-9.]/g, ''));
    if (!description.trim()) {
      Alert.alert('Missing description', 'Please add a description for this expense.');
      return;
    }
    if (isNaN(amount) || amount <= 0) {
      Alert.alert('Invalid amount', 'Please enter a valid amount greater than 0.');
      return;
    }

    setSubmitting(true);
    Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Medium);

    const result = await addExpense({
      tripId,
      description: description.trim(),
      amount,
      currency: 'USD',
      category,
      paidBy: currentUserId,
      splitWith: [],
    });

    setSubmitting(false);

    if (result) {
      Haptics.notificationAsync(Haptics.NotificationFeedbackType.Success);
      setDescription('');
      setAmountText('');
      setCategory('food');
      onClose();
    } else {
      Alert.alert('Error', 'Failed to add expense. Please try again.');
    }
  }, [description, amountText, category, tripId, currentUserId, addExpense, onClose]);

  const selectedMeta = CATEGORY_META[category];
  const { Icon: SelectedIcon } = selectedMeta;

  return (
    <Modal
      visible={visible}
      transparent
      animationType="fade"
      onRequestClose={onClose}
    >
      <KeyboardAvoidingView
        style={styles.sheetOverlay}
        behavior={Platform.OS === 'ios' ? 'padding' : 'height'}
      >
        <Pressable style={styles.sheetBackdrop} onPress={onClose} />
        <Animated.View
          style={[styles.sheet, { transform: [{ translateY: slideAnim }] }]}
        >
          {/* Header */}
          <View style={styles.sheetHeader}>
            <Text style={styles.sheetTitle}>Add Expense</Text>
            <Pressable onPress={onClose} style={styles.sheetClose} accessibilityRole="button" accessibilityLabel="Close">
              <X size={20} color={COLORS.muted} strokeWidth={1.5} />
            </Pressable>
          </View>

          <ScrollView showsVerticalScrollIndicator={false}>
            {/* Description */}
            <Text style={styles.fieldLabel}>Description</Text>
            <TextInput
              style={styles.textInput}
              value={description}
              onChangeText={setDescription}
              placeholder="Dinner at local restaurant"
              placeholderTextColor={COLORS.muted}
              autoFocus
              returnKeyType="next"
              accessibilityLabel="Expense description"
            />

            {/* Amount */}
            <Text style={styles.fieldLabel}>Amount (USD)</Text>
            <TextInput
              style={styles.textInput}
              value={amountText}
              onChangeText={setAmountText}
              placeholder="0.00"
              placeholderTextColor={COLORS.muted}
              keyboardType="decimal-pad"
              returnKeyType="done"
              accessibilityLabel="Expense amount"
            />

            {/* Category */}
            <Text style={styles.fieldLabel}>Category</Text>
            <Pressable
              style={styles.categorySelector}
              onPress={() => setShowCategoryPicker(!showCategoryPicker)}
              accessibilityRole="button"
              accessibilityLabel={`Category: ${selectedMeta.label}`}
            >
              <View style={[styles.categorySelectorIcon, { backgroundColor: selectedMeta.bg }]}>
                <SelectedIcon size={16} color={selectedMeta.color} strokeWidth={1.5} />
              </View>
              <Text style={styles.categorySelectorText}>{selectedMeta.label}</Text>
              <ChevronDown size={16} color={COLORS.muted} strokeWidth={1.5} />
            </Pressable>

            {showCategoryPicker && (
              <View style={styles.categoryPickerList}>
                {CATEGORIES.map((cat) => {
                  const meta = CATEGORY_META[cat];
                  const { Icon: CatIcon } = meta;
                  return (
                    <Pressable
                      key={cat}
                      style={({ pressed }) => [
                        styles.categoryPickerItem,
                        cat === category && styles.categoryPickerItemActive,
                        { opacity: pressed ? 0.75 : 1 },
                      ]}
                      onPress={() => {
                        Haptics.selectionAsync();
                        setCategory(cat);
                        setShowCategoryPicker(false);
                      }}
                      accessibilityRole="button"
                      accessibilityLabel={meta.label}
                    >
                      <View style={[styles.categoryIconBg, { backgroundColor: meta.bg }]}>
                        <CatIcon size={14} color={meta.color} strokeWidth={1.5} />
                      </View>
                      <Text style={[
                        styles.categoryPickerLabel,
                        cat === category && styles.categoryPickerLabelActive,
                      ]}>
                        {meta.label}
                      </Text>
                      {cat === category && (
                        <Check size={14} color={COLORS.sage} strokeWidth={2} />
                      )}
                    </Pressable>
                  );
                })}
              </View>
            )}

            {/* Paid by — defaults to current user */}
            <Text style={styles.fieldLabel}>Paid by</Text>
            <View style={styles.paidByBadge}>
              <Text style={styles.paidByText}>You (split equally)</Text>
            </View>
          </ScrollView>

          {/* Submit */}
          <Pressable
            onPress={handleSubmit}
            disabled={submitting}
            style={({ pressed }) => [
              styles.submitBtn,
              { opacity: pressed || submitting ? 0.7 : 1 },
            ]}
            accessibilityRole="button"
            accessibilityLabel="Add expense"
          >
            <Text style={styles.submitBtnText}>
              {submitting ? 'Adding...' : 'Add Expense'}
            </Text>
          </Pressable>
        </Animated.View>
      </KeyboardAvoidingView>
    </Modal>
  );
}

// ---------------------------------------------------------------------------
// Main Screen
// ---------------------------------------------------------------------------

export default function SplitExpensesScreen() {
  const { t } = useTranslation();
  const router = useRouter();
  const insets = useSafeAreaInsets();

  const session = useAppStore((s) => s.session);
  const trips = useAppStore((s) => s.trips);
  const currentUserId = session?.user?.id ?? '';

  // Use the most recent trip
  const activeTrip = useMemo(() => {
    return trips.length > 0 ? trips[trips.length - 1] : null;
  }, [trips]);

  const tripId = activeTrip?.id ?? '';
  const currency = 'USD';

  const {
    loadExpenses,
    expenses: expensesMap,
    getBalances,
    getTotalSpent,
    getDailyAverage,
    getSpentByCategory,
    settleUp,
    deleteExpense,
  } = useExpenseStore();

  const expenses = expensesMap[tripId] ?? [];

  const [showAddSheet, setShowAddSheet] = useState(false);

  useEffect(() => {
    if (tripId) {
      void loadExpenses(tripId);
    }
  }, [tripId, loadExpenses]);

  const totalSpent = useMemo(() => getTotalSpent(tripId, currency), [getTotalSpent, tripId, currency, expenses]);
  const dailyAverage = useMemo(() => getDailyAverage(tripId, currency), [getDailyAverage, tripId, currency, expenses]);
  const categorySpend = useMemo(() => getSpentByCategory(tripId, currency), [getSpentByCategory, tripId, currency, expenses]);
  const debts = useMemo(() => getBalances(tripId, currency), [getBalances, tripId, currency, expenses]);

  const handleSettle = useCallback(
    async (fromUser: string, toUser: string, amount: number) => {
      Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Medium);
      Alert.alert(
        'Mark as settled?',
        `Record payment of ${formatCurrency(amount, currency)} to ${getUserDisplayName(toUser, currentUserId)}?`,
        [
          { text: 'Cancel', style: 'cancel' },
          {
            text: 'Settle',
            onPress: async () => {
              const ok = await settleUp({ tripId, fromUser, toUser, amount, currency });
              if (ok) {
                Haptics.notificationAsync(Haptics.NotificationFeedbackType.Success);
              }
            },
          },
        ],
      );
    },
    [settleUp, tripId, currency, currentUserId],
  );

  const handleLongPressExpense = useCallback(
    (expense: TripExpense) => {
      if (expense.userId !== currentUserId) return;
      Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Heavy);
      Alert.alert(
        'Delete expense?',
        `Remove "${expense.description}" (${formatCurrency(expense.amount, expense.currency)})?`,
        [
          { text: 'Cancel', style: 'cancel' },
          {
            text: 'Delete',
            style: 'destructive',
            onPress: () => void deleteExpense(expense.id, tripId),
          },
        ],
      );
    },
    [currentUserId, deleteExpense, tripId],
  );

  const handleBack = useCallback(() => {
    Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
    router.back();
  }, [router]);

  const handleOpenAdd = useCallback(() => {
    Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Medium);
    setShowAddSheet(true);
  }, []);

  const renderExpense = useCallback(
    ({ item }: { item: TripExpense }) => (
      <ExpenseRow
        expense={item}
        currentUserId={currentUserId}
        onLongPress={handleLongPressExpense}
      />
    ),
    [currentUserId, handleLongPressExpense],
  );

  const keyExtractor = useCallback((item: TripExpense) => item.id, []);

  const ListHeader = useMemo(
    () => (
      <View>
        {/* Total Spent Banner */}
        <View style={styles.totalBanner}>
          <Text style={styles.totalLabel}>Total Spent</Text>
          <Text style={styles.totalAmount}>{formatCurrency(totalSpent, currency)}</Text>
          {dailyAverage > 0 && (
            <Text style={styles.dailyAverage}>
              {formatCurrency(dailyAverage, currency)} / day avg
            </Text>
          )}
        </View>

        {/* Category Breakdown */}
        {totalSpent > 0 && (
          <View style={styles.section}>
            <Text style={styles.sectionTitle}>By Category</Text>
            <CategoryBarChart
              categorySpend={categorySpend}
              currency={currency}
              total={totalSpent}
            />
          </View>
        )}

        {/* Who Owes Who */}
        {debts.length > 0 && (
          <View style={styles.section}>
            <Text style={styles.sectionTitle}>Who Owes Who</Text>
            {debts.map((debt, idx) => (
              <DebtRow
                key={idx}
                fromUser={debt.fromUser}
                toUser={debt.toUser}
                amount={debt.amount}
                currency={debt.currency}
                currentUserId={currentUserId}
                onSettle={() => void handleSettle(debt.fromUser, debt.toUser, debt.amount)}
              />
            ))}
          </View>
        )}

        {/* Expenses header */}
        <View style={styles.sectionHeader}>
          <Text style={styles.sectionTitle}>Expenses</Text>
          {expenses.length > 0 && (
            <Text style={styles.expenseCount}>{expenses.length} items</Text>
          )}
        </View>

        {expenses.length === 0 && (
          <View style={styles.emptyState}>
            <Receipt size={40} color={COLORS.muted} strokeWidth={1} />
            <Text style={styles.emptyTitle}>No expenses yet</Text>
            <Text style={styles.emptyBody}>
              Tap the + button to add your first expense and start splitting costs with your group.
            </Text>
          </View>
        )}
      </View>
    ),
    [totalSpent, dailyAverage, categorySpend, debts, currentUserId, expenses.length, handleSettle],
  );

  return (
    <View style={[styles.container, { paddingTop: insets.top }]}>
      {/* Header */}
      <View style={styles.header}>
        <Pressable
          onPress={handleBack}
          style={({ pressed }) => [styles.backBtn, { opacity: pressed ? 0.7 : 1 }]}
          accessibilityRole="button"
          accessibilityLabel="Go back"
        >
          <ArrowLeft size={22} color={COLORS.cream} strokeWidth={1.5} />
        </Pressable>
        <View style={styles.headerCenter}>
          <Text style={styles.headerTitle}>Split Costs</Text>
          {activeTrip && (
            <Text style={styles.headerSubtitle}>{activeTrip.destination}</Text>
          )}
        </View>
        <View style={styles.headerRight} />
      </View>

      {/* Expense list */}
      <FlatList
        data={expenses}
        renderItem={renderExpense}
        keyExtractor={keyExtractor}
        ListHeaderComponent={ListHeader}
        contentContainerStyle={[styles.listContent, { paddingBottom: insets.bottom + 100 }]}
        showsVerticalScrollIndicator={false}
      />

      {/* FAB */}
      <View style={[styles.fabContainer, { bottom: insets.bottom + SPACING.lg }]}>
        <TouchableOpacity
          onPress={handleOpenAdd}
          style={styles.fab}
          activeOpacity={0.85}
          accessibilityRole="button"
          accessibilityLabel="Add expense"
        >
          <Plus size={24} color={COLORS.bg} strokeWidth={2} />
        </TouchableOpacity>
      </View>

      {/* Add Expense Sheet */}
      <AddExpenseSheet
        visible={showAddSheet}
        tripId={tripId}
        currentUserId={currentUserId}
        onClose={() => setShowAddSheet(false)}
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

  // ── Header ──
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: SPACING.md,
    paddingVertical: SPACING.md,
    borderBottomWidth: 1,
    borderBottomColor: COLORS.border,
  } as ViewStyle,
  backBtn: {
    width: 40,
    height: 40,
    borderRadius: RADIUS.md,
    backgroundColor: COLORS.surface1,
    alignItems: 'center',
    justifyContent: 'center',
  } as ViewStyle,
  headerCenter: {
    flex: 1,
    alignItems: 'center',
  } as ViewStyle,
  headerTitle: {
    fontFamily: FONTS.header,
    fontSize: 18,
    color: COLORS.cream,
    letterSpacing: -0.3,
  } as TextStyle,
  headerSubtitle: {
    fontFamily: FONTS.body,
    fontSize: 12,
    color: COLORS.muted,
    marginTop: 2,
  } as TextStyle,
  headerRight: {
    width: 40,
  } as ViewStyle,

  // ── List ──
  listContent: {
    paddingHorizontal: SPACING.md,
  } as ViewStyle,

  // ── Total Banner ──
  totalBanner: {
    backgroundColor: COLORS.surface1,
    borderRadius: RADIUS.lg,
    paddingVertical: SPACING.xl,
    paddingHorizontal: SPACING.lg,
    marginTop: SPACING.md,
    marginBottom: SPACING.md,
    alignItems: 'center',
    borderWidth: 1,
    borderColor: COLORS.border,
  } as ViewStyle,
  totalLabel: {
    fontFamily: FONTS.mono,
    fontSize: 11,
    color: COLORS.muted,
    textTransform: 'uppercase',
    letterSpacing: 1,
    marginBottom: SPACING.sm,
  } as TextStyle,
  totalAmount: {
    fontFamily: FONTS.mono,
    fontSize: 40,
    color: COLORS.cream,
    letterSpacing: -1,
  } as TextStyle,
  dailyAverage: {
    fontFamily: FONTS.mono,
    fontSize: 13,
    color: COLORS.sage,
    marginTop: SPACING.xs,
  } as TextStyle,

  // ── Section ──
  section: {
    backgroundColor: COLORS.surface1,
    borderRadius: RADIUS.lg,
    padding: SPACING.md,
    marginBottom: SPACING.md,
    borderWidth: 1,
    borderColor: COLORS.border,
  } as ViewStyle,
  sectionHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    marginBottom: SPACING.sm,
    marginTop: SPACING.xs,
  } as ViewStyle,
  sectionTitle: {
    fontFamily: FONTS.mono,
    fontSize: 11,
    color: COLORS.muted,
    textTransform: 'uppercase',
    letterSpacing: 1,
    marginBottom: SPACING.sm,
  } as TextStyle,
  expenseCount: {
    fontFamily: FONTS.mono,
    fontSize: 11,
    color: COLORS.muted,
  } as TextStyle,

  // ── Category chart ──
  categoryChart: {
    gap: SPACING.sm,
  } as ViewStyle,
  categoryRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: SPACING.sm,
  } as ViewStyle,
  categoryIconBg: {
    width: 24,
    height: 24,
    borderRadius: RADIUS.sm,
    alignItems: 'center',
    justifyContent: 'center',
  } as ViewStyle,
  categoryLabel: {
    fontFamily: FONTS.body,
    fontSize: 13,
    color: COLORS.creamDim,
    width: 96,
  } as TextStyle,
  categoryBarTrack: {
    flex: 1,
    height: 4,
    backgroundColor: COLORS.surface2,
    borderRadius: RADIUS.pill,
    overflow: 'hidden',
  } as ViewStyle,
  categoryBarFill: {
    height: '100%',
    borderRadius: RADIUS.pill,
  } as ViewStyle,
  categoryAmount: {
    fontFamily: FONTS.mono,
    fontSize: 12,
    color: COLORS.creamDim,
    textAlign: 'right',
    minWidth: 70,
  } as TextStyle,

  // ── Debt rows ──
  debtRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingVertical: SPACING.sm,
    borderBottomWidth: 1,
    borderBottomColor: COLORS.border,
  } as ViewStyle,
  debtInfo: {
    flex: 1,
  } as ViewStyle,
  debtText: {
    fontFamily: FONTS.body,
    fontSize: 14,
    color: COLORS.creamDim,
    marginBottom: 2,
  } as TextStyle,
  debtYou: {
    fontFamily: FONTS.bodyMedium,
    color: COLORS.cream,
  } as TextStyle,
  debtOther: {
    fontFamily: FONTS.body,
    color: COLORS.creamDim,
  } as TextStyle,
  debtArrow: {
    color: COLORS.muted,
  } as TextStyle,
  debtAmount: {
    fontFamily: FONTS.mono,
    fontSize: 15,
    color: COLORS.coral,
  } as TextStyle,
  settleBtn: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
    backgroundColor: COLORS.sage,
    borderRadius: RADIUS.pill,
    paddingVertical: 6,
    paddingHorizontal: SPACING.sm,
    marginLeft: SPACING.sm,
  } as ViewStyle,
  settleBtnText: {
    fontFamily: FONTS.bodyMedium,
    fontSize: 12,
    color: COLORS.bg,
  } as TextStyle,

  // ── Expense rows ──
  expenseRow: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingVertical: SPACING.sm,
    borderBottomWidth: 1,
    borderBottomColor: COLORS.border,
    gap: SPACING.sm,
  } as ViewStyle,
  expenseCategoryIcon: {
    width: 36,
    height: 36,
    borderRadius: RADIUS.md,
    alignItems: 'center',
    justifyContent: 'center',
  } as ViewStyle,
  expenseInfo: {
    flex: 1,
  } as ViewStyle,
  expenseDescription: {
    fontFamily: FONTS.bodyMedium,
    fontSize: 14,
    color: COLORS.cream,
    marginBottom: 2,
  } as TextStyle,
  expenseMeta: {
    fontFamily: FONTS.body,
    fontSize: 12,
    color: COLORS.muted,
  } as TextStyle,
  expenseAmount: {
    fontFamily: FONTS.mono,
    fontSize: 14,
    color: COLORS.cream,
  } as TextStyle,

  // ── Empty state ──
  emptyState: {
    alignItems: 'center',
    paddingVertical: SPACING.xxxl,
    gap: SPACING.sm,
  } as ViewStyle,
  emptyTitle: {
    fontFamily: FONTS.headerMedium,
    fontSize: 18,
    color: COLORS.creamDim,
    marginTop: SPACING.sm,
  } as TextStyle,
  emptyBody: {
    fontFamily: FONTS.body,
    fontSize: 14,
    color: COLORS.muted,
    textAlign: 'center',
    lineHeight: 20,
    maxWidth: 280,
  } as TextStyle,

  // ── FAB ──
  fabContainer: {
    position: 'absolute',
    right: SPACING.lg,
    alignItems: 'center',
  } as ViewStyle,
  fab: {
    width: 56,
    height: 56,
    borderRadius: RADIUS.full,
    backgroundColor: COLORS.sage,
    alignItems: 'center',
    justifyContent: 'center',
    shadowColor: COLORS.sage,
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.4,
    shadowRadius: 12,
    elevation: 8,
  } as ViewStyle,

  // ── Bottom Sheet ──
  sheetOverlay: {
    flex: 1,
    justifyContent: 'flex-end',
  } as ViewStyle,
  sheetBackdrop: {
    ...StyleSheet.absoluteFillObject,
    backgroundColor: COLORS.overlayDark,
  } as ViewStyle,
  sheet: {
    backgroundColor: COLORS.surface1,
    borderTopLeftRadius: 20,
    borderTopRightRadius: 20,
    paddingHorizontal: SPACING.md,
    paddingTop: SPACING.md,
    paddingBottom: SPACING.xl,
    maxHeight: '80%',
    borderTopWidth: 1,
    borderColor: COLORS.border,
  } as ViewStyle,
  sheetHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    marginBottom: SPACING.lg,
  } as ViewStyle,
  sheetTitle: {
    fontFamily: FONTS.header,
    fontSize: 20,
    color: COLORS.cream,
    letterSpacing: -0.3,
  } as TextStyle,
  sheetClose: {
    width: 32,
    height: 32,
    borderRadius: RADIUS.full,
    backgroundColor: COLORS.surface2,
    alignItems: 'center',
    justifyContent: 'center',
  } as ViewStyle,

  // ── Form fields ──
  fieldLabel: {
    fontFamily: FONTS.mono,
    fontSize: 11,
    color: COLORS.muted,
    textTransform: 'uppercase',
    letterSpacing: 0.8,
    marginBottom: 6,
    marginTop: SPACING.md,
  } as TextStyle,
  textInput: {
    backgroundColor: COLORS.surface2,
    borderRadius: RADIUS.md,
    paddingHorizontal: SPACING.md,
    paddingVertical: SPACING.sm + 4,
    fontFamily: FONTS.body,
    fontSize: 16,
    color: COLORS.cream,
    borderWidth: 1,
    borderColor: COLORS.border,
  } as TextStyle,
  categorySelector: {
    backgroundColor: COLORS.surface2,
    borderRadius: RADIUS.md,
    paddingHorizontal: SPACING.md,
    paddingVertical: SPACING.sm + 4,
    flexDirection: 'row',
    alignItems: 'center',
    gap: SPACING.sm,
    borderWidth: 1,
    borderColor: COLORS.border,
  } as ViewStyle,
  categorySelectorIcon: {
    width: 28,
    height: 28,
    borderRadius: RADIUS.sm,
    alignItems: 'center',
    justifyContent: 'center',
  } as ViewStyle,
  categorySelectorText: {
    flex: 1,
    fontFamily: FONTS.body,
    fontSize: 16,
    color: COLORS.cream,
  } as TextStyle,
  categoryPickerList: {
    backgroundColor: COLORS.surface2,
    borderRadius: RADIUS.md,
    marginTop: 4,
    borderWidth: 1,
    borderColor: COLORS.border,
    overflow: 'hidden',
  } as ViewStyle,
  categoryPickerItem: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: SPACING.sm,
    paddingVertical: SPACING.sm,
    paddingHorizontal: SPACING.md,
    borderBottomWidth: 1,
    borderBottomColor: COLORS.border,
  } as ViewStyle,
  categoryPickerItemActive: {
    backgroundColor: COLORS.sageFaint,
  } as ViewStyle,
  categoryPickerLabel: {
    flex: 1,
    fontFamily: FONTS.body,
    fontSize: 15,
    color: COLORS.creamDim,
  } as TextStyle,
  categoryPickerLabelActive: {
    color: COLORS.cream,
  } as TextStyle,
  paidByBadge: {
    backgroundColor: COLORS.surface2,
    borderRadius: RADIUS.md,
    paddingHorizontal: SPACING.md,
    paddingVertical: SPACING.sm + 4,
    borderWidth: 1,
    borderColor: COLORS.sageBorder,
  } as ViewStyle,
  paidByText: {
    fontFamily: FONTS.body,
    fontSize: 15,
    color: COLORS.sage,
  } as TextStyle,

  // ── Submit ──
  submitBtn: {
    marginTop: SPACING.lg,
    backgroundColor: COLORS.sage,
    borderRadius: RADIUS.pill,
    paddingVertical: SPACING.md,
    alignItems: 'center',
  } as ViewStyle,
  submitBtnText: {
    fontFamily: FONTS.bodyMedium,
    fontSize: 16,
    color: COLORS.bg,
  } as TextStyle,
});
