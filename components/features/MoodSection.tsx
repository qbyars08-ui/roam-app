// =============================================================================
// ROAM — Mood section: cinematic photo cards, no emojis
// =============================================================================
import React, { memo, useState, useCallback } from 'react';
import {
  View,
  Text,
  Pressable,
  StyleSheet,
  Modal,
  ScrollView,
  ImageBackground,
} from 'react-native';
import { LinearGradient } from 'expo-linear-gradient';
import * as Haptics from '../../lib/haptics';
import { useRouter } from 'expo-router';
import { COLORS, FONTS, SPACING, RADIUS } from '../../lib/constants';
import BreathingLine from '../ui/BreathingLine';
import { useAppStore } from '../../lib/store';
import {
  MOODS,
  getDestinationsForMood,
  generatePickReason,
  type Mood,
} from '../../lib/recommendations';
import { MOOD_PHOTOS } from '../../lib/mood-photos';
import { getDestinationPhoto } from '../../lib/photos';
import type { Destination } from '../../lib/constants';
import { useCurrency } from './CurrencyToggle';
import { formatUSD } from '../../lib/currency';

interface Props {
  onDestinationPick?: (label: string) => void;
}

function MoodSectionInner({ onDestinationPick }: Props) {
  const router = useRouter();
  const setPlanWizard = useAppStore((s) => s.setPlanWizard);
  const travelProfile = useAppStore((s) => s.travelProfile);
  const { currency, rates } = useCurrency();

  const [selectedMood, setSelectedMood] = useState<Mood | null>(null);
  const [results, setResults] = useState<
    { destination: Destination; score: number; reasons: string[] }[]
  >([]);
  const [loading, setLoading] = useState(false);
  const [showResults, setShowResults] = useState(false);

  const handleMoodPress = useCallback(async (mood: Mood) => {
    Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Medium);
    setSelectedMood(mood);
    setLoading(true);
    setShowResults(true);
    try {
      const recs = await getDestinationsForMood(mood.id, 5);
      setResults(recs);
    } catch {
      setResults([]);
    } finally {
      setLoading(false);
    }
  }, []);

  const handleDestinationPick = useCallback(
    (label: string) => {
      Haptics.notificationAsync(Haptics.NotificationFeedbackType.Success);
      setPlanWizard({ destination: label });
      setShowResults(false);
      setSelectedMood(null);
      onDestinationPick?.(label);
      router.push('/(tabs)/generate' as never);
    },
    [setPlanWizard, router, onDestinationPick]
  );

  return (
    <View style={styles.container}>
      <Text style={styles.sectionLabel}>What kind of trip are you craving?</Text>

      <ScrollView
        horizontal
        showsHorizontalScrollIndicator={false}
        contentContainerStyle={styles.row}
      >
        {MOODS.map((mood) => {
          const isSelected = selectedMood?.id === mood.id;
          const photoUrl = MOOD_PHOTOS[mood.id] ?? MOOD_PHOTOS.disappear;

          return (
            <Pressable
              key={mood.id}
              style={({ pressed }) => [
                styles.card,
                isSelected && styles.cardSelected,
                {
                  opacity: pressed ? 0.95 : 1,
                  transform: [{ scale: isSelected ? 1.02 : pressed ? 0.98 : 1 }],
                },
              ]}
              onPress={() => handleMoodPress(mood)}
            >
              <ImageBackground
                source={{ uri: photoUrl }}
                style={styles.cardImage}
                imageStyle={styles.cardImageInner}
                resizeMode="cover"
              >
                {!isSelected && <View style={styles.cardMuteOverlay} />}
                <LinearGradient
                  colors={['transparent', COLORS.overlayDark, COLORS.overlayDeeper]}
                  locations={[0.4, 0.8, 1]}
                  style={styles.cardGradient}
                >
                  <Text style={styles.cardLabel} numberOfLines={2}>
                    {mood.label}
                  </Text>
                </LinearGradient>
              </ImageBackground>
            </Pressable>
          );
        })}
      </ScrollView>

      {/* Results modal */}
      <Modal
        visible={showResults}
        animationType="slide"
        presentationStyle="pageSheet"
        onRequestClose={() => setShowResults(false)}
      >
        <View style={styles.modalContainer}>
          <View style={styles.modalHeader}>
            <Pressable onPress={() => setShowResults(false)}>
              <Text style={styles.modalClose}>Close</Text>
            </Pressable>
          </View>

          {selectedMood && (
            <View style={styles.modalMoodHeader}>
              <Text style={styles.modalMoodTitle}>{selectedMood.label}</Text>
              <Text style={styles.modalMoodDesc}>{selectedMood.description}</Text>
            </View>
          )}

          {loading ? (
            <View style={styles.loadingContainer}>
              <BreathingLine width={100} height={4} color={COLORS.sage} />
              <Text style={styles.loadingText}>Finding your perfect match</Text>
            </View>
          ) : (
            <ScrollView contentContainerStyle={styles.resultsContainer}>
              {results.map((result, i) => {
                const dest = result.destination;
                const photoUrl = getDestinationPhoto(dest.label);
                const reason = generatePickReason(result, travelProfile);

                return (
                  <Pressable
                    key={dest.label}
                    style={({ pressed }) => [
                      styles.resultCard,
                      i === 0 && styles.resultCardTop,
                      { opacity: pressed ? 0.9 : 1 },
                    ]}
                    onPress={() => handleDestinationPick(dest.label)}
                  >
                    <ImageBackground
                      source={{ uri: photoUrl }}
                      style={styles.resultImage}
                      imageStyle={{ borderRadius: RADIUS.lg }}
                      resizeMode="cover"
                    >
                      <LinearGradient
                        colors={[
                          'transparent',
                          COLORS.overlayDark,
                          COLORS.overlayDarkest,
                        ]}
                        locations={[0.2, 0.5, 1]}
                        style={styles.resultGradient}
                      >
                        {i === 0 && (
                          <View style={styles.topPickBadge}>
                            <Text style={styles.topPickText}>Top pick</Text>
                          </View>
                        )}
                        <View style={styles.resultContent}>
                          <Text style={styles.resultName}>{dest.label}</Text>
                          <Text style={styles.resultHook}>{dest.hook}</Text>
                          <Text style={styles.resultReason}>{reason}</Text>
                          <View style={styles.resultMeta}>
                            <Text style={styles.resultPrice}>
                              from {rates && currency !== 'USD' ? formatUSD(dest.dailyCost, currency, rates) : `$${dest.dailyCost}`}/day
                            </Text>
                          </View>
                        </View>
                      </LinearGradient>
                    </ImageBackground>
                  </Pressable>
                );
              })}
            </ScrollView>
          )}
        </View>
      </Modal>
    </View>
  );
}

const CARD_WIDTH = 160;
const CARD_HEIGHT = 220;

const styles = StyleSheet.create({
  container: {
    marginBottom: SPACING.xl,
  },
  sectionLabel: {
    fontFamily: FONTS.body,
    fontSize: 13,
    color: COLORS.creamSoft,
    paddingHorizontal: SPACING.lg,
    marginBottom: SPACING.md,
  },
  row: {
    paddingHorizontal: SPACING.lg,
    gap: SPACING.md,
  },
  card: {
    width: CARD_WIDTH,
    height: CARD_HEIGHT,
    borderRadius: RADIUS.lg,
    overflow: 'hidden',
    borderWidth: 1,
    borderColor: 'transparent',
  },
  cardSelected: {
    borderWidth: 1.5,
    borderColor: COLORS.gold,
  },
  cardImage: {
    width: '100%',
    height: '100%',
    justifyContent: 'flex-end',
  },
  cardImageInner: {
    borderRadius: RADIUS.lg,
  },
  cardMuteOverlay: {
    ...StyleSheet.absoluteFillObject,
    backgroundColor: COLORS.overlayFaint,
  },
  cardGradient: {
    flex: 1,
    justifyContent: 'flex-end',
    padding: SPACING.md,
  },
  cardLabel: {
    fontFamily: FONTS.headerMedium,
    fontSize: 16,
    fontStyle: 'italic',
    color: COLORS.cream,
  },

  // Modal
  modalContainer: {
    flex: 1,
    backgroundColor: COLORS.bg,
  },
  modalHeader: {
    flexDirection: 'row',
    justifyContent: 'flex-end',
    padding: SPACING.lg,
  },
  modalClose: {
    fontFamily: FONTS.bodyMedium,
    fontSize: 15,
    color: COLORS.cream,
  },
  modalMoodHeader: {
    paddingHorizontal: SPACING.lg,
    marginBottom: SPACING.lg,
  },
  modalMoodTitle: {
    fontFamily: FONTS.header,
    fontSize: 26,
    color: COLORS.cream,
  },
  modalMoodDesc: {
    fontFamily: FONTS.body,
    fontSize: 14,
    color: COLORS.creamMuted,
    marginTop: SPACING.xs,
  },
  loadingContainer: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
    gap: SPACING.md,
  },
  loadingText: {
    fontFamily: FONTS.body,
    fontSize: 14,
    color: COLORS.creamMuted,
  },
  resultsContainer: {
    paddingHorizontal: SPACING.lg,
    paddingBottom: SPACING.xxxl,
    gap: SPACING.md,
  },
  resultCard: {
    height: 200,
    borderRadius: RADIUS.lg,
    overflow: 'hidden',
  },
  resultCardTop: {},
  resultImage: {
    flex: 1,
    justifyContent: 'flex-end',
  },
  resultGradient: {
    flex: 1,
    justifyContent: 'flex-end',
    padding: SPACING.md,
  },
  topPickBadge: {
    position: 'absolute',
    top: SPACING.md,
    left: SPACING.md,
    backgroundColor: COLORS.gold,
    paddingHorizontal: SPACING.sm,
    paddingVertical: 4,
    borderRadius: RADIUS.sm,
  },
  topPickText: {
    fontFamily: FONTS.mono,
    fontSize: 10,
    color: COLORS.bg,
    letterSpacing: 0.5,
  },
  resultContent: {
  },
  resultName: {
    fontFamily: FONTS.header,
    fontSize: 22,
    color: COLORS.cream,
  },
  resultHook: {
    fontFamily: FONTS.body,
    fontSize: 13,
    color: COLORS.creamMuted,
    marginTop: 2,
  },
  resultReason: {
    fontFamily: FONTS.body,
    fontSize: 12,
    color: COLORS.sage,
    marginTop: SPACING.xs,
    fontStyle: 'italic',
  },
  resultMeta: {
    marginTop: SPACING.sm,
  },
  resultPrice: {
    fontFamily: FONTS.mono,
    fontSize: 12,
    color: COLORS.gold,
  },
});

const MoodSection = memo(MoodSectionInner);
export default MoodSection;
