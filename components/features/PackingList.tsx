// =============================================================================
// ROAM — Interactive Packing Checklist
// =============================================================================
import React, { useCallback, useEffect, useMemo, useState } from 'react';
import {
  Linking,
  Pressable,
  StyleSheet,
  Text,
  View,
  type ViewStyle,
  type TextStyle,
} from 'react-native';
import * as Haptics from 'expo-haptics';
import { Luggage, Check, ShoppingBag } from 'lucide-react-native';
import { COLORS, FONTS, SPACING, RADIUS } from '../../lib/constants';
import type { PackingList as PackingListResult } from '../../lib/packing-ai';
import { loadPackingChecked, savePackingChecked } from '../../lib/packing-list-storage';

// ---------------------------------------------------------------------------
// Amazon affiliate helper
// ---------------------------------------------------------------------------
const AMAZON_TAG = 'roamapp-20';

function amazonSearchUrl(item: string): string {
  return `https://www.amazon.com/s?k=${encodeURIComponent(item)}&tag=${AMAZON_TAG}`;
}

// ---------------------------------------------------------------------------
// Constants
// ---------------------------------------------------------------------------

const ALWAYS_PACK: string[] = [
  'Passport / ID',
  'Phone charger',
  'Wallet & cards',
  'Medications',
  'Headphones',
  'Reusable water bottle',
  'Travel adapter',
  'Toiletries bag',
];

// ---------------------------------------------------------------------------
// Types
// ---------------------------------------------------------------------------

interface PackingListProps {
  /** Destination-specific essentials from the itinerary (fallback when packingResult not used) */
  essentials: string[];
  /** Trip destination name */
  destination: string;
  /** AI-generated weather-based packing tip */
  weatherHint?: string;
  /** Full AI packing list from weather + activities + trip length (overrides essentials when provided) */
  packingResult?: PackingListResult;
  /** Trip ID for persisting checked state to AsyncStorage */
  tripId?: string;
  /** "Don't bring" items from packing AI */
  skipList?: string[];
}

interface PackingItem {
  id: string;
  label: string;
  category: 'always' | 'destination';
}

// ---------------------------------------------------------------------------
// Component
// ---------------------------------------------------------------------------

export default function PackingList({
  essentials,
  destination,
  weatherHint,
  packingResult,
  tripId,
  skipList,
}: PackingListProps) {
  const [expanded, setExpanded] = useState(false);
  const [checked, setChecked] = useState<Set<string>>(new Set());

  useEffect(() => {
    if (!tripId) return;
    loadPackingChecked(tripId).then(setChecked);
  }, [tripId]);

  useEffect(() => {
    if (!tripId || checked.size === 0) return;
    savePackingChecked(tripId, [...checked]).catch(() => {});
  }, [tripId, checked]);

  const items = useMemo<PackingItem[]>(() => {
    const always: PackingItem[] = ALWAYS_PACK.map((label) => ({
      id: `always-${label}`,
      label,
      category: 'always',
    }));
    const dest: PackingItem[] = packingResult
      ? packingResult.categories.flatMap((cat) =>
          cat.items.map((i) => ({
            id: `dest-${i.name}-${cat.name}`,
            label: i.name + (i.quantity > 1 ? ` (×${i.quantity})` : ''),
            category: 'destination' as const,
          }))
        )
      : essentials.map((label) => ({
          id: `dest-${label}`,
          label,
          category: 'destination' as const,
        }));
    return [...always, ...dest];
  }, [essentials, packingResult]);

  const hintText = packingResult?.proTips?.length
    ? [weatherHint, ...packingResult.proTips].filter(Boolean).join('\n\n')
    : weatherHint;

  const totalCount = items.length;
  const checkedCount = checked.size;
  const visibleItems = expanded ? items : items.slice(0, 5);

  const toggleItem = useCallback(
    (id: string) => {
      Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
      setChecked((prev) => {
        const next = new Set(prev);
        if (next.has(id)) next.delete(id);
        else next.add(id);
        return next;
      });
    },
    []
  );

  const toggleExpanded = useCallback(() => {
    Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Medium);
    setExpanded((prev) => !prev);
  }, []);

  const handleShop = useCallback((label: string) => {
    Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
    Linking.openURL(amazonSearchUrl(label)).catch(() => {});
  }, []);

  return (
    <View style={styles.container}>
      {/* Header */}
      <View style={styles.header}>
        <View style={styles.headerLeft}>
          <View style={styles.headerLabelRow}>
          <Luggage size={16} color={COLORS.sage} strokeWidth={2} />
          <Text style={styles.headerLabel}>PACKING LIST</Text>
        </View>
          <Text style={styles.destination}>for {destination}</Text>
        </View>
        <View style={styles.progressBadge}>
          <Text style={styles.progressText}>
            {checkedCount}/{totalCount}
          </Text>
        </View>
      </View>

      {/* Don't bring — from packing AI */}
      {skipList && skipList.length > 0 && (
        <View style={styles.skipContainer}>
          <Text style={styles.skipLabel}>DON'T BRING</Text>
          <Text style={styles.skipText}>{skipList.join(' · ')}</Text>
        </View>
      )}

      {/* Weather + Pro Tips */}
      {hintText ? (
        <View style={styles.hintContainer}>
          <Text style={styles.hintText}>{hintText}</Text>
        </View>
      ) : null}

      {/* Items */}
      <View style={styles.itemsContainer}>
        {visibleItems.map((item) => {
          const isChecked = checked.has(item.id);
          return (
            <Pressable
              key={item.id}
              onPress={() => toggleItem(item.id)}
              style={({ pressed }) => [
                styles.item,
                isChecked && styles.itemChecked,
                { opacity: pressed ? 0.8 : 1 },
              ]}
            >
              <View
                style={[
                  styles.checkbox,
                  isChecked && styles.checkboxChecked,
                ]}
              >
                {isChecked && <Check size={12} color={COLORS.bg} strokeWidth={3} />}
              </View>
              <Text
                style={[
                  styles.itemLabel,
                  isChecked && styles.itemLabelChecked,
                ]}
                numberOfLines={1}
              >
                {item.label}
              </Text>
              {item.category === 'destination' && (
                <View style={styles.destBadge}>
                  <Text style={styles.destBadgeText}>TRIP</Text>
                </View>
              )}
              <Pressable
                onPress={() => handleShop(item.label)}
                hitSlop={6}
                style={({ pressed }) => [
                  styles.shopBtn,
                  { opacity: pressed ? 0.5 : 0.7 },
                ]}
              >
                <ShoppingBag size={14} color={COLORS.creamMuted} strokeWidth={2} />
              </Pressable>
            </Pressable>
          );
        })}
      </View>

      {/* Expand / Collapse */}
      {totalCount > 5 && (
        <Pressable
          onPress={toggleExpanded}
          style={({ pressed }) => [
            styles.expandButton,
            { opacity: pressed ? 0.7 : 1 },
          ]}
        >
          <Text style={styles.expandText}>
            {expanded
              ? 'Show less'
              : `Show all ${totalCount} items`}
          </Text>
        </Pressable>
      )}

      {/* Amazon affiliate footer */}
      <Text style={styles.shopFooter}>
        Tap the bag to shop on Amazon
      </Text>
    </View>
  );
}

// ---------------------------------------------------------------------------
// Styles
// ---------------------------------------------------------------------------

const styles = StyleSheet.create({
  container: {
    backgroundColor: COLORS.bgCard,
    borderRadius: RADIUS.lg,
    borderWidth: 1,
    borderColor: COLORS.border,
    overflow: 'hidden',
  } as ViewStyle,
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: SPACING.md,
    paddingTop: SPACING.md,
    paddingBottom: SPACING.sm,
  } as ViewStyle,
  headerLeft: {
    flex: 1,
  } as ViewStyle,
  headerLabelRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: SPACING.xs,
  } as ViewStyle,
  headerLabel: {
    fontFamily: FONTS.mono,
    fontSize: 11,
    color: COLORS.sage,
    letterSpacing: 1.5,
    textTransform: 'uppercase',
  } as TextStyle,
  destination: {
    fontFamily: FONTS.body,
    fontSize: 13,
    color: COLORS.creamMuted,
    marginTop: 2,
  } as TextStyle,
  progressBadge: {
    backgroundColor: COLORS.sageLight,
    borderRadius: RADIUS.full,
    paddingHorizontal: SPACING.sm + 2,
    paddingVertical: SPACING.xs,
  } as ViewStyle,
  progressText: {
    fontFamily: FONTS.monoMedium,
    fontSize: 12,
    color: COLORS.sage,
  } as TextStyle,
  skipContainer: {
    marginHorizontal: SPACING.md,
    marginBottom: SPACING.sm,
    backgroundColor: COLORS.bgGlass,
    borderRadius: RADIUS.sm,
    padding: SPACING.sm,
    borderLeftWidth: 3,
    borderLeftColor: COLORS.sage,
  } as ViewStyle,
  skipLabel: {
    fontFamily: FONTS.mono,
    fontSize: 10,
    color: COLORS.sage,
    letterSpacing: 1,
    marginBottom: 4,
  } as TextStyle,
  skipText: {
    fontFamily: FONTS.body,
    fontSize: 12,
    color: COLORS.creamMuted,
    lineHeight: 18,
  } as TextStyle,
  hintContainer: {
    marginHorizontal: SPACING.md,
    marginBottom: SPACING.sm,
    backgroundColor: COLORS.bgGlass,
    borderRadius: RADIUS.sm,
    paddingHorizontal: SPACING.sm + 4,
    paddingVertical: SPACING.sm,
  } as ViewStyle,
  hintText: {
    fontFamily: FONTS.body,
    fontSize: 13,
    color: COLORS.creamHighlight,
    lineHeight: 18,
  } as TextStyle,
  itemsContainer: {
    paddingHorizontal: SPACING.md,
  } as ViewStyle,
  item: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingVertical: SPACING.sm + 2,
    borderBottomWidth: 1,
    borderBottomColor: COLORS.border,
    gap: SPACING.sm + 2,
  } as ViewStyle,
  itemChecked: {
    opacity: 0.6,
  } as ViewStyle,
  checkbox: {
    width: 22,
    height: 22,
    borderRadius: 6,
    borderWidth: 1.5,
    borderColor: COLORS.border,
    backgroundColor: COLORS.bgGlass,
    alignItems: 'center',
    justifyContent: 'center',
  } as ViewStyle,
  checkboxChecked: {
    backgroundColor: COLORS.sage,
    borderColor: COLORS.sage,
  } as ViewStyle,
  checkmark: {
    fontSize: 13,
    color: COLORS.bg,
    fontWeight: '700',
  } as TextStyle,
  itemLabel: {
    flex: 1,
    fontFamily: FONTS.body,
    fontSize: 15,
    color: COLORS.cream,
  } as TextStyle,
  itemLabelChecked: {
    textDecorationLine: 'line-through',
    color: COLORS.creamDim,
  } as TextStyle,
  destBadge: {
    backgroundColor: COLORS.coralLight,
    borderRadius: RADIUS.sm,
    paddingHorizontal: 6,
    paddingVertical: 2,
  } as ViewStyle,
  destBadgeText: {
    fontFamily: FONTS.mono,
    fontSize: 9,
    color: COLORS.coral,
    letterSpacing: 0.5,
  } as TextStyle,
  expandButton: {
    alignItems: 'center',
    paddingVertical: SPACING.md,
  } as ViewStyle,
  expandText: {
    fontFamily: FONTS.bodyMedium,
    fontSize: 13,
    color: COLORS.sage,
  } as TextStyle,
  shopBtn: {
    padding: 4,
  } as ViewStyle,
  shopIcon: {
    fontSize: 16,
  } as TextStyle,
  shopFooter: {
    fontFamily: FONTS.mono,
    fontSize: 11,
    color: COLORS.sage,
    textAlign: 'center',
    paddingBottom: SPACING.md,
    opacity: 0.6,
  } as TextStyle,
});
