// =============================================================================
// ROAM — Profile Screen
// User info, subscription status, sign out
// =============================================================================
import React, { useCallback, useEffect, useState } from 'react';
import {
  View,
  Text,
  ScrollView,
  Pressable,
  Alert,
  Modal,
  TextInput,
  StyleSheet,
  type ViewStyle,
  type TextStyle,
} from 'react-native';
import { useRouter } from 'expo-router';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import * as Haptics from 'expo-haptics';
import Constants from 'expo-constants';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { supabase } from '../../lib/supabase';
import { COLORS, FONTS, SPACING, RADIUS, FREE_TRIPS_PER_MONTH } from '../../lib/constants';
import { hasRatedBadge } from '../../lib/rating';
import { useAppStore } from '../../lib/store';
import { getCurrentStreak } from '../../lib/streaks';
import { logoutRevenueCat } from '../../lib/revenue-cat';
import { Sparkles, Repeat, Gift, Shield, ChevronRight, BarChart3, CreditCard, LogOut } from 'lucide-react-native';
import Button from '../../components/ui/Button';
import ExploreHub from '../../components/features/ExploreHub';

const EMERGENCY_CONTACT_KEY = '@roam/emergency_contact';

export default function ProfileScreen() {
  const router = useRouter();
  const insets = useSafeAreaInsets();

  const session = useAppStore((s) => s.session);
  const isPro = useAppStore((s) => s.isPro);
  const tripsThisMonth = useAppStore((s) => s.tripsThisMonth);
  const trips = useAppStore((s) => s.trips);

  const userEmail = session?.user?.email ?? 'Guest';

  // ---------------------------------------------------------------------------
  // Emergency contact + rating badge
  // ---------------------------------------------------------------------------
  const [emergencyContact, setEmergencyContact] = useState('');
  const [ratedBadge, setRatedBadge] = useState(false);
  const [emergencyModalVisible, setEmergencyModalVisible] = useState(false);
  const [emergencyInputValue, setEmergencyInputValue] = useState('');

  useEffect(() => {
    AsyncStorage.getItem(EMERGENCY_CONTACT_KEY).then((val) => {
      if (val) setEmergencyContact(val);
    });
    hasRatedBadge().then(setRatedBadge);
  }, []);

  const handleEditEmergencyContact = useCallback(() => {
    setEmergencyInputValue(emergencyContact);
    setEmergencyModalVisible(true);
  }, [emergencyContact]);

  const handleSaveEmergencyContact = useCallback(async () => {
    const cleaned = emergencyInputValue.trim();
    if (cleaned) {
      await AsyncStorage.setItem(EMERGENCY_CONTACT_KEY, cleaned);
      setEmergencyContact(cleaned);
    }
    setEmergencyModalVisible(false);
  }, [emergencyInputValue]);

  const handleCancelEmergencyModal = useCallback(() => {
    setEmergencyModalVisible(false);
  }, []);

  // ---------------------------------------------------------------------------
  // Sign out
  // ---------------------------------------------------------------------------
  const setSession = useAppStore((s) => s.setSession);
  const setIsPro = useAppStore((s) => s.setIsPro);

  const handleSignOut = () => {
    Alert.alert('Heading out?', 'You can always come back.', [
      { text: 'Cancel', style: 'cancel' },
      {
        text: 'Log out',
        style: 'destructive',
        onPress: async () => {
          await logoutRevenueCat();
          setIsPro(false);
          setSession(null);
          await supabase.auth.signOut();
        },
      },
    ]);
  };

  // ---------------------------------------------------------------------------
  // Render
  // ---------------------------------------------------------------------------
  return (
    <View style={[styles.container, { paddingTop: insets.top }]}>
      <ScrollView
        contentContainerStyle={styles.scrollContent}
        showsVerticalScrollIndicator={false}
      >
        {/* Header */}
        <Text style={styles.headerTitle}>Your profile</Text>

        {/* User card */}
        <View style={styles.card}>
          <View style={styles.avatarCircle}>
            <Text style={styles.avatarText}>
              {userEmail.charAt(0).toUpperCase()}
            </Text>
          </View>
          <Text style={styles.email}>{userEmail}</Text>
          <View style={styles.badgeRow}>
            <View style={[styles.badge, isPro ? styles.badgePro : styles.badgeFree]}>
              <Text style={[styles.badgeText, isPro ? styles.badgeTextPro : styles.badgeTextFree]}>
                {isPro ? 'PRO' : 'FREE'}
              </Text>
            </View>
            {ratedBadge && (
              <Text style={styles.ratedBadge}>Thanks for rating</Text>
            )}
          </View>
        </View>

        {/* Stats */}
        <View style={styles.statsRow}>
          <View style={styles.statCard}>
            <Text style={styles.statValue}>{trips.length}</Text>
            <Text style={styles.statLabel}>TRIPS BUILT</Text>
          </View>
          <View style={styles.statCard}>
            <Text style={styles.statValue}>
              {tripsThisMonth}/{isPro ? '\u221E' : FREE_TRIPS_PER_MONTH}
            </Text>
            <Text style={styles.statLabel}>THIS MONTH</Text>
          </View>
        </View>

        {/* Upgrade CTA */}
        {!isPro && (
          <View style={styles.upgradeCard}>
            <Text style={styles.upgradeTitle}>Plan unlimited trips</Text>
            <Text style={styles.upgradeSubtitle}>
              Never hold back. Plan as many adventures as you want, whenever inspiration strikes.
            </Text>
            <Button
              label="See Pro plans"
              variant="coral"
              onPress={() => router.push('/paywall')}
            />
          </View>
        )}

        {/* Trip Wrapped — prominent hero feature */}
        <Pressable
          style={({ pressed }) => [
            styles.tripWrappedCard,
            { opacity: pressed ? 0.9 : 1 },
          ]}
          onPress={() => {
            Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Medium);
            router.push('/trip-wrapped');
          }}
        >
          <View style={styles.tripWrappedContent}>
            <View style={styles.tripWrappedIconWrap}>
              <BarChart3 size={24} color={COLORS.accentGold} strokeWidth={2} />
            </View>
            <View style={{ flex: 1 }}>
              <Text style={styles.tripWrappedTitle}>Trip Wrapped</Text>
              <Text style={styles.tripWrappedSub}>Your year in travel</Text>
            </View>
            <ChevronRight size={22} color={COLORS.accentGold} strokeWidth={2} />
          </View>
        </Pressable>

        {/* Fun features */}
        <View style={[styles.menuSection, { marginTop: SPACING.lg }]}>
          <Pressable
            style={({ pressed }) => [styles.menuItem, { opacity: pressed ? 0.7 : 1 }]}
            onPress={() => {
              Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
              router.push('/alter-ego');
            }}
          >
            <View style={styles.menuIconWrap}><Sparkles size={18} color={COLORS.accentGold} strokeWidth={2} /></View>
            <Text style={[styles.menuLabel, { flex: 1 }]}>Travel Alter-Ego Quiz</Text>
            <ChevronRight size={18} color={COLORS.creamMuted} strokeWidth={2} />
          </Pressable>

          <View style={styles.menuDivider} />

          <Pressable
            style={({ pressed }) => [styles.menuItem, { opacity: pressed ? 0.7 : 1 }]}
            onPress={() => router.push('/trip-dupe')}
          >
            <View style={styles.menuIconWrap}><Repeat size={18} color={COLORS.accentGold} strokeWidth={2} /></View>
            <Text style={[styles.menuLabel, { flex: 1 }]}>Trip Dupe Mode</Text>
            <ChevronRight size={18} color={COLORS.creamMuted} strokeWidth={2} />
          </Pressable>

          <View style={styles.menuDivider} />

          <Pressable
            style={({ pressed }) => [styles.menuItem, { opacity: pressed ? 0.7 : 1 }]}
            onPress={() => {
              Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
              router.push('/referral');
            }}
          >
            <View style={styles.menuIconWrap}><Gift size={18} color={COLORS.accentGold} strokeWidth={2} /></View>
            <Text style={[styles.menuLabel, { flex: 1 }]}>Refer Friends</Text>
            <ChevronRight size={18} color={COLORS.creamMuted} strokeWidth={2} />
          </Pressable>
        </View>

        {/* ── Explore Features grid ── */}
        <View style={{ marginTop: SPACING.lg }}>
          <Text style={styles.sectionTitle}>Explore Features</Text>
          <ExploreHub />
        </View>

        {/* Menu items */}
        <View style={styles.menuSection}>
          <Pressable
            style={({ pressed }) => [styles.menuItem, { opacity: pressed ? 0.7 : 1 }]}
            onPress={() => {
              Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
              router.push('/paywall');
            }}
          >
            <View style={styles.menuIconWrap}><CreditCard size={18} color={COLORS.accentGold} strokeWidth={2} /></View>
            <Text style={[styles.menuLabel, { flex: 1 }]}>Your plan</Text>
            <ChevronRight size={18} color={COLORS.creamMuted} strokeWidth={2} />
          </Pressable>

          <View style={styles.menuDivider} />

          <Pressable
            style={({ pressed }) => [styles.menuItem, { opacity: pressed ? 0.7 : 1 }]}
            onPress={() => {
              Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
              handleEditEmergencyContact();
            }}
          >
            <View style={styles.menuIconWrap}><Shield size={18} color={COLORS.accentGold} strokeWidth={2} /></View>
            <View style={{ flex: 1 }}>
              <Text style={styles.menuLabel}>Emergency Contact</Text>
              {emergencyContact ? (
                <Text style={styles.menuSubtext}>{emergencyContact}</Text>
              ) : null}
            </View>
            <ChevronRight size={18} color={COLORS.creamMuted} strokeWidth={2} />
          </Pressable>

          <View style={styles.menuDivider} />

          <Pressable
            style={({ pressed }) => [styles.menuItem, { opacity: pressed ? 0.7 : 1 }]}
            onPress={() => {
              Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
              handleSignOut();
            }}
          >
            <View style={styles.menuIconWrap}><LogOut size={18} color={COLORS.coral} strokeWidth={2} /></View>
            <Text style={[styles.menuLabel, { flex: 1, color: COLORS.coral }]}>Log out</Text>
            <ChevronRight size={18} color={COLORS.coral} strokeWidth={2} />
          </Pressable>
        </View>

        {/* App version */}
        <Text style={styles.version}>ROAM v{Constants.expoConfig?.version ?? '1.0.0'}</Text>

        {/* Dev: Reset first-time experience */}
        {__DEV__ && (
          <Pressable
            style={({ pressed }) => [styles.devReset, { opacity: pressed ? 0.7 : 1 }]}
            onPress={async () => {
              await AsyncStorage.removeItem('@roam/onboarding_complete');
              await logoutRevenueCat();
              setIsPro(false);
              setSession(null);
              await supabase.auth.signOut();
            }}
          >
            <Text style={styles.devResetText}>Dev: Reset first-time</Text>
          </Pressable>
        )}
      </ScrollView>

      {/* Emergency Contact Modal (cross-platform; Alert.prompt crashes on iOS) */}
      <Modal
        visible={emergencyModalVisible}
        transparent
        animationType="fade"
        onRequestClose={handleCancelEmergencyModal}
      >
        <Pressable style={styles.modalBackdrop} onPress={handleCancelEmergencyModal}>
          <Pressable style={styles.emergencyModalContent} onPress={(e) => e.stopPropagation()}>
            <Text style={styles.emergencyModalTitle}>Emergency contact</Text>
            <Text style={styles.emergencyModalSub}>Enter a phone number for SOS alerts.</Text>
            <TextInput
              style={styles.emergencyModalInput}
              value={emergencyInputValue}
              onChangeText={setEmergencyInputValue}
              placeholder="+1 555 123 4567"
              placeholderTextColor={COLORS.creamMuted}
              keyboardType="phone-pad"
              autoFocus
            />
            <View style={styles.emergencyModalButtons}>
              <Pressable style={styles.emergencyModalCancel} onPress={handleCancelEmergencyModal}>
                <Text style={styles.emergencyModalCancelText}>Cancel</Text>
              </Pressable>
              <Pressable style={styles.emergencyModalSave} onPress={handleSaveEmergencyContact}>
                <Text style={styles.emergencyModalSaveText}>Save</Text>
              </Pressable>
            </View>
          </Pressable>
        </Pressable>
      </Modal>
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
  scrollContent: {
    paddingHorizontal: SPACING.lg,
    paddingBottom: SPACING.xxxl,
  } as ViewStyle,
  headerTitle: {
    fontFamily: FONTS.header,
    fontSize: 28,
    color: COLORS.cream,
    paddingTop: SPACING.lg,
    paddingBottom: SPACING.xl,
  } as TextStyle,
  tripWrappedCard: {
    marginTop: SPACING.lg,
    backgroundColor: COLORS.bgGlass,
    borderRadius: RADIUS.lg,
    borderWidth: 1,
    borderColor: COLORS.border,
    overflow: 'hidden',
  } as ViewStyle,
  tripWrappedContent: {
    flexDirection: 'row',
    alignItems: 'center',
    padding: SPACING.lg,
    gap: SPACING.md,
  } as ViewStyle,
  tripWrappedIconWrap: {},
  tripWrappedTitle: {
    fontFamily: FONTS.header,
    fontSize: 20,
    color: COLORS.cream,
  } as TextStyle,
  tripWrappedSub: {
    fontFamily: FONTS.body,
    fontSize: 13,
    color: COLORS.creamMuted,
    marginTop: 2,
  } as TextStyle,

  // User card
  card: {
    backgroundColor: COLORS.bgGlass,
    borderRadius: RADIUS.lg,
    borderWidth: 1,
    borderColor: COLORS.border,
    padding: SPACING.xl,
    alignItems: 'center',
    gap: SPACING.md,
  } as ViewStyle,
  avatarCircle: {
    width: 64,
    height: 64,
    borderRadius: 32,
    backgroundColor: COLORS.sageLight,
    alignItems: 'center',
    justifyContent: 'center',
  } as ViewStyle,
  avatarText: {
    fontFamily: FONTS.header,
    fontSize: 28,
    color: COLORS.sage,
  } as TextStyle,
  email: {
    fontFamily: FONTS.bodyMedium,
    fontSize: 16,
    color: COLORS.cream,
  } as TextStyle,
  badgeRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: SPACING.sm,
    flexWrap: 'wrap',
  } as ViewStyle,
  badge: {
    paddingHorizontal: SPACING.md,
    paddingVertical: SPACING.xs,
    borderRadius: RADIUS.full,
  } as ViewStyle,
  ratedBadge: {
    fontFamily: FONTS.mono,
    fontSize: 11,
    color: COLORS.gold,
  } as TextStyle,
  badgePro: {
    backgroundColor: COLORS.gold,
  } as ViewStyle,
  badgeFree: {
    backgroundColor: COLORS.bgCard,
    borderWidth: 1,
    borderColor: COLORS.border,
  } as ViewStyle,
  badgeText: {
    fontFamily: FONTS.monoMedium,
    fontSize: 11,
    letterSpacing: 1.5,
  } as TextStyle,
  badgeTextPro: {
    color: COLORS.bg,
  } as TextStyle,
  badgeTextFree: {
    color: COLORS.cream,
    opacity: 0.6,
  } as TextStyle,
  // Stats
  statsRow: {
    flexDirection: 'row',
    gap: SPACING.md,
    marginTop: SPACING.lg,
  } as ViewStyle,
  statCard: {
    flex: 1,
    backgroundColor: COLORS.bgGlass,
    borderRadius: RADIUS.lg,
    borderWidth: 1,
    borderColor: COLORS.border,
    padding: SPACING.lg,
    alignItems: 'center',
    gap: SPACING.xs,
  } as ViewStyle,
  streakCard: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: SPACING.md,
    marginTop: SPACING.md,
    backgroundColor: COLORS.gold + '15',
    borderRadius: RADIUS.lg,
    borderWidth: 1,
    borderColor: COLORS.gold + '40',
    padding: SPACING.md,
  } as ViewStyle,
  streakEmoji: {
    fontSize: 28,
  } as TextStyle,
  streakValue: {
    fontFamily: FONTS.bodySemiBold,
    fontSize: 16,
    color: COLORS.cream,
  } as TextStyle,
  streakLabel: {
    fontFamily: FONTS.body,
    fontSize: 12,
    color: COLORS.creamMuted,
    marginTop: 2,
  } as TextStyle,
  statValue: {
    fontFamily: FONTS.header,
    fontSize: 32,
    color: COLORS.cream,
  } as TextStyle,
  statLabel: {
    fontFamily: FONTS.mono,
    fontSize: 10,
    color: COLORS.sage,
    letterSpacing: 1,
  } as TextStyle,
  // Upgrade card
  upgradeCard: {
    backgroundColor: COLORS.coralLight,
    borderRadius: RADIUS.lg,
    borderWidth: 1,
    borderColor: `${COLORS.coral}33`,
    padding: SPACING.xl,
    gap: SPACING.md,
    marginTop: SPACING.lg,
  } as ViewStyle,
  upgradeTitle: {
    fontFamily: FONTS.header,
    fontSize: 22,
    color: COLORS.cream,
  } as TextStyle,
  upgradeSubtitle: {
    fontFamily: FONTS.body,
    fontSize: 14,
    color: COLORS.cream,
    opacity: 0.7,
    lineHeight: 20,
  } as TextStyle,
  // Section title
  sectionTitle: {
    fontFamily: FONTS.header,
    fontSize: 22,
    color: COLORS.cream,
    marginBottom: SPACING.md,
  } as TextStyle,
  // Menu
  menuSection: {
    backgroundColor: COLORS.bgGlass,
    borderRadius: RADIUS.lg,
    borderWidth: 1,
    borderColor: COLORS.border,
    marginTop: SPACING.lg,
    overflow: 'hidden',
  } as ViewStyle,
  menuItem: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingHorizontal: SPACING.lg,
    paddingVertical: SPACING.md + 2,
    gap: SPACING.sm,
  } as ViewStyle,
  menuIconWrap: {
    width: 24,
    alignItems: 'center',
  } as ViewStyle,
  menuLabel: {
    fontFamily: FONTS.bodyMedium,
    fontSize: 15,
    color: COLORS.cream,
  } as TextStyle,
  menuArrow: {
    fontFamily: FONTS.body,
    fontSize: 20,
    color: COLORS.cream,
    opacity: 0.4,
  } as TextStyle,
  menuSubtext: {
    fontFamily: FONTS.mono,
    fontSize: 12,
    color: COLORS.sage,
    marginTop: 2,
  } as TextStyle,
  menuDivider: {
    height: 1,
    backgroundColor: COLORS.border,
    marginHorizontal: SPACING.lg,
  } as ViewStyle,
  // Emergency contact modal
  modalBackdrop: {
    flex: 1,
    backgroundColor: COLORS.overlay,
    justifyContent: 'center',
    alignItems: 'center',
    padding: SPACING.lg,
  } as ViewStyle,
  emergencyModalContent: {
    width: '100%',
    maxWidth: 340,
    backgroundColor: COLORS.bgCard,
    borderRadius: RADIUS.lg,
    borderWidth: 1,
    borderColor: COLORS.border,
    padding: SPACING.xl,
  } as ViewStyle,
  emergencyModalTitle: {
    fontFamily: FONTS.header,
    fontSize: 20,
    color: COLORS.cream,
    marginBottom: SPACING.xs,
  } as TextStyle,
  emergencyModalSub: {
    fontFamily: FONTS.body,
    fontSize: 14,
    color: COLORS.creamMuted,
    marginBottom: SPACING.lg,
  } as TextStyle,
  emergencyModalInput: {
    fontFamily: FONTS.body,
    fontSize: 16,
    color: COLORS.cream,
    backgroundColor: COLORS.bg,
    borderRadius: RADIUS.md,
    borderWidth: 1,
    borderColor: COLORS.border,
    padding: SPACING.md,
    marginBottom: SPACING.lg,
  } as TextStyle,
  emergencyModalButtons: {
    flexDirection: 'row',
    gap: SPACING.md,
    justifyContent: 'flex-end',
  } as ViewStyle,
  emergencyModalCancel: {
    paddingVertical: SPACING.sm,
    paddingHorizontal: SPACING.lg,
  } as ViewStyle,
  emergencyModalCancelText: {
    fontFamily: FONTS.body,
    fontSize: 15,
    color: COLORS.creamMuted,
  } as TextStyle,
  emergencyModalSave: {
    paddingVertical: SPACING.sm,
    paddingHorizontal: SPACING.lg,
    backgroundColor: COLORS.sage,
    borderRadius: RADIUS.md,
  } as ViewStyle,
  emergencyModalSaveText: {
    fontFamily: FONTS.bodyMedium,
    fontSize: 15,
    color: COLORS.bg,
  } as TextStyle,
  // Version
  version: {
    fontFamily: FONTS.mono,
    fontSize: 11,
    color: COLORS.cream,
    opacity: 0.25,
    textAlign: 'center',
  } as TextStyle,
  devReset: {
    marginTop: SPACING.lg,
    padding: SPACING.md,
    alignSelf: 'center',
  } as ViewStyle,
  devResetText: {
    fontFamily: FONTS.mono,
    fontSize: 12,
    color: COLORS.sage,
    letterSpacing: 0.5,
  } as TextStyle,
});
