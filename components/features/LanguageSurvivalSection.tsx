// =============================================================================
// ROAM — Language Survival (essential phrases)
// Phonetics + categories, tap for TTS
// =============================================================================
import React, { useCallback, useState } from 'react';
import { View, Text, Pressable, StyleSheet } from 'react-native';
import { Languages, Volume2 } from 'lucide-react-native';
import { COLORS, FONTS, SPACING, RADIUS } from '../../lib/constants';
import { getPhrasesForDestination, type Phrase } from '../../lib/language-survival';
import { pronounce } from '../../lib/elevenlabs';
import { impactAsync, ImpactFeedbackStyle } from '../../lib/haptics';

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
  const [speakingIdx, setSpeakingIdx] = useState<number | null>(null);
  const phrases = getPhrasesForDestination(destination);
  const preview = phrases.slice(0, 4);
  const rest = phrases.slice(4);

  const speak = useCallback(async (phrase: Phrase, index: number) => {
    impactAsync(ImpactFeedbackStyle.Light);
    setSpeakingIdx(index);
    try {
      await pronounce(phrase.native);
    } catch {
      // Non-critical — fail silently
    } finally {
      setSpeakingIdx(null);
    }
  }, []);

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
            onPress={() => speak(p, i)}
            accessibilityLabel={`Hear ${p.english} in ${destination} language`}
            style={({ pressed }) => [styles.row, { opacity: pressed ? 0.9 : 1, minHeight: 44 }]}
          >
            <View style={styles.phraseRow}>
              <View style={styles.phraseWrap}>
                <Text style={styles.native}>{p.native}</Text>
                <Text style={styles.phonetic}>{p.phonetic}</Text>
                <Text style={styles.english}>{p.english}</Text>
              </View>
              <Volume2
                size={16}
                color={speakingIdx === i ? COLORS.gold : COLORS.creamMuted}
                strokeWidth={2}
              />
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
  phraseRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: SPACING.sm,
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
