// =============================================================================
// ROAM — Tipping Guide Card
// At-a-glance tipping rules for a destination
// =============================================================================
import React, { useState, useCallback } from 'react';
import {
  View,
  Text,
  StyleSheet,
  type ViewStyle,
  type TextStyle,
} from 'react-native';
import { DollarSign, ChevronDown } from 'lucide-react-native';
import { useTranslation } from 'react-i18next';

import { COLORS, FONTS, SPACING, RADIUS } from '../../lib/constants';
import {
  getTippingGuide,
  TIPPING_CULTURE_LABELS,
  type TippingGuide,
} from '../../lib/tipping-guide';
import PressableScale from '../ui/PressableScale';
import * as Haptics from '../../lib/haptics';

interface Props {
  readonly destination: string;
  readonly compact?: boolean;
}

const CULTURE_BADGE_COLORS: Record<TippingGuide['culture'], { bg: string; text: string }> = {
  'tip-expected': { bg: COLORS.coralSubtle, text: COLORS.coral },
  'tip-appreciated': { bg: COLORS.sageSubtle, text: COLORS.sage },
  'no-tip': { bg: COLORS.sageFaint, text: COLORS.gold },
  'tip-offensive': { bg: 'rgba(138,138,138,0.1)', text: COLORS.muted },
};

export default function TippingGuideCard({ destination, compact = false }: Props): React.JSX.Element | null {
  const { t } = useTranslation();
  const guide = getTippingGuide(destination);
  const [expanded, setExpanded] = useState(false);

  const toggleExpand = useCallback(() => {
    Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light).catch(() => {});
    setExpanded((prev) => !prev);
  }, []);

  if (!guide) return null;

  const badgeColors = CULTURE_BADGE_COLORS[guide.culture];
  const displayRules = compact && !expanded ? guide.rules.slice(0, 2) : guide.rules;

  return (
    <View style={s.card}>
      {/* Header */}
      <View style={s.header}>
        <View style={s.iconWrap}>
          <DollarSign size={16} color={COLORS.sage} strokeWidth={1.5} />
        </View>
        <Text style={s.title}>
          {t('tipping.title', { defaultValue: 'Tipping Guide' })}
        </Text>
        <View style={[s.badge, { backgroundColor: badgeColors.bg }]}>
          <Text style={[s.badgeText, { color: badgeColors.text }]}>
            {TIPPING_CULTURE_LABELS[guide.culture]}
          </Text>
        </View>
      </View>

      {/* Summary */}
      <Text style={s.summary}>{guide.summary}</Text>

      {/* Rules */}
      <View style={s.rules}>
        {displayRules.map((rule) => (
          <View key={rule.situation} style={s.rule}>
            <View style={s.ruleHeader}>
              <Text style={s.situation}>{rule.situation}</Text>
              <Text style={s.amount}>{rule.amount}</Text>
            </View>
            <Text style={s.note}>{rule.note}</Text>
          </View>
        ))}
      </View>

      {/* Expand toggle */}
      {compact && guide.rules.length > 2 && (
        <PressableScale onPress={toggleExpand} style={s.expandBtn}>
          <Text style={s.expandText}>
            {expanded
              ? t('common.showLess', { defaultValue: 'Show less' })
              : t('common.showMore', { defaultValue: `Show all ${guide.rules.length} rules` })}
          </Text>
          <ChevronDown
            size={14}
            color={COLORS.sage}
            strokeWidth={1.5}
            style={expanded ? { transform: [{ rotate: '180deg' }] } : undefined}
          />
        </PressableScale>
      )}
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
  } as ViewStyle,
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: SPACING.xs,
    marginBottom: SPACING.sm,
  } as ViewStyle,
  iconWrap: {
    width: 28,
    height: 28,
    borderRadius: RADIUS.full,
    backgroundColor: COLORS.sageSubtle,
    alignItems: 'center',
    justifyContent: 'center',
  } as ViewStyle,
  title: {
    flex: 1,
    fontFamily: FONTS.headerMedium,
    fontSize: 15,
    color: COLORS.cream,
  } as TextStyle,
  badge: {
    paddingHorizontal: SPACING.sm,
    paddingVertical: 2,
    borderRadius: RADIUS.pill,
  } as ViewStyle,
  badgeText: {
    fontFamily: FONTS.mono,
    fontSize: 10,
    textTransform: 'uppercase',
    letterSpacing: 0.5,
  } as TextStyle,
  summary: {
    fontFamily: FONTS.body,
    fontSize: 13,
    color: COLORS.creamDim,
    lineHeight: 18,
    marginBottom: SPACING.md,
  } as TextStyle,
  rules: {
    gap: SPACING.sm,
  } as ViewStyle,
  rule: {
    gap: 2,
  } as ViewStyle,
  ruleHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
  } as ViewStyle,
  situation: {
    fontFamily: FONTS.bodyMedium,
    fontSize: 13,
    color: COLORS.cream,
  } as TextStyle,
  amount: {
    fontFamily: FONTS.mono,
    fontSize: 12,
    color: COLORS.sage,
  } as TextStyle,
  note: {
    fontFamily: FONTS.body,
    fontSize: 11,
    color: COLORS.muted,
    lineHeight: 16,
  } as TextStyle,
  expandBtn: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: SPACING.xs,
    marginTop: SPACING.sm,
    paddingVertical: SPACING.xs,
  } as ViewStyle,
  expandText: {
    fontFamily: FONTS.mono,
    fontSize: 11,
    color: COLORS.sage,
  } as TextStyle,
});
