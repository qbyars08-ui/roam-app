// =============================================================================
// ROAM — 3-Screen Onboarding (Duolingo Model)
// Value first, signup last. docs/onboarding-research.md
// Screen 1: Where to? / Surprise Me
// Screen 2: AI generates a real trip (experience, not wait)
// Screen 3: Save your trip — create account
// =============================================================================
import React, { useCallback, useEffect, useRef, useState } from 'react';
import { useFocusEffect } from '@react-navigation/native';
import {
  Alert,
  Animated,
  ImageBackground,
  Platform,
  Pressable,
  StyleSheet,
  Text,
  View,
  type TextStyle,
  type ViewStyle,
} from 'react-native';
import { useRouter } from 'expo-router';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import AsyncStorage from '@react-native-async-storage/async-storage';
import * as Haptics from '../../lib/haptics';
import { LinearGradient } from 'expo-linear-gradient';

import { COLORS, FONTS, SPACING, RADIUS, DESTINATIONS, BUDGETS, VIBES, FREE_TRIPS_PER_MONTH } from '../../lib/constants';
import { getDestinationPhoto } from '../../lib/photos';
import { useAppStore } from '../../lib/store';
import { generateItinerary, TripLimitReachedError } from '../../lib/claude';
import { supabase } from '../../lib/supabase';
// WaitlistCaptureModal removed — onboarding now always shows real auth

import { ONBOARDING_COMPLETE } from '../../lib/storage-keys';
const DESTINATION_CHOICES = DESTINATIONS.slice(0, 4);
const DEV = __DEV__;

// ---------------------------------------------------------------------------
// Step 1: Destination
// ---------------------------------------------------------------------------
function StepDestination({
  onSelect,
  onSurpriseMe,
}: {
  onSelect: (dest: string) => void;
  onSurpriseMe: () => void;
}) {
  const insets = useSafeAreaInsets();
  const fade = useRef(new Animated.Value(0)).current;
  useEffect(() => {
    Animated.timing(fade, { toValue: 1, duration: 600, useNativeDriver: true }).start();
  }, [fade]);

  return (
    <Animated.View style={[styles.step, { opacity: fade, paddingTop: insets.top }]}>
      <Text style={styles.title}>Where to?</Text>
      <Text style={styles.subtitle}>We'll build you a real trip in seconds</Text>

      <View style={styles.destGrid}>
        {DESTINATION_CHOICES.map((d) => (
          <Pressable
            key={d.label}
            onPress={() => {
              Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Medium);
              onSelect(d.label);
            }}
            accessibilityRole="button"
            accessibilityLabel={d.label}
            style={({ pressed }) => [
              styles.destCard,
              { opacity: pressed ? 0.9 : 1, transform: [{ scale: pressed ? 0.98 : 1 }] },
            ]}
          >
            <ImageBackground
              source={{ uri: getDestinationPhoto(d.label) }}
              style={styles.destCardBg}
              imageStyle={{ borderRadius: RADIUS.lg }}
              resizeMode="cover"
            >
              <LinearGradient
                colors={['transparent', COLORS.overlayDeeper]}
                style={StyleSheet.absoluteFill}
              />
              <Text style={styles.destLabel}>{d.label}</Text>
            </ImageBackground>
          </Pressable>
        ))}
      </View>

      <Pressable
        onPress={() => {
          Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
          onSurpriseMe();
        }}
        accessibilityRole="button"
        accessibilityLabel="Surprise me"
        style={({ pressed }) => [
          styles.surpriseBtn,
          { opacity: pressed ? 0.85 : 1 },
        ]}
      >
        <Text style={styles.surpriseBtnText}>Surprise me</Text>
      </Pressable>
    </Animated.View>
  );
}

// ---------------------------------------------------------------------------
// Step 2: Generating (make it an experience)
// ---------------------------------------------------------------------------
function StepGenerating({ destination }: { destination: string }) {
  const pulse = useRef(new Animated.Value(1)).current;
  const dotOpacity = useRef([new Animated.Value(0), new Animated.Value(0), new Animated.Value(0)]).current;

  useEffect(() => {
    const loop = Animated.loop(
      Animated.sequence([
        Animated.timing(pulse, { toValue: 1.08, duration: 700, useNativeDriver: true }),
        Animated.timing(pulse, { toValue: 1, duration: 700, useNativeDriver: true }),
      ])
    );
    loop.start();
    return () => loop.stop();
  }, [pulse]);

  useEffect(() => {
    const stagger = dotOpacity.map((anim, i) =>
      Animated.loop(
        Animated.sequence([
          Animated.delay(i * 200),
          Animated.timing(anim, { toValue: 1, duration: 400, useNativeDriver: true }),
          Animated.timing(anim, { toValue: 0.3, duration: 400, useNativeDriver: true }),
        ])
      )
    );
    stagger.forEach((s) => s.start());
    return () => stagger.forEach((s) => s.stop());
  }, [dotOpacity]);

  return (
    <View style={[styles.step, styles.generatingStep, { paddingTop: 0 }]}>
      <Animated.View style={[styles.generatingIcon, { transform: [{ scale: pulse }] }]}>
        <View style={styles.generatingRing} />
      </Animated.View>
      <Text style={styles.generatingTitle}>Building your {destination} trip</Text>
      <Text style={styles.generatingSub}>Real places. Real tips. No filler.</Text>
      <View style={styles.dots}>
        {dotOpacity.map((anim, i) => (
          <Animated.View key={i} style={[styles.dot, { opacity: anim }]} />
        ))}
      </View>
    </View>
  );
}

// ---------------------------------------------------------------------------
// Step 3: Signup (save your trip)
// ---------------------------------------------------------------------------
function StepSignup({
  destination,
  onSignIn,
  onSkip,
}: {
  destination: string;
  onSignIn: () => void;
  onComplete?: () => void;
  onSkip: () => void;
}) {
  const insets = useSafeAreaInsets();
  const [loading, setLoading] = useState(false);

  const handleApple = async () => {
    if (Platform.OS !== 'ios') return;
    setLoading(true);
    try {
      const AppleAuth = require('expo-apple-authentication');
      const cred = await AppleAuth.signInAsync({
        requestedScopes: [AppleAuth.AppleAuthenticationScope.FULL_NAME, AppleAuth.AppleAuthenticationScope.EMAIL],
      });
      if (!cred.identityToken) {
        Alert.alert('Try again', 'Apple Sign-In didn\u2019t come through.');
        return;
      }
      const { error } = await supabase.auth.signInWithIdToken({
        provider: 'apple',
        token: cred.identityToken,
      });
      if (error) {
        Alert.alert('Sign-in failed', error.message);
      } else {
        await AsyncStorage.setItem(ONBOARDING_COMPLETE, 'true');
      }
    } catch (e: unknown) {
      if (e && typeof e === 'object' && 'code' in e && e.code !== 'ERR_REQUEST_CANCELED') {
        Alert.alert('Try again', 'Apple Sign-In hit a snag.');
      }
    } finally {
      setLoading(false);
    }
  };

  const handleGoogle = async () => {
    setLoading(true);
    try {
      const { error } = await supabase.auth.signInWithOAuth({
        provider: 'google',
        options: {
          redirectTo: Platform.OS === 'web' ? window.location.origin : 'roam://auth/callback',
        },
      });
      if (error) {
        Alert.alert('Sign-in failed', error.message);
      }
      // Note: ONBOARDING_COMPLETE_KEY is set by the auth callback handler
      // after the OAuth redirect completes — not here, since the browser
      // flow hasn't finished yet when signInWithOAuth returns.
    } finally {
      setLoading(false);
    }
  };

  return (
    <View style={[styles.step, { paddingTop: insets.top }]}>
      <Text style={styles.signupTitle}>Save your {destination} trip</Text>
      <Text style={styles.signupSub}>Create an account to keep this trip on all your devices</Text>

      <View style={styles.signupButtons}>
        {Platform.OS === 'ios' && (
          <Pressable
            onPress={handleApple}
            disabled={loading}
            style={({ pressed }) => [
              styles.signupBtn,
              styles.appleBtn,
              { opacity: pressed || loading ? 0.8 : 1 },
            ]}
          >
            <Text style={styles.appleBtnText}>Continue with Apple</Text>
          </Pressable>
        )}
        <Pressable
          onPress={handleGoogle}
          disabled={loading}
          style={({ pressed }) => [
            styles.signupBtn,
            styles.googleBtn,
            { opacity: pressed || loading ? 0.8 : 1 },
          ]}
        >
          <Text style={styles.googleBtnText}>Continue with Google</Text>
        </Pressable>
        <Pressable
          onPress={onSignIn}
          disabled={loading}
          style={({ pressed }) => [
            styles.signupBtn,
            styles.emailBtn,
            { opacity: pressed || loading ? 0.8 : 1 },
          ]}
        >
          <Text style={styles.emailBtnText}>Continue with Email</Text>
        </Pressable>
      </View>

      <Pressable onPress={onSkip} style={({ pressed }) => [styles.skipWrap, { opacity: pressed ? 0.6 : 1 }]}>
        <Text style={styles.skipText}>View my trip first</Text>
        <Text style={styles.skipSubtext}>You can save it later</Text>
      </Pressable>

      {DEV && (
        <Pressable
          onPress={onSkip}
          style={styles.devSkip}
        >
          <Text style={styles.devSkipText}>Dev: Skip login</Text>
        </Pressable>
      )}
    </View>
  );
}

// ---------------------------------------------------------------------------
// Main
// ---------------------------------------------------------------------------
export default function OnboardScreen() {
  const router = useRouter();
  const insets = useSafeAreaInsets();
  const [step, setStep] = useState(0);
  const [destination, setDestination] = useState('');
  const [tripId, setTripId] = useState<string | null>(null);
  const [error, setError] = useState<string | null>(null);

  const addTrip = useAppStore((s) => s.addTrip);
  const setTripsThisMonth = useAppStore((s) => s.setTripsThisMonth);
  const setSession = useAppStore((s) => s.setSession);
  const hasCompletedProfile = useAppStore((s) => s.hasCompletedProfile);
  const isPro = useAppStore((s) => s.isPro);
  const tripsThisMonth = useAppStore((s) => s.tripsThisMonth);
  const setPendingOnboardDestination = useAppStore((s) => s.setPendingOnboardDestination);
  const pendingOnboardDestination = useAppStore((s) => s.pendingOnboardDestination);
  const session = useAppStore((s) => s.session);
  const isGuest = !session;
  const isGuestLike = isGuest || !!(session?.user && 'is_anonymous' in session.user && session.user.is_anonymous);

  const handleDestinationSelect = useCallback(
    (dest: string) => {
      if (!hasCompletedProfile && !isGuest) {
        setPendingOnboardDestination(dest);
        router.push('/travel-profile');
        return;
      }
      setDestination(dest);
      setStep(1);
    },
    [hasCompletedProfile, isGuest, setPendingOnboardDestination, router]
  );

  const handleSurpriseMe = useCallback(() => {
    const d = DESTINATIONS[Math.floor(Math.random() * DESTINATIONS.length)];
    if (!hasCompletedProfile && !isGuest) {
      setPendingOnboardDestination(d.label);
      router.push('/travel-profile');
      return;
    }
    setDestination(d.label);
    setStep(1);
  }, [hasCompletedProfile, isGuest, setPendingOnboardDestination, router]);

  // Sign in anonymously so generateItinerary (edge function) has a valid JWT
  useEffect(() => {
    if (!session) {
      supabase.auth.signInAnonymously().then(({ data }) => {
        if (data?.session) setSession(data.session);
      }).catch(() => {});
    }
  }, [session, setSession]);

  useFocusEffect(
    useCallback(() => {
      if (pendingOnboardDestination) {
        setDestination(pendingOnboardDestination);
        setStep(1);
        setPendingOnboardDestination(null);
      }
    }, [pendingOnboardDestination, setPendingOnboardDestination])
  );

  const handleGenerate = useCallback(async () => {
    if (!destination) return;
    if (!isGuestLike && !isPro && tripsThisMonth >= FREE_TRIPS_PER_MONTH) {
      router.push({ pathname: '/paywall', params: { reason: 'limit', destination } });
      return;
    }
    setError(null);
    try {
      if (!session) {
        const { data, error: signErr } = await supabase.auth.signInAnonymously();
        if (!signErr && data?.session) setSession(data.session);
      }
      const budget = BUDGETS[Math.floor(Math.random() * BUDGETS.length)].id;
      const shuffled = [...VIBES].sort(() => Math.random() - 0.5);
      const vibes = shuffled.slice(0, 3).map((v) => v.label);

      const { itinerary: parsed, tripsUsed } = await generateItinerary({
        destination,
        days: 5,
        budget,
        vibes,
        travelProfile: null,
      });

      const trip = {
        id: `onboard-${Date.now()}`,
        destination,
        days: 5,
        budget,
        vibes,
        itinerary: JSON.stringify(parsed),
        createdAt: new Date().toISOString(),
      };

      addTrip(trip);
      setTripsThisMonth(tripsUsed);
      setTripId(trip.id);
      setStep(2);
    } catch (err: unknown) {
      if (err instanceof TripLimitReachedError) {
        router.push({ pathname: '/paywall', params: { reason: 'limit', destination } });
        return;
      }
      setError('We couldn\'t build your trip right now. Check your connection and try again.');
    }
  }, [destination, addTrip, setTripsThisMonth, router, isPro, tripsThisMonth, isGuestLike, session, setSession]);

  const handleSkipSignup = useCallback(async () => {
    await AsyncStorage.setItem(ONBOARDING_COMPLETE, 'true');
    if (DEV) {
      setSession({ user: { id: 'dev-user', email: 'dev@roam.app' } } as import('@supabase/supabase-js').Session);
    } else if (!session) {
      const { data, error } = await supabase.auth.signInAnonymously();
      if (!error && data.session) setSession(data.session);
    }
    router.replace('/(tabs)');
    if (tripId) {
      setTimeout(() => router.push({ pathname: '/itinerary', params: { tripId } }), 300);
    }
  }, [tripId, session, setSession, router]);

  useEffect(() => {
    if (step === 1 && destination) {
      // eslint-disable-next-line react-hooks/set-state-in-effect -- async trip generation
      handleGenerate();
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps -- intentionally runs once on step change
  }, [step, destination]);

  if (step === 0) {
    return (
      <View style={styles.container}>
        <StepDestination onSelect={handleDestinationSelect} onSurpriseMe={handleSurpriseMe} />
      </View>
    );
  }

  if (step === 1) {
    return (
      <View style={[styles.container, styles.generatingContainer, { paddingTop: insets.top }]}>
        <ImageBackground
          source={{ uri: getDestinationPhoto(destination) }}
          style={StyleSheet.absoluteFill}
          resizeMode="cover"
        >
          <LinearGradient
            colors={[COLORS.bgDarkGreenSoft, COLORS.bgDarkGreenMedium, COLORS.bg]}
            style={StyleSheet.absoluteFill}
            locations={[0, 0.5, 1]}
          />
        </ImageBackground>
        <StepGenerating destination={destination} />
        {error && (
          <View style={styles.errorRow}>
            <Text style={styles.errorText}>{error}</Text>
            <Pressable onPress={() => setStep(0)}>
              <Text style={styles.errorCta}>Pick again</Text>
            </Pressable>
          </View>
        )}
      </View>
    );
  }

  // Always show real auth (Apple/Google/Email) — never block with waitlist
  return (
    <View style={styles.container}>
      <StepSignup
        destination={destination}
        onSignIn={() => router.push('/(auth)/signin')}
        onSkip={handleSkipSignup}
      />
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: COLORS.bg,
    paddingHorizontal: SPACING.lg,
  } as ViewStyle,
  step: {
    flex: 1,
    paddingHorizontal: SPACING.lg,
    paddingTop: SPACING.xxl,
  } as ViewStyle,
  title: {
    fontFamily: FONTS.header,
    fontSize: 40,
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
  destGrid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: SPACING.sm,
    marginBottom: SPACING.xl,
  } as ViewStyle,
  destCard: {
    width: '48%',
    aspectRatio: 1,
    borderRadius: RADIUS.lg,
    overflow: 'hidden',
  } as ViewStyle,
  destCardWrap: {
    flex: 1,
    position: 'relative',
    overflow: 'hidden',
  } as ViewStyle,
  destCardBg: {
    flex: 1,
    borderRadius: 0,
    overflow: 'hidden',
    justifyContent: 'flex-end',
    padding: SPACING.sm,
  } as ViewStyle,
  destCardImageStyle: {
    borderRadius: RADIUS.lg,
  } as ViewStyle,
  destCardPlain: {
    backgroundColor: COLORS.bgCard,
    borderWidth: 1,
    borderColor: COLORS.border,
  } as ViewStyle,
  destLabel: {
    fontFamily: FONTS.bodySemiBold,
    fontSize: 15,
    color: COLORS.cream,
    textShadowColor: COLORS.overlayDeeper,
    textShadowOffset: { width: 0, height: 1 },
    textShadowRadius: 4,
  } as TextStyle,
  surpriseBtn: {
    alignSelf: 'center',
    paddingVertical: SPACING.sm,
    paddingHorizontal: SPACING.lg,
  } as ViewStyle,
  surpriseBtnText: {
    fontFamily: FONTS.mono,
    fontSize: 14,
    color: COLORS.sage,
    letterSpacing: 0.5,
  } as TextStyle,
  generatingContainer: {
    paddingHorizontal: 0,
  } as ViewStyle,
  generatingStep: {
    flex: 1,
    justifyContent: 'center',
    paddingHorizontal: SPACING.lg,
    paddingTop: SPACING.xxl,
  } as ViewStyle,
  generatingIcon: {
    width: 80,
    height: 80,
    borderRadius: 40,
    borderWidth: 2,
    borderColor: COLORS.sage,
    alignSelf: 'center',
    marginBottom: SPACING.xl,
  } as ViewStyle,
  generatingRing: {
    flex: 1,
    borderRadius: 38,
    borderWidth: 1,
    borderColor: COLORS.sageMedium,
  } as ViewStyle,
  generatingTitle: {
    fontFamily: FONTS.header,
    fontSize: 28,
    color: COLORS.cream,
    textAlign: 'center',
    marginBottom: SPACING.xs,
  } as TextStyle,
  generatingSub: {
    fontFamily: FONTS.body,
    fontSize: 15,
    color: COLORS.creamMuted,
    textAlign: 'center',
    marginBottom: SPACING.xl,
  } as TextStyle,
  dots: {
    flexDirection: 'row',
    justifyContent: 'center',
    gap: SPACING.sm,
  } as ViewStyle,
  dot: {
    width: 8,
    height: 8,
    borderRadius: 4,
    backgroundColor: COLORS.sage,
  } as ViewStyle,
  errorRow: {
    padding: SPACING.lg,
    alignItems: 'center',
    gap: SPACING.sm,
  } as ViewStyle,
  errorText: {
    fontFamily: FONTS.body,
    fontSize: 14,
    color: COLORS.coral,
    textAlign: 'center',
  } as TextStyle,
  errorCta: {
    fontFamily: FONTS.bodySemiBold,
    fontSize: 14,
    color: COLORS.sage,
  } as TextStyle,
  signupTitle: {
    fontFamily: FONTS.header,
    fontSize: 32,
    color: COLORS.cream,
    textAlign: 'center',
    marginBottom: SPACING.sm,
  } as TextStyle,
  signupSub: {
    fontFamily: FONTS.body,
    fontSize: 15,
    color: COLORS.creamMuted,
    textAlign: 'center',
    marginBottom: SPACING.xxl,
  } as TextStyle,
  signupButtons: {
    gap: SPACING.md,
    marginBottom: SPACING.xl,
  } as ViewStyle,
  signupBtn: {
    height: 54,
    borderRadius: RADIUS.lg,
    alignItems: 'center',
    justifyContent: 'center',
  } as ViewStyle,
  appleBtn: {
    backgroundColor: COLORS.white,
  } as ViewStyle,
  appleBtnText: {
    fontFamily: FONTS.bodySemiBold,
    fontSize: 16,
    color: COLORS.black,
  } as TextStyle,
  googleBtn: {
    backgroundColor: COLORS.white,
  } as ViewStyle,
  googleBtnText: {
    fontFamily: FONTS.bodySemiBold,
    fontSize: 16,
    color: COLORS.black,
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
  } as TextStyle,
  skipWrap: {
    alignItems: 'center',
    marginTop: SPACING.sm,
  } as ViewStyle,
  skipText: {
    fontFamily: FONTS.body,
    fontSize: 15,
    color: COLORS.sage,
    textAlign: 'center',
  } as TextStyle,
  skipSubtext: {
    fontFamily: FONTS.mono,
    fontSize: 12,
    color: COLORS.creamMuted,
    textAlign: 'center',
    marginTop: 2,
  } as TextStyle,
  devSkip: {
    marginTop: SPACING.lg,
    alignItems: 'center',
  } as ViewStyle,
  devSkipText: {
    fontFamily: FONTS.mono,
    fontSize: 12,
    color: COLORS.sage,
  } as TextStyle,
});
