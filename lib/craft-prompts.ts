// =============================================================================
// ROAM — CRAFT mode: deep question flow and copy
// One question per screen, full-screen, human voice
// =============================================================================

export const CRAFT_OPENING = 'Where have you always wanted to go?';

export type CraftStepId =
  | 'destination'
  | 'duration'
  | 'budget'
  | 'travel_party'
  | 'what_matters'
  | 'accommodation'
  | 'flying'
  | 'dietary_health'
  | 'specific_in_destination'
  | 'perfect_trip';

export interface CraftStep {
  id: CraftStepId;
  question: string;
}

export const CRAFT_STEPS: CraftStep[] = [
  { id: 'destination', question: CRAFT_OPENING },
  {
    id: 'duration',
    question: 'How long do you have?',
  },
  {
    id: 'budget',
    question: "What's your budget — and be honest, I'm not here to judge.",
  },
  {
    id: 'travel_party',
    question: "Who's going with you?",
  },
  {
    id: 'what_matters',
    question:
      "What matters most to you on this trip? Be specific. Not just 'culture' — what does that actually mean to you?",
  },
  {
    id: 'accommodation',
    question:
      "What's your accommodation style? I'm going to find you the best option in your budget — but I need to know if that means a design hotel, a ryokan, a serviced apartment, or something else.",
  },
  {
    id: 'flying',
    question:
      'How do you feel about flying? Any preferences on airlines, direct vs connections, cabin class?',
  },
  {
    id: 'dietary_health',
    question:
      'Any dietary restrictions, health considerations, or mobility needs I should know about?',
  },
  {
    id: 'specific_in_destination',
    question:
      "Is there anything specific you've always wanted to do in [destination] that I should build the trip around?",
  },
  {
    id: 'perfect_trip',
    question: "What would make this trip perfect for you? Not good. Perfect.",
  },
];

export function getStepAfterDestination(stepId: CraftStepId): CraftStepId | null {
  const idx = CRAFT_STEPS.findIndex((s) => s.id === stepId);
  if (idx < 0 || idx >= CRAFT_STEPS.length - 1) return null;
  return CRAFT_STEPS[idx + 1].id;
}

export function getStepQuestion(stepId: CraftStepId, destination?: string): string {
  const step = CRAFT_STEPS.find((s) => s.id === stepId);
  if (!step) return '';
  let q = step.question;
  if (stepId === 'specific_in_destination' && destination) {
    q = q.replace('[destination]', destination);
  }
  return q;
}

export const CRAFT_BUILDING_MESSAGE =
  "Give me a moment. I'm building something specific to you.";

export const CRAFT_ITINERARY_INTRO = (destination: string) =>
  `Here's your ${destination} trip.`;

export const CRAFT_FOLLOW_UP_PROMPT =
  'Does this feel right? Tell me what you\'d change.';
