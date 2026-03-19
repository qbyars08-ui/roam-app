// =============================================================================
// ROAM — ItineraryBookingBar
// Horizontal row of booking chips for a full day of itinerary activities.
// Deduplicates partners, limits to 3 most relevant, scrolls if needed.
// =============================================================================

import React, { useMemo, useCallback } from 'react';
import {
  View,
  Text,
  ScrollView,
  StyleSheet,
  type ViewStyle,
  type TextStyle,
} from 'react-native';
import { useTranslation } from 'react-i18next';

import { COLORS, FONTS, SPACING } from '../../lib/constants';
import { AFFILIATE_PARTNERS, openAffiliateLink, type AffiliateParams } from '../../lib/affiliates';
import { impactAsync, ImpactFeedbackStyle } from '../../lib/haptics';
import { ExternalLink } from 'lucide-react-native';
import PressableScale from '../ui/PressableScale';
import { RADIUS } from '../../lib/constants';

// ---------------------------------------------------------------------------
// Types
// ---------------------------------------------------------------------------

export interface BookingActivity {
  name: string;
  type: string;
}

export interface ItineraryBookingBarProps {
  destination: string;
  activities: BookingActivity[];
  dates?: { start: string; end: string };
  tripId?: string;
  style?: ViewStyle;
}

// ---------------------------------------------------------------------------
// Activity type → partner id mapping
// ---------------------------------------------------------------------------

const TYPE_TO_PARTNER: Record<string, string> = {
  hotel: 'booking',
  accommodation: 'booking',
  hostel: 'booking',
  lodging: 'booking',
  experience: 'getyourguide',
  tour: 'getyourguide',
  activity: 'getyourguide',
  restaurant: 'getyourguide',
  food: 'getyourguide',
  flight: 'skyscanner',
  transport: 'skyscanner',
};

const PARTNER_PRIORITY: Record<string, number> = {
  booking: 1,
  getyourguide: 2,
  skyscanner: 3,
  rentalcars: 4,
};

const MAX_CHIPS = 3;

// ---------------------------------------------------------------------------
// Helpers
// ---------------------------------------------------------------------------

function parseDayCount(dates?: { start: string; end: string }): number | undefined {
  if (!dates) return undefined;
  const start = new Date(dates.start);
  const end = new Date(dates.end);
  const diff = Math.round((end.getTime() - start.getTime()) / (1000 * 60 * 60 * 24));
  return diff > 0 ? diff : undefined;
}

function deriveRelevantPartnerIds(activities: BookingActivity[]): string[] {
  const seen = new Set<string>();

  for (const activity of activities) {
    const normalized = activity.type?.toLowerCase().trim() ?? '';
    const partnerId = TYPE_TO_PARTNER[normalized];
    if (partnerId) seen.add(partnerId);
  }

  // Fallback: if nothing matched, show booking + getyourguide as safe defaults
  if (seen.size === 0) {
    seen.add('booking');
    seen.add('getyourguide');
  }

  return Array.from(seen).sort(
    (a, b) => (PARTNER_PRIORITY[a] ?? 99) - (PARTNER_PRIORITY[b] ?? 99),
  ).slice(0, MAX_CHIPS);
}

// ---------------------------------------------------------------------------
// Inline chip (self-contained to avoid circular dep if chip is used elsewhere)
// ---------------------------------------------------------------------------

interface InlineChipProps {
  partnerId: string;
  destination: string;
  dates?: { start: string; end: string };
  tripId?: string;
}

function InlineChip({ partnerId, destination, dates, tripId }: InlineChipProps) {
  const { t } = useTranslation();
  const partner = useMemo(
    () => AFFILIATE_PARTNERS.find((p) => p.id === partnerId),
    [partnerId],
  );

  const handlePress = useCallback(async () => {
    if (!partner) return;
    await impactAsync(ImpactFeedbackStyle.Light);
    const params: AffiliateParams = {
      destination,
      days: parseDayCount(dates),
    };
    await openAffiliateLink(partner, params, tripId);
  }, [partner, destination, dates, tripId]);

  if (!partner) return null;

  const isFind = partner.category === 'flights';
  const chipLabel = isFind
    ? t('booking.chip.findOn', { defaultValue: 'Find on {{partner}} →', partner: partner.name })
    : t('booking.chip.bookOn', { defaultValue: 'Book on {{partner}} →', partner: partner.name });

  return (
    <PressableScale
      scaleAmount={0.95}
      onPress={handlePress}
      accessibilityLabel={chipLabel}
      accessibilityRole="button"
    >
      <View style={[chipStyles.chip, { borderColor: partner.color + '40' }]}>
        <ExternalLink
          size={10}
          strokeWidth={1.5}
          color={partner.color}
        />
        <Text style={[chipStyles.label, { color: partner.color }]} numberOfLines={1}>
          {chipLabel}
        </Text>
      </View>
    </PressableScale>
  );
}

const chipStyles = StyleSheet.create({
  chip: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: COLORS.surface2,
    borderWidth: 1,
    borderRadius: RADIUS.pill,
    paddingHorizontal: SPACING.sm,
    paddingVertical: 3,
    gap: 4,
  } as ViewStyle,
  label: {
    fontFamily: FONTS.mono,
    fontSize: 10,
    letterSpacing: 0.2,
    lineHeight: 14,
  } as TextStyle,
});

// ---------------------------------------------------------------------------
// ItineraryBookingBar
// ---------------------------------------------------------------------------

export default function ItineraryBookingBar({
  destination,
  activities,
  dates,
  tripId,
  style,
}: ItineraryBookingBarProps) {
  const { t } = useTranslation();

  const partnerIds = useMemo(
    () => deriveRelevantPartnerIds(activities),
    [activities],
  );

  if (partnerIds.length === 0) return null;

  const usesScrollView = partnerIds.length > 3;

  return (
    <View style={[styles.container, style]}>
      <Text style={styles.header}>
        {t('booking.bar.header', { defaultValue: 'BOOK THIS DAY' })}
      </Text>

      {usesScrollView ? (
        <ScrollView
          horizontal
          showsHorizontalScrollIndicator={false}
          contentContainerStyle={styles.scrollContent}
        >
          {partnerIds.map((id) => (
            <InlineChip
              key={id}
              partnerId={id}
              destination={destination}
              dates={dates}
              tripId={tripId}
            />
          ))}
        </ScrollView>
      ) : (
        <View style={styles.row}>
          {partnerIds.map((id) => (
            <InlineChip
              key={id}
              partnerId={id}
              destination={destination}
              dates={dates}
              tripId={tripId}
            />
          ))}
        </View>
      )}
    </View>
  );
}

// ---------------------------------------------------------------------------
// Styles
// ---------------------------------------------------------------------------

const styles = StyleSheet.create({
  container: {
    gap: SPACING.xs,
  } as ViewStyle,
  header: {
    fontFamily: FONTS.mono,
    fontSize: 10,
    color: COLORS.creamDim,
    letterSpacing: 1.0,
  } as TextStyle,
  row: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: SPACING.xs,
  } as ViewStyle,
  scrollContent: {
    flexDirection: 'row',
    gap: SPACING.xs,
    paddingRight: SPACING.sm,
  } as ViewStyle,
});
