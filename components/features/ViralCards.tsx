// =============================================================================
// ROAM — Viral Sharing Cards
// 1. Trip Reveal Video Card (day-by-day countdown, TikTok-ready)
// 2. Cost Breakdown Card (1:1 infographic square)
// 3. AI vs Reality Card (tourist traps vs ROAM finds)
// All export as PNG via react-native-view-shot + expo-sharing
// =============================================================================
import React, { useCallback, useEffect, useRef, useState } from 'react';
import { useTranslation } from 'react-i18next';
import {
  Animated,
  Dimensions,
  ImageBackground,
  Platform,
  Pressable,
  StyleSheet,
  Text,
  View,
  type TextStyle,
  type ViewStyle,
  type ImageStyle,
} from 'react-native';
import { LinearGradient } from 'expo-linear-gradient';
import { captureRef } from '../../lib/view-shot';
import * as Sharing from 'expo-sharing';
import * as Haptics from '../../lib/haptics';

import { COLORS, FONTS, SPACING, RADIUS } from '../../lib/constants';
import { getHeroPhotoUrl } from '../../lib/heroPhotos';
import { getDestinationPhoto } from '../../lib/photos';
import type { Itinerary, BudgetBreakdown } from '../../lib/types/itinerary';

const { width: SCREEN_WIDTH } = Dimensions.get('window');
const CARD_SIZE = Math.min(SCREEN_WIDTH - 48, 400);

// =============================================================================
// Shared: Export button + PNG capture
// =============================================================================
function useExportCard(cardRef: React.RefObject<View>, filename: string) {
  const [exporting, setExporting] = useState(false);

  const exportCard = useCallback(async () => {
    if (exporting || !cardRef.current) return;
    setExporting(true);
    Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Medium);

    try {
      if (Platform.OS === 'web') {
        // Web: open a hint
        alert('Screenshot this card to share!');
      } else {
        const uri = await captureRef(cardRef, {
          format: 'png',
          quality: 1,
          result: 'tmpfile',
        });
        const isAvailable = await Sharing.isAvailableAsync();
        if (isAvailable) {
          await Sharing.shareAsync(uri, {
            mimeType: 'image/png',
            dialogTitle: filename,
          });
        }
      }
    } catch (err) {
      console.error('[ViralCards] Export error:', err);
    } finally {
      setExporting(false);
    }
  }, [exporting, cardRef, filename]);

  return { exporting, exportCard };
}

function ExportButton({
  onPress,
  loading,
  label,
}: {
  onPress: () => void;
  loading: boolean;
  label?: string;
}) {
  const { t } = useTranslation();
  const defaultLabel = label ?? t('viral.saveAndShare', { defaultValue: 'Save & Share' });
  return (
    <Pressable
      onPress={onPress}
      disabled={loading}
      style={({ pressed }) => [
        exportStyles.btn,
        { opacity: loading ? 0.6 : pressed ? 0.9 : 1, transform: [{ scale: pressed ? 0.97 : 1 }] },
      ]}
    >
      <LinearGradient
        colors={[COLORS.gold, COLORS.goldDark]}
        start={{ x: 0, y: 0 }}
        end={{ x: 1, y: 0 }}
        style={exportStyles.gradient}
      >
        <Text style={exportStyles.text}>{loading ? t('viral.exporting', { defaultValue: 'Exporting...' }) : defaultLabel}</Text>
      </LinearGradient>
    </Pressable>
  );
}

function Watermark() {
  return (
    <View style={watermarkStyles.container}>
      <Text style={watermarkStyles.text}>ROAM</Text>
    </View>
  );
}

// =============================================================================
// 1. TRIP REVEAL VIDEO CARD
// Animated day-by-day reveal — designed for screen recording / TikTok
// =============================================================================
interface TripRevealCardProps {
  itinerary: Itinerary;
  destination: string;
  heroPhotoUrl?: string;
}

export function TripRevealCard({ itinerary, destination, heroPhotoUrl }: TripRevealCardProps) {
  const { t } = useTranslation();
  const cardRef = useRef<View>(null);
  const { exporting, exportCard } = useExportCard(cardRef, `ROAM-${destination}-reveal`);

  const [currentDay, setCurrentDay] = useState(0);
  const [isPlaying, setIsPlaying] = useState(true);
  const fadeAnim = useRef(new Animated.Value(1)).current;
  const scaleAnim = useRef(new Animated.Value(0.95)).current;

  const days = itinerary.days;
  const totalDays = days.length;
  const heroUrl = heroPhotoUrl ?? getHeroPhotoUrl(destination);

  // Auto-advance timer — 5 seconds per day, loops
  useEffect(() => {
    if (!isPlaying) return;

    const timer = setInterval(() => {
      setCurrentDay((prev) => {
        const next = (prev + 1) % totalDays;

        // Animate transition
        Animated.sequence([
          Animated.parallel([
            Animated.timing(fadeAnim, { toValue: 0, duration: 200, useNativeDriver: true }),
            Animated.timing(scaleAnim, { toValue: 0.9, duration: 200, useNativeDriver: true }),
          ]),
          Animated.parallel([
            Animated.timing(fadeAnim, { toValue: 1, duration: 400, useNativeDriver: true }),
            Animated.spring(scaleAnim, { toValue: 1, tension: 60, friction: 8, useNativeDriver: true }),
          ]),
        ]).start();

        return next;
      });
    }, 5000);

    return () => clearInterval(timer);
  }, [fadeAnim, isPlaying, scaleAnim, totalDays]);

  // Entrance animation
  useEffect(() => {
    Animated.spring(scaleAnim, {
      toValue: 1,
      tension: 50,
      friction: 7,
      useNativeDriver: true,
    }).start();
  }, [scaleAnim]);

  const day = days[currentDay];
  const topActivity = day.morning.activity;

  return (
    <View style={revealStyles.wrapper}>
      <View ref={cardRef} collapsable={false} style={revealStyles.card}>
        <ImageBackground
          source={{ uri: heroUrl ?? getDestinationPhoto(destination ?? 'travel') }}
          style={revealStyles.bg}
          resizeMode="cover"
        >
          <LinearGradient
            colors={[COLORS.bgDarkGreenFaint, COLORS.bgDarkGreenSoft, COLORS.bgDarkGreen]}
            locations={[0, 0.4, 1]}
            style={revealStyles.overlay}
          >
            {/* Top: destination + progress */}
            <View style={revealStyles.topBar}>
              <Text style={revealStyles.destName}>{destination}</Text>
              <Text style={revealStyles.dayCounter}>
                {currentDay + 1} / {totalDays}
              </Text>
            </View>

            {/* Progress dots */}
            <View style={revealStyles.dotsRow}>
              {days.map((_, i) => (
                <View
                  key={i}
                  style={[
                    revealStyles.dot,
                    i === currentDay && revealStyles.dotActive,
                    i < currentDay && revealStyles.dotCompleted,
                  ]}
                />
              ))}
            </View>

            {/* Day content — animated */}
            <Animated.View
              style={[
                revealStyles.dayContent,
                { opacity: fadeAnim, transform: [{ scale: scaleAnim }] },
              ]}
            >
              <Text style={revealStyles.dayLabel}>{t('viral.day', { defaultValue: 'DAY' })} {day.day}</Text>
              <Text style={revealStyles.dayTheme}>{day.theme}</Text>
              <View style={revealStyles.divider} />
              <Text style={revealStyles.topActivityLabel}>{t('viral.topPick', { defaultValue: 'TOP PICK' })}</Text>
              <Text style={revealStyles.topActivity}>{topActivity}</Text>
              <Text style={revealStyles.topActivityLocation}>{day.morning.location}</Text>

              {/* Time slots preview */}
              <View style={revealStyles.slotsRow}>
                <View style={revealStyles.slotChip}>
                  <Text style={revealStyles.slotTime}>{t('viral.am', { defaultValue: 'AM' })}</Text>
                  <Text style={revealStyles.slotName} numberOfLines={1}>{day.morning.activity}</Text>
                </View>
                <View style={revealStyles.slotChip}>
                  <Text style={revealStyles.slotTime}>{t('viral.pm', { defaultValue: 'PM' })}</Text>
                  <Text style={revealStyles.slotName} numberOfLines={1}>{day.afternoon.activity}</Text>
                </View>
                <View style={revealStyles.slotChip}>
                  <Text style={revealStyles.slotTime}>{t('viral.eve', { defaultValue: 'EVE' })}</Text>
                  <Text style={revealStyles.slotName} numberOfLines={1}>{day.evening.activity}</Text>
                </View>
              </View>

              {/* Daily cost */}
              <View style={revealStyles.costBadge}>
                <Text style={revealStyles.costText}>{day.dailyCost}</Text>
              </View>
            </Animated.View>

            <Watermark />
          </LinearGradient>
        </ImageBackground>
      </View>

      {/* Controls */}
      <View style={revealStyles.controls}>
        <Pressable
          onPress={() => setIsPlaying(!isPlaying)}
          style={({ pressed }) => [revealStyles.playBtn, { opacity: pressed ? 0.7 : 1 }]}
        >
          <Text style={revealStyles.playBtnText}>{isPlaying ? `\u23F8  ${t('viral.pause', { defaultValue: 'Pause' })}` : `\u25B6  ${t('viral.play', { defaultValue: 'Play' })}`}</Text>
        </Pressable>
        <ExportButton onPress={exportCard} loading={exporting} label={t('viral.exportForTikTok', { defaultValue: 'Export for TikTok' })} />
      </View>
    </View>
  );
}

// =============================================================================
// 2. COST BREAKDOWN CARD
// 1:1 square infographic — gold accents, destination photo bg
// =============================================================================
interface CostBreakdownCardProps {
  destination: string;
  totalBudget: string;
  days: number;
  breakdown: BudgetBreakdown;
  heroPhotoUrl?: string;
}

export function CostBreakdownCard({
  destination,
  totalBudget,
  days,
  breakdown,
  heroPhotoUrl,
}: CostBreakdownCardProps) {
  const { t } = useTranslation();
  const cardRef = useRef<View>(null);
  const { exporting, exportCard } = useExportCard(cardRef, `ROAM-${destination}-budget`);

  const heroUrl = heroPhotoUrl ?? getHeroPhotoUrl(destination);

  // Parse dollar amounts for bar widths
  const parseDollar = (s: string): number => {
    const n = parseFloat(s.replace(/[^0-9.]/g, ''));
    return isNaN(n) ? 0 : n;
  };

  const totalNum = parseDollar(totalBudget);
  const buffer = Math.round(totalNum * 0.1);

  const categories = [
    { label: t('viral.accommodation', { defaultValue: 'Accommodation' }), value: breakdown.accommodation, color: COLORS.gold },
    { label: t('viral.food', { defaultValue: 'Food' }), value: breakdown.food, color: COLORS.sage },
    { label: t('viral.activities', { defaultValue: 'Activities' }), value: breakdown.activities, color: COLORS.coral },
    { label: t('viral.transport', { defaultValue: 'Transport' }), value: breakdown.transportation, color: COLORS.blueAccent },
    { label: t('viral.buffer', { defaultValue: 'Buffer (10%)' }), value: `$${buffer}`, color: COLORS.creamDimLight },
  ];

  const maxVal = Math.max(...categories.map((c) => parseDollar(c.value)), 1);

  return (
    <View style={costStyles.wrapper}>
      <View ref={cardRef} collapsable={false} style={costStyles.card}>
        <ImageBackground
          source={{ uri: heroUrl ?? getDestinationPhoto(destination ?? 'travel') }}
          style={costStyles.bg}
          resizeMode="cover"
        >
          <LinearGradient
            colors={[COLORS.bgDarkGreenOverlay, COLORS.bgDarkGreenMedium, COLORS.bgDarkGreenDeeper]}
            style={costStyles.overlay}
          >
            {/* Header */}
            <View style={costStyles.header}>
              <Text style={costStyles.eyebrow}>{t('viral.tripBudget', { defaultValue: 'TRIP BUDGET' })}</Text>
              <Text style={costStyles.dest}>{destination}</Text>
              <Text style={costStyles.meta}>
                {days} {t('viral.days', { defaultValue: 'days' })} \u00B7 {totalBudget} {t('viral.total', { defaultValue: 'total' })}
              </Text>
            </View>

            {/* Bars */}
            <View style={costStyles.bars}>
              {categories.map((cat, i) => {
                const val = parseDollar(cat.value);
                const pct = Math.max((val / maxVal) * 100, 8);
                return (
                  <View key={i} style={costStyles.barRow}>
                    <View style={costStyles.barLabel}>
                      <Text style={costStyles.barLabelText}>{cat.label}</Text>
                      <Text style={costStyles.barValue}>{cat.value}</Text>
                    </View>
                    <View style={costStyles.barTrack}>
                      <View
                        style={[
                          costStyles.barFill,
                          { width: `${pct}%`, backgroundColor: cat.color },
                        ]}
                      />
                    </View>
                  </View>
                );
              })}
            </View>

            {/* Daily average */}
            <View style={costStyles.dailyAvg}>
              <Text style={costStyles.dailyLabel}>{t('viral.dailyAverage', { defaultValue: 'DAILY AVERAGE' })}</Text>
              <Text style={costStyles.dailyValue}>
                ${totalNum > 0 ? Math.round(totalNum / days) : '--'}/{t('viral.dayAbbr', { defaultValue: 'day' })}
              </Text>
            </View>

            <Watermark />
          </LinearGradient>
        </ImageBackground>
      </View>

      <ExportButton onPress={exportCard} loading={exporting} />
    </View>
  );
}

// =============================================================================
// 3. AI VS REALITY CARD
// Two-column comparison: "What tourists do" vs "What ROAM found"
// =============================================================================
interface AiVsRealityItem {
  tourist: string;
  roam: string;
}

interface AiVsRealityCardProps {
  destination: string;
  items: AiVsRealityItem[];
  heroPhotoUrl?: string;
}

/**
 * Build AI vs Reality items from an itinerary.
 * Maps common tourist traps to ROAM's actual recommendations.
 */
export function buildAiVsRealityItems(
  destination: string,
  itinerary: Itinerary,
): AiVsRealityItem[] {
  // Generic tourist trap data per city
  const touristTraps: Record<string, string[]> = {
    'Tokyo': ['Shibuya crossing selfie', 'Robot Restaurant ($80)', 'Overpriced sushi in Ginza', 'Tokyo Tower observation'],
    'Paris': ['Eiffel Tower queue (2hrs)', 'Champs-\u00C9lys\u00E9es tourist cafes', 'Moulin Rouge ($150)', 'Hop-on-hop-off bus'],
    'Bali': ['Kuta Beach crowds', 'Overpriced beach club', 'Instagram swing ($25)', 'Generic cooking class'],
    'Barcelona': ['Las Ramblas tourist traps', 'Overpriced paella on beach', 'Park G\u00FCell crowds', 'Sagrada Familia 3hr line'],
    'Rome': ['Colosseum package tours', 'Restaurant near Trevi ($$$)', 'Vatican queue (4hrs)', 'Gladiator photo scam'],
    'New York': ['Times Square everything', 'Statue of Liberty ferry line', 'Hard Rock Cafe', 'Central Park horse carriage ($)'],
    'Bangkok': ['Khao San Road tourist bars', 'Overpriced tuk-tuk scam', 'Tiger Temple (unethical)', 'Silom night market fakes'],
    'London': ['Big Ben selfie', 'Leicester Square restaurants', 'Changing of the Guard crowd', 'London Eye queue ($35)'],
  };

  const fallbackTraps = [
    'Top 10 TripAdvisor spots',
    'Overpriced tourist restaurant',
    'Crowded famous landmark',
    'Generic guided tour ($$$)',
  ];

  const traps = touristTraps[destination] ?? fallbackTraps;

  // Pull ROAM's actual recommendations from the itinerary
  const roamFinds: string[] = [];
  for (const day of itinerary.days) {
    if (roamFinds.length < 4) roamFinds.push(`${day.morning.activity} \u2022 ${day.morning.cost}`);
    if (roamFinds.length < 4) roamFinds.push(`${day.evening.activity} \u2022 ${day.evening.cost}`);
  }

  return traps.slice(0, 4).map((tourist, i) => ({
    tourist,
    roam: roamFinds[i] ?? 'Local hidden gem',
  }));
}

export function AiVsRealityCard({
  destination,
  items,
  heroPhotoUrl,
}: AiVsRealityCardProps) {
  const { t } = useTranslation();
  const cardRef = useRef<View>(null);
  const { exporting, exportCard } = useExportCard(cardRef, `ROAM-${destination}-vs-reality`);

  const heroUrl = heroPhotoUrl ?? getHeroPhotoUrl(destination);

  return (
    <View style={vsStyles.wrapper}>
      <View ref={cardRef} collapsable={false} style={vsStyles.card}>
        <ImageBackground
          source={{ uri: heroUrl ?? getDestinationPhoto(destination ?? 'travel') }}
          style={vsStyles.bg}
          resizeMode="cover"
        >
          <LinearGradient
            colors={[COLORS.bgDarkGreen88, COLORS.bgDarkGreen]}
            style={vsStyles.overlay}
          >
            {/* Header */}
            <Text style={vsStyles.eyebrow}>{destination.toUpperCase()}</Text>
            <Text style={vsStyles.title}>{t('viral.touristGuideVsRoam', { defaultValue: 'Tourist Guide vs ROAM' })}</Text>

            {/* Column headers */}
            <View style={vsStyles.colHeaders}>
              <View style={vsStyles.colHeaderLeft}>
                <Text style={vsStyles.colLabel}>{t('viral.whatTouristsDo', { defaultValue: 'WHAT TOURISTS DO' })}</Text>
              </View>
              <View style={vsStyles.colHeaderRight}>
                <Text style={vsStyles.colLabelGold}>{t('viral.whatRoamFound', { defaultValue: 'WHAT ROAM FOUND' })}</Text>
              </View>
            </View>

            {/* Comparison rows */}
            <View style={vsStyles.rows}>
              {items.slice(0, 4).map((item, i) => (
                <View key={i} style={vsStyles.row}>
                  {/* Left: tourist trap */}
                  <View style={vsStyles.cellLeft}>
                    <Text style={vsStyles.xIcon}>{'\u2715'}</Text>
                    <Text style={vsStyles.touristText} numberOfLines={2}>
                      {item.tourist}
                    </Text>
                  </View>

                  {/* Divider */}
                  <View style={vsStyles.rowDivider} />

                  {/* Right: ROAM recommendation */}
                  <View style={vsStyles.cellRight}>
                    <Text style={vsStyles.checkIcon}>{'\u2713'}</Text>
                    <Text style={vsStyles.roamText} numberOfLines={2}>
                      {item.roam}
                    </Text>
                  </View>
                </View>
              ))}
            </View>

            {/* Bottom tagline */}
            <View style={vsStyles.bottomBar}>
              <Text style={vsStyles.tagline}>{t('viral.skipTouristTraps', { defaultValue: 'Skip the tourist traps.' })}</Text>
              <Text style={vsStyles.taglineSub}>{t('viral.builtWithRoam', { defaultValue: 'Built with ROAM' })}</Text>
            </View>

            <Watermark />
          </LinearGradient>
        </ImageBackground>
      </View>

      <ExportButton onPress={exportCard} loading={exporting} />
    </View>
  );
}

// =============================================================================
// Styles — Export Button & Watermark
// =============================================================================
const exportStyles = StyleSheet.create({
  btn: {
    width: '100%',
    borderRadius: RADIUS.lg,
    overflow: 'hidden',
    marginTop: SPACING.md,
  } as ViewStyle,
  gradient: {
    height: 50,
    alignItems: 'center',
    justifyContent: 'center',
    borderRadius: RADIUS.lg,
  } as ViewStyle,
  text: {
    fontFamily: FONTS.bodySemiBold,
    fontSize: 15,
    color: COLORS.bg,
    letterSpacing: 0.3,
  } as TextStyle,
});

const watermarkStyles = StyleSheet.create({
  container: {
    position: 'absolute',
    bottom: 12,
    right: 14,
  } as ViewStyle,
  text: {
    fontFamily: FONTS.header,
    fontSize: 14,
    color: COLORS.goldDim,
    letterSpacing: 3,
  } as TextStyle,
});

// =============================================================================
// Styles — Trip Reveal
// =============================================================================
const revealStyles = StyleSheet.create({
  wrapper: {
    alignItems: 'center',
    width: '100%',
  } as ViewStyle,
  card: {
    width: '100%',
    aspectRatio: 9 / 16,
    maxHeight: 580,
    borderRadius: RADIUS.lg,
    overflow: 'hidden',
    borderWidth: 1,
    borderColor: COLORS.whiteFaintBorder,
  } as ViewStyle,
  bg: {
    flex: 1,
  } as ImageStyle,
  overlay: {
    flex: 1,
    padding: SPACING.lg,
    justifyContent: 'space-between',
  } as ViewStyle,
  topBar: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
  } as ViewStyle,
  destName: {
    fontFamily: FONTS.header,
    fontSize: 22,
    color: COLORS.cream,
    letterSpacing: 1,
  } as TextStyle,
  dayCounter: {
    fontFamily: FONTS.mono,
    fontSize: 14,
    color: COLORS.gold,
  } as TextStyle,
  dotsRow: {
    flexDirection: 'row',
    gap: 6,
    marginTop: SPACING.sm,
  } as ViewStyle,
  dot: {
    flex: 1,
    height: 3,
    borderRadius: 2,
    backgroundColor: COLORS.whiteMuted,
  } as ViewStyle,
  dotActive: {
    backgroundColor: COLORS.gold,
  } as ViewStyle,
  dotCompleted: {
    backgroundColor: COLORS.sage,
  } as ViewStyle,
  dayContent: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    paddingVertical: SPACING.xl,
  } as ViewStyle,
  dayLabel: {
    fontFamily: FONTS.mono,
    fontSize: 13,
    color: COLORS.gold,
    letterSpacing: 4,
    marginBottom: SPACING.xs,
  } as TextStyle,
  dayTheme: {
    fontFamily: FONTS.header,
    fontSize: 32,
    color: COLORS.cream,
    textAlign: 'center',
    lineHeight: 38,
    marginBottom: SPACING.md,
  } as TextStyle,
  divider: {
    width: 40,
    height: 2,
    backgroundColor: COLORS.gold,
    marginBottom: SPACING.md,
    borderRadius: 1,
  } as ViewStyle,
  topActivityLabel: {
    fontFamily: FONTS.mono,
    fontSize: 10,
    color: COLORS.creamMuted,
    letterSpacing: 2,
    marginBottom: SPACING.xs,
  } as TextStyle,
  topActivity: {
    fontFamily: FONTS.bodySemiBold,
    fontSize: 18,
    color: COLORS.cream,
    textAlign: 'center',
    marginBottom: 4,
  } as TextStyle,
  topActivityLocation: {
    fontFamily: FONTS.body,
    fontSize: 13,
    color: COLORS.creamMuted,
    textAlign: 'center',
    marginBottom: SPACING.lg,
  } as TextStyle,
  slotsRow: {
    flexDirection: 'row',
    gap: SPACING.sm,
    marginBottom: SPACING.lg,
  } as ViewStyle,
  slotChip: {
    flex: 1,
    backgroundColor: COLORS.border,
    borderRadius: RADIUS.sm,
    borderWidth: 1,
    borderColor: COLORS.whiteFaintBorder,
    padding: SPACING.sm,
    alignItems: 'center',
  } as ViewStyle,
  slotTime: {
    fontFamily: FONTS.mono,
    fontSize: 9,
    color: COLORS.gold,
    letterSpacing: 1,
    marginBottom: 2,
  } as TextStyle,
  slotName: {
    fontFamily: FONTS.body,
    fontSize: 11,
    color: COLORS.cream,
    textAlign: 'center',
  } as TextStyle,
  costBadge: {
    backgroundColor: COLORS.goldHighlight,
    borderWidth: 1,
    borderColor: COLORS.goldBorderStrong,
    borderRadius: RADIUS.full,
    paddingHorizontal: SPACING.lg,
    paddingVertical: SPACING.sm,
  } as ViewStyle,
  costText: {
    fontFamily: FONTS.monoMedium,
    fontSize: 16,
    color: COLORS.gold,
    letterSpacing: 0.5,
  } as TextStyle,
  controls: {
    width: '100%',
    flexDirection: 'row',
    gap: SPACING.sm,
    marginTop: SPACING.md,
    alignItems: 'center',
  } as ViewStyle,
  playBtn: {
    backgroundColor: COLORS.bgCard,
    borderRadius: RADIUS.lg,
    borderWidth: 1,
    borderColor: COLORS.border,
    height: 50,
    paddingHorizontal: SPACING.lg,
    alignItems: 'center',
    justifyContent: 'center',
  } as ViewStyle,
  playBtnText: {
    fontFamily: FONTS.monoMedium,
    fontSize: 13,
    color: COLORS.cream,
  } as TextStyle,
});

// =============================================================================
// Styles — Cost Breakdown
// =============================================================================
const costStyles = StyleSheet.create({
  wrapper: {
    alignItems: 'center',
    width: '100%',
  } as ViewStyle,
  card: {
    width: CARD_SIZE,
    height: CARD_SIZE,
    borderRadius: RADIUS.lg,
    overflow: 'hidden',
    borderWidth: 1,
    borderColor: COLORS.whiteFaintBorder,
  } as ViewStyle,
  bg: {
    flex: 1,
  } as ImageStyle,
  overlay: {
    flex: 1,
    padding: SPACING.lg,
    justifyContent: 'space-between',
  } as ViewStyle,
  header: {
    marginBottom: SPACING.sm,
  } as ViewStyle,
  eyebrow: {
    fontFamily: FONTS.mono,
    fontSize: 10,
    color: COLORS.gold,
    letterSpacing: 3,
    marginBottom: 4,
  } as TextStyle,
  dest: {
    fontFamily: FONTS.header,
    fontSize: 28,
    color: COLORS.cream,
    lineHeight: 32,
  } as TextStyle,
  meta: {
    fontFamily: FONTS.mono,
    fontSize: 11,
    color: COLORS.creamMuted,
    marginTop: 4,
  } as TextStyle,
  bars: {
    flex: 1,
    justifyContent: 'center',
    gap: SPACING.sm,
  } as ViewStyle,
  barRow: {
    gap: 4,
  } as ViewStyle,
  barLabel: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
  } as ViewStyle,
  barLabelText: {
    fontFamily: FONTS.body,
    fontSize: 12,
    color: COLORS.cream,
  } as TextStyle,
  barValue: {
    fontFamily: FONTS.monoMedium,
    fontSize: 12,
    color: COLORS.cream,
  } as TextStyle,
  barTrack: {
    height: 8,
    borderRadius: 4,
    backgroundColor: COLORS.border,
    overflow: 'hidden',
  } as ViewStyle,
  barFill: {
    height: '100%',
    borderRadius: 4,
  } as ViewStyle,
  dailyAvg: {
    borderTopWidth: 1,
    borderTopColor: COLORS.whiteFaintBorder,
    paddingTop: SPACING.sm,
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
  } as ViewStyle,
  dailyLabel: {
    fontFamily: FONTS.mono,
    fontSize: 10,
    color: COLORS.creamMuted,
    letterSpacing: 2,
  } as TextStyle,
  dailyValue: {
    fontFamily: FONTS.header,
    fontSize: 24,
    color: COLORS.gold,
  } as TextStyle,
});

// =============================================================================
// Styles — AI vs Reality
// =============================================================================
const vsStyles = StyleSheet.create({
  wrapper: {
    alignItems: 'center',
    width: '100%',
  } as ViewStyle,
  card: {
    width: '100%',
    aspectRatio: 4 / 5,
    maxHeight: 520,
    borderRadius: RADIUS.lg,
    overflow: 'hidden',
    borderWidth: 1,
    borderColor: COLORS.whiteFaintBorder,
  } as ViewStyle,
  bg: {
    flex: 1,
  } as ImageStyle,
  overlay: {
    flex: 1,
    padding: SPACING.lg,
    justifyContent: 'space-between',
  } as ViewStyle,
  eyebrow: {
    fontFamily: FONTS.mono,
    fontSize: 10,
    color: COLORS.gold,
    letterSpacing: 3,
    marginBottom: 4,
  } as TextStyle,
  title: {
    fontFamily: FONTS.header,
    fontSize: 26,
    color: COLORS.cream,
    lineHeight: 32,
    marginBottom: SPACING.md,
  } as TextStyle,
  colHeaders: {
    flexDirection: 'row',
    gap: SPACING.sm,
    marginBottom: SPACING.sm,
  } as ViewStyle,
  colHeaderLeft: {
    flex: 1,
    paddingBottom: SPACING.xs,
    borderBottomWidth: 2,
    borderBottomColor: COLORS.dangerMedium,
  } as ViewStyle,
  colHeaderRight: {
    flex: 1,
    paddingBottom: SPACING.xs,
    borderBottomWidth: 2,
    borderBottomColor: COLORS.goldMutedDim,
  } as ViewStyle,
  colLabel: {
    fontFamily: FONTS.mono,
    fontSize: 9,
    color: COLORS.dangerMuted,
    letterSpacing: 1.5,
  } as TextStyle,
  colLabelGold: {
    fontFamily: FONTS.mono,
    fontSize: 9,
    color: COLORS.gold,
    letterSpacing: 1.5,
  } as TextStyle,
  rows: {
    flex: 1,
    justifyContent: 'center',
    gap: SPACING.sm,
  } as ViewStyle,
  row: {
    flexDirection: 'row',
    gap: SPACING.sm,
    alignItems: 'flex-start',
  } as ViewStyle,
  cellLeft: {
    flex: 1,
    flexDirection: 'row',
    alignItems: 'flex-start',
    gap: 6,
    backgroundColor: COLORS.dangerFaint,
    borderRadius: RADIUS.sm,
    padding: SPACING.sm,
    borderWidth: 1,
    borderColor: COLORS.dangerFaintBorder,
  } as ViewStyle,
  cellRight: {
    flex: 1,
    flexDirection: 'row',
    alignItems: 'flex-start',
    gap: 6,
    backgroundColor: COLORS.goldSoft,
    borderRadius: RADIUS.sm,
    padding: SPACING.sm,
    borderWidth: 1,
    borderColor: COLORS.goldHighlight,
  } as ViewStyle,
  rowDivider: {
    width: 1,
    alignSelf: 'stretch',
    backgroundColor: COLORS.border,
  } as ViewStyle,
  xIcon: {
    fontFamily: FONTS.mono,
    fontSize: 12,
    color: COLORS.coral,
    marginTop: 1,
  } as TextStyle,
  checkIcon: {
    fontFamily: FONTS.mono,
    fontSize: 12,
    color: COLORS.gold,
    marginTop: 1,
  } as TextStyle,
  touristText: {
    fontFamily: FONTS.body,
    fontSize: 12,
    color: COLORS.creamMuted,
    flex: 1,
    lineHeight: 17,
    textDecorationLine: 'line-through',
    textDecorationColor: COLORS.coralBorder,
  } as TextStyle,
  roamText: {
    fontFamily: FONTS.bodySemiBold,
    fontSize: 12,
    color: COLORS.cream,
    flex: 1,
    lineHeight: 17,
  } as TextStyle,
  bottomBar: {
    alignItems: 'center',
    paddingTop: SPACING.sm,
  } as ViewStyle,
  tagline: {
    fontFamily: FONTS.header,
    fontSize: 18,
    color: COLORS.cream,
    marginBottom: 2,
  } as TextStyle,
  taglineSub: {
    fontFamily: FONTS.mono,
    fontSize: 10,
    color: COLORS.goldMutedDim,
    letterSpacing: 2,
  } as TextStyle,
});
