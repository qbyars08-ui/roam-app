// =============================================================================
// ROAM — Tab Navigator Layout
// 6 visible tabs: Discover / Generate / Flights / Stays / Food / Prep
// Displaced screens (saved, profile, globe, passport, pets) → standalone routes
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
        {/* ── Visible tabs (6) ── */}
        <Tabs.Screen name="index" options={{ title: 'Discover' }} />
        <Tabs.Screen name="generate" options={{ title: 'Generate' }} />
        <Tabs.Screen name="flights" options={{ title: 'Flights' }} />
        <Tabs.Screen name="stays" options={{ title: 'Stays' }} />
        <Tabs.Screen name="food" options={{ title: 'Food' }} />
        <Tabs.Screen name="prep" options={{ title: 'Prep' }} />
        <Tabs.Screen name="group" options={{ href: null }} />
      </Tabs>
      <LiveCompanionFAB />
    </View>
  );
}
