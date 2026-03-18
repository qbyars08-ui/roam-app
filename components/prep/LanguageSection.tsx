// =============================================================================
// LanguageSection — survival phrases, pronunciation, language hub CTA
// =============================================================================
import React, { useCallback, useMemo } from 'react';
import { View, Text, Pressable, TouchableOpacity, StyleSheet, type ViewStyle, type TextStyle } from 'react-native';
import { useTranslation } from 'react-i18next';
import { useRouter } from 'expo-router';
import { Volume2 } from 'lucide-react-native';
import * as Haptics from '../../lib/haptics';
import { pronounce } from '../../lib/elevenlabs';
import { COLORS, FONTS, SPACING, RADIUS } from '../../lib/constants';
import type { LanguagePack, Phrase } from '../../lib/prep/language-data';
import { sharedStyles, SURVIVAL_PHRASE_KEYS } from './prep-shared';

// ---------------------------------------------------------------------------
// getSurvivalPhrases helper
// ---------------------------------------------------------------------------
function getSurvivalPhrases(pack: LanguagePack): Phrase[] {
  const result: Phrase[] = [];
  const keys = new Set(SURVIVAL_PHRASE_KEYS.map((k) => k.toLowerCase()));
  for (const phrase of pack.phrases) {
    const eng = phrase.english.toLowerCase();
    if (
      keys.has(eng) ||
      keys.has(eng.replace('!', '').replace('?', '').replace('...', '').trim())
    ) {
      if (!result.some((p) => p.english.toLowerCase() === phrase.english.toLowerCase())) {
        result.push(phrase);
      }
    }
  }
  const order = ['hello', 'thank you', 'help', 'where is', 'how much', 'i need a doctor'];
  result.sort((a, b) => {
    const ai = order.findIndex((o) => a.english.toLowerCase().includes(o));
    const bi = order.findIndex((o) => b.english.toLowerCase().includes(o));
    return (ai < 0 ? 99 : ai) - (bi < 0 ? 99 : bi);
  });
  return result.slice(0, 6);
}

// ---------------------------------------------------------------------------
// LanguageTab (6 survival phrases)
// ---------------------------------------------------------------------------
function LanguageTab({ pack }: { pack: LanguagePack }) {
  const { t } = useTranslation();
  const phrases = useMemo(() => getSurvivalPhrases(pack), [pack]);

  const langCode = useMemo(() => {
    const map: Record<string, string> = { Japanese: 'ja', Spanish: 'es', French: 'fr', German: 'de', Thai: 'th', Italian: 'it', Portuguese: 'pt', Arabic: 'ar', Hindi: 'hi', Mandarin: 'zh', Korean: 'ko' };
    return map[pack.language] ?? 'en';
  }, [pack.language]);

  const handlePlay = useCallback((phrase: Phrase) => {
    Haptics.selectionAsync();
    pronounce(phrase.local, langCode).catch(() => {});
  }, [langCode]);

  return (
    <View>
      <Text style={styles.languageTitle}>{t('prep.survivalPhrases', { defaultValue: 'Survival Phrases' })}</Text>
      <Text style={styles.languageSubtitle}>
        {pack.language}
        {pack.flag ? ` \u2022 ${pack.flag}` : ''}
      </Text>
      {phrases.map((phrase, i) => (
        <View key={i} style={styles.phraseCard}>
          <View style={styles.phraseCardBody}>
            <Text style={styles.phraseCardEnglish}>{phrase.english}</Text>
            <Text style={styles.phraseCardLocal}>{phrase.local}</Text>
            <Text style={styles.phraseCardPhonetic}>{phrase.phonetic}</Text>
          </View>
          <TouchableOpacity
            style={styles.phrasePlayBtn}
            onPress={() => handlePlay(phrase)}
            activeOpacity={0.7}
            accessibilityLabel={`Play pronunciation of ${phrase.english}`}
            accessibilityRole="button"
            accessibilityHint={`Plays audio for ${phrase.local}`}
          >
            <Volume2 size={18} color={COLORS.creamMuted} />
          </TouchableOpacity>
        </View>
      ))}
    </View>
  );
}

// ---------------------------------------------------------------------------
// Exported composite: LanguageSection
// ---------------------------------------------------------------------------
type Props = {
  langPack: LanguagePack | null;
  destination: string;
};

export default function LanguageSection({ langPack, destination }: Props) {
  const { t } = useTranslation();
  const router = useRouter();

  return (
    <View style={sharedStyles.tabContent}>
      <Pressable
        onPress={() => router.push('/language-hub' as never)}
        style={({ pressed }) => [styles.languageHubCta, { opacity: pressed ? 0.8 : 1 }]}
      >
        <Text style={styles.languageHubCtaText}>{t('prep.languageHub', { defaultValue: 'Language Hub' })}</Text>
        <Text style={styles.languageHubCtaSub}>{t('prep.languageHubSub', { defaultValue: 'Live translation, survival phrases, offline, medical card' })}</Text>
      </Pressable>
      {langPack ? (
        <LanguageTab pack={langPack} />
      ) : (
        <Text style={sharedStyles.noDataText}>
          {`Language pack not available for ${destination}. English may be widely spoken.`}
        </Text>
      )}
    </View>
  );
}

const styles = StyleSheet.create({
  languageHubCta: {
    backgroundColor: COLORS.sageSoft,
    borderRadius: RADIUS.md,
    borderWidth: 1,
    borderColor: COLORS.sageBorder,
    padding: SPACING.md,
    marginBottom: SPACING.lg,
  } as ViewStyle,
  languageHubCtaText: {
    fontFamily: FONTS.headerMedium,
    fontSize: 16,
    color: COLORS.sage,
  } as TextStyle,
  languageHubCtaSub: {
    fontFamily: FONTS.body,
    fontSize: 12,
    color: COLORS.creamMuted,
    marginTop: SPACING.xs,
  } as TextStyle,
  languageTitle: {
    fontFamily: FONTS.header,
    fontSize: 22,
    color: COLORS.cream,
    marginBottom: SPACING.xs,
  } as TextStyle,
  languageSubtitle: {
    fontFamily: FONTS.body,
    fontSize: 13,
    color: COLORS.creamMuted,
    marginBottom: SPACING.lg,
  } as TextStyle,
  phraseCard: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: COLORS.bgMagazine,
    borderRadius: RADIUS.lg,
    borderLeftWidth: 3,
    borderLeftColor: COLORS.sage,
    padding: SPACING.md,
    marginBottom: SPACING.sm,
  } as ViewStyle,
  phraseCardBody: {
    flex: 1,
  } as ViewStyle,
  phraseCardEnglish: {
    fontFamily: FONTS.body,
    fontSize: 14,
    color: COLORS.creamMuted,
    marginBottom: SPACING.xs,
  } as TextStyle,
  phraseCardLocal: {
    fontFamily: FONTS.mono,
    fontSize: 16,
    color: COLORS.cream,
    fontWeight: 'bold',
    marginBottom: SPACING.xs,
  } as TextStyle,
  phraseCardPhonetic: {
    fontFamily: FONTS.body,
    fontSize: 13,
    color: COLORS.sage,
  } as TextStyle,
  phrasePlayBtn: {
    padding: SPACING.sm,
    minWidth: 44,
    minHeight: 44,
    alignItems: 'center',
    justifyContent: 'center',
  } as ViewStyle,
});
