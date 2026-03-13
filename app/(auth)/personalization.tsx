// =============================================================================
// ROAM — Onboarding Screen 5: Personalization Promise
// "ROAM learns you" — 3 feature cards + "Build my profile" CTA (no emojis)
// =============================================================================
import React, { useEffect, useRef } from 'react';
import {
  Animated,
  Easing,
  Pressable,
  StyleSheet,
  Text,
  View,
  type ViewStyle,
  type TextStyle,
} from 'react-native';
import { useRouter } from 'expo-router';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import * as Haptics from '../../lib/haptics';
import { COLORS, FONTS, SPACING, RADIUS } from '../../lib/constants';

interface Feature {
  marker: string;
  title: string;
  desc: string;
}

const FEATURES: Feature[] = [
  { marker: '1', title: 'Learns your style', desc: 'Food lover? Budget traveler? Solo explorer? ROAM adapts every recommendation to you.' },
  { marker: '2', title: 'Gets smarter over time', desc: "The more you use ROAM, the better it knows what you'll love. Every trip sharpens your profile." },
  { marker: '3', title: "It's yours. Always.", desc: 'Your preferences stay private. No data sold. No ads. Just better trips.' },
];

export default function PersonalizationScreen() {
  const router = useRouter();
  const insets = useSafeAreaInsets();

  const titleOpacity = useRef(new Animated.Value(0)).current;
  const titleY = useRef(new Animated.Value(20)).current;
  const cardAnims = useRef(
    FEATURES.map(() => ({
      opacity: new Animated.Value(0),
      x: new Animated.Value(-30),
    }))
  ).current;
  const btnOpacity = useRef(new Animated.Value(0)).current;

  useEffect(() => {
    // Title
    Animated.parallel([
      Animated.timing(titleOpacity, {
        toValue: 1,
        duration: 600,
        useNativeDriver: true,
      }),
      Animated.timing(titleY, {
        toValue: 0,
        duration: 600,
        easing: Easing.out(Easing.cubic),
        useNativeDriver: true,
      }),
    ]).start();

    // Staggered feature cards
    cardAnims.forEach((anim, i) => {
      setTimeout(() => {
        Animated.parallel([
          Animated.timing(anim.opacity, {
            toValue: 1,
            duration: 500,
            useNativeDriver: true,
          }),
          Animated.spring(anim.x, {
            toValue: 0,
            tension: 60,
            friction: 8,
            useNativeDriver: true,
          }),
        ]).start();
      }, 400 + i * 250);
    });

    // Button
    setTimeout(() => {
      Animated.timing(btnOpacity, {
        toValue: 1,
        duration: 500,
        useNativeDriver: true,
      }).start();
    }, 1500);
  }, []);

  const handleContinue = () => {
    Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Medium);
    router.push('/(auth)/signup');
  };

  return (
    <View style={[styles.container, { paddingTop: insets.top + 40 }]}>
      <View style={styles.content}>
        <Animated.View
          style={{
            opacity: titleOpacity,
            transform: [{ translateY: titleY }],
          }}
        >
          <Text style={styles.eyebrow}>PERSONALIZED AI</Text>
          <Text style={styles.title}>ROAM learns you</Text>
          <Text style={styles.sub}>
            Three questions. That's all it takes to build{'\n'}
            a travel profile that changes everything.
          </Text>
        </Animated.View>

        <View style={styles.features}>
          {FEATURES.map((f, i) => (
            <Animated.View
              key={i}
              style={[
                styles.featureCard,
                {
                  opacity: cardAnims[i].opacity,
                  transform: [{ translateX: cardAnims[i].x }],
                },
              ]}
            >
              <View style={styles.featureIconWrap}>
                <Text style={styles.featureMarker}>{f.marker}</Text>
              </View>
              <View style={styles.featureText}>
                <Text style={styles.featureTitle}>{f.title}</Text>
                <Text style={styles.featureDesc}>{f.desc}</Text>
              </View>
            </Animated.View>
          ))}
        </View>
      </View>

      {/* CTA */}
      <Animated.View
        style={[styles.btnContainer, { opacity: btnOpacity, paddingBottom: insets.bottom + 20 }]}
      >
        <Pressable
          onPress={handleContinue}
          accessibilityRole="button"
          accessibilityLabel="Build my profile"
          style={({ pressed }) => [
            styles.btn,
            { opacity: pressed ? 0.85 : 1, transform: [{ scale: pressed ? 0.97 : 1 }] },
          ]}
        >
          <Text style={styles.btnText}>Build my profile</Text>
        </Pressable>
      </Animated.View>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: COLORS.bg,
    paddingHorizontal: SPACING.lg,
  } as ViewStyle,
  content: {
    flex: 1,
    maxWidth: 600,
    alignSelf: 'center',
    width: '100%',
    justifyContent: 'center',
  } as ViewStyle,
  eyebrow: {
    fontFamily: FONTS.mono,
    fontSize: 11,
    color: COLORS.gold,
    letterSpacing: 3,
    textAlign: 'center',
    marginBottom: SPACING.sm,
  } as TextStyle,
  title: {
    fontFamily: FONTS.header,
    fontSize: 40,
    color: COLORS.cream,
    textAlign: 'center',
    marginBottom: SPACING.md,
  } as TextStyle,
  sub: {
    fontFamily: FONTS.body,
    fontSize: 16,
    color: COLORS.creamMuted,
    textAlign: 'center',
    lineHeight: 24,
    marginBottom: SPACING.xxl,
  } as TextStyle,
  features: {
    gap: SPACING.lg,
  } as ViewStyle,
  featureCard: {
    flexDirection: 'row',
    alignItems: 'flex-start',
    gap: SPACING.md,
    backgroundColor: COLORS.bgCard,
    borderRadius: RADIUS.lg,
    borderWidth: 1,
    borderColor: COLORS.border,
    padding: SPACING.lg,
  } as ViewStyle,
  featureIconWrap: {
    width: 32,
    alignItems: 'center',
  } as ViewStyle,
  featureMarker: {
    fontFamily: FONTS.mono,
    fontSize: 18,
    color: COLORS.gold,
    fontWeight: '600',
  } as TextStyle,
  featureText: {
    flex: 1,
  } as ViewStyle,
  featureTitle: {
    fontFamily: FONTS.bodySemiBold,
    fontSize: 16,
    color: COLORS.cream,
    marginBottom: 4,
  } as TextStyle,
  featureDesc: {
    fontFamily: FONTS.body,
    fontSize: 14,
    color: COLORS.creamMuted,
    lineHeight: 21,
  } as TextStyle,
  btnContainer: {
    paddingTop: SPACING.md,
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
