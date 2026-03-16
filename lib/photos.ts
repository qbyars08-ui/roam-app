// =============================================================================
// ROAM — Master Photo Library
// Every destination gets a real photo. No black. No placeholders. Ever.
// URLs include w=800&q=85&fm=webp for optimal caching.
// =============================================================================
import { getOptimizedImageUrl } from './unsplash';

const DESTINATION_PHOTOS: Record<string, string> = {
  'tokyo': 'https://images.unsplash.com/photo-1540959733332-eab4deabeeaf?w=800',
  'paris': 'https://images.unsplash.com/photo-1502602898657-3e91760cbb34?w=800',
  'bali': 'https://images.unsplash.com/photo-1537996194471-e657df975ab4?w=800',
  'barcelona': 'https://images.unsplash.com/photo-1583422409516-2895a77efded?w=800',
  'rome': 'https://images.unsplash.com/photo-1552832230-c0197dd311b5?w=800',
  'lisbon': 'https://images.unsplash.com/photo-1558370781-d6196949e317?w=800',
  'bangkok': 'https://images.unsplash.com/photo-1563492065599-3520f775eeed?w=800',
  'amsterdam': 'https://images.unsplash.com/photo-1534351590666-13e3e96b5017?w=800',
  'prague': 'https://images.unsplash.com/photo-1541849546-216549ae216d?w=800',
  'budapest': 'https://images.unsplash.com/photo-1565426873118-a17ed65d74b9?w=800',
  'vienna': 'https://images.unsplash.com/photo-1516550893923-42d28e5677af?w=800',
  'berlin': 'https://images.unsplash.com/photo-1560969184-10fe8719e047?w=800',
  'sydney': 'https://images.unsplash.com/photo-1506973035872-a4ec16b8e8d9?w=800',
  'new york': 'https://images.unsplash.com/photo-1490644658840-3f2e3f8c5625?w=800',
  'mexico city': 'https://images.unsplash.com/photo-1518105779142-d975f22f1b0a?w=800',
  'medellin': 'https://images.unsplash.com/photo-1599413987323-b2b8c0d7d9c8?w=800',
  'medellín': 'https://images.unsplash.com/photo-1599413987323-b2b8c0d7d9c8?w=800',
  'tbilisi': 'https://images.unsplash.com/photo-1565008576549-57569a49371d?w=800',
  'chiang mai': 'https://images.unsplash.com/photo-1528360983277-13d401cdc186?w=800',
  'porto': 'https://images.unsplash.com/photo-1555881400-74d7acaacd8b?w=800',
  'kyoto': 'https://images.unsplash.com/photo-1493976040374-85c8e12f0c0e?w=800',
  'seoul': 'https://images.unsplash.com/photo-1538485399081-7191377e8241?w=800',
  'singapore': 'https://images.unsplash.com/photo-1525625293386-3f8f99389edd?w=800',
  'dubai': 'https://images.unsplash.com/photo-1512453979798-5ea266f8880c?w=800',
  'istanbul': 'https://images.unsplash.com/photo-1524231757912-21f4fe3a7200?w=800',
  'cape town': 'https://images.unsplash.com/photo-1580060839134-75a5edca2e99?w=800',
  'marrakech': 'https://images.unsplash.com/photo-1597211684565-dca64d72bdfe?w=800',
  'reykjavik': 'https://images.unsplash.com/photo-1504893524553-b855bce32c67?w=800',
  'buenos aires': 'https://images.unsplash.com/photo-1589909202802-8f4aadce1849?w=800',
  'havana': 'https://images.unsplash.com/photo-1500759285222-a95626359a56?w=800',
  'iceland': 'https://images.unsplash.com/photo-1476610182048-b716b8518aae?w=800',
  'greece': 'https://images.unsplash.com/photo-1533105079780-92b9be482077?w=800',
  'santorini': 'https://images.unsplash.com/photo-1570077188670-e3a8d69ac5ff?w=800',
  'amalfi': 'https://images.unsplash.com/photo-1533587851505-d119e13fa0d7?w=800',
  'morocco': 'https://images.unsplash.com/photo-1489493887464-892be6d1daae?w=800',
  'colombia': 'https://images.unsplash.com/photo-1599413987323-b2b8c0d7d9c8?w=800',
  'london': 'https://images.unsplash.com/photo-1513635269975-59663e0ac1ad?w=800',
  'oaxaca': 'https://images.unsplash.com/photo-1506973035872-a4ec16b8e8d9?w=800',
  'cairo': 'https://images.unsplash.com/photo-1572252009286-268acec5ca0a?w=800',
  'dubrovnik': 'https://images.unsplash.com/photo-1555652940-94fef34b7d96?w=800',
  'hoi an': 'https://images.unsplash.com/photo-1583417319070-4a69db38a482?w=800',
  'cartagena': 'https://images.unsplash.com/photo-1555881400-74d7acaacd8b?w=800',
  'jaipur': 'https://images.unsplash.com/photo-1538485399081-7191377e8241?w=800',
  'queenstown': 'https://images.unsplash.com/photo-1507699622106-4be453abdbfe?w=800',
  'azores': 'https://images.unsplash.com/photo-1555881400-74d7acaacd8b?w=800',
  'ljubljana': 'https://images.unsplash.com/photo-1565008576549-57569a49371d?w=800',
  'siem reap': 'https://images.unsplash.com/photo-1552465011-b4e21bf6e79a?w=800',
  "colombia's coffee axis": 'https://images.unsplash.com/photo-1447933601403-0c6688de566e?w=800',
  'maldives': 'https://images.unsplash.com/photo-1514282401047-d79a71a590e8?w=800',
  'swiss alps': 'https://images.unsplash.com/photo-1506905925346-21bda4d32df4?w=800',
  'amalfi coast': 'https://images.unsplash.com/photo-1533587851505-d119e13fa0d7?w=800',
  'bora bora': 'https://images.unsplash.com/photo-1518998053901-5348d3961a04?w=800',
  'patagonia': 'https://images.unsplash.com/photo-1517322048670-4c5360076119?w=800',
  'new zealand': 'https://images.unsplash.com/photo-1507699622106-4be453abdbfe?w=800',
  'norway': 'https://images.unsplash.com/photo-1523464862212-d6631d073194?w=800',
  'norway fjords': 'https://images.unsplash.com/photo-1523464862212-d6631d073194?w=800',
  'french riviera': 'https://images.unsplash.com/photo-1524413840807-0c3cb6fa808d?w=800',
  'nice': 'https://images.unsplash.com/photo-1524413840807-0c3cb6fa808d?w=800',
  'côte d\'azur': 'https://images.unsplash.com/photo-1524413840807-0c3cb6fa808d?w=800',
  'lombok': 'https://images.unsplash.com/photo-1555400038-63f5ba517a47?w=800',
  'albania': 'https://images.unsplash.com/photo-1627738524854-7a6a61532c78?w=800',
  'split': 'https://images.unsplash.com/photo-1543965860-04714e515fa9?w=800',
  'croatia': 'https://images.unsplash.com/photo-1555652940-94fef34b7d96?w=800',
  'zurich': 'https://images.unsplash.com/photo-1523419409543-a5e549c1faa8?w=800',
  'milan': 'https://images.unsplash.com/photo-1513584684374-8bab748fbf90?w=800',
  'athens': 'https://images.unsplash.com/photo-1555993593-e8c0b663bc0e?w=800',
  'mykonos': 'https://images.unsplash.com/photo-1613395877344-13d4a8e0d49e?w=800',
  'los angeles': 'https://images.unsplash.com/photo-1534190760961-74e8c1c5c3da?w=800',
  'miami': 'https://images.unsplash.com/photo-1506966953602-c20cc11f75e3?w=800',
  'san francisco': 'https://images.unsplash.com/photo-1501594907352-04cda38ebc29?w=800',
  'portland': 'https://images.unsplash.com/photo-1558757388-37276c77f9a3?w=800',
  'vietnam': 'https://images.unsplash.com/photo-1583417319070-4a69db38a482?w=800',
  'hanoi': 'https://images.unsplash.com/photo-1583417319070-4a69db38a482?w=800',
  'saigon': 'https://images.unsplash.com/photo-1583417319070-4a69db38a482?w=800',
  'phuket': 'https://images.unsplash.com/photo-1552465011-b4e21bf6e79a?w=800',
  'thailand': 'https://images.unsplash.com/photo-1528181304800-259b08848526?w=800',
  'kuala lumpur': 'https://images.unsplash.com/photo-1596422846543-75c6fc197f07?w=800',
  'hong kong': 'https://images.unsplash.com/photo-1536599018102-9f803c140fc1?w=800',
  'taiwan': 'https://images.unsplash.com/photo-1596422846543-75c6fc197f07?w=800',
  'taipei': 'https://images.unsplash.com/photo-1587050086392-f3fb16b6ab9c?w=800',
  'oslo': 'https://images.unsplash.com/photo-1519035329543-b0f49c66c0e7?w=800',
  'stockholm': 'https://images.unsplash.com/photo-1508189860359-777d945909ef?w=800',
  'copenhagen': 'https://images.unsplash.com/photo-1506929562872-bb421503ef21?w=800',
  'edinburgh': 'https://images.unsplash.com/photo-1565565830605-f3b0b71747ae?w=800',
  'scotland': 'https://images.unsplash.com/photo-1486299267070-83823f5448dd?w=800',
  'ireland': 'https://images.unsplash.com/photo-1542621334-a254cf47733d?w=800',
  'dublin': 'https://images.unsplash.com/photo-1540645814468-b3e5f6b2f992?w=800',
  'india': 'https://images.unsplash.com/photo-1524491549084-d0fb585c2658?w=800',
  'delhi': 'https://images.unsplash.com/photo-1562931795-3037a6ed6142?w=800',
  'argentina': 'https://images.unsplash.com/photo-1547471080-7cc2caa01a7e?w=800',
  'peru': 'https://images.unsplash.com/photo-1526392060635-9d6019884377?w=800',
  'cuzco': 'https://images.unsplash.com/photo-1526392060635-9d6019884377?w=800',
  'machu picchu': 'https://images.unsplash.com/photo-1526392060635-9d6019884377?w=800',
  'sri lanka': 'https://images.unsplash.com/photo-1558171813-4c088753af8f?w=800',
  'nepal': 'https://images.unsplash.com/photo-1544735716-392fe2489ffa?w=800',
  'kathmandu': 'https://images.unsplash.com/photo-1544735716-392fe2489ffa?w=800',
  'namibia': 'https://images.unsplash.com/photo-1516026672322-bc52d61a55d5?w=800',
  'zanzibar': 'https://images.unsplash.com/photo-1552465011-b4e21bf6e79a?w=800',
  'tanzania': 'https://images.unsplash.com/photo-1516426122078-c23e76319801?w=800',
  'kenya': 'https://images.unsplash.com/photo-1516426122078-c23e76319801?w=800',
  'portugal': 'https://images.unsplash.com/photo-1555881400-74d7acaacd8b?w=800',
  'spain': 'https://images.unsplash.com/photo-1543783207-ec64e4d95325?w=800',
  'italy': 'https://images.unsplash.com/photo-1523906834658-6e24ef2386f9?w=800',
  'france': 'https://images.unsplash.com/photo-1502602898657-3e91760cbb34?w=800',
  'japan': 'https://images.unsplash.com/photo-1540959733332-eab4deabeeaf?w=800',
  'indonesia': 'https://images.unsplash.com/photo-1537996194471-e657df975ab4?w=800',
  'travel': 'https://images.unsplash.com/photo-1488646953014-85cb44e25828?w=800',
};

/** Beautiful generic travel photo — never black, never placeholder */
export const GENERIC_TRAVEL_FALLBACK =
  'https://images.unsplash.com/photo-1488085061387-422e29b40080?w=800';

/** Backup URL if primary fails */
export const BACKUP_FALLBACK =
  'https://images.unsplash.com/photo-1488646953014-85cb44e25828?w=800';

/**
 * Get a real destination photo. Sync, instant, guaranteed.
 * Exact match → partial match → generic travel fallback.
 * Never returns black or placeholder.
 */
export function getDestinationPhoto(destination: string, width = 800): string {
  const key = destination.toLowerCase().trim();
  let url: string;
  if (DESTINATION_PHOTOS[key]) {
    url = DESTINATION_PHOTOS[key];
  } else {
    const match = Object.keys(DESTINATION_PHOTOS).find(
      (k) => key.includes(k) || k.includes(key)
    );
    url = match ? DESTINATION_PHOTOS[match] : GENERIC_TRAVEL_FALLBACK;
  }
  return getOptimizedImageUrl(url, width);
}
