// =============================================================================
// ROAM — Onboarding: Single Screen
// "Where do you want to go?" + input + 6 chips + go button. Nothing else.
// =============================================================================
import React, { useCallback, useRef, useState } from 'react';
import {
  Pressable,
  StyleSheet,
  Text,
  TextInput,
  View,
  type TextStyle,
  type ViewStyle,
} from 'react-native';
import { useRouter } from 'expo-router';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import AsyncStorage from '@react-native-async-storage/async-storage';
import * as Haptics from '../lib/haptics';
import { COLORS, FONTS, SPACING, RADIUS } from '../lib/constants';

// ---------------------------------------------------------------------------
// Storage key (keep export for compatibility)
// ---------------------------------------------------------------------------
const HAS_SEEN_ONBOARDING = '@roam/hasSeenOnboarding';

export { HAS_SEEN_ONBOARDING };

// ---------------------------------------------------------------------------
// Destination quick-pick chips
// ---------------------------------------------------------------------------
const DESTINATION_CHIPS = [
  'Tokyo',
  'Bali',
  'Paris',
  'Barcelona',
  'Mexico City',
  'Seoul',
] as const;

// ---------------------------------------------------------------------------
// Component
// ---------------------------------------------------------------------------
export default function OnboardingScreen() {
  const router = useRouter();
  const insets = useSafeAreaInsets();
  const inputRef = useRef<TextInput>(null);
  const [destination, setDestination] = useState('');

  const handleChipPress = useCallback(
    (name: string) => {
      Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
      setDestination(name);
    },
    [],
  );

  const handlePlan = useCallback(async () => {
    Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Medium);
    await AsyncStorage.setItem(HAS_SEEN_ONBOARDING, 'true');
    router.replace({
      pathname: '/craft-session',
      params: { destination: destination || undefined },
    });
  }, [destination, router]);

  return (
    <View
      style={[
        styles.container,
        { paddingTop: insets.top + 48, paddingBottom: insets.bottom + 32 },
      ]}
    >
      {/* Header */}
      <Text style={styles.title}>Where do you{'\n'}want to go?</Text>

      {/* Large text input — pill shape, sage border */}
      <TextInput
        ref={inputRef}
        style={styles.input}
        placeholder="Tokyo, Bali, anywhere..."
        placeholderTextColor={COLORS.muted}
        value={destination}
        onChangeText={setDestination}
        autoFocus
        returnKeyType="done"
        selectionColor={COLORS.sage}
        onSubmitEditing={handlePlan}
      />

      {/* 6 destination chips */}
      <View style={styles.chipGrid}>
        {DESTINATION_CHIPS.map((name) => {
          const isSelected = destination === name;
          return (
            <Pressable
              key={name}
              onPress={() => handleChipPress(name)}
              style={({ pressed }) => [
                styles.chip,
                isSelected && styles.chipSelected,
                { opacity: pressed ? 0.7 : 1 },
              ]}
            >
              <Text
                style={[
                  styles.chipText,
                  isSelected && styles.chipTextSelected,
                ]}
              >
                {name}
              </Text>
            </Pressable>
          );
        })}
      </View>

      {/* Spacer */}
      <View style={styles.spacer} />

      {/* CTA */}
      <Pressable
        onPress={handlePlan}
        style={({ pressed }) => [
          styles.ctaButton,
          { transform: [{ scale: pressed ? 0.97 : 1 }] },
        ]}
      >
        <Text style={styles.ctaText}>Plan it {'\u2192'}</Text>
      </Pressable>
    </View>
  );
}

// ---------------------------------------------------------------------------
// Styles
// ---------------------------------------------------------------------------
const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: COLORS.bg,
    paddingHorizontal: SPACING.lg,
  } as ViewStyle,

  title: {
    fontFamily: FONTS.header,
    fontSize: 28,
    color: COLORS.cream,
    textAlign: 'center',
    lineHeight: 36,
  } as TextStyle,

  input: {
    width: '100%',
    height: 48,
    backgroundColor: COLORS.bgCard,
    borderRadius: RADIUS.pill,
    borderWidth: 1,
    borderColor: COLORS.sageBorder,
    paddingHorizontal: SPACING.lg,
    fontFamily: FONTS.body,
    fontSize: 18,
    color: COLORS.cream,
    marginTop: SPACING.xl,
  } as TextStyle,

  chipGrid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: SPACING.sm,
    marginTop: SPACING.xl,
    justifyContent: 'center',
  } as ViewStyle,

  chip: {
    backgroundColor: COLORS.bgCard,
    borderRadius: RADIUS.pill,
    paddingHorizontal: SPACING.md,
    paddingVertical: SPACING.sm + 2,
    borderWidth: 1,
    borderColor: COLORS.border,
  } as ViewStyle,

  chipSelected: {
    backgroundColor: COLORS.sageSubtle,
    borderColor: COLORS.sageBorder,
  } as ViewStyle,

  chipText: {
    fontFamily: FONTS.bodyMedium,
    fontSize: 15,
    color: COLORS.creamSoft,
  } as TextStyle,

  chipTextSelected: {
    color: COLORS.sage,
  } as TextStyle,

  spacer: {
    flex: 1,
  } as ViewStyle,

  ctaButton: {
    backgroundColor: COLORS.sage,
    borderRadius: RADIUS.pill,
    paddingVertical: SPACING.md + 2,
    width: '100%',
    alignItems: 'center',
  } as ViewStyle,

  ctaText: {
    fontFamily: FONTS.bodyMedium,
    fontSize: 18,
    color: COLORS.bg,
  } as TextStyle,
});
