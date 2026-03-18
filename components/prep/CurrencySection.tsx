// =============================================================================
// CurrencySection — currency info, exchange rate sparkline, tipping, holidays
// =============================================================================
import React, { useEffect, useMemo, useState } from 'react';
import { View, Text, Pressable, StyleSheet, type ViewStyle, type TextStyle } from 'react-native';
import { useTranslation } from 'react-i18next';
import { useRouter } from 'expo-router';
import { Banknote, CreditCard, ChevronRight } from 'lucide-react-native';
import * as Haptics from '../../lib/haptics';
import { COLORS, FONTS, SPACING, RADIUS } from '../../lib/constants';
import { getCulturalGuideForDestination } from '../../lib/prep/cultural-data';
import { getCountryCode, getPublicHolidays, type PublicHoliday } from '../../lib/public-holidays';
import { getDestinationCurrency } from '../../lib/currency-history';
import { CurrencySparkline } from '../features/CurrencySparkline';
import { sharedStyles } from './prep-shared';

type Props = {
  cultural: ReturnType<typeof getCulturalGuideForDestination>;
  destination: string;
};

export default function CurrencySection({ cultural, destination }: Props) {
  const { t } = useTranslation();
  const router = useRouter();
  const [upcomingHolidays, setUpcomingHolidays] = useState<PublicHoliday[]>([]);

  useEffect(() => {
    const cc = getCountryCode(destination);
    if (!cc) return;
    let cancelled = false;
    const now = new Date();
    getPublicHolidays(cc, now.getFullYear()).then((holidays) => {
      if (cancelled) return;
      const upcoming = holidays.filter((h) => new Date(h.date) >= now).slice(0, 3);
      setUpcomingHolidays(upcoming);
    }).catch(() => {});
    return () => { cancelled = true; };
  }, [destination]);

  const targetCurrency = useMemo(() => getDestinationCurrency(destination), [destination]);

  if (!cultural) {
    return (
      <View style={sharedStyles.tabContent}>
        <Text style={sharedStyles.noDataText}>{`Currency info not available for ${destination}.`}</Text>
      </View>
    );
  }

  const { currency, tipping } = cultural;

  return (
    <View style={sharedStyles.tabContent}>
      <View style={styles.currencyHero}>
        <Text style={styles.currencySymbol}>{currency.symbol}</Text>
        <Text style={styles.currencyCode}>{currency.code}</Text>
      </View>

      {/* Live exchange rate sparkline (30-day) */}
      {targetCurrency && targetCurrency !== 'USD' && (
        <View style={{ marginBottom: SPACING.lg }}>
          <CurrencySparkline
            baseCurrency="USD"
            targetCurrency={targetCurrency}
            destinationName={destination}
          />
        </View>
      )}

      <View style={sharedStyles.infoCard}>
        <View style={sharedStyles.infoCardRow}>
          <Banknote size={16} color={COLORS.sage} />
          <Text style={sharedStyles.infoCardLabel}>{t('prep.localTip', { defaultValue: 'Local Tip' })}</Text>
        </View>
        <Text style={sharedStyles.infoCardBody}>{currency.tip}</Text>
      </View>

      <View style={sharedStyles.infoCard}>
        <View style={sharedStyles.infoCardRow}>
          <CreditCard size={16} color={COLORS.gold} />
          <Text style={sharedStyles.infoCardLabel}>{t('prep.tippingCulture', { defaultValue: 'Tipping Culture' })}</Text>
        </View>
        <Text style={sharedStyles.infoCardBody}>{tipping}</Text>
      </View>

      {/* Upcoming public holidays */}
      {upcomingHolidays.length > 0 && (
        <>
          <Text style={sharedStyles.currencySectionLabel}>{t('prep.upcomingHolidays', { defaultValue: 'Upcoming Holidays' })}</Text>
          {upcomingHolidays.map((h, i) => (
            <View key={i} style={sharedStyles.currencyTipRow}>
              <View style={[sharedStyles.currencyTipDot, { backgroundColor: COLORS.gold }]} />
              <Text style={sharedStyles.currencyTipText}>
                {new Date(h.date).toLocaleDateString('en-US', { month: 'short', day: 'numeric' })} — {h.name}
              </Text>
            </View>
          ))}
        </>
      )}

      <Text style={sharedStyles.currencySectionLabel}>{t('prep.paymentTips', { defaultValue: 'Payment Tips' })}</Text>
      {[
        t('prep.paymentTip1', { defaultValue: 'Text your bank before departure — or your card gets blocked on day one' }),
        t('prep.paymentTip2', { defaultValue: 'Small bills win at street food stalls and local taxis' }),
        t('prep.paymentTip3', { defaultValue: 'Airport exchange = tourist tax. ATMs or local banks only' }),
        t('prep.paymentTip4', { defaultValue: 'No-foreign-fee card? Bring it. It pays for itself in a weekend' }),
      ].map((tip, i) => (
        <View key={i} style={sharedStyles.currencyTipRow}>
          <View style={sharedStyles.currencyTipDot} />
          <Text style={sharedStyles.currencyTipText}>{tip}</Text>
        </View>
      ))}

      {/* Full Converter CTA */}
      <Pressable
        style={({ pressed }) => [
          styles.fullConverterBtn,
          { opacity: pressed ? 0.8 : 1 },
        ]}
        onPress={() => {
          Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
          router.push({ pathname: '/currency-converter', params: { destination } });
        }}
        accessibilityLabel={t('prep.fullConverter', { defaultValue: 'Full Converter' })}
        accessibilityRole="button"
      >
        <Banknote size={16} color={COLORS.sage} strokeWidth={1.5} />
        <Text style={styles.fullConverterText}>
          {t('prep.fullConverter', { defaultValue: 'Full Converter' })}
        </Text>
        <ChevronRight size={16} color={COLORS.creamMuted} strokeWidth={1.5} />
      </Pressable>
    </View>
  );
}

const styles = StyleSheet.create({
  currencyHero: {
    alignItems: 'center',
    marginBottom: SPACING.lg,
  } as ViewStyle,
  currencySymbol: {
    fontFamily: FONTS.header,
    fontSize: 48,
    color: COLORS.cream,
  } as TextStyle,
  currencyCode: {
    fontFamily: FONTS.mono,
    fontSize: 14,
    color: COLORS.sage,
    letterSpacing: 2,
  } as TextStyle,
  fullConverterBtn: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: SPACING.sm,
    backgroundColor: COLORS.sageSubtle,
    borderRadius: RADIUS.pill,
    paddingVertical: SPACING.md,
    paddingHorizontal: SPACING.lg,
    marginTop: SPACING.lg,
    borderWidth: 1,
    borderColor: COLORS.sageBorder,
  } as ViewStyle,
  fullConverterText: {
    fontFamily: FONTS.bodyMedium,
    fontSize: 14,
    color: COLORS.cream,
    flex: 1,
  } as TextStyle,
});
