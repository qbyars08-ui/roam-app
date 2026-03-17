// =============================================================================
// ROAM — SurvivalPhrasesCard: survival phrases with audio playback
// =============================================================================
import React, { useCallback, useMemo, useRef, useState } from 'react';
import { useTranslation } from 'react-i18next';
import {
  Pressable,
  StyleSheet,
  Text,
  View,
  type TextStyle,
  type ViewStyle,
} from 'react-native';
import {
  HandMetal,
  Siren,
  Utensils,
  Bus,
  Banknote,
  Play,
} from 'lucide-react-native';
import { COLORS, FONTS, SPACING, RADIUS } from '../../lib/constants';
import { pronounce } from '../../lib/elevenlabs';
import * as Haptics from '../../lib/haptics';
import PronunciationButton from './PronunciationButton';

// ---------------------------------------------------------------------------
// Types
// ---------------------------------------------------------------------------

interface Phrase {
  category: string; // "greeting" | "emergency" | "food" | "transport" | "money"
  original: string; // English
  translation: string; // In destination language
  phonetic: string; // Pronunciation guide
}

interface SurvivalPhrasesCardProps {
  destination: string;
  language: string;
  phrases: ReadonlyArray<Phrase>;
}

// ---------------------------------------------------------------------------
// Helpers
// ---------------------------------------------------------------------------

const CATEGORY_ICON_MAP: Record<string, React.ElementType> = {
  greeting: HandMetal,
  emergency: Siren,
  food: Utensils,
  transport: Bus,
  money: Banknote,
};

function getCategoryIcon(category: string): React.ElementType {
  return CATEGORY_ICON_MAP[category] ?? HandMetal;
}

// ---------------------------------------------------------------------------
// Component
// ---------------------------------------------------------------------------

export default function SurvivalPhrasesCard({
  destination,
  language,
  phrases,
}: SurvivalPhrasesCardProps) {
  const { t } = useTranslation();
  const [playingAll, setPlayingAll] = useState(false);
  const playAllAbortRef = useRef(false);

  // Group phrases by category
  const groupedPhrases = useMemo(() => {
    const groups: Record<string, ReadonlyArray<Phrase>> = {};
    const ordered: Array<{ category: string; items: ReadonlyArray<Phrase> }> = [];
    const seen = new Set<string>();

    for (const phrase of phrases) {
      if (!seen.has(phrase.category)) {
        seen.add(phrase.category);
        const items = phrases.filter((p) => p.category === phrase.category);
        groups[phrase.category] = items;
        ordered.push({ category: phrase.category, items });
      }
    }

    return ordered;
  }, [phrases]);

  const handlePlayAll = useCallback(async () => {
    if (playingAll) {
      playAllAbortRef.current = true;
      setPlayingAll(false);
      return;
    }

    Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Medium);
    playAllAbortRef.current = false;
    setPlayingAll(true);

    try {
      for (const phrase of phrases) {
        if (playAllAbortRef.current) break;
        await pronounce(phrase.translation, language);
        // Small pause between phrases
        await new Promise((resolve) => setTimeout(resolve, 600));
      }
    } catch (err) {
      console.error('[SurvivalPhrasesCard] Play all error:', err);
    } finally {
      setPlayingAll(false);
    }
  }, [playingAll, phrases, language]);

  return (
    <View style={styles.card}>
      {/* Header */}
      <View style={styles.header}>
        <Text style={styles.headerTitle}>{t('survivalPhrases.title', { defaultValue: 'Survival Phrases' })}</Text>
        <Text style={styles.headerSubtitle}>{t('survivalPhrases.tapToHear', { defaultValue: 'Tap to hear' })}</Text>
      </View>

      {/* Phrase groups */}
      {groupedPhrases.map((group, groupIdx) => {
        const IconComponent = getCategoryIcon(group.category);

        return (
          <View key={group.category}>
            {/* Category divider */}
            {groupIdx > 0 && <View style={styles.divider} />}

            {/* Category label */}
            <View style={styles.categoryRow}>
              <IconComponent
                size={14}
                color={COLORS.creamDim}
                strokeWidth={1.5}
              />
              <Text style={styles.categoryLabel}>
                {group.category.charAt(0).toUpperCase() +
                  group.category.slice(1)}
              </Text>
            </View>

            {/* Phrases */}
            {group.items.map((phrase, phraseIdx) => (
              <View key={`${group.category}-${phraseIdx}`} style={styles.phraseRow}>
                <View style={styles.phraseText}>
                  <Text style={styles.original}>{phrase.original}</Text>
                  <Text style={styles.translation}>{phrase.translation}</Text>
                  <Text style={styles.phonetic}>{phrase.phonetic}</Text>
                </View>
                <PronunciationButton
                  text={phrase.translation}
                  language={language}
                  size="sm"
                />
              </View>
            ))}
          </View>
        );
      })}

      {/* Play All button */}
      <Pressable
        onPress={handlePlayAll}
        accessibilityLabel={
          playingAll ? t('survivalPhrases.stopPlayingAll', { defaultValue: 'Stop playing all phrases' }) : t('survivalPhrases.playAllPhrases', { defaultValue: 'Play all phrases' })
        }
        accessibilityRole="button"
        style={({ pressed }) => [
          styles.playAllButton,
          { opacity: pressed ? 0.85 : 1 },
          playingAll && styles.playAllButtonActive,
        ]}
      >
        <Play size={16} color={COLORS.bg} strokeWidth={1.5} />
        <Text style={styles.playAllLabel}>
          {playingAll ? t('survivalPhrases.stop', { defaultValue: 'Stop' }) : t('survivalPhrases.playAll', { defaultValue: 'Play All' })}
        </Text>
      </Pressable>
    </View>
  );
}

// ---------------------------------------------------------------------------
// Styles
// ---------------------------------------------------------------------------

const styles = StyleSheet.create({
  card: {
    backgroundColor: COLORS.bgCard,
    borderRadius: RADIUS.lg,
    borderWidth: 1,
    borderColor: COLORS.sageFaint,
    padding: SPACING.md,
  } as ViewStyle,
  header: {
    marginBottom: SPACING.md,
  } as ViewStyle,
  headerTitle: {
    fontFamily: FONTS.header,
    fontSize: 22,
    color: COLORS.cream,
  } as TextStyle,
  headerSubtitle: {
    fontFamily: FONTS.body,
    fontSize: 13,
    color: COLORS.creamSoft,
    marginTop: 2,
  } as TextStyle,
  divider: {
    height: 1,
    backgroundColor: COLORS.sageFaint,
    marginVertical: SPACING.sm,
  } as ViewStyle,
  categoryRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: SPACING.xs,
    marginBottom: SPACING.xs,
    marginTop: SPACING.xs,
  } as ViewStyle,
  categoryLabel: {
    fontFamily: FONTS.mono,
    fontSize: 11,
    color: COLORS.creamDim,
    textTransform: 'uppercase',
    letterSpacing: 1,
  } as TextStyle,
  phraseRow: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingVertical: SPACING.xs,
  } as ViewStyle,
  phraseText: {
    flex: 1,
    marginRight: SPACING.xs,
  } as ViewStyle,
  original: {
    fontFamily: FONTS.body,
    fontSize: 14,
    color: COLORS.cream,
  } as TextStyle,
  translation: {
    fontFamily: FONTS.bodySemiBold,
    fontSize: 14,
    color: COLORS.sage,
    marginTop: 2,
  } as TextStyle,
  phonetic: {
    fontFamily: FONTS.mono,
    fontSize: 12,
    color: COLORS.creamDim,
    marginTop: 2,
  } as TextStyle,
  playAllButton: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: COLORS.sage,
    borderRadius: RADIUS.md,
    paddingVertical: SPACING.sm + 2,
    marginTop: SPACING.md,
    gap: SPACING.xs,
    minHeight: 44,
  } as ViewStyle,
  playAllButtonActive: {
    backgroundColor: COLORS.sageDark,
  } as ViewStyle,
  playAllLabel: {
    fontFamily: FONTS.bodySemiBold,
    fontSize: 14,
    color: COLORS.bg,
  } as TextStyle,
});
