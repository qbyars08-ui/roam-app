// =============================================================================
// ROAM — Plan Screen (3-Step Trip Wizard)
// Step 1: Destination  |  Step 2: Budget + Days  |  Step 3: Vibes + Generate
// =============================================================================
import React, { useState, useMemo } from 'react';
import {
  View,
  Text,
  TextInput,
  ScrollView,
  Pressable,
  StyleSheet,
  Alert,
  KeyboardAvoidingView,
  Platform,
  type ViewStyle,
  type TextStyle,
} from 'react-native';
import { useRouter } from 'expo-router';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import * as Haptics from 'expo-haptics';
import { COLORS, FONTS, SPACING, RADIUS, DESTINATIONS, BUDGETS, VIBES, FREE_TRIPS_PER_MONTH } from '../../lib/constants';
import { useAppStore } from '../../lib/store';
import { generateItinerary } from '../../lib/claude';
import { TripLimitReachedError } from '../../lib/claude';
import Button from '../../components/ui/Button';
import VisaChecker from '../../components/features/VisaChecker';
import HealthBriefCard from '../../components/features/HealthBriefCard';
import SafetyScoreBadge from '../../components/features/SafetyScoreBadge';
import Tag from '../../components/ui/Tag';
import { track } from '../../lib/analytics';
import { trackItineraryOutcome } from '../../lib/ai-improvement';
import { learnFromTrip } from '../../lib/personalization';
import { recordPlanned } from '../../lib/social-proof';

// ---------------------------------------------------------------------------
// Day-count presets
// ---------------------------------------------------------------------------
const DAY_OPTIONS = ['3', '5', '7', '10', '14'];

// ---------------------------------------------------------------------------
// Component
// ---------------------------------------------------------------------------
export default function PlanScreen() {
  const router = useRouter();
  const insets = useSafeAreaInsets();

  const planWizard = useAppStore((s) => s.planWizard);
  const setPlanWizard = useAppStore((s) => s.setPlanWizard);
  const resetPlanWizard = useAppStore((s) => s.resetPlanWizard);
  const addTrip = useAppStore((s) => s.addTrip);
  const setTripsThisMonth = useAppStore((s) => s.setTripsThisMonth);
  const tripsThisMonth = useAppStore((s) => s.tripsThisMonth);
  const isPro = useAppStore((s) => s.isPro);
  const isGenerating = useAppStore((s) => s.isGenerating);
  const setIsGenerating = useAppStore((s) => s.setIsGenerating);
  const hasCompletedProfile = useAppStore((s) => s.hasCompletedProfile);
  const travelProfile = useAppStore((s) => s.travelProfile);

  const [step, setStep] = useState(1);
  const [customDays, setCustomDays] = useState('');

  // Destination filter for suggestions
  const filteredDestinations = useMemo(() => {
    if (!planWizard.destination.trim()) return DESTINATIONS;
    const query = planWizard.destination.toLowerCase();
    return DESTINATIONS.filter((d) =>
      d.label.toLowerCase().includes(query)
    );
  }, [planWizard.destination]);

  // ---------------------------------------------------------------------------
  // Navigation helpers
  // ---------------------------------------------------------------------------
  const canProceedStep1 = planWizard.destination.trim().length > 0;
  const canProceedStep2 = planWizard.budget.length > 0 && Number(planWizard.days) > 0;
  const canGenerate = planWizard.vibes.length > 0;

  const nextStep = () => {
    if (step === 1) tryParseNaturalLanguage(planWizard.destination);
    track({ type: 'flow_step', flow: 'plan_wizard', step, payload: { destination: planWizard.destination } });
    setStep((s) => Math.min(s + 1, 3));
  };
  const prevStep = () => setStep((s) => Math.max(s - 1, 1));

  // ---------------------------------------------------------------------------
  // Vibe toggle
  // ---------------------------------------------------------------------------
  const toggleVibe = (vibeId: string) => {
    const current = planWizard.vibes;
    if (current.includes(vibeId)) {
      setPlanWizard({ vibes: current.filter((v) => v !== vibeId) });
    } else {
      setPlanWizard({ vibes: [...current, vibeId] });
    }
  };

  // ---------------------------------------------------------------------------
  // Parse natural language (e.g. "5 days in Tokyo $800 budget")
  // ---------------------------------------------------------------------------
  const mapBudgetFromAmount = (total: number, days: number): string => {
    const perDay = days > 0 ? total / days : total;
    if (perDay <= 75) return 'backpacker';
    if (perDay <= 200) return 'comfort';
    if (perDay <= 500) return 'treat-yourself';
    return 'no-budget';
  };

  const tryParseNaturalLanguage = (text: string) => {
    const t = text.trim();
    const daysMatch = t.match(/(\d+)\s*days?/i);
    const budgetMatch = t.match(/\$([\d,]+)/);
    const inMatch = t.match(/(?:in|to)\s+([^$]+?)(?:\s*\$|$)/i) ?? t.match(/^(.+?)(?:\s+\d+\s*days|\s*\$)/i);
    const dest = (inMatch?.[1]?.trim() ?? t.replace(/\d+\s*days?|\$[\d,]+|budget/gi, '').trim()) || t.split(/\d|\$/)[0]?.trim();
    if (dest) {
      const totalBudget = budgetMatch ? Number(budgetMatch[1].replace(/,/g, '')) : 0;
      const numDays = daysMatch ? Number(daysMatch[1]) : Number(planWizard.days) || 7;
      setPlanWizard({
        destination: dest,
        days: daysMatch ? daysMatch[1] : planWizard.days,
        budget: totalBudget > 0 ? mapBudgetFromAmount(totalBudget, numDays) : planWizard.budget,
      });
    }
  };

  // ---------------------------------------------------------------------------
  // Days selection
  // ---------------------------------------------------------------------------
  const selectDays = (d: string) => {
    Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
    setPlanWizard({ days: d });
    setCustomDays('');
  };

  const handleCustomDaysChange = (val: string) => {
    const cleaned = val.replace(/[^0-9]/g, '');
    setCustomDays(cleaned);
    if (cleaned) {
      setPlanWizard({ days: cleaned });
    }
  };

  // ---------------------------------------------------------------------------
  // Generate trip (uses generateItinerary — fetches weather and injects into
  // prompt so AI swaps outdoor→indoor activities on rainy days)
  // ---------------------------------------------------------------------------
  const handleGenerate = async () => {
    // On first trip, send to travel profile screen first
    if (!hasCompletedProfile) {
      router.push('/travel-profile');
      return;
    }

    Haptics.notificationAsync(Haptics.NotificationFeedbackType.Success);
    setIsGenerating(true);

    try {
      const today = new Date().toISOString().split('T')[0];
      const { itinerary: parsedItinerary, tripsUsed } = await generateItinerary({
        destination: planWizard.destination,
        days: Number(planWizard.days),
        budget: planWizard.budget,
        vibes: planWizard.vibes,
        travelProfile: hasCompletedProfile ? travelProfile : null,
        startDate: today, // align forecast to trip start
      });

      const itineraryStr = JSON.stringify(parsedItinerary);
      const trip = {
        id: Date.now().toString(),
        destination: planWizard.destination,
        days: Number(planWizard.days),
        budget: planWizard.budget,
        vibes: planWizard.vibes,
        itinerary: itineraryStr,
        createdAt: new Date().toISOString(),
      };

      addTrip(trip);
      trackItineraryOutcome(trip.id, trip.destination, true);
      setTripsThisMonth(tripsUsed);
      learnFromTrip(trip.destination, trip.vibes, trip.budget).catch(() => {});
      recordPlanned(trip.destination).catch(() => {});
      resetPlanWizard();
      setStep(1);

      // Navigate to itinerary modal
      router.push({ pathname: '/itinerary', params: { tripId: trip.id } });
    } catch (err: any) {
      if (err instanceof TripLimitReachedError) {
        router.push('/paywall');
      } else {
        track({ type: 'feature_use', feature: 'plan_fallback_used', payload: { destination: planWizard.destination } });
        // Show error — don't silently present fake data as real
        Alert.alert(
          'Give us another shot',
          'We had trouble reaching our servers. Check your connection and try again — your trip is worth it.',
          [{ text: 'Try again' }]
        );
      }
    } finally {
      setIsGenerating(false);
    }
  };

  // ---------------------------------------------------------------------------
  // Render
  // ---------------------------------------------------------------------------
  return (
    <KeyboardAvoidingView
      style={[styles.container, { paddingTop: insets.top }]}
      behavior={Platform.OS === 'ios' ? 'padding' : 'height'}
      keyboardVerticalOffset={0}
    >
      {/* Header */}
      <View style={styles.header}>
        <Text style={styles.headerTitle}>Let's plan your trip</Text>
        <Text style={styles.stepLabel}>Step {step} of 3</Text>
      </View>

      {/* Progress bar */}
      <View style={styles.progressBar}>
        <View style={[styles.progressFill, { width: `${(step / 3) * 100}%` }]} />
      </View>

      {/* Trip limit banner — upgrade prompt when at limit */}
      {!isPro && tripsThisMonth >= FREE_TRIPS_PER_MONTH && (
        <Pressable
          style={styles.limitBanner}
          onPress={() => router.push('/paywall')}
        >
          <Text style={styles.limitBannerText}>
            You've used your free trip for this month. Upgrade for unlimited plans — you deserve more adventures.
          </Text>
          <Text style={styles.limitBannerCta}>Upgrade →</Text>
        </Pressable>
      )}

      <ScrollView
        contentContainerStyle={styles.scrollContent}
        showsVerticalScrollIndicator={false}
        keyboardShouldPersistTaps="handled"
      >
        {/* ----------------------------------------------------------------- */}
        {/* STEP 1: Destination */}
        {/* ----------------------------------------------------------------- */}
        {step === 1 && (
          <View style={styles.stepContainer}>
            <Text style={styles.stepTitle}>Where do you want to go?</Text>

            <TextInput
              style={styles.textInput}
              value={planWizard.destination}
              onChangeText={(val) => setPlanWizard({ destination: val })}
              placeholder="Try: Tokyo, 5 days in Bali, or anywhere you dream of"
              placeholderTextColor={`${COLORS.cream}33`}
              autoCapitalize="words"
              autoCorrect={false}
            />

            <Text style={styles.sectionLabel}>Popular destinations</Text>
            <View style={styles.tagGrid}>
              {filteredDestinations.map((dest) => (
                <Pressable
                  key={dest.label}
                  style={({ pressed }) => [
                    styles.destChip,
                    planWizard.destination === dest.label && styles.destChipSelected,
                    { opacity: pressed ? 0.8 : 1 },
                  ]}
                  onPress={() => {
                    Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
                    setPlanWizard({ destination: dest.label });
                  }}
                >
                  <Text
                    style={[
                      styles.destChipLabel,
                      planWizard.destination === dest.label && styles.destChipLabelSelected,
                    ]}
                  >
                    {dest.label}
                  </Text>
                </Pressable>
              ))}
            </View>

            <View style={styles.navRow}>
              <View style={styles.navSpacer} />
              <Button
                label="Continue"
                variant="sage"
                onPress={nextStep}
                disabled={!canProceedStep1}
              />
            </View>
          </View>
        )}

        {/* ----------------------------------------------------------------- */}
        {/* STEP 2: Budget + Days */}
        {/* ----------------------------------------------------------------- */}
        {step === 2 && (
          <View style={styles.stepContainer}>
            <Text style={styles.stepTitle}>Budget and length</Text>

            {/* Budget selection */}
            <Text style={styles.sectionLabel}>What's your style?</Text>
            <View style={styles.budgetGrid}>
              {BUDGETS.map((b) => (
                <Pressable
                  key={b.id}
                  style={({ pressed }) => [
                    styles.budgetCard,
                    planWizard.budget === b.id && styles.budgetCardSelected,
                    { opacity: pressed ? 0.8 : 1 },
                  ]}
                  onPress={() => {
                    Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
                    setPlanWizard({ budget: b.id });
                  }}
                >
                  <Text
                    style={[
                      styles.budgetLabel,
                      planWizard.budget === b.id && styles.budgetLabelSelected,
                    ]}
                  >
                    {b.label}
                  </Text>
                  <Text style={styles.budgetVibe}>{b.vibe}</Text>
                  <Text style={styles.budgetRange}>{b.range}</Text>
                </Pressable>
              ))}
            </View>

            {/* Days selection */}
            <Text style={styles.sectionLabel}>How many days?</Text>
            <View style={styles.daysRow}>
              {DAY_OPTIONS.map((d) => (
                <Pressable
                  key={d}
                  style={[
                    styles.dayChip,
                    planWizard.days === d && !customDays && styles.dayChipSelected,
                  ]}
                  onPress={() => selectDays(d)}
                >
                  <Text
                    style={[
                      styles.dayChipText,
                      planWizard.days === d && !customDays && styles.dayChipTextSelected,
                    ]}
                  >
                    {d}
                  </Text>
                </Pressable>
              ))}
              <TextInput
                style={[styles.dayCustomInput as any, customDays ? styles.dayChipSelected : undefined]}
                value={customDays}
                onChangeText={handleCustomDaysChange}
                placeholder="Custom"
                placeholderTextColor={`${COLORS.cream}33`}
                keyboardType="number-pad"
                maxLength={2}
              />
            </View>
            <Text style={styles.daysCaption}>
              {planWizard.days ? `${planWizard.days} days — perfect.` : 'Tap to choose'}
            </Text>

            <View style={styles.navRow}>
              <Pressable
                onPress={() => {
                  Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
                  prevStep();
                }}
                accessibilityRole="button"
                accessibilityLabel="Back"
              >
                <Text style={styles.backLink}>Back</Text>
              </Pressable>
              <View style={styles.navButtonContainer}>
                <Button
                  label="Continue"
                  variant="sage"
                  onPress={nextStep}
                  disabled={!canProceedStep2}
                />
              </View>
            </View>
          </View>
        )}

        {/* ----------------------------------------------------------------- */}
        {/* STEP 3: Vibes + Generate */}
        {/* ----------------------------------------------------------------- */}
        {step === 3 && (
          <View style={styles.stepContainer}>
            <Text style={styles.stepTitle}>What's the vibe?</Text>
            <Text style={styles.stepSubtitle}>Pick as many as you want. We'll build around it.</Text>

            <View style={styles.vibeGrid}>
              {VIBES.map((v) => (
                <Tag
                  key={v.id}
                  label={v.label}
                  selected={planWizard.vibes.includes(v.id)}
                  onPress={() => toggleVibe(v.id)}
                />
              ))}
            </View>

            {/* Health brief — before trip generates */}
            <HealthBriefCard destination={planWizard.destination} />

            {/* Safety score — US State Dept advisory before trip generates */}
            <View style={{ marginBottom: SPACING.md }}>
              <SafetyScoreBadge destination={planWizard.destination} variant="full" />
            </View>

            {/* Visa checker — passport selector, shown before every trip generates */}
            <VisaChecker destination={planWizard.destination} variant="full" />

            {/* Trip summary */}
            <View style={styles.summaryCard}>
              <Text style={styles.summaryTitle}>Here's what we're building</Text>
              <View style={styles.summaryRow}>
                <Text style={styles.summaryLabel}>Going to</Text>
                <Text style={styles.summaryValue}>{planWizard.destination}</Text>
              </View>
              <View style={styles.summaryRow}>
                <Text style={styles.summaryLabel}>For</Text>
                <Text style={styles.summaryValue}>{planWizard.days} days</Text>
              </View>
              <View style={styles.summaryRow}>
                <Text style={styles.summaryLabel}>Style</Text>
                <Text style={styles.summaryValue}>
                  {BUDGETS.find((b) => b.id === planWizard.budget)?.label ?? planWizard.budget}
                </Text>
              </View>
              <View style={styles.summaryRow}>
                <Text style={styles.summaryLabel}>Vibes</Text>
                <Text style={styles.summaryValue}>
                  {planWizard.vibes
                    .map((vid) => VIBES.find((v) => v.id === vid)?.label ?? vid)
                    .join(', ') || 'Tap a few above'}
                </Text>
              </View>
            </View>

            <View style={styles.navRow}>
              <Pressable
                onPress={() => {
                  Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
                  prevStep();
                }}
                accessibilityRole="button"
                accessibilityLabel="Back"
              >
                <Text style={styles.backLink}>Back</Text>
              </Pressable>
              <View style={styles.navButtonContainer}>
                <Button
                  label={isGenerating ? 'Creating your trip...' : 'Create my trip'}
                  variant="coral"
                  onPress={handleGenerate}
                  loading={isGenerating}
                  disabled={!canGenerate || isGenerating}
                />
              </View>
            </View>
          </View>
        )}
      </ScrollView>
    </KeyboardAvoidingView>
  );
}

// ---------------------------------------------------------------------------
// Styles
// ---------------------------------------------------------------------------
const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: COLORS.bg,
  } as ViewStyle,
  header: {
    paddingHorizontal: SPACING.lg,
    paddingTop: SPACING.md,
    paddingBottom: SPACING.sm,
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'baseline',
  } as ViewStyle,
  headerTitle: {
    fontFamily: FONTS.header,
    fontSize: 28,
    color: COLORS.cream,
  } as TextStyle,
  stepLabel: {
    fontFamily: FONTS.mono,
    fontSize: 11,
    color: COLORS.sage,
    letterSpacing: 1.5,
  } as TextStyle,
  progressBar: {
    height: 3,
    backgroundColor: COLORS.border,
    marginHorizontal: SPACING.lg,
    borderRadius: RADIUS.full,
    overflow: 'hidden',
    marginBottom: SPACING.md,
  } as ViewStyle,
  progressFill: {
    height: '100%',
    backgroundColor: COLORS.sage,
    borderRadius: RADIUS.full,
  } as ViewStyle,
  limitBanner: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    marginHorizontal: SPACING.lg,
    marginBottom: SPACING.md,
    padding: SPACING.md,
    backgroundColor: COLORS.coralLight,
    borderRadius: RADIUS.md,
    borderWidth: 1,
    borderColor: COLORS.coral,
  } as ViewStyle,
  limitBannerText: {
    fontFamily: FONTS.body,
    fontSize: 14,
    color: COLORS.cream,
    flex: 1,
  } as TextStyle,
  limitBannerCta: {
    fontFamily: FONTS.bodySemiBold,
    fontSize: 14,
    color: COLORS.coral,
  } as TextStyle,
  scrollContent: {
    paddingHorizontal: SPACING.lg,
    paddingBottom: SPACING.xxxl,
  } as ViewStyle,
  stepContainer: {
    gap: SPACING.lg,
    paddingTop: SPACING.md,
  } as ViewStyle,
  stepTitle: {
    fontFamily: FONTS.header,
    fontSize: 24,
    color: COLORS.cream,
  } as TextStyle,
  stepSubtitle: {
    fontFamily: FONTS.body,
    fontSize: 15,
    color: COLORS.cream,
    opacity: 0.5,
    marginTop: -SPACING.sm,
  } as TextStyle,
  sectionLabel: {
    fontFamily: FONTS.mono,
    fontSize: 11,
    color: COLORS.sage,
    letterSpacing: 1.5,
    marginTop: SPACING.sm,
  } as TextStyle,
  textInput: {
    height: 54,
    borderRadius: RADIUS.md,
    borderWidth: 1.5,
    borderColor: COLORS.border,
    backgroundColor: COLORS.bgCard,
    paddingHorizontal: SPACING.md,
    fontFamily: FONTS.body,
    fontSize: 16,
    color: COLORS.cream,
  } as TextStyle,
  // Destination chips
  tagGrid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: SPACING.sm,
  } as ViewStyle,
  destChip: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: SPACING.xs,
    paddingHorizontal: SPACING.md,
    paddingVertical: SPACING.sm + 2,
    borderRadius: RADIUS.full,
    borderWidth: 1.5,
    borderColor: COLORS.border,
    backgroundColor: COLORS.bgCard,
  } as ViewStyle,
  destChipSelected: {
    backgroundColor: COLORS.sageLight,
    borderColor: COLORS.sage,
  } as ViewStyle,
  destChipEmoji: {
    fontSize: 16,
  } as TextStyle,
  destChipLabel: {
    fontFamily: FONTS.bodyMedium,
    fontSize: 14,
    color: COLORS.cream,
  } as TextStyle,
  destChipLabelSelected: {
    color: COLORS.sage,
  } as TextStyle,
  // Budget cards
  budgetGrid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: SPACING.sm,
  } as ViewStyle,
  budgetCard: {
    width: '48%',
    flexGrow: 1,
    padding: SPACING.md,
    borderRadius: RADIUS.lg,
    borderWidth: 1.5,
    borderColor: COLORS.border,
    backgroundColor: COLORS.bgCard,
    alignItems: 'center',
    gap: SPACING.xs,
  } as ViewStyle,
  budgetCardSelected: {
    backgroundColor: COLORS.sageLight,
    borderColor: COLORS.sage,
  } as ViewStyle,
  budgetEmoji: {
    fontSize: 28,
  } as TextStyle,
  budgetLabel: {
    fontFamily: FONTS.bodySemiBold,
    fontSize: 15,
    color: COLORS.cream,
  } as TextStyle,
  budgetLabelSelected: {
    color: COLORS.sage,
  } as TextStyle,
  budgetVibe: {
    fontFamily: FONTS.body,
    fontSize: 11,
    color: COLORS.cream,
    opacity: 0.45,
    textAlign: 'center',
    lineHeight: 15,
  } as TextStyle,
  budgetRange: {
    fontFamily: FONTS.mono,
    fontSize: 10,
    color: COLORS.sage,
    opacity: 0.7,
    marginTop: 2,
  } as TextStyle,
  // Days
  daysRow: {
    flexDirection: 'row',
    gap: SPACING.sm,
    alignItems: 'center',
  } as ViewStyle,
  dayChip: {
    width: 48,
    height: 48,
    borderRadius: RADIUS.md,
    borderWidth: 1.5,
    borderColor: COLORS.border,
    backgroundColor: COLORS.bgCard,
    alignItems: 'center',
    justifyContent: 'center',
  } as ViewStyle,
  dayChipSelected: {
    backgroundColor: COLORS.sageLight,
    borderColor: COLORS.sage,
  } as ViewStyle,
  dayChipText: {
    fontFamily: FONTS.bodySemiBold,
    fontSize: 16,
    color: COLORS.cream,
  } as TextStyle,
  dayChipTextSelected: {
    color: COLORS.sage,
  } as TextStyle,
  dayCustomInput: {
    flex: 1,
    height: 48,
    borderRadius: RADIUS.md,
    borderWidth: 1.5,
    borderColor: COLORS.border,
    backgroundColor: COLORS.bgCard,
    paddingHorizontal: SPACING.sm,
    fontFamily: FONTS.body,
    fontSize: 14,
    color: COLORS.cream,
    textAlign: 'center',
  } as TextStyle,
  daysCaption: {
    fontFamily: FONTS.mono,
    fontSize: 11,
    color: COLORS.cream,
    opacity: 0.4,
    marginTop: -SPACING.sm,
  } as TextStyle,
  // Vibes
  vibeGrid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: SPACING.sm,
  } as ViewStyle,
  // Summary card
  summaryCard: {
    backgroundColor: COLORS.bgGlass,
    borderRadius: RADIUS.lg,
    borderWidth: 1,
    borderColor: COLORS.border,
    padding: SPACING.lg,
    gap: SPACING.sm,
  } as ViewStyle,
  summaryTitle: {
    fontFamily: FONTS.bodySemiBold,
    fontSize: 14,
    color: COLORS.sage,
    letterSpacing: 0.5,
    marginBottom: SPACING.xs,
  } as TextStyle,
  summaryRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
  } as ViewStyle,
  summaryLabel: {
    fontFamily: FONTS.mono,
    fontSize: 12,
    color: COLORS.cream,
    opacity: 0.5,
  } as TextStyle,
  summaryValue: {
    fontFamily: FONTS.bodyMedium,
    fontSize: 14,
    color: COLORS.cream,
    maxWidth: '60%',
    textAlign: 'right',
  } as TextStyle,
  // Navigation
  navRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    marginTop: SPACING.md,
  } as ViewStyle,
  navSpacer: {
    flex: 1,
  } as ViewStyle,
  navButtonContainer: {
    flex: 1,
  } as ViewStyle,
  backLink: {
    fontFamily: FONTS.bodyMedium,
    fontSize: 16,
    color: COLORS.sage,
    paddingVertical: SPACING.sm,
    paddingRight: SPACING.lg,
  } as TextStyle,
});
