// =============================================================================
// ROAM — WiFi Café Card
// Workspace recommendation for digital nomads
// =============================================================================
import React from 'react';
import {
  View,
  Text,
  StyleSheet,
  type ViewStyle,
  type TextStyle,
} from 'react-native';
import { Wifi, Plug, Volume1, Coffee } from 'lucide-react-native';
import { useTranslation } from 'react-i18next';

import { COLORS, FONTS, SPACING, RADIUS } from '../../lib/constants';
import type { CafeSpot } from '../../lib/wifi-cafes';

interface Props {
  readonly spot: CafeSpot;
  readonly index?: number;
}

const WIFI_COLORS = {
  fast: COLORS.sage,
  good: COLORS.gold,
  okay: COLORS.coral,
} as const;

const WIFI_LABELS = {
  fast: 'Fast WiFi',
  good: 'Good WiFi',
  okay: 'Okay WiFi',
} as const;

export default function WiFiCafeCard({ spot, index = 0 }: Props): React.JSX.Element {
  const { t } = useTranslation();

  return (
    <View style={s.card}>
      {/* Header */}
      <View style={s.header}>
        <View style={s.rank}>
          <Text style={s.rankText}>{index + 1}</Text>
        </View>
        <View style={s.headerText}>
          <Text style={s.name} numberOfLines={1}>{spot.name}</Text>
          <Text style={s.neighborhood}>{spot.neighborhood}</Text>
        </View>
        <Text style={s.price}>{spot.coffeeCost}</Text>
      </View>

      {/* Tags row */}
      <View style={s.tags}>
        <View style={[s.tag, { borderColor: WIFI_COLORS[spot.wifiSpeed] }]}>
          <Wifi size={10} color={WIFI_COLORS[spot.wifiSpeed]} strokeWidth={1.5} />
          <Text style={[s.tagText, { color: WIFI_COLORS[spot.wifiSpeed] }]}>
            {WIFI_LABELS[spot.wifiSpeed]}
          </Text>
        </View>
        <View style={s.tag}>
          <Plug size={10} color={COLORS.creamDim} strokeWidth={1.5} />
          <Text style={s.tagText}>
            {spot.outlets === 'many' ? 'Outlets everywhere' : spot.outlets === 'some' ? 'Some outlets' : 'Few outlets'}
          </Text>
        </View>
        <View style={s.tag}>
          <Volume1 size={10} color={COLORS.creamDim} strokeWidth={1.5} />
          <Text style={s.tagText}>
            {spot.noise.charAt(0).toUpperCase() + spot.noise.slice(1)}
          </Text>
        </View>
        {spot.stayFriendly && (
          <View style={[s.tag, { borderColor: COLORS.sageBorder }]}>
            <Coffee size={10} color={COLORS.sage} strokeWidth={1.5} />
            <Text style={[s.tagText, { color: COLORS.sage }]}>
              {t('wifi.stayFriendly', { defaultValue: 'Stay-friendly' })}
            </Text>
          </View>
        )}
      </View>

      {/* Tip */}
      <Text style={s.tip}>{spot.tip}</Text>
    </View>
  );
}

// ---------------------------------------------------------------------------
// Styles
// ---------------------------------------------------------------------------
const s = StyleSheet.create({
  card: {
    backgroundColor: COLORS.surface1,
    borderRadius: RADIUS.lg,
    borderWidth: 1,
    borderColor: COLORS.border,
    padding: SPACING.md,
    gap: SPACING.sm,
  } as ViewStyle,
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: SPACING.sm,
  } as ViewStyle,
  rank: {
    width: 24,
    height: 24,
    borderRadius: RADIUS.full,
    backgroundColor: COLORS.sageSubtle,
    alignItems: 'center',
    justifyContent: 'center',
  } as ViewStyle,
  rankText: {
    fontFamily: FONTS.mono,
    fontSize: 11,
    color: COLORS.sage,
  } as TextStyle,
  headerText: {
    flex: 1,
    gap: 1,
  } as ViewStyle,
  name: {
    fontFamily: FONTS.headerMedium,
    fontSize: 14,
    color: COLORS.cream,
  } as TextStyle,
  neighborhood: {
    fontFamily: FONTS.mono,
    fontSize: 10,
    color: COLORS.muted,
  } as TextStyle,
  price: {
    fontFamily: FONTS.mono,
    fontSize: 11,
    color: COLORS.creamDim,
  } as TextStyle,
  tags: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: SPACING.xs,
  } as ViewStyle,
  tag: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 3,
    paddingHorizontal: SPACING.xs + 2,
    paddingVertical: 2,
    borderRadius: RADIUS.pill,
    borderWidth: 1,
    borderColor: COLORS.border,
  } as ViewStyle,
  tagText: {
    fontFamily: FONTS.mono,
    fontSize: 9,
    color: COLORS.creamDim,
  } as TextStyle,
  tip: {
    fontFamily: FONTS.body,
    fontSize: 12,
    color: COLORS.creamDim,
    lineHeight: 17,
  } as TextStyle,
});
