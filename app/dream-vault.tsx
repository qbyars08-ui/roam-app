// =============================================================================
// ROAM — Dream Trip Vault
// Saved destinations with price monitoring + Skyscanner affiliate
// =============================================================================
import React, { useCallback, useEffect, useState } from 'react';
import {
  View,
  Text,
  Pressable,
  ScrollView,
  ImageBackground,
  StyleSheet,
  Linking,
  Alert,
  type ViewStyle,
  type TextStyle,
} from 'react-native';
import { useRouter, useLocalSearchParams } from 'expo-router';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import * as Haptics from '../lib/haptics';
import { LinearGradient } from 'expo-linear-gradient';
import { COLORS, FONTS, SPACING, RADIUS } from '../lib/constants';
import { SkeletonGrid } from '../components/ui/Skeleton';
import { getDestinationPhoto } from '../lib/photos';
import {
  getSavedDestinations,
  addSavedDestination,
  removeSavedDestination,
  isPricesLow,
  getSkyscannerUrl,
  getDreamVaultExtra,
  type SavedDestination,
} from '../lib/flight-deals';
import { useAppStore } from '../lib/store';
import { withComingSoon } from '../lib/with-coming-soon';
import { getHomeAirport } from '../lib/flights-amadeus';

function DreamVaultScreen() {
  const insets = useSafeAreaInsets();
  const router = useRouter();
  const params = useLocalSearchParams<{ destination?: string }>();
  const passport = useAppStore((s) => s.travelProfile?.passportNationality ?? 'US');
  const [destinations, setDestinations] = useState<SavedDestination[]>([]);
  const [loading, setLoading] = useState(true);
  const [homeAirport, setHomeAirportLocal] = useState('JFK');

  const load = useCallback(async () => {
    setLoading(true);
    try {
      const list = await getSavedDestinations();
      setDestinations(list);
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    load();
    getHomeAirport().then(setHomeAirportLocal).catch(() => {});
  }, [load]);

  useEffect(() => {
    if (!params.destination) return;
    // Resolve home airport first to avoid race with stale 'JFK' default
    getHomeAirport()
      .then((airport) => addSavedDestination(params.destination!, airport))
      .then(load)
      .catch(() => {});
  }, [params.destination]);

  const handleSearchFlights = async (dest: SavedDestination) => {
    Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Medium);
    const url = getSkyscannerUrl(dest.destination);
    await Linking.openURL(url).catch(() =>
      Alert.alert('Error', 'Could not open Skyscanner')
    );
  };

  const handleRemove = (dest: SavedDestination) => {
    Alert.alert('Remove from vault?', `Stop tracking ${dest.destination}?`, [
      { text: 'Cancel', style: 'cancel' },
      {
        text: 'Remove',
        style: 'destructive',
        onPress: () => removeSavedDestination(dest.id).then(load),
      },
    ]);
  };

  return (
    <View style={[styles.container, { paddingTop: insets.top }]}>
      <View style={styles.header}>
        <Pressable onPress={() => router.back()} hitSlop={12}>
          <Text style={styles.back}>{'←'}</Text>
        </Pressable>
        <Text style={styles.title}>Dream Trip Vault</Text>
        <Text style={styles.subtitle}>
          {loading ? 'Loading...' : `${destinations.length} saved — we'll alert when prices drop`}
        </Text>
      </View>

      <ScrollView
        contentContainerStyle={styles.grid}
        showsVerticalScrollIndicator={false}
      >
        {loading ? (
          <View style={styles.skeletonWrap}>
            <SkeletonGrid />
          </View>
        ) : destinations.map((d) => {
          const low = isPricesLow(d);
          const photoUrl = getDestinationPhoto(d.destination);
          return (
            <Pressable
              key={d.id}
              style={({ pressed }) => [
                styles.card,
                { opacity: pressed ? 0.9 : 1 },
              ]}
              onPress={() => handleSearchFlights(d)}
              onLongPress={() => handleRemove(d)}
            >
              <LinearGradient
                colors={['transparent', COLORS.overlayDeeper]}
                style={styles.cardGrad}
              >
                <View style={styles.cardContent}>
                  {low && (
                    <View style={styles.badge}>
                      <Text style={styles.badgeText}>Prices low</Text>
                    </View>
                  )}
                  <Text style={styles.destName}>{d.destination}</Text>
                  {d.baselinePrice != null && (
                    <Text style={styles.price}>From ${d.baselinePrice}</Text>
                  )}
                  <Text style={styles.cta}>Tap to search flights →</Text>
                </View>
              </LinearGradient>
            </Pressable>
          );
        })}
      </ScrollView>

      {!loading && destinations.length === 0 && (
        <View style={styles.empty}>
          <Text style={styles.emptyText}>No dream destinations yet</Text>
          <Text style={styles.emptySub}>
            Save destinations from itineraries to track flight prices
          </Text>
          <Pressable
            style={styles.addBtn}
            onPress={() => router.push('/(tabs)/generate')}
          >
            <Text style={styles.addBtnText}>Plan a trip</Text>
          </Pressable>
        </View>
      )}
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
  skeletonWrap: {
    paddingHorizontal: SPACING.lg,
  } as ViewStyle,
  grid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    padding: SPACING.md,
    gap: SPACING.md,
  } as ViewStyle,
  cardBg: { flex: 1 },
  cardBgImg: { borderRadius: RADIUS.lg },
  card: {
    width: '47%',
    aspectRatio: 1,
    borderRadius: RADIUS.lg,
    overflow: 'hidden',
    backgroundColor: COLORS.bgCard,
  } as ViewStyle,
  cardGrad: {
    flex: 1,
    justifyContent: 'flex-end',
    padding: SPACING.md,
  } as ViewStyle,
  cardContent: { gap: 2 },
  extraLine: {
    fontFamily: FONTS.body,
    fontSize: 11,
    color: COLORS.creamMuted,
  } as TextStyle,
  visaLine: {
    fontFamily: FONTS.mono,
    fontSize: 10,
    color: COLORS.sage,
    marginTop: 2,
  } as TextStyle,
  badge: {
    alignSelf: 'flex-start',
    backgroundColor: COLORS.sage,
    paddingHorizontal: 8,
    paddingVertical: 4,
    borderRadius: RADIUS.sm,
    marginBottom: 4,
  } as ViewStyle,
  badgeText: {
    fontFamily: FONTS.mono,
    fontSize: 10,
    color: COLORS.bg,
  } as TextStyle,
  destName: {
    fontFamily: FONTS.bodySemiBold,
    fontSize: 16,
    color: COLORS.cream,
  } as TextStyle,
  price: {
    fontFamily: FONTS.mono,
    fontSize: 12,
    color: COLORS.sage,
  } as TextStyle,
  cta: {
    fontFamily: FONTS.body,
    fontSize: 11,
    color: COLORS.creamMuted,
    marginTop: 4,
  } as TextStyle,
  empty: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
    padding: SPACING.xl,
  } as ViewStyle,
  emptyText: {
    fontFamily: FONTS.header,
    fontSize: 20,
    color: COLORS.cream,
  } as TextStyle,
  emptySub: {
    fontFamily: FONTS.body,
    fontSize: 14,
    color: COLORS.creamMuted,
    marginTop: 8,
    textAlign: 'center',
  } as TextStyle,
  addBtn: {
    marginTop: SPACING.lg,
    paddingHorizontal: SPACING.lg,
    paddingVertical: SPACING.md,
    backgroundColor: COLORS.sageLight,
    borderRadius: RADIUS.md,
  } as ViewStyle,
  addBtnText: {
    fontFamily: FONTS.bodySemiBold,
    fontSize: 14,
    color: COLORS.sage,
  } as TextStyle,
});

export default withComingSoon(DreamVaultScreen, { routeName: 'dream-vault', title: 'Dream Vault' });
