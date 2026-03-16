// =============================================================================
// ROAM — Body Intel Screen
// Destination-aware health intelligence for travelers.
// NOT medical advice — travel health information only.
// =============================================================================
import React, { useCallback, useEffect, useMemo, useState } from 'react';
import {
  FlatList,
  Pressable,
  ScrollView,
  StyleSheet,
  Text,
  TextInput,
  View,
  type TextStyle,
  type ViewStyle,
} from 'react-native';
import { useLocalSearchParams, useRouter } from 'expo-router';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { LinearGradient } from 'expo-linear-gradient';
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
  Heart,
  Info,
} from 'lucide-react-native';
import * as Haptics from '../lib/haptics';
import { COLORS, FONTS, SPACING, RADIUS } from '../lib/constants';
import { useAppStore } from '../lib/store';
import { getMedicalGuideByDestination, type MedicalGuide } from '../lib/medical-abroad';
import { getHealthBrief, type HealthBrief } from '../lib/health-brief';
import { track } from '../lib/analytics';
import { captureEvent } from '../lib/posthog';
import { withComingSoon } from '../lib/with-coming-soon';

// ---------------------------------------------------------------------------
// Symptom Categories (inline — no emoji, just icons)
// ---------------------------------------------------------------------------
const SYMPTOM_CATEGORIES = [
  { id: 'stomach', label: 'Stomach Issues', icon: 'stomach' },
  { id: 'fever', label: 'Fever / Chills', icon: 'fever' },
  { id: 'skin', label: 'Skin Reaction', icon: 'skin' },
  { id: 'respiratory', label: 'Respiratory', icon: 'respiratory' },
  { id: 'head', label: 'Head / Dizziness', icon: 'head' },
  { id: 'injury', label: 'Injury', icon: 'injury' },
  { id: 'eye-ear', label: 'Eye / Ear Issues', icon: 'eye-ear' },
  { id: 'other', label: 'Other', icon: 'other' },
] as const;

// Region-specific symptom intelligence
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
  return 'europe'; // default
}

// Symptom data by region+category (abbreviated for top combos)
const SYMPTOM_DATA: Record<string, Record<string, SymptomIntel>> = {
  'southeast-asia': {
    stomach: {
      riskLevel: 'high',
      commonCauses: [
        'Traveler\'s diarrhea from street food bacteria',
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
      localMedication: 'Ask for: Oral Rehydration Salts (ORS) — available at any pharmacy without prescription. Brand names: Electral, Pedialyte.',
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
      localMedication: 'Paracetamol (acetaminophen). Brand: Tylenol, Panadol. Do NOT take aspirin or ibuprofen until dengue is ruled out.',
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
      localMedication: 'Japan: Seirogan (herbal, very effective) or Biofermin. Korea: Hwalmyeongsu. Available at any convenience store.',
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
      localMedication: 'Japan: Pabron Gold, Eve (ibuprofen). Korea: Tylenol, Panpyrin. Available at drugstores (kusuriya/yakguk).',
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
      localMedication: 'Smecta (France), Iberogast (Germany), Buscopan (pan-European). Pharmacists can recommend — just describe symptoms.',
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
      seeDoctor: 'If fever exceeds 39C/102F for more than 48 hours. EU citizens: use EHIC card for reduced costs.',
      localMedication: 'Paracetamol (Doliprane in France, Ben-u-ron in Germany). Ibuprofen widely available. Pharmacist can advise.',
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
      localMedication: 'Fenistil gel (anti-itch), Voltaren (anti-inflammatory), Bepanthen (healing cream). All OTC.',
    },
  },
};

// Default fallback for missing region/symptom combos
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

// Emergency phrases
const EMERGENCY_PHRASES: Record<RegionId, { phrase: string; phonetic: string; language: string }> = {
  'east-asia': { phrase: 'I need medical help', phonetic: 'Tasukete kudasai (tah-soo-keh-teh koo-dah-sai)', language: 'Japanese' },
  'southeast-asia': { phrase: 'I need a doctor', phonetic: 'Chuay duay (choo-ay doo-ay)', language: 'Thai' },
  'south-asia': { phrase: 'I need help', phonetic: 'Mujhe madad chahiye (moo-jhay mah-dahd chah-hee-yay)', language: 'Hindi' },
  'europe': { phrase: 'I need medical help', phonetic: 'J\'ai besoin d\'aide medicale (zhay beh-zwan dehd meh-dee-kal)', language: 'French' },
  'latin-america': { phrase: 'I need a doctor', phonetic: 'Necesito un doctor (neh-seh-see-toh oon dok-tor)', language: 'Spanish' },
  'middle-east': { phrase: 'I need help', phonetic: 'Ahtaaj musaada (ah-taaj moo-saa-dah)', language: 'Arabic' },
  'africa': { phrase: 'I need a doctor', phonetic: 'J\'ai besoin d\'un medecin (zhay beh-zwan dun med-san)', language: 'French' },
  'north-america': { phrase: 'I need medical help', phonetic: 'I need medical help', language: 'English' },
  'oceania': { phrase: 'I need medical help', phonetic: 'I need medical help', language: 'English' },
};

// ---------------------------------------------------------------------------
// Risk level badge
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

// ---------------------------------------------------------------------------
// Water safety indicator
// ---------------------------------------------------------------------------
function WaterSafetyCard({ guide }: { guide: MedicalGuide | null; }) {
  if (!guide) return null;
  const safe = guide.tapWaterSafe;
  return (
    <View style={[styles.waterCard, { borderColor: safe ? COLORS.sage + '30' : COLORS.coral + '30' }]}>
      <Droplets size={16} color={safe ? COLORS.sage : COLORS.coral} strokeWidth={2} />
      <View style={{ flex: 1 }}>
        <Text style={[styles.waterLabel, { color: safe ? COLORS.sage : COLORS.coral }]}>
          {safe ? 'Tap water is safe' : 'Use bottled water only'}
        </Text>
        <Text style={styles.waterNote}>{guide.waterNote}</Text>
      </View>
    </View>
  );
}

// ---------------------------------------------------------------------------
// Main Screen
// ---------------------------------------------------------------------------
function BodyIntelScreen() {
  const router = useRouter();
  const insets = useSafeAreaInsets();
  const params = useLocalSearchParams<{ destination?: string }>();
  const trips = useAppStore((s) => s.trips);

  const [destination, setDestination] = useState(params.destination ?? '');
  const [selectedCategory, setSelectedCategory] = useState<string | null>(null);
  const [expandedSection, setExpandedSection] = useState<string | null>(null);

  useEffect(() => {
    track({ type: 'screen_view', screen: 'body-intel' });
  }, []);

  // Auto-detect destination from latest trip if not provided
  useEffect(() => {
    if (!destination && trips.length > 0) {
      setDestination(trips[0].destination);
    }
  }, [destination, trips]);

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

  return (
    <View style={[styles.container, { paddingTop: insets.top }]}>
      {/* Header */}
      <View style={styles.header}>
        <Pressable onPress={handleBack} hitSlop={12}>
          <ArrowLeft size={24} color={COLORS.cream} strokeWidth={2} />
        </Pressable>
        <View style={styles.headerCenter}>
          <Text style={styles.headerTitle}>Body Intel</Text>
          {destination ? (
            <Text style={styles.headerSub}>{destination}</Text>
          ) : null}
        </View>
        <Activity size={20} color={COLORS.sage} strokeWidth={2} />
      </View>

      {/* Disclaimer */}
      <View style={styles.disclaimer}>
        <Info size={12} color={COLORS.creamMuted} strokeWidth={2} />
        <Text style={styles.disclaimerText}>
          Travel health information only. Not a substitute for professional medical advice.
        </Text>
      </View>

      <ScrollView
        contentContainerStyle={styles.scrollContent}
        showsVerticalScrollIndicator={false}
      >
        {/* Destination selector if none set */}
        {!destination && (
          <View style={styles.destSelector}>
            <Text style={styles.sectionTitle}>Select your destination</Text>
            <View style={styles.destInputWrap}>
              <Search size={16} color={COLORS.creamMuted} strokeWidth={2} />
              <TextInput
                style={styles.destInput}
                value={destination}
                onChangeText={setDestination}
                placeholder="Where are you going?"
                placeholderTextColor={COLORS.creamDim}
              />
            </View>
          </View>
        )}

        {destination && !selectedCategory && (
          <>
            {/* Health Brief */}
            <View style={styles.briefSection}>
              <Text style={styles.sectionTitle}>Health Brief</Text>

              {/* Water safety */}
              <WaterSafetyCard guide={medicalGuide} />

              {/* Vaccinations */}
              {healthBrief && (
                <View style={styles.briefCard}>
                  <Shield size={16} color={COLORS.sage} strokeWidth={2} />
                  <View style={{ flex: 1 }}>
                    <Text style={styles.briefLabel}>Vaccinations</Text>
                    <Text style={styles.briefValue}>{healthBrief.vaccinations}</Text>
                  </View>
                </View>
              )}

              {/* Health risks */}
              {medicalGuide && medicalGuide.healthRisks.length > 0 && (
                <Pressable
                  onPress={() => toggleSection('risks')}
                  style={styles.briefCard}
                >
                  <AlertTriangle size={16} color={COLORS.gold} strokeWidth={2} />
                  <View style={{ flex: 1 }}>
                    <Text style={styles.briefLabel}>Health Risks</Text>
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
                    strokeWidth={2}
                    style={{ transform: [{ rotate: expandedSection === 'risks' ? '180deg' : '0deg' }] }}
                  />
                </Pressable>
              )}

              {/* Emergency numbers */}
              {medicalGuide && (
                <View style={styles.emergencyCard}>
                  <Phone size={16} color={COLORS.coral} strokeWidth={2} />
                  <View style={{ flex: 1 }}>
                    <Text style={styles.emergencyLabel}>Emergency Numbers</Text>
                    <Text style={styles.emergencyNumber}>
                      Emergency: {medicalGuide.emergencyNumber}  |  Ambulance: {medicalGuide.ambulanceNumber}  |  Police: {medicalGuide.policeNumber}
                    </Text>
                    <Text style={styles.emergencyNote}>{medicalGuide.englishNote}</Text>
                  </View>
                </View>
              )}

              {/* Emergency phrase */}
              {emergencyPhrase && (
                <View style={styles.phraseCard}>
                  <Text style={styles.phraseLabel}>Say this in an emergency ({emergencyPhrase.language}):</Text>
                  <Text style={styles.phraseText}>{emergencyPhrase.phonetic}</Text>
                </View>
              )}
            </View>

            {/* Symptom Checker */}
            <View style={styles.symptomSection}>
              <Text style={styles.sectionTitle}>What are you experiencing?</Text>
              <Text style={styles.sectionSub}>
                Select a symptom category for destination-specific guidance
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
                    <ChevronRight size={14} color={COLORS.creamMuted} strokeWidth={2} />
                  </Pressable>
                ))}
              </View>
            </View>

            {/* Where to go */}
            {medicalGuide && (
              <View style={styles.whereSection}>
                <Text style={styles.sectionTitle}>Where to go for help</Text>
                {medicalGuide.whereToGo.map((item, i) => (
                  <View key={i} style={styles.whereCard}>
                    <Text style={styles.whereCondition}>{item.condition}</Text>
                    <Text style={styles.whereGo}>{item.go}</Text>
                  </View>
                ))}
                <View style={styles.insuranceCard}>
                  <Shield size={14} color={COLORS.gold} strokeWidth={2} />
                  <View style={{ flex: 1 }}>
                    <Text style={styles.insuranceLabel}>
                      Travel Insurance: {medicalGuide.insurancePriority === 'critical' ? 'Essential' : medicalGuide.insurancePriority === 'recommended' ? 'Recommended' : 'Nice to have'}
                    </Text>
                    <Text style={styles.insuranceNote}>{medicalGuide.insuranceNote}</Text>
                  </View>
                </View>
              </View>
            )}
          </>
        )}

        {/* Symptom Detail View */}
        {selectedCategory && symptomIntel && (
          <View style={styles.detailView}>
            <Text style={styles.detailTitle}>
              {SYMPTOM_CATEGORIES.find((c) => c.id === selectedCategory)?.label}
            </Text>
            <Text style={styles.detailDest}>in {destination}</Text>

            <RiskBadge level={symptomIntel.riskLevel} />

            {/* Common causes */}
            <View style={styles.detailSection}>
              <Text style={styles.detailSectionTitle}>Most likely causes here</Text>
              {symptomIntel.commonCauses.map((cause, i) => (
                <View key={i} style={styles.detailItem}>
                  <View style={styles.detailBullet} />
                  <Text style={styles.detailItemText}>{cause}</Text>
                </View>
              ))}
            </View>

            {/* What to do */}
            <View style={styles.detailSection}>
              <Text style={styles.detailSectionTitle}>What to do right now</Text>
              {symptomIntel.whatToDo.map((step, i) => (
                <View key={i} style={styles.detailItem}>
                  <Text style={styles.detailStepNum}>{i + 1}</Text>
                  <Text style={styles.detailItemText}>{step}</Text>
                </View>
              ))}
            </View>

            {/* When to see a doctor */}
            <View style={[styles.detailSection, styles.doctorSection]}>
              <Text style={styles.detailSectionTitle}>See a doctor if</Text>
              <Text style={styles.doctorText}>{symptomIntel.seeDoctor}</Text>
            </View>

            {/* Local medication */}
            <View style={styles.medSection}>
              <Pill size={16} color={COLORS.sage} strokeWidth={2} />
              <View style={{ flex: 1 }}>
                <Text style={styles.medLabel}>At the pharmacy</Text>
                <Text style={styles.medText}>{symptomIntel.localMedication}</Text>
              </View>
            </View>

            {/* Emergency numbers quick access */}
            {medicalGuide && (
              <View style={styles.quickEmergency}>
                <Phone size={14} color={COLORS.coral} strokeWidth={2} />
                <Text style={styles.quickEmergencyText}>
                  Emergency: {medicalGuide.emergencyNumber}  |  Ambulance: {medicalGuide.ambulanceNumber}
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
    gap: 6,
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
  // Section titles
  sectionTitle: {
    fontFamily: FONTS.header,
    fontSize: 20,
    color: COLORS.cream,
    marginBottom: SPACING.sm,
  } as TextStyle,
  sectionSub: {
    fontFamily: FONTS.body,
    fontSize: 13,
    color: COLORS.creamMuted,
    marginBottom: SPACING.md,
  } as TextStyle,
  // Brief section
  briefSection: {
    marginBottom: SPACING.xl,
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
    marginTop: 4,
  } as TextStyle,
  // Water safety
  waterCard: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: SPACING.sm,
    backgroundColor: COLORS.bgCard,
    borderRadius: RADIUS.md,
    borderWidth: 1,
    padding: SPACING.md,
  } as ViewStyle,
  waterLabel: {
    fontFamily: FONTS.bodySemiBold,
    fontSize: 14,
  } as TextStyle,
  waterNote: {
    fontFamily: FONTS.body,
    fontSize: 12,
    color: COLORS.creamMuted,
    marginTop: 2,
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
    marginTop: 4,
    lineHeight: 16,
  } as TextStyle,
  // Phrase
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
  symptomSection: { marginBottom: SPACING.xl } as ViewStyle,
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
  whereSection: { marginBottom: SPACING.xl, gap: SPACING.sm } as ViewStyle,
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
    marginBottom: 4,
  } as TextStyle,
  whereGo: {
    fontFamily: FONTS.body,
    fontSize: 13,
    color: COLORS.creamMuted,
    lineHeight: 18,
  } as TextStyle,
  // Insurance
  insuranceCard: {
    flexDirection: 'row',
    alignItems: 'flex-start',
    gap: SPACING.sm,
    backgroundColor: COLORS.gold + '08',
    borderRadius: RADIUS.md,
    borderWidth: 1,
    borderColor: COLORS.gold + '20',
    padding: SPACING.md,
  } as ViewStyle,
  insuranceLabel: {
    fontFamily: FONTS.bodySemiBold,
    fontSize: 13,
    color: COLORS.gold,
    marginBottom: 2,
  } as TextStyle,
  insuranceNote: {
    fontFamily: FONTS.body,
    fontSize: 12,
    color: COLORS.creamMuted,
    lineHeight: 18,
  } as TextStyle,
  // Risk badge
  riskBadge: {
    flexDirection: 'row',
    alignItems: 'center',
    alignSelf: 'flex-start',
    gap: 6,
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
  // Detail view
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
    marginTop: 6,
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
  // Doctor section
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
  // Medication
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
  // Quick emergency
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

export default withComingSoon(BodyIntelScreen, {
  routeName: 'body-intel',
  title: 'Body Intel',
});
