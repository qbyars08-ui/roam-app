// =============================================================================
// ROAM — ReturnedSection (RETURNED state — Trip Wrapped, journal links)
// =============================================================================
import React from 'react';
import { Pressable, StyleSheet, Text, View, type TextStyle, type ViewStyle } from 'react-native';
import { useTranslation } from 'react-i18next';
import { COLORS, FONTS, SPACING, RADIUS } from '../../lib/constants';
import type { Trip } from '../../lib/store';

// ---------------------------------------------------------------------------
// Props
// ---------------------------------------------------------------------------
export interface ReturnedSectionProps {
  activeTrip: Trip;
  onWrappedPress: () => void;
  onJournalPress: () => void;
}

// ---------------------------------------------------------------------------
// Component
// ---------------------------------------------------------------------------
export default function ReturnedSection({ activeTrip, onWrappedPress, onJournalPress }: ReturnedSectionProps) {
  const { t } = useTranslation();

  return (
    <View style={styles.returnedContainer}>
      <Text style={styles.returnedHeader}>
        {t('plan.returned.welcome', { defaultValue: 'Welcome back from {{destination}}', destination: activeTrip.destination })}
      </Text>
      <Pressable
        onPress={onWrappedPress}
        accessibilityLabel={t('plan.returned.wrapped', { defaultValue: 'See your trip wrapped' })}
        accessibilityRole="button"
        style={({ pressed }) => [styles.returnedLink, { opacity: pressed ? 0.75 : 1 }]}
      >
        <Text style={styles.returnedLinkText}>
          {t('plan.returned.wrapped', { defaultValue: 'See your trip wrapped' })}
          {' \u2192'}
        </Text>
      </Pressable>
      <Pressable
        onPress={onJournalPress}
        accessibilityLabel={t('plan.returned.journal', { defaultValue: 'Read your story' })}
        accessibilityRole="button"
        style={({ pressed }) => [styles.returnedLink, { opacity: pressed ? 0.75 : 1 }]}
      >
        <Text style={styles.returnedLinkText}>
          {t('plan.returned.journal', { defaultValue: 'Read your story' })}
          {' \u2192'}
        </Text>
      </Pressable>
    </View>
  );
}

// ---------------------------------------------------------------------------
// Styles
// ---------------------------------------------------------------------------
const styles = StyleSheet.create({
  returnedContainer: {
    marginBottom: SPACING.lg,
    paddingVertical: SPACING.md,
    paddingHorizontal: SPACING.md,
    borderRadius: RADIUS.lg,
    backgroundColor: COLORS.surface1,
    borderLeftWidth: 3,
    borderLeftColor: COLORS.gold,
  } as ViewStyle,
  returnedHeader: {
    fontFamily: FONTS.header,
    fontSize: 22,
    color: COLORS.cream,
    letterSpacing: -0.3,
    marginBottom: SPACING.md,
  } as TextStyle,
  returnedLink: {
    paddingVertical: SPACING.sm,
  } as ViewStyle,
  returnedLinkText: {
    fontFamily: FONTS.bodyMedium,
    fontSize: 15,
    color: COLORS.gold,
  } as TextStyle,
});
