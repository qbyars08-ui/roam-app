// =============================================================================
// PrepNavCards — navigation cards with consistent style, sage border on press
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
            styles.navCard,
            pressed && styles.navCardPressed,
          ]}
          accessibilityLabel={card.title}
          accessibilityRole="button"
        >
          <View style={styles.navCardLeft}>
            <card.icon size={20} color={COLORS.sage} strokeWidth={1.5} />
            <View style={{ flex: 1 }}>
              <Text style={styles.navCardTitle}>{card.title}</Text>
              <Text style={styles.navCardSub}>{card.sub}</Text>
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
  navCard: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    backgroundColor: COLORS.surface1,
    borderRadius: RADIUS.lg,
    borderWidth: 1,
    borderColor: COLORS.border,
    paddingVertical: SPACING.md,
    paddingHorizontal: SPACING.lg,
  } as ViewStyle,
  navCardPressed: {
    borderColor: COLORS.sageBorder,
  } as ViewStyle,
  navCardLeft: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: SPACING.md,
    flex: 1,
  } as ViewStyle,
  navCardTitle: {
    fontFamily: FONTS.headerMedium,
    fontSize: 15,
    color: COLORS.cream,
  } as TextStyle,
  navCardSub: {
    fontFamily: FONTS.body,
    fontSize: 12,
    color: COLORS.muted,
    marginTop: 2,
  } as TextStyle,
});
