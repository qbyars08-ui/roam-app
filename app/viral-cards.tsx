// =============================================================================
// ROAM — Viral TikTok Cards
// Trip Reveal · Cost Breakdown · AI vs Reality
// =============================================================================
import React, { useState } from 'react';
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
import { ChevronLeft } from 'lucide-react-native';

import { COLORS, FONTS, SPACING, RADIUS } from '../lib/constants';
import { useAppStore } from '../lib/store';
import { parseItinerary, type Itinerary } from '../lib/types/itinerary';
import {
  TripRevealCard,
  CostBreakdownCard,
  AiVsRealityCard,
  buildAiVsRealityItems,
} from '../components/features/ViralCards';

type TabId = 'reveal' | 'cost' | 'reality';

export default function ViralCardsScreen() {
  const { tripId } = useLocalSearchParams<{ tripId?: string }>();
  const router = useRouter();
  const insets = useSafeAreaInsets();
  const trips = useAppStore((s) => s.trips);

  const trip = trips.find((t) => t.id === tripId) ?? null;
  const [parsed, setParsed] = useState<Itinerary | null>(null);
  const [activeTab, setActiveTab] = useState<TabId>('reveal');

  React.useEffect(() => {
    if (!trip?.itinerary) return;
    try {
      setParsed(parseItinerary(trip.itinerary));
    } catch {
      setParsed(null);
    }
  }, [trip?.id, trip?.itinerary]);

  if (!trip) {
    return (
      <View style={[styles.screen, { paddingTop: insets.top }]}>
        <Pressable onPress={() => router.back()} style={styles.backBtn}>
          <ChevronLeft size={24} color={COLORS.cream} />
        </Pressable>
        <View style={styles.empty}>
          <Text style={styles.emptyTitle}>No trip to card-ify</Text>
          <Text style={styles.emptySub}>Open one of your trips first, then come back to make it shareable.</Text>
        </View>
      </View>
    );
  }

  if (!parsed) {
    return (
      <View style={[styles.screen, { paddingTop: insets.top }]}>
        <Pressable onPress={() => router.back()} style={styles.backBtn}>
          <ChevronLeft size={24} color={COLORS.cream} />
        </Pressable>
        <View style={styles.empty}>
          <Text style={styles.emptyTitle}>Building your card...</Text>
        </View>
      </View>
    );
  }

  const aiVsRealityItems = buildAiVsRealityItems(trip.destination, parsed);

  return (
    <View style={[styles.screen, { paddingTop: insets.top }]}>
      <View style={styles.header}>
        <Pressable onPress={() => router.back()} style={styles.backBtn}>
          <ChevronLeft size={24} color={COLORS.cream} />
        </Pressable>
        <Text style={styles.headerTitle}>Viral Cards</Text>
        <View style={styles.backBtn} />
      </View>

      {/* Tabs */}
      <View style={styles.tabs}>
        {([
          { id: 'reveal' as TabId, label: 'Trip Reveal' },
          { id: 'cost' as TabId, label: 'Cost' },
          { id: 'reality' as TabId, label: 'AI vs Reality' },
        ] as const).map((tab) => (
          <Pressable
            key={tab.id}
            onPress={() => setActiveTab(tab.id)}
            style={[styles.tab, activeTab === tab.id && styles.tabActive]}
          >
            <Text style={[styles.tabText, activeTab === tab.id && styles.tabTextActive]}>
              {tab.label}
            </Text>
          </Pressable>
        ))}
      </View>

      <ScrollView
        contentContainerStyle={[
          styles.scrollContent,
          { paddingBottom: insets.bottom + SPACING.xxl },
        ]}
        showsVerticalScrollIndicator={false}
      >
        {activeTab === 'reveal' && (
          <TripRevealCard
            itinerary={parsed}
            destination={trip.destination}
          />
        )}
        {activeTab === 'cost' && (
          <CostBreakdownCard
            destination={trip.destination}
            totalBudget={parsed.totalBudget}
            days={parsed.days.length}
            breakdown={parsed.budgetBreakdown}
          />
        )}
        {activeTab === 'reality' && (
          <AiVsRealityCard
            destination={trip.destination}
            items={aiVsRealityItems}
          />
        )}
      </ScrollView>
    </View>
  );
}

const styles = StyleSheet.create({
  screen: {
    flex: 1,
    backgroundColor: COLORS.bg,
  } as ViewStyle,
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: SPACING.lg,
    paddingVertical: SPACING.md,
  } as ViewStyle,
  backBtn: {
    width: 40,
    height: 40,
    alignItems: 'center',
    justifyContent: 'center',
  } as ViewStyle,
  headerTitle: {
    fontFamily: FONTS.header,
    fontSize: 22,
    color: COLORS.cream,
    letterSpacing: 0.5,
  } as TextStyle,
  tabs: {
    flexDirection: 'row',
    paddingHorizontal: SPACING.lg,
    gap: SPACING.sm,
    marginBottom: SPACING.md,
  } as ViewStyle,
  tab: {
    flex: 1,
    paddingVertical: SPACING.sm + 2,
    borderRadius: RADIUS.lg,
    borderWidth: 1,
    borderColor: COLORS.border,
    alignItems: 'center',
  } as ViewStyle,
  tabActive: {
    backgroundColor: COLORS.gold,
    borderColor: COLORS.gold,
  } as ViewStyle,
  tabText: {
    fontFamily: FONTS.bodyMedium,
    fontSize: 13,
    color: COLORS.cream,
  } as TextStyle,
  tabTextActive: {
    color: COLORS.bg,
  } as TextStyle,
  scrollContent: {
    paddingHorizontal: SPACING.lg,
  } as ViewStyle,
  empty: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    paddingHorizontal: SPACING.xl,
  } as ViewStyle,
  emptyTitle: {
    fontFamily: FONTS.header,
    fontSize: 22,
    color: COLORS.cream,
    marginBottom: SPACING.sm,
  } as TextStyle,
  emptySub: {
    fontFamily: FONTS.body,
    fontSize: 14,
    color: COLORS.creamMuted,
  } as TextStyle,
});
