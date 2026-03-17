// =============================================================================
// ROAM — Tab Navigator Layout
// 5 tabs: Plan / Pulse / Flights / People / Prep (floating pill nav)
// =============================================================================
import React from 'react';
import { View } from 'react-native';
import { Tabs } from 'expo-router';
import { COLORS } from '../../lib/constants';
import FloatingPillNav from '../../components/ui/FloatingPillNav';
import LiveCompanionFAB from '../../components/features/LiveCompanionFAB';

// ---------------------------------------------------------------------------
// Tabs Layout
// ---------------------------------------------------------------------------
export default function TabsLayout() {
  return (
    <View style={{ flex: 1, backgroundColor: COLORS.bg }}>
      <Tabs
        tabBar={(props) => <FloatingPillNav {...props} />}
        screenOptions={{
          headerShown: false,
          tabBarHideOnKeyboard: true,
          animation: 'shift',
          tabBarStyle: { display: 'none' },
          lazy: true,
        }}
      >
        {/* ── Visible tabs (5) ── */}
        <Tabs.Screen name="plan" options={{ title: 'Plan', lazy: false }} />
        <Tabs.Screen name="pulse" options={{ title: 'Pulse', lazy: true }} />
        <Tabs.Screen name="flights" options={{ title: 'Flights', lazy: true }} />
        <Tabs.Screen name="people" options={{ title: 'People', lazy: true }} />
        <Tabs.Screen name="prep" options={{ title: 'Prep', lazy: false }} />
        {/* ── Hidden (still routable, not in nav pill) ── */}
        <Tabs.Screen name="pets" options={{ href: null }} />
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
