// =============================================================================
// ROAM — Minimal line-art SVG illustrations for empty states
// 120x120px, cream #F5EDD8, stroke only, no fill
// =============================================================================
import React from 'react';
import Svg, { Path, Circle } from 'react-native-svg';

import { COLORS } from '../../lib/constants';
const CREAM = COLORS.cream;
const SIZE = 120;
const STROKE = 1.5;

export function EmptySuitcase({ size = SIZE }: { size?: number }) {
  return (
    <Svg width={size} height={size} viewBox="0 0 120 120" fill="none">
      <Path
        d="M30 45h60v55H30z"
        stroke={CREAM}
        strokeWidth={STROKE}
        strokeLinecap="round"
        strokeLinejoin="round"
      />
      <Path
        d="M35 45V35a10 10 0 0110-10h30a10 10 0 0110 10v10"
        stroke={CREAM}
        strokeWidth={STROKE}
        strokeLinecap="round"
        strokeLinejoin="round"
      />
      <Path d="M60 45v55" stroke={CREAM} strokeWidth={STROKE} strokeLinecap="round" />
      <Path d="M40 65h40" stroke={CREAM} strokeWidth={STROKE} strokeLinecap="round" />
      <Path d="M40 80h40" stroke={CREAM} strokeWidth={STROKE} strokeLinecap="round" />
    </Svg>
  );
}

export function EmptyPassport({ size = SIZE }: { size?: number }) {
  return (
    <Svg width={size} height={size} viewBox="0 0 120 120" fill="none">
      <Path
        d="M35 25h50v70H35a5 5 0 01-5-5V30a5 5 0 015-5z"
        stroke={CREAM}
        strokeWidth={STROKE}
        strokeLinecap="round"
        strokeLinejoin="round"
      />
      <Path d="M45 25v70" stroke={CREAM} strokeWidth={STROKE} strokeLinecap="round" />
      <Circle cx="55" cy="45" r="8" stroke={CREAM} strokeWidth={STROKE} fill="none" />
      <Path d="M42 58h26" stroke={CREAM} strokeWidth={STROKE} strokeLinecap="round" />
      <Path d="M42 68h20" stroke={CREAM} strokeWidth={STROKE} strokeLinecap="round" />
    </Svg>
  );
}

export function EmptyMapPin({ size = SIZE }: { size?: number }) {
  return (
    <Svg width={size} height={size} viewBox="0 0 120 120" fill="none">
      <Path
        d="M60 25c-16 0-29 13-29 29 0 22 29 49 29 49s29-27 29-49c0-16-13-29-29-29z"
        stroke={CREAM}
        strokeWidth={STROKE}
        strokeLinecap="round"
        strokeLinejoin="round"
      />
      <Circle cx="60" cy="54" r="10" stroke={CREAM} strokeWidth={STROKE} fill="none" />
    </Svg>
  );
}

export function EmptyPlane({ size = SIZE }: { size?: number }) {
  return (
    <Svg width={size} height={size} viewBox="0 0 120 120" fill="none">
      <Path
        d="M25 65l35-35 20 5 15 20-15 15-25-5-20 30z"
        stroke={CREAM}
        strokeWidth={STROKE}
        strokeLinecap="round"
        strokeLinejoin="round"
      />
      <Path d="M60 30l20 45" stroke={CREAM} strokeWidth={STROKE} strokeLinecap="round" />
      <Path d="M95 55l-55 15" stroke={CREAM} strokeWidth={STROKE} strokeLinecap="round" />
    </Svg>
  );
}
