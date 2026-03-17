// =============================================================================
// ROAM — Travel Mirror
// Full-screen private space. Shows the user their behavioral travel identity.
// =============================================================================

import React, { useEffect, useState, useCallback, useMemo } from 'react';
import {
  View,
  Text,
  ScrollView,
  Pressable,
  StyleSheet,
  ActivityIndicator,
  Alert,
} from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { useRouter } from 'expo-router';
import { useTranslation } from 'react-i18next';
import { X } from 'lucide-react-native';

import {
  analyzeDNA,
  hasEnoughData,
  getEventCount,
  clearAllData,
  type TravelDNA,
} from '../lib/travel-dna';
import { COLORS, FONTS, SPACING, RADIUS } from '../lib/constants';
import * as Haptics from '../lib/haptics';

// ---------------------------------------------------------------------------
// Types
// ---------------------------------------------------------------------------

type LoadState =
  | { status: 'loading' }
  | { status: 'insufficient'; tripCount: number }
  | { status: 'ready'; dna: TravelDNA };

// ---------------------------------------------------------------------------
// Sub-components
// ---------------------------------------------------------------------------

const SectionLabel = ({ children }: { children: string }) => (
  <Text style={styles.sectionLabel}>{children}</Text>
);

const CategoryBar = ({
  label,
  categories,
  color,
}: {
  label: string;
  categories: string[];
  color: string;
}) => {
  if (categories.length === 0) return null;
  return (
    <View style={styles.categoryBarRow}>
      <Text style={styles.categoryBarLabel}>{label}</Text>
      <View style={styles.categoryBarItems}>
        {categories.map((cat) => (
          <View
            key={cat}
            style={[styles.categoryChip, { borderColor: color, backgroundColor: `${color}18` }]}
          >
            <Text style={[styles.categoryChipText, { color }]}>{cat}</Text>
          </View>
        ))}
      </View>
    </View>
  );
};

const StatBlock = ({
  value,
  label,
}: {
  value: string;
  label: string;
}) => (
  <View style={styles.statBlock}>
    <Text style={styles.statValue}>{value}</Text>
    <Text style={styles.statLabel}>{label}</Text>
  </View>
);

const RecommendationCard = ({
  destination,
  reason,
}: {
  destination: string;
  reason: string;
}) => (
  <View style={styles.recCard}>
    <Text style={styles.recDestination}>{destination}</Text>
    <Text style={styles.recReason}>{reason}</Text>
  </View>
);

// ---------------------------------------------------------------------------
// Loading / Insufficient Data State
// ---------------------------------------------------------------------------

const InsufficientDataView = ({
  tripCount,
  onClose,
}: {
  tripCount: number;
  onClose: () => void;
}) => {
  const { t } = useTranslation();
  const progress = Math.min(tripCount / 3, 1);
  const progressWidth = useMemo(() => `${Math.round(progress * 100)}%` as const, [progress]);

  return (
    <View style={styles.insufficientContainer}>
      <Text style={styles.insufficientTitle}>{t('travelMirror.stillLearning', { defaultValue: 'ROAM is still learning\nhow you travel.' })}</Text>
      <Text style={styles.insufficientBody}>
        {t('travelMirror.generateMore', { defaultValue: 'Generate a few more trips and your Travel DNA will appear here.' })}
      </Text>
      <View style={styles.progressContainer}>
        <Text style={styles.progressLabel}>{t('travelMirror.tripProgress', { defaultValue: '{{count}} of 3 trips', count: tripCount })}</Text>
        <View style={styles.progressTrack}>
          <View style={[styles.progressFill, { width: progressWidth }]} />
        </View>
      </View>
      <Pressable style={styles.insufficientClose} onPress={onClose}>
        <Text style={styles.insufficientCloseText}>{t('travelMirror.close', { defaultValue: 'Close' })}</Text>
      </Pressable>
    </View>
  );
};

// ---------------------------------------------------------------------------
// Main Screen
// ---------------------------------------------------------------------------

export default function TravelMirrorScreen() {
  const insets = useSafeAreaInsets();
  const router = useRouter();
  const { t } = useTranslation();
  const [loadState, setLoadState] = useState<LoadState>({ status: 'loading' });

  useEffect(() => {
    let mounted = true;

    const load = async () => {
      const enough = await hasEnoughData();
      if (!enough) {
        const count = await getEventCount();
        // count of trip_generated events, not total events — approximate from raw count
        // We'll pass 0–2 range based on actual generated count (getEventCount returns all events)
        // Use a simpler approach: check raw generated count via the DNA module
        const tripCount = Math.min(count > 0 ? Math.floor(count / 5) : 0, 2);
        if (mounted) setLoadState({ status: 'insufficient', tripCount });
        return;
      }

      const dna = await analyzeDNA();
      if (!mounted) return;
      if (!dna) {
        setLoadState({ status: 'insufficient', tripCount: 0 });
      } else {
        setLoadState({ status: 'ready', dna });
      }
    };

    load();
    return () => {
      mounted = false;
    };
  }, []);

  const handleClose = useCallback(async () => {
    await Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
    router.back();
  }, [router]);

  const handleDeleteData = useCallback(() => {
    Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Medium);
    Alert.alert(
      t('travelMirror.deleteTitle', { defaultValue: 'Delete Travel DNA' }),
      t('travelMirror.deleteBody', { defaultValue: 'This will permanently delete all your behavioral data. ROAM will start learning from scratch.' }),
      [
        { text: t('travelMirror.cancel', { defaultValue: 'Cancel' }), style: 'cancel' },
        {
          text: t('travelMirror.deleteEverything', { defaultValue: 'Delete Everything' }),
          style: 'destructive',
          onPress: async () => {
            await clearAllData();
            await Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Heavy);
            router.back();
          },
        },
      ],
    );
  }, [router]);

  const topInset = insets.top;
  const bottomInset = insets.bottom;

  if (loadState.status === 'loading') {
    return (
      <View style={[styles.root, { paddingTop: topInset }]}>
        <ActivityIndicator color={COLORS.sage} size="large" style={styles.loader} />
      </View>
    );
  }

  if (loadState.status === 'insufficient') {
    return (
      <View style={[styles.root, { paddingTop: topInset }]}>
        <CloseButton onPress={handleClose} topInset={topInset} />
        <InsufficientDataView
          tripCount={loadState.tripCount}
          onClose={handleClose}
        />
      </View>
    );
  }

  const { dna } = loadState;
  const deleteRatePercent = `${Math.round(dna.deleteRate * 100)}%`;
  const dreamRatioText = t('travelMirror.dreamRatioText', { defaultValue: '{{saved}} saved → {{planned}} planned', saved: dna.totalSaved, planned: dna.totalGenerated });

  return (
    <View style={[styles.root, { paddingTop: topInset }]}>
      <CloseButton onPress={handleClose} topInset={topInset} />

      <ScrollView
        style={styles.scroll}
        contentContainerStyle={[
          styles.scrollContent,
          { paddingBottom: bottomInset + SPACING.xxl },
        ]}
        showsVerticalScrollIndicator={false}
      >
        {/* ── Header ── */}
        <View style={styles.header}>
          <Text style={styles.title}>{t('travelMirror.yourTravelDNA', { defaultValue: 'Your Travel DNA' })}</Text>
          <Text style={styles.subtitle}>{t('travelMirror.builtFrom', { defaultValue: 'Built from what you do, not what you say' })}</Text>
        </View>

        {/* ── Section 1: What You Actually Want ── */}
        <SectionLabel>{t('travelMirror.sectionWhatYouWant', { defaultValue: 'WHAT YOU ACTUALLY WANT' })}</SectionLabel>

        <Text style={styles.proseParagraph}>{dna.actualVsStatedPreferences}</Text>

        <View style={styles.categoryBars}>
          <CategoryBar
            label={t('travelMirror.youSave', { defaultValue: 'You save' })}
            categories={dna.savedCategories}
            color={COLORS.sage}
          />
          <CategoryBar
            label={t('travelMirror.youPlan', { defaultValue: 'You plan' })}
            categories={dna.plannedCategories}
            color={COLORS.gold}
          />
        </View>

        {dna.avgActivitiesPerDay > 0 && (
          <View style={styles.dataRow}>
            <Text style={styles.dataLabel}>{t('travelMirror.avgActivities', { defaultValue: 'Avg activities / day' })}</Text>
            <Text style={styles.dataValue}>{dna.avgActivitiesPerDay}</Text>
          </View>
        )}

        {dna.keptCategories.length > 0 && (
          <View style={styles.dataRow}>
            <Text style={styles.dataLabel}>{t('travelMirror.alwaysKeep', { defaultValue: 'You always keep' })}</Text>
            <Text style={[styles.dataValue, { color: COLORS.sage }]}>
              {dna.keptCategories.join(', ')}
            </Text>
          </View>
        )}

        {dna.deletedCategories.length > 0 && (
          <View style={styles.dataRow}>
            <Text style={styles.dataLabel}>{t('travelMirror.alwaysCut', { defaultValue: 'You always cut' })}</Text>
            <Text style={[styles.dataValue, { color: COLORS.coral }]}>
              {dna.deletedCategories.join(', ')}
            </Text>
          </View>
        )}

        <View style={styles.divider} />

        {/* ── Section 2: Your Patterns ── */}
        <SectionLabel>{t('travelMirror.sectionPatterns', { defaultValue: 'YOUR PATTERNS' })}</SectionLabel>

        <View style={styles.statsGrid}>
          <StatBlock
            value={dna.avgPlannedDays > 0 ? String(dna.avgPlannedDays) : '—'}
            label={t('travelMirror.avgTripLength', { defaultValue: 'Avg trip length' })}
          />
          <StatBlock
            value={deleteRatePercent}
            label={t('travelMirror.deleteRate', { defaultValue: 'Delete rate' })}
          />
          <StatBlock
            value={dna.favoriteOpenTime}
            label={t('travelMirror.favPlanningTime', { defaultValue: 'Favorite planning time' })}
          />
          <StatBlock
            value={dna.dreamToActionRatio > 0 ? `${dna.dreamToActionRatio}x` : '—'}
            label={t('travelMirror.dreamToAction', { defaultValue: 'Dream-to-action ratio' })}
          />
        </View>

        <View style={styles.dreamRatioRow}>
          <Text style={styles.dreamRatioText}>{dreamRatioText}</Text>
        </View>

        <View style={styles.personalityCard}>
          <Text style={styles.personalityQuote}>
            "{dna.travelPersonalityStatement}"
          </Text>
        </View>

        {dna.savedButNeverPlanned.length > 0 && (
          <View style={styles.neverPlannedRow}>
            <Text style={styles.dataLabel}>{t('travelMirror.savedNeverPlanned', { defaultValue: 'Saved but never planned' })}</Text>
            <Text style={styles.neverPlannedList}>
              {dna.savedButNeverPlanned.slice(0, 4).join(', ')}
            </Text>
          </View>
        )}

        <View style={styles.divider} />

        {/* ── Section 3: What ROAM Knows You'll Love ── */}
        <SectionLabel>{t('travelMirror.sectionRecommendations', { defaultValue: "WHAT ROAM KNOWS YOU'LL LOVE" })}</SectionLabel>

        {dna.behavioralRecommendations.length > 0 ? (
          <View style={styles.recList}>
            {dna.behavioralRecommendations.map((rec) => (
              <RecommendationCard
                key={rec.destination}
                destination={rec.destination}
                reason={rec.reason}
              />
            ))}
          </View>
        ) : (
          <Text style={styles.proseParagraph}>
            {t('travelMirror.keepGenerating', { defaultValue: 'Keep generating trips and ROAM will find destinations perfectly shaped to your patterns.' })}
          </Text>
        )}

        <View style={styles.divider} />

        {/* ── Weekly Insight ── */}
        <View style={styles.weeklyCard}>
          <View style={styles.weeklyAccent} />
          <View style={styles.weeklyContent}>
            <Text style={styles.weeklyHeader}>{t('travelMirror.thisWeek', { defaultValue: 'THIS WEEK' })}</Text>
            <Text style={styles.weeklyInsight}>{dna.weeklyInsight}</Text>
            {dna.weeklyInsightDestination && (
              <Text style={styles.weeklyDestination}>
                {dna.weeklyInsightDestination}
              </Text>
            )}
          </View>
        </View>

        {/* ── Delete data ── */}
        <Pressable onPress={handleDeleteData} style={styles.deleteLink}>
          <Text style={styles.deleteLinkText}>{t('travelMirror.deleteAllData', { defaultValue: 'Delete all my data' })}</Text>
        </Pressable>
      </ScrollView>
    </View>
  );
}

// ---------------------------------------------------------------------------
// Close Button (extracted to avoid re-renders)
// ---------------------------------------------------------------------------

const CloseButton = ({
  onPress,
  topInset,
}: {
  onPress: () => void;
  topInset: number;
}) => (
  <Pressable
    onPress={onPress}
    style={[styles.closeButton, { top: topInset + SPACING.sm }]}
    hitSlop={12}
  >
    <X size={20} color={COLORS.creamDim} strokeWidth={1.5} />
  </Pressable>
);

// ---------------------------------------------------------------------------
// Styles
// ---------------------------------------------------------------------------

const styles = StyleSheet.create({
  root: {
    flex: 1,
    backgroundColor: COLORS.bg,
  },
  loader: {
    flex: 1,
    alignSelf: 'center',
    marginTop: 120,
  },
  closeButton: {
    position: 'absolute',
    right: SPACING.md,
    zIndex: 10,
    width: 36,
    height: 36,
    borderRadius: RADIUS.full,
    backgroundColor: COLORS.bgElevated,
    alignItems: 'center',
    justifyContent: 'center',
  },
  scroll: {
    flex: 1,
  },
  scrollContent: {
    paddingHorizontal: SPACING.lg,
    paddingTop: SPACING.xl + SPACING.md,
  },

  // Header
  header: {
    marginBottom: SPACING.xl,
  },
  title: {
    fontFamily: FONTS.header,
    fontSize: 36,
    color: COLORS.cream,
    letterSpacing: 0.5,
    lineHeight: 44,
  },
  subtitle: {
    fontFamily: FONTS.body,
    fontSize: 14,
    color: COLORS.creamMuted,
    marginTop: SPACING.xs,
  },

  // Section label
  sectionLabel: {
    fontFamily: FONTS.mono,
    fontSize: 10,
    color: COLORS.sage,
    letterSpacing: 2,
    textTransform: 'uppercase',
    marginBottom: SPACING.md,
  },

  // Prose
  proseParagraph: {
    fontFamily: FONTS.body,
    fontSize: 15,
    color: COLORS.cream,
    lineHeight: 24,
    marginBottom: SPACING.md,
  },

  // Category bars
  categoryBars: {
    gap: SPACING.sm,
    marginBottom: SPACING.md,
  },
  categoryBarRow: {
    flexDirection: 'row',
    alignItems: 'center',
    flexWrap: 'wrap',
    gap: SPACING.sm,
  },
  categoryBarLabel: {
    fontFamily: FONTS.mono,
    fontSize: 11,
    color: COLORS.creamMuted,
    width: 64,
  },
  categoryBarItems: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: SPACING.xs,
    flex: 1,
  },
  categoryChip: {
    paddingHorizontal: SPACING.sm,
    paddingVertical: 3,
    borderRadius: RADIUS.sm,
    borderWidth: 1,
  },
  categoryChipText: {
    fontFamily: FONTS.mono,
    fontSize: 11,
  },

  // Data rows
  dataRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingVertical: SPACING.xs,
    borderBottomWidth: StyleSheet.hairlineWidth,
    borderBottomColor: COLORS.border,
  },
  dataLabel: {
    fontFamily: FONTS.body,
    fontSize: 13,
    color: COLORS.creamMuted,
    flex: 1,
  },
  dataValue: {
    fontFamily: FONTS.mono,
    fontSize: 13,
    color: COLORS.gold,
  },

  // Divider
  divider: {
    height: StyleSheet.hairlineWidth,
    backgroundColor: COLORS.border,
    marginVertical: SPACING.xl,
  },

  // Stats grid
  statsGrid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: SPACING.md,
    marginBottom: SPACING.md,
  },
  statBlock: {
    flex: 1,
    minWidth: '40%',
    backgroundColor: COLORS.bgCard,
    borderRadius: RADIUS.md,
    borderWidth: 1,
    borderColor: COLORS.border,
    padding: SPACING.md,
    alignItems: 'flex-start',
  },
  statValue: {
    fontFamily: FONTS.header,
    fontSize: 40,
    color: COLORS.cream,
    lineHeight: 48,
  },
  statLabel: {
    fontFamily: FONTS.mono,
    fontSize: 10,
    color: COLORS.creamMuted,
    marginTop: SPACING.xs,
    textTransform: 'uppercase',
    letterSpacing: 1,
  },

  // Dream ratio
  dreamRatioRow: {
    marginBottom: SPACING.md,
  },
  dreamRatioText: {
    fontFamily: FONTS.mono,
    fontSize: 13,
    color: COLORS.creamDim,
  },

  // Personality card
  personalityCard: {
    backgroundColor: COLORS.bgCard,
    borderRadius: RADIUS.lg,
    borderWidth: 1,
    borderColor: COLORS.border,
    padding: SPACING.lg,
    marginBottom: SPACING.md,
    alignItems: 'center',
  },
  personalityQuote: {
    fontFamily: FONTS.body,
    fontSize: 18,
    color: COLORS.creamBright,
    textAlign: 'center',
    lineHeight: 28,
  },

  // Never planned
  neverPlannedRow: {
    gap: SPACING.xs,
    marginBottom: SPACING.sm,
  },
  neverPlannedList: {
    fontFamily: FONTS.mono,
    fontSize: 13,
    color: COLORS.creamDim,
  },

  // Recommendations
  recList: {
    gap: SPACING.md,
  },
  recCard: {
    backgroundColor: COLORS.bgCard,
    borderRadius: RADIUS.lg,
    borderWidth: 1,
    borderColor: COLORS.sageBorder,
    padding: SPACING.md,
  },
  recDestination: {
    fontFamily: FONTS.header,
    fontSize: 24,
    color: COLORS.gold,
    marginBottom: SPACING.xs,
  },
  recReason: {
    fontFamily: FONTS.body,
    fontSize: 14,
    color: COLORS.creamMuted,
    lineHeight: 21,
  },

  // Weekly insight card
  weeklyCard: {
    backgroundColor: COLORS.bgCard,
    borderRadius: RADIUS.lg,
    borderWidth: 1,
    borderColor: COLORS.coralBorder,
    flexDirection: 'row',
    overflow: 'hidden',
    marginBottom: SPACING.lg,
  },
  weeklyAccent: {
    width: 3,
    backgroundColor: COLORS.coral,
  },
  weeklyContent: {
    flex: 1,
    padding: SPACING.md,
  },
  weeklyHeader: {
    fontFamily: FONTS.mono,
    fontSize: 10,
    color: COLORS.coral,
    letterSpacing: 2,
    textTransform: 'uppercase',
    marginBottom: SPACING.xs,
  },
  weeklyInsight: {
    fontFamily: FONTS.body,
    fontSize: 14,
    color: COLORS.cream,
    lineHeight: 22,
  },
  weeklyDestination: {
    fontFamily: FONTS.header,
    fontSize: 18,
    color: COLORS.gold,
    marginTop: SPACING.xs,
  },

  // Delete link
  deleteLink: {
    alignItems: 'center',
    paddingVertical: SPACING.md,
    marginTop: SPACING.sm,
  },
  deleteLinkText: {
    fontFamily: FONTS.mono,
    fontSize: 11,
    color: COLORS.creamDim,
    textDecorationLine: 'underline',
  },

  // Insufficient data state
  insufficientContainer: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
    paddingHorizontal: SPACING.xl,
    paddingBottom: SPACING.xxl,
  },
  insufficientTitle: {
    fontFamily: FONTS.header,
    fontSize: 32,
    color: COLORS.cream,
    textAlign: 'center',
    lineHeight: 40,
    marginBottom: SPACING.md,
  },
  insufficientBody: {
    fontFamily: FONTS.body,
    fontSize: 15,
    color: COLORS.creamMuted,
    textAlign: 'center',
    lineHeight: 24,
    marginBottom: SPACING.xl,
  },
  progressContainer: {
    width: '100%',
    marginBottom: SPACING.xl,
    gap: SPACING.xs,
  },
  progressLabel: {
    fontFamily: FONTS.mono,
    fontSize: 12,
    color: COLORS.creamDim,
    textAlign: 'center',
    marginBottom: SPACING.xs,
  },
  progressTrack: {
    height: 3,
    backgroundColor: COLORS.bgElevated,
    borderRadius: RADIUS.full,
    overflow: 'hidden',
  },
  progressFill: {
    height: '100%',
    backgroundColor: COLORS.sage,
    borderRadius: RADIUS.full,
  },
  insufficientClose: {
    paddingHorizontal: SPACING.xl,
    paddingVertical: SPACING.md,
    borderRadius: RADIUS.md,
    borderWidth: 1,
    borderColor: COLORS.border,
  },
  insufficientCloseText: {
    fontFamily: FONTS.body,
    fontSize: 15,
    color: COLORS.creamMuted,
  },
});
