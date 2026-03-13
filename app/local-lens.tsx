// =============================================================================
// ROAM — Local Lens
// See a destination through the eyes of locals, not tourist guides.
// The insider's cheat sheet for any city.
// =============================================================================
import React, { useEffect, useRef, useState } from 'react';
import {
  Animated,
  Pressable,
  ScrollView,
  StyleSheet,
  Text,
  View,
  type TextStyle,
  type ViewStyle,
} from 'react-native';
import { useLocalSearchParams, useRouter } from 'expo-router';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { LinearGradient } from 'expo-linear-gradient';
import { ChevronLeft } from 'lucide-react-native';
import { COLORS, FONTS, SPACING, RADIUS } from '../lib/constants';
import { useDestinationTheme } from '../lib/useDestinationTheme';
import { withComingSoon } from '../lib/with-coming-soon';
import { validateDestination } from '../lib/params-validator';

// =============================================================================
// Types
// =============================================================================
interface LocalRule {
  rule: string;
}

interface Neighborhood {
  name: string;
  vibe: string;
  localFavorite: string;
  avoidInstead: string;
}

interface RealFood {
  dish: string;
  where: string;
  priceRange: string;
  localTip: string;
}

interface Scam {
  name: string;
  howItWorks: string;
  howToAvoid: string;
}

interface TimeItRight {
  activity: string;
  bestTime: string;
  why: string;
}

interface LocalPhrase {
  phrase: string;
  pronunciation: string;
  meaning: string;
  whenToUse: string;
}

interface CityData {
  localRules: LocalRule[];
  neighborhoods: Neighborhood[];
  realFood: RealFood[];
  scams: Scam[];
  timeItRight: TimeItRight[];
  phrases: LocalPhrase[];
}

// =============================================================================
// Hardcoded city data
// =============================================================================
const LOCAL_DATA: Record<string, CityData> = {
  Tokyo: {
    localRules: [
      { rule: 'Never eat while walking — it\'s considered rude and sloppy' },
      { rule: 'Always carry cash. Many izakayas and ramen shops are cash-only' },
      { rule: 'Don\'t tip anywhere. It\'s considered insulting' },
      { rule: 'Stand on the left side of escalators in Tokyo (opposite in Osaka)' },
      { rule: 'Talking on your phone on trains is a serious taboo' },
    ],
    neighborhoods: [
      {
        name: 'Shimokitazawa',
        vibe: 'Thrift stores, tiny live houses, and curry shops run by one person',
        localFavorite: 'Shirube — a 6-seat standing bar with the best highballs',
        avoidInstead: 'Shibuya Center-Gai (loud, overpriced, chain stores)',
      },
      {
        name: 'Yanaka',
        vibe: 'Old Tokyo that survived the war — cats, temples, and zero tourists',
        localFavorite: 'Yanaka Ginza shotengai for menchi katsu at sunset',
        avoidInstead: 'Asakusa Senso-ji area (wall-to-wall tour groups)',
      },
      {
        name: 'Koenji',
        vibe: 'Punk rock, vintage clothing, and the best yakitori in the city',
        localFavorite: 'Niboshi Ramen Nagi for sardine broth ramen at 2am',
        avoidInstead: 'Harajuku Takeshita Street (costume shops for tourists)',
      },
      {
        name: 'Tomigaya',
        vibe: 'Quiet cafes and natural wine bars steps from Shibuya',
        localFavorite: 'Fuglen coffee by day, cocktails by night — same spot',
        avoidInstead: 'Omotesando (luxury mall disguised as a street)',
      },
    ],
    realFood: [
      {
        dish: 'Yoshinoya gyudon at 3am',
        where: 'Any Yoshinoya (there are thousands)',
        priceRange: '$3-5',
        localTip: 'Order "tsuyu-daku" for extra broth. Add a raw egg.',
      },
      {
        dish: 'Standing soba at train stations',
        where: 'Look for noren curtains inside any JR station',
        priceRange: '$2-4',
        localTip: 'Tempura kakesoba is the move. Eaten in under 5 minutes.',
      },
      {
        dish: 'Onigiri from Omusubi Gonbei',
        where: 'Multiple locations — Shinjuku station is best',
        priceRange: '$1-3',
        localTip: 'The mentaiko (spicy cod roe) is the correct choice.',
      },
      {
        dish: 'Monjayaki in Tsukishima',
        where: 'Monja Street, Tsukishima district',
        priceRange: '$8-15',
        localTip: 'It looks disgusting. It tastes incredible. Use the small spatula.',
      },
      {
        dish: 'Teishoku lunch sets',
        where: 'Any "teishoku-ya" near office buildings',
        priceRange: '$6-10',
        localTip: 'Full meal with rice, miso, pickles, main. Best value in Tokyo.',
      },
    ],
    scams: [
      {
        name: 'Kabukicho "free drink" touts',
        howItWorks: 'Guys on the street invite you to a bar. Drinks are free. The bill is $500.',
        howToAvoid: 'Never follow touts. If you didn\'t find the bar yourself, don\'t go in.',
      },
      {
        name: 'Fake monks asking for donations',
        howItWorks: 'They hand you a bracelet, then demand money. Not real monks.',
        howToAvoid: 'Real monks don\'t solicit on the street. Just say no and keep walking.',
      },
      {
        name: 'Overpriced "tourist" sushi near Tsukiji',
        howItWorks: 'Shops with English menus charge 3-5x normal prices for mediocre sushi.',
        howToAvoid: 'Look for places with only Japanese menus and a line of locals.',
      },
    ],
    timeItRight: [
      {
        activity: 'Visit Tsukiji outer market',
        bestTime: 'Tuesday-Thursday, 8am',
        why: 'Weekend crowds are 10x worse. Many stalls close by noon.',
      },
      {
        activity: 'Walk through Meiji Shrine',
        bestTime: 'Weekdays at opening (sunrise)',
        why: 'You\'ll have the forest path almost entirely to yourself.',
      },
      {
        activity: 'Hit the izakayas in Yurakucho',
        bestTime: 'Wednesday or Thursday, 6pm',
        why: 'Salary workers are there but it\'s not Friday chaos. Best atmosphere.',
      },
    ],
    phrases: [
      {
        phrase: 'Sumimasen',
        pronunciation: 'sue-mee-mah-SEN',
        meaning: 'Excuse me / Sorry / Thank you (context-dependent)',
        whenToUse: 'Getting someone\'s attention, passing through a crowd, or light apology',
      },
      {
        phrase: 'Okaikei onegaishimasu',
        pronunciation: 'oh-KAI-keh oh-neh-GUY-shee-mass',
        meaning: 'Check please',
        whenToUse: 'When you want the bill at a restaurant. This is the polite way.',
      },
      {
        phrase: 'Toriaezu nama de',
        pronunciation: 'toh-ree-AH-eh-zoo NAH-mah deh',
        meaning: 'Draft beer for now',
        whenToUse: 'First thing you say at an izakaya. Locals will respect you.',
      },
      {
        phrase: 'Otsukare sama desu',
        pronunciation: 'oh-TSOO-kah-reh SAH-mah DESS',
        meaning: 'Good work / Well done (lit: you must be tired)',
        whenToUse: 'End of a shared experience. Bartender closing up. Hiking group finishing.',
      },
    ],
  },

  Bali: {
    localRules: [
      { rule: 'Don\'t touch anyone\'s head — it\'s considered the most sacred part of the body' },
      { rule: 'Always use your right hand to give and receive things' },
      { rule: 'Don\'t step on offerings (canang sari) on the sidewalk — step over them' },
      { rule: 'Dress modestly at temples: sarong and sash required, shoulders covered' },
      { rule: 'Nyepi (Day of Silence) is real — no lights, no travel, no noise for 24 hours' },
    ],
    neighborhoods: [
      {
        name: 'Canggu (north end)',
        vibe: 'Where the long-term expats actually live — less influencer, more real',
        localFavorite: 'Warung Bu Mi for nasi campur that costs $1.50',
        avoidInstead: 'Canggu main strip / Batu Bolong (overpriced smoothie bowl territory)',
      },
      {
        name: 'Sidemen',
        vibe: 'The Ubud of 10 years ago — rice terraces without the crowds',
        localFavorite: 'Trekking to Bukit Cinta viewpoint at dawn',
        avoidInstead: 'Tegallalang Rice Terrace (Instagram zoo, pay to enter each section)',
      },
      {
        name: 'Amed',
        vibe: 'Black sand beaches, Japanese shipwreck snorkeling, zero nightlife',
        localFavorite: 'Warung Enak for grilled fish right on the beach',
        avoidInstead: 'Nusa Dua (resort bubble with no Balinese character)',
      },
    ],
    realFood: [
      {
        dish: 'Babi guling (suckling pig)',
        where: 'Warung Ibu Oka in Ubud or Babi Guling Chandra in Denpasar',
        priceRange: '$2-5',
        localTip: 'Go before 11am — they sell out. The crispy skin is the prize.',
      },
      {
        dish: 'Nasi campur from a warung',
        where: 'Any local warung with no English menu',
        priceRange: '$1-2',
        localTip: 'Point at what you want. The sambal is always homemade and always nuclear.',
      },
      {
        dish: 'Sate lilit (minced satay on lemongrass)',
        where: 'Night markets in Denpasar or Gianyar',
        priceRange: '$1-3',
        localTip: 'Balinese version uses fish, not chicken. Try both.',
      },
      {
        dish: 'Lawar (mixed vegetables with coconut and spices)',
        where: 'Ask at any warung — it\'s a ceremonial dish served daily',
        priceRange: '$1-2',
        localTip: 'The red lawar has blood mixed in. The white doesn\'t. Both are great.',
      },
    ],
    scams: [
      {
        name: 'Money changer short-change',
        howItWorks: 'They count fast, distract you, and pocket bills. "Magic hands" technique.',
        howToAvoid: 'Use ATMs or official exchange offices (BMC, Central Kuta). Count twice.',
      },
      {
        name: 'Motorbike rental damage claims',
        howItWorks: 'They claim pre-existing scratches are new and demand payment.',
        howToAvoid: 'Video the entire bike before riding off. Rent from your hotel, not street vendors.',
      },
    ],
    timeItRight: [
      {
        activity: 'Surf at Uluwatu',
        bestTime: 'Early morning, dry season (May-September)',
        why: 'Afternoon winds make it choppy. Morning glass is worth the early alarm.',
      },
      {
        activity: 'Visit Tirta Empul temple',
        bestTime: 'Weekday, before 9am',
        why: 'Tour buses arrive by 10. Get the purification ritual without 50 people watching.',
      },
      {
        activity: 'Explore Ubud market',
        bestTime: 'Before 8am',
        why: 'The real produce market runs early. After 9 it becomes a tourist souvenir market.',
      },
    ],
    phrases: [
      {
        phrase: 'Om swastiastu',
        pronunciation: 'ohm swah-stee-AH-stoo',
        meaning: 'Formal Balinese greeting (peace be with you)',
        whenToUse: 'Entering a temple, meeting elders, or any formal Balinese setting',
      },
      {
        phrase: 'Suksma',
        pronunciation: 'SOOK-smah',
        meaning: 'Thank you (Balinese, not Indonesian)',
        whenToUse: 'Use this instead of terima kasih and watch locals light up.',
      },
      {
        phrase: 'Berapa harganya?',
        pronunciation: 'beh-RAH-pah har-GAH-nyah',
        meaning: 'How much is this?',
        whenToUse: 'Markets, street vendors, anywhere without a price tag.',
      },
      {
        phrase: 'Belum',
        pronunciation: 'beh-LOOM',
        meaning: 'Not yet (instead of "no")',
        whenToUse: 'Indonesians say "not yet" instead of "no." It\'s softer and more polite.',
      },
    ],
  },

  Bangkok: {
    localRules: [
      { rule: 'Never disrespect the King or royal family — it\'s a serious crime (lese-majeste)' },
      { rule: 'Remove shoes before entering temples and homes' },
      { rule: 'Don\'t point your feet at Buddha statues or people' },
      { rule: 'The BTS and MRT are air-conditioned heaven — use them to skip traffic' },
      { rule: 'Street food vendors with long local lines are always the right choice' },
    ],
    neighborhoods: [
      {
        name: 'Ari',
        vibe: 'Quiet residential area with incredible local restaurants and zero tourists',
        localFavorite: 'Steve Cafe & Cuisine on the canal for Thai home cooking',
        avoidInstead: 'Khao San Road (backpacker party street, not real Bangkok)',
      },
      {
        name: 'Charoen Krung',
        vibe: 'Bangkok\'s oldest road — now a creative district with galleries and speakeasies',
        localFavorite: 'Tropic City for tropical cocktails in a colonial shophouse',
        avoidInstead: 'Silom / Patpong (tourist night market, overpriced everything)',
      },
      {
        name: 'Thonburi (west bank)',
        vibe: 'The "real" Bangkok — canals, temples, and local life tourists never see',
        localFavorite: 'Longtail boat through the canals at golden hour',
        avoidInstead: 'Chao Phraya tourist boats (overpriced floating buses)',
      },
      {
        name: 'On Nut / Phra Khanong',
        vibe: 'Where young Thais actually go out — cheap eats and rooftop bars',
        localFavorite: 'On Nut night market for $1 pad thai and grilled pork skewers',
        avoidInstead: 'Sukhumvit Soi 11 (overpriced foreigner clubs)',
      },
    ],
    realFood: [
      {
        dish: 'Kuay jab (rolled rice noodle soup)',
        where: 'Kuay Jab Mr. Joe in Yaowarat (Chinatown)',
        priceRange: '$1-2',
        localTip: 'Order with extra crispy pork belly. It\'s the dish Bangkok taxi drivers swear by.',
      },
      {
        dish: 'Boat noodles at Victory Monument',
        where: 'The alley behind Victory Monument BTS station',
        priceRange: '$0.50-1 per bowl',
        localTip: 'Bowls are tiny — order 3-5. That\'s how locals do it.',
      },
      {
        dish: 'Khao man gai (chicken rice)',
        where: 'Go-Ang Pratunam Chicken Rice, Pratunam district',
        priceRange: '$1-2',
        localTip: 'The sauce is what makes it. Mix the ginger-chili sauce into everything.',
      },
      {
        dish: 'Mango sticky rice from Mae Varee',
        where: 'Mae Varee, right outside Thong Lo BTS',
        priceRange: '$2-3',
        localTip: 'Go after 5pm when the mangoes are freshly sliced. Skip if it\'s not mango season (Apr-Jun).',
      },
      {
        dish: 'Isaan food at a random som tum cart',
        where: 'Look for carts with a mortar and pestle',
        priceRange: '$1-2',
        localTip: 'Say "pet nit noi" for a little spicy. Thai spicy will destroy you.',
      },
    ],
    scams: [
      {
        name: 'Tuk-tuk "temple closed today" scam',
        howItWorks: 'They say the temple is closed, offer to take you to a "better" one — actually a gem shop where they earn commission.',
        howToAvoid: 'Temples are almost never closed. Just walk past and check yourself.',
      },
      {
        name: 'Jet ski damage scam (Pattaya/islands)',
        howItWorks: 'They claim you damaged the jet ski and demand thousands of baht.',
        howToAvoid: 'Video everything before and after. Better yet, skip jet skis entirely.',
      },
      {
        name: 'Metered taxi refusal',
        howItWorks: 'Driver says "meter broken" and quotes a flat rate 3-5x the real cost.',
        howToAvoid: 'Insist on the meter or get out. Use Grab app instead — it\'s the local Uber.',
      },
    ],
    timeItRight: [
      {
        activity: 'Visit Chatuchak Weekend Market',
        bestTime: 'Saturday, 8-10am',
        why: 'By noon it\'s 40 degrees and packed. Early morning is cool and browsable.',
      },
      {
        activity: 'Eat in Yaowarat (Chinatown)',
        bestTime: 'Any weeknight after 7pm',
        why: 'Street stalls fire up at dusk. Weekend crowds are brutal.',
      },
      {
        activity: 'Get a Thai massage',
        bestTime: 'Weekday afternoon, 2-4pm',
        why: 'Therapists aren\'t tired yet and shops are empty. Avoid Wat Pho\'s tourist prices.',
      },
    ],
    phrases: [
      {
        phrase: 'Aroy mak',
        pronunciation: 'ah-ROY mahk',
        meaning: 'Very delicious',
        whenToUse: 'After eating street food. The vendor will beam. Use it constantly.',
      },
      {
        phrase: 'Tao rai khrap/ka',
        pronunciation: 'tao-RAI krahp/kah',
        meaning: 'How much?',
        whenToUse: 'Markets, street carts, anywhere without visible prices.',
      },
      {
        phrase: 'Mai sai phak chi',
        pronunciation: 'my sai pahk-CHEE',
        meaning: 'No cilantro please',
        whenToUse: 'If you hate cilantro. Otherwise say "sai phak chi yuh yuh" for extra.',
      },
      {
        phrase: 'Check bin',
        pronunciation: 'check bin',
        meaning: 'The bill please',
        whenToUse: 'At any restaurant. It\'s universal in Bangkok.',
      },
      {
        phrase: 'Sabai sabai',
        pronunciation: 'sah-BAI sah-BAI',
        meaning: 'Relaxed / easygoing / all good',
        whenToUse: 'The Thai equivalent of "no worries." Use it as a life philosophy.',
      },
    ],
  },

  Lisbon: {
    localRules: [
      { rule: 'Lunch is the big meal, not dinner. Restaurants serve the best deals at lunch (prato do dia)' },
      { rule: 'Don\'t eat near Praca do Comercio or Rossio — tourist trap central' },
      { rule: 'Learn to say "um galao, por favor" — it\'s the local coffee order (latte in a tall glass)' },
      { rule: 'Wear good shoes. The hills will destroy your feet in sandals.' },
    ],
    neighborhoods: [
      {
        name: 'Mouraria',
        vibe: 'Multicultural, gritty, real — the birthplace of fado',
        localFavorite: 'Tia Alice for a home-cooked lunch that costs 7 euros with wine',
        avoidInstead: 'Alfama tourist fado houses (overpriced, performed for busloads)',
      },
      {
        name: 'Alcantara / LX Factory',
        vibe: 'Converted industrial space with studios, brunch spots, and a killer bookshop',
        localFavorite: 'Landeau for the single best chocolate cake in Lisbon',
        avoidInstead: 'Belem pasteis de nata line (Manteigaria in Chiado is better, no wait)',
      },
      {
        name: 'Arroios',
        vibe: 'The most diverse neighborhood in Lisbon — incredible international food',
        localFavorite: 'Ramiro for the best seafood in the city (locals go, not just tourists)',
        avoidInstead: 'Bairro Alto at night (sticky floors, tourist bars, overpriced drinks)',
      },
      {
        name: 'Intendente',
        vibe: 'Recently revitalized square with craft beer, art, and neighborhood energy',
        localFavorite: 'Cervejaria Lisboa for local craft beer and petiscos',
        avoidInstead: 'Pink Street (Instagram famous, zero substance)',
      },
    ],
    realFood: [
      {
        dish: 'Bifana (pork sandwich)',
        where: 'As Bifanas do Afonso, Praca da Figueira',
        priceRange: '$2-4',
        localTip: 'Slap some piri-piri on it. Eat it standing at the counter with a beer.',
      },
      {
        dish: 'Prato do dia (daily special)',
        where: 'Any tascas (local tavern) with a handwritten menu',
        priceRange: '$6-9',
        localTip: 'Full meal with soup, bread, main, drink, and coffee. Best deal in Europe.',
      },
      {
        dish: 'Canned fish (conservas)',
        where: 'Conserveira de Lisboa or any conservas shop',
        priceRange: '$3-8 per tin',
        localTip: 'Not a tourist gimmick — Portuguese tinned fish is genuinely world-class.',
      },
      {
        dish: 'Ginjinha (cherry liqueur)',
        where: 'A Ginjinha bar near Rossio (the original, tiny standing bar)',
        priceRange: '$1-2 per shot',
        localTip: 'Ask for "com elas" to get the boozy cherries at the bottom.',
      },
      {
        dish: 'Francesinha (if you day-trip to Porto)',
        where: 'Cafe Santiago in Porto',
        priceRange: '$8-12',
        localTip: 'It\'s a meat sandwich drowned in cheese and beer sauce. You need it.',
      },
    ],
    scams: [
      {
        name: 'Tram 28 pickpockets',
        howItWorks: 'Organized groups crowd the famous tram and lift wallets in the crush.',
        howToAvoid: 'Walk the Tram 28 route instead — it\'s beautiful on foot. Or take Tram 12 (same route, no tourists).',
      },
      {
        name: 'Restaurant "couvert" charges',
        howItWorks: 'Bread, olives, and cheese appear before you order. They\'re not free — 3-8 euros each.',
        howToAvoid: 'Just say "nao obrigado" and send them back. It\'s completely normal.',
      },
    ],
    timeItRight: [
      {
        activity: 'Visit Pasteis de Belem',
        bestTime: 'Weekday, 8am or after 3pm',
        why: 'The line wraps around the block midday. Morning or late afternoon: walk right in.',
      },
      {
        activity: 'Sunset at Miradouro da Graca',
        bestTime: 'Any evening, arrive 45 min before sunset',
        why: 'Bring wine. The view is free. Miradouro da Senhora do Monte is less crowded.',
      },
      {
        activity: 'Browse the Feira da Ladra flea market',
        bestTime: 'Tuesday morning, early',
        why: 'Saturday is a mob scene. Tuesday has the same vendors with a fraction of the crowd.',
      },
    ],
    phrases: [
      {
        phrase: 'Um galao, por favor',
        pronunciation: 'oom gah-LOWN, por fah-VOR',
        meaning: 'A latte in a tall glass, please',
        whenToUse: 'Your morning coffee order. Every cafe knows it.',
      },
      {
        phrase: 'A conta, se faz favor',
        pronunciation: 'ah CON-tah, seh FAHZ fah-VOR',
        meaning: 'The bill, please',
        whenToUse: 'At restaurants. More polite than just waving.',
      },
      {
        phrase: 'Fixe',
        pronunciation: 'FEESH',
        meaning: 'Cool / awesome',
        whenToUse: 'Casual slang. Use it like you\'d say "nice" in English.',
      },
      {
        phrase: 'Bica',
        pronunciation: 'BEE-kah',
        meaning: 'Espresso (Lisbon term)',
        whenToUse: 'In Lisbon they say bica, in Porto they say cimbalino. Knowing this is local cred.',
      },
      {
        phrase: 'Com licenca',
        pronunciation: 'kohm lee-SEN-sah',
        meaning: 'Excuse me / With your permission',
        whenToUse: 'Passing through crowds, entering a shop, getting attention politely.',
      },
    ],
  },

  Paris: {
    localRules: [
      { rule: 'Never rush at cafes — sitting for hours with one coffee is completely normal' },
      { rule: 'Lunch is typically noon–2pm. Many bistrots close between services' },
      { rule: 'Say "bonjour" when entering any shop — it\'s considered rude not to' },
      { rule: 'Dinner starts at 7:30pm earliest; 8:30–9pm is more typical' },
      { rule: 'Tipping is included (service compris). Round up or add 5–10% max' },
    ],
    neighborhoods: [
      {
        name: 'Belleville',
        vibe: 'Multicultural, street art, cheap eats, and zero Eiffel Tower views',
        localFavorite: 'Du Pain et des Idées for the best escargot-shaped pistachio pastry',
        avoidInstead: 'Champs-Élysées (chain stores and overpriced cafes)',
      },
      {
        name: 'Canal Saint-Martin',
        vibe: 'Where young Parisians picnic and drink wine by the water',
        localFavorite: 'Chez Prune for apéro — the terrace is legendary',
        avoidInstead: 'Montmartre Sacré-Coeur (tourist mob, pickpockets, overpriced crepes)',
      },
      {
        name: '11ème (Oberkampf / République)',
        vibe: 'Dive bars, natural wine, late-night tacos, and real nightlife',
        localFavorite: 'Le Perchoir rooftop for sunset — book ahead',
        avoidInstead: 'Pigalle (seedy strip clubs and tourist traps)',
      },
      {
        name: 'Marais (north end)',
        vibe: 'Cobblestones, galleries, falafel — the trendy part of old Paris',
        localFavorite: 'L\'As du Fallafel for the best falafel in Europe (cash only)',
        avoidInstead: 'Marais around Place des Vosges (overpriced galleries and tourist restaurants)',
      },
    ],
    realFood: [
      {
        dish: 'Steak frites at a neighborhood bistro',
        where: 'Le Comptoir du Relais (St-Germain) or any bistro with a chalkboard menu',
        priceRange: '€18–28',
        localTip: 'Order "saignant" for medium-rare. That\'s how they eat it.',
      },
      {
        dish: 'Croissant from a real boulangerie',
        where: 'Blé Sucré (12ème) or Du Pain et des Idées (10ème)',
        priceRange: '€1.20–1.80',
        localTip: 'Go before 10am. If it\'s in plastic, keep walking.',
      },
      {
        dish: 'Wine and cheese at a wine bar',
        where: 'Charbon (Canal Saint-Martin) or La Cave des Papilles',
        priceRange: '€8–15 per glass',
        localTip: 'Ask for "une planche" — a cheese/ charcuterie board. Perfect for two.',
      },
      {
        dish: 'Aligot (cheesy mashed potatoes)',
        where: 'L\'Aubrac (near Les Halles) or any Aubrac-style restaurant',
        priceRange: '€12–18',
        localTip: 'It\'s stringy, cheesy, impossible to resist. Order with steak.',
      },
      {
        dish: 'Falafel in the Marais',
        where: 'L\'As du Fallafel — Rue des Rosiers',
        priceRange: '€8–10',
        localTip: 'Get it to go and eat on the bench. The line moves fast.',
      },
    ],
    scams: [
      {
        name: 'Gold ring "you dropped this" scam',
        howItWorks: 'Someone picks up a "gold" ring, says you dropped it, then asks for money.',
        howToAvoid: 'Say "non, ce n\'est pas à moi" and keep walking. The ring is fake.',
      },
      {
        name: 'Petition signature pickpockets',
        howItWorks: 'Groups with clipboards block your path while others lift your wallet.',
        howToAvoid: 'Never stop. Say "non merci" and keep moving. Hands in pockets.',
      },
      {
        name: 'Restaurant "cover" charges',
        howItWorks: 'Hidden fees for bread, water, or "couvert" that you didn\'t order.',
        howToAvoid: 'Ask "c\'est inclus?" before accepting. Send back anything you didn\'t order.',
      },
    ],
    timeItRight: [
      {
        activity: 'Visit the Louvre',
        bestTime: 'Wednesday or Friday evening (open until 9:45pm)',
        why: 'Fewer crowds than daytime. The Mona Lisa is less mobbed after 7pm.',
      },
      {
        activity: 'Walk along the Seine',
        bestTime: 'Weekday sunset',
        why: ' weekends the banks are packed. Weekday golden hour is peaceful.',
      },
      {
        activity: 'Market at Marché d\'Aligre',
        bestTime: 'Tuesday–Sunday, before 11am',
        why: 'Best produce, cheese, and wine. After noon it thins out.',
      },
    ],
    phrases: [
      {
        phrase: 'Un café, s\'il vous plaît',
        pronunciation: 'uhn kah-FAY, seel voo play',
        meaning: 'A coffee, please (espresso)',
        whenToUse: 'The default "coffee" in Paris is espresso. For milk, say "café crème."',
      },
      {
        phrase: 'L\'addition, s\'il vous plaît',
        pronunciation: 'la-dee-SYOHN, seel voo play',
        meaning: 'The check, please',
        whenToUse: 'Parisians don\'t rush you — you have to ask for the bill.',
      },
      {
        phrase: 'C\'est pas faux',
        pronunciation: 'say pah foh',
        meaning: 'Fair point / You\'re not wrong',
        whenToUse: 'Casual agreement. Very Parisian.',
      },
      {
        phrase: 'On verra',
        pronunciation: 'ohn veh-RAH',
        meaning: 'We\'ll see',
        whenToUse: 'Non-committal Parisian response. Use it everywhere.',
      },
      {
        phrase: 'Bonne continuation',
        pronunciation: 'bun kohn-tee-new-ah-SYOHN',
        meaning: 'Good luck / Have a good one',
        whenToUse: 'Said when parting ways — more natural than "au revoir" in casual settings.',
      },
    ],
  },

  'New York': {
    localRules: [
      { rule: 'Stand on the right on escalators. Walk on the left. Violators will be judged' },
      { rule: 'Don\'t block the sidewalk — "stand clear of the closing doors" means move' },
      { rule: 'Tipping: 15–20% at restaurants, $1–2 per drink at bars' },
      { rule: 'Slice shops and bodegas are open 24/7. Use them.' },
      { rule: 'Subway before 6am and after midnight runs less frequently. Plan accordingly' },
    ],
    neighborhoods: [
      {
        name: 'Jackson Heights',
        vibe: 'The most diverse neighborhood on earth — Indian, Tibetan, Colombian, Thai',
        localFavorite: 'Dhaabar for $6 thali, or Delhi Heights for dosa',
        avoidInstead: 'Times Square restaurants (chain hell, 3x the price)',
      },
      {
        name: 'Bushwick',
        vibe: 'Street art, dive bars, and warehouse parties — Brooklyn\'s creative hub',
        localFavorite: 'Roberta\'s for pizza, or Syndicated for movies + drinks',
        avoidInstead: 'DUMBO (Instagram backdrop, overpriced everything)',
      },
      {
        name: 'Astoria',
        vibe: 'Greek tavernas, Egyptian cafes, and the best cheap eats in Queens',
        localFavorite: 'Taverna Kyclades for grilled whole fish, or King of Falafel',
        avoidInstead: 'Little Italy (one block of tourist traps, not real)',
      },
      {
        name: 'East Village',
        vibe: 'Punk history, dive bars, and late-night ramen',
        localFavorite: 'Veselka for 24hr Ukrainian diner, or Rai Rai Ken for ramen',
        avoidInstead: 'Midtown for dinner (corporate chains and expense-account prices)',
      },
    ],
    realFood: [
      {
        dish: 'Dollar slice (or $2.50 slice)',
        where: 'Joe\'s Pizza (West Village) or any slice joint with a line',
        priceRange: '$1–3',
        localTip: 'Fold it. Eat it walking. That\'s the move.',
      },
      {
        dish: 'Pastrami on rye',
        where: 'Katz\'s Deli (LES) — cash preferred',
        priceRange: '$25–30',
        localTip: 'It\'s expensive. Split it. The pastrami is worth it. Get a knish on the side.',
      },
      {
        dish: 'Bodega chopped cheese',
        where: 'Any bodega in Harlem or the Bronx with a deli counter',
        priceRange: '$6–10',
        localTip: 'The NYC version of a Philly cheesesteak. Ask for everything on it.',
      },
      {
        dish: 'Dim sum in Flushing',
        where: 'Jade Asian or Golden Mall basement',
        priceRange: '$3–6 per dish',
        localTip: 'Go before 11am on a weekend. Cart service. Cash only at some spots.',
      },
      {
        dish: 'Halal cart chicken over rice',
        where: '53rd & 6th (the famous one) or any cart with a line',
        priceRange: '$6–8',
        localTip: 'White sauce and hot sauce. Eat on the curb. No shame.',
      },
    ],
    scams: [
      {
        name: 'CD "free" giveaway',
        howItWorks: 'Someone hands you a "free" CD, then demands $20 for "their music."',
        howToAvoid: 'Never take anything handed to you. Say "no thanks" and keep walking.',
      },
      {
        name: 'Fake charity petitions',
        howItWorks: 'Clipboard crews ask for signatures, then pressure for donations.',
        howToAvoid: 'Real charities don\'t aggressively solicit. Walk past.',
      },
      {
        name: 'Times Square character photo traps',
        howItWorks: 'Elmo and Spider-Man demand tips after you take a photo. They\'ll get aggressive.',
        howToAvoid: 'Don\'t take photos with them. Or negotiate the tip beforehand.',
      },
    ],
    timeItRight: [
      {
        activity: 'Walk the High Line',
        bestTime: 'Weekday, 7–9am',
        why: 'Empty. Serene. You\'ll have the best views to yourself. After 10am it\'s a zoo.',
      },
      {
        activity: 'Visit the Met',
        bestTime: 'Friday or Saturday evening (open until 9pm)',
        why: 'Fewer crowds. The roof garden is open in summer. Magical at dusk.',
      },
      {
        activity: 'Eat in Chinatown',
        bestTime: 'Weekday lunch',
        why: 'No lines at dim sum spots. Cheaper. More authentic.',
      },
    ],
    phrases: [
      {
        phrase: 'I\'m walking here',
        pronunciation: 'eye\'m WOK-ing here',
        meaning: 'Move. Now.',
        whenToUse: 'When someone blocks your path. Classic NYC. Use sparingly.',
      },
      {
        phrase: 'What do you want on it?',
        pronunciation: 'wut do you WONT on it',
        meaning: 'Toppings for your sandwich or bagel',
        whenToUse: 'Bodega or deli. "Everything" means sesame, poppy, garlic, salt, onion.',
      },
      {
        phrase: 'Bodega',
        pronunciation: 'bo-DAY-gah',
        meaning: 'Corner store with deli, lottery, and attitude',
        whenToUse: 'Where you get coffee, a chopped cheese, and life advice at 2am.',
      },
      {
        phrase: 'The usual',
        pronunciation: 'the YOO-zhoo-ul',
        meaning: 'Your regular order',
        whenToUse: 'When the bodega guy knows your order. Peak local.',
      },
      {
        phrase: 'I\'ll have a regular',
        pronunciation: 'eye\'ll hav a REG-yoo-ler',
        meaning: 'Regular coffee — milk and sugar',
        whenToUse: 'NYC coffee order. "Regular" = milk + 2 sugars. "Black" = no milk.',
      },
    ],
  },

  Barcelona: {
    localRules: [
      { rule: 'Dinner starts at 9pm or later. Anything before 8pm is for tourists' },
      { rule: 'Don\'t eat on La Rambla — overpriced and mediocre. One block over is real Barcelona' },
      { rule: 'Tipping is optional; rounding up or 5–10% is plenty' },
      { rule: 'Pickpockets are serious. Phone in front pocket. Bag in front. Always' },
      { rule: 'Catalan is co-official. "Gràcies" (thank you) goes further than "gracias" in some places' },
    ],
    neighborhoods: [
      {
        name: 'Poble Sec',
        vibe: 'Quiet, local, incredible tapas — the anti-Gothic Quarter',
        localFavorite: 'Quimet & Quimet for montaditos and vermouth',
        avoidInstead: 'La Rambla (pickpockets, overpriced, zero soul)',
      },
      {
        name: 'Gràcia',
        vibe: 'Village vibe in the city — squares, terrazas, and young families',
        localFavorite: 'Plaça del Sol for evening drinks — locals only',
        avoidInstead: 'Sagrada Familia area restaurants (tourist menus, bad paella)',
      },
      {
        name: 'El Born',
        vibe: 'Medieval streets, boutiques, and the best vermouth bars',
        localFavorite: 'Bar del Pla for tapas and natural wine',
        avoidInstead: 'Gothic Quarter late at night (drunk tourists, overpriced)',
      },
      {
        name: 'Sant Antoni',
        vibe: 'Market, vintage shops, and the new food scene',
        localFavorite: 'Mercat de Sant Antoni on Sunday for the outdoor book market',
        avoidInstead: 'Barceloneta beach restaurants (frozen paella, €15 sangria)',
      },
    ],
    realFood: [
      {
        dish: 'Vermouth and olives',
        where: 'Casa Mariol, Bodega Vidrio, or any "bodega" with barrels',
        priceRange: '€2–4',
        localTip: 'Sunday ritual. Vermut, olives, maybe a boquerón. Do it like a local.',
      },
      {
        dish: 'Pa amb tomàquet',
        where: 'Any proper Catalan restaurant — bread, tomato, olive oil, salt',
        priceRange: '€2–4',
        localTip: 'The foundation of Catalan cuisine. Rub tomato on bread. Add oil. Perfect.',
      },
      {
        dish: 'Bombas (potato croquettes)',
        where: 'La Cova Fumada (Barceloneta) — no sign, find the crowd',
        priceRange: '€1.50 each',
        localTip: 'The original. Get two. They\'re small and perfect.',
      },
      {
        dish: 'Calçots (in season Jan–Mar)',
        where: 'Calçotadas in the countryside or Masia Can Borrell',
        priceRange: '€20–35',
        localTip: 'Grilled green onions with romesco. Wear a bib. It\'s messy. Worth it.',
      },
      {
        dish: 'Churros con chocolate',
        where: 'Granja M. Viader (Raval) or Xurreria Trebol',
        priceRange: '€3–5',
        localTip: 'Thick Spanish chocolate, not watery. Dip. Repeat. Breakfast of champions.',
      },
    ],
    scams: [
      {
        name: 'Pickpockets on the metro',
        howItWorks: 'Teams distract you (asking for directions, bumping) while another takes your phone or wallet.',
        howToAvoid: 'Phone in front pocket. Bag in front. Never put anything in back pocket. Stay alert at doors.',
      },
      {
        name: 'Fake petition / survey',
        howItWorks: 'Someone holds a clipboard while another lifts your bag. Very organized.',
        howToAvoid: 'Never stop. Say "no gràcies" and keep walking. Hands on bag.',
      },
      {
        name: 'Restaurant menu switch',
        howItWorks: 'You order from one menu, get charged from a different "tourist" menu with higher prices.',
        howToAvoid: 'Take a photo of the menu when you order. Check the bill before paying.',
      },
    ],
    timeItRight: [
      {
        activity: 'Park Güell',
        bestTime: 'Opening (8am) or last slot before close',
        why: 'The free part is always open. The paid part is empty at the edges of the day.',
      },
      {
        activity: 'La Boqueria market',
        bestTime: 'Before 10am on a weekday',
        why: 'By noon it\'s a tourist crush. Early = locals shopping, space to breathe.',
      },
      {
        activity: 'Beach at Barceloneta',
        bestTime: 'Weekday morning or sunset',
        why: 'Weekend afternoons are packed. Morning swim or sunset beer is the move.',
      },
    ],
    phrases: [
      {
        phrase: 'Un vermut, si us plau',
        pronunciation: 'oon ver-MOOT, see oos plow',
        meaning: 'A vermouth, please',
        whenToUse: 'Sunday ritual. Order this at a bodega and you\'re in.',
      },
      {
        phrase: 'Gràcies',
        pronunciation: 'GRAH-syess',
        meaning: 'Thank you (Catalan)',
        whenToUse: 'Use in Barcelona — locals appreciate it over "gracias."',
      },
      {
        phrase: 'La cuenta, por favor',
        pronunciation: 'lah KWEN-tah, por fah-VOR',
        meaning: 'The check, please',
        whenToUse: 'Spanish works. But "el compte, si us plau" in Catalan is next level.',
      },
      {
        phrase: 'Molt bé',
        pronunciation: 'molt beh',
        meaning: 'Very good / great',
        whenToUse: 'Catalan for "muy bien." Use after a good meal or experience.',
      },
      {
        phrase: 'Sóc vegetarià/ana',
        pronunciation: 'sok veh-jeh-tah-ree-AH/ah-nah',
        meaning: 'I\'m vegetarian',
        whenToUse: 'If you don\'t eat meat. Important at tapas spots.',
      },
    ],
  },

  Rome: {
    localRules: [
      { rule: 'Never order cappuccino after 11am — it\'s a breakfast drink. Espresso only after lunch' },
      { rule: 'Don\'t eat near the Trevi Fountain or Spanish Steps — triple the price, half the quality' },
      { rule: 'Lunch is the big meal. Dinner is lighter. Aperitivo (6–8pm) is pre-dinner drinks and snacks' },
      { rule: 'Cover charge (coperto) is legal — usually €1–2 per person. It\'s normal' },
      { rule: 'Reserve dinner. Romans do. Walk-ins at good places often get "no" after 8:30pm' },
    ],
    neighborhoods: [
      {
        name: 'Testaccio',
        vibe: 'Working-class roots, incredible food, zero tourists — where Romans actually eat',
        localFavorite: 'Felice a Testaccio for cacio e pepe, or Mordi e Vai for sandwiches',
        avoidInstead: 'Trastevere main drag (overpriced, tourist menus, bad carbonara)',
      },
      {
        name: 'Pigneto',
        vibe: 'Hip, gritty, street art and aperitivo — Rome\'s Brooklyn',
        localFavorite: 'Necci dal 1924 for aperitivo and people-watching',
        avoidInstead: 'Campo de\' Fiori at night (drunken tourists, overpriced drinks)',
      },
      {
        name: 'Monti',
        vibe: 'Boutiques, wine bars, and cobblestones — tourist-adjacent but still real',
        localFavorite: 'Urbana 47 for creative Roman cuisine',
        avoidInstead: 'Via del Corso (chain stores, no soul)',
      },
      {
        name: 'Garbatella',
        vibe: 'Local, residential, the Rome nobody photographs',
        localFavorite: 'Felicì for pizza and tiramisu',
        avoidInstead: 'Restaurants in the Jewish Ghetto (overpriced, tourist-focused)',
      },
    ],
    realFood: [
      {
        dish: 'Suppli (fried rice balls)',
        where: 'Supplizio (Campo de\' Fiori) or any tavola calda',
        priceRange: '€1.50–2.50',
        localTip: 'The classic is ragù and mozzarella. Eat it hot. The cheese should stretch.',
      },
      {
        dish: 'Cacio e pepe',
        where: 'Felice a Testaccio, Da Enzo, or any trattoria in Testaccio',
        priceRange: '€10–14',
        localTip: 'Only three ingredients: pecorino, pepper, pasta. If they add cream, leave.',
      },
      {
        dish: 'Pizza al taglio',
        where: 'Pizzarium (near Vatican) or Antico Forno Roscioli',
        priceRange: '€3–5 per slice',
        localTip: 'Pay by weight. Point at what you want. Eat standing. Roman style.',
      },
      {
        dish: 'Carbonara',
        where: 'Roscioli, Da Enzo, or Salumeria Roscioli',
        priceRange: '€12–16',
        localTip: 'No cream. Ever. Eggs, guanciale, pecorino, pepper. That\'s it.',
      },
      {
        dish: 'Maritozzo con panna',
        where: 'Regoli (Esquilino) or any pasticceria in the morning',
        priceRange: '€2–3',
        localTip: 'Sweet bun with whipped cream. Roman breakfast. Pair with cappuccino.',
      },
    ],
    scams: [
      {
        name: '"Free" bracelet / rose',
        howItWorks: 'Someone ties a bracelet on your wrist or hands you a rose, then demands €20.',
        howToAvoid: 'Keep your hands in your pockets. Say "no grazie" firmly. Don\'t let them touch you.',
      },
      {
        name: 'Gladiator photo fee',
        howItWorks: 'Guys in costume demand €20+ for a photo you thought was free.',
        howToAvoid: 'Don\'t take photos with them. Or agree on price before — in writing.',
      },
      {
        name: 'Taxi overcharging',
        howItWorks: 'Unlicensed cabs or "fixed" meters charge 2–3x the real fare.',
        howToAvoid: 'Use official white taxis. Use apps (FreeNow, ItTaxi). Agree on fixed fare to airport.',
      },
    ],
    timeItRight: [
      {
        activity: 'Colosseum',
        bestTime: 'First slot (8:30am) or last 2 hours before close',
        why: 'Empty corners for photos. No midday heat. Worth the early alarm.',
      },
      {
        activity: 'Vatican Museums',
        bestTime: 'Friday evening (April–Oct) or Wednesday 8am',
        why: 'Fewer crowds. The Sistine Chapel is almost empty at opening.',
      },
      {
        activity: 'Trevi Fountain',
        bestTime: '6am or midnight',
        why: 'The only times you\'ll have it without 500 people. Go early.',
      },
    ],
    phrases: [
      {
        phrase: 'Un caffè, per favore',
        pronunciation: 'oon kahf-FEH, per fah-VO-reh',
        meaning: 'An espresso, please',
        whenToUse: 'Default coffee. Stand at the bar — it\'s cheaper than sitting.',
      },
      {
        phrase: 'Il conto, per favore',
        pronunciation: 'eel KON-toh, per fah-VO-reh',
        meaning: 'The check, please',
        whenToUse: 'Romans don\'t bring the check until you ask. You\'ll wait forever otherwise.',
      },
      {
        phrase: 'Per me',
        pronunciation: 'per meh',
        meaning: 'For me',
        whenToUse: 'Ordering. "Per me un caffè" = a coffee for me.',
      },
      {
        phrase: 'Da portare via',
        pronunciation: 'dah por-TAH-reh VEE-ah',
        meaning: 'To take away',
        whenToUse: 'If you want coffee or food to go. Otherwise they assume you\'re staying.',
      },
      {
        phrase: 'Alla romana',
        pronunciation: 'AH-lah ro-MAH-nah',
        meaning: 'We split the bill',
        whenToUse: 'At the end of a group meal. Romans split evenly.',
      },
    ],
  },

  London: {
    localRules: [
      { rule: 'Stand on the right on escalators. Left side is for walking. Violators get death stares' },
      { rule: 'Tipping: 10–12.5% at restaurants. Often included as "optional" — check the bill' },
      { rule: 'Don\'t make small talk on the Tube. Just don\'t' },
      { rule: 'Pints at pubs — that\'s the unit. No one says "a beer"' },
      { rule: 'Book restaurants. Walk-ins at good places are rare, especially weekends' },
    ],
    neighborhoods: [
      {
        name: 'Walthamstow',
        vibe: 'Street market, craft breweries, and the longest outdoor market in Europe',
        localFavorite: 'Mother\'s Ruin for cocktails, or God\'s Own Junkyard for neon',
        avoidInstead: 'Leicester Square (chain restaurants, tourist hell)',
      },
      {
        name: 'Peckham',
        vibe: 'Creative, diverse, rooftop bars and Nigerian food',
        localFavorite: 'Bussey Building rooftop or Mr Bao for Taiwanese bao',
        avoidInstead: 'Oxford Street (crowds, chains, no soul)',
      },
      {
        name: 'Hackney Wick',
        vibe: 'Industrial canals, street art, and warehouse parties',
        localFavorite: 'Crate Brewery for pizza and beer by the canal',
        avoidInstead: 'Camden Market (tourist trap, overpriced food)',
      },
      {
        name: 'Brixton',
        vibe: 'Caribbean roots, live music, and incredible markets',
        localFavorite: 'Brixton Market for jerk chicken and vinyl',
        avoidInstead: 'Piccadilly Circus (nothing but crowds and chain stores)',
      },
    ],
    realFood: [
      {
        dish: 'Full English',
        where: 'The Fryer\'s Delight (Holborn) or E. Pellicci (Bethnal Green)',
        priceRange: '£8–12',
        localTip: 'Black pudding optional. Hash browns essential. Tea included.',
      },
      {
        dish: 'Pie and mash',
        where: 'G. Kelly (Bethnal Green) or M. Manze (Peckham)',
        priceRange: '£6–10',
        localTip: 'Liquor (parsley sauce) or gravy. Add jellied eels if you\'re brave.',
      },
      {
        dish: 'Curry on Brick Lane',
        where: 'Tayyabs (Whitechapel) or Lahore Kebab House — avoid the touts',
        priceRange: '£15–25',
        localTip: 'Ignore the touts. Go to Tayyabs or Lahore Kebab House. Book ahead.',
      },
      {
        dish: 'Dishoom bacon naan',
        where: 'Dishoom (multiple locations) — go for breakfast',
        priceRange: '£6–8',
        localTip: 'The bacon naan is legendary. Go at 9am to skip the queue.',
      },
      {
        dish: 'Sunday roast',
        where: 'The Garrison (Bermondsey) or The Camberwell Arms',
        priceRange: '£18–25',
        localTip: 'Book. Roast beef, Yorkshire pud, roasties. Non-negotiable Sunday ritual.',
      },
    ],
    scams: [
      {
        name: 'Fake charity collectors',
        howItWorks: 'People with clipboards pressure for "donations." Often not registered charities.',
        howToAvoid: 'Only give to registered charities. Check IDs. Say "no thanks" and walk.',
      },
      {
        name: 'Distraction pickpockets',
        howItWorks: 'Someone "accidentally" spills on you while another takes your phone or wallet.',
        howToAvoid: 'Phone in front pocket. Bag zipped. Be alert in crowds (Oxford St, Tube).',
      },
      {
        name: 'Restaurant "service" confusion',
        howItWorks: 'Some add 12.5% service then hope you tip again. Or add "optional" with unclear wording.',
        howToAvoid: 'Check the bill. "Service included" means no need to add. "Optional" = your choice.',
      },
    ],
    timeItRight: [
      {
        activity: 'British Museum',
        bestTime: 'Weekday opening (10am) or Friday late (open until 8:30pm)',
        why: 'The great court is magic when empty. Friday evenings are quieter.',
      },
      {
        activity: 'Borough Market',
        bestTime: 'Wednesday or Thursday, before noon',
        why: 'Saturday is a zoo. Weekdays = space to taste and browse. Lunch there.',
      },
      {
        activity: 'Tower Bridge at sunset',
        bestTime: 'Weekday, 30 min before sunset',
        why: 'Fewer crowds. The light on the Thames is perfect. Free.',
      },
    ],
    phrases: [
      {
        phrase: 'Pint of [lager/bitter/Guinness]',
        pronunciation: 'pint of...',
        meaning: 'A pint of beer',
        whenToUse: 'Pub order. That\'s the unit. "Half" if you want less.',
      },
      {
        phrase: 'Cheers',
        pronunciation: 'cheerz',
        meaning: 'Thanks',
        whenToUse: 'Universal. Use when someone holds a door, brings a drink, anything.',
      },
      {
        phrase: 'Ta',
        pronunciation: 'tah',
        meaning: 'Thanks (casual)',
        whenToUse: 'Shorter than "cheers." Very British.',
      },
      {
        phrase: 'Table for two, please',
        pronunciation: 'TAY-bul for too, pleez',
        meaning: 'Reservation or seating request',
        whenToUse: 'Restaurants. "Booked under [name]" if you have a reservation.',
      },
      {
        phrase: 'Can I get the bill?',
        pronunciation: 'can eye get the bill',
        meaning: 'The check, please',
        whenToUse: 'British say "bill" not "check." They won\'t bring it until you ask.',
      },
    ],
  },

  Marrakech: {
    localRules: [
      { rule: 'Haggle in the souks — start at 30–40% of the asking price. It\'s expected' },
      { rule: 'Dress modestly. Shoulders and knees covered in the medina' },
      { rule: 'Never follow "guides" who approach you. They want commission, not to help' },
      { rule: 'Tap water is not safe. Stick to bottled. Even for brushing teeth' },
      { rule: 'Mint tea is offered everywhere. Accept it — refusing can offend' },
    ],
    neighborhoods: [
      {
        name: 'Gueliz',
        vibe: 'The "new" city — French colonial, cafes, and a break from the medina',
        localFavorite: 'Le Jardin for lunch in a green oasis',
        avoidInstead: 'Jemaa el-Fnaa restaurants (overpriced, tourist menus)',
      },
      {
        name: 'Kasbah',
        vibe: 'Quieter medina — royal palace, local life, fewer touts',
        localFavorite: 'El Fenn rooftop for sunset cocktails',
        avoidInstead: 'Main square henna ladies (aggressive, overpriced, sometimes harmful dye)',
      },
      {
        name: 'Mellah',
        vibe: 'The old Jewish quarter — spice shops and a different side of the medina',
        localFavorite: 'Spice markets and hidden courtyards',
        avoidInstead: 'Argan oil "cooperatives" (long sales pitch, overpriced)',
      },
      {
        name: 'Hivernage',
        vibe: 'Upscale hotels and gardens — where to escape the chaos',
        localFavorite: 'Jardins de la Koutoubia for a peaceful stroll',
        avoidInstead: 'Souks with "fixed" prices — they\'re usually 3x what you should pay',
      },
    ],
    realFood: [
      {
        dish: 'Tagine',
        where: 'Café des Épices, Nomad, or any riad kitchen',
        priceRange: '80–150 MAD',
        localTip: 'Lamb with prunes is classic. Chicken with preserved lemon. Eat with bread.',
      },
      {
        dish: 'Mechoui (whole lamb)',
        where: 'Chez Lamine near Place Jemaa el-Fnaa',
        priceRange: '100–150 MAD',
        localTip: 'The whole lamb is buried in a pit. Tender, smoky. Go for lunch.',
      },
      {
        dish: 'Fresh orange juice',
        where: 'Jemaa el-Fnaa juice stalls — but haggle or agree price first',
        priceRange: '5–10 MAD',
        localTip: 'Best orange juice you\'ll ever have. Negotiate before they squeeze.',
      },
      {
        dish: 'Harira (soup)',
        where: 'Any local spot at dusk during Ramadan — or year-round at cafe',
        priceRange: '10–20 MAD',
        localTip: 'Traditional soup. Break fast with it. Filling and cheap.',
      },
      {
        dish: 'Msemen (flatbread)',
        where: 'Breakfast at your riad or Cafe Clock',
        priceRange: '15–30 MAD',
        localTip: 'Flaky, buttery, with honey. Perfect with mint tea.',
      },
    ],
    scams: [
      {
        name: '"The way is closed"',
        howItWorks: 'Someone says your route is closed, offers to "help" — leads to a shop for commission.',
        howToAvoid: 'Politely decline. The way is rarely closed. Use GPS. Ignore "guides."',
      },
      {
        name: 'Henna allergy scam',
        howItWorks: 'Black henna (not natural) can cause severe allergic reactions. Some use harmful chemicals.',
        howToAvoid: 'Only use natural brown/red henna. Ask "natural henna?" Refuse black.',
      },
      {
        name: 'Fake antiques',
        howItWorks: 'Vendors sell "antique" items that are new. Prices are 10x real value.',
        howToAvoid: 'Assume nothing is antique. Haggle hard. If you love it, pay what you\'re comfortable with.',
      },
    ],
    timeItRight: [
      {
        activity: 'Jemaa el-Fnaa square',
        bestTime: 'Sunset',
        why: 'The square transforms at dusk — snake charmers, food stalls, storytellers. Magical.',
      },
      {
        activity: 'Jardin Majorelle',
        bestTime: 'Opening (8am) or last hour',
        why: 'Midday is packed and hot. Early or late = space and better light for photos.',
      },
      {
        activity: 'Souks',
        bestTime: 'Morning, before 11am',
        why: 'Cooler, fewer people. Vendors are fresher. Haggle when you\'re not exhausted.',
      },
    ],
    phrases: [
      {
        phrase: "B'ssaha",
        pronunciation: 'buh-SAH-hah',
        meaning: 'Cheers / To your health (before drinking)',
        whenToUse: 'Say before sipping mint tea. Locals will smile.',
      },
      {
        phrase: 'Shukran',
        pronunciation: 'shook-RAN',
        meaning: 'Thank you',
        whenToUse: 'Arabic. Works everywhere. "Shukran bezaf" = thank you very much.',
      },
      {
        phrase: "B'ssaf?",
        pronunciation: 'buh-SAF',
        meaning: 'How much?',
        whenToUse: 'In the souks. Point at the item. Then haggle.',
      },
      {
        phrase: 'La shukran',
        pronunciation: 'lah shook-RAN',
        meaning: 'No thank you',
        whenToUse: 'Politely declining touts, vendors, guides. Firm but polite.',
      },
      {
        phrase: 'Insha\'Allah',
        pronunciation: 'in-SHAH-ah-LAH',
        meaning: 'God willing / Maybe',
        whenToUse: 'When something might happen. "See you tomorrow?" "Insha\'Allah."',
      },
    ],
  },

  'Mexico City': {
    localRules: [
      { rule: 'Tacos are eaten with one hand. Use the double tortilla to your advantage.' },
      { rule: 'Don\'t drink the tap water — even for brushing teeth. Buy garrafones (big jugs) like locals do.' },
      { rule: 'Uber is safer and easier than street taxis, especially at night' },
      { rule: 'Propina (tip) 10-15% at sit-down restaurants. Always tip taco stands a few pesos.' },
      { rule: 'Sunday is family day — museums are free and Chapultepec is packed' },
    ],
    neighborhoods: [
      {
        name: 'Roma Norte',
        vibe: 'Art Deco buildings, mezcalerias, and the best food scene in Latin America',
        localFavorite: 'Mercado Roma for everything from craft tacos to natural wine',
        avoidInstead: 'Zona Rosa (dated, touristy, mostly chain restaurants)',
      },
      {
        name: 'Coyoacan',
        vibe: 'Colonial streets, street performers, and the spirit of Frida Kahlo',
        localFavorite: 'Mercado de Coyoacan for tostadas and pulque',
        avoidInstead: 'Frida Kahlo Museum without tickets (line is 2+ hours, book online weeks ahead)',
      },
      {
        name: 'Juarez',
        vibe: 'Roma\'s quieter, cooler sibling — rooftop bars and Korean-Mexican fusion',
        localFavorite: 'Departamento for mezcal cocktails in a candlelit apartment',
        avoidInstead: 'Polanco for dining (overpriced hotel restaurants targeting tourists)',
      },
      {
        name: 'San Rafael',
        vibe: 'Up-and-coming with incredible bakeries, theaters, and no tourists',
        localFavorite: 'Panaderia Rosetta for the best guava pastry in the city',
        avoidInstead: 'Historic center tourist restaurants (microwaved enchiladas at 3x the price)',
      },
    ],
    realFood: [
      {
        dish: 'Tacos al pastor from a trompo',
        where: 'Taqueria El Vilsito (a mechanic shop by day, taqueria by night)',
        priceRange: '$0.50-1 per taco',
        localTip: 'The pineapple on top is non-negotiable. If there\'s no trompo (spit), keep walking.',
      },
      {
        dish: 'Tlacoyos at a street stand',
        where: 'Outside any metro station in the morning',
        priceRange: '$0.50-1',
        localTip: 'Blue corn, filled with beans or chicharron, topped with salsa and queso. Perfect breakfast.',
      },
      {
        dish: 'Torta de chilaquiles',
        where: 'Any fonda (home-style restaurant) before noon',
        priceRange: '$2-4',
        localTip: 'Yes, it\'s chilaquiles inside a sandwich. Don\'t question it.',
      },
      {
        dish: 'Esquites (corn in a cup)',
        where: 'Street carts, especially near parks after 5pm',
        priceRange: '$1',
        localTip: 'Get it with all the fixings: mayo, chili, lime, cheese. Add extra lime.',
      },
      {
        dish: 'Mezcal at a mezcaleria, not a bar',
        where: 'Bora Bora in Roma or La Clandestina in Condesa',
        priceRange: '$3-6 per pour',
        localTip: 'Sip, don\'t shoot. Ask for a "jicara" (gourd cup) for the traditional experience.',
      },
    ],
    scams: [
      {
        name: 'Fake police shakedowns',
        howItWorks: 'People posing as (or actual corrupt) police ask to "check your wallet" and pocket cash.',
        howToAvoid: 'Ask for badge numbers, say you\'ll call the tourist police (078). They\'ll usually leave.',
      },
      {
        name: 'Taxi meter manipulation',
        howItWorks: 'Drivers use rigged meters or take long routes. Street hails are the worst.',
        howToAvoid: 'Always use Uber, Didi, or sitio taxis (dispatched from a stand). Never hail on the street at night.',
      },
      {
        name: 'ATM card skimmers',
        howItWorks: 'Modified ATMs copy your card. Common at convenience store ATMs.',
        howToAvoid: 'Only use ATMs inside banks during business hours. Cover the keypad.',
      },
    ],
    timeItRight: [
      {
        activity: 'Visit the Anthropology Museum',
        bestTime: 'Tuesday-Thursday, right at 9am opening',
        why: 'It\'s the most visited museum in Mexico. Weekends are chaos. Go when it opens.',
      },
      {
        activity: 'Eat tacos al pastor',
        bestTime: 'After 9pm',
        why: 'The trompo needs hours to cook properly. Night tacos are always better.',
      },
      {
        activity: 'Walk through Chapultepec Park',
        bestTime: 'Weekday morning, before 10am',
        why: 'Sunday the entire city is there. Weekday mornings are peaceful and green.',
      },
    ],
    phrases: [
      {
        phrase: 'Que onda',
        pronunciation: 'keh ON-dah',
        meaning: 'What\'s up / What\'s going on',
        whenToUse: 'Casual greeting with anyone your age. Way more natural than "hola."',
      },
      {
        phrase: 'No manches',
        pronunciation: 'no MAHN-chez',
        meaning: 'No way / You\'re kidding',
        whenToUse: 'Expressing surprise or disbelief. The polite version of something stronger.',
      },
      {
        phrase: 'La neta',
        pronunciation: 'lah NEH-tah',
        meaning: 'The truth / For real',
        whenToUse: '"La neta, these tacos are the best." Use it to emphasize honesty.',
      },
      {
        phrase: 'Me da un/una... por favor',
        pronunciation: 'meh dah oon/OO-nah... por fah-VOR',
        meaning: 'Can I have a... please',
        whenToUse: 'Ordering anything. More natural than "quiero" (I want).',
      },
      {
        phrase: 'Provecho',
        pronunciation: 'pro-VEH-cho',
        meaning: 'Enjoy your meal (said to others)',
        whenToUse: 'Walking past someone eating, or when food arrives at the table. Always.',
      },
    ],
  },
};

// =============================================================================
// Animated section wrapper
// =============================================================================
function FadeInSection({
  children,
  delay,
}: {
  children: React.ReactNode;
  delay: number;
}) {
  const opacity = useRef(new Animated.Value(0)).current;
  const translateY = useRef(new Animated.Value(24)).current;

  useEffect(() => {
    Animated.parallel([
      Animated.timing(opacity, {
        toValue: 1,
        duration: 500,
        delay,
        useNativeDriver: true,
      }),
      Animated.timing(translateY, {
        toValue: 0,
        duration: 500,
        delay,
        useNativeDriver: true,
      }),
    ]).start();
  }, [delay, opacity, translateY]);

  return (
    <Animated.View style={{ opacity, transform: [{ translateY }] }}>
      {children}
    </Animated.View>
  );
}

// =============================================================================
// Expandable neighborhood card
// =============================================================================
function NeighborhoodCard({ item }: { item: Neighborhood }) {
  const [expanded, setExpanded] = useState(false);
  const animHeight = useRef(new Animated.Value(0)).current;

  const toggle = () => {
    Animated.timing(animHeight, {
      toValue: expanded ? 0 : 1,
      duration: 300,
      useNativeDriver: false,
    }).start();
    setExpanded(!expanded);
  };

  const expandedHeight = animHeight.interpolate({
    inputRange: [0, 1],
    outputRange: [0, 72],
  });

  const chevronRotation = animHeight.interpolate({
    inputRange: [0, 1],
    outputRange: ['0deg', '180deg'],
  });

  return (
    <Pressable onPress={toggle} style={styles.glassCard}>
      <View style={styles.neighborhoodHeader}>
        <View style={{ flex: 1 }}>
          <Text style={styles.neighborhoodName}>{item.name}</Text>
          <Text style={styles.neighborhoodVibe}>{item.vibe}</Text>
        </View>
        <Animated.Text
          style={[
            styles.chevron,
            { transform: [{ rotate: chevronRotation }] },
          ]}
        >
          {'\u25BE'}
        </Animated.Text>
      </View>
      <Text style={styles.localFavoriteLabel}>LOCAL FAVORITE</Text>
      <Text style={styles.localFavoriteText}>{item.localFavorite}</Text>
      <Animated.View
        style={[styles.avoidSection, { maxHeight: expandedHeight, opacity: animHeight }]}
      >
        <Text style={styles.avoidLabel}>SKIP INSTEAD</Text>
        <Text style={styles.avoidText}>{item.avoidInstead}</Text>
      </Animated.View>
    </Pressable>
  );
}

// =============================================================================
// Main screen
// =============================================================================
function LocalLensScreen() {
  const params = useLocalSearchParams<{ destination: string }>();
  const insets = useSafeAreaInsets();
  const router = useRouter();
  const city = validateDestination(params.destination) ?? '';
  const data = LOCAL_DATA[city] ?? null;
  const destTheme = useDestinationTheme(city);

  return (
    <View style={[styles.container, { paddingTop: insets.top }]}>
      <LinearGradient
        colors={[COLORS.bg, COLORS.gradientForestDark, COLORS.bg]}
        style={StyleSheet.absoluteFill}
      />

      {/* Header */}
      <View style={styles.header}>
        <Pressable onPress={() => router.back()} style={[styles.backButton, { backgroundColor: `${destTheme.primary}20` }]}>
          <ChevronLeft size={24} color={COLORS.cream} />
        </Pressable>
        <View style={styles.headerTextContainer}>
          <Text style={[styles.headerLabel, { color: destTheme.primary }]}>· Local lens</Text>
          <Text style={styles.headerCity}>{city || 'Unknown'}</Text>
        </View>
      </View>

      <ScrollView
        contentContainerStyle={[
          styles.scrollContent,
          { paddingBottom: insets.bottom + SPACING.xxl },
        ]}
        showsVerticalScrollIndicator={false}
      >
        {/* Tagline */}
        <FadeInSection delay={0}>
          <Text style={styles.tagline}>
            See {city || 'this city'} through the eyes of people who actually live there.
          </Text>
        </FadeInSection>

        {!data ? (
          /* Fallback for unsupported cities */
          <FadeInSection delay={100}>
            <View style={styles.fallbackCard}>
              <Text style={styles.fallbackTitle}>Local intel coming soon</Text>
              <Text style={styles.fallbackText}>
                Local intel coming soon for {city || 'this destination'}. Want it faster?
                Let us know.
              </Text>
            </View>
          </FadeInSection>
        ) : (
          <>
            {/* ---- Local Rules ---- */}
            <FadeInSection delay={100}>
              <Text style={styles.sectionLabel}>· Local rules</Text>
              <Text style={styles.sectionSubtitle}>
                Things locals know that tourists don't
              </Text>
              {data.localRules.map((r, i) => (
                <View key={i} style={styles.glassCard}>
                  <View style={styles.ruleRow}>
                    <View style={styles.ruleNumberBadge}>
                      <Text style={styles.ruleNumber}>{i + 1}</Text>
                    </View>
                    <Text style={styles.ruleText}>{r.rule}</Text>
                  </View>
                </View>
              ))}
            </FadeInSection>

            {/* ---- Neighborhoods ---- */}
            <FadeInSection delay={200}>
              <Text style={styles.sectionLabel}>· Neighborhoods to visit</Text>
              <Text style={styles.sectionSubtitle}>
                The real spots, not the tourist traps
              </Text>
              {data.neighborhoods.map((n, i) => (
                <NeighborhoodCard key={i} item={n} />
              ))}
            </FadeInSection>

            {/* ---- Real Food ---- */}
            <FadeInSection delay={300}>
              <Text style={styles.sectionLabel}>· The real food</Text>
              <Text style={styles.sectionSubtitle}>
                What locals actually eat, not what's on TripAdvisor
              </Text>
              {data.realFood.map((f, i) => (
                <View key={i} style={styles.glassCard}>
                  <View style={styles.foodHeaderRow}>
                    <Text style={styles.foodDish}>{f.dish}</Text>
                    <View style={styles.priceBadge}>
                      <Text style={styles.priceText}>{f.priceRange}</Text>
                    </View>
                  </View>
                  <Text style={styles.foodWhere}>{f.where}</Text>
                  <View style={styles.tipRow}>
                    <Text style={styles.tipLabel}>TIP</Text>
                    <Text style={styles.tipText}>{f.localTip}</Text>
                  </View>
                </View>
              ))}
            </FadeInSection>

            {/* ---- Scams & Traps ---- */}
            <FadeInSection delay={400}>
              <Text style={styles.sectionLabel}>· Scams & traps</Text>
              <Text style={styles.sectionSubtitle}>
                What to watch out for
              </Text>
              {data.scams.map((s, i) => (
                <View key={i} style={styles.scamCard}>
                  <Text style={styles.scamName}>{s.name}</Text>
                  <Text style={styles.scamHow}>{s.howItWorks}</Text>
                  <View style={styles.scamAvoidRow}>
                    <Text style={styles.scamAvoidLabel}>HOW TO AVOID</Text>
                    <Text style={styles.scamAvoidText}>{s.howToAvoid}</Text>
                  </View>
                </View>
              ))}
            </FadeInSection>

            {/* ---- Time It Right ---- */}
            <FadeInSection delay={500}>
              <Text style={styles.sectionLabel}>· Time it right</Text>
              <Text style={styles.sectionSubtitle}>
                Best times locals know about
              </Text>
              {data.timeItRight.map((t, i) => (
                <View key={i} style={styles.glassCard}>
                  <Text style={styles.timeActivity}>{t.activity}</Text>
                  <View style={styles.timeBadgeRow}>
                    <View style={styles.timeBadge}>
                      <Text style={styles.timeBadgeText}>{t.bestTime}</Text>
                    </View>
                  </View>
                  <Text style={styles.timeWhy}>{t.why}</Text>
                </View>
              ))}
            </FadeInSection>

            {/* ---- Local Phrases ---- */}
            <FadeInSection delay={600}>
              <Text style={styles.sectionLabel}>· Local phrase book</Text>
              <Text style={styles.sectionSubtitle}>
                Essential phrases beyond "hello" and "thank you"
              </Text>
              {data.phrases.map((p, i) => (
                <View key={i} style={styles.glassCard}>
                  <Text style={styles.phraseText}>{p.phrase}</Text>
                  <Text style={styles.phrasePronunciation}>{p.pronunciation}</Text>
                  <Text style={styles.phraseMeaning}>{p.meaning}</Text>
                  <View style={styles.phraseWhenRow}>
                    <Text style={styles.phraseWhenLabel}>WHEN</Text>
                    <Text style={styles.phraseWhenText}>{p.whenToUse}</Text>
                  </View>
                </View>
              ))}
            </FadeInSection>
          </>
        )}
      </ScrollView>
    </View>
  );
}

// =============================================================================
// Styles
// =============================================================================
const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: COLORS.bg,
  } as ViewStyle,

  // — Header --
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: SPACING.lg,
    paddingVertical: SPACING.md,
  } as ViewStyle,
  backButton: {
    width: 40,
    height: 40,
    borderRadius: RADIUS.full,
    backgroundColor: COLORS.bgGlass,
    alignItems: 'center',
    justifyContent: 'center',
    marginRight: SPACING.md,
  } as ViewStyle,
  headerTextContainer: {
    flex: 1,
  } as ViewStyle,
  headerLabel: {
    fontFamily: FONTS.body,
    fontSize: 13,
    color: COLORS.creamSoft,
    marginBottom: 2,
  } as TextStyle,
  headerCity: {
    fontFamily: FONTS.header,
    fontSize: 28,
    color: COLORS.cream,
  } as TextStyle,

  // — Scroll --
  scrollContent: {
    paddingHorizontal: SPACING.lg,
    paddingTop: SPACING.sm,
  } as ViewStyle,

  // — Tagline --
  tagline: {
    fontFamily: FONTS.headerMedium,
    fontSize: 18,
    color: COLORS.creamMuted,
    lineHeight: 26,
    marginBottom: SPACING.xl,
  } as TextStyle,

  // — Section labels --
  sectionLabel: {
    fontFamily: FONTS.body,
    fontSize: 13,
    color: COLORS.creamSoft,
    marginTop: SPACING.xl,
    marginBottom: SPACING.xs,
  } as TextStyle,
  sectionSubtitle: {
    fontFamily: FONTS.body,
    fontSize: 14,
    color: COLORS.creamMuted,
    marginBottom: SPACING.md,
    lineHeight: 20,
  } as TextStyle,

  // — Glass card base --
  glassCard: {
    backgroundColor: COLORS.bgGlass,
    borderWidth: 1,
    borderColor: COLORS.border,
    borderRadius: RADIUS.lg,
    padding: SPACING.md,
    marginBottom: SPACING.sm,
  } as ViewStyle,

  // — Local Rules --
  ruleRow: {
    flexDirection: 'row',
    alignItems: 'flex-start',
  } as ViewStyle,
  ruleNumberBadge: {
    width: 28,
    height: 28,
    borderRadius: RADIUS.full,
    backgroundColor: COLORS.sageHighlight,
    alignItems: 'center',
    justifyContent: 'center',
    marginRight: SPACING.sm,
    flexShrink: 0,
  } as ViewStyle,
  ruleNumber: {
    fontFamily: FONTS.monoMedium,
    fontSize: 13,
    color: COLORS.sage,
  } as TextStyle,
  ruleText: {
    fontFamily: FONTS.body,
    fontSize: 15,
    color: COLORS.cream,
    lineHeight: 22,
    flex: 1,
  } as TextStyle,

  // — Neighborhoods --
  neighborhoodHeader: {
    flexDirection: 'row',
    alignItems: 'flex-start',
    justifyContent: 'space-between',
  } as ViewStyle,
  neighborhoodName: {
    fontFamily: FONTS.bodySemiBold,
    fontSize: 16,
    color: COLORS.cream,
    marginBottom: 4,
  } as TextStyle,
  neighborhoodVibe: {
    fontFamily: FONTS.body,
    fontSize: 13,
    color: COLORS.creamMuted,
    lineHeight: 19,
    marginBottom: SPACING.sm,
  } as TextStyle,
  chevron: {
    fontSize: 18,
    color: COLORS.sage,
    marginLeft: SPACING.sm,
    marginTop: 2,
  } as TextStyle,
  localFavoriteLabel: {
    fontFamily: FONTS.mono,
    fontSize: 10,
    color: COLORS.sage,
    letterSpacing: 1.5,
    marginBottom: 4,
  } as TextStyle,
  localFavoriteText: {
    fontFamily: FONTS.body,
    fontSize: 14,
    color: COLORS.cream,
    lineHeight: 20,
  } as TextStyle,
  avoidSection: {
    overflow: 'hidden',
    marginTop: SPACING.sm,
  } as ViewStyle,
  avoidLabel: {
    fontFamily: FONTS.mono,
    fontSize: 10,
    color: COLORS.coral,
    letterSpacing: 1.5,
    marginBottom: 4,
  } as TextStyle,
  avoidText: {
    fontFamily: FONTS.body,
    fontSize: 13,
    color: COLORS.creamSoft,
    lineHeight: 19,
  } as TextStyle,

  // — Real Food --
  foodHeaderRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    marginBottom: 6,
  } as ViewStyle,
  foodDish: {
    fontFamily: FONTS.bodySemiBold,
    fontSize: 15,
    color: COLORS.cream,
    flex: 1,
    marginRight: SPACING.sm,
  } as TextStyle,
  priceBadge: {
    backgroundColor: COLORS.goldHighlight,
    borderRadius: RADIUS.full,
    paddingHorizontal: SPACING.sm,
    paddingVertical: 3,
  } as ViewStyle,
  priceText: {
    fontFamily: FONTS.monoMedium,
    fontSize: 11,
    color: COLORS.gold,
  } as TextStyle,
  foodWhere: {
    fontFamily: FONTS.body,
    fontSize: 13,
    color: COLORS.creamMuted,
    lineHeight: 19,
    marginBottom: SPACING.sm,
  } as TextStyle,
  tipRow: {
    flexDirection: 'row',
    alignItems: 'flex-start',
    backgroundColor: COLORS.sageFaint,
    borderRadius: RADIUS.sm,
    padding: SPACING.sm,
  } as ViewStyle,
  tipLabel: {
    fontFamily: FONTS.mono,
    fontSize: 10,
    color: COLORS.sage,
    letterSpacing: 1.5,
    marginRight: SPACING.sm,
    marginTop: 2,
  } as TextStyle,
  tipText: {
    fontFamily: FONTS.body,
    fontSize: 13,
    color: COLORS.cream,
    lineHeight: 19,
    flex: 1,
  } as TextStyle,

  // — Scams --
  scamCard: {
    backgroundColor: COLORS.dangerDim,
    borderWidth: 1,
    borderColor: COLORS.dangerFaintBorder,
    borderRadius: RADIUS.lg,
    padding: SPACING.md,
    marginBottom: SPACING.sm,
  } as ViewStyle,
  scamName: {
    fontFamily: FONTS.bodySemiBold,
    fontSize: 15,
    color: COLORS.cream,
    marginBottom: 6,
  } as TextStyle,
  scamHow: {
    fontFamily: FONTS.body,
    fontSize: 13,
    color: COLORS.creamMuted,
    lineHeight: 19,
    marginBottom: SPACING.sm,
  } as TextStyle,
  scamAvoidRow: {
    backgroundColor: COLORS.sageSubtle,
    borderRadius: RADIUS.sm,
    padding: SPACING.sm,
  } as ViewStyle,
  scamAvoidLabel: {
    fontFamily: FONTS.mono,
    fontSize: 10,
    color: COLORS.sage,
    letterSpacing: 1.5,
    marginBottom: 4,
  } as TextStyle,
  scamAvoidText: {
    fontFamily: FONTS.body,
    fontSize: 13,
    color: COLORS.cream,
    lineHeight: 19,
  } as TextStyle,

  // — Time It Right --
  timeActivity: {
    fontFamily: FONTS.bodySemiBold,
    fontSize: 15,
    color: COLORS.cream,
    marginBottom: SPACING.xs,
  } as TextStyle,
  timeBadgeRow: {
    flexDirection: 'row',
    marginBottom: SPACING.xs,
  } as ViewStyle,
  timeBadge: {
    backgroundColor: COLORS.sageHighlight,
    borderRadius: RADIUS.full,
    paddingHorizontal: SPACING.sm + 2,
    paddingVertical: 4,
  } as ViewStyle,
  timeBadgeText: {
    fontFamily: FONTS.monoMedium,
    fontSize: 12,
    color: COLORS.sage,
  } as TextStyle,
  timeWhy: {
    fontFamily: FONTS.body,
    fontSize: 13,
    color: COLORS.creamMuted,
    lineHeight: 19,
  } as TextStyle,

  // — Phrases --
  phraseText: {
    fontFamily: FONTS.bodySemiBold,
    fontSize: 17,
    color: COLORS.cream,
    marginBottom: 4,
  } as TextStyle,
  phrasePronunciation: {
    fontFamily: FONTS.mono,
    fontSize: 13,
    color: COLORS.sage,
    marginBottom: 6,
  } as TextStyle,
  phraseMeaning: {
    fontFamily: FONTS.body,
    fontSize: 14,
    color: COLORS.cream,
    lineHeight: 20,
    marginBottom: SPACING.sm,
  } as TextStyle,
  phraseWhenRow: {
    backgroundColor: COLORS.sageFaint,
    borderRadius: RADIUS.sm,
    padding: SPACING.sm,
  } as ViewStyle,
  phraseWhenLabel: {
    fontFamily: FONTS.mono,
    fontSize: 10,
    color: COLORS.gold,
    letterSpacing: 1.5,
    marginBottom: 4,
  } as TextStyle,
  phraseWhenText: {
    fontFamily: FONTS.body,
    fontSize: 13,
    color: COLORS.creamMuted,
    lineHeight: 19,
  } as TextStyle,

  // — Fallback --
  fallbackCard: {
    backgroundColor: COLORS.bgGlass,
    borderWidth: 1,
    borderColor: COLORS.border,
    borderRadius: RADIUS.lg,
    padding: SPACING.xl,
    alignItems: 'center',
    marginTop: SPACING.xl,
  } as ViewStyle,
  fallbackTitle: {
    fontFamily: FONTS.header,
    fontSize: 22,
    color: COLORS.cream,
    marginBottom: SPACING.sm,
    textAlign: 'center',
  } as TextStyle,
  fallbackText: {
    fontFamily: FONTS.body,
    fontSize: 15,
    color: COLORS.creamMuted,
    textAlign: 'center',
    lineHeight: 22,
  } as TextStyle,
});

export default withComingSoon(LocalLensScreen, { routeName: 'local-lens', title: 'Local Lens' });
