// =============================================================================
// ROAM — Affiliate Booking Cards
// Non-intrusive partner cards shown at bottom of every itinerary
// =============================================================================
import React, { useCallback } from 'react';
import {
  Pressable,
  StyleSheet,
  Text,
  View,
  type TextStyle,
  type ViewStyle,
} from 'react-native';
import * as Haptics from 'expo-haptics';

import { COLORS, FONTS, SPACING, RADIUS } from '../../lib/constants';
import {
  AFFILIATE_PARTNERS,
  CATEGORY_ICONS,
  openAffiliateLink,
  type AffiliateParams,
} from '../../lib/affiliates';
import { formatTextWithDualPrice } from '../../lib/currency';
import { useCurrency } from './CurrencyToggle';

interface BookingCardsProps {
  destination: string;
  countryCode?: string;
  days?: number;
  budget?: string;
  tripId?: string;
}

export default function BookingCards({
  destination,
  countryCode,
  days,
  budget,
  tripId,
}: BookingCardsProps) {
  const { currency, rates } = useCurrency();
  const params: AffiliateParams = {
    destination,
    countryCode,
    days,
    budget,
  };

  const handlePress = useCallback(
    (partnerId: string) => {
      Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
      const partner = AFFILIATE_PARTNERS.find((p) => p.id === partnerId);
      if (partner) {
        openAffiliateLink(partner, params, tripId);
      }
    },
    [params, tripId]
  );

  return (
    <View style={styles.container}>
      <Text style={styles.sectionTitle}>Book your trip</Text>
      <Text style={styles.sectionSub}>
        Everything you need, one tap away
      </Text>

      <View style={styles.grid}>
        {AFFILIATE_PARTNERS.map((partner) => (
          <Pressable
            key={partner.id}
            onPress={() => handlePress(partner.id)}
            style={({ pressed }) => [
              styles.card,
              {
                opacity: pressed ? 0.85 : 1,
                transform: [{ scale: pressed ? 0.97 : 1 }],
              },
            ]}
          >
            {/* Color accent bar */}
            <View style={[styles.accentBar, { backgroundColor: partner.color }]} />

            <View style={styles.cardContent}>
              <View style={styles.cardHeader}>
                <Text style={styles.categoryIcon}>
                  {CATEGORY_ICONS[partner.category] ?? ''}
                </Text>
                <Text style={styles.partnerName}>{partner.name}</Text>
              </View>

              <Text style={styles.estimate}>
                {currency !== 'USD' && rates
                  ? formatTextWithDualPrice(partner.estimateLabel(params), currency, rates)
                  : partner.estimateLabel(params)}
              </Text>

              <View style={styles.ctaRow}>
                <Text style={styles.ctaText}>Book now</Text>
                <Text style={styles.ctaArrow}>{'\u2192'}</Text>
              </View>
            </View>
          </Pressable>
        ))}
      </View>

      <Text style={styles.disclaimer}>
        Affiliate links help keep ROAM free
      </Text>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    paddingTop: SPACING.xl,
    paddingBottom: SPACING.lg,
  } as ViewStyle,
  sectionTitle: {
    fontFamily: FONTS.header,
    fontSize: 28,
    color: COLORS.cream,
    marginBottom: SPACING.xs,
  } as TextStyle,
  sectionSub: {
    fontFamily: FONTS.body,
    fontSize: 14,
    color: COLORS.creamMuted,
    marginBottom: SPACING.lg,
  } as TextStyle,
  grid: {
    gap: SPACING.sm,
  } as ViewStyle,
  card: {
    backgroundColor: COLORS.bgCard,
    borderRadius: RADIUS.lg,
    borderWidth: 1,
    borderColor: COLORS.border,
    overflow: 'hidden',
    flexDirection: 'row',
  } as ViewStyle,
  accentBar: {
    width: 4,
  } as ViewStyle,
  cardContent: {
    flex: 1,
    padding: SPACING.md,
  } as ViewStyle,
  cardHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: SPACING.sm,
    marginBottom: SPACING.xs,
  } as ViewStyle,
  categoryIcon: {
    fontSize: 18,
  } as TextStyle,
  partnerName: {
    fontFamily: FONTS.bodySemiBold,
    fontSize: 15,
    color: COLORS.cream,
  } as TextStyle,
  estimate: {
    fontFamily: FONTS.body,
    fontSize: 13,
    color: COLORS.creamMuted,
    marginBottom: SPACING.sm,
  } as TextStyle,
  ctaRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: SPACING.xs,
  } as ViewStyle,
  ctaText: {
    fontFamily: FONTS.monoMedium,
    fontSize: 12,
    color: COLORS.sage,
    letterSpacing: 0.5,
  } as TextStyle,
  ctaArrow: {
    fontFamily: FONTS.mono,
    fontSize: 14,
    color: COLORS.sage,
  } as TextStyle,
  disclaimer: {
    fontFamily: FONTS.mono,
    fontSize: 10,
    color: 'rgba(245,237,216,0.2)',
    textAlign: 'center',
    marginTop: SPACING.md,
  } as TextStyle,
});
