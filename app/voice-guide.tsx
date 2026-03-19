// =============================================================================
// ROAM — AI Audio City Guide
// Ask questions about a destination via text or voice, hear Sonar answers
// read aloud by ElevenLabs. Conversation history + audio waveform.
// =============================================================================
import React, { useCallback, useEffect, useMemo, useRef, useState } from 'react';
import {
  ActivityIndicator,
  FlatList,
  KeyboardAvoidingView,
  Platform,
  Pressable,
  StyleSheet,
  Text,
  TextInput,
  View,
  type TextStyle,
  type ViewStyle,
} from 'react-native';
import { useLocalSearchParams, useRouter } from 'expo-router';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import Animated, {
  useAnimatedStyle,
  useSharedValue,
  withRepeat,
  withTiming,
  cancelAnimation,
  withSequence,
} from 'react-native-reanimated';
import {
  ArrowLeft,
  Mic,
  Send,
  Volume2,
  VolumeX,
  Headphones,
} from 'lucide-react-native';
import { useTranslation } from 'react-i18next';
import * as Haptics from '../lib/haptics';
import { COLORS, FONTS, SPACING, RADIUS } from '../lib/constants';
import { fetchSonarResult } from '../lib/sonar';
import { narrateText, stopNarration, isNarrating } from '../lib/elevenlabs';
import { trackEvent } from '../lib/analytics';
import type { SonarCitation } from '../lib/types/sonar';

// ---------------------------------------------------------------------------
// Types
// ---------------------------------------------------------------------------
interface ChatEntry {
  readonly id: string;
  readonly role: 'user' | 'assistant';
  readonly text: string;
  readonly citations?: SonarCitation[];
  readonly timestamp: number;
}

const SUGGESTED_QUESTIONS = [
  'Where should I eat tonight?',
  'Is it safe to walk at night?',
  "What's the best neighborhood?",
  'Best time to visit popular spots?',
  'How do I get around cheaply?',
  'Any local festivals this week?',
];

// ---------------------------------------------------------------------------
// Component
// ---------------------------------------------------------------------------
export default function VoiceGuideScreen(): React.JSX.Element {
  const { destination: rawDest } = useLocalSearchParams<{ destination: string }>();
  const destination = rawDest ?? 'Tokyo';
  const router = useRouter();
  const insets = useSafeAreaInsets();
  const { t } = useTranslation();
  const flatListRef = useRef<FlatList<ChatEntry>>(null);

  const [messages, setMessages] = useState<readonly ChatEntry[]>([]);
  const [inputText, setInputText] = useState('');
  const [loading, setLoading] = useState(false);
  const [speaking, setSpeaking] = useState(false);

  useEffect(() => {
    trackEvent('voice_guide_view', { destination });
  }, [destination]);

  const sendQuestion = useCallback(
    async (question: string) => {
      if (!question.trim() || loading) return;
      Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);

      const userEntry: ChatEntry = {
        id: `u_${Date.now()}`,
        role: 'user',
        text: question.trim(),
        timestamp: Date.now(),
      };
      setMessages((prev) => [...prev, userEntry]);
      setInputText('');
      setLoading(true);

      try {
        const result = await fetchSonarResult(destination, 'local', {
          dates: question,
        });
        const assistantEntry: ChatEntry = {
          id: `a_${Date.now()}`,
          role: 'assistant',
          text: result.answer,
          citations: result.citations,
          timestamp: Date.now(),
        };
        setMessages((prev) => [...prev, assistantEntry]);

        // Auto-narrate the answer
        setSpeaking(true);
        await narrateText(result.answer, {
          onEnd: () => setSpeaking(false),
          onError: () => setSpeaking(false),
        });
      } catch {
        const errorEntry: ChatEntry = {
          id: `e_${Date.now()}`,
          role: 'assistant',
          text: t('voiceGuide.error', { defaultValue: 'Sorry, I could not get an answer right now. Please try again.' }),
          timestamp: Date.now(),
        };
        setMessages((prev) => [...prev, errorEntry]);
      } finally {
        setLoading(false);
      }
    },
    [destination, loading, t],
  );

  const handleSend = useCallback(() => {
    sendQuestion(inputText);
  }, [inputText, sendQuestion]);

  const handleSuggestedQuestion = useCallback(
    (q: string) => {
      sendQuestion(q);
    },
    [sendQuestion],
  );

  const handleStopAudio = useCallback(async () => {
    Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
    await stopNarration();
    setSpeaking(false);
  }, []);

  const handleReplay = useCallback(
    async (text: string) => {
      Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
      setSpeaking(true);
      await narrateText(text, {
        onEnd: () => setSpeaking(false),
        onError: () => setSpeaking(false),
      });
    },
    [],
  );

  const handleBack = useCallback(() => {
    stopNarration();
    Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
    router.back();
  }, [router]);

  const renderItem = useCallback(
    ({ item }: { item: ChatEntry }) => (
      <MessageBubble
        entry={item}
        speaking={speaking}
        onReplay={handleReplay}
      />
    ),
    [speaking, handleReplay],
  );

  const keyExtractor = useCallback((item: ChatEntry) => item.id, []);

  const showSuggestions = messages.length === 0 && !loading;

  return (
    <KeyboardAvoidingView
      style={[styles.container, { paddingTop: insets.top }]}
      behavior={Platform.OS === 'ios' ? 'padding' : undefined}
      keyboardVerticalOffset={0}
    >
      {/* Header */}
      <View style={styles.header}>
        <Pressable onPress={handleBack} hitSlop={12} accessibilityRole="button">
          <ArrowLeft size={22} color={COLORS.cream} strokeWidth={1.5} />
        </Pressable>
        <View style={styles.headerCenter}>
          <Headphones size={16} color={COLORS.sage} strokeWidth={1.5} />
          <Text style={styles.headerTitle}>
            {t('voiceGuide.title', { defaultValue: 'Audio Guide' })}
          </Text>
        </View>
        <View style={{ width: 22 }} />
      </View>

      <Text style={styles.destLabel}>{destination}</Text>

      {/* Audio waveform indicator */}
      {speaking && <WaveformIndicator />}

      {/* Suggested questions */}
      {showSuggestions && (
        <View style={styles.suggestionsWrap}>
          <Text style={styles.suggestionsLabel}>
            {t('voiceGuide.askAnything', { defaultValue: 'Ask anything about' })} {destination}
          </Text>
          <View style={styles.suggestionsGrid}>
            {SUGGESTED_QUESTIONS.map((q) => (
              <Pressable
                key={q}
                onPress={() => handleSuggestedQuestion(q)}
                style={styles.suggestionChip}
                accessibilityRole="button"
              >
                <Text style={styles.suggestionText}>{q}</Text>
              </Pressable>
            ))}
          </View>
        </View>
      )}

      {/* Message history */}
      <FlatList
        ref={flatListRef}
        data={messages as ChatEntry[]}
        renderItem={renderItem}
        keyExtractor={keyExtractor}
        contentContainerStyle={styles.messagesList}
        showsVerticalScrollIndicator={false}
        onContentSizeChange={() =>
          flatListRef.current?.scrollToEnd({ animated: true })
        }
      />

      {/* Loading indicator */}
      {loading && (
        <View style={styles.loadingRow}>
          <ActivityIndicator size="small" color={COLORS.sage} />
          <Text style={styles.loadingText}>
            {t('voiceGuide.thinking', { defaultValue: 'Thinking...' })}
          </Text>
        </View>
      )}

      {/* Input bar */}
      <View style={[styles.inputBar, { paddingBottom: insets.bottom + SPACING.sm }]}>
        {speaking && (
          <Pressable onPress={handleStopAudio} hitSlop={8} accessibilityRole="button">
            <VolumeX size={20} color={COLORS.coral} strokeWidth={1.5} />
          </Pressable>
        )}
        <TextInput
          style={styles.textInput}
          placeholder={t('voiceGuide.placeholder', { defaultValue: 'Ask a question...' })}
          placeholderTextColor={COLORS.muted}
          value={inputText}
          onChangeText={setInputText}
          onSubmitEditing={handleSend}
          returnKeyType="send"
          multiline={false}
          editable={!loading}
        />
        <Pressable
          onPress={handleSend}
          hitSlop={8}
          disabled={!inputText.trim() || loading}
          accessibilityRole="button"
          style={({ pressed }) => [
            styles.sendBtn,
            (!inputText.trim() || loading) && styles.sendBtnDisabled,
            pressed && styles.sendBtnPressed,
          ]}
        >
          <Send size={18} color={inputText.trim() ? COLORS.cream : COLORS.muted} strokeWidth={1.5} />
        </Pressable>
      </View>
    </KeyboardAvoidingView>
  );
}

// ---------------------------------------------------------------------------
// MessageBubble
// ---------------------------------------------------------------------------
function MessageBubble({
  entry,
  speaking,
  onReplay,
}: {
  entry: ChatEntry;
  speaking: boolean;
  onReplay: (text: string) => void;
}) {
  const isUser = entry.role === 'user';
  return (
    <View style={[styles.bubble, isUser ? styles.bubbleUser : styles.bubbleAssistant]}>
      <Text style={[styles.bubbleText, isUser && styles.bubbleTextUser]}>
        {entry.text}
      </Text>
      {!isUser && (
        <View style={styles.bubbleFooter}>
          <Pressable
            onPress={() => onReplay(entry.text)}
            hitSlop={8}
            accessibilityRole="button"
            accessibilityLabel="Replay audio"
          >
            <Volume2 size={14} color={COLORS.sage} strokeWidth={1.5} />
          </Pressable>
          <Text style={styles.bubbleTime}>
            {new Date(entry.timestamp).toLocaleTimeString([], {
              hour: '2-digit',
              minute: '2-digit',
            })}
          </Text>
        </View>
      )}
    </View>
  );
}

// ---------------------------------------------------------------------------
// WaveformIndicator — animated bars
// ---------------------------------------------------------------------------
const BAR_COUNT = 5;

function WaveformIndicator() {
  return (
    <View style={styles.waveformWrap}>
      {Array.from({ length: BAR_COUNT }).map((_, i) => (
        <WaveBar key={i} delay={i * 100} />
      ))}
    </View>
  );
}

function WaveBar({ delay }: { delay: number }) {
  const height = useSharedValue(8);

  useEffect(() => {
    const timer = setTimeout(() => {
      height.value = withRepeat(
        withSequence(
          withTiming(24, { duration: 300 }),
          withTiming(8, { duration: 300 }),
        ),
        -1,
        true,
      );
    }, delay);
    return () => {
      clearTimeout(timer);
      cancelAnimation(height);
    };
  }, [delay, height]);

  const animatedStyle = useAnimatedStyle(() => ({
    height: height.value,
  }));

  return <Animated.View style={[styles.waveBar, animatedStyle]} />;
}

// ---------------------------------------------------------------------------
// Styles
// ---------------------------------------------------------------------------
const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: COLORS.bg } as ViewStyle,
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: SPACING.md,
    paddingVertical: SPACING.sm,
  } as ViewStyle,
  headerCenter: {
    flex: 1,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: SPACING.xs,
  } as ViewStyle,
  headerTitle: {
    fontFamily: FONTS.header,
    fontSize: 18,
    color: COLORS.cream,
  } as TextStyle,
  destLabel: {
    fontFamily: FONTS.mono,
    fontSize: 11,
    color: COLORS.sage,
    textAlign: 'center',
    marginBottom: SPACING.sm,
  } as TextStyle,
  waveformWrap: {
    flexDirection: 'row',
    alignItems: 'flex-end',
    justifyContent: 'center',
    gap: 4,
    height: 32,
    marginBottom: SPACING.sm,
  } as ViewStyle,
  waveBar: {
    width: 4,
    borderRadius: 2,
    backgroundColor: COLORS.sage,
  } as ViewStyle,
  suggestionsWrap: {
    paddingHorizontal: SPACING.md,
    paddingTop: SPACING.lg,
  } as ViewStyle,
  suggestionsLabel: {
    fontFamily: FONTS.bodyMedium,
    fontSize: 14,
    color: COLORS.creamDim,
    marginBottom: SPACING.md,
  } as TextStyle,
  suggestionsGrid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: SPACING.sm,
  } as ViewStyle,
  suggestionChip: {
    borderRadius: RADIUS.pill,
    borderWidth: 1,
    borderColor: COLORS.border,
    backgroundColor: COLORS.surface1,
    paddingHorizontal: SPACING.md,
    paddingVertical: SPACING.sm,
  } as ViewStyle,
  suggestionText: {
    fontFamily: FONTS.body,
    fontSize: 13,
    color: COLORS.cream,
  } as TextStyle,
  messagesList: {
    paddingHorizontal: SPACING.md,
    paddingVertical: SPACING.sm,
    gap: SPACING.sm,
  } as ViewStyle,
  bubble: {
    maxWidth: '85%',
    borderRadius: RADIUS.md,
    padding: SPACING.md,
    marginBottom: SPACING.sm,
  } as ViewStyle,
  bubbleUser: {
    alignSelf: 'flex-end',
    backgroundColor: COLORS.sageSubtle,
    borderWidth: 1,
    borderColor: COLORS.sageBorder,
  } as ViewStyle,
  bubbleAssistant: {
    alignSelf: 'flex-start',
    backgroundColor: COLORS.surface1,
    borderWidth: 1,
    borderColor: COLORS.border,
  } as ViewStyle,
  bubbleText: {
    fontFamily: FONTS.body,
    fontSize: 14,
    color: COLORS.cream,
    lineHeight: 21,
  } as TextStyle,
  bubbleTextUser: {
    color: COLORS.cream,
  } as TextStyle,
  bubbleFooter: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    marginTop: SPACING.sm,
  } as ViewStyle,
  bubbleTime: {
    fontFamily: FONTS.mono,
    fontSize: 10,
    color: COLORS.muted,
  } as TextStyle,
  loadingRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: SPACING.sm,
    paddingHorizontal: SPACING.md,
    paddingVertical: SPACING.sm,
  } as ViewStyle,
  loadingText: {
    fontFamily: FONTS.body,
    fontSize: 13,
    color: COLORS.muted,
  } as TextStyle,
  inputBar: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: SPACING.sm,
    paddingHorizontal: SPACING.md,
    paddingTop: SPACING.sm,
    borderTopWidth: 1,
    borderTopColor: COLORS.border,
    backgroundColor: COLORS.bg,
  } as ViewStyle,
  textInput: {
    flex: 1,
    fontFamily: FONTS.body,
    fontSize: 14,
    color: COLORS.cream,
    backgroundColor: COLORS.surface1,
    borderRadius: RADIUS.pill,
    paddingHorizontal: SPACING.md,
    paddingVertical: SPACING.sm,
    borderWidth: 1,
    borderColor: COLORS.border,
  } as TextStyle,
  sendBtn: {
    width: 36,
    height: 36,
    borderRadius: RADIUS.pill,
    backgroundColor: COLORS.sage,
    alignItems: 'center',
    justifyContent: 'center',
  } as ViewStyle,
  sendBtnDisabled: {
    backgroundColor: COLORS.surface2,
  } as ViewStyle,
  sendBtnPressed: {
    opacity: 0.8,
  } as ViewStyle,
});
