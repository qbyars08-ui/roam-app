// =============================================================================
// ROAM — Pocket Concierge
// Floating AI button available on every screen. Not a chatbot — a concierge.
// Knows your full trip, profile, budget. Answers in 2 sentences max.
// =============================================================================
import React, { useState, useRef, useCallback, useEffect } from 'react';
import { useTranslation } from 'react-i18next';
import {
  View,
  Text,
  TextInput,
  Pressable,
  StyleSheet,
  Modal,
  ScrollView,
  KeyboardAvoidingView,
  Platform,
  Animated,
  type ViewStyle,
  type TextStyle,
} from 'react-native';
import * as Haptics from '../../lib/haptics';
import { COLORS, FONTS, SPACING, RADIUS } from '../../lib/constants';
import { useAppStore, getActiveTrip } from '../../lib/store';
import { callClaude } from '../../lib/claude';
import { Luggage } from 'lucide-react-native';
import { profileToPromptString } from '../../lib/types/travel-profile';
import { parseItinerary } from '../../lib/types/itinerary';

interface Message {
  role: 'user' | 'assistant';
  content: string;
}

const QUICK_ASKS = [
  'What should I do tonight near where I\'m staying?',
  'Find me dinner nearby under $20',
  'What\'s the cheapest way to get around?',
  'Where do locals actually eat around here?',
  'What\'s the tipping custom here?',
  'Indoor backup if it rains today?',
];

const CONCIERGE_SYSTEM_PROMPT = `You are ROAM's Pocket Concierge — a hyper-knowledgeable travel assistant.

Rules:
- Answer in 2 sentences MAX. Be direct, specific, useful.
- Name real places, real prices, real addresses when relevant.
- Never say "I recommend" or "I suggest" — just tell them what to do.
- If you don't know, say so honestly in one sentence.
- Sound like a well-traveled friend, not a corporate travel guide.
- Use the traveler's profile to personalize every answer.

You have access to:
1. Their Travel Style Profile (pace, budget, food adventurousness, etc.)
2. Their active trip details (if they're currently traveling)
3. Their question

Give answers that feel like insider knowledge, not Google results.`;

export default function PocketConcierge() {
  const { t } = useTranslation();
  const [isOpen, setIsOpen] = useState(false);
  const [messages, setMessages] = useState<Message[]>([]);
  const [input, setInput] = useState('');
  const [loading, setLoading] = useState(false);

  const travelProfile = useAppStore((s) => s.travelProfile);
  const hasCompletedProfile = useAppStore((s) => s.hasCompletedProfile);
  const activeTripId = useAppStore((s) => s.activeTripId);

  const scrollRef = useRef<ScrollView>(null);

  // Pulse animation for FAB
  const pulseAnim = useRef(new Animated.Value(1)).current;
  useEffect(() => {
    const loop = Animated.loop(
      Animated.sequence([
        Animated.timing(pulseAnim, { toValue: 1.08, duration: 1500, useNativeDriver: true }),
        Animated.timing(pulseAnim, { toValue: 1, duration: 1500, useNativeDriver: true }),
      ])
    );
    loop.start();
    return () => loop.stop();
  }, [pulseAnim]);

  const buildContext = useCallback(() => {
    const lines: string[] = [];

    if (hasCompletedProfile) {
      lines.push('TRAVELER PROFILE:');
      lines.push(profileToPromptString(travelProfile));
      lines.push('');
    }

    const activeTrip = activeTripId ? getActiveTrip() : null;
    if (activeTrip) {
      lines.push(`ACTIVE TRIP: ${activeTrip.destination}, ${activeTrip.days} days, budget: ${activeTrip.budget}`);
      lines.push('Vibes: ' + (activeTrip.vibes?.join(', ') || 'none'));
      lines.push('');

      // Full itinerary JSON for hyper-local context
      if (activeTrip.itinerary && typeof activeTrip.itinerary === 'string') {
        try {
          const parsed = parseItinerary(activeTrip.itinerary);
          lines.push('FULL ITINERARY (use for neighborhood-specific answers):');
          lines.push(JSON.stringify(parsed, null, 2));
        } catch {
          lines.push('ITINERARY (raw): ' + activeTrip.itinerary.slice(0, 4000));
        }
        lines.push('');
      }
    }

    return lines.join('\n');
  }, [travelProfile, hasCompletedProfile, activeTripId]);

  const handleSend = useCallback(async (text?: string) => {
    const question = (text ?? input).trim();
    if (!question) return;

    Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
    setInput('');

    const userMsg: Message = { role: 'user', content: question };
    setMessages((prev) => [...prev, userMsg]);
    setLoading(true);

    try {
      const context = buildContext();
      const fullPrompt = context
        ? `${context}\nQUESTION: ${question}`
        : question;

      const response = await callClaude(CONCIERGE_SYSTEM_PROMPT, fullPrompt, false);
      const assistantMsg: Message = { role: 'assistant', content: response.content };
      setMessages((prev) => [...prev, assistantMsg]);
    } catch {
      setMessages((prev) => [
        ...prev,
        { role: 'assistant', content: 'Lost the signal for a second. Hit send again \u2014 I\u2019m not going anywhere.' },
      ]);
    } finally {
      setLoading(false);
      setTimeout(() => scrollRef.current?.scrollToEnd({ animated: true }), 100);
    }
  }, [input, buildContext]);

  return (
    <>
      {/* Floating Action Button */}
      {!isOpen && (
        <Animated.View style={[styles.fab, { transform: [{ scale: pulseAnim }] }]}>
          <Pressable
            style={styles.fabInner}
            onPress={() => {
              Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Medium);
              setIsOpen(true);
            }}
          >
            <Luggage size={24} color={COLORS.cream} strokeWidth={1.5} />
          </Pressable>
        </Animated.View>
      )}

      {/* Concierge Panel */}
      <Modal
        visible={isOpen}
        animationType="slide"
        presentationStyle="pageSheet"
        onRequestClose={() => setIsOpen(false)}
      >
        <KeyboardAvoidingView
          style={styles.container}
          behavior={Platform.OS === 'ios' ? 'padding' : 'height'}
        >
          {/* Header */}
          <View style={styles.header}>
            <View style={styles.headerLeft}>
              <Luggage size={24} color={COLORS.cream} strokeWidth={1.5} />
              <View>
                <Text style={styles.headerTitle}>{t('concierge.title', { defaultValue: 'Pocket Concierge' })}</Text>
                <Text style={styles.headerSubtitle}>{t('concierge.subtitle', { defaultValue: 'Ask me anything about your trip' })}</Text>
              </View>
            </View>
            <Pressable onPress={() => setIsOpen(false)}>
              <Text style={styles.closeButton}>{t('concierge.done', { defaultValue: 'Done' })}</Text>
            </Pressable>
          </View>

          {/* Messages */}
          <ScrollView
            ref={scrollRef}
            style={styles.messagesContainer}
            contentContainerStyle={styles.messagesContent}
            showsVerticalScrollIndicator={false}
          >
            {messages.length === 0 && (
              <View style={styles.emptyState}>
                <Text style={styles.emptyTitle}>{t('concierge.emptyTitle', { defaultValue: 'How can I help?' })}</Text>
                <Text style={styles.emptySubtitle}>
                  {t('concierge.emptySubtitle', { defaultValue: 'I know your trip, your budget, and your style. Ask me anything.' })}
                </Text>
                <View style={styles.quickAsks}>
                  {QUICK_ASKS.map((q) => (
                    <Pressable
                      key={q}
                      style={({ pressed }) => [
                        styles.quickAskPill,
                        { opacity: pressed ? 0.7 : 1 },
                      ]}
                      onPress={() => handleSend(q)}
                    >
                      <Text style={styles.quickAskText}>{q}</Text>
                    </Pressable>
                  ))}
                </View>
              </View>
            )}

            {messages.map((msg, i) => (
              <View
                key={i}
                style={[
                  styles.messageBubble,
                  msg.role === 'user' ? styles.userBubble : styles.assistantBubble,
                ]}
              >
                <Text
                  style={[
                    styles.messageText,
                    msg.role === 'user' ? styles.userText : styles.assistantText,
                  ]}
                >
                  {msg.content}
                </Text>
              </View>
            ))}

            {loading && (
              <View style={[styles.messageBubble, styles.assistantBubble]}>
                <Text style={[styles.messageText, styles.assistantText]}>{t('concierge.checkingNotes', { defaultValue: 'Checking my notes...' })}</Text>
              </View>
            )}
          </ScrollView>

          {/* Input */}
          <View style={styles.inputContainer}>
            <TextInput
              style={styles.input}
              value={input}
              onChangeText={setInput}
              placeholder={t('concierge.inputPlaceholder', { defaultValue: 'Ask me anything...' })}
              placeholderTextColor={COLORS.creamMuted}
              onSubmitEditing={() => handleSend()}
              returnKeyType="send"
              blurOnSubmit={false}
            />
            <Pressable
              style={[styles.sendButton, !input.trim() && styles.sendButtonDisabled]}
              onPress={() => handleSend()}
              disabled={!input.trim() || loading}
            >
              <Text style={styles.sendButtonText}>↑</Text>
            </Pressable>
          </View>
        </KeyboardAvoidingView>
      </Modal>
    </>
  );
}

// ---------------------------------------------------------------------------
// Styles
// ---------------------------------------------------------------------------
const styles = StyleSheet.create({
  // FAB
  fab: {
    position: 'absolute',
    bottom: 100,
    right: SPACING.lg,
    zIndex: 999,
  } as ViewStyle,
  fabInner: {
    width: 56,
    height: 56,
    borderRadius: RADIUS.pill,
    backgroundColor: COLORS.coral,
    alignItems: 'center',
    justifyContent: 'center',
  } as ViewStyle,
  fabEmoji: {
    fontSize: 24,
  } as TextStyle,

  // Container
  container: {
    flex: 1,
    backgroundColor: COLORS.bg,
  } as ViewStyle,

  // Header
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: SPACING.lg,
    paddingTop: SPACING.lg,
    paddingBottom: SPACING.md,
    borderBottomWidth: 1,
    borderBottomColor: COLORS.border,
  } as ViewStyle,
  headerLeft: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: SPACING.sm,
  } as ViewStyle,
  headerEmoji: {
    fontSize: 28,
  } as TextStyle,
  headerTitle: {
    fontFamily: FONTS.header,
    fontSize: 22,
    color: COLORS.cream,
  } as TextStyle,
  headerSubtitle: {
    fontFamily: FONTS.body,
    fontSize: 12,
    color: COLORS.creamMuted,
  } as TextStyle,
  closeButton: {
    fontFamily: FONTS.bodyMedium,
    fontSize: 16,
    color: COLORS.sage,
  } as TextStyle,

  // Messages
  messagesContainer: {
    flex: 1,
  } as ViewStyle,
  messagesContent: {
    padding: SPACING.lg,
    gap: SPACING.sm,
    flexGrow: 1,
  } as ViewStyle,

  // Empty state
  emptyState: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    paddingVertical: SPACING.xxl,
    gap: SPACING.sm,
  } as ViewStyle,
  emptyTitle: {
    fontFamily: FONTS.header,
    fontSize: 26,
    color: COLORS.cream,
  } as TextStyle,
  emptySubtitle: {
    fontFamily: FONTS.body,
    fontSize: 14,
    color: COLORS.creamMuted,
    textAlign: 'center',
    maxWidth: 280,
    lineHeight: 20,
  } as TextStyle,
  quickAsks: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    justifyContent: 'center',
    gap: SPACING.sm,
    marginTop: SPACING.md,
    paddingHorizontal: SPACING.md,
  } as ViewStyle,
  quickAskPill: {
    backgroundColor: COLORS.bgGlass,
    borderRadius: RADIUS.full,
    borderWidth: 1,
    borderColor: COLORS.border,
    paddingHorizontal: SPACING.md,
    paddingVertical: SPACING.sm,
  } as ViewStyle,
  quickAskText: {
    fontFamily: FONTS.body,
    fontSize: 13,
    color: COLORS.cream,
  } as TextStyle,

  // Bubbles
  messageBubble: {
    maxWidth: '85%',
    borderRadius: RADIUS.lg,
    padding: SPACING.md,
  } as ViewStyle,
  userBubble: {
    alignSelf: 'flex-end',
    backgroundColor: COLORS.sage,
    borderBottomRightRadius: SPACING.xs,
  } as ViewStyle,
  assistantBubble: {
    alignSelf: 'flex-start',
    backgroundColor: COLORS.bgGlass,
    borderWidth: 1,
    borderColor: COLORS.border,
    borderBottomLeftRadius: SPACING.xs,
  } as ViewStyle,
  messageText: {
    fontFamily: FONTS.body,
    fontSize: 15,
    lineHeight: 22,
  } as TextStyle,
  userText: {
    color: COLORS.bg,
  } as TextStyle,
  assistantText: {
    color: COLORS.cream,
  } as TextStyle,

  // Input
  inputContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: SPACING.lg,
    paddingVertical: SPACING.md,
    borderTopWidth: 1,
    borderTopColor: COLORS.border,
    gap: SPACING.sm,
  } as ViewStyle,
  input: {
    flex: 1,
    height: 44,
    backgroundColor: COLORS.bgGlass,
    borderRadius: RADIUS.full,
    borderWidth: 1,
    borderColor: COLORS.border,
    paddingHorizontal: SPACING.lg,
    fontFamily: FONTS.body,
    fontSize: 15,
    color: COLORS.cream,
  } as TextStyle,
  sendButton: {
    width: 44,
    height: 44,
    borderRadius: RADIUS.pill,
    backgroundColor: COLORS.sage,
    alignItems: 'center',
    justifyContent: 'center',
  } as ViewStyle,
  sendButtonDisabled: {
    opacity: 0.3,
  } as ViewStyle,
  sendButtonText: {
    fontSize: 20,
    color: COLORS.bg,
    fontWeight: '700',
  } as TextStyle,
});
