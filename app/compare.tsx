// =============================================================================
// ROAM — Destination Comparison Screen
// Route: /compare?a=Tokyo&b=Paris
// Side-by-side data table with winner highlighting per category.
// =============================================================================
import React, { useCallback, useEffect, useMemo, useState } from 'react';
import {
  ActivityIndicator,
  Image,
  Pressable,
  ScrollView,
  StyleSheet,
  Text,
  TextInput,
  View,
  type ImageStyle,
  type TextStyle,
  type ViewStyle,
} from 'react-native';
import { useLocalSearchParams, useRouter } from 'expo-router';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { ArrowLeft, ArrowLeftRight, BarChart2 } from 'lucide-react-native';
import { useTranslation } from 'react-i18next';
import * as Haptics from '../lib/haptics';
import { COLORS, FONTS, SPACING, RADIUS } from '../lib/constants';
import {
  getComparisonData,
  compareDestinations,
  type ComparisonData,
  type ComparisonResult,
  type CategoryWinner,
} from '../lib/destination-compare';
import PressableScale from '../components/ui/PressableScale';

// ---------------------------------------------------------------------------
// Thumbnail header — destination name + Unsplash photo
// ---------------------------------------------------------------------------

function DestinationThumb({
  data,
  placeholder,
}: {
  data: ComparisonData | null;
  placeholder: string;
}) {
  const name = data?.destination ?? placeholder;
  return (
    <View style={th.root}>
      {data?.photoUrl ? (
        <Image
          source={{ uri: data.photoUrl }}
          style={th.image}
          resizeMode="cover"
        />
      ) : (
        <View style={th.imagePlaceholder} />
      )}
      <View style={th.overlay} />
      <Text style={th.label} numberOfLines={1}>
        {name}
      </Text>
    </View>
  );
}

const th = StyleSheet.create({
  root: {
    flex: 1,
    height: 96,
    borderRadius: RADIUS.md,
    overflow: 'hidden',
    backgroundColor: COLORS.surface2,
  } as ViewStyle,
  image: { position: 'absolute', top: 0, left: 0, right: 0, bottom: 0, width: '100%', height: '100%' } as ImageStyle,
  imagePlaceholder: {
    position: 'absolute',
    top: 0,
    left: 0,
    right: 0,
    bottom: 0,
    backgroundColor: COLORS.surface2,
  } as ViewStyle,
  overlay: {
    position: 'absolute',
    bottom: 0,
    left: 0,
    right: 0,
    height: 48,
    backgroundColor: COLORS.overlayDark,
  } as ViewStyle,
  label: {
    position: 'absolute',
    bottom: 8,
    left: 8,
    right: 8,
    fontFamily: FONTS.header,
    fontSize: 14,
    color: COLORS.white,
  } as TextStyle,
});

// ---------------------------------------------------------------------------
// Comparison row — left value | category label | right value
// ---------------------------------------------------------------------------

function CompareRow({
  label,
  cat,
}: {
  label: string;
  cat: CategoryWinner;
}) {
  const aWinner = cat.winner === 'a';
  const bWinner = cat.winner === 'b';

  return (
    <View style={row.root}>
      {/* Left value */}
      <View style={[row.side, row.leftSide]}>
        <Text
          style={[row.value, aWinner && row.winValue]}
          numberOfLines={2}
          adjustsFontSizeToFit
        >
          {cat.aValue}
        </Text>
        {aWinner && cat.pctDiff != null && cat.pctDiff > 0 && (
          <Text style={row.badge}>{cat.pctDiff}% better</Text>
        )}
      </View>

      {/* Center label */}
      <View style={row.center}>
        <Text style={row.label}>{label}</Text>
      </View>

      {/* Right value */}
      <View style={[row.side, row.rightSide]}>
        <Text
          style={[row.value, bWinner && row.winValue]}
          numberOfLines={2}
          adjustsFontSizeToFit
        >
          {cat.bValue}
        </Text>
        {bWinner && cat.pctDiff != null && cat.pctDiff > 0 && (
          <Text style={row.badge}>{cat.pctDiff}% better</Text>
        )}
      </View>
    </View>
  );
}

const row = StyleSheet.create({
  root: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingVertical: SPACING.sm + 2,
    borderBottomWidth: 1,
    borderBottomColor: COLORS.border,
  } as ViewStyle,
  side: { flex: 2, gap: 2 } as ViewStyle,
  leftSide: { alignItems: 'flex-start' } as ViewStyle,
  rightSide: { alignItems: 'flex-end' } as ViewStyle,
  center: {
    flex: 1,
    alignItems: 'center',
    paddingHorizontal: SPACING.xs,
  } as ViewStyle,
  label: {
    fontFamily: FONTS.body,
    fontSize: 11,
    color: COLORS.muted,
    textAlign: 'center',
  } as TextStyle,
  value: {
    fontFamily: FONTS.mono,
    fontSize: 15,
    color: COLORS.creamDim,
  } as TextStyle,
  winValue: {
    color: COLORS.sage,
    fontFamily: FONTS.monoMedium,
  } as TextStyle,
  badge: {
    fontFamily: FONTS.mono,
    fontSize: 10,
    color: COLORS.sage,
  } as TextStyle,
});

// ---------------------------------------------------------------------------
// Tip row — full-width, each destination's tip side by side
// ---------------------------------------------------------------------------

function TipRow({ cat }: { cat: CategoryWinner }) {
  return (
    <View style={tip.root}>
      <View style={[tip.col, { borderRightWidth: 1, borderRightColor: COLORS.border }]}>
        <Text style={tip.label}>
          {t_static('compare.localTip', 'Local tip')}
        </Text>
        <Text style={tip.text}>{cat.aValue}</Text>
      </View>
      <View style={tip.col}>
        <Text style={tip.label}>
          {t_static('compare.localTip', 'Local tip')}
        </Text>
        <Text style={tip.text}>{cat.bValue}</Text>
      </View>
    </View>
  );
}

// Simple static t() outside components for style-layer strings
function t_static(_key: string, fallback: string): string {
  return fallback;
}

const tip = StyleSheet.create({
  root: {
    flexDirection: 'row',
    marginTop: SPACING.md,
    backgroundColor: COLORS.surface1,
    borderRadius: RADIUS.md,
    borderWidth: 1,
    borderColor: COLORS.border,
    overflow: 'hidden',
  } as ViewStyle,
  col: {
    flex: 1,
    padding: SPACING.md,
    gap: SPACING.xs,
  } as ViewStyle,
  label: {
    fontFamily: FONTS.mono,
    fontSize: 10,
    color: COLORS.muted,
    textTransform: 'uppercase',
    letterSpacing: 0.5,
  } as TextStyle,
  text: {
    fontFamily: FONTS.body,
    fontSize: 13,
    color: COLORS.creamDim,
    lineHeight: 19,
  } as TextStyle,
});

// ---------------------------------------------------------------------------
// ROAM Score badges side by side
// ---------------------------------------------------------------------------

function ScoreBadges({
  a,
  b,
  cat,
}: {
  a: ComparisonData;
  b: ComparisonData;
  cat: CategoryWinner;
}) {
  return (
    <View style={sb.root}>
      <ScoreBadge
        value={a.roamScore}
        label={a.destination}
        winner={cat.winner === 'a'}
      />
      <View style={sb.divider} />
      <ScoreBadge
        value={b.roamScore}
        label={b.destination}
        winner={cat.winner === 'b'}
      />
    </View>
  );
}

function ScoreBadge({
  value,
  label,
  winner,
}: {
  value: number;
  label: string;
  winner: boolean;
}) {
  const color = winner ? COLORS.sage : COLORS.muted;
  return (
    <View style={sb.badge}>
      <View
        style={[
          sb.circle,
          winner && { borderColor: COLORS.sage, backgroundColor: COLORS.sageSubtle },
        ]}
      >
        <Text style={[sb.scoreNum, { color }]}>{value}</Text>
      </View>
      <Text style={[sb.destLabel, { color }]} numberOfLines={1}>
        {label}
      </Text>
    </View>
  );
}

const sb = StyleSheet.create({
  root: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: SPACING.xl,
    paddingVertical: SPACING.md,
  } as ViewStyle,
  badge: { alignItems: 'center', gap: SPACING.xs } as ViewStyle,
  circle: {
    width: 72,
    height: 72,
    borderRadius: 36,
    borderWidth: 2,
    borderColor: COLORS.border,
    alignItems: 'center',
    justifyContent: 'center',
  } as ViewStyle,
  divider: {
    width: 1,
    height: 32,
    backgroundColor: COLORS.border,
  } as ViewStyle,
  scoreNum: {
    fontFamily: FONTS.mono,
    fontSize: 22,
    fontWeight: '700',
  } as TextStyle,
  destLabel: {
    fontFamily: FONTS.body,
    fontSize: 12,
    maxWidth: 80,
    textAlign: 'center',
  } as TextStyle,
});

// ---------------------------------------------------------------------------
// Main screen
// ---------------------------------------------------------------------------

export default function CompareScreen() {
  const router = useRouter();
  const insets = useSafeAreaInsets();
  const { t } = useTranslation();
  const params = useLocalSearchParams<{ a?: string; b?: string; left?: string; right?: string }>();

  // Support both ?a=Tokyo&b=Paris and legacy ?left=Tokyo&right=Paris
  const [inputA, setInputA] = useState(params.a ?? params.left ?? '');
  const [inputB, setInputB] = useState(params.b ?? params.right ?? '');
  const [result, setResult] = useState<ComparisonResult | null>(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const aData: ComparisonData | null = useMemo(
    () => (result ? result.a : null),
    [result],
  );
  const bData: ComparisonData | null = useMemo(
    () => (result ? result.b : null),
    [result],
  );

  const handleCompare = useCallback(async () => {
    const nameA = inputA.trim();
    const nameB = inputB.trim();
    if (!nameA || !nameB) return;

    Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Medium);
    setLoading(true);
    setError(null);

    try {
      const snapA = getComparisonData(nameA);
      const snapB = getComparisonData(nameB);
      const res = compareDestinations(snapA, snapB);
      setResult(res);
    } catch (err) {
      const msg = err instanceof Error ? err.message : 'Could not compare destinations.';
      setError(msg);
    } finally {
      setLoading(false);
    }
  }, [inputA, inputB]);

  const handleSwap = useCallback(() => {
    Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
    setInputA(inputB);
    setInputB(inputA);
    setResult(null);
  }, [inputA, inputB]);

  // Auto-compare when params are pre-filled
  useEffect(() => {
    const nameA = (params.a ?? params.left ?? '').trim();
    const nameB = (params.b ?? params.right ?? '').trim();
    if (nameA && nameB) {
      handleCompare();
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  return (
    <View style={[s.container, { paddingTop: insets.top }]}>
      {/* Header */}
      <View style={s.header}>
        <Pressable
          onPress={() => {
            Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
            router.back();
          }}
          style={s.backBtn}
          accessibilityRole="button"
          accessibilityLabel={t('common.back', { defaultValue: 'Back' })}
        >
          <ArrowLeft size={20} color={COLORS.cream} strokeWidth={1.5} />
        </Pressable>
        <Text style={s.headerTitle}>
          {t('compare.title', { defaultValue: 'Compare' })}
        </Text>
        <View style={{ width: 36 }} />
      </View>

      <ScrollView
        showsVerticalScrollIndicator={false}
        keyboardDismissMode="on-drag"
        contentContainerStyle={{ paddingBottom: insets.bottom + 80 }}
      >
        {/* Input row */}
        <View style={s.inputSection}>
          <View style={s.inputRow}>
            <TextInput
              style={s.input}
              value={inputA}
              onChangeText={setInputA}
              placeholder="Tokyo"
              placeholderTextColor={COLORS.muted}
              returnKeyType="done"
              autoCapitalize="words"
              accessibilityLabel={t('compare.destinationA', { defaultValue: 'First destination' })}
            />
            <PressableScale
              onPress={handleSwap}
              style={s.swapBtn}
              accessibilityRole="button"
              accessibilityLabel={t('compare.swap', { defaultValue: 'Swap destinations' })}
            >
              <ArrowLeftRight size={16} color={COLORS.sage} strokeWidth={1.5} />
            </PressableScale>
            <TextInput
              style={s.input}
              value={inputB}
              onChangeText={setInputB}
              placeholder="Paris"
              placeholderTextColor={COLORS.muted}
              returnKeyType="done"
              autoCapitalize="words"
              accessibilityLabel={t('compare.destinationB', { defaultValue: 'Second destination' })}
            />
          </View>

          <PressableScale onPress={handleCompare} style={s.compareBtn}>
            <BarChart2 size={16} color={COLORS.bg} strokeWidth={1.5} />
            <Text style={s.compareBtnText}>
              {t('compare.compare', { defaultValue: 'Compare' })}
            </Text>
          </PressableScale>
        </View>

        {/* Loading */}
        {loading && (
          <View style={s.loadingRow}>
            <ActivityIndicator size="small" color={COLORS.sage} />
            <Text style={s.loadingText}>
              {t('compare.loading', { defaultValue: 'Comparing...' })}
            </Text>
          </View>
        )}

        {/* Error */}
        {error && !loading && (
          <View style={s.errorRow}>
            <Text style={s.errorText}>{error}</Text>
          </View>
        )}

        {/* Results */}
        {result && !loading && (
          <View style={s.resultsContainer}>
            {/* Destination thumbnails */}
            <View style={s.thumbRow}>
              <DestinationThumb data={aData} placeholder={inputA} />
              <View style={s.thumbDivider}>
                <Text style={s.vsText}>vs</Text>
              </View>
              <DestinationThumb data={bData} placeholder={inputB} />
            </View>

            {/* Comparison table */}
            <View style={s.tableCard}>
              <CompareRow
                label={t('compare.dailyCost', { defaultValue: 'Daily Cost' })}
                cat={result.categories.cost}
              />
              <CompareRow
                label={t('compare.safety', { defaultValue: 'Safety' })}
                cat={result.categories.safety}
              />
              <CompareRow
                label={t('compare.weather', { defaultValue: 'Avg Temp' })}
                cat={result.categories.avgTemp}
              />
              <CompareRow
                label={t('compare.bestMonth', { defaultValue: 'Best Month' })}
                cat={result.categories.bestMonth}
              />
              {/* Last row — no bottom border */}
              <View
                style={[
                  row.root,
                  { borderBottomWidth: 0, paddingBottom: 0 },
                ]}
              >
                <View style={[row.side, row.leftSide]}>
                  <Text
                    style={[
                      row.value,
                      result.categories.roamScore.winner === 'a' && row.winValue,
                    ]}
                  >
                    {result.categories.roamScore.aValue}
                  </Text>
                </View>
                <View style={row.center}>
                  <Text style={row.label}>
                    {t('compare.roamScore', { defaultValue: 'ROAM Score' })}
                  </Text>
                </View>
                <View style={[row.side, row.rightSide]}>
                  <Text
                    style={[
                      row.value,
                      result.categories.roamScore.winner === 'b' && row.winValue,
                    ]}
                  >
                    {result.categories.roamScore.bValue}
                  </Text>
                </View>
              </View>
            </View>

            {/* ROAM Score badges */}
            {aData && bData && (
              <ScoreBadges
                a={aData}
                b={bData}
                cat={result.categories.roamScore}
              />
            )}

            {/* Top tips */}
            <TipRow cat={result.categories.topTip} />

            {/* Verdict pill */}
            <View style={s.verdictRow}>
              {result.winnerName ? (
                <View style={s.verdictPill}>
                  <Text style={s.verdictText}>
                    {result.winnerName}
                    {t('compare.wins', { defaultValue: ' wins ' })}
                    {result.aWins > result.bWins ? result.aWins : result.bWins}
                    {t('compare.of', { defaultValue: '/' })}
                    {result.totalCategories}
                    {t('compare.categories', { defaultValue: ' categories' })}
                  </Text>
                </View>
              ) : (
                <View style={s.verdictPillTie}>
                  <Text style={s.verdictTextTie}>
                    {t('compare.tied', { defaultValue: 'Tied — both great choices' })}
                  </Text>
                </View>
              )}
            </View>

            {/* CTA */}
            {result.winnerName && (
              <PressableScale
                onPress={() => {
                  Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Medium);
                  router.push(`/(tabs)/plan` as never);
                }}
                style={s.ctaBtn}
              >
                <Text style={s.ctaBtnText}>
                  {t('compare.planWinner', { defaultValue: 'Plan' })}{' '}
                  {result.winnerName}
                </Text>
              </PressableScale>
            )}
          </View>
        )}

        {/* Empty state */}
        {!result && !loading && !error && (
          <View style={s.emptyState}>
            <Text style={s.emptyTitle}>
              {t('compare.emptyTitle', { defaultValue: 'Pick two destinations' })}
            </Text>
            <Text style={s.emptySubtitle}>
              {t('compare.emptySubtitle', {
                defaultValue:
                  'Enter any two cities above to compare cost, safety, ROAM score, and more.',
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

const s = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: COLORS.bg,
  } as ViewStyle,

  // Header
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
  headerTitle: {
    flex: 1,
    textAlign: 'center',
    fontFamily: FONTS.header,
    fontSize: 20,
    color: COLORS.cream,
  } as TextStyle,

  // Inputs
  inputSection: {
    paddingHorizontal: SPACING.md,
    paddingTop: SPACING.lg,
    gap: SPACING.sm,
  } as ViewStyle,
  inputRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: SPACING.sm,
  } as ViewStyle,
  input: {
    flex: 1,
    fontFamily: FONTS.bodyMedium,
    fontSize: 15,
    color: COLORS.cream,
    backgroundColor: COLORS.surface1,
    borderRadius: RADIUS.pill,
    borderWidth: 1,
    borderColor: COLORS.sageBorder,
    paddingHorizontal: SPACING.md,
    paddingVertical: SPACING.sm + 2,
  } as TextStyle,
  swapBtn: {
    width: 36,
    height: 36,
    borderRadius: RADIUS.pill,
    backgroundColor: COLORS.surface2,
    alignItems: 'center',
    justifyContent: 'center',
  } as ViewStyle,
  compareBtn: {
    flexDirection: 'row',
    backgroundColor: COLORS.sage,
    borderRadius: RADIUS.pill,
    paddingVertical: SPACING.sm + 4,
    alignItems: 'center',
    justifyContent: 'center',
    gap: SPACING.xs,
  } as ViewStyle,
  compareBtnText: {
    fontFamily: FONTS.header,
    fontSize: 15,
    color: COLORS.bg,
  } as TextStyle,

  // Loading / error
  loadingRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: SPACING.sm,
    paddingVertical: SPACING.lg,
  } as ViewStyle,
  loadingText: {
    fontFamily: FONTS.mono,
    fontSize: 12,
    color: COLORS.muted,
  } as TextStyle,
  errorRow: {
    marginHorizontal: SPACING.md,
    marginTop: SPACING.md,
    padding: SPACING.md,
    backgroundColor: COLORS.coralSubtle,
    borderRadius: RADIUS.md,
    borderWidth: 1,
    borderColor: COLORS.coralBorder,
  } as ViewStyle,
  errorText: {
    fontFamily: FONTS.body,
    fontSize: 13,
    color: COLORS.coral,
    textAlign: 'center',
  } as TextStyle,

  // Results
  resultsContainer: {
    paddingHorizontal: SPACING.md,
    paddingTop: SPACING.lg,
    gap: SPACING.md,
  } as ViewStyle,

  // Thumbnails
  thumbRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: SPACING.sm,
  } as ViewStyle,
  thumbDivider: {
    alignItems: 'center',
    justifyContent: 'center',
    width: 28,
  } as ViewStyle,
  vsText: {
    fontFamily: FONTS.mono,
    fontSize: 12,
    color: COLORS.muted,
  } as TextStyle,

  // Comparison table card
  tableCard: {
    backgroundColor: COLORS.surface1,
    borderRadius: RADIUS.md,
    borderWidth: 1,
    borderColor: COLORS.border,
    paddingHorizontal: SPACING.md,
    paddingTop: SPACING.sm,
    paddingBottom: SPACING.md,
  } as ViewStyle,

  // Verdict
  verdictRow: {
    alignItems: 'center',
  } as ViewStyle,
  verdictPill: {
    backgroundColor: COLORS.sageSubtle,
    borderRadius: RADIUS.pill,
    borderWidth: 1,
    borderColor: COLORS.sageBorder,
    paddingHorizontal: SPACING.lg,
    paddingVertical: SPACING.sm,
  } as ViewStyle,
  verdictText: {
    fontFamily: FONTS.header,
    fontSize: 14,
    color: COLORS.sage,
    textAlign: 'center',
  } as TextStyle,
  verdictPillTie: {
    backgroundColor: COLORS.surface2,
    borderRadius: RADIUS.pill,
    borderWidth: 1,
    borderColor: COLORS.border,
    paddingHorizontal: SPACING.lg,
    paddingVertical: SPACING.sm,
  } as ViewStyle,
  verdictTextTie: {
    fontFamily: FONTS.header,
    fontSize: 14,
    color: COLORS.muted,
    textAlign: 'center',
  } as TextStyle,

  // CTA
  ctaBtn: {
    backgroundColor: COLORS.sage,
    borderRadius: RADIUS.pill,
    paddingVertical: SPACING.md,
    alignItems: 'center',
  } as ViewStyle,
  ctaBtnText: {
    fontFamily: FONTS.header,
    fontSize: 15,
    color: COLORS.bg,
  } as TextStyle,

  // Empty state
  emptyState: {
    alignItems: 'center',
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
});
