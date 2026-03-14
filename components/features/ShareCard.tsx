// =============================================================================
// ROAM — Shareable Trip Card (Instagram Stories 9:16)
// Full bleed destination photo, gradient overlay, ready to post
// =============================================================================
import React, { useCallback, useRef, useState } from 'react';
import {
  ImageBackground,
  Platform,
  Pressable,
  StyleSheet,
  Text,
  View,
  type ViewStyle,
  type TextStyle,
  type ImageStyle,
} from 'react-native';
import { LinearGradient } from 'expo-linear-gradient';
import { captureRef } from '../../lib/view-shot';
import * as Sharing from 'expo-sharing';
import { COLORS, FONTS, SPACING, RADIUS, BUDGETS } from '../../lib/constants';
import BreathingLine from '../ui/BreathingLine';
import { getHeroPhotoUrl } from '../../lib/heroPhotos';
import { trackEvent } from '../../lib/analytics';
import type { Trip } from '../../lib/store';

const SHARE_STORAGE_KEY = 'roam_share_card';
const CARD_ASPECT = 9 / 16;

// ---------------------------------------------------------------------------
// Types
// ---------------------------------------------------------------------------
interface ShareCardProps {
  trip: Trip;
  totalBudget?: number;
  dailyBudget?: number;
  tagline?: string;
  dayThemes?: string[];
  onDismiss?: () => void;
}

// ---------------------------------------------------------------------------
// Helpers
// ---------------------------------------------------------------------------
function formatBudget(amount?: string | number): string {
  if (amount == null) return '--';
  if (typeof amount === 'number') return `$${amount.toLocaleString()}`;
  return amount;
}

function getTravelStyleLabel(budgetId: string): string {
  return BUDGETS.find((b) => b.id === budgetId)?.label ?? budgetId;
}

// ---------------------------------------------------------------------------
// Component
// ---------------------------------------------------------------------------
export default function ShareCard({
  trip,
  totalBudget,
  dailyBudget,
  tagline,
  dayThemes = [],
  onDismiss,
}: ShareCardProps) {
  const cardRef = useRef<View>(null);
  const [isGenerating, setIsGenerating] = useState(false);

  const dayCount = trip.days;
  const heroPhoto = getHeroPhotoUrl(trip.destination);
  const dailyCost = dailyBudget ?? (totalBudget && trip.days ? Math.round(totalBudget / trip.days) : undefined);
  const travelStyle = getTravelStyleLabel(trip.budget);

  const handleGenerate = useCallback(async () => {
    if (isGenerating) return;

    setIsGenerating(true);

    try {
      if (Platform.OS === 'web') {
        const key = Date.now().toString();
        const data = {
          destination: trip.destination,
          tagline: tagline ?? '',
          days: dayCount,
          totalBudget: formatBudget(totalBudget ?? trip.budget),
          dailyBudget: dailyCost ?? 0,
          travelStyle: trip.budget,
          dayThemes,
          heroUrl: heroPhoto,
        };
        if (typeof localStorage !== 'undefined') {
          localStorage.setItem(`${SHARE_STORAGE_KEY}_${key}`, JSON.stringify(data));
        }
        const url = `${typeof window !== 'undefined' ? window.location.origin : ''}/share-card?k=${key}`;
        window.open(url, '_blank');
        trackEvent('share_card_generated', { destination: trip.destination, platform: 'web' }).catch(() => {});
      } else {
        if (!cardRef.current) return;
        const uri = await captureRef(cardRef, {
          format: 'png',
          quality: 1,
          result: 'tmpfile',
        });
        const isAvailable = await Sharing.isAvailableAsync();
        if (isAvailable) {
          await Sharing.shareAsync(uri, {
            mimeType: 'image/png',
            dialogTitle: `My ${trip.destination} trip on ROAM`,
          });
          trackEvent('share_card_generated', { destination: trip.destination, platform: 'native' }).catch(() => {});
        }
      }
    } catch (error) {
      console.error('[ShareCard] Error:', error);
    } finally {
      setIsGenerating(false);
    }
  }, [isGenerating, trip, totalBudget, dailyCost, tagline, dayThemes, dayCount, heroPhoto]);

  return (
    <View style={styles.wrapper}>
      {/* Card — 9:16 */}
      <View
        ref={cardRef}
        style={[styles.cardOuter, { aspectRatio: CARD_ASPECT }]}
        collapsable={undefined}
      >
        {heroPhoto ? (
          <ImageBackground source={{ uri: heroPhoto }} style={styles.heroBg} resizeMode="cover">
            <LinearGradient
              colors={['transparent', COLORS.overlayDarkDim, COLORS.bgDark1515Overlay, COLORS.bgDark1515End]}
              locations={[0.15, 0.45, 0.75, 1]}
              style={styles.overlay}
            >
              {/* Top left: ROAM logo in gold */}
              <Text style={styles.logo}>ROAM</Text>

              {/* Spacer */}
              <View style={styles.spacer} />

              {/* Center: destination, tagline, pills */}
              <View style={styles.center}>
                <Text style={styles.destination} numberOfLines={2}>
                  {trip.destination}
                </Text>
                {tagline ? (
                  <Text style={styles.tagline} numberOfLines={2}>
                    {tagline}
                  </Text>
                ) : null}

                {/* 3 pill badges */}
                <View style={styles.pills}>
                  <View style={styles.pill}>
                    <Text style={styles.pillText}>{dayCount} days</Text>
                  </View>
                  <View style={styles.pill}>
                    <Text style={styles.pillText}>
                      {dailyCost ? `$${dailyCost}/day` : formatBudget(totalBudget ?? trip.budget)}
                    </Text>
                  </View>
                  <View style={styles.pill}>
                    <Text style={styles.pillText}>{travelStyle}</Text>
                  </View>
                </View>
              </View>

              {/* Bottom: top 3 day themes */}
              {dayThemes.length > 0 && (
                <View style={styles.themes}>
                  {dayThemes.slice(0, 3).map((theme, i) => (
                    <Text key={i} style={styles.themeItem} numberOfLines={1}>
                      Day {i + 1} · {theme}
                    </Text>
                  ))}
                </View>
              )}

              <Text style={styles.builtWith}>Built with ROAM</Text>
            </LinearGradient>
          </ImageBackground>
        ) : (
          <LinearGradient
            colors={[COLORS.gradientCard, COLORS.gradientCardLight, COLORS.gradientCardDeep, COLORS.gradientCard]}
            start={{ x: 0, y: 0 }}
            end={{ x: 1, y: 1 }}
            style={styles.gradientFallback}
          >
            <Text style={styles.logo}>ROAM</Text>
            <View style={styles.spacer} />
            <View style={styles.center}>
              <Text style={styles.destination}>{trip.destination}</Text>
              {tagline ? <Text style={styles.tagline}>{tagline}</Text> : null}
              <View style={styles.pills}>
                <View style={styles.pill}>
                  <Text style={styles.pillText}>{dayCount} days</Text>
                </View>
                <View style={styles.pill}>
                  <Text style={styles.pillText}>{formatBudget(totalBudget ?? trip.budget)}</Text>
                </View>
                <View style={styles.pill}>
                  <Text style={styles.pillText}>{travelStyle}</Text>
                </View>
              </View>
            </View>
            {dayThemes.length > 0 && (
              <View style={styles.themes}>
                {dayThemes.slice(0, 3).map((theme, i) => (
                  <Text key={i} style={styles.themeItem}>
                    Day {i + 1} · {theme}
                  </Text>
                ))}
              </View>
            )}
            <Text style={styles.builtWith}>Built with ROAM</Text>
          </LinearGradient>
        )}
      </View>

      {/* Generate button — animates while rendering */}
      <View style={styles.actions}>
        <Pressable
          onPress={handleGenerate}
          disabled={isGenerating}
          style={({ pressed }) => [
            styles.generateBtn,
            {
              opacity: isGenerating ? 0.8 : pressed ? 0.9 : 1,
              transform: [{ scale: pressed && !isGenerating ? 0.98 : 1 }],
            },
          ]}
        >
          <LinearGradient
            colors={[COLORS.coral, COLORS.coralDark]}
            start={{ x: 0, y: 0 }}
            end={{ x: 1, y: 0 }}
            style={styles.generateGradient}
          >
            {isGenerating ? (
              <BreathingLine width={40} height={3} color={COLORS.white} />
            ) : null}
            <Text style={styles.generateText}>
              {isGenerating
                ? 'Generating...'
                : Platform.OS === 'web'
                ? 'Open card in new tab'
                : 'Save & Share'}
            </Text>
          </LinearGradient>
        </Pressable>

        {Platform.OS === 'web' && (
          <Text style={styles.webHint}>Screenshot or download from the new tab</Text>
        )}

        {onDismiss && (
          <Pressable onPress={onDismiss} style={({ pressed }) => [styles.dismissBtn, { opacity: pressed ? 0.7 : 1 }]}>
            <Text style={styles.dismissText}>Close</Text>
          </Pressable>
        )}
      </View>
    </View>
  );
}

// ---------------------------------------------------------------------------
// Styles
// ---------------------------------------------------------------------------
const styles = StyleSheet.create({
  wrapper: {
    alignItems: 'center',
    paddingHorizontal: SPACING.lg,
  } as ViewStyle,

  cardOuter: {
    width: '100%',
    maxHeight: 580,
    borderRadius: RADIUS.xl,
    overflow: 'hidden',
    borderWidth: 1,
    borderColor: COLORS.whiteFaintBorder,
  } as ViewStyle,

  heroBg: {
    flex: 1,
  } as ImageStyle,

  overlay: {
    flex: 1,
    paddingHorizontal: SPACING.lg,
    paddingTop: SPACING.lg,
    paddingBottom: SPACING.xl,
    justifyContent: 'space-between',
  } as ViewStyle,

  gradientFallback: {
    flex: 1,
    paddingHorizontal: SPACING.lg,
    paddingTop: SPACING.lg,
    paddingBottom: SPACING.xl,
    justifyContent: 'space-between',
  } as ViewStyle,

  logo: {
    fontFamily: FONTS.header,
    fontSize: 18,
    color: COLORS.gold,
    letterSpacing: 4,
  } as TextStyle,

  spacer: {
    flex: 1,
    minHeight: 40,
  } as ViewStyle,

  center: {
    alignItems: 'center',
    paddingVertical: SPACING.md,
  } as ViewStyle,

  destination: {
    fontFamily: FONTS.header,
    fontSize: 40,
    color: COLORS.white,
    lineHeight: 46,
    letterSpacing: -0.5,
    textAlign: 'center',
    marginBottom: SPACING.sm,
  } as TextStyle,

  tagline: {
    fontFamily: FONTS.header,
    fontSize: 20,
    color: COLORS.whiteMuted90,
    lineHeight: 28,
    fontStyle: 'italic',
    textAlign: 'center',
    marginBottom: SPACING.md,
  } as TextStyle,

  pills: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    justifyContent: 'center',
    gap: SPACING.sm,
  } as ViewStyle,

  pill: {
    paddingHorizontal: SPACING.md,
    paddingVertical: SPACING.sm,
    borderRadius: RADIUS.full,
    backgroundColor: COLORS.sageMuted,
    borderWidth: 1,
    borderColor: COLORS.whiteMuted15,
  } as ViewStyle,

  pillText: {
    fontFamily: FONTS.bodyMedium,
    fontSize: 13,
    color: COLORS.white,
  } as TextStyle,

  themes: {
    gap: 4,
  } as ViewStyle,

  themeItem: {
    fontFamily: FONTS.body,
    fontSize: 12,
    color: COLORS.slateMuted75,
  } as TextStyle,

  builtWith: {
    fontFamily: FONTS.mono,
    fontSize: 10,
    color: COLORS.successMuted,
    letterSpacing: 2,
    textAlign: 'center',
  } as TextStyle,

  actions: {
    width: '100%',
    marginTop: SPACING.lg,
    gap: SPACING.sm,
  } as ViewStyle,

  generateBtn: {
    width: '100%',
    borderRadius: RADIUS.lg,
    overflow: 'hidden',
  } as ViewStyle,

  generateGradient: {
    flexDirection: 'row',
    height: 54,
    alignItems: 'center',
    justifyContent: 'center',
    gap: SPACING.sm,
  } as ViewStyle,

  generateSpinner: {
    marginRight: 0,
  } as ViewStyle,

  generateText: {
    fontFamily: FONTS.bodySemiBold,
    fontSize: 16,
    color: COLORS.white,
  } as TextStyle,

  webHint: {
    fontFamily: FONTS.body,
    fontSize: 12,
    color: COLORS.slateMuted50,
    textAlign: 'center',
  } as TextStyle,

  dismissBtn: {
    alignItems: 'center',
    paddingVertical: SPACING.sm,
  } as ViewStyle,

  dismissText: {
    fontFamily: FONTS.bodyMedium,
    fontSize: 14,
    color: COLORS.slateMuted40,
  } as TextStyle,
});
