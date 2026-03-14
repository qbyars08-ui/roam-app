// =============================================================================
// ROAM — Exchange Rates (free, no API key)
// Uses Frankfurter API — ECB data, updated daily ~16:00 CET
// =============================================================================
import AsyncStorage from '@react-native-async-storage/async-storage';

export interface ExchangeRateData {
  base: string;
  date: string;               // YYYY-MM-DD
  rates: Record<string, number>;
  fetchedAt: number;
}

const CACHE_KEY = 'roam_exchange_rates';
const CACHE_TTL = 24 * 60 * 60 * 1000; // 24 hours

const TRAVEL_CURRENCIES = [
  'USD', 'EUR', 'GBP', 'JPY', 'THB', 'IDR', 'MXN', 'MAD',
  'ZAR', 'HUF', 'KRW', 'TRY', 'AED', 'AUD', 'NZD', 'INR',
  'COP', 'GEL', 'HRK', 'ISK', 'VND', 'ARS', 'BRL', 'CAD',
  'CHF', 'CNY', 'SGD', 'SEK', 'NOK', 'DKK', 'PLN', 'CZK',
  'PHP', 'MYR', 'TWD',
];

export async function getExchangeRates(
  baseCurrency = 'USD',
): Promise<ExchangeRateData | null> {
  const cacheKey = `${CACHE_KEY}::${baseCurrency}`;

  try {
    const cached = await AsyncStorage.getItem(cacheKey);
    if (cached) {
      const parsed: ExchangeRateData = JSON.parse(cached);
      if (Date.now() - parsed.fetchedAt < CACHE_TTL) {
        return parsed;
      }
    }
  } catch {
    // Cache miss
  }

  try {
    const symbols = TRAVEL_CURRENCIES.filter((c) => c !== baseCurrency).join(',');
    const url = `https://api.frankfurter.dev/v1/latest?base=${baseCurrency}&symbols=${symbols}`;
    const response = await fetch(url);
    if (!response.ok) return null;

    const data = await response.json();
    if (!data.rates) return null;

    const result: ExchangeRateData = {
      base: data.base ?? baseCurrency,
      date: data.date ?? '',
      rates: data.rates,
      fetchedAt: Date.now(),
    };

    try {
      await AsyncStorage.setItem(cacheKey, JSON.stringify(result));
    } catch {
      // Non-critical
    }

    return result;
  } catch {
    return null;
  }
}

/**
 * Convert an amount from one currency to another using fetched rates.
 * Both currencies must be present in the rates (relative to the base).
 */
export function convertCurrency(
  amount: number,
  from: string,
  to: string,
  rates: ExchangeRateData,
): number | null {
  if (from === to) return amount;

  if (from === rates.base) {
    const rate = rates.rates[to];
    return rate != null ? amount * rate : null;
  }

  if (to === rates.base) {
    const rate = rates.rates[from];
    return rate != null ? amount / rate : null;
  }

  const fromRate = rates.rates[from];
  const toRate = rates.rates[to];
  if (fromRate == null || toRate == null) return null;

  return (amount / fromRate) * toRate;
}

/**
 * Format a currency amount with the correct symbol and locale.
 */
export function formatCurrencyAmount(
  amount: number,
  currency: string,
): string {
  try {
    return new Intl.NumberFormat('en-US', {
      style: 'currency',
      currency,
      maximumFractionDigits: currency === 'JPY' || currency === 'KRW' ? 0 : 2,
    }).format(amount);
  } catch {
    return `${amount.toFixed(2)} ${currency}`;
  }
}
