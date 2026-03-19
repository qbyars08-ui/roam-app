// =============================================================================
// ROAM — Body Intel (visual-first rebuild)
// Health prep hub — visual checklists, water icon, altitude gauge, travel kit grid
// =============================================================================
import React, { useCallback, useEffect, useMemo, useState } from 'react';
import {
  Pressable, ScrollView, StyleSheet, Text, View, Linking,
  type TextStyle, type ViewStyle,
} from 'react-native';
import { useLocalSearchParams, useRouter } from 'expo-router';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import AsyncStorage from '@react-native-async-storage/async-storage';
import {
  ArrowLeft, Activity, Droplets, AlertTriangle, Pill, CheckSquare, Square,
  Mountain, Heart, Syringe, Shield, Thermometer,
} from 'lucide-react-native';
import * as Haptics from '../lib/haptics';
import { useTranslation } from 'react-i18next';
import { COLORS, FONTS, SPACING, RADIUS } from '../lib/constants';
import { useAppStore } from '../lib/store';
import { getMedicalGuideByDestination, type MedicalGuide } from '../lib/medical-abroad';
import { getHealthBrief } from '../lib/health-brief';
import { useSonarQuery } from '../lib/sonar';
import SonarCard from '../components/ui/SonarCard';
import { SkeletonCard } from '../components/premium/LoadingStates';
import { track } from '../lib/analytics';

// ---------------------------------------------------------------------------
// Altitude lookup
// ---------------------------------------------------------------------------
const HIGH_ALT: Record<string, { meters: number; city: string }> = {
  'la paz': { meters: 3650, city: 'La Paz' }, 'cusco': { meters: 3400, city: 'Cusco' },
  'quito': { meters: 2850, city: 'Quito' }, 'bogota': { meters: 2640, city: 'Bogota' },
  'bogot\u00e1': { meters: 2640, city: 'Bogot\u00e1' }, 'mexico city': { meters: 2240, city: 'Mexico City' },
  'addis ababa': { meters: 2355, city: 'Addis Ababa' }, 'lhasa': { meters: 3650, city: 'Lhasa' },
  'denver': { meters: 1609, city: 'Denver' }, 'kathmandu': { meters: 1400, city: 'Kathmandu' },
  'medell\u00edn': { meters: 1495, city: 'Medell\u00edn' }, 'medellin': { meters: 1495, city: 'Medell\u00edn' },
};

function getAltitude(dest: string): { meters: number; city: string } | null {
  const key = dest.toLowerCase().trim();
  for (const [k, v] of Object.entries(HIGH_ALT)) {
    if (key.includes(k) || k.includes(key)) return v.meters >= 1400 ? v : null;
  }
  return null;
}

// ---------------------------------------------------------------------------
// Travel kit items
// ---------------------------------------------------------------------------
const KIT_ITEMS = [
  { id: 'antidiarrheal', icon: Pill, name: 'Anti-diarrheal' },
  { id: 'painkillers', icon: Pill, name: 'Painkillers' },
  { id: 'antihistamines', icon: Shield, name: 'Antihistamines' },
  { id: 'motion_sickness', icon: Activity, name: 'Motion sickness' },
  { id: 'insect_repellent', icon: AlertTriangle, name: 'Insect repellent' },
  { id: 'sunscreen', icon: Thermometer, name: 'Sunscreen SPF 50' },
  { id: 'hand_sanitizer', icon: Droplets, name: 'Hand sanitizer' },
] as const;

// Vaccine checklist items
const VACCINES = [
  { id: 'routine', name: 'Routine vaccines' },
  { id: 'hepatitis_a', name: 'Hepatitis A' },
  { id: 'hepatitis_b', name: 'Hepatitis B' },
  { id: 'typhoid', name: 'Typhoid' },
  { id: 'yellow_fever', name: 'Yellow Fever' },
  { id: 'malaria_meds', name: 'Malaria prophylaxis' },
] as const;

// ---------------------------------------------------------------------------
// Persistence
// ---------------------------------------------------------------------------
function checkKey(dest: string) { return `roam_health_${dest.toLowerCase().replace(/\s+/g, '_')}`; }
async function loadChecked(dest: string): Promise<Record<string, boolean>> {
  try { const r = await AsyncStorage.getItem(checkKey(dest)); return r ? JSON.parse(r) : {}; }
  catch { return {}; }
}
async function saveChecked(dest: string, items: Record<string, boolean>) {
  try { await AsyncStorage.setItem(checkKey(dest), JSON.stringify(items)); } catch { /* best-effort */ }
}

// ---------------------------------------------------------------------------
// Main Screen
// ---------------------------------------------------------------------------
export default function BodyIntelScreen() {
  const router = useRouter();
  const insets = useSafeAreaInsets();
  const { t } = useTranslation();
  const params = useLocalSearchParams<{ destination?: string }>();
  const trips = useAppStore((st) => st.trips);
  const destination = useMemo(
    () => params.destination || (trips.length > 0 ? trips[0].destination : ''),
    [params.destination, trips],
  );

  const [checked, setChecked] = useState<Record<string, boolean>>({});

  useEffect(() => { track({ type: 'screen_view', screen: 'body-intel' }); }, []);
  useEffect(() => {
    if (destination) loadChecked(destination).then(setChecked);
  }, [destination]);

  const { data: healthSonar, isLoading: healthLoading, isLive: healthLive, citations: healthCitations } = useSonarQuery(destination || undefined, 'health');
  const medicalGuide = useMemo(() => destination ? getMedicalGuideByDestination(destination) : null, [destination]);
  const healthBrief = useMemo(() => destination ? getHealthBrief(destination) : null, [destination]);
  const altitudeInfo = useMemo(() => destination ? getAltitude(destination) : null, [destination]);

  const toggle = useCallback((id: string) => {
    void Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
    setChecked((prev) => {
      const next = { ...prev, [id]: !prev[id] };
      if (destination) saveChecked(destination, next);
      return next;
    });
  }, [destination]);

  const handleBack = useCallback(() => { router.back(); }, [router]);

  if (!destination) {
    return (
      <View style={[s.root, { paddingTop: insets.top }]}>
        <View style={s.hdr}>
          <Pressable onPress={handleBack} hitSlop={12}><ArrowLeft size={24} color={COLORS.cream} strokeWidth={1.5} /></Pressable>
        </View>
        <View style={s.emptyWrap}><Text style={s.emptyTxt}>Select a destination first</Text></View>
      </View>
    );
  }

  const waterSafe = medicalGuide?.tapWaterSafe ?? null;
  const altPct = altitudeInfo ? Math.min(altitudeInfo.meters / 4500, 1) : 0;

  return (
    <View style={[s.root, { paddingTop: insets.top }]}>
      {/* Header */}
      <View style={s.hdr}>
        <Pressable onPress={handleBack} hitSlop={12}><ArrowLeft size={24} color={COLORS.cream} strokeWidth={1.5} /></Pressable>
        <View style={s.hdrCenter}>
          <Text style={s.hdrTitle}>{t('bodyIntel.title', { defaultValue: 'Health Prep' })}</Text>
          <Text style={s.hdrSub}>{destination}</Text>
        </View>
        <Activity size={20} color={COLORS.sage} strokeWidth={1.5} />
      </View>

      <ScrollView contentContainerStyle={[s.scr, { paddingBottom: insets.bottom + SPACING.xxl }]} showsVerticalScrollIndicator={false}>
        {/* 1. Vaccine checklist — visual checkboxes */}
        <Text style={s.secLabel}>{t('bodyIntel.vaccines', { defaultValue: 'VACCINE CHECKLIST' })}</Text>
        {healthLoading ? <SkeletonCard height={120} /> : healthSonar ? (
          <View style={s.secGap}>
            <SonarCard answer={healthSonar.answer} isLive={healthLive} citations={healthCitations} title="Vaccine Intel" maxBullets={3} />
          </View>
        ) : healthBrief?.vaccinations ? (
          <Text style={s.infoTxt}>{healthBrief.vaccinations}</Text>
        ) : null}
        <View style={s.checkCard}>
          {VACCINES.map((vax) => (
            <Pressable key={vax.id} onPress={() => toggle(`vax_${vax.id}`)} style={s.checkRow}>
              {checked[`vax_${vax.id}`] ? (
                <CheckSquare size={20} color={COLORS.sage} strokeWidth={1.5} />
              ) : (
                <Square size={20} color={COLORS.creamDim} strokeWidth={1.5} />
              )}
              <Text style={[s.checkLabel, checked[`vax_${vax.id}`] && s.checkDone]}>{vax.name}</Text>
            </Pressable>
          ))}
        </View>

        {/* 2. Water safety — single large icon + one word */}
        <Text style={s.secLabel}>{t('bodyIntel.waterSafety', { defaultValue: 'WATER SAFETY' })}</Text>
        <View style={[s.waterCard, { borderColor: waterSafe === true ? COLORS.sage + '40' : waterSafe === false ? COLORS.coral + '40' : COLORS.border }]}>
          {waterSafe === true ? (
            <Droplets size={36} color={COLORS.sage} strokeWidth={1.5} />
          ) : waterSafe === false ? (
            <AlertTriangle size={36} color={COLORS.coral} strokeWidth={1.5} />
          ) : (
            <Droplets size={36} color={COLORS.muted} strokeWidth={1.5} />
          )}
          <Text style={[s.waterWord, {
            color: waterSafe === true ? COLORS.sage : waterSafe === false ? COLORS.coral : COLORS.muted,
          }]}>
            {waterSafe === true ? 'Safe' : waterSafe === false ? 'Bottled Only' : 'Unknown'}
          </Text>
        </View>

        {/* 3. Altitude — visual gauge */}
        {altitudeInfo && (
          <>
            <Text style={s.secLabel}>{t('bodyIntel.altitude', { defaultValue: 'ALTITUDE' })}</Text>
            <View style={s.altCard}>
              <Mountain size={20} color={COLORS.gold} strokeWidth={1.5} />
              <Text style={s.altNum}>{altitudeInfo.meters.toLocaleString()}m</Text>
              <Text style={s.altCity}>{altitudeInfo.city}</Text>
              <View style={s.altTrack}>
                <View style={[s.altFill, { width: `${Math.round(altPct * 100)}%` as unknown as number }]} />
                <View style={[s.altMarker, { left: `${Math.round(altPct * 100)}%` as unknown as number }]} />
              </View>
              <View style={s.altLabels}>
                <Text style={s.altLabelTxt}>0m</Text>
                <Text style={s.altLabelTxt}>4,500m</Text>
              </View>
              <Text style={s.altTip}>Allow 1-3 days to acclimatize. Stay hydrated.</Text>
            </View>
          </>
        )}

        {/* 4. Travel kit — grid of icons */}
        <Text style={s.secLabel}>{t('bodyIntel.medicationChecklist', { defaultValue: 'TRAVEL KIT' })}</Text>
        <View style={s.kitGrid}>
          {KIT_ITEMS.map((item) => {
            const Icon = item.icon;
            const isChecked = checked[`med_${item.id}`] ?? false;
            return (
              <Pressable key={item.id} onPress={() => toggle(`med_${item.id}`)} style={[s.kitItem, isChecked && s.kitItemDone]}>
                <Icon size={20} color={isChecked ? COLORS.sage : COLORS.creamDim} strokeWidth={1.5} />
                <Text style={[s.kitName, isChecked && s.kitNameDone]} numberOfLines={2}>{item.name}</Text>
                {isChecked && <View style={s.kitCheck} />}
              </Pressable>
            );
          })}
        </View>

        {/* 5. Health risks (brief) */}
        {medicalGuide && medicalGuide.healthRisks.length > 0 && (
          <>
            <Text style={s.secLabel}>HEALTH RISKS</Text>
            <View style={s.riskCard}>
              {medicalGuide.healthRisks.slice(0, 3).map((risk, i) => (
                <View key={i} style={s.riskRow}>
                  <AlertTriangle size={14} color={COLORS.gold} strokeWidth={1.5} />
                  <Text style={s.riskTxt} numberOfLines={2}>{risk}</Text>
                </View>
              ))}
            </View>
          </>
        )}

        {/* 6. Emergency numbers */}
        {medicalGuide && (
          <>
            <Text style={s.secLabel}>EMERGENCY</Text>
            <View style={s.emergRow}>
              <View style={s.emergItem}>
                <Text style={s.emergNum}>{medicalGuide.emergencyNumber}</Text>
                <Text style={s.emergLabel}>Emergency</Text>
              </View>
              <View style={s.emergItem}>
                <Text style={s.emergNum}>{medicalGuide.ambulanceNumber}</Text>
                <Text style={s.emergLabel}>Ambulance</Text>
              </View>
              <View style={s.emergItem}>
                <Text style={s.emergNum}>{medicalGuide.policeNumber}</Text>
                <Text style={s.emergLabel}>Police</Text>
              </View>
            </View>
          </>
        )}

        {/* Symptom checker link */}
        <Pressable
          onPress={() => { void Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Medium); }}
          style={({ pressed }) => [s.symptomBtn, { opacity: pressed ? 0.85 : 1 }]}
        >
          <Heart size={20} color={COLORS.coral} strokeWidth={1.5} />
          <Text style={s.symptomTxt}>{t('bodyIntel.whatExperiencing', { defaultValue: 'Feeling unwell? Tap for guidance' })}</Text>
        </Pressable>

        {/* Disclaimer */}
        <Text style={s.disclaimer}>
          {t('bodyIntel.disclaimer', { defaultValue: 'Travel health info only. Not medical advice.' })}
        </Text>
      </ScrollView>
    </View>
  );
}

// ---------------------------------------------------------------------------
// Styles
// ---------------------------------------------------------------------------
const s = StyleSheet.create({
  root: { flex: 1, backgroundColor: COLORS.bg } as ViewStyle,
  hdr: { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', paddingHorizontal: SPACING.md, paddingVertical: SPACING.sm } as ViewStyle,
  hdrCenter: { alignItems: 'center' } as ViewStyle,
  hdrTitle: { fontFamily: FONTS.header, fontSize: 22, color: COLORS.cream } as TextStyle,
  hdrSub: { fontFamily: FONTS.mono, fontSize: 11, color: COLORS.sage, letterSpacing: 1, textTransform: 'uppercase', marginTop: 2 } as TextStyle,
  scr: { paddingHorizontal: SPACING.md } as ViewStyle,
  secGap: { marginBottom: SPACING.md } as ViewStyle,
  secLabel: { fontFamily: FONTS.mono, fontSize: 10, color: COLORS.muted, letterSpacing: 1.5, marginBottom: SPACING.sm, marginTop: SPACING.xl } as TextStyle,
  infoTxt: { fontFamily: FONTS.body, fontSize: 14, color: COLORS.creamBrightDim, lineHeight: 21, marginBottom: SPACING.sm } as TextStyle,

  // Vaccine checklist
  checkCard: { backgroundColor: COLORS.surface1, borderRadius: RADIUS.lg, borderWidth: 1, borderColor: COLORS.border, padding: SPACING.md, gap: 2, marginBottom: SPACING.md } as ViewStyle,
  checkRow: { flexDirection: 'row', alignItems: 'center', gap: SPACING.sm, paddingVertical: SPACING.xs + 2 } as ViewStyle,
  checkLabel: { fontFamily: FONTS.bodyMedium, fontSize: 15, color: COLORS.cream, flex: 1 } as TextStyle,
  checkDone: { color: COLORS.creamDim, textDecorationLine: 'line-through' } as TextStyle,

  // Water safety
  waterCard: { backgroundColor: COLORS.surface1, borderRadius: RADIUS.lg, borderWidth: 1, padding: SPACING.lg, alignItems: 'center', gap: SPACING.sm, marginBottom: SPACING.md } as ViewStyle,
  waterWord: { fontFamily: FONTS.bodyMedium, fontSize: 20 } as TextStyle,

  // Altitude gauge
  altCard: { backgroundColor: COLORS.surface1, borderRadius: RADIUS.lg, borderWidth: 1, borderColor: COLORS.goldBorder, padding: SPACING.md, alignItems: 'center', gap: SPACING.xs, marginBottom: SPACING.md } as ViewStyle,
  altNum: { fontFamily: FONTS.mono, fontSize: 32, color: COLORS.gold } as TextStyle,
  altCity: { fontFamily: FONTS.body, fontSize: 14, color: COLORS.creamDim } as TextStyle,
  altTrack: { width: '100%', height: 8, borderRadius: 4, backgroundColor: COLORS.surface2, marginTop: SPACING.sm, overflow: 'hidden' } as ViewStyle,
  altFill: { height: '100%', borderRadius: 4, backgroundColor: COLORS.gold } as ViewStyle,
  altMarker: { position: 'absolute', top: -2, width: 4, height: 12, borderRadius: 2, backgroundColor: COLORS.cream, marginLeft: -2 } as ViewStyle,
  altLabels: { flexDirection: 'row', justifyContent: 'space-between', width: '100%' } as ViewStyle,
  altLabelTxt: { fontFamily: FONTS.mono, fontSize: 9, color: COLORS.muted } as TextStyle,
  altTip: { fontFamily: FONTS.body, fontSize: 13, color: COLORS.creamBrightDim, textAlign: 'center', marginTop: SPACING.xs } as TextStyle,

  // Travel kit grid
  kitGrid: { flexDirection: 'row', flexWrap: 'wrap', gap: SPACING.sm, marginBottom: SPACING.md } as ViewStyle,
  kitItem: { width: '30%', backgroundColor: COLORS.surface1, borderRadius: RADIUS.lg, borderWidth: 1, borderColor: COLORS.border, padding: SPACING.sm, alignItems: 'center', gap: SPACING.xs, minHeight: 80 } as ViewStyle,
  kitItemDone: { borderColor: COLORS.sageBorder, backgroundColor: COLORS.sageVeryFaint } as ViewStyle,
  kitName: { fontFamily: FONTS.body, fontSize: 11, color: COLORS.creamDim, textAlign: 'center' } as TextStyle,
  kitNameDone: { color: COLORS.sage } as TextStyle,
  kitCheck: { position: 'absolute', top: 4, right: 4, width: 8, height: 8, borderRadius: 4, backgroundColor: COLORS.sage } as ViewStyle,

  // Health risks
  riskCard: { backgroundColor: COLORS.surface1, borderRadius: RADIUS.lg, borderWidth: 1, borderColor: COLORS.border, padding: SPACING.md, gap: SPACING.sm, marginBottom: SPACING.md } as ViewStyle,
  riskRow: { flexDirection: 'row', alignItems: 'flex-start', gap: SPACING.sm } as ViewStyle,
  riskTxt: { fontFamily: FONTS.body, fontSize: 14, color: COLORS.creamBrightDim, flex: 1, lineHeight: 20 } as TextStyle,

  // Emergency
  emergRow: { flexDirection: 'row', gap: SPACING.sm, marginBottom: SPACING.md } as ViewStyle,
  emergItem: { flex: 1, backgroundColor: COLORS.surface1, borderRadius: RADIUS.lg, borderWidth: 1, borderColor: COLORS.border, padding: SPACING.sm, alignItems: 'center', gap: 2 } as ViewStyle,
  emergNum: { fontFamily: FONTS.mono, fontSize: 24, color: COLORS.coral } as TextStyle,
  emergLabel: { fontFamily: FONTS.mono, fontSize: 9, color: COLORS.muted, letterSpacing: 0.5, textTransform: 'uppercase' } as TextStyle,

  // Symptom button
  symptomBtn: { flexDirection: 'row', alignItems: 'center', gap: SPACING.sm, backgroundColor: COLORS.surface1, borderRadius: RADIUS.lg, borderWidth: 1, borderColor: COLORS.coralBorder, padding: SPACING.md, marginTop: SPACING.md } as ViewStyle,
  symptomTxt: { fontFamily: FONTS.bodyMedium, fontSize: 15, color: COLORS.cream, flex: 1 } as TextStyle,

  // Disclaimer
  disclaimer: { fontFamily: FONTS.body, fontSize: 11, color: COLORS.muted, textAlign: 'center', marginTop: SPACING.xl } as TextStyle,

  // Empty state
  emptyWrap: { flex: 1, justifyContent: 'center', alignItems: 'center' } as ViewStyle,
  emptyTxt: { fontFamily: FONTS.body, fontSize: 16, color: COLORS.muted } as TextStyle,
});
