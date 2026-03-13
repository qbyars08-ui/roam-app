// =============================================================================
// ROAM — Live Travel Companion floating button
// Persistent when trip is active; opens AI assistant that knows full itinerary
// =============================================================================
import React, { useState } from 'react';
import {
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
import { MessageCircle, X } from 'lucide-react-native';

import { COLORS, FONTS, SPACING, RADIUS } from '../../lib/constants';
import { useAppStore } from '../../lib/store';
import { getPrepSection } from '../../lib/prep/storage';

export default function LiveCompanionFAB() {
  const insets = useSafeAreaInsets();
  const activeTripId = useAppStore((s) => s.activeTripId);
  const trips = useAppStore((s) => s.trips);
  const [visible, setVisible] = useState(false);
  const [input, setInput] = useState('');
  const [response, setResponse] = useState<string | null>(null);

  const activeTrip =
    trips.find((t) => t.id === activeTripId) ?? trips[0] ?? null;
  if (!activeTrip) return null;

  const handleOpen = () => {
    Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
    setVisible(true);
    setResponse(null);
  };

  const handleAsk = async () => {
    const q = input.trim();
    if (!q) return;

    // Emergency mode
    if (q.toUpperCase().includes('HELP')) {
      const data = await getPrepSection(activeTrip.id, 'emergency');
      const parsed = data ? JSON.parse(data) : {};
      const nums = parsed.emergency ?? [];
      setResponse(
        `EMERGENCY\n\n${nums.map((e: { label: string; number: string }) => `${e.label}: ${e.number}`).join('\n')}\n\nNearest hospitals are pinned on your offline map.`
      );
      return;
    }

    // Try cached AI companion
    const cached = await getPrepSection(activeTrip.id, 'ai_companion');
    if (cached) {
      const { qa } = JSON.parse(cached);
      const lower = q.toLowerCase();
      const match = qa.find(
        (item: { q: string }) =>
          item.q.toLowerCase().includes(lower) || lower.includes(item.q.toLowerCase().split(' ')[0])
      );
      if (match) {
        setResponse(match.a);
        return;
      }
    }

    setResponse("I'm your offline travel companion. For real-time answers, connect to wifi and use the Ask tab. Offline: try 'Where is the nearest hospital?' or 'HELP' for emergency numbers.");
  };

  return (
    <>
      <Pressable
        onPress={handleOpen}
        style={({ pressed }) => [
          styles.fab,
          {
            bottom: (insets.bottom || 24) + 100,
            opacity: pressed ? 0.9 : 1,
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
        onRequestClose={() => setVisible(false)}
      >
        <KeyboardAvoidingView
          style={styles.modalOverlay}
          behavior={Platform.OS === 'ios' ? 'padding' : undefined}
        >
          <View style={[styles.modalContent, { paddingTop: insets.top + SPACING.md }]}>
            <View style={styles.modalHeader}>
              <Text style={styles.modalTitle}>Travel Companion</Text>
              <Text style={styles.modalSubtitle}>
                {activeTrip.destination} · {activeTrip.days} days
              </Text>
              <Pressable
                onPress={() => setVisible(false)}
                hitSlop={12}
                style={styles.closeBtn}
              >
                <X size={20} color={COLORS.cream} strokeWidth={2} />
              </Pressable>
            </View>

            <ScrollView
              style={styles.chatArea}
              contentContainerStyle={styles.chatContent}
              keyboardShouldPersistTaps="handled"
            >
              {!response ? (
                <Text style={styles.hint}>
                  Ask anything about your trip. Try: "Where's the nearest ATM?" or "HELP" for emergency numbers.
                </Text>
              ) : (
                <View style={styles.bubble}>
                  <Text style={styles.bubbleText}>{response}</Text>
                </View>
              )}
            </ScrollView>

            <View style={[styles.inputRow, { paddingBottom: insets.bottom + SPACING.sm }]}>
              <TextInput
                style={styles.input}
                value={input}
                onChangeText={setInput}
                placeholder="Ask about your trip..."
                placeholderTextColor={`${COLORS.cream}44`}
                onSubmitEditing={handleAsk}
                returnKeyType="send"
              />
              <Pressable
                onPress={handleAsk}
                style={({ pressed }) => [styles.sendBtn, { opacity: pressed ? 0.8 : 1 }]}
              >
                <Text style={styles.sendBtnText}>Ask</Text>
              </Pressable>
            </View>
          </View>
        </KeyboardAvoidingView>
      </Modal>
    </>
  );
}

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
  } as ViewStyle,
  fabInner: {},
  modalOverlay: {
    flex: 1,
    backgroundColor: 'rgba(0,0,0,0.5)',
    justifyContent: 'flex-end',
  } as ViewStyle,
  modalContent: {
    backgroundColor: COLORS.bg,
    borderTopLeftRadius: RADIUS.xl,
    borderTopRightRadius: RADIUS.xl,
    maxHeight: '85%',
  } as ViewStyle,
  modalHeader: {
    paddingHorizontal: SPACING.lg,
    paddingBottom: SPACING.sm,
  } as ViewStyle,
  modalTitle: {
    fontFamily: FONTS.header,
    fontSize: 24,
    color: COLORS.cream,
  } as TextStyle,
  modalSubtitle: {
    fontFamily: FONTS.mono,
    fontSize: 12,
    color: COLORS.sage,
    marginTop: 2,
  } as TextStyle,
  closeBtn: {
    position: 'absolute',
    top: -4,
    right: 0,
    padding: 8,
  } as ViewStyle,
  closeBtnText: {
    fontSize: 18,
    color: COLORS.creamMuted,
  } as TextStyle,
  chatArea: {
    flex: 1,
    minHeight: 120,
  } as ViewStyle,
  chatContent: {
    paddingHorizontal: SPACING.lg,
    paddingVertical: SPACING.md,
  } as ViewStyle,
  hint: {
    fontFamily: FONTS.body,
    fontSize: 14,
    color: COLORS.creamMuted,
    fontStyle: 'italic',
  } as TextStyle,
  bubble: {
    backgroundColor: COLORS.bgCard,
    borderRadius: RADIUS.lg,
    padding: SPACING.md,
    borderWidth: 1,
    borderColor: COLORS.border,
  } as ViewStyle,
  bubbleText: {
    fontFamily: FONTS.body,
    fontSize: 15,
    color: COLORS.cream,
    lineHeight: 22,
  } as TextStyle,
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
    borderRadius: RADIUS.lg,
    borderWidth: 1,
    borderColor: COLORS.border,
    backgroundColor: COLORS.bgCard,
    paddingHorizontal: SPACING.md,
    fontFamily: FONTS.body,
    fontSize: 15,
    color: COLORS.cream,
  } as TextStyle,
  sendBtn: {
    height: 48,
    paddingHorizontal: SPACING.lg,
    borderRadius: RADIUS.lg,
    backgroundColor: COLORS.sage,
    alignItems: 'center',
    justifyContent: 'center',
  } as ViewStyle,
  sendBtnText: {
    fontFamily: FONTS.bodySemiBold,
    fontSize: 15,
    color: COLORS.bg,
  } as TextStyle,
});
