// =============================================================================
// ROAM — OpenToMeetToggle
// Toggle switch for "Open to meeting people" setting.
// =============================================================================
import React, { useCallback } from 'react';
import { StyleSheet, Switch, Text, View } from 'react-native';
import { COLORS, FONTS, SPACING } from '../../lib/constants';
import * as Haptics from '../../lib/haptics';

// ---------------------------------------------------------------------------
// Types
// ---------------------------------------------------------------------------
interface OpenToMeetToggleProps {
  value: boolean;
  onToggle: (val: boolean) => void;
}

// ---------------------------------------------------------------------------
// Component
// ---------------------------------------------------------------------------
const OpenToMeetToggle = React.memo<OpenToMeetToggleProps>(({ value, onToggle }) => {
  const handleToggle = useCallback(
    async (next: boolean) => {
      await Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
      onToggle(next);
    },
    [onToggle],
  );

  return (
    <View style={styles.row}>
      <View style={styles.labelGroup}>
        <Text style={styles.label}>Open to meeting people</Text>
        <Text style={styles.sublabel}>
          {value ? 'Visible to travelers at your destination' : 'Hidden from other travelers'}
        </Text>
      </View>
      <Switch
        value={value}
        onValueChange={handleToggle}
        trackColor={{ false: COLORS.bgGlass, true: COLORS.sage }}
        thumbColor={COLORS.cream}
        ios_backgroundColor={COLORS.bgGlass}
      />
    </View>
  );
});

OpenToMeetToggle.displayName = 'OpenToMeetToggle';

// ---------------------------------------------------------------------------
// Styles
// ---------------------------------------------------------------------------
const styles = StyleSheet.create({
  row: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: SPACING.md,
    paddingVertical: SPACING.md,
    backgroundColor: COLORS.bgCard,
    borderRadius: 10,
    borderWidth: 1,
    borderColor: COLORS.border,
  },
  labelGroup: {
    flex: 1,
    marginRight: SPACING.md,
  },
  label: {
    fontFamily: FONTS.body,
    fontSize: 15,
    color: COLORS.cream,
  },
  sublabel: {
    fontFamily: FONTS.mono,
    fontSize: 11,
    color: COLORS.creamMuted,
    marginTop: 2,
  },
});

export default OpenToMeetToggle;
