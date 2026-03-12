// =============================================================================
// ROAM — AI Travel Chat Screen
// Chat interface with glass-card message bubbles. Voice search via expo-speech-recognition.
// =============================================================================
import React, { useState, useRef, useCallback, useEffect } from 'react';
import {
  View,
  Text,
  TextInput,
  FlatList,
  Pressable,
  KeyboardAvoidingView,
  Platform,
  StyleSheet,
  type ViewStyle,
  type TextStyle,
} from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import * as Haptics from 'expo-haptics';
import { COLORS, FONTS, SPACING, RADIUS, CHAT_STARTERS } from '../../lib/constants';
import BreathingLine from '../../components/ui/BreathingLine';
import { EmptyMapPin } from '../../components/ui/EmptyStateIllustrations';
import { useAppStore, type ChatMessage } from '../../lib/store';
import { callClaude, CHAT_SYSTEM_PROMPT } from '../../lib/claude';
import VoiceInputButton from '../../components/features/VoiceInputButton';

// ---------------------------------------------------------------------------
// Message bubble component
// ---------------------------------------------------------------------------
function MessageBubble({ message }: { message: ChatMessage }) {
  const isUser = message.role === 'user';

  return (
    <View
      style={[
        styles.bubble,
        isUser ? styles.bubbleUser : styles.bubbleAssistant,
      ]}
    >
      {!isUser && (
        <Text style={styles.bubbleSender}>ROAM</Text>
      )}
      <Text style={[styles.bubbleText, isUser && styles.bubbleTextUser]}>
        {message.content}
      </Text>
    </View>
  );
}

// ---------------------------------------------------------------------------
// Typing indicator
// ---------------------------------------------------------------------------
function TypingIndicator() {
  return (
    <View style={[styles.bubble, styles.bubbleAssistant]}>
      <Text style={styles.bubbleSender}>ROAM</Text>
      <View style={styles.typingRow}>
        <BreathingLine width={36} height={3} color={COLORS.sage} />
        <Text style={styles.typingDots}>on it...</Text>
      </View>
    </View>
  );
}

// ---------------------------------------------------------------------------
// Empty state
// ---------------------------------------------------------------------------
function EmptyChat({ onStarterPress }: { onStarterPress: (text: string) => void }) {
  return (
    <View style={styles.emptyContainer}>
      <EmptyMapPin size={120} />
      <Text style={styles.emptyTitle}>Ask ROAM anything</Text>
      <Text style={styles.emptySubtitle}>
        Visa rules, what to pack, the best ramen in Tokyo at 2am — ask like you'd ask a friend who's been there.
      </Text>
      <View style={styles.startersContainer}>
        {CHAT_STARTERS.slice(0, 4).map((starter) => (
          <Pressable
            key={starter}
            style={({ pressed }) => [
              styles.starterChip,
              { opacity: pressed ? 0.7 : 1, transform: [{ scale: pressed ? 0.97 : 1 }] },
            ]}
            onPress={() => onStarterPress(starter)}
          >
            <Text style={styles.starterText}>{starter}</Text>
          </Pressable>
        ))}
      </View>
    </View>
  );
}

// ---------------------------------------------------------------------------
// Main Screen
// ---------------------------------------------------------------------------
export default function ChatScreen() {
  const insets = useSafeAreaInsets();
  const flatListRef = useRef<FlatList>(null);

  const chatMessages = useAppStore((s) => s.chatMessages);
  const appendChatMessage = useAppStore((s) => s.appendChatMessage);

  const [inputText, setInputText] = useState('');
  const [isSending, setIsSending] = useState(false);

  // ---------------------------------------------------------------------------
  // Send message
  // ---------------------------------------------------------------------------
  const handleSend = useCallback(async (overrideText?: string) => {
    const text = (overrideText ?? inputText).trim();
    if (!text || isSending) return;

    Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
    setInputText('');
    setIsSending(true);

    // Add user message
    const userMsg: ChatMessage = {
      id: `user-${Date.now()}`,
      role: 'user',
      content: text,
    };
    appendChatMessage(userMsg);

    try {
      const response = await callClaude(CHAT_SYSTEM_PROMPT, text, false);

      const assistantMsg: ChatMessage = {
        id: `assistant-${Date.now()}`,
        role: 'assistant',
        content: response.content,
      };
      appendChatMessage(assistantMsg);
    } catch (err: unknown) {
      const errorMsg: ChatMessage = {
        id: `error-${Date.now()}`,
        role: 'assistant',
        content: "I'm having trouble connecting right now. Check your internet connection and try again.",
      };
      appendChatMessage(errorMsg);
    } finally {
      setIsSending(false);
    }
  }, [inputText, isSending, appendChatMessage]);

  const handleStarterPress = useCallback((text: string) => {
    handleSend(text);
  }, [handleSend]);

  const handleVoiceTranscript = useCallback((text: string) => {
    if (text.trim()) handleSend(text);
  }, [handleSend]);

  // ---------------------------------------------------------------------------
  // Render
  // ---------------------------------------------------------------------------
  return (
    <KeyboardAvoidingView
      style={[styles.container, { paddingTop: insets.top }]}
      behavior={Platform.OS === 'ios' ? 'padding' : 'height'}
      keyboardVerticalOffset={Platform.OS === 'ios' ? 0 : 20}
    >
      {/* Header */}
      <View style={styles.header}>
        <Text style={styles.headerTitle}>What do you need to know?</Text>
      </View>

      {/* Messages */}
      <FlatList
        ref={flatListRef}
        data={chatMessages}
        keyExtractor={(item) => item.id}
        renderItem={({ item }) => <MessageBubble message={item} />}
        contentContainerStyle={[
          styles.messageList,
          chatMessages.length === 0 && styles.messageListEmpty,
        ]}
        showsVerticalScrollIndicator={false}
        inverted={chatMessages.length > 0}
        ListHeaderComponent={isSending ? <TypingIndicator /> : null}
        ListEmptyComponent={<EmptyChat onStarterPress={handleStarterPress} />}
        onContentSizeChange={() => {
          if (chatMessages.length > 0) {
            flatListRef.current?.scrollToOffset({ offset: 0, animated: true });
          }
        }}
      />

      {/* Input bar */}
      <View style={[styles.inputBar, { paddingBottom: Math.max(insets.bottom, SPACING.sm) }]}>
        <VoiceInputButton
          onTranscript={handleVoiceTranscript}
          disabled={isSending}
        />
        <TextInput
          style={styles.textInput}
          value={inputText}
          onChangeText={setInputText}
          placeholder="Best coffee in Lisbon? Visa for Vietnam? Ask anything."
          placeholderTextColor={`${COLORS.cream}33`}
          multiline
          maxLength={1000}
          editable={!isSending}
          onSubmitEditing={() => handleSend()}
          blurOnSubmit={false}
        />
        <Pressable
          style={({ pressed }) => [
            styles.sendButton,
            {
              opacity: !inputText.trim() || isSending ? 0.3 : pressed ? 0.7 : 1,
            },
          ]}
          onPress={() => handleSend()}
          disabled={!inputText.trim() || isSending}
          accessibilityRole="button"
          accessibilityLabel="Send message"
        >
          <Text style={styles.sendIcon}>{'\u2191'}</Text>
        </Pressable>
      </View>
    </KeyboardAvoidingView>
  );
}

// ---------------------------------------------------------------------------
// Styles
// ---------------------------------------------------------------------------
const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: COLORS.bg,
  } as ViewStyle,
  header: {
    paddingHorizontal: SPACING.lg,
    paddingTop: SPACING.md,
    paddingBottom: SPACING.md,
    borderBottomWidth: 0.5,
    borderBottomColor: COLORS.border,
  } as ViewStyle,
  headerTitle: {
    fontFamily: FONTS.header,
    fontSize: 28,
    color: COLORS.cream,
  } as TextStyle,
  // Message list
  messageList: {
    paddingHorizontal: SPACING.lg,
    paddingVertical: SPACING.md,
    gap: SPACING.md,
  } as ViewStyle,
  messageListEmpty: {
    flex: 1,
    justifyContent: 'center',
  } as ViewStyle,
  // Bubbles
  bubble: {
    maxWidth: '85%',
    borderRadius: RADIUS.lg,
    padding: SPACING.md,
    gap: SPACING.xs,
  } as ViewStyle,
  bubbleUser: {
    alignSelf: 'flex-end',
    backgroundColor: COLORS.sage,
    borderBottomRightRadius: RADIUS.sm,
  } as ViewStyle,
  bubbleAssistant: {
    alignSelf: 'flex-start',
    backgroundColor: COLORS.bgGlass,
    borderWidth: 1,
    borderColor: COLORS.border,
    borderBottomLeftRadius: RADIUS.sm,
  } as ViewStyle,
  bubbleSender: {
    fontFamily: FONTS.mono,
    fontSize: 10,
    color: COLORS.sage,
    letterSpacing: 1,
    marginBottom: 2,
  } as TextStyle,
  bubbleText: {
    fontFamily: FONTS.body,
    fontSize: 15,
    color: COLORS.cream,
    lineHeight: 22,
  } as TextStyle,
  bubbleTextUser: {
    color: COLORS.bg,
  } as TextStyle,
  // Typing indicator
  typingRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: SPACING.sm,
  } as ViewStyle,
  typingDots: {
    fontFamily: FONTS.body,
    fontSize: 14,
    color: COLORS.sage,
    opacity: 0.7,
  } as TextStyle,
  // Empty state
  emptyContainer: {
    alignItems: 'center',
    paddingHorizontal: SPACING.xl,
    gap: SPACING.md,
  } as ViewStyle,
  emptyIcon: {
    fontSize: 48,
    color: COLORS.sage,
    opacity: 0.4,
  } as TextStyle,
  emptyTitle: {
    fontFamily: FONTS.header,
    fontSize: 24,
    color: COLORS.cream,
  } as TextStyle,
  emptySubtitle: {
    fontFamily: FONTS.body,
    fontSize: 15,
    color: COLORS.cream,
    opacity: 0.5,
    textAlign: 'center',
    lineHeight: 22,
  } as TextStyle,
  startersContainer: {
    width: '100%',
    gap: SPACING.sm,
    marginTop: SPACING.md,
  } as ViewStyle,
  starterChip: {
    backgroundColor: COLORS.bgGlass,
    borderRadius: RADIUS.lg,
    borderWidth: 1,
    borderColor: COLORS.border,
    paddingHorizontal: SPACING.md,
    paddingVertical: SPACING.sm + 4,
  } as ViewStyle,
  starterText: {
    fontFamily: FONTS.body,
    fontSize: 14,
    color: COLORS.cream,
    opacity: 0.7,
  } as TextStyle,
  // Input bar
  inputBar: {
    flexDirection: 'row',
    alignItems: 'flex-end',
    paddingHorizontal: SPACING.lg,
    paddingTop: SPACING.sm,
    borderTopWidth: 0.5,
    borderTopColor: COLORS.border,
    backgroundColor: COLORS.bg,
    gap: SPACING.sm,
  } as ViewStyle,
  textInput: {
    flex: 1,
    minHeight: 44,
    maxHeight: 120,
    borderRadius: RADIUS.lg,
    borderWidth: 1.5,
    borderColor: COLORS.border,
    backgroundColor: COLORS.bgCard,
    paddingHorizontal: SPACING.md,
    paddingTop: SPACING.sm + 2,
    paddingBottom: SPACING.sm + 2,
    fontFamily: FONTS.body,
    fontSize: 15,
    color: COLORS.cream,
    lineHeight: 20,
  } as TextStyle,
  sendButton: {
    width: 44,
    height: 44,
    borderRadius: 22,
    backgroundColor: COLORS.sage,
    alignItems: 'center',
    justifyContent: 'center',
  } as ViewStyle,
  sendIcon: {
    fontSize: 20,
    fontWeight: '700',
    color: COLORS.bg,
  } as TextStyle,
});
