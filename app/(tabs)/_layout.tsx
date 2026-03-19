// =============================================================================
// ROAM — Tab Navigator Layout
// Web: sidebar navigation + fade transition. Native: floating pill nav.
// =============================================================================
import React, { useEffect, useRef, useState } from 'react';
import { Animated, Platform, View } from 'react-native';
import { Tabs, usePathname } from 'expo-router';
import { COLORS } from '../../lib/constants';
import FloatingPillNav from '../../components/ui/FloatingPillNav';
import LiveCompanionFAB from '../../components/features/LiveCompanionFAB';
import Sidebar from '../../components/web/Sidebar';

const isWeb = Platform.OS === 'web';

// ---------------------------------------------------------------------------
// Web fade wrapper — 150ms opacity transition on tab change
// ---------------------------------------------------------------------------
function WebFadeWrapper({ children }: { children: React.ReactNode }) {
  const pathname = usePathname();
  const opacity = useRef(new Animated.Value(1)).current;
  const prevPathname = useRef(pathname);

  useEffect(() => {
    if (prevPathname.current !== pathname) {
      prevPathname.current = pathname;
      opacity.setValue(0);
      Animated.timing(opacity, {
        toValue: 1,
        duration: 150,
        useNativeDriver: true,
      }).start();
    }
  }, [pathname, opacity]);

  return (
    <Animated.View style={{ flex: 1, opacity }}>
      {children}
    </Animated.View>
  );
}

// ---------------------------------------------------------------------------
// Tabs Layout — sidebar on web, floating pill on native
// ---------------------------------------------------------------------------
export default function TabsLayout() {
  const tabContent = (
    <Tabs
      tabBar={(props) => (isWeb ? null : <FloatingPillNav {...props} />)}
      screenOptions={{
        headerShown: false,
        tabBarHideOnKeyboard: true,
        tabBarStyle: { display: 'none' },
        lazy: true,
      }}
    >
      {/* ── Visible tabs (5) ── */}
      <Tabs.Screen name="plan" options={{ title: 'Plan' }} />
      <Tabs.Screen name="pulse" options={{ title: 'Pulse' }} />
      <Tabs.Screen name="flights" options={{ title: 'Flights' }} />
      <Tabs.Screen name="people" options={{ title: 'People' }} />
      <Tabs.Screen name="prep" options={{ title: 'Prep' }} />
      {/* ── Hidden (still routable, not in nav pill) ── */}
      <Tabs.Screen name="pets" options={{ href: null }} />
      <Tabs.Screen name="index" options={{ href: null }} />
      <Tabs.Screen name="body-intel" options={{ href: null }} />
      <Tabs.Screen name="generate" options={{ href: null }} />
      <Tabs.Screen name="stays" options={{ href: null }} />
      <Tabs.Screen name="food" options={{ href: null }} />
      <Tabs.Screen name="group" options={{ href: null }} />
    </Tabs>
  );

  if (isWeb) {
    return (
      <View style={{ flex: 1, flexDirection: 'row', backgroundColor: COLORS.bg }}>
        <Sidebar />
        <View style={{ flex: 1, maxWidth: 1200 }}>
          <WebFadeWrapper>
            {tabContent}
          </WebFadeWrapper>
        </View>
      </View>
    );
  }

  return (
    <View style={{ flex: 1, backgroundColor: COLORS.bg }}>
      {tabContent}
      <LiveCompanionFAB />
    </View>
  );
}
