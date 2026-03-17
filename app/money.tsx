// =============================================================================
// ROAM — Money Screen (Trip Savings & Budget Intelligence)
// =============================================================================
import React, { useCallback, useEffect, useMemo, useState } from 'react';
import {
  FlatList,
  Image,
  Modal,
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
import {
  ArrowLeft,
  ChevronRight,
  Plus,
  Target,
  TrendingUp,
  Wallet,
} from 'lucide-react-native';
import { useTranslation } from 'react-i18next';
import Svg, { Circle } from 'react-native-svg';

import * as Haptics from '../lib/haptics';
import {
  COLORS,
  DESTINATION_HERO_PHOTOS,
  FONTS,
  RADIUS,
  SPACING,
} from '../lib/constants';
import { useSavingsStore, type SavingsGoal } from '../lib/savings-store';
import { getCostOfLiving, type CostOfLiving } from '../lib/cost-of-living';
import { useSonarQuery } from '../lib/sonar';
import LiveBadge from '../components/ui/LiveBadge';

// ---------------------------------------------------------------------------
// Helpers
// ---------------------------------------------------------------------------
function formatCurrency(amount: number, currency: string): string {
  const symbols: Record<string, string> = {
    USD: '$', EUR: '\u20AC', GBP: '\u00A3', JPY: '\u00A5',
  };
  const sym = symbols[currency] ?? currency + ' ';
  return `${sym}${amount.toLocaleString('en-US', { minimumFractionDigits: 0, maximumFractionDigits: 0 })}`;
}

function getGoalImage(destination: string): string {
  const exact = DESTINATION_HERO_PHOTOS[destination];
  if (exact) return exact;
  return `https://images.unsplash.com/photo-1488646953014-85cb44e25828?w=600&q=80`;
}

// ---------------------------------------------------------------------------
// Circular Progress Ring
// ---------------------------------------------------------------------------
function ProgressRing({
  percentage,
  size = 80,
  strokeWidth = 6,
}: {
  percentage: number;
  size?: number;
  strokeWidth?: number;
}) {
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
    </View>
  );
}

// ---------------------------------------------------------------------------
// Budget Tier Selector
// ---------------------------------------------------------------------------
type BudgetTier = 'budget' | 'comfort' | 'luxury';

function BudgetTierSelector({
  selected,
  onSelect,
}: {
  selected: BudgetTier;
  onSelect: (tier: BudgetTier) => void;
}) {
  const { t } = useTranslation();
  const tiers: { key: BudgetTier; label: string }[] = [
    { key: 'budget', label: t('money.tierBudget', { defaultValue: 'Budget' }) },
    { key: 'comfort', label: t('money.tierComfort', { defaultValue: 'Comfort' }) },
    { key: 'luxury', label: t('money.tierLuxury', { defaultValue: 'Luxury' }) },
  ];

  return (
    <View style={s.tierRow}>
      {tiers.map((tier) => (
        <Pressable
          key={tier.key}
          onPress={() => {
            Haptics.selectionAsync().catch(() => {});
            onSelect(tier.key);
          }}
          style={[s.tierPill, selected === tier.key && s.tierPillActive]}
        >
          <Text style={[s.tierPillText, selected === tier.key && s.tierPillTextActive]}>
            {tier.label}
          </Text>
        </Pressable>
      ))}
    </View>
  );
}

// ---------------------------------------------------------------------------
// Cost Intelligence Card
// ---------------------------------------------------------------------------
function CostIntelCard({ goal }: { goal: SavingsGoal }) {
  const { t } = useTranslation();
  const [tier, setTier] = useState<BudgetTier>('comfort');
  const costData = useMemo<CostOfLiving | null>(
    () => getCostOfLiving(goal.destination),
    [goal.destination],
  );

  if (!costData) return null;

  const data = costData[tier];

  return (
    <View style={s.intelCard}>
      <Text style={s.intelCardTitle}>{goal.destination}</Text>
      <BudgetTierSelector selected={tier} onSelect={setTier} />
      <View style={s.intelRows}>
        <View style={s.intelRow}>
          <Text style={s.intelLabel}>{t('money.accommodation', { defaultValue: 'Accommodation/night' })}</Text>
          <Text style={s.intelValue}>{data.accommodation}</Text>
        </View>
        <View style={s.intelRow}>
          <Text style={s.intelLabel}>{t('money.food', { defaultValue: 'Food/day' })}</Text>
          <Text style={s.intelValue}>{data.meal}</Text>
        </View>
        <View style={s.intelRow}>
          <Text style={s.intelLabel}>{t('money.transport', { defaultValue: 'Transport/day' })}</Text>
          <Text style={s.intelValue}>{data.transport}</Text>
        </View>
        <View style={[s.intelRow, { borderBottomWidth: 0 }]}>
          <Text style={s.intelLabel}>{t('money.dailyTotal', { defaultValue: 'Daily total' })}</Text>
          <Text style={[s.intelValue, { color: COLORS.sage }]}>{data.dailyTotal}</Text>
        </View>
      </View>
    </View>
  );
}

// ---------------------------------------------------------------------------
// Money Tips (Sonar-powered)
// ---------------------------------------------------------------------------
function MoneyTips({ destination }: { destination: string }) {
  const { t } = useTranslation();
  const { data, isLive } = useSonarQuery(destination || undefined, 'prep');

  if (!data?.answer) return null;

  const tips = data.answer
    .split(/\n\n+/)
    .filter((seg) => seg.trim().length > 10)
    .slice(0, 3);

  if (tips.length === 0) return null;

  return (
    <View style={s.tipsCard}>
      <View style={{ flexDirection: 'row', alignItems: 'center', gap: SPACING.sm }}>
        <TrendingUp size={18} color={COLORS.sage} strokeWidth={1.5} />
        <Text style={s.tipsTitle}>{t('money.moneyTips', { defaultValue: 'Money Tips' })}</Text>
        {isLive && <LiveBadge />}
      </View>
      {tips.map((tip, i) => (
        <Text key={i} style={s.tipText}>{tip.trim()}</Text>
      ))}
    </View>
  );
}

// ---------------------------------------------------------------------------
// Goal Card
// ---------------------------------------------------------------------------
function GoalCard({ goal, onPress }: { goal: SavingsGoal; onPress: () => void }) {
  const progress = useSavingsStore((s) => s.getGoalProgress)(goal.id);
  const imageUrl = useMemo(() => getGoalImage(goal.destination), [goal.destination]);

  return (
    <Pressable
      onPress={() => {
        Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light).catch(() => {});
        onPress();
      }}
      style={({ pressed }) => [s.goalCard, { transform: [{ scale: pressed ? 0.97 : 1 }] }]}
    >
      <Image source={{ uri: imageUrl }} style={s.goalCardImage} resizeMode="cover" />
      <LinearGradient
        colors={['transparent', 'rgba(0,0,0,0.85)']}
        style={s.goalCardGradient}
      />
      <View style={s.goalCardContent}>
        <View style={s.goalCardLeft}>
          <Text style={s.goalCardDest}>{goal.destination}</Text>
          <Text style={s.goalCardMoney}>
            {formatCurrency(goal.savedAmount, goal.currency)} {' '}
            <Text style={s.goalCardMoneyMuted}>
              of {formatCurrency(goal.targetAmount, goal.currency)}
            </Text>
          </Text>
          {progress.weeksToGo !== null && progress.weeksToGo > 0 && (
            <Text style={s.goalCardWeeks}>
              {progress.weeksToGo} {progress.weeksToGo === 1 ? 'week' : 'weeks'} to go
            </Text>
          )}
        </View>
        <ProgressRing percentage={progress.percentage} size={64} strokeWidth={5} />
      </View>
    </Pressable>
  );
}

// ---------------------------------------------------------------------------
// New Goal Modal
// ---------------------------------------------------------------------------
function NewGoalModal({
  visible,
  onClose,
  initialDestination,
  initialAmount,
}: {
  visible: boolean;
  onClose: () => void;
  initialDestination?: string;
  initialAmount?: number;
}) {
  const { t } = useTranslation();
  const createGoal = useSavingsStore((s) => s.createGoal);
  const [destination, setDestination] = useState(initialDestination ?? '');
  const [amount, setAmount] = useState(initialAmount ? String(initialAmount) : '');
  const [saving, setSaving] = useState(false);

  useEffect(() => {
    if (visible) {
      setDestination(initialDestination ?? '');
      setAmount(initialAmount ? String(initialAmount) : '');
    }
  }, [visible, initialDestination, initialAmount]);

  const handleCreate = useCallback(async () => {
    if (!destination.trim() || !amount.trim()) return;
    Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Medium).catch(() => {});
    setSaving(true);
    const parsed = parseFloat(amount);
    if (isNaN(parsed) || parsed <= 0) {
      setSaving(false);
      return;
    }
    await createGoal({
      destination: destination.trim(),
      targetAmount: parsed,
    });
    setSaving(false);
    onClose();
  }, [destination, amount, createGoal, onClose]);

  return (
    <Modal visible={visible} animationType="slide" transparent>
      <View style={s.modalOverlay}>
        <View style={s.modalContent}>
          <Text style={s.modalTitle}>
            {t('money.newGoal', { defaultValue: 'New savings goal' })}
          </Text>

          <Text style={s.inputLabel}>
            {t('money.destination', { defaultValue: 'Destination' })}
          </Text>
          <TextInput
            value={destination}
            onChangeText={setDestination}
            placeholder="Tokyo, Bali, Paris..."
            placeholderTextColor={COLORS.muted}
            style={s.input}
          />

          <Text style={s.inputLabel}>
            {t('money.targetAmount', { defaultValue: 'Target amount (USD)' })}
          </Text>
          <TextInput
            value={amount}
            onChangeText={setAmount}
            placeholder="2000"
            placeholderTextColor={COLORS.muted}
            keyboardType="numeric"
            style={s.input}
          />

          <View style={s.modalActions}>
            <Pressable onPress={onClose} style={s.modalCancel}>
              <Text style={s.modalCancelText}>
                {t('common.cancel', { defaultValue: 'Cancel' })}
              </Text>
            </Pressable>
            <Pressable
              onPress={handleCreate}
              disabled={saving || !destination.trim() || !amount.trim()}
              style={[s.modalSave, (saving || !destination.trim() || !amount.trim()) && { opacity: 0.5 }]}
            >
              <Text style={s.modalSaveText}>
                {saving
                  ? t('common.saving', { defaultValue: 'Saving...' })
                  : t('common.create', { defaultValue: 'Create' })}
              </Text>
            </Pressable>
          </View>
        </View>
      </View>
    </Modal>
  );
}

// ---------------------------------------------------------------------------
// Main Money Screen
// ---------------------------------------------------------------------------
export default function MoneyScreen(): React.JSX.Element {
  const router = useRouter();
  const insets = useSafeAreaInsets();
  const { t } = useTranslation();
  const goals = useSavingsStore((s) => s.goals);
  const loadGoals = useSavingsStore((s) => s.loadGoals);
  const loading = useSavingsStore((s) => s.loading);
  const [showNewGoal, setShowNewGoal] = useState(false);

  useEffect(() => {
    loadGoals();
  }, [loadGoals]);

  const totalSaved = useMemo(
    () => goals.reduce((sum, g) => sum + g.savedAmount, 0),
    [goals],
  );
  const totalTarget = useMemo(
    () => goals.reduce((sum, g) => sum + g.targetAmount, 0),
    [goals],
  );
  const overallPercent = useMemo(
    () => (totalTarget > 0 ? Math.min(100, Math.round((totalSaved / totalTarget) * 100)) : 0),
    [totalSaved, totalTarget],
  );

  const handleBack = useCallback(() => {
    Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light).catch(() => {});
    router.back();
  }, [router]);

  const handleGoalPress = useCallback(
    (goalId: string) => {
      Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light).catch(() => {});
      router.push({ pathname: '/savings-goal', params: { id: goalId } } as never);
    },
    [router],
  );

  // Pick first destination with cost data for tips
  const tipsDestination = useMemo(
    () => goals.find((g) => getCostOfLiving(g.destination) !== null)?.destination ?? '',
    [goals],
  );

  return (
    <View style={[s.root, { paddingTop: insets.top }]}>
      {/* Header */}
      <View style={s.header}>
        <Pressable onPress={handleBack} hitSlop={12}>
          <ArrowLeft size={24} color={COLORS.cream} strokeWidth={1.5} />
        </Pressable>
        <Text style={s.headerTitle}>{t('money.title', { defaultValue: 'Money' })}</Text>
        <View style={{ width: 24 }} />
      </View>

      <ScrollView
        contentContainerStyle={{ paddingBottom: insets.bottom + 100 }}
        showsVerticalScrollIndicator={false}
      >
        {/* Section 1: Overview */}
        <View style={s.overview}>
          <Wallet size={24} color={COLORS.sage} strokeWidth={1.5} />
          <Text style={s.overviewLabel}>
            {t('money.yourTripFunds', { defaultValue: 'Your trip funds' })}
          </Text>
          <Text style={s.overviewSaved}>{formatCurrency(totalSaved, 'USD')}</Text>
          <Text style={s.overviewTarget}>
            {t('money.ofTarget', { defaultValue: 'of' })} {formatCurrency(totalTarget, 'USD')}
          </Text>
          <View style={s.progressBarBg}>
            <View style={[s.progressBarFill, { width: `${overallPercent}%` }]} />
          </View>
        </View>

        {/* Section 2: Goal Cards */}
        {goals.length > 0 && (
          <View style={s.sectionWrap}>
            <Text style={s.sectionLabel}>
              {t('money.goals', { defaultValue: 'Goals' })}
            </Text>
            {goals.map((goal) => (
              <GoalCard
                key={goal.id}
                goal={goal}
                onPress={() => handleGoalPress(goal.id)}
              />
            ))}
          </View>
        )}

        {/* Section 3: Trip Cost Intelligence */}
        {goals.length > 0 && (
          <View style={s.sectionWrap}>
            <Text style={s.sectionLabel}>
              {t('money.costIntelligence', { defaultValue: 'Trip Cost Intelligence' })}
            </Text>
            {goals
              .filter((g) => getCostOfLiving(g.destination) !== null)
              .map((goal) => (
                <CostIntelCard key={goal.id} goal={goal} />
              ))}
          </View>
        )}

        {/* Section 4: Money Tips */}
        {tipsDestination.length > 0 && (
          <View style={s.sectionWrap}>
            <Text style={s.sectionLabel}>
              {t('money.tipsSection', { defaultValue: 'Money Tips' })}
            </Text>
            <MoneyTips destination={tipsDestination} />
          </View>
        )}

        {/* Empty state */}
        {!loading && goals.length === 0 && (
          <View style={s.emptyState}>
            <Target size={48} color={COLORS.muted} strokeWidth={1.5} />
            <Text style={s.emptyTitle}>
              {t('money.emptyTitle', { defaultValue: 'No savings goals yet' })}
            </Text>
            <Text style={s.emptyBody}>
              {t('money.emptyBody', { defaultValue: 'Tap + to start saving for your next trip' })}
            </Text>
          </View>
        )}
      </ScrollView>

      {/* FAB */}
      <Pressable
        onPress={() => {
          Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Medium).catch(() => {});
          setShowNewGoal(true);
        }}
        style={({ pressed }) => [
          s.fab,
          { bottom: insets.bottom + 24, transform: [{ scale: pressed ? 0.92 : 1 }] },
        ]}
      >
        <Plus size={24} color={COLORS.bg} strokeWidth={2} />
      </Pressable>

      {/* New Goal Modal */}
      <NewGoalModal
        visible={showNewGoal}
        onClose={() => setShowNewGoal(false)}
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

  // Overview
  overview: {
    alignItems: 'center',
    paddingVertical: SPACING.xl,
    paddingHorizontal: SPACING.md,
    gap: SPACING.xs,
  },
  overviewLabel: {
    fontFamily: FONTS.mono,
    fontSize: 12,
    color: COLORS.muted,
    letterSpacing: 1,
    textTransform: 'uppercase',
    marginTop: SPACING.sm,
  },
  overviewSaved: {
    fontFamily: FONTS.mono,
    fontSize: 40,
    color: COLORS.sage,
  },
  overviewTarget: {
    fontFamily: FONTS.mono,
    fontSize: 14,
    color: COLORS.muted,
  },
  progressBarBg: {
    width: '80%',
    height: 6,
    borderRadius: 3,
    backgroundColor: COLORS.surface2,
    marginTop: SPACING.md,
    overflow: 'hidden',
  },
  progressBarFill: {
    height: 6,
    borderRadius: 3,
    backgroundColor: COLORS.sage,
  },

  // Section
  sectionWrap: {
    paddingHorizontal: SPACING.md,
    marginTop: SPACING.lg,
  },
  sectionLabel: {
    fontFamily: FONTS.mono,
    fontSize: 11,
    color: COLORS.muted,
    letterSpacing: 1.5,
    textTransform: 'uppercase',
    marginBottom: SPACING.md,
  },

  // Goal Card
  goalCard: {
    borderRadius: RADIUS.md,
    overflow: 'hidden',
    height: 160,
    marginBottom: SPACING.md,
  },
  goalCardImage: {
    ...StyleSheet.absoluteFillObject,
    width: '100%',
    height: '100%',
  },
  goalCardGradient: {
    ...StyleSheet.absoluteFillObject,
  },
  goalCardContent: {
    flex: 1,
    flexDirection: 'row',
    alignItems: 'flex-end',
    justifyContent: 'space-between',
    padding: SPACING.md,
  },
  goalCardLeft: { flex: 1, marginRight: SPACING.md },
  goalCardDest: {
    fontFamily: FONTS.header,
    fontSize: 22,
    color: COLORS.cream,
  },
  goalCardMoney: {
    fontFamily: FONTS.mono,
    fontSize: 14,
    color: COLORS.sage,
    marginTop: SPACING.xs,
  },
  goalCardMoneyMuted: {
    color: COLORS.muted,
  },
  goalCardWeeks: {
    fontFamily: FONTS.mono,
    fontSize: 11,
    color: COLORS.muted,
    marginTop: SPACING.xs,
  },

  // Progress ring
  ringPercent: {
    fontFamily: FONTS.mono,
    fontSize: 14,
    color: COLORS.cream,
  },

  // Cost Intel
  intelCard: {
    backgroundColor: COLORS.surface1,
    borderRadius: RADIUS.md,
    padding: SPACING.md,
    marginBottom: SPACING.md,
  },
  intelCardTitle: {
    fontFamily: FONTS.header,
    fontSize: 16,
    color: COLORS.cream,
    marginBottom: SPACING.sm,
  },
  intelRows: { marginTop: SPACING.sm },
  intelRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    paddingVertical: SPACING.sm,
    borderBottomWidth: StyleSheet.hairlineWidth,
    borderBottomColor: COLORS.border,
  },
  intelLabel: {
    fontFamily: FONTS.body,
    fontSize: 14,
    color: COLORS.muted,
  },
  intelValue: {
    fontFamily: FONTS.mono,
    fontSize: 14,
    color: COLORS.cream,
  },

  // Tier pills
  tierRow: {
    flexDirection: 'row',
    gap: SPACING.sm,
  },
  tierPill: {
    paddingHorizontal: SPACING.md,
    paddingVertical: SPACING.xs + 2,
    borderRadius: RADIUS.pill,
    backgroundColor: COLORS.surface2,
  },
  tierPillActive: {
    backgroundColor: COLORS.sageLight,
  },
  tierPillText: {
    fontFamily: FONTS.bodyMedium,
    fontSize: 13,
    color: COLORS.muted,
  },
  tierPillTextActive: {
    color: COLORS.sage,
  },

  // Tips
  tipsCard: {
    backgroundColor: COLORS.surface1,
    borderRadius: RADIUS.md,
    padding: SPACING.md,
    gap: SPACING.sm,
  },
  tipsTitle: {
    fontFamily: FONTS.headerMedium,
    fontSize: 15,
    color: COLORS.cream,
  },
  tipText: {
    fontFamily: FONTS.body,
    fontSize: 13,
    color: COLORS.creamMuted,
    lineHeight: 20,
  },

  // Empty
  emptyState: {
    alignItems: 'center',
    paddingVertical: SPACING.xxxl,
    gap: SPACING.md,
  },
  emptyTitle: {
    fontFamily: FONTS.header,
    fontSize: 18,
    color: COLORS.cream,
  },
  emptyBody: {
    fontFamily: FONTS.body,
    fontSize: 14,
    color: COLORS.muted,
    textAlign: 'center',
    paddingHorizontal: SPACING.xl,
  },

  // FAB
  fab: {
    position: 'absolute',
    right: SPACING.lg,
    width: 56,
    height: 56,
    borderRadius: 28,
    backgroundColor: COLORS.sage,
    alignItems: 'center',
    justifyContent: 'center',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.3,
    shadowRadius: 8,
    elevation: 6,
  },

  // Modal
  modalOverlay: {
    flex: 1,
    backgroundColor: COLORS.overlay,
    justifyContent: 'flex-end',
  },
  modalContent: {
    backgroundColor: COLORS.surface1,
    borderTopLeftRadius: RADIUS.xl,
    borderTopRightRadius: RADIUS.xl,
    padding: SPACING.lg,
    paddingBottom: SPACING.xxl,
  },
  modalTitle: {
    fontFamily: FONTS.header,
    fontSize: 20,
    color: COLORS.cream,
    marginBottom: SPACING.lg,
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
  modalActions: {
    flexDirection: 'row',
    justifyContent: 'flex-end',
    gap: SPACING.md,
    marginTop: SPACING.xl,
  },
  modalCancel: {
    paddingHorizontal: SPACING.lg,
    paddingVertical: SPACING.sm + 4,
    borderRadius: RADIUS.pill,
  },
  modalCancelText: {
    fontFamily: FONTS.bodyMedium,
    fontSize: 15,
    color: COLORS.muted,
  },
  modalSave: {
    paddingHorizontal: SPACING.lg,
    paddingVertical: SPACING.sm + 4,
    borderRadius: RADIUS.pill,
    backgroundColor: COLORS.sage,
  },
  modalSaveText: {
    fontFamily: FONTS.bodyMedium,
    fontSize: 15,
    color: COLORS.bg,
  },
});
