// =============================================================================
// ROAM — CRAFT mode itinerary display (personalized output)
// Day headers reference what they said; budget breakdown; flight/hotel when present
// =============================================================================
import React from 'react';
import { View, Text, ScrollView, StyleSheet, type ViewStyle, type TextStyle } from 'react-native';
import { COLORS, FONTS, SPACING, RADIUS } from '../lib/constants';
import type { Itinerary, ItineraryDay, TimeSlotActivity } from '../lib/types/itinerary';

interface CraftItineraryProps {
  itinerary: Itinerary;
}

function SlotRow({ label, slot }: { label: string; slot: TimeSlotActivity }) {
  return (
    <View style={styles.slot}>
      <Text style={styles.slotLabel}>{label}</Text>
      <Text style={styles.slotActivity}>{slot.activity}</Text>
      {slot.location ? <Text style={styles.slotLocation}>{slot.location}</Text> : null}
      {slot.cost ? <Text style={styles.slotCost}>{slot.cost}</Text> : null}
    </View>
  );
}

function DayBlock({ day }: { day: ItineraryDay }) {
  return (
    <View style={styles.dayBlock}>
      <Text style={styles.dayTheme}>Day {day.day} — {day.theme}</Text>
      <SlotRow label="Morning" slot={day.morning} />
      <SlotRow label="Afternoon" slot={day.afternoon} />
      <SlotRow label="Evening" slot={day.evening} />
      <View style={styles.accRow}>
        <Text style={styles.accLabel}>Stay</Text>
        <Text style={styles.accName}>{day.accommodation.name}</Text>
        <Text style={styles.accPrice}>{day.accommodation.pricePerNight}/night</Text>
      </View>
      <Text style={styles.dailyCost}>Day total: {day.dailyCost}</Text>
    </View>
  );
}

export default function CraftItinerary({ itinerary }: CraftItineraryProps) {
  const bb = itinerary.budgetBreakdown;
  return (
    <ScrollView style={styles.scroll} contentContainerStyle={styles.scrollContent} showsVerticalScrollIndicator={false}>
      <View style={styles.header}>
        <Text style={styles.destination}>{itinerary.destination}</Text>
        <Text style={styles.tagline}>{itinerary.tagline}</Text>
        <Text style={styles.totalBudget}>Total budget: {itinerary.totalBudget}</Text>
      </View>

      <View style={styles.budgetSection}>
        <Text style={styles.sectionTitle}>Budget breakdown</Text>
        <Text style={styles.budgetLine}>Flights: {bb.transportation || '—'}</Text>
        <Text style={styles.budgetLine}>Accommodation: {bb.accommodation}</Text>
        <Text style={styles.budgetLine}>Food: {bb.food}</Text>
        <Text style={styles.budgetLine}>Activities: {bb.activities}</Text>
        <Text style={styles.budgetLine}>Other: {bb.miscellaneous}</Text>
      </View>

      {itinerary.days.map((day) => (
        <DayBlock key={day.day} day={day} />
      ))}

      {itinerary.proTip ? (
        <View style={styles.proTipBlock}>
          <Text style={styles.proTipLabel}>Pro tip</Text>
          <Text style={styles.proTipText}>{itinerary.proTip}</Text>
        </View>
      ) : null}
    </ScrollView>
  );
}

const styles = StyleSheet.create({
  scroll: { flex: 1 } as ViewStyle,
  scrollContent: { paddingBottom: SPACING.xxxl } as ViewStyle,
  header: {
    marginBottom: SPACING.lg,
    paddingBottom: SPACING.lg,
    borderBottomWidth: 1,
    borderBottomColor: COLORS.goldBorder,
  } as ViewStyle,
  destination: {
    fontFamily: FONTS.header,
    fontSize: 28,
    color: COLORS.cream,
    letterSpacing: -0.5,
  } as TextStyle,
  tagline: {
    fontFamily: FONTS.body,
    fontSize: 14,
    color: COLORS.creamDim,
    marginTop: SPACING.xs,
    fontStyle: 'italic',
  } as TextStyle,
  totalBudget: {
    fontFamily: FONTS.mono,
    fontSize: 13,
    color: COLORS.gold,
    marginTop: SPACING.sm,
  } as TextStyle,
  budgetSection: {
    backgroundColor: COLORS.bgCard,
    borderRadius: RADIUS.lg,
    padding: SPACING.lg,
    marginBottom: SPACING.lg,
    borderWidth: 1,
    borderColor: COLORS.whiteFaintBorder,
  } as ViewStyle,
  sectionTitle: {
    fontFamily: FONTS.headerMedium,
    fontSize: 16,
    color: COLORS.cream,
    marginBottom: SPACING.sm,
  } as TextStyle,
  budgetLine: {
    fontFamily: FONTS.mono,
    fontSize: 13,
    color: COLORS.creamMuted,
    marginTop: 2,
  } as TextStyle,
  dayBlock: {
    marginBottom: SPACING.xl,
    paddingBottom: SPACING.lg,
    borderBottomWidth: 1,
    borderBottomColor: COLORS.border,
  } as ViewStyle,
  dayTheme: {
    fontFamily: FONTS.headerMedium,
    fontSize: 18,
    color: COLORS.gold,
    marginBottom: SPACING.md,
  } as TextStyle,
  slot: { marginBottom: SPACING.sm } as ViewStyle,
  slotLabel: {
    fontFamily: FONTS.mono,
    fontSize: 11,
    color: COLORS.creamDim,
    letterSpacing: 0.5,
    marginBottom: 2,
  } as TextStyle,
  slotActivity: {
    fontFamily: FONTS.body,
    fontSize: 14,
    color: COLORS.cream,
    lineHeight: 20,
  } as TextStyle,
  slotLocation: {
    fontFamily: FONTS.body,
    fontSize: 12,
    color: COLORS.creamMuted,
    marginTop: 2,
  } as TextStyle,
  slotCost: {
    fontFamily: FONTS.mono,
    fontSize: 12,
    color: COLORS.gold,
    marginTop: 2,
  } as TextStyle,
  accRow: {
    marginTop: SPACING.md,
    paddingTop: SPACING.sm,
    borderTopWidth: 1,
    borderTopColor: COLORS.border,
  } as ViewStyle,
  accLabel: {
    fontFamily: FONTS.mono,
    fontSize: 10,
    color: COLORS.creamDim,
    letterSpacing: 0.5,
  } as TextStyle,
  accName: {
    fontFamily: FONTS.bodySemiBold,
    fontSize: 14,
    color: COLORS.cream,
    marginTop: 2,
  } as TextStyle,
  accPrice: {
    fontFamily: FONTS.mono,
    fontSize: 12,
    color: COLORS.creamMuted,
    marginTop: 2,
  } as TextStyle,
  dailyCost: {
    fontFamily: FONTS.mono,
    fontSize: 12,
    color: COLORS.sage,
    marginTop: SPACING.sm,
  } as TextStyle,
  proTipBlock: {
    marginTop: SPACING.lg,
    padding: SPACING.lg,
    backgroundColor: COLORS.sageVeryFaint,
    borderRadius: RADIUS.lg,
    borderLeftWidth: 3,
    borderLeftColor: COLORS.sage,
  } as ViewStyle,
  proTipLabel: {
    fontFamily: FONTS.mono,
    fontSize: 10,
    color: COLORS.sage,
    letterSpacing: 0.5,
    marginBottom: SPACING.xs,
  } as TextStyle,
  proTipText: {
    fontFamily: FONTS.body,
    fontSize: 14,
    color: COLORS.cream,
    lineHeight: 21,
  } as TextStyle,
});
