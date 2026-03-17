// =============================================================================
// ROAM — Flight Price Calendar
// 6-week color-coded grid showing cheapest days to fly.
// =============================================================================
import React, { useMemo, useCallback, useState } from 'react';
import {
  View,
  Text,
  Pressable,
  StyleSheet,
  type ViewStyle,
  type TextStyle,
} from 'react-native';
import { Calendar, TrendingDown, TrendingUp, Minus } from 'lucide-react-native';
import { useTranslation } from 'react-i18next';
import { COLORS, FONTS, SPACING, RADIUS } from '../../lib/constants';
import { getFlightCalendar, type FlightCalendarDay } from '../../lib/flight-intelligence';
import * as Haptics from '../../lib/haptics';

// ---------------------------------------------------------------------------
// Props
// ---------------------------------------------------------------------------
interface FlightPriceCalendarProps {
  origin: string;
  destination: string;
  startDate?: Date;
}

// ---------------------------------------------------------------------------
// Constants
// ---------------------------------------------------------------------------
const DAY_LABELS = ['S', 'M', 'T', 'W', 'T', 'F', 'S'] as const;

const PRICE_COLORS: Record<FlightCalendarDay['priceLevel'], string> = {
  low: COLORS.sage,
  average: COLORS.gold,
  high: COLORS.coral,
};

const PRICE_BG: Record<FlightCalendarDay['priceLevel'], string> = {
  low: COLORS.sage + '20',
  average: COLORS.gold + '14',
  high: COLORS.coral + '14',
};

// ---------------------------------------------------------------------------
// Sub-components
// ---------------------------------------------------------------------------

function DayCell({
  day,
  isSelected,
  onPress,
}: {
  day: FlightCalendarDay;
  isSelected: boolean;
  onPress: (day: FlightCalendarDay) => void;
}) {
  const dateNum = useMemo(() => new Date(day.date).getDate(), [day.date]);

  const handlePress = useCallback(() => {
    Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
    onPress(day);
  }, [day, onPress]);

  return (
    <Pressable
      onPress={handlePress}
      style={({ pressed }) => [
        styles.dayCell,
        { backgroundColor: PRICE_BG[day.priceLevel] },
        isSelected && styles.dayCellSelected,
        pressed && { opacity: 0.7 },
      ]}
    >
      <Text
        style={[
          styles.dayNum,
          { color: PRICE_COLORS[day.priceLevel] },
          isSelected && styles.dayNumSelected,
        ]}
      >
        {dateNum}
      </Text>
      <Text
        style={[
          styles.dayPrice,
          { color: PRICE_COLORS[day.priceLevel] },
        ]}
      >
        ${day.estimatedPrice}
      </Text>
    </Pressable>
  );
}

function EmptyCell() {
  return <View style={styles.dayCell} />;
}

// ---------------------------------------------------------------------------
// Main Component
// ---------------------------------------------------------------------------
function FlightPriceCalendar({ origin, destination, startDate }: FlightPriceCalendarProps) {
  const { t } = useTranslation();
  const start = useMemo(() => startDate ?? new Date(), [startDate]);
  const [selectedDay, setSelectedDay] = useState<FlightCalendarDay | null>(null);

  const calendar = useMemo(
    () => getFlightCalendar(origin, destination, start),
    [origin, destination, start],
  );

  // Build weeks grid (6 weeks x 7 days)
  const weeks = useMemo(() => {
    const firstDayOfWeek = new Date(calendar[0].date).getDay();
    const grid: (FlightCalendarDay | null)[][] = [];
    let currentWeek: (FlightCalendarDay | null)[] = [];

    // Pad first week with empty cells
    for (let i = 0; i < firstDayOfWeek; i++) {
      currentWeek.push(null);
    }

    for (const day of calendar) {
      currentWeek.push(day);
      if (currentWeek.length === 7) {
        grid.push(currentWeek);
        currentWeek = [];
      }
    }

    // Pad last week
    if (currentWeek.length > 0) {
      while (currentWeek.length < 7) {
        currentWeek.push(null);
      }
      grid.push(currentWeek);
    }

    return grid;
  }, [calendar]);

  // Stats
  const { cheapestDay, priciest, avgPrice } = useMemo(() => {
    let cheapest = calendar[0];
    let expensive = calendar[0];
    let total = 0;

    for (const day of calendar) {
      total += day.estimatedPrice;
      if (day.estimatedPrice < cheapest.estimatedPrice) cheapest = day;
      if (day.estimatedPrice > expensive.estimatedPrice) expensive = day;
    }

    return {
      cheapestDay: cheapest,
      priciest: expensive,
      avgPrice: Math.round(total / calendar.length),
    };
  }, [calendar]);

  const handleDayPress = useCallback((day: FlightCalendarDay) => {
    setSelectedDay((prev) => (prev?.date === day.date ? null : day));
  }, []);

  const formatDate = useCallback((iso: string) => {
    const d = new Date(iso);
    return d.toLocaleDateString('en-US', { month: 'short', day: 'numeric' });
  }, []);

  return (
    <View style={styles.container}>
      {/* Header */}
      <View style={styles.header}>
        <Calendar size={18} color={COLORS.sage} strokeWidth={1.5} />
        <Text style={styles.headerTitle}>{t('flightCalendar.title', { defaultValue: 'Price Calendar' })}</Text>
        <Text style={styles.headerSubtitle}>{t('flightCalendar.subtitle', { defaultValue: '6-week outlook' })}</Text>
      </View>

      {/* Legend */}
      <View style={styles.legend}>
        <View style={styles.legendItem}>
          <View style={[styles.legendDot, { backgroundColor: COLORS.sage }]} />
          <Text style={styles.legendText}>{t('flightCalendar.low', { defaultValue: 'Low' })}</Text>
        </View>
        <View style={styles.legendItem}>
          <View style={[styles.legendDot, { backgroundColor: COLORS.gold }]} />
          <Text style={styles.legendText}>{t('flightCalendar.average', { defaultValue: 'Average' })}</Text>
        </View>
        <View style={styles.legendItem}>
          <View style={[styles.legendDot, { backgroundColor: COLORS.coral }]} />
          <Text style={styles.legendText}>{t('flightCalendar.high', { defaultValue: 'High' })}</Text>
        </View>
      </View>

      {/* Day-of-week headers */}
      <View style={styles.weekRow}>
        {DAY_LABELS.map((label, i) => (
          <View key={i} style={styles.dayHeaderCell}>
            <Text style={styles.dayHeaderText}>{label}</Text>
          </View>
        ))}
      </View>

      {/* Calendar grid */}
      {weeks.map((week, wi) => (
        <View key={wi} style={styles.weekRow}>
          {week.map((day, di) =>
            day ? (
              <DayCell
                key={day.date}
                day={day}
                isSelected={selectedDay?.date === day.date}
                onPress={handleDayPress}
              />
            ) : (
              <EmptyCell key={`empty-${wi}-${di}`} />
            ),
          )}
        </View>
      ))}

      {/* Selected day detail */}
      {selectedDay && (
        <View style={styles.detailCard}>
          <Text style={styles.detailDate}>{formatDate(selectedDay.date)}</Text>
          <Text style={styles.detailPrice}>${selectedDay.estimatedPrice}</Text>
          {selectedDay.savingsVsAvg > 0 ? (
            <View style={styles.detailRow}>
              <TrendingDown size={14} color={COLORS.sage} strokeWidth={1.5} />
              <Text style={[styles.detailSavings, { color: COLORS.sage }]}>
                ${selectedDay.savingsVsAvg} {t('flightCalendar.belowAverage', { defaultValue: 'below average' })}
              </Text>
            </View>
          ) : selectedDay.savingsVsAvg < 0 ? (
            <View style={styles.detailRow}>
              <TrendingUp size={14} color={COLORS.coral} strokeWidth={1.5} />
              <Text style={[styles.detailSavings, { color: COLORS.coral }]}>
                ${Math.abs(selectedDay.savingsVsAvg)} {t('flightCalendar.aboveAverage', { defaultValue: 'above average' })}
              </Text>
            </View>
          ) : (
            <View style={styles.detailRow}>
              <Minus size={14} color={COLORS.gold} strokeWidth={1.5} />
              <Text style={[styles.detailSavings, { color: COLORS.gold }]}>{t('flightCalendar.atAverage', { defaultValue: 'At average price' })}</Text>
            </View>
          )}
        </View>
      )}

      {/* Summary stats */}
      <View style={styles.statsRow}>
        <View style={styles.statCell}>
          <Text style={styles.statLabel}>{t('flightCalendar.cheapest', { defaultValue: 'Cheapest' })}</Text>
          <Text style={[styles.statValue, { color: COLORS.sage }]}>
            ${cheapestDay.estimatedPrice}
          </Text>
          <Text style={styles.statMeta}>{formatDate(cheapestDay.date)}</Text>
        </View>
        <View style={[styles.statCell, styles.statCellCenter]}>
          <Text style={styles.statLabel}>{t('flightCalendar.average', { defaultValue: 'Average' })}</Text>
          <Text style={[styles.statValue, { color: COLORS.gold }]}>${avgPrice}</Text>
          <Text style={styles.statMeta}>{t('flightCalendar.dayAvg', { defaultValue: '42-day avg' })}</Text>
        </View>
        <View style={styles.statCell}>
          <Text style={styles.statLabel}>{t('flightCalendar.priciest', { defaultValue: 'Priciest' })}</Text>
          <Text style={[styles.statValue, { color: COLORS.coral }]}>
            ${priciest.estimatedPrice}
          </Text>
          <Text style={styles.statMeta}>{formatDate(priciest.date)}</Text>
        </View>
      </View>
    </View>
  );
}

// ---------------------------------------------------------------------------
// Styles
// ---------------------------------------------------------------------------
const styles = StyleSheet.create({
  container: {
    backgroundColor: COLORS.bgElevated,
    borderRadius: RADIUS.lg,
    padding: SPACING.md,
    gap: SPACING.sm,
  } as ViewStyle,
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: SPACING.xs,
  } as ViewStyle,
  headerTitle: {
    fontFamily: FONTS.bodySemiBold,
    fontSize: 16,
    color: COLORS.cream,
  } as TextStyle,
  headerSubtitle: {
    fontFamily: FONTS.mono,
    fontSize: 10,
    color: COLORS.creamMuted,
    letterSpacing: 0.5,
    marginLeft: 'auto',
  } as TextStyle,
  legend: {
    flexDirection: 'row',
    gap: SPACING.md,
  } as ViewStyle,
  legendItem: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: SPACING.xs,
  } as ViewStyle,
  legendDot: {
    width: 8,
    height: 8,
    borderRadius: RADIUS.sm,
  } as ViewStyle,
  legendText: {
    fontFamily: FONTS.mono,
    fontSize: 10,
    color: COLORS.creamMuted,
    letterSpacing: 0.5,
  } as TextStyle,
  weekRow: {
    flexDirection: 'row',
    gap: SPACING.xs,
  } as ViewStyle,
  dayHeaderCell: {
    flex: 1,
    alignItems: 'center',
    paddingVertical: SPACING.xs,
  } as ViewStyle,
  dayHeaderText: {
    fontFamily: FONTS.mono,
    fontSize: 10,
    color: COLORS.creamDim,
    letterSpacing: 0.5,
  } as TextStyle,
  dayCell: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: SPACING.sm,
    borderRadius: RADIUS.sm,
    minHeight: 44,
  } as ViewStyle,
  dayCellSelected: {
    borderWidth: 1.5,
    borderColor: COLORS.cream,
  } as ViewStyle,
  dayNum: {
    fontFamily: FONTS.mono,
    fontSize: 11,
    letterSpacing: 0.3,
  } as TextStyle,
  dayNumSelected: {
    color: COLORS.cream,
  } as TextStyle,
  dayPrice: {
    fontFamily: FONTS.mono,
    fontSize: 8,
    marginTop: SPACING.xs,
    letterSpacing: 0.3,
  } as TextStyle,
  detailCard: {
    backgroundColor: COLORS.bgCard,
    borderRadius: RADIUS.md,
    padding: SPACING.sm,
    flexDirection: 'row',
    alignItems: 'center',
    gap: SPACING.sm,
  } as ViewStyle,
  detailDate: {
    fontFamily: FONTS.bodySemiBold,
    fontSize: 14,
    color: COLORS.cream,
  } as TextStyle,
  detailPrice: {
    fontFamily: FONTS.mono,
    fontSize: 18,
    color: COLORS.cream,
    letterSpacing: 0.5,
  } as TextStyle,
  detailRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: SPACING.xs,
    marginLeft: 'auto',
  } as ViewStyle,
  detailSavings: {
    fontFamily: FONTS.mono,
    fontSize: 11,
    letterSpacing: 0.3,
  } as TextStyle,
  statsRow: {
    flexDirection: 'row',
    gap: SPACING.xs,
    marginTop: SPACING.xs,
  } as ViewStyle,
  statCell: {
    flex: 1,
    backgroundColor: COLORS.bgCard,
    borderRadius: RADIUS.sm,
    padding: SPACING.sm,
    alignItems: 'center',
  } as ViewStyle,
  statCellCenter: {
    borderLeftWidth: 0,
    borderRightWidth: 0,
  } as ViewStyle,
  statLabel: {
    fontFamily: FONTS.mono,
    fontSize: 9,
    color: COLORS.creamMuted,
    letterSpacing: 0.5,
    textTransform: 'uppercase',
  } as TextStyle,
  statValue: {
    fontFamily: FONTS.mono,
    fontSize: 18,
    letterSpacing: 0.5,
    marginVertical: SPACING.xs,
  } as TextStyle,
  statMeta: {
    fontFamily: FONTS.body,
    fontSize: 10,
    color: COLORS.creamDim,
  } as TextStyle,
});

export default React.memo(FlightPriceCalendar);
