// =============================================================================
// ROAM — Honest Reviews
// The anti-tourist-trap engine. Brutally honest reviews of popular attractions
// so travelers know what's actually worth their time.
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
import * as Haptics from '../lib/haptics';
import { ChevronLeft } from 'lucide-react-native';
import { COLORS, FONTS, SPACING, RADIUS } from '../lib/constants';
import { useDestinationTheme } from '../lib/useDestinationTheme';
import { withComingSoon } from '../lib/with-coming-soon';
import { useTranslation } from 'react-i18next';
import { validateDestination } from '../lib/params-validator';

// =============================================================================
// Types
// =============================================================================
type Verdict = 'WORTH IT' | 'SKIP IT' | 'MIXED';
type CrowdLevel = 'Empty' | 'Manageable' | 'Packed' | 'Nightmare';
type FilterOption = 'All' | 'WORTH IT' | 'SKIP IT' | 'MIXED';
type SortOption = 'Default' | 'Best First' | 'Worst First';

interface Attraction {
  name: string;
  rating: Verdict;
  honestTake: string;
  bestAlternative: string;
  bestTime: string;
  cost: string;
  crowdLevel: CrowdLevel;
  insiderTip: string;
  timeNeeded: string;
}

// =============================================================================
// Verdict colors
// =============================================================================
const VERDICT_COLORS: Record<Verdict, string> = {
  'WORTH IT': COLORS.sage,
  'SKIP IT': COLORS.coral,
  'MIXED': COLORS.gold,
};

const CROWD_LEVELS: CrowdLevel[] = ['Empty', 'Manageable', 'Packed', 'Nightmare'];

// =============================================================================
// Hardcoded city data
// =============================================================================
const REVIEWS_DATA: Record<string, Attraction[]> = {
  Tokyo: [
    {
      name: 'Shibuya Crossing',
      rating: 'WORTH IT',
      honestTake: "Yes it's touristy but it genuinely is insane. Stand at the Starbucks window for the best view. Go at night when the neon hits different. Skip the weekday morning — it's just commuters.",
      bestAlternative: '',
      bestTime: 'Friday or Saturday night, 9-11pm',
      cost: 'Free',
      crowdLevel: 'Packed',
      insiderTip: 'The Mag\'s Park rooftop nearby has an even better aerial view and almost nobody knows about it.',
      timeNeeded: '30 min',
    },
    {
      name: 'Robot Restaurant',
      rating: 'SKIP IT',
      honestTake: "Was cool in 2015. Now it's overpriced, gimmicky, and honestly kind of sad. The robots are just women on floats with LED lights. Save your money.",
      bestAlternative: 'Spend that 8,000 yen on a proper izakaya crawl in Golden Gai instead. Way more authentic and you\'ll actually talk to locals.',
      bestTime: '',
      cost: '8,000 yen (~$54)',
      crowdLevel: 'Packed',
      insiderTip: 'If you must go for the meme, book the cheapest ticket and skip their food — it\'s terrible.',
      timeNeeded: '90 min',
    },
    {
      name: 'TeamLab Borderless',
      rating: 'WORTH IT',
      honestTake: 'Genuinely one of the coolest art experiences on the planet. The rooms change constantly so you never see the same thing twice. Book tickets 2 weeks ahead or you\'re not getting in.',
      bestAlternative: '',
      bestTime: 'Weekday, first slot of the day',
      cost: '3,800 yen (~$25)',
      crowdLevel: 'Manageable',
      insiderTip: 'Wear white clothes — the projections look absolutely insane on white fabric. Bring a portable charger for your phone.',
      timeNeeded: '2-3 hours',
    },
    {
      name: 'Tsukiji Outer Market',
      rating: 'MIXED',
      honestTake: "The inner market moved to Toyosu years ago. Outer market is still good for street food breakfast but it's getting touristy fast. Prices have crept up and some stalls are clearly tourist bait now.",
      bestAlternative: 'For actual fresh sushi, go to Toyosu Market instead. Or hit a random conveyor belt sushi in any neighborhood.',
      bestTime: 'Before 8am, Tuesday-Friday',
      cost: '2,000-4,000 yen for breakfast',
      crowdLevel: 'Packed',
      insiderTip: 'Skip the long lines for the famous egg omelettes. Walk two blocks deeper and find the same thing with no wait.',
      timeNeeded: '1-2 hours',
    },
    {
      name: 'Meiji Shrine',
      rating: 'WORTH IT',
      honestTake: "It's a legit peaceful escape in the middle of Shibuya chaos. The forest walk leading up to it is the best part. Free, beautiful, and actually spiritual if you time it right.",
      bestAlternative: '',
      bestTime: 'Early morning, right when it opens',
      cost: 'Free',
      crowdLevel: 'Manageable',
      insiderTip: 'Go on a weekend morning and you might catch a traditional Shinto wedding procession. Don\'t skip the sake barrel wall on the path in.',
      timeNeeded: '1 hour',
    },
    {
      name: 'Akihabara',
      rating: 'MIXED',
      honestTake: "If you're into anime and gaming, sure. But the maid cafes are cringe, the electronics are overpriced compared to online, and it's sensory overload without much substance. The retro game shops in the back streets are the only real gems.",
      bestAlternative: 'Nakano Broadway is the real otaku destination. Less crowded, better prices, and way more interesting finds.',
      bestTime: 'Afternoon, any day',
      cost: 'Free to browse',
      crowdLevel: 'Nightmare',
      insiderTip: 'Super Potato on the upper floors has retro games you can actually play. Skip the ground floor tourist shops entirely.',
      timeNeeded: '2 hours',
    },
    {
      name: 'Sensoji Temple (Asakusa)',
      rating: 'WORTH IT',
      honestTake: "Yeah it's the most visited temple in Tokyo but the surrounding Nakamise shopping street actually has good snacks and crafts. The temple itself is stunning at night when the crowds disappear and it's all lit up.",
      bestAlternative: '',
      bestTime: 'After 8pm for the lit-up temple, or before 7am',
      cost: 'Free',
      crowdLevel: 'Packed',
      insiderTip: 'Walk past the main temple to the smaller shrines behind it. There\'s a beautiful garden back there that 90% of tourists miss.',
      timeNeeded: '1.5 hours',
    },
  ],
  Bali: [
    {
      name: 'Tegallalang Rice Terraces',
      rating: 'MIXED',
      honestTake: "Instagram made this place famous and now it shows. Every viewpoint charges a fee, local vendors are aggressive, and the swings are a tourist trap. The terraces themselves are genuinely beautiful though — just manage your expectations.",
      bestAlternative: 'Jatiluwih Rice Terraces are a UNESCO site, way less crowded, and more impressive. Worth the longer drive.',
      bestTime: 'Before 8am or after 4pm',
      cost: '15,000 IDR entry (~$1) + swing fees',
      crowdLevel: 'Packed',
      insiderTip: 'Walk past the first two viewpoints that everyone stops at. The path continues for a solid 30-minute trek with barely anyone on it.',
      timeNeeded: '1-2 hours',
    },
    {
      name: 'Uluwatu Temple',
      rating: 'WORTH IT',
      honestTake: "The cliff-top setting is genuinely spectacular and the Kecak fire dance at sunset is one of the most memorable things you'll see in Bali. Just watch your sunglasses — the monkeys WILL steal them.",
      bestAlternative: '',
      bestTime: 'Arrive 4:30pm for sunset Kecak dance',
      cost: '50,000 IDR (~$3.20)',
      crowdLevel: 'Manageable',
      insiderTip: 'Book Kecak dance tickets early — they sell out. Sit on the left side for the best sunset backdrop. Hide everything shiny in your bag.',
      timeNeeded: '2-3 hours',
    },
    {
      name: 'Ubud Monkey Forest',
      rating: 'SKIP IT',
      honestTake: "It's monkeys being aggressive near some temples. They'll scratch you, steal your stuff, and the whole thing feels more stressful than fun. The temples inside are nice but not worth the monkey gauntlet.",
      bestAlternative: 'Walk through the quieter parts of Ubud — the Campuhan Ridge Walk is free, peaceful, and actually beautiful.',
      bestTime: '',
      cost: '80,000 IDR (~$5)',
      crowdLevel: 'Packed',
      insiderTip: 'If you insist on going, don\'t bring any food, remove all jewelry, and keep your phone in a zipped pocket.',
      timeNeeded: '1 hour',
    },
    {
      name: 'Seminyak Beach Clubs',
      rating: 'WORTH IT',
      honestTake: "Potato Head and Mrs Sippy are genuinely great vibes — good DJs, solid cocktails, beautiful infinity pools. Yes they're pricey for Bali but the production value is legitimately world-class.",
      bestAlternative: '',
      bestTime: 'Sunday afternoon sessions',
      cost: '200,000-500,000 IDR minimum spend',
      crowdLevel: 'Manageable',
      insiderTip: 'Book a daybed at Potato Head by Wednesday for weekend. Walk-ins wait 1-2 hours. The sunset from their pool is unreal.',
      timeNeeded: 'Half day',
    },
    {
      name: 'Tirta Empul Water Temple',
      rating: 'WORTH IT',
      honestTake: "Actually a meaningful spiritual experience if you approach it with respect. The purification ritual is open to visitors and it's genuinely moving. Not just a photo op — people come here to pray.",
      bestAlternative: '',
      bestTime: 'Early morning, before 9am',
      cost: '50,000 IDR (~$3.20)',
      crowdLevel: 'Manageable',
      insiderTip: 'Wear a sarong (they provide one but bring your own for comfort). Follow the local worshippers and do the full purification — it\'s the whole point.',
      timeNeeded: '1.5 hours',
    },
    {
      name: 'Tanah Lot',
      rating: 'SKIP IT',
      honestTake: "Massively overrated. The temple is small, you can't go inside, and the surrounding area is a gauntlet of souvenir shops. The sunset photos look great online but in person you're fighting 500 other people for the shot.",
      bestAlternative: 'Uluwatu Temple has a way better cliff setting and you can actually attend the Kecak dance. Or just watch sunset from any beach.',
      bestTime: '',
      cost: '60,000 IDR (~$4)',
      crowdLevel: 'Nightmare',
      insiderTip: 'If someone drags you here anyway, at least grab a coconut from the vendors on the left side — they\'re cheaper than the ones near the entrance.',
      timeNeeded: '1 hour',
    },
  ],
  Bangkok: [
    {
      name: 'Grand Palace',
      rating: 'WORTH IT',
      honestTake: "It's hot, it's crowded, and there's a strict dress code — but the craftsmanship is genuinely jaw-dropping. The Emerald Buddha temple alone is worth the hassle. Just go early and hydrate.",
      bestAlternative: '',
      bestTime: '8:30am right when it opens',
      cost: '500 THB (~$14)',
      crowdLevel: 'Nightmare',
      insiderTip: 'Wear long pants and covered shoulders or they\'ll make you buy overpriced coverings at the gate. Anyone outside who says it\'s closed is running a scam.',
      timeNeeded: '2-3 hours',
    },
    {
      name: 'Khao San Road',
      rating: 'SKIP IT',
      honestTake: "Peak gap-year energy. Overpriced pad thai, bucket drinks that'll wreck you, and the same elephant pants at every stall. It was fun in 2008. Now it's just a parody of itself.",
      bestAlternative: 'Rambuttri Alley is literally one street over — same vibe but way more chill, cheaper, and less chaotic.',
      bestTime: '',
      cost: 'Varies',
      crowdLevel: 'Nightmare',
      insiderTip: 'If you want the backpacker social scene, just grab one drink here then leave. The street food carts at the END of the road (past the 7-11) are the only decent ones.',
      timeNeeded: '30 min max',
    },
    {
      name: 'Chatuchak Weekend Market',
      rating: 'WORTH IT',
      honestTake: "15,000+ stalls and you can genuinely find amazing stuff — vintage clothes, handmade ceramics, plants, art. It's overwhelming but that's the charm. Bring cash and an empty bag.",
      bestAlternative: '',
      bestTime: 'Saturday morning, 9am-12pm before the heat',
      cost: 'Free entry',
      crowdLevel: 'Packed',
      insiderTip: 'Sections 2-4 have the best vintage clothing. Use the JJ Green night market next door on Friday nights for a less intense version.',
      timeNeeded: '3-5 hours',
    },
    {
      name: 'Wat Pho',
      rating: 'WORTH IT',
      honestTake: "The reclining Buddha is massive and impressive in person. But the real move is getting a traditional Thai massage at the on-site school afterward. It's the birthplace of Thai massage and costs a fraction of spa prices.",
      bestAlternative: '',
      bestTime: 'Right after lunch when tour groups thin out',
      cost: '200 THB entry (~$6) + 260 THB massage',
      crowdLevel: 'Manageable',
      insiderTip: 'The massage school is behind the main temple. Book a 1-hour Thai massage for 260 baht — best deal in Bangkok.',
      timeNeeded: '2 hours (temple + massage)',
    },
    {
      name: 'Floating Markets (Damnoen Saduak)',
      rating: 'SKIP IT',
      honestTake: "The famous one is a tourist trap. Inflated prices, staged photo ops, and a 90-minute drive from Bangkok. The whole thing feels manufactured for Instagram at this point.",
      bestAlternative: 'Amphawa Floating Market (weekends only) is where actual Thai people go. Way more authentic, better food, and you can see fireflies at night.',
      bestTime: '',
      cost: '1,500-3,000 THB for tour',
      crowdLevel: 'Nightmare',
      insiderTip: 'If you must do a floating market from Bangkok, Khlong Lat Mayom is closest, least touristy, and has incredible desserts.',
      timeNeeded: 'Half day with transport',
    },
    {
      name: 'Yaowarat (Chinatown)',
      rating: 'WORTH IT',
      honestTake: "The best street food in Bangkok, full stop. When the sun goes down, the whole street transforms into an open-air food hall. Come hungry and eat everything.",
      bestAlternative: '',
      bestTime: 'After 6pm, any night',
      cost: '200-500 THB for a feast',
      crowdLevel: 'Packed',
      insiderTip: 'Start at the Hua Lamphong end and work your way down. The seafood carts with the longest local lines are always the best. Try the oyster omelette.',
      timeNeeded: '2-3 hours',
    },
    {
      name: 'Rooftop Bars (Lebua/Sky Bar)',
      rating: 'MIXED',
      honestTake: "The views are legitimately insane — Bangkok's skyline at night is elite. But the drinks are $20+ each and the dress code is strict. It's a one-time experience, not a regular night out.",
      bestAlternative: 'Octave Rooftop at Marriott Sukhumvit is just as high, better vibes, and drinks are 30% cheaper.',
      bestTime: 'Sunset, around 5:30-6pm',
      cost: '600-900 THB per cocktail',
      crowdLevel: 'Manageable',
      insiderTip: 'Go for one drink at sunset, take your photos, then head somewhere cheaper. No one needs to pay $25 for a second gin and tonic.',
      timeNeeded: '1 hour',
    },
  ],
  Lisbon: [
    {
      name: 'Tram 28',
      rating: 'SKIP IT',
      honestTake: "It's a regular tram turned into a tourist attraction. You'll wait 45 minutes in line, get pickpocketed risk, and be crammed in with 60 other tourists. The route is scenic but you can walk it in the same time.",
      bestAlternative: 'Walk the same route through Alfama and Graca. You\'ll see more, stop where you want, and actually enjoy it. Or take Tram 25 which covers similar ground with zero tourists.',
      bestTime: '',
      cost: '3 EUR',
      crowdLevel: 'Nightmare',
      insiderTip: 'If you must ride it, go to the Graca terminus at 8am on a weekday. You\'ll get a seat and it\'s almost pleasant.',
      timeNeeded: '40 min ride (+ wait)',
    },
    {
      name: 'Time Out Market',
      rating: 'MIXED',
      honestTake: "It's a well-curated food hall with legit restaurants — not your typical tourist trap food court. But it's pricey for Lisbon, always packed, and the communal seating situation is chaos. Good for a first visit, skip on return trips.",
      bestAlternative: 'Mercado da Ribeira (the actual market next door) has cheaper, more authentic food. Or just eat at any tasca in Mouraria.',
      bestTime: 'Weekday lunch, 11:30am',
      cost: '15-25 EUR per person',
      crowdLevel: 'Packed',
      insiderTip: 'The Henrique Sa Pessoa stall serves Michelin-level seafood rice for 15 EUR. That\'s the only reason to come here.',
      timeNeeded: '1 hour',
    },
    {
      name: 'Belem Tower',
      rating: 'SKIP IT',
      honestTake: "It's tiny inside, the line is absurdly long, and you can see 90% of it from outside. It looks nice from the waterfront but spending an hour queuing to climb a cramped tower is not it.",
      bestAlternative: 'Walk along the Belem waterfront instead. Hit Pasteis de Belem for custard tarts (the line moves fast), then visit the Jeronimos Monastery which is 10x more impressive.',
      bestTime: '',
      cost: '8 EUR',
      crowdLevel: 'Packed',
      insiderTip: 'Get the combo ticket with Jeronimos Monastery if you insist. At least the monastery is genuinely stunning inside.',
      timeNeeded: '1 hour',
    },
    {
      name: 'Alfama District',
      rating: 'WORTH IT',
      honestTake: "This is the real Lisbon. Get lost in the narrow streets, listen for fado music drifting out of windows, find a tiny bar serving ginjinha. It's hilly and your calves will hate you but it's absolutely worth it.",
      bestAlternative: '',
      bestTime: 'Late afternoon into evening',
      cost: 'Free to wander',
      crowdLevel: 'Manageable',
      insiderTip: 'Skip the fado restaurants that have menus in English outside. Find one where you can hear the music from the street and there\'s no cover charge.',
      timeNeeded: '3-4 hours',
    },
    {
      name: 'LX Factory',
      rating: 'WORTH IT',
      honestTake: "A converted industrial complex with genuinely cool independent shops, bookstores, and restaurants. It's become more tourist-aware but still has real creative energy. The Sunday brunch scene is excellent.",
      bestAlternative: '',
      bestTime: 'Sunday for brunch and market stalls',
      cost: 'Free entry',
      crowdLevel: 'Manageable',
      insiderTip: 'Ler Devagar bookshop is stunning — a converted printing press with books floor to ceiling. Landeau has the best chocolate cake in Lisbon.',
      timeNeeded: '2-3 hours',
    },
    {
      name: 'Pasteis de Belem',
      rating: 'WORTH IT',
      honestTake: "Yes there's a line. Yes it's touristy. But these are genuinely the best custard tarts you'll ever eat and the recipe has been secret since 1837. The line moves fast and it's absolutely worth it.",
      bestAlternative: '',
      bestTime: 'Before 10am or after 3pm',
      cost: '1.30 EUR per tart',
      crowdLevel: 'Packed',
      insiderTip: 'Skip the takeaway line and go inside to the dining rooms in the back. Way more space, same tarts, and you can order coffee. Dust with cinnamon AND powdered sugar.',
      timeNeeded: '30 min',
    },
  ],
  Paris: [
    {
      name: 'Louvre Museum',
      rating: 'WORTH IT',
      honestTake: "Yes it's packed and the Mona Lisa is smaller than you think. But the collection is genuinely one of the best on earth. Spend 3 hours minimum. Skip the Mona Lisa line — see everything else first.",
      bestAlternative: '',
      bestTime: 'Wednesday or Friday evening (open until 9:45pm)',
      cost: '17 EUR',
      crowdLevel: 'Nightmare',
      insiderTip: 'Use the Carrousel entrance or Porte des Lions — way shorter lines than the pyramid. Book online.',
      timeNeeded: '3-5 hours',
    },
    {
      name: 'Eiffel Tower',
      rating: 'MIXED',
      honestTake: "The views from the top are legitimately stunning. But the lines are brutal and the experience feels industrial. For most people, seeing it from below or from Trocadero is enough.",
      bestAlternative: 'Tour Montparnasse has better views of Paris (including the Eiffel Tower) with way shorter lines and lower prices.',
      bestTime: 'Sunset from Trocadero (free) or last entry to summit',
      cost: '26-29 EUR for summit',
      crowdLevel: 'Nightmare',
      insiderTip: 'Picnic on Champ de Mars at sunset. The tower sparkles on the hour for 5 min. Free and magical.',
      timeNeeded: '2-4 hours with lines',
    },
    {
      name: 'Montmartre / Sacré-Coeur',
      rating: 'SKIP IT',
      honestTake: "Aggressive bracelet scammers, overpriced crepes, and a sea of selfie sticks. The basilica is nice but the experience is tourist hell. Pickpockets work this area hard.",
      bestAlternative: 'Walk up to the lesser-known Buttes-Chaumont park for stunning views with zero tourists. Or visit Sacré-Coeur at 6am — completely different experience.',
      bestTime: '',
      cost: 'Free',
      crowdLevel: 'Nightmare',
      insiderTip: 'If you go, keep hands in pockets. Say no to anyone offering bracelets or roses.',
      timeNeeded: '1 hour',
    },
    {
      name: 'Sainte-Chapelle',
      rating: 'WORTH IT',
      honestTake: "The stained glass is otherworldly. Literally one of the most beautiful interiors you'll ever see. Small space so it feels intimate despite the tourists.",
      bestAlternative: '',
      bestTime: 'First slot (9:30am) or golden hour when sun hits the glass',
      cost: '11.50 EUR',
      crowdLevel: 'Packed',
      insiderTip: 'Buy combo ticket with Conciergerie to skip some line. Go on a sunny day — the glass needs light.',
      timeNeeded: '45 min',
    },
    {
      name: 'Marais',
      rating: 'WORTH IT',
      honestTake: "The trendy part of old Paris. Great boutiques, falafel, galleries. Gets touristy near Place des Vosges but the side streets are still magic.",
      bestAlternative: '',
      bestTime: 'Sunday (many shops open), late afternoon',
      cost: 'Free to wander',
      crowdLevel: 'Manageable',
      insiderTip: "L'As du Fallafel. Cash only. Get it to go. Don't skip.",
      timeNeeded: 'Half day',
    },
    {
      name: 'Versailles',
      rating: 'MIXED',
      honestTake: "The Hall of Mirrors is spectacular. The gardens are massive. But it's an hour from Paris, packed with tour groups, and the audio guide is dry. Go if you love opulence; skip if crowds stress you.",
      bestAlternative: 'Château de Fontainebleau is less crowded and arguably more interesting. Same train line, different vibe.',
      bestTime: 'Tuesday (Louvre closed so fewer combo-tour visitors) or weekday opening',
      cost: '20 EUR (palace + gardens)',
      crowdLevel: 'Nightmare',
      insiderTip: 'Rent a bike for the gardens — they\'re huge. The Trianon palaces are quieter and stunning.',
      timeNeeded: '4-6 hours',
    },
  ],
  'New York': [
    {
      name: 'Times Square',
      rating: 'SKIP IT',
      honestTake: "It's chaotic, overstimulating, and the restaurants are overpriced chains. You'll get bumped, handed flyers, and accosted by Elmo. Walk through once for the photo, then leave.",
      bestAlternative: 'Bryant Park is 2 blocks away — green space, free events, actual New Yorkers. Or go to the top of the Edge for real skyline views.',
      bestTime: '',
      cost: 'Free',
      crowdLevel: 'Nightmare',
      insiderTip: 'If you must go, go at 6am. Empty. Surreal. Or midnight when it\'s slightly less insane.',
      timeNeeded: '15 min',
    },
    {
      name: 'Metropolitan Museum of Art',
      rating: 'WORTH IT',
      honestTake: "One of the world's great museums. You could spend a week. The rooftop garden in summer is magical. Pay what you wish for NY/NJ/CT residents — otherwise $30.",
      bestAlternative: '',
      bestTime: 'Friday or Saturday evening (open until 9pm)',
      cost: '$30 (pay what you wish for tri-state)',
      crowdLevel: 'Manageable',
      insiderTip: 'Start in the American Wing or Temple of Dendur. Skip the crowded Egyptian rooms at peak times.',
      timeNeeded: '3-5 hours',
    },
    {
      name: 'Statue of Liberty',
      rating: 'MIXED',
      honestTake: "The ferry ride is nice. The crown is cramped and books months ahead. For most people, the free Staten Island Ferry gives you great views without the hassle.",
      bestAlternative: 'Staten Island Ferry is free, runs every 30 min, and gets you close enough for good photos. No reservations needed.',
      bestTime: 'First ferry of the day',
      cost: '$24 ferry / Crown tickets book months ahead',
      crowdLevel: 'Packed',
      insiderTip: 'Battery Park view is fine. Or take the SI Ferry at sunset — best free view in NYC.',
      timeNeeded: '3-4 hours',
    },
    {
      name: 'High Line',
      rating: 'WORTH IT',
      honestTake: "Elevated park on old train tracks. Beautiful, well-designed, free. Gets packed on weekends. Go at 7am on a weekday and it's serene.",
      bestAlternative: '',
      bestTime: 'Weekday 7-9am',
      cost: 'Free',
      crowdLevel: 'Packed',
      insiderTip: 'Start at the Hudson Yards end and walk south. The Whitney is at the bottom — combo the two.',
      timeNeeded: '1 hour',
    },
    {
      name: '9/11 Memorial & Museum',
      rating: 'WORTH IT',
      honestTake: "Powerful and deeply moving. The museum is heavy — give yourself time to process. The outdoor memorial is free and worth visiting even if you skip the museum.",
      bestAlternative: '',
      bestTime: 'Weekday morning',
      cost: '$32 museum / Free for memorial',
      crowdLevel: 'Manageable',
      insiderTip: 'Book tickets ahead. The museum is emotionally intense — budget 2-3 hours and maybe a quiet coffee after.',
      timeNeeded: '2-3 hours',
    },
    {
      name: 'Brooklyn Bridge',
      rating: 'WORTH IT',
      honestTake: "The walk is iconic and the views are real. But it's crowded, cyclists will yell at you if you drift into the bike lane, and midday in summer is brutal. Go early.",
      bestAlternative: '',
      bestTime: 'Sunrise or 7am on a weekday',
      cost: 'Free',
      crowdLevel: 'Packed',
      insiderTip: 'Start from Brooklyn (DUMBO) and walk to Manhattan. Better views, and you end up in Chinatown for lunch.',
      timeNeeded: '45 min walk',
    },
  ],
  Barcelona: [
    {
      name: 'Sagrada Familia',
      rating: 'WORTH IT',
      honestTake: "Gaudí's masterpiece is genuinely unlike anything else on earth. The interior light is transcendent. Yes it's packed and yes it's expensive — still worth every euro.",
      bestAlternative: '',
      bestTime: 'First slot (9am) or last slot of the day',
      cost: '26 EUR (tower extra)',
      crowdLevel: 'Packed',
      insiderTip: 'Book online. The Nativity Tower has better views than Passion. Allow 2 hours minimum.',
      timeNeeded: '2 hours',
    },
    {
      name: 'La Rambla',
      rating: 'SKIP IT',
      honestTake: "Pickpocket central. Overpriced food. Souvenir shops. The only thing authentic is the danger to your wallet. Walk it once to say you did, then get off.",
      bestAlternative: 'Parallel is one block over — real Barcelona, real prices. Or explore El Raval.',
      bestTime: '',
      cost: 'Free',
      crowdLevel: 'Nightmare',
      insiderTip: 'If you walk it, phone in front pocket. Bag in front. Do not stop for anyone.',
      timeNeeded: '20 min',
    },
    {
      name: 'Park Güell',
      rating: 'MIXED',
      honestTake: "The paid Monument Zone has the famous mosaic lizard and views. The rest of the park is free and also lovely. Gets extremely crowded by 10am.",
      bestAlternative: 'The free part of the park is huge. You can get great views without paying. Go at opening for the paid zone.',
      bestTime: '8am opening or 2 hours before close',
      cost: '10 EUR (Monument Zone) / Free (rest)',
      crowdLevel: 'Packed',
      insiderTip: 'Book online. Wear good shoes — it\'s steep. The free zone has the same Gaudí architecture vibe.',
      timeNeeded: '1.5 hours',
    },
    {
      name: 'La Boqueria',
      rating: 'MIXED',
      honestTake: "Real market with incredible produce, but the center is now tourist food stalls. The edges still have locals. Good for juice and snacks, overpriced for meals.",
      bestAlternative: 'Mercat de Sant Antoni or Mercat de la Barceloneta for less touristy markets.',
      bestTime: 'Before 10am on a weekday',
      cost: 'Varies',
      crowdLevel: 'Packed',
      insiderTip: 'Skip the famous stalls in the center. Walk the perimeter for better prices. Fresh juice is still a good deal.',
      timeNeeded: '1 hour',
    },
    {
      name: 'Casa Batlló',
      rating: 'WORTH IT',
      honestTake: "Gaudí's residential masterpiece. The roof and interior are surreal. Expensive but the audio guide is excellent and you'll understand his genius.",
      bestAlternative: '',
      bestTime: 'First slot (9am)',
      cost: '35 EUR',
      crowdLevel: 'Manageable',
      insiderTip: 'Casa Milà (La Pedrera) is next door — pick one if budget is tight. Batlló has more wow factor.',
      timeNeeded: '1.5 hours',
    },
  ],
  Rome: [
    {
      name: 'Colosseum',
      rating: 'WORTH IT',
      honestTake: "It's 2,000 years old and you're standing inside it. The scale hits different in person. Yes it's crowded. Still essential. Book ahead or waste hours in line.",
      bestAlternative: '',
      bestTime: 'First slot (8:30am) or last 2 hours',
      cost: '18 EUR (Colosseum + Forum + Palatine)',
      crowdLevel: 'Nightmare',
      insiderTip: 'Buy the full forum combo — same price, way more value. Enter from the Forum side to skip the worst crowds.',
      timeNeeded: '2-3 hours',
    },
    {
      name: 'Trevi Fountain',
      rating: 'MIXED',
      honestTake: "Stunning baroque masterpiece. Also a sea of selfie sticks 14 hours a day. Go at 6am or midnight for the actual fountain. Otherwise you're just in a crowd.",
      bestAlternative: '',
      bestTime: '6am or midnight',
      cost: 'Free',
      crowdLevel: 'Nightmare',
      insiderTip: 'Throw your coin over your left shoulder. Legend says you\'ll return. The fountain is being cleaned often — check if it\'s full.',
      timeNeeded: '15 min',
    },
    {
      name: 'Vatican Museums / Sistine Chapel',
      rating: 'WORTH IT',
      honestTake: "The Sistine Chapel ceiling is worth the entire trip. The museum route to get there is long and crowded. Book a skip-the-line ticket or suffer.",
      bestAlternative: '',
      bestTime: 'Friday evening (Apr-Oct) or 8am Wednesday',
      cost: '21 EUR',
      crowdLevel: 'Nightmare',
      insiderTip: 'Go straight to the Sistine Chapel if short on time — you can always backtrack. No photos allowed inside.',
      timeNeeded: '3-4 hours',
    },
    {
      name: 'Spanish Steps',
      rating: 'SKIP IT',
      honestTake: "You can't sit on them anymore (fines). The area is overpriced and crowded. Nice to walk past. Not worth a dedicated visit.",
      bestAlternative: 'Pincio Terrace or Orange Garden for actual views and fewer crowds.',
      bestTime: '',
      cost: 'Free',
      crowdLevel: 'Packed',
      insiderTip: 'The Keats-Shelley house is on the square if you\'re into literary history. Otherwise walk through and leave.',
      timeNeeded: '10 min',
    },
    {
      name: 'Trastevere',
      rating: 'MIXED',
      honestTake: "Charming medieval streets, great restaurants, and loads of tourists. The main square and surrounding streets are packed. Go deeper into the neighborhood for the real thing.",
      bestAlternative: 'Testaccio for authentic Roman food without the tourist crush.',
      bestTime: 'Weekday lunch or late dinner',
      cost: 'Free to wander',
      crowdLevel: 'Packed',
      insiderTip: 'Avoid restaurants with photos of food outside. Walk two blocks off the main drag. Da Enzo and similar are worth the wait.',
      timeNeeded: '2-3 hours',
    },
  ],
  London: [
    {
      name: 'British Museum',
      rating: 'WORTH IT',
      honestTake: "Free and world-class. The Egyptian and Greek collections are unmatched. The great court is stunning. Can get packed on weekends — go on a weekday or Friday late.",
      bestAlternative: '',
      bestTime: 'Weekday 10am or Friday until 8:30pm',
      cost: 'Free',
      crowdLevel: 'Packed',
      insiderTip: 'Start with the Egyptian room, then Parthenon marbles. Skip the gift shop — it\'s overwhelming.',
      timeNeeded: '3-4 hours',
    },
    {
      name: 'London Eye',
      rating: 'SKIP IT',
      honestTake: "Overpriced Ferris wheel with long lines. The views are fine but Sky Garden is free and has better views. Or just walk the South Bank.",
      bestAlternative: 'Sky Garden (free, book ahead) or The Shard (expensive but way more impressive).',
      bestTime: '',
      cost: '£35+',
      crowdLevel: 'Packed',
      insiderTip: 'If you insist, book ahead. Sunset slot is nicest. But really — Sky Garden is free.',
      timeNeeded: '30 min',
    },
    {
      name: 'Tower of London',
      rating: 'WORTH IT',
      honestTake: "The Crown Jewels, the Beefeaters, 1,000 years of history. Yes it's touristy. Yes it's worth it. The free Beefeater tours are excellent.",
      bestAlternative: '',
      bestTime: 'Opening (9am) on a weekday',
      cost: '£33',
      crowdLevel: 'Packed',
      insiderTip: 'Do the Beefeater tour first — it\'s included and gives context. Crown Jewels line is shorter early.',
      timeNeeded: '3-4 hours',
    },
    {
      name: 'Borough Market',
      rating: 'WORTH IT',
      honestTake: "Incredible food market. Yes it's crowded on Saturday. Go Wednesday or Thursday for space. The cheese, bread, and hot food stalls are exceptional.",
      bestAlternative: '',
      bestTime: 'Wednesday or Thursday, before noon',
      cost: 'Free entry',
      crowdLevel: 'Packed',
      insiderTip: 'Eat lunch there — multiple stalls, sit by the river. The raclette stall is legendary.',
      timeNeeded: '1-2 hours',
    },
    {
      name: 'Camden Market',
      rating: 'SKIP IT',
      honestTake: "Was edgy in the 90s. Now it's chain food, mass-produced souvenirs, and crowds. The canal is nice. The market is a tourist trap.",
      bestAlternative: 'Broadway Market (Saturday) or Maltby Street Market for real London market vibes.',
      bestTime: '',
      cost: 'Free',
      crowdLevel: 'Nightmare',
      insiderTip: 'If you go, the canal walk to Regent\'s Park is nice. Skip the food — overpriced and mediocre.',
      timeNeeded: '1 hour',
    },
  ],
  Marrakech: [
    {
      name: 'Jemaa el-Fnaa',
      rating: 'WORTH IT',
      honestTake: "Chaotic, overwhelming, and absolutely essential. The square transforms at dusk — snake charmers, food stalls, storytellers. It's sensory overload in the best way.",
      bestAlternative: '',
      bestTime: 'Sunset',
      cost: 'Free',
      crowdLevel: 'Nightmare',
      insiderTip: 'Negotiate food prices before eating. The orange juice stalls are safe — agree on price first. Watch your bag.',
      timeNeeded: '1-2 hours',
    },
    {
      name: 'Souks',
      rating: 'MIXED',
      honestTake: "Incredible labyrinth of crafts, spices, and chaos. Haggle hard — start at 30% of asking price. Gets overwhelming. Take breaks. Don't follow 'guides' who offer help.",
      bestAlternative: '',
      bestTime: 'Morning before 11am',
      cost: 'Free to browse',
      crowdLevel: 'Packed',
      insiderTip: 'If lost, ask a shopkeeper, not someone in the street. Buy small things first to practice haggling.',
      timeNeeded: '2-4 hours',
    },
    {
      name: 'Jardin Majorelle',
      rating: 'WORTH IT',
      honestTake: "Yves Saint Laurent's former home. The blue garden is stunning. Small but photogenic. Gets packed — go at opening or last hour.",
      bestAlternative: '',
      bestTime: '8am opening or last hour',
      cost: '70 MAD',
      crowdLevel: 'Packed',
      insiderTip: 'The Berber Museum inside is worth the extra. Buy combo ticket. The YSL museum next door is excellent too.',
      timeNeeded: '1.5 hours',
    },
    {
      name: 'Camel Rides in the Palmeraie',
      rating: 'SKIP IT',
      honestTake: "Tourist conveyor belt. Short ride, pushy photo ops, overpriced. The Palmeraie itself is being eaten by villas. Not the authentic desert experience you're imagining.",
      bestAlternative: 'Book a proper desert tour (2-3 days) to Erg Chebbi or Zagora if you want the real thing.',
      bestTime: '',
      cost: '200-500 MAD',
      crowdLevel: 'Manageable',
      insiderTip: 'If you do it, negotiate hard. 100-150 MAD per person max. They\'ll start at 500.',
      timeNeeded: '1 hour',
    },
    {
      name: 'Ben Youssef Madrasa',
      rating: 'WORTH IT',
      honestTake: "Stunning Islamic architecture. The tile work and wood carving are breathtaking. One of the most photogenic spots in Marrakech. Small enough to see in an hour.",
      bestAlternative: '',
      bestTime: 'Opening (9am)',
      cost: '50 MAD',
      crowdLevel: 'Manageable',
      insiderTip: 'Closed for restoration sometimes — check before going. The courtyard is the star. Early = fewer people.',
      timeNeeded: '1 hour',
    },
  ],
  'Mexico City': [
    {
      name: 'Museo Nacional de Antropologia',
      rating: 'WORTH IT',
      honestTake: "One of the best museums on earth, not exaggerating. The Aztec Sun Stone alone is worth the trip. You could spend an entire day here and still not see everything. Go with zero expectations and be amazed.",
      bestAlternative: '',
      bestTime: 'Tuesday-Friday morning',
      cost: '90 MXN (~$5)',
      crowdLevel: 'Manageable',
      insiderTip: 'Start with the Mexica (Aztec) hall, then Maya hall. Skip the ethnography floors on your first visit unless you have 6+ hours.',
      timeNeeded: '3-5 hours',
    },
    {
      name: 'Teotihuacan Pyramids',
      rating: 'MIXED',
      honestTake: "The pyramids are genuinely awe-inspiring and climbing the Pyramid of the Sun is a bucket-list moment. But the tour bus experience is rough — pushy vendors, crowded paths, and scorching heat. Go independently for a way better time.",
      bestAlternative: 'Take the public bus from Terminal Norte (30 MXN) instead of a tour. You\'ll save money and set your own pace.',
      bestTime: 'Weekday, arrive at opening (9am)',
      cost: '90 MXN entry (~$5)',
      crowdLevel: 'Packed',
      insiderTip: 'Start from the back entrance (Puerta 5) near the Pyramid of the Moon. Everyone else starts at Puerta 1 so you\'ll have the Moon Pyramid almost to yourself early.',
      timeNeeded: '4-5 hours',
    },
    {
      name: 'Frida Kahlo Museum (Casa Azul)',
      rating: 'WORTH IT',
      honestTake: "Genuinely moving if you know anything about Frida's life. The house itself is the art — her studio, her garden, her bed where she painted from. It's intimate and powerful. Book ahead or don't bother showing up.",
      bestAlternative: '',
      bestTime: 'First slot of the day, any weekday',
      cost: '250 MXN (~$15)',
      crowdLevel: 'Manageable',
      insiderTip: 'Buy tickets online at least a week in advance — they sell out daily. Walk around Coyoacan neighborhood after for some of the best food markets in the city.',
      timeNeeded: '2 hours',
    },
    {
      name: 'Chapultepec Castle',
      rating: 'WORTH IT',
      honestTake: "The only royal castle in the Americas and the views of CDMX from up top are unreal. The history inside is fascinating and the surrounding park is massive and beautiful. One of the best value attractions in the city.",
      bestAlternative: '',
      bestTime: 'Morning on a weekday',
      cost: '90 MXN (~$5)',
      crowdLevel: 'Manageable',
      insiderTip: 'Walk through Chapultepec Park first. There\'s a lake with paddle boats and incredible street food vendors along the paths.',
      timeNeeded: '2-3 hours',
    },
    {
      name: 'Lucha Libre at Arena Mexico',
      rating: 'WORTH IT',
      honestTake: "Even if you don't care about wrestling, this is pure spectacle. The crowd energy is electric, the performers are incredible athletes, and the whole experience is authentically Mexican. Grab a michelada and enjoy the show.",
      bestAlternative: '',
      bestTime: 'Tuesday or Friday night',
      cost: '100-500 MXN depending on seats',
      crowdLevel: 'Packed',
      insiderTip: 'Buy tickets at the arena, not from resellers. Sit in the cheaper sections — the energy is better and you\'re closer to the crowd. Buy a mask from the vendors outside.',
      timeNeeded: '3 hours',
    },
    {
      name: 'Zona Rosa',
      rating: 'SKIP IT',
      honestTake: "Was the trendy neighborhood a decade ago. Now it's overpriced restaurants, chain stores, and feels more like a generic shopping district than anything culturally interesting. The LGBTQ+ nightlife scene is still solid but the daytime is skippable.",
      bestAlternative: 'Roma Norte and Condesa are where the actual creative energy lives now. Better restaurants, cooler bars, and way more character.',
      bestTime: '',
      cost: 'Varies',
      crowdLevel: 'Manageable',
      insiderTip: 'If you\'re going for nightlife, come after 11pm on a Friday. Otherwise, spend your time in Roma Norte instead.',
      timeNeeded: '1-2 hours max',
    },
    {
      name: 'Xochimilco Floating Gardens',
      rating: 'MIXED',
      honestTake: "The trajinera boats are colorful and fun but the Saturday tourist version is a floating frat party with overpriced beer. Come on a weekday and it's a completely different, much more authentic experience with local families and flower vendors.",
      bestAlternative: 'Go on a weekday morning for the real experience. Or visit the Cuemanco ecological area for a quieter, more natural version.',
      bestTime: 'Weekday morning, 10am-1pm',
      cost: '500 MXN per boat per hour',
      crowdLevel: 'Packed',
      insiderTip: 'Negotiate the boat price before boarding. Bring your own drinks and snacks — the floating vendors charge tourist prices. The food boats selling elote are legit though.',
      timeNeeded: '2-3 hours',
    },
  ],
};

// =============================================================================
// Helper: sort order value
// =============================================================================
const VERDICT_SORT_VALUE: Record<Verdict, number> = {
  'WORTH IT': 1,
  'MIXED': 2,
  'SKIP IT': 3,
};

// =============================================================================
// Component
// =============================================================================
function HonestReviews() {
  const { t } = useTranslation();
  const params = useLocalSearchParams<{ destination: string }>();
  const router = useRouter();
  const insets = useSafeAreaInsets();

  const [activeFilter, setActiveFilter] = useState<FilterOption>('All');
  const [activeSort, setActiveSort] = useState<SortOption>('Default');

  // Animation refs for stagger
  const fadeAnims = useRef<Animated.Value[]>([]).current;

  const cityName = validateDestination(params.destination) ?? '';
  const rawReviews = REVIEWS_DATA[cityName] || [];
  const hasData = rawReviews.length > 0;
  const destTheme = useDestinationTheme(cityName);

  // Filter
  const filtered = activeFilter === 'All'
    ? rawReviews
    : rawReviews.filter((a) => a.rating === activeFilter);

  // Sort
  const reviews = [...filtered].sort((a, b) => {
    if (activeSort === 'Best First') return VERDICT_SORT_VALUE[a.rating] - VERDICT_SORT_VALUE[b.rating];
    if (activeSort === 'Worst First') return VERDICT_SORT_VALUE[b.rating] - VERDICT_SORT_VALUE[a.rating];
    return 0;
  });

  // Initialize animation values
  useEffect(() => {
    fadeAnims.length = 0;
    reviews.forEach(() => fadeAnims.push(new Animated.Value(0)));
    // Stagger in
    const animations = fadeAnims.map((anim, i) =>
      Animated.timing(anim, {
        toValue: 1,
        duration: 400,
        delay: i * 80,
        useNativeDriver: true,
      }),
    );
    Animated.stagger(80, animations).start();
  }, [activeFilter, activeSort, cityName]);

  // -------------------------------------------------------------------------
  // Crowd level indicator (filled dots)
  // -------------------------------------------------------------------------
  const CrowdIndicator = ({ level }: { level: CrowdLevel }) => {
    const idx = CROWD_LEVELS.indexOf(level);
    const crowdColor =
      idx <= 1 ? COLORS.sage : idx === 2 ? COLORS.gold : COLORS.coral;
    return (
      <View style={styles.crowdRow}>
        <Text style={styles.crowdLabel}>{t('honestReviews.crowds')}</Text>
        <View style={styles.crowdDots}>
          {CROWD_LEVELS.map((_, i) => (
            <View
              key={i}
              style={[
                styles.crowdDot,
                { backgroundColor: i <= idx ? crowdColor : COLORS.whiteSoft },
              ]}
            />
          ))}
        </View>
        <Text style={[styles.crowdText, { color: crowdColor }]}>{level}</Text>
      </View>
    );
  };

  // -------------------------------------------------------------------------
  // Filter chips
  // -------------------------------------------------------------------------
  const FILTERS: FilterOption[] = ['All', 'WORTH IT', 'SKIP IT', 'MIXED'];

  const chipColor = (f: FilterOption): string => {
    if (f === 'All') return COLORS.cream;
    return VERDICT_COLORS[f as Verdict];
  };

  // -------------------------------------------------------------------------
  // Sort options
  // -------------------------------------------------------------------------
  const SORTS: SortOption[] = ['Default', 'Best First', 'Worst First'];

  // -------------------------------------------------------------------------
  // Render
  // -------------------------------------------------------------------------
  return (
    <View style={[styles.container, { paddingTop: insets.top }]}>
      <LinearGradient
        colors={[COLORS.bg, COLORS.gradientForestDarkGreen, COLORS.bg]}
        style={StyleSheet.absoluteFill}
      />

      {/* Header */}
      <View style={styles.header}>
        <Pressable
          onPress={() => {
            Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
            router.back();
          }}
          style={[styles.backButton, { backgroundColor: `${destTheme.primary}20` }]}
        >
          <ChevronLeft size={24} color={COLORS.cream} />
        </Pressable>
        <View style={styles.headerText}>
          <Text style={styles.headerTitle}>{t('honestReviews.title')}</Text>
          <Text style={styles.headerSubtitle}>
            {hasData ? cityName : t('honestReviews.noReviewsAvailable')}
          </Text>
        </View>
      </View>

      {/* Tag line */}
      <View style={styles.taglineWrap}>
        <Text style={styles.tagline}>
          {t('honestReviews.tagline')}
        </Text>
      </View>

      {!hasData ? (
        /* Fallback for unknown destinations */
        <View style={styles.fallbackContainer}>
          <Text style={styles.fallbackTitle}>
            We don't have reviews for {cityName || 'this destination'} yet
          </Text>
          <Text style={styles.fallbackBody}>
            We're adding new cities all the time. Check back soon or try one of
            Tokyo, Paris, Bali, New York, Barcelona, Rome, London, Bangkok, Marrakech, Lisbon, or Mexico City.
          </Text>
          <Pressable
            onPress={() => router.back()}
            style={styles.fallbackButton}
          >
            <Text style={styles.fallbackButtonText}>Go Back</Text>
          </Pressable>
        </View>
      ) : (
        <>
          {/* Filter chips */}
          <ScrollView
            horizontal
            showsHorizontalScrollIndicator={false}
            contentContainerStyle={styles.chipRow}
          >
            {FILTERS.map((f) => {
              const isActive = activeFilter === f;
              return (
                <Pressable
                  key={f}
                  onPress={() => {
                    Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
                    setActiveFilter(f);
                  }}
                  style={[
                    styles.chip,
                    isActive && { backgroundColor: chipColor(f), borderColor: chipColor(f) },
                  ]}
                >
                  <Text
                    style={[
                      styles.chipText,
                      isActive && { color: COLORS.bg },
                    ]}
                  >
                    {f === 'All' ? 'All' : f}
                  </Text>
                </Pressable>
              );
            })}
          </ScrollView>

          {/* Sort row */}
          <ScrollView
            horizontal
            showsHorizontalScrollIndicator={false}
            contentContainerStyle={styles.sortRow}
          >
            <Text style={styles.sortLabel}>{t('honestReviews.sort')}</Text>
            {SORTS.map((s) => {
              const isActive = activeSort === s;
              return (
                <Pressable
                  key={s}
                  onPress={() => {
                    Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
                    setActiveSort(s);
                  }}
                  style={[
                    styles.sortChip,
                    isActive && styles.sortChipActive,
                  ]}
                >
                  <Text
                    style={[
                      styles.sortChipText,
                      isActive && styles.sortChipTextActive,
                    ]}
                  >
                    {s}
                  </Text>
                </Pressable>
              );
            })}
          </ScrollView>

          {/* Reviews list */}
          <ScrollView
            style={styles.scrollView}
            contentContainerStyle={[
              styles.scrollContent,
              { paddingBottom: insets.bottom + SPACING.xl },
            ]}
            showsVerticalScrollIndicator={false}
          >
            {reviews.map((attraction, index) => {
              const anim = fadeAnims[index] || new Animated.Value(1);
              const verdictColor = VERDICT_COLORS[attraction.rating];
              const isSkip = attraction.rating === 'SKIP IT';

              return (
                <Animated.View
                  key={`${attraction.name}-${activeFilter}-${activeSort}`}
                  style={[
                    styles.card,
                    {
                      opacity: anim,
                      transform: [
                        {
                          translateY: anim.interpolate({
                            inputRange: [0, 1],
                            outputRange: [24, 0],
                          }),
                        },
                      ],
                    },
                  ]}
                >
                  {/* Verdict badge */}
                  <View style={[styles.verdictBadge, { backgroundColor: verdictColor }]}>
                    <Text style={styles.verdictText}>{attraction.rating}</Text>
                  </View>

                  {/* Name */}
                  <Text style={styles.attractionName}>{attraction.name}</Text>

                  {/* Honest take */}
                  <Text style={styles.honestTake}>{attraction.honestTake}</Text>

                  {/* Crowd indicator */}
                  <CrowdIndicator level={attraction.crowdLevel} />

                  {/* Cost + Time badges */}
                  <View style={styles.badgeRow}>
                    <View style={styles.infoBadge}>
                      <Text style={styles.infoBadgeLabel}>{t('honestReviews.cost')}</Text>
                      <Text style={styles.infoBadgeValue}>{attraction.cost}</Text>
                    </View>
                    <View style={styles.infoBadge}>
                      <Text style={styles.infoBadgeLabel}>Time</Text>
                      <Text style={styles.infoBadgeValue}>{attraction.timeNeeded}</Text>
                    </View>
                  </View>

                  {/* Best time (only for non-SKIP) */}
                  {!isSkip && attraction.bestTime !== '' && (
                    <View style={styles.bestTimeRow}>
                      <Text style={styles.bestTimeLabel}>{t('honestReviews.bestTime')}</Text>
                      <Text style={styles.bestTimeValue}>{attraction.bestTime}</Text>
                    </View>
                  )}

                  {/* DO THIS INSTEAD (only for SKIP IT) */}
                  {isSkip && attraction.bestAlternative !== '' && (
                    <View style={styles.alternativeCard}>
                      <Text style={styles.alternativeLabel}>{t('honestReviews.doThisInstead')}</Text>
                      <Text style={styles.alternativeText}>
                        {attraction.bestAlternative}
                      </Text>
                    </View>
                  )}

                  {/* Alternative for MIXED ratings too */}
                  {attraction.rating === 'MIXED' && attraction.bestAlternative !== '' && (
                    <View style={[styles.alternativeCard, styles.alternativeCardMixed]}>
                      <Text style={[styles.alternativeLabel, { color: COLORS.gold }]}>
                        {t('honestReviews.alternative')}
                      </Text>
                      <Text style={styles.alternativeText}>
                        {attraction.bestAlternative}
                      </Text>
                    </View>
                  )}

                  {/* Insider tip callout */}
                  <View style={styles.tipCallout}>
                    <Text style={styles.tipLabel}>{t('honestReviews.insiderTip')}</Text>
                    <Text style={styles.tipText}>{attraction.insiderTip}</Text>
                  </View>
                </Animated.View>
              );
            })}

            {reviews.length === 0 && (
              <View style={styles.emptyState}>
                <Text style={styles.emptyText}>
                  No {activeFilter.toLowerCase()} attractions found for {cityName}.
                </Text>
              </View>
            )}
          </ScrollView>
        </>
      )}
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

  // Header
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: SPACING.lg,
    paddingTop: SPACING.md,
    paddingBottom: SPACING.sm,
  } as ViewStyle,
  backButton: {
    width: 40,
    height: 40,
    borderRadius: RADIUS.full,
    backgroundColor: COLORS.bgGlass,
    borderWidth: 1,
    borderColor: COLORS.border,
    alignItems: 'center',
    justifyContent: 'center',
    marginEnd: SPACING.md,
  } as ViewStyle,
  headerText: {
    flex: 1,
  } as ViewStyle,
  headerTitle: {
    fontFamily: FONTS.header,
    fontSize: 28,
    color: COLORS.cream,
    letterSpacing: -0.5,
  } as TextStyle,
  headerSubtitle: {
    fontFamily: FONTS.mono,
    fontSize: 12,
    color: COLORS.creamMuted,
    marginTop: 2,
    textTransform: 'uppercase',
    letterSpacing: 1.5,
  } as TextStyle,

  // Tagline
  taglineWrap: {
    paddingHorizontal: SPACING.lg,
    paddingBottom: SPACING.md,
  } as ViewStyle,
  tagline: {
    fontFamily: FONTS.bodyMedium,
    fontSize: 13,
    color: COLORS.sage,
    lineHeight: 18,
  } as TextStyle,

  // Filter chips
  chipRow: {
    paddingHorizontal: SPACING.lg,
    paddingBottom: SPACING.sm,
    gap: SPACING.sm,
    flexDirection: 'row',
  } as ViewStyle,
  chip: {
    paddingHorizontal: SPACING.md,
    paddingVertical: SPACING.xs + 2,
    borderRadius: RADIUS.full,
    borderWidth: 1,
    borderColor: COLORS.border,
    backgroundColor: 'transparent',
  } as ViewStyle,
  chipText: {
    fontFamily: FONTS.monoMedium,
    fontSize: 12,
    color: COLORS.creamMuted,
    textTransform: 'uppercase',
    letterSpacing: 1,
  } as TextStyle,

  // Sort row
  sortRow: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: SPACING.lg,
    paddingBottom: SPACING.md,
    gap: SPACING.sm,
  } as ViewStyle,
  sortLabel: {
    fontFamily: FONTS.mono,
    fontSize: 11,
    color: COLORS.creamMuted,
    textTransform: 'uppercase',
    letterSpacing: 1,
    marginEnd: SPACING.xs,
  } as TextStyle,
  sortChip: {
    paddingHorizontal: SPACING.sm + 4,
    paddingVertical: SPACING.xs,
    borderRadius: RADIUS.sm,
    backgroundColor: 'transparent',
    borderWidth: 1,
    borderColor: COLORS.border,
  } as ViewStyle,
  sortChipActive: {
    backgroundColor: COLORS.whiteFaintBorder,
    borderColor: COLORS.cream,
  } as ViewStyle,
  sortChipText: {
    fontFamily: FONTS.mono,
    fontSize: 11,
    color: COLORS.creamMuted,
  } as TextStyle,
  sortChipTextActive: {
    color: COLORS.cream,
  } as TextStyle,

  // Scroll
  scrollView: {
    flex: 1,
  } as ViewStyle,
  scrollContent: {
    paddingHorizontal: SPACING.lg,
    gap: SPACING.lg,
  } as ViewStyle,

  // Card
  card: {
    backgroundColor: COLORS.bgGlass,
    borderRadius: RADIUS.lg,
    borderWidth: 1,
    borderColor: COLORS.border,
    padding: SPACING.lg,
    overflow: 'hidden',
  } as ViewStyle,

  // Verdict badge
  verdictBadge: {
    alignSelf: 'flex-start',
    paddingHorizontal: SPACING.sm + 4,
    paddingVertical: SPACING.xs,
    borderRadius: RADIUS.sm,
    marginBottom: SPACING.sm,
  } as ViewStyle,
  verdictText: {
    fontFamily: FONTS.monoMedium,
    fontSize: 11,
    color: COLORS.bg,
    textTransform: 'uppercase',
    letterSpacing: 1.5,
  } as TextStyle,

  // Attraction name
  attractionName: {
    fontFamily: FONTS.header,
    fontSize: 24,
    color: COLORS.cream,
    marginBottom: SPACING.sm,
    letterSpacing: -0.3,
  } as TextStyle,

  // Honest take
  honestTake: {
    fontFamily: FONTS.body,
    fontSize: 15,
    color: COLORS.creamMuted,
    lineHeight: 24,
    marginBottom: SPACING.md,
  } as TextStyle,

  // Crowd indicator
  crowdRow: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: SPACING.md,
    gap: SPACING.sm,
  } as ViewStyle,
  crowdLabel: {
    fontFamily: FONTS.mono,
    fontSize: 10,
    color: COLORS.creamMuted,
    textTransform: 'uppercase',
    letterSpacing: 1,
  } as TextStyle,
  crowdDots: {
    flexDirection: 'row',
    gap: 4,
  } as ViewStyle,
  crowdDot: {
    width: 8,
    height: 8,
    borderRadius: 4,
  } as ViewStyle,
  crowdText: {
    fontFamily: FONTS.monoMedium,
    fontSize: 11,
    letterSpacing: 0.5,
  } as TextStyle,

  // Info badges
  badgeRow: {
    flexDirection: 'row',
    gap: SPACING.sm,
    marginBottom: SPACING.md,
  } as ViewStyle,
  infoBadge: {
    backgroundColor: COLORS.bgCard,
    borderRadius: RADIUS.sm,
    paddingHorizontal: SPACING.sm + 4,
    paddingVertical: SPACING.xs + 2,
    borderWidth: 1,
    borderColor: COLORS.border,
  } as ViewStyle,
  infoBadgeLabel: {
    fontFamily: FONTS.mono,
    fontSize: 9,
    color: COLORS.creamMuted,
    textTransform: 'uppercase',
    letterSpacing: 1,
    marginBottom: 2,
  } as TextStyle,
  infoBadgeValue: {
    fontFamily: FONTS.bodyMedium,
    fontSize: 13,
    color: COLORS.cream,
  } as TextStyle,

  // Best time
  bestTimeRow: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: SPACING.md,
    gap: SPACING.sm,
  } as ViewStyle,
  bestTimeLabel: {
    fontFamily: FONTS.mono,
    fontSize: 10,
    color: COLORS.creamMuted,
    textTransform: 'uppercase',
    letterSpacing: 1,
  } as TextStyle,
  bestTimeValue: {
    fontFamily: FONTS.bodyMedium,
    fontSize: 13,
    color: COLORS.sage,
    flex: 1,
  } as TextStyle,

  // Alternative card (SKIP IT)
  alternativeCard: {
    backgroundColor: COLORS.sageLight,
    borderRadius: RADIUS.md,
    padding: SPACING.md,
    marginBottom: SPACING.md,
    borderWidth: 1,
    borderColor: COLORS.sageStrong,
  } as ViewStyle,
  alternativeCardMixed: {
    backgroundColor: COLORS.goldMuted,
    borderColor: COLORS.goldBorderStrong,
  } as ViewStyle,
  alternativeLabel: {
    fontFamily: FONTS.monoMedium,
    fontSize: 10,
    color: COLORS.sage,
    textTransform: 'uppercase',
    letterSpacing: 1.5,
    marginBottom: SPACING.xs,
  } as TextStyle,
  alternativeText: {
    fontFamily: FONTS.body,
    fontSize: 14,
    color: COLORS.cream,
    lineHeight: 22,
  } as TextStyle,

  // Insider tip
  tipCallout: {
    borderLeftWidth: 2,
    borderLeftColor: COLORS.sage,
    paddingStart: SPACING.md,
    paddingVertical: SPACING.xs,
  } as ViewStyle,
  tipLabel: {
    fontFamily: FONTS.monoMedium,
    fontSize: 9,
    color: COLORS.sage,
    textTransform: 'uppercase',
    letterSpacing: 2,
    marginBottom: SPACING.xs,
  } as TextStyle,
  tipText: {
    fontFamily: FONTS.body,
    fontSize: 13,
    color: COLORS.creamMuted,
    lineHeight: 20,
  } as TextStyle,

  // Fallback
  fallbackContainer: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
    paddingHorizontal: SPACING.xl,
  } as ViewStyle,
  fallbackTitle: {
    fontFamily: FONTS.header,
    fontSize: 24,
    color: COLORS.cream,
    textAlign: 'center',
    marginBottom: SPACING.md,
  } as TextStyle,
  fallbackBody: {
    fontFamily: FONTS.body,
    fontSize: 15,
    color: COLORS.creamMuted,
    textAlign: 'center',
    lineHeight: 24,
    marginBottom: SPACING.xl,
  } as TextStyle,
  fallbackButton: {
    paddingHorizontal: SPACING.xl,
    paddingVertical: SPACING.sm + 4,
    borderRadius: RADIUS.full,
    borderWidth: 1,
    borderColor: COLORS.sage,
  } as ViewStyle,
  fallbackButtonText: {
    fontFamily: FONTS.monoMedium,
    fontSize: 13,
    color: COLORS.sage,
    textTransform: 'uppercase',
    letterSpacing: 1,
  } as TextStyle,

  // Empty state (filter yields nothing)
  emptyState: {
    alignItems: 'center',
    paddingTop: SPACING.xxxl,
  } as ViewStyle,
  emptyText: {
    fontFamily: FONTS.body,
    fontSize: 15,
    color: COLORS.creamMuted,
    textAlign: 'center',
  } as TextStyle,
});

export default withComingSoon(HonestReviews, { routeName: 'honest-reviews', title: 'Honest Reviews' });
