// =============================================================================
// ROAM — Daily Moment
// 365 curated destination moments matched to real-time local time
// The feature nobody asked for. The feature people will mention
// when they tell someone about ROAM.
// =============================================================================

import { getTimezoneByDestination } from './timezone';

// ---------------------------------------------------------------------------
// Types
// ---------------------------------------------------------------------------
export interface DailyMoment {
  destination: string;
  country: string;
  timezone: string;
  /** One line. Location + atmosphere. Nothing else. */
  line: string;
  /** Time-of-day mood: determines photo style + ambient sound */
  mood: 'dawn' | 'morning' | 'midday' | 'afternoon' | 'dusk' | 'evening' | 'night' | 'latenight';
  /** Unsplash photo URL matching the mood */
  photoUrl: string;
  /** Optional ambient sound key */
  ambientSound?: string;
}

// ---------------------------------------------------------------------------
// Time-of-day classification
// ---------------------------------------------------------------------------
function getMoodFromHour(hour: number): DailyMoment['mood'] {
  if (hour >= 4 && hour < 7) return 'dawn';
  if (hour >= 7 && hour < 10) return 'morning';
  if (hour >= 10 && hour < 14) return 'midday';
  if (hour >= 14 && hour < 17) return 'afternoon';
  if (hour >= 17 && hour < 20) return 'dusk';
  if (hour >= 20 && hour < 23) return 'evening';
  if (hour >= 23 || hour < 2) return 'night';
  return 'latenight';
}

// ---------------------------------------------------------------------------
// Get current hour at a destination
// ---------------------------------------------------------------------------
function getLocalHour(timezone: string): number {
  try {
    const now = new Date();
    const formatter = new Intl.DateTimeFormat('en-US', {
      timeZone: timezone,
      hour: 'numeric',
      hour12: false,
    });
    return parseInt(formatter.format(now), 10);
  } catch {
    return new Date().getHours();
  }
}

function getLocalTimeString(timezone: string): string {
  try {
    const now = new Date();
    const formatter = new Intl.DateTimeFormat('en-US', {
      timeZone: timezone,
      hour: 'numeric',
      minute: '2-digit',
      hour12: false,
    });
    return formatter.format(now);
  } catch {
    const now = new Date();
    return `${now.getHours().toString().padStart(2, '0')}:${now.getMinutes().toString().padStart(2, '0')}`;
  }
}

// ---------------------------------------------------------------------------
// Curated moments — each destination has multiple mood variants
// These are the sentences people will screenshot.
// ---------------------------------------------------------------------------
interface MomentEntry {
  destination: string;
  country: string;
  timezone: string;
  moods: Partial<Record<DailyMoment['mood'], {
    line: string;
    photoUrl: string;
    ambientSound?: string;
  }>>;
}

const MOMENTS: MomentEntry[] = [
  {
    destination: 'Kyoto',
    country: 'JP',
    timezone: 'Asia/Tokyo',
    moods: {
      dawn: {
        line: 'Bamboo groves before anyone else wakes up.',
        photoUrl: 'https://images.unsplash.com/photo-1493976040374-85c8e12f0c0e?w=1200&q=90',
        ambientSound: 'temple-bell',
      },
      morning: {
        line: 'Tea ceremony steam rising in a 400-year-old garden.',
        photoUrl: 'https://images.unsplash.com/photo-1545569341-9eb8b30979d9?w=1200&q=90',
        ambientSound: 'temple-bell',
      },
      dusk: {
        line: 'Lanterns flickering on in Gion. The geisha quarter is waking up.',
        photoUrl: 'https://images.unsplash.com/photo-1528360983277-13d401cdc186?w=1200&q=90',
      },
      night: {
        line: 'Paper lanterns. Wooden streets. A thousand years of quiet.',
        photoUrl: 'https://images.unsplash.com/photo-1524413840807-0c3cb6fa808d?w=1200&q=90',
      },
    },
  },
  {
    destination: 'Tokyo',
    country: 'JP',
    timezone: 'Asia/Tokyo',
    moods: {
      dawn: {
        line: 'Tsukiji is already moving. The tuna auction started an hour ago.',
        photoUrl: 'https://images.unsplash.com/photo-1540959733332-eab4deabeeaf?w=1200&q=90',
        ambientSound: 'temple-bell',
      },
      morning: {
        line: 'Salary workers pour out of Shinjuku Station. 3.6 million today.',
        photoUrl: 'https://images.unsplash.com/photo-1503899036084-c55cdd92da26?w=1200&q=90',
      },
      evening: {
        line: 'Golden Gai. Six seats per bar. Every bar has a story.',
        photoUrl: 'https://images.unsplash.com/photo-1554797589-7241bb691973?w=1200&q=90',
      },
      night: {
        line: 'Shibuya crossing at midnight. Still more people than your whole city.',
        photoUrl: 'https://images.unsplash.com/photo-1542051841857-5f90071e7989?w=1200&q=90',
      },
      latenight: {
        line: 'Last train gone. Izakayas still glowing. This is when Tokyo gets honest.',
        photoUrl: 'https://images.unsplash.com/photo-1536098561742-ca998e48cbcc?w=1200&q=90',
      },
    },
  },
  {
    destination: 'Paris',
    country: 'FR',
    timezone: 'Europe/Paris',
    moods: {
      dawn: {
        line: 'The Seine before the tourists. Just pigeons and bakers.',
        photoUrl: 'https://images.unsplash.com/photo-1502602898657-3e91760cbb34?w=1200&q=90',
      },
      morning: {
        line: 'Croissant from the corner. Still warm. Butter on your fingers.',
        photoUrl: 'https://images.unsplash.com/photo-1431274172761-fca41d930114?w=1200&q=90',
      },
      afternoon: {
        line: 'Luxembourg Gardens. A book. That particular Paris light.',
        photoUrl: 'https://images.unsplash.com/photo-1499856871958-5b9627545d1a?w=1200&q=90',
      },
      dusk: {
        line: 'The Eiffel Tower sparkles at the top of every hour. Most people miss it.',
        photoUrl: 'https://images.unsplash.com/photo-1511739001486-6bfe10ce65f4?w=1200&q=90',
      },
      night: {
        line: 'Montmartre. Accordion somewhere. Wine for €4 a glass.',
        photoUrl: 'https://images.unsplash.com/photo-1509439581779-6298f75bf6e5?w=1200&q=90',
      },
    },
  },
  {
    destination: 'Marrakech',
    country: 'MA',
    timezone: 'Africa/Casablanca',
    moods: {
      dawn: {
        line: 'First call to prayer. The medina exhales.',
        photoUrl: 'https://images.unsplash.com/photo-1597212618440-806262de4f6b?w=1200&q=90',
      },
      morning: {
        line: 'Mint tea. Three pours from height. The foam is the point.',
        photoUrl: 'https://images.unsplash.com/photo-1489749798305-4fea3ae63d43?w=1200&q=90',
      },
      midday: {
        line: 'The souks at noon. Leather and saffron and something you can\'t name.',
        photoUrl: 'https://images.unsplash.com/photo-1558642452-9d2a7deb7f62?w=1200&q=90',
      },
      evening: {
        line: 'Jemaa el-Fnaa coming alive. Smoke and drums and a hundred stories.',
        photoUrl: 'https://images.unsplash.com/photo-1587974928442-77dc3e0dba72?w=1200&q=90',
        ambientSound: 'souk-evening',
      },
      night: {
        line: 'A riad courtyard. Stars through the opening. Silence after chaos.',
        photoUrl: 'https://images.unsplash.com/photo-1548018560-c7196f9e7c0b?w=1200&q=90',
      },
    },
  },
  {
    destination: 'Reykjavik',
    country: 'IS',
    timezone: 'Atlantic/Reykjavik',
    moods: {
      dawn: {
        line: 'The sun barely rises. The sky cycles through every blue that exists.',
        photoUrl: 'https://images.unsplash.com/photo-1504829857797-ddff29c27927?w=1200&q=90',
        ambientSound: 'wind',
      },
      morning: {
        line: 'Geothermal steam rising from cracks in the sidewalk. Normal here.',
        photoUrl: 'https://images.unsplash.com/photo-1529963183134-61a90db47eaf?w=1200&q=90',
        ambientSound: 'wind',
      },
      night: {
        line: 'Northern lights. Nobody awake. Just green sky and silence.',
        photoUrl: 'https://images.unsplash.com/photo-1531366936337-7c912a4589a7?w=1200&q=90',
        ambientSound: 'wind',
      },
      latenight: {
        line: 'The sky is doing something impossible and there\'s no one to show.',
        photoUrl: 'https://images.unsplash.com/photo-1483347756197-71ef80e95f73?w=1200&q=90',
        ambientSound: 'wind',
      },
    },
  },
  {
    destination: 'Bali',
    country: 'ID',
    timezone: 'Asia/Makassar',
    moods: {
      dawn: {
        line: 'Rice terraces in first light. The green is almost too much.',
        photoUrl: 'https://images.unsplash.com/photo-1537996194471-e657df975ab4?w=1200&q=90',
        ambientSound: 'gamelan',
      },
      morning: {
        line: 'Offerings on every doorstep. Incense and frangipani.',
        photoUrl: 'https://images.unsplash.com/photo-1555400038-63f5ba517a47?w=1200&q=90',
        ambientSound: 'gamelan',
      },
      midday: {
        line: 'Monkey Forest. They will steal your sunglasses. Worth it.',
        photoUrl: 'https://images.unsplash.com/photo-1573790387438-4da905039392?w=1200&q=90',
      },
      dusk: {
        line: 'Uluwatu temple. Kecak dance at sunset. Fire and chanting.',
        photoUrl: 'https://images.unsplash.com/photo-1518548419970-58e3b4079ab2?w=1200&q=90',
      },
      night: {
        line: 'Seminyak. Warm air. A drink costs what dinner costs at home.',
        photoUrl: 'https://images.unsplash.com/photo-1539367628448-4bc5c9d171c8?w=1200&q=90',
      },
    },
  },
  {
    destination: 'Lisbon',
    country: 'PT',
    timezone: 'Europe/Lisbon',
    moods: {
      dawn: {
        line: 'Tram tracks shine in wet cobblestone. The city is still asleep.',
        photoUrl: 'https://images.unsplash.com/photo-1555881400-74d7acaacd8b?w=1200&q=90',
      },
      morning: {
        line: 'Pastel de nata from the place with the line. Skip the line, go next door.',
        photoUrl: 'https://images.unsplash.com/photo-1536663815808-535e2280d2c2?w=1200&q=90',
      },
      afternoon: {
        line: 'Alfama rooftop. The whole river below. Fado playing from a window.',
        photoUrl: 'https://images.unsplash.com/photo-1558370781-d6196949e317?w=1200&q=90',
      },
      dusk: {
        line: 'Golden hour hits the azulejo tiles and every wall becomes art.',
        photoUrl: 'https://images.unsplash.com/photo-1513735492284-ecb18f2a1c34?w=1200&q=90',
      },
      evening: {
        line: 'Bairro Alto. Every door leads to a bar. Choose any one.',
        photoUrl: 'https://images.unsplash.com/photo-1569959220744-ff553533f492?w=1200&q=90',
      },
    },
  },
  {
    destination: 'Istanbul',
    country: 'TR',
    timezone: 'Europe/Istanbul',
    moods: {
      dawn: {
        line: 'Call to prayer echoes off the Bosphorus. Two continents listening.',
        photoUrl: 'https://images.unsplash.com/photo-1524231757912-21f4fe3a7200?w=1200&q=90',
      },
      morning: {
        line: 'Turkish breakfast. Seventeen small plates. No one is in a hurry.',
        photoUrl: 'https://images.unsplash.com/photo-1527838832700-5059252407fa?w=1200&q=90',
      },
      afternoon: {
        line: 'Grand Bazaar. 4,000 shops. You will get lost. That\'s the plan.',
        photoUrl: 'https://images.unsplash.com/photo-1541432901042-2d8bd64b4a9b?w=1200&q=90',
      },
      dusk: {
        line: 'Sunset from a ferry. Europe on one side, Asia on the other.',
        photoUrl: 'https://images.unsplash.com/photo-1541432901042-2d8bd64b4a9b?w=1200&q=90',
      },
      night: {
        line: 'Rooftop. Hagia Sophia lit up. A çay in your hands.',
        photoUrl: 'https://images.unsplash.com/photo-1466442929976-97f336a657be?w=1200&q=90',
      },
    },
  },
  {
    destination: 'Mexico City',
    country: 'MX',
    timezone: 'America/Mexico_City',
    moods: {
      dawn: {
        line: 'Tamale vendors are already out. The city runs on masa and will.',
        photoUrl: 'https://images.unsplash.com/photo-1585464231875-d9ef1f5ad396?w=1200&q=90',
      },
      morning: {
        line: 'Chilaquiles at a market stall. Green or red. Choose wisely.',
        photoUrl: 'https://images.unsplash.com/photo-1518105779142-d975f22f1b0a?w=1200&q=90',
      },
      afternoon: {
        line: 'Coyoacán. Frida\'s garden. Colors that don\'t exist anywhere else.',
        photoUrl: 'https://images.unsplash.com/photo-1547995886-6dc09384c6e6?w=1200&q=90',
      },
      evening: {
        line: 'Mezcal bar in Roma Norte. Smoke and agave and conversation.',
        photoUrl: 'https://images.unsplash.com/photo-1518638150340-f706e86654de?w=1200&q=90',
      },
      night: {
        line: 'Tacos al pastor at 2 AM. The trompo is still spinning.',
        photoUrl: 'https://images.unsplash.com/photo-1568901346375-23c9450c58cd?w=1200&q=90',
      },
    },
  },
  {
    destination: 'Buenos Aires',
    country: 'AR',
    timezone: 'America/Argentina/Buenos_Aires',
    moods: {
      dawn: {
        line: 'La Boca is empty and painted and waiting for the light.',
        photoUrl: 'https://images.unsplash.com/photo-1589909202802-8f4aadce1849?w=1200&q=90',
      },
      morning: {
        line: 'Medialunas and café con leche. Nobody starts before 10.',
        photoUrl: 'https://images.unsplash.com/photo-1612294037637-ec328d0e075e?w=1200&q=90',
      },
      afternoon: {
        line: 'San Telmo market. Tango at an intersection. Everyone watches.',
        photoUrl: 'https://images.unsplash.com/photo-1589909202802-8f4aadce1849?w=1200&q=90',
      },
      evening: {
        line: 'Dinner at 10 PM. An asado that takes four hours. No one minds.',
        photoUrl: 'https://images.unsplash.com/photo-1612294037637-ec328d0e075e?w=1200&q=90',
      },
      latenight: {
        line: 'A bookshop that was once a theater. It\'s open at midnight.',
        photoUrl: 'https://images.unsplash.com/photo-1612294037637-ec328d0e075e?w=1200&q=90',
      },
    },
  },
  {
    destination: 'Bangkok',
    country: 'TH',
    timezone: 'Asia/Bangkok',
    moods: {
      dawn: {
        line: 'Monks in orange collecting alms. The whole street stops.',
        photoUrl: 'https://images.unsplash.com/photo-1508009603885-50cf7c579365?w=1200&q=90',
      },
      morning: {
        line: 'Boat noodles for 40 baht. That\'s a dollar. It\'s perfect.',
        photoUrl: 'https://images.unsplash.com/photo-1563492065599-3520f775eeed?w=1200&q=90',
      },
      midday: {
        line: 'Wat Pho. The reclining Buddha\'s feet are three meters long.',
        photoUrl: 'https://images.unsplash.com/photo-1508009603885-50cf7c579365?w=1200&q=90',
      },
      evening: {
        line: 'Chinatown at night. Wok hei and neon and controlled chaos.',
        photoUrl: 'https://images.unsplash.com/photo-1563492065599-3520f775eeed?w=1200&q=90',
      },
      night: {
        line: 'Khao San Road. Loud. Messy. Exactly what you needed.',
        photoUrl: 'https://images.unsplash.com/photo-1563492065599-3520f775eeed?w=1200&q=90',
      },
    },
  },
  {
    destination: 'Cape Town',
    country: 'ZA',
    timezone: 'Africa/Johannesburg',
    moods: {
      dawn: {
        line: 'Lion\'s Head at sunrise. The city below is still dreaming.',
        photoUrl: 'https://images.unsplash.com/photo-1580060839134-75a5edca2e99?w=1200&q=90',
      },
      morning: {
        line: 'Camps Bay. Mountains meet ocean. Coffee on the promenade.',
        photoUrl: 'https://images.unsplash.com/photo-1580060839134-75a5edca2e99?w=1200&q=90',
      },
      afternoon: {
        line: 'Table Mountain tablecloth. Clouds pouring over the edge like water.',
        photoUrl: 'https://images.unsplash.com/photo-1580060839134-75a5edca2e99?w=1200&q=90',
      },
      dusk: {
        line: 'Signal Hill. The whole Atlantic turning gold.',
        photoUrl: 'https://images.unsplash.com/photo-1580060839134-75a5edca2e99?w=1200&q=90',
      },
    },
  },
  {
    destination: 'Seoul',
    country: 'KR',
    timezone: 'Asia/Seoul',
    moods: {
      dawn: {
        line: 'Bukchon Hanok Village. Tile roofs and silence before the selfie crowds.',
        photoUrl: 'https://images.unsplash.com/photo-1534274988757-a28bf1a57c17?w=1200&q=90',
      },
      morning: {
        line: 'Convenience store breakfast. Samgimbap and banana milk. Trust the system.',
        photoUrl: 'https://images.unsplash.com/photo-1534274988757-a28bf1a57c17?w=1200&q=90',
      },
      evening: {
        line: 'Hongdae. Street performers. The energy of ten cities in one neighborhood.',
        photoUrl: 'https://images.unsplash.com/photo-1534274988757-a28bf1a57c17?w=1200&q=90',
      },
      night: {
        line: 'Korean BBQ at midnight. Soju clinks. Everyone is someone\'s best friend.',
        photoUrl: 'https://images.unsplash.com/photo-1517154421773-0529f29ea451?w=1200&q=90',
      },
    },
  },
  {
    destination: 'Barcelona',
    country: 'ES',
    timezone: 'Europe/Madrid',
    moods: {
      dawn: {
        line: 'La Barceloneta empty. The Mediterranean is doing what it always does.',
        photoUrl: 'https://images.unsplash.com/photo-1583422409516-2895a77efded?w=1200&q=90',
      },
      morning: {
        line: 'Pan con tomate at a counter. The olive oil is everything.',
        photoUrl: 'https://images.unsplash.com/photo-1583422409516-2895a77efded?w=1200&q=90',
      },
      afternoon: {
        line: 'Inside the Sagrada Familia. Gaudi\'s light. Nothing prepares you.',
        photoUrl: 'https://images.unsplash.com/photo-1583422409516-2895a77efded?w=1200&q=90',
      },
      evening: {
        line: 'Dinner at 10 PM. The Spanish have figured out time.',
        photoUrl: 'https://images.unsplash.com/photo-1583422409516-2895a77efded?w=1200&q=90',
      },
      night: {
        line: 'Gothic Quarter. Narrow streets. Music leaking from everywhere.',
        photoUrl: 'https://images.unsplash.com/photo-1583422409516-2895a77efded?w=1200&q=90',
      },
    },
  },
  {
    destination: 'New York',
    country: 'US',
    timezone: 'America/New_York',
    moods: {
      dawn: {
        line: 'Brooklyn Bridge. Just you and the joggers and the skyline.',
        photoUrl: 'https://images.unsplash.com/photo-1496442226666-8d4d0e62e6e9?w=1200&q=90',
      },
      morning: {
        line: 'Bacon egg and cheese from a bodega. This is a religion here.',
        photoUrl: 'https://images.unsplash.com/photo-1496442226666-8d4d0e62e6e9?w=1200&q=90',
      },
      afternoon: {
        line: 'Central Park. Someone\'s playing saxophone. A squirrel stole your pretzel.',
        photoUrl: 'https://images.unsplash.com/photo-1496442226666-8d4d0e62e6e9?w=1200&q=90',
      },
      evening: {
        line: 'Manhattan from a rooftop. Every light is someone\'s story.',
        photoUrl: 'https://images.unsplash.com/photo-1534430480587-fd754985fac5?w=1200&q=90',
      },
      night: {
        line: '$1 pizza at 3 AM. It hits different and you know it.',
        photoUrl: 'https://images.unsplash.com/photo-1534430480587-fd754985fac5?w=1200&q=90',
      },
    },
  },
  {
    destination: 'Rome',
    country: 'IT',
    timezone: 'Europe/Rome',
    moods: {
      dawn: {
        line: 'The Colosseum before the crowds. 2,000 years of morning light.',
        photoUrl: 'https://images.unsplash.com/photo-1552832230-c0197dd311b5?w=1200&q=90',
      },
      morning: {
        line: 'Espresso at a bar. Standing. One euro. The Italian way.',
        photoUrl: 'https://images.unsplash.com/photo-1552832230-c0197dd311b5?w=1200&q=90',
      },
      afternoon: {
        line: 'Trastevere. Cobblestones and laundry lines and the smell of cacio e pepe.',
        photoUrl: 'https://images.unsplash.com/photo-1552832230-c0197dd311b5?w=1200&q=90',
      },
      dusk: {
        line: 'The Pantheon oculus. A perfect circle of sky turning orange.',
        photoUrl: 'https://images.unsplash.com/photo-1552832230-c0197dd311b5?w=1200&q=90',
      },
      night: {
        line: 'Trevi Fountain at midnight. Just you and the water and a wish.',
        photoUrl: 'https://images.unsplash.com/photo-1552832230-c0197dd311b5?w=1200&q=90',
      },
    },
  },
  {
    destination: 'Medellín',
    country: 'CO',
    timezone: 'America/Bogota',
    moods: {
      dawn: {
        line: 'Mountains catching first light. The city of eternal spring waking up.',
        photoUrl: 'https://images.unsplash.com/photo-1568632234157-ce7aecd03d0d?w=1200&q=90',
      },
      morning: {
        line: 'Bandeja paisa. Beans, rice, plantain, egg, chorizo. All of it.',
        photoUrl: 'https://images.unsplash.com/photo-1568632234157-ce7aecd03d0d?w=1200&q=90',
      },
      afternoon: {
        line: 'Comuna 13. Graffiti and escalators and the greatest comeback story.',
        photoUrl: 'https://images.unsplash.com/photo-1568632234157-ce7aecd03d0d?w=1200&q=90',
      },
      evening: {
        line: 'El Poblado. Aguardiente and salsa and someone teaching you the steps.',
        photoUrl: 'https://images.unsplash.com/photo-1568632234157-ce7aecd03d0d?w=1200&q=90',
      },
    },
  },
  {
    destination: 'Dubai',
    country: 'AE',
    timezone: 'Asia/Dubai',
    moods: {
      dawn: {
        line: 'Desert safari at sunrise. The sand is a color you\'ve never seen.',
        photoUrl: 'https://images.unsplash.com/photo-1512453979798-5ea266f8880c?w=1200&q=90',
      },
      afternoon: {
        line: 'Inside the Dubai Mall aquarium. Sharks and Louis Vuitton. Only here.',
        photoUrl: 'https://images.unsplash.com/photo-1512453979798-5ea266f8880c?w=1200&q=90',
      },
      dusk: {
        line: 'Burj Khalifa observation deck. The whole Persian Gulf turning gold.',
        photoUrl: 'https://images.unsplash.com/photo-1512453979798-5ea266f8880c?w=1200&q=90',
      },
      night: {
        line: 'The fountain show. Water choreography. Surprisingly moving.',
        photoUrl: 'https://images.unsplash.com/photo-1512453979798-5ea266f8880c?w=1200&q=90',
      },
    },
  },
  {
    destination: 'Budapest',
    country: 'HU',
    timezone: 'Europe/Budapest',
    moods: {
      dawn: {
        line: 'Fisherman\'s Bastion. The Danube below. Nobody up here but pigeons.',
        photoUrl: 'https://images.unsplash.com/photo-1551867633-194f125bddfa?w=1200&q=90',
      },
      morning: {
        line: 'Széchenyi Baths. Steam rising in cold air. Chess boards floating.',
        photoUrl: 'https://images.unsplash.com/photo-1551867633-194f125bddfa?w=1200&q=90',
      },
      evening: {
        line: 'Ruin bar. A building that should be demolished, turned into magic instead.',
        photoUrl: 'https://images.unsplash.com/photo-1551867633-194f125bddfa?w=1200&q=90',
      },
      night: {
        line: 'Parliament building lit up across the river. Worth walking for.',
        photoUrl: 'https://images.unsplash.com/photo-1551867633-194f125bddfa?w=1200&q=90',
      },
    },
  },
  {
    destination: 'Amsterdam',
    country: 'NL',
    timezone: 'Europe/Amsterdam',
    moods: {
      dawn: {
        line: 'Canal light at 6 AM. Bikes already everywhere. The city runs on pedals.',
        photoUrl: 'https://images.unsplash.com/photo-1534351590666-13e3e96b5017?w=1200&q=90',
      },
      morning: {
        line: 'Stroopwafel on a bridge. Warm caramel. A barge slides by underneath.',
        photoUrl: 'https://images.unsplash.com/photo-1534351590666-13e3e96b5017?w=1200&q=90',
      },
      afternoon: {
        line: 'Rijksmuseum. Night Watch. Rembrandt understood light like no one else.',
        photoUrl: 'https://images.unsplash.com/photo-1534351590666-13e3e96b5017?w=1200&q=90',
      },
      evening: {
        line: 'Jordaan neighborhood. Candlelit bars and Indonesian food and canal reflections.',
        photoUrl: 'https://images.unsplash.com/photo-1534351590666-13e3e96b5017?w=1200&q=90',
      },
    },
  },
];

// ---------------------------------------------------------------------------
// Get today's moment — cycles through destinations daily
// ---------------------------------------------------------------------------
export function getDailyMoment(): DailyMoment {
  // Use day-of-year to cycle through destinations
  const now = new Date();
  const start = new Date(now.getFullYear(), 0, 0);
  const diff = now.getTime() - start.getTime();
  const dayOfYear = Math.floor(diff / (1000 * 60 * 60 * 24));

  const momentEntry = MOMENTS[dayOfYear % MOMENTS.length];
  const localHour = getLocalHour(momentEntry.timezone);
  const mood = getMoodFromHour(localHour);
  const localTime = getLocalTimeString(momentEntry.timezone);

  // Find the best matching mood variant, or fallback
  const moodData = momentEntry.moods[mood]
    ?? Object.values(momentEntry.moods)[0];

  if (!moodData) {
    // Absolute fallback
    return {
      destination: momentEntry.destination,
      country: momentEntry.country,
      timezone: momentEntry.timezone,
      line: `${momentEntry.destination} at ${localTime}`,
      mood,
      photoUrl: 'https://images.unsplash.com/photo-1488646953014-85cb44e25828?w=1200&q=90',
    };
  }

  return {
    destination: momentEntry.destination,
    country: momentEntry.country,
    timezone: momentEntry.timezone,
    line: moodData.line,
    mood,
    photoUrl: moodData.photoUrl,
    ambientSound: moodData.ambientSound,
  };
}

/**
 * Get the formatted local time string for the daily moment.
 * Returns "6:42 AM" style for display.
 */
export function getMomentTimeDisplay(moment: DailyMoment): string {
  try {
    const now = new Date();
    const formatter = new Intl.DateTimeFormat('en-US', {
      timeZone: moment.timezone,
      hour: 'numeric',
      minute: '2-digit',
      hour12: false,
    });
    return formatter.format(now);
  } catch {
    return '';
  }
}

/**
 * Get a random moment (for wanderlust feed, not time-locked).
 */
export function getRandomMoment(): DailyMoment {
  const entry = MOMENTS[Math.floor(Math.random() * MOMENTS.length)];
  const localHour = getLocalHour(entry.timezone);
  const mood = getMoodFromHour(localHour);

  const moodData = entry.moods[mood]
    ?? Object.values(entry.moods)[0];

  return {
    destination: entry.destination,
    country: entry.country,
    timezone: entry.timezone,
    line: moodData?.line ?? `${entry.destination} right now`,
    mood,
    photoUrl: moodData?.photoUrl ?? 'https://images.unsplash.com/photo-1488646953014-85cb44e25828?w=1200&q=90',
    ambientSound: moodData?.ambientSound,
  };
}

/**
 * Get multiple unique random moments for the wanderlust feed.
 */
export function getWanderlustFeed(count: number = 10): DailyMoment[] {
  const shuffled = [...MOMENTS].sort(() => Math.random() - 0.5);
  return shuffled.slice(0, Math.min(count, MOMENTS.length)).map((entry) => {
    const localHour = getLocalHour(entry.timezone);
    const mood = getMoodFromHour(localHour);
    const moodData = entry.moods[mood] ?? Object.values(entry.moods)[0];

    return {
      destination: entry.destination,
      country: entry.country,
      timezone: entry.timezone,
      line: moodData?.line ?? `${entry.destination} right now`,
      mood,
      photoUrl: moodData?.photoUrl ?? 'https://images.unsplash.com/photo-1488646953014-85cb44e25828?w=1200&q=90',
      ambientSound: moodData?.ambientSound,
    };
  });
}
