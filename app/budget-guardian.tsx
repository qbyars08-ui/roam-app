// =============================================================================
// ROAM — Budget Guardian
// Real-time spending tracker that helps travelers stay on budget during a trip.
// Premium financial dashboard with a travel twist.
// =============================================================================
import React, { useEffect, useRef, useState, useCallback, useMemo } from 'react';
import {
  Animated,
  Keyboard,
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
import { useAppStore } from '../lib/store';
import { parseItinerary } from '../lib/types/itinerary';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { LinearGradient } from 'expo-linear-gradient';
import * as Haptics from '../lib/haptics';
import { ChevronLeft } from 'lucide-react-native';
import { useTranslation } from 'react-i18next';
import { COLORS, FONTS, SPACING, RADIUS } from '../lib/constants';
import { useDestinationTheme } from '../lib/useDestinationTheme';
import { withComingSoon } from '../lib/with-coming-soon';

// =============================================================================
// Types
// =============================================================================
type CategoryId = 'food' | 'stay' | 'transport' | 'activities' | 'shopping' | 'other';

interface Expense {
  id: string;
  amount: number;
  category: CategoryId;
  note: string;
  day: number; // 1-indexed trip day
  timestamp: number;
}

interface CategoryMeta {
  id: CategoryId;
  emoji: string; // kept for API compat, not displayed
  label: string;
  color: string;
}

// =============================================================================
// Constants
// =============================================================================
const CATEGORIES: CategoryMeta[] = [
  { id: 'food', emoji: '', label: 'Food', color: COLORS.sage },
  { id: 'stay', emoji: '', label: 'Stay', color: COLORS.gold },
  { id: 'transport', emoji: '', label: 'Transport', color: COLORS.blueAccent },
  { id: 'activities', emoji: '', label: 'Activities', color: COLORS.tanAccent },
  { id: 'shopping', emoji: '', label: 'Shopping', color: COLORS.violetAccent },
  { id: 'other', emoji: '', label: 'Other', color: COLORS.grayAccent },
];

const CURRENCY_RATES: Record<string, { symbol: string; rate: number; code: string }> = {
  JP: { symbol: '\u00A5', rate: 149.5, code: 'JPY' },
  ID: { symbol: 'Rp', rate: 15650, code: 'IDR' },
  TH: { symbol: '\u0E3F', rate: 34.8, code: 'THB' },
  FR: { symbol: '\u20AC', rate: 0.92, code: 'EUR' },
  ES: { symbol: '\u20AC', rate: 0.92, code: 'EUR' },
  IT: { symbol: '\u20AC', rate: 0.92, code: 'EUR' },
  PT: { symbol: '\u20AC', rate: 0.92, code: 'EUR' },
  NL: { symbol: '\u20AC', rate: 0.92, code: 'EUR' },
  DE: { symbol: '\u20AC', rate: 0.92, code: 'EUR' },
  GR: { symbol: '\u20AC', rate: 0.92, code: 'EUR' },
  MX: { symbol: 'MX$', rate: 17.15, code: 'MXN' },
  GB: { symbol: '\u00A3', rate: 0.79, code: 'GBP' },
  KR: { symbol: '\u20A9', rate: 1325, code: 'KRW' },
  CO: { symbol: 'COL$', rate: 3950, code: 'COP' },
  IN: { symbol: '\u20B9', rate: 83.2, code: 'INR' },
  TR: { symbol: '\u20BA', rate: 30.5, code: 'TRY' },
  AU: { symbol: 'A$', rate: 1.53, code: 'AUD' },
  NZ: { symbol: 'NZ$', rate: 1.65, code: 'NZD' },
  HU: { symbol: 'Ft', rate: 356, code: 'HUF' },
  HR: { symbol: '\u20AC', rate: 0.92, code: 'EUR' },
  MA: { symbol: 'MAD', rate: 10.1, code: 'MAD' },
  VN: { symbol: '\u20AB', rate: 24500, code: 'VND' },
  GE: { symbol: '\u20BE', rate: 2.65, code: 'GEL' },
  IS: { symbol: 'kr', rate: 137, code: 'ISK' },
  ZA: { symbol: 'R', rate: 18.6, code: 'ZAR' },
  KH: { symbol: '\u17DB', rate: 4100, code: 'KHR' },
  AE: { symbol: 'AED', rate: 3.67, code: 'AED' },
  AR: { symbol: 'AR$', rate: 875, code: 'ARS' },
  SI: { symbol: '\u20AC', rate: 0.92, code: 'EUR' },
};

const getCategoryMeta = (id: CategoryId): CategoryMeta =>
  CATEGORIES.find((c) => c.id === id) ?? CATEGORIES[5];

// =============================================================================
// Component
// =============================================================================
// Cheaper alternatives by category (shown when over budget)
const CHEAPER_ALTERNATIVES: Record<CategoryId, string> = {
  food: 'Try street food, lunch specials, or grocery stores instead of sit-down dinners',
  stay: 'Consider hostels, Airbnb outside center, or last-minute deals',
  transport: 'Use public transit, bike share, or walk instead of taxis/Uber',
  activities: 'Free walking tours, parks, and local markets cost less than paid tours',
  shopping: 'Hit local markets and avoid tourist-quarter souvenir shops',
  other: 'Review your misc spending — small costs add up',
};

function BudgetGuardianScreen() {
  const { t } = useTranslation();
  const router = useRouter();
  const insets = useSafeAreaInsets();
  const params = useLocalSearchParams<{
    tripId?: string;
    destination?: string;
    days?: string;
    dailyBudget?: string;
  }>();

  const trips = useAppStore((s) => s.trips);
  const activeTripId = useAppStore((s) => s.activeTripId);

  // Resolve trip: tripId param → active trip → params fallback
  const resolvedTrip = (() => {
    const tid = params.tripId ?? activeTripId;
    if (tid) {
      const t = trips.find((x) => x.id === tid);
      if (t) {
        let dailyNum = 100;
        if (t.itinerary) {
          try {
            const parsed = parseItinerary(t.itinerary);
            const total = parseFloat(String(parsed.totalBudget).replace(/[^0-9.]/g, '') || '0');
            if (total > 0 && t.days > 0) dailyNum = total / t.days;
          } catch {
            const fromBudget = parseFloat(String(t.budget).replace(/[^0-9.]/g, '') || '0');
            if (fromBudget > 0) dailyNum = fromBudget;
          }
        } else {
          const fromBudget = parseFloat(String(t.budget).replace(/[^0-9.]/g, '') || '0');
          if (fromBudget > 0) dailyNum = fromBudget;
          else if (t.budget?.toLowerCase().includes('backpacker')) dailyNum = 50;
          else if (t.budget?.toLowerCase().includes('comfort')) dailyNum = 125;
          else if (t.budget?.toLowerCase().includes('treat')) dailyNum = 350;
        }
        return {
          destination: t.destination,
          totalDays: t.days,
          dailyBudget: Math.max(1, dailyNum),
          totalBudget: Math.max(1, dailyNum) * t.days,
        };
      }
    }
    const dest = params.destination ?? 'Tokyo';
    const days = Math.max(1, parseInt(params.days ?? '5', 10));
    const daily = Math.max(1, parseFloat(params.dailyBudget ?? '100'));
    return { destination: dest, totalDays: days, dailyBudget: daily, totalBudget: daily * days };
  })();

  const destination = resolvedTrip.destination;
  const totalDays = resolvedTrip.totalDays;
  const dailyBudget = resolvedTrip.dailyBudget;
  const totalBudget = resolvedTrip.totalBudget;
  const tripId = params.tripId ?? activeTripId ?? null;
  const destTheme = useDestinationTheme(destination);

  // ---------------------------------------------------------------------------
  // State
  // ---------------------------------------------------------------------------
  const [expenses, setExpenses] = useState<Expense[]>([]);
  const expenseStorageKey = tripId
    ? `roam_budget_expenses_${tripId}`
    : `roam_budget_expenses_${destination.toLowerCase().replace(/\s+/g, '_')}`;

  // Load persisted expenses on mount
  useEffect(() => {
    AsyncStorage.getItem(expenseStorageKey)
      .then((raw) => {
        if (raw) setExpenses(JSON.parse(raw));
      })
      .catch(() => {});
  }, [expenseStorageKey]);

  // Persist expenses whenever they change
  useEffect(() => {
    if (expenses.length > 0) {
      AsyncStorage.setItem(expenseStorageKey, JSON.stringify(expenses)).catch(() => {});
    }
  }, [expenses, expenseStorageKey]);

  const [amountText, setAmountText] = useState('');
  const [selectedCategory, setSelectedCategory] = useState<CategoryId>('food');
  const [noteText, setNoteText] = useState('');
  const [currentDay, setCurrentDay] = useState(1);
  const [converterUsd, setConverterUsd] = useState('');

  // Animations
  const fadeAnim = useRef(new Animated.Value(0)).current;
  const slideAnim = useRef(new Animated.Value(30)).current;
  const barAnims = useRef(CATEGORIES.map(() => new Animated.Value(0))).current;
  const dayBarAnims = useRef(
    Array.from({ length: totalDays }, () => new Animated.Value(0)),
  ).current;

  useEffect(() => {
    Animated.parallel([
      Animated.timing(fadeAnim, {
        toValue: 1,
        duration: 600,
        useNativeDriver: true,
      }),
      Animated.timing(slideAnim, {
        toValue: 0,
        duration: 600,
        useNativeDriver: true,
      }),
    ]).start();
  }, []);

  // Animate bars when expenses change
  useEffect(() => {
    const sorted = getCategoryBreakdown();
    const maxAmount = Math.max(...sorted.map((s) => s.amount), 1);
    barAnims.forEach((anim, i) => {
      Animated.timing(anim, {
        toValue: sorted[i] ? sorted[i].amount / maxAmount : 0,
        duration: 500,
        useNativeDriver: false,
      }).start();
    });
  }, [expenses]);

  useEffect(() => {
    const maxDay = Math.max(...getDailySpending().map((d) => d.amount), dailyBudget);
    dayBarAnims.forEach((anim, i) => {
      const daySpend = getDailySpending()[i]?.amount ?? 0;
      Animated.timing(anim, {
        toValue: maxDay > 0 ? daySpend / maxDay : 0,
        duration: 500,
        useNativeDriver: false,
      }).start();
    });
  }, [expenses]);

  // ---------------------------------------------------------------------------
  // Computed
  // ---------------------------------------------------------------------------
  const totalSpent = useMemo(
    () => expenses.reduce((sum, e) => sum + e.amount, 0),
    [expenses],
  );
  const remaining = totalBudget - totalSpent;
  const spentPercentage = totalBudget > 0 ? (totalSpent / totalBudget) * 100 : 0;

  const budgetStatusColor =
    spentPercentage > 100
      ? COLORS.coral
      : spentPercentage >= 75
        ? COLORS.gold
        : COLORS.sage;

  const todaysExpenses = useMemo(
    () => expenses.filter((e) => e.day === currentDay),
    [expenses, currentDay],
  );
  const todayTotal = useMemo(
    () => todaysExpenses.reduce((sum, e) => sum + e.amount, 0),
    [todaysExpenses],
  );

  function getCategoryBreakdown() {
    const map: Record<CategoryId, number> = {
      food: 0,
      stay: 0,
      transport: 0,
      activities: 0,
      shopping: 0,
      other: 0,
    };
    expenses.forEach((e) => {
      map[e.category] += e.amount;
    });
    return CATEGORIES.map((c) => ({ ...c, amount: map[c.id] }))
      .filter((c) => c.amount > 0)
      .sort((a, b) => b.amount - a.amount);
  }

  function getDailySpending() {
    const days: { day: number; amount: number }[] = [];
    for (let d = 1; d <= totalDays; d++) {
      const dayAmount = expenses
        .filter((e) => e.day === d)
        .reduce((sum, e) => sum + e.amount, 0);
      days.push({ day: d, amount: dayAmount });
    }
    return days;
  }

  function getSmartAlerts(): string[] {
    const alerts: string[] = [];
    if (expenses.length === 0) return ['Start adding expenses to get smart insights'];

    const catBreakdown = getCategoryBreakdown();
    const foodSpend = catBreakdown.find((c) => c.id === 'food')?.amount ?? 0;
    const transportSpend = catBreakdown.find((c) => c.id === 'transport')?.amount ?? 0;

    if (totalSpent > 0 && foodSpend / totalSpent > 0.4) {
      alerts.push(
        `Food is ${Math.round((foodSpend / totalSpent) * 100)}% of your spending — more than planned`,
      );
    }
    if (totalSpent > 0 && transportSpend / totalSpent > 0.25) {
      alerts.push('Transport is eating into your budget');
    }

    if (totalSpent > totalBudget) {
      const biggest = catBreakdown[0];
      alerts.push(
        `Over budget by $${Math.round(totalSpent - totalBudget)} — cut back on ${biggest?.label ?? 'spending'}`,
      );
      if (biggest) {
        const alt = CHEAPER_ALTERNATIVES[biggest.id];
        if (alt) alerts.push(`Cheaper alternative: ${alt}`);
      }
    } else if (spentPercentage >= 75) {
      alerts.push(`At ${Math.round(spentPercentage)}% of budget — watch your spending`);
      const biggest = catBreakdown[0];
      if (biggest) {
        const alt = CHEAPER_ALTERNATIVES[biggest.id];
        if (alt) alerts.push(`Tip: ${alt}`);
      }
    } else {
      const daysLeft = totalDays - currentDay + 1;
      const perDayLeft = daysLeft > 0 ? Math.round(remaining / daysLeft) : 0;
      alerts.push(`On track — you have $${perDayLeft}/day left for ${daysLeft} days`);
    }

    return alerts;
  }

  // ---------------------------------------------------------------------------
  // Handlers
  // ---------------------------------------------------------------------------
  const handleAddExpense = useCallback(() => {
    const amount = parseFloat(amountText);
    if (!amount || amount <= 0) return;

    Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Medium);

    const expense: Expense = {
      id: `${Date.now()}-${Math.random().toString(36).slice(2, 7)}`,
      amount,
      category: selectedCategory,
      note: noteText.trim(),
      day: currentDay,
      timestamp: Date.now(),
    };

    setExpenses((prev) => [...prev, expense]);
    setAmountText('');
    setNoteText('');
    Keyboard.dismiss();
  }, [amountText, selectedCategory, noteText, currentDay]);

  // ---------------------------------------------------------------------------
  // Currency converter
  // ---------------------------------------------------------------------------
  // Find destination country code from DESTINATIONS-like data
  const destCountryCode = useMemo(() => {
    // Try common mappings
    const map: Record<string, string> = {
      Tokyo: 'JP', Kyoto: 'JP', Osaka: 'JP',
      Bali: 'ID', Jakarta: 'ID',
      Bangkok: 'TH', 'Chiang Mai': 'TH',
      Paris: 'FR', Lyon: 'FR',
      Barcelona: 'ES', Madrid: 'ES',
      Rome: 'IT', Florence: 'IT', Milan: 'IT',
      London: 'GB',
      'Mexico City': 'MX', Oaxaca: 'MX',
      Lisbon: 'PT', Porto: 'PT',
      Amsterdam: 'NL',
      Seoul: 'KR',
      Istanbul: 'TR',
      'Buenos Aires': 'AR',
      'Cape Town': 'ZA',
      Reykjavik: 'IS',
      Marrakech: 'MA',
      Sydney: 'AU',
      Queenstown: 'NZ',
      Budapest: 'HU',
      Dubrovnik: 'HR',
      'Hoi An': 'VN',
      Cartagena: 'CO', 'Medell\u00EDn': 'CO',
      Jaipur: 'IN',
      Tbilisi: 'GE',
      Dubai: 'AE',
      'New York': 'US', 'San Diego, CA': 'US', 'Portland, OR': 'US',
      'Asheville, NC': 'US', 'Denver, CO': 'US',
      Santorini: 'GR',
      'Siem Reap': 'KH',
      Ljubljana: 'SI',
      Azores: 'PT',
    };
    return map[destination] ?? null;
  }, [destination]);

  const currencyInfo = destCountryCode ? CURRENCY_RATES[destCountryCode] : null;
  const converterAmount = parseFloat(converterUsd) || 0;
  const convertedValue = currencyInfo ? converterAmount * currencyInfo.rate : 0;

  // ---------------------------------------------------------------------------
  // Render helpers
  // ---------------------------------------------------------------------------
  const formatCurrency = (v: number) =>
    `$${v.toLocaleString(undefined, { minimumFractionDigits: 0, maximumFractionDigits: 0 })}`;

  const renderGlassCard = (
    children: React.ReactNode,
    style?: ViewStyle,
    key?: string,
  ) => (
    <View key={key} style={[styles.glassCard, style]}>
      {children}
    </View>
  );

  // ==========================================================================
  return (
    <View style={[styles.container, { paddingTop: insets.top }]}>
      {/* Header */}
      <LinearGradient
        colors={[COLORS.bg, COLORS.bgDarkGreen]}
        style={styles.headerGradient}
      >
        <View style={styles.headerRow}>
          <Pressable onPress={() => router.back()} hitSlop={12} style={[styles.backBtnWrap, { backgroundColor: `${destTheme.primary}20`, borderRadius: RADIUS.full }]}>
            <ChevronLeft size={24} color={COLORS.cream} />
          </Pressable>
          <View style={{ flex: 1 }}>
            <Text style={styles.headerTitle}>{t('budgetGuardian.title')}</Text>
            <Text style={styles.headerSubtitle}>
              {destination} {'\u00B7'} {totalDays} days
            </Text>
          </View>
          {/* Day selector */}
          <Pressable
            onPress={() => {
              Haptics.selectionAsync();
              setCurrentDay((d) => (d < totalDays ? d + 1 : 1));
            }}
            style={styles.dayChip}
          >
            <Text style={styles.dayChipText}>Day {currentDay}</Text>
          </Pressable>
        </View>
      </LinearGradient>

      <ScrollView
        style={styles.scroll}
        contentContainerStyle={[styles.scrollContent, { paddingBottom: insets.bottom + SPACING.xxl }]}
        showsVerticalScrollIndicator={false}
        keyboardShouldPersistTaps="handled"
      >
        <Animated.View style={{ opacity: fadeAnim, transform: [{ translateY: slideAnim }] }}>
          {/* ================================================================
              1. Budget Overview
              ================================================================ */}
          {renderGlassCard(
            <>
              <Text style={styles.sectionLabel}>· {t('budgetGuardian.totalBudget')}</Text>
              <Text style={[styles.bigAmount, { color: budgetStatusColor }]}>
                {formatCurrency(totalBudget)}
              </Text>

              {/* Progress bar */}
              <View style={styles.progressBarTrack}>
                <View
                  style={[
                    styles.progressBarFill,
                    {
                      width: `${Math.min(spentPercentage, 100)}%`,
                      backgroundColor: budgetStatusColor,
                    },
                  ]}
                />
                {/* Daily target marker */}
                {totalBudget > 0 && (
                  <View
                    style={[
                      styles.targetMarker,
                      { left: `${Math.min(((dailyBudget * currentDay) / totalBudget) * 100, 100)}%` },
                    ]}
                  />
                )}
              </View>

              <View style={styles.budgetRow}>
                <View>
                  <Text style={styles.budgetLabel}>{t('budgetGuardian.spent')}</Text>
                  <Text style={[styles.budgetValue, { color: budgetStatusColor }]}>
                    {formatCurrency(totalSpent)}
                  </Text>
                </View>
                <View>
                  <Text style={styles.budgetLabel}>{t('budgetGuardian.remaining')}</Text>
                  <Text
                    style={[
                      styles.budgetValue,
                      { color: remaining >= 0 ? COLORS.sage : COLORS.coral },
                    ]}
                  >
                    {remaining >= 0 ? formatCurrency(remaining) : `-${formatCurrency(Math.abs(remaining))}`}
                  </Text>
                </View>
                <View>
                  <Text style={styles.budgetLabel}>{t('budgetGuardian.dailyTarget')}</Text>
                  <Text style={[styles.budgetValue, { color: COLORS.cream }]}>
                    {formatCurrency(dailyBudget)}
                  </Text>
                </View>
              </View>
            </>,
          )}

          {/* ================================================================
              2. Add Expense
              ================================================================ */}
          {renderGlassCard(
            <>
              <Text style={styles.sectionLabel}>· {t('budgetGuardian.addExpense')}</Text>

              {/* Amount input */}
              <View style={styles.amountRow}>
                <Text style={styles.dollarSign}>$</Text>
                <TextInput
                  style={styles.amountInput}
                  placeholder="0"
                  placeholderTextColor={COLORS.creamMuted}
                  keyboardType="decimal-pad"
                  value={amountText}
                  onChangeText={setAmountText}
                  returnKeyType="done"
                />
              </View>

              {/* Category selector */}
              <View style={styles.categoryRow}>
                {CATEGORIES.map((cat) => (
                  <Pressable
                    key={cat.id}
                    onPress={() => {
                      Haptics.selectionAsync();
                      setSelectedCategory(cat.id);
                    }}
                    style={[
                      styles.categoryChip,
                      selectedCategory === cat.id && {
                        backgroundColor: cat.color + '30',
                        borderColor: cat.color,
                      },
                    ]}
                  >
                    <Text
                      style={[
                        styles.categoryLabel,
                        selectedCategory === cat.id && { color: cat.color },
                      ]}
                    >
                      {cat.label}
                    </Text>
                  </Pressable>
                ))}
              </View>

              {/* Note */}
              <TextInput
                style={styles.noteInput}
                placeholder="Note (optional)"
                placeholderTextColor={COLORS.creamMuted}
                value={noteText}
                onChangeText={setNoteText}
                returnKeyType="done"
                maxLength={50}
              />

              {/* Add button */}
              <Pressable
                onPress={handleAddExpense}
                style={({ pressed }) => [
                  styles.addButton,
                  pressed && { opacity: 0.8, transform: [{ scale: 0.97 }] },
                ]}
              >
                <LinearGradient
                  colors={[COLORS.sage, COLORS.sageDarker]}
                  start={{ x: 0, y: 0 }}
                  end={{ x: 1, y: 0 }}
                  style={styles.addButtonGradient}
                >
                  <Text style={styles.addButtonText}>{t('budgetGuardian.addButton')}</Text>
                </LinearGradient>
              </Pressable>
            </>,
          )}

          {/* ================================================================
              3. Today's Spending
              ================================================================ */}
          {renderGlassCard(
            <>
              <View style={styles.sectionHeaderRow}>
                <Text style={styles.sectionLabel}>· {t('budgetGuardian.todaysSpending')}</Text>
                <Text
                  style={[
                    styles.todayTotal,
                    { color: todayTotal > dailyBudget ? COLORS.coral : COLORS.sage },
                  ]}
                >
                  {formatCurrency(todayTotal)} / {formatCurrency(dailyBudget)}
                </Text>
              </View>

              {/* Today's progress mini-bar */}
              <View style={styles.miniBarTrack}>
                <View
                  style={[
                    styles.miniBarFill,
                    {
                      width: `${Math.min((todayTotal / dailyBudget) * 100, 100)}%`,
                      backgroundColor:
                        todayTotal > dailyBudget ? COLORS.coral : COLORS.sage,
                    },
                  ]}
                />
              </View>

              {todaysExpenses.length === 0 ? (
                <Text style={styles.emptyText}>No expenses yet for Day {currentDay}</Text>
              ) : (
                todaysExpenses.map((exp) => {
                  const cat = getCategoryMeta(exp.category);
                  return (
                    <View key={exp.id} style={styles.expenseItem}>
                      <View style={[styles.expenseDot, { backgroundColor: cat.color }]} />
                      <View style={{ flex: 1 }}>
                        <Text style={styles.expenseCategory}>{cat.label}</Text>
                        {exp.note ? (
                          <Text style={styles.expenseNote}>{exp.note}</Text>
                        ) : null}
                      </View>
                      <Text style={[styles.expenseAmount, { color: cat.color }]}>
                        ${exp.amount.toFixed(2)}
                      </Text>
                    </View>
                  );
                })
              )}
            </>,
          )}

          {/* ================================================================
              4. Category Breakdown (horizontal bars)
              ================================================================ */}
          {expenses.length > 0 &&
            renderGlassCard(
              <>
                <Text style={styles.sectionLabel}>· {t('budgetGuardian.categoryBreakdown')}</Text>
                {getCategoryBreakdown().map((cat, i) => {
                  const pct = totalSpent > 0 ? (cat.amount / totalSpent) * 100 : 0;
                  return (
                    <View key={cat.id} style={styles.catBarRow}>
                      <View style={styles.catBarLabel}>
                        <View style={[styles.catBarDot, { backgroundColor: cat.color }]} />
                        <Text style={styles.catBarName}>{cat.label}</Text>
                      </View>
                      <View style={styles.catBarTrack}>
                        <Animated.View
                          style={[
                            styles.catBarFill,
                            {
                              width: barAnims[i]
                                ? barAnims[i].interpolate({
                                    inputRange: [0, 1],
                                    outputRange: ['0%', '100%'],
                                  })
                                : '0%',
                              backgroundColor: cat.color,
                            },
                          ]}
                        />
                      </View>
                      <View style={styles.catBarValues}>
                        <Text style={[styles.catBarAmount, { color: cat.color }]}>
                          ${Math.round(cat.amount)}
                        </Text>
                        <Text style={styles.catBarPct}>{Math.round(pct)}%</Text>
                      </View>
                    </View>
                  );
                })}
              </>,
            )}

          {/* ================================================================
              5. Daily Trend (bar chart)
              ================================================================ */}
          {expenses.length > 0 &&
            renderGlassCard(
              <>
                <Text style={styles.sectionLabel}>· {t('budgetGuardian.dailyTrend')}</Text>
                <View style={styles.chartContainer}>
                  {/* Budget target line */}
                  {(() => {
                    const dailyData = getDailySpending();
                    const maxVal = Math.max(
                      ...dailyData.map((d) => d.amount),
                      dailyBudget,
                    );
                    const targetPct = maxVal > 0 ? (dailyBudget / maxVal) * 100 : 50;
                    return (
                      <View
                        style={[
                          styles.targetLine,
                          { bottom: `${targetPct}%` },
                        ]}
                      >
                        <Text style={styles.targetLineLabel}>
                          ${dailyBudget}/day
                        </Text>
                      </View>
                    );
                  })()}

                  <View style={styles.chartBars}>
                    {getDailySpending().map((day, i) => {
                      const isToday = day.day === currentDay;
                      const overBudget = day.amount > dailyBudget;
                      const barColor = isToday
                        ? COLORS.sage
                        : overBudget
                          ? COLORS.coral
                          : COLORS.gold;

                      return (
                        <View key={day.day} style={styles.chartBarCol}>
                          <View style={styles.chartBarWrapper}>
                            <Animated.View
                              style={[
                                styles.chartBar,
                                {
                                  height: dayBarAnims[i]
                                    ? dayBarAnims[i].interpolate({
                                        inputRange: [0, 1],
                                        outputRange: ['0%', '100%'],
                                      })
                                    : '0%',
                                  backgroundColor: barColor,
                                  borderWidth: isToday ? 1 : 0,
                                  borderColor: COLORS.sage,
                                },
                              ]}
                            />
                          </View>
                          <Text
                            style={[
                              styles.chartDayLabel,
                              isToday && { color: COLORS.sage },
                            ]}
                          >
                            D{day.day}
                          </Text>
                        </View>
                      );
                    })}
                  </View>
                </View>
              </>,
            )}

          {/* ================================================================
              6. Smart Alerts
              ================================================================ */}
          {renderGlassCard(
            <>
              <Text style={styles.sectionLabel}>· {t('budgetGuardian.smartAlerts')}</Text>
              {getSmartAlerts().map((alert, i) => {
                const isWarning =
                  alert.includes('eating') ||
                  alert.includes('more than') ||
                  alert.includes('Over budget');
                const isGood = alert.includes('On track');
                return (
                  <View
                    key={i}
                    style={[
                      styles.alertItem,
                      {
                        borderLeftColor: isWarning
                          ? COLORS.coral
                          : isGood
                            ? COLORS.sage
                            : COLORS.gold,
                      },
                    ]}
                  >
                    <Text style={styles.alertText}>{alert}</Text>
                  </View>
                );
              })}
            </>,
          )}

          {/* ================================================================
              7. Currency Converter
              ================================================================ */}
          {currencyInfo &&
            renderGlassCard(
              <>
                <Text style={styles.sectionLabel}>· {t('budgetGuardian.currencyConverter')}</Text>
                <Text style={styles.exchangeRate}>
                  1 USD = {currencyInfo.rate.toLocaleString()} {currencyInfo.code}
                </Text>

                <View style={styles.converterRow}>
                  <View style={styles.converterInput}>
                    <Text style={styles.converterCurrency}>USD</Text>
                    <TextInput
                      style={styles.converterField}
                      placeholder="0"
                      placeholderTextColor={COLORS.creamMuted}
                      keyboardType="decimal-pad"
                      value={converterUsd}
                      onChangeText={setConverterUsd}
                      returnKeyType="done"
                    />
                  </View>

                  <Text style={styles.converterArrow}>{'\u2192'}</Text>

                  <View style={[styles.converterInput, { backgroundColor: COLORS.bgElevated }]}>
                    <Text style={styles.converterCurrency}>{currencyInfo.code}</Text>
                    <Text style={styles.converterResult}>
                      {converterAmount > 0
                        ? `${currencyInfo.symbol}${convertedValue.toLocaleString(undefined, { maximumFractionDigits: 0 })}`
                        : '\u2014'}
                    </Text>
                  </View>
                </View>
              </>,
            )}
        </Animated.View>
      </ScrollView>
    </View>
  );
}

// =============================================================================
// Styles
// =============================================================================
const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: COLORS.bg,
  } as ViewStyle,

  headerGradient: {
    paddingHorizontal: SPACING.lg,
    paddingBottom: SPACING.md,
  } as ViewStyle,

  headerRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: SPACING.md,
  } as ViewStyle,

  backButton: {
    fontFamily: FONTS.body,
    fontSize: 24,
    color: COLORS.cream,
  } as TextStyle,

  headerTitle: {
    fontFamily: FONTS.header,
    fontSize: 28,
    color: COLORS.cream,
    letterSpacing: 0.3,
  } as TextStyle,

  headerSubtitle: {
    fontFamily: FONTS.mono,
    fontSize: 12,
    color: COLORS.creamMuted,
    marginTop: 2,
    letterSpacing: 0.5,
  } as TextStyle,

  dayChip: {
    backgroundColor: COLORS.sageLight,
    paddingHorizontal: SPACING.md,
    paddingVertical: SPACING.xs + 2,
    borderRadius: RADIUS.full,
    borderWidth: 1,
    borderColor: COLORS.sage,
  } as ViewStyle,

  dayChipText: {
    fontFamily: FONTS.monoMedium,
    fontSize: 13,
    color: COLORS.sage,
  } as TextStyle,

  scroll: {
    flex: 1,
  } as ViewStyle,

  scrollContent: {
    paddingHorizontal: SPACING.lg,
    paddingTop: SPACING.md,
    gap: SPACING.md,
  } as ViewStyle,

  // Glass card
  glassCard: {
    backgroundColor: COLORS.bgGlass,
    borderRadius: RADIUS.lg,
    borderWidth: 1,
    borderColor: COLORS.border,
    padding: SPACING.lg,
  } as ViewStyle,

  sectionLabel: {
    fontFamily: FONTS.body,
    fontSize: 13,
    color: COLORS.creamSoft,
    marginBottom: SPACING.md,
  } as TextStyle,

  sectionHeaderRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
  } as ViewStyle,

  // Budget overview
  bigAmount: {
    fontFamily: FONTS.header,
    fontSize: 48,
    color: COLORS.sage,
    marginBottom: SPACING.md,
  } as TextStyle,

  progressBarTrack: {
    height: 8,
    backgroundColor: COLORS.bgElevated,
    borderRadius: RADIUS.full,
    marginBottom: SPACING.lg,
    overflow: 'hidden',
    position: 'relative',
  } as ViewStyle,

  progressBarFill: {
    height: '100%',
    borderRadius: RADIUS.full,
  } as ViewStyle,

  targetMarker: {
    position: 'absolute',
    top: -3,
    width: 2,
    height: 14,
    backgroundColor: COLORS.cream,
    borderRadius: 1,
  } as ViewStyle,

  budgetRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
  } as ViewStyle,

  budgetLabel: {
    fontFamily: FONTS.mono,
    fontSize: 10,
    color: COLORS.creamMuted,
    letterSpacing: 1,
    marginBottom: 4,
  } as TextStyle,

  budgetValue: {
    fontFamily: FONTS.bodySemiBold,
    fontSize: 18,
    color: COLORS.cream,
  } as TextStyle,

  // Add expense
  amountRow: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: SPACING.md,
  } as ViewStyle,

  dollarSign: {
    fontFamily: FONTS.header,
    fontSize: 36,
    color: COLORS.creamMuted,
    marginRight: SPACING.xs,
  } as TextStyle,

  amountInput: {
    flex: 1,
    fontFamily: FONTS.header,
    fontSize: 36,
    color: COLORS.cream,
    borderBottomWidth: 1,
    borderBottomColor: COLORS.border,
    paddingBottom: SPACING.xs,
  } as TextStyle,

  categoryRow: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: SPACING.sm,
    marginBottom: SPACING.md,
  } as ViewStyle,

  categoryChip: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
    paddingHorizontal: SPACING.sm + 4,
    paddingVertical: SPACING.xs + 2,
    borderRadius: RADIUS.full,
    borderWidth: 1,
    borderColor: COLORS.border,
    backgroundColor: COLORS.bgCard,
  } as ViewStyle,

  backBtnWrap: {
    width: 40,
    height: 40,
    alignItems: 'center',
    justifyContent: 'center',
  } as ViewStyle,

  categoryLabel: {
    fontFamily: FONTS.bodyMedium,
    fontSize: 12,
    color: COLORS.creamMuted,
  } as TextStyle,

  noteInput: {
    fontFamily: FONTS.body,
    fontSize: 14,
    color: COLORS.cream,
    borderWidth: 1,
    borderColor: COLORS.border,
    borderRadius: RADIUS.sm,
    paddingHorizontal: SPACING.md,
    paddingVertical: SPACING.sm + 2,
    marginBottom: SPACING.md,
  } as TextStyle,

  addButton: {
    borderRadius: RADIUS.md,
    overflow: 'hidden',
  } as ViewStyle,

  addButtonGradient: {
    paddingVertical: SPACING.sm + 4,
    alignItems: 'center',
    borderRadius: RADIUS.md,
  } as ViewStyle,

  addButtonText: {
    fontFamily: FONTS.bodySemiBold,
    fontSize: 15,
    color: COLORS.bg,
    letterSpacing: 0.3,
  } as TextStyle,

  // Today's spending
  todayTotal: {
    fontFamily: FONTS.monoMedium,
    fontSize: 13,
  } as TextStyle,

  miniBarTrack: {
    height: 4,
    backgroundColor: COLORS.bgElevated,
    borderRadius: RADIUS.full,
    marginBottom: SPACING.md,
    overflow: 'hidden',
  } as ViewStyle,

  miniBarFill: {
    height: '100%',
    borderRadius: RADIUS.full,
  } as ViewStyle,

  emptyText: {
    fontFamily: FONTS.body,
    fontSize: 14,
    color: COLORS.creamMuted,
    textAlign: 'center',
    paddingVertical: SPACING.lg,
  } as TextStyle,

  expenseItem: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: SPACING.sm,
    paddingVertical: SPACING.sm,
    borderBottomWidth: 1,
    borderBottomColor: COLORS.border,
  } as ViewStyle,

  expenseDot: {
    width: 8,
    height: 8,
    borderRadius: 4,
    marginRight: SPACING.sm,
  } as ViewStyle,

  expenseCategory: {
    fontFamily: FONTS.bodyMedium,
    fontSize: 14,
    color: COLORS.cream,
  } as TextStyle,

  expenseNote: {
    fontFamily: FONTS.body,
    fontSize: 12,
    color: COLORS.creamMuted,
    marginTop: 2,
  } as TextStyle,

  expenseAmount: {
    fontFamily: FONTS.monoMedium,
    fontSize: 15,
  } as TextStyle,

  // Category breakdown bars
  catBarRow: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: SPACING.sm + 2,
    gap: SPACING.sm,
  } as ViewStyle,

  catBarLabel: {
    flexDirection: 'row',
    alignItems: 'center',
    width: 80,
    gap: 4,
  } as ViewStyle,

  catBarDot: {
    width: 8,
    height: 8,
    borderRadius: 4,
    marginRight: 6,
  } as ViewStyle,

  catBarName: {
    fontFamily: FONTS.bodyMedium,
    fontSize: 12,
    color: COLORS.cream,
  } as TextStyle,

  catBarTrack: {
    flex: 1,
    height: 16,
    backgroundColor: COLORS.bgElevated,
    borderRadius: RADIUS.sm,
    overflow: 'hidden',
  } as ViewStyle,

  catBarFill: {
    height: '100%',
    borderRadius: RADIUS.sm,
  } as ViewStyle,

  catBarValues: {
    width: 72,
    flexDirection: 'row',
    justifyContent: 'flex-end',
    gap: 6,
  } as ViewStyle,

  catBarAmount: {
    fontFamily: FONTS.monoMedium,
    fontSize: 12,
  } as TextStyle,

  catBarPct: {
    fontFamily: FONTS.mono,
    fontSize: 11,
    color: COLORS.creamMuted,
  } as TextStyle,

  // Daily trend chart
  chartContainer: {
    height: 160,
    position: 'relative',
  } as ViewStyle,

  targetLine: {
    position: 'absolute',
    left: 0,
    right: 0,
    flexDirection: 'row',
    alignItems: 'center',
    zIndex: 1,
  } as ViewStyle,

  targetLineLabel: {
    fontFamily: FONTS.mono,
    fontSize: 9,
    color: COLORS.creamMuted,
    backgroundColor: COLORS.bg,
    paddingHorizontal: 4,
    position: 'absolute',
    right: 0,
    top: -8,
  } as TextStyle,

  chartBars: {
    flex: 1,
    flexDirection: 'row',
    alignItems: 'flex-end',
    gap: 4,
    borderTopWidth: 1,
    borderTopColor: COLORS.border,
    paddingTop: SPACING.sm,
  } as ViewStyle,

  chartBarCol: {
    flex: 1,
    alignItems: 'center',
  } as ViewStyle,

  chartBarWrapper: {
    width: '100%',
    height: 120,
    justifyContent: 'flex-end',
  } as ViewStyle,

  chartBar: {
    width: '100%',
    borderRadius: RADIUS.sm,
    minHeight: 2,
  } as ViewStyle,

  chartDayLabel: {
    fontFamily: FONTS.mono,
    fontSize: 9,
    color: COLORS.creamMuted,
    marginTop: 4,
  } as TextStyle,

  // Smart alerts
  alertItem: {
    borderLeftWidth: 3,
    paddingLeft: SPACING.md,
    paddingVertical: SPACING.sm,
    marginBottom: SPACING.sm,
  } as ViewStyle,

  alertText: {
    fontFamily: FONTS.body,
    fontSize: 14,
    color: COLORS.cream,
    lineHeight: 20,
  } as TextStyle,

  // Currency converter
  exchangeRate: {
    fontFamily: FONTS.mono,
    fontSize: 13,
    color: COLORS.gold,
    marginBottom: SPACING.md,
  } as TextStyle,

  converterRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: SPACING.sm,
  } as ViewStyle,

  converterInput: {
    flex: 1,
    backgroundColor: COLORS.bgCard,
    borderRadius: RADIUS.md,
    borderWidth: 1,
    borderColor: COLORS.border,
    padding: SPACING.md,
  } as ViewStyle,

  converterCurrency: {
    fontFamily: FONTS.monoMedium,
    fontSize: 11,
    color: COLORS.creamMuted,
    letterSpacing: 1,
    marginBottom: 4,
  } as TextStyle,

  converterField: {
    fontFamily: FONTS.bodySemiBold,
    fontSize: 20,
    color: COLORS.cream,
  } as TextStyle,

  converterArrow: {
    fontFamily: FONTS.body,
    fontSize: 20,
    color: COLORS.creamMuted,
  } as TextStyle,

  converterResult: {
    fontFamily: FONTS.bodySemiBold,
    fontSize: 20,
    color: COLORS.gold,
  } as TextStyle,
});

export default withComingSoon(BudgetGuardianScreen, { routeName: 'budget-guardian', title: 'Budget Guardian' });
