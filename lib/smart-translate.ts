// =============================================================================
// ROAM — Smart Translation & Travel Communication Engine
// Contextual, travel-specific translation powered by Sonar + ElevenLabs
// =============================================================================

import { useState, useEffect, useCallback, useRef } from 'react';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { fetchSonarResult } from './sonar';
import { pronounce } from './elevenlabs';
import { getPhrasesForDestination } from './survival-phrases';
import { DESTINATIONS, HIDDEN_DESTINATIONS } from './constants';
import type { SonarQueryType } from './types/sonar';

// ---------------------------------------------------------------------------
// Storage key
// ---------------------------------------------------------------------------
const CACHE_PREFIX = '@roam/smart-translate/';

// ---------------------------------------------------------------------------
// Types
// ---------------------------------------------------------------------------

export interface TranslationResult {
  readonly original: string;
  readonly translated: string;
  readonly transliteration: string;
  readonly pronunciation: string;
  readonly audioReady: boolean;
  readonly context: string;
  readonly formalVsInformal: 'formal' | 'informal' | 'neutral';
}

export type TranslationContext =
  | 'ordering_food'
  | 'asking_directions'
  | 'emergency'
  | 'small_talk'
  | 'shopping'
  | 'transport'
  | 'hotel'
  | 'general';

export type PhraseCategory =
  | 'greetings'
  | 'food'
  | 'directions'
  | 'shopping'
  | 'emergency'
  | 'compliments'
  | 'apologies';

export interface EssentialPhrase {
  readonly english: string;
  readonly local: string;
  readonly transliteration: string;
  readonly formalVsInformal: 'formal' | 'informal' | 'neutral';
}

export interface CulturalNote {
  readonly doOrDont: 'do' | 'dont';
  readonly text: string;
}

export interface ShowDriverCard {
  readonly hotelName: string;
  readonly hotelAddress: string;
  readonly localScript: string;
  readonly destination: string;
}

export interface NumbersGuide {
  readonly numbers: ReadonlyArray<{ readonly value: number; readonly local: string; readonly pronunciation: string }>;
  readonly currencyTip: string;
}

// ---------------------------------------------------------------------------
// Helpers
// ---------------------------------------------------------------------------

function getLanguageForDestination(destination: string): string {
  const all = [...DESTINATIONS, ...HIDDEN_DESTINATIONS];
  const match = all.find(
    (d) => d.label.toLowerCase() === destination.toLowerCase()
  );
  if (!match) return 'the local language';
  const langs = match.languages;
  return langs.length > 0 ? langs[0] : 'the local language';
}

function buildCacheKey(destination: string, key: string): string {
  return CACHE_PREFIX + destination.toLowerCase().replace(/\s+/g, '_') + '/' + key;
}

async function getCachedJSON<T>(key: string): Promise<T | null> {
  try {
    const raw = await AsyncStorage.getItem(key);
    if (!raw) return null;
    const parsed = JSON.parse(raw) as { data: T; cachedAt: number };
    const SIX_HOURS = 6 * 60 * 60 * 1000;
    if (Date.now() - parsed.cachedAt > SIX_HOURS) return null;
    return parsed.data;
  } catch {
    return null;
  }
}

async function setCachedJSON<T>(key: string, data: T): Promise<void> {
  try {
    await AsyncStorage.setItem(key, JSON.stringify({ data, cachedAt: Date.now() }));
  } catch {
    // Cache is best-effort
  }
}

function parseSonarTranslation(answer: string): TranslationResult {
  const lines = answer.split('\n').filter((l) => l.trim());
  let translated = '';
  let transliteration = '';
  let pronunciation = '';
  let context = '';
  let formalVsInformal: 'formal' | 'informal' | 'neutral' = 'neutral';

  for (const line of lines) {
    const lower = line.toLowerCase();
    if (lower.includes('translation:') || lower.includes('translated:')) {
      translated = line.split(':').slice(1).join(':').trim().replace(/[*"]/g, '');
    } else if (lower.includes('pronunciation:') || lower.includes('phonetic:')) {
      pronunciation = line.split(':').slice(1).join(':').trim().replace(/[*"]/g, '');
    } else if (lower.includes('transliteration:') || lower.includes('romanization:')) {
      transliteration = line.split(':').slice(1).join(':').trim().replace(/[*"]/g, '');
    } else if (lower.includes('formal') && lower.includes('informal')) {
      if (lower.includes('use formal') || lower.includes('formal is')) {
        formalVsInformal = 'formal';
      } else if (lower.includes('use informal') || lower.includes('informal is')) {
        formalVsInformal = 'informal';
      }
    } else if (lower.includes('cultural') || lower.includes('note:') || lower.includes('context:') || lower.includes('tip:')) {
      context = line.split(':').slice(1).join(':').trim().replace(/[*"]/g, '');
    }
  }

  if (!translated && lines.length > 0) {
    translated = lines[0].replace(/[*"]/g, '').trim();
  }
  if (!transliteration) {
    transliteration = pronunciation;
  }

  return {
    original: '',
    translated,
    transliteration,
    pronunciation,
    audioReady: translated.length > 0,
    context,
    formalVsInformal,
  };
}

// ---------------------------------------------------------------------------
// Core functions
// ---------------------------------------------------------------------------

export async function translateForTravel(
  text: string,
  fromLang: string,
  toLang: string,
  context: TranslationContext = 'general'
): Promise<TranslationResult> {
  const cacheKey = buildCacheKey(toLang, `translate_${text}_${context}`);
  const cached = await getCachedJSON<TranslationResult>(cacheKey);
  if (cached) return cached;

  const contextLabel = context.replace(/_/g, ' ');
  const result = await fetchSonarResult(toLang, 'local' as SonarQueryType, {
    dates: `Translate '${text}' to ${toLang} for a traveler. Include: the translation, pronunciation guide, whether to use formal or informal, cultural note if relevant. Context: ${contextLabel}`,
  });

  const parsed = parseSonarTranslation(result.answer);
  const translationResult: TranslationResult = {
    ...parsed,
    original: text,
  };

  await setCachedJSON(cacheKey, translationResult);
  return translationResult;
}

export async function getEssentialPhrases(
  destination: string,
  category: PhraseCategory
): Promise<ReadonlyArray<EssentialPhrase>> {
  const cacheKey = buildCacheKey(destination, `phrases_${category}`);
  const cached = await getCachedJSON<ReadonlyArray<EssentialPhrase>>(cacheKey);
  if (cached) return cached;

  const language = getLanguageForDestination(destination);
  const result = await fetchSonarResult(destination, 'local' as SonarQueryType, {
    dates: `Give me 6 essential ${category} phrases a traveler needs in ${destination} (${language}). For each phrase provide: English, local language, transliteration/pronunciation, and whether formal or informal is appropriate. Format each as: English | Local | Pronunciation | Formal/Informal`,
  });

  const phrases: EssentialPhrase[] = result.answer
    .split('\n')
    .filter((l) => l.includes('|'))
    .slice(0, 8)
    .map((line) => {
      const parts = line.split('|').map((p) => p.trim().replace(/[*"]/g, ''));
      const formalRaw = (parts[3] ?? '').toLowerCase();
      const formalVsInformal: 'formal' | 'informal' | 'neutral' =
        formalRaw.includes('formal') && !formalRaw.includes('informal')
          ? 'formal'
          : formalRaw.includes('informal')
            ? 'informal'
            : 'neutral';
      return {
        english: parts[0] ?? '',
        local: parts[1] ?? '',
        transliteration: parts[2] ?? '',
        formalVsInformal,
      };
    })
    .filter((p) => p.english.length > 0 && p.local.length > 0);

  await setCachedJSON(cacheKey, phrases);
  return phrases;
}

export async function getMenuTranslation(
  menuItems: ReadonlyArray<string>,
  language: string
): Promise<ReadonlyArray<{ readonly item: string; readonly translation: string; readonly description: string }>> {
  const items = menuItems.slice(0, 10);
  const result = await fetchSonarResult(language, 'food' as SonarQueryType, {
    dates: `Translate these menu items to English with brief descriptions. Language: ${language}. Items: ${items.join(', ')}. Format: Item | English | Short description`,
  });

  return result.answer
    .split('\n')
    .filter((l) => l.includes('|'))
    .map((line) => {
      const parts = line.split('|').map((p) => p.trim().replace(/[*"]/g, ''));
      return {
        item: parts[0] ?? '',
        translation: parts[1] ?? '',
        description: parts[2] ?? '',
      };
    })
    .filter((p) => p.item.length > 0);
}

export async function getCulturalDosAndDonts(
  destination: string
): Promise<ReadonlyArray<CulturalNote>> {
  const cacheKey = buildCacheKey(destination, 'cultural_notes');
  const cached = await getCachedJSON<ReadonlyArray<CulturalNote>>(cacheKey);
  if (cached) return cached;

  const result = await fetchSonarResult(destination, 'local' as SonarQueryType, {
    dates: `What are the specific cultural mistakes tourists make in ${destination}? Not generic advice - specific gestures, words, behaviors that offend locals. Give 6 items, format each as DO: or DONT: followed by the tip.`,
  });

  const notes: CulturalNote[] = result.answer
    .split('\n')
    .filter((l) => l.trim().length > 0)
    .map((line) => {
      const cleaned = line.replace(/^[-*\d.)\s]+/, '').trim();
      if (cleaned.toUpperCase().startsWith('DO:') || cleaned.toUpperCase().startsWith("DO :")) {
        return { doOrDont: 'do' as const, text: cleaned.replace(/^DO\s*:\s*/i, '') };
      }
      if (cleaned.toUpperCase().startsWith("DON'T:") || cleaned.toUpperCase().startsWith("DONT:") || cleaned.toUpperCase().startsWith("DON'T :")) {
        return { doOrDont: 'dont' as const, text: cleaned.replace(/^DON'?T\s*:\s*/i, '') };
      }
      return null;
    })
    .filter((n): n is CulturalNote => n !== null)
    .slice(0, 8);

  await setCachedJSON(cacheKey, notes);
  return notes;
}

export async function getNumbersAndMoney(
  destination: string
): Promise<NumbersGuide> {
  const cacheKey = buildCacheKey(destination, 'numbers_money');
  const cached = await getCachedJSON<NumbersGuide>(cacheKey);
  if (cached) return cached;

  const language = getLanguageForDestination(destination);
  const result = await fetchSonarResult(destination, 'local' as SonarQueryType, {
    dates: `How to say numbers 1-10, 100, 1000 in ${language} (for ${destination}). Format: Number | Local | Pronunciation. Also include one tip about bargaining or handling money.`,
  });

  const lines = result.answer.split('\n').filter((l) => l.trim());
  const numbers = lines
    .filter((l) => l.includes('|'))
    .map((line) => {
      const parts = line.split('|').map((p) => p.trim().replace(/[*"]/g, ''));
      return {
        value: parseInt(parts[0] ?? '0', 10) || 0,
        local: parts[1] ?? '',
        pronunciation: parts[2] ?? '',
      };
    })
    .filter((n) => n.value > 0 && n.local.length > 0);

  const tipLine = lines.find(
    (l) => !l.includes('|') && l.length > 20
  );
  const currencyTip = tipLine?.replace(/^[-*\d.)\s]+/, '').trim() ?? '';

  const guide: NumbersGuide = { numbers, currencyTip };
  await setCachedJSON(cacheKey, guide);
  return guide;
}

export function getShowDriverCard(
  hotelName: string,
  hotelAddress: string,
  destination: string
): ShowDriverCard {
  const language = getLanguageForDestination(destination);
  return {
    hotelName,
    hotelAddress,
    localScript: `${hotelName}\n${hotelAddress}\n\n(${language})`,
    destination,
  };
}

// ---------------------------------------------------------------------------
// React hook
// ---------------------------------------------------------------------------

interface UseSmartTranslateResult {
  readonly phrases: ReadonlyArray<EssentialPhrase>;
  readonly culturalNotes: ReadonlyArray<CulturalNote>;
  readonly numbersGuide: NumbersGuide | null;
  readonly isLoading: boolean;
  readonly error: string | null;
  readonly translate: (text: string, context?: TranslationContext) => Promise<TranslationResult>;
  readonly speakPhrase: (text: string) => Promise<void>;
}

export function useSmartTranslate(destination: string | undefined): UseSmartTranslateResult {
  const [phrases, setPhrases] = useState<ReadonlyArray<EssentialPhrase>>([]);
  const [culturalNotes, setCulturalNotes] = useState<ReadonlyArray<CulturalNote>>([]);
  const [numbersGuide, setNumbersGuide] = useState<NumbersGuide | null>(null);
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const mountedRef = useRef(true);

  useEffect(() => {
    mountedRef.current = true;
    return () => { mountedRef.current = false; };
  }, []);

  useEffect(() => {
    if (!destination) return;

    let cancelled = false;
    setIsLoading(true);
    setError(null);

    // Load survival phrases from local data first (instant)
    const local = getPhrasesForDestination(destination);
    if (local.phrases.length > 0 && mountedRef.current) {
      setPhrases(
        local.phrases.slice(0, 12).map((p) => ({
          english: p.original,
          local: p.translation,
          transliteration: p.phonetic,
          formalVsInformal: 'neutral' as const,
        }))
      );
    }

    // Then enrich with Sonar data in parallel
    Promise.allSettled([
      getEssentialPhrases(destination, 'greetings'),
      getCulturalDosAndDonts(destination),
      getNumbersAndMoney(destination),
    ])
      .then((results) => {
        if (cancelled || !mountedRef.current) return;

        if (results[0].status === 'fulfilled' && results[0].value.length > 0) {
          setPhrases(results[0].value);
        }
        if (results[1].status === 'fulfilled') {
          setCulturalNotes(results[1].value);
        }
        if (results[2].status === 'fulfilled') {
          setNumbersGuide(results[2].value);
        }

        setIsLoading(false);
      })
      .catch(() => {
        if (!cancelled && mountedRef.current) {
          setError('Failed to load translation data');
          setIsLoading(false);
        }
      });

    return () => { cancelled = true; };
  }, [destination]);

  const translate = useCallback(
    async (text: string, context: TranslationContext = 'general'): Promise<TranslationResult> => {
      if (!destination) {
        throw new Error('No destination set');
      }
      const language = getLanguageForDestination(destination);
      return translateForTravel(text, 'English', language, context);
    },
    [destination]
  );

  const speakPhrase = useCallback(async (text: string): Promise<void> => {
    if (!destination) return;
    const { language } = getPhrasesForDestination(destination);
    await pronounce(text, language);
  }, [destination]);

  return {
    phrases,
    culturalNotes,
    numbersGuide,
    isLoading,
    error,
    translate,
    speakPhrase,
  };
}
