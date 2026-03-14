// =============================================================================
// ROAM — Premium destination card with 3D tilt on hover, glass overlay
// =============================================================================
import React, { memo, useState } from 'react';
import {
  View,
  Text,
  Pressable,
  ImageBackground,
  StyleSheet,
  Dimensions,
  Platform,
} from 'react-native';
import { LinearGradient } from 'expo-linear-gradient';
import { COLORS, FONTS, SPACING, RADIUS } from '../../lib/constants';
import { DESTINATION_META } from '../../lib/destination-meta';
import { getDestinationPhoto } from '../../lib/photos';
import type { Destination } from '../../lib/constants';

const CARD_GAP = 12;
const getCardWidth = () => {
  const { width } = Dimensions.get('window');
  return (width - SPACING.lg * 2 - CARD_GAP) / 2;
};

interface Props {
  dest: Destination;
  photoUrl?: string | null;
  onPress: () => void;
  size?: 'small' | 'large';
}

function DestinationCardInner({ dest, photoUrl: photoUrlProp, onPress, size = 'small' }: Props) {
  const photoUrl = photoUrlProp ?? getDestinationPhoto(dest.label);
  const meta = DESTINATION_META[dest.label];
  const [hover, setHover] = useState(false);

  const cardWidth = getCardWidth();
  const isLarge = size === 'large';
  const cardStyle = isLarge
    ? { width: cardWidth * 2 + CARD_GAP, aspectRatio: 1.4 }
    : { width: cardWidth, aspectRatio: 0.9 };

  const handleHoverIn = () => setHover(true);
  const handleHoverOut = () => setHover(false);

  const content = (
    <View style={[styles.card, cardStyle]}>
      <ImageBackground
        source={{ uri: photoUrl }}
          style={styles.image}
          imageStyle={styles.imageInner}
          resizeMode="cover"
        >
          <LinearGradient
            colors={['transparent', COLORS.overlayLight, COLORS.overlayFull]}
            locations={[0.3, 0.7, 1]}
            style={styles.gradient}
          >
            {meta && (
              <View style={styles.badges}>
                <View style={styles.badge}>
                  <Text style={styles.badgeText}>{meta.safetyScore}/5</Text>
                </View>
                <View style={styles.badge}>
                  <Text style={styles.badgeText}>{meta.avgDailyCost}</Text>
                </View>
                <View style={styles.badge}>
                  <Text style={styles.badgeText}>Best: {meta.bestMonth}</Text>
                </View>
              </View>
            )}
            <Text style={styles.label}>{dest.label}</Text>
            <Text style={styles.hook}>{dest.hook}</Text>
          </LinearGradient>
        </ImageBackground>
    </View>
  );

  type PressableProps = React.ComponentProps<typeof Pressable> & { onMouseEnter?: () => void; onMouseLeave?: () => void };
  const pressableProps: PressableProps = {
    onPress,
    style: ({ pressed }: { pressed: boolean }) => [
      styles.wrapper,
      {
        transform: [
          { scale: pressed ? 0.97 : hover ? 1.03 : 1 },
          { translateY: hover ? -4 : 0 },
        ],
      },
    ],
  };

  if (Platform.OS === 'web') {
    pressableProps.onMouseEnter = handleHoverIn;
    pressableProps.onMouseLeave = handleHoverOut;
  }

  return (
    <Pressable {...pressableProps}>
      {content}
    </Pressable>
  );
}

const DestinationCard = memo(DestinationCardInner);
export default DestinationCard;

const styles = StyleSheet.create({
  wrapper: {
    borderRadius: RADIUS.xl,
    overflow: 'hidden',
  },
  card: {
    borderRadius: RADIUS.xl,
    overflow: 'hidden',
  },
  image: {
    flex: 1,
    justifyContent: 'flex-end',
  },
  imageInner: {
    borderRadius: RADIUS.xl,
  },
  gradient: {
    padding: SPACING.md,
  },
  placeholder: {
    flex: 1,
    justifyContent: 'flex-end',
    padding: SPACING.md,
  },
  badges: {
    flexDirection: 'row',
    gap: 6,
    marginBottom: SPACING.sm,
    flexWrap: 'wrap',
  },
  badge: {
    backgroundColor: COLORS.whiteMuted,
    paddingHorizontal: 8,
    paddingVertical: 4,
    borderRadius: 6,
  },
  badgeText: {
    fontFamily: FONTS.mono,
    fontSize: 10,
    color: COLORS.cream,
  },
  label: {
    fontFamily: FONTS.header,
    fontSize: 22,
    color: COLORS.cream,
    letterSpacing: 0.5,
  },
  hook: {
    fontFamily: FONTS.body,
    fontSize: 12,
    color: COLORS.creamMuted,
    marginTop: 4,
  },
});
