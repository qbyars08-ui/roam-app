// =============================================================================
// ROAM — Safety Intel
// Detailed safety information — Sonar + travel advisory + emergency numbers
// =============================================================================
import React, { useCallback, useEffect, useMemo, useState } from 'react';
import {
  Pressable,
  ScrollView,
  StyleSheet,
  Text,
  View,
  type TextStyle,
  type ViewStyle,
} from 'react-native';
import { useLocalSearchParams, useRouter } from 'expo-router';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import {
  AlertTriangle,
  ChevronLeft,
  CheckCircle,
  Flame,
  MapPin,
  Phone,
  Shield,
  ShieldAlert,
  ShieldCheck,
  Truck,
} from 'lucide-react-native';
import { useTranslation } from 'react-i18next';
import { COLORS, FONTS, SPACING, RADIUS, DESTINATIONS } from '../lib/constants';
import { useAppStore } from '../lib/store';
import { useSonarQuery } from '../lib/sonar';
import { getTravelAdvisory, formatSafetyScore, type TravelAdvisory } from '../lib/travel-safety';
import { getEmergencyNumbers, type EmergencyNumbers } from '../lib/emergency-numbers';
import { geocodeCity } from '../lib/geocoding';
import { SkeletonCard } from '../components/premium/LoadingStates';
import LiveBadge from '../components/ui/LiveBadge';
import SourceCitation from '../components/ui/SourceCitation';
import * as Haptics from '../lib/haptics';

// ---------------------------------------------------------------------------
// Risk color helper
// ---------------------------------------------------------------------------
function getRiskColor(score: number): string {
  if (score <= 2.5) return COLORS.sage;
  if (score <= 3.5) return COLORS.gold;
  if (score <= 4.5) return COLORS.coral;
  return COLORS.emergencyRed;
}

// ---------------------------------------------------------------------------
// Emergency number row
// ---------------------------------------------------------------------------
interface EmergencyRowProps {
  label: string;
  numbers: string[];
  icon: React.ReactNode;
}

function EmergencyRow({ label, numbers, icon }: EmergencyRowProps) {
  if (numbers.length === 0) return null;
  return (
    <View style={styles.emergencyItem}>
      {icon}
      <View style={styles.emergencyItemBody}>
        <Text style={styles.emergencyLabel}>{label}</Text>
        <Text style={styles.emergencyNumber}>{numbers[0]}</Text>
      </View>
    </View>
  );
}

// ---------------------------------------------------------------------------
// Extract sections from Sonar answer text
// Heuristic: looks for bullet lines or numbered lines with keywords
// ---------------------------------------------------------------------------
function extractSections(answer: string): {
  scams: string[];
  safeAreas: string[];
  avoidAreas: string[];
  other: string;
} {
  const lines = answer
    .split('\n')
    .map((l) => l.trim())
    .filter(Boolean);

  const scams: string[] = [];
  const safeAreas: string[] = [];
  const avoidAreas: string[] = [];
  const remainingLines: string[] = [];

  let currentSection: 'scams' | 'safe' | 'avoid' | 'other' = 'other';

  for (const line of lines) {
    const lower = line.toLowerCase();

    // Detect section headers
    if (lower.includes('scam') && (lower.startsWith('#') || lower.endsWith(':') || lower.length < 40)) {
      currentSection = 'scams';
      continue;
    }
    if ((lower.includes('safe') && lower.includes('neighbor')) || (lower.includes('safe area') && lower.length < 40)) {
      currentSection = 'safe';
      continue;
    }
    if ((lower.includes('avoid') || lower.includes('unsafe') || lower.includes('danger')) && lower.length < 50) {
      currentSection = 'avoid';
      continue;
    }

    // Bullet/numbered line
    const isBullet = /^[-*•\d+\.]/.test(line);

    if (isBullet) {
      const text = line.replace(/^[-*•\d+\.]\s*/, '');
      if (
        currentSection === 'scams' ||
        lower.includes('scam') ||
        lower.includes('pickpocket') ||
        lower.includes('overcharge') ||
        lower.includes('fake') ||
        lower.includes('tourist trap')
      ) {
        scams.push(text);
      } else if (
        currentSection === 'safe' ||
        lower.includes('safe') ||
        lower.includes('tourist-friendly') ||
        lower.includes('well-lit')
      ) {
        safeAreas.push(text);
      } else if (
        currentSection === 'avoid' ||
        lower.includes('avoid') ||
        lower.includes('unsafe') ||
        lower.includes('caution')
      ) {
        avoidAreas.push(text);
      } else {
        remainingLines.push(line);
      }
    } else {
      remainingLines.push(line);
    }
  }

  return {
    scams: scams.slice(0, 5),
    safeAreas: safeAreas.slice(0, 4),
    avoidAreas: avoidAreas.slice(0, 4),
    other: remainingLines.join('\n'),
  };
}

// ---------------------------------------------------------------------------
// Main screen
// ---------------------------------------------------------------------------
function SafetyIntelScreen() {
  const router = useRouter();
  const insets = useSafeAreaInsets();
  const { t } = useTranslation();
  const { destination: paramDest } = useLocalSearchParams<{ destination: string }>();
  const trips = useAppStore((s) => s.trips);

  const destination = useMemo((): string => {
    if (paramDest) return paramDest;
    if (trips.length > 0) return trips[0].destination;
    return DESTINATIONS[0]?.label ?? 'Bangkok';
  }, [paramDest, trips]);

  // Sonar detailed safety intel
  const sonar = useSonarQuery(destination, 'safety_detail');

  // Travel advisory
  const [advisory, setAdvisory] = useState<TravelAdvisory | null>(null);
  const [emergencyNumbers, setEmergencyNumbers] = useState<EmergencyNumbers | null>(null);
  const [dataLoading, setDataLoading] = useState(false);

  useEffect(() => {
    if (!destination) return;
    let cancelled = false;
    setDataLoading(true);

    (async () => {
      try {
        const geo = await geocodeCity(destination);
        if (cancelled || !geo) return;

        const countryCode = geo.countryCode;
        if (!countryCode) return;

        const [adv, emerg] = await Promise.allSettled([
          getTravelAdvisory(countryCode),
          getEmergencyNumbers(countryCode),
        ]);

        if (!cancelled) {
          if (adv.status === 'fulfilled' && adv.value) setAdvisory(adv.value);
          if (emerg.status === 'fulfilled' && emerg.value) setEmergencyNumbers(emerg.value);
        }
      } catch {
        // non-fatal
      } finally {
        if (!cancelled) setDataLoading(false);
      }
    })();

    return () => { cancelled = true; };
  }, [destination]);

  const handleBack = useCallback(() => {
    void Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
    router.back();
  }, [router]);

  // Parse sonar answer into sections
  const sections = useMemo(
    () => (sonar.data ? extractSections(sonar.data.answer) : null),
    [sonar.data],
  );

  const riskColor = useMemo(
    () => (advisory ? getRiskColor(advisory.score) : COLORS.muted),
    [advisory],
  );

  return (
    <View style={[styles.container, { paddingTop: insets.top }]}>
      {/* Header */}
      <View style={styles.headerBar}>
        <Pressable onPress={handleBack} hitSlop={12}>
          <ChevronLeft size={24} color={COLORS.cream} strokeWidth={1.5} />
        </Pressable>
      </View>

      <ScrollView
        contentContainerStyle={[styles.scroll, { paddingBottom: insets.bottom + SPACING.xl }]}
        showsVerticalScrollIndicator={false}
      >
        {/* Hero */}
        <View style={styles.heroBlock}>
          <Shield size={32} color={COLORS.sage} strokeWidth={1.5} />
          <Text style={styles.heroTitle}>
            {t('safetyIntel.heroTitle', { defaultValue: 'Stay safe in' })}
          </Text>
          <Text style={styles.heroDestination}>{destination}</Text>
        </View>

        {/* Safety score from travel advisory */}
        {dataLoading && !advisory ? (
          <SkeletonCard height={80} style={{ marginBottom: SPACING.md }} />
        ) : advisory ? (
          <View style={[styles.advisoryCard, { borderColor: riskColor + '40' }]}>
            <View style={styles.advisoryTopRow}>
              <ShieldAlert size={20} color={riskColor} strokeWidth={1.5} />
              <Text style={[styles.advisoryLabel, { color: riskColor }]}>
                {advisory.label}
              </Text>
              <Text style={[styles.advisoryScore, { color: riskColor }]}>
                {formatSafetyScore(advisory.score)}
              </Text>
            </View>
            <Text style={styles.advisoryAdvice}>{advisory.advice}</Text>
            {advisory.sourcesActive > 0 ? (
              <Text style={styles.advisoryMeta}>
                {t('safetyIntel.sourcesActive', { defaultValue: 'Based on' })} {advisory.sourcesActive} {t('safetyIntel.govAdvisories', { defaultValue: 'government advisories' })}
              </Text>
            ) : null}
          </View>
        ) : !dataLoading ? (
          <View style={styles.fallbackContainer}>
            <Text style={styles.fallbackText}>Travel advisory data unavailable</Text>
          </View>
        ) : null}

        {/* Sonar detailed safety intel */}
        {sonar.isLoading && !sonar.error ? (
          <SkeletonCard height={160} style={{ marginBottom: SPACING.md }} />
        ) : sonar.data ? (
          <View style={styles.sonarCard}>
            <View style={styles.sonarCardHeader}>
              <Text style={styles.sonarCardLabel}>
                {t('safetyIntel.sonarLabel', { defaultValue: 'DETAILED SAFETY INTEL' })}
              </Text>
              {sonar.isLive ? <LiveBadge size="sm" /> : null}
            </View>
            {/* Full answer */}
            <Text style={styles.sonarAnswer}>{sonar.data.answer}</Text>
            {sonar.citations.length > 0 ? (
              <View style={{ marginTop: SPACING.sm }}>
                <SourceCitation citations={sonar.citations} />
              </View>
            ) : null}
          </View>
        ) : sonar.error ? (
          <View style={styles.errorCard}>
            <Text style={styles.errorText}>
              {t('safetyIntel.sonarError', { defaultValue: 'Safety intel unavailable. Check connection.' })}
            </Text>
          </View>
        ) : null}

        {/* Extracted: Scams to watch for */}
        {sections && sections.scams.length > 0 ? (
          <View style={styles.sectionCard}>
            <View style={styles.sectionHeaderRow}>
              <AlertTriangle size={16} color={COLORS.gold} strokeWidth={1.5} />
              <Text style={styles.sectionTitle}>
                {t('safetyIntel.scamsTitle', { defaultValue: 'Scams to watch for' })}
              </Text>
            </View>
            {sections.scams.map((scam, i) => (
              <View key={i} style={styles.bulletRow}>
                <AlertTriangle size={12} color={COLORS.gold} strokeWidth={1.5} style={styles.bulletIcon} />
                <Text style={styles.bulletText}>{scam}</Text>
              </View>
            ))}
          </View>
        ) : null}

        {/* Extracted: Safe neighborhoods */}
        {sections && sections.safeAreas.length > 0 ? (
          <View style={styles.sectionCard}>
            <View style={styles.sectionHeaderRow}>
              <CheckCircle size={16} color={COLORS.sage} strokeWidth={1.5} />
              <Text style={styles.sectionTitle}>
                {t('safetyIntel.safeAreasTitle', { defaultValue: 'Safe neighborhoods' })}
              </Text>
            </View>
            {sections.safeAreas.map((area, i) => (
              <View key={i} style={styles.bulletRow}>
                <MapPin size={12} color={COLORS.sage} strokeWidth={1.5} style={styles.bulletIcon} />
                <Text style={styles.bulletText}>{area}</Text>
              </View>
            ))}
          </View>
        ) : null}

        {/* Extracted: Avoid at night */}
        {sections && sections.avoidAreas.length > 0 ? (
          <View style={styles.sectionCard}>
            <View style={styles.sectionHeaderRow}>
              <ShieldAlert size={16} color={COLORS.coral} strokeWidth={1.5} />
              <Text style={styles.sectionTitle}>
                {t('safetyIntel.avoidAreasTitle', { defaultValue: 'Avoid at night' })}
              </Text>
            </View>
            {sections.avoidAreas.map((area, i) => (
              <View key={i} style={styles.bulletRow}>
                <AlertTriangle size={12} color={COLORS.coral} strokeWidth={1.5} style={styles.bulletIcon} />
                <Text style={styles.bulletText}>{area}</Text>
              </View>
            ))}
          </View>
        ) : null}

        {/* Emergency numbers */}
        {emergencyNumbers ? (
          <View style={styles.emergencyCard}>
            <View style={styles.sectionHeaderRow}>
              <Phone size={16} color={COLORS.coral} strokeWidth={1.5} />
              <Text style={styles.sectionTitle}>
                {t('safetyIntel.emergencyTitle', { defaultValue: 'Emergency numbers' })}
              </Text>
            </View>
            <View style={styles.emergencyGrid}>
              <EmergencyRow
                label={t('safetyIntel.police', { defaultValue: 'Police' })}
                numbers={emergencyNumbers.police}
                icon={<ShieldCheck size={16} color={COLORS.sage} strokeWidth={1.5} />}
              />
              <EmergencyRow
                label={t('safetyIntel.ambulance', { defaultValue: 'Ambulance' })}
                numbers={emergencyNumbers.ambulance}
                icon={<Truck size={16} color={COLORS.coral} strokeWidth={1.5} />}
              />
              <EmergencyRow
                label={t('safetyIntel.fire', { defaultValue: 'Fire' })}
                numbers={emergencyNumbers.fire}
                icon={<Flame size={16} color={COLORS.gold} strokeWidth={1.5} />}
              />
            </View>
            {emergencyNumbers.isMember112 ? (
              <View style={styles.eu112Badge}>
                <Text style={styles.eu112Text}>
                  {t('safetyIntel.eu112', { defaultValue: 'EU 112 universal emergency number available' })}
                </Text>
              </View>
            ) : null}
          </View>
        ) : dataLoading ? (
          <SkeletonCard height={100} style={{ marginBottom: SPACING.md }} />
        ) : (
          <View style={styles.fallbackContainer}>
            <Text style={styles.fallbackText}>Emergency numbers unavailable</Text>
          </View>
        )}
      </ScrollView>
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
  headerBar: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: SPACING.md,
    paddingVertical: SPACING.sm,
  } as ViewStyle,
  scroll: {
    paddingHorizontal: SPACING.md,
  } as ViewStyle,

  // Hero
  heroBlock: {
    alignItems: 'center',
    marginBottom: SPACING.lg,
    gap: SPACING.xs,
    paddingTop: SPACING.sm,
  } as ViewStyle,
  heroTitle: {
    fontFamily: FONTS.body,
    fontSize: 16,
    color: COLORS.creamDim,
    marginTop: SPACING.sm,
  } as TextStyle,
  heroDestination: {
    fontFamily: FONTS.header,
    fontSize: 32,
    color: COLORS.cream,
    textAlign: 'center',
  } as TextStyle,

  // Advisory card
  advisoryCard: {
    backgroundColor: COLORS.surface1,
    borderRadius: RADIUS.md,
    borderWidth: 1,
    padding: SPACING.md,
    marginBottom: SPACING.md,
    gap: SPACING.xs,
  } as ViewStyle,
  advisoryTopRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: SPACING.sm,
  } as ViewStyle,
  advisoryLabel: {
    fontFamily: FONTS.bodySemiBold,
    fontSize: 15,
    flex: 1,
  } as TextStyle,
  advisoryScore: {
    fontFamily: FONTS.mono,
    fontSize: 13,
  } as TextStyle,
  advisoryAdvice: {
    fontFamily: FONTS.body,
    fontSize: 13,
    color: COLORS.creamSoft,
    lineHeight: 20,
  } as TextStyle,
  advisoryMeta: {
    fontFamily: FONTS.mono,
    fontSize: 10,
    color: COLORS.muted,
    letterSpacing: 0.3,
    marginTop: 2,
  } as TextStyle,

  // Sonar card
  sonarCard: {
    backgroundColor: COLORS.surface1,
    borderRadius: RADIUS.md,
    borderWidth: 1,
    borderColor: COLORS.border,
    padding: SPACING.md,
    marginBottom: SPACING.md,
  } as ViewStyle,
  sonarCardHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: SPACING.sm,
    marginBottom: SPACING.sm,
  } as ViewStyle,
  sonarCardLabel: {
    fontFamily: FONTS.mono,
    fontSize: 10,
    color: COLORS.sage,
    letterSpacing: 1.5,
  } as TextStyle,
  sonarAnswer: {
    fontFamily: FONTS.body,
    fontSize: 14,
    color: COLORS.creamSoft,
    lineHeight: 22,
  } as TextStyle,

  // Error
  errorCard: {
    backgroundColor: COLORS.surface1,
    borderRadius: RADIUS.md,
    borderWidth: 1,
    borderColor: COLORS.dangerBorderLight,
    padding: SPACING.md,
    marginBottom: SPACING.md,
  } as ViewStyle,
  errorText: {
    fontFamily: FONTS.body,
    fontSize: 13,
    color: COLORS.coral,
  } as TextStyle,

  // Section card (scams, safe/avoid areas)
  sectionCard: {
    backgroundColor: COLORS.surface1,
    borderRadius: RADIUS.md,
    borderWidth: 1,
    borderColor: COLORS.border,
    padding: SPACING.md,
    marginBottom: SPACING.md,
    gap: SPACING.xs,
  } as ViewStyle,
  sectionHeaderRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: SPACING.sm,
    marginBottom: SPACING.sm,
  } as ViewStyle,
  sectionTitle: {
    fontFamily: FONTS.bodySemiBold,
    fontSize: 15,
    color: COLORS.cream,
  } as TextStyle,
  bulletRow: {
    flexDirection: 'row',
    alignItems: 'flex-start',
    gap: SPACING.xs,
    marginBottom: SPACING.xs,
  } as ViewStyle,
  bulletIcon: {
    marginTop: 2,
    flexShrink: 0,
  } as ViewStyle,
  bulletText: {
    fontFamily: FONTS.body,
    fontSize: 13,
    color: COLORS.creamSoft,
    lineHeight: 20,
    flex: 1,
  } as TextStyle,

  // Emergency card
  emergencyCard: {
    backgroundColor: COLORS.surface1,
    borderRadius: RADIUS.md,
    borderWidth: 1,
    borderColor: COLORS.border,
    padding: SPACING.md,
    marginBottom: SPACING.md,
  } as ViewStyle,
  emergencyGrid: {
    gap: SPACING.sm,
  } as ViewStyle,
  emergencyItem: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: SPACING.sm,
    backgroundColor: COLORS.bgGlass,
    borderRadius: RADIUS.sm,
    padding: SPACING.sm,
  } as ViewStyle,
  emergencyItemBody: {
    flex: 1,
  } as ViewStyle,
  emergencyLabel: {
    fontFamily: FONTS.mono,
    fontSize: 10,
    color: COLORS.muted,
    letterSpacing: 0.5,
    textTransform: 'uppercase',
  } as TextStyle,
  emergencyNumber: {
    fontFamily: FONTS.mono,
    fontSize: 20,
    color: COLORS.coral,
  } as TextStyle,
  eu112Badge: {
    backgroundColor: COLORS.sageSubtle,
    borderRadius: RADIUS.sm,
    padding: SPACING.sm,
    marginTop: SPACING.sm,
  } as ViewStyle,
  eu112Text: {
    fontFamily: FONTS.bodyMedium,
    fontSize: 12,
    color: COLORS.sage,
    textAlign: 'center',
  } as TextStyle,
  fallbackContainer: { paddingVertical: SPACING.md, alignItems: 'center' } as ViewStyle,
  fallbackText: { color: COLORS.muted, fontSize: 14, fontFamily: FONTS.body } as TextStyle,
});

export default SafetyIntelScreen;
