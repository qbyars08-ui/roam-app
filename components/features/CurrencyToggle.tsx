// =============================================================================
// ROAM — Currency Toggle: Switch prices to your home currency
// =============================================================================
import React, { useEffect, useState, useCallback } from 'react';
import {
  Linking,
  Modal,
  Pressable,
  ScrollView,
  StyleSheet,
  Text,
  View,
  type TextStyle,
  type ViewStyle,
} from 'react-native';
import { COLORS, FONTS, SPACING, RADIUS } from '../../lib/constants';
import {
  setHomeCurrency as persistHomeCurrency,
  getCurrencySymbol,
  getCurrencyName,
  fetchExchangeRates,
  POPULAR_CURRENCIES,
  type ExchangeRates,
} from '../../lib/currency';
import { useAppStore } from '../../lib/store';

// ---------------------------------------------------------------------------
// Props
// ---------------------------------------------------------------------------
interface CurrencyToggleProps {
  onCurrencyChange?: (code: string, rates: ExchangeRates) => void;
  /** Subtle variant: smaller pill for itinerary header */
  subtle?: boolean;
}

// ---------------------------------------------------------------------------
// Component
// ---------------------------------------------------------------------------
export default function CurrencyToggle({ onCurrencyChange, subtle }: CurrencyToggleProps) {
  const homeCurrency = useAppStore((s) => s.homeCurrency);
  const rates = useAppStore((s) => s.exchangeRates);
  const setHomeCurrencyStore = useAppStore((s) => s.setHomeCurrency);
  const setExchangeRates = useAppStore((s) => s.setExchangeRates);
  const [pickerVisible, setPickerVisible] = useState(false);

  // Ensure rates loaded (store init does this; retry if missing)
  useEffect(() => {
    if (rates) return;
    let cancelled = false;
    fetchExchangeRates()
      .then((r) => { if (!cancelled) setExchangeRates(r); })
      .catch(() => {});
    return () => { cancelled = true; };
  }, [rates, setExchangeRates]);

  const handleSelect = useCallback(
    async (code: string) => {
      setPickerVisible(false);
      await setHomeCurrencyStore(code);
      if (rates) onCurrencyChange?.(code, rates);
    },
    [setHomeCurrencyStore, rates, onCurrencyChange]
  );

  return (
    <>
      {/* Toggle Button */}
      <Pressable
        style={({ pressed }) => [
          subtle ? styles.toggleSubtle : styles.toggle,
          { opacity: pressed ? 0.8 : 1 },
        ]}
        onPress={() => setPickerVisible(true)}
      >
        <Text style={subtle ? styles.toggleSymbolSubtle : styles.toggleSymbol}>
          {getCurrencySymbol(homeCurrency)}
        </Text>
        <Text style={subtle ? styles.toggleCodeSubtle : styles.toggleCode}>
          {homeCurrency}
        </Text>
      </Pressable>

      {/* Currency Picker Modal */}
      <Modal
        visible={pickerVisible}
        transparent
        animationType="slide"
        onRequestClose={() => setPickerVisible(false)}
      >
        <View style={styles.modalOverlay}>
          <View style={styles.modalContent}>
            <View style={styles.modalHeader}>
              <Text style={styles.modalTitle}>Home Currency</Text>
              <Pressable onPress={() => setPickerVisible(false)} hitSlop={12}>
                <Text style={styles.modalClose}>{'\u2715'}</Text>
              </Pressable>
            </View>
            <Text style={styles.modalSubtitle}>
              All trip prices will show your local equivalent
            </Text>
            <Text style={styles.attribution}>
              Rates by{' '}
              <Text
                style={styles.attributionLink}
                onPress={() => Linking.openURL('https://www.frankfurter.app/')}
              >
                Frankfurter
              </Text>
            </Text>
            <ScrollView
              style={styles.currencyList}
              showsVerticalScrollIndicator={false}
            >
              {POPULAR_CURRENCIES.map((code) => (
                <Pressable
                  key={code}
                  style={({ pressed }) => [
                    styles.currencyRow,
                    code === homeCurrency && styles.currencyRowActive,
                    { opacity: pressed ? 0.8 : 1 },
                  ]}
                  onPress={() => handleSelect(code)}
                >
                  <Text style={styles.currencySymbol}>
                    {getCurrencySymbol(code)}
                  </Text>
                  <View style={styles.currencyInfo}>
                    <Text style={styles.currencyCode}>{code}</Text>
                    <Text style={styles.currencyName}>
                      {getCurrencyName(code)}
                    </Text>
                  </View>
                  {code === homeCurrency && (
                    <Text style={styles.checkmark}>{'\u2713'}</Text>
                  )}
                </Pressable>
              ))}
              <View style={{ height: 40 }} />
            </ScrollView>
          </View>
        </View>
      </Modal>
    </>
  );
}

// ---------------------------------------------------------------------------
// Hook: useCurrency — for other components that need currency data
// ---------------------------------------------------------------------------
export function useCurrency() {
  const currency = useAppStore((s) => s.homeCurrency);
  const rates = useAppStore((s) => s.exchangeRates);
  return { currency, rates, loading: !rates };
}

// ---------------------------------------------------------------------------
// Styles
// ---------------------------------------------------------------------------
const styles = StyleSheet.create({
  toggle: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
    backgroundColor: COLORS.bgGlass,
    borderRadius: RADIUS.full,
    paddingHorizontal: SPACING.sm,
    paddingVertical: 6,
    borderWidth: 1,
    borderColor: COLORS.border,
  } as ViewStyle,
  toggleSymbol: {
    fontFamily: FONTS.bodySemiBold,
    fontSize: 14,
    color: COLORS.sage,
  } as TextStyle,
  toggleCode: {
    fontFamily: FONTS.mono,
    fontSize: 11,
    color: COLORS.creamMuted,
    letterSpacing: 1,
  } as TextStyle,

  // Subtle variant (itinerary header)
  toggleSubtle: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 2,
    backgroundColor: 'rgba(124,175,138,0.12)',
    borderRadius: RADIUS.full,
    paddingHorizontal: 8,
    paddingVertical: 4,
    borderWidth: 1,
    borderColor: 'rgba(124,175,138,0.25)',
  } as ViewStyle,
  toggleSymbolSubtle: {
    fontFamily: FONTS.bodyMedium,
    fontSize: 11,
    color: COLORS.sage,
  } as TextStyle,
  toggleCodeSubtle: {
    fontFamily: FONTS.mono,
    fontSize: 9,
    color: COLORS.creamMuted,
    letterSpacing: 0.5,
  } as TextStyle,

  // Modal
  modalOverlay: {
    flex: 1,
    backgroundColor: 'rgba(0,0,0,0.7)',
    justifyContent: 'flex-end',
  } as ViewStyle,
  modalContent: {
    backgroundColor: COLORS.bg,
    borderTopLeftRadius: 20,
    borderTopRightRadius: 20,
    paddingTop: SPACING.lg,
    maxHeight: '70%',
  } as ViewStyle,
  modalHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingHorizontal: SPACING.lg,
    marginBottom: 4,
  } as ViewStyle,
  modalTitle: {
    fontFamily: FONTS.header,
    fontSize: 22,
    color: COLORS.cream,
  } as TextStyle,
  modalClose: {
    fontSize: 20,
    color: COLORS.creamMuted,
  } as TextStyle,
  modalSubtitle: {
    fontFamily: FONTS.body,
    fontSize: 13,
    color: COLORS.creamMuted,
    paddingHorizontal: SPACING.lg,
    marginBottom: SPACING.xs,
  } as TextStyle,
  attribution: {
    fontFamily: FONTS.mono,
    fontSize: 10,
    color: 'rgba(245,237,216,0.4)',
    paddingHorizontal: SPACING.lg,
    marginBottom: SPACING.md,
  } as TextStyle,
  attributionLink: {
    color: COLORS.sage,
    textDecorationLine: 'underline',
  } as TextStyle,
  currencyList: {
    paddingHorizontal: SPACING.lg,
  } as ViewStyle,
  currencyRow: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingVertical: SPACING.md,
    borderBottomWidth: 1,
    borderBottomColor: COLORS.border,
    gap: SPACING.md,
  } as ViewStyle,
  currencyRowActive: {
    backgroundColor: 'rgba(124,175,138,0.08)',
    borderRadius: RADIUS.md,
    paddingHorizontal: SPACING.sm,
    marginHorizontal: -SPACING.sm,
  } as ViewStyle,
  currencySymbol: {
    fontFamily: FONTS.header,
    fontSize: 22,
    color: COLORS.cream,
    width: 36,
    textAlign: 'center',
  } as TextStyle,
  currencyInfo: {
    flex: 1,
  } as ViewStyle,
  currencyCode: {
    fontFamily: FONTS.bodySemiBold,
    fontSize: 15,
    color: COLORS.cream,
  } as TextStyle,
  currencyName: {
    fontFamily: FONTS.body,
    fontSize: 12,
    color: COLORS.creamMuted,
  } as TextStyle,
  checkmark: {
    fontFamily: FONTS.bodySemiBold,
    fontSize: 18,
    color: COLORS.sage,
  } as TextStyle,
});
