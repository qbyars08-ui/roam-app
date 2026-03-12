// =============================================================================
// ROAM — Weather Day Strip (compact per-day forecast for itinerary)
// =============================================================================
import React from 'react';
import {
  Image,
  StyleSheet,
  Text,
  View,
  type ViewStyle,
  type TextStyle,
  type ImageStyle,
} from 'react-native';
import { COLORS, FONTS, SPACING, RADIUS } from '../../lib/constants';
import type { WeatherDay } from '../../lib/weather';
import { CloudRain, Cloud } from 'lucide-react-native';

// ---------------------------------------------------------------------------
// Types
// ---------------------------------------------------------------------------

export interface WeatherDayStripProps {
  /** Forecast for this specific day */
  day: WeatherDay;
  /** Optional label override (e.g. "Day 3") */
  label?: string;
  /** Accent color from destination theme */
  accentColor?: string;
}

// ---------------------------------------------------------------------------
// Helpers
// ---------------------------------------------------------------------------

function getDayName(dateStr: string): string {
  try {
    const date = new Date(dateStr + 'T12:00:00');
    return date.toLocaleDateString('en-US', { weekday: 'short' });
  } catch {
    return dateStr.slice(5) || '';
  }
}

// ---------------------------------------------------------------------------
// Component
// ---------------------------------------------------------------------------

export default function WeatherDayStrip({
  day,
  label,
  accentColor = COLORS.sage,
}: WeatherDayStripProps) {
  const rainChance = Math.round(day.pop * 100);
  const isRainy = rainChance >= 40;

  return (
    <View style={[styles.strip, isRainy && styles.stripRainy]}>
      <View style={styles.left}>
        <Text style={styles.dayLabel}>{label ?? getDayName(day.date)}</Text>
        <Text style={styles.dateText}>{day.date}</Text>
      </View>
      <View style={styles.center}>
        {day.icon.startsWith('http') ? (
          <Image source={{ uri: day.icon }} style={styles.icon} />
        ) : (
          <Cloud size={24} color={COLORS.creamMuted} strokeWidth={2} />
        )}
        <View style={styles.temps}>
          <Text style={styles.tempHigh}>{day.tempMax}°</Text>
          <Text style={styles.tempLow}>/ {day.tempMin}°</Text>
        </View>
      </View>
      <View style={styles.right}>
        {isRainy ? (
          <View style={[styles.rainBadge, { backgroundColor: `${accentColor}26`, borderColor: accentColor }]}>
            <CloudRain size={14} color={accentColor} strokeWidth={2} />
            <Text style={[styles.rainText, { color: accentColor }]}>{rainChance}%</Text>
          </View>
        ) : (
          <Text style={styles.desc}>{day.description}</Text>
        )}
      </View>
    </View>
  );
}

// ---------------------------------------------------------------------------
// Styles
// ---------------------------------------------------------------------------

const styles = StyleSheet.create({
  strip: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingVertical: SPACING.sm,
    paddingHorizontal: SPACING.md,
    backgroundColor: COLORS.bgGlass,
    borderRadius: RADIUS.md,
    borderWidth: 1,
    borderColor: COLORS.border,
    gap: SPACING.md,
  } as ViewStyle,
  stripRainy: {
    borderColor: 'rgba(234, 88, 84, 0.3)',
    backgroundColor: 'rgba(234, 88, 84, 0.08)',
  } as ViewStyle,
  left: {
    minWidth: 52,
  } as ViewStyle,
  dayLabel: {
    fontFamily: FONTS.monoMedium,
    fontSize: 12,
    color: COLORS.cream,
    letterSpacing: 0.5,
  } as TextStyle,
  dateText: {
    fontFamily: FONTS.mono,
    fontSize: 10,
    color: 'rgba(245,237,216,0.45)',
    marginTop: 2,
  } as TextStyle,
  center: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: SPACING.sm,
  } as ViewStyle,
  icon: {
    width: 36,
    height: 36,
  } as ImageStyle,
  iconEmoji: {
    fontSize: 28,
  } as TextStyle,
  temps: {
    flexDirection: 'row',
    alignItems: 'baseline',
  } as ViewStyle,
  tempHigh: {
    fontFamily: FONTS.bodySemiBold,
    fontSize: 16,
    color: COLORS.cream,
  } as TextStyle,
  tempLow: {
    fontFamily: FONTS.body,
    fontSize: 14,
    color: 'rgba(245,237,216,0.5)',
    marginLeft: 2,
  } as TextStyle,
  right: {
    flex: 1,
    alignItems: 'flex-end',
  } as ViewStyle,
  rainBadge: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
    paddingHorizontal: SPACING.sm,
    paddingVertical: 4,
    borderRadius: RADIUS.sm,
    borderWidth: 1,
  } as ViewStyle,
  rainText: {
    fontFamily: FONTS.mono,
    fontSize: 12,
  } as TextStyle,
  desc: {
    fontFamily: FONTS.body,
    fontSize: 12,
    color: 'rgba(245,237,216,0.6)',
    textAlign: 'right',
    textTransform: 'capitalize',
  } as TextStyle,
});
