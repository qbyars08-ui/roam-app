// =============================================================================
// ROAM — Tab Navigator Layout
// Web: sidebar navigation. Native: floating pill nav.
// =============================================================================
import React from 'react';
import { Platform, View } from 'react-native';
import { Tabs } from 'expo-router';
import { COLORS } from '../../lib/constants';
import FloatingPillNav from '../../components/ui/FloatingPillNav';
import LiveCompanionFAB from '../../components/features/LiveCompanionFAB';
import Sidebar from '../../components/web/Sidebar';

const isWeb = Platform.OS === 'web';

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
          {tabContent}
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
