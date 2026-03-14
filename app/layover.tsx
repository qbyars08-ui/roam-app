// =============================================================================
// ROAM — Layover Optimizer
// User enters: departure, destination, layover city, layover duration
// ROAM generates: exactly what to do with X hours in layover city
// =============================================================================
import React, { useCallback, useState } from 'react';
import {
  View,
  Text,
  TextInput,
  ScrollView,
  Pressable,
  StyleSheet,
  ActivityIndicator,
  type TextStyle,
  type ViewStyle,
} from 'react-native';
import { useRouter } from 'expo-router';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import * as Haptics from '../lib/haptics';
import { withComingSoon } from '../lib/with-coming-soon';
import { COLORS, FONTS, SPACING, RADIUS } from '../lib/constants';
import { callClaude } from '../lib/claude';

// ---------------------------------------------------------------------------
// System prompt for layover plans
// ---------------------------------------------------------------------------
const LAYOVER_SYSTEM_PROMPT = `You are ROAM's Layover Optimizer. Given departure city, destination, layover city, and layover duration in hours, generate a precise, actionable plan.

CRITICAL: Respond with ONLY valid JSON. No markdown, no explanation, no extra text.

Duration tiers:
- Under 4 hours: stay in airport. Best spots inside (food, lounge, quiet areas, charging). NO city exit.
- 4-8 hours: one neighborhood, one meal, return safely. Include transport time, buffer for security.
- 8+ hours: full mini itinerary (2-3 activities), visa requirements for transit, clear timing.

JSON schema:
{
  "tier": "airport" | "city_short" | "city_full",
  "summary": "One-line hook",
  "airport": {
    "bestFood": [{"name": "Spot name", "terminal": "X", "note": "Why"}],
    "quietSpots": ["Area 1", "Area 2"],
    "chargingLounge": "Where to plug in",
    "proTip": "One insider tip"
  },
  "city": {
    "neighborhood": "Name",
    "meal": {"name": "Restaurant", "dish": "What to order", "timing": "When"},
    "activities": [{"name": "Activity", "duration": "X min", "note": "Why"}],
    "transport": {"to": "How to get there", "back": "How to return", "buffer": "Min before flight"}
  },
  "visaInfo": "Only for 8+ hours: transit visa requirements for US passport. Skip if under 8h or visa-free."
}

Rules:
- Be specific. Real place names. Real dishes.
- For airport tier: only include "airport" object. Omit "city" and "visaInfo" or set to null.
- For 4-8h: include "airport" (quick tips) and "city". Omit "visaInfo" if not needed.
- For 8+h: include all. Add visaInfo for destinations that require transit visas.
- Sound like a friend who has done this layover. No corporate fluff.`;

interface LayoverResult {
  tier: 'airport' | 'city_short' | 'city_full';
  summary: string;
  airport?: {
    bestFood: { name: string; terminal: string; note: string }[];
    quietSpots: string[];
    chargingLounge: string;
    proTip: string;
  };
  city?: {
    neighborhood: string;
    meal: { name: string; dish: string; timing: string };
    activities: { name: string; duration: string; note: string }[];
    transport: { to: string; back: string; buffer: string };
  } | null;
  visaInfo?: string | null;
}

// ---------------------------------------------------------------------------
// Main screen
// ---------------------------------------------------------------------------
function LayoverScreen() {
  const router = useRouter();
  const insets = useSafeAreaInsets();
  const [departure, setDeparture] = useState('');
  const [destination, setDestination] = useState('');
  const [layoverCity, setLayoverCity] = useState('');
  const [hoursStr, setHoursStr] = useState('');
  const [loading, setLoading] = useState(false);
  const [result, setResult] = useState<LayoverResult | null>(null);
  const [error, setError] = useState<string | null>(null);

  const hours = parseFloat(hoursStr);
  const isValid = departure.trim() && destination.trim() && layoverCity.trim() && hours > 0 && hours <= 24;

  const generate = useCallback(async () => {
    if (!isValid) return;

    setLoading(true);
    setError(null);
    setResult(null);
    Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Medium);

    try {
      const userMsg = [
        `Departure: ${departure.trim()}`,
        `Destination: ${destination.trim()}`,
        `Layover city: ${layoverCity.trim()}`,
        `Layover duration: ${hours} hours`,
      ].join('\n');

      const response = await callClaude(LAYOVER_SYSTEM_PROMPT, userMsg, false);
      const parsed = JSON.parse(response.content) as LayoverResult;
      setResult(parsed);
      Haptics.notificationAsync(Haptics.NotificationFeedbackType.Success);
    } catch {
      setError("Couldn't generate a plan. Check your connection and try again.");
      Haptics.notificationAsync(Haptics.NotificationFeedbackType.Error);
    } finally {
      setLoading(false);
    }
  }, [departure, destination, layoverCity, hours, isValid]);

  return (
    <View style={[styles.screen, { paddingTop: insets.top }]}>
      <ScrollView
        style={styles.scroll}
        contentContainerStyle={[styles.scrollContent, { paddingBottom: insets.bottom + SPACING.xxl }]}
        showsVerticalScrollIndicator={false}
        keyboardShouldPersistTaps="handled"
      >
        {/* Header */}
        <View style={styles.header}>
          <Pressable onPress={() => router.back()} hitSlop={12} style={({ pressed }) => ({ opacity: pressed ? 0.7 : 1 })}>
            <Text style={styles.backBtn}>{'\u2190'}</Text>
          </Pressable>
          <Text style={styles.title}>Layover Optimizer</Text>
          <Text style={styles.subtitle}>
            Tell us where you're flying and how long you have. We'll tell you exactly what to do.
          </Text>
        </View>

        {/* Form */}
        <View style={styles.form}>
          <Text style={styles.label}>Departure city</Text>
          <TextInput
            style={styles.input}
            placeholder="e.g. New York"
            placeholderTextColor={COLORS.creamMuted}
            value={departure}
            onChangeText={setDeparture}
          />
          <Text style={styles.label}>Final destination</Text>
          <TextInput
            style={styles.input}
            placeholder="e.g. Tokyo"
            placeholderTextColor={COLORS.creamMuted}
            value={destination}
            onChangeText={setDestination}
          />
          <Text style={styles.label}>Layover city</Text>
          <TextInput
            style={styles.input}
            placeholder="e.g. Singapore"
            placeholderTextColor={COLORS.creamMuted}
            value={layoverCity}
            onChangeText={setLayoverCity}
          />
          <Text style={styles.label}>Layover duration (hours)</Text>
          <TextInput
            style={styles.input}
            placeholder="e.g. 6"
            placeholderTextColor={COLORS.creamMuted}
            value={hoursStr}
            onChangeText={setHoursStr}
            keyboardType="decimal-pad"
          />
        </View>

        {/* Generate button */}
        <Pressable
          onPress={generate}
          disabled={!isValid || loading}
          style={({ pressed }) => [
            styles.cta,
            (!isValid || loading) && styles.ctaDisabled,
            { opacity: pressed && isValid && !loading ? 0.9 : 1 },
          ]}
        >
          {loading ? (
            <ActivityIndicator size="small" color={COLORS.bg} />
          ) : (
            <Text style={styles.ctaText}>Generate plan</Text>
          )}
        </Pressable>

        {error && <Text style={styles.error}>{error}</Text>}

        {/* Result */}
        {result && (
          <View style={styles.result}>
            <Text style={styles.resultSummary}>{result.summary}</Text>

            {result.airport && (
              <View style={styles.section}>
                <Text style={styles.sectionTitle}>In the airport</Text>
                {result.airport.bestFood?.length > 0 && (
                  <>
                    <Text style={styles.sectionLabel}>Best food</Text>
                    {result.airport.bestFood.map((f, i) => (
                      <View key={i} style={styles.bulletRow}>
                        <Text style={styles.bullet}>-</Text>
                        <Text style={styles.bulletText}>
                          {f.name} ({f.terminal}): {f.note}
                        </Text>
                      </View>
                    ))}
                  </>
                )}
                {result.airport.quietSpots?.length > 0 && (
                  <>
                    <Text style={styles.sectionLabel}>Quiet spots</Text>
                    <Text style={styles.bodyText}>{result.airport.quietSpots.join('. ')}</Text>
                  </>
                )}
                {result.airport.chargingLounge && (
                  <>
                    <Text style={styles.sectionLabel}>Charging</Text>
                    <Text style={styles.bodyText}>{result.airport.chargingLounge}</Text>
                  </>
                )}
                {result.airport.proTip && (
                  <View style={styles.proTip}>
                    <Text style={styles.proTipText}>{result.airport.proTip}</Text>
                  </View>
                )}
              </View>
            )}

            {result.city && (
              <View style={styles.section}>
                <Text style={styles.sectionTitle}>In the city</Text>
                <Text style={styles.sectionLabel}>Neighborhood</Text>
                <Text style={styles.bodyText}>{result.city.neighborhood}</Text>
                {result.city.meal && (
                  <>
                    <Text style={styles.sectionLabel}>One meal</Text>
                    <Text style={styles.bodyText}>
                      {result.city.meal.name} — {result.city.meal.dish}. {result.city.meal.timing}
                    </Text>
                  </>
                )}
                {result.city.activities?.length > 0 && (
                  <>
                    <Text style={styles.sectionLabel}>Activities</Text>
                    {result.city.activities.map((a, i) => (
                      <View key={i} style={styles.bulletRow}>
                        <Text style={styles.bullet}>-</Text>
                        <Text style={styles.bulletText}>
                          {a.name} ({a.duration}): {a.note}
                        </Text>
                      </View>
                    ))}
                  </>
                )}
                {result.city.transport && (
                  <>
                    <Text style={styles.sectionLabel}>Transport</Text>
                    <Text style={styles.bodyText}>
                      To city: {result.city.transport.to}. Back: {result.city.transport.back}. Buffer: {result.city.transport.buffer}
                    </Text>
                  </>
                )}
              </View>
            )}

            {result.visaInfo && (
              <View style={styles.section}>
                <Text style={styles.sectionTitle}>Visa (transit)</Text>
                <Text style={styles.bodyText}>{result.visaInfo}</Text>
              </View>
            )}
          </View>
        )}
      </ScrollView>
    </View>
  );
}

// ---------------------------------------------------------------------------
// Styles
// ---------------------------------------------------------------------------
const styles = StyleSheet.create({
  screen: {
    flex: 1,
    backgroundColor: COLORS.bg,
  } as ViewStyle,
  scroll: {
    flex: 1,
  } as ViewStyle,
  scrollContent: {
    paddingHorizontal: SPACING.lg,
    paddingTop: SPACING.md,
  } as ViewStyle,
  header: {
    marginBottom: SPACING.xl,
  } as ViewStyle,
  backBtn: {
    fontFamily: FONTS.body,
    fontSize: 18,
    color: COLORS.cream,
    marginBottom: SPACING.sm,
  } as TextStyle,
  title: {
    fontFamily: FONTS.header,
    fontSize: 28,
    color: COLORS.cream,
    marginBottom: SPACING.xs,
  } as TextStyle,
  subtitle: {
    fontFamily: FONTS.body,
    fontSize: 14,
    color: COLORS.creamMuted,
    lineHeight: 20,
  } as TextStyle,
  form: {
    gap: SPACING.md,
    marginBottom: SPACING.lg,
  } as ViewStyle,
  label: {
    fontFamily: FONTS.mono,
    fontSize: 11,
    color: COLORS.sage,
    letterSpacing: 1,
    marginBottom: 4,
  } as TextStyle,
  input: {
    fontFamily: FONTS.body,
    fontSize: 16,
    color: COLORS.cream,
    backgroundColor: COLORS.bgCard,
    borderRadius: RADIUS.md,
    borderWidth: 1,
    borderColor: COLORS.border,
    paddingHorizontal: SPACING.md,
    paddingVertical: SPACING.md,
  } as TextStyle,
  cta: {
    backgroundColor: COLORS.sage,
    borderRadius: RADIUS.md,
    paddingVertical: SPACING.md,
    alignItems: 'center',
    marginBottom: SPACING.md,
  } as ViewStyle,
  ctaDisabled: {
    opacity: 0.5,
  } as ViewStyle,
  ctaText: {
    fontFamily: FONTS.bodySemiBold,
    fontSize: 16,
    color: COLORS.bg,
  } as TextStyle,
  error: {
    fontFamily: FONTS.body,
    fontSize: 14,
    color: COLORS.coral,
    marginBottom: SPACING.md,
  } as TextStyle,
  result: {
    backgroundColor: COLORS.bgCard,
    borderRadius: RADIUS.lg,
    borderWidth: 1,
    borderColor: COLORS.border,
    padding: SPACING.lg,
  } as ViewStyle,
  resultSummary: {
    fontFamily: FONTS.headerMedium,
    fontSize: 18,
    color: COLORS.gold,
    marginBottom: SPACING.lg,
    fontStyle: 'italic',
  } as TextStyle,
  section: {
    marginBottom: SPACING.lg,
  } as ViewStyle,
  sectionTitle: {
    fontFamily: FONTS.bodySemiBold,
    fontSize: 16,
    color: COLORS.cream,
    marginBottom: SPACING.sm,
  } as TextStyle,
  sectionLabel: {
    fontFamily: FONTS.mono,
    fontSize: 10,
    color: COLORS.sage,
    letterSpacing: 1,
    marginTop: SPACING.sm,
    marginBottom: 4,
  } as TextStyle,
  bodyText: {
    fontFamily: FONTS.body,
    fontSize: 14,
    color: COLORS.creamMuted,
    lineHeight: 20,
  } as TextStyle,
  bulletRow: {
    flexDirection: 'row',
    gap: SPACING.sm,
    marginBottom: 4,
  } as ViewStyle,
  bullet: {
    fontFamily: FONTS.body,
    fontSize: 14,
    color: COLORS.creamMuted,
  } as TextStyle,
  bulletText: {
    fontFamily: FONTS.body,
    fontSize: 14,
    color: COLORS.creamMuted,
    flex: 1,
    lineHeight: 20,
  } as TextStyle,
  proTip: {
    backgroundColor: COLORS.sageLight,
    borderRadius: RADIUS.md,
    padding: SPACING.md,
    marginTop: SPACING.sm,
  } as ViewStyle,
  proTipText: {
    fontFamily: FONTS.body,
    fontSize: 13,
    color: COLORS.cream,
    fontStyle: 'italic',
    lineHeight: 19,
  } as TextStyle,
});

export default withComingSoon(LayoverScreen, { routeName: 'layover', title: 'Layover Guide' });
