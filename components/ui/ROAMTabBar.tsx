// =============================================================================
// ROAM — Custom tab bar: frosted glass (dark), gold active pill, haptic feedback
// Spring-animated active indicator + label reveal
// =============================================================================
import React, { useEffect, useRef } from 'react';
import { View, Text, Pressable, StyleSheet, Platform, Animated } from 'react-native';
import { BlurView } from 'expo-blur';
import { BottomTabBarProps } from '@react-navigation/bottom-tabs';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { useTranslation } from 'react-i18next';
import { COLORS, FONTS, SPACING, RADIUS } from '../../lib/constants';
import { IconPlan, IconDiscover, IconPeople, IconFlights, IconPrep, IconHealth, IconPulse, IconPets } from './TabIcons';
import { captureEvent } from '../../lib/posthog';
import * as Haptics from '../../lib/haptics';

const TAB_ORDER = ['plan', 'pulse', 'people', 'flights', 'pets', 'prep'] as const;
type TabIconComponent = React.ComponentType<{ size?: number; color?: string; focused?: boolean }>;
const TAB_ICONS: Record<string, { i18nKey: string; Icon: TabIconComponent }> = {
  plan: { i18nKey: 'tabs.plan', Icon: IconPlan },
  pulse: { i18nKey: 'tabs.pulse', Icon: IconPulse },
  people: { i18nKey: 'tabs.people', Icon: IconPeople },
  flights: { i18nKey: 'tabs.flights', Icon: IconFlights },
  pets: { i18nKey: 'tabs.pets', Icon: IconPets },
  prep: { i18nKey: 'tabs.prep', Icon: IconPrep },
};

// ---------------------------------------------------------------------------
// Animated Tab Item — each tab manages its own scale + opacity animations
// ---------------------------------------------------------------------------
function AnimatedTabItem({
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
  config: { Icon: TabIconComponent };
  onPress: () => void;
}) {
  const scale = useRef(new Animated.Value(1)).current;
  const labelOpacity = useRef(new Animated.Value(isFocused ? 1 : 0)).current;
  const iconTranslate = useRef(new Animated.Value(isFocused ? -2 : 0)).current;
  const pillOpacity = useRef(new Animated.Value(isFocused ? 1 : 0)).current;

  useEffect(() => {
    Animated.parallel([
      Animated.spring(labelOpacity, {
        toValue: isFocused ? 1 : 0,
        useNativeDriver: true,
        tension: 120,
        friction: 14,
      }),
      Animated.spring(iconTranslate, {
        toValue: isFocused ? -2 : 0,
        useNativeDriver: true,
        tension: 120,
        friction: 14,
      }),
      Animated.spring(pillOpacity, {
        toValue: isFocused ? 1 : 0,
        useNativeDriver: true,
        tension: 100,
        friction: 12,
      }),
    ]).start();
  }, [isFocused, labelOpacity, iconTranslate, pillOpacity]);

  const handlePressIn = () => {
    Animated.spring(scale, {
      toValue: 0.88,
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

  const color = isFocused ? COLORS.accent : COLORS.muted;

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
        {/* Active pill background */}
        <Animated.View
          style={[
            styles.activePill,
            { opacity: pillOpacity },
          ]}
        />
        <Animated.View style={[styles.iconWrap, { transform: [{ translateY: iconTranslate }] }]}>
          <config.Icon size={22} color={color} focused={isFocused} />
        </Animated.View>
        <Animated.Text
          style={[styles.label, { color, opacity: labelOpacity }]}
          numberOfLines={1}
        >
          {label}
        </Animated.Text>
      </Animated.View>
    </Pressable>
  );
}

// ---------------------------------------------------------------------------
// Main Tab Bar
// ---------------------------------------------------------------------------
export default function ROAMTabBar({ state, descriptors, navigation }: BottomTabBarProps) {
  const insets = useSafeAreaInsets();
  const { t } = useTranslation();
  const visibleRoutes = TAB_ORDER.map((name) => state.routes.find((r) => r.name === name)).filter(Boolean) as typeof state.routes;

  // Track time spent per tab
  const tabEntryRef = useRef<{ tab: string; enteredAt: number } | null>(null);
  const currentTabName = state.routes[state.index]?.name ?? '';

  useEffect(() => {
    tabEntryRef.current = { tab: currentTabName, enteredAt: Date.now() };
  }, [currentTabName]);

  const barContent = (
    <View style={[styles.bar, { paddingBottom: Math.max(insets.bottom, 12), paddingTop: SPACING.sm }]}>
      {visibleRoutes.map((route) => {
        const { options } = descriptors[route.key];
        const isFocused = state.routes[state.index]?.key === route.key;
        const config = TAB_ICONS[route.name as keyof typeof TAB_ICONS];
        if (!config) return null;

        const label = t(config.i18nKey);

        const onPress = () => {
          const event = navigation.emit({
            type: 'tabPress',
            target: route.key,
            canPreventDefault: true,
          });
          if (!isFocused && !event.defaultPrevented) {
            // Haptic feedback on tab switch
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
          <AnimatedTabItem
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

  if (Platform.OS === 'ios') {
    return (
      <View style={styles.wrapper}>
        <BlurView intensity={90} tint="dark" style={StyleSheet.absoluteFill} />
        <View style={[styles.barOverlay, StyleSheet.absoluteFill]} />
        {barContent}
      </View>
    );
  }

  return (
    <View style={[styles.wrapper, styles.wrapperAndroid]}>
      {barContent}
    </View>
  );
}

const styles = StyleSheet.create({
  wrapper: {
    marginHorizontal: 12,
    marginBottom: SPACING.sm,
    borderRadius: RADIUS.xl,
    overflow: 'hidden',
    borderWidth: 1,
    borderColor: COLORS.border,
  },
  wrapperAndroid: {
    backgroundColor: COLORS.bgDarkGreenMedium,
  },
  barOverlay: {
    backgroundColor: COLORS.bgGlass,
  },
  bar: {
    flexDirection: 'row',
    justifyContent: 'space-around',
    alignItems: 'center',
    paddingHorizontal: SPACING.xs,
  },
  tab: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: SPACING.xs,
    minHeight: 52,
  },
  tabContent: {
    alignItems: 'center',
    justifyContent: 'center',
    position: 'relative',
    paddingHorizontal: 10,
    paddingVertical: 4,
  },
  activePill: {
    ...StyleSheet.absoluteFillObject,
    backgroundColor: COLORS.sageLight,
    borderRadius: RADIUS.xl,
    borderWidth: 1,
    borderColor: COLORS.sageBorder,
  },
  iconWrap: {
    position: 'relative',
    marginBottom: 2,
  },
  label: {
    fontFamily: FONTS.mono,
    fontSize: 9,
    letterSpacing: 0.5,
  },
});
