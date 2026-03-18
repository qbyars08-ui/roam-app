// =============================================================================
// ROAM — Air Quality + Sunrise/Sunset combined card
// Two side-by-side cards for the prep tab
// =============================================================================
import React, { useCallback, useEffect, useState } from 'react';
import { Pressable, StyleSheet, Text, View } from 'react-native';
import { useRouter } from 'expo-router';
import { Sunrise, Sunset, Wind } from 'lucide-react-native';
import * as Haptics from '../../lib/haptics';

import { COLORS, FONTS, RADIUS, SPACING } from '../../lib/constants';
import {
  getAirQuality,
  resolveDestinationCoords,
  type AirQuality,
} from '../../lib/air-quality';
import { getSunTimes, type SunTimes } from '../../lib/sun-times';

interface AirQualitySunCardProps {
  destination: string;
}

export default function AirQualitySunCard({ destination }: AirQualitySunCardProps) {
  const router = useRouter();
  const [aqi, setAqi] = useState<AirQuality | null>(null);
  const [sunTimes, setSunTimes] = useState<SunTimes | null>(null);

  const fetchData = useCallback(async (cancelled: { current: boolean }) => {
    const coords = await resolveDestinationCoords(destination);
    if (!coords) return;

    const [aqiResult, sunResult] = await Promise.all([
      getAirQuality(coords.lat, coords.lng),
      getSunTimes(coords.lat, coords.lng),
    ]);

    if (cancelled.current) return;

    setAqi(aqiResult);
    setSunTimes(sunResult);
  }, [destination]);

  useEffect(() => {
    const cancelled = { current: false };
    fetchData(cancelled);
    return () => {
      cancelled.current = true;
    };
  }, [fetchData]);

  if (!aqi && !sunTimes) return null;

  return (
    <View style={styles.container}>
      {aqi && (
        <Pressable style={styles.card} onPress={() => { Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light); router.push({ pathname: '/destination/[name]', params: { name: destination } } as never); }} accessibilityLabel={`Air quality: ${aqi.label}`} accessibilityRole="button">
          <Wind size={16} color={aqi.color} strokeWidth={1.5} />
          <Text style={styles.aqiValue}>{aqi.aqi}</Text>
          <Text style={styles.aqiLabel}>{aqi.label}</Text>
          <Text style={styles.aqiAdvice} numberOfLines={2}>
            {aqi.advice}
          </Text>
        </Pressable>
      )}

      {sunTimes && (
        <Pressable style={styles.card} onPress={() => { Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light); router.push({ pathname: '/destination/[name]', params: { name: destination } } as never); }} accessibilityLabel={`Sunrise ${sunTimes.sunrise}, Sunset ${sunTimes.sunset}`} accessibilityRole="button">
          <Sunrise size={16} color={COLORS.gold} strokeWidth={1.5} />

          <View style={styles.sunRow}>
            <Sunrise size={10} color={COLORS.gold} strokeWidth={1.5} />
            <Text style={styles.sunTime}>{sunTimes.sunrise}</Text>
          </View>

          <View style={styles.sunRow}>
            <Sunset size={10} color={COLORS.gold} strokeWidth={1.5} />
            <Text style={styles.sunTime}>{sunTimes.sunset}</Text>
          </View>

          <Text style={styles.dayLength}>{sunTimes.dayLength}</Text>
          <Text style={styles.goldenHour}>
            Golden hour {sunTimes.goldenHour}
          </Text>
        </Pressable>
      )}
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flexDirection: 'row',
    gap: SPACING.sm,
  },
  card: {
    flex: 1,
    backgroundColor: COLORS.bgCard,
    borderWidth: 1,
    borderColor: COLORS.border,
    borderRadius: RADIUS.lg,
    padding: SPACING.md,
    gap: 4,
  },
  aqiValue: {
    fontFamily: FONTS.header,
    fontSize: 24,
    color: COLORS.cream,
  },
  aqiLabel: {
    fontFamily: FONTS.mono,
    fontSize: 11,
    color: COLORS.creamMuted,
    textTransform: 'uppercase',
  },
  aqiAdvice: {
    fontFamily: FONTS.body,
    fontSize: 12,
    color: COLORS.creamMuted,
  },
  sunRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: SPACING.xs,
  },
  sunTime: {
    fontFamily: FONTS.mono,
    fontSize: 12,
    color: COLORS.cream,
  },
  dayLength: {
    fontFamily: FONTS.mono,
    fontSize: 11,
    color: COLORS.creamMuted,
  },
  goldenHour: {
    fontFamily: FONTS.mono,
    fontSize: 10,
    color: COLORS.gold,
  },
});
