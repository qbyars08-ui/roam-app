// =============================================================================
// CrowdsSection — crowd forecast calendar
// =============================================================================
import React, { useMemo } from 'react';
import { View, Text, StyleSheet, type ViewStyle, type TextStyle } from 'react-native';
import { useTranslation } from 'react-i18next';
import { Users } from 'lucide-react-native';
import { COLORS, FONTS, SPACING } from '../../lib/constants';
import type { Trip } from '../../lib/store';
import HolidayCrowdCalendar from '../features/HolidayCrowdCalendar';
import { sharedStyles } from './prep-shared';

type Props = {
  destination: string;
  trip: Trip | null;
};

export default function CrowdsSection({ destination, trip }: Props) {
  const { t } = useTranslation();
  const { startDate, endDate } = useMemo(() => {
    const now = new Date();
    const start = now.toISOString().split('T')[0];
    const days = trip?.days ?? 7;
    const end = new Date(now.getTime() + days * 24 * 60 * 60 * 1000).toISOString().split('T')[0];
    return { startDate: start, endDate: end };
  }, [trip?.days]);

  return (
    <View style={sharedStyles.tabContent}>
      <View style={styles.header}>
        <Users size={20} color={COLORS.sage} />
        <Text style={styles.title}>{t('prep.crowdForecast', { defaultValue: 'Crowd Forecast' })}</Text>
      </View>
      <Text style={styles.subtitle}>
        {`How busy ${destination} will be during your trip`}
      </Text>
      <HolidayCrowdCalendar
        destination={destination}
        startDate={startDate}
        endDate={endDate}
      />
    </View>
  );
}

const styles = StyleSheet.create({
  header: { flexDirection: 'row', alignItems: 'center', gap: SPACING.sm, marginBottom: SPACING.xs } as ViewStyle,
  title: { fontFamily: FONTS.header, fontSize: 22, color: COLORS.cream } as TextStyle,
  subtitle: { fontFamily: FONTS.body, fontSize: 13, color: COLORS.creamMuted, marginBottom: SPACING.lg } as TextStyle,
});
