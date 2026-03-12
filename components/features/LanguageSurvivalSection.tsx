// =============================================================================
// ROAM — Language Survival (essential phrases)
// Phonetics + categories, tap for TTS
// =============================================================================
import React, { useState } from 'react';
import { View, Text, Pressable, StyleSheet } from 'react-native';
import * as Speech from 'expo-speech';
import { Languages } from 'lucide-react-native';
import { COLORS, FONTS, SPACING, RADIUS } from '../../lib/constants';
import { getPhrasesForDestination, type Phrase } from '../../lib/language-survival';

interface LanguageSurvivalSectionProps {
  destination: string;
}

const CATEGORY_LABELS: Record<string, string> = {
  greetings: 'Greetings',
  ordering: 'Ordering food',
  food: 'Food & drink',
  directions: 'Getting around',
  transport: 'Transport',
  emergency: 'Emergency',
  shopping: 'Shopping',
  social: 'Social',
};

export default function LanguageSurvivalSection({ destination }: LanguageSurvivalSectionProps) {
  const [expanded, setExpanded] = useState(false);
  const phrases = getPhrasesForDestination(destination);
  const preview = phrases.slice(0, 4);
  const rest = phrases.slice(4);

  const speak = (phrase: Phrase) => {
    Speech.speak(phrase.native, {
      language: destination.toLowerCase().includes('japan') ? 'ja-JP' : 'en-US',
      rate: 0.7,
    });
  };

  const list = expanded ? phrases : preview;

  return (
    <View style={styles.wrap}>
      <Pressable
        onPress={() => setExpanded((e) => !e)}
        style={({ pressed }) => [styles.header, { opacity: pressed ? 0.9 : 1 }]}
      >
        <Languages size={20} color={COLORS.gold} strokeWidth={2} />
        <Text style={styles.headerText}>
          Essential phrases for {destination}
        </Text>
        <Text style={styles.toggle}>{expanded ? '−' : '+'}</Text>
      </Pressable>
      <View style={styles.list}>
        {list.map((p, i) => (
          <Pressable
            key={i}
            onPress={() => speak(p)}
            style={({ pressed }) => [styles.row, { opacity: pressed ? 0.9 : 1 }]}
          >
            <View style={styles.phraseWrap}>
              <Text style={styles.native}>{p.native}</Text>
              <Text style={styles.phonetic}>{p.phonetic}</Text>
              <Text style={styles.english}>{p.english}</Text>
            </View>
          </Pressable>
        ))}
      </View>
      {!expanded && rest.length > 0 && (
        <Text style={styles.more}>Tap to see {rest.length} more phrases</Text>
      )}
    </View>
  );
}

const styles = StyleSheet.create({
  wrap: {
    backgroundColor: COLORS.bgGlass,
    borderRadius: RADIUS.lg,
    borderWidth: 1,
    borderColor: COLORS.border,
    overflow: 'hidden',
  },
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    padding: SPACING.md,
    gap: SPACING.sm,
  },
  headerText: {
    flex: 1,
    fontFamily: FONTS.bodySemiBold,
    fontSize: 15,
    color: COLORS.cream,
  },
  toggle: {
    fontFamily: FONTS.bodySemiBold,
    fontSize: 18,
    color: COLORS.creamMuted,
  },
  list: { paddingHorizontal: SPACING.md, paddingBottom: SPACING.sm },
  row: {
    paddingVertical: SPACING.sm,
    borderTopWidth: 1,
    borderTopColor: COLORS.border,
  },
  phraseWrap: { flex: 1 },
  native: {
    fontFamily: FONTS.bodySemiBold,
    fontSize: 16,
    color: COLORS.cream,
  },
  phonetic: {
    fontFamily: FONTS.body,
    fontSize: 12,
    color: COLORS.creamMuted,
    marginTop: 2,
  },
  english: {
    fontFamily: FONTS.body,
    fontSize: 13,
    color: COLORS.creamMuted,
    marginTop: 2,
  },
  more: {
    fontFamily: FONTS.body,
    fontSize: 12,
    color: COLORS.creamMuted,
    padding: SPACING.sm,
    textAlign: 'center',
  },
});
