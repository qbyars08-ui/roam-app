// =============================================================================
// ROAM — Swipeable Onboarding Flow (3 slides)
// Destination input, features showcase, CTA
// =============================================================================
import React, { useCallback, useRef, useState } from 'react';
import {
  Dimensions,
  Image,
  Pressable,
  ScrollView,
  StyleSheet,
  Text,
  TextInput,
  View,
  type NativeScrollEvent,
  type NativeSyntheticEvent,
  type TextStyle,
  type ViewStyle,
  type ImageStyle,
} from 'react-native';
import { useRouter } from 'expo-router';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { MapPin, Cloud, Shield } from 'lucide-react-native';
import * as Haptics from '../lib/haptics';
import { COLORS, FONTS, SPACING, RADIUS, DESTINATION_HERO_PHOTOS } from '../lib/constants';

// ---------------------------------------------------------------------------
// Storage key
// ---------------------------------------------------------------------------
const HAS_SEEN_ONBOARDING = '@roam/hasSeenOnboarding';

export { HAS_SEEN_ONBOARDING };

// ---------------------------------------------------------------------------
// Destination chips data
// ---------------------------------------------------------------------------
const DESTINATION_CHIPS = [
  { name: 'Tokyo', photo: DESTINATION_HERO_PHOTOS['Tokyo'] },
  { name: 'Bali', photo: DESTINATION_HERO_PHOTOS['Bali'] },
  { name: 'Paris', photo: DESTINATION_HERO_PHOTOS['Paris'] },
  { name: 'Barcelona', photo: DESTINATION_HERO_PHOTOS['Barcelona'] },
  { name: 'NYC', photo: DESTINATION_HERO_PHOTOS['New York'] },
  { name: 'Bangkok', photo: DESTINATION_HERO_PHOTOS['Bangkok'] },
] as const;

// ---------------------------------------------------------------------------
// Feature rows data (slide 2)
// ---------------------------------------------------------------------------
const FEATURES = [
  { Icon: MapPin, text: 'Real restaurants with photos and ratings' },
  { Icon: Cloud, text: 'Weather for your actual dates' },
  { Icon: Shield, text: 'Safety, visas, emergency numbers' },
] as const;

const { width: SCREEN_WIDTH } = Dimensions.get('window');

// ---------------------------------------------------------------------------
// Component
// ---------------------------------------------------------------------------
export default function OnboardingScreen() {
  const router = useRouter();
  const insets = useSafeAreaInsets();
  const scrollRef = useRef<ScrollView>(null);
  const inputRef = useRef<TextInput>(null);

  const [destination, setDestination] = useState('');
  const [activePage, setActivePage] = useState(0);

  // Track scroll position for page dots
  const handleScroll = useCallback(
    (e: NativeSyntheticEvent<NativeScrollEvent>) => {
      const page = Math.round(e.nativeEvent.contentOffset.x / SCREEN_WIDTH);
      setActivePage(page);
    },
    []
  );

  // Complete onboarding helper
  const completeOnboarding = useCallback(async () => {
    await AsyncStorage.setItem(HAS_SEEN_ONBOARDING, 'true');
  }, []);

  // Tap a destination chip
  const handleChipPress = useCallback(
    (name: string) => {
      Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
      setDestination(name);
    },
    []
  );

  // Plan button on slide 3
  const handlePlan = useCallback(async () => {
    Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Medium);
    await completeOnboarding();
    router.replace({
      pathname: '/craft-session',
      params: { destination: destination || undefined },
    });
  }, [completeOnboarding, destination, router]);

  // Skip button on slide 3
  const handleSkip = useCallback(async () => {
    Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
    await completeOnboarding();
    router.replace('/(tabs)/plan');
  }, [completeOnboarding, router]);

  // Determine CTA text
  const ctaLabel = destination
    ? `Plan my ${destination} trip`
    : 'Plan my first trip';

  return (
    <View style={[styles.container, { paddingTop: insets.top, paddingBottom: insets.bottom }]}>
      <ScrollView
        ref={scrollRef}
        horizontal
        pagingEnabled
        showsHorizontalScrollIndicator={false}
        onScroll={handleScroll}
        scrollEventThrottle={16}
        bounces={false}
      >
        {/* ===== Slide 1: Destination Input ===== */}
        <View style={styles.slide}>
          <View style={styles.slideContent}>
            <Text style={styles.heroTitle}>Where do you{'\n'}want to go?</Text>

            <TextInput
              ref={inputRef}
              style={styles.input}
              placeholder="Type a city..."
              placeholderTextColor={COLORS.muted}
              value={destination}
              onChangeText={setDestination}
              autoFocus
              returnKeyType="done"
              selectionColor={COLORS.sage}
            />

            <View style={styles.chipGrid}>
              {DESTINATION_CHIPS.map((chip) => (
                <Pressable
                  key={chip.name}
                  onPress={() => handleChipPress(chip.name)}
                  style={({ pressed }) => [
                    styles.chip,
                    { opacity: pressed ? 0.7 : 1 },
                  ]}
                >
                  <Image source={{ uri: chip.photo }} style={styles.chipPhoto} />
                  <Text style={styles.chipLabel}>{chip.name}</Text>
                </Pressable>
              ))}
            </View>
          </View>
        </View>

        {/* ===== Slide 2: Features ===== */}
        <View style={styles.slide}>
          <View style={styles.slideContent}>
            <Text style={styles.featuresTitle}>
              Your entire trip.{'\n'}30 seconds.
            </Text>

            <View style={styles.featureList}>
              {FEATURES.map((feature, i) => (
                <View key={i} style={styles.featureRow}>
                  <View style={styles.featureIconWrap}>
                    <feature.Icon size={22} color={COLORS.sage} strokeWidth={1.5} />
                  </View>
                  <Text style={styles.featureText}>{feature.text}</Text>
                </View>
              ))}
            </View>

            <Text style={styles.featureFooter}>
              Not a template. Built for you.
            </Text>
          </View>
        </View>

        {/* ===== Slide 3: CTA ===== */}
        <View style={styles.slide}>
          <View style={styles.slideContent}>
            <Text style={styles.heroTitle}>Your first trip{'\n'}is free.</Text>

            <Text style={styles.ctaSubtitle}>
              No credit card. No signup. Just go.
            </Text>

            <Pressable
              onPress={handlePlan}
              style={({ pressed }) => [
                styles.ctaButton,
                { transform: [{ scale: pressed ? 0.97 : 1 }] },
              ]}
            >
              <Text style={styles.ctaButtonText}>{ctaLabel} →</Text>
            </Pressable>

            <Pressable onPress={handleSkip} hitSlop={12}>
              <Text style={styles.skipText}>Skip for now</Text>
            </Pressable>
          </View>
        </View>
      </ScrollView>

      {/* Page dots */}
      <View style={[styles.dotsRow, { bottom: insets.bottom + 24 }]}>
        {[0, 1, 2].map((i) => (
          <View
            key={i}
            style={[
              styles.dot,
              { backgroundColor: activePage === i ? COLORS.sage : COLORS.muted },
            ]}
          />
        ))}
      </View>
    </View>
  );
}

// ---------------------------------------------------------------------------
// Styles
// ---------------------------------------------------------------------------
const CHIP_WIDTH = (SCREEN_WIDTH - SPACING.lg * 2 - SPACING.sm * 2) / 3;

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: COLORS.bg,
  } as ViewStyle,

  slide: {
    width: SCREEN_WIDTH,
    flex: 1,
    justifyContent: 'center',
  } as ViewStyle,

  slideContent: {
    paddingHorizontal: SPACING.lg,
    alignItems: 'center',
  } as ViewStyle,

  // Slide 1
  heroTitle: {
    fontFamily: FONTS.header,
    fontSize: 32,
    color: COLORS.cream,
    textAlign: 'center',
    lineHeight: 40,
  } as TextStyle,

  input: {
    width: '100%',
    backgroundColor: COLORS.bgCard,
    borderRadius: RADIUS.lg,
    borderWidth: 1,
    borderColor: COLORS.border,
    paddingHorizontal: SPACING.md,
    paddingVertical: SPACING.md,
    fontFamily: FONTS.body,
    fontSize: 18,
    color: COLORS.cream,
    marginTop: SPACING.xl,
  } as TextStyle,

  chipGrid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: SPACING.sm,
    marginTop: SPACING.xl,
    justifyContent: 'center',
  } as ViewStyle,

  chip: {
    width: CHIP_WIDTH,
    backgroundColor: COLORS.bgCard,
    borderRadius: RADIUS.md,
    overflow: 'hidden',
  } as ViewStyle,

  chipPhoto: {
    width: '100%',
    height: 70,
  } as ImageStyle,

  chipLabel: {
    fontFamily: FONTS.bodyMedium,
    fontSize: 13,
    color: COLORS.cream,
    textAlign: 'center',
    paddingVertical: SPACING.sm,
  } as TextStyle,

  // Slide 2
  featuresTitle: {
    fontFamily: FONTS.header,
    fontSize: 28,
    color: COLORS.cream,
    textAlign: 'center',
    lineHeight: 36,
  } as TextStyle,

  featureList: {
    width: '100%',
    gap: SPACING.lg,
    marginTop: SPACING.xxl,
  } as ViewStyle,

  featureRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: SPACING.md,
  } as ViewStyle,

  featureIconWrap: {
    width: 44,
    height: 44,
    borderRadius: RADIUS.full,
    backgroundColor: COLORS.sageSubtle,
    alignItems: 'center',
    justifyContent: 'center',
  } as ViewStyle,

  featureText: {
    flex: 1,
    fontFamily: FONTS.bodyMedium,
    fontSize: 16,
    color: COLORS.cream,
    lineHeight: 22,
  } as TextStyle,

  featureFooter: {
    fontFamily: FONTS.body,
    fontSize: 16,
    color: COLORS.muted,
    marginTop: SPACING.xxl,
    textAlign: 'center',
  } as TextStyle,

  // Slide 3
  ctaSubtitle: {
    fontFamily: FONTS.body,
    fontSize: 16,
    color: COLORS.creamMuted,
    marginTop: SPACING.md,
    textAlign: 'center',
  } as TextStyle,

  ctaButton: {
    backgroundColor: COLORS.sage,
    borderRadius: RADIUS.pill,
    paddingHorizontal: SPACING.xl,
    paddingVertical: SPACING.md + 2,
    marginTop: SPACING.xxl,
    width: '100%',
    alignItems: 'center',
  } as ViewStyle,

  ctaButtonText: {
    fontFamily: FONTS.bodySemiBold,
    fontSize: 18,
    color: COLORS.bg,
  } as TextStyle,

  skipText: {
    fontFamily: FONTS.body,
    fontSize: 14,
    color: COLORS.muted,
    textDecorationLine: 'underline',
    marginTop: SPACING.lg,
  } as TextStyle,

  // Dots
  dotsRow: {
    position: 'absolute',
    left: 0,
    right: 0,
    flexDirection: 'row',
    justifyContent: 'center',
    gap: SPACING.sm,
  } as ViewStyle,

  dot: {
    width: 8,
    height: 8,
    borderRadius: 4,
  } as ViewStyle,
});
