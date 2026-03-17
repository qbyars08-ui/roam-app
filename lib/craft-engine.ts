// =============================================================================
// ROAM — CRAFT engine: conversation state and prompt building
// =============================================================================

import type { CraftStepId } from './craft-prompts';
import {
  CRAFT_STEPS,
  getStepQuestion,
} from './craft-prompts';

export interface CraftMessage {
  role: 'user' | 'assistant';
  content: string;
}

export interface CraftPreferences {
  destination?: string;
  duration?: string;
  budget?: string;
  travelParty?: string;
  whatMatters?: string;
  accommodation?: string;
  flying?: string;
  dietaryHealth?: string;
  specificInDestination?: string;
  perfectTrip?: string;
}

export interface CraftState {
  messages: CraftMessage[];
  currentStepId: CraftStepId | null;
  preferences: CraftPreferences;
  phase: 'gathering' | 'building' | 'done' | 'follow_up';
  generatedItineraryJson: string | null;
  /** Follow-up thread after itinerary is shown (user/assistant pairs) */
  followUpMessages: CraftMessage[];
  /** When resuming, the saved session id */
  sessionId: string | null;
}

const STEP_ORDER: CraftStepId[] = [
  'destination',
  'duration',
  'budget',
  'travel_party',
  'what_matters',
  'accommodation',
  'flying',
  'dietary_health',
  'specific_in_destination',
  'perfect_trip',
];

export function getInitialCraftState(overrides?: Partial<CraftState>): CraftState {
  return {
    messages: [],
    currentStepId: 'destination',
    preferences: {},
    phase: 'gathering',
    generatedItineraryJson: null,
    followUpMessages: [],
    sessionId: null,
    ...overrides,
  };
}

export function getCurrentQuestion(state: CraftState): string {
  if (!state.currentStepId) return '';
  return getStepQuestion(state.currentStepId, state.preferences.destination);
}

export function getNextStepId(current: CraftStepId | null): CraftStepId | null {
  if (!current) return STEP_ORDER[0] ?? null;
  const idx = STEP_ORDER.indexOf(current);
  if (idx < 0 || idx >= STEP_ORDER.length - 1) return null;
  return STEP_ORDER[idx + 1];
}

export function applyAnswer(
  state: CraftState,
  stepId: CraftStepId,
  userText: string
): CraftState {
  const prefs = { ...state.preferences };
  switch (stepId) {
    case 'destination':
      prefs.destination = userText.trim();
      break;
    case 'duration':
      prefs.duration = userText.trim();
      break;
    case 'budget':
      prefs.budget = userText.trim();
      break;
    case 'travel_party':
      prefs.travelParty = userText.trim();
      break;
    case 'what_matters':
      prefs.whatMatters = userText.trim();
      break;
    case 'accommodation':
      prefs.accommodation = userText.trim();
      break;
    case 'flying':
      prefs.flying = userText.trim();
      break;
    case 'dietary_health':
      prefs.dietaryHealth = userText.trim();
      break;
    case 'specific_in_destination':
      prefs.specificInDestination = userText.trim();
      break;
    case 'perfect_trip':
      prefs.perfectTrip = userText.trim();
      break;
  }

  const nextStep = getNextStepId(stepId);
  const newMessages: CraftMessage[] = [
    ...state.messages,
    { role: 'user', content: userText },
  ];

  return {
    ...state,
    messages: newMessages,
    preferences: prefs,
    currentStepId: nextStep,
  };
}

export function hasAllRequiredForGeneration(state: CraftState): boolean {
  return !!(
    state.preferences.destination?.trim() &&
    state.preferences.duration?.trim() &&
    state.preferences.budget?.trim()
  );
}

/** Build the context block injected into CRAFT system prompt for itinerary generation */
export function buildCraftContextBlock(state: CraftState): string {
  const p = state.preferences;
  const lines: string[] = [
    '--- TRAVELER CONTEXT (from conversation) ---',
    `Destination: ${p.destination ?? 'Not specified'}`,
    `Duration: ${p.duration ?? 'Not specified'}`,
    `Budget: ${p.budget ?? 'Not specified'}`,
  ];
  if (p.travelParty) lines.push(`Travel party: ${p.travelParty}`);
  if (p.whatMatters) lines.push(`What matters most: ${p.whatMatters}`);
  if (p.accommodation) lines.push(`Accommodation style: ${p.accommodation}`);
  if (p.flying) lines.push(`Flying preferences: ${p.flying}`);
  if (p.dietaryHealth) lines.push(`Dietary/health/mobility: ${p.dietaryHealth}`);
  if (p.specificInDestination) lines.push(`Must-do in destination: ${p.specificInDestination}`);
  if (p.perfectTrip) lines.push(`What would make it perfect: ${p.perfectTrip}`);
  lines.push('---');
  lines.push('');
  lines.push('Full conversation (for tone and nuance):');
  for (const msg of state.messages) {
    lines.push(`${msg.role === 'user' ? 'User' : 'ROAM'}: ${msg.content}`);
  }
  lines.push('---');
  return lines.join('\n');
}

/** Preferences for profile building (subset we persist to user profile) */
export function getPreferencesForProfile(state: CraftState): Record<string, unknown> {
  const p = state.preferences;
  const out: Record<string, unknown> = {};
  if (p.budget) out.budgetRange = p.budget;
  if (p.accommodation) out.accommodationStyle = p.accommodation;
  if (p.flying) out.cabinClassPreference = p.flying;
  if (p.dietaryHealth) out.dietaryRestrictions = p.dietaryHealth;
  if (p.travelParty) out.travelCompanions = p.travelParty;
  if (p.whatMatters) out.whatMattersMost = p.whatMatters;
  return out;
}

/** Build messages array for CRAFT follow-up: context + itinerary summary + thread + new user message */
export function buildFollowUpMessages(
  state: CraftState,
  itinerarySummary: string,
  newUserMessage: string
): Array<{ role: 'user' | 'assistant'; content: string }> {
  const out: Array<{ role: 'user' | 'assistant'; content: string }> = [];
  out.push({
    role: 'assistant',
    content: `Here is the traveler's context from our planning conversation:\n${buildCraftContextBlock(state)}`,
  });
  out.push({
    role: 'assistant',
    content: `Here is the itinerary I generated for them:\n${itinerarySummary}`,
  });
  for (const msg of state.followUpMessages) {
    out.push({ role: msg.role, content: msg.content });
  }
  out.push({ role: 'user', content: newUserMessage });
  return out;
}
