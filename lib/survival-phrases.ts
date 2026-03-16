// =============================================================================
// ROAM — Survival Phrases Data Module
// Curated travel phrases organized by destination language.
// Pure data — no side effects, no API calls.
// =============================================================================

// ---------------------------------------------------------------------------
// Types
// ---------------------------------------------------------------------------

export type PhraseCategory =
  | 'greeting'
  | 'emergency'
  | 'food'
  | 'transport'
  | 'money'
  | 'directions'
  | 'courtesy';

export interface SurvivalPhrase {
  readonly id: string;
  readonly category: PhraseCategory;
  readonly original: string;
  readonly translation: string;
  readonly phonetic: string;
  readonly context?: string;
}

// ---------------------------------------------------------------------------
// Category icon mapping (lucide icon names)
// ---------------------------------------------------------------------------

const CATEGORY_ICONS: Readonly<Record<PhraseCategory, string>> = {
  greeting: 'Hand',
  emergency: 'ShieldAlert',
  food: 'UtensilsCrossed',
  transport: 'Bus',
  money: 'Wallet',
  directions: 'MapPin',
  courtesy: 'Heart',
};

export function getCategoryIcon(category: string): string {
  return CATEGORY_ICONS[category as PhraseCategory] ?? 'MessageCircle';
}

// ---------------------------------------------------------------------------
// Spanish phrases (es)
// ---------------------------------------------------------------------------

const SPANISH_PHRASES: readonly SurvivalPhrase[] = [
  // Greetings
  { id: 'es-greet-1', category: 'greeting', original: 'Hello', translation: 'Hola', phonetic: 'OH-lah', context: 'Universal greeting, any time of day' },
  { id: 'es-greet-2', category: 'greeting', original: 'Good morning', translation: 'Buenos días', phonetic: 'BWEH-nos DEE-ahs', context: 'Use until noon' },
  { id: 'es-greet-3', category: 'greeting', original: 'How are you?', translation: '¿Cómo estás?', phonetic: 'KOH-moh ehs-TAHS', context: 'Casual; use ¿Cómo está? for formal' },
  // Emergency
  { id: 'es-emrg-1', category: 'emergency', original: 'I need help', translation: 'Necesito ayuda', phonetic: 'neh-seh-SEE-toh ah-YOO-dah', context: 'Use urgently to get attention' },
  { id: 'es-emrg-2', category: 'emergency', original: 'Where is the hospital?', translation: '¿Dónde está el hospital?', phonetic: 'DOHN-deh ehs-TAH el ohs-pee-TAHL', context: 'Point to yourself if injured' },
  { id: 'es-emrg-3', category: 'emergency', original: 'Call the police', translation: 'Llame a la policía', phonetic: 'YAH-meh ah lah poh-lee-SEE-ah', context: 'Formal command; appropriate for emergencies' },
  // Food
  { id: 'es-food-1', category: 'food', original: 'The check, please', translation: 'La cuenta, por favor', phonetic: 'lah KWEN-tah por fah-VOR', context: 'Signal to waiter when ready to pay' },
  { id: 'es-food-2', category: 'food', original: 'Gluten-free', translation: 'Sin gluten', phonetic: 'seen GLOO-ten', context: 'Point to dish and say this for dietary needs' },
  { id: 'es-food-3', category: 'food', original: 'What do you recommend?', translation: '¿Qué recomienda?', phonetic: 'keh reh-koh-MYEN-dah', context: 'Great way to discover local favorites' },
  // Transport
  { id: 'es-trans-1', category: 'transport', original: 'Where is...?', translation: '¿Dónde está...?', phonetic: 'DOHN-deh ehs-TAH', context: 'Follow with the place name' },
  { id: 'es-trans-2', category: 'transport', original: 'A round trip ticket', translation: 'Una ida y vuelta', phonetic: 'OO-nah EE-dah ee VWEL-tah', context: 'At train or bus stations' },
  { id: 'es-trans-3', category: 'transport', original: 'Stop here, please', translation: 'Pare aquí, por favor', phonetic: 'PAH-reh ah-KEE por fah-VOR', context: 'Use in taxis or rideshares' },
  // Money
  { id: 'es-money-1', category: 'money', original: 'How much does it cost?', translation: '¿Cuánto cuesta?', phonetic: 'KWAHN-toh KWES-tah', context: 'Essential for markets and shops' },
  { id: 'es-money-2', category: 'money', original: 'Do you accept cards?', translation: '¿Aceptan tarjeta?', phonetic: 'ah-SEP-tahn tar-HEH-tah', context: 'Many small shops are cash-only' },
  { id: 'es-money-3', category: 'money', original: 'Too expensive', translation: 'Demasiado caro', phonetic: 'deh-mah-see-AH-doh KAH-roh', context: 'Useful when negotiating at markets' },
  // Courtesy
  { id: 'es-cour-1', category: 'courtesy', original: 'Thank you', translation: 'Gracias', phonetic: 'GRAH-see-ahs', context: 'Always appreciated' },
  { id: 'es-cour-2', category: 'courtesy', original: 'Please', translation: 'Por favor', phonetic: 'por fah-VOR', context: 'Add to any request to be polite' },
  { id: 'es-cour-3', category: 'courtesy', original: "I'm sorry", translation: 'Lo siento', phonetic: 'loh see-EN-toh', context: 'Apology; use Disculpe for excuse me' },
  { id: 'es-cour-4', category: 'courtesy', original: 'Excuse me', translation: 'Disculpe', phonetic: 'dees-KOOL-peh', context: 'Getting attention or passing through a crowd' },
];

// ---------------------------------------------------------------------------
// French phrases (fr)
// ---------------------------------------------------------------------------

const FRENCH_PHRASES: readonly SurvivalPhrase[] = [
  // Greetings
  { id: 'fr-greet-1', category: 'greeting', original: 'Hello', translation: 'Bonjour', phonetic: 'bohn-ZHOOR', context: 'Use until evening; always greet shopkeepers' },
  { id: 'fr-greet-2', category: 'greeting', original: 'Good evening', translation: 'Bonsoir', phonetic: 'bohn-SWAHR', context: 'Use after 6pm' },
  { id: 'fr-greet-3', category: 'greeting', original: 'How are you?', translation: 'Comment allez-vous?', phonetic: 'koh-MAHN tah-lay VOO', context: 'Polite/formal; use Ça va? with friends' },
  // Emergency
  { id: 'fr-emrg-1', category: 'emergency', original: 'I need help', translation: "J'ai besoin d'aide", phonetic: 'zhay beh-ZWAN dehd', context: 'Emphasize urgency with tone' },
  { id: 'fr-emrg-2', category: 'emergency', original: 'Where is the hospital?', translation: "Où est l'hôpital?", phonetic: 'oo eh loh-pee-TAHL', context: 'Emergency number in France is 15 (SAMU)' },
  { id: 'fr-emrg-3', category: 'emergency', original: 'Call the police', translation: 'Appelez la police', phonetic: 'ah-PLAY lah poh-LEES', context: 'Emergency number is 17' },
  // Food
  { id: 'fr-food-1', category: 'food', original: 'The check, please', translation: "L'addition, s'il vous plaît", phonetic: 'lah-dee-SYOHN seel voo PLEH', context: 'Waiters will not bring the check until asked' },
  { id: 'fr-food-2', category: 'food', original: 'I am allergic to...', translation: 'Je suis allergique à...', phonetic: 'zhuh swee ah-lair-ZHEEK ah', context: 'Follow with the allergen' },
  { id: 'fr-food-3', category: 'food', original: 'What do you recommend?', translation: 'Que recommandez-vous?', phonetic: 'kuh reh-koh-mahn-DAY voo', context: 'Locals love sharing their favorites' },
  // Transport
  { id: 'fr-trans-1', category: 'transport', original: 'Where is...?', translation: 'Où est...?', phonetic: 'oo eh', context: 'Follow with the place name' },
  { id: 'fr-trans-2', category: 'transport', original: 'A round trip ticket', translation: 'Un aller-retour', phonetic: 'uhn ah-LAY ruh-TOOR', context: 'At train stations or ticket counters' },
  { id: 'fr-trans-3', category: 'transport', original: 'Stop here, please', translation: "Arrêtez-vous ici, s'il vous plaît", phonetic: 'ah-REH-tay voo ee-SEE seel voo PLEH', context: 'In taxis' },
  // Money
  { id: 'fr-money-1', category: 'money', original: 'How much does it cost?', translation: 'Combien ça coûte?', phonetic: 'kohm-BYEN sah KOOT', context: 'Essential for shopping' },
  { id: 'fr-money-2', category: 'money', original: 'Do you accept cards?', translation: 'Acceptez-vous les cartes?', phonetic: 'ahk-sep-TAY voo lay KART', context: 'Most places accept Carte Bancaire/Visa' },
  // Courtesy
  { id: 'fr-cour-1', category: 'courtesy', original: 'Thank you', translation: 'Merci', phonetic: 'mair-SEE', context: 'Add beaucoup for emphasis: Merci beaucoup' },
  { id: 'fr-cour-2', category: 'courtesy', original: 'Please', translation: "S'il vous plaît", phonetic: 'seel voo PLEH', context: 'Essential for politeness in France' },
  { id: 'fr-cour-3', category: 'courtesy', original: "I'm sorry", translation: 'Je suis désolé(e)', phonetic: 'zhuh swee day-zoh-LAY', context: 'Add -e if you are female' },
  { id: 'fr-cour-4', category: 'courtesy', original: 'Excuse me', translation: 'Excusez-moi', phonetic: 'ehk-skew-ZAY mwah', context: 'Getting attention or apologizing for bumping' },
];

// ---------------------------------------------------------------------------
// German phrases (de)
// ---------------------------------------------------------------------------

const GERMAN_PHRASES: readonly SurvivalPhrase[] = [
  // Greetings
  { id: 'de-greet-1', category: 'greeting', original: 'Hello', translation: 'Hallo', phonetic: 'HAH-loh', context: 'Casual; use Guten Tag for formal' },
  { id: 'de-greet-2', category: 'greeting', original: 'Good morning', translation: 'Guten Morgen', phonetic: 'GOO-ten MOR-gen', context: 'Use until about noon' },
  { id: 'de-greet-3', category: 'greeting', original: 'How are you?', translation: 'Wie geht es Ihnen?', phonetic: 'vee gayt es EE-nen', context: 'Formal; use Wie gehts? with friends' },
  // Emergency
  { id: 'de-emrg-1', category: 'emergency', original: 'I need help', translation: 'Ich brauche Hilfe', phonetic: 'ikh BROW-khuh HIL-fuh', context: 'Speak clearly and firmly' },
  { id: 'de-emrg-2', category: 'emergency', original: 'Where is the hospital?', translation: 'Wo ist das Krankenhaus?', phonetic: 'voh ist dahs KRAHN-ken-house', context: 'Emergency number in Germany is 112' },
  { id: 'de-emrg-3', category: 'emergency', original: 'Call the police', translation: 'Rufen Sie die Polizei', phonetic: 'ROO-fen zee dee poh-lee-TSAI', context: 'Police number is 110' },
  // Food
  { id: 'de-food-1', category: 'food', original: 'The check, please', translation: 'Die Rechnung, bitte', phonetic: 'dee REKH-noong BIT-uh', context: 'Tipping 5-10% is customary' },
  { id: 'de-food-2', category: 'food', original: 'I am allergic to...', translation: 'Ich bin allergisch gegen...', phonetic: 'ikh bin ah-LAIR-gish GAY-gen', context: 'Follow with the allergen' },
  { id: 'de-food-3', category: 'food', original: 'What do you recommend?', translation: 'Was empfehlen Sie?', phonetic: 'vahs emp-FAY-len zee', context: 'Great at traditional restaurants' },
  // Transport
  { id: 'de-trans-1', category: 'transport', original: 'Where is...?', translation: 'Wo ist...?', phonetic: 'voh ist', context: 'Follow with the place name' },
  { id: 'de-trans-2', category: 'transport', original: 'A round trip ticket', translation: 'Eine Hin- und Rückfahrkarte', phonetic: 'AI-nuh HIN oont RUEK-far-kar-tuh', context: 'At train stations (Hauptbahnhof)' },
  { id: 'de-trans-3', category: 'transport', original: 'Stop here, please', translation: 'Halten Sie hier, bitte', phonetic: 'HAHL-ten zee heer BIT-uh', context: 'In taxis' },
  // Money
  { id: 'de-money-1', category: 'money', original: 'How much does it cost?', translation: 'Wie viel kostet das?', phonetic: 'vee feel KOS-tet dahs', context: 'Essential for shopping' },
  { id: 'de-money-2', category: 'money', original: 'Do you accept cards?', translation: 'Nehmen Sie Karten?', phonetic: 'NAY-men zee KAR-ten', context: 'Germany is still very cash-heavy' },
  // Courtesy
  { id: 'de-cour-1', category: 'courtesy', original: 'Thank you', translation: 'Danke', phonetic: 'DAHN-kuh', context: 'Add schön for thank you very much' },
  { id: 'de-cour-2', category: 'courtesy', original: 'Please', translation: 'Bitte', phonetic: 'BIT-uh', context: "Also means you're welcome" },
  { id: 'de-cour-3', category: 'courtesy', original: "I'm sorry", translation: 'Es tut mir leid', phonetic: 'es toot meer LITE', context: 'Sincere apology' },
  { id: 'de-cour-4', category: 'courtesy', original: 'Excuse me', translation: 'Entschuldigung', phonetic: 'ent-SHOOL-dee-goong', context: 'Getting attention or passing through' },
];

// ---------------------------------------------------------------------------
// Japanese phrases (ja)
// ---------------------------------------------------------------------------

const JAPANESE_PHRASES: readonly SurvivalPhrase[] = [
  // Greetings
  { id: 'ja-greet-1', category: 'greeting', original: 'Hello', translation: 'こんにちは', phonetic: 'kohn-nee-chee-WAH', context: 'Daytime greeting; pair with a slight bow' },
  { id: 'ja-greet-2', category: 'greeting', original: 'Good morning', translation: 'おはようございます', phonetic: 'oh-hah-YOH goh-zai-MAHS', context: 'Polite form; use おはよう with friends' },
  { id: 'ja-greet-3', category: 'greeting', original: 'Good evening', translation: 'こんばんは', phonetic: 'kohn-BAHN-wah', context: 'Use after sunset' },
  // Emergency
  { id: 'ja-emrg-1', category: 'emergency', original: 'Help!', translation: '助けて!', phonetic: 'tah-skeh-TEH', context: 'Casual but understood; polite: 助けてください' },
  { id: 'ja-emrg-2', category: 'emergency', original: 'Where is the hospital?', translation: '病院はどこですか？', phonetic: 'byoh-IN wah DOH-koh des-KAH', context: 'Emergency number is 119 for ambulance' },
  { id: 'ja-emrg-3', category: 'emergency', original: 'Please call the police', translation: '警察を呼んでください', phonetic: 'KAY-sah-tsoo oh YOHN-deh koo-dah-SAI', context: 'Police number is 110' },
  // Food
  { id: 'ja-food-1', category: 'food', original: 'The check, please', translation: 'お会計お願いします', phonetic: 'oh-kai-KAY oh-neh-GAI shee-MAHS', context: 'Or make an X with your fingers' },
  { id: 'ja-food-2', category: 'food', original: 'I am allergic to...', translation: '...アレルギーがあります', phonetic: '...ah-reh-roo-GEE gah ah-ree-MAHS', context: 'Say the allergen first, then this phrase' },
  { id: 'ja-food-3', category: 'food', original: 'This is delicious!', translation: 'おいしいです！', phonetic: 'oy-SHEE des', context: 'Compliment the chef; always appreciated' },
  // Transport
  { id: 'ja-trans-1', category: 'transport', original: 'Where is...?', translation: '...はどこですか？', phonetic: '...wah DOH-koh des-KAH', context: 'Say the place name first' },
  { id: 'ja-trans-2', category: 'transport', original: 'One ticket to..., please', translation: '...まで一枚お願いします', phonetic: '...MAH-deh ee-CHAI oh-neh-GAI shee-MAHS', context: 'At train ticket machines or counters' },
  { id: 'ja-trans-3', category: 'transport', original: 'Stop here, please', translation: 'ここで止めてください', phonetic: 'KOH-koh deh toh-MEH-teh koo-dah-SAI', context: 'In taxis; point to location' },
  // Money
  { id: 'ja-money-1', category: 'money', original: 'How much is this?', translation: 'これはいくらですか？', phonetic: 'KOH-reh wah ee-KOO-rah des-KAH', context: 'Point at the item while asking' },
  { id: 'ja-money-2', category: 'money', original: 'Can I pay by card?', translation: 'カードで払えますか？', phonetic: 'KAH-doh deh hah-rah-eh-MAHS-kah', context: 'Many places in Japan are still cash-only' },
  // Courtesy
  { id: 'ja-cour-1', category: 'courtesy', original: 'Thank you', translation: 'ありがとうございます', phonetic: 'ah-ree-GAH-toh goh-zai-MAHS', context: 'Polite; casual form: ありがとう' },
  { id: 'ja-cour-2', category: 'courtesy', original: 'Please', translation: 'お願いします', phonetic: 'oh-neh-GAI shee-MAHS', context: 'Add after any request' },
  { id: 'ja-cour-3', category: 'courtesy', original: "I'm sorry", translation: 'すみません', phonetic: 'soo-mee-mah-SEN', context: 'Also means excuse me; extremely versatile' },
  { id: 'ja-cour-4', category: 'courtesy', original: "I don't understand", translation: 'わかりません', phonetic: 'wah-kah-ree-mah-SEN', context: 'Polite way to indicate you need simpler language' },
];

// ---------------------------------------------------------------------------
// English phrases (fallback)
// ---------------------------------------------------------------------------

const ENGLISH_PHRASES: readonly SurvivalPhrase[] = [
  { id: 'en-greet-1', category: 'greeting', original: 'Hello', translation: 'Hello', phonetic: 'heh-LOH', context: 'Universal greeting' },
  { id: 'en-emrg-1', category: 'emergency', original: 'I need help', translation: 'I need help', phonetic: 'eye need help', context: 'Speak clearly and firmly' },
  { id: 'en-food-1', category: 'food', original: 'The check, please', translation: 'The check, please', phonetic: 'thuh chek pleez', context: 'Signal to waiter' },
  { id: 'en-trans-1', category: 'transport', original: 'Where is...?', translation: 'Where is...?', phonetic: 'wair iz', context: 'Follow with the place name' },
  { id: 'en-money-1', category: 'money', original: 'How much?', translation: 'How much?', phonetic: 'how much', context: 'Point at the item' },
  { id: 'en-cour-1', category: 'courtesy', original: 'Thank you', translation: 'Thank you', phonetic: 'thank yoo', context: 'Always appreciated' },
  { id: 'en-cour-2', category: 'courtesy', original: 'Excuse me', translation: 'Excuse me', phonetic: 'eks-KYOOZ mee', context: 'Getting attention or passing through' },
];

// ---------------------------------------------------------------------------
// Language → phrases lookup
// ---------------------------------------------------------------------------

const PHRASES_BY_LANGUAGE: Readonly<Record<string, readonly SurvivalPhrase[]>> = {
  es: SPANISH_PHRASES,
  fr: FRENCH_PHRASES,
  de: GERMAN_PHRASES,
  ja: JAPANESE_PHRASES,
  en: ENGLISH_PHRASES,
};

/**
 * Return survival phrases for a given language code.
 * Falls back to English if the language is not supported.
 */
export function getPhrasesForLanguage(languageCode: string): SurvivalPhrase[] {
  const normalized = languageCode.toLowerCase().split('-')[0];
  const phrases = PHRASES_BY_LANGUAGE[normalized];
  return phrases ? [...phrases] : [...ENGLISH_PHRASES];
}

// ---------------------------------------------------------------------------
// Destination → language mapping
// ---------------------------------------------------------------------------

const DESTINATION_LANGUAGE_MAP: Readonly<Record<string, string>> = {
  // Japanese
  tokyo: 'ja',
  kyoto: 'ja',
  osaka: 'ja',
  // French
  paris: 'fr',
  nice: 'fr',
  lyon: 'fr',
  marseille: 'fr',
  // Spanish
  barcelona: 'es',
  madrid: 'es',
  'mexico city': 'es',
  'buenos aires': 'es',
  cartagena: 'es',
  'medellín': 'es',
  medellin: 'es',
  oaxaca: 'es',
  // German
  berlin: 'de',
  munich: 'de',
  vienna: 'de',
  zurich: 'de',
};

/**
 * Given a destination name, return the primary language and relevant phrases.
 * Falls back to English with a helpful note if the destination is not mapped.
 */
export function getPhrasesForDestination(
  destination: string
): { language: string; phrases: SurvivalPhrase[] } {
  const normalized = destination.toLowerCase().trim();
  const language = DESTINATION_LANGUAGE_MAP[normalized] ?? 'en';
  return {
    language,
    phrases: getPhrasesForLanguage(language),
  };
}

// ---------------------------------------------------------------------------
// All supported phrase languages (for UI display)
// ---------------------------------------------------------------------------

export const PHRASE_LANGUAGES = [
  { code: 'es', label: 'Spanish', nativeLabel: 'Español' },
  { code: 'fr', label: 'French', nativeLabel: 'Français' },
  { code: 'de', label: 'German', nativeLabel: 'Deutsch' },
  { code: 'ja', label: 'Japanese', nativeLabel: '日本語' },
] as const;
