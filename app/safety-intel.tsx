// =============================================================================
// ROAM — Safety Intel (visual-first rebuild)
// Large score, icon scam cards, pill chips, tap-to-call buttons
// =============================================================================
import React, { useCallback, useEffect, useMemo, useState } from 'react';
import {
  Linking, Pressable, ScrollView, StyleSheet, Text, View,
  type TextStyle, type ViewStyle,
} from 'react-native';
import { useLocalSearchParams, useRouter } from 'expo-router';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import {
  AlertTriangle, ChevronLeft, Flame, Phone, Shield, ShieldCheck, Truck,
} from 'lucide-react-native';
import { useTranslation } from 'react-i18next';
import { COLORS, FONTS, SPACING, RADIUS, DESTINATIONS } from '../lib/constants';
import { useAppStore } from '../lib/store';
import { useSonarQuery } from '../lib/sonar';
import { getTravelAdvisory, formatSafetyScore, type TravelAdvisory } from '../lib/travel-safety';
import { getEmergencyNumbers, type EmergencyNumbers } from '../lib/emergency-numbers';
import { geocodeCity } from '../lib/geocoding';
import { SkeletonCard } from '../components/premium/LoadingStates';
import SonarCard from '../components/ui/SonarCard';
import * as Haptics from '../lib/haptics';

// ---------------------------------------------------------------------------
// Risk color + label
// ---------------------------------------------------------------------------
function getRiskColor(score: number): string {
  if (score <= 2) return COLORS.sage;
  if (score <= 3) return COLORS.gold;
  return COLORS.coral;
}
function getRiskWord(score: number): string {
  if (score <= 2) return 'Safe';
  if (score <= 3) return 'Moderate';
  if (score <= 4) return 'Caution';
  return 'Danger';
}

// ---------------------------------------------------------------------------
// Extract sections from Sonar answer
// ---------------------------------------------------------------------------
function extractSections(answer: string) {
  const lines = answer.split('\n').map((l) => l.trim()).filter(Boolean);
  const scams: string[] = [];
  const safeAreas: string[] = [];
  const avoidAreas: string[] = [];
  let currentSection: 'scams' | 'safe' | 'avoid' | 'other' = 'other';

  for (const line of lines) {
    const lower = line.toLowerCase();
    if (lower.includes('scam') && lower.length < 40) { currentSection = 'scams'; continue; }
    if ((lower.includes('safe') && lower.includes('neighbor')) && lower.length < 40) { currentSection = 'safe'; continue; }
    if ((lower.includes('avoid') || lower.includes('unsafe')) && lower.length < 50) { currentSection = 'avoid'; continue; }

    const isBullet = /^[-*\u2022\d+.]/.test(line);
    if (isBullet) {
      const text = line.replace(/^[-*\u2022\d+.]\s*/, '');
      if (currentSection === 'scams' || lower.includes('scam') || lower.includes('pickpocket')) {
        scams.push(text);
      } else if (currentSection === 'safe' || lower.includes('safe')) {
        safeAreas.push(text);
      } else if (currentSection === 'avoid' || lower.includes('avoid')) {
        avoidAreas.push(text);
      }
    }
  }
  return { scams: scams.slice(0, 5), safeAreas: safeAreas.slice(0, 4), avoidAreas: avoidAreas.slice(0, 4) };
}

// ---------------------------------------------------------------------------
// Scam icon card
// ---------------------------------------------------------------------------
function ScamCard({ text }: { text: string }) {
  const parts = text.split(/[.!?–—:]\s*/);
  const title = parts[0] ?? text;
  const desc = parts.length > 1 ? parts.slice(1).join('. ').trim() : '';
  return (
    <View style={s.scamCard}>
      <AlertTriangle size={16} color={COLORS.gold} strokeWidth={1.5} />
      <View style={s.scamBody}>
        <Text style={s.scamTitle} numberOfLines={1}>{title}</Text>
        {desc.length > 0 && <Text style={s.scamDesc} numberOfLines={1}>{desc}</Text>}
      </View>
    </View>
  );
}

// ---------------------------------------------------------------------------
// Emergency tap-to-call button
// ---------------------------------------------------------------------------
function EmergencyButton({ label, number, icon, color }: {
  label: string; number: string; icon: React.ReactNode; color: string;
}) {
  const call = useCallback(() => {
    void Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Heavy);
    void Linking.openURL(`tel:${number}`);
  }, [number]);

  return (
    <Pressable onPress={call} style={({ pressed }) => [s.emergBtn, { opacity: pressed ? 0.85 : 1, borderColor: color + '40' }]}>
      {icon}
      <Text style={[s.emergNum, { color }]}>{number}</Text>
      <Text style={s.emergLabel}>{label}</Text>
    </Pressable>
  );
}

// ---------------------------------------------------------------------------
// Main screen
// ---------------------------------------------------------------------------
function SafetyIntelScreen() {
  const router = useRouter();
  const insets = useSafeAreaInsets();
  const { t } = useTranslation();
  const { destination: paramDest } = useLocalSearchParams<{ destination: string }>();
  const trips = useAppStore((st) => st.trips);
  const destination = useMemo(
    () => paramDest || (trips.length > 0 ? trips[0].destination : DESTINATIONS[0]?.label ?? 'Bangkok'),
    [paramDest, trips],
  );

  const sonar = useSonarQuery(destination, 'safety_detail');
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
        if (cancelled || !geo?.countryCode) return;
        const [adv, emerg] = await Promise.allSettled([
          getTravelAdvisory(geo.countryCode),
          getEmergencyNumbers(geo.countryCode),
        ]);
        if (!cancelled) {
          if (adv.status === 'fulfilled' && adv.value) setAdvisory(adv.value);
          if (emerg.status === 'fulfilled' && emerg.value) setEmergencyNumbers(emerg.value);
        }
      } catch { /* non-fatal */ } finally { if (!cancelled) setDataLoading(false); }
    })();
    return () => { cancelled = true; };
  }, [destination]);

  const handleBack = useCallback(() => {
    void Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
    router.back();
  }, [router]);

  const sections = useMemo(
    () => (sonar.data ? extractSections(sonar.data.answer) : null),
    [sonar.data],
  );

  const riskColor = useMemo(
    () => (advisory ? getRiskColor(advisory.score) : COLORS.muted),
    [advisory],
  );

  return (
    <View style={[s.container, { paddingTop: insets.top }]}>
      <View style={s.headerBar}>
        <Pressable onPress={handleBack} hitSlop={12}>
          <ChevronLeft size={24} color={COLORS.cream} strokeWidth={1.5} />
        </Pressable>
      </View>

      <ScrollView contentContainerStyle={[s.scroll, { paddingBottom: insets.bottom + SPACING.xl }]} showsVerticalScrollIndicator={false}>
        {/* Hero */}
        <View style={s.heroBlock}>
          <Shield size={32} color={COLORS.sage} strokeWidth={1.5} />
          <Text style={s.heroSub}>{t('safetyIntel.heroTitle', { defaultValue: 'Stay safe in' })}</Text>
          <Text style={s.heroDest}>{destination}</Text>
        </View>

        {/* Advisory score — large number */}
        {dataLoading && !advisory ? (
          <SkeletonCard height={100} style={{ marginBottom: SPACING.xl }} />
        ) : advisory ? (
          <View style={[s.scoreCard, { borderColor: riskColor + '40' }]}>
            <Text style={[s.scoreNum, { color: riskColor }]}>{formatSafetyScore(advisory.score)}</Text>
            <Text style={[s.scoreWord, { color: riskColor }]}>{getRiskWord(advisory.score)}</Text>
            {advisory.sourcesActive > 0 && (
              <Text style={s.scoreMeta}>
                {advisory.sourcesActive} {t('safetyIntel.govAdvisories', { defaultValue: 'government advisories' })}
              </Text>
            )}
          </View>
        ) : null}

        {/* Sonar detail — bullet cards */}
        {sonar.isLoading ? (
          <SkeletonCard height={140} style={{ marginBottom: SPACING.xl }} />
        ) : sonar.data ? (
          <View style={s.secGap}>
            <SonarCard answer={sonar.data.answer} isLive={sonar.isLive} citations={sonar.citations} title="Safety Intel" maxBullets={3} />
          </View>
        ) : null}

        {/* Scam warnings — icon cards */}
        {sections && sections.scams.length > 0 && (
          <View style={s.secGap}>
            <Text style={s.secLabel}>{t('safetyIntel.scamsTitle', { defaultValue: 'SCAMS TO WATCH' })}</Text>
            {sections.scams.map((scam, i) => <ScamCard key={i} text={scam} />)}
          </View>
        )}

        {/* Safe neighborhoods — green pill chips */}
        {sections && sections.safeAreas.length > 0 && (
          <View style={s.secGap}>
            <Text style={s.secLabel}>{t('safetyIntel.safeAreasTitle', { defaultValue: 'SAFE NEIGHBORHOODS' })}</Text>
            <View style={s.pillWrap}>
              {sections.safeAreas.map((area, i) => (
                <View key={i} style={s.pillSafe}>
                  <Text style={s.pillSafeText} numberOfLines={1}>{area}</Text>
                </View>
              ))}
            </View>
          </View>
        )}

        {/* Avoid areas — coral pill chips */}
        {sections && sections.avoidAreas.length > 0 && (
          <View style={s.secGap}>
            <Text style={s.secLabel}>{t('safetyIntel.avoidAreasTitle', { defaultValue: 'AVOID AT NIGHT' })}</Text>
            <View style={s.pillWrap}>
              {sections.avoidAreas.map((area, i) => (
                <View key={i} style={s.pillAvoid}>
                  <Text style={s.pillAvoidText} numberOfLines={1}>{area}</Text>
                </View>
              ))}
            </View>
          </View>
        )}

        {/* Emergency numbers — 3 large tap-to-call buttons */}
        {emergencyNumbers ? (
          <View style={s.secGap}>
            <Text style={s.secLabel}>{t('safetyIntel.emergencyTitle', { defaultValue: 'EMERGENCY NUMBERS' })}</Text>
            <View style={s.emergGrid}>
              {emergencyNumbers.police.length > 0 && (
                <EmergencyButton
                  label={t('safetyIntel.police', { defaultValue: 'Police' })}
                  number={emergencyNumbers.police[0]}
                  icon={<ShieldCheck size={20} color={COLORS.sage} strokeWidth={1.5} />}
                  color={COLORS.sage}
                />
              )}
              {emergencyNumbers.ambulance.length > 0 && (
                <EmergencyButton
                  label={t('safetyIntel.ambulance', { defaultValue: 'Ambulance' })}
                  number={emergencyNumbers.ambulance[0]}
                  icon={<Truck size={20} color={COLORS.coral} strokeWidth={1.5} />}
                  color={COLORS.coral}
                />
              )}
              {emergencyNumbers.fire.length > 0 && (
                <EmergencyButton
                  label={t('safetyIntel.fire', { defaultValue: 'Fire' })}
                  number={emergencyNumbers.fire[0]}
                  icon={<Flame size={20} color={COLORS.gold} strokeWidth={1.5} />}
                  color={COLORS.gold}
                />
              )}
            </View>
            {emergencyNumbers.isMember112 && (
              <View style={s.eu112}>
                <Text style={s.eu112Text}>EU 112 available</Text>
              </View>
            )}
          </View>
        ) : dataLoading ? (
          <SkeletonCard height={100} style={{ marginBottom: SPACING.md }} />
        ) : null}
      </ScrollView>
    </View>
  );
}

// ---------------------------------------------------------------------------
// Styles
// ---------------------------------------------------------------------------
const s = StyleSheet.create({
  container: { flex: 1, backgroundColor: COLORS.bg } as ViewStyle,
  headerBar: { flexDirection: 'row', alignItems: 'center', paddingHorizontal: SPACING.md, paddingVertical: SPACING.sm } as ViewStyle,
  scroll: { paddingHorizontal: SPACING.md } as ViewStyle,
  secGap: { marginBottom: SPACING.xl } as ViewStyle,
  secLabel: { fontFamily: FONTS.mono, fontSize: 10, color: COLORS.muted, letterSpacing: 1.5, marginBottom: SPACING.sm } as TextStyle,

  // Hero
  heroBlock: { alignItems: 'center', marginBottom: SPACING.lg, gap: SPACING.xs, paddingTop: SPACING.sm } as ViewStyle,
  heroSub: { fontFamily: FONTS.body, fontSize: 16, color: COLORS.creamDim, marginTop: SPACING.sm } as TextStyle,
  heroDest: { fontFamily: FONTS.header, fontSize: 32, color: COLORS.cream, textAlign: 'center' } as TextStyle,

  // Score card — large number
  scoreCard: { backgroundColor: COLORS.surface1, borderRadius: RADIUS.lg, borderWidth: 1, padding: SPACING.lg, marginBottom: SPACING.xl, alignItems: 'center', gap: SPACING.xs } as ViewStyle,
  scoreNum: { fontFamily: FONTS.mono, fontSize: 48 } as TextStyle,
  scoreWord: { fontFamily: FONTS.bodyMedium, fontSize: 18 } as TextStyle,
  scoreMeta: { fontFamily: FONTS.mono, fontSize: 10, color: COLORS.muted, letterSpacing: 0.3, marginTop: 2 } as TextStyle,

  // Scam cards
  scamCard: { flexDirection: 'row', alignItems: 'flex-start', gap: SPACING.sm, backgroundColor: COLORS.surface1, borderRadius: RADIUS.lg, borderWidth: 1, borderColor: COLORS.border, padding: SPACING.md, marginBottom: SPACING.sm } as ViewStyle,
  scamBody: { flex: 1 } as ViewStyle,
  scamTitle: { fontFamily: FONTS.bodyMedium, fontSize: 14, color: COLORS.cream } as TextStyle,
  scamDesc: { fontFamily: FONTS.body, fontSize: 13, color: COLORS.creamBrightDim, marginTop: 2 } as TextStyle,

  // Pills
  pillWrap: { flexDirection: 'row', flexWrap: 'wrap', gap: SPACING.sm } as ViewStyle,
  pillSafe: { backgroundColor: COLORS.sageVeryFaint, borderWidth: 1, borderColor: COLORS.sageBorder, borderRadius: RADIUS.pill, paddingHorizontal: SPACING.sm, paddingVertical: 6 } as ViewStyle,
  pillSafeText: { fontFamily: FONTS.bodyMedium, fontSize: 13, color: COLORS.sage } as TextStyle,
  pillAvoid: { backgroundColor: COLORS.coralSubtle, borderWidth: 1, borderColor: COLORS.coralBorder, borderRadius: RADIUS.pill, paddingHorizontal: SPACING.sm, paddingVertical: 6 } as ViewStyle,
  pillAvoidText: { fontFamily: FONTS.bodyMedium, fontSize: 13, color: COLORS.coral } as TextStyle,

  // Emergency buttons
  emergGrid: { flexDirection: 'row', gap: SPACING.sm } as ViewStyle,
  emergBtn: { flex: 1, backgroundColor: COLORS.surface1, borderRadius: RADIUS.lg, borderWidth: 1, padding: SPACING.md, alignItems: 'center', gap: SPACING.xs } as ViewStyle,
  emergNum: { fontFamily: FONTS.mono, fontSize: 28 } as TextStyle,
  emergLabel: { fontFamily: FONTS.mono, fontSize: 10, color: COLORS.muted, letterSpacing: 0.5, textTransform: 'uppercase' } as TextStyle,
  eu112: { backgroundColor: COLORS.sageSubtle, borderRadius: RADIUS.sm, padding: SPACING.sm, marginTop: SPACING.sm } as ViewStyle,
  eu112Text: { fontFamily: FONTS.bodyMedium, fontSize: 12, color: COLORS.sage, textAlign: 'center' } as TextStyle,
});

export default SafetyIntelScreen;
