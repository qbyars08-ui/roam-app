// =============================================================================
// ROAM — Destination Dream Board
// Pinterest-style visual bucket list of dream destinations
// =============================================================================
import React, { useState, useEffect, useCallback, useMemo } from 'react';
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  Image,
  TextInput,
  Modal,
  Alert,
  Dimensions,
  KeyboardAvoidingView,
  Platform,
  type ViewStyle,
  type TextStyle,
  type ImageStyle,
} from 'react-native';
import { LinearGradient } from 'expo-linear-gradient';
import { useRouter } from 'expo-router';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { Globe, Plus, Heart, X, ArrowLeft } from 'lucide-react-native';
import { useTranslation } from 'react-i18next';
import AsyncStorage from '@react-native-async-storage/async-storage';

import { COLORS, FONTS, SPACING, RADIUS } from '../lib/constants';
import { BUCKET_LIST } from '../lib/storage-keys';
import FadeIn from '../components/ui/FadeIn';
import PressableScale from '../components/ui/PressableScale';
import * as Haptics from '../lib/haptics';

// ---------------------------------------------------------------------------
// Types
// ---------------------------------------------------------------------------
type DreamDestination = {
  readonly id: string;
  readonly name: string;
  readonly addedAt: string;
};

// ---------------------------------------------------------------------------
// Helpers
// ---------------------------------------------------------------------------
const { width: SCREEN_WIDTH } = Dimensions.get('window');
const COLUMN_GAP = SPACING.sm;
const CARD_WIDTH = (SCREEN_WIDTH - SPACING.md * 2 - COLUMN_GAP) / 2;
const CARD_HEIGHTS = [180, 220] as const;

function buildImageUri(destination: string): string {
  const query = encodeURIComponent(`${destination} travel`);
  return `https://source.unsplash.com/400x300/?${query}`;
}

function generateId(): string {
  return Date.now().toString(36) + Math.random().toString(36).slice(2, 8);
}

// ---------------------------------------------------------------------------
// Card
// ---------------------------------------------------------------------------
function DreamCard({
  item,
  index,
  onPress,
  onLongPress,
}: {
  item: DreamDestination;
  index: number;
  onPress: () => void;
  onLongPress: () => void;
}) {
  const height = CARD_HEIGHTS[index % 2];

  return (
    <FadeIn delay={index * 60}>
      <PressableScale onPress={onPress} onLongPress={onLongPress} style={{ ...cardStyles.root, height }}>
        <Image source={{ uri: buildImageUri(item.name) }} style={cardStyles.image} resizeMode="cover" />
        <LinearGradient colors={['transparent', 'rgba(0,0,0,0.7)']} style={cardStyles.gradient} />
        <View style={cardStyles.heartBadge}>
          <Heart size={14} color={COLORS.coral} strokeWidth={1.5} fill={COLORS.coral} />
        </View>
        <View style={cardStyles.nameWrap}>
          <Text style={cardStyles.name} numberOfLines={1}>{item.name}</Text>
        </View>
      </PressableScale>
    </FadeIn>
  );
}

// ---------------------------------------------------------------------------
// Main Screen
// ---------------------------------------------------------------------------
export default function DreamBoardScreen(): React.JSX.Element {
  const router = useRouter();
  const insets = useSafeAreaInsets();
  const { t } = useTranslation();

  const [destinations, setDestinations] = useState<readonly DreamDestination[]>([]);
  const [modalVisible, setModalVisible] = useState(false);
  const [inputValue, setInputValue] = useState('');
  const [loaded, setLoaded] = useState(false);

  // --- Persistence ---
  const loadDestinations = useCallback(async () => {
    try {
      const raw = await AsyncStorage.getItem(BUCKET_LIST);
      if (raw) {
        const parsed: DreamDestination[] = JSON.parse(raw);
        setDestinations(parsed);
      }
    } catch {
      // silent — first launch or corrupt data
    } finally {
      setLoaded(true);
    }
  }, []);

  const persistDestinations = useCallback(async (items: readonly DreamDestination[]) => {
    try {
      await AsyncStorage.setItem(BUCKET_LIST, JSON.stringify(items));
    } catch (err: unknown) {
      console.warn('[ROAM] Dream board persist failed:', err instanceof Error ? err.message : String(err));
    }
  }, []);

  useEffect(() => {
    void loadDestinations();
  }, [loadDestinations]);

  // --- Actions ---
  const handleAdd = useCallback(() => {
    const trimmed = inputValue.trim();
    if (trimmed.length === 0) return;

    const newItem: DreamDestination = {
      id: generateId(),
      name: trimmed,
      addedAt: new Date().toISOString(),
    };
    const updated = [newItem, ...destinations];
    setDestinations(updated);
    void persistDestinations(updated);
    setInputValue('');
    setModalVisible(false);
    Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light).catch(() => {});
  }, [inputValue, destinations, persistDestinations]);

  const handleRemove = useCallback((id: string, name: string) => {
    Alert.alert(
      t('dreamBoard.removeTitle', { defaultValue: 'Remove destination' }),
      t('dreamBoard.removeMessage', { defaultValue: `Remove ${name} from your dream board?` }),
      [
        { text: t('common.cancel', { defaultValue: 'Cancel' }), style: 'cancel' },
        {
          text: t('common.remove', { defaultValue: 'Remove' }),
          style: 'destructive',
          onPress: () => {
            const updated = destinations.filter((d) => d.id !== id);
            setDestinations(updated);
            void persistDestinations(updated);
            Haptics.notificationAsync(Haptics.NotificationFeedbackType.Success).catch(() => {});
          },
        },
      ],
    );
  }, [destinations, persistDestinations, t]);

  const handleCardPress = useCallback((name: string) => {
    Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light).catch(() => {});
    router.push(`/destination/${encodeURIComponent(name)}`);
  }, [router]);

  const openModal = useCallback(() => {
    Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light).catch(() => {});
    setModalVisible(true);
  }, []);

  const closeModal = useCallback(() => {
    setModalVisible(false);
    setInputValue('');
  }, []);

  const handleBack = useCallback(() => {
    Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light).catch(() => {});
    router.back();
  }, [router]);

  // --- Split into 2 columns (masonry) ---
  const { leftColumn, rightColumn } = useMemo(() => {
    const left: DreamDestination[] = [];
    const right: DreamDestination[] = [];
    destinations.forEach((d, i) => {
      if (i % 2 === 0) left.push(d);
      else right.push(d);
    });
    return { leftColumn: left, rightColumn: right };
  }, [destinations]);

  // --- Loading ---
  if (!loaded) return <View style={[s.root, { paddingTop: insets.top }]} />;

  return (
    <View style={[s.root, { paddingTop: insets.top }]}>
      {/* Header */}
      <View style={s.header}>
        <PressableScale onPress={handleBack} style={s.backBtn}>
          <ArrowLeft size={20} color={COLORS.cream} strokeWidth={1.5} />
        </PressableScale>
        <Text style={s.headerTitle}>
          {t('dreamBoard.title', { defaultValue: 'Dream Board' })}
        </Text>
        <View style={s.headerSpacer} />
      </View>

      {destinations.length === 0 ? (
        <FadeIn delay={100}>
          <View style={s.emptyWrap}>
            <Globe size={48} color={COLORS.muted} strokeWidth={1.5} />
            <Text style={s.emptyTitle}>
              {t('dreamBoard.emptyTitle', { defaultValue: 'Where do you dream of going?' })}
            </Text>
            <Text style={s.emptySubtitle}>
              {t('dreamBoard.emptySubtitle', { defaultValue: 'Save destinations you want to visit someday' })}
            </Text>
            <PressableScale onPress={openModal} style={s.emptyCta}>
              <Plus size={18} color={COLORS.white} strokeWidth={1.5} />
              <Text style={s.emptyCtaText}>
                {t('dreamBoard.addFirst', { defaultValue: 'Add your first destination' })}
              </Text>
            </PressableScale>
          </View>
        </FadeIn>
      ) : (
        <ScrollView
          contentContainerStyle={[s.grid, { paddingBottom: insets.bottom + 80 }]}
          showsVerticalScrollIndicator={false}
        >
          <View style={s.masonry}>
            <View style={s.column}>
              {leftColumn.map((d, i) => (
                <DreamCard
                  key={d.id}
                  item={d}
                  index={i * 2}
                  onPress={() => handleCardPress(d.name)}
                  onLongPress={() => handleRemove(d.id, d.name)}
                />
              ))}
            </View>
            <View style={s.column}>
              {rightColumn.map((d, i) => (
                <DreamCard
                  key={d.id}
                  item={d}
                  index={i * 2 + 1}
                  onPress={() => handleCardPress(d.name)}
                  onLongPress={() => handleRemove(d.id, d.name)}
                />
              ))}
            </View>
          </View>
        </ScrollView>
      )}

      {/* Floating Add Button */}
      {destinations.length > 0 && (
        <PressableScale onPress={openModal} style={{ ...s.fab, bottom: insets.bottom + SPACING.lg }}>
          <Plus size={24} color={COLORS.white} strokeWidth={1.5} />
        </PressableScale>
      )}

      {/* Add Destination Modal */}
      <Modal visible={modalVisible} animationType="slide" transparent onRequestClose={closeModal}>
        <KeyboardAvoidingView
          behavior={Platform.OS === 'ios' ? 'padding' : 'height'}
          style={s.modalOverlay}
        >
          <PressableScale onPress={closeModal} style={s.modalBackdrop}>
            <View />
          </PressableScale>
          <View style={s.modalContent}>
            <View style={s.modalHeader}>
              <Text style={s.modalTitle}>
                {t('dreamBoard.addTitle', { defaultValue: 'Add a destination' })}
              </Text>
              <PressableScale onPress={closeModal}>
                <X size={20} color={COLORS.muted} strokeWidth={1.5} />
              </PressableScale>
            </View>
            <TextInput
              style={s.modalInput}
              placeholder={t('dreamBoard.inputPlaceholder', {
                defaultValue: 'e.g. Tokyo, Santorini, Patagonia...',
              })}
              placeholderTextColor={COLORS.muted}
              value={inputValue}
              onChangeText={setInputValue}
              autoFocus
              returnKeyType="done"
              onSubmitEditing={handleAdd}
              maxLength={100}
            />
            <PressableScale
              onPress={handleAdd}
              style={inputValue.trim().length === 0 ? { ...s.modalBtn, ...s.modalBtnDisabled } : s.modalBtn}
              disabled={inputValue.trim().length === 0}
            >
              <Text style={s.modalBtnText}>
                {t('dreamBoard.addButton', { defaultValue: 'Add to dream board' })}
              </Text>
            </PressableScale>
          </View>
        </KeyboardAvoidingView>
      </Modal>
    </View>
  );
}

// ---------------------------------------------------------------------------
// Card Styles
// ---------------------------------------------------------------------------
const cardStyles = StyleSheet.create({
  root: {
    borderRadius: RADIUS.lg,
    overflow: 'hidden',
    borderWidth: 1,
    borderColor: COLORS.border,
  } as ViewStyle,
  image: {
    ...StyleSheet.absoluteFillObject,
  } as ImageStyle,
  gradient: {
    position: 'absolute',
    left: 0,
    right: 0,
    bottom: 0,
    height: '50%',
  } as ViewStyle,
  heartBadge: {
    position: 'absolute',
    top: SPACING.sm,
    right: SPACING.sm,
    width: 28,
    height: 28,
    borderRadius: RADIUS.full,
    backgroundColor: COLORS.overlayMedium,
    alignItems: 'center',
    justifyContent: 'center',
  } as ViewStyle,
  nameWrap: {
    position: 'absolute',
    bottom: 0,
    left: 0,
    right: 0,
    paddingHorizontal: SPACING.sm,
    paddingBottom: SPACING.sm,
  } as ViewStyle,
  name: {
    fontFamily: FONTS.headerMedium,
    fontSize: 14,
    color: COLORS.white,
  } as TextStyle,
});

// ---------------------------------------------------------------------------
// Screen Styles
// ---------------------------------------------------------------------------
const s = StyleSheet.create({
  root: { flex: 1, backgroundColor: COLORS.bg } as ViewStyle,
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: SPACING.md,
    paddingVertical: SPACING.sm,
  } as ViewStyle,
  backBtn: {
    width: 36,
    height: 36,
    borderRadius: RADIUS.full,
    backgroundColor: COLORS.surface1,
    alignItems: 'center',
    justifyContent: 'center',
  } as ViewStyle,
  headerTitle: {
    flex: 1,
    textAlign: 'center',
    fontFamily: FONTS.header,
    fontSize: 18,
    color: COLORS.cream,
  } as TextStyle,
  headerSpacer: { width: 36 } as ViewStyle,
  // Grid / masonry
  grid: { paddingHorizontal: SPACING.md, paddingTop: SPACING.sm } as ViewStyle,
  masonry: { flexDirection: 'row', gap: COLUMN_GAP } as ViewStyle,
  column: { flex: 1, gap: COLUMN_GAP } as ViewStyle,
  // Empty
  emptyWrap: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
    paddingHorizontal: SPACING.xl,
    gap: SPACING.md,
    marginTop: 120,
  } as ViewStyle,
  emptyTitle: {
    fontFamily: FONTS.header,
    fontSize: 20,
    color: COLORS.cream,
    textAlign: 'center',
    marginTop: SPACING.sm,
  } as TextStyle,
  emptySubtitle: {
    fontFamily: FONTS.body,
    fontSize: 14,
    color: COLORS.muted,
    textAlign: 'center',
    lineHeight: 20,
  } as TextStyle,
  emptyCta: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: SPACING.xs,
    backgroundColor: COLORS.sage,
    paddingHorizontal: SPACING.lg,
    paddingVertical: SPACING.sm + 2,
    borderRadius: RADIUS.pill,
    marginTop: SPACING.sm,
  } as ViewStyle,
  emptyCtaText: {
    fontFamily: FONTS.bodyMedium,
    fontSize: 14,
    color: COLORS.white,
  } as TextStyle,
  // FAB
  fab: {
    position: 'absolute',
    right: SPACING.md,
    width: 56,
    height: 56,
    borderRadius: 28,
    backgroundColor: COLORS.sage,
    alignItems: 'center',
    justifyContent: 'center',
    shadowColor: COLORS.black,
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.35,
    shadowRadius: 12,
    elevation: 8,
  } as ViewStyle,
  // Modal
  modalOverlay: { flex: 1, justifyContent: 'flex-end' } as ViewStyle,
  modalBackdrop: {
    ...StyleSheet.absoluteFillObject,
    backgroundColor: COLORS.overlay,
  } as ViewStyle,
  modalContent: {
    backgroundColor: COLORS.surface2,
    borderTopLeftRadius: RADIUS.xl,
    borderTopRightRadius: RADIUS.xl,
    paddingHorizontal: SPACING.lg,
    paddingTop: SPACING.lg,
    paddingBottom: SPACING.xxl,
  } as ViewStyle,
  modalHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    marginBottom: SPACING.md,
  } as ViewStyle,
  modalTitle: {
    fontFamily: FONTS.header,
    fontSize: 18,
    color: COLORS.cream,
  } as TextStyle,
  modalInput: {
    backgroundColor: COLORS.surface1,
    borderRadius: RADIUS.md,
    borderWidth: 1,
    borderColor: COLORS.border,
    paddingHorizontal: SPACING.md,
    paddingVertical: SPACING.sm + 4,
    fontFamily: FONTS.body,
    fontSize: 15,
    color: COLORS.cream,
    marginBottom: SPACING.md,
  } as TextStyle,
  modalBtn: {
    backgroundColor: COLORS.sage,
    borderRadius: RADIUS.pill,
    paddingVertical: SPACING.sm + 4,
    alignItems: 'center',
  } as ViewStyle,
  modalBtnDisabled: { opacity: 0.4 } as ViewStyle,
  modalBtnText: {
    fontFamily: FONTS.bodyMedium,
    fontSize: 15,
    color: COLORS.white,
  } as TextStyle,
});
