// =============================================================================
// ROAM — PREP detail views (Language kit, Emergency, Cultural, etc.)
// =============================================================================
import React, { useEffect, useState } from 'react';
import {
  View,
  Text,
  ScrollView,
  Pressable,
  StyleSheet,
  Modal,
  type ViewStyle,
  type TextStyle,
} from 'react-native';
import { useLocalSearchParams, useRouter } from 'expo-router';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import * as Haptics from '../lib/haptics';

import { AlertTriangle, X } from 'lucide-react-native';
import { COLORS, FONTS, SPACING, RADIUS } from '../lib/constants';
import { useAppStore } from '../lib/store';
import { getPrepSection } from '../lib/prep/storage';
import type { PrepSectionId } from '../lib/prep/types';

type Params = { sectionId: PrepSectionId; tripId: string };

export default function PrepDetailScreen() {
  const insets = useSafeAreaInsets();
  const router = useRouter();
  const params = useLocalSearchParams<Params>();
  const trips = useAppStore((s) => s.trips);

  const [content, setContent] = useState<Record<string, unknown> | null>(null);
  const [phraseModal, setPhraseModal] = useState<{ english: string; local: string; phonetic: string } | null>(null);

  const trip = trips.find((t) => t.id === params.tripId);

  useEffect(() => {
    if (!params.tripId || !params.sectionId) return;
    getPrepSection(params.tripId, params.sectionId).then((raw) => {
      if (raw) setContent(JSON.parse(raw));
    });
  }, [params.tripId, params.sectionId]);

  if (!trip) return null;

  const handleClose = () => router.back();

  if (params.sectionId === 'language_kit' && content) {
    const phrases = (content.phrases as Array<{ english: string; local: string; phonetic: string }>) ?? [];
    return (
      <Modal visible animationType="slide" onRequestClose={handleClose}>
        <View style={[styles.screen, { paddingTop: insets.top }]}>
          <View style={styles.header}>
            <Text style={styles.title}>Language Survival Kit</Text>
            <Pressable onPress={handleClose} hitSlop={12}>
              <X size={20} color={COLORS.cream} strokeWidth={2} />
            </Pressable>
          </View>
          <ScrollView
            style={styles.scroll}
            contentContainerStyle={styles.scrollContent}
            showsVerticalScrollIndicator={false}
          >
            <Text style={styles.hint}>Tap any phrase to show locals</Text>
            {phrases.map((p, i) => (
              <Pressable
                key={i}
                onPress={() => {
                  Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
                  setPhraseModal(p);
                }}
                style={({ pressed }) => [styles.phraseCard, { opacity: pressed ? 0.9 : 1 }]}
              >
                <Text style={styles.phraseEnglish}>{p.english}</Text>
                <Text style={styles.phraseLocal}>{p.local}</Text>
                <Text style={styles.phrasePhonetic}>{p.phonetic}</Text>
              </Pressable>
            ))}
          </ScrollView>

          {phraseModal && (
            <Modal visible animationType="fade" transparent>
              <Pressable style={styles.fullScreenOverlay} onPress={() => setPhraseModal(null)}>
                <View style={styles.fullScreenContent}>
                  <Text style={styles.fullScreenLocal}>{phraseModal.local}</Text>
                  <Text style={styles.fullScreenPhonetic}>{phraseModal.phonetic}</Text>
                  <Text style={styles.fullScreenEnglish}>{phraseModal.english}</Text>
                  <Text style={styles.fullScreenHint}>Show this to a local</Text>
                </View>
              </Pressable>
            </Modal>
          )}
        </View>
      </Modal>
    );
  }

  if (params.sectionId === 'emergency' && content) {
    const emergency = (content.emergency as Array<{ label: string; number: string }>) ?? [];
    return (
      <Modal visible animationType="slide" onRequestClose={handleClose}>
        <View style={[styles.screen, { paddingTop: insets.top }]}>
          <View style={styles.header}>
            <Text style={styles.title}>Emergency Toolkit</Text>
            <Pressable onPress={handleClose} hitSlop={12}>
              <X size={20} color={COLORS.cream} strokeWidth={2} />
            </Pressable>
          </View>
          <ScrollView style={styles.scroll} contentContainerStyle={styles.scrollContent}>
            <Text style={styles.sectionLabel}>Emergency Numbers</Text>
            {emergency.map((e, i) => (
              <View key={i} style={styles.emergencyRow}>
                <Text style={styles.emergencyLabel}>{e.label}</Text>
                <Text style={styles.emergencyNumber}>{e.number}</Text>
              </View>
            ))}
            <Text style={styles.sectionLabel}>Embassy</Text>
            <Text style={styles.emergencyText}>{(content as { embassy?: string }).embassy}</Text>
            <Text style={styles.sectionLabel}>ATMs</Text>
            <Text style={styles.emergencyText}>{(content as { atms?: string }).atms}</Text>
          </ScrollView>
        </View>
      </Modal>
    );
  }

  if (params.sectionId === 'cultural' && content) {
    const c = content as { etiquette?: string; scams?: string; simCards?: string; currency?: string };
    return (
      <Modal visible animationType="slide" onRequestClose={handleClose}>
        <View style={[styles.screen, { paddingTop: insets.top }]}>
          <View style={styles.header}>
            <Text style={styles.title}>Cultural Guide</Text>
            <Pressable onPress={handleClose} hitSlop={12}>
              <X size={20} color={COLORS.cream} strokeWidth={2} />
            </Pressable>
          </View>
          <ScrollView style={styles.scroll} contentContainerStyle={styles.scrollContent}>
            <Text style={styles.sectionLabel}>Etiquette</Text>
            <Text style={styles.culturalText}>{c.etiquette}</Text>
            <Text style={styles.sectionLabel}>Scam Alerts</Text>
            <Text style={styles.culturalText}>{c.scams}</Text>
            <Text style={styles.sectionLabel}>Local SIM</Text>
            <Text style={styles.culturalText}>{c.simCards}</Text>
            <Text style={styles.sectionLabel}>Currency</Text>
            <Text style={styles.culturalText}>{c.currency}</Text>
          </ScrollView>
        </View>
      </Modal>
    );
  }

  if (params.sectionId === 'packing' && content) {
    const items = (content.items as Array<{ name: string; packed: boolean }>) ?? [];
    const alerts = (content.alerts as string[]) ?? [];
    return (
      <Modal visible animationType="slide" onRequestClose={handleClose}>
        <View style={[styles.screen, { paddingTop: insets.top }]}>
          <View style={styles.header}>
            <Text style={styles.title}>Smart Packing List</Text>
            <Pressable onPress={handleClose} hitSlop={12}>
              <X size={20} color={COLORS.cream} strokeWidth={2} />
            </Pressable>
          </View>
          <ScrollView style={styles.scroll} contentContainerStyle={styles.scrollContent}>
            {alerts.length > 0 && (
              <>
                <Text style={styles.sectionLabel}>Don't forget</Text>
                {alerts.map((a, i) => (
                  <View key={i} style={styles.alertRow}>
                    <View style={styles.alertIconWrap}>
                      <AlertTriangle size={16} color={COLORS.gold} strokeWidth={1.5} />
                    </View>
                    <Text style={styles.alertText}>{a}</Text>
                  </View>
                ))}
              </>
            )}
            <Text style={styles.sectionLabel}>Items</Text>
            {items.map((item, i) => (
              <View key={i} style={styles.packingRow}>
                <View style={[styles.checkbox, item.packed && styles.checkboxDone]} />
                <Text style={[styles.packingItem, item.packed && styles.packingItemDone]}>{item.name}</Text>
              </View>
            ))}
          </ScrollView>
        </View>
      </Modal>
    );
  }

  return null;
}

const styles = StyleSheet.create({
  screen: { flex: 1, backgroundColor: COLORS.bg },
  header: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingHorizontal: SPACING.lg,
    paddingBottom: SPACING.md,
  } as ViewStyle,
  title: { fontFamily: FONTS.header, fontSize: 24, color: COLORS.cream },
  closeBtn: { fontSize: 18, color: COLORS.creamMuted },
  scroll: { flex: 1 },
  scrollContent: { paddingHorizontal: SPACING.lg, paddingBottom: SPACING.xxxl },
  hint: { fontFamily: FONTS.body, fontSize: 14, color: COLORS.creamMuted, marginBottom: SPACING.lg },
  phraseCard: {
    backgroundColor: COLORS.bgCard,
    borderRadius: RADIUS.lg,
    borderWidth: 1,
    borderColor: COLORS.border,
    padding: SPACING.lg,
    marginBottom: SPACING.sm,
  } as ViewStyle,
  phraseEnglish: { fontFamily: FONTS.bodySemiBold, fontSize: 16, color: COLORS.cream },
  phraseLocal: { fontFamily: FONTS.body, fontSize: 24, color: COLORS.sage, marginTop: 4 },
  phrasePhonetic: { fontFamily: FONTS.mono, fontSize: 13, color: COLORS.creamMuted, marginTop: 4 },
  fullScreenOverlay: {
    flex: 1,
    backgroundColor: COLORS.overlayDeeper,
    justifyContent: 'center',
    alignItems: 'center',
    padding: SPACING.xl,
  } as ViewStyle,
  fullScreenContent: { alignItems: 'center' },
  fullScreenLocal: { fontFamily: FONTS.body, fontSize: 48, color: COLORS.cream, textAlign: 'center' },
  fullScreenPhonetic: { fontFamily: FONTS.mono, fontSize: 18, color: COLORS.sage, marginTop: 8 },
  fullScreenEnglish: { fontFamily: FONTS.body, fontSize: 20, color: COLORS.creamMuted, marginTop: 16 },
  fullScreenHint: { fontFamily: FONTS.mono, fontSize: 12, color: COLORS.creamMuted, marginTop: 24 },
  sectionLabel: {
    fontFamily: FONTS.mono,
    fontSize: 11,
    color: COLORS.sage,
    letterSpacing: 1.5,
    marginTop: SPACING.lg,
    marginBottom: SPACING.sm,
  } as TextStyle,
  emergencyRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    paddingVertical: SPACING.sm,
    borderBottomWidth: 1,
    borderBottomColor: COLORS.border,
  } as ViewStyle,
  emergencyLabel: { fontFamily: FONTS.body, fontSize: 15, color: COLORS.cream },
  emergencyNumber: { fontFamily: FONTS.mono, fontSize: 18, color: COLORS.sage },
  emergencyText: { fontFamily: FONTS.body, fontSize: 15, color: COLORS.cream, marginTop: 4 },
  culturalText: { fontFamily: FONTS.body, fontSize: 15, color: COLORS.cream, lineHeight: 22, marginBottom: SPACING.md },
  alertRow: { flexDirection: 'row', alignItems: 'center', paddingVertical: SPACING.sm, gap: SPACING.sm },
  alertIconWrap: { marginTop: 2 },
  alertText: { fontFamily: FONTS.body, fontSize: 14, color: COLORS.gold, flex: 1 },
  packingRow: { flexDirection: 'row', alignItems: 'center', paddingVertical: SPACING.sm, gap: SPACING.sm },
  checkbox: {
    width: 24,
    height: 24,
    borderRadius: RADIUS.sm,
    borderWidth: 2,
    borderColor: COLORS.border,
  } as ViewStyle,
  checkboxDone: { backgroundColor: COLORS.sage },
  packingItem: { fontFamily: FONTS.body, fontSize: 15, color: COLORS.cream },
  packingItemDone: { textDecorationLine: 'line-through', color: COLORS.creamMuted },
});
