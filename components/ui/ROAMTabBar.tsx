// =============================================================================
// ROAM — Custom tab bar: frosted glass (dark), gold active, label only when focused
// =============================================================================
import React from 'react';
import { View, Text, Pressable, StyleSheet, Platform } from 'react-native';
import { BlurView } from 'expo-blur';
import { BottomTabBarProps } from '@react-navigation/bottom-tabs';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { COLORS, FONTS, SPACING } from '../../lib/constants';
import { IconDiscover, IconPlan, IconSaved, IconYou } from './TabIcons';

const TAB_ORDER = ['index', 'plan', 'saved', 'profile'] as const;
const TAB_CONFIG: Record<string, { label: string; Icon: React.ComponentType<{ size?: number; color?: string; focused?: boolean }>; showPulse?: boolean }> = {
  index: { label: 'Discover', Icon: IconDiscover },
  plan: { label: 'Plan', Icon: IconPlan },
  saved: { label: 'My Trips', Icon: IconSaved },
  profile: { label: 'You', Icon: IconYou },
};

export default function ROAMTabBar({ state, descriptors, navigation }: BottomTabBarProps) {
  const insets = useSafeAreaInsets();
  const visibleRoutes = TAB_ORDER.map((name) => state.routes.find((r) => r.name === name)).filter(Boolean) as typeof state.routes;

  const barContent = (
    <View style={[styles.bar, { paddingBottom: Math.max(insets.bottom, 12), paddingTop: SPACING.sm }]}>
      {visibleRoutes.map((route) => {
        const { options } = descriptors[route.key];
        const isFocused = state.routes[state.index]?.key === route.key;
        const config = TAB_CONFIG[route.name as keyof typeof TAB_CONFIG];
        if (!config) return null;

        const onPress = () => {
          const event = navigation.emit({
            type: 'tabPress',
            target: route.key,
            canPreventDefault: true,
          });
          if (!isFocused && !event.defaultPrevented) {
            navigation.navigate(route.name, route.params);
          }
        };

        const color = isFocused ? COLORS.gold : COLORS.creamDim;

        return (
          <Pressable
            key={route.key}
            onPress={onPress}
            style={({ pressed }) => [styles.tab, pressed && styles.tabPressed]}
            accessibilityRole="button"
            accessibilityState={isFocused ? { selected: true } : {}}
            accessibilityLabel={options.tabBarAccessibilityLabel ?? config.label}
          >
            <View style={styles.iconWrap}>
              <config.Icon size={24} color={color} focused={isFocused} />
            </View>
            {isFocused && (
              <Text style={[styles.label, { color }]} numberOfLines={1}>
                {config.label}
              </Text>
            )}
          </Pressable>
        );
      })}
    </View>
  );

  if (Platform.OS === 'ios') {
    return (
      <View style={styles.wrapper}>
        <BlurView intensity={80} tint="dark" style={StyleSheet.absoluteFill} />
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
    marginBottom: 8,
    borderRadius: 16,
    overflow: 'hidden',
    borderWidth: 1,
    borderColor: COLORS.border,
  },
  wrapperAndroid: {
    backgroundColor: COLORS.bgDarkGreenMedium,
  },
  barOverlay: {
    backgroundColor: COLORS.creamMuted,
  },
  bar: {
    flexDirection: 'row',
    justifyContent: 'space-around',
    alignItems: 'center',
    paddingHorizontal: SPACING.sm,
  },
  tab: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: SPACING.xs,
    minHeight: 52,
  },
  tabPressed: {
    opacity: 0.7,
  },
  iconWrap: {
    position: 'relative',
    marginBottom: 2,
  },
  pulseDot: {
    position: 'absolute',
    top: -2,
    right: -4,
  },
  label: {
    fontFamily: FONTS.mono,
    fontSize: 10,
    letterSpacing: 0.15,
  },
});
