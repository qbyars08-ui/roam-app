// =============================================================================
// ROAM — Social Profile Edit
// Build your travel social identity: display name, bio, vibes, style, privacy
// =============================================================================
import React, { useState, useCallback, useMemo, useEffect } from 'react';
import {
  View,
  Text,
  ScrollView,
  Pressable,
  TextInput,
  Switch,
  StyleSheet,
  ActivityIndicator,
  type ViewStyle,
  type TextStyle,
} from 'react-native';
import { useRouter } from 'expo-router';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import {
  ArrowLeft,
  Check,
  Eye,
  EyeOff,
  Shield,
  Globe,
  ChevronDown,
} from 'lucide-react-native';

import { COLORS, FONTS, SPACING, RADIUS } from '../lib/constants';
import * as Haptics from '../lib/haptics';
import { useTranslation } from 'react-i18next';
import { useAppStore } from '../lib/store';
import { useSocialProfile } from '../lib/hooks/useSocialProfile';
import VibeTagSelector from '../components/social/VibeTagSelector';
import OpenToMeetToggle from '../components/social/OpenToMeetToggle';
import type {
  SocialProfile,
  AgeRange,
  TravelStyle,
  VibeTag,
  PrivacySettings,
  VisibilityStatus,
  LocationPrecision,
} from '../lib/types/social';
import { DEFAULT_PRIVACY } from '../lib/types/social';

// ---------------------------------------------------------------------------
// Constants
// ---------------------------------------------------------------------------

const AGE_RANGES: AgeRange[] = ['18-24', '25-30', '31-40', '41-50', '50+'];

const TRAVEL_STYLES: { value: TravelStyle; label: string; description: string }[] = [
  { value: 'backpacker', label: 'Backpacker', description: 'Hostels & street food' },
  { value: 'comfort', label: 'Comfort', description: 'Nice hotels, local gems' },
  { value: 'luxury', label: 'Luxury', description: 'Five stars or nothing' },
  { value: 'adventure', label: 'Adventure', description: 'Extreme & off-grid' },
  { value: 'slow-travel', label: 'Slow Travel', description: 'Live like a local' },
  { value: 'digital-nomad', label: 'Digital Nomad', description: 'Work anywhere' },
];

const AVATAR_EMOJIS = ['🌍', '🧭', '✈️', '🎒', '📷', '🏔️', '🌴', '🌊', '🗺️', '🏕️', '🚂', '⛵'];

const COMMON_LANGUAGES = [
  'English', 'Spanish', 'French', 'Japanese', 'Korean',
  'Mandarin', 'Portuguese', 'German', 'Italian', 'Arabic', 'Hindi', 'Thai',
];

const VISIBILITY_OPTIONS: { value: VisibilityStatus; label: string }[] = [
  { value: 'visible', label: 'Visible' },
  { value: 'invisible', label: 'Invisible' },
  { value: 'away', label: 'Away' },
];

const LOCATION_PRECISION_OPTIONS: { value: LocationPrecision; label: string }[] = [
  { value: 'neighborhood', label: 'Neighborhood' },
  { value: 'city', label: 'City' },
  { value: 'hidden', label: 'Hidden' },
];

// ---------------------------------------------------------------------------
// Sub-components
// ---------------------------------------------------------------------------

interface SectionHeaderProps {
  label: string;
}

const SectionHeader = React.memo<SectionHeaderProps>(({ label }) => (
  <Text style={styles.sectionLabel}>{label}</Text>
));
SectionHeader.displayName = 'SectionHeader';

interface SectionCardProps {
  children: React.ReactNode;
  style?: ViewStyle;
}

const SectionCard = React.memo<SectionCardProps>(({ children, style }) => (
  <View style={[styles.card, style]}>{children}</View>
));
SectionCard.displayName = 'SectionCard';

interface ToggleRowProps {
  label: string;
  sublabel?: string;
  value: boolean;
  onToggle: (val: boolean) => void;
}

const ToggleRow = React.memo<ToggleRowProps>(({ label, sublabel, value, onToggle }) => {
  const handleChange = useCallback(
    async (next: boolean) => {
      await Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
      onToggle(next);
    },
    [onToggle],
  );

  return (
    <View style={styles.toggleRow}>
      <View style={styles.toggleLabelGroup}>
        <Text style={styles.toggleLabel}>{label}</Text>
        {sublabel ? <Text style={styles.toggleSublabel}>{sublabel}</Text> : null}
      </View>
      <Switch
        value={value}
        onValueChange={handleChange}
        trackColor={{ false: COLORS.bgGlass, true: COLORS.sage }}
        thumbColor={COLORS.cream}
        ios_backgroundColor={COLORS.bgGlass}
      />
    </View>
  );
});
ToggleRow.displayName = 'ToggleRow';

// ---------------------------------------------------------------------------
// Main Screen
// ---------------------------------------------------------------------------

export default function SocialProfileEditScreen() {
  const { t } = useTranslation();
  const router = useRouter();
  const insets = useSafeAreaInsets();
  const { profile, upsert } = useSocialProfile();

  // ── Local state, initialized from existing profile ──────────────────────
  const [displayName, setDisplayName] = useState(profile?.displayName ?? '');
  const [bio, setBio] = useState(profile?.bio ?? '');
  const [ageRange, setAgeRange] = useState<AgeRange>(profile?.ageRange ?? '25-30');
  const [travelStyle, setTravelStyle] = useState<TravelStyle>(profile?.travelStyle ?? 'comfort');
  const [vibeTags, setVibeTags] = useState<VibeTag[]>(profile?.vibeTags ?? []);
  const [languages, setLanguages] = useState<string[]>(profile?.languages ?? ['English']);
  const [avatarEmoji, setAvatarEmoji] = useState(profile?.avatarEmoji ?? '🌍');
  const [privacy, setPrivacy] = useState<PrivacySettings>(profile?.privacy ?? DEFAULT_PRIVACY);
  const [saving, setSaving] = useState(false);
  const [errors, setErrors] = useState<{ displayName?: string; vibeTags?: string }>({});
  const [privacyExpanded, setPrivacyExpanded] = useState(false);
  const [customLanguage, setCustomLanguage] = useState('');

  // Re-sync when profile loads asynchronously
  useEffect(() => {
    if (!profile) return;
    setDisplayName(profile.displayName ?? '');
    setBio(profile.bio ?? '');
    setAgeRange(profile.ageRange ?? '25-30');
    setTravelStyle(profile.travelStyle ?? 'comfort');
    setVibeTags(profile.vibeTags ?? []);
    setLanguages(profile.languages?.length ? profile.languages : ['English']);
    setAvatarEmoji(profile.avatarEmoji ?? '🌍');
    setPrivacy(profile.privacy ?? DEFAULT_PRIVACY);
  }, [profile?.id]); // eslint-disable-line react-hooks/exhaustive-deps

  // ── Handlers ─────────────────────────────────────────────────────────────

  const handleBack = useCallback(() => {
    Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light).catch(() => {});
    router.back();
  }, [router]);

  const handleAvatarSelect = useCallback((emoji: string) => {
    Haptics.selectionAsync().catch(() => {});
    setAvatarEmoji(emoji);
  }, []);

  const handleAgeRange = useCallback((range: AgeRange) => {
    Haptics.selectionAsync().catch(() => {});
    setAgeRange(range);
  }, []);

  const handleTravelStyle = useCallback((style: TravelStyle) => {
    Haptics.selectionAsync().catch(() => {});
    setTravelStyle(style);
  }, []);

  const handleLanguageToggle = useCallback(
    (lang: string) => {
      Haptics.selectionAsync().catch(() => {});
      setLanguages((prev) =>
        prev.includes(lang) ? prev.filter((l) => l !== lang) : [...prev, lang],
      );
    },
    [],
  );

  const handleAddCustomLanguage = useCallback(() => {
    const trimmed = customLanguage.trim();
    if (!trimmed || languages.includes(trimmed)) {
      setCustomLanguage('');
      return;
    }
    Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light).catch(() => {});
    setLanguages((prev) => [...prev, trimmed]);
    setCustomLanguage('');
  }, [customLanguage, languages]);

  const handlePrivacyField = useCallback(
    <K extends keyof PrivacySettings>(field: K, value: PrivacySettings[K]) => {
      Haptics.selectionAsync().catch(() => {});
      setPrivacy((prev) => ({ ...prev, [field]: value }));
    },
    [],
  );

  const handleTogglePrivacy = useCallback(() => {
    Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light).catch(() => {});
    setPrivacyExpanded((v) => !v);
  }, []);

  const validate = useCallback((): boolean => {
    const next: typeof errors = {};
    if (!displayName.trim()) next.displayName = t('socialProfileEdit.errorDisplayName', { defaultValue: 'Display name is required' });
    if (vibeTags.length === 0) next.vibeTags = t('socialProfileEdit.errorVibeTags', { defaultValue: 'Select at least 1 vibe tag' });
    setErrors(next);
    return Object.keys(next).length === 0;
  }, [displayName, vibeTags]);

  const handleSave = useCallback(async () => {
    if (!validate()) {
      Haptics.notificationAsync(Haptics.NotificationFeedbackType.Error).catch(() => {});
      return;
    }

    setSaving(true);
    const updates: Partial<SocialProfile> = {
      displayName: displayName.trim(),
      bio: bio.trim(),
      ageRange,
      travelStyle,
      vibeTags,
      languages,
      avatarEmoji,
      privacy,
    };

    const result = await upsert(updates);
    setSaving(false);

    if (result) {
      await Haptics.notificationAsync(Haptics.NotificationFeedbackType.Success);
      router.back();
    } else {
      Haptics.notificationAsync(Haptics.NotificationFeedbackType.Error).catch(() => {});
    }
  }, [
    validate,
    displayName,
    bio,
    ageRange,
    travelStyle,
    vibeTags,
    languages,
    avatarEmoji,
    privacy,
    upsert,
    router,
  ]);

  // ── Derived ──────────────────────────────────────────────────────────────

  const privacyChevronRotation = useMemo(
    () => ({ transform: [{ rotate: privacyExpanded ? '180deg' : '0deg' }] }),
    [privacyExpanded],
  );

  const displayNameCount = useMemo(() => `${displayName.length}/50`, [displayName]);
  const bioCount = useMemo(() => `${bio.length}/300`, [bio]);

  // ── Render ───────────────────────────────────────────────────────────────

  return (
    <View style={[styles.root, { paddingTop: insets.top }]}>
      {/* ── Header ── */}
      <View style={styles.header}>
        <Pressable onPress={handleBack} style={styles.headerIcon} hitSlop={12}>
          <ArrowLeft size={22} color={COLORS.cream} strokeWidth={1.5} />
        </Pressable>

        <Text style={styles.headerTitle}>{t('socialProfileEdit.title', { defaultValue: 'Edit Profile' })}</Text>

        <Pressable
          onPress={handleSave}
          style={[styles.saveBtn, saving && styles.saveBtnDisabled]}
          disabled={saving}
          hitSlop={8}
        >
          {saving ? (
            <ActivityIndicator size="small" color={COLORS.bg} />
          ) : (
            <>
              <Check size={16} color={COLORS.bg} strokeWidth={1.5} />
              <Text style={styles.saveBtnText}>{t('common.save', { defaultValue: 'Save' })}</Text>
            </>
          )}
        </Pressable>
      </View>

      {/* ── Scrollable content ── */}
      <ScrollView
        contentContainerStyle={[styles.scroll, { paddingBottom: insets.bottom + SPACING.xxl }]}
        showsVerticalScrollIndicator={false}
        keyboardShouldPersistTaps="handled"
      >
        {/* ── Avatar ── */}
        <View style={styles.avatarSection}>
          <View style={styles.avatarCircle}>
            <Text style={styles.avatarEmoji}>{avatarEmoji}</Text>
          </View>
          <Text style={styles.avatarHint}>{t('socialProfileEdit.avatarHint', { defaultValue: 'Choose your travel avatar' })}</Text>
          <View style={styles.emojiRow}>
            {AVATAR_EMOJIS.map((emoji) => (
              <Pressable
                key={emoji}
                onPress={() => handleAvatarSelect(emoji)}
                style={[
                  styles.emojiPill,
                  avatarEmoji === emoji && styles.emojiPillSelected,
                ]}
              >
                <Text style={styles.emojiChar}>{emoji}</Text>
              </Pressable>
            ))}
          </View>
        </View>

        {/* ── Display Name ── */}
        <View style={styles.section}>
          <View style={styles.labelRow}>
            <SectionHeader label={t('socialProfileEdit.displayName', { defaultValue: 'Display Name' })} />
            <Text style={styles.charCount}>{displayNameCount}</Text>
          </View>
          <SectionCard>
            <TextInput
              style={styles.input}
              value={displayName}
              onChangeText={setDisplayName}
              placeholder={t('socialProfileEdit.displayNamePlaceholder', { defaultValue: 'How travelers see you' })}
              placeholderTextColor={COLORS.creamMuted}
              maxLength={50}
              autoCorrect={false}
              selectionColor={COLORS.sage}
            />
          </SectionCard>
          {errors.displayName ? (
            <Text style={styles.errorText}>{errors.displayName}</Text>
          ) : null}
        </View>

        {/* ── Bio ── */}
        <View style={styles.section}>
          <View style={styles.labelRow}>
            <SectionHeader label={t('socialProfileEdit.bio', { defaultValue: 'Bio' })} />
            <Text style={styles.charCount}>{bioCount}</Text>
          </View>
          <SectionCard>
            <TextInput
              style={[styles.input, styles.bioInput]}
              value={bio}
              onChangeText={setBio}
              placeholder={t('socialProfileEdit.bioPlaceholder', { defaultValue: "What's your travel story?" })}
              placeholderTextColor={COLORS.creamMuted}
              maxLength={300}
              multiline
              numberOfLines={4}
              textAlignVertical="top"
              selectionColor={COLORS.sage}
            />
          </SectionCard>
        </View>

        {/* ── Age Range ── */}
        <View style={styles.section}>
          <SectionHeader label={t('socialProfileEdit.ageRange', { defaultValue: 'Age Range' })} />
          <View style={styles.pillRow}>
            {AGE_RANGES.map((range) => (
              <Pressable
                key={range}
                onPress={() => handleAgeRange(range)}
                style={[
                  styles.optionPill,
                  ageRange === range && styles.optionPillSelected,
                ]}
              >
                <Text
                  style={[
                    styles.optionPillText,
                    ageRange === range && styles.optionPillTextSelected,
                  ]}
                >
                  {range}
                </Text>
              </Pressable>
            ))}
          </View>
        </View>

        {/* ── Travel Style ── */}
        <View style={styles.section}>
          <SectionHeader label={t('socialProfileEdit.travelStyle', { defaultValue: 'Travel Style' })} />
          <View style={styles.styleGrid}>
            {TRAVEL_STYLES.map((item) => {
              const isSelected = travelStyle === item.value;
              return (
                <Pressable
                  key={item.value}
                  onPress={() => handleTravelStyle(item.value)}
                  style={[styles.styleCard, isSelected && styles.styleCardSelected]}
                >
                  <Text style={[styles.styleCardLabel, isSelected && styles.styleCardLabelSelected]}>
                    {item.label}
                  </Text>
                  <Text style={[styles.styleCardDesc, isSelected && styles.styleCardDescSelected]}>
                    {item.description}
                  </Text>
                </Pressable>
              );
            })}
          </View>
        </View>

        {/* ── Vibe Tags ── */}
        <View style={styles.section}>
          <VibeTagSelector selected={vibeTags} onSelect={setVibeTags} />
          {errors.vibeTags ? (
            <Text style={styles.errorText}>{errors.vibeTags}</Text>
          ) : null}
        </View>

        {/* ── Languages ── */}
        <View style={styles.section}>
          <SectionHeader label={t('socialProfileEdit.languages', { defaultValue: 'Languages' })} />
          <View style={styles.pillRow}>
            {COMMON_LANGUAGES.map((lang) => (
              <Pressable
                key={lang}
                onPress={() => handleLanguageToggle(lang)}
                style={[
                  styles.optionPill,
                  languages.includes(lang) && styles.optionPillSelected,
                ]}
              >
                <Text
                  style={[
                    styles.optionPillText,
                    languages.includes(lang) && styles.optionPillTextSelected,
                  ]}
                >
                  {lang}
                </Text>
              </Pressable>
            ))}
          </View>
          {/* Custom language entry */}
          <View style={styles.customLangRow}>
            <TextInput
              style={styles.customLangInput}
              value={customLanguage}
              onChangeText={setCustomLanguage}
              placeholder={t('socialProfileEdit.addLanguagePlaceholder', { defaultValue: 'Add another...' })}
              placeholderTextColor={COLORS.creamMuted}
              autoCorrect={false}
              returnKeyType="done"
              onSubmitEditing={handleAddCustomLanguage}
              selectionColor={COLORS.sage}
            />
            <Pressable onPress={handleAddCustomLanguage} style={styles.customLangAdd}>
              <Text style={styles.customLangAddText}>{t('common.add', { defaultValue: 'Add' })}</Text>
            </Pressable>
          </View>
          {/* Custom languages as removable pills */}
          {languages
            .filter((l) => !COMMON_LANGUAGES.includes(l))
            .map((lang) => (
              <View key={lang} style={styles.customLangPill}>
                <Text style={styles.customLangPillText}>{lang}</Text>
                <Pressable onPress={() => handleLanguageToggle(lang)} hitSlop={8}>
                  <Text style={styles.customLangPillRemove}>✕</Text>
                </Pressable>
              </View>
            ))}
        </View>

        {/* ── Privacy ── */}
        <View style={styles.section}>
          <Pressable onPress={handleTogglePrivacy} style={styles.privacyHeader}>
            <View style={styles.privacyHeaderLeft}>
              <Shield size={18} color={COLORS.sage} strokeWidth={1.5} />
              <Text style={styles.privacyHeaderText}>{t('socialProfileEdit.privacySettings', { defaultValue: 'Privacy Settings' })}</Text>
            </View>
            <View style={privacyChevronRotation}>
              <ChevronDown size={18} color={COLORS.creamMuted} strokeWidth={1.5} />
            </View>
          </Pressable>

          {privacyExpanded && (
            <View style={styles.privacyBody}>
              {/* Visibility */}
              <View style={styles.privacySubSection}>
                <Text style={styles.privacySubLabel}>
                  <Globe size={13} color={COLORS.creamMuted} strokeWidth={1.5} />
                  {'  '}{t('socialProfileEdit.visibility', { defaultValue: 'Visibility' })}
                </Text>
                <View style={styles.pillRow}>
                  {VISIBILITY_OPTIONS.map((opt) => {
                    const isSelected = privacy.visibility === opt.value;
                    return (
                      <Pressable
                        key={opt.value}
                        onPress={() => handlePrivacyField('visibility', opt.value)}
                        style={[styles.optionPill, isSelected && styles.optionPillSelected]}
                      >
                        <Text
                          style={[
                            styles.optionPillText,
                            isSelected && styles.optionPillTextSelected,
                          ]}
                        >
                          {isSelected ? (
                            opt.value === 'visible' ? '👁 ' : opt.value === 'invisible' ? '🕵️ ' : '💤 '
                          ) : null}
                          {opt.label}
                        </Text>
                      </Pressable>
                    );
                  })}
                </View>
              </View>

              {/* Toggles */}
              <ToggleRow
                label={t('socialProfileEdit.showRealName', { defaultValue: 'Show real name' })}
                sublabel={t('socialProfileEdit.showRealNameSub', { defaultValue: 'Only shown after mutual match' })}
                value={privacy.showRealName}
                onToggle={(v) => handlePrivacyField('showRealName', v)}
              />
              <View style={styles.privacyDivider} />

              <ToggleRow
                label={t('socialProfileEdit.showAge', { defaultValue: 'Show age' })}
                value={privacy.showAge}
                onToggle={(v) => handlePrivacyField('showAge', v)}
              />
              <View style={styles.privacyDivider} />

              {/* Open to meetups — uses dedicated component */}
              <OpenToMeetToggle
                value={privacy.openToMeetups}
                onToggle={(v) => handlePrivacyField('openToMeetups', v)}
              />
              <View style={styles.privacyDivider} />

              <ToggleRow
                label={t('socialProfileEdit.autoDeleteChats', { defaultValue: 'Auto-delete chats' })}
                sublabel={t('socialProfileEdit.autoDeleteChatsSub', { defaultValue: 'Chats deleted when your trip ends' })}
                value={privacy.autoDeleteChats}
                onToggle={(v) => handlePrivacyField('autoDeleteChats', v)}
              />

              {/* Location precision */}
              <View style={[styles.privacySubSection, { marginTop: SPACING.md }]}>
                <Text style={styles.privacySubLabel}>{t('socialProfileEdit.locationPrecision', { defaultValue: 'Location precision' })}</Text>
                <View style={styles.pillRow}>
                  {LOCATION_PRECISION_OPTIONS.map((opt) => {
                    const isSelected = privacy.locationPrecision === opt.value;
                    return (
                      <Pressable
                        key={opt.value}
                        onPress={() => handlePrivacyField('locationPrecision', opt.value)}
                        style={[styles.optionPill, isSelected && styles.optionPillSelected]}
                      >
                        <Text
                          style={[
                            styles.optionPillText,
                            isSelected && styles.optionPillTextSelected,
                          ]}
                        >
                          {opt.label}
                        </Text>
                      </Pressable>
                    );
                  })}
                </View>
              </View>
            </View>
          )}
        </View>

        {/* ── Bottom Save button ── */}
        <Pressable
          onPress={handleSave}
          style={[styles.bottomSaveBtn, saving && styles.bottomSaveBtnDisabled]}
          disabled={saving}
        >
          {saving ? (
            <ActivityIndicator size="small" color={COLORS.bg} />
          ) : (
            <Text style={styles.bottomSaveBtnText}>{t('socialProfileEdit.saveProfile', { defaultValue: 'Save Profile' })}</Text>
          )}
        </Pressable>
      </ScrollView>
    </View>
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

  // ── Header ──
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: SPACING.md,
    paddingVertical: SPACING.sm + 4,
    borderBottomWidth: 1,
    borderBottomColor: COLORS.border,
  } as ViewStyle,
  headerIcon: {
    width: 40,
    height: 40,
    alignItems: 'center',
    justifyContent: 'center',
  } as ViewStyle,
  headerTitle: {
    fontFamily: FONTS.header,
    fontSize: 22,
    color: COLORS.cream,
    letterSpacing: 0.3,
  } as TextStyle,
  saveBtn: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: SPACING.xs,
    backgroundColor: COLORS.sage,
    paddingHorizontal: SPACING.md,
    paddingVertical: SPACING.xs + 2,
    borderRadius: RADIUS.full,
    minWidth: 68,
    justifyContent: 'center',
  } as ViewStyle,
  saveBtnDisabled: {
    opacity: 0.6,
  } as ViewStyle,
  saveBtnText: {
    fontFamily: FONTS.bodyMedium,
    fontSize: 14,
    color: COLORS.bg,
  } as TextStyle,

  // ── Scroll ──
  scroll: {
    paddingHorizontal: SPACING.md,
    paddingTop: SPACING.lg,
    gap: SPACING.lg,
  } as ViewStyle,

  // ── Avatar ──
  avatarSection: {
    alignItems: 'center',
    gap: SPACING.sm,
    marginBottom: SPACING.xs,
  } as ViewStyle,
  avatarCircle: {
    width: 100,
    height: 100,
    borderRadius: RADIUS.pill,
    backgroundColor: COLORS.bgElevated,
    borderWidth: 2,
    borderColor: COLORS.sageBorder,
    alignItems: 'center',
    justifyContent: 'center',
  } as ViewStyle,
  avatarEmoji: {
    fontSize: 48,
  } as TextStyle,
  avatarHint: {
    fontFamily: FONTS.mono,
    fontSize: 12,
    color: COLORS.creamMuted,
    letterSpacing: 0.4,
  } as TextStyle,
  emojiRow: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    justifyContent: 'center',
    gap: SPACING.xs,
  } as ViewStyle,
  emojiPill: {
    width: 44,
    height: 44,
    borderRadius: RADIUS.md,
    backgroundColor: COLORS.bgCard,
    borderWidth: 1,
    borderColor: COLORS.border,
    alignItems: 'center',
    justifyContent: 'center',
  } as ViewStyle,
  emojiPillSelected: {
    borderColor: COLORS.sageBorder,
    backgroundColor: COLORS.sageSubtle,
  } as ViewStyle,
  emojiChar: {
    fontSize: 22,
  } as TextStyle,

  // ── Section ──
  section: {
    gap: SPACING.sm,
  } as ViewStyle,
  sectionLabel: {
    fontFamily: FONTS.bodyMedium,
    fontSize: 13,
    color: COLORS.creamMuted,
    letterSpacing: 0.5,
  } as TextStyle,
  labelRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
  } as ViewStyle,
  charCount: {
    fontFamily: FONTS.mono,
    fontSize: 11,
    color: COLORS.creamMuted,
  } as TextStyle,
  errorText: {
    fontFamily: FONTS.mono,
    fontSize: 12,
    color: COLORS.coral,
    marginTop: -SPACING.xs,
  } as TextStyle,

  // ── Card / Input ──
  card: {
    backgroundColor: COLORS.bgCard,
    borderRadius: RADIUS.md,
    borderWidth: 1,
    borderColor: COLORS.border,
    paddingHorizontal: SPACING.md,
    paddingVertical: SPACING.sm + 2,
  } as ViewStyle,
  input: {
    fontFamily: FONTS.body,
    fontSize: 15,
    color: COLORS.cream,
    paddingVertical: 0,
  } as TextStyle,
  bioInput: {
    minHeight: 96,
    paddingTop: SPACING.sm,
  } as TextStyle,

  // ── Pills (generic options) ──
  pillRow: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: SPACING.sm,
  } as ViewStyle,
  optionPill: {
    paddingHorizontal: SPACING.md,
    paddingVertical: SPACING.xs + 2,
    borderRadius: RADIUS.full,
    borderWidth: 1,
    borderColor: COLORS.border,
    backgroundColor: COLORS.bgCard,
  } as ViewStyle,
  optionPillSelected: {
    backgroundColor: COLORS.sageSubtle,
    borderColor: COLORS.sageBorder,
  } as ViewStyle,
  optionPillText: {
    fontFamily: FONTS.bodyMedium,
    fontSize: 13,
    color: COLORS.creamMuted,
  } as TextStyle,
  optionPillTextSelected: {
    color: COLORS.sage,
  } as TextStyle,

  // ── Travel style grid (2x3) ──
  styleGrid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: SPACING.sm,
  } as ViewStyle,
  styleCard: {
    width: '47.5%',
    backgroundColor: COLORS.bgCard,
    borderRadius: RADIUS.md,
    borderWidth: 1,
    borderColor: COLORS.border,
    paddingHorizontal: SPACING.md,
    paddingVertical: SPACING.md,
    gap: SPACING.xs,
  } as ViewStyle,
  styleCardSelected: {
    backgroundColor: COLORS.sageSubtle,
    borderColor: COLORS.sageBorder,
  } as ViewStyle,
  styleCardLabel: {
    fontFamily: FONTS.bodyMedium,
    fontSize: 14,
    color: COLORS.cream,
  } as TextStyle,
  styleCardLabelSelected: {
    color: COLORS.sage,
  } as TextStyle,
  styleCardDesc: {
    fontFamily: FONTS.mono,
    fontSize: 11,
    color: COLORS.creamMuted,
  } as TextStyle,
  styleCardDescSelected: {
    color: COLORS.creamDim,
  } as TextStyle,

  // ── Languages ──
  customLangRow: {
    flexDirection: 'row',
    gap: SPACING.sm,
    marginTop: SPACING.xs,
  } as ViewStyle,
  customLangInput: {
    flex: 1,
    backgroundColor: COLORS.bgCard,
    borderRadius: RADIUS.md,
    borderWidth: 1,
    borderColor: COLORS.border,
    paddingHorizontal: SPACING.md,
    paddingVertical: SPACING.xs + 4,
    fontFamily: FONTS.body,
    fontSize: 14,
    color: COLORS.cream,
  } as TextStyle,
  customLangAdd: {
    backgroundColor: COLORS.sageSubtle,
    borderRadius: RADIUS.pill,
    borderWidth: 1,
    borderColor: COLORS.sageBorder,
    paddingHorizontal: SPACING.md,
    justifyContent: 'center',
  } as ViewStyle,
  customLangAddText: {
    fontFamily: FONTS.bodyMedium,
    fontSize: 13,
    color: COLORS.sage,
  } as TextStyle,
  customLangPill: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: SPACING.xs,
    alignSelf: 'flex-start',
    backgroundColor: COLORS.sageSubtle,
    borderRadius: RADIUS.full,
    borderWidth: 1,
    borderColor: COLORS.sageBorder,
    paddingHorizontal: SPACING.md,
    paddingVertical: SPACING.xs + 2,
    marginTop: SPACING.xs,
  } as ViewStyle,
  customLangPillText: {
    fontFamily: FONTS.bodyMedium,
    fontSize: 13,
    color: COLORS.sage,
  } as TextStyle,
  customLangPillRemove: {
    fontFamily: FONTS.mono,
    fontSize: 11,
    color: COLORS.creamMuted,
  } as TextStyle,

  // ── Privacy ──
  privacyHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    backgroundColor: COLORS.bgCard,
    borderRadius: RADIUS.md,
    borderWidth: 1,
    borderColor: COLORS.border,
    paddingHorizontal: SPACING.md,
    paddingVertical: SPACING.md,
  } as ViewStyle,
  privacyHeaderLeft: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: SPACING.sm,
  } as ViewStyle,
  privacyHeaderText: {
    fontFamily: FONTS.bodyMedium,
    fontSize: 15,
    color: COLORS.cream,
  } as TextStyle,
  privacyBody: {
    backgroundColor: COLORS.bgCard,
    borderRadius: RADIUS.md,
    borderWidth: 1,
    borderColor: COLORS.border,
    paddingVertical: SPACING.sm,
    gap: 0,
  } as ViewStyle,
  privacySubSection: {
    paddingHorizontal: SPACING.md,
    paddingVertical: SPACING.sm,
    gap: SPACING.sm,
  } as ViewStyle,
  privacySubLabel: {
    fontFamily: FONTS.bodyMedium,
    fontSize: 13,
    color: COLORS.creamMuted,
    letterSpacing: 0.3,
  } as TextStyle,
  privacyDivider: {
    height: 1,
    backgroundColor: COLORS.border,
    marginHorizontal: SPACING.md,
  } as ViewStyle,

  // ── Toggle row (generic) ──
  toggleRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: SPACING.md,
    paddingVertical: SPACING.md,
  } as ViewStyle,
  toggleLabelGroup: {
    flex: 1,
    marginRight: SPACING.md,
  } as ViewStyle,
  toggleLabel: {
    fontFamily: FONTS.body,
    fontSize: 15,
    color: COLORS.cream,
  } as TextStyle,
  toggleSublabel: {
    fontFamily: FONTS.mono,
    fontSize: 11,
    color: COLORS.creamMuted,
    marginTop: 2,
  } as TextStyle,

  // ── Bottom save ──
  bottomSaveBtn: {
    backgroundColor: COLORS.sage,
    borderRadius: RADIUS.pill,
    paddingVertical: SPACING.md,
    alignItems: 'center',
    justifyContent: 'center',
    minHeight: 52,
    marginTop: SPACING.md,
  } as ViewStyle,
  bottomSaveBtnDisabled: {
    opacity: 0.6,
  } as ViewStyle,
  bottomSaveBtnText: {
    fontFamily: FONTS.bodySemiBold,
    fontSize: 16,
    color: COLORS.bg,
    letterSpacing: 0.3,
  } as TextStyle,
});
