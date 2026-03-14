// =============================================================================
// ROAM — i18n configuration
// Uses i18next + react-i18next + expo-localization
// =============================================================================
import i18n from 'i18next';
import { initReactI18next } from 'react-i18next';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { getLocales } from 'expo-localization';
import 'intl-pluralrules';

import en from './locales/en';
import es from './locales/es';
import fr from './locales/fr';
import ja from './locales/ja';

// ---------------------------------------------------------------------------
// Supported locales
// ---------------------------------------------------------------------------
export const SUPPORTED_LANGUAGES = [
  { code: 'en', label: 'English', nativeLabel: 'English' },
  { code: 'es', label: 'Spanish', nativeLabel: 'Espa\u00f1ol' },
  { code: 'fr', label: 'French', nativeLabel: 'Fran\u00e7ais' },
  { code: 'ja', label: 'Japanese', nativeLabel: '\u65E5\u672C\u8A9E' },
] as const;

export type SupportedLanguage = typeof SUPPORTED_LANGUAGES[number]['code'];

const LOCALE_STORAGE_KEY = '@roam/locale';

// ---------------------------------------------------------------------------
// Detect device language (fall back to 'en')
// ---------------------------------------------------------------------------
function getDeviceLanguage(): SupportedLanguage {
  try {
    const locales = getLocales();
    if (locales.length > 0) {
      const deviceLang = locales[0].languageCode;
      if (deviceLang && SUPPORTED_LANGUAGES.some((l) => l.code === deviceLang)) {
        return deviceLang as SupportedLanguage;
      }
    }
  } catch {}
  return 'en';
}

// ---------------------------------------------------------------------------
// Persist / restore user language choice
// ---------------------------------------------------------------------------
export async function getPersistedLocale(): Promise<SupportedLanguage | null> {
  try {
    const stored = await AsyncStorage.getItem(LOCALE_STORAGE_KEY);
    if (stored && SUPPORTED_LANGUAGES.some((l) => l.code === stored)) {
      return stored as SupportedLanguage;
    }
  } catch {}
  return null;
}

export async function persistLocale(locale: SupportedLanguage): Promise<void> {
  try {
    await AsyncStorage.setItem(LOCALE_STORAGE_KEY, locale);
  } catch {}
}

// ---------------------------------------------------------------------------
// Change language at runtime
// ---------------------------------------------------------------------------
export async function changeLanguage(locale: SupportedLanguage): Promise<void> {
  await i18n.changeLanguage(locale);
  await persistLocale(locale);
}

// ---------------------------------------------------------------------------
// Initialize i18next
// ---------------------------------------------------------------------------
async function initI18n() {
  const persisted = await getPersistedLocale();
  const lng = persisted ?? getDeviceLanguage();

  await i18n.use(initReactI18next).init({
    resources: {
      en: { translation: en },
      es: { translation: es },
      fr: { translation: fr },
      ja: { translation: ja },
    },
    lng,
    fallbackLng: 'en',
    interpolation: {
      escapeValue: false,
    },
    react: {
      useSuspense: false,
    },
    compatibilityJSON: 'v4',
  });
}

// Run init immediately (non-blocking; components will re-render when ready)
const i18nPromise = initI18n();

export { i18nPromise };
export default i18n;
