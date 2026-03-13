// =============================================================================
// ROAM — Dupe Finder: "Bali on a Paris budget"
// AI-powered destination dupes — cheaper alternatives with side-by-side cards.
// =============================================================================
import React, { useRef, useState, useCallback } from 'react';
import {
  Animated,
  ImageBackground,
  Pressable,
  ScrollView,
  StyleSheet,
  Text,
  TextInput,
  View,
  type TextStyle,
  type ViewStyle,
} from 'react-native';
import { useRouter } from 'expo-router';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { LinearGradient } from 'expo-linear-gradient';
import * as Haptics from '../lib/haptics';
import ViewShot, { captureRef } from '../lib/view-shot';
import * as Sharing from 'expo-sharing';
import { COLORS, FONTS, SPACING, RADIUS, DESTINATIONS } from '../lib/constants';
import { getDestinationPhoto } from '../lib/photos';
import ShimmerOverlay from '../components/ui/ShimmerOverlay';
import { callClaude } from '../lib/claude';
import { withComingSoon } from '../lib/with-coming-soon';

// =============================================================================
// Types
// =============================================================================
interface DupeResult {
  original: {
    destination: string;
    dailyCost: number;
    vibe: string;
  };
  dupes: DupeDestination[];
}

interface DupeDestination {
  destination: string;
  country: string;
  dailyCost: number;
  savings: number;
  savingsPercent: number;
  vibeMatch: number;
  crowdLevel: string;
  bestFor: string;
  whyDupe: string;
  proTip: string;
}

// =============================================================================
// System Prompt
// =============================================================================
const DUPE_SYSTEM_PROMPT = `You are ROAM's Destination Dupe Engine. Users give you a dream destination and you find 3 cheaper alternatives that deliver a similar experience.

CRITICAL: Respond with ONLY valid JSON. No markdown, no explanation, no extra text.

JSON schema:
{
  "original": {
    "destination": "City, Country",
    "dailyCost": 150,
    "vibe": "One-line vibe description"
  },
  "dupes": [
    {
      "destination": "City",
      "country": "Country",
      "dailyCost": 45,
      "savings": 105,
      "savingsPercent": 70,
      "vibeMatch": 85,
      "crowdLevel": "Low | Medium | High",
      "bestFor": "The type of traveler this dupe suits best — one sentence",
      "whyDupe": "Why this is a legit alternative — specific and opinionated, 1-2 sentences",
      "proTip": "Insider tip for this destination — the kind a local friend would text you"
    }
  ]
}

Rules:
- Always return exactly 3 dupes, sorted by savings (highest first)
- Dupes must be REAL cheaper alternatives with similar vibes
- vibeMatch is 0-100 (how closely it matches the original experience)
- dailyCost in USD
- savingsPercent = ((original - dupe) / original) * 100
- Be specific and opinionated — not generic travel brochure copy
- Include trending/emerging destinations when relevant (Albania for Greece, Georgia for Italy, etc.)
- Crowd levels should reflect 2025-2026 reality`;

// =============================================================================
// Suggested Dupes
// =============================================================================
const SUGGESTED_SEARCHES = [
  { dream: 'Santorini', hook: 'White caves, blue water, half the price' },
  { dream: 'Tokyo', hook: 'Neon streets and ramen for less' },
  { dream: 'Paris', hook: 'Romance without the markup' },
  { dream: 'Bali', hook: 'Tropical paradise, budget edition' },
  { dream: 'New York', hook: 'Big city energy on a smaller budget' },
  { dream: 'Iceland', hook: 'Dramatic landscapes, gentler prices' },
];

// =============================================================================
// Main Screen
// =============================================================================
function DupeFinderScreen() {
  const router = useRouter();
  const insets = useSafeAreaInsets();
  const [dreamDest, setDreamDest] = useState('');
  const [loading, setLoading] = useState(false);
  const [result, setResult] = useState<DupeResult | null>(null);
  const [error, setError] = useState<string | null>(null);
  const cardRef = useRef<React.ElementRef<typeof ViewShot> | null>(null);

  // Animations
  const fadeIn = useRef(new Animated.Value(0)).current;
  const cardAnims = useRef([
    new Animated.Value(0),
    new Animated.Value(0),
    new Animated.Value(0),
  ]).current;

  const animateResults = useCallback(() => {
    fadeIn.setValue(0);
    cardAnims.forEach((a) => a.setValue(0));

    Animated.timing(fadeIn, {
      toValue: 1,
      duration: 400,
      useNativeDriver: true,
    }).start();

    Animated.stagger(
      150,
      cardAnims.map((anim) =>
        Animated.spring(anim, {
          toValue: 1,
          tension: 50,
          friction: 8,
          useNativeDriver: true,
        })
      )
    ).start();
  }, [fadeIn, cardAnims]);

  const findDupes = useCallback(
    async (destination: string) => {
      if (!destination.trim()) return;

      setLoading(true);
      setError(null);
      setResult(null);
      Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Medium);

      try {
        // Check if destination exists in our constants for daily cost context
        const known = DESTINATIONS.find(
          (d) => d.label.toLowerCase() === destination.toLowerCase()
        );
        const contextLine = known
          ? `The user's dream destination is ${destination} (approx $${known.dailyCost}/day). Find 3 cheaper alternatives.`
          : `The user's dream destination is ${destination}. Estimate its daily cost, then find 3 cheaper alternatives.`;

        const response = await callClaude(DUPE_SYSTEM_PROMPT, contextLine, false);
        const parsed = JSON.parse(response.content) as DupeResult;

        if (!parsed.dupes || parsed.dupes.length === 0) {
          throw new Error('No dupes found');
        }

        setResult(parsed);
        animateResults();
        Haptics.notificationAsync(Haptics.NotificationFeedbackType.Success);
      } catch (err) {
        setError(
          "Couldn't find dupes for that destination. Try a different city."
        );
        Haptics.notificationAsync(Haptics.NotificationFeedbackType.Error);
      } finally {
        setLoading(false);
      }
    },
    [animateResults]
  );

  const handleShare = useCallback(async () => {
    if (!cardRef.current) return;
    Haptics.notificationAsync(Haptics.NotificationFeedbackType.Success);
    try {
      const uri = await captureRef(cardRef, {
        format: 'png',
        quality: 1,
        result: 'tmpfile',
      });
      await Sharing.shareAsync(uri, {
        mimeType: 'image/png',
        dialogTitle: 'Share Destination Dupes',
      });
    } catch {
      // cancelled
    }
  }, []);

  return (
    <View style={[styles.screen, { paddingTop: insets.top }]}>
      {/* Header */}
      <View style={styles.header}>
        <Pressable onPress={() => router.back()} hitSlop={12}>
          <Text style={styles.backBtn}>{'\u2190'}</Text>
        </Pressable>
        <View>
          <Text style={styles.headerEyebrow}>DESTINATION DUPES</Text>
          <Text style={styles.headerTitle}>Dupe Finder</Text>
        </View>
        <View style={{ width: 24 }} />
      </View>

      <ScrollView
        style={styles.scroll}
        contentContainerStyle={styles.scrollContent}
        showsVerticalScrollIndicator={false}
        keyboardShouldPersistTaps="handled"
      >
        {/* Search */}
        <View style={styles.searchCard}>
          <Text style={styles.searchLabel}>
            Where do you dream of going?
          </Text>
          <View style={styles.inputRow}>
            <TextInput
              style={styles.input}
              value={dreamDest}
              onChangeText={setDreamDest}
              placeholder="Santorini, Tokyo, Bali..."
              placeholderTextColor={COLORS.creamMuted}
              returnKeyType="search"
              onSubmitEditing={() => findDupes(dreamDest)}
              autoCorrect={false}
            />
            <Pressable
              style={({ pressed }) => [
                styles.searchBtn,
                { opacity: pressed ? 0.85 : 1 },
                loading && styles.searchBtnDisabled,
              ]}
              onPress={() => findDupes(dreamDest)}
              disabled={loading}
            >
              <Text style={styles.searchBtnText}>
                {loading ? 'Finding...' : 'Find Dupes'}
              </Text>
            </Pressable>
          </View>
        </View>

        {/* Suggested Searches */}
        {!result && !loading && (
          <View style={styles.suggestedSection}>
            <Text style={styles.suggestedTitle}>Try these</Text>
            <View style={styles.suggestedGrid}>
              {SUGGESTED_SEARCHES.map((s) => (
                <Pressable
                  key={s.dream}
                  style={({ pressed }) => [
                    styles.suggestedChip,
                    { opacity: pressed ? 0.8 : 1 },
                  ]}
                  onPress={() => {
                    setDreamDest(s.dream);
                    findDupes(s.dream);
                  }}
                >
                  <Text style={styles.suggestedChipLabel}>{s.dream}</Text>
                  <Text style={styles.suggestedChipHook}>{s.hook}</Text>
                </Pressable>
              ))}
            </View>
          </View>
        )}

        {/* Loading State */}
        {loading && (
          <View style={styles.loadingCenter}>
            <Text style={styles.loadingText}>
              Scanning the globe for cheaper vibes...
            </Text>
            <Text style={styles.loadingSubtext}>
              Comparing costs, crowds, and experiences
            </Text>
          </View>
        )}

        {/* Error */}
        {error && (
          <View style={styles.errorCard}>
            <Text style={styles.errorText}>{error}</Text>
          </View>
        )}

        {/* Results */}
        {result && (
          <>
            {/* Original Destination */}
            <Animated.View style={[styles.originalCard, { opacity: fadeIn }]}>
              <Text style={styles.originalEyebrow}>YOUR DREAM</Text>
              <Text style={styles.originalDest}>
                {result.original.destination}
              </Text>
              <Text style={styles.originalCost}>
                ~${result.original.dailyCost}/day
              </Text>
              <Text style={styles.originalVibe}>{result.original.vibe}</Text>
            </Animated.View>

            <Text style={styles.vsText}>VS</Text>

            {/* Dupe Cards — Shareable */}
            <ViewShot ref={cardRef} options={{ format: 'png', quality: 1 }}>
              <View style={styles.dupeCardsWrapper}>
                <View style={styles.dupeCardsHeader}>
                  <Text style={styles.dupeCardsHeaderBrand}>ROAM</Text>
                  <Text style={styles.dupeCardsHeaderTitle}>
                    {result.original.destination} Dupes
                  </Text>
                </View>
                {result.dupes.map((dupe, i) => (
                  <Animated.View
                    key={dupe.destination}
                    style={{
                      opacity: cardAnims[i] ?? fadeIn,
                      transform: [
                        {
                          translateY: (cardAnims[i] ?? fadeIn).interpolate({
                            inputRange: [0, 1],
                            outputRange: [40, 0],
                          }),
                        },
                      ],
                    }}
                  >
                    <DupeCard
                      dupe={dupe}
                      rank={i + 1}
                      original={result.original}
                    />
                  </Animated.View>
                ))}
                <View style={styles.dupeCardsFooter}>
                  <Text style={styles.dupeCardsFooterText}>
                    Go somewhere that changes you.
                  </Text>
                </View>
              </View>
            </ViewShot>

            {/* Share Button */}
            <Pressable
              style={({ pressed }) => [
                styles.shareBtn,
                { opacity: pressed ? 0.85 : 1 },
              ]}
              onPress={handleShare}
            >
              <LinearGradient
                colors={[COLORS.sage, COLORS.sageMedium]}
                style={styles.shareBtnGradient}
              >
                <Text style={styles.shareBtnText}>
                  Share the Dupes
                </Text>
              </LinearGradient>
            </Pressable>

            {/* Plan CTA */}
            <Pressable
              style={({ pressed }) => [
                styles.planBtn,
                { opacity: pressed ? 0.85 : 1 },
              ]}
              onPress={() => {
                if (result.dupes[0]) {
                  router.push({
                    pathname: '/(tabs)/plan',
                    params: { destination: result.dupes[0].destination },
                  });
                }
              }}
            >
              <Text style={styles.planBtnText}>
                Plan a trip to {result.dupes[0]?.destination ?? 'the top dupe'}
              </Text>
            </Pressable>
          </>
        )}

        <View style={{ height: 40 }} />
      </ScrollView>
    </View>
  );
}

// =============================================================================
// Dupe Card Component
// =============================================================================
function DupeCard({
  dupe,
  rank,
  original: _original,
}: {
  dupe: DupeDestination;
  rank: number;
  original: DupeResult['original'];
}) {
  const [loaded, setLoaded] = React.useState(false);
  const photoUrl = getDestinationPhoto(dupe.destination);
  return (
    <View style={styles.dupeCard}>
      <View style={styles.dupeCardImageWrap}>
        <ShimmerOverlay visible={!loaded} />
        <ImageBackground
          source={{ uri: photoUrl }}
          style={styles.dupeCardImage}
          imageStyle={styles.dupeCardImageInner}
          resizeMode="cover"
          onLoad={() => setLoaded(true)}
        >
        <LinearGradient
          colors={[COLORS.overlaySoft, COLORS.overlay, COLORS.bgDarkGreenDeep]}
          locations={[0, 0.4, 1]}
          style={styles.dupeCardGradient}
        >
      {/* Rank Badge */}
      <View style={styles.rankBadge}>
        <Text style={styles.rankText}>#{rank}</Text>
      </View>

      {/* Header */}
      <View style={styles.dupeHeader}>
        <View>
          <Text style={styles.dupeDest}>{dupe.destination}</Text>
          <Text style={styles.dupeCountry}>{dupe.country}</Text>
        </View>
        <View style={styles.savingsBadge}>
          <Text style={styles.savingsText}>
            {dupe.savingsPercent}% cheaper
          </Text>
        </View>
      </View>

      {/* Comparison Row */}
      <View style={styles.compRow}>
        <CompStat label="Daily Cost" value={`$${dupe.dailyCost}`} />
        <CompStat label="You Save" value={`$${dupe.savings}/day`} accent />
        <CompStat label="Vibe Match" value={`${dupe.vibeMatch}%`} />
        <CompStat label="Crowds" value={dupe.crowdLevel} />
      </View>

      {/* Why */}
      <Text style={styles.dupeWhy}>{dupe.whyDupe}</Text>

      {/* Best For */}
      <View style={styles.bestForRow}>
        <Text style={styles.bestForLabel}>Best for:</Text>
        <Text style={styles.bestForValue}>{dupe.bestFor}</Text>
      </View>

      {/* Pro Tip */}
      <View style={styles.tipRow}>
        <Text style={styles.tipLabel}>Tip</Text>
        <Text style={styles.tipText}>{dupe.proTip}</Text>
      </View>
        </LinearGradient>
      </ImageBackground>
      </View>
    </View>
  );
}

function CompStat({
  label,
  value,
  accent,
}: {
  label: string;
  value: string;
  accent?: boolean;
}) {
  return (
    <View style={styles.compStat}>
      <Text style={[styles.compStatValue, accent && styles.compStatAccent]}>
        {value}
      </Text>
      <Text style={styles.compStatLabel}>{label}</Text>
    </View>
  );
}

// =============================================================================
// Styles
// =============================================================================
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
    fontSize: 24,
    color: COLORS.cream,
  } as TextStyle,
  headerEyebrow: {
    fontFamily: FONTS.mono,
    fontSize: 10,
    color: COLORS.sage,
    letterSpacing: 2,
    textAlign: 'center',
  } as TextStyle,
  headerTitle: {
    fontFamily: FONTS.header,
    fontSize: 24,
    color: COLORS.cream,
    textAlign: 'center',
  } as TextStyle,
  scroll: {
    flex: 1,
  } as ViewStyle,
  scrollContent: {
    paddingHorizontal: SPACING.lg,
    paddingBottom: SPACING.xl,
  } as ViewStyle,

  // Search
  searchCard: {
    backgroundColor: COLORS.bgGlass,
    borderRadius: RADIUS.lg,
    borderWidth: 1,
    borderColor: COLORS.border,
    padding: SPACING.lg,
    marginBottom: SPACING.lg,
  } as ViewStyle,
  searchLabel: {
    fontFamily: FONTS.header,
    fontSize: 20,
    color: COLORS.cream,
    marginBottom: SPACING.md,
  } as TextStyle,
  inputRow: {
    flexDirection: 'row',
    gap: SPACING.sm,
  } as ViewStyle,
  input: {
    flex: 1,
    fontFamily: FONTS.body,
    fontSize: 16,
    color: COLORS.cream,
    backgroundColor: COLORS.border,
    borderRadius: RADIUS.md,
    paddingHorizontal: SPACING.md,
    paddingVertical: 14,
    borderWidth: 1,
    borderColor: COLORS.border,
  } as TextStyle,
  searchBtn: {
    backgroundColor: COLORS.sage,
    borderRadius: RADIUS.md,
    paddingHorizontal: SPACING.lg,
    justifyContent: 'center',
  } as ViewStyle,
  searchBtnDisabled: {
    opacity: 0.5,
  } as ViewStyle,
  searchBtnText: {
    fontFamily: FONTS.bodySemiBold,
    fontSize: 14,
    color: COLORS.bg,
  } as TextStyle,

  // Suggested
  suggestedSection: {
    marginBottom: SPACING.lg,
  } as ViewStyle,
  suggestedTitle: {
    fontFamily: FONTS.mono,
    fontSize: 11,
    color: COLORS.creamMuted,
    letterSpacing: 2,
    marginBottom: SPACING.md,
    textTransform: 'uppercase',
  } as TextStyle,
  suggestedGrid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: SPACING.sm,
  } as ViewStyle,
  suggestedChip: {
    backgroundColor: COLORS.bgGlass,
    borderRadius: RADIUS.md,
    borderWidth: 1,
    borderColor: COLORS.border,
    paddingHorizontal: SPACING.md,
    paddingVertical: SPACING.sm,
    width: '48%' as unknown as number,
  } as ViewStyle,
  suggestedChipLabel: {
    fontFamily: FONTS.bodySemiBold,
    fontSize: 14,
    color: COLORS.cream,
    marginBottom: 2,
  } as TextStyle,
  suggestedChipHook: {
    fontFamily: FONTS.body,
    fontSize: 11,
    color: COLORS.creamMuted,
  } as TextStyle,

  // Loading
  loadingCenter: {
    alignItems: 'center',
    paddingVertical: SPACING.xxl,
    gap: SPACING.sm,
  } as ViewStyle,
  loadingText: {
    fontFamily: FONTS.body,
    fontSize: 16,
    color: COLORS.cream,
    textAlign: 'center',
  } as TextStyle,
  loadingSubtext: {
    fontFamily: FONTS.body,
    fontSize: 13,
    color: COLORS.creamMuted,
    textAlign: 'center',
  } as TextStyle,

  // Error
  errorCard: {
    backgroundColor: COLORS.coralLight,
    borderRadius: RADIUS.md,
    padding: SPACING.md,
    marginBottom: SPACING.lg,
  } as ViewStyle,
  errorText: {
    fontFamily: FONTS.body,
    fontSize: 14,
    color: COLORS.coral,
    textAlign: 'center',
  } as TextStyle,

  // Original card
  originalCard: {
    backgroundColor: COLORS.bgGlass,
    borderRadius: RADIUS.lg,
    borderWidth: 1,
    borderColor: COLORS.border,
    padding: SPACING.lg,
    alignItems: 'center',
    marginBottom: SPACING.md,
  } as ViewStyle,
  originalEyebrow: {
    fontFamily: FONTS.mono,
    fontSize: 10,
    color: COLORS.gold,
    letterSpacing: 2,
    marginBottom: 4,
  } as TextStyle,
  originalDest: {
    fontFamily: FONTS.header,
    fontSize: 28,
    color: COLORS.cream,
    textAlign: 'center',
  } as TextStyle,
  originalCost: {
    fontFamily: FONTS.mono,
    fontSize: 14,
    color: COLORS.coral,
    marginTop: 4,
  } as TextStyle,
  originalVibe: {
    fontFamily: FONTS.body,
    fontSize: 13,
    color: COLORS.creamMuted,
    marginTop: 4,
    textAlign: 'center',
  } as TextStyle,

  // VS
  vsText: {
    fontFamily: FONTS.header,
    fontSize: 20,
    color: COLORS.creamMuted,
    textAlign: 'center',
    marginBottom: SPACING.md,
  } as TextStyle,

  // Dupe Cards Wrapper (shareable)
  dupeCardsWrapper: {
    backgroundColor: COLORS.bg,
    borderRadius: RADIUS.lg,
    overflow: 'hidden',
    paddingBottom: SPACING.md,
  } as ViewStyle,
  dupeCardsHeader: {
    alignItems: 'center',
    paddingVertical: SPACING.md,
  } as ViewStyle,
  dupeCardsHeaderBrand: {
    fontFamily: FONTS.mono,
    fontSize: 12,
    color: COLORS.sage,
    letterSpacing: 3,
  } as TextStyle,
  dupeCardsHeaderTitle: {
    fontFamily: FONTS.header,
    fontSize: 20,
    color: COLORS.cream,
    marginTop: 2,
  } as TextStyle,
  dupeCardsFooter: {
    alignItems: 'center',
    paddingTop: SPACING.sm,
  } as ViewStyle,
  dupeCardsFooterText: {
    fontFamily: FONTS.mono,
    fontSize: 10,
    color: COLORS.creamDimLight,
    letterSpacing: 1,
  } as TextStyle,

  // Dupe Card
  dupeCard: {
    borderRadius: RADIUS.lg,
    borderWidth: 1,
    borderColor: COLORS.border,
    overflow: 'hidden',
    marginHorizontal: SPACING.md,
    marginBottom: SPACING.md,
  } as ViewStyle,
  dupeCardImageWrap: {
    position: 'relative',
    overflow: 'hidden',
    minHeight: 180,
  } as ViewStyle,
  dupeCardImage: {
    padding: SPACING.lg,
  } as any,
  dupeCardImageInner: {
    borderRadius: RADIUS.lg,
  } as any,
  dupeCardGradient: {
    flex: 1,
    padding: 0,
  } as ViewStyle,
  rankBadge: {
    alignSelf: 'flex-start',
    marginBottom: SPACING.sm,
    backgroundColor: COLORS.sage,
    borderRadius: RADIUS.full,
    paddingHorizontal: SPACING.sm,
    paddingVertical: 2,
  } as ViewStyle,
  rankText: {
    fontFamily: FONTS.mono,
    fontSize: 11,
    color: COLORS.bg,
    fontWeight: '700',
  } as TextStyle,
  dupeHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'flex-start',
    marginBottom: SPACING.md,
  } as ViewStyle,
  dupeDest: {
    fontFamily: FONTS.header,
    fontSize: 22,
    color: COLORS.cream,
  } as TextStyle,
  dupeCountry: {
    fontFamily: FONTS.mono,
    fontSize: 11,
    color: COLORS.sage,
    letterSpacing: 1,
  } as TextStyle,
  savingsBadge: {
    backgroundColor: COLORS.sageHighlight,
    borderRadius: RADIUS.full,
    paddingHorizontal: SPACING.sm,
    paddingVertical: 4,
    borderWidth: 1,
    borderColor: COLORS.sage,
  } as ViewStyle,
  savingsText: {
    fontFamily: FONTS.mono,
    fontSize: 11,
    color: COLORS.sage,
  } as TextStyle,

  // Comparison Row
  compRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    marginBottom: SPACING.md,
  } as ViewStyle,
  compStat: {
    alignItems: 'center',
    gap: 2,
  } as ViewStyle,
  compStatValue: {
    fontFamily: FONTS.bodySemiBold,
    fontSize: 15,
    color: COLORS.cream,
  } as TextStyle,
  compStatAccent: {
    color: COLORS.sage,
  } as TextStyle,
  compStatLabel: {
    fontFamily: FONTS.mono,
    fontSize: 9,
    color: COLORS.creamMuted,
    letterSpacing: 1,
    textTransform: 'uppercase',
  } as TextStyle,

  // Why
  dupeWhy: {
    fontFamily: FONTS.body,
    fontSize: 14,
    color: COLORS.creamBrightDim,
    lineHeight: 21,
    marginBottom: SPACING.sm,
  } as TextStyle,

  // Best For
  bestForRow: {
    flexDirection: 'row',
    gap: 6,
    marginBottom: SPACING.sm,
  } as ViewStyle,
  bestForLabel: {
    fontFamily: FONTS.mono,
    fontSize: 11,
    color: COLORS.creamMuted,
    letterSpacing: 1,
  } as TextStyle,
  bestForValue: {
    fontFamily: FONTS.body,
    fontSize: 12,
    color: COLORS.cream,
    flex: 1,
  } as TextStyle,

  // Pro Tip
  tipRow: {
    flexDirection: 'row',
    gap: 8,
    backgroundColor: COLORS.sageSubtle,
    borderRadius: RADIUS.sm,
    padding: SPACING.sm,
  } as ViewStyle,
  tipLabel: {
    fontFamily: FONTS.mono,
    fontSize: 12,
    color: COLORS.sage,
  } as TextStyle,
  tipText: {
    fontFamily: FONTS.body,
    fontSize: 12,
    color: COLORS.creamMuted,
    flex: 1,
    lineHeight: 18,
  } as TextStyle,

  // Share Button
  shareBtn: {
    borderRadius: RADIUS.lg,
    overflow: 'hidden',
    marginTop: SPACING.lg,
    marginBottom: SPACING.sm,
  } as ViewStyle,
  shareBtnGradient: {
    paddingVertical: SPACING.md,
    alignItems: 'center',
    borderRadius: RADIUS.lg,
  } as ViewStyle,
  shareBtnText: {
    fontFamily: FONTS.bodySemiBold,
    fontSize: 16,
    color: COLORS.white,
    letterSpacing: 0.5,
  } as TextStyle,

  // Plan Button
  planBtn: {
    borderRadius: RADIUS.lg,
    borderWidth: 1,
    borderColor: COLORS.sage,
    paddingVertical: SPACING.md,
    alignItems: 'center',
    marginBottom: SPACING.lg,
  } as ViewStyle,
  planBtnText: {
    fontFamily: FONTS.bodySemiBold,
    fontSize: 15,
    color: COLORS.sage,
  } as TextStyle,
});

export default withComingSoon(DupeFinderScreen, { routeName: 'dupe-finder', title: 'Dupe Finder' });
