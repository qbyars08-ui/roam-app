// =============================================================================
// ROAM — PREP Tab: SOS & Trip Preparation
// Offline-first. Always fast. Always readable. Lifeline screen.
// =============================================================================
import React, { useCallback, useEffect, useMemo, useRef, useState } from 'react';
import {
  View,
  Text,
  ScrollView,
  Pressable,
  StyleSheet,
  Animated,
  Linking,
  TouchableOpacity,
  type ViewStyle,
  type TextStyle,
} from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { useNetInfo } from '@react-native-community/netinfo';
import Svg, { Circle } from 'react-native-svg';

const AnimatedSvgCircle = Animated.createAnimatedComponent(Circle);
import * as Haptics from '../../lib/haptics';
import {
  WifiOff,
  AlertTriangle,
  ShieldAlert,
  Shield,
  Truck,
  Flame,
  MapPin,
  ExternalLink,
  Phone,
  Volume2,
  Droplets,
  CheckCircle,
  CheckSquare,
  Banknote,
  CreditCard,
  Wifi,
  Smartphone,
  HandMetal,
  Shirt,
  Heart,
  Stethoscope,
  Pill,
  Plane,
  Luggage,
  Users,
  BedDouble,
  Coffee,
  ShieldCheck,
  ChevronRight,
  type LucideIcon,
} from 'lucide-react-native';

import { useRouter } from 'expo-router';
import { useTranslation } from 'react-i18next';
import { COLORS, FONTS, SPACING, RADIUS } from '../../lib/constants';
import { useAppStore, type Trip } from '../../lib/store';
import {
  getEmergencyForDestination,
  type EmergencyData,
} from '../../lib/prep/emergency-data';
import {
  getLanguagePackForDestination,
  type LanguagePack,
  type Phrase,
} from '../../lib/prep/language-data';
import {
  getSafetyForDestination,
  type SafetyData,
} from '../../lib/prep/safety-data';
import { getCulturalGuideForDestination } from '../../lib/prep/cultural-data';
import {
  getVisaInfo,
  destinationToCountryCode,
  type PassportNationality,
} from '../../lib/visa-intel';
import { DESTINATIONS } from '../../lib/constants';
import { parseItinerary, type Itinerary, type ItineraryDay } from '../../lib/types/itinerary';
import { withComingSoon } from '../../lib/with-coming-soon';
import { getMedicalGuideByDestination, type MedicalGuide } from '../../lib/medical-abroad';
import { getTimezoneByDestination } from '../../lib/timezone';
import { getWeatherForecast, type DailyForecast } from '../../lib/weather-forecast';
import { getExchangeRates } from '../../lib/exchange-rates';
import { getCountryCode } from '../../lib/public-holidays';
import { geocodeCity } from '../../lib/geocoding';
import AirQualitySunCard from '../../components/prep/AirQualitySunCard';
import EmergencyQuickCard from '../../components/prep/EmergencyQuickCard';
import CurrencyQuickCard from '../../components/prep/CurrencyQuickCard';
import CostOfLivingCard from '../../components/prep/CostOfLivingCard';
import DualClockWidget from '../../components/features/DualClockWidget';
import PackingList from '../../components/features/PackingList';
import HolidayCrowdCalendar from '../../components/features/HolidayCrowdCalendar';
import IAmHereNow from '../../components/prep/IAmHereNow';
import { getJetLagForDestination, type JetLagPlan } from '../../lib/jet-lag';

// ---------------------------------------------------------------------------
// Survival phrase keys (6 phrases for Language tab)
// ---------------------------------------------------------------------------
const SURVIVAL_PHRASE_KEYS = [
  'Hello',
  'Thank you',
  'Thank You',
  'Help',
  'Help!',
  'Where is',
  'Where is...?',
  'How much',
  'How much?',
  'I need a doctor',
];

function getSurvivalPhrases(pack: LanguagePack): Phrase[] {
  const result: Phrase[] = [];
  const keys = new Set(SURVIVAL_PHRASE_KEYS.map((k) => k.toLowerCase()));
  for (const phrase of pack.phrases) {
    const eng = phrase.english.toLowerCase();
    if (
      keys.has(eng) ||
      keys.has(eng.replace('!', '').replace('?', '').replace('...', '').trim())
    ) {
      if (!result.some((p) => p.english.toLowerCase() === phrase.english.toLowerCase())) {
        result.push(phrase);
      }
    }
  }
  // Fallback order: Hello, Thank You, Help, Where is, How much, I need a doctor
  const order = ['hello', 'thank you', 'help', 'where is', 'how much', 'i need a doctor'];
  result.sort((a, b) => {
    const ai = order.findIndex((o) => a.english.toLowerCase().includes(o));
    const bi = order.findIndex((o) => b.english.toLowerCase().includes(o));
    return (ai < 0 ? 99 : ai) - (bi < 0 ? 99 : bi);
  });
  return result.slice(0, 6);
}

// ---------------------------------------------------------------------------
// E-Visa apply URLs (local, no network) for common e-visa countries
// ---------------------------------------------------------------------------
const E_VISA_URLS: Record<string, string> = {
  TR: 'https://www.evisa.gov.tr',
  IN: 'https://indianvisaonline.gov.in',
  VN: 'https://evisa.xuatnhapcanh.gov.vn',
  AU: 'https://www.eta.homeaffairs.gov.au',
  NZ: 'https://www.immigration.govt.nz/nzeta',
  US: 'https://esta.cbp.dhs.gov',
};

// ---------------------------------------------------------------------------
// Offline Banner
// ---------------------------------------------------------------------------
function OfflineBanner() {
  return (
    <View style={styles.offlineBanner}>
      <WifiOff size={14} color={COLORS.bg} />
      <Text style={styles.offlineText}>Offline — all data available</Text>
    </View>
  );
}

// ---------------------------------------------------------------------------
// Editorial Intelligence Header
// ---------------------------------------------------------------------------
function EditorialHeader({
  safety,
  destination,
  countryName,
}: {
  safety: SafetyData | null;
  destination: string;
  countryName: string;
}) {
  const [localDateTime, setLocalDateTime] = useState<string | null>(null);
  const [tempC, setTempC] = useState<number | null>(null);

  useEffect(() => {
    let cancelled = false;
    const tz = getTimezoneByDestination(destination);
    if (tz) {
      try {
        const now = new Date();
        const dayName = now.toLocaleDateString('en-US', { timeZone: tz, weekday: 'long' });
        const timeStr = now.toLocaleTimeString('en-US', {
          timeZone: tz,
          hour: 'numeric',
          minute: '2-digit',
          hour12: true,
        });
        if (!cancelled) setLocalDateTime(`${dayName} ${timeStr}`);
      } catch { /* silent */ }
    }
    (async () => {
      try {
        const geo = await geocodeCity(destination);
        if (geo && !cancelled) {
          const forecast = await getWeatherForecast(geo.latitude, geo.longitude);
          if (forecast?.days?.[0] && !cancelled) {
            setTempC(Math.round(forecast.days[0].tempMax));
          }
        }
      } catch { /* silent */ }
    })();
    return () => { cancelled = true; };
  }, [destination]);

  const score = safety?.safetyScore ?? null;
  const safetyLabel = score == null ? null : score > 70 ? 'Safe for travelers' : score >= 40 ? 'Use caution' : 'High risk';

  return (
    <View style={editorialHeaderStyles.container}>
      <Text style={editorialHeaderStyles.destination}>{countryName}</Text>
      {(localDateTime || tempC != null) && (
        <Text style={editorialHeaderStyles.meta}>
          {[localDateTime, tempC != null ? `${tempC}\u00B0C` : null].filter(Boolean).join(' \u00B7 ')}
        </Text>
      )}
      {score != null && (
        <Text style={editorialHeaderStyles.safetyLine}>
          Safety {score} — {safetyLabel}
        </Text>
      )}
    </View>
  );
}

const editorialHeaderStyles = StyleSheet.create({
  container: {
    paddingHorizontal: 20,
    paddingTop: 20,
    paddingBottom: 24,
    gap: 6,
  } as ViewStyle,
  destination: {
    fontFamily: FONTS.header,
    fontSize: 32,
    color: COLORS.cream,
    fontStyle: 'italic',
    lineHeight: 38,
  } as TextStyle,
  meta: {
    fontFamily: FONTS.mono,
    fontSize: 14,
    color: COLORS.creamSoft,
    letterSpacing: 0.3,
  } as TextStyle,
  safetyLine: {
    fontFamily: FONTS.mono,
    fontSize: 12,
    color: COLORS.sage,
    letterSpacing: 0.5,
  } as TextStyle,
});

// ---------------------------------------------------------------------------
// Section Pills (labelKey = i18n key when present)
// ---------------------------------------------------------------------------
type SectionId = 'schedule' | 'overview' | 'currency' | 'connectivity' | 'culture' | 'packing' | 'jetlag' | 'crowds' | 'emergency' | 'health' | 'language' | 'visa';

const SECTIONS: Array<
  | { id: SectionId; label: string }
  | { id: SectionId; labelKey: string }
> = [
  { id: 'schedule', label: 'Schedule' },
  { id: 'overview', label: 'Overview' },
  { id: 'packing', label: 'Packing' },
  { id: 'jetlag', label: 'Jet Lag' },
  { id: 'crowds', label: 'Crowds' },
  { id: 'emergency', labelKey: 'prep.emergency' },
  { id: 'health', labelKey: 'prep.health' },
  { id: 'language', labelKey: 'prep.language' },
  { id: 'visa', labelKey: 'prep.visa' },
  { id: 'currency', label: 'Currency' },
  { id: 'connectivity', label: 'SIM & WiFi' },
  { id: 'culture', label: 'Culture' },
];

// ---------------------------------------------------------------------------
// Schedule Tab — day-by-day view from active trip itinerary
// ---------------------------------------------------------------------------
const SLOT_DEFAULTS: Record<string, string> = { morning: '9:00 AM', afternoon: '2:00 PM', evening: '6:00 PM' };

function ScheduleTab({ itinerary }: { itinerary: Itinerary | null }) {
  if (!itinerary?.days?.length) {
    return (
      <View style={styles.tabContent}>
        <Text style={styles.scheduleEmptyTitle}>No schedule yet</Text>
        <Text style={styles.noDataText}>
          Generate a trip in Plan to see your day-by-day schedule here.
        </Text>
      </View>
    );
  }

  return (
    <View style={styles.tabContent}>
      <Text style={styles.scheduleIntro}>
        {itinerary.destination} · {itinerary.days.length} days
      </Text>
      {itinerary.days.map((day: ItineraryDay) => (
        <View key={day.day} style={styles.scheduleDayCard}>
          <Text style={styles.scheduleDayLabel}>Day {day.day}</Text>
          <Text style={styles.scheduleDayTheme}>{day.theme}</Text>
          {(['morning', 'afternoon', 'evening'] as const).map((slot) => {
            const a = day[slot];
            const time = a.time ?? SLOT_DEFAULTS[slot];
            return (
              <View key={slot} style={styles.scheduleSlotRow}>
                <Text style={styles.scheduleSlotTime}>{time}</Text>
                <View style={styles.scheduleSlotContent}>
                  <Text style={styles.scheduleSlotActivity}>{a.activity}</Text>
                  <Text style={styles.scheduleSlotLocation}>{a.location}</Text>
                </View>
              </View>
            );
          })}
        </View>
      ))}
    </View>
  );
}

// ---------------------------------------------------------------------------
// Overview Tab
// ---------------------------------------------------------------------------
function OverviewTab({ safety }: { safety: SafetyData }) {
  const advisoryColor =
    safety.advisoryLevel === 1
      ? COLORS.sage
      : safety.advisoryLevel === 2
        ? COLORS.gold
        : COLORS.coral;
  const isDoNotTravel = safety.advisoryLevel === 4;

  return (
    <View style={styles.tabContent}>
      <View style={styles.overviewRow}>
        <Text style={styles.overviewLabel}>Travel Advisory</Text>
        <View style={[styles.advisoryBadge, { backgroundColor: advisoryColor + '20', borderColor: advisoryColor }]}>
          <Text
            style={[
              styles.advisoryBadgeText,
              { color: advisoryColor },
              isDoNotTravel && styles.advisoryBold,
            ]}
          >
            {safety.advisoryLabel}
          </Text>
        </View>
      </View>

      {safety.topRisks.length > 0 && (
        <View style={styles.risksWrap}>
          {safety.topRisks.slice(0, 3).map((risk, i) => (
            <View key={i} style={styles.riskRow}>
              <AlertTriangle size={14} color={COLORS.coral} />
              <Text style={styles.riskText}>{risk}</Text>
            </View>
          ))}
        </View>
      )}

      <View style={styles.metricsWrap}>
        <MetricRow
          label="Crime Index"
          value={safety.crimeIndex}
          fillColor={COLORS.coral}
          invert
        />
        <MetricRow
          label="Health Risk"
          value={safety.healthRisk}
          fillColor={COLORS.coral}
          invert
        />
        <MetricRow
          label="Political Stability"
          value={safety.politicalStability}
          fillColor={COLORS.sage}
        />
      </View>
    </View>
  );
}

function MetricRow({
  label,
  value,
  fillColor,
  invert = false,
}: {
  label: string;
  value: number;
  fillColor: string;
  invert?: boolean;
}) {
  const pct = invert ? 100 - value : value;
  return (
    <View style={styles.metricRow}>
      <Text style={styles.metricLabel}>{label}</Text>
      <View style={styles.metricBarWrap}>
        <View
          style={[
            styles.metricBarFill,
            {
              width: `${Math.min(100, Math.max(0, pct))}%`,
              backgroundColor: fillColor,
            },
          ]}
        />
      </View>
      <Text style={styles.metricPct}>{value}%</Text>
    </View>
  );
}

// ---------------------------------------------------------------------------
// SOS Button (2-second hold)
// ---------------------------------------------------------------------------
const SOS_HOLD_MS = 2000;

function SOSButton({
  onActivate,
  emergency: _emergency,
}: {
  onActivate: () => void;
  emergency: EmergencyData | null;
}) {
  const progress = useRef(new Animated.Value(0)).current;
  const pulse = useRef(new Animated.Value(1)).current;
  const hasActivated = useRef(false);
  const circ = 2 * Math.PI * 76;

  const handlePressIn = useCallback(() => {
    if (hasActivated.current) return;
    Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
    progress.setValue(0);
    Animated.timing(progress, {
      toValue: 1,
      duration: SOS_HOLD_MS,
      useNativeDriver: false,
    }).start(({ finished }) => {
      if (finished && !hasActivated.current) {
        hasActivated.current = true;
        Haptics.notificationAsync(Haptics.NotificationFeedbackType.Error);
        onActivate();
        Animated.loop(
          Animated.sequence([
            Animated.timing(pulse, {
              toValue: 0.7,
              duration: 400,
              useNativeDriver: true,
            }),
            Animated.timing(pulse, {
              toValue: 1,
              duration: 400,
              useNativeDriver: true,
            }),
          ])
        ).start();
      }
    });
  }, [onActivate, progress, pulse]);

  const handlePressOut = useCallback(() => {
    if (hasActivated.current) return;
    progress.stopAnimation();
    progress.setValue(0);
  }, [progress]);

  const strokeDashoffset = progress.interpolate({
    inputRange: [0, 1],
    outputRange: [circ, 0],
  });

  return (
    <View style={styles.sosWrap}>
      <Text style={styles.sosInstruction}>Hold 2 seconds to activate</Text>
      <Pressable
        onPressIn={handlePressIn}
        onPressOut={handlePressOut}
        style={({ pressed }) => [styles.sosButton, pressed && { opacity: 0.9 }]}
      >
        <Animated.View style={[styles.sosButtonInner, { opacity: pulse }]}>
          <ShieldAlert size={48} color={COLORS.bg} />
          <Text style={styles.sosButtonLabel}>Hold for SOS</Text>
        </Animated.View>
        <View style={styles.sosProgressRing} pointerEvents="none">
          <Svg width={160} height={160}>
            <Circle
              cx={80}
              cy={80}
              r={76}
              stroke={COLORS.overlay}
              strokeWidth={6}
              fill="transparent"
            />
            <AnimatedSvgCircle
              cx={80}
              cy={80}
              r={76}
              stroke={COLORS.cream}
              strokeWidth={6}
              fill="transparent"
              strokeDasharray={circ}
              strokeDashoffset={strokeDashoffset}
              strokeLinecap="round"
              transform="rotate(-90 80 80)"
            />
          </Svg>
        </View>
      </Pressable>
    </View>
  );
}

// ---------------------------------------------------------------------------
// Emergency Numbers Strip (always visible, coral accent)
// ---------------------------------------------------------------------------
function EmergencyNumbers({ data }: { data: EmergencyData }) {
  const openTel = useCallback((num: string) => {
    Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
    Linking.openURL(`tel:${num.replace(/\s/g, '')}`).catch(() => {});
  }, []);

  const rows: Array<{ icon: LucideIcon; label: string; number: string }> = [
    { icon: Shield, label: 'Police', number: data.police },
    { icon: Truck, label: 'Ambulance', number: data.ambulance },
    { icon: Flame, label: 'Fire', number: data.fire },
  ];

  return (
    <View style={emergencyStripStyles.container}>
      <Text style={emergencyStripStyles.label}>EMERGENCY</Text>
      <View style={emergencyStripStyles.row}>
        {rows.map((r) => (
          <TouchableOpacity
            key={r.label}
            style={emergencyStripStyles.item}
            onPress={() => openTel(r.number)}
            activeOpacity={0.7}
          >
            <r.icon size={16} color={COLORS.coral} />
            <Text style={emergencyStripStyles.itemLabel}>{r.label}</Text>
            <Text style={emergencyStripStyles.itemNumber}>{r.number}</Text>
          </TouchableOpacity>
        ))}
      </View>
    </View>
  );
}

const emergencyStripStyles = StyleSheet.create({
  container: {
    backgroundColor: COLORS.bgMagazine,
    borderLeftWidth: 3,
    borderLeftColor: COLORS.coral,
    borderRadius: 12,
    padding: 16,
    marginBottom: SPACING.lg,
  } as ViewStyle,
  label: {
    fontFamily: FONTS.mono,
    fontSize: 10,
    color: COLORS.coral,
    letterSpacing: 1.5,
    marginBottom: 12,
  } as TextStyle,
  row: {
    flexDirection: 'row',
    justifyContent: 'space-between',
  } as ViewStyle,
  item: {
    flex: 1,
    alignItems: 'center',
    gap: 4,
  } as ViewStyle,
  itemLabel: {
    fontFamily: FONTS.body,
    fontSize: 12,
    color: COLORS.creamSoft,
  } as TextStyle,
  itemNumber: {
    fontFamily: FONTS.mono,
    fontSize: 18,
    color: COLORS.cream,
  } as TextStyle,
});

// ---------------------------------------------------------------------------
// Embassy Card
// ---------------------------------------------------------------------------
function EmbassyCard({ data }: { data: EmergencyData }) {
  const openTel = useCallback(() => {
    Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
    Linking.openURL(`tel:${data.usEmbassy.phone.replace(/\s/g, '')}`).catch(() => {});
  }, [data.usEmbassy.phone]);

  const openMap = useCallback(() => {
    Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
    const query = encodeURIComponent(`US Embassy ${data.usEmbassy.city} ${data.usEmbassy.address}`);
    Linking.openURL(`https://www.google.com/maps/search/${query}`).catch(() => {});
  }, [data.usEmbassy.city, data.usEmbassy.address]);

  return (
    <View style={styles.embassyCard}>
      <Text style={styles.embassyLabel}>Nearest Embassy</Text>
      <Text style={styles.embassyName}>US Embassy — {data.usEmbassy.city}</Text>
      <TouchableOpacity style={styles.embassyAddressRow} onPress={openMap} activeOpacity={0.7}>
        <MapPin size={12} color={COLORS.sage} />
        <Text style={[styles.embassyAddress, { color: COLORS.sage }]}>{data.usEmbassy.address}</Text>
      </TouchableOpacity>
      <TouchableOpacity style={styles.embassyPhoneRow} onPress={openTel} activeOpacity={0.7}>
        <Text style={styles.embassyPhone}>{data.usEmbassy.phone}</Text>
        <Phone size={14} color={COLORS.sage} />
      </TouchableOpacity>
    </View>
  );
}

// ---------------------------------------------------------------------------
// Health Tab — redesigned for clarity
// ---------------------------------------------------------------------------
function HealthTab({
  safety,
  tapWaterFromCultural,
  medicalGuide,
  destination,
}: {
  safety: SafetyData;
  tapWaterFromCultural: boolean | null;
  medicalGuide: MedicalGuide | null;
  destination: string;
}) {
  const router = useRouter();
  const tapSafe = safety.tapWaterSafe ?? tapWaterFromCultural ?? medicalGuide?.tapWaterSafe ?? false;

  const hospitalColor =
    medicalGuide?.hospitalQuality === 'excellent' ? COLORS.sage
    : medicalGuide?.hospitalQuality === 'good' ? COLORS.sage
    : medicalGuide?.hospitalQuality === 'mixed' ? COLORS.gold
    : COLORS.coral;

  const insuranceColor =
    medicalGuide?.insurancePriority === 'critical' ? COLORS.coral
    : medicalGuide?.insurancePriority === 'recommended' ? COLORS.gold
    : COLORS.sage;

  const requiredVaccines = safety.vaccinations.filter((v) => v.required);
  const recommendedVaccines = safety.vaccinations.filter((v) => !v.required);
  const healthRisks = medicalGuide?.healthRisks ?? safety.commonHealthRisks;

  return (
    <View style={styles.tabContent}>
      {/* ── 1. The Big Three: Water · Insurance · Hospital ── */}
      <View style={styles.healthQuickGlance}>
        {/* Tap Water — biggest, most asked question */}
        <View style={[styles.healthQuickCard, {
          backgroundColor: COLORS.bgMagazine,
          borderLeftColor: tapSafe ? COLORS.sage : COLORS.coral,
        }]}>
          <Droplets size={28} color={tapSafe ? COLORS.sage : COLORS.coral} />
          <Text style={[styles.healthQuickValue, { color: tapSafe ? COLORS.sage : COLORS.coral }]}>
            {tapSafe ? 'Tap water safe' : 'Don\'t drink tap water'}
          </Text>
          {medicalGuide?.waterNote ? (
            <Text style={styles.healthQuickNote}>{medicalGuide.waterNote}</Text>
          ) : !tapSafe ? (
            <Text style={styles.healthQuickNote}>Stick to bottled or filtered water</Text>
          ) : null}
        </View>

        {/* Two-column: Insurance + Hospitals */}
        <View style={styles.healthQuickRow}>
          <View style={[styles.healthQuickCardSmall, {
            backgroundColor: COLORS.bgMagazine,
            borderLeftColor: insuranceColor,
          }]}>
            <AlertTriangle size={20} color={insuranceColor} />
            <Text style={[styles.healthQuickSmallLabel, { color: insuranceColor }]}>
              Insurance
            </Text>
            <Text style={[styles.healthQuickSmallValue, { color: insuranceColor }]}>
              {medicalGuide?.insurancePriority === 'critical' ? 'Critical'
                : medicalGuide?.insurancePriority === 'recommended' ? 'Get it'
                : medicalGuide ? 'Nice to have' : 'Recommended'}
            </Text>
          </View>

          {medicalGuide ? (
            <View style={[styles.healthQuickCardSmall, {
              backgroundColor: COLORS.bgMagazine,
              borderLeftColor: hospitalColor,
            }]}>
              <Stethoscope size={20} color={hospitalColor} />
              <Text style={[styles.healthQuickSmallLabel, { color: hospitalColor }]}>
                Hospitals
              </Text>
              <Text style={[styles.healthQuickSmallValue, { color: hospitalColor }]}>
                {medicalGuide.hospitalQuality.charAt(0).toUpperCase() + medicalGuide.hospitalQuality.slice(1)}
              </Text>
            </View>
          ) : (
            <View style={[styles.healthQuickCardSmall, {
              backgroundColor: COLORS.bgMagazine,
              borderLeftWidth: 3,
              borderLeftColor: COLORS.sage,
            }]}>
              <Stethoscope size={20} color={COLORS.creamMuted} />
              <Text style={styles.healthQuickSmallLabel}>Hospitals</Text>
              <Text style={[styles.healthQuickSmallValue, { color: COLORS.creamMuted }]}>
                Research locally
              </Text>
            </View>
          )}
        </View>
      </View>

      {/* ── 2. Medical Details (if available) ── */}
      {medicalGuide && (
        <View style={styles.healthSection}>
          <Text style={styles.healthSectionTitle}>Medical Details</Text>

          {/* Pharmacy */}
          <View style={styles.healthDetailRow}>
            <Pill size={16} color={medicalGuide.pharmacyOTC ? COLORS.sage : COLORS.gold} />
            <View style={styles.healthDetailContent}>
              <Text style={styles.healthDetailLabel}>
                Pharmacy: {medicalGuide.pharmacyOTC ? 'OTC meds available' : 'Prescription required'}
              </Text>
              <Text style={styles.healthDetailNote}>{medicalGuide.pharmacyNote}</Text>
            </View>
          </View>

          {/* ER Cost */}
          {medicalGuide.erCostRange && (
            <View style={styles.healthDetailRow}>
              <Heart size={16} color={COLORS.coral} />
              <View style={styles.healthDetailContent}>
                <Text style={styles.healthDetailLabel}>ER visit (no insurance)</Text>
                <Text style={[styles.healthDetailNote, { color: COLORS.coral }]}>
                  {medicalGuide.erCostRange}
                </Text>
              </View>
            </View>
          )}

          {/* Insurance note */}
          {medicalGuide.insuranceNote && (
            <View style={styles.healthDetailRow}>
              <AlertTriangle size={16} color={insuranceColor} />
              <View style={styles.healthDetailContent}>
                <Text style={styles.healthDetailNote}>{medicalGuide.insuranceNote}</Text>
              </View>
            </View>
          )}

          {/* Hospital note */}
          {medicalGuide.hospitalNote && (
            <View style={styles.healthDetailRow}>
              <Stethoscope size={16} color={hospitalColor} />
              <View style={styles.healthDetailContent}>
                <Text style={styles.healthDetailNote}>{medicalGuide.hospitalNote}</Text>
              </View>
            </View>
          )}
        </View>
      )}

      {/* ── 3. If You Get Sick ── */}
      {medicalGuide && medicalGuide.whereToGo.length > 0 && (
        <View style={styles.healthSection}>
          <Text style={styles.healthSectionTitle}>If You Get Sick</Text>
          {medicalGuide.whereToGo.map((item, i) => (
            <View key={i} style={styles.whereToGoRow}>
              <Text style={styles.whereToGoCondition}>{item.condition}</Text>
              <Text style={styles.whereToGoGo}>→ {item.go}</Text>
            </View>
          ))}
        </View>
      )}

      {/* ── 4. Vaccinations ── */}
      <View style={styles.healthSection}>
        <Text style={styles.healthSectionTitle}>Vaccinations</Text>

        {requiredVaccines.length > 0 ? (
          <>
            <Text style={styles.healthSubLabel}>REQUIRED</Text>
            {requiredVaccines.map((v, i) => (
              <View key={i} style={styles.vaccineRow}>
                <AlertTriangle size={14} color={COLORS.coral} />
                <Text style={[styles.vaccineName, { color: COLORS.coral }]}>{v.name}</Text>
              </View>
            ))}
          </>
        ) : (
          <View style={styles.healthGoodNews}>
            <CheckCircle size={16} color={COLORS.sage} />
            <Text style={styles.healthGoodNewsText}>No required vaccinations</Text>
          </View>
        )}

        {recommendedVaccines.length > 0 && (
          <>
            <Text style={[styles.healthSubLabel, { marginTop: SPACING.md }]}>RECOMMENDED</Text>
            {recommendedVaccines.map((v, i) => (
              <View key={i} style={styles.vaccineRow}>
                <CheckCircle size={14} color={COLORS.sage} />
                <Text style={styles.vaccineName}>{v.name}</Text>
              </View>
            ))}
          </>
        )}
      </View>

      {/* ── 5. Health Risks ── */}
      {healthRisks.length > 0 && (
        <View style={styles.healthSection}>
          <Text style={styles.healthSectionTitle}>Watch Out For</Text>
          {healthRisks.map((risk, i) => (
            <View key={i} style={styles.healthRiskRow}>
              <View style={styles.healthRiskDot} />
              <Text style={styles.healthRiskText}>{risk}</Text>
            </View>
          ))}
        </View>
      )}

      {/* ── 6. Body Intel CTA ── */}
      <Pressable
        onPress={() => {
          Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Medium);
          router.push({ pathname: '/body-intel', params: { destination } } as never);
        }}
        style={({ pressed }) => [
          styles.bodyIntelCta,
          pressed && { opacity: 0.7 },
        ]}
      >
        <ShieldCheck size={20} color={COLORS.sage} />
        <View style={{ flex: 1 }}>
          <Text style={styles.bodyIntelCtaTitle}>Body Intel</Text>
          <Text style={styles.bodyIntelCtaSubtitle}>
            Symptom checker, emergency phrases & local medication
          </Text>
        </View>
        <ChevronRight size={18} color={COLORS.creamMuted} />
      </Pressable>
    </View>
  );
}

// ---------------------------------------------------------------------------
// Language Tab (6 survival phrases)
// ---------------------------------------------------------------------------
function LanguageTab({ pack }: { pack: LanguagePack }) {
  const phrases = useMemo(() => getSurvivalPhrases(pack), [pack]);

  const handlePlay = useCallback((_phrase: Phrase) => {
    Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
    // Stub: no audio implementation
  }, []);

  return (
    <View style={styles.tabContent}>
      <Text style={styles.languageTitle}>Survival Phrases</Text>
      <Text style={styles.languageSubtitle}>
        {pack.language}
        {pack.flag ? ` \u2022 ${pack.flag}` : ''}
      </Text>
      {phrases.map((phrase, i) => (
        <View key={i} style={styles.phraseCard}>
          <View style={styles.phraseCardBody}>
            <Text style={styles.phraseCardEnglish}>{phrase.english}</Text>
            <Text style={styles.phraseCardLocal}>{phrase.local}</Text>
            <Text style={styles.phraseCardPhonetic}>{phrase.phonetic}</Text>
          </View>
          <TouchableOpacity
            style={styles.phrasePlayBtn}
            onPress={() => handlePlay(phrase)}
            activeOpacity={0.7}
          >
            <Volume2 size={18} color={COLORS.creamMuted} />
          </TouchableOpacity>
        </View>
      ))}
    </View>
  );
}

// ---------------------------------------------------------------------------
// Visa Tab
// ---------------------------------------------------------------------------
function VisaTab({
  destination,
  passport,
}: {
  destination: string;
  passport: PassportNationality;
}) {
  const visa = getVisaInfo(destination, passport);
  const countryCode = destinationToCountryCode(destination);
  const applyUrl = countryCode ? E_VISA_URLS[countryCode] : null;

  if (!visa) {
    return (
      <View style={styles.tabContent}>
        <Text style={styles.noDataText}>Visa data not available for this destination.</Text>
        <Text style={styles.visaReminder}>
          Check before you book. Contact your embassy for requirements.
        </Text>
      </View>
    );
  }

  const { info } = visa;
  const isNotRequired = info.status === 'visa_free';
  const isOnArrival = info.status === 'visa_on_arrival';
  const isRequired = info.status === 'e_visa' || info.status === 'eta' || info.status === 'visa_required';

  const heroBg =
    isNotRequired
      ? COLORS.sage
      : isOnArrival
        ? COLORS.sage
        : COLORS.coral;

  return (
    <View style={styles.tabContent}>
      <Text style={styles.visaReminder}>Check before you book</Text>
      <View
        style={[
          styles.visaHeroCard,
          { borderLeftColor: heroBg },
        ]}
      >
        <Text
          style={[
            styles.visaHeroText,
            { color: heroBg },
            isRequired && info.status === 'visa_required' && styles.visaHeroBold,
          ]}
        >
          {isNotRequired
            ? 'Visa Not Required'
            : isOnArrival
              ? 'Visa on Arrival'
              : 'Visa Required'}
        </Text>
      </View>

      {info.stayDays != null && info.stayDays < 999 && (
        <Text style={styles.visaDetail}>Stay up to {info.stayDays} days</Text>
      )}
      {info.notes && (
        <Text style={styles.visaMeta}>{info.notes}</Text>
      )}
      {info.cost != null && (
        <Text style={styles.visaMeta}>Application fee: ${info.cost}</Text>
      )}

      {isRequired && applyUrl && (
        <TouchableOpacity
          style={styles.applyOnlineBtn}
          onPress={() => {
            Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
            Linking.openURL(applyUrl).catch(() => {});
          }}
          activeOpacity={0.7}
        >
          <ExternalLink size={14} color={COLORS.sage} />
          <Text style={styles.applyOnlineText}>Apply Online</Text>
        </TouchableOpacity>
      )}

      <Text style={styles.visaChecklistLabel}>Requirements</Text>
      {['Valid passport (6+ months)', 'Return ticket', 'Proof of accommodation'].map((item, i) => (
        <View key={i} style={styles.visaChecklistRow}>
          <CheckSquare size={16} color={COLORS.sage} />
          <Text style={styles.visaChecklistText}>{item}</Text>
        </View>
      ))}
    </View>
  );
}

// ---------------------------------------------------------------------------
// Currency Tab
// ---------------------------------------------------------------------------
function CurrencyTab({
  cultural,
  destination,
}: {
  cultural: ReturnType<typeof getCulturalGuideForDestination>;
  destination: string;
}) {
  if (!cultural) {
    return (
      <View style={styles.tabContent}>
        <Text style={styles.noDataText}>Currency info not available for {destination}.</Text>
      </View>
    );
  }

  const { currency, tipping } = cultural;

  return (
    <View style={styles.tabContent}>
      <View style={styles.currencyHero}>
        <Text style={styles.currencySymbol}>{currency.symbol}</Text>
        <Text style={styles.currencyCode}>{currency.code}</Text>
      </View>

      <View style={styles.infoCard}>
        <View style={styles.infoCardRow}>
          <Banknote size={16} color={COLORS.sage} />
          <Text style={styles.infoCardLabel}>Local Tip</Text>
        </View>
        <Text style={styles.infoCardBody}>{currency.tip}</Text>
      </View>

      <View style={styles.infoCard}>
        <View style={styles.infoCardRow}>
          <CreditCard size={16} color={COLORS.gold} />
          <Text style={styles.infoCardLabel}>Tipping Culture</Text>
        </View>
        <Text style={styles.infoCardBody}>{tipping}</Text>
      </View>

      <Text style={styles.currencySectionLabel}>Payment Tips</Text>
      {[
        'Notify your bank before traveling to avoid card blocks',
        'Carry small bills for street vendors and taxis',
        'Compare exchange rates — airport rates are typically worst',
        'Use no-foreign-fee cards when possible',
      ].map((tip, i) => (
        <View key={i} style={styles.currencyTipRow}>
          <View style={styles.currencyTipDot} />
          <Text style={styles.currencyTipText}>{tip}</Text>
        </View>
      ))}
    </View>
  );
}

// ---------------------------------------------------------------------------
// Connectivity Tab (SIM & WiFi)
// ---------------------------------------------------------------------------
function ConnectivityTab({
  cultural,
  destination,
}: {
  cultural: ReturnType<typeof getCulturalGuideForDestination>;
  destination: string;
}) {
  if (!cultural) {
    return (
      <View style={styles.tabContent}>
        <Text style={styles.noDataText}>Connectivity info not available for {destination}.</Text>
      </View>
    );
  }

  const { simCard, plugType } = cultural;

  return (
    <View style={styles.tabContent}>
      <View style={styles.infoCard}>
        <View style={styles.infoCardRow}>
          <Smartphone size={16} color={COLORS.sage} />
          <Text style={styles.infoCardLabel}>Local SIM</Text>
        </View>
        <Text style={styles.connProviderName}>{simCard.provider}</Text>
        <Text style={styles.infoCardBody}>{simCard.cost}</Text>
        <Text style={styles.connWhere}>{simCard.where}</Text>
      </View>

      <Text style={styles.currencySectionLabel}>eSIM Options</Text>
      {[
        { name: 'Airalo', note: 'Global coverage, pay per GB', url: 'https://www.airalo.com/' },
        { name: 'Holafly', note: 'Unlimited data, fixed-day plans', url: 'https://www.holafly.com/' },
        { name: 'Nomad', note: 'Budget-friendly regional plans', url: 'https://www.getnomad.app/' },
      ].map((esim, i) => (
        <TouchableOpacity
          key={i}
          style={styles.esimRow}
          activeOpacity={0.7}
          onPress={() => {
            Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
            Linking.openURL(esim.url).catch(() => {});
          }}
        >
          <View style={{ flex: 1 }}>
            <Text style={styles.esimName}>{esim.name}</Text>
            <Text style={styles.esimNote}>{esim.note}</Text>
          </View>
          <ExternalLink size={14} color={COLORS.creamMuted} />
        </TouchableOpacity>
      ))}

      <View style={[styles.infoCard, { marginTop: SPACING.lg }]}>
        <View style={styles.infoCardRow}>
          <Wifi size={16} color={COLORS.gold} />
          <Text style={styles.infoCardLabel}>WiFi & Power</Text>
        </View>
        <Text style={styles.infoCardBody}>Plug type: {plugType}</Text>
        <Text style={styles.connTip}>
          Cafes and co-working spaces usually have free WiFi. Download offline maps before you go.
        </Text>
      </View>
    </View>
  );
}

// ---------------------------------------------------------------------------
// Culture Tab
// ---------------------------------------------------------------------------
function CultureTab({
  cultural,
  destination,
}: {
  cultural: ReturnType<typeof getCulturalGuideForDestination>;
  destination: string;
}) {
  if (!cultural) {
    return (
      <View style={styles.tabContent}>
        <Text style={styles.noDataText}>Cultural guide not available for {destination}.</Text>
      </View>
    );
  }

  const { etiquette, commonScams, dressCodes, flag, country } = cultural;

  return (
    <View style={styles.tabContent}>
      <Text style={styles.cultureTitle}>{flag} {country}</Text>

      <Text style={styles.currencySectionLabel}>Etiquette</Text>
      {etiquette.slice(0, 4).map((rule, i) => (
        <View key={i} style={styles.etiquetteCard}>
          <View style={styles.etiquetteRow}>
            <CheckCircle size={14} color={COLORS.sage} />
            <Text style={styles.etiquetteDo}>{rule.do}</Text>
          </View>
          <View style={styles.etiquetteRow}>
            <AlertTriangle size={14} color={COLORS.coral} />
            <Text style={styles.etiquetteDont}>{rule.dont}</Text>
          </View>
        </View>
      ))}

      {dressCodes.length > 0 && (
        <>
          <View style={[styles.infoCardRow, { marginTop: SPACING.lg, marginBottom: SPACING.sm }]}>
            <Shirt size={16} color={COLORS.gold} />
            <Text style={styles.infoCardLabel}>Dress Code</Text>
          </View>
          {dressCodes.map((code, i) => (
            <View key={i} style={styles.currencyTipRow}>
              <View style={styles.currencyTipDot} />
              <Text style={styles.currencyTipText}>{code}</Text>
            </View>
          ))}
        </>
      )}

      {commonScams.length > 0 && (
        <>
          <View style={[styles.infoCardRow, { marginTop: SPACING.lg, marginBottom: SPACING.sm }]}>
            <HandMetal size={16} color={COLORS.coral} />
            <Text style={styles.infoCardLabel}>Common Scams</Text>
          </View>
          {commonScams.map((scam, i) => (
            <View key={i} style={styles.scamRow}>
              <AlertTriangle size={12} color={COLORS.coral} />
              <Text style={styles.scamText}>{scam}</Text>
            </View>
          ))}
        </>
      )}
    </View>
  );
}

// ---------------------------------------------------------------------------
// Trip Countdown Hero
// ---------------------------------------------------------------------------
function TripCountdownHero({
  trip,
  destination,
}: {
  trip: Trip | null;
  destination: string;
}) {
  if (!trip) return null;

  const tripDuration = trip.days ?? 0;

  return (
    <View style={countdownStyles.container}>
      <View style={countdownStyles.row}>
        <View style={countdownStyles.numberWrap}>
          <Text style={countdownStyles.number}>{tripDuration}</Text>
          <Text style={countdownStyles.unit}>days</Text>
        </View>
        <View style={countdownStyles.details}>
          <Text style={countdownStyles.heading}>{destination}</Text>
          <Text style={countdownStyles.dates}>
            {trip.budget} budget · {trip.vibes.slice(0, 2).join(', ')}
          </Text>
          <Text style={countdownStyles.duration}>
            {trip.isMockData ? 'Sample trip' : 'Your trip'}
          </Text>
        </View>
        <Plane size={24} color={COLORS.sage} strokeWidth={2} />
      </View>
    </View>
  );
}

const countdownStyles = StyleSheet.create({
  container: {
    backgroundColor: COLORS.bgMagazine,
    borderRadius: RADIUS.xl,
    borderLeftWidth: 3,
    borderLeftColor: COLORS.sage,
    padding: 20,
    marginBottom: SPACING.lg,
  } as ViewStyle,
  row: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: SPACING.md,
  } as ViewStyle,
  numberWrap: {
    alignItems: 'center',
  } as ViewStyle,
  number: {
    fontFamily: FONTS.header,
    fontSize: 48,
    color: COLORS.sage,
    lineHeight: 52,
  } as TextStyle,
  unit: {
    fontFamily: FONTS.mono,
    fontSize: 11,
    color: COLORS.sage,
    textTransform: 'uppercase',
    letterSpacing: 2,
    marginTop: -4,
  } as TextStyle,
  details: {
    flex: 1,
    gap: 4,
  } as ViewStyle,
  heading: {
    fontFamily: FONTS.header,
    fontSize: 22,
    color: COLORS.cream,
  } as TextStyle,
  dates: {
    fontFamily: FONTS.mono,
    fontSize: 12,
    color: COLORS.creamMuted,
  } as TextStyle,
  duration: {
    fontFamily: FONTS.body,
    fontSize: 12,
    color: COLORS.creamMuted,
  } as TextStyle,
});

// ---------------------------------------------------------------------------
// Jet Lag Tab
// ---------------------------------------------------------------------------
function JetLagTab({ destination }: { destination: string }) {
  const jetLag = useMemo(() => getJetLagForDestination(destination), [destination]);

  if (!jetLag || jetLag.severity === 'none') {
    return (
      <View style={styles.tabContent}>
        <View style={jetLagStyles.noLag}>
          <Coffee size={24} color={COLORS.sage} />
          <Text style={jetLagStyles.noLagTitle}>No jet lag expected</Text>
          <Text style={styles.noDataText}>
            {destination} is in a similar timezone — no adjustment needed.
          </Text>
        </View>
      </View>
    );
  }

  const severityColor =
    jetLag.severity === 'severe' ? COLORS.coral
    : jetLag.severity === 'moderate' ? COLORS.gold
    : COLORS.sage;

  return (
    <View style={styles.tabContent}>
      {/* Severity hero */}
      <View style={[jetLagStyles.heroCard, { borderColor: severityColor + '30' }]}>
        <View style={jetLagStyles.heroRow}>
          <View>
            <Text style={[jetLagStyles.heroHours, { color: severityColor }]}>
              {jetLag.hoursDifference}h {jetLag.direction}
            </Text>
            <Text style={jetLagStyles.heroSeverity}>
              {jetLag.severity.charAt(0).toUpperCase() + jetLag.severity.slice(1)} jet lag
            </Text>
          </View>
          <View style={jetLagStyles.recoveryBadge}>
            <BedDouble size={16} color={COLORS.cream} />
            <Text style={jetLagStyles.recoveryText}>
              ~{jetLag.recoveryDays} day{jetLag.recoveryDays !== 1 ? 's' : ''} to adjust
            </Text>
          </View>
        </View>
      </View>

      {/* Dual clocks */}
      <View style={{ marginBottom: SPACING.lg }}>
        <DualClockWidget destination={destination} />
      </View>

      {/* Pre-flight advice */}
      <Text style={styles.healthSectionLabel}>Before Your Flight</Text>
      <View style={jetLagStyles.adviceCard}>
        <Plane size={16} color={COLORS.sage} />
        <Text style={jetLagStyles.adviceText}>{jetLag.preFlightAdvice}</Text>
      </View>

      {/* Arrival strategy */}
      <Text style={[styles.healthSectionLabel, { marginTop: SPACING.md }]}>On Arrival</Text>
      <View style={jetLagStyles.adviceCard}>
        <MapPin size={16} color={COLORS.gold} />
        <Text style={jetLagStyles.adviceText}>{jetLag.arrivalStrategy}</Text>
      </View>

      {/* Melatonin window */}
      {jetLag.melatoninWindow && (
        <>
          <Text style={[styles.healthSectionLabel, { marginTop: SPACING.md }]}>Melatonin</Text>
          <View style={jetLagStyles.adviceCard}>
            <Pill size={16} color={COLORS.coral} />
            <Text style={jetLagStyles.adviceText}>{jetLag.melatoninWindow}</Text>
          </View>
        </>
      )}

      {/* Tips */}
      <Text style={[styles.healthSectionLabel, { marginTop: SPACING.md }]}>Adjustment Tips</Text>
      {jetLag.tips.map((tip, i) => (
        <View key={i} style={jetLagStyles.tipRow}>
          <View style={[jetLagStyles.tipDot, { backgroundColor: severityColor }]} />
          <Text style={jetLagStyles.tipText}>{tip}</Text>
        </View>
      ))}
    </View>
  );
}

const jetLagStyles = StyleSheet.create({
  heroCard: {
    backgroundColor: COLORS.bgMagazine,
    borderRadius: RADIUS.xl,
    borderLeftWidth: 3,
    padding: SPACING.lg,
    marginBottom: SPACING.lg,
  } as ViewStyle,
  heroRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
  } as ViewStyle,
  heroHours: {
    fontFamily: FONTS.header,
    fontSize: 28,
  } as TextStyle,
  heroSeverity: {
    fontFamily: FONTS.body,
    fontSize: 14,
    color: COLORS.creamMuted,
    marginTop: 2,
  } as TextStyle,
  recoveryBadge: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
    paddingHorizontal: SPACING.md,
    paddingVertical: SPACING.sm,
  } as ViewStyle,
  recoveryText: {
    fontFamily: FONTS.mono,
    fontSize: 12,
    color: COLORS.cream,
  } as TextStyle,
  adviceCard: {
    flexDirection: 'row',
    alignItems: 'flex-start',
    gap: SPACING.sm,
    backgroundColor: COLORS.bgMagazine,
    borderRadius: RADIUS.md,
    borderLeftWidth: 3,
    borderLeftColor: COLORS.sage,
    padding: 16,
    marginBottom: SPACING.sm,
  } as ViewStyle,
  adviceText: {
    fontFamily: FONTS.body,
    fontSize: 13,
    color: COLORS.cream,
    flex: 1,
    lineHeight: 19,
  } as TextStyle,
  tipRow: {
    flexDirection: 'row',
    alignItems: 'flex-start',
    gap: SPACING.sm,
    marginBottom: SPACING.sm,
  } as ViewStyle,
  tipDot: {
    width: 6,
    height: 6,
    borderRadius: 3,
    marginTop: 6,
  } as ViewStyle,
  tipText: {
    fontFamily: FONTS.body,
    fontSize: 13,
    color: COLORS.cream,
    flex: 1,
    lineHeight: 19,
  } as TextStyle,
  noLag: {
    alignItems: 'center',
    paddingVertical: SPACING.xl,
    gap: SPACING.sm,
  } as ViewStyle,
  noLagTitle: {
    fontFamily: FONTS.header,
    fontSize: 20,
    color: COLORS.cream,
  } as TextStyle,
});

// ---------------------------------------------------------------------------
// Packing Tab
// ---------------------------------------------------------------------------
function PackingTab({
  destination,
  trip,
  itinerary,
}: {
  destination: string;
  trip: Trip | null;
  itinerary: Itinerary | null;
}) {
  const essentials = useMemo(() => {
    // Use AI-generated packing essentials from itinerary first
    if (itinerary?.packingEssentials?.length) {
      return itinerary.packingEssentials;
    }
    // Fallback: extract "bring" tips from day activities
    const items: string[] = [];
    if (itinerary?.days) {
      for (const day of itinerary.days) {
        for (const slot of ['morning', 'afternoon', 'evening'] as const) {
          const tip = day[slot]?.tip;
          if (tip && tip.toLowerCase().includes('bring')) {
            items.push(tip);
          }
        }
      }
    }
    return items.slice(0, 5);
  }, [itinerary]);

  return (
    <View style={styles.tabContent}>
      <PackingList
        essentials={essentials}
        destination={destination}
        tripId={trip?.id}
      />
    </View>
  );
}

// ---------------------------------------------------------------------------
// Crowds Tab
// ---------------------------------------------------------------------------
function CrowdsTab({
  destination,
  trip,
}: {
  destination: string;
  trip: Trip | null;
}) {
  const { startDate, endDate } = useMemo(() => {
    const now = new Date();
    const start = now.toISOString().split('T')[0];
    const days = trip?.days ?? 7;
    const end = new Date(now.getTime() + days * 24 * 60 * 60 * 1000).toISOString().split('T')[0];
    return { startDate: start, endDate: end };
  }, [trip?.days]);

  return (
    <View style={styles.tabContent}>
      <View style={crowdsStyles.header}>
        <Users size={20} color={COLORS.sage} />
        <Text style={crowdsStyles.title}>Crowd Forecast</Text>
      </View>
      <Text style={crowdsStyles.subtitle}>
        How busy {destination} will be during your trip
      </Text>
      <HolidayCrowdCalendar
        destination={destination}
        startDate={startDate}
        endDate={endDate}
      />
    </View>
  );
}

const crowdsStyles = StyleSheet.create({
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: SPACING.sm,
    marginBottom: 4,
  } as ViewStyle,
  title: {
    fontFamily: FONTS.header,
    fontSize: 22,
    color: COLORS.cream,
  } as TextStyle,
  subtitle: {
    fontFamily: FONTS.body,
    fontSize: 13,
    color: COLORS.creamMuted,
    marginBottom: SPACING.lg,
  } as TextStyle,
});

// ---------------------------------------------------------------------------
// No-Data State
// ---------------------------------------------------------------------------
function NoDataState({ destination }: { destination: string }) {
  return (
    <View style={styles.noDataWrap}>
      <Text style={styles.noDataTitle}>Data not available for this destination</Text>
      <Text style={styles.noDataText}>
        We're still building intel for {destination}. Emergency numbers may be available for the country — try selecting a nearby city.
      </Text>
    </View>
  );
}

// ---------------------------------------------------------------------------
// Intelligence Cards Grid (2x2 magazine-style)
// ---------------------------------------------------------------------------
function IntelligenceCardsGrid({
  destination,
  safety,
}: {
  destination: string;
  safety: SafetyData | null;
}) {
  const [weather, setWeather] = useState<DailyForecast | null>(null);
  const [exchangeRate, setExchangeRate] = useState<string | null>(null);
  const [currencyCode, setCurrencyCode] = useState<string | null>(null);
  const [currencyTip, setCurrencyTip] = useState<string | null>(null);

  useEffect(() => {
    let cancelled = false;

    (async () => {
      try {
        const geo = await geocodeCity(destination);
        if (geo && !cancelled) {
          const forecast = await getWeatherForecast(geo.latitude, geo.longitude);
          if (forecast?.days?.[0] && !cancelled) {
            setWeather(forecast.days[0]);
          }
        }
      } catch { /* silent */ }
    })();

    (async () => {
      try {
        const countryCode = getCountryCode(destination);
        if (!countryCode) return;
        const COUNTRY_CURRENCY: Record<string, string> = {
          JP: 'JPY', FR: 'EUR', ID: 'IDR', TH: 'THB', US: 'USD',
          ES: 'EUR', IT: 'EUR', GB: 'GBP', MA: 'MAD', PT: 'EUR',
          KR: 'KRW', HU: 'HUF', TR: 'TRY', MX: 'MXN', NL: 'EUR',
          AE: 'AED', ZA: 'ZAR', AU: 'AUD', AR: 'ARS', GE: 'GEL',
          VN: 'VND', HR: 'EUR', CO: 'COP', IN: 'INR', NZ: 'NZD',
          IS: 'ISK',
        };
        const curr = COUNTRY_CURRENCY[countryCode];
        if (!curr || curr === 'USD') return;
        if (!cancelled) setCurrencyCode(curr);
        const rates = await getExchangeRates('USD');
        if (rates?.rates?.[curr] && !cancelled) {
          const rate = rates.rates[curr];
          const formatted = rate >= 100 ? Math.round(rate).toLocaleString() : rate.toFixed(2);
          setExchangeRate(formatted);
          setCurrencyTip(`1 USD = ${formatted} ${curr}`);
        }
      } catch { /* silent */ }
    })();

    return () => { cancelled = true; };
  }, [destination]);

  const score = safety?.safetyScore ?? null;
  const safetyColor = score == null ? COLORS.creamMuted : score > 70 ? COLORS.sage : score >= 40 ? COLORS.gold : COLORS.coral;
  const safetyDesc = score == null ? '—' : score > 70 ? 'Safe for travelers' : score >= 40 ? 'Use caution' : 'High risk area';

  const visa = getVisaInfo(destination, 'US');
  const visaStatus = visa?.info?.status ?? null;
  const visaLabel = visaStatus === 'visa_free' ? 'No visa required'
    : visaStatus === 'visa_on_arrival' ? 'Visa on arrival'
    : visaStatus === 'e_visa' ? 'e-Visa required'
    : visaStatus === 'eta' ? 'ETA required'
    : visaStatus === 'visa_required' ? 'Visa required'
    : null;
  const visaColor = visaStatus === 'visa_free' ? COLORS.sage
    : visaStatus === 'visa_on_arrival' ? COLORS.sage
    : COLORS.coral;

  return (
    <View style={intelGridStyles.container}>
      <View style={intelGridStyles.row}>
        {/* Safety card */}
        <View style={intelGridStyles.card}>
          <Text style={[intelGridStyles.bigNumber, { color: safetyColor }]}>
            {score ?? '—'}
          </Text>
          <Text style={intelGridStyles.cardDesc}>{safetyDesc}</Text>
          <Text style={intelGridStyles.cardLabel}>SAFETY SCORE</Text>
        </View>

        {/* Currency card */}
        <View style={intelGridStyles.card}>
          <Text style={[intelGridStyles.bigRate, { color: COLORS.cream }]}>
            {exchangeRate ?? '—'}
          </Text>
          <Text style={intelGridStyles.cardDesc}>
            {currencyTip ?? (currencyCode ? `1 USD = ${currencyCode}` : 'Exchange rate')}
          </Text>
          <Text style={intelGridStyles.cardLabel}>CURRENCY</Text>
        </View>
      </View>

      <View style={intelGridStyles.row}>
        {/* Weather card */}
        <View style={intelGridStyles.card}>
          {weather ? (
            <>
              <Text style={[intelGridStyles.bigNumber, { color: COLORS.cream }]}>
                {Math.round(weather.tempMax)}&deg;
              </Text>
              <Text style={intelGridStyles.cardDesc}>{weather.weatherLabel}</Text>
              {weather.precipitationChance > 0 && (
                <Text style={[intelGridStyles.cardDesc, { color: COLORS.creamMuted }]}>
                  {weather.precipitationChance}% rain
                </Text>
              )}
            </>
          ) : (
            <Text style={[intelGridStyles.bigNumber, { color: COLORS.creamMuted }]}>—</Text>
          )}
          <Text style={intelGridStyles.cardLabel}>WEATHER</Text>
        </View>

        {/* Visa card */}
        <View style={intelGridStyles.card}>
          {visaLabel ? (
            <>
              <Text style={[intelGridStyles.visaStatus, { color: visaColor }]}>
                {visaLabel}
              </Text>
              {visa?.info?.stayDays != null && visa.info.stayDays < 999 && (
                <Text style={intelGridStyles.cardDesc}>Up to {visa.info.stayDays} days</Text>
              )}
            </>
          ) : (
            <Text style={[intelGridStyles.cardDesc, { color: COLORS.creamMuted }]}>Check requirements</Text>
          )}
          <Text style={intelGridStyles.cardLabel}>VISA</Text>
        </View>
      </View>
    </View>
  );
}

const intelGridStyles = StyleSheet.create({
  container: {
    paddingHorizontal: 20,
    gap: 12,
    marginBottom: 40,
  } as ViewStyle,
  row: {
    flexDirection: 'row',
    gap: 12,
  } as ViewStyle,
  card: {
    flex: 1,
    backgroundColor: COLORS.bgMagazine,
    borderRadius: 12,
    borderLeftWidth: 3,
    borderLeftColor: COLORS.sage,
    padding: 16,
    gap: 4,
    minHeight: 100,
    justifyContent: 'flex-end',
  } as ViewStyle,
  bigNumber: {
    fontFamily: FONTS.mono,
    fontSize: 36,
    lineHeight: 40,
    color: COLORS.cream,
  } as TextStyle,
  bigRate: {
    fontFamily: FONTS.mono,
    fontSize: 18,
    lineHeight: 22,
  } as TextStyle,
  visaStatus: {
    fontFamily: FONTS.header,
    fontSize: 16,
    lineHeight: 20,
    fontStyle: 'italic',
  } as TextStyle,
  cardDesc: {
    fontFamily: FONTS.body,
    fontSize: 12,
    color: COLORS.creamSoft,
    lineHeight: 16,
  } as TextStyle,
  cardLabel: {
    fontFamily: FONTS.mono,
    fontSize: 10,
    color: COLORS.sage,
    letterSpacing: 1.5,
    marginTop: 4,
  } as TextStyle,
});

// ---------------------------------------------------------------------------
// Main Screen
// ---------------------------------------------------------------------------
function PrepScreen() {
  const router = useRouter();
  const { t } = useTranslation();
  const insets = useSafeAreaInsets();
  const netInfo = useNetInfo();
  const isConnected = netInfo.isConnected ?? true;

  const trips = useAppStore((s) => s.trips);
  const activeTripId = useAppStore((s) => s.activeTripId);
  const travelProfile = useAppStore((s) => s.travelProfile);

  const activeTrip: Trip | null =
    trips.find((t) => t.id === activeTripId) ?? trips[0] ?? null;

  const [selectedDest, setSelectedDest] = useState(
    activeTrip?.destination ?? DESTINATIONS[0]?.label ?? 'Tokyo'
  );
  const [activeSection, setActiveSection] = useState<SectionId>('schedule');

  useEffect(() => {
    if (activeTrip) {
      // eslint-disable-next-line react-hooks/set-state-in-effect -- sync derived state
      setSelectedDest(activeTrip.destination);
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps -- intentional mount-only
  }, [activeTrip?.destination]);

  const emergency = getEmergencyForDestination(selectedDest);
  const safety = getSafetyForDestination(selectedDest);
  const langPack = getLanguagePackForDestination(selectedDest);
  const cultural = getCulturalGuideForDestination(selectedDest);
  const passport = (travelProfile.passportNationality ?? 'US') as PassportNationality;

  const tapWaterFromCultural =
    cultural?.waterSafety === 'tap_safe'
      ? true
      : cultural?.waterSafety === 'bottled_only'
        ? false
        : null;

  const medicalGuide = useMemo(
    () => getMedicalGuideByDestination(selectedDest),
    [selectedDest],
  );

  const parsedItinerary = useMemo(() => {
    const trip = trips.find((t) => t.destination === selectedDest) ?? activeTrip;
    if (!trip?.itinerary) return null;
    try {
      return parseItinerary(trip.itinerary);
    } catch {
      return null;
    }
  }, [trips, activeTrip, selectedDest]);

  const hasNoData = !emergency && !safety;
  const countryName = emergency?.country ?? safety?.country ?? selectedDest;

  const handleSectionChange = useCallback(
    (id: (typeof SECTIONS)[number]['id']) => {
      Haptics.selectionAsync();
      setActiveSection(id);
    },
    []
  );

  const popularDests = useMemo(
    () =>
      [...DESTINATIONS]
        .sort((a, b) => (b.trendScore ?? 0) - (a.trendScore ?? 0))
        .slice(0, 12),
    []
  );

  return (
    <View style={[styles.container, { paddingTop: insets.top }]}>
      <ScrollView
        style={styles.scroll}
        contentContainerStyle={[
          styles.scrollContent,
          { paddingBottom: insets.bottom + SPACING.xxl },
        ]}
        showsVerticalScrollIndicator={false}
      >
        {!isConnected && <OfflineBanner />}

        {hasNoData ? (
          <NoDataState destination={selectedDest} />
        ) : (
          <>
            <EditorialHeader
              safety={safety}
              destination={selectedDest}
              countryName={countryName}
            />

            <IntelligenceCardsGrid
              destination={selectedDest}
              safety={safety}
            />

            <View style={{ paddingHorizontal: 20, marginBottom: 40 }}>
              <AirQualitySunCard destination={selectedDest} />
            </View>

            <View style={{ paddingHorizontal: 20, marginTop: SPACING.lg, marginBottom: 40 }}>
              <CostOfLivingCard destination={selectedDest} />
            </View>

            <View style={{ paddingHorizontal: 20, marginBottom: 40 }}>
              <EmergencyQuickCard destination={selectedDest} />
            </View>

            <View style={{ paddingHorizontal: 20, marginBottom: 40 }}>
              <CurrencyQuickCard destination={selectedDest} />
            </View>

            <ScrollView
              horizontal
              showsHorizontalScrollIndicator={false}
              style={styles.pillsScroll}
              contentContainerStyle={styles.pillsContent}
            >
              {SECTIONS.map((s) => {
                const isActive = activeSection === s.id;
                return (
                  <Pressable
                    key={s.id}
                    onPress={() => handleSectionChange(s.id)}
                    style={[
                      styles.pill,
                      isActive && styles.pillActive,
                    ]}
                  >
                    <Text
                      style={[
                        styles.pillText,
                        isActive && styles.pillTextActive,
                      ]}
                    >
                      {'labelKey' in s ? t(s.labelKey) : s.label}
                    </Text>
                  </Pressable>
                );
              })}
            </ScrollView>

            {activeSection === 'schedule' && (
              <ScheduleTab itinerary={parsedItinerary} />
            )}

            {activeSection === 'overview' && safety && (
              <OverviewTab safety={safety} />
            )}

            {activeSection === 'packing' && (
              <PackingTab
                destination={selectedDest}
                trip={activeTrip}
                itinerary={parsedItinerary}
              />
            )}

            {activeSection === 'jetlag' && (
              <JetLagTab destination={selectedDest} />
            )}

            {activeSection === 'crowds' && (
              <CrowdsTab destination={selectedDest} trip={activeTrip} />
            )}

            {activeSection === 'emergency' && (
              <View style={styles.tabContent}>
                {/* I Am Here Now — lifeline card with big tap-to-call buttons */}
                <IAmHereNow
                  destination={selectedDest}
                  hotelName={parsedItinerary?.days?.[0]?.accommodation?.name ?? undefined}
                  hotelAddress={undefined}
                />

                <SOSButton
                  onActivate={() => {}}
                  emergency={emergency}
                />
                {emergency ? (
                  <>
                    <EmergencyNumbers data={emergency} />
                    <EmbassyCard data={emergency} />
                  </>
                ) : (
                  <Text style={styles.noDataText}>
                    Emergency numbers not available for {selectedDest}. Select another destination.
                  </Text>
                )}

                {/* Emergency Medical Card CTA */}
                <Pressable
                  onPress={() => {
                    Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Medium);
                    router.push({ pathname: '/emergency-card', params: { destination: selectedDest } } as never);
                  }}
                  style={({ pressed }) => [
                    styles.bodyIntelCta,
                    { borderLeftColor: COLORS.coral },
                    pressed && { opacity: 0.7 },
                  ]}
                >
                  <Heart size={20} color={COLORS.coral} />
                  <View style={{ flex: 1 }}>
                    <Text style={[styles.bodyIntelCtaTitle, { color: COLORS.coral }]}>Emergency Medical Card</Text>
                    <Text style={styles.bodyIntelCtaSubtitle}>
                      One-tap card with your allergies, meds & blood type in local language
                    </Text>
                  </View>
                  <ChevronRight size={18} color={COLORS.creamMuted} />
                </Pressable>
              </View>
            )}

            {activeSection === 'health' && safety && (
              <HealthTab
                safety={safety}
                tapWaterFromCultural={tapWaterFromCultural}
                medicalGuide={medicalGuide}
                destination={selectedDest}
              />
            )}

            {activeSection === 'health' && !safety && (
              <View style={styles.tabContent}>
                <NoDataState destination={selectedDest} />
              </View>
            )}

            {activeSection === 'language' && (
              langPack ? (
                <LanguageTab pack={langPack} />
              ) : (
                <View style={styles.tabContent}>
                  <Text style={styles.noDataText}>
                    Language pack not available for {selectedDest}. English may be widely spoken.
                  </Text>
                </View>
              )
            )}

            {activeSection === 'visa' && (
              <VisaTab destination={selectedDest} passport={passport} />
            )}

            {activeSection === 'currency' && (
              <CurrencyTab cultural={cultural} destination={selectedDest} />
            )}

            {activeSection === 'connectivity' && (
              <ConnectivityTab cultural={cultural} destination={selectedDest} />
            )}

            {activeSection === 'culture' && (
              <CultureTab cultural={cultural} destination={selectedDest} />
            )}
          </>
        )}

        {/* Before You Land — quick action */}
        {!hasNoData && (
          <Pressable
            onPress={() => {
              Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Medium);
              router.push({ pathname: '/before-you-land', params: { destination: selectedDest } } as never);
            }}
            style={({ pressed }) => [
              styles.bodyIntelCta,
              { borderLeftColor: COLORS.gold, marginTop: SPACING.lg },
              pressed && { opacity: 0.7 },
            ]}
          >
            <Plane size={20} color={COLORS.gold} />
            <View style={{ flex: 1 }}>
              <Text style={[styles.bodyIntelCtaTitle, { color: COLORS.gold }]}>Before You Land</Text>
              <Text style={styles.bodyIntelCtaSubtitle}>
                Pre-departure brief: weather, currency, time zone & essentials
              </Text>
            </View>
            <ChevronRight size={18} color={COLORS.creamMuted} />
          </Pressable>
        )}

        {!hasNoData && (
          <View style={styles.destPickerWrap}>
            <Text style={styles.destPickerLabel}>DESTINATION</Text>
            <ScrollView
              horizontal
              showsHorizontalScrollIndicator={false}
              contentContainerStyle={styles.destPickerScroll}
            >
              {popularDests.map((d) => {
                const isActive = selectedDest === d.label;
                return (
                  <Pressable
                    key={d.label}
                    onPress={() => {
                      Haptics.selectionAsync();
                      setSelectedDest(d.label);
                    }}
                    style={[
                      styles.destChip,
                      isActive && styles.destChipActive,
                    ]}
                  >
                    <Text
                      style={[
                        styles.destChipText,
                        isActive && styles.destChipTextActive,
                      ]}
                    >
                      {d.label}
                    </Text>
                  </Pressable>
                );
              })}
            </ScrollView>
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
  scroll: {
    flex: 1,
  } as ViewStyle,
  scrollContent: {
    paddingHorizontal: 0,
  } as ViewStyle,

  offlineBanner: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
    backgroundColor: COLORS.coral,
    padding: 8,
    marginBottom: SPACING.md,
    borderRadius: RADIUS.sm,
  } as ViewStyle,
  offlineText: {
    fontFamily: FONTS.body,
    fontSize: 12,
    color: COLORS.bg,
  } as TextStyle,

  heroCard: {
    backgroundColor: COLORS.bgMagazine,
    borderRadius: RADIUS.xl,
    borderLeftWidth: 3,
    borderLeftColor: COLORS.sage,
    padding: 20,
    alignItems: 'flex-start',
    marginBottom: SPACING.lg,
  } as ViewStyle,
  heroScoreWrap: {
    width: 96,
    height: 96,
    alignItems: 'center',
    justifyContent: 'center',
    marginBottom: SPACING.sm,
  } as ViewStyle,
  heroSvg: {
    position: 'absolute',
  } as ViewStyle,
  heroScoreCenter: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
  } as ViewStyle,
  heroScoreNum: {
    fontFamily: FONTS.mono,
    fontSize: 32,
  } as TextStyle,
  heroCountry: {
    fontFamily: FONTS.header,
    fontSize: 22,
    color: COLORS.cream,
    marginBottom: 4,
    fontStyle: 'italic',
  } as TextStyle,
  heroLabel: {
    fontFamily: FONTS.body,
    fontSize: 12,
    color: COLORS.creamMuted,
    marginBottom: SPACING.sm,
  } as TextStyle,
  heroUpdated: {
    fontFamily: FONTS.mono,
    fontSize: 11,
    color: COLORS.creamMuted,
    opacity: 0.7,
  } as TextStyle,

  pillsScroll: {
    marginBottom: SPACING.lg,
    borderBottomWidth: 1,
    borderBottomColor: COLORS.sage + '20',
  } as ViewStyle,
  pillsContent: {
    flexDirection: 'row',
    paddingHorizontal: 20,
    gap: 0,
  } as ViewStyle,
  pill: {
    paddingHorizontal: 14,
    paddingVertical: 12,
    borderBottomWidth: 2,
    borderBottomColor: 'transparent',
  } as ViewStyle,
  pillActive: {
    borderBottomColor: COLORS.sage,
  } as ViewStyle,
  pillText: {
    fontFamily: FONTS.body,
    fontSize: 13,
    color: COLORS.cream,
  } as TextStyle,
  pillTextActive: {
    color: COLORS.sage,
  } as TextStyle,

  tabContent: {
    paddingHorizontal: 20,
    marginBottom: 40,
  } as ViewStyle,

  overviewRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    marginBottom: SPACING.md,
  } as ViewStyle,
  overviewLabel: {
    fontFamily: FONTS.body,
    fontSize: 12,
    color: COLORS.creamMuted,
  } as TextStyle,
  advisoryBadge: {
    paddingHorizontal: SPACING.sm,
    paddingVertical: 4,
  } as ViewStyle,
  advisoryBadgeText: {
    fontFamily: FONTS.bodyMedium,
    fontSize: 12,
  } as TextStyle,
  advisoryBold: {
    fontFamily: FONTS.bodySemiBold,
  } as TextStyle,
  risksWrap: {
    gap: SPACING.sm,
    marginBottom: SPACING.lg,
  } as ViewStyle,
  riskRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: SPACING.sm,
  } as ViewStyle,
  riskText: {
    fontFamily: FONTS.body,
    fontSize: 13,
    color: COLORS.cream,
    flex: 1,
  } as TextStyle,
  metricsWrap: {
    gap: SPACING.md,
  } as ViewStyle,
  metricRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: SPACING.sm,
  } as ViewStyle,
  metricLabel: {
    fontFamily: FONTS.body,
    fontSize: 12,
    color: COLORS.creamMuted,
    width: 110,
  } as TextStyle,
  metricBarWrap: {
    flex: 1,
    height: 4,
    borderRadius: 2,
    backgroundColor: COLORS.bgMagazine,
    overflow: 'hidden',
  } as ViewStyle,
  metricBarFill: {
    height: '100%',
    borderRadius: 3,
  } as ViewStyle,
  metricPct: {
    fontFamily: FONTS.mono,
    fontSize: 12,
    color: COLORS.cream,
    width: 36,
    textAlign: 'right',
  } as TextStyle,

  sosWrap: {
    alignItems: 'center',
    marginBottom: SPACING.xl,
  } as ViewStyle,
  sosInstruction: {
    fontFamily: FONTS.body,
    fontSize: 12,
    color: COLORS.creamMuted,
    marginBottom: SPACING.sm,
  } as TextStyle,
  sosButton: {
    width: 160,
    height: 160,
    borderRadius: 80,
    backgroundColor: COLORS.coral,
    alignItems: 'center',
    justifyContent: 'center',
  } as ViewStyle,
  sosButtonInner: {
    alignItems: 'center',
    justifyContent: 'center',
  } as ViewStyle,
  sosButtonLabel: {
    fontFamily: FONTS.body,
    fontSize: 12,
    color: COLORS.bg,
    marginTop: SPACING.xs,
  } as TextStyle,
  sosProgressRing: {
    position: 'absolute',
  } as ViewStyle,

  emergencyNumbersWrap: {
    gap: 0,
    marginBottom: SPACING.lg,
  } as ViewStyle,
  emergencyNumberRow: {
    flexDirection: 'row',
    alignItems: 'center',
    minHeight: 48,
    paddingVertical: SPACING.sm,
    gap: SPACING.md,
  } as ViewStyle,
  emergencyNumberLabel: {
    fontFamily: FONTS.body,
    fontSize: 13,
    color: COLORS.cream,
    width: 90,
  } as TextStyle,
  emergencyNumberValue: {
    fontFamily: FONTS.mono,
    fontSize: 16,
    color: COLORS.cream,
  } as TextStyle,

  embassyCard: {
    backgroundColor: COLORS.bgMagazine,
    borderRadius: RADIUS.lg,
    borderLeftWidth: 3,
    borderLeftColor: COLORS.sage,
    padding: 16,
  } as ViewStyle,
  embassyLabel: {
    fontFamily: FONTS.mono,
    fontSize: 11,
    color: COLORS.sage,
    marginBottom: 4,
  } as TextStyle,
  embassyName: {
    fontFamily: FONTS.header,
    fontSize: 18,
    color: COLORS.cream,
    marginBottom: SPACING.sm,
  } as TextStyle,
  embassyAddressRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
    marginBottom: SPACING.xs,
  } as ViewStyle,
  embassyAddress: {
    fontFamily: FONTS.body,
    fontSize: 12,
    color: COLORS.creamMuted,
    flex: 1,
  } as TextStyle,
  embassyPhoneRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
  } as ViewStyle,
  embassyPhone: {
    fontFamily: FONTS.mono,
    fontSize: 14,
    color: COLORS.cream,
  } as TextStyle,

  // Health tab — redesigned styles
  healthQuickGlance: {
    gap: SPACING.sm,
    marginBottom: SPACING.lg,
  } as ViewStyle,
  healthQuickCard: {
    borderRadius: RADIUS.lg,
    borderLeftWidth: 3,
    padding: 20,
    alignItems: 'center',
    gap: 8,
  } as ViewStyle,
  healthQuickValue: {
    fontFamily: FONTS.header,
    fontSize: 22,
    textAlign: 'center',
  } as TextStyle,
  healthQuickNote: {
    fontFamily: FONTS.body,
    fontSize: 12,
    color: COLORS.creamMuted,
    textAlign: 'center',
    lineHeight: 16,
  } as TextStyle,
  healthQuickRow: {
    flexDirection: 'row',
    gap: SPACING.sm,
  } as ViewStyle,
  healthQuickCardSmall: {
    flex: 1,
    borderRadius: RADIUS.lg,
    borderLeftWidth: 3,
    padding: 16,
    alignItems: 'center',
    gap: 6,
  } as ViewStyle,
  healthQuickSmallLabel: {
    fontFamily: FONTS.mono,
    fontSize: 10,
    letterSpacing: 1,
    textTransform: 'uppercase',
    color: COLORS.creamMuted,
  } as TextStyle,
  healthQuickSmallValue: {
    fontFamily: FONTS.bodySemiBold,
    fontSize: 14,
  } as TextStyle,
  healthSection: {
    marginBottom: SPACING.lg,
  } as ViewStyle,
  healthSectionTitle: {
    fontFamily: FONTS.header,
    fontSize: 18,
    color: COLORS.cream,
    marginBottom: SPACING.md,
  } as TextStyle,
  healthSectionLabel: {
    fontFamily: FONTS.mono,
    fontSize: 11,
    color: COLORS.sage,
    marginBottom: SPACING.sm,
  } as TextStyle,
  healthSubLabel: {
    fontFamily: FONTS.mono,
    fontSize: 10,
    color: COLORS.creamMuted,
    letterSpacing: 1.5,
    marginBottom: SPACING.xs,
  } as TextStyle,
  healthDetailRow: {
    flexDirection: 'row',
    alignItems: 'flex-start',
    gap: SPACING.sm,
    marginBottom: SPACING.sm,
    paddingVertical: 4,
  } as ViewStyle,
  healthDetailContent: {
    flex: 1,
  } as ViewStyle,
  healthDetailLabel: {
    fontFamily: FONTS.body,
    fontSize: 14,
    color: COLORS.cream,
    marginBottom: 2,
  } as TextStyle,
  healthDetailNote: {
    fontFamily: FONTS.body,
    fontSize: 12,
    color: COLORS.creamMuted,
    lineHeight: 16,
  } as TextStyle,
  healthGoodNews: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: SPACING.sm,
    paddingVertical: 4,
  } as ViewStyle,
  healthGoodNewsText: {
    fontFamily: FONTS.body,
    fontSize: 14,
    color: COLORS.sage,
  } as TextStyle,
  vaccineRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: SPACING.sm,
    marginBottom: SPACING.xs,
  } as ViewStyle,
  vaccineName: {
    fontFamily: FONTS.body,
    fontSize: 13,
    color: COLORS.cream,
  } as TextStyle,
  healthMuted: {
    fontFamily: FONTS.body,
    fontSize: 13,
    color: COLORS.creamMuted,
    marginBottom: SPACING.md,
  } as TextStyle,
  insuranceCard: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: SPACING.sm,
    borderRadius: RADIUS.md,
    padding: SPACING.sm,
    marginTop: SPACING.md,
  } as ViewStyle,
  insuranceText: {
    fontFamily: FONTS.body,
    fontSize: 13,
    color: COLORS.cream,
    flex: 1,
  } as TextStyle,
  tapWaterWrap: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: SPACING.sm,
    marginTop: SPACING.lg,
    marginBottom: SPACING.md,
  } as ViewStyle,
  tapWaterLabel: {
    fontFamily: FONTS.header,
    fontSize: 18,
  } as TextStyle,
  healthRiskRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: SPACING.sm,
    marginBottom: SPACING.xs,
  } as ViewStyle,
  healthRiskDot: {
    width: 6,
    height: 6,
    borderRadius: 3,
    backgroundColor: COLORS.coral,
  } as ViewStyle,
  healthRiskText: {
    fontFamily: FONTS.body,
    fontSize: 13,
    color: COLORS.cream,
  } as TextStyle,
  medicalGridNote: {
    fontFamily: FONTS.body,
    fontSize: 12,
    color: COLORS.creamMuted,
    lineHeight: 16,
    marginTop: 2,
  } as TextStyle,
  whereToGoRow: {
    backgroundColor: COLORS.bgMagazine,
    borderRadius: RADIUS.md,
    borderLeftWidth: 3,
    borderLeftColor: COLORS.sage,
    padding: 12,
    marginBottom: SPACING.xs,
  } as ViewStyle,
  whereToGoCondition: {
    fontFamily: FONTS.bodySemiBold,
    fontSize: 13,
    color: COLORS.cream,
    marginBottom: 2,
  } as TextStyle,
  whereToGoGo: {
    fontFamily: FONTS.body,
    fontSize: 12,
    color: COLORS.creamMuted,
    lineHeight: 16,
  } as TextStyle,

  languageTitle: {
    fontFamily: FONTS.header,
    fontSize: 22,
    color: COLORS.cream,
    marginBottom: 4,
  } as TextStyle,
  languageSubtitle: {
    fontFamily: FONTS.body,
    fontSize: 13,
    color: COLORS.creamMuted,
    marginBottom: SPACING.lg,
  } as TextStyle,
  phraseCard: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: COLORS.bgMagazine,
    borderRadius: RADIUS.lg,
    borderLeftWidth: 3,
    borderLeftColor: COLORS.sage,
    padding: 16,
    marginBottom: SPACING.sm,
  } as ViewStyle,
  phraseCardBody: {
    flex: 1,
  } as ViewStyle,
  phraseCardEnglish: {
    fontFamily: FONTS.body,
    fontSize: 14,
    color: COLORS.creamMuted,
    marginBottom: 4,
  } as TextStyle,
  phraseCardLocal: {
    fontFamily: FONTS.mono,
    fontSize: 16,
    color: COLORS.cream,
    fontWeight: 'bold',
    marginBottom: 4,
  } as TextStyle,
  phraseCardPhonetic: {
    fontFamily: FONTS.body,
    fontSize: 13,
    fontStyle: 'italic',
    color: COLORS.sage,
  } as TextStyle,
  phrasePlayBtn: {
    padding: SPACING.sm,
  } as ViewStyle,

  visaReminder: {
    fontFamily: FONTS.mono,
    fontSize: 11,
    color: COLORS.sage,
    marginBottom: SPACING.sm,
  } as TextStyle,
  visaHeroCard: {
    backgroundColor: COLORS.bgMagazine,
    borderRadius: RADIUS.lg,
    borderLeftWidth: 3,
    padding: 20,
    marginBottom: SPACING.md,
  } as ViewStyle,
  visaHeroText: {
    fontFamily: FONTS.header,
    fontSize: 22,
  } as TextStyle,
  visaHeroBold: {
    fontFamily: FONTS.bodySemiBold,
  } as TextStyle,
  visaDetail: {
    fontFamily: FONTS.mono,
    fontSize: 14,
    color: COLORS.cream,
    marginBottom: 4,
  } as TextStyle,
  visaMeta: {
    fontFamily: FONTS.mono,
    fontSize: 13,
    color: COLORS.creamMuted,
    marginBottom: 4,
  } as TextStyle,
  applyOnlineBtn: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: SPACING.sm,
    marginTop: SPACING.md,
    marginBottom: SPACING.lg,
  } as ViewStyle,
  applyOnlineText: {
    fontFamily: FONTS.body,
    fontSize: 14,
    color: COLORS.sage,
  } as TextStyle,
  visaChecklistLabel: {
    fontFamily: FONTS.mono,
    fontSize: 11,
    color: COLORS.sage,
    marginBottom: SPACING.sm,
  } as TextStyle,
  visaChecklistRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: SPACING.sm,
    marginBottom: SPACING.xs,
  } as ViewStyle,
  visaChecklistText: {
    fontFamily: FONTS.body,
    fontSize: 13,
    color: COLORS.cream,
  } as TextStyle,

  noDataWrap: {
    paddingVertical: SPACING.xl,
    alignItems: 'center',
  } as ViewStyle,
  noDataTitle: {
    fontFamily: FONTS.bodySemiBold,
    fontSize: 16,
    color: COLORS.cream,
    marginBottom: SPACING.sm,
    textAlign: 'center',
  } as TextStyle,
  noDataText: {
    fontFamily: FONTS.body,
    fontSize: 14,
    color: COLORS.creamMuted,
    textAlign: 'center',
    lineHeight: 20,
  } as TextStyle,

  destPickerWrap: {
    marginTop: SPACING.lg,
    paddingHorizontal: 20,
  } as ViewStyle,
  destPickerLabel: {
    fontFamily: FONTS.mono,
    fontSize: 10,
    color: COLORS.sage,
    letterSpacing: 1.5,
    marginBottom: SPACING.sm,
  } as TextStyle,
  destPickerScroll: {
    flexDirection: 'row',
  } as ViewStyle,
  destChip: {
    paddingHorizontal: 14,
    paddingVertical: 10,
    borderBottomWidth: 2,
    borderBottomColor: 'transparent',
    marginRight: 4,
  } as ViewStyle,
  destChipActive: {
    borderBottomColor: COLORS.sage,
  } as ViewStyle,
  destChipText: {
    fontFamily: FONTS.body,
    fontSize: 13,
    color: COLORS.creamSoft,
  } as TextStyle,
  destChipTextActive: {
    color: COLORS.sage,
  } as TextStyle,

  scheduleIntro: {
    fontFamily: FONTS.body,
    fontSize: 13,
    color: COLORS.creamMuted,
    marginBottom: SPACING.md,
  } as TextStyle,
  scheduleEmptyTitle: {
    fontFamily: FONTS.header,
    fontSize: 18,
    color: COLORS.cream,
    marginBottom: SPACING.sm,
  } as TextStyle,
  scheduleDayCard: {
    backgroundColor: COLORS.bgMagazine,
    borderRadius: RADIUS.lg,
    borderLeftWidth: 3,
    borderLeftColor: COLORS.sage,
    padding: 20,
    marginBottom: SPACING.md,
  } as ViewStyle,
  scheduleDayLabel: {
    fontFamily: FONTS.mono,
    fontSize: 11,
    color: COLORS.sage,
    letterSpacing: 1,
    marginBottom: 4,
  } as TextStyle,
  scheduleDayTheme: {
    fontFamily: FONTS.header,
    fontSize: 18,
    color: COLORS.cream,
    marginBottom: SPACING.md,
  } as TextStyle,
  scheduleSlotRow: {
    flexDirection: 'row',
    marginBottom: SPACING.sm,
    gap: SPACING.md,
  } as ViewStyle,
  scheduleSlotTime: {
    fontFamily: FONTS.mono,
    fontSize: 12,
    color: COLORS.gold,
    width: 64,
  } as TextStyle,
  scheduleSlotContent: {
    flex: 1,
  } as ViewStyle,
  scheduleSlotActivity: {
    fontFamily: FONTS.body,
    fontSize: 14,
    color: COLORS.cream,
  } as TextStyle,
  scheduleSlotLocation: {
    fontFamily: FONTS.body,
    fontSize: 12,
    color: COLORS.creamMuted,
    marginTop: 2,
  } as TextStyle,

  // Currency Tab
  currencyHero: {
    alignItems: 'center',
    marginBottom: SPACING.lg,
  } as ViewStyle,
  currencySymbol: {
    fontFamily: FONTS.header,
    fontSize: 48,
    color: COLORS.cream,
  } as TextStyle,
  currencyCode: {
    fontFamily: FONTS.mono,
    fontSize: 14,
    color: COLORS.sage,
    letterSpacing: 2,
  } as TextStyle,
  currencySectionLabel: {
    fontFamily: FONTS.mono,
    fontSize: 11,
    color: COLORS.sage,
    letterSpacing: 1,
    marginTop: SPACING.lg,
    marginBottom: SPACING.sm,
  } as TextStyle,
  currencyTipRow: {
    flexDirection: 'row',
    alignItems: 'flex-start',
    gap: SPACING.sm,
    marginBottom: SPACING.xs,
  } as ViewStyle,
  currencyTipDot: {
    width: 5,
    height: 5,
    borderRadius: 3,
    backgroundColor: COLORS.sage,
    marginTop: 6,
  } as ViewStyle,
  currencyTipText: {
    fontFamily: FONTS.body,
    fontSize: 13,
    color: COLORS.cream,
    flex: 1,
    lineHeight: 18,
  } as TextStyle,

  // Shared info card
  infoCard: {
    backgroundColor: COLORS.bgMagazine,
    borderRadius: RADIUS.lg,
    borderLeftWidth: 3,
    borderLeftColor: COLORS.sage,
    padding: 16,
    marginBottom: SPACING.sm,
  } as ViewStyle,
  infoCardRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: SPACING.sm,
    marginBottom: SPACING.xs,
  } as ViewStyle,
  infoCardLabel: {
    fontFamily: FONTS.mono,
    fontSize: 11,
    color: COLORS.sage,
    letterSpacing: 1,
  } as TextStyle,
  infoCardBody: {
    fontFamily: FONTS.body,
    fontSize: 13,
    color: COLORS.cream,
    lineHeight: 18,
  } as TextStyle,

  // Connectivity Tab
  connProviderName: {
    fontFamily: FONTS.bodySemiBold,
    fontSize: 15,
    color: COLORS.cream,
    marginBottom: 2,
  } as TextStyle,
  connWhere: {
    fontFamily: FONTS.body,
    fontSize: 12,
    color: COLORS.creamMuted,
    marginTop: 4,
  } as TextStyle,
  connTip: {
    fontFamily: FONTS.body,
    fontSize: 12,
    color: COLORS.creamMuted,
    marginTop: SPACING.sm,
    lineHeight: 17,
  } as TextStyle,
  esimRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    backgroundColor: COLORS.bgMagazine,
    borderRadius: RADIUS.md,
    borderLeftWidth: 3,
    borderLeftColor: COLORS.sage,
    padding: 12,
    marginBottom: SPACING.xs,
  } as ViewStyle,
  esimName: {
    fontFamily: FONTS.bodySemiBold,
    fontSize: 14,
    color: COLORS.cream,
  } as TextStyle,
  esimNote: {
    fontFamily: FONTS.body,
    fontSize: 12,
    color: COLORS.creamMuted,
  } as TextStyle,

  // Culture Tab
  cultureTitle: {
    fontFamily: FONTS.header,
    fontSize: 24,
    color: COLORS.cream,
    marginBottom: SPACING.md,
  } as TextStyle,
  etiquetteCard: {
    backgroundColor: COLORS.bgMagazine,
    borderRadius: RADIUS.lg,
    borderLeftWidth: 3,
    borderLeftColor: COLORS.sage,
    padding: 16,
    marginBottom: SPACING.sm,
    gap: SPACING.sm,
  } as ViewStyle,
  etiquetteRow: {
    flexDirection: 'row',
    alignItems: 'flex-start',
    gap: SPACING.sm,
  } as ViewStyle,
  etiquetteDo: {
    fontFamily: FONTS.body,
    fontSize: 13,
    color: COLORS.sage,
    flex: 1,
    lineHeight: 18,
  } as TextStyle,
  etiquetteDont: {
    fontFamily: FONTS.body,
    fontSize: 13,
    color: COLORS.coral,
    flex: 1,
    lineHeight: 18,
  } as TextStyle,
  scamRow: {
    flexDirection: 'row',
    alignItems: 'flex-start',
    gap: SPACING.sm,
    marginBottom: SPACING.xs,
  } as ViewStyle,
  scamText: {
    fontFamily: FONTS.body,
    fontSize: 13,
    color: COLORS.cream,
    flex: 1,
    lineHeight: 18,
  } as TextStyle,
  bodyIntelCta: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: SPACING.sm,
    marginTop: SPACING.lg,
    padding: 16,
    backgroundColor: COLORS.bgMagazine,
    borderRadius: RADIUS.lg,
    borderLeftWidth: 3,
    borderLeftColor: COLORS.sage,
  } as ViewStyle,
  bodyIntelCtaTitle: {
    fontFamily: FONTS.bodySemiBold,
    fontSize: 14,
    color: COLORS.sage,
  } as TextStyle,
  bodyIntelCtaSubtitle: {
    fontFamily: FONTS.body,
    fontSize: 12,
    color: COLORS.creamMuted,
    marginTop: 2,
  } as TextStyle,
});

export default withComingSoon(PrepScreen, { routeName: 'prep', title: 'Trip Prep' });
