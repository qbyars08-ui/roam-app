// =============================================================================
// ROAM — People You've Met
// Add contacts at each destination, where met, photos, social links, proximity
// =============================================================================
import React, { useCallback, useEffect, useState } from 'react';
import {
  View,
  Text,
  FlatList,
  Pressable,
  StyleSheet,
  TextInput,
  Modal,
  Linking,
  Image,
  Alert,
  ScrollView,
  type ViewStyle,
  type TextStyle,
  type ImageStyle,
} from 'react-native';
import { useRouter } from 'expo-router';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import * as Haptics from '../lib/haptics';
import { withComingSoon } from '../lib/with-coming-soon';
import { Plus, MapPin } from 'lucide-react-native';
import { COLORS, FONTS, SPACING, RADIUS } from '../lib/constants';
import {
  getPeopleMet,
  savePersonMet,
  updatePersonMet,
  deletePersonMet,
  getPeopleInCity,
  type PersonMet,
} from '../lib/people-met';
import { useAppStore } from '../lib/store';

const DEFAULT_CITY = '';

function PeopleMetScreen() {
  const insets = useSafeAreaInsets();
  const router = useRouter();
  const [people, setPeople] = useState<PersonMet[]>([]);
  const [modalOpen, setModalOpen] = useState(false);
  const [editing, setEditing] = useState<PersonMet | null>(null);
  const [form, setForm] = useState({
    name: '',
    whereMet: '',
    destination: '',
    tripDates: '',
    photoUrl: '',
    instagram: '',
    linkedin: '',
    twitter: '',
    city: '',
  });

  const activeTrip = useAppStore((s) => {
    const id = s.activeTripId;
    return id ? s.trips.find((t) => t.id === id) : null;
  });
  const currentCity = activeTrip?.destination ?? DEFAULT_CITY;
  const peopleInCity = currentCity ? getPeopleInCity(people, currentCity) : [];

  const load = useCallback(async () => {
    const list = await getPeopleMet();
    setPeople(list);
  }, []);

  useEffect(() => {
    load();
  }, [load]);

  const openAdd = useCallback(() => {
    Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
    setEditing(null);
    setForm({
      name: '',
      whereMet: '',
      destination: '',
      tripDates: '',
      photoUrl: '',
      instagram: '',
      linkedin: '',
      twitter: '',
      city: '',
    });
    setModalOpen(true);
  }, []);

  const openEdit = useCallback((p: PersonMet) => {
    Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
    setEditing(p);
    setForm({
      name: p.name,
      whereMet: p.whereMet,
      destination: p.destination ?? '',
      tripDates: p.tripDates,
      photoUrl: p.photoUrl ?? '',
      instagram: p.instagram ?? '',
      linkedin: p.linkedin ?? '',
      twitter: p.twitter ?? '',
      city: p.city ?? '',
    });
    setModalOpen(true);
  }, []);

  const handleSave = useCallback(async () => {
    if (!form.name.trim() || !form.whereMet.trim() || !form.tripDates.trim()) return;
    Haptics.notificationAsync(Haptics.NotificationFeedbackType.Success);
    if (editing) {
      await updatePersonMet(editing.id, {
        name: form.name.trim(),
        whereMet: form.whereMet.trim(),
        destination: form.destination.trim() || undefined,
        tripDates: form.tripDates.trim(),
        photoUrl: form.photoUrl.trim() || undefined,
        instagram: form.instagram.trim() || undefined,
        linkedin: form.linkedin.trim() || undefined,
        twitter: form.twitter.trim() || undefined,
        city: form.city.trim() || undefined,
      });
    } else {
      await savePersonMet({
        name: form.name.trim(),
        whereMet: form.whereMet.trim(),
        destination: form.destination.trim() || undefined,
        tripDates: form.tripDates.trim(),
        photoUrl: form.photoUrl.trim() || undefined,
        instagram: form.instagram.trim() || undefined,
        linkedin: form.linkedin.trim() || undefined,
        twitter: form.twitter.trim() || undefined,
        city: form.city.trim() || undefined,
      });
    }
    setModalOpen(false);
    load();
  }, [editing, form, load]);

  const handleDelete = useCallback(
    (p: PersonMet) => {
      Alert.alert('Remove contact', `Remove ${p.name}?`, [
        { text: 'Cancel', style: 'cancel' },
        {
          text: 'Remove',
          style: 'destructive',
          onPress: async () => {
            await deletePersonMet(p.id);
            load();
          },
        },
      ]);
    },
    [load]
  );

  const Input = ({
    label,
    value,
    onChange,
    placeholder,
  }: {
    label: string;
    value: string;
    onChange: (v: string) => void;
    placeholder?: string;
  }) => (
    <View style={formStyles.field}>
      <Text style={formStyles.label}>{label}</Text>
      <TextInput
        style={formStyles.input}
        value={value}
        onChangeText={onChange}
        placeholder={placeholder}
        placeholderTextColor={COLORS.creamMuted}
      />
    </View>
  );

  return (
    <View style={[styles.container, { paddingTop: insets.top }]}>
      <View style={styles.header}>
        <Pressable onPress={() => router.back()} hitSlop={12}>
          <Text style={styles.back}>{'\u2190'}</Text>
        </Pressable>
        <Text style={styles.title}>People You&apos;ve Met</Text>
        <Text style={styles.subtitle}>
          {people.length} contact{people.length !== 1 ? 's' : ''} from your travels
        </Text>
      </View>

      {/* Proximity: people in your city */}
      {peopleInCity.length > 0 && (
        <View style={styles.proximityCard}>
          <Text style={styles.proximityTitle}>Near you</Text>
          <Text style={styles.proximitySub}>
            {peopleInCity.length} {peopleInCity.length === 1 ? 'person' : 'people'} in {currentCity}
          </Text>
          {peopleInCity.slice(0, 3).map((p) => (
            <Pressable
              key={p.id}
              style={styles.proximityRow}
              onPress={() => openEdit(p)}
            >
              {p.photoUrl ? (
                <Image source={{ uri: p.photoUrl }} style={styles.proxAvatar} />
              ) : (
                <View style={styles.avatar}>
                  <Text style={styles.avatarText}>{p.name[0]}</Text>
                </View>
              )}
              <Text style={styles.proxName}>{p.name}</Text>
            </Pressable>
          ))}
        </View>
      )}

      <FlatList
        data={people}
        keyExtractor={(p) => p.id}
        contentContainerStyle={styles.list}
        renderItem={({ item }) => (
          <View style={styles.card}>
            <Pressable style={styles.cardInner} onPress={() => openEdit(item)}>
              {item.photoUrl ? (
                <Image source={{ uri: item.photoUrl }} style={styles.cardPhoto} />
              ) : (
                <View style={styles.avatar}>
                  <Text style={styles.avatarText}>{item.name[0]}</Text>
                </View>
              )}
              <View style={styles.info}>
                <Text style={styles.name}>{item.name}</Text>
                <Text style={styles.meta}>
                  Met in {item.whereMet}
                  {item.destination ? `, ${item.destination}` : ''} – {item.tripDates}
                </Text>
                <View style={styles.socialRow}>
                  {item.instagram && (
                    <Pressable
                      onPress={() =>
                        Linking.openURL(`https://instagram.com/${item.instagram}`)
                      }
                    >
                      <Text style={styles.ig}>@{item.instagram}</Text>
                    </Pressable>
                  )}
                  {item.linkedin && (
                    <Pressable
                      onPress={() =>
                        Linking.openURL(`https://linkedin.com/in/${item.linkedin}`)
                      }
                    >
                      <Text style={styles.link}>LinkedIn</Text>
                    </Pressable>
                  )}
                  {item.twitter && (
                    <Pressable
                      onPress={() =>
                        Linking.openURL(`https://twitter.com/${item.twitter}`)
                      }
                    >
                      <Text style={styles.link}>@{item.twitter}</Text>
                    </Pressable>
                  )}
                  {item.city && (
                    <View style={styles.cityBadge}>
                      <MapPin size={10} color={COLORS.sage} />
                      <Text style={styles.cityText}>{item.city}</Text>
                    </View>
                  )}
                </View>
              </View>
            </Pressable>
            <Pressable
              onPress={() => handleDelete(item)}
              style={styles.deleteBtn}
            >
              <Text style={styles.deleteText}>Remove</Text>
            </Pressable>
          </View>
        )}
      />

      <Pressable style={[styles.fab, { bottom: insets.bottom + SPACING.lg }]} onPress={openAdd}>
        <Plus size={24} color={COLORS.bg} strokeWidth={2} />
      </Pressable>

      <Modal visible={modalOpen} animationType="slide" transparent>
        <View style={modalStyles.overlay}>
          <View style={[modalStyles.sheet, { paddingBottom: insets.bottom + SPACING.lg }]}>
            <View style={modalStyles.handle} />
            <Text style={modalStyles.title}>{editing ? 'Edit contact' : 'Add contact'}</Text>
            <ScrollView showsVerticalScrollIndicator={false}>
              <Input
                label="Name"
                value={form.name}
                onChange={(v) => setForm((f) => ({ ...f, name: v }))}
                placeholder="Full name"
              />
              <Input
                label="Where you met"
                value={form.whereMet}
                onChange={(v) => setForm((f) => ({ ...f, whereMet: v }))}
                placeholder="e.g. Hostel common room, walking tour"
              />
              <Input
                label="Destination"
                value={form.destination}
                onChange={(v) => setForm((f) => ({ ...f, destination: v }))}
                placeholder="e.g. Lisbon, Portugal"
              />
              <Input
                label="Trip dates"
                value={form.tripDates}
                onChange={(v) => setForm((f) => ({ ...f, tripDates: v }))}
                placeholder="e.g. March 2025"
              />
              <Input
                label="Photo URL"
                value={form.photoUrl}
                onChange={(v) => setForm((f) => ({ ...f, photoUrl: v }))}
                placeholder="Optional image URL"
              />
              <Input
                label="Instagram"
                value={form.instagram}
                onChange={(v) => setForm((f) => ({ ...f, instagram: v.replace('@', '') }))}
                placeholder="@username"
              />
              <Input
                label="LinkedIn"
                value={form.linkedin}
                onChange={(v) => setForm((f) => ({ ...f, linkedin: v }))}
                placeholder="Username or profile URL"
              />
              <Input
                label="Twitter"
                value={form.twitter}
                onChange={(v) => setForm((f) => ({ ...f, twitter: v.replace('@', '') }))}
                placeholder="@username"
              />
              <Input
                label="Their city (proximity)"
                value={form.city}
                onChange={(v) => setForm((f) => ({ ...f, city: v }))}
                placeholder="For alerts when you're in the same city"
              />
            </ScrollView>
            <View style={modalStyles.actions}>
              <Pressable
                style={modalStyles.cancelBtn}
                onPress={() => setModalOpen(false)}
              >
                <Text style={modalStyles.cancelText}>Cancel</Text>
              </Pressable>
              <Pressable
                style={[
                  modalStyles.saveBtn,
                  (!form.name.trim() || !form.whereMet.trim() || !form.tripDates.trim()) &&
                    modalStyles.saveBtnDisabled,
                ]}
                onPress={handleSave}
                disabled={!form.name.trim() || !form.whereMet.trim() || !form.tripDates.trim()}
              >
                <Text style={modalStyles.saveText}>Save</Text>
              </Pressable>
            </View>
          </View>
        </View>
      </Modal>
    </View>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: COLORS.bg },
  header: { padding: SPACING.lg },
  back: { fontSize: 24, color: COLORS.cream, marginBottom: SPACING.sm },
  title: {
    fontFamily: FONTS.header,
    fontSize: 28,
    color: COLORS.cream,
  } as TextStyle,
  subtitle: {
    fontFamily: FONTS.body,
    fontSize: 14,
    color: COLORS.creamMuted,
    marginTop: 4,
  } as TextStyle,
  proximityCard: {
    marginHorizontal: SPACING.lg,
    marginBottom: SPACING.md,
    backgroundColor: COLORS.sageSoft,
    borderRadius: RADIUS.lg,
    borderWidth: 1,
    borderColor: COLORS.sage + '40',
    padding: SPACING.md,
  } as ViewStyle,
  proximityTitle: {
    fontFamily: FONTS.mono,
    fontSize: 11,
    color: COLORS.sage,
    letterSpacing: 1,
  } as TextStyle,
  proximitySub: {
    fontFamily: FONTS.body,
    fontSize: 13,
    color: COLORS.cream,
    marginTop: 4,
  } as TextStyle,
  proximityRow: {
    flexDirection: 'row',
    alignItems: 'center',
    marginTop: SPACING.sm,
    gap: SPACING.sm,
  } as ViewStyle,
  proxAvatar: {
    width: 36,
    height: 36,
    borderRadius: 18,
  } as ImageStyle,
  proxName: {
    fontFamily: FONTS.bodyMedium,
    fontSize: 14,
    color: COLORS.cream,
  } as TextStyle,
  list: { padding: SPACING.lg, paddingBottom: 100 },
  card: {
    marginBottom: SPACING.md,
    backgroundColor: COLORS.bgCard,
    borderRadius: RADIUS.lg,
    borderWidth: 1,
    borderColor: COLORS.border,
    overflow: 'hidden',
  } as ViewStyle,
  cardInner: {
    flexDirection: 'row',
    alignItems: 'center',
    padding: SPACING.md,
  } as ViewStyle,
  cardPhoto: {
    width: 56,
    height: 56,
    borderRadius: 28,
    marginRight: SPACING.md,
  } as ImageStyle,
  avatar: {
    width: 56,
    height: 56,
    borderRadius: 28,
    backgroundColor: COLORS.sageLight,
    alignItems: 'center',
    justifyContent: 'center',
    marginRight: SPACING.md,
  } as ViewStyle,
  avatarText: {
    fontFamily: FONTS.header,
    fontSize: 22,
    color: COLORS.sage,
  } as TextStyle,
  info: { flex: 1 },
  name: {
    fontFamily: FONTS.bodySemiBold,
    fontSize: 16,
    color: COLORS.cream,
  } as TextStyle,
  meta: {
    fontFamily: FONTS.body,
    fontSize: 13,
    color: COLORS.creamMuted,
    marginTop: 2,
  } as TextStyle,
  socialRow: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: SPACING.sm,
    marginTop: 4,
  } as ViewStyle,
  ig: { fontFamily: FONTS.body, fontSize: 12, color: COLORS.sage },
  link: { fontFamily: FONTS.body, fontSize: 12, color: COLORS.creamMuted },
  cityBadge: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
  } as ViewStyle,
  cityText: {
    fontFamily: FONTS.mono,
    fontSize: 11,
    color: COLORS.sage,
  } as TextStyle,
  deleteBtn: {
    padding: SPACING.sm,
    alignItems: 'center',
    borderTopWidth: 1,
    borderTopColor: COLORS.border,
  } as ViewStyle,
  deleteText: {
    fontFamily: FONTS.mono,
    fontSize: 11,
    color: COLORS.coral,
  } as TextStyle,
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
});

const formStyles = StyleSheet.create({
  field: { marginBottom: SPACING.md },
  label: {
    fontFamily: FONTS.mono,
    fontSize: 11,
    color: COLORS.sage,
    letterSpacing: 1,
    marginBottom: 4,
  } as TextStyle,
  input: {
    fontFamily: FONTS.body,
    fontSize: 16,
    color: COLORS.cream,
    backgroundColor: COLORS.bgCard,
    borderRadius: RADIUS.md,
    borderWidth: 1,
    borderColor: COLORS.border,
    paddingHorizontal: SPACING.md,
    paddingVertical: SPACING.sm,
  } as TextStyle,
});

const modalStyles = StyleSheet.create({
  overlay: {
    flex: 1,
    backgroundColor: COLORS.overlay,
    justifyContent: 'flex-end',
  } as ViewStyle,
  sheet: {
    backgroundColor: COLORS.bg,
    borderTopLeftRadius: RADIUS.xl,
    borderTopRightRadius: RADIUS.xl,
    padding: SPACING.lg,
    maxHeight: '85%',
  } as ViewStyle,
  handle: {
    width: 40,
    height: 4,
    backgroundColor: COLORS.border,
    borderRadius: 2,
    alignSelf: 'center',
    marginBottom: SPACING.md,
  } as ViewStyle,
  title: {
    fontFamily: FONTS.header,
    fontSize: 24,
    color: COLORS.cream,
    marginBottom: SPACING.lg,
  } as TextStyle,
  actions: {
    flexDirection: 'row',
    gap: SPACING.md,
    marginTop: SPACING.lg,
  } as ViewStyle,
  cancelBtn: {
    flex: 1,
    padding: SPACING.md,
    alignItems: 'center',
    backgroundColor: COLORS.bgCard,
    borderRadius: RADIUS.md,
  } as ViewStyle,
  cancelText: { fontFamily: FONTS.body, fontSize: 16, color: COLORS.cream },
  saveBtn: {
    flex: 1,
    padding: SPACING.md,
    alignItems: 'center',
    backgroundColor: COLORS.sage,
    borderRadius: RADIUS.md,
  } as ViewStyle,
  saveBtnDisabled: { opacity: 0.5 },
  saveText: {
    fontFamily: FONTS.bodySemiBold,
    fontSize: 16,
    color: COLORS.bg,
  } as TextStyle,
});

export default withComingSoon(PeopleMetScreen, { routeName: 'people-met', title: 'People Met' });
