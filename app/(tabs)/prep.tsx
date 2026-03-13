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
  type LucideIcon,
} from 'lucide-react-native';

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
// Safety Score Hero
// ---------------------------------------------------------------------------
function SafetyScoreHero({
  safety,
  destination,
  countryName,
}: {
  safety: SafetyData | null;
  destination: string;
  countryName: string;
}) {
  const animVal = useRef(new Animated.Value(0)).current;
  const score = safety?.safetyScore ?? 0;
  const circumference = 2 * Math.PI * 44;
  const strokeColor =
    score > 70 ? COLORS.sage : score >= 40 ? COLORS.gold : COLORS.coral;
  const offset = circumference - (score / 100) * circumference;

  useEffect(() => {
    Animated.timing(animVal, {
      toValue: 1,
      duration: 500,
      useNativeDriver: false,
    }).start();
  }, [animVal, score]);

  const strokeDashoffset = animVal.interpolate({
    inputRange: [0, 1],
    outputRange: [circumference, offset],
  });

  return (
    <View style={styles.heroCard}>
      <View style={styles.heroScoreWrap}>
        <Svg width={96} height={96} style={styles.heroSvg}>
          <Circle
            cx={48}
            cy={48}
            r={44}
            stroke={COLORS.bg}
            strokeWidth={8}
            fill="transparent"
          />
          <AnimatedSvgCircle
            cx={48}
            cy={48}
            r={44}
            stroke={strokeColor}
            strokeWidth={8}
            fill="transparent"
            strokeDasharray={circumference}
            strokeDashoffset={strokeDashoffset}
            strokeLinecap="round"
            transform="rotate(-90 48 48)"
          />
        </Svg>
        <View style={StyleSheet.absoluteFillObject} pointerEvents="none">
          <View style={styles.heroScoreCenter}>
            <Text style={[styles.heroScoreNum, { color: strokeColor }]}>{score}</Text>
          </View>
        </View>
      </View>
      <Text style={styles.heroCountry}>{countryName}</Text>
      <Text style={styles.heroLabel}>Safety Overview</Text>
      <Text style={styles.heroUpdated}>
        Last updated {new Date().toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric' })}
      </Text>
    </View>
  );
}

// ---------------------------------------------------------------------------
// Section Pills
// ---------------------------------------------------------------------------
const SECTIONS = [
  { id: 'schedule' as const, label: 'Schedule' },
  { id: 'overview' as const, label: 'Overview' },
  { id: 'emergency' as const, label: 'Emergency' },
  { id: 'health' as const, label: 'Health' },
  { id: 'language' as const, label: 'Language' },
  { id: 'visa' as const, label: 'Visa' },
  { id: 'currency' as const, label: 'Currency' },
  { id: 'connectivity' as const, label: 'SIM & WiFi' },
  { id: 'culture' as const, label: 'Culture' },
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
  emergency,
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
// Emergency Numbers (finger-friendly, min 48px height)
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
    <View style={styles.emergencyNumbersWrap}>
      {rows.map((r) => (
        <TouchableOpacity
          key={r.label}
          style={styles.emergencyNumberRow}
          onPress={() => openTel(r.number)}
          activeOpacity={0.7}
        >
          <r.icon size={20} color={COLORS.cream} />
          <Text style={styles.emergencyNumberLabel}>{r.label}</Text>
          <Text style={styles.emergencyNumberValue}>{r.number}</Text>
        </TouchableOpacity>
      ))}
    </View>
  );
}

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
// Health Tab
// ---------------------------------------------------------------------------
function HealthTab({
  safety,
  tapWaterFromCultural,
  medicalGuide,
}: {
  safety: SafetyData;
  tapWaterFromCultural: boolean | null;
  medicalGuide: MedicalGuide | null;
}) {
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

  return (
    <View style={styles.tabContent}>
      {/* Medical guide — hospital & pharmacy intel */}
      {medicalGuide && (
        <>
          <View style={styles.medicalGrid}>
            <View style={styles.medicalGridItem}>
              <Stethoscope size={18} color={hospitalColor} />
              <Text style={styles.medicalGridLabel}>Hospitals</Text>
              <Text style={[styles.medicalGridValue, { color: hospitalColor }]}>
                {medicalGuide.hospitalQuality.charAt(0).toUpperCase() + medicalGuide.hospitalQuality.slice(1)}
              </Text>
              <Text style={styles.medicalGridNote}>{medicalGuide.hospitalNote}</Text>
            </View>
            <View style={styles.medicalGridItem}>
              <Pill size={18} color={medicalGuide.pharmacyOTC ? COLORS.sage : COLORS.gold} />
              <Text style={styles.medicalGridLabel}>Pharmacy</Text>
              <Text style={[styles.medicalGridValue, { color: medicalGuide.pharmacyOTC ? COLORS.sage : COLORS.gold }]}>
                {medicalGuide.pharmacyOTC ? 'OTC available' : 'Rx required'}
              </Text>
              <Text style={styles.medicalGridNote}>{medicalGuide.pharmacyNote}</Text>
            </View>
          </View>

          {medicalGuide.erCostRange && (
            <View style={styles.medicalCostRow}>
              <Heart size={14} color={COLORS.coral} />
              <Text style={styles.medicalCostText}>
                ER visit without insurance: {medicalGuide.erCostRange}
              </Text>
            </View>
          )}

          <View style={[styles.insuranceCard, { backgroundColor: insuranceColor + '14' }]}>
            <AlertTriangle size={18} color={insuranceColor} />
            <View style={{ flex: 1 }}>
              <Text style={[styles.insuranceText, { color: insuranceColor }]}>
                Insurance: {medicalGuide.insurancePriority === 'critical' ? 'Critical' : medicalGuide.insurancePriority === 'recommended' ? 'Recommended' : 'Nice to have'}
              </Text>
              <Text style={styles.medicalGridNote}>{medicalGuide.insuranceNote}</Text>
            </View>
          </View>

          {medicalGuide.whereToGo.length > 0 && (
            <>
              <Text style={styles.healthSectionLabel}>Where to Go</Text>
              {medicalGuide.whereToGo.map((item, i) => (
                <View key={i} style={styles.whereToGoRow}>
                  <Text style={styles.whereToGoCondition}>{item.condition}</Text>
                  <Text style={styles.whereToGoGo}>{item.go}</Text>
                </View>
              ))}
            </>
          )}
        </>
      )}

      <Text style={styles.healthSectionLabel}>Required Vaccinations</Text>
      {safety.vaccinations
        .filter((v) => v.required)
        .map((v, i) => (
          <View key={i} style={styles.vaccineRow}>
            <CheckCircle size={14} color={COLORS.sage} />
            <Text style={styles.vaccineName}>{v.name}</Text>
          </View>
        ))}
      {safety.vaccinations.filter((v) => v.required).length === 0 && (
        <Text style={styles.healthMuted}>Routine immunizations recommended</Text>
      )}

      <Text style={[styles.healthSectionLabel, { marginTop: SPACING.md }]}>
        Recommended Vaccinations
      </Text>
      {safety.vaccinations
        .filter((v) => !v.required)
        .map((v, i) => (
          <View key={i} style={styles.vaccineRow}>
            <CheckCircle size={14} color={COLORS.sage} />
            <Text style={styles.vaccineName}>{v.name}</Text>
          </View>
        ))}

      {!medicalGuide && (
        <View style={[styles.insuranceCard, { backgroundColor: COLORS.gold + '14' }]}>
          <AlertTriangle size={18} color={COLORS.gold} />
          <Text style={styles.insuranceText}>Travel insurance strongly recommended</Text>
        </View>
      )}

      <View style={styles.tapWaterWrap}>
        <Droplets size={24} color={tapSafe ? COLORS.sage : COLORS.coral} />
        <Text
          style={[
            styles.tapWaterLabel,
            { color: tapSafe ? COLORS.sage : COLORS.coral },
          ]}
        >
          {tapSafe ? 'Safe to drink' : 'Do not drink'}
        </Text>
        {medicalGuide?.waterNote && (
          <Text style={styles.medicalGridNote}>{medicalGuide.waterNote}</Text>
        )}
      </View>

      <Text style={styles.healthSectionLabel}>Common Health Risks</Text>
      {(medicalGuide?.healthRisks ?? safety.commonHealthRisks).map((risk, i) => (
        <View key={i} style={styles.healthRiskRow}>
          <View style={styles.healthRiskDot} />
          <Text style={styles.healthRiskText}>{risk}</Text>
        </View>
      ))}
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
        ? COLORS.gold
        : COLORS.coral;
  const heroOpacity = '14';

  return (
    <View style={styles.tabContent}>
      <Text style={styles.visaReminder}>Check before you book</Text>
      <View
        style={[
          styles.visaHeroCard,
          {
            backgroundColor: heroBg + heroOpacity,
            borderColor: heroBg,
          },
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
// Main Screen
// ---------------------------------------------------------------------------
function PrepScreen() {
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
  const [activeSection, setActiveSection] = useState<
    'schedule' | 'overview' | 'emergency' | 'health' | 'language' | 'visa' | 'currency' | 'connectivity' | 'culture'
  >('schedule');

  useEffect(() => {
    if (activeTrip) setSelectedDest(activeTrip.destination);
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
            <SafetyScoreHero
              safety={safety}
              destination={selectedDest}
              countryName={countryName}
            />

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
                      {s.label}
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

            {activeSection === 'emergency' && (
              <View style={styles.tabContent}>
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
              </View>
            )}

            {activeSection === 'health' && safety && (
              <HealthTab
                safety={safety}
                tapWaterFromCultural={tapWaterFromCultural}
                medicalGuide={medicalGuide}
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
    paddingHorizontal: SPACING.lg,
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
    backgroundColor: COLORS.bgCard,
    borderRadius: 16,
    padding: 20,
    alignItems: 'center',
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
    marginHorizontal: -SPACING.lg,
  } as ViewStyle,
  pillsContent: {
    flexDirection: 'row',
    paddingHorizontal: SPACING.lg,
    gap: SPACING.sm,
  } as ViewStyle,
  pill: {
    paddingHorizontal: SPACING.md,
    paddingVertical: SPACING.sm,
    borderRadius: RADIUS.full,
    backgroundColor: COLORS.bgCard,
    borderWidth: 1,
    borderColor: COLORS.creamMuted,
  } as ViewStyle,
  pillActive: {
    backgroundColor: COLORS.sage,
    borderColor: COLORS.sage,
  } as ViewStyle,
  pillText: {
    fontFamily: FONTS.body,
    fontSize: 13,
    color: COLORS.cream,
  } as TextStyle,
  pillTextActive: {
    color: COLORS.bg,
  } as TextStyle,

  tabContent: {
    marginBottom: SPACING.xl,
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
    borderRadius: RADIUS.sm,
    borderWidth: 1,
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
    height: 6,
    borderRadius: 3,
    backgroundColor: COLORS.bgCard,
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
    backgroundColor: COLORS.bgCard,
    borderRadius: 12,
    padding: 14,
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

  healthSectionLabel: {
    fontFamily: FONTS.mono,
    fontSize: 11,
    color: COLORS.sage,
    marginBottom: SPACING.sm,
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
    borderRadius: 10,
    padding: 12,
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
  medicalGrid: {
    flexDirection: 'row',
    gap: SPACING.sm,
    marginBottom: SPACING.md,
  } as ViewStyle,
  medicalGridItem: {
    flex: 1,
    backgroundColor: COLORS.bgElevated,
    borderRadius: RADIUS.md,
    padding: SPACING.md,
    gap: 4,
  } as ViewStyle,
  medicalGridLabel: {
    fontFamily: FONTS.mono,
    fontSize: 10,
    color: COLORS.creamMuted,
    letterSpacing: 1,
    textTransform: 'uppercase',
    marginTop: 4,
  } as TextStyle,
  medicalGridValue: {
    fontFamily: FONTS.bodySemiBold,
    fontSize: 14,
  } as TextStyle,
  medicalGridNote: {
    fontFamily: FONTS.body,
    fontSize: 12,
    color: COLORS.creamMuted,
    lineHeight: 16,
    marginTop: 2,
  } as TextStyle,
  medicalCostRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: SPACING.sm,
    marginBottom: SPACING.sm,
    paddingHorizontal: SPACING.xs,
  } as ViewStyle,
  medicalCostText: {
    fontFamily: FONTS.body,
    fontSize: 13,
    color: COLORS.coral,
  } as TextStyle,
  whereToGoRow: {
    backgroundColor: COLORS.bgElevated,
    borderRadius: RADIUS.md,
    padding: SPACING.sm,
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
    backgroundColor: COLORS.bgCard,
    borderRadius: 12,
    padding: 14,
    marginBottom: 8,
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
    borderRadius: 12,
    borderWidth: 1,
    padding: SPACING.lg,
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
    paddingHorizontal: SPACING.md,
    paddingVertical: SPACING.sm,
    borderRadius: RADIUS.full,
    backgroundColor: COLORS.bgCard,
    borderWidth: 1,
    borderColor: COLORS.creamMuted,
    marginRight: SPACING.sm,
  } as ViewStyle,
  destChipActive: {
    backgroundColor: COLORS.sage,
    borderColor: COLORS.sage,
  } as ViewStyle,
  destChipText: {
    fontFamily: FONTS.body,
    fontSize: 13,
    color: COLORS.cream,
  } as TextStyle,
  destChipTextActive: {
    color: COLORS.bg,
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
    backgroundColor: COLORS.bgCard,
    borderRadius: RADIUS.lg,
    padding: SPACING.lg,
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
    backgroundColor: COLORS.bgCard,
    borderRadius: 12,
    padding: 14,
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
    backgroundColor: COLORS.bgCard,
    borderRadius: 10,
    padding: 12,
    marginBottom: 6,
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
    backgroundColor: COLORS.bgCard,
    borderRadius: 12,
    padding: 14,
    marginBottom: 8,
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
});

export default withComingSoon(PrepScreen, { routeName: 'prep', title: 'Trip Prep' });
