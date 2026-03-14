// =============================================================================
// ROAM — Chaos Dare landing
// Shareable link shows chaotic trip with CTA to open ROAM
// =============================================================================
import React, { useCallback, useEffect, useState } from 'react';
import {
  View,
  Text,
  Pressable,
  StyleSheet,
  ActivityIndicator,
  Linking,
  ImageBackground,
  type ViewStyle,
  type TextStyle,
  type ImageStyle,
} from 'react-native';
import { useTranslation } from 'react-i18next';
import { useRouter, useLocalSearchParams } from 'expo-router';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { LinearGradient } from 'expo-linear-gradient';
import * as Haptics from '../lib/haptics';
import { COLORS, FONTS, SPACING, RADIUS } from '../lib/constants';
import { getChaosDare, type ChaosDare } from '../lib/chaos-dare';
import { getDestinationPhoto } from '../lib/photos';
import { BUDGETS, VIBES } from '../lib/constants';
import { withComingSoon } from '../lib/with-coming-soon';

function ChaosDareScreen() {
  const { t } = useTranslation();
  const router = useRouter();
  const insets = useSafeAreaInsets();
  const params = useLocalSearchParams<{ id?: string }>();
  const [dare, setDare] = useState<ChaosDare | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const id = params.id as string | undefined;
    if (!id) {
      setLoading(false);
      return;
    }
    getChaosDare(id).then((d) => {
      setDare(d);
      setLoading(false);
    });
  }, [params.id]);

  const handleOpenROAM = useCallback(() => {
    Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Medium);
    Linking.openURL('https://roamappwait.netlify.app').catch(() => {});
  }, []);

  if (loading) {
    return (
      <View style={[styles.container, styles.center, { paddingTop: insets.top }]}>
        <ActivityIndicator color={COLORS.gold} size="large" />
      </View>
    );
  }

  if (!dare) {
    return (
      <View style={[styles.container, styles.center, { paddingTop: insets.top }]}>
        <Text style={styles.errorText}>{t('chaosDare.dareNotFound')}</Text>
        <Pressable onPress={() => router.back()} style={styles.ctaBtn}>
          <Text style={styles.ctaBtnText}>{t('common.back')}</Text>
        </Pressable>
      </View>
    );
  }

  const budgetLabel = BUDGETS.find((b) => b.id === dare.budget)?.label ?? dare.budget;
  const vibeLabels = dare.vibes.map((v) => VIBES.find((vb) => vb.id === v)?.label ?? v);

  return (
    <View style={[styles.container, { paddingTop: insets.top }]}>
      <ImageBackground
        source={{ uri: getDestinationPhoto(dare.destination) }}
        style={styles.bg}
        imageStyle={styles.bgImage as ImageStyle}
      >
        <LinearGradient
          colors={[COLORS.overlaySoft, COLORS.overlayStrong]}
          style={styles.grad}
        >
          <Text style={styles.eyebrow}>{t('chaosDare.someoneDaredYou')}</Text>
          <Text style={styles.title}>{dare.destination}</Text>
          <Text style={styles.meta}>
            {dare.days} days · {budgetLabel} · {vibeLabels.join(', ')}
          </Text>
          <Text style={styles.dare}>{t('chaosDare.dareYouToDoThisTrip')}</Text>
          <Pressable
            onPress={handleOpenROAM}
            style={({ pressed }) => [styles.ctaBtn, { opacity: pressed ? 0.9 : 1 }]}
          >
            <LinearGradient
              colors={[COLORS.gold, COLORS.gold + 'cc']}
              style={styles.ctaGrad}
            >
              <Text style={styles.ctaBtnText}>{t('chaosDare.openRoamToClaim')}</Text>
            </LinearGradient>
          </Pressable>
        </LinearGradient>
      </ImageBackground>
    </View>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: COLORS.bg } as ViewStyle,
  center: { justifyContent: 'center', alignItems: 'center' } as ViewStyle,
  bg: { flex: 1 } as ViewStyle,
  bgImage: { resizeMode: 'cover' as const, overflow: 'hidden' as const } as ImageStyle,
  grad: {
    flex: 1,
    justifyContent: 'flex-end',
    padding: SPACING.xl,
    paddingBottom: SPACING.xxxl,
  } as ViewStyle,
  eyebrow: {
    fontFamily: FONTS.mono,
    fontSize: 12,
    color: COLORS.gold,
    letterSpacing: 2,
    marginBottom: SPACING.sm,
  } as TextStyle,
  title: {
    fontFamily: FONTS.header,
    fontSize: 36,
    color: COLORS.cream,
    marginBottom: SPACING.sm,
  } as TextStyle,
  meta: {
    fontFamily: FONTS.body,
    fontSize: 16,
    color: COLORS.creamMuted,
    marginBottom: SPACING.lg,
  } as TextStyle,
  dare: {
    fontFamily: FONTS.headerMedium,
    fontSize: 20,
    color: COLORS.cream,
    marginBottom: SPACING.xl,
  } as TextStyle,
  ctaBtn: {
    borderRadius: RADIUS.lg,
    overflow: 'hidden',
  } as ViewStyle,
  ctaGrad: {
    paddingVertical: SPACING.md,
    alignItems: 'center',
  } as ViewStyle,
  ctaBtnText: {
    fontFamily: FONTS.bodySemiBold,
    fontSize: 16,
    color: COLORS.bg,
  } as TextStyle,
  errorText: {
    fontFamily: FONTS.body,
    fontSize: 16,
    color: COLORS.creamMuted,
  } as TextStyle,
});

export default withComingSoon(ChaosDareScreen, { routeName: 'chaos-dare', title: 'Chaos Dare' });
