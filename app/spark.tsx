// =============================================================================
// ROAM — Spark: Feature Lab
// AI-powered creative director generates feature ideas that could only
// exist in ROAM. Users describe what they wish the app could do, and
// Spark turns it into a beautifully formatted product concept.
// =============================================================================
import React, { useCallback, useRef, useState } from 'react';
import {
  Animated,
  Pressable,
  ScrollView,
  StyleSheet,
  Text,
  TextInput,
  View,
  type TextStyle,
  type ViewStyle,
} from 'react-native';
import { useRouter } from 'expo-router';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { LinearGradient } from 'expo-linear-gradient';
import * as Haptics from '../lib/haptics';
import { COLORS, FONTS, SPACING, RADIUS } from '../lib/constants';
import { withComingSoon } from '../lib/with-coming-soon';
import {
  generateSparkIdeas,
  SPARK_CATEGORY_COLORS,
  SPARK_CATEGORY_LABELS,
  SPARK_EFFORT_LABELS,
  SPARK_IMPACT_LABELS,
  type SparkCategory,
  type SparkIdea,
} from '../lib/spark';

// ---------------------------------------------------------------------------
// Starter prompts — things to spark creativity
// ---------------------------------------------------------------------------
const SPARK_STARTERS = [
  'I wish I knew what locals actually do on weekends',
  'Help me find trips that match my aesthetic',
  'Something for the morning of my trip',
  'A way to flex my travel stats without being cringe',
  'Make group trip planning less painful',
  'Something for when I\'m bored at the airport',
] as const;

// ---------------------------------------------------------------------------
// Impact dot colors
// ---------------------------------------------------------------------------
const IMPACT_COLORS: Record<string, string> = {
  low: COLORS.creamMuted,
  medium: COLORS.sage,
  high: COLORS.gold,
  'game-changer': COLORS.coral,
};

// ---------------------------------------------------------------------------
// Main Screen
// ---------------------------------------------------------------------------
function SparkScreen() {
  const router = useRouter();
  const insets = useSafeAreaInsets();
  const [input, setInput] = useState('');
  const [ideas, setIdeas] = useState<SparkIdea[]>([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [expandedIdx, setExpandedIdx] = useState<number | null>(null);

  const fadeIn = useRef(new Animated.Value(0)).current;
  const cardAnims = useRef(
    Array.from({ length: 5 }, () => new Animated.Value(0))
  ).current;

  const handleGenerate = useCallback(
    async (focus?: string) => {
      const query = focus ?? input.trim();
      setLoading(true);
      setError(null);
      setIdeas([]);
      setExpandedIdx(null);
      Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Medium);

      try {
        const result = await generateSparkIdeas({
          focus: query || undefined,
          count: 3,
        });
        setIdeas(result);

        fadeIn.setValue(0);
        cardAnims.forEach((a) => a.setValue(0));

        Animated.timing(fadeIn, {
          toValue: 1,
          duration: 400,
          useNativeDriver: true,
        }).start(() => {
          Animated.stagger(
            140,
            cardAnims.slice(0, result.length).map((anim) =>
              Animated.spring(anim, {
                toValue: 1,
                tension: 50,
                friction: 8,
                useNativeDriver: true,
              })
            )
          ).start();
        });

        Haptics.notificationAsync(Haptics.NotificationFeedbackType.Success);
      } catch {
        setError('Spark hit a wall. Give it another shot — creativity is unpredictable.');
        Haptics.notificationAsync(Haptics.NotificationFeedbackType.Error);
      } finally {
        setLoading(false);
      }
    },
    [input, fadeIn, cardAnims]
  );

  const toggleExpand = useCallback(
    (idx: number) => {
      Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
      setExpandedIdx((prev) => (prev === idx ? null : idx));
    },
    []
  );

  return (
    <View style={[styles.screen, { paddingTop: insets.top }]}>
      {/* Header */}
      <View style={styles.header}>
        <Pressable onPress={() => router.back()} hitSlop={12}>
          <Text style={styles.backBtn}>{'\u2190'}</Text>
        </Pressable>
        <View>
          <Text style={styles.headerEyebrow}>CREATIVE LAB</Text>
          <Text style={styles.headerTitle}>Spark</Text>
        </View>
        <View style={{ width: 24 }} />
      </View>

      <ScrollView
        style={styles.scroll}
        contentContainerStyle={styles.scrollContent}
        showsVerticalScrollIndicator={false}
        keyboardShouldPersistTaps="handled"
      >
        {/* Intro */}
        {ideas.length === 0 && !loading && (
          <View style={styles.introSection}>
            <Text style={styles.introTitle}>
              What should ROAM build next?
            </Text>
            <Text style={styles.introBody}>
              Describe a travel problem, a wish, or a vibe — Spark will
              turn it into a feature concept that could only exist here.
            </Text>
          </View>
        )}

        {/* Input */}
        <View style={styles.inputSection}>
          <Text style={styles.inputLabel}>YOUR SPARK</Text>
          <TextInput
            style={styles.input}
            placeholder="I wish ROAM could..."
            placeholderTextColor={COLORS.creamDimLight}
            value={input}
            onChangeText={setInput}
            multiline
            maxLength={200}
            editable={!loading}
          />
          <Pressable
            onPress={() => handleGenerate()}
            disabled={loading}
            style={({ pressed }) => [
              styles.generateBtn,
              { opacity: pressed ? 0.85 : loading ? 0.5 : 1 },
            ]}
          >
            <LinearGradient
              colors={[COLORS.sage, COLORS.sageDark]}
              style={styles.generateBtnGradient}
            >
              <Text style={styles.generateBtnText}>
                {loading ? 'Sparking...' : 'Generate Ideas'}
              </Text>
            </LinearGradient>
          </Pressable>
        </View>

        {/* Starter chips */}
        {ideas.length === 0 && !loading && (
          <View style={styles.starterSection}>
            <Text style={styles.starterLabel}>OR TRY A SPARK</Text>
            <View style={styles.starterGrid}>
              {SPARK_STARTERS.map((starter) => (
                <Pressable
                  key={starter}
                  style={({ pressed }) => [
                    styles.starterChip,
                    { opacity: pressed ? 0.7 : 1 },
                  ]}
                  onPress={() => {
                    setInput(starter);
                    handleGenerate(starter);
                  }}
                >
                  <Text style={styles.starterText}>{starter}</Text>
                </Pressable>
              ))}
            </View>
          </View>
        )}

        {/* Loading */}
        {loading && (
          <View style={styles.loadingSection}>
            <View style={styles.loadingDot} />
            <Text style={styles.loadingText}>
              Spark is thinking...
            </Text>
            <Text style={styles.loadingSubtext}>
              Filtering through every boring idea to find the good ones.
            </Text>
          </View>
        )}

        {/* Error */}
        {error && (
          <View style={styles.errorCard}>
            <Text style={styles.errorText}>{error}</Text>
            <Pressable
              onPress={() => handleGenerate()}
              style={({ pressed }) => [
                styles.retryBtn,
                { opacity: pressed ? 0.7 : 1 },
              ]}
            >
              <Text style={styles.retryText}>Try Again</Text>
            </Pressable>
          </View>
        )}

        {/* Results */}
        {ideas.length > 0 && (
          <Animated.View style={{ opacity: fadeIn }}>
            <View style={styles.resultsHeader}>
              <Text style={styles.resultsEyebrow}>SPARK OUTPUT</Text>
              <Text style={styles.resultsTitle}>
                {ideas.length} Ideas Generated
              </Text>
            </View>

            {ideas.map((idea, i) => (
              <Animated.View
                key={`${idea.name}-${i}`}
                style={{
                  opacity: cardAnims[i] ?? fadeIn,
                  transform: [
                    {
                      translateY: (cardAnims[i] ?? fadeIn).interpolate({
                        inputRange: [0, 1],
                        outputRange: [24, 0],
                      }),
                    },
                  ],
                }}
              >
                <IdeaCard
                  idea={idea}
                  expanded={expandedIdx === i}
                  onToggle={() => toggleExpand(i)}
                />
              </Animated.View>
            ))}

            {/* Regenerate */}
            <Pressable
              onPress={() => handleGenerate()}
              disabled={loading}
              style={({ pressed }) => [
                styles.regenBtn,
                { opacity: pressed ? 0.7 : 1 },
              ]}
            >
              <Text style={styles.regenText}>Spark Again</Text>
            </Pressable>
          </Animated.View>
        )}

        <View style={{ height: 40 }} />
      </ScrollView>
    </View>
  );
}

// ---------------------------------------------------------------------------
// Idea Card
// ---------------------------------------------------------------------------
function IdeaCard({
  idea,
  expanded,
  onToggle,
}: {
  idea: SparkIdea;
  expanded: boolean;
  onToggle: () => void;
}) {
  const catColor = SPARK_CATEGORY_COLORS[idea.category] ?? COLORS.sage;
  const impactColor = IMPACT_COLORS[idea.impact] ?? COLORS.creamMuted;

  return (
    <Pressable onPress={onToggle} style={styles.ideaCard}>
      {/* Top badges */}
      <View style={styles.badgeRow}>
        <View style={[styles.categoryBadge, { borderColor: catColor }]}>
          <View style={[styles.badgeDot, { backgroundColor: catColor }]} />
          <Text style={[styles.categoryText, { color: catColor }]}>
            {SPARK_CATEGORY_LABELS[idea.category] ?? idea.category}
          </Text>
        </View>
        <View style={styles.metaBadges}>
          <View style={styles.metaBadge}>
            <Text style={styles.metaLabel}>
              {SPARK_EFFORT_LABELS[idea.effort] ?? idea.effort}
            </Text>
          </View>
          <View style={[styles.impactBadge, { borderColor: impactColor }]}>
            <View style={[styles.badgeDot, { backgroundColor: impactColor }]} />
            <Text style={[styles.impactText, { color: impactColor }]}>
              {SPARK_IMPACT_LABELS[idea.impact] ?? idea.impact}
            </Text>
          </View>
        </View>
      </View>

      {/* Title + pitch */}
      <Text style={styles.ideaName}>{idea.name}</Text>
      <Text style={styles.ideaPitch}>{idea.pitch}</Text>

      {/* Description */}
      <Text style={styles.ideaDesc}>{idea.description}</Text>

      {/* Expand indicator */}
      <View style={styles.expandRow}>
        <View style={styles.expandLine} />
        <Text style={styles.expandText}>
          {expanded ? 'Less' : 'Deep Dive'}
        </Text>
        <View style={styles.expandLine} />
      </View>

      {/* Expanded content */}
      {expanded && (
        <View style={styles.expandedContent}>
          <DetailSection
            label="WHY IT WORKS"
            content={idea.whyItWorks}
            accentColor={COLORS.sage}
          />
          <DetailSection
            label="TECHNICAL SKETCH"
            content={idea.technicalSketch}
            accentColor={COLORS.gold}
          />
          <DetailSection
            label="VIRAL ANGLE"
            content={idea.viralAngle}
            accentColor={COLORS.coral}
          />
          <DetailSection
            label="WHAT NOT TO BUILD"
            content={idea.whatNotToBuild}
            accentColor={COLORS.creamMuted}
          />
        </View>
      )}
    </Pressable>
  );
}

// ---------------------------------------------------------------------------
// Detail Section (expanded card content)
// ---------------------------------------------------------------------------
function DetailSection({
  label,
  content,
  accentColor,
}: {
  label: string;
  content: string;
  accentColor: string;
}) {
  return (
    <View style={styles.detailSection}>
      <View style={styles.detailLabelRow}>
        <View style={[styles.detailDot, { backgroundColor: accentColor }]} />
        <Text style={[styles.detailLabel, { color: accentColor }]}>{label}</Text>
      </View>
      <Text style={styles.detailContent}>{content}</Text>
    </View>
  );
}

// ---------------------------------------------------------------------------
// Styles
// ---------------------------------------------------------------------------
const styles = StyleSheet.create({
  screen: {
    flex: 1,
    backgroundColor: COLORS.bg,
  } as ViewStyle,
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: SPACING.lg,
    paddingVertical: SPACING.md,
  } as ViewStyle,
  backBtn: {
    fontSize: 24,
    color: COLORS.cream,
  } as TextStyle,
  headerEyebrow: {
    fontFamily: FONTS.mono,
    fontSize: 10,
    color: COLORS.gold,
    letterSpacing: 2,
    textAlign: 'center',
  } as TextStyle,
  headerTitle: {
    fontFamily: FONTS.header,
    fontSize: 24,
    color: COLORS.cream,
    textAlign: 'center',
  } as TextStyle,
  scroll: {
    flex: 1,
  } as ViewStyle,
  scrollContent: {
    paddingHorizontal: SPACING.lg,
    paddingBottom: SPACING.xl,
  } as ViewStyle,

  // Intro
  introSection: {
    alignItems: 'center',
    marginBottom: SPACING.lg,
    gap: SPACING.sm,
  } as ViewStyle,
  introTitle: {
    fontFamily: FONTS.header,
    fontSize: 26,
    color: COLORS.cream,
    textAlign: 'center',
  } as TextStyle,
  introBody: {
    fontFamily: FONTS.body,
    fontSize: 14,
    color: COLORS.creamMuted,
    textAlign: 'center',
    lineHeight: 22,
    paddingHorizontal: SPACING.md,
  } as TextStyle,

  // Input
  inputSection: {
    marginBottom: SPACING.lg,
    gap: SPACING.sm,
  } as ViewStyle,
  inputLabel: {
    fontFamily: FONTS.mono,
    fontSize: 10,
    color: COLORS.gold,
    letterSpacing: 1.5,
  } as TextStyle,
  input: {
    backgroundColor: COLORS.bgGlass,
    borderRadius: RADIUS.md,
    borderWidth: 1,
    borderColor: COLORS.border,
    paddingHorizontal: SPACING.md,
    paddingVertical: SPACING.md,
    fontFamily: FONTS.body,
    fontSize: 15,
    color: COLORS.cream,
    minHeight: 56,
    maxHeight: 100,
    textAlignVertical: 'top',
  } as TextStyle,
  generateBtn: {
    borderRadius: RADIUS.lg,
    overflow: 'hidden',
  } as ViewStyle,
  generateBtnGradient: {
    paddingVertical: SPACING.md,
    alignItems: 'center',
    borderRadius: RADIUS.lg,
  } as ViewStyle,
  generateBtnText: {
    fontFamily: FONTS.bodySemiBold,
    fontSize: 16,
    color: COLORS.bg,
    letterSpacing: 0.3,
  } as TextStyle,

  // Starters
  starterSection: {
    marginBottom: SPACING.lg,
    gap: SPACING.sm,
  } as ViewStyle,
  starterLabel: {
    fontFamily: FONTS.mono,
    fontSize: 10,
    color: COLORS.creamMuted,
    letterSpacing: 1.5,
  } as TextStyle,
  starterGrid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: SPACING.sm,
  } as ViewStyle,
  starterChip: {
    backgroundColor: COLORS.bgGlass,
    borderRadius: RADIUS.full,
    borderWidth: 1,
    borderColor: COLORS.border,
    paddingHorizontal: SPACING.md,
    paddingVertical: SPACING.sm,
  } as ViewStyle,
  starterText: {
    fontFamily: FONTS.body,
    fontSize: 13,
    color: COLORS.creamSoft,
  } as TextStyle,

  // Loading
  loadingSection: {
    alignItems: 'center',
    paddingVertical: SPACING.xxl,
    gap: SPACING.sm,
  } as ViewStyle,
  loadingDot: {
    width: 8,
    height: 8,
    borderRadius: 4,
    backgroundColor: COLORS.gold,
    marginBottom: SPACING.sm,
  } as ViewStyle,
  loadingText: {
    fontFamily: FONTS.body,
    fontSize: 16,
    color: COLORS.cream,
    textAlign: 'center',
  } as TextStyle,
  loadingSubtext: {
    fontFamily: FONTS.body,
    fontSize: 13,
    color: COLORS.creamMuted,
    textAlign: 'center',
  } as TextStyle,

  // Error
  errorCard: {
    backgroundColor: COLORS.coralLight,
    borderRadius: RADIUS.md,
    padding: SPACING.md,
    marginBottom: SPACING.lg,
    alignItems: 'center',
    gap: SPACING.sm,
  } as ViewStyle,
  errorText: {
    fontFamily: FONTS.body,
    fontSize: 14,
    color: COLORS.coral,
    textAlign: 'center',
  } as TextStyle,
  retryBtn: {
    backgroundColor: COLORS.dangerHighlight,
    borderRadius: RADIUS.full,
    paddingHorizontal: SPACING.lg,
    paddingVertical: 8,
  } as ViewStyle,
  retryText: {
    fontFamily: FONTS.bodySemiBold,
    fontSize: 13,
    color: COLORS.coral,
  } as TextStyle,

  // Results header
  resultsHeader: {
    marginBottom: SPACING.lg,
    gap: 2,
  } as ViewStyle,
  resultsEyebrow: {
    fontFamily: FONTS.mono,
    fontSize: 10,
    color: COLORS.gold,
    letterSpacing: 2,
  } as TextStyle,
  resultsTitle: {
    fontFamily: FONTS.header,
    fontSize: 22,
    color: COLORS.cream,
  } as TextStyle,

  // Idea Card
  ideaCard: {
    backgroundColor: COLORS.bgCard,
    borderRadius: RADIUS.lg,
    borderWidth: 1,
    borderColor: COLORS.border,
    padding: SPACING.lg,
    marginBottom: SPACING.md,
  } as ViewStyle,
  badgeRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: SPACING.sm,
    flexWrap: 'wrap',
    gap: SPACING.xs,
  } as ViewStyle,
  categoryBadge: {
    flexDirection: 'row',
    alignItems: 'center',
    borderRadius: RADIUS.full,
    borderWidth: 1,
    paddingHorizontal: SPACING.sm,
    paddingVertical: 3,
    gap: 4,
  } as ViewStyle,
  badgeDot: {
    width: 6,
    height: 6,
    borderRadius: 3,
  } as ViewStyle,
  categoryText: {
    fontFamily: FONTS.mono,
    fontSize: 10,
    letterSpacing: 1,
  } as TextStyle,
  metaBadges: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: SPACING.xs,
  } as ViewStyle,
  metaBadge: {
    backgroundColor: COLORS.bgElevated,
    borderRadius: RADIUS.full,
    paddingHorizontal: SPACING.sm,
    paddingVertical: 3,
  } as ViewStyle,
  metaLabel: {
    fontFamily: FONTS.mono,
    fontSize: 10,
    color: COLORS.creamMuted,
    letterSpacing: 0.5,
  } as TextStyle,
  impactBadge: {
    flexDirection: 'row',
    alignItems: 'center',
    borderRadius: RADIUS.full,
    borderWidth: 1,
    paddingHorizontal: SPACING.sm,
    paddingVertical: 3,
    gap: 4,
  } as ViewStyle,
  impactText: {
    fontFamily: FONTS.mono,
    fontSize: 10,
    letterSpacing: 0.5,
  } as TextStyle,

  ideaName: {
    fontFamily: FONTS.header,
    fontSize: 22,
    color: COLORS.cream,
    marginBottom: 2,
  } as TextStyle,
  ideaPitch: {
    fontFamily: FONTS.body,
    fontSize: 14,
    color: COLORS.gold,
    fontStyle: 'italic',
    marginBottom: SPACING.sm,
  } as TextStyle,
  ideaDesc: {
    fontFamily: FONTS.body,
    fontSize: 14,
    color: COLORS.creamSoft,
    lineHeight: 22,
    marginBottom: SPACING.sm,
  } as TextStyle,

  // Expand
  expandRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: SPACING.sm,
    paddingVertical: SPACING.xs,
  } as ViewStyle,
  expandLine: {
    flex: 1,
    height: 1,
    backgroundColor: COLORS.border,
  } as ViewStyle,
  expandText: {
    fontFamily: FONTS.mono,
    fontSize: 10,
    color: COLORS.creamMuted,
    letterSpacing: 1,
  } as TextStyle,

  // Expanded content
  expandedContent: {
    marginTop: SPACING.sm,
    gap: SPACING.md,
  } as ViewStyle,
  detailSection: {
    gap: 4,
  } as ViewStyle,
  detailLabelRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
  } as ViewStyle,
  detailDot: {
    width: 5,
    height: 5,
    borderRadius: 3,
  } as ViewStyle,
  detailLabel: {
    fontFamily: FONTS.mono,
    fontSize: 9,
    letterSpacing: 2,
  } as TextStyle,
  detailContent: {
    fontFamily: FONTS.body,
    fontSize: 13,
    color: COLORS.creamSoft,
    lineHeight: 20,
    paddingLeft: 11,
  } as TextStyle,

  // Regenerate
  regenBtn: {
    alignSelf: 'center',
    marginTop: SPACING.md,
    paddingVertical: SPACING.sm,
    paddingHorizontal: SPACING.lg,
    borderRadius: RADIUS.full,
    borderWidth: 1,
    borderColor: COLORS.sageBorder,
  } as ViewStyle,
  regenText: {
    fontFamily: FONTS.bodyMedium,
    fontSize: 14,
    color: COLORS.sage,
  } as TextStyle,
});

export default withComingSoon(SparkScreen, {
  routeName: 'spark',
  title: 'Spark',
  description: 'AI-powered feature ideas for ROAM',
});
