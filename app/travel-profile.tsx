// =============================================================================
// ROAM — Travel Style Profile Screen
// Beautiful dark glass sliders + multi-select pills
// Shows after destination selection on first trip if profile incomplete
// =============================================================================
import React, { useState, useCallback } from 'react';
import {
  View,
  Text,
  ScrollView,
  Pressable,
  StyleSheet,
  type ViewStyle,
  type TextStyle,
} from 'react-native';
import Slider from '@react-native-community/slider';
import { useRouter } from 'expo-router';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import * as Haptics from '../lib/haptics';
import { BookOpen, Zap, DollarSign, Users, UtensilsCrossed, Rocket, Building2, Compass } from 'lucide-react-native';
import { COLORS, FONTS, SPACING, RADIUS } from '../lib/constants';
import { useAppStore } from '../lib/store';
import { supabase } from '../lib/supabase';
import {
  type TravelProfile,
  type TransportPreference,
  type TripPurpose,
  TRAVEL_FREQUENCY_OPTIONS,
  PACE_LABELS,
  BUDGET_STYLE_LABELS,
  CROWD_LABELS,
  FOOD_LABELS,
  getSliderLabel,
  TRANSPORT_OPTIONS,
  ACCOMMODATION_OPTIONS,
  TRIP_PURPOSE_OPTIONS,
  SLIDER_DESCRIPTORS,
  getSliderDescriptor,
} from '../lib/types/travel-profile';

// ---------------------------------------------------------------------------
// Glass Card wrapper
// ---------------------------------------------------------------------------
function GlassCard({ children, style }: { children: React.ReactNode; style?: ViewStyle }) {
  return (
    <View style={[styles.glassCard, style]}>
      {children}
    </View>
  );
}

// ---------------------------------------------------------------------------
// Personality label badge (animates on change)
// ---------------------------------------------------------------------------
function PersonalityBadge({ label }: { label: string }) {
  return (
    <View style={styles.personalityBadge}>
      <Text style={styles.personalityBadgeText}>{label}</Text>
    </View>
  );
}

// ---------------------------------------------------------------------------
// Profile Slider component
// ---------------------------------------------------------------------------
function ProfileSlider({
  title,
  value,
  onChange,
  labels,
  dimension,
  icon,
}: {
  title: string;
  value: number;
  onChange: (v: number) => void;
  labels: Record<string, string>;
  dimension: keyof typeof SLIDER_DESCRIPTORS;
  icon: React.ReactNode;
}) {
  const descriptor = getSliderDescriptor(dimension, value);
  const personalityLabel = getSliderLabel(value, labels);

  return (
    <GlassCard>
      <View style={styles.sliderHeader}>
        <View style={styles.sliderIconWrap}>{icon}</View>
        <View style={styles.sliderTitleRow}>
          <Text style={styles.sliderTitle}>{title}</Text>
          <PersonalityBadge label={personalityLabel} />
        </View>
      </View>

      <Slider
        style={styles.slider}
        minimumValue={1}
        maximumValue={10}
        step={1}
        value={value}
        onValueChange={(v) => {
          Haptics.selectionAsync();
          onChange(v);
        }}
        minimumTrackTintColor={COLORS.sage}
        maximumTrackTintColor={COLORS.border}
        thumbTintColor={COLORS.sage}
      />

      <View style={styles.sliderLabelsRow}>
        <Text style={styles.sliderMin}>1</Text>
        <Text style={styles.sliderDescriptor}>{descriptor}</Text>
        <Text style={styles.sliderMax}>10</Text>
      </View>

      <View style={styles.sliderValueBubble}>
        <Text style={styles.sliderValueText}>{value}</Text>
      </View>
    </GlassCard>
  );
}

// ---------------------------------------------------------------------------
// Pill select (multi)
// ---------------------------------------------------------------------------
function PillMultiSelect<T extends string>({
  title,
  icon,
  options,
  selected,
  onToggle,
}: {
  title: string;
  icon: React.ReactNode;
  options: { id: T; label: string }[];
  selected: T[];
  onToggle: (id: T) => void;
}) {
  return (
    <GlassCard>
      <View style={styles.sliderHeader}>
        <View style={styles.sliderIconWrap}>{icon}</View>
        <Text style={styles.sliderTitle}>{title}</Text>
      </View>
      <Text style={styles.pillHint}>Select all that apply</Text>
      <View style={styles.pillGrid}>
        {options.map((opt) => {
          const isSelected = selected.includes(opt.id);
          return (
            <Pressable
              key={opt.id}
              style={[styles.pill, isSelected && styles.pillSelected]}
              onPress={() => {
                Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
                onToggle(opt.id);
              }}
            >
              {null}
              <Text style={[styles.pillLabel, isSelected && styles.pillLabelSelected]}>
                {opt.label}
              </Text>
            </Pressable>
          );
        })}
      </View>
    </GlassCard>
  );
}

// ---------------------------------------------------------------------------
// Pill select (single)
// ---------------------------------------------------------------------------
function PillSingleSelect<T extends string>({
  title,
  icon,
  options,
  selected,
  onSelect,
}: {
  title: string;
  icon: React.ReactNode;
  options: { id: T; label: string; description: string }[];
  selected: T;
  onSelect: (id: T) => void;
}) {
  return (
    <GlassCard>
      <View style={styles.sliderHeader}>
        <View style={styles.sliderIconWrap}>{icon}</View>
        <Text style={styles.sliderTitle}>{title}</Text>
      </View>
      <Text style={styles.pillHint}>Pick one</Text>
      <View style={styles.pillGrid}>
        {options.map((opt) => {
          const isSelected = selected === opt.id;
          return (
            <Pressable
              key={opt.id}
              style={[styles.pill, styles.pillWide, isSelected && styles.pillSelected]}
              onPress={() => {
                Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
                onSelect(opt.id);
              }}
            >
              {null}
              <View style={styles.pillTextCol}>
                <Text style={[styles.pillLabel, isSelected && styles.pillLabelSelected]}>
                  {opt.label}
                </Text>
                <Text style={styles.pillDescription}>{opt.description}</Text>
              </View>
            </Pressable>
          );
        })}
      </View>
    </GlassCard>
  );
}

import { withComingSoon } from '../lib/with-coming-soon';

// ---------------------------------------------------------------------------
// Main Screen
// ---------------------------------------------------------------------------
function TravelProfileScreen() {
  const router = useRouter();
  const insets = useSafeAreaInsets();
  const travelProfile = useAppStore((s) => s.travelProfile);
  const setTravelProfile = useAppStore((s) => s.setTravelProfile);
  const setHasCompletedProfile = useAppStore((s) => s.setHasCompletedProfile);
  const session = useAppStore((s) => s.session);

  // Local state mirrors store for responsive slider updates
  const [profile, setProfile] = useState<TravelProfile>({ ...travelProfile });

  const updateLocal = useCallback(
    (partial: Partial<TravelProfile>) => {
      setProfile((prev) => ({ ...prev, ...partial }));
    },
    []
  );

  const toggleTransport = useCallback((id: TransportPreference) => {
    setProfile((prev) => {
      const current = prev.transport;
      const updated = current.includes(id)
        ? current.filter((t) => t !== id)
        : [...current, id];
      return { ...prev, transport: updated };
    });
  }, []);

  const togglePurpose = useCallback((id: TripPurpose) => {
    setProfile((prev) => {
      const current = prev.tripPurposes;
      const updated = current.includes(id)
        ? current.filter((p) => p !== id)
        : [...current, id];
      return { ...prev, tripPurposes: updated };
    });
  }, []);

  // ---------------------------------------------------------------------------
  // Save & continue
  // ---------------------------------------------------------------------------
  const handleSave = async () => {
    Haptics.notificationAsync(Haptics.NotificationFeedbackType.Success);

    // Save to Zustand + AsyncStorage
    setTravelProfile(profile);
    setHasCompletedProfile(true);

    // Save to Supabase (fire-and-forget)
    if (session?.user?.id) {
      supabase
        .from('profiles')
        .update({ travel_profile: profile })
        .eq('id', session.user.id)
        .then(({ error }) => {
          if (error) console.warn('[travel-profile] Supabase save error:', error.message);
        });
    }

    // Go back to wherever they came from
    if (router.canGoBack()) {
      router.back();
    } else {
      router.replace('/(tabs)/plan');
    }
  };

  const canSave = profile.transport.length > 0 && profile.tripPurposes.length > 0;

  // ---------------------------------------------------------------------------
  // Render
  // ---------------------------------------------------------------------------
  return (
    <View style={[styles.container, { paddingTop: insets.top }]}>
      {/* Header */}
      <View style={styles.header}>
        <Text style={styles.headerTitle}>How do you travel?</Text>
        <Text style={styles.headerSubtitle}>
          This makes every trip feel like it was built just for you.
        </Text>
      </View>

      <ScrollView
        contentContainerStyle={styles.scrollContent}
        showsVerticalScrollIndicator={false}
      >
        {/* HOW OFTEN DO YOU TRAVEL */}
        <GlassCard>
          <View style={styles.sliderHeader}>
            <View style={styles.sliderIconWrap}>
              <Compass size={20} color={COLORS.sage} strokeWidth={2} />
            </View>
            <Text style={styles.sliderTitle}>How often do you travel?</Text>
          </View>
          <Text style={styles.pillHint}>This shapes how much guidance we give you</Text>
          <View style={styles.pillGrid}>
            {TRAVEL_FREQUENCY_OPTIONS.map((opt) => {
              const isSelected = profile.travelFrequency === opt.id;
              return (
                <Pressable
                  key={opt.id}
                  style={[styles.pill, styles.pillWide, isSelected && styles.pillSelected]}
                  onPress={() => {
                    Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
                    updateLocal({ travelFrequency: opt.id });
                  }}
                >
                  <View style={styles.pillTextCol}>
                    <Text style={[styles.pillLabel, isSelected && styles.pillLabelSelected]}>
                      {opt.label}
                    </Text>
                    <Text style={styles.pillDescription}>{opt.description}</Text>
                  </View>
                </Pressable>
              );
            })}
          </View>
        </GlassCard>

        {/* PASSPORT (for visa intelligence) */}
        <GlassCard>
          <View style={styles.sliderHeader}>
            <View style={styles.sliderIconWrap}>
              <BookOpen size={20} color={COLORS.sage} strokeWidth={2} />
            </View>
            <Text style={styles.sliderTitle}>Passport</Text>
          </View>
          <Text style={styles.pillHint}>For visa & entry requirements</Text>
          <View style={styles.pillGrid}>
            <Pressable
              style={[styles.pill, styles.pillWide, profile.passportNationality === 'US' && styles.pillSelected]}
              onPress={() => {
                Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
                updateLocal({ passportNationality: 'US' });
              }}
            >
              <Text style={[styles.pillLabel, profile.passportNationality === 'US' && styles.pillLabelSelected]}>
                US Passport
              </Text>
            </Pressable>
            <Pressable
              style={[styles.pill, styles.pillWide, profile.passportNationality === 'AT' && styles.pillSelected]}
              onPress={() => {
                Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
                updateLocal({ passportNationality: 'AT' });
              }}
            >
              <Text style={[styles.pillLabel, profile.passportNationality === 'AT' && styles.pillLabelSelected]}>
                Austrian Passport
              </Text>
            </Pressable>
          </View>
        </GlassCard>

        {/* PACE */}
        <ProfileSlider
          title="Pace"
          icon={<Zap size={20} color={COLORS.sage} strokeWidth={2} />}
          value={profile.pace}
          onChange={(v) => updateLocal({ pace: v })}
          labels={PACE_LABELS}
          dimension="pace"
        />

        {/* BUDGET STYLE */}
        <ProfileSlider
          title="Budget Style"
          icon={<DollarSign size={20} color={COLORS.sage} strokeWidth={2} />}
          value={profile.budgetStyle}
          onChange={(v) => updateLocal({ budgetStyle: v })}
          labels={BUDGET_STYLE_LABELS}
          dimension="budgetStyle"
        />

        {/* CROWD TOLERANCE */}
        <ProfileSlider
          title="Crowd Tolerance"
          icon={<Users size={20} color={COLORS.sage} strokeWidth={2} />}
          value={profile.crowdTolerance}
          onChange={(v) => updateLocal({ crowdTolerance: v })}
          labels={CROWD_LABELS}
          dimension="crowdTolerance"
        />

        {/* FOOD ADVENTUROUSNESS */}
        <ProfileSlider
          title="Food Adventurousness"
          icon={<UtensilsCrossed size={20} color={COLORS.sage} strokeWidth={2} />}
          value={profile.foodAdventurousness}
          onChange={(v) => updateLocal({ foodAdventurousness: v })}
          labels={FOOD_LABELS}
          dimension="foodAdventurousness"
        />

        {/* TRANSPORT */}
        <PillMultiSelect
          title="Transport"
          icon={<Rocket size={20} color={COLORS.sage} strokeWidth={2} />}
          options={TRANSPORT_OPTIONS}
          selected={profile.transport}
          onToggle={toggleTransport as (id: string) => void}
        />

        {/* ACCOMMODATION */}
        <PillSingleSelect
          title="Accommodation"
          icon={<Building2 size={20} color={COLORS.sage} strokeWidth={2} />}
          options={ACCOMMODATION_OPTIONS}
          selected={profile.accommodation}
          onSelect={(id) => updateLocal({ accommodation: id })}
        />

        {/* TRIP PURPOSE */}
        <PillMultiSelect
          title="What do you travel for?"
          icon={<Compass size={20} color={COLORS.sage} strokeWidth={2} />}
          options={TRIP_PURPOSE_OPTIONS}
          selected={profile.tripPurposes}
          onToggle={togglePurpose}
        />

        {/* Save button */}
        <Pressable
          style={[styles.saveButton, !canSave && styles.saveButtonDisabled]}
          onPress={handleSave}
          disabled={!canSave}
        >
          <Text style={styles.saveButtonText}>
            {canSave ? 'Save My Travel DNA' : 'Select transport & trip purposes to continue'}
          </Text>
        </Pressable>

        <Text style={styles.editLaterHint}>
          You can always update this in your profile settings.
        </Text>
      </ScrollView>
    </View>
  );
}

// ---------------------------------------------------------------------------
// Styles
// ---------------------------------------------------------------------------
const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: COLORS.bg,
  } as ViewStyle,
  header: {
    paddingHorizontal: SPACING.lg,
    paddingTop: SPACING.lg,
    paddingBottom: SPACING.md,
  } as ViewStyle,
  headerTitle: {
    fontFamily: FONTS.header,
    fontSize: 32,
    color: COLORS.cream,
    marginBottom: SPACING.xs,
  } as TextStyle,
  headerSubtitle: {
    fontFamily: FONTS.body,
    fontSize: 15,
    color: COLORS.creamMuted,
    lineHeight: 22,
  } as TextStyle,
  scrollContent: {
    paddingHorizontal: SPACING.lg,
    paddingBottom: SPACING.xxxl + 40,
    gap: SPACING.md,
  } as ViewStyle,

  // Glass card
  glassCard: {
    backgroundColor: COLORS.bgGlass,
    borderRadius: RADIUS.xl,
    borderWidth: 1,
    borderColor: COLORS.border,
    padding: SPACING.lg,
  } as ViewStyle,

  // Slider components
  sliderHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: SPACING.sm,
    marginBottom: SPACING.md,
  } as ViewStyle,
  sliderTitleRow: {
    flex: 1,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
  } as ViewStyle,
  sliderIconWrap: {
    width: 36,
    height: 36,
    borderRadius: 18,
    backgroundColor: COLORS.sageLight,
    alignItems: 'center',
    justifyContent: 'center',
  } as ViewStyle,
  sliderTitle: {
    fontFamily: FONTS.header,
    fontSize: 22,
    color: COLORS.cream,
  } as TextStyle,
  slider: {
    width: '100%',
    height: 40,
  } as ViewStyle,
  sliderLabelsRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    marginTop: -4,
  } as ViewStyle,
  sliderMin: {
    fontFamily: FONTS.mono,
    fontSize: 11,
    color: COLORS.creamMuted,
  } as TextStyle,
  sliderMax: {
    fontFamily: FONTS.mono,
    fontSize: 11,
    color: COLORS.creamMuted,
  } as TextStyle,
  sliderDescriptor: {
    fontFamily: FONTS.body,
    fontSize: 13,
    color: COLORS.sage,
    textAlign: 'center',
    flex: 1,
    paddingHorizontal: SPACING.sm,
  } as TextStyle,
  sliderValueBubble: {
    position: 'absolute',
    top: SPACING.md,
    right: SPACING.lg,
    backgroundColor: COLORS.sageLight,
    borderRadius: RADIUS.sm,
    paddingHorizontal: SPACING.sm,
    paddingVertical: 2,
  } as ViewStyle,
  sliderValueText: {
    fontFamily: FONTS.mono,
    fontSize: 13,
    color: COLORS.sage,
    fontWeight: '600',
  } as TextStyle,

  // Personality badge
  personalityBadge: {
    backgroundColor: COLORS.coralLight,
    borderRadius: RADIUS.full,
    paddingHorizontal: SPACING.md,
    paddingVertical: SPACING.xs,
  } as ViewStyle,
  personalityBadgeText: {
    fontFamily: FONTS.mono,
    fontSize: 10,
    color: COLORS.coral,
    letterSpacing: 0.5,
    textTransform: 'uppercase',
  } as TextStyle,

  // Pills
  pillHint: {
    fontFamily: FONTS.mono,
    fontSize: 10,
    color: COLORS.creamMuted,
    letterSpacing: 1,
    textTransform: 'uppercase',
    marginBottom: SPACING.sm,
  } as TextStyle,
  pillGrid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: SPACING.sm,
  } as ViewStyle,
  pill: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: SPACING.xs,
    paddingHorizontal: SPACING.md,
    paddingVertical: SPACING.sm + 2,
    borderRadius: RADIUS.full,
    borderWidth: 1.5,
    borderColor: COLORS.border,
    backgroundColor: COLORS.bgCard,
  } as ViewStyle,
  pillWide: {
    width: '48%',
    flexGrow: 1,
  } as ViewStyle,
  pillSelected: {
    backgroundColor: COLORS.sageLight,
    borderColor: COLORS.sage,
  } as ViewStyle,
  pillEmoji: {
    fontSize: 16,
  } as TextStyle,
  pillLabel: {
    fontFamily: FONTS.bodyMedium,
    fontSize: 13,
    color: COLORS.cream,
  } as TextStyle,
  pillLabelSelected: {
    color: COLORS.sage,
  } as TextStyle,
  pillTextCol: {
    flex: 1,
  } as ViewStyle,
  pillDescription: {
    fontFamily: FONTS.body,
    fontSize: 11,
    color: COLORS.creamMuted,
    marginTop: 1,
  } as TextStyle,

  // Save button
  saveButton: {
    backgroundColor: COLORS.coral,
    borderRadius: RADIUS.lg,
    paddingVertical: SPACING.lg,
    alignItems: 'center',
    marginTop: SPACING.md,
  } as ViewStyle,
  saveButtonDisabled: {
    opacity: 0.4,
  } as ViewStyle,
  saveButtonText: {
    fontFamily: FONTS.bodySemiBold,
    fontSize: 16,
    color: COLORS.white,
  } as TextStyle,
  editLaterHint: {
    fontFamily: FONTS.mono,
    fontSize: 11,
    color: COLORS.creamMuted,
    textAlign: 'center',
    marginTop: SPACING.sm,
    opacity: 0.6,
  } as TextStyle,
});

export default withComingSoon(TravelProfileScreen, { routeName: 'travel-profile', title: 'Travel Profile' });
