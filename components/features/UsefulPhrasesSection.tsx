// =============================================================================
// ROAM — Useful Phrases Section for Prep Tab
// Shows categorized essential phrases for the destination's language
// =============================================================================
import React, { useState } from 'react';
import {
  View,
  Text,
  Pressable,
  StyleSheet,
  type ViewStyle,
  type TextStyle,
} from 'react-native';
import { useTranslation } from 'react-i18next';
import { Volume2, ChevronDown, ChevronUp } from 'lucide-react-native';
import * as Speech from 'expo-speech';
import * as Haptics from '../../lib/haptics';
import { COLORS, FONTS, SPACING, RADIUS } from '../../lib/constants';
import type { LanguagePack, Phrase } from '../../lib/prep/language-data';

interface UsefulPhrasesSectionProps {
  pack: LanguagePack;
}

type PhraseCategory = Phrase['category'];

const CATEGORY_ORDER: PhraseCategory[] = [
  'greetings',
  'food',
  'directions',
  'emergency',
  'transport',
  'shopping',
  'social',
];

const CATEGORY_LABELS: Record<PhraseCategory, string> = {
  greetings: 'Greetings & Basics',
  food: 'Food & Dining',
  directions: 'Directions',
  emergency: 'Emergency',
  transport: 'Getting Around',
  shopping: 'Shopping',
  social: 'Social',
};

const CATEGORY_I18N: Record<PhraseCategory, string> = {
  greetings: 'usefulPhrases.greetingsBasics',
  food: 'usefulPhrases.foodDining',
  directions: 'usefulPhrases.directions',
  emergency: 'usefulPhrases.emergency',
  transport: 'usefulPhrases.gettingAround',
  shopping: 'usefulPhrases.shopping',
  social: 'usefulPhrases.social',
};

function PhraseCard({ phrase, language }: { phrase: Phrase; language: string }) {
  const handleSpeak = () => {
    Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
    Speech.speak(phrase.local, { language: language.toLowerCase().slice(0, 2) });
  };

  return (
    <View style={styles.phraseCard}>
      <View style={styles.phraseContent}>
        <Text style={styles.phraseEnglish}>{phrase.english}</Text>
        <Text style={styles.phraseLocal}>{phrase.local}</Text>
        <Text style={styles.phrasePhonetic}>{phrase.phonetic}</Text>
      </View>
      <Pressable
        onPress={handleSpeak}
        hitSlop={8}
        style={({ pressed }) => [styles.speakBtn, { opacity: pressed ? 0.6 : 1 }]}
        accessibilityLabel={`Speak: ${phrase.local}`}
      >
        <Volume2 size={16} color={COLORS.sage} strokeWidth={2} />
      </Pressable>
    </View>
  );
}

export default function UsefulPhrasesSection({ pack }: UsefulPhrasesSectionProps) {
  const { t } = useTranslation();
  const [expandedCategories, setExpandedCategories] = useState<Set<PhraseCategory>>(
    new Set(['greetings', 'food', 'emergency'])
  );

  const phrasesByCategory = CATEGORY_ORDER.reduce<Record<PhraseCategory, Phrase[]>>(
    (acc, cat) => {
      acc[cat] = pack.phrases.filter((p) => p.category === cat);
      return acc;
    },
    {} as Record<PhraseCategory, Phrase[]>,
  );

  const toggleCategory = (cat: PhraseCategory) => {
    Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
    setExpandedCategories((prev) => {
      const next = new Set(prev);
      if (next.has(cat)) next.delete(cat);
      else next.add(cat);
      return next;
    });
  };

  const nonEmptyCategories = CATEGORY_ORDER.filter(
    (cat) => (phrasesByCategory[cat]?.length ?? 0) > 0,
  );

  if (nonEmptyCategories.length === 0) return null;

  return (
    <View style={styles.container}>
      <Text style={styles.sectionTitle}>{t('usefulPhrases.title')}</Text>
      <Text style={styles.languageLabel}>
        {pack.language} {t('usefulPhrases.phrases')}
      </Text>

      {nonEmptyCategories.map((cat) => {
        const isExpanded = expandedCategories.has(cat);
        const phrases = phrasesByCategory[cat] ?? [];
        const ChevIcon = isExpanded ? ChevronUp : ChevronDown;

        return (
          <View key={cat} style={styles.categoryBlock}>
            <Pressable
              onPress={() => toggleCategory(cat)}
              style={({ pressed }) => [styles.categoryHeader, { opacity: pressed ? 0.7 : 1 }]}
            >
              <Text style={styles.categoryLabel}>
                {t(CATEGORY_I18N[cat], { defaultValue: CATEGORY_LABELS[cat] })}
              </Text>
              <View style={styles.categoryMeta}>
                <Text style={styles.categoryCount}>{phrases.length}</Text>
                <ChevIcon size={16} color={COLORS.creamMuted} strokeWidth={2} />
              </View>
            </Pressable>

            {isExpanded && (
              <View style={styles.phraseList}>
                {phrases.map((phrase, i) => (
                  <PhraseCard
                    key={`${cat}-${i}`}
                    phrase={phrase}
                    language={pack.language}
                  />
                ))}
              </View>
            )}
          </View>
        );
      })}
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    gap: SPACING.md,
  } as ViewStyle,
  sectionTitle: {
    fontFamily: FONTS.mono,
    fontSize: 11,
    color: COLORS.sage,
    letterSpacing: 1.5,
    textTransform: 'uppercase',
  } as TextStyle,
  languageLabel: {
    fontFamily: FONTS.bodySemiBold,
    fontSize: 16,
    color: COLORS.cream,
    marginBottom: SPACING.xs,
  } as TextStyle,
  categoryBlock: {
    backgroundColor: COLORS.bgGlass,
    borderRadius: RADIUS.lg,
    borderWidth: 1,
    borderColor: COLORS.border,
    overflow: 'hidden',
  } as ViewStyle,
  categoryHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    padding: SPACING.md,
  } as ViewStyle,
  categoryLabel: {
    fontFamily: FONTS.bodySemiBold,
    fontSize: 14,
    color: COLORS.cream,
  } as TextStyle,
  categoryMeta: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: SPACING.xs,
  } as ViewStyle,
  categoryCount: {
    fontFamily: FONTS.mono,
    fontSize: 11,
    color: COLORS.creamMuted,
  } as TextStyle,
  phraseList: {
    borderTopWidth: 1,
    borderTopColor: COLORS.border,
    paddingHorizontal: SPACING.md,
    paddingBottom: SPACING.sm,
  } as ViewStyle,
  phraseCard: {
    flexDirection: 'row',
    alignItems: 'flex-start',
    paddingVertical: SPACING.sm,
    borderBottomWidth: 1,
    borderBottomColor: COLORS.border,
    gap: SPACING.sm,
  } as ViewStyle,
  phraseContent: {
    flex: 1,
    gap: 2,
  } as ViewStyle,
  phraseEnglish: {
    fontFamily: FONTS.body,
    fontSize: 13,
    color: COLORS.creamMuted,
  } as TextStyle,
  phraseLocal: {
    fontFamily: FONTS.bodySemiBold,
    fontSize: 15,
    color: COLORS.cream,
  } as TextStyle,
  phrasePhonetic: {
    fontFamily: FONTS.mono,
    fontSize: 11,
    color: COLORS.sage,
  } as TextStyle,
  speakBtn: {
    padding: SPACING.xs,
    marginTop: 2,
  } as ViewStyle,
});
