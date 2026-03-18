// =============================================================================
// IntelligenceGrid — 2x2 magazine-style intelligence cards
// =============================================================================
import React, { useEffect, useState } from 'react';
import { View, Text, StyleSheet, type ViewStyle, type TextStyle } from 'react-native';
import { useTranslation } from 'react-i18next';
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
  const safetyDesc = score == null ? '\u2014' : score > 70 ? t('prep.safeForTravelers', { defaultValue: 'Safe for travelers' }) : score >= 40 ? t('prep.useCaution', { defaultValue: 'Use caution' }) : t('prep.highRiskArea', { defaultValue: 'High risk area' });

  const visa = getVisaInfo(destination, passportCode ?? 'US');
  const sherpaType = visaReqs?.visaType;
  const visaStatus = sherpaType ?? visa?.info?.status ?? null;
  const visaLabel = visaStatus === 'visa_free' ? t('prep.noVisaRequired', { defaultValue: 'Visa free' })
    : visaStatus === 'visa_on_arrival' ? t('prep.visaOnArrivalShort', { defaultValue: 'On arrival' })
    : visaStatus === 'e_visa' ? t('prep.eVisaRequired', { defaultValue: 'e-Visa required' })
    : visaStatus === 'eta' ? t('prep.etaRequired', { defaultValue: 'ETA required' })
    : visaStatus === 'visa_required' ? t('prep.visaRequiredShort', { defaultValue: 'Visa required' })
    : null;
  const visaColor = visaStatus === 'visa_free' ? COLORS.sage
    : visaStatus === 'visa_on_arrival' ? COLORS.sage
    : COLORS.coral;
  const stayDays = visaReqs?.maxStay ?? visa?.info?.stayDays;

  return (
    <View style={styles.container}>
      <View style={styles.row}>
        {/* Safety card */}
        <View style={styles.card}>
          <Text style={[styles.bigNumber, { color: safetyColor }]}>
            {score ?? '\u2014'}
          </Text>
          <Text style={styles.cardDesc}>{safetyDesc}</Text>
          <Text style={styles.cardLabel}>{t('prep.safetyScoreLabel', { defaultValue: 'SAFETY SCORE' })}</Text>
        </View>

        {/* Currency card */}
        <View style={styles.card}>
          <Text style={[styles.bigRate, { color: COLORS.cream }]}>
            {exchangeRate ?? '\u2014'}
          </Text>
          <Text style={styles.cardDesc}>
            {currencyTip ?? (currencyCode ? `1 USD = ${currencyCode}` : t('prep.exchangeRate', { defaultValue: 'Exchange rate' }))}
          </Text>
          <Text style={styles.cardLabel}>{t('prep.currencyLabel', { defaultValue: 'CURRENCY' })}</Text>
        </View>
      </View>

      <View style={styles.row}>
        {/* Weather card */}
        <View style={styles.card}>
          {weather ? (
            <>
              <Text style={[styles.bigNumber, { color: COLORS.cream }]}>
                {Math.round(weather.tempMax)}&deg;
              </Text>
              <Text style={styles.cardDesc}>{weather.weatherLabel}</Text>
              {weather.precipitationChance > 0 && (
                <Text style={[styles.cardDesc, { color: COLORS.creamMuted }]}>
                  {weather.precipitationChance}% {t('prep.rain', { defaultValue: 'rain' })}
                </Text>
              )}
            </>
          ) : (
            <Text style={[styles.bigNumber, { color: COLORS.creamMuted }]}>{'\u2014'}</Text>
          )}
          <Text style={styles.cardLabel}>{t('prep.weatherLabel', { defaultValue: 'WEATHER' })}</Text>
        </View>

        {/* Visa card */}
        <View style={styles.card}>
          {visaLabel ? (
            <>
              <Text style={[styles.visaStatus, { color: visaColor }]}>
                {visaLabel}
              </Text>
              {stayDays != null && stayDays < 999 && (
                <Text style={styles.cardDesc}>{`Up to ${stayDays} days`}</Text>
              )}
            </>
          ) : (
            <Text style={[styles.cardDesc, { color: COLORS.creamMuted }]}>{t('prep.checkRequirements', { defaultValue: 'Check requirements' })}</Text>
          )}
          <Text style={styles.cardLabel}>{t('prep.visaLabel', { defaultValue: 'VISA' })}</Text>
        </View>
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    paddingHorizontal: 20,
    gap: SPACING.md,
    marginBottom: 40,
  } as ViewStyle,
  row: {
    flexDirection: 'row',
    gap: SPACING.md,
  } as ViewStyle,
  card: {
    flex: 1,
    backgroundColor: COLORS.bgMagazine,
    borderRadius: RADIUS.lg,
    borderLeftWidth: 3,
    borderLeftColor: COLORS.sage,
    padding: SPACING.md,
    gap: SPACING.xs,
    minHeight: 100,
    justifyContent: 'flex-end',
  } as ViewStyle,
  bigNumber: {
    fontFamily: FONTS.mono,
    fontSize: 36,
    lineHeight: 40,
    color: COLORS.cream,
  } as TextStyle,
  bigRate: {
    fontFamily: FONTS.mono,
    fontSize: 18,
    lineHeight: 22,
  } as TextStyle,
  visaStatus: {
    fontFamily: FONTS.header,
    fontSize: 16,
    lineHeight: 20,
  } as TextStyle,
  cardDesc: {
    fontFamily: FONTS.body,
    fontSize: 12,
    color: COLORS.creamSoft,
    lineHeight: 16,
  } as TextStyle,
  cardLabel: {
    fontFamily: FONTS.mono,
    fontSize: 10,
    color: COLORS.sage,
    letterSpacing: 1.5,
    marginTop: SPACING.xs,
  } as TextStyle,
});
