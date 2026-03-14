// =============================================================================
// ROAM for Dates — Couples travel planner
// Finds overlap between two travel profiles, generates trip both will love
// =============================================================================
import React, { useCallback, useState } from 'react';
import {
  View,
  Text,
  ScrollView,
  Pressable,
  StyleSheet,
  ActivityIndicator,
  Alert,
  type ViewStyle,
  type TextStyle,
} from 'react-native';
import { useRouter } from 'expo-router';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import * as Haptics from '../lib/haptics';
import { withComingSoon } from '../lib/with-coming-soon';
import { COLORS, FONTS, SPACING, RADIUS, DESTINATIONS, BUDGETS, VIBES, FREE_TRIPS_PER_MONTH } from '../lib/constants';
import { useAppStore } from '../lib/store';
import { isGuestUser } from '../lib/guest';
import { mergeProfiles } from '../lib/couples-overlap';
import { generateItinerary } from '../lib/claude';
import { DEFAULT_TRAVEL_PROFILE } from '../lib/types/travel-profile';
import type { TravelProfile } from '../lib/types/travel-profile';
import type { Itinerary } from '../lib/types/itinerary';
import Button from '../components/ui/Button';

function RoamForDatesScreen() {
  const router = useRouter();
  const insets = useSafeAreaInsets();
  const myProfile = useAppStore((s) => s.travelProfile);
  const hasProfile = useAppStore((s) => s.hasCompletedProfile);
  const addTrip = useAppStore((s) => s.addTrip);
  const trips = useAppStore((s) => s.trips);
  const isPro = useAppStore((s) => s.isPro);
  const tripsThisMonth = useAppStore((s) => s.tripsThisMonth);

  const [destination, setDestination] = useState('');
  const [days, setDays] = useState(7);
  const [budget, setBudget] = useState('');
  const [vibes] = useState<string[]>([]);
  const [partnerPace, setPartnerPace] = useState(5);
  const [partnerBudget, setPartnerBudget] = useState(5);
  const [partnerFood] = useState(5);
  const [partnerPurposes, setPartnerPurposes] = useState<string[]>([]);
  const [generating, setGenerating] = useState(false);
  const [result, setResult] = useState<Itinerary | null>(null);

  const profileA = hasProfile ? myProfile : DEFAULT_TRAVEL_PROFILE;
  const profileB: TravelProfile = {
    ...DEFAULT_TRAVEL_PROFILE,
    pace: partnerPace,
    budgetStyle: partnerBudget,
    foodAdventurousness: partnerFood,
    tripPurposes: partnerPurposes as TravelProfile['tripPurposes'],
  };
  const merged = mergeProfiles(profileA, profileB);

  const handleGenerate = useCallback(async () => {
    if (!destination.trim()) {
      Alert.alert('Pick a destination', 'Where do you two want to go?');
      return;
    }
    if (isGuestUser() && trips.length >= 1) {
      router.push({ pathname: '/paywall', params: { reason: 'limit', destination } });
      return;
    }
    if (!isPro && tripsThisMonth >= FREE_TRIPS_PER_MONTH) {
      router.push({ pathname: '/paywall', params: { reason: 'limit' } });
      return;
    }
    Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Medium);
    setGenerating(true);
    setResult(null);
    try {
      const { itinerary } = await generateItinerary({
        destination,
        days,
        budget: (budget || BUDGETS[1]?.id) ?? 'mid',
        vibes: vibes.length > 0 ? vibes : ['romantic', 'adventure'],
        travelProfile: merged,
      });
      setResult(itinerary);
      addTrip({
        id: `dates-${Date.now()}`,
        destination: itinerary.destination,
        days: itinerary.days.length,
        budget: itinerary.totalBudget,
        vibes: vibes.length > 0 ? vibes : ['romantic', 'adventure'],
        itinerary: JSON.stringify(itinerary),
        createdAt: new Date().toISOString(),
      });
    } catch (e: unknown) {
      Alert.alert('Oops', e instanceof Error ? e.message : 'Couldn\'t plan your trip. Try again.');
    } finally {
      setGenerating(false);
    }
  }, [destination, days, budget, vibes, merged, addTrip, trips, isPro, tripsThisMonth, router]);

  if (result) {
    return (
      <View style={[styles.container, { paddingTop: insets.top }]}>
        <View style={styles.header}>
          <Pressable onPress={() => setResult(null)} hitSlop={12}>
            <Text style={styles.back}>{'←'}</Text>
          </Pressable>
          <Text style={styles.title}>Your couple's trip</Text>
        </View>
        <ScrollView contentContainerStyle={styles.resultContent} showsVerticalScrollIndicator={false}>
          <Text style={styles.resultDestination}>{result.destination}</Text>
          <Text style={styles.resultTagline}>{result.tagline}</Text>
          <Button
            label="View full trip"
            variant="sage"
            onPress={() => router.push({ pathname: '/itinerary', params: { data: JSON.stringify({ destination: result.destination, days: result.days.length, budget: result.totalBudget, vibes: [], itinerary: JSON.stringify(result) }) } })}
          />
        </ScrollView>
      </View>
    );
  }

  return (
    <View style={[styles.container, { paddingTop: insets.top }]}>
      <View style={styles.header}>
        <Pressable onPress={() => router.back()} hitSlop={12}>
          <Text style={styles.back}>{'←'}</Text>
        </Pressable>
        <Text style={styles.title}>ROAM for Dates</Text>
        <Text style={styles.subtitle}>Merge your travel styles. Find a trip you'll both love.</Text>
      </View>

      <ScrollView contentContainerStyle={styles.scrollContent} showsVerticalScrollIndicator={false}>
        <View style={styles.section}>
          <Text style={styles.sectionTitle}>Where to?</Text>
          <ScrollView horizontal showsHorizontalScrollIndicator={false} style={styles.chipRow}>
            {DESTINATIONS.slice(0, 12).map((d) => (
              <Pressable
                key={d.label}
                onPress={() => { setDestination(d.label); Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light); }}
                style={[styles.chip, destination === d.label && styles.chipActive]}
              >
                <Text style={[styles.chipText, destination === d.label && styles.chipActiveText]}>{d.label}</Text>
              </Pressable>
            ))}
          </ScrollView>
        </View>

        <View style={styles.section}>
          <Text style={styles.sectionTitle}>Days</Text>
          <ScrollView horizontal showsHorizontalScrollIndicator={false} style={styles.chipRow}>
            {[3, 5, 7, 10, 14].map((d) => (
              <Pressable
                key={d}
                onPress={() => { setDays(d); Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light); }}
                style={[styles.chip, days === d && styles.chipActive]}
              >
                <Text style={[styles.chipText, days === d && styles.chipActiveText]}>{d} days</Text>
              </Pressable>
            ))}
          </ScrollView>
        </View>

        <View style={styles.section}>
          <Text style={styles.sectionTitle}>Budget</Text>
          <ScrollView horizontal showsHorizontalScrollIndicator={false} style={styles.chipRow}>
            {BUDGETS.map((b) => (
              <Pressable
                key={b.id}
                onPress={() => { setBudget(b.id); Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light); }}
                style={[styles.chip, budget === b.id && styles.chipActive]}
              >
                <Text style={[styles.chipText, budget === b.id && styles.chipActiveText]}>{b.label}</Text>
              </Pressable>
            ))}
          </ScrollView>
        </View>

        <View style={styles.section}>
          <Text style={styles.sectionTitle}>Partner's style (quick)</Text>
          <View style={styles.partnerRow}>
            <Text style={styles.partnerLabel}>Pace</Text>
            <View style={styles.partnerValues}>
              {[1, 3, 5, 7, 10].map((v) => (
                <Pressable
                  key={v}
                  onPress={() => setPartnerPace(v)}
                  style={[styles.miniChip, partnerPace === v && styles.chipActive]}
                >
                  <Text style={[styles.miniChipText, partnerPace === v && styles.chipActiveText]}>{v}</Text>
                </Pressable>
              ))}
            </View>
          </View>
          <View style={styles.partnerRow}>
            <Text style={styles.partnerLabel}>Budget</Text>
            <View style={styles.partnerValues}>
              {[1, 5, 10].map((v) => (
                <Pressable
                  key={v}
                  onPress={() => setPartnerBudget(v)}
                  style={[styles.miniChip, partnerBudget === v && styles.chipActive]}
                >
                  <Text style={[styles.miniChipText, partnerBudget === v && styles.chipActiveText]}>{v === 1 ? '$' : v === 5 ? '$$' : '$$$'}</Text>
                </Pressable>
              ))}
            </View>
          </View>
          <View style={styles.partnerRow}>
            <Text style={styles.partnerLabel}>Vibes</Text>
            <ScrollView horizontal showsHorizontalScrollIndicator={false} style={styles.chipRow}>
              {VIBES.slice(0, 6).map((v) => {
                const on = partnerPurposes.includes(v.id);
                return (
                  <Pressable
                    key={v.id}
                    onPress={() => setPartnerPurposes((prev) => on ? prev.filter((x) => x !== v.id) : [...prev, v.id])}
                    style={[styles.chip, on && styles.chipActive]}
                  >
                    <Text style={[styles.chipText, on && styles.chipActiveText]}>{v.label}</Text>
                  </Pressable>
                );
              })}
            </ScrollView>
          </View>
        </View>

        <Button
          label={generating ? 'Finding your perfect trip...' : "Generate our trip"}
          variant="sage"
          onPress={handleGenerate}
          disabled={generating}
          style={styles.generateBtn}
        />
        {generating && <ActivityIndicator color={COLORS.gold} style={styles.spinner} />}
      </ScrollView>
    </View>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: COLORS.bg } as ViewStyle,
  header: { paddingHorizontal: SPACING.lg, paddingBottom: SPACING.md } as ViewStyle,
  back: { fontSize: 24, color: COLORS.cream } as TextStyle,
  title: { fontFamily: FONTS.header, fontSize: 28, color: COLORS.cream, marginTop: SPACING.sm } as TextStyle,
  subtitle: { fontFamily: FONTS.body, fontSize: 14, color: COLORS.creamMuted, marginTop: 4 } as TextStyle,
  scrollContent: { paddingHorizontal: SPACING.lg, paddingBottom: SPACING.xxxl } as ViewStyle,
  section: { marginBottom: SPACING.lg } as ViewStyle,
  sectionTitle: { fontFamily: FONTS.bodySemiBold, fontSize: 14, color: COLORS.creamMuted, marginBottom: SPACING.sm } as TextStyle,
  chipRow: { flexDirection: 'row', gap: SPACING.sm } as ViewStyle,
  chip: {
    paddingHorizontal: SPACING.md,
    paddingVertical: SPACING.sm,
    borderRadius: RADIUS.full,
    backgroundColor: COLORS.bgGlass,
    borderWidth: 1,
    borderColor: COLORS.border,
  } as ViewStyle,
  chipActive: { backgroundColor: COLORS.sage + '25', borderColor: COLORS.sage } as ViewStyle,
  chipText: { fontFamily: FONTS.body, fontSize: 14, color: COLORS.creamMuted } as TextStyle,
  chipActiveText: { color: COLORS.cream } as TextStyle,
  partnerRow: { marginBottom: SPACING.sm } as ViewStyle,
  partnerLabel: { fontFamily: FONTS.body, fontSize: 13, color: COLORS.creamMuted, marginBottom: 4 } as TextStyle,
  partnerValues: { flexDirection: 'row', gap: SPACING.xs } as ViewStyle,
  miniChip: {
    paddingHorizontal: SPACING.sm,
    paddingVertical: 4,
    borderRadius: RADIUS.sm,
    backgroundColor: COLORS.bgGlass,
  } as ViewStyle,
  miniChipText: { fontFamily: FONTS.body, fontSize: 12, color: COLORS.creamMuted } as TextStyle,
  generateBtn: { marginTop: SPACING.lg } as ViewStyle,
  spinner: { marginTop: SPACING.md } as ViewStyle,
  resultContent: { padding: SPACING.lg } as ViewStyle,
  resultDestination: { fontFamily: FONTS.header, fontSize: 32, color: COLORS.cream } as TextStyle,
  resultTagline: { fontFamily: FONTS.body, fontSize: 16, color: COLORS.creamMuted, marginTop: SPACING.sm } as TextStyle,
});

export default withComingSoon(RoamForDatesScreen, { routeName: 'roam-for-dates', title: 'ROAM for Dates' });
