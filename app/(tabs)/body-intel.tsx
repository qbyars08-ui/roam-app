// =============================================================================
// ROAM — Health Tab (Body Intel)
// Destination-aware health intelligence: symptoms, health brief, medication check.
// For informational purposes only — always consult a doctor for medical advice.
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
  type ListRenderItemInfo,
  type TextStyle,
  type ViewStyle,
} from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import {
  Activity,
  AlertTriangle,
  ChevronDown,
  ChevronRight,
  Droplets,
  Heart,
  Info,
  Phone,
  Pill,
  Search,
  Shield,
  Thermometer,
  Wind,
  Eye,
  Zap,
  HelpCircle,
  Ban,
  CheckCircle,
  Lock,
  X,
} from 'lucide-react-native';
import * as Haptics from '../../lib/haptics';
import { COLORS, FONTS, SPACING, RADIUS, DESTINATIONS, HIDDEN_DESTINATIONS } from '../../lib/constants';
import { useAppStore } from '../../lib/store';
import { getMedicalGuideByDestination, type MedicalGuide } from '../../lib/medical-abroad';
import { getHealthBrief, type HealthBrief } from '../../lib/health-brief';
import {
  checkMedication,
  searchMedications,
  getRestrictedMedications,
  type MedicationCheckResult,
  type LegalStatus,
} from '../../lib/medication-check';
import { track } from '../../lib/analytics';
import { captureEvent } from '../../lib/posthog';

// ---------------------------------------------------------------------------
// Constants
// ---------------------------------------------------------------------------

const TABS = ['symptoms', 'brief', 'meds'] as const;
type TabId = (typeof TABS)[number];

const TAB_CONFIG: Record<TabId, { label: string; icon: React.ReactNode }> = {
  symptoms: { label: 'Symptoms', icon: <Activity size={16} color={COLORS.cream} strokeWidth={2} /> },
  brief: { label: 'Health Brief', icon: <Shield size={16} color={COLORS.cream} strokeWidth={2} /> },
  meds: { label: 'Medications', icon: <Pill size={16} color={COLORS.cream} strokeWidth={2} /> },
};

const SYMPTOM_CATEGORIES = [
  { id: 'stomach', label: 'Stomach', Icon: Droplets },
  { id: 'fever', label: 'Fever', Icon: Thermometer },
  { id: 'skin', label: 'Skin', Icon: Heart },
  { id: 'respiratory', label: 'Respiratory', Icon: Wind },
  { id: 'head', label: 'Head/Dizziness', Icon: Zap },
  { id: 'injury', label: 'Injury', Icon: AlertTriangle },
  { id: 'eye-ear', label: 'Eye/Ear', Icon: Eye },
  { id: 'other', label: 'Other', Icon: HelpCircle },
] as const;

// ---------------------------------------------------------------------------
// Region mapping + symptom data
// ---------------------------------------------------------------------------

type RegionId =
  | 'southeast-asia'
  | 'east-asia'
  | 'south-asia'
  | 'europe'
  | 'latin-america'
  | 'middle-east'
  | 'africa'
  | 'north-america'
  | 'oceania';

interface SymptomIntel {
  riskLevel: 'low' | 'moderate' | 'high';
  commonCauses: string[];
  whatToDo: string[];
  seeDoctor: string;
  localPhrase: string;
  localMedication: string;
}

const DEST_REGION: Record<string, RegionId> = {
  tokyo: 'east-asia', kyoto: 'east-asia', osaka: 'east-asia', japan: 'east-asia',
  seoul: 'east-asia', 'south korea': 'east-asia',
  bangkok: 'southeast-asia', thailand: 'southeast-asia', 'chiang mai': 'southeast-asia',
  bali: 'southeast-asia', indonesia: 'southeast-asia', jakarta: 'southeast-asia',
  vietnam: 'southeast-asia', hanoi: 'southeast-asia', 'ho chi minh': 'southeast-asia',
  singapore: 'southeast-asia', philippines: 'southeast-asia', manila: 'southeast-asia',
  cambodia: 'southeast-asia', 'phnom penh': 'southeast-asia',
  india: 'south-asia', delhi: 'south-asia', mumbai: 'south-asia', goa: 'south-asia',
  'sri lanka': 'south-asia', nepal: 'south-asia',
  paris: 'europe', london: 'europe', barcelona: 'europe', rome: 'europe',
  lisbon: 'europe', amsterdam: 'europe', berlin: 'europe', prague: 'europe',
  budapest: 'europe', athens: 'europe', istanbul: 'europe', croatia: 'europe',
  reykjavik: 'europe', iceland: 'europe', portugal: 'europe', spain: 'europe',
  'mexico city': 'latin-america', mexico: 'latin-america', cancun: 'latin-america',
  'buenos aires': 'latin-america', colombia: 'latin-america', medellin: 'latin-america',
  lima: 'latin-america', 'costa rica': 'latin-america', brazil: 'latin-america',
  dubai: 'middle-east', uae: 'middle-east', jordan: 'middle-east',
  morocco: 'africa', marrakech: 'africa', 'cape town': 'africa', 'south africa': 'africa',
  egypt: 'africa', cairo: 'africa', kenya: 'africa', tanzania: 'africa',
  'new york': 'north-america', 'los angeles': 'north-america', usa: 'north-america',
  canada: 'north-america', toronto: 'north-america',
  australia: 'oceania', sydney: 'oceania', melbourne: 'oceania', 'new zealand': 'oceania',
};

function getRegion(destination: string): RegionId {
  const key = destination.toLowerCase().trim();
  for (const [k, v] of Object.entries(DEST_REGION)) {
    if (key.includes(k) || k.includes(key)) return v;
  }
  return 'europe';
}

const EMERGENCY_PHRASES: Record<RegionId, { phrase: string; phonetic: string; language: string }> = {
  'east-asia': { phrase: 'I need medical help', phonetic: 'Tasukete kudasai', language: 'Japanese' },
  'southeast-asia': { phrase: 'I need a doctor', phonetic: 'Chuay duay', language: 'Thai' },
  'south-asia': { phrase: 'I need help', phonetic: 'Mujhe madad chahiye', language: 'Hindi' },
  europe: { phrase: 'I need medical help', phonetic: "J'ai besoin d'aide medicale", language: 'French' },
  'latin-america': { phrase: 'I need a doctor', phonetic: 'Necesito un doctor', language: 'Spanish' },
  'middle-east': { phrase: 'I need help', phonetic: 'Ahtaaj musaada', language: 'Arabic' },
  africa: { phrase: 'I need a doctor', phonetic: "J'ai besoin d'un medecin", language: 'French' },
  'north-america': { phrase: 'I need medical help', phonetic: 'I need medical help', language: 'English' },
  oceania: { phrase: 'I need medical help', phonetic: 'I need medical help', language: 'English' },
};

// Full symptom data by region
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
        'Stay hydrated with electrolyte solution or coconut water',
        'Eat bland food: plain rice, bananas, toast',
        'Avoid dairy, caffeine, and alcohol for 24 hours',
        'Take loperamide (Imodium) if needed for travel days',
      ],
      seeDoctor: 'If symptoms last more than 3 days, you see blood, have fever above 38.5C/101F, or cannot keep fluids down for 12+ hours.',
      localPhrase: 'Sakit perut (Indonesian) / Puang thong (Thai)',
      localMedication: 'Oral Rehydration Salts (ORS) at any pharmacy. Brand: Electral, Pedialyte.',
    },
    fever: {
      riskLevel: 'high',
      commonCauses: [
        'Dengue fever (mosquito-borne, common in rainy season)',
        'Heat exhaustion or heat stroke',
        'Food-borne infection',
      ],
      whatToDo: [
        'Take paracetamol (NOT ibuprofen if dengue suspected)',
        'Stay in air-conditioned room and rest',
        'Drink 2-3 liters of water per day minimum',
        'Monitor temperature every 4 hours',
      ],
      seeDoctor: 'Immediately if fever above 39C/102F, rash with fever, severe headache behind the eyes, or fever does not respond to paracetamol within 24 hours.',
      localPhrase: 'Demam (Indonesian/Malay) / Khai (Thai)',
      localMedication: 'Paracetamol (Panadol). Do NOT take aspirin or ibuprofen until dengue is ruled out.',
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
      localPhrase: 'Gatal (Indonesian) / Khat (Thai)',
      localMedication: 'Antihistamine cream (Benadryl cream), calamine lotion, hydrocortisone 1%. All OTC.',
    },
    respiratory: {
      riskLevel: 'moderate',
      commonCauses: [
        'Air pollution in cities (Bangkok, Jakarta, Manila)',
        'Air conditioning and sudden temperature changes',
        'Dust and allergens in tropical environments',
      ],
      whatToDo: [
        'Wear a mask in heavily polluted areas',
        'Stay hydrated and use saline nasal spray',
        'Avoid outdoor exercise during high pollution days',
        'Use air purifier if available in accommodation',
      ],
      seeDoctor: 'If you have difficulty breathing, wheezing, or chest tightness that does not resolve with rest.',
      localPhrase: 'Sesak napas (Indonesian) / Hai jai yak (Thai)',
      localMedication: 'Salbutamol inhaler (Ventolin) available at pharmacies. Cough syrup widely available OTC.',
    },
    head: {
      riskLevel: 'moderate',
      commonCauses: [
        'Dehydration from heat and humidity',
        'Heat stroke (especially first few days)',
        'Jet lag and sleep disruption',
      ],
      whatToDo: [
        'Drink water immediately (at least 500ml)',
        'Move to air-conditioned space',
        'Apply cool cloth to forehead and neck',
        'Take paracetamol for headache',
      ],
      seeDoctor: 'If dizziness persists despite hydration, if you faint, or if headache is severe and sudden onset.',
      localPhrase: 'Pusing (Indonesian) / Wian hua (Thai)',
      localMedication: 'Paracetamol, electrolyte drinks. Tiger Balm for headache relief.',
    },
    injury: {
      riskLevel: 'moderate',
      commonCauses: [
        'Motorbike accidents (most common tourist injury)',
        'Coral cuts while snorkeling/diving',
        'Slips on wet surfaces during rainy season',
      ],
      whatToDo: [
        'Clean wound thoroughly with antiseptic',
        'For coral cuts: remove any debris, apply antibiotic ointment',
        'Keep wound dry and covered in humid climate (infection risk high)',
        'Get tetanus shot if wound is deep and vaccination not current',
      ],
      seeDoctor: 'For any deep wound, suspected fracture, head injury, or wound showing signs of infection (redness spreading, pus, increased pain).',
      localPhrase: 'Luka (Indonesian) / Bat jep (Thai)',
      localMedication: 'Betadine (antiseptic), Neosporin equivalent, bandages. All available at pharmacies and convenience stores.',
    },
    'eye-ear': {
      riskLevel: 'low',
      commonCauses: [
        'Swimmer\'s ear from ocean/pool water',
        'Eye irritation from sunscreen, sand, or pollution',
        'Contact lens issues in humid climate',
      ],
      whatToDo: [
        'For swimmer\'s ear: keep dry, use rubbing alcohol drops',
        'For eye irritation: rinse with clean water, avoid rubbing',
        'Consider switching to daily disposable lenses in humid areas',
        'Wear sunglasses to protect from UV and debris',
      ],
      seeDoctor: 'If you have eye pain with vision changes, ear pain with discharge, or symptoms lasting more than 48 hours.',
      localPhrase: 'Sakit mata/telinga (Indonesian)',
      localMedication: 'Visine/eye drops, ear drops (Otomycin) available OTC at pharmacies.',
    },
    other: {
      riskLevel: 'moderate',
      commonCauses: [
        'Jet lag and sleep disruption',
        'Anxiety from unfamiliar environment',
        'Fatigue from heat and humidity',
      ],
      whatToDo: [
        'Rest and maintain regular sleep schedule',
        'Stay hydrated and eat regular meals',
        'Take it slow for the first 1-2 days to acclimatize',
        'Use melatonin for jet lag if needed',
      ],
      seeDoctor: 'If symptoms are severe, worsening, or you are unsure what is wrong.',
      localPhrase: 'Saya tidak enak badan (Indonesian)',
      localMedication: 'General pharmacy visit recommended. Pharmacists in SE Asia can often diagnose and recommend.',
    },
  },
  'east-asia': {
    stomach: {
      riskLevel: 'low',
      commonCauses: [
        'Unfamiliar fermented foods (miso, kimchi, natto)',
        'Raw fish sensitivity (sashimi, sushi)',
        'Different portion sizes and eating patterns',
      ],
      whatToDo: [
        'Japanese/Korean OTC stomach medicine is excellent',
        'Drink warm water or green tea (aids digestion)',
        'Eat rice porridge (okayu/juk) for gentle relief',
        'Rest and avoid alcohol',
      ],
      seeDoctor: 'If symptoms persist beyond 48 hours or severe abdominal pain.',
      localPhrase: 'Onaka ga itai (Japanese) / Bae-ga apayo (Korean)',
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
        'Convenience stores sell face masks and throat lozenges',
        'Take paracetamol or ibuprofen for fever',
      ],
      seeDoctor: 'If fever lasts more than 3 days or exceeds 39C/102F.',
      localPhrase: 'Netsu ga arimasu (Japanese)',
      localMedication: 'Japan: Pabron Gold, Eve (ibuprofen). Korea: Tylenol, Panpyrin. Drugstores (kusuriya/yakguk).',
    },
    skin: {
      riskLevel: 'low',
      commonCauses: [
        'Dry skin from air conditioning and heating',
        'Allergic reaction to unfamiliar skincare/bath products',
        'Sunburn (UV strong even on overcast days)',
      ],
      whatToDo: [
        'Japanese moisturizers and skincare are world-class',
        'Apply aloe vera gel for sunburn',
        'Antihistamine tablets for allergic reactions',
        'Avoid very hot onsen water if skin is irritated',
      ],
      seeDoctor: 'If rash spreads rapidly, accompanied by swelling, or does not improve with OTC treatment in 48 hours.',
      localPhrase: 'Hada ga kayui (Japanese)',
      localMedication: 'Muhi (anti-itch), Oronine H (antiseptic cream). All OTC at drugstores.',
    },
    respiratory: {
      riskLevel: 'low',
      commonCauses: [
        'Dry air from heating systems (winter)',
        'Seasonal allergies (cedar pollen in spring)',
        'Air quality varies by city and season',
      ],
      whatToDo: [
        'Wear a mask (culturally normal and widely available)',
        'Use humidifier or steam from hot shower',
        'Japanese cold medicine is highly effective',
        'Hot drinks with honey for sore throat',
      ],
      seeDoctor: 'If breathing difficulty, persistent cough for 2+ weeks, or wheezing.',
      localPhrase: 'Seki ga demasu (Japanese)',
      localMedication: 'Pabron (cold medicine), Vicks cough drops. Available at konbini/drugstore.',
    },
    head: {
      riskLevel: 'low',
      commonCauses: [
        'Jet lag (especially US/EU to Asia)',
        'Dehydration from travel',
        'Tension from carrying heavy bags in cities',
      ],
      whatToDo: [
        'Hydrate and rest',
        'Japanese painkillers (Eve, Bufferin) are effective',
        'Consider onsen visit for relaxation',
        'Adjust to local time as quickly as possible',
      ],
      seeDoctor: 'If severe sudden headache, confusion, or dizziness that does not resolve.',
      localPhrase: 'Atama ga itai (Japanese)',
      localMedication: 'Eve A (ibuprofen), Bufferin (aspirin). Available at any drugstore.',
    },
    injury: {
      riskLevel: 'low',
      commonCauses: [
        'Slips in wet areas (rain, bathhouses)',
        'Cycling accidents in cities',
        'Minor burns from hot springs (onsen)',
      ],
      whatToDo: [
        'First aid supplies available at any convenience store',
        'Clean and bandage wounds promptly',
        'Japanese hospitals are world-class',
        'Keep receipts for travel insurance claims',
      ],
      seeDoctor: 'For any wound needing stitches, suspected fracture, or head injury.',
      localPhrase: 'Kega wo shimashita (Japanese)',
      localMedication: 'Band-aids, Oronine H ointment, cooling patches. All at konbini.',
    },
    'eye-ear': {
      riskLevel: 'low',
      commonCauses: [
        'Dry eyes from air conditioning',
        'Pollen irritation (spring season)',
        'Long flights causing ear pressure',
      ],
      whatToDo: [
        'Eye drops widely available at pharmacies',
        'Japanese eye drops are excellent quality',
        'Yawn or swallow to relieve ear pressure',
        'Warm compress for ear discomfort',
      ],
      seeDoctor: 'If eye pain with vision changes or ear pain with discharge.',
      localPhrase: 'Me ga itai (Japanese)',
      localMedication: 'Sante FX (eye drops, very popular), ear drops at pharmacies.',
    },
    other: {
      riskLevel: 'low',
      commonCauses: [
        'Jet lag (can last 3-5 days)',
        'Culture shock and sensory overload',
        'Fatigue from walking (cities are very walkable)',
      ],
      whatToDo: [
        'Get sunlight exposure in morning to reset circadian rhythm',
        'Visit a pharmacy for general advice',
        'Take rest days between active sightseeing',
        'Convenience stores have everything you need',
      ],
      seeDoctor: 'If symptoms are unusual or worsening.',
      localPhrase: 'Guai ga warui (Japanese)',
      localMedication: 'Pharmacist consultation recommended. Japanese pharmacists are knowledgeable.',
    },
  },
  europe: {
    stomach: {
      riskLevel: 'low',
      commonCauses: [
        'Rich/heavy food and large portions',
        'Excessive wine or alcohol consumption',
        'Lactose or gluten sensitivity from local cuisine',
      ],
      whatToDo: [
        'European pharmacies can diagnose and recommend treatments',
        'Drink mint or chamomile tea',
        'Eat light: soup, bread, plain pasta',
        'OTC antacids widely available',
      ],
      seeDoctor: 'If symptoms persist more than 72 hours or accompanied by fever.',
      localPhrase: "J'ai mal au ventre (French) / Tengo dolor de estomago (Spanish)",
      localMedication: 'Smecta (France), Iberogast (Germany), Buscopan (pan-European). Ask pharmacist.',
    },
    fever: {
      riskLevel: 'low',
      commonCauses: ['Common cold or seasonal flu', 'Travel exhaustion', 'COVID or respiratory virus'],
      whatToDo: [
        'Take paracetamol or ibuprofen',
        'Stay hydrated and rest',
        'European pharmacies are excellent — describe symptoms',
        'Consider a rapid COVID test if respiratory symptoms',
      ],
      seeDoctor: 'If fever exceeds 39C/102F for more than 48 hours. EU citizens: use EHIC card.',
      localPhrase: "J'ai de la fievre (French) / Tengo fiebre (Spanish)",
      localMedication: 'Doliprane (France), Ben-u-ron (Germany). Ibuprofen widely available.',
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
        'European sunscreen is often better quality — buy SPF 50',
        'Pharmacist can assess and recommend treatment',
      ],
      seeDoctor: 'If burn blisters large area, bite shows infection, or allergic reaction includes swelling.',
      localPhrase: "J'ai une irritation (French)",
      localMedication: 'Fenistil gel (anti-itch), Voltaren (anti-inflammatory), Bepanthen (healing). All OTC.',
    },
    respiratory: {
      riskLevel: 'low',
      commonCauses: ['Seasonal cold/flu', 'Allergens (pollen in spring)', 'Damp weather in northern Europe'],
      whatToDo: [
        'Visit any pharmacy for consultation',
        'European cough syrups and lozenges work well',
        'Stay warm and dry in northern climates',
        'Hot tea with honey is universally available',
      ],
      seeDoctor: 'If breathing difficulty or persistent cough for 2+ weeks.',
      localPhrase: "Je tousse (French) / Tengo tos (Spanish)",
      localMedication: 'Mucosolvan, Strepsils, Vicks. Available OTC everywhere.',
    },
    head: {
      riskLevel: 'low',
      commonCauses: ['Dehydration (especially Mediterranean summer)', 'Altitude in mountain regions', 'Wine hangovers'],
      whatToDo: [
        'Hydrate with water and electrolytes',
        'Paracetamol or ibuprofen',
        'Rest in shade during midday heat',
        'Altitude: descend if symptoms worsen',
      ],
      seeDoctor: 'If severe, sudden headache or confusion.',
      localPhrase: "J'ai mal a la tete (French)",
      localMedication: 'Paracetamol, ibuprofen. Available everywhere OTC.',
    },
    injury: {
      riskLevel: 'low',
      commonCauses: ['Cobblestone ankle twists', 'Cycling accidents (Amsterdam, Copenhagen)', 'Hiking injuries in mountains'],
      whatToDo: [
        'RICE: Rest, Ice, Compression, Elevation for sprains',
        'European emergency rooms are generally excellent',
        'Keep EHIC card accessible (EU citizens)',
        'Travel insurance covers most ER visits',
      ],
      seeDoctor: 'For suspected fractures, deep wounds, or head injuries.',
      localPhrase: "Je me suis blesse (French)",
      localMedication: 'Voltaren gel (topical anti-inflammatory), bandages, ice packs. All at pharmacy.',
    },
    'eye-ear': {
      riskLevel: 'low',
      commonCauses: ['Chlorinated pool water', 'Wind and sand at beaches', 'Ear pressure from flying'],
      whatToDo: [
        'Rinse eyes with clean water',
        'Pharmacy eye drops available OTC',
        'Warm compress for ear discomfort',
        'Swimmer\'s ear: keep dry and use alcohol drops',
      ],
      seeDoctor: 'If pain worsening, discharge, or vision changes.',
      localPhrase: "J'ai mal aux yeux (French)",
      localMedication: 'Eye drops, ear drops widely available at pharmacies.',
    },
    other: {
      riskLevel: 'low',
      commonCauses: ['Travel fatigue', 'Jet lag', 'Stress from navigation'],
      whatToDo: [
        'European pharmacies are staffed by licensed pharmacists who can diagnose',
        'Walk-in clinics available in most cities',
        'Rest and maintain regular sleep',
        'Stay hydrated',
      ],
      seeDoctor: 'If symptoms are unusual or concerning.',
      localPhrase: "Je ne me sens pas bien (French)",
      localMedication: 'Consult pharmacist for personalized recommendation.',
    },
  },
  'latin-america': {
    stomach: {
      riskLevel: 'high',
      commonCauses: [
        "Montezuma's revenge (bacterial contamination)",
        'Tap water and ice in drinks',
        'Street food hygiene varies widely',
      ],
      whatToDo: [
        'Drink only bottled/purified water',
        'Oral Rehydration Salts (available at any pharmacy)',
        'BRAT diet: bananas, rice, applesauce, toast',
        'Probiotics can help recovery',
      ],
      seeDoctor: 'If blood in stool, fever above 39C, or unable to keep fluids down for 12+ hours.',
      localPhrase: 'Me duele el estomago / Tengo diarrea',
      localMedication: 'Suero oral (ORS), loperamide, bismuth subsalicylate. Available at farmacias.',
    },
    fever: {
      riskLevel: 'moderate',
      commonCauses: ['Dengue (mosquito-borne)', 'Food-borne illness', 'Altitude sickness (Bogota, Cusco, CDMX)'],
      whatToDo: [
        'Paracetamol (not ibuprofen if dengue possible)',
        'Rest and hydrate aggressively',
        'Use mosquito repellent with DEET',
        'For altitude: descend if symptoms worsen',
      ],
      seeDoctor: 'If fever above 39C, rash with fever, or altitude sickness symptoms.',
      localPhrase: 'Tengo fiebre / Necesito un doctor',
      localMedication: 'Paracetamol (Panadol, Tempra). Available everywhere.',
    },
    skin: {
      riskLevel: 'moderate',
      commonCauses: ['Mosquito bites', 'Sunburn at altitude', 'Sand fly bites on beaches'],
      whatToDo: [
        'DEET-based repellent, reapply every 4-6 hours',
        'Wear long sleeves at dusk/dawn',
        'Aloe vera and hydrocortisone for reactions',
        'Sun at altitude is much stronger than expected',
      ],
      seeDoctor: 'If bites show infection signs or unusual rash develops.',
      localPhrase: 'Tengo una picadura / irritacion en la piel',
      localMedication: 'Hydrocortisone cream, antihistamines. Available at farmacias.',
    },
    respiratory: {
      riskLevel: 'moderate',
      commonCauses: ['Air pollution (Mexico City, Bogota)', 'Altitude-related breathing difficulty', 'Dust in dry seasons'],
      whatToDo: [
        'Acclimate gradually to altitude',
        'Coca tea for altitude symptoms (legal in Andes)',
        'Wear mask in polluted areas',
        'Stay hydrated at altitude',
      ],
      seeDoctor: 'If breathing difficulty at altitude, persistent cough, or wheezing.',
      localPhrase: 'No puedo respirar bien',
      localMedication: 'Salbutamol inhaler, cough syrup. Available at farmacias.',
    },
    head: {
      riskLevel: 'moderate',
      commonCauses: ['Altitude sickness (2500m+ cities)', 'Dehydration', 'Heat in tropical lowlands'],
      whatToDo: [
        'At altitude: take it easy first 24 hours, drink coca tea',
        'Hydrate aggressively',
        'Acetazolamide (Diamox) for altitude prevention',
        'Paracetamol for headache',
      ],
      seeDoctor: 'If severe headache at altitude with vomiting or confusion.',
      localPhrase: 'Me duele la cabeza',
      localMedication: 'Paracetamol, Diamox (may need prescription). Coca tea at markets.',
    },
    injury: {
      riskLevel: 'moderate',
      commonCauses: ['Uneven sidewalks and roads', 'Adventure sports (zip lining, hiking)', 'Ocean currents'],
      whatToDo: [
        'Clean wounds thoroughly',
        'Private hospitals (clinicas privadas) preferred over public',
        'Keep travel insurance info accessible',
        'Pharmacies sell basic first aid supplies',
      ],
      seeDoctor: 'For any wound needing stitches, suspected fracture, or head injury.',
      localPhrase: 'Me lastime / Necesito ayuda',
      localMedication: 'Betadine, bandages, anti-inflammatory gel. Available at farmacias.',
    },
    'eye-ear': {
      riskLevel: 'low',
      commonCauses: ['Chlorinated pool water', 'Ocean water irritation', 'Dust and pollution'],
      whatToDo: [
        'Rinse with clean water',
        'Pharmacy eye/ear drops available OTC',
        'Avoid rubbing irritated eyes',
        'Sunglasses in dusty/sunny areas',
      ],
      seeDoctor: 'If pain, discharge, or vision changes.',
      localPhrase: 'Me duelen los ojos/oidos',
      localMedication: 'Eye drops (Visine), ear drops at farmacias.',
    },
    other: {
      riskLevel: 'moderate',
      commonCauses: ['Altitude adjustment', 'Travel fatigue', 'Culture shock'],
      whatToDo: [
        'Take first 1-2 days slowly',
        'Farmacia staff can often diagnose and recommend',
        'Stay hydrated and eat regular meals',
        'Private clinics offer quick consultations',
      ],
      seeDoctor: 'If symptoms are unusual, severe, or worsening.',
      localPhrase: 'No me siento bien',
      localMedication: 'Consult farmacia for personalized advice.',
    },
  },
  'south-asia': {
    stomach: {
      riskLevel: 'high',
      commonCauses: [
        'Bacterial contamination in food and water',
        'Spice levels dramatically different from home',
        'Street food hygiene concerns',
      ],
      whatToDo: [
        'ONLY drink bottled/purified water (check seal)',
        'ORS packets essential — dissolve in clean water',
        'Probiotics help rebuild gut flora',
        'Avoid raw vegetables and unpeeled fruit',
      ],
      seeDoctor: 'If blood in stool, fever above 39C, dehydration signs, or lasting more than 3 days.',
      localPhrase: 'Mujhe pet dard hai (Hindi)',
      localMedication: 'ORS (Electral brand), Norflox-TZ (antibiotic, OTC in India), probiotics.',
    },
    fever: {
      riskLevel: 'high',
      commonCauses: ['Dengue', 'Typhoid', 'Malaria (rural areas)', 'Chikungunya'],
      whatToDo: [
        'Paracetamol (NOT ibuprofen or aspirin)',
        'Get tested for dengue/malaria at any clinic',
        'Rest in air-conditioned room',
        'Drink 3+ liters of water daily',
      ],
      seeDoctor: 'Immediately for any fever above 38.5C in South Asia. Multiple serious diseases possible.',
      localPhrase: 'Mujhe bukhar hai (Hindi)',
      localMedication: 'Crocin (paracetamol). Get blood test for dengue/malaria at any diagnostic lab.',
    },
    skin: {
      riskLevel: 'moderate',
      commonCauses: ['Mosquito bites (disease vectors)', 'Heat rash', 'Fungal infections from humidity'],
      whatToDo: [
        'DEET repellent is essential',
        'Keep skin dry in folds (armpit, groin) to prevent fungal infection',
        'Antifungal powder for heat-prone areas',
        'Photograph any concerning marks',
      ],
      seeDoctor: 'If bite with fever, spreading redness, or persistent rash.',
      localPhrase: 'Meri chamdi mein taklif hai (Hindi)',
      localMedication: 'Odomos (repellent), antifungal cream (Candid), calamine lotion. All OTC.',
    },
    respiratory: {
      riskLevel: 'moderate',
      commonCauses: ['Severe air pollution (Delhi, Kolkata)', 'Dust', 'Altitude (Nepal, Ladakh)'],
      whatToDo: [
        'N95 mask essential in polluted cities',
        'Check AQI before outdoor activities',
        'Saline nasal spray for dry/irritated airways',
        'Air purifier in accommodation if possible',
      ],
      seeDoctor: 'If breathing difficulty, wheezing, or persistent cough.',
      localPhrase: 'Mujhe saans lene mein taklif hai (Hindi)',
      localMedication: 'Inhalers available OTC at many pharmacies. Cough syrup widely available.',
    },
    head: {
      riskLevel: 'moderate',
      commonCauses: ['Heat exhaustion', 'Dehydration', 'Altitude (Nepal, Himalayan regions)'],
      whatToDo: [
        'Hydrate aggressively, especially in heat',
        'Electrolyte drinks (Glucon-D, ORS)',
        'Avoid midday sun (11am-3pm)',
        'At altitude: acclimatize slowly',
      ],
      seeDoctor: 'If fainting, confusion, or altitude symptoms worsening.',
      localPhrase: 'Mujhe sir dard hai (Hindi)',
      localMedication: 'Crocin (paracetamol), Saridon. Available everywhere.',
    },
    injury: {
      riskLevel: 'moderate',
      commonCauses: ['Traffic accidents (chaotic roads)', 'Uneven terrain', 'Animal encounters (dogs, monkeys)'],
      whatToDo: [
        'For animal bites: wash immediately with soap, get rabies post-exposure prophylaxis',
        'Private hospitals strongly recommended over government',
        'Max Healthcare, Apollo, Fortis chains are reliable',
        'Keep travel insurance details accessible',
      ],
      seeDoctor: 'ANY animal bite needs immediate medical attention for rabies assessment.',
      localPhrase: 'Mujhe chot lagi hai (Hindi)',
      localMedication: 'Betadine, bandages at pharmacies. Rabies PEP at hospitals.',
    },
    'eye-ear': {
      riskLevel: 'low',
      commonCauses: ['Dust and pollution irritation', 'Swimming in untreated water', 'Allergies'],
      whatToDo: [
        'Rinse eyes with clean water only',
        'Avoid swimming in rivers/lakes',
        'Sunglasses for dust protection',
        'Pharmacy eye drops available',
      ],
      seeDoctor: 'If pain, discharge, or vision changes.',
      localPhrase: 'Meri aankh/kaan mein dard hai (Hindi)',
      localMedication: 'Eye drops (Cipla), ear drops at pharmacies.',
    },
    other: {
      riskLevel: 'moderate',
      commonCauses: ['Culture shock', 'Sensory overload', 'Heat exhaustion', 'Traveler anxiety'],
      whatToDo: [
        'Take it very slow for first 2-3 days',
        'Eat at established restaurants initially',
        'Stay in well-reviewed accommodations',
        'Pharmacies can often help with general symptoms',
      ],
      seeDoctor: 'If symptoms are severe or you are unsure.',
      localPhrase: 'Main theek nahi hoon (Hindi)',
      localMedication: 'Visit Apollo/Max pharmacy for personalized advice.',
    },
  },
  'middle-east': {
    stomach: {
      riskLevel: 'low',
      commonCauses: ['Rich, heavy food', 'Excessive dates and sweets', 'Spice sensitivity'],
      whatToDo: [
        'Pharmacies well-stocked and pharmacists knowledgeable',
        'Drink water (tap safe in UAE, bottled elsewhere)',
        'Light meals: hummus, pita, salads',
        'Avoid eating in extreme heat',
      ],
      seeDoctor: 'If symptoms persist beyond 48 hours.',
      localPhrase: 'Ana marid (Arabic)',
      localMedication: 'Antacids, Buscopan, ORS. Available at pharmacies.',
    },
    fever: {
      riskLevel: 'low',
      commonCauses: ['Heat exhaustion (summer temps 40C+)', 'Air conditioning sickness', 'Viral infection'],
      whatToDo: [
        'Stay in air conditioning during peak heat hours',
        'Hydrate constantly (minimum 3L in summer)',
        'Paracetamol for fever',
        'Rest and avoid sun exposure',
      ],
      seeDoctor: 'If fever above 39C, heat stroke symptoms (confusion, hot dry skin, rapid pulse).',
      localPhrase: 'Indi harara (Arabic)',
      localMedication: 'Panadol (paracetamol). Available everywhere.',
    },
    skin: {
      riskLevel: 'low',
      commonCauses: ['Extreme sun exposure', 'Sand irritation', 'Dry air causing cracked skin'],
      whatToDo: [
        'SPF 50+ sunscreen essential',
        'Moisturize frequently (air is very dry)',
        'Aloe vera for sunburn',
        'Cover skin in desert excursions',
      ],
      seeDoctor: 'If severe sunburn with blisters or heat rash not improving.',
      localPhrase: 'Indi hashara jildiya (Arabic)',
      localMedication: 'Aloe vera, moisturizers, sunscreen. Available at pharmacies and malls.',
    },
    respiratory: {
      riskLevel: 'low',
      commonCauses: ['Dry air', 'Sand/dust storms', 'AC temperature extremes'],
      whatToDo: [
        'Saline nasal spray for dry airways',
        'Wear scarf over mouth during sandstorms',
        'Humidifier in hotel room if available',
        'Stay hydrated',
      ],
      seeDoctor: 'If breathing difficulty or persistent cough.',
      localPhrase: 'Ma agdar atanaffas (Arabic)',
      localMedication: 'Inhalers, cough medicine at pharmacies.',
    },
    head: {
      riskLevel: 'moderate',
      commonCauses: ['Dehydration (very common)', 'Heat stroke', 'Fasting effects (during Ramadan)'],
      whatToDo: [
        'Drink water before feeling thirsty',
        'Electrolyte supplements',
        'Stay in shade/AC during 11am-3pm',
        'Wear hat and sunglasses outdoors',
      ],
      seeDoctor: 'If dizziness with confusion, fainting, or not improving with hydration.',
      localPhrase: 'Rasi yualimni (Arabic)',
      localMedication: 'Panadol, electrolyte drinks. Available everywhere.',
    },
    injury: {
      riskLevel: 'low',
      commonCauses: ['Desert excursion mishaps', 'Water sports injuries', 'Traffic accidents'],
      whatToDo: [
        'UAE/Gulf hospitals are excellent quality',
        'Emergency services are fast and well-equipped',
        'Keep travel insurance info ready',
        'Emergency number: 998 (ambulance in UAE)',
      ],
      seeDoctor: 'For any significant injury. Gulf hospitals are modern and efficient.',
      localPhrase: 'Ana muhtaj musaada (Arabic)',
      localMedication: 'First aid supplies at pharmacies and hypermarkets.',
    },
    'eye-ear': {
      riskLevel: 'low',
      commonCauses: ['Sand in eyes', 'Dry air irritation', 'Pool/ocean water'],
      whatToDo: [
        'Rinse with clean water',
        'Artificial tears for dry eye',
        'Sunglasses essential in desert',
        'Avoid rubbing eyes',
      ],
      seeDoctor: 'If pain or vision changes.',
      localPhrase: 'Aini tualimni (Arabic)',
      localMedication: 'Artificial tears, eye drops at pharmacies.',
    },
    other: {
      riskLevel: 'low',
      commonCauses: ['Heat adjustment', 'Jet lag', 'Different dietary habits'],
      whatToDo: [
        'Acclimatize to heat gradually',
        'Maintain hydration',
        'Gulf pharmacies are well-stocked and English-speaking',
        'Hospital visits are generally affordable',
      ],
      seeDoctor: 'If symptoms are concerning.',
      localPhrase: 'Ana mish kwais (Arabic)',
      localMedication: 'Pharmacist consultation — English widely spoken in Gulf states.',
    },
  },
  africa: {
    stomach: {
      riskLevel: 'high',
      commonCauses: ['Water contamination', 'Unfamiliar bacteria in food', 'Street food hygiene'],
      whatToDo: [
        'Only bottled/purified water',
        'ORS packets are essential',
        'Avoid raw vegetables, unpeeled fruit',
        'Probiotics help prevention',
      ],
      seeDoctor: 'If blood in stool, high fever, or dehydration signs.',
      localPhrase: 'I need a doctor (English widely understood)',
      localMedication: 'ORS, loperamide at pharmacies. Private clinic recommended.',
    },
    fever: {
      riskLevel: 'high',
      commonCauses: ['Malaria (most of sub-Saharan Africa)', 'Typhoid', 'Yellow fever'],
      whatToDo: [
        'ASSUME malaria until proven otherwise — get tested immediately',
        'Take antimalarials as prescribed (Malarone, doxycycline)',
        'Paracetamol for fever (NOT ibuprofen)',
        'Use mosquito net and DEET repellent',
      ],
      seeDoctor: 'IMMEDIATELY for any fever in sub-Saharan Africa. Malaria can be fatal if untreated.',
      localPhrase: 'I have a fever / Je suis malade (French)',
      localMedication: 'Coartem (artemether-lumefantrine) for malaria treatment. Available at pharmacies.',
    },
    skin: {
      riskLevel: 'moderate',
      commonCauses: ['Mosquito bites', 'Tick bites (safari)', 'Sunburn at equatorial latitudes'],
      whatToDo: [
        'DEET 30%+ repellent essential',
        'Long sleeves and pants for safari',
        'Check for ticks after bush walks',
        'SPF 50+ for equatorial sun',
      ],
      seeDoctor: 'If bite with fever, embedded tick, or unusual rash.',
      localPhrase: 'I have a skin problem',
      localMedication: 'Repellent, antihistamine cream, sunscreen. Available in cities.',
    },
    respiratory: {
      riskLevel: 'low',
      commonCauses: ['Dust in dry season', 'Altitude in highlands', 'Campfire smoke'],
      whatToDo: [
        'Mask for dusty conditions',
        'Stay hydrated',
        'Rest if breathing affected by altitude',
        'Avoid smoke exposure',
      ],
      seeDoctor: 'If difficulty breathing or persistent cough.',
      localPhrase: 'I cannot breathe well',
      localMedication: 'Cough medicine at pharmacies.',
    },
    head: {
      riskLevel: 'moderate',
      commonCauses: ['Dehydration', 'Sun exposure', 'Altitude in highlands (Kilimanjaro, Ethiopian highlands)'],
      whatToDo: [
        'Hydrate aggressively',
        'Shade and rest during midday',
        'Paracetamol for headache',
        'At altitude: acclimatize slowly',
      ],
      seeDoctor: 'If headache with confusion, vision changes, or altitude symptoms.',
      localPhrase: 'I have a headache',
      localMedication: 'Paracetamol available at pharmacies.',
    },
    injury: {
      riskLevel: 'moderate',
      commonCauses: ['Safari vehicle accidents', 'Hiking injuries', 'Animal encounters'],
      whatToDo: [
        'Safari guides carry first aid kits',
        'For snake bites: immobilize, do NOT suck venom, get to hospital',
        'Private hospitals in major cities are good quality',
        'Flying doctors service available in remote areas (East Africa)',
      ],
      seeDoctor: 'For any animal bite, snake bite, or significant injury.',
      localPhrase: 'I am injured / I need help',
      localMedication: 'First aid supplies at pharmacies. Private clinic for treatment.',
    },
    'eye-ear': {
      riskLevel: 'low',
      commonCauses: ['Dust irritation', 'River/lake water', 'Insect in ear during camping'],
      whatToDo: [
        'Rinse with clean bottled water',
        'Sunglasses for dust',
        'Avoid swimming in freshwater lakes (bilharzia risk)',
        'Tilt head for insect in ear, do not poke',
      ],
      seeDoctor: 'If pain, discharge, or swimming in potentially contaminated water.',
      localPhrase: 'My eye/ear hurts',
      localMedication: 'Eye drops at pharmacies.',
    },
    other: {
      riskLevel: 'moderate',
      commonCauses: ['Altitude sickness', 'Culture shock', 'Travel fatigue', 'Anxiety about safety'],
      whatToDo: [
        'Private clinics in major cities are reliable',
        'Travel insurance is essential in Africa',
        'Take antimalarials as prescribed',
        'Stay in well-reviewed accommodations',
      ],
      seeDoctor: 'If symptoms are concerning or unusual.',
      localPhrase: 'I am not feeling well',
      localMedication: 'Private pharmacy consultation recommended.',
    },
  },
  'north-america': {
    stomach: {
      riskLevel: 'low',
      commonCauses: ['Overeating', 'Food sensitivity', 'Restaurant food safety varies'],
      whatToDo: [
        'OTC medication widely available',
        'Hydrate and rest',
        'BRAT diet for recovery',
        'Pepto-Bismol for general stomach upset',
      ],
      seeDoctor: 'If symptoms persist beyond 48 hours or bloody stool.',
      localPhrase: 'I have a stomach ache',
      localMedication: 'Pepto-Bismol, Tums, Imodium. Available at any pharmacy/drugstore.',
    },
    fever: {
      riskLevel: 'low',
      commonCauses: ['Cold/flu', 'Travel exhaustion', 'Allergies'],
      whatToDo: [
        'Tylenol (acetaminophen) or Advil (ibuprofen)',
        'Rest and hydrate',
        'Urgent care clinics for quick treatment',
        'COVID test if respiratory symptoms',
      ],
      seeDoctor: 'If fever above 39C for 48+ hours. Note: US healthcare is expensive without insurance.',
      localPhrase: 'I have a fever',
      localMedication: 'Tylenol, Advil, DayQuil/NyQuil. Available everywhere.',
    },
    skin: {
      riskLevel: 'low',
      commonCauses: ['Sunburn', 'Insect bites', 'Poison ivy (hiking)'],
      whatToDo: ['Aloe vera for sunburn', 'Calamine for poison ivy', 'Hydrocortisone for bites', 'Sunscreen SPF 30+'],
      seeDoctor: 'If severe allergic reaction or widespread rash.',
      localPhrase: 'I have a rash',
      localMedication: 'Hydrocortisone, calamine, Benadryl. Available at any drugstore.',
    },
    respiratory: {
      riskLevel: 'low',
      commonCauses: ['Seasonal allergies', 'Cold/flu', 'Wildfire smoke (western US)'],
      whatToDo: ['Antihistamines for allergies', 'Cough medicine OTC', 'Mask during wildfire smoke', 'Rest and hydrate'],
      seeDoctor: 'If breathing difficulty or persistent cough.',
      localPhrase: 'I have trouble breathing',
      localMedication: 'Zyrtec, Claritin (allergies), Mucinex, Robitussin (cough). All OTC.',
    },
    head: {
      riskLevel: 'low',
      commonCauses: ['Dehydration', 'Altitude (Denver, mountain areas)', 'Travel stress'],
      whatToDo: ['Hydrate', 'Tylenol or Advil', 'Rest in dark quiet room', 'Altitude: acclimatize'],
      seeDoctor: 'If severe sudden headache or confusion.',
      localPhrase: 'I have a headache',
      localMedication: 'Tylenol, Advil, Excedrin. Available everywhere.',
    },
    injury: {
      riskLevel: 'low',
      commonCauses: ['Sports injuries', 'Hiking accidents', 'Traffic'],
      whatToDo: [
        'Call 911 for emergencies',
        'Urgent care for non-emergency injuries',
        'RICE for sprains',
        'Note: ER visits can be very expensive without insurance',
      ],
      seeDoctor: 'For fractures, deep wounds, head injury.',
      localPhrase: 'I am hurt',
      localMedication: 'First aid supplies at any pharmacy/drugstore.',
    },
    'eye-ear': {
      riskLevel: 'low',
      commonCauses: ['Allergies', 'Pool water', 'Dry air (AC/heating)'],
      whatToDo: ['Artificial tears', 'Allergy eye drops', 'Warm compress for ear', 'Avoid rubbing eyes'],
      seeDoctor: 'If pain or vision changes.',
      localPhrase: 'My eye/ear hurts',
      localMedication: 'Visine, Systane, allergy drops. Available OTC.',
    },
    other: {
      riskLevel: 'low',
      commonCauses: ['Jet lag', 'Travel fatigue', 'Climate adjustment'],
      whatToDo: ['Rest', 'Hydrate', 'Melatonin for jet lag', 'CVS/Walgreens pharmacists can advise'],
      seeDoctor: 'If symptoms are unusual.',
      localPhrase: 'I am not feeling well',
      localMedication: 'CVS/Walgreens for OTC medications.',
    },
  },
  oceania: {
    stomach: {
      riskLevel: 'low',
      commonCauses: ['Overeating', 'Unfamiliar cuisine', 'Travel stress'],
      whatToDo: ['Hydrate', 'Light meals', 'Pharmacy consultation', 'OTC antacids'],
      seeDoctor: 'If symptoms persist beyond 48 hours.',
      localPhrase: 'I have a stomach ache',
      localMedication: 'Gastro-Stop, Mylanta. Available at pharmacies.',
    },
    fever: {
      riskLevel: 'low',
      commonCauses: ['Cold/flu', 'Travel fatigue', 'Sunstroke'],
      whatToDo: ['Paracetamol', 'Rest and hydrate', 'Stay out of sun if sunstroke suspected', 'Pharmacy consultation'],
      seeDoctor: 'If fever above 39C or sunstroke symptoms.',
      localPhrase: 'I have a fever',
      localMedication: 'Panadol (paracetamol), Nurofen (ibuprofen). Available everywhere.',
    },
    skin: {
      riskLevel: 'moderate',
      commonCauses: ['Extreme UV (Australia has highest UV index)', 'Jellyfish stings', 'Spider/insect bites'],
      whatToDo: [
        'SPF 50+ is essential — Australian sun is dangerous',
        'For jellyfish: vinegar then hot water',
        'For spider bites: pressure bandage and immobilize',
        'Photograph any spider/snake for identification',
      ],
      seeDoctor: 'Immediately for suspected spider or snake bite. For severe sunburn with blistering.',
      localPhrase: 'I have been bitten/stung',
      localMedication: 'Aloe vera, antihistamine cream, SPF 50+ sunscreen. Available everywhere.',
    },
    respiratory: {
      riskLevel: 'low',
      commonCauses: ['Bushfire smoke (season dependent)', 'Pollen', 'Cold/flu'],
      whatToDo: ['P2/N95 mask during bushfire smoke', 'Check air quality apps', 'Antihistamines for pollen', 'Rest'],
      seeDoctor: 'If breathing difficulty.',
      localPhrase: 'I have trouble breathing',
      localMedication: 'Antihistamines, cough medicine. Available at pharmacies.',
    },
    head: {
      riskLevel: 'low',
      commonCauses: ['Dehydration (hot climate)', 'Sun exposure', 'Jet lag'],
      whatToDo: ['Hydrate', 'Panadol', 'Shade and rest', 'Hat and sunglasses essential'],
      seeDoctor: 'If severe or sudden headache.',
      localPhrase: 'I have a headache',
      localMedication: 'Panadol, Nurofen. Available everywhere.',
    },
    injury: {
      riskLevel: 'moderate',
      commonCauses: ['Ocean-related (rips, stingers)', 'Wildlife encounters', 'Hiking/outdoor sports'],
      whatToDo: [
        'Swim between the flags at patrolled beaches',
        'For snake bite: pressure immobilization bandage, call 000',
        'Hospitals are excellent quality',
        'Medicare not available for tourists — travel insurance essential',
      ],
      seeDoctor: 'For any wildlife encounter, ocean injury, or significant trauma. Call 000.',
      localPhrase: 'I need an ambulance',
      localMedication: 'First aid at pharmacies. Hospitals well-equipped.',
    },
    'eye-ear': {
      riskLevel: 'low',
      commonCauses: ['UV damage to eyes', 'Ocean water', 'Sand'],
      whatToDo: ['UV-rated sunglasses essential', 'Rinse with clean water', 'Artificial tears', 'Avoid rubbing'],
      seeDoctor: 'If pain or vision changes.',
      localPhrase: 'My eye/ear hurts',
      localMedication: 'Eye drops, ear drops at pharmacies.',
    },
    other: {
      riskLevel: 'low',
      commonCauses: ['Jet lag (long flights to AU/NZ)', 'Climate adjustment', 'Travel fatigue'],
      whatToDo: ['Rest', 'Hydrate', 'Australian/NZ pharmacists are excellent', 'Melatonin for jet lag'],
      seeDoctor: 'If symptoms are unusual.',
      localPhrase: 'I am not feeling well',
      localMedication: 'Pharmacy consultation. Australian pharmacists can prescribe some medications.',
    },
  },
};

const DEFAULT_INTEL: SymptomIntel = {
  riskLevel: 'moderate',
  commonCauses: ['Unfamiliar food or water', 'Travel exhaustion or stress', 'Climate change from home'],
  whatToDo: [
    'Stay hydrated and rest',
    'Visit a local pharmacy — pharmacists can often diagnose and recommend',
    'Take basic OTC medication (paracetamol, antihistamine)',
    'Monitor symptoms for 24-48 hours',
  ],
  seeDoctor: 'If symptoms worsen, do not improve in 48 hours, or are accompanied by high fever.',
  localPhrase: 'I need medical help',
  localMedication: 'Paracetamol for pain/fever. ORS for dehydration. Antihistamine for allergies.',
};

function getSymptomIntel(destination: string, categoryId: string): SymptomIntel {
  const region = getRegion(destination);
  return SYMPTOM_DATA[region]?.[categoryId] ?? DEFAULT_INTEL;
}

// ---------------------------------------------------------------------------
// Sub-components
// ---------------------------------------------------------------------------

function Disclaimer() {
  return (
    <View style={styles.disclaimer}>
      <Info size={12} color={COLORS.creamMuted} strokeWidth={2} />
      <Text style={styles.disclaimerText}>
        For informational purposes only. Always consult a doctor for medical advice.
      </Text>
    </View>
  );
}

function RiskBadge({ level }: { level: 'low' | 'moderate' | 'high' }) {
  const config = {
    low: { label: 'LOW RISK', color: COLORS.sage },
    moderate: { label: 'MODERATE', color: COLORS.gold },
    high: { label: 'HIGH RISK', color: COLORS.coral },
  }[level];
  return (
    <View style={[styles.riskBadge, { backgroundColor: config.color + '15', borderColor: config.color + '30' }]}>
      <View style={[styles.riskDot, { backgroundColor: config.color }]} />
      <Text style={[styles.riskLabel, { color: config.color }]}>{config.label}</Text>
    </View>
  );
}

function StatusBadge({ status }: { status: LegalStatus }) {
  const config: Record<LegalStatus, { label: string; color: string; Icon: typeof CheckCircle }> = {
    legal: { label: 'LEGAL', color: COLORS.sage, Icon: CheckCircle },
    'prescription-only': { label: 'PRESCRIPTION', color: COLORS.gold, Icon: Lock },
    restricted: { label: 'RESTRICTED', color: COLORS.coral, Icon: AlertTriangle },
    banned: { label: 'BANNED', color: COLORS.coral, Icon: Ban },
  };
  const c = config[status];
  return (
    <View style={[styles.riskBadge, { backgroundColor: c.color + '15', borderColor: c.color + '30' }]}>
      <c.Icon size={12} color={c.color} strokeWidth={2} />
      <Text style={[styles.riskLabel, { color: c.color }]}>{c.label}</Text>
    </View>
  );
}

// ---------------------------------------------------------------------------
// Tab selector
// ---------------------------------------------------------------------------

function TabSelector({
  activeTab,
  onSelect,
}: {
  activeTab: TabId;
  onSelect: (tab: TabId) => void;
}) {
  return (
    <View style={styles.tabRow}>
      {TABS.map((tab) => {
        const active = tab === activeTab;
        return (
          <Pressable
            key={tab}
            onPress={() => {
              Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
              onSelect(tab);
            }}
            style={[styles.tabBtn, active && styles.tabBtnActive]}
          >
            {TAB_CONFIG[tab].icon}
            <Text style={[styles.tabLabel, active && styles.tabLabelActive]}>
              {TAB_CONFIG[tab].label}
            </Text>
          </Pressable>
        );
      })}
    </View>
  );
}

// ---------------------------------------------------------------------------
// Section 1 — Symptom Checker
// ---------------------------------------------------------------------------

function SymptomSection({ destination }: { destination: string }) {
  const [selectedCategory, setSelectedCategory] = useState<string | null>(null);
  const symptomIntel = useMemo(
    () => (selectedCategory ? getSymptomIntel(destination, selectedCategory) : null),
    [destination, selectedCategory],
  );
  const region = useMemo(() => getRegion(destination), [destination]);
  const emergencyPhrase = useMemo(() => EMERGENCY_PHRASES[region], [region]);

  const handleCategorySelect = useCallback(
    (id: string) => {
      Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Medium);
      setSelectedCategory(id);
      captureEvent('body_intel_symptom_selected', { category: id, destination });
    },
    [destination],
  );

  if (selectedCategory && symptomIntel) {
    const catLabel = SYMPTOM_CATEGORIES.find((c) => c.id === selectedCategory)?.label ?? selectedCategory;
    return (
      <View style={styles.sectionContent}>
        <Pressable
          onPress={() => {
            Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
            setSelectedCategory(null);
          }}
          style={styles.backBtn}
        >
          <ChevronRight
            size={16}
            color={COLORS.creamMuted}
            strokeWidth={2}
            style={{ transform: [{ rotate: '180deg' }] }}
          />
          <Text style={styles.backText}>Back to symptoms</Text>
        </Pressable>

        <Text style={styles.sectionTitle}>
          {catLabel} in {destination}
        </Text>
        <RiskBadge level={symptomIntel.riskLevel} />

        {/* Common causes */}
        <View style={styles.intelCard}>
          <Text style={styles.intelCardTitle}>Most likely causes</Text>
          {symptomIntel.commonCauses.map((cause, i) => (
            <View key={i} style={styles.bulletRow}>
              <View style={styles.bulletDot} />
              <Text style={styles.bulletText}>{cause}</Text>
            </View>
          ))}
        </View>

        {/* What to do */}
        <View style={styles.intelCard}>
          <Text style={styles.intelCardTitle}>What to do right now</Text>
          {symptomIntel.whatToDo.map((step, i) => (
            <View key={i} style={styles.numberedRow}>
              <Text style={styles.numberedNum}>{i + 1}</Text>
              <Text style={styles.bulletText}>{step}</Text>
            </View>
          ))}
        </View>

        {/* When to see a doctor */}
        <View style={[styles.intelCard, { borderColor: COLORS.coral + '30' }]}>
          <Text style={[styles.intelCardTitle, { color: COLORS.coral }]}>When to see a doctor</Text>
          <Text style={styles.bulletText}>{symptomIntel.seeDoctor}</Text>
        </View>

        {/* What to say to local doctor */}
        <View style={styles.intelCard}>
          <Text style={styles.intelCardTitle}>
            Say this to a local doctor ({emergencyPhrase.language})
          </Text>
          <Text style={styles.phraseText}>{emergencyPhrase.phonetic}</Text>
          <Text style={styles.phraseSub}>"{emergencyPhrase.phrase}"</Text>
        </View>

        {/* Local medication */}
        <View style={styles.intelCard}>
          <Pill size={16} color={COLORS.sage} strokeWidth={2} />
          <Text style={[styles.intelCardTitle, { marginTop: SPACING.xs }]}>Local medication</Text>
          <Text style={styles.bulletText}>{symptomIntel.localMedication}</Text>
        </View>

        <Disclaimer />
      </View>
    );
  }

  return (
    <View style={styles.sectionContent}>
      <Text style={styles.sectionTitle}>What are you feeling?</Text>
      <Text style={styles.sectionSub}>
        Select a symptom category for {destination}-specific guidance.
      </Text>
      <View style={styles.categoryGrid}>
        {SYMPTOM_CATEGORIES.map((cat) => (
          <Pressable
            key={cat.id}
            onPress={() => handleCategorySelect(cat.id)}
            style={({ pressed }) => [styles.categoryCard, pressed && { opacity: 0.7 }]}
          >
            <cat.Icon size={20} color={COLORS.sage} strokeWidth={2} />
            <Text style={styles.categoryLabel}>{cat.label}</Text>
          </Pressable>
        ))}
      </View>
      <Disclaimer />
    </View>
  );
}

// ---------------------------------------------------------------------------
// Section 2 — Health Brief
// ---------------------------------------------------------------------------

function HealthBriefSection({ destination }: { destination: string }) {
  const medicalGuide = useMemo(() => getMedicalGuideByDestination(destination), [destination]);
  const healthBrief = useMemo(() => getHealthBrief(destination), [destination]);
  const [expandedSection, setExpandedSection] = useState<string | null>(null);

  const toggleSection = useCallback((section: string) => {
    Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
    setExpandedSection((prev) => (prev === section ? null : section));
  }, []);

  return (
    <View style={styles.sectionContent}>
      <Text style={styles.sectionTitle}>Health Brief</Text>
      <Text style={styles.sectionSub}>Key health information for {destination}.</Text>

      {/* Vaccinations */}
      <View style={styles.briefCard}>
        <Shield size={16} color={COLORS.sage} strokeWidth={2} />
        <View style={{ flex: 1 }}>
          <Text style={styles.briefLabel}>Vaccinations</Text>
          <Text style={styles.briefValue}>{healthBrief.vaccinations}</Text>
        </View>
      </View>

      {/* Water safety */}
      {medicalGuide && (
        <View
          style={[
            styles.briefCard,
            { borderColor: medicalGuide.tapWaterSafe ? COLORS.sage + '30' : COLORS.coral + '30' },
          ]}
        >
          <Droplets size={16} color={medicalGuide.tapWaterSafe ? COLORS.sage : COLORS.coral} strokeWidth={2} />
          <View style={{ flex: 1 }}>
            <Text
              style={[styles.briefLabel, { color: medicalGuide.tapWaterSafe ? COLORS.sage : COLORS.coral }]}
            >
              {medicalGuide.tapWaterSafe ? 'Tap water is safe' : 'Use bottled water only'}
            </Text>
            <Text style={styles.briefValue}>{medicalGuide.waterNote}</Text>
          </View>
        </View>
      )}

      {/* Food safety */}
      <View style={styles.briefCard}>
        <AlertTriangle size={16} color={COLORS.gold} strokeWidth={2} />
        <View style={{ flex: 1 }}>
          <Text style={styles.briefLabel}>Food Safety</Text>
          <Text style={styles.briefValue}>
            {medicalGuide?.pharmacyNote ?? 'Check local pharmacy for food safety guidance.'}
          </Text>
        </View>
      </View>

      {/* Health risks */}
      {medicalGuide && medicalGuide.healthRisks.length > 0 && (
        <Pressable onPress={() => toggleSection('risks')} style={styles.briefCard}>
          <AlertTriangle size={16} color={COLORS.coral} strokeWidth={2} />
          <View style={{ flex: 1 }}>
            <Text style={styles.briefLabel}>Health Risks</Text>
            {expandedSection === 'risks' ? (
              medicalGuide.healthRisks.map((risk, i) => (
                <Text key={i} style={styles.riskItem}>
                  {risk}
                </Text>
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

      {/* Hospital quality */}
      {medicalGuide && (
        <View style={styles.briefCard}>
          <Heart size={16} color={COLORS.sage} strokeWidth={2} />
          <View style={{ flex: 1 }}>
            <Text style={styles.briefLabel}>
              Hospital Quality: {medicalGuide.hospitalQuality.toUpperCase()}
            </Text>
            <Text style={styles.briefValue}>{medicalGuide.hospitalNote}</Text>
            <Text style={[styles.briefValue, { color: COLORS.gold, marginTop: 4 }]}>
              ER cost without insurance: {medicalGuide.erCostRange}
            </Text>
          </View>
        </View>
      )}

      {/* Emergency numbers */}
      {medicalGuide && (
        <View style={[styles.briefCard, { borderColor: COLORS.coral + '30' }]}>
          <Phone size={16} color={COLORS.coral} strokeWidth={2} />
          <View style={{ flex: 1 }}>
            <Text style={[styles.briefLabel, { color: COLORS.coral }]}>Emergency Numbers</Text>
            <Text style={styles.briefValue}>
              Emergency: {medicalGuide.emergencyNumber} | Ambulance: {medicalGuide.ambulanceNumber} |
              Police: {medicalGuide.policeNumber}
            </Text>
            <Text style={[styles.briefValue, { marginTop: 4, fontStyle: 'italic' }]}>
              {medicalGuide.englishNote}
            </Text>
          </View>
        </View>
      )}

      {/* Insurance priority */}
      {medicalGuide && (
        <View style={styles.briefCard}>
          <Shield size={16} color={COLORS.gold} strokeWidth={2} />
          <View style={{ flex: 1 }}>
            <Text style={styles.briefLabel}>
              Travel Insurance: {medicalGuide.insurancePriority.toUpperCase()}
            </Text>
            <Text style={styles.briefValue}>{medicalGuide.insuranceNote}</Text>
          </View>
        </View>
      )}

      <Disclaimer />
    </View>
  );
}

// ---------------------------------------------------------------------------
// Section 3 — Medication Check
// ---------------------------------------------------------------------------

function MedicationSection({ destination }: { destination: string }) {
  const [query, setQuery] = useState('');
  const [result, setResult] = useState<MedicationCheckResult | null>(null);
  const [notFound, setNotFound] = useState(false);

  const suggestions = useMemo(() => searchMedications(query), [query]);

  const restrictedMeds = useMemo(() => getRestrictedMedications(destination), [destination]);

  const handleCheck = useCallback(
    (medName: string) => {
      Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Medium);
      const res = checkMedication(medName, destination);
      if (res) {
        setResult(res);
        setNotFound(false);
        captureEvent('medication_checked', { medication: medName, destination, status: res.status });
      } else {
        setResult(null);
        setNotFound(true);
      }
    },
    [destination],
  );

  return (
    <View style={styles.sectionContent}>
      <Text style={styles.sectionTitle}>Medication Check</Text>
      <Text style={styles.sectionSub}>
        Check if your medication is legal in {destination}.
      </Text>

      {/* Search input */}
      <View style={styles.searchRow}>
        <Search size={16} color={COLORS.creamMuted} strokeWidth={2} />
        <TextInput
          style={styles.searchInput}
          value={query}
          onChangeText={(text) => {
            setQuery(text);
            setResult(null);
            setNotFound(false);
          }}
          placeholder="Enter medication name..."
          placeholderTextColor={COLORS.creamDim}
          autoCapitalize="none"
          autoCorrect={false}
        />
        {query.length > 0 && (
          <Pressable
            onPress={() => {
              setQuery('');
              setResult(null);
              setNotFound(false);
            }}
            hitSlop={8}
          >
            <X size={16} color={COLORS.creamMuted} strokeWidth={2} />
          </Pressable>
        )}
      </View>

      {/* Suggestions */}
      {suggestions.length > 0 && !result && (
        <View style={styles.suggestionsWrap}>
          {suggestions.slice(0, 6).map((s) => (
            <Pressable
              key={s.name}
              onPress={() => {
                setQuery(s.brands[0] ?? s.name);
                handleCheck(s.name);
              }}
              style={({ pressed }) => [styles.suggestionChip, pressed && { opacity: 0.7 }]}
            >
              <Pill size={12} color={COLORS.sage} strokeWidth={2} />
              <Text style={styles.suggestionText}>{s.brands[0] ?? s.name}</Text>
              <Text style={styles.suggestionClass}>{s.drugClass}</Text>
            </Pressable>
          ))}
        </View>
      )}

      {/* Result */}
      {result && (
        <View style={styles.resultCard}>
          <View style={styles.resultHeader}>
            <Text style={styles.resultMedName}>{result.medication}</Text>
            <StatusBadge status={result.status} />
          </View>
          <Text style={styles.resultNote}>{result.note}</Text>
          {result.localEquivalent && (
            <View style={styles.equivalentRow}>
              <Pill size={14} color={COLORS.sage} strokeWidth={2} />
              <Text style={styles.equivalentText}>
                Local equivalent: {result.localEquivalent}
              </Text>
            </View>
          )}
          {result.isControlled && (
            <View style={[styles.warningBanner, { backgroundColor: COLORS.coral + '10' }]}>
              <AlertTriangle size={14} color={COLORS.coral} strokeWidth={2} />
              <Text style={[styles.warningText, { color: COLORS.coral }]}>
                This medication has special restrictions in {destination}. Verify with the local
                embassy before traveling.
              </Text>
            </View>
          )}
        </View>
      )}

      {/* Not found */}
      {notFound && query.length > 2 && (
        <View style={styles.notFoundCard}>
          <HelpCircle size={20} color={COLORS.creamMuted} strokeWidth={2} />
          <Text style={styles.notFoundText}>
            Medication not in our database. Contact the embassy of your destination country for
            specific regulations.
          </Text>
        </View>
      )}

      {/* Restricted meds for this destination */}
      {restrictedMeds.length > 0 && !result && query.length === 0 && (
        <View style={styles.restrictedSection}>
          <Text style={styles.restrictedTitle}>
            Restricted medications in {destination}
          </Text>
          {restrictedMeds.map((med, i) => (
            <View key={i} style={styles.restrictedRow}>
              <StatusBadge status={med.status} />
              <Text style={styles.restrictedMedName}>{med.medication}</Text>
            </View>
          ))}
        </View>
      )}

      <Disclaimer />
    </View>
  );
}

// ---------------------------------------------------------------------------
// Destination Picker
// ---------------------------------------------------------------------------

function DestinationPicker({
  value,
  onChange,
  trips,
}: {
  value: string;
  onChange: (v: string) => void;
  trips: Array<{ destination: string }>;
}) {
  const allDests = useMemo(() => [...DESTINATIONS, ...HIDDEN_DESTINATIONS], []);
  const savedDests = useMemo(
    () => [...new Set(trips.map((t) => t.destination))],
    [trips],
  );

  return (
    <View style={styles.destPicker}>
      <Text style={styles.destPickerLabel}>Your destination</Text>
      {savedDests.length > 0 && (
        <ScrollView
          horizontal
          showsHorizontalScrollIndicator={false}
          contentContainerStyle={styles.destChipRow}
        >
          {savedDests.map((dest) => {
            const active = dest === value;
            return (
              <Pressable
                key={dest}
                onPress={() => {
                  Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
                  onChange(dest);
                }}
                style={[styles.destChip, active && styles.destChipActive]}
              >
                <Text style={[styles.destChipText, active && styles.destChipTextActive]}>{dest}</Text>
              </Pressable>
            );
          })}
        </ScrollView>
      )}
      <View style={styles.searchRow}>
        <Search size={16} color={COLORS.creamMuted} strokeWidth={2} />
        <TextInput
          style={styles.searchInput}
          value={value}
          onChangeText={onChange}
          placeholder="Or search any destination..."
          placeholderTextColor={COLORS.creamDim}
        />
      </View>
    </View>
  );
}

// ---------------------------------------------------------------------------
// Main Screen
// ---------------------------------------------------------------------------

export default function HealthTabScreen() {
  const insets = useSafeAreaInsets();
  const trips = useAppStore((s) => s.trips);

  const [destination, setDestination] = useState('');
  const [activeTab, setActiveTab] = useState<TabId>('symptoms');

  useEffect(() => {
    track({ type: 'screen_view', screen: 'health-tab' });
  }, []);

  // Auto-set destination from latest trip
  useEffect(() => {
    if (!destination && trips.length > 0) {
      setDestination(trips[0].destination);
    }
  }, [destination, trips]);

  return (
    <View style={[styles.container, { paddingTop: insets.top }]}>
      {/* Header */}
      <View style={styles.header}>
        <Activity size={22} color={COLORS.sage} strokeWidth={2} />
        <Text style={styles.headerTitle}>Health</Text>
      </View>

      <ScrollView
        contentContainerStyle={styles.scrollContent}
        showsVerticalScrollIndicator={false}
        keyboardShouldPersistTaps="handled"
      >
        {/* Destination picker */}
        <DestinationPicker value={destination} onChange={setDestination} trips={trips} />

        {destination.length > 1 && (
          <>
            {/* Section tabs */}
            <TabSelector activeTab={activeTab} onSelect={setActiveTab} />

            {/* Active section */}
            {activeTab === 'symptoms' && <SymptomSection destination={destination} />}
            {activeTab === 'brief' && <HealthBriefSection destination={destination} />}
            {activeTab === 'meds' && <MedicationSection destination={destination} />}
          </>
        )}

        {destination.length <= 1 && (
          <View style={styles.emptyState}>
            <Activity size={40} color={COLORS.creamDim} strokeWidth={1.5} />
            <Text style={styles.emptyTitle}>Select a destination</Text>
            <Text style={styles.emptySub}>
              Choose from your saved trips or search any city to get destination-specific health
              intelligence.
            </Text>
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
    gap: SPACING.sm,
    paddingHorizontal: SPACING.lg,
    paddingVertical: SPACING.md,
  } as ViewStyle,
  headerTitle: {
    fontFamily: FONTS.header,
    fontSize: 28,
    color: COLORS.cream,
  } as TextStyle,
  scrollContent: {
    paddingHorizontal: SPACING.lg,
    paddingBottom: 120,
  } as ViewStyle,

  // Disclaimer
  disclaimer: {
    flexDirection: 'row',
    alignItems: 'flex-start',
    gap: SPACING.xs,
    backgroundColor: COLORS.bgElevated,
    borderRadius: RADIUS.sm,
    padding: SPACING.sm,
    marginTop: SPACING.md,
  } as ViewStyle,
  disclaimerText: {
    fontFamily: FONTS.body,
    fontSize: 11,
    color: COLORS.creamMuted,
    flex: 1,
    lineHeight: 16,
  } as TextStyle,

  // Destination picker
  destPicker: {
    gap: SPACING.sm,
    marginBottom: SPACING.md,
  } as ViewStyle,
  destPickerLabel: {
    fontFamily: FONTS.mono,
    fontSize: 11,
    color: COLORS.creamMuted,
    letterSpacing: 0.5,
    textTransform: 'uppercase',
  } as TextStyle,
  destChipRow: {
    gap: SPACING.xs,
  } as ViewStyle,
  destChip: {
    paddingHorizontal: SPACING.md,
    paddingVertical: SPACING.xs,
    borderRadius: RADIUS.full,
    backgroundColor: COLORS.bgElevated,
    borderWidth: 1,
    borderColor: COLORS.border,
  } as ViewStyle,
  destChipActive: {
    backgroundColor: COLORS.sage + '20',
    borderColor: COLORS.sage,
  } as ViewStyle,
  destChipText: {
    fontFamily: FONTS.bodySemiBold,
    fontSize: 13,
    color: COLORS.creamMuted,
  } as TextStyle,
  destChipTextActive: {
    color: COLORS.sage,
  } as TextStyle,

  // Search
  searchRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: SPACING.sm,
    backgroundColor: COLORS.bgElevated,
    borderRadius: RADIUS.md,
    paddingHorizontal: SPACING.md,
    paddingVertical: SPACING.sm,
    borderWidth: 1,
    borderColor: COLORS.border,
  } as ViewStyle,
  searchInput: {
    flex: 1,
    fontFamily: FONTS.body,
    fontSize: 14,
    color: COLORS.cream,
    padding: 0,
  } as TextStyle,

  // Tab selector
  tabRow: {
    flexDirection: 'row',
    gap: SPACING.xs,
    marginBottom: SPACING.lg,
  } as ViewStyle,
  tabBtn: {
    flex: 1,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 6,
    paddingVertical: SPACING.sm,
    borderRadius: RADIUS.md,
    backgroundColor: COLORS.bgElevated,
    borderWidth: 1,
    borderColor: COLORS.border,
  } as ViewStyle,
  tabBtnActive: {
    backgroundColor: COLORS.sage + '15',
    borderColor: COLORS.sage + '40',
  } as ViewStyle,
  tabLabel: {
    fontFamily: FONTS.bodySemiBold,
    fontSize: 12,
    color: COLORS.creamMuted,
  } as TextStyle,
  tabLabelActive: {
    color: COLORS.sage,
  } as TextStyle,

  // Section content
  sectionContent: {
    gap: SPACING.md,
  } as ViewStyle,
  sectionTitle: {
    fontFamily: FONTS.header,
    fontSize: 22,
    color: COLORS.cream,
  } as TextStyle,
  sectionSub: {
    fontFamily: FONTS.body,
    fontSize: 13,
    color: COLORS.creamMuted,
    lineHeight: 18,
  } as TextStyle,

  // Category grid
  categoryGrid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: SPACING.sm,
  } as ViewStyle,
  categoryCard: {
    width: '47%' as unknown as number,
    flexGrow: 1,
    flexDirection: 'row',
    alignItems: 'center',
    gap: SPACING.sm,
    backgroundColor: COLORS.bgElevated,
    borderRadius: RADIUS.md,
    padding: SPACING.md,
    borderWidth: 1,
    borderColor: COLORS.border,
  } as ViewStyle,
  categoryLabel: {
    fontFamily: FONTS.bodySemiBold,
    fontSize: 13,
    color: COLORS.cream,
    flexShrink: 1,
  } as TextStyle,

  // Back button
  backBtn: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
  } as ViewStyle,
  backText: {
    fontFamily: FONTS.body,
    fontSize: 13,
    color: COLORS.creamMuted,
  } as TextStyle,

  // Risk badge
  riskBadge: {
    flexDirection: 'row',
    alignItems: 'center',
    alignSelf: 'flex-start',
    gap: 6,
    paddingHorizontal: SPACING.sm,
    paddingVertical: 4,
    borderRadius: RADIUS.full,
    borderWidth: 1,
  } as ViewStyle,
  riskDot: {
    width: 6,
    height: 6,
    borderRadius: 3,
  } as ViewStyle,
  riskLabel: {
    fontFamily: FONTS.mono,
    fontSize: 10,
    letterSpacing: 0.5,
  } as TextStyle,

  // Intel cards
  intelCard: {
    backgroundColor: COLORS.bgElevated,
    borderRadius: RADIUS.md,
    padding: SPACING.md,
    gap: SPACING.xs,
    borderWidth: 1,
    borderColor: COLORS.border,
  } as ViewStyle,
  intelCardTitle: {
    fontFamily: FONTS.bodySemiBold,
    fontSize: 14,
    color: COLORS.cream,
    marginBottom: 4,
  } as TextStyle,
  bulletRow: {
    flexDirection: 'row',
    gap: SPACING.sm,
    alignItems: 'flex-start',
  } as ViewStyle,
  bulletDot: {
    width: 4,
    height: 4,
    borderRadius: 2,
    backgroundColor: COLORS.sage,
    marginTop: 7,
  } as ViewStyle,
  bulletText: {
    fontFamily: FONTS.body,
    fontSize: 13,
    color: COLORS.creamMuted,
    lineHeight: 18,
    flex: 1,
  } as TextStyle,
  numberedRow: {
    flexDirection: 'row',
    gap: SPACING.sm,
    alignItems: 'flex-start',
  } as ViewStyle,
  numberedNum: {
    fontFamily: FONTS.mono,
    fontSize: 12,
    color: COLORS.sage,
    width: 16,
    textAlign: 'center',
  } as TextStyle,
  phraseText: {
    fontFamily: FONTS.header,
    fontSize: 18,
    color: COLORS.gold,
    marginTop: 4,
  } as TextStyle,
  phraseSub: {
    fontFamily: FONTS.body,
    fontSize: 12,
    color: COLORS.creamMuted,
    fontStyle: 'italic',
  } as TextStyle,

  // Brief cards
  briefCard: {
    flexDirection: 'row',
    alignItems: 'flex-start',
    gap: SPACING.sm,
    backgroundColor: COLORS.bgElevated,
    borderRadius: RADIUS.md,
    padding: SPACING.md,
    borderWidth: 1,
    borderColor: COLORS.border,
  } as ViewStyle,
  briefLabel: {
    fontFamily: FONTS.bodySemiBold,
    fontSize: 13,
    color: COLORS.cream,
  } as TextStyle,
  briefValue: {
    fontFamily: FONTS.body,
    fontSize: 12,
    color: COLORS.creamMuted,
    lineHeight: 17,
    marginTop: 2,
  } as TextStyle,
  riskItem: {
    fontFamily: FONTS.body,
    fontSize: 12,
    color: COLORS.creamMuted,
    lineHeight: 17,
    marginTop: 4,
  } as TextStyle,

  // Medication section
  suggestionsWrap: {
    gap: SPACING.xs,
  } as ViewStyle,
  suggestionChip: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: SPACING.sm,
    backgroundColor: COLORS.bgElevated,
    borderRadius: RADIUS.md,
    padding: SPACING.sm,
    borderWidth: 1,
    borderColor: COLORS.border,
  } as ViewStyle,
  suggestionText: {
    fontFamily: FONTS.bodySemiBold,
    fontSize: 13,
    color: COLORS.cream,
    flex: 1,
  } as TextStyle,
  suggestionClass: {
    fontFamily: FONTS.mono,
    fontSize: 10,
    color: COLORS.creamMuted,
  } as TextStyle,
  resultCard: {
    backgroundColor: COLORS.bgElevated,
    borderRadius: RADIUS.md,
    padding: SPACING.md,
    gap: SPACING.sm,
    borderWidth: 1,
    borderColor: COLORS.border,
  } as ViewStyle,
  resultHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
  } as ViewStyle,
  resultMedName: {
    fontFamily: FONTS.header,
    fontSize: 20,
    color: COLORS.cream,
  } as TextStyle,
  resultNote: {
    fontFamily: FONTS.body,
    fontSize: 13,
    color: COLORS.creamMuted,
    lineHeight: 18,
  } as TextStyle,
  equivalentRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: SPACING.sm,
    backgroundColor: COLORS.sage + '10',
    borderRadius: RADIUS.sm,
    padding: SPACING.sm,
  } as ViewStyle,
  equivalentText: {
    fontFamily: FONTS.bodySemiBold,
    fontSize: 13,
    color: COLORS.sage,
    flex: 1,
  } as TextStyle,
  warningBanner: {
    flexDirection: 'row',
    alignItems: 'flex-start',
    gap: SPACING.sm,
    borderRadius: RADIUS.sm,
    padding: SPACING.sm,
  } as ViewStyle,
  warningText: {
    fontFamily: FONTS.body,
    fontSize: 12,
    lineHeight: 17,
    flex: 1,
  } as TextStyle,
  notFoundCard: {
    alignItems: 'center',
    gap: SPACING.sm,
    backgroundColor: COLORS.bgElevated,
    borderRadius: RADIUS.md,
    padding: SPACING.lg,
  } as ViewStyle,
  notFoundText: {
    fontFamily: FONTS.body,
    fontSize: 13,
    color: COLORS.creamMuted,
    textAlign: 'center',
    lineHeight: 18,
  } as TextStyle,
  restrictedSection: {
    gap: SPACING.sm,
    marginTop: SPACING.sm,
  } as ViewStyle,
  restrictedTitle: {
    fontFamily: FONTS.bodySemiBold,
    fontSize: 14,
    color: COLORS.coral,
  } as TextStyle,
  restrictedRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: SPACING.sm,
  } as ViewStyle,
  restrictedMedName: {
    fontFamily: FONTS.body,
    fontSize: 13,
    color: COLORS.cream,
  } as TextStyle,

  // Empty state
  emptyState: {
    alignItems: 'center',
    gap: SPACING.md,
    paddingVertical: SPACING.xl,
  } as ViewStyle,
  emptyTitle: {
    fontFamily: FONTS.header,
    fontSize: 22,
    color: COLORS.cream,
  } as TextStyle,
  emptySub: {
    fontFamily: FONTS.body,
    fontSize: 14,
    color: COLORS.creamMuted,
    textAlign: 'center',
    lineHeight: 20,
    paddingHorizontal: SPACING.lg,
  } as TextStyle,
});
