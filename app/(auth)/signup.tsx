// =============================================================================
// ROAM — Onboarding Screen 6: Sign Up
// Apple / Google / Email — then → Travel Profile → Discover
// =============================================================================
import React, { useEffect, useRef } from 'react';
import {
  Animated,
  Alert,
  Easing,
  Platform,
  Pressable,
  StyleSheet,
  Text,
  View,
  type ViewStyle,
  type TextStyle,
} from 'react-native';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { useRouter } from 'expo-router';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import * as Haptics from 'expo-haptics';
import { supabase } from '../../lib/supabase';
import { useAppStore } from '../../lib/store';
import { COLORS, FONTS, SPACING, RADIUS } from '../../lib/constants';

const DEV = __DEV__;
const isWeb = Platform.OS === 'web';

export default function SignUpScreen() {
  const router = useRouter();
  const insets = useSafeAreaInsets();
  const setSession = useAppStore((s) => s.setSession);

  const titleOpacity = useRef(new Animated.Value(0)).current;
  const titleY = useRef(new Animated.Value(20)).current;
  const btnsOpacity = useRef(new Animated.Value(0)).current;
  const btnsY = useRef(new Animated.Value(20)).current;
  const noteOpacity = useRef(new Animated.Value(0)).current;

  useEffect(() => {
    Animated.sequence([
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
      ]),
      Animated.delay(200),
      Animated.parallel([
        Animated.timing(btnsOpacity, {
          toValue: 1,
          duration: 500,
          useNativeDriver: true,
        }),
        Animated.timing(btnsY, {
          toValue: 0,
          duration: 500,
          easing: Easing.out(Easing.cubic),
          useNativeDriver: true,
        }),
      ]),
      Animated.timing(noteOpacity, {
        toValue: 1,
        duration: 400,
        useNativeDriver: true,
      }),
    ]).start();
  }, []);

  // -------------------------------------------------------------------------
  // Apple Sign-In
  // -------------------------------------------------------------------------
  const handleAppleSignIn = async () => {
    if (Platform.OS !== 'ios') return;
    try {
      const AppleAuthentication = require('expo-apple-authentication');
      const credential = await AppleAuthentication.signInAsync({
        requestedScopes: [
          AppleAuthentication.AppleAuthenticationScope.FULL_NAME,
          AppleAuthentication.AppleAuthenticationScope.EMAIL,
        ],
      });

      if (!credential.identityToken) {
        Alert.alert('Hmm', 'Apple Sign-In didn\u2019t come through. Give it one more try.');
        return;
      }

      const { error } = await supabase.auth.signInWithIdToken({
        provider: 'apple',
        token: credential.identityToken,
      });

      if (error) Alert.alert('Couldn\u2019t sign in', 'Something got in the way. Check your connection and try again.');
      // Auth listener in _layout.tsx will redirect to onboarding profile
    } catch (err: any) {
      if (err.code === 'ERR_REQUEST_CANCELED') return;
      Alert.alert('Hmm', 'Apple Sign-In hit a snag. One more try usually does it.');
    }
  };

  // -------------------------------------------------------------------------
  // Google Sign-In (OAuth redirect)
  // -------------------------------------------------------------------------
  const handleGoogleSignIn = async () => {
    try {
      const { error } = await supabase.auth.signInWithOAuth({
        provider: 'google',
        options: {
          redirectTo: Platform.OS === 'web'
            ? window.location.origin
            : 'roam://auth/callback',
        },
      });
      if (error) Alert.alert('Couldn\u2019t sign in', 'Something got in the way. Check your connection and try again.');
    } catch {
      Alert.alert('Hmm', 'Google Sign-In didn\u2019t work that time. Worth another shot.');
    }
  };

  // -------------------------------------------------------------------------
  // Guest / Skip (web: always visible; native: dev only)
  // Uses anonymous auth so API/trip generation works; fallback to fake session if anon disabled
  // -------------------------------------------------------------------------
  const handleContinueAsGuest = async () => {
    Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
    try {
      const { data, error } = await supabase.auth.signInAnonymously();
      if (error) throw error;
      if (data.session) {
        setSession(data.session);
        await AsyncStorage.setItem('@roam/onboarding_complete', 'true');
        router.replace('/(tabs)');
        return;
      }
    } catch {
      // Anonymous sign-in disabled — use fake guest session (browse only, trip gen may fail)
      const guestId = `guest-web-${Date.now()}`;
      setSession({ user: { id: guestId, email: null }, access_token: '', refresh_token: '' } as any);
      await AsyncStorage.setItem('@roam/onboarding_complete', 'true');
      router.replace('/(tabs)');
    }
  };

  // Apple button (iOS only)
  const AppleBtn = Platform.OS === 'ios'
    ? (() => {
        const A = require('expo-apple-authentication');
        return (
          <A.AppleAuthenticationButton
            buttonType={A.AppleAuthenticationButtonType.SIGN_UP}
            buttonStyle={A.AppleAuthenticationButtonStyle.WHITE}
            cornerRadius={RADIUS.lg}
            style={styles.appleBtn}
            onPress={handleAppleSignIn}
          />
        );
      })()
    : null;

  return (
    <View style={[styles.container, { paddingTop: insets.top }]}>
      <View style={styles.content}>
        <Animated.View
          style={{
            opacity: titleOpacity,
            transform: [{ translateY: titleY }],
            alignItems: 'center',
          }}
        >
          <Text style={styles.brand}>ROAM</Text>
          <Text style={styles.title}>Your trips are about{'\n'}to get way better</Text>
        </Animated.View>

        <Animated.View
          style={[
            styles.buttons,
            { opacity: btnsOpacity, transform: [{ translateY: btnsY }] },
          ]}
        >
          {/* Apple Sign-In (iOS only) */}
          {AppleBtn}

          {/* Google Sign-In */}
          <Pressable
            onPress={handleGoogleSignIn}
            accessibilityRole="button"
            accessibilityLabel="Continue with Google"
            style={({ pressed }) => [
              styles.socialBtn,
              styles.googleBtn,
              { opacity: pressed ? 0.85 : 1, transform: [{ scale: pressed ? 0.97 : 1 }] },
            ]}
          >
            <Text style={styles.socialBtnText}>Continue with Google</Text>
          </Pressable>

          {/* Email */}
          <Pressable
            onPress={() => router.push('/(auth)/signin')}
            accessibilityRole="button"
            accessibilityLabel="Continue with Email"
            style={({ pressed }) => [
              styles.socialBtn,
              styles.emailBtn,
              { opacity: pressed ? 0.85 : 1, transform: [{ scale: pressed ? 0.97 : 1 }] },
            ]}
          >
            <Text style={styles.emailBtnText}>Continue with Email</Text>
          </Pressable>
        </Animated.View>

        <Animated.View style={{ opacity: noteOpacity, alignItems: 'center' }}>
          <Text style={styles.freeNote}>No credit card. Free to start.</Text>
          <Text style={styles.terms}>
            By continuing, you agree to our{' '}
            <Text
              style={styles.termsLink}
              onPress={() => router.push('/terms')}
            >
              Terms of Service
            </Text>
            {'\n'}and{' '}
            <Text
              style={styles.termsLink}
              onPress={() => router.push('/privacy')}
            >
              Privacy Policy
            </Text>
            .
          </Text>
        </Animated.View>

        {(isWeb || DEV) && (
          <Pressable
            onPress={handleContinueAsGuest}
            accessibilityRole="button"
            accessibilityLabel="Continue as guest"
            style={({ pressed }) => [
              styles.guestBtn,
              { opacity: pressed ? 0.85 : 1 },
            ]}
          >
            <Text style={styles.guestBtnText}>Continue as guest</Text>
          </Pressable>
        )}
      </View>
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
    gap: SPACING.xxl,
  } as ViewStyle,
  brand: {
    fontFamily: FONTS.header,
    fontSize: 48,
    color: COLORS.gold,
    letterSpacing: 8,
    marginBottom: SPACING.md,
  } as TextStyle,
  title: {
    fontFamily: FONTS.header,
    fontSize: 32,
    color: COLORS.cream,
    textAlign: 'center',
    lineHeight: 40,
  } as TextStyle,
  buttons: {
    gap: SPACING.md,
  } as ViewStyle,
  appleBtn: {
    width: '100%',
    height: 54,
  } as ViewStyle,
  socialBtn: {
    height: 54,
    borderRadius: RADIUS.lg,
    alignItems: 'center',
    justifyContent: 'center',
    width: '100%',
  } as ViewStyle,
  googleBtn: {
    backgroundColor: '#FFFFFF',
  } as ViewStyle,
  socialBtnText: {
    fontFamily: FONTS.bodySemiBold,
    fontSize: 16,
    color: '#1A1A1A',
    letterSpacing: 0.3,
  } as TextStyle,
  emailBtn: {
    backgroundColor: 'transparent',
    borderWidth: 1.5,
    borderColor: COLORS.border,
  } as ViewStyle,
  emailBtnText: {
    fontFamily: FONTS.bodySemiBold,
    fontSize: 16,
    color: COLORS.cream,
    letterSpacing: 0.3,
  } as TextStyle,
  freeNote: {
    fontFamily: FONTS.bodySemiBold,
    fontSize: 14,
    color: COLORS.sage,
    marginBottom: SPACING.xs,
  } as TextStyle,
  terms: {
    fontFamily: FONTS.mono,
    fontSize: 11,
    color: COLORS.cream,
    opacity: 0.35,
    textAlign: 'center',
    lineHeight: 16,
  } as TextStyle,
  termsLink: {
    textDecorationLine: 'underline',
    opacity: 1,
  } as TextStyle,
  guestBtn: {
    marginTop: SPACING.lg,
    paddingVertical: SPACING.md,
    paddingHorizontal: SPACING.xl,
    borderRadius: RADIUS.md,
    borderWidth: 1,
    borderColor: COLORS.border,
    alignItems: 'center',
  } as ViewStyle,
  guestBtnText: {
    fontFamily: FONTS.bodyMedium,
    fontSize: 15,
    color: COLORS.creamMuted,
  } as TextStyle,
});
