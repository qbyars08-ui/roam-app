// =============================================================================
// ROAM — Venue Card (Google Places enriched data)
// =============================================================================
import React, { memo, useCallback } from 'react';
import {
  Image,
  Linking,
  StyleSheet,
  Text,
  View,
  type ImageStyle,
  type TextStyle,
  type ViewStyle,
} from 'react-native';
import { useTranslation } from 'react-i18next';
import { LinearGradient } from 'expo-linear-gradient';
import { MapPin } from 'lucide-react-native';
import { COLORS, FONTS, SPACING, RADIUS, AFFILIATES } from '../../lib/constants';
import SafetyBadge from './SafetyBadge';
import Button from '../ui/Button';

// ---------------------------------------------------------------------------
// Types
// ---------------------------------------------------------------------------

interface VenueCardProps {
  name: string;
  photo_url: string | null;
  rating: number | null;
  reviews_count: number | null;
  address: string | null;
  open_now: boolean | null;
  hours_today: string | null;
  maps_url: string;
  booking_url?: string;
  /** City for neighborhood safety badge */
  city?: string;
}

// ---------------------------------------------------------------------------
// Helpers
// ---------------------------------------------------------------------------

function renderStars(rating: number): string {
  const full = Math.floor(rating);
  const half = rating - full >= 0.5 ? 1 : 0;
  const empty = 5 - full - half;
  return '\u2605'.repeat(full) + (half ? '\u00BD' : '') + '\u2606'.repeat(empty);
}

function formatReviewCount(count: number): string {
  if (count >= 1000) {
    return `${(count / 1000).toFixed(1).replace(/\.0$/, '')}k`;
  }
  return count.toLocaleString();
}

// ---------------------------------------------------------------------------
// Component
// ---------------------------------------------------------------------------

function VenueCardInner({
  name,
  photo_url,
  rating,
  reviews_count,
  address,
  open_now,
  hours_today,
  maps_url,
  booking_url,
  city,
}: VenueCardProps) {
  const { t } = useTranslation();
  const handleOpenMaps = useCallback(() => {
    Linking.openURL(maps_url).catch(() => {});
  }, [maps_url]);

  const handleBook = useCallback(() => {
    const url =
      booking_url ??
      `${AFFILIATES.getyourguide}${encodeURIComponent(name)}`;
    Linking.openURL(url).catch(() => {});
  }, [booking_url, name]);

  return (
    <View style={styles.container}>
      {/* Photo */}
      <View style={styles.photoContainer}>
        {photo_url ? (
          <Image
            source={{ uri: photo_url }}
            style={styles.photo}
            resizeMode="cover"
          />
        ) : (
          <LinearGradient
            colors={[COLORS.gradientCardDeep, COLORS.gradientCard]}
            style={styles.placeholderGradient}
          >
            <MapPin size={40} color={COLORS.creamMuted} strokeWidth={1.5} />
          </LinearGradient>
        )}
      </View>

      {/* Content */}
      <View style={styles.content}>
        {/* Name */}
        <Text style={styles.name} numberOfLines={2}>
          {name}
        </Text>

        {/* Safety badge — neighborhood score */}
        {city && <SafetyBadge city={city} compact />}

        {/* Rating */}
        {rating != null && (
          <View style={styles.ratingRow}>
            <Text style={styles.stars}>{renderStars(rating)}</Text>
            <Text style={styles.ratingNumber}>{rating.toFixed(1)}</Text>
            {reviews_count != null && (
              <Text style={styles.reviewCount}>
                ({formatReviewCount(reviews_count)})
              </Text>
            )}
          </View>
        )}

        {/* Address */}
        {address && (
          <Text style={styles.address} numberOfLines={2}>
            {address}
          </Text>
        )}

        {/* Open/Closed status */}
        {open_now != null && (
          <View style={styles.statusRow}>
            <View style={open_now ? styles.openBadge : styles.closedBadge}>
              <Text style={open_now ? styles.openText : styles.closedText}>
                {open_now ? t('venue.open', { defaultValue: 'OPEN' }) : t('venue.closed', { defaultValue: 'CLOSED' })}
              </Text>
            </View>
            {hours_today && (
              <Text style={styles.hoursText}>{hours_today}</Text>
            )}
          </View>
        )}

        {/* Action buttons */}
        <View style={styles.buttonRow}>
          <View style={styles.buttonWrapper}>
            <Button label={t('venue.maps', { defaultValue: 'Maps' })} variant="ghost" onPress={handleOpenMaps} />
          </View>
          <View style={styles.buttonWrapper}>
            <Button label={t('venue.book', { defaultValue: 'Book' })} variant="coral" onPress={handleBook} />
          </View>
        </View>
      </View>
    </View>
  );
}

const VenueCard = memo(VenueCardInner);
export default VenueCard;

// ---------------------------------------------------------------------------
// Styles
// ---------------------------------------------------------------------------
const styles = StyleSheet.create({
  container: {
    backgroundColor: COLORS.bgCard,
    borderRadius: RADIUS.lg,
    borderWidth: 1,
    borderColor: COLORS.border,
    overflow: 'hidden',
    marginTop: SPACING.sm,
  } as ViewStyle,

  // Photo
  photoContainer: {
    width: '100%',
    height: 120,
  } as ViewStyle,
  photo: {
    width: '100%',
    height: '100%',
  } as ImageStyle,
  placeholderGradient: {
    width: '100%',
    height: '100%',
    alignItems: 'center',
    justifyContent: 'center',
  } as ViewStyle,

  // Content
  content: {
    padding: SPACING.md,
  } as ViewStyle,
  name: {
    fontFamily: FONTS.bodySemiBold,
    fontSize: 16,
    color: COLORS.cream,
    marginBottom: SPACING.xs,
  } as TextStyle,

  // Rating
  ratingRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: SPACING.xs,
    marginBottom: SPACING.sm,
  } as ViewStyle,
  stars: {
    fontFamily: FONTS.body,
    fontSize: 14,
    color: COLORS.sage,
  } as TextStyle,
  ratingNumber: {
    fontFamily: FONTS.monoMedium,
    fontSize: 13,
    color: COLORS.cream,
  } as TextStyle,
  reviewCount: {
    fontFamily: FONTS.mono,
    fontSize: 12,
    color: COLORS.creamMuted,
  } as TextStyle,

  // Address
  address: {
    fontFamily: FONTS.body,
    fontSize: 13,
    color: COLORS.cream,
    opacity: 0.7,
    lineHeight: 18,
    marginBottom: SPACING.sm,
  } as TextStyle,

  // Status
  statusRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: SPACING.sm,
    marginBottom: SPACING.sm,
  } as ViewStyle,
  openBadge: {
    backgroundColor: COLORS.sageLight,
    borderRadius: RADIUS.sm,
    paddingHorizontal: 6,
    paddingVertical: 2,
  } as ViewStyle,
  closedBadge: {
    backgroundColor: COLORS.coralLight,
    borderRadius: RADIUS.sm,
    paddingHorizontal: 6,
    paddingVertical: 2,
  } as ViewStyle,
  openText: {
    fontFamily: FONTS.mono,
    fontSize: 10,
    color: COLORS.sage,
    letterSpacing: 0.5,
  } as TextStyle,
  closedText: {
    fontFamily: FONTS.mono,
    fontSize: 10,
    color: COLORS.coral,
    letterSpacing: 0.5,
  } as TextStyle,
  hoursText: {
    fontFamily: FONTS.body,
    fontSize: 12,
    color: COLORS.creamMuted,
  } as TextStyle,

  // Buttons
  buttonRow: {
    flexDirection: 'row',
    gap: SPACING.sm,
    marginTop: SPACING.sm,
  } as ViewStyle,
  buttonWrapper: {
    flex: 1,
  } as ViewStyle,
});
