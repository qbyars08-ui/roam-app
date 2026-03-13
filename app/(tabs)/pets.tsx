// =============================================================================
// ROAM — Pet Travel Hub
// Manage pets, find sitters, get pet-friendly AI recs, check-in reminders
// =============================================================================
import React, { useState, useCallback } from 'react';
import {
  View,
  Text,
  ScrollView,
  Pressable,
  TextInput,
  Switch,
  Linking,
  Modal,
  StyleSheet,
  type ViewStyle,
  type TextStyle,
} from 'react-native';
import { useRouter } from 'expo-router';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import * as Haptics from '../../lib/haptics';
import { PawPrint } from 'lucide-react-native';
import {
  COLORS,
  FONTS,
  SPACING,
  RADIUS,
  PET_DESTINATIONS,
  ROVER_AFFILIATE_URL,
  WAG_AFFILIATE_URL,
} from '../../lib/constants';
import { useAppStore, type Pet } from '../../lib/store';
import {
  schedulePetCheckIn,
  cancelPetCheckIns,
  requestNotificationPermission,
} from '../../lib/notifications';

// ---------------------------------------------------------------------------
// Card style constants (shared across sections)
// ---------------------------------------------------------------------------
const CARD_BG = COLORS.sageSubtle;
const CARD_BORDER = COLORS.sageLight;

// ---------------------------------------------------------------------------
// Section A — Your Pets
// ---------------------------------------------------------------------------

function PetAvatar({ pet, onLongPress }: { pet: Pet; onLongPress: () => void }) {
  return (
    <Pressable
      onLongPress={() => {
        Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Medium);
        onLongPress();
      }}
      style={({ pressed }) => [
        styles.petAvatar,
        { opacity: pressed ? 0.8 : 1, transform: [{ scale: pressed ? 0.95 : 1 }] },
      ]}
    >
      <Text style={styles.petEmoji}>{pet.type.charAt(0).toUpperCase() + pet.type.slice(1)}</Text>
      <Text style={styles.petName} numberOfLines={1}>{pet.name}</Text>
      <View style={styles.breedChip}>
        <Text style={styles.breedChipText} numberOfLines={1}>{pet.breed || pet.type}</Text>
      </View>
    </Pressable>
  );
}

function AddPetCard({ onPress }: { onPress: () => void }) {
  return (
    <Pressable
      onPress={onPress}
      style={({ pressed }) => [
        styles.petAvatar,
        styles.addPetCard,
        { opacity: pressed ? 0.7 : 1 },
      ]}
    >
      <Text style={styles.addPetPlus}>+</Text>
      <Text style={styles.addPetLabel}>Add Pet</Text>
    </Pressable>
  );
}

// ---------------------------------------------------------------------------
// Add Pet Modal
// ---------------------------------------------------------------------------

type PetType = 'dog' | 'cat' | 'other';

const TYPE_OPTIONS: { key: PetType; label: string }[] = [
  { key: 'dog', label: 'Dog' },
  { key: 'cat', label: 'Cat' },
  { key: 'other', label: 'Other' },
];

function AddPetModal({
  visible,
  onClose,
}: {
  visible: boolean;
  onClose: () => void;
}) {
  const addPet = useAppStore((s) => s.addPet);
  const [name, setName] = useState('');
  const [type, setType] = useState<PetType>('dog');
  const [breed, setBreed] = useState('');
  const handleSave = useCallback(() => {
    if (!name.trim()) return;
    Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
    addPet({ name: name.trim(), type, emoji: '', breed: breed.trim() });
    setName('');
    setBreed('');
    setType('dog');
    onClose();
  }, [name, type, addPet, onClose]);

  return (
    <Modal visible={visible} transparent animationType="slide">
      <Pressable style={styles.modalOverlay} onPress={onClose}>
        <Pressable style={styles.modalSheet} onPress={() => {}}>
          <View style={styles.modalHandle} />
          <Text style={styles.modalTitle}>Add a Pet</Text>

          {/* Name */}
          <Text style={styles.fieldLabel}>Name</Text>
          <TextInput
            style={styles.textInput}
            placeholder="e.g. Luna"
            placeholderTextColor={COLORS.creamMuted}
            value={name}
            onChangeText={setName}
            autoFocus
            maxLength={30}
          />

          {/* Type selector */}
          <Text style={styles.fieldLabel}>Type</Text>
          <View style={styles.typeRow}>
            {TYPE_OPTIONS.map((opt) => (
              <Pressable
                key={opt.key}
                onPress={() => setType(opt.key)}
                style={[
                  styles.typeChip,
                  type === opt.key && styles.typeChipActive,
                ]}
              >
                <Text style={styles.typeChipText}>
                  {opt.label}
                </Text>
              </Pressable>
            ))}
          </View>

          {/* Breed */}
          <Text style={styles.fieldLabel}>Breed</Text>
          <TextInput
            style={styles.textInput}
            placeholder="e.g. Golden Retriever"
            placeholderTextColor={COLORS.creamMuted}
            value={breed}
            onChangeText={setBreed}
            maxLength={40}
          />

          {/* Save */}
          <Pressable
            onPress={handleSave}
            style={({ pressed }) => [
              styles.coralBtn,
              { opacity: pressed ? 0.85 : 1, marginTop: SPACING.lg },
            ]}
          >
            <Text style={styles.coralBtnText}>Save Pet</Text>
          </Pressable>
        </Pressable>
      </Pressable>
    </Modal>
  );
}

// ---------------------------------------------------------------------------
// Section B — Find a Sitter
// ---------------------------------------------------------------------------

function SitterCards() {
  return (
    <View>
      <Text style={styles.sectionHeader}>Find a Sitter</Text>
      <View style={styles.sitterRow}>
        {/* Rover */}
        <View style={styles.sitterCard}>
          <Text style={[styles.sitterLogo, { color: COLORS.sage }]}>ROVER</Text>
          <Text style={styles.sitterTagline}>Trusted sitters near you</Text>
          <Text style={styles.sitterBadge}>Avg. $25/night {'\u2022'} 5{'\u2605'} sitters</Text>
          <Pressable
            onPress={() => Linking.openURL(ROVER_AFFILIATE_URL)}
            style={({ pressed }) => [styles.coralBtn, styles.sitterBtn, { opacity: pressed ? 0.85 : 1 }]}
          >
            <Text style={styles.coralBtnText}>Find a Sitter</Text>
          </Pressable>
        </View>

        {/* Wag */}
        <View style={styles.sitterCard}>
          <Text style={[styles.sitterLogo, { color: COLORS.gold }]}>WAG!</Text>
          <Text style={styles.sitterTagline}>On-demand dog walking</Text>
          <Text style={styles.sitterBadge}>Walking {'\u2022'} Boarding {'\u2022'} Drop-ins</Text>
          <Pressable
            onPress={() => Linking.openURL(WAG_AFFILIATE_URL)}
            style={({ pressed }) => [styles.coralBtn, styles.sitterBtn, { opacity: pressed ? 0.85 : 1 }]}
          >
            <Text style={styles.coralBtnText}>Book Now</Text>
          </Pressable>
        </View>
      </View>
      <Text style={styles.affiliateDisclosure}>
        We get a small kickback if you book here. Your price stays the same.
      </Text>
    </View>
  );
}

// ---------------------------------------------------------------------------
// Section C — Pet-Friendly AI Chat Shortcut
// ---------------------------------------------------------------------------

function PetAICard() {
  const router = useRouter();
  const pets = useAppStore((s) => s.pets);
  const trips = useAppStore((s) => s.trips);
  const appendChatMessage = useAppStore((s) => s.appendChatMessage);
  const firstPet = pets[0];
  const latestTrip = trips[0];

  const handleAsk = useCallback(() => {
    if (!firstPet) return;
    const destination = latestTrip?.destination ?? 'your destination';
    const petType = firstPet.type === 'other' ? 'pet' : firstPet.type;
    const message = `Is ${destination} pet-friendly for my ${petType} ${firstPet.name}? Include: pet-friendly hotels, local dog parks, nearest vet clinic, airline pet policies, and any breed restrictions.`;

    appendChatMessage({
      id: Date.now().toString(),
      role: 'user',
      content: message,
    });
    router.push('/(tabs)/chat');
  }, [firstPet, latestTrip, appendChatMessage, router]);

  return (
    <View style={styles.aiCard}>
      <View style={styles.aiIconWrap}>
        <PawPrint size={36} color={COLORS.sage} strokeWidth={1.5} />
      </View>
      <Text style={styles.aiTitle}>
        Is {latestTrip?.destination ?? 'your destination'} pet-friendly?
      </Text>
      <Text style={styles.aiSubtitle}>
        Ask ROAM's AI about pet policies, dog parks, vet clinics & more
      </Text>
      {firstPet ? (
        <Pressable
          onPress={handleAsk}
          style={({ pressed }) => [styles.coralBtn, { opacity: pressed ? 0.85 : 1, marginTop: SPACING.md }]}
        >
          <Text style={styles.coralBtnText}>Ask for {firstPet.name}</Text>
        </Pressable>
      ) : (
        <Text style={styles.aiHint}>Add your travel buddy above and we'll take it from there</Text>
      )}
    </View>
  );
}

// ---------------------------------------------------------------------------
// Section D — Pet Check-In Reminders
// ---------------------------------------------------------------------------

function ReminderToggle() {
  const pets = useAppStore((s) => s.pets);
  const trips = useAppStore((s) => s.trips);
  const enabled = useAppStore((s) => s.petRemindersEnabled);
  const setEnabled = useAppStore((s) => s.setPetRemindersEnabled);
  const firstPet = pets[0];
  const latestTrip = trips[0];

  const handleToggle = useCallback(
    async (val: boolean) => {
      if (val) {
        const granted = await requestNotificationPermission();
        if (!granted) return;
        if (firstPet && latestTrip) {
          // Use the trip creation date + days as a rough end date
          const start = new Date(latestTrip.createdAt);
          const endDate = new Date(start);
          endDate.setDate(endDate.getDate() + latestTrip.days);
          await schedulePetCheckIn(firstPet.name, endDate.toISOString());
        }
      } else {
        await cancelPetCheckIns();
      }
      setEnabled(val);
    },
    [firstPet, latestTrip, setEnabled]
  );

  return (
    <View style={styles.reminderRow}>
      <View style={{ flex: 1 }}>
        <Text style={styles.reminderTitle}>Pet Check-In Reminders</Text>
        <Text style={styles.reminderSub}>
          Daily 8 PM reminder to check on your sitter during trips
        </Text>
      </View>
      <Switch
        value={enabled}
        onValueChange={handleToggle}
        trackColor={{ false: 'rgba(255,255,255,0.1)', true: COLORS.sage }}
        thumbColor={COLORS.cream}
      />
    </View>
  );
}

// ---------------------------------------------------------------------------
// Section E — Pet-Friendly Destinations
// ---------------------------------------------------------------------------

function PetDestinations() {
  const router = useRouter();
  const setPlanWizard = useAppStore((s) => s.setPlanWizard);

  const handleTap = useCallback(
    (city: string) => {
      // Extract city name before comma for the plan wizard
      const destination = city.split(',')[0].trim();
      setPlanWizard({ destination });
      router.push('/(tabs)/plan');
    },
    [setPlanWizard, router]
  );

  return (
    <View>
      <Text style={styles.sectionHeader}>Pet-Friendly Destinations</Text>
      <ScrollView horizontal showsHorizontalScrollIndicator={false} contentContainerStyle={styles.destScroll}>
        {PET_DESTINATIONS.map((d) => (
          <Pressable
            key={d.city}
            onPress={() => handleTap(d.city)}
            style={({ pressed }) => [
              styles.destCard,
              { opacity: pressed ? 0.8 : 1, transform: [{ scale: pressed ? 0.97 : 1 }] },
            ]}
          >
            {null}
            <Text style={styles.destCity} numberOfLines={1}>{d.city}</Text>
            <Text style={styles.destScore}>
              Pet Score {d.petScore}/5
            </Text>
            <Text style={styles.destHighlight} numberOfLines={1}>{d.highlight}</Text>
          </Pressable>
        ))}
      </ScrollView>
    </View>
  );
}

// ---------------------------------------------------------------------------
// Main Screen
// ---------------------------------------------------------------------------

export default function PetsScreen() {
  const insets = useSafeAreaInsets();
  const [modalVisible, setModalVisible] = useState(false);
  const pets = useAppStore((s) => s.pets);
  const removePet = useAppStore((s) => s.removePet);

  const handleRemovePet = useCallback(
    (pet: Pet) => {
      Haptics.notificationAsync(Haptics.NotificationFeedbackType.Warning);
      removePet(pet.id);
    },
    [removePet]
  );

  return (
    <View style={[styles.container, { paddingTop: insets.top }]}>
      <ScrollView
        showsVerticalScrollIndicator={false}
        contentContainerStyle={styles.scroll}
      >
        {/* Header */}
        <Text style={styles.screenTitle}>Pet Travel Hub</Text>
        <Text style={styles.screenSub}>
          Everything your furry co-pilot needs
        </Text>

        {/* Section A — Your Pets */}
        <Text style={styles.sectionHeader}>Your Pets</Text>
        <ScrollView
          horizontal
          showsHorizontalScrollIndicator={false}
          contentContainerStyle={styles.petsScroll}
        >
          {pets.map((pet) => (
            <PetAvatar
              key={pet.id}
              pet={pet}
              onLongPress={() => handleRemovePet(pet)}
            />
          ))}
          <AddPetCard onPress={() => setModalVisible(true)} />
        </ScrollView>

        {/* Section B — Find a Sitter */}
        <SitterCards />

        {/* Section C — Pet-Friendly AI */}
        <PetAICard />

        {/* Section D — Reminders */}
        <ReminderToggle />

        {/* Section E — Pet-Friendly Destinations */}
        <PetDestinations />
      </ScrollView>

      {/* Add Pet Modal */}
      <AddPetModal
        visible={modalVisible}
        onClose={() => setModalVisible(false)}
      />
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
  scroll: {
    paddingHorizontal: SPACING.lg,
    paddingBottom: 120,
  } as ViewStyle,

  // Screen header
  screenTitle: {
    fontFamily: FONTS.header,
    fontSize: 32,
    color: COLORS.cream,
    marginTop: SPACING.md,
  } as TextStyle,
  screenSub: {
    fontFamily: FONTS.body,
    fontSize: 14,
    color: COLORS.creamMuted,
    marginBottom: SPACING.lg,
  } as TextStyle,

  // Section headers
  sectionHeader: {
    fontFamily: FONTS.header,
    fontSize: 22,
    color: COLORS.cream,
    marginTop: SPACING.xl,
    marginBottom: SPACING.md,
  } as TextStyle,

  // Section A — Pets strip
  petsScroll: {
    gap: SPACING.md,
    paddingRight: SPACING.md,
  } as ViewStyle,
  petAvatar: {
    width: 100,
    alignItems: 'center',
    backgroundColor: CARD_BG,
    borderWidth: 1,
    borderColor: CARD_BORDER,
    borderRadius: RADIUS.lg,
    paddingVertical: SPACING.md,
    paddingHorizontal: SPACING.sm,
  } as ViewStyle,
  petEmoji: {
    fontSize: 36,
    marginBottom: SPACING.xs,
  } as TextStyle,
  petName: {
    fontFamily: FONTS.bodySemiBold,
    fontSize: 14,
    color: COLORS.cream,
    marginBottom: SPACING.xs,
  } as TextStyle,
  breedChip: {
    backgroundColor: COLORS.sageHighlight,
    borderRadius: RADIUS.full,
    paddingHorizontal: SPACING.sm,
    paddingVertical: 2,
  } as ViewStyle,
  breedChipText: {
    fontFamily: FONTS.mono,
    fontSize: 10,
    color: COLORS.sage,
    maxWidth: 80,
  } as TextStyle,
  addPetCard: {
    borderStyle: 'dashed',
    justifyContent: 'center',
  } as ViewStyle,
  addPetPlus: {
    fontSize: 28,
    color: COLORS.sage,
    marginBottom: SPACING.xs,
  } as TextStyle,
  addPetLabel: {
    fontFamily: FONTS.mono,
    fontSize: 11,
    color: COLORS.sage,
  } as TextStyle,

  // Section B — Sitter cards
  sitterRow: {
    flexDirection: 'row',
    gap: SPACING.md,
  } as ViewStyle,
  sitterCard: {
    flex: 1,
    backgroundColor: CARD_BG,
    borderWidth: 1,
    borderColor: CARD_BORDER,
    borderRadius: RADIUS.lg,
    padding: SPACING.md,
  } as ViewStyle,
  sitterLogo: {
    fontFamily: FONTS.header,
    fontSize: 24,
    fontWeight: '700',
    marginBottom: SPACING.xs,
  } as TextStyle,
  sitterTagline: {
    fontFamily: FONTS.body,
    fontSize: 13,
    color: COLORS.creamMuted,
    marginBottom: SPACING.sm,
  } as TextStyle,
  sitterBadge: {
    fontFamily: FONTS.mono,
    fontSize: 10,
    color: COLORS.sage,
    marginBottom: SPACING.md,
  } as TextStyle,
  sitterBtn: {
    paddingVertical: 10,
  } as ViewStyle,
  affiliateDisclosure: {
    fontFamily: FONTS.body,
    fontSize: 12,
    color: COLORS.creamMuted,
    textAlign: 'center',
    marginTop: SPACING.md,
  } as TextStyle,

  // Section C — AI card
  aiCard: {
    backgroundColor: CARD_BG,
    borderWidth: 1,
    borderColor: COLORS.sage,
    borderRadius: RADIUS.lg,
    padding: SPACING.lg,
    marginTop: SPACING.xl,
    alignItems: 'center',
  } as ViewStyle,
  aiIconWrap: {
    marginBottom: SPACING.sm,
  } as ViewStyle,
  aiTitle: {
    fontFamily: FONTS.header,
    fontSize: 20,
    color: COLORS.cream,
    textAlign: 'center',
    marginBottom: SPACING.xs,
  } as TextStyle,
  aiSubtitle: {
    fontFamily: FONTS.body,
    fontSize: 13,
    color: COLORS.creamMuted,
    textAlign: 'center',
    lineHeight: 20,
  } as TextStyle,
  aiHint: {
    fontFamily: FONTS.mono,
    fontSize: 11,
    color: COLORS.creamMuted,
    marginTop: SPACING.md,
  } as TextStyle,

  // Section D — Reminder toggle
  reminderRow: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: CARD_BG,
    borderWidth: 1,
    borderColor: CARD_BORDER,
    borderRadius: RADIUS.lg,
    padding: SPACING.md,
    marginTop: SPACING.xl,
    gap: SPACING.md,
  } as ViewStyle,
  reminderTitle: {
    fontFamily: FONTS.bodySemiBold,
    fontSize: 14,
    color: COLORS.cream,
    marginBottom: 2,
  } as TextStyle,
  reminderSub: {
    fontFamily: FONTS.body,
    fontSize: 12,
    color: COLORS.creamMuted,
    lineHeight: 18,
  } as TextStyle,

  // Section E — Pet destinations
  destScroll: {
    gap: SPACING.md,
    paddingRight: SPACING.md,
  } as ViewStyle,
  destCard: {
    width: 140,
    backgroundColor: CARD_BG,
    borderWidth: 1,
    borderColor: CARD_BORDER,
    borderRadius: RADIUS.lg,
    padding: SPACING.md,
    alignItems: 'center',
  } as ViewStyle,
  destEmoji: {
    fontSize: 28,
    marginBottom: SPACING.xs,
  } as TextStyle,
  destCity: {
    fontFamily: FONTS.bodySemiBold,
    fontSize: 13,
    color: COLORS.cream,
    textAlign: 'center',
    marginBottom: SPACING.xs,
  } as TextStyle,
  destScore: {
    fontFamily: FONTS.mono,
    fontSize: 10,
    color: COLORS.gold,
    marginBottom: SPACING.xs,
  } as TextStyle,
  destHighlight: {
    fontFamily: FONTS.body,
    fontSize: 11,
    color: COLORS.creamMuted,
    textAlign: 'center',
  } as TextStyle,

  // Coral button (reused)
  coralBtn: {
    backgroundColor: COLORS.coral,
    borderRadius: RADIUS.md,
    paddingVertical: 12,
    paddingHorizontal: SPACING.lg,
    alignItems: 'center',
  } as ViewStyle,
  coralBtnText: {
    fontFamily: FONTS.bodySemiBold,
    fontSize: 14,
    color: COLORS.white,
  } as TextStyle,

  // Modal
  modalOverlay: {
    flex: 1,
    backgroundColor: 'rgba(0,0,0,0.6)',
    justifyContent: 'flex-end',
  } as ViewStyle,
  modalSheet: {
    backgroundColor: COLORS.bg,
    borderTopLeftRadius: RADIUS.xl,
    borderTopRightRadius: RADIUS.xl,
    padding: SPACING.lg,
    paddingBottom: 48,
    borderWidth: 1,
    borderColor: CARD_BORDER,
    borderBottomWidth: 0,
  } as ViewStyle,
  modalHandle: {
    width: 40,
    height: 4,
    backgroundColor: 'rgba(255,255,255,0.2)',
    borderRadius: 2,
    alignSelf: 'center',
    marginBottom: SPACING.lg,
  } as ViewStyle,
  modalTitle: {
    fontFamily: FONTS.header,
    fontSize: 26,
    color: COLORS.cream,
    marginBottom: SPACING.lg,
  } as TextStyle,
  fieldLabel: {
    fontFamily: FONTS.mono,
    fontSize: 11,
    color: COLORS.sage,
    letterSpacing: 0.5,
    textTransform: 'uppercase',
    marginBottom: SPACING.xs,
    marginTop: SPACING.md,
  } as TextStyle,
  textInput: {
    fontFamily: FONTS.body,
    fontSize: 16,
    color: COLORS.cream,
    backgroundColor: 'rgba(255,255,255,0.06)',
    borderWidth: 1,
    borderColor: CARD_BORDER,
    borderRadius: RADIUS.md,
    paddingHorizontal: SPACING.md,
    paddingVertical: 12,
  } as TextStyle,
  typeRow: {
    flexDirection: 'row',
    gap: SPACING.sm,
  } as ViewStyle,
  typeChip: {
    flex: 1,
    paddingVertical: 10,
    alignItems: 'center',
    borderRadius: RADIUS.md,
    borderWidth: 1,
    borderColor: CARD_BORDER,
    backgroundColor: 'rgba(255,255,255,0.04)',
  } as ViewStyle,
  typeChipActive: {
    borderColor: COLORS.sage,
    backgroundColor: COLORS.sageHighlight,
  } as ViewStyle,
  typeChipText: {
    fontFamily: FONTS.bodyMedium,
    fontSize: 14,
    color: COLORS.cream,
  } as TextStyle,
});
