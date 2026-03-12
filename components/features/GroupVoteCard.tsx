// =============================================================================
// ROAM — Vote Card for Group Trip Itinerary Activities
// Inline voting UI: Keep / Swap / Suggest per activity slot.
// =============================================================================
import React, { useState, useCallback } from 'react';
import {
  View,
  Text,
  TextInput,
  Pressable,
  StyleSheet,
  type ViewStyle,
  type TextStyle,
} from 'react-native';
import * as Haptics from 'expo-haptics';
import { COLORS, FONTS, SPACING, RADIUS } from '../../lib/constants';
import { Check, RefreshCw, Lightbulb } from 'lucide-react-native';
import type { Vote, VoteResults } from '../../lib/types/group';

interface GroupVoteCardProps {
  activityName: string;
  timeSlot: 'morning' | 'afternoon' | 'evening';
  dayNumber: number;
  votes: Vote[];
  memberCount: number;
  currentUserId: string;
  voteResults: VoteResults;
  onVote: (params: {
    dayNumber: number;
    timeSlot: 'morning' | 'afternoon' | 'evening';
    voteType: 'keep' | 'swap' | 'suggest';
    suggestion?: string;
  }) => void;
}

const SLOT_LABELS: Record<string, string> = {
  morning: 'MORNING',
  afternoon: 'AFTERNOON',
  evening: 'EVENING',
};

export default function GroupVoteCard({
  activityName,
  timeSlot,
  dayNumber,
  votes,
  memberCount,
  currentUserId,
  voteResults,
  onVote,
}: GroupVoteCardProps) {
  const [showSuggestion, setShowSuggestion] = useState(false);
  const [suggestionText, setSuggestionText] = useState('');

  const myVote = votes.find((v) => v.userId === currentUserId);
  const keepCount = voteResults.keep;
  const swapCount = voteResults.swap;
  const suggestions = voteResults.suggestions;

  const handleVote = useCallback(
    (type: 'keep' | 'swap' | 'suggest') => {
      Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
      if (type === 'suggest') {
        if (showSuggestion && suggestionText.trim()) {
          onVote({
            dayNumber,
            timeSlot,
            voteType: 'suggest',
            suggestion: suggestionText.trim(),
          });
          setShowSuggestion(false);
          setSuggestionText('');
        } else {
          setShowSuggestion(true);
        }
      } else {
        onVote({ dayNumber, timeSlot, voteType: type });
        setShowSuggestion(false);
      }
    },
    [dayNumber, timeSlot, showSuggestion, suggestionText, onVote]
  );

  return (
    <View style={styles.card}>
      {/* Activity info */}
      <Text style={styles.slotLabel}>{SLOT_LABELS[timeSlot]}</Text>
      <Text style={styles.activityName}>{activityName}</Text>

      {/* Vote buttons */}
      <View style={styles.voteRow}>
        <Pressable
          onPress={() => handleVote('keep')}
          style={[
            styles.voteBtn,
            myVote?.voteType === 'keep' && styles.voteBtnKeepActive,
          ]}
        >
          <Check
            size={14}
            color={myVote?.voteType === 'keep' ? COLORS.bg : COLORS.sage}
            strokeWidth={2}
          />
          <Text
            style={[
              styles.voteBtnText,
              myVote?.voteType === 'keep' && styles.voteBtnTextActive,
            ]}
          >
            Keep
          </Text>
          {keepCount > 0 && (
            <Text style={[
              styles.voteCount,
              myVote?.voteType === 'keep' && styles.voteCountActive,
            ]}>
              {keepCount}/{memberCount}
            </Text>
          )}
        </Pressable>

        <Pressable
          onPress={() => handleVote('swap')}
          style={[
            styles.voteBtn,
            myVote?.voteType === 'swap' && styles.voteBtnSwapActive,
          ]}
        >
          <RefreshCw
            size={14}
            color={myVote?.voteType === 'swap' ? COLORS.bg : COLORS.accentGold}
            strokeWidth={2}
          />
          <Text
            style={[
              styles.voteBtnText,
              myVote?.voteType === 'swap' && styles.voteBtnTextActive,
            ]}
          >
            Swap
          </Text>
          {swapCount > 0 && (
            <Text style={[
              styles.voteCount,
              myVote?.voteType === 'swap' && styles.voteCountActive,
            ]}>
              {swapCount}/{memberCount}
            </Text>
          )}
        </Pressable>

        <Pressable
          onPress={() => handleVote('suggest')}
          style={[
            styles.voteBtn,
            myVote?.voteType === 'suggest' && styles.voteBtnSuggestActive,
          ]}
        >
          <Lightbulb
            size={14}
            color={myVote?.voteType === 'suggest' ? COLORS.bg : COLORS.cream}
            strokeWidth={2}
          />
          <Text
            style={[
              styles.voteBtnText,
              myVote?.voteType === 'suggest' && styles.voteBtnTextActive,
            ]}
          >
            Suggest
          </Text>
        </Pressable>
      </View>

      {/* Suggestion input */}
      {showSuggestion && (
        <View style={styles.suggestRow}>
          <TextInput
            style={styles.suggestInput}
            value={suggestionText}
            onChangeText={setSuggestionText}
            placeholder="What would you rather do?"
            placeholderTextColor={COLORS.creamMuted}
            autoFocus
            onSubmitEditing={() => handleVote('suggest')}
          />
          <Pressable
            onPress={() => handleVote('suggest')}
            disabled={!suggestionText.trim()}
            style={[
              styles.suggestSubmit,
              !suggestionText.trim() && { opacity: 0.4 },
            ]}
          >
            <Text style={styles.suggestSubmitText}>Send</Text>
          </Pressable>
        </View>
      )}

      {/* Previous suggestions */}
      {suggestions.length > 0 && (
        <View style={styles.suggestionsBlock}>
          {suggestions.map((s, i) => {
            const voter = votes.find(
              (v) => v.voteType === 'suggest' && v.suggestion === s
            );
            return (
              <View key={i} style={styles.suggestionRow}>
                <Lightbulb size={12} color={COLORS.accentGold} strokeWidth={2} />
                <Text style={styles.suggestionText}>"{s}"</Text>
              </View>
            );
          })}
        </View>
      )}
    </View>
  );
}

const styles = StyleSheet.create({
  card: {
    backgroundColor: COLORS.bgCard,
    borderRadius: RADIUS.md,
    borderWidth: 1,
    borderColor: COLORS.border,
    padding: SPACING.sm + 2,
    marginTop: SPACING.xs,
  } as ViewStyle,
  slotLabel: {
    fontFamily: FONTS.mono,
    fontSize: 9,
    color: COLORS.sage,
    letterSpacing: 1,
    marginBottom: 2,
  } as TextStyle,
  activityName: {
    fontFamily: FONTS.bodySemiBold,
    fontSize: 14,
    color: COLORS.cream,
    marginBottom: SPACING.sm,
  } as TextStyle,
  voteRow: {
    flexDirection: 'row',
    gap: 6,
  } as ViewStyle,
  voteBtn: {
    flex: 1,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 4,
    paddingVertical: SPACING.xs + 2,
    borderRadius: RADIUS.sm,
    backgroundColor: 'rgba(255,255,255,0.04)',
    borderWidth: 1,
    borderColor: COLORS.border,
  } as ViewStyle,
  voteBtnKeepActive: {
    backgroundColor: COLORS.sage,
    borderColor: COLORS.sage,
  } as ViewStyle,
  voteBtnSwapActive: {
    backgroundColor: COLORS.accentGold,
    borderColor: COLORS.accentGold,
  } as ViewStyle,
  voteBtnSuggestActive: {
    backgroundColor: COLORS.cream,
    borderColor: COLORS.cream,
  } as ViewStyle,
  voteBtnText: {
    fontFamily: FONTS.mono,
    fontSize: 10,
    color: COLORS.cream,
    letterSpacing: 0.3,
  } as TextStyle,
  voteBtnTextActive: {
    color: COLORS.bg,
  } as TextStyle,
  voteCount: {
    fontFamily: FONTS.mono,
    fontSize: 9,
    color: 'rgba(245,237,216,0.4)',
  } as TextStyle,
  voteCountActive: {
    color: 'rgba(8,15,10,0.6)',
  } as TextStyle,
  suggestRow: {
    flexDirection: 'row',
    gap: 8,
    marginTop: SPACING.sm,
  } as ViewStyle,
  suggestInput: {
    flex: 1,
    fontFamily: FONTS.body,
    fontSize: 13,
    color: COLORS.cream,
    backgroundColor: COLORS.bgGlass,
    borderRadius: RADIUS.sm,
    paddingHorizontal: SPACING.sm,
    paddingVertical: SPACING.xs + 2,
    borderWidth: 1,
    borderColor: COLORS.border,
  } as TextStyle,
  suggestSubmit: {
    paddingHorizontal: SPACING.sm + 2,
    paddingVertical: SPACING.xs + 2,
    borderRadius: RADIUS.sm,
    backgroundColor: COLORS.sage,
    justifyContent: 'center',
  } as ViewStyle,
  suggestSubmitText: {
    fontFamily: FONTS.mono,
    fontSize: 11,
    color: COLORS.bg,
  } as TextStyle,
  suggestionsBlock: {
    marginTop: SPACING.sm,
    gap: 4,
  } as ViewStyle,
  suggestionRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
    paddingVertical: 2,
  } as ViewStyle,
  suggestionText: {
    fontFamily: FONTS.body,
    fontSize: 12,
    color: 'rgba(245,237,216,0.7)',
    fontStyle: 'italic',
    flex: 1,
  } as TextStyle,
});
