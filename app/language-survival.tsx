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
  Dimensions,
  type TextStyle,
  type ViewStyle,
} from 'react-native';
import { useRouter, useLocalSearchParams } from 'expo-router';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import * as Speech from 'expo-speech';
import * as Haptics from '../lib/haptics';
import { withComingSoon } from '../lib/with-coming-soon';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { ChevronLeft, Volume2 } from 'lucide-react-native';
import { LinearGradient } from 'expo-linear-gradient';
import { COLORS, FONTS, SPACING, RADIUS } from '../lib/constants';
import {
  DESTINATION_PACKS,
  getPackForCity,
  PHRASE_CATEGORIES,
  type DestinationPack,
  type Phrase,
  type PhraseCategory,
} from '../lib/language-data';

const STORAGE_KEY = '@roam/language-survival-cache';
const CATEGORY_ORDER: PhraseCategory[] = ['greetings', 'food', 'transport', 'shopping', 'emergency', 'nightlife'];

// -----------------------------------------------------------------------------
// Phrase card
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
  const speak = useCallback(() => {
    Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
    Speech.stop();
    Speech.speak(phrase.local, {
      language: langCode,
      rate: 0.85,
    });
    onPress();
  }, [phrase.local, langCode, onPress]);

  return (
    <Pressable
      onPress={speak}
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
              <Text style={styles.atStopText}>At {phrase.atStop}</Text>
            </View>
          ) : null}
        </View>
        <View style={styles.speakBtn}>
          <Volume2 size={20} color={COLORS.gold} strokeWidth={2} />
        </View>
      </LinearGradient>
    </Pressable>
  );
}

// -----------------------------------------------------------------------------
// Main screen
// -----------------------------------------------------------------------------
function LanguageSurvivalScreen() {
  const router = useRouter();
  const insets = useSafeAreaInsets();
  const params = useLocalSearchParams<{ city?: string; destination?: string }>();
  const initialCity = (params.city ?? params.destination ?? 'Tokyo') as string;
  const [selectedCity, setSelectedCity] = useState<string>(initialCity);

  useEffect(() => {
    const city = (params.city ?? params.destination) as string | undefined;
    if (city && getPackForCity(city)) setSelectedCity(city);
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
        <Text style={styles.headerTitle}>Language Survival</Text>
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
          <Text style={styles.packLang}>{pack.language} · {pack.phrases.length} phrases</Text>
        </View>
        {cachedCity === selectedCity && (
          <Text style={styles.cachedBadge}>Offline</Text>
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
            All
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
    backgroundColor: COLORS.sage + '25',
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
    backgroundColor: COLORS.gold + '20',
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
    marginTop: 8,
    alignSelf: 'flex-start',
    backgroundColor: COLORS.sage + '20',
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
    backgroundColor: COLORS.gold + '15',
    alignItems: 'center',
    justifyContent: 'center',
  } as ViewStyle,
});

export default withComingSoon(LanguageSurvivalScreen, { routeName: 'language-survival', title: 'Language Survival' });
