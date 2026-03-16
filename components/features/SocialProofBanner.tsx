// =============================================================================
// ROAM — Social Proof Banner
// Motivational copy that encourages trip planning without showing fake counts.
// TODO: When live Supabase traveler_profiles data is available, optionally
// restore real counts here via getDestinationStats().
// =============================================================================
import React from 'react';
import { View, Text, StyleSheet, type TextStyle, type ViewStyle } from 'react-native';
import { COLORS, FONTS, SPACING } from '../../lib/constants';

interface SocialProofBannerProps {
  destination: string;
}

export default function SocialProofBanner({ destination }: SocialProofBannerProps) {
  return (
    <View style={styles.container}>
      <Text style={styles.text}>
        Travelers are exploring{' '}
        <Text style={styles.highlight}>{destination}</Text>
      </Text>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    paddingHorizontal: SPACING.lg,
    paddingVertical: SPACING.sm,
    marginBottom: SPACING.sm,
  } as ViewStyle,
  text: {
    fontFamily: FONTS.body,
    fontSize: 13,
    color: COLORS.creamMuted,
  } as TextStyle,
  highlight: {
    fontFamily: FONTS.bodySemiBold,
    color: COLORS.sage,
  } as TextStyle,
});
