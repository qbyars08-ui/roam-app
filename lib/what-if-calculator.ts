// =============================================================================
// ROAM — What If Calculator
// "What if I just went?"
// The information that makes the impossible feel possible.
// Most people don't travel because they think they can't afford it.
// Often they're wrong. Often they just never did the math.
// =============================================================================

import { DESTINATIONS, HIDDEN_DESTINATIONS, type Destination } from './constants';

// ---------------------------------------------------------------------------
// Types
// ---------------------------------------------------------------------------
export interface WhatIfResult {
  destination: string;
  days: number;
  /** Estimated round-trip flight from common US cities */
  flightEstimate: number;
  /** Daily budget (from destination data) */
  dailyCost: number;
  /** Total estimated cost */
  totalCost: number;
  /** Fun comparison: how many lattes */
  lattes: number;
  /** Fun comparison: monthly streaming services */
  streamingMonths: number;
  /** How many months saving $X/day to afford it */
  savingMonths: (perDay: number) => number;
  /** Budget breakdown */
  breakdown: {
    flights: number;
    accommodation: number;
    food: number;
    activities: number;
    transport: number;
  };
  /** Encouragement line */
  encouragement: string;
}

// ---------------------------------------------------------------------------
// Flight cost estimates by region (from major US cities, round-trip)
// These are rough averages — the point is "possible" not "precise"
// ---------------------------------------------------------------------------
const FLIGHT_ESTIMATES: Record<string, number> = {
  // Asia
  JP: 850,
  TH: 750,
  ID: 800,
  KR: 800,
  VN: 750,
  IN: 900,
  KH: 800,
  AE: 700,
  GE: 650,
  // Europe
  FR: 550,
  ES: 550,
  IT: 550,
  GB: 500,
  PT: 500,
  NL: 550,
  HR: 600,
  HU: 550,
  IS: 400,
  TR: 600,
  SI: 600,
  GR: 600,
  // Americas
  MX: 300,
  AR: 700,
  CO: 400,
  // Africa
  MA: 600,
  ZA: 900,
  // Oceania
  AU: 1100,
  NZ: 1200,
};

// ---------------------------------------------------------------------------
// Encouragement lines — honest, not sales-y
// ---------------------------------------------------------------------------
const ENCOURAGEMENTS: string[] = [
  "That's less than most people spend on things they don't remember.",
  "You've spent more than this on something you can't even name.",
  "A month of not eating out covers the flight.",
  "The memories-to-dollar ratio here is unreasonably good.",
  "Your future self will thank your present self.",
  "You don't need permission. You need a departure date.",
  "Most regrets are about not going. Almost never about going.",
  "The math works. The question is whether you'll let it.",
  "That's one month of expenses for a lifetime of memories.",
  "Three months from now you'll wish you'd booked today.",
];

// ---------------------------------------------------------------------------
// Calculator
// ---------------------------------------------------------------------------
export function calculateWhatIf(
  destinationName: string,
  days: number = 7
): WhatIfResult | null {
  const allDests = [...DESTINATIONS, ...HIDDEN_DESTINATIONS];
  const dest = allDests.find(
    (d) => d.label.toLowerCase() === destinationName.toLowerCase()
  );

  if (!dest) return null;

  const flightEstimate = FLIGHT_ESTIMATES[dest.country] ?? 600;
  const dailyCost = dest.dailyCost;
  const totalDailyCosts = dailyCost * days;
  const totalCost = flightEstimate + totalDailyCosts;

  // Breakdown approximation
  const accommodationPct = 0.35;
  const foodPct = 0.30;
  const activitiesPct = 0.20;
  const transportPct = 0.15;

  const breakdown = {
    flights: flightEstimate,
    accommodation: Math.round(totalDailyCosts * accommodationPct),
    food: Math.round(totalDailyCosts * foodPct),
    activities: Math.round(totalDailyCosts * activitiesPct),
    transport: Math.round(totalDailyCosts * transportPct),
  };

  const lattePrice = 6;
  const streamingCost = 45; // Netflix + Spotify + etc.

  return {
    destination: dest.label,
    days,
    flightEstimate,
    dailyCost,
    totalCost,
    lattes: Math.round(totalCost / lattePrice),
    streamingMonths: Math.round(totalCost / streamingCost),
    savingMonths: (perDay: number) =>
      perDay > 0 ? Math.ceil(totalCost / (perDay * 30)) : Infinity,
    breakdown,
    encouragement:
      ENCOURAGEMENTS[Math.floor(Math.random() * ENCOURAGEMENTS.length)],
  };
}

/**
 * Quick summary line for display.
 * "$1,340 total · 223 lattes · 4 months saving $12/day"
 */
export function getQuickSummary(result: WhatIfResult): string {
  const savingPerDay = 10;
  const months = result.savingMonths(savingPerDay);
  return `$${result.totalCost.toLocaleString()} total · ${result.lattes} lattes · ${months} months saving $${savingPerDay}/day`;
}
