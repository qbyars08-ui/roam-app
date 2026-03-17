// =============================================================================
// ROAM — Arrival Mode
// Your first 24 hours in a new city. The essential survival kit for when
// you just landed. Like a friend texting you tips the moment you touch down.
// =============================================================================
import React, { useEffect, useRef, useState } from 'react';
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
import { useLocalSearchParams, useRouter } from 'expo-router';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { LinearGradient } from 'expo-linear-gradient';
import { useTranslation } from 'react-i18next';
import * as Haptics from '../lib/haptics';
import { ChevronLeft } from 'lucide-react-native';
import { COLORS, FONTS, SPACING, RADIUS } from '../lib/constants';
import { useDestinationTheme } from '../lib/useDestinationTheme';
import { withComingSoon } from '../lib/with-coming-soon';
import { validateDestination } from '../lib/params-validator';

// =============================================================================
// Types
// =============================================================================
interface AirportTransfer {
  method: string;
  cost: string;
  time: string;
  tip: string;
}

interface ChecklistItem {
  id: string;
  text: string;
}

interface CityArrivalData {
  airportToCity: AirportTransfer;
  firstThing: string;
  simWifi: string;
  firstMeal: string;
  moneySituation: string;
  safetyHeadsUp: string[];
  checklist: ChecklistItem[];
}

// =============================================================================
// Section config — labels, icons (text-based), colors
// =============================================================================
const SECTION_KEYS = [
  { key: 'airportToCity', labelKey: 'arrival.airportToCity', defaultLabel: 'Airport to City', icon: 'plane', accent: COLORS.sage },
  { key: 'firstThing', labelKey: 'arrival.firstThing', defaultLabel: 'First Thing to Do', icon: 'pin', accent: COLORS.gold },
  { key: 'simWifi', labelKey: 'arrival.simWifi', defaultLabel: 'SIM / WiFi', icon: 'signal', accent: COLORS.sage },
  { key: 'firstMeal', labelKey: 'arrival.firstMeal', defaultLabel: 'First Meal', icon: 'fork', accent: COLORS.coral },
  { key: 'moneySituation', labelKey: 'arrival.moneySituation', defaultLabel: 'Money Situation', icon: 'cash', accent: COLORS.gold },
  { key: 'safetyHeadsUp', labelKey: 'arrival.safetyHeadsUp', defaultLabel: 'Safety Heads-Up', icon: 'shield', accent: COLORS.coral },
  { key: 'checklist', labelKey: 'arrival.checklist', defaultLabel: '24-Hour Checklist', icon: 'check', accent: COLORS.sage },
] as const;

// =============================================================================
// Hardcoded city data
// =============================================================================
const ARRIVAL_DATA: Record<string, CityArrivalData> = {
  Tokyo: {
    airportToCity: {
      method: 'Narita Express to Shinjuku',
      cost: '~3,250 yen (~$22)',
      time: '80 min',
      tip: 'Buy a Suica card at the airport — you\'ll use it everywhere. Trains, konbinis, vending machines. It\'s basically a second wallet.',
    },
    firstThing:
      'Walk to the nearest konbini (7-Eleven or Lawson), grab an onigiri and a Strong Zero, sit on a bench, and just watch Tokyo happen. Don\'t rush. Let the jet lag hit while the city wakes up around you.',
    simWifi:
      'Get a prepaid eSIM before you fly — Ubigi or Airalo both work great. Airport SIM counters are overpriced and the lines are brutal after a long flight.',
    firstMeal:
      'Ichiran Ramen — solo booth, no Japanese needed, open 24hrs. Order the extra-firm noodles with extra garlic. The 3am bowl hits different after 14hrs of flying.',
    moneySituation:
      'Japan is still surprisingly cash-heavy. Get cash at any 7-Eleven ATM (no fees with most international cards). Don\'t tip — ever. It\'s considered rude.',
    safetyHeadsUp: [
      'Japan is absurdly safe. Your biggest danger is missing the last train (around midnight). After that it\'s a $60+ taxi ride.',
      'Earthquakes happen. Check your hotel\'s evacuation route when you check in. It takes 10 seconds.',
      'Don\'t jaywalk. Seriously. Even at 3am with zero cars. Locals will stare.',
    ],
    checklist: [
      { id: 'tk-1', text: 'Get Suica/Pasmo card loaded at the airport' },
      { id: 'tk-2', text: 'Activate eSIM or pocket WiFi' },
      { id: 'tk-3', text: 'Pull cash from 7-Eleven ATM' },
      { id: 'tk-4', text: 'Eat something within 30 min of dropping bags' },
      { id: 'tk-5', text: 'Download Google Translate (Japanese offline pack)' },
      { id: 'tk-6', text: 'Walk your neighborhood for 20 min — find the closest konbini and train station' },
      { id: 'tk-7', text: 'Figure out the last train time from your nearest station' },
      { id: 'tk-8', text: 'Set tomorrow\'s alarm and actually sleep (fight the jet lag urge to stay up)' },
    ],
  },
  Bali: {
    airportToCity: {
      method: 'Pre-booked private driver to Ubud or Seminyak',
      cost: '~150,000-300,000 IDR (~$10-20)',
      time: '45 min to Seminyak, 90 min to Ubud',
      tip: 'Book through your hotel or use the official airport taxi counter. The guys outside arrivals will try to charge 3x. Don\'t negotiate at 2am — just book ahead.',
    },
    firstThing:
      'Find a warung (local restaurant) within walking distance and order nasi goreng and an iced Bintang. Sit down, breathe, remind yourself you\'re in Bali and there\'s literally nowhere to rush to.',
    simWifi:
      'Grab a Telkomsel SIM at the airport kiosk — it\'s cheap and has the best coverage. 25GB for about $5. Or get an Airalo eSIM before landing if your phone supports it.',
    firstMeal:
      'Any warung with plastic chairs and a crowd of locals outside. Order nasi campur (mixed rice plate) — you\'ll get rice, chicken, tempeh, sambal, and veggies for under $2. This is the real Bali.',
    moneySituation:
      'Cash is king outside tourist zones. ATMs are everywhere but use ones attached to banks (avoid standalone ones — skimmers are real). Cards work at nicer restaurants and shops. Don\'t exchange money at the airport — terrible rates.',
    safetyHeadsUp: [
      'Monkeys at Monkey Forest will steal your sunglasses, phone, anything shiny. Secure everything or leave it at the hotel.',
      'Renting a scooter? Get international insurance first. Bali traffic is no joke and hospitals will ask for payment upfront.',
      'The water is not drinkable. Brush your teeth with bottled water for the first few days until your stomach adjusts.',
    ],
    checklist: [
      { id: 'bl-1', text: 'Get a SIM card or activate eSIM' },
      { id: 'bl-2', text: 'Pull IDR from a bank-attached ATM' },
      { id: 'bl-3', text: 'Download Grab (ride-hailing) and GoFood (delivery)' },
      { id: 'bl-4', text: 'Eat at a warung — nasi goreng or nasi campur' },
      { id: 'bl-5', text: 'Buy bottled water (big jug for the room)' },
      { id: 'bl-6', text: 'Slather on sunscreen — equatorial sun is brutal' },
      { id: 'bl-7', text: 'Walk around your area and find the nearest minimart' },
    ],
  },
  Bangkok: {
    airportToCity: {
      method: 'Airport Rail Link to Phaya Thai, then BTS Skytrain',
      cost: '~45 THB (~$1.30)',
      time: '45 min total',
      tip: 'The Airport Rail Link is dirt cheap and faster than any taxi during rush hour. Get a Rabbit card (their transit card) at any BTS station. Avoid the "limousine" touts — they\'re just regular taxis with markup.',
    },
    firstThing:
      'Walk to the nearest street food stall and point at whatever looks good. Pad thai, mango sticky rice, grilled pork skewers — it doesn\'t matter. Just eat standing on the sidewalk and let Bangkok\'s chaos wash over you.',
    simWifi:
      'AIS or DTAC SIM at the airport — both have kiosks after customs. Tourist SIMs are cheap (about $10 for a week of unlimited data). AIS has slightly better coverage outside Bangkok.',
    firstMeal:
      'Any street stall with a wok and a line. If you need a name: look for pad kra pao (basil stir-fry with a fried egg on top). Ask for "pet nit noi" (a little spicy) unless you\'re ready to sweat.',
    moneySituation:
      'Use SuperRich exchange (green or orange) for the best rates — they\'re at the airport and all over the city. ATMs charge 220 THB per withdrawal, so pull larger amounts. Street food is cash only. Malls and restaurants take cards.',
    safetyHeadsUp: [
      'Tuk-tuks that approach YOU are scams. They\'ll take you to a gem shop or tailor instead of where you asked. Negotiate the price before getting in, or just use Grab.',
      'Download Grab (their Uber) immediately. It\'s safer, metered, and AC\'d. Game changer for Bangkok.',
      'Stay hydrated. Bangkok heat + humidity will drain you faster than you expect. Carry water everywhere and don\'t skip meals.',
    ],
    checklist: [
      { id: 'bk-1', text: 'Get a SIM card at the airport (AIS or DTAC)' },
      { id: 'bk-2', text: 'Exchange money at SuperRich (skip airport ATMs)' },
      { id: 'bk-3', text: 'Download Grab for taxis and food delivery' },
      { id: 'bk-4', text: 'Get a Rabbit card for BTS Skytrain' },
      { id: 'bk-5', text: 'Eat street food within an hour of arriving' },
      { id: 'bk-6', text: 'Buy electrolytes or coconut water — you\'ll need them' },
      { id: 'bk-7', text: 'Walk your neighborhood and find the nearest 7-Eleven (they\'re everywhere)' },
      { id: 'bk-8', text: 'Take a boat on the Chao Phraya River before sunset' },
    ],
  },
  Lisbon: {
    airportToCity: {
      method: 'Metro Red Line to city center',
      cost: '~1.70 EUR (~$1.85)',
      time: '25 min to Baixa-Chiado',
      tip: 'Buy a Viva Viagem card at the metro station (rechargeable transit card). The airport metro station is right in the terminal. Taxis are fine too — about 15 EUR to center with the meter on.',
    },
    firstThing:
      'Walk to the nearest miradouro (viewpoint) and just look at the city. Lisbon is built on seven hills and every viewpoint is free. Grab a pastel de nata on the way. Eat it warm.',
    simWifi:
      'Vodafone or NOS SIM at the airport or any phone shop. Tourist plans run about 15 EUR for 10GB. Portugal has great coverage. If your carrier does EU roaming, you might already be covered.',
    firstMeal:
      'Find a tasca (tiny local restaurant) and order bifana (pork sandwich) with a Super Bock beer. Total cost: about 5 EUR. Pasteis de Belem is worth the tourist line if you haven\'t had a proper pastel de nata before.',
    moneySituation:
      'Cards work almost everywhere in Lisbon. Contactless is standard. You\'ll rarely need cash, but keep some for small tascas and market stalls. ATMs (Multibanco) are everywhere — use ones attached to banks.',
    safetyHeadsUp: [
      'Pickpockets love Tram 28 and the Baixa area. Keep your phone in your front pocket and your bag in front of you. Standard European city stuff.',
      'Those steep cobblestone hills are no joke, especially in rain. Wear proper shoes — flip flops will betray you.',
      'Lisbon is very safe overall. Walk confidently at night and you\'ll be fine. Stick to lit streets in Alfama and Bairro Alto late at night.',
    ],
    checklist: [
      { id: 'lb-1', text: 'Get a Viva Viagem transit card at the airport metro' },
      { id: 'lb-2', text: 'Eat a pastel de nata within 60 min of landing' },
      { id: 'lb-3', text: 'Walk to the nearest miradouro for the view' },
      { id: 'lb-4', text: 'Download Bolt or FreeNow for cheap rides' },
      { id: 'lb-5', text: 'Find a tasca for bifana or petiscos (small plates)' },
      { id: 'lb-6', text: 'Walk Alfama\'s backstreets before it gets crowded' },
      { id: 'lb-7', text: 'Grab a Super Bock and sit by the Tagus at sunset' },
    ],
  },
  'Mexico City': {
    airportToCity: {
      method: 'Uber or Didi from Terminal 1 or 2',
      cost: '~150-250 MXN (~$8-14)',
      time: '30-60 min depending on traffic',
      tip: 'Use the official airport taxi stand or Uber/Didi. Don\'t take random taxis outside. Traffic can be insane so plan accordingly — Reforma corridor at rush hour is a parking lot.',
    },
    firstThing:
      'Walk to the nearest taco stand and order al pastor tacos. Eat them standing up at the counter with the squeeze bottle of salsa verde. This is the correct way to arrive in Mexico City.',
    simWifi:
      'Get a Telcel SIM at the airport OXXO or Telcel kiosk. Prepaid plans with data are cheap — about 200 MXN ($11) for a month of decent data. Top up at any OXXO convenience store.',
    firstMeal:
      'Tacos al pastor from any taqueria with a trompo (vertical spit) spinning out front. Look for a crowd of locals. El Vilsito in Narvarte is famously a car mechanic shop by day and taqueria by night — it\'s worth the trip.',
    moneySituation:
      'Mexico City is increasingly card-friendly, but street food and markets are cash. Pull pesos from ATMs inside banks (Citibanamex, BBVA). The exchange rate is good. Tipping 10-15% at sit-down restaurants is standard.',
    safetyHeadsUp: [
      'Use Uber or Didi, not street taxis. This is the single most important safety tip for CDMX. Seriously.',
      'Keep your phone out of sight on the metro during rush hour. Crowded trains attract pickpockets. The metro itself is fine — just stay aware.',
      'Stick to Roma, Condesa, Polanco, Coyoacan, and Centro Historico. These neighborhoods are very walkable and safe during the day. Use rides at night.',
    ],
    checklist: [
      { id: 'mx-1', text: 'Get a Telcel SIM or activate eSIM' },
      { id: 'mx-2', text: 'Pull pesos from a bank ATM (inside the branch)' },
      { id: 'mx-3', text: 'Download Uber and Didi' },
      { id: 'mx-4', text: 'Eat al pastor tacos from a street taqueria' },
      { id: 'mx-5', text: 'Walk your colonia (neighborhood) and find the nearest OXXO' },
      { id: 'mx-6', text: 'Get a fresh jugo verde from a juice stand' },
      { id: 'mx-7', text: 'Drink only bottled or purified water' },
      { id: 'mx-8', text: 'Visit a market — Mercado Roma or Mercado de Coyoacan' },
    ],
  },
};

// =============================================================================
// Icon component (text-based, no external icon lib)
// =============================================================================
function SectionIcon({ icon, color }: { icon: string; color: string }) {
  const iconMap: Record<string, string> = {
    plane: '\u2708',
    pin: '\u272A',
    signal: '\u25CE',
    fork: '\u2726',
    cash: '\u25C8',
    shield: '\u25B2',
    check: '\u2713',
  };
  return (
    <View style={[styles.iconCircle, { backgroundColor: color + '20' }]}>
      <Text style={[styles.iconText, { color }]}>{iconMap[icon] || '\u2022'}</Text>
    </View>
  );
}

// =============================================================================
// Main component
// =============================================================================
function ArrivalModeScreen() {
  const { t } = useTranslation();
  const params = useLocalSearchParams<{ destination: string }>();
  const router = useRouter();
  const insets = useSafeAreaInsets();
  const city = validateDestination(params.destination) ?? 'Unknown';
  const data = ARRIVAL_DATA[city];
  const destTheme = useDestinationTheme(city);

  // Checklist local state
  const [checkedItems, setCheckedItems] = useState<Record<string, boolean>>({});

  // Stagger animation refs
  const fadeAnims = useRef(SECTION_KEYS.map(() => new Animated.Value(0))).current;
  const slideAnims = useRef(SECTION_KEYS.map(() => new Animated.Value(30))).current;
  const headerFade = useRef(new Animated.Value(0)).current;
  const headerSlide = useRef(new Animated.Value(-20)).current;

  useEffect(() => {
    // Header animation
    Animated.parallel([
      Animated.timing(headerFade, {
        toValue: 1,
        duration: 500,
        useNativeDriver: true,
      }),
      Animated.timing(headerSlide, {
        toValue: 0,
        duration: 500,
        useNativeDriver: true,
      }),
    ]).start();

    // Stagger card animations
    const animations = SECTION_KEYS.map((_, i) =>
      Animated.parallel([
        Animated.timing(fadeAnims[i], {
          toValue: 1,
          duration: 450,
          delay: 200 + i * 100,
          useNativeDriver: true,
        }),
        Animated.timing(slideAnims[i], {
          toValue: 0,
          duration: 450,
          delay: 200 + i * 100,
          useNativeDriver: true,
        }),
      ])
    );
    Animated.stagger(0, animations).start();
  }, [fadeAnims, headerFade, headerSlide, slideAnims]);

  const toggleCheck = (id: string) => {
    Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
    setCheckedItems((prev) => ({ ...prev, [id]: !prev[id] }));
  };

  // =========================================================================
  // Fallback for unknown destinations
  // =========================================================================
  if (!data) {
    return (
      <View style={[styles.container, { paddingTop: insets.top }]}>
        <LinearGradient
          colors={[COLORS.bg, COLORS.gradientForestDark, COLORS.bg]}
          style={StyleSheet.absoluteFill}
        />
        <Pressable
          style={styles.backButton}
          onPress={() => {
            Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
            router.back();
          }}
        >
          <ChevronLeft size={24} color={COLORS.cream} />
        </Pressable>
        <View style={styles.fallbackContainer}>
          <Text style={styles.fallbackTitle}>{t('arrival.fallbackTitle', { defaultValue: 'Packing your {{city}} survival kit...', city })}</Text>
          <Text style={styles.fallbackSubtitle}>
            {t('arrival.fallbackSubtitle', { defaultValue: "We're pulling together everything you need for your first 24 hours. Almost there." })}
          </Text>
        </View>
      </View>
    );
  }

  // =========================================================================
  // Render helpers
  // =========================================================================
  const renderAirportCard = () => {
    const { method, cost, time, tip } = data.airportToCity;
    return (
      <View>
        <View style={styles.transportRow}>
          <View style={styles.transportPill}>
            <Text style={styles.transportLabel}>{t('arrival.bestRoute', { defaultValue: 'Best route' })}</Text>
            <Text style={styles.transportValue}>{method}</Text>
          </View>
        </View>
        <View style={styles.transportStats}>
          <View style={styles.statBlock}>
            <Text style={styles.statLabel}>{t('arrival.cost', { defaultValue: 'Cost' })}</Text>
            <Text style={styles.statValue}>{cost}</Text>
          </View>
          <View style={styles.statDivider} />
          <View style={styles.statBlock}>
            <Text style={styles.statLabel}>{t('arrival.time', { defaultValue: 'Time' })}</Text>
            <Text style={styles.statValue}>{time}</Text>
          </View>
        </View>
        <Text style={styles.tipText}>{tip}</Text>
      </View>
    );
  };

  const renderSafetyCard = () => (
    <View>
      {data.safetyHeadsUp.map((item, i) => (
        <View key={i} style={styles.safetyItem}>
          <View style={[styles.safetyBullet, { backgroundColor: COLORS.coralLight }]}>
            <Text style={[styles.safetyBulletText, { color: COLORS.coral }]}>{i + 1}</Text>
          </View>
          <Text style={styles.safetyText}>{item}</Text>
        </View>
      ))}
    </View>
  );

  const renderChecklist = () => {
    const completed = data.checklist.filter((item) => checkedItems[item.id]).length;
    return (
      <View>
        <View style={styles.progressRow}>
          <View style={styles.progressBarBg}>
            <View
              style={[
                styles.progressBarFill,
                { width: `${(completed / data.checklist.length) * 100}%` },
              ]}
            />
          </View>
          <Text style={styles.progressText}>
            {completed}/{data.checklist.length}
          </Text>
        </View>
        {data.checklist.map((item) => (
          <Pressable
            key={item.id}
            style={styles.checklistItem}
            onPress={() => toggleCheck(item.id)}
          >
            <View
              style={[
                styles.checkbox,
                checkedItems[item.id] && styles.checkboxChecked,
              ]}
            >
              {checkedItems[item.id] && (
                <Text style={styles.checkmark}>{'\u2713'}</Text>
              )}
            </View>
            <Text
              style={[
                styles.checklistText,
                checkedItems[item.id] && styles.checklistTextDone,
              ]}
            >
              {item.text}
            </Text>
          </Pressable>
        ))}
      </View>
    );
  };

  const renderSectionContent = (key: string) => {
    switch (key) {
      case 'airportToCity':
        return renderAirportCard();
      case 'firstThing':
        return <Text style={styles.bodyText}>{data.firstThing}</Text>;
      case 'simWifi':
        return <Text style={styles.bodyText}>{data.simWifi}</Text>;
      case 'firstMeal':
        return <Text style={styles.bodyText}>{data.firstMeal}</Text>;
      case 'moneySituation':
        return <Text style={styles.bodyText}>{data.moneySituation}</Text>;
      case 'safetyHeadsUp':
        return renderSafetyCard();
      case 'checklist':
        return renderChecklist();
      default:
        return null;
    }
  };

  // =========================================================================
  // Main render
  // =========================================================================
  return (
    <View style={[styles.container, { paddingTop: insets.top }]}>
      <LinearGradient
        colors={[COLORS.bg, COLORS.gradientForestDark, COLORS.bg]}
        style={StyleSheet.absoluteFill}
      />

      {/* Back button */}
      <Pressable
        style={styles.backButton}
        onPress={() => {
          Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
          router.back();
        }}
      >
        <ChevronLeft size={24} color={COLORS.cream} />
      </Pressable>

      <ScrollView
        contentContainerStyle={[styles.scrollContent, { paddingBottom: insets.bottom + SPACING.xl }]}
        showsVerticalScrollIndicator={false}
      >
        {/* Header */}
        <Animated.View
          style={[
            styles.headerBlock,
            { opacity: headerFade, transform: [{ translateY: headerSlide }] },
          ]}
        >
          <Text style={[styles.headerLabel, { color: destTheme.primary }]}>{t('arrival.headerLabel', { defaultValue: '· Arrival mode' })}</Text>
          <Text style={styles.headerCity}>{city}</Text>
          <Text style={styles.headerSub}>
            {t('arrival.headerSub', { defaultValue: "Your first 24 hours. Everything you need, nothing you don't." })}
          </Text>
        </Animated.View>

        {/* Section cards */}
        {SECTION_KEYS.map((section, index) => (
          <Animated.View
            key={section.key}
            style={[
              styles.card,
              {
                opacity: fadeAnims[index],
                transform: [{ translateY: slideAnims[index] }],
              },
            ]}
          >
            <LinearGradient
              colors={[COLORS.bgGlass, COLORS.whiteFaint]}
              style={styles.cardGradient}
            >
              {/* Card header */}
              <View style={styles.cardHeader}>
                <View style={styles.stepBadge}>
                  <Text style={styles.stepNumber}>{index + 1}</Text>
                </View>
                <SectionIcon icon={section.icon} color={section.accent} />
                <Text style={styles.cardTitle}>{t(section.labelKey, { defaultValue: section.defaultLabel })}</Text>
              </View>

              {/* Card content */}
              <View style={styles.cardBody}>
                {renderSectionContent(section.key)}
              </View>
            </LinearGradient>
          </Animated.View>
        ))}
      </ScrollView>
    </View>
  );
}

// =============================================================================
// Styles
// =============================================================================
const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: COLORS.bg,
  } as ViewStyle,
  scrollContent: {
    paddingHorizontal: SPACING.lg,
    paddingTop: SPACING.md,
  } as ViewStyle,

  // Back button
  backButton: {
    position: 'absolute',
    top: 58,
    left: SPACING.lg,
    zIndex: 10,
    width: 40,
    height: 40,
    borderRadius: RADIUS.full,
    backgroundColor: COLORS.bgGlass,
    borderWidth: 1,
    borderColor: COLORS.border,
    alignItems: 'center',
    justifyContent: 'center',
  } as ViewStyle,

  // Header
  headerBlock: {
    marginTop: SPACING.xxl + SPACING.sm,
    marginBottom: SPACING.xl,
  } as ViewStyle,
  headerLabel: {
    fontFamily: FONTS.body,
    fontSize: 13,
    color: COLORS.creamSoft,
    marginBottom: SPACING.xs,
  } as TextStyle,
  headerCity: {
    fontFamily: FONTS.header,
    fontSize: 42,
    color: COLORS.cream,
    lineHeight: 48,
    marginBottom: SPACING.sm,
  } as TextStyle,
  headerSub: {
    fontFamily: FONTS.body,
    fontSize: 15,
    color: COLORS.creamMuted,
    lineHeight: 22,
  } as TextStyle,

  // Cards
  card: {
    marginBottom: SPACING.md,
    borderRadius: RADIUS.lg,
    overflow: 'hidden',
    borderWidth: 1,
    borderColor: COLORS.border,
  } as ViewStyle,
  cardGradient: {
    padding: SPACING.lg,
  } as ViewStyle,
  cardHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: SPACING.md,
  } as ViewStyle,
  stepBadge: {
    width: 22,
    height: 22,
    borderRadius: RADIUS.full,
    backgroundColor: COLORS.sageMuted,
    alignItems: 'center',
    justifyContent: 'center',
    marginRight: SPACING.sm,
  } as ViewStyle,
  stepNumber: {
    fontFamily: FONTS.monoMedium,
    fontSize: 11,
    color: COLORS.sage,
  } as TextStyle,
  cardTitle: {
    fontFamily: FONTS.bodySemiBold,
    fontSize: 16,
    color: COLORS.cream,
    flex: 1,
  } as TextStyle,
  cardBody: {
    marginLeft: 0,
  } as ViewStyle,

  // Icon
  iconCircle: {
    width: 28,
    height: 28,
    borderRadius: RADIUS.full,
    alignItems: 'center',
    justifyContent: 'center',
    marginRight: SPACING.sm,
  } as ViewStyle,
  iconText: {
    fontSize: 14,
  } as TextStyle,

  // Body text
  bodyText: {
    fontFamily: FONTS.body,
    fontSize: 14,
    color: COLORS.creamMuted,
    lineHeight: 22,
  } as TextStyle,

  // Airport card
  transportRow: {
    marginBottom: SPACING.md,
  } as ViewStyle,
  transportPill: {
    backgroundColor: COLORS.sageSubtle,
    borderRadius: RADIUS.md,
    padding: SPACING.md,
    borderWidth: 1,
    borderColor: COLORS.sageMuted,
  } as ViewStyle,
  transportLabel: {
    fontFamily: FONTS.mono,
    fontSize: 10,
    color: COLORS.sage,
    letterSpacing: 2,
    textTransform: 'uppercase',
    marginBottom: SPACING.xs,
  } as TextStyle,
  transportValue: {
    fontFamily: FONTS.bodySemiBold,
    fontSize: 15,
    color: COLORS.cream,
  } as TextStyle,
  transportStats: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: SPACING.md,
  } as ViewStyle,
  statBlock: {
    flex: 1,
  } as ViewStyle,
  statLabel: {
    fontFamily: FONTS.mono,
    fontSize: 10,
    color: COLORS.creamMuted,
    letterSpacing: 1.5,
    textTransform: 'uppercase',
    marginBottom: 2,
  } as TextStyle,
  statValue: {
    fontFamily: FONTS.bodyMedium,
    fontSize: 15,
    color: COLORS.gold,
  } as TextStyle,
  statDivider: {
    width: 1,
    height: 28,
    backgroundColor: COLORS.border,
    marginHorizontal: SPACING.md,
  } as ViewStyle,
  tipText: {
    fontFamily: FONTS.body,
    fontSize: 13,
    color: COLORS.creamMuted,
    lineHeight: 20,
  } as TextStyle,

  // Safety
  safetyItem: {
    flexDirection: 'row',
    marginBottom: SPACING.md,
  } as ViewStyle,
  safetyBullet: {
    width: 24,
    height: 24,
    borderRadius: RADIUS.full,
    alignItems: 'center',
    justifyContent: 'center',
    marginRight: SPACING.sm,
    marginTop: 1,
  } as ViewStyle,
  safetyBulletText: {
    fontFamily: FONTS.monoMedium,
    fontSize: 11,
  } as TextStyle,
  safetyText: {
    fontFamily: FONTS.body,
    fontSize: 14,
    color: COLORS.creamMuted,
    lineHeight: 22,
    flex: 1,
  } as TextStyle,

  // Checklist
  progressRow: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: SPACING.md,
  } as ViewStyle,
  progressBarBg: {
    flex: 1,
    height: 4,
    backgroundColor: COLORS.border,
    borderRadius: RADIUS.full,
    overflow: 'hidden',
    marginRight: SPACING.sm,
  } as ViewStyle,
  progressBarFill: {
    height: '100%',
    backgroundColor: COLORS.sage,
    borderRadius: RADIUS.full,
  } as ViewStyle,
  progressText: {
    fontFamily: FONTS.mono,
    fontSize: 12,
    color: COLORS.sage,
  } as TextStyle,
  checklistItem: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingVertical: SPACING.sm + 2,
    borderBottomWidth: 1,
    borderBottomColor: COLORS.border,
  } as ViewStyle,
  checkbox: {
    width: 22,
    height: 22,
    borderRadius: RADIUS.sm,
    borderWidth: 1.5,
    borderColor: COLORS.sageStrong,
    alignItems: 'center',
    justifyContent: 'center',
    marginRight: SPACING.sm + 4,
  } as ViewStyle,
  checkboxChecked: {
    backgroundColor: COLORS.sageLight,
    borderColor: COLORS.sage,
  } as ViewStyle,
  checkmark: {
    fontSize: 13,
    color: COLORS.sage,
    fontWeight: '700',
  } as TextStyle,
  checklistText: {
    fontFamily: FONTS.body,
    fontSize: 14,
    color: COLORS.creamMuted,
    flex: 1,
    lineHeight: 20,
  } as TextStyle,
  checklistTextDone: {
    textDecorationLine: 'line-through',
    color: COLORS.sageMedium,
  } as TextStyle,

  // Fallback
  fallbackContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    paddingHorizontal: SPACING.xl,
  } as ViewStyle,
  fallbackTitle: {
    fontFamily: FONTS.header,
    fontSize: 28,
    color: COLORS.cream,
    textAlign: 'center',
    marginBottom: SPACING.md,
  } as TextStyle,
  fallbackSubtitle: {
    fontFamily: FONTS.body,
    fontSize: 15,
    color: COLORS.creamMuted,
    textAlign: 'center',
    lineHeight: 22,
  } as TextStyle,
});

export default withComingSoon(ArrivalModeScreen, { routeName: 'arrival-mode', title: 'Arrival Mode' });
