// =============================================================================
// ROAM — Offline Banner
// Shows a subtle top banner when the device loses internet connectivity
// =============================================================================
import React, { useEffect, useState } from 'react';
import { View, Text, Animated, StyleSheet, Platform, type ViewStyle, type TextStyle } from 'react-native';
import NetInfo from '@react-native-community/netinfo';
import { WifiOff } from 'lucide-react-native';
import { useTranslation } from 'react-i18next';
import { COLORS, FONTS, SPACING, RADIUS } from '../../lib/constants';

export default function OfflineBanner() {
  const [isOffline, setIsOffline] = useState(false);
  const [translateY] = useState(() => new Animated.Value(-50));
  const { t } = useTranslation();

  useEffect(() => {
    const unsubscribe = NetInfo.addEventListener((state) => {
      const offline = !(state.isConnected && state.isInternetReachable !== false);
      setIsOffline(offline);
    });
    return () => unsubscribe();
  }, []);

  useEffect(() => {
    Animated.spring(translateY, {
      toValue: isOffline ? 0 : -50,
      useNativeDriver: true,
      tension: 80,
      friction: 12,
    }).start();
  }, [isOffline, translateY]);

  // Skip on web — banner not relevant for browser
  if (Platform.OS === 'web') return null;

  return (
    <Animated.View
      style={[styles.banner, { transform: [{ translateY }] }]}
      pointerEvents="none"
    >
      <View style={styles.pill}>
        <WifiOff size={14} color={COLORS.white} strokeWidth={2.5} />
        <Text style={styles.text}>{t('common.offline')}</Text>
      </View>
    </Animated.View>
  );
}

const styles = StyleSheet.create({
  banner: {
    position: 'absolute',
    top: 0,
    left: 0,
    right: 0,
    zIndex: 1000,
    alignItems: 'center',
    paddingTop: 54,
  } as ViewStyle,
  pill: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: COLORS.coralStrong,
    paddingHorizontal: SPACING.md,
    paddingVertical: SPACING.xs + 2,
    borderRadius: RADIUS.full,
    gap: SPACING.xs,
  } as ViewStyle,
  text: {
    fontFamily: FONTS.bodyMedium,
    fontSize: 13,
    color: COLORS.white,
  } as TextStyle,
});
