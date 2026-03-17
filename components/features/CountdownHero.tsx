// =============================================================================
// ROAM — Countdown Hero (Plan tab)
// When trip has startDate: "[X] days until [city]", DM Mono, gold when <7 days.
// Daily brief below: Sonar + OpenWeather (different every day).
// =============================================================================
import React, { useEffect, useState } from 'react';
import { View, Text, StyleSheet, type ViewStyle, type TextStyle } from 'react-native';
import { COLORS, FONTS, SPACING } from '../../lib/constants';
import { useSonarQuery } from '../../lib/sonar';
import { getCurrentWeather, type CurrentWeather } from '../../lib/apis/openweather';
import type { Trip } from '../../lib/store';

interface CountdownHeroProps {
  trip: Trip;
  onPress?: () => void;
}

function daysUntil(startDate: string): number {
  const start = new Date(startDate);
  const today = new Date();
  start.setHours(0, 0, 0, 0);
  today.setHours(0, 0, 0, 0);
  const diff = start.getTime() - today.getTime();
  return Math.max(0, Math.ceil(diff / (1000 * 60 * 60 * 24)));
}

export default function CountdownHero({ trip, onPress }: CountdownHeroProps) {
  const startDate = trip.startDate;
  const [weather, setWeather] = useState<CurrentWeather | null>(null);

  useEffect(() => {
    if (!trip.destination) return;
    let cancelled = false;
    getCurrentWeather(trip.destination)
      .then((w) => { if (!cancelled) setWeather(w); })
      .catch(() => {});
    return () => { cancelled = true; };
  }, [trip.destination]);

  const sonar = useSonarQuery(trip.destination, 'pulse');
  const days = startDate ? daysUntil(startDate) : null;

  if (days === null || days === undefined) return null;

  const isSoon = days < 7;
  const countdownText =
    days === 0 ? `Today — ${trip.destination}` : `${days} day${days === 1 ? '' : 's'} until ${trip.destination}`;

  const briefParts: string[] = [];
  if (weather) {
    briefParts.push(`${weather.temp}°C, ${weather.condition}`);
  }
  if (sonar.data?.answer) {
    const slice = sonar.data.answer.slice(0, 100).trim();
    if (slice) briefParts.push(slice + (sonar.data.answer.length > 100 ? '…' : ''));
  }
  const dailyBrief = briefParts.length > 0 ? briefParts.join(' · ') : null;

  return (
    <View style={styles.container}>
      <Text style={[styles.countdown, isSoon && styles.countdownSoon]}>
        {countdownText}
      </Text>
      {dailyBrief ? (
        <Text style={styles.brief} numberOfLines={2}>
          {dailyBrief}
        </Text>
      ) : null}
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    marginBottom: SPACING.lg,
    paddingHorizontal: SPACING.md,
  } as ViewStyle,
  countdown: {
    fontFamily: FONTS.mono,
    fontSize: 28,
    color: COLORS.cream,
    letterSpacing: -0.5,
  } as TextStyle,
  countdownSoon: {
    color: COLORS.gold,
  } as TextStyle,
  brief: {
    fontFamily: FONTS.body,
    fontSize: 14,
    color: COLORS.creamMuted,
    marginTop: SPACING.sm,
    lineHeight: 20,
  } as TextStyle,
});
