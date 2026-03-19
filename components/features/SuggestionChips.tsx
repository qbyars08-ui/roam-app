// =============================================================================
// ROAM — Suggestion Chips
// Horizontal scrollable row of proactive CRAFT conversation starters.
// Tapping a chip sends it as a message in the CRAFT conversation.
// =============================================================================

import React, { useMemo } from 'react';
import {
  Pressable,
  ScrollView,
  StyleSheet,
  Text,
  View,
  type TextStyle,
  type ViewStyle,
} from 'react-native';
import { MessageCircle, Compass, Wrench, Star } from 'lucide-react-native';
import { COLORS, FONTS, SPACING, RADIUS } from '../../lib/constants';
import type { CraftSuggestion } from '../../lib/craft-suggestions';

// ---------------------------------------------------------------------------
// Props
// ---------------------------------------------------------------------------

interface SuggestionChipsProps {
  readonly suggestions: readonly CraftSuggestion[];
  readonly onSelect: (text: string) => void;
}

// ---------------------------------------------------------------------------
// Category icon mapping
// ---------------------------------------------------------------------------

const CATEGORY_ICON = {
  refine: MessageCircle,
  explore: Compass,
  practical: Wrench,
  insider: Star,
} as const;

const CATEGORY_COLOR = {
  refine: COLORS.sage,
  explore: COLORS.cream,
  practical: COLORS.creamDim,
  insider: COLORS.gold,
} as const;

// ---------------------------------------------------------------------------
// Component
// ---------------------------------------------------------------------------

export default function SuggestionChips({
  suggestions,
  onSelect,
}: SuggestionChipsProps): React.JSX.Element | null {
  const chips = useMemo(
    () => suggestions.slice(0, 5),
    [suggestions]
  );

  if (chips.length === 0) return null;

  return (
    <View style={styles.container}>
      <ScrollView
        horizontal
        showsHorizontalScrollIndicator={false}
        contentContainerStyle={styles.scroll}
      >
        {chips.map((chip, i) => {
          const Icon = CATEGORY_ICON[chip.category];
          const iconColor = CATEGORY_COLOR[chip.category];

          return (
            <Pressable
              key={i}
              onPress={() => onSelect(chip.text)}
              style={({ pressed }) => [
                styles.chip,
                pressed && styles.chipPressed,
              ]}
              accessibilityRole="button"
              accessibilityLabel={chip.text}
            >
              <Icon size={13} color={iconColor} strokeWidth={1.5} />
              <Text style={styles.chipText} numberOfLines={1}>
                {chip.text}
              </Text>
            </Pressable>
          );
        })}
      </ScrollView>
    </View>
  );
}

// ---------------------------------------------------------------------------
// Styles
// ---------------------------------------------------------------------------

const styles = StyleSheet.create({
  container: {
    marginVertical: SPACING.sm,
  } as ViewStyle,
  scroll: {
    paddingHorizontal: SPACING.md,
    gap: SPACING.sm,
  } as ViewStyle,
  chip: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
    backgroundColor: COLORS.surface2,
    borderWidth: 1,
    borderColor: COLORS.border,
    borderRadius: RADIUS.pill,
    paddingHorizontal: 14,
    paddingVertical: 10,
    maxWidth: 280,
  } as ViewStyle,
  chipPressed: {
    opacity: 0.7,
    backgroundColor: COLORS.surface1,
  } as ViewStyle,
  chipText: {
    fontFamily: FONTS.body,
    fontSize: 13,
    color: COLORS.cream,
    lineHeight: 18,
  } as TextStyle,
});
