// =============================================================================
// ROAM — Persona Picker Screen
// Beautiful full-screen traveler type selection: 2x3 grid of 6 personas
// =============================================================================
import React, { useCallback, useMemo, useRef, useState } from 'react';
import {
  Animated,
  Pressable,
  ScrollView,
  StyleSheet,
  Text,
  View,
  type TextStyle,
  type ViewStyle,
} from 'react-native';
import { useRouter } from 'expo-router';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import {
  Backpack,
  Crown,
  Users,
  Briefcase,
  Heart,
  Mountain,
  ArrowLeft,
  type LucideIcon,
} from 'lucide-react-native';
import {
  impactAsync,
  notificationAsync,
  ImpactFeedbackStyle,
  NotificationFeedbackType,
} from '../lib/haptics';
import { COLORS, FONTS, SPACING, RADIUS } from '../lib/constants';
import { useAppStore } from '../lib/store';
import { ALL_PERSONAS, type TravelerPersona, type PersonaConfig } from '../lib/traveler-persona';

// ---------------------------------------------------------------------------
// Icon map — lucide icon name → component
// ---------------------------------------------------------------------------
const ICON_MAP: Record<string, LucideIcon> = {
  Backpack,
  Crown,
  Users,
  Briefcase,
  Heart,
  Mountain,
};

// ---------------------------------------------------------------------------
// PersonaCard
// ---------------------------------------------------------------------------
interface PersonaCardProps {
  config: PersonaConfig;
  isSelected: boolean;
  onPress: (id: TravelerPersona) => void;
}

function PersonaCard({ config, isSelected, onPress }: PersonaCardProps) {
  const scaleAnim = useRef(new Animated.Value(1)).current;

  const handlePress = useCallback(() => {
    Animated.sequence([
      Animated.timing(scaleAnim, { toValue: 0.95, duration: 80, useNativeDriver: true }),
      Animated.timing(scaleAnim, { toValue: 1, duration: 120, useNativeDriver: true }),
    ]).start();
    impactAsync(ImpactFeedbackStyle.Light).catch(() => {});
    onPress(config.id);
  }, [config.id, onPress, scaleAnim]);

  const IconComponent = ICON_MAP[config.icon] ?? Mountain;

  return (
    <Animated.View style={{ transform: [{ scale: scaleAnim }], flex: 1 }}>
      <Pressable
        onPress={handlePress}
        style={[styles.card, isSelected && styles.cardSelected]}
        accessibilityRole="radio"
        accessibilityState={{ selected: isSelected }}
        accessibilityLabel={`${config.label}: ${config.description}`}
      >
        <View style={[styles.iconContainer, isSelected && styles.iconContainerSelected]}>
          <IconComponent
            size={28}
            color={isSelected ? COLORS.sage : COLORS.muted}
            strokeWidth={1.5}
          />
        </View>
        <Text style={[styles.cardLabel, isSelected && styles.cardLabelSelected]}>
          {config.label}
        </Text>
        <Text style={styles.cardDescription} numberOfLines={2}>
          {config.description}
        </Text>
        <Text style={styles.cardBudget}>{config.budgetRange}</Text>
      </Pressable>
    </Animated.View>
  );
}

// ---------------------------------------------------------------------------
// Main screen
// ---------------------------------------------------------------------------
export default function PersonaPickerScreen() {
  const router = useRouter();
  const insets = useSafeAreaInsets();
  const setTravelerPersona = useAppStore((s) => s.setTravelerPersona);
  const existingPersona = useAppStore((s) => s.travelerPersona);

  const [selected, setSelected] = useState<TravelerPersona | null>(existingPersona);

  const handleSelect = useCallback((id: TravelerPersona) => {
    setSelected(id);
  }, []);

  const handleConfirm = useCallback(() => {
    if (!selected) return;
    notificationAsync(NotificationFeedbackType.Success).catch(() => {});
    setTravelerPersona(selected);
    router.back();
  }, [selected, setTravelerPersona, router]);

  const handleBack = useCallback(() => {
    impactAsync(ImpactFeedbackStyle.Light).catch(() => {});
    router.back();
  }, [router]);

  const rows = useMemo(() => {
    const pairs: [PersonaConfig, PersonaConfig][] = [];
    for (let i = 0; i < ALL_PERSONAS.length; i += 2) {
      const a = ALL_PERSONAS[i];
      const b = ALL_PERSONAS[i + 1];
      if (a && b) pairs.push([a, b]);
    }
    return pairs;
  }, []);

  return (
    <View style={[styles.container, { paddingTop: insets.top }]}>
      {/* Header */}
      <View style={styles.header}>
        <Pressable onPress={handleBack} style={styles.backButton} hitSlop={12}>
          <ArrowLeft size={20} color={COLORS.muted} strokeWidth={1.5} />
        </Pressable>
        <View style={styles.headerText}>
          <Text style={styles.title}>How do you travel?</Text>
          <Text style={styles.subtitle}>Pick the style that fits. You can change it anytime.</Text>
        </View>
      </View>

      <ScrollView
        contentContainerStyle={[styles.grid, { paddingBottom: insets.bottom + 120 }]}
        showsVerticalScrollIndicator={false}
      >
        {rows.map(([left, right]) => (
          <View key={left.id} style={styles.row}>
            <PersonaCard
              config={left}
              isSelected={selected === left.id}
              onPress={handleSelect}
            />
            <View style={styles.rowGap} />
            <PersonaCard
              config={right}
              isSelected={selected === right.id}
              onPress={handleSelect}
            />
          </View>
        ))}
      </ScrollView>

      {/* Confirm button — slides up when a persona is selected */}
      {selected && (
        <View style={[styles.footer, { paddingBottom: insets.bottom + 16 }]}>
          <Pressable
            onPress={handleConfirm}
            style={styles.confirmButton}
            accessibilityRole="button"
            accessibilityLabel="Confirm persona selection"
          >
            <Text style={styles.confirmText}>This is me</Text>
          </Pressable>
        </View>
      )}
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
  } as ViewStyle,

  header: {
    flexDirection: 'row',
    alignItems: 'flex-start',
    paddingHorizontal: SPACING.md,
    paddingVertical: SPACING.md,
    gap: SPACING.sm,
  } as ViewStyle,

  backButton: {
    width: 36,
    height: 36,
    borderRadius: RADIUS.md,
    backgroundColor: COLORS.surface1,
    alignItems: 'center',
    justifyContent: 'center',
    marginTop: 2,
  } as ViewStyle,

  headerText: {
    flex: 1,
  } as ViewStyle,

  title: {
    fontFamily: FONTS.header,
    fontSize: 24,
    color: COLORS.accent,
    lineHeight: 30,
  } as TextStyle,

  subtitle: {
    fontFamily: FONTS.body,
    fontSize: 14,
    color: COLORS.muted,
    marginTop: 4,
    lineHeight: 20,
  } as TextStyle,

  grid: {
    paddingHorizontal: SPACING.md,
    paddingTop: SPACING.sm,
    gap: SPACING.sm,
  } as ViewStyle,

  row: {
    flexDirection: 'row',
    gap: SPACING.sm,
  } as ViewStyle,

  rowGap: {
    width: SPACING.sm,
  } as ViewStyle,

  card: {
    flex: 1,
    backgroundColor: COLORS.surface1,
    borderRadius: RADIUS.md,
    padding: SPACING.md,
    borderWidth: 1,
    borderColor: COLORS.border,
    gap: SPACING.xs,
  } as ViewStyle,

  cardSelected: {
    borderColor: COLORS.sageBorder,
    backgroundColor: COLORS.sageVeryFaint,
  } as ViewStyle,

  iconContainer: {
    width: 48,
    height: 48,
    borderRadius: RADIUS.md,
    backgroundColor: COLORS.surface2,
    alignItems: 'center',
    justifyContent: 'center',
    marginBottom: SPACING.xs,
  } as ViewStyle,

  iconContainerSelected: {
    backgroundColor: COLORS.sageSubtle,
  } as ViewStyle,

  cardLabel: {
    fontFamily: FONTS.header,
    fontSize: 16,
    color: COLORS.accent,
    lineHeight: 20,
  } as TextStyle,

  cardLabelSelected: {
    color: COLORS.sage,
  } as TextStyle,

  cardDescription: {
    fontFamily: FONTS.body,
    fontSize: 12,
    color: COLORS.muted,
    lineHeight: 16,
  } as TextStyle,

  cardBudget: {
    fontFamily: FONTS.mono,
    fontSize: 11,
    color: COLORS.muted,
    marginTop: SPACING.xs,
  } as TextStyle,

  footer: {
    position: 'absolute',
    bottom: 0,
    left: 0,
    right: 0,
    paddingHorizontal: SPACING.md,
    paddingTop: SPACING.md,
    backgroundColor: COLORS.bg,
    borderTopWidth: 1,
    borderTopColor: COLORS.border,
  } as ViewStyle,

  confirmButton: {
    backgroundColor: COLORS.sage,
    borderRadius: RADIUS.pill,
    paddingVertical: 16,
    alignItems: 'center',
    justifyContent: 'center',
  } as ViewStyle,

  confirmText: {
    fontFamily: FONTS.headerMedium,
    fontSize: 16,
    color: COLORS.bg,
  } as TextStyle,
});
