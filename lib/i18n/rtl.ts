// =============================================================================
// ROAM — RTL (Right-to-Left) support
// Manages I18nManager for RTL languages and provides layout helpers
// =============================================================================
import { I18nManager, Platform } from 'react-native';
import type { SupportedLanguage } from './index';

const RTL_LANGUAGES: ReadonlySet<string> = new Set(['ar', 'he', 'fa', 'ur']);

export function isRTLLanguage(locale: string): boolean {
  return RTL_LANGUAGES.has(locale);
}

export function applyRTL(locale: SupportedLanguage): void {
  const shouldBeRTL = isRTLLanguage(locale);
  if (I18nManager.isRTL !== shouldBeRTL) {
    I18nManager.allowRTL(shouldBeRTL);
    I18nManager.forceRTL(shouldBeRTL);
  }
}

/**
 * Logical layout properties for RTL-safe styling.
 * Use these instead of paddingLeft/paddingRight, marginLeft/marginRight, etc.
 *
 * React Native supports `Start`/`End` suffixes that automatically flip in RTL:
 * - paddingStart → paddingLeft (LTR) / paddingRight (RTL)
 * - paddingEnd   → paddingRight (LTR) / paddingLeft (RTL)
 * - marginStart  → marginLeft (LTR) / marginRight (RTL)
 * - marginEnd    → marginRight (LTR) / marginLeft (RTL)
 *
 * For flexDirection, use 'row' (automatically reverses in RTL on RN 0.62+).
 */

type LogicalSpacing = {
  paddingStart: number;
  paddingEnd: number;
};

type LogicalMargin = {
  marginStart: number;
  marginEnd: number;
};

export function logicalPadding(start: number, end: number): LogicalSpacing {
  return { paddingStart: start, paddingEnd: end };
}

export function logicalMargin(start: number, end: number): LogicalMargin {
  return { marginStart: start, marginEnd: end };
}

/**
 * Returns the correct text alignment for the current layout direction.
 */
export function textAlign(): 'left' | 'right' {
  return I18nManager.isRTL ? 'right' : 'left';
}

/**
 * Returns 'row' or 'row-reverse' based on RTL state.
 * Useful when you need explicit control (most RN flex rows auto-flip).
 */
export function flexRow(): 'row' | 'row-reverse' {
  return I18nManager.isRTL ? 'row-reverse' : 'row';
}
