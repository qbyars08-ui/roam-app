// =============================================================================
// ROAM — Generate Conversation Mode (chat-based trip planning)
// Context-aware chips, live trip brief, premium conversational UX
// =============================================================================
import React, { useCallback, useMemo, useRef, useState } from 'react';
import {
  View,
  Text,
  TextInput,
  Pressable,
  ScrollView,
  StyleSheet,
  KeyboardAvoidingView,
  Platform,
  ActivityIndicator,
  type ViewStyle,
  type TextStyle,
} from 'react-native';
import * as Haptics from '../../lib/haptics';
import {
  ArrowUp,
  MapPin,
  Calendar,
  Wallet,
  Users,
  Sparkles,
} from 'lucide-react-native';
import { COLORS, FONTS, SPACING, RADIUS } from '../../lib/constants';
import VoiceInputButton from '../features/VoiceInputButton';
import { sendConversationMessage } from '../../lib/claude';

// ---------------------------------------------------------------------------
// Constants
// ---------------------------------------------------------------------------
const FIRST_MESSAGE = 'Where are you thinking? Somewhere specific, or do you want ideas?';
const FIRST_CHIPS = ['I have somewhere in mind', 'Surprise me', 'Southeast Asia maybe', 'Europe this summer'];
const GENERATE_PHRASE = 'Ready to build your trip?';

// Context-aware chip pools based on what the AI is asking about
const CONTEXT_CHIPS: Record<string, string[]> = {
  destination: ['Tokyo', 'Barcelona', 'Bali', 'Mexico City', 'Somewhere warm'],
  duration: ['3-4 days', 'A week', '10 days', 'Two weeks'],
  budget: ['Keep it cheap', 'Mid-range is fine', 'Go all out'],
  vibe: ['Adventure', 'Culture & food', 'Relaxed beach', 'Nightlife & party', 'Off the beaten path'],
  group: ['Just me', 'Me and a friend', 'Couple trip', 'Group of 4-5'],
  general: ['Sounds good', 'Tell me more', 'Different vibe', 'Change that'],
};

// ---------------------------------------------------------------------------
// Types
// ---------------------------------------------------------------------------
interface ConversationMessage {
  role: 'user' | 'assistant';
  content: string;
}

interface TripBrief {
  destination?: string;
  days?: number;
  budget?: string;
  groupSize?: number;
  vibes: string[];
}

interface GenerateConversationModeProps {
  onGenerate: (brief: TripBrief) => Promise<void>;
  isGenerating: boolean;
}

// ---------------------------------------------------------------------------
// Component
// ---------------------------------------------------------------------------
export default function GenerateConversationMode({
  onGenerate,
  isGenerating,
}: GenerateConversationModeProps) {
  console.log('[ROAM] GenerateConversationMode mounted');

  const [messages, setMessages] = useState<ConversationMessage[]>([
    { role: 'assistant', content: FIRST_MESSAGE },
  ]);
  const [input, setInput] = useState('');
  const [suggestions, setSuggestions] = useState<string[]>(FIRST_CHIPS);
  const [isLoading, setIsLoading] = useState(false);
  const [showGenerateBtn, setShowGenerateBtn] = useState(false);
  const [tripBrief, setTripBrief] = useState<TripBrief>({ vibes: [] });

  // Derive what's been confirmed for the brief summary bar
  const briefFields = useMemo(() => {
    const fields: Array<{ icon: typeof MapPin; label: string; color: string }> = [];
    if (tripBrief.destination) {
      fields.push({ icon: MapPin, label: tripBrief.destination, color: COLORS.sage });
    }
    if (tripBrief.days) {
      fields.push({ icon: Calendar, label: `${tripBrief.days} days`, color: COLORS.gold });
    }
    if (tripBrief.budget) {
      const budgetLabels: Record<string, string> = { backpacker: 'Budget', comfort: 'Mid-range', 'no-budget': 'Luxury' };
      fields.push({ icon: Wallet, label: budgetLabels[tripBrief.budget] ?? tripBrief.budget, color: COLORS.coral });
    }
    if (tripBrief.groupSize && tripBrief.groupSize > 1) {
      fields.push({ icon: Users, label: `${tripBrief.groupSize} people`, color: COLORS.cream });
    }
    if (tripBrief.vibes.length > 0) {
      fields.push({ icon: Sparkles, label: tripBrief.vibes.slice(0, 2).join(', '), color: COLORS.sage });
    }
    return fields;
  }, [tripBrief]);

  const processResponse = useCallback((content: string, history: ConversationMessage[]) => {
    const assistantMsg: ConversationMessage = { role: 'assistant', content };
    setMessages((prev) => [...prev, assistantMsg]);

    // Update brief from full history
    const brief = extractTripBrief([...history, assistantMsg]);
    setTripBrief(brief);

    if (content.includes(GENERATE_PHRASE)) {
      setShowGenerateBtn(true);
      setSuggestions([]);
    } else {
      // Generate context-aware chips based on what the AI just asked
      const chips = generateContextChips(content);
      setSuggestions(chips);
    }
  }, []);

  const handleChipPress = useCallback(async (chip: string) => {
    Haptics.selectionAsync();
    setSuggestions([]);
    const userMsg: ConversationMessage = { role: 'user', content: chip };
    setMessages((prev) => [...prev, userMsg]);
    setInput('');

    setIsLoading(true);
    try {
      const history = [...messages, userMsg];
      // Anthropic API requires first message to be role:'user' — filter out leading assistant messages
      const apiMessages = history.filter((m, i) => !(i === 0 && m.role === 'assistant'));
      const { content } = await sendConversationMessage(apiMessages);
      processResponse(content, history);
    } catch (err) {
      const errMsg = err instanceof Error ? err.message : String(err);
      console.error('[ROAM] Chat chip error:', errMsg);
      const isAuthError = errMsg.includes('authenticate') || errMsg.includes('401') || errMsg.includes('token');
      const isTimeout = errMsg.includes('timed out');
      const userMessage = isAuthError
        ? 'Having trouble connecting. Try refreshing the page.'
        : isTimeout
          ? 'That took too long. Want to try again?'
          : 'Lost connection for a second. Mind sending that again?';
      setMessages((prev) => [
        ...prev,
        { role: 'assistant', content: userMessage },
      ]);
      setSuggestions(['Try again', 'Start over']);
    } finally {
      setIsLoading(false);
    }
  }, [messages, processResponse]);

  const handleSend = useCallback(async () => {
    const text = input.trim();
    if (!text || isLoading) return;

    Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
    const userMsg: ConversationMessage = { role: 'user', content: text };
    setMessages((prev) => [...prev, userMsg]);
    setInput('');
    setSuggestions([]);

    setIsLoading(true);
    try {
      const history = [...messages, userMsg];
      // Anthropic API requires first message to be role:'user' — filter out leading assistant messages
      const apiMessages = history.filter((m, i) => !(i === 0 && m.role === 'assistant'));
      const { content } = await sendConversationMessage(apiMessages);
      processResponse(content, history);
    } catch (err) {
      const errMsg = err instanceof Error ? err.message : String(err);
      console.error('[ROAM] Chat send error:', errMsg);
      const isAuthError = errMsg.includes('authenticate') || errMsg.includes('401') || errMsg.includes('token');
      const isTimeout = errMsg.includes('timed out');
      const userMessage = isAuthError
        ? 'Having trouble connecting. Try refreshing the page.'
        : isTimeout
          ? 'That took too long. Want to try again?'
          : 'Hmm, connection dropped. Probably just a hiccup — try again?';
      setMessages((prev) => [
        ...prev,
        { role: 'assistant', content: userMessage },
      ]);
      setSuggestions(['Retry']);
    } finally {
      setIsLoading(false);
    }
  }, [input, isLoading, messages, processResponse]);

  const handleGeneratePress = useCallback(async () => {
    Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Medium);
    const final: TripBrief = {
      destination: tripBrief.destination ?? 'Tokyo',
      days: tripBrief.days ?? 5,
      budget: tripBrief.budget ?? 'comfort',
      groupSize: tripBrief.groupSize ?? 1,
      vibes: tripBrief.vibes.length > 0 ? tripBrief.vibes : ['culture'],
    };
    await onGenerate(final);
  }, [tripBrief, onGenerate]);

  const lastMessage = messages[messages.length - 1];
  const isAssistant = lastMessage?.role === 'assistant';

  return (
    <KeyboardAvoidingView
      style={styles.container}
      behavior={Platform.OS === 'ios' ? 'padding' : 'height'}
      keyboardVerticalOffset={0}
    >
      {/* ── Live Trip Brief Bar ── */}
      {briefFields.length > 0 && (
        <ScrollView
          horizontal
          showsHorizontalScrollIndicator={false}
          contentContainerStyle={styles.briefBar}
        >
          {briefFields.map((field, i) => (
            <View key={i} style={styles.briefPill}>
              <field.icon size={12} color={field.color} strokeWidth={2} />
              <Text style={[styles.briefPillText, { color: field.color }]}>{field.label}</Text>
            </View>
          ))}
        </ScrollView>
      )}

      {/* ── Main message area ── */}
      <View style={styles.center}>
        <Text style={styles.messageText}>
          {lastMessage?.content}
        </Text>

        {/* Context-aware suggestion chips */}
        {isAssistant && suggestions.length > 0 && !isLoading && (
          <View style={styles.chipRow}>
            {suggestions.map((chip) => (
              <Pressable
                key={chip}
                onPress={() => handleChipPress(chip)}
                style={({ pressed }) => [
                  styles.suggestionChip,
                  pressed && styles.suggestionChipPressed,
                ]}
              >
                <Text style={styles.suggestionText}>{chip}</Text>
              </Pressable>
            ))}
          </View>
        )}

        {isLoading && (
          <View style={styles.loadingWrap}>
            <ActivityIndicator size="small" color={COLORS.sage} />
            <Text style={styles.loadingText}>thinking...</Text>
          </View>
        )}
      </View>

      {/* ── Generate button ── */}
      {showGenerateBtn && (
        <Pressable
          onPress={handleGeneratePress}
          disabled={isGenerating}
          style={({ pressed }) => [
            styles.generateBtn,
            isGenerating && styles.generateBtnDisabled,
            pressed && { opacity: 0.9, transform: [{ scale: 0.98 }] },
          ]}
        >
          {isGenerating ? (
            <ActivityIndicator size="small" color={COLORS.bg} />
          ) : (
            <>
              <Sparkles size={20} color={COLORS.bg} strokeWidth={2} />
              <Text style={styles.generateBtnText}>{tripBrief.destination ? `See My ${tripBrief.destination} Trip` : 'See My Trip'}</Text>
            </>
          )}
        </Pressable>
      )}

      {/* ── Input bar ── */}
      <View style={styles.inputWrap}>
        <VoiceInputButton
          onTranscript={(text) => setInput((prev) => prev ? `${prev} ${text}` : text)}
          disabled={isLoading || isGenerating}
        />
        <TextInput
          style={styles.input}
          value={input}
          onChangeText={setInput}
          placeholder="Type anything..."
          placeholderTextColor={COLORS.creamDim}
          editable={!isLoading && !isGenerating}
          onSubmitEditing={handleSend}
          returnKeyType="send"
        />
        <Pressable
          onPress={handleSend}
          disabled={!input.trim() || isLoading}
          style={({ pressed }) => [
            styles.sendBtn,
            (!input.trim() || isLoading) && styles.sendBtnDisabled,
            pressed && { opacity: 0.8 },
          ]}
        >
          <ArrowUp size={20} color={COLORS.bg} strokeWidth={2} />
        </Pressable>
      </View>
    </KeyboardAvoidingView>
  );
}

// ---------------------------------------------------------------------------
// Context-aware chip generation — analyzes AI response to suggest relevant options
// ---------------------------------------------------------------------------
function generateContextChips(content: string): string[] {
  const lower = content.toLowerCase();

  // Detect what the AI is asking about and serve relevant chips
  if (lower.includes('where') || lower.includes('destination') || lower.includes('which city') || lower.includes('country')) {
    return pickRandom(CONTEXT_CHIPS.destination, 3);
  }
  if (lower.includes('how long') || lower.includes('how many days') || lower.includes('duration') || lower.includes('week')) {
    return pickRandom(CONTEXT_CHIPS.duration, 3);
  }
  if (lower.includes('budget') || lower.includes('spend') || lower.includes('how much') || lower.includes('price') || lower.includes('cost')) {
    return pickRandom(CONTEXT_CHIPS.budget, 3);
  }
  if (lower.includes('vibe') || lower.includes('type of trip') || lower.includes('style') || lower.includes('looking for') || lower.includes('what kind')) {
    return pickRandom(CONTEXT_CHIPS.vibe, 3);
  }
  if (lower.includes('who') || lower.includes('traveling with') || lower.includes('solo') || lower.includes('group') || lower.includes('couple')) {
    return pickRandom(CONTEXT_CHIPS.group, 3);
  }

  // Default fallback — general conversation chips
  return pickRandom(CONTEXT_CHIPS.general, 3);
}

function pickRandom(arr: string[], count: number): string[] {
  const shuffled = [...arr].sort(() => Math.random() - 0.5);
  return shuffled.slice(0, count);
}

// ---------------------------------------------------------------------------
// Trip brief extraction — parses conversation for trip details
// ---------------------------------------------------------------------------
function extractTripBrief(messages: ConversationMessage[]): TripBrief {
  const brief: TripBrief = { vibes: [] };
  const vibeKeys = ['adventure', 'culture', 'relaxed', 'party', 'foodie', 'digital nomad', 'romantic', 'nightlife', 'nature', 'beach'];

  for (const m of messages) {
    const text = m.content.toLowerCase();

    // Duration
    const daysMatch = text.match(/(\d+)\s*days?/);
    if (daysMatch) brief.days = parseInt(daysMatch[1], 10);
    const weekMatch = text.match(/(\d+)\s*weeks?/);
    if (weekMatch) brief.days = parseInt(weekMatch[1], 10) * 7;
    if (text.includes('a week') && !brief.days) brief.days = 7;
    if (text.includes('two weeks') && !brief.days) brief.days = 14;
    if (text.includes('long weekend')) brief.days = 4;

    // Budget
    if (text.includes('budget') || text.includes('cheap') || text.includes('backpack') || text.includes('keep it cheap')) {
      brief.budget = 'backpacker';
    }
    if (text.includes('mid-range') || text.includes('mid range') || text.includes('moderate') || text.includes('comfort')) {
      brief.budget = 'comfort';
    }
    if (text.includes('luxury') || text.includes('splurge') || text.includes('no limit') || text.includes('go all out') || text.includes('no budget')) {
      brief.budget = 'no-budget';
    }

    // Group size
    const groupMatch = text.match(/(\d+)\s*(?:people|travelers?|of us|friends)/);
    if (groupMatch) brief.groupSize = parseInt(groupMatch[1], 10);
    if (text.includes('just me') || text.includes('solo')) brief.groupSize = 1;
    if (text.includes('couple') || text.includes('me and my') || text.includes('two of us')) brief.groupSize = 2;

    // Vibes
    for (const v of vibeKeys) {
      if (text.includes(v) && !brief.vibes.includes(v)) brief.vibes.push(v);
    }
  }

  // Destination extraction — check all user messages for city names
  const destinationCities = [
    'tokyo', 'bali', 'lisbon', 'barcelona', 'paris', 'rome', 'bangkok',
    'mexico city', 'cape town', 'medellin', 'medellín', 'kyoto', 'marrakech',
    'budapest', 'buenos aires', 'amsterdam', 'london', 'new york', 'dubai',
    'seoul', 'singapore', 'iceland', 'greece', 'croatia', 'portugal',
    'vietnam', 'thailand', 'japan', 'italy', 'spain', 'colombia', 'peru',
    'costa rica', 'morocco', 'turkey', 'istanbul', 'prague', 'berlin',
    'copenhagen', 'stockholm', 'austin', 'cartagena', 'oaxaca', 'tulum',
    'southeast asia', 'europe', 'south america', 'central america',
  ];

  for (const m of messages) {
    if (m.role !== 'user') continue;
    const text = m.content.toLowerCase();
    for (const city of destinationCities) {
      if (text.includes(city)) {
        // Capitalize properly
        brief.destination = city
          .split(' ')
          .map((w) => w.charAt(0).toUpperCase() + w.slice(1))
          .join(' ');
        break;
      }
    }
    if (brief.destination) break;
  }

  // Fallback: regex extraction
  if (!brief.destination) {
    const lastUser = [...messages].reverse().find((m) => m.role === 'user');
    if (lastUser) {
      const cityMatch = lastUser.content.match(/(?:to|in|around|visit)\s+([A-Z][a-zA-Z\s]{2,20})/);
      if (cityMatch) {
        brief.destination = cityMatch[1].trim();
      }
    }
  }

  return brief;
}

// ---------------------------------------------------------------------------
// Styles
// ---------------------------------------------------------------------------
const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: COLORS.bg,
  },

  // ── Brief bar ──
  briefBar: {
    paddingHorizontal: SPACING.md,
    paddingVertical: SPACING.sm,
    gap: 8,
    borderBottomWidth: 1,
    borderBottomColor: COLORS.border,
  },
  briefPill: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
    backgroundColor: COLORS.bgCard,
    borderRadius: RADIUS.full,
    paddingHorizontal: 10,
    paddingVertical: 6,
    borderWidth: 1,
    borderColor: COLORS.border,
  },
  briefPillText: {
    fontFamily: FONTS.mono,
    fontSize: 11,
    letterSpacing: 0.3,
  },

  // ── Center message ──
  center: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    paddingHorizontal: SPACING.lg,
  },
  messageText: {
    fontFamily: FONTS.header,
    fontSize: 28,
    color: COLORS.cream,
    textAlign: 'center',
    maxWidth: '85%',
    lineHeight: 36,
  },

  // ── Chips ──
  chipRow: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    justifyContent: 'center',
    gap: SPACING.sm,
    marginTop: SPACING.lg,
  },
  suggestionChip: {
    backgroundColor: COLORS.bgCard,
    borderWidth: 1,
    borderColor: COLORS.sage,
    borderRadius: RADIUS.full,
    paddingHorizontal: SPACING.md,
    paddingVertical: 10,
  },
  suggestionChipPressed: {
    opacity: 0.7,
    backgroundColor: COLORS.sageLight,
  },
  suggestionText: {
    fontFamily: FONTS.body,
    fontSize: 14,
    color: COLORS.cream,
  },

  // ── Loading ──
  loadingWrap: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
    marginTop: SPACING.lg,
  },
  loadingText: {
    fontFamily: FONTS.mono,
    fontSize: 12,
    color: COLORS.creamDim,
    fontStyle: 'italic',
  },

  // ── Generate button ──
  generateBtn: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 8,
    backgroundColor: COLORS.sage,
    borderRadius: RADIUS.xl,
    height: 56,
    marginHorizontal: SPACING.md,
    marginBottom: SPACING.sm,
  },
  generateBtnDisabled: {
    opacity: 0.6,
  },
  generateBtnText: {
    fontFamily: FONTS.header,
    fontSize: 22,
    color: COLORS.bg,
  },

  // ── Input bar ──
  inputWrap: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: SPACING.sm,
    paddingHorizontal: SPACING.md,
    paddingVertical: SPACING.md,
    paddingBottom: SPACING.xl,
    backgroundColor: COLORS.bg,
    borderTopWidth: 1,
    borderTopColor: COLORS.border,
  },
  input: {
    flex: 1,
    fontFamily: FONTS.body,
    fontSize: 15,
    color: COLORS.cream,
    backgroundColor: COLORS.bgCard,
    borderRadius: RADIUS.lg,
    borderWidth: 1,
    borderColor: COLORS.whiteFaintBorder,
    paddingHorizontal: SPACING.lg,
    paddingVertical: SPACING.md,
  },
  sendBtn: {
    width: 40,
    height: 40,
    borderRadius: RADIUS.full,
    backgroundColor: COLORS.sage,
    alignItems: 'center',
    justifyContent: 'center',
  },
  sendBtnDisabled: {
    opacity: 0.4,
  },
});
