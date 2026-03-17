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
import { Compass } from 'lucide-react-native';
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
              colors={['rgba(8,15,10,0.15)', 'transparent', COLORS.overlayDarkDim, COLORS.bgDark1515Overlay, COLORS.bgDark1515End]}
              locations={[0, 0.25, 0.5, 0.75, 1]}
              style={styles.overlay}
            >
              {/* Top left: ROAM compass logo */}
              <View style={styles.logoRow}>
                <Compass size={16} color={COLORS.sage} strokeWidth={2} />
                <Text style={styles.logo}>ROAM</Text>
              </View>

              {/* Spacer — photo breathes */}
              <View style={styles.spacer} />

              {/* Bottom content block */}
              <View style={styles.bottomBlock}>
                {/* Destination name — large, dramatic */}
                <Text style={styles.destination} numberOfLines={2}>
                  {trip.destination}
                </Text>

                {/* Trip meta line */}
                <Text style={styles.metaLine}>
                  {dayCount} days{dailyCost ? ` · $${dailyCost}/day` : ''} · {travelStyle}
                </Text>

                {/* Tagline if provided */}
                {tagline ? (
                  <Text style={styles.tagline} numberOfLines={2}>
                    {tagline}
                  </Text>
                ) : null}

                {/* Top 3 activities as pills */}
                {dayThemes.length > 0 && (
                  <View style={styles.pills}>
                    {dayThemes.slice(0, 3).map((theme, i) => (
                      <View key={i} style={styles.pill}>
                        <Text style={styles.pillText} numberOfLines={1}>{theme}</Text>
                      </View>
                    ))}
                  </View>
                )}

                {/* Bottom branding */}
                <Text style={styles.brandUrl}>roamapp.app</Text>
              </View>
            </LinearGradient>
          </ImageBackground>
        ) : (
          <LinearGradient
            colors={[COLORS.gradientCard, COLORS.gradientCardLight, COLORS.gradientCardDeep, COLORS.gradientCard]}
            start={{ x: 0, y: 0 }}
            end={{ x: 1, y: 1 }}
            style={styles.gradientFallback}
          >
            <View style={styles.logoRow}>
              <Compass size={16} color={COLORS.sage} strokeWidth={2} />
              <Text style={styles.logo}>ROAM</Text>
            </View>
            <View style={styles.spacer} />
            <View style={styles.bottomBlock}>
              <Text style={styles.destination}>{trip.destination}</Text>
              <Text style={styles.metaLine}>
                {dayCount} days{dailyCost ? ` · $${dailyCost}/day` : ''} · {travelStyle}
              </Text>
              {tagline ? <Text style={styles.tagline}>{tagline}</Text> : null}
              {dayThemes.length > 0 && (
                <View style={styles.pills}>
                  {dayThemes.slice(0, 3).map((theme, i) => (
                    <View key={i} style={styles.pill}>
                      <Text style={styles.pillText} numberOfLines={1}>{theme}</Text>
                    </View>
                  ))}
                </View>
              )}
              <Text style={styles.brandUrl}>roamapp.app</Text>
            </View>
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

  logoRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
  } as ViewStyle,

  logo: {
    fontFamily: FONTS.header,
    fontSize: 14,
    color: COLORS.sage,
    letterSpacing: 3,
  } as TextStyle,

  spacer: {
    flex: 1,
    minHeight: 40,
  } as ViewStyle,

  bottomBlock: {
    paddingBottom: 4,
  } as ViewStyle,

  destination: {
    fontFamily: FONTS.header,
    fontSize: 52,
    fontStyle: 'italic',
    color: COLORS.cream,
    lineHeight: 56,
    letterSpacing: -0.5,
    marginBottom: 4,
  } as TextStyle,

  metaLine: {
    fontFamily: FONTS.body,
    fontSize: 16,
    color: COLORS.cream,
    opacity: 0.7,
    marginBottom: SPACING.sm,
  } as TextStyle,

  tagline: {
    fontFamily: FONTS.header,
    fontSize: 18,
    color: COLORS.cream,
    opacity: 0.85,
    lineHeight: 24,
    fontStyle: 'italic',
    marginBottom: SPACING.md,
  } as TextStyle,

  pills: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 8,
    marginBottom: SPACING.lg,
  } as ViewStyle,

  pill: {
    paddingHorizontal: 12,
    paddingVertical: 5,
    borderRadius: RADIUS.full,
    borderWidth: 1,
    borderColor: COLORS.sage,
    backgroundColor: 'rgba(124,175,138,0.12)',
  } as ViewStyle,

  pillText: {
    fontFamily: FONTS.body,
    fontSize: 12,
    color: COLORS.cream,
  } as TextStyle,

  brandUrl: {
    fontFamily: FONTS.mono,
    fontSize: 11,
    color: COLORS.sage,
    letterSpacing: 1,
    textAlign: 'right',
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
