// =============================================================================
// ROAM — Emergency Medical Card Screen
// One-tap shareable card showing critical health info in the local language.
// If you are unconscious in a foreign hospital, this saves your life.
// =============================================================================
import React, { useCallback, useEffect, useMemo, useState } from 'react';
import {
  View,
  Text,
  ScrollView,
  Pressable,
  TextInput,
  StyleSheet,
  Linking,
  Alert,
  type ViewStyle,
  type TextStyle,
} from 'react-native';
import { useRouter, useLocalSearchParams } from 'expo-router';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import * as Clipboard from 'expo-clipboard';
import * as Haptics from '../lib/haptics';
import { withComingSoon } from '../lib/with-coming-soon';
import {
  ChevronLeft,
  Heart,
  Phone,
  Copy,
  Pencil,
  Shield,
  AlertTriangle,
  Pill,
  Activity,
  User,
  ChevronDown,
} from 'lucide-react-native';
import { COLORS, FONTS, SPACING, RADIUS } from '../lib/constants';
import {
  BLOOD_TYPES,
  MEDICAL_TRANSLATIONS,
  LANGUAGE_NAMES,
  getEmergencyCard,
  saveEmergencyCard,
  getDestinationLanguageCode,
  getTranslatedPhrase,
} from '../lib/emergency-card';
import type { BloodType, EmergencyCardData } from '../lib/emergency-card';

// -----------------------------------------------------------------------------
// Blood type picker
// -----------------------------------------------------------------------------
function BloodTypePicker({
  value,
  onSelect,
}: {
  value: BloodType;
  onSelect: (bt: BloodType) => void;
}) {
  return (
    <View style={styles.bloodTypeRow}>
      {BLOOD_TYPES.map((bt) => {
        const active = bt === value;
        return (
          <Pressable
            key={bt}
            onPress={() => {
              Haptics.selectionAsync();
              onSelect(bt);
            }}
            style={[
              styles.bloodTypeChip,
              active ? styles.bloodTypeChipActive : undefined,
            ]}
          >
            <Text
              style={[
                styles.bloodTypeChipText,
                active ? styles.bloodTypeChipTextActive : undefined,
              ]}
            >
              {bt === 'unknown' ? '?' : bt}
            </Text>
          </Pressable>
        );
      })}
    </View>
  );
}

// -----------------------------------------------------------------------------
// Setup form
// -----------------------------------------------------------------------------
interface FormState {
  fullName: string;
  bloodType: BloodType;
  allergies: string;
  medications: string;
  conditions: string;
  contactName: string;
  contactPhone: string;
  contactRelationship: string;
  insuranceProvider: string;
  insuranceNumber: string;
  nationality: string;
  passportNumber: string;
}

const EMPTY_FORM: FormState = {
  fullName: '',
  bloodType: 'unknown',
  allergies: '',
  medications: '',
  conditions: '',
  contactName: '',
  contactPhone: '',
  contactRelationship: '',
  insuranceProvider: '',
  insuranceNumber: '',
  nationality: '',
  passportNumber: '',
};

function formFromCard(card: EmergencyCardData): FormState {
  return {
    fullName: card.fullName,
    bloodType: card.bloodType,
    allergies: card.allergies.join(', '),
    medications: card.medications.join(', '),
    conditions: card.conditions.join(', '),
    contactName: card.emergencyContact.name,
    contactPhone: card.emergencyContact.phone,
    contactRelationship: card.emergencyContact.relationship,
    insuranceProvider: card.insuranceProvider,
    insuranceNumber: card.insuranceNumber,
    nationality: card.nationality,
    passportNumber: card.passportNumber,
  };
}

function cardFromForm(form: FormState): EmergencyCardData {
  const split = (s: string): string[] =>
    s
      .split(',')
      .map((x) => x.trim())
      .filter(Boolean);
  return {
    fullName: form.fullName.trim(),
    bloodType: form.bloodType,
    allergies: split(form.allergies),
    medications: split(form.medications),
    conditions: split(form.conditions),
    emergencyContact: {
      name: form.contactName.trim(),
      phone: form.contactPhone.trim(),
      relationship: form.contactRelationship.trim(),
    },
    insuranceProvider: form.insuranceProvider.trim(),
    insuranceNumber: form.insuranceNumber.trim(),
    nationality: form.nationality.trim(),
    passportNumber: form.passportNumber.trim(),
  };
}

// -----------------------------------------------------------------------------
// Card display — translated phrase row
// -----------------------------------------------------------------------------
function TranslatedRow({
  english,
  translated,
  detail,
}: {
  english: string;
  translated: string;
  detail?: string;
}) {
  return (
    <View style={styles.translatedRow}>
      <Text style={styles.translatedEnglish}>
        {english}
        {detail ? ` ${detail}` : ''}
      </Text>
      <Text style={styles.translatedLocal}>
        {translated}
        {detail ? ` ${detail}` : ''}
      </Text>
    </View>
  );
}

// -----------------------------------------------------------------------------
// Main screen
// -----------------------------------------------------------------------------
function EmergencyCardScreen() {
  const router = useRouter();
  const insets = useSafeAreaInsets();
  const { destination } = useLocalSearchParams<{ destination?: string }>();

  const [card, setCard] = useState<EmergencyCardData | null>(null);
  const [loading, setLoading] = useState(true);
  const [editing, setEditing] = useState(false);
  const [form, setForm] = useState<FormState>(EMPTY_FORM);
  const [bloodPickerOpen, setBloodPickerOpen] = useState(false);

  // Load saved card on mount
  useEffect(() => {
    let mounted = true;
    getEmergencyCard().then((data) => {
      if (!mounted) return;
      if (data) {
        setCard(data);
        setForm(formFromCard(data));
      }
      setLoading(false);
    });
    return () => {
      mounted = false;
    };
  }, []);

  const langCode = useMemo(
    () => (destination ? getDestinationLanguageCode(destination) : null),
    [destination]
  );

  const langName = useMemo(
    () => (langCode ? LANGUAGE_NAMES[langCode] ?? null : null),
    [langCode]
  );

  // Handlers
  const updateField = useCallback(
    <K extends keyof FormState>(key: K, value: FormState[K]) => {
      setForm((prev) => ({ ...prev, [key]: value }));
    },
    []
  );

  const handleSave = useCallback(async () => {
    if (!form.fullName.trim()) {
      Alert.alert('Required', 'Please enter your full name.');
      return;
    }
    Haptics.notificationAsync(Haptics.NotificationFeedbackType.Success);
    const newCard = cardFromForm(form);
    await saveEmergencyCard(newCard);
    setCard(newCard);
    setEditing(false);
  }, [form]);

  const handleEdit = useCallback(() => {
    Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
    if (card) setForm(formFromCard(card));
    setEditing(true);
  }, [card]);

  const handleCallContact = useCallback(() => {
    if (!card?.emergencyContact.phone) return;
    Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Heavy);
    Linking.openURL(`tel:${card.emergencyContact.phone}`);
  }, [card]);

  const handleCopy = useCallback(async () => {
    if (!card) return;
    Haptics.notificationAsync(Haptics.NotificationFeedbackType.Success);
    const lines = [
      'EMERGENCY MEDICAL CARD',
      '',
      `Name: ${card.fullName}`,
      `Nationality: ${card.nationality}`,
      `Blood Type: ${card.bloodType}`,
      '',
      `Allergies: ${card.allergies.length > 0 ? card.allergies.join(', ') : 'None listed'}`,
      `Medications: ${card.medications.length > 0 ? card.medications.join(', ') : 'None listed'}`,
      `Conditions: ${card.conditions.length > 0 ? card.conditions.join(', ') : 'None listed'}`,
      '',
      `Emergency Contact: ${card.emergencyContact.name} (${card.emergencyContact.relationship})`,
      `Phone: ${card.emergencyContact.phone}`,
      '',
      `Insurance: ${card.insuranceProvider} - ${card.insuranceNumber}`,
      `Passport: ${card.passportNumber}`,
    ];
    await Clipboard.setStringAsync(lines.join('\n'));
    Alert.alert('Copied', 'Emergency card copied to clipboard.');
  }, [card]);

  const handleBack = useCallback(() => {
    Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
    router.back();
  }, [router]);

  // Determine mode
  const showSetup = !card || editing;

  if (loading) {
    return (
      <View style={[styles.container, { paddingTop: insets.top }]}>
        <Text style={styles.loadingText}>Loading...</Text>
      </View>
    );
  }

  return (
    <View style={[styles.container, { paddingTop: insets.top }]}>
      {/* Header bar */}
      <View style={styles.headerBar}>
        <Pressable onPress={handleBack} hitSlop={12}>
          <ChevronLeft size={24} color={COLORS.cream} strokeWidth={2} />
        </Pressable>
        <Text style={styles.headerTitle}>Emergency Card</Text>
        <View style={{ width: 24 }} />
      </View>

      <ScrollView
        style={styles.scroll}
        contentContainerStyle={[
          styles.scrollContent,
          { paddingBottom: insets.bottom + SPACING.xl },
        ]}
        showsVerticalScrollIndicator={false}
      >
        {showSetup ? (
          <SetupForm
            form={form}
            updateField={updateField}
            bloodPickerOpen={bloodPickerOpen}
            setBloodPickerOpen={setBloodPickerOpen}
            onSave={handleSave}
            isEditing={editing}
            onCancel={
              editing
                ? () => {
                    setEditing(false);
                  }
                : undefined
            }
          />
        ) : (
          <CardDisplay
            card={card}
            destination={destination ?? null}
            langCode={langCode}
            langName={langName}
            onEdit={handleEdit}
            onCall={handleCallContact}
            onCopy={handleCopy}
          />
        )}
      </ScrollView>
    </View>
  );
}

// -----------------------------------------------------------------------------
// Setup form component
// -----------------------------------------------------------------------------
function SetupForm({
  form,
  updateField,
  bloodPickerOpen,
  setBloodPickerOpen,
  onSave,
  isEditing,
  onCancel,
}: {
  form: FormState;
  updateField: <K extends keyof FormState>(key: K, value: FormState[K]) => void;
  bloodPickerOpen: boolean;
  setBloodPickerOpen: (v: boolean) => void;
  onSave: () => void;
  isEditing: boolean;
  onCancel?: () => void;
}) {
  return (
    <View>
      {/* Privacy note */}
      <View style={styles.privacyNote}>
        <Shield size={16} color={COLORS.sage} strokeWidth={2} />
        <Text style={styles.privacyText}>
          This data stays on your device only. It is never uploaded or shared
          with any server.
        </Text>
      </View>

      {/* Full Name */}
      <Text style={styles.formLabel}>Full Name</Text>
      <TextInput
        style={styles.input}
        value={form.fullName}
        onChangeText={(v) => updateField('fullName', v)}
        placeholder="As on passport"
        placeholderTextColor={COLORS.creamDim}
        autoCapitalize="words"
      />

      {/* Blood Type */}
      <Pressable
        onPress={() => {
          Haptics.selectionAsync();
          setBloodPickerOpen(!bloodPickerOpen);
        }}
        style={styles.pickerHeader}
      >
        <Text style={styles.formLabel}>
          Blood Type:{' '}
          <Text style={styles.bloodTypeValue}>
            {form.bloodType === 'unknown' ? 'Not set' : form.bloodType}
          </Text>
        </Text>
        <ChevronDown
          size={16}
          color={COLORS.creamDim}
          strokeWidth={2}
          style={{
            transform: [{ rotate: bloodPickerOpen ? '180deg' : '0deg' }],
          }}
        />
      </Pressable>
      {bloodPickerOpen ? (
        <BloodTypePicker
          value={form.bloodType}
          onSelect={(bt) => {
            updateField('bloodType', bt);
            setBloodPickerOpen(false);
          }}
        />
      ) : null}

      {/* Allergies */}
      <Text style={styles.formLabel}>Allergies</Text>
      <TextInput
        style={styles.input}
        value={form.allergies}
        onChangeText={(v) => updateField('allergies', v)}
        placeholder="Penicillin, shellfish, nuts (comma-separated)"
        placeholderTextColor={COLORS.creamDim}
      />

      {/* Medications */}
      <Text style={styles.formLabel}>Medications</Text>
      <TextInput
        style={styles.input}
        value={form.medications}
        onChangeText={(v) => updateField('medications', v)}
        placeholder="Metformin 500mg, Lisinopril (comma-separated)"
        placeholderTextColor={COLORS.creamDim}
      />

      {/* Medical Conditions */}
      <Text style={styles.formLabel}>Medical Conditions</Text>
      <TextInput
        style={styles.input}
        value={form.conditions}
        onChangeText={(v) => updateField('conditions', v)}
        placeholder="Diabetes, asthma (comma-separated)"
        placeholderTextColor={COLORS.creamDim}
      />

      {/* Emergency Contact */}
      <Text style={styles.sectionTitle}>Emergency Contact</Text>
      <TextInput
        style={styles.input}
        value={form.contactName}
        onChangeText={(v) => updateField('contactName', v)}
        placeholder="Contact name"
        placeholderTextColor={COLORS.creamDim}
        autoCapitalize="words"
      />
      <TextInput
        style={styles.input}
        value={form.contactPhone}
        onChangeText={(v) => updateField('contactPhone', v)}
        placeholder="Phone with country code (+1 555 123 4567)"
        placeholderTextColor={COLORS.creamDim}
        keyboardType="phone-pad"
      />
      <TextInput
        style={styles.input}
        value={form.contactRelationship}
        onChangeText={(v) => updateField('contactRelationship', v)}
        placeholder="Relationship (spouse, parent, etc.)"
        placeholderTextColor={COLORS.creamDim}
      />

      {/* Insurance */}
      <Text style={styles.sectionTitle}>Insurance</Text>
      <TextInput
        style={styles.input}
        value={form.insuranceProvider}
        onChangeText={(v) => updateField('insuranceProvider', v)}
        placeholder="Insurance provider"
        placeholderTextColor={COLORS.creamDim}
      />
      <TextInput
        style={styles.input}
        value={form.insuranceNumber}
        onChangeText={(v) => updateField('insuranceNumber', v)}
        placeholder="Policy number"
        placeholderTextColor={COLORS.creamDim}
      />

      {/* Travel Document */}
      <Text style={styles.sectionTitle}>Travel Document</Text>
      <TextInput
        style={styles.input}
        value={form.nationality}
        onChangeText={(v) => updateField('nationality', v)}
        placeholder="Nationality"
        placeholderTextColor={COLORS.creamDim}
        autoCapitalize="words"
      />
      <TextInput
        style={styles.input}
        value={form.passportNumber}
        onChangeText={(v) => updateField('passportNumber', v)}
        placeholder="Passport number"
        placeholderTextColor={COLORS.creamDim}
        autoCapitalize="characters"
      />

      {/* Actions */}
      <Pressable
        onPress={onSave}
        style={({ pressed }) => [
          styles.saveButton,
          { opacity: pressed ? 0.85 : 1 },
        ]}
      >
        <Text style={styles.saveButtonText}>
          {isEditing ? 'Update Card' : 'Save Card'}
        </Text>
      </Pressable>

      {onCancel ? (
        <Pressable
          onPress={onCancel}
          style={({ pressed }) => [
            styles.cancelButton,
            { opacity: pressed ? 0.85 : 1 },
          ]}
        >
          <Text style={styles.cancelButtonText}>Cancel</Text>
        </Pressable>
      ) : null}
    </View>
  );
}

// -----------------------------------------------------------------------------
// Card display component
// -----------------------------------------------------------------------------
function CardDisplay({
  card,
  destination,
  langCode,
  langName,
  onEdit,
  onCall,
  onCopy,
}: {
  card: EmergencyCardData;
  destination: string | null;
  langCode: string | null;
  langName: string | null;
  onEdit: () => void;
  onCall: () => void;
  onCopy: () => void;
}) {
  // Build translated phrases if destination language is available
  const translatedPhrases = useMemo(() => {
    if (!destination || !langCode) return null;
    const phrases: { english: string; translated: string; detail?: string }[] =
      [];

    // Blood type
    const bloodTr = getTranslatedPhrase('My blood type is', destination);
    if (bloodTr) {
      phrases.push({
        english: 'My blood type is',
        translated: bloodTr,
        detail: card.bloodType === 'unknown' ? undefined : card.bloodType,
      });
    }

    // Allergies
    if (card.allergies.length > 0) {
      const allergyTr = getTranslatedPhrase('I am allergic to', destination);
      if (allergyTr) {
        phrases.push({
          english: 'I am allergic to',
          translated: allergyTr,
          detail: card.allergies.join(', '),
        });
      }
    }

    // Medications
    if (card.medications.length > 0) {
      const medTr = getTranslatedPhrase(
        'I take this medication',
        destination
      );
      if (medTr) {
        phrases.push({
          english: 'I take this medication',
          translated: medTr,
          detail: card.medications.join(', '),
        });
      }
    }

    // Conditions
    if (card.conditions.length > 0) {
      const condTr = getTranslatedPhrase(
        'I have a medical condition',
        destination
      );
      if (condTr) {
        phrases.push({
          english: 'I have a medical condition',
          translated: condTr,
          detail: card.conditions.join(', '),
        });
      }
    }

    // Emergency contact
    const callTr = getTranslatedPhrase(
      'Please call my emergency contact',
      destination
    );
    if (callTr) {
      phrases.push({
        english: 'Please call my emergency contact',
        translated: callTr,
      });
    }

    return phrases.length > 0 ? phrases : null;
  }, [destination, langCode, card]);

  return (
    <View>
      {/* Card header */}
      <View style={styles.cardHeader}>
        <Heart size={24} color={COLORS.coral} strokeWidth={2} />
        <Text style={styles.cardTitle}>EMERGENCY MEDICAL CARD</Text>
      </View>

      {/* Patient info */}
      <View style={styles.cardSection}>
        <View style={styles.cardSectionHeader}>
          <User size={18} color={COLORS.sage} strokeWidth={2} />
          <Text style={styles.cardSectionTitle}>Patient Information</Text>
        </View>
        <InfoRow label="Name" value={card.fullName} />
        <InfoRow label="Nationality" value={card.nationality} />
        <View style={styles.bloodTypeDisplay}>
          <Text style={styles.infoLabel}>Blood Type</Text>
          <Text style={styles.bloodTypeLarge}>
            {card.bloodType === 'unknown' ? 'Unknown' : card.bloodType}
          </Text>
        </View>
        {card.passportNumber ? (
          <InfoRow label="Passport" value={card.passportNumber} />
        ) : null}
      </View>

      {/* Allergies */}
      <View style={styles.cardSection}>
        <View style={styles.cardSectionHeader}>
          <AlertTriangle size={18} color={COLORS.coral} strokeWidth={2} />
          <Text style={[styles.cardSectionTitle, { color: COLORS.coral }]}>
            Allergies
          </Text>
        </View>
        {card.allergies.length > 0 ? (
          card.allergies.map((a) => (
            <Text key={a} style={styles.allergyItem}>
              {a}
            </Text>
          ))
        ) : (
          <Text style={styles.noneText}>None listed</Text>
        )}
      </View>

      {/* Medications */}
      <View style={styles.cardSection}>
        <View style={styles.cardSectionHeader}>
          <Pill size={18} color={COLORS.sage} strokeWidth={2} />
          <Text style={styles.cardSectionTitle}>Medications</Text>
        </View>
        {card.medications.length > 0 ? (
          card.medications.map((m) => (
            <Text key={m} style={styles.medItem}>
              {m}
            </Text>
          ))
        ) : (
          <Text style={styles.noneText}>None listed</Text>
        )}
      </View>

      {/* Conditions */}
      <View style={styles.cardSection}>
        <View style={styles.cardSectionHeader}>
          <Activity size={18} color={COLORS.sage} strokeWidth={2} />
          <Text style={styles.cardSectionTitle}>Medical Conditions</Text>
        </View>
        {card.conditions.length > 0 ? (
          card.conditions.map((c) => (
            <Text key={c} style={styles.conditionItem}>
              {c}
            </Text>
          ))
        ) : (
          <Text style={styles.noneText}>None listed</Text>
        )}
      </View>

      {/* Emergency contact */}
      <View style={styles.cardSection}>
        <View style={styles.cardSectionHeader}>
          <Phone size={18} color={COLORS.coral} strokeWidth={2} />
          <Text style={[styles.cardSectionTitle, { color: COLORS.coral }]}>
            Emergency Contact
          </Text>
        </View>
        <InfoRow label="Name" value={card.emergencyContact.name} />
        <InfoRow label="Phone" value={card.emergencyContact.phone} />
        <InfoRow
          label="Relationship"
          value={card.emergencyContact.relationship}
        />
      </View>

      {/* Insurance */}
      {(card.insuranceProvider || card.insuranceNumber) ? (
        <View style={styles.cardSection}>
          <View style={styles.cardSectionHeader}>
            <Shield size={18} color={COLORS.sage} strokeWidth={2} />
            <Text style={styles.cardSectionTitle}>Insurance</Text>
          </View>
          {card.insuranceProvider ? (
            <InfoRow label="Provider" value={card.insuranceProvider} />
          ) : null}
          {card.insuranceNumber ? (
            <InfoRow label="Policy" value={card.insuranceNumber} />
          ) : null}
        </View>
      ) : null}

      {/* Call emergency contact button */}
      {card.emergencyContact.phone ? (
        <Pressable
          onPress={onCall}
          style={({ pressed }) => [
            styles.callButton,
            { opacity: pressed ? 0.85 : 1 },
          ]}
        >
          <Phone size={20} color={COLORS.white} strokeWidth={2} />
          <Text style={styles.callButtonText}>Call Emergency Contact</Text>
        </Pressable>
      ) : null}

      {/* Translated phrases */}
      {translatedPhrases && langName ? (
        <View style={styles.translationSection}>
          <Text style={styles.translationHeader}>
            Show to Medical Staff ({langName})
          </Text>
          <Text style={styles.translationSubtext}>
            These phrases are translated for your destination. Show this screen
            to hospital staff if needed.
          </Text>
          {translatedPhrases.map((p) => (
            <TranslatedRow
              key={p.english}
              english={p.english}
              translated={p.translated}
              detail={p.detail}
            />
          ))}
        </View>
      ) : null}

      {/* Action row */}
      <View style={styles.actionRow}>
        <Pressable
          onPress={onEdit}
          style={({ pressed }) => [
            styles.actionButton,
            { opacity: pressed ? 0.85 : 1 },
          ]}
        >
          <Pencil size={18} color={COLORS.cream} strokeWidth={2} />
          <Text style={styles.actionButtonText}>Edit</Text>
        </Pressable>
        <Pressable
          onPress={onCopy}
          style={({ pressed }) => [
            styles.actionButton,
            { opacity: pressed ? 0.85 : 1 },
          ]}
        >
          <Copy size={18} color={COLORS.cream} strokeWidth={2} />
          <Text style={styles.actionButtonText}>Copy</Text>
        </Pressable>
      </View>
    </View>
  );
}

// -----------------------------------------------------------------------------
// Info row helper
// -----------------------------------------------------------------------------
function InfoRow({ label, value }: { label: string; value: string }) {
  if (!value) return null;
  return (
    <View style={styles.infoRow}>
      <Text style={styles.infoLabel}>{label}</Text>
      <Text style={styles.infoValue}>{value}</Text>
    </View>
  );
}

// -----------------------------------------------------------------------------
// Styles
// -----------------------------------------------------------------------------
const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: COLORS.bg,
  } as ViewStyle,
  loadingText: {
    fontFamily: FONTS.body,
    fontSize: 14,
    color: COLORS.creamDim,
    textAlign: 'center',
    marginTop: SPACING.xxl,
  } as TextStyle,
  headerBar: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: SPACING.md,
    paddingVertical: SPACING.sm,
  } as ViewStyle,
  headerTitle: {
    fontFamily: FONTS.header,
    fontSize: 20,
    color: COLORS.cream,
  } as TextStyle,
  scroll: {
    flex: 1,
  } as ViewStyle,
  scrollContent: {
    paddingHorizontal: SPACING.md,
  } as ViewStyle,

  // Privacy note
  privacyNote: {
    flexDirection: 'row',
    alignItems: 'flex-start',
    backgroundColor: COLORS.sageSubtle,
    borderRadius: RADIUS.md,
    padding: SPACING.md,
    marginBottom: SPACING.lg,
    gap: SPACING.sm,
  } as ViewStyle,
  privacyText: {
    flex: 1,
    fontFamily: FONTS.body,
    fontSize: 13,
    color: COLORS.sage,
    lineHeight: 18,
  } as TextStyle,

  // Form
  formLabel: {
    fontFamily: FONTS.mono,
    fontSize: 12,
    color: COLORS.creamDim,
    letterSpacing: 0.5,
    marginBottom: SPACING.xs,
    marginTop: SPACING.md,
  } as TextStyle,
  sectionTitle: {
    fontFamily: FONTS.headerMedium,
    fontSize: 18,
    color: COLORS.cream,
    marginTop: SPACING.lg,
    marginBottom: SPACING.xs,
  } as TextStyle,
  input: {
    fontFamily: FONTS.body,
    fontSize: 15,
    color: COLORS.cream,
    backgroundColor: COLORS.bgElevated,
    borderRadius: RADIUS.sm,
    borderWidth: 1,
    borderColor: COLORS.border,
    paddingHorizontal: SPACING.md,
    paddingVertical: SPACING.sm + 2,
    marginBottom: SPACING.sm,
  } as TextStyle,
  pickerHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    marginTop: SPACING.md,
    marginBottom: SPACING.xs,
  } as ViewStyle,
  bloodTypeValue: {
    fontFamily: FONTS.bodySemiBold,
    color: COLORS.coral,
  } as TextStyle,
  bloodTypeRow: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: SPACING.sm,
    marginBottom: SPACING.sm,
  } as ViewStyle,
  bloodTypeChip: {
    paddingHorizontal: SPACING.md,
    paddingVertical: SPACING.sm,
    borderRadius: RADIUS.sm,
    backgroundColor: COLORS.bgElevated,
    borderWidth: 1,
    borderColor: COLORS.border,
  } as ViewStyle,
  bloodTypeChipActive: {
    backgroundColor: COLORS.coralSubtle,
    borderColor: COLORS.coralBorder,
  } as ViewStyle,
  bloodTypeChipText: {
    fontFamily: FONTS.mono,
    fontSize: 14,
    color: COLORS.creamDim,
  } as TextStyle,
  bloodTypeChipTextActive: {
    color: COLORS.coral,
  } as TextStyle,
  saveButton: {
    backgroundColor: COLORS.sage,
    borderRadius: RADIUS.md,
    paddingVertical: SPACING.md,
    alignItems: 'center',
    marginTop: SPACING.lg,
  } as ViewStyle,
  saveButtonText: {
    fontFamily: FONTS.bodySemiBold,
    fontSize: 16,
    color: COLORS.bg,
  } as TextStyle,
  cancelButton: {
    borderRadius: RADIUS.md,
    paddingVertical: SPACING.md,
    alignItems: 'center',
    marginTop: SPACING.sm,
    borderWidth: 1,
    borderColor: COLORS.border,
  } as ViewStyle,
  cancelButtonText: {
    fontFamily: FONTS.body,
    fontSize: 15,
    color: COLORS.creamDim,
  } as TextStyle,

  // Card display
  cardHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: COLORS.coralSubtle,
    borderRadius: RADIUS.lg,
    paddingVertical: SPACING.md,
    gap: SPACING.sm,
    marginBottom: SPACING.md,
    borderWidth: 1,
    borderColor: COLORS.coralBorder,
  } as ViewStyle,
  cardTitle: {
    fontFamily: FONTS.header,
    fontSize: 22,
    color: COLORS.coral,
    letterSpacing: 1.5,
  } as TextStyle,
  cardSection: {
    backgroundColor: COLORS.bgElevated,
    borderRadius: RADIUS.md,
    padding: SPACING.md,
    marginBottom: SPACING.sm,
    borderWidth: 1,
    borderColor: COLORS.border,
  } as ViewStyle,
  cardSectionHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: SPACING.sm,
    marginBottom: SPACING.sm,
  } as ViewStyle,
  cardSectionTitle: {
    fontFamily: FONTS.bodySemiBold,
    fontSize: 14,
    color: COLORS.sage,
    letterSpacing: 0.5,
  } as TextStyle,
  infoRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingVertical: SPACING.xs,
  } as ViewStyle,
  infoLabel: {
    fontFamily: FONTS.mono,
    fontSize: 12,
    color: COLORS.creamDim,
    letterSpacing: 0.3,
  } as TextStyle,
  infoValue: {
    fontFamily: FONTS.body,
    fontSize: 15,
    color: COLORS.cream,
    textAlign: 'right',
    flex: 1,
    marginLeft: SPACING.md,
  } as TextStyle,
  bloodTypeDisplay: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingVertical: SPACING.xs,
  } as ViewStyle,
  bloodTypeLarge: {
    fontFamily: FONTS.header,
    fontSize: 32,
    color: COLORS.coral,
  } as TextStyle,
  allergyItem: {
    fontFamily: FONTS.bodySemiBold,
    fontSize: 15,
    color: COLORS.coral,
    paddingVertical: 2,
  } as TextStyle,
  medItem: {
    fontFamily: FONTS.body,
    fontSize: 15,
    color: COLORS.cream,
    paddingVertical: 2,
  } as TextStyle,
  conditionItem: {
    fontFamily: FONTS.body,
    fontSize: 15,
    color: COLORS.cream,
    paddingVertical: 2,
  } as TextStyle,
  noneText: {
    fontFamily: FONTS.body,
    fontSize: 14,
    color: COLORS.creamDim,
    fontStyle: 'italic',
  } as TextStyle,

  // Call button
  callButton: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: COLORS.coral,
    borderRadius: RADIUS.md,
    paddingVertical: SPACING.md,
    gap: SPACING.sm,
    marginTop: SPACING.md,
  } as ViewStyle,
  callButtonText: {
    fontFamily: FONTS.bodySemiBold,
    fontSize: 16,
    color: COLORS.white,
  } as TextStyle,

  // Translation section
  translationSection: {
    backgroundColor: COLORS.bgElevated,
    borderRadius: RADIUS.md,
    padding: SPACING.md,
    marginTop: SPACING.md,
    borderWidth: 1,
    borderColor: COLORS.sageBorder,
  } as ViewStyle,
  translationHeader: {
    fontFamily: FONTS.bodySemiBold,
    fontSize: 16,
    color: COLORS.sage,
    marginBottom: SPACING.xs,
  } as TextStyle,
  translationSubtext: {
    fontFamily: FONTS.body,
    fontSize: 13,
    color: COLORS.creamDim,
    marginBottom: SPACING.md,
    lineHeight: 18,
  } as TextStyle,
  translatedRow: {
    paddingVertical: SPACING.sm,
    borderTopWidth: 1,
    borderTopColor: COLORS.border,
  } as ViewStyle,
  translatedEnglish: {
    fontFamily: FONTS.body,
    fontSize: 13,
    color: COLORS.creamDim,
    marginBottom: SPACING.xs,
  } as TextStyle,
  translatedLocal: {
    fontFamily: FONTS.bodySemiBold,
    fontSize: 20,
    color: COLORS.cream,
    lineHeight: 28,
  } as TextStyle,

  // Action row
  actionRow: {
    flexDirection: 'row',
    gap: SPACING.sm,
    marginTop: SPACING.md,
  } as ViewStyle,
  actionButton: {
    flex: 1,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: COLORS.bgElevated,
    borderRadius: RADIUS.md,
    paddingVertical: SPACING.md,
    gap: SPACING.sm,
    borderWidth: 1,
    borderColor: COLORS.border,
  } as ViewStyle,
  actionButtonText: {
    fontFamily: FONTS.body,
    fontSize: 14,
    color: COLORS.cream,
  } as TextStyle,
});

// -----------------------------------------------------------------------------
// Export with coming soon gate
// -----------------------------------------------------------------------------
export default withComingSoon(EmergencyCardScreen, {
  routeName: 'emergency-card',
  title: 'Emergency Card',
});
