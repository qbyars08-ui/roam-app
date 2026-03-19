// =============================================================================
// ROAM — Travel Accounts Screen
// Manage linked airline, hotel, and rental accounts.
// =============================================================================
import React, { useState, useCallback, useMemo } from 'react';
import {
  View,
  Text,
  Pressable,
  ScrollView,
  Modal,
  TextInput,
  Alert,
  StyleSheet,
  type ViewStyle,
  type TextStyle,
} from 'react-native';
import { useRouter } from 'expo-router';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import {
  ArrowLeft,
  Plus,
  Plane,
  Building2,
  Car,
  X,
  ChevronRight,
  Trash2,
} from 'lucide-react-native';
import * as Haptics from '../lib/haptics';
import { COLORS, FONTS, SPACING, RADIUS } from '../lib/constants';
import {
  useTravelAccounts,
  SUPPORTED_PROVIDERS,
  getProviderDef,
  type TravelAccount,
  type AccountType,
} from '../lib/travel-accounts';

// ---------------------------------------------------------------------------
// Tier options
// ---------------------------------------------------------------------------
const TIER_OPTIONS = ['Basic', 'Silver', 'Gold', 'Platinum'] as const;

// ---------------------------------------------------------------------------
// Helpers
// ---------------------------------------------------------------------------
function accountTypeIcon(type: AccountType, size: number, color: string) {
  switch (type) {
    case 'airline':
      return <Plane size={size} color={color} strokeWidth={1.5} />;
    case 'hotel':
      return <Building2 size={size} color={color} strokeWidth={1.5} />;
    case 'rental':
      return <Car size={size} color={color} strokeWidth={1.5} />;
    default:
      return <Plane size={size} color={color} strokeWidth={1.5} />;
  }
}

function providerInitial(name: string): string {
  return name.charAt(0).toUpperCase();
}

// ---------------------------------------------------------------------------
// Main Screen
// ---------------------------------------------------------------------------
export default function TravelAccountsScreen() {
  const router = useRouter();
  const insets = useSafeAreaInsets();
  const { accounts, add, remove, loading } = useTravelAccounts();

  // Modal state
  const [modalVisible, setModalVisible] = useState(false);
  const [selectedProvider, setSelectedProvider] = useState<string | null>(null);
  const [memberNumber, setMemberNumber] = useState('');
  const [selectedTier, setSelectedTier] = useState<string>('Basic');

  // Group providers by type
  const grouped = useMemo(() => {
    const airlines = SUPPORTED_PROVIDERS.filter((p) => p.accountType === 'airline');
    const hotels = SUPPORTED_PROVIDERS.filter((p) => p.accountType === 'hotel');
    const rentals = SUPPORTED_PROVIDERS.filter((p) => p.accountType === 'rental');
    return { airlines, hotels, rentals };
  }, []);

  // Already linked provider names
  const linkedNames = useMemo(
    () => new Set(accounts.map((a) => a.provider)),
    [accounts],
  );

  const handleOpenAdd = useCallback((provider: string) => {
    Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
    setSelectedProvider(provider);
    setMemberNumber('');
    setSelectedTier('Basic');
    setModalVisible(true);
  }, []);

  const handleAdd = useCallback(async () => {
    if (!selectedProvider) return;
    Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Medium);
    await add(selectedProvider, memberNumber.trim() || undefined, selectedTier);
    setModalVisible(false);
    setSelectedProvider(null);
  }, [selectedProvider, memberNumber, selectedTier, add]);

  const handleRemove = useCallback(
    (account: TravelAccount) => {
      Alert.alert(
        'Remove account?',
        `Unlink ${account.provider} from ROAM?`,
        [
          { text: 'Cancel', style: 'cancel' },
          {
            text: 'Remove',
            style: 'destructive',
            onPress: async () => {
              Haptics.notificationAsync(Haptics.NotificationFeedbackType.Success);
              await remove(account.id);
            },
          },
        ],
      );
    },
    [remove],
  );

  // ---------------------------------------------------------------------------
  // Provider card component
  // ---------------------------------------------------------------------------
  const renderProviderCard = useCallback(
    (provider: { name: string; accountType: AccountType; color: string }) => {
      const isLinked = linkedNames.has(provider.name);
      return (
        <Pressable
          key={provider.name}
          onPress={() => !isLinked && handleOpenAdd(provider.name)}
          style={({ pressed }) => [
            s.providerCard,
            isLinked && s.providerCardLinked,
            { opacity: pressed && !isLinked ? 0.7 : 1 },
          ]}
        >
          <View style={[s.providerLogo, { backgroundColor: provider.color }]}>
            <Text style={s.providerInitial}>{providerInitial(provider.name)}</Text>
          </View>
          <Text
            style={[s.providerName, isLinked && s.providerNameLinked]}
            numberOfLines={1}
          >
            {provider.name}
          </Text>
          {isLinked ? (
            <Text style={s.linkedLabel}>Linked</Text>
          ) : (
            <Plus size={14} color={COLORS.creamDim} strokeWidth={1.5} />
          )}
        </Pressable>
      );
    },
    [linkedNames, handleOpenAdd],
  );

  return (
    <View style={[s.container, { paddingTop: insets.top }]}>
      {/* Header */}
      <View style={s.header}>
        <Pressable onPress={() => router.back()} hitSlop={12}>
          <ArrowLeft size={24} color={COLORS.cream} strokeWidth={1.5} />
        </Pressable>
        <Text style={s.headerTitle}>Your travel accounts</Text>
        <View style={{ width: 24 }} />
      </View>

      <ScrollView
        contentContainerStyle={s.scrollContent}
        showsVerticalScrollIndicator={false}
      >
        {/* ── Linked Accounts ── */}
        {accounts.length > 0 && (
          <View style={s.section}>
            <Text style={s.sectionLabel}>LINKED</Text>
            {accounts.map((account) => {
              const def = getProviderDef(account.provider);
              return (
                <Pressable
                  key={account.id}
                  onLongPress={() => handleRemove(account)}
                  style={({ pressed }) => [
                    s.linkedRow,
                    { opacity: pressed ? 0.85 : 1 },
                  ]}
                >
                  <View
                    style={[
                      s.linkedLogo,
                      { backgroundColor: def?.color ?? COLORS.sage },
                    ]}
                  >
                    <Text style={s.linkedInitial}>
                      {providerInitial(account.provider)}
                    </Text>
                  </View>
                  <View style={s.linkedInfo}>
                    <Text style={s.linkedName}>{account.provider}</Text>
                    <View style={s.linkedMeta}>
                      {account.tier && account.tier !== 'Basic' && (
                        <View style={s.tierBadge}>
                          <Text style={s.tierBadgeText}>{account.tier}</Text>
                        </View>
                      )}
                      {(account.miles ?? 0) > 0 && (
                        <Text style={s.milesText}>
                          {(account.miles ?? 0).toLocaleString()} mi
                        </Text>
                      )}
                      {(account.points ?? 0) > 0 && (
                        <Text style={s.milesText}>
                          {(account.points ?? 0).toLocaleString()} pts
                        </Text>
                      )}
                    </View>
                  </View>
                  <Pressable
                    onPress={() => handleRemove(account)}
                    hitSlop={8}
                  >
                    <Trash2 size={16} color={COLORS.creamDim} strokeWidth={1.5} />
                  </Pressable>
                </Pressable>
              );
            })}
          </View>
        )}

        {/* ── Add Account — Airlines ── */}
        <View style={s.section}>
          <Text style={s.sectionLabel}>AIRLINES</Text>
          <View style={s.providerGrid}>
            {grouped.airlines.map(renderProviderCard)}
          </View>
        </View>

        {/* ── Hotels ── */}
        <View style={s.section}>
          <Text style={s.sectionLabel}>HOTELS</Text>
          <View style={s.providerGrid}>
            {grouped.hotels.map(renderProviderCard)}
          </View>
        </View>

        {/* ── Rental ── */}
        <View style={s.section}>
          <Text style={s.sectionLabel}>RENTAL</Text>
          <View style={s.providerGrid}>
            {grouped.rentals.map(renderProviderCard)}
          </View>
        </View>

        {loading && accounts.length === 0 && (
          <Text style={s.loadingText}>Loading accounts...</Text>
        )}

        <View style={{ height: 80 }} />
      </ScrollView>

      {/* ── Add Modal ── */}
      <Modal
        visible={modalVisible}
        transparent
        animationType="fade"
        onRequestClose={() => setModalVisible(false)}
      >
        <Pressable
          style={s.modalBackdrop}
          onPress={() => setModalVisible(false)}
        >
          <Pressable
            style={s.modalContent}
            onPress={(e) => e.stopPropagation()}
          >
            <View style={s.modalHeader}>
              <Text style={s.modalTitle}>
                Link {selectedProvider}
              </Text>
              <Pressable onPress={() => setModalVisible(false)} hitSlop={12}>
                <X size={20} color={COLORS.creamMuted} strokeWidth={1.5} />
              </Pressable>
            </View>

            <Text style={s.fieldLabel}>Member number (optional)</Text>
            <TextInput
              style={s.textInput}
              value={memberNumber}
              onChangeText={setMemberNumber}
              placeholder="e.g. 1234567890"
              placeholderTextColor={COLORS.creamDim}
              keyboardType="default"
              autoCapitalize="none"
            />

            <Text style={s.fieldLabel}>Tier</Text>
            <View style={s.tierRow}>
              {TIER_OPTIONS.map((t) => (
                <Pressable
                  key={t}
                  onPress={() => {
                    Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
                    setSelectedTier(t);
                  }}
                  style={[
                    s.tierPill,
                    selectedTier === t && s.tierPillActive,
                  ]}
                >
                  <Text
                    style={[
                      s.tierPillText,
                      selectedTier === t && s.tierPillTextActive,
                    ]}
                  >
                    {t}
                  </Text>
                </Pressable>
              ))}
            </View>

            <Pressable
              onPress={handleAdd}
              style={({ pressed }) => [
                s.addButton,
                { opacity: pressed ? 0.85 : 1 },
              ]}
            >
              <Text style={s.addButtonText}>Link account</Text>
            </Pressable>
          </Pressable>
        </Pressable>
      </Modal>
    </View>
  );
}

// ---------------------------------------------------------------------------
// Styles
// ---------------------------------------------------------------------------
const s = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: COLORS.bg,
  } as ViewStyle,
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: SPACING.lg,
    paddingVertical: SPACING.md,
  } as ViewStyle,
  headerTitle: {
    fontFamily: FONTS.header,
    fontSize: 20,
    color: COLORS.cream,
  } as TextStyle,
  scrollContent: {
    paddingHorizontal: SPACING.lg,
    paddingBottom: SPACING.xxl,
  } as ViewStyle,

  // Sections
  section: {
    marginTop: SPACING.lg,
  } as ViewStyle,
  sectionLabel: {
    fontFamily: FONTS.mono,
    fontSize: 11,
    color: COLORS.creamDim,
    letterSpacing: 1.2,
    marginBottom: SPACING.sm,
  } as TextStyle,

  // Linked accounts list
  linkedRow: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: COLORS.surface1,
    borderRadius: RADIUS.md,
    padding: SPACING.md,
    marginBottom: SPACING.sm,
    borderWidth: 1,
    borderColor: COLORS.border,
  } as ViewStyle,
  linkedLogo: {
    width: 40,
    height: 40,
    borderRadius: 20,
    alignItems: 'center',
    justifyContent: 'center',
  } as ViewStyle,
  linkedInitial: {
    fontFamily: FONTS.header,
    fontSize: 18,
    color: COLORS.white,
  } as TextStyle,
  linkedInfo: {
    flex: 1,
    marginLeft: SPACING.md,
  } as ViewStyle,
  linkedName: {
    fontFamily: FONTS.bodyMedium,
    fontSize: 15,
    color: COLORS.cream,
  } as TextStyle,
  linkedMeta: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: SPACING.sm,
    marginTop: 2,
  } as ViewStyle,
  tierBadge: {
    backgroundColor: COLORS.sageSubtle,
    paddingHorizontal: SPACING.sm,
    paddingVertical: 2,
    borderRadius: RADIUS.sm,
  } as ViewStyle,
  tierBadgeText: {
    fontFamily: FONTS.mono,
    fontSize: 10,
    color: COLORS.sage,
    letterSpacing: 0.5,
  } as TextStyle,
  milesText: {
    fontFamily: FONTS.mono,
    fontSize: 12,
    color: COLORS.creamDim,
  } as TextStyle,

  // Provider grid
  providerGrid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: SPACING.sm,
  } as ViewStyle,
  providerCard: {
    width: '30%' as unknown as number,
    backgroundColor: COLORS.surface1,
    borderRadius: RADIUS.md,
    padding: SPACING.sm,
    alignItems: 'center',
    borderWidth: 1,
    borderColor: COLORS.border,
    gap: 4,
  } as ViewStyle,
  providerCardLinked: {
    borderColor: COLORS.sageBorder,
    backgroundColor: COLORS.sageVeryFaint,
  } as ViewStyle,
  providerLogo: {
    width: 36,
    height: 36,
    borderRadius: 18,
    alignItems: 'center',
    justifyContent: 'center',
  } as ViewStyle,
  providerInitial: {
    fontFamily: FONTS.header,
    fontSize: 16,
    color: COLORS.white,
  } as TextStyle,
  providerName: {
    fontFamily: FONTS.body,
    fontSize: 11,
    color: COLORS.creamDim,
    textAlign: 'center',
  } as TextStyle,
  providerNameLinked: {
    color: COLORS.sage,
  } as TextStyle,
  linkedLabel: {
    fontFamily: FONTS.mono,
    fontSize: 9,
    color: COLORS.sage,
  } as TextStyle,

  loadingText: {
    fontFamily: FONTS.body,
    fontSize: 14,
    color: COLORS.creamDim,
    textAlign: 'center',
    marginTop: SPACING.xl,
  } as TextStyle,

  // Modal
  modalBackdrop: {
    flex: 1,
    backgroundColor: COLORS.overlay,
    justifyContent: 'flex-end',
  } as ViewStyle,
  modalContent: {
    backgroundColor: COLORS.surface2,
    borderTopLeftRadius: RADIUS.xl,
    borderTopRightRadius: RADIUS.xl,
    padding: SPACING.lg,
    paddingBottom: SPACING.xxl,
  } as ViewStyle,
  modalHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    marginBottom: SPACING.lg,
  } as ViewStyle,
  modalTitle: {
    fontFamily: FONTS.header,
    fontSize: 20,
    color: COLORS.cream,
  } as TextStyle,
  fieldLabel: {
    fontFamily: FONTS.mono,
    fontSize: 11,
    color: COLORS.creamDim,
    letterSpacing: 1,
    marginBottom: SPACING.xs,
    marginTop: SPACING.md,
  } as TextStyle,
  textInput: {
    backgroundColor: COLORS.surface1,
    borderRadius: RADIUS.md,
    padding: SPACING.md,
    fontFamily: FONTS.body,
    fontSize: 15,
    color: COLORS.cream,
    borderWidth: 1,
    borderColor: COLORS.border,
  } as TextStyle,
  tierRow: {
    flexDirection: 'row',
    gap: SPACING.sm,
    marginTop: SPACING.xs,
  } as ViewStyle,
  tierPill: {
    paddingHorizontal: SPACING.md,
    paddingVertical: SPACING.sm,
    borderRadius: RADIUS.pill,
    backgroundColor: COLORS.surface1,
    borderWidth: 1,
    borderColor: COLORS.border,
  } as ViewStyle,
  tierPillActive: {
    backgroundColor: COLORS.sageSubtle,
    borderColor: COLORS.sageBorder,
  } as ViewStyle,
  tierPillText: {
    fontFamily: FONTS.bodyMedium,
    fontSize: 13,
    color: COLORS.creamDim,
  } as TextStyle,
  tierPillTextActive: {
    color: COLORS.sage,
  } as TextStyle,
  addButton: {
    backgroundColor: COLORS.sage,
    borderRadius: RADIUS.pill,
    paddingVertical: 14,
    alignItems: 'center',
    marginTop: SPACING.lg,
  } as ViewStyle,
  addButtonText: {
    fontFamily: FONTS.bodyMedium,
    fontSize: 15,
    color: COLORS.bg,
  } as TextStyle,
});
