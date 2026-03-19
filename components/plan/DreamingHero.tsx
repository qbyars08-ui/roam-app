// =============================================================================
// ROAM — DreamingSection (DREAMING state full-screen hero)
// Typewriter cities, destination photo cards, CTA buttons.
// Never shows blank space — always beautiful, always helpful.
// =============================================================================
import React, { useCallback } from 'react';
import {
  Image,
  Pressable,
  ScrollView,
  StyleSheet,
  Text,
  View,
  type ImageStyle,
  type TextStyle,
  type ViewStyle,
} from 'react-native';
import { useRouter } from 'expo-router';
import { ChevronRight, Heart, MapPin } from 'lucide-react-native';
import { LinearGradient } from 'expo-linear-gradient';
import { useTranslation } from 'react-i18next';
import * as Haptics from '../../lib/haptics';
import { COLORS, FONTS, SPACING, RADIUS, DESTINATION_HERO_PHOTOS } from '../../lib/constants';

// ---------------------------------------------------------------------------
// Hardcoded popular destinations — always visible, never blank
// ---------------------------------------------------------------------------
const POPULAR_DESTINATIONS = [
  { label: 'Tokyo', hook: 'Neon streets, ramen alleys', photo: DESTINATION_HERO_PHOTOS['Tokyo'] },
  { label: 'Bali', hook: 'Temples, rice terraces, surf', photo: DESTINATION_HERO_PHOTOS['Bali'] },
  { label: 'Paris', hook: 'Croissants, the Marais, light', photo: DESTINATION_HERO_PHOTOS['Paris'] },
  { label: 'Barcelona', hook: 'Tapas at 10pm, beach days', photo: DESTINATION_HERO_PHOTOS['Barcelona'] },
  { label: 'Lisbon', hook: 'Tiles, trams, pastel de nata', photo: DESTINATION_HERO_PHOTOS['Lisbon'] },
  { label: 'Mexico City', hook: 'Mezcal, murals, mole', photo: DESTINATION_HERO_PHOTOS['Mexico City'] },
];

// ---------------------------------------------------------------------------
// Props
// ---------------------------------------------------------------------------
export interface DreamingHeroProps {
  cityLabel: string;
  onQuickTrip: () => void;
  onPlanTogether: () => void;
  /** Personalized greeting from TravelerDNA engine — overrides default headline */
  personalizedGreeting?: string;
}

// ---------------------------------------------------------------------------
// Component
// ---------------------------------------------------------------------------
export default function DreamingHero({ cityLabel, onQuickTrip, onPlanTogether, personalizedGreeting }: DreamingHeroProps) {
  const { t } = useTranslation();
  const router = useRouter();

  const headline = personalizedGreeting ?? t('plan.dreaming.headline', { defaultValue: 'Where are you going?' });

  const handleDestinationPress = useCallback((destination: string) => {
    Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
    router.push({ pathname: '/destination/[name]', params: { name: destination } } as never);
  }, [router]);

  return (
    <View style={styles.dreamingContainer}>
      <Text style={styles.dreamingHeadline}>
        {headline}
      </Text>
      <Text style={styles.dreamingTypewriter}>{cityLabel}</Text>

      {/* ── Destination Photo Cards (always visible) ── */}
      <ScrollView
        horizontal
        showsHorizontalScrollIndicator={false}
        contentContainerStyle={styles.destCardsScroll}
        style={styles.destCardsContainer}
      >
        {POPULAR_DESTINATIONS.map((dest) => (
          <Pressable
            key={dest.label}
            onPress={() => handleDestinationPress(dest.label)}
            accessibilityLabel={`${dest.label} - ${dest.hook}`}
            accessibilityRole="button"
            style={({ pressed }) => [
              styles.destCard,
              { transform: [{ scale: pressed ? 0.97 : 1 }] },
            ]}
          >
            <Image
              source={{ uri: dest.photo }}
              style={styles.destCardImage}
              resizeMode="cover"
            />
            <LinearGradient
              colors={['transparent', COLORS.overlayDark]}
              locations={[0.3, 1]}
              style={StyleSheet.absoluteFill}
            />
            <View style={styles.destCardContent}>
              <View style={styles.destCardPinRow}>
                <MapPin size={12} color={COLORS.sage} strokeWidth={1.5} />
                <Text style={styles.destCardLabel}>{dest.label}</Text>
              </View>
              <Text style={styles.destCardHook} numberOfLines={1}>{dest.hook}</Text>
            </View>
          </Pressable>
        ))}
      </ScrollView>

      {/* ── CTA Buttons ── */}
      <View style={styles.dreamingButtons}>
        <Pressable
          onPress={onPlanTogether}
          accessibilityLabel={t('plan.dreaming.planTogether', { defaultValue: 'Plan Together' })}
          accessibilityRole="button"
          style={({ pressed }) => [styles.dreamingBtn, styles.dreamingBtnSage, { opacity: pressed ? 0.85 : 1 }]}
        >
          <Text style={[styles.dreamingBtnText, styles.dreamingBtnTextSage]}>
            {t('plan.dreaming.planTogether', { defaultValue: 'Plan Together' })}
          </Text>
        </Pressable>
      </View>
      <Pressable
        onPress={onQuickTrip}
        accessibilityLabel={t('plan.dreaming.quickTrip', { defaultValue: 'Quick Trip' })}
        accessibilityRole="button"
        style={({ pressed }) => [styles.dreamingQuickLink, { opacity: pressed ? 0.6 : 1 }]}
      >
        <Text style={styles.dreamingQuickLinkText}>
          {t('plan.dreaming.orQuickTrip', { defaultValue: 'or try Quick Trip' })}
        </Text>
      </Pressable>
      {/* Dream Board link */}
      <Pressable
        onPress={() => {
          Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light).catch(() => {});
          router.push('/dream-board' as never);
        }}
        accessibilityLabel={t('plan.dreamBoard', { defaultValue: 'Dream Board' })}
        accessibilityRole="button"
        style={({ pressed }) => [styles.dreamBoardLink, { opacity: pressed ? 0.75 : 1 }]}
      >
        <Heart size={14} color={COLORS.sage} strokeWidth={1.5} />
        <Text style={styles.dreamBoardLinkText}>
          {t('plan.dreamBoardCta', { defaultValue: 'Your dream destinations' })}
        </Text>
        <ChevronRight size={14} color={COLORS.sage} strokeWidth={1.5} />
      </Pressable>
    </View>
  );
}

// ---------------------------------------------------------------------------
// Styles
// ---------------------------------------------------------------------------
const styles = StyleSheet.create({
  dreamingContainer: {
    marginBottom: SPACING.lg,
    paddingTop: SPACING.md,
    alignItems: 'center',
  } as ViewStyle,
  dreamingHeadline: {
    fontFamily: FONTS.header,
    fontSize: 32,
    color: COLORS.cream,
    textAlign: 'center',
    letterSpacing: -0.5,
    marginBottom: SPACING.sm,
  } as TextStyle,
  dreamingTypewriter: {
    fontFamily: FONTS.mono,
    fontSize: 22,
    color: COLORS.creamDim,
    textAlign: 'center',
    marginBottom: SPACING.lg,
    letterSpacing: 0.5,
  } as TextStyle,

  // Destination photo cards
  destCardsContainer: {
    marginBottom: SPACING.lg,
    marginHorizontal: -20,
  } as ViewStyle,
  destCardsScroll: {
    paddingHorizontal: 20,
    gap: SPACING.sm,
  } as ViewStyle,
  destCard: {
    width: 150,
    height: 180,
    borderRadius: RADIUS.lg,
    overflow: 'hidden',
    borderWidth: 1,
    borderColor: COLORS.border,
  } as ViewStyle,
  destCardImage: {
    ...StyleSheet.absoluteFillObject,
    width: '100%',
    height: '100%',
  } as ImageStyle,
  destCardContent: {
    position: 'absolute',
    bottom: 0,
    left: 0,
    right: 0,
    padding: SPACING.sm,
  } as ViewStyle,
  destCardPinRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
    marginBottom: 2,
  } as ViewStyle,
  destCardLabel: {
    fontFamily: FONTS.header,
    fontSize: 16,
    color: COLORS.white,
  } as TextStyle,
  destCardHook: {
    fontFamily: FONTS.body,
    fontSize: 11,
    color: COLORS.creamSoft,
    lineHeight: 14,
  } as TextStyle,

  // CTA buttons
  dreamingButtons: {
    flexDirection: 'row',
    gap: SPACING.md,
    justifyContent: 'center',
  } as ViewStyle,
  dreamingBtn: {
    borderRadius: RADIUS.pill,
    paddingVertical: 12,
    paddingHorizontal: SPACING.xl,
    minWidth: 130,
    alignItems: 'center',
  } as ViewStyle,
  dreamingBtnSage: {
    backgroundColor: COLORS.sage,
  } as ViewStyle,
  dreamingBtnText: {
    fontFamily: FONTS.bodySemiBold,
    fontSize: 15,
  } as TextStyle,
  dreamingBtnTextSage: {
    color: COLORS.bg,
  } as TextStyle,
  dreamingQuickLink: {
    alignSelf: 'center',
    paddingTop: SPACING.sm,
  } as ViewStyle,
  dreamingQuickLinkText: {
    fontFamily: FONTS.bodyMedium,
    fontSize: 14,
    color: COLORS.muted,
    textDecorationLine: 'underline',
  } as TextStyle,
  dreamBoardLink: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: SPACING.xs,
    marginTop: SPACING.lg,
    paddingVertical: SPACING.sm,
    paddingHorizontal: SPACING.md,
    borderRadius: RADIUS.pill,
    backgroundColor: COLORS.sageSubtle,
    borderWidth: 1,
    borderColor: COLORS.sageBorder,
  } as ViewStyle,
  dreamBoardLinkText: {
    fontFamily: FONTS.bodyMedium,
    fontSize: 13,
    color: COLORS.sage,
  } as TextStyle,
});
