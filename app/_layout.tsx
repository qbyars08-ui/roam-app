// =============================================================================
// ROAM — Root Layout
// Font loading, auth routing, session bootstrap, StatusBar
// =============================================================================
import React, { useEffect, useRef, useState } from 'react';
import { AppState, Linking } from 'react-native';
import { Stack, useRouter, useSegments } from 'expo-router';
import { StatusBar } from 'expo-status-bar';
import { hideAsync as hideSplashScreen } from '../lib/splash-screen';
import { GestureHandlerRootView } from 'react-native-gesture-handler';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { ONBOARDING_COMPLETE } from '../lib/storage-keys';
// Self-hosted fonts — only the 7 weights we actually use (1.5MB vs 6.5MB)
import { useFonts } from 'expo-font';

// i18n — must be imported before any component that uses useTranslation
import '../lib/i18n';

import { supabase } from '../lib/supabase';
import { useAppStore, checkActiveTripOnLoad, loadPersistedTrips, loadPersistedPets, loadPersistedTravelProfile, loadPersistedBookmarks, loadGenerateMode } from '../lib/store';
import { initRevenueCat, loginRevenueCat, logoutRevenueCat, isProActive, addCustomerInfoListener } from '../lib/revenue-cat';
import { syncProStatusToSupabase } from '../lib/sync-pro-status';
import { ensureReferralCode } from '../lib/referral';
import { requestNotificationPermission, scheduleDailyDiscovery, registerPushToken } from '../lib/notifications';
import { recordAppOpen, cancelReengagementNotifications, scheduleReengagementNotifications } from '../lib/reengagement';
import { COLORS } from '../lib/constants';
import { getSharedTrip } from '../lib/sharing';
import { trackOnboardingComplete } from '../lib/ab-test';
import { captureRefOnLoad } from '../lib/waitlist-guest';
import { tryRestoreGuestSession, clearGuestMode, isGuestSession } from '../lib/guest';
import { checkStorageVersion } from '../lib/storage-version';
import { checkMilestones, recordGrowthEvent } from '../lib/growth-hooks';
import { resetSessionTracking } from '../lib/smart-triggers';
import type { Milestone } from '../lib/growth-hooks';
import { track } from '../lib/analytics';
import ErrorBoundary from '../components/ui/ErrorBoundary';
import OfflineBanner from '../components/ui/OfflineBanner';
import PhoneFrame from '../components/ui/PhoneFrame';
import MilestoneModal from '../components/features/MilestoneModal';

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
    const onJoinGroup = segments[0] === 'join-group' || segments[0] === 'join';

    // Deferred signup: unauthenticated users can view join-group preview
    if (onJoinGroup) return;

    if (!session && !inAuthGroup) {
      // No session → check if onboarding is complete
      if (!hasCheckedOnboarding.current) {
        hasCheckedOnboarding.current = true;
        AsyncStorage.getItem(ONBOARDING_COMPLETE).then((val) => {
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
    // eslint-disable-next-line react-hooks/exhaustive-deps -- router intentional mount-only
  }, [session, segments]);
}

// ---------------------------------------------------------------------------
// Root Layout
// ---------------------------------------------------------------------------
export default function RootLayout() {
  const [isReady, setIsReady] = useState(false);
  const [activeMilestone, setActiveMilestone] = useState<Milestone | null>(null);
  const router = useRouter();
  const session = useAppStore((s) => s.session);
  const setSession = useAppStore((s) => s.setSession);
  const setTripsThisMonth = useAppStore((s) => s.setTripsThisMonth);

  // Load fonts
  const [fontsLoaded] = useFonts({
    CormorantGaramond_700Bold: require('../assets/fonts/CormorantGaramond_700Bold.ttf'),
    CormorantGaramond_600SemiBold: require('../assets/fonts/CormorantGaramond_600SemiBold.ttf'),
    DMSans_400Regular: require('../assets/fonts/DMSans_400Regular.ttf'),
    DMSans_500Medium: require('../assets/fonts/DMSans_500Medium.ttf'),
    DMSans_700Bold: require('../assets/fonts/DMSans_700Bold.ttf'),
    DMMono_400Regular: require('../assets/fonts/DMMono_400Regular.ttf'),
    DMMono_500Medium: require('../assets/fonts/DMMono_500Medium.ttf'),
  });

  // Bootstrap auth session + restore persisted data
  useEffect(() => {
    // Initialize RevenueCat on app start (anonymous); links to user when session loads
    initRevenueCat().catch(() => {});
    checkStorageVersion().catch(() => {});
    captureRefOnLoad().catch(() => {}); // Web: track ?ref= for referral attribution
    // Restore persisted data (trips, pets, travel profile, currency) before session check
    Promise.all([
      loadPersistedTrips(),
      loadPersistedPets(),
      loadPersistedTravelProfile(),
      loadPersistedBookmarks(),
      loadGenerateMode(),
      useAppStore.getState().initCurrency(),
    ]).catch(() => {});

    // Get initial session (handle errors gracefully for dev/preview)
    // Don't overwrite guest sessions — they're set by Browse first / Continue as guest
    supabase.auth
      .getSession()
      .then(async ({ data: { session: initialSession } }) => {
        const current = useAppStore.getState().session;
        if (current?.user?.id?.startsWith?.('guest-')) return;
        if (initialSession && !isGuestSession(initialSession)) {
          setSession(initialSession);
          clearGuestMode().catch(() => {});
          return;
        }
        // No real session — try restore persisted guest (survives page refresh)
        const restored = await tryRestoreGuestSession();
        if (!restored) setSession(initialSession);
      })
      .catch(async () => {
        const current = useAppStore.getState().session;
        if (current?.user?.id?.startsWith?.('guest-')) return;
        const restored = await tryRestoreGuestSession();
        if (!restored) setSession(null);
      })
      .finally(() => {
        setIsReady(true);
        track({ type: 'session_start' }).catch(() => {});
      });

    // Listen for auth state changes (don't overwrite guest sessions)
    let subscription: { unsubscribe: () => void } | undefined;
    try {
      const result = supabase.auth.onAuthStateChange((_event, newSession) => {
        if (newSession && !isGuestSession(newSession)) {
          clearGuestMode().catch(() => {});
          setSession(newSession);
          AsyncStorage.setItem(ONBOARDING_COMPLETE, 'true').catch(() => {});
          trackOnboardingComplete(newSession.user.id).catch(() => {});
        } else if (!newSession) {
          const current = useAppStore.getState().session;
          if (current?.user?.id?.startsWith?.('guest-')) return;
          logoutRevenueCat().catch(() => {});
          setSession(null);
        }
      });
      subscription = result.data.subscription;
    } catch { /* silent */ }

    return () => {
      subscription?.unsubscribe();
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps -- setSession stable setter
  }, []);

  // Once session is loaded with a user, bootstrap RevenueCat + profile data
  useEffect(() => {
    if (!session?.user) return;

    const isGuest = String(session.user.id).startsWith('guest-');

    const bootstrap = async () => {
      if (isGuest) {
        setTripsThisMonth(0);
        checkActiveTripOnLoad();
        return;
      }

      await initRevenueCat(session.user.id);
      await loginRevenueCat(session.user.id);
      const proFromPurchases = await isProActive();
      const { data: profile } = await supabase
        .from('profiles')
        .select('trips_generated_this_month, pro_referral_expires_at')
        .eq('id', session.user.id)
        .single();

      await syncProStatusToSupabase(session.user.id, proFromPurchases);

      if (profile) {
        setTripsThisMonth(profile.trips_generated_this_month ?? 0);
      }

      ensureReferralCode(session.user.id).catch(() => {});

      try {
        await requestNotificationPermission();
        await scheduleDailyDiscovery();
        await registerPushToken(session.user.id);
      } catch { /* silent */ }

      checkActiveTripOnLoad();
      recordAppOpen();
      cancelReengagementNotifications();
      resetSessionTracking();
      recordGrowthEvent('session_start').catch(() => {});

      // Check milestones after a short delay so UI is settled
      setTimeout(() => {
        checkMilestones().then((m) => {
          if (m) setActiveMilestone(m);
        }).catch(() => {});
      }, 2000);

      return addCustomerInfoListener((proFromPurchases) => {
        syncProStatusToSupabase(session.user.id, proFromPurchases);
      });
    };

    let unsub: (() => void) | undefined;
    bootstrap().then((fn) => { unsub = fn; });
    return () => { unsub?.(); };
    // eslint-disable-next-line react-hooks/exhaustive-deps -- session.user, setTripsThisMonth intentionally excluded
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

  // Hide splash and show app once fonts + session are ready (native only — web uses lib/splash-screen.web.ts no-op)
  useEffect(() => {
    if (fontsLoaded && isReady) {
      hideSplashScreen().catch(() => {});
    }
  }, [fontsLoaded, isReady]);

  // Show minimal loading state (native splash stays visible) until ready
  if (!fontsLoaded || !isReady) {
    return (
      <>
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
          <Stack.Screen
            name="group-trip"
            options={{
              presentation: 'card',
              animation: 'slide_from_right',
            }}
          />
          <Stack.Screen
            name="create-group"
            options={{
              presentation: 'modal',
              animation: 'slide_from_bottom',
            }}
          />
          <Stack.Screen name="+not-found" />
          <Stack.Screen
            name="privacy"
            options={{ presentation: 'card', animation: 'slide_from_right' }}
          />
          <Stack.Screen
            name="terms"
            options={{ presentation: 'card', animation: 'slide_from_right' }}
          />
          <Stack.Screen
            name="support"
            options={{ presentation: 'card', animation: 'slide_from_right' }}
          />
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
        <MilestoneModal
          milestone={activeMilestone}
          onDismiss={() => setActiveMilestone(null)}
        />
        <StatusBar style="light" />
      </GestureHandlerRootView>
    </ErrorBoundary>
  );
}
