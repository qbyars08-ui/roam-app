// =============================================================================
// ROAM — Shareable Travel Card
// Instagram-story-sized card showing travel personality, stats, destinations.
// Users screenshot/share to social media — the #1 viral mechanic.
// =============================================================================
import React, { useCallback, useEffect, useMemo, useRef, useState } from 'react';
import {
  Animated,
  Dimensions,
  Easing,
  Pressable,
  ScrollView,
  StyleSheet,
  Text,
  View,
  type TextStyle,
  type ViewStyle,
} from 'react-native';
import { useRouter } from 'expo-router';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { LinearGradient } from 'expo-linear-gradient';
import ViewShot from 'react-native-view-shot';
import * as Sharing from 'expo-sharing';
import {
  ArrowLeft,
  Share2,
  Download,
  MapPin,
  Globe,
  Compass,
  Sparkles,
} from 'lucide-react-native';
import { useTranslation } from 'react-i18next';
import * as Haptics from '../lib/haptics';
import { COLORS, FONTS, SPACING, RADIUS } from '../lib/constants';
import { useAppStore } from '../lib/store';
import {
  computeTravelPersonality,
  type TravelPersonality,
} from '../lib/travel-personality';
import { captureEvent } from '../lib/posthog';
import { track } from '../lib/analytics';

const { width: SCREEN_WIDTH } = Dimensions.get('window');
const CARD_WIDTH = SCREEN_WIDTH - SPACING.lg * 2;
const CARD_HEIGHT = CARD_WIDTH * 1.6; // 9:16-ish story ratio

// ---------------------------------------------------------------------------
// Card style presets — user can swipe between them
// ---------------------------------------------------------------------------
interface CardTheme {
  id: string;
  label: string;
  bg: [string, string, string];
  accent: string;
  textPrimary: string;
  textSecondary: string;
}

const CARD_THEMES: CardTheme[] = [
  {
    id: 'midnight',
    label: 'Midnight',
    bg: ['#0A0A0A', '#141414', '#142E24'],
    accent: COLORS.sage,
    textPrimary: COLORS.cream,
    textSecondary: COLORS.creamMuted,
  },
  {
    id: 'sunset',
    label: 'Sunset',
    bg: ['#1A0A0A', '#2D1414', '#4A1A0A'],
    accent: COLORS.coral,
    textPrimary: '#FFF5EB',
    textSecondary: '#D4A89A',
  },
  {
    id: 'ocean',
    label: 'Ocean',
    bg: ['#0A1520', '#0D2030', '#143048'],
    accent: '#4AC8E8',
    textPrimary: '#E8F4FF',
    textSecondary: '#8BB5CC',
  },
  {
    id: 'gold',
    label: 'Gold',
    bg: ['#1A1408', '#2D2310', '#3A2E14'],
    accent: COLORS.gold,
    textPrimary: '#FFF8E8',
    textSecondary: '#C4A86A',
  },
];

// ---------------------------------------------------------------------------
// Travel Card Screen
// ---------------------------------------------------------------------------
function TravelCardScreen() {
  const { t } = useTranslation();
  const router = useRouter();
  const insets = useSafeAreaInsets();
  const trips = useAppStore((s) => s.trips);
  const viewShotRef = useRef<ViewShot>(null);
  const [selectedTheme, setSelectedTheme] = useState(0);
  const fadeAnim = useRef(new Animated.Value(0)).current;
  const scaleAnim = useRef(new Animated.Value(0.95)).current;

  useEffect(() => {
    track({ type: 'screen_view', screen: 'travel-card' });
    Animated.parallel([
      Animated.timing(fadeAnim, {
        toValue: 1,
        duration: 500,
        useNativeDriver: true,
      }),
      Animated.spring(scaleAnim, {
        toValue: 1,
        friction: 8,
        tension: 40,
        useNativeDriver: true,
      }),
    ]).start();
  }, [fadeAnim, scaleAnim]);

  const personality = useMemo(
    () => computeTravelPersonality(trips),
    [trips]
  );

  const theme = CARD_THEMES[selectedTheme];

  // Compute unique destinations
  const uniqueDestinations = useMemo(() => {
    const set = new Set(trips.map((t) => t.destination));
    return Array.from(set);
  }, [trips]);

  // Total days traveled
  const totalDays = useMemo(
    () => trips.reduce((sum, t) => sum + t.days, 0),
    [trips]
  );

  // Unique countries (approximate from destination names)
  const countriesCount = useMemo(() => {
    const countries = new Set<string>();
    for (const t of trips) {
      // Basic heuristic: take last word of destination as "country"
      const parts = t.destination.split(',');
      countries.add(parts.length > 1 ? parts[parts.length - 1].trim() : t.destination);
    }
    return countries.size;
  }, [trips]);

  const handleShare = useCallback(async () => {
    Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Medium);
    captureEvent('travel_card_shared', { theme: theme.id });
    try {
      const uri = await viewShotRef.current?.capture?.();
      if (uri) {
        await Sharing.shareAsync(uri, {
          mimeType: 'image/png',
          dialogTitle: 'Share your travel card',
        });
      }
    } catch {
      // Sharing cancelled or unavailable
    }
  }, [theme.id]);

  const handleSave = useCallback(async () => {
    Haptics.notificationAsync(Haptics.NotificationFeedbackType.Success);
    captureEvent('travel_card_saved', { theme: theme.id });
    try {
      const uri = await viewShotRef.current?.capture?.();
      if (uri) {
        await Sharing.shareAsync(uri, {
          mimeType: 'image/png',
          dialogTitle: 'Save your travel card',
        });
      }
    } catch {
      // Save cancelled
    }
  }, [theme.id]);

  const handleThemeSwitch = useCallback((idx: number) => {
    Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
    setSelectedTheme(idx);
  }, []);

  const handleBack = useCallback(() => {
    Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
    router.back();
  }, [router]);

  return (
    <View style={[styles.container, { paddingTop: insets.top }]}>
      {/* Header */}
      <View style={styles.header}>
        <Pressable onPress={handleBack} hitSlop={12}>
          <ArrowLeft size={24} color={COLORS.cream} strokeWidth={1.5} />
        </Pressable>
        <Text style={styles.headerTitle}>{t('travelCard.title', { defaultValue: 'Your Travel Card' })}</Text>
        <View style={{ width: 24 }} />
      </View>

      <ScrollView
        contentContainerStyle={styles.scrollContent}
        showsVerticalScrollIndicator={false}
      >
        {/* The Card */}
        <Animated.View
          style={[
            styles.cardOuter,
            { opacity: fadeAnim, transform: [{ scale: scaleAnim }] },
          ]}
        >
          <ViewShot
            ref={viewShotRef}
            options={{ format: 'png', quality: 1 }}
          >
            <LinearGradient
              colors={theme.bg}
              style={styles.card}
            >
              {/* Top decorative line */}
              <View style={[styles.topAccent, { backgroundColor: theme.accent }]} />

              {/* Brand */}
              <View style={styles.brandRow}>
                <Compass size={14} color={theme.accent} strokeWidth={1.5} />
                <Text style={[styles.brandText, { color: theme.accent }]}>ROAM</Text>
              </View>

              {/* Personality */}
              <View style={styles.personalitySection}>
                <Text style={[styles.personalityEmoji]}>{personality.primary.emoji}</Text>
                <Text style={[styles.personalityName, { color: theme.textPrimary }]}>
                  {personality.primary.name}
                </Text>
                <Text style={[styles.personalityTagline, { color: theme.accent }]}>
                  {personality.primary.tagline}
                </Text>
              </View>

              {/* Stats grid */}
              <View style={styles.statsGrid}>
                <StatCell
                  value={String(trips.length)}
                  label="trips"
                  accent={theme.accent}
                  textPrimary={theme.textPrimary}
                  textSecondary={theme.textSecondary}
                />
                <StatCell
                  value={String(uniqueDestinations.length)}
                  label="destinations"
                  accent={theme.accent}
                  textPrimary={theme.textPrimary}
                  textSecondary={theme.textSecondary}
                />
                <StatCell
                  value={String(totalDays)}
                  label="days abroad"
                  accent={theme.accent}
                  textPrimary={theme.textPrimary}
                  textSecondary={theme.textSecondary}
                />
                <StatCell
                  value={String(countriesCount)}
                  label="countries"
                  accent={theme.accent}
                  textPrimary={theme.textPrimary}
                  textSecondary={theme.textSecondary}
                />
              </View>

              {/* Traits */}
              <View style={styles.traitsRow}>
                {personality.primary.traits.map((trait) => (
                  <View
                    key={trait}
                    style={[styles.traitChip, { borderColor: theme.accent + '40' }]}
                  >
                    <Text style={[styles.traitText, { color: theme.textSecondary }]}>
                      {trait}
                    </Text>
                  </View>
                ))}
              </View>

              {/* Destinations traveled */}
              {uniqueDestinations.length > 0 && (
                <View style={styles.destinationsSection}>
                  <View style={styles.destinationsRow}>
                    <MapPin size={10} color={theme.textSecondary} strokeWidth={1.5} />
                    <Text
                      style={[styles.destinationsText, { color: theme.textSecondary }]}
                      numberOfLines={2}
                    >
                      {uniqueDestinations.slice(0, 6).join(' \u00B7 ')}
                      {uniqueDestinations.length > 6 ? ` +${uniqueDestinations.length - 6} more` : ''}
                    </Text>
                  </View>
                </View>
              )}

              {/* Secondary personality */}
              <View style={styles.secondaryRow}>
                <Text style={[styles.secondaryLabel, { color: theme.textSecondary }]}>
                  {t('travelCard.alsoABitOf', { defaultValue: 'Also a bit of a' })}
                </Text>
                <Text style={[styles.secondaryName, { color: theme.accent }]}>
                  {personality.secondary.emoji} {personality.secondary.name}
                </Text>
              </View>

              {/* Watermark */}
              <View style={styles.watermark}>
                <Text style={[styles.watermarkText, { color: theme.textSecondary + '60' }]}>
                  tryroam.app
                </Text>
              </View>
            </LinearGradient>
          </ViewShot>
        </Animated.View>

        {/* Theme picker */}
        <View style={styles.themePicker}>
          <Text style={styles.themePickerLabel}>{t('travelCard.cardStyle', { defaultValue: 'Card style' })}</Text>
          <View style={styles.themeOptions}>
            {CARD_THEMES.map((t, i) => (
              <Pressable
                key={t.id}
                onPress={() => handleThemeSwitch(i)}
                style={({ pressed }) => [
                  styles.themeOption,
                  selectedTheme === i && styles.themeOptionActive,
                  { opacity: pressed ? 0.7 : 1 },
                ]}
              >
                <LinearGradient
                  colors={[t.bg[1], t.accent]}
                  style={styles.themeOptionGradient}
                />
                <Text
                  style={[
                    styles.themeOptionLabel,
                    selectedTheme === i && { color: COLORS.cream },
                  ]}
                >
                  {t.label}
                </Text>
              </Pressable>
            ))}
          </View>
        </View>

        {/* Action buttons */}
        <View style={styles.actionsRow}>
          <Pressable
            onPress={handleShare}
            style={({ pressed }) => [
              styles.actionBtn,
              styles.shareBtn,
              { opacity: pressed ? 0.85 : 1, transform: [{ scale: pressed ? 0.97 : 1 }] },
            ]}
          >
            <Share2 size={18} color={COLORS.bg} strokeWidth={1.5} />
            <Text style={styles.shareBtnText}>{t('common.share', { defaultValue: 'Share' })}</Text>
          </Pressable>
          <Pressable
            onPress={handleSave}
            style={({ pressed }) => [
              styles.actionBtn,
              styles.saveBtn,
              { opacity: pressed ? 0.85 : 1, transform: [{ scale: pressed ? 0.97 : 1 }] },
            ]}
          >
            <Download size={18} color={COLORS.cream} strokeWidth={1.5} />
            <Text style={styles.saveBtnText}>{t('common.save', { defaultValue: 'Save' })}</Text>
          </Pressable>
        </View>

        {/* Hint */}
        <Text style={styles.hint}>
          {t('travelCard.hint', { defaultValue: 'The more trips you plan, the more your personality evolves.' })}
        </Text>
      </ScrollView>
    </View>
  );
}

// ---------------------------------------------------------------------------
// Stat Cell sub-component
// ---------------------------------------------------------------------------
function StatCell({
  value,
  label,
  accent,
  textPrimary,
  textSecondary,
}: {
  value: string;
  label: string;
  accent: string;
  textPrimary: string;
  textSecondary: string;
}) {
  return (
    <View style={styles.statCell}>
      <Text style={[styles.statValue, { color: textPrimary }]}>{value}</Text>
      <Text style={[styles.statLabel, { color: textSecondary }]}>{label}</Text>
    </View>
  );
}

// ---------------------------------------------------------------------------
// Styles
// ---------------------------------------------------------------------------
const styles = StyleSheet.create({
  container: {
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
  headerTitle: {
    fontFamily: FONTS.header,
    fontSize: 20,
    color: COLORS.cream,
  } as TextStyle,
  scrollContent: {
    paddingHorizontal: SPACING.lg,
    paddingBottom: SPACING.xxxl,
  } as ViewStyle,
  // Card
  cardOuter: {
    borderRadius: RADIUS.lg,
    overflow: 'hidden',
    borderWidth: 1,
    borderColor: COLORS.border,
  } as ViewStyle,
  card: {
    width: CARD_WIDTH,
    minHeight: CARD_HEIGHT,
    padding: SPACING.xl,
    justifyContent: 'space-between',
  } as ViewStyle,
  topAccent: {
    width: 40,
    height: 3,
    borderRadius: RADIUS.sm,
    marginBottom: SPACING.lg,
  } as ViewStyle,
  brandRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: SPACING.sm,
    marginBottom: SPACING.xl,
  } as ViewStyle,
  brandText: {
    fontFamily: FONTS.mono,
    fontSize: 12,
    letterSpacing: 3,
  } as TextStyle,
  // Personality
  personalitySection: {
    alignItems: 'center',
    marginBottom: SPACING.xl,
  } as ViewStyle,
  personalityEmoji: {
    fontSize: 48,
    marginBottom: SPACING.sm,
  } as TextStyle,
  personalityName: {
    fontFamily: FONTS.header,
    fontSize: 28,
    textAlign: 'center',
  } as TextStyle,
  personalityTagline: {
    fontFamily: FONTS.body,
    fontSize: 14,
    marginTop: SPACING.xs,
    textAlign: 'center',
  } as TextStyle,
  // Stats
  statsGrid: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    marginBottom: SPACING.lg,
  } as ViewStyle,
  statCell: {
    alignItems: 'center',
    flex: 1,
  } as ViewStyle,
  statValue: {
    fontFamily: FONTS.header,
    fontSize: 24,
  } as TextStyle,
  statLabel: {
    fontFamily: FONTS.mono,
    fontSize: 9,
    letterSpacing: 0.5,
    textTransform: 'uppercase',
    marginTop: 2,
  } as TextStyle,
  // Traits
  traitsRow: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    justifyContent: 'center',
    gap: SPACING.xs,
    marginBottom: SPACING.lg,
  } as ViewStyle,
  traitChip: {
    borderWidth: 1,
    borderRadius: RADIUS.full,
    paddingHorizontal: SPACING.sm + 2,
    paddingVertical: SPACING.xs,
  } as ViewStyle,
  traitText: {
    fontFamily: FONTS.mono,
    fontSize: 10,
    letterSpacing: 0.3,
  } as TextStyle,
  // Destinations
  destinationsSection: {
    marginBottom: SPACING.lg,
  } as ViewStyle,
  destinationsRow: {
    flexDirection: 'row',
    alignItems: 'flex-start',
    gap: SPACING.sm,
  } as ViewStyle,
  destinationsText: {
    fontFamily: FONTS.body,
    fontSize: 12,
    flex: 1,
    lineHeight: 18,
  } as TextStyle,
  // Secondary personality
  secondaryRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: SPACING.sm,
    marginBottom: SPACING.md,
  } as ViewStyle,
  secondaryLabel: {
    fontFamily: FONTS.body,
    fontSize: 12,
  } as TextStyle,
  secondaryName: {
    fontFamily: FONTS.bodySemiBold,
    fontSize: 12,
  } as TextStyle,
  // Watermark
  watermark: {
    alignItems: 'center',
    marginTop: SPACING.sm,
  } as ViewStyle,
  watermarkText: {
    fontFamily: FONTS.mono,
    fontSize: 10,
    letterSpacing: 1.5,
  } as TextStyle,
  // Theme picker
  themePicker: {
    marginTop: SPACING.xl,
    marginBottom: SPACING.lg,
  } as ViewStyle,
  themePickerLabel: {
    fontFamily: FONTS.bodySemiBold,
    fontSize: 14,
    color: COLORS.cream,
    marginBottom: SPACING.sm,
  } as TextStyle,
  themeOptions: {
    flexDirection: 'row',
    gap: SPACING.sm,
  } as ViewStyle,
  themeOption: {
    flex: 1,
    alignItems: 'center',
    gap: SPACING.xs,
    paddingVertical: SPACING.sm,
    borderRadius: RADIUS.md,
    borderWidth: 1,
    borderColor: COLORS.border,
  } as ViewStyle,
  themeOptionActive: {
    borderColor: COLORS.sage,
    backgroundColor: COLORS.bgGlass,
  } as ViewStyle,
  themeOptionGradient: {
    width: 24,
    height: 24,
    borderRadius: RADIUS.lg,
  } as ViewStyle,
  themeOptionLabel: {
    fontFamily: FONTS.mono,
    fontSize: 10,
    color: COLORS.creamMuted,
    letterSpacing: 0.3,
  } as TextStyle,
  // Actions
  actionsRow: {
    flexDirection: 'row',
    gap: SPACING.md,
    marginBottom: SPACING.lg,
  } as ViewStyle,
  actionBtn: {
    flex: 1,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: SPACING.sm,
    paddingVertical: SPACING.md + 2,
    borderRadius: RADIUS.pill,
  } as ViewStyle,
  shareBtn: {
    backgroundColor: COLORS.sage,
  } as ViewStyle,
  shareBtnText: {
    fontFamily: FONTS.bodySemiBold,
    fontSize: 16,
    color: COLORS.bg,
  } as TextStyle,
  saveBtn: {
    backgroundColor: COLORS.bgCard,
    borderWidth: 1,
    borderColor: COLORS.border,
  } as ViewStyle,
  saveBtnText: {
    fontFamily: FONTS.bodySemiBold,
    fontSize: 16,
    color: COLORS.cream,
  } as TextStyle,
  // Hint
  hint: {
    fontFamily: FONTS.body,
    fontSize: 13,
    color: COLORS.creamMuted,
    textAlign: 'center',
    lineHeight: 20,
  } as TextStyle,
});

export default TravelCardScreen;
