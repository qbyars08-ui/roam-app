// =============================================================================
// ROAM — "Surprise Me" card + Reveal Modal
// Full-width 100px card, rotating destination photos, Space Grotesk
// Never black. Real photos only.
// =============================================================================
import React, { memo, useState, useCallback, useRef, useEffect } from 'react';
import { useTranslation } from 'react-i18next';
import {
  View,
  Text,
  Pressable,
  StyleSheet,
  Modal,
  Animated,
  ImageBackground,
  Dimensions,
  type ViewStyle,
  type TextStyle,
  type ImageStyle,
} from 'react-native';
import { LinearGradient } from 'expo-linear-gradient';
import * as Haptics from '../../lib/haptics';
import { useRouter } from 'expo-router';
import Svg, { Path } from 'react-native-svg';
import { COLORS, FONTS, SPACING, RADIUS, DESTINATIONS, HIDDEN_DESTINATIONS } from '../../lib/constants';
import { useAppStore } from '../../lib/store';
import { getSurpriseDestination, generatePickReason, getVibeCheck } from '../../lib/recommendations';
import { getDestinationPhoto } from '../../lib/photos';
import { useCurrency } from './CurrencyToggle';
import { formatUSD } from '../../lib/currency';

const { width: SCREEN_WIDTH } = Dimensions.get('window');

// Pool of destination photos for rotating background
const ROTATING_PHOTOS = [...DESTINATIONS, ...HIDDEN_DESTINATIONS]
  .map((d) => getDestinationPhoto(d.label));

function ArrowIcon({ size = 20, color = COLORS.cream }: { size?: number; color?: string }) {
  return (
    <Svg width={size} height={size} viewBox="0 0 24 24" fill="none" stroke={color} strokeWidth={1.5} strokeLinecap="round" strokeLinejoin="round">
      <Path d="M5 12h14M12 5l7 7-7 7" />
    </Svg>
  );
}

interface Props {
  photoUrls?: Map<string, string | null>;
}

export default function SurpriseMe({ photoUrls: _photoUrls }: Props) {
  const { t } = useTranslation();
  const router = useRouter();
  const setPlanWizard = useAppStore((s) => s.setPlanWizard);
  const travelProfile = useAppStore((s) => s.travelProfile);
  const { currency, rates } = useCurrency();

  const [showModal, setShowModal] = useState(false);
  const [loading, setLoading] = useState(false);
  const [result, setResult] = useState<{
    destination: import('../../lib/constants').Destination;
    score: number;
    reasons: string[];
  } | null>(null);

  // Rotating photo — changes every 5 seconds
  const [bgPhotoIndex, setBgPhotoIndex] = useState(0);
  const bgPhoto = ROTATING_PHOTOS[bgPhotoIndex % ROTATING_PHOTOS.length] ?? getDestinationPhoto('Tokyo');
  useEffect(() => {
    const interval = setInterval(() => {
      setBgPhotoIndex((i) => i + 1);
    }, 5000);
    return () => clearInterval(interval);
  }, []);

  // Reveal animation
  const revealAnim = useRef(new Animated.Value(0)).current;
  const scaleAnim = useRef(new Animated.Value(0.8)).current;

  const handleSurprise = useCallback(async () => {
    Haptics.notificationAsync(Haptics.NotificationFeedbackType.Success);
    setLoading(true);
    setShowModal(true);
    revealAnim.setValue(0);
    scaleAnim.setValue(0.8);

    try {
      const surprise = await getSurpriseDestination();
      setResult(surprise);

      Animated.parallel([
        Animated.timing(revealAnim, {
          toValue: 1,
          duration: 600,
          useNativeDriver: true,
        }),
        Animated.spring(scaleAnim, {
          toValue: 1,
          friction: 5,
          tension: 40,
          useNativeDriver: true,
        }),
      ]).start();
    } catch {
      setResult(null);
    } finally {
      setLoading(false);
    }
  }, [revealAnim, scaleAnim]);

  const handlePlanTrip = useCallback(() => {
    if (!result) return;
    Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Medium);
    setPlanWizard({ destination: result.destination.label });
    setShowModal(false);
    router.push('/(tabs)/generate' as never);
  }, [result, setPlanWizard, router]);

  const handleTryAgain = useCallback(() => {
    handleSurprise();
  }, [handleSurprise]);

  const shimmerAnim = useRef(new Animated.Value(0)).current;
  useEffect(() => {
    const loop = Animated.loop(
      Animated.sequence([
        Animated.timing(shimmerAnim, { toValue: 1, duration: 2000, useNativeDriver: true }),
        Animated.timing(shimmerAnim, { toValue: 0, duration: 2000, useNativeDriver: true }),
      ])
    );
    loop.start();
    return () => loop.stop();
  }, [shimmerAnim]);
  const shimmerOpacity = shimmerAnim.interpolate({
    inputRange: [0, 1],
    outputRange: [0, 0.15],
  });

  return (
    <>
      {/* Surprise Me Card — full width, 100px, rotating photo */}
      <Pressable
        style={({ pressed }) => [
          styles.surpriseCard,
          { opacity: pressed ? 0.92 : 1 },
        ]}
        onPress={handleSurprise}
      >
        <ImageBackground
          source={{ uri: bgPhoto }}
          style={styles.surpriseImage}
          imageStyle={styles.surpriseImageInner}
          resizeMode="cover"
        >
          <Animated.View style={[styles.shimmerOverlay, { opacity: shimmerOpacity }]} />
          <LinearGradient
            colors={[COLORS.overlayDarkDim, COLORS.overlayLight]}
            style={StyleSheet.absoluteFill}
          />
          <View style={styles.surpriseContent}>
            <View style={styles.surpriseTextCol}>
              <Text style={styles.surpriseLabel}>{t('surprise.surpriseMe', { defaultValue: 'Surprise me' })}</Text>
              <Text style={styles.surpriseDesc}>{t('surprise.pickSomething', { defaultValue: "We'll pick something perfect for you" })}</Text>
            </View>
            <ArrowIcon size={22} color={COLORS.cream} />
          </View>
        </ImageBackground>
      </Pressable>

      {/* Reveal Modal */}
      <Modal
        visible={showModal}
        animationType="fade"
        presentationStyle="overFullScreen"
        transparent
        onRequestClose={() => setShowModal(false)}
      >
        <View style={styles.modalOverlay}>
          <Pressable style={styles.modalBackdrop} onPress={() => setShowModal(false)} />

          {loading ? (
            <View style={styles.loadingCard}>
              <Text style={styles.loadingText}>{t('surprise.findingMatch', { defaultValue: 'Finding your perfect match' })}</Text>
              <Text style={styles.loadingSubtext}>{t('surprise.checkingDestinations', { defaultValue: 'Checking 40+ destinations for you' })}</Text>
            </View>
          ) : result ? (
            <Animated.View
              style={[
                styles.revealCard,
                { opacity: revealAnim, transform: [{ scale: scaleAnim }] },
              ]}
            >
              {(() => {
                const dest = result.destination;
                const photoUrl = getDestinationPhoto(dest.label);
                const reason = generatePickReason(result, travelProfile);
                const vibeCheck = getVibeCheck(dest);

                return (
                  <>
                    <ImageBackground
                      source={{ uri: photoUrl }}
                      style={styles.revealImage}
                      imageStyle={{ borderTopLeftRadius: RADIUS.xl, borderTopRightRadius: RADIUS.xl }}
                      resizeMode="cover"
                    >
                      <LinearGradient
                        colors={['transparent', COLORS.overlayStrong]}
                        style={styles.revealImageGradient}
                      >
                        <Text style={styles.revealName}>{dest.label}</Text>
                      </LinearGradient>
                    </ImageBackground>

                    <View style={styles.revealBody}>
                      <Text style={styles.revealHook}>{dest.hook}</Text>

                      <View style={styles.whyCard}>
                        <Text style={styles.whyLabel}>{t('surprise.whyWePickedThis', { defaultValue: 'WHY WE PICKED THIS' })}</Text>
                        <Text style={styles.whyText}>{reason}</Text>
                      </View>

                      <View style={styles.revealMeta}>
                        <View style={styles.metaItem}>
                          <Text style={styles.metaLabel}>{t('surprise.dailyCost', { defaultValue: 'Daily cost' })}</Text>
                          <Text style={styles.metaValue}>{rates && currency !== 'USD' ? formatUSD(dest.dailyCost, currency, rates) : `$${dest.dailyCost}`}</Text>
                        </View>
                        <View style={styles.metaItem}>
                          <Text style={styles.metaLabel}>{t('surprise.crowds', { defaultValue: 'Crowds' })}</Text>
                          <Text style={styles.metaValue}>{vibeCheck.crowdLevel}</Text>
                        </View>
                        <View style={styles.metaItem}>
                          <Text style={styles.metaLabel}>{t('surprise.bestTime', { defaultValue: 'Best time' })}</Text>
                          <Text style={styles.metaValue}>{vibeCheck.bestTimeToGo.split(', ').slice(0, 2).join(', ')}</Text>
                        </View>
                      </View>

                      <Pressable style={styles.planButton} onPress={handlePlanTrip}>
                        <Text style={styles.planButtonText}>{t('surprise.planThisTrip', { defaultValue: 'Plan this trip' })}</Text>
                      </Pressable>

                      <Pressable style={styles.tryAgainButton} onPress={handleTryAgain}>
                        <Text style={styles.tryAgainText}>{t('surprise.tryAgain', { defaultValue: 'Try again' })}</Text>
                      </Pressable>
                    </View>
                  </>
                );
              })()}
            </Animated.View>
          ) : null}
        </View>
      </Modal>
    </>
  );
}

// ---------------------------------------------------------------------------
// Styles
// ---------------------------------------------------------------------------
const styles = StyleSheet.create({
  surpriseCard: {
    marginHorizontal: SPACING.lg,
    marginTop: SPACING.md,
    marginBottom: SPACING.lg,
    height: 100,
    width: SCREEN_WIDTH - SPACING.lg * 2,
    alignSelf: 'center',
    borderRadius: RADIUS.lg,
    overflow: 'hidden',
  } as ViewStyle,
  surpriseImage: {
    flex: 1,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: SPACING.lg,
  } as ViewStyle,
  surpriseImageInner: {
    borderRadius: RADIUS.lg,
  } as ImageStyle,
  shimmerOverlay: {
    ...StyleSheet.absoluteFillObject,
    backgroundColor: COLORS.white,
  } as ViewStyle,
  surpriseContent: {
    flex: 1,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
  } as ViewStyle,
  surpriseTextCol: {},
  surpriseLabel: {
    fontFamily: FONTS.header,
    fontSize: 24,
    color: COLORS.cream,
  } as TextStyle,
  surpriseDesc: {
    fontFamily: FONTS.body,
    fontSize: 13,
    color: COLORS.creamBrightDim,
    marginTop: 2,
  } as TextStyle,

  modalOverlay: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
  } as ViewStyle,
  modalBackdrop: {
    ...StyleSheet.absoluteFillObject,
    backgroundColor: COLORS.overlayStrong,
  } as ViewStyle,

  loadingCard: {
    backgroundColor: COLORS.bgGlass,
    borderRadius: RADIUS.xl,
    borderWidth: 1,
    borderColor: COLORS.border,
    padding: SPACING.xxl,
    alignItems: 'center',
    gap: SPACING.sm,
    width: 300,
  } as ViewStyle,
  loadingText: {
    fontFamily: FONTS.bodyMedium,
    fontSize: 16,
    color: COLORS.cream,
    textAlign: 'center',
  } as TextStyle,
  loadingSubtext: {
    fontFamily: FONTS.body,
    fontSize: 13,
    color: COLORS.creamMuted,
  } as TextStyle,

  revealCard: {
    width: 340,
    maxHeight: '85%',
    backgroundColor: COLORS.bg,
    borderRadius: RADIUS.xl,
    borderWidth: 1,
    borderColor: COLORS.border,
    overflow: 'hidden',
  } as ViewStyle,
  revealImage: {
    height: 200,
    justifyContent: 'flex-end',
  } as ViewStyle,
  revealImageGradient: {
    ...StyleSheet.absoluteFillObject,
    justifyContent: 'flex-end',
    padding: SPACING.lg,
  } as ViewStyle,
  revealName: {
    fontFamily: FONTS.header,
    fontSize: 36,
    color: COLORS.cream,
  } as TextStyle,
  revealBody: {
    padding: SPACING.lg,
    gap: SPACING.md,
  } as ViewStyle,
  revealHook: {
    fontFamily: FONTS.body,
    fontSize: 16,
    color: COLORS.cream,
    lineHeight: 24,
  } as TextStyle,
  whyCard: {
    backgroundColor: COLORS.bgGlass,
    borderRadius: RADIUS.md,
    borderWidth: 1,
    borderColor: COLORS.border,
    padding: SPACING.md,
    gap: SPACING.xs,
  } as ViewStyle,
  whyLabel: {
    fontFamily: FONTS.mono,
    fontSize: 10,
    color: COLORS.sage,
    letterSpacing: 1.5,
  } as TextStyle,
  whyText: {
    fontFamily: FONTS.body,
    fontSize: 14,
    color: COLORS.cream,
    lineHeight: 20,
  } as TextStyle,
  revealMeta: {
    flexDirection: 'row',
    justifyContent: 'space-between',
  } as ViewStyle,
  metaItem: {
    alignItems: 'center',
    gap: 2,
  } as ViewStyle,
  metaLabel: {
    fontFamily: FONTS.mono,
    fontSize: 10,
    color: COLORS.creamMuted,
    letterSpacing: 0.5,
    textTransform: 'uppercase',
  } as TextStyle,
  metaValue: {
    fontFamily: FONTS.bodySemiBold,
    fontSize: 14,
    color: COLORS.cream,
    textTransform: 'capitalize',
  } as TextStyle,
  planButton: {
    backgroundColor: COLORS.sage,
    borderRadius: RADIUS.lg,
    paddingVertical: SPACING.md + 2,
    alignItems: 'center',
  } as ViewStyle,
  planButtonText: {
    fontFamily: FONTS.bodySemiBold,
    fontSize: 16,
    color: COLORS.bg,
  } as TextStyle,
  tryAgainButton: {
    alignItems: 'center',
    paddingVertical: SPACING.sm,
  } as ViewStyle,
  tryAgainText: {
    fontFamily: FONTS.bodyMedium,
    fontSize: 14,
    color: COLORS.creamMuted,
  } as TextStyle,
});
