// =============================================================================
// ROAM — Carbon Footprint Card
// Flight emissions + offset option
// =============================================================================
import React, { useEffect, useState } from 'react';
import { View, Text, StyleSheet, Linking, Pressable } from 'react-native';
import { Leaf } from 'lucide-react-native';
import { COLORS, FONTS, SPACING, RADIUS } from '../../lib/constants';
import { estimateFlightEmissions, type CarbonEstimate } from '../../lib/carbon-footprint';

interface CarbonFootprintCardProps {
  origin: string;
  destination: string;
  roundTrip?: boolean;
}

export default function CarbonFootprintCard({
  origin,
  destination,
  roundTrip = true,
}: CarbonFootprintCardProps) {
  const [estimate, setEstimate] = useState<CarbonEstimate | null>(null);

  useEffect(() => {
    estimateFlightEmissions(origin, destination, roundTrip).then(setEstimate);
  }, [origin, destination, roundTrip]);

  if (!estimate) return null;

  return (
    <View style={styles.card}>
      <Leaf size={20} color={COLORS.carbonGreen} strokeWidth={2} />
      <View style={styles.content}>
        <Text style={styles.title}>Carbon footprint</Text>
        <Text style={styles.amount}>
          This trip ≈ {estimate.tonnesCO2} tonnes CO2
        </Text>
        {estimate.offsetCost ? (
          <Pressable
            onPress={() =>
              Linking.openURL('https://www.goldstandard.org/take-action/offset-emissions')
            }
            style={({ pressed }) => [styles.offsetBtn, { opacity: pressed ? 0.8 : 1 }]}
          >
            <Text style={styles.offsetText}>
              Offset for ~${estimate.offsetCost} (plants trees via Gold Standard)
            </Text>
          </Pressable>
        ) : null}
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  card: {
    flexDirection: 'row',
    alignItems: 'flex-start',
    padding: SPACING.md,
    backgroundColor: COLORS.bgGlass,
    borderRadius: RADIUS.lg,
    borderWidth: 1,
    borderColor: COLORS.border,
    gap: SPACING.md,
  },
  content: { flex: 1 },
  title: {
    fontFamily: FONTS.bodySemiBold,
    fontSize: 14,
    color: COLORS.creamMuted,
  },
  amount: {
    fontFamily: FONTS.bodySemiBold,
    fontSize: 16,
    color: COLORS.cream,
    marginTop: 4,
  },
  offsetBtn: {
    marginTop: 8,
    paddingVertical: 6,
    paddingHorizontal: 10,
    backgroundColor: COLORS.carbonGreenBg,
    borderRadius: RADIUS.md,
    alignSelf: 'flex-start',
  },
  offsetText: {
    fontFamily: FONTS.bodySemiBold,
    fontSize: 13,
    color: COLORS.carbonGreen,
  },
});
