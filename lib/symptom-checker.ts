// =============================================================================
// ROAM — Destination-Aware Symptom Intelligence Engine
// Travel health intelligence only. Not a substitute for medical advice.
// =============================================================================

// ---------------------------------------------------------------------------
// Types
// ---------------------------------------------------------------------------

export interface SymptomCategory {
  id: string;
  label: string;
  description: string;
}

export interface RegionalRisk {
  riskLevel: 'low' | 'moderate' | 'high';
  commonCauses: string[];
  whatToDo: string[];
  seeDoctor: string;
  localMedication: string;
}

export interface SymptomAdvice {
  categoryId: string;
  destination: string;
  region: string;
  riskLevel: 'low' | 'moderate' | 'high';
  commonCauses: string[];
  whatToDo: string[];
  seeDoctor: string;
  localMedication: string;
}

export interface MedicationAlert {
  medication: string;
  countries: string[];
  alert: string;
  action: string;
}

export interface EmergencyPhrase {
  phrase: string;
  phonetic: string;
  language: string;
}

// ---------------------------------------------------------------------------
// Symptom Categories
// ---------------------------------------------------------------------------

export const SYMPTOM_CATEGORIES: SymptomCategory[] = [
  {
    id: 'stomach',
    label: 'Stomach Issues',
    description: 'Nausea, diarrhea, vomiting, cramps, bloating',
  },
  {
    id: 'fever',
    label: 'Fever/Chills',
    description: 'Elevated temperature, sweating, chills, body aches',
  },
  {
    id: 'skin',
    label: 'Skin Reaction',
    description: 'Rash, bites, hives, sunburn, itching, swelling',
  },
  {
    id: 'respiratory',
    label: 'Respiratory',
    description: 'Cough, shortness of breath, congestion, sore throat',
  },
  {
    id: 'head',
    label: 'Head/Dizziness',
    description: 'Headache, dizziness, lightheadedness, disorientation',
  },
  {
    id: 'injury',
    label: 'Injury',
    description: 'Cuts, sprains, fractures, bites, burns',
  },
  {
    id: 'eye-ear',
    label: 'Eye/Ear Issues',
    description: 'Eye irritation, ear pain, infection, discharge',
  },
  {
    id: 'other',
    label: 'Other',
    description: 'Fatigue, urinary symptoms, joint pain, or something else',
  },
];

// ---------------------------------------------------------------------------
// Regional Risks
// Regions: southeast-asia, south-asia, east-asia, middle-east, africa,
//          latin-america, europe, north-america, oceania
// ---------------------------------------------------------------------------

type RegionId =
  | 'southeast-asia'
  | 'south-asia'
  | 'east-asia'
  | 'middle-east'
  | 'africa'
  | 'latin-america'
  | 'europe'
  | 'north-america'
  | 'oceania';

type SymptomId =
  | 'stomach'
  | 'fever'
  | 'skin'
  | 'respiratory'
  | 'head'
  | 'injury'
  | 'eye-ear'
  | 'other';

export const REGIONAL_RISKS: Record<RegionId, Record<SymptomId, RegionalRisk>> = {
  // ---------------------------------------------------------------------------
  'southeast-asia': {
    stomach: {
      riskLevel: 'high',
      commonCauses: [
        'Travelers diarrhea from street food or contaminated water',
        'Viral gastroenteritis from food handling',
        'Heat combined with rich, spicy food',
      ],
      whatToDo: [
        'Switch immediately to bottled water — check the seal is intact',
        'Stick to plain rice, bananas, and plain bread until symptoms ease',
        'Rehydrate aggressively with electrolyte sachets (ORS) from any pharmacy',
        'Avoid dairy, raw vegetables, and street ice until fully recovered',
      ],
      seeDoctor:
        'Seek care if symptoms last more than 48 hours, you have bloody diarrhea, a fever above 38.5C, or cannot keep any fluids down.',
      localMedication:
        'Ask for ORS sachets (rehydration salts), loperamide (Imodium), and activated charcoal at any pharmacy. All available without prescription.',
    },
    fever: {
      riskLevel: 'high',
      commonCauses: [
        'Dengue fever from Aedes mosquito bite — peak risk in rainy season',
        'Chikungunya or Zika — same mosquito vector as dengue',
        'Food-borne illness or viral infection',
      ],
      whatToDo: [
        'Take paracetamol (not ibuprofen — contraindicated for dengue) to manage temperature',
        'Drink plenty of fluids — dengue causes dangerous dehydration',
        'Apply DEET repellent and sleep under a mosquito net even indoors',
        'Go to a clinic or hospital for a dengue rapid test — it takes 15 minutes',
      ],
      seeDoctor:
        'Go immediately if fever is above 39C, you have severe headache behind the eyes, joint pain, a rash appearing after the fever, or any bleeding (gums, skin spots). These are dengue warning signs.',
      localMedication:
        'Ask for paracetamol. Do NOT take ibuprofen or aspirin — they increase bleeding risk with dengue. Dengue tests are cheap at any private clinic.',
    },
    skin: {
      riskLevel: 'high',
      commonCauses: [
        'Mosquito bites and secondary infection from scratching',
        'Heat rash (miliaria) from humidity and sweat',
        'Contact dermatitis from plants, jellyfish, or coral',
      ],
      whatToDo: [
        'Clean any bite or wound with clean water and apply antiseptic immediately',
        'Keep the area dry — humidity causes rapid infection in skin breaks',
        'Apply hydrocortisone cream for itching; antihistamine tablets for widespread reaction',
        'Cover bites with clothing or bandage to prevent scratching and secondary infection',
      ],
      seeDoctor:
        'See a doctor if a bite or rash becomes red, warm, and swollen beyond the original site, or if you develop a fever alongside a rash — this can indicate dengue or a skin infection.',
      localMedication:
        'Ask for calamine lotion, hydrocortisone cream, and antihistamine tablets (cetirizine). For infected skin, pharmacists can dispense antibiotic cream without a prescription.',
    },
    respiratory: {
      riskLevel: 'moderate',
      commonCauses: [
        'Air pollution and haze from agricultural burning (Indonesia, Thailand)',
        'Air conditioning shifting you between hot/cold environments repeatedly',
        'Viral upper respiratory infection from crowded areas',
      ],
      whatToDo: [
        'Check the AQI — on high pollution days, wear an N95 mask outdoors',
        'Use saline nasal spray to clear pollution particles from airways',
        'Stay hydrated; air conditioning dries out mucous membranes significantly',
        'Rest and avoid alcohol which dehydrates further',
      ],
      seeDoctor:
        'Seek care for chest pain, shortness of breath at rest, fever above 38.5C with cough, or if symptoms do not improve after 5 days.',
      localMedication:
        'Ask for cetirizine (antihistamine), saline nasal spray, and paracetamol. Pharmacies carry cough syrups without prescription.',
    },
    head: {
      riskLevel: 'moderate',
      commonCauses: [
        'Dehydration from heat, humidity, and alcohol',
        'Dengue fever — severe headache behind the eyes is a hallmark symptom',
        'Motion sickness on winding roads or boat trips',
      ],
      whatToDo: [
        'Drink at least 3 liters of water per day in humid climates — more if active',
        'Reduce alcohol significantly in the first 48 hours in hot climate',
        'Rest in a cool, shaded environment and eat something',
        'If you have a fever alongside the headache, go to a clinic immediately',
      ],
      seeDoctor:
        'Go immediately if headache is severe and sudden, accompanied by fever, stiff neck, sensitivity to light, or if it is unlike any headache you have had before.',
      localMedication:
        'Ask for paracetamol and ORS sachets for rehydration. Avoid ibuprofen in tropical climates if dengue is possible.',
    },
    injury: {
      riskLevel: 'high',
      commonCauses: [
        'Scooter and motorbike accidents — leading cause of tourist injury in SE Asia',
        'Coral and sea urchin injuries from reef walking',
        'Dog or monkey bites — rabies is present in the region',
      ],
      whatToDo: [
        'For any animal bite, wash the wound vigorously with soap and water for 15 minutes, then go to a hospital immediately for rabies post-exposure protocol',
        'For scooter road rash, clean thoroughly with clean water and antiseptic — infection sets in fast in tropical heat',
        'For coral cuts, remove visible debris and flush; these become infected easily',
        'Do not ride a scooter without a helmet and closed shoes regardless of distance',
      ],
      seeDoctor:
        'Animal bites require immediate hospital care regardless of severity — do not wait. Road rash covering large areas and any wound that is deep or gaping requires stitching.',
      localMedication:
        'Ask for iodine solution or Betadine for wound cleaning, antibiotic cream, and gauze. Rabies post-exposure vaccination must be done at a hospital.',
    },
    'eye-ear': {
      riskLevel: 'moderate',
      commonCauses: [
        'Swimmers ear from pools, rivers, or sea swimming',
        'Conjunctivitis (pink eye) from dust, pollution, and hand contact',
        'Eye irritation from pool chlorine or salt water',
      ],
      whatToDo: [
        'Dry ears thoroughly after swimming; tilt head side to side',
        'Avoid touching your eyes with unwashed hands in high-pollution areas',
        'Rinse eyes with clean bottled water if irritated — never tap water',
        'Avoid contact lenses in dusty environments or if eyes are irritated',
      ],
      seeDoctor:
        'See a doctor for ear pain that does not ease within 24 hours, discharge from the ear, vision changes, or eye redness with discharge.',
      localMedication:
        'Ask for antibiotic eye drops (chloramphenicol) at pharmacies — available without prescription. Ear drops for swimmers ear are also available OTC.',
    },
    other: {
      riskLevel: 'moderate',
      commonCauses: [
        'Dehydration and heat-related fatigue',
        'Jet lag exacerbating all symptoms',
        'Overexertion in high heat and humidity',
      ],
      whatToDo: [
        'Prioritize sleep in air-conditioned space and adequate hydration',
        'Reduce activity intensity in your first 48 hours',
        'Eat light, easily digestible foods until your body adjusts',
        'If symptoms persist more than 3 days, see a local clinic',
      ],
      seeDoctor:
        'Seek care if fatigue is severe and does not improve with rest and rehydration, or if accompanied by fever, yellowing of skin, or unusual pain.',
      localMedication:
        'Ask for electrolyte sachets (ORS) and vitamin supplements at any pharmacy.',
    },
  },

  // ---------------------------------------------------------------------------
  'east-asia': {
    stomach: {
      riskLevel: 'low',
      commonCauses: [
        'Rich or unfamiliar food causing adjustment discomfort',
        'Shellfish or raw seafood sensitivity',
        'Alcohol overconsumption — izakaya and karaoke culture',
      ],
      whatToDo: [
        'Tap water is safe in Japan, South Korea, and most of China — hydrate freely',
        'Eat plain rice or congee (okayu / juk) to settle the stomach',
        'Avoid raw fish if you suspect food sensitivity',
        'Pharmacies have excellent anti-diarrhea and stomach settling products',
      ],
      seeDoctor:
        'Seek care if symptoms last more than 48 hours, you have a high fever, bloody stool, or severe abdominal cramping.',
      localMedication:
        'In Japan: ask for Seirogan (herbal anti-diarrhea) or Imodium at any drugstore. In Korea: ask for 베나치오 (Benatio) or Imodium. In China: ask for 藿香正气水 (Huoxiang Zhengqi Shui) at a pharmacy.',
    },
    fever: {
      riskLevel: 'low',
      commonCauses: [
        'Standard viral infections — cold and flu',
        'Heat exhaustion in summer humidity (Tokyo / Seoul in July-August)',
        'Food poisoning from buffet food left at room temperature',
      ],
      whatToDo: [
        'Rest in a cool environment and monitor temperature',
        'Drink plenty of clear fluids including electrolyte drinks',
        'Take paracetamol to manage temperature',
        'Japan: visit a clinic (kurinikku) — no appointment needed, very efficient',
      ],
      seeDoctor:
        'Seek care if fever exceeds 39C, lasts more than 3 days, or is accompanied by stiff neck, severe headache, or chest pain.',
      localMedication:
        'In Japan: Loxonin (ibuprofen) and Pabron cold medicine at Matsumoto Kiyoshi. In Korea: tylenol and cold medicine at any pharmacy. Ask for 타이레놀.',
    },
    skin: {
      riskLevel: 'low',
      commonCauses: [
        'Contact dermatitis from unfamiliar cosmetics or laundry products',
        'Heat rash in summer humidity',
        'Jellyfish stings at beaches in summer months',
      ],
      whatToDo: [
        'Shower promptly after beach or onsen to remove irritants',
        'Apply calamine lotion or hydrocortisone for mild rashes',
        'Avoid scratching — dry climate in hotels causes skin to become fragile',
        'For jellyfish sting, rinse with sea water (not fresh water), remove tentacles carefully',
      ],
      seeDoctor:
        'See a doctor if a rash is spreading rapidly, if you develop hives with swelling of lips or throat (anaphylaxis risk), or if a skin wound shows signs of infection.',
      localMedication:
        'Japan pharmacies stock excellent skin products: Muhi cream for bites, steroid cream for rash. Ask for ムヒ (Muhi) or キンカン (Kinkan). Available at any drugstore.',
    },
    respiratory: {
      riskLevel: 'moderate',
      commonCauses: [
        'Air pollution and yellow dust from China (East Asia spring season)',
        'Dry winter air causing throat and nasal irritation',
        'Crowded transport spreading viral respiratory infections',
      ],
      whatToDo: [
        'Check AQI daily — Seoul and Beijing frequently have poor air quality days',
        'Wear a KF94 mask (Korea) or N95 on high pollution days — widely available',
        'Use a nasal humidifier or saline spray in dry hotel rooms',
        'Rest and avoid outdoor exercise on red AQI days',
      ],
      seeDoctor:
        'Seek care for chest tightness, wheezing, high fever with cough, or if symptoms do not improve after 5 days.',
      localMedication:
        'Korea: ask for 판콜 (Pankol) at any pharmacy. Japan: Pabron cold granules (パブロン). Chinese pharmacies stock broad OTC cold and cough medicine.',
    },
    head: {
      riskLevel: 'low',
      commonCauses: [
        'Dehydration from walking long distances in summer',
        'Jet lag disrupting sleep and causing tension headaches',
        'Low blood sugar from missing meals while sightseeing',
      ],
      whatToDo: [
        'Keep a bottle of water with you at all times — vending machines are everywhere in Japan',
        'Eat regularly; low blood sugar amplifies headache symptoms',
        'Rest in shade during midday heat in summer',
        'Take paracetamol and rehydrate before escalating to a clinic',
      ],
      seeDoctor:
        'Seek immediate care for sudden severe headache, headache with fever and stiff neck, or any neurological symptoms such as vision changes or confusion.',
      localMedication:
        'Japan: Loxonin S (loxoprofen) is an OTC painkiller stronger than standard ibuprofen. Available at any drugstore.',
    },
    injury: {
      riskLevel: 'low',
      commonCauses: [
        'Sprained ankles on uneven cobblestones and temple steps',
        'Cycling accidents in bicycle-heavy cities (Amsterdam-like density in some areas)',
        'Hot spring (onsen) burns from poorly marked temperature pools',
      ],
      whatToDo: [
        'For sprains, apply cold compress and elevate; use RICE protocol',
        'For minor cuts, clean thoroughly — pharmacies have excellent wound care supplies',
        'If injured near an onsen, ask hotel staff to arrange clinic transport',
        'Japan hospital ERs are efficient; bring your passport and cash',
      ],
      seeDoctor:
        'Go to a clinic or hospital for any injury causing significant pain on weight bearing, open wounds that do not stop bleeding within 10 minutes, or burns larger than a palm.',
      localMedication:
        'Japan: Bamiyan patch (バンテリン) for muscle injuries, bandages, and antiseptic at any drugstore. Korean pharmacies similarly well-stocked.',
    },
    'eye-ear': {
      riskLevel: 'low',
      commonCauses: [
        'Dry eye from air conditioning and long-haul flights',
        'Dust and pollution particulate irritating eyes',
        'Ear pressure changes from flights and altitude',
      ],
      whatToDo: [
        'Use preservative-free eye drops for dryness — widely available',
        'Wear sunglasses on high-pollution days',
        'For flight-related ear pressure, try yawning, swallowing, or Valsalva maneuver',
        'Avoid contact lenses in very dusty or high-pollution conditions',
      ],
      seeDoctor:
        'See a doctor for persistent ear pain, ear discharge, vision changes, or eye redness with discharge that does not clear in 24 hours.',
      localMedication:
        'Japan: artificial tears (ロートC3) available OTC everywhere. Korea: similar drops at any pharmacy. Ask for 인공눈물.',
    },
    other: {
      riskLevel: 'low',
      commonCauses: [
        'Jet lag from significant time zone changes',
        'Overexertion from dense sightseeing schedules',
        'Dietary adjustment to sodium-heavy cuisine',
      ],
      whatToDo: [
        'Allow 1-2 adjustment days before heavy sightseeing',
        'Take walks in daylight to reset circadian rhythm',
        'Stay well hydrated — Japanese and Korean cuisine is high in sodium',
        'Rest days are productive — your body needs time to adapt',
      ],
      seeDoctor:
        'Seek care if fatigue is severe and persistent after adequate rest, or if accompanied by any other symptoms such as fever or swelling.',
      localMedication:
        'Japanese pharmacies (Matsumoto Kiyoshi, Daikoku) have excellent vitamins and recovery supplements. Look for Kyushin or Alinamin for fatigue.',
    },
  },

  // ---------------------------------------------------------------------------
  'europe': {
    stomach: {
      riskLevel: 'low',
      commonCauses: [
        'Rich food and alcohol in volume beyond normal diet',
        'Food sensitivity to dairy or gluten in unfamiliar preparations',
        'Occasional food hygiene lapse at high-volume tourist restaurants',
      ],
      whatToDo: [
        'Tap water is safe throughout Western and Northern Europe',
        'Eat at locally-busy restaurants rather than tourist-adjacent spots',
        'Take a probiotic daily to support gut adjustment to new foods',
        'Over-the-counter remedies widely available at pharmacies',
      ],
      seeDoctor:
        'Seek care if symptoms last more than 48 hours, you have a high fever, bloody diarrhea, or severe pain.',
      localMedication:
        'Ask at any pharmacie, farmacia, or Apotheke for loperamide, activated charcoal, or rehydration sachets. Pharmacists are highly trained and can advise directly.',
    },
    fever: {
      riskLevel: 'low',
      commonCauses: [
        'Standard influenza and upper respiratory viral infections',
        'Heat exhaustion in Southern European summer (Spain, Italy, Greece)',
        'Tick-borne encephalitis in forested areas of Central/Eastern Europe',
      ],
      whatToDo: [
        'Rest and take paracetamol or ibuprofen to manage temperature',
        'Drink fluids steadily — sports drinks or rehydration sachets if sweating heavily',
        'If you have been hiking in forests and find a tick, remove it carefully and monitor temperature',
        'European pharmacists can assess and recommend without appointment',
      ],
      seeDoctor:
        'Seek care if fever exceeds 39C or persists beyond 3 days, if you find a bulls-eye rash (Lyme disease), or if you have severe headache, stiff neck, or light sensitivity.',
      localMedication:
        'Paracetamol and ibuprofen widely available OTC. In France ask for Doliprane. In Germany ask for Paracetamol-ratiopharm. Green cross pharmacies in France and Spain offer free triage.',
    },
    skin: {
      riskLevel: 'low',
      commonCauses: [
        'Sunburn — particularly in Mediterranean countries with high UV index',
        'Insect bites from mosquitoes in Southern Europe and the Balkans',
        'Contact dermatitis from new hotel soaps or sun creams',
      ],
      whatToDo: [
        'Apply SPF 50+ sunscreen, reapply every 90 minutes in direct sun',
        'Use after-sun lotion for sunburn — widely available at pharmacies and supermarkets',
        'Apply antihistamine cream or hydrocortisone for bite reactions',
        'Stay out of midday sun in summer Mediterranean destinations',
      ],
      seeDoctor:
        'See a doctor for severe sunburn with blistering covering large areas, hives with throat swelling, or a rapidly spreading infected bite or rash.',
      localMedication:
        'Ask for Soltan or any after-sun lotion for sunburn. Fenistil gel (antihistamine cream) for bites, widely available across Europe. Cortizone cream available OTC in most countries.',
    },
    respiratory: {
      riskLevel: 'low',
      commonCauses: [
        'Standard cold and flu spread in crowded tourist areas',
        'Air pollution in major cities (London, Paris, Rome, Athens)',
        'Seasonal allergies to pollen in spring (March-May)',
      ],
      whatToDo: [
        'Check local pollen counts if you have known hay fever — UK Met Office, European pollen calendar',
        'Take antihistamines preemptively on high pollen days',
        'Stay hydrated and avoid smoking areas in cities',
        'Pharmacists can recommend without a prescription',
      ],
      seeDoctor:
        'Seek care for chest pain, shortness of breath, or fever with productive cough lasting more than 5 days.',
      localMedication:
        'Cetirizine or loratadine (antihistamines) OTC everywhere. France: Clarityne, UK: Piriteze. Nasal sprays like Beconase available at pharmacies.',
    },
    head: {
      riskLevel: 'low',
      commonCauses: [
        'Dehydration from alcohol and heat in Southern European summer',
        'Altitude headache in Alpine or Pyrenean hiking destinations',
        'Jet lag for long-haul travelers from Americas or Asia',
      ],
      whatToDo: [
        'Match each alcoholic drink with a glass of water',
        'At altitude, ascend slowly and rest for a day before physical exertion',
        'Rehydrate with electrolyte drinks in hot weather',
        'Paracetamol or ibuprofen effective for most travel headaches',
      ],
      seeDoctor:
        'Seek immediate care for sudden severe headache unlike any before, headache with fever and stiff neck, or any visual or neurological symptoms.',
      localMedication:
        'Paracetamol (500-1000mg) or ibuprofen OTC at any pharmacy, supermarket, or petrol station in most European countries.',
    },
    injury: {
      riskLevel: 'low',
      commonCauses: [
        'Twisted ankles on cobblestone streets — common in Rome, Dubrovnik, Prague',
        'Cycling accidents in Amsterdam and Copenhagen',
        'Sun-related heat exhaustion on exposed sightseeing walks',
      ],
      whatToDo: [
        'Wear supportive shoes on cobblestones — sandals are a common culprit',
        'Apply RICE protocol (rest, ice, compression, elevation) for sprains',
        'European emergency services are excellent — call 112 across EU',
        'Minor injuries handled quickly and affordably at most European hospitals',
      ],
      seeDoctor:
        'Go to A&E for injuries causing significant pain on weight bearing, suspected fracture, deep lacerations, or head injury with any loss of consciousness.',
      localMedication:
        'Pharmacies stock good wound care supplies including Steri-Strip closures, antiseptic, and compression bandages. Voltaren gel for muscle injuries available OTC.',
    },
    'eye-ear': {
      riskLevel: 'low',
      commonCauses: [
        'Dry eye from air conditioning and long-haul flights',
        'Swimmers ear from pools or sea',
        'Pollen causing allergic conjunctivitis in spring',
      ],
      whatToDo: [
        'Use artificial tears for dryness — available at any pharmacy',
        'Dry ears thoroughly after swimming',
        'Antihistamine eye drops for pollen-related irritation',
        'Wear sunglasses to reduce UV and wind irritation to eyes',
      ],
      seeDoctor:
        'See a pharmacist or doctor for ear pain with discharge, vision changes, or eye redness with discharge persisting beyond 24 hours.',
      localMedication:
        'Optrex eye drops and Otrivine ear drops OTC in UK and across Europe. Antibiotic eye drops may require prescription in some countries.',
    },
    other: {
      riskLevel: 'low',
      commonCauses: [
        'Fatigue from travel pace and time zone adjustment',
        'Tick bites in forests of Central Europe — risk of Lyme disease',
        'Urinary tract infections from inadequate hydration in summer heat',
      ],
      whatToDo: [
        'Check yourself for ticks after hiking in grassy or wooded areas',
        'Drink consistently throughout the day — set a reminder if needed',
        'Build rest periods into an intensive itinerary',
        'European pharmacists are a first-line resource for minor concerns',
      ],
      seeDoctor:
        'See a doctor for bulls-eye rash, burning on urination with fever, or any persistent unusual symptom lasting more than 3 days.',
      localMedication:
        'Cystitis sachets for UTI symptoms available OTC in UK (Cystopurin) and across EU. Tick removal tools available at outdoor stores and pharmacies.',
    },
  },

  // ---------------------------------------------------------------------------
  'south-asia': {
    stomach: {
      riskLevel: 'high',
      commonCauses: [
        'Travelers diarrhea (Delhi belly) from contaminated water or food',
        'Typhoid in areas with poor water sanitation',
        'Giardia from untreated water sources',
      ],
      whatToDo: [
        'Never drink tap water — use sealed bottled water even for brushing teeth',
        'Eat only thoroughly cooked food and avoid raw salads',
        'Rehydrate with ORS sachets — available cheaply everywhere',
        'Bring loperamide (Imodium) in your travel kit before departing',
      ],
      seeDoctor:
        'Go immediately for bloody diarrhea, fever above 38.5C with stomach symptoms, or inability to keep fluids down for more than 12 hours.',
      localMedication:
        'Ask at any pharmacy for ORS sachets, Norflox (norfloxacin antibiotic), and Imodium. All available without prescription. Apollo Pharmacy chain is reliable.',
    },
    fever: {
      riskLevel: 'high',
      commonCauses: [
        'Malaria in rural and jungle areas — risk varies by region',
        'Dengue fever during monsoon season (July-October)',
        'Typhoid from contaminated water or food',
      ],
      whatToDo: [
        'Take malaria prophylaxis if prescribed before travel — do not skip doses',
        'Use DEET repellent and long sleeves at dawn and dusk',
        'Go to a private hospital clinic for rapid blood tests if fever develops',
        'Paracetamol only for fever — avoid ibuprofen until dengue ruled out',
      ],
      seeDoctor:
        'Go to a clinic the same day for any fever in South Asia. Malaria and dengue require diagnosis and treatment — delays are dangerous.',
      localMedication:
        'Paracetamol widely available OTC. Malaria tests and dengue rapid tests available at private clinics for under 500 INR.',
    },
    skin: {
      riskLevel: 'moderate',
      commonCauses: [
        'Insect bites and subsequent infection in heat and humidity',
        'Prickly heat from blocked sweat glands',
        'Sun exposure at high altitude (Himalayas, Rajasthan)',
      ],
      whatToDo: [
        'Apply DEET to exposed skin, especially ankles and wrists',
        'Wear light, loose, long-sleeved clothing',
        'Keep skin clean and dry — infection risk is high in humid conditions',
        'Use SPF 50+ at altitude — UV index is extreme above 2000m',
      ],
      seeDoctor:
        'See a doctor for infected skin that is spreading, any rash with fever, or a bite that develops significant swelling beyond the immediate area.',
      localMedication:
        'Betadine antiseptic, Soframycin antibiotic cream, and calamine lotion available OTC at any pharmacy.',
    },
    respiratory: {
      riskLevel: 'high',
      commonCauses: [
        'Severe air pollution in Delhi, Kolkata, and Dhaka — among worst in the world',
        'Dust exposure in Rajasthan and rural areas',
        'TB exposure risk in crowded urban environments',
      ],
      whatToDo: [
        'Check AQI before going outdoors in Delhi — wear N95 mask on red days',
        'Avoid burning areas and heavy traffic when possible',
        'Use saline nasal spray after exposure to heavy dust',
        'Keep windows closed in polluted cities',
      ],
      seeDoctor:
        'Seek care for chest pain, shortness of breath at rest, fever with cough, or worsening asthma symptoms that do not respond to your usual inhaler.',
      localMedication:
        'N95 masks and saline nasal spray available at pharmacies. Paracetamol and cough syrup OTC. Inhalers require prescription.',
    },
    head: {
      riskLevel: 'moderate',
      commonCauses: [
        'Altitude sickness trekking in Nepal or Himalayan India',
        'Severe dehydration from heat and stomach illness',
        'Heat stroke in intense summer heat (45C+ in northern plains)',
      ],
      whatToDo: [
        'Ascend slowly in the Himalayas — maximum 500m per day above 3000m',
        'If altitude headache develops, do not ascend further until resolved',
        'Drink 3-4 liters of water per day in hot climate',
        'Rest immediately in shade or cool area for any heat-related head symptoms',
      ],
      seeDoctor:
        'Altitude sickness with vomiting, ataxia, or confusion is a medical emergency — descend immediately and seek care. Severe heat stroke with confusion also requires emergency care.',
      localMedication:
        'Diamox (acetazolamide) for altitude prevention — get a prescription before trekking. Paracetamol for headache. ORS for dehydration.',
    },
    injury: {
      riskLevel: 'moderate',
      commonCauses: [
        'Traffic accidents — road safety standards are poor in much of South Asia',
        'Trekking falls and altitude-related stumbles',
        'Dog bites — stray dog population is large and rabies is present',
      ],
      whatToDo: [
        'For dog or monkey bites, wash vigorously for 15 minutes and go to hospital immediately',
        'Hire registered trek guides and porters — do not trek alone',
        'Use certified tour vehicles and avoid overloaded buses',
        'Carry a basic wound care kit on any trek',
      ],
      seeDoctor:
        'Animal bites and deep wounds require same-day hospital care. Any head injury from a fall at altitude requires immediate descent and evaluation.',
      localMedication:
        'Betadine and wound care supplies at pharmacies. Rabies post-exposure vaccination at Apollo or Fortis hospitals. Pre-exposure rabies vaccination strongly recommended before travel.',
    },
    'eye-ear': {
      riskLevel: 'moderate',
      commonCauses: [
        'Conjunctivitis from dust and pollution',
        'Trachoma in rural areas with limited sanitation',
        'Ear infections from swimming in rivers or contaminated water',
      ],
      whatToDo: [
        'Avoid touching eyes with unwashed hands',
        'Wear sunglasses in dusty environments',
        'Do not swim in rivers or lakes unless certain of water safety',
        'Use clean bottled water to rinse eyes if irritated',
      ],
      seeDoctor:
        'See a doctor for eye redness with discharge, persistent blurred vision, or ear pain with fever.',
      localMedication:
        'Chloramphenicol eye drops available OTC at most pharmacies. Antibiotic ear drops available without prescription.',
    },
    other: {
      riskLevel: 'moderate',
      commonCauses: [
        'Jet lag and fatigue compounded by adjustment to heat',
        'Urinary tract infections from dehydration',
        'Vitamin deficiency on restrictive diet',
      ],
      whatToDo: [
        'Drink more water than you think you need — minimum 3 liters per day',
        'Carry electrolyte sachets and take preventatively in extreme heat',
        'Ease into local food — street food is fine but start with cooked dishes from busy stalls',
        'Use probiotic supplements throughout the trip',
      ],
      seeDoctor:
        'Seek care for persistent unusual symptoms, dark urine (sign of dehydration or hepatitis), or any combination of fever and other symptoms.',
      localMedication:
        'ORS sachets and vitamins widely available. Private clinic consultations cost 500-1500 INR and are efficient.',
    },
  },

  // ---------------------------------------------------------------------------
  'middle-east': {
    stomach: {
      riskLevel: 'moderate',
      commonCauses: [
        'Food adjustment to heavily spiced, oil-rich cuisine',
        'Contaminated water in lower-income areas outside UAE and Israel',
        'Food poisoning from buffet food in extreme heat',
      ],
      whatToDo: [
        'In UAE: tap water is safe but most prefer bottled',
        'In Jordan, Egypt, Morocco: use sealed bottled water only',
        'Rehydrate with ORS sachets if experiencing diarrhea',
        'Stick to fully cooked food — raw produce washed in local water is risky in some areas',
      ],
      seeDoctor:
        'Seek care for bloody diarrhea, fever above 38.5C, or inability to keep fluids down for more than 12 hours.',
      localMedication:
        'Pharmacies in UAE are well-stocked. Ask for Imodium and ORS sachets. Pharmacists speak English in most Gulf states.',
    },
    fever: {
      riskLevel: 'moderate',
      commonCauses: [
        'Heat exhaustion and heat stroke in summer (40-50C)',
        'MERS-CoV in Saudi Arabia — rare but present',
        'Standard viral infections from air-conditioned environments shifting to extreme heat',
      ],
      whatToDo: [
        'Treat any fever in extreme heat as potential heat stroke until proven otherwise',
        'Move to air-conditioned environment immediately',
        'Apply cool water to wrists and neck; fan continuously',
        'Go to an emergency room if temperature is above 39C combined with confusion or lack of sweating',
      ],
      seeDoctor:
        'Heat stroke (hot, dry skin, confusion, very high temperature) is a medical emergency — call 999 (UAE) or 911 (Saudi) immediately. Any fever in summer deserves prompt medical attention.',
      localMedication:
        'Paracetamol only for fever in heat — avoid ibuprofen when very dehydrated. Oral rehydration sachets and isotonic drinks at all pharmacies.',
    },
    skin: {
      riskLevel: 'moderate',
      commonCauses: [
        'Sunburn — UV index is extreme year-round',
        'Heat rash from sweat in extreme temperatures',
        'Sand abrasion from desert winds and dune activities',
      ],
      whatToDo: [
        'Apply SPF 50+ every 2 hours outdoors — UV is extremely high',
        'Wear loose, full-coverage clothing to protect skin from sun and sand',
        'Stay out of direct sun between 11am and 4pm',
        'Rinse sand from skin promptly to prevent abrasion irritation',
      ],
      seeDoctor:
        'See a doctor for blistering sunburn over large areas, heat rash that does not improve with cooling and loose clothing, or any infected skin wound.',
      localMedication:
        'After-sun lotion and high-SPF sunscreen in all UAE pharmacies and supermarkets. Calamine lotion for heat rash available OTC.',
    },
    respiratory: {
      riskLevel: 'moderate',
      commonCauses: [
        'Sandstorm (haboob) dust exposure — common in summer',
        'Extreme air conditioning shifts causing respiratory irritation',
        'Air pollution in Cairo, Tehran, and parts of Saudi Arabia',
      ],
      whatToDo: [
        'During sandstorms, stay indoors and seal windows with damp towels',
        'Wear a dust mask during outdoor activities in desert areas',
        'Carry saline nasal spray to clear dust from airways',
        'Stay hydrated — dry desert air desiccates airways quickly',
      ],
      seeDoctor:
        'Seek care for chest pain, significant shortness of breath, or asthma exacerbation that does not respond to your reliever inhaler.',
      localMedication:
        'Saline nasal spray and antihistamines OTC at UAE and Saudi pharmacies. Many medications require prescription in UAE — check before traveling.',
    },
    head: {
      riskLevel: 'moderate',
      commonCauses: [
        'Dehydration from extreme heat and Ramadan fasting period',
        'Heat exhaustion leading to headache and dizziness',
        'Jet lag for travelers from Asia and the Americas',
      ],
      whatToDo: [
        'Drink minimum 3-4 liters of water per day in summer heat',
        'Avoid outdoor exertion between 11am and 5pm',
        'If dizzy, sit or lie down in a cool area immediately',
        'Eat regularly — skipping meals in heat accelerates headaches',
      ],
      seeDoctor:
        'Go immediately for sudden severe headache, dizziness with confusion, or heat-related headache that does not improve after 30 minutes in a cool environment.',
      localMedication:
        'Paracetamol and rehydration sachets OTC. In UAE, many international brands are available at Aster or Life pharmacies.',
    },
    injury: {
      riskLevel: 'low',
      commonCauses: [
        'Dune bashing and off-road vehicle accidents',
        'Camel riding falls',
        'Sports injuries from desert activities',
      ],
      whatToDo: [
        'Use certified operators for dune bashing and desert activities',
        'Always wear a seatbelt in off-road vehicles',
        'For minor injuries, use hotel first aid or go to a clinic',
        'UAE hospitals are world-class — do not hesitate to seek care',
      ],
      seeDoctor:
        'Go to ER for any significant impact, suspected fracture, head injury, or spinal pain after a fall.',
      localMedication:
        'Pharmacies in UAE stock comprehensive wound care supplies. Voltaren gel for muscle injuries available without prescription.',
    },
    'eye-ear': {
      riskLevel: 'moderate',
      commonCauses: [
        'Dry eye from extreme desert air and air conditioning',
        'Sand and dust irritation to eyes',
        'Swimmers ear from hotel pools',
      ],
      whatToDo: [
        'Use preservative-free artificial tears multiple times per day',
        'Wear sunglasses with wraparound protection against sand',
        'Dry ears thoroughly after swimming',
        'Avoid contact lenses in sandy outdoor environments',
      ],
      seeDoctor:
        'See a doctor for persistent eye pain, vision changes, ear pain with discharge, or severe eye redness.',
      localMedication:
        'Artificial tear drops OTC at all pharmacies. Note: some antibiotic eye drops require prescription in UAE — check with pharmacist.',
    },
    other: {
      riskLevel: 'low',
      commonCauses: [
        'Heat-related fatigue and electrolyte depletion',
        'Disrupted sleep from temperature shock and jet lag',
        'Adjustment to Ramadan schedule affecting food availability',
      ],
      whatToDo: [
        'Schedule lighter activities in first 48 hours to adjust to heat',
        'Carry a reusable cold water bottle at all times',
        'Eat and drink regularly regardless of local fasting culture',
        'Use hotel gym or mall walking for exercise during heat of day',
      ],
      seeDoctor:
        'Seek care for prolonged fatigue with other symptoms, especially with any change in urine color (dark urine signals dehydration or worse).',
      localMedication:
        'Electrolyte tablets and ORS sachets at all pharmacies and supermarkets in UAE.',
    },
  },

  // ---------------------------------------------------------------------------
  'africa': {
    stomach: {
      riskLevel: 'high',
      commonCauses: [
        'Travelers diarrhea from water or food contamination',
        'Cholera in specific outbreak areas',
        'Giardia and cryptosporidium from untreated water',
      ],
      whatToDo: [
        'Use only sealed bottled water or water treated with purification tablets',
        'Eat at established restaurants; avoid raw produce washed in local water',
        'Carry ORS sachets and loperamide in your travel kit',
        'Avoid ice in beverages unless from sealed commercial bags',
      ],
      seeDoctor:
        'Seek care for rice-water diarrhea (possible cholera), bloody stool, fever with stomach symptoms, or inability to keep fluids down.',
      localMedication:
        'ORS sachets available at most pharmacies and health clinics. Metronidazole for giardia available at pharmacies in most African cities.',
    },
    fever: {
      riskLevel: 'high',
      commonCauses: [
        'Malaria — high risk in sub-Saharan Africa, especially near standing water',
        'Typhoid from contaminated food or water',
        'Yellow fever in high-risk regions',
      ],
      whatToDo: [
        'Take malaria prophylaxis as prescribed — do not stop early',
        'Use DEET repellent and sleep under treated mosquito nets',
        'Get a malaria rapid test at any clinic if you develop fever within 3 months of visit',
        'Take paracetamol for fever; do not self-treat malaria with leftover medications',
      ],
      seeDoctor:
        'Any fever in sub-Saharan Africa requires same-day evaluation for malaria. Do not wait. Malaria is treatable when caught early and dangerous when delayed.',
      localMedication:
        'Malaria rapid tests available at clinics. Coartem (artemether-lumefantrine) is the standard treatment — available at pharmacies in East and Southern Africa.',
    },
    skin: {
      riskLevel: 'moderate',
      commonCauses: [
        'Insect bites from mosquitoes, tsetse flies, and sand flies',
        'Sunburn at high altitude and equatorial regions',
        'Bilharzia (schistosomiasis) from freshwater swimming',
      ],
      whatToDo: [
        'Use DEET 50% repellent, wear long sleeves and pants at dusk and dawn',
        'Never swim in fresh water in sub-Saharan Africa unless tested and certified safe',
        'Apply SPF 50+ sunscreen — equatorial UV is intense',
        'Check yourself for ticks after bush or safari walks',
      ],
      seeDoctor:
        'See a doctor for any rash with fever, an expanding rash or wound, or if you swam in fresh water and develop itching or rash weeks later.',
      localMedication:
        'DEET repellent and sunscreen available in tourist areas. Antihistamine cream OTC at pharmacies.',
    },
    respiratory: {
      riskLevel: 'moderate',
      commonCauses: [
        'Dust exposure in Sahel and East African dry season',
        'Urban pollution in Nairobi, Lagos, and Johannesburg',
        'Smoke exposure from cooking fires in rural areas',
      ],
      whatToDo: [
        'Wear a dust mask on dusty roads or in construction areas',
        'Check AQI in major cities and limit outdoor activity on high days',
        'Stay hydrated — dry air increases respiratory irritation',
        'Seek shade and limit exposure to smoke from open fires',
      ],
      seeDoctor:
        'Seek care for chest pain, shortness of breath at rest, fever with cough, or worsening asthma that does not respond to your inhaler.',
      localMedication:
        'Basic respiratory medications available in major cities. Quality varies — bring your own inhaler if asthmatic.',
    },
    head: {
      riskLevel: 'moderate',
      commonCauses: [
        'Dehydration in extreme heat and altitude (Ethiopian highlands, Kilimanjaro)',
        'Altitude sickness when trekking to high elevation quickly',
        'Cerebral malaria — rare but serious complication',
      ],
      whatToDo: [
        'Ascend to altitude slowly — spend a night at medium elevation before going higher',
        'Drink minimum 4 liters per day at altitude and in heat',
        'Altitude headache that does not respond to rest and paracetamol is a warning sign',
        'Any severe headache with fever in a malaria zone is a medical emergency',
      ],
      seeDoctor:
        'Any headache with fever in a malaria zone requires immediate evaluation. Altitude headache with vomiting or ataxia requires immediate descent.',
      localMedication:
        'Diamox (acetazolamide) for altitude prevention — get prescription before trekking. Paracetamol for headache. ORS for dehydration.',
    },
    injury: {
      riskLevel: 'moderate',
      commonCauses: [
        'Safari vehicle accidents on rough terrain',
        'Animal encounters — hippos, elephants, and buffalo are dangerous',
        'Traffic accidents — road fatality rates are high across Africa',
      ],
      whatToDo: [
        'Always follow guide instructions on safari — do not approach wildlife',
        'Use reputable licensed safari operators',
        'Carry a comprehensive travel first aid kit',
        'For any significant injury, seek evacuation to Nairobi, Cape Town, or Johannesburg',
      ],
      seeDoctor:
        'Seek care immediately for any animal-related injury, suspected fracture, or significant wound. Medical evacuation insurance is essential.',
      localMedication:
        'Wound care supplies in major towns. For serious injuries, evacuation to a major city hospital is usually necessary.',
    },
    'eye-ear': {
      riskLevel: 'moderate',
      commonCauses: [
        'Dust and sand irritation to eyes on safari or in desert regions',
        'Conjunctivitis from heat, dust, and limited access to clean water for handwashing',
        'River blindness (onchocerciasis) — rare, from blackfly in specific river areas',
      ],
      whatToDo: [
        'Wear wraparound sunglasses in dusty conditions',
        'Use hand sanitizer before touching your face',
        'Rinse eyes with clean bottled water if irritated',
        'Avoid swimming in rivers in blackfly-endemic areas of West Africa',
      ],
      seeDoctor:
        'See a doctor for any eye infection with discharge, significant pain, or vision changes.',
      localMedication:
        'Chloramphenicol eye drops available at pharmacies in major cities. Antihistamine eye drops less commonly available — bring from home.',
    },
    other: {
      riskLevel: 'moderate',
      commonCauses: [
        'Exhaustion from long travel distances and time zone change',
        'Vitamin and mineral depletion from stomach adjustment',
        'Anxiety related to unfamiliar environment',
      ],
      whatToDo: [
        'Build buffer days into your itinerary after long inter-country travel',
        'Take vitamins and probiotics throughout the trip',
        'Carry a comprehensive travel health kit',
        'Register with your country\'s embassy or consulate app for major travel to Africa',
      ],
      seeDoctor:
        'See a doctor for any persistent symptom on return from Africa — some diseases have long incubation periods. Always mention your Africa travel to a doctor.',
      localMedication:
        'Vitamins and basic supplements available at pharmacies in major cities.',
    },
  },

  // ---------------------------------------------------------------------------
  'latin-america': {
    stomach: {
      riskLevel: 'high',
      commonCauses: [
        'Montezuma\'s revenge (travelers diarrhea) from water or food',
        'Altitude-induced stomach problems in high-altitude cities',
        'Food poisoning from street food in hot conditions',
      ],
      whatToDo: [
        'In Mexico, Peru, Bolivia: use sealed bottled water — never tap',
        'In Colombia, Chile, Argentina: tap water is generally safe in major cities',
        'Eat street food from busy stalls where food turns over quickly',
        'Carry ORS sachets and loperamide from your first day',
      ],
      seeDoctor:
        'Seek care for bloody diarrhea, fever above 38.5C with stomach symptoms, or dehydration you cannot manage with oral fluids.',
      localMedication:
        'Farmacias in Mexico: ask for Loperamida and Sales de Rehidratacion. In Mexico City, Farmacias Similares have attached doctors for ₱35 consultation.',
    },
    fever: {
      riskLevel: 'moderate',
      commonCauses: [
        'Dengue fever — present in tropical and coastal areas',
        'Altitude sickness in Andean cities (Cusco, La Paz, Quito)',
        'Chikungunya and Zika in tropical lowland areas',
      ],
      whatToDo: [
        'Use DEET repellent in tropical and jungle areas',
        'Ascend to high altitude cities slowly — spend a day at 2500m before 3500m+',
        'Drink coca tea at altitude (traditional remedy in Peru and Bolivia)',
        'Take paracetamol — not ibuprofen — if dengue is possible',
      ],
      seeDoctor:
        'Any fever with severe joint pain, rash, or headache behind the eyes in a tropical area needs same-day dengue testing. Altitude headache with vomiting requires descent.',
      localMedication:
        'Paracetamol OTC everywhere. Altitude sickness: ask for Diamox or soroche pills. Mate de coca (coca tea) at most Andean hotels.',
    },
    skin: {
      riskLevel: 'moderate',
      commonCauses: [
        'Insect bites from mosquitoes, sandflies, and chiggers in jungle areas',
        'Intense UV at high altitude',
        'Jellyfish and sea urchin contact at beaches',
      ],
      whatToDo: [
        'Apply DEET 40-50% for jungle and wetland areas',
        'Use SPF 50+ at altitude — UV index is extreme above 2500m',
        'Wear aqua shoes in the sea to avoid sea urchins',
        'Inspect skin for ticks after jungle hikes',
      ],
      seeDoctor:
        'See a doctor for any bite becoming infected, a bullseye rash, or skin symptoms combined with fever in a jungle area (possible Leishmaniasis).',
      localMedication:
        'DEET repellent and antihistamine cream available at pharmacies throughout Latin America. Antibiotic cream available without prescription.',
    },
    respiratory: {
      riskLevel: 'low',
      commonCauses: [
        'Altitude affecting breathing capacity in thin air',
        'Urban pollution in Mexico City and São Paulo',
        'Dust in dry high-altitude regions',
      ],
      whatToDo: [
        'Reduce physical exertion for first 48 hours at altitude',
        'Avoid alcohol in first 24 hours at high altitude — it worsens altitude effects',
        'Stay well hydrated — breathing faster at altitude means more fluid loss',
        'Check AQI in Mexico City before outdoor exercise',
      ],
      seeDoctor:
        'Seek care for chest pain, significant shortness of breath at rest at altitude (may indicate pulmonary edema), or asthma symptoms not responding to inhaler.',
      localMedication:
        'Asthma inhalers require prescription in most of Latin America — bring sufficient supply.',
    },
    head: {
      riskLevel: 'moderate',
      commonCauses: [
        'Altitude sickness in Andean destinations',
        'Dehydration from stomach illness combined with heat',
        'Sunstroke at high altitude beach and mountain destinations',
      ],
      whatToDo: [
        'Rest for a full day on arriving in Cusco (3400m) or La Paz (3600m) before activity',
        'Drink coca tea and eat light on first day at altitude',
        'Descend if headache is severe, worsening, or accompanied by vomiting',
        'Paracetamol for mild altitude headache is appropriate',
      ],
      seeDoctor:
        'Descend and seek care for altitude headache with vomiting, ataxia, confusion, or any shortness of breath at rest.',
      localMedication:
        'Diamox (acetazolamide) and Sorojchi Pills (aspirin + caffeine + scopalamine) for altitude. Get Diamox prescription before travel. Sorojchi available OTC in Peru and Bolivia.',
    },
    injury: {
      riskLevel: 'moderate',
      commonCauses: [
        'Traffic accidents — road safety is poor in many areas',
        'Hiking falls on trails in Patagonia, Inca Trail',
        'Crime-related injuries in high-risk urban areas',
      ],
      whatToDo: [
        'Use reputable licensed transport — avoid unmarked taxis',
        'Hire licensed local guides for trekking in remote areas',
        'Do not hike alone in Patagonia or remote Andean trails',
        'For any injury, go to a private clinic — public hospitals are crowded',
      ],
      seeDoctor:
        'Seek care for any injury limiting mobility, suspected fracture, head injury, or wounds requiring stitching.',
      localMedication:
        'Wound care supplies and basic medications at pharmacies throughout Latin America. Farmacias Similares in Mexico have attached doctors.',
    },
    'eye-ear': {
      riskLevel: 'low',
      commonCauses: [
        'Dust and UV in high-altitude environments',
        'Swimmers ear from cenote or river swimming',
        'Altitude UV causing eye strain and irritation',
      ],
      whatToDo: [
        'Wear UV-400 rated sunglasses — UV is severe at altitude',
        'Dry ears thoroughly after swimming in cenotes or rivers',
        'Use artificial tears in dry, high-altitude air',
        'Avoid contact lenses in jungle or dusty conditions',
      ],
      seeDoctor:
        'See a doctor for significant eye pain, discharge, or ear pain with fever.',
      localMedication:
        'Artificial tears and antihistamine eye drops at pharmacies. Ear drops available without prescription.',
    },
    other: {
      riskLevel: 'low',
      commonCauses: [
        'Adjustment fatigue from altitude and climate change',
        'Stomach adjustment to different bacteria and food',
        'Jet lag for long-haul travelers',
      ],
      whatToDo: [
        'Allow 1-2 days acclimatization in Andean cities before strenuous activity',
        'Take probiotics throughout the trip to support gut health',
        'Carry rehydration sachets and paracetamol from day one',
        'Build rest time into your schedule',
      ],
      seeDoctor:
        'Seek care for any persistent symptom beyond 3 days or any combination of fever with other symptoms.',
      localMedication:
        'Probiotics, vitamins, and ORS sachets available at pharmacies throughout Latin America.',
    },
  },

  // ---------------------------------------------------------------------------
  'north-america': {
    stomach: {
      riskLevel: 'low',
      commonCauses: [
        'Food poisoning from undercooked food at restaurants',
        'Alcohol-related stomach upset',
        'Giardia from backcountry water sources',
      ],
      whatToDo: [
        'Tap water is safe in most of the US and Canada',
        'Treat all backcountry water with filter or purification tablets',
        'Rest and rehydrate with clear fluids and electrolytes',
        'Gatorade and Pedialyte easily available at any convenience store',
      ],
      seeDoctor:
        'Seek care for bloody diarrhea, fever above 38.5C with stomach symptoms, or dehydration lasting more than 24 hours.',
      localMedication:
        'Imodium, Pepto-Bismol, and Pedialyte at every CVS, Walgreens, and grocery store. No prescription needed.',
    },
    fever: {
      riskLevel: 'low',
      commonCauses: [
        'Standard influenza and viral infections',
        'Tick-borne diseases (Lyme, Rocky Mountain spotted fever) in endemic areas',
        'Heat exhaustion in desert Southwest (Arizona, Nevada summer)',
      ],
      whatToDo: [
        'Rest and take paracetamol or ibuprofen for fever management',
        'Check for ticks after outdoor activity in the Northeast, Midwest, or Southeast',
        'Go to an Urgent Care clinic for efficient treatment — faster and cheaper than ER',
        'Heat-related fever: get to a cool environment and rehydrate immediately',
      ],
      seeDoctor:
        'Seek care for fever above 39C, fever lasting more than 3 days, bullseye rash after tick exposure, or fever with severe headache and stiff neck.',
      localMedication:
        'Tylenol, Advil, and DayQuil at any drugstore. Urgent Care clinics are affordable (typically $100-200 without insurance).',
    },
    skin: {
      riskLevel: 'low',
      commonCauses: [
        'Poison ivy, oak, or sumac contact in wooded and trail areas',
        'Sunburn, especially at altitude and desert environments',
        'Tick bites — Lyme disease risk in Northeast and Upper Midwest',
      ],
      whatToDo: [
        'Learn to identify poison ivy — leaves of three, let it be',
        'If you touch poison ivy, wash skin with soap and water within 10 minutes',
        'Apply SPF 50+ in desert and mountain environments',
        'Check yourself for ticks after hiking in wooded areas',
      ],
      seeDoctor:
        'See a doctor for a bulls-eye rash around a tick bite (Lyme disease), severe poison ivy with widespread blistering, or any infected skin wound.',
      localMedication:
        'Cortaid (hydrocortisone) cream for rashes and bites OTC. Benadryl for allergic reactions. Tick removal tools at outdoor stores.',
    },
    respiratory: {
      riskLevel: 'low',
      commonCauses: [
        'Wildfire smoke in Western states during fire season (June-October)',
        'Standard cold and flu spread',
        'Altitude in Rocky Mountain destinations',
      ],
      whatToDo: [
        'Check AQI app during wildfire season in California, Oregon, Washington, and Colorado',
        'Wear N95 mask on red AQI days — available at any hardware store',
        'Reduce exertion at altitude in first 24-48 hours (Denver is at 1600m, ski resorts 3000m+)',
        'Rest and use OTC cold medication for viral infections',
      ],
      seeDoctor:
        'Seek care for chest pain, significant shortness of breath at altitude (altitude sickness), or respiratory symptoms that do not improve after 5 days.',
      localMedication:
        'NyQuil, Mucinex, and Sudafed available OTC. Note: Sudafed (pseudoephedrine) requires ID and signature to purchase in the US.',
    },
    head: {
      riskLevel: 'low',
      commonCauses: [
        'Altitude headache at ski resort elevation or mountain hiking',
        'Dehydration in desert heat (Las Vegas, Phoenix, Scottsdale)',
        'Jet lag for international visitors crossing many time zones',
      ],
      whatToDo: [
        'Ascend to ski resorts over two days if possible — spend a night in Denver',
        'Drink a full water bottle per hour in desert heat',
        'Take paracetamol for headache and rest in cool environment',
        'Reduce alcohol at altitude — effects are significantly amplified',
      ],
      seeDoctor:
        'Go immediately for sudden severe headache unlike any before, headache with fever and stiff neck, or altitude headache with vomiting and ataxia.',
      localMedication:
        'Acetaminophen (Tylenol) and ibuprofen (Advil, Motrin) widely available everywhere.',
    },
    injury: {
      riskLevel: 'low',
      commonCauses: [
        'Skiing and snowboarding injuries at ski resorts',
        'Hiking injuries — ankle sprains, falls',
        'Traffic accidents',
      ],
      whatToDo: [
        'Rent properly fitted ski boots and use correct level terrain for your ability',
        'Carry a trail map and water on all hikes',
        'File a travel insurance claim immediately for any significant injury',
        'Urgent Care handles most non-emergency injuries faster and cheaper than ER',
      ],
      seeDoctor:
        'Go to Urgent Care for injuries that limit movement or require imaging. Call 911 for any serious emergency.',
      localMedication:
        'CVS and Walgreens have comprehensive wound care and sports injury supplies. ACE bandages, ice packs, and muscle rub available everywhere.',
    },
    'eye-ear': {
      riskLevel: 'low',
      commonCauses: [
        'Dry eye from air conditioning and low humidity desert air',
        'Snow blindness at ski resorts without UV-protection goggles',
        'Ear pressure from altitude changes',
      ],
      whatToDo: [
        'Always ski with UV-400 rated goggles or sunglasses',
        'Use artificial tears in dry environments',
        'Yawn and swallow on descent from altitude to equalize ear pressure',
        'Avoid contact lenses in dusty desert environments',
      ],
      seeDoctor:
        'See a doctor for significant eye pain, snow blindness symptoms (burning pain, sensitivity to light after skiing without eye protection), or ear pain not resolving.',
      localMedication:
        'Visine and Refresh artificial tears OTC everywhere. Debrox for ear wax and pressure issues at all pharmacies.',
    },
    other: {
      riskLevel: 'low',
      commonCauses: [
        'Jet lag for trans-Pacific and trans-Atlantic travelers',
        'Exhaustion from fast-paced road trip or multi-city itineraries',
        'Adjustment to large portion sizes and rich food',
      ],
      whatToDo: [
        'Build at least one rest day per week into a road trip',
        'Stay hydrated — US air conditioning is aggressive and drying',
        'Adjust sleep schedule gradually across time zones',
        'Walk regularly to maintain energy',
      ],
      seeDoctor:
        'Seek care for unusual persistent symptoms. Urgent Care is the right first stop for non-emergency concerns.',
      localMedication:
        'US pharmacies have comprehensive OTC selections. Melatonin for jet lag available at all pharmacies without prescription.',
    },
  },

  // ---------------------------------------------------------------------------
  'oceania': {
    stomach: {
      riskLevel: 'low',
      commonCauses: [
        'Food poisoning from seafood in warm climates',
        'Giardia from untreated water in New Zealand backcountry',
        'Alcohol-related stomach upset',
      ],
      whatToDo: [
        'Tap water is safe in Australia and New Zealand',
        'Treat backcountry water in NZ — giardia is present in mountain streams',
        'Rehydrate with Gastrolyte or Hydralyte (ORS) from any pharmacy',
        'Eat plain food and rest if suffering from stomach illness',
      ],
      seeDoctor:
        'Seek care for bloody diarrhea, fever above 38.5C, or inability to keep fluids down for 12 hours.',
      localMedication:
        'Imodium, Gastrolyte (ORS), and Buscopan available OTC at Chemist Warehouse or Priceline in Australia. NZ: Unichem or Pharmacy-at-hand.',
    },
    fever: {
      riskLevel: 'low',
      commonCauses: [
        'Standard viral infections',
        'Ross River virus from mosquitoes in northern Australia (flu-like symptoms with joint pain)',
        'Dengue fever in far North Queensland and some Pacific islands',
      ],
      whatToDo: [
        'Use DEET in tropical northern Australia and Pacific island destinations',
        'Take paracetamol for fever management',
        'Rest and increase fluid intake',
        'Medical centres are accessible throughout Australia and NZ',
      ],
      seeDoctor:
        'Seek care for fever above 39C lasting more than 2 days, fever with severe joint pain in tropical areas (Ross River or dengue), or any rash developing alongside fever.',
      localMedication:
        'Paracetamol and ibuprofen OTC at Chemist Warehouse. Nurofen widely available in Australia.',
    },
    skin: {
      riskLevel: 'high',
      commonCauses: [
        'Sunburn — Australia has the world\'s highest skin cancer rate, UV is extreme',
        'Jellyfish and marine stinger contact in northern waters',
        'Insect bites and sandfly bites in coastal areas',
      ],
      whatToDo: [
        'Apply SPF 50+ every 90 minutes outdoors — Australian sun burns in under 10 minutes in summer',
        'Swim inside stinger nets in northern Australia from October to May',
        'Wear a rashguard and hat at the beach — slip, slop, slap',
        'If stung by a jellyfish, do not rub — rinse with vinegar for box jellyfish',
      ],
      seeDoctor:
        'Get to a hospital immediately for box jellyfish stings in northern Australia — they are potentially lethal. See a doctor for severe sunburn with blistering or widespread rash with fever.',
      localMedication:
        'SPF 50+ sunscreen and after-sun lotion at all supermarkets and pharmacies. Stingose spray for insect bites and jellyfish available OTC. Vinegar must be used for box jellyfish — available at beaches in stinger-prone areas.',
    },
    respiratory: {
      riskLevel: 'low',
      commonCauses: [
        'Bushfire smoke in Australian fire season (October-March)',
        'Standard cold and flu spread',
        'Thunderstorm asthma in Melbourne during spring',
      ],
      whatToDo: [
        'Check AQI daily during fire season in SE Australia',
        'Stay indoors with windows closed on smoke or thunderstorm asthma days in Melbourne',
        'Carry reliever inhaler if asthmatic — Melbourne thunderstorm asthma events have been serious',
        'Stay hydrated',
      ],
      seeDoctor:
        'Seek emergency care for significant shortness of breath, chest tightness, or asthma exacerbation not responding to inhaler. Call 000.',
      localMedication:
        'OTC medications at Chemist Warehouse. Inhalers require prescription. Nasal sprays and antihistamines available without prescription.',
    },
    head: {
      riskLevel: 'low',
      commonCauses: [
        'Dehydration in Australian summer heat',
        'Jet lag from trans-Pacific travel',
        'Alcohol overconsumption',
      ],
      whatToDo: [
        'Drink 2-3 liters of water per day in summer heat',
        'Avoid outdoor exertion in peak afternoon heat (12-3pm)',
        'Rest in air conditioning during the hottest part of the day',
        'Reduce alcohol intake in the first 48 hours in hot climate',
      ],
      seeDoctor:
        'Seek immediate care for heat stroke symptoms: hot dry skin, confusion, no sweating despite heat. Call 000.',
      localMedication:
        'Paracetamol and ibuprofen OTC everywhere. Hydralyte sachets at Chemist Warehouse for dehydration.',
    },
    injury: {
      riskLevel: 'moderate',
      commonCauses: [
        'Adventure sport injuries (bungee, skydiving, surfing)',
        'Marine animal contact — cone shells, blue-ringed octopus, stonefish',
        'Rip current drowning at surf beaches',
      ],
      whatToDo: [
        'Always swim between the flags at patrolled beaches — rips are strong',
        'If caught in a rip, float and signal for help — do not fight it',
        'Do not touch unfamiliar marine creatures — blue-ringed octopus is deadly',
        'In NZ, ACC covers all accident injuries for visitors at no cost',
      ],
      seeDoctor:
        'Call 000 for any suspected envenomation (blue-ringed octopus, cone shell, stonefish, snake). Immobilize and apply pressure bandage for snake bites. Marine envenomation is a medical emergency.',
      localMedication:
        'Wound care supplies OTC. For envenomation, antivenom is available at hospital ERs. Do not attempt to treat at a pharmacy.',
    },
    'eye-ear': {
      riskLevel: 'low',
      commonCauses: [
        'UV eye damage from intense Australian sun',
        'Swimmers ear from surfing and pool swimming',
        'Dry eye from air conditioning',
      ],
      whatToDo: [
        'Always wear UV-400 rated sunglasses outdoors — pterygium (eye growth) is common in surfers without protection',
        'Dry ears thoroughly after surfing and swimming',
        'Use artificial tears in air-conditioned environments',
        'Ear plugs available at pharmacies for regular swimmers',
      ],
      seeDoctor:
        'See a doctor for significant eye pain, vision changes, or ear pain with discharge.',
      localMedication:
        'Visine and Refresh eye drops OTC. Ear drops and ear plugs at Chemist Warehouse and Priceline.',
    },
    other: {
      riskLevel: 'low',
      commonCauses: [
        'Significant jet lag from long-haul trans-Pacific flights',
        'Fatigue from vast distances between Australian destinations',
        'Adjustment to extreme UV environment',
      ],
      whatToDo: [
        'Build rest time into long drives across Australia — fatigue driving is a serious risk',
        'Melatonin for jet lag available OTC in Australia',
        'Take sun protection seriously from day one',
        'Stay well hydrated throughout your trip',
      ],
      seeDoctor:
        'Seek care for unusual persistent symptoms. Walk-in medical centres are accessible in all major Australian and NZ cities.',
      localMedication:
        'Melatonin and magnesium supplements available at pharmacies and health food stores.',
    },
  },
};

// ---------------------------------------------------------------------------
// Destination to Region Mapping
// ---------------------------------------------------------------------------

export const DESTINATION_TO_REGION: Record<string, string> = {
  // Southeast Asia
  Bali: 'southeast-asia',
  Jakarta: 'southeast-asia',
  Bangkok: 'southeast-asia',
  'Chiang Mai': 'southeast-asia',
  Phuket: 'southeast-asia',
  'Ko Samui': 'southeast-asia',
  Singapore: 'southeast-asia',
  'Kuala Lumpur': 'southeast-asia',
  'Hoi An': 'southeast-asia',
  Hanoi: 'southeast-asia',
  'Ho Chi Minh City': 'southeast-asia',
  'Da Nang': 'southeast-asia',
  Cebu: 'southeast-asia',
  Manila: 'southeast-asia',
  'Siem Reap': 'southeast-asia',
  Yangon: 'southeast-asia',
  'Luang Prabang': 'southeast-asia',

  // East Asia
  Tokyo: 'east-asia',
  Kyoto: 'east-asia',
  Osaka: 'east-asia',
  Seoul: 'east-asia',
  Busan: 'east-asia',
  Shanghai: 'east-asia',
  Beijing: 'east-asia',
  'Hong Kong': 'east-asia',
  Taipei: 'east-asia',

  // South Asia
  Delhi: 'south-asia',
  Mumbai: 'south-asia',
  Jaipur: 'south-asia',
  Goa: 'south-asia',
  Kathmandu: 'south-asia',
  Colombo: 'south-asia',
  Dhaka: 'south-asia',

  // Middle East
  Dubai: 'middle-east',
  'Abu Dhabi': 'middle-east',
  Istanbul: 'middle-east',
  Doha: 'middle-east',
  Riyadh: 'middle-east',
  Amman: 'middle-east',
  'Tel Aviv': 'middle-east',
  Marrakech: 'middle-east',
  Cairo: 'middle-east',

  // Africa
  Nairobi: 'africa',
  'Cape Town': 'africa',
  Johannesburg: 'africa',
  Zanzibar: 'africa',
  Accra: 'africa',
  Lagos: 'africa',
  Kigali: 'africa',
  'Addis Ababa': 'africa',

  // Latin America
  'Mexico City': 'latin-america',
  Cancun: 'latin-america',
  Oaxaca: 'latin-america',
  'Buenos Aires': 'latin-america',
  Cartagena: 'latin-america',
  Medellin: 'latin-america',
  Bogota: 'latin-america',
  Lima: 'latin-america',
  Cusco: 'latin-america',
  'Rio de Janeiro': 'latin-america',
  'Sao Paulo': 'latin-america',

  // Europe
  Paris: 'europe',
  London: 'europe',
  Rome: 'europe',
  Barcelona: 'europe',
  Amsterdam: 'europe',
  Berlin: 'europe',
  Prague: 'europe',
  Lisbon: 'europe',
  Athens: 'europe',
  Vienna: 'europe',
  Budapest: 'europe',
  Dubrovnik: 'europe',
  Reykjavik: 'europe',
  Edinburgh: 'europe',
  Florence: 'europe',

  // North America
  'New York': 'north-america',
  'Los Angeles': 'north-america',
  Miami: 'north-america',
  Chicago: 'north-america',
  'Las Vegas': 'north-america',
  Toronto: 'north-america',
  Vancouver: 'north-america',

  // Oceania
  Sydney: 'oceania',
  Melbourne: 'oceania',
  Brisbane: 'oceania',
  Auckland: 'oceania',
  Queenstown: 'oceania',
  Cairns: 'oceania',
};

// ---------------------------------------------------------------------------
// Medication Alerts
// ---------------------------------------------------------------------------

export const MEDICATION_ALERTS: MedicationAlert[] = [
  {
    medication: 'Adderall',
    countries: ['Japan', 'UAE', 'Thailand', 'Singapore', 'Saudi Arabia', 'South Korea', 'Indonesia'],
    alert:
      'Amphetamine-based ADHD medications including Adderall and Vyvanse are classified as prohibited narcotics in these countries. Possession can result in arrest and imprisonment.',
    action:
      'Do not bring Adderall to these countries. Consult your doctor about alternative non-stimulant ADHD medications (atomoxetine, guanfacine) that may be permitted. Always confirm with the destination embassy before travel.',
  },
  {
    medication: 'Vyvanse',
    countries: ['Japan', 'UAE', 'Thailand', 'Singapore', 'Saudi Arabia', 'South Korea', 'Indonesia'],
    alert:
      'Lisdexamfetamine (Vyvanse) contains amphetamine and is prohibited in these countries. Customs confiscation and criminal charges have been reported.',
    action:
      'Do not bring Vyvanse to these countries. Speak with your prescribing doctor at least 6 weeks before travel to discuss alternatives.',
  },
  {
    medication: 'Ritalin',
    countries: ['Japan', 'UAE', 'Thailand', 'Singapore'],
    alert:
      'Methylphenidate (Ritalin, Concerta) is a controlled substance in Japan and UAE and may be subject to import restrictions. Travelers have faced serious issues at customs.',
    action:
      'Carry an official medical certificate in English and the local language. Contact the embassy of the destination country before travel to confirm requirements. Some countries require advance import permits.',
  },
  {
    medication: 'Codeine',
    countries: ['UAE', 'Japan', 'Greece', 'Egypt', 'Kuwait', 'Bahrain'],
    alert:
      'Codeine-containing medications (including some common cough syrups and pain medications) are controlled or prohibited. UAE has some of the strictest enforcement — travelers have been imprisoned.',
    action:
      'Avoid bringing codeine-containing products to these destinations. Common over-the-counter medications in your home country may contain codeine — check all labels. Use alternative pain relief (ibuprofen, paracetamol).',
  },
  {
    medication: 'CBD',
    countries: ['UAE', 'Japan', 'Singapore', 'Thailand', 'China', 'Russia', 'Turkey', 'Indonesia'],
    alert:
      'CBD and cannabis-derived products, including those purchased legally in the US or Europe, are illegal in these countries. In Singapore and UAE, possession can result in lengthy prison sentences.',
    action:
      'Do not bring any CBD products, including oils, gummies, or topicals, to these destinations. Leave all cannabis-derived products at home regardless of medical status or source country legality.',
  },
  {
    medication: 'Pseudoephedrine',
    countries: ['Japan', 'Mexico'],
    alert:
      'Pseudoephedrine-containing cold medicines (including Sudafed) are controlled or heavily restricted. In Japan it is a controlled substance. Mexico restricts import quantity.',
    action:
      'Do not bring pseudoephedrine to Japan. For Mexico, bring only the minimum needed with original packaging and prescription documentation. Use phenylephrine-based alternatives if available.',
  },
  {
    medication: 'Benzodiazepines',
    countries: ['UAE', 'Qatar', 'Saudi Arabia', 'Japan', 'Singapore', 'Indonesia'],
    alert:
      'Benzodiazepines including diazepam (Valium), alprazolam (Xanax), and lorazepam (Ativan) are controlled substances in these countries. Possession without advance permits has resulted in arrest.',
    action:
      'Obtain an advance import permit from the destination country\'s health ministry before travel. Carry the original prescription, a letter from your doctor, and the medication in original labeled packaging. Declare at customs on arrival.',
  },
  {
    medication: 'Tramadol',
    countries: ['UAE', 'Egypt', 'Jordan', 'Saudi Arabia', 'Philippines'],
    alert:
      'Tramadol is a controlled substance in many Middle Eastern and Southeast Asian countries. It is banned in the UAE and severely restricted in Egypt where trafficking charges have been applied.',
    action:
      'Do not bring tramadol to UAE or Egypt without advance written authorization from the relevant health authority. Seek alternative pain management before travel to these destinations.',
  },
  {
    medication: 'Melatonin',
    countries: ['Australia', 'UK', 'Ireland', 'Germany'],
    alert:
      'Melatonin is prescription-only in Australia, UK, Ireland, and several European countries. The OTC version available in the US is not legally sold without prescription in these destinations.',
    action:
      'Bring melatonin in original packaging with prescription documentation if you have it. Personal amounts for jet lag are generally tolerated at customs but it cannot be purchased OTC locally.',
  },
  {
    medication: 'Testosterone',
    countries: ['UAE', 'Thailand', 'Australia'],
    alert:
      'Testosterone and anabolic steroids are controlled substances in many countries. In Australia, testosterone without a local prescription is prohibited. UAE has strict enforcement.',
    action:
      'Carry the original prescription, a letter from your endocrinologist, and original manufacturer packaging. Declare the medication at customs. Advance import permits may be required for UAE.',
  },
];

// ---------------------------------------------------------------------------
// Emergency Phrases
// ---------------------------------------------------------------------------

const EMERGENCY_PHRASES: Record<string, EmergencyPhrase> = {
  'southeast-asia': { phrase: 'ผมต้องการความช่วยเหลือทางการแพทย์', phonetic: 'Pom tong-gaan kwaam-chuay-leua taang-gaan-phaet', language: 'Thai' },
  'east-asia': { phrase: '医療の助けが必要です', phonetic: 'Iryou no tasuke ga hitsuyou desu', language: 'Japanese' },
  'south-asia': { phrase: 'Mujhe chikitsa sahayata chahiye', phonetic: 'Moo-jay chik-it-sa sah-hay-tah chah-hee-yay', language: 'Hindi' },
  'middle-east': { phrase: 'أحتاج إلى مساعدة طبية', phonetic: 'Ahtaaj ila musa\'ada tibbiya', language: 'Arabic' },
  'africa': { phrase: 'Ninahitaji msaada wa daktari', phonetic: 'Nee-nah-hee-tah-jee m-sah-ah-dah wah dak-tah-ree', language: 'Swahili' },
  'latin-america': { phrase: 'Necesito ayuda médica', phonetic: 'Neh-seh-see-toh ah-yoo-dah meh-dee-kah', language: 'Spanish' },
  'europe': { phrase: 'J\'ai besoin d\'aide médicale', phonetic: 'Zhay buh-zwan dehd meh-dee-kal', language: 'French' },
  'north-america': { phrase: 'I need medical help', phonetic: 'I need medical help', language: 'English' },
  'oceania': { phrase: 'I need medical help', phonetic: 'I need medical help', language: 'English' },
};

// Destination-specific overrides for accuracy
const DESTINATION_PHRASES: Record<string, EmergencyPhrase> = {
  Tokyo: { phrase: '救急車を呼んでください', phonetic: 'Kyuukyuusha wo yonde kudasai', language: 'Japanese' },
  Kyoto: { phrase: '救急車を呼んでください', phonetic: 'Kyuukyuusha wo yonde kudasai', language: 'Japanese' },
  Osaka: { phrase: '救急車を呼んでください', phonetic: 'Kyuukyuusha wo yonde kudasai', language: 'Japanese' },
  Seoul: { phrase: '의료 도움이 필요합니다', phonetic: 'Uiryo doum-i pilyo-hamnida', language: 'Korean' },
  Busan: { phrase: '의료 도움이 필요합니다', phonetic: 'Uiryo doum-i pilyo-hamnida', language: 'Korean' },
  Beijing: { phrase: '我需要医疗帮助', phonetic: 'Wǒ xūyào yīliáo bāngzhù', language: 'Mandarin Chinese' },
  Shanghai: { phrase: '我需要医疗帮助', phonetic: 'Wǒ xūyào yīliáo bāngzhù', language: 'Mandarin Chinese' },
  'Hong Kong': { phrase: '我需要醫療幫助', phonetic: 'Ngo seui-jiu yi-liu bong-zo', language: 'Cantonese' },
  Taipei: { phrase: '我需要醫療幫助', phonetic: 'Wǒ xūyào yīliáo bāngzhù', language: 'Mandarin Chinese' },
  Bali: { phrase: 'Saya butuh bantuan medis', phonetic: 'Sah-yah boo-too ban-too-an meh-dees', language: 'Indonesian' },
  Jakarta: { phrase: 'Saya butuh bantuan medis', phonetic: 'Sah-yah boo-too ban-too-an meh-dees', language: 'Indonesian' },
  Singapore: { phrase: 'I need medical help', phonetic: 'I need medical help', language: 'English' },
  Hanoi: { phrase: 'Tôi cần hỗ trợ y tế', phonetic: 'Toy kan ho tro ee teh', language: 'Vietnamese' },
  'Ho Chi Minh City': { phrase: 'Tôi cần hỗ trợ y tế', phonetic: 'Toy kan ho tro ee teh', language: 'Vietnamese' },
  'Hoi An': { phrase: 'Tôi cần hỗ trợ y tế', phonetic: 'Toy kan ho tro ee teh', language: 'Vietnamese' },
  Bangkok: { phrase: 'ผมต้องการความช่วยเหลือทางการแพทย์', phonetic: 'Pom tong-gaan kwaam-chuay-leua taang-gaan-phaet', language: 'Thai' },
  'Chiang Mai': { phrase: 'ผมต้องการความช่วยเหลือทางการแพทย์', phonetic: 'Pom tong-gaan kwaam-chuay-leua taang-gaan-phaet', language: 'Thai' },
  'Kuala Lumpur': { phrase: 'Saya perlukan bantuan perubatan', phonetic: 'Sah-yah per-loo-kan ban-too-an per-oo-ba-tan', language: 'Malay' },
  Delhi: { phrase: 'Mujhe chikitsa sahayata chahiye', phonetic: 'Moo-jay chik-it-sa sah-hay-tah chah-hee-yay', language: 'Hindi' },
  Mumbai: { phrase: 'Mujhe chikitsa sahayata chahiye', phonetic: 'Moo-jay chik-it-sa sah-hay-tah chah-hee-yay', language: 'Hindi' },
  Kathmandu: { phrase: 'Malai chikitsa sahayata chahincha', phonetic: 'Mah-lai chik-it-sa sah-hay-tah chah-hin-chah', language: 'Nepali' },
  Dubai: { phrase: 'أحتاج إلى مساعدة طبية', phonetic: 'Ahtaaj ila musa\'ada tibbiya', language: 'Arabic' },
  'Abu Dhabi': { phrase: 'أحتاج إلى مساعدة طبية', phonetic: 'Ahtaaj ila musa\'ada tibbiya', language: 'Arabic' },
  Istanbul: { phrase: 'Tıbbi yardıma ihtiyacım var', phonetic: 'Tib-bee yar-dee-mah ih-tee-yah-jum var', language: 'Turkish' },
  Cairo: { phrase: 'أحتاج إلى مساعدة طبية', phonetic: 'Ahtaaj ila musa\'ada tibbiya', language: 'Arabic' },
  Marrakech: { phrase: 'أحتاج إلى مساعدة طبية', phonetic: 'Ahtaaj ila musa\'ada tibbiya', language: 'Arabic' },
  Nairobi: { phrase: 'Ninahitaji msaada wa daktari', phonetic: 'Nee-nah-hee-tah-jee m-sah-ah-dah wah dak-tah-ree', language: 'Swahili' },
  Zanzibar: { phrase: 'Ninahitaji msaada wa daktari', phonetic: 'Nee-nah-hee-tah-jee m-sah-ah-dah wah dak-tah-ree', language: 'Swahili' },
  'Cape Town': { phrase: 'I need medical help', phonetic: 'I need medical help', language: 'English' },
  Johannesburg: { phrase: 'I need medical help', phonetic: 'I need medical help', language: 'English' },
  'Buenos Aires': { phrase: 'Necesito ayuda médica', phonetic: 'Neh-seh-see-toh ah-yoo-dah meh-dee-kah', language: 'Spanish' },
  'Mexico City': { phrase: 'Necesito ayuda médica', phonetic: 'Neh-seh-see-toh ah-yoo-dah meh-dee-kah', language: 'Spanish' },
  Cusco: { phrase: 'Necesito ayuda médica', phonetic: 'Neh-seh-see-toh ah-yoo-dah meh-dee-kah', language: 'Spanish' },
  Cartagena: { phrase: 'Necesito ayuda médica', phonetic: 'Neh-seh-see-toh ah-yoo-dah meh-dee-kah', language: 'Spanish' },
  'Rio de Janeiro': { phrase: 'Preciso de ajuda médica', phonetic: 'Preh-see-zoo jee ah-zhoo-dah meh-jee-kah', language: 'Portuguese' },
  'Sao Paulo': { phrase: 'Preciso de ajuda médica', phonetic: 'Preh-see-zoo jee ah-zhoo-dah meh-jee-kah', language: 'Portuguese' },
  Paris: { phrase: 'J\'ai besoin d\'aide médicale', phonetic: 'Zhay buh-zwan dehd meh-dee-kal', language: 'French' },
  Rome: { phrase: 'Ho bisogno di assistenza medica', phonetic: 'Oh bee-zon-yoh dee as-sis-ten-zah meh-dee-kah', language: 'Italian' },
  Florence: { phrase: 'Ho bisogno di assistenza medica', phonetic: 'Oh bee-zon-yoh dee as-sis-ten-zah meh-dee-kah', language: 'Italian' },
  Barcelona: { phrase: 'Necesito asistencia médica', phonetic: 'Neh-seh-see-toh ah-sis-ten-thee-ah meh-dee-kah', language: 'Spanish' },
  Lisbon: { phrase: 'Preciso de ajuda médica', phonetic: 'Preh-see-zoo jee ah-zhoo-dah meh-jee-kah', language: 'Portuguese' },
  Amsterdam: { phrase: 'Ik heb medische hulp nodig', phonetic: 'Ick hep meh-dee-shuh hulp noh-dikh', language: 'Dutch' },
  Berlin: { phrase: 'Ich brauche medizinische Hilfe', phonetic: 'Ikh brow-khuh meh-dee-tsi-ni-shuh hil-fuh', language: 'German' },
  Prague: { phrase: 'Potřebuji lékařskou pomoc', phonetic: 'Pot-rzheh-boo-yi leh-karzh-skou po-mots', language: 'Czech' },
  Athens: { phrase: 'Χρειάζομαι ιατρική βοήθεια', phonetic: 'Khree-ah-zo-me yat-ree-kee vo-ee-thee-ah', language: 'Greek' },
  Budapest: { phrase: 'Orvosi segítségre van szükségem', phonetic: 'Or-vo-shi sheh-geet-sheh-gre von sook-sheh-gem', language: 'Hungarian' },
  Sydney: { phrase: 'I need medical help', phonetic: 'I need medical help', language: 'English' },
  Auckland: { phrase: 'I need medical help', phonetic: 'I need medical help', language: 'English' },
};

// ---------------------------------------------------------------------------
// Functions
// ---------------------------------------------------------------------------

/**
 * Returns the region ID for a given destination using fuzzy case-insensitive matching.
 * Falls back to 'europe' as the default low-risk region if no match is found.
 */
export function getRegionForDestination(destination: string): string {
  if (!destination) return 'europe';

  const normalized = destination.trim().toLowerCase();

  // Exact case-insensitive match first
  for (const [dest, region] of Object.entries(DESTINATION_TO_REGION)) {
    if (dest.toLowerCase() === normalized) return region;
  }

  // Partial match — destination string contains a known city name
  for (const [dest, region] of Object.entries(DESTINATION_TO_REGION)) {
    if (normalized.includes(dest.toLowerCase()) || dest.toLowerCase().includes(normalized)) {
      return region;
    }
  }

  // Keyword-based region inference
  const regionKeywords: Array<{ keywords: string[]; region: RegionId }> = [
    { keywords: ['bali', 'thailand', 'vietnam', 'cambodia', 'laos', 'myanmar', 'indonesia', 'philippines', 'malaysia', 'singapore'], region: 'southeast-asia' },
    { keywords: ['japan', 'korea', 'china', 'taiwan', 'hong kong'], region: 'east-asia' },
    { keywords: ['india', 'nepal', 'sri lanka', 'bangladesh', 'pakistan'], region: 'south-asia' },
    { keywords: ['dubai', 'abu dhabi', 'qatar', 'saudi', 'uae', 'jordan', 'egypt', 'morocco', 'turkey', 'israel'], region: 'middle-east' },
    { keywords: ['kenya', 'tanzania', 'uganda', 'ghana', 'nigeria', 'south africa', 'ethiopia', 'rwanda', 'zanzibar'], region: 'africa' },
    { keywords: ['mexico', 'colombia', 'peru', 'brazil', 'argentina', 'chile', 'costa rica', 'cuba', 'ecuador', 'bolivia'], region: 'latin-america' },
    { keywords: ['france', 'italy', 'spain', 'germany', 'uk', 'england', 'portugal', 'greece', 'netherlands', 'austria', 'czech', 'hungary', 'croatia', 'iceland', 'scotland', 'ireland', 'switzerland', 'norway', 'sweden', 'denmark', 'finland', 'poland'], region: 'europe' },
    { keywords: ['usa', 'america', 'canada', 'new york', 'los angeles', 'california', 'florida', 'texas', 'toronto', 'vancouver'], region: 'north-america' },
    { keywords: ['australia', 'new zealand', 'sydney', 'melbourne', 'brisbane', 'auckland', 'queenstown', 'fiji', 'tahiti'], region: 'oceania' },
  ];

  for (const { keywords, region } of regionKeywords) {
    if (keywords.some((kw) => normalized.includes(kw))) return region;
  }

  return 'europe';
}

/**
 * Returns symptom advice for a given destination and symptom category.
 */
export function getSymptomAdvice(destination: string, categoryId: string): SymptomAdvice {
  const region = getRegionForDestination(destination) as RegionId;
  const symptomId = categoryId as SymptomId;

  const regionData = REGIONAL_RISKS[region];
  const risk: RegionalRisk = regionData?.[symptomId] ?? {
    riskLevel: 'low',
    commonCauses: ['Standard travel-related cause'],
    whatToDo: ['Rest and stay hydrated', 'Monitor symptoms', 'Seek care if symptoms worsen or persist beyond 48 hours'],
    seeDoctor: 'Seek medical care if symptoms do not improve within 48 hours or worsen at any time.',
    localMedication: 'Ask at a local pharmacy for over-the-counter symptom relief.',
  };

  return {
    categoryId,
    destination,
    region,
    riskLevel: risk.riskLevel,
    commonCauses: risk.commonCauses,
    whatToDo: risk.whatToDo,
    seeDoctor: risk.seeDoctor,
    localMedication: risk.localMedication,
  };
}

/**
 * Returns medication alerts relevant to the user's medication list and destination.
 * Case-insensitive matching against known medication names.
 */
export function checkMedicationAlerts(
  medications: string[],
  destination: string,
): MedicationAlert[] {
  if (!medications.length || !destination) return [];

  const normalizedDestination = destination.toLowerCase();
  const normalizedMedications = medications.map((m) => m.toLowerCase().trim());

  return MEDICATION_ALERTS.filter((alert) => {
    const medicationMatches = normalizedMedications.some(
      (med) =>
        med.includes(alert.medication.toLowerCase()) ||
        alert.medication.toLowerCase().includes(med),
    );

    if (!medicationMatches) return false;

    const countryMatches = alert.countries.some((country) =>
      normalizedDestination.includes(country.toLowerCase()) ||
      country.toLowerCase().includes(normalizedDestination),
    );

    return countryMatches;
  });
}

/**
 * Returns the phrase "I need medical help" in the local language for a destination.
 * Falls back to regional phrase, then English if no match found.
 */
export function getEmergencyPhrase(destination: string): EmergencyPhrase {
  const trimmed = destination.trim();

  // Check destination-specific phrases first (case-insensitive)
  for (const [dest, phrase] of Object.entries(DESTINATION_PHRASES)) {
    if (dest.toLowerCase() === trimmed.toLowerCase()) return phrase;
  }

  // Fall back to regional phrase
  const region = getRegionForDestination(trimmed);
  return (
    EMERGENCY_PHRASES[region] ?? {
      phrase: 'I need medical help',
      phonetic: 'I need medical help',
      language: 'English',
    }
  );
}
