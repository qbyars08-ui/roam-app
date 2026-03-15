// =============================================================================
// ROAM — Trip Trading
// Browse other users' public trips, one-tap to claim
// =============================================================================
import React, { useCallback, useEffect, useState } from 'react';
import {
  View,
  Text,
  ScrollView,
  Pressable,
  StyleSheet,
  RefreshControl,
  Alert,
  ImageBackground,
  type ViewStyle,
  type TextStyle,
  type ImageStyle,
} from 'react-native';
import { useRouter } from 'expo-router';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import * as Haptics from '../lib/haptics';
import { LinearGradient } from 'expo-linear-gradient';
import { Repeat, ChevronRight } from 'lucide-react-native';
import { COLORS, FONTS, SPACING, RADIUS } from '../lib/constants';
import { SkeletonCard } from '../components/premium/LoadingStates';
import { useAppStore } from '../lib/store';
import {
  fetchTradableTrips,
  claimTrip,
  type TradableTrip,
} from '../lib/trip-trading';
import { getDestinationPhoto } from '../lib/photos';
import { withComingSoon } from '../lib/with-coming-soon';

function TripTradingScreen() {
  const router = useRouter();
  const insets = useSafeAreaInsets();
  const addTrip = useAppStore((s) => s.addTrip);

  const [trips, setTrips] = useState<TradableTrip[]>([]);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);

  const load = useCallback(async () => {
    const list = await fetchTradableTrips();
    setTrips(list);
  }, []);

  useEffect(() => {
    // eslint-disable-next-line react-hooks/set-state-in-effect -- async data load
    load().finally(() => {
      // eslint-disable-next-line react-hooks/set-state-in-effect -- async data load
      setLoading(false);
    });
  }, [load]);

  const onRefresh = useCallback(async () => {
    setRefreshing(true);
    await load();
    setRefreshing(false);
  }, [load]);

  const handleClaim = useCallback(
    async (t: TradableTrip) => {
      Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Medium);
      const trip = await claimTrip(t.id, t);
      if (trip) {
        addTrip(trip);
        Alert.alert('Claimed!', `Your ${t.destination} trip is in your trips.`);
        router.push('/(tabs)/plan');
      } else {
        Alert.alert('Oops', 'Couldn\'t claim this trip. Sign in and try again.');
      }
    },
    [addTrip, router]
  );

  return (
    <View style={[styles.container, { paddingTop: insets.top }]}>
      <View style={styles.header}>
        <Pressable onPress={() => router.back()} hitSlop={12}>
          <Text style={styles.back}>{'←'}</Text>
        </Pressable>
        <Text style={styles.title}>Trip Trading</Text>
        <Text style={styles.subtitle}>Browse trips others shared. One tap to claim.</Text>
      </View>

      {loading ? (
        <View style={styles.skeletonGrid}>
          {[1, 2, 3, 4].map((i) => (
            <SkeletonCard key={i} width="100%" height={160} borderRadius={RADIUS.lg} style={{ marginBottom: SPACING.md }} />
          ))}
        </View>
      ) : (
        <ScrollView
          contentContainerStyle={styles.scrollContent}
          showsVerticalScrollIndicator={false}
          scrollEventThrottle={16}
          refreshControl={
            <RefreshControl refreshing={refreshing} onRefresh={onRefresh} tintColor={COLORS.gold} />
          }
        >
          {trips.length === 0 ? (
            <View style={styles.empty}>
              <Repeat size={48} color={COLORS.creamMuted} />
              <Text style={styles.emptyTitle}>No trips for trading yet</Text>
              <Text style={styles.emptyText}>
                Share one of your trips and tick "List for trading" — or check back later.
              </Text>
            </View>
          ) : (
            trips.map((t) => {
              const photo = getDestinationPhoto(t.destination);
              return (
                <Pressable
                  key={t.id}
                  onPress={() => handleClaim(t)}
                  style={({ pressed }) => [styles.card, { opacity: pressed ? 0.9 : 1 }]}
                >
                  <ImageBackground
                    source={{ uri: photo }}
                    style={styles.cardBg}
                    imageStyle={styles.cardBgImage}
                  >
                    <LinearGradient
                      colors={['transparent', COLORS.overlayStrong]}
                      style={styles.cardGrad}
                    >
                      <View style={styles.cardContent}>
                        <Text style={styles.cardDestination}>{t.destination}</Text>
                        <Text style={styles.cardMeta}>
                          {t.days} days · {t.budget} · {t.claim_count ?? 0} claims
                        </Text>
                        <View style={styles.claimRow}>
                          <Text style={styles.claimBtn}>Claim this trip</Text>
                          <ChevronRight size={18} color={COLORS.gold} />
                        </View>
                      </View>
                    </LinearGradient>
                  </ImageBackground>
                </Pressable>
              );
            })
          )}
          <View style={{ height: insets.bottom + SPACING.xl }} />
        </ScrollView>
      )}
    </View>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: COLORS.bg } as ViewStyle,
  header: { paddingHorizontal: SPACING.lg, paddingBottom: SPACING.md } as ViewStyle,
  back: { fontSize: 24, color: COLORS.cream } as TextStyle,
  title: { fontFamily: FONTS.header, fontSize: 28, color: COLORS.cream, marginTop: SPACING.sm } as TextStyle,
  subtitle: { fontFamily: FONTS.body, fontSize: 14, color: COLORS.creamMuted, marginTop: 4 } as TextStyle,
  center: { flex: 1, justifyContent: 'center', alignItems: 'center' } as ViewStyle,
  skeletonGrid: { paddingHorizontal: SPACING.lg, gap: SPACING.md } as ViewStyle,
  scrollContent: { paddingHorizontal: SPACING.lg, paddingBottom: SPACING.xl } as ViewStyle,
  empty: { alignItems: 'center', paddingVertical: SPACING.xxxl } as ViewStyle,
  emptyTitle: { fontFamily: FONTS.headerMedium, fontSize: 18, color: COLORS.cream, marginTop: SPACING.md } as TextStyle,
  emptyText: { fontFamily: FONTS.body, fontSize: 14, color: COLORS.creamMuted, marginTop: SPACING.sm, textAlign: 'center', paddingHorizontal: SPACING.lg } as TextStyle,
  card: {
    borderRadius: RADIUS.lg,
    overflow: 'hidden',
    marginBottom: SPACING.md,
    borderWidth: 1,
    borderColor: COLORS.border,
  } as ViewStyle,
  cardBg: { height: 160 } as ViewStyle,
  cardBgImage: { borderRadius: RADIUS.lg } as ImageStyle,
  cardGrad: { flex: 1, justifyContent: 'flex-end', padding: SPACING.md } as ViewStyle,
  cardContent: {} as ViewStyle,
  cardDestination: { fontFamily: FONTS.headerMedium, fontSize: 22, color: COLORS.cream } as TextStyle,
  cardMeta: { fontFamily: FONTS.body, fontSize: 13, color: COLORS.creamMuted, marginTop: 4 } as TextStyle,
  claimRow: { flexDirection: 'row', alignItems: 'center', marginTop: SPACING.sm, gap: 4 } as ViewStyle,
  claimBtn: { fontFamily: FONTS.bodySemiBold, fontSize: 14, color: COLORS.gold } as TextStyle,
});

export default withComingSoon(TripTradingScreen, { routeName: 'trip-trading', title: 'Trip Trading' });
