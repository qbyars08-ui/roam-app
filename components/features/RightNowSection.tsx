// =============================================================================
// ROAM — "Right Now" Section for Prep Tab
// Shows live weather conditions for the selected destination
// Uses weather-forecast.ts (Open-Meteo, free, no API key)
// =============================================================================
import React, { useEffect, useState } from 'react';
import {
  View,
  Text,
  StyleSheet,
  ActivityIndicator,
  type ViewStyle,
  type TextStyle,
} from 'react-native';
import { useTranslation } from 'react-i18next';
import {
  Sun,
  CloudRain,
  Cloud,
  CloudSun,
  CloudSnow,
  CloudLightning,
  CloudDrizzle,
  Snowflake,
  Wind,
  Droplets,
  Thermometer,
  ShieldAlert,
} from 'lucide-react-native';
import { COLORS, FONTS, SPACING, RADIUS } from '../../lib/constants';
import { getDestinationCoords } from '../../lib/air-quality';
import {
  getWeatherForecast,
  getPackingSuggestions,
  type WeatherForecast,
  type DailyForecast,
} from '../../lib/weather-forecast';
import { geocodeCity } from '../../lib/geocoding';

// eslint-disable-next-line @typescript-eslint/no-explicit-any
const ICON_MAP: Record<string, any> = {
  Sun,
  CloudSun,
  Cloud,
  CloudRain,
  CloudRainWind: CloudRain,
  CloudDrizzle,
  CloudSnow,
  CloudFog: Cloud,
  CloudLightning,
  Snowflake,
};

function WeatherIcon({ iconName, size = 24, color = COLORS.cream }: { iconName: string; size?: number; color?: string }) {
  const Icon = ICON_MAP[iconName] ?? Cloud;
  return <Icon size={size} color={color} strokeWidth={2} />;
}

interface RightNowSectionProps {
  destination: string;
}

export default function RightNowSection({ destination }: RightNowSectionProps) {
  const { t } = useTranslation();
  const [forecast, setForecast] = useState<WeatherForecast | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    let cancelled = false;
    setLoading(true);

    (async () => {
      let coords = getDestinationCoords(destination);
      if (!coords) {
        const geo = await geocodeCity(destination);
        if (geo) coords = { lat: geo.latitude, lng: geo.longitude };
      }
      if (!coords || cancelled) {
        setLoading(false);
        return;
      }
      const data = await getWeatherForecast(coords.lat, coords.lng, 5);
      if (!cancelled) {
        setForecast(data);
        setLoading(false);
      }
    })();

    return () => { cancelled = true; };
  }, [destination]);

  if (loading) {
    return (
      <View style={styles.container}>
        <Text style={styles.sectionTitle}>{t('prepRightNow.title')}</Text>
        <View style={styles.loadingWrap}>
          <ActivityIndicator size="small" color={COLORS.sage} />
        </View>
      </View>
    );
  }

  if (!forecast || forecast.days.length === 0) return null;

  const today = forecast.days[0];
  const packingSuggestions = getPackingSuggestions(forecast);
  const upcoming = forecast.days.slice(1, 4);

  return (
    <View style={styles.container}>
      <Text style={styles.sectionTitle}>{t('prepRightNow.title')}</Text>

      {/* Today's conditions */}
      <View style={styles.todayCard}>
        <View style={styles.todayMain}>
          <WeatherIcon iconName={today.weatherIcon} size={40} color={COLORS.cream} />
          <View style={styles.todayTemps}>
            <Text style={styles.todayTempHigh}>{Math.round(today.tempMax)}°</Text>
            <Text style={styles.todayTempLow}>{Math.round(today.tempMin)}°</Text>
          </View>
          <View style={styles.todayDetails}>
            <Text style={styles.todayLabel}>{today.weatherLabel}</Text>
            <Text style={styles.todayMeta}>{destination}</Text>
          </View>
        </View>

        {/* Stats row */}
        <View style={styles.statsRow}>
          <View style={styles.statItem}>
            <Droplets size={14} color={COLORS.creamMuted} strokeWidth={2} />
            <Text style={styles.statLabel}>{today.precipitationChance}%</Text>
          </View>
          <View style={styles.statItem}>
            <Wind size={14} color={COLORS.creamMuted} strokeWidth={2} />
            <Text style={styles.statLabel}>{Math.round(today.windSpeedMax)} km/h</Text>
          </View>
          <View style={styles.statItem}>
            <Sun size={14} color={COLORS.creamMuted} strokeWidth={2} />
            <Text style={styles.statLabel}>UV {today.uvLabel}</Text>
          </View>
        </View>
      </View>

      {/* Upcoming days */}
      {upcoming.length > 0 && (
        <View style={styles.upcomingRow}>
          {upcoming.map((day) => (
            <View key={day.date} style={styles.upcomingDay}>
              <Text style={styles.upcomingDate}>
                {new Date(day.date + 'T12:00:00').toLocaleDateString('en', { weekday: 'short' })}
              </Text>
              <WeatherIcon iconName={day.weatherIcon} size={20} color={COLORS.creamDim} />
              <Text style={styles.upcomingTemp}>
                {Math.round(day.tempMax)}° / {Math.round(day.tempMin)}°
              </Text>
            </View>
          ))}
        </View>
      )}

      {/* Packing suggestions */}
      {packingSuggestions.length > 0 && (
        <View style={styles.packingCard}>
          <Text style={styles.packingTitle}>{t('prepRightNow.packingTips')}</Text>
          {packingSuggestions.map((tip, i) => (
            <View key={i} style={styles.packingItem}>
              <View style={styles.packingDot} />
              <Text style={styles.packingText}>{tip}</Text>
            </View>
          ))}
        </View>
      )}
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    gap: SPACING.md,
  } as ViewStyle,
  sectionTitle: {
    fontFamily: FONTS.mono,
    fontSize: 11,
    color: COLORS.sage,
    letterSpacing: 1.5,
    textTransform: 'uppercase',
    marginBottom: SPACING.xs,
  } as TextStyle,
  loadingWrap: {
    paddingVertical: SPACING.xl,
    alignItems: 'center',
  } as ViewStyle,
  todayCard: {
    backgroundColor: COLORS.bgGlass,
    borderRadius: RADIUS.lg,
    borderWidth: 1,
    borderColor: COLORS.border,
    padding: SPACING.lg,
    gap: SPACING.md,
  } as ViewStyle,
  todayMain: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: SPACING.md,
  } as ViewStyle,
  todayTemps: {
    alignItems: 'center',
  } as ViewStyle,
  todayTempHigh: {
    fontFamily: FONTS.header,
    fontSize: 32,
    color: COLORS.cream,
  } as TextStyle,
  todayTempLow: {
    fontFamily: FONTS.body,
    fontSize: 14,
    color: COLORS.creamMuted,
  } as TextStyle,
  todayDetails: {
    flex: 1,
  } as ViewStyle,
  todayLabel: {
    fontFamily: FONTS.bodySemiBold,
    fontSize: 15,
    color: COLORS.cream,
  } as TextStyle,
  todayMeta: {
    fontFamily: FONTS.body,
    fontSize: 13,
    color: COLORS.creamMuted,
    marginTop: 2,
  } as TextStyle,
  statsRow: {
    flexDirection: 'row',
    gap: SPACING.lg,
    paddingTop: SPACING.sm,
    borderTopWidth: 1,
    borderTopColor: COLORS.border,
  } as ViewStyle,
  statItem: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: SPACING.xs,
  } as ViewStyle,
  statLabel: {
    fontFamily: FONTS.mono,
    fontSize: 12,
    color: COLORS.creamMuted,
  } as TextStyle,
  upcomingRow: {
    flexDirection: 'row',
    gap: SPACING.sm,
  } as ViewStyle,
  upcomingDay: {
    flex: 1,
    backgroundColor: COLORS.bgGlass,
    borderRadius: RADIUS.md,
    borderWidth: 1,
    borderColor: COLORS.border,
    padding: SPACING.sm,
    alignItems: 'center',
    gap: SPACING.xs,
  } as ViewStyle,
  upcomingDate: {
    fontFamily: FONTS.mono,
    fontSize: 10,
    color: COLORS.creamDim,
    letterSpacing: 0.5,
  } as TextStyle,
  upcomingTemp: {
    fontFamily: FONTS.body,
    fontSize: 12,
    color: COLORS.creamMuted,
  } as TextStyle,
  packingCard: {
    backgroundColor: COLORS.sageFaint,
    borderRadius: RADIUS.md,
    borderWidth: 1,
    borderColor: COLORS.sageBorder,
    padding: SPACING.md,
    gap: SPACING.sm,
  } as ViewStyle,
  packingTitle: {
    fontFamily: FONTS.mono,
    fontSize: 10,
    color: COLORS.sage,
    letterSpacing: 1,
    textTransform: 'uppercase',
  } as TextStyle,
  packingItem: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: SPACING.sm,
  } as ViewStyle,
  packingDot: {
    width: 4,
    height: 4,
    borderRadius: 2,
    backgroundColor: COLORS.sage,
  } as ViewStyle,
  packingText: {
    fontFamily: FONTS.body,
    fontSize: 13,
    color: COLORS.cream,
    flex: 1,
  } as TextStyle,
});
