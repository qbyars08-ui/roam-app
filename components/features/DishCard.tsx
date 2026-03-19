// =============================================================================
// ROAM — DishCard
// Reusable dish card: local name, pronunciation, price, dietary tags, ordering
// =============================================================================

import React, { useCallback } from 'react';
import { Linking, Pressable, Text, View, StyleSheet } from 'react-native';
import { Volume2 } from 'lucide-react-native';
import { COLORS, FONTS, SPACING, RADIUS } from '../../lib/constants';
import { impactAsync, ImpactFeedbackStyle } from '../../lib/haptics';
import { pronounce } from '../../lib/elevenlabs';
import type { DietaryFilter } from '../../lib/food-intelligence';

// ---------------------------------------------------------------------------
// Types
// ---------------------------------------------------------------------------

export interface DishCardProps {
  readonly localName: string;
  readonly pronunciation: string;
  readonly englishName: string;
  readonly description: string;
  readonly priceLocal: string;
  readonly dietaryTags: readonly DietaryFilter[];
  readonly orderPhrase: string;
  readonly destination: string;
  readonly language?: string;
}

// ---------------------------------------------------------------------------
// Tag color map
// ---------------------------------------------------------------------------

const TAG_COLORS: Record<string, string> = {
  vegetarian: '#4ADE80',
  vegan: '#22C55E',
  'gluten-free': '#FBBF24',
  halal: '#60A5FA',
  kosher: '#A78BFA',
};

// ---------------------------------------------------------------------------
// Component
// ---------------------------------------------------------------------------

export default function DishCard({
  localName,
  pronunciation,
  englishName,
  description,
  priceLocal,
  dietaryTags,
  orderPhrase,
  destination,
  language,
}: DishCardProps) {
  const handleSpeak = useCallback(async () => {
    await impactAsync(ImpactFeedbackStyle.Light);
    try {
      await pronounce(orderPhrase.slice(0, 200), language);
    } catch {
      // silent — TTS is best-effort
    }
  }, [orderPhrase, language]);

  const handleCardPress = useCallback(async () => {
    await impactAsync(ImpactFeedbackStyle.Light);
    const query = encodeURIComponent(`${englishName} ${destination}`);
    Linking.openURL(`https://www.google.com/maps/search/${query}`).catch(
      () => {},
    );
  }, [englishName, destination]);

  const visibleTags = dietaryTags.filter((t) => t !== 'all');

  return (
    <Pressable style={s.card} onPress={handleCardPress}>
      <Text style={s.localName} numberOfLines={1}>
        {localName}
      </Text>

      <Text style={s.pronunciation}>{pronunciation}</Text>

      <Text style={s.englishName} numberOfLines={1}>
        {englishName}
      </Text>
      <Text style={s.description} numberOfLines={2}>
        {description}
      </Text>

      <View style={s.footer}>
        <Text style={s.price}>{priceLocal}</Text>

        {visibleTags.length > 0 && (
          <View style={s.tags}>
            {visibleTags.map((tag) => (
              <View
                key={tag}
                style={[
                  s.tagDot,
                  { backgroundColor: TAG_COLORS[tag] ?? COLORS.muted },
                ]}
              />
            ))}
          </View>
        )}

        <Pressable style={s.speakBtn} onPress={handleSpeak} hitSlop={8}>
          <Volume2 size={16} color={COLORS.accent} strokeWidth={1.5} />
          <Text style={s.speakLabel}>Order</Text>
        </Pressable>
      </View>
    </Pressable>
  );
}

// ---------------------------------------------------------------------------
// Styles
// ---------------------------------------------------------------------------

const s = StyleSheet.create({
  card: {
    backgroundColor: COLORS.surface1,
    borderRadius: RADIUS.md,
    padding: SPACING.md,
    borderWidth: 1,
    borderColor: COLORS.border,
    width: 220,
    marginRight: SPACING.sm,
  },
  localName: {
    fontFamily: FONTS.header,
    fontSize: 20,
    color: COLORS.accent,
    marginBottom: 2,
  },
  pronunciation: {
    fontFamily: FONTS.mono,
    fontSize: 12,
    color: COLORS.muted,
    marginBottom: SPACING.sm,
  },
  englishName: {
    fontFamily: FONTS.bodyMedium,
    fontSize: 14,
    color: COLORS.cream,
    marginBottom: 2,
  },
  description: {
    fontFamily: FONTS.body,
    fontSize: 12,
    color: COLORS.muted,
    lineHeight: 17,
    marginBottom: SPACING.sm,
  },
  footer: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
  },
  price: {
    fontFamily: FONTS.mono,
    fontSize: 13,
    color: COLORS.gold,
  },
  tags: {
    flexDirection: 'row',
    gap: 4,
    alignItems: 'center',
  },
  tagDot: {
    width: 6,
    height: 6,
    borderRadius: 3,
  },
  speakBtn: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
    paddingVertical: 4,
    paddingHorizontal: 8,
    borderRadius: RADIUS.pill,
    backgroundColor: COLORS.sageVeryFaint,
  },
  speakLabel: {
    fontFamily: FONTS.mono,
    fontSize: 11,
    color: COLORS.accent,
  },
});
