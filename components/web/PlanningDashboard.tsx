// =============================================================================
// ROAM — Web Planning Dashboard
// Multi-panel desktop layout for deep planning sessions
// Only renders on Platform.OS === 'web'
// =============================================================================

import React, { useMemo, useCallback } from 'react';
import {
  Platform,
  Pressable,
  ScrollView,
  StyleSheet,
  Text,
  View,
} from 'react-native';
import { useRouter } from 'expo-router';
import {
  ChevronRight,
  FileText,
  Pencil,
  Share2,
  Wallet,
  MapPin,
  Calendar,
  Shield,
  Zap,
} from 'lucide-react-native';
import { useTranslation } from 'react-i18next';
import { COLORS, FONTS, SPACING, RADIUS } from '../../lib/constants';
import { useAppStore } from '../../lib/store';
import { useSonarQuery } from '../../lib/sonar';
import SonarCard from '../ui/SonarCard';
import LiveBadge from '../ui/LiveBadge';
import { parseItinerary } from '../../lib/types/itinerary';
import type { Itinerary, BudgetBreakdown } from '../../lib/types/itinerary';

// ---------------------------------------------------------------------------
// Guard
// ---------------------------------------------------------------------------
if (Platform.OS !== 'web') {
  module.exports = { default: () => null };
}

// ---------------------------------------------------------------------------
// Budget category config
// ---------------------------------------------------------------------------
const BUDGET_CATEGORIES: ReadonlyArray<{
  key: keyof BudgetBreakdown;
  label: string;
  color: string;
}> = [
  { key: 'accommodation', label: 'Accommodation', color: COLORS.sage },
  { key: 'food', label: 'Food', color: COLORS.gold },
  { key: 'activities', label: 'Activities', color: COLORS.chartBlue },
  { key: 'transportation', label: 'Transport', color: COLORS.chartViolet },
  { key: 'miscellaneous', label: 'Misc', color: COLORS.muted },
] as const;

// ---------------------------------------------------------------------------
// Helpers
// ---------------------------------------------------------------------------
function parseDollar(str: string): number {
  const match = str.replace(/,/g, '').match(/[\d.]+/);
  return match ? parseFloat(match[0]) : 0;
}

// ---------------------------------------------------------------------------
// Sub-components
// ---------------------------------------------------------------------------
function ActionRow({
  icon: Icon,
  label,
  onPress,
}: {
  readonly icon: typeof ChevronRight;
  readonly label: string;
  readonly onPress: () => void;
}) {
  return (
    <Pressable onPress={onPress} style={styles.actionRow}>
      <Icon size={18} strokeWidth={1.5} color={COLORS.sage} />
      <Text style={styles.actionLabel}>{label}</Text>
      <ChevronRight size={16} strokeWidth={1.5} color={COLORS.muted} />
    </Pressable>
  );
}

function DayCard({
  day,
  theme,
  topActivity,
}: {
  readonly day: number;
  readonly theme: string;
  readonly topActivity: string;
}) {
  return (
    <View style={styles.dayCard}>
      <Text style={styles.dayCardNumber}>{`Day ${day}`}</Text>
      <Text style={styles.dayCardTheme} numberOfLines={1}>{theme}</Text>
      <Text style={styles.dayCardActivity} numberOfLines={2}>{topActivity}</Text>
    </View>
  );
}

function BudgetBar({
  label,
  value,
  ratio,
  color,
}: {
  readonly label: string;
  readonly value: string;
  readonly ratio: number;
  readonly color: string;
}) {
  return (
    <View style={styles.budgetBarRow}>
      <Text style={styles.budgetBarLabel}>{label}</Text>
      <View style={styles.budgetBarTrack}>
        <View
          style={[
            styles.budgetBarFill,
            { width: `${Math.max(ratio * 100, 2)}%` as unknown as number, backgroundColor: color },
          ]}
        />
      </View>
      <Text style={styles.budgetBarValue}>{value}</Text>
    </View>
  );
}

// ---------------------------------------------------------------------------
// Main Component
// ---------------------------------------------------------------------------
export default function PlanningDashboard() {
  if (Platform.OS !== 'web') return null;

  const { t } = useTranslation();
  const router = useRouter();
  const trips = useAppStore((s) => s.trips);
  const activeTripId = useAppStore((s) => s.activeTripId);

  const trip = useMemo(
    () => (activeTripId ? trips.find((tr) => tr.id === activeTripId) : trips[0]) ?? null,
    [trips, activeTripId],
  );

  const itinerary: Itinerary | null = useMemo(() => {
    if (!trip?.itinerary) return null;
    try {
      return parseItinerary(trip.itinerary);
    } catch {
      return null;
    }
  }, [trip?.itinerary]);

  const destination = trip?.destination ?? '';

  // Sonar live intel
  const pulse = useSonarQuery(destination || undefined, 'pulse');
  const events = useSonarQuery(destination || undefined, 'events');

  // Budget calculations
  const budgetData = useMemo(() => {
    if (!itinerary) return null;
    const total = parseDollar(itinerary.totalBudget);
    const dayCount = itinerary.days.length || 1;
    const dailyAvg = Math.round(total / dayCount);
    const entries = BUDGET_CATEGORIES.map((cat) => {
      const raw = itinerary.budgetBreakdown[cat.key];
      const val = parseDollar(raw);
      return { ...cat, raw, val };
    });
    const maxVal = Math.max(...entries.map((e) => e.val), 1);
    return { total, dailyAvg, entries, maxVal };
  }, [itinerary]);

  // Actions
  const handleOpenCraft = useCallback(() => {
    router.push('/craft-session' as never);
  }, [router]);
  const handleExportPdf = useCallback(() => {
    // placeholder — PDF export
  }, []);
  const handleShareTrip = useCallback(() => {
    // placeholder — share
  }, []);
  const handleBudgetTracker = useCallback(() => {
    router.push('/budget' as never);
  }, [router]);

  if (!trip) {
    return (
      <View style={styles.emptyContainer}>
        <Text style={styles.emptyText}>{t('plan.noTrips', { defaultValue: 'No trips yet. Plan your first trip to see the dashboard.' })}</Text>
      </View>
    );
  }

  return (
    <ScrollView style={styles.root} contentContainerStyle={styles.rootContent}>
      {/* ── Top 3-column grid ── */}
      <View style={styles.topGrid}>
        {/* Column 1 — Trip Overview */}
        <View style={styles.panel}>
          <View style={styles.panelHeader}>
            <MapPin size={16} strokeWidth={1.5} color={COLORS.sage} />
            <Text style={styles.panelTitle}>{t('dashboard.tripOverview', { defaultValue: 'Trip Overview' })}</Text>
          </View>
          <Text style={styles.destinationName}>{destination}</Text>
          <Text style={styles.datesMono}>
            {trip.days} {t('common.days', { defaultValue: 'days' })}
            {trip.startDate ? ` / ${trip.startDate}` : ''}
          </Text>
          {/* Mini map placeholder */}
          <View style={styles.miniMap}>
            <Text style={styles.miniMapLabel}>{destination}</Text>
          </View>
          {/* Visa pill */}
          {itinerary?.visaInfo ? (
            <View style={styles.visaPill}>
              <Shield size={14} strokeWidth={1.5} color={COLORS.sage} />
              <Text style={styles.visaPillText} numberOfLines={1}>{itinerary.visaInfo}</Text>
            </View>
          ) : null}
        </View>

        {/* Column 2 — Live Intel */}
        <View style={styles.panel}>
          <View style={styles.panelHeader}>
            <Zap size={16} strokeWidth={1.5} color={COLORS.sage} />
            <Text style={styles.panelTitle}>{t('dashboard.liveIntel', { defaultValue: 'Live Intel' })}</Text>
            <LiveBadge size="sm" />
          </View>
          {pulse.data ? (
            <SonarCard
              answer={pulse.data.answer}
              isLive={pulse.isLive}
              citations={pulse.citations}
              title={t('dashboard.pulse', { defaultValue: 'Pulse' })}
              maxBullets={3}
            />
          ) : pulse.isLoading ? (
            <Text style={styles.loadingText}>{t('common.loading', { defaultValue: 'Loading...' })}</Text>
          ) : null}
          {events.data ? (
            <View style={styles.eventsSection}>
              <Text style={styles.subHeader}>{t('dashboard.upcomingEvents', { defaultValue: 'Upcoming Events' })}</Text>
              <Text style={styles.eventsText} numberOfLines={5}>{events.data.answer}</Text>
            </View>
          ) : null}
        </View>

        {/* Column 3 — Quick Actions */}
        <View style={styles.panel}>
          <View style={styles.panelHeader}>
            <Calendar size={16} strokeWidth={1.5} color={COLORS.sage} />
            <Text style={styles.panelTitle}>{t('dashboard.quickActions', { defaultValue: 'Quick Actions' })}</Text>
          </View>
          <ActionRow icon={Pencil} label={t('dashboard.openCraft', { defaultValue: 'Open CRAFT' })} onPress={handleOpenCraft} />
          <ActionRow icon={FileText} label={t('dashboard.exportPdf', { defaultValue: 'Export PDF' })} onPress={handleExportPdf} />
          <ActionRow icon={Share2} label={t('dashboard.shareTrip', { defaultValue: 'Share Trip' })} onPress={handleShareTrip} />
          <ActionRow icon={Wallet} label={t('dashboard.budgetTracker', { defaultValue: 'Budget Tracker' })} onPress={handleBudgetTracker} />
        </View>
      </View>

      {/* ── Bottom 2-column grid ── */}
      <View style={styles.bottomGrid}>
        {/* Left — Itinerary Timeline */}
        <View style={styles.panelWide}>
          <Text style={styles.panelTitle}>{t('dashboard.itineraryTimeline', { defaultValue: 'Itinerary Timeline' })}</Text>
          <ScrollView horizontal showsHorizontalScrollIndicator={false} style={styles.timelineScroll}>
            {itinerary?.days.map((d) => (
              <DayCard
                key={d.day}
                day={d.day}
                theme={d.theme}
                topActivity={d.morning.activity}
              />
            )) ?? (
              <Text style={styles.loadingText}>{t('dashboard.noItinerary', { defaultValue: 'Generate an itinerary to see the timeline' })}</Text>
            )}
          </ScrollView>
        </View>

        {/* Right — Budget */}
        <View style={styles.panel}>
          <Text style={styles.panelTitle}>{t('dashboard.budget', { defaultValue: 'Budget' })}</Text>
          {budgetData ? (
            <>
              <View style={styles.budgetTopRow}>
                <View>
                  <Text style={styles.budgetLabel}>{t('dashboard.totalBudget', { defaultValue: 'Total' })}</Text>
                  <Text style={styles.budgetTotal}>{itinerary?.totalBudget ?? '--'}</Text>
                </View>
                <View>
                  <Text style={styles.budgetLabel}>{t('dashboard.dailyAvg', { defaultValue: 'Daily avg' })}</Text>
                  <Text style={styles.budgetDaily}>{`$${budgetData.dailyAvg}`}</Text>
                </View>
              </View>
              {budgetData.entries.map((entry) => (
                <BudgetBar
                  key={entry.key}
                  label={entry.label}
                  value={entry.raw}
                  ratio={entry.val / budgetData.maxVal}
                  color={entry.color}
                />
              ))}
            </>
          ) : (
            <Text style={styles.loadingText}>{t('dashboard.noBudget', { defaultValue: 'No budget data yet' })}</Text>
          )}
        </View>
      </View>
    </ScrollView>
  );
}

// ---------------------------------------------------------------------------
// Styles — CSS grid via web-specific style props
// ---------------------------------------------------------------------------
const styles = StyleSheet.create({
  root: {
    flex: 1,
    backgroundColor: COLORS.bg,
  },
  rootContent: {
    padding: SPACING.lg,
    gap: SPACING.lg,
  },
  topGrid: {
    flexDirection: 'row' as const,
    gap: SPACING.md,
    ...({ display: 'grid', gridTemplateColumns: '1fr 1fr 1fr' } as Record<string, unknown>),
  } as unknown as Record<string, unknown>,
  bottomGrid: {
    flexDirection: 'row' as const,
    gap: SPACING.md,
    ...({ display: 'grid', gridTemplateColumns: '2fr 1fr' } as Record<string, unknown>),
  } as unknown as Record<string, unknown>,
  panel: {
    backgroundColor: COLORS.surface1,
    borderRadius: RADIUS.md,
    borderWidth: 1,
    borderColor: COLORS.border,
    padding: SPACING.md,
    gap: SPACING.sm,
  },
  panelWide: {
    backgroundColor: COLORS.surface1,
    borderRadius: RADIUS.md,
    borderWidth: 1,
    borderColor: COLORS.border,
    padding: SPACING.md,
    gap: SPACING.sm,
  },
  panelHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: SPACING.sm,
    marginBottom: SPACING.xs,
  },
  panelTitle: {
    fontFamily: FONTS.headerMedium,
    fontSize: 15,
    color: COLORS.creamBright,
    flex: 1,
  },
  destinationName: {
    fontFamily: FONTS.header,
    fontSize: 28,
    color: COLORS.creamBright,
  },
  datesMono: {
    fontFamily: FONTS.mono,
    fontSize: 13,
    color: COLORS.muted,
  },
  miniMap: {
    height: 100,
    backgroundColor: COLORS.sageFaint,
    borderRadius: RADIUS.sm,
    borderWidth: 1,
    borderColor: COLORS.sageBorder,
    alignItems: 'center',
    justifyContent: 'center',
    marginTop: SPACING.xs,
  },
  miniMapLabel: {
    fontFamily: FONTS.mono,
    fontSize: 12,
    color: COLORS.sage,
    letterSpacing: 0.5,
  },
  visaPill: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: SPACING.xs,
    backgroundColor: COLORS.sageSubtle,
    borderRadius: RADIUS.pill,
    paddingHorizontal: SPACING.sm + 4,
    paddingVertical: SPACING.xs + 2,
    alignSelf: 'flex-start',
  },
  visaPillText: {
    fontFamily: FONTS.mono,
    fontSize: 11,
    color: COLORS.sage,
  },
  loadingText: {
    fontFamily: FONTS.body,
    fontSize: 13,
    color: COLORS.muted,
  },
  subHeader: {
    fontFamily: FONTS.bodyMedium,
    fontSize: 13,
    color: COLORS.creamDim,
    marginBottom: SPACING.xs,
  },
  eventsSection: {
    marginTop: SPACING.sm,
  },
  eventsText: {
    fontFamily: FONTS.body,
    fontSize: 13,
    color: COLORS.creamFaint,
    lineHeight: 20,
  },
  actionRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: SPACING.sm + 2,
    paddingVertical: SPACING.sm + 2,
    borderBottomWidth: 1,
    borderBottomColor: COLORS.border,
  },
  actionLabel: {
    fontFamily: FONTS.bodyMedium,
    fontSize: 14,
    color: COLORS.creamBright,
    flex: 1,
  },
  timelineScroll: {
    marginTop: SPACING.xs,
  },
  dayCard: {
    width: 160,
    backgroundColor: COLORS.surface2,
    borderRadius: RADIUS.sm,
    borderWidth: 1,
    borderColor: COLORS.border,
    padding: SPACING.sm + 4,
    marginRight: SPACING.sm,
    gap: SPACING.xs,
  },
  dayCardNumber: {
    fontFamily: FONTS.mono,
    fontSize: 11,
    color: COLORS.sage,
    letterSpacing: 0.5,
  },
  dayCardTheme: {
    fontFamily: FONTS.headerMedium,
    fontSize: 14,
    color: COLORS.creamBright,
  },
  dayCardActivity: {
    fontFamily: FONTS.body,
    fontSize: 12,
    color: COLORS.muted,
    lineHeight: 18,
  },
  budgetTopRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    marginBottom: SPACING.sm,
  },
  budgetLabel: {
    fontFamily: FONTS.mono,
    fontSize: 11,
    color: COLORS.muted,
    marginBottom: 2,
  },
  budgetTotal: {
    fontFamily: FONTS.mono,
    fontSize: 22,
    color: COLORS.creamBright,
  },
  budgetDaily: {
    fontFamily: FONTS.mono,
    fontSize: 18,
    color: COLORS.sage,
  },
  budgetBarRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: SPACING.sm,
    marginBottom: SPACING.xs + 2,
  },
  budgetBarLabel: {
    fontFamily: FONTS.body,
    fontSize: 12,
    color: COLORS.muted,
    width: 100,
  },
  budgetBarTrack: {
    flex: 1,
    height: 8,
    backgroundColor: COLORS.bgGlass,
    borderRadius: RADIUS.sm,
    overflow: 'hidden',
  },
  budgetBarFill: {
    height: 8,
    borderRadius: RADIUS.sm,
  },
  budgetBarValue: {
    fontFamily: FONTS.mono,
    fontSize: 12,
    color: COLORS.creamDim,
    width: 70,
    textAlign: 'right',
  },
  emptyContainer: {
    flex: 1,
    backgroundColor: COLORS.bg,
    alignItems: 'center',
    justifyContent: 'center',
    padding: SPACING.xxl,
  },
  emptyText: {
    fontFamily: FONTS.body,
    fontSize: 15,
    color: COLORS.muted,
    textAlign: 'center',
  },
});
