// =============================================================================
// ScheduleSection — day-by-day itinerary schedule view
// =============================================================================
import React from 'react';
import { View, Text, StyleSheet, type ViewStyle, type TextStyle } from 'react-native';
import { useTranslation } from 'react-i18next';
import { COLORS, FONTS, SPACING, RADIUS } from '../../lib/constants';
import type { Itinerary, ItineraryDay } from '../../lib/types/itinerary';
import { sharedStyles, SLOT_DEFAULTS } from './prep-shared';

type Props = {
  itinerary: Itinerary | null;
};

export default function ScheduleSection({ itinerary }: Props) {
  const { t } = useTranslation();

  if (!itinerary?.days?.length) {
    return (
      <View style={sharedStyles.tabContent}>
        <Text style={styles.scheduleEmptyTitle}>
          {t('prep.nothingToPrep', { defaultValue: 'Nothing to prep for.' })}
        </Text>
        <Text style={sharedStyles.noDataText}>
          {t('prep.buildTripHint', { defaultValue: 'Build a trip and this screen fills itself.' })}
        </Text>
      </View>
    );
  }

  return (
    <View style={sharedStyles.tabContent}>
      <Text style={styles.scheduleIntro}>
        {itinerary.destination} · {itinerary.days.length} {t('prep.days', { defaultValue: 'days' })}
      </Text>
      {itinerary.days.map((day: ItineraryDay) => (
        <View key={day.day} style={styles.scheduleDayCard}>
          <Text style={styles.scheduleDayLabel}>{t('prep.day', { defaultValue: 'Day' })} {day.day}</Text>
          <Text style={styles.scheduleDayTheme}>{day.theme}</Text>
          {(['morning', 'afternoon', 'evening'] as const).map((slot) => {
            const a = day[slot];
            const time = a.time ?? SLOT_DEFAULTS[slot];
            return (
              <View key={slot} style={styles.scheduleSlotRow}>
                <Text style={styles.scheduleSlotTime}>{time}</Text>
                <View style={styles.scheduleSlotContent}>
                  <Text style={styles.scheduleSlotActivity}>{a.activity}</Text>
                  <Text style={styles.scheduleSlotLocation}>{a.location}</Text>
                </View>
              </View>
            );
          })}
        </View>
      ))}
    </View>
  );
}

const styles = StyleSheet.create({
  scheduleIntro: {
    fontFamily: FONTS.body,
    fontSize: 13,
    color: COLORS.creamMuted,
    marginBottom: SPACING.md,
  } as TextStyle,
  scheduleEmptyTitle: {
    fontFamily: FONTS.header,
    fontSize: 18,
    color: COLORS.cream,
    marginBottom: SPACING.sm,
  } as TextStyle,
  scheduleDayCard: {
    backgroundColor: COLORS.bgMagazine,
    borderRadius: RADIUS.lg,
    borderLeftWidth: 3,
    borderLeftColor: COLORS.sage,
    padding: SPACING.lg,
    marginBottom: SPACING.md,
  } as ViewStyle,
  scheduleDayLabel: {
    fontFamily: FONTS.mono,
    fontSize: 11,
    color: COLORS.sage,
    letterSpacing: 1,
    marginBottom: SPACING.xs,
  } as TextStyle,
  scheduleDayTheme: {
    fontFamily: FONTS.header,
    fontSize: 18,
    color: COLORS.cream,
    marginBottom: SPACING.md,
  } as TextStyle,
  scheduleSlotRow: {
    flexDirection: 'row',
    marginBottom: SPACING.sm,
    gap: 14,
  } as ViewStyle,
  scheduleSlotTime: {
    fontFamily: FONTS.mono,
    fontSize: 12,
    color: COLORS.gold,
    width: 64,
  } as TextStyle,
  scheduleSlotContent: {
    flex: 1,
  } as ViewStyle,
  scheduleSlotActivity: {
    fontFamily: FONTS.body,
    fontSize: 14,
    color: COLORS.cream,
  } as TextStyle,
  scheduleSlotLocation: {
    fontFamily: FONTS.body,
    fontSize: 12,
    color: COLORS.creamMuted,
    marginTop: 2,
  } as TextStyle,
});
