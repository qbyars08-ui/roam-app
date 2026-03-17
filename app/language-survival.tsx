// =============================================================================
// ROAM — Language Survival AI
// 50 essential phrases, tap to hear, swipe categories, offline cached
// =============================================================================
import React, { useCallback, useEffect, useState } from 'react';
import {
  View,
  Text,
  ScrollView,
  Pressable,
  StyleSheet,
  type TextStyle,
  type ViewStyle,
} from 'react-native';
import { useRouter, useLocalSearchParams } from 'expo-router';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { useTranslation } from 'react-i18next';
import * as Haptics from '../lib/haptics';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { ChevronLeft, Volume2, Loader2 } from 'lucide-react-native';
import { LinearGradient } from 'expo-linear-gradient';
import { COLORS, FONTS, SPACING, RADIUS } from '../lib/constants';
import {
  DESTINATION_PACKS,
  getPackForCity,
  PHRASE_CATEGORIES,
  type Phrase,
  type PhraseCategory,
} from '../lib/language-data';
import { pronounce, SUPPORTED_TTS_LANGUAGES, type TTSLanguage } from '../lib/elevenlabs';

const STORAGE_KEY = '@roam/language-survival-cache';
const CATEGORY_ORDER: PhraseCategory[] = ['greetings', 'food', 'transport', 'shopping', 'emergency', 'nightlife'];

// Map pack langCode (e.g. ja-JP, es-ES) to voice-proxy TTS language
function toTTSLanguage(langCode: string): TTSLanguage {
  const code = langCode.split('-')[0]?.toLowerCase() ?? 'en';
  return SUPPORTED_TTS_LANGUAGES.includes(code as TTSLanguage) ? (code as TTSLanguage) : 'en';
}

// -----------------------------------------------------------------------------
// Phrase card — audio via voice-proxy (ElevenLabs TTS)
// -----------------------------------------------------------------------------
function PhraseCard({
  phrase,
  langCode,
  onPress,
}: {
  phrase: Phrase;
  langCode: string;
  onPress: () => void;
}) {
  const { t } = useTranslation();
  const [loading, setLoading] = useState(false);
  const ttsLang = toTTSLanguage(langCode);

  const playPhrase = useCallback(() => {
    Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
    onPress();
    setLoading(true);
    pronounce(phrase.local, ttsLang)
      .catch(() => '')
      // Voice-proxy unavailable — fail silently
      .finally(() => setLoading(false));
  }, [phrase.local, ttsLang, onPress]);

  return (
    <Pressable
      onPress={playPhrase}
      disabled={loading}
      style={({ pressed }) => [
        styles.phraseCard,
        { opacity: pressed ? 0.9 : 1 },
      ]}
    >
      <LinearGradient
        colors={[COLORS.bgGlass, COLORS.bgCard]}
        style={styles.phraseCardGradient}
      >
        <View style={styles.phraseCardContent}>
          <Text style={styles.phraseLocal}>{phrase.local}</Text>
          <Text style={styles.phrasePhonetic}>{phrase.phonetic}</Text>
          <Text style={styles.phraseEnglish}>{phrase.english}</Text>
          {phrase.atStop ? (
            <View style={styles.atStopBadge}>
              <Text style={styles.atStopText}>{t('languageSurvival.atStop', { defaultValue: 'At {{stop}}', stop: phrase.atStop })}</Text>
            </View>
          ) : null}
        </View>
        <View style={styles.speakBtn}>
          {loading ? (
            <Loader2 size={20} color={COLORS.gold} strokeWidth={1.5} />
          ) : (
            <Volume2 size={20} color={COLORS.gold} strokeWidth={1.5} />
          )}
        </View>
      </LinearGradient>
    </Pressable>
  );
}

// -----------------------------------------------------------------------------
// Main screen
// -----------------------------------------------------------------------------
function LanguageSurvivalScreen() {
  const { t } = useTranslation();
  const router = useRouter();
  const insets = useSafeAreaInsets();
  const params = useLocalSearchParams<{ city?: string; destination?: string }>();
  const initialCity = (params.city ?? params.destination ?? 'Tokyo') as string;
  const [selectedCity, setSelectedCity] = useState<string>(initialCity);

  useEffect(() => {
    const city = (params.city ?? params.destination) as string | undefined;
    if (city && getPackForCity(city)) {
      // eslint-disable-next-line react-hooks/set-state-in-effect -- sync derived state
      setSelectedCity(city);
    }
  }, [params.city, params.destination]);
  const [activeCategory, setActiveCategory] = useState<PhraseCategory | 'all'>('all');
  const [cachedCity, setCachedCity] = useState<string | null>(null);

  const pack = getPackForCity(selectedCity) ?? DESTINATION_PACKS[0];

  const filteredPhrases = activeCategory === 'all'
    ? pack.phrases
    : pack.phrases.filter((p) => p.category === activeCategory);

  // Cache to AsyncStorage when destination selected
  useEffect(() => {
    const cache = async () => {
      try {
        await AsyncStorage.setItem(STORAGE_KEY, JSON.stringify({
          city: selectedCity,
          pack: {
            city: pack.city,
            language: pack.language,
            langCode: pack.langCode,
            flag: pack.flag,
            phrases: pack.phrases,
          },
          cachedAt: Date.now(),
        }));
        setCachedCity(selectedCity);
      } catch { /* silent */ }
    };
    cache();
  }, [selectedCity, pack]);

  const handleBack = useCallback(() => {
    Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
    router.back();
  }, [router]);

  return (
    <View style={[styles.container, { paddingTop: insets.top }]}>
      {/* Header */}
      <View style={styles.header}>
        <Pressable onPress={handleBack} style={({ pressed }) => ({ opacity: pressed ? 0.7 : 1 })}>
          <ChevronLeft size={24} color={COLORS.cream} />
        </Pressable>
        <Text style={styles.headerTitle}>{t('languageSurvival.title', { defaultValue: 'Language Survival' })}</Text>
      </View>

      {/* City picker */}
      <ScrollView
        horizontal
        showsHorizontalScrollIndicator={false}
        style={styles.cityScroll}
        contentContainerStyle={styles.cityScrollContent}
      >
        {DESTINATION_PACKS.map((p) => {
          const isActive = selectedCity === p.city;
          return (
            <Pressable
              key={p.city}
              onPress={() => {
                Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
                setSelectedCity(p.city);
              }}
              style={[styles.cityChip, isActive && styles.cityChipActive]}
            >
              <Text style={styles.cityChipFlag}>{p.flag}</Text>
              <Text style={[styles.cityChipText, isActive && styles.cityChipTextActive]}>
                {p.city}
              </Text>
            </Pressable>
          );
        })}
      </ScrollView>

      {/* Pack info */}
      <View style={styles.packInfo}>
        <Text style={styles.packFlag}>{pack.flag}</Text>
        <View>
          <Text style={styles.packCity}>{pack.city}</Text>
          <Text style={styles.packLang}>{pack.language} · {pack.phrases.length} {t('languageSurvival.phrases', { defaultValue: 'phrases' })}</Text>
        </View>
        {cachedCity === selectedCity && (
          <Text style={styles.cachedBadge}>{t('languageSurvival.offline', { defaultValue: 'Offline' })}</Text>
        )}
      </View>

      {/* Category swiper */}
      <ScrollView
        horizontal
        showsHorizontalScrollIndicator={false}
        style={styles.catScroll}
        contentContainerStyle={styles.catScrollContent}
      >
        <Pressable
          onPress={() => setActiveCategory('all')}
          style={[styles.catChip, activeCategory === 'all' && styles.catChipActive]}
        >
          <Text style={[styles.catChipText, activeCategory === 'all' && styles.catChipTextActive]}>
            {t('languageSurvival.all', { defaultValue: 'All' })}
          </Text>
        </Pressable>
        {CATEGORY_ORDER.map((cat) => {
          const info = PHRASE_CATEGORIES[cat];
          const isActive = activeCategory === cat;
          return (
            <Pressable
              key={cat}
              onPress={() => {
                Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
                setActiveCategory(cat);
              }}
              style={[styles.catChip, isActive && styles.catChipActive]}
            >
              {info.emoji ? <Text style={styles.catEmoji}>{info.emoji}</Text> : null}
              <Text style={[styles.catChipText, isActive && styles.catChipTextActive]}>
                {info.label}
              </Text>
            </Pressable>
          );
        })}
      </ScrollView>

      {/* Phrase cards */}
      <ScrollView
        style={styles.phraseList}
        contentContainerStyle={styles.phraseListContent}
        showsVerticalScrollIndicator={false}
      >
        {filteredPhrases.map((phrase, i) => (
          <PhraseCard
            key={`${phrase.english}-${i}`}
            phrase={phrase}
            langCode={pack.langCode}
            onPress={() => {}}
          />
        ))}
        <View style={{ height: insets.bottom + SPACING.xl }} />
      </ScrollView>
    </View>
  );
}

// -----------------------------------------------------------------------------
// Styles
// -----------------------------------------------------------------------------
const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: COLORS.bg,
  } as ViewStyle,
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: SPACING.lg,
    paddingVertical: SPACING.md,
    gap: SPACING.sm,
  } as ViewStyle,
  headerTitle: {
    fontFamily: FONTS.header,
    fontSize: 22,
    color: COLORS.cream,
  } as TextStyle,
  cityScroll: {
    maxHeight: 52,
  } as ViewStyle,
  cityScrollContent: {
    paddingHorizontal: SPACING.lg,
    gap: SPACING.sm,
    paddingBottom: SPACING.sm,
  } as ViewStyle,
  cityChip: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: SPACING.md,
    paddingVertical: SPACING.sm,
    borderRadius: RADIUS.full,
    backgroundColor: COLORS.bgGlass,
    borderWidth: 1,
    borderColor: COLORS.border,
    gap: SPACING.xs,
  } as ViewStyle,
  cityChipActive: {
    backgroundColor: COLORS.sageHighlight,
    borderColor: COLORS.sage,
  } as ViewStyle,
  cityChipFlag: {
    fontSize: 18,
  } as TextStyle,
  cityChipText: {
    fontFamily: FONTS.bodyMedium,
    fontSize: 14,
    color: COLORS.creamMuted,
  } as TextStyle,
  cityChipTextActive: {
    color: COLORS.cream,
  } as TextStyle,
  packInfo: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: SPACING.lg,
    paddingVertical: SPACING.md,
    gap: SPACING.md,
  } as ViewStyle,
  packFlag: {
    fontSize: 36,
  } as TextStyle,
  packCity: {
    fontFamily: FONTS.headerMedium,
    fontSize: 20,
    color: COLORS.cream,
  } as TextStyle,
  packLang: {
    fontFamily: FONTS.body,
    fontSize: 13,
    color: COLORS.creamMuted,
    marginTop: 2,
  } as TextStyle,
  cachedBadge: {
    fontFamily: FONTS.bodyMedium,
    fontSize: 11,
    color: COLORS.sage,
    marginLeft: 'auto',
  } as TextStyle,
  catScroll: {
    maxHeight: 48,
  } as ViewStyle,
  catScrollContent: {
    paddingHorizontal: SPACING.lg,
    gap: SPACING.sm,
    paddingBottom: SPACING.md,
  } as ViewStyle,
  catChip: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: SPACING.sm,
    paddingVertical: SPACING.xs,
    borderRadius: RADIUS.md,
    backgroundColor: COLORS.bgGlass,
    borderWidth: 1,
    borderColor: COLORS.border,
    gap: 4,
  } as ViewStyle,
  catChipActive: {
    backgroundColor: COLORS.goldMutedLight,
    borderColor: COLORS.gold,
  } as ViewStyle,
  catEmoji: {
    fontSize: 14,
  } as TextStyle,
  catChipText: {
    fontFamily: FONTS.body,
    fontSize: 13,
    color: COLORS.creamMuted,
  } as TextStyle,
  catChipTextActive: {
    color: COLORS.gold,
    fontFamily: FONTS.bodyMedium,
  } as TextStyle,
  phraseList: {
    flex: 1,
  } as ViewStyle,
  phraseListContent: {
    paddingHorizontal: SPACING.lg,
    paddingBottom: SPACING.xl,
  } as ViewStyle,
  phraseCard: {
    marginBottom: SPACING.sm,
    borderRadius: RADIUS.lg,
    overflow: 'hidden',
    borderWidth: 1,
    borderColor: COLORS.border,
  } as ViewStyle,
  phraseCardGradient: {
    flexDirection: 'row',
    alignItems: 'center',
    padding: SPACING.md,
  } as ViewStyle,
  phraseCardContent: {
    flex: 1,
  } as ViewStyle,
  phraseLocal: {
    fontFamily: FONTS.bodySemiBold,
    fontSize: 18,
    color: COLORS.cream,
  } as TextStyle,
  phrasePhonetic: {
    fontFamily: FONTS.body,
    fontSize: 13,
    color: COLORS.creamMuted,
    marginTop: 4,
  } as TextStyle,
  phraseEnglish: {
    fontFamily: FONTS.body,
    fontSize: 14,
    color: COLORS.gold,
    marginTop: 4,
  } as TextStyle,
  atStopBadge: {
    marginTop: SPACING.sm,
    alignSelf: 'flex-start',
    backgroundColor: COLORS.sageMuted,
    paddingHorizontal: SPACING.sm,
    paddingVertical: 2,
    borderRadius: RADIUS.sm,
  } as ViewStyle,
  atStopText: {
    fontFamily: FONTS.mono,
    fontSize: 11,
    color: COLORS.sage,
  } as TextStyle,
  speakBtn: {
    width: 44,
    height: 44,
    borderRadius: RADIUS.full,
    backgroundColor: COLORS.goldSoft,
    alignItems: 'center',
    justifyContent: 'center',
  } as ViewStyle,
});

export default LanguageSurvivalScreen;
