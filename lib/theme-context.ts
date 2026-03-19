// =============================================================================
// ROAM — Theme Context
// Provides active color palette (dark or light) to the entire component tree.
// =============================================================================
import { createContext, useContext } from 'react';
import { COLORS, LIGHT_COLORS } from './constants';

type ThemeColors = typeof COLORS;

export const ThemeContext = createContext<{
  colors: ThemeColors;
  isDark: boolean;
}>({ colors: COLORS, isDark: true });

export const useThemeColors = () => useContext(ThemeContext);
