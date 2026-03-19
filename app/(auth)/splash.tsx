// =============================================================================
// ROAM — Splash Screen
// One job: make someone tap "Plan a trip" in under 5 seconds.
// Live demo cycles through real itinerary snippets. No stock photos.
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
// Itinerary demo snippets — real output samples that cycle every 8s
// ---------------------------------------------------------------------------
interface DemoSnippet {
  readonly dayHeader: string;
  readonly lines: readonly string[];
}

const DEMO_SNIPPETS: readonly DemoSnippet[] = [
  {
    dayHeader: 'Day 1 \u2014 Shibuya',
    lines: [
      'Morning: Tsukiji Outer Market. Get there by 7.',
      'The tuna auction tourists are gone by then.',
      '\u00A52,400 for the best sushi of your life.',
    ],
  },
  {
    dayHeader: 'Day 3 \u2014 Trastevere',
    lines: [
      'Skip the tourist restaurants on the main drag.',
      'Walk to Da Enzo. No reservation. Line moves fast.',
      'Get the cacio e pepe. \u20AC12.',
    ],
  },
  {
    dayHeader: 'Day 2 \u2014 Canggu',
    lines: [
      'Rent the scooter from Jl Pantai Berawa, not the resort.',
      'Half the price. Ride to Tanah Lot at 4pm.',
      'Golden hour. Free entry after 5.',
    ],
  },
] as const;

const CYCLE_INTERVAL_MS = 8000;
const LINE_STAGGER_MS = 300;
const LINES_PER_SNIPPET = 4; // 1 header + 3 content lines

// ---------------------------------------------------------------------------
// Component
// ---------------------------------------------------------------------------
export default function SplashScreen() {
  const router = useRouter();
  const insets = useSafeAreaInsets();

  // --- Animation values ---
  const logoOpacity = useRef(new Animated.Value(0)).current;
  const subtitleOpacity = useRef(new Animated.Value(0)).current;
  const buttonsTranslateY = useRef(new Animated.Value(30)).current;
  const buttonsOpacity = useRef(new Animated.Value(0)).current;

  // One animated value per line (header + 3 content lines)
  const lineOpacities = useRef(
    Array.from({ length: LINES_PER_SNIPPET }, () => new Animated.Value(0))
  ).current;

  const [snippetIndex, setSnippetIndex] = useState(0);
  const snippetIndexRef = useRef(0);

  // --- Fade in demo lines for a given snippet ---
  const animateDemoLines = useCallback(() => {
    // Reset all line opacities
    lineOpacities.forEach((val) => val.setValue(0));

    // Stagger fade-in for each line
    const animations = lineOpacities.map((opacity, i) =>
      Animated.sequence([
        Animated.delay(i * LINE_STAGGER_MS),
        Animated.timing(opacity, {
          toValue: 1,
          duration: 400,
          easing: Easing.out(Easing.cubic),
          useNativeDriver: true,
        }),
      ])
    );
    Animated.parallel(animations).start();
  }, [lineOpacities]);

  // --- Cycle snippets ---
  useEffect(() => {
    // Animate first snippet immediately after demo area appears
    const firstDemoTimer = setTimeout(() => {
      animateDemoLines();
    }, 800);

    // Show buttons after demo text settles (~2s into the experience)
    const buttonTimer = setTimeout(() => {
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

    // Cycle through snippets every 8s
    const cycleTimer = setInterval(() => {
      // Fade out all lines first
      Animated.parallel(
        lineOpacities.map((opacity) =>
          Animated.timing(opacity, {
            toValue: 0,
            duration: 250,
            useNativeDriver: true,
          })
        )
      ).start(() => {
        const nextIndex =
          (snippetIndexRef.current + 1) % DEMO_SNIPPETS.length;
        snippetIndexRef.current = nextIndex;
        setSnippetIndex(nextIndex);
        animateDemoLines();
      });
    }, CYCLE_INTERVAL_MS);

    return () => {
      clearTimeout(firstDemoTimer);
      clearTimeout(buttonTimer);
      clearInterval(cycleTimer);
    };
  }, [animateDemoLines, buttonsOpacity, buttonsTranslateY, lineOpacities]);

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

    const subtitleTimer = setTimeout(() => {
      Animated.timing(subtitleOpacity, {
        toValue: 1,
        duration: 500,
        useNativeDriver: true,
      }).start();
    }, 500);

    return () => clearTimeout(subtitleTimer);
  }, [logoOpacity, subtitleOpacity]);

  // --- Navigation handlers ---
  const handlePlanTrip = useCallback(() => {
    Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Medium);
    router.replace('/onboarding');
  }, [router]);

  const handleSignIn = useCallback(() => {
    Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
    router.replace('/(auth)/signin');
  }, [router]);

  const snippet = DEMO_SNIPPETS[snippetIndex];

  return (
    <View style={styles.container}>
      {/* ---- Top 40%: Logo + subtitle ---- */}
      <View style={styles.topSection}>
        <Animated.Text style={[styles.logo, { opacity: logoOpacity }]}>
          ROAM
        </Animated.Text>
        <Animated.Text style={[styles.subtitle, { opacity: subtitleOpacity }]}>
          Plan any trip in 30 seconds.
        </Animated.Text>
      </View>

      {/* ---- Middle: Live demo snippet ---- */}
      <View style={styles.demoSection}>
        <Animated.Text style={[styles.demoHeader, { opacity: lineOpacities[0] }]}>
          {snippet.dayHeader}
        </Animated.Text>
        {snippet.lines.map((line, i) => (
          <Animated.Text
            key={`${snippetIndex}-${i}`}
            style={[styles.demoLine, { opacity: lineOpacities[i + 1] }]}
          >
            {line}
          </Animated.Text>
        ))}
      </View>

      {/* ---- Bottom: CTAs ---- */}
      <Animated.View
        style={[
          styles.bottomSection,
          {
            paddingBottom: insets.bottom + 32,
            opacity: buttonsOpacity,
            transform: [{ translateY: buttonsTranslateY }],
          },
        ]}
      >
        <Pressable
          onPress={handlePlanTrip}
          style={({ pressed }) => [
            styles.primaryButton,
            { transform: [{ scale: pressed ? 0.97 : 1 }] },
          ]}
        >
          <Text style={styles.primaryButtonText}>Plan a trip \u2014 free</Text>
        </Pressable>

        <Pressable onPress={handleSignIn} hitSlop={12}>
          <Text style={styles.secondaryButtonText}>
            I already have an account
          </Text>
        </Pressable>
      </Animated.View>
    </View>
  );
}

// ---------------------------------------------------------------------------
// Styles
// ---------------------------------------------------------------------------
const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: COLORS.black,
  } as ViewStyle,

  // Top 40% — logo and tagline
  topSection: {
    flex: 4,
    alignItems: 'center',
    justifyContent: 'center',
  } as ViewStyle,

  logo: {
    fontFamily: FONTS.header,
    fontSize: 64,
    color: COLORS.cream,
    letterSpacing: 8,
  } as TextStyle,

  subtitle: {
    fontFamily: FONTS.body,
    fontSize: 18,
    color: COLORS.creamDim,
    marginTop: 12,
  } as TextStyle,

  // Middle — live demo
  demoSection: {
    flex: 3,
    paddingHorizontal: SPACING.xl,
    justifyContent: 'center',
  } as ViewStyle,

  demoHeader: {
    fontFamily: FONTS.mono,
    fontSize: 16,
    color: COLORS.sage,
    marginBottom: 12,
    letterSpacing: 0.5,
  } as TextStyle,

  demoLine: {
    fontFamily: FONTS.body,
    fontSize: 16,
    color: COLORS.creamSoft,
    lineHeight: 26,
  } as TextStyle,

  // Bottom — CTAs
  bottomSection: {
    flex: 2,
    paddingHorizontal: SPACING.lg,
    justifyContent: 'flex-end',
    alignItems: 'center',
    gap: SPACING.md,
  } as ViewStyle,

  primaryButton: {
    backgroundColor: COLORS.sage,
    borderRadius: RADIUS.pill,
    paddingVertical: SPACING.md + 2,
    width: '100%',
    alignItems: 'center',
  } as ViewStyle,

  primaryButtonText: {
    fontFamily: FONTS.bodyMedium,
    fontSize: 18,
    color: COLORS.bg,
  } as TextStyle,

  secondaryButtonText: {
    fontFamily: FONTS.body,
    fontSize: 14,
    color: COLORS.creamDim,
    paddingVertical: SPACING.sm,
  } as TextStyle,
});
