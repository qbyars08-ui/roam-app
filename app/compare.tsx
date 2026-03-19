// =============================================================================
// ROAM — Destination Comparison Screen (Comprehensive)
// Side-by-side visual comparison across weather, cost, safety, flights,
// visa, best time, and vibe match. Supports 2–3 destinations.
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
import { ArrowLeft, ArrowLeftRight, Plus } from 'lucide-react-native';
import { useTranslation } from 'react-i18next';
import * as Haptics from '../lib/haptics';
import {
  COLORS,
  DESTINATIONS,
  HIDDEN_DESTINATIONS,
  FONTS,
  SPACING,
  RADIUS,
} from '../lib/constants';
import { useAppStore } from '../lib/store';
import {
  compareDestinations,
  type ComparisonResult,
  type DestinationSnapshot,
} from '../lib/compare-engine';

// ---------------------------------------------------------------------------
// Constants
// ---------------------------------------------------------------------------

const ALL_DESTS = [...DESTINATIONS, ...HIDDEN_DESTINATIONS];
const MONTH_LABELS = ['Jan','Feb','Mar','Apr','May','Jun','Jul','Aug','Sep','Oct','Nov','Dec'];
const BAR_MAX_HEIGHT = 48;
const BAR_WIDTH = 6;

// ---------------------------------------------------------------------------
// Tiny visual components
// ---------------------------------------------------------------------------

function TempBar({ high, low, maxRange }: { high: number; low: number; maxRange: number }) {
  const height = maxRange > 0 ? Math.max(8, (high / maxRange) * BAR_MAX_HEIGHT) : 12;
  return (
    <View style={{ alignItems: 'center', gap: 4 }}>
      <Text style={s.monoSm}>{Math.round(high)}°</Text>
      <View style={[s.barSage, { height }]} />
      <Text style={[s.monoSm, { color: COLORS.muted }]}>{Math.round(low)}°</Text>
    </View>
  );
}

function RainBar({ pct }: { pct: number }) {
  const height = Math.max(4, (pct / 100) * BAR_MAX_HEIGHT);
  return (
    <View style={{ alignItems: 'center', gap: 4 }}>
      <View style={[s.barBlue, { height }]} />
      <Text style={s.monoSm}>{pct}%</Text>
    </View>
  );
}

function CostBar({ value, maxValue, label, symbol }: { value: string; maxValue: number; label: string; symbol: string }) {
  const num = parseFloat(value.replace(/[^0-9.]/g, '')) || 0;
  const width = maxValue > 0 ? Math.max(20, (num / maxValue) * 120) : 40;
  return (
    <View style={{ gap: 2 }}>
      <Text style={s.monoXs}>{label}</Text>
      <View style={{ flexDirection: 'row', alignItems: 'center', gap: 4 }}>
        <View style={[s.costBarFill, { width }]} />
        <Text style={s.monoSm}>{symbol}{value}</Text>
      </View>
    </View>
  );
}

function SafetyBadge({ score }: { score: number }) {
  const color = score >= 8 ? COLORS.sage : score >= 6 ? COLORS.gold : COLORS.coral;
  const label = score >= 8 ? 'Safe' : score >= 6 ? 'Moderate' : 'Caution';
  return (
    <View style={{ alignItems: 'center', gap: 4 }}>
      <Text style={[s.safetyScore, { color }]}>{score}</Text>
      <Text style={[s.monoXs, { color }]}>{label}</Text>
    </View>
  );
}

function VisaBadge({ status }: { status: string }) {
  const isVisaFree = status.includes('free');
  const isEvisa = status.includes('e-visa') || status.includes('eVisa');
  const bg = isVisaFree ? COLORS.sageSubtle : isEvisa ? COLORS.goldSubtle : COLORS.coralSubtle;
  const color = isVisaFree ? COLORS.sage : isEvisa ? COLORS.gold : COLORS.coral;
  const label = isVisaFree ? 'Visa Free' : isEvisa ? 'eVisa' : 'Visa Required';
  return (
    <View style={[s.visaPill, { backgroundColor: bg }]}>
      <Text style={[s.visaPillText, { color }]}>{label}</Text>
    </View>
  );
}

function MonthPills({ bestMonths }: { bestMonths: number[] }) {
  return (
    <View style={s.monthRow}>
      {MONTH_LABELS.map((m, i) => {
        const isBest = bestMonths.includes(i + 1);
        return (
          <View key={m} style={[s.monthPill, isBest && s.monthPillActive]}>
            <Text style={[s.monthPillText, isBest && s.monthPillTextActive]}>
              {m}
            </Text>
          </View>
        );
      })}
    </View>
  );
}

// ---------------------------------------------------------------------------
// Section wrapper
// ---------------------------------------------------------------------------

function Section({ title, children }: { title: string; children: React.ReactNode }) {
  return (
    <View style={s.section}>
      <Text style={s.sectionTitle}>{title}</Text>
      <View style={s.sectionBody}>{children}</View>
    </View>
  );
}

function Column({ children, flex = 1 }: { children: React.ReactNode; flex?: number }) {
  return <View style={{ flex, alignItems: 'center' }}>{children}</View>;
}

// ---------------------------------------------------------------------------
// Main Screen
// ---------------------------------------------------------------------------

export default function CompareScreen() {
  const router = useRouter();
  const insets = useSafeAreaInsets();
  const { t } = useTranslation();
  const params = useLocalSearchParams<{ left?: string; right?: string; third?: string }>();
  const profile = useAppStore((st) => st.travelProfile);

  const [inputs, setInputs] = useState<string[]>([
    params.left ?? '',
    params.right ?? '',
    ...(params.third ? [params.third] : []),
  ]);
  const [result, setResult] = useState<ComparisonResult | null>(null);
  const [loading, setLoading] = useState(false);
  const [showThird, setShowThird] = useState(!!params.third);

  const destCount = showThird ? 3 : 2;

  const updateInput = useCallback((idx: number, val: string) => {
    setInputs((prev) => {
      const next = [...prev];
      next[idx] = val;
      return next;
    });
  }, []);

  const handleSwap = useCallback(() => {
    Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
    setInputs((prev) => [prev[1] ?? '', prev[0] ?? '', ...prev.slice(2)]);
  }, []);

  const handleCompare = useCallback(async () => {
    const names = inputs.slice(0, destCount).map((n) => n.trim()).filter(Boolean);
    if (names.length < 2) return;
    Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Medium);
    setLoading(true);
    try {
      const res = await compareDestinations(names, profile);
      setResult(res);
    } catch {
      // best-effort
    } finally {
      setLoading(false);
    }
  }, [inputs, destCount, profile]);

  // Auto-compare when arriving with pre-filled params
  useEffect(() => {
    if (params.left && params.right) {
      handleCompare();
    }
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  const snaps = result?.snapshots ?? [];
  const maxTemp = useMemo(
    () => Math.max(...snaps.map((s) => s.weather?.days[0]?.tempMax ?? 30)),
    [snaps],
  );

  return (
    <View style={[s.container, { paddingTop: insets.top }]}>
      {/* Header */}
      <View style={s.header}>
        <Pressable onPress={() => { Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light); router.back(); }} style={s.backBtn}>
          <ArrowLeft size={20} color={COLORS.cream} strokeWidth={1.5} />
        </Pressable>
        <Text style={s.headerTitle}>{t('compare.title', { defaultValue: 'Compare' })}</Text>
        <View style={{ width: 36 }} />
      </View>

      <ScrollView showsVerticalScrollIndicator={false} contentContainerStyle={{ paddingBottom: insets.bottom + 80 }} keyboardDismissMode="on-drag">
        {/* Destination inputs */}
        <View style={s.inputSection}>
          <View style={s.inputRow}>
            <TextInput style={s.input} value={inputs[0]} onChangeText={(v) => updateInput(0, v)} placeholder="Tokyo" placeholderTextColor={COLORS.muted} returnKeyType="done" autoCapitalize="words" />
            <Pressable onPress={handleSwap} style={s.swapBtn}>
              <ArrowLeftRight size={16} color={COLORS.sage} strokeWidth={1.5} />
            </Pressable>
            <TextInput style={s.input} value={inputs[1]} onChangeText={(v) => updateInput(1, v)} placeholder="Seoul" placeholderTextColor={COLORS.muted} returnKeyType="done" autoCapitalize="words" />
          </View>

          {showThird && (
            <TextInput style={[s.input, { marginTop: SPACING.sm }]} value={inputs[2] ?? ''} onChangeText={(v) => updateInput(2, v)} placeholder="Third destination" placeholderTextColor={COLORS.muted} returnKeyType="done" autoCapitalize="words" />
          )}

          {!showThird && (
            <Pressable onPress={() => { setShowThird(true); setInputs((p) => [...p, '']); }} style={s.addThird}>
              <Plus size={14} color={COLORS.sage} strokeWidth={1.5} />
              <Text style={s.addThirdText}>{t('compare.addThird', { defaultValue: 'Add third destination' })}</Text>
            </Pressable>
          )}

          <Pressable onPress={handleCompare} style={({ pressed }) => [s.compareBtn, { opacity: pressed ? 0.85 : 1 }]}>
            <Text style={s.compareBtnText}>{t('compare.compare', { defaultValue: 'Compare' })}</Text>
          </Pressable>
        </View>

        {loading && (
          <View style={s.loadingRow}>
            <ActivityIndicator size="small" color={COLORS.sage} />
            <Text style={s.loadingText}>{t('compare.loading', { defaultValue: 'Fetching live data...' })}</Text>
          </View>
        )}

        {snaps.length >= 2 && !loading && (
          <>
            {/* Destination name headers */}
            <View style={s.namesRow}>
              {snaps.map((sn) => (
                <Text key={sn.name} style={s.destName} numberOfLines={1}>{sn.name}</Text>
              ))}
            </View>

            {/* 1. Weather */}
            <Section title={t('compare.weather', { defaultValue: 'Weather' })}>
              <View style={s.columns}>
                {snaps.map((sn) => {
                  const d = sn.weather?.days[0];
                  return (
                    <Column key={sn.name}>
                      {d ? (
                        <View style={{ alignItems: 'center', gap: 6 }}>
                          <TempBar high={d.tempMax} low={d.tempMin} maxRange={maxTemp} />
                          <RainBar pct={d.precipitationChance} />
                        </View>
                      ) : (
                        <Text style={s.monoSm}>--</Text>
                      )}
                    </Column>
                  );
                })}
              </View>
            </Section>

            {/* 2. Cost */}
            <Section title={t('compare.dailyCost', { defaultValue: 'Daily Cost' })}>
              <View style={s.columns}>
                {snaps.map((sn) => {
                  const dailyCost = sn.dest?.dailyCost ?? 0;
                  const cheapest = Math.min(...snaps.map((x) => x.dest?.dailyCost ?? 999));
                  const isCheapest = dailyCost === cheapest && dailyCost > 0;
                  return (
                    <Column key={sn.name}>
                      <Text style={[s.costTotal, isCheapest && { color: COLORS.sage }]}>
                        ${dailyCost}
                      </Text>
                      <Text style={s.monoXs}>/day</Text>
                    </Column>
                  );
                })}
              </View>
            </Section>

            {/* 3. Safety */}
            <Section title={t('compare.safety', { defaultValue: 'Safety' })}>
              <View style={s.columns}>
                {snaps.map((sn) => (
                  <Column key={sn.name}>
                    {sn.dest ? (
                      <SafetyBadge score={sn.dest.safetyScore} />
                    ) : (
                      <Text style={s.monoSm}>--</Text>
                    )}
                  </Column>
                ))}
              </View>
            </Section>

            {/* 4. Flight price */}
            <Section title={t('compare.flights', { defaultValue: 'Flights' })}>
              <View style={s.columns}>
                {snaps.map((sn) => {
                  const cheapest = Math.min(
                    ...snaps.map((x) => x.flightEstimate ?? 9999),
                  );
                  const isCheapest = sn.flightEstimate === cheapest && sn.flightEstimate != null;
                  return (
                    <Column key={sn.name}>
                      <Text style={[s.flightPrice, isCheapest && { color: COLORS.sage }]}>
                        {sn.flightEstimate != null ? `From $${sn.flightEstimate}` : '--'}
                      </Text>
                    </Column>
                  );
                })}
              </View>
            </Section>

            {/* 5. Visa */}
            <Section title={t('compare.visa', { defaultValue: 'Visa (US)' })}>
              <View style={s.columns}>
                {snaps.map((sn) => (
                  <Column key={sn.name}>
                    {sn.visa ? (
                      <View style={{ alignItems: 'center', gap: 4 }}>
                        <VisaBadge status={sn.visa.status} />
                        <Text style={s.monoXs}>{sn.visa.maxStay}d stay</Text>
                      </View>
                    ) : (
                      <Text style={s.monoSm}>--</Text>
                    )}
                  </Column>
                ))}
              </View>
            </Section>

            {/* 6. Best time */}
            <Section title={t('compare.bestTime', { defaultValue: 'Best Time' })}>
              {snaps.map((sn) => (
                <View key={sn.name} style={{ marginBottom: SPACING.sm }}>
                  <Text style={[s.monoXs, { marginBottom: 4 }]}>{sn.name}</Text>
                  <MonthPills bestMonths={sn.dest?.bestMonths ?? []} />
                </View>
              ))}
            </Section>

            {/* 7. Vibe match */}
            <Section title={t('compare.vibeMatch', { defaultValue: 'Vibe Match' })}>
              <View style={s.columns}>
                {snaps.map((sn) => {
                  const best = Math.max(...snaps.map((x) => x.vibeMatch ?? 0));
                  const isBest = sn.vibeMatch === best && sn.vibeMatch != null;
                  return (
                    <Column key={sn.name}>
                      <Text style={[s.vibeScore, isBest && { color: COLORS.sage }]}>
                        {sn.vibeMatch ?? '--'}%
                      </Text>
                      <Text style={s.monoXs}>match</Text>
                    </Column>
                  );
                })}
              </View>
            </Section>

            {/* Winner banner */}
            {result?.winner && (
              <View style={s.winnerBanner}>
                <Text style={s.winnerText}>
                  {result.winner} wins {result.wins[result.winner]} of {result.totalCategories} categories
                </Text>
              </View>
            )}

            {/* CTA */}
            {result?.winner && (
              <Pressable
                onPress={() => {
                  Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Medium);
                  router.push('/(tabs)/plan' as never);
                }}
                style={({ pressed }) => [s.ctaBtn, { opacity: pressed ? 0.85 : 1 }]}
              >
                <Text style={s.ctaBtnText}>
                  {t('compare.plan', { defaultValue: 'Plan' })} {result.winner}
                </Text>
              </Pressable>
            )}
          </>
        )}

        {/* Empty state */}
        {snaps.length === 0 && !loading && (
          <View style={s.emptyState}>
            <Text style={s.emptyTitle}>{t('compare.emptyTitle', { defaultValue: 'Pick two destinations' })}</Text>
            <Text style={s.emptySubtitle}>
              {t('compare.emptySubtitle', { defaultValue: 'Enter destinations above to compare weather, cost, safety, and more.' })}
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
  container: { flex: 1, backgroundColor: COLORS.bg } as ViewStyle,

  // Header
  header: { flexDirection: 'row', alignItems: 'center', paddingHorizontal: SPACING.md, paddingVertical: SPACING.md, borderBottomWidth: 1, borderBottomColor: COLORS.border } as ViewStyle,
  backBtn: { width: 36, height: 36, alignItems: 'center', justifyContent: 'center' } as ViewStyle,
  headerTitle: { flex: 1, textAlign: 'center', fontFamily: FONTS.header, fontSize: 24, color: COLORS.cream } as TextStyle,

  // Inputs
  inputSection: { paddingHorizontal: SPACING.md, paddingTop: SPACING.lg, gap: SPACING.sm } as ViewStyle,
  inputRow: { flexDirection: 'row', alignItems: 'center', gap: SPACING.sm } as ViewStyle,
  input: { flex: 1, fontFamily: FONTS.bodyMedium, fontSize: 15, color: COLORS.cream, backgroundColor: COLORS.surface1, borderRadius: RADIUS.pill, borderWidth: 1, borderColor: COLORS.sageBorder, paddingHorizontal: SPACING.md, paddingVertical: SPACING.sm + 2 } as TextStyle,
  swapBtn: { width: 32, height: 32, borderRadius: RADIUS.pill, backgroundColor: COLORS.surface2, alignItems: 'center', justifyContent: 'center' } as ViewStyle,
  addThird: { flexDirection: 'row', alignItems: 'center', gap: 6, paddingVertical: SPACING.xs } as ViewStyle,
  addThirdText: { fontFamily: FONTS.bodyMedium, fontSize: 13, color: COLORS.sage } as TextStyle,
  compareBtn: { backgroundColor: COLORS.sage, borderRadius: RADIUS.pill, paddingVertical: SPACING.sm + 4, alignItems: 'center', marginTop: SPACING.xs } as ViewStyle,
  compareBtnText: { fontFamily: FONTS.header, fontSize: 15, color: COLORS.bg } as TextStyle,

  // Loading
  loadingRow: { flexDirection: 'row', alignItems: 'center', justifyContent: 'center', gap: SPACING.sm, paddingVertical: SPACING.lg } as ViewStyle,
  loadingText: { fontFamily: FONTS.mono, fontSize: 12, color: COLORS.muted } as TextStyle,

  // Names row
  namesRow: { flexDirection: 'row', paddingHorizontal: SPACING.md, paddingTop: SPACING.lg, paddingBottom: SPACING.sm } as ViewStyle,
  destName: { flex: 1, fontFamily: FONTS.header, fontSize: 18, color: COLORS.cream, textAlign: 'center' } as TextStyle,

  // Sections
  section: { marginHorizontal: SPACING.md, marginBottom: SPACING.md, backgroundColor: COLORS.surface1, borderRadius: RADIUS.md, borderWidth: 1, borderColor: COLORS.border, padding: SPACING.md } as ViewStyle,
  sectionTitle: { fontFamily: FONTS.mono, fontSize: 11, color: COLORS.muted, letterSpacing: 0.5, textTransform: 'uppercase', marginBottom: SPACING.sm } as TextStyle,
  sectionBody: {} as ViewStyle,
  columns: { flexDirection: 'row' } as ViewStyle,

  // Bars
  barSage: { width: BAR_WIDTH, borderRadius: 3, backgroundColor: COLORS.sage } as ViewStyle,
  barBlue: { width: BAR_WIDTH, borderRadius: 3, backgroundColor: '#5B9BD5' } as ViewStyle,

  // Cost
  costBarFill: { height: 6, borderRadius: 3, backgroundColor: COLORS.sageLight } as ViewStyle,
  costTotal: { fontFamily: FONTS.mono, fontSize: 24, color: COLORS.cream } as TextStyle,

  // Safety
  safetyScore: { fontFamily: FONTS.mono, fontSize: 32, fontWeight: '700' } as TextStyle,

  // Flights
  flightPrice: { fontFamily: FONTS.mono, fontSize: 15, color: COLORS.cream } as TextStyle,

  // Visa
  visaPill: { paddingHorizontal: 10, paddingVertical: 4, borderRadius: RADIUS.pill } as ViewStyle,
  visaPillText: { fontFamily: FONTS.mono, fontSize: 11, fontWeight: '500' } as TextStyle,

  // Month pills
  monthRow: { flexDirection: 'row', flexWrap: 'wrap', gap: 4 } as ViewStyle,
  monthPill: { paddingHorizontal: 6, paddingVertical: 2, borderRadius: RADIUS.pill, backgroundColor: COLORS.surface2 } as ViewStyle,
  monthPillActive: { backgroundColor: COLORS.sageLight } as ViewStyle,
  monthPillText: { fontFamily: FONTS.mono, fontSize: 9, color: COLORS.muted } as TextStyle,
  monthPillTextActive: { color: COLORS.sage } as TextStyle,

  // Vibe
  vibeScore: { fontFamily: FONTS.mono, fontSize: 28, color: COLORS.cream, fontWeight: '700' } as TextStyle,

  // Winner
  winnerBanner: { marginHorizontal: SPACING.md, marginBottom: SPACING.md, backgroundColor: COLORS.sageSubtle, borderRadius: RADIUS.md, borderWidth: 1, borderColor: COLORS.sageBorder, paddingVertical: SPACING.md, alignItems: 'center' } as ViewStyle,
  winnerText: { fontFamily: FONTS.header, fontSize: 15, color: COLORS.sage, textAlign: 'center' } as TextStyle,

  // CTA
  ctaBtn: { marginHorizontal: SPACING.md, backgroundColor: COLORS.sage, borderRadius: RADIUS.pill, paddingVertical: SPACING.md, alignItems: 'center', marginBottom: SPACING.md } as ViewStyle,
  ctaBtnText: { fontFamily: FONTS.header, fontSize: 15, color: COLORS.bg } as TextStyle,

  // Empty
  emptyState: { alignItems: 'center', paddingHorizontal: SPACING.xl, paddingVertical: SPACING.xxl, gap: SPACING.md } as ViewStyle,
  emptyTitle: { fontFamily: FONTS.header, fontSize: 20, color: COLORS.cream, textAlign: 'center' } as TextStyle,
  emptySubtitle: { fontFamily: FONTS.body, fontSize: 14, color: COLORS.muted, textAlign: 'center', lineHeight: 22 } as TextStyle,

  // Shared mono text
  monoSm: { fontFamily: FONTS.mono, fontSize: 12, color: COLORS.cream } as TextStyle,
  monoXs: { fontFamily: FONTS.mono, fontSize: 10, color: COLORS.muted } as TextStyle,
});
