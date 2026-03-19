// =============================================================================
// ROAM — Activity Vote Buttons (thumbs up/down)
// Shown on each activity slot when trip has > 1 collaborator
// =============================================================================
import React, { useCallback } from 'react';
import { View, Text, Pressable, StyleSheet, type TextStyle, type ViewStyle } from 'react-native';
import { ThumbsUp, ThumbsDown } from 'lucide-react-native';
import * as Haptics from '../../lib/haptics';
import { COLORS, FONTS, SPACING, RADIUS } from '../../lib/constants';
import type { VoteSummary, VoteDirection, TimeSlot } from '../../lib/group-trip';

interface Props {
  dayIndex: number;
  slot: TimeSlot;
  summary: VoteSummary | undefined;
  onVote: (dayIndex: number, slot: TimeSlot, direction: VoteDirection) => void;
}

function ActivityVoteButtons({ dayIndex, slot, summary, onVote }: Props) {
  const up = summary?.up ?? 0;
  const down = summary?.down ?? 0;
  const userVote = summary?.userVote ?? null;

  const handleUp = useCallback(() => {
    Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
    onVote(dayIndex, slot, 'up');
  }, [dayIndex, slot, onVote]);

  const handleDown = useCallback(() => {
    Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
    onVote(dayIndex, slot, 'down');
  }, [dayIndex, slot, onVote]);

  return (
    <View style={s.container}>
      <Pressable
        onPress={handleUp}
        style={({ pressed }) => [
          s.voteBtn,
          userVote === 'up' && s.voteBtnActive,
          { opacity: pressed ? 0.7 : 1 },
        ]}
        accessibilityLabel={`Vote up, ${up} votes`}
        accessibilityRole="button"
      >
        <ThumbsUp
          size={14}
          color={userVote === 'up' ? COLORS.sage : COLORS.creamDim}
          strokeWidth={1.5}
        />
        {up > 0 && (
          <Text style={[s.voteCount, userVote === 'up' && s.voteCountActive]}>
            {up}
          </Text>
        )}
      </Pressable>

      <Pressable
        onPress={handleDown}
        style={({ pressed }) => [
          s.voteBtn,
          userVote === 'down' && s.voteBtnDown,
          { opacity: pressed ? 0.7 : 1 },
        ]}
        accessibilityLabel={`Vote down, ${down} votes`}
        accessibilityRole="button"
      >
        <ThumbsDown
          size={14}
          color={userVote === 'down' ? COLORS.coral : COLORS.creamDim}
          strokeWidth={1.5}
        />
        {down > 0 && (
          <Text style={[s.voteCount, userVote === 'down' && s.voteCountDown]}>
            {down}
          </Text>
        )}
      </Pressable>
    </View>
  );
}

const s = StyleSheet.create({
  container: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: SPACING.sm,
    marginTop: SPACING.sm,
  } as ViewStyle,
  voteBtn: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
    paddingVertical: 6,
    paddingHorizontal: 10,
    borderRadius: RADIUS.pill,
    backgroundColor: COLORS.bgGlass,
    borderWidth: 1,
    borderColor: COLORS.border,
  } as ViewStyle,
  voteBtnActive: {
    backgroundColor: COLORS.sageVeryFaint,
    borderColor: COLORS.sageBorder,
  } as ViewStyle,
  voteBtnDown: {
    backgroundColor: COLORS.coralSubtle,
    borderColor: COLORS.coralBorder,
  } as ViewStyle,
  voteCount: {
    fontFamily: FONTS.mono,
    fontSize: 12,
    color: COLORS.creamDim,
  } as TextStyle,
  voteCountActive: {
    color: COLORS.sage,
  } as TextStyle,
  voteCountDown: {
    color: COLORS.coral,
  } as TextStyle,
});

export default React.memo(ActivityVoteButtons);
