// =============================================================================
// ROAM — Translate Hub: Travel Communication Center
// Quick phrases, custom translation, show-driver card, cultural intel
// =============================================================================
import React, { useCallback, useMemo, useState } from 'react';
import {
  Pressable,
  ScrollView,
  StyleSheet,
  Text,
  TextInput,
  View,
} from 'react-native';
import { useLocalSearchParams, useRouter } from 'expo-router';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { useTranslation } from 'react-i18next';
import {
  ChevronLeft,
  Languages,
  Search,
  Volume2,
  Car,
  AlertTriangle,
  ShoppingBag,
  UtensilsCrossed,
  MapPin,
  MessageCircle,
  Hash,
  ThumbsUp,
  ThumbsDown,
  X,
} from 'lucide-react-native';
import { COLORS, FONTS, SPACING, RADIUS } from '../lib/constants';
import {
  useSmartTranslate,
  getShowDriverCard,
  type TranslationResult,
  type TranslationContext,
} from '../lib/smart-translate';
import { getPhrasesForDestination } from '../lib/survival-phrases';
import { pronounce } from '../lib/elevenlabs';
import { impactAsync, ImpactFeedbackStyle } from '../lib/haptics';
import PhraseCard from '../components/features/PhraseCard';
import SonarCard from '../components/ui/SonarCard';
import { useSonarQuery } from '../lib/sonar';
import { SkeletonCard } from '../components/premium/LoadingStates';

// ---------------------------------------------------------------------------
// Category tabs
// ---------------------------------------------------------------------------
const CATEGORIES = [
  { id: 'essentials', label: 'Essentials', icon: MessageCircle },
  { id: 'food', label: 'Food', icon: UtensilsCrossed },
  { id: 'directions', label: 'Directions', icon: MapPin },
  { id: 'shopping', label: 'Shopping', icon: ShoppingBag },
  { id: 'emergency', label: 'Emergency', icon: AlertTriangle },
  { id: 'social', label: 'Social', icon: ThumbsUp },
] as const;

type CategoryId = (typeof CATEGORIES)[number]['id'];

// ---------------------------------------------------------------------------
// Bargaining phrases (hardcoded for offline)
// ---------------------------------------------------------------------------
const BARGAIN_KEYS = [
  { english: 'How much?', key: 'howMuch' },
  { english: 'Too expensive', key: 'tooExpensive' },
  { english: 'Best price?', key: 'bestPrice' },
  { english: "I'll take it", key: 'takingIt' },
] as const;

// ---------------------------------------------------------------------------
// Component
// ---------------------------------------------------------------------------
export default function TranslateHub() {
  const { destination = '', hotel = '', hotelAddress = '' } =
    useLocalSearchParams<{
      destination: string;
      hotel?: string;
      hotelAddress?: string;
    }>();
  const router = useRouter();
  const insets = useSafeAreaInsets();
  const { t } = useTranslation();

  const [activeCategory, setActiveCategory] = useState<CategoryId>('essentials');
  const [customText, setCustomText] = useState('');
  const [customResult, setCustomResult] = useState<TranslationResult | null>(null);
  const [translating, setTranslating] = useState(false);
  const [showDriverModal, setShowDriverModal] = useState(false);

  const {
    phrases,
    culturalNotes,
    numbersGuide,
    isLoading,
    translate,
    speakPhrase,
  } = useSmartTranslate(destination);

  // Local survival phrases for quick grid
  const localPhrases = useMemo(() => {
    const { phrases: survivalPhrases, language } = getPhrasesForDestination(destination);
    return { survivalPhrases, language };
  }, [destination]);

  // Filter phrases by category
  const filteredPhrases = useMemo(() => {
    const categoryMap: Record<CategoryId, ReadonlyArray<string>> = {
      essentials: ['greeting', 'courtesy'],
      food: ['food'],
      directions: ['directions', 'transport'],
      shopping: ['money'],
      emergency: ['emergency'],
      social: ['greeting', 'courtesy'],
    };
    const cats = categoryMap[activeCategory] ?? ['greeting'];
    return localPhrases.survivalPhrases.filter((p) =>
      cats.some((c) => p.category.includes(c))
    );
  }, [localPhrases.survivalPhrases, activeCategory]);

  // Quick phrase grid (first 12)
  const quickPhrases = useMemo(() => {
    return localPhrases.survivalPhrases.slice(0, 12);
  }, [localPhrases.survivalPhrases]);

  // Cultural intel via Sonar
  const culturalQuery = useSonarQuery(destination, 'local');

  const handleTranslate = useCallback(async () => {
    if (!customText.trim() || translating) return;
    impactAsync(ImpactFeedbackStyle.Medium);
    setTranslating(true);
    try {
      const contextMap: Record<CategoryId, TranslationContext> = {
        essentials: 'general',
        food: 'ordering_food',
        directions: 'asking_directions',
        shopping: 'shopping',
        emergency: 'emergency',
        social: 'small_talk',
      };
      const result = await translate(
        customText.trim(),
        contextMap[activeCategory] ?? 'general'
      );
      setCustomResult(result);
    } catch {
      // Fail silently for translation
    } finally {
      setTranslating(false);
    }
  }, [customText, translating, translate, activeCategory]);

  const handleSpeakCustom = useCallback(async () => {
    if (!customResult?.translated) return;
    impactAsync(ImpactFeedbackStyle.Light);
    try {
      await pronounce(customResult.translated, localPhrases.language);
    } catch {
      // Non-critical
    }
  }, [customResult, localPhrases.language]);

  const driverCard = useMemo(() => {
    if (!hotel && !hotelAddress) return null;
    return getShowDriverCard(
      hotel || 'My Hotel',
      hotelAddress || destination,
      destination
    );
  }, [hotel, hotelAddress, destination]);

  // ---------------------------------------------------------------------------
  // Render
  // ---------------------------------------------------------------------------
  return (
    <View style={[styles.container, { paddingTop: insets.top }]}>
      {/* Header */}
      <View style={styles.header}>
        <Pressable
          onPress={() => router.back()}
          hitSlop={12}
          style={styles.backBtn}
        >
          <ChevronLeft size={24} color={COLORS.cream} strokeWidth={1.5} />
        </Pressable>
        <View style={styles.headerCenter}>
          <Languages size={20} color={COLORS.sage} strokeWidth={1.5} />
          <Text style={styles.headerTitle}>
            {t('translateHub.heroTitle', {
              defaultValue: `Speak ${localPhrases.language}. Sort of.`,
            })}
          </Text>
        </View>
        <View style={{ width: 24 }} />
      </View>

      <ScrollView
        contentContainerStyle={[styles.scroll, { paddingBottom: insets.bottom + 24 }]}
        showsVerticalScrollIndicator={false}
        keyboardShouldPersistTaps="handled"
      >
        {/* Category tabs */}
        <ScrollView
          horizontal
          showsHorizontalScrollIndicator={false}
          contentContainerStyle={styles.tabRow}
        >
          {CATEGORIES.map((cat) => {
            const active = activeCategory === cat.id;
            const Icon = cat.icon;
            return (
              <Pressable
                key={cat.id}
                onPress={() => {
                  impactAsync(ImpactFeedbackStyle.Light);
                  setActiveCategory(cat.id);
                }}
                style={[styles.tab, active && styles.tabActive]}
              >
                <Icon
                  size={14}
                  color={active ? COLORS.cream : COLORS.muted}
                  strokeWidth={1.5}
                />
                <Text style={[styles.tabText, active && styles.tabTextActive]}>
                  {cat.label}
                </Text>
              </Pressable>
            );
          })}
        </ScrollView>

        {/* Quick phrase grid */}
        <Text style={styles.sectionLabel}>
          {t('translateHub.quickPhrases', { defaultValue: 'QUICK PHRASES' })}
        </Text>
        {isLoading && quickPhrases.length === 0 ? (
          <SkeletonCard />
        ) : (
          <View style={styles.phraseGrid}>
            {(activeCategory === 'essentials' ? quickPhrases : filteredPhrases)
              .slice(0, 12)
              .map((phrase, idx) => (
                <View key={phrase.id ?? idx} style={styles.phraseGridItem}>
                  <PhraseCard
                    english={phrase.original}
                    local={phrase.translation}
                    transliteration={phrase.phonetic}
                    language={localPhrases.language}
                  />
                </View>
              ))}
          </View>
        )}

        {/* Custom translate input */}
        <Text style={styles.sectionLabel}>
          {t('translateHub.customTranslate', { defaultValue: 'TRANSLATE ANYTHING' })}
        </Text>
        <View style={styles.inputRow}>
          <TextInput
            style={styles.input}
            placeholder={t('translateHub.placeholder', {
              defaultValue: 'Type anything to translate...',
            })}
            placeholderTextColor={COLORS.muted}
            value={customText}
            onChangeText={setCustomText}
            returnKeyType="search"
            onSubmitEditing={handleTranslate}
          />
          <Pressable
            onPress={handleTranslate}
            style={[styles.translateBtn, translating && { opacity: 0.5 }]}
            disabled={translating}
          >
            <Search size={18} color={COLORS.bg} strokeWidth={2} />
          </Pressable>
        </View>

        {/* Custom result */}
        {customResult ? (
          <View style={styles.resultCard}>
            <Text style={styles.resultOriginal}>{customResult.original}</Text>
            <Pressable onPress={handleSpeakCustom} style={styles.resultMainRow}>
              <Text style={styles.resultTranslated}>
                {customResult.translated}
              </Text>
              <Volume2
                size={18}
                color={COLORS.sage}
                strokeWidth={1.5}
              />
            </Pressable>
            {customResult.transliteration ? (
              <Text style={styles.resultTransliteration}>
                {customResult.transliteration}
              </Text>
            ) : null}
            {customResult.context ? (
              <Text style={styles.resultContext}>{customResult.context}</Text>
            ) : null}
            {customResult.formalVsInformal !== 'neutral' ? (
              <View style={styles.formalBadge}>
                <Text style={styles.formalBadgeText}>
                  {customResult.formalVsInformal}
                </Text>
              </View>
            ) : null}
          </View>
        ) : null}

        {/* Show driver card */}
        {driverCard ? (
          <>
            <Text style={styles.sectionLabel}>
              {t('translateHub.showDriver', { defaultValue: 'SHOW YOUR DRIVER' })}
            </Text>
            <Pressable
              onPress={() => {
                impactAsync(ImpactFeedbackStyle.Medium);
                setShowDriverModal(true);
              }}
              style={styles.driverPreview}
            >
              <Car size={20} color={COLORS.gold} strokeWidth={1.5} />
              <View style={styles.driverPreviewText}>
                <Text style={styles.driverLabel}>
                  {t('translateHub.tapToShow', {
                    defaultValue: 'Tap to show full-screen card for taxi driver',
                  })}
                </Text>
                <Text style={styles.driverHotel} numberOfLines={1}>
                  {driverCard.hotelName}
                </Text>
              </View>
              <ChevronLeft
                size={16}
                color={COLORS.muted}
                strokeWidth={1.5}
                style={{ transform: [{ rotate: '180deg' }] }}
              />
            </Pressable>
          </>
        ) : null}

        {/* Numbers guide */}
        {numbersGuide && numbersGuide.numbers.length > 0 ? (
          <>
            <Text style={styles.sectionLabel}>
              {t('translateHub.numbersTitle', { defaultValue: 'NUMBERS & MONEY' })}
            </Text>
            <View style={styles.numbersGrid}>
              {numbersGuide.numbers.slice(0, 12).map((n) => (
                <Pressable
                  key={n.value}
                  onPress={() => {
                    impactAsync(ImpactFeedbackStyle.Light);
                    pronounce(n.local, localPhrases.language).catch(() => {});
                  }}
                  style={styles.numberCell}
                >
                  <Text style={styles.numberValue}>{n.value}</Text>
                  <Text style={styles.numberLocal}>{n.local}</Text>
                  <Text style={styles.numberPronunciation}>{n.pronunciation}</Text>
                </Pressable>
              ))}
            </View>
            {numbersGuide.currencyTip ? (
              <Text style={styles.currencyTip}>{numbersGuide.currencyTip}</Text>
            ) : null}
          </>
        ) : null}

        {/* Bargaining phrases */}
        <Text style={styles.sectionLabel}>
          {t('translateHub.bargaining', { defaultValue: 'BARGAINING' })}
        </Text>
        <View style={styles.bargainRow}>
          {BARGAIN_KEYS.map((item) => {
            const match = localPhrases.survivalPhrases.find(
              (p) =>
                p.original.toLowerCase().includes(item.english.toLowerCase()) ||
                p.original.toLowerCase().includes('how much')
            );
            if (!match) return null;
            return (
              <View key={item.key} style={styles.bargainItem}>
                <PhraseCard
                  english={item.english}
                  local={match.translation}
                  transliteration={match.phonetic}
                  language={localPhrases.language}
                />
              </View>
            );
          })}
        </View>

        {/* Cultural intel */}
        {culturalNotes.length > 0 ? (
          <>
            <Text style={styles.sectionLabel}>
              {t('translateHub.culturalIntel', { defaultValue: 'CULTURAL INTEL' })}
            </Text>
            <View style={styles.culturalCard}>
              {culturalNotes.map((note, idx) => (
                <View key={idx} style={styles.culturalRow}>
                  {note.doOrDont === 'do' ? (
                    <ThumbsUp size={14} color={COLORS.sage} strokeWidth={1.5} />
                  ) : (
                    <ThumbsDown size={14} color={COLORS.coral} strokeWidth={1.5} />
                  )}
                  <Text style={styles.culturalText}>{note.text}</Text>
                </View>
              ))}
            </View>
          </>
        ) : culturalQuery.data ? (
          <SonarCard
            title={t('translateHub.culturalCardTitle', {
              defaultValue: `Cultural tips for ${destination}`,
            })}
            answer={culturalQuery.data.answer}
            citations={culturalQuery.citations}
            isLive={culturalQuery.isLive}
          />
        ) : null}
      </ScrollView>

      {/* Full-screen driver card modal */}
      {showDriverModal && driverCard ? (
        <View style={styles.driverModal}>
          <Pressable
            onPress={() => setShowDriverModal(false)}
            style={styles.driverClose}
            hitSlop={16}
          >
            <X size={28} color={COLORS.cream} strokeWidth={1.5} />
          </Pressable>
          <View style={styles.driverContent}>
            <Text style={styles.driverHotelName}>{driverCard.hotelName}</Text>
            <Text style={styles.driverAddress}>{driverCard.hotelAddress}</Text>
            <View style={styles.driverDivider} />
            <Text style={styles.driverLocalScript}>
              {driverCard.localScript}
            </Text>
          </View>
          <Text style={styles.driverFooter}>
            {t('translateHub.showThisToDriver', {
              defaultValue: 'Show this to your driver',
            })}
          </Text>
        </View>
      ) : null}
    </View>
  );
}

// ---------------------------------------------------------------------------
// Styles
// ---------------------------------------------------------------------------
const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: COLORS.bg,
  },
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: SPACING.md,
    paddingVertical: SPACING.sm + 4,
    gap: SPACING.sm,
  },
  backBtn: {
    width: 32,
    height: 32,
    alignItems: 'center',
    justifyContent: 'center',
  },
  headerCenter: {
    flex: 1,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: SPACING.sm,
  },
  headerTitle: {
    fontFamily: FONTS.header,
    fontSize: 18,
    color: COLORS.cream,
  },
  scroll: {
    paddingHorizontal: SPACING.md,
    gap: SPACING.md,
  },
  tabRow: {
    flexDirection: 'row',
    gap: SPACING.sm,
    paddingVertical: SPACING.xs,
  },
  tab: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
    paddingHorizontal: 14,
    paddingVertical: 8,
    borderRadius: RADIUS.pill,
    backgroundColor: COLORS.surface1,
    borderWidth: 1,
    borderColor: COLORS.border,
  },
  tabActive: {
    backgroundColor: COLORS.sage,
    borderColor: COLORS.sage,
  },
  tabText: {
    fontFamily: FONTS.bodyMedium,
    fontSize: 13,
    color: COLORS.muted,
  },
  tabTextActive: {
    color: COLORS.bg,
  },
  sectionLabel: {
    fontFamily: FONTS.mono,
    fontSize: 11,
    color: COLORS.muted,
    letterSpacing: 1,
    marginTop: SPACING.sm,
  },
  phraseGrid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: SPACING.sm,
  },
  phraseGridItem: {
    width: '31%',
    flexGrow: 1,
    minWidth: 100,
  },
  inputRow: {
    flexDirection: 'row',
    gap: SPACING.sm,
    alignItems: 'center',
  },
  input: {
    flex: 1,
    backgroundColor: COLORS.surface1,
    borderRadius: RADIUS.md,
    borderWidth: 1,
    borderColor: COLORS.border,
    paddingHorizontal: SPACING.md,
    paddingVertical: 12,
    fontFamily: FONTS.body,
    fontSize: 15,
    color: COLORS.cream,
  },
  translateBtn: {
    width: 44,
    height: 44,
    borderRadius: RADIUS.pill,
    backgroundColor: COLORS.sage,
    alignItems: 'center',
    justifyContent: 'center',
  },
  resultCard: {
    backgroundColor: COLORS.surface1,
    borderRadius: RADIUS.md,
    borderWidth: 1,
    borderColor: COLORS.sageBorder,
    padding: SPACING.md,
    gap: 6,
  },
  resultOriginal: {
    fontFamily: FONTS.body,
    fontSize: 13,
    color: COLORS.muted,
  },
  resultMainRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: SPACING.sm,
  },
  resultTranslated: {
    flex: 1,
    fontFamily: FONTS.header,
    fontSize: 22,
    color: COLORS.cream,
  },
  resultTransliteration: {
    fontFamily: FONTS.mono,
    fontSize: 13,
    color: COLORS.sage,
  },
  resultContext: {
    fontFamily: FONTS.body,
    fontSize: 12,
    color: COLORS.creamMuted,
    fontStyle: 'italic',
  },
  formalBadge: {
    alignSelf: 'flex-start',
    backgroundColor: COLORS.sageVeryFaint,
    borderRadius: RADIUS.sm,
    paddingHorizontal: 8,
    paddingVertical: 3,
    marginTop: 2,
  },
  formalBadgeText: {
    fontFamily: FONTS.mono,
    fontSize: 10,
    color: COLORS.sage,
    textTransform: 'uppercase',
    letterSpacing: 0.5,
  },
  driverPreview: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: COLORS.surface1,
    borderRadius: RADIUS.md,
    borderWidth: 1,
    borderColor: COLORS.goldBorder,
    padding: SPACING.md,
    gap: SPACING.sm,
  },
  driverPreviewText: {
    flex: 1,
  },
  driverLabel: {
    fontFamily: FONTS.body,
    fontSize: 13,
    color: COLORS.creamMuted,
  },
  driverHotel: {
    fontFamily: FONTS.bodyMedium,
    fontSize: 15,
    color: COLORS.cream,
    marginTop: 2,
  },
  numbersGrid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: SPACING.sm,
  },
  numberCell: {
    backgroundColor: COLORS.surface1,
    borderRadius: RADIUS.sm,
    borderWidth: 1,
    borderColor: COLORS.border,
    paddingHorizontal: 10,
    paddingVertical: 8,
    alignItems: 'center',
    minWidth: 64,
  },
  numberValue: {
    fontFamily: FONTS.mono,
    fontSize: 12,
    color: COLORS.muted,
  },
  numberLocal: {
    fontFamily: FONTS.header,
    fontSize: 16,
    color: COLORS.cream,
    marginTop: 2,
  },
  numberPronunciation: {
    fontFamily: FONTS.mono,
    fontSize: 10,
    color: COLORS.sage,
    marginTop: 1,
  },
  currencyTip: {
    fontFamily: FONTS.body,
    fontSize: 12,
    color: COLORS.creamMuted,
    fontStyle: 'italic',
    paddingHorizontal: SPACING.xs,
  },
  bargainRow: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: SPACING.sm,
  },
  bargainItem: {
    width: '48%',
    flexGrow: 1,
  },
  culturalCard: {
    backgroundColor: COLORS.surface1,
    borderRadius: RADIUS.md,
    borderWidth: 1,
    borderColor: COLORS.border,
    padding: SPACING.md,
    gap: SPACING.sm,
  },
  culturalRow: {
    flexDirection: 'row',
    alignItems: 'flex-start',
    gap: SPACING.sm,
  },
  culturalText: {
    flex: 1,
    fontFamily: FONTS.body,
    fontSize: 14,
    color: COLORS.cream,
    lineHeight: 20,
  },
  // Driver modal (full-screen)
  driverModal: {
    ...StyleSheet.absoluteFillObject,
    backgroundColor: COLORS.black,
    justifyContent: 'center',
    alignItems: 'center',
    padding: SPACING.xl,
    zIndex: 100,
  },
  driverClose: {
    position: 'absolute',
    top: 60,
    right: 24,
  },
  driverContent: {
    alignItems: 'center',
    gap: SPACING.md,
  },
  driverHotelName: {
    fontFamily: FONTS.header,
    fontSize: 32,
    color: COLORS.cream,
    textAlign: 'center',
  },
  driverAddress: {
    fontFamily: FONTS.body,
    fontSize: 20,
    color: COLORS.creamBright,
    textAlign: 'center',
    lineHeight: 28,
  },
  driverDivider: {
    width: 60,
    height: 1,
    backgroundColor: COLORS.muted,
    marginVertical: SPACING.md,
  },
  driverLocalScript: {
    fontFamily: FONTS.header,
    fontSize: 36,
    color: COLORS.cream,
    textAlign: 'center',
    lineHeight: 48,
  },
  driverFooter: {
    position: 'absolute',
    bottom: 60,
    fontFamily: FONTS.mono,
    fontSize: 12,
    color: COLORS.muted,
    letterSpacing: 1,
    textTransform: 'uppercase',
  },
});
