// =============================================================================
// ROAM — DreamingHero (DREAMING state — full-screen, no scroll needed)
// Premium, confident, clean. One input. One button. Three photo cards.
// =============================================================================
import React, { useCallback, useState } from 'react';
import {
  Image,
  Pressable,
  ScrollView,
  StyleSheet,
  Text,
  TextInput,
  View,
  type ImageStyle,
  type TextStyle,
  type ViewStyle,
} from 'react-native';
import { useRouter } from 'expo-router';
import { MapPin } from 'lucide-react-native';
import { LinearGradient } from 'expo-linear-gradient';
import { useTranslation } from 'react-i18next';
import * as Haptics from '../../lib/haptics';
import { COLORS, FONTS, SPACING, RADIUS, DESTINATION_HERO_PHOTOS } from '../../lib/constants';

// ---------------------------------------------------------------------------
// Destination photo cards — curated, always visible
// ---------------------------------------------------------------------------
const POPULAR_DESTINATIONS = [
  { label: 'Tokyo', photo: DESTINATION_HERO_PHOTOS['Tokyo'] },
  { label: 'Bali', photo: DESTINATION_HERO_PHOTOS['Bali'] },
  { label: 'Paris', photo: DESTINATION_HERO_PHOTOS['Paris'] },
  { label: 'Barcelona', photo: DESTINATION_HERO_PHOTOS['Barcelona'] },
  { label: 'Lisbon', photo: DESTINATION_HERO_PHOTOS['Lisbon'] },
  { label: 'Mexico City', photo: DESTINATION_HERO_PHOTOS['Mexico City'] },
];

// ---------------------------------------------------------------------------
// Props
// ---------------------------------------------------------------------------
export interface DreamingHeroProps {
  cityLabel: string;
  onQuickTrip: () => void;
  onPlanTogether: () => void;
  /** Personalized greeting from TravelerDNA engine */
  personalizedGreeting?: string;
}

// ---------------------------------------------------------------------------
// Component
// ---------------------------------------------------------------------------
export default function DreamingHero({ onPlanTogether, personalizedGreeting }: DreamingHeroProps) {
  const { t } = useTranslation();
  const router = useRouter();
  const [inputValue, setInputValue] = useState('');

  const headline = personalizedGreeting ?? t('plan.dreaming.headline', { defaultValue: 'Where are you going?' });

  const handleDestinationPress = useCallback((destination: string) => {
    Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
    router.push({ pathname: '/destination/[name]', params: { name: destination } } as never);
  }, [router]);

  const handlePlanIt = useCallback(() => {
    Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Medium);
    onPlanTogether();
  }, [onPlanTogether]);

  return (
    <View style={styles.container}>
      {/* Headline */}
      <Text style={styles.headline}>{headline}</Text>

      {/* Search input */}
      <View style={styles.inputWrapper}>
        <TextInput
          style={styles.input}
          placeholder={t('plan.dreaming.inputPlaceholder', { defaultValue: 'Tokyo, Bali, anywhere...' })}
          placeholderTextColor={COLORS.muted}
          value={inputValue}
          onChangeText={setInputValue}
          returnKeyType="go"
          onSubmitEditing={handlePlanIt}
          autoCapitalize="words"
          autoCorrect={false}
        />
      </View>

      {/* CTA button */}
      <Pressable
        onPress={handlePlanIt}
        accessibilityLabel={t('plan.dreaming.planIt', { defaultValue: 'Plan it' })}
        accessibilityRole="button"
        style={({ pressed }) => [styles.ctaButton, { opacity: pressed ? 0.85 : 1 }]}
      >
        <Text style={styles.ctaButtonText}>
          {t('plan.dreaming.planIt', { defaultValue: 'Plan it' })}
        </Text>
      </Pressable>

      {/* Destination photo cards */}
      <ScrollView
        horizontal
        showsHorizontalScrollIndicator={false}
        contentContainerStyle={styles.cardsScroll}
        style={styles.cardsContainer}
      >
        {POPULAR_DESTINATIONS.map((dest) => (
          <Pressable
            key={dest.label}
            onPress={() => handleDestinationPress(dest.label)}
            accessibilityLabel={dest.label}
            accessibilityRole="button"
            style={({ pressed }) => [
              styles.photoCard,
              { transform: [{ scale: pressed ? 0.96 : 1 }] },
            ]}
          >
            <Image
              source={{ uri: dest.photo }}
              style={styles.photoCardImage}
              resizeMode="cover"
            />
            <LinearGradient
              colors={['transparent', COLORS.overlayDark]}
              locations={[0.4, 1]}
              style={StyleSheet.absoluteFill}
            />
            <View style={styles.photoCardContent}>
              <MapPin size={11} color={COLORS.cream} strokeWidth={1.5} />
              <Text style={styles.photoCardLabel}>{dest.label}</Text>
            </View>
          </Pressable>
        ))}
      </ScrollView>
    </View>
  );
}

// ---------------------------------------------------------------------------
// Styles
// ---------------------------------------------------------------------------
const styles = StyleSheet.create({
  container: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    paddingTop: 60,
    paddingBottom: SPACING.xl,
  } as ViewStyle,

  headline: {
    fontFamily: FONTS.header,
    fontSize: 36,
    color: COLORS.cream,
    textAlign: 'center',
    letterSpacing: -0.5,
    marginBottom: SPACING.xl,
    lineHeight: 42,
  } as TextStyle,

  inputWrapper: {
    width: '100%',
    paddingHorizontal: SPACING.lg,
    marginBottom: SPACING.md,
  } as ViewStyle,
  input: {
    height: 52,
    borderRadius: RADIUS.pill,
    borderWidth: 1.5,
    borderColor: COLORS.sage,
    backgroundColor: COLORS.surface1,
    paddingHorizontal: SPACING.lg,
    fontFamily: FONTS.body,
    fontSize: 16,
    color: COLORS.cream,
  } as TextStyle,

  ctaButton: {
    backgroundColor: COLORS.sage,
    borderRadius: RADIUS.pill,
    paddingVertical: 14,
    paddingHorizontal: SPACING.xxl,
    marginBottom: SPACING.xxl,
  } as ViewStyle,
  ctaButtonText: {
    fontFamily: FONTS.header,
    fontSize: 17,
    color: COLORS.bg,
    letterSpacing: 0.2,
  } as TextStyle,

  cardsContainer: {
    marginHorizontal: -20,
  } as ViewStyle,
  cardsScroll: {
    paddingHorizontal: 20,
    gap: SPACING.sm,
  } as ViewStyle,
  photoCard: {
    width: 130,
    height: 160,
    borderRadius: RADIUS.lg,
    overflow: 'hidden',
    borderWidth: 1,
    borderColor: COLORS.border,
  } as ViewStyle,
  photoCardImage: {
    ...StyleSheet.absoluteFillObject,
    width: '100%',
    height: '100%',
  } as ImageStyle,
  photoCardContent: {
    position: 'absolute',
    bottom: 0,
    left: 0,
    right: 0,
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
    paddingHorizontal: SPACING.sm,
    paddingVertical: SPACING.sm,
  } as ViewStyle,
  photoCardLabel: {
    fontFamily: FONTS.header,
    fontSize: 14,
    color: COLORS.white,
  } as TextStyle,
});
