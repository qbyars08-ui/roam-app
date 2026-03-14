// =============================================================================
// ROAM — Onboarding Screen 1: Splash
// Cinematic logo reveal with travel backdrop, auto-advances to Hook
// =============================================================================
import React, { useCallback, useEffect, useRef, useState } from 'react';
import { assignOnboardingVariant } from '../../lib/ab-test';
import {
  Animated,
  Easing,
  ImageBackground,
  Pressable,
  StyleSheet,
  Text,
  View,
  type ViewStyle,
  type TextStyle,
} from 'react-native';
import { LinearGradient } from 'expo-linear-gradient';
import { useRouter } from 'expo-router';
import AsyncStorage from '@react-native-async-storage/async-storage';
import * as Haptics from '../../lib/haptics';
import { supabase } from '../../lib/supabase';
import { useAppStore } from '../../lib/store';
import { enterGuestMode } from '../../lib/guest';
import { COLORS, FONTS, SPACING } from '../../lib/constants';
import { ONBOARDING_COMPLETE } from '../../lib/storage-keys';
import { getDestinationPhoto } from '../../lib/photos';

export default function SplashScreen() {
  const [browsing, setBrowsing] = useState(false);
  const router = useRouter();
  const logoOpacity = useRef(new Animated.Value(0)).current;
  const logoScale = useRef(new Animated.Value(0.85)).current;
  const taglineOpacity = useRef(new Animated.Value(0)).current;
  const glowOpacity = useRef(new Animated.Value(0)).current;
  const bgOpacity = useRef(new Animated.Value(0)).current;

  useEffect(() => {
    // Background fade in
    Animated.timing(bgOpacity, {
      toValue: 1,
      duration: 800,
      useNativeDriver: true,
    }).start();

    // Stage 1: Logo fades in + scales (after 200ms)
    const stage1Delay = Animated.delay(200);
    Animated.sequence([
      stage1Delay,
      Animated.parallel([
        Animated.timing(logoOpacity, {
          toValue: 1,
          duration: 600,
          easing: Easing.out(Easing.cubic),
          useNativeDriver: true,
        }),
        Animated.spring(logoScale, {
          toValue: 1,
          tension: 60,
          friction: 8,
          useNativeDriver: true,
        }),
      ]),
    ]).start();

    const timers: ReturnType<typeof setTimeout>[] = [];

    timers.push(setTimeout(() => {
      Animated.timing(glowOpacity, {
        toValue: 1,
        duration: 500,
        useNativeDriver: true,
      }).start();
    }, 400));

    timers.push(setTimeout(() => {
      Animated.timing(taglineOpacity, {
        toValue: 1,
        duration: 500,
        useNativeDriver: true,
      }).start();
    }, 900));

    timers.push(setTimeout(async () => {
      await assignOnboardingVariant(); // A/B: assign variant, tracked in Supabase
      router.replace('/(auth)/hook');
    }, 2400));

    return () => timers.forEach(clearTimeout);
  }, [bgOpacity, glowOpacity, logoOpacity, logoScale, router, taglineOpacity]);

  const handleBrowseFirst = useCallback(async () => {
    Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
    setBrowsing(true);
    try {
      const { data, error } = await supabase.auth.signInAnonymously();
      if (!error && data.session) {
        useAppStore.getState().setSession(data.session);
        await AsyncStorage.setItem(ONBOARDING_COMPLETE, 'true');
        router.replace('/(tabs)');
      } else {
        await enterGuestMode();
        router.replace('/(tabs)');
      }
    } catch {
      await enterGuestMode();
      router.replace('/(tabs)');
    } finally {
      setBrowsing(false);
    }
  }, [router]);

  return (
    <View style={styles.container}>
      <Animated.View style={[StyleSheet.absoluteFill, { opacity: bgOpacity }]}>
        <ImageBackground
          source={{ uri: getDestinationPhoto('tokyo') }}
          style={StyleSheet.absoluteFill}
          resizeMode="cover"
        />
        <LinearGradient
          colors={[COLORS.bgDarkGreenOverlay, COLORS.bgDarkGreen, COLORS.bg]}
          style={StyleSheet.absoluteFill}
          locations={[0, 0.5, 1]}
        />
      </Animated.View>

      <Animated.View style={[styles.glow, { opacity: glowOpacity }]} />

      <Animated.Text
        style={[
          styles.logo,
          {
            opacity: logoOpacity,
            transform: [{ scale: logoScale }],
          },
        ]}
      >
        ROAM
      </Animated.Text>

      <Animated.Text style={[styles.tagline, { opacity: taglineOpacity }]}>
        Go somewhere that changes you.
      </Animated.Text>

      <Pressable
        onPress={handleBrowseFirst}
        disabled={browsing}
        accessibilityRole="button"
        accessibilityLabel="Browse first"
        style={({ pressed }) => [
          styles.browseFirst,
          { opacity: pressed || browsing ? 0.7 : 1 },
        ]}
      >
        <Text style={styles.browseFirstText}>
          {browsing ? 'Loading...' : 'Browse first'}
        </Text>
      </Pressable>
    </View>
  );
}

const _rawStyles = {
  container: {
    flex: 1,
    backgroundColor: COLORS.bg,
    alignItems: 'center',
    justifyContent: 'center',
  } as ViewStyle,
  glow: {
    position: 'absolute',
    width: 320,
    height: 320,
    borderRadius: 160,
    backgroundColor: COLORS.gold,
    opacity: 0.12,
  } as ViewStyle,
  logo: {
    fontFamily: FONTS.header,
    fontSize: 80,
    color: COLORS.gold,
    letterSpacing: 12,
  } as TextStyle,
  tagline: {
    fontFamily: FONTS.body,
    fontSize: 16,
    color: COLORS.cream,
    opacity: 0.6,
    marginTop: 12,
    letterSpacing: 1,
  } as TextStyle,
  browseFirst: {
    position: 'absolute',
    bottom: SPACING.xxl,
    paddingVertical: SPACING.sm,
    paddingHorizontal: SPACING.md,
  } as ViewStyle,
  browseFirstText: {
    fontFamily: FONTS.body,
    fontSize: 14,
    color: COLORS.creamMuted,
  } as TextStyle,
};
const styles = StyleSheet.create(_rawStyles) as typeof _rawStyles;
