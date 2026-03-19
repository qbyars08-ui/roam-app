// =============================================================================
// ROAM — eSIM Recommendation Card
// Shows destination-aware eSIM recommendation in Prep tab.
// =============================================================================

import React, { useCallback, useMemo } from 'react';
import {
  Pressable,
  StyleSheet,
  Text,
  View,
  type TextStyle,
  type ViewStyle,
} from 'react-native';
import { Smartphone, Wifi, ExternalLink, ChevronRight } from 'lucide-react-native';
import { useTranslation } from 'react-i18next';
import { COLORS, FONTS, SPACING, RADIUS } from '../../lib/constants';
import { getESIMInfo, openESIMLink, type ESIMPlan } from '../../lib/esim-intel';
import FadeIn from '../ui/FadeIn';

// ---------------------------------------------------------------------------
// Props
// ---------------------------------------------------------------------------

interface ESIMCardProps {
  readonly destination: string;
}

// ---------------------------------------------------------------------------
// WiFi reliability badge
// ---------------------------------------------------------------------------

const WIFI_COLORS = {
  excellent: COLORS.sage,
  good: COLORS.sage,
  spotty: COLORS.gold,
  poor: COLORS.coral,
} as const;

const WIFI_LABELS = {
  excellent: 'Great WiFi',
  good: 'OK WiFi',
  spotty: 'Spotty WiFi',
  poor: 'Poor WiFi',
} as const;

// ---------------------------------------------------------------------------
// Component
// ---------------------------------------------------------------------------

export default function ESIMCard({ destination }: ESIMCardProps): React.JSX.Element | null {
  const { t } = useTranslation();
  const info = useMemo(() => getESIMInfo(destination), [destination]);

  const recommended = useMemo(
    () => info?.plans.find((p) => p.recommended) ?? info?.plans[0] ?? null,
    [info]
  );

  const handlePress = useCallback(() => {
    if (recommended) openESIMLink(recommended);
  }, [recommended]);

  if (!info) return null;

  const wifiColor = WIFI_COLORS[info.wifiReliability];
  const wifiLabel = WIFI_LABELS[info.wifiReliability];

  return (
    <FadeIn delay={200}>
      <View style={styles.card}>
        {/* Header */}
        <View style={styles.header}>
          <View style={styles.headerLeft}>
            <Smartphone size={16} color={COLORS.sage} strokeWidth={1.5} />
            <Text style={styles.title}>
              {t('prep.esim', { defaultValue: 'eSIM' })}
            </Text>
          </View>
          <View style={[styles.wifiBadge, { borderColor: wifiColor }]}>
            <Wifi size={10} color={wifiColor} strokeWidth={1.5} />
            <Text style={[styles.wifiText, { color: wifiColor }]}>{wifiLabel}</Text>
          </View>
        </View>

        {/* Why you need it */}
        <Text style={styles.reason}>{info.reason}</Text>

        {/* Recommended plan */}
        {recommended ? (
          <Pressable
            onPress={handlePress}
            style={({ pressed }) => [styles.planRow, pressed && styles.planPressed]}
            accessibilityRole="link"
            accessibilityLabel={`Get ${recommended.data} eSIM for ${recommended.price}`}
          >
            <View style={styles.planInfo}>
              <Text style={styles.planProvider}>{recommended.provider}</Text>
              <Text style={styles.planDetails}>
                {recommended.data} · {recommended.duration}
              </Text>
            </View>
            <View style={styles.planRight}>
              <Text style={styles.planPrice}>{recommended.price}</Text>
              <ExternalLink size={12} color={COLORS.sage} strokeWidth={1.5} />
            </View>
          </Pressable>
        ) : null}

        {/* Pro tip */}
        <Text style={styles.tip}>{info.tip}</Text>

        {/* More plans link */}
        {info.plans.length > 1 ? (
          <Pressable
            onPress={handlePress}
            style={styles.moreLink}
            accessibilityRole="link"
          >
            <Text style={styles.moreLinkText}>
              {`${info.plans.length} plans from ${info.plans[0].price}`}
            </Text>
            <ChevronRight size={14} color={COLORS.sage} strokeWidth={1.5} />
          </Pressable>
        ) : null}
      </View>
    </FadeIn>
  );
}

// ---------------------------------------------------------------------------
// Styles
// ---------------------------------------------------------------------------

const styles = StyleSheet.create({
  card: {
    backgroundColor: COLORS.surface1,
    borderWidth: 1,
    borderColor: COLORS.border,
    borderRadius: RADIUS.lg,
    padding: SPACING.md,
    gap: SPACING.sm,
  } as ViewStyle,
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
  } as ViewStyle,
  headerLeft: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: SPACING.xs,
  } as ViewStyle,
  title: {
    fontFamily: FONTS.headerMedium,
    fontSize: 15,
    color: COLORS.cream,
  } as TextStyle,
  wifiBadge: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
    borderWidth: 1,
    borderRadius: RADIUS.pill,
    paddingHorizontal: 8,
    paddingVertical: 3,
  } as ViewStyle,
  wifiText: {
    fontFamily: FONTS.mono,
    fontSize: 9,
    letterSpacing: 0.3,
  } as TextStyle,
  reason: {
    fontFamily: FONTS.body,
    fontSize: 13,
    color: COLORS.creamDim,
    lineHeight: 19,
  } as TextStyle,
  planRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    backgroundColor: COLORS.surface2,
    borderRadius: RADIUS.md,
    padding: SPACING.sm,
  } as ViewStyle,
  planPressed: {
    opacity: 0.7,
  } as ViewStyle,
  planInfo: {
    gap: 2,
  } as ViewStyle,
  planProvider: {
    fontFamily: FONTS.mono,
    fontSize: 10,
    color: COLORS.sage,
    textTransform: 'uppercase',
    letterSpacing: 0.5,
  } as TextStyle,
  planDetails: {
    fontFamily: FONTS.bodyMedium,
    fontSize: 14,
    color: COLORS.cream,
  } as TextStyle,
  planRight: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: SPACING.xs,
  } as ViewStyle,
  planPrice: {
    fontFamily: FONTS.mono,
    fontSize: 16,
    color: COLORS.cream,
  } as TextStyle,
  tip: {
    fontFamily: FONTS.mono,
    fontSize: 11,
    color: COLORS.muted,
    lineHeight: 16,
  } as TextStyle,
  moreLink: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
  } as ViewStyle,
  moreLinkText: {
    fontFamily: FONTS.bodyMedium,
    fontSize: 13,
    color: COLORS.sage,
  } as TextStyle,
});
