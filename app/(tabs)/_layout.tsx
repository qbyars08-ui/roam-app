// =============================================================================
// ROAM — Tab Navigator Layout
// 5 tabs: Plan / Pulse / People / Flights / Prep
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
        <Tabs.Screen name="plan" options={{ title: 'Plan' }} />
        <Tabs.Screen name="pulse" options={{ title: 'Pulse' }} />
        <Tabs.Screen name="people" options={{ title: 'People' }} />
        <Tabs.Screen name="flights" options={{ title: 'Flights' }} />
        <Tabs.Screen name="prep" options={{ title: 'Prep' }} />
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
