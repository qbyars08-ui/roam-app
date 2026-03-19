// =============================================================================
// ROAM — Splash Screen
// Full viewport, ROAM 72px, animated itinerary lines, spring-in CTAs.
// This should feel like the login screen of a $100M app.
// =============================================================================
import React, { useCallback, useEffect, useRef, useState } from 'react';
import {
  Animated,
  Easing,
  Pressable,
  StyleSheet,
  Text,
  View,
  type TextStyle,
  type ViewStyle,
} from 'react-native';
import { useRouter } from 'expo-router';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import * as Haptics from '../../lib/haptics';
import { COLORS, FONTS, RADIUS, SPACING } from '../../lib/constants';

// ---------------------------------------------------------------------------
// Itinerary demo lines — 3 cities, one line each, cycling
// ---------------------------------------------------------------------------
const DEMO_LINES = [
  'Day 1 \u2014 Shibuya at dusk. The vinyl shops close at 8.',
  'Day 2 \u2014 Trastevere. Ask for the cacio e pepe.',
  'Day 3 \u2014 Canggu. Rent a scooter. Trust me.',
] as const;

const HOLD_MS = 6000;
const FADE_IN_MS = 400;
const STAGGER_MS = 400;
const FADE_OUT_MS = 300;

// ---------------------------------------------------------------------------
// Component
// ---------------------------------------------------------------------------
export default function SplashScreen() {
  const router = useRouter();
  const insets = useSafeAreaInsets();

  // --- Animation values ---
  const logoOpacity = useRef(new Animated.Value(0)).current;
  const subtitleOpacity = useRef(new Animated.Value(0)).current;
  const buttonsOpacity = useRef(new Animated.Value(0)).current;
  const buttonsTranslateY = useRef(new Animated.Value(24)).current;

  // One opacity per demo line
  const lineOpacities = useRef(
    DEMO_LINES.map(() => new Animated.Value(0)),
  ).current;

  const [cycleIndex, setCycleIndex] = useState(0);
  const cycleRef = useRef(0);
  const timerRef = useRef<ReturnType<typeof setInterval> | null>(null);

  // --- Animate 3 lines in with stagger ---
  const animateLinesIn = useCallback(() => {
    lineOpacities.forEach((v) => v.setValue(0));
    const animations = lineOpacities.map((opacity, i) =>
      Animated.sequence([
        Animated.delay(i * STAGGER_MS),
        Animated.timing(opacity, {
          toValue: 1,
          duration: FADE_IN_MS,
          easing: Easing.out(Easing.cubic),
          useNativeDriver: true,
        }),
      ]),
    );
    Animated.parallel(animations).start();
  }, [lineOpacities]);

  // --- Fade all lines out ---
  const animateLinesOut = useCallback(
    () =>
      new Promise<void>((resolve) => {
        Animated.parallel(
          lineOpacities.map((opacity) =>
            Animated.timing(opacity, {
              toValue: 0,
              duration: FADE_OUT_MS,
              useNativeDriver: true,
            }),
          ),
        ).start(() => resolve());
      }),
    [lineOpacities],
  );

  // --- Logo + subtitle entrance ---
  useEffect(() => {
    Animated.sequence([
      Animated.delay(100),
      Animated.timing(logoOpacity, {
        toValue: 1,
        duration: 600,
        easing: Easing.out(Easing.cubic),
        useNativeDriver: true,
      }),
    ]).start();

    const sub = setTimeout(() => {
      Animated.timing(subtitleOpacity, {
        toValue: 1,
        duration: 500,
        useNativeDriver: true,
      }).start();
    }, 500);

    return () => clearTimeout(sub);
  }, [logoOpacity, subtitleOpacity]);

  // --- Demo lines cycling ---
  useEffect(() => {
    // First set fades in after subtitle
    const firstTimer = setTimeout(() => {
      animateLinesIn();
    }, 900);

    // Buttons appear after 2s with spring
    const btnTimer = setTimeout(() => {
      Animated.parallel([
        Animated.spring(buttonsTranslateY, {
          toValue: 0,
          tension: 50,
          friction: 9,
          useNativeDriver: true,
        }),
        Animated.timing(buttonsOpacity, {
          toValue: 1,
          duration: 500,
          useNativeDriver: true,
        }),
      ]).start();
    }, 2000);

    // Cycle every HOLD_MS
    timerRef.current = setInterval(async () => {
      await animateLinesOut();
      cycleRef.current = (cycleRef.current + 1) % DEMO_LINES.length;
      setCycleIndex(cycleRef.current);
      animateLinesIn();
    }, HOLD_MS);

    return () => {
      clearTimeout(firstTimer);
      clearTimeout(btnTimer);
      if (timerRef.current) clearInterval(timerRef.current);
    };
  }, [animateLinesIn, animateLinesOut, buttonsOpacity, buttonsTranslateY]);

  // --- Navigation ---
  const handlePlanTrip = useCallback(() => {
    Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Medium);
    router.replace('/onboarding');
  }, [router]);

  const handleSignIn = useCallback(() => {
    Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
    router.replace('/(auth)/signin');
  }, [router]);

  // We show 3 lines offset by cycleIndex so lines rotate through cities
  const visibleLines = DEMO_LINES.map(
    (_, i) => DEMO_LINES[(i + cycleIndex) % DEMO_LINES.length],
  );

  return (
    <View style={[styles.root, { paddingBottom: insets.bottom + 32 }]}>
      {/* ---- Center block: logo + subtitle + demo ---- */}
      <View style={styles.centerBlock}>
        <Animated.Text style={[styles.logo, { opacity: logoOpacity }]}>
          ROAM
        </Animated.Text>

        <Animated.Text style={[styles.subtitle, { opacity: subtitleOpacity }]}>
          Plan any trip in 30 seconds.
        </Animated.Text>

        {/* Animated itinerary preview */}
        <View style={styles.demoWrap}>
          {visibleLines.map((line, i) => (
            <Animated.Text
              key={`${cycleIndex}-${i}`}
              style={[styles.demoLine, { opacity: lineOpacities[i] }]}
            >
              {line}
            </Animated.Text>
          ))}
        </View>
      </View>

      {/* ---- Bottom CTAs ---- */}
      <Animated.View
        style={[
          styles.bottomCtas,
          {
            opacity: buttonsOpacity,
            transform: [{ translateY: buttonsTranslateY }],
          },
        ]}
      >
        <Pressable
          onPress={handlePlanTrip}
          style={({ pressed }) => [
            styles.primaryBtn,
            { transform: [{ scale: pressed ? 0.97 : 1 }] },
          ]}
        >
          <Text style={styles.primaryBtnText}>Plan a trip \u2014 free</Text>
        </Pressable>

        <Pressable onPress={handleSignIn} hitSlop={12}>
          <Text style={styles.signInText}>Sign in</Text>
        </Pressable>
      </Animated.View>
    </View>
  );
}

// ---------------------------------------------------------------------------
// Styles
// ---------------------------------------------------------------------------
const styles = StyleSheet.create({
  root: {
    flex: 1,
    backgroundColor: COLORS.bg,
    justifyContent: 'center',
    alignItems: 'center',
  } as ViewStyle,

  centerBlock: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    paddingHorizontal: SPACING.xl,
  } as ViewStyle,

  logo: {
    fontFamily: FONTS.header,
    fontSize: 72,
    color: COLORS.cream,
    letterSpacing: 4,
  } as TextStyle,

  subtitle: {
    fontFamily: FONTS.body,
    fontSize: 20,
    color: COLORS.muted,
    marginTop: 12,
  } as TextStyle,

  demoWrap: {
    marginTop: 40,
    minHeight: 80,
    alignItems: 'center',
  } as ViewStyle,

  demoLine: {
    fontFamily: FONTS.mono,
    fontSize: 14,
    color: COLORS.sage,
    opacity: 0.6,
    lineHeight: 24,
    textAlign: 'center',
  } as TextStyle,

  bottomCtas: {
    width: '100%',
    maxWidth: 400,
    paddingHorizontal: SPACING.lg,
    alignItems: 'center',
    gap: SPACING.md,
  } as ViewStyle,

  primaryBtn: {
    backgroundColor: COLORS.sage,
    borderRadius: RADIUS.pill,
    height: 48,
    width: '100%',
    alignItems: 'center',
    justifyContent: 'center',
  } as ViewStyle,

  primaryBtnText: {
    fontFamily: FONTS.bodyMedium,
    fontSize: 18,
    color: COLORS.bg,
  } as TextStyle,

  signInText: {
    fontFamily: FONTS.body,
    fontSize: 14,
    color: COLORS.muted,
    paddingVertical: SPACING.sm,
  } as TextStyle,
});
