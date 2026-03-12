// =============================================================================
// ROAM — Tab Navigator Layout
// 4 visible tabs: Discover / Plan / My Trips / You
// Hidden tabs: chat, prep, flights, pets, passport, globe (accessible via router)
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
        }}
      >
        {/* ── Visible tabs (4) ── */}
        <Tabs.Screen name="index" options={{ title: 'Discover' }} />
        <Tabs.Screen name="plan" options={{ title: 'Plan' }} />
        <Tabs.Screen name="saved" options={{ title: 'My Trips' }} />
        <Tabs.Screen name="profile" options={{ title: 'You' }} />

        {/* ── Hidden tabs — still routable, just not in the tab bar ── */}
        <Tabs.Screen name="chat" options={{ href: null }} />
        <Tabs.Screen name="prep" options={{ href: null }} />
        <Tabs.Screen name="flights" options={{ href: null }} />
        <Tabs.Screen name="pets" options={{ href: null }} />
        <Tabs.Screen name="passport" options={{ href: null }} />
        <Tabs.Screen name="globe" options={{ href: null }} />
      </Tabs>
      <LiveCompanionFAB />
    </View>
  );
}
