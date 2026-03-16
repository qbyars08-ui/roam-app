// =============================================================================
// ROAM — Travel Compatibility Quiz
// Answer 10 quick questions, share a link with a friend. When they answer,
// both see a compatibility score + breakdown. Extremely shareable.
// =============================================================================
import AsyncStorage from '@react-native-async-storage/async-storage';

const COMPAT_ANSWERS_KEY = 'roam_compat_answers';

// ---------------------------------------------------------------------------
// Quiz Questions
// ---------------------------------------------------------------------------
export interface CompatQuestion {
  id: string;
  question: string;
  options: { id: string; label: string; emoji: string }[];
}

export const COMPAT_QUESTIONS: CompatQuestion[] = [
  {
    id: 'wake',
    question: 'What time do you wake up on vacation?',
    options: [
      { id: 'early', label: 'Before 7am', emoji: '\u{1F305}' },
      { id: 'normal', label: '8-10am', emoji: '\u{2615}' },
      { id: 'late', label: 'After 11am', emoji: '\u{1F634}' },
    ],
  },
  {
    id: 'planning',
    question: 'How much do you plan ahead?',
    options: [
      { id: 'everything', label: 'Every hour mapped out', emoji: '\u{1F4CB}' },
      { id: 'loose', label: 'Rough outline, wing it', emoji: '\u{1F91E}' },
      { id: 'nothing', label: 'Zero plan, pure chaos', emoji: '\u{1F525}' },
    ],
  },
  {
    id: 'food',
    question: 'Food on a trip is...',
    options: [
      { id: 'adventure', label: 'Try everything weird', emoji: '\u{1F419}' },
      { id: 'local', label: 'Find the best local spots', emoji: '\u{1F35C}' },
      { id: 'comfort', label: 'Stick to what I know', emoji: '\u{1F354}' },
    ],
  },
  {
    id: 'budget',
    question: 'Your travel budget style?',
    options: [
      { id: 'splurge', label: 'Treat yourself, YOLO', emoji: '\u{1F4B8}' },
      { id: 'balanced', label: 'Splurge on some, save on rest', emoji: '\u{2696}\uFE0F' },
      { id: 'frugal', label: 'Stretch every dollar', emoji: '\u{1F4B0}' },
    ],
  },
  {
    id: 'pace',
    question: 'Your ideal day on a trip?',
    options: [
      { id: 'packed', label: '5+ activities, no breaks', emoji: '\u{1F3C3}' },
      { id: 'moderate', label: '2-3 things + downtime', emoji: '\u{1F6B6}' },
      { id: 'chill', label: 'One thing, lots of lounging', emoji: '\u{1F3D6}\uFE0F' },
    ],
  },
  {
    id: 'transport',
    question: 'Getting around?',
    options: [
      { id: 'walking', label: 'Walk everywhere', emoji: '\u{1F9B6}' },
      { id: 'public', label: 'Public transport pro', emoji: '\u{1F683}' },
      { id: 'taxi', label: 'Uber/taxi comfort', emoji: '\u{1F695}' },
    ],
  },
  {
    id: 'photos',
    question: 'How many photos do you take?',
    options: [
      { id: 'tons', label: '500+ per trip minimum', emoji: '\u{1F4F8}' },
      { id: 'some', label: 'A few good ones', emoji: '\u{1F4F7}' },
      { id: 'none', label: 'Live in the moment', emoji: '\u{1F9D8}' },
    ],
  },
  {
    id: 'social',
    question: 'Meeting other travelers?',
    options: [
      { id: 'love', label: 'Always, that\'s the point', emoji: '\u{1F91D}' },
      { id: 'open', label: 'Open to it, not seeking', emoji: '\u{1F60A}' },
      { id: 'solo', label: 'Prefer my own crew', emoji: '\u{1F60E}' },
    ],
  },
  {
    id: 'nightlife',
    question: 'After dinner, you\'re...',
    options: [
      { id: 'out', label: 'Out till sunrise', emoji: '\u{1F389}' },
      { id: 'drink', label: 'One nice cocktail, then bed', emoji: '\u{1F378}' },
      { id: 'sleep', label: 'In bed by 10pm', emoji: '\u{1F6CC}' },
    ],
  },
  {
    id: 'souvenirs',
    question: 'Souvenirs?',
    options: [
      { id: 'collector', label: 'Fridge magnets from every city', emoji: '\u{1F9F2}' },
      { id: 'meaningful', label: 'One meaningful thing', emoji: '\u{1F381}' },
      { id: 'none', label: 'Memories are enough', emoji: '\u{1F4AD}' },
    ],
  },
];

// ---------------------------------------------------------------------------
// Types
// ---------------------------------------------------------------------------
export type CompatAnswers = Record<string, string>;

export interface CompatResult {
  overallScore: number; // 0-100
  matchEmoji: string;
  matchLabel: string;
  breakdown: {
    questionId: string;
    question: string;
    myAnswer: string;
    theirAnswer: string;
    match: boolean;
  }[];
  strengths: string[];
  watchOuts: string[];
}

// ---------------------------------------------------------------------------
// Scoring
// ---------------------------------------------------------------------------

const MATCH_LABELS: { min: number; label: string; emoji: string }[] = [
  { min: 90, label: 'Travel Soulmates', emoji: '\u{1F496}' },
  { min: 70, label: 'Great Match', emoji: '\u{1F525}' },
  { min: 50, label: 'Solid Duo', emoji: '\u{1F91D}' },
  { min: 30, label: 'Interesting Mix', emoji: '\u{1F914}' },
  { min: 0, label: 'Opposites Attract?', emoji: '\u{1F648}' },
];

function getMatchLabel(score: number): { label: string; emoji: string } {
  for (const m of MATCH_LABELS) {
    if (score >= m.min) return { label: m.label, emoji: m.emoji };
  }
  return MATCH_LABELS[MATCH_LABELS.length - 1];
}

export function computeCompatibility(
  myAnswers: CompatAnswers,
  theirAnswers: CompatAnswers
): CompatResult {
  let matches = 0;
  const breakdown: CompatResult['breakdown'] = [];

  for (const q of COMPAT_QUESTIONS) {
    const my = myAnswers[q.id] ?? '';
    const their = theirAnswers[q.id] ?? '';
    const isMatch = my === their;
    if (isMatch) matches++;
    breakdown.push({
      questionId: q.id,
      question: q.question,
      myAnswer: q.options.find((o) => o.id === my)?.label ?? my,
      theirAnswer: q.options.find((o) => o.id === their)?.label ?? their,
      match: isMatch,
    });
  }

  const overallScore = Math.round((matches / COMPAT_QUESTIONS.length) * 100);
  const { label: matchLabel, emoji: matchEmoji } = getMatchLabel(overallScore);

  // Generate strengths and watch-outs
  const strengths: string[] = [];
  const watchOuts: string[] = [];

  if (myAnswers.wake === theirAnswers.wake) {
    strengths.push('Same sleep schedule \u2014 no one\'s waiting around');
  } else {
    watchOuts.push('Different wake-up times \u2014 agree on a meeting time');
  }

  if (myAnswers.budget === theirAnswers.budget) {
    strengths.push('Aligned on spending \u2014 no awkward bill moments');
  } else {
    watchOuts.push('Different budgets \u2014 discuss expectations upfront');
  }

  if (myAnswers.pace === theirAnswers.pace) {
    strengths.push('Same energy levels \u2014 you\'ll both be happy');
  } else {
    watchOuts.push('Different paces \u2014 build in solo time');
  }

  if (myAnswers.planning === theirAnswers.planning) {
    strengths.push('Same planning style \u2014 smooth coordination');
  }

  if (myAnswers.food === theirAnswers.food) {
    strengths.push('Food compatibility \u2014 no one\'s compromising on dinner');
  }

  return {
    overallScore,
    matchEmoji,
    matchLabel,
    breakdown,
    strengths: strengths.slice(0, 3),
    watchOuts: watchOuts.slice(0, 3),
  };
}

// ---------------------------------------------------------------------------
// Storage
// ---------------------------------------------------------------------------

export async function saveMyAnswers(answers: CompatAnswers): Promise<void> {
  await AsyncStorage.setItem(COMPAT_ANSWERS_KEY, JSON.stringify(answers));
}

export async function getMyAnswers(): Promise<CompatAnswers | null> {
  try {
    const raw = await AsyncStorage.getItem(COMPAT_ANSWERS_KEY);
    return raw ? JSON.parse(raw) : null;
  } catch {
    return null;
  }
}
