// =============================================================================
// ROAM — Body Intel Screen (Health Prep Hub)
// Comprehensive destination-aware health intelligence for travelers.
// NOT medical advice — travel health information only.
// =============================================================================
import React, { useCallback, useEffect, useMemo, useState } from 'react';
import {
  ActivityIndicator,
  Pressable,
  ScrollView,
  StyleSheet,
  Text,
  TextInput,
  View,
  Linking,
  type TextStyle,
  type ViewStyle,
} from 'react-native';
import { useLocalSearchParams, useRouter } from 'expo-router';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import AsyncStorage from '@react-native-async-storage/async-storage';
import {
  ArrowLeft,
  Activity,
  Shield,
  Droplets,
  AlertTriangle,
  Phone,
  Pill,
  ChevronRight,
  ChevronDown,
  Search,
  Info,
  CheckSquare,
  Square,
  Mountain,
  Heart,
  ExternalLink,
  Syringe,
  Utensils,
} from 'lucide-react-native';
import * as Haptics from '../lib/haptics';
import { useTranslation } from 'react-i18next';
import { COLORS, FONTS, SPACING, RADIUS } from '../lib/constants';
import { useAppStore } from '../lib/store';
import { getMedicalGuideByDestination, type MedicalGuide } from '../lib/medical-abroad';
import { getHealthBrief, type HealthBrief } from '../lib/health-brief';
import { getWeatherIntel, type WeatherIntel } from '../lib/apis/openweather';
import { useSonarQuery } from '../lib/sonar';
import { track } from '../lib/analytics';
import { captureEvent } from '../lib/posthog';

// ---------------------------------------------------------------------------
// Altitude lookup table (destination keyword → meters)
// ---------------------------------------------------------------------------
const HIGH_ALTITUDE_DESTINATIONS: Record<string, { meters: number; city: string }> = {
  'la paz': { meters: 3650, city: 'La Paz' },
  'bolivia': { meters: 3650, city: 'La Paz' },
  'cusco': { meters: 3400, city: 'Cusco' },
  'cuzco': { meters: 3400, city: 'Cusco' },
  'peru': { meters: 3400, city: 'Cusco' },
  'quito': { meters: 2850, city: 'Quito' },
  'ecuador': { meters: 2850, city: 'Quito' },
  'lhasa': { meters: 3650, city: 'Lhasa' },
  'tibet': { meters: 3650, city: 'Lhasa' },
  'bogota': { meters: 2640, city: 'Bogotá' },
  'bogotá': { meters: 2640, city: 'Bogotá' },
  'colombia': { meters: 2640, city: 'Bogotá' },
  'mexico city': { meters: 2240, city: 'Mexico City' },
  'addis ababa': { meters: 2355, city: 'Addis Ababa' },
  'ethiopia': { meters: 2355, city: 'Addis Ababa' },
  'nairobi': { meters: 1795, city: 'Nairobi' }, // just under threshold but flagged
  'kenya': { meters: 1795, city: 'Nairobi' },
  'denver': { meters: 1609, city: 'Denver' },
  'colorado': { meters: 1609, city: 'Denver' },
  'kathmandu': { meters: 1400, city: 'Kathmandu' },
  'nepal': { meters: 1400, city: 'Kathmandu' },
  'medellín': { meters: 1495, city: 'Medellín' },
  'medellin': { meters: 1495, city: 'Medellín' },
};

const ALTITUDE_THRESHOLD_M = 1400;

function getAltitudeInfo(destination: string): { meters: number; city: string } | null {
  const key = destination.toLowerCase().trim();
  for (const [k, v] of Object.entries(HIGH_ALTITUDE_DESTINATIONS)) {
    if (key.includes(k) || k.includes(key)) {
      if (v.meters >= ALTITUDE_THRESHOLD_M) return v;
    }
  }
  return null;
}

// ---------------------------------------------------------------------------
// Static medication checklist
// ---------------------------------------------------------------------------
interface MedItem {
  id: string;
  name: string;
  note: string;
}

const MEDICATION_CHECKLIST: MedItem[] = [
  { id: 'antidiarrheal', name: 'Anti-diarrheal', note: 'Imodium / loperamide' },
  { id: 'painkillers', name: 'Painkillers', note: 'Paracetamol or ibuprofen' },
  { id: 'antihistamines', name: 'Antihistamines', note: 'For allergies and bites' },
  { id: 'motion_sickness', name: 'Motion sickness', note: 'For flights or winding roads' },
  { id: 'insect_repellent', name: 'Insect repellent', note: 'DEET 30%+ recommended' },
  { id: 'sunscreen', name: 'Sunscreen SPF 50', note: 'Reapply every 2 hours' },
  { id: 'hand_sanitizer', name: 'Hand sanitizer', note: '60%+ alcohol content' },
];

// ---------------------------------------------------------------------------
// Insurance providers
// ---------------------------------------------------------------------------
const INSURANCE_PROVIDERS = [
  { name: 'World Nomads', url: 'https://www.worldnomads.com/' },
  { name: 'SafetyWing', url: 'https://safetywing.com/' },
  { name: 'Allianz Travel', url: 'https://www.allianztravelinsurance.com/' },
];

// ---------------------------------------------------------------------------
// Symptom Categories (carried over from original)
// ---------------------------------------------------------------------------
const SYMPTOM_CATEGORIES = [
  { id: 'stomach', label: 'Stomach Issues' },
  { id: 'fever', label: 'Fever / Chills' },
  { id: 'skin', label: 'Skin Reaction' },
  { id: 'respiratory', label: 'Respiratory' },
  { id: 'head', label: 'Head / Dizziness' },
  { id: 'injury', label: 'Injury' },
  { id: 'eye-ear', label: 'Eye / Ear Issues' },
  { id: 'other', label: 'Other' },
] as const;

type RegionId = 'southeast-asia' | 'east-asia' | 'south-asia' | 'europe' | 'latin-america' | 'middle-east' | 'africa' | 'north-america' | 'oceania';

interface SymptomIntel {
  riskLevel: 'low' | 'moderate' | 'high';
  commonCauses: string[];
  whatToDo: string[];
  seeDoctor: string;
  localMedication: string;
}

const DEST_REGION: Record<string, RegionId> = {
  'tokyo': 'east-asia', 'kyoto': 'east-asia', 'osaka': 'east-asia', 'japan': 'east-asia',
  'seoul': 'east-asia', 'south korea': 'east-asia',
  'bangkok': 'southeast-asia', 'thailand': 'southeast-asia', 'chiang mai': 'southeast-asia',
  'bali': 'southeast-asia', 'indonesia': 'southeast-asia', 'jakarta': 'southeast-asia',
  'vietnam': 'southeast-asia', 'hanoi': 'southeast-asia', 'ho chi minh': 'southeast-asia',
  'singapore': 'southeast-asia', 'philippines': 'southeast-asia', 'manila': 'southeast-asia',
  'india': 'south-asia', 'delhi': 'south-asia', 'mumbai': 'south-asia', 'goa': 'south-asia',
  'sri lanka': 'south-asia', 'nepal': 'south-asia',
  'paris': 'europe', 'london': 'europe', 'barcelona': 'europe', 'rome': 'europe',
  'lisbon': 'europe', 'amsterdam': 'europe', 'berlin': 'europe', 'prague': 'europe',
  'budapest': 'europe', 'athens': 'europe', 'istanbul': 'europe', 'croatia': 'europe',
  'reykjavik': 'europe', 'iceland': 'europe', 'portugal': 'europe', 'spain': 'europe',
  'mexico city': 'latin-america', 'mexico': 'latin-america', 'cancun': 'latin-america',
  'buenos aires': 'latin-america', 'colombia': 'latin-america', 'medellin': 'latin-america',
  'lima': 'latin-america', 'costa rica': 'latin-america', 'brazil': 'latin-america',
  'dubai': 'middle-east', 'uae': 'middle-east', 'jordan': 'middle-east',
  'morocco': 'africa', 'marrakech': 'africa', 'cape town': 'africa', 'south africa': 'africa',
  'egypt': 'africa', 'cairo': 'africa', 'kenya': 'africa', 'tanzania': 'africa',
  'new york': 'north-america', 'los angeles': 'north-america', 'usa': 'north-america',
  'canada': 'north-america', 'toronto': 'north-america',
  'australia': 'oceania', 'sydney': 'oceania', 'melbourne': 'oceania', 'new zealand': 'oceania',
};

function getRegion(destination: string): RegionId {
  const key = destination.toLowerCase().trim();
  for (const [k, v] of Object.entries(DEST_REGION)) {
    if (key.includes(k) || k.includes(key)) return v;
  }
  return 'europe';
}

const SYMPTOM_DATA: Record<string, Record<string, SymptomIntel>> = {
  'southeast-asia': {
    stomach: {
      riskLevel: 'high',
      commonCauses: [
        "Traveler's diarrhea from street food bacteria",
        'Tap water contamination (ice cubes count)',
        'Spice sensitivity or unfamiliar ingredients',
      ],
      whatToDo: [
        'Stay hydrated — drink electrolyte solution or coconut water',
        'Eat bland food: plain rice, bananas, toast',
        'Avoid dairy, caffeine, and alcohol for 24 hours',
        'Take Imodium (loperamide) if needed for travel days',
      ],
      seeDoctor: 'If symptoms last more than 3 days, if you see blood, have fever above 38.5C/101F, or cannot keep fluids down for 12+ hours.',
      localMedication: 'Ask for: Oral Rehydration Salts (ORS) — available at any pharmacy without prescription.',
    },
    fever: {
      riskLevel: 'high',
      commonCauses: [
        'Dengue fever (mosquito-borne, common in rainy season)',
        'Heat exhaustion or heat stroke',
        'Food-borne infection',
      ],
      whatToDo: [
        'Take paracetamol (NOT ibuprofen — dangerous if dengue)',
        'Stay in air-conditioned room and rest',
        'Drink 2-3 liters of water per day minimum',
        'Monitor temperature every 4 hours',
      ],
      seeDoctor: 'Immediately if fever above 39C/102F, if you have a rash with fever, severe headache behind the eyes, or if fever does not respond to paracetamol within 24 hours.',
      localMedication: 'Paracetamol (Tylenol, Panadol). Do NOT take aspirin or ibuprofen until dengue is ruled out.',
    },
    skin: {
      riskLevel: 'moderate',
      commonCauses: [
        'Mosquito or insect bites (some carry disease)',
        'Heat rash from humidity and sweat',
        'Jellyfish or sea creature stings',
      ],
      whatToDo: [
        'Clean any bite/sting with antiseptic',
        'Apply antihistamine cream for itching',
        'For heat rash: stay cool, wear loose cotton, use calamine lotion',
        'Photograph any unusual rashes for the doctor',
      ],
      seeDoctor: 'If a bite becomes red, swollen, and warm (infection sign), if you develop a rash with fever, or if a wound is not healing after 3 days.',
      localMedication: 'Antihistamine cream (Benadryl cream), calamine lotion, or hydrocortisone 1%. Available OTC at most pharmacies.',
    },
  },
  'east-asia': {
    stomach: {
      riskLevel: 'low',
      commonCauses: [
        'Unfamiliar fermented foods (miso, kimchi, natto)',
        'Raw fish sensitivity (sashimi, sushi)',
        'Portion sizes and eating patterns different from home',
      ],
      whatToDo: [
        'Japanese/Korean OTC stomach medicine is excellent — ask at pharmacy',
        'Drink warm water or green tea (aids digestion)',
        'Eat rice porridge (okayu/juk) — gentle on stomach',
        'Rest and avoid alcohol',
      ],
      seeDoctor: 'If symptoms persist beyond 48 hours or if you experience severe abdominal pain.',
      localMedication: 'Japan: Seirogan or Biofermin. Korea: Hwalmyeongsu. Available at any convenience store.',
    },
    fever: {
      riskLevel: 'low',
      commonCauses: [
        'Common cold or flu (especially in winter)',
        'Exhaustion from travel and jet lag',
        'Air conditioning and temperature changes',
      ],
      whatToDo: [
        'Japanese cold medicine (Pabron) is effective and available OTC',
        'Stay hydrated with warm drinks',
        'Rest — convenience stores sell face masks and throat lozenges',
        'Take paracetamol or ibuprofen for fever',
      ],
      seeDoctor: 'If fever lasts more than 3 days or exceeds 39C/102F.',
      localMedication: 'Japan: Pabron Gold, Eve (ibuprofen). Korea: Tylenol, Panpyrin.',
    },
    skin: {
      riskLevel: 'low',
      commonCauses: [
        'Dry skin from air conditioning and heating',
        'Allergic reaction to unfamiliar skincare/bath products',
        'Sunburn (UV can be strong even on overcast days)',
      ],
      whatToDo: [
        'Japanese moisturizers and skincare are world-class — buy at drugstore',
        'Apply aloe vera gel for sunburn',
        'Antihistamine tablets for allergic reactions',
        'Avoid very hot onsen/bath water if skin is irritated',
      ],
      seeDoctor: 'If rash spreads rapidly, is accompanied by swelling, or does not improve with OTC treatment in 48 hours.',
      localMedication: 'Muhi (anti-itch), Oronine H (antiseptic cream), or any antihistamine cream. All available OTC.',
    },
  },
  'europe': {
    stomach: {
      riskLevel: 'low',
      commonCauses: [
        'Rich/heavy food and large portions',
        'Excessive wine or alcohol consumption',
        'Lactose or gluten sensitivity from local cuisine',
      ],
      whatToDo: [
        'Pharmacies in Europe can diagnose and recommend treatments',
        'Drink mint or chamomile tea',
        'Eat light for 24 hours: soup, bread, plain pasta',
        'OTC antacids widely available',
      ],
      seeDoctor: 'If symptoms persist more than 72 hours or are accompanied by fever.',
      localMedication: 'Smecta (France), Iberogast (Germany), Buscopan (pan-European). Pharmacists can recommend.',
    },
    fever: {
      riskLevel: 'low',
      commonCauses: [
        'Common cold or seasonal flu',
        'Travel exhaustion',
        'COVID or respiratory virus',
      ],
      whatToDo: [
        'Take paracetamol or ibuprofen',
        'Stay hydrated and rest',
        'European pharmacies are excellent — describe symptoms at counter',
        'Consider a rapid COVID test if respiratory symptoms present',
      ],
      seeDoctor: 'If fever exceeds 39C/102F for more than 48 hours.',
      localMedication: 'Paracetamol (Doliprane in France, Ben-u-ron in Germany). Ibuprofen widely available.',
    },
    skin: {
      riskLevel: 'low',
      commonCauses: [
        'Sunburn (Mediterranean sun is strong)',
        'Insect bites (mosquitoes in southern Europe)',
        'Allergic reaction to local plants or products',
      ],
      whatToDo: [
        'Aloe vera gel for sunburn (available everywhere)',
        'Antihistamine cream or tablets for bites',
        'European sunscreen is often better quality than US — buy SPF 50',
        'Pharmacist can assess and recommend treatment',
      ],
      seeDoctor: 'If burn blisters cover large area, if bite shows signs of infection, or allergic reaction includes swelling.',
      localMedication: 'Fenistil gel (anti-itch), Voltaren (anti-inflammatory), Bepanthen (healing cream).',
    },
  },
};

const DEFAULT_INTEL: SymptomIntel = {
  riskLevel: 'moderate',
  commonCauses: [
    'Unfamiliar food or water',
    'Travel exhaustion or stress',
    'Climate change from home environment',
  ],
  whatToDo: [
    'Stay hydrated and rest',
    'Visit a local pharmacy — pharmacists can often diagnose and recommend',
    'Take basic OTC medication (paracetamol, antihistamine)',
    'Monitor symptoms for 24-48 hours',
  ],
  seeDoctor: 'If symptoms worsen, do not improve in 48 hours, or are accompanied by high fever.',
  localMedication: 'Paracetamol/acetaminophen for pain and fever. Oral Rehydration Salts for dehydration. Antihistamine for allergic reactions.',
};

function getSymptomIntel(destination: string, categoryId: string): SymptomIntel {
  const region = getRegion(destination);
  return SYMPTOM_DATA[region]?.[categoryId] ?? DEFAULT_INTEL;
}

const EMERGENCY_PHRASES: Record<RegionId, { phrase: string; phonetic: string; language: string }> = {
  'east-asia': { phrase: 'I need medical help', phonetic: 'Tasukete kudasai (tah-soo-keh-teh koo-dah-sai)', language: 'Japanese' },
  'southeast-asia': { phrase: 'I need a doctor', phonetic: 'Chuay duay (choo-ay doo-ay)', language: 'Thai' },
  'south-asia': { phrase: 'I need help', phonetic: 'Mujhe madad chahiye (moo-jhay mah-dahd chah-hee-yay)', language: 'Hindi' },
  'europe': { phrase: 'I need medical help', phonetic: "J'ai besoin d'aide medicale (zhay beh-zwan dehd meh-dee-kal)", language: 'French' },
  'latin-america': { phrase: 'I need a doctor', phonetic: 'Necesito un doctor (neh-seh-see-toh oon dok-tor)', language: 'Spanish' },
  'middle-east': { phrase: 'I need help', phonetic: 'Ahtaaj musaada (ah-taaj moo-saa-dah)', language: 'Arabic' },
  'africa': { phrase: 'I need a doctor', phonetic: "J'ai besoin d'un medecin (zhay beh-zwan dun med-san)", language: 'French' },
  'north-america': { phrase: 'I need medical help', phonetic: 'I need medical help', language: 'English' },
  'oceania': { phrase: 'I need medical help', phonetic: 'I need medical help', language: 'English' },
};

// ---------------------------------------------------------------------------
// Checkbox persistence helpers
// ---------------------------------------------------------------------------
function checklistKey(destination: string): string {
  return `roam_health_checklist_${destination.toLowerCase().replace(/\s+/g, '_')}`;
}

async function loadCheckedItems(destination: string): Promise<Record<string, boolean>> {
  try {
    const raw = await AsyncStorage.getItem(checklistKey(destination));
    if (!raw) return {};
    return JSON.parse(raw) as Record<string, boolean>;
  } catch {
    return {};
  }
}

async function saveCheckedItems(
  destination: string,
  checked: Record<string, boolean>
): Promise<void> {
  try {
    await AsyncStorage.setItem(checklistKey(destination), JSON.stringify(checked));
  } catch {
    // best-effort
  }
}

// ---------------------------------------------------------------------------
// Sub-components
// ---------------------------------------------------------------------------

function RiskBadge({ level }: { level: 'low' | 'moderate' | 'high' }) {
  const config = {
    low: { label: 'LOW RISK', color: COLORS.sage, bg: COLORS.sage + '15' },
    moderate: { label: 'MODERATE', color: COLORS.gold, bg: COLORS.gold + '15' },
    high: { label: 'HIGH RISK', color: COLORS.coral, bg: COLORS.coral + '15' },
  }[level];

  return (
    <View style={[styles.riskBadge, { backgroundColor: config.bg, borderColor: config.color + '30' }]}>
      <View style={[styles.riskDot, { backgroundColor: config.color }]} />
      <Text style={[styles.riskLabel, { color: config.color }]}>{config.label}</Text>
    </View>
  );
}

function SectionHeader({ icon, title }: { icon: React.ReactNode; title: string }) {
  return (
    <View style={styles.sectionHeaderRow}>
      {icon}
      <Text style={styles.sectionTitle}>{title}</Text>
    </View>
  );
}

function SonarLoadingCard() {
  return (
    <View style={styles.sonarLoadingCard}>
      <ActivityIndicator size="small" color={COLORS.sage} />
      <Text style={styles.sonarLoadingText}>Fetching live health data...</Text>
    </View>
  );
}

function SonarErrorCard({ onRetry }: { onRetry: () => void }) {
  return (
    <View style={styles.sonarErrorCard}>
      <Text style={styles.sonarErrorText}>Could not load live data.</Text>
      <Pressable onPress={onRetry} style={styles.retryBtn}>
        <Text style={styles.retryBtnText}>Retry</Text>
      </Pressable>
    </View>
  );
}

// ---------------------------------------------------------------------------
// Main Screen
// ---------------------------------------------------------------------------
export default function BodyIntelScreen() {
  const router = useRouter();
  const insets = useSafeAreaInsets();
  const { t } = useTranslation();
  const params = useLocalSearchParams<{ destination?: string }>();
  const trips = useAppStore((s) => s.trips);

  const [destination, setDestination] = useState(params.destination ?? '');
  const [selectedCategory, setSelectedCategory] = useState<string | null>(null);
  const [expandedSection, setExpandedSection] = useState<string | null>(null);
  const [weatherIntel, setWeatherIntel] = useState<WeatherIntel | null>(null);

  // Vaccine checklist (checked items)
  const [vaccineChecked, setVaccineChecked] = useState<Record<string, boolean>>({});
  // Medication checklist
  const [medChecked, setMedChecked] = useState<Record<string, boolean>>({});
  // Insurance toggle
  const [hasInsurance, setHasInsurance] = useState<boolean | null>(null);

  useEffect(() => {
    track({ type: 'screen_view', screen: 'body-intel' });
  }, []);

  // Auto-detect destination from latest trip if not provided
  useEffect(() => {
    if (!destination && trips.length > 0) {
      setDestination(trips[0].destination);
    }
  }, [destination, trips]);

  // Load persisted checklist state when destination changes
  useEffect(() => {
    if (!destination) return;
    loadCheckedItems(destination).then((items) => {
      const vaccines: Record<string, boolean> = {};
      const meds: Record<string, boolean> = {};
      for (const [k, v] of Object.entries(items)) {
        if (k.startsWith('vax_')) vaccines[k.slice(4)] = v;
        else if (k.startsWith('med_')) meds[k.slice(4)] = v;
      }
      setVaccineChecked(vaccines);
      setMedChecked(meds);
    });
  }, [destination]);

  // Fetch weather intel for health correlation
  useEffect(() => {
    if (!destination) {
      setWeatherIntel(null);
      return;
    }
    let cancelled = false;
    getWeatherIntel(destination).then((intel) => {
      if (!cancelled) setWeatherIntel(intel);
    });
    return () => { cancelled = true; };
  }, [destination]);

  // Sonar health query
  const {
    data: healthSonar,
    isLoading: healthLoading,
    error: healthError,
    refetch: healthRefetch,
  } = useSonarQuery(destination || undefined, 'health');

  // Sonar food query (for food safety tips)
  const {
    data: foodSonar,
    isLoading: foodLoading,
    error: foodError,
    refetch: foodRefetch,
  } = useSonarQuery(destination || undefined, 'food');

  const medicalGuide = useMemo(
    () => destination ? getMedicalGuideByDestination(destination) : null,
    [destination]
  );

  const healthBrief = useMemo(
    () => destination ? getHealthBrief(destination) : null,
    [destination]
  );

  const symptomIntel = useMemo(
    () => selectedCategory ? getSymptomIntel(destination, selectedCategory) : null,
    [destination, selectedCategory]
  );

  const region = useMemo(() => destination ? getRegion(destination) : 'europe', [destination]);
  const emergencyPhrase = useMemo(() => EMERGENCY_PHRASES[region], [region]);
  const altitudeInfo = useMemo(() => destination ? getAltitudeInfo(destination) : null, [destination]);

  // Parse sonar health answer into sections
  const sonarHealthAnswer = healthSonar?.answer ?? '';

  // ── Handlers ──────────────────────────────────────────────────────────────

  const handleCategorySelect = useCallback((id: string) => {
    Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Medium);
    setSelectedCategory(id);
    captureEvent('body_intel_symptom_selected', { category: id, destination });
  }, [destination]);

  const toggleSection = useCallback((section: string) => {
    Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
    setExpandedSection((prev) => prev === section ? null : section);
  }, []);

  const handleBack = useCallback(() => {
    if (selectedCategory) {
      setSelectedCategory(null);
    } else {
      router.back();
    }
  }, [selectedCategory, router]);

  const toggleVaccine = useCallback((id: string) => {
    Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
    setVaccineChecked((prev) => {
      const next = { ...prev, [id]: !prev[id] };
      // persist — flatten with prefix
      const allItems: Record<string, boolean> = {};
      for (const [k, v] of Object.entries(next)) allItems[`vax_${k}`] = v;
      for (const [k, v] of Object.entries(medChecked)) allItems[`med_${k}`] = v;
      saveCheckedItems(destination, allItems);
      return next;
    });
  }, [destination, medChecked]);

  const toggleMed = useCallback((id: string) => {
    Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
    setMedChecked((prev) => {
      const next = { ...prev, [id]: !prev[id] };
      const allItems: Record<string, boolean> = {};
      for (const [k, v] of Object.entries(vaccineChecked)) allItems[`vax_${k}`] = v;
      for (const [k, v] of Object.entries(next)) allItems[`med_${k}`] = v;
      saveCheckedItems(destination, allItems);
      return next;
    });
  }, [destination, vaccineChecked]);

  const toggleInsurance = useCallback((val: boolean) => {
    Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Medium);
    setHasInsurance(val);
  }, []);

  const openInsuranceLink = useCallback((url: string) => {
    Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
    Linking.openURL(url).catch(() => null);
  }, []);

  // ── Render ─────────────────────────────────────────────────────────────────

  return (
    <View style={[styles.container, { paddingTop: insets.top }]}>
      {/* Header */}
      <View style={styles.header}>
        <Pressable onPress={handleBack} hitSlop={12}>
          <ArrowLeft size={24} color={COLORS.cream} strokeWidth={1.5} />
        </Pressable>
        <View style={styles.headerCenter}>
          <Text style={styles.headerTitle}>
            {t('bodyIntel.title', { defaultValue: 'Health Prep' })}
          </Text>
          {destination ? (
            <Text style={styles.headerSub}>{destination}</Text>
          ) : null}
        </View>
        <Activity size={20} color={COLORS.sage} strokeWidth={1.5} />
      </View>

      {/* Disclaimer */}
      <View style={styles.disclaimer}>
        <Info size={12} color={COLORS.creamMuted} strokeWidth={1.5} />
        <Text style={styles.disclaimerText}>
          {t('bodyIntel.disclaimer', { defaultValue: 'Travel health information only. Not a substitute for professional medical advice.' })}
        </Text>
      </View>

      <ScrollView
        contentContainerStyle={styles.scrollContent}
        showsVerticalScrollIndicator={false}
      >
        {/* Destination selector if none set */}
        {!destination && (
          <View style={styles.destSelector}>
            <Text style={styles.sectionTitle}>
              {t('bodyIntel.selectDestination', { defaultValue: 'Select your destination' })}
            </Text>
            <View style={styles.destInputWrap}>
              <Search size={16} color={COLORS.creamMuted} strokeWidth={1.5} />
              <TextInput
                style={styles.destInput}
                value={destination}
                onChangeText={setDestination}
                placeholder={t('bodyIntel.wherePlaceholder', { defaultValue: 'Where are you going?' })}
                placeholderTextColor={COLORS.creamDim}
              />
            </View>
          </View>
        )}

        {destination && !selectedCategory && (
          <>
            {/* ── 1. VACCINE REQUIREMENTS ─────────────────────────────────── */}
            <View style={styles.section}>
              <SectionHeader
                icon={<Syringe size={18} color={COLORS.sage} strokeWidth={1.5} />}
                title={t('bodyIntel.vaccines', { defaultValue: 'Vaccine Requirements' })}
              />

              {healthLoading ? (
                <SonarLoadingCard />
              ) : healthError ? (
                <SonarErrorCard onRetry={healthRefetch} />
              ) : sonarHealthAnswer ? (
                <View style={styles.sonarCard}>
                  <Text style={styles.sonarAnswer}>{sonarHealthAnswer}</Text>
                  {/* Static vaccine checklist items — user marks as done */}
                  <View style={styles.vaccineChecklistWrap}>
                    <Text style={styles.checklistTitle}>Mark as prepared:</Text>
                    {[
                      { id: 'routine', name: 'Routine vaccines up to date', timing: 'Check 6-8 weeks before travel' },
                      { id: 'hepatitis_a', name: 'Hepatitis A', timing: 'Get 2 weeks before travel' },
                      { id: 'hepatitis_b', name: 'Hepatitis B', timing: 'Series takes 6 months — plan ahead' },
                      { id: 'typhoid', name: 'Typhoid', timing: 'Get 2 weeks before travel' },
                      { id: 'yellow_fever', name: 'Yellow Fever', timing: 'Certificate required for some countries' },
                      { id: 'malaria_meds', name: 'Malaria prophylaxis (where needed)', timing: 'Start before travel — consult doctor' },
                    ].map((vax) => (
                      <Pressable
                        key={vax.id}
                        onPress={() => toggleVaccine(vax.id)}
                        style={styles.checklistItem}
                      >
                        {vaccineChecked[vax.id] ? (
                          <CheckSquare size={18} color={COLORS.sage} strokeWidth={1.5} />
                        ) : (
                          <Square size={18} color={COLORS.creamMuted} strokeWidth={1.5} />
                        )}
                        <View style={{ flex: 1 }}>
                          <Text style={[
                            styles.checklistItemLabel,
                            vaccineChecked[vax.id] && styles.checklistItemDone,
                          ]}>
                            {vax.name}
                          </Text>
                          <Text style={styles.checklistItemTiming}>{vax.timing}</Text>
                        </View>
                      </Pressable>
                    ))}
                  </View>
                </View>
              ) : (
                <View style={styles.sonarCard}>
                  <Text style={styles.sonarAnswer}>
                    {healthBrief?.vaccinations ?? 'Check with your doctor or travel clinic 4-6 weeks before departure.'}
                  </Text>
                </View>
              )}
            </View>

            {/* ── 2. WATER SAFETY ─────────────────────────────────────────── */}
            <View style={styles.section}>
              <SectionHeader
                icon={<Droplets size={18} color={COLORS.sage} strokeWidth={1.5} />}
                title={t('bodyIntel.waterSafety', { defaultValue: 'Water Safety' })}
              />
              {medicalGuide ? (
                <WaterSafetySection guide={medicalGuide} destination={destination} />
              ) : (
                <View style={styles.sonarCard}>
                  <Text style={styles.sonarAnswer}>
                    Always check local water safety before drinking tap water. When in doubt, drink bottled water and ensure the seal is intact.
                  </Text>
                </View>
              )}
            </View>

            {/* ── 3. ALTITUDE WARNING (conditional) ───────────────────────── */}
            {altitudeInfo ? (
              <View style={styles.section}>
                <SectionHeader
                  icon={<Mountain size={18} color={COLORS.gold} strokeWidth={1.5} />}
                  title={t('bodyIntel.altitude', { defaultValue: 'Altitude Warning' })}
                />
                <AltitudeWarningCard info={altitudeInfo} />
              </View>
            ) : null}

            {/* ── 4. MEDICATION CHECKLIST ──────────────────────────────────── */}
            <View style={styles.section}>
              <SectionHeader
                icon={<Pill size={18} color={COLORS.sage} strokeWidth={1.5} />}
                title={t('bodyIntel.medicationChecklist', { defaultValue: 'Travel Kit Checklist' })}
              />
              <View style={styles.card}>
                {MEDICATION_CHECKLIST.map((item) => (
                  <Pressable
                    key={item.id}
                    onPress={() => toggleMed(item.id)}
                    style={styles.checklistItem}
                  >
                    {medChecked[item.id] ? (
                      <CheckSquare size={18} color={COLORS.sage} strokeWidth={1.5} />
                    ) : (
                      <Square size={18} color={COLORS.creamMuted} strokeWidth={1.5} />
                    )}
                    <View style={{ flex: 1 }}>
                      <Text style={[
                        styles.checklistItemLabel,
                        medChecked[item.id] && styles.checklistItemDone,
                      ]}>
                        {item.name}
                      </Text>
                      <Text style={styles.checklistItemTiming}>{item.note}</Text>
                    </View>
                  </Pressable>
                ))}
              </View>
            </View>

            {/* ── 5. TRAVEL INSURANCE REMINDER ─────────────────────────────── */}
            <View style={styles.section}>
              <SectionHeader
                icon={<Shield size={18} color={COLORS.gold} strokeWidth={1.5} />}
                title={t('bodyIntel.insurance', { defaultValue: 'Travel Insurance' })}
              />
              <InsuranceCard
                hasInsurance={hasInsurance}
                onToggle={toggleInsurance}
                onOpenLink={openInsuranceLink}
              />
            </View>

            {/* ── 6. FOOD SAFETY TIPS ──────────────────────────────────────── */}
            <View style={styles.section}>
              <SectionHeader
                icon={<Utensils size={18} color={COLORS.sage} strokeWidth={1.5} />}
                title={t('bodyIntel.foodSafety', { defaultValue: 'Food Safety' })}
              />
              {foodLoading ? (
                <SonarLoadingCard />
              ) : foodError ? (
                <SonarErrorCard onRetry={foodRefetch} />
              ) : foodSonar?.answer ? (
                <View style={styles.sonarCard}>
                  <Text style={styles.sonarAnswerLabel}>
                    In {destination}:
                  </Text>
                  <Text style={styles.sonarAnswer}>{foodSonar.answer}</Text>
                </View>
              ) : (
                <View style={styles.sonarCard}>
                  <FoodSafetyFallback destination={destination} region={region} />
                </View>
              )}
            </View>

            {/* ── HEALTH BRIEF (weather + risks) ──────────────────────────── */}
            <View style={styles.section}>
              <SectionHeader
                icon={<Activity size={18} color={COLORS.sage} strokeWidth={1.5} />}
                title={t('bodyIntel.healthBrief', { defaultValue: 'Health Brief' })}
              />
              <View style={styles.briefGap}>
                {/* Weather-Health Correlation */}
                {weatherIntel?.days?.[0] ? (
                  <View style={styles.briefCard}>
                    <Activity size={16} color={COLORS.gold} strokeWidth={1.5} />
                    <View style={{ flex: 1 }}>
                      <Text style={styles.briefLabel}>
                        {t('bodyIntel.weatherHealth', { defaultValue: 'Weather & Health' })}
                      </Text>
                      <Text style={styles.briefValue}>
                        {`Temp: ${Math.round(weatherIntel.days[0].tempLow)}–${Math.round(weatherIntel.days[0].tempHigh)}C`}
                      </Text>
                      <Text style={styles.briefValue}>
                        {`Humidity: ${weatherIntel.days[0].humidity}%`}
                      </Text>
                      {weatherIntel.days[0].humidity > 80 ? (
                        <Text style={[styles.briefValue, { color: COLORS.gold }]}>
                          High humidity — stay hydrated, risk of heat exhaustion
                        </Text>
                      ) : null}
                      {weatherIntel.days[0].tempHigh > 35 ? (
                        <Text style={[styles.briefValue, { color: COLORS.coral }]}>
                          Extreme heat — limit outdoor activity, wear sunscreen
                        </Text>
                      ) : null}
                      {weatherIntel.days[0].tempLow < 0 ? (
                        <Text style={[styles.briefValue, { color: COLORS.sage }]}>
                          Freezing temps — layer up, watch for hypothermia
                        </Text>
                      ) : null}
                    </View>
                  </View>
                ) : null}

                {/* Health risks */}
                {medicalGuide && medicalGuide.healthRisks.length > 0 && (
                  <Pressable
                    onPress={() => toggleSection('risks')}
                    style={styles.briefCard}
                  >
                    <AlertTriangle size={16} color={COLORS.gold} strokeWidth={1.5} />
                    <View style={{ flex: 1 }}>
                      <Text style={styles.briefLabel}>
                        {t('bodyIntel.healthRisks', { defaultValue: 'Health Risks' })}
                      </Text>
                      {expandedSection === 'risks' ? (
                        medicalGuide.healthRisks.map((risk, i) => (
                          <Text key={i} style={styles.riskItem}>{risk}</Text>
                        ))
                      ) : (
                        <Text style={styles.briefValue} numberOfLines={1}>
                          {medicalGuide.healthRisks[0]}
                        </Text>
                      )}
                    </View>
                    <ChevronDown
                      size={16}
                      color={COLORS.creamMuted}
                      strokeWidth={1.5}
                      style={{ transform: [{ rotate: expandedSection === 'risks' ? '180deg' : '0deg' }] }}
                    />
                  </Pressable>
                )}

                {/* Emergency numbers */}
                {medicalGuide && (
                  <View style={styles.emergencyCard}>
                    <Phone size={16} color={COLORS.coral} strokeWidth={1.5} />
                    <View style={{ flex: 1 }}>
                      <Text style={styles.emergencyLabel}>
                        {t('bodyIntel.emergencyNumbers', { defaultValue: 'Emergency Numbers' })}
                      </Text>
                      <Text style={styles.emergencyNumber}>
                        {`Emergency: ${medicalGuide.emergencyNumber}  |  Ambulance: ${medicalGuide.ambulanceNumber}  |  Police: ${medicalGuide.policeNumber}`}
                      </Text>
                      <Text style={styles.emergencyNote}>{medicalGuide.englishNote}</Text>
                    </View>
                  </View>
                )}

                {/* Emergency phrase */}
                {emergencyPhrase && (
                  <View style={styles.phraseCard}>
                    <Text style={styles.phraseLabel}>
                      {`Say this in an emergency (${emergencyPhrase.language}):`}
                    </Text>
                    <Text style={styles.phraseText}>{emergencyPhrase.phonetic}</Text>
                  </View>
                )}
              </View>
            </View>

            {/* ── SYMPTOM CHECKER ─────────────────────────────────────────── */}
            <View style={styles.section}>
              <SectionHeader
                icon={<Heart size={18} color={COLORS.coral} strokeWidth={1.5} />}
                title={t('bodyIntel.whatExperiencing', { defaultValue: "What are you experiencing?" })}
              />
              <Text style={styles.sectionSub}>
                {t('bodyIntel.symptomSub', { defaultValue: 'Select a symptom for destination-specific guidance' })}
              </Text>
              <View style={styles.symptomGrid}>
                {SYMPTOM_CATEGORIES.map((cat) => (
                  <Pressable
                    key={cat.id}
                    onPress={() => handleCategorySelect(cat.id)}
                    style={({ pressed }) => [
                      styles.symptomCard,
                      { opacity: pressed ? 0.8 : 1, transform: [{ scale: pressed ? 0.97 : 1 }] },
                    ]}
                  >
                    <Text style={styles.symptomCardLabel}>{cat.label}</Text>
                    <ChevronRight size={14} color={COLORS.creamMuted} strokeWidth={1.5} />
                  </Pressable>
                ))}
              </View>
            </View>

            {/* ── WHERE TO GO FOR HELP ─────────────────────────────────────── */}
            {medicalGuide && (
              <View style={styles.section}>
                <SectionHeader
                  icon={<Phone size={18} color={COLORS.coral} strokeWidth={1.5} />}
                  title={t('bodyIntel.whereToGo', { defaultValue: 'Where to go for help' })}
                />
                <View style={styles.briefGap}>
                  {medicalGuide.whereToGo.map((item, i) => (
                    <View key={i} style={styles.whereCard}>
                      <Text style={styles.whereCondition}>{item.condition}</Text>
                      <Text style={styles.whereGo}>{item.go}</Text>
                    </View>
                  ))}
                </View>
              </View>
            )}
          </>
        )}

        {/* ── SYMPTOM DETAIL VIEW ─────────────────────────────────────────── */}
        {selectedCategory && symptomIntel && (
          <View style={styles.detailView}>
            <Text style={styles.detailTitle}>
              {SYMPTOM_CATEGORIES.find((c) => c.id === selectedCategory)?.label}
            </Text>
            <Text style={styles.detailDest}>in {destination}</Text>

            <RiskBadge level={symptomIntel.riskLevel} />

            <View style={styles.detailSection}>
              <Text style={styles.detailSectionTitle}>
                {t('bodyIntel.likelyCauses', { defaultValue: 'Most likely causes here' })}
              </Text>
              {symptomIntel.commonCauses.map((cause, i) => (
                <View key={i} style={styles.detailItem}>
                  <View style={styles.detailBullet} />
                  <Text style={styles.detailItemText}>{cause}</Text>
                </View>
              ))}
            </View>

            <View style={styles.detailSection}>
              <Text style={styles.detailSectionTitle}>
                {t('bodyIntel.whatToDo', { defaultValue: 'What to do right now' })}
              </Text>
              {symptomIntel.whatToDo.map((step, i) => (
                <View key={i} style={styles.detailItem}>
                  <Text style={styles.detailStepNum}>{i + 1}</Text>
                  <Text style={styles.detailItemText}>{step}</Text>
                </View>
              ))}
            </View>

            <View style={[styles.detailSection, styles.doctorSection]}>
              <Text style={styles.detailSectionTitle}>
                {t('bodyIntel.seeDoctor', { defaultValue: 'See a doctor if' })}
              </Text>
              <Text style={styles.doctorText}>{symptomIntel.seeDoctor}</Text>
            </View>

            <View style={styles.medSection}>
              <Pill size={16} color={COLORS.sage} strokeWidth={1.5} />
              <View style={{ flex: 1 }}>
                <Text style={styles.medLabel}>
                  {t('bodyIntel.atPharmacy', { defaultValue: 'At the pharmacy' })}
                </Text>
                <Text style={styles.medText}>{symptomIntel.localMedication}</Text>
              </View>
            </View>

            {medicalGuide && (
              <View style={styles.quickEmergency}>
                <Phone size={14} color={COLORS.coral} strokeWidth={1.5} />
                <Text style={styles.quickEmergencyText}>
                  {`Emergency: ${medicalGuide.emergencyNumber}  |  Ambulance: ${medicalGuide.ambulanceNumber}`}
                </Text>
              </View>
            )}
          </View>
        )}
      </ScrollView>
    </View>
  );
}

// ---------------------------------------------------------------------------
// Water Safety Section
// ---------------------------------------------------------------------------
function WaterSafetySection({ guide, destination }: { guide: MedicalGuide; destination: string }) {
  const safe = guide.tapWaterSafe;
  return (
    <View style={[styles.waterCard, { borderColor: safe ? COLORS.sage + '30' : COLORS.coral + '30' }]}>
      <View style={styles.waterBadgeRow}>
        <Droplets size={16} color={safe ? COLORS.sage : COLORS.coral} strokeWidth={1.5} />
        <View style={[
          styles.waterBadge,
          { backgroundColor: safe ? COLORS.sage + '15' : COLORS.coral + '15' },
        ]}>
          <Text style={[styles.waterBadgeText, { color: safe ? COLORS.sage : COLORS.coral }]}>
            {safe ? 'TAP WATER SAFE' : 'USE BOTTLED WATER'}
          </Text>
        </View>
      </View>
      <Text style={styles.waterLabel}>
        {safe
          ? `Tap water is safe to drink in ${destination}.`
          : `Do not drink tap water in ${destination}.`
        }
      </Text>
      {!safe && (
        <View style={styles.waterTips}>
          <Text style={styles.waterTip}>Buy bottled water — check the seal is intact before drinking.</Text>
          <Text style={styles.waterTip}>Avoid ice in drinks — it is often made from tap water.</Text>
          <Text style={styles.waterTip}>Use bottled water when brushing teeth.</Text>
          <Text style={styles.waterTip}>Boiling tap water for 1 min makes it safe if bottled is unavailable.</Text>
        </View>
      )}
      {guide.waterNote ? (
        <Text style={styles.waterNote}>{guide.waterNote}</Text>
      ) : null}
    </View>
  );
}

// ---------------------------------------------------------------------------
// Altitude Warning Card
// ---------------------------------------------------------------------------
function AltitudeWarningCard({ info }: { info: { meters: number; city: string } }) {
  return (
    <View style={[styles.card, { borderColor: COLORS.gold + '30' }]}>
      <View style={styles.altitudeBadgeRow}>
        <Mountain size={16} color={COLORS.gold} strokeWidth={1.5} />
        <Text style={styles.altitudeMeters}>{info.meters.toLocaleString()} m</Text>
        <Text style={styles.altitudeCity}>{info.city}</Text>
      </View>
      <Text style={styles.altitudeWarning}>
        High altitude destination. Allow 1-3 days to acclimatize before strenuous activity.
      </Text>
      <View style={styles.altitudeTips}>
        <Text style={styles.altitudeTipTitle}>Acclimatization tips:</Text>
        <Text style={styles.altitudeTip}>Arrive early and rest your first day. No hiking or exercise.</Text>
        <Text style={styles.altitudeTip}>Drink 3-4 liters of water per day. Avoid alcohol the first 48h.</Text>
        <Text style={styles.altitudeTip}>Ascend gradually — if hiking, follow: climb high, sleep low.</Text>
        <Text style={styles.altitudeTip}>Diamox (acetazolamide) available by prescription — talk to your doctor.</Text>
      </View>
      <View style={styles.altitudeSymptoms}>
        <Text style={styles.altitudeTipTitle}>Watch for these symptoms (Acute Mountain Sickness):</Text>
        <Text style={styles.altitudeTip}>Headache, nausea, dizziness, fatigue at altitude</Text>
        <Text style={styles.altitudeTip}>Shortness of breath at rest — descend immediately</Text>
        <Text style={[styles.altitudeTip, { color: COLORS.coral }]}>
          Confusion or ataxia (loss of coordination) — medical emergency, descend now
        </Text>
      </View>
    </View>
  );
}

// ---------------------------------------------------------------------------
// Insurance Card
// ---------------------------------------------------------------------------
function InsuranceCard({
  hasInsurance,
  onToggle,
  onOpenLink,
}: {
  hasInsurance: boolean | null;
  onToggle: (val: boolean) => void;
  onOpenLink: (url: string) => void;
}) {
  return (
    <View style={[styles.card, { borderColor: COLORS.gold + '30' }]}>
      <Text style={styles.insuranceQuestion}>Do you have travel insurance?</Text>
      <View style={styles.insuranceToggleRow}>
        <Pressable
          onPress={() => onToggle(true)}
          style={[
            styles.insuranceToggleBtn,
            hasInsurance === true && styles.insuranceToggleBtnActive,
          ]}
        >
          <Text style={[
            styles.insuranceToggleBtnText,
            hasInsurance === true && { color: COLORS.sage },
          ]}>
            YES
          </Text>
        </Pressable>
        <Pressable
          onPress={() => onToggle(false)}
          style={[
            styles.insuranceToggleBtn,
            hasInsurance === false && styles.insuranceToggleBtnDanger,
          ]}
        >
          <Text style={[
            styles.insuranceToggleBtnText,
            hasInsurance === false && { color: COLORS.coral },
          ]}>
            NO
          </Text>
        </Pressable>
      </View>

      {hasInsurance === true && (
        <Text style={styles.insuranceGood}>
          You are covered. Make sure you know your policy number and emergency contact number.
        </Text>
      )}

      {hasInsurance === false && (
        <View style={styles.insuranceWarningWrap}>
          <AlertTriangle size={14} color={COLORS.coral} strokeWidth={1.5} />
          <Text style={styles.insuranceWarning}>
            Get covered before you go. Medical evacuation alone can cost $50,000+. A single hospital stay abroad can exceed $10,000.
          </Text>
        </View>
      )}

      {hasInsurance === false && (
        <View style={styles.insuranceProviders}>
          <Text style={styles.insuranceProvidersTitle}>Common providers:</Text>
          {INSURANCE_PROVIDERS.map((p) => (
            <Pressable
              key={p.name}
              onPress={() => onOpenLink(p.url)}
              style={styles.insuranceProviderRow}
            >
              <Text style={styles.insuranceProviderName}>{p.name}</Text>
              <ExternalLink size={12} color={COLORS.sage} strokeWidth={1.5} />
            </Pressable>
          ))}
        </View>
      )}
    </View>
  );
}

// ---------------------------------------------------------------------------
// Food Safety Fallback (no sonar data)
// ---------------------------------------------------------------------------
function FoodSafetyFallback({ destination, region }: { destination: string; region: RegionId }) {
  const tips: Record<RegionId, string[]> = {
    'southeast-asia': [
      'Eat at busy stalls — high turnover means fresher food.',
      'Avoid raw salads washed in tap water.',
      'Skip ice in drinks unless from a sealed bag.',
      'Cooked street food served hot is generally safer than restaurants.',
      'Shellfish and raw seafood carry higher risk in tropical heat.',
    ],
    'east-asia': [
      'Food safety standards are high — restaurants are generally safe.',
      'Raw fish (sashimi, sushi) is safe at reputable establishments.',
      'Fermented foods can cause digestive upset until you adjust.',
      'Convenience store food is consistently safe and freshly restocked.',
      'Avoid unpasteurized dairy products.',
    ],
    'south-asia': [
      'Avoid raw vegetables and salads unless you can confirm they were washed in purified water.',
      'Stick to freshly cooked food served hot.',
      'Avoid cut fruit sold on the street.',
      'Packaged and sealed snacks are safer than loose street food.',
      'Bottled water only — never tap.',
    ],
    'europe': [
      'Food safety standards are high across the EU.',
      'Tap water is generally safe to drink.',
      'Raw shellfish (oysters) carry risk — eat at reputable restaurants.',
      'Mediterranean heat: avoid foods left out in summer heat.',
      'Unpasteurized cheese sold at markets — eat carefully if immunocompromised.',
    ],
    'latin-america': [
      'Avoid raw vegetables and salads unless confirmed safe.',
      'Street food cooked fresh in front of you is generally safer.',
      'Avoid cut fruit unless you peel it yourself.',
      'Ceviche is safe at established restaurants, risky at street stalls.',
      'Bottled water only in most destinations.',
    ],
    'middle-east': [
      'Food hygiene standards vary by country and establishment.',
      'Avoid raw salads unless at reputable restaurants.',
      'During Ramadan, be aware of restaurants only serving after sunset.',
      'Packaged and sealed food is safest.',
      'Tap water varies by country — check locally.',
    ],
    'africa': [
      'Avoid tap water and ice.',
      'Eat freshly cooked food served hot.',
      'Avoid raw vegetables, salads, and unpeeled fruit.',
      'Bushmeat and game carry additional disease risk.',
      'Bottled water only.',
    ],
    'north-america': [
      'Food safety standards are high.',
      'Tap water is safe in most major cities.',
      'Food allergies: staff are trained to handle allergen requests.',
      'Raw oysters carry risk — eat at established restaurants only.',
      'Food truck/street food is regulated and generally safe.',
    ],
    'oceania': [
      'Food safety standards are very high.',
      'Tap water is safe to drink.',
      'Beach BBQs: ensure meat is fully cooked in summer heat.',
      'Fresh produce may carry different bacteria for first-time visitors.',
      'Seafood quality is excellent — safe at any registered establishment.',
    ],
  };

  const regionTips = tips[region] ?? tips['europe'];

  return (
    <>
      <Text style={styles.sonarAnswerLabel}>In {destination}:</Text>
      {regionTips.map((tip, i) => (
        <View key={i} style={styles.foodTipRow}>
          <View style={styles.detailBullet} />
          <Text style={styles.sonarAnswer}>{tip}</Text>
        </View>
      ))}
    </>
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
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: SPACING.lg,
    paddingVertical: SPACING.md,
  } as ViewStyle,
  headerCenter: { alignItems: 'center' } as ViewStyle,
  headerTitle: {
    fontFamily: FONTS.header,
    fontSize: 22,
    color: COLORS.cream,
  } as TextStyle,
  headerSub: {
    fontFamily: FONTS.mono,
    fontSize: 11,
    color: COLORS.sage,
    letterSpacing: 1,
    textTransform: 'uppercase',
    marginTop: 2,
  } as TextStyle,
  disclaimer: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: SPACING.sm,
    marginHorizontal: SPACING.lg,
    paddingVertical: SPACING.xs,
    paddingHorizontal: SPACING.sm,
    backgroundColor: COLORS.bgGlass,
    borderRadius: RADIUS.md,
    marginBottom: SPACING.sm,
  } as ViewStyle,
  disclaimerText: {
    fontFamily: FONTS.body,
    fontSize: 11,
    color: COLORS.creamMuted,
    flex: 1,
  } as TextStyle,
  scrollContent: {
    paddingHorizontal: SPACING.lg,
    paddingBottom: SPACING.xxxl,
    gap: SPACING.xl,
  } as ViewStyle,
  // Destination selector
  destSelector: { marginBottom: SPACING.xl } as ViewStyle,
  destInputWrap: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: SPACING.sm,
    backgroundColor: COLORS.bgCard,
    borderRadius: RADIUS.md,
    borderWidth: 1,
    borderColor: COLORS.border,
    padding: SPACING.md,
  } as ViewStyle,
  destInput: {
    flex: 1,
    fontFamily: FONTS.body,
    fontSize: 16,
    color: COLORS.cream,
  } as TextStyle,
  // Section layout
  section: {
    gap: SPACING.sm,
  } as ViewStyle,
  sectionHeaderRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: SPACING.sm,
    marginBottom: 2,
  } as ViewStyle,
  sectionTitle: {
    fontFamily: FONTS.header,
    fontSize: 18,
    color: COLORS.cream,
  } as TextStyle,
  sectionSub: {
    fontFamily: FONTS.body,
    fontSize: 13,
    color: COLORS.creamMuted,
    marginBottom: SPACING.xs,
  } as TextStyle,
  // Cards
  card: {
    backgroundColor: COLORS.bgCard,
    borderRadius: RADIUS.md,
    borderWidth: 1,
    borderColor: COLORS.border,
    padding: SPACING.md,
    gap: SPACING.sm,
  } as ViewStyle,
  sonarCard: {
    backgroundColor: COLORS.bgCard,
    borderRadius: RADIUS.md,
    borderWidth: 1,
    borderColor: COLORS.border,
    padding: SPACING.md,
    gap: SPACING.sm,
  } as ViewStyle,
  sonarAnswer: {
    fontFamily: FONTS.body,
    fontSize: 14,
    color: COLORS.creamMuted,
    lineHeight: 22,
  } as TextStyle,
  sonarAnswerLabel: {
    fontFamily: FONTS.bodySemiBold,
    fontSize: 14,
    color: COLORS.cream,
    marginBottom: 2,
  } as TextStyle,
  sonarLoadingCard: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: SPACING.sm,
    backgroundColor: COLORS.bgCard,
    borderRadius: RADIUS.md,
    borderWidth: 1,
    borderColor: COLORS.border,
    padding: SPACING.md,
  } as ViewStyle,
  sonarLoadingText: {
    fontFamily: FONTS.body,
    fontSize: 13,
    color: COLORS.creamMuted,
  } as TextStyle,
  sonarErrorCard: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: SPACING.sm,
    backgroundColor: COLORS.bgCard,
    borderRadius: RADIUS.md,
    borderWidth: 1,
    borderColor: COLORS.border,
    padding: SPACING.md,
  } as ViewStyle,
  sonarErrorText: {
    fontFamily: FONTS.body,
    fontSize: 13,
    color: COLORS.creamMuted,
    flex: 1,
  } as TextStyle,
  retryBtn: {
    paddingHorizontal: SPACING.sm,
    paddingVertical: 4,
    backgroundColor: COLORS.sage + '20',
    borderRadius: RADIUS.sm,
    borderWidth: 1,
    borderColor: COLORS.sage + '30',
  } as ViewStyle,
  retryBtnText: {
    fontFamily: FONTS.mono,
    fontSize: 11,
    color: COLORS.sage,
    letterSpacing: 0.5,
  } as TextStyle,
  // Vaccine checklist
  vaccineChecklistWrap: {
    gap: SPACING.xs,
    marginTop: SPACING.xs,
    paddingTop: SPACING.sm,
    borderTopWidth: 1,
    borderTopColor: COLORS.border,
  } as ViewStyle,
  checklistTitle: {
    fontFamily: FONTS.mono,
    fontSize: 10,
    color: COLORS.creamMuted,
    letterSpacing: 0.5,
    textTransform: 'uppercase',
    marginBottom: SPACING.xs,
  } as TextStyle,
  checklistItem: {
    flexDirection: 'row',
    alignItems: 'flex-start',
    gap: SPACING.sm,
    paddingVertical: SPACING.xs + 2,
  } as ViewStyle,
  checklistItemLabel: {
    fontFamily: FONTS.bodyMedium,
    fontSize: 14,
    color: COLORS.cream,
    lineHeight: 20,
  } as TextStyle,
  checklistItemDone: {
    color: COLORS.creamMuted,
    textDecorationLine: 'line-through',
  } as TextStyle,
  checklistItemTiming: {
    fontFamily: FONTS.mono,
    fontSize: 11,
    color: COLORS.creamMuted,
    marginTop: 1,
    letterSpacing: 0.2,
  } as TextStyle,
  // Water safety
  waterCard: {
    backgroundColor: COLORS.bgCard,
    borderRadius: RADIUS.md,
    borderWidth: 1,
    padding: SPACING.md,
    gap: SPACING.sm,
  } as ViewStyle,
  waterBadgeRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: SPACING.sm,
  } as ViewStyle,
  waterBadge: {
    paddingHorizontal: SPACING.sm,
    paddingVertical: 3,
    borderRadius: RADIUS.pill,
  } as ViewStyle,
  waterBadgeText: {
    fontFamily: FONTS.mono,
    fontSize: 10,
    letterSpacing: 1,
  } as TextStyle,
  waterLabel: {
    fontFamily: FONTS.bodyMedium,
    fontSize: 14,
    color: COLORS.cream,
    lineHeight: 20,
  } as TextStyle,
  waterTips: {
    gap: 4,
  } as ViewStyle,
  waterTip: {
    fontFamily: FONTS.body,
    fontSize: 13,
    color: COLORS.creamMuted,
    lineHeight: 20,
  } as TextStyle,
  waterNote: {
    fontFamily: FONTS.body,
    fontSize: 12,
    color: COLORS.creamMuted,
    fontStyle: 'italic',
  } as TextStyle,
  // Altitude
  altitudeBadgeRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: SPACING.sm,
    marginBottom: SPACING.xs,
  } as ViewStyle,
  altitudeMeters: {
    fontFamily: FONTS.mono,
    fontSize: 16,
    color: COLORS.gold,
    letterSpacing: 0.5,
  } as TextStyle,
  altitudeCity: {
    fontFamily: FONTS.bodySemiBold,
    fontSize: 14,
    color: COLORS.cream,
  } as TextStyle,
  altitudeWarning: {
    fontFamily: FONTS.bodyMedium,
    fontSize: 14,
    color: COLORS.cream,
    lineHeight: 20,
  } as TextStyle,
  altitudeTips: {
    gap: 4,
    marginTop: SPACING.xs,
  } as ViewStyle,
  altitudeSymptoms: {
    gap: 4,
    marginTop: SPACING.xs,
    paddingTop: SPACING.sm,
    borderTopWidth: 1,
    borderTopColor: COLORS.border,
  } as ViewStyle,
  altitudeTipTitle: {
    fontFamily: FONTS.bodySemiBold,
    fontSize: 13,
    color: COLORS.cream,
    marginBottom: 4,
  } as TextStyle,
  altitudeTip: {
    fontFamily: FONTS.body,
    fontSize: 13,
    color: COLORS.creamMuted,
    lineHeight: 20,
    paddingLeft: SPACING.sm,
  } as TextStyle,
  // Insurance
  insuranceQuestion: {
    fontFamily: FONTS.header,
    fontSize: 16,
    color: COLORS.cream,
  } as TextStyle,
  insuranceToggleRow: {
    flexDirection: 'row',
    gap: SPACING.sm,
  } as ViewStyle,
  insuranceToggleBtn: {
    flex: 1,
    paddingVertical: SPACING.sm,
    borderRadius: RADIUS.md,
    borderWidth: 1,
    borderColor: COLORS.border,
    alignItems: 'center',
    backgroundColor: COLORS.bgGlass,
  } as ViewStyle,
  insuranceToggleBtnActive: {
    borderColor: COLORS.sage + '40',
    backgroundColor: COLORS.sage + '10',
  } as ViewStyle,
  insuranceToggleBtnDanger: {
    borderColor: COLORS.coral + '40',
    backgroundColor: COLORS.coral + '10',
  } as ViewStyle,
  insuranceToggleBtnText: {
    fontFamily: FONTS.mono,
    fontSize: 13,
    color: COLORS.creamMuted,
    letterSpacing: 1,
  } as TextStyle,
  insuranceGood: {
    fontFamily: FONTS.body,
    fontSize: 13,
    color: COLORS.sage,
    lineHeight: 20,
  } as TextStyle,
  insuranceWarningWrap: {
    flexDirection: 'row',
    alignItems: 'flex-start',
    gap: SPACING.sm,
  } as ViewStyle,
  insuranceWarning: {
    fontFamily: FONTS.body,
    fontSize: 13,
    color: COLORS.coral,
    lineHeight: 20,
    flex: 1,
  } as TextStyle,
  insuranceProviders: {
    gap: SPACING.xs,
    marginTop: SPACING.xs,
    paddingTop: SPACING.sm,
    borderTopWidth: 1,
    borderTopColor: COLORS.border,
  } as ViewStyle,
  insuranceProvidersTitle: {
    fontFamily: FONTS.mono,
    fontSize: 10,
    color: COLORS.creamMuted,
    letterSpacing: 0.5,
    textTransform: 'uppercase',
    marginBottom: SPACING.xs,
  } as TextStyle,
  insuranceProviderRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingVertical: SPACING.xs,
  } as ViewStyle,
  insuranceProviderName: {
    fontFamily: FONTS.bodyMedium,
    fontSize: 14,
    color: COLORS.sage,
  } as TextStyle,
  // Food tips
  foodTipRow: {
    flexDirection: 'row',
    alignItems: 'flex-start',
    gap: SPACING.sm,
    paddingVertical: 2,
  } as ViewStyle,
  // Brief section (health overview)
  briefGap: {
    gap: SPACING.sm,
  } as ViewStyle,
  briefCard: {
    flexDirection: 'row',
    alignItems: 'flex-start',
    gap: SPACING.sm,
    backgroundColor: COLORS.bgCard,
    borderRadius: RADIUS.md,
    borderWidth: 1,
    borderColor: COLORS.border,
    padding: SPACING.md,
  } as ViewStyle,
  briefLabel: {
    fontFamily: FONTS.bodySemiBold,
    fontSize: 13,
    color: COLORS.cream,
    marginBottom: 2,
  } as TextStyle,
  briefValue: {
    fontFamily: FONTS.body,
    fontSize: 13,
    color: COLORS.creamMuted,
    lineHeight: 18,
  } as TextStyle,
  riskItem: {
    fontFamily: FONTS.body,
    fontSize: 13,
    color: COLORS.creamMuted,
    lineHeight: 18,
    marginTop: SPACING.xs,
  } as TextStyle,
  // Emergency
  emergencyCard: {
    flexDirection: 'row',
    alignItems: 'flex-start',
    gap: SPACING.sm,
    backgroundColor: COLORS.coral + '08',
    borderRadius: RADIUS.md,
    borderWidth: 1,
    borderColor: COLORS.coral + '20',
    padding: SPACING.md,
  } as ViewStyle,
  emergencyLabel: {
    fontFamily: FONTS.bodySemiBold,
    fontSize: 13,
    color: COLORS.coral,
    marginBottom: 2,
  } as TextStyle,
  emergencyNumber: {
    fontFamily: FONTS.mono,
    fontSize: 12,
    color: COLORS.cream,
    letterSpacing: 0.3,
  } as TextStyle,
  emergencyNote: {
    fontFamily: FONTS.body,
    fontSize: 11,
    color: COLORS.creamMuted,
    marginTop: SPACING.xs,
    lineHeight: 16,
  } as TextStyle,
  phraseCard: {
    backgroundColor: COLORS.bgCard,
    borderRadius: RADIUS.md,
    borderWidth: 1,
    borderColor: COLORS.border,
    padding: SPACING.md,
  } as ViewStyle,
  phraseLabel: {
    fontFamily: FONTS.mono,
    fontSize: 10,
    color: COLORS.creamMuted,
    letterSpacing: 0.5,
    marginBottom: SPACING.xs,
  } as TextStyle,
  phraseText: {
    fontFamily: FONTS.bodySemiBold,
    fontSize: 16,
    color: COLORS.cream,
  } as TextStyle,
  // Symptom grid
  symptomGrid: {
    gap: SPACING.xs,
  } as ViewStyle,
  symptomCard: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    backgroundColor: COLORS.bgCard,
    borderRadius: RADIUS.md,
    borderWidth: 1,
    borderColor: COLORS.border,
    padding: SPACING.md,
  } as ViewStyle,
  symptomCardLabel: {
    fontFamily: FONTS.bodySemiBold,
    fontSize: 15,
    color: COLORS.cream,
  } as TextStyle,
  // Where to go
  whereCard: {
    backgroundColor: COLORS.bgCard,
    borderRadius: RADIUS.md,
    borderWidth: 1,
    borderColor: COLORS.border,
    padding: SPACING.md,
  } as ViewStyle,
  whereCondition: {
    fontFamily: FONTS.bodySemiBold,
    fontSize: 13,
    color: COLORS.cream,
    marginBottom: SPACING.xs,
  } as TextStyle,
  whereGo: {
    fontFamily: FONTS.body,
    fontSize: 13,
    color: COLORS.creamMuted,
    lineHeight: 18,
  } as TextStyle,
  // Risk badge
  riskBadge: {
    flexDirection: 'row',
    alignItems: 'center',
    alignSelf: 'flex-start',
    gap: SPACING.sm,
    paddingHorizontal: SPACING.sm + 2,
    paddingVertical: SPACING.xs + 1,
    borderRadius: RADIUS.full,
    borderWidth: 1,
    marginVertical: SPACING.sm,
  } as ViewStyle,
  riskDot: {
    width: 6,
    height: 6,
    borderRadius: 3,
  } as ViewStyle,
  riskLabel: {
    fontFamily: FONTS.mono,
    fontSize: 10,
    letterSpacing: 1,
  } as TextStyle,
  // Detail view (symptom detail)
  detailView: { marginBottom: SPACING.xl } as ViewStyle,
  detailTitle: {
    fontFamily: FONTS.header,
    fontSize: 24,
    color: COLORS.cream,
  } as TextStyle,
  detailDest: {
    fontFamily: FONTS.mono,
    fontSize: 12,
    color: COLORS.sage,
    letterSpacing: 0.5,
    textTransform: 'uppercase',
    marginTop: 2,
  } as TextStyle,
  detailSection: {
    marginTop: SPACING.lg,
  } as ViewStyle,
  detailSectionTitle: {
    fontFamily: FONTS.bodySemiBold,
    fontSize: 15,
    color: COLORS.cream,
    marginBottom: SPACING.sm,
  } as TextStyle,
  detailItem: {
    flexDirection: 'row',
    alignItems: 'flex-start',
    gap: SPACING.sm,
    marginBottom: SPACING.sm,
  } as ViewStyle,
  detailBullet: {
    width: 6,
    height: 6,
    borderRadius: 3,
    backgroundColor: COLORS.sage,
    marginTop: 7,
    flexShrink: 0,
  } as ViewStyle,
  detailStepNum: {
    fontFamily: FONTS.mono,
    fontSize: 12,
    color: COLORS.sage,
    width: 16,
    marginTop: 1,
  } as TextStyle,
  detailItemText: {
    fontFamily: FONTS.body,
    fontSize: 14,
    color: COLORS.cream,
    lineHeight: 20,
    flex: 1,
  } as TextStyle,
  doctorSection: {
    backgroundColor: COLORS.coral + '08',
    borderRadius: RADIUS.md,
    borderWidth: 1,
    borderColor: COLORS.coral + '20',
    padding: SPACING.md,
  } as ViewStyle,
  doctorText: {
    fontFamily: FONTS.body,
    fontSize: 14,
    color: COLORS.cream,
    lineHeight: 20,
  } as TextStyle,
  medSection: {
    flexDirection: 'row',
    alignItems: 'flex-start',
    gap: SPACING.sm,
    backgroundColor: COLORS.sage + '08',
    borderRadius: RADIUS.md,
    borderWidth: 1,
    borderColor: COLORS.sage + '20',
    padding: SPACING.md,
    marginTop: SPACING.lg,
  } as ViewStyle,
  medLabel: {
    fontFamily: FONTS.bodySemiBold,
    fontSize: 13,
    color: COLORS.sage,
    marginBottom: 2,
  } as TextStyle,
  medText: {
    fontFamily: FONTS.body,
    fontSize: 13,
    color: COLORS.creamMuted,
    lineHeight: 18,
  } as TextStyle,
  quickEmergency: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: SPACING.sm,
    marginTop: SPACING.lg,
    padding: SPACING.md,
    backgroundColor: COLORS.coral + '08',
    borderRadius: RADIUS.md,
    borderWidth: 1,
    borderColor: COLORS.coral + '20',
  } as ViewStyle,
  quickEmergencyText: {
    fontFamily: FONTS.mono,
    fontSize: 12,
    color: COLORS.cream,
    flex: 1,
  } as TextStyle,
});
