// =============================================================================
// ROAM — CRAFT mode: full-screen conversation → personalized itinerary
// =============================================================================
import React, { useCallback, useEffect, useRef, useState } from 'react';
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
  type TextStyle,
  type ViewStyle,
} from 'react-native';
import { useRouter, useLocalSearchParams } from 'expo-router';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import * as Haptics from '../lib/haptics';
import { ArrowLeft, Send } from 'lucide-react-native';
import { COLORS, FONTS, SPACING, RADIUS } from '../lib/constants';
import {
  getInitialCraftState,
  getCurrentQuestion,
  applyAnswer,
  hasAllRequiredForGeneration,
  buildCraftContextBlock,
  buildFullItinerarySummary,
  buildFollowUpMessages,
  type CraftState,
  type CraftPreferences,
} from '../lib/craft-engine';
import { CRAFT_BUILDING_MESSAGE, CRAFT_ITINERARY_INTRO, CRAFT_STEPS } from '../lib/craft-prompts';
import { generateCraftItineraryStreaming, callClaudeStreamingWithMessages, CRAFT_FOLLOW_UP_SYSTEM, TripLimitReachedError } from '../lib/claude';
import {
  updateProfileFromCraft,
  craftPreferencesToLearned,
  getCraftLearnedPreferences,
  getWelcomeBackMessage,
} from '../lib/craft-profile';
import { parseItinerary } from '../lib/types/itinerary';
import type { Itinerary } from '../lib/types/itinerary';
import CraftMessage from '../components/CraftMessage';
import CraftItinerary from '../components/CraftItinerary';
import { useAppStore } from '../lib/store';
import { supabase } from '../lib/supabase';
import { FREE_TRIPS_PER_MONTH } from '../lib/constants';
import { isGuestUser } from '../lib/guest';
import { captureEvent } from '../lib/posthog';
import { recordGrowthEvent } from '../lib/growth-hooks';
import { evaluateTrigger } from '../lib/smart-triggers';
import TripLimitBanner from '../components/monetization/TripLimitBanner';
import CraftSplitScreen from '../components/web/CraftSplitScreen';

export default function CraftSessionScreen() {
  const insets = useSafeAreaInsets();
  const router = useRouter();
  const params = useLocalSearchParams<{ sessionId?: string }>();
  const sessionId = typeof params.sessionId === 'string' ? params.sessionId : undefined;

  const [state, setState] = useState<CraftState>(getInitialCraftState());
  const [input, setInput] = useState('');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [parsedItinerary, setParsedItinerary] = useState<Itinerary | null>(null);
  const [welcomeBackMessage, setWelcomeBackMessage] = useState<string | null>(null);
  const [streamingText, setStreamingText] = useState('');
  const scrollRef = useRef<ScrollView>(null);
  const loadedSessionRef = useRef(false);

  const session = useAppStore((s) => s.session);
  const addTrip = useAppStore((s) => s.addTrip);
  const setTripsThisMonth = useAppStore((s) => s.setTripsThisMonth);
  const trips = useAppStore((s) => s.trips);
  const isPro = useAppStore((s) => s.isPro);
  const tripsThisMonth = useAppStore((s) => s.tripsThisMonth);

  const canGenerate = hasAllRequiredForGeneration(state);
  const isGathering = state.phase === 'gathering' && state.currentStepId !== null;
  const isBuilding = state.phase === 'gathering' && state.currentStepId === null && canGenerate;
  const isFollowUp = state.phase === 'follow_up' && parsedItinerary;

  // Load saved session by sessionId (resume)
  useEffect(() => {
    if (!sessionId || !session?.user?.id || loadedSessionRef.current) return;
    loadedSessionRef.current = true;
    (async () => {
      const { data: row } = await supabase
        .from('craft_sessions')
        .select('conversation, preferences_captured, generated_itinerary, destination')
        .eq('id', sessionId)
        .eq('user_id', session.user.id)
        .single();
      if (!row) return;
      const conv = (row.conversation as Array<{ role: string; content: string }>) ?? [];
      const prefs = (row.preferences_captured as CraftPreferences) ?? {};
      const genJson = row.generated_itinerary as string | null;
      let phase: CraftState['phase'] = 'gathering';
      let currentStepId: CraftState['currentStepId'] =
        conv.length < CRAFT_STEPS.length ? (CRAFT_STEPS[conv.length]?.id ?? null) : null;
      if (conv.length >= CRAFT_STEPS.length && !genJson) {
        currentStepId = null;
        phase = 'gathering';
      }
      if (genJson) {
        phase = 'follow_up';
        currentStepId = null;
        try {
          const it = parseItinerary(typeof genJson === 'string' ? genJson : JSON.stringify(genJson));
          setParsedItinerary(it);
        } catch {
          // ignore parse error
        }
      }
      setState({
        messages: conv.map((m) => ({ role: m.role as 'user' | 'assistant', content: m.content })),
        currentStepId,
        preferences: prefs,
        phase,
        generatedItineraryJson: genJson,
        followUpMessages: [],
        sessionId,
      });
    })();
  }, [sessionId, session?.user?.id]);

  // Welcome-back: load learned preferences when starting fresh (no sessionId)
  useEffect(() => {
    if (sessionId || !session?.user?.id || welcomeBackMessage !== null) return;
    getCraftLearnedPreferences(session.user.id).then((learned) => {
      const msg = getWelcomeBackMessage(learned);
      setWelcomeBackMessage(msg);
    }).catch(() => {});
  }, [sessionId, session?.user?.id, welcomeBackMessage]);

  // Start building when we have all steps answered and no current step (once)
  const hasStartedBuild = useRef(false);
  useEffect(() => {
    if (!isBuilding || loading || hasStartedBuild.current) return;
    hasStartedBuild.current = true;
    setLoading(true);
    setError(null);
    const contextBlock = buildCraftContextBlock(state);
    generateCraftItineraryStreaming(contextBlock, {
      onChunk: () => {},
      onDone: (fullText, tripsUsed, limit) => {
        setLoading(false);
        try {
          const itinerary = parseItinerary(fullText);
          setParsedItinerary(itinerary);
          setState((s) => ({
            ...s,
            phase: 'follow_up',
            generatedItineraryJson: fullText,
          }));
          setTripsThisMonth(tripsUsed);
          recordGrowthEvent('trip_generated').catch(() => {});
          evaluateTrigger('post_generation').catch(() => {});
          captureEvent('trip_generation_completed', {
            destination: itinerary.destination,
            days: itinerary.days?.length ?? 0,
            mode: 'craft',
          });
          if (session?.user?.id && fullText) {
            const learned = craftPreferencesToLearned(state.preferences);
            void (async () => {
              try {
                await supabase.from('craft_sessions').insert({
                  user_id: session.user.id,
                  destination: itinerary.destination,
                  conversation: state.messages,
                  generated_itinerary: JSON.parse(fullText),
                  preferences_captured: state.preferences,
                });
                if (Object.keys(learned).length > 0) {
                  await updateProfileFromCraft(session.user.id, learned);
                }
              } catch {
                // ignore persistence failure
              }
            })();
          }
        } catch (parseErr) {
          setError(parseErr instanceof Error ? parseErr.message : 'Failed to parse itinerary');
        }
      },
      onError: (err) => {
        setLoading(false);
        if (err instanceof TripLimitReachedError) {
          router.push({
            pathname: '/paywall',
            params: { reason: 'limit', destination: state.preferences.destination ?? '' },
          });
        } else {
          setError(err instanceof Error ? err.message : 'Something went wrong');
        }
      },
    });
  }, [isBuilding]);

  /** Extract itinerary JSON from <itinerary_json>...</itinerary_json> tags if present */
  const extractItineraryUpdate = useCallback((text: string): { displayText: string; itinerary: Itinerary | null } => {
    const tagStart = '<itinerary_json>';
    const tagEnd = '</itinerary_json>';
    const startIdx = text.indexOf(tagStart);
    const endIdx = text.indexOf(tagEnd);
    if (startIdx === -1 || endIdx === -1 || endIdx <= startIdx) {
      return { displayText: text.trim(), itinerary: null };
    }
    const jsonStr = text.slice(startIdx + tagStart.length, endIdx).trim();
    const displayText = (text.slice(0, startIdx) + text.slice(endIdx + tagEnd.length)).trim();
    try {
      const itinerary = parseItinerary(jsonStr);
      return { displayText, itinerary };
    } catch {
      return { displayText, itinerary: null };
    }
  }, []);

  const handleSubmit = useCallback(() => {
    const text = input.trim();
    if (!text && isGathering) return;
    if (!text && isFollowUp) return;
    Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
    if (isGathering && state.currentStepId) {
      const next = applyAnswer(state, state.currentStepId, text);
      setState(next);
      setInput('');
    } else if (isFollowUp && parsedItinerary) {
      setInput('');
      setError(null);
      setLoading(true);
      setStreamingText('');
      // Add user message to state immediately so it renders in the conversation
      setState((s) => ({
        ...s,
        followUpMessages: [
          ...s.followUpMessages,
          { role: 'user', content: text },
        ],
      }));
      const itinerarySummary = buildFullItinerarySummary(parsedItinerary);
      const messages = buildFollowUpMessages(state, itinerarySummary, text);
      callClaudeStreamingWithMessages(CRAFT_FOLLOW_UP_SYSTEM, messages, {
        onChunk: (accumulated) => {
          setStreamingText(accumulated);
        },
        onDone: (fullText) => {
          setLoading(false);
          setStreamingText('');
          const { displayText, itinerary: updatedItinerary } = extractItineraryUpdate(fullText);
          if (updatedItinerary) {
            setParsedItinerary(updatedItinerary);
            setState((s) => ({
              ...s,
              generatedItineraryJson: JSON.stringify(updatedItinerary),
              followUpMessages: [
                ...s.followUpMessages,
                { role: 'assistant', content: displayText || 'Itinerary updated.' },
              ],
            }));
          } else {
            setState((s) => ({
              ...s,
              followUpMessages: [
                ...s.followUpMessages,
                { role: 'assistant', content: displayText },
              ],
            }));
          }
        },
        onError: (err) => {
          setLoading(false);
          setStreamingText('');
          if (err instanceof TripLimitReachedError) {
            router.push({
              pathname: '/paywall',
              params: { reason: 'limit', destination: state.preferences.destination ?? '' },
            });
          } else {
            setError(err instanceof Error ? err.message : 'Something went wrong');
          }
        },
      });
    }
  }, [input, isGathering, isFollowUp, state, parsedItinerary, extractItineraryUpdate, router]);

  const handleBack = useCallback(() => {
    Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
    router.back();
  }, [router]);

  const handleSaveTrip = useCallback(() => {
    if (!parsedItinerary) return;
    Haptics.notificationAsync(Haptics.NotificationFeedbackType.Success);
    const dest = state.preferences.destination ?? parsedItinerary.destination;
    const days = parsedItinerary.days?.length ?? 0;
    const trip = {
      id: `craft-${Date.now()}`,
      destination: dest,
      days,
      budget: state.preferences.budget ?? 'comfort',
      vibes: state.preferences.whatMatters ? [state.preferences.whatMatters] : [],
      itinerary: JSON.stringify(parsedItinerary),
      createdAt: new Date().toISOString(),
    };
    addTrip(trip);
    router.replace({ pathname: '/itinerary', params: { tripId: trip.id } });
  }, [parsedItinerary, state.preferences, addTrip, router]);

  const question = getCurrentQuestion(state);

  // Paywall: redirect if over limit before we consume a generation
  const overLimit = !isPro && !isGuestUser() && tripsThisMonth >= FREE_TRIPS_PER_MONTH;
  const guestOverLimit = isGuestUser() && trips.length >= 1;
  if (overLimit && isBuilding) {
    router.replace({
      pathname: '/paywall',
      params: { reason: 'limit', destination: state.preferences.destination ?? '' },
    });
    return null;
  }
  if (guestOverLimit && isBuilding) {
    router.replace({
      pathname: '/paywall',
      params: { reason: 'limit', destination: state.preferences.destination ?? '' },
    });
    return null;
  }

  // Web: render split-screen experience
  if (Platform.OS === 'web') {
    return (
      <CraftSplitScreen
        state={state}
        input={input}
        loading={loading}
        error={error}
        parsedItinerary={parsedItinerary}
        streamingText={streamingText}
        welcomeBackMessage={welcomeBackMessage}
        question={question}
        isGathering={isGathering}
        isBuilding={isBuilding}
        isFollowUp={!!isFollowUp}
        onInputChange={setInput}
        onSubmit={handleSubmit}
        onBack={handleBack}
        onSaveTrip={handleSaveTrip}
      />
    );
  }

  return (
    <View style={[styles.container, { paddingTop: insets.top }]}>
      <TripLimitBanner />
      <View style={styles.header}>
        <Pressable onPress={handleBack} style={styles.backBtn} accessibilityLabel="Back" accessibilityRole="button">
          <ArrowLeft size={22} color={COLORS.cream} strokeWidth={1.5} />
        </Pressable>
        <Text style={styles.headerTitle}>Plan together</Text>
      </View>

      {isFollowUp && parsedItinerary ? (
        <KeyboardAvoidingView
          style={styles.flex}
          behavior={Platform.OS === 'ios' ? 'padding' : undefined}
          keyboardVerticalOffset={insets.top + 56}
        >
          <ScrollView
            ref={scrollRef}
            style={styles.scroll}
            contentContainerStyle={styles.scrollContent}
            keyboardShouldPersistTaps="handled"
            showsVerticalScrollIndicator={false}
            onContentSizeChange={() => scrollRef.current?.scrollToEnd({ animated: true })}
          >
            <Text style={styles.introText}>{CRAFT_ITINERARY_INTRO(parsedItinerary.destination)}</Text>
            <CraftItinerary itinerary={parsedItinerary} />
            {state.followUpMessages.length > 0 ? (
              <View style={styles.followUpBlock}>
                {state.followUpMessages.map((msg, i) => (
                  <CraftMessage key={i} role={msg.role} content={msg.content} />
                ))}
              </View>
            ) : null}
            {streamingText ? (
              <View style={styles.followUpBlock}>
                <CraftMessage role="assistant" content={
                  streamingText.includes('<itinerary_json>')
                    ? streamingText.slice(0, streamingText.indexOf('<itinerary_json>')).trim()
                    : streamingText
                } />
              </View>
            ) : null}
            {loading && !streamingText ? (
              <View style={styles.followUpLoading}>
                <ActivityIndicator size="small" color={COLORS.gold} />
              </View>
            ) : null}
          </ScrollView>
          <View style={styles.followUpFooter}>
            <Pressable
              onPress={handleSaveTrip}
              style={({ pressed }) => [styles.saveChip, { opacity: pressed ? 0.9 : 1 }]}
              accessibilityLabel="Save trip"
              accessibilityRole="button"
            >
              <Text style={styles.saveChipText}>Save trip</Text>
            </Pressable>
          </View>
          {error ? (
            <View style={styles.errorBanner}>
              <Text style={styles.errorText}>{error}</Text>
            </View>
          ) : null}
          <View style={styles.inputRow}>
            <TextInput
              style={styles.input}
              placeholder="Ask anything about your trip — changes, more details, alternatives..."
              placeholderTextColor={COLORS.creamDim}
              value={input}
              onChangeText={setInput}
              onSubmitEditing={handleSubmit}
              editable={!loading}
              multiline
              maxLength={2000}
            />
            <Pressable
              onPress={handleSubmit}
              style={({ pressed }) => [styles.sendBtn, { opacity: pressed ? 0.8 : 1 }]}
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
        </KeyboardAvoidingView>
      ) : isBuilding || loading ? (
        <View style={styles.center}>
          <ActivityIndicator size="large" color={COLORS.gold} />
          <Text style={styles.buildingText}>{CRAFT_BUILDING_MESSAGE}</Text>
        </View>
      ) : (
        <KeyboardAvoidingView
          style={styles.flex}
          behavior={Platform.OS === 'ios' ? 'padding' : undefined}
          keyboardVerticalOffset={insets.top + 56}
        >
          <ScrollView
            ref={scrollRef}
            style={styles.scroll}
            contentContainerStyle={styles.scrollContent}
            keyboardShouldPersistTaps="handled"
            showsVerticalScrollIndicator={false}
          >
            {welcomeBackMessage ? (
              <View style={styles.welcomeBackBlock}>
                <Text style={styles.welcomeBackText}>{welcomeBackMessage}</Text>
              </View>
            ) : null}
            {state.messages.length > 0 ? (
              state.messages.map((msg, i) => (
                <CraftMessage key={i} role={msg.role} content={msg.content} />
              ))
            ) : null}
            <View style={styles.questionBlock}>
              <Text style={styles.questionText}>{question}</Text>
            </View>
          </ScrollView>
          {error ? (
            <View style={styles.errorBanner}>
              <Text style={styles.errorText}>{error}</Text>
            </View>
          ) : null}
          <View style={styles.inputRow}>
            <TextInput
              style={styles.input}
              placeholder="Your answer..."
              placeholderTextColor={COLORS.creamDim}
              value={input}
              onChangeText={setInput}
              onSubmitEditing={handleSubmit}
              editable={!loading}
              multiline
              maxLength={2000}
            />
            <Pressable
              onPress={handleSubmit}
              style={({ pressed }) => [styles.sendBtn, { opacity: pressed ? 0.8 : 1 }]}
              accessibilityLabel="Send"
              accessibilityRole="button"
            >
              <Send size={20} color={COLORS.bg} strokeWidth={1.5} />
            </Pressable>
          </View>
        </KeyboardAvoidingView>
      )}
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: COLORS.bg,
  } as ViewStyle,
  flex: { flex: 1 } as ViewStyle,
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
  } as TextStyle,
  scroll: { flex: 1 } as ViewStyle,
  scrollContent: {
    paddingHorizontal: SPACING.lg,
    paddingBottom: SPACING.xxl,
  } as ViewStyle,
  questionBlock: {
    marginTop: SPACING.xxl,
    marginBottom: SPACING.lg,
  } as ViewStyle,
  questionText: {
    fontFamily: FONTS.header,
    fontSize: 26,
    color: COLORS.cream,
    lineHeight: 34,
    textAlign: 'center',
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
  sendBtn: {
    width: 48,
    height: 48,
    borderRadius: RADIUS.lg,
    backgroundColor: COLORS.gold,
    alignItems: 'center',
    justifyContent: 'center',
  } as ViewStyle,
  buildingText: {
    fontFamily: FONTS.body,
    fontSize: 16,
    color: COLORS.creamDim,
    marginTop: SPACING.lg,
    textAlign: 'center',
  } as TextStyle,
  center: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
    paddingHorizontal: SPACING.xl,
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
  introText: {
    fontFamily: FONTS.header,
    fontSize: 24,
    color: COLORS.cream,
    marginBottom: SPACING.lg,
  } as TextStyle,
  followUpBlock: {
    marginTop: SPACING.lg,
    gap: SPACING.sm,
  } as ViewStyle,
  followUpLoading: {
    marginTop: SPACING.md,
    alignItems: 'flex-start',
    paddingLeft: SPACING.sm,
  } as ViewStyle,
  followUpFooter: {
    paddingHorizontal: SPACING.lg,
    paddingVertical: SPACING.xs,
    alignItems: 'flex-end',
  } as ViewStyle,
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
  welcomeBackBlock: {
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
});
