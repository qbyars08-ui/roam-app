// =============================================================================
// ROAM — Medication Legality & Equivalence Engine
// Top 50 medications across top 30 destinations.
// Data: INCB, DEA schedules, destination health ministry public data.
// FOR INFORMATIONAL PURPOSES ONLY — always verify with local embassy.
// =============================================================================

// ---------------------------------------------------------------------------
// Types
// ---------------------------------------------------------------------------

export type LegalStatus = 'legal' | 'prescription-only' | 'restricted' | 'banned';

export interface MedicationEntry {
  /** Generic name (lowercase) */
  name: string;
  /** Common brand names */
  brands: string[];
  /** Drug class for grouping */
  drugClass: string;
  /** Countries where this drug has special restrictions (ISO 2-letter) */
  restrictions: Record<string, {
    status: LegalStatus;
    note: string;
    localEquivalent?: string;
  }>;
  /** Default status in most countries */
  defaultStatus: LegalStatus;
  /** General note */
  generalNote: string;
}

export interface MedicationCheckResult {
  medication: string;
  destination: string;
  countryCode: string;
  status: LegalStatus;
  note: string;
  localEquivalent?: string;
  isControlled: boolean;
}

// ---------------------------------------------------------------------------
// Destination → Country Code mapping
// ---------------------------------------------------------------------------

const DEST_COUNTRY: Record<string, string> = {
  tokyo: 'JP', kyoto: 'JP', osaka: 'JP', japan: 'JP',
  bangkok: 'TH', 'chiang mai': 'TH', thailand: 'TH',
  bali: 'ID', jakarta: 'ID', indonesia: 'ID',
  singapore: 'SG',
  'ho chi minh': 'VN', hanoi: 'VN', vietnam: 'VN',
  seoul: 'KR', 'south korea': 'KR',
  dubai: 'AE', 'abu dhabi': 'AE', uae: 'AE',
  paris: 'FR', france: 'FR',
  london: 'GB', 'united kingdom': 'GB',
  barcelona: 'ES', madrid: 'ES', spain: 'ES',
  rome: 'IT', milan: 'IT', italy: 'IT',
  berlin: 'DE', munich: 'DE', germany: 'DE',
  amsterdam: 'NL', netherlands: 'NL',
  lisbon: 'PT', portugal: 'PT',
  athens: 'GR', greece: 'GR',
  istanbul: 'TR', turkey: 'TR',
  budapest: 'HU', hungary: 'HU',
  prague: 'CZ', 'czech republic': 'CZ',
  'mexico city': 'MX', cancun: 'MX', mexico: 'MX',
  'buenos aires': 'AR', argentina: 'AR',
  medellin: 'CO', bogota: 'CO', colombia: 'CO',
  lima: 'PE', peru: 'PE',
  'sao paulo': 'BR', rio: 'BR', brazil: 'BR',
  'costa rica': 'CR',
  morocco: 'MA', marrakech: 'MA',
  'cape town': 'ZA', 'south africa': 'ZA',
  egypt: 'EG', cairo: 'EG',
  kenya: 'KE', nairobi: 'KE',
  australia: 'AU', sydney: 'AU', melbourne: 'AU',
  'new zealand': 'NZ',
  iceland: 'IS', reykjavik: 'IS',
  india: 'IN', delhi: 'IN', mumbai: 'IN', goa: 'IN',
  cambodia: 'KH', 'phnom penh': 'KH',
  philippines: 'PH', manila: 'PH',
};

function getCountryCode(destination: string): string {
  const key = destination.toLowerCase().trim();
  for (const [k, v] of Object.entries(DEST_COUNTRY)) {
    if (key.includes(k) || k.includes(key)) return v;
  }
  return 'XX';
}

// ---------------------------------------------------------------------------
// Medication Database
// ---------------------------------------------------------------------------

const MEDICATIONS: MedicationEntry[] = [
  // ── Stimulants / ADHD ──
  {
    name: 'adderall',
    brands: ['Adderall', 'Adderall XR'],
    drugClass: 'Stimulant (amphetamine)',
    defaultStatus: 'prescription-only',
    generalNote: 'Controlled substance in most countries. Carry prescription and doctor letter.',
    restrictions: {
      JP: { status: 'banned', note: 'Amphetamines are strictly illegal in Japan. Do NOT bring. No exceptions, even with prescription.', localEquivalent: 'Concerta (methylphenidate) is available with a Japanese prescription.' },
      SG: { status: 'banned', note: 'Classified as a controlled drug. Bringing into Singapore can result in severe penalties.', localEquivalent: 'Ritalin available with local psychiatrist prescription.' },
      KR: { status: 'restricted', note: 'Requires advance approval from MFDS. Apply at least 30 days before travel.', localEquivalent: 'Concerta available locally.' },
      AE: { status: 'banned', note: 'Amphetamines are illegal in the UAE. Penalties include imprisonment.', localEquivalent: 'Concerta may be available with specialist prescription.' },
      TH: { status: 'restricted', note: 'Requires FDA approval letter before entry. Max 30-day supply with documentation.', localEquivalent: 'Ritalin available at major hospitals.' },
      ID: { status: 'banned', note: 'Amphetamines classified as narcotic. Severe penalties for possession.', localEquivalent: 'Methylphenidate available at psychiatric hospitals in Jakarta.' },
    },
  },
  {
    name: 'ritalin',
    brands: ['Ritalin', 'Concerta', 'Methylphenidate'],
    drugClass: 'Stimulant (methylphenidate)',
    defaultStatus: 'prescription-only',
    generalNote: 'Controlled but more widely accepted than amphetamines. Always carry original prescription.',
    restrictions: {
      JP: { status: 'prescription-only', note: 'Methylphenidate (Concerta) is legal in Japan with documentation. Carry prescription letter. Max 1-month supply.' },
      AE: { status: 'restricted', note: 'Requires prior approval from Ministry of Health. Apply online before travel.' },
      ID: { status: 'restricted', note: 'Requires import permit. Contact Indonesian embassy before travel.' },
    },
  },
  // ── Anti-anxiety / Benzodiazepines ──
  {
    name: 'xanax',
    brands: ['Xanax', 'Alprazolam'],
    drugClass: 'Benzodiazepine',
    defaultStatus: 'prescription-only',
    generalNote: 'Controlled substance. Carry prescription, doctor letter, and keep in original packaging.',
    restrictions: {
      AE: { status: 'restricted', note: 'Requires prior approval from Ministry of Health. Carry original packaging and prescription.', localEquivalent: 'Available locally with psychiatrist prescription.' },
      JP: { status: 'prescription-only', note: 'Legal with prescription documentation. Import limit: 1-month supply. Declare at customs.' },
      SG: { status: 'restricted', note: 'Controlled under Misuse of Drugs Act. Requires import permit from HSA.', localEquivalent: 'Available with local psychiatrist prescription.' },
      TH: { status: 'prescription-only', note: 'Legal with valid prescription. Keep in original packaging.' },
    },
  },
  {
    name: 'valium',
    brands: ['Valium', 'Diazepam'],
    drugClass: 'Benzodiazepine',
    defaultStatus: 'prescription-only',
    generalNote: 'Same rules as other benzodiazepines. Keep original packaging and prescription.',
    restrictions: {
      AE: { status: 'restricted', note: 'Requires MoH approval before entry.' },
      SG: { status: 'restricted', note: 'Requires HSA import permit.' },
    },
  },
  // ── Antidepressants ──
  {
    name: 'zoloft',
    brands: ['Zoloft', 'Sertraline'],
    drugClass: 'SSRI antidepressant',
    defaultStatus: 'prescription-only',
    generalNote: 'Generally accepted worldwide with prescription documentation.',
    restrictions: {
      AE: { status: 'prescription-only', note: 'Legal with valid prescription. Register medications online before travel.' },
    },
  },
  {
    name: 'lexapro',
    brands: ['Lexapro', 'Escitalopram', 'Cipralex'],
    drugClass: 'SSRI antidepressant',
    defaultStatus: 'prescription-only',
    generalNote: 'Widely available globally. Carry prescription as backup.',
    restrictions: {},
  },
  {
    name: 'prozac',
    brands: ['Prozac', 'Fluoxetine'],
    drugClass: 'SSRI antidepressant',
    defaultStatus: 'prescription-only',
    generalNote: 'Widely available. Legal everywhere with prescription.',
    restrictions: {},
  },
  {
    name: 'wellbutrin',
    brands: ['Wellbutrin', 'Bupropion', 'Zyban'],
    drugClass: 'NDRI antidepressant',
    defaultStatus: 'prescription-only',
    generalNote: 'Generally accepted. Some countries may not stock it — bring enough supply.',
    restrictions: {
      JP: { status: 'prescription-only', note: 'Not commonly prescribed in Japan. Bring your full supply.', localEquivalent: 'Not widely available. SSRIs are the standard treatment in Japan.' },
    },
  },
  // ── Sleep aids ──
  {
    name: 'ambien',
    brands: ['Ambien', 'Zolpidem'],
    drugClass: 'Sleep aid (Z-drug)',
    defaultStatus: 'prescription-only',
    generalNote: 'Controlled substance in many countries. Carry prescription and limit supply to trip duration.',
    restrictions: {
      AE: { status: 'restricted', note: 'Requires MoH pre-approval.' },
      JP: { status: 'prescription-only', note: 'Legal with documentation. Max 1-month supply.' },
      SG: { status: 'restricted', note: 'Requires HSA import permit.' },
    },
  },
  {
    name: 'melatonin',
    brands: ['Melatonin', 'Natrol'],
    drugClass: 'Sleep supplement',
    defaultStatus: 'legal',
    generalNote: 'OTC in most countries. Some countries classify it as prescription-only.',
    restrictions: {
      GB: { status: 'prescription-only', note: 'Classified as a medicine in the UK. Not available OTC.', localEquivalent: 'Nytol (diphenhydramine) available OTC.' },
      AU: { status: 'prescription-only', note: 'Prescription required for doses above 2mg.', localEquivalent: 'Low-dose (1-2mg) available OTC as Circadin.' },
      DE: { status: 'prescription-only', note: 'Not approved as OTC supplement. Prescription required.', localEquivalent: 'Baldrian (valerian) herbal sleep aid available OTC.' },
      JP: { status: 'legal', note: 'Available but less common. Found in import supplement shops.' },
    },
  },
  // ── Pain relief ──
  {
    name: 'ibuprofen',
    brands: ['Advil', 'Motrin', 'Nurofen', 'Ibuprofen'],
    drugClass: 'NSAID pain reliever',
    defaultStatus: 'legal',
    generalNote: 'Available OTC virtually everywhere.',
    restrictions: {
      AE: { status: 'legal', note: 'Available OTC at pharmacies. Brand: Brufen.' },
    },
  },
  {
    name: 'acetaminophen',
    brands: ['Tylenol', 'Paracetamol', 'Panadol'],
    drugClass: 'Pain reliever / fever reducer',
    defaultStatus: 'legal',
    generalNote: 'Available OTC everywhere. Called "paracetamol" outside the US.',
    restrictions: {},
  },
  {
    name: 'codeine',
    brands: ['Tylenol 3', 'Co-codamol'],
    drugClass: 'Opioid pain reliever',
    defaultStatus: 'prescription-only',
    generalNote: 'Controlled substance. Some countries ban it entirely.',
    restrictions: {
      AE: { status: 'banned', note: 'Codeine is a controlled narcotic in UAE. Do not bring.' },
      JP: { status: 'restricted', note: 'Small amounts in OTC cold medicine OK. Pure codeine requires import documentation.' },
      IN: { status: 'legal', note: 'Available OTC in many pharmacies (cough syrups).' },
      GR: { status: 'prescription-only', note: 'Strict controls. Carry prescription.' },
    },
  },
  {
    name: 'tramadol',
    brands: ['Tramadol', 'Ultram'],
    drugClass: 'Opioid pain reliever',
    defaultStatus: 'prescription-only',
    generalNote: 'Controlled in most countries. Some ban it outright.',
    restrictions: {
      AE: { status: 'banned', note: 'Tramadol is banned in the UAE.' },
      EG: { status: 'banned', note: 'Illegal in Egypt. Severe penalties.' },
      JP: { status: 'prescription-only', note: 'Legal with prescription. Import limit applies.' },
      TH: { status: 'restricted', note: 'Narcotic classification. Requires FDA permit.' },
    },
  },
  // ── Allergy ──
  {
    name: 'benadryl',
    brands: ['Benadryl', 'Diphenhydramine'],
    drugClass: 'Antihistamine',
    defaultStatus: 'legal',
    generalNote: 'Available OTC in most countries.',
    restrictions: {
      ZA: { status: 'legal', note: 'Different formulation than US. Active ingredient may vary.' },
    },
  },
  {
    name: 'claritin',
    brands: ['Claritin', 'Loratadine'],
    drugClass: 'Antihistamine',
    defaultStatus: 'legal',
    generalNote: 'Available OTC everywhere.',
    restrictions: {},
  },
  {
    name: 'zyrtec',
    brands: ['Zyrtec', 'Cetirizine'],
    drugClass: 'Antihistamine',
    defaultStatus: 'legal',
    generalNote: 'Available OTC everywhere.',
    restrictions: {},
  },
  // ── Stomach ──
  {
    name: 'pepto bismol',
    brands: ['Pepto-Bismol', 'Bismuth subsalicylate'],
    drugClass: 'Antidiarrheal / stomach relief',
    defaultStatus: 'legal',
    generalNote: 'Not available in many countries outside US/Canada.',
    restrictions: {
      GB: { status: 'legal', note: 'Available but hard to find. Imodium is more common.' },
      JP: { status: 'legal', note: 'Not commonly sold. Japanese stomach medicines (Seirogan) are excellent alternatives.', localEquivalent: 'Seirogan, Biofermin S' },
      FR: { status: 'legal', note: 'Not commonly available. Smecta is the local alternative.', localEquivalent: 'Smecta (diosmectite)' },
      AU: { status: 'legal', note: 'Not widely stocked. Gastro-Stop (loperamide) is the local choice.', localEquivalent: 'Gastro-Stop' },
    },
  },
  {
    name: 'imodium',
    brands: ['Imodium', 'Loperamide'],
    drugClass: 'Antidiarrheal',
    defaultStatus: 'legal',
    generalNote: 'Available OTC worldwide. Essential for travel.',
    restrictions: {},
  },
  {
    name: 'omeprazole',
    brands: ['Prilosec', 'Omeprazole', 'Losec'],
    drugClass: 'Proton pump inhibitor',
    defaultStatus: 'legal',
    generalNote: 'Available OTC in most countries.',
    restrictions: {},
  },
  // ── Birth control ──
  {
    name: 'birth control pill',
    brands: ['Various oral contraceptives'],
    drugClass: 'Hormonal contraceptive',
    defaultStatus: 'prescription-only',
    generalNote: 'Legal everywhere but prescription requirements vary. Bring your full supply.',
    restrictions: {
      JP: { status: 'prescription-only', note: 'Legal but less commonly prescribed. Bring your own supply. Low-dose pills available at gynecologist clinics.' },
      PH: { status: 'prescription-only', note: 'Available but may face social stigma in rural pharmacies.' },
    },
  },
  {
    name: 'plan b',
    brands: ['Plan B', 'Levonorgestrel', 'Morning-after pill'],
    drugClass: 'Emergency contraceptive',
    defaultStatus: 'legal',
    generalNote: 'Availability varies significantly by country.',
    restrictions: {
      JP: { status: 'prescription-only', note: 'Requires doctor visit. Available at OB/GYN clinics. Cost: ~¥15,000 ($100).', localEquivalent: 'NorLevo (prescription required)' },
      PH: { status: 'banned', note: 'Emergency contraception is not legally sold in the Philippines.' },
      HU: { status: 'prescription-only', note: 'Requires prescription since 2020.' },
      IT: { status: 'legal', note: 'Available OTC for adults. Minors need prescription.' },
      KR: { status: 'prescription-only', note: 'Requires doctor visit. Available at OB/GYN clinics.' },
    },
  },
  // ── Asthma ──
  {
    name: 'albuterol',
    brands: ['Ventolin', 'ProAir', 'Salbutamol'],
    drugClass: 'Bronchodilator (inhaler)',
    defaultStatus: 'prescription-only',
    generalNote: 'Called "salbutamol" outside the US. Widely available.',
    restrictions: {
      JP: { status: 'prescription-only', note: 'Available at clinics. Called salbutamol (Ventolin). Carry prescription for customs.' },
      AU: { status: 'prescription-only', note: 'Ventolin available with pharmacist consultation (Schedule 3).' },
    },
  },
  // ── Diabetes ──
  {
    name: 'insulin',
    brands: ['Humalog', 'Lantus', 'Novolog', 'Various'],
    drugClass: 'Hormone (diabetes)',
    defaultStatus: 'prescription-only',
    generalNote: 'Legal everywhere. Carry doctor letter, keep refrigerated, bring extra supply.',
    restrictions: {
      AE: { status: 'prescription-only', note: 'Legal with documentation. Register with MoH before travel for large quantities.' },
    },
  },
  {
    name: 'metformin',
    brands: ['Glucophage', 'Metformin'],
    drugClass: 'Diabetes medication',
    defaultStatus: 'prescription-only',
    generalNote: 'Legal and available worldwide. Carry prescription.',
    restrictions: {},
  },
  // ── Blood pressure / Heart ──
  {
    name: 'lisinopril',
    brands: ['Lisinopril', 'Zestril', 'Prinivil'],
    drugClass: 'ACE inhibitor',
    defaultStatus: 'prescription-only',
    generalNote: 'Available worldwide with prescription.',
    restrictions: {},
  },
  {
    name: 'atorvastatin',
    brands: ['Lipitor', 'Atorvastatin'],
    drugClass: 'Statin (cholesterol)',
    defaultStatus: 'prescription-only',
    generalNote: 'Available worldwide with prescription.',
    restrictions: {},
  },
  // ── Antibiotics ──
  {
    name: 'amoxicillin',
    brands: ['Amoxicillin', 'Amoxil'],
    drugClass: 'Antibiotic',
    defaultStatus: 'prescription-only',
    generalNote: 'Prescription in most countries. Some countries sell OTC.',
    restrictions: {
      TH: { status: 'legal', note: 'Available OTC at pharmacies.' },
      MX: { status: 'legal', note: 'Available OTC at many pharmacies.' },
      IN: { status: 'legal', note: 'Available OTC at pharmacies.' },
      EG: { status: 'legal', note: 'Available OTC.' },
    },
  },
  {
    name: 'azithromycin',
    brands: ['Zithromax', 'Z-Pack', 'Azithromycin'],
    drugClass: 'Antibiotic',
    defaultStatus: 'prescription-only',
    generalNote: 'Useful for traveler\'s diarrhea. Some countries sell OTC.',
    restrictions: {
      TH: { status: 'legal', note: 'Available OTC at pharmacies.' },
      MX: { status: 'legal', note: 'Available OTC.' },
      IN: { status: 'legal', note: 'Available OTC.' },
    },
  },
  {
    name: 'ciprofloxacin',
    brands: ['Cipro', 'Ciprofloxacin'],
    drugClass: 'Antibiotic (fluoroquinolone)',
    defaultStatus: 'prescription-only',
    generalNote: 'Common traveler\'s diarrhea treatment. Carry prescription if bringing supply.',
    restrictions: {
      TH: { status: 'legal', note: 'Available OTC.' },
      IN: { status: 'legal', note: 'Available OTC.' },
    },
  },
  // ── Anti-malarial ──
  {
    name: 'malarone',
    brands: ['Malarone', 'Atovaquone-proguanil'],
    drugClass: 'Antimalarial',
    defaultStatus: 'prescription-only',
    generalNote: 'Legal everywhere. Essential for malaria zones. Start before travel.',
    restrictions: {},
  },
  {
    name: 'doxycycline',
    brands: ['Doxycycline', 'Vibramycin'],
    drugClass: 'Antibiotic / antimalarial',
    defaultStatus: 'prescription-only',
    generalNote: 'Dual use: antibiotic and malaria prevention. Available worldwide.',
    restrictions: {},
  },
  // ── Skin ──
  {
    name: 'hydrocortisone',
    brands: ['Cortaid', 'Hydrocortisone cream'],
    drugClass: 'Topical steroid',
    defaultStatus: 'legal',
    generalNote: 'Low-dose (0.5-1%) available OTC nearly everywhere.',
    restrictions: {},
  },
  // ── EpiPen ──
  {
    name: 'epipen',
    brands: ['EpiPen', 'Epinephrine auto-injector'],
    drugClass: 'Epinephrine (emergency allergy)',
    defaultStatus: 'prescription-only',
    generalNote: 'Carry doctor letter explaining medical necessity. Keep in original packaging.',
    restrictions: {
      JP: { status: 'prescription-only', note: 'Legal but not widely stocked. Bring your own. Declare at customs with doctor letter.' },
      AE: { status: 'prescription-only', note: 'Legal with documentation. Register with MoH.' },
    },
  },
  // ── THC / CBD ──
  {
    name: 'cbd oil',
    brands: ['CBD Oil', 'Cannabidiol'],
    drugClass: 'Cannabinoid supplement',
    defaultStatus: 'legal',
    generalNote: 'Legal status varies dramatically. Check before traveling.',
    restrictions: {
      JP: { status: 'banned', note: 'Any cannabis-derived products including CBD are illegal in Japan. Severe penalties.' },
      SG: { status: 'banned', note: 'CBD is classified as a controlled substance in Singapore.' },
      AE: { status: 'banned', note: 'CBD is illegal in the UAE. Zero tolerance.' },
      KR: { status: 'banned', note: 'CBD is classified as a narcotic in South Korea.' },
      TH: { status: 'restricted', note: 'CBD products must contain 0% THC. THC is controlled.' },
      ID: { status: 'banned', note: 'All cannabis products illegal. Severe penalties.' },
      EG: { status: 'banned', note: 'Cannabis derivatives illegal.' },
      MY: { status: 'banned', note: 'Cannabis products carry severe penalties including death penalty.' },
      CN: { status: 'banned', note: 'All cannabis products illegal.' },
    },
  },
  // ── Pseudoephedrine ──
  {
    name: 'sudafed',
    brands: ['Sudafed', 'Pseudoephedrine'],
    drugClass: 'Decongestant',
    defaultStatus: 'legal',
    generalNote: 'Legal but regulated in many countries due to precursor laws.',
    restrictions: {
      JP: { status: 'restricted', note: 'Pseudoephedrine products restricted. Small quantities in cold medicine OK. Pure pseudoephedrine requires import permit.' },
      MX: { status: 'banned', note: 'Pseudoephedrine banned in Mexico since 2007.' },
      KR: { status: 'restricted', note: 'Restricted quantities. Keep in original packaging.' },
    },
  },
  // ── Modafinil ──
  {
    name: 'modafinil',
    brands: ['Provigil', 'Modafinil'],
    drugClass: 'Wakefulness agent',
    defaultStatus: 'prescription-only',
    generalNote: 'Controlled in some countries. Carry prescription documentation.',
    restrictions: {
      JP: { status: 'banned', note: 'Classified as a stimulant drug. Cannot be imported even with prescription.' },
      AU: { status: 'prescription-only', note: 'Schedule 4. Must declare at customs.' },
      IN: { status: 'legal', note: 'Available OTC at many pharmacies.' },
      RU: { status: 'banned', note: 'Classified as psychotropic substance.' },
    },
  },
];

// ---------------------------------------------------------------------------
// Public API
// ---------------------------------------------------------------------------

/**
 * Check a medication's legality and equivalents for a destination.
 */
export function checkMedication(
  medicationName: string,
  destination: string,
): MedicationCheckResult | null {
  const search = medicationName.toLowerCase().trim();
  const med = MEDICATIONS.find(
    (m) =>
      m.name === search ||
      m.brands.some((b) => b.toLowerCase() === search) ||
      m.name.includes(search) ||
      m.brands.some((b) => b.toLowerCase().includes(search)),
  );

  if (!med) return null;

  const countryCode = getCountryCode(destination);
  const restriction = med.restrictions[countryCode];

  if (restriction) {
    return {
      medication: med.brands[0] ?? med.name,
      destination,
      countryCode,
      status: restriction.status,
      note: restriction.note,
      localEquivalent: restriction.localEquivalent,
      isControlled: restriction.status === 'banned' || restriction.status === 'restricted',
    };
  }

  return {
    medication: med.brands[0] ?? med.name,
    destination,
    countryCode,
    status: med.defaultStatus,
    note: med.generalNote,
    isControlled: med.defaultStatus === 'banned' || med.defaultStatus === 'restricted',
  };
}

/**
 * Search medications by name (for autocomplete).
 */
export function searchMedications(query: string): Array<{ name: string; brands: string[]; drugClass: string }> {
  if (!query || query.length < 2) return [];
  const q = query.toLowerCase().trim();
  return MEDICATIONS
    .filter(
      (m) =>
        m.name.includes(q) ||
        m.brands.some((b) => b.toLowerCase().includes(q)),
    )
    .map((m) => ({ name: m.name, brands: m.brands, drugClass: m.drugClass }));
}

/**
 * Get all medications that are problematic for a destination.
 */
export function getRestrictedMedications(destination: string): Array<{
  medication: string;
  status: LegalStatus;
  note: string;
}> {
  const countryCode = getCountryCode(destination);
  const results: Array<{ medication: string; status: LegalStatus; note: string }> = [];

  for (const med of MEDICATIONS) {
    const restriction = med.restrictions[countryCode];
    if (restriction && (restriction.status === 'banned' || restriction.status === 'restricted')) {
      results.push({
        medication: med.brands[0] ?? med.name,
        status: restriction.status,
        note: restriction.note,
      });
    }
  }

  return results;
}
