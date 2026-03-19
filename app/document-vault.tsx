// =============================================================================
// ROAM — Document Vault: all trip documents in one place
// =============================================================================
import React, { useCallback, useMemo, useState } from 'react';
import {
  View,
  Text,
  ScrollView,
  Pressable,
  TextInput,
  Modal,
  StyleSheet,
  Alert,
  Platform,
  type ViewStyle,
  type TextStyle,
} from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { useLocalSearchParams, useRouter } from 'expo-router';
import { useTranslation } from 'react-i18next';
import {
  ArrowLeft,
  Plus,
  ChevronDown,
  FileText,
  Shield,
  Ticket,
  Heart,
  Plane,
  Globe,
  Syringe,
  FolderOpen,
  AlertTriangle,
  X,
  Trash2,
} from 'lucide-react-native';
import * as Haptics from '../lib/haptics';
import { COLORS, FONTS, SPACING, RADIUS } from '../lib/constants';
import { useAppStore } from '../lib/store';
import {
  useDocumentVault,
  DOC_TYPE_LABELS,
  type DocType,
  type TripDocument,
} from '../lib/document-vault';

// ---------------------------------------------------------------------------
// Doc type icon mapping
// ---------------------------------------------------------------------------
const DOC_ICONS: Record<DocType, typeof FileText> = {
  passport: Globe,
  visa: Shield,
  insurance: Shield,
  booking: Plane,
  ticket: Ticket,
  reservation: FileText,
  vaccination: Syringe,
  other: FolderOpen,
};

const DOC_TYPES: DocType[] = [
  'passport', 'visa', 'insurance', 'booking', 'ticket', 'reservation', 'vaccination', 'other',
];

// ---------------------------------------------------------------------------
// Helpers
// ---------------------------------------------------------------------------
function daysUntil(dateStr: string): number {
  const target = new Date(dateStr + 'T00:00:00');
  const now = new Date();
  now.setHours(0, 0, 0, 0);
  return Math.ceil((target.getTime() - now.getTime()) / (1000 * 60 * 60 * 24));
}

function formatDate(dateStr: string): string {
  try {
    const d = new Date(dateStr + 'T00:00:00');
    return d.toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric' });
  } catch {
    return dateStr;
  }
}

// ---------------------------------------------------------------------------
// Section Component
// ---------------------------------------------------------------------------
function DocSection({
  docType,
  documents,
  onDelete,
}: {
  docType: DocType;
  documents: TripDocument[];
  onDelete: (id: string) => void;
}) {
  const [expanded, setExpanded] = useState(documents.length > 0);
  const Icon = DOC_ICONS[docType];
  const label = DOC_TYPE_LABELS[docType];

  const toggle = useCallback(() => {
    Haptics.selectionAsync();
    setExpanded((prev) => !prev);
  }, []);

  const handleDelete = useCallback(
    (doc: TripDocument) => {
      if (Platform.OS === 'web') {
        onDelete(doc.id);
        return;
      }
      Alert.alert('Remove document', `Remove "${doc.title}"?`, [
        { text: 'Cancel', style: 'cancel' },
        { text: 'Remove', style: 'destructive', onPress: () => onDelete(doc.id) },
      ]);
    },
    [onDelete],
  );

  return (
    <View style={styles.section}>
      <Pressable
        onPress={toggle}
        style={({ pressed }) => [styles.sectionHeader, pressed && { opacity: 0.8 }]}
        accessibilityRole="button"
        accessibilityLabel={`${label} section, ${documents.length} documents`}
      >
        <View style={styles.sectionHeaderLeft}>
          <Icon size={18} color={COLORS.sage} strokeWidth={1.5} />
          <Text style={styles.sectionTitle}>{label}</Text>
          {documents.length > 0 && (
            <View style={styles.countBadge}>
              <Text style={styles.countBadgeText}>{documents.length}</Text>
            </View>
          )}
        </View>
        <ChevronDown
          size={16}
          color={COLORS.muted}
          strokeWidth={1.5}
          style={{ transform: [{ rotate: expanded ? '0deg' : '-90deg' }] }}
        />
      </Pressable>

      {expanded && documents.length > 0 && (
        <View style={styles.sectionDocs}>
          {documents.map((doc) => {
            const Icon2 = DOC_ICONS[doc.docType];
            const days = doc.expiryDate ? daysUntil(doc.expiryDate) : null;
            const isExpiringSoon = days !== null && days >= 0 && days <= 30;

            return (
              <View key={doc.id} style={styles.docCard}>
                <View style={styles.docCardLeft}>
                  <Icon2
                    size={18}
                    color={isExpiringSoon ? COLORS.coral : COLORS.sage}
                    strokeWidth={1.5}
                  />
                  <View style={styles.docCardInfo}>
                    <Text style={styles.docTitle} numberOfLines={1}>
                      {doc.title}
                    </Text>
                    {doc.expiryDate && (
                      <Text
                        style={[
                          styles.docExpiry,
                          isExpiringSoon && styles.docExpiryUrgent,
                        ]}
                      >
                        {isExpiringSoon
                          ? `Expires in ${days} day${days === 1 ? '' : 's'}`
                          : `Expires ${formatDate(doc.expiryDate)}`}
                      </Text>
                    )}
                    {doc.notes && (
                      <Text style={styles.docNotes} numberOfLines={1}>
                        {doc.notes}
                      </Text>
                    )}
                  </View>
                </View>
                <Pressable
                  onPress={() => handleDelete(doc)}
                  hitSlop={8}
                  style={({ pressed }) => [{ opacity: pressed ? 0.5 : 1 }]}
                  accessibilityLabel={`Remove ${doc.title}`}
                >
                  <Trash2 size={16} color={COLORS.muted} strokeWidth={1.5} />
                </Pressable>
              </View>
            );
          })}
        </View>
      )}

      {expanded && documents.length === 0 && (
        <Text style={styles.emptyText}>No {label.toLowerCase()} documents yet</Text>
      )}
    </View>
  );
}

// ---------------------------------------------------------------------------
// Add Document Modal
// ---------------------------------------------------------------------------
function AddDocumentModal({
  visible,
  onClose,
  onAdd,
}: {
  visible: boolean;
  onClose: () => void;
  onAdd: (doc: { docType: DocType; title: string; notes?: string; expiryDate?: string }) => void;
}) {
  const [docType, setDocType] = useState<DocType>('passport');
  const [title, setTitle] = useState('');
  const [notes, setNotes] = useState('');
  const [expiryDate, setExpiryDate] = useState('');

  const handleSubmit = useCallback(() => {
    if (!title.trim()) {
      Alert.alert('Title required', 'Please enter a document title.');
      return;
    }
    Haptics.notificationAsync(Haptics.NotificationFeedbackType.Success);
    onAdd({
      docType,
      title: title.trim(),
      notes: notes.trim() || undefined,
      expiryDate: expiryDate.trim() || undefined,
    });
    setTitle('');
    setNotes('');
    setExpiryDate('');
    setDocType('passport');
    onClose();
  }, [docType, title, notes, expiryDate, onAdd, onClose]);

  return (
    <Modal visible={visible} transparent animationType="slide" onRequestClose={onClose}>
      <Pressable style={styles.modalOverlay} onPress={onClose}>
        <Pressable style={styles.modalSheet} onPress={() => {}}>
          <View style={styles.modalHandle} />
          <View style={styles.modalHeader}>
            <Text style={styles.modalTitle}>Add document</Text>
            <Pressable onPress={onClose} hitSlop={12}>
              <X size={20} color={COLORS.muted} strokeWidth={1.5} />
            </Pressable>
          </View>

          {/* Type picker */}
          <Text style={styles.fieldLabel}>Type</Text>
          <ScrollView
            horizontal
            showsHorizontalScrollIndicator={false}
            contentContainerStyle={styles.typePicker}
          >
            {DOC_TYPES.map((dt) => {
              const Icon = DOC_ICONS[dt];
              const selected = dt === docType;
              return (
                <Pressable
                  key={dt}
                  onPress={() => { Haptics.selectionAsync(); setDocType(dt); }}
                  style={[styles.typeChip, selected && styles.typeChipSelected]}
                >
                  <Icon size={14} color={selected ? COLORS.sage : COLORS.muted} strokeWidth={1.5} />
                  <Text style={[styles.typeChipText, selected && styles.typeChipTextSelected]}>
                    {DOC_TYPE_LABELS[dt]}
                  </Text>
                </Pressable>
              );
            })}
          </ScrollView>

          {/* Title */}
          <Text style={styles.fieldLabel}>Title</Text>
          <TextInput
            style={styles.input}
            value={title}
            onChangeText={setTitle}
            placeholder="e.g. US Passport"
            placeholderTextColor={COLORS.muted}
            returnKeyType="next"
            autoFocus
          />

          {/* Expiry date */}
          <Text style={styles.fieldLabel}>Expiry date (optional)</Text>
          <TextInput
            style={styles.input}
            value={expiryDate}
            onChangeText={setExpiryDate}
            placeholder="YYYY-MM-DD"
            placeholderTextColor={COLORS.muted}
            keyboardType="numbers-and-punctuation"
          />

          {/* Notes */}
          <Text style={styles.fieldLabel}>Notes (optional)</Text>
          <TextInput
            style={[styles.input, styles.inputMultiline]}
            value={notes}
            onChangeText={setNotes}
            placeholder="Any extra details..."
            placeholderTextColor={COLORS.muted}
            multiline
            numberOfLines={3}
          />

          <Pressable
            onPress={handleSubmit}
            style={({ pressed }) => [styles.submitBtn, pressed && { opacity: 0.85 }]}
            accessibilityRole="button"
            accessibilityLabel="Save document"
          >
            <Text style={styles.submitBtnText}>Save document</Text>
          </Pressable>
        </Pressable>
      </Pressable>
    </Modal>
  );
}

// ---------------------------------------------------------------------------
// Main Screen
// ---------------------------------------------------------------------------
export default function DocumentVaultScreen() {
  const router = useRouter();
  const insets = useSafeAreaInsets();
  const { t } = useTranslation();
  const params = useLocalSearchParams<{ tripId?: string }>();
  const trips = useAppStore((s) => s.trips);
  const activeTripId = useAppStore((s) => s.activeTripId);

  const tripId = params.tripId ?? activeTripId ?? trips[0]?.id ?? null;
  const { docs, expiring, loading, add, remove } = useDocumentVault(tripId);
  const [showAdd, setShowAdd] = useState(false);

  const grouped = useMemo(() => {
    const map: Record<DocType, TripDocument[]> = {
      passport: [], visa: [], insurance: [], booking: [],
      ticket: [], reservation: [], vaccination: [], other: [],
    };
    for (const doc of docs) {
      const bucket = map[doc.docType];
      if (bucket) bucket.push(doc);
    }
    return map;
  }, [docs]);

  const handleAdd = useCallback(
    async (doc: { docType: DocType; title: string; notes?: string; expiryDate?: string }) => {
      await add(doc);
    },
    [add],
  );

  const handleDelete = useCallback(
    async (id: string) => {
      Haptics.notificationAsync(Haptics.NotificationFeedbackType.Warning);
      await remove(id);
    },
    [remove],
  );

  return (
    <View style={[styles.screen, { paddingTop: insets.top }]}>
      {/* Header */}
      <View style={styles.header}>
        <Pressable
          onPress={() => { Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light); router.back(); }}
          hitSlop={12}
          style={({ pressed }) => [styles.headerBtn, { opacity: pressed ? 0.6 : 1 }]}
          accessibilityLabel="Go back"
        >
          <ArrowLeft size={22} color={COLORS.cream} strokeWidth={1.5} />
        </Pressable>
        <Text style={styles.headerTitle}>
          {t('documentVault.title', { defaultValue: 'Trip documents' })}
        </Text>
        <View style={{ width: 44 }} />
      </View>

      <ScrollView
        style={styles.scroll}
        contentContainerStyle={[styles.scrollContent, { paddingBottom: insets.bottom + 100 }]}
        showsVerticalScrollIndicator={false}
      >
        {/* Expiry warning banner */}
        {expiring.length > 0 && (
          <View style={styles.expiryBanner}>
            <AlertTriangle size={18} color={COLORS.coral} strokeWidth={1.5} />
            <Text style={styles.expiryBannerText}>
              {expiring.length === 1
                ? `Your ${expiring[0].docType} expires in ${daysUntil(expiring[0].expiryDate!)} days`
                : `${expiring.length} documents expiring within 30 days`}
            </Text>
          </View>
        )}

        {/* No trip fallback */}
        {!tripId && (
          <View style={styles.emptyState}>
            <FolderOpen size={40} color={COLORS.muted} strokeWidth={1} />
            <Text style={styles.emptyTitle}>No trip selected</Text>
            <Text style={styles.emptySub}>Plan a trip first to store documents</Text>
          </View>
        )}

        {/* Loading */}
        {tripId && loading && (
          <View style={styles.loadingWrap}>
            <Text style={styles.loadingText}>Loading documents...</Text>
          </View>
        )}

        {/* Document sections */}
        {tripId && !loading && (
          <>
            {DOC_TYPES.map((dt) => (
              <DocSection
                key={dt}
                docType={dt}
                documents={grouped[dt]}
                onDelete={handleDelete}
              />
            ))}

            {docs.length === 0 && (
              <View style={styles.emptyState}>
                <FolderOpen size={40} color={COLORS.muted} strokeWidth={1} />
                <Text style={styles.emptyTitle}>No documents yet</Text>
                <Text style={styles.emptySub}>
                  Tap the + button to add passports, visas, bookings, and more
                </Text>
              </View>
            )}
          </>
        )}
      </ScrollView>

      {/* FAB */}
      {tripId && (
        <Pressable
          onPress={() => {
            Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Medium);
            setShowAdd(true);
          }}
          style={({ pressed }) => [
            styles.fab,
            { bottom: insets.bottom + 24 },
            pressed && { transform: [{ scale: 0.95 }] },
          ]}
          accessibilityRole="button"
          accessibilityLabel="Add document"
        >
          <Plus size={24} color={COLORS.bg} strokeWidth={2} />
        </Pressable>
      )}

      <AddDocumentModal
        visible={showAdd}
        onClose={() => setShowAdd(false)}
        onAdd={handleAdd}
      />
    </View>
  );
}

// ---------------------------------------------------------------------------
// Styles
// ---------------------------------------------------------------------------
const styles = StyleSheet.create({
  screen: {
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
  headerBtn: {
    width: 44,
    height: 44,
    borderRadius: RADIUS.md,
    backgroundColor: COLORS.surface1,
    alignItems: 'center',
    justifyContent: 'center',
  } as ViewStyle,
  headerTitle: {
    fontFamily: FONTS.header,
    fontSize: 24,
    color: COLORS.cream,
    flex: 1,
    textAlign: 'center',
  } as TextStyle,
  scroll: { flex: 1 } as ViewStyle,
  scrollContent: {
    paddingHorizontal: 20,
    paddingTop: SPACING.sm,
  } as ViewStyle,

  // Expiry banner
  expiryBanner: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: SPACING.sm,
    backgroundColor: COLORS.coralSubtle,
    borderWidth: 1,
    borderColor: COLORS.coralBorder,
    borderRadius: RADIUS.md,
    paddingVertical: SPACING.sm + 2,
    paddingHorizontal: SPACING.md,
    marginBottom: SPACING.md,
  } as ViewStyle,
  expiryBannerText: {
    fontFamily: FONTS.bodyMedium,
    fontSize: 13,
    color: COLORS.coral,
    flex: 1,
  } as TextStyle,

  // Sections
  section: {
    marginBottom: SPACING.sm,
  } as ViewStyle,
  sectionHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingVertical: SPACING.sm + 2,
  } as ViewStyle,
  sectionHeaderLeft: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: SPACING.sm,
  } as ViewStyle,
  sectionTitle: {
    fontFamily: FONTS.headerMedium,
    fontSize: 15,
    color: COLORS.cream,
  } as TextStyle,
  countBadge: {
    backgroundColor: COLORS.sageSubtle,
    borderRadius: RADIUS.pill,
    paddingHorizontal: 8,
    paddingVertical: 2,
  } as ViewStyle,
  countBadgeText: {
    fontFamily: FONTS.mono,
    fontSize: 11,
    color: COLORS.sage,
  } as TextStyle,
  sectionDocs: {
    gap: SPACING.xs,
    paddingBottom: SPACING.xs,
  } as ViewStyle,

  // Document card
  docCard: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    backgroundColor: COLORS.surface1,
    borderRadius: RADIUS.md,
    borderWidth: 1,
    borderColor: COLORS.border,
    paddingVertical: SPACING.sm + 2,
    paddingHorizontal: SPACING.md,
  } as ViewStyle,
  docCardLeft: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: SPACING.sm,
    flex: 1,
  } as ViewStyle,
  docCardInfo: {
    flex: 1,
  } as ViewStyle,
  docTitle: {
    fontFamily: FONTS.bodyMedium,
    fontSize: 14,
    color: COLORS.cream,
  } as TextStyle,
  docExpiry: {
    fontFamily: FONTS.mono,
    fontSize: 11,
    color: COLORS.muted,
    marginTop: 2,
  } as TextStyle,
  docExpiryUrgent: {
    color: COLORS.coral,
  } as TextStyle,
  docNotes: {
    fontFamily: FONTS.body,
    fontSize: 12,
    color: COLORS.muted,
    marginTop: 2,
  } as TextStyle,
  emptyText: {
    fontFamily: FONTS.body,
    fontSize: 13,
    color: COLORS.muted,
    paddingVertical: SPACING.xs,
    paddingLeft: 26,
  } as TextStyle,

  // Empty state
  emptyState: {
    alignItems: 'center',
    paddingVertical: SPACING.xxl,
    gap: SPACING.sm,
  } as ViewStyle,
  emptyTitle: {
    fontFamily: FONTS.headerMedium,
    fontSize: 17,
    color: COLORS.cream,
  } as TextStyle,
  emptySub: {
    fontFamily: FONTS.body,
    fontSize: 13,
    color: COLORS.muted,
    textAlign: 'center',
    paddingHorizontal: SPACING.xl,
  } as TextStyle,

  // Loading
  loadingWrap: {
    paddingVertical: SPACING.xxl,
    alignItems: 'center',
  } as ViewStyle,
  loadingText: {
    fontFamily: FONTS.body,
    fontSize: 14,
    color: COLORS.muted,
  } as TextStyle,

  // FAB
  fab: {
    position: 'absolute',
    right: 24,
    width: 56,
    height: 56,
    borderRadius: 28,
    backgroundColor: COLORS.sage,
    alignItems: 'center',
    justifyContent: 'center',
    shadowColor: COLORS.black,
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.3,
    shadowRadius: 12,
    elevation: 8,
  } as ViewStyle,

  // Modal
  modalOverlay: {
    flex: 1,
    backgroundColor: COLORS.overlay,
    justifyContent: 'flex-end',
  } as ViewStyle,
  modalSheet: {
    backgroundColor: COLORS.surface2,
    borderTopLeftRadius: 20,
    borderTopRightRadius: 20,
    paddingHorizontal: 20,
    paddingBottom: 40,
    maxHeight: '85%',
  } as ViewStyle,
  modalHandle: {
    width: 40,
    height: 4,
    borderRadius: 2,
    backgroundColor: COLORS.muted,
    alignSelf: 'center',
    marginTop: SPACING.sm,
    marginBottom: SPACING.md,
  } as ViewStyle,
  modalHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    marginBottom: SPACING.md,
  } as ViewStyle,
  modalTitle: {
    fontFamily: FONTS.header,
    fontSize: 20,
    color: COLORS.cream,
  } as TextStyle,

  // Form
  fieldLabel: {
    fontFamily: FONTS.mono,
    fontSize: 11,
    color: COLORS.muted,
    textTransform: 'uppercase',
    letterSpacing: 1,
    marginTop: SPACING.md,
    marginBottom: SPACING.xs,
  } as TextStyle,
  typePicker: {
    gap: SPACING.xs,
    paddingVertical: SPACING.xs,
  } as ViewStyle,
  typeChip: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
    paddingHorizontal: SPACING.sm + 4,
    paddingVertical: 6,
    borderRadius: RADIUS.pill,
    borderWidth: 1,
    borderColor: COLORS.border,
    backgroundColor: COLORS.surface1,
  } as ViewStyle,
  typeChipSelected: {
    borderColor: COLORS.sageBorder,
    backgroundColor: COLORS.sageSubtle,
  } as ViewStyle,
  typeChipText: {
    fontFamily: FONTS.bodyMedium,
    fontSize: 12,
    color: COLORS.muted,
  } as TextStyle,
  typeChipTextSelected: {
    color: COLORS.sage,
  } as TextStyle,
  input: {
    backgroundColor: COLORS.surface1,
    borderRadius: RADIUS.md,
    borderWidth: 1,
    borderColor: COLORS.border,
    paddingHorizontal: SPACING.md,
    paddingVertical: SPACING.sm + 2,
    fontFamily: FONTS.body,
    fontSize: 14,
    color: COLORS.cream,
  } as TextStyle,
  inputMultiline: {
    minHeight: 72,
    textAlignVertical: 'top',
  } as TextStyle,
  submitBtn: {
    backgroundColor: COLORS.sage,
    borderRadius: RADIUS.pill,
    paddingVertical: SPACING.md,
    alignItems: 'center',
    marginTop: SPACING.lg,
  } as ViewStyle,
  submitBtnText: {
    fontFamily: FONTS.headerMedium,
    fontSize: 15,
    color: COLORS.bg,
  } as TextStyle,
});
