// =============================================================================
// ROAM — Travel Truths
// "Tell me something true" — curated truths about real places.
// Not tips. Not recommendations. True things.
// The kind of things that make someone stop scrolling and think.
// =============================================================================

export interface TravelTruth {
  destination: string;
  country: string;
  truth: string;
}

// ---------------------------------------------------------------------------
// Curated library — rotate daily, show one at a time
// ---------------------------------------------------------------------------
const TRUTHS: TravelTruth[] = [
  // Japan
  {
    destination: 'Japan',
    country: 'JP',
    truth: "In Japan, it's considered rude to eat while walking. Except at festivals. At festivals everyone eats while walking and it's one of the best things about being there.",
  },
  {
    destination: 'Tokyo',
    country: 'JP',
    truth: "Tokyo has more Michelin-starred restaurants than Paris. Most of them are tiny places with six seats and one chef who's been making the same dish for forty years.",
  },
  {
    destination: 'Kyoto',
    country: 'JP',
    truth: 'In Kyoto, there are over 2,000 temples. Most tourists see three. The best ones have no English signs and require walking up a mountain path that no guidebook mentions.',
  },
  {
    destination: 'Tokyo',
    country: 'JP',
    truth: "Shinjuku Station handles 3.6 million passengers per day. That's more people than the entire population of Berlin. And somehow, the trains are never late.",
  },

  // France
  {
    destination: 'Paris',
    country: 'FR',
    truth: "The best food in Paris is not in restaurants. It's in the markets on Saturday morning. Bread from a boulangerie, cheese from a fromagerie, eaten on a bench by the Seine. No reservation required.",
  },
  {
    destination: 'Paris',
    country: 'FR',
    truth: "The Louvre has 380,000 objects but most people only see one. They stand in a crowd for 30 seconds, take a photo of the Mona Lisa, and leave. The Winged Victory of Samothrace is better. It's on the stairs.",
  },
  {
    destination: 'Paris',
    country: 'FR',
    truth: 'Parisians spend more time sitting in cafés than almost any other activity outside of sleep. This is not laziness. This is a life philosophy most people take decades to understand.',
  },

  // Thailand
  {
    destination: 'Thailand',
    country: 'TH',
    truth: "Thailand has a concept called 'sanuk' — roughly: everything worth doing should be fun. If it's not fun, it's not worth doing. This philosophy makes the country completely confusing and completely wonderful.",
  },
  {
    destination: 'Bangkok',
    country: 'TH',
    truth: "Bangkok's real name has 168 letters. Locals call it Krung Thep. It means 'City of Angels.' Sound familiar? That's because Los Angeles stole the nickname.",
  },
  {
    destination: 'Thailand',
    country: 'TH',
    truth: "Thai people will never tell you the food is spicy enough to hurt. They'll just smile and watch. If a local says 'a little spicy,' you should be afraid.",
  },

  // Italy
  {
    destination: 'Rome',
    country: 'IT',
    truth: "Italians don't drink cappuccino after 11 AM. Ever. If you order one at dinner they'll make it for you but something will have changed in how they look at you.",
  },
  {
    destination: 'Rome',
    country: 'IT',
    truth: "There's a keyhole on Aventine Hill in Rome. Look through it. You see the dome of St. Peter's, perfectly framed by a tunnel of hedges. Three sovereign states in one view. Italy, Malta, Vatican City.",
  },
  {
    destination: 'Italy',
    country: 'IT',
    truth: "In Italy, dinner before 8 PM is a tourist activity. Real dinner starts at 9. The good restaurants don't even open before 7:30.",
  },

  // Mexico
  {
    destination: 'Mexico City',
    country: 'MX',
    truth: 'Mexico City sinks 10 inches per year because it was built on a lake. The Aztecs put it there on purpose. They saw an eagle eating a snake on a cactus and said: here. That image is on the flag.',
  },
  {
    destination: 'Oaxaca',
    country: 'MX',
    truth: "In Oaxaca, there are seven types of mole. Each one takes days to make. The woman making it learned from her mother who learned from hers. The recipe is never written down.",
  },
  {
    destination: 'Mexico',
    country: 'MX',
    truth: 'Mexican street corn — elote — is exactly the same everywhere and exactly perfect everywhere. Lime, mayo, chili, cheese. The person selling it from a cart has been doing it for 20 years. The cart hasn\'t moved.',
  },

  // Morocco
  {
    destination: 'Marrakech',
    country: 'MA',
    truth: "In Marrakech, getting lost in the medina is not a bug. It's the entire point. Every wrong turn leads to a courtyard or a craftsman or a cat sleeping in the sun.",
  },
  {
    destination: 'Morocco',
    country: 'MA',
    truth: 'Moroccan mint tea is poured from height — sometimes three feet. The foam matters. If there\'s no foam, the tea isn\'t right. This is one of many things Moroccans take seriously that the rest of the world forgot to care about.',
  },

  // Portugal
  {
    destination: 'Lisbon',
    country: 'PT',
    truth: 'Fado — the music of Lisbon — is the sound of missing something you never had. The Portuguese have a word for this: saudade. No English word captures it. You just have to hear it in a dark bar in Alfama at midnight.',
  },
  {
    destination: 'Lisbon',
    country: 'PT',
    truth: "Lisbon has the oldest bookshop in the world. Livraria Bertrand, open since 1732. That's before the United States existed. You can still buy a book there.",
  },

  // Colombia
  {
    destination: 'Medellín',
    country: 'CO',
    truth: "Medellín was once the most dangerous city on Earth. Now it has public escalators up the hillside slums, a metro system that's the city's pride, and a transformation that urban planners study worldwide. Comebacks are possible.",
  },
  {
    destination: 'Colombia',
    country: 'CO',
    truth: "Colombians say 'quiubo' as hello. It's a contraction of '¿qué hubo?' — what happened? The answer is always a smile. Always.",
  },

  // Turkey
  {
    destination: 'Istanbul',
    country: 'TR',
    truth: 'Istanbul is the only city in the world on two continents. You can eat breakfast in Europe and lunch in Asia. The ferry between them costs less than a dollar.',
  },
  {
    destination: 'Turkey',
    country: 'TR',
    truth: 'Turkish breakfast is not a meal. It is an event. Seventeen small dishes. Olives, cheeses, tomatoes, honey, clotted cream, eggs, bread. Nobody rushes. The table stays for two hours. This is civilized.',
  },

  // Argentina
  {
    destination: 'Buenos Aires',
    country: 'AR',
    truth: "Buenos Aires has more bookshops per capita than any city on Earth. One of them — El Ateneo Grand Splendid — is a converted theater. You read books where people once watched operas.",
  },
  {
    destination: 'Argentina',
    country: 'AR',
    truth: "Argentines eat dinner at 10 PM at the earliest. Lunch is at 2. Breakfast barely exists. The concept of 'eating early' causes genuine confusion.",
  },

  // Iceland
  {
    destination: 'Iceland',
    country: 'IS',
    truth: "Icelanders don't have surnames. They have patronymics. Björk's father is Guðmundur. So she's Björk Guðmundsdóttir. Daughter of Guðmundur. The phone book is sorted by first name.",
  },
  {
    destination: 'Iceland',
    country: 'IS',
    truth: 'In Iceland in June, the sun never sets. In December, it barely rises. The Icelanders handle this by reading more books per capita than any country on Earth and drinking enormous amounts of coffee.',
  },

  // South Korea
  {
    destination: 'Seoul',
    country: 'KR',
    truth: "In Korea, your age changes on January 1st, not your birthday. Everyone born in the same year is the same age. This means a baby born on December 31st turns two the next day. Koreans find this perfectly logical.",
  },
  {
    destination: 'Seoul',
    country: 'KR',
    truth: "Korean convenience stores are better than most restaurants. Kimbap, ramen made with an in-store hot water station, fried chicken at 2 AM. The 7-Eleven near Hongdae has saved more nights than any bar.",
  },

  // Indonesia
  {
    destination: 'Bali',
    country: 'ID',
    truth: "On Nyepi — Bali's Day of Silence — the entire island shuts down. No lights. No cars. No internet. No flying. Even the airport closes. One million people sit in the dark together. It's the quietest place on Earth for 24 hours.",
  },
  {
    destination: 'Bali',
    country: 'ID',
    truth: "Every morning in Bali, someone places a small offering — canang sari — on every doorstep, every shop counter, every car dashboard. Flowers, rice, incense. A daily thank you to the gods. The island smells like gratitude.",
  },

  // Spain
  {
    destination: 'Barcelona',
    country: 'ES',
    truth: 'The Sagrada Familia has been under construction since 1882. Gaudí knew he\'d never see it finished. He said: "My client is not in a hurry." He meant God. It might be done by 2026. Maybe.',
  },
  {
    destination: 'Spain',
    country: 'ES',
    truth: "Spain runs two hours behind its natural time zone because Franco wanted to align with Hitler's Germany and nobody ever changed it back. This is why dinner is at 10 PM. It's actually 8 PM. The whole country is gaslighting itself about time.",
  },

  // India
  {
    destination: 'India',
    country: 'IN',
    truth: 'The Indian head wobble means yes, no, maybe, I understand, I\'m listening, and okay all at once. After a week you\'ll start doing it. After two weeks you won\'t be able to stop.',
  },
  {
    destination: 'Jaipur',
    country: 'IN',
    truth: "Jaipur is called the Pink City because a king painted it all pink to impress Queen Victoria in 1876. She came. She was impressed. The paint stayed. It's been pink for 150 years.",
  },

  // Netherlands
  {
    destination: 'Amsterdam',
    country: 'NL',
    truth: "Amsterdam has more bikes than people. 881,000 bikes for 821,000 residents. About 12,000 end up in the canals every year. There's a boat whose only job is fishing them out.",
  },

  // Hungary
  {
    destination: 'Budapest',
    country: 'HU',
    truth: "Budapest is actually two cities — Buda and Pest — divided by the Danube. Buda is old and hilly and quiet. Pest is flat and loud and where you'll spend most of your money. Together they're perfect.",
  },

  // New Zealand
  {
    destination: 'New Zealand',
    country: 'NZ',
    truth: "New Zealand was the last habitable land mass to be settled by humans. The Māori arrived around 1300 AD. Before that, the only mammals were bats. Everything else was birds. Some of them were ten feet tall.",
  },

  // UAE
  {
    destination: 'Dubai',
    country: 'AE',
    truth: "In 1990, Dubai's skyline had exactly one tall building. Now it has over 200. The Burj Khalifa is so tall that people on the top floor see the sunset two minutes after people on the ground. Some residents break their Ramadan fast twice.",
  },

  // South Africa
  {
    destination: 'Cape Town',
    country: 'ZA',
    truth: "Cape Town has two oceans meeting at its tip — the Atlantic and the Indian. You can feel the temperature difference on the same beach. One side is freezing. The other side is swimmable. Nature doesn't care about your expectations.",
  },

  // Vietnam
  {
    destination: 'Hoi An',
    country: 'VN',
    truth: 'In Hoi An, you can get a custom suit made in 24 hours for $40. The tailors have been doing this for generations. They measure you once, from memory. The fit will be better than anything you own.',
  },

  // Georgia
  {
    destination: 'Tbilisi',
    country: 'GE',
    truth: "Georgia claims to have invented wine. Not as a marketing thing. As an archaeological fact. 8,000-year-old wine residue was found in clay pots there. The country's relationship with wine is not casual.",
  },
];

// ---------------------------------------------------------------------------
// Public API
// ---------------------------------------------------------------------------

/**
 * Get today's travel truth — cycles daily.
 */
export function getDailyTruth(): TravelTruth {
  const now = new Date();
  const start = new Date(now.getFullYear(), 0, 0);
  const diff = now.getTime() - start.getTime();
  const dayOfYear = Math.floor(diff / (1000 * 60 * 60 * 24));
  return TRUTHS[dayOfYear % TRUTHS.length];
}

/**
 * Get a random truth (for manual "tell me something" taps).
 */
export function getRandomTruth(): TravelTruth {
  return TRUTHS[Math.floor(Math.random() * TRUTHS.length)];
}

/**
 * Get a truth about a specific destination, or random if none found.
 */
export function getTruthAbout(destination: string): TravelTruth {
  const lower = destination.toLowerCase();
  const matching = TRUTHS.filter(
    (t) =>
      t.destination.toLowerCase() === lower ||
      t.country.toLowerCase() === lower
  );
  if (matching.length > 0) {
    return matching[Math.floor(Math.random() * matching.length)];
  }
  return getRandomTruth();
}

/**
 * Total truths available.
 */
export const TOTAL_TRUTHS = TRUTHS.length;
