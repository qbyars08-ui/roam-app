// =============================================================================
// ROAM — Share Card (standalone page for web — open in new tab, screenshot)
// 9:16 Instagram Stories format, full bleed, ready to post
// =============================================================================
import React, { useEffect, useRef, useState } from 'react';
import {
  ImageBackground,
  Platform,
  Pressable,
  ScrollView,
  StyleSheet,
  Text,
  View,
  type TextStyle,
  type ViewStyle,
} from 'react-native';
import { LinearGradient } from 'expo-linear-gradient';
import { useLocalSearchParams, useRouter } from 'expo-router';
import { COLORS, FONTS, SPACING, RADIUS, BUDGETS } from '../lib/constants';
import { getDestinationPhoto } from '../lib/photos';
import BreathingLine from '../components/ui/BreathingLine';
import { withComingSoon } from '../lib/with-coming-soon';

const CARD_WIDTH = 360;
const CARD_HEIGHT = Math.round(CARD_WIDTH * (16 / 9));

const SHARE_STORAGE_KEY = 'roam_share_card';

interface ShareCardData {
  destination: string;
  tagline: string;
  days: number;
  totalBudget: string;
  dailyBudget: number;
  travelStyle: string;
  dayThemes: string[];
  heroUrl: string;
}

// ---------------------------------------------------------------------------
// Component
// ---------------------------------------------------------------------------
function ShareCardPage() {
  const { k } = useLocalSearchParams<{ k?: string }>();
  const router = useRouter();
  const cardRef = useRef<View>(null);
  const [data, setData] = useState<ShareCardData | null>(null);
  const [isDownloading, setIsDownloading] = useState(false);

  useEffect(() => {
    if (Platform.OS !== 'web' || !k) {
      setData(null);
      return;
    }
    try {
      const raw = typeof localStorage !== 'undefined' ? localStorage.getItem(`${SHARE_STORAGE_KEY}_${k}`) : null;
      if (raw) {
        const parsed = JSON.parse(raw) as ShareCardData;
        setData(parsed);
      } else {
        setData(null);
      }
    } catch {
      setData(null);
    }
  }, [k]);

  const handleDownload = async () => {
    if (Platform.OS !== 'web' || isDownloading) return;
    try {
      setIsDownloading(true);
      const { toPng } = await import('html-to-image');
      const node = (cardRef.current as unknown as HTMLElement) ?? document.getElementById('roam-share-card');
      const target = node ?? document.querySelector('[data-share-card]');
      if (!target) throw new Error('Card element not found');
      const dataUrl = await toPng(target as HTMLElement, {
        pixelRatio: 2,
        cacheBust: true,
        fetchRequestInit: { mode: 'cors' },
        skipFonts: false,
      });
      const w = window.open('', '_blank');
      if (w) {
        w.document.write(`<img src="${dataUrl}" style="max-width:100%;height:auto;" alt="ROAM trip" />`);
        w.document.close();
      }
    } catch (err) {
      console.error('[ShareCard] Download error:', err);
    } finally {
      setIsDownloading(false);
    }
  };

  if (!data) {
    return (
      <View style={styles.screen}>
        <Text style={styles.fallbackText}>No share data. Generate a trip first!</Text>
        <Pressable onPress={() => router.back()} style={styles.backBtn}>
          <Text style={styles.backBtnText}>Go back</Text>
        </Pressable>
      </View>
    );
  }

  const travelStyleLabel = BUDGETS.find((b) => b.id === data.travelStyle)?.label ?? data.travelStyle;

  return (
    <View style={styles.screen}>
      <ScrollView
        contentContainerStyle={styles.scrollContent}
        showsVerticalScrollIndicator={false}
      >
        <View
          ref={cardRef}
          nativeID={Platform.OS === 'web' ? 'roam-share-card' : undefined}
          style={[styles.card, { width: CARD_WIDTH, height: CARD_HEIGHT }]}
        >
          <ImageBackground
            source={{ uri: data.heroUrl || getDestinationPhoto(data.destination) }}
            style={styles.hero}
            resizeMode="cover"
          >
            <LinearGradient
              colors={['transparent', COLORS.overlayDarkDim, COLORS.bgDark1515Overlay, COLORS.bgDark1515End]}
              locations={[0.15, 0.45, 0.75, 1]}
              style={styles.overlay}
            >
              {/* Top left: ROAM logo in gold */}
              <Text style={styles.logo}>ROAM</Text>

              {/* Center content */}
              <View style={styles.center}>
                <Text style={styles.destination} numberOfLines={2}>
                  {data.destination}
                </Text>
                {data.tagline ? (
                  <Text style={styles.tagline} numberOfLines={2}>
                    {data.tagline}
                  </Text>
                ) : null}

                {/* 3 pill badges */}
                <View style={styles.pills}>
                  <View style={styles.pill}>
                    <Text style={styles.pillText}>{data.days} days</Text>
                  </View>
                  <View style={styles.pill}>
                    <Text style={styles.pillText}>${data.dailyBudget}/day</Text>
                  </View>
                  <View style={styles.pill}>
                    <Text style={styles.pillText}>{travelStyleLabel}</Text>
                  </View>
                </View>
              </View>

              {/* Bottom: top 3 day themes */}
              <View style={styles.themes}>
                {data.dayThemes.slice(0, 3).map((theme, i) => (
                  <Text key={i} style={styles.themeItem} numberOfLines={1}>
                    Day {i + 1} · {theme}
                  </Text>
                ))}
              </View>

              {/* Very bottom: Built with ROAM */}
              <Text style={styles.builtWith}>Built with ROAM</Text>
            </LinearGradient>
          </ImageBackground>
        </View>

        {Platform.OS === 'web' && (
          <View style={styles.actions}>
            <Pressable
              onPress={handleDownload}
              disabled={isDownloading}
              style={[styles.downloadBtn, isDownloading && styles.downloadBtnDisabled]}
            >
              {isDownloading ? (
                <BreathingLine width={40} height={3} color={COLORS.bg} />
              ) : (
                <Text style={styles.downloadBtnText}>Open image in new tab</Text>
              )}
            </Pressable>
            <Text style={styles.hint}>Screenshot or right-click to save</Text>
          </View>
        )}
      </ScrollView>
    </View>
  );
}

const styles = StyleSheet.create({
  screen: {
    flex: 1,
    backgroundColor: COLORS.bgDark1515End,
    minHeight: '100%',
  } as ViewStyle,
  scrollContent: {
    padding: SPACING.lg,
    alignItems: 'center',
    paddingBottom: 48,
  } as ViewStyle,
  card: {
    borderRadius: RADIUS.lg,
    overflow: 'hidden',
  } as ViewStyle,
  hero: {
    flex: 1,
  } as ViewStyle,
  overlay: {
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
  center: {
    flex: 1,
    justifyContent: 'center',
    paddingVertical: SPACING.lg,
  } as ViewStyle,
  destination: {
    fontFamily: FONTS.header,
    fontSize: 42,
    color: COLORS.white,
    lineHeight: 48,
    letterSpacing: -0.5,
    marginBottom: SPACING.sm,
    textAlign: 'center',
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
    marginTop: SPACING.sm,
  } as TextStyle,
  actions: {
    marginTop: SPACING.xl,
    alignItems: 'center',
    gap: SPACING.sm,
  } as ViewStyle,
  downloadBtn: {
    backgroundColor: COLORS.sage,
    paddingHorizontal: SPACING.xl,
    paddingVertical: SPACING.md,
    borderRadius: RADIUS.lg,
  } as ViewStyle,
  downloadBtnDisabled: {
    opacity: 0.7,
  } as ViewStyle,
  downloadBtnText: {
    fontFamily: FONTS.bodySemiBold,
    fontSize: 16,
    color: COLORS.bgDark1515End,
  } as TextStyle,
  hint: {
    fontFamily: FONTS.body,
    fontSize: 13,
    color: COLORS.slateMuted50,
  } as TextStyle,
  fallbackText: {
    fontFamily: FONTS.body,
    fontSize: 16,
    color: COLORS.cream,
    textAlign: 'center',
    marginBottom: SPACING.lg,
  } as TextStyle,
  backBtn: {
    padding: SPACING.md,
    alignSelf: 'center',
  } as ViewStyle,
  backBtnText: {
    fontFamily: FONTS.bodySemiBold,
    color: COLORS.sage,
    fontSize: 16,
  } as TextStyle,
});

export default withComingSoon(ShareCardPage, { routeName: 'share-card', title: 'Share Card' });
