// =============================================================================
// ROAM — SonarCard
// Reusable premium card for Sonar live intel with bullet-parsed answer,
// LIVE badge, source citations, and "Show more" toggle.
// =============================================================================
import React, { useState, useCallback, useMemo } from 'react';
import {
  Platform,
  Pressable,
  StyleSheet,
  Text,
  View,
  type TextStyle,
  type ViewStyle,
} from 'react-native';
import { LinearGradient } from 'expo-linear-gradient';
import { Info } from 'lucide-react-native';
import { useTranslation } from 'react-i18next';
import LiveBadge from './LiveBadge';
import SourceCitation from './SourceCitation';
import { COLORS, FONTS, SPACING, RADIUS } from '../../lib/constants';
import type { SonarCitation } from '../../lib/types/sonar';

// ---------------------------------------------------------------------------
// Bullet parsing
// ---------------------------------------------------------------------------
const MAX_BULLETS_DEFAULT = 4;

/**
 * Parse a Sonar answer string into an array of bullet strings.
 * Splits on "- " list markers or newlines, strips leading punctuation,
 * and returns non-empty lines.
 */
function parseBullets(answer: string): string[] {
  // If the text contains markdown list markers, split on them
  if (/^\s*[-*•]\s/m.test(answer)) {
    return answer
      .split(/\n+/)
      .map((line) => line.replace(/^\s*[-*•]\s*/, '').trim())
      .filter((line) => line.length > 3);
  }

  // Otherwise split on sentence-like boundaries (periods followed by space/newline)
  // but keep the period at the end
  const sentences = answer
    .split(/(?<=[.!?])\s+/)
    .map((s) => s.trim())
    .filter((s) => s.length > 10);

  if (sentences.length > 1) return sentences;

  // Fallback: split on newlines
  return answer
    .split(/\n+/)
    .map((line) => line.trim())
    .filter((line) => line.length > 3);
}

/**
 * Bold the first N words of a bullet by returning a pair [bold, rest].
 */
function splitBoldRest(text: string, boldWordCount = 4): [string, string] {
  const words = text.split(' ');
  const bold = words.slice(0, boldWordCount).join(' ');
  const rest = words.slice(boldWordCount).join(' ');
  return [bold, rest ? ' ' + rest : ''];
}

// ---------------------------------------------------------------------------
// Props
// ---------------------------------------------------------------------------
export interface SonarCardProps {
  answer: string;
  isLive: boolean;
  citations: SonarCitation[];
  title?: string;
  maxBullets?: number;
  timestamp?: string | null;
  /** If provided, wraps the card in a Pressable */
  onPress?: () => void;
}

// ---------------------------------------------------------------------------
// Component
// ---------------------------------------------------------------------------
export default function SonarCard({
  answer,
  isLive,
  citations,
  title,
  maxBullets = MAX_BULLETS_DEFAULT,
  timestamp,
  onPress,
}: SonarCardProps): React.JSX.Element {
  const { t } = useTranslation();
  const [showAll, setShowAll] = useState(false);

  const bullets = useMemo(() => parseBullets(answer), [answer]);
  const visibleBullets = showAll ? bullets : bullets.slice(0, maxBullets);
  const hasMore = bullets.length > maxBullets;

  const handleToggle = useCallback(() => {
    setShowAll((prev) => !prev);
  }, []);

  const inner = (
    <>
      {/* Card header: title + LIVE badge */}
      <View style={styles.header}>
        {title ? (
          <Text style={styles.title}>{title}</Text>
        ) : null}
        {isLive ? <LiveBadge /> : null}
      </View>

      {/* Bullet list */}
      {visibleBullets.map((bullet, i) => {
        const [bold, rest] = splitBoldRest(bullet);
        return (
          <View key={i} style={styles.bulletRow}>
            <View style={styles.sageDot} />
            <Text style={styles.bulletText} numberOfLines={0}>
              <Text style={styles.bulletBold}>{bold}</Text>
              {rest}
            </Text>
          </View>
        );
      })}

      {/* Show more / less toggle */}
      {hasMore ? (
        <Pressable
          onPress={handleToggle}
          hitSlop={8}
          style={styles.toggleBtn}
          accessibilityRole="button"
          accessibilityLabel={
            showAll
              ? t('sonar.showLess', { defaultValue: 'Show less' })
              : t('sonar.showMore', { defaultValue: 'Show more' })
          }
        >
          <Text style={styles.toggleText}>
            {showAll
              ? t('sonar.showLess', { defaultValue: 'Show less' })
              : `${t('sonar.showMore', { defaultValue: 'Show more' })} (${bullets.length - maxBullets})`}
          </Text>
        </Pressable>
      ) : null}

      {/* Source citations */}
      {citations.length > 0 ? (
        <View style={styles.citationsWrap}>
          <SourceCitation citations={citations} />
        </View>
      ) : null}

      {/* Timestamp */}
      {timestamp ? (
        <Text style={styles.timestamp}>
          {t('sonar.updated', { defaultValue: 'Updated' })}{' '}
          {new Date(timestamp).toLocaleTimeString([], {
            hour: '2-digit',
            minute: '2-digit',
          })}
        </Text>
      ) : null}
    </>
  );

  const cardContent = (
    <View style={[styles.cardWrapper, Platform.OS === 'web' && styles.cardWrapperWeb]}>
      <LinearGradient
        colors={[COLORS.sageGradientStart, COLORS.sageGradientEnd]}
        start={{ x: 0, y: 0 }}
        end={{ x: 0, y: 1 }}
        style={styles.cardLeftBorder}
      />
      <View style={styles.cardInner}>{inner}</View>
    </View>
  );

  if (onPress) {
    return (
      <Pressable
        onPress={onPress}
        style={({ pressed }) => [styles.card, pressed && styles.cardPressed]}
        accessibilityRole="button"
      >
        {cardContent}
      </Pressable>
    );
  }

  return <View style={styles.card}>{cardContent}</View>;
}

// ---------------------------------------------------------------------------
// Fallback: contextual message when live data is not available
// Never says "Live data unavailable" — always helpful and warm.
// ---------------------------------------------------------------------------
export function SonarFallback({
  label,
}: {
  label?: string;
}): React.JSX.Element {
  const { t } = useTranslation();
  // Replace developer-style messages with user-friendly ones
  const displayLabel = label ?? t('sonar.checkBack', { defaultValue: 'Check back closer to your trip for live updates' });
  return (
    <View style={styles.fallback}>
      <Info size={14} color={COLORS.creamDim} strokeWidth={1.5} />
      <Text style={styles.fallbackText}>
        {displayLabel}
      </Text>
    </View>
  );
}

// ---------------------------------------------------------------------------
// APIDataCard: premium formatting for TripAdvisor / Google Places / Foursquare
// ---------------------------------------------------------------------------
export interface APIDataCardProps {
  name: string;
  rating?: number | null;
  reviewCount?: number | null;
  address?: string | null;
  category?: string | null;
  onPress?: () => void;
}

export function APIDataCard({
  name,
  rating,
  reviewCount,
  address,
  category,
  onPress,
}: APIDataCardProps): React.JSX.Element {
  const inner = (
    <>
      {/* Top row: name + category pill */}
      <View style={styles.apiTopRow}>
        <Text style={styles.apiName} numberOfLines={1}>
          {name}
        </Text>
        {category ? (
          <View style={styles.categoryPill}>
            <Text style={styles.categoryPillText} numberOfLines={1}>
              {category}
            </Text>
          </View>
        ) : null}
      </View>

      {/* Rating + review count */}
      {rating != null ? (
        <View style={styles.ratingRow}>
          <Text style={styles.ratingText}>★ {rating.toFixed(1)}</Text>
          {reviewCount != null && reviewCount > 0 ? (
            <Text style={styles.reviewCount}>({reviewCount})</Text>
          ) : null}
        </View>
      ) : null}

      {/* Address — 1 line with ellipsis */}
      {address ? (
        <Text style={styles.addressText} numberOfLines={1} ellipsizeMode="tail">
          {address}
        </Text>
      ) : null}
    </>
  );

  if (onPress) {
    return (
      <Pressable
        onPress={onPress}
        style={({ pressed }) => [styles.apiCard, pressed && styles.cardPressed]}
        accessibilityRole="button"
        accessibilityLabel={name}
      >
        {inner}
      </Pressable>
    );
  }

  return <View style={styles.apiCard}>{inner}</View>;
}

// ---------------------------------------------------------------------------
// Styles
// ---------------------------------------------------------------------------
const styles = StyleSheet.create({
  // ── SonarCard ──────────────────────────────────────────────────────────────
  card: {
    borderRadius: RADIUS.md,
  } as ViewStyle,
  cardPressed: {
    opacity: 0.85,
  } as ViewStyle,
  cardWrapper: {
    flexDirection: 'row',
    borderRadius: RADIUS.md,
    overflow: 'hidden',
    backgroundColor: COLORS.surface1,
    borderWidth: 1,
    borderColor: COLORS.border,
  } as ViewStyle,
  cardWrapperWeb: {
    backgroundColor: COLORS.surfaceGlass,
    ...(Platform.OS === 'web'
      ? ({
          backdropFilter: 'blur(10px)',
          WebkitBackdropFilter: 'blur(10px)',
        } as ViewStyle)
      : {}),
  } as ViewStyle,
  cardLeftBorder: {
    width: 3,
    position: 'absolute',
    left: 0,
    top: 0,
    bottom: 0,
  } as ViewStyle,
  cardInner: {
    flex: 1,
    padding: 16,
    gap: SPACING.xs,
    marginLeft: 3,
  } as ViewStyle,
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    marginBottom: SPACING.xs,
  } as ViewStyle,
  title: {
    fontFamily: FONTS.headerMedium,
    fontSize: 15,
    color: COLORS.cream,
    flex: 1,
    marginRight: SPACING.sm,
  } as TextStyle,
  bulletRow: {
    flexDirection: 'row',
    alignItems: 'flex-start',
    gap: SPACING.sm,
    marginBottom: 2,
  } as ViewStyle,
  sageDot: {
    width: 5,
    height: 5,
    borderRadius: 3,
    backgroundColor: COLORS.sage,
    marginTop: 8,
    flexShrink: 0,
  } as ViewStyle,
  bulletText: {
    flex: 1,
    fontFamily: FONTS.body,
    fontSize: 14,
    color: COLORS.cream,
    lineHeight: 21,
  } as TextStyle,
  bulletBold: {
    fontFamily: FONTS.bodySemiBold,
    color: COLORS.cream,
  } as TextStyle,
  toggleBtn: {
    marginTop: SPACING.xs,
    alignSelf: 'flex-start',
  } as ViewStyle,
  toggleText: {
    fontFamily: FONTS.bodyMedium,
    fontSize: 13,
    color: COLORS.sage,
  } as TextStyle,
  citationsWrap: {
    marginTop: SPACING.sm,
  } as ViewStyle,
  timestamp: {
    fontFamily: FONTS.mono,
    fontSize: 10,
    color: COLORS.creamDim,
    marginTop: SPACING.xs,
  } as TextStyle,

  // ── SonarFallback ──────────────────────────────────────────────────────────
  fallback: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: SPACING.xs,
    paddingVertical: SPACING.md,
  } as ViewStyle,
  fallbackText: {
    fontFamily: FONTS.body,
    fontSize: 14,
    color: COLORS.muted,
  } as TextStyle,

  // ── APIDataCard ─────────────────────────────────────────────────────────────
  apiCard: {
    backgroundColor: COLORS.surface1,
    borderRadius: RADIUS.lg,
    padding: SPACING.md,
    gap: 4,
  } as ViewStyle,
  apiTopRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    gap: SPACING.sm,
  } as ViewStyle,
  apiName: {
    fontFamily: FONTS.bodyMedium,
    fontSize: 15,
    color: COLORS.cream,
    flex: 1,
  } as TextStyle,
  categoryPill: {
    backgroundColor: COLORS.sageSubtle,
    borderWidth: 1,
    borderColor: COLORS.sageBorder,
    borderRadius: RADIUS.pill,
    paddingHorizontal: SPACING.sm,
    paddingVertical: 2,
    flexShrink: 0,
  } as ViewStyle,
  categoryPillText: {
    fontFamily: FONTS.mono,
    fontSize: 9,
    color: COLORS.sage,
    letterSpacing: 0.3,
    maxWidth: 80,
  } as TextStyle,
  ratingRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: SPACING.xs,
  } as ViewStyle,
  ratingText: {
    fontFamily: FONTS.mono,
    fontSize: 13,
    color: COLORS.gold,
  } as TextStyle,
  reviewCount: {
    fontFamily: FONTS.mono,
    fontSize: 11,
    color: COLORS.muted,
  } as TextStyle,
  addressText: {
    fontFamily: FONTS.body,
    fontSize: 12,
    color: COLORS.creamDim,
    lineHeight: 18,
  } as TextStyle,
});
