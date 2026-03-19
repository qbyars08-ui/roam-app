// =============================================================================
// ROAM — QuickActions (3 icon-only circles with labels below, evenly spaced)
// =============================================================================
import React from 'react';
import { Pressable, StyleSheet, Text, View, type TextStyle, type ViewStyle } from 'react-native';
import { Bed, Utensils, Plane } from 'lucide-react-native';
import { useTranslation } from 'react-i18next';
import * as Haptics from '../../lib/haptics';
import { COLORS, FONTS, SPACING } from '../../lib/constants';

// ---------------------------------------------------------------------------
// Quick Action data
// ---------------------------------------------------------------------------
interface QuickAction {
  id: string;
  icon: React.ElementType;
  labelKey: string;
  color: string;
}

const QUICK_ACTIONS: QuickAction[] = [
  { id: 'hotels', icon: Bed, labelKey: 'plan.stays', color: COLORS.sage },
  { id: 'food', icon: Utensils, labelKey: 'plan.food', color: COLORS.sage },
  { id: 'flights', icon: Plane, labelKey: 'plan.flights', color: COLORS.sage },
];

// ---------------------------------------------------------------------------
// Props
// ---------------------------------------------------------------------------
export interface QuickActionsProps {
  onAction: (id: string) => void;
}

// ---------------------------------------------------------------------------
// Component
// ---------------------------------------------------------------------------
export default function QuickActions({ onAction }: QuickActionsProps) {
  const { t } = useTranslation();

  return (
    <View style={styles.container}>
      {QUICK_ACTIONS.map((action) => (
        <Pressable
          key={action.id}
          style={({ pressed }) => [styles.action, { transform: [{ scale: pressed ? 0.93 : 1 }] }]}
          onPress={() => {
            Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
            onAction(action.id);
          }}
          accessibilityLabel={t(action.labelKey, { defaultValue: action.id })}
          accessibilityRole="button"
        >
          <View style={styles.iconCircle}>
            <action.icon size={20} color={action.color} strokeWidth={1.5} />
          </View>
          <Text style={styles.label}>{t(action.labelKey, { defaultValue: action.id })}</Text>
        </Pressable>
      ))}
    </View>
  );
}

// ---------------------------------------------------------------------------
// Styles
// ---------------------------------------------------------------------------
const styles = StyleSheet.create({
  container: {
    flexDirection: 'row',
    justifyContent: 'space-evenly',
    marginBottom: SPACING.xxl,
    paddingVertical: SPACING.lg,
  } as ViewStyle,
  action: {
    alignItems: 'center',
    gap: SPACING.sm,
  } as ViewStyle,
  iconCircle: {
    width: 52,
    height: 52,
    borderRadius: 26,
    backgroundColor: COLORS.surface1,
    borderWidth: 1,
    borderColor: COLORS.border,
    alignItems: 'center',
    justifyContent: 'center',
  } as ViewStyle,
  label: {
    fontFamily: FONTS.bodyMedium,
    fontSize: 12,
    color: COLORS.muted,
    textAlign: 'center',
  } as TextStyle,
});
