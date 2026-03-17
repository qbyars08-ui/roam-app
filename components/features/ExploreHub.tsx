// =============================================================================
// ROAM — ExploreHub
// 2-column glass card grid of all features, navigable from Profile or Home
// =============================================================================
import React, { useCallback } from 'react';
import { useTranslation } from 'react-i18next';
import {
  View,
  Text,
  ScrollView,
  Pressable,
  StyleSheet,
  Dimensions,
  type ViewStyle,
  type TextStyle,
} from 'react-native';
import * as Haptics from '../../lib/haptics';
import { useRouter } from 'expo-router';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { MessageSquare, Shield, Plane, Globe, BookOpen, PawPrint, Users, Search, FlaskConical, Image, Wallet, Flag, Star, Map, Receipt, User, Gift, Shuffle, Clock, Building2, Heart, UserPlus, Languages, Repeat, Lock, UtensilsCrossed } from 'lucide-react-native';
import { COLORS, FONTS, SPACING, RADIUS } from '../../lib/constants';
import { useProGate } from '../../lib/pro-gate';
import { useAppStore } from '../../lib/store';

// ---------------------------------------------------------------------------
// Feature definitions — 5 visible & functional; rest show "Coming Soon"
// ---------------------------------------------------------------------------
const LIVE_FEATURE_IDS = [
  'budget-guardian', 'flights', 'stays', 'food', 'language-survival', 'prep', 'group-trips',
  'compatibility', 'expense-tracker', 'trip-countdown', 'trip-story', 'trip-album',
  'passport', 'trip-wrapped', 'chaos-mode', 'travel-card', 'trip-journal', 'body-intel', 'before-you-land', 'emergency-card',
  'pets', 'alter-ego', 'globe', 'dream-vault', 'arrival-mode', 'dupe-finder', 'anti-itinerary',
  'chaos-dare', 'honest-reviews', 'visited-map', 'airport-guide', 'memory-lane',
] as const;
const ICON_MAP = {
  MessageSquare,
  Shield,
  Plane,
  Globe,
  BookOpen,
  PawPrint,
  Users,
  Search,
  FlaskConical,
  Image,
  Wallet,
  Flag,
  Star,
  Map,
  Receipt,
  User,
  Gift,
  Shuffle,
  Clock,
  Building2,
  Heart,
  UserPlus,
  Languages,
  Repeat,
  UtensilsCrossed,
} as const;

type Feature = {
  id: string;
  icon: keyof typeof ICON_MAP;
  name: string;
  description: string;
  route: string;
  pro?: boolean;
};

const FEATURES: Feature[] = [
  { id: 'body-intel', icon: 'Shield', name: 'Body Intel', description: 'Destination-aware health intelligence', route: '/body-intel' },
  { id: 'before-you-land', icon: 'Plane', name: 'Before You Land', description: '24-hour pre-departure briefing', route: '/before-you-land' },
  { id: 'emergency-card', icon: 'Heart', name: 'Emergency Card', description: 'Medical card in any language', route: '/emergency-card' },
  { id: 'travel-card', icon: 'Star', name: 'Travel Card', description: 'Shareable personality card for socials', route: '/travel-card' },
  { id: 'trip-journal', icon: 'BookOpen', name: 'Trip Journal', description: 'Daily diary with mood + highlights', route: '/trip-journal' },
  { id: 'compatibility', icon: 'Heart', name: 'Compatibility', description: 'Travel soulmate quiz — share results', route: '/compatibility' },
  { id: 'expense-tracker', icon: 'Wallet', name: 'Expense Tracker', description: 'Track spending vs AI estimate', route: '/expense-tracker' },
  { id: 'trip-countdown', icon: 'Clock', name: 'Trip Countdown', description: 'Live timer + daily travel tips', route: '/trip-countdown' },
  { id: 'trip-story', icon: 'Image', name: 'Trip Stories', description: 'Cinematic auto-advancing stories', route: '/trip-story' },
  { id: 'trip-album', icon: 'Image', name: 'Photo Albums', description: 'Trip photo journal & gallery', route: '/trip-album' },
  { id: 'chat', icon: 'MessageSquare', name: 'Ask AI', description: 'Chat with your travel assistant', route: '/(tabs)/generate' },
  { id: 'prep', icon: 'Shield', name: 'Trip Prep', description: 'Packing lists, visas & essentials', route: '/(tabs)/prep' },
  { id: 'flights', icon: 'Plane', name: 'Flights', description: 'Search Skyscanner for best prices', route: '/(tabs)/flights' },
  { id: 'stays', icon: 'Building2', name: 'Stays', description: 'Find hotels on Booking.com', route: '/(tabs)/stays' },
  { id: 'food', icon: 'UtensilsCrossed', name: 'Food', description: 'AI-curated spots, open in Google Maps', route: '/(tabs)/food' },
  { id: 'globe', icon: 'Globe', name: 'Globe', description: 'Explore the interactive map', route: '/globe' },
  { id: 'passport', icon: 'BookOpen', name: 'Passport', description: 'Visa info & travel documents', route: '/passport' },
  { id: 'pets', icon: 'PawPrint', name: 'Pet Travel', description: 'Plan trips with your pet', route: '/pets' },
  { id: 'travel-twin', icon: 'Users', name: 'Travel Twin', description: 'Find your travel style match', route: '/travel-twin', pro: true },
  { id: 'roam-for-dates', icon: 'Heart', name: 'ROAM for Dates', description: 'Couples planner — merge your travel styles', route: '/roam-for-dates' },
  { id: 'trip-trading', icon: 'Repeat', name: 'Trip Trading', description: 'Swap itineraries, claim others\' trips', route: '/trip-trading' },
  { id: 'local-lens', icon: 'Search', name: 'Local Lens', description: 'See destinations like a local', route: '/local-lens' },
  { id: 'group-trips', icon: 'Users', name: 'Group Trips', description: 'Plan with friends — vote, chat, split costs', route: '/create-group' },
  { id: 'trip-chemistry', icon: 'FlaskConical', name: 'Trip Chemistry', description: 'Group travel compatibility', route: '/trip-chemistry', pro: true },
  { id: 'memory-lane', icon: 'Image', name: 'Memory Lane', description: 'Relive your past adventures', route: '/memory-lane', pro: true },
  { id: 'budget-guardian', icon: 'Wallet', name: 'Budget Guardian', description: 'Track spending & get alerts', route: '/budget-guardian' },
  { id: 'arrival-mode', icon: 'Flag', name: 'Arrival Mode', description: 'First-day city survival guide', route: '/arrival-mode' },
  { id: 'honest-reviews', icon: 'Star', name: 'Honest Reviews', description: 'Real traveler feedback', route: '/honest-reviews' },
  { id: 'visited-map', icon: 'Map', name: 'Visited Map', description: 'Track where you\'ve been', route: '/visited-map' },
  { id: 'receipt', icon: 'Receipt', name: 'The Receipt', description: 'See your trip cost breakdown', route: '/trip-receipt' },
  { id: 'dupe-finder', icon: 'Search', name: 'Dupe Finder', description: 'Find cheaper alternatives', route: '/dupe-finder' },
  { id: 'main-character', icon: 'User', name: 'Main Character', description: 'Your trip as a story', route: '/main-character' },
  { id: 'trip-wrapped', icon: 'Gift', name: 'Trip Wrapped', description: 'Your year in travel', route: '/trip-wrapped' },
  { id: 'chaos-mode', icon: 'Shuffle', name: 'Chaos Mode', description: 'ROAM picks everything', route: '/chaos-mode' },
  { id: 'layover', icon: 'Clock', name: 'Layover Optimizer', description: 'What to do with X hours in a city', route: '/layover' },
  { id: 'airport-guide', icon: 'Building2', name: 'Airport Survival', description: 'Food, lounges, security at major hubs', route: '/airport-guide' },
  { id: 'dream-vault', icon: 'Heart', name: 'Dream Trip Vault', description: 'Saved destinations & price alerts', route: '/dream-vault' },
  { id: 'people-met', icon: 'UserPlus', name: "People You've Met", description: 'Contacts from your travels', route: '/people-met' },
  { id: 'language-survival', icon: 'Languages', name: 'Language Survival', description: '50 phrases, tap to hear, 10 cities', route: '/language-survival' },
  { id: 'travel-time-machine', icon: 'Clock', name: 'Travel Time Machine', description: 'Tokyo 2019 vs now — AI comparison', route: '/travel-time-machine' },
  { id: 'trip-collections', icon: 'Map', name: 'Trip Collections', description: 'Curated lists by vibe', route: '/trip-collections' },
  { id: 'anti-itinerary', icon: 'Shuffle', name: 'Anti-itinerary', description: 'One decision at a time, spontaneous', route: '/anti-itinerary' },
];

const { width: SCREEN_WIDTH } = Dimensions.get('window');
const COLUMN_GAP = SPACING.md;
const CARD_WIDTH = (SCREEN_WIDTH - SPACING.lg * 2 - COLUMN_GAP) / 2;

// ---------------------------------------------------------------------------
// ExploreHub component
// ---------------------------------------------------------------------------
type ExploreHubProps = {
  /** If true, renders as a full screen with header and safe area. Otherwise inline. */
  standalone?: boolean;
};

export default function ExploreHub({ standalone = false }: ExploreHubProps) {
  const { t } = useTranslation();
  const router = useRouter();
  const insets = useSafeAreaInsets();
  const { canAccess: canAccessPro } = useProGate('travel-twin');
  const isPro = useAppStore((s) => s.isPro);

  const handlePress = useCallback(
    (feature: Feature) => {
      const isLive = (LIVE_FEATURE_IDS as readonly string[]).includes(feature.id);
      if (!isLive) return;
      Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
      if (feature.pro && !canAccessPro) {
        router.push({ pathname: '/paywall', params: { reason: 'feature', feature: feature.name } });
        return;
      }
      router.push(feature.route as import('expo-router').Href);
    },
    [router, canAccessPro]
  );

  const content = (
    <View style={styles.grid}>
      {FEATURES.map((feature) => {
        const isLive = (LIVE_FEATURE_IDS as readonly string[]).includes(feature.id);
        const isProGated = feature.pro && !isPro;
        return (
          <Pressable
            key={feature.id}
            style={({ pressed }) => [
              styles.card,
              isProGated && styles.cardProGated,
              { opacity: pressed ? 0.8 : 1, transform: [{ scale: pressed ? 0.97 : 1 }] },
            ]}
            onPress={() => handlePress(feature)}
          >
            {isProGated ? (
              <View style={styles.proBadge}>
                <Lock size={8} color={COLORS.gold} strokeWidth={1.5} />
                <Text style={styles.proBadgeText}>PRO</Text>
              </View>
            ) : !isLive ? (
              <View style={styles.comingSoonBadge}>
                <Text style={styles.comingSoonBadgeText}>{t('explore.comingSoon', { defaultValue: 'COMING SOON' })}</Text>
              </View>
            ) : null}
            {(() => {
              const IconComponent = ICON_MAP[feature.icon];
              return IconComponent ? (
                <View style={styles.cardIcon}>
                  <IconComponent
                    size={24}
                    color={isProGated ? COLORS.gold : isLive ? COLORS.accentGold : COLORS.creamMuted}
                    strokeWidth={1.5}
                  />
                </View>
              ) : null;
            })()}
            <Text style={[styles.cardName, !isLive && !isProGated && styles.cardNameMuted]}>{feature.name}</Text>
            <Text style={styles.cardDesc} numberOfLines={2}>
              {feature.description}
            </Text>
          </Pressable>
        );
      })}
    </View>
  );

  if (standalone) {
    return (
      <View style={[styles.container, { paddingTop: insets.top }]}>
        <ScrollView
          contentContainerStyle={styles.scrollContent}
          showsVerticalScrollIndicator={false}
        >
          <Text style={styles.headerTitle}>{t('explore.title', { defaultValue: 'Explore' })}</Text>
          <Text style={styles.headerSubtitle}>{t('explore.subtitle', { defaultValue: 'All your travel tools in one place' })}</Text>
          {content}
        </ScrollView>
      </View>
    );
  }

  return content;
}

// ---------------------------------------------------------------------------
// Compact horizontal row variant for the Home screen
// ---------------------------------------------------------------------------
export function FeatureQuickAccess() {
  const { t } = useTranslation();
  const router = useRouter();

  // Subset of features to show on home — the most useful quick-access items
  const QUICK_FEATURES = FEATURES.slice(0, 8);

  /* eslint-disable react-hooks/preserve-manual-memoization */
  const handlePress = useCallback(
    (feature: Feature) => {
      Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
      router.push(feature.route as import('expo-router').Href);
    },
    [router]
  );
  /* eslint-enable react-hooks/preserve-manual-memoization */

  return (
    <View style={quickStyles.section}>
      <View style={quickStyles.header}>
        <Text style={quickStyles.title}>{t('explore.features', { defaultValue: 'Features' })}</Text>
        <Pressable
          onPress={() => {
            Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
            router.push('/profile');
          }}
          style={({ pressed }) => [{ opacity: pressed ? 0.6 : 1 }]}
        >
          <Text style={quickStyles.seeAll}>{t('explore.seeAll', { defaultValue: 'See all' })}</Text>
        </Pressable>
      </View>
      <ScrollView
        horizontal
        showsHorizontalScrollIndicator={false}
        contentContainerStyle={quickStyles.row}
      >
        {QUICK_FEATURES.map((feature) => (
          <Pressable
            key={feature.id}
            style={({ pressed }) => [
              quickStyles.card,
              { opacity: pressed ? 0.8 : 1, transform: [{ scale: pressed ? 0.96 : 1 }] },
            ]}
            onPress={() => handlePress(feature)}
          >
            {(() => {
              const IconComponent = ICON_MAP[feature.icon];
              return IconComponent ? (
                <View style={quickStyles.cardIcon}>
                  <IconComponent size={22} color={COLORS.accentGold} strokeWidth={1.5} />
                </View>
              ) : null;
            })()}
            <Text style={quickStyles.cardName} numberOfLines={1}>
              {feature.name}
            </Text>
          </Pressable>
        ))}
      </ScrollView>
    </View>
  );
}

// ---------------------------------------------------------------------------
// Styles — full grid
// ---------------------------------------------------------------------------
const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: COLORS.bg,
  } as ViewStyle,
  scrollContent: {
    paddingHorizontal: SPACING.lg,
    paddingBottom: SPACING.xxxl,
  } as ViewStyle,
  headerTitle: {
    fontFamily: FONTS.header,
    fontSize: 28,
    color: COLORS.cream,
    paddingTop: SPACING.lg,
  } as TextStyle,
  headerSubtitle: {
    fontFamily: FONTS.body,
    fontSize: 14,
    color: COLORS.cream,
    opacity: 0.5,
    marginTop: SPACING.xs,
    marginBottom: SPACING.xl,
  } as TextStyle,
  grid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: COLUMN_GAP,
  } as ViewStyle,
  card: {
    width: CARD_WIDTH,
    position: 'relative',
    overflow: 'hidden',
    backgroundColor: COLORS.bgGlass,
    borderRadius: RADIUS.lg,
    borderWidth: 1,
    borderColor: COLORS.border,
    padding: SPACING.lg,
    gap: SPACING.xs,
  } as ViewStyle,
  cardProGated: {
    borderColor: COLORS.goldBorder,
  } as ViewStyle,
  proBadge: {
    position: 'absolute',
    top: SPACING.sm,
    right: SPACING.sm,
    flexDirection: 'row',
    alignItems: 'center',
    gap: 3,
    backgroundColor: COLORS.goldMutedLight,
    paddingHorizontal: SPACING.xs + 2,
    paddingVertical: 2,
    borderRadius: RADIUS.full,
    borderWidth: 1,
    borderColor: COLORS.goldBorderStrong,
    zIndex: 1,
  } as ViewStyle,
  proBadgeText: {
    fontFamily: FONTS.mono,
    fontSize: 9,
    letterSpacing: 1,
    color: COLORS.gold,
  } as TextStyle,
  comingSoonBadge: {
    position: 'absolute',
    top: SPACING.sm,
    right: SPACING.sm,
    backgroundColor: COLORS.sageLight,
    paddingHorizontal: SPACING.xs + 2,
    paddingVertical: 2,
    borderRadius: RADIUS.full,
    zIndex: 1,
  } as ViewStyle,
  comingSoonBadgeText: {
    fontFamily: FONTS.mono,
    fontSize: 9,
    letterSpacing: 1,
    color: COLORS.sage,
  } as TextStyle,
  cardNameMuted: {
    opacity: 0.6,
  } as TextStyle,
  cardIcon: {
    marginBottom: SPACING.xs,
  } as ViewStyle,
  cardName: {
    fontFamily: FONTS.bodyMedium,
    fontSize: 15,
    color: COLORS.cream,
  } as TextStyle,
  cardDesc: {
    fontFamily: FONTS.body,
    fontSize: 12,
    color: COLORS.cream,
    opacity: 0.5,
    lineHeight: 17,
  } as TextStyle,
});

// ---------------------------------------------------------------------------
// Styles — compact horizontal row
// ---------------------------------------------------------------------------
const quickStyles = StyleSheet.create({
  section: {
    marginTop: SPACING.lg,
    gap: SPACING.sm,
  } as ViewStyle,
  header: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingHorizontal: SPACING.lg,
  } as ViewStyle,
  title: {
    fontFamily: FONTS.header,
    fontSize: 22,
    color: COLORS.cream,
  } as TextStyle,
  seeAll: {
    fontFamily: FONTS.mono,
    fontSize: 12,
    color: COLORS.sage,
    letterSpacing: 0.5,
  } as TextStyle,
  row: {
    paddingHorizontal: SPACING.lg,
    gap: SPACING.sm,
  } as ViewStyle,
  card: {
    width: 80,
    height: 80,
    backgroundColor: COLORS.bgGlass,
    borderRadius: RADIUS.lg,
    borderWidth: 1,
    borderColor: COLORS.border,
    alignItems: 'center',
    justifyContent: 'center',
    gap: SPACING.xs,
  } as ViewStyle,
  cardIcon: {
    marginBottom: 2,
  } as ViewStyle,
  cardName: {
    fontFamily: FONTS.mono,
    fontSize: 9,
    color: COLORS.cream,
    opacity: 0.7,
    letterSpacing: 0.3,
    textAlign: 'center',
    paddingHorizontal: 2,
  } as TextStyle,
});
