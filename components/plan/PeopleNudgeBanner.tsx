// =============================================================================
// ROAM — PeopleNudgeBanner (social proof for latest destination)
// =============================================================================
import React from 'react';
import { Pressable, StyleSheet, Text, View, type TextStyle, type ViewStyle } from 'react-native';
import { Users } from 'lucide-react-native';
import * as Haptics from '../../lib/haptics';
import { COLORS, FONTS, SPACING, RADIUS } from '../../lib/constants';

// ---------------------------------------------------------------------------
// Props
// ---------------------------------------------------------------------------
export interface PeopleNudgeBannerProps {
  destination: string;
  onTap: () => void;
  onDismiss: () => void;
}

// ---------------------------------------------------------------------------
// Component
// ---------------------------------------------------------------------------
export default function PeopleNudgeBanner({ destination, onTap, onDismiss }: PeopleNudgeBannerProps) {
  return (
    <Pressable
      onPress={() => {
        Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
        onTap();
      }}
      accessibilityLabel={`See who else is heading to ${destination}`}
      accessibilityRole="button"
      style={({ pressed }) => [styles.peopleBanner, { opacity: pressed ? 0.85 : 1 }]}
    >
      <View style={styles.peopleBannerLeft}>
        <Users size={16} color={COLORS.sage} strokeWidth={1.5} />
        <Text style={styles.peopleBannerText}>
          See who else is heading to{' '}
          <Text style={styles.peopleBannerBold}>{destination}</Text>
        </Text>
      </View>
      <Pressable
        onPress={() => {
          Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
          onDismiss();
        }}
        hitSlop={12}
        accessibilityLabel="Dismiss people nudge"
        accessibilityRole="button"
        style={styles.peopleBannerDismiss}
      >
        <Text style={styles.peopleBannerDismissText}>✕</Text>
      </Pressable>
    </Pressable>
  );
}

// ---------------------------------------------------------------------------
// Styles
// ---------------------------------------------------------------------------
const styles = StyleSheet.create({
  peopleBanner: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    backgroundColor: COLORS.bgMagazine,
    borderRadius: RADIUS.lg,
    borderLeftWidth: 3,
    borderLeftColor: COLORS.sage,
    paddingHorizontal: 20,
    paddingVertical: 14,
    marginBottom: SPACING.lg,
  } as ViewStyle,
  peopleBannerLeft: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: SPACING.sm,
    flex: 1,
  } as ViewStyle,
  peopleBannerText: {
    fontFamily: FONTS.body,
    fontSize: 13,
    color: COLORS.creamMuted,
    flex: 1,
  } as TextStyle,
  peopleBannerBold: {
    fontFamily: FONTS.bodySemiBold,
    color: COLORS.sage,
  } as TextStyle,
  peopleBannerDismiss: {
    paddingLeft: SPACING.sm,
  } as ViewStyle,
  peopleBannerDismissText: {
    fontFamily: FONTS.mono,
    fontSize: 12,
    color: COLORS.creamMuted,
  } as TextStyle,
});
