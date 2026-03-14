// =============================================================================
// ROAM — Onboarding Screen 2: The Hook
// Full-screen hero photo + "Travel like you know someone there"
// =============================================================================
import React, { useCallback, useEffect, useRef, useState } from 'react';
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
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import AsyncStorage from '@react-native-async-storage/async-storage';
import * as Haptics from 'expo-haptics';
import { supabase } from '../../lib/supabase';
import { useAppStore } from '../../lib/store';
import { enterGuestMode } from '../../lib/guest';
import { useTranslation } from 'react-i18next';
import { COLORS, FONTS, SPACING, RADIUS } from '../../lib/constants';
import { ONBOARDING_COMPLETE } from '../../lib/storage-keys';
import { getDestinationPhoto } from '../../lib/photos';

const HERO_IMAGE = () => getDestinationPhoto('travel');

export default function HookScreen() {
  const { t } = useTranslation();
  const router = useRouter();
  const insets = useSafeAreaInsets();

  const headlineOpacity = useRef(new Animated.Value(0)).current;
  const headlineY = useRef(new Animated.Value(30)).current;
  const subOpacity = useRef(new Animated.Value(0)).current;
  const btnOpacity = useRef(new Animated.Value(0)).current;
  const btnY = useRef(new Animated.Value(20)).current;
  const imageScale = useRef(new Animated.Value(1.1)).current;

  useEffect(() => {
    // Ken Burns zoom-out on background
    Animated.timing(imageScale, {
      toValue: 1,
      duration: 8000,
      easing: Easing.out(Easing.cubic),
      useNativeDriver: true,
    }).start();

    // Staggered text entrance
    Animated.sequence([
      Animated.delay(300),
      Animated.parallel([
        Animated.timing(headlineOpacity, {
          toValue: 1,
          duration: 700,
          useNativeDriver: true,
        }),
        Animated.timing(headlineY, {
          toValue: 0,
          duration: 700,
          easing: Easing.out(Easing.cubic),
          useNativeDriver: true,
        }),
      ]),
      Animated.timing(subOpacity, {
        toValue: 1,
        duration: 500,
        useNativeDriver: true,
      }),
      Animated.delay(200),
      Animated.parallel([
        Animated.timing(btnOpacity, {
          toValue: 1,
          duration: 500,
          useNativeDriver: true,
        }),
        Animated.timing(btnY, {
          toValue: 0,
          duration: 500,
          easing: Easing.out(Easing.cubic),
          useNativeDriver: true,
        }),
      ]),
    ]).start();
  }, []);

  const setSession = useAppStore((s) => s.setSession);
  const [browsing, setBrowsing] = useState(false);

  const handleContinue = () => {
    Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Medium);
    router.push('/(auth)/onboard');
  };

  const handleBrowseFirst = useCallback(async () => {
    Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
    setBrowsing(true);
    try {
      const { data, error } = await supabase.auth.signInAnonymously();
      if (!error && data.session) {
        setSession(data.session);
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
  }, [setSession, router]);

  return (
    <View style={styles.container}>
      <Animated.View
        style={[StyleSheet.absoluteFill, { transform: [{ scale: imageScale }] }]}
      >
        <ImageBackground
          source={{ uri: HERO_IMAGE() }}
          style={StyleSheet.absoluteFill}
          resizeMode="cover"
        />
      </Animated.View>

      <LinearGradient
        colors={['transparent', COLORS.bgDarkGreenFull, COLORS.bgDarkGreenMedium, COLORS.bg]}
        locations={[0, 0.35, 0.65, 1]}
        style={StyleSheet.absoluteFill}
      />

      <View style={[styles.content, { paddingBottom: insets.bottom + 40 }]}>
        <Animated.Text
          style={[
            styles.headline,
            {
              opacity: headlineOpacity,
              transform: [{ translateY: headlineY }],
            },
          ]}
        >
          Travel like you{'\n'}know someone there
        </Animated.Text>

        <Animated.Text style={[styles.sub, { opacity: subOpacity }]}>
          AI-powered itineraries that feel like they came{'\n'}
          from a well-traveled friend, not a search engine.
        </Animated.Text>

        <Animated.View
          style={{ opacity: btnOpacity, transform: [{ translateY: btnY }] }}
        >
          <Pressable
            onPress={handleContinue}
            disabled={browsing}
            accessibilityRole="button"
            accessibilityLabel="Build my first trip"
            style={({ pressed }) => [
              styles.btn,
              { opacity: pressed || browsing ? 0.85 : 1, transform: [{ scale: pressed ? 0.97 : 1 }] },
            ]}
          >
            <Text style={styles.btnText}>Build my first trip</Text>
          </Pressable>
          <Pressable
            onPress={handleBrowseFirst}
            disabled={browsing}
            accessibilityRole="button"
            accessibilityLabel={t('auth.browseFirst')}
            style={({ pressed }) => [
              styles.browseBtn,
              { opacity: pressed || browsing ? 0.7 : 1 },
            ]}
          >
            <Text style={styles.browseBtnText}>{browsing ? t('common.loading') : t('auth.browseFirst')}</Text>
          </Pressable>
        </Animated.View>
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: COLORS.bg,
  } as ViewStyle,
  content: {
    flex: 1,
    justifyContent: 'flex-end',
    paddingHorizontal: SPACING.lg,
    maxWidth: 600,
    alignSelf: 'center',
    width: '100%',
  } as ViewStyle,
  headline: {
    fontFamily: FONTS.header,
    fontSize: 44,
    color: COLORS.cream,
    lineHeight: 52,
    marginBottom: SPACING.md,
  } as TextStyle,
  sub: {
    fontFamily: FONTS.body,
    fontSize: 17,
    color: COLORS.cream,
    opacity: 0.7,
    lineHeight: 26,
    marginBottom: SPACING.xl,
  } as TextStyle,
  btn: {
    backgroundColor: COLORS.gold,
    height: 56,
    borderRadius: RADIUS.lg,
    alignItems: 'center',
    justifyContent: 'center',
    marginBottom: SPACING.md,
  } as ViewStyle,
  btnText: {
    fontFamily: FONTS.bodySemiBold,
    fontSize: 17,
    color: COLORS.bg,
    letterSpacing: 0.3,
  } as TextStyle,
  browseBtn: {
    alignItems: 'center',
    paddingVertical: SPACING.md,
  } as ViewStyle,
  browseBtnText: {
    fontFamily: FONTS.body,
    fontSize: 15,
    color: COLORS.creamMuted,
  } as TextStyle,
});
