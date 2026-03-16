// =============================================================================
// ROAM — Holiday & Crowd Calendar
// Visual day-by-day crowd forecast with holiday markers and price warnings.
// =============================================================================
import React, { useCallback, useEffect, useMemo, useState } from 'react';
import {
  View,
  Text,
  ScrollView,
  Pressable,
  StyleSheet,
  ActivityIndicator,
  type ViewStyle,
  type TextStyle,
} from 'react-native';
import { format, parseISO } from 'date-fns';
import {
  AlertTriangle,
  Calendar,
  TrendingUp,
  Users,
  type LucideIcon,
} from 'lucide-react-native';
import { useTranslation } from 'react-i18next';
import i18n from '../../lib/i18n';
import { COLORS, FONTS, SPACING, RADIUS } from '../../lib/constants';
import {
  getCrowdForecast,
  getVisitVerdict,
  type CrowdForecast,
  type CrowdLevel,
  type CrowdSummary,
} from '../../lib/crowd-intelligence';

// ---------------------------------------------------------------------------
// Props
// ---------------------------------------------------------------------------
interface HolidayCrowdCalendarProps {
  destination: string;
  startDate: string; // YYYY-MM-DD
  endDate: string;   // YYYY-MM-DD
}

// ---------------------------------------------------------------------------
// Crowd level → color mapping (using COLORS tokens)
// ---------------------------------------------------------------------------
function crowdColor(level: CrowdLevel): string {
  switch (level) {
    case 'low': return COLORS.sage;
    case 'moderate': return COLORS.gold;
    case 'high': return COLORS.coral;
    case 'extreme': return COLORS.danger;
  }
}

function crowdLabel(level: CrowdLevel): string {
  switch (level) {
    case 'low': return i18n.t('crowdCalendar.crowdLow');
    case 'moderate': return i18n.t('crowdCalendar.crowdModerate');
    case 'high': return i18n.t('crowdCalendar.crowdHigh');
    case 'extreme': return i18n.t('crowdCalendar.crowdExtreme');
  }
}

// ---------------------------------------------------------------------------
// Day Cell
// ---------------------------------------------------------------------------
const DayCell = React.memo(function DayCell({
  forecast,
  isSelected,
  onPress,
}: {
  forecast: CrowdForecast;
  isSelected: boolean;
  onPress: () => void;
}) {
  const date = parseISO(forecast.date);
  const color = crowdColor(forecast.level);
  const barHeight = Math.max(8, (forecast.score / 100) * 48);

  return (
    <Pressable
      onPress={onPress}
      style={({ pressed }) => [
        styles.dayCell,
        isSelected && styles.dayCellSelected,
        { opacity: pressed ? 0.8 : 1 },
      ]}
    >
      <Text style={styles.dayName}>{format(date, 'EEE')}</Text>
      <Text style={styles.dayNum}>{format(date, 'd')}</Text>
      <View style={styles.barContainer}>
        <View
          style={[
            styles.bar,
            { height: barHeight, backgroundColor: color },
          ]}
        />
      </View>
      {forecast.holiday && (
        <View style={[styles.holidayDot, { backgroundColor: COLORS.coral }]} />
      )}
    </Pressable>
  );
});

// ---------------------------------------------------------------------------
// Main Component
// ---------------------------------------------------------------------------
export default function HolidayCrowdCalendar({
  destination,
  startDate,
  endDate,
}: HolidayCrowdCalendarProps) {
  const { t } = useTranslation();
  const [summary, setSummary] = useState<CrowdSummary | null>(null);
  const [loading, setLoading] = useState(true);
  const [selectedDay, setSelectedDay] = useState<CrowdForecast | null>(null);

  useEffect(() => {
    let cancelled = false;
    setLoading(true);

    getCrowdForecast(destination, startDate, endDate)
      .then((result) => {
        if (!cancelled) {
          setSummary(result);
          setSelectedDay(result.days[0] ?? null);
        }
      })
      .catch(() => {
        if (!cancelled) setSummary(null);
      })
      .finally(() => {
        if (!cancelled) setLoading(false);
      });

    return () => { cancelled = true; };
  }, [destination, startDate, endDate]);

  const handleDayPress = useCallback((day: CrowdForecast) => {
    setSelectedDay(day);
  }, []);

  const verdict = useMemo(() => {
    if (!summary) return null;
    return getVisitVerdict(summary.avgScore);
  }, [summary]);

  if (loading) {
    return (
      <View style={styles.loadingContainer}>
        <ActivityIndicator size="small" color={COLORS.sage} />
        <Text style={styles.loadingText}>{t('crowdCalendar.loadingCrowds')}</Text>
      </View>
    );
  }

  if (!summary || summary.days.length === 0) {
    return null;
  }

  return (
    <View style={styles.container}>
      {/* Header */}
      <View style={styles.header}>
        <Users size={18} color={COLORS.sage} strokeWidth={2} />
        <Text style={styles.headerTitle}>{t('crowdCalendar.title')}</Text>
      </View>

      {/* Verdict badge */}
      {verdict && (
        <View style={[styles.verdictBadge, { borderColor: crowdColor(summary.days[0]?.level ?? 'moderate') }]}>
          <Text style={[styles.verdictLabel, { color: crowdColor(summary.days[0]?.level ?? 'moderate') }]}>
            {verdict.label}
          </Text>
          <Text style={styles.verdictDetail}>{verdict.detail}</Text>
        </View>
      )}

      {/* Calendar strip */}
      <ScrollView
        horizontal
        showsHorizontalScrollIndicator={false}
        contentContainerStyle={styles.calendarStrip}
      >
        {summary.days.map((day) => (
          <DayCell
            key={day.date}
            forecast={day}
            isSelected={selectedDay?.date === day.date}
            onPress={() => handleDayPress(day)}
          />
        ))}
      </ScrollView>

      {/* Legend */}
      <View style={styles.legend}>
        {(['low', 'moderate', 'high', 'extreme'] as const).map((level) => (
          <View key={level} style={styles.legendItem}>
            <View style={[styles.legendDot, { backgroundColor: crowdColor(level) }]} />
            <Text style={styles.legendText}>{crowdLabel(level)}</Text>
          </View>
        ))}
      </View>

      {/* Selected day detail */}
      {selectedDay && (
        <View style={styles.detailCard}>
          <View style={styles.detailHeader}>
            <Text style={styles.detailDate}>
              {format(parseISO(selectedDay.date), 'EEEE, MMM d')}
            </Text>
            <View style={[styles.detailBadge, { backgroundColor: crowdColor(selectedDay.level) }]}>
              <Text style={styles.detailBadgeText}>{crowdLabel(selectedDay.level)}</Text>
            </View>
          </View>

          {selectedDay.reasons.length > 0 && (
            <View style={styles.reasonsList}>
              {selectedDay.reasons.map((reason) => (
                <View key={reason} style={styles.reasonRow}>
                  <Calendar size={12} color={COLORS.creamMuted} strokeWidth={2} />
                  <Text style={styles.reasonText}>{reason}</Text>
                </View>
              ))}
            </View>
          )}

          {selectedDay.priceMultiplier > 1.0 && (
            <View style={styles.priceWarning}>
              <TrendingUp size={14} color={COLORS.coral} strokeWidth={2} />
              <Text style={styles.priceWarningText}>
                {t('crowdCalendar.pricesHigher', { pct: Math.round((selectedDay.priceMultiplier - 1) * 100) })}
              </Text>
            </View>
          )}
        </View>
      )}

      {/* Warnings */}
      {summary.warnings.map((warning) => (
        <View key={warning} style={styles.warningBanner}>
          <AlertTriangle size={14} color={COLORS.coral} strokeWidth={2} />
          <Text style={styles.warningText}>{warning}</Text>
        </View>
      ))}
    </View>
  );
}

// ---------------------------------------------------------------------------
// Styles
// ---------------------------------------------------------------------------
const styles = StyleSheet.create({
  container: {
    gap: SPACING.md,
  } as ViewStyle,
  loadingContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: SPACING.sm,
    padding: SPACING.md,
  } as ViewStyle,
  loadingText: {
    fontFamily: FONTS.body,
    fontSize: 13,
    color: COLORS.creamMuted,
  } as TextStyle,

  // Header
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: SPACING.sm,
  } as ViewStyle,
  headerTitle: {
    fontFamily: FONTS.header,
    fontSize: 20,
    color: COLORS.cream,
  } as TextStyle,

  // Verdict
  verdictBadge: {
    backgroundColor: COLORS.bgCard,
    borderRadius: RADIUS.lg,
    borderWidth: 1,
    padding: SPACING.md,
  } as ViewStyle,
  verdictLabel: {
    fontFamily: FONTS.bodySemiBold,
    fontSize: 15,
  } as TextStyle,
  verdictDetail: {
    fontFamily: FONTS.body,
    fontSize: 13,
    color: COLORS.creamMuted,
    marginTop: 4,
    lineHeight: 20,
  } as TextStyle,

  // Calendar strip
  calendarStrip: {
    gap: SPACING.xs,
    paddingVertical: SPACING.xs,
  } as ViewStyle,
  dayCell: {
    width: 48,
    alignItems: 'center',
    paddingVertical: SPACING.sm,
    borderRadius: RADIUS.md,
    backgroundColor: COLORS.bgCard,
    borderWidth: 1,
    borderColor: COLORS.border,
    gap: 2,
  } as ViewStyle,
  dayCellSelected: {
    borderColor: COLORS.sage,
    backgroundColor: COLORS.sageFaint,
  } as ViewStyle,
  dayName: {
    fontFamily: FONTS.body,
    fontSize: 10,
    color: COLORS.creamMuted,
  } as TextStyle,
  dayNum: {
    fontFamily: FONTS.mono,
    fontSize: 14,
    color: COLORS.cream,
  } as TextStyle,
  barContainer: {
    width: 20,
    height: 48,
    justifyContent: 'flex-end',
    alignItems: 'center',
  } as ViewStyle,
  bar: {
    width: 16,
    borderRadius: 3,
    minHeight: 4,
  } as ViewStyle,
  holidayDot: {
    width: 6,
    height: 6,
    borderRadius: 3,
    marginTop: 2,
  } as ViewStyle,

  // Legend
  legend: {
    flexDirection: 'row',
    justifyContent: 'center',
    gap: SPACING.md,
  } as ViewStyle,
  legendItem: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
  } as ViewStyle,
  legendDot: {
    width: 8,
    height: 8,
    borderRadius: 4,
  } as ViewStyle,
  legendText: {
    fontFamily: FONTS.body,
    fontSize: 11,
    color: COLORS.creamMuted,
  } as TextStyle,

  // Detail card
  detailCard: {
    backgroundColor: COLORS.bgCard,
    borderRadius: RADIUS.lg,
    borderWidth: 1,
    borderColor: COLORS.border,
    padding: SPACING.md,
  } as ViewStyle,
  detailHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
  } as ViewStyle,
  detailDate: {
    fontFamily: FONTS.bodyMedium,
    fontSize: 14,
    color: COLORS.cream,
  } as TextStyle,
  detailBadge: {
    paddingHorizontal: SPACING.sm,
    paddingVertical: 3,
    borderRadius: RADIUS.sm,
  } as ViewStyle,
  detailBadgeText: {
    fontFamily: FONTS.mono,
    fontSize: 11,
    color: COLORS.bg,
  } as TextStyle,
  reasonsList: {
    marginTop: SPACING.sm,
    gap: 6,
  } as ViewStyle,
  reasonRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
  } as ViewStyle,
  reasonText: {
    fontFamily: FONTS.body,
    fontSize: 13,
    color: COLORS.creamSoft,
  } as TextStyle,
  priceWarning: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
    marginTop: SPACING.sm,
    paddingTop: SPACING.sm,
    borderTopWidth: 1,
    borderTopColor: COLORS.border,
  } as ViewStyle,
  priceWarningText: {
    fontFamily: FONTS.body,
    fontSize: 13,
    color: COLORS.coral,
  } as TextStyle,

  // Warnings
  warningBanner: {
    flexDirection: 'row',
    alignItems: 'flex-start',
    gap: SPACING.sm,
    backgroundColor: COLORS.coralSubtle,
    borderRadius: RADIUS.md,
    padding: SPACING.md,
    borderLeftWidth: 3,
    borderLeftColor: COLORS.coral,
  } as ViewStyle,
  warningText: {
    flex: 1,
    fontFamily: FONTS.body,
    fontSize: 13,
    color: COLORS.cream,
    lineHeight: 20,
  } as TextStyle,
});
