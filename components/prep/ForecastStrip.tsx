// =============================================================================
// ROAM — 10-Day Weather Forecast Horizontal Strip
// Shows daily weather cards in a scrollable row for trip prep
// =============================================================================
import React, { useEffect, useMemo, useState } from 'react';
import { ScrollView, StyleSheet, Text, View } from 'react-native';
import {
  Cloud,
  CloudDrizzle,
  CloudLightning,
  CloudRain,
  CloudSun,
  CloudSnow,
  Droplets,
  Snowflake,
  Sun,
} from 'lucide-react-native';
import type { LucideIcon } from 'lucide-react-native';

import { COLORS, FONTS, RADIUS, SPACING } from '../../lib/constants';
import { getWeatherForecast } from '../../lib/weather-forecast';
import type { DailyForecast } from '../../lib/weather-forecast';
import { geocodeCity } from '../../lib/geocoding';

// ---------------------------------------------------------------------------
// Types
// ---------------------------------------------------------------------------
interface ForecastStripProps {
  destination: string;
}

interface IconMapping {
  icon: LucideIcon;
  color: string;
}

// ---------------------------------------------------------------------------
// Constants
// ---------------------------------------------------------------------------
const DAY_NAMES = ['Sun', 'Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat'] as const;
const CARD_WIDTH = 72;
const ICON_SIZE = 20;
const PRECIP_ICON_SIZE = 10;
const PRECIP_THRESHOLD = 40;

// ---------------------------------------------------------------------------
// Component
// ---------------------------------------------------------------------------
export default function ForecastStrip({ destination }: ForecastStripProps) {
  const [days, setDays] = useState<DailyForecast[]>([]);

  // Map weather icon names to Lucide components and colors
  const iconMap = useMemo<Record<string, IconMapping>>(
    () => ({
      Sun: { icon: Sun, color: COLORS.gold },
      CloudSun: { icon: CloudSun, color: COLORS.gold },
      Cloud: { icon: Cloud, color: COLORS.creamMuted },
      CloudRain: { icon: CloudRain, color: COLORS.sage },
      CloudRainWind: { icon: CloudRain, color: COLORS.sage },
      CloudDrizzle: { icon: CloudDrizzle, color: COLORS.sage },
      CloudSnow: { icon: CloudSnow, color: COLORS.white },
      Snowflake: { icon: Snowflake, color: COLORS.white },
      CloudLightning: { icon: CloudLightning, color: COLORS.sage },
      CloudFog: { icon: Cloud, color: COLORS.creamMuted },
    }),
    [],
  );

  useEffect(() => {
    let cancelled = false;

    async function fetchForecast() {
      const geo = await geocodeCity(destination);
      if (cancelled || !geo) return;

      const forecast = await getWeatherForecast(
        geo.latitude,
        geo.longitude,
        10,
      );
      if (cancelled || !forecast) return;

      setDays(forecast.days);
    }

    fetchForecast();

    return () => {
      cancelled = true;
    };
  }, [destination]);

  if (days.length === 0) return null;

  return (
    <View style={styles.container}>
      <Text style={styles.sectionHeader}>10-Day Forecast</Text>

      <ScrollView
        horizontal
        showsHorizontalScrollIndicator={false}
        contentContainerStyle={styles.scrollContent}
      >
        {days.map((day, index) => {
          const date = new Date(day.date + 'T00:00:00');
          const dayLabel = DAY_NAMES[date.getDay()];
          const isToday = index === 0;
          const mapping = iconMap[day.weatherIcon] ?? iconMap.Cloud;
          const WeatherIcon = mapping.icon;
          const iconColor = mapping.color;

          return (
            <View
              key={day.date}
              style={[
                styles.card,
                isToday ? styles.cardToday : undefined,
              ]}
            >
              <Text style={styles.dayLabel}>
                {isToday ? 'TODAY' : dayLabel.toUpperCase()}
              </Text>

              <WeatherIcon
                size={ICON_SIZE}
                color={iconColor}
                strokeWidth={2}
              />

              <Text style={styles.tempHigh}>
                {Math.round(day.tempMax)}°
              </Text>

              <Text style={styles.tempLow}>
                {Math.round(day.tempMin)}°
              </Text>

              {day.precipitationChance > PRECIP_THRESHOLD && (
                <View style={styles.precipRow}>
                  <Droplets
                    size={PRECIP_ICON_SIZE}
                    color={COLORS.sage}
                    strokeWidth={2}
                  />
                  <Text style={styles.precipText}>
                    {day.precipitationChance}%
                  </Text>
                </View>
              )}
            </View>
          );
        })}
      </ScrollView>
    </View>
  );
}

// ---------------------------------------------------------------------------
// Styles
// ---------------------------------------------------------------------------
const styles = StyleSheet.create({
  container: {
    marginTop: SPACING.md,
  },
  sectionHeader: {
    fontFamily: FONTS.header,
    fontSize: 22,
    color: COLORS.cream,
    marginBottom: SPACING.sm,
    paddingHorizontal: SPACING.md,
  },
  scrollContent: {
    paddingHorizontal: SPACING.md,
    gap: SPACING.sm,
  },
  card: {
    width: CARD_WIDTH,
    padding: SPACING.sm,
    backgroundColor: COLORS.bgCard,
    borderWidth: 1,
    borderColor: COLORS.border,
    borderRadius: RADIUS.lg,
    alignItems: 'center',
    gap: SPACING.xs,
  },
  cardToday: {
    backgroundColor: COLORS.sageSubtle,
    borderColor: COLORS.sageBorder,
  },
  dayLabel: {
    fontFamily: FONTS.mono,
    fontSize: 11,
    color: COLORS.creamMuted,
    letterSpacing: 0.5,
  },
  tempHigh: {
    fontFamily: FONTS.bodySemiBold,
    fontSize: 15,
    color: COLORS.cream,
  },
  tempLow: {
    fontFamily: FONTS.mono,
    fontSize: 12,
    color: COLORS.creamMuted,
  },
  precipRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 2,
  },
  precipText: {
    fontFamily: FONTS.mono,
    fontSize: 10,
    color: COLORS.sage,
  },
});
