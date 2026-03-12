// =============================================================================
// ROAM — Rain Alternatives Card
// Shown on rainy itinerary days — suggests indoor options for that destination
// =============================================================================
import React from 'react';
import { View, Text, StyleSheet, type ViewStyle, type TextStyle } from 'react-native';
import { CloudRain } from 'lucide-react-native';
import { COLORS, FONTS, SPACING, RADIUS } from '../../lib/constants';
import type { WeatherDay } from '../../lib/weather';
import type { ItineraryDay } from '../../lib/types/itinerary';

// Destination-specific indoor alternatives (what locals do when it rains)
const INDOOR_ALTERNATIVES: Record<string, string[]> = {
  Tokyo: ['teamLab Planets', 'Tokyo National Museum', 'Ueno Park museums', 'covered arcades (shotengai)', 'depachika food halls', 'kissaten cafes'],
  Paris: ['Louvre', 'Musée d\'Orsay', 'covered passages (galeries)', 'Le Marais boutiques', 'food halls (La Grande Épicerie)', 'cinemas'],
  Bali: ['Ubud Art Market', 'yoga studios', 'cafes with views', 'spa and massage', 'silver workshops in Celuk'],
  'New York': ['Met Museum', 'MoMA', 'Chelsea Market', 'Grand Central', 'bookstores', 'indoor food halls'],
  Barcelona: ['Picasso Museum', 'Mercat de la Boqueria', 'MACBA', 'La Pedrera', 'Gothic Quarter shops'],
  Rome: ['Vatican Museums', 'Borghese Gallery', 'Pantheon', 'covered markets (Testaccio)', 'basilicas'],
  London: ['British Museum', 'Tate Modern', 'Borough Market', 'National Gallery', 'covered arcades'],
  Bangkok: ['malls (MBK, Siam Paragon)', 'Chatuchak (covered sections)', 'temples (Wat Pho)', 'cooking classes'],
  Marrakech: ['Jardin Majorelle', 'museums (Marrakech Museum)', 'souks (covered)', 'riad courtyards', 'hammams'],
  Lisbon: ['LX Factory', 'Mercado da Ribeira', 'Calouste Gulbenkian', 'Miradouro da Graça (indoor cafe)', 'tile museum'],
  'Mexico City': ['Museo Nacional de Antropología', 'Frida Kahlo Museum', 'Mercado Roma', 'Palacio de Bellas Artes'],
};

function getAlternativesForDestination(dest: string): string[] {
  const key = Object.keys(INDOOR_ALTERNATIVES).find(
    (k) => dest.toLowerCase().includes(k.toLowerCase())
  );
  const list = key ? INDOOR_ALTERNATIVES[key] : null;
  if (list) return list;
  return ['museums', 'covered markets', 'indoor food halls', 'bookstores', 'cafes'];
}

export interface RainAlternativesCardProps {
  day: WeatherDay;
  itineraryDay: ItineraryDay;
  destination: string;
  accentColor?: string;
}

export default function RainAlternativesCard({
  day,
  itineraryDay,
  destination,
  accentColor = COLORS.sage,
}: RainAlternativesCardProps) {
  const rainChance = Math.round(day.pop * 100);
  const isRainy = rainChance >= 40;
  if (!isRainy) return null;

  const alternatives = getAlternativesForDestination(destination);
  const preview = alternatives.slice(0, 4).join(', ');

  return (
    <View style={[styles.card, { borderColor: `${accentColor}30` }]}>
      <View style={styles.header}>
        <CloudRain size={20} color={accentColor} strokeWidth={2} />
        <Text style={[styles.title, { color: accentColor }]}>
          Rain expected ({rainChance}%) — Indoor backup for Day {itineraryDay.day}
        </Text>
      </View>
      <Text style={styles.subtitle}>
        Swap outdoor activities for:
      </Text>
      <Text style={styles.alternatives}>{preview}</Text>
      <Text style={styles.pocketTip}>
        Ask Pocket Concierge: &quot;Indoor backup if it rains today?&quot;
      </Text>
    </View>
  );
}

const styles = StyleSheet.create({
  card: {
    backgroundColor: 'rgba(124,175,138,0.08)',
    borderRadius: RADIUS.lg,
    borderWidth: 1,
    padding: SPACING.md,
    gap: SPACING.xs,
  } as ViewStyle,
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: SPACING.sm,
  } as ViewStyle,
  title: {
    fontFamily: FONTS.bodySemiBold,
    fontSize: 14,
  } as TextStyle,
  subtitle: {
    fontFamily: FONTS.body,
    fontSize: 13,
    color: COLORS.creamMuted,
    marginTop: 4,
  } as TextStyle,
  alternatives: {
    fontFamily: FONTS.body,
    fontSize: 14,
    color: COLORS.cream,
    lineHeight: 20,
  } as TextStyle,
  pocketTip: {
    fontFamily: FONTS.mono,
    fontSize: 11,
    color: 'rgba(245,237,216,0.5)',
    marginTop: SPACING.sm,
  } as TextStyle,
});
