// =============================================================================
// ROAM — PhraseCard: Reusable travel phrase with audio + copy
// =============================================================================
import React, { useCallback, useState } from 'react';
import { View, Text, Pressable, StyleSheet } from 'react-native';
import { Volume2, Copy } from 'lucide-react-native';
import * as Clipboard from 'expo-clipboard';
import { COLORS, FONTS, SPACING, RADIUS } from '../../lib/constants';
import { pronounce } from '../../lib/elevenlabs';
import { impactAsync, ImpactFeedbackStyle } from '../../lib/haptics';

interface PhraseCardProps {
  readonly english: string;
  readonly local: string;
  readonly transliteration?: string;
  readonly formalVsInformal?: 'formal' | 'informal' | 'neutral';
  readonly language?: string;
}

export default function PhraseCard({
  english,
  local,
  transliteration,
  formalVsInformal,
  language,
}: PhraseCardProps) {
  const [speaking, setSpeaking] = useState(false);
  const [copied, setCopied] = useState(false);

  const handleSpeak = useCallback(async () => {
    if (speaking) return;
    impactAsync(ImpactFeedbackStyle.Light);
    setSpeaking(true);
    try {
      await pronounce(local, language);
    } catch {
      // Non-critical
    } finally {
      setSpeaking(false);
    }
  }, [local, language, speaking]);

  const handleCopy = useCallback(async () => {
    impactAsync(ImpactFeedbackStyle.Light);
    await Clipboard.setStringAsync(local);
    setCopied(true);
    setTimeout(() => setCopied(false), 1500);
  }, [local]);

  const showBadge =
    formalVsInformal === 'formal' || formalVsInformal === 'informal';

  return (
    <Pressable
      onPress={handleSpeak}
      onLongPress={handleCopy}
      accessibilityLabel={`${english} in local language: ${local}. Tap to hear, long press to copy.`}
      style={({ pressed }) => [styles.card, { opacity: pressed ? 0.85 : 1 }]}
    >
      <Text style={styles.english} numberOfLines={1}>{english}</Text>
      <Text style={styles.local} numberOfLines={2}>{local}</Text>
      {transliteration ? (
        <Text style={styles.transliteration} numberOfLines={1}>
          {transliteration}
        </Text>
      ) : null}
      <View style={styles.actions}>
        {showBadge ? (
          <View style={styles.badge}>
            <Text style={styles.badgeText}>{formalVsInformal}</Text>
          </View>
        ) : null}
        <View style={styles.iconRow}>
          <Volume2
            size={16}
            color={speaking ? COLORS.gold : COLORS.creamMuted}
            strokeWidth={1.5}
          />
          <Copy
            size={14}
            color={copied ? COLORS.sage : COLORS.creamMuted}
            strokeWidth={1.5}
          />
        </View>
      </View>
    </Pressable>
  );
}

const styles = StyleSheet.create({
  card: {
    backgroundColor: COLORS.surface1,
    borderRadius: RADIUS.md,
    borderWidth: 1,
    borderColor: COLORS.border,
    padding: SPACING.sm + 2,
    gap: 3,
    minHeight: 88,
    justifyContent: 'center',
  },
  english: {
    fontFamily: FONTS.body,
    fontSize: 12,
    color: COLORS.muted,
    lineHeight: 16,
  },
  local: {
    fontFamily: FONTS.header,
    fontSize: 18,
    color: COLORS.cream,
    lineHeight: 24,
  },
  transliteration: {
    fontFamily: FONTS.mono,
    fontSize: 11,
    color: COLORS.sage,
    lineHeight: 14,
  },
  actions: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    marginTop: 2,
  },
  badge: {
    backgroundColor: COLORS.sageVeryFaint,
    borderRadius: RADIUS.sm,
    paddingHorizontal: 6,
    paddingVertical: 2,
  },
  badgeText: {
    fontFamily: FONTS.mono,
    fontSize: 9,
    color: COLORS.sage,
    textTransform: 'uppercase',
    letterSpacing: 0.5,
  },
  iconRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: SPACING.sm,
  },
});
