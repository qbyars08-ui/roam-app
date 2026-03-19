// =============================================================================
// ROAM — WebLayout
// Main web layout wrapper: sidebar + content + optional right panel
// Only renders on Platform.OS === 'web'
// =============================================================================

import React, { useState, useCallback, useMemo } from 'react';
import { Platform, StyleSheet, View } from 'react-native';
import { COLORS, SPACING } from '../../lib/constants';
import Sidebar from './Sidebar';
import RightPanel from './RightPanel';

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
interface WebLayoutProps {
  readonly children: ReactNode;
  readonly rightPanelContent?: ReactNode;
  readonly rightPanelVisible?: boolean;
  readonly onCloseRightPanel?: () => void;
}

// ---------------------------------------------------------------------------
// Constants
// ---------------------------------------------------------------------------
const CONTENT_MAX_WIDTH = 1200;

// ---------------------------------------------------------------------------
// WebLayout Component
// ---------------------------------------------------------------------------
export default function WebLayout({
  children,
  rightPanelContent,
  rightPanelVisible = false,
  onCloseRightPanel,
}: WebLayoutProps) {
  if (Platform.OS !== 'web') return null;

  const handleClosePanel = useCallback(() => {
    onCloseRightPanel?.();
  }, [onCloseRightPanel]);

  return (
    <View style={styles.container}>
      {/* ── Left Sidebar ── */}
      <Sidebar />

      {/* ── Main Content Area ── */}
      <View style={styles.contentArea}>
        <View style={styles.contentInner}>{children}</View>
      </View>

      {/* ── Right Panel (slides in) ── */}
      <RightPanel visible={rightPanelVisible} onClose={handleClosePanel}>
        {rightPanelContent}
      </RightPanel>
    </View>
  );
}

// ---------------------------------------------------------------------------
// Styles
// ---------------------------------------------------------------------------
const styles = StyleSheet.create({
  container: {
    flex: 1,
    flexDirection: 'row',
    backgroundColor: COLORS.bg,
    height: '100%' as unknown as number,
  },
  contentArea: {
    flex: 1,
    alignItems: 'center',
    overflow: 'hidden' as unknown as undefined,
  },
  contentInner: {
    flex: 1,
    width: '100%' as unknown as number,
    maxWidth: CONTENT_MAX_WIDTH,
    paddingHorizontal: SPACING.lg,
  },
});
