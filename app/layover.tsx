// =============================================================================
// ROAM — Layover Optimizer
// What to do with X hours in a layover city.
// Magazine aesthetic: dark cards, photo cards, editorial typography.
// =============================================================================
import React, { useCallback, useMemo, useState } from 'react';
import {
  View,
  Text,
  ScrollView,
  Pressable,
  StyleSheet,
  Image,
  type ViewStyle,
  type TextStyle,
  type ImageStyle,
} from 'react-native';
import { useRouter } from 'expo-router';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import {
  ArrowLeft,
  Minus,
  Plus,
  Plane,
} from 'lucide-react-native';
import { useTranslation } from 'react-i18next';
import * as Haptics from '../lib/haptics';
import { COLORS, FONTS, SPACING, RADIUS, MAGAZINE } from '../lib/constants';
import {
  getLayoverGuide,
  getLayoverActivities,
  getSupportedLayoverAirports,
  type LayoverGuide,
  type LayoverActivity,
} from '../lib/layover-data';
import { getDestinationPhoto } from '../lib/photos';

// ---------------------------------------------------------------------------
// Lounge intel — curated notes per airport
// ---------------------------------------------------------------------------
const LOUNGE_INTEL: Record<string, string[]> = {
  JFK: [
    'Priority Pass accepted at most terminals. The Centurion Lounge (T4) is the gold standard.',
    'Delta Sky Club in T4 is solid if you have access. Expect crowds during peak hours.',
    'T5 JetBlue lounge is surprisingly decent for a budget carrier.',
  ],
  LAX: [
    'Tom Bradley International has the best lounges. Star Alliance is worth seeking out.',
    'The Centurion Lounge is small and waitlisted — arrive early or skip it.',
    'United Polaris lounge in TBIT is excellent if you have access.',
  ],
  LHR: [
    'T5 Galleries lounges are solid. Priority Pass gets you into Plaza Premium.',
    'Cathay Pacific The Wing in T3 is one of the best in the airport.',
    'Arrive early — T5 lounges fill up fast on transatlantic morning departures.',
  ],
  NRT: [
    'JAL First Class Lounge is legendary if you can access it. Priority Pass works at IASS.',
    'ANA Suite Lounge in T1 has excellent ramen — go for the noodles alone.',
    'Sakura Lounge (JAL) is accessible on many itineraries and has great views of the tarmac.',
  ],
  DXB: [
    'Emirates lounges set the bar. Priority Pass works at Marhaba. Showers available everywhere.',
    'The Emirates First Class lounge in Concourse A is otherworldly — spa, à la carte dining.',
    'Sleep pods are available in T3 if you need a proper rest between connections.',
  ],
  SIN: [
    'Changi is a destination itself. Butterfly garden, rooftop pool (T1). Priority Pass at SATS.',
    'The SATS Premier Lounge via Priority Pass is well-stocked and rarely crowded.',
    'Jewel Changi is technically landside — clear immigration early to access it stress-free.',
  ],
  CDG: [
    'Star Alliance lounge in T1 is decent. Bring your own food — CDG restaurants are overpriced.',
    'Air France Salon in T2F is exceptional if your ticket qualifies.',
    'Bypass CDG food courts — the brasseries near gates are better value and quieter.',
  ],
  ICN: [
    'Free transit tours available. SkyHub Lounge via Priority Pass. Jjimjilbang spa is incredible.',
    'Korean Air Prestige Lounge in T1 has a full Korean buffet — worth the early arrival.',
    'The free Korean Cultural Experience zone on Level 3 is genuinely worth 30 minutes.',
  ],
};

// ---------------------------------------------------------------------------
// Terminal notes — concise airside/transit info
// ---------------------------------------------------------------------------
const TERMINAL_NOTES: Record<string, string> = {
  JFK: 'Terminals NOT connected airside — allow 30 min for AirTrain transfer',
  LAX: 'Terminals NOT connected airside — shuttle required between some terminals',
  LHR: 'T5 is self-contained. T2/T3 connected airside. T4 requires transit',
  NRT: 'T1 and T2 connected by free shuttle — allow 15 min',
  DXB: 'All gates connected airside via Concourse system',
  SIN: 'All terminals connected — Jewel accessible from T1 without clearing immigration',
  CDG: 'T2 has multiple sub-terminals — allow extra time between 2E and 2F',
  ICN: 'T1 and T2 require AREX or shuttle — NOT connected airside',
};

// ---------------------------------------------------------------------------
// Airport city names for photo lookup
// ---------------------------------------------------------------------------
const AIRPORT_CITIES: Record<string, string> = {
  JFK: 'New York',
  LAX: 'Los Angeles',
  LHR: 'London',
  NRT: 'Tokyo',
  DXB: 'Dubai',
  SIN: 'Singapore',
  CDG: 'Paris',
  ICN: 'Seoul',
};

// ---------------------------------------------------------------------------
// Sub-components
// ---------------------------------------------------------------------------

function AirportPhotoCard({
  code,
  isActive,
  onPress,
}: {
  code: string;
  isActive: boolean;
  onPress: () => void;
}) {
  const city = AIRPORT_CITIES[code] ?? code;
  const photoUri = getDestinationPhoto(city, 320);

  return (
    <Pressable
      onPress={() => {
        Haptics.selectionAsync();
        onPress();
      }}
      style={[
        styles.airportCard,
        isActive && styles.airportCardActive,
        !isActive && styles.airportCardInactive,
      ]}
    >
      <Image
        source={{ uri: photoUri }}
        style={styles.airportCardPhoto}
        resizeMode="cover"
      />
      <View style={styles.airportCardOverlay} />
      <View style={styles.airportCardContent}>
        <Text style={styles.airportCardCode}>{code}</Text>
        <Text style={styles.airportCardCity}>{city}</Text>
      </View>
    </Pressable>
  );
}

function HeroSection({ guide }: { guide: LayoverGuide }) {
  const { t } = useTranslation();
  const photoUri = getDestinationPhoto(guide.city, 800);
  const terminalNote = TERMINAL_NOTES[guide.airportCode] ?? t('layover.checkTerminalMaps', { defaultValue: 'Check terminal maps on arrival' });

  return (
    <View style={styles.heroContainer}>
      <Image
        source={{ uri: photoUri }}
        style={styles.heroPhoto}
        resizeMode="cover"
      />
      <View style={styles.heroGradient} />
      <View style={styles.heroContent}>
        <Text style={styles.heroAirportName}>{guide.airport}</Text>
        <Text style={styles.heroTerminalNote}>{terminalNote}</Text>
      </View>
    </View>
  );
}

function ActivityCard({ activity }: { activity: LayoverActivity }) {
  return (
    <View style={styles.activityCard}>
      <View style={styles.activityBorderAccent} />
      <View style={styles.activityCardInner}>
        <View style={styles.activityMeta}>
          <Text style={styles.activityCategory}>{activity.category.toUpperCase()}</Text>
          <Text style={styles.activityDuration}>{activity.duration}</Text>
        </View>
        <Text style={styles.activityTitle}>{activity.title}</Text>
        <Text style={styles.activityDesc}>{activity.description}</Text>
        <View style={styles.tipContainer}>
          <View style={styles.tipAccent} />
          <Text style={styles.tipText}>{activity.tip}</Text>
        </View>
      </View>
    </View>
  );
}

function PerkItem({ text }: { text: string }) {
  return (
    <View style={styles.perkItem}>
      <View style={styles.perkAccent} />
      <Text style={styles.perkText}>{text}</Text>
    </View>
  );
}

function LoungeItem({ text }: { text: string }) {
  return (
    <View style={styles.loungeItem}>
      <View style={styles.loungeAccent} />
      <Text style={styles.loungeText}>{text}</Text>
    </View>
  );
}

// ---------------------------------------------------------------------------
// Main Screen
// ---------------------------------------------------------------------------
function LayoverScreen() {
  const { t } = useTranslation();
  const router = useRouter();
  const insets = useSafeAreaInsets();
  const airports = useMemo(() => getSupportedLayoverAirports(), []);

  const [selectedAirport, setSelectedAirport] = useState(airports[0] ?? 'JFK');
  const [hours, setHours] = useState(4);

  const guide = useMemo<LayoverGuide | null>(
    () => getLayoverGuide(selectedAirport),
    [selectedAirport],
  );

  const { inAirport, canLeave, activities } = useMemo(
    () => getLayoverActivities(selectedAirport, hours),
    [selectedAirport, hours],
  );

  const loungeNotes = useMemo(
    () => LOUNGE_INTEL[selectedAirport] ?? [],
    [selectedAirport],
  );

  const handleDecrease = useCallback(() => {
    Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
    setHours((h) => Math.max(1, h - 1));
  }, []);

  const handleIncrease = useCallback(() => {
    Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
    setHours((h) => Math.min(24, h + 1));
  }, []);

  const handleBack = useCallback(() => {
    Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
    router.back();
  }, [router]);

  return (
    <View style={[styles.container, { paddingTop: insets.top }]}>
      {/* Header */}
      <View style={styles.header}>
        <Pressable onPress={handleBack} hitSlop={12}>
          <ArrowLeft size={24} color={COLORS.cream} strokeWidth={1.5} />
        </Pressable>
        <View style={{ flex: 1 }}>
          <Text style={styles.headerTitle}>{t('layover.headerTitle', { defaultValue: 'Layover Optimizer' })}</Text>
          <Text style={styles.headerSub}>{t('layover.headerSub', { defaultValue: 'What to do with your time' })}</Text>
        </View>
        <Plane size={20} color={COLORS.sage} strokeWidth={1.5} />
      </View>

      <ScrollView
        style={styles.scroll}
        contentContainerStyle={[styles.scrollContent, { paddingBottom: insets.bottom + 40 }]}
        showsVerticalScrollIndicator={false}
      >
        {/* Airport selector — photo cards */}
        <Text style={styles.sectionLabel}>{t('layover.airportLabel', { defaultValue: 'AIRPORT' })}</Text>
        <ScrollView
          horizontal
          showsHorizontalScrollIndicator={false}
          contentContainerStyle={styles.airportCardRow}
        >
          {airports.map((code) => (
            <AirportPhotoCard
              key={code}
              code={code}
              isActive={selectedAirport === code}
              onPress={() => setSelectedAirport(code)}
            />
          ))}
        </ScrollView>

        {/* Hero — full-width city photo + airport name */}
        {guide && <HeroSection guide={guide} />}

        {/* Transit info */}
        {guide && (
          <View style={styles.transitCard}>
            <View style={styles.transitAccent} />
            <View style={styles.transitCardInner}>
              <Text style={styles.transitLabel}>{t('layover.cityAccess', { defaultValue: 'CITY ACCESS' })}</Text>
              <Text style={styles.transitDetail}>
                {`${guide.transitTime} via ${guide.transitMethod}`}
              </Text>
            </View>
          </View>
        )}

        {/* Hours selector */}
        <Text style={[styles.sectionLabel, { marginTop: SPACING.xl }]}>{t('layover.layoverTime', { defaultValue: 'LAYOVER TIME' })}</Text>
        <View style={styles.hoursRow}>
          <Pressable
            onPress={handleDecrease}
            style={({ pressed }) => [styles.hoursBtn, pressed && { opacity: 0.5 }]}
          >
            <Text style={styles.hoursBtnText}>−</Text>
          </Pressable>
          <View style={styles.hoursDisplay}>
            <Text style={styles.hoursNum}>{hours}</Text>
            <Text style={styles.hoursLabel}>{hours === 1 ? t('layover.hour', { defaultValue: 'hour' }) : t('layover.hours', { defaultValue: 'hours' })}</Text>
          </View>
          <Pressable
            onPress={handleIncrease}
            style={({ pressed }) => [styles.hoursBtn, pressed && { opacity: 0.5 }]}
          >
            <Text style={styles.hoursBtnText}>+</Text>
          </Pressable>
        </View>

        {/* Status — text only, no pill */}
        <Text style={[
          styles.statusText,
          { color: canLeave ? COLORS.sage : COLORS.coral },
        ]}>
          {canLeave
            ? t('layover.enoughTime', { defaultValue: '{{hours}} hours is enough to explore {{city}}', hours, city: guide?.city ?? t('layover.theCity', { defaultValue: 'the city' }) })
            : guide
              ? t('layover.stayInAirportWithHours', { defaultValue: 'Stay in the airport — need {{minHours}}+ hours to leave', minHours: guide.minHoursToLeave })
              : t('layover.stayInAirport', { defaultValue: 'Stay in the airport' })}
        </Text>

        {/* In-airport perks */}
        {inAirport.length > 0 && (
          <View style={styles.section}>
            <Text style={styles.sectionHeader}>{t('layover.insideAirport', { defaultValue: 'Inside the airport' })}</Text>
            {inAirport.map((perk, i) => (
              <PerkItem key={i} text={perk} />
            ))}
          </View>
        )}

        {/* Lounge intel */}
        {loungeNotes.length > 0 && (
          <View style={styles.section}>
            <Text style={styles.sectionHeader}>{t('layover.loungeAccess', { defaultValue: 'Lounge access' })}</Text>
            {loungeNotes.map((note, i) => (
              <LoungeItem key={i} text={note} />
            ))}
          </View>
        )}

        {/* Outside activities */}
        {activities.length > 0 && (
          <View style={styles.section}>
            <Text style={styles.sectionHeader}>{t('layover.leaveAirport', { defaultValue: 'Leave the airport' })}</Text>
            <Text style={styles.sectionMeta}>
              {t('layover.fitsLayover', { defaultValue: 'Fits your {{hours}}-hour layover — 90 min buffer for transit and security included.', hours })}
            </Text>
            {activities.map((activity, i) => (
              <ActivityCard key={i} activity={activity} />
            ))}
          </View>
        )}

        {/* No activities fallback */}
        {canLeave && activities.length === 0 && (
          <View style={styles.emptyCard}>
            <View style={styles.emptyAccent} />
            <Text style={styles.emptyText}>
              {t('layover.notEnoughTime', { defaultValue: 'Not enough time for city activities after transit and security. Enjoy the airport amenities instead.' })}
            </Text>
          </View>
        )}
      </ScrollView>
    </View>
  );
}

// ---------------------------------------------------------------------------
// Styles
// ---------------------------------------------------------------------------
const CARD_BG = '#0D1710';

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: COLORS.bg,
  } as ViewStyle,

  // Header
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: SPACING.sm,
    paddingHorizontal: MAGAZINE.padding,
    paddingVertical: SPACING.md,
  } as ViewStyle,
  headerTitle: {
    fontFamily: FONTS.header,
    fontSize: 26,
    color: COLORS.cream,
  } as TextStyle,
  headerSub: {
    fontFamily: FONTS.body,
    fontSize: 13,
    color: COLORS.creamMuted,
  } as TextStyle,

  // Scroll
  scroll: {
    flex: 1,
  } as ViewStyle,
  scrollContent: {
    paddingHorizontal: MAGAZINE.padding,
    paddingTop: SPACING.xs,
  } as ViewStyle,

  // Section labels (mono caps)
  sectionLabel: {
    fontFamily: FONTS.mono,
    fontSize: 10,
    color: COLORS.creamMuted,
    letterSpacing: 1.5,
    marginBottom: SPACING.sm,
    marginTop: SPACING.md,
  } as TextStyle,

  // Airport photo cards
  airportCardRow: {
    flexDirection: 'row',
    gap: SPACING.sm,
    paddingVertical: SPACING.xs,
    paddingRight: MAGAZINE.padding,
  } as ViewStyle,
  airportCard: {
    width: 160,
    height: 100,
    borderRadius: RADIUS.lg,
    overflow: 'hidden',
    borderWidth: 2,
    borderColor: 'transparent',
  } as ViewStyle,
  airportCardActive: {
    borderColor: COLORS.sage,
  } as ViewStyle,
  airportCardInactive: {
    opacity: 0.7,
  } as ViewStyle,
  airportCardPhoto: {
    width: '100%',
    height: '100%',
    position: 'absolute',
  } as ImageStyle,
  airportCardOverlay: {
    ...StyleSheet.absoluteFillObject,
    backgroundColor: COLORS.overlayMedium,
  } as ViewStyle,
  airportCardContent: {
    position: 'absolute',
    bottom: 8,
    left: 10,
  } as ViewStyle,
  airportCardCode: {
    fontFamily: FONTS.mono,
    fontSize: 18,
    color: COLORS.cream,
    letterSpacing: 1,
  } as TextStyle,
  airportCardCity: {
    fontFamily: FONTS.body,
    fontSize: 12,
    color: COLORS.creamSoft,
    marginTop: 1,
  } as TextStyle,

  // Hero section
  heroContainer: {
    width: '100%',
    height: 200,
    borderRadius: RADIUS.lg,
    overflow: 'hidden',
    marginTop: SPACING.md,
  } as ViewStyle,
  heroPhoto: {
    width: '100%',
    height: '100%',
    position: 'absolute',
  } as ImageStyle,
  heroGradient: {
    ...StyleSheet.absoluteFillObject,
    backgroundColor: COLORS.overlayLight,
  } as ViewStyle,
  heroContent: {
    position: 'absolute',
    bottom: MAGAZINE.padding,
    left: MAGAZINE.padding,
    right: MAGAZINE.padding,
  } as ViewStyle,
  heroAirportName: {
    fontFamily: FONTS.header,
    fontSize: 32,
    color: COLORS.cream,
    lineHeight: 36,
  } as TextStyle,
  heroTerminalNote: {
    fontFamily: FONTS.mono,
    fontSize: 13,
    color: COLORS.creamSoft,
    marginTop: 6,
  } as TextStyle,

  // Transit card
  transitCard: {
    flexDirection: 'row',
    backgroundColor: CARD_BG,
    borderRadius: RADIUS.lg,
    marginTop: SPACING.sm,
    overflow: 'hidden',
  } as ViewStyle,
  transitAccent: {
    width: 3,
    backgroundColor: COLORS.sage,
    borderTopLeftRadius: RADIUS.lg,
    borderBottomLeftRadius: RADIUS.lg,
  } as ViewStyle,
  transitCardInner: {
    flex: 1,
    paddingHorizontal: MAGAZINE.padding,
    paddingVertical: SPACING.md,
  } as ViewStyle,
  transitLabel: {
    fontFamily: FONTS.mono,
    fontSize: 10,
    color: COLORS.creamMuted,
    letterSpacing: 1.5,
    marginBottom: 4,
  } as TextStyle,
  transitDetail: {
    fontFamily: FONTS.body,
    fontSize: 14,
    color: COLORS.cream,
  } as TextStyle,

  // Hours selector
  hoursRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: SPACING.xl,
    paddingVertical: SPACING.md,
  } as ViewStyle,
  hoursBtn: {
    padding: SPACING.sm,
  } as ViewStyle,
  hoursBtnText: {
    fontFamily: FONTS.mono,
    fontSize: 28,
    color: COLORS.sage,
    lineHeight: 32,
  } as TextStyle,
  hoursDisplay: {
    alignItems: 'center',
    minWidth: 80,
  } as ViewStyle,
  hoursNum: {
    fontFamily: FONTS.mono,
    fontSize: 48,
    color: COLORS.cream,
    lineHeight: 52,
  } as TextStyle,
  hoursLabel: {
    fontFamily: FONTS.mono,
    fontSize: 11,
    color: COLORS.creamMuted,
    letterSpacing: 1,
    marginTop: 2,
  } as TextStyle,

  // Status text
  statusText: {
    fontFamily: FONTS.body,
    fontSize: 14,
    textAlign: 'center',
    marginBottom: SPACING.md,
    lineHeight: 20,
  } as TextStyle,

  // Sections
  section: {
    marginTop: SPACING.xl,
  } as ViewStyle,
  sectionHeader: {
    fontFamily: FONTS.header,
    fontSize: 22,
    color: COLORS.cream,
    marginBottom: SPACING.md,
  } as TextStyle,
  sectionMeta: {
    fontFamily: FONTS.body,
    fontSize: 13,
    color: COLORS.creamDim,
    marginBottom: SPACING.md,
    lineHeight: 18,
  } as TextStyle,

  // Perk items
  perkItem: {
    flexDirection: 'row',
    marginBottom: SPACING.sm,
  } as ViewStyle,
  perkAccent: {
    width: 3,
    backgroundColor: COLORS.sage,
    borderRadius: 2,
    marginRight: SPACING.md,
    marginTop: 2,
    marginBottom: 2,
  } as ViewStyle,
  perkText: {
    fontFamily: FONTS.body,
    fontSize: 14,
    color: COLORS.cream,
    flex: 1,
    lineHeight: 20,
    paddingVertical: 2,
  } as TextStyle,

  // Lounge items
  loungeItem: {
    flexDirection: 'row',
    marginBottom: SPACING.sm,
  } as ViewStyle,
  loungeAccent: {
    width: 3,
    backgroundColor: COLORS.sage,
    borderRadius: 2,
    marginRight: SPACING.md,
    marginTop: 2,
    marginBottom: 2,
  } as ViewStyle,
  loungeText: {
    fontFamily: FONTS.body,
    fontSize: 14,
    color: COLORS.cream,
    flex: 1,
    lineHeight: 20,
    paddingVertical: 2,
  } as TextStyle,

  // Activity cards
  activityCard: {
    flexDirection: 'row',
    backgroundColor: CARD_BG,
    borderRadius: RADIUS.lg,
    marginBottom: MAGAZINE.cardGap,
    overflow: 'hidden',
  } as ViewStyle,
  activityBorderAccent: {
    width: 3,
    backgroundColor: COLORS.sage,
    borderTopLeftRadius: RADIUS.lg,
    borderBottomLeftRadius: RADIUS.lg,
  } as ViewStyle,
  activityCardInner: {
    flex: 1,
    padding: MAGAZINE.padding,
  } as ViewStyle,
  activityMeta: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 6,
  } as ViewStyle,
  activityCategory: {
    fontFamily: FONTS.mono,
    fontSize: 11,
    color: COLORS.creamDim,
    letterSpacing: 1,
  } as TextStyle,
  activityDuration: {
    fontFamily: FONTS.mono,
    fontSize: 12,
    color: COLORS.sage,
  } as TextStyle,
  activityTitle: {
    fontFamily: FONTS.header,
    fontSize: 20,
    color: COLORS.cream,
    marginBottom: SPACING.sm,
    lineHeight: 24,
  } as TextStyle,
  activityDesc: {
    fontFamily: FONTS.body,
    fontSize: 14,
    color: COLORS.creamSoft,
    lineHeight: 22,
    marginBottom: 12,
  } as TextStyle,
  tipContainer: {
    flexDirection: 'row',
  } as ViewStyle,
  tipAccent: {
    width: 3,
    backgroundColor: COLORS.sage,
    borderRadius: 2,
    marginRight: SPACING.sm,
  } as ViewStyle,
  tipText: {
    fontFamily: FONTS.body,
    fontSize: 13,
    color: COLORS.creamDim,
    flex: 1,
    lineHeight: 18,
  } as TextStyle,

  // Empty state
  emptyCard: {
    flexDirection: 'row',
    backgroundColor: CARD_BG,
    borderRadius: RADIUS.lg,
    marginTop: SPACING.xl,
    overflow: 'hidden',
  } as ViewStyle,
  emptyAccent: {
    width: 3,
    backgroundColor: COLORS.sage,
    borderTopLeftRadius: RADIUS.lg,
    borderBottomLeftRadius: RADIUS.lg,
  } as ViewStyle,
  emptyText: {
    fontFamily: FONTS.body,
    fontSize: 14,
    color: COLORS.creamMuted,
    lineHeight: 22,
    flex: 1,
    padding: MAGAZINE.padding,
  } as TextStyle,
});

export default LayoverScreen;
