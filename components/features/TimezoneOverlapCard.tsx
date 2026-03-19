// =============================================================================
// ROAM — Timezone Overlap Card
// Visual display of work-hour overlap between home and destination
// =============================================================================
import React, { useMemo } from 'react';
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  type ViewStyle,
  type TextStyle,
} from 'react-native';
import { Clock, Globe } from 'lucide-react-native';
import { useTranslation } from 'react-i18next';

import { COLORS, FONTS, SPACING, RADIUS } from '../../lib/constants';
import {
  calculateOverlap,
  SLOT_QUALITY_COLORS,
  type TimeSlot,
} from '../../lib/timezone-planner';

interface Props {
  readonly destination: string;
  readonly homeTz?: string;
}

const QUALITY_BG: Record<TimeSlot['quality'], string> = {
  ideal: COLORS.sageSubtle,
  possible: 'rgba(201,168,76,0.12)',
  bad: 'rgba(232,97,74,0.08)',
};

const QUALITY_FG: Record<TimeSlot['quality'], string> = {
  ideal: COLORS.sage,
  possible: COLORS.gold,
  bad: COLORS.coral,
};

function formatHourShort(h: number): string {
  if (h === 0 || h === 24) return '12a';
  if (h === 12) return '12p';
  if (h < 12) return `${h}a`;
  return `${h - 12}p`;
}

export default function TimezoneOverlapCard({ destination, homeTz = 'US Eastern' }: Props): React.JSX.Element | null {
  const { t } = useTranslation();

  const overlap = useMemo(
    () => calculateOverlap(destination, homeTz),
    [destination, homeTz],
  );

  if (!overlap) return null;

  const offsetLabel = overlap.offsetHours > 0
    ? `+${overlap.offsetHours}h`
    : `${overlap.offsetHours}h`;

  return (
    <View style={s.card}>
      {/* Header */}
      <View style={s.header}>
        <View style={s.iconWrap}>
          <Clock size={16} color={COLORS.sage} strokeWidth={1.5} />
        </View>
        <View style={s.headerText}>
          <Text style={s.title}>
            {t('timezone.title', { defaultValue: 'Time Zone Overlap' })}
          </Text>
          <Text style={s.subtitle}>{overlap.homeTz} {offsetLabel}</Text>
        </View>
        <View style={s.offsetBadge}>
          <Globe size={12} color={COLORS.creamDim} strokeWidth={1.5} />
          <Text style={s.offsetText}>{offsetLabel}</Text>
        </View>
      </View>

      {/* Summary */}
      <Text style={s.summary}>{overlap.summary}</Text>

      {/* Visual timeline */}
      <ScrollView horizontal showsHorizontalScrollIndicator={false} style={s.timeline}>
        <View style={s.timelineRow}>
          {Array.from({ length: 17 }, (_, i) => {
            const destHour = i + 7; // 7am to 11pm
            const homeHour = destHour - overlap.offsetHours;
            const normalizedHome = ((homeHour % 24) + 24) % 24;

            // Determine quality
            let quality: TimeSlot['quality'] = 'bad';
            if (normalizedHome >= 9 && normalizedHome <= 18) quality = 'ideal';
            else if ((normalizedHome >= 7 && normalizedHome < 9) || (normalizedHome > 18 && normalizedHome <= 22)) quality = 'possible';

            return (
              <View key={destHour} style={s.slotWrap}>
                <Text style={s.slotDestHour}>{formatHourShort(destHour)}</Text>
                <View style={[s.slotBar, { backgroundColor: QUALITY_BG[quality] }]}>
                  <View style={[s.slotDot, { backgroundColor: QUALITY_FG[quality] }]} />
                </View>
                <Text style={[s.slotHomeHour, { color: QUALITY_FG[quality] }]}>
                  {formatHourShort(normalizedHome)}
                </Text>
              </View>
            );
          })}
        </View>
      </ScrollView>

      {/* Legend */}
      <View style={s.legend}>
        <View style={s.legendItem}>
          <View style={[s.legendDot, { backgroundColor: COLORS.sage }]} />
          <Text style={s.legendText}>
            {t('timezone.ideal', { defaultValue: 'Work hours' })}
          </Text>
        </View>
        <View style={s.legendItem}>
          <View style={[s.legendDot, { backgroundColor: COLORS.gold }]} />
          <Text style={s.legendText}>
            {t('timezone.possible', { defaultValue: 'Stretch hours' })}
          </Text>
        </View>
        <View style={s.legendItem}>
          <View style={[s.legendDot, { backgroundColor: COLORS.coral }]} />
          <Text style={s.legendText}>
            {t('timezone.bad', { defaultValue: 'Sleeping' })}
          </Text>
        </View>
      </View>

      {/* Tip */}
      <Text style={s.tip}>{overlap.tip}</Text>

      {/* Best meeting times */}
      {overlap.idealSlots.length > 0 && (
        <View style={s.bestTimes}>
          <Text style={s.bestTimesLabel}>
            {t('timezone.bestTimes', { defaultValue: 'Best meeting times:' })}
          </Text>
          <Text style={s.bestTimesValue}>
            {overlap.idealSlots.slice(0, 3).map((sl) => sl.label).join('  ·  ')}
          </Text>
        </View>
      )}
    </View>
  );
}

// ---------------------------------------------------------------------------
// Styles
// ---------------------------------------------------------------------------
const s = StyleSheet.create({
  card: {
    backgroundColor: COLORS.surface1,
    borderRadius: RADIUS.lg,
    borderWidth: 1,
    borderColor: COLORS.border,
    padding: SPACING.md,
    gap: SPACING.sm,
  } as ViewStyle,
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: SPACING.xs,
  } as ViewStyle,
  iconWrap: {
    width: 28,
    height: 28,
    borderRadius: RADIUS.full,
    backgroundColor: COLORS.sageSubtle,
    alignItems: 'center',
    justifyContent: 'center',
  } as ViewStyle,
  headerText: {
    flex: 1,
  } as ViewStyle,
  title: {
    fontFamily: FONTS.headerMedium,
    fontSize: 15,
    color: COLORS.cream,
  } as TextStyle,
  subtitle: {
    fontFamily: FONTS.mono,
    fontSize: 10,
    color: COLORS.muted,
  } as TextStyle,
  offsetBadge: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 3,
    paddingHorizontal: SPACING.sm,
    paddingVertical: 3,
    borderRadius: RADIUS.pill,
    backgroundColor: COLORS.bgElevated,
    borderWidth: 1,
    borderColor: COLORS.border,
  } as ViewStyle,
  offsetText: {
    fontFamily: FONTS.mono,
    fontSize: 11,
    color: COLORS.creamDim,
  } as TextStyle,
  summary: {
    fontFamily: FONTS.body,
    fontSize: 13,
    color: COLORS.creamDim,
    lineHeight: 18,
  } as TextStyle,
  timeline: {
    marginHorizontal: -SPACING.xs,
  } as ViewStyle,
  timelineRow: {
    flexDirection: 'row',
    gap: 2,
    paddingHorizontal: SPACING.xs,
  } as ViewStyle,
  slotWrap: {
    alignItems: 'center',
    width: 32,
    gap: 2,
  } as ViewStyle,
  slotDestHour: {
    fontFamily: FONTS.mono,
    fontSize: 8,
    color: COLORS.muted,
  } as TextStyle,
  slotBar: {
    width: 28,
    height: 24,
    borderRadius: RADIUS.sm,
    alignItems: 'center',
    justifyContent: 'center',
  } as ViewStyle,
  slotDot: {
    width: 6,
    height: 6,
    borderRadius: 3,
  } as ViewStyle,
  slotHomeHour: {
    fontFamily: FONTS.mono,
    fontSize: 8,
  } as TextStyle,
  legend: {
    flexDirection: 'row',
    gap: SPACING.md,
  } as ViewStyle,
  legendItem: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
  } as ViewStyle,
  legendDot: {
    width: 6,
    height: 6,
    borderRadius: 3,
  } as ViewStyle,
  legendText: {
    fontFamily: FONTS.mono,
    fontSize: 9,
    color: COLORS.muted,
  } as TextStyle,
  tip: {
    fontFamily: FONTS.body,
    fontSize: 12,
    color: COLORS.creamDim,
    lineHeight: 17,
  } as TextStyle,
  bestTimes: {
    backgroundColor: COLORS.sageSubtle,
    borderRadius: RADIUS.md,
    padding: SPACING.sm,
    gap: 2,
  } as ViewStyle,
  bestTimesLabel: {
    fontFamily: FONTS.mono,
    fontSize: 9,
    color: COLORS.sage,
    textTransform: 'uppercase',
    letterSpacing: 0.5,
  } as TextStyle,
  bestTimesValue: {
    fontFamily: FONTS.body,
    fontSize: 12,
    color: COLORS.cream,
    lineHeight: 18,
  } as TextStyle,
});
