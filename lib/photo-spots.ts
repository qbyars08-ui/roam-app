// =============================================================================
// ROAM — Photo Spots: Curated Instagram-worthy locations by destination
// NOT tourist traps — the spots photographers actually seek out.
// =============================================================================

export interface PhotoSpot {
  readonly name: string;
  readonly description: string;
  readonly bestTime: 'sunrise' | 'golden-hour' | 'blue-hour' | 'night' | 'anytime';
  readonly tipFromLocal: string;
  readonly instagramHashtag: string;
  readonly freeEntry: boolean;
}

// ---------------------------------------------------------------------------
// Curated spots — opinionated, local, specific
// ---------------------------------------------------------------------------

const PHOTO_SPOTS: Record<string, readonly PhotoSpot[]> = {
  tokyo: [
    {
      name: 'Senso-ji Temple, Asakusa',
      description: 'The Nakamise approach flanked by lanterns looks empty and cinematic at 5am. By 8am it is a wall of tour groups.',
      bestTime: 'sunrise',
      tipFromLocal: 'Arrive before 5:30am. The kaminarimon gate and stone lanterns glow amber in the first light.',
      instagramHashtag: '#sensoji',
      freeEntry: true,
    },
    {
      name: 'Shibuya Sky Rooftop',
      description: 'Glass-floor observation deck on top of Shibuya Scramble Square. The 360 view of the crossing and Tokyo sprawl is unlike any other.',
      bestTime: 'golden-hour',
      tipFromLocal: 'Book the 45-minute slot that straddles sunset. The sky turns deep orange over Mount Fuji on clear winter days.',
      instagramHashtag: '#shibuyasky',
      freeEntry: false,
    },
    {
      name: 'Yanaka Old Town Streets',
      description: 'The last surviving pre-war shitamachi neighborhood — wooden shopfronts, cats sleeping on stone steps, and zero influencers.',
      bestTime: 'golden-hour',
      tipFromLocal: 'Walk Yanaka Ginza shopping street at golden hour from west to east. The light comes straight down the alley.',
      instagramHashtag: '#yanaka',
      freeEntry: true,
    },
    {
      name: 'Shinjuku Omoide Yokocho',
      description: 'Memory Lane — a narrow alley of smoke-filled yakitori stalls from the 1950s. Neon reflections in rain puddles are surreal.',
      bestTime: 'blue-hour',
      tipFromLocal: 'Shoot from the alley entrance at blue hour before 8pm, before the crowds thicken the smoke.',
      instagramHashtag: '#omoideyokocho',
      freeEntry: true,
    },
    {
      name: 'Meguro River Cherry Blossoms',
      description: 'Cherry trees arch over a narrow urban canal for 4km. Not a park — an actual river walk through residential neighborhoods.',
      bestTime: 'night',
      tipFromLocal: 'Night lanterns during hanami season make the pink blossoms glow. Late March to early April only — plan ahead.',
      instagramHashtag: '#meguroriver',
      freeEntry: true,
    },
    {
      name: 'Hamarikyu Gardens East Gate',
      description: 'Tidal garden with a wooden tea house on a pond, skyscrapers of Shiodome as backdrop. An unlikely mix that photographs beautifully.',
      bestTime: 'golden-hour',
      tipFromLocal: 'The eastern entrance faces Shiodome towers. Position yourself at the pond so towers reflect behind the teahouse at dusk.',
      instagramHashtag: '#hamarikyu',
      freeEntry: false,
    },
  ],

  paris: [
    {
      name: 'Trocadero Plaza',
      description: 'The symmetrical viewpoint across the Seine to the Eiffel Tower. Famous, but utterly empty and moody at sunrise.',
      bestTime: 'sunrise',
      tipFromLocal: 'Get there 20 minutes before sunrise. You will have the entire plaza alone. Leave by 7:30am before the first tour buses.',
      instagramHashtag: '#trocadero',
      freeEntry: true,
    },
    {
      name: 'Montmartre Stairs, Rue Foyatier',
      description: 'The wide stone staircase leading up to Sacre-Coeur with the white dome framed above and the city spread below.',
      bestTime: 'golden-hour',
      tipFromLocal: 'Shoot from halfway up looking back down at sunset. The hazy orange Paris skyline is the real subject.',
      instagramHashtag: '#montmartre',
      freeEntry: true,
    },
    {
      name: 'Palais Royal Colonnade Arches',
      description: 'Long symmetrical colonnade in pale stone surrounds a garden. Completely overlooked by tourists who go to the Louvre next door.',
      bestTime: 'anytime',
      tipFromLocal: 'The Buren columns courtyard on the south side has graphic black-and-white pillars. No crowds, no barriers.',
      instagramHashtag: '#palaisroyal',
      freeEntry: true,
    },
    {
      name: 'Canal Saint-Martin',
      description: 'Iron footbridges, locks, and plane trees over the canal in the 10th. Feels like a different city from tourist Paris.',
      bestTime: 'golden-hour',
      tipFromLocal: 'Shoot from Passerelle Bichat bridge facing north. The reflection of the iron footbridge in the still water is perfect.',
      instagramHashtag: '#canalsaintmartin',
      freeEntry: true,
    },
    {
      name: 'Galerie Vivienne Passage',
      description: 'The most beautiful of Paris covered passages — mosaic floors, glass roof, and Belle Epoque detail from 1826.',
      bestTime: 'anytime',
      tipFromLocal: 'Overcast days are actually better here. The diffused light through the glass roof is soft and even.',
      instagramHashtag: '#galerievivienne',
      freeEntry: true,
    },
    {
      name: 'Rue Cremieux Colored Houses',
      description: 'A short cobblestone street of pastel-painted townhouses — candy-colored facades in pink, blue, yellow, and green.',
      bestTime: 'golden-hour',
      tipFromLocal: 'Face east for morning light on the facades. Weekday mornings only — on weekends it fills with influencer queues.',
      instagramHashtag: '#ruecremieux',
      freeEntry: true,
    },
  ],

  bali: [
    {
      name: 'Jatiluwih Rice Terraces',
      description: 'UNESCO terraces spreading across 600 hectares of volcanic hillside in Tabanan. Wider and less crowded than Tegallalang.',
      bestTime: 'golden-hour',
      tipFromLocal: 'Take the walking path west from the main entrance. At the far end you get terraces plus Mount Batukaru backdrop.',
      instagramHashtag: '#jatiluwih',
      freeEntry: false,
    },
    {
      name: 'Pura Lempuyang Gates',
      description: 'Split temple gate (candi bentar) framing Mount Agung. Requires respectful dress and is worth every early-alarm sacrifice.',
      bestTime: 'sunrise',
      tipFromLocal: 'Arrive by 5am. A guide can help you find the reflection puddle shot. By 8am the queue for photos is 90 minutes.',
      instagramHashtag: '#lemputang',
      freeEntry: false,
    },
    {
      name: 'Tegalalang at Sunrise with No People',
      description: 'Even the most Instagrammed rice terrace on earth is empty and ethereal at 5:45am before it turns into a carnival.',
      bestTime: 'sunrise',
      tipFromLocal: 'Walk 10 minutes north from the main lookout. The terraces there are identical but silent and uninterrupted.',
      instagramHashtag: '#tegalalang',
      freeEntry: false,
    },
    {
      name: 'Tukad Cepung Waterfall',
      description: 'A cave waterfall where the stream drops through a crack in the rock ceiling into a jungle grotto. Light beams at midday.',
      bestTime: 'anytime',
      tipFromLocal: 'Go between 10am and noon when the sun hits the crack. The light shaft through the mist is only there for an hour.',
      instagramHashtag: '#tukadcepung',
      freeEntry: false,
    },
    {
      name: 'Uluwatu Cliff Edge Temple',
      description: 'Hindu sea temple perched on a 70-meter cliff above crashing surf. Best photography is from the temple walls, not inside.',
      bestTime: 'golden-hour',
      tipFromLocal: 'Walk south along the cliff path from the entrance. The views back toward the temple at golden hour are untouched.',
      instagramHashtag: '#uluwatu',
      freeEntry: false,
    },
  ],

  bangkok: [
    {
      name: 'Wat Arun at Blue Hour',
      description: 'Temple of Dawn lives up to its name in reverse — the porcelain mosaic towers glow violet-gold in the blue hour before dark.',
      bestTime: 'blue-hour',
      tipFromLocal: 'Take the ferry from Tha Tien pier (Wat Pho side) at 6:15pm. Buy a coffee at the riverside cafe and wait for the light.',
      instagramHashtag: '#watarun',
      freeEntry: false,
    },
    {
      name: 'Bang Krachao Green Lung',
      description: 'A peninsula of jungle, canals, and old wooden houses in the middle of Bangkok. The most improbable green space in any megacity.',
      bestTime: 'golden-hour',
      tipFromLocal: 'Rent a bicycle from the ferry landing and follow the canal paths northwest. The old wooden market at sunset is stunning.',
      instagramHashtag: '#bangkrachao',
      freeEntry: true,
    },
    {
      name: 'Talad Noi Shophouse Alley',
      description: 'Crumbling Sino-Portuguese shophouses along narrow sois in the old Chinese quarter. Street art, temple incense, and zero tourists.',
      bestTime: 'golden-hour',
      tipFromLocal: 'Walk the alley behind Kuan Yin Shrine at golden hour when the shopfronts are still open and lit from inside.',
      instagramHashtag: '#taladnoi',
      freeEntry: true,
    },
    {
      name: 'Lebua Sky Bar at Night',
      description: 'Open-air rooftop bar on the 63rd floor — this is the Hangover bar. The river bend and city grid at night is cinematic.',
      bestTime: 'night',
      tipFromLocal: 'They enforce a drinks minimum but the view is worth it. Go right at opening (6pm) for the best light while it fades.',
      instagramHashtag: '#lebuaskyybar',
      freeEntry: false,
    },
    {
      name: 'Wat Phra Kaew Grand Palace Colonnade',
      description: 'The outer colonnade mural — 178 panels of the Ramakien epic in vivid color wrapping the entire temple complex perimeter.',
      bestTime: 'anytime',
      tipFromLocal: 'Most people photograph the main temple. The colonnaded mural walk on the inner walls is world-class and usually empty.',
      instagramHashtag: '#grandpalacebkk',
      freeEntry: false,
    },
  ],

  rome: [
    {
      name: 'Aventine Keyhole (Knights of Malta)',
      description: 'A bronze keyhole in a green wooden door that frames a perfectly aligned view down a hedge tunnel to Saint Peter\'s dome.',
      bestTime: 'anytime',
      tipFromLocal: 'There is usually a short queue. Dawn is perfect — the light is behind you and the dome is illuminated from within.',
      instagramHashtag: '#aventinekeyhole',
      freeEntry: true,
    },
    {
      name: 'Trastevere Streets at Blue Hour',
      description: 'Cobblestoned alleys of Rome\'s oldest neighborhood, warm-lit trattorias, ivy-draped ochre walls in the last light.',
      bestTime: 'blue-hour',
      tipFromLocal: 'Walk the streets around Piazza Santa Maria di Trastevere at blue hour. The fountain lamp reflections on wet stones are perfect.',
      instagramHashtag: '#trastevere',
      freeEntry: true,
    },
    {
      name: 'Palatine Hill Terrace, Roman Forum',
      description: 'The elevated terrace above the Forum gives you the columns, arches, and Colosseum all in one unobstructed frame.',
      bestTime: 'golden-hour',
      tipFromLocal: 'Buy the Colosseum combo ticket. The Palatine terrace at golden hour is the best view in Rome and almost nobody goes there.',
      instagramHashtag: '#palatinehill',
      freeEntry: false,
    },
    {
      name: 'Via della Conciliazione at Dawn',
      description: 'The straight axis road from the Tiber to Saint Peter\'s Basilica. Empty at dawn, no barriers, the full dome framed perfectly.',
      bestTime: 'sunrise',
      tipFromLocal: 'Walk down the center of the road at sunrise. The street is dead quiet and the dome catches the first light alone.',
      instagramHashtag: '#stpetersrome',
      freeEntry: true,
    },
    {
      name: 'Piazza Navona Before 7am',
      description: 'Baroque piazza with Bernini\'s Fountain of the Four Rivers. The marble and travertine glow gold with no tourists at all.',
      bestTime: 'sunrise',
      tipFromLocal: 'The cleaning trucks leave by 6:30am. The pigeons are the only witnesses. Get there before the cafe chairs go out.',
      instagramHashtag: '#piazzanavona',
      freeEntry: true,
    },
    {
      name: 'Pigneto Neighborhood Murals',
      description: 'Rome\'s creative district with large-scale street art on crumbling plaster walls. Pasolini used to drink here. Very little tourist presence.',
      bestTime: 'anytime',
      tipFromLocal: 'Walk Via del Pigneto from the arch east. The best murals are on the side streets branching north.',
      instagramHashtag: '#pigneto',
      freeEntry: true,
    },
  ],

  barcelona: [
    {
      name: 'Bunkers del Carmel at Sunrise',
      description: 'The Civil War anti-aircraft bunkers on the highest hill give you a 360 panorama of the entire city, port, and mountains.',
      bestTime: 'sunrise',
      tipFromLocal: 'This is the local\'s alternative to the Sagrada Familia crowds. Take a taxi up — the hike in the dark is not safe solo.',
      instagramHashtag: '#bunkersdelcarmel',
      freeEntry: true,
    },
    {
      name: 'El Born Gothic Quarter Back Streets',
      description: 'Medieval lanes between Carrer del Rec and Santa Maria del Mar basilica — carved stone facades and laundry across the alleys.',
      bestTime: 'golden-hour',
      tipFromLocal: 'Shoot from Carrer dels Mirallers heading toward the basilica with the setting sun behind you. The warm light on gothic stone is everything.',
      instagramHashtag: '#elborn',
      freeEntry: true,
    },
    {
      name: 'Palau de la Musica Catalana Exterior',
      description: 'Moderniste concert hall by Domenech i Montaner — the corner exterior is an eruption of ceramic, glass, and sculpture.',
      bestTime: 'anytime',
      tipFromLocal: 'The outside is free to photograph. The corner on Carrer de Sant Pere Mes Alt gives you the full facade. Interior tours are worth it too.',
      instagramHashtag: '#palaumusica',
      freeEntry: true,
    },
    {
      name: 'Parc del Laberint d\'Horta Cypress Maze',
      description: 'The oldest garden in Barcelona — neoclassical cypress maze with romantic statues, waterfalls, and nymphaeum. Almost no tourists.',
      bestTime: 'golden-hour',
      tipFromLocal: 'Closed Tuesdays and Wednesdays. Go on a weekday morning for the maze and the pond without anyone in the frame.',
      instagramHashtag: '#laberinthorta',
      freeEntry: false,
    },
    {
      name: 'Gracia Neighborhood Mosaics',
      description: 'The streets around Park Guell\'s free zone are lined with Gaudi-esque ceramic tile mosaics built into everyday walls.',
      bestTime: 'anytime',
      tipFromLocal: 'Walk Carrer del Coll from Gracia metro. Look for the tiled staircase at Baixada de la Gloria — zero crowds, incredible color.',
      instagramHashtag: '#graciabarcelona',
      freeEntry: true,
    },
  ],

  seoul: [
    {
      name: 'Naksan Park at Night',
      description: 'A hilltop park on the old Seoul city wall offering a view down onto the glowing grid of Ihwa-dong and Nakwon-dong below.',
      bestTime: 'night',
      tipFromLocal: 'Walk up from Hyehwa metro station at dusk. The rooftop cafe at the top stays open until midnight and costs a coffee.',
      instagramHashtag: '#naksanpark',
      freeEntry: true,
    },
    {
      name: 'Bukchon Hanok Village Alley',
      description: 'The steep alley between Bukchon Ro 11ga-gil and the valley — traditional tiled rooftops in an S-curve with Namsan Tower behind.',
      bestTime: 'sunrise',
      tipFromLocal: 'This alley is the most photographed in Seoul. It is completely empty before 7am. Weekday sunrise only.',
      instagramHashtag: '#bukchon',
      freeEntry: true,
    },
    {
      name: 'Seoullo 7017 Skygarden at Night',
      description: 'Elevated park built on an old highway overpass above Seoul Station — 645 species of plants and city lights under you.',
      bestTime: 'night',
      tipFromLocal: 'Walk the full length from Seoul Station to the south end at blue hour. The neon city background makes the plants look surreal.',
      instagramHashtag: '#seoullo7017',
      freeEntry: true,
    },
    {
      name: 'Gwangjang Market Textile Hall',
      description: 'The inner textile hall of Korea\'s oldest market — bolts of fabric in every color stacked floor to ceiling, natural overhead light.',
      bestTime: 'anytime',
      tipFromLocal: 'Go mid-morning when the fabric vendors are arranging stock. The colors and geometry are exceptional. Eat bindaetteok after.',
      instagramHashtag: '#gwangjangmarket',
      freeEntry: true,
    },
    {
      name: 'Ihwa Mural Village',
      description: 'Seoul\'s original mural village on the slopes below Naksan Park — hundreds of murals on narrow staircase alleys.',
      bestTime: 'golden-hour',
      tipFromLocal: 'The famous fish mural on the staircase still exists. Walk further into the residential alleys for the real art with zero crowds.',
      instagramHashtag: '#ihwavillage',
      freeEntry: true,
    },
    {
      name: 'Dongdaemun Design Plaza at Night',
      description: 'Zaha Hadid\'s seamless titanium and aluminum shell — no corners, no edges, just curves glowing silver under colored light.',
      bestTime: 'blue-hour',
      tipFromLocal: 'Walk the full circumference at blue hour. The reflections in the plaza water feature double the architecture.',
      instagramHashtag: '#ddp',
      freeEntry: true,
    },
  ],

  london: [
    {
      name: 'Leadenhall Market Interior',
      description: 'A Victorian covered market in the City with painted red and green iron vaulting, ornate lanterns, and cobblestone floors.',
      bestTime: 'anytime',
      tipFromLocal: 'Go on a weekday at 8am before the lunch crowd. The light through the glass ceiling is stunning and the market is empty.',
      instagramHashtag: '#leadenhallmarket',
      freeEntry: true,
    },
    {
      name: 'Bermondsey Street Blue Hour',
      description: 'A Victorian street of converted warehouses, independent galleries, and wine bars in South London. No chain stores, real texture.',
      bestTime: 'blue-hour',
      tipFromLocal: 'Walk Bermondsey Street from White Cube gallery south to Maltby Street at dusk. The warm shop windows against blue sky is the shot.',
      instagramHashtag: '#bermondsey',
      freeEntry: true,
    },
    {
      name: 'Columbia Road Flower Market Sunday',
      description: 'Narrow East End street packed with flower stalls every Sunday — a riot of color against Victorian brick shopfronts.',
      bestTime: 'anytime',
      tipFromLocal: 'Arrive at 8am when vendors are arranging the stalls. By 10am it is shoulder-to-shoulder. The flower-buyer faces are the real shot.',
      instagramHashtag: '#columbiaroad',
      freeEntry: true,
    },
    {
      name: 'Barbican Lakeside Terrace',
      description: 'The Brutalist residential estate has a lake, hanging gardens, and wild-looking concrete towers that photograph like a sci-fi set.',
      bestTime: 'golden-hour',
      tipFromLocal: 'Enter through the main Beech Street tunnel and walk to the lakeside terrace. Golden hour light on the raw concrete is extraordinary.',
      instagramHashtag: '#barbicanestate',
      freeEntry: true,
    },
    {
      name: 'Shoreditch Cargo Area Street Art',
      description: 'The railway arches along Kingsland Viaduct have fresh murals from some of the world\'s best street artists. Changes every few months.',
      bestTime: 'anytime',
      tipFromLocal: 'Walk Bethnal Green Road to Shoreditch High Street along the railway arches. The Hackney Wick side has the newer work.',
      instagramHashtag: '#shoreditchstreetart',
      freeEntry: true,
    },
    {
      name: 'Greenwich Observatory at Sunrise',
      description: 'The hill above the Royal Observatory overlooks the Maritime Museum, the Cutty Sark masts, and the City skyline in the distance.',
      bestTime: 'sunrise',
      tipFromLocal: 'The park gates open at 6am. Get to the top of the hill before sunrise and shoot the city waking up behind the Observatory dome.',
      instagramHashtag: '#greenwichobservatory',
      freeEntry: true,
    },
  ],
};

// ---------------------------------------------------------------------------
// Public API
// ---------------------------------------------------------------------------

export function getPhotoSpots(destination: string): readonly PhotoSpot[] {
  const key = destination.toLowerCase().trim();
  return PHOTO_SPOTS[key] ?? [];
}

export function getSpotsByTime(
  destination: string,
  time: PhotoSpot['bestTime']
): readonly PhotoSpot[] {
  return getPhotoSpots(destination).filter((s) => s.bestTime === time);
}

export function hasPhotoSpots(destination: string): boolean {
  return getPhotoSpots(destination).length > 0;
}

export function getFreeSpots(destination: string): readonly PhotoSpot[] {
  return getPhotoSpots(destination).filter((s) => s.freeEntry);
}

// ---------------------------------------------------------------------------
// Label & icon maps
// ---------------------------------------------------------------------------

export const BEST_TIME_LABELS: Record<PhotoSpot['bestTime'], string> = {
  sunrise: 'At sunrise',
  'golden-hour': 'Golden hour',
  'blue-hour': 'Blue hour',
  night: 'After dark',
  anytime: 'Any light',
} as const;

export const BEST_TIME_ICONS: Record<PhotoSpot['bestTime'], string> = {
  sunrise: 'Sunrise',
  'golden-hour': 'Sun',
  'blue-hour': 'Sunset',
  night: 'Moon',
  anytime: 'Camera',
} as const;
