// =============================================================================
// ROAM — Destination Mood Board
// Visual grid of curated photos, dominant color palette, vibe tags.
// Tappable to open destination page.
// =============================================================================
import React, { useCallback, useMemo, useState } from 'react';
import {
  Image,
  Pressable,
  StyleSheet,
  Text,
  View,
  type ImageStyle,
  type TextStyle,
  type ViewStyle,
} from 'react-native';
import { useRouter } from 'expo-router';
import { useTranslation } from 'react-i18next';
import { Camera, Palette } from 'lucide-react-native';
import * as Haptics from '../../lib/haptics';
import {
  COLORS,
  FONTS,
  SPACING,
  RADIUS,
  DESTINATION_HERO_PHOTOS,
  DESTINATION_THEME_PALETTES,
} from '../../lib/constants';

// ---------------------------------------------------------------------------
// Vibe tag definitions
// ---------------------------------------------------------------------------
interface VibeTag {
  readonly id: string;
  readonly label: string;
  readonly color: string;
}

const VIBE_TAGS: readonly VibeTag[] = [
  { id: 'romantic', label: 'Romantic', color: '#F472B6' },
  { id: 'adventurous', label: 'Adventurous', color: '#FB923C' },
  { id: 'relaxing', label: 'Relaxing', color: '#60A5FA' },
  { id: 'cultural', label: 'Cultural', color: '#A78BFA' },
  { id: 'foodie', label: 'Foodie', color: '#FBBF24' },
];

// Map destination categories to vibe tags
const CATEGORY_VIBES: Record<string, readonly string[]> = {
  couples: ['romantic', 'relaxing'],
  adventure: ['adventurous', 'cultural'],
  food: ['foodie', 'cultural'],
  budget: ['adventurous', 'foodie'],
  cities: ['cultural', 'foodie'],
  beaches: ['relaxing', 'romantic'],
  mountains: ['adventurous', 'relaxing'],
};

// ---------------------------------------------------------------------------
// Unsplash photo URLs for mood boards — curated per destination
// ---------------------------------------------------------------------------
function getMoodPhotos(destination: string): readonly string[] {
  const hero = DESTINATION_HERO_PHOTOS[destination];
  const base = hero ?? `https://images.unsplash.com/photo-1500530855697-b586d89ba3ee?w=400&q=80`;

  // Generate varied crops of the same destination for visual variety
  const widths = [400, 500, 600, 450, 550, 350];
  return widths.map(
    (w, i) =>
      `https://source.unsplash.com/featured/${w}x${w + 100}/?${encodeURIComponent(destination)}+travel&sig=${i}`,
  );
}

// ---------------------------------------------------------------------------
// Color palette extraction (simplified — uses theme palette if available)
// ---------------------------------------------------------------------------
function getColorPalette(destination: string): readonly string[] {
  const theme = DESTINATION_THEME_PALETTES[destination];
  if (theme) {
    return [theme.primary, theme.secondary, ...theme.gradient.slice(0, 2)];
  }
  // Default palette
  return [COLORS.sage, COLORS.gold, '#94A3B8', COLORS.cream];
}

// ---------------------------------------------------------------------------
// Props
// ---------------------------------------------------------------------------
export interface DestinationMoodBoardProps {
  readonly destination: string;
  readonly category?: string;
  readonly compact?: boolean;
}

// ---------------------------------------------------------------------------
// Component
// ---------------------------------------------------------------------------
export default function DestinationMoodBoard({
  destination,
  category = 'cities',
  compact = false,
}: DestinationMoodBoardProps): React.JSX.Element {
  const router = useRouter();
  const { t } = useTranslation();

  const photos = useMemo(() => getMoodPhotos(destination), [destination]);
  const palette = useMemo(() => getColorPalette(destination), [destination]);
  const vibes = useMemo(() => {
    const vibeIds = CATEGORY_VIBES[category] ?? ['cultural', 'foodie'];
    return VIBE_TAGS.filter((v) => vibeIds.includes(v.id));
  }, [category]);

  const handlePress = useCallback(() => {
    Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
    router.push({
      pathname: '/destination/[name]',
      params: { name: destination },
    });
  }, [router, destination]);

  if (compact) {
    return (
      <Pressable
        onPress={handlePress}
        style={({ pressed }) => [styles.compactCard, pressed && styles.pressed]}
        accessibilityRole="button"
        accessibilityLabel={`Mood board for ${destination}`}
      >
        <Image source={{ uri: photos[0] }} style={styles.compactImage} />
        <View style={styles.compactOverlay}>
          <Text style={styles.compactName}>{destination}</Text>
          <View style={styles.compactVibes}>
            {vibes.map((v) => (
              <View
                key={v.id}
                style={[styles.vibeDot, { backgroundColor: v.color }]}
              />
            ))}
          </View>
        </View>
      </Pressable>
    );
  }

  return (
    <Pressable
      onPress={handlePress}
      style={({ pressed }) => [styles.card, pressed && styles.pressed]}
      accessibilityRole="button"
      accessibilityLabel={`Mood board for ${destination}`}
    >
      {/* Photo grid */}
      <View style={styles.photoGrid}>
        <Image source={{ uri: photos[0] }} style={styles.photoLarge} />
        <View style={styles.photoColumn}>
          <Image source={{ uri: photos[1] }} style={styles.photoSmall} />
          <Image source={{ uri: photos[2] }} style={styles.photoSmall} />
        </View>
      </View>

      {/* Color palette */}
      <View style={styles.paletteRow}>
        <Palette size={12} color={COLORS.muted} strokeWidth={1.5} />
        {palette.map((color, i) => (
          <View
            key={`${color}_${i}`}
            style={[styles.paletteSwatch, { backgroundColor: color }]}
          />
        ))}
      </View>

      {/* Vibe tags */}
      <View style={styles.vibeRow}>
        {vibes.map((v) => (
          <View key={v.id} style={[styles.vibeChip, { borderColor: v.color }]}>
            <View style={[styles.vibeDotSmall, { backgroundColor: v.color }]} />
            <Text style={[styles.vibeText, { color: v.color }]}>{v.label}</Text>
          </View>
        ))}
      </View>

      {/* Destination name */}
      <Text style={styles.destName}>{destination}</Text>
    </Pressable>
  );
}

// ---------------------------------------------------------------------------
// Styles
// ---------------------------------------------------------------------------
const styles = StyleSheet.create({
  card: {
    backgroundColor: COLORS.surface1,
    borderRadius: RADIUS.md,
    borderWidth: 1,
    borderColor: COLORS.border,
    overflow: 'hidden',
  } as ViewStyle,
  pressed: { opacity: 0.9 } as ViewStyle,
  photoGrid: {
    flexDirection: 'row',
    height: 180,
    gap: 2,
  } as ViewStyle,
  photoLarge: {
    flex: 2,
    height: '100%',
    backgroundColor: COLORS.surface2,
  } as ImageStyle,
  photoColumn: {
    flex: 1,
    gap: 2,
  } as ViewStyle,
  photoSmall: {
    flex: 1,
    backgroundColor: COLORS.surface2,
  } as ImageStyle,
  paletteRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: SPACING.xs,
    paddingHorizontal: SPACING.md,
    paddingTop: SPACING.sm,
  } as ViewStyle,
  paletteSwatch: {
    width: 16,
    height: 16,
    borderRadius: 4,
  } as ViewStyle,
  vibeRow: {
    flexDirection: 'row',
    gap: SPACING.xs,
    paddingHorizontal: SPACING.md,
    paddingTop: SPACING.sm,
  } as ViewStyle,
  vibeChip: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
    borderRadius: RADIUS.pill,
    borderWidth: 1,
    paddingHorizontal: SPACING.sm,
    paddingVertical: 3,
  } as ViewStyle,
  vibeDotSmall: {
    width: 6,
    height: 6,
    borderRadius: 3,
  } as ViewStyle,
  vibeText: {
    fontFamily: FONTS.mono,
    fontSize: 10,
  } as TextStyle,
  destName: {
    fontFamily: FONTS.headerMedium,
    fontSize: 16,
    color: COLORS.cream,
    paddingHorizontal: SPACING.md,
    paddingVertical: SPACING.sm,
  } as TextStyle,
  // Compact variant
  compactCard: {
    width: 140,
    height: 180,
    borderRadius: RADIUS.md,
    overflow: 'hidden',
    borderWidth: 1,
    borderColor: COLORS.border,
  } as ViewStyle,
  compactImage: {
    width: '100%',
    height: '100%',
    backgroundColor: COLORS.surface2,
  } as ImageStyle,
  compactOverlay: {
    position: 'absolute',
    bottom: 0,
    left: 0,
    right: 0,
    padding: SPACING.sm,
    backgroundColor: COLORS.overlayDark,
  } as ViewStyle,
  compactName: {
    fontFamily: FONTS.bodyMedium,
    fontSize: 13,
    color: COLORS.cream,
  } as TextStyle,
  compactVibes: {
    flexDirection: 'row',
    gap: 4,
    marginTop: 4,
  } as ViewStyle,
  vibeDot: {
    width: 8,
    height: 8,
    borderRadius: 4,
  } as ViewStyle,
});
