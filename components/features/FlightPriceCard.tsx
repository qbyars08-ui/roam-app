// =============================================================================
// ROAM — Flight Price Card
// Compact card with "See flights" CTA to Skyscanner affiliate
// P0: Live price display deferred (requires partner API)
// =============================================================================

import React from 'react';
import { View, Text, Pressable, StyleSheet, Linking, type ViewStyle } from 'react-native';
import { Plane } from 'lucide-react-native';
import { COLORS, FONTS, SPACING, RADIUS } from '../../lib/constants';
import { AFFILIATES } from '../../lib/constants';
import { buildAffiliateUrl, trackAffiliateClick } from '../../lib/affiliate-tracking';
import { captureEvent } from '../../lib/posthog';
import { EVENTS } from '../../lib/posthog-events';

interface FlightPriceCardProps {
  origin?: string;
  destination: string;
  placement?: string;
}

export default function FlightPriceCard({
  origin = 'Your city',
  destination,
  placement = 'itinerary',
}: FlightPriceCardProps) {
  const skyscannerUrl = buildAffiliateUrl({
    partner: 'skyscanner',
    baseUrl: AFFILIATES.skyscanner,
    destination,
    placement,
  });

  const handlePress = async () => {
    await trackAffiliateClick({
      partner: 'skyscanner',
      destination,
      placement,
      url: skyscannerUrl,
    });
    captureEvent(EVENTS.AFFILIATE_CLICK.name, {
      partner: 'skyscanner',
      destination,
      placement,
      url: skyscannerUrl,
    });
    Linking.openURL(skyscannerUrl).catch(() => {});
  };

  return (
    <Pressable
      onPress={handlePress}
      style={({ pressed }) => [
        styles.card,
        { opacity: pressed ? 0.9 : 1 },
      ]}
    >
      <View style={styles.row}>
        <Plane size={20} color={COLORS.sage} strokeWidth={2} />
        <View style={styles.content}>
          <Text style={styles.route}>
            {origin} to {destination}
          </Text>
          <Text style={styles.cta}>See flights</Text>
        </View>
      </View>
    </Pressable>
  );
}

const styles = StyleSheet.create({
  card: {
    backgroundColor: COLORS.bgGlass,
    borderRadius: RADIUS.md,
    borderWidth: 1,
    borderColor: COLORS.border,
    padding: SPACING.md,
  } as ViewStyle,
  row: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: SPACING.md,
  } as ViewStyle,
  content: { flex: 1 } as ViewStyle,
  route: {
    fontFamily: FONTS.body,
    fontSize: 14,
    color: COLORS.cream,
  },
  cta: {
    fontFamily: FONTS.bodyMedium,
    fontSize: 13,
    color: COLORS.sage,
    marginTop: 2,
  },
});
