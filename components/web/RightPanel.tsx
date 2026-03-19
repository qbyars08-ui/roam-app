// =============================================================================
// ROAM — RightPanel
// Slide-in right panel for contextual content (itinerary, map, flight details)
// 400px wide, animated slide from right
// Only renders on Platform.OS === 'web'
// =============================================================================

import React, { useEffect, useRef, useCallback } from 'react';
import {
  Animated,
  Platform,
  Pressable,
  StyleSheet,
  View,
} from 'react-native';
import { X } from 'lucide-react-native';
import { COLORS, SPACING, RADIUS } from '../../lib/constants';

import type { ReactNode } from 'react';

// ---------------------------------------------------------------------------
// Guard — renders nothing on non-web platforms
// ---------------------------------------------------------------------------
if (Platform.OS !== 'web') {
  // eslint-disable-next-line @typescript-eslint/no-unused-vars
  module.exports = { default: () => null };
}

// ---------------------------------------------------------------------------
// Types
// ---------------------------------------------------------------------------
interface RightPanelProps {
  readonly visible: boolean;
  readonly onClose: () => void;
  readonly children?: ReactNode;
}

// ---------------------------------------------------------------------------
// Constants
// ---------------------------------------------------------------------------
const PANEL_WIDTH = 400;
const ANIMATION_DURATION = 250;

// ---------------------------------------------------------------------------
// RightPanel Component
// ---------------------------------------------------------------------------
export default function RightPanel({
  visible,
  onClose,
  children,
}: RightPanelProps) {
  if (Platform.OS !== 'web') return null;

  const slideAnim = useRef(new Animated.Value(PANEL_WIDTH)).current;

  useEffect(() => {
    Animated.timing(slideAnim, {
      toValue: visible ? 0 : PANEL_WIDTH,
      duration: ANIMATION_DURATION,
      useNativeDriver: true,
    }).start();
  }, [visible, slideAnim]);

  const handleClose = useCallback(() => {
    onClose();
  }, [onClose]);

  // Don't render at all when fully hidden (saves layout space)
  if (!visible) return null;

  return (
    <Animated.View
      style={[
        styles.container,
        { transform: [{ translateX: slideAnim }] },
      ]}
    >
      {/* ── Close Button ── */}
      <Pressable onPress={handleClose} style={styles.closeButton}>
        <X size={18} strokeWidth={1.5} color={COLORS.muted} />
      </Pressable>

      {/* ── Content ── */}
      <View style={styles.content}>{children}</View>
    </Animated.View>
  );
}

// ---------------------------------------------------------------------------
// Styles
// ---------------------------------------------------------------------------
const styles = StyleSheet.create({
  container: {
    width: PANEL_WIDTH,
    height: '100%' as unknown as number,
    backgroundColor: COLORS.surface1,
    borderLeftWidth: 1,
    borderLeftColor: COLORS.border,
    position: 'relative',
  },
  closeButton: {
    position: 'absolute',
    top: SPACING.md,
    right: SPACING.md,
    zIndex: 10,
    width: 32,
    height: 32,
    borderRadius: RADIUS.sm,
    backgroundColor: COLORS.bgGlass,
    alignItems: 'center',
    justifyContent: 'center',
  },
  content: {
    flex: 1,
    paddingTop: SPACING.xxl,
    paddingHorizontal: SPACING.md,
    paddingBottom: SPACING.md,
  },
});
