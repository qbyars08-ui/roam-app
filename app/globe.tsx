// =============================================================================
// ROAM — Spin the Globe
// Random destination picker with reveal animation → generates itinerary
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
import { LinearGradient } from 'expo-linear-gradient';
import * as Haptics from '../lib/haptics';

import { COLORS, FONTS, SPACING, RADIUS, DESTINATIONS, BUDGETS, VIBES, FREE_TRIPS_PER_MONTH } from '../lib/constants';
import { useAppStore } from '../lib/store';
import { generateItinerary, TripLimitReachedError } from '../lib/claude';
import { isGuestUser } from '../lib/guest';
import { getMockItinerary } from '../lib/mock-fallback';

// ---------------------------------------------------------------------------
// Spin pool — extended destinations for more mystery
// ---------------------------------------------------------------------------
const SPIN_POOL = [
  ...DESTINATIONS,
  { label: 'Tbilisi', emoji: '\uD83C\uDDEC\uD83C\uDDEA', country: 'GE', hook: 'Wine, chaos, mountains' },
  { label: 'Medellín', emoji: '\uD83C\uDF3A', country: 'CO', hook: 'Eternal spring, zero pretension' },
  { label: 'Porto', emoji: '\uD83C\uDF77', country: 'PT', hook: 'Port wine at sunset' },
  { label: 'Hoi An', emoji: '\uD83C\uDFEE', country: 'VN', hook: 'Lantern-lit magic on the river' },
  { label: 'Kotor', emoji: '\u26F5', country: 'ME', hook: 'Fjords without the price tag' },
  { label: 'Oaxaca', emoji: '\uD83C\uDF3D', country: 'MX', hook: 'Mezcal, mole, murals' },
  { label: 'Dubrovnik', emoji: '\uD83C\uDFF0', country: 'HR', hook: 'Ancient walls, Adriatic blue' },
  { label: 'Chiang Mai', emoji: '\uD83D\uDC18', country: 'TH', hook: 'Temples, night markets, $2 pad thai' },
  { label: 'Ljubljana', emoji: '\uD83D\uDC32', country: 'SI', hook: 'Europe\'s cutest secret capital' },
  { label: 'Zanzibar', emoji: '\uD83C\uDF34', country: 'TZ', hook: 'Spice island, turquoise water' },
];

type SpinPhase = 'idle' | 'spinning' | 'revealing' | 'generating' | 'done';

function GlobeScreen() {
  const router = useRouter();
  const insets = useSafeAreaInsets();
  const addTrip = useAppStore((s) => s.addTrip);
  const trips = useAppStore((s) => s.trips);
  const isPro = useAppStore((s) => s.isPro);
  const tripsThisMonth = useAppStore((s) => s.tripsThisMonth);

  const [phase, setPhase] = useState<SpinPhase>('idle');
  const [picked, setPicked] = useState<(typeof SPIN_POOL)[0] | null>(null);
  const [error, setError] = useState<string | null>(null);

  // Animations
  const spinAnim = useRef(new Animated.Value(0)).current;
  const scaleAnim = useRef(new Animated.Value(1)).current;
  const revealAnim = useRef(new Animated.Value(0)).current;
  const glowAnim = useRef(new Animated.Value(0)).current;

  // Slot machine text cycling
  const [slotText, setSlotText] = useState('\uD83C\uDF0D');
  const slotInterval = useRef<ReturnType<typeof setInterval> | null>(null);

  const handleSpin = useCallback(() => {
    if (phase !== 'idle') return;
    setError(null);

    Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Heavy);
    setPhase('spinning');

    // Pick random destination
    const randomIndex = Math.floor(Math.random() * SPIN_POOL.length);
    const destination = SPIN_POOL[randomIndex];
    setPicked(destination);

    // Start slot machine text cycling
    slotInterval.current = setInterval(() => {
      const idx = Math.floor(Math.random() * SPIN_POOL.length);
      setSlotText(SPIN_POOL[idx].emoji);
      Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
    }, 80);

    // Globe spin animation
    spinAnim.setValue(0);
    Animated.timing(spinAnim, {
      toValue: 1,
      duration: 2500,
      easing: Easing.out(Easing.cubic),
      useNativeDriver: true,
    }).start();

    // Scale bounce
    Animated.sequence([
      Animated.timing(scaleAnim, {
        toValue: 0.85,
        duration: 200,
        useNativeDriver: true,
      }),
      Animated.spring(scaleAnim, {
        toValue: 1,
        friction: 4,
        tension: 60,
        useNativeDriver: true,
      }),
    ]).start();

    // After spin completes → reveal
    setTimeout(() => {
      if (slotInterval.current) clearInterval(slotInterval.current);
      setSlotText(destination.emoji);
      Haptics.notificationAsync(Haptics.NotificationFeedbackType.Success);
      setPhase('revealing');

      Animated.parallel([
        Animated.timing(revealAnim, {
          toValue: 1,
          duration: 600,
          easing: Easing.out(Easing.back(1.5)),
          useNativeDriver: true,
        }),
        Animated.loop(
          Animated.sequence([
            Animated.timing(glowAnim, {
              toValue: 1,
              duration: 1200,
              useNativeDriver: true,
            }),
            Animated.timing(glowAnim, {
              toValue: 0.3,
              duration: 1200,
              useNativeDriver: true,
            }),
          ])
        ),
      ]).start();
    }, 2800);
  }, [phase, spinAnim, scaleAnim, revealAnim, glowAnim]);

  const handleGenerateTrip = useCallback(async () => {
    if (!picked) return;
    if (isGuestUser() && trips.length >= 1) {
      router.push({ pathname: '/paywall', params: { reason: 'limit', destination: picked.label } });
      return;
    }
    if (!isPro && tripsThisMonth >= FREE_TRIPS_PER_MONTH) {
      router.push({ pathname: '/paywall', params: { reason: 'limit' } });
      return;
    }
    setPhase('generating');
    Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Medium);

    try {
      // Pick random budget + vibes for the mystery trip
      const randomBudget = BUDGETS[Math.floor(Math.random() * BUDGETS.length)];
      const shuffledVibes = [...VIBES].sort(() => Math.random() - 0.5);
      const randomVibes = shuffledVibes.slice(0, 3).map((v) => v.label);

      const { itinerary } = await generateItinerary({
        destination: picked.label,
        days: 5,
        budget: randomBudget.id,
        vibes: randomVibes,
      });

      const trip = {
        id: `globe-${Date.now()}`,
        destination: picked.label,
        days: 5,
        budget: randomBudget.id,
        vibes: randomVibes,
        itinerary: JSON.stringify(itinerary),
        createdAt: new Date().toISOString(),
      };

      addTrip(trip);

      router.push({
        pathname: '/itinerary',
        params: { data: JSON.stringify(trip) },
      });

      // Reset for next spin
      setTimeout(() => {
        setPhase('idle');
        setPicked(null);
        revealAnim.setValue(0);
        glowAnim.setValue(0);
      }, 500);
    } catch (err) {
      if (err instanceof TripLimitReachedError) {
        router.push({ pathname: '/paywall', params: { reason: 'limit' } });
      } else {
        // Fallback: use mock itinerary when API unavailable
        const mockItinerary = getMockItinerary(picked.label, 5);
        const randomBudget = BUDGETS[Math.floor(Math.random() * BUDGETS.length)];
        const shuffledVibes = [...VIBES].sort(() => Math.random() - 0.5);
        const randomVibes = shuffledVibes.slice(0, 3).map((v) => v.label);
        const trip = {
          id: `globe-${Date.now()}`,
          destination: picked.label,
          days: 5,
          budget: randomBudget.id,
          vibes: randomVibes,
          itinerary: JSON.stringify(mockItinerary),
          createdAt: new Date().toISOString(),
          isMockData: true,
        };
        addTrip(trip);
        router.push({ pathname: '/itinerary', params: { data: JSON.stringify(trip) } });
        setTimeout(() => {
          setPhase('idle');
          setPicked(null);
          revealAnim.setValue(0);
          glowAnim.setValue(0);
        }, 500);
        return;
      }
      setPhase('idle');
      revealAnim.setValue(0);
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps -- trips.length intentionally excluded
  }, [picked, addTrip, router, revealAnim, glowAnim, isPro, tripsThisMonth]);

  const handleReset = useCallback(() => {
    setPhase('idle');
    setPicked(null);
    setError(null);
    revealAnim.setValue(0);
    glowAnim.setValue(0);
    setSlotText('\uD83C\uDF0D');
  }, [revealAnim, glowAnim]);

  // Cleanup interval
  useEffect(() => {
    return () => {
      if (slotInterval.current) clearInterval(slotInterval.current);
    };
  }, []);

  const spinRotation = spinAnim.interpolate({
    inputRange: [0, 1],
    outputRange: ['0deg', '1440deg'],
  });

  const revealScale = revealAnim.interpolate({
    inputRange: [0, 1],
    outputRange: [0.3, 1],
  });

  const revealOpacity = revealAnim.interpolate({
    inputRange: [0, 0.5, 1],
    outputRange: [0, 0.8, 1],
  });

  return (
    <View style={[styles.container, { paddingTop: insets.top }]}>
      <LinearGradient
        colors={[COLORS.bg, COLORS.gradientForestLight, COLORS.bg]}
        style={styles.gradient}
      >
        {/* Header */}
        <View style={styles.header}>
          <Text style={styles.title}>Spin the Globe</Text>
          <Text style={styles.subtitle}>
            One tap. One destination. Zero planning.
          </Text>
        </View>

        {/* Globe area */}
        <View style={styles.globeArea}>
          <Animated.View
            style={[
              styles.globeContainer,
              {
                transform: [
                  { scale: scaleAnim },
                  { rotate: phase === 'spinning' ? spinRotation : '0deg' },
                ],
              },
            ]}
          >
            <Animated.View
              style={[
                styles.globeGlow,
                { opacity: phase === 'revealing' ? glowAnim : 0 },
              ]}
            />
            <View style={styles.globe}>
              <Text style={styles.globeEmoji}>{slotText}</Text>
            </View>
          </Animated.View>

          {/* Reveal card */}
          {(phase === 'revealing' || phase === 'generating') && picked && (
            <Animated.View
              style={[
                styles.revealCard,
                {
                  opacity: revealOpacity,
                  transform: [{ scale: revealScale }],
                },
              ]}
            >
              <Text style={styles.revealLabel}>YOUR NEXT ADVENTURE</Text>
              <Text style={styles.revealDestination}>{picked.label}</Text>
              <Text style={styles.revealCountry}>
                {picked.country}
              </Text>
              <Text style={styles.revealHook}>{picked.hook}</Text>
            </Animated.View>
          )}
        </View>

        {/* Action buttons */}
        <View style={styles.actions}>
          {phase === 'idle' && (
            <Pressable
              onPress={handleSpin}
              style={({ pressed }) => [
                styles.spinButton,
                { transform: [{ scale: pressed ? 0.95 : 1 }] },
              ]}
            >
              <LinearGradient
                colors={[COLORS.sage, COLORS.sageDark]}
                style={styles.spinGradient}
              >
                <Text style={styles.spinButtonText}>
                  {'\uD83C\uDF0D'} Spin the Globe
                </Text>
              </LinearGradient>
            </Pressable>
          )}

          {phase === 'spinning' && (
            <Text style={styles.spinningText}>Finding your destiny...</Text>
          )}

          {phase === 'revealing' && (
            <View style={styles.revealActions}>
              <Pressable
                onPress={handleGenerateTrip}
                style={({ pressed }) => [
                  styles.goButton,
                  { transform: [{ scale: pressed ? 0.95 : 1 }] },
                ]}
              >
                <LinearGradient
                  colors={[COLORS.sage, COLORS.sageDark]}
                  style={styles.spinGradient}
                >
                  <Text style={styles.spinButtonText}>
                    {'\u2728'} Build this trip
                  </Text>
                </LinearGradient>
              </Pressable>
              <Pressable onPress={handleReset} style={styles.respin}>
                <Text style={styles.respinText}>Spin again</Text>
              </Pressable>
            </View>
          )}

          {phase === 'generating' && (
            <View style={styles.generatingContainer}>
              <Text style={styles.generatingText}>
                Building your {picked?.label} adventure...
              </Text>
              <Text style={styles.generatingSubtext}>
                AI is crafting your trip
              </Text>
            </View>
          )}

          {error && <Text style={styles.errorText}>{error}</Text>}
        </View>

        {/* Bottom hint */}
        <Text style={styles.hint}>
          Every spin is a surprise. No takebacks.
        </Text>
      </LinearGradient>
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
  } as ViewStyle,
  gradient: {
    flex: 1,
  } as ViewStyle,
  header: {
    paddingHorizontal: SPACING.lg,
    paddingTop: SPACING.xl,
    alignItems: 'center',
  } as ViewStyle,
  title: {
    fontFamily: FONTS.header,
    fontSize: 34,
    color: COLORS.cream,
    letterSpacing: 1,
    marginBottom: SPACING.xs,
  } as TextStyle,
  subtitle: {
    fontFamily: FONTS.body,
    fontSize: 15,
    color: COLORS.creamMuted,
    textAlign: 'center',
  } as TextStyle,

  globeArea: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
  } as ViewStyle,
  globeContainer: {
    alignItems: 'center',
    justifyContent: 'center',
  } as ViewStyle,
  globeGlow: {
    position: 'absolute',
    width: 200,
    height: 200,
    borderRadius: 100,
    backgroundColor: COLORS.sage,
    opacity: 0.15,
  } as ViewStyle,
  globe: {
    width: 160,
    height: 160,
    borderRadius: 80,
    backgroundColor: COLORS.bgCard,
    borderWidth: 2,
    borderColor: COLORS.sage,
    alignItems: 'center',
    justifyContent: 'center',
  } as ViewStyle,
  globeEmoji: {
    fontSize: 72,
  } as TextStyle,

  revealCard: {
    marginTop: SPACING.xl,
    alignItems: 'center',
    gap: SPACING.xs,
  } as ViewStyle,
  revealLabel: {
    fontFamily: FONTS.mono,
    fontSize: 11,
    color: COLORS.sage,
    letterSpacing: 2,
    textTransform: 'uppercase',
  } as TextStyle,
  revealDestination: {
    fontFamily: FONTS.header,
    fontSize: 42,
    color: COLORS.cream,
    letterSpacing: 1,
  } as TextStyle,
  revealCountry: {
    fontFamily: FONTS.mono,
    fontSize: 14,
    color: COLORS.sage,
  } as TextStyle,
  revealHook: {
    fontFamily: FONTS.body,
    fontSize: 16,
    color: COLORS.creamMuted,
    fontStyle: 'italic',
    marginTop: SPACING.xs,
  } as TextStyle,

  actions: {
    paddingHorizontal: SPACING.xl,
    paddingBottom: SPACING.xl,
    alignItems: 'center',
  } as ViewStyle,
  spinButton: {
    width: '100%',
    borderRadius: RADIUS.lg,
    overflow: 'hidden',
  } as ViewStyle,
  goButton: {
    width: '100%',
    borderRadius: RADIUS.lg,
    overflow: 'hidden',
  } as ViewStyle,
  spinGradient: {
    paddingVertical: SPACING.md + 2,
    alignItems: 'center',
    justifyContent: 'center',
    borderRadius: RADIUS.lg,
  } as ViewStyle,
  spinButtonText: {
    fontFamily: FONTS.bodySemiBold,
    fontSize: 18,
    color: COLORS.bg,
    letterSpacing: 0.5,
  } as TextStyle,
  spinningText: {
    fontFamily: FONTS.bodyMedium,
    fontSize: 16,
    color: COLORS.sage,
  } as TextStyle,
  revealActions: {
    width: '100%',
    gap: SPACING.md,
    alignItems: 'center',
  } as ViewStyle,
  respin: {
    paddingVertical: SPACING.sm,
  } as ViewStyle,
  respinText: {
    fontFamily: FONTS.bodyMedium,
    fontSize: 14,
    color: COLORS.creamMuted,
    textDecorationLine: 'underline',
  } as TextStyle,
  generatingContainer: {
    alignItems: 'center',
    gap: SPACING.xs,
  } as ViewStyle,
  generatingText: {
    fontFamily: FONTS.bodyMedium,
    fontSize: 16,
    color: COLORS.cream,
  } as TextStyle,
  generatingSubtext: {
    fontFamily: FONTS.mono,
    fontSize: 12,
    color: COLORS.sage,
  } as TextStyle,
  errorText: {
    fontFamily: FONTS.body,
    fontSize: 14,
    color: COLORS.coral,
    marginTop: SPACING.sm,
  } as TextStyle,
  hint: {
    fontFamily: FONTS.mono,
    fontSize: 11,
    color: COLORS.creamFaint,
    textAlign: 'center',
    paddingBottom: SPACING.lg,
    letterSpacing: 0.5,
  } as TextStyle,
});

export default GlobeScreen;
