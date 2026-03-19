// =============================================================================
// ROAM — Food Guide
// The ultimate food companion: time-aware dining, menu decoder, safety,
// allergy phrases, pricing tiers, and dietary filters.
// =============================================================================

import React, { useCallback, useMemo, useState } from 'react';
import {
  Pressable,
  ScrollView,
  StyleSheet,
  Text,
  View,
  type TextStyle,
  type ViewStyle,
} from 'react-native';
import { useLocalSearchParams, useRouter } from 'expo-router';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { useTranslation } from 'react-i18next';
import {
  AlertTriangle,
  ChevronLeft,
  Clock,
  DollarSign,
  Leaf,
  ShieldCheck,
  UtensilsCrossed,
} from 'lucide-react-native';
import * as Haptics from '../lib/haptics';
import { COLORS, FONTS, SPACING, RADIUS, DESTINATIONS, HIDDEN_DESTINATIONS } from '../lib/constants';
import { useAppStore, getActiveTrip } from '../lib/store';
import { SkeletonCard } from '../components/premium/LoadingStates';
import { useSonarQuery } from '../lib/sonar';
import SonarCard, { SonarFallback } from '../components/ui/SonarCard';
import DishCard from '../components/features/DishCard';
import {
  useFoodIntel,
  estimateMealCost,
  getTippingCulture,
  DIETARY_FILTERS,
  type DietaryFilter,
  type MealType,
} from '../lib/food-intelligence';
import { getCostOfLiving } from '../lib/cost-of-living';
import { getTimeOfDay } from '../lib/here-now-context';

// ---------------------------------------------------------------------------
// Static data
// ---------------------------------------------------------------------------

const MEAL_TIERS = [
  { id: 'budget' as const, label: 'Budget' },
  { id: 'mid' as const, label: 'Mid' },
  { id: 'comfort' as const, label: 'Comfort' },
] as const;

const MEAL_TYPES: { id: MealType; label: string }[] = [
  { id: 'breakfast', label: 'Breakfast' },
  { id: 'lunch', label: 'Lunch' },
  { id: 'dinner', label: 'Dinner' },
];

const SAFETY_COLORS: Record<string, string> = {
  safe: '#4ADE80',
  caution: COLORS.gold,
  avoid: COLORS.coral,
};

// ---------------------------------------------------------------------------
// Helpers
// ---------------------------------------------------------------------------

function findDestination(name: string) {
  const lower = name.toLowerCase();
  const all = [...DESTINATIONS, ...HIDDEN_DESTINATIONS];
  return all.find((d) => d.label.toLowerCase() === lower) ?? null;
}

function getTimeGreeting(): string {
  const hour = new Date().getHours();
  const tod = getTimeOfDay(hour);
  switch (tod) {
    case 'morning':
      return 'What locals eat for breakfast right now';
    case 'afternoon':
      return 'What locals are having for lunch';
    case 'evening':
      return 'Dinner spots locals go to tonight';
    case 'latenight':
      return 'Late-night eats the locals know';
  }
}

// ---------------------------------------------------------------------------
// Sample dish data (parsed from Sonar responses in a real scenario)
// ---------------------------------------------------------------------------

function getSampleDishes(destination: string): React.ComponentProps<typeof DishCard>[] {
  // These serve as visual placeholders while Sonar loads real data
  const dest = findDestination(destination);
  const lang = dest?.languages[0] ?? 'English';

  return [
    {
      localName: 'Local specialty',
      pronunciation: '...',
      englishName: 'Loading dishes',
      description: `Discovering what locals eat in ${destination}`,
      priceLocal: '...',
      dietaryTags: ['all'],
      orderPhrase: `Can I have the house specialty please?`,
      destination,
      language: lang.toLowerCase().slice(0, 2),
    },
  ];
}

// =============================================================================
// Screen
// =============================================================================

export default function FoodGuideScreen() {
  const { t } = useTranslation();
  const router = useRouter();
  const insets = useSafeAreaInsets();
  const params = useLocalSearchParams<{ destination?: string }>();

  // Resolve destination from params or active trip
  const activeTrip = getActiveTrip();
  const destination = params.destination ?? activeTrip?.destination ?? '';

  // State
  const [activeDiet, setActiveDiet] = useState<DietaryFilter>('all');

  // Data
  const intel = useFoodIntel(destination || undefined);
  const costData = useMemo(
    () => (destination ? getCostOfLiving(destination) : null),
    [destination],
  );
  const tipping = useMemo(
    () => (destination ? getTippingCulture(destination) : null),
    [destination],
  );
  const destInfo = useMemo(
    () => (destination ? findDestination(destination) : null),
    [destination],
  );

  // Price estimates
  const priceGrid = useMemo(() => {
    if (!destination) return [];
    return MEAL_TYPES.map((meal) =>
      MEAL_TIERS.map((tier) => ({
        mealType: meal.id,
        mealLabel: meal.label,
        tierLabel: tier.label,
        estimate: estimateMealCost(destination, meal.id, tier.id),
      })),
    );
  }, [destination]);

  // Handlers
  const handleBack = useCallback(() => {
    Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
    router.back();
  }, [router]);

  const handleDietFilter = useCallback((filter: DietaryFilter) => {
    Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
    setActiveDiet(filter);
  }, []);

  if (!destination) {
    return (
      <View style={[s.container, { paddingTop: insets.top }]}>
        <Text style={s.emptyText}>Plan a trip first to unlock your food guide.</Text>
      </View>
    );
  }

  return (
    <View style={[s.container, { paddingTop: insets.top }]}>
      {/* Header */}
      <View style={s.header}>
        <Pressable onPress={handleBack} hitSlop={12}>
          <ChevronLeft size={24} color={COLORS.cream} strokeWidth={1.5} />
        </Pressable>
        <View style={s.headerCenter}>
          <UtensilsCrossed size={18} color={COLORS.accent} strokeWidth={1.5} />
          <Text style={s.headerTitle}>Food Guide</Text>
        </View>
        <View style={{ width: 24 }} />
      </View>

      <ScrollView
        showsVerticalScrollIndicator={false}
        contentContainerStyle={[s.scroll, { paddingBottom: insets.bottom + 40 }]}
      >
        {/* Hero */}
        <View style={s.heroCard}>
          <Text style={s.heroTitle}>
            Your food compass for {destination}
          </Text>
          <Text style={s.heroSubtitle}>
            {destInfo?.hook ?? `Eat like you live here.`}
          </Text>
        </View>

        {/* Dietary filter row */}
        <ScrollView
          horizontal
          showsHorizontalScrollIndicator={false}
          contentContainerStyle={s.filterRow}
        >
          {DIETARY_FILTERS.map((f) => (
            <Pressable
              key={f.id}
              style={[
                s.filterChip,
                activeDiet === f.id && s.filterChipActive,
              ]}
              onPress={() => handleDietFilter(f.id)}
            >
              <Text
                style={[
                  s.filterLabel,
                  activeDiet === f.id && s.filterLabelActive,
                ]}
              >
                {f.shortLabel}
              </Text>
            </Pressable>
          ))}
        </ScrollView>

        {/* Right now card */}
        <View style={s.sectionHeader}>
          <Clock size={16} color={COLORS.accent} strokeWidth={1.5} />
          <Text style={s.sectionTitle}>Right now</Text>
        </View>

        {intel.isLoading && !intel.timeOfDayFood ? (
          <SkeletonCard />
        ) : intel.timeOfDayFood ? (
          <SonarCard
            answer={intel.timeOfDayFood.answer}
            isLive={intel.timeOfDayFood.isLive}
            citations={intel.timeOfDayFood.citations}
            title={getTimeGreeting()}
            maxBullets={4}
          />
        ) : (
          <SonarFallback label="Loading time-aware dining intel..." />
        )}

        {/* Menu decoder */}
        <View style={s.sectionHeader}>
          <UtensilsCrossed size={16} color={COLORS.accent} strokeWidth={1.5} />
          <Text style={s.sectionTitle}>Menu decoder</Text>
        </View>

        {intel.isLoading && !intel.menuDecoder ? (
          <SkeletonCard />
        ) : intel.menuDecoder ? (
          <>
            <SonarCard
              answer={intel.menuDecoder.answer}
              isLive={intel.menuDecoder.isLive}
              citations={intel.menuDecoder.citations}
              title={`What's on the menu in ${destination}`}
              maxBullets={6}
            />
            <ScrollView
              horizontal
              showsHorizontalScrollIndicator={false}
              contentContainerStyle={s.dishRow}
            >
              {getSampleDishes(destination).map((dish, i) => (
                <DishCard key={`dish-${i}`} {...dish} />
              ))}
            </ScrollView>
          </>
        ) : (
          <SonarFallback label="Decoding local menus..." />
        )}

        {/* Food safety */}
        <View style={s.sectionHeader}>
          <ShieldCheck size={16} color={COLORS.accent} strokeWidth={1.5} />
          <Text style={s.sectionTitle}>Food safety</Text>
        </View>

        {intel.isLoading && !intel.safetyBrief ? (
          <SkeletonCard />
        ) : intel.safetyBrief ? (
          <SonarCard
            answer={intel.safetyBrief.answer}
            isLive={intel.safetyBrief.isLive}
            citations={intel.safetyBrief.citations}
            title="Safety brief"
            maxBullets={5}
          />
        ) : (
          <SonarFallback label="Checking food safety..." />
        )}

        {/* Price guide */}
        <View style={s.sectionHeader}>
          <DollarSign size={16} color={COLORS.accent} strokeWidth={1.5} />
          <Text style={s.sectionTitle}>Price guide</Text>
        </View>

        {costData ? (
          <View style={s.priceCard}>
            <View style={s.priceRow}>
              <Text style={s.priceHeader}>Meal</Text>
              {MEAL_TIERS.map((tier) => (
                <Text key={tier.id} style={s.priceHeader}>
                  {tier.label}
                </Text>
              ))}
            </View>
            {MEAL_TYPES.map((meal) => (
              <View key={meal.id} style={s.priceRow}>
                <Text style={s.priceLabel}>{meal.label}</Text>
                <Text style={s.priceVal}>{costData.budget.meal}</Text>
                <Text style={s.priceVal}>{costData.comfort.meal}</Text>
                <Text style={s.priceVal}>{costData.luxury.meal}</Text>
              </View>
            ))}

            {tipping && (
              <View style={s.tippingRow}>
                <Text style={s.tippingLabel}>Tipping</Text>
                <Text style={s.tippingVal}>{tipping.tipping}</Text>
              </View>
            )}
          </View>
        ) : (
          <SonarFallback label="No price data available for this destination." />
        )}

        {/* Vegetarian guide */}
        {activeDiet === 'vegetarian' || activeDiet === 'vegan' ? (
          <>
            <View style={s.sectionHeader}>
              <Leaf size={16} color={COLORS.accent} strokeWidth={1.5} />
              <Text style={s.sectionTitle}>
                {activeDiet === 'vegan' ? 'Vegan' : 'Vegetarian'} guide
              </Text>
            </View>

            {intel.isLoading && !intel.vegetarianGuide ? (
              <SkeletonCard />
            ) : intel.vegetarianGuide ? (
              <SonarCard
                answer={intel.vegetarianGuide.answer}
                isLive={intel.vegetarianGuide.isLive}
                citations={intel.vegetarianGuide.citations}
                title={`Eating ${activeDiet} in ${destination}`}
                maxBullets={5}
              />
            ) : (
              <SonarFallback label={`Loading ${activeDiet} guide...`} />
            )}
          </>
        ) : null}

        {/* Local food guide (full Sonar) */}
        <View style={s.sectionHeader}>
          <AlertTriangle size={16} color={COLORS.accent} strokeWidth={1.5} />
          <Text style={s.sectionTitle}>Local intel</Text>
        </View>

        {intel.isLoading && !intel.localGuide ? (
          <SkeletonCard />
        ) : intel.localGuide ? (
          <SonarCard
            answer={intel.localGuide.answer}
            isLive={intel.localGuide.isLive}
            citations={intel.localGuide.citations}
            title={`What locals actually eat in ${destination}`}
            maxBullets={6}
          />
        ) : (
          <SonarFallback label="Loading local food intel..." />
        )}
      </ScrollView>
    </View>
  );
}

// =============================================================================
// Styles
// =============================================================================

const s = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: COLORS.bg,
  } as ViewStyle,
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: SPACING.md,
    paddingVertical: SPACING.sm,
  } as ViewStyle,
  headerCenter: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
  } as ViewStyle,
  headerTitle: {
    fontFamily: FONTS.header,
    fontSize: 17,
    color: COLORS.cream,
  } as TextStyle,
  scroll: {
    paddingHorizontal: SPACING.md,
  } as ViewStyle,

  // Hero
  heroCard: {
    backgroundColor: COLORS.surface1,
    borderRadius: RADIUS.md,
    padding: SPACING.lg,
    borderWidth: 1,
    borderColor: COLORS.sageBorder,
    marginBottom: SPACING.md,
  } as ViewStyle,
  heroTitle: {
    fontFamily: FONTS.header,
    fontSize: 22,
    color: COLORS.accent,
    marginBottom: 4,
  } as TextStyle,
  heroSubtitle: {
    fontFamily: FONTS.body,
    fontSize: 14,
    color: COLORS.muted,
    lineHeight: 20,
  } as TextStyle,

  // Filter row
  filterRow: {
    flexDirection: 'row',
    gap: 8,
    paddingBottom: SPACING.md,
  } as ViewStyle,
  filterChip: {
    paddingVertical: 6,
    paddingHorizontal: 14,
    borderRadius: RADIUS.pill,
    backgroundColor: COLORS.surface1,
    borderWidth: 1,
    borderColor: COLORS.border,
  } as ViewStyle,
  filterChipActive: {
    backgroundColor: COLORS.sageSubtle,
    borderColor: COLORS.sageBorder,
  } as ViewStyle,
  filterLabel: {
    fontFamily: FONTS.mono,
    fontSize: 12,
    color: COLORS.muted,
  } as TextStyle,
  filterLabelActive: {
    color: COLORS.accent,
  } as TextStyle,

  // Sections
  sectionHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
    marginTop: SPACING.lg,
    marginBottom: SPACING.sm,
  } as ViewStyle,
  sectionTitle: {
    fontFamily: FONTS.header,
    fontSize: 16,
    color: COLORS.cream,
  } as TextStyle,

  // Dish row
  dishRow: {
    flexDirection: 'row',
    paddingTop: SPACING.sm,
    paddingBottom: SPACING.xs,
  } as ViewStyle,

  // Price card
  priceCard: {
    backgroundColor: COLORS.surface1,
    borderRadius: RADIUS.md,
    padding: SPACING.md,
    borderWidth: 1,
    borderColor: COLORS.border,
  } as ViewStyle,
  priceRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    paddingVertical: 6,
    borderBottomWidth: 1,
    borderBottomColor: COLORS.border,
  } as ViewStyle,
  priceHeader: {
    fontFamily: FONTS.mono,
    fontSize: 11,
    color: COLORS.muted,
    flex: 1,
    textAlign: 'center',
  } as TextStyle,
  priceLabel: {
    fontFamily: FONTS.bodyMedium,
    fontSize: 13,
    color: COLORS.cream,
    flex: 1,
  } as TextStyle,
  priceVal: {
    fontFamily: FONTS.mono,
    fontSize: 12,
    color: COLORS.gold,
    flex: 1,
    textAlign: 'center',
  } as TextStyle,
  tippingRow: {
    marginTop: SPACING.sm,
  } as ViewStyle,
  tippingLabel: {
    fontFamily: FONTS.mono,
    fontSize: 11,
    color: COLORS.muted,
    marginBottom: 2,
  } as TextStyle,
  tippingVal: {
    fontFamily: FONTS.body,
    fontSize: 13,
    color: COLORS.creamDim,
    lineHeight: 18,
  } as TextStyle,

  // Empty
  emptyText: {
    fontFamily: FONTS.body,
    fontSize: 15,
    color: COLORS.muted,
    textAlign: 'center',
    paddingHorizontal: SPACING.xl,
    paddingTop: 100,
  } as TextStyle,
});
