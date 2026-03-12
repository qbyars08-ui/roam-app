// =============================================================================
// ROAM — Travel Health Brief
// Vaccinations, tap water, hospitals (static dataset)
// =============================================================================

export interface HealthBrief {
  vaccinations: string;
  tapWater: 'safe' | 'unsafe' | 'boil';
  tapWaterNote: string;
  hospitalsNote?: string;
}

const HEALTH_DATA: Record<string, HealthBrief> = {
  japan: { vaccinations: 'No vaccinations required.', tapWater: 'safe', tapWaterNote: 'Tap water safe to drink.' },
  tokyo: { vaccinations: 'No vaccinations required.', tapWater: 'safe', tapWaterNote: 'Tap water safe to drink.' },
  kyoto: { vaccinations: 'No vaccinations required.', tapWater: 'safe', tapWaterNote: 'Tap water safe to drink.' },
  france: { vaccinations: 'No vaccinations required.', tapWater: 'safe', tapWaterNote: 'Tap water safe.' },
  paris: { vaccinations: 'No vaccinations required.', tapWater: 'safe', tapWaterNote: 'Tap water safe.' },
  thailand: { vaccinations: 'No vaccinations required for cities. Hepatitis A recommended for rural areas.', tapWater: 'unsafe', tapWaterNote: 'Bottled water recommended.' },
  bangkok: { vaccinations: 'No vaccinations required.', tapWater: 'unsafe', tapWaterNote: 'Bottled water recommended.' },
  indonesia: { vaccinations: 'Hepatitis A, Typhoid recommended. Yellow fever if coming from endemic area.', tapWater: 'unsafe', tapWaterNote: 'Bottled water only.' },
  bali: { vaccinations: 'Hepatitis A, Typhoid recommended.', tapWater: 'unsafe', tapWaterNote: 'Bottled water only.' },
  india: { vaccinations: 'Hepatitis A, Typhoid, Yellow fever (if from endemic area).', tapWater: 'unsafe', tapWaterNote: 'Bottled water only.' },
  vietnam: { vaccinations: 'Hepatitis A, Typhoid recommended.', tapWater: 'unsafe', tapWaterNote: 'Bottled water.' },
  cambodia: { vaccinations: 'Hepatitis A, Typhoid, Malaria (rural).', tapWater: 'unsafe', tapWaterNote: 'Bottled water.' },
  morocco: { vaccinations: 'Hepatitis A, Typhoid recommended.', tapWater: 'boil', tapWaterNote: 'Boil or bottled water.' },
  mexico: { vaccinations: 'Hepatitis A recommended.', tapWater: 'unsafe', tapWaterNote: 'Bottled water.' },
};

function keyForDest(dest: string): string | null {
  const k = dest.toLowerCase().replace(/\s+/g, ' ').trim();
  for (const key of Object.keys(HEALTH_DATA)) {
    if (k.includes(key) || key.includes(k)) return key;
  }
  return null;
}

export function getHealthBrief(destination: string): HealthBrief {
  const key = keyForDest(destination);
  return key
    ? HEALTH_DATA[key]
    : {
        vaccinations: 'Check CDC/WHO for latest. Routine vaccines recommended.',
        tapWater: 'unsafe' as const,
        tapWaterNote: 'When in doubt, use bottled water.',
      };
}
