// =============================================================================
// ROAM — VibeTagSelector
// Multi-select grid for choosing social vibe tags.
// =============================================================================
import React, { useCallback, useMemo } from 'react';
import { Pressable, StyleSheet, Text, View } from 'react-native';
import { COLORS, FONTS, SPACING, RADIUS } from '../../lib/constants';
import * as Haptics from '../../lib/haptics';
import { type VibeTag, VIBE_TAG_LABELS } from '../../lib/types/social';

// ---------------------------------------------------------------------------
// Constants
// ---------------------------------------------------------------------------
const MAX_VIBE_TAGS = 10;
const ALL_VIBE_TAGS = Object.keys(VIBE_TAG_LABELS) as VibeTag[];

// ---------------------------------------------------------------------------
// Types
// ---------------------------------------------------------------------------
interface VibeTagSelectorProps {
  selected: VibeTag[];
  onSelect: (tags: VibeTag[]) => void;
  maxTags?: number;
}

// ---------------------------------------------------------------------------
// Sub-component
// ---------------------------------------------------------------------------
interface VibePillProps {
  tag: VibeTag;
  isSelected: boolean;
  isDisabled: boolean;
  onPress: (tag: VibeTag) => void;
}

const VibePill = React.memo<VibePillProps>(({ tag, isSelected, isDisabled, onPress }) => {
  const handlePress = useCallback(() => onPress(tag), [tag, onPress]);

  return (
    <Pressable
      onPress={handlePress}
      disabled={isDisabled && !isSelected}
      style={[
        styles.pill,
        isSelected && styles.pillSelected,
        isDisabled && !isSelected && styles.pillDisabled,
      ]}
    >
      <Text style={[styles.pillText, isSelected && styles.pillTextSelected]}>
        {VIBE_TAG_LABELS[tag]}
      </Text>
    </Pressable>
  );
});

VibePill.displayName = 'VibePill';

// ---------------------------------------------------------------------------
// Component
// ---------------------------------------------------------------------------
const VibeTagSelector = React.memo<VibeTagSelectorProps>(({
  selected,
  onSelect,
  maxTags = MAX_VIBE_TAGS,
}) => {
  const selectedSet = useMemo(() => new Set<VibeTag>(selected), [selected]);
  const isMaxReached = selected.length >= maxTags;

  const handleToggle = useCallback(
    async (tag: VibeTag) => {
      await Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
      if (selectedSet.has(tag)) {
        onSelect(selected.filter((t) => t !== tag));
      } else if (selected.length < maxTags) {
        onSelect([...selected, tag]);
      }
    },
    [selected, selectedSet, onSelect, maxTags],
  );

  return (
    <View style={styles.container}>
      <View style={styles.header}>
        <Text style={styles.title}>Vibe Tags</Text>
        <Text style={styles.counter}>
          {selected.length}/{maxTags}
        </Text>
      </View>
      <View style={styles.grid}>
        {ALL_VIBE_TAGS.map((tag) => (
          <VibePill
            key={tag}
            tag={tag}
            isSelected={selectedSet.has(tag)}
            isDisabled={isMaxReached}
            onPress={handleToggle}
          />
        ))}
      </View>
      {isMaxReached && (
        <Text style={styles.limitNote}>Max {maxTags} tags selected</Text>
      )}
    </View>
  );
});

VibeTagSelector.displayName = 'VibeTagSelector';

// ---------------------------------------------------------------------------
// Styles
// ---------------------------------------------------------------------------
const styles = StyleSheet.create({
  container: {
    gap: SPACING.sm,
  },
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
  },
  title: {
    fontFamily: FONTS.bodyMedium,
    fontSize: 14,
    color: COLORS.creamMuted,
    letterSpacing: 0.5,
  },
  counter: {
    fontFamily: FONTS.mono,
    fontSize: 12,
    color: COLORS.creamMuted,
  },
  grid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: SPACING.xs,
  },
  pill: {
    paddingHorizontal: SPACING.sm + 4,
    paddingVertical: SPACING.xs + 2,
    borderRadius: RADIUS.full,
    backgroundColor: COLORS.bgGlass,
    borderWidth: 1,
    borderColor: COLORS.border,
  },
  pillSelected: {
    backgroundColor: COLORS.sage,
    borderColor: COLORS.sage,
  },
  pillDisabled: {
    opacity: 0.4,
  },
  pillText: {
    fontFamily: FONTS.mono,
    fontSize: 12,
    color: COLORS.creamMuted,
  },
  pillTextSelected: {
    color: COLORS.bg,
  },
  limitNote: {
    fontFamily: FONTS.mono,
    fontSize: 11,
    color: COLORS.coral,
    textAlign: 'center',
    marginTop: SPACING.xs,
  },
});

export default VibeTagSelector;
