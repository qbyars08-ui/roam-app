// =============================================================================
// ROAM — Custom tab bar SVG icons (24x24, stroke 1.5, rounded caps)
// Minimal, line-based, architectural — not rounded squares
// =============================================================================
import React from 'react';
import Svg, { Path, Circle, Line, Rect } from 'react-native-svg';
import { COLORS } from '../../lib/constants';

const SIZE = 24;
const STROKE = 1.5;

type IconProps = {
  size?: number;
  color?: string;
  focused?: boolean;
};

const activeColor = COLORS.gold;
const inactiveColor = COLORS.creamDim;

// Generate — sparkle / magic wand (two 4-point stars)
export function IconGenerate({ size = SIZE, color, focused }: IconProps) {
  const c = color ?? (focused ? activeColor : inactiveColor);
  return (
    <Svg width={size} height={size} viewBox="0 0 24 24" fill="none" stroke={c} strokeWidth={STROKE} strokeLinecap="round" strokeLinejoin="round">
      <Path d="M9.5 2l1.2 3.8L14.5 7l-3.8 1.2L9.5 12l-1.2-3.8L4.5 7l3.8-1.2L9.5 2z" />
      <Path d="M18 12l.8 2.2L21 15l-2.2.8L18 18l-.8-2.2L15 15l2.2-.8L18 12z" />
      <Line x1={2} y1={21} x2={22} y2={21} strokeOpacity={0.3} />
    </Svg>
  );
}

// Flights — minimal airplane
export function IconFlights({ size = SIZE, color, focused }: IconProps) {
  const c = color ?? (focused ? activeColor : inactiveColor);
  return (
    <Svg width={size} height={size} viewBox="0 0 24 24" fill="none" stroke={c} strokeWidth={STROKE} strokeLinecap="round" strokeLinejoin="round">
      <Path d="M21 16v-2l-8-5V3.5a1.5 1.5 0 00-3 0V9l-8 5v2l8-2.5V19l-2 1.5V22l3.5-1 3.5 1v-1.5L13 19v-5.5l8 2.5z" />
    </Svg>
  );
}

// Stays — minimal building
export function IconStays({ size = SIZE, color, focused }: IconProps) {
  const c = color ?? (focused ? activeColor : inactiveColor);
  return (
    <Svg width={size} height={size} viewBox="0 0 24 24" fill="none" stroke={c} strokeWidth={STROKE} strokeLinecap="round" strokeLinejoin="round">
      <Rect x={4} y={2} width={16} height={20} rx={1} />
      <Line x1={9} y1={6} x2={9} y2={6.01} />
      <Line x1={15} y1={6} x2={15} y2={6.01} />
      <Line x1={9} y1={10} x2={9} y2={10.01} />
      <Line x1={15} y1={10} x2={15} y2={10.01} />
      <Line x1={9} y1={14} x2={9} y2={14.01} />
      <Line x1={15} y1={14} x2={15} y2={14.01} />
      <Path d="M10 22v-4h4v4" />
    </Svg>
  );
}

// Food — minimal utensils (fork + knife)
export function IconFood({ size = SIZE, color, focused }: IconProps) {
  const c = color ?? (focused ? activeColor : inactiveColor);
  return (
    <Svg width={size} height={size} viewBox="0 0 24 24" fill="none" stroke={c} strokeWidth={STROKE} strokeLinecap="round" strokeLinejoin="round">
      <Path d="M7 2v4a3 3 0 006 0V2" />
      <Line x1={10} y1={9} x2={10} y2={22} />
      <Path d="M17 2c-1.7 0-3 1.3-3 3v5h3V2z" />
      <Line x1={17} y1={10} x2={17} y2={22} />
    </Svg>
  );
}

// Prep — minimal shield outline (same as before)
export function IconPrep({ size = SIZE, color, focused }: IconProps) {
  const c = color ?? (focused ? activeColor : inactiveColor);
  return (
    <Svg width={size} height={size} viewBox="0 0 24 24" fill="none" stroke={c} strokeWidth={STROKE} strokeLinecap="round" strokeLinejoin="round">
      <Path d="M12 3l8 4v6c0 5.5-3.8 10.7-8 12-4.2-1.3-8-6.5-8-12V7l8-4z" />
    </Svg>
  );
}

// ─── Legacy icons (kept for ExploreHub and standalone screens) ───

// Discover — minimal compass rose
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

// People — two overlapping person silhouettes
export function IconPeople({ size = SIZE, color, focused }: IconProps) {
  const c = color ?? (focused ? activeColor : inactiveColor);
  return (
    <Svg width={size} height={size} viewBox="0 0 24 24" fill="none" stroke={c} strokeWidth={STROKE} strokeLinecap="round" strokeLinejoin="round">
      <Circle cx={9} cy={7} r={3} />
      <Path d="M2 20c0-3.5 2.5-6 7-6s7 2.5 7 6" />
      <Circle cx={17} cy={7} r={2.5} />
      <Path d="M22 20c0-2.5-1.5-4.5-4.5-5.2" />
    </Svg>
  );
}

// Ask — minimal waveform
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

// You — minimal person silhouette
export function IconYou({ size = SIZE, color, focused }: IconProps) {
  const c = color ?? (focused ? activeColor : inactiveColor);
  return (
    <Svg width={size} height={size} viewBox="0 0 24 24" fill="none" stroke={c} strokeWidth={STROKE} strokeLinecap="round" strokeLinejoin="round">
      <Circle cx={12} cy={8} r={3} />
      <Path d="M5 20c0-4 3-7 7-7s7 3 7 7" />
    </Svg>
  );
}

// Health — heartbeat / activity line
export function IconHealth({ size = SIZE, color, focused }: IconProps) {
  const c = color ?? (focused ? activeColor : inactiveColor);
  return (
    <Svg width={size} height={size} viewBox="0 0 24 24" fill="none" stroke={c} strokeWidth={STROKE} strokeLinecap="round" strokeLinejoin="round">
      <Path d="M4 12h4l2-6 4 12 2-6h4" />
    </Svg>
  );
}

// Pulse — radio waves
export function IconPulse({ size = SIZE, color, focused }: IconProps) {
  const c = color ?? (focused ? activeColor : inactiveColor);
  return (
    <Svg width={size} height={size} viewBox="0 0 24 24" fill="none" stroke={c} strokeWidth={STROKE} strokeLinecap="round" strokeLinejoin="round">
      <Circle cx={12} cy={12} r={2} />
      <Path d="M8.46 15.54a5 5 0 010-7.08" />
      <Path d="M15.54 8.46a5 5 0 010 7.08" />
      <Path d="M5.64 18.36a9 9 0 010-12.72" />
      <Path d="M18.36 5.64a9 9 0 010 12.72" />
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
