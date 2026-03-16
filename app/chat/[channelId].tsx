// =============================================================================
// ROAM — Real-time Chat Screen
// Dynamic route: /chat/[channelId]
// Dark-only UI. Realtime messages via useChat hook.
// =============================================================================
import React, { useCallback, useRef, useState } from 'react';
import {
  FlatList,
  KeyboardAvoidingView,
  Platform,
  Pressable,
  StyleSheet,
  Text,
  TextInput,
  View,
  type ListRenderItem,
} from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { useLocalSearchParams, useRouter } from 'expo-router';
import { ArrowLeft, MapPin, Send } from 'lucide-react-native';

import { COLORS, FONTS, RADIUS, SPACING } from '../../lib/constants';
import { impactAsync, ImpactFeedbackStyle } from '../../lib/haptics';
import { useChat } from '../../lib/hooks/useChat';
import { useAppStore } from '../../lib/store';
import type { ChatMessage } from '../../lib/types/social';

// ---------------------------------------------------------------------------
// Helpers
// ---------------------------------------------------------------------------

function formatTime(iso: string): string {
  try {
    const d = new Date(iso);
    return d.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' });
  } catch {
    return '';
  }
}

function formatDateLabel(iso: string): string {
  try {
    const d = new Date(iso);
    const today = new Date();
    const yesterday = new Date(today);
    yesterday.setDate(today.getDate() - 1);

    const isSameDay = (a: Date, b: Date) =>
      a.getFullYear() === b.getFullYear() &&
      a.getMonth() === b.getMonth() &&
      a.getDate() === b.getDate();

    if (isSameDay(d, today)) return 'Today';
    if (isSameDay(d, yesterday)) return 'Yesterday';

    return d.toLocaleDateString([], { month: 'short', day: 'numeric', year: 'numeric' });
  } catch {
    return '';
  }
}

function isSameDay(a: string, b: string): boolean {
  try {
    const da = new Date(a);
    const db = new Date(b);
    return (
      da.getFullYear() === db.getFullYear() &&
      da.getMonth() === db.getMonth() &&
      da.getDate() === db.getDate()
    );
  } catch {
    return true;
  }
}

// ---------------------------------------------------------------------------
// Types
// ---------------------------------------------------------------------------

type ListItem =
  | { kind: 'date-separator'; date: string; key: string }
  | { kind: 'message'; message: ChatMessage; showSender: boolean; key: string };

// ---------------------------------------------------------------------------
// DateSeparator
// ---------------------------------------------------------------------------

const DateSeparator = React.memo(({ date }: { date: string }) => (
  <View style={styles.dateSeparatorRow}>
    <View style={styles.dateSeparatorLine} />
    <Text style={styles.dateSeparatorText}>{formatDateLabel(date)}</Text>
    <View style={styles.dateSeparatorLine} />
  </View>
));

DateSeparator.displayName = 'DateSeparator';

// ---------------------------------------------------------------------------
// MessageBubble
// ---------------------------------------------------------------------------

interface MessageBubbleProps {
  message: ChatMessage;
  isOwn: boolean;
  showSender: boolean;
}

const MessageBubble = React.memo(({ message, isOwn, showSender }: MessageBubbleProps) => {
  if (message.type === 'system') {
    return (
      <View style={styles.systemMessageRow}>
        <Text style={styles.systemMessageText}>{message.text}</Text>
      </View>
    );
  }

  return (
    <View style={[styles.bubbleWrapper, isOwn ? styles.bubbleWrapperOwn : styles.bubbleWrapperTheirs]}>
      {!isOwn && showSender && (
        <Text style={styles.senderName}>{message.senderName}</Text>
      )}
      <View style={[styles.bubble, isOwn ? styles.bubbleOwn : styles.bubbleTheirs]}>
        <Text style={[styles.bubbleText, isOwn ? styles.bubbleTextOwn : styles.bubbleTextTheirs]}>
          {message.text}
        </Text>
      </View>
      <Text style={[styles.timestamp, isOwn ? styles.timestampOwn : styles.timestampTheirs]}>
        {formatTime(message.createdAt)}
      </Text>
    </View>
  );
});

MessageBubble.displayName = 'MessageBubble';

// ---------------------------------------------------------------------------
// Main Screen
// ---------------------------------------------------------------------------

export default function ChatScreen() {
  const router = useRouter();
  const insets = useSafeAreaInsets();
  const params = useLocalSearchParams<{ channelId: string; channelName?: string }>();
  const channelId = params.channelId ?? '';
  const channelName = params.channelName ?? 'Chat';

  const { messages, send } = useChat(channelId);
  const session = useAppStore((s) => s.session);
  const currentUserId = session?.user?.id ?? '';

  const [inputText, setInputText] = useState('');
  const flatListRef = useRef<FlatList<ListItem>>(null);

  // Build flat list data: inject date separators and mark sender visibility
  const listData: ListItem[] = React.useMemo(() => {
    const items: ListItem[] = [];
    for (let i = 0; i < messages.length; i++) {
      const msg = messages[i];
      const prev = messages[i - 1];

      // Date separator when day changes
      if (!prev || !isSameDay(prev.createdAt, msg.createdAt)) {
        items.push({
          kind: 'date-separator',
          date: msg.createdAt,
          key: `sep-${msg.createdAt}-${i}`,
        });
      }

      // Hide sender name when consecutive messages from same sender on same day
      const showSender =
        !prev ||
        prev.senderId !== msg.senderId ||
        !isSameDay(prev.createdAt, msg.createdAt);

      items.push({
        kind: 'message',
        message: msg,
        showSender,
        key: msg.id,
      });
    }
    return items;
  }, [messages]);

  const handleSend = useCallback(async () => {
    const text = inputText.trim();
    if (!text) return;
    setInputText('');
    await impactAsync(ImpactFeedbackStyle.Light);
    await send(text);
  }, [inputText, send]);

  const renderItem: ListRenderItem<ListItem> = useCallback(
    ({ item }) => {
      if (item.kind === 'date-separator') {
        return <DateSeparator date={item.date} />;
      }
      const { message, showSender } = item;
      const isOwn = message.senderId === currentUserId;
      return <MessageBubble message={message} isOwn={isOwn} showSender={showSender} />;
    },
    [currentUserId],
  );

  const keyExtractor = useCallback((item: ListItem) => item.key, []);

  return (
    <View style={[styles.root, { paddingTop: insets.top }]}>
      {/* Header */}
      <View style={styles.header}>
        <Pressable
          style={styles.backButton}
          onPress={() => router.back()}
          hitSlop={12}
        >
          <ArrowLeft size={22} color={COLORS.cream} strokeWidth={2} />
        </Pressable>

        <View style={styles.headerCenter}>
          <MapPin size={14} color={COLORS.sage} strokeWidth={2} style={styles.headerIcon} />
          <Text style={styles.headerTitle} numberOfLines={1}>
            {channelName}
          </Text>
        </View>

        {/* Spacer to balance back button */}
        <View style={styles.headerSpacer} />
      </View>

      {/* Message list */}
      <KeyboardAvoidingView
        style={styles.flex}
        behavior={Platform.OS === 'ios' ? 'padding' : 'height'}
        keyboardVerticalOffset={0}
      >
        <FlatList
          ref={flatListRef}
          data={listData}
          renderItem={renderItem}
          keyExtractor={keyExtractor}
          contentContainerStyle={[
            styles.listContent,
            { paddingBottom: SPACING.sm },
          ]}
          showsVerticalScrollIndicator={false}
          onContentSizeChange={() => {
            if (listData.length > 0) {
              flatListRef.current?.scrollToEnd({ animated: false });
            }
          }}
        />

        {/* Input area */}
        <View style={[styles.inputArea, { paddingBottom: insets.bottom + SPACING.sm }]}>
          <TextInput
            style={styles.textInput}
            value={inputText}
            onChangeText={setInputText}
            placeholder="Message..."
            placeholderTextColor={COLORS.creamFaint}
            multiline
            maxLength={1000}
            returnKeyType="default"
          />
          <Pressable
            style={[styles.sendButton, !inputText.trim() && styles.sendButtonDisabled]}
            onPress={handleSend}
            disabled={!inputText.trim()}
          >
            <Send size={18} color={inputText.trim() ? COLORS.bg : COLORS.creamFaint} strokeWidth={2} />
          </Pressable>
        </View>
      </KeyboardAvoidingView>
    </View>
  );
}

// ---------------------------------------------------------------------------
// Styles
// ---------------------------------------------------------------------------

const styles = StyleSheet.create({
  root: {
    flex: 1,
    backgroundColor: COLORS.bg,
  } as const,
  flex: {
    flex: 1,
  } as const,

  // Header
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: SPACING.md,
    paddingVertical: SPACING.sm,
    borderBottomWidth: StyleSheet.hairlineWidth,
    borderBottomColor: COLORS.border,
    backgroundColor: COLORS.bg,
  } as const,
  backButton: {
    width: 36,
    height: 36,
    alignItems: 'center',
    justifyContent: 'center',
  } as const,
  headerCenter: {
    flex: 1,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: SPACING.xs,
  } as const,
  headerIcon: {
    marginRight: 2,
  } as const,
  headerTitle: {
    fontFamily: FONTS.bodySemiBold,
    fontSize: 16,
    color: COLORS.cream,
    letterSpacing: 0.1,
  } as const,
  headerSpacer: {
    width: 36,
  } as const,

  // List
  listContent: {
    paddingHorizontal: SPACING.md,
    paddingTop: SPACING.sm,
    flexGrow: 1,
    justifyContent: 'flex-end',
  } as const,

  // Date separator
  dateSeparatorRow: {
    flexDirection: 'row',
    alignItems: 'center',
    marginVertical: SPACING.md,
    gap: SPACING.sm,
  } as const,
  dateSeparatorLine: {
    flex: 1,
    height: StyleSheet.hairlineWidth,
    backgroundColor: COLORS.border,
  } as const,
  dateSeparatorText: {
    fontFamily: FONTS.mono,
    fontSize: 10,
    color: COLORS.creamFaint,
    letterSpacing: 0.5,
    textTransform: 'uppercase',
  } as const,

  // System message
  systemMessageRow: {
    alignItems: 'center',
    marginVertical: SPACING.xs,
    paddingHorizontal: SPACING.lg,
  } as const,
  systemMessageText: {
    fontFamily: FONTS.mono,
    fontSize: 11,
    color: COLORS.creamMuted,
    fontStyle: 'italic',
    textAlign: 'center',
  } as const,

  // Message bubbles
  bubbleWrapper: {
    marginBottom: SPACING.xs,
    maxWidth: '78%',
  } as const,
  bubbleWrapperOwn: {
    alignSelf: 'flex-end',
    alignItems: 'flex-end',
  } as const,
  bubbleWrapperTheirs: {
    alignSelf: 'flex-start',
    alignItems: 'flex-start',
  } as const,
  senderName: {
    fontFamily: FONTS.mono,
    fontSize: 11,
    color: COLORS.creamMuted,
    marginBottom: 3,
    marginLeft: SPACING.xs,
  } as const,
  bubble: {
    borderRadius: RADIUS.md,
    paddingHorizontal: SPACING.md,
    paddingVertical: SPACING.sm,
  } as const,
  bubbleOwn: {
    backgroundColor: COLORS.sage,
    borderBottomRightRadius: RADIUS.sm,
  } as const,
  bubbleTheirs: {
    backgroundColor: COLORS.bgCard,
    borderBottomLeftRadius: RADIUS.sm,
    borderWidth: StyleSheet.hairlineWidth,
    borderColor: COLORS.border,
  } as const,
  bubbleText: {
    fontFamily: FONTS.body,
    fontSize: 15,
    lineHeight: 21,
  } as const,
  bubbleTextOwn: {
    color: COLORS.bg,
  } as const,
  bubbleTextTheirs: {
    color: COLORS.cream,
  } as const,
  timestamp: {
    fontFamily: FONTS.mono,
    fontSize: 10,
    color: COLORS.creamFaint,
    marginTop: 3,
  } as const,
  timestampOwn: {
    alignSelf: 'flex-end',
    marginRight: 2,
  } as const,
  timestampTheirs: {
    alignSelf: 'flex-start',
    marginLeft: 2,
  } as const,

  // Input area
  inputArea: {
    flexDirection: 'row',
    alignItems: 'flex-end',
    paddingHorizontal: SPACING.md,
    paddingTop: SPACING.sm,
    borderTopWidth: StyleSheet.hairlineWidth,
    borderTopColor: COLORS.border,
    backgroundColor: COLORS.bg,
    gap: SPACING.sm,
  } as const,
  textInput: {
    flex: 1,
    backgroundColor: COLORS.bgCard,
    borderRadius: RADIUS.md,
    borderWidth: StyleSheet.hairlineWidth,
    borderColor: COLORS.border,
    color: COLORS.cream,
    fontFamily: FONTS.body,
    fontSize: 15,
    paddingHorizontal: SPACING.md,
    paddingTop: SPACING.sm,
    paddingBottom: SPACING.sm,
    maxHeight: 120,
    lineHeight: 21,
  } as const,
  sendButton: {
    width: 40,
    height: 40,
    borderRadius: RADIUS.md,
    backgroundColor: COLORS.sage,
    alignItems: 'center',
    justifyContent: 'center',
    flexShrink: 0,
  } as const,
  sendButtonDisabled: {
    backgroundColor: COLORS.bgCard,
    borderWidth: StyleSheet.hairlineWidth,
    borderColor: COLORS.border,
  } as const,
});
