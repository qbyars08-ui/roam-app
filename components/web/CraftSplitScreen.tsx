// =============================================================================
// ROAM — Web-only split-screen CRAFT experience
// Left panel: full conversation | Right panel: live itinerary preview
// =============================================================================
import React, { useCallback, useEffect, useRef, useState } from 'react';
import {
  View,
  Text,
  TextInput,
  Pressable,
  ScrollView,
  StyleSheet,
  Platform,
  ActivityIndicator,
  Animated,
  type ViewStyle,
  type TextStyle,
} from 'react-native';
import { ArrowLeft, Send, ChevronDown, ChevronRight } from 'lucide-react-native';
import { COLORS, FONTS, SPACING, RADIUS } from '../../lib/constants';
import { CRAFT_BUILDING_MESSAGE, CRAFT_ITINERARY_INTRO } from '../../lib/craft-prompts';
import type { Itinerary, ItineraryDay, TimeSlotActivity } from '../../lib/types/itinerary';
import type { CraftState } from '../../lib/craft-engine';

const BUBBLE_RADIUS_USER = { borderTopLeftRadius: 16, borderTopRightRadius: 16, borderBottomRightRadius: 4, borderBottomLeftRadius: 16 };
const BUBBLE_RADIUS_ASSISTANT = { borderTopLeftRadius: 16, borderTopRightRadius: 16, borderBottomRightRadius: 16, borderBottomLeftRadius: 4 };

function CraftMessageBubble({ role, content }: { role: 'user' | 'assistant'; content: string }) {
  const opacity = useRef(new Animated.Value(0)).current;
  useEffect(() => {
    Animated.timing(opacity, { toValue: 1, duration: 200, useNativeDriver: true }).start();
  }, [opacity]);
  const isUser = role === 'user';
  return (
    <Animated.View style={[styles.msgWrap, isUser ? styles.msgWrapUser : styles.msgWrapAssistant, { opacity }]}>
      <View style={[styles.msgBubble, isUser ? styles.msgBubbleUser : styles.msgBubbleAssistant]}>
        <Text style={[styles.msgText, isUser ? styles.msgTextUser : styles.msgTextAssistant]} selectable>{content}</Text>
      </View>
    </Animated.View>
  );
}

function TypingIndicatorDots() {
  const dot1 = useRef(new Animated.Value(0.3)).current;
  const dot2 = useRef(new Animated.Value(0.3)).current;
  const dot3 = useRef(new Animated.Value(0.3)).current;
  useEffect(() => {
    const pulse = (anim: Animated.Value, delay: number) => {
      Animated.loop(
        Animated.sequence([
          Animated.delay(delay),
          Animated.timing(anim, { toValue: 1, duration: 400, useNativeDriver: true }),
          Animated.timing(anim, { toValue: 0.3, duration: 400, useNativeDriver: true }),
        ])
      ).start();
    };
    pulse(dot1, 0);
    pulse(dot2, 150);
    pulse(dot3, 300);
    return () => {};
  }, [dot1, dot2, dot3]);
  return (
    <View style={styles.typingWrap}>
      <View style={[styles.typingBubble, BUBBLE_RADIUS_ASSISTANT]}>
        <View style={styles.typingDots}>
          <Animated.View style={[styles.typingDot, { opacity: dot1 }]} />
          <Animated.View style={[styles.typingDot, { opacity: dot2 }]} />
          <Animated.View style={[styles.typingDot, { opacity: dot3 }]} />
        </View>
      </View>
    </View>
  );
}

function RoamAvatar() {
  return (
    <View style={styles.roamAvatar}>
      <Text style={styles.roamAvatarText}>R</Text>
    </View>
  );
}

// ---------------------------------------------------------------------------
// Props — mirrors the state from CraftSessionScreen
// ---------------------------------------------------------------------------
interface CraftSplitScreenProps {
  state: CraftState;
  input: string;
  loading: boolean;
  error: string | null;
  parsedItinerary: Itinerary | null;
  streamingText: string;
  welcomeBackMessage: string | null;
  question: string;
  isGathering: boolean;
  isBuilding: boolean;
  isFollowUp: boolean;
  onInputChange: (text: string) => void;
  onSubmit: () => void;
  onBack: () => void;
  onSaveTrip: () => void;
}

// ---------------------------------------------------------------------------
// Gate: only render on web
// ---------------------------------------------------------------------------
export default function CraftSplitScreen(props: CraftSplitScreenProps) {
  if (Platform.OS !== 'web') return null;
  return <CraftSplitScreenInner {...props} />;
}

// ---------------------------------------------------------------------------
// Inner component — the actual split-screen layout
// ---------------------------------------------------------------------------
function CraftSplitScreenInner({
  state,
  input,
  loading,
  error,
  parsedItinerary,
  streamingText,
  welcomeBackMessage,
  question,
  isGathering,
  isBuilding,
  isFollowUp,
  onInputChange,
  onSubmit,
  onBack,
  onSaveTrip,
}: CraftSplitScreenProps) {
  const chatScrollRef = useRef<ScrollView>(null);
  const inputRef = useRef<TextInput>(null);
  const [dividerX, setDividerX] = useState(50); // percentage for left panel
  const [dragging, setDragging] = useState(false);
  const [questionVisible, setQuestionVisible] = useState(false);
  const prevFollowUpLen = useRef(state.followUpMessages.length);

  // Question appears after 300ms
  useEffect(() => {
    if (!question) {
      setQuestionVisible(false);
      return;
    }
    const t = setTimeout(() => setQuestionVisible(true), 300);
    return () => clearTimeout(t);
  }, [question]);

  // Auto-focus input after each ROAM response
  useEffect(() => {
    if (state.followUpMessages.length > prevFollowUpLen.current && !loading) {
      prevFollowUpLen.current = state.followUpMessages.length;
      setTimeout(() => inputRef.current?.focus(), 100);
    } else {
      prevFollowUpLen.current = state.followUpMessages.length;
    }
  }, [state.followUpMessages.length, loading]);

  // --- Draggable divider (web mouse events) ---
  const handleDividerMouseDown = useCallback(() => {
    setDragging(true);
    const onMove = (e: MouseEvent) => {
      const pct = (e.clientX / window.innerWidth) * 100;
      const clamped = Math.max(30, Math.min(70, pct));
      setDividerX(clamped);
    };
    const onUp = () => {
      setDragging(false);
      window.removeEventListener('mousemove', onMove);
      window.removeEventListener('mouseup', onUp);
    };
    window.addEventListener('mousemove', onMove);
    window.addEventListener('mouseup', onUp);
  }, []);

  // Streaming text: strip itinerary_json tags for display
  const visibleStreaming = streamingText.includes('<itinerary_json>')
    ? streamingText.slice(0, streamingText.indexOf('<itinerary_json>')).trim()
    : streamingText;

  return (
    <View style={styles.root}>
      {/* Header */}
      <View style={styles.header}>
        <Pressable onPress={onBack} style={styles.backBtn} accessibilityLabel="Back" accessibilityRole="button">
          <ArrowLeft size={22} color={COLORS.cream} strokeWidth={1.5} />
        </Pressable>
        <Text style={styles.headerTitle}>Plan together</Text>
        {isFollowUp && parsedItinerary ? (
          <Pressable
            onPress={onSaveTrip}
            style={({ pressed }) => [styles.saveChip, { opacity: pressed ? 0.9 : 1 }]}
            accessibilityLabel="Save trip"
            accessibilityRole="button"
          >
            <Text style={styles.saveChipText}>Save trip</Text>
          </Pressable>
        ) : null}
      </View>

      {/* Split panels */}
      <View style={styles.panels}>
        {/* LEFT: Conversation */}
        <View style={{ flex: dividerX, minWidth: 300 }}>
          <ScrollView
            ref={chatScrollRef}
            style={styles.chatScroll}
            contentContainerStyle={styles.chatContent}
            onContentSizeChange={() => chatScrollRef.current?.scrollToEnd({ animated: true })}
          >
            {welcomeBackMessage ? (
              <View style={styles.welcomeBack}>
                <Text style={styles.welcomeBackText}>{welcomeBackMessage}</Text>
              </View>
            ) : null}

            {/* Gathering-phase messages */}
            {state.messages.map((msg, i) => (
              <CraftMessageBubble key={`msg-${i}`} role={msg.role} content={msg.content} />
            ))}

            {/* Typing indicator when waiting for response (gathering) */}
            {loading && isGathering ? (
              <View style={styles.followUpLoading}>
                <TypingIndicatorDots />
              </View>
            ) : null}

            {/* Current question with ROAM avatar */}
            {isGathering && questionVisible && question ? (
              <View style={styles.questionBlock}>
                <RoamAvatar />
                <Text style={styles.questionText}>{question}</Text>
              </View>
            ) : null}

            {/* Building indicator in chat */}
            {isBuilding ? (
              <View style={styles.buildingInChat}>
                <ActivityIndicator size="small" color={COLORS.gold} />
                <Text style={styles.buildingChatText}>{CRAFT_BUILDING_MESSAGE}</Text>
              </View>
            ) : null}

            {/* Follow-up intro */}
            {isFollowUp && parsedItinerary ? (
              <View style={styles.followUpIntro}>
                <Text style={styles.introText}>
                  {CRAFT_ITINERARY_INTRO(parsedItinerary.destination)}
                </Text>
              </View>
            ) : null}

            {/* Follow-up messages */}
            {state.followUpMessages.map((msg, i) => (
              <CraftMessageBubble key={`fu-${i}`} role={msg.role} content={msg.content} />
            ))}

            {/* Streaming follow-up */}
            {visibleStreaming ? (
              <CraftMessageBubble role="assistant" content={visibleStreaming} />
            ) : null}

            {/* Follow-up loading — typing dots */}
            {loading && isFollowUp && !streamingText ? (
              <View style={styles.followUpLoading}>
                <TypingIndicatorDots />
              </View>
            ) : null}
          </ScrollView>

          {/* Error banner */}
          {error ? (
            <View style={styles.errorBanner}>
              <Text style={styles.errorText}>{error}</Text>
            </View>
          ) : null}

          {/* Input row */}
          <View style={styles.inputRow}>
            <TextInput
              ref={inputRef}
              style={styles.inputCraft}
              placeholder={
                isFollowUp
                  ? 'Ask anything about your trip — changes, more details, alternatives...'
                  : 'Your answer...'
              }
              placeholderTextColor={COLORS.creamDim}
              value={input}
              onChangeText={onInputChange}
              onSubmitEditing={onSubmit}
              editable={!loading}
              multiline
              maxLength={2000}
            />
            <Pressable
              onPress={onSubmit}
              style={({ pressed }) => [
                styles.sendBtnSage,
                input.trim().length > 0 && styles.sendBtnSagePulse,
                { opacity: pressed ? 0.8 : 1 },
              ]}
              accessibilityLabel="Send"
              accessibilityRole="button"
              disabled={loading}
            >
              {loading ? (
                <ActivityIndicator size="small" color={COLORS.bg} />
              ) : (
                <Send size={20} color={COLORS.bg} strokeWidth={1.5} />
              )}
            </Pressable>
          </View>
        </View>

        {/* DIVIDER — draggable */}
        <View
          style={[styles.divider, dragging ? styles.dividerActive : null]}
          // @ts-expect-error — web-only mouse event handler
          onMouseDown={handleDividerMouseDown}
        />

        {/* RIGHT: Itinerary preview */}
        <View style={{ flex: 100 - dividerX, minWidth: 300 }}>
          {isFollowUp && parsedItinerary ? (
            <ScrollView
              style={styles.previewScroll}
              contentContainerStyle={styles.previewContent}
            >
              <WebItineraryPreview itinerary={parsedItinerary} />
            </ScrollView>
          ) : isBuilding || (loading && !isFollowUp) ? (
            <View style={styles.skeletonContainer}>
              <Text style={styles.skeletonTitle}>Your trip is building...</Text>
              <SkeletonBlock width="60%" height={28} />
              <SkeletonBlock width="40%" height={16} />
              <SkeletonBlock width="90%" height={1} />
              {[1, 2, 3].map((n) => (
                <View key={n} style={styles.skeletonDay}>
                  <SkeletonBlock width="50%" height={20} />
                  <SkeletonBlock width="80%" height={14} />
                  <SkeletonBlock width="70%" height={14} />
                  <SkeletonBlock width="75%" height={14} />
                </View>
              ))}
            </View>
          ) : (
            <View style={styles.emptyPreview}>
              <Text style={styles.emptyPreviewTitle}>Itinerary preview</Text>
              <Text style={styles.emptyPreviewSub}>
                Answer the questions on the left and your personalized trip will appear here in real time.
              </Text>
            </View>
          )}
        </View>
      </View>
    </View>
  );
}

// ---------------------------------------------------------------------------
// Skeleton loading block
// ---------------------------------------------------------------------------
function SkeletonBlock({ width, height }: { width: string | number; height: number }) {
  return (
    <View
      style={[
        styles.skeleton,
        {
          width: width as import('react-native').DimensionValue,
          height,
          marginBottom: SPACING.md,
        },
      ]}
    />
  );
}

// ---------------------------------------------------------------------------
// Web itinerary preview — collapsible day-by-day with inline editing
// ---------------------------------------------------------------------------
function WebItineraryPreview({ itinerary }: { itinerary: Itinerary }) {
  const bb = itinerary.budgetBreakdown;
  return (
    <View>
      {/* Header */}
      <Text style={styles.prevDestination}>{itinerary.destination}</Text>
      <Text style={styles.prevTagline}>{itinerary.tagline}</Text>
      <Text style={styles.prevBudget}>Total budget: {itinerary.totalBudget}</Text>

      {/* Budget breakdown */}
      <View style={styles.prevBudgetCard}>
        <Text style={styles.prevSectionTitle}>Budget breakdown</Text>
        <Text style={styles.prevBudgetLine}>Flights: {bb.transportation || '\u2014'}</Text>
        <Text style={styles.prevBudgetLine}>Accommodation: {bb.accommodation}</Text>
        <Text style={styles.prevBudgetLine}>Food: {bb.food}</Text>
        <Text style={styles.prevBudgetLine}>Activities: {bb.activities}</Text>
        <Text style={styles.prevBudgetLine}>Other: {bb.miscellaneous}</Text>
      </View>

      {/* Days */}
      {itinerary.days.map((day) => (
        <CollapsibleDay key={day.day} day={day} />
      ))}

      {/* Pro tip */}
      {itinerary.proTip ? (
        <View style={styles.proTipBlock}>
          <Text style={styles.proTipLabel}>Pro tip</Text>
          <Text style={styles.proTipText}>{itinerary.proTip}</Text>
        </View>
      ) : null}
    </View>
  );
}

// ---------------------------------------------------------------------------
// Collapsible day block with inline-editable text
// ---------------------------------------------------------------------------
function CollapsibleDay({ day }: { day: ItineraryDay }) {
  const [expanded, setExpanded] = useState(true);
  const toggle = useCallback(() => setExpanded((v) => !v), []);

  return (
    <View style={styles.dayBlock}>
      <Pressable onPress={toggle} style={styles.dayHeader} accessibilityRole="button">
        {expanded ? (
          <ChevronDown size={18} color={COLORS.gold} strokeWidth={1.5} />
        ) : (
          <ChevronRight size={18} color={COLORS.gold} strokeWidth={1.5} />
        )}
        <Text style={styles.dayTheme}>Day {day.day} — {day.theme}</Text>
      </Pressable>
      {expanded ? (
        <View style={styles.dayBody}>
          <SlotDisplay label="Morning" slot={day.morning} />
          <SlotDisplay label="Afternoon" slot={day.afternoon} />
          <SlotDisplay label="Evening" slot={day.evening} />
          <View style={styles.accRow}>
            <Text style={styles.accLabel}>Stay</Text>
            <EditableText style={styles.accName} value={day.accommodation.name} />
            <Text style={styles.accPrice}>{day.accommodation.pricePerNight}/night</Text>
          </View>
          <Text style={styles.dailyCost}>Day total: {day.dailyCost}</Text>
        </View>
      ) : null}
    </View>
  );
}

function SlotDisplay({ label, slot }: { label: string; slot: TimeSlotActivity }) {
  return (
    <View style={styles.slot}>
      <Text style={styles.slotLabel}>{label}</Text>
      <EditableText style={styles.slotActivity} value={slot.activity} />
      {slot.location ? <Text style={styles.slotLocation}>{slot.location}</Text> : null}
      {slot.cost ? <Text style={styles.slotCost}>{slot.cost}</Text> : null}
    </View>
  );
}

// ---------------------------------------------------------------------------
// Inline editable text — click to switch to TextInput
// ---------------------------------------------------------------------------
function EditableText({ style, value }: { style: TextStyle; value: string }) {
  const [editing, setEditing] = useState(false);
  const [text, setText] = useState(value);

  const startEditing = useCallback(() => setEditing(true), []);
  const finishEditing = useCallback(() => setEditing(false), []);

  // Sync external value changes (e.g. itinerary updates from follow-up)
  React.useEffect(() => {
    if (!editing) setText(value);
  }, [value, editing]);

  if (editing) {
    return (
      <TextInput
        style={[style, styles.editableInput]}
        value={text}
        onChangeText={setText}
        onBlur={finishEditing}
        onSubmitEditing={finishEditing}
        autoFocus
        multiline
      />
    );
  }

  return (
    <Pressable onPress={startEditing}>
      <Text style={[style, styles.editableHover]} selectable>
        {text}
      </Text>
    </Pressable>
  );
}

// ---------------------------------------------------------------------------
// Styles
// ---------------------------------------------------------------------------
const styles = StyleSheet.create({
  root: {
    flex: 1,
    backgroundColor: COLORS.bg,
  } as ViewStyle,
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: SPACING.md,
    paddingVertical: SPACING.sm,
    borderBottomWidth: 1,
    borderBottomColor: COLORS.border,
  } as ViewStyle,
  backBtn: {
    padding: SPACING.sm,
    marginRight: SPACING.sm,
  } as ViewStyle,
  headerTitle: {
    fontFamily: FONTS.headerMedium,
    fontSize: 18,
    color: COLORS.cream,
    flex: 1,
  } as TextStyle,
  saveChip: {
    backgroundColor: COLORS.gold,
    borderRadius: RADIUS.pill,
    paddingVertical: SPACING.sm,
    paddingHorizontal: SPACING.lg,
  } as ViewStyle,
  saveChipText: {
    fontFamily: FONTS.bodySemiBold,
    fontSize: 13,
    color: COLORS.bg,
  } as TextStyle,

  // --- Panels ---
  panels: {
    flex: 1,
    flexDirection: 'row',
  } as ViewStyle,

  // --- Divider ---
  divider: {
    width: 1,
    backgroundColor: COLORS.border,
    cursor: 'col-resize' as unknown as undefined, // web-only cursor
  } as ViewStyle,
  dividerActive: {
    backgroundColor: COLORS.sage,
    width: 2,
  } as ViewStyle,

  // --- Chat (left) ---
  chatScroll: {
    flex: 1,
  } as ViewStyle,
  chatContent: {
    paddingHorizontal: SPACING.lg,
    paddingBottom: SPACING.xxl,
    paddingTop: SPACING.md,
  } as ViewStyle,
  questionBlock: {
    flexDirection: 'row',
    alignItems: 'flex-start',
    marginTop: SPACING.xxl,
    marginBottom: SPACING.lg,
    gap: SPACING.sm,
  } as ViewStyle,
  questionText: {
    flex: 1,
    fontFamily: FONTS.header,
    fontSize: 24,
    color: COLORS.cream,
    lineHeight: 32,
  } as TextStyle,
  msgWrap: {
    marginVertical: SPACING.xs,
    flexDirection: 'row',
  } as ViewStyle,
  msgWrapUser: { justifyContent: 'flex-end' } as ViewStyle,
  msgWrapAssistant: { justifyContent: 'flex-start' } as ViewStyle,
  msgBubble: {
    maxWidth: '88%',
    paddingVertical: SPACING.md,
    paddingHorizontal: SPACING.lg,
  } as ViewStyle,
  msgBubbleUser: {
    backgroundColor: COLORS.sageDark,
    ...BUBBLE_RADIUS_USER,
  } as ViewStyle,
  msgBubbleAssistant: {
    backgroundColor: COLORS.surface1,
    ...BUBBLE_RADIUS_ASSISTANT,
  } as ViewStyle,
  msgText: {
    fontFamily: FONTS.body,
    fontSize: 15,
    lineHeight: 22,
  } as TextStyle,
  msgTextUser: { color: COLORS.cream } as TextStyle,
  msgTextAssistant: { color: COLORS.creamMuted } as TextStyle,
  typingWrap: {
    marginVertical: SPACING.xs,
    flexDirection: 'row',
    justifyContent: 'flex-start',
  } as ViewStyle,
  typingBubble: {
    backgroundColor: COLORS.surface1,
    paddingVertical: SPACING.md,
    paddingHorizontal: SPACING.lg,
  } as ViewStyle,
  typingDots: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
  } as ViewStyle,
  typingDot: {
    width: 8,
    height: 8,
    borderRadius: 4,
    backgroundColor: COLORS.sage,
  } as ViewStyle,
  roamAvatar: {
    width: 32,
    height: 32,
    borderRadius: 16,
    backgroundColor: COLORS.sage,
    alignItems: 'center',
    justifyContent: 'center',
  } as ViewStyle,
  roamAvatarText: {
    fontFamily: FONTS.header,
    fontSize: 16,
    color: COLORS.bg,
  } as TextStyle,
  buildingInChat: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: SPACING.sm,
    marginTop: SPACING.lg,
    paddingVertical: SPACING.md,
  } as ViewStyle,
  buildingChatText: {
    fontFamily: FONTS.body,
    fontSize: 14,
    color: COLORS.creamDim,
  } as TextStyle,
  followUpIntro: {
    marginTop: SPACING.lg,
    marginBottom: SPACING.sm,
  } as ViewStyle,
  introText: {
    fontFamily: FONTS.header,
    fontSize: 20,
    color: COLORS.cream,
  } as TextStyle,
  followUpLoading: {
    marginTop: SPACING.md,
    alignItems: 'flex-start',
    paddingLeft: SPACING.sm,
  } as ViewStyle,
  errorBanner: {
    padding: SPACING.md,
    backgroundColor: COLORS.coralSubtle,
    borderLeftWidth: 4,
    borderLeftColor: COLORS.coral,
  } as ViewStyle,
  errorText: {
    fontFamily: FONTS.body,
    fontSize: 14,
    color: COLORS.cream,
  } as TextStyle,
  inputRow: {
    flexDirection: 'row',
    alignItems: 'flex-end',
    paddingHorizontal: SPACING.lg,
    paddingVertical: SPACING.md,
    borderTopWidth: 1,
    borderTopColor: COLORS.border,
    backgroundColor: COLORS.bg,
    gap: SPACING.sm,
  } as ViewStyle,
  input: {
    flex: 1,
    fontFamily: FONTS.body,
    fontSize: 16,
    color: COLORS.cream,
    backgroundColor: COLORS.bgCard,
    borderRadius: RADIUS.lg,
    borderWidth: 1,
    borderColor: COLORS.whiteFaintBorder,
    paddingHorizontal: SPACING.lg,
    paddingVertical: SPACING.md,
    minHeight: 48,
    maxHeight: 120,
  } as TextStyle,
  inputCraft: {
    flex: 1,
    fontFamily: FONTS.body,
    fontSize: 16,
    color: COLORS.cream,
    backgroundColor: COLORS.bgCard,
    borderRadius: RADIUS.lg,
    borderWidth: 1,
    borderColor: COLORS.whiteFaintBorder,
    paddingHorizontal: SPACING.lg,
    paddingVertical: SPACING.md,
    minHeight: 48,
    maxHeight: 120,
  } as TextStyle,
  sendBtn: {
    width: 48,
    height: 48,
    borderRadius: RADIUS.lg,
    backgroundColor: COLORS.gold,
    alignItems: 'center',
    justifyContent: 'center',
  } as ViewStyle,
  sendBtnSage: {
    width: 48,
    height: 48,
    borderRadius: RADIUS.lg,
    backgroundColor: COLORS.sage,
    alignItems: 'center',
    justifyContent: 'center',
  } as ViewStyle,
  sendBtnSagePulse: {
    shadowColor: COLORS.sage,
    shadowOffset: { width: 0, height: 0 },
    shadowOpacity: 0.5,
    shadowRadius: 8,
    elevation: 4,
  } as ViewStyle,
  welcomeBack: {
    marginBottom: SPACING.lg,
    padding: SPACING.md,
    backgroundColor: COLORS.sageVeryFaint,
    borderRadius: RADIUS.lg,
    borderLeftWidth: 3,
    borderLeftColor: COLORS.sage,
  } as ViewStyle,
  welcomeBackText: {
    fontFamily: FONTS.body,
    fontSize: 14,
    color: COLORS.cream,
    lineHeight: 21,
  } as TextStyle,

  // --- Preview (right) ---
  previewScroll: {
    flex: 1,
  } as ViewStyle,
  previewContent: {
    paddingHorizontal: SPACING.lg,
    paddingVertical: SPACING.lg,
    paddingBottom: SPACING.xxxl,
  } as ViewStyle,
  emptyPreview: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
    paddingHorizontal: SPACING.xl,
  } as ViewStyle,
  emptyPreviewTitle: {
    fontFamily: FONTS.headerMedium,
    fontSize: 18,
    color: COLORS.creamDim,
    marginBottom: SPACING.sm,
  } as TextStyle,
  emptyPreviewSub: {
    fontFamily: FONTS.body,
    fontSize: 14,
    color: COLORS.creamFaint,
    textAlign: 'center',
    lineHeight: 21,
  } as TextStyle,

  // --- Skeleton ---
  skeletonContainer: {
    flex: 1,
    paddingHorizontal: SPACING.lg,
    paddingTop: SPACING.xl,
  } as ViewStyle,
  skeletonTitle: {
    fontFamily: FONTS.headerMedium,
    fontSize: 18,
    color: COLORS.creamDim,
    marginBottom: SPACING.lg,
  } as TextStyle,
  skeleton: {
    backgroundColor: COLORS.bgCard,
    borderRadius: RADIUS.sm,
  } as ViewStyle,
  skeletonDay: {
    marginTop: SPACING.lg,
    gap: SPACING.sm,
  } as ViewStyle,

  // --- Itinerary preview blocks ---
  prevDestination: {
    fontFamily: FONTS.header,
    fontSize: 28,
    color: COLORS.cream,
    letterSpacing: -0.5,
  } as TextStyle,
  prevTagline: {
    fontFamily: FONTS.body,
    fontSize: 14,
    color: COLORS.creamDim,
    marginTop: SPACING.xs,
  } as TextStyle,
  prevBudget: {
    fontFamily: FONTS.mono,
    fontSize: 13,
    color: COLORS.gold,
    marginTop: SPACING.sm,
    marginBottom: SPACING.lg,
  } as TextStyle,
  prevBudgetCard: {
    backgroundColor: COLORS.bgCard,
    borderRadius: RADIUS.lg,
    padding: SPACING.lg,
    marginBottom: SPACING.lg,
    borderWidth: 1,
    borderColor: COLORS.whiteFaintBorder,
  } as ViewStyle,
  prevSectionTitle: {
    fontFamily: FONTS.headerMedium,
    fontSize: 16,
    color: COLORS.cream,
    marginBottom: SPACING.sm,
  } as TextStyle,
  prevBudgetLine: {
    fontFamily: FONTS.mono,
    fontSize: 13,
    color: COLORS.creamMuted,
    marginTop: 2,
  } as TextStyle,

  // --- Day blocks ---
  dayBlock: {
    marginBottom: SPACING.lg,
    borderBottomWidth: 1,
    borderBottomColor: COLORS.border,
    paddingBottom: SPACING.lg,
  } as ViewStyle,
  dayHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: SPACING.sm,
    paddingVertical: SPACING.xs,
  } as ViewStyle,
  dayTheme: {
    fontFamily: FONTS.headerMedium,
    fontSize: 18,
    color: COLORS.gold,
  } as TextStyle,
  dayBody: {
    marginTop: SPACING.sm,
    paddingLeft: SPACING.lg,
  } as ViewStyle,
  slot: {
    marginBottom: SPACING.sm,
  } as ViewStyle,
  slotLabel: {
    fontFamily: FONTS.mono,
    fontSize: 11,
    color: COLORS.creamDim,
    letterSpacing: 0.5,
    marginBottom: 2,
  } as TextStyle,
  slotActivity: {
    fontFamily: FONTS.body,
    fontSize: 14,
    color: COLORS.cream,
    lineHeight: 20,
  } as TextStyle,
  slotLocation: {
    fontFamily: FONTS.body,
    fontSize: 12,
    color: COLORS.creamMuted,
    marginTop: 2,
  } as TextStyle,
  slotCost: {
    fontFamily: FONTS.mono,
    fontSize: 12,
    color: COLORS.gold,
    marginTop: 2,
  } as TextStyle,
  accRow: {
    marginTop: SPACING.md,
    paddingTop: SPACING.sm,
    borderTopWidth: 1,
    borderTopColor: COLORS.border,
  } as ViewStyle,
  accLabel: {
    fontFamily: FONTS.mono,
    fontSize: 10,
    color: COLORS.creamDim,
    letterSpacing: 0.5,
  } as TextStyle,
  accName: {
    fontFamily: FONTS.bodySemiBold,
    fontSize: 14,
    color: COLORS.cream,
    marginTop: 2,
  } as TextStyle,
  accPrice: {
    fontFamily: FONTS.mono,
    fontSize: 12,
    color: COLORS.creamMuted,
    marginTop: 2,
  } as TextStyle,
  dailyCost: {
    fontFamily: FONTS.mono,
    fontSize: 12,
    color: COLORS.sage,
    marginTop: SPACING.sm,
  } as TextStyle,
  proTipBlock: {
    marginTop: SPACING.lg,
    padding: SPACING.lg,
    backgroundColor: COLORS.sageVeryFaint,
    borderRadius: RADIUS.lg,
    borderLeftWidth: 3,
    borderLeftColor: COLORS.sage,
  } as ViewStyle,
  proTipLabel: {
    fontFamily: FONTS.mono,
    fontSize: 10,
    color: COLORS.sage,
    letterSpacing: 0.5,
    marginBottom: SPACING.xs,
  } as TextStyle,
  proTipText: {
    fontFamily: FONTS.body,
    fontSize: 14,
    color: COLORS.cream,
    lineHeight: 21,
  } as TextStyle,

  // --- Editable text ---
  editableInput: {
    borderWidth: 1,
    borderColor: COLORS.sageBorder,
    borderRadius: RADIUS.sm,
    paddingHorizontal: SPACING.sm,
    paddingVertical: 2,
    backgroundColor: COLORS.bgCard,
  } as TextStyle,
  editableHover: {
    borderRadius: RADIUS.sm,
    paddingHorizontal: 2,
  } as TextStyle,
});
