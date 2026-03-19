// =============================================================================
// ROAM — ActivityBookingChip
// Inline pill chip for booking an activity directly from an itinerary item.
// Maps activity type → affiliate partner, builds URL, tracks click.
// =============================================================================

import React, { useCallback } from 'react';
import { StyleSheet, Text, View, type ViewStyle, type TextStyle } from 'react-native';
import { ExternalLink } from 'lucide-react-native';
import { useTranslation } from 'react-i18next';

import { COLORS, FONTS, RADIUS, SPACING } from '../../lib/constants';
import PressableScale from '../ui/PressableScale';
import { impactAsync, ImpactFeedbackStyle } from '../../lib/haptics';
import {
  AFFILIATE_PARTNERS,
  openAffiliateLink,
  type AffiliatePartner,
  type AffiliateParams,
} from '../../lib/affiliates';

// ---------------------------------------------------------------------------
// Types
// ---------------------------------------------------------------------------

export type ActivityType = 'hotel' | 'experience' | 'flight' | 'restaurant';

export interface ActivityBookingChipProps {
  activityName: string;
  activityType: ActivityType;
  destination: string;
  dates?: { start: string; end: string };
  tripId?: string;
  style?: ViewStyle;
}

// ---------------------------------------------------------------------------
// Mapping: activity type → partner id
// ---------------------------------------------------------------------------

const ACTIVITY_TYPE_TO_PARTNER: Record<ActivityType, string> = {
  hotel: 'booking',
  experience: 'getyourguide',
  flight: 'skyscanner',
  restaurant: 'getyourguide',
};

// ---------------------------------------------------------------------------
// Helpers
// ---------------------------------------------------------------------------

function getPartnerForActivity(type: ActivityType): AffiliatePartner | undefined {
  const partnerId = ACTIVITY_TYPE_TO_PARTNER[type];
  return AFFILIATE_PARTNERS.find((p) => p.id === partnerId);
}

function parseDayCount(dates?: { start: string; end: string }): number | undefined {
  if (!dates) return undefined;
  const start = new Date(dates.start);
  const end = new Date(dates.end);
  const diff = Math.round((end.getTime() - start.getTime()) / (1000 * 60 * 60 * 24));
  return diff > 0 ? diff : undefined;
}

// ---------------------------------------------------------------------------
// Component
// ---------------------------------------------------------------------------

export default function ActivityBookingChip({
  activityName,
  activityType,
  destination,
  dates,
  tripId,
  style,
}: ActivityBookingChipProps) {
  const { t } = useTranslation();

  const partner = getPartnerForActivity(activityType);

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

  const chipLabel =
    activityType === 'flight'
      ? t('booking.chip.findOn', { defaultValue: 'Find on {{partner}} →', partner: partner.name })
      : t('booking.chip.bookOn', { defaultValue: 'Book on {{partner}} →', partner: partner.name });

  return (
    <PressableScale
      scaleAmount={0.95}
      onPress={handlePress}
      accessibilityLabel={`${chipLabel} ${activityName}`}
      accessibilityRole="button"
      style={style}
    >
      <View style={[styles.chip, { borderColor: partner.color + '40' }]}>
        <ExternalLink
          size={10}
          strokeWidth={1.5}
          color={partner.color}
          style={styles.icon}
        />
        <Text style={[styles.label, { color: partner.color }]} numberOfLines={1}>
          {chipLabel}
        </Text>
      </View>
    </PressableScale>
  );
}

// ---------------------------------------------------------------------------
// Styles
// ---------------------------------------------------------------------------

const styles = StyleSheet.create({
  chip: {
    flexDirection: 'row',
    alignItems: 'center',
    alignSelf: 'flex-start',
    backgroundColor: COLORS.surface2,
    borderWidth: 1,
    borderRadius: RADIUS.pill,
    paddingHorizontal: SPACING.sm,
    paddingVertical: 3,
    gap: 4,
  } as ViewStyle,
  icon: {
    flexShrink: 0,
  } as ViewStyle,
  label: {
    fontFamily: FONTS.mono,
    fontSize: 10,
    letterSpacing: 0.2,
    lineHeight: 14,
  } as TextStyle,
});
