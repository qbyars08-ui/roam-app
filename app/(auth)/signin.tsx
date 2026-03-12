// =============================================================================
// ROAM — Email / Password Sign-In Screen
// =============================================================================
import React, { useState } from 'react';
import {
  View,
  Text,
  TextInput,
  Pressable,
  StyleSheet,
  Alert,
  KeyboardAvoidingView,
  Platform,
  type ViewStyle,
  type TextStyle,
} from 'react-native';
import { useRouter } from 'expo-router';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { supabase } from '../../lib/supabase';
import { COLORS, FONTS, SPACING, RADIUS } from '../../lib/constants';
import Button from '../../components/ui/Button';

export default function SignInScreen() {
  const router = useRouter();
  const insets = useSafeAreaInsets();
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [isSignUp, setIsSignUp] = useState(false);
  const [loading, setLoading] = useState(false);

  // ---------------------------------------------------------------------------
  // Auth handler
  // ---------------------------------------------------------------------------
  const handleAuth = async () => {
    if (!email.trim() || !password.trim()) {
      Alert.alert('Almost there', 'Need your email and password to let you in.');
      return;
    }

    setLoading(true);

    try {
      if (isSignUp) {
        const { error } = await supabase.auth.signUp({
          email: email.trim(),
          password,
        });
        if (error) throw error;
        Alert.alert('Check your inbox', 'Confirmation link sent. Verify your email and you\'re in.');
      } else {
        const { error } = await supabase.auth.signInWithPassword({
          email: email.trim(),
          password,
        });
        if (error) throw error;
        // Session change will trigger the auth guard redirect automatically
      }
    } catch (err: any) {
      Alert.alert('That didn\'t work', err.message ?? 'Try again — it usually does.');
    } finally {
      setLoading(false);
    }
  };

  // ---------------------------------------------------------------------------
  // Render
  // ---------------------------------------------------------------------------
  return (
    <KeyboardAvoidingView
      style={[styles.container, { paddingTop: insets.top }]}
      behavior={Platform.OS === 'ios' ? 'padding' : 'height'}
      keyboardVerticalOffset={Platform.OS === 'ios' ? 0 : 20}
    >
      {/* Back button */}
      <Pressable
        style={styles.backButton}
        onPress={() => router.back()}
        accessibilityRole="button"
        accessibilityLabel="Go back"
      >
        <Text style={styles.backText}>Back</Text>
      </Pressable>

      {/* Header */}
      <View style={styles.headerContainer}>
        <Text style={styles.title}>{isSignUp ? 'Join ROAM' : 'Welcome back'}</Text>
        <Text style={styles.subtitle}>
          {isSignUp
            ? 'Takes 30 seconds. Then we build your first trip.'
            : 'Your trips are waiting.'}
        </Text>
      </View>

      {/* Form */}
      <View style={styles.form}>
        <View style={styles.inputWrapper}>
          <Text style={styles.inputLabel}>EMAIL</Text>
          <TextInput
            style={styles.input}
            value={email}
            onChangeText={setEmail}
            placeholder="you@example.com"
            placeholderTextColor={`${COLORS.cream}33`}
            keyboardType="email-address"
            autoCapitalize="none"
            autoCorrect={false}
            autoComplete="email"
          />
        </View>

        <View style={styles.inputWrapper}>
          <Text style={styles.inputLabel}>PASSWORD</Text>
          <TextInput
            style={styles.input}
            value={password}
            onChangeText={setPassword}
            placeholder="Enter your password"
            placeholderTextColor={`${COLORS.cream}33`}
            secureTextEntry
            autoCapitalize="none"
            autoComplete={isSignUp ? 'new-password' : 'current-password'}
          />
        </View>

        <Button
          label={isSignUp ? 'Get started' : 'Sign in'}
          variant="sage"
          onPress={handleAuth}
          loading={loading}
          disabled={loading}
        />

        {/* Toggle sign-in / sign-up */}
        <Pressable style={styles.toggleRow} onPress={() => setIsSignUp(!isSignUp)}>
          <Text style={styles.toggleText}>
            {isSignUp ? 'Already here? ' : "New here? "}
          </Text>
          <Text style={styles.toggleLink}>
            {isSignUp ? 'Sign in' : 'Create account'}
          </Text>
        </Pressable>
      </View>

      {/* Bottom spacer for keyboard avoidance */}
      <View style={styles.bottomSpacer} />
    </KeyboardAvoidingView>
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
  } as ViewStyle,
  backButton: {
    paddingTop: SPACING.xxl + SPACING.md,
    paddingBottom: SPACING.md,
    alignSelf: 'flex-start',
  } as ViewStyle,
  backText: {
    fontFamily: FONTS.bodyMedium,
    fontSize: 16,
    color: COLORS.sage,
  } as TextStyle,
  headerContainer: {
    marginTop: SPACING.xl,
    marginBottom: SPACING.xxl,
  } as ViewStyle,
  title: {
    fontFamily: FONTS.header,
    fontSize: 36,
    color: COLORS.cream,
    marginBottom: SPACING.sm,
  } as TextStyle,
  subtitle: {
    fontFamily: FONTS.body,
    fontSize: 16,
    color: COLORS.cream,
    opacity: 0.6,
  } as TextStyle,
  form: {
    gap: SPACING.lg,
  } as ViewStyle,
  inputWrapper: {
    gap: SPACING.xs,
  } as ViewStyle,
  inputLabel: {
    fontFamily: FONTS.mono,
    fontSize: 11,
    color: COLORS.sage,
    letterSpacing: 1.5,
  } as TextStyle,
  input: {
    height: 54,
    borderRadius: RADIUS.md,
    borderWidth: 1.5,
    borderColor: COLORS.border,
    backgroundColor: COLORS.bgCard,
    paddingHorizontal: SPACING.md,
    fontFamily: FONTS.body,
    fontSize: 16,
    color: COLORS.cream,
  } as TextStyle,
  toggleRow: {
    flexDirection: 'row',
    justifyContent: 'center',
    marginTop: SPACING.sm,
  } as ViewStyle,
  toggleText: {
    fontFamily: FONTS.body,
    fontSize: 14,
    color: COLORS.cream,
    opacity: 0.5,
  } as TextStyle,
  toggleLink: {
    fontFamily: FONTS.bodySemiBold,
    fontSize: 14,
    color: COLORS.sage,
  } as TextStyle,
  bottomSpacer: {
    flex: 1,
  } as ViewStyle,
});
