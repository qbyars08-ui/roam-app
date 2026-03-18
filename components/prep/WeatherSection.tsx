// =============================================================================
// WeatherSection — current weather card, entry requirements, 7-day forecast
// =============================================================================
import React from 'react';
import { View, Text } from 'react-native';
import { useTranslation } from 'react-i18next';
import { AlertTriangle, CheckCircle, Droplets, Wifi } from 'lucide-react-native';
import { COLORS, SPACING, RADIUS } from '../../lib/constants';
import type { CurrentWeather } from '../../lib/apis/openweather';
import type { WeatherIntel } from '../../lib/apis/openweather';
import type { EntryRequirements } from '../../lib/apis/sherpa';
import { SkeletonCard } from '../premium/LoadingStates';
import WeatherDayStrip from '../features/WeatherDayStrip';
import { apiCardStyles } from './prep-shared';

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
// CurrentWeatherCard
// ---------------------------------------------------------------------------
export function CurrentWeatherCard({ data, updatedAt }: { data: CurrentWeather; updatedAt?: number | null }) {
  const { t } = useTranslation();
  const emoji = weatherEmoji(data.condition);
  const updatedLabel = currentWeatherUpdatedMinutes(updatedAt ?? null);
  return (
    <View style={apiCardStyles.card}>
      <Text style={apiCardStyles.sectionLabel}>
        {t('prep.currentWeather', { defaultValue: 'CURRENT WEATHER' })}
      </Text>

      <View style={apiCardStyles.weatherHero}>
        <Text style={apiCardStyles.weatherEmoji}>{emoji}</Text>
        <View>
          <Text style={apiCardStyles.weatherTemp}>{Math.round(data.temp)}&deg;C</Text>
          <Text style={apiCardStyles.weatherCondition}>{data.condition}</Text>
        </View>
      </View>

      <View style={apiCardStyles.weatherGrid}>
        <View style={apiCardStyles.weatherStat}>
          <Droplets size={14} color={COLORS.sage} />
          <Text style={apiCardStyles.weatherStatLabel}>
            {t('prep.humidity', { defaultValue: 'Humidity' })}
          </Text>
          <Text style={apiCardStyles.weatherStatValue}>{data.humidity}%</Text>
        </View>

        <View style={apiCardStyles.weatherStat}>
          <Wifi size={14} color={COLORS.sage} />
          <Text style={apiCardStyles.weatherStatLabel}>
            {t('prep.wind', { defaultValue: 'Wind' })}
          </Text>
          <Text style={apiCardStyles.weatherStatValue}>{Math.round(data.windSpeed)} km/h</Text>
        </View>

        {data.uvIndex != null && (
          <View style={apiCardStyles.weatherStat}>
            <AlertTriangle
              size={14}
              color={data.uvIndex >= 8 ? COLORS.coral : data.uvIndex >= 3 ? COLORS.gold : COLORS.sage}
            />
            <Text style={apiCardStyles.weatherStatLabel}>
              {t('prep.uvIndex', { defaultValue: 'UV Index' })}
            </Text>
            <Text style={apiCardStyles.weatherStatValue}>{data.uvIndex}</Text>
          </View>
        )}
      </View>
      {updatedLabel ? (
        <Text style={[apiCardStyles.weatherStatLabel, { marginTop: SPACING.sm, fontSize: 11 }]}>
          {updatedLabel}
        </Text>
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
    <View style={apiCardStyles.card}>
      <Text style={apiCardStyles.sectionLabel}>
        {t('prep.entryRequirements', { defaultValue: 'ENTRY REQUIREMENTS' })}
      </Text>

      {data.covidRestrictions ? (
        <View style={apiCardStyles.row}>
          <AlertTriangle size={14} color={COLORS.gold} />
          <Text style={apiCardStyles.rowText}>{data.covidRestrictions}</Text>
        </View>
      ) : null}

      <View style={apiCardStyles.row}>
        <CheckCircle
          size={14}
          color={data.healthDeclaration ? COLORS.gold : COLORS.sage}
        />
        <Text style={apiCardStyles.rowText}>
          {data.healthDeclaration
            ? t('prep.healthDeclarationRequired', { defaultValue: 'Health declaration required' })
            : t('prep.noHealthDeclaration', { defaultValue: 'No health declaration required' })}
        </Text>
      </View>

      <View style={apiCardStyles.row}>
        <CheckCircle
          size={14}
          color={data.insuranceRequired ? COLORS.gold : COLORS.sage}
        />
        <Text style={apiCardStyles.rowText}>
          {data.insuranceRequired
            ? t('prep.travelInsuranceRequired', { defaultValue: 'Travel insurance required' })
            : t('prep.travelInsuranceOptional', { defaultValue: 'Travel insurance not required' })}
        </Text>
      </View>

      {data.notes.map((note, i) => (
        <View key={i} style={apiCardStyles.row}>
          <View style={apiCardStyles.dot} />
          <Text style={apiCardStyles.rowText}>{note}</Text>
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
      <View style={apiCardStyles.card}>
        <SkeletonCard width={140} height={14} borderRadius={4} style={{ marginBottom: SPACING.md }} />
        <View style={{ flexDirection: 'row', alignItems: 'center', gap: SPACING.md, marginBottom: SPACING.md }}>
          <SkeletonCard width={48} height={48} borderRadius={RADIUS.sm} />
          <View style={{ gap: SPACING.xs }}>
            <SkeletonCard width={80} height={28} borderRadius={4} />
            <SkeletonCard width={120} height={16} borderRadius={4} />
          </View>
        </View>
        <View style={{ flexDirection: 'row', gap: SPACING.lg }}>
          {[1, 2, 3].map((i) => (
            <SkeletonCard key={i} width={72} height={40} borderRadius={RADIUS.sm} />
          ))}
        </View>
        <SkeletonCard width={100} height={12} borderRadius={4} style={{ marginTop: SPACING.md }} />
      </View>
      <View style={{ marginTop: SPACING.sm, gap: SPACING.sm }}>
        {[1, 2, 3, 4, 5, 6, 7].map((i) => (
          <SkeletonCard key={i} width="100%" height={52} borderRadius={RADIUS.md} />
        ))}
      </View>
    </View>
  );
}

// ---------------------------------------------------------------------------
// WeatherForecastDays — 7-day strip cards
// ---------------------------------------------------------------------------
export function WeatherForecastDays({ weatherIntel }: { weatherIntel: WeatherIntel }) {
  if (!weatherIntel.days?.length) return null;
  return (
    <View style={{ paddingHorizontal: 20, marginBottom: SPACING.lg }}>
      <View style={{ marginBottom: SPACING.sm, gap: SPACING.xs }}>
        {weatherIntel.days.map((day) => (
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
      <View style={apiCardStyles.card}>
        <Text style={{ fontFamily: 'DM Mono', fontSize: 10, color: COLORS.sage, letterSpacing: 1.5, marginTop: SPACING.xs }}>
          {t('prep.weatherForecast', { defaultValue: '7-DAY WEATHER' })}
        </Text>
        {weatherIntel.summary ? (
          <Text style={{ fontFamily: 'Inter-Regular', fontSize: 12, color: COLORS.creamSoft, lineHeight: 16 }}>{weatherIntel.summary}</Text>
        ) : null}
        {weatherIntel.packingAdvice?.length > 0 ? (
          <View style={{ marginTop: SPACING.sm }}>
            {weatherIntel.packingAdvice.map((line, i) => (
              <Text key={i} style={{ fontFamily: 'Inter-Regular', fontSize: 12, color: COLORS.creamSoft, lineHeight: 16, marginTop: 4 }}>{line}</Text>
            ))}
          </View>
        ) : null}
      </View>
    </View>
  );
}
