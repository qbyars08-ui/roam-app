import React, { useCallback, useEffect, useMemo, useRef, useState } from 'react';
import {
  Animated,
  Linking,
  Platform,
  Pressable,
  StyleSheet,
  Text,
  View,
} from 'react-native';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { Smartphone, X } from 'lucide-react-native';
import { useTranslation } from 'react-i18next';
import { COLORS, FONTS, MAGAZINE, RADIUS, SPACING } from '../../lib/constants';

const DISMISS_KEY = '@roam/handoff-banner-dismissed';
const DISMISS_DURATION_MS = 7 * 24 * 60 * 60 * 1000; // 7 days
const APP_STORE_URL = 'https://apps.apple.com/app/roam/id0000000000';

const FEATURES = ['Live GPS', 'Audio Guides', 'Push Alerts', 'Offline Mode'] as const;

interface MobileHandoffBannerProps {
  readonly hasGeneratedTrip: boolean;
}

export default function MobileHandoffBanner({ hasGeneratedTrip }: MobileHandoffBannerProps) {
  const { t } = useTranslation();
  const [visible, setVisible] = useState(false);
  const slideAnim = useRef(new Animated.Value(120)).current;

  useEffect(() => {
    if (Platform.OS !== 'web' || !hasGeneratedTrip) return;

    const checkDismissed = async () => {
      try {
        const raw = await AsyncStorage.getItem(DISMISS_KEY);
        if (raw) {
          const dismissedAt = Number(raw);
          if (Date.now() - dismissedAt < DISMISS_DURATION_MS) return;
        }
        setVisible(true);
      } catch {
        setVisible(true);
      }
    };

    checkDismissed();
  }, [hasGeneratedTrip]);

  useEffect(() => {
    if (!visible) return;
    Animated.spring(slideAnim, {
      toValue: 0,
      useNativeDriver: true,
      tension: 60,
      friction: 12,
    }).start();
  }, [visible, slideAnim]);

  const handleDismiss = useCallback(async () => {
    Animated.timing(slideAnim, {
      toValue: 120,
      duration: 200,
      useNativeDriver: true,
    }).start(() => setVisible(false));
    try {
      await AsyncStorage.setItem(DISMISS_KEY, String(Date.now()));
    } catch {
      // Silently fail — banner just won't persist dismissal
    }
  }, [slideAnim]);

  const handleGetApp = useCallback(() => {
    Linking.openURL(APP_STORE_URL);
  }, []);

  const featureChips = useMemo(
    () =>
      FEATURES.map((feature) => (
        <View key={feature} style={styles.chip}>
          <Text style={styles.chipText}>{feature}</Text>
        </View>
      )),
    [],
  );

  if (Platform.OS !== 'web' || !visible) return null;

  return (
    <Animated.View style={[styles.container, { transform: [{ translateY: slideAnim }] }]}>
      <View style={styles.inner}>
        <Smartphone color={COLORS.sage} size={22} strokeWidth={1.5} />

        <View style={styles.content}>
          <Text style={styles.heading}>
            {t('web.handoffTitle', { defaultValue: 'Your trip is ready' })}
          </Text>
          <Text style={styles.body}>
            {t('web.handoffBody', {
              defaultValue:
                'Get ROAM on your phone for live navigation, audio guides, and offline access.',
            })}
          </Text>
          <View style={styles.chips}>{featureChips}</View>
        </View>

        <Pressable onPress={handleGetApp} style={styles.ctaButton}>
          <Text style={styles.ctaText}>
            {t('web.getTheApp', { defaultValue: 'Get the App' })}
          </Text>
        </Pressable>

        <Pressable onPress={handleDismiss} hitSlop={12} style={styles.dismiss}>
          <X color={COLORS.muted} size={18} strokeWidth={1.5} />
        </Pressable>
      </View>
    </Animated.View>
  );
}

const styles = StyleSheet.create({
  container: {
    position: 'absolute' as const,
    bottom: 0,
    left: 0,
    right: 0,
    zIndex: 999,
    paddingHorizontal: SPACING.md,
    paddingBottom: SPACING.md,
  },
  inner: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: COLORS.surface2,
    borderLeftWidth: MAGAZINE.accentBorder,
    borderLeftColor: COLORS.sage,
    borderRadius: RADIUS.md,
    paddingVertical: SPACING.md,
    paddingHorizontal: SPACING.md,
    gap: SPACING.sm,
  },
  content: {
    flex: 1,
  },
  heading: {
    fontFamily: FONTS.headerMedium,
    fontSize: 14,
    color: COLORS.cream,
    marginBottom: 2,
  },
  body: {
    fontFamily: FONTS.body,
    fontSize: 12,
    color: COLORS.creamDim,
    lineHeight: 18,
    marginBottom: SPACING.xs,
  },
  chips: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: SPACING.xs,
  },
  chip: {
    backgroundColor: COLORS.sageVeryFaint,
    borderRadius: RADIUS.sm,
    paddingHorizontal: 6,
    paddingVertical: 2,
  },
  chipText: {
    fontFamily: FONTS.mono,
    fontSize: 10,
    color: COLORS.sage,
    letterSpacing: 0.3,
  },
  ctaButton: {
    backgroundColor: COLORS.sage,
    borderRadius: RADIUS.pill,
    paddingHorizontal: SPACING.md,
    paddingVertical: SPACING.sm,
  },
  ctaText: {
    fontFamily: FONTS.bodyMedium,
    fontSize: 13,
    color: COLORS.bg,
  },
  dismiss: {
    padding: SPACING.xs,
  },
});
