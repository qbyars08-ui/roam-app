// =============================================================================
// ROAM — CountdownSection (PLANNING/IMMINENT countdown, daily brief, checklist)
// =============================================================================
import React, { useCallback, useState } from 'react';
import {
  Animated,
  Pressable,
  ScrollView,
  StyleSheet,
  Text,
  View,
  type TextStyle,
  type ViewStyle,
} from 'react-native';
import { useRouter } from 'expo-router';
import { Volume2 } from 'lucide-react-native';
import { useTranslation } from 'react-i18next';
import * as Haptics from '../../lib/haptics';
import { COLORS, FONTS, SPACING, RADIUS } from '../../lib/constants';
import type { Trip } from '../../lib/store';
import type { TravelStage } from '../../lib/travel-state';
import type { DailyBrief, ChecklistItem } from '../../lib/daily-brief';
import type { DailyForecast } from '../../lib/weather-forecast';
import type { AirQuality } from '../../lib/air-quality';
import type { CostOfLiving } from '../../lib/cost-of-living';
import { playDailyBriefAudio } from '../../lib/daily-brief-audio';
import LiveBadge from '../../components/ui/LiveBadge';

// ---------------------------------------------------------------------------
// Props
// ---------------------------------------------------------------------------
export interface CountdownSectionProps {
  stage: TravelStage;
  daysUntil: number;
  activeTrip: Trip;
  brief: DailyBrief | null;
  isLive: boolean;
  checklist: ChecklistItem[];
  checkedItems: Set<string>;
  onToggle: (id: string) => void;
  pulseAnim: Animated.Value;
  weatherDays?: DailyForecast[];
  airQuality?: AirQuality | null;
  costData?: CostOfLiving | null;
}

// ---------------------------------------------------------------------------
// Component
// ---------------------------------------------------------------------------
export default function CountdownSection({
  stage,
  daysUntil,
  activeTrip,
  brief,
  isLive,
  checklist,
  checkedItems,
  onToggle,
  pulseAnim,
  weatherDays,
  airQuality,
  costData,
}: CountdownSectionProps) {
  const { t } = useTranslation();
  const router = useRouter();
  const isImminent = stage === 'IMMINENT';
  const countdownColor = isImminent ? COLORS.gold : COLORS.cream;
  const hasNotableAir = airQuality != null && airQuality.aqi > 100;

  const [audioPlaying, setAudioPlaying] = useState(false);

  const handlePlayBriefAudio = useCallback(() => {
    if (audioPlaying) return;
    Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
    setAudioPlaying(true);
    playDailyBriefAudio(activeTrip.destination, daysUntil, {
      onEnd: () => setAudioPlaying(false),
      onError: () => setAudioPlaying(false),
    }).catch(() => setAudioPlaying(false));
  }, [audioPlaying, activeTrip.destination, daysUntil]);

  return (
    <View style={styles.planningContainer}>
      {/* Countdown number */}
      <Pressable
        onPress={() => {
          Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
          router.push('/itinerary' as never);
        }}
        accessibilityLabel={`${daysUntil} days until ${activeTrip.destination}. Tap to view itinerary.`}
        accessibilityRole="button"
      >
        <Animated.View style={{ transform: [{ scale: pulseAnim }], alignItems: 'center', marginBottom: SPACING.xs }}>
          <Text style={[styles.countdownNumber, { color: countdownColor }]}>
            {daysUntil}
          </Text>
          <Text style={styles.countdownSub}>
            {isImminent
              ? t('plan.planning.almostTime', { defaultValue: 'Almost time.' })
              : t('plan.planning.daysUntil', { defaultValue: 'days until {{destination}}', destination: activeTrip.destination })}
          </Text>
        </Animated.View>
      </Pressable>

      {/* Daily brief card */}
      {brief && (
        <View style={styles.briefCard}>
          <View style={styles.briefHeader}>
            <Text style={[styles.briefHeadline, { flex: 1 }]}>{brief.headline}</Text>
            {isLive && <LiveBadge />}
            <Pressable
              onPress={handlePlayBriefAudio}
              accessibilityLabel="Play daily brief audio"
              accessibilityRole="button"
              hitSlop={{ top: 8, bottom: 8, left: 8, right: 8 }}
              style={({ pressed }) => [
                styles.briefAudioBtn,
                audioPlaying && styles.briefAudioBtnActive,
                { opacity: pressed ? 0.7 : 1 },
              ]}
            >
              <Volume2
                size={16}
                color={audioPlaying ? COLORS.sage : COLORS.muted}
                strokeWidth={1.5}
              />
            </Pressable>
          </View>
          <Text style={styles.briefSubtext}>{brief.subtext}</Text>
        </View>
      )}

      {/* Weather during trip */}
      {weatherDays && weatherDays.length > 0 && (
        <View style={styles.planDataCard}>
          <Text style={styles.planDataLabel}>
            {t('plan.planning.weatherDuringTrip', { defaultValue: 'Weather during trip' })}
          </Text>
          <ScrollView horizontal showsHorizontalScrollIndicator={false} style={{ marginTop: SPACING.sm }}>
            <View style={{ flexDirection: 'row', gap: SPACING.sm }}>
              {weatherDays.slice(0, 5).map((day, i) => (
                <View key={i} style={styles.weatherPill}>
                  <Text style={styles.weatherPillDate}>
                    {new Date(day.date).toLocaleDateString('en-US', { weekday: 'short', month: 'numeric', day: 'numeric' })}
                  </Text>
                  <Text style={styles.weatherPillTemp}>{Math.round(day.tempMax)}° / {Math.round(day.tempMin)}°</Text>
                  <Text style={styles.weatherPillLabel} numberOfLines={1}>{day.weatherLabel}</Text>
                </View>
              ))}
            </View>
          </ScrollView>
        </View>
      )}

      {/* Cost estimate */}
      {costData && (
        <View style={styles.planDataCard}>
          <Text style={styles.planDataLabel}>
            {t('plan.planning.estimatedDailyCost', { defaultValue: 'Estimated daily cost' })}
          </Text>
          <Text style={styles.planDataValue}>{costData.comfort.dailyTotal}</Text>
          <Text style={styles.planDataSub}>{costData.tipping}</Text>
        </View>
      )}

      {/* Air quality alert (only if notable) */}
      {hasNotableAir && airQuality && (
        <View style={[styles.planDataCard, { borderColor: COLORS.coral + '40' }]}>
          <Text style={[styles.planDataLabel, { color: COLORS.coral }]}>
            {t('plan.planning.airQualityAlert', { defaultValue: 'Air quality at destination' })}
          </Text>
          <Text style={[styles.planDataValue, { color: COLORS.coral }]}>
            {airQuality.label} (AQI {airQuality.aqi})
          </Text>
          <Text style={styles.planDataSub}>{airQuality.advice}</Text>
        </View>
      )}

      {/* Pre-trip checklist */}
      {checklist.length > 0 && (
        <View style={styles.checklistContainer}>
          <Text style={styles.checklistTitle}>
            {t('plan.planning.checklist', { defaultValue: 'Pre-trip checklist' })}
          </Text>
          {checklist.map((item) => {
            const checked = checkedItems.has(item.id);
            return (
              <Pressable
                key={item.id}
                onPress={() => onToggle(item.id)}
                accessibilityLabel={`${checked ? 'Uncheck' : 'Check'}: ${item.label}`}
                accessibilityRole="checkbox"
                accessibilityState={{ checked }}
                style={({ pressed }) => [styles.checklistRow, checked && styles.checklistRowChecked, { opacity: pressed ? 0.8 : 1 }]}
              >
                <View style={[styles.checkbox, checked && styles.checkboxChecked]}>
                  {checked && <Text style={styles.checkboxMark}>✓</Text>}
                </View>
                <Text style={[styles.checklistLabel, checked && styles.checklistLabelChecked]}>
                  {item.label}
                </Text>
              </Pressable>
            );
          })}
        </View>
      )}
    </View>
  );
}

// ---------------------------------------------------------------------------
// Styles
// ---------------------------------------------------------------------------
const styles = StyleSheet.create({
  planningContainer: {
    marginBottom: SPACING.lg,
  } as ViewStyle,
  countdownNumber: {
    fontFamily: FONTS.mono,
    fontSize: 72,
    letterSpacing: -2,
    lineHeight: 80,
  } as TextStyle,
  countdownSub: {
    fontFamily: FONTS.mono,
    fontSize: 16,
    color: COLORS.creamDim,
    textAlign: 'center',
    marginTop: 4,
    marginBottom: SPACING.md,
  } as TextStyle,
  briefCard: {
    backgroundColor: COLORS.surface1,
    borderRadius: RADIUS.lg,
    padding: SPACING.md,
    gap: SPACING.xs,
    marginBottom: SPACING.md,
    borderLeftWidth: 3,
    borderLeftColor: COLORS.sage,
  } as ViewStyle,
  briefHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: SPACING.sm,
    flexWrap: 'wrap',
  } as ViewStyle,
  briefHeadline: {
    fontFamily: FONTS.bodySemiBold,
    fontSize: 14,
    color: COLORS.cream,
    flex: 1,
    lineHeight: 20,
  } as TextStyle,
  briefSubtext: {
    fontFamily: FONTS.body,
    fontSize: 13,
    color: COLORS.creamMuted,
    lineHeight: 19,
  } as TextStyle,
  briefAudioBtn: {
    marginLeft: SPACING.xs,
    padding: 4,
    borderRadius: RADIUS.sm,
  } as ViewStyle,
  briefAudioBtnActive: {
    backgroundColor: COLORS.sageSubtle,
  } as ViewStyle,
  planDataCard: {
    backgroundColor: COLORS.surface1,
    borderWidth: 1,
    borderColor: COLORS.border,
    borderRadius: RADIUS.md,
    padding: SPACING.md,
    marginBottom: SPACING.sm,
  } as ViewStyle,
  planDataLabel: {
    fontFamily: FONTS.mono,
    fontSize: 10,
    color: COLORS.muted,
    letterSpacing: 0.8,
    textTransform: 'uppercase',
    marginBottom: SPACING.xs,
  } as TextStyle,
  planDataValue: {
    fontFamily: FONTS.header,
    fontSize: 18,
    color: COLORS.cream,
    marginBottom: 2,
  } as TextStyle,
  planDataSub: {
    fontFamily: FONTS.body,
    fontSize: 12,
    color: COLORS.creamDim,
    lineHeight: 18,
  } as TextStyle,
  weatherPill: {
    backgroundColor: COLORS.surface2,
    borderWidth: 1,
    borderColor: COLORS.border,
    borderRadius: RADIUS.sm,
    padding: SPACING.sm,
    minWidth: 90,
    alignItems: 'center',
  } as ViewStyle,
  weatherPillDate: {
    fontFamily: FONTS.mono,
    fontSize: 9,
    color: COLORS.muted,
    letterSpacing: 0.3,
    marginBottom: 2,
  } as TextStyle,
  weatherPillTemp: {
    fontFamily: FONTS.bodyMedium,
    fontSize: 13,
    color: COLORS.cream,
  } as TextStyle,
  weatherPillLabel: {
    fontFamily: FONTS.body,
    fontSize: 11,
    color: COLORS.creamDim,
    marginTop: 2,
  } as TextStyle,
  checklistContainer: {
    backgroundColor: COLORS.surface1,
    borderRadius: RADIUS.lg,
    padding: SPACING.md,
    gap: SPACING.xs,
  } as ViewStyle,
  checklistTitle: {
    fontFamily: FONTS.mono,
    fontSize: 11,
    color: COLORS.sage,
    letterSpacing: 1.5,
    textTransform: 'uppercase',
    marginBottom: SPACING.xs,
  } as TextStyle,
  checklistRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: SPACING.sm,
    paddingVertical: 10,
    borderBottomWidth: 1,
    borderBottomColor: COLORS.border,
  } as ViewStyle,
  checklistRowChecked: {
    opacity: 0.55,
  } as ViewStyle,
  checkbox: {
    width: 20,
    height: 20,
    borderRadius: 6,
    borderWidth: 1.5,
    borderColor: COLORS.creamDim,
    alignItems: 'center',
    justifyContent: 'center',
    flexShrink: 0,
  } as ViewStyle,
  checkboxChecked: {
    backgroundColor: COLORS.sage,
    borderColor: COLORS.sage,
  } as ViewStyle,
  checkboxMark: {
    fontFamily: FONTS.mono,
    fontSize: 11,
    color: COLORS.bg,
  } as TextStyle,
  checklistLabel: {
    fontFamily: FONTS.body,
    fontSize: 14,
    color: COLORS.cream,
    flex: 1,
    lineHeight: 19,
  } as TextStyle,
  checklistLabelChecked: {
    textDecorationLine: 'line-through',
    color: COLORS.creamDim,
  } as TextStyle,
});
