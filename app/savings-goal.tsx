// =============================================================================
// ROAM — Savings Goal Detail Screen
// =============================================================================
import React, { useCallback, useEffect, useMemo, useState } from 'react';
import {
  FlatList,
  Modal,
  Pressable,
  StyleSheet,
  Text,
  TextInput,
  View,
} from 'react-native';
import { useLocalSearchParams, useRouter } from 'expo-router';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import {
  ArrowLeft,
  Minus,
  Plus,
  Sparkles,
  Trash2,
} from 'lucide-react-native';
import { useTranslation } from 'react-i18next';
import Svg, { Circle } from 'react-native-svg';

import * as Haptics from '../lib/haptics';
import { COLORS, FONTS, RADIUS, SPACING } from '../lib/constants';
import {
  useSavingsStore,
  type SavingsGoal,
  type SavingsTransaction,
} from '../lib/savings-store';
import { useAppStore } from '../lib/store';

// ---------------------------------------------------------------------------
// Helpers
// ---------------------------------------------------------------------------
function formatCurrency(amount: number, currency: string): string {
  const symbols: Record<string, string> = {
    USD: '$', EUR: '\u20AC', GBP: '\u00A3', JPY: '\u00A5',
  };
  const sym = symbols[currency] ?? currency + ' ';
  return `${sym}${Math.abs(amount).toLocaleString('en-US', { minimumFractionDigits: 0, maximumFractionDigits: 0 })}`;
}

function formatDate(iso: string): string {
  try {
    const d = new Date(iso);
    return d.toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric' });
  } catch {
    return iso;
  }
}

// ---------------------------------------------------------------------------
// Large Progress Ring
// ---------------------------------------------------------------------------
function LargeProgressRing({ percentage }: { percentage: number }) {
  const size = 160;
  const strokeWidth = 10;
  const radius = (size - strokeWidth) / 2;
  const circumference = 2 * Math.PI * radius;
  const strokeDashoffset = circumference - (circumference * Math.min(percentage, 100)) / 100;

  return (
    <View style={{ width: size, height: size, alignItems: 'center', justifyContent: 'center' }}>
      <Svg width={size} height={size} style={{ position: 'absolute' }}>
        <Circle
          cx={size / 2}
          cy={size / 2}
          r={radius}
          stroke={COLORS.surface2}
          strokeWidth={strokeWidth}
          fill="none"
        />
        <Circle
          cx={size / 2}
          cy={size / 2}
          r={radius}
          stroke={COLORS.sage}
          strokeWidth={strokeWidth}
          fill="none"
          strokeDasharray={`${circumference}`}
          strokeDashoffset={strokeDashoffset}
          strokeLinecap="round"
          rotation="-90"
          origin={`${size / 2}, ${size / 2}`}
        />
      </Svg>
      <Text style={s.ringPercent}>{percentage}%</Text>
      <Text style={s.ringLabel}>saved</Text>
    </View>
  );
}

// ---------------------------------------------------------------------------
// Add/Withdraw Sheet
// ---------------------------------------------------------------------------
function AmountSheet({
  visible,
  mode,
  currency,
  onClose,
  onSubmit,
}: {
  visible: boolean;
  mode: 'add' | 'withdraw';
  currency: string;
  onClose: () => void;
  onSubmit: (amount: number, note: string) => void;
}) {
  const { t } = useTranslation();
  const [amount, setAmount] = useState('');
  const [note, setNote] = useState('');
  const [submitting, setSubmitting] = useState(false);

  useEffect(() => {
    if (visible) { setAmount(''); setNote(''); }
  }, [visible]);

  const handleSubmit = useCallback(async () => {
    const parsed = parseFloat(amount);
    if (isNaN(parsed) || parsed <= 0) return;
    Haptics.notificationAsync(Haptics.NotificationFeedbackType.Success).catch(() => {});
    setSubmitting(true);
    onSubmit(parsed, note);
    setSubmitting(false);
    onClose();
  }, [amount, note, onSubmit, onClose]);

  return (
    <Modal visible={visible} animationType="slide" transparent>
      <View style={s.sheetOverlay}>
        <View style={s.sheetContent}>
          <Text style={s.sheetTitle}>
            {mode === 'add'
              ? t('savings.addSavings', { defaultValue: 'Add savings' })
              : t('savings.withdraw', { defaultValue: 'Withdraw' })}
          </Text>

          <Text style={s.inputLabel}>
            {t('savings.amount', { defaultValue: 'Amount' })}
          </Text>
          <TextInput
            value={amount}
            onChangeText={setAmount}
            placeholder="50"
            placeholderTextColor={COLORS.muted}
            keyboardType="numeric"
            style={s.input}
            autoFocus
          />

          <Text style={s.inputLabel}>
            {t('savings.note', { defaultValue: 'Note (optional)' })}
          </Text>
          <TextInput
            value={note}
            onChangeText={setNote}
            placeholder={mode === 'add' ? 'Birthday money' : 'Emergency'}
            placeholderTextColor={COLORS.muted}
            style={s.input}
          />

          <View style={s.sheetActions}>
            <Pressable onPress={onClose} style={s.sheetCancel}>
              <Text style={s.sheetCancelText}>
                {t('common.cancel', { defaultValue: 'Cancel' })}
              </Text>
            </Pressable>
            <Pressable
              onPress={handleSubmit}
              disabled={submitting || !amount.trim()}
              style={[
                s.sheetSave,
                mode === 'withdraw' && { backgroundColor: COLORS.coral },
                (submitting || !amount.trim()) && { opacity: 0.5 },
              ]}
            >
              <Text style={s.sheetSaveText}>
                {mode === 'add'
                  ? t('savings.addBtn', { defaultValue: 'Add' })
                  : t('savings.withdrawBtn', { defaultValue: 'Withdraw' })}
              </Text>
            </Pressable>
          </View>
        </View>
      </View>
    </Modal>
  );
}

// ---------------------------------------------------------------------------
// Transaction Row
// ---------------------------------------------------------------------------
function TransactionRow({ txn, currency }: { txn: SavingsTransaction; currency: string }) {
  const isDeposit = txn.amount > 0;
  return (
    <View style={s.txnRow}>
      <View style={s.txnLeft}>
        <Text style={s.txnDate}>{formatDate(txn.createdAt)}</Text>
        {txn.note && <Text style={s.txnNote}>{txn.note}</Text>}
      </View>
      <Text style={[s.txnAmount, { color: isDeposit ? COLORS.sage : COLORS.coral }]}>
        {isDeposit ? '+' : '-'}{formatCurrency(txn.amount, currency)}
      </Text>
    </View>
  );
}

// ---------------------------------------------------------------------------
// Main Screen
// ---------------------------------------------------------------------------
export default function SavingsGoalScreen(): React.JSX.Element {
  const { id } = useLocalSearchParams<{ id: string }>();
  const router = useRouter();
  const insets = useSafeAreaInsets();
  const { t } = useTranslation();

  const goals = useSavingsStore((s) => s.goals);
  const transactions = useSavingsStore((s) => s.transactions);
  const loadTransactions = useSavingsStore((s) => s.loadTransactions);
  const addSavings = useSavingsStore((s) => s.addSavings);
  const withdrawSavings = useSavingsStore((s) => s.withdrawSavings);
  const deleteGoal = useSavingsStore((s) => s.deleteGoal);
  const getGoalProgress = useSavingsStore((s) => s.getGoalProgress);
  const setPlanWizard = useAppStore((s) => s.setPlanWizard);
  const setGenerateMode = useAppStore((s) => s.setGenerateMode);

  const goal = useMemo<SavingsGoal | undefined>(
    () => goals.find((g) => g.id === id),
    [goals, id],
  );

  const progress = useMemo(
    () => (id ? getGoalProgress(id) : { saved: 0, target: 0, percentage: 0, weeksToGo: null }),
    [id, getGoalProgress, goals],
  );

  const txns = useMemo<SavingsTransaction[]>(
    () => (id ? transactions[id] ?? [] : []),
    [id, transactions],
  );

  const [sheetMode, setSheetMode] = useState<'add' | 'withdraw' | null>(null);

  useEffect(() => {
    if (id) loadTransactions(id);
  }, [id, loadTransactions]);

  const handleBack = useCallback(() => {
    Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light).catch(() => {});
    router.back();
  }, [router]);

  const handleAdd = useCallback((amount: number, note: string) => {
    if (!id) return;
    addSavings(id, amount, note || undefined);
  }, [id, addSavings]);

  const handleWithdraw = useCallback((amount: number, note: string) => {
    if (!id) return;
    withdrawSavings(id, amount, note || undefined);
  }, [id, withdrawSavings]);

  const handleDelete = useCallback(async () => {
    if (!id) return;
    Haptics.notificationAsync(Haptics.NotificationFeedbackType.Warning).catch(() => {});
    await deleteGoal(id);
    router.back();
  }, [id, deleteGoal, router]);

  const handlePlanTrip = useCallback(() => {
    if (!goal) return;
    Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Medium).catch(() => {});
    setPlanWizard({ destination: goal.destination });
    setGenerateMode('quick');
    router.push('/(tabs)/plan');
  }, [goal, setPlanWizard, setGenerateMode, router]);

  // Weekly target calc
  const weeklyTarget = useMemo(() => {
    if (!goal?.deadline) return null;
    const remaining = goal.targetAmount - goal.savedAmount;
    if (remaining <= 0) return null;
    const now = new Date();
    const deadline = new Date(goal.deadline);
    const weeksLeft = Math.max(1, Math.ceil((deadline.getTime() - now.getTime()) / (7 * 24 * 60 * 60 * 1000)));
    return Math.ceil(remaining / weeksLeft);
  }, [goal]);

  if (!goal) {
    return (
      <View style={[s.root, { paddingTop: insets.top }]}>
        <View style={s.header}>
          <Pressable onPress={handleBack} hitSlop={12}>
            <ArrowLeft size={24} color={COLORS.cream} strokeWidth={1.5} />
          </Pressable>
        </View>
        <View style={s.emptyState}>
          <Text style={s.emptyTitle}>
            {t('savings.notFound', { defaultValue: 'Goal not found' })}
          </Text>
        </View>
      </View>
    );
  }

  return (
    <View style={[s.root, { paddingTop: insets.top }]}>
      {/* Header */}
      <View style={s.header}>
        <Pressable onPress={handleBack} hitSlop={12}>
          <ArrowLeft size={24} color={COLORS.cream} strokeWidth={1.5} />
        </Pressable>
        <Text style={s.headerTitle}>{goal.destination}</Text>
        <Pressable onPress={handleDelete} hitSlop={12}>
          <Trash2 size={20} color={COLORS.coral} strokeWidth={1.5} />
        </Pressable>
      </View>

      <FlatList
        ListHeaderComponent={
          <>
            {/* Progress */}
            <View style={s.progressSection}>
              <LargeProgressRing percentage={progress.percentage} />
              <Text style={s.progressSaved}>
                {formatCurrency(progress.saved, goal.currency)}
                <Text style={s.progressTarget}>
                  {' '}of {formatCurrency(progress.target, goal.currency)}
                </Text>
              </Text>
              {weeklyTarget !== null && (
                <Text style={s.weeklyTarget}>
                  {formatCurrency(weeklyTarget, goal.currency)}/week to reach your goal
                  {goal.deadline ? ` by ${formatDate(goal.deadline)}` : ''}
                </Text>
              )}
              {progress.weeksToGo !== null && progress.weeksToGo > 0 && (
                <Text style={s.weeksToGo}>
                  {progress.weeksToGo} {progress.weeksToGo === 1 ? 'week' : 'weeks'} to go
                </Text>
              )}
            </View>

            {/* Actions */}
            <View style={s.actionRow}>
              <Pressable
                onPress={() => {
                  Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Medium).catch(() => {});
                  setSheetMode('add');
                }}
                style={({ pressed }) => [s.addBtn, { transform: [{ scale: pressed ? 0.96 : 1 }] }]}
              >
                <Plus size={18} color={COLORS.bg} strokeWidth={2} />
                <Text style={s.addBtnText}>
                  {t('savings.addSavings', { defaultValue: 'Add savings' })}
                </Text>
              </Pressable>
              <Pressable
                onPress={() => {
                  Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light).catch(() => {});
                  setSheetMode('withdraw');
                }}
                style={({ pressed }) => [s.withdrawLink, { opacity: pressed ? 0.5 : 1 }]}
              >
                <Minus size={14} color={COLORS.muted} strokeWidth={1.5} />
                <Text style={s.withdrawText}>
                  {t('savings.withdraw', { defaultValue: 'Withdraw' })}
                </Text>
              </Pressable>
            </View>

            {/* Plan This Trip CTA */}
            {progress.percentage >= 80 && (
              <Pressable
                onPress={handlePlanTrip}
                style={({ pressed }) => [s.planCta, { transform: [{ scale: pressed ? 0.97 : 1 }] }]}
              >
                <Sparkles size={18} color={COLORS.bg} strokeWidth={1.5} />
                <Text style={s.planCtaText}>
                  {t('savings.planThisTrip', { defaultValue: 'Plan this trip' })}
                </Text>
              </Pressable>
            )}

            {/* Transaction header */}
            <Text style={s.txnHeader}>
              {t('savings.history', { defaultValue: 'History' })}
            </Text>
          </>
        }
        data={txns}
        keyExtractor={(item) => item.id}
        renderItem={({ item }) => <TransactionRow txn={item} currency={goal.currency} />}
        contentContainerStyle={{ paddingBottom: insets.bottom + SPACING.xxl }}
        showsVerticalScrollIndicator={false}
        ListEmptyComponent={
          <Text style={s.noTxns}>
            {t('savings.noHistory', { defaultValue: 'No transactions yet' })}
          </Text>
        }
      />

      {/* Amount Sheet */}
      <AmountSheet
        visible={sheetMode !== null}
        mode={sheetMode ?? 'add'}
        currency={goal.currency}
        onClose={() => setSheetMode(null)}
        onSubmit={sheetMode === 'withdraw' ? handleWithdraw : handleAdd}
      />
    </View>
  );
}

// ---------------------------------------------------------------------------
// Styles
// ---------------------------------------------------------------------------
const s = StyleSheet.create({
  root: { flex: 1, backgroundColor: COLORS.bg },
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: SPACING.md,
    paddingVertical: SPACING.sm,
  },
  headerTitle: {
    fontFamily: FONTS.header,
    fontSize: 20,
    color: COLORS.cream,
  },

  // Progress
  progressSection: {
    alignItems: 'center',
    paddingVertical: SPACING.xl,
    gap: SPACING.sm,
  },
  ringPercent: {
    fontFamily: FONTS.mono,
    fontSize: 32,
    color: COLORS.cream,
  },
  ringLabel: {
    fontFamily: FONTS.mono,
    fontSize: 11,
    color: COLORS.muted,
    marginTop: -4,
  },
  progressSaved: {
    fontFamily: FONTS.mono,
    fontSize: 20,
    color: COLORS.sage,
    marginTop: SPACING.sm,
  },
  progressTarget: {
    color: COLORS.muted,
    fontSize: 16,
  },
  weeklyTarget: {
    fontFamily: FONTS.body,
    fontSize: 13,
    color: COLORS.creamMuted,
    textAlign: 'center',
    paddingHorizontal: SPACING.xl,
  },
  weeksToGo: {
    fontFamily: FONTS.mono,
    fontSize: 12,
    color: COLORS.muted,
  },

  // Actions
  actionRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: SPACING.lg,
    paddingHorizontal: SPACING.md,
    marginBottom: SPACING.lg,
  },
  addBtn: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: SPACING.sm,
    backgroundColor: COLORS.sage,
    borderRadius: RADIUS.pill,
    paddingHorizontal: SPACING.lg,
    paddingVertical: SPACING.sm + 4,
  },
  addBtnText: {
    fontFamily: FONTS.bodyMedium,
    fontSize: 15,
    color: COLORS.bg,
  },
  withdrawLink: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: SPACING.xs,
  },
  withdrawText: {
    fontFamily: FONTS.body,
    fontSize: 14,
    color: COLORS.muted,
  },

  // Plan CTA
  planCta: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: SPACING.sm,
    backgroundColor: COLORS.sage,
    borderRadius: RADIUS.pill,
    marginHorizontal: SPACING.md,
    paddingVertical: SPACING.sm + 4,
    marginBottom: SPACING.lg,
  },
  planCtaText: {
    fontFamily: FONTS.bodyMedium,
    fontSize: 15,
    color: COLORS.bg,
  },

  // Transactions
  txnHeader: {
    fontFamily: FONTS.mono,
    fontSize: 11,
    color: COLORS.muted,
    letterSpacing: 1.5,
    textTransform: 'uppercase',
    paddingHorizontal: SPACING.md,
    marginBottom: SPACING.md,
  },
  txnRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingHorizontal: SPACING.md,
    paddingVertical: SPACING.sm + 2,
    borderBottomWidth: StyleSheet.hairlineWidth,
    borderBottomColor: COLORS.border,
  },
  txnLeft: { flex: 1, marginRight: SPACING.md },
  txnDate: {
    fontFamily: FONTS.body,
    fontSize: 14,
    color: COLORS.cream,
  },
  txnNote: {
    fontFamily: FONTS.body,
    fontSize: 12,
    color: COLORS.muted,
    marginTop: 2,
  },
  txnAmount: {
    fontFamily: FONTS.mono,
    fontSize: 16,
  },
  noTxns: {
    fontFamily: FONTS.body,
    fontSize: 14,
    color: COLORS.muted,
    textAlign: 'center',
    paddingVertical: SPACING.xl,
  },

  // Empty
  emptyState: {
    alignItems: 'center',
    paddingVertical: SPACING.xxxl,
  },
  emptyTitle: {
    fontFamily: FONTS.header,
    fontSize: 18,
    color: COLORS.cream,
  },

  // Sheet
  sheetOverlay: {
    flex: 1,
    backgroundColor: COLORS.overlay,
    justifyContent: 'flex-end',
  },
  sheetContent: {
    backgroundColor: COLORS.surface1,
    borderTopLeftRadius: RADIUS.xl,
    borderTopRightRadius: RADIUS.xl,
    padding: SPACING.lg,
    paddingBottom: SPACING.xxl,
  },
  sheetTitle: {
    fontFamily: FONTS.header,
    fontSize: 20,
    color: COLORS.cream,
    marginBottom: SPACING.md,
  },
  inputLabel: {
    fontFamily: FONTS.mono,
    fontSize: 11,
    color: COLORS.muted,
    letterSpacing: 1,
    textTransform: 'uppercase',
    marginBottom: SPACING.xs,
    marginTop: SPACING.md,
  },
  input: {
    backgroundColor: COLORS.surface2,
    borderRadius: RADIUS.sm,
    paddingHorizontal: SPACING.md,
    paddingVertical: SPACING.sm + 4,
    fontFamily: FONTS.body,
    fontSize: 16,
    color: COLORS.cream,
  },
  sheetActions: {
    flexDirection: 'row',
    justifyContent: 'flex-end',
    gap: SPACING.md,
    marginTop: SPACING.xl,
  },
  sheetCancel: {
    paddingHorizontal: SPACING.lg,
    paddingVertical: SPACING.sm + 4,
    borderRadius: RADIUS.pill,
  },
  sheetCancelText: {
    fontFamily: FONTS.bodyMedium,
    fontSize: 15,
    color: COLORS.muted,
  },
  sheetSave: {
    paddingHorizontal: SPACING.lg,
    paddingVertical: SPACING.sm + 4,
    borderRadius: RADIUS.pill,
    backgroundColor: COLORS.sage,
  },
  sheetSaveText: {
    fontFamily: FONTS.bodyMedium,
    fontSize: 15,
    color: COLORS.bg,
  },
});
