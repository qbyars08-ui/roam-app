// =============================================================================
// ROAM — TripCountdown: Premium countdown widget with SVG progress ring
// Shows days until departure, circular progress, prep milestones, travel quote.
// =============================================================================
import React, { useMemo } from 'react';
import { View, Text, StyleSheet, type ViewStyle, type TextStyle } from 'react-native';
import Svg, { Circle } from 'react-native-svg';
import { useTranslation } from 'react-i18next';
import { Check, CircleDot } from 'lucide-react-native';
import { COLORS, FONTS, SPACING, RADIUS } from '../../lib/constants';
import FadeIn from '../ui/FadeIn';

// ---------------------------------------------------------------------------
// Types
// ---------------------------------------------------------------------------
export interface TripCountdownProps {
  trip: {
    destination: string;
    departureDate: string;
    returnDate?: string;
  };
  bookingDate?: string;
}

// ---------------------------------------------------------------------------
// Constants
// ---------------------------------------------------------------------------
const RING_SIZE = 120;
const STROKE_WIDTH = 6;
const RING_RADIUS = (RING_SIZE - STROKE_WIDTH) / 2;
const CIRCUMFERENCE = 2 * Math.PI * RING_RADIUS;
const MS_PER_DAY = 1000 * 60 * 60 * 24;

const MILESTONES = [
  { daysOut: 30, label: 'Book tours' },
  { daysOut: 14, label: 'Check visa' },
  { daysOut: 7, label: 'Pack' },
  { daysOut: 1, label: 'Download offline' },
] as const;

const QUOTES = [
  'Start packing light.',
  'Time to brush up on local phrases.',
  'Have you checked the weather forecast?',
  'Remember: the best souvenirs are stories.',
  'Less luggage, more freedom.',
  'Your future self will thank you for planning early.',
  'Adventure is closer than you think.',
  'Good trips start with good lists.',
] as const;

// ---------------------------------------------------------------------------
// Pure helpers
// ---------------------------------------------------------------------------
function computeDaysUntil(dateStr: string): number {
  const target = new Date(dateStr);
  target.setHours(0, 0, 0, 0);
  const today = new Date();
  today.setHours(0, 0, 0, 0);
  return Math.max(0, Math.ceil((target.getTime() - today.getTime()) / MS_PER_DAY));
}

function computeProgress(bookingDateStr: string, departureDateStr: string): number {
  const booking = new Date(bookingDateStr);
  booking.setHours(0, 0, 0, 0);
  const departure = new Date(departureDateStr);
  departure.setHours(0, 0, 0, 0);
  const today = new Date();
  today.setHours(0, 0, 0, 0);

  const totalSpan = departure.getTime() - booking.getTime();
  if (totalSpan <= 0) return 1;
  const elapsed = today.getTime() - booking.getTime();
  return Math.min(1, Math.max(0, elapsed / totalSpan));
}

function pickQuote(destination: string, daysUntil: number): string {
  // Deterministic-ish pick based on destination + day count
  const seed = destination.length + daysUntil;
  const idx = seed % QUOTES.length;
  return `${destination} is ${daysUntil} day${daysUntil === 1 ? '' : 's'} away. ${QUOTES[idx]}`;
}

// ---------------------------------------------------------------------------
// Component
// ---------------------------------------------------------------------------
export default function TripCountdown({ trip, bookingDate }: TripCountdownProps) {
  const { t } = useTranslation();

  const daysLeft = useMemo(
    () => computeDaysUntil(trip.departureDate),
    [trip.departureDate],
  );

  const progress = useMemo(() => {
    const effectiveBooking = bookingDate ?? new Date(
      new Date(trip.departureDate).getTime() - 60 * MS_PER_DAY,
    ).toISOString();
    return computeProgress(effectiveBooking, trip.departureDate);
  }, [bookingDate, trip.departureDate]);

  const strokeDashoffset = useMemo(
    () => CIRCUMFERENCE * (1 - progress),
    [progress],
  );

  const quote = useMemo(
    () => pickQuote(trip.destination, daysLeft),
    [trip.destination, daysLeft],
  );

  const milestoneStates = useMemo(
    () => MILESTONES.map((m) => ({ ...m, completed: daysLeft < m.daysOut })),
    [daysLeft],
  );

  return (
    <FadeIn delay={100} duration={300}>
      <View style={styles.container}>
        {/* ── Progress ring + big number ── */}
        <View style={styles.ringSection}>
          <View style={styles.ringContainer}>
            <Svg width={RING_SIZE} height={RING_SIZE}>
              {/* Background track */}
              <Circle
                cx={RING_SIZE / 2}
                cy={RING_SIZE / 2}
                r={RING_RADIUS}
                stroke={COLORS.surface2}
                strokeWidth={STROKE_WIDTH}
                fill="none"
              />
              {/* Progress arc */}
              <Circle
                cx={RING_SIZE / 2}
                cy={RING_SIZE / 2}
                r={RING_RADIUS}
                stroke={COLORS.sage}
                strokeWidth={STROKE_WIDTH}
                fill="none"
                strokeDasharray={`${CIRCUMFERENCE}`}
                strokeDashoffset={strokeDashoffset}
                strokeLinecap="round"
                rotation={-90}
                origin={`${RING_SIZE / 2}, ${RING_SIZE / 2}`}
              />
            </Svg>
            {/* Centered number overlay */}
            <View style={styles.ringOverlay}>
              <Text style={styles.bigNumber}>{daysLeft}</Text>
            </View>
          </View>

          <Text style={styles.label}>
            {t('tripCountdown.daysUntil', {
              defaultValue: `days until ${trip.destination}`,
              destination: trip.destination,
            })}
          </Text>
        </View>

        {/* ── Milestones row ── */}
        <View style={styles.milestones}>
          {milestoneStates.map((m) => (
            <View
              key={m.daysOut}
              style={[styles.milestonePill, m.completed && styles.milestonePillDone]}
            >
              {m.completed ? (
                <Check size={12} color={COLORS.sage} strokeWidth={2} />
              ) : (
                <CircleDot size={12} color={COLORS.muted} strokeWidth={1.5} />
              )}
              <Text
                style={[styles.milestoneText, m.completed && styles.milestoneTextDone]}
                numberOfLines={1}
              >
                {t(`tripCountdown.milestone.${m.daysOut}`, { defaultValue: `${m.daysOut}d: ${m.label}` })}
              </Text>
            </View>
          ))}
        </View>

        {/* ── Motivational quote ── */}
        <Text style={styles.quote}>{quote}</Text>
      </View>
    </FadeIn>
  );
}

// ---------------------------------------------------------------------------
// Styles
// ---------------------------------------------------------------------------
const styles = StyleSheet.create({
  container: {
    backgroundColor: COLORS.surface1,
    borderRadius: RADIUS.lg,
    padding: SPACING.lg,
    borderWidth: 1,
    borderColor: COLORS.border,
    gap: SPACING.lg,
  } as ViewStyle,

  // Ring section
  ringSection: {
    alignItems: 'center',
    gap: SPACING.sm,
  } as ViewStyle,
  ringContainer: {
    width: RING_SIZE,
    height: RING_SIZE,
    justifyContent: 'center',
    alignItems: 'center',
  } as ViewStyle,
  ringOverlay: {
    ...StyleSheet.absoluteFillObject,
    justifyContent: 'center',
    alignItems: 'center',
  } as ViewStyle,
  bigNumber: {
    fontFamily: FONTS.header,
    fontSize: 64,
    color: COLORS.cream,
    lineHeight: 70,
    letterSpacing: -2,
  } as TextStyle,
  label: {
    fontFamily: FONTS.body,
    fontSize: 16,
    color: COLORS.creamDim,
    textAlign: 'center',
  } as TextStyle,

  // Milestones
  milestones: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: SPACING.sm,
    justifyContent: 'center',
  } as ViewStyle,
  milestonePill: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
    backgroundColor: COLORS.surface2,
    borderRadius: RADIUS.pill,
    paddingVertical: 6,
    paddingHorizontal: 10,
    borderWidth: 1,
    borderColor: COLORS.border,
  } as ViewStyle,
  milestonePillDone: {
    borderColor: COLORS.sageBorder,
    backgroundColor: COLORS.sageVeryFaint,
  } as ViewStyle,
  milestoneText: {
    fontFamily: FONTS.mono,
    fontSize: 11,
    color: COLORS.muted,
    letterSpacing: 0.3,
  } as TextStyle,
  milestoneTextDone: {
    color: COLORS.sage,
  } as TextStyle,

  // Quote
  quote: {
    fontFamily: FONTS.mono,
    fontSize: 12,
    fontStyle: 'italic',
    color: COLORS.creamDim,
    textAlign: 'center',
    lineHeight: 18,
  } as TextStyle,
});
