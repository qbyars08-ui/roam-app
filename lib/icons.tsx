// =============================================================================
// ROAM — Icon Mapping (lucide-react-native)
// Replaces emoji with premium SVG icons
// =============================================================================
import React from 'react';
import Svg, { Rect, Circle } from 'react-native-svg';
import {
  Sparkles,
  Globe,
  Plus,
  MessageCircle,
  Heart,
  BookOpen,
  PawPrint,
  Settings,
  Mountain,
  Palmtree,
  Building2,
  UtensilsCrossed,
  Wallet,
  Swords,
  Flame,
  MapPin,
  Plane,
  Download,
  Map,
  MessageSquare,
  Languages,
  Phone,
  Info,
  Shirt,
  FileText,
  CheckCircle,
} from 'lucide-react-native';
import { COLORS } from './constants';

const iconColor = COLORS.primary;
const iconSize = 20;

export const ICONS = {
  discover: Sparkles,
  spin: Globe,
  plan: Plus,
  chat: MessageCircle,
  saved: Heart,
  passport: BookOpen,
  pets: PawPrint,
  profile: Settings,
  all: Sparkles,
  beaches: Palmtree,
  mountains: Mountain,
  cities: Building2,
  food: UtensilsCrossed,
  adventure: Swords,
  budget: Wallet,
  couples: Flame,
  empty: MapPin,
  flights: Plane,
  prep: Download,
  map: Map,
  aiCompanion: MessageSquare,
  language: Languages,
  emergency: Phone,
  cultural: Info,
  packing: Shirt,
  itinerary: FileText,
  check: CheckCircle,
} as const;

/** Minimal line-based dice icon, 20x20, cream, stroke 1.5 */
export function DiceIcon({ size = 20, color = COLORS.cream }: { size?: number; color?: string }) {
  return (
    <Svg width={size} height={size} viewBox="0 0 20 20">
      <Rect x={2} y={2} width={16} height={16} rx={2} ry={2} stroke={color} strokeWidth={1.5} fill="none" />
      <Circle cx={10} cy={10} r={1.5} stroke={color} strokeWidth={1.5} fill="none" />
    </Svg>
  );
}

export function TabIcon({
  name,
  focused,
  size = iconSize,
}: {
  name: keyof typeof ICONS;
  focused: boolean;
  size?: number;
}) {
  const IconComponent = ICONS[name];
  if (!IconComponent) return null;
  return (
    <IconComponent
      size={size}
      color={focused ? iconColor : COLORS.creamMuted}
      strokeWidth={focused ? 2.5 : 2}
    />
  );
}

export function CategoryIcon({
  name,
  size = 16,
  color = COLORS.creamMuted,
  active = false,
}: {
  name: keyof typeof ICONS;
  size?: number;
  color?: string;
  active?: boolean;
}) {
  const IconComponent = ICONS[name];
  if (!IconComponent) return null;
  return (
    <IconComponent
      size={size}
      color={active ? COLORS.sage : color}
      strokeWidth={active ? 2.5 : 2}
    />
  );
}
