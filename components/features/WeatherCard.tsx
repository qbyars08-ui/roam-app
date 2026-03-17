// =============================================================================
// ROAM — Weather Forecast Card
// =============================================================================
import React from 'react';
import {
  FlatList,
  Image,
  StyleSheet,
  Text,
  View,
  type ListRenderItemInfo,
  type ViewStyle,
  type TextStyle,
  type ImageStyle,
} from 'react-native';
import { useTranslation } from 'react-i18next';
import { COLORS, FONTS, SPACING, RADIUS } from '../../lib/constants';
import type { WeatherForecast, WeatherDay } from '../../lib/weather';

// ---------------------------------------------------------------------------
// Types
// ---------------------------------------------------------------------------

interface WeatherCardProps {
  /** Weather forecast data from getWeatherForecast() */
  forecast: WeatherForecast;
}

// ---------------------------------------------------------------------------
// Helpers
// ---------------------------------------------------------------------------

/**
 * Extract a short day name from an ISO date string.
 * e.g. "2025-04-15" -> "Tue"
 */
function getDayName(dateStr: string): string {
  try {
    const date = new Date(dateStr + 'T12:00:00');
    return date.toLocaleDateString('en-US', { weekday: 'short' });
  } catch {
    return dateStr.slice(5);
  }
}

// ---------------------------------------------------------------------------
// Sub-components
// ---------------------------------------------------------------------------

function DailyForecastItem({ item }: { item: WeatherDay }) {
  const hasHighPop = item.pop > 0.5;

  return (
    <View style={styles.dailyItem}>
      <Text style={styles.dailyDay}>{getDayName(item.date)}</Text>
      {item.icon.startsWith('http') ? (
        <Image source={{ uri: item.icon }} style={styles.dailyIconImg} />
      ) : (
        <Text style={styles.dailyIconText}>{item.icon}</Text>
      )}
      <Text style={styles.dailyHigh}>{item.tempMax}°</Text>
      <Text style={styles.dailyLow}>{item.tempMin}°</Text>
      {hasHighPop && (
        <View style={styles.popBadge}>
          <Text style={styles.popText}>{Math.round(item.pop * 100)}%</Text>
        </View>
      )}
    </View>
  );
}

// ---------------------------------------------------------------------------
// Component
// ---------------------------------------------------------------------------

export default function WeatherCard({ forecast }: WeatherCardProps) {
  const { t } = useTranslation();
  const renderDailyItem = ({ item }: ListRenderItemInfo<WeatherDay>) => (
    <DailyForecastItem item={item} />
  );

  return (
    <View style={styles.container}>
      {/* Header */}
      <View style={styles.header}>
        <Text style={styles.headerLabel}>{t('weather.forecast', { defaultValue: 'WEATHER FORECAST' })}</Text>
      </View>

      {/* Packing Hint */}
      {forecast.packingHint ? (
        <View style={styles.hintContainer}>
          <Text style={styles.hintText}>{forecast.packingHint}</Text>
        </View>
      ) : null}

      {/* Current Weather */}
      <View style={styles.currentContainer}>
        {forecast.current.icon.startsWith('http') ? (
          <Image
            source={{ uri: forecast.current.icon }}
            style={styles.currentIconImg}
          />
        ) : (
          <Text style={styles.currentIconText}>{forecast.current.icon}</Text>
        )}
        <View style={styles.currentInfo}>
          <Text style={styles.currentTemp}>{forecast.current.temp}°C</Text>
          <Text style={styles.currentDesc}>{forecast.current.description}</Text>
          <Text style={styles.feelsLike}>
            {t('weather.humidity', { defaultValue: 'Humidity' })} {forecast.current.humidity}% · {t('weather.wind', { defaultValue: 'Wind' })}{' '}
            {forecast.current.windSpeed} m/s
          </Text>
        </View>
      </View>

      {/* Divider */}
      <View style={styles.divider} />

      {/* Daily Forecast Strip */}
      {forecast.days.length > 0 && (
        <FlatList<WeatherDay>
          data={forecast.days}
          renderItem={renderDailyItem}
          keyExtractor={(item) => item.date}
          horizontal
          showsHorizontalScrollIndicator={false}
          contentContainerStyle={styles.dailyList}
          ItemSeparatorComponent={() => <View style={styles.dailySeparator} />}
        />
      )}
    </View>
  );
}

// ---------------------------------------------------------------------------
// Styles
// ---------------------------------------------------------------------------

const styles = StyleSheet.create({
  container: {
    backgroundColor: COLORS.bgCard,
    borderRadius: RADIUS.lg,
    borderWidth: 1,
    borderColor: COLORS.border,
    overflow: 'hidden',
  } as ViewStyle,
  header: {
    paddingHorizontal: SPACING.md,
    paddingTop: SPACING.md,
    paddingBottom: SPACING.sm,
  } as ViewStyle,
  headerLabel: {
    fontFamily: FONTS.mono,
    fontSize: 11,
    color: COLORS.sage,
    letterSpacing: 1.5,
    textTransform: 'uppercase',
  } as TextStyle,
  hintContainer: {
    marginHorizontal: SPACING.md,
    marginBottom: SPACING.sm,
    backgroundColor: COLORS.sageLight,
    borderRadius: RADIUS.sm,
    paddingHorizontal: SPACING.sm + 4,
    paddingVertical: SPACING.sm,
  } as ViewStyle,
  hintText: {
    fontFamily: FONTS.body,
    fontSize: 13,
    color: COLORS.sage,
    lineHeight: 18,
  } as TextStyle,
  currentContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: SPACING.md,
    paddingVertical: SPACING.sm,
  } as ViewStyle,
  currentIconImg: {
    width: 56,
    height: 56,
    marginRight: SPACING.md,
  } as ImageStyle,
  currentIconText: {
    fontSize: 48,
    marginRight: SPACING.md,
  } as TextStyle,
  currentInfo: {
    flex: 1,
  } as ViewStyle,
  currentTemp: {
    fontFamily: FONTS.header,
    fontSize: 36,
    color: COLORS.cream,
    lineHeight: 40,
  } as TextStyle,
  currentDesc: {
    fontFamily: FONTS.bodyMedium,
    fontSize: 15,
    color: COLORS.cream,
    marginTop: 2,
    textTransform: 'capitalize',
  } as TextStyle,
  feelsLike: {
    fontFamily: FONTS.body,
    fontSize: 13,
    color: COLORS.creamMuted,
    marginTop: 2,
  } as TextStyle,
  divider: {
    height: 1,
    backgroundColor: COLORS.border,
    marginHorizontal: SPACING.md,
    marginVertical: SPACING.sm,
  } as ViewStyle,
  dailyList: {
    paddingHorizontal: SPACING.md,
    paddingBottom: SPACING.md,
  } as ViewStyle,
  dailySeparator: {
    width: SPACING.sm,
  } as ViewStyle,
  dailyItem: {
    alignItems: 'center',
    paddingHorizontal: SPACING.sm,
    paddingVertical: SPACING.sm,
    backgroundColor: COLORS.bgGlass,
    borderRadius: RADIUS.md,
    minWidth: 64,
  } as ViewStyle,
  dailyDay: {
    fontFamily: FONTS.monoMedium,
    fontSize: 11,
    color: COLORS.creamSoft,
    letterSpacing: 0.5,
    textTransform: 'uppercase',
    marginBottom: SPACING.xs,
  } as TextStyle,
  dailyIconImg: {
    width: 32,
    height: 32,
    marginBottom: SPACING.xs,
  } as ImageStyle,
  dailyIconText: {
    fontSize: 24,
    marginBottom: SPACING.xs,
  } as TextStyle,
  dailyHigh: {
    fontFamily: FONTS.bodySemiBold,
    fontSize: 14,
    color: COLORS.cream,
  } as TextStyle,
  dailyLow: {
    fontFamily: FONTS.body,
    fontSize: 12,
    color: COLORS.creamMutedLight,
    marginTop: 2,
  } as TextStyle,
  popBadge: {
    marginTop: SPACING.xs,
    backgroundColor: COLORS.coralLight,
    borderRadius: RADIUS.sm,
    paddingHorizontal: 6,
    paddingVertical: 2,
  } as ViewStyle,
  popText: {
    fontFamily: FONTS.mono,
    fontSize: 9,
    color: COLORS.coral,
    letterSpacing: 0.5,
  } as TextStyle,
});
