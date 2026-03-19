// =============================================================================
// ROAM — DestinationIntel (weather, events, Sonar intel — clean cards)
// =============================================================================
import React from 'react';
import { Linking, Pressable, StyleSheet, Text, View, type TextStyle, type ViewStyle } from 'react-native';
import { useRouter } from 'expo-router';
import { ChevronRight } from 'lucide-react-native';
import * as Haptics from '../../lib/haptics';
import { COLORS, FONTS, SPACING, RADIUS } from '../../lib/constants';
import type { CurrentWeather } from '../../lib/apis/openweather';
import type { EventResult } from '../../lib/apis/eventbrite';
import type { SonarCitation } from '../../lib/types/sonar';
import LiveBadge from '../../components/ui/LiveBadge';
import SourceCitation from '../../components/ui/SourceCitation';

// ---------------------------------------------------------------------------
// Props
// ---------------------------------------------------------------------------
export interface DestinationIntelProps {
  destination: string;
  weather: CurrentWeather | null;
  sonarData: { answer: string } | null;
  sonarIsLive: boolean;
  sonarCitations: SonarCitation[];
  events: EventResult[] | null;
}

// ---------------------------------------------------------------------------
// Component
// ---------------------------------------------------------------------------
export default function DestinationIntel({
  destination,
  weather,
  sonarData,
  sonarIsLive,
  sonarCitations,
  events,
}: DestinationIntelProps) {
  const router = useRouter();

  return (
    <View style={styles.container}>
      <Pressable
        onPress={() => {
          Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
          router.push({ pathname: '/destination/[name]', params: { name: destination } } as never);
        }}
        style={({ pressed }) => [styles.headerPress, { opacity: pressed ? 0.8 : 1 }]}
      >
        <Text style={styles.sectionLabel}>DESTINATION INTEL</Text>
        <View style={styles.headingRow}>
          <Text style={styles.heading}>{destination}</Text>
          <ChevronRight size={18} color={COLORS.sage} strokeWidth={1.5} />
        </View>
      </Pressable>

      {weather && (
        <Pressable
          style={({ pressed }) => [styles.card, { opacity: pressed ? 0.85 : 1 }]}
          onPress={() => {
            Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
            router.push({ pathname: '/destination/[name]', params: { name: destination } } as never);
          }}
          accessibilityLabel={`Weather in ${destination}: ${weather.temp} C, ${weather.condition}`}
          accessibilityRole="button"
        >
          <Text style={styles.cardTitle}>Weather Now</Text>
          <Text style={styles.weatherValue}>{weather.temp}°C · {weather.condition}</Text>
          <Text style={styles.cardMeta}>Humidity {weather.humidity}% · Wind {weather.windSpeed} km/h</Text>
        </Pressable>
      )}

      {sonarData && (
        <Pressable
          style={({ pressed }) => [styles.card, { opacity: pressed ? 0.85 : 1 }]}
          onPress={() => {
            Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
            router.push({ pathname: '/destination/[name]', params: { name: destination } } as never);
          }}
          accessibilityLabel={`Live intel for ${destination}`}
          accessibilityRole="button"
        >
          <View style={styles.liveRow}>
            <Text style={styles.cardTitle}>Live Intel</Text>
            {sonarIsLive && <LiveBadge />}
          </View>
          <Text style={styles.cardBody}>{sonarData.answer}</Text>
          {sonarCitations.length > 0 && <SourceCitation citations={sonarCitations} />}
        </Pressable>
      )}

      {events && events.length > 0 && (
        <Pressable
          style={({ pressed }) => [styles.card, { opacity: pressed ? 0.85 : 1 }]}
          onPress={() => {
            Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
            Linking.openURL(`https://www.eventbrite.com/d/${encodeURIComponent(destination)}/events/`).catch(() => {});
          }}
          accessibilityLabel={`Upcoming events in ${destination}`}
          accessibilityRole="button"
        >
          <Text style={styles.cardTitle}>Upcoming Events</Text>
          {events.map((evt) => (
            <Text key={evt.id} style={styles.eventItem}>
              · {evt.name}{evt.date ? ` \u2014 ${new Date(evt.date).toLocaleDateString()}` : ''}
            </Text>
          ))}
        </Pressable>
      )}
    </View>
  );
}

// ---------------------------------------------------------------------------
// Styles
// ---------------------------------------------------------------------------
const styles = StyleSheet.create({
  container: {
    paddingTop: SPACING.xxl,
    gap: SPACING.md,
    marginBottom: SPACING.xxl,
  } as ViewStyle,
  headerPress: {} as ViewStyle,
  sectionLabel: {
    fontFamily: FONTS.mono,
    fontSize: 11,
    color: COLORS.sage,
    letterSpacing: 2,
  } as TextStyle,
  headingRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: SPACING.xs,
    marginTop: 2,
  } as ViewStyle,
  heading: {
    fontFamily: FONTS.header,
    fontSize: 26,
    color: COLORS.cream,
    letterSpacing: -0.5,
  } as TextStyle,

  card: {
    backgroundColor: COLORS.surface1,
    borderRadius: RADIUS.lg,
    padding: SPACING.lg,
    gap: SPACING.xs,
    borderWidth: 1,
    borderColor: COLORS.border,
  } as ViewStyle,
  cardTitle: {
    fontFamily: FONTS.bodyMedium,
    fontSize: 13,
    color: COLORS.sage,
    letterSpacing: 0.3,
  } as TextStyle,
  weatherValue: {
    fontFamily: FONTS.header,
    fontSize: 20,
    color: COLORS.cream,
  } as TextStyle,
  cardMeta: {
    fontFamily: FONTS.mono,
    fontSize: 11,
    color: COLORS.muted,
  } as TextStyle,
  liveRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: SPACING.sm,
  } as ViewStyle,
  cardBody: {
    fontFamily: FONTS.body,
    fontSize: 14,
    color: COLORS.cream,
    lineHeight: 20,
  } as TextStyle,
  eventItem: {
    fontFamily: FONTS.body,
    fontSize: 13,
    color: COLORS.muted,
    lineHeight: 18,
  } as TextStyle,
});
