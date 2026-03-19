// =============================================================================
// ROAM — eSIM Intelligence
// Destination-aware eSIM recommendations with pricing data.
// No API integration yet — curated data for top destinations.
// When Airalo API partnership is live, swap to live data.
// =============================================================================

import AsyncStorage from '@react-native-async-storage/async-storage';
import { Linking } from 'react-native';

// ---------------------------------------------------------------------------
// Types
// ---------------------------------------------------------------------------

export interface ESIMPlan {
  readonly provider: 'airalo' | 'holafly' | 'nomad';
  readonly name: string;
  readonly data: string; // e.g. "1GB", "3GB", "Unlimited"
  readonly duration: string; // e.g. "7 days", "30 days"
  readonly price: string; // e.g. "$4.50"
  readonly priceValue: number; // for sorting
  readonly coverage: readonly string[]; // country codes
  readonly url: string;
  readonly recommended?: boolean;
}

export interface ESIMDestinationInfo {
  readonly destination: string;
  readonly countryCode: string;
  readonly needsESIM: boolean;
  readonly reason: string; // Why eSIM matters here
  readonly wifiReliability: 'excellent' | 'good' | 'spotty' | 'poor';
  readonly plans: readonly ESIMPlan[];
  readonly tip: string;
}

// ---------------------------------------------------------------------------
// Curated eSIM data for top destinations
// ---------------------------------------------------------------------------

const ESIM_DATA: Record<string, ESIMDestinationInfo> = {
  tokyo: {
    destination: 'Tokyo',
    countryCode: 'JP',
    needsESIM: true,
    reason: 'Google Maps is essential for navigating Tokyo\'s subway. Free WiFi is rare outside convenience stores.',
    wifiReliability: 'spotty',
    plans: [
      { provider: 'airalo', name: 'Moshi Moshi', data: '1GB', duration: '7 days', price: '$4.50', priceValue: 4.5, coverage: ['JP'], url: 'https://www.airalo.com/japan-esim', recommended: true },
      { provider: 'airalo', name: 'Moshi Moshi', data: '3GB', duration: '30 days', price: '$11.00', priceValue: 11, coverage: ['JP'], url: 'https://www.airalo.com/japan-esim' },
      { provider: 'holafly', name: 'Japan Unlimited', data: 'Unlimited', duration: '7 days', price: '$19.00', priceValue: 19, coverage: ['JP'], url: 'https://www.holafly.com/esim-japan' },
    ],
    tip: 'Install your eSIM before you board — Japan airports have free WiFi but activating eSIM on the plane saves 20 minutes.',
  },
  paris: {
    destination: 'Paris',
    countryCode: 'FR',
    needsESIM: true,
    reason: 'Metro navigation and restaurant lookups need data. Café WiFi often requires a purchase.',
    wifiReliability: 'good',
    plans: [
      { provider: 'airalo', name: 'Orange Holiday', data: '1GB', duration: '7 days', price: '$4.50', priceValue: 4.5, coverage: ['FR'], url: 'https://www.airalo.com/france-esim', recommended: true },
      { provider: 'airalo', name: 'Eurolink', data: '5GB', duration: '30 days', price: '$13.00', priceValue: 13, coverage: ['FR', 'DE', 'IT', 'ES', 'NL', 'BE', 'PT'], url: 'https://www.airalo.com/europe-esim' },
      { provider: 'holafly', name: 'Europe Unlimited', data: 'Unlimited', duration: '7 days', price: '$27.00', priceValue: 27, coverage: ['FR', 'DE', 'IT', 'ES'], url: 'https://www.holafly.com/esim-europe' },
    ],
    tip: 'If visiting multiple European countries, get a regional eSIM — it covers 30+ countries and is cheaper than buying per country.',
  },
  bali: {
    destination: 'Bali',
    countryCode: 'ID',
    needsESIM: true,
    reason: 'Grab (rideshare) needs data, and WiFi outside Seminyak/Ubud is unreliable. Maps essential for scooter navigation.',
    wifiReliability: 'spotty',
    plans: [
      { provider: 'airalo', name: 'Indosat', data: '1GB', duration: '7 days', price: '$4.50', priceValue: 4.5, coverage: ['ID'], url: 'https://www.airalo.com/indonesia-esim', recommended: true },
      { provider: 'airalo', name: 'Indosat', data: '3GB', duration: '30 days', price: '$8.00', priceValue: 8, coverage: ['ID'], url: 'https://www.airalo.com/indonesia-esim' },
      { provider: 'nomad', name: 'Bali Data', data: '5GB', duration: '15 days', price: '$12.00', priceValue: 12, coverage: ['ID'], url: 'https://www.getnomad.app' },
    ],
    tip: 'Check if your phone supports eSIM before you go (most iPhones from XS onward). Some Android phones need a settings toggle.',
  },
  bangkok: {
    destination: 'Bangkok',
    countryCode: 'TH',
    needsESIM: true,
    reason: 'Grab and Line are essential apps. Street food stalls don\'t have WiFi. BTS navigation needs data.',
    wifiReliability: 'good',
    plans: [
      { provider: 'airalo', name: 'DTAC', data: '1GB', duration: '7 days', price: '$4.50', priceValue: 4.5, coverage: ['TH'], url: 'https://www.airalo.com/thailand-esim', recommended: true },
      { provider: 'airalo', name: 'DTAC', data: '5GB', duration: '30 days', price: '$12.50', priceValue: 12.5, coverage: ['TH'], url: 'https://www.airalo.com/thailand-esim' },
      { provider: 'holafly', name: 'Thailand Unlimited', data: 'Unlimited', duration: '7 days', price: '$19.00', priceValue: 19, coverage: ['TH'], url: 'https://www.holafly.com/esim-thailand' },
    ],
    tip: 'Airport SIM shops charge 3x the eSIM price. Pre-install before your flight.',
  },
  rome: {
    destination: 'Rome',
    countryCode: 'IT',
    needsESIM: true,
    reason: 'Google Maps saves you from getting lost in the centro storico. Restaurant reviews while walking.',
    wifiReliability: 'good',
    plans: [
      { provider: 'airalo', name: 'Italia', data: '1GB', duration: '7 days', price: '$4.50', priceValue: 4.5, coverage: ['IT'], url: 'https://www.airalo.com/italy-esim', recommended: true },
      { provider: 'airalo', name: 'Eurolink', data: '5GB', duration: '30 days', price: '$13.00', priceValue: 13, coverage: ['IT', 'FR', 'DE', 'ES'], url: 'https://www.airalo.com/europe-esim' },
    ],
    tip: 'Get a Europe-wide eSIM if day-tripping to Florence or visiting the Vatican (technically a different country).',
  },
  'new york': {
    destination: 'New York',
    countryCode: 'US',
    needsESIM: false,
    reason: 'If you have a US carrier, you\'re covered. International visitors should get a US eSIM.',
    wifiReliability: 'excellent',
    plans: [
      { provider: 'airalo', name: 'US Mobile', data: '3GB', duration: '30 days', price: '$11.00', priceValue: 11, coverage: ['US'], url: 'https://www.airalo.com/united-states-esim' },
    ],
    tip: 'NYC has free WiFi in all subway stations (underground too). But it\'s slow — eSIM is better for maps.',
  },
  barcelona: {
    destination: 'Barcelona',
    countryCode: 'ES',
    needsESIM: true,
    reason: 'Beach + Gaudí navigation, restaurant lookups in the Gothic Quarter, metro maps.',
    wifiReliability: 'good',
    plans: [
      { provider: 'airalo', name: 'Movistar', data: '1GB', duration: '7 days', price: '$4.50', priceValue: 4.5, coverage: ['ES'], url: 'https://www.airalo.com/spain-esim', recommended: true },
      { provider: 'airalo', name: 'Eurolink', data: '5GB', duration: '30 days', price: '$13.00', priceValue: 13, coverage: ['ES', 'FR', 'PT', 'IT'], url: 'https://www.airalo.com/europe-esim' },
    ],
    tip: 'Beware of pickpockets on La Rambla — having your phone on eSIM means no physical SIM to lose if the phone gets swiped.',
  },
  seoul: {
    destination: 'Seoul',
    countryCode: 'KR',
    needsESIM: true,
    reason: 'KakaoMap is better than Google Maps in Korea. T-money card app needs data. Naver for restaurants.',
    wifiReliability: 'excellent',
    plans: [
      { provider: 'airalo', name: 'KT Telecom', data: '1GB', duration: '7 days', price: '$4.50', priceValue: 4.5, coverage: ['KR'], url: 'https://www.airalo.com/south-korea-esim', recommended: true },
      { provider: 'airalo', name: 'KT Telecom', data: '5GB', duration: '30 days', price: '$14.00', priceValue: 14, coverage: ['KR'], url: 'https://www.airalo.com/south-korea-esim' },
    ],
    tip: 'Seoul has incredible public WiFi, but eSIM is still worth it for subway underground sections and walking navigation.',
  },
};

// ---------------------------------------------------------------------------
// Public API
// ---------------------------------------------------------------------------

export function getESIMInfo(destination: string): ESIMDestinationInfo | null {
  const key = destination.toLowerCase().trim();
  return ESIM_DATA[key] ?? null;
}

export function getRecommendedPlan(destination: string): ESIMPlan | null {
  const info = getESIMInfo(destination);
  if (!info) return null;
  return info.plans.find((p) => p.recommended) ?? info.plans[0] ?? null;
}

export function getCheapestPlan(destination: string): ESIMPlan | null {
  const info = getESIMInfo(destination);
  if (!info || info.plans.length === 0) return null;
  return [...info.plans].sort((a, b) => a.priceValue - b.priceValue)[0];
}

export function openESIMLink(plan: ESIMPlan): void {
  Linking.openURL(plan.url).catch(() => {
    // silent fail — URL might not be supported
  });
}

export function getSupportedDestinations(): readonly string[] {
  return Object.keys(ESIM_DATA);
}

// ---------------------------------------------------------------------------
// Cache key for when we add Airalo API
// ---------------------------------------------------------------------------
export const CACHE_ESIM_PREFIX = 'roam_esim_';
