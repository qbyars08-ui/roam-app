// =============================================================================
// ROAM — Floating pill navigation (5 tabs, frosted glass)
// =============================================================================
import React, { useEffect, useRef } from 'react';
import { View, Text, Pressable, StyleSheet, Platform, Animated } from 'react-native';
import { BlurView } from 'expo-blur';
import { BottomTabBarProps } from '@react-navigation/bottom-tabs';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { useTranslation } from 'react-i18next';
import { Map, Radio, Plane, Users, Shield, type LucideIcon } from 'lucide-react-native';
import { COLORS, FONTS, SPACING, RADIUS } from '../../lib/constants';
import { captureEvent } from '../../lib/posthog';
import * as Haptics from '../../lib/haptics';

const TAB_ORDER = ['plan', 'pulse', 'flights', 'people', 'prep'] as const;
const TAB_CONFIG: Record<string, { i18nKey: string; Icon: LucideIcon }> = {
  plan: { i18nKey: 'tabs.plan', Icon: Map },
  pulse: { i18nKey: 'tabs.pulse', Icon: Radio },
  flights: { i18nKey: 'tabs.flights', Icon: Plane },
  people: { i18nKey: 'tabs.people', Icon: Users },
  prep: { i18nKey: 'tabs.prep', Icon: Shield },
};

// ---------------------------------------------------------------------------
// Animated Tab Item
// ---------------------------------------------------------------------------
function PillTabItem({
  route,
  isFocused,
  options,
  label,
  config,
  onPress,
}: {
  route: { key: string; name: string };
  isFocused: boolean;
  options: { tabBarAccessibilityLabel?: string };
  label: string;
  config: { Icon: LucideIcon };
  onPress: () => void;
}) {
  const scale = useRef(new Animated.Value(1)).current;
  const bgOpacity = useRef(new Animated.Value(isFocused ? 1 : 0)).current;

  useEffect(() => {
    Animated.spring(bgOpacity, {
      toValue: isFocused ? 1 : 0,
      useNativeDriver: true,
      tension: 120,
      friction: 14,
    }).start();
  }, [isFocused, bgOpacity]);

  const handlePressIn = () => {
    Animated.spring(scale, {
      toValue: 0.9,
      useNativeDriver: true,
      tension: 300,
      friction: 10,
    }).start();
  };

  const handlePressOut = () => {
    Animated.spring(scale, {
      toValue: 1,
      useNativeDriver: true,
      tension: 200,
      friction: 12,
    }).start();
  };

  const iconColor = isFocused ? COLORS.accent : COLORS.muted;
  const labelColor = isFocused ? COLORS.accent : COLORS.muted;
  const IconComponent = config.Icon;

  return (
    <Pressable
      key={route.key}
      onPress={onPress}
      onPressIn={handlePressIn}
      onPressOut={handlePressOut}
      style={styles.tab}
      accessibilityRole="button"
      accessibilityState={isFocused ? { selected: true } : {}}
      accessibilityLabel={options.tabBarAccessibilityLabel ?? label}
    >
      <Animated.View style={[styles.tabContent, { transform: [{ scale }] }]}>
        <Animated.View style={[styles.activeBg, { opacity: bgOpacity }]} />
        <IconComponent size={20} color={iconColor} strokeWidth={1.5} />
        <Text style={[styles.label, { color: labelColor }]} numberOfLines={1}>
          {label}
        </Text>
      </Animated.View>
    </Pressable>
  );
}

// ---------------------------------------------------------------------------
// Main Floating Pill Nav
// ---------------------------------------------------------------------------
export default function FloatingPillNav({ state, descriptors, navigation }: BottomTabBarProps) {
  const insets = useSafeAreaInsets();
  const { t } = useTranslation();
  const visibleRoutes = TAB_ORDER.map((name) => state.routes.find((r) => r.name === name)).filter(Boolean) as typeof state.routes;

  const tabEntryRef = useRef<{ tab: string; enteredAt: number } | null>(null);
  const currentTabName = state.routes[state.index]?.name ?? '';

  useEffect(() => {
    tabEntryRef.current = { tab: currentTabName, enteredAt: Date.now() };
  }, [currentTabName]);

  const barContent = (
    <View style={styles.bar}>
      {visibleRoutes.map((route) => {
        const { options } = descriptors[route.key];
        const isFocused = state.routes[state.index]?.key === route.key;
        const config = TAB_CONFIG[route.name as keyof typeof TAB_CONFIG];
        if (!config) return null;

        const label = t(config.i18nKey);

        const onPress = () => {
          const event = navigation.emit({
            type: 'tabPress',
            target: route.key,
            canPreventDefault: true,
          });
          if (!isFocused && !event.defaultPrevented) {
            Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
            const now = Date.now();
            const prev = tabEntryRef.current;
            if (prev) {
              captureEvent('tab_switched', {
                from_tab: prev.tab,
                to_tab: route.name,
                time_spent_ms: now - prev.enteredAt,
              });
            }
            navigation.navigate(route.name, route.params);
          }
        };

        return (
          <PillTabItem
            key={route.key}
            route={route}
            isFocused={isFocused}
            options={options}
            label={label}
            config={config}
            onPress={onPress}
          />
        );
      })}
    </View>
  );

  const pillStyle = [styles.wrapper, { bottom: Math.max(insets.bottom, 12) }];

  if (Platform.OS === 'ios') {
    return (
      <View style={pillStyle}>
        <BlurView intensity={80} tint="dark" style={StyleSheet.absoluteFill} />
        <View style={[styles.blurOverlay, StyleSheet.absoluteFill]} />
        {barContent}
      </View>
    );
  }

  return (
    <View style={[pillStyle, styles.wrapperAndroid]}>
      {barContent}
    </View>
  );
}

const styles = StyleSheet.create({
  wrapper: {
    position: 'absolute',
    alignSelf: 'center',
    borderRadius: RADIUS.pill,
    overflow: 'hidden',
    borderWidth: 1,
    borderColor: COLORS.border,
    height: 56,
  },
  wrapperAndroid: {
    backgroundColor: COLORS.surface2,
  },
  blurOverlay: {
    backgroundColor: COLORS.bgGlass,
  },
  bar: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    paddingHorizontal: SPACING.lg,
    height: 56,
    gap: SPACING.xs,
  },
  tab: {
    alignItems: 'center',
    justifyContent: 'center',
    paddingHorizontal: SPACING.md,
    paddingVertical: 6,
  },
  tabContent: {
    alignItems: 'center',
    justifyContent: 'center',
    position: 'relative',
    paddingHorizontal: 12,
    paddingVertical: 6,
    borderRadius: RADIUS.pill,
  },
  activeBg: {
    ...StyleSheet.absoluteFillObject,
    backgroundColor: COLORS.sageLight,
    borderRadius: RADIUS.pill,
  },
  label: {
    fontFamily: FONTS.bodyMedium,
    fontSize: 10,
    marginTop: 2,
  },
});
