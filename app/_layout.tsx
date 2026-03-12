// =============================================================================
// ROAM — Root Layout
// Font loading, auth routing, session bootstrap, StatusBar
// =============================================================================
import React, { useEffect, useRef, useState } from 'react';
import { AppState, Linking } from 'react-native';
import { Stack, useRouter, useSegments } from 'expo-router';
import { StatusBar } from 'expo-status-bar';
import { GestureHandlerRootView } from 'react-native-gesture-handler';
import AsyncStorage from '@react-native-async-storage/async-storage';
import {
  useFonts,
  CormorantGaramond_700Bold,
  CormorantGaramond_600SemiBold,
} from '@expo-google-fonts/cormorant-garamond';
import { DMSans_400Regular, DMSans_500Medium, DMSans_700Bold } from '@expo-google-fonts/dm-sans';
import { DMMono_400Regular, DMMono_500Medium } from '@expo-google-fonts/dm-mono';

import { supabase } from '../lib/supabase';
import { useAppStore, checkActiveTripOnLoad, loadPersistedTrips, loadPersistedPets, loadPersistedTravelProfile } from '../lib/store';
import { initRevenueCat, checkProStatus } from '../lib/revenuecat';
import { ensureReferralCode } from '../lib/referral';
import { requestNotificationPermission, scheduleDailyDiscovery } from '../lib/notifications';
import { recordAppOpen, cancelReengagementNotifications, scheduleReengagementNotifications } from '../lib/reengagement';
import { COLORS } from '../lib/constants';
import { getSharedTrip } from '../lib/sharing';
import { trackOnboardingComplete } from '../lib/ab-test';
import { checkStorageVersion } from '../lib/storage-version';
import Spinner from '../components/ui/Spinner';
import ErrorBoundary from '../components/ui/ErrorBoundary';
import OfflineBanner from '../components/ui/OfflineBanner';
import PhoneFrame from '../components/ui/PhoneFrame';

// ---------------------------------------------------------------------------
// Auth guard — redirects based on session state
// Skips redirect when on join-group (deferred signup: allow preview before auth)
// ---------------------------------------------------------------------------
function useProtectedRoute(session: { user: { id: string } } | null) {
  const segments = useSegments();
  const router = useRouter();
  const hasCheckedOnboarding = useRef(false);

  useEffect(() => {
    const inAuthGroup = segments[0] === '(auth)';
    const onJoinGroup = segments[0] === 'join-group';

    // Deferred signup: unauthenticated users can view join-group preview
    if (onJoinGroup) return;

    if (!session && !inAuthGroup) {
      // No session → check if onboarding is complete
      if (!hasCheckedOnboarding.current) {
        hasCheckedOnboarding.current = true;
        AsyncStorage.getItem('@roam/onboarding_complete').then((val) => {
          if (val === 'true') {
            // Returning user who completed onboarding but signed out
            router.replace('/(auth)/signup');
          } else {
            // First-time user → splash → hook → onboard (Duolingo-style)
            router.replace('/(auth)/splash');
          }
        });
      } else {
        router.replace('/(auth)/signup');
      }
    } else if (session && inAuthGroup) {
      // Has session but in auth screens → go to tabs
      router.replace('/(tabs)');
    }
  }, [session, segments]);
}

// ---------------------------------------------------------------------------
// Root Layout
// ---------------------------------------------------------------------------
export default function RootLayout() {
  const [isReady, setIsReady] = useState(false);
  const router = useRouter();
  const session = useAppStore((s) => s.session);
  const setSession = useAppStore((s) => s.setSession);
  const setIsPro = useAppStore((s) => s.setIsPro);
  const setTripsThisMonth = useAppStore((s) => s.setTripsThisMonth);

  // Load fonts
  const [fontsLoaded] = useFonts({
    CormorantGaramond_700Bold,
    CormorantGaramond_600SemiBold,
    DMSans_400Regular,
    DMSans_500Medium,
    DMSans_700Bold,
    DMMono_400Regular,
    DMMono_500Medium,
  });

  // Bootstrap auth session + restore persisted data
  useEffect(() => {
    checkStorageVersion().catch(() => {});
    // Restore persisted data (trips, pets, travel profile, currency) before session check
    Promise.all([
      loadPersistedTrips(),
      loadPersistedPets(),
      loadPersistedTravelProfile(),
      useAppStore.getState().initCurrency(),
    ]).catch(() => {});

    // Get initial session (handle errors gracefully for dev/preview)
    supabase.auth
      .getSession()
      .then(({ data: { session: initialSession } }) => {
        setSession(initialSession);
      })
      .catch(() => {
        // Supabase credentials missing / invalid — no session
        setSession(null);
      })
      .finally(() => {
        setIsReady(true);
      });

    // Listen for auth state changes
    let subscription: { unsubscribe: () => void } | undefined;
    try {
      const result = supabase.auth.onAuthStateChange((_event, newSession) => {
        setSession(newSession);
        if (newSession) {
          AsyncStorage.setItem('@roam/onboarding_complete', 'true').catch(() => {});
          trackOnboardingComplete(newSession.user.id).catch(() => {});
        }
      });
      subscription = result.data.subscription;
    } catch {}

    return () => {
      subscription?.unsubscribe();
    };
  }, []);

  // Once session is loaded with a user, bootstrap RevenueCat + profile data
  useEffect(() => {
    if (!session?.user) return;

    const bootstrap = async () => {
      // Initialize RevenueCat with user ID
      await initRevenueCat(session.user.id);

      // Check pro subscription status (RevenueCat + referral-earned Pro)
      const proFromPurchases = await checkProStatus();
      const { data: profile } = await supabase
        .from('profiles')
        .select('trips_generated_this_month, pro_referral_expires_at')
        .eq('id', session.user.id)
        .single();

      const proFromReferrals =
        profile?.pro_referral_expires_at &&
        new Date(profile.pro_referral_expires_at) > new Date();
      setIsPro(proFromPurchases || !!proFromReferrals);

      if (profile) {
        setTripsThisMonth(profile.trips_generated_this_month ?? 0);
      }

      // Ensure referral code exists for this user
      ensureReferralCode(session.user.id).catch(() => {});

      // Request notification permission + schedule daily discovery (non-blocking)
      try {
        await requestNotificationPermission();
        await scheduleDailyDiscovery();
      } catch {}

      // Check for active trip (Live Trip Mode)
      checkActiveTripOnLoad();

      // Re-engagement: record open, cancel any scheduled reengagement
      recordAppOpen();
      cancelReengagementNotifications();
    };

    bootstrap();
  }, [session?.user?.id]);

  // Re-engagement: when app goes to background, schedule Day 1/3/7/14 notifications
  useEffect(() => {
    const sub = AppState.addEventListener('change', (state) => {
      if (state === 'background') {
        recordAppOpen().then(() => scheduleReengagementNotifications()).catch(() => {});
      } else if (state === 'active') {
        recordAppOpen();
        cancelReengagementNotifications();
      }
    });
    return () => sub.remove();
  }, []);

  // Deep link handler — roam://trip/<uuid> and roam://join/<code>
  useEffect(() => {
    const handleDeepLink = async (url: string) => {
      // Group trip invite: roam://join/<inviteCode> or roamtravel.app/join/<code>
      const joinMatch = url.match(/join\/([a-zA-Z0-9]+)/i);
      if (joinMatch) {
        const inviteCode = joinMatch[1];
        router.push({ pathname: '/join-group', params: { code: inviteCode } });
        return;
      }

      // Chaos dare: roam://chaos-dare/<uuid> or /chaos-dare/<uuid>
      const dareMatch = url.match(/chaos-dare\/([0-9a-f-]+)/i);
      if (dareMatch) {
        router.push({ pathname: '/chaos-dare', params: { id: dareMatch[1] } });
        return;
      }

      // Shared trip: roam://trip/<uuid>
      const match = url.match(/trip\/([0-9a-f-]+)/i);
      if (!match) return;

      const shareId = match[1];
      const shared = await getSharedTrip(shareId);
      if (!shared) return;

      const tripData = JSON.stringify({
        id: `shared-${shared.id}`,
        destination: shared.destination,
        days: shared.days,
        budget: shared.budget,
        vibes: shared.vibes,
        itinerary: shared.itinerary,
        createdAt: shared.created_at,
      });

      router.push({ pathname: '/itinerary', params: { data: tripData } });
    };

    // Handle app opened via deep link
    Linking.getInitialURL().then((url) => {
      if (url) handleDeepLink(url);
    });

    // Handle deep link while app is running
    const sub = Linking.addEventListener('url', ({ url }) => {
      handleDeepLink(url);
    });

    return () => sub.remove();
  }, [router]);

  // Auth guard
  useProtectedRoute(session);

  // Show spinner while loading fonts or initial session
  if (!fontsLoaded || !isReady) {
    return (
      <>
        <Spinner fullScreen />
        <StatusBar style="light" />
      </>
    );
  }

  return (
    <ErrorBoundary>
      <GestureHandlerRootView style={{ flex: 1 }}>
        <PhoneFrame>
          <OfflineBanner />
          <Stack
          screenOptions={{
            headerShown: false,
            contentStyle: { backgroundColor: COLORS.bg },
            animation: 'fade',
          }}
        >
          <Stack.Screen name="(auth)" />
          <Stack.Screen name="(tabs)" />
          <Stack.Screen
            name="join-group"
            options={{
              presentation: 'card',
              animation: 'fade',
            }}
          />
          <Stack.Screen name="+not-found" />
          <Stack.Screen
            name="itinerary"
            options={{
              presentation: 'modal',
              animation: 'slide_from_bottom',
            }}
          />
          <Stack.Screen
            name="paywall"
            options={{
              presentation: 'modal',
              animation: 'slide_from_bottom',
            }}
          />
          <Stack.Screen
            name="alter-ego"
            options={{
              presentation: 'modal',
              animation: 'slide_from_bottom',
            }}
          />
          <Stack.Screen
            name="trip-dupe"
            options={{
              presentation: 'modal',
              animation: 'slide_from_bottom',
            }}
          />
          <Stack.Screen
            name="referral"
            options={{
              presentation: 'modal',
              animation: 'slide_from_bottom',
            }}
          />
          <Stack.Screen
            name="hype"
            options={{
              presentation: 'modal',
              animation: 'slide_from_bottom',
            }}
          />
          <Stack.Screen
            name="share-card"
            options={{
              presentation: 'card',
              animation: 'fade',
            }}
          />
          <Stack.Screen
            name="admin"
            options={{
              presentation: 'card',
              animation: 'fade',
            }}
          />
          <Stack.Screen
            name="prep-detail"
            options={{
              presentation: 'modal',
              animation: 'slide_from_bottom',
            }}
          />
          <Stack.Screen
            name="travel-twin"
            options={{
              presentation: 'modal',
              animation: 'slide_from_bottom',
            }}
          />
          <Stack.Screen
            name="local-lens"
            options={{
              presentation: 'modal',
              animation: 'slide_from_bottom',
            }}
          />
          <Stack.Screen
            name="trip-chemistry"
            options={{
              presentation: 'modal',
              animation: 'slide_from_bottom',
            }}
          />
          <Stack.Screen
            name="memory-lane"
            options={{
              presentation: 'modal',
              animation: 'slide_from_bottom',
            }}
          />
          <Stack.Screen
            name="budget-guardian"
            options={{
              presentation: 'modal',
              animation: 'slide_from_bottom',
            }}
          />
          <Stack.Screen
            name="arrival-mode"
            options={{
              presentation: 'modal',
              animation: 'slide_from_bottom',
            }}
          />
          <Stack.Screen
            name="honest-reviews"
            options={{
              presentation: 'modal',
              animation: 'slide_from_bottom',
            }}
          />
          <Stack.Screen
            name="visited-map"
            options={{
              presentation: 'modal',
              animation: 'slide_from_bottom',
            }}
          />
          <Stack.Screen
            name="viral-cards"
            options={{
              presentation: 'modal',
              animation: 'slide_from_bottom',
            }}
          />
          <Stack.Screen
            name="layover"
            options={{
              presentation: 'modal',
              animation: 'slide_from_bottom',
            }}
          />
          <Stack.Screen
            name="airport-guide"
            options={{
              presentation: 'modal',
              animation: 'slide_from_bottom',
            }}
          />
          <Stack.Screen
            name="trip-trading"
            options={{
              presentation: 'card',
              animation: 'slide_from_right',
            }}
          />
          <Stack.Screen
            name="roam-for-dates"
            options={{
              presentation: 'card',
              animation: 'slide_from_right',
            }}
          />
          <Stack.Screen
            name="language-survival"
            options={{
              presentation: 'modal',
              animation: 'slide_from_bottom',
            }}
          />
          <Stack.Screen
            name="travel-time-machine"
            options={{
              presentation: 'modal',
              animation: 'slide_from_bottom',
            }}
          />
          <Stack.Screen
            name="anti-itinerary"
            options={{
              presentation: 'modal',
              animation: 'slide_from_bottom',
            }}
          />
          <Stack.Screen
            name="trip/[id]"
            options={{
              presentation: 'card',
              animation: 'fade',
            }}
          />
          <Stack.Screen
            name="trip-collections"
            options={{
              presentation: 'modal',
              animation: 'slide_from_bottom',
            }}
          />
        </Stack>
        </PhoneFrame>
        <StatusBar style="light" />
      </GestureHandlerRootView>
    </ErrorBoundary>
  );
}
