// =============================================================================
// ROAM — PhotoSpotCard: curated photographer-worthy location card
// =============================================================================
import React, { useCallback } from 'react';
import { View, Text } from 'react-native';
import { Camera, Sun, Sunrise, Sunset, Moon, Circle } from 'lucide-react-native';
import { useTranslation } from 'react-i18next';
import { COLORS, FONTS, SPACING, RADIUS } from '../../lib/constants';
import PressableScale from '../ui/PressableScale';
import type { PhotoSpot } from '../../lib/photo-spots';
import { BEST_TIME_LABELS } from '../../lib/photo-spots';

// ---------------------------------------------------------------------------
// Props
// ---------------------------------------------------------------------------

interface PhotoSpotCardProps {
  spot: PhotoSpot;
  onPress?: (spot: PhotoSpot) => void;
}

// ---------------------------------------------------------------------------
// Best-time badge icon (Lucide, strokeWidth 1.5)
// ---------------------------------------------------------------------------

function BestTimeIcon({ bestTime }: { bestTime: PhotoSpot['bestTime'] }) {
  const props = { size: 12, strokeWidth: 1.5, color: COLORS.gold };

  switch (bestTime) {
    case 'sunrise':
      return <Sunrise {...props} />;
    case 'golden-hour':
      return <Sun {...props} />;
    case 'blue-hour':
      return <Sunset {...props} />;
    case 'night':
      return <Moon {...props} />;
    case 'anytime':
      return <Camera {...props} />;
  }
}

// ---------------------------------------------------------------------------
// Component
// ---------------------------------------------------------------------------

export default function PhotoSpotCard({ spot, onPress }: PhotoSpotCardProps) {
  const { t } = useTranslation();

  const handlePress = useCallback(() => {
    onPress?.(spot);
  }, [onPress, spot]);

  return (
    <PressableScale
      onPress={handlePress}
      style={{
        backgroundColor: COLORS.surface1,
        borderRadius: RADIUS.md,
        borderWidth: 1,
        borderColor: COLORS.border,
        padding: SPACING.md,
        gap: SPACING.sm,
      }}
    >
      {/* Header row: camera icon + spot name + free badge */}
      <View style={{ flexDirection: 'row', alignItems: 'flex-start', gap: SPACING.sm }}>
        <View
          style={{
            width: 28,
            height: 28,
            borderRadius: RADIUS.sm,
            backgroundColor: COLORS.sageSubtle,
            alignItems: 'center',
            justifyContent: 'center',
            marginTop: 1,
          }}
        >
          <Camera size={14} strokeWidth={1.5} color={COLORS.sage} />
        </View>

        <View style={{ flex: 1, gap: 2 }}>
          <Text
            style={{
              fontFamily: FONTS.headerMedium,
              fontSize: 15,
              color: COLORS.cream,
              lineHeight: 20,
            }}
            numberOfLines={2}
          >
            {spot.name}
          </Text>

          {/* Best time badge */}
          <View
            style={{
              flexDirection: 'row',
              alignItems: 'center',
              gap: 4,
              alignSelf: 'flex-start',
              backgroundColor: COLORS.goldSubtle,
              borderRadius: RADIUS.pill,
              borderWidth: 1,
              borderColor: COLORS.goldBorder,
              paddingHorizontal: 7,
              paddingVertical: 3,
            }}
          >
            <BestTimeIcon bestTime={spot.bestTime} />
            <Text
              style={{
                fontFamily: FONTS.mono,
                fontSize: 10,
                color: COLORS.gold,
                letterSpacing: 0.2,
              }}
            >
              {BEST_TIME_LABELS[spot.bestTime]}
            </Text>
          </View>
        </View>

        {/* Free entry badge */}
        {spot.freeEntry && (
          <View style={{ flexDirection: 'row', alignItems: 'center', gap: 4, marginTop: 2 }}>
            <Circle size={7} strokeWidth={0} color={COLORS.sage} fill={COLORS.sage} />
            <Text
              style={{
                fontFamily: FONTS.mono,
                fontSize: 10,
                color: COLORS.sage,
              }}
            >
              {t('photoSpots.free', { defaultValue: 'Free' })}
            </Text>
          </View>
        )}
      </View>

      {/* Description */}
      <Text
        style={{
          fontFamily: FONTS.body,
          fontSize: 13,
          color: COLORS.creamDim,
          lineHeight: 19,
        }}
      >
        {spot.description}
      </Text>

      {/* Divider */}
      <View
        style={{
          height: 1,
          backgroundColor: COLORS.border,
        }}
      />

      {/* Local tip */}
      <View style={{ gap: 3 }}>
        <Text
          style={{
            fontFamily: FONTS.mono,
            fontSize: 10,
            color: COLORS.muted,
            letterSpacing: 0.3,
          }}
        >
          {t('photoSpots.localTipLabel', { defaultValue: 'LOCAL TIP' })}
        </Text>
        <Text
          style={{
            fontFamily: FONTS.mono,
            fontSize: 10,
            color: COLORS.creamDim,
            lineHeight: 16,
          }}
        >
          {spot.tipFromLocal}
        </Text>
      </View>

      {/* Hashtag */}
      <Text
        style={{
          fontFamily: FONTS.mono,
          fontSize: 10,
          color: COLORS.sage,
        }}
      >
        {spot.instagramHashtag}
      </Text>
    </PressableScale>
  );
}
