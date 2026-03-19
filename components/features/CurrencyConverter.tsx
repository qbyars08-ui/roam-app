// =============================================================================
// ROAM — CurrencyConverter: inline card for live currency conversion
// =============================================================================
import React, { useCallback, useEffect, useMemo, useState } from 'react';
import { View, Text, TextInput } from 'react-native';
import { ArrowUpRight, ArrowDownRight, ArrowLeftRight } from 'lucide-react-native';
import { COLORS, FONTS, SPACING, RADIUS } from '../../lib/constants';
import { getExchangeRates, convertCurrency, formatCurrencyAmount } from '../../lib/exchange-rates';
import { getCurrencyHistory } from '../../lib/currency-history';
import type { ExchangeRateData } from '../../lib/exchange-rates';
import type { CurrencyHistory } from '../../lib/currency-history';
import FadeIn from '../ui/FadeIn';
import PressableScale from '../ui/PressableScale';

interface CurrencyConverterProps {
  destinationCurrency: string;
  destinationName: string;
}

const QUICK_AMOUNTS = [10, 20, 50, 100];

export const CurrencyConverter: React.FC<CurrencyConverterProps> = ({
  destinationCurrency,
  destinationName,
}) => {
  const [inputAmount, setInputAmount] = useState('');
  const [rates, setRates] = useState<ExchangeRateData | null>(null);
  const [history, setHistory] = useState<CurrencyHistory | null>(null);
  const [swapped, setSwapped] = useState(false);

  const fromCurrency = swapped ? destinationCurrency : 'USD';
  const toCurrency = swapped ? 'USD' : destinationCurrency;

  useEffect(() => {
    const fetchData = async () => {
      const [ratesData, historyData] = await Promise.all([
        getExchangeRates('USD'),
        getCurrencyHistory('USD', destinationCurrency),
      ]);
      if (ratesData) setRates(ratesData);
      if (historyData) setHistory(historyData);
    };
    fetchData();
  }, [destinationCurrency]);

  const numericAmount = useMemo(() => {
    const parsed = parseFloat(inputAmount);
    return Number.isFinite(parsed) && parsed >= 0 ? parsed : 0;
  }, [inputAmount]);

  const convertedAmount = useMemo(() => {
    if (numericAmount === 0 || !rates) return null;
    return convertCurrency(numericAmount, fromCurrency, toCurrency, rates);
  }, [numericAmount, fromCurrency, toCurrency, rates]);

  const rateDisplay = useMemo(() => {
    if (!rates) return null;
    const oneUnit = convertCurrency(1, fromCurrency, toCurrency, rates);
    if (oneUnit == null) return null;
    const decimals = toCurrency === 'JPY' || toCurrency === 'KRW' ? 0 : 2;
    return `1 ${fromCurrency} = ${oneUnit.toFixed(decimals)} ${toCurrency}`;
  }, [rates, fromCurrency, toCurrency]);

  const trend = useMemo(() => {
    if (!history) return null;
    const pct = history.change30d;
    const isPositive = pct >= 0;
    return { pct, isPositive, color: isPositive ? COLORS.sage : COLORS.coral };
  }, [history]);

  const handleQuickAmount = useCallback((amount: number) => {
    setInputAmount(String(amount));
  }, []);

  const handleSwap = useCallback(() => {
    setSwapped((prev) => !prev);
  }, []);

  const handleChangeText = useCallback((text: string) => {
    const cleaned = text.replace(/[^0-9.]/g, '');
    const parts = cleaned.split('.');
    const sanitized = parts.length > 2 ? `${parts[0]}.${parts.slice(1).join('')}` : cleaned;
    setInputAmount(sanitized);
  }, []);

  if (!rates) return null;

  return (
    <FadeIn>
      <View style={{
        backgroundColor: COLORS.surface1,
        borderColor: COLORS.border,
        borderWidth: 1,
        borderRadius: RADIUS.md,
        padding: SPACING.md,
        gap: SPACING.md,
      }}>
        {/* Input row */}
        <View style={{ flexDirection: 'row', alignItems: 'center', gap: SPACING.sm }}>
          <Text style={{
            fontFamily: FONTS.mono,
            fontSize: 14,
            color: COLORS.creamFaint,
          }}>
            {fromCurrency}
          </Text>
          <TextInput
            style={{
              flex: 1,
              fontFamily: FONTS.mono,
              fontSize: 18,
              color: COLORS.cream,
              backgroundColor: COLORS.surface2,
              borderRadius: RADIUS.sm,
              paddingHorizontal: SPACING.sm,
              paddingVertical: SPACING.sm,
            }}
            value={inputAmount}
            onChangeText={handleChangeText}
            placeholder="0.00"
            placeholderTextColor={COLORS.muted}
            keyboardType="decimal-pad"
            returnKeyType="done"
          />
          <PressableScale onPress={handleSwap} accessibilityLabel="Swap currencies">
            <View style={{
              backgroundColor: COLORS.surface2,
              borderRadius: RADIUS.pill,
              padding: SPACING.sm,
            }}>
              <ArrowLeftRight size={18} color={COLORS.sage} strokeWidth={1.5} />
            </View>
          </PressableScale>
        </View>

        {/* Converted output */}
        <View style={{ alignItems: 'center', paddingVertical: SPACING.xs }}>
          <Text style={{
            fontFamily: FONTS.header,
            fontSize: 32,
            fontWeight: 'bold',
            color: COLORS.cream,
          }}>
            {convertedAmount != null
              ? formatCurrencyAmount(convertedAmount, toCurrency)
              : `0 ${toCurrency}`}
          </Text>
          <Text style={{
            fontFamily: FONTS.mono,
            fontSize: 12,
            color: COLORS.creamFaint,
            marginTop: SPACING.xs,
          }}>
            {destinationName}
          </Text>
        </View>

        {/* Rate + trend row */}
        <View style={{ flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between' }}>
          {rateDisplay && (
            <Text style={{ fontFamily: FONTS.mono, fontSize: 12, color: COLORS.creamDim }}>
              {rateDisplay}
            </Text>
          )}
          {trend && (
            <View style={{ flexDirection: 'row', alignItems: 'center', gap: 4 }}>
              {trend.isPositive
                ? <ArrowUpRight size={14} color={trend.color} strokeWidth={1.5} />
                : <ArrowDownRight size={14} color={trend.color} strokeWidth={1.5} />}
              <Text style={{ fontFamily: FONTS.mono, fontSize: 11, color: trend.color }}>
                {trend.isPositive ? '+' : ''}{trend.pct.toFixed(1)}% vs last month
              </Text>
            </View>
          )}
        </View>

        {/* Quick amounts */}
        <View style={{ flexDirection: 'row', gap: SPACING.sm }}>
          {QUICK_AMOUNTS.map((amount) => (
            <PressableScale key={amount} onPress={() => handleQuickAmount(amount)} style={{ flex: 1 }}>
              <View style={{
                backgroundColor: COLORS.surface2,
                borderRadius: RADIUS.pill,
                paddingVertical: SPACING.sm,
                alignItems: 'center',
              }}>
                <Text style={{ fontFamily: FONTS.mono, fontSize: 13, color: COLORS.creamSoft }}>
                  ${amount}
                </Text>
              </View>
            </PressableScale>
          ))}
        </View>
      </View>
    </FadeIn>
  );
};
