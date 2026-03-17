// =============================================================================
// ROAM — SourceCitation
// Horizontal row of domain chips for Sonar live data attribution
// =============================================================================

import React, { useCallback } from 'react';
import { Linking, Pressable, ScrollView, StyleSheet, Text } from 'react-native';
import * as Haptics from '../../lib/haptics';
import { COLORS, FONTS, RADIUS, SPACING } from '../../lib/constants';
import type { SonarCitation } from '../../lib/types/sonar';

interface SourceCitationProps {
  citations: SonarCitation[];
  max?: number;
}

export default function SourceCitation({
  citations,
  max = 3,
}: SourceCitationProps): React.JSX.Element | null {
  const visible = citations.slice(0, max);

  const handlePress = useCallback((url: string) => {
    Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light).catch(() => {});
    Linking.openURL(url).catch(() => {});
  }, []);

  if (visible.length === 0) return null;

  return (
    <ScrollView
      horizontal
      showsHorizontalScrollIndicator={false}
      contentContainerStyle={styles.row}
    >
      {visible.map((citation, i) => (
        <Pressable
          key={`${citation.domain}-${i}`}
          style={styles.chip}
          onPress={() => handlePress(citation.url)}
          hitSlop={6}
        >
          <Text style={styles.chipText} numberOfLines={1}>
            {citation.domain}
          </Text>
        </Pressable>
      ))}
    </ScrollView>
  );
}

const styles = StyleSheet.create({
  row: {
    flexDirection: 'row',
    gap: SPACING.xs,
  },
  chip: {
    backgroundColor: COLORS.bgElevated,
    borderWidth: 1,
    borderColor: COLORS.border,
    borderRadius: RADIUS.sm,
    paddingHorizontal: SPACING.sm,
    paddingVertical: 3,
  },
  chipText: {
    fontFamily: FONTS.mono,
    fontSize: 10,
    color: COLORS.creamDim,
  },
});
