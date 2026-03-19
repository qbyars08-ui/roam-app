// =============================================================================
// ROAM — Web Sidebar Navigation
// 240px left sidebar, collapses to icon-only at tablet (768-1024px)
// Only renders on Platform.OS === 'web'
// =============================================================================

import React, { useCallback, useMemo, useState, useEffect } from 'react';
import {
  Dimensions,
  Platform,
  Pressable,
  StyleSheet,
  Text,
  View,
} from 'react-native';
import { useRouter, useSegments } from 'expo-router';
import {
  Compass,
  Globe,
  Plane,
  Bookmark,
  User,
  Crown,
  ChevronLeft,
  ChevronRight,
} from 'lucide-react-native';
import { COLORS, FONTS, SPACING, RADIUS } from '../../lib/constants';
import { useAppStore } from '../../lib/store';

// ---------------------------------------------------------------------------
// Guard — renders nothing on non-web platforms
// ---------------------------------------------------------------------------
if (Platform.OS !== 'web') {
  // eslint-disable-next-line @typescript-eslint/no-unused-vars
  module.exports = { default: () => null };
}

// ---------------------------------------------------------------------------
// Nav items config
// ---------------------------------------------------------------------------
interface NavItem {
  readonly key: string;
  readonly label: string;
  readonly icon: typeof Compass;
  readonly route: string;
}

const NAV_ITEMS: readonly NavItem[] = [
  { key: 'plan', label: 'Plan', icon: Compass, route: '/(tabs)/plan' },
  { key: 'pulse', label: 'Discover', icon: Globe, route: '/(tabs)/pulse' },
  { key: 'flights', label: 'Flights', icon: Plane, route: '/(tabs)/flights' },
  { key: 'prep', label: 'Saved', icon: Bookmark, route: '/(tabs)/prep' },
  { key: 'people', label: 'Account', icon: User, route: '/(tabs)/people' },
] as const;

const SIDEBAR_WIDTH_FULL = 240;
const SIDEBAR_WIDTH_COLLAPSED = 64;
const TABLET_MIN = 768;
const TABLET_MAX = 1024;

// ---------------------------------------------------------------------------
// Sidebar Component
// ---------------------------------------------------------------------------
export default function Sidebar() {
  if (Platform.OS !== 'web') return null;

  const router = useRouter();
  const segments = useSegments();
  const isPro = useAppStore((s) => s.isPro);

  // Track window width for collapse behavior
  const [windowWidth, setWindowWidth] = useState(Dimensions.get('window').width);
  const [manualCollapse, setManualCollapse] = useState<boolean | null>(null);

  useEffect(() => {
    const subscription = Dimensions.addEventListener('change', ({ window }) => {
      setWindowWidth(window.width);
    });
    return () => subscription.remove();
  }, []);

  const isTablet = windowWidth >= TABLET_MIN && windowWidth <= TABLET_MAX;
  const isCollapsed = manualCollapse !== null ? manualCollapse : isTablet;
  const sidebarWidth = isCollapsed ? SIDEBAR_WIDTH_COLLAPSED : SIDEBAR_WIDTH_FULL;

  // Determine active tab from segments
  const activeTab = useMemo(() => {
    const tabSegment = segments[1] as string | undefined;
    return tabSegment ?? 'plan';
  }, [segments]);

  const handleNavPress = useCallback(
    (route: string) => {
      router.push(route as never);
    },
    [router],
  );

  const handleToggleCollapse = useCallback(() => {
    setManualCollapse((prev) => (prev !== null ? !prev : !isTablet));
  }, [isTablet]);

  const handleUpgradePress = useCallback(() => {
    router.push('/paywall' as never);
  }, [router]);

  return (
    <View style={[styles.container, { width: sidebarWidth }]}>
      {/* ── Logo ── */}
      <View style={styles.logoSection}>
        {isCollapsed ? (
          <Text style={styles.logoCollapsed}>R</Text>
        ) : (
          <Text style={styles.logo}>ROAM</Text>
        )}
      </View>

      {/* ── Nav Items ── */}
      <View style={styles.navSection}>
        {NAV_ITEMS.map((item) => {
          const isActive = activeTab === item.key;
          const IconComponent = item.icon;

          return (
            <Pressable
              key={item.key}
              onPress={() => handleNavPress(item.route)}
              style={[
                styles.navItem,
                isActive && styles.navItemActive,
                isCollapsed && styles.navItemCollapsed,
              ]}
            >
              {isActive && <View style={styles.activeBorder} />}
              <IconComponent
                size={20}
                strokeWidth={1.5}
                color={isActive ? COLORS.sage : COLORS.muted}
              />
              {!isCollapsed && (
                <Text
                  style={[
                    styles.navLabel,
                    isActive && styles.navLabelActive,
                  ]}
                  numberOfLines={1}
                >
                  {item.label}
                </Text>
              )}
            </Pressable>
          );
        })}
      </View>

      {/* ── Spacer ── */}
      <View style={styles.spacer} />

      {/* ── Collapse toggle ── */}
      <Pressable onPress={handleToggleCollapse} style={styles.collapseButton}>
        {isCollapsed ? (
          <ChevronRight size={16} strokeWidth={1.5} color={COLORS.muted} />
        ) : (
          <ChevronLeft size={16} strokeWidth={1.5} color={COLORS.muted} />
        )}
      </Pressable>

      {/* ── Pro badge / Upgrade ── */}
      <View style={styles.bottomSection}>
        {isPro ? (
          <View style={[styles.proBadge, isCollapsed && styles.proBadgeCollapsed]}>
            <Crown size={16} strokeWidth={1.5} color={COLORS.gold} />
            {!isCollapsed && <Text style={styles.proBadgeText}>Pro</Text>}
          </View>
        ) : (
          <Pressable
            onPress={handleUpgradePress}
            style={[styles.upgradeButton, isCollapsed && styles.upgradeButtonCollapsed]}
          >
            <Crown size={16} strokeWidth={1.5} color={COLORS.gold} />
            {!isCollapsed && <Text style={styles.upgradeText}>Upgrade</Text>}
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
  container: {
    height: '100%' as unknown as number,
    backgroundColor: COLORS.surface1,
    borderRightWidth: 1,
    borderRightColor: COLORS.border,
    paddingTop: SPACING.xl,
    paddingBottom: SPACING.md,
    flexDirection: 'column',
  },
  logoSection: {
    paddingHorizontal: SPACING.md,
    marginBottom: SPACING.xl,
  },
  logo: {
    fontFamily: FONTS.header,
    fontSize: 24,
    color: COLORS.sage,
    letterSpacing: 1,
  },
  logoCollapsed: {
    fontFamily: FONTS.header,
    fontSize: 24,
    color: COLORS.sage,
    textAlign: 'center',
  },
  navSection: {
    gap: SPACING.xs,
  },
  navItem: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingVertical: SPACING.sm + 2,
    paddingHorizontal: SPACING.md,
    gap: SPACING.sm + 4,
    position: 'relative',
  },
  navItemActive: {
    backgroundColor: COLORS.sageVeryFaint,
  },
  navItemCollapsed: {
    justifyContent: 'center',
    paddingHorizontal: 0,
  },
  activeBorder: {
    position: 'absolute',
    left: 0,
    top: SPACING.xs,
    bottom: SPACING.xs,
    width: 3,
    backgroundColor: COLORS.sage,
    borderTopRightRadius: RADIUS.sm,
    borderBottomRightRadius: RADIUS.sm,
  },
  navLabel: {
    fontFamily: FONTS.bodyMedium,
    fontSize: 14,
    color: COLORS.muted,
  },
  navLabelActive: {
    color: COLORS.sage,
  },
  spacer: {
    flex: 1,
  },
  collapseButton: {
    alignItems: 'center',
    paddingVertical: SPACING.sm,
    marginBottom: SPACING.sm,
  },
  bottomSection: {
    paddingHorizontal: SPACING.md,
  },
  proBadge: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: SPACING.sm,
    paddingVertical: SPACING.sm,
    paddingHorizontal: SPACING.sm + 4,
    backgroundColor: COLORS.goldFaint,
    borderRadius: RADIUS.md,
    borderWidth: 1,
    borderColor: COLORS.goldBorder,
  },
  proBadgeCollapsed: {
    justifyContent: 'center',
    paddingHorizontal: 0,
  },
  proBadgeText: {
    fontFamily: FONTS.mono,
    fontSize: 12,
    color: COLORS.gold,
    letterSpacing: 0.5,
  },
  upgradeButton: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: SPACING.sm,
    paddingVertical: SPACING.sm,
    paddingHorizontal: SPACING.sm + 4,
    backgroundColor: COLORS.goldVeryFaint,
    borderRadius: RADIUS.pill,
    borderWidth: 1,
    borderColor: COLORS.goldBorder,
  },
  upgradeButtonCollapsed: {
    justifyContent: 'center',
    paddingHorizontal: 0,
  },
  upgradeText: {
    fontFamily: FONTS.bodyMedium,
    fontSize: 13,
    color: COLORS.gold,
  },
});
