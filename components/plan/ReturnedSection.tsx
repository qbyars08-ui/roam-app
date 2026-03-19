// =============================================================================
// ROAM — ReturnedSection (RETURNED state — welcome back, wrapped, journal)
// Clean, warm, minimal. One headline, two clear actions.
// =============================================================================
import React from 'react';
import {
  Image,
  Pressable,
  StyleSheet,
  Text,
  View,
  type ImageStyle,
  type TextStyle,
  type ViewStyle,
} from 'react-native';
import { LinearGradient } from 'expo-linear-gradient';
import { ChevronRight } from 'lucide-react-native';
import { useTranslation } from 'react-i18next';
import { COLORS, FONTS, SPACING, RADIUS } from '../../lib/constants';
import type { Trip } from '../../lib/store';
import { DEST_IMAGES, FALLBACK_IMAGE } from './plan-helpers';

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
  const imageUrl = DEST_IMAGES[activeTrip.destination] ?? FALLBACK_IMAGE;

  return (
    <View style={styles.container}>
      {/* Headline */}
      <Text style={styles.headline}>
        {t('plan.returned.welcome', {
          defaultValue: 'Welcome back from {{destination}}.',
          destination: activeTrip.destination,
        })}
      </Text>

      {/* Trip Wrapped card */}
      <Pressable
        onPress={onWrappedPress}
        accessibilityLabel={t('plan.returned.wrapped', { defaultValue: 'Relive your trip' })}
        accessibilityRole="button"
        style={({ pressed }) => [styles.wrappedCard, { transform: [{ scale: pressed ? 0.98 : 1 }] }]}
      >
        <Image
          source={{ uri: imageUrl }}
          style={styles.wrappedImage}
          resizeMode="cover"
        />
        <LinearGradient
          colors={['transparent', COLORS.overlayStrong]}
          locations={[0.3, 1]}
          style={StyleSheet.absoluteFill}
        />
        <View style={styles.wrappedContent}>
          <Text style={styles.wrappedLabel}>
            {t('plan.returned.relive', { defaultValue: 'Relive your trip' })}
          </Text>
          <ChevronRight size={18} color={COLORS.cream} strokeWidth={1.5} />
        </View>
      </Pressable>

      {/* Journal link */}
      <Pressable
        onPress={onJournalPress}
        accessibilityLabel={t('plan.returned.journal', { defaultValue: 'Read your story' })}
        accessibilityRole="button"
        style={({ pressed }) => [styles.journalLink, { opacity: pressed ? 0.7 : 1 }]}
      >
        <Text style={styles.journalLinkText}>
          {t('plan.returned.journal', { defaultValue: 'Read your story' })}
        </Text>
        <ChevronRight size={16} color={COLORS.muted} strokeWidth={1.5} />
      </Pressable>
    </View>
  );
}

// ---------------------------------------------------------------------------
// Styles
// ---------------------------------------------------------------------------
const styles = StyleSheet.create({
  container: {
    marginBottom: SPACING.xxl,
    gap: SPACING.lg,
  } as ViewStyle,

  headline: {
    fontFamily: FONTS.header,
    fontSize: 24,
    color: COLORS.cream,
    letterSpacing: -0.3,
    lineHeight: 30,
  } as TextStyle,

  wrappedCard: {
    height: 200,
    borderRadius: RADIUS.lg,
    overflow: 'hidden',
  } as ViewStyle,
  wrappedImage: {
    ...StyleSheet.absoluteFillObject,
    width: '100%',
    height: '100%',
  } as ImageStyle,
  wrappedContent: {
    position: 'absolute',
    bottom: 0,
    left: 0,
    right: 0,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    padding: SPACING.lg,
  } as ViewStyle,
  wrappedLabel: {
    fontFamily: FONTS.header,
    fontSize: 18,
    color: COLORS.cream,
  } as TextStyle,

  journalLink: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingVertical: SPACING.md,
    borderTopWidth: 1,
    borderTopColor: COLORS.border,
  } as ViewStyle,
  journalLinkText: {
    fontFamily: FONTS.bodyMedium,
    fontSize: 15,
    color: COLORS.muted,
  } as TextStyle,
});
