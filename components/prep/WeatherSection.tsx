// =============================================================================
// WeatherSection — current weather card, entry requirements, 5-day forecast
// Premium feel: large temp in Space Grotesk 36px, compact forecast row
// =============================================================================
import React from 'react';
import { View, Text, StyleSheet, type ViewStyle, type TextStyle } from 'react-native';
import { useTranslation } from 'react-i18next';
import { AlertTriangle, CheckCircle, Droplets, Wind } from 'lucide-react-native';
import { COLORS, FONTS, SPACING, RADIUS } from '../../lib/constants';
import type { CurrentWeather } from '../../lib/apis/openweather';
import type { WeatherIntel } from '../../lib/apis/openweather';
import type { EntryRequirements } from '../../lib/apis/sherpa';
import { SkeletonCard } from '../premium/LoadingStates';
import WeatherDayStrip from '../features/WeatherDayStrip';

// ---------------------------------------------------------------------------
// weatherEmoji helper
// ---------------------------------------------------------------------------
export function weatherEmoji(condition: string): string {
  const lc = condition.toLowerCase();
  if (lc.includes('thunder') || lc.includes('storm')) return '\u26A1';
  if (lc.includes('snow') || lc.includes('blizzard')) return '\u2744\uFE0F';
  if (lc.includes('rain') || lc.includes('drizzle') || lc.includes('shower')) return '\uD83C\uDF27';
  if (lc.includes('cloud') || lc.includes('overcast')) return '\u2601\uFE0F';
  if (lc.includes('fog') || lc.includes('mist') || lc.includes('haze')) return '\uD83C\uDF2B';
  if (lc.includes('wind') || lc.includes('breezy')) return '\uD83D\uDCA8';
  if (lc.includes('clear') || lc.includes('sunny') || lc.includes('sun')) return '\u2600\uFE0F';
  if (lc.includes('partly')) return '\u26C5';
  return '\uD83C\uDF24';
}

// ---------------------------------------------------------------------------
// Updated-ago label
// ---------------------------------------------------------------------------
function currentWeatherUpdatedMinutes(updatedAt: number | null): string {
  if (updatedAt == null) return '';
  const min = Math.floor((Date.now() - updatedAt) / 60_000);
  if (min < 1) return 'Updated just now';
  if (min === 1) return 'Updated 1 min ago';
  return `Updated ${min} min ago`;
}

// ---------------------------------------------------------------------------
// CurrentWeatherCard — large temp, condition below, compact stats
// ---------------------------------------------------------------------------
export function CurrentWeatherCard({ data, updatedAt }: { data: CurrentWeather; updatedAt?: number | null }) {
  const emoji = weatherEmoji(data.condition);
  const updatedLabel = currentWeatherUpdatedMinutes(updatedAt ?? null);

  return (
    <View style={cardStyles.card}>
      <View style={cardStyles.weatherHero}>
        <Text style={cardStyles.weatherEmoji}>{emoji}</Text>
        <View>
          <Text style={cardStyles.weatherTemp}>{Math.round(data.temp)}&deg;</Text>
          <Text style={cardStyles.weatherCondition}>{data.condition}</Text>
        </View>
      </View>

      <View style={cardStyles.weatherGrid}>
        <View style={cardStyles.weatherStat}>
          <Droplets size={14} color={COLORS.sage} strokeWidth={1.5} />
          <Text style={cardStyles.weatherStatValue}>{data.humidity}%</Text>
          <Text style={cardStyles.weatherStatLabel}>Humidity</Text>
        </View>

        <View style={cardStyles.weatherStat}>
          <Wind size={14} color={COLORS.sage} strokeWidth={1.5} />
          <Text style={cardStyles.weatherStatValue}>{Math.round(data.windSpeed)}</Text>
          <Text style={cardStyles.weatherStatLabel}>km/h</Text>
        </View>

        {data.uvIndex != null && (
          <View style={cardStyles.weatherStat}>
            <AlertTriangle
              size={14}
              color={data.uvIndex >= 8 ? COLORS.coral : data.uvIndex >= 3 ? COLORS.gold : COLORS.sage}
              strokeWidth={1.5}
            />
            <Text style={cardStyles.weatherStatValue}>{data.uvIndex}</Text>
            <Text style={cardStyles.weatherStatLabel}>UV</Text>
          </View>
        )}
      </View>

      {updatedLabel ? (
        <Text style={cardStyles.updatedLabel}>{updatedLabel}</Text>
      ) : null}
    </View>
  );
}

// ---------------------------------------------------------------------------
// EntryRequirementsCard (Sherpa)
// ---------------------------------------------------------------------------
export function EntryRequirementsCard({ data }: { data: EntryRequirements }) {
  const { t } = useTranslation();
  return (
    <View style={cardStyles.card}>
      <Text style={cardStyles.sectionLabel}>
        {t('prep.entryRequirements', { defaultValue: 'ENTRY REQUIREMENTS' })}
      </Text>

      {data.covidRestrictions ? (
        <View style={cardStyles.row}>
          <AlertTriangle size={14} color={COLORS.gold} strokeWidth={1.5} />
          <Text style={cardStyles.rowText}>{data.covidRestrictions}</Text>
        </View>
      ) : null}

      <View style={cardStyles.row}>
        <CheckCircle
          size={14}
          color={data.healthDeclaration ? COLORS.gold : COLORS.sage}
          strokeWidth={1.5}
        />
        <Text style={cardStyles.rowText}>
          {data.healthDeclaration
            ? t('prep.healthDeclarationRequired', { defaultValue: 'Health declaration required' })
            : t('prep.noHealthDeclaration', { defaultValue: 'No health declaration required' })}
        </Text>
      </View>

      <View style={cardStyles.row}>
        <CheckCircle
          size={14}
          color={data.insuranceRequired ? COLORS.gold : COLORS.sage}
          strokeWidth={1.5}
        />
        <Text style={cardStyles.rowText}>
          {data.insuranceRequired
            ? t('prep.travelInsuranceRequired', { defaultValue: 'Travel insurance required' })
            : t('prep.travelInsuranceOptional', { defaultValue: 'Travel insurance not required' })}
        </Text>
      </View>

      {data.notes.map((note, i) => (
        <View key={i} style={cardStyles.row}>
          <View style={cardStyles.dot} />
          <Text style={cardStyles.rowText}>{note}</Text>
        </View>
      ))}
    </View>
  );
}

// ---------------------------------------------------------------------------
// WeatherLoadingSkeleton
// ---------------------------------------------------------------------------
export function WeatherLoadingSkeleton() {
  return (
    <View style={{ paddingHorizontal: 20, marginBottom: SPACING.lg }}>
      <View style={cardStyles.card}>
        <View style={{ flexDirection: 'row', alignItems: 'center', gap: SPACING.md, marginBottom: SPACING.md }}>
          <SkeletonCard width={48} height={48} borderRadius={RADIUS.sm} />
          <View style={{ gap: SPACING.xs }}>
            <SkeletonCard width={80} height={36} borderRadius={4} />
            <SkeletonCard width={120} height={14} borderRadius={4} />
          </View>
        </View>
        <View style={{ flexDirection: 'row', gap: SPACING.sm }}>
          {[1, 2, 3].map((i) => (
            <SkeletonCard key={i} width={72} height={56} borderRadius={RADIUS.md} />
          ))}
        </View>
      </View>
    </View>
  );
}

// ---------------------------------------------------------------------------
// WeatherForecastDays — compact 5-day strip
// ---------------------------------------------------------------------------
export function WeatherForecastDays({ weatherIntel }: { weatherIntel: WeatherIntel }) {
  if (!weatherIntel.days?.length) return null;
  const days = weatherIntel.days.slice(0, 5);
  return (
    <View style={{ paddingHorizontal: 20, marginBottom: SPACING.lg }}>
      <View style={{ gap: SPACING.xs }}>
        {days.map((day) => (
          <WeatherDayStrip
            key={day.date}
            day={{
              date: day.date,
              tempMin: day.tempLow,
              tempMax: day.tempHigh,
              description: day.description,
              icon: day.icon,
              pop: day.rainChance / 100,
              humidity: day.humidity,
              windSpeed: day.windSpeed,
            }}
          />
        ))}
      </View>
    </View>
  );
}

// ---------------------------------------------------------------------------
// WeatherPackingAdvice
// ---------------------------------------------------------------------------
export function WeatherPackingAdvice({ weatherIntel }: { weatherIntel: WeatherIntel }) {
  const { t } = useTranslation();
  if (!weatherIntel.summary && !(weatherIntel.packingAdvice?.length > 0)) return null;

  return (
    <View style={{ paddingHorizontal: 20, marginBottom: SPACING.lg }}>
      <View style={cardStyles.card}>
        <Text style={cardStyles.sectionLabel}>
          {t('prep.weatherForecast', { defaultValue: 'PACKING FORECAST' })}
        </Text>
        {weatherIntel.summary ? (
          <Text style={cardStyles.rowText}>{weatherIntel.summary}</Text>
        ) : null}
        {weatherIntel.packingAdvice?.length > 0 ? (
          <View style={{ marginTop: SPACING.sm, gap: 4 }}>
            {weatherIntel.packingAdvice.map((line, i) => (
              <Text key={i} style={cardStyles.rowText}>{line}</Text>
            ))}
          </View>
        ) : null}
      </View>
    </View>
  );
}

// ---------------------------------------------------------------------------
// Card styles — shared by all weather/entry cards
// ---------------------------------------------------------------------------
const cardStyles = StyleSheet.create({
  card: {
    backgroundColor: COLORS.surface1,
    borderRadius: RADIUS.lg,
    borderWidth: 1,
    borderColor: COLORS.border,
    padding: SPACING.lg,
  } as ViewStyle,
  sectionLabel: {
    fontFamily: FONTS.mono,
    fontSize: 10,
    color: COLORS.sage,
    letterSpacing: 1.5,
    marginBottom: SPACING.md,
  } as TextStyle,
  row: {
    flexDirection: 'row',
    alignItems: 'flex-start',
    gap: SPACING.sm,
    marginBottom: SPACING.sm,
  } as ViewStyle,
  rowText: {
    fontFamily: FONTS.body,
    fontSize: 13,
    color: COLORS.cream,
    flex: 1,
    lineHeight: 18,
  } as TextStyle,
  dot: {
    width: 5,
    height: 5,
    borderRadius: RADIUS.sm,
    backgroundColor: COLORS.sage,
    marginTop: 6,
  } as ViewStyle,
  weatherHero: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: SPACING.md,
    marginBottom: SPACING.lg,
  } as ViewStyle,
  weatherEmoji: {
    fontSize: 40,
    lineHeight: 48,
  } as TextStyle,
  weatherTemp: {
    fontFamily: FONTS.header,
    fontSize: 36,
    color: COLORS.cream,
    lineHeight: 40,
  } as TextStyle,
  weatherCondition: {
    fontFamily: FONTS.body,
    fontSize: 14,
    color: COLORS.creamMuted,
    marginTop: 2,
  } as TextStyle,
  weatherGrid: {
    flexDirection: 'row',
    gap: SPACING.sm,
  } as ViewStyle,
  weatherStat: {
    flex: 1,
    alignItems: 'center',
    gap: 2,
    backgroundColor: COLORS.bgElevated,
    borderRadius: RADIUS.md,
    paddingVertical: SPACING.sm,
    paddingHorizontal: SPACING.xs,
  } as ViewStyle,
  weatherStatLabel: {
    fontFamily: FONTS.mono,
    fontSize: 10,
    color: COLORS.creamMuted,
    letterSpacing: 0.5,
  } as TextStyle,
  weatherStatValue: {
    fontFamily: FONTS.mono,
    fontSize: 14,
    color: COLORS.cream,
  } as TextStyle,
  updatedLabel: {
    fontFamily: FONTS.mono,
    fontSize: 10,
    color: COLORS.creamMuted,
    letterSpacing: 0.5,
    marginTop: SPACING.sm,
  } as TextStyle,
});
