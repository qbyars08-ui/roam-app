// =============================================================================
// ROAM — Trip Collections
// Curated lists — tappable destinations open plan wizard
// =============================================================================
import React, { useCallback } from 'react';
import {
  View,
  Text,
  ScrollView,
  Pressable,
  StyleSheet,
  type TextStyle,
  type ViewStyle,
} from 'react-native';
import { useRouter } from 'expo-router';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import * as Haptics from '../lib/haptics';
import { ChevronRight, ChevronLeft } from 'lucide-react-native';
import { COLORS, FONTS, SPACING, RADIUS } from '../lib/constants';
import { useAppStore } from '../lib/store';
import { TRIP_COLLECTIONS, type TripCollection } from '../lib/trip-collections';
import { withComingSoon } from '../lib/with-coming-soon';

function CollectionCard({
  collection,
  onDestPress,
}: {
  collection: TripCollection;
  onDestPress: (dest: string) => void;
}) {
  return (
    <View style={styles.collectionCard}>
      <Text style={styles.collectionTitle}>{collection.title}</Text>
      <Text style={styles.collectionSubtitle}>{collection.subtitle}</Text>
      <View style={styles.destGrid}>
        {collection.destinations.map((dest) => (
          <Pressable
            key={dest}
            style={({ pressed }) => [styles.destPill, { opacity: pressed ? 0.8 : 1 }]}
            onPress={() => onDestPress(dest)}
          >
            <Text style={styles.destPillText}>{dest}</Text>
            <ChevronRight size={14} color={COLORS.creamMuted} />
          </Pressable>
        ))}
      </View>
    </View>
  );
}

function TripCollectionsScreen() {
  const router = useRouter();
  const insets = useSafeAreaInsets();
  const setPlanWizard = useAppStore((s) => s.setPlanWizard);

  const handleDestPress = useCallback(
    (dest: string) => {
      Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
      setPlanWizard({ destination: dest });
      router.push('/(tabs)/plan');
    },
    [setPlanWizard, router]
  );

  return (
    <View style={[styles.screen, { paddingTop: insets.top }]}>
      <View style={styles.header}>
        <Pressable onPress={() => router.back()} hitSlop={12}>
          <ChevronLeft size={24} color={COLORS.cream} strokeWidth={2} />
        </Pressable>
        <Text style={styles.title}>Trip Collections</Text>
        <Text style={styles.subtitle}>
          Curated lists by vibe. Tap a destination to plan your own version.
        </Text>
      </View>
      <ScrollView
        style={styles.scroll}
        contentContainerStyle={[styles.scrollContent, { paddingBottom: insets.bottom + SPACING.xxl }]}
        showsVerticalScrollIndicator={false}
      >
        {TRIP_COLLECTIONS.map((col) => (
          <CollectionCard
            key={col.id}
            collection={col}
            onDestPress={handleDestPress}
          />
        ))}
      </ScrollView>
    </View>
  );
}

const styles = StyleSheet.create({
  screen: { flex: 1, backgroundColor: COLORS.bg } as ViewStyle,
  header: {
    paddingHorizontal: SPACING.lg,
    marginBottom: SPACING.lg,
  } as ViewStyle,
  title: {
    fontFamily: FONTS.header,
    fontSize: 28,
    color: COLORS.cream,
    marginBottom: SPACING.xs,
  } as TextStyle,
  subtitle: {
    fontFamily: FONTS.body,
    fontSize: 14,
    color: COLORS.creamMuted,
    lineHeight: 20,
  } as TextStyle,
  scroll: { flex: 1 } as ViewStyle,
  scrollContent: {
    paddingHorizontal: SPACING.lg,
  } as ViewStyle,
  collectionCard: {
    backgroundColor: COLORS.bgCard,
    borderRadius: RADIUS.lg,
    borderWidth: 1,
    borderColor: COLORS.border,
    padding: SPACING.lg,
    marginBottom: SPACING.md,
  } as ViewStyle,
  collectionTitle: {
    fontFamily: FONTS.bodySemiBold,
    fontSize: 18,
    color: COLORS.cream,
  } as TextStyle,
  collectionSubtitle: {
    fontFamily: FONTS.body,
    fontSize: 13,
    color: COLORS.creamMuted,
    marginTop: 4,
  } as TextStyle,
  destGrid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: SPACING.sm,
    marginTop: SPACING.md,
  } as ViewStyle,
  destPill: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
    backgroundColor: COLORS.bgElevated,
    borderRadius: RADIUS.full,
    paddingHorizontal: SPACING.md,
    paddingVertical: SPACING.sm,
    borderWidth: 1,
    borderColor: COLORS.border,
  } as ViewStyle,
  destPillText: {
    fontFamily: FONTS.bodyMedium,
    fontSize: 14,
    color: COLORS.cream,
  } as TextStyle,
});

export default withComingSoon(TripCollectionsScreen, { routeName: 'trip-collections', title: 'Trip Collections' });
