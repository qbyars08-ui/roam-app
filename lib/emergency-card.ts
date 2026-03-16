// =============================================================================
// ROAM — Emergency Medical Card Data Layer
// On-device storage for critical health info, with multilingual translations
// =============================================================================
import AsyncStorage from '@react-native-async-storage/async-storage';

// -----------------------------------------------------------------------------
// Types
// -----------------------------------------------------------------------------
export type BloodType =
  | 'A+'
  | 'A-'
  | 'B+'
  | 'B-'
  | 'AB+'
  | 'AB-'
  | 'O+'
  | 'O-'
  | 'unknown';

export interface EmergencyCardData {
  readonly fullName: string;
  readonly bloodType: BloodType;
  readonly allergies: readonly string[];
  readonly medications: readonly string[];
  readonly conditions: readonly string[];
  readonly emergencyContact: {
    readonly name: string;
    readonly phone: string;
    readonly relationship: string;
  };
  readonly insuranceProvider: string;
  readonly insuranceNumber: string;
  readonly nationality: string;
  readonly passportNumber: string;
}

// -----------------------------------------------------------------------------
// Constants
// -----------------------------------------------------------------------------
export const BLOOD_TYPES: readonly BloodType[] = [
  'A+',
  'A-',
  'B+',
  'B-',
  'AB+',
  'AB-',
  'O+',
  'O-',
  'unknown',
];

const STORAGE_KEY = 'roam_emergency_card';

// -----------------------------------------------------------------------------
// Medical translations for key phrases in major languages
// -----------------------------------------------------------------------------
export const MEDICAL_TRANSLATIONS: Record<string, Record<string, string>> = {
  'I am allergic to': {
    es: 'Soy al\u00e9rgico/a a',
    fr: 'Je suis allergique \u00e0',
    ja: '\u30a2\u30ec\u30eb\u30ae\u30fc\u304c\u3042\u308a\u307e\u3059',
    zh: '\u6211\u5bf9...\u8fc7\u654f',
    th: '\u0e09\u0e31\u0e19\u0e41\u0e1e\u0e49',
    ko: '\uc800\ub294...\uc5d0 \uc54c\ub808\ub974\uae30\uac00 \uc788\uc2b5\ub2c8\ub2e4',
    de: 'Ich bin allergisch gegen',
    it: 'Sono allergico/a a',
    pt: 'Sou al\u00e9rgico/a a',
    ar: '\u0644\u062f\u064a \u062d\u0633\u0627\u0633\u064a\u0629 \u0645\u0646',
  },
  'My blood type is': {
    es: 'Mi tipo de sangre es',
    fr: 'Mon groupe sanguin est',
    ja: '\u8840\u6db2\u578b\u306f',
    zh: '\u6211\u7684\u8840\u578b\u662f',
    th: '\u0e01\u0e23\u0e38\u0e4a\u0e1b\u0e40\u0e25\u0e37\u0e2d\u0e14\u0e02\u0e2d\u0e07\u0e09\u0e31\u0e19',
    ko: '\uc81c \ud608\uc561\ud615\uc740',
    de: 'Meine Blutgruppe ist',
    it: 'Il mio gruppo sanguigno \u00e8',
    pt: 'Meu tipo sangu\u00edneo \u00e9',
    ar: '\u0641\u0635\u064a\u0644\u0629 \u062f\u0645\u064a',
  },
  'I take this medication': {
    es: 'Tomo este medicamento',
    fr: 'Je prends ce m\u00e9dicament',
    ja: '\u3053\u306e\u85ac\u3092\u670d\u7528\u3057\u3066\u3044\u307e\u3059',
    zh: '\u6211\u6b63\u5728\u670d\u7528\u8fd9\u79cd\u836f\u7269',
    th: '\u0e09\u0e31\u0e19\u0e01\u0e34\u0e19\u0e22\u0e32\u0e19\u0e35\u0e49',
    ko: '\uc774 \uc57d\uc744 \ubcf5\uc6a9\ud558\uace0 \uc788\uc2b5\ub2c8\ub2e4',
    de: 'Ich nehme dieses Medikament',
    it: 'Prendo questo farmaco',
    pt: 'Tomo este medicamento',
    ar: '\u0623\u062a\u0646\u0627\u0648\u0644 \u0647\u0630\u0627 \u0627\u0644\u062f\u0648\u0627\u0621',
  },
  'Please call my emergency contact': {
    es: 'Por favor llame a mi contacto de emergencia',
    fr: "Veuillez appeler mon contact d'urgence",
    ja: '\u7dca\u6025\u9023\u7d61\u5148\u306b\u9023\u7d61\u3057\u3066\u304f\u3060\u3055\u3044',
    zh: '\u8bf7\u8054\u7cfb\u6211\u7684\u7d27\u6025\u8054\u7cfb\u4eba',
    th: '\u0e01\u0e23\u0e38\u0e13\u0e32\u0e42\u0e17\u0e23\u0e2b\u0e32\u0e1c\u0e39\u0e49\u0e15\u0e34\u0e14\u0e15\u0e48\u0e2d\u0e09\u0e38\u0e01\u0e40\u0e09\u0e34\u0e19\u0e02\u0e2d\u0e07\u0e09\u0e31\u0e19',
    ko: '\ube44\uc0c1 \uc5f0\ub77d\ucc98\uc5d0 \uc804\ud654\ud574 \uc8fc\uc138\uc694',
    de: 'Bitte rufen Sie meinen Notfallkontakt an',
    it: 'Per favore chiamate il mio contatto di emergenza',
    pt: 'Por favor ligue para meu contato de emerg\u00eancia',
    ar: '\u064a\u0631\u062c\u0649 \u0627\u0644\u0627\u062a\u0635\u0627\u0644 \u0628\u062c\u0647\u0629 \u0627\u062a\u0635\u0627\u0644 \u0627\u0644\u0637\u0648\u0627\u0631\u0626',
  },
  'I have a medical condition': {
    es: 'Tengo una condici\u00f3n m\u00e9dica',
    fr: "J'ai un probl\u00e8me m\u00e9dical",
    ja: '\u6301\u75c5\u304c\u3042\u308a\u307e\u3059',
    zh: '\u6211\u6709\u75be\u75c5',
    th: '\u0e09\u0e31\u0e19\u0e21\u0e35\u0e42\u0e23\u0e04\u0e1b\u0e23\u0e30\u0e08\u0e33\u0e15\u0e31\u0e27',
    ko: '\uc9c0\ubcd1\uc774 \uc788\uc2b5\ub2c8\ub2e4',
    de: 'Ich habe eine Erkrankung',
    it: 'Ho una condizione medica',
    pt: 'Tenho uma condi\u00e7\u00e3o m\u00e9dica',
    ar: '\u0644\u062f\u064a \u062d\u0627\u0644\u0629 \u0637\u0628\u064a\u0629',
  },
};

// -----------------------------------------------------------------------------
// Map destinations to primary language code
// -----------------------------------------------------------------------------
export const DESTINATION_LANGUAGE: Record<string, string> = {
  Tokyo: 'ja',
  Kyoto: 'ja',
  Osaka: 'ja',
  Paris: 'fr',
  Nice: 'fr',
  Barcelona: 'es',
  Madrid: 'es',
  'Mexico City': 'es',
  'Buenos Aires': 'es',
  Cartagena: 'es',
  'Medell\u00edn': 'es',
  Lima: 'es',
  Bangkok: 'th',
  'Chiang Mai': 'th',
  Phuket: 'th',
  Seoul: 'ko',
  Beijing: 'zh',
  Shanghai: 'zh',
  'Hong Kong': 'zh',
  Taipei: 'zh',
  Berlin: 'de',
  Munich: 'de',
  Rome: 'it',
  Florence: 'it',
  'Amalfi Coast': 'it',
  Lisbon: 'pt',
  Porto: 'pt',
  'S\u00e3o Paulo': 'pt',
  'Rio de Janeiro': 'pt',
  Marrakech: 'ar',
  Dubai: 'ar',
  Cairo: 'ar',
};

// -----------------------------------------------------------------------------
// Language display names
// -----------------------------------------------------------------------------
export const LANGUAGE_NAMES: Record<string, string> = {
  ja: 'Japanese',
  fr: 'French',
  es: 'Spanish',
  th: 'Thai',
  ko: 'Korean',
  zh: 'Chinese',
  de: 'German',
  it: 'Italian',
  pt: 'Portuguese',
  ar: 'Arabic',
};

// -----------------------------------------------------------------------------
// Persistence — AsyncStorage
// -----------------------------------------------------------------------------
export async function getEmergencyCard(): Promise<EmergencyCardData | null> {
  try {
    const raw = await AsyncStorage.getItem(STORAGE_KEY);
    if (!raw) return null;
    const parsed: unknown = JSON.parse(raw);
    if (typeof parsed !== 'object' || parsed === null) return null;
    return parsed as EmergencyCardData;
  } catch (err: unknown) {
    if (err instanceof Error) {
      console.warn('[EmergencyCard] Failed to load:', err.message);
    }
    return null;
  }
}

export async function saveEmergencyCard(
  data: EmergencyCardData
): Promise<void> {
  try {
    await AsyncStorage.setItem(STORAGE_KEY, JSON.stringify(data));
  } catch (err: unknown) {
    if (err instanceof Error) {
      console.warn('[EmergencyCard] Failed to save:', err.message);
    }
  }
}

// -----------------------------------------------------------------------------
// Translation helpers
// -----------------------------------------------------------------------------
export function getDestinationLanguageCode(
  destination: string
): string | null {
  return DESTINATION_LANGUAGE[destination] ?? null;
}

export function getTranslatedPhrase(
  phrase: string,
  destination: string
): string | null {
  const langCode = getDestinationLanguageCode(destination);
  if (!langCode) return null;
  const translations = MEDICAL_TRANSLATIONS[phrase];
  if (!translations) return null;
  return translations[langCode] ?? null;
}
