// =============================================================================
// ROAM — Trip Builder (premium, granular, zero-compromise trip planning)
// No app does this: deep customization that feels fast, not like a survey.
// Smart defaults for quick builds. Full control for obsessive planners.
// =============================================================================
import React, { useCallback, useRef, useState, useMemo } from 'react';
import {
  View,
  Text,
  TextInput,
  ScrollView,
  Pressable,
  StyleSheet,
  KeyboardAvoidingView,
  Platform,
  Animated,
  Modal,
  type ViewStyle,
  type TextStyle,
} from 'react-native';
import { addDays, format, isSameDay, startOfDay, isWeekend } from 'date-fns';
import * as Haptics from '../../lib/haptics';
import {
  Shuffle,
  Wallet,
  CreditCard,
  Gem,
  Minus,
  Plus,
  Calendar,
  ChevronDown,
  ChevronUp,
  X,
  Sparkles,
  Moon,
  Sunrise,
  Coffee,
  Train,
  Car,
  Footprints,
  Bike,
  Baby,
  Heart,
  Users,
  User,
  Briefcase,
  MapPin,
  AlertCircle,
} from 'lucide-react-native';
import { COLORS, FONTS, SPACING, RADIUS } from '../../lib/constants';
import { useAppStore } from '../../lib/store';

// ---------------------------------------------------------------------------
// Curated destination suggestions — not random, culturally relevant picks
// ---------------------------------------------------------------------------
const TRENDING_DESTINATIONS = [
  { city: 'Tokyo', tag: 'trending', reason: 'Cherry blossom season' },
  { city: 'Lisbon', tag: 'hidden gem', reason: 'Before it gets crowded' },
  { city: 'Mexico City', tag: 'hot right now', reason: 'Food scene is unmatched' },
  { city: 'Kyoto', tag: 'timeless', reason: 'Temples + tea houses' },
  { city: 'Medellín', tag: 'digital nomad', reason: 'Co-working + nightlife' },
  { city: 'Bali', tag: 'classic', reason: 'Rice terraces + surf' },
  { city: 'Budapest', tag: 'underrated', reason: 'Ruin bars + thermal baths' },
  { city: 'Cape Town', tag: 'bucket list', reason: 'Table Mountain + wine' },
  { city: 'Tbilisi', tag: 'emerging', reason: 'Cheap, beautiful, unique food' },
  { city: 'Oaxaca', tag: 'foodie paradise', reason: 'Mezcal + mole + markets' },
  { city: 'Split', tag: 'coastal', reason: 'Adriatic + Game of Thrones vibes' },
  { city: 'Chiang Mai', tag: 'chill', reason: 'Temples + street food + nature' },
  { city: 'Marrakech', tag: 'sensory overload', reason: 'Souks + riads + tagine' },
  { city: 'Buenos Aires', tag: 'vibrant', reason: 'Tango + steak + nightlife' },
  { city: 'Ho Chi Minh City', tag: 'chaos energy', reason: 'Pho + motorbikes + tunnels' },
  { city: 'Porto', tag: 'romantic', reason: 'Wine + tiles + river sunsets' },
  { city: 'Cartagena', tag: 'colorful', reason: 'Old Town + beaches + salsa' },
  { city: 'Kotor', tag: 'secret spot', reason: 'Fjords in the Mediterranean' },
  { city: 'Bangkok', tag: 'maximalist', reason: 'Street food capital of earth' },
  { city: 'Barcelona', tag: 'iconic', reason: 'Gaudí + tapas + beach' },
];

const DURATIONS = [3, 5, 7, 10, 14, 21];

type BudgetTier = 'budget' | 'mid' | 'luxury';

const BUDGET_OPTIONS: Array<{
  id: BudgetTier;
  label: string;
  price: string;
  tagline: string;
  icon: typeof Wallet;
  color: string;
}> = [
  { id: 'budget', label: 'Backpacker', price: '<$100/day', tagline: 'Hostels, street food, walking', icon: Wallet, color: COLORS.sage },
  { id: 'mid', label: 'Comfort', price: '$100-300/day', tagline: 'Hotels, local restaurants, rideshare', icon: CreditCard, color: COLORS.gold },
  { id: 'luxury', label: 'No Limits', price: '$300+/day', tagline: 'Best of everything', icon: Gem, color: COLORS.coral },
];

const BUDGET_TO_BACKEND: Record<BudgetTier, string> = {
  budget: 'backpacker',
  mid: 'comfort',
  luxury: 'no-budget',
};

// Vibes — carefully curated, not generic tags
const VIBES = [
  { id: 'adventure', label: 'Adventure', color: COLORS.coral },
  { id: 'culture', label: 'Deep Culture', color: COLORS.gold },
  { id: 'relaxed', label: 'Slow Travel', color: COLORS.sage },
  { id: 'party', label: 'Nightlife', color: COLORS.coral },
  { id: 'foodie', label: 'Food Obsessed', color: COLORS.gold },
  { id: 'digital nomad', label: 'Work + Travel', color: COLORS.sage },
  { id: 'romantic', label: 'Romantic', color: COLORS.coral },
  { id: 'nature', label: 'Nature First', color: COLORS.sage },
  { id: 'photography', label: 'Photo Spots', color: COLORS.gold },
  { id: 'off-beaten-path', label: 'Skip the Tourists', color: COLORS.sage },
  { id: 'spiritual', label: 'Spiritual', color: COLORS.gold },
  { id: 'adrenaline', label: 'Adrenaline Rush', color: COLORS.coral },
] as const;

// Pace — visual feedback showing how your day fills up
const PACE_OPTIONS = [
  { id: 'slow', label: 'Slow & Deep', desc: '2 activities/day', sub: 'Sleep in, wander, no rush', blocks: 2 },
  { id: 'moderate', label: 'Balanced', desc: '3-4 activities/day', sub: 'See the highlights + downtime', blocks: 4 },
  { id: 'packed', label: 'See Everything', desc: '5-6 activities/day', sub: 'Early starts, packed schedule', blocks: 6 },
] as const;

// Accommodation
const ACCOMMODATION_STYLES = [
  { id: 'hostel', label: 'Hostel', desc: 'Social & cheap' },
  { id: 'hotel', label: 'Hotel', desc: 'Reliable comfort' },
  { id: 'airbnb', label: 'Airbnb', desc: 'Live like a local' },
  { id: 'boutique', label: 'Boutique', desc: 'Unique & curated' },
  { id: 'resort', label: 'Resort', desc: 'All-inclusive luxury' },
  { id: 'capsule', label: 'Capsule', desc: 'Minimalist & efficient' },
] as const;

// Morning preference — what time the AI starts scheduling activities
const MORNING_TYPES = [
  { id: 'early', label: 'Early Bird', time: '6:30 AM', icon: Sunrise },
  { id: 'normal', label: 'Regular', time: '9:00 AM', icon: Coffee },
  { id: 'late', label: 'Sleep In', time: '11:00 AM', icon: Moon },
] as const;

// Trip composition — who you're traveling with (changes activity types dramatically)
const TRIP_COMP = [
  { id: 'solo', label: 'Solo', icon: User },
  { id: 'couple', label: 'Couple', icon: Heart },
  { id: 'friends', label: 'Friends', icon: Users },
  { id: 'family', label: 'Family', icon: Baby },
  { id: 'business', label: 'Business + Leisure', icon: Briefcase },
] as const;

// Dietary
const DIETARY_OPTIONS = ['No restrictions', 'Vegetarian', 'Vegan', 'Halal', 'Kosher', 'Gluten-free', 'Pescatarian', 'Allergies'] as const;

// Transport
const TRANSPORT_OPTIONS = [
  { id: 'walking', label: 'Walking', icon: Footprints },
  { id: 'transit', label: 'Public Transit', icon: Train },
  { id: 'rideshare', label: 'Rideshare/Taxi', icon: Car },
  { id: 'bicycle', label: 'Bicycle', icon: Bike },
  { id: 'rental', label: 'Rental Car', icon: Car },
] as const;

// ---------------------------------------------------------------------------
// Exported types
// ---------------------------------------------------------------------------
export interface QuickModeState {
  destination: string;
  duration: number;
  budget: BudgetTier;
  groupSize: number;
  vibes: string[];
  startDate?: Date;
  pace?: string;
  accommodationStyle?: string;
  morningType?: string;
  tripComposition?: string;
  dietary?: string[];
  transport?: string[];
  mustVisit?: string;
  avoidList?: string;
  specialRequests?: string;
}

interface GenerateQuickModeProps {
  onSubmit: (state: QuickModeState) => Promise<void>;
  isGenerating: boolean;
}

// ---------------------------------------------------------------------------
// Date Picker Modal — premium feel, shows day of week + weather hints
// ---------------------------------------------------------------------------
function DatePickerModal({
  visible,
  value,
  duration,
  onSelect,
  onClose,
}: {
  visible: boolean;
  value: Date;
  duration: number;
  onSelect: (d: Date) => void;
  onClose: () => void;
}) {
  const today = startOfDay(new Date());
  const dates: Date[] = [];
  for (let i = 1; i < 180; i++) {
    dates.push(addDays(today, i));
  }

  return (
    <Modal visible={visible} transparent animationType="fade">
      <Pressable style={dateStyles.backdrop} onPress={onClose}>
        <Pressable style={dateStyles.content} onPress={(e) => e.stopPropagation()}>
          <View style={dateStyles.header}>
            <View>
              <Text style={dateStyles.title}>When are you going?</Text>
              <Text style={dateStyles.subtitle}>
                {duration} days — returning {format(addDays(value, duration), 'MMM d')}
              </Text>
            </View>
            <Pressable onPress={onClose} hitSlop={8}>
              <X size={20} color={COLORS.creamMuted} strokeWidth={2} />
            </Pressable>
          </View>
          <ScrollView style={dateStyles.scroll} showsVerticalScrollIndicator={false}>
            {dates.map((d) => {
              const isSelected = isSameDay(d, value);
              const dayName = format(d, 'EEEE');
              const isWkend = isWeekend(d);
              return (
                <Pressable
                  key={d.toISOString()}
                  style={[dateStyles.option, isSelected && dateStyles.optionSelected]}
                  onPress={() => {
                    Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
                    onSelect(d);
                    onClose();
                  }}
                >
                  <View style={dateStyles.optionRow}>
                    <View>
                      <Text style={[dateStyles.optionDay, isSelected && dateStyles.optionTextSelected]}>
                        {dayName}
                      </Text>
                      <Text style={[dateStyles.optionDate, isSelected && dateStyles.optionTextSelected]}>
                        {format(d, 'MMMM d, yyyy')}
                      </Text>
                    </View>
                    {isWkend && (
                      <View style={dateStyles.weekendBadge}>
                        <Text style={dateStyles.weekendText}>Weekend</Text>
                      </View>
                    )}
                  </View>
                </Pressable>
              );
            })}
          </ScrollView>
        </Pressable>
      </Pressable>
    </Modal>
  );
}

const dateStyles = StyleSheet.create({
  backdrop: { flex: 1, backgroundColor: COLORS.overlay, justifyContent: 'center', alignItems: 'center', padding: SPACING.lg } as ViewStyle,
  content: { width: '100%', maxWidth: 380, maxHeight: '75%', backgroundColor: COLORS.bg, borderRadius: RADIUS.lg, borderWidth: 1, borderColor: COLORS.border, padding: SPACING.lg } as ViewStyle,
  header: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: SPACING.md } as ViewStyle,
  title: { fontFamily: FONTS.header, fontSize: 22, color: COLORS.cream } as TextStyle,
  subtitle: { fontFamily: FONTS.body, fontSize: 13, color: COLORS.creamMuted, marginTop: 2 } as TextStyle,
  scroll: { maxHeight: 400 } as ViewStyle,
  option: { paddingVertical: 14, paddingHorizontal: SPACING.sm, borderRadius: RADIUS.sm } as ViewStyle,
  optionSelected: { backgroundColor: COLORS.sageHighlight } as ViewStyle,
  optionRow: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center' } as ViewStyle,
  optionDay: { fontFamily: FONTS.bodySemiBold, fontSize: 15, color: COLORS.cream } as TextStyle,
  optionDate: { fontFamily: FONTS.body, fontSize: 13, color: COLORS.creamMuted, marginTop: 1 } as TextStyle,
  optionTextSelected: { color: COLORS.sage } as TextStyle,
  weekendBadge: { backgroundColor: COLORS.goldSoft, paddingHorizontal: 8, paddingVertical: 3, borderRadius: RADIUS.sm } as ViewStyle,
  weekendText: { fontFamily: FONTS.mono, fontSize: 10, color: COLORS.gold } as TextStyle,
});

// ---------------------------------------------------------------------------
// Main Component
// ---------------------------------------------------------------------------
export default function GenerateQuickMode({ onSubmit, isGenerating }: GenerateQuickModeProps) {
  const planWizard = useAppStore((s) => s.planWizard);

  // Core
  const [destination, setDestination] = useState(planWizard.destination || '');
  const [duration, setDuration] = useState(7);
  const [budget, setBudget] = useState<BudgetTier>('mid');
  const [groupSize, setGroupSize] = useState(1);
  const [vibes, setVibes] = useState<string[]>([]);
  const [startDate, setStartDate] = useState<Date>(addDays(new Date(), 14));

  // Deep customization
  const [pace, setPace] = useState<string>('moderate');
  const [accommodationStyle, setAccommodationStyle] = useState<string>('hotel');
  const [morningType, setMorningType] = useState<string>('normal');
  const [tripComposition, setTripComposition] = useState<string>('solo');
  const [dietary, setDietary] = useState<string[]>([]);
  const [transport, setTransport] = useState<string[]>(['walking', 'transit']);
  const [mustVisit, setMustVisit] = useState('');
  const [avoidList, setAvoidList] = useState('');
  const [specialRequests, setSpecialRequests] = useState('');

  // UI
  const [error, setError] = useState<string | null>(null);
  const [inputFocused, setInputFocused] = useState(false);
  const [showPersonalize, setShowPersonalize] = useState(false);
  const [datePickerVisible, setDatePickerVisible] = useState(false);
  const shakeAnim = useRef(new Animated.Value(0)).current;

  // Auto-set group size from composition
  const handleTripCompChange = useCallback((comp: string) => {
    Haptics.selectionAsync();
    setTripComposition(comp);
    if (comp === 'solo') setGroupSize(1);
    else if (comp === 'couple') setGroupSize(2);
  }, []);

  const handleShuffle = useCallback(() => {
    Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Medium);
    const pick = TRENDING_DESTINATIONS[Math.floor(Math.random() * TRENDING_DESTINATIONS.length)];
    setDestination(pick.city);
  }, []);

  const toggleVibe = useCallback((v: string) => {
    Haptics.selectionAsync();
    setVibes((prev) =>
      prev.includes(v) ? prev.filter((x) => x !== v) : [...prev, v]
    );
  }, []);

  const toggleDietary = useCallback((d: string) => {
    Haptics.selectionAsync();
    if (d === 'No restrictions') {
      setDietary([]);
      return;
    }
    setDietary((prev) =>
      prev.includes(d) ? prev.filter((x) => x !== d) : [...prev, d]
    );
  }, []);

  const toggleTransport = useCallback((t: string) => {
    Haptics.selectionAsync();
    setTransport((prev) =>
      prev.includes(t) ? prev.filter((x) => x !== t) : [...prev, t]
    );
  }, []);

  const handleSubmit = useCallback(async () => {
    const dest = destination.trim();
    if (!dest) {
      setError('Where are you going?');
      Animated.sequence([
        Animated.timing(shakeAnim, { toValue: 1, duration: 50, useNativeDriver: true }),
        Animated.timing(shakeAnim, { toValue: 0, duration: 50, useNativeDriver: true }),
        Animated.timing(shakeAnim, { toValue: 1, duration: 50, useNativeDriver: true }),
        Animated.timing(shakeAnim, { toValue: 0, duration: 50, useNativeDriver: true }),
      ]).start();
      return;
    }
    setError(null);
    await onSubmit({
      destination: dest,
      duration,
      budget,
      groupSize,
      vibes: vibes.length > 0 ? vibes : ['culture'],
      startDate,
      pace,
      accommodationStyle,
      morningType,
      tripComposition,
      dietary: dietary.length > 0 ? dietary : undefined,
      transport: transport.length > 0 ? transport : undefined,
      mustVisit: mustVisit.trim() || undefined,
      avoidList: avoidList.trim() || undefined,
      specialRequests: specialRequests.trim() || undefined,
    });
  }, [destination, duration, budget, groupSize, vibes, startDate, pace, accommodationStyle, morningType, tripComposition, dietary, transport, mustVisit, avoidList, specialRequests, shakeAnim, onSubmit]);

  const shakeInterpolate = shakeAnim.interpolate({
    inputRange: [0, 1],
    outputRange: [0, 8],
  });

  // Destination suggestion that matches current state
  const _suggestionHint = useMemo(() => {
    if (destination.trim()) return null;
    // eslint-disable-next-line react-hooks/purity -- random pick for empty state, stable with empty deps
    const pick = TRENDING_DESTINATIONS[Math.floor(Math.random() * 5)];
    return pick;
  // eslint-disable-next-line react-hooks/exhaustive-deps -- intentional: stable hint when destination empty
  }, []);

  return (
    <KeyboardAvoidingView
      style={styles.container}
      behavior={Platform.OS === 'ios' ? 'padding' : 'height'}
      keyboardVerticalOffset={0}
    >
      <ScrollView
        style={styles.scroll}
        contentContainerStyle={styles.scrollContent}
        showsVerticalScrollIndicator={false}
        keyboardShouldPersistTaps="handled"
      >
        {/* ── Destination ── */}
        <Section label="Where to?">
          <Animated.View style={[styles.inputRow, { transform: [{ translateX: shakeInterpolate }] }]}>
            <View style={[styles.inputWrap, inputFocused && styles.inputWrapFocused]}>
              <MapPin size={18} color={inputFocused ? COLORS.sage : COLORS.creamDim} strokeWidth={2} />
              <TextInput
                style={styles.input}
                value={destination}
                onChangeText={(t) => { setDestination(t); setError(null); }}
                onFocus={() => setInputFocused(true)}
                onBlur={() => setInputFocused(false)}
                placeholder="Tokyo, Japan"
                placeholderTextColor={COLORS.creamDim}
              />
            </View>
            <Pressable
              onPress={handleShuffle}
              style={({ pressed }) => [styles.shuffleBtn, pressed && { opacity: 0.7 }]}
            >
              <Shuffle size={20} color={COLORS.sage} strokeWidth={2} />
            </Pressable>
          </Animated.View>
          {error ? (
            <View style={styles.errorRow}>
              <AlertCircle size={14} color={COLORS.coral} strokeWidth={2} />
              <Text style={styles.errorText}>{error}</Text>
            </View>
          ) : null}
        </Section>

        {/* ── Travel Dates ── */}
        <Section label="When?">
          <Pressable
            onPress={() => {
              Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
              setDatePickerVisible(true);
            }}
            style={({ pressed }) => [styles.dateBtn, pressed && { opacity: 0.85 }]}
          >
            <Calendar size={22} color={COLORS.sage} strokeWidth={2} />
            <View style={styles.dateTextWrap}>
              <Text style={styles.datePrimary}>
                {format(startDate, 'EEE, MMM d')} — {format(addDays(startDate, duration), 'EEE, MMM d')}
              </Text>
              <Text style={styles.dateSecondary}>
                {duration} days · {format(startDate, 'yyyy')}
              </Text>
            </View>
            <ChevronDown size={18} color={COLORS.creamMuted} strokeWidth={2} />
          </Pressable>
        </Section>

        {/* ── Duration ── */}
        <Section label="How long?">
          <ScrollView horizontal showsHorizontalScrollIndicator={false} contentContainerStyle={styles.pillRow}>
            {DURATIONS.map((d) => (
              <Pressable
                key={d}
                onPress={() => {
                  Haptics.selectionAsync();
                  setDuration(d);
                }}
                style={[styles.durationPill, duration === d ? styles.durationPillSelected : styles.durationPillUnselected]}
              >
                <Text style={[styles.durationText, duration === d && styles.durationTextSelected]}>
                  {d}
                </Text>
                <Text style={[styles.durationUnit, duration === d && styles.durationUnitSelected]}>
                  days
                </Text>
              </Pressable>
            ))}
          </ScrollView>
        </Section>

        {/* ── Budget ── */}
        <Section label="Budget?">
          <View style={styles.budgetRow}>
            {BUDGET_OPTIONS.map((opt) => {
              const isActive = budget === opt.id;
              return (
                <Pressable
                  key={opt.id}
                  onPress={() => {
                    Haptics.selectionAsync();
                    setBudget(opt.id);
                  }}
                  style={({ pressed }) => [
                    styles.budgetCard,
                    isActive && { borderColor: opt.color, borderWidth: 1.5 },
                    !isActive && styles.budgetCardInactive,
                    pressed && { transform: [{ scale: 0.97 }] },
                  ]}
                >
                  <opt.icon size={24} color={isActive ? opt.color : COLORS.creamMuted} strokeWidth={2} />
                  <Text style={[styles.budgetLabel, isActive && { color: opt.color }]}>{opt.label}</Text>
                  <Text style={styles.budgetPrice}>{opt.price}</Text>
                  <Text style={styles.budgetTagline}>{opt.tagline}</Text>
                </Pressable>
              );
            })}
          </View>
        </Section>

        {/* ── Trip Composition ── */}
        <Section label="Who's going?">
          <ScrollView horizontal showsHorizontalScrollIndicator={false} contentContainerStyle={styles.pillRow}>
            {TRIP_COMP.map((c) => {
              const isActive = tripComposition === c.id;
              return (
                <Pressable
                  key={c.id}
                  onPress={() => handleTripCompChange(c.id)}
                  style={[styles.compPill, isActive ? styles.compPillSelected : styles.compPillUnselected]}
                >
                  <c.icon size={18} color={isActive ? COLORS.bg : COLORS.cream} strokeWidth={2} />
                  <Text style={[styles.compText, isActive && styles.compTextSelected]}>{c.label}</Text>
                </Pressable>
              );
            })}
          </ScrollView>
          {(tripComposition === 'friends' || tripComposition === 'family') && (
            <View style={styles.groupInline}>
              <Text style={styles.groupInlineLabel}>How many?</Text>
              <View style={styles.groupRow}>
                <Pressable
                  onPress={() => { Haptics.selectionAsync(); setGroupSize(Math.max(2, groupSize - 1)); }}
                  style={[styles.groupBtn, groupSize <= 2 && styles.groupBtnDisabled]}
                  disabled={groupSize <= 2}
                >
                  <Minus size={18} color={groupSize <= 2 ? COLORS.creamMuted : COLORS.sage} strokeWidth={2} />
                </Pressable>
                <Text style={styles.groupValue}>{groupSize}</Text>
                <Pressable
                  onPress={() => { Haptics.selectionAsync(); setGroupSize(Math.min(20, groupSize + 1)); }}
                  style={[styles.groupBtn, groupSize >= 20 && styles.groupBtnDisabled]}
                  disabled={groupSize >= 20}
                >
                  <Plus size={18} color={groupSize >= 20 ? COLORS.creamMuted : COLORS.sage} strokeWidth={2} />
                </Pressable>
              </View>
            </View>
          )}
        </Section>

        {/* ── Vibes (multi-select) ── */}
        <Section label="What's the vibe?">
          <View style={styles.vibeGrid}>
            {VIBES.map((v) => {
              const isActive = vibes.includes(v.id);
              return (
                <Pressable
                  key={v.id}
                  onPress={() => toggleVibe(v.id)}
                  style={[
                    styles.vibePill,
                    isActive ? { backgroundColor: v.color, borderWidth: 0 } : styles.vibePillUnselected,
                  ]}
                >
                  <Text style={[styles.vibeText, isActive && styles.vibeTextSelected]}>{v.label}</Text>
                </Pressable>
              );
            })}
          </View>
        </Section>

        {/* ── Travel Pace — visual day preview ── */}
        <Section label="Travel pace?">
          <View style={styles.paceRow}>
            {PACE_OPTIONS.map((p) => {
              const isActive = pace === p.id;
              return (
                <Pressable
                  key={p.id}
                  onPress={() => {
                    Haptics.selectionAsync();
                    setPace(p.id);
                  }}
                  style={[styles.paceCard, isActive && styles.paceCardSelected]}
                >
                  {/* Visual activity blocks */}
                  <View style={styles.paceBlocks}>
                    {Array.from({ length: p.blocks }).map((_, i) => (
                      <View
                        key={i}
                        style={[
                          styles.paceBlock,
                          { backgroundColor: isActive ? COLORS.sage : COLORS.creamDimLight },
                        ]}
                      />
                    ))}
                  </View>
                  <Text style={[styles.paceLabel, isActive && styles.paceLabelSelected]}>{p.label}</Text>
                  <Text style={styles.paceDesc}>{p.desc}</Text>
                  <Text style={styles.paceSub}>{p.sub}</Text>
                </Pressable>
              );
            })}
          </View>
        </Section>

        {/* ── Morning Preference ── */}
        <Section label="When does your day start?">
          <View style={styles.morningRow}>
            {MORNING_TYPES.map((m) => {
              const isActive = morningType === m.id;
              return (
                <Pressable
                  key={m.id}
                  onPress={() => {
                    Haptics.selectionAsync();
                    setMorningType(m.id);
                  }}
                  style={[styles.morningCard, isActive && styles.morningCardSelected]}
                >
                  <m.icon size={20} color={isActive ? COLORS.sage : COLORS.creamMuted} strokeWidth={2} />
                  <Text style={[styles.morningLabel, isActive && styles.morningLabelSelected]}>{m.label}</Text>
                  <Text style={styles.morningTime}>{m.time}</Text>
                </Pressable>
              );
            })}
          </View>
        </Section>

        {/* ── Accommodation ── */}
        <Section label="Where do you sleep?">
          <ScrollView horizontal showsHorizontalScrollIndicator={false} contentContainerStyle={styles.pillRow}>
            {ACCOMMODATION_STYLES.map((a) => {
              const isActive = accommodationStyle === a.id;
              return (
                <Pressable
                  key={a.id}
                  onPress={() => {
                    Haptics.selectionAsync();
                    setAccommodationStyle(a.id);
                  }}
                  style={[styles.accomPill, isActive ? styles.accomPillSelected : styles.accomPillUnselected]}
                >
                  <Text style={[styles.accomLabel, isActive && styles.accomLabelSelected]}>{a.label}</Text>
                  <Text style={[styles.accomDesc, isActive && { color: COLORS.bg, opacity: 0.7 }]}>{a.desc}</Text>
                </Pressable>
              );
            })}
          </ScrollView>
        </Section>

        {/* ── Personalize Further (expandable) ── */}
        <Pressable
          onPress={() => {
            Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
            setShowPersonalize((prev) => !prev);
          }}
          style={styles.personalizeToggle}
        >
          <Sparkles size={18} color={COLORS.gold} strokeWidth={2} />
          <Text style={styles.personalizeText}>
            {showPersonalize ? 'Less details' : 'Personalize further'}
          </Text>
          {showPersonalize
            ? <ChevronUp size={16} color={COLORS.gold} strokeWidth={2} />
            : <ChevronDown size={16} color={COLORS.gold} strokeWidth={2} />
          }
        </Pressable>

        {showPersonalize && (
          <>
            {/* ── Transport ── */}
            <Section label="How do you get around?">
              <View style={styles.transportRow}>
                {TRANSPORT_OPTIONS.map((t) => {
                  const isActive = transport.includes(t.id);
                  return (
                    <Pressable
                      key={t.id}
                      onPress={() => toggleTransport(t.id)}
                      style={[styles.transportPill, isActive ? styles.transportPillSelected : styles.transportPillUnselected]}
                    >
                      <t.icon size={16} color={isActive ? COLORS.bg : COLORS.cream} strokeWidth={2} />
                      <Text style={[styles.transportText, isActive && styles.transportTextSelected]}>{t.label}</Text>
                    </Pressable>
                  );
                })}
              </View>
            </Section>

            {/* ── Dietary ── */}
            <Section label="Dietary needs?">
              <View style={styles.vibeGrid}>
                {DIETARY_OPTIONS.map((d) => {
                  const isNone = d === 'No restrictions';
                  const isActive = isNone ? dietary.length === 0 : dietary.includes(d);
                  return (
                    <Pressable
                      key={d}
                      onPress={() => toggleDietary(d)}
                      style={[styles.dietPill, isActive ? styles.dietPillSelected : styles.dietPillUnselected]}
                    >
                      <Text style={[styles.dietText, isActive && styles.dietTextSelected]}>{d}</Text>
                    </Pressable>
                  );
                })}
              </View>
            </Section>

            {/* ── Must-visit Spots ── */}
            <Section label="Must-visit spots">
              <TextInput
                style={styles.textArea}
                value={mustVisit}
                onChangeText={setMustVisit}
                placeholder="Tsukiji Market, teamLab, a hidden jazz bar, that ramen place from TikTok..."
                placeholderTextColor={COLORS.creamDim}
                multiline
                numberOfLines={3}
                textAlignVertical="top"
              />
              <Text style={styles.helper}>AI weaves these into your itinerary at the best times</Text>
            </Section>

            {/* ── Things to Avoid ── */}
            <Section label="Skip list">
              <TextInput
                style={styles.textArea}
                value={avoidList}
                onChangeText={setAvoidList}
                placeholder="Tourist traps, super spicy food, long bus rides, museums..."
                placeholderTextColor={COLORS.creamDim}
                multiline
                numberOfLines={2}
                textAlignVertical="top"
              />
            </Section>

            {/* ── Special Requests ── */}
            <Section label="Anything else AI should know?">
              <TextInput
                style={styles.textArea}
                value={specialRequests}
                onChangeText={setSpecialRequests}
                placeholder="Celebrating my birthday on Day 3, need wheelchair access, traveling with a 2-year-old, I want to propose..."
                placeholderTextColor={COLORS.creamDim}
                multiline
                numberOfLines={3}
                textAlignVertical="top"
              />
            </Section>
          </>
        )}
      </ScrollView>

      {/* ── Generate CTA ── */}
      <View style={styles.ctaWrap}>
        <Pressable
          onPress={handleSubmit}
          disabled={isGenerating}
          style={({ pressed }) => [styles.cta, (isGenerating || pressed) && styles.ctaPressed]}
        >
          {isGenerating ? (
            <>
              <Sparkles size={20} color={COLORS.bg} strokeWidth={2} />
              <Text style={styles.ctaLoading}>Building your perfect trip...</Text>
            </>
          ) : (
            <>
              <Sparkles size={20} color={COLORS.bg} strokeWidth={2} />
              <Text style={styles.ctaText}>Generate My Trip</Text>
            </>
          )}
        </Pressable>
      </View>

      <DatePickerModal
        visible={datePickerVisible}
        value={startDate}
        duration={duration}
        onSelect={setStartDate}
        onClose={() => setDatePickerVisible(false)}
      />
    </KeyboardAvoidingView>
  );
}

function Section({ label, children }: { label: string; children: React.ReactNode }) {
  return (
    <View style={styles.section}>
      <Text style={styles.sectionLabel}>{label}</Text>
      {children}
    </View>
  );
}

// ---------------------------------------------------------------------------
// Styles
// ---------------------------------------------------------------------------
const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: COLORS.bg } as ViewStyle,
  scroll: { flex: 1 } as ViewStyle,
  scrollContent: { paddingHorizontal: SPACING.md, paddingTop: SPACING.lg, paddingBottom: 140 } as ViewStyle,
  section: { marginBottom: SPACING.xl } as ViewStyle,
  sectionLabel: { fontFamily: FONTS.header, fontSize: 20, color: COLORS.cream, marginBottom: SPACING.sm } as TextStyle,

  // Destination input
  inputRow: { flexDirection: 'row', alignItems: 'center', gap: SPACING.sm } as ViewStyle,
  inputWrap: {
    flex: 1, flexDirection: 'row', alignItems: 'center', gap: SPACING.sm,
    backgroundColor: COLORS.bgCard, borderRadius: RADIUS.lg, borderWidth: 1,
    borderColor: COLORS.whiteFaintBorder, paddingHorizontal: SPACING.md, height: 52,
  } as ViewStyle,
  inputWrapFocused: { borderColor: COLORS.sage } as ViewStyle,
  input: { flex: 1, fontFamily: FONTS.body, fontSize: 16, color: COLORS.cream, padding: 0 } as TextStyle,
  shuffleBtn: { width: 48, height: 48, borderRadius: RADIUS.lg, backgroundColor: COLORS.bgCard, alignItems: 'center', justifyContent: 'center', borderWidth: 1, borderColor: COLORS.whiteFaintBorder } as ViewStyle,
  errorRow: { flexDirection: 'row', alignItems: 'center', gap: 6, marginTop: SPACING.xs } as ViewStyle,
  errorText: { fontFamily: FONTS.body, fontSize: 13, color: COLORS.coral } as TextStyle,

  // Date button
  dateBtn: { flexDirection: 'row', alignItems: 'center', gap: SPACING.md, backgroundColor: COLORS.bgCard, borderRadius: RADIUS.lg, borderWidth: 1, borderColor: COLORS.whiteFaintBorder, paddingHorizontal: SPACING.md, paddingVertical: 14 } as ViewStyle,
  dateTextWrap: { flex: 1 } as ViewStyle,
  datePrimary: { fontFamily: FONTS.bodySemiBold, fontSize: 15, color: COLORS.cream } as TextStyle,
  dateSecondary: { fontFamily: FONTS.mono, fontSize: 12, color: COLORS.creamMuted, marginTop: 2 } as TextStyle,

  // Duration pills
  pillRow: { flexDirection: 'row', gap: SPACING.sm } as ViewStyle,
  durationPill: { width: 56, height: 56, borderRadius: RADIUS.lg, alignItems: 'center', justifyContent: 'center' } as ViewStyle,
  durationPillSelected: { backgroundColor: COLORS.sage } as ViewStyle,
  durationPillUnselected: { backgroundColor: COLORS.bgCard, borderWidth: 1, borderColor: COLORS.whiteFaintBorder } as ViewStyle,
  durationText: { fontFamily: FONTS.mono, fontSize: 20, color: COLORS.cream } as TextStyle,
  durationTextSelected: { color: COLORS.bg } as TextStyle,
  durationUnit: { fontFamily: FONTS.body, fontSize: 10, color: COLORS.creamMuted, marginTop: -2 } as TextStyle,
  durationUnitSelected: { color: COLORS.bg, opacity: 0.7 } as TextStyle,

  // Budget
  budgetRow: { flexDirection: 'row', gap: SPACING.sm } as ViewStyle,
  budgetCard: { flex: 1, backgroundColor: COLORS.bgCard, borderRadius: RADIUS.lg, borderWidth: 1, borderColor: COLORS.whiteFaintBorder, padding: SPACING.md, alignItems: 'center', gap: 4 } as ViewStyle,
  budgetCardInactive: {} as ViewStyle,
  budgetLabel: { fontFamily: FONTS.bodySemiBold, fontSize: 13, color: COLORS.cream } as TextStyle,
  budgetPrice: { fontFamily: FONTS.mono, fontSize: 11, color: COLORS.creamMuted } as TextStyle,
  budgetTagline: { fontFamily: FONTS.body, fontSize: 9, color: COLORS.creamDim, textAlign: 'center' } as TextStyle,

  // Trip composition
  compPill: { flexDirection: 'row', alignItems: 'center', gap: 8, paddingHorizontal: 16, paddingVertical: 10, borderRadius: RADIUS.full } as ViewStyle,
  compPillSelected: { backgroundColor: COLORS.sage } as ViewStyle,
  compPillUnselected: { backgroundColor: COLORS.bgCard, borderWidth: 1, borderColor: COLORS.whiteFaintBorder } as ViewStyle,
  compText: { fontFamily: FONTS.body, fontSize: 13, color: COLORS.cream } as TextStyle,
  compTextSelected: { color: COLORS.bg } as TextStyle,
  groupInline: { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', marginTop: SPACING.md, paddingHorizontal: SPACING.xs } as ViewStyle,
  groupInlineLabel: { fontFamily: FONTS.body, fontSize: 14, color: COLORS.cream } as TextStyle,
  groupRow: { flexDirection: 'row', alignItems: 'center', gap: SPACING.md } as ViewStyle,
  groupBtn: { width: 36, height: 36, borderRadius: RADIUS.full, backgroundColor: COLORS.bgCard, alignItems: 'center', justifyContent: 'center' } as ViewStyle,
  groupBtnDisabled: { opacity: 0.4 } as ViewStyle,
  groupValue: { fontFamily: FONTS.mono, fontSize: 22, color: COLORS.gold, minWidth: 30, textAlign: 'center' } as TextStyle,

  // Vibes
  vibeGrid: { flexDirection: 'row', flexWrap: 'wrap', gap: SPACING.sm } as ViewStyle,
  vibePill: { paddingHorizontal: 16, paddingVertical: 10, borderRadius: RADIUS.full } as ViewStyle,
  vibePillUnselected: { backgroundColor: COLORS.bgCard, borderWidth: 1, borderColor: COLORS.whiteFaintBorder } as ViewStyle,
  vibeText: { fontFamily: FONTS.body, fontSize: 13, color: COLORS.cream } as TextStyle,
  vibeTextSelected: { color: COLORS.bg, fontFamily: FONTS.bodySemiBold } as TextStyle,

  // Pace
  paceRow: { flexDirection: 'row', gap: SPACING.sm } as ViewStyle,
  paceCard: { flex: 1, backgroundColor: COLORS.bgCard, borderRadius: RADIUS.lg, borderWidth: 1, borderColor: COLORS.whiteFaintBorder, padding: SPACING.md, alignItems: 'center', gap: 4 } as ViewStyle,
  paceCardSelected: { borderColor: COLORS.sage, backgroundColor: COLORS.sageLight } as ViewStyle,
  paceBlocks: { flexDirection: 'row', gap: 3, marginBottom: 4, height: 12, alignItems: 'flex-end' } as ViewStyle,
  paceBlock: { width: 6, height: 12, borderRadius: 2 } as ViewStyle,
  paceLabel: { fontFamily: FONTS.bodySemiBold, fontSize: 12, color: COLORS.cream } as TextStyle,
  paceLabelSelected: { color: COLORS.sage } as TextStyle,
  paceDesc: { fontFamily: FONTS.mono, fontSize: 10, color: COLORS.creamMuted, textAlign: 'center' } as TextStyle,
  paceSub: { fontFamily: FONTS.body, fontSize: 9, color: COLORS.creamDim, textAlign: 'center', marginTop: 2 } as TextStyle,

  // Morning
  morningRow: { flexDirection: 'row', gap: SPACING.sm } as ViewStyle,
  morningCard: { flex: 1, backgroundColor: COLORS.bgCard, borderRadius: RADIUS.lg, borderWidth: 1, borderColor: COLORS.whiteFaintBorder, padding: SPACING.md, alignItems: 'center', gap: 4 } as ViewStyle,
  morningCardSelected: { borderColor: COLORS.sage, backgroundColor: COLORS.sageLight } as ViewStyle,
  morningLabel: { fontFamily: FONTS.bodySemiBold, fontSize: 12, color: COLORS.cream } as TextStyle,
  morningLabelSelected: { color: COLORS.sage } as TextStyle,
  morningTime: { fontFamily: FONTS.mono, fontSize: 11, color: COLORS.creamMuted } as TextStyle,

  // Accommodation
  accomPill: { paddingHorizontal: 16, paddingVertical: 12, borderRadius: RADIUS.lg, minWidth: 100, alignItems: 'center' } as ViewStyle,
  accomPillSelected: { backgroundColor: COLORS.sage } as ViewStyle,
  accomPillUnselected: { backgroundColor: COLORS.bgCard, borderWidth: 1, borderColor: COLORS.whiteFaintBorder } as ViewStyle,
  accomLabel: { fontFamily: FONTS.bodySemiBold, fontSize: 13, color: COLORS.cream } as TextStyle,
  accomLabelSelected: { color: COLORS.bg } as TextStyle,
  accomDesc: { fontFamily: FONTS.body, fontSize: 10, color: COLORS.creamMuted, marginTop: 2 } as TextStyle,

  // Personalize toggle
  personalizeToggle: { flexDirection: 'row', alignItems: 'center', justifyContent: 'center', gap: SPACING.sm, paddingVertical: 16, marginBottom: SPACING.md, borderTopWidth: 1, borderTopColor: COLORS.whiteFaintBorder, borderBottomWidth: 1, borderBottomColor: COLORS.whiteFaintBorder } as ViewStyle,
  personalizeText: { fontFamily: FONTS.bodySemiBold, fontSize: 14, color: COLORS.gold } as TextStyle,

  // Transport
  transportRow: { flexDirection: 'row', flexWrap: 'wrap', gap: SPACING.sm } as ViewStyle,
  transportPill: { flexDirection: 'row', alignItems: 'center', gap: 8, paddingHorizontal: 14, paddingVertical: 10, borderRadius: RADIUS.full } as ViewStyle,
  transportPillSelected: { backgroundColor: COLORS.sage } as ViewStyle,
  transportPillUnselected: { backgroundColor: COLORS.bgCard, borderWidth: 1, borderColor: COLORS.whiteFaintBorder } as ViewStyle,
  transportText: { fontFamily: FONTS.body, fontSize: 13, color: COLORS.cream } as TextStyle,
  transportTextSelected: { color: COLORS.bg } as TextStyle,

  // Dietary
  dietPill: { paddingHorizontal: 14, paddingVertical: 10, borderRadius: RADIUS.full } as ViewStyle,
  dietPillSelected: { backgroundColor: COLORS.gold } as ViewStyle,
  dietPillUnselected: { backgroundColor: COLORS.bgCard, borderWidth: 1, borderColor: COLORS.whiteFaintBorder } as ViewStyle,
  dietText: { fontFamily: FONTS.body, fontSize: 13, color: COLORS.cream } as TextStyle,
  dietTextSelected: { color: COLORS.bg } as TextStyle,

  // Text areas
  textArea: { fontFamily: FONTS.body, fontSize: 14, color: COLORS.cream, backgroundColor: COLORS.bgCard, borderRadius: RADIUS.lg, borderWidth: 1, borderColor: COLORS.whiteFaintBorder, paddingHorizontal: SPACING.lg, paddingVertical: SPACING.md, minHeight: 72 } as TextStyle,
  helper: { fontFamily: FONTS.body, fontSize: 11, color: COLORS.creamDim, marginTop: SPACING.xs, marginLeft: 4 } as TextStyle,

  // CTA
  ctaWrap: { position: 'absolute', bottom: 0, left: 0, right: 0, padding: SPACING.md, paddingBottom: SPACING.lg, backgroundColor: COLORS.bg } as ViewStyle,
  cta: { height: 56, borderRadius: RADIUS.xl, backgroundColor: COLORS.sage, alignItems: 'center', justifyContent: 'center', flexDirection: 'row', gap: SPACING.sm } as ViewStyle,
  ctaPressed: { opacity: 0.85 } as ViewStyle,
  ctaText: { fontFamily: FONTS.header, fontSize: 22, color: COLORS.bg } as TextStyle,
  ctaLoading: { fontFamily: FONTS.body, fontSize: 15, color: COLORS.bg } as TextStyle,
});

export { BUDGET_TO_BACKEND };
