// =============================================================================
// ROAM — Currency Conversion (Frankfurter API)
// Free, no key required. 1h cache. https://www.frankfurter.app/
// =============================================================================
import AsyncStorage from '@react-native-async-storage/async-storage';

// ---------------------------------------------------------------------------
// Types
// ---------------------------------------------------------------------------
export interface ExchangeRates {
  base: string;
  rates: Record<string, number>;
  updatedAt: string;
}

export interface ConvertedPrice {
  original: string;
  converted: string;
  rate: number;
  currencyCode: string;
  symbol: string;
}

/** Minimal rates object — base + rates. convertUSD/formatUSD use only these. */
export type RatesInput = Pick<ExchangeRates, 'base' | 'rates'>;

// ---------------------------------------------------------------------------
// Constants
// ---------------------------------------------------------------------------
const CACHE_KEY = 'roam_exchange_rates';
const CACHE_TTL_MS = 60 * 60 * 1000; // 1 hour
// Frankfurter — free, no key, daily ECB rates
const FRANKFURTER_URL = 'https://api.frankfurter.app/latest?from=USD';

// Currency symbols for common currencies
const CURRENCY_SYMBOLS: Record<string, string> = {
  USD: '$',
  EUR: '\u20AC',
  GBP: '\u00A3',
  JPY: '\u00A5',
  AUD: 'A$',
  CAD: 'C$',
  CHF: 'CHF',
  CNY: '\u00A5',
  INR: '\u20B9',
  KRW: '\u20A9',
  MXN: 'MX$',
  BRL: 'R$',
  THB: '\u0E3F',
  IDR: 'Rp',
  VND: '\u20AB',
  TRY: '\u20BA',
  SEK: 'kr',
  NOK: 'kr',
  DKK: 'kr',
  PLN: 'z\u0142',
  CZK: 'K\u010D',
  HUF: 'Ft',
  ILS: '\u20AA',
  SGD: 'S$',
  HKD: 'HK$',
  NZD: 'NZ$',
  ZAR: 'R',
  COP: 'COL$',
  ARS: 'AR$',
  PEN: 'S/',
  CLP: 'CL$',
  MAD: 'MAD',
  EGP: 'E\u00A3',
  GEL: '\u20BE',
  PHP: '\u20B1',
  TWD: 'NT$',
  MYR: 'RM',
};

// User-facing currency names
const CURRENCY_NAMES: Record<string, string> = {
  USD: 'US Dollar',
  EUR: 'Euro',
  GBP: 'British Pound',
  JPY: 'Japanese Yen',
  AUD: 'Australian Dollar',
  CAD: 'Canadian Dollar',
  CHF: 'Swiss Franc',
  CNY: 'Chinese Yuan',
  INR: 'Indian Rupee',
  KRW: 'South Korean Won',
  MXN: 'Mexican Peso',
  BRL: 'Brazilian Real',
  THB: 'Thai Baht',
  IDR: 'Indonesian Rupiah',
  TRY: 'Turkish Lira',
  SGD: 'Singapore Dollar',
  HKD: 'Hong Kong Dollar',
  NZD: 'New Zealand Dollar',
  ZAR: 'South African Rand',
};

// Popular currencies shown in picker
export const POPULAR_CURRENCIES = [
  'USD', 'EUR', 'GBP', 'JPY', 'AUD', 'CAD', 'CHF', 'CNY',
  'INR', 'KRW', 'MXN', 'BRL', 'THB', 'IDR', 'TRY', 'SGD',
  'HKD', 'NZD', 'ZAR', 'SEK', 'NOK', 'COP', 'PHP', 'MYR',
];

// ---------------------------------------------------------------------------
// Locale detection → home currency (no external deps)
// ---------------------------------------------------------------------------
const LOCALE_TO_CURRENCY: Record<string, string> = {
  US: 'USD', GB: 'GBP', AU: 'AUD', CA: 'CAD', JP: 'JPY', DE: 'EUR', FR: 'EUR',
  IT: 'EUR', ES: 'EUR', NL: 'EUR', IN: 'INR', CN: 'CNY', KR: 'KRW', MX: 'MXN',
  BR: 'BRL', TH: 'THB', ID: 'IDR', TR: 'TRY', SG: 'SGD', HK: 'HKD', NZ: 'NZD',
  ZA: 'ZAR', SE: 'SEK', NO: 'NOK', DK: 'DKK', PL: 'PLN', CH: 'CHF', PH: 'PHP',
  MY: 'MYR', AR: 'ARS', CO: 'COP', CL: 'CLP', EG: 'EGP', IL: 'ILS', AE: 'AED',
};

export function detectLocaleCurrency(): string {
  try {
    const locale =
      (typeof Intl !== 'undefined' && new Intl.DateTimeFormat().resolvedOptions?.().locale) ||
      (typeof navigator !== 'undefined' && (navigator as { language?: string }).language) ||
      'en-US';
    const region = locale.split(/[-_]/)[1]?.toUpperCase();
    if (region && LOCALE_TO_CURRENCY[region]) {
      return LOCALE_TO_CURRENCY[region];
    }
    return 'USD';
  } catch {
    return 'USD';
  }
}

// ---------------------------------------------------------------------------
// User preference
// ---------------------------------------------------------------------------
const PREF_KEY = 'roam_home_currency';

export async function getHomeCurrency(): Promise<string> {
  try {
    let val = await AsyncStorage.getItem(PREF_KEY);
    if (!val) {
      val = detectLocaleCurrency();
      await AsyncStorage.setItem(PREF_KEY, val);
    }
    return val;
  } catch {
    return 'USD';
  }
}

export async function setHomeCurrency(code: string): Promise<void> {
  await AsyncStorage.setItem(PREF_KEY, code.toUpperCase());
}

export function getCurrencySymbol(code: string): string {
  return CURRENCY_SYMBOLS[code] ?? code;
}

export function getCurrencyName(code: string): string {
  return CURRENCY_NAMES[code] ?? code;
}

// ---------------------------------------------------------------------------
// Fetch + cache rates
// ---------------------------------------------------------------------------

async function getCachedRates(): Promise<ExchangeRates | null> {
  try {
    const raw = await AsyncStorage.getItem(CACHE_KEY);
    if (!raw) return null;
    const cached: ExchangeRates = JSON.parse(raw);
    const age = Date.now() - new Date(cached.updatedAt).getTime();
    if (age > CACHE_TTL_MS) return null; // stale
    return cached;
  } catch {
    return null;
  }
}

/**
 * Fetch latest exchange rates from Frankfurter API.
 * Uses cached data if available and fresh (< 1 hour).
 */
export async function fetchExchangeRates(): Promise<ExchangeRates> {
  // Try cache first
  const cached = await getCachedRates();
  if (cached) return cached;

  const controller = new AbortController();
  const timer = setTimeout(() => controller.abort(), 15_000);
  let data: { base?: string; rates?: Record<string, number> };
  try {
    const res = await fetch(FRANKFURTER_URL, { signal: controller.signal });
    if (!res.ok) throw new Error(`Frankfurter API failed: ${res.status}`);
    data = await res.json() as { base?: string; rates?: Record<string, number> };
  } finally {
    clearTimeout(timer);
  }
  const rates: Record<string, number> = data.rates ?? {};
  rates.USD = 1; // Ensure USD is present

  const result: ExchangeRates = {
    base: data.base ?? 'USD',
    rates,
    updatedAt: new Date().toISOString(),
  };

  // Cache
  await AsyncStorage.setItem(CACHE_KEY, JSON.stringify(result)).catch(() => {});

  return result;
}

// ---------------------------------------------------------------------------
// Conversion helpers
// ---------------------------------------------------------------------------

/**
 * Convert a USD amount to the target currency.
 */
export function convertUSD(
  amountUSD: number,
  targetCurrency: string,
  rates: RatesInput
): ConvertedPrice {
  const code = targetCurrency.toUpperCase();
  const rate = rates.rates[code] ?? 1;
  const converted = amountUSD * rate;
  const symbol = getCurrencySymbol(code);

  // Format based on magnitude
  let formatted: string;
  if (converted >= 10000) {
    formatted = `${symbol}${Math.round(converted).toLocaleString()}`;
  } else if (converted >= 100) {
    formatted = `${symbol}${Math.round(converted).toLocaleString()}`;
  } else {
    formatted = `${symbol}${converted.toFixed(2)}`;
  }

  return {
    original: `$${amountUSD.toLocaleString()}`,
    converted: formatted,
    rate,
    currencyCode: code,
    symbol,
  };
}

/**
 * Parse a USD price string like "$1,500" or "$45" and convert.
 */
export function convertPriceString(
  priceStr: string,
  targetCurrency: string,
  rates: ExchangeRates
): ConvertedPrice | null {
  const cleaned = priceStr.replace(/[^0-9.]/g, '');
  const amount = parseFloat(cleaned);
  if (isNaN(amount)) return null;
  return convertUSD(amount, targetCurrency, rates);
}

/**
 * Format a price in both USD and local currency.
 * Returns "$120 / ¥18,000" or just "$120" if target is USD.
 */
export function formatDualPrice(
  priceStr: string,
  targetCurrency: string,
  rates: ExchangeRates | null | undefined
): string {
  if (!rates || targetCurrency === 'USD') return priceStr;

  const converted = convertPriceString(priceStr, targetCurrency, rates);
  if (!converted) return priceStr;

  return `${priceStr} / ${converted.converted}`;
}

/**
 * Format a price ONLY in the local currency.
 * Falls back to original if conversion fails or rates are unavailable.
 */
export function formatLocalPrice(
  priceStr: string,
  targetCurrency: string,
  rates: ExchangeRates | null | undefined
): string {
  if (!rates || targetCurrency === 'USD') return priceStr;

  const converted = convertPriceString(priceStr, targetCurrency, rates);
  if (!converted) return priceStr;

  return converted.converted;
}

/**
 * Format text that contains a USD price (e.g. "3 nights from $135") with dual display.
 * Extracts $N pattern and appends local equivalent when currency is not USD.
 */
export function formatTextWithDualPrice(
  text: string,
  targetCurrency: string,
  rates: ExchangeRates | { base?: string; rates?: Record<string, number> } | null
): string {
  if (!targetCurrency || targetCurrency === 'USD') return text;
  if (!rates || typeof rates !== 'object' || !rates.rates || typeof rates.rates !== 'object') return text;
  try {
    const match = text.match(/\$([\d,]+(?:\.\d{2})?)/);
    if (!match) return text;
    const priceStr = `$${match[1]}`;
    const converted = convertPriceString(priceStr, targetCurrency, rates as ExchangeRates);
    if (!converted) return text;
    return `${text} / ${converted.converted}`;
  } catch {
    return text;
  }
}

/**
 * Format a numeric USD amount in the target currency.
 * Use when you have a number (e.g. dest.dailyCost) rather than a string.
 */
export function formatUSD(
  amountUSD: number,
  targetCurrency: string,
  rates: RatesInput
): string {
  if (targetCurrency === 'USD') return `$${amountUSD.toLocaleString()}`;
  return convertUSD(amountUSD, targetCurrency, rates).converted;
}
