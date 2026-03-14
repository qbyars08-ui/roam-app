// =============================================================================
// ROAM — Welcome / Onboarding Screen
// Apple Sign-In + Email auth entry point
// =============================================================================
import React from 'react';
import {
  View,
  Text,
  StyleSheet,
  Platform,
  Alert,
  Pressable,
  type ViewStyle,
  type TextStyle,
} from 'react-native';
import { useTranslation } from 'react-i18next';
import { useRouter } from 'expo-router';
import { supabase } from '../../lib/supabase';
import { useAppStore } from '../../lib/store';
import { COLORS, FONTS, SPACING, RADIUS } from '../../lib/constants';
import Button from '../../components/ui/Button';

const DEV = !!process.env.EXPO_PUBLIC_DEV || __DEV__;

export default function WelcomeScreen() {
  const { t } = useTranslation();
  const router = useRouter();
  const setSession = useAppStore((s) => s.setSession);

  const handleSkipLogin = () => {
    setSession({ user: { id: 'dev-user', email: 'dev@roam.app' } } as any);
    router.replace('/(tabs)');
  };

  // ---------------------------------------------------------------------------
  // Apple Sign-In (iOS only — expo-apple-authentication is native-only)
  // ---------------------------------------------------------------------------
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

      if (error) {
        Alert.alert('Couldn\u2019t sign in', 'Something got in the way. Check your connection and try again.');
      }
    } catch (err: any) {
      if (err.code === 'ERR_REQUEST_CANCELED') {
        return;
      }
      Alert.alert('Hmm', 'Apple Sign-In hit a snag. One more try usually does it.');
    }
  };

  // Apple Sign-In button (only render on iOS; package not compatible with web)
  const AppleSignInButton = Platform.OS === 'ios' ? (() => {
    const A = require('expo-apple-authentication');
    return (
      <A.AppleAuthenticationButton
        buttonType={A.AppleAuthenticationButtonType.SIGN_IN}
        buttonStyle={A.AppleAuthenticationButtonStyle.WHITE}
        cornerRadius={RADIUS.lg}
        style={styles.appleButton}
        onPress={handleAppleSignIn}
      />
    );
  })() : null;

  // ---------------------------------------------------------------------------
  // Render
  // ---------------------------------------------------------------------------
  return (
    <View style={styles.container}>
      {/* Decorative top spacer */}
      <View style={styles.topSpacer} />

      {/* Brand */}
      <View style={styles.brandContainer}>
        <Text style={styles.brandMark}>{t('common.appName')}</Text>
        <Text style={styles.tagline}>{t('discover.editorialHeaders.2')}</Text>
      </View>

      {/* Bottom actions */}
      <View style={styles.actionsContainer}>
        {AppleSignInButton}

        <Button
          label={t('auth.continueWith', { provider: 'Email' })}
          variant="outline"
          onPress={() => router.push('/(auth)/signin')}
        />

        <Text style={styles.disclaimer}>
          By continuing, you agree to our {t('paywall.terms')} and {t('paywall.privacy')}.
        </Text>

        {DEV && (
          <Pressable
            onPress={handleSkipLogin}
            accessibilityRole="button"
            accessibilityLabel="Skip login (Dev only)"
            style={({ pressed }) => [
              styles.skipButton,
              { opacity: pressed ? 0.7 : 1 },
            ]}
          >
            <Text style={styles.skipButtonText}>Skip Login (Dev Only)</Text>
          </Pressable>
        )}
      </View>
    </View>
  );
}

// ---------------------------------------------------------------------------
// Styles
// ---------------------------------------------------------------------------
const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: COLORS.bg,
    paddingHorizontal: SPACING.lg,
    justifyContent: 'space-between',
  } as ViewStyle,
  topSpacer: {
    flex: 1,
  } as ViewStyle,
  brandContainer: {
    alignItems: 'center',
    flex: 2,
    justifyContent: 'center',
  } as ViewStyle,
  brandMark: {
    fontFamily: FONTS.header,
    fontSize: 64,
    color: COLORS.gold,
    letterSpacing: 8,
    marginBottom: SPACING.sm,
  } as TextStyle,
  tagline: {
    fontFamily: FONTS.body,
    fontSize: 18,
    color: COLORS.cream,
    letterSpacing: 0.5,
    opacity: 0.8,
  } as TextStyle,
  actionsContainer: {
    flex: 1.5,
    justifyContent: 'flex-end',
    paddingBottom: SPACING.xxl,
    gap: SPACING.md,
  } as ViewStyle,
  appleButton: {
    width: '100%',
    height: 54,
  } as ViewStyle,
  disclaimer: {
    fontFamily: FONTS.mono,
    fontSize: 11,
    color: COLORS.cream,
    opacity: 0.4,
    textAlign: 'center',
    marginTop: SPACING.xs,
    lineHeight: 16,
  } as TextStyle,
  skipButton: {
    marginTop: SPACING.lg,
    paddingVertical: SPACING.sm,
    alignItems: 'center',
  } as ViewStyle,
  skipButtonText: {
    fontFamily: FONTS.mono,
    fontSize: 12,
    color: COLORS.sage,
    opacity: 0.7,
    letterSpacing: 0.5,
  } as TextStyle,
});
