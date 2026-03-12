// =============================================================================
// ROAM — Custom tab bar SVG icons (24x24, stroke 1.5, rounded caps)
// Minimal, line-based, architectural — not rounded squares
// =============================================================================
import React from 'react';
import Svg, { Path, Circle, Line } from 'react-native-svg';
import { COLORS } from '../../lib/constants';

const SIZE = 24;
const STROKE = 1.5;

type IconProps = {
  size?: number;
  color?: string;
  focused?: boolean;
};

const activeColor = COLORS.gold;
const inactiveColor = 'rgba(255,255,255,0.4)';

// Discover — minimal compass rose (cardinal points, thin lines)
export function IconDiscover({ size = SIZE, color, focused }: IconProps) {
  const c = color ?? (focused ? activeColor : inactiveColor);
  return (
    <Svg width={size} height={size} viewBox="0 0 24 24" fill="none" stroke={c} strokeWidth={STROKE} strokeLinecap="round" strokeLinejoin="round">
      <Line x1={12} y1={2} x2={12} y2={6} />
      <Line x1={12} y1={18} x2={12} y2={22} />
      <Line x1={2} y1={12} x2={6} y2={12} />
      <Line x1={18} y1={12} x2={22} y2={12} />
      <Line x1={5.64} y1={5.64} x2={8.12} y2={8.12} />
      <Line x1={15.88} y1={15.88} x2={18.36} y2={18.36} />
      <Line x1={5.64} y1={18.36} x2={8.12} y2={15.88} />
      <Line x1={15.88} y1={8.12} x2={18.36} y2={5.64} />
      <Circle cx={12} cy={12} r={4} />
    </Svg>
  );
}

// Plan — minimal calendar with one dot
export function IconPlan({ size = SIZE, color, focused }: IconProps) {
  const c = color ?? (focused ? activeColor : inactiveColor);
  return (
    <Svg width={size} height={size} viewBox="0 0 24 24" fill="none" stroke={c} strokeWidth={STROKE} strokeLinecap="round" strokeLinejoin="round">
      <Path d="M3 9h18v12H3V9z" />
      <Path d="M3 6h18v3H3V6z" />
      <Path d="M8 3v3M16 3v3" />
      <Circle cx={12} cy={14} r={1.5} fill={focused ? activeColor : 'transparent'} stroke={c} strokeWidth={focused ? 0 : STROKE} />
    </Svg>
  );
}

// Ask — minimal waveform (3 lines of different heights)
export function IconAsk({ size = SIZE, color, focused }: IconProps) {
  const c = color ?? (focused ? activeColor : inactiveColor);
  return (
    <Svg width={size} height={size} viewBox="0 0 24 24" fill="none" stroke={c} strokeWidth={STROKE} strokeLinecap="round" strokeLinejoin="round">
      <Line x1={5} y1={14} x2={5} y2={10} />
      <Line x1={12} y1={16} x2={12} y2={8} />
      <Line x1={19} y1={15} x2={19} y2={9} />
    </Svg>
  );
}

// PREP — minimal shield outline
export function IconPrep({ size = SIZE, color, focused }: IconProps) {
  const c = color ?? (focused ? activeColor : inactiveColor);
  return (
    <Svg width={size} height={size} viewBox="0 0 24 24" fill="none" stroke={c} strokeWidth={STROKE} strokeLinecap="round" strokeLinejoin="round">
      <Path d="M12 3l8 4v6c0 5.5-3.8 10.7-8 12-4.2-1.3-8-6.5-8-12V7l8-4z" />
    </Svg>
  );
}

// Saved / My Trips — minimal suitcase
export function IconSaved({ size = SIZE, color, focused }: IconProps) {
  const c = color ?? (focused ? activeColor : inactiveColor);
  return (
    <Svg width={size} height={size} viewBox="0 0 24 24" fill="none" stroke={c} strokeWidth={STROKE} strokeLinecap="round" strokeLinejoin="round">
      <Path d="M4 8h16v12H4V8z" />
      <Path d="M8 8V5a2 2 0 012-2h4a2 2 0 012 2v3" />
      <Line x1={4} y1={13} x2={20} y2={13} />
    </Svg>
  );
}

// You — minimal circle with smaller circle inside (person/silhouette)
export function IconYou({ size = SIZE, color, focused }: IconProps) {
  const c = color ?? (focused ? activeColor : inactiveColor);
  return (
    <Svg width={size} height={size} viewBox="0 0 24 24" fill="none" stroke={c} strokeWidth={STROKE} strokeLinecap="round" strokeLinejoin="round">
      <Circle cx={12} cy={8} r={3} />
      <Path d="M5 20c0-4 3-7 7-7s7 3 7 7" />
    </Svg>
  );
}

// Ask tab pulse dot (green, subtle)
export function IconAskPulseDot({ size = 6 }: { size?: number }) {
  return (
    <Svg width={size} height={size} viewBox="0 0 6 6">
      <Circle cx={3} cy={3} r={3} fill={COLORS.sage} />
    </Svg>
  );
}
