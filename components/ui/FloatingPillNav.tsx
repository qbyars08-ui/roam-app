// =============================================================================
// ROAM — Floating pill navigation (5 tabs, frosted glass)
// =============================================================================
import React, { useCallback, useEffect, useRef, useState } from 'react';
import { View, Text, Pressable, StyleSheet, Platform, Animated, type ViewStyle, type LayoutChangeEvent } from 'react-native';
import { BlurView } from 'expo-blur';
import { BottomTabBarProps } from '@react-navigation/bottom-tabs';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { useTranslation } from 'react-i18next';
import { Map, Radio, Plane, Users, Shield, type LucideIcon } from 'lucide-react-native';
import { COLORS, FONTS, SPACING, RADIUS } from '../../lib/constants';
import { captureEvent } from '../../lib/posthog';
import * as Haptics from '../../lib/haptics';

const TAB_ORDER = ['plan', 'pulse', 'flights', 'people', 'prep'] as const;
const TAB_COUNT = TAB_ORDER.length;
const TAB_CONFIG: Record<string, { i18nKey: string; Icon: LucideIcon }> = {
  plan: { i18nKey: 'tabs.plan', Icon: Map },
  pulse: { i18nKey: 'tabs.pulse', Icon: Radio },
  flights: { i18nKey: 'tabs.flights', Icon: Plane },
  people: { i18nKey: 'tabs.people', Icon: Users },
  prep: { i18nKey: 'tabs.prep', Icon: Shield },
};

// ---------------------------------------------------------------------------
// Tab Item (no per-tab bg animation — bar-level sliding indicator instead)
// ---------------------------------------------------------------------------
function PillTabItem({
  route,
  isFocused,
  options,
  label,
  config,
  onPress,
  onLayout,
}: {
  route: { key: string; name: string };
  isFocused: boolean;
  options: { tabBarAccessibilityLabel?: string };
  label: string;
  config: { Icon: LucideIcon };
  onPress: () => void;
  onLayout: (e: LayoutChangeEvent) => void;
}) {
  const scale = useRef(new Animated.Value(1)).current;

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
      onLayout={onLayout}
      style={styles.tab}
      accessibilityRole="button"
      accessibilityState={isFocused ? { selected: true } : {}}
      accessibilityLabel={options.tabBarAccessibilityLabel ?? label}
    >
      <Animated.View style={[styles.tabContent, { transform: [{ scale }] }]}>
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

  // Track tab layouts for sliding indicator
  const tabLayouts = useRef<{ x: number; width: number }[]>(new Array(TAB_COUNT).fill({ x: 0, width: 0 })).current;
  const [layoutsReady, setLayoutsReady] = useState(false);
  const layoutCount = useRef(0);

  const activeIndex = visibleRoutes.findIndex((r) => state.routes[state.index]?.key === r.key);
  const indicatorX = useRef(new Animated.Value(0)).current;
  const indicatorWidth = useRef(new Animated.Value(0)).current;

  const handleTabLayout = useCallback((index: number, e: LayoutChangeEvent) => {
    const { x, width } = e.nativeEvent.layout;
    tabLayouts[index] = { x, width };
    layoutCount.current += 1;
    if (layoutCount.current >= visibleRoutes.length) {
      setLayoutsReady(true);
      // Set initial position without animation
      const layout = tabLayouts[activeIndex >= 0 ? activeIndex : 0];
      if (layout) {
        indicatorX.setValue(layout.x);
        indicatorWidth.setValue(layout.width);
      }
    }
  }, [activeIndex, indicatorX, indicatorWidth, tabLayouts, visibleRoutes.length]);

  useEffect(() => {
    if (!layoutsReady || activeIndex < 0) return;
    const layout = tabLayouts[activeIndex];
    if (!layout) return;
    Animated.parallel([
      Animated.spring(indicatorX, {
        toValue: layout.x,
        useNativeDriver: true,
        tension: 180,
        friction: 18,
      }),
      Animated.spring(indicatorWidth, {
        toValue: layout.width,
        useNativeDriver: false,
        tension: 180,
        friction: 18,
      }),
    ]).start();
  }, [activeIndex, layoutsReady, indicatorX, indicatorWidth, tabLayouts]);

  useEffect(() => {
    tabEntryRef.current = { tab: currentTabName, enteredAt: Date.now() };
  }, [currentTabName]);

  const barContent = (
    <View style={styles.bar}>
      {/* Sliding indicator behind tabs */}
      {layoutsReady && (
        <Animated.View
          style={[
            styles.slidingIndicator,
            {
              width: indicatorWidth,
              transform: [{ translateX: indicatorX }],
            },
          ]}
        />
      )}
      {visibleRoutes.map((route, index) => {
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
            onLayout={(e) => handleTabLayout(index, e)}
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

  if (Platform.OS === 'web') {
    return (
      <View style={pillStyle}>
        <View style={[StyleSheet.absoluteFill, styles.glassWeb]} />
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
    backgroundColor: COLORS.surfaceGlass,
  },
  glassWeb: {
    backgroundColor: COLORS.surfaceGlass,
    borderRadius: RADIUS.pill,
    ...({
      backdropFilter: 'blur(12px)',
      WebkitBackdropFilter: 'blur(12px)',
    } as ViewStyle),
  },
  bar: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    paddingHorizontal: SPACING.lg,
    height: 56,
    gap: SPACING.xs,
  },
  slidingIndicator: {
    position: 'absolute',
    top: 8,
    bottom: 8,
    backgroundColor: COLORS.sageLight,
    borderRadius: RADIUS.pill,
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
  label: {
    fontFamily: FONTS.bodyMedium,
    fontSize: 10,
    marginTop: 2,
  },
});
