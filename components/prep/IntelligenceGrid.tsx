// =============================================================================
// IntelligenceGrid — 2x2 intelligence cards
// Clean icon + label + value. Equal height. No cramming.
// =============================================================================
import React, { useEffect, useState } from 'react';
import { View, Text, Pressable, Linking, StyleSheet, type ViewStyle, type TextStyle } from 'react-native';
import { useRouter } from 'expo-router';
import { useTranslation } from 'react-i18next';
import { Shield, Banknote, Cloud, FileCheck } from 'lucide-react-native';
import * as Haptics from '../../lib/haptics';
import { COLORS, FONTS, SPACING, RADIUS } from '../../lib/constants';
import type { SafetyData } from '../../lib/prep/safety-data';
import type { DailyForecast } from '../../lib/weather-forecast';
import { geocodeCity } from '../../lib/geocoding';
import { getWeatherForecast } from '../../lib/weather-forecast';
import { getExchangeRates } from '../../lib/exchange-rates';
import { getCountryCode } from '../../lib/public-holidays';
import { getVisaInfo, type PassportNationality } from '../../lib/visa-intel';
import type { VisaResult } from '../../lib/apis/sherpa';

type Props = {
  destination: string;
  safety: SafetyData | null;
  visaReqs?: VisaResult | null;
  passportCode?: PassportNationality;
};

const COUNTRY_CURRENCY: Record<string, string> = {
  JP: 'JPY', FR: 'EUR', ID: 'IDR', TH: 'THB', US: 'USD',
  ES: 'EUR', IT: 'EUR', GB: 'GBP', MA: 'MAD', PT: 'EUR',
  KR: 'KRW', HU: 'HUF', TR: 'TRY', MX: 'MXN', NL: 'EUR',
  AE: 'AED', ZA: 'ZAR', AU: 'AUD', AR: 'ARS', GE: 'GEL',
  VN: 'VND', HR: 'EUR', CO: 'COP', IN: 'INR', NZ: 'NZD',
  IS: 'ISK',
};

export default function IntelligenceGrid({ destination, safety, visaReqs, passportCode }: Props) {
  const { t } = useTranslation();
  const router = useRouter();
  const [weather, setWeather] = useState<DailyForecast | null>(null);
  const [exchangeRate, setExchangeRate] = useState<string | null>(null);
  const [currencyCode, setCurrencyCode] = useState<string | null>(null);
  const [currencyTip, setCurrencyTip] = useState<string | null>(null);

  useEffect(() => {
    let cancelled = false;

    (async () => {
      try {
        const geo = await geocodeCity(destination);
        if (geo && !cancelled) {
          const forecast = await getWeatherForecast(geo.latitude, geo.longitude);
          if (forecast?.days?.[0] && !cancelled) {
            setWeather(forecast.days[0]);
          }
        }
      } catch { /* silent */ }
    })();

    (async () => {
      try {
        const countryCode = getCountryCode(destination);
        if (!countryCode) return;
        const curr = COUNTRY_CURRENCY[countryCode];
        if (!curr || curr === 'USD') return;
        if (!cancelled) setCurrencyCode(curr);
        const rates = await getExchangeRates('USD');
        if (rates?.rates?.[curr] && !cancelled) {
          const rate = rates.rates[curr];
          const formatted = rate >= 100 ? Math.round(rate).toLocaleString() : rate.toFixed(2);
          setExchangeRate(formatted);
          setCurrencyTip(`1 USD = ${formatted} ${curr}`);
        }
      } catch { /* silent */ }
    })();

    return () => { cancelled = true; };
  }, [destination]);

  const score = safety?.safetyScore ?? null;
  const safetyColor = score == null ? COLORS.creamMuted : score > 70 ? COLORS.sage : score >= 40 ? COLORS.gold : COLORS.coral;
  const safetyDesc = score == null ? '\u2014' : score > 70 ? t('prep.safeForTravelers', { defaultValue: 'Safe' }) : score >= 40 ? t('prep.useCaution', { defaultValue: 'Caution' }) : t('prep.highRiskArea', { defaultValue: 'High risk' });

  const visa = getVisaInfo(destination, passportCode ?? 'US');
  const sherpaType = visaReqs?.visaType;
  const visaStatus = sherpaType ?? visa?.info?.status ?? null;
  const visaLabel = visaStatus === 'visa_free' ? t('prep.noVisaRequired', { defaultValue: 'Visa free' })
    : visaStatus === 'visa_on_arrival' ? t('prep.visaOnArrivalShort', { defaultValue: 'On arrival' })
    : visaStatus === 'e_visa' ? t('prep.eVisaRequired', { defaultValue: 'e-Visa' })
    : visaStatus === 'eta' ? t('prep.etaRequired', { defaultValue: 'ETA required' })
    : visaStatus === 'visa_required' ? t('prep.visaRequiredShort', { defaultValue: 'Visa required' })
    : null;
  const visaColor = visaStatus === 'visa_free' || visaStatus === 'visa_on_arrival' ? COLORS.sage : COLORS.coral;
  const stayDays = visaReqs?.maxStay ?? visa?.info?.stayDays;

  return (
    <View style={styles.container}>
      <View style={styles.row}>
        {/* Safety card */}
        <Pressable
          style={({ pressed }) => [styles.card, pressed && styles.cardPressed]}
          onPress={() => { Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light); router.push({ pathname: '/safety-intel', params: { destination } } as never); }}
          accessibilityLabel={`Safety score ${score ?? 'unknown'} for ${destination}`}
          accessibilityRole="button"
        >
          <Shield size={18} color={safetyColor} strokeWidth={1.5} />
          <Text style={styles.cardLabel}>{t('prep.safetyScoreLabel', { defaultValue: 'Safety' })}</Text>
          <Text style={[styles.cardValue, { color: safetyColor }]}>
            {score ?? '\u2014'}
          </Text>
          <Text style={styles.cardDesc}>{safetyDesc}</Text>
        </Pressable>

        {/* Currency card */}
        <Pressable
          style={({ pressed }) => [styles.card, pressed && styles.cardPressed]}
          onPress={() => { Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light); Linking.openURL(`https://www.xe.com/currencyconverter/convert/?From=USD&To=${currencyCode ?? 'EUR'}`).catch(() => {}); }}
          accessibilityLabel={`Currency rate for ${destination}`}
          accessibilityRole="button"
        >
          <Banknote size={18} color={COLORS.cream} strokeWidth={1.5} />
          <Text style={styles.cardLabel}>{t('prep.currencyLabel', { defaultValue: 'Currency' })}</Text>
          <Text style={styles.cardValue}>
            {exchangeRate ?? '\u2014'}
          </Text>
          <Text style={styles.cardDesc} numberOfLines={1}>
            {currencyCode ?? t('prep.exchangeRate', { defaultValue: 'Rate' })}
          </Text>
        </Pressable>
      </View>

      <View style={styles.row}>
        {/* Weather card */}
        <Pressable
          style={({ pressed }) => [styles.card, pressed && styles.cardPressed]}
          onPress={() => { Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light); router.push({ pathname: '/destination/[name]', params: { name: destination } } as never); }}
          accessibilityLabel={`Weather for ${destination}`}
          accessibilityRole="button"
        >
          <Cloud size={18} color={COLORS.cream} strokeWidth={1.5} />
          <Text style={styles.cardLabel}>{t('prep.weatherLabel', { defaultValue: 'Weather' })}</Text>
          {weather ? (
            <>
              <Text style={styles.cardValue}>{Math.round(weather.tempMax)}&deg;</Text>
              <Text style={styles.cardDesc}>{weather.weatherLabel}</Text>
            </>
          ) : (
            <Text style={[styles.cardValue, { color: COLORS.creamMuted }]}>{'\u2014'}</Text>
          )}
        </Pressable>

        {/* Visa card */}
        <Pressable
          style={({ pressed }) => [styles.card, pressed && styles.cardPressed]}
          onPress={() => { Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light); Linking.openURL(`https://www.google.com/search?q=visa+requirements+${encodeURIComponent(destination)}+from+${passportCode ?? 'US'}`).catch(() => {}); }}
          accessibilityLabel={`Visa requirements for ${destination}`}
          accessibilityRole="button"
        >
          <FileCheck size={18} color={visaLabel ? visaColor : COLORS.creamMuted} strokeWidth={1.5} />
          <Text style={styles.cardLabel}>{t('prep.visaLabel', { defaultValue: 'Visa' })}</Text>
          {visaLabel ? (
            <>
              <Text style={[styles.cardValueSmall, { color: visaColor }]}>{visaLabel}</Text>
              {stayDays != null && stayDays < 999 && (
                <Text style={styles.cardDesc}>{`${stayDays} days`}</Text>
              )}
            </>
          ) : (
            <Text style={[styles.cardDesc, { color: COLORS.creamMuted }]}>
              {t('prep.checkRequirements', { defaultValue: 'Check' })}
            </Text>
          )}
        </Pressable>
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    paddingHorizontal: 20,
    gap: SPACING.sm,
    marginBottom: SPACING.lg,
  } as ViewStyle,
  row: {
    flexDirection: 'row',
    gap: SPACING.sm,
  } as ViewStyle,
  card: {
    flex: 1,
    backgroundColor: COLORS.surface1,
    borderRadius: RADIUS.lg,
    borderWidth: 1,
    borderColor: COLORS.border,
    padding: SPACING.lg,
    gap: SPACING.xs,
    minHeight: 120,
    justifyContent: 'flex-start',
    alignItems: 'flex-start',
  } as ViewStyle,
  cardPressed: {
    borderColor: COLORS.sageBorder,
  } as ViewStyle,
  cardLabel: {
    fontFamily: FONTS.mono,
    fontSize: 10,
    color: COLORS.muted,
    letterSpacing: 1,
    textTransform: 'uppercase',
    marginTop: SPACING.xs,
  } as TextStyle,
  cardValue: {
    fontFamily: FONTS.mono,
    fontSize: 28,
    lineHeight: 32,
    color: COLORS.cream,
  } as TextStyle,
  cardValueSmall: {
    fontFamily: FONTS.headerMedium,
    fontSize: 16,
    lineHeight: 20,
  } as TextStyle,
  cardDesc: {
    fontFamily: FONTS.body,
    fontSize: 12,
    color: COLORS.creamSoft,
    lineHeight: 16,
  } as TextStyle,
});
