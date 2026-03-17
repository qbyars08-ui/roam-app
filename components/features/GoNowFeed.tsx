// =============================================================================
// ROAM — Go Now Flight Deal Feed
// Shows best flight deals for user's saved destinations, sorted by deal score.
// =============================================================================
import React, { useCallback, useEffect, useMemo, useState } from 'react';
import {
  ImageBackground,
  Linking,
  Pressable,
  ScrollView,
  StyleSheet,
  Text,
  View,
  type TextStyle,
  type ViewStyle,
  type ImageStyle,
} from 'react-native';
import { LinearGradient } from 'expo-linear-gradient';
import { TrendingDown, ExternalLink, Calendar, Plane } from 'lucide-react-native';
import { useTranslation } from 'react-i18next';
import * as Haptics from '../../lib/haptics';
import { COLORS, FONTS, SPACING, RADIUS } from '../../lib/constants';
import { useAppStore } from '../../lib/store';
import { getDestinationPhoto } from '../../lib/photos';
import {
  getGoNowFeed,
  type GoNowFeedItem,
} from '../../lib/flight-intelligence';
import { captureEvent } from '../../lib/posthog';

// ---------------------------------------------------------------------------
// Deal Card
// ---------------------------------------------------------------------------
function DealCard({
  item,
  onPress,
}: {
  item: GoNowFeedItem;
  onPress: () => void;
}) {
  const { t } = useTranslation();
  const { deal } = item;
  const photoUrl = getDestinationPhoto(deal.destination);
  const savingsColor = deal.savingsPercent >= 20 ? COLORS.coral : COLORS.sage;

  return (
    <Pressable
      onPress={() => {
        Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Medium);
        onPress();
      }}
      style={({ pressed }) => [
        styles.dealCard,
        { opacity: pressed ? 0.9 : 1, transform: [{ scale: pressed ? 0.98 : 1 }] },
      ]}
    >
      <ImageBackground
        source={{ uri: photoUrl }}
        style={styles.dealImage}
        imageStyle={styles.dealImageInner}
        resizeMode="cover"
      >
        <LinearGradient
          colors={[COLORS.overlayFaint, COLORS.overlayMedium, COLORS.overlayDeep]}
          locations={[0, 0.4, 1]}
          style={styles.dealGradient}
        >
          {/* Deal badge */}
          <View style={[styles.dealBadge, { backgroundColor: savingsColor + '20', borderColor: savingsColor + '40' }]}>
            <TrendingDown size={12} color={savingsColor} strokeWidth={1.5} />
            <Text style={[styles.dealBadgeText, { color: savingsColor }]}>{item.hook}</Text>
          </View>

          {/* Route */}
          <Text style={styles.dealRoute}>
            {deal.originCode} {'\u2192'} {deal.destinationCode}
          </Text>
          <Text style={styles.dealDestination}>{deal.destination}</Text>

          {/* Price */}
          <View style={styles.dealPriceRow}>
            <Text style={styles.dealPrice}>${deal.estimatedPrice}</Text>
            <Text style={styles.dealAvgPrice}>{t('goNow.avg', { defaultValue: 'avg' })} ${deal.historicalAvgPrice}</Text>
          </View>

          {/* Best week */}
          <View style={styles.dealWeekRow}>
            <Calendar size={12} color={COLORS.creamMuted} strokeWidth={1.5} />
            <Text style={styles.dealWeekText}>{t('goNow.bestWeek', { defaultValue: 'Best week:' })} {deal.bestWeek}</Text>
          </View>

          {/* CTA */}
          <View style={styles.dealCta}>
            <ExternalLink size={12} color={COLORS.sage} strokeWidth={1.5} />
            <Text style={styles.dealCtaText}>{t('goNow.bookOnSkyscanner', { defaultValue: 'Book on Skyscanner' })}</Text>
          </View>
        </LinearGradient>
      </ImageBackground>
    </Pressable>
  );
}

// ---------------------------------------------------------------------------
// Go Now Feed Component
// ---------------------------------------------------------------------------
export default function GoNowFeed() {
  const { t } = useTranslation();
  const trips = useAppStore((s) => s.trips);
  const [deals, setDeals] = useState<GoNowFeedItem[]>([]);
  const [loading, setLoading] = useState(true);

  const savedDestinations = useMemo(
    () => [...new Set(trips.map((t) => t.destination))],
    [trips]
  );

  useEffect(() => {
    if (savedDestinations.length === 0) {
      setLoading(false);
      return;
    }
    getGoNowFeed(savedDestinations)
      .then((feed) => {
        setDeals(feed);
        setLoading(false);
      })
      .catch(() => setLoading(false));
  }, [savedDestinations]);

  const handleDealPress = useCallback((item: GoNowFeedItem) => {
    captureEvent('flight_deal_tapped', {
      destination: item.deal.destination,
      price: item.deal.estimatedPrice,
      dealScore: item.deal.dealScore,
    });
    Linking.openURL(item.deal.skyscannerUrl).catch(() => {});
  }, []);

  if (loading || deals.length === 0) return null;

  return (
    <View style={styles.container}>
      <View style={styles.header}>
        <View style={styles.headerLeft}>
          <Plane size={16} color={COLORS.coral} strokeWidth={1.5} />
          <Text style={styles.headerTitle}>{t('goNow.title', { defaultValue: 'Go Now' })}</Text>
        </View>
        <Text style={styles.headerSub}>{t('goNow.subtitle', { defaultValue: 'Best deals for your saved destinations' })}</Text>
      </View>

      <ScrollView
        horizontal
        showsHorizontalScrollIndicator={false}
        contentContainerStyle={styles.scrollContent}
      >
        {deals.map((item) => (
          <DealCard
            key={item.deal.id}
            item={item}
            onPress={() => handleDealPress(item)}
          />
        ))}
      </ScrollView>
    </View>
  );
}

// ---------------------------------------------------------------------------
// Styles
// ---------------------------------------------------------------------------
const styles = StyleSheet.create({
  container: {
    marginBottom: SPACING.lg,
  } as ViewStyle,
  header: {
    paddingHorizontal: SPACING.lg,
    marginBottom: SPACING.md,
  } as ViewStyle,
  headerLeft: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: SPACING.sm,
  } as ViewStyle,
  headerTitle: {
    fontFamily: FONTS.header,
    fontSize: 20,
    color: COLORS.cream,
  } as TextStyle,
  headerSub: {
    fontFamily: FONTS.body,
    fontSize: 12,
    color: COLORS.creamMuted,
    marginTop: SPACING.xs,
  } as TextStyle,
  scrollContent: {
    paddingHorizontal: SPACING.lg,
    gap: SPACING.md,
  } as ViewStyle,
  // Deal card
  dealCard: {
    width: 260,
    borderRadius: RADIUS.lg,
    overflow: 'hidden',
    borderWidth: 1,
    borderColor: COLORS.border,
  } as ViewStyle,
  dealImage: {
    minHeight: 200,
  } as ViewStyle,
  dealImageInner: {
    borderRadius: RADIUS.lg,
  } as ImageStyle,
  dealGradient: {
    minHeight: 200,
    padding: SPACING.md,
    justifyContent: 'flex-end',
    gap: SPACING.xs,
  } as ViewStyle,
  dealBadge: {
    flexDirection: 'row',
    alignItems: 'center',
    alignSelf: 'flex-start',
    gap: SPACING.xs,
    paddingHorizontal: SPACING.sm,
    paddingVertical: SPACING.xs,
    borderRadius: RADIUS.full,
    borderWidth: 1,
    marginBottom: SPACING.xs,
  } as ViewStyle,
  dealBadgeText: {
    fontFamily: FONTS.mono,
    fontSize: 10,
    letterSpacing: 0.3,
  } as TextStyle,
  dealRoute: {
    fontFamily: FONTS.mono,
    fontSize: 11,
    color: COLORS.creamMuted,
    letterSpacing: 1,
  } as TextStyle,
  dealDestination: {
    fontFamily: FONTS.header,
    fontSize: 20,
    color: COLORS.cream,
  } as TextStyle,
  dealPriceRow: {
    flexDirection: 'row',
    alignItems: 'baseline',
    gap: SPACING.sm,
    marginTop: SPACING.xs,
  } as ViewStyle,
  dealPrice: {
    fontFamily: FONTS.mono,
    fontSize: 22,
    color: COLORS.cream,
    letterSpacing: -0.5,
  } as TextStyle,
  dealAvgPrice: {
    fontFamily: FONTS.mono,
    fontSize: 11,
    color: COLORS.creamMuted,
    textDecorationLine: 'line-through',
  } as TextStyle,
  dealWeekRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: SPACING.xs,
    marginTop: SPACING.xs,
  } as ViewStyle,
  dealWeekText: {
    fontFamily: FONTS.mono,
    fontSize: 10,
    color: COLORS.creamMuted,
    letterSpacing: 0.3,
  } as TextStyle,
  dealCta: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: SPACING.xs,
    marginTop: SPACING.xs,
  } as ViewStyle,
  dealCtaText: {
    fontFamily: FONTS.bodySemiBold,
    fontSize: 12,
    color: COLORS.sage,
  } as TextStyle,
});
