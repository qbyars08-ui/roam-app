// =============================================================================
// ROAM — Airport Survival Guide
// Best food, lounges, security, sleep, work, SIM, currency for major hubs
// =============================================================================
import React, { useState, useCallback } from 'react';
import {
  View,
  Text,
  ScrollView,
  Pressable,
  StyleSheet,
  type TextStyle,
  type ViewStyle,
} from 'react-native';
import { useRouter } from 'expo-router';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { ChevronRight, ChevronDown } from 'lucide-react-native';
import * as Haptics from '../lib/haptics';
import { COLORS, FONTS, SPACING, RADIUS } from '../lib/constants';
import { AIRPORTS, type AirportData } from '../lib/airport-data';
// ---------------------------------------------------------------------------
// Airport list card
// ---------------------------------------------------------------------------
function AirportCard({
  airport,
  onPress,
}: {
  airport: AirportData;
  onPress: () => void;
}) {
  return (
    <Pressable
      onPress={onPress}
      style={({ pressed }) => [
        styles.airportCard,
        { opacity: pressed ? 0.9 : 1 },
      ]}
    >
      <View style={styles.airportCardHeader}>
        <Text style={styles.airportCode}>{airport.code}</Text>
        <Text style={styles.airportCity}>{airport.city}</Text>
      </View>
      <Text style={styles.airportName}>{airport.name}</Text>
      <ChevronRight size={18} color={COLORS.creamMuted} style={styles.airportChev} />
    </Pressable>
  );
}

// ---------------------------------------------------------------------------
// Detail view
// ---------------------------------------------------------------------------
function AirportDetail({ airport }: { airport: AirportData }) {
  const [expanded, setExpanded] = useState<string | null>('food');

  const toggle = useCallback((key: string) => {
    Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
    setExpanded((e) => (e === key ? null : key));
  }, []);

  return (
    <ScrollView
      style={styles.detailScroll}
      contentContainerStyle={styles.detailContent}
      showsVerticalScrollIndicator={false}
    >
      <View style={styles.detailHeader}>
        <Text style={styles.detailCode}>{airport.code}</Text>
        <Text style={styles.detailName}>{airport.name}</Text>
        <Text style={styles.detailCity}>{airport.city}</Text>
      </View>

      <DetailSection
        title="Best food"
        expanded={expanded === 'food'}
        onToggle={() => toggle('food')}
      >
        {airport.food.map((t, i) => (
          <View key={i} style={styles.foodTerminal}>
            <Text style={styles.foodTerminalLabel}>{t.terminal}</Text>
            {t.spots.map((s, j) => (
              <View key={j} style={styles.foodSpot}>
                <Text style={styles.foodName}>{s.name}</Text>
                <Text style={styles.foodType}>{s.type}</Text>
                <Text style={styles.foodNote}>{s.note}</Text>
              </View>
            ))}
          </View>
        ))}
      </DetailSection>

      <DetailSection
        title="Hidden lounges (no membership)"
        expanded={expanded === 'lounges'}
        onToggle={() => toggle('lounges')}
      >
        {airport.hiddenLounges.map((l, i) => (
          <View key={i} style={styles.loungeRow}>
            <Text style={styles.loungeName}>{l.name}</Text>
            <Text style={styles.loungeHow}>{l.how}</Text>
            {l.cost && <Text style={styles.loungeCost}>{l.cost}</Text>}
          </View>
        ))}
      </DetailSection>

      <DetailSection
        title="Fastest security"
        expanded={expanded === 'security'}
        onToggle={() => toggle('security')}
      >
        <Text style={styles.bodyText}>{airport.fastestSecurity}</Text>
      </DetailSection>

      <DetailSection
        title="Best spots to sleep / work"
        expanded={expanded === 'sleep'}
        onToggle={() => toggle('sleep')}
      >
        <Text style={styles.sectionSub}>Sleep</Text>
        {airport.sleepSpots.map((s, i) => (
          <Text key={i} style={styles.bulletItem}>{'\u2022'} {s}</Text>
        ))}
        <Text style={styles.sectionSub}>Work</Text>
        {airport.workSpots.map((s, i) => (
          <Text key={i} style={styles.bulletItem}>{'\u2022'} {s}</Text>
        ))}
      </DetailSection>

      <DetailSection
        title="SIM cards"
        expanded={expanded === 'sim'}
        onToggle={() => toggle('sim')}
      >
        {airport.simCards.map((s, i) => (
          <View key={i} style={styles.simRow}>
            <Text style={styles.simWhere}>{s.where}</Text>
            <Text style={styles.bodyText}>{s.note}</Text>
          </View>
        ))}
      </DetailSection>

      <DetailSection
        title="Currency"
        expanded={expanded === 'currency'}
        onToggle={() => toggle('currency')}
      >
        <View style={styles.currencyRow}>
          <Text style={styles.currencyAvoid}>Avoid: {airport.currencyAvoid}</Text>
        </View>
        <View style={styles.currencyRow}>
          <Text style={styles.currencyUse}>Use: {airport.currencyUse}</Text>
        </View>
      </DetailSection>

      <DetailSection
        title="Terminal transfer"
        expanded={expanded === 'transfer'}
        onToggle={() => toggle('transfer')}
      >
        <Text style={styles.bodyText}>{airport.terminalTransfer}</Text>
      </DetailSection>
    </ScrollView>
  );
}

function DetailSection({
  title,
  expanded,
  onToggle,
  children,
}: {
  title: string;
  expanded: boolean;
  onToggle: () => void;
  children: React.ReactNode;
}) {
  return (
    <View style={styles.detailSection}>
      <Pressable onPress={onToggle} style={styles.detailSectionHeader}>
        <Text style={styles.detailSectionTitle}>{title}</Text>
        {expanded ? (
          <ChevronDown size={18} color={COLORS.creamMuted} />
        ) : (
          <ChevronRight size={18} color={COLORS.creamMuted} />
        )}
      </Pressable>
      {expanded && <View style={styles.detailSectionBody}>{children}</View>}
    </View>
  );
}

// ---------------------------------------------------------------------------
// Main screen
// ---------------------------------------------------------------------------
export default function AirportGuideScreen() {
  const router = useRouter();
  const insets = useSafeAreaInsets();
  const [selected, setSelected] = useState<AirportData | null>(null);

  const handleSelect = useCallback((airport: AirportData) => {
    Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
    setSelected(airport);
  }, []);

  const handleBack = useCallback(() => {
    Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
    setSelected(null);
  }, []);

  if (selected) {
    return (
      <View style={[styles.screen, { paddingTop: insets.top }]}>
        <View style={styles.header}>
          <Pressable onPress={handleBack} hitSlop={12} style={({ pressed }) => ({ opacity: pressed ? 0.7 : 1 })}>
            <Text style={styles.backBtn}>{'\u2190'}</Text>
          </Pressable>
          <Text style={styles.headerTitle}>{selected.code}</Text>
        </View>
        <AirportDetail airport={selected} />
      </View>
    );
  }

  return (
    <View style={[styles.screen, { paddingTop: insets.top }]}>
      <View style={styles.header}>
        <Pressable onPress={() => router.back()} hitSlop={12} style={({ pressed }) => ({ opacity: pressed ? 0.7 : 1 })}>
          <Text style={styles.backBtn}>{'\u2190'}</Text>
        </Pressable>
        <Text style={styles.title}>Airport Survival Guide</Text>
        <Text style={styles.subtitle}>
          Best food, lounges, security, sleep spots, SIM cards, and currency for every major hub.
        </Text>
      </View>
      <ScrollView
        style={styles.listScroll}
        contentContainerStyle={[styles.listContent, { paddingBottom: insets.bottom + SPACING.xxl }]}
        showsVerticalScrollIndicator={false}
      >
        {AIRPORTS.map((airport) => (
          <AirportCard key={airport.code} airport={airport} onPress={() => handleSelect(airport)} />
        ))}
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
  header: {
    paddingHorizontal: SPACING.lg,
    marginBottom: SPACING.lg,
  } as ViewStyle,
  backBtn: {
    fontFamily: FONTS.body,
    fontSize: 18,
    color: COLORS.cream,
    marginBottom: SPACING.sm,
  } as TextStyle,
  headerTitle: {
    fontFamily: FONTS.header,
    fontSize: 24,
    color: COLORS.cream,
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
  listScroll: {
    flex: 1,
  } as ViewStyle,
  listContent: {
    paddingHorizontal: SPACING.lg,
  } as ViewStyle,
  airportCard: {
    backgroundColor: COLORS.bgCard,
    borderRadius: RADIUS.lg,
    borderWidth: 1,
    borderColor: COLORS.border,
    padding: SPACING.lg,
    marginBottom: SPACING.sm,
    flexDirection: 'row',
    alignItems: 'center',
    flexWrap: 'wrap',
  } as ViewStyle,
  airportCardHeader: {
    flexDirection: 'row',
    alignItems: 'baseline',
    gap: SPACING.sm,
    marginBottom: 4,
    width: '100%',
  } as ViewStyle,
  airportCode: {
    fontFamily: FONTS.header,
    fontSize: 22,
    color: COLORS.gold,
  } as TextStyle,
  airportCity: {
    fontFamily: FONTS.mono,
    fontSize: 12,
    color: COLORS.creamMuted,
  } as TextStyle,
  airportName: {
    fontFamily: FONTS.body,
    fontSize: 14,
    color: COLORS.creamMuted,
    flex: 1,
  } as TextStyle,
  airportChev: {
    marginLeft: SPACING.sm,
  } as ViewStyle,

  // Detail
  detailScroll: {
    flex: 1,
  } as ViewStyle,
  detailContent: {
    paddingHorizontal: SPACING.lg,
    paddingBottom: SPACING.xxxl,
  } as ViewStyle,
  detailHeader: {
    marginBottom: SPACING.xl,
  } as ViewStyle,
  detailCode: {
    fontFamily: FONTS.header,
    fontSize: 36,
    color: COLORS.gold,
    marginBottom: 4,
  } as TextStyle,
  detailName: {
    fontFamily: FONTS.bodySemiBold,
    fontSize: 18,
    color: COLORS.cream,
    marginBottom: 2,
  } as TextStyle,
  detailCity: {
    fontFamily: FONTS.body,
    fontSize: 14,
    color: COLORS.creamMuted,
  } as TextStyle,
  detailSection: {
    backgroundColor: COLORS.bgCard,
    borderRadius: RADIUS.lg,
    borderWidth: 1,
    borderColor: COLORS.border,
    marginBottom: SPACING.md,
    overflow: 'hidden',
  } as ViewStyle,
  detailSectionHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    padding: SPACING.md,
  } as ViewStyle,
  detailSectionTitle: {
    fontFamily: FONTS.bodySemiBold,
    fontSize: 15,
    color: COLORS.cream,
  } as TextStyle,
  detailSectionBody: {
    borderTopWidth: 1,
    borderTopColor: COLORS.border,
    padding: SPACING.md,
  } as ViewStyle,
  foodTerminal: {
    marginBottom: SPACING.md,
  } as ViewStyle,
  foodTerminalLabel: {
    fontFamily: FONTS.mono,
    fontSize: 10,
    color: COLORS.sage,
    letterSpacing: 1,
    marginBottom: 6,
  } as TextStyle,
  foodSpot: {
    marginBottom: SPACING.sm,
  } as ViewStyle,
  foodName: {
    fontFamily: FONTS.bodySemiBold,
    fontSize: 14,
    color: COLORS.cream,
  } as TextStyle,
  foodType: {
    fontFamily: FONTS.mono,
    fontSize: 11,
    color: COLORS.creamMuted,
  } as TextStyle,
  foodNote: {
    fontFamily: FONTS.body,
    fontSize: 13,
    color: COLORS.creamMuted,
    lineHeight: 18,
  } as TextStyle,
  loungeRow: {
    marginBottom: SPACING.sm,
  } as ViewStyle,
  loungeName: {
    fontFamily: FONTS.bodySemiBold,
    fontSize: 14,
    color: COLORS.cream,
  } as TextStyle,
  loungeHow: {
    fontFamily: FONTS.body,
    fontSize: 13,
    color: COLORS.creamMuted,
  } as TextStyle,
  loungeCost: {
    fontFamily: FONTS.mono,
    fontSize: 12,
    color: COLORS.gold,
    marginTop: 2,
  } as TextStyle,
  bodyText: {
    fontFamily: FONTS.body,
    fontSize: 14,
    color: COLORS.creamMuted,
    lineHeight: 20,
  } as TextStyle,
  sectionSub: {
    fontFamily: FONTS.mono,
    fontSize: 10,
    color: COLORS.sage,
    letterSpacing: 1,
    marginTop: SPACING.sm,
    marginBottom: 4,
  } as TextStyle,
  bulletItem: {
    fontFamily: FONTS.body,
    fontSize: 13,
    color: COLORS.creamMuted,
    lineHeight: 20,
  } as TextStyle,
  simRow: {
    marginBottom: SPACING.sm,
  } as ViewStyle,
  simWhere: {
    fontFamily: FONTS.bodySemiBold,
    fontSize: 13,
    color: COLORS.cream,
  } as TextStyle,
  currencyRow: {
    marginBottom: SPACING.xs,
  } as ViewStyle,
  currencyAvoid: {
    fontFamily: FONTS.body,
    fontSize: 13,
    color: COLORS.coral,
    lineHeight: 18,
  } as TextStyle,
  currencyUse: {
    fontFamily: FONTS.body,
    fontSize: 13,
    color: COLORS.sage,
    lineHeight: 18,
  } as TextStyle,
});
