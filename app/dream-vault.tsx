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
import {
  getSavedDestinations,
  addSavedDestination,
  removeSavedDestination,
  isPricesLow,
  getSkyscannerUrl,
  type SavedDestination,
} from '../lib/flight-deals';
import { validateDestination } from '../lib/params-validator';
import { getHomeAirport } from '../lib/flights';
import { useTranslation } from 'react-i18next';

function DreamVaultScreen() {
  const { t } = useTranslation();
  const insets = useSafeAreaInsets();
  const router = useRouter();
  const params = useLocalSearchParams<{ destination?: string }>();
  const [destinations, setDestinations] = useState<SavedDestination[]>([]);
  const [loading, setLoading] = useState(true);
  const [, setHomeAirportLocal] = useState('JFK');

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
    const dest = validateDestination(params.destination);
    if (!dest) return;
    // Resolve home airport first to avoid race with stale 'JFK' default
    getHomeAirport()
      .then((airport) => addSavedDestination(dest, airport))
      .then(load)
      .catch(() => {});
  }, [params.destination, load]);

  const handleSearchFlights = async (dest: SavedDestination) => {
    Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Medium);
    const url = getSkyscannerUrl(dest.destination);
    await Linking.openURL(url).catch(() =>
      Alert.alert(t('common.error', { defaultValue: 'Error' }), t('dreamVault.skyscannerError', { defaultValue: 'Could not open Skyscanner' }))
    );
  };

  const handleRemove = (dest: SavedDestination) => {
    Alert.alert(t('dreamVault.removeTitle', { defaultValue: 'Remove from vault?' }), t('dreamVault.removeMessage', { defaultValue: 'Stop tracking {{destination}}?', destination: dest.destination }), [
      { text: t('common.cancel', { defaultValue: 'Cancel' }), style: 'cancel' },
      {
        text: t('common.remove', { defaultValue: 'Remove' }),
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
        <Text style={styles.title}>{t('dreamVault.title', { defaultValue: 'Dream Trip Vault' })}</Text>
        <Text style={styles.subtitle}>
          {loading ? t('common.loading') : t('dreamVault.subtitle', { defaultValue: "{{count}} saved — we'll alert when prices drop", count: destinations.length })}
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
                      <Text style={styles.badgeText}>{t('dreamVault.pricesLow', { defaultValue: 'Prices low' })}</Text>
                    </View>
                  )}
                  <Text style={styles.destName}>{d.destination}</Text>
                  {d.baselinePrice != null && (
                    <Text style={styles.price}>From ${d.baselinePrice}</Text>
                  )}
                  <Text style={styles.cta}>{t('dreamVault.tapToSearch', { defaultValue: 'Tap to search flights' })} →</Text>
                </View>
              </LinearGradient>
            </Pressable>
          );
        })}
      </ScrollView>

      {!loading && destinations.length === 0 && (
        <View style={styles.empty}>
          <Text style={styles.emptyText}>{t('dreamVault.emptyTitle', { defaultValue: 'No dream destinations yet' })}</Text>
          <Text style={styles.emptySub}>
            {t('dreamVault.emptySubtitle', { defaultValue: 'Save destinations from itineraries to track flight prices' })}
          </Text>
          <Pressable
            style={styles.addBtn}
            onPress={() => router.push('/(tabs)/generate' as never)}
          >
            <Text style={styles.addBtnText}>{t('dreamVault.planTrip', { defaultValue: 'Plan a trip' })}</Text>
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
    marginTop: SPACING.xs,
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
  cardContent: { gap: SPACING.xs },
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
    paddingHorizontal: SPACING.sm,
    paddingVertical: SPACING.xs,
    borderRadius: RADIUS.sm,
    marginBottom: SPACING.xs,
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
    marginTop: SPACING.xs,
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
    marginTop: SPACING.sm,
    textAlign: 'center',
  } as TextStyle,
  addBtn: {
    marginTop: SPACING.lg,
    paddingHorizontal: SPACING.lg,
    paddingVertical: SPACING.md,
    backgroundColor: COLORS.sageLight,
    borderRadius: RADIUS.pill,
  } as ViewStyle,
  addBtnText: {
    fontFamily: FONTS.bodySemiBold,
    fontSize: 14,
    color: COLORS.sage,
  } as TextStyle,
});

export default DreamVaultScreen;
