// =============================================================================
// ShareCard — Shareable trip card for Instagram/social media
// Renders offscreen, captured with react-native-view-shot
// =============================================================================

import React, { useCallback, useMemo, useRef } from 'react';
import { Image, StyleSheet, Text, View } from 'react-native';
import { LinearGradient } from 'expo-linear-gradient';
import ViewShot from 'react-native-view-shot';
import { useTranslation } from 'react-i18next';

import { COLORS, FONTS, RADIUS, SPACING } from '../lib/constants';
import { getDestinationPhoto } from '../lib/photos';

// ---------------------------------------------------------------------------
// Types
// ---------------------------------------------------------------------------

interface ShareCardProps {
  destination: string;
  days: number;
  activities: string[]; // top 3 activity names
  photoUrl?: string;
  onCapture?: (uri: string) => void;
}

// ---------------------------------------------------------------------------
// Constants
// ---------------------------------------------------------------------------

const CARD_WIDTH = 390;
const CARD_HEIGHT = 205;
const CAPTURE_SCALE = 3;

// ---------------------------------------------------------------------------
// Helper: capture and share via expo-sharing
// ---------------------------------------------------------------------------

export async function captureAndShare(viewRef: React.RefObject<ViewShot>) {
  if (!viewRef.current?.capture) return;
  const uri = await viewRef.current.capture();
  const { default: Sharing } = await import('expo-sharing');
  if (await Sharing.isAvailableAsync()) {
    await Sharing.shareAsync(uri);
  }
}

// ---------------------------------------------------------------------------
// Component
// ---------------------------------------------------------------------------

function ShareCard({
  destination,
  days,
  activities,
  photoUrl,
  onCapture,
}: ShareCardProps) {
  const { t } = useTranslation();
  const viewRef = useRef<ViewShot>(null);

  const resolvedPhotoUrl = useMemo(
    () => photoUrl ?? getDestinationPhoto(destination),
    [photoUrl, destination],
  );

  const topActivities = useMemo(
    () => activities.slice(0, 3),
    [activities],
  );

  const subtitle = useMemo(
    () => `${days} day${days !== 1 ? 's' : ''} in ${destination}`,
    [days, destination],
  );

  const capture = useCallback(async () => {
    if (!viewRef.current?.capture) return;
    const uri = await viewRef.current.capture();
    onCapture?.(uri);
  }, [onCapture]);

  return (
    <ViewShot
      ref={viewRef}
      options={{
        format: 'png',
        quality: 1,
        width: CARD_WIDTH * CAPTURE_SCALE,
        height: CARD_HEIGHT * CAPTURE_SCALE,
      }}
      style={styles.container}
    >
      {/* Full-bleed destination photo */}
      <Image
        source={{ uri: resolvedPhotoUrl }}
        style={styles.backgroundImage}
        resizeMode="cover"
      />

      {/* Gradient overlay: transparent top -> dark bottom */}
      <LinearGradient
        colors={['transparent', 'rgba(10,10,10,0.85)']}
        locations={[0.2, 0.8]}
        style={styles.gradient}
      />

      {/* Content layer */}
      <View style={styles.content}>
        {/* Bottom left: destination info + activity pills */}
        <View style={styles.bottomLeft}>
          <Text style={styles.destinationName}>{destination}</Text>
          <Text style={styles.subtitle}>{subtitle}</Text>

          {topActivities.length > 0 && (
            <View style={styles.pillRow}>
              {topActivities.map((activity) => (
                <View key={activity} style={styles.pill}>
                  <Text style={styles.pillText}>{activity}</Text>
                </View>
              ))}
            </View>
          )}
        </View>

        {/* Bottom right: branding */}
        <View style={styles.bottomRight}>
          <View style={styles.brandRow}>
            <View style={styles.compassDot} />
            <Text style={styles.brandText}>{t('share.madeWithRoam', { defaultValue: 'Made with ROAM' })}</Text>
          </View>
        </View>
      </View>
    </ViewShot>
  );
}

// ---------------------------------------------------------------------------
// Styles
// ---------------------------------------------------------------------------

const styles = StyleSheet.create({
  container: {
    width: CARD_WIDTH,
    height: CARD_HEIGHT,
    borderRadius: RADIUS.lg,
    overflow: 'hidden',
    backgroundColor: COLORS.bg,
    position: 'absolute',
    left: -9999,
    top: -9999,
  },
  backgroundImage: {
    ...StyleSheet.absoluteFillObject,
    width: CARD_WIDTH,
    height: CARD_HEIGHT,
  },
  gradient: {
    ...StyleSheet.absoluteFillObject,
  },
  content: {
    ...StyleSheet.absoluteFillObject,
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'flex-end',
    padding: SPACING.md,
  },
  bottomLeft: {
    flex: 1,
    marginRight: 12,
  },
  destinationName: {
    fontFamily: FONTS.header,
    fontSize: 32,
    color: COLORS.cream,
    lineHeight: 36,
  },
  subtitle: {
    fontFamily: FONTS.body,
    fontSize: 13,
    color: COLORS.creamDim,
    marginTop: 2,
  },
  pillRow: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 6,
    marginTop: SPACING.sm,
  },
  pill: {
    borderWidth: 1,
    borderColor: COLORS.sage,
    borderRadius: RADIUS.lg,
    paddingHorizontal: 10,
    paddingVertical: 4,
  },
  pillText: {
    fontFamily: FONTS.body,
    fontSize: 11,
    color: COLORS.cream,
  },
  bottomRight: {
    alignItems: 'flex-end',
    justifyContent: 'flex-end',
  },
  brandRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
  },
  compassDot: {
    width: 8,
    height: 8,
    borderRadius: 4,
    backgroundColor: COLORS.sage,
  },
  brandText: {
    fontFamily: FONTS.body,
    fontSize: 10,
    color: COLORS.creamDim,
  },
});

export default ShareCard;
