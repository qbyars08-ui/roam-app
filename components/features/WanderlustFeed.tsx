// =============================================================================
// ROAM — WanderlustFeed
// A vertical scrolling feed of destination moments.
// Not for planning. Just: places being beautiful right now.
// =============================================================================

import React, { useCallback, useMemo } from 'react';
import { useTranslation } from 'react-i18next';
import {
  Image,
  Pressable,
  ScrollView,
  StyleSheet,
  Text,
  View,
} from 'react-native';
import { LinearGradient } from 'expo-linear-gradient';
import { Heart } from 'lucide-react-native';
import * as Haptics from '../../lib/haptics';
import { COLORS, FONTS, RADIUS, SPACING } from '../../lib/constants';
import {
  getWanderlustFeed,
  getMomentTimeDisplay,
  type DailyMoment,
} from '../../lib/daily-moment';

// ---------------------------------------------------------------------------
// Types
// ---------------------------------------------------------------------------
interface WanderlustFeedProps {
  onDream?: (destination: string) => void;
}

// ---------------------------------------------------------------------------
// Sub-component: individual card
// ---------------------------------------------------------------------------
interface MomentCardProps {
  moment: DailyMoment;
  onDream: (destination: string) => void;
}

function MomentCard({ moment, onDream }: MomentCardProps): React.JSX.Element {
  const { t } = useTranslation();
  const timeDisplay = useMemo<string>(() => getMomentTimeDisplay(moment), [moment]);

  const handleDream = useCallback(() => {
    Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light).catch(() => {});
    onDream(moment.destination);
  }, [moment.destination, onDream]);

  return (
    <View style={styles.card}>
      {/* Full-width destination photo */}
      <Image
        source={{ uri: moment.photoUrl }}
        style={styles.photo}
        resizeMode="cover"
      />

      {/* Dark gradient overlay — bottom to top */}
      <LinearGradient
        colors={[COLORS.overlayDark, COLORS.transparent]}
        start={{ x: 0, y: 1 }}
        end={{ x: 0, y: 0 }}
        style={styles.gradient}
        pointerEvents="none"
      />

      {/* Bottom content row */}
      <View style={styles.bottomRow}>
        {/* Left: destination info */}
        <View style={styles.leftContent}>
          <Text style={styles.destinationName} numberOfLines={1}>
            {moment.destination}
          </Text>
          <Text style={styles.conditions} numberOfLines={1}>
            {`${t('wanderlust.rightNow', { defaultValue: 'Right now' })} · ${timeDisplay}`}
          </Text>
          <Text style={styles.momentLine} numberOfLines={2}>
            {moment.line}
          </Text>
        </View>

        {/* Right: dream CTA */}
        <Pressable
          style={styles.dreamButton}
          onPress={handleDream}
          hitSlop={12}
        >
          <Heart
            size={16}
            color={COLORS.sage}
            strokeWidth={1.5}
          />
          <Text style={styles.dreamText}>{t('wanderlust.dreamAboutThis', { defaultValue: 'Dream about this' })}</Text>
          <Text style={styles.dreamArrow}>→</Text>
        </Pressable>
      </View>
    </View>
  );
}

// ---------------------------------------------------------------------------
// Main component
// ---------------------------------------------------------------------------
export default function WanderlustFeed({ onDream }: WanderlustFeedProps): React.JSX.Element {
  const moments = useMemo<DailyMoment[]>(() => getWanderlustFeed(8), []);

  const handleDream = useCallback((destination: string) => {
    onDream?.(destination);
  }, [onDream]);

  return (
    <ScrollView
      style={styles.container}
      contentContainerStyle={styles.contentContainer}
      showsVerticalScrollIndicator={false}
    >
      {moments.map((moment, index) => (
        <MomentCard
          key={`${moment.destination}-${index}`}
          moment={moment}
          onDream={handleDream}
        />
      ))}
    </ScrollView>
  );
}

// ---------------------------------------------------------------------------
// Styles
// ---------------------------------------------------------------------------
const styles = StyleSheet.create({
  container: {
    flex: 1,
  },
  contentContainer: {
    gap: SPACING.md,
    paddingVertical: SPACING.md,
  },

  // Card
  card: {
    width: '100%',
    height: 280,
    borderRadius: RADIUS.lg,
    overflow: 'hidden',
    backgroundColor: COLORS.bgCard,
  },
  photo: {
    position: 'absolute',
    top: 0,
    left: 0,
    width: '100%',
    height: '100%',
  },
  gradient: {
    position: 'absolute',
    left: 0,
    right: 0,
    bottom: 0,
    height: 200,
  },

  // Bottom content
  bottomRow: {
    position: 'absolute',
    bottom: SPACING.md,
    left: SPACING.md,
    right: SPACING.md,
    flexDirection: 'row',
    alignItems: 'flex-end',
    justifyContent: 'space-between',
  },
  leftContent: {
    flex: 1,
    marginRight: SPACING.sm,
  },
  destinationName: {
    fontFamily: FONTS.header,
    fontSize: 28,
    color: COLORS.cream,
    lineHeight: 32,
    marginBottom: 2,
  },
  conditions: {
    fontFamily: FONTS.mono,
    fontSize: 11,
    color: COLORS.creamSoft,
    letterSpacing: 0.3,
    marginBottom: SPACING.xs,
  },
  momentLine: {
    fontFamily: FONTS.body,
    fontSize: 14,
    color: COLORS.creamBright,
    lineHeight: 20,
  },

  // Dream CTA
  dreamButton: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
    paddingVertical: 6,
    paddingHorizontal: 10,
    borderRadius: RADIUS.sm,
    backgroundColor: COLORS.sageLight,
    borderWidth: 1,
    borderColor: COLORS.sageBorder,
    flexShrink: 0,
  },
  dreamText: {
    fontFamily: FONTS.body,
    fontSize: 12,
    color: COLORS.sage,
  },
  dreamArrow: {
    fontFamily: FONTS.body,
    fontSize: 12,
    color: COLORS.sage,
  },
});
