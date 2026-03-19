// =============================================================================
// ROAM — Collaborator Avatars Row
// Shows stacked avatar circles for trip collaborators
// =============================================================================
import React from 'react';
import { View, Text, StyleSheet, type TextStyle, type ViewStyle } from 'react-native';
import { COLORS, FONTS, SPACING } from '../../lib/constants';
import type { Collaborator } from '../../lib/group-trip';

interface Props {
  collaborators: Collaborator[];
  maxVisible?: number;
}

function getInitials(name: string | null): string {
  if (!name) return '?';
  const parts = name.trim().split(/\s+/);
  if (parts.length >= 2) {
    return (parts[0][0] + parts[1][0]).toUpperCase();
  }
  return name.slice(0, 2).toUpperCase();
}

const AVATAR_COLORS = [
  COLORS.sage,
  COLORS.gold,
  COLORS.blueAccent,
  COLORS.purpleAccent,
  COLORS.orangeAccent,
  COLORS.coral,
];

function CollaboratorRow({ collaborators, maxVisible = 5 }: Props) {
  if (collaborators.length === 0) return null;

  const visible = collaborators.slice(0, maxVisible);
  const overflow = collaborators.length - maxVisible;

  return (
    <View style={s.container}>
      <View style={s.avatarStack}>
        {visible.map((col, i) => (
          <View
            key={col.id}
            style={[
              s.avatar,
              { backgroundColor: AVATAR_COLORS[i % AVATAR_COLORS.length], marginLeft: i > 0 ? -10 : 0, zIndex: visible.length - i },
            ]}
          >
            <Text style={s.avatarText}>{getInitials(col.displayName)}</Text>
          </View>
        ))}
        {overflow > 0 && (
          <View style={[s.avatar, s.overflowAvatar, { marginLeft: -10, zIndex: 0 }]}>
            <Text style={s.overflowText}>{`+${overflow}`}</Text>
          </View>
        )}
      </View>
      <Text style={s.label}>
        {collaborators.length === 1
          ? 'Just you'
          : `${collaborators.length} people planning`}
      </Text>
    </View>
  );
}

const s = StyleSheet.create({
  container: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: SPACING.sm,
    paddingHorizontal: SPACING.md,
    paddingVertical: SPACING.xs,
  } as ViewStyle,
  avatarStack: {
    flexDirection: 'row',
    alignItems: 'center',
  } as ViewStyle,
  avatar: {
    width: 30,
    height: 30,
    borderRadius: 15,
    alignItems: 'center',
    justifyContent: 'center',
    borderWidth: 2,
    borderColor: COLORS.bg,
  } as ViewStyle,
  avatarText: {
    fontFamily: FONTS.bodySemiBold,
    fontSize: 11,
    color: COLORS.bg,
  } as TextStyle,
  overflowAvatar: {
    backgroundColor: COLORS.surface2,
  } as ViewStyle,
  overflowText: {
    fontFamily: FONTS.mono,
    fontSize: 10,
    color: COLORS.creamDim,
  } as TextStyle,
  label: {
    fontFamily: FONTS.body,
    fontSize: 13,
    color: COLORS.creamDim,
  } as TextStyle,
});

export default React.memo(CollaboratorRow);
