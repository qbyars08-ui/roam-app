// =============================================================================
// PrepNavCards — quick navigation cards (Before You Land, Packing, Body Intel, etc.)
// =============================================================================
import React from 'react';
import { View, Pressable, Text, StyleSheet, type ViewStyle, type TextStyle } from 'react-native';
import { useRouter } from 'expo-router';
import {
  Plane,
  Luggage,
  Stethoscope,
  BedDouble,
  Shield,
  ChevronRight,
} from 'lucide-react-native';
import * as Haptics from '../../lib/haptics';
import { COLORS, FONTS, SPACING, RADIUS } from '../../lib/constants';
import type { Trip } from '../../lib/store';

type Props = {
  destination: string;
  activeTrip: Trip | null;
};

export default function PrepNavCards({ destination, activeTrip }: Props) {
  const router = useRouter();

  const cards = [
    ...(activeTrip ? [{
      key: 'before-you-land',
      icon: Plane,
      title: 'Before You Land',
      sub: `Pre-departure briefing for ${destination}`,
      onPress: () => router.push({ pathname: '/before-you-land', params: { destination } } as never),
      haptic: Haptics.ImpactFeedbackStyle.Medium,
    }] : []),
    {
      key: 'packing-list',
      icon: Luggage,
      title: 'Packing List',
      sub: `Smart recommendations for ${destination}`,
      onPress: () => router.push({ pathname: '/packing-list', params: { destination } } as never),
      haptic: Haptics.ImpactFeedbackStyle.Light,
    },
    {
      key: 'body-intel',
      icon: Stethoscope,
      title: 'Body Intel',
      sub: 'Destination-aware health intelligence',
      onPress: () => router.push('/body-intel' as never),
      haptic: Haptics.ImpactFeedbackStyle.Light,
    },
    {
      key: 'airport-guide',
      icon: Luggage,
      title: 'Airport Guide',
      sub: 'Layover tips, lounges, and terminal maps',
      onPress: () => router.push('/airport-guide' as never),
      haptic: Haptics.ImpactFeedbackStyle.Light,
    },
    {
      key: 'hostel-hub',
      icon: BedDouble,
      title: 'Hostel Hub',
      sub: 'Best social hostels for solo travelers',
      onPress: () => router.push({ pathname: '/hostel-hub', params: { destination } } as never),
      haptic: Haptics.ImpactFeedbackStyle.Light,
    },
    {
      key: 'safety-intel',
      icon: Shield,
      title: 'Safety Intel',
      sub: 'Neighborhoods, scams, and emergency numbers',
      onPress: () => router.push({ pathname: '/safety-intel', params: { destination } } as never),
      haptic: Haptics.ImpactFeedbackStyle.Light,
    },
  ];

  return (
    <View style={styles.container}>
      {cards.map((card) => (
        <Pressable
          key={card.key}
          onPress={() => {
            Haptics.impactAsync(card.haptic);
            card.onPress();
          }}
          style={({ pressed }) => [
            styles.prepNavCard,
            { opacity: pressed ? 0.85 : 1 },
          ]}
          accessibilityLabel={card.title}
          accessibilityRole="button"
        >
          <View style={styles.prepNavCardLeft}>
            <card.icon size={20} color={COLORS.sage} strokeWidth={1.5} />
            <View>
              <Text style={styles.prepNavCardTitle}>{card.title}</Text>
              <Text style={styles.prepNavCardSub}>{card.sub}</Text>
            </View>
          </View>
          <ChevronRight size={18} color={COLORS.muted} strokeWidth={1.5} />
        </Pressable>
      ))}
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    paddingHorizontal: 20,
    marginBottom: SPACING.lg,
    gap: SPACING.sm,
  } as ViewStyle,
  prepNavCard: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    backgroundColor: COLORS.surface1,
    borderRadius: RADIUS.md,
    borderWidth: 1,
    borderColor: COLORS.border,
    paddingVertical: 14,
    paddingHorizontal: SPACING.md,
  } as ViewStyle,
  prepNavCardLeft: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: SPACING.md,
    flex: 1,
  } as ViewStyle,
  prepNavCardTitle: {
    fontFamily: FONTS.headerMedium,
    fontSize: 15,
    color: COLORS.cream,
  } as TextStyle,
  prepNavCardSub: {
    fontFamily: FONTS.body,
    fontSize: 12,
    color: COLORS.muted,
    marginTop: 2,
  } as TextStyle,
});
