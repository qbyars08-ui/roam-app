// =============================================================================
// ROAM — Language Hub
// Live translation, survival phrases (6 categories), offline download, medical card
// =============================================================================
import React, { useCallback, useEffect, useMemo, useState } from 'react';
import {
  View,
  Text,
  TextInput,
  Pressable,
  ScrollView,
  StyleSheet,
  Modal,
  ActivityIndicator,
  type ViewStyle,
  type TextStyle,
} from 'react-native';
import { useRouter } from 'expo-router';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { useTranslation } from 'react-i18next';
import AsyncStorage from '@react-native-async-storage/async-storage';
import {
  ChevronLeft,
  Languages,
  Volume2,
  Maximize2,
  Download,
  Check,
  Heart,
  UtensilsCrossed,
  ShieldAlert,
  Bus,
  Wallet,
  Hash,
} from 'lucide-react-native';
import * as Haptics from '../lib/haptics';
import { COLORS, FONTS, SPACING, RADIUS } from '../lib/constants';
import { translateText } from '../lib/translate';
import { narrateText } from '../lib/elevenlabs';
import { getPhrasesForLanguage, type SurvivalPhrase, type PhraseCategory, PHRASE_LANGUAGES } from '../lib/survival-phrases';

const SURVIVAL_OFFLINE_KEY = '@roam/language_hub_phrases_downloaded';
const SURVIVAL_PHRASES_OFFLINE_KEY = '@roam/language_hub_phrases_data';
const LANG_HUB_CATEGORIES: { id: string; labelKey: string; icon: typeof Bus }[] = [
  { id: 'getting_around', labelKey: 'languageHub.gettingAround', icon: Bus },
  { id: 'food', labelKey: 'languageHub.eating', icon: UtensilsCrossed },
  { id: 'emergency', labelKey: 'languageHub.emergency', icon: ShieldAlert },
  { id: 'cultural', labelKey: 'languageHub.cultural', icon: Heart },
  { id: 'money', labelKey: 'languageHub.shopping', icon: Wallet },
  { id: 'numbers', labelKey: 'languageHub.numbers', icon: Hash },
];

function mapCategoryToPhrases(cat: string): PhraseCategory[] {
  if (cat === 'getting_around') return ['transport', 'directions'];
  if (cat === 'cultural') return ['greeting', 'courtesy'];
  if (cat === 'numbers') return [];
  return [cat as PhraseCategory];
}

export default function LanguageHubScreen() {
  const router = useRouter();
  const insets = useSafeAreaInsets();
  const { t } = useTranslation();
  const [inputText, setInputText] = useState('');
  const [targetLang, setTargetLang] = useState('es');
  const [translation, setTranslation] = useState<string | null>(null);
  const [phonetic, setPhonetic] = useState<string | null>(null);
  const [translating, setTranslating] = useState(false);
  const [showToLocals, setShowToLocals] = useState(false);
  const [downloaded, setDownloaded] = useState(false);
  const [playingAudio, setPlayingAudio] = useState(false);

  const phrases = useMemo(() => getPhrasesForLanguage(targetLang), [targetLang]);

  useEffect(() => {
    AsyncStorage.getItem(SURVIVAL_OFFLINE_KEY).then((v) => setDownloaded(v === '1'));
  }, []);

  const handleTranslate = useCallback(async () => {
    const text = inputText.trim();
    if (!text) return;
    Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
    setTranslating(true);
    setTranslation(null);
    setPhonetic(null);
    try {
      const result = await translateText({ text, targetLanguage: targetLang });
      if (result) {
        setTranslation(result.translation);
        setPhonetic(null);
      }
    } finally {
      setTranslating(false);
    }
  }, [inputText, targetLang]);

  const handlePlayTranslation = useCallback(async () => {
    const text = translation || inputText.trim();
    if (!text) return;
    Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
    setPlayingAudio(true);
    try {
      await narrateText(text, { language: targetLang });
    } catch {
      // ignore
    } finally {
      setPlayingAudio(false);
    }
  }, [translation, inputText, targetLang]);

  const handleDownloadOffline = useCallback(async () => {
    Haptics.notificationAsync(Haptics.NotificationFeedbackType.Success);
    await AsyncStorage.setItem(SURVIVAL_OFFLINE_KEY, '1');
    await AsyncStorage.setItem(SURVIVAL_PHRASES_OFFLINE_KEY, JSON.stringify({ lang: targetLang, phrases }));
    setDownloaded(true);
  }, [targetLang, phrases]);

  const filteredPhrasesByCategory = useMemo(() => {
    const byCat: Record<string, SurvivalPhrase[]> = {};
    for (const c of LANG_HUB_CATEGORIES) {
      if (c.id === 'numbers') {
        byCat[c.id] = [];
        continue;
      }
      const cats = mapCategoryToPhrases(c.id);
      byCat[c.id] = phrases.filter((p) => cats.includes(p.category));
    }
    return byCat;
  }, [phrases]);

  return (
    <View style={[styles.container, { paddingTop: insets.top }]}>
      <View style={styles.header}>
        <Pressable onPress={() => router.back()} style={styles.backBtn}>
          <ChevronLeft size={24} color={COLORS.cream} />
        </Pressable>
        <Text style={styles.headerTitle}>{t('languageHub.title', { defaultValue: 'Language Hub' })}</Text>
        <View style={styles.backBtn} />
      </View>

      <ScrollView
        style={styles.scroll}
        contentContainerStyle={[styles.scrollContent, { paddingBottom: insets.bottom + 40 }]}
        showsVerticalScrollIndicator={false}
      >
        {/* Live translation */}
        <View style={styles.card}>
          <View style={styles.cardHeader}>
            <Languages size={20} color={COLORS.sage} strokeWidth={1.5} />
            <Text style={styles.cardTitle}>{t('languageHub.liveTranslation', { defaultValue: 'Live translation' })}</Text>
          </View>
          <TextInput
            style={styles.input}
            placeholder={t('languageHub.typePhrase', { defaultValue: 'Type any phrase...' })}
            placeholderTextColor={COLORS.creamMuted}
            value={inputText}
            onChangeText={setInputText}
          />
          <View style={styles.langRow}>
            {PHRASE_LANGUAGES.slice(0, 4).map((lang) => (
              <Pressable
                key={lang.code}
                onPress={() => { setTargetLang(lang.code); setTranslation(null); }}
                style={[styles.langChip, targetLang === lang.code && styles.langChipActive]}
              >
                <Text style={[styles.langChipText, targetLang === lang.code && styles.langChipTextActive]}>{lang.label}</Text>
              </Pressable>
            ))}
          </View>
          <Pressable style={styles.translateBtn} onPress={handleTranslate} disabled={translating || !inputText.trim()}>
            {translating ? <ActivityIndicator size="small" color={COLORS.bg} /> : <Text style={styles.translateBtnText}>{t('languageHub.translate', { defaultValue: 'Translate' })}</Text>}
          </Pressable>
          {translation && (
            <View style={styles.result}>
              <Text style={styles.translationText}>{translation}</Text>
              {phonetic ? <Text style={styles.phoneticText}>{phonetic}</Text> : null}
              <View style={styles.resultActions}>
                <Pressable style={styles.audioBtn} onPress={handlePlayTranslation} disabled={playingAudio}>
                  <Volume2 size={18} color={COLORS.cream} strokeWidth={1.5} />
                  <Text style={styles.audioBtnText}>{t('languageHub.hear', { defaultValue: 'Hear' })}</Text>
                </Pressable>
                <Pressable style={styles.showLocalsBtn} onPress={() => { Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light); setShowToLocals(true); }}>
                  <Maximize2 size={18} color={COLORS.cream} strokeWidth={1.5} />
                  <Text style={styles.showLocalsBtnText}>{t('languageHub.showToLocals', { defaultValue: 'Show to locals' })}</Text>
                </Pressable>
              </View>
            </View>
          )}
        </View>

        {/* Survival phrases — 6 categories */}
        <View style={styles.card}>
          <View style={styles.cardHeader}>
            <Text style={styles.cardTitle}>{t('languageHub.survivalPhrases', { defaultValue: 'Survival phrases' })}</Text>
            {downloaded && (
              <View style={styles.downloadedBadge}>
                <Check size={14} color={COLORS.sage} strokeWidth={1.5} />
                <Text style={styles.downloadedText}>{t('languageHub.downloaded', { defaultValue: 'Downloaded' })}</Text>
              </View>
            )}
          </View>
          {!downloaded && (
            <Pressable style={styles.downloadBtn} onPress={handleDownloadOffline}>
              <Download size={18} color={COLORS.sage} strokeWidth={1.5} />
              <Text style={styles.downloadBtnText}>{t('languageHub.downloadOffline', { defaultValue: 'Download for offline' })}</Text>
            </Pressable>
          )}
          {LANG_HUB_CATEGORIES.map((cat) => {
            const list = filteredPhrasesByCategory[cat.id] ?? [];
            if (list.length === 0 && cat.id !== 'numbers') return null;
            const Icon = cat.icon;
            return (
              <View key={cat.id} style={styles.phraseSection}>
                <View style={styles.phraseSectionHeader}>
                  <Icon size={16} color={COLORS.gold} strokeWidth={1.5} />
                  <Text style={styles.phraseSectionTitle}>{t(cat.labelKey, { defaultValue: cat.id })}</Text>
                </View>
                {cat.id === 'numbers' ? (
                  <Text style={styles.phraseMuted}>{t('languageHub.numbersHint', { defaultValue: 'Numbers 1–10, 100, 1000 in local language — use live translation above.' })}</Text>
                ) : (
                  list.slice(0, 6).map((p) => (
                    <View key={p.id} style={styles.phraseRow}>
                      <View style={{ flex: 1 }}>
                        <Text style={styles.phraseOriginal}>{p.original}</Text>
                        <Text style={styles.phraseTranslation}>{p.translation}</Text>
                        <Text style={styles.phrasePhonetic}>{p.phonetic}</Text>
                      </View>
                      <Pressable
                        style={styles.phrasePlay}
                        onPress={async () => {
                          Haptics.selectionAsync();
                          try { await narrateText(p.translation, { language: targetLang }); } catch { /* ignore */ }
                        }}
                      >
                        <Volume2 size={16} color={COLORS.creamMuted} strokeWidth={1.5} />
                      </Pressable>
                    </View>
                  ))
                )}
              </View>
            );
          })}
        </View>

        {/* Medical card — local only, Show doctors */}
        <View style={styles.card}>
          <Text style={styles.cardTitle}>{t('languageHub.medicalCard', { defaultValue: 'Medical card' })}</Text>
          <Text style={styles.medicalSub}>{t('languageHub.medicalSub', { defaultValue: 'Blood type, allergies, medications in local language. Stored on device only.' })}</Text>
          <Pressable style={styles.medicalBtn} onPress={() => router.push('/emergency-card')}>
            <Text style={styles.medicalBtnText}>{t('languageHub.showDoctors', { defaultValue: 'Show doctors' })}</Text>
          </Pressable>
        </View>
      </ScrollView>

      {/* Show to locals — full screen black, translation white 72px */}
      <Modal visible={showToLocals} transparent animationType="fade">
        <Pressable style={styles.fullScreenOverlay} onPress={() => setShowToLocals(false)}>
          <Text style={styles.fullScreenText}>{translation ?? ''}</Text>
        </Pressable>
      </Modal>
    </View>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: COLORS.bg } as ViewStyle,
  header: { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', paddingHorizontal: SPACING.lg, paddingVertical: SPACING.md } as ViewStyle,
  backBtn: { width: 40, height: 40, alignItems: 'center', justifyContent: 'center' } as ViewStyle,
  headerTitle: { fontFamily: FONTS.header, fontSize: 28, color: COLORS.cream } as TextStyle,
  scroll: { flex: 1 } as ViewStyle,
  scrollContent: { paddingHorizontal: SPACING.lg, gap: SPACING.lg } as ViewStyle,
  card: { backgroundColor: COLORS.bgGlass, borderRadius: RADIUS.lg, borderWidth: 1, borderColor: COLORS.border, padding: SPACING.lg } as ViewStyle,
  cardHeader: { flexDirection: 'row', alignItems: 'center', gap: SPACING.sm, marginBottom: SPACING.md } as ViewStyle,
  cardTitle: { fontFamily: FONTS.headerMedium, fontSize: 18, color: COLORS.cream } as TextStyle,
  input: { height: 48, backgroundColor: COLORS.bgCard, borderRadius: RADIUS.md, borderWidth: 1, borderColor: COLORS.border, paddingHorizontal: SPACING.md, fontFamily: FONTS.body, fontSize: 16, color: COLORS.cream, marginBottom: SPACING.sm } as TextStyle,
  langRow: { flexDirection: 'row', flexWrap: 'wrap', gap: SPACING.sm, marginBottom: SPACING.md } as ViewStyle,
  langChip: { paddingHorizontal: SPACING.md, paddingVertical: SPACING.xs, borderRadius: RADIUS.pill, borderWidth: 1, borderColor: COLORS.border } as ViewStyle,
  langChipActive: { borderColor: COLORS.sage, backgroundColor: COLORS.sageSoft } as ViewStyle,
  langChipText: { fontFamily: FONTS.mono, fontSize: 12, color: COLORS.creamMuted } as TextStyle,
  langChipTextActive: { color: COLORS.sage } as TextStyle,
  translateBtn: { backgroundColor: COLORS.sage, borderRadius: RADIUS.pill, paddingVertical: SPACING.sm, alignItems: 'center', marginBottom: SPACING.sm } as ViewStyle,
  translateBtnText: { fontFamily: FONTS.mono, fontSize: 12, color: COLORS.bg } as TextStyle,
  result: { marginTop: SPACING.sm, paddingTop: SPACING.sm, borderTopWidth: 1, borderTopColor: COLORS.border } as ViewStyle,
  translationText: { fontFamily: FONTS.bodyMedium, fontSize: 18, color: COLORS.cream, marginBottom: SPACING.xs } as TextStyle,
  phoneticText: { fontFamily: FONTS.mono, fontSize: 13, color: COLORS.creamMuted, marginBottom: SPACING.sm } as TextStyle,
  resultActions: { flexDirection: 'row', gap: SPACING.md } as ViewStyle,
  audioBtn: { flexDirection: 'row', alignItems: 'center', gap: SPACING.xs } as ViewStyle,
  audioBtnText: { fontFamily: FONTS.mono, fontSize: 12, color: COLORS.cream } as TextStyle,
  showLocalsBtn: { flexDirection: 'row', alignItems: 'center', gap: SPACING.xs } as ViewStyle,
  showLocalsBtnText: { fontFamily: FONTS.mono, fontSize: 12, color: COLORS.cream } as TextStyle,
  downloadedBadge: { flexDirection: 'row', alignItems: 'center', gap: SPACING.xs, backgroundColor: COLORS.sageSoft, paddingHorizontal: SPACING.sm, paddingVertical: SPACING.xs, borderRadius: RADIUS.pill } as ViewStyle,
  downloadedText: { fontFamily: FONTS.mono, fontSize: 10, color: COLORS.sage } as TextStyle,
  downloadBtn: { flexDirection: 'row', alignItems: 'center', gap: SPACING.sm, marginBottom: SPACING.md } as ViewStyle,
  downloadBtnText: { fontFamily: FONTS.mono, fontSize: 12, color: COLORS.sage } as TextStyle,
  phraseSection: { marginBottom: SPACING.lg } as ViewStyle,
  phraseSectionHeader: { flexDirection: 'row', alignItems: 'center', gap: SPACING.sm, marginBottom: SPACING.sm } as ViewStyle,
  phraseSectionTitle: { fontFamily: FONTS.bodyMedium, fontSize: 14, color: COLORS.cream } as TextStyle,
  phraseMuted: { fontFamily: FONTS.body, fontSize: 13, color: COLORS.creamMuted } as TextStyle,
  phraseRow: { flexDirection: 'row', alignItems: 'center', paddingVertical: SPACING.sm, borderBottomWidth: 1, borderBottomColor: COLORS.border } as ViewStyle,
  phraseOriginal: { fontFamily: FONTS.body, fontSize: 14, color: COLORS.creamDim } as TextStyle,
  phraseTranslation: { fontFamily: FONTS.bodyMedium, fontSize: 15, color: COLORS.cream } as TextStyle,
  phrasePhonetic: { fontFamily: FONTS.mono, fontSize: 11, color: COLORS.creamMuted } as TextStyle,
  phrasePlay: { padding: SPACING.sm } as ViewStyle,
  medicalSub: { fontFamily: FONTS.body, fontSize: 13, color: COLORS.creamMuted, marginBottom: SPACING.md } as TextStyle,
  medicalBtn: { backgroundColor: COLORS.sageMuted, borderRadius: RADIUS.pill, paddingVertical: SPACING.sm, alignItems: 'center' } as ViewStyle,
  medicalBtnText: { fontFamily: FONTS.mono, fontSize: 12, color: COLORS.sage } as TextStyle,
  fullScreenOverlay: { flex: 1, backgroundColor: COLORS.black, justifyContent: 'center', alignItems: 'center', padding: SPACING.xl } as ViewStyle,
  fullScreenText: { fontSize: 72, color: COLORS.white, fontFamily: FONTS.bodyMedium, textAlign: 'center' } as TextStyle,
});
