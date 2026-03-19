// =============================================================================
// ROAM — QuickActions (quick action buttons grid)
// =============================================================================
import React from 'react';
import { Pressable, StyleSheet, Text, View, type TextStyle, type ViewStyle } from 'react-native';
import { Bed, Utensils, Plane } from 'lucide-react-native';
import { useTranslation } from 'react-i18next';
import { COLORS, FONTS, SPACING, RADIUS, CARD_SHADOW } from '../../lib/constants';

// ---------------------------------------------------------------------------
// Quick Action data
// ---------------------------------------------------------------------------
interface QuickAction {
  id: string;
  icon: React.ElementType;
  labelKey: string;
  subKey: string;
  color: string;
  iconBg: string;
}

const QUICK_ACTIONS: QuickAction[] = [
  {
    id: 'hotels',
    icon: Bed,
    labelKey: 'plan.findStays',
    subKey: 'plan.staysSub',
    color: COLORS.sage,
    iconBg: COLORS.sageLight,
  },
  {
    id: 'food',
    icon: Utensils,
    labelKey: 'plan.findFood',
    subKey: 'plan.foodSub',
    color: COLORS.coral,
    iconBg: COLORS.coralLight,
  },
  {
    id: 'flights',
    icon: Plane,
    labelKey: 'plan.bookFlights',
    subKey: 'plan.flightsSub',
    color: COLORS.gold,
    iconBg: COLORS.goldSubtle,
  },
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
    <View style={styles.quickActions}>
      {QUICK_ACTIONS.map((action) => (
        <Pressable
          key={action.id}
          style={({ pressed }) => [styles.quickAction, { transform: [{ scale: pressed ? 0.95 : 1 }] }]}
          onPress={() => onAction(action.id)}
          accessibilityLabel={t(action.labelKey)}
          accessibilityRole="button"
        >
          <View style={[styles.quickActionIcon, { backgroundColor: action.iconBg }]}>
            <action.icon size={18} color={action.color} strokeWidth={1.5} />
          </View>
          <Text style={styles.quickActionLabel}>{t(action.labelKey)}</Text>
          <Text style={styles.quickActionSub}>{t(action.subKey)}</Text>
        </Pressable>
      ))}
    </View>
  );
}

// ---------------------------------------------------------------------------
// Styles
// ---------------------------------------------------------------------------
const styles = StyleSheet.create({
  quickActions: {
    flexDirection: 'row',
    gap: SPACING.md,
    marginBottom: SPACING.xxxl,
  } as ViewStyle,
  quickAction: {
    flex: 1,
    backgroundColor: COLORS.bgMagazine,
    borderRadius: RADIUS.lg,
    padding: SPACING.md,
    alignItems: 'center',
    gap: SPACING.xs,
    ...CARD_SHADOW,
  } as ViewStyle,
  quickActionIcon: {
    width: 40,
    height: 40,
    borderRadius: RADIUS.md,
    alignItems: 'center',
    justifyContent: 'center',
    marginBottom: 4,
  } as ViewStyle,
  quickActionLabel: {
    fontFamily: FONTS.bodySemiBold,
    fontSize: 13,
    color: COLORS.cream,
    textAlign: 'center',
  } as TextStyle,
  quickActionSub: {
    fontFamily: FONTS.body,
    fontSize: 11,
    color: COLORS.creamMuted,
    textAlign: 'center',
  } as TextStyle,
});
