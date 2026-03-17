import React, { useEffect, useState, useMemo } from 'react';
import { View, Text, TextInput, StyleSheet } from 'react-native';
import { useTranslation } from 'react-i18next';
import { COLORS, FONTS, SPACING, RADIUS } from '../../lib/constants';
import {
  getExchangeRates,
  convertCurrency,
  formatCurrencyAmount,
} from '../../lib/exchange-rates';
import type { ExchangeRateData } from '../../lib/exchange-rates';
import { getCountryCode } from '../../lib/public-holidays';

const COUNTRY_CURRENCY: Record<string, string> = {
  JP: 'JPY', FR: 'EUR', ID: 'IDR', TH: 'THB', US: 'USD',
  ES: 'EUR', IT: 'EUR', GB: 'GBP', MA: 'MAD', PT: 'EUR',
  KR: 'KRW', HU: 'HUF', TR: 'TRY', MX: 'MXN', NL: 'EUR',
  AE: 'AED', ZA: 'ZAR', AU: 'AUD', AR: 'ARS', GE: 'GEL',
  VN: 'VND', HR: 'EUR', CO: 'COP', IN: 'INR', NZ: 'NZD',
  IS: 'ISK',
};

const QUICK_AMOUNTS = [20, 50, 200];

interface CurrencyQuickCardProps {
  destination: string;
}

export default function CurrencyQuickCard({ destination }: CurrencyQuickCardProps) {
  const { t } = useTranslation();
  const [rates, setRates] = useState<ExchangeRateData | null>(null);
  const [localCurrency, setLocalCurrency] = useState<string | null>(null);
  const [usdInput, setUsdInput] = useState('');

  useEffect(() => {
    let cancelled = false;

    async function load() {
      const code = getCountryCode(destination);
      if (!code) return;

      const currency = COUNTRY_CURRENCY[code] ?? null;
      if (!currency || currency === 'USD') return;

      const rateData = await getExchangeRates('USD');
      if (!cancelled && rateData) {
        setLocalCurrency(currency);
        setRates(rateData);
      }
    }

    load();

    return () => {
      cancelled = true;
    };
  }, [destination]);

  const mainConversion = useMemo(() => {
    if (!rates || !localCurrency) return null;
    const converted = convertCurrency(100, 'USD', localCurrency, rates);
    if (converted == null) return null;
    return formatCurrencyAmount(converted, localCurrency);
  }, [rates, localCurrency]);

  const quickConversions = useMemo(() => {
    if (!rates || !localCurrency) return [];
    return QUICK_AMOUNTS.map((amount) => {
      const converted = convertCurrency(amount, 'USD', localCurrency, rates);
      return {
        usd: `$${amount}`,
        local: converted != null ? formatCurrencyAmount(converted, localCurrency) : '--',
      };
    });
  }, [rates, localCurrency]);

  const calculatorResult = useMemo(() => {
    if (!rates || !localCurrency) return null;
    const amount = parseFloat(usdInput.replace(/[^0-9.]/g, ''));
    if (Number.isNaN(amount) || amount <= 0) return null;
    const converted = convertCurrency(amount, 'USD', localCurrency, rates);
    return converted != null ? formatCurrencyAmount(converted, localCurrency) : null;
  }, [rates, localCurrency, usdInput]);

  if (!rates || !localCurrency || !mainConversion) return null;

  return (
    <View style={styles.container}>
      <Text style={styles.sectionHeader}>{t('currency.title', { defaultValue: 'Currency' })}</Text>

      <View style={styles.card}>
        <Text style={styles.usdLabel}>{t('currency.usdLabel', { defaultValue: '$100 USD =' })}</Text>
        <Text style={styles.convertedValue}>{mainConversion}</Text>

        <Text style={styles.lastUpdated}>{t('currency.lastUpdated', { defaultValue: 'Last updated' })} {rates.date}</Text>

        <View style={styles.calculatorRow}>
          <Text style={styles.calculatorLabel}>{t('currency.calculator', { defaultValue: 'Calculator' })}</Text>
          <View style={styles.calculatorInputRow}>
            <Text style={styles.calculatorPrefix}>$</Text>
            <TextInput
              style={styles.calculatorInput}
              value={usdInput}
              onChangeText={setUsdInput}
              placeholder="0"
              placeholderTextColor={COLORS.creamMuted}
              keyboardType="decimal-pad"
            />
            <Text style={styles.calculatorEquals}>=</Text>
            <Text style={styles.calculatorResult}>{calculatorResult ?? '—'}</Text>
          </View>
        </View>

        <View style={styles.quickRow}>
          {quickConversions.map((item) => (
            <View key={item.usd} style={styles.quickItem}>
              <Text style={styles.quickUsd}>{item.usd}</Text>
              <Text style={styles.quickLocal}>{item.local}</Text>
            </View>
          ))}
        </View>
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    gap: SPACING.sm,
  },
  sectionHeader: {
    fontFamily: FONTS.header,
    fontSize: 22,
    color: COLORS.cream,
  },
  card: {
    backgroundColor: COLORS.bgCard,
    borderWidth: 1,
    borderColor: COLORS.border,
    borderRadius: RADIUS.lg,
    padding: SPACING.md,
    gap: SPACING.sm,
  },
  usdLabel: {
    fontFamily: FONTS.body,
    fontSize: 14,
    color: COLORS.creamMuted,
  },
  convertedValue: {
    fontFamily: FONTS.header,
    fontSize: 28,
    color: COLORS.gold,
  },
  lastUpdated: {
    fontFamily: FONTS.mono,
    fontSize: 10,
    color: COLORS.creamMuted,
  },
  calculatorRow: {
    marginTop: SPACING.sm,
    gap: SPACING.xs,
  },
  calculatorLabel: {
    fontFamily: FONTS.mono,
    fontSize: 10,
    color: COLORS.creamMuted,
    letterSpacing: 0.5,
  },
  calculatorInputRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: SPACING.xs,
  },
  calculatorPrefix: {
    fontFamily: FONTS.mono,
    fontSize: 16,
    color: COLORS.creamMuted,
  },
  calculatorInput: {
    fontFamily: FONTS.mono,
    fontSize: 16,
    color: COLORS.cream,
    minWidth: 60,
    paddingVertical: SPACING.xs,
    paddingHorizontal: SPACING.sm,
    backgroundColor: COLORS.surface1,
    borderRadius: RADIUS.sm,
    borderWidth: 1,
    borderColor: COLORS.border,
  },
  calculatorEquals: {
    fontFamily: FONTS.mono,
    fontSize: 14,
    color: COLORS.creamMuted,
  },
  calculatorResult: {
    fontFamily: FONTS.mono,
    fontSize: 14,
    color: COLORS.gold,
    flex: 1,
  },
  quickRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    marginTop: SPACING.xs,
  },
  quickItem: {
    alignItems: 'center',
    gap: SPACING.xs,
  },
  quickUsd: {
    fontFamily: FONTS.mono,
    fontSize: 12,
    color: COLORS.creamMuted,
  },
  quickLocal: {
    fontFamily: FONTS.mono,
    fontSize: 12,
    color: COLORS.cream,
  },
});
