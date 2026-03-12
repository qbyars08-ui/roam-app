// =============================================================================
// ROAM — Auth Group Layout
// First-time: onboard (3 screens, Duolingo model)
// Returning: signup, signin, onboarding, welcome
// =============================================================================
import React from 'react';
import { Stack } from 'expo-router';
import { COLORS } from '../../lib/constants';

export default function AuthLayout() {
  return (
    <Stack
      screenOptions={{
        headerShown: false,
        contentStyle: { backgroundColor: COLORS.bg },
        animation: 'fade',
      }}
    >
      <Stack.Screen name="splash" options={{ animation: 'fade' }} />
      <Stack.Screen name="onboard" options={{ animation: 'fade' }} />
      <Stack.Screen name="hook" />
      <Stack.Screen name="social-proof" />
      <Stack.Screen name="value-preview" />
      <Stack.Screen name="personalization" />
      <Stack.Screen name="signup" />
      <Stack.Screen name="onboarding" />
      <Stack.Screen name="welcome" />
      <Stack.Screen name="signin" />
    </Stack>
  );
}
