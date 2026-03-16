// =============================================================================
// ROAM — Layover Optimizer
// What to do with X hours in a layover city.
// =============================================================================
import React, { useCallback, useMemo, useState } from 'react';
import {
  View,
  Text,
  ScrollView,
  Pressable,
  StyleSheet,
  type ViewStyle,
  type TextStyle,
} from 'react-native';
import { useRouter } from 'expo-router';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import {
  ArrowLeft,
  Clock,
  MapPin,
  Utensils,
  Compass,
  Sparkles,
  Palette,
  ShoppingBag,
  Minus,
  Plus,
  Plane,
  ChevronRight,
  type LucideIcon,
} from 'lucide-react-native';
import * as Haptics from '../lib/haptics';
import { COLORS, FONTS, SPACING, RADIUS } from '../lib/constants';
import {
  getLayoverGuide,
  getLayoverActivities,
  getSupportedLayoverAirports,
  type LayoverGuide,
  type LayoverActivity,
} from '../lib/layover-data';
import { withComingSoon } from '../lib/with-coming-soon';

// ---------------------------------------------------------------------------
// Constants
// ---------------------------------------------------------------------------
const CATEGORY_ICONS: Record<LayoverActivity['category'], LucideIcon> = {
  food: Utensils,
  explore: Compass,
  relax: Sparkles,
  culture: Palette,
  shop: ShoppingBag,
};

const CATEGORY_COLORS: Record<LayoverActivity['category'], string> = {
  food: COLORS.coral,
  explore: COLORS.sage,
  relax: COLORS.gold,
  culture: COLORS.cream,
  shop: COLORS.sage,
};

// ---------------------------------------------------------------------------
// Sub-components
// ---------------------------------------------------------------------------

function AirportChip({
  code,
  isActive,
  onPress,
}: {
  code: string;
  isActive: boolean;
  onPress: () => void;
}) {
  return (
    <Pressable
      onPress={() => {
        Haptics.selectionAsync();
        onPress();
      }}
      style={[
        styles.airportChip,
        isActive && styles.airportChipActive,
      ]}
    >
      <Text style={[styles.airportChipText, isActive && styles.airportChipTextActive]}>
        {code}
      </Text>
    </Pressable>
  );
}

function ActivityCard({ activity }: { activity: LayoverActivity }) {
  const Icon = CATEGORY_ICONS[activity.category];
  const color = CATEGORY_COLORS[activity.category];

  return (
    <View style={styles.activityCard}>
      <View style={styles.activityHeader}>
        <View style={[styles.activityIconWrap, { backgroundColor: color + '18' }]}>
          <Icon size={16} color={color} strokeWidth={2} />
        </View>
        <View style={{ flex: 1 }}>
          <Text style={styles.activityTitle}>{activity.title}</Text>
          <View style={styles.durationRow}>
            <Clock size={10} color={COLORS.creamMuted} strokeWidth={2} />
            <Text style={styles.activityDuration}>{activity.duration}</Text>
          </View>
        </View>
      </View>
      <Text style={styles.activityDesc}>{activity.description}</Text>
      <View style={styles.tipRow}>
        <Sparkles size={12} color={COLORS.gold} strokeWidth={2} />
        <Text style={styles.tipText}>{activity.tip}</Text>
      </View>
    </View>
  );
}

// ---------------------------------------------------------------------------
// Main Screen
// ---------------------------------------------------------------------------
function LayoverScreen() {
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
          <ArrowLeft size={24} color={COLORS.cream} strokeWidth={2} />
        </Pressable>
        <View style={{ flex: 1 }}>
          <Text style={styles.headerTitle}>Layover Optimizer</Text>
          <Text style={styles.headerSub}>What to do with your time</Text>
        </View>
        <Plane size={20} color={COLORS.sage} strokeWidth={2} />
      </View>

      <ScrollView
        style={styles.scroll}
        contentContainerStyle={[styles.scrollContent, { paddingBottom: insets.bottom + 40 }]}
        showsVerticalScrollIndicator={false}
      >
        {/* Airport selector */}
        <Text style={styles.sectionLabel}>AIRPORT</Text>
        <ScrollView
          horizontal
          showsHorizontalScrollIndicator={false}
          contentContainerStyle={styles.chipRow}
        >
          {airports.map((code) => (
            <AirportChip
              key={code}
              code={code}
              isActive={selectedAirport === code}
              onPress={() => setSelectedAirport(code)}
            />
          ))}
        </ScrollView>

        {/* Airport info */}
        {guide && (
          <View style={styles.airportInfo}>
            <Text style={styles.airportName}>{guide.airport}</Text>
            <View style={styles.transitRow}>
              <MapPin size={14} color={COLORS.sage} strokeWidth={2} />
              <Text style={styles.transitText}>
                {guide.transitTime} via {guide.transitMethod}
              </Text>
            </View>
          </View>
        )}

        {/* Hours selector */}
        <Text style={styles.sectionLabel}>LAYOVER TIME</Text>
        <View style={styles.hoursRow}>
          <Pressable
            onPress={handleDecrease}
            style={({ pressed }) => [styles.hoursBtn, pressed && { opacity: 0.6 }]}
          >
            <Minus size={20} color={COLORS.cream} strokeWidth={2} />
          </Pressable>
          <View style={styles.hoursDisplay}>
            <Text style={styles.hoursNum}>{hours}</Text>
            <Text style={styles.hoursLabel}>{hours === 1 ? 'hour' : 'hours'}</Text>
          </View>
          <Pressable
            onPress={handleIncrease}
            style={({ pressed }) => [styles.hoursBtn, pressed && { opacity: 0.6 }]}
          >
            <Plus size={20} color={COLORS.cream} strokeWidth={2} />
          </Pressable>
        </View>

        {/* Status */}
        <View style={[styles.statusBadge, { backgroundColor: canLeave ? COLORS.sage + '18' : COLORS.gold + '18' }]}>
          <Text style={[styles.statusText, { color: canLeave ? COLORS.sage : COLORS.gold }]}>
            {canLeave
              ? `${hours} hours is enough to explore ${guide?.city ?? 'the city'}`
              : `Stay in the airport ${guide ? `(need ${guide.minHoursToLeave}+ hours to leave)` : ''}`}
          </Text>
        </View>

        {/* In-airport options */}
        {inAirport.length > 0 && (
          <>
            <Text style={styles.sectionLabel}>IN THE AIRPORT</Text>
            {inAirport.map((perk, i) => (
              <View key={i} style={styles.perkRow}>
                <ChevronRight size={14} color={COLORS.sage} strokeWidth={2} />
                <Text style={styles.perkText}>{perk}</Text>
              </View>
            ))}
          </>
        )}

        {/* Outside activities */}
        {activities.length > 0 && (
          <>
            <Text style={styles.sectionLabel}>LEAVE THE AIRPORT</Text>
            <Text style={styles.sectionMeta}>
              Activities that fit your {hours}-hour layover (includes 90 min buffer for transit + security)
            </Text>
            {activities.map((activity, i) => (
              <ActivityCard key={i} activity={activity} />
            ))}
          </>
        )}

        {/* No activities message */}
        {canLeave && activities.length === 0 && (
          <View style={styles.emptyCard}>
            <Text style={styles.emptyText}>
              Not enough time for city activities after accounting for transit and security. Enjoy the airport amenities instead.
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
const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: COLORS.bg,
  } as ViewStyle,
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: SPACING.sm,
    paddingHorizontal: SPACING.lg,
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
  scroll: {
    flex: 1,
  } as ViewStyle,
  scrollContent: {
    paddingHorizontal: SPACING.lg,
    gap: SPACING.sm,
  } as ViewStyle,
  sectionLabel: {
    fontFamily: FONTS.mono,
    fontSize: 10,
    color: COLORS.creamMuted,
    letterSpacing: 1.5,
    marginTop: SPACING.md,
  } as TextStyle,
  sectionMeta: {
    fontFamily: FONTS.body,
    fontSize: 12,
    color: COLORS.creamDim,
    marginBottom: SPACING.xs,
  } as TextStyle,
  chipRow: {
    flexDirection: 'row',
    gap: SPACING.xs,
    paddingVertical: SPACING.xs,
  } as ViewStyle,
  airportChip: {
    paddingHorizontal: SPACING.md,
    paddingVertical: SPACING.xs,
    borderRadius: RADIUS.full,
    backgroundColor: COLORS.bgElevated,
    borderWidth: 1,
    borderColor: COLORS.bgCard,
  } as ViewStyle,
  airportChipActive: {
    backgroundColor: COLORS.sage + '20',
    borderColor: COLORS.sage,
  } as ViewStyle,
  airportChipText: {
    fontFamily: FONTS.mono,
    fontSize: 13,
    color: COLORS.creamMuted,
    letterSpacing: 1,
  } as TextStyle,
  airportChipTextActive: {
    color: COLORS.sage,
  } as TextStyle,
  airportInfo: {
    backgroundColor: COLORS.bgElevated,
    borderRadius: RADIUS.lg,
    padding: SPACING.md,
    gap: SPACING.xs,
  } as ViewStyle,
  airportName: {
    fontFamily: FONTS.bodySemiBold,
    fontSize: 16,
    color: COLORS.cream,
  } as TextStyle,
  transitRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: SPACING.xs,
  } as ViewStyle,
  transitText: {
    fontFamily: FONTS.body,
    fontSize: 13,
    color: COLORS.sage,
  } as TextStyle,
  hoursRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: SPACING.lg,
    paddingVertical: SPACING.md,
  } as ViewStyle,
  hoursBtn: {
    width: 44,
    height: 44,
    borderRadius: 22,
    backgroundColor: COLORS.bgElevated,
    alignItems: 'center',
    justifyContent: 'center',
  } as ViewStyle,
  hoursDisplay: {
    alignItems: 'center',
    minWidth: 80,
  } as ViewStyle,
  hoursNum: {
    fontFamily: FONTS.header,
    fontSize: 48,
    color: COLORS.cream,
  } as TextStyle,
  hoursLabel: {
    fontFamily: FONTS.mono,
    fontSize: 11,
    color: COLORS.creamMuted,
    letterSpacing: 1,
    marginTop: -4,
  } as TextStyle,
  statusBadge: {
    borderRadius: RADIUS.md,
    padding: SPACING.sm,
    alignItems: 'center',
  } as ViewStyle,
  statusText: {
    fontFamily: FONTS.bodySemiBold,
    fontSize: 13,
  } as TextStyle,
  perkRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: SPACING.xs,
    paddingVertical: SPACING.xs,
  } as ViewStyle,
  perkText: {
    fontFamily: FONTS.body,
    fontSize: 13,
    color: COLORS.cream,
    flex: 1,
  } as TextStyle,
  activityCard: {
    backgroundColor: COLORS.bgElevated,
    borderRadius: RADIUS.lg,
    padding: SPACING.md,
    gap: SPACING.sm,
    marginBottom: SPACING.xs,
  } as ViewStyle,
  activityHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: SPACING.sm,
  } as ViewStyle,
  activityIconWrap: {
    width: 36,
    height: 36,
    borderRadius: 18,
    alignItems: 'center',
    justifyContent: 'center',
  } as ViewStyle,
  activityTitle: {
    fontFamily: FONTS.bodySemiBold,
    fontSize: 15,
    color: COLORS.cream,
  } as TextStyle,
  durationRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
    marginTop: 2,
  } as ViewStyle,
  activityDuration: {
    fontFamily: FONTS.mono,
    fontSize: 11,
    color: COLORS.creamMuted,
    letterSpacing: 0.5,
  } as TextStyle,
  activityDesc: {
    fontFamily: FONTS.body,
    fontSize: 13,
    color: COLORS.creamMuted,
    lineHeight: 18,
  } as TextStyle,
  tipRow: {
    flexDirection: 'row',
    alignItems: 'flex-start',
    gap: SPACING.xs,
    backgroundColor: COLORS.gold + '10',
    borderRadius: RADIUS.sm,
    padding: SPACING.sm,
  } as ViewStyle,
  tipText: {
    fontFamily: FONTS.body,
    fontSize: 12,
    color: COLORS.gold,
    flex: 1,
    lineHeight: 16,
  } as TextStyle,
  emptyCard: {
    backgroundColor: COLORS.bgElevated,
    borderRadius: RADIUS.lg,
    padding: SPACING.lg,
    alignItems: 'center',
  } as ViewStyle,
  emptyText: {
    fontFamily: FONTS.body,
    fontSize: 13,
    color: COLORS.creamMuted,
    textAlign: 'center',
    lineHeight: 18,
  } as TextStyle,
});

export default withComingSoon(LayoverScreen, { routeName: 'layover', title: 'Layover Optimizer' });
