// =============================================================================
// ROAM — Trip Chemistry: Travel Companion Compatibility Analyzer
// =============================================================================
import React, { useState, useRef, useCallback, useEffect } from 'react';
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  Animated,
  TouchableOpacity,
  TextInput,
  Share,
} from 'react-native';
import { useRouter } from 'expo-router';
import { LinearGradient } from 'expo-linear-gradient';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import * as Haptics from '../lib/haptics';
import Slider from '@react-native-community/slider';
import {
  ChevronLeft,
  ChevronUp,
  ChevronDown,
  XCircle,
  UserPlus,
  FlaskConical,
  AlertTriangle,
  Compass,
  Share2,
  RotateCcw,
} from 'lucide-react-native';
import Svg, { Circle } from 'react-native-svg';

import { COLORS, FONTS, SPACING, RADIUS } from '../lib/constants';
import { useAppStore } from '../lib/store';
import { useProGate } from '../lib/pro-gate';
import { withComingSoon } from '../lib/with-coming-soon';

// ---------------------------------------------------------------------------
// Types
// ---------------------------------------------------------------------------

type Traveler = {
  id: string;
  name: string;
  pace: number;
  budgetStyle: number;
  crowdTolerance: number;
  foodAdventurousness: number;
  isYou: boolean;
};

type DimensionResult = {
  label: string;
  key: string;
  score: number;
  stdDev: number;
  values: number[];
};

type ChemistryResult = {
  overallScore: number;
  dimensions: DimensionResult[];
  chemistryLabel: string;
  conflicts: string[];
  proTips: string[];
  destinationType: string;
};

// ---------------------------------------------------------------------------
// Animated SVG Circle
// ---------------------------------------------------------------------------

const AnimatedCircle = Animated.createAnimatedComponent(Circle);

// ---------------------------------------------------------------------------
// Algorithm helpers
// ---------------------------------------------------------------------------

function stdDev(values: number[]): number {
  if (values.length <= 1) return 0;
  const mean = values.reduce((a, b) => a + b, 0) / values.length;
  const variance = values.reduce((sum, v) => sum + (v - mean) ** 2, 0) / values.length;
  return Math.sqrt(variance);
}

function dimensionScore(values: number[]): number {
  // Max possible std dev for 1-10 scale is ~4.5
  // Convert: low std dev = high score
  const sd = stdDev(values);
  const maxStdDev = 4.5;
  return Math.max(0, Math.min(100, Math.round((1 - sd / maxStdDev) * 100)));
}

function getChemistryLabel(score: number): { label: string } {
  if (score >= 90) return { label: 'Travel Soulmates' };
  if (score >= 75) return { label: 'Great Match' };
  if (score >= 60) return { label: 'Solid with Compromises' };
  if (score >= 40) return { label: 'Proceed with Caution' };
  return { label: 'Danger Zone' };
}

function generateConflicts(travelers: Traveler[], dimensions: DimensionResult[]): string[] {
  const conflicts: string[] = [];

  for (const dim of dimensions) {
    if (dim.score >= 70) continue;
    const minIdx = dim.values.indexOf(Math.min(...dim.values));
    const maxIdx = dim.values.indexOf(Math.max(...dim.values));
    const minName = travelers[minIdx].name;
    const maxName = travelers[maxIdx].name;
    const minVal = dim.values[minIdx];
    const maxVal = dim.values[maxIdx];

    if (dim.key === 'pace' && maxVal - minVal >= 4) {
      conflicts.push(
        `${maxName} wants to sprint through the city while ${minName} prefers to savor one neighborhood — plan separate mornings?`
      );
    }
    if (dim.key === 'budgetStyle' && maxVal - minVal >= 4) {
      conflicts.push(
        `${minName} is counting coins while ${maxName} wants the tasting menu — set a shared meal budget and split luxury extras?`
      );
    }
    if (dim.key === 'crowdTolerance' && maxVal - minVal >= 4) {
      conflicts.push(
        `${maxName} wants the full tourist experience but ${minName} avoids crowds — hit popular spots early morning before the rush?`
      );
    }
    if (dim.key === 'foodAdventurousness' && maxVal - minVal >= 4) {
      conflicts.push(
        `${maxName} wants street food adventures while ${minName} plays it safe — split up for one meal and compare notes after?`
      );
    }
  }

  return conflicts;
}

function generateProTips(dimensions: DimensionResult[], _travelers: Traveler[]): string[] {
  const tips: string[] = [];
  const sorted = [...dimensions].sort((a, b) => a.score - b.score);

  for (const dim of sorted) {
    if (tips.length >= 3) break;

    if (dim.key === 'pace' && dim.score < 75) {
      tips.push(
        'Build in "free time" blocks where fast travelers can explore more while slow travelers can linger.'
      );
    }
    if (dim.key === 'budgetStyle' && dim.score < 75) {
      tips.push(
        'Agree on a daily shared budget for group activities, then let everyone spend their own way for personal time.'
      );
    }
    if (dim.key === 'crowdTolerance' && dim.score < 75) {
      tips.push(
        'Visit popular attractions at off-peak hours (early morning or late afternoon) to keep everyone comfortable.'
      );
    }
    if (dim.key === 'foodAdventurousness' && dim.score < 75) {
      tips.push(
        'Pick restaurants with diverse menus so adventurous eaters can try local specialties while others have familiar options.'
      );
    }
  }

  // Pad with general tips if needed
  const generalTips = [
    'Create a shared playlist for transit — music taste reveals more about compatibility than any quiz.',
    'Designate one "no-plan" day where the group votes on activities morning-of.',
    'Take turns picking the restaurant each night — everyone feels heard.',
  ];
  let gi = 0;
  while (tips.length < 3 && gi < generalTips.length) {
    tips.push(generalTips[gi++]);
  }

  return tips.slice(0, 3);
}

function suggestDestinationType(travelers: Traveler[]): string {
  const avgPace = travelers.reduce((s, t) => s + t.pace, 0) / travelers.length;
  const avgBudget = travelers.reduce((s, t) => s + t.budgetStyle, 0) / travelers.length;
  const avgCrowd = travelers.reduce((s, t) => s + t.crowdTolerance, 0) / travelers.length;
  const avgFood = travelers.reduce((s, t) => s + t.foodAdventurousness, 0) / travelers.length;

  if (avgPace <= 4 && avgBudget <= 4) return 'A laid-back beach town with cheap street food and no agenda';
  if (avgPace >= 7 && avgBudget >= 7) return 'A fast-paced capital city with world-class dining and nonstop energy';
  if (avgFood >= 7 && avgCrowd <= 4) return 'A hidden culinary destination with local markets and zero tourist crowds';
  if (avgFood >= 7 && avgCrowd >= 7) return 'A vibrant food capital with bustling night markets and famous restaurants';
  if (avgPace >= 7 && avgBudget <= 4) return 'A budget-friendly city with walkable neighborhoods and tons to see';
  if (avgCrowd <= 3) return 'A remote retreat — think small islands, mountain villages, or countryside escapes';
  if (avgBudget >= 7) return 'A luxury resort destination with curated experiences and premium comfort';
  if (avgPace <= 4) return 'A slow-travel coastal town with cafe culture and golden hour walks';
  return 'A mid-sized city with mixed neighborhoods, good food variety, and room to explore at your own pace';
}

function calculateChemistry(travelers: Traveler[]): ChemistryResult {
  const paceValues = travelers.map((t) => t.pace);
  const budgetValues = travelers.map((t) => t.budgetStyle);
  const crowdValues = travelers.map((t) => t.crowdTolerance);
  const foodValues = travelers.map((t) => t.foodAdventurousness);

  const dimensions: DimensionResult[] = [
    { label: 'Pace Match', key: 'pace', score: dimensionScore(paceValues), stdDev: stdDev(paceValues), values: paceValues },
    { label: 'Budget Alignment', key: 'budgetStyle', score: dimensionScore(budgetValues), stdDev: stdDev(budgetValues), values: budgetValues },
    { label: 'Crowd Vibe', key: 'crowdTolerance', score: dimensionScore(crowdValues), stdDev: stdDev(crowdValues), values: crowdValues },
    { label: 'Food Compatibility', key: 'foodAdventurousness', score: dimensionScore(foodValues), stdDev: stdDev(foodValues), values: foodValues },
  ];

  // Weighted average: pace 25%, budget 30%, crowd 20%, food 25%
  const weights = [0.25, 0.30, 0.20, 0.25];
  const overallScore = Math.round(
    dimensions.reduce((sum, d, i) => sum + d.score * weights[i], 0)
  );

  const { label } = getChemistryLabel(overallScore);
  const conflicts = generateConflicts(travelers, dimensions);
  const proTips = generateProTips(dimensions, travelers);
  const destinationType = suggestDestinationType(travelers);

  return {
    overallScore,
    dimensions,
    chemistryLabel: label,
    conflicts,
    proTips,
    destinationType,
  };
}

// ---------------------------------------------------------------------------
// Component
// ---------------------------------------------------------------------------

let _idCounter = 0;
function makeId(): string {
  return `tc_${Date.now()}_${++_idCounter}`;
}

function TripChemistryScreen() {
  const router = useRouter();
  const insets = useSafeAreaInsets();
  const { canAccess } = useProGate('trip-chemistry');
  const travelProfile = useAppStore((s) => s.travelProfile);

  useEffect(() => {
    if (!canAccess) router.replace('/paywall');
  }, [canAccess, router]);

  // State — declared before early return so hook order is stable
  const [travelers, setTravelers] = useState<Traveler[]>([
    {
      id: makeId(),
      name: 'You',
      pace: travelProfile.pace,
      budgetStyle: travelProfile.budgetStyle,
      crowdTolerance: travelProfile.crowdTolerance,
      foodAdventurousness: travelProfile.foodAdventurousness,
      isYou: true,
    },
  ]);
  const [result, setResult] = useState<ChemistryResult | null>(null);
  const [expandedId, setExpandedId] = useState<string | null>(null);

  // Animations
  const scoreAnim = useRef(new Animated.Value(0)).current;
  const fadeAnim = useRef(new Animated.Value(0)).current;
  const barAnims = useRef([
    new Animated.Value(0),
    new Animated.Value(0),
    new Animated.Value(0),
    new Animated.Value(0),
  ]).current;
  const scrollRef = useRef<ScrollView>(null);

  // Handlers
  const addCompanion = useCallback(() => {
    if (travelers.length >= 4) return;
    Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
    const newTraveler: Traveler = {
      id: makeId(),
      name: '',
      pace: 5,
      budgetStyle: 5,
      crowdTolerance: 5,
      foodAdventurousness: 5,
      isYou: false,
    };
    setTravelers((prev) => [...prev, newTraveler]);
    setExpandedId(newTraveler.id);
  }, [travelers.length]);

  const removeTraveler = useCallback((id: string) => {
    Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Medium);
    setTravelers((prev) => prev.filter((t) => t.id !== id));
    setExpandedId(null);
  }, []);

  const updateTraveler = useCallback((id: string, partial: Partial<Traveler>) => {
    setTravelers((prev) =>
      prev.map((t) => (t.id === id ? { ...t, ...partial } : t))
    );
  }, []);

  const handleCalculate = useCallback(() => {
    if (travelers.length < 2) return;
    const unnamed = travelers.find((t) => !t.isYou && !t.name.trim());
    if (unnamed) return;

    Haptics.notificationAsync(Haptics.NotificationFeedbackType.Success);
    const chemistry = calculateChemistry(travelers);
    setResult(chemistry);

    // Reset animations
    scoreAnim.setValue(0);
    fadeAnim.setValue(0);
    barAnims.forEach((a) => a.setValue(0));

    // Animate score count-up
    Animated.timing(scoreAnim, {
      toValue: chemistry.overallScore,
      duration: 1500,
      useNativeDriver: false,
    }).start();

    // Fade in results
    Animated.timing(fadeAnim, {
      toValue: 1,
      duration: 800,
      delay: 300,
      useNativeDriver: true,
    }).start();

    // Animate dimension bars
    Animated.stagger(
      150,
      barAnims.map((anim, i) =>
        Animated.timing(anim, {
          toValue: chemistry.dimensions[i].score,
          duration: 800,
          useNativeDriver: false,
        })
      )
    ).start();

    // Scroll to results
    setTimeout(() => {
      scrollRef.current?.scrollToEnd({ animated: true });
    }, 400);
  }, [travelers, scoreAnim, fadeAnim, barAnims]);

  const handleReset = useCallback(() => {
    Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Medium);
    setResult(null);
    setTravelers([
      {
        id: makeId(),
        name: 'You',
        pace: travelProfile.pace,
        budgetStyle: travelProfile.budgetStyle,
        crowdTolerance: travelProfile.crowdTolerance,
        foodAdventurousness: travelProfile.foodAdventurousness,
        isYou: true,
      },
    ]);
    setExpandedId(null);
    scrollRef.current?.scrollTo({ y: 0, animated: true });
  }, [travelProfile]);

  const handleShare = useCallback(async () => {
    if (!result) return;
    Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
    const names = travelers.map((t) => t.name || 'You').join(', ');
    const message = `Trip Chemistry: ${result.overallScore}/100 — ${result.chemistryLabel}\n\nTravelers: ${names}\n\n${result.dimensions.map((d) => `${d.label}: ${d.score}%`).join('\n')}\n\nBest destination type: ${result.destinationType}\n\nAnalyzed with ROAM`;
    try {
      await Share.share({ message });
    } catch {
      // User cancelled
    }
  }, [result, travelers]);

  if (!canAccess) return null;

  // Dimension bar color
  const barColor = (score: number) => {
    if (score >= 70) return COLORS.sage;
    if (score >= 45) return COLORS.gold;
    return COLORS.coral;
  };

  // Score ring
  const RING_SIZE = 180;
  const RING_STROKE = 10;
  const RING_RADIUS = (RING_SIZE - RING_STROKE) / 2;
  const RING_CIRCUMFERENCE = 2 * Math.PI * RING_RADIUS;

  const strokeDashoffset = scoreAnim.interpolate({
    inputRange: [0, 100],
    outputRange: [RING_CIRCUMFERENCE, 0],
    extrapolate: 'clamp',
  });

  const displayScore = scoreAnim.interpolate({
    inputRange: [0, 100],
    outputRange: [0, 100],
    extrapolate: 'clamp',
  });

  // Slider labels
  const sliderMeta = [
    { key: 'pace' as const, label: 'Pace', low: 'Slow & steady', high: 'Speed runner' },
    { key: 'budgetStyle' as const, label: 'Budget', low: 'Backpacker', high: 'Luxury' },
    { key: 'crowdTolerance' as const, label: 'Crowds', low: 'Avoid', high: 'Embrace' },
    { key: 'foodAdventurousness' as const, label: 'Food', low: 'Familiar', high: 'Adventurous' },
  ];

  const canCalculate = travelers.length >= 2 && travelers.every((t) => t.isYou || t.name.trim());

  return (
    <LinearGradient
      colors={[COLORS.bg, COLORS.gradientForest14, COLORS.bg]}
      style={[styles.container, { paddingTop: insets.top }]}
    >
      {/* Header */}
      <View style={styles.header}>
        <TouchableOpacity onPress={() => router.back()} style={styles.backButton}>
          <ChevronLeft size={24} color={COLORS.cream} strokeWidth={2} />
        </TouchableOpacity>
        <View style={styles.headerCenter}>
          <Text style={styles.headerTitle}>Trip Chemistry</Text>
          <Text style={styles.headerSubtitle}>
            How well will you travel together?
          </Text>
        </View>
        <View style={{ width: 40 }} />
      </View>

      <ScrollView
        ref={scrollRef}
        style={styles.scroll}
        contentContainerStyle={[styles.scrollContent, { paddingBottom: insets.bottom + 40 }]}
        showsVerticalScrollIndicator={false}
        keyboardShouldPersistTaps="handled"
      >
        {/* Phase 1: Input */}
        {travelers.map((traveler, _index) => (
          <View key={traveler.id} style={styles.travelerCard}>
            <TouchableOpacity
              style={styles.travelerHeader}
              onPress={() => setExpandedId(expandedId === traveler.id ? null : traveler.id)}
              activeOpacity={0.7}
            >
              <View style={styles.travelerHeaderLeft}>
                <View style={[styles.avatarCircle, traveler.isYou && styles.avatarCircleYou]}>
                  <Text style={styles.avatarText}>
                    {traveler.isYou ? 'Y' : (traveler.name?.[0]?.toUpperCase() || '?')}
                  </Text>
                </View>
                <View>
                  {traveler.isYou ? (
                    <Text style={styles.travelerName}>You</Text>
                  ) : (
                    <TextInput
                      style={styles.nameInput}
                      placeholder="Name"
                      placeholderTextColor={COLORS.creamMuted}
                      value={traveler.name}
                      onChangeText={(text) => updateTraveler(traveler.id, { name: text })}
                      onFocus={() => setExpandedId(traveler.id)}
                    />
                  )}
                  <Text style={styles.travelerMeta}>
                    {sliderMeta.map((s) => `${s.label[0]}:${traveler[s.key]}`).join('  ')}
                  </Text>
                </View>
              </View>
              <View style={styles.travelerHeaderRight}>
                {!traveler.isYou && (
                  <TouchableOpacity
                    onPress={() => removeTraveler(traveler.id)}
                    hitSlop={{ top: 12, bottom: 12, left: 12, right: 12 }}
                    style={styles.removeButton}
                  >
                    <XCircle size={22} color={COLORS.coral} strokeWidth={2} />
                  </TouchableOpacity>
                )}
                {expandedId === traveler.id ? (
                  <ChevronUp size={18} color={COLORS.creamMuted} strokeWidth={2} />
                ) : (
                  <ChevronDown size={18} color={COLORS.creamMuted} strokeWidth={2} />
                )}
              </View>
            </TouchableOpacity>

            {expandedId === traveler.id && (
              <View style={styles.sliderSection}>
                {sliderMeta.map((meta) => (
                  <View key={meta.key} style={styles.sliderRow}>
                    <View style={styles.sliderLabelRow}>
                      <Text style={styles.sliderLabel}>{meta.label}</Text>
                      <Text style={styles.sliderValue}>{traveler[meta.key]}</Text>
                    </View>
                    <Slider
                      style={styles.slider}
                      minimumValue={1}
                      maximumValue={10}
                      step={1}
                      value={traveler[meta.key]}
                      onValueChange={(val: number) =>
                        updateTraveler(traveler.id, { [meta.key]: val })
                      }
                      minimumTrackTintColor={COLORS.sage}
                      maximumTrackTintColor={COLORS.border}
                      thumbTintColor={COLORS.cream}
                    />
                    <View style={styles.sliderHintRow}>
                      <Text style={styles.sliderHint}>{meta.low}</Text>
                      <Text style={styles.sliderHint}>{meta.high}</Text>
                    </View>
                  </View>
                ))}
              </View>
            )}
          </View>
        ))}

        {/* Add Companion Button */}
        {travelers.length < 4 && !result && (
          <TouchableOpacity style={styles.addButton} onPress={addCompanion} activeOpacity={0.7}>
            <UserPlus size={20} color={COLORS.sage} strokeWidth={2} />
            <Text style={styles.addButtonText}>Add companion</Text>
          </TouchableOpacity>
        )}

        {/* Calculate Button */}
        {!result && (
          <TouchableOpacity
            style={[styles.calculateButton, !canCalculate && styles.calculateButtonDisabled]}
            onPress={handleCalculate}
            disabled={!canCalculate}
            activeOpacity={0.8}
          >
            <LinearGradient
              colors={canCalculate ? [COLORS.coral, COLORS.alterCoral] : [COLORS.neutralDark, COLORS.neutralDarker]}
              style={styles.calculateGradient}
              start={{ x: 0, y: 0 }}
              end={{ x: 1, y: 1 }}
            >
              <FlaskConical size={20} color={COLORS.white} strokeWidth={2} />
              <Text style={styles.calculateText}>Calculate Chemistry</Text>
            </LinearGradient>
          </TouchableOpacity>
        )}

        {travelers.length < 2 && !result && (
          <Text style={styles.hintText}>Add at least one companion to analyze chemistry</Text>
        )}

        {/* Phase 2: Results */}
        {result && (
          <Animated.View style={[styles.resultsContainer, { opacity: fadeAnim }]}>
            {/* Score Ring */}
            <View style={styles.scoreSection}>
              <View style={styles.ringContainer}>
                <Svg width={RING_SIZE} height={RING_SIZE} style={styles.ringSvg}>
                  {/* Background ring */}
                  <Circle
                    cx={RING_SIZE / 2}
                    cy={RING_SIZE / 2}
                    r={RING_RADIUS}
                    stroke={COLORS.border}
                    strokeWidth={RING_STROKE}
                    fill="transparent"
                  />
                  {/* Animated fill ring */}
                  <AnimatedCircle
                    cx={RING_SIZE / 2}
                    cy={RING_SIZE / 2}
                    r={RING_RADIUS}
                    stroke={barColor(result.overallScore)}
                    strokeWidth={RING_STROKE}
                    fill="transparent"
                    strokeDasharray={RING_CIRCUMFERENCE}
                    strokeDashoffset={strokeDashoffset}
                    strokeLinecap="round"
                    rotation="-90"
                    origin={`${RING_SIZE / 2}, ${RING_SIZE / 2}`}
                  />
                </Svg>
                <View style={styles.scoreInner}>
                  <AnimatedScore displayScore={displayScore} />
                  <Text style={styles.scoreOutOf}>/100</Text>
                </View>
              </View>
              <Text style={styles.chemistryLabel}>{result.chemistryLabel}</Text>
            </View>

            {/* Dimension Bars */}
            <View style={styles.dimensionsCard}>
              <Text style={styles.sectionTitle}>Compatibility Breakdown</Text>
              {result.dimensions.map((dim, i) => (
                <View key={dim.key} style={styles.dimensionRow}>
                  <View style={styles.dimensionLabelRow}>
                    <Text style={styles.dimensionLabel}>{dim.label}</Text>
                    <Text style={[styles.dimensionScore, { color: barColor(dim.score) }]}>
                      {dim.score}%
                    </Text>
                  </View>
                  <View style={styles.barTrack}>
                    <Animated.View
                      style={[
                        styles.barFill,
                        {
                          backgroundColor: barColor(dim.score),
                          width: barAnims[i].interpolate({
                            inputRange: [0, 100],
                            outputRange: ['0%', '100%'],
                          }),
                        },
                      ]}
                    />
                  </View>
                </View>
              ))}
            </View>

            {/* Conflicts */}
            {result.conflicts.length > 0 && (
              <View style={styles.conflictsCard}>
                <Text style={styles.sectionTitle}>Potential Conflicts</Text>
                {result.conflicts.map((conflict, i) => (
                  <View key={i} style={styles.conflictItem}>
                    <View style={styles.conflictIcon}>
                      <AlertTriangle size={16} color={COLORS.gold} strokeWidth={2} />
                    </View>
                    <Text style={styles.conflictText}>{conflict}</Text>
                  </View>
                ))}
              </View>
            )}

            {/* Pro Tips */}
            <View style={styles.tipsCard}>
              <Text style={styles.sectionTitle}>Pro Tips</Text>
              {result.proTips.map((tip, i) => (
                <View key={i} style={styles.tipItem}>
                  <View style={styles.tipNumber}>
                    <Text style={styles.tipNumberText}>{i + 1}</Text>
                  </View>
                  <Text style={styles.tipText}>{tip}</Text>
                </View>
              ))}
            </View>

            {/* Best Destination Type */}
            <View style={styles.destinationCard}>
              <Text style={styles.sectionTitle}>Best Destination Type</Text>
              <View style={styles.destinationContent}>
                <Compass size={24} color={COLORS.sage} strokeWidth={2} />
                <Text style={styles.destinationText}>{result.destinationType}</Text>
              </View>
            </View>

            {/* Action Buttons */}
            <View style={styles.actionRow}>
              <TouchableOpacity style={styles.shareButton} onPress={handleShare} activeOpacity={0.7}>
                <Share2 size={20} color={COLORS.cream} strokeWidth={2} />
                <Text style={styles.shareButtonText}>Share results</Text>
              </TouchableOpacity>
            </View>

            <TouchableOpacity style={styles.resetButton} onPress={handleReset} activeOpacity={0.7}>
              <RotateCcw size={18} color={COLORS.creamMuted} strokeWidth={2} />
              <Text style={styles.resetButtonText}>Try different group</Text>
            </TouchableOpacity>
          </Animated.View>
        )}
      </ScrollView>
    </LinearGradient>
  );
}

// ---------------------------------------------------------------------------
// Animated score display (counts up)
// ---------------------------------------------------------------------------

function AnimatedScore({ displayScore }: { displayScore: Animated.AnimatedInterpolation<number> }) {
  const [text, setText] = useState('0');

  useEffect(() => {
    const listener = displayScore.addListener(({ value }) => {
      setText(String(Math.round(value)));
    });
    return () => displayScore.removeListener(listener);
  }, [displayScore]);

  return <Text style={styles.scoreText}>{text}</Text>;
}

// ---------------------------------------------------------------------------
// Styles
// ---------------------------------------------------------------------------

const styles = StyleSheet.create({
  container: {
    flex: 1,
  },
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: SPACING.md,
    paddingVertical: SPACING.sm,
  },
  backButton: {
    width: 40,
    height: 40,
    justifyContent: 'center',
    alignItems: 'center',
  },
  headerCenter: {
    flex: 1,
    alignItems: 'center',
  },
  headerTitle: {
    fontFamily: FONTS.header,
    fontSize: 26,
    color: COLORS.cream,
    letterSpacing: 0.5,
  },
  headerSubtitle: {
    fontFamily: FONTS.mono,
    fontSize: 11,
    color: COLORS.creamMuted,
    marginTop: 2,
    letterSpacing: 0.3,
  },
  scroll: {
    flex: 1,
  },
  scrollContent: {
    paddingHorizontal: SPACING.md,
    paddingTop: SPACING.md,
  },

  // Traveler Card
  travelerCard: {
    backgroundColor: COLORS.bgGlass,
    borderRadius: RADIUS.lg,
    borderWidth: 1,
    borderColor: COLORS.border,
    marginBottom: SPACING.sm,
    overflow: 'hidden',
  },
  travelerHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    padding: SPACING.md,
  },
  travelerHeaderLeft: {
    flexDirection: 'row',
    alignItems: 'center',
    flex: 1,
  },
  travelerHeaderRight: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: SPACING.sm,
  },
  avatarCircle: {
    width: 40,
    height: 40,
    borderRadius: RADIUS.full,
    backgroundColor: COLORS.sageLight,
    justifyContent: 'center',
    alignItems: 'center',
    marginRight: SPACING.sm,
  },
  avatarCircleYou: {
    backgroundColor: COLORS.sage,
  },
  avatarText: {
    fontFamily: FONTS.bodySemiBold,
    fontSize: 16,
    color: COLORS.cream,
  },
  travelerName: {
    fontFamily: FONTS.bodySemiBold,
    fontSize: 16,
    color: COLORS.cream,
  },
  nameInput: {
    fontFamily: FONTS.bodySemiBold,
    fontSize: 16,
    color: COLORS.cream,
    padding: 0,
    minWidth: 120,
    borderBottomWidth: 1,
    borderBottomColor: COLORS.border,
    paddingBottom: 2,
  },
  travelerMeta: {
    fontFamily: FONTS.mono,
    fontSize: 10,
    color: COLORS.creamMuted,
    marginTop: 3,
    letterSpacing: 0.3,
  },
  removeButton: {
    padding: 2,
  },

  // Sliders
  sliderSection: {
    paddingHorizontal: SPACING.md,
    paddingBottom: SPACING.md,
    borderTopWidth: 1,
    borderTopColor: COLORS.border,
    paddingTop: SPACING.sm,
  },
  sliderRow: {
    marginBottom: SPACING.sm,
  },
  sliderLabelRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 2,
  },
  sliderLabel: {
    fontFamily: FONTS.bodyMedium,
    fontSize: 13,
    color: COLORS.cream,
  },
  sliderValue: {
    fontFamily: FONTS.monoMedium,
    fontSize: 13,
    color: COLORS.sage,
  },
  slider: {
    width: '100%',
    height: 36,
  },
  sliderHintRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    marginTop: -4,
  },
  sliderHint: {
    fontFamily: FONTS.mono,
    fontSize: 9,
    color: COLORS.creamMuted,
    letterSpacing: 0.2,
  },

  // Add Button
  addButton: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: SPACING.sm,
    paddingVertical: SPACING.md,
    borderRadius: RADIUS.lg,
    borderWidth: 1,
    borderColor: COLORS.sageLight,
    borderStyle: 'dashed',
    marginBottom: SPACING.md,
  },
  addButtonText: {
    fontFamily: FONTS.bodyMedium,
    fontSize: 14,
    color: COLORS.sage,
  },

  // Calculate Button
  calculateButton: {
    borderRadius: RADIUS.lg,
    overflow: 'hidden',
    marginBottom: SPACING.sm,
  },
  calculateButtonDisabled: {
    opacity: 0.4,
  },
  calculateGradient: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: SPACING.sm,
    paddingVertical: SPACING.md,
  },
  calculateText: {
    fontFamily: FONTS.bodySemiBold,
    fontSize: 16,
    color: COLORS.white,
    letterSpacing: 0.3,
  },
  hintText: {
    fontFamily: FONTS.mono,
    fontSize: 11,
    color: COLORS.creamMuted,
    textAlign: 'center',
    marginTop: SPACING.xs,
  },

  // Results
  resultsContainer: {
    marginTop: SPACING.lg,
  },

  // Score Ring
  scoreSection: {
    alignItems: 'center',
    marginBottom: SPACING.xl,
  },
  ringContainer: {
    width: 180,
    height: 180,
    justifyContent: 'center',
    alignItems: 'center',
  },
  ringSvg: {
    position: 'absolute',
  },
  scoreInner: {
    alignItems: 'center',
  },
  scoreText: {
    fontFamily: FONTS.header,
    fontSize: 52,
    color: COLORS.cream,
    lineHeight: 56,
  },
  scoreOutOf: {
    fontFamily: FONTS.mono,
    fontSize: 14,
    color: COLORS.creamMuted,
    marginTop: -2,
  },
  chemistryLabel: {
    fontFamily: FONTS.headerMedium,
    fontSize: 22,
    color: COLORS.cream,
    marginTop: SPACING.md,
    textAlign: 'center',
  },

  // Dimension Bars
  dimensionsCard: {
    backgroundColor: COLORS.bgGlass,
    borderRadius: RADIUS.lg,
    borderWidth: 1,
    borderColor: COLORS.border,
    padding: SPACING.md,
    marginBottom: SPACING.md,
  },
  sectionTitle: {
    fontFamily: FONTS.header,
    fontSize: 20,
    color: COLORS.cream,
    marginBottom: SPACING.md,
  },
  dimensionRow: {
    marginBottom: SPACING.md,
  },
  dimensionLabelRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    marginBottom: SPACING.xs,
  },
  dimensionLabel: {
    fontFamily: FONTS.bodyMedium,
    fontSize: 13,
    color: COLORS.cream,
  },
  dimensionScore: {
    fontFamily: FONTS.monoMedium,
    fontSize: 13,
  },
  barTrack: {
    height: 8,
    borderRadius: RADIUS.full,
    backgroundColor: COLORS.border,
    overflow: 'hidden',
  },
  barFill: {
    height: '100%',
    borderRadius: RADIUS.full,
  },

  // Conflicts
  conflictsCard: {
    backgroundColor: COLORS.bgGlass,
    borderRadius: RADIUS.lg,
    borderWidth: 1,
    borderColor: COLORS.border,
    padding: SPACING.md,
    marginBottom: SPACING.md,
  },
  conflictItem: {
    flexDirection: 'row',
    marginBottom: SPACING.sm,
  },
  conflictIcon: {
    marginRight: SPACING.sm,
    marginTop: 2,
  },
  conflictText: {
    fontFamily: FONTS.body,
    fontSize: 13,
    color: COLORS.creamMuted,
    flex: 1,
    lineHeight: 19,
  },

  // Pro Tips
  tipsCard: {
    backgroundColor: COLORS.bgGlass,
    borderRadius: RADIUS.lg,
    borderWidth: 1,
    borderColor: COLORS.border,
    padding: SPACING.md,
    marginBottom: SPACING.md,
  },
  tipItem: {
    flexDirection: 'row',
    marginBottom: SPACING.sm,
  },
  tipNumber: {
    width: 24,
    height: 24,
    borderRadius: RADIUS.full,
    backgroundColor: COLORS.sageLight,
    justifyContent: 'center',
    alignItems: 'center',
    marginRight: SPACING.sm,
    marginTop: 1,
  },
  tipNumberText: {
    fontFamily: FONTS.monoMedium,
    fontSize: 12,
    color: COLORS.sage,
  },
  tipText: {
    fontFamily: FONTS.body,
    fontSize: 13,
    color: COLORS.creamMuted,
    flex: 1,
    lineHeight: 19,
  },

  // Destination
  destinationCard: {
    backgroundColor: COLORS.bgGlass,
    borderRadius: RADIUS.lg,
    borderWidth: 1,
    borderColor: COLORS.border,
    padding: SPACING.md,
    marginBottom: SPACING.lg,
  },
  destinationContent: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: SPACING.sm,
  },
  destinationText: {
    fontFamily: FONTS.bodyMedium,
    fontSize: 14,
    color: COLORS.cream,
    flex: 1,
    lineHeight: 20,
  },

  // Actions
  actionRow: {
    marginBottom: SPACING.md,
  },
  shareButton: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: SPACING.sm,
    paddingVertical: SPACING.md,
    borderRadius: RADIUS.lg,
    borderWidth: 1,
    borderColor: COLORS.sage,
  },
  shareButtonText: {
    fontFamily: FONTS.bodyMedium,
    fontSize: 14,
    color: COLORS.cream,
  },
  resetButton: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: SPACING.xs,
    paddingVertical: SPACING.sm,
    marginBottom: SPACING.xl,
  },
  resetButtonText: {
    fontFamily: FONTS.mono,
    fontSize: 12,
    color: COLORS.creamMuted,
  },
});

export default withComingSoon(TripChemistryScreen, { routeName: 'trip-chemistry', title: 'Trip Chemistry' });
