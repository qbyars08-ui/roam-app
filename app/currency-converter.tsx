// =============================================================================
// ROAM — Full Currency Converter Screen
// Two large currency displays, custom number pad, common purchases, tipping
// =============================================================================
import React, { useCallback, useEffect, useMemo, useState } from 'react';
import {
  Pressable,
  ScrollView,
  StyleSheet,
  Text,
  View,
  type TextStyle,
  type ViewStyle,
} from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { useRouter, useLocalSearchParams } from 'expo-router';
import {
  ArrowLeftRight,
  ChevronLeft,
  Clock,
  Coffee,
  Car,
  UtensilsCrossed,
  Banknote,
  Info,
} from 'lucide-react-native';
import { useTranslation } from 'react-i18next';

import { COLORS, FONTS, SPACING, RADIUS } from '../lib/constants';
import { useAppStore } from '../lib/store';
import {
  getCurrencySymbol,
  getCurrencyName,
  fetchExchangeRates,
  type ExchangeRates,
} from '../lib/currency';
import { getDestinationCurrency } from '../lib/currency-history';
import { getCostOfLiving, type CostOfLiving } from '../lib/cost-of-living';
import * as Haptics from '../lib/haptics';

// ---------------------------------------------------------------------------
// Common purchases by destination currency (approximate local prices)
// ---------------------------------------------------------------------------
interface CommonPurchase {
  label: string;
  icon: typeof Coffee;
  localAmount: number;
}

function getCommonPurchases(
  destinationCurrency: string,
  costData: CostOfLiving | null,
): ReadonlyArray<CommonPurchase> {
  // Build purchases from cost-of-living data currency patterns
  const purchasesByCode: Record<string, ReadonlyArray<CommonPurchase>> = {
    JPY: [
      { label: 'Coffee', icon: Coffee, localAmount: 450 },
      { label: 'Taxi 5km', icon: Car, localAmount: 1200 },
      { label: 'Dinner', icon: UtensilsCrossed, localAmount: 3000 },
    ],
    EUR: [
      { label: 'Coffee', icon: Coffee, localAmount: 3 },
      { label: 'Taxi 5km', icon: Car, localAmount: 12 },
      { label: 'Dinner', icon: UtensilsCrossed, localAmount: 25 },
    ],
    GBP: [
      { label: 'Coffee', icon: Coffee, localAmount: 3.5 },
      { label: 'Taxi 5km', icon: Car, localAmount: 10 },
      { label: 'Dinner', icon: UtensilsCrossed, localAmount: 20 },
    ],
    THB: [
      { label: 'Coffee', icon: Coffee, localAmount: 60 },
      { label: 'Taxi 5km', icon: Car, localAmount: 100 },
      { label: 'Dinner', icon: UtensilsCrossed, localAmount: 300 },
    ],
    IDR: [
      { label: 'Coffee', icon: Coffee, localAmount: 25000 },
      { label: 'Taxi 5km', icon: Car, localAmount: 50000 },
      { label: 'Dinner', icon: UtensilsCrossed, localAmount: 100000 },
    ],
    MXN: [
      { label: 'Coffee', icon: Coffee, localAmount: 60 },
      { label: 'Taxi 5km', icon: Car, localAmount: 80 },
      { label: 'Dinner', icon: UtensilsCrossed, localAmount: 250 },
    ],
    KRW: [
      { label: 'Coffee', icon: Coffee, localAmount: 5000 },
      { label: 'Taxi 5km', icon: Car, localAmount: 6000 },
      { label: 'Dinner', icon: UtensilsCrossed, localAmount: 15000 },
    ],
    TRY: [
      { label: 'Coffee', icon: Coffee, localAmount: 80 },
      { label: 'Taxi 5km', icon: Car, localAmount: 120 },
      { label: 'Dinner', icon: UtensilsCrossed, localAmount: 400 },
    ],
    ZAR: [
      { label: 'Coffee', icon: Coffee, localAmount: 40 },
      { label: 'Taxi 5km', icon: Car, localAmount: 80 },
      { label: 'Dinner', icon: UtensilsCrossed, localAmount: 250 },
    ],
    HUF: [
      { label: 'Coffee', icon: Coffee, localAmount: 600 },
      { label: 'Taxi 5km', icon: Car, localAmount: 2000 },
      { label: 'Dinner', icon: UtensilsCrossed, localAmount: 5000 },
    ],
    MAD: [
      { label: 'Coffee', icon: Coffee, localAmount: 15 },
      { label: 'Taxi 5km', icon: Car, localAmount: 30 },
      { label: 'Dinner', icon: UtensilsCrossed, localAmount: 100 },
    ],
    INR: [
      { label: 'Coffee', icon: Coffee, localAmount: 150 },
      { label: 'Taxi 5km', icon: Car, localAmount: 200 },
      { label: 'Dinner', icon: UtensilsCrossed, localAmount: 500 },
    ],
    VND: [
      { label: 'Coffee', icon: Coffee, localAmount: 30000 },
      { label: 'Taxi 5km', icon: Car, localAmount: 50000 },
      { label: 'Dinner', icon: UtensilsCrossed, localAmount: 150000 },
    ],
    COP: [
      { label: 'Coffee', icon: Coffee, localAmount: 5000 },
      { label: 'Taxi 5km', icon: Car, localAmount: 12000 },
      { label: 'Dinner', icon: UtensilsCrossed, localAmount: 40000 },
    ],
    AUD: [
      { label: 'Coffee', icon: Coffee, localAmount: 5 },
      { label: 'Taxi 5km', icon: Car, localAmount: 15 },
      { label: 'Dinner', icon: UtensilsCrossed, localAmount: 30 },
    ],
    NZD: [
      { label: 'Coffee', icon: Coffee, localAmount: 6 },
      { label: 'Taxi 5km', icon: Car, localAmount: 18 },
      { label: 'Dinner', icon: UtensilsCrossed, localAmount: 35 },
    ],
  };

  return purchasesByCode[destinationCurrency] ?? [
    { label: 'Coffee', icon: Coffee, localAmount: 3 },
    { label: 'Taxi 5km', icon: Car, localAmount: 12 },
    { label: 'Dinner', icon: UtensilsCrossed, localAmount: 25 },
  ];
}

// ---------------------------------------------------------------------------
// Tipping data by destination
// ---------------------------------------------------------------------------
function getTippingGuide(
  destination: string,
  costData: CostOfLiving | null,
): string {
  if (costData?.tipping) {
    return costData.tipping;
  }
  // Fallback tipping notes by currency
  const fallbacks: Record<string, string> = {
    JPY: 'Tipping in Japan: Not expected. Can be considered rude.',
    THB: 'Tipping in Thailand: Not expected but 20-50 baht appreciated at restaurants.',
    EUR: 'Tipping in Europe: Service usually included. Round up for good service.',
    GBP: 'Tipping in the UK: 10-15% at restaurants. Not expected at pubs.',
    IDR: 'Tipping in Indonesia: 10% at restaurants. Round up for drivers.',
    MXN: 'Tipping in Mexico: 10-15% at restaurants. Propinas expected.',
    KRW: 'Tipping in South Korea: Not expected. Can cause confusion.',
    TRY: 'Tipping in Turkey: 5-10% at restaurants. Round up for taxis.',
  };
  const destCurrency = getDestinationCurrency(destination);
  if (destCurrency && fallbacks[destCurrency]) {
    return fallbacks[destCurrency];
  }
  return 'Check local customs for tipping practices at your destination.';
}

// ---------------------------------------------------------------------------
// Format helpers
// ---------------------------------------------------------------------------
const ZERO_DECIMAL_CURRENCIES = new Set(['JPY', 'KRW', 'VND', 'IDR', 'HUF', 'COP', 'ISK']);

function formatAmount(value: string, currencyCode: string): string {
  if (!value || value === '0') return '0';
  const num = parseFloat(value);
  if (isNaN(num)) return '0';
  const isZeroDecimal = ZERO_DECIMAL_CURRENCIES.has(currencyCode);
  if (isZeroDecimal) {
    return Math.round(num).toLocaleString('en-US', { maximumFractionDigits: 0 });
  }
  // Show decimals only if present in input
  if (value.includes('.')) {
    const decimals = value.split('.')[1]?.length ?? 0;
    return num.toLocaleString('en-US', {
      minimumFractionDigits: Math.min(decimals, 2),
      maximumFractionDigits: 2,
    });
  }
  return num.toLocaleString('en-US', { maximumFractionDigits: 0 });
}

function formatConvertedAmount(amount: number, currencyCode: string): string {
  const isZeroDecimal = ZERO_DECIMAL_CURRENCIES.has(currencyCode);
  if (isZeroDecimal) {
    return Math.round(amount).toLocaleString('en-US', { maximumFractionDigits: 0 });
  }
  return amount.toLocaleString('en-US', { minimumFractionDigits: 2, maximumFractionDigits: 2 });
}

function getMinutesAgo(updatedAt: string): number {
  const diff = Date.now() - new Date(updatedAt).getTime();
  return Math.max(0, Math.floor(diff / 60000));
}

// ---------------------------------------------------------------------------
// Quick amount buttons
// ---------------------------------------------------------------------------
const QUICK_AMOUNTS = [10, 50, 100, 500] as const;

// ---------------------------------------------------------------------------
// Number pad keys
// ---------------------------------------------------------------------------
const PAD_KEYS = [
  ['1', '2', '3'],
  ['4', '5', '6'],
  ['7', '8', '9'],
  ['.', '0', 'del'],
] as const;

// ---------------------------------------------------------------------------
// Component
// ---------------------------------------------------------------------------
export default function CurrencyConverterScreen() {
  const { t } = useTranslation();
  const insets = useSafeAreaInsets();
  const router = useRouter();
  const params = useLocalSearchParams<{ destination?: string }>();
  const destination = params.destination ?? '';

  const homeCurrency = useAppStore((s) => s.homeCurrency);
  const storeRates = useAppStore((s) => s.exchangeRates);
  const setExchangeRates = useAppStore((s) => s.setExchangeRates);

  const [rates, setRates] = useState<ExchangeRates | null>(storeRates);
  const [inputValue, setInputValue] = useState('0');
  const [isSwapped, setIsSwapped] = useState(false);

  const destCurrency = useMemo(
    () => getDestinationCurrency(destination) ?? 'EUR',
    [destination],
  );

  const costData = useMemo(
    () => getCostOfLiving(destination),
    [destination],
  );

  const fromCurrency = isSwapped ? destCurrency : homeCurrency;
  const toCurrency = isSwapped ? homeCurrency : destCurrency;

  // Fetch rates if not available
  useEffect(() => {
    if (rates) return;
    let cancelled = false;
    fetchExchangeRates()
      .then((r) => {
        if (!cancelled) {
          setRates(r);
          setExchangeRates(r);
        }
      })
      .catch(() => {});
    return () => { cancelled = true; };
  }, [rates, setExchangeRates]);

  // Convert amount
  const convertedAmount = useMemo(() => {
    if (!rates) return null;
    const num = parseFloat(inputValue) || 0;
    if (num === 0) return 0;

    const fromRate = rates.rates[fromCurrency] ?? (fromCurrency === 'USD' ? 1 : null);
    const toRate = rates.rates[toCurrency] ?? (toCurrency === 'USD' ? 1 : null);
    if (fromRate == null || toRate == null) return null;

    return (num / fromRate) * toRate;
  }, [inputValue, fromCurrency, toCurrency, rates]);

  // Exchange rate display (1 home = X dest)
  const rateDisplay = useMemo(() => {
    if (!rates) return null;
    const fromRate = rates.rates[fromCurrency] ?? (fromCurrency === 'USD' ? 1 : null);
    const toRate = rates.rates[toCurrency] ?? (toCurrency === 'USD' ? 1 : null);
    if (fromRate == null || toRate == null) return null;
    return toRate / fromRate;
  }, [fromCurrency, toCurrency, rates]);

  const minutesAgo = useMemo(
    () => (rates ? getMinutesAgo(rates.updatedAt) : null),
    [rates],
  );

  // Common purchases converted to home currency
  const purchases = useMemo(
    () => getCommonPurchases(destCurrency, costData),
    [destCurrency, costData],
  );

  const tippingGuide = useMemo(
    () => getTippingGuide(destination, costData),
    [destination, costData],
  );

  // Number pad handler
  const handlePadPress = useCallback((key: string) => {
    Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
    setInputValue((prev) => {
      if (key === 'del') {
        const next = prev.slice(0, -1);
        return next === '' || next === '-' ? '0' : next;
      }
      if (key === '.') {
        if (prev.includes('.')) return prev;
        return prev + '.';
      }
      // Max 12 digits
      const digits = prev.replace(/[^0-9]/g, '');
      if (digits.length >= 12) return prev;
      if (prev === '0' && key !== '.') return key;
      return prev + key;
    });
  }, []);

  // Quick amount handler
  const handleQuickAmount = useCallback((amount: number) => {
    Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Medium);
    setInputValue(String(amount));
  }, []);

  // Swap handler
  const handleSwap = useCallback(() => {
    Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Medium);
    setIsSwapped((prev) => !prev);
  }, []);

  // Convert a local purchase amount to home currency
  const convertLocalToHome = useCallback(
    (localAmount: number): string | null => {
      if (!rates) return null;
      const destRate = rates.rates[destCurrency] ?? (destCurrency === 'USD' ? 1 : null);
      const homeRate = rates.rates[homeCurrency] ?? (homeCurrency === 'USD' ? 1 : null);
      if (destRate == null || homeRate == null) return null;
      const converted = (localAmount / destRate) * homeRate;
      return `${getCurrencySymbol(homeCurrency)}${formatConvertedAmount(converted, homeCurrency)}`;
    },
    [rates, destCurrency, homeCurrency],
  );

  return (
    <View style={[styles.container, { paddingTop: insets.top }]}>
      {/* Header */}
      <View style={styles.header}>
        <Pressable
          onPress={() => {
            Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
            router.back();
          }}
          hitSlop={12}
          style={({ pressed }) => ({ opacity: pressed ? 0.6 : 1 })}
        >
          <ChevronLeft size={24} color={COLORS.cream} strokeWidth={1.5} />
        </Pressable>
        <Text style={styles.headerTitle}>
          {t('currency.converter', { defaultValue: 'Currency Converter' })}
        </Text>
        <View style={{ width: 24 }} />
      </View>

      <ScrollView
        style={styles.scrollView}
        contentContainerStyle={styles.scrollContent}
        showsVerticalScrollIndicator={false}
        keyboardShouldPersistTaps="handled"
      >
        {/* From currency display */}
        <View style={styles.currencyDisplayCard}>
          <View style={styles.currencyLabelRow}>
            <Text style={styles.currencyLabel}>
              {getCurrencyName(fromCurrency)}
            </Text>
            <Text style={styles.currencyCodeBadge}>{fromCurrency}</Text>
          </View>
          <Text style={styles.currencyAmount}>
            {getCurrencySymbol(fromCurrency)}{formatAmount(inputValue, fromCurrency)}
          </Text>
        </View>

        {/* Swap + rate row */}
        <View style={styles.swapRow}>
          <View style={styles.rateInfo}>
            {rateDisplay != null && (
              <>
                <Text style={styles.rateText}>
                  1 {fromCurrency} = {formatConvertedAmount(rateDisplay, toCurrency)} {toCurrency}
                </Text>
                {minutesAgo != null && (
                  <View style={styles.lastUpdatedRow}>
                    <Clock size={10} color={COLORS.muted} strokeWidth={1.5} />
                    <Text style={styles.lastUpdatedText}>
                      {minutesAgo === 0
                        ? t('currency.justNow', { defaultValue: 'Just now' })
                        : t('currency.updatedAgo', {
                            defaultValue: `Updated ${String(minutesAgo)} min ago`,
                          })}
                    </Text>
                  </View>
                )}
              </>
            )}
          </View>
          <Pressable
            style={({ pressed }) => [
              styles.swapButton,
              { opacity: pressed ? 0.7 : 1 },
            ]}
            onPress={handleSwap}
            accessibilityLabel="Swap currencies"
            accessibilityRole="button"
          >
            <ArrowLeftRight size={20} color={COLORS.sage} strokeWidth={1.5} />
          </Pressable>
        </View>

        {/* To currency display */}
        <View style={[styles.currencyDisplayCard, styles.currencyDisplayCardTo]}>
          <View style={styles.currencyLabelRow}>
            <Text style={styles.currencyLabel}>
              {getCurrencyName(toCurrency)}
            </Text>
            <Text style={styles.currencyCodeBadge}>{toCurrency}</Text>
          </View>
          <Text style={styles.convertedAmount}>
            {convertedAmount != null
              ? `${getCurrencySymbol(toCurrency)}${formatConvertedAmount(convertedAmount, toCurrency)}`
              : '--'}
          </Text>
        </View>

        {/* Quick amount buttons */}
        <View style={styles.quickAmountsRow}>
          {QUICK_AMOUNTS.map((amount) => (
            <Pressable
              key={amount}
              style={({ pressed }) => [
                styles.quickAmountBtn,
                { opacity: pressed ? 0.7 : 1 },
              ]}
              onPress={() => handleQuickAmount(amount)}
            >
              <Text style={styles.quickAmountText}>
                {getCurrencySymbol(fromCurrency)}{amount}
              </Text>
            </Pressable>
          ))}
        </View>

        {/* Number pad */}
        <View style={styles.numPad}>
          {PAD_KEYS.map((row, rowIndex) => (
            <View key={rowIndex} style={styles.numPadRow}>
              {row.map((key) => (
                <Pressable
                  key={key}
                  style={({ pressed }) => [
                    styles.numPadKey,
                    key === 'del' && styles.numPadKeyDel,
                    { opacity: pressed ? 0.6 : 1 },
                  ]}
                  onPress={() => handlePadPress(key)}
                >
                  <Text style={[
                    styles.numPadKeyText,
                    key === 'del' && styles.numPadKeyDelText,
                  ]}>
                    {key === 'del' ? '\u232B' : key}
                  </Text>
                </Pressable>
              ))}
            </View>
          ))}
        </View>

        {/* Common purchases section */}
        {destination !== '' && (
          <View style={styles.section}>
            <View style={styles.sectionHeader}>
              <Banknote size={16} color={COLORS.sage} strokeWidth={1.5} />
              <Text style={styles.sectionTitle}>
                {t('currency.commonPurchases', { defaultValue: 'Common Purchases' })}
              </Text>
            </View>
            {purchases.map((purchase) => {
              const IconComponent = purchase.icon;
              const homeEquiv = convertLocalToHome(purchase.localAmount);
              return (
                <View key={purchase.label} style={styles.purchaseRow}>
                  <IconComponent size={16} color={COLORS.creamMuted} strokeWidth={1.5} />
                  <Text style={styles.purchaseLabel}>{purchase.label}</Text>
                  <Text style={styles.purchaseLocal}>
                    {getCurrencySymbol(destCurrency)}
                    {formatConvertedAmount(purchase.localAmount, destCurrency)}
                  </Text>
                  {homeEquiv != null && (
                    <Text style={styles.purchaseHome}>{homeEquiv}</Text>
                  )}
                </View>
              );
            })}
          </View>
        )}

        {/* Tipping guide */}
        {destination !== '' && (
          <View style={styles.tippingCard}>
            <View style={styles.sectionHeader}>
              <Info size={16} color={COLORS.sage} strokeWidth={1.5} />
              <Text style={styles.sectionTitle}>
                {t('currency.tippingGuide', { defaultValue: 'Tipping Guide' })}
              </Text>
            </View>
            <Text style={styles.tippingText}>{tippingGuide}</Text>
          </View>
        )}

        <View style={{ height: insets.bottom + 40 }} />
      </ScrollView>
    </View>
  );
}

// ---------------------------------------------------------------------------
// Styles
// ---------------------------------------------------------------------------
const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: COLORS.bg,
  } as ViewStyle,
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: SPACING.lg,
    paddingVertical: SPACING.md,
  } as ViewStyle,
  headerTitle: {
    fontFamily: FONTS.header,
    fontSize: 18,
    color: COLORS.cream,
  } as TextStyle,
  scrollView: {
    flex: 1,
  } as ViewStyle,
  scrollContent: {
    paddingHorizontal: SPACING.lg,
  } as ViewStyle,

  // Currency displays
  currencyDisplayCard: {
    backgroundColor: COLORS.surface1,
    borderRadius: RADIUS.md,
    padding: SPACING.lg,
    borderWidth: 1,
    borderColor: COLORS.border,
  } as ViewStyle,
  currencyDisplayCardTo: {
    backgroundColor: COLORS.surface2,
    borderColor: COLORS.sageBorder,
  } as ViewStyle,
  currencyLabelRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: SPACING.sm,
    marginBottom: SPACING.sm,
  } as ViewStyle,
  currencyLabel: {
    fontFamily: FONTS.body,
    fontSize: 13,
    color: COLORS.creamMuted,
  } as TextStyle,
  currencyCodeBadge: {
    fontFamily: FONTS.mono,
    fontSize: 11,
    color: COLORS.sage,
    backgroundColor: COLORS.sageSubtle,
    paddingHorizontal: 6,
    paddingVertical: 2,
    borderRadius: RADIUS.sm,
    overflow: 'hidden',
    letterSpacing: 1,
  } as TextStyle,
  currencyAmount: {
    fontFamily: FONTS.mono,
    fontSize: 36,
    color: COLORS.cream,
    letterSpacing: -0.5,
  } as TextStyle,
  convertedAmount: {
    fontFamily: FONTS.mono,
    fontSize: 36,
    color: COLORS.sage,
    letterSpacing: -0.5,
  } as TextStyle,

  // Swap row
  swapRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingVertical: SPACING.md,
  } as ViewStyle,
  rateInfo: {
    flex: 1,
  } as ViewStyle,
  rateText: {
    fontFamily: FONTS.mono,
    fontSize: 12,
    color: COLORS.creamDim,
    letterSpacing: 0.5,
  } as TextStyle,
  lastUpdatedRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
    marginTop: 2,
  } as ViewStyle,
  lastUpdatedText: {
    fontFamily: FONTS.mono,
    fontSize: 10,
    color: COLORS.muted,
  } as TextStyle,
  swapButton: {
    width: 44,
    height: 44,
    borderRadius: 22,
    backgroundColor: COLORS.sageSubtle,
    borderWidth: 1,
    borderColor: COLORS.sageBorder,
    alignItems: 'center',
    justifyContent: 'center',
  } as ViewStyle,

  // Quick amounts
  quickAmountsRow: {
    flexDirection: 'row',
    gap: SPACING.sm,
    marginTop: SPACING.lg,
    marginBottom: SPACING.md,
  } as ViewStyle,
  quickAmountBtn: {
    flex: 1,
    backgroundColor: COLORS.surface1,
    borderRadius: RADIUS.pill,
    paddingVertical: SPACING.sm,
    alignItems: 'center',
    borderWidth: 1,
    borderColor: COLORS.border,
  } as ViewStyle,
  quickAmountText: {
    fontFamily: FONTS.mono,
    fontSize: 13,
    color: COLORS.creamDim,
    letterSpacing: 0.5,
  } as TextStyle,

  // Number pad
  numPad: {
    marginTop: SPACING.sm,
    marginBottom: SPACING.xl,
    gap: SPACING.sm,
  } as ViewStyle,
  numPadRow: {
    flexDirection: 'row',
    gap: SPACING.sm,
  } as ViewStyle,
  numPadKey: {
    flex: 1,
    height: 56,
    backgroundColor: COLORS.surface1,
    borderRadius: RADIUS.md,
    alignItems: 'center',
    justifyContent: 'center',
    borderWidth: 1,
    borderColor: COLORS.border,
  } as ViewStyle,
  numPadKeyDel: {
    backgroundColor: COLORS.bgGlass,
  } as ViewStyle,
  numPadKeyText: {
    fontFamily: FONTS.monoMedium,
    fontSize: 22,
    color: COLORS.cream,
  } as TextStyle,
  numPadKeyDelText: {
    fontSize: 24,
    color: COLORS.creamMuted,
  } as TextStyle,

  // Sections
  section: {
    backgroundColor: COLORS.surface1,
    borderRadius: RADIUS.md,
    padding: SPACING.lg,
    borderWidth: 1,
    borderColor: COLORS.border,
    marginBottom: SPACING.md,
  } as ViewStyle,
  sectionHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: SPACING.sm,
    marginBottom: SPACING.md,
  } as ViewStyle,
  sectionTitle: {
    fontFamily: FONTS.headerMedium,
    fontSize: 15,
    color: COLORS.cream,
  } as TextStyle,

  // Purchase rows
  purchaseRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: SPACING.sm,
    paddingVertical: SPACING.sm,
    borderBottomWidth: 1,
    borderBottomColor: COLORS.border,
  } as ViewStyle,
  purchaseLabel: {
    fontFamily: FONTS.body,
    fontSize: 14,
    color: COLORS.creamDim,
    flex: 1,
  } as TextStyle,
  purchaseLocal: {
    fontFamily: FONTS.mono,
    fontSize: 14,
    color: COLORS.cream,
    letterSpacing: 0.3,
  } as TextStyle,
  purchaseHome: {
    fontFamily: FONTS.mono,
    fontSize: 12,
    color: COLORS.muted,
    marginLeft: SPACING.xs,
    letterSpacing: 0.3,
  } as TextStyle,

  // Tipping card
  tippingCard: {
    backgroundColor: COLORS.surface1,
    borderRadius: RADIUS.md,
    padding: SPACING.lg,
    borderWidth: 1,
    borderColor: COLORS.border,
  } as ViewStyle,
  tippingText: {
    fontFamily: FONTS.body,
    fontSize: 14,
    color: COLORS.creamDim,
    lineHeight: 22,
  } as TextStyle,
});
