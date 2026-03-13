// =============================================================================
// ROAM — Trip Insurance Affiliate (Safetywing + World Nomads)
// Show on every itinerary
// =============================================================================
import React from 'react';
import { View, Text, Pressable, StyleSheet, Linking } from 'react-native';
import { Shield } from 'lucide-react-native';
import * as Haptics from '../../lib/haptics';
import { COLORS, FONTS, SPACING, RADIUS } from '../../lib/constants';
const SAFETYWING_URL = (dest: string) =>
  `https://safetywing.com/nomad-insurance?referenceID=roam&utm_source=roam&utm_medium=app&utm_campaign=${encodeURIComponent(dest.toLowerCase())}`;

const WORLDNOMADS_URL = (dest: string) =>
  `https://www.worldnomads.com/travel-insurance/?ref=roam&utm_source=roam&utm_medium=app&utm_campaign=${encodeURIComponent(dest.toLowerCase())}`;

interface TripInsuranceCardsProps {
  destination: string;
}

function InsuranceCard({
  name,
  tagline,
  gradientColors,
  url,
  onPress,
}: {
  name: string;
  tagline: string;
  gradientColors: [string, string];
  url: string;
  onPress: () => void;
}) {
  return (
    <Pressable
      onPress={() => {
        Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
        Linking.openURL(url).catch(() => {});
      }}
      style={({ pressed }) => [styles.card, { opacity: pressed ? 0.9 : 1 }]}
    >
      <View style={[styles.cardInner, { borderLeftColor: gradientColors[0] }]}>
        <Shield size={20} color={gradientColors[0]} strokeWidth={2} />
        <View style={styles.cardText}>
          <Text style={styles.cardTitle}>{name}</Text>
          <Text style={styles.cardTagline}>{tagline}</Text>
        </View>
        <Text style={styles.arrow}>→</Text>
      </View>
    </Pressable>
  );
}

export default function TripInsuranceCards({ destination }: TripInsuranceCardsProps) {
  return (
    <View style={styles.wrap}>
      <Text style={styles.label}>TRAVEL INSURANCE</Text>
      <InsuranceCard
        name="Safetywing"
        tagline="Nomad insurance — global coverage from ~$1/day"
        gradientColors={[COLORS.blueGradientStart, COLORS.blueGradientEnd]}
        url={SAFETYWING_URL(destination)}
        onPress={() => {}}
      />
      <InsuranceCard
        name="World Nomads"
        tagline="Adventure & medical — 150+ activities covered"
        gradientColors={[COLORS.emeraldStart, COLORS.emeraldEnd]}
        url={WORLDNOMADS_URL(destination)}
        onPress={() => {}}
      />
    </View>
  );
}

const styles = StyleSheet.create({
  wrap: { gap: SPACING.sm },
  label: {
    fontFamily: FONTS.mono,
    fontSize: 11,
    color: COLORS.creamMuted,
    letterSpacing: 1,
    marginBottom: 4,
  },
  card: {
    backgroundColor: COLORS.bgGlass,
    borderRadius: RADIUS.md,
    borderWidth: 1,
    borderColor: COLORS.border,
    overflow: 'hidden',
  },
  cardInner: {
    flexDirection: 'row',
    alignItems: 'center',
    padding: SPACING.md,
    gap: SPACING.sm,
    borderLeftWidth: 3,
  },
  cardText: { flex: 1 },
  cardTitle: {
    fontFamily: FONTS.bodySemiBold,
    fontSize: 15,
    color: COLORS.cream,
  },
  cardTagline: {
    fontFamily: FONTS.body,
    fontSize: 12,
    color: COLORS.creamMuted,
    marginTop: 2,
  },
  arrow: {
    fontFamily: FONTS.body,
    fontSize: 18,
    color: COLORS.creamMuted,
  },
});
