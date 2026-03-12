// =============================================================================
// ROAM — Language Survival (50 essential phrases)
// Phonetic pronunciation + categories. Uses prep/language-data for 10+ destinations.
// =============================================================================
import { getLanguagePackForDestination } from './prep/language-data';

export type PhraseCategory = 'greetings' | 'ordering' | 'transport' | 'emergency' | 'shopping';

export interface Phrase {
  native: string;
  english: string;
  phonetic: string;
  category: PhraseCategory;
}

const PHRASES_JA: Phrase[] = [
  { native: 'こんにちは', english: 'Hello', phonetic: 'kon-nichi-wa', category: 'greetings' },
  { native: 'ありがとう', english: 'Thank you', phonetic: 'a-ri-ga-to', category: 'greetings' },
  { native: 'すみません', english: 'Excuse me', phonetic: 'su-mi-ma-sen', category: 'greetings' },
  { native: 'おはよう', english: 'Good morning', phonetic: 'o-ha-yo', category: 'greetings' },
  { native: 'こんばんは', english: 'Good evening', phonetic: 'kon-ban-wa', category: 'greetings' },
  { native: 'さようなら', english: 'Goodbye', phonetic: 'sa-yo-na-ra', category: 'greetings' },
  { native: 'はい', english: 'Yes', phonetic: 'hai', category: 'greetings' },
  { native: 'いいえ', english: 'No', phonetic: 'i-i-e', category: 'greetings' },
  { native: 'をください', english: 'I\'ll have (this)', phonetic: 'o ku-da-sai', category: 'ordering' },
  { native: 'お水をお願いします', english: 'Water please', phonetic: 'o-mi-zu o o-ne-gai-shi-mas', category: 'ordering' },
  { native: 'お勘定をお願いします', english: 'Check please', phonetic: 'o-kan-jo-o o-ne-gai-shi-mas', category: 'ordering' },
  { native: 'いただきます', english: 'Let\'s eat', phonetic: 'i-ta-da-ki-mas', category: 'ordering' },
  { native: 'おいしい', english: 'Delicious', phonetic: 'o-i-shi-i', category: 'ordering' },
  { native: 'お腹いっぱい', english: 'I\'m full', phonetic: 'o-na-ka i-p-pai', category: 'ordering' },
  { native: '駅はどこですか', english: 'Where is the station?', phonetic: 'e-ki wa do-ko des-ka', category: 'transport' },
  { native: 'トイレはどこですか', english: 'Where is the bathroom?', phonetic: 'to-i-re wa do-ko des-ka', category: 'transport' },
  { native: 'タクシー', english: 'Taxi', phonetic: 'ta-ku-shi-i', category: 'transport' },
  { native: '切符を買いたい', english: 'I want to buy a ticket', phonetic: 'ki-ppu o ka-i-ta-i', category: 'transport' },
  { native: '助けて', english: 'Help', phonetic: 'ta-su-ke-te', category: 'emergency' },
  { native: '警察を呼んで', english: 'Call the police', phonetic: 'ke-i-sa-tsu o yon-de', category: 'emergency' },
  { native: '病院はどこですか', english: 'Where is the hospital?', phonetic: 'byo-i-n wa do-ko des-ka', category: 'emergency' },
  { native: 'いくらですか', english: 'How much?', phonetic: 'i-ku-ra des-ka', category: 'shopping' },
  { native: 'これが欲しい', english: 'I want this', phonetic: 'ko-re ga ho-shi-i', category: 'shopping' },
  { native: '安いのがありますか', english: 'Do you have something cheaper?', phonetic: 'ya-su-i no ga a-ri-mas-ka', category: 'shopping' },
];

const LANG_MAP: Record<string, Phrase[]> = {
  japanese: PHRASES_JA,
  japan: PHRASES_JA,
  tokyo: PHRASES_JA,
  kyoto: PHRASES_JA,
  osaka: PHRASES_JA,
};

export function getPhrasesForDestination(dest: string): Phrase[] {
  const k = dest.toLowerCase().replace(/[^a-z0-9\s]/g, '');
  for (const [key, phrases] of Object.entries(LANG_MAP)) {
    if (k.includes(key)) return phrases;
  }
  const pack = getLanguagePackForDestination(dest);
  if (pack?.phrases) {
    return pack.phrases.map((p: { english: string; local: string; phonetic: string; category: string }) => ({
      native: p.local,
      english: p.english,
      phonetic: p.phonetic,
      category: (p.category as PhraseCategory) ?? 'greetings',
    }));
  }
  return PHRASES_JA;
}
