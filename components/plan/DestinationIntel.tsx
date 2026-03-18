// =============================================================================
// ROAM — DestinationIntel (weather, events, Sonar intel block)
// =============================================================================
import React from 'react';
import { Pressable, StyleSheet, Text, View, type TextStyle, type ViewStyle } from 'react-native';
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
    <View style={styles.destIntel}>
      <Pressable
        onPress={() => {
          Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
          router.push({ pathname: '/destination/[name]', params: { name: destination } } as never);
        }}
        style={({ pressed }) => [{ opacity: pressed ? 0.8 : 1 }]}
      >
        <Text style={styles.destIntelLabel}>DESTINATION INTEL</Text>
        <View style={{ flexDirection: 'row', alignItems: 'center', gap: SPACING.xs }}>
          <Text style={styles.destIntelHeading}>{destination}</Text>
          <ChevronRight size={18} color={COLORS.sage} strokeWidth={1.5} />
        </View>
      </Pressable>

      {weather && (
        <View style={styles.destIntelCard}>
          <Text style={styles.destIntelCardTitle}>Weather Now</Text>
          <Text style={styles.destIntelWeather}>{weather.temp}°C · {weather.condition}</Text>
          <Text style={styles.destIntelMeta}>Humidity {weather.humidity}% · Wind {weather.windSpeed} km/h</Text>
        </View>
      )}

      {sonarData && (
        <View style={styles.destIntelCard}>
          <View style={{ flexDirection: 'row', alignItems: 'center', gap: 8 }}>
            <Text style={styles.destIntelCardTitle}>Live Intel</Text>
            {sonarIsLive && <LiveBadge />}
          </View>
          <Text style={styles.destIntelBody}>{sonarData.answer}</Text>
          {sonarCitations.length > 0 && <SourceCitation citations={sonarCitations} />}
        </View>
      )}

      {events && events.length > 0 && (
        <View style={styles.destIntelCard}>
          <Text style={styles.destIntelCardTitle}>Upcoming Events</Text>
          {events.map((evt) => (
            <Text key={evt.id} style={styles.destIntelEvent}>· {evt.name}{evt.date ? ` — ${new Date(evt.date).toLocaleDateString()}` : ''}</Text>
          ))}
        </View>
      )}
    </View>
  );
}

// ---------------------------------------------------------------------------
// Styles
// ---------------------------------------------------------------------------
const styles = StyleSheet.create({
  destIntel: {
    paddingTop: SPACING.xl,
    gap: SPACING.sm,
    marginBottom: SPACING.lg,
  } as ViewStyle,
  destIntelLabel: {
    fontFamily: FONTS.mono,
    fontSize: 11,
    color: COLORS.sage,
    letterSpacing: 2,
  } as TextStyle,
  destIntelHeading: {
    fontFamily: FONTS.header,
    fontSize: 26,
    color: COLORS.cream,
    letterSpacing: -0.5,
  } as TextStyle,
  destIntelCard: {
    backgroundColor: COLORS.surface1,
    borderRadius: RADIUS.lg,
    padding: SPACING.md,
    gap: 6,
    marginTop: SPACING.sm,
  } as ViewStyle,
  destIntelCardTitle: {
    fontFamily: FONTS.bodyMedium,
    fontSize: 13,
    color: COLORS.sage,
    letterSpacing: 0.5,
  } as TextStyle,
  destIntelWeather: {
    fontFamily: FONTS.header,
    fontSize: 20,
    color: COLORS.cream,
  } as TextStyle,
  destIntelMeta: {
    fontFamily: FONTS.mono,
    fontSize: 11,
    color: COLORS.creamDim,
  } as TextStyle,
  destIntelBody: {
    fontFamily: FONTS.body,
    fontSize: 14,
    color: COLORS.cream,
    lineHeight: 20,
  } as TextStyle,
  destIntelEvent: {
    fontFamily: FONTS.body,
    fontSize: 13,
    color: COLORS.creamDim,
    lineHeight: 18,
  } as TextStyle,
});
