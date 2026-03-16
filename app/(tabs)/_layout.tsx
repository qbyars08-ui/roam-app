// =============================================================================
// ROAM — Tab Navigator Layout
// 6 tabs: Plan / Pulse / People / Flights / Pets / Prep
// =============================================================================
import React from 'react';
import { View } from 'react-native';
import { Tabs } from 'expo-router';
import { COLORS } from '../../lib/constants';
import ROAMTabBar from '../../components/ui/ROAMTabBar';
import LiveCompanionFAB from '../../components/features/LiveCompanionFAB';

// ---------------------------------------------------------------------------
// Tabs Layout
// ---------------------------------------------------------------------------
export default function TabsLayout() {
  return (
    <View style={{ flex: 1, backgroundColor: COLORS.bg }}>
      <Tabs
        tabBar={(props) => <ROAMTabBar {...props} />}
        screenOptions={{
          headerShown: false,
          tabBarHideOnKeyboard: true,
          animation: 'shift',
          tabBarStyle: { display: 'none' },
          lazy: true,
        }}
      >
        {/* ── Visible tabs (5) ── */}
        {/* plan + prep are eager-loaded: they contain the core user flows */}
        <Tabs.Screen name="plan" options={{ title: 'Plan', lazy: false }} />
        {/* pulse, people, flights are lazy: data-heavy, deferred until first visit */}
        <Tabs.Screen name="pulse" options={{ title: 'Pulse', lazy: true }} />
        <Tabs.Screen name="people" options={{ title: 'People', lazy: true }} />
        <Tabs.Screen name="flights" options={{ title: 'Flights', lazy: true }} />
        <Tabs.Screen name="pets" options={{ title: 'Pets', lazy: true }} />
        <Tabs.Screen name="prep" options={{ title: 'Prep', lazy: false }} />
        {/* ── Hidden screens (still routable, not in tab bar) ── */}
        <Tabs.Screen name="index" options={{ href: null }} />
        <Tabs.Screen name="body-intel" options={{ href: null }} />
        <Tabs.Screen name="generate" options={{ href: null }} />
        <Tabs.Screen name="stays" options={{ href: null }} />
        <Tabs.Screen name="food" options={{ href: null }} />
        <Tabs.Screen name="group" options={{ href: null }} />
      </Tabs>
      <LiveCompanionFAB />
    </View>
  );
}
