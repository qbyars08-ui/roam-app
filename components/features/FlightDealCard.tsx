// =============================================================================
// ROAM — Flight Deal Card
// Save destinations to watch, search on Skyscanner for deals
// =============================================================================
import React, { useState } from 'react';
import { Linking, Pressable, StyleSheet, Text, View, Alert, type ViewStyle, type TextStyle } from 'react-native';
import { useTranslation } from 'react-i18next';
import * as Haptics from '../../lib/haptics';
import { COLORS, FONTS, SPACING, RADIUS } from '../../lib/constants';
import {
  addSavedDestination,
  getSavedDestinations,
  removeSavedDestination,
  getSkyscannerUrl,
  type SavedDestination,
} from '../../lib/flight-intelligence';
import { getHomeAirport } from '../../lib/flights';
import { TrendingDown, ExternalLink } from 'lucide-react-native';

interface FlightDealCardProps {
  destination: string;
  onDealAlert?: (message: string) => void;
}

export default function FlightDealCard({ destination, onDealAlert }: FlightDealCardProps) {
  const { t } = useTranslation();
  const [watched, setWatched] = useState<SavedDestination | null>(null);
  const [loading, setLoading] = useState(false);

  const loadWatched = React.useCallback(async () => {
    const list = await getSavedDestinations();
    const match = list.find(
      (d) => d.destination.toLowerCase() === destination.toLowerCase()
    );
    setWatched(match ?? null);
  }, [destination]);

  React.useEffect(() => {
    loadWatched();
  }, [loadWatched]);

  const handleWatch = async () => {
    Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Medium);
    setLoading(true);
    try {
      const homeAirport = await getHomeAirport();
      const saved = await addSavedDestination(destination, homeAirport);
      setWatched(saved);
      await loadWatched();
    } catch {
      Alert.alert(
        t('flights.errorTitle', { defaultValue: "Couldn't add" }),
        t('flights.errorSaveRoute', { defaultValue: "Couldn\u2019t save this route. Try again in a moment." }),
        [{ text: t('flights.ok', { defaultValue: 'OK' }) }]
      );
    } finally {
      setLoading(false);
    }
  };

  const handleUnwatch = async () => {
    if (!watched) return;
    Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
    await removeSavedDestination(watched.id);
    setWatched(null);
  };

  const handleSearchDeals = () => {
    Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
    const url = getSkyscannerUrl(destination);
    Linking.openURL(url).catch(() => {});
  };

  return (
    <View style={styles.container}>
      <View style={styles.header}>
        <TrendingDown size={18} color={COLORS.sage} strokeWidth={1.5} />
        <Text style={styles.headerLabel}>{t('flights.dealsLabel', { defaultValue: 'FLIGHT DEALS' })}</Text>
      </View>
      <Text style={styles.title}>
        {watched
          ? `${t('flights.saved', { defaultValue: 'Saved' })}: ${destination}`
          : `${t('flights.trackFlightsTo', { defaultValue: 'Track flights to' })} ${destination}`}
      </Text>
      <View style={styles.actions}>
        {watched ? (
          <>
            <Pressable
              onPress={handleSearchDeals}
              style={({ pressed }) => [
                styles.btn,
                styles.btnPrimary,
                { opacity: pressed ? 0.7 : 1 },
              ]}
            >
              <Text style={styles.btnText}>{t('flights.searchOnSkyscanner', { defaultValue: 'Search on Skyscanner' })}</Text>
              <ExternalLink size={12} color={COLORS.sage} strokeWidth={1.5} />
            </Pressable>
            <Pressable
              onPress={handleUnwatch}
              style={({ pressed }) => [styles.btn, { opacity: pressed ? 0.7 : 1 }]}
            >
              <Text style={styles.btnTextMuted}>{t('flights.remove', { defaultValue: 'Remove' })}</Text>
            </Pressable>
          </>
        ) : (
          <Pressable
            onPress={handleWatch}
            disabled={loading}
            style={({ pressed }) => [
              styles.btn,
              styles.btnPrimary,
              { opacity: pressed || loading ? 0.7 : 1 },
            ]}
          >
            <Text style={styles.btnText}>{loading ? t('flights.adding', { defaultValue: 'Adding...' }) : t('flights.saveDestination', { defaultValue: 'Save destination' })}</Text>
          </Pressable>
        )}
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    backgroundColor: COLORS.bgGlass,
    borderRadius: RADIUS.lg,
    borderWidth: 1,
    borderColor: COLORS.border,
    padding: SPACING.md,
    gap: SPACING.sm,
  } as ViewStyle,
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: SPACING.xs,
  } as ViewStyle,
  headerLabel: {
    fontFamily: FONTS.mono,
    fontSize: 11,
    color: COLORS.sage,
    letterSpacing: 1.5,
  } as TextStyle,
  title: {
    fontFamily: FONTS.body,
    fontSize: 14,
    color: COLORS.cream,
    lineHeight: 20,
  } as TextStyle,
  actions: {
    flexDirection: 'row',
    gap: SPACING.sm,
    marginTop: SPACING.xs,
  } as ViewStyle,
  btn: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: SPACING.xs,
    paddingHorizontal: SPACING.md,
    paddingVertical: SPACING.sm,
    borderRadius: RADIUS.md,
  } as ViewStyle,
  btnPrimary: {
    backgroundColor: COLORS.sageLight,
    borderWidth: 1,
    borderColor: COLORS.sage,
  } as ViewStyle,
  btnText: {
    fontFamily: FONTS.bodySemiBold,
    fontSize: 14,
    color: COLORS.sage,
  } as TextStyle,
  btnTextMuted: {
    fontFamily: FONTS.body,
    fontSize: 13,
    color: COLORS.creamMuted,
  } as TextStyle,
});
