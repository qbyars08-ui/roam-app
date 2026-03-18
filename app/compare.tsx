// =============================================================================
// ROAM — Destination Comparison Screen
// Side-by-side comparison of two destinations across key travel metrics.
// Accessed via router.push('/compare') or router.push('/compare?left=Tokyo&right=Seoul')
// =============================================================================
import React, { useCallback, useEffect, useMemo, useState } from 'react';
import {
  ActivityIndicator,
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
import { ArrowLeft, GitCompare } from 'lucide-react-native';
import { useTranslation } from 'react-i18next';
import * as Haptics from '../lib/haptics';
import { COLORS, FONTS, SPACING, RADIUS } from '../lib/constants';
import { getCurrentWeather, type CurrentWeather } from '../lib/apis/openweather';
import { getCostOfLiving, type CostOfLiving } from '../lib/cost-of-living';
import { getTravelAdvisory, type TravelAdvisory } from '../lib/travel-safety';
import { getVisaInfo, destinationToCountryCode, type VisaInfo } from '../lib/visa-data';
import { getExchangeRates, type ExchangeRateData } from '../lib/exchange-rates';
import { useSonarQuery } from '../lib/sonar';
import { DESTINATIONS } from '../lib/constants';

// ---------------------------------------------------------------------------
// Types
// ---------------------------------------------------------------------------

interface DestinationData {
  weather: CurrentWeather | null;
  cost: CostOfLiving | null;
  safety: TravelAdvisory | null;
  visa: VisaInfo | null;
  rates: ExchangeRateData | null;
}

// ---------------------------------------------------------------------------
// Helpers
// ---------------------------------------------------------------------------

function getCountryCode(destination: string): string | null {
  const dest = DESTINATIONS.find(
    (d) => d.label.toLowerCase() === destination.toLowerCase(),
  );
  if (dest) return dest.country;
  return destinationToCountryCode(destination);
}

function getCurrencyCode(destination: string): string | null {
  const dest = DESTINATIONS.find(
    (d) => d.label.toLowerCase() === destination.toLowerCase(),
  );
  return dest?.currencyCode ?? null;
}

function getSafetyScore(destination: string): number | null {
  const dest = DESTINATIONS.find(
    (d) => d.label.toLowerCase() === destination.toLowerCase(),
  );
  return dest?.safetyScore ?? null;
}

function getDailyCost(destination: string): number | null {
  const dest = DESTINATIONS.find(
    (d) => d.label.toLowerCase() === destination.toLowerCase(),
  );
  return dest?.dailyCost ?? null;
}

// ---------------------------------------------------------------------------
// Winner logic — returns 'left' | 'right' | 'tie'
// ---------------------------------------------------------------------------

type Side = 'left' | 'right' | 'tie';

function cheaperWins(left: number | null, right: number | null): Side {
  if (left == null || right == null) return 'tie';
  if (left < right) return 'left';
  if (right < left) return 'right';
  return 'tie';
}

function higherWins(left: number | null, right: number | null): Side {
  if (left == null || right == null) return 'tie';
  if (left > right) return 'left';
  if (right > left) return 'right';
  return 'tie';
}

function lowerRiskWins(left: number | null, right: number | null): Side {
  // Lower score = lower risk = better
  if (left == null || right == null) return 'tie';
  if (left < right) return 'left';
  if (right < left) return 'right';
  return 'tie';
}

function warmerWins(left: number | null, right: number | null): Side {
  return higherWins(left, right);
}

function moreStayDaysWins(left: number | null, right: number | null): Side {
  return higherWins(left, right);
}

// ---------------------------------------------------------------------------
// Comparison Row Component
// ---------------------------------------------------------------------------

interface ComparisonRowProps {
  label: string;
  leftValue: string;
  rightValue: string;
  winner: Side;
  isLast?: boolean;
}

function ComparisonRow({
  label,
  leftValue,
  rightValue,
  winner,
  isLast = false,
}: ComparisonRowProps) {
  const leftWins = winner === 'left';
  const rightWins = winner === 'right';

  return (
    <View style={[styles.row, isLast && styles.rowLast]}>
      <View style={styles.rowSide}>
        <Text
          style={[styles.rowValue, leftWins && styles.rowValueWinner]}
          numberOfLines={2}
        >
          {leftValue}
        </Text>
      </View>

      <View style={styles.rowLabel}>
        <Text style={styles.rowLabelText}>{label}</Text>
      </View>

      <View style={styles.rowSide}>
        <Text
          style={[styles.rowValue, styles.rowValueRight, rightWins && styles.rowValueWinner]}
          numberOfLines={2}
        >
          {rightValue}
        </Text>
      </View>
    </View>
  );
}

// ---------------------------------------------------------------------------
// Loading row skeleton
// ---------------------------------------------------------------------------

function SkeletonRow({ label }: { label: string }) {
  return (
    <View style={styles.row}>
      <View style={styles.rowSide}>
        <View style={styles.skeleton} />
      </View>
      <View style={styles.rowLabel}>
        <Text style={styles.rowLabelText}>{label}</Text>
      </View>
      <View style={styles.rowSide}>
        <View style={styles.skeleton} />
      </View>
    </View>
  );
}

// ---------------------------------------------------------------------------
// Per-side data hook
// ---------------------------------------------------------------------------

function useDestinationData(destination: string | null): {
  data: DestinationData;
  loading: boolean;
} {
  const [weather, setWeather] = useState<CurrentWeather | null>(null);
  const [safety, setSafety] = useState<TravelAdvisory | null>(null);
  const [rates, setRates] = useState<ExchangeRateData | null>(null);
  const [loading, setLoading] = useState(false);

  const cost = useMemo(() => {
    if (!destination) return null;
    return getCostOfLiving(destination);
  }, [destination]);

  const visa = useMemo(() => {
    if (!destination) return null;
    return getVisaInfo(destination, 'US');
  }, [destination]);

  useEffect(() => {
    if (!destination) {
      setWeather(null);
      setSafety(null);
      setRates(null);
      setLoading(false);
      return;
    }

    let cancelled = false;
    setLoading(true);

    const countryCode = getCountryCode(destination);
    const currencyCode = getCurrencyCode(destination);

    Promise.all([
      getCurrentWeather(destination),
      countryCode ? getTravelAdvisory(countryCode) : Promise.resolve(null),
      currencyCode ? getExchangeRates('USD') : Promise.resolve(null),
    ])
      .then(([w, s, r]) => {
        if (cancelled) return;
        setWeather(w);
        setSafety(s);
        setRates(r);
      })
      .catch(() => {
        // Best-effort — partial data is fine
      })
      .finally(() => {
        if (!cancelled) setLoading(false);
      });

    return () => {
      cancelled = true;
    };
  }, [destination]);

  return {
    data: { weather, cost, safety, visa, rates },
    loading,
  };
}

// ---------------------------------------------------------------------------
// Main Screen
// ---------------------------------------------------------------------------

export default function CompareScreen() {
  const router = useRouter();
  const insets = useSafeAreaInsets();
  const { t } = useTranslation();
  const params = useLocalSearchParams<{ left?: string; right?: string }>();

  const [leftInput, setLeftInput] = useState(params.left ?? '');
  const [rightInput, setRightInput] = useState(params.right ?? '');
  const [leftDest, setLeftDest] = useState<string | null>(params.left ?? null);
  const [rightDest, setRightDest] = useState<string | null>(params.right ?? null);

  const { data: leftData, loading: leftLoading } = useDestinationData(leftDest);
  const { data: rightData, loading: rightLoading } = useDestinationData(rightDest);

  // Sonar pulse vibe for each side
  const leftSonar = useSonarQuery(leftDest ?? undefined, 'pulse');
  const rightSonar = useSonarQuery(rightDest ?? undefined, 'pulse');

  const isLoading = leftLoading || rightLoading;
  const bothSelected = leftDest != null && rightDest != null;

  const handleSubmitLeft = useCallback(() => {
    const trimmed = leftInput.trim();
    setLeftDest(trimmed.length > 0 ? trimmed : null);
  }, [leftInput]);

  const handleSubmitRight = useCallback(() => {
    const trimmed = rightInput.trim();
    setRightDest(trimmed.length > 0 ? trimmed : null);
  }, [rightInput]);

  const handlePlanLeft = useCallback(() => {
    if (!leftDest) return;
    Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Medium);
    router.push(`/(tabs)/plan` as never);
  }, [leftDest, router]);

  const handlePlanRight = useCallback(() => {
    if (!rightDest) return;
    Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Medium);
    router.push(`/(tabs)/plan` as never);
  }, [rightDest, router]);

  // ---- Winner derivations ----
  const leftDailyCost = getDailyCost(leftDest ?? '');
  const rightDailyCost = getDailyCost(rightDest ?? '');
  const costWinner = cheaperWins(leftDailyCost, rightDailyCost);

  const leftSafetyScore = getSafetyScore(leftDest ?? '');
  const rightSafetyScore = getSafetyScore(rightDest ?? '');
  const safetyWinner = higherWins(leftSafetyScore, rightSafetyScore);

  const leftTemp = leftData.weather?.temp ?? null;
  const rightTemp = rightData.weather?.temp ?? null;
  const tempWinner = warmerWins(leftTemp, rightTemp);

  const leftStay = leftData.visa?.maxStay ?? null;
  const rightStay = rightData.visa?.maxStay ?? null;
  const visaWinner = moreStayDaysWins(leftStay, rightStay);

  const leftAdvisoryScore = leftData.safety?.score ?? null;
  const rightAdvisoryScore = rightData.safety?.score ?? null;
  const advisoryWinner = lowerRiskWins(leftAdvisoryScore, rightAdvisoryScore);

  // Currency rate display
  const getRate = useCallback(
    (dest: string | null, ratesData: ExchangeRateData | null): string => {
      if (!dest || !ratesData) return '—';
      const code = getCurrencyCode(dest);
      if (!code || code === 'USD') return '1.00 USD';
      const rate = ratesData.rates[code];
      if (rate == null) return '—';
      return `1 USD = ${rate.toFixed(2)} ${code}`;
    },
    [],
  );

  const leftRate = getRate(leftDest, leftData.rates);
  const rightRate = getRate(rightDest, rightData.rates);

  // Sonar vibe summary
  const leftVibe = leftSonar.data?.answer ?? (leftSonar.isLoading ? 'Loading...' : '—');
  const rightVibe = rightSonar.data?.answer ?? (rightSonar.isLoading ? 'Loading...' : '—');

  const rows = useMemo(
    () => [
      {
        label: t('compare.weather', { defaultValue: 'Weather' }),
        leftValue: leftData.weather
          ? `${leftData.weather.temp}°C · ${leftData.weather.condition}`
          : leftDest ? '—' : '',
        rightValue: rightData.weather
          ? `${rightData.weather.temp}°C · ${rightData.weather.condition}`
          : rightDest ? '—' : '',
        winner: tempWinner,
        loading: isLoading,
      },
      {
        label: t('compare.dailyCost', { defaultValue: 'Daily Cost' }),
        leftValue: leftDailyCost != null ? `~$${leftDailyCost}/day` : leftDest ? '—' : '',
        rightValue: rightDailyCost != null ? `~$${rightDailyCost}/day` : rightDest ? '—' : '',
        winner: costWinner,
        loading: false,
      },
      {
        label: t('compare.safety', { defaultValue: 'Safety' }),
        leftValue:
          leftSafetyScore != null
            ? `${leftSafetyScore}/10`
            : leftData.safety?.label ?? (leftDest ? '—' : ''),
        rightValue:
          rightSafetyScore != null
            ? `${rightSafetyScore}/10`
            : rightData.safety?.label ?? (rightDest ? '—' : ''),
        winner: safetyWinner,
        loading: isLoading,
      },
      {
        label: t('compare.advisory', { defaultValue: 'Advisory' }),
        leftValue: leftData.safety?.label ?? (leftDest ? '—' : ''),
        rightValue: rightData.safety?.label ?? (rightDest ? '—' : ''),
        winner: advisoryWinner,
        loading: isLoading,
      },
      {
        label: t('compare.visa', { defaultValue: 'US Visa' }),
        leftValue: leftData.visa
          ? `${leftData.visa.status.replace(/-/g, ' ')} · ${leftData.visa.maxStay}d`
          : leftDest ? '—' : '',
        rightValue: rightData.visa
          ? `${rightData.visa.status.replace(/-/g, ' ')} · ${rightData.visa.maxStay}d`
          : rightDest ? '—' : '',
        winner: visaWinner,
        loading: false,
      },
      {
        label: t('compare.currency', { defaultValue: 'Exchange' }),
        leftValue: leftDest ? leftRate : '',
        rightValue: rightDest ? rightRate : '',
        winner: 'tie' as Side,
        loading: isLoading,
      },
      {
        label: t('compare.vibe', { defaultValue: 'Vibe' }),
        leftValue: leftDest ? leftVibe : '',
        rightValue: rightDest ? rightVibe : '',
        winner: 'tie' as Side,
        loading: leftSonar.isLoading || rightSonar.isLoading,
      },
    ],
    [
      t,
      leftData,
      rightData,
      leftDest,
      rightDest,
      leftDailyCost,
      rightDailyCost,
      leftSafetyScore,
      rightSafetyScore,
      leftRate,
      rightRate,
      leftVibe,
      rightVibe,
      tempWinner,
      costWinner,
      safetyWinner,
      advisoryWinner,
      visaWinner,
      isLoading,
      leftSonar.isLoading,
      rightSonar.isLoading,
    ],
  );

  return (
    <View style={[styles.container, { paddingTop: insets.top }]}>
      {/* Header */}
      <View style={styles.header}>
        <Pressable
          onPress={() => {
            Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
            router.back();
          }}
          style={styles.backBtn}
          accessibilityRole="button"
          accessibilityLabel={t('common.back', { defaultValue: 'Back' })}
        >
          <ArrowLeft size={20} color={COLORS.cream} strokeWidth={1.5} />
        </Pressable>

        <View style={styles.headerCenter}>
          <GitCompare size={16} color={COLORS.sage} strokeWidth={1.5} />
          <Text style={styles.headerTitle}>
            {t('compare.title', { defaultValue: 'Compare' })}
          </Text>
        </View>

        <View style={styles.headerSpacer} />
      </View>

      <ScrollView
        showsVerticalScrollIndicator={false}
        contentContainerStyle={[
          styles.scrollContent,
          { paddingBottom: insets.bottom + SPACING.xxl },
        ]}
        keyboardDismissMode="on-drag"
      >
        {/* Destination Inputs */}
        <View style={styles.inputRow}>
          <View style={styles.inputWrap}>
            <TextInput
              style={styles.input}
              value={leftInput}
              onChangeText={setLeftInput}
              onSubmitEditing={handleSubmitLeft}
              placeholder={t('compare.destPlaceholder', { defaultValue: 'Tokyo' })}
              placeholderTextColor={COLORS.muted}
              returnKeyType="search"
              autoCapitalize="words"
              autoCorrect={false}
              accessibilityLabel={t('compare.leftDest', { defaultValue: 'Left destination' })}
            />
          </View>

          <View style={styles.inputVs}>
            <Text style={styles.vsText}>vs</Text>
          </View>

          <View style={styles.inputWrap}>
            <TextInput
              style={styles.input}
              value={rightInput}
              onChangeText={setRightInput}
              onSubmitEditing={handleSubmitRight}
              placeholder={t('compare.destPlaceholder', { defaultValue: 'Seoul' })}
              placeholderTextColor={COLORS.muted}
              returnKeyType="search"
              autoCapitalize="words"
              autoCorrect={false}
              accessibilityLabel={t('compare.rightDest', { defaultValue: 'Right destination' })}
            />
          </View>
        </View>

        {/* Search buttons if inputs not applied yet */}
        {(leftInput.trim() !== (leftDest ?? '') ||
          rightInput.trim() !== (rightDest ?? '')) && (
          <View style={styles.applyRow}>
            <Pressable
              onPress={() => {
                Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
                handleSubmitLeft();
                handleSubmitRight();
              }}
              style={({ pressed }) => [
                styles.applyBtn,
                { opacity: pressed ? 0.8 : 1 },
              ]}
              accessibilityRole="button"
            >
              <Text style={styles.applyBtnText}>
                {t('compare.compare', { defaultValue: 'Compare' })}
              </Text>
            </Pressable>
          </View>
        )}

        {/* Destination name headers */}
        {bothSelected && (
          <View style={styles.destHeaders}>
            <Text style={styles.destHeaderText} numberOfLines={1}>
              {leftDest}
            </Text>
            <Text style={styles.destHeaderSep}>·</Text>
            <Text style={styles.destHeaderText} numberOfLines={1}>
              {rightDest}
            </Text>
          </View>
        )}

        {/* Loading indicator */}
        {isLoading && bothSelected && (
          <View style={styles.loadingBar}>
            <ActivityIndicator size="small" color={COLORS.sage} />
            <Text style={styles.loadingText}>
              {t('compare.loading', { defaultValue: 'Fetching live data...' })}
            </Text>
          </View>
        )}

        {/* Comparison table */}
        {bothSelected && (
          <View style={styles.table}>
            {rows.map((row, i) =>
              row.loading && !row.leftValue && !row.rightValue ? (
                <SkeletonRow key={row.label} label={row.label} />
              ) : (
                <ComparisonRow
                  key={row.label}
                  label={row.label}
                  leftValue={row.leftValue}
                  rightValue={row.rightValue}
                  winner={row.winner}
                  isLast={i === rows.length - 1}
                />
              ),
            )}
          </View>
        )}

        {/* Empty state */}
        {!bothSelected && (
          <View style={styles.emptyState}>
            <GitCompare size={40} color={COLORS.muted} strokeWidth={1} />
            <Text style={styles.emptyTitle}>
              {t('compare.emptyTitle', { defaultValue: 'Pick two destinations' })}
            </Text>
            <Text style={styles.emptySubtitle}>
              {t('compare.emptySubtitle', {
                defaultValue: 'Enter destinations above to compare weather, cost, safety, and more.',
              })}
            </Text>
          </View>
        )}

        {/* CTA buttons */}
        {bothSelected && (
          <View style={styles.ctaRow}>
            <Pressable
              onPress={handlePlanLeft}
              style={({ pressed }) => [
                styles.ctaBtn,
                { opacity: pressed ? 0.85 : 1 },
              ]}
              accessibilityRole="button"
            >
              <Text style={styles.ctaBtnText} numberOfLines={1}>
                {t('compare.plan', { defaultValue: 'Plan' })} {leftDest}
              </Text>
            </Pressable>

            <Pressable
              onPress={handlePlanRight}
              style={({ pressed }) => [
                styles.ctaBtn,
                styles.ctaBtnRight,
                { opacity: pressed ? 0.85 : 1 },
              ]}
              accessibilityRole="button"
            >
              <Text style={styles.ctaBtnText} numberOfLines={1}>
                {t('compare.plan', { defaultValue: 'Plan' })} {rightDest}
              </Text>
            </Pressable>
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
    width: 36,
    height: 36,
    alignItems: 'center',
    justifyContent: 'center',
  } as ViewStyle,

  headerCenter: {
    flex: 1,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: SPACING.xs,
  } as ViewStyle,

  headerTitle: {
    fontFamily: FONTS.header,
    fontSize: 17,
    color: COLORS.cream,
    letterSpacing: 0.2,
  } as TextStyle,

  headerSpacer: {
    width: 36,
  } as ViewStyle,

  // ── Scroll ──
  scrollContent: {
    paddingTop: SPACING.lg,
  } as ViewStyle,

  // ── Inputs ──
  inputRow: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: SPACING.md,
    gap: SPACING.sm,
    marginBottom: SPACING.md,
  } as ViewStyle,

  inputWrap: {
    flex: 1,
  } as ViewStyle,

  input: {
    fontFamily: FONTS.bodyMedium,
    fontSize: 15,
    color: COLORS.cream,
    backgroundColor: COLORS.surface1,
    borderRadius: RADIUS.md,
    borderWidth: 1,
    borderColor: COLORS.sageBorder,
    paddingHorizontal: SPACING.md,
    paddingVertical: SPACING.sm + 2,
  } as TextStyle,

  inputVs: {
    alignItems: 'center',
    justifyContent: 'center',
    paddingHorizontal: SPACING.xs,
  } as ViewStyle,

  vsText: {
    fontFamily: FONTS.mono,
    fontSize: 12,
    color: COLORS.muted,
    letterSpacing: 0.5,
  } as TextStyle,

  // ── Apply button ──
  applyRow: {
    paddingHorizontal: SPACING.md,
    marginBottom: SPACING.md,
  } as ViewStyle,

  applyBtn: {
    backgroundColor: COLORS.sage,
    borderRadius: RADIUS.pill,
    paddingVertical: SPACING.sm + 2,
    alignItems: 'center',
    justifyContent: 'center',
  } as ViewStyle,

  applyBtnText: {
    fontFamily: FONTS.header,
    fontSize: 15,
    color: COLORS.bg,
    letterSpacing: 0.3,
  } as TextStyle,

  // ── Destination headers ──
  destHeaders: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: SPACING.md,
    marginBottom: SPACING.md,
    gap: SPACING.sm,
  } as ViewStyle,

  destHeaderText: {
    flex: 1,
    fontFamily: FONTS.header,
    fontSize: 18,
    color: COLORS.cream,
    textAlign: 'center',
  } as TextStyle,

  destHeaderSep: {
    fontFamily: FONTS.mono,
    fontSize: 14,
    color: COLORS.muted,
  } as TextStyle,

  // ── Loading bar ──
  loadingBar: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: SPACING.sm,
    paddingHorizontal: SPACING.md,
    marginBottom: SPACING.md,
  } as ViewStyle,

  loadingText: {
    fontFamily: FONTS.mono,
    fontSize: 12,
    color: COLORS.muted,
    letterSpacing: 0.3,
  } as TextStyle,

  // ── Comparison table ──
  table: {
    marginHorizontal: SPACING.md,
    backgroundColor: COLORS.surface1,
    borderRadius: RADIUS.md,
    borderWidth: 1,
    borderColor: COLORS.border,
    overflow: 'hidden',
    marginBottom: SPACING.lg,
  } as ViewStyle,

  row: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingVertical: SPACING.md,
    paddingHorizontal: SPACING.sm,
    borderBottomWidth: 1,
    borderBottomColor: COLORS.border,
    minHeight: 52,
  } as ViewStyle,

  rowLast: {
    borderBottomWidth: 0,
  } as ViewStyle,

  rowSide: {
    flex: 1,
    paddingHorizontal: SPACING.xs,
  } as ViewStyle,

  rowLabel: {
    width: 68,
    alignItems: 'center',
  } as ViewStyle,

  rowLabelText: {
    fontFamily: FONTS.mono,
    fontSize: 10,
    color: COLORS.muted,
    letterSpacing: 0.5,
    textAlign: 'center',
    textTransform: 'uppercase',
  } as TextStyle,

  rowValue: {
    fontFamily: FONTS.bodyMedium,
    fontSize: 13,
    color: COLORS.creamSoft,
    lineHeight: 18,
  } as TextStyle,

  rowValueRight: {
    textAlign: 'right',
  } as TextStyle,

  rowValueWinner: {
    color: COLORS.sage,
    fontFamily: FONTS.bodySemiBold,
  } as TextStyle,

  // ── Skeleton ──
  skeleton: {
    height: 14,
    borderRadius: RADIUS.sm,
    backgroundColor: COLORS.surface2,
    width: '70%',
  } as ViewStyle,

  // ── Empty state ──
  emptyState: {
    alignItems: 'center',
    justifyContent: 'center',
    paddingHorizontal: SPACING.xl,
    paddingVertical: SPACING.xxl,
    gap: SPACING.md,
  } as ViewStyle,

  emptyTitle: {
    fontFamily: FONTS.header,
    fontSize: 20,
    color: COLORS.cream,
    textAlign: 'center',
  } as TextStyle,

  emptySubtitle: {
    fontFamily: FONTS.body,
    fontSize: 14,
    color: COLORS.muted,
    textAlign: 'center',
    lineHeight: 22,
  } as TextStyle,

  // ── CTA buttons ──
  ctaRow: {
    flexDirection: 'row',
    gap: SPACING.sm,
    paddingHorizontal: SPACING.md,
    marginBottom: SPACING.md,
  } as ViewStyle,

  ctaBtn: {
    flex: 1,
    backgroundColor: COLORS.sage,
    borderRadius: RADIUS.pill,
    paddingVertical: SPACING.md,
    alignItems: 'center',
    justifyContent: 'center',
  } as ViewStyle,

  ctaBtnRight: {
    backgroundColor: COLORS.surface2,
    borderWidth: 1,
    borderColor: COLORS.sageBorder,
  } as ViewStyle,

  ctaBtnText: {
    fontFamily: FONTS.header,
    fontSize: 14,
    color: COLORS.cream,
    letterSpacing: 0.2,
  } as TextStyle,
});
