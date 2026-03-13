// =============================================================================
// ROAM — Immersive Onboarding
// Full-screen cinematic slides, glowing progress, no emojis
// =============================================================================
import React, { useCallback, useRef, useState } from 'react';
import {
  Animated,
  Easing,
  ImageBackground,
  Pressable,
  StyleSheet,
  Text,
  View,
  type TextStyle,
  type ViewStyle,
} from 'react-native';
import { LinearGradient } from 'expo-linear-gradient';
import { useRouter } from 'expo-router';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import AsyncStorage from '@react-native-async-storage/async-storage';
import * as Haptics from '../../lib/haptics';

import { COLORS, FONTS, SPACING, RADIUS } from '../../lib/constants';
import ConfettiBurst from '../../components/ui/ConfettiBurst';
import { inferFromOnboarding, saveLocalPrefs } from '../../lib/personalization';

const ONBOARDING_COMPLETE_KEY = '@roam/onboarding_complete';
const ONBOARDING_ANSWERS_KEY = '@roam/onboarding_answers';

interface StepOption {
  label: string;
  value: string;
  bgImage?: string;
}

interface OnboardingStep {
  title: string;
  subtitle: string;
  options: StepOption[];
}

const STEPS: OnboardingStep[] = [
  {
    title: 'How do you travel?',
    subtitle: 'Be honest. We\'ll build around it.',
    options: [
      { label: 'Solo — faster, freer, no compromises', value: 'solo', bgImage: 'https://images.unsplash.com/photo-1501854140801-50d01698950b?w=800&q=85' },
      { label: 'With my partner — one trip, zero arguments', value: 'couple', bgImage: 'https://images.unsplash.com/photo-1529333166437-7750a6dd5a70?w=800&q=85' },
      { label: 'Friends — the group chat finally has a plan', value: 'friends', bgImage: 'https://images.unsplash.com/photo-1529156069898-49953e39b3ac?w=800&q=85' },
      { label: 'Family — everyone\'s happy or no one is', value: 'family', bgImage: 'https://images.unsplash.com/photo-1476514525535-07fb3b4ae5f1?w=800&q=85' },
    ],
  },
  {
    title: 'What are you actually chasing?',
    subtitle: 'This changes everything about your trip.',
    options: [
      { label: 'The food. Always the food.', value: 'food', bgImage: 'https://images.unsplash.com/photo-1504674900247-0877df9cc836?w=800&q=85' },
      { label: 'Nature that makes you put your phone down', value: 'nature', bgImage: 'https://images.unsplash.com/photo-1441974231531-c6227db76b6e?w=800&q=85' },
      { label: 'Energy, nightlife, the whole scene', value: 'nightlife', bgImage: 'https://images.unsplash.com/photo-1514525253161-7a46d19cd819?w=800&q=85' },
      { label: 'Culture, history, things that matter', value: 'culture', bgImage: 'https://images.unsplash.com/photo-1488646953014-85cb44e25828?w=800&q=85' },
    ],
  },
  {
    title: 'How are we doing this?',
    subtitle: 'No judgment. Just better recommendations.',
    options: [
      { label: 'Hostels, street food, no regrets — $50/day', value: 'backpacker', bgImage: 'https://images.unsplash.com/photo-1551632811-561732d1e306?w=800&q=85' },
      { label: 'Nice but not stupid about it — $150/day', value: 'comfort', bgImage: 'https://images.unsplash.com/photo-1566073771259-6a8506099945?w=800&q=85' },
      { label: 'You worked hard. Spend accordingly — $300/day', value: 'treat-yourself', bgImage: 'https://images.unsplash.com/photo-1582719508461-905c673771fd?w=800&q=85' },
      { label: 'Money isn\'t the constraint — $500+/day', value: 'no-budget', bgImage: 'https://images.unsplash.com/photo-1571896349842-33c89424de2d?w=800&q=85' },
    ],
  },
];

export default function OnboardingScreen() {
  const router = useRouter();
  const insets = useSafeAreaInsets();
  const [currentStep, setCurrentStep] = useState(0);
  const [answers, setAnswers] = useState<string[]>([]);
  const [showConfetti, setShowConfetti] = useState(false);
  const slideAnim = useRef(new Animated.Value(0)).current;
  const progressAnim = useRef(new Animated.Value(1 / 3)).current;

  const handleSelect = useCallback(
    async (value: string) => {
      Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Medium);
      const newAnswers = [...answers, value];
      setAnswers(newAnswers);

      if (currentStep < STEPS.length - 1) {
        const nextStep = currentStep + 1;
        const progress = (nextStep + 1) / STEPS.length;
        Animated.parallel([
          Animated.timing(slideAnim, {
            toValue: nextStep,
            duration: 400,
            easing: Easing.out(Easing.cubic),
            useNativeDriver: true,
          }),
          Animated.timing(progressAnim, {
            toValue: progress,
            duration: 400,
            useNativeDriver: false,
          }),
        ]).start(() => setCurrentStep(nextStep));
      } else {
        Haptics.notificationAsync(Haptics.NotificationFeedbackType.Success);
        setShowConfetti(true);
        await AsyncStorage.setItem(ONBOARDING_COMPLETE_KEY, 'true');
        const answersPayload = {
          travelStyle: newAnswers[0],
          priority: newAnswers[1],
          budget: newAnswers[2],
        };
        await AsyncStorage.setItem(ONBOARDING_ANSWERS_KEY, JSON.stringify(answersPayload));
        const inferred = inferFromOnboarding(answersPayload);
        await saveLocalPrefs(inferred);
      }
    },
    [answers, currentStep, slideAnim, progressAnim, router]
  );

  const handleSkip = useCallback(async () => {
    await AsyncStorage.setItem(ONBOARDING_COMPLETE_KEY, 'true');
    router.replace('/(tabs)');
  }, [router]);

  const step = STEPS[currentStep];

  const progressWidth = progressAnim.interpolate({
    inputRange: [1 / 3, 2 / 3, 1],
    outputRange: ['33%', '66%', '100%'],
  });

  const handleConfettiComplete = useCallback(() => {
    setShowConfetti(false);
    // After travel profile → go straight to Discover screen
    router.replace('/(tabs)');
  }, [router]);

  return (
    <View style={[styles.container, { paddingTop: insets.top }]}>
      {showConfetti && <ConfettiBurst onComplete={handleConfettiComplete} />}
      {/* Glowing progress line */}
      <View style={styles.progressTrack}>
        <Animated.View style={[styles.progressGlow, { width: progressWidth }]} />
      </View>

      <View style={styles.topRow}>
        <Text style={styles.stepCounter}>
          {currentStep + 1} / {STEPS.length}
        </Text>
        <Pressable
          onPress={handleSkip}
          hitSlop={12}
          accessibilityRole="button"
          accessibilityLabel="Skip"
        >
          <Text style={styles.skipText}>Skip</Text>
        </Pressable>
      </View>

      <View style={styles.content}>
        <Text style={styles.title}>{step.title}</Text>
        <Text style={styles.subtitle}>{step.subtitle}</Text>

        <View style={styles.optionsGrid}>
          {step.options.map((opt) => (
            <Pressable
              key={opt.value}
              onPress={() => handleSelect(opt.value)}
              accessibilityRole="button"
              accessibilityLabel={opt.label}
              style={({ pressed }) => [
                styles.optionWrapper,
                { opacity: pressed ? 0.9 : 1, transform: [{ scale: pressed ? 0.98 : 1 }] },
              ]}
            >
              {opt.bgImage ? (
                <ImageBackground
                  source={{ uri: opt.bgImage }}
                  style={styles.optionCard}
                  imageStyle={{ borderRadius: RADIUS.xl }}
                  resizeMode="cover"
                >
                  <LinearGradient
                    colors={['rgba(0,0,0,0.15)', 'rgba(0,0,0,0.7)', 'rgba(0,0,0,0.95)']}
                    locations={[0.0, 0.5, 1]}
                    style={StyleSheet.absoluteFill}
                  />
                  <Text style={styles.optionLabel}>{opt.label}</Text>
                </ImageBackground>
              ) : (
                <View style={[styles.optionCard, styles.optionCardPlain]}>
                  <Text style={styles.optionLabel}>{opt.label}</Text>
                </View>
              )}
            </Pressable>
          ))}
        </View>
      </View>

      <Text style={styles.bottomTagline}>This shapes everything we recommend</Text>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: COLORS.bg,
    paddingHorizontal: SPACING.lg,
  } as ViewStyle,
  progressTrack: {
    position: 'absolute',
    top: 0,
    left: 0,
    right: 0,
    height: 3,
    backgroundColor: COLORS.bgCard,
  } as ViewStyle,
  progressGlow: {
    height: '100%',
    backgroundColor: COLORS.accentGreen,
  } as ViewStyle,
  topRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingVertical: SPACING.md,
  } as ViewStyle,
  stepCounter: {
    fontFamily: FONTS.mono,
    fontSize: 12,
    color: COLORS.creamMuted,
  } as TextStyle,
  skipText: {
    fontFamily: FONTS.bodyMedium,
    fontSize: 14,
    color: COLORS.creamMuted,
  } as TextStyle,
  content: {
    flex: 1,
    justifyContent: 'center',
    maxWidth: 600,
    alignSelf: 'center',
    width: '100%',
  } as ViewStyle,
  title: {
    fontFamily: FONTS.header,
    fontSize: 36,
    color: COLORS.cream,
    textAlign: 'center',
    marginBottom: SPACING.sm,
  } as TextStyle,
  subtitle: {
    fontFamily: FONTS.body,
    fontSize: 16,
    color: COLORS.creamMuted,
    textAlign: 'center',
    marginBottom: SPACING.xxl,
  } as TextStyle,
  optionsGrid: {
    gap: SPACING.md,
  } as ViewStyle,
  optionWrapper: {},
  optionCard: {
    borderRadius: RADIUS.xl,
    overflow: 'hidden' as const,
    height: 90,
    justifyContent: 'flex-end' as const,
    padding: SPACING.md,
    paddingBottom: SPACING.lg,
  },
  optionCardPlain: {
    backgroundColor: COLORS.bgCard,
    borderWidth: 1,
    borderColor: COLORS.border,
  } as ViewStyle,
  optionLabel: {
    fontFamily: FONTS.bodySemiBold,
    fontSize: 17,
    color: '#FFFFFF',
    textShadowColor: 'rgba(0,0,0,0.9)',
    textShadowOffset: { width: 0, height: 1 },
    textShadowRadius: 4,
  } as TextStyle,
  bottomTagline: {
    fontFamily: FONTS.mono,
    fontSize: 11,
    color: COLORS.creamMuted,
    opacity: 0.5,
    textAlign: 'center',
    paddingBottom: SPACING.xxl,
  } as TextStyle,
});
