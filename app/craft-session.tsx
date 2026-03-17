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
import { useRouter } from 'expo-router';
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
  type CraftState,
} from '../lib/craft-engine';
import { CRAFT_BUILDING_MESSAGE, CRAFT_ITINERARY_INTRO, CRAFT_FOLLOW_UP_PROMPT } from '../lib/craft-prompts';
import { generateCraftItineraryStreaming, TripLimitReachedError } from '../lib/claude';
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

export default function CraftSessionScreen() {
  const insets = useSafeAreaInsets();
  const router = useRouter();
  const [state, setState] = useState<CraftState>(getInitialCraftState);
  const [input, setInput] = useState('');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [parsedItinerary, setParsedItinerary] = useState<Itinerary | null>(null);
  const scrollRef = useRef<ScrollView>(null);

  const session = useAppStore((s) => s.session);
  const addTrip = useAppStore((s) => s.addTrip);
  const setTripsThisMonth = useAppStore((s) => s.setTripsThisMonth);
  const trips = useAppStore((s) => s.trips);
  const isPro = useAppStore((s) => s.isPro);
  const tripsThisMonth = useAppStore((s) => s.tripsThisMonth);

  const canGenerate = hasAllRequiredForGeneration(state);
  const isGathering = state.phase === 'gathering' && state.currentStepId !== null;
  const isBuilding = state.phase === 'gathering' && state.currentStepId === null && canGenerate;
  const isDone = state.phase === 'done' && parsedItinerary;
  const isFollowUp = state.phase === 'follow_up';

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
            phase: 'done',
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
            void (async () => {
              try {
                await supabase.from('craft_sessions').insert({
                  user_id: session.user.id,
                  destination: itinerary.destination,
                  conversation: state.messages,
                  generated_itinerary: JSON.parse(fullText),
                  preferences_captured: state.preferences,
                });
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

  const handleSubmit = useCallback(() => {
    const text = input.trim();
    if (!text && isGathering) return;
    Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
    if (isGathering && state.currentStepId) {
      const next = applyAnswer(state, state.currentStepId, text);
      setState(next);
      setInput('');
    } else if (isFollowUp) {
      setInput('');
      // TODO: send follow-up to Claude and append response (callClaudeWithMessages)
    }
  }, [input, isGathering, isFollowUp, state]);

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

  const handleStartFollowUp = useCallback(() => {
    setState((s) => ({ ...s, phase: 'follow_up' }));
  }, []);

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

  return (
    <View style={[styles.container, { paddingTop: insets.top }]}>
      <TripLimitBanner />
      <View style={styles.header}>
        <Pressable onPress={handleBack} style={styles.backBtn} accessibilityLabel="Back" accessibilityRole="button">
          <ArrowLeft size={22} color={COLORS.cream} strokeWidth={1.5} />
        </Pressable>
        <Text style={styles.headerTitle}>Plan together</Text>
      </View>

      {isDone && parsedItinerary ? (
        <ScrollView
          ref={scrollRef}
          style={styles.scroll}
          contentContainerStyle={styles.scrollContent}
          showsVerticalScrollIndicator={false}
        >
          <Text style={styles.introText}>{CRAFT_ITINERARY_INTRO(parsedItinerary.destination)}</Text>
          <CraftItinerary itinerary={parsedItinerary} />
          <View style={styles.actions}>
            <Pressable
              onPress={handleSaveTrip}
              style={({ pressed }) => [styles.primaryBtn, { opacity: pressed ? 0.9 : 1 }]}
              accessibilityLabel="Save trip and view full itinerary"
              accessibilityRole="button"
            >
              <Text style={styles.primaryBtnText}>Save trip</Text>
            </Pressable>
            <Pressable
              onPress={handleStartFollowUp}
              style={({ pressed }) => [styles.secondaryBtn, { opacity: pressed ? 0.9 : 1 }]}
              accessibilityLabel="Tell ROAM what you would change"
              accessibilityRole="button"
            >
              <Text style={styles.secondaryBtnText}>{CRAFT_FOLLOW_UP_PROMPT}</Text>
            </Pressable>
          </View>
        </ScrollView>
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
  actions: {
    marginTop: SPACING.xl,
    gap: SPACING.md,
  } as ViewStyle,
  primaryBtn: {
    backgroundColor: COLORS.gold,
    borderRadius: RADIUS.pill,
    paddingVertical: SPACING.md,
    alignItems: 'center',
  } as ViewStyle,
  primaryBtnText: {
    fontFamily: FONTS.bodySemiBold,
    fontSize: 16,
    color: COLORS.bg,
  } as TextStyle,
  secondaryBtn: {
    borderWidth: 1,
    borderColor: COLORS.goldBorder,
    borderRadius: RADIUS.pill,
    paddingVertical: SPACING.md,
    alignItems: 'center',
  } as ViewStyle,
  secondaryBtnText: {
    fontFamily: FONTS.body,
    fontSize: 14,
    color: COLORS.gold,
    textAlign: 'center',
  } as TextStyle,
});
