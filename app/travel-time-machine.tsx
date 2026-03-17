// =============================================================================
// ROAM — Travel Time Machine
// "Tokyo 2019 vs now" AI comparison
// =============================================================================
import React, { useState } from 'react';
import {
  View,
  Text,
  ScrollView,
  StyleSheet,
  Pressable,
  ActivityIndicator,
} from 'react-native';
import { useRouter, useLocalSearchParams } from 'expo-router';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { ChevronLeft, Clock } from 'lucide-react-native';
import { useTranslation } from 'react-i18next';
import { COLORS, FONTS, SPACING, RADIUS } from '../lib/constants';
import { compareDestinationOverTime } from '../lib/travel-time-machine';
import { withComingSoon } from '../lib/with-coming-soon';

function TravelTimeMachineScreen() {
  const { t } = useTranslation();
  const insets = useSafeAreaInsets();
  const router = useRouter();
  const params = useLocalSearchParams<{ destination?: string; year?: string }>();
  const destination = params.destination ?? 'Tokyo';
  const pastYear = params.year ? parseInt(params.year, 10) : 2019;

  const [result, setResult] = useState<{ past: string; now: string } | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  React.useEffect(() => {
    compareDestinationOverTime(destination, pastYear)
      .then(setResult)
      .catch(() => setError(t('timeMachine.errorLoad', { defaultValue: 'Could not load comparison' })))
      .finally(() => setLoading(false));
  }, [destination, pastYear]);

  return (
    <View style={[styles.container, { paddingTop: insets.top }]}>
      <View style={styles.header}>
        <Pressable onPress={() => router.back()} style={styles.backBtn}>
          <ChevronLeft size={24} color={COLORS.cream} />
        </Pressable>
        <View style={styles.headerCenter}>
          <Text style={styles.title}>{t('timeMachine.title', { defaultValue: 'Travel Time Machine' })}</Text>
          <Text style={styles.subtitle}>{destination} — {pastYear} {t('timeMachine.vsNow', { defaultValue: 'vs now' })}</Text>
        </View>
        <View style={styles.headerRight} />
      </View>

      {loading ? (
        <View style={styles.loading}>
          <ActivityIndicator color={COLORS.sage} size="large" />
          <Text style={styles.loadingText}>{t('timeMachine.comparing', { defaultValue: 'Comparing {{destination}} then and now...', destination })}</Text>
        </View>
      ) : error ? (
        <View style={styles.error}>
          <Text style={styles.errorText}>{error}</Text>
        </View>
      ) : result ? (
        <ScrollView
          style={styles.scroll}
          contentContainerStyle={[styles.scrollContent, { paddingBottom: insets.bottom + 24 }]}
          showsVerticalScrollIndicator={false}
        >
          <View style={styles.card}>
            <View style={styles.cardHeader}>
              <Clock size={18} color={COLORS.creamMuted} />
              <Text style={styles.cardLabel}>{pastYear}</Text>
            </View>
            <Text style={styles.cardBody}>{result.past}</Text>
          </View>
          <View style={styles.card}>
            <View style={styles.cardHeader}>
              <Clock size={18} color={COLORS.sage} />
              <Text style={[styles.cardLabel, { color: COLORS.sage }]}>{t('timeMachine.now', { defaultValue: 'Now' })}</Text>
            </View>
            <Text style={styles.cardBody}>{result.now}</Text>
          </View>
        </ScrollView>
      ) : null}
    </View>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: COLORS.bg },
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: SPACING.lg,
    paddingVertical: SPACING.md,
    borderBottomWidth: 1,
    borderBottomColor: COLORS.border,
  },
  backBtn: { padding: SPACING.sm, marginLeft: -SPACING.sm },
  headerCenter: { flex: 1, alignItems: 'center' },
  headerRight: { width: 44 },
  title: {
    fontFamily: FONTS.header,
    fontSize: 20,
    color: COLORS.cream,
  },
  subtitle: {
    fontFamily: FONTS.body,
    fontSize: 13,
    color: COLORS.creamMuted,
    marginTop: 2,
  },
  loading: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
    gap: SPACING.md,
  },
  loadingText: {
    fontFamily: FONTS.body,
    fontSize: 14,
    color: COLORS.creamMuted,
  },
  error: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
    padding: SPACING.lg,
  },
  errorText: {
    fontFamily: FONTS.body,
    fontSize: 14,
    color: COLORS.coral,
  },
  scroll: { flex: 1 },
  scrollContent: { padding: SPACING.lg, gap: SPACING.lg },
  card: {
    backgroundColor: COLORS.bgGlass,
    borderRadius: RADIUS.lg,
    padding: SPACING.lg,
    borderWidth: 1,
    borderColor: COLORS.border,
  },
  cardHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: SPACING.sm,
    marginBottom: SPACING.sm,
  },
  cardLabel: {
    fontFamily: FONTS.bodySemiBold,
    fontSize: 14,
    color: COLORS.creamMuted,
  },
  cardBody: {
    fontFamily: FONTS.body,
    fontSize: 15,
    color: COLORS.cream,
    lineHeight: 22,
  },
});

export default withComingSoon(TravelTimeMachineScreen, { routeName: 'travel-time-machine', title: 'Time Machine' });
