// =============================================================================
// ROAM — Onboarding Screen 3: Social Proof
// Traveler count + testimonials + "I want this" CTA
// =============================================================================
import React, { useEffect, useRef } from 'react';
import {
  Animated,
  Easing,
  Pressable,
  ScrollView,
  StyleSheet,
  Text,
  View,
  type ViewStyle,
  type TextStyle,
} from 'react-native';
import { LinearGradient } from 'expo-linear-gradient';
import { useRouter } from 'expo-router';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import * as Haptics from '../../lib/haptics';
import { COLORS, FONTS, SPACING, RADIUS } from '../../lib/constants';

interface Testimonial {
  quote: string;
  name: string;
  trip: string;
}

const TESTIMONIALS: Testimonial[] = [
  {
    quote:
      'ROAM found me a hidden ramen shop in Shibuya that had zero English signage. Best meal of my life.',
    name: 'Sarah K.',
    trip: 'Tokyo, 5 days',
  },
  {
    quote:
      "I used to spend 12 hours planning a trip. ROAM gave me a better one in 30 seconds.",
    name: 'Marcus D.',
    trip: 'Barcelona, 4 days',
  },
  {
    quote:
      'My boyfriend thought I hired a travel agent. Nope, just ROAM.',
    name: 'Priya L.',
    trip: 'Bali, 7 days',
  },
];

export default function SocialProofScreen() {
  const router = useRouter();
  const insets = useSafeAreaInsets();

  const counterOpacity = useRef(new Animated.Value(0)).current;
  const counterScale = useRef(new Animated.Value(0.5)).current;
  const cardAnims = useRef(
    TESTIMONIALS.map(() => ({
      opacity: new Animated.Value(0),
      y: new Animated.Value(30),
    }))
  ).current;
  const btnOpacity = useRef(new Animated.Value(0)).current;

  useEffect(() => {
    // Counter entrance
    Animated.parallel([
      Animated.timing(counterOpacity, {
        toValue: 1,
        duration: 600,
        useNativeDriver: true,
      }),
      Animated.spring(counterScale, {
        toValue: 1,
        tension: 50,
        friction: 7,
        useNativeDriver: true,
      }),
    ]).start();

    // Staggered testimonial cards
    cardAnims.forEach((anim, i) => {
      setTimeout(() => {
        Animated.parallel([
          Animated.timing(anim.opacity, {
            toValue: 1,
            duration: 500,
            useNativeDriver: true,
          }),
          Animated.timing(anim.y, {
            toValue: 0,
            duration: 500,
            easing: Easing.out(Easing.cubic),
            useNativeDriver: true,
          }),
        ]).start();
      }, 500 + i * 200);
    });

    // Button
    setTimeout(() => {
      Animated.timing(btnOpacity, {
        toValue: 1,
        duration: 500,
        useNativeDriver: true,
      }).start();
    }, 1300);
  }, [btnOpacity, cardAnims, counterOpacity, counterScale]);

  const handleContinue = () => {
    Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Medium);
    router.push('/(auth)/value-preview');
  };

  return (
    <View style={[styles.container, { paddingTop: insets.top + 20 }]}>
      <ScrollView
        contentContainerStyle={styles.scroll}
        showsVerticalScrollIndicator={false}
      >
        {/* Counter */}
        <Animated.View
          style={[
            styles.counterBlock,
            {
              opacity: counterOpacity,
              transform: [{ scale: counterScale }],
            },
          ]}
        >
          <Text style={styles.counterNumber}>New</Text>
          <Text style={styles.counterLabel}>travelers joining daily</Text>
        </Animated.View>

        {/* Testimonials */}
        <View style={styles.cards}>
          {TESTIMONIALS.map((t, i) => (
            <Animated.View
              key={i}
              style={[
                styles.card,
                {
                  opacity: cardAnims[i].opacity,
                  transform: [{ translateY: cardAnims[i].y }],
                },
              ]}
            >
              <LinearGradient
                colors={[COLORS.sageSubtle, COLORS.whiteVeryFaint]}
                style={StyleSheet.absoluteFill}
                start={{ x: 0, y: 0 }}
                end={{ x: 1, y: 1 }}
              />
              <Text style={styles.quote}>"{t.quote}"</Text>
              <View style={styles.attribution}>
                <Text style={styles.name}>{t.name}</Text>
                <Text style={styles.trip}>{t.trip}</Text>
              </View>
            </Animated.View>
          ))}
        </View>
      </ScrollView>

      {/* CTA */}
      <Animated.View
        style={[styles.btnContainer, { opacity: btnOpacity, paddingBottom: insets.bottom + 20 }]}
      >
        <Pressable
          onPress={handleContinue}
          accessibilityRole="button"
          accessibilityLabel="I want this"
          style={({ pressed }) => [
            styles.btn,
            { opacity: pressed ? 0.85 : 1, transform: [{ scale: pressed ? 0.97 : 1 }] },
          ]}
        >
          <Text style={styles.btnText}>I want this</Text>
        </Pressable>
      </Animated.View>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: COLORS.bg,
  } as ViewStyle,
  scroll: {
    paddingHorizontal: SPACING.lg,
    paddingBottom: 120,
    maxWidth: 600,
    alignSelf: 'center',
    width: '100%',
  } as ViewStyle,
  counterBlock: {
    alignItems: 'center',
    marginBottom: SPACING.xxl,
    marginTop: SPACING.xl,
  } as ViewStyle,
  counterNumber: {
    fontFamily: FONTS.header,
    fontSize: 72,
    color: COLORS.gold,
    letterSpacing: 2,
  } as TextStyle,
  counterLabel: {
    fontFamily: FONTS.body,
    fontSize: 16,
    color: COLORS.cream,
    opacity: 0.6,
    marginTop: 4,
  } as TextStyle,
  cards: {
    gap: SPACING.md,
  } as ViewStyle,
  card: {
    borderRadius: RADIUS.lg,
    borderWidth: 1,
    borderColor: COLORS.border,
    padding: SPACING.lg,
    overflow: 'hidden',
  } as ViewStyle,
  quote: {
    fontFamily: FONTS.body,
    fontSize: 16,
    color: COLORS.cream,
    lineHeight: 24,
    marginBottom: SPACING.md,
  } as TextStyle,
  attribution: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
  } as ViewStyle,
  name: {
    fontFamily: FONTS.bodySemiBold,
    fontSize: 14,
    color: COLORS.sage,
  } as TextStyle,
  trip: {
    fontFamily: FONTS.mono,
    fontSize: 12,
    color: COLORS.creamMuted,
  } as TextStyle,
  btnContainer: {
    position: 'absolute',
    bottom: 0,
    left: 0,
    right: 0,
    paddingHorizontal: SPACING.lg,
    paddingTop: SPACING.md,
    backgroundColor: COLORS.bg,
  } as ViewStyle,
  btn: {
    backgroundColor: COLORS.gold,
    height: 56,
    borderRadius: RADIUS.lg,
    alignItems: 'center',
    justifyContent: 'center',
    maxWidth: 600,
    alignSelf: 'center',
    width: '100%',
  } as ViewStyle,
  btnText: {
    fontFamily: FONTS.bodySemiBold,
    fontSize: 17,
    color: COLORS.bg,
    letterSpacing: 0.3,
  } as TextStyle,
});
