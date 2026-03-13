// =============================================================================
// ROAM — Mood-Based Discovery
// "How do you feel right now?" → ROAM picks the destination
// =============================================================================
import React, { useState, useCallback } from 'react';
import {
  View,
  Text,
  Pressable,
  StyleSheet,
  Modal,
  ScrollView,
  ImageBackground,
  type ViewStyle,
  type TextStyle,
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
  getVibeCheck,
  type Mood,
} from '../../lib/recommendations';
import type { Destination } from '../../lib/constants';
import { getDestinationPhoto } from '../../lib/photos';
import { useCurrency } from './CurrencyToggle';
import { formatUSD } from '../../lib/currency';

interface Props {
  photoUrls?: Map<string, string | null>;
}

export default function MoodDiscovery({ photoUrls: _photoUrls }: Props) {
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
      router.push('/(tabs)/plan');
    },
    [setPlanWizard, router]
  );

  return (
    <View style={styles.container}>
      <Text style={styles.sectionTitle}>How are you feeling?</Text>
      <Text style={styles.sectionSubtitle}>
        Tell us your mood. We'll pick where you should go.
      </Text>

      <ScrollView
        horizontal
        showsHorizontalScrollIndicator={false}
        contentContainerStyle={styles.moodRow}
      >
        {MOODS.map((mood) => (
          <Pressable
            key={mood.id}
            style={({ pressed }) => [
              styles.moodPill,
              selectedMood?.id === mood.id && styles.moodPillSelected,
              { opacity: pressed ? 0.8 : 1 },
            ]}
            onPress={() => handleMoodPress(mood)}
          >
            {null}
            <Text
              style={[
                styles.moodLabel,
                selectedMood?.id === mood.id && styles.moodLabelSelected,
              ]}
              numberOfLines={2}
            >
              {mood.label}
            </Text>
          </Pressable>
        ))}
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
              {null}
              <Text style={styles.modalMoodTitle}>{selectedMood.label}</Text>
              <Text style={styles.modalMoodDesc}>{selectedMood.description}</Text>
            </View>
          )}

          {loading ? (
            <View style={styles.loadingContainer}>
              <BreathingLine width={100} height={4} color={COLORS.sage} />
              <Text style={styles.loadingText}>Finding your perfect match...</Text>
            </View>
          ) : (
            <ScrollView contentContainerStyle={styles.resultsContainer}>
              {results.map((result, i) => {
                const dest = result.destination;
                const photoUrl = getDestinationPhoto(dest.label);
                const reason = generatePickReason(result, travelProfile);
                const vibeCheck = getVibeCheck(dest);

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
                          colors={['transparent', 'rgba(0,0,0,0.7)', 'rgba(0,0,0,0.95)']}
                          locations={[0.2, 0.5, 1]}
                          style={styles.resultGradient}
                        >
                          {i === 0 && (
                            <View style={styles.topPickBadge}>
                              <Text style={styles.topPickText}>TOP PICK</Text>
                            </View>
                          )}
                          <View style={styles.resultContent}>
                            {null}
                            <Text style={styles.resultName}>{dest.label}</Text>
                            <Text style={styles.resultHook}>{dest.hook}</Text>
                            <Text style={styles.resultReason}>{reason}</Text>
                            <View style={styles.resultMeta}>
                              <Text style={styles.resultPrice}>{rates && currency !== 'USD' ? formatUSD(dest.dailyCost, currency, rates) : `$${dest.dailyCost}`}/day</Text>
                              <View
                                style={[
                                  styles.crowdBadge,
                                  vibeCheck.crowdLevel === 'low' && styles.crowdLow,
                                  vibeCheck.crowdLevel === 'moderate' && styles.crowdMod,
                                  vibeCheck.crowdLevel === 'high' && styles.crowdHigh,
                                  vibeCheck.crowdLevel === 'peak' && styles.crowdPeak,
                                ]}
                              >
                                <Text style={styles.crowdBadgeText}>
                                  {vibeCheck.crowdLevel === 'low' ? 'Quiet' :
                                    vibeCheck.crowdLevel === 'moderate' ? 'Moderate' :
                                      vibeCheck.crowdLevel === 'high' ? 'Busy' : 'Peak'}
                                </Text>
                              </View>
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

// ---------------------------------------------------------------------------
// Styles
// ---------------------------------------------------------------------------
const styles = StyleSheet.create({
  container: {
    marginTop: SPACING.lg,
  } as ViewStyle,
  sectionTitle: {
    fontFamily: FONTS.header,
    fontSize: 24,
    color: COLORS.cream,
    paddingHorizontal: SPACING.lg,
    marginBottom: SPACING.xs,
  } as TextStyle,
  sectionSubtitle: {
    fontFamily: FONTS.body,
    fontSize: 14,
    color: COLORS.creamMuted,
    paddingHorizontal: SPACING.lg,
    marginBottom: SPACING.md,
  } as TextStyle,
  moodRow: {
    paddingHorizontal: SPACING.lg,
    gap: SPACING.sm,
  } as ViewStyle,
  moodPill: {
    backgroundColor: COLORS.bgGlass,
    borderRadius: RADIUS.xl,
    borderWidth: 1,
    borderColor: COLORS.border,
    paddingHorizontal: SPACING.lg,
    paddingVertical: SPACING.md,
    alignItems: 'center',
    width: 120,
    gap: SPACING.xs,
  } as ViewStyle,
  moodPillSelected: {
    backgroundColor: COLORS.sageLight,
    borderColor: COLORS.sage,
  } as ViewStyle,
  moodEmoji: {
    fontSize: 28,
  } as TextStyle,
  moodLabel: {
    fontFamily: FONTS.bodyMedium,
    fontSize: 12,
    color: COLORS.cream,
    textAlign: 'center',
    lineHeight: 16,
  } as TextStyle,
  moodLabelSelected: {
    color: COLORS.sage,
  } as TextStyle,

  // Modal
  modalContainer: {
    flex: 1,
    backgroundColor: COLORS.bg,
  } as ViewStyle,
  modalHeader: {
    flexDirection: 'row',
    justifyContent: 'flex-end',
    paddingHorizontal: SPACING.lg,
    paddingTop: SPACING.lg,
    paddingBottom: SPACING.sm,
  } as ViewStyle,
  modalClose: {
    fontFamily: FONTS.bodyMedium,
    fontSize: 16,
    color: COLORS.sage,
  } as TextStyle,
  modalMoodHeader: {
    alignItems: 'center',
    paddingHorizontal: SPACING.lg,
    paddingBottom: SPACING.lg,
    gap: SPACING.xs,
  } as ViewStyle,
  modalMoodEmoji: {
    fontSize: 48,
  } as TextStyle,
  modalMoodTitle: {
    fontFamily: FONTS.header,
    fontSize: 28,
    color: COLORS.cream,
    textAlign: 'center',
  } as TextStyle,
  modalMoodDesc: {
    fontFamily: FONTS.body,
    fontSize: 15,
    color: COLORS.creamMuted,
    textAlign: 'center',
  } as TextStyle,
  loadingContainer: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
    gap: SPACING.md,
  } as ViewStyle,
  loadingText: {
    fontFamily: FONTS.body,
    fontSize: 15,
    color: COLORS.creamMuted,
  } as TextStyle,
  resultsContainer: {
    paddingHorizontal: SPACING.lg,
    paddingBottom: SPACING.xxxl,
    gap: SPACING.md,
  } as ViewStyle,
  resultCard: {
    borderRadius: RADIUS.lg,
    overflow: 'hidden',
  } as ViewStyle,
  resultCardTop: {
    borderWidth: 1.5,
    borderColor: COLORS.sage,
  } as ViewStyle,
  resultImage: {
    height: 240,
    justifyContent: 'flex-end',
  } as ViewStyle,
  resultGradient: {
    ...StyleSheet.absoluteFillObject,
    borderRadius: RADIUS.lg,
    justifyContent: 'flex-end',
    padding: SPACING.lg,
  } as ViewStyle,
  topPickBadge: {
    position: 'absolute',
    top: SPACING.md,
    left: SPACING.md,
    backgroundColor: COLORS.sage,
    borderRadius: RADIUS.full,
    paddingHorizontal: SPACING.md,
    paddingVertical: SPACING.xs,
  } as ViewStyle,
  topPickText: {
    fontFamily: FONTS.mono,
    fontSize: 10,
    color: COLORS.bg,
    letterSpacing: 1.5,
    fontWeight: '700',
  } as TextStyle,
  resultContent: {
    gap: 2,
  } as ViewStyle,
  resultEmoji: {
    fontSize: 24,
    marginBottom: 2,
  } as TextStyle,
  resultName: {
    fontFamily: FONTS.header,
    fontSize: 28,
    color: COLORS.cream,
  } as TextStyle,
  resultHook: {
    fontFamily: FONTS.body,
    fontSize: 14,
    color: COLORS.cream,
    opacity: 0.8,
  } as TextStyle,
  resultReason: {
    fontFamily: FONTS.bodyMedium,
    fontSize: 13,
    color: COLORS.sage,
    marginTop: SPACING.xs,
  } as TextStyle,
  resultMeta: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: SPACING.sm,
    marginTop: SPACING.sm,
  } as ViewStyle,
  resultPrice: {
    fontFamily: FONTS.mono,
    fontSize: 13,
    color: COLORS.cream,
    opacity: 0.7,
  } as TextStyle,
  crowdBadge: {
    borderRadius: RADIUS.full,
    paddingHorizontal: SPACING.sm,
    paddingVertical: 2,
    backgroundColor: COLORS.bgGlass,
  } as ViewStyle,
  crowdLow: { backgroundColor: 'rgba(74,222,128,0.2)' } as ViewStyle,
  crowdMod: { backgroundColor: 'rgba(245,158,11,0.2)' } as ViewStyle,
  crowdHigh: { backgroundColor: COLORS.coralLight } as ViewStyle,
  crowdPeak: { backgroundColor: COLORS.coralBorder } as ViewStyle,
  crowdBadgeText: {
    fontFamily: FONTS.mono,
    fontSize: 10,
    color: COLORS.cream,
    letterSpacing: 0.5,
  } as TextStyle,
});
