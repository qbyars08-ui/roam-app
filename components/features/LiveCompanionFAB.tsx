// =============================================================================
// ROAM — Live Travel Companion FAB
// Real AI assistant that knows your full itinerary. Multi-turn conversation,
// streaming responses, offline emergency fallback.
// =============================================================================
import React, { useCallback, useRef, useState } from 'react';
import {
  ActivityIndicator,
  View,
  Text,
  Pressable,
  Modal,
  TextInput,
  ScrollView,
  StyleSheet,
  KeyboardAvoidingView,
  Platform,
  type ViewStyle,
  type TextStyle,
} from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import * as Haptics from '../../lib/haptics';
import { MessageCircle, X, Send, Zap } from 'lucide-react-native';

import { COLORS, FONTS, SPACING, RADIUS } from '../../lib/constants';
import { useAppStore } from '../../lib/store';
import { callClaudeWithMessages } from '../../lib/claude';
import { getPrepSection } from '../../lib/prep/storage';
import { parseItinerary } from '../../lib/types/itinerary';

// ---------------------------------------------------------------------------
// Types
// ---------------------------------------------------------------------------
interface ChatMessage {
  readonly role: 'user' | 'assistant';
  readonly content: string;
}

// ---------------------------------------------------------------------------
// System prompt — gives Claude full trip context
// ---------------------------------------------------------------------------
function buildCompanionSystem(destination: string, days: number, itineraryJson: string): string {
  let itinerarySummary = '';
  try {
    const parsed = parseItinerary(JSON.parse(itineraryJson));
    const daysSummary = parsed.days.map((d) => {
      const activities = [d.morning, d.afternoon, d.evening]
        .filter(Boolean)
        .map((a) => `${a?.activity} at ${a?.location}`)
        .join(', ');
      return `Day ${d.day} (${d.theme}): ${activities}`;
    }).join('\n');
    itinerarySummary = `\n\nFull itinerary:\n${daysSummary}`;
  } catch {
    // Itinerary parsing failed — continue without it
  }

  return `You are ROAM — a live travel companion for someone visiting ${destination} for ${days} days.

You have their FULL itinerary and can answer any question about their trip.${itinerarySummary}

RULES:
1. Be concise — 2-3 sentences max unless they ask for detail.
2. Sound like a well-traveled friend, not a tour guide.
3. If they ask about something on their itinerary, reference specific details.
4. For restaurant/bar recs, give the actual name + neighborhood + what to order.
5. For emergencies, give specific numbers and nearest hospitals.
6. Never use emojis.
7. If you don't know something specific, say so — don't make up addresses or phone numbers.`;
}

// ---------------------------------------------------------------------------
// Suggested prompts — contextual quick-starts
// ---------------------------------------------------------------------------
const QUICK_PROMPTS = [
  'What should I do tonight?',
  'Best coffee near my hotel?',
  'Is it safe to walk here at night?',
  'What should I tip?',
  'Recommend something off the itinerary',
] as const;

// ---------------------------------------------------------------------------
// Component
// ---------------------------------------------------------------------------
export default function LiveCompanionFAB() {
  const insets = useSafeAreaInsets();
  const activeTripId = useAppStore((s) => s.activeTripId);
  const trips = useAppStore((s) => s.trips);
  const [visible, setVisible] = useState(false);
  const [input, setInput] = useState('');
  const [messages, setMessages] = useState<readonly ChatMessage[]>([]);
  const [isLoading, setIsLoading] = useState(false);
  const scrollRef = useRef<ScrollView>(null);

  const activeTrip =
    trips.find((t) => t.id === activeTripId) ?? trips[0] ?? null;
  if (!activeTrip) return null;

  const handleOpen = useCallback(() => {
    Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
    setVisible(true);
  }, []);

  const handleClose = useCallback(() => {
    setVisible(false);
  }, []);

  const scrollToBottom = useCallback(() => {
    setTimeout(() => scrollRef.current?.scrollToEnd({ animated: true }), 100);
  }, []);

  const handleSend = useCallback(async (text?: string) => {
    const q = (text ?? input).trim();
    if (!q || isLoading) return;

    Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
    setInput('');

    // Emergency shortcut — offline-first
    if (q.toUpperCase().includes('HELP') || q.toUpperCase().includes('EMERGENCY')) {
      const userMsg: ChatMessage = { role: 'user', content: q };
      try {
        const data = await getPrepSection(activeTrip.id, 'emergency');
        const parsed = data ? JSON.parse(data) : {};
        const nums: Array<{ label: string; number: string }> = parsed.emergency ?? [];
        const emergencyText = nums.length > 0
          ? `EMERGENCY NUMBERS\n\n${nums.map((e) => `${e.label}: ${e.number}`).join('\n')}\n\nIf you need immediate help, call the local emergency number.`
          : `For emergencies in ${activeTrip.destination}, call the local emergency services. Save this number before you travel.`;
        const assistantMsg: ChatMessage = { role: 'assistant', content: emergencyText };
        setMessages((prev) => [...prev, userMsg, assistantMsg]);
        scrollToBottom();
      } catch {
        const assistantMsg: ChatMessage = { role: 'assistant', content: `Call local emergency services in ${activeTrip.destination}. If you need medical help, go to the nearest hospital.` };
        setMessages((prev) => [...prev, userMsg, assistantMsg]);
        scrollToBottom();
      }
      return;
    }

    const userMsg: ChatMessage = { role: 'user', content: q };
    const updatedMessages = [...messages, userMsg];
    setMessages(updatedMessages);
    setIsLoading(true);
    scrollToBottom();

    try {
      const systemPrompt = buildCompanionSystem(
        activeTrip.destination,
        activeTrip.days,
        activeTrip.itinerary,
      );

      // Send last 10 messages for context (keep token usage reasonable)
      const contextMessages = updatedMessages.slice(-10).map((m) => ({
        role: m.role,
        content: m.content,
      }));

      const response = await callClaudeWithMessages(systemPrompt, contextMessages, false);
      const assistantMsg: ChatMessage = { role: 'assistant', content: response.content };
      setMessages((prev) => [...prev, assistantMsg]);
    } catch (err: unknown) {
      // Fallback to offline cached answers
      try {
        const cached = await getPrepSection(activeTrip.id, 'ai_companion');
        if (cached) {
          const { qa } = JSON.parse(cached);
          const lower = q.toLowerCase();
          const match = qa.find(
            (item: { q: string }) =>
              item.q.toLowerCase().includes(lower) || lower.includes(item.q.toLowerCase().split(' ')[0])
          );
          if (match) {
            setMessages((prev) => [...prev, { role: 'assistant', content: match.a }]);
            scrollToBottom();
            return;
          }
        }
      } catch {
        // Cache read failed
      }

      const errorText = err instanceof Error && err.message.includes('session')
        ? 'Sign in to chat with your travel companion.'
        : 'Couldn\'t connect right now. Check your connection and try again.';
      setMessages((prev) => [...prev, { role: 'assistant', content: errorText }]);
    } finally {
      setIsLoading(false);
      scrollToBottom();
    }
  }, [input, isLoading, messages, activeTrip, scrollToBottom]);

  const handleQuickPrompt = useCallback((prompt: string) => {
    handleSend(prompt);
  }, [handleSend]);

  return (
    <>
      <Pressable
        onPress={handleOpen}
        style={({ pressed }) => [
          styles.fab,
          {
            bottom: (insets.bottom || 24) + 100,
            opacity: pressed ? 0.9 : 1,
            transform: [{ scale: pressed ? 0.92 : 1 }],
          },
        ]}
      >
        <View style={styles.fabInner}>
          <MessageCircle size={24} color={COLORS.bg} strokeWidth={2.5} />
        </View>
      </Pressable>

      <Modal
        visible={visible}
        animationType="slide"
        transparent
        onRequestClose={handleClose}
      >
        <KeyboardAvoidingView
          style={styles.modalOverlay}
          behavior={Platform.OS === 'ios' ? 'padding' : undefined}
        >
          <View style={[styles.modalContent, { paddingTop: insets.top + SPACING.md }]}>
            {/* Header */}
            <View style={styles.modalHeader}>
              <View style={styles.headerRow}>
                <Zap size={16} color={COLORS.sage} strokeWidth={2} />
                <Text style={styles.modalTitle}>Travel Companion</Text>
              </View>
              <Text style={styles.modalSubtitle}>
                {activeTrip.destination} · {activeTrip.days} days · AI-powered
              </Text>
              <Pressable
                onPress={handleClose}
                hitSlop={12}
                style={styles.closeBtn}
              >
                <X size={20} color={COLORS.cream} strokeWidth={2} />
              </Pressable>
            </View>

            {/* Chat messages */}
            <ScrollView
              ref={scrollRef}
              style={styles.chatArea}
              contentContainerStyle={styles.chatContent}
              keyboardShouldPersistTaps="handled"
              showsVerticalScrollIndicator={false}
            >
              {messages.length === 0 ? (
                <View style={styles.emptyState}>
                  <Text style={styles.emptyTitle}>
                    Ask anything about your trip
                  </Text>
                  <Text style={styles.emptyHint}>
                    I know your full itinerary. Ask me about restaurants, directions, local tips, or type HELP for emergency numbers.
                  </Text>

                  {/* Quick prompt pills */}
                  <View style={styles.quickPrompts}>
                    {QUICK_PROMPTS.map((prompt) => (
                      <Pressable
                        key={prompt}
                        onPress={() => handleQuickPrompt(prompt)}
                        style={({ pressed }) => [
                          styles.quickPill,
                          { opacity: pressed ? 0.7 : 1 },
                        ]}
                      >
                        <Text style={styles.quickPillText}>{prompt}</Text>
                      </Pressable>
                    ))}
                  </View>
                </View>
              ) : (
                messages.map((msg, i) => (
                  <View
                    key={i}
                    style={[
                      styles.bubble,
                      msg.role === 'user' ? styles.userBubble : styles.assistantBubble,
                    ]}
                  >
                    <Text
                      style={[
                        styles.bubbleText,
                        msg.role === 'user' && styles.userBubbleText,
                      ]}
                    >
                      {msg.content}
                    </Text>
                  </View>
                ))
              )}

              {isLoading && (
                <View style={[styles.bubble, styles.assistantBubble]}>
                  <ActivityIndicator size="small" color={COLORS.sage} />
                </View>
              )}
            </ScrollView>

            {/* Input row */}
            <View style={[styles.inputRow, { paddingBottom: insets.bottom + SPACING.sm }]}>
              <TextInput
                style={styles.input}
                value={input}
                onChangeText={setInput}
                placeholder="Ask about your trip..."
                placeholderTextColor={COLORS.creamFaint}
                onSubmitEditing={() => handleSend()}
                returnKeyType="send"
                editable={!isLoading}
              />
              <Pressable
                onPress={() => handleSend()}
                style={({ pressed }) => [
                  styles.sendBtn,
                  { opacity: pressed ? 0.8 : isLoading ? 0.5 : 1 },
                ]}
                disabled={isLoading}
              >
                <Send size={18} color={COLORS.bg} strokeWidth={2} />
              </Pressable>
            </View>
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
  fab: {
    position: 'absolute',
    right: SPACING.lg,
    width: 56,
    height: 56,
    borderRadius: 28,
    backgroundColor: COLORS.sage,
    alignItems: 'center',
    justifyContent: 'center',
    // Subtle shadow
    shadowColor: COLORS.sage,
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.35,
    shadowRadius: 12,
    elevation: 8,
  } as ViewStyle,
  fabInner: {} as ViewStyle,

  modalOverlay: {
    flex: 1,
    backgroundColor: COLORS.overlayLight,
    justifyContent: 'flex-end',
  } as ViewStyle,
  modalContent: {
    backgroundColor: COLORS.bg,
    borderTopLeftRadius: RADIUS.xl,
    borderTopRightRadius: RADIUS.xl,
    maxHeight: '90%',
    flex: 1,
  } as ViewStyle,

  // ── Header ──
  modalHeader: {
    paddingHorizontal: SPACING.lg,
    paddingBottom: SPACING.sm,
    borderBottomWidth: 1,
    borderBottomColor: COLORS.border,
  } as ViewStyle,
  headerRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: SPACING.xs,
  } as ViewStyle,
  modalTitle: {
    fontFamily: FONTS.header,
    fontSize: 24,
    color: COLORS.cream,
  } as TextStyle,
  modalSubtitle: {
    fontFamily: FONTS.mono,
    fontSize: 11,
    color: COLORS.sage,
    marginTop: 2,
    letterSpacing: 0.3,
  } as TextStyle,
  closeBtn: {
    position: 'absolute',
    top: -4,
    right: 0,
    padding: 8,
  } as ViewStyle,

  // ── Chat area ──
  chatArea: {
    flex: 1,
  } as ViewStyle,
  chatContent: {
    paddingHorizontal: SPACING.lg,
    paddingVertical: SPACING.md,
    gap: SPACING.sm,
  } as ViewStyle,

  // ── Empty state ──
  emptyState: {
    paddingTop: SPACING.xl,
    alignItems: 'center',
  } as ViewStyle,
  emptyTitle: {
    fontFamily: FONTS.header,
    fontSize: 20,
    color: COLORS.cream,
    textAlign: 'center',
    marginBottom: SPACING.sm,
  } as TextStyle,
  emptyHint: {
    fontFamily: FONTS.body,
    fontSize: 14,
    color: COLORS.creamMuted,
    textAlign: 'center',
    lineHeight: 21,
    paddingHorizontal: SPACING.md,
    marginBottom: SPACING.lg,
  } as TextStyle,

  // ── Quick prompts ──
  quickPrompts: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: SPACING.sm,
    justifyContent: 'center',
    paddingHorizontal: SPACING.sm,
  } as ViewStyle,
  quickPill: {
    backgroundColor: COLORS.bgCard,
    borderRadius: RADIUS.full,
    borderWidth: 1,
    borderColor: COLORS.border,
    paddingHorizontal: SPACING.md,
    paddingVertical: SPACING.xs + 2,
  } as ViewStyle,
  quickPillText: {
    fontFamily: FONTS.body,
    fontSize: 13,
    color: COLORS.creamSoft,
  } as TextStyle,

  // ── Chat bubbles ──
  bubble: {
    borderRadius: RADIUS.lg,
    padding: SPACING.md,
    maxWidth: '85%',
  } as ViewStyle,
  userBubble: {
    backgroundColor: COLORS.sage,
    alignSelf: 'flex-end',
    borderBottomRightRadius: RADIUS.sm,
  } as ViewStyle,
  assistantBubble: {
    backgroundColor: COLORS.bgCard,
    alignSelf: 'flex-start',
    borderBottomLeftRadius: RADIUS.sm,
    borderWidth: 1,
    borderColor: COLORS.border,
  } as ViewStyle,
  bubbleText: {
    fontFamily: FONTS.body,
    fontSize: 15,
    color: COLORS.cream,
    lineHeight: 22,
  } as TextStyle,
  userBubbleText: {
    color: COLORS.bg,
  } as TextStyle,

  // ── Input row ──
  inputRow: {
    flexDirection: 'row',
    paddingHorizontal: SPACING.lg,
    paddingTop: SPACING.sm,
    gap: SPACING.sm,
    borderTopWidth: 1,
    borderTopColor: COLORS.border,
  } as ViewStyle,
  input: {
    flex: 1,
    height: 48,
    borderRadius: RADIUS.full,
    borderWidth: 1,
    borderColor: COLORS.border,
    backgroundColor: COLORS.bgCard,
    paddingHorizontal: SPACING.md,
    fontFamily: FONTS.body,
    fontSize: 15,
    color: COLORS.cream,
  } as TextStyle,
  sendBtn: {
    width: 48,
    height: 48,
    borderRadius: 24,
    backgroundColor: COLORS.sage,
    alignItems: 'center',
    justifyContent: 'center',
  } as ViewStyle,
});
