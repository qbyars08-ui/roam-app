// =============================================================================
// ROAM — AI Travel Persona Screen
// Your Travel DNA — a unique personality profile. Shareable as PNG.
// =============================================================================
import React, { useEffect, useRef, useState, useCallback } from 'react';
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
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { LinearGradient } from 'expo-linear-gradient';
import * as Haptics from '../lib/haptics';
import ViewShot, { captureRef } from '../lib/view-shot';
import * as Sharing from 'expo-sharing';
import { COLORS, FONTS, SPACING, RADIUS } from '../lib/constants';
import { ChevronLeft, RotateCcw } from 'lucide-react-native';
import {
  analyzePersona,
  getSavedPersona,
  FAMOUS_TRAVELER_MATCH,
  type TravelPersona,
  type PersonaTrait,
} from '../lib/travel-persona';
import { withComingSoon } from '../lib/with-coming-soon';

// =============================================================================
// Main Screen
// =============================================================================
function TravelPersonaScreen() {
  const router = useRouter();
  const insets = useSafeAreaInsets();
  const [persona, setPersona] = useState<TravelPersona | null>(null);
  const [loading, setLoading] = useState(true);
  const [revealPhase, setRevealPhase] = useState(0);
  const cardRef = useRef<React.ElementRef<typeof ViewShot> | null>(null);

  // Animations
  const fadeIn = useRef(new Animated.Value(0)).current;
  const cardScale = useRef(new Animated.Value(0.5)).current;
  const emojiScale = useRef(new Animated.Value(0)).current;
  const titleOpacity = useRef(new Animated.Value(0)).current;
  const subtitleOpacity = useRef(new Animated.Value(0)).current;
  const traitAnims = useRef(
    Array.from({ length: 5 }, () => new Animated.Value(0))
  ).current;
  const famousOpacity = useRef(new Animated.Value(0)).current;

  useEffect(() => {
    loadPersona();
  }, []);

  const loadPersona = async () => {
    setLoading(true);
    setRevealPhase(0);
    let p = await getSavedPersona();
    if (!p) {
      p = analyzePersona();
    }
    setPersona(p);
    setLoading(false);

    // Animated persona reveal sequence
    Animated.sequence([
      Animated.timing(fadeIn, { toValue: 1, duration: 400, useNativeDriver: true }),
      Animated.spring(cardScale, { toValue: 1, tension: 60, friction: 9, useNativeDriver: true }),
    ]).start(() => setRevealPhase(1));

    setTimeout(() => {
      Animated.parallel([
        Animated.spring(emojiScale, { toValue: 1, tension: 80, friction: 6, useNativeDriver: true }),
        Animated.timing(titleOpacity, { toValue: 1, duration: 500, useNativeDriver: true }),
      ]).start(() => setRevealPhase(2));
    }, 200);

    setTimeout(() => {
      Animated.timing(subtitleOpacity, { toValue: 1, duration: 400, useNativeDriver: true }).start(
        () => setRevealPhase(3)
      );
    }, 600);

    setTimeout(() => {
      Animated.stagger(
        80,
        traitAnims.map((anim) =>
          Animated.timing(anim, { toValue: 1, duration: 450, useNativeDriver: false })
        )
      ).start(() => setRevealPhase(4));
    }, 900);

    setTimeout(() => {
      Animated.timing(famousOpacity, { toValue: 1, duration: 500, useNativeDriver: true }).start();
    }, 1400);
  };

  const handleRefresh = useCallback(() => {
    Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Medium);
    setPersona(analyzePersona());
    emojiScale.setValue(0);
    titleOpacity.setValue(0);
    subtitleOpacity.setValue(0);
    famousOpacity.setValue(0);
    traitAnims.forEach((a) => a.setValue(0));
    Animated.sequence([
      Animated.spring(emojiScale, { toValue: 1, tension: 80, friction: 6, useNativeDriver: true }),
      Animated.timing(titleOpacity, { toValue: 1, duration: 400, useNativeDriver: true }),
    ]).start();
    Animated.timing(subtitleOpacity, { toValue: 1, duration: 400, useNativeDriver: true }).start();
    Animated.stagger(
      80,
      traitAnims.map((a) => Animated.timing(a, { toValue: 1, duration: 400, useNativeDriver: false }))
    ).start();
    Animated.timing(famousOpacity, { toValue: 1, duration: 400, useNativeDriver: true }).start();
  }, [traitAnims, emojiScale, titleOpacity, subtitleOpacity, famousOpacity]);

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
        dialogTitle: 'Share your Travel Persona',
      });
    } catch {
      // Sharing cancelled or failed silently
    }
  }, []);

  if (loading || !persona) {
    return (
      <View style={[styles.screen, { paddingTop: insets.top }]}>
        <View style={styles.loadingCenter}>
          <View style={styles.loadingDot} />
          <Text style={styles.loadingText}>Analyzing your Travel DNA...</Text>
        </View>
      </View>
    );
  }

  return (
    <View style={[styles.screen, { paddingTop: insets.top }]}>
      {/* Header */}
      <View style={styles.header}>
        <Pressable onPress={() => router.back()} hitSlop={12}>
          <ChevronLeft size={24} color={COLORS.cream} strokeWidth={2} />
        </Pressable>
        <View>
          <Text style={styles.eyebrow}>YOUR TRAVEL DNA</Text>
          <Text style={styles.title}>Travel Persona</Text>
        </View>
        <Pressable onPress={handleRefresh} hitSlop={12}>
          <RotateCcw size={22} color={COLORS.sage} strokeWidth={2} />
        </Pressable>
      </View>

      <ScrollView
        style={styles.scroll}
        contentContainerStyle={styles.scrollContent}
        showsVerticalScrollIndicator={false}
      >
        {/* Shareable Card */}
        <Animated.View
          style={[
            styles.cardWrapper,
            { opacity: fadeIn, transform: [{ scale: cardScale }] },
          ]}
        >
          <ViewShot ref={cardRef} options={{ format: 'png', quality: 1 }}>
            <LinearGradient
              colors={[persona.color, `${persona.color}88`, COLORS.bg]}
              start={{ x: 0, y: 0 }}
              end={{ x: 1, y: 1 }}
              style={styles.personaCard}
            >
              <Animated.Text style={[styles.personaTitle, { opacity: titleOpacity }]}>
                {persona.title}
              </Animated.Text>
              <Animated.Text style={[styles.personaSubtitle, { opacity: subtitleOpacity }]}>
                {persona.subtitle}
              </Animated.Text>

              {/* Trait Bars */}
              <View style={styles.traitsContainer}>
                {persona.traits.map((trait, i) => (
                  <TraitBar
                    key={trait.label}
                    trait={trait}
                    anim={traitAnims[i]}
                    accentColor={persona.color}
                  />
                ))}
              </View>

              {/* Stats Row */}
              <View style={styles.statsRow}>
                <StatBadge
                  value={`${persona.stats.tripsGenerated}`}
                  label="Trips"
                />
                <StatBadge
                  value={`${persona.stats.uniqueCountries}`}
                  label="Places"
                />
                <StatBadge
                  value={`${persona.stats.avgTripLength}d`}
                  label="Avg Length"
                />
                <StatBadge
                  value={persona.stats.planningStyle === 'spontaneous' ? 'Spontaneous' : persona.stats.planningStyle === 'planner' ? 'Planner' : 'Balanced'}
                  label="Style"
                />
              </View>

              {/* Evolution */}
              <Text style={styles.evolution}>{persona.evolution}</Text>

              {/* Watermark */}
              <View style={styles.watermark}>
                <Text style={styles.watermarkText}>ROAM</Text>
              </View>
            </LinearGradient>
          </ViewShot>
        </Animated.View>

        {/* Share Button */}
        <Pressable
          style={({ pressed }) => [
            styles.shareBtn,
            { opacity: pressed ? 0.85 : 1 },
          ]}
          onPress={handleShare}
        >
          <LinearGradient
            colors={[persona.color, `${persona.color}CC`]}
            style={styles.shareBtnGradient}
          >
            <Text style={styles.shareBtnText}>Share your Travel DNA</Text>
          </LinearGradient>
        </Pressable>

        {/* Persona Details */}
        <View style={styles.detailsCard}>
          <Text style={styles.detailsTitle}>What this means</Text>
          <Text style={styles.detailsBody}>
            {getPersonaDescription(persona)}
          </Text>
        </View>

        {/* Top Vibes */}
        {persona.stats.mostUsedVibe && (
          <View style={styles.detailsCard}>
            <Text style={styles.detailsTitle}>Your signature vibe</Text>
            <View style={styles.vibeChip}>
              <Text style={styles.vibeChipText}>
                {persona.stats.mostUsedVibe}
              </Text>
            </View>
            <Text style={styles.detailsHint}>
              This vibe shows up most in your trip choices
            </Text>
          </View>
        )}

        <View style={{ height: 40 }} />
      </ScrollView>
    </View>
  );
}

// =============================================================================
// Sub-Components
// =============================================================================
function TraitBar({
  trait,
  anim,
  accentColor,
}: {
  trait: PersonaTrait;
  anim: Animated.Value;
  accentColor: string;
}) {
  const width = anim.interpolate({
    inputRange: [0, 1],
    outputRange: ['0%', `${trait.value}%`],
  });

  return (
    <View style={styles.traitRow}>
      <View style={styles.traitLabelRow}>
        <Text style={styles.traitLabel}>{trait.label}</Text>
        <Text style={styles.traitValue}>{trait.value}</Text>
      </View>
      <View style={styles.traitBarBg}>
        <Animated.View
          style={[
            styles.traitBarFill,
            { width, backgroundColor: accentColor },
          ]}
        />
      </View>
    </View>
  );
}

function StatBadge({ value, label }: { value: string; label: string }) {
  return (
    <View style={styles.statBadge}>
      <Text style={styles.statValue}>{value}</Text>
      <Text style={styles.statLabel}>{label}</Text>
    </View>
  );
}

// =============================================================================
// Persona Descriptions
// =============================================================================
function getPersonaDescription(persona: TravelPersona): string {
  const descriptions: Record<string, string> = {
    'midnight-explorer':
      'You come alive after dark. Your ideal trip has rooftop bars, underground clubs, and streets that only get interesting at midnight. Early morning flights are your nemesis.',
    'dawn-chaser':
      'You are the person at the temple before the monks wake up. Sunrise hikes, empty beaches at 6am, and the smug satisfaction of beating every tourist — that is your travel style.',
    'food-archaeologist':
      'For you, the itinerary IS the restaurant list. Street food stalls at 2am, Michelin stars at noon, and a food coma in between. The sights are just something to walk past between meals.',
    'comfort-maximalist':
      'Life is too short for bad beds. You pick hotels with thread counts, transport with AC, and restaurants with tablecloths. Adventure? Sure — with a nice shower afterward.',
    'chaos-tourist':
      'Plans? Never heard of them. You book a one-way flight, figure out the rest on the ground, and somehow end up at places guidebooks have never heard of. Your trips are unrepeatable.',
    'culture-collector':
      'Every city is a classroom. You visit museums before they open, know the difference between Baroque and Rococo, and can name three local artists from any country you have visited.',
    'budget-ninja':
      'You have mastered the art of seeing the world on almost nothing. Overnight buses are luxury, street food is fine dining, and you know exactly which hostels have the best free breakfast.',
    'adventure-junkie':
      'If it does not spike your heart rate, is it even a vacation? Bungee jumping, cave diving, summit attempts — your trip highlights would terrify most people.',
    'slow-traveler':
      'One city. Two weeks. You learn the neighborhood, find a regular coffee spot, and start recognizing faces. Speed tourists confuse you. Why rush?',
    'digital-nomad':
      'WiFi speed is the first thing you check. Coworking spaces are your second home, and you have mastered the art of looking productive while actually planning your next trip.',
    'romantic-wanderer':
      'Every destination is a love story waiting to happen. Sunset viewpoints, candlelit dinners, and that perfect moment on the balcony — you travel for the feelings.',
    'solo-wolf':
      'You move at your own pace, eat when you want, and change plans without consulting anyone. Solo travel is not a compromise — it is a preference.',
  };

  return descriptions[persona.archetype] ?? 'Your unique travel style defies simple categories. Keep exploring — your persona evolves with every trip.';
}

// =============================================================================
// Styles
// =============================================================================
const styles = StyleSheet.create({
  screen: {
    flex: 1,
    backgroundColor: COLORS.bg,
  } as ViewStyle,
  loadingCenter: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
    gap: SPACING.md,
  } as ViewStyle,
  loadingDot: {
    width: 12,
    height: 12,
    borderRadius: 6,
    backgroundColor: COLORS.sage,
    opacity: 0.8,
  } as ViewStyle,
  loadingText: {
    fontFamily: FONTS.body,
    fontSize: 16,
    color: COLORS.cream,
    opacity: 0.7,
  } as TextStyle,
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: SPACING.lg,
    paddingVertical: SPACING.md,
  } as ViewStyle,
  eyebrow: {
    fontFamily: FONTS.mono,
    fontSize: 11,
    color: COLORS.sage,
    letterSpacing: 2,
    textAlign: 'center',
  } as TextStyle,
  title: {
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

  // Persona Card (shareable)
  cardWrapper: {
    borderRadius: RADIUS.xl,
    overflow: 'hidden',
    marginBottom: SPACING.lg,
  } as ViewStyle,
  personaCard: {
    padding: SPACING.xl,
    borderRadius: RADIUS.xl,
    alignItems: 'center',
  } as ViewStyle,
  personaEmoji: {
    fontSize: 64,
    marginBottom: SPACING.sm,
  } as TextStyle,
  personaTitle: {
    fontFamily: FONTS.header,
    fontSize: 28,
    color: COLORS.white,
    textAlign: 'center',
    marginBottom: 4,
  } as TextStyle,
  personaSubtitle: {
    fontFamily: FONTS.body,
    fontSize: 15,
    color: COLORS.creamBrightDim,
    textAlign: 'center',
    marginBottom: SPACING.lg,
  } as TextStyle,

  // Traits
  traitsContainer: {
    width: '100%',
    marginBottom: SPACING.lg,
    gap: SPACING.sm,
  } as ViewStyle,
  traitRow: {
    gap: 4,
  } as ViewStyle,
  traitLabelRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
  } as ViewStyle,
  traitEmoji: {
    fontSize: 14,
  } as TextStyle,
  traitLabel: {
    fontFamily: FONTS.mono,
    fontSize: 11,
    color: COLORS.creamHighlight,
    flex: 1,
    textTransform: 'uppercase',
    letterSpacing: 1,
  } as TextStyle,
  traitValue: {
    fontFamily: FONTS.mono,
    fontSize: 12,
    color: COLORS.white,
  } as TextStyle,
  traitBarBg: {
    height: 6,
    borderRadius: 3,
    backgroundColor: COLORS.whiteMuted,
    overflow: 'hidden',
  } as ViewStyle,
  traitBarFill: {
    height: '100%',
    borderRadius: 3,
  } as ViewStyle,

  // Stats
  statsRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    width: '100%',
    marginBottom: SPACING.md,
  } as ViewStyle,
  statBadge: {
    alignItems: 'center',
    gap: 2,
  } as ViewStyle,
  statValue: {
    fontFamily: FONTS.header,
    fontSize: 22,
    color: COLORS.white,
  } as TextStyle,
  statLabel: {
    fontFamily: FONTS.mono,
    fontSize: 10,
    color: COLORS.creamMuted,
    textTransform: 'uppercase',
    letterSpacing: 1,
  } as TextStyle,

  // Evolution
  evolution: {
    fontFamily: FONTS.body,
    fontSize: 13,
    color: COLORS.creamMuted,
    fontStyle: 'italic',
    textAlign: 'center',
  } as TextStyle,

  // Watermark
  watermark: {
    marginTop: SPACING.md,
  } as ViewStyle,
  watermarkText: {
    fontFamily: FONTS.mono,
    fontSize: 10,
    color: COLORS.creamDimLight,
    letterSpacing: 3,
  } as TextStyle,

  // Share Button
  shareBtn: {
    borderRadius: RADIUS.lg,
    overflow: 'hidden',
    marginBottom: SPACING.lg,
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

  // Details Cards
  detailsCard: {
    backgroundColor: COLORS.bgGlass,
    borderRadius: RADIUS.lg,
    borderWidth: 1,
    borderColor: COLORS.border,
    padding: SPACING.lg,
    marginBottom: SPACING.md,
  } as ViewStyle,
  detailsTitle: {
    fontFamily: FONTS.header,
    fontSize: 18,
    color: COLORS.cream,
    marginBottom: SPACING.sm,
  } as TextStyle,
  detailsBody: {
    fontFamily: FONTS.body,
    fontSize: 15,
    color: COLORS.creamBrightSoft,
    lineHeight: 22,
  } as TextStyle,
  detailsHint: {
    fontFamily: FONTS.body,
    fontSize: 13,
    color: COLORS.creamDim,
    marginTop: SPACING.xs,
  } as TextStyle,
  vibeChip: {
    alignSelf: 'flex-start',
    backgroundColor: COLORS.sageHighlight,
    borderWidth: 1,
    borderColor: COLORS.sage,
    borderRadius: RADIUS.full,
    paddingHorizontal: SPACING.md,
    paddingVertical: 6,
    marginBottom: SPACING.xs,
  } as ViewStyle,
  vibeChipText: {
    fontFamily: FONTS.mono,
    fontSize: 12,
    color: COLORS.sage,
    textTransform: 'capitalize',
  } as TextStyle,
  famousCard: {
    borderColor: COLORS.goldBorderStrong,
    backgroundColor: COLORS.goldVeryFaint,
  } as ViewStyle,
  famousName: {
    fontFamily: FONTS.header,
    fontSize: 24,
    color: COLORS.gold,
    marginBottom: 4,
  } as TextStyle,
  famousTagline: {
    fontFamily: FONTS.body,
    fontSize: 14,
    color: COLORS.creamMuted,
    fontStyle: 'italic',
  } as TextStyle,
});

export default withComingSoon(TravelPersonaScreen, { routeName: 'travel-persona', title: 'Travel Persona' });
