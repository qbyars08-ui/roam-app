// =============================================================================
// ROAM — CountdownSection (PLANNING/IMMINENT state)
// Big countdown number, clean daily brief, minimal data cards.
// =============================================================================
import React, { useCallback, useState } from 'react';
import {
  Animated,
  Linking,
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
    <View style={styles.container}>
      {/* ── Countdown ── */}
      <Pressable
        onPress={() => {
          Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
          router.push('/itinerary' as never);
        }}
        accessibilityLabel={`${daysUntil} days until ${activeTrip.destination}. Tap to view itinerary.`}
        accessibilityRole="button"
      >
        <Animated.View style={[styles.countdownWrap, { transform: [{ scale: pulseAnim }] }]}>
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

      {/* ── Daily brief card ── */}
      {brief && (
        <Pressable
          style={({ pressed }) => [styles.briefCard, { opacity: pressed ? 0.85 : 1 }]}
          onPress={() => {
            Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
            router.push({ pathname: '/destination/[name]', params: { name: activeTrip.destination } } as never);
          }}
          accessibilityLabel={`Daily brief: ${brief.headline}`}
          accessibilityRole="button"
        >
          <View style={styles.briefHeader}>
            <Text style={styles.briefText}>{brief.headline}</Text>
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
          <Text style={styles.briefSub}>{brief.subtext}</Text>
        </Pressable>
      )}

      {/* ── Weather forecast ── */}
      {weatherDays && weatherDays.length > 0 && (
        <Pressable
          style={({ pressed }) => [styles.dataCard, { opacity: pressed ? 0.85 : 1 }]}
          onPress={() => {
            Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
            router.push({ pathname: '/destination/[name]', params: { name: activeTrip.destination } } as never);
          }}
          accessibilityLabel="Weather forecast during trip"
          accessibilityRole="button"
        >
          <Text style={styles.dataLabel}>
            {t('plan.planning.weatherDuringTrip', { defaultValue: 'Weather during trip' })}
          </Text>
          <ScrollView horizontal showsHorizontalScrollIndicator={false} style={styles.weatherScroll}>
            <View style={styles.weatherRow}>
              {weatherDays.slice(0, 5).map((day, i) => (
                <View key={i} style={styles.weatherPill}>
                  <Text style={styles.weatherDate}>
                    {new Date(day.date).toLocaleDateString('en-US', { weekday: 'short', month: 'numeric', day: 'numeric' })}
                  </Text>
                  <Text style={styles.weatherTemp}>{Math.round(day.tempMax)}° / {Math.round(day.tempMin)}°</Text>
                  <Text style={styles.weatherLabel} numberOfLines={1}>{day.weatherLabel}</Text>
                </View>
              ))}
            </View>
          </ScrollView>
        </Pressable>
      )}

      {/* ── Cost estimate ── */}
      {costData && (
        <Pressable
          style={({ pressed }) => [styles.dataCard, { opacity: pressed ? 0.85 : 1 }]}
          onPress={() => {
            Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
            Linking.openURL(`https://www.numbeo.com/cost-of-living/in/${encodeURIComponent(activeTrip.destination)}`).catch(() => {});
          }}
          accessibilityLabel={`Estimated daily cost: ${costData.comfort.dailyTotal}`}
          accessibilityRole="button"
        >
          <Text style={styles.dataLabel}>
            {t('plan.planning.estimatedDailyCost', { defaultValue: 'Estimated daily cost' })}
          </Text>
          <Text style={styles.dataValue}>{costData.comfort.dailyTotal}</Text>
          <Text style={styles.dataSub}>{costData.tipping}</Text>
        </Pressable>
      )}

      {/* ── Save money link ── */}
      <Pressable
        style={({ pressed }) => [styles.savingsLink, { opacity: pressed ? 0.7 : 1 }]}
        onPress={() => {
          Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
          router.push({
            pathname: '/cost-optimizer',
            params: { destination: activeTrip.destination },
          } as never);
        }}
        accessibilityLabel="Find ways to save money on your trip"
        accessibilityRole="link"
      >
        <Text style={styles.savingsLinkText}>
          {t('plan.planning.saveMoney', { defaultValue: 'Save money' })}
        </Text>
      </Pressable>

      {/* ── Air quality alert ── */}
      {hasNotableAir && airQuality && (
        <Pressable
          style={({ pressed }) => [styles.dataCard, styles.dataCardAlert, { opacity: pressed ? 0.85 : 1 }]}
          onPress={() => {
            Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
            router.push({ pathname: '/destination/[name]', params: { name: activeTrip.destination } } as never);
          }}
          accessibilityLabel={`Air quality alert: ${airQuality.label}`}
          accessibilityRole="button"
        >
          <Text style={[styles.dataLabel, { color: COLORS.coral }]}>
            {t('plan.planning.airQualityAlert', { defaultValue: 'Air quality at destination' })}
          </Text>
          <Text style={[styles.dataValue, { color: COLORS.coral }]}>
            {airQuality.label} (AQI {airQuality.aqi})
          </Text>
          <Text style={styles.dataSub}>{airQuality.advice}</Text>
        </Pressable>
      )}

      {/* ── Pre-trip checklist ── */}
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
                style={({ pressed }) => [
                  styles.checklistRow,
                  checked && styles.checklistRowChecked,
                  { opacity: pressed ? 0.8 : 1 },
                ]}
              >
                <View style={[styles.checkbox, checked && styles.checkboxChecked]}>
                  {checked && <Text style={styles.checkMark}>&#10003;</Text>}
                </View>
                <Text style={[styles.checklistLabel, checked && styles.checklistLabelDone]}>
                  {item.label}
                </Text>
              </Pressable>
            );
          })}
          <Pressable
            onPress={() => {
              void Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
              router.push({
                pathname: '/trip-checklist',
                params: {
                  tripId: activeTrip.id,
                  destination: activeTrip.destination,
                  daysUntil: String(daysUntil),
                },
              } as never);
            }}
            style={styles.fullChecklistLink}
          >
            <Text style={styles.fullChecklistText}>
              {t('plan.planning.viewFullChecklist', { defaultValue: 'View full checklist' })}
            </Text>
          </Pressable>
        </View>
      )}
    </View>
  );
}

// ---------------------------------------------------------------------------
// Styles
// ---------------------------------------------------------------------------
const styles = StyleSheet.create({
  container: {
    marginBottom: SPACING.xxl,
    gap: SPACING.md,
  } as ViewStyle,

  // Countdown
  countdownWrap: {
    alignItems: 'center',
    marginBottom: SPACING.lg,
  } as ViewStyle,
  countdownNumber: {
    fontFamily: FONTS.header,
    fontSize: 72,
    letterSpacing: -2,
    lineHeight: 80,
  } as TextStyle,
  countdownSub: {
    fontFamily: FONTS.body,
    fontSize: 16,
    color: COLORS.muted,
    textAlign: 'center',
    marginTop: SPACING.xs,
  } as TextStyle,

  // Brief card
  briefCard: {
    backgroundColor: COLORS.surface1,
    borderRadius: RADIUS.lg,
    padding: SPACING.lg,
    borderLeftWidth: 2,
    borderLeftColor: COLORS.sage,
  } as ViewStyle,
  briefHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: SPACING.sm,
    marginBottom: SPACING.xs,
  } as ViewStyle,
  briefText: {
    fontFamily: FONTS.bodyMedium,
    fontSize: 16,
    color: COLORS.cream,
    flex: 1,
    lineHeight: 22,
  } as TextStyle,
  briefSub: {
    fontFamily: FONTS.body,
    fontSize: 14,
    color: COLORS.muted,
    lineHeight: 20,
  } as TextStyle,
  briefAudioBtn: {
    padding: 6,
    borderRadius: RADIUS.sm,
  } as ViewStyle,
  briefAudioBtnActive: {
    backgroundColor: COLORS.sageSubtle,
  } as ViewStyle,

  // Data cards
  dataCard: {
    backgroundColor: COLORS.surface1,
    borderRadius: RADIUS.lg,
    padding: SPACING.lg,
    borderWidth: 1,
    borderColor: COLORS.border,
  } as ViewStyle,
  dataCardAlert: {
    borderColor: COLORS.coralBorder,
  } as ViewStyle,
  dataLabel: {
    fontFamily: FONTS.mono,
    fontSize: 10,
    color: COLORS.muted,
    letterSpacing: 0.8,
    textTransform: 'uppercase',
    marginBottom: SPACING.sm,
  } as TextStyle,
  dataValue: {
    fontFamily: FONTS.header,
    fontSize: 20,
    color: COLORS.cream,
    marginBottom: 2,
  } as TextStyle,
  dataSub: {
    fontFamily: FONTS.body,
    fontSize: 13,
    color: COLORS.muted,
    lineHeight: 18,
  } as TextStyle,

  // Savings link
  savingsLink: {
    alignSelf: 'center',
    paddingVertical: SPACING.xs,
    paddingHorizontal: SPACING.md,
  } as ViewStyle,
  savingsLinkText: {
    fontFamily: FONTS.bodyMedium,
    fontSize: 14,
    color: COLORS.sage,
    textDecorationLine: 'underline',
  } as TextStyle,

  // Weather
  weatherScroll: {
    marginTop: SPACING.sm,
  } as ViewStyle,
  weatherRow: {
    flexDirection: 'row',
    gap: SPACING.sm,
  } as ViewStyle,
  weatherPill: {
    backgroundColor: COLORS.surface2,
    borderRadius: RADIUS.md,
    padding: SPACING.sm,
    minWidth: 90,
    alignItems: 'center',
    borderWidth: 1,
    borderColor: COLORS.border,
  } as ViewStyle,
  weatherDate: {
    fontFamily: FONTS.mono,
    fontSize: 9,
    color: COLORS.muted,
    letterSpacing: 0.3,
    marginBottom: 2,
  } as TextStyle,
  weatherTemp: {
    fontFamily: FONTS.bodyMedium,
    fontSize: 14,
    color: COLORS.cream,
  } as TextStyle,
  weatherLabel: {
    fontFamily: FONTS.body,
    fontSize: 11,
    color: COLORS.muted,
    marginTop: 2,
  } as TextStyle,

  // Checklist
  checklistContainer: {
    backgroundColor: COLORS.surface1,
    borderRadius: RADIUS.lg,
    padding: SPACING.lg,
  } as ViewStyle,
  checklistTitle: {
    fontFamily: FONTS.mono,
    fontSize: 11,
    color: COLORS.sage,
    letterSpacing: 1.5,
    textTransform: 'uppercase',
    marginBottom: SPACING.md,
  } as TextStyle,
  checklistRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: SPACING.sm,
    paddingVertical: 12,
    borderBottomWidth: 1,
    borderBottomColor: COLORS.border,
  } as ViewStyle,
  checklistRowChecked: {
    opacity: 0.5,
  } as ViewStyle,
  checkbox: {
    width: 22,
    height: 22,
    borderRadius: 6,
    borderWidth: 1.5,
    borderColor: COLORS.muted,
    alignItems: 'center',
    justifyContent: 'center',
    flexShrink: 0,
  } as ViewStyle,
  checkboxChecked: {
    backgroundColor: COLORS.sage,
    borderColor: COLORS.sage,
  } as ViewStyle,
  checkMark: {
    fontFamily: FONTS.mono,
    fontSize: 12,
    color: COLORS.bg,
  } as TextStyle,
  checklistLabel: {
    fontFamily: FONTS.body,
    fontSize: 15,
    color: COLORS.cream,
    flex: 1,
    lineHeight: 20,
  } as TextStyle,
  checklistLabelDone: {
    textDecorationLine: 'line-through',
    color: COLORS.muted,
  } as TextStyle,
  fullChecklistLink: {
    marginTop: SPACING.sm,
    alignItems: 'center',
    paddingVertical: SPACING.sm,
  } as ViewStyle,
  fullChecklistText: {
    fontFamily: FONTS.bodyMedium,
    fontSize: 13,
    color: COLORS.sage,
  } as TextStyle,
});
