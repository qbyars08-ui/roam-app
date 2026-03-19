// =============================================================================
// ROAM — SlangCard: Local slang, gestures, and cultural phrases
// The phrases that make locals smile and say "where did you learn that?"
// =============================================================================
import React, { useCallback, useState } from 'react';
import { View, Text, StyleSheet } from 'react-native';
import * as Clipboard from 'expo-clipboard';
import { Copy, Sparkles } from 'lucide-react-native';
import { useTranslation } from 'react-i18next';
import { COLORS, FONTS, SPACING, RADIUS } from '../../lib/constants';
import { impactAsync, ImpactFeedbackStyle } from '../../lib/haptics';
import PressableScale from '../ui/PressableScale';
import type { LocalPhrase } from '../../lib/local-slang';
import { SLANG_CATEGORY_LABELS } from '../../lib/local-slang';

// ---------------------------------------------------------------------------
// Category pill color mapping
// ---------------------------------------------------------------------------
const CATEGORY_COLORS: Record<LocalPhrase['category'], { bg: string; text: string }> = {
  slang: { bg: COLORS.sageSubtle, text: COLORS.sage },
  gesture: { bg: COLORS.goldSubtle, text: COLORS.gold },
  expression: { bg: COLORS.sageVeryFaint, text: COLORS.creamDim },
  'food-order': { bg: COLORS.coralSubtle, text: COLORS.coral },
  compliment: { bg: COLORS.goldSubtle, text: COLORS.gold },
};

// ---------------------------------------------------------------------------
// Props
// ---------------------------------------------------------------------------
interface SlangCardProps {
  readonly phrase: LocalPhrase;
  readonly onPress?: () => void;
}

// ---------------------------------------------------------------------------
// Component
// ---------------------------------------------------------------------------
export default function SlangCard({ phrase, onPress }: SlangCardProps) {
  const { t } = useTranslation();
  const [copied, setCopied] = useState(false);

  const categoryStyle = CATEGORY_COLORS[phrase.category];

  const handleCopy = useCallback(async () => {
    impactAsync(ImpactFeedbackStyle.Light);
    await Clipboard.setStringAsync(phrase.phrase);
    setCopied(true);
    setTimeout(() => setCopied(false), 1500);
  }, [phrase.phrase]);

  const handlePress = useCallback(() => {
    impactAsync(ImpactFeedbackStyle.Light);
    onPress?.();
  }, [onPress]);

  return (
    <PressableScale
      onPress={handlePress}
      onLongPress={handleCopy}
      accessibilityLabel={t('slangCard.accessibilityLabel', {
        defaultValue: `${phrase.phrase}. ${phrase.meaning}. Long press to copy.`,
      })}
      style={styles.card}
    >
      {/* Header row: category pill + copy icon */}
      <View style={styles.header}>
        <View style={[styles.categoryPill, { backgroundColor: categoryStyle.bg }]}>
          <Text style={[styles.categoryText, { color: categoryStyle.text }]}>
            {SLANG_CATEGORY_LABELS[phrase.category].toUpperCase()}
          </Text>
        </View>
        <Copy
          size={14}
          color={copied ? COLORS.sage : COLORS.muted}
          strokeWidth={1.5}
        />
      </View>

      {/* Main phrase */}
      <Text style={styles.phrase} numberOfLines={2}>
        {phrase.phrase}
      </Text>

      {/* Pronunciation */}
      <Text style={styles.pronunciation} numberOfLines={1}>
        {phrase.pronunciation}
      </Text>

      {/* Meaning */}
      <Text style={styles.meaning} numberOfLines={2}>
        {phrase.meaning}
      </Text>

      {/* Divider */}
      <View style={styles.divider} />

      {/* Context / when to use */}
      <Text style={styles.context} numberOfLines={4}>
        {phrase.context}
      </Text>

      {/* Fun fact badge — only rendered when present */}
      {phrase.funFact ? (
        <View style={styles.funFactRow}>
          <Sparkles size={12} color={COLORS.gold} strokeWidth={1.5} />
          <Text style={styles.funFact} numberOfLines={3}>
            {phrase.funFact}
          </Text>
        </View>
      ) : null}
    </PressableScale>
  );
}

// ---------------------------------------------------------------------------
// Styles
// ---------------------------------------------------------------------------
const styles = StyleSheet.create({
  card: {
    backgroundColor: COLORS.surface1,
    borderRadius: RADIUS.md,
    borderWidth: 1,
    borderColor: COLORS.border,
    padding: SPACING.md,
    gap: SPACING.xs,
  },
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    marginBottom: 2,
  },
  categoryPill: {
    borderRadius: RADIUS.pill,
    paddingHorizontal: SPACING.sm,
    paddingVertical: 3,
  },
  categoryText: {
    fontFamily: FONTS.mono,
    fontSize: 9,
    letterSpacing: 0.8,
  },
  phrase: {
    fontFamily: FONTS.headerMedium,
    fontSize: 18,
    color: COLORS.cream,
    lineHeight: 24,
    marginTop: 2,
  },
  pronunciation: {
    fontFamily: FONTS.mono,
    fontSize: 12,
    color: COLORS.sage,
    lineHeight: 16,
  },
  meaning: {
    fontFamily: FONTS.bodyMedium,
    fontSize: 14,
    color: COLORS.creamBright,
    lineHeight: 20,
    marginTop: 2,
  },
  divider: {
    height: 1,
    backgroundColor: COLORS.border,
    marginVertical: SPACING.xs,
  },
  context: {
    fontFamily: FONTS.body,
    fontSize: 12,
    color: COLORS.creamDim,
    lineHeight: 18,
  },
  funFactRow: {
    flexDirection: 'row',
    alignItems: 'flex-start',
    gap: SPACING.xs,
    marginTop: SPACING.xs,
    backgroundColor: COLORS.goldSubtle,
    borderRadius: RADIUS.sm,
    padding: SPACING.sm,
  },
  funFact: {
    fontFamily: FONTS.body,
    fontSize: 11,
    color: COLORS.gold,
    lineHeight: 16,
    flex: 1,
  },
});
