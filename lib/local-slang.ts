// =============================================================================
// ROAM — Local Slang, Gestures & Cultural Phrases
// The phrases that make locals smile and say "where did you learn that?"
// NOT basic survival ("hello", "thank you") — those are in survival-phrases.ts
// =============================================================================

export interface LocalPhrase {
  readonly phrase: string;
  readonly pronunciation: string;
  readonly meaning: string;
  readonly context: string;
  readonly funFact?: string;
  readonly category: 'slang' | 'gesture' | 'expression' | 'food-order' | 'compliment';
}

// ---------------------------------------------------------------------------
// Curated phrases — the kind a local friend would actually teach you
// ---------------------------------------------------------------------------

const SLANG: Record<string, readonly LocalPhrase[]> = {
  tokyo: [
    {
      phrase: 'お疲れ様 (Otsukare-sama)',
      pronunciation: 'oh-tsoo-kah-reh-sah-mah',
      meaning: 'Good work / You must be tired',
      context: 'Say this to anyone after literally anything — finishing a meal, getting off a train, wrapping up a meeting. It acknowledges effort and is universally received well.',
      funFact: 'There is no direct English translation. It is both a greeting and a toast and a thank-you — all in one.',
      category: 'expression',
    },
    {
      phrase: 'やばい (Yabai)',
      pronunciation: 'yah-bye',
      meaning: 'Wow / Amazing / That\'s wild (or terrible)',
      context: 'Gen Z slang that has completely inverted its original meaning. It used to mean "dangerous." Now it means anything intense — incredible food, a scary film, a surprising plot twist. Let context guide you.',
      funFact: 'Older Japanese people still hear it as negative. Use it with people under 35.',
      category: 'slang',
    },
    {
      phrase: 'なるほど (Naruhodo)',
      pronunciation: 'nah-roo-hoh-doh',
      meaning: 'I see / That makes sense / Ah, right',
      context: 'Drop this mid-conversation while someone explains something. It signals active listening and makes you sound like a thoughtful person rather than a tourist saying "okay."',
      category: 'expression',
    },
    {
      phrase: 'おまかせで (Omakase de)',
      pronunciation: 'oh-mah-kah-seh-deh',
      meaning: 'I\'ll leave it to you / Chef\'s choice',
      context: 'Say this at any restaurant when you want the chef to decide. Works at a ramen counter, a sushi bar, even a standing izakaya. It signals trust and usually gets you something special.',
      funFact: 'Literally means "I entrust it to you" — a profound concept in Japanese hospitality.',
      category: 'food-order',
    },
    {
      phrase: 'すごい (Sugoi)',
      pronunciation: 'soo-goy',
      meaning: 'Amazing / Incredible / Wow',
      context: 'The most versatile compliment in Japanese. Say it when someone shows you something they made, when food arrives beautifully plated, or when a view stops you in your tracks.',
      category: 'compliment',
    },
    {
      phrase: 'いただきます (Itadakimasu)',
      pronunciation: 'ee-tah-dah-kee-mahs',
      meaning: 'I humbly receive (said before eating)',
      context: 'Say it with hands together before every meal, even solo. This is not optional — skipping it is like starting to eat at someone\'s dinner table before the host sits down.',
      funFact: 'It thanks not just the cook but the entire chain of people who brought the food to your table, including the animal or plant itself.',
      category: 'expression',
    },
  ],

  paris: [
    {
      phrase: 'C\'est n\'importe quoi',
      pronunciation: 'say neh-port kwah',
      meaning: 'That\'s nonsense / What a joke / Unbelievable',
      context: 'The perfect response when anything frustrates you — a delayed train, a bad menu, a confusing policy. Parisians say this constantly and it will get you a conspiratorial nod every time.',
      funFact: 'Literally translates to "it\'s no matter what" — which somehow became the most satisfying complaint phrase in French.',
      category: 'expression',
    },
    {
      phrase: 'Bof',
      pronunciation: 'boff (rhymes with off)',
      meaning: 'Meh / So-so / I don\'t particularly care',
      context: 'The French shrug, compressed into one syllable. Say it with a slight lip-pout and a downward head tilt. Use it when asked "how was the wine?" or "did you like that film?" Parisians will recognise one of their own.',
      funFact: 'No other language has a word quite like it. It encapsulates the French philosophy of measured enthusiasm.',
      category: 'expression',
    },
    {
      phrase: 'C\'est pas faux',
      pronunciation: 'say pah foh',
      meaning: 'That\'s not wrong / I can\'t argue with that',
      context: 'The French way of agreeing without fully committing. When someone makes a solid point, this is classier than "yes." It implies you\'ve genuinely considered the argument.',
      category: 'expression',
    },
    {
      phrase: 'La même chose, s\'il vous plaît',
      pronunciation: 'lah mem shows, seel voo play',
      meaning: 'The same thing, please',
      context: 'Point at what someone nearby is drinking or eating and say this. Works at any café or bistro. Far more charming than fumbling through a menu in broken French.',
      category: 'food-order',
    },
    {
      phrase: 'Trop bien',
      pronunciation: 'troh byeh',
      meaning: 'So good / Awesome / Really great',
      context: 'The go-to compliment for anything you enjoyed. Food, a neighbourhood, a neighbourhood bar — "c\'était trop bien." Young Parisians use it like Australians use "legend."',
      category: 'compliment',
    },
    {
      phrase: 'Sympa',
      pronunciation: 'sym-pah',
      meaning: 'Nice / Cool / Pleasant (about a person or place)',
      context: 'A warm but measured compliment. "C\'est sympa ici" (it\'s nice here) is the highest praise a Parisian will offer in a restaurant for the first fifteen minutes.',
      category: 'slang',
    },
  ],

  bangkok: [
    {
      phrase: 'สนุก (Sanuk)',
      pronunciation: 'sah-nook',
      meaning: 'Fun / Enjoyable / Worth doing',
      context: 'Central to Thai culture — Thais evaluate almost everything by whether it\'s sanuk. If something isn\'t sanuk, why do it? Say it about a night market, a tuk-tuk ride, a meal. Watch faces light up.',
      funFact: 'Sanuk is a genuine Thai life philosophy, not just a word. The country\'s famous warmth is partly built around the idea that everything should have some sanuk in it.',
      category: 'expression',
    },
    {
      phrase: 'ไม่เป็นไร (Mai pen rai)',
      pronunciation: 'my pen rye',
      meaning: 'No worries / Never mind / It\'s fine',
      context: 'Thailand\'s "hakuna matata." Use it when anything goes slightly wrong — spilled drink, missed bus, wrong order. It immediately de-escalates any situation and marks you as someone who understands Thai culture.',
      funFact: 'This phrase is so central to Thai identity that it appears in virtually every description of what makes Thailand Thai.',
      category: 'expression',
    },
    {
      phrase: 'อร่อยมาก (Aroy mak)',
      pronunciation: 'ah-roy mak',
      meaning: 'Very delicious',
      context: 'Say it to any street food vendor after eating. Even a mediocre attempt will get a huge smile. If the food genuinely is amazing, follow up with "aroy mak mak" — very, very delicious.',
      category: 'compliment',
    },
    {
      phrase: 'เอาอย่างนั้น (Ao yang nan)',
      pronunciation: 'ao yang nan',
      meaning: 'I\'ll have that / Same as that one',
      context: 'Point at the dish someone nearby is eating and say this. Street food stalls often have no menus — this phrase plus a finger point is the native ordering method.',
      category: 'food-order',
    },
    {
      phrase: 'แป๊บนึง (Paep neung)',
      pronunciation: 'pep nuhng',
      meaning: 'One moment / Just a second',
      context: 'Useful everywhere — vendors say it to you, you can say it back when you need a minute to decide. Sounds fluent and earns you patience.',
      category: 'slang',
    },
    {
      phrase: 'เก่งมาก (Geng mak)',
      pronunciation: 'geng mak',
      meaning: 'Very skilled / Impressive / Well done',
      context: 'The Thai compliment for someone\'s abilities. Say it to a street food cook who flips perfect pad thai, a tuk-tuk driver who navigated insane traffic, a hotel staff member who sorted your problem fast.',
      category: 'compliment',
    },
  ],

  rome: [
    {
      phrase: 'Boh',
      pronunciation: 'boh (drawn out, with a shrug)',
      meaning: 'I dunno / Who knows / Could be anything',
      context: 'Always accompanied by the Italian hand gesture — fingers pressed together, hand tilted upward, then shaken slightly. Means everything from "I have no idea" to "your guess is as good as mine." Romans use it constantly.',
      funFact: 'The gesture alone (without the word) communicates the same thing. It is one of the most recognisable Italian gestures in the world.',
      category: 'gesture',
    },
    {
      phrase: 'Dai!',
      pronunciation: 'die! (rhymes with "sky")',
      meaning: 'Come on! / Let\'s go! / Oh come off it!',
      context: 'Extremely versatile Italian exclamation. "Dai, andiamo" means "come on, let\'s go." As a standalone "dai!" it means "you\'re kidding me" or "stop it." Tone does everything.',
      category: 'expression',
    },
    {
      phrase: 'Ma dai',
      pronunciation: 'mah die',
      meaning: 'No way / Seriously? / Come on, really?',
      context: 'The response to any surprising information. Someone tells you the espresso at that bar costs €4? "Ma dai." A friend claims they saw a famous person? "Ma dai." Pure disbelief, lightly expressed.',
      category: 'expression',
    },
    {
      phrase: 'Un caffè, per favore',
      pronunciation: 'oon kaf-feh, pehr fah-voh-reh',
      meaning: 'A coffee, please',
      context: 'In Italy, "caffè" means espresso. Say this, stand at the bar, drink it in 45 seconds, pay and leave. That\'s the protocol. Sitting down or lingering turns your €1 coffee into a €4 experience.',
      funFact: 'Rome has a "price at the bar vs. seated" two-tier system that is completely legal and displayed by law.',
      category: 'food-order',
    },
    {
      phrase: 'Che bello / Che bella',
      pronunciation: 'keh bel-loh / keh bel-lah',
      meaning: 'How beautiful (masculine/feminine)',
      context: 'Italian compliments are gendered to match the noun, not the person. "Che bello!" for a view, a dish, or a moment. "Che bella!" for a piazza, a woman, or a piece of art. Using the right one sounds truly fluent.',
      category: 'compliment',
    },
    {
      phrase: 'In bocca al lupo',
      pronunciation: 'een bok-kah al loo-poh',
      meaning: 'In the mouth of the wolf (good luck)',
      context: 'The Italian way to wish someone luck — and you must respond "crepi il lupo" (may the wolf die). Saying "grazie" instead of the response is considered bad luck. Use it before someone\'s big moment.',
      funFact: 'The correct response "crepi" essentially kills the omen of the wolf\'s mouth. It\'s a call-and-response deeply embedded in Italian culture.',
      category: 'expression',
    },
  ],

  barcelona: [
    {
      phrase: 'Tío / Tía',
      pronunciation: 'tee-oh / tee-ah',
      meaning: 'Dude / Man / Mate (gender-matched)',
      context: 'Say it constantly. Before a sentence, after a sentence, mid-sentence. "Tío, que bueno está esto" (dude, this is so good). In Barcelona it functions like "man" in California English — omnipresent and affectionate.',
      funFact: 'Literally means "uncle / aunt" but nobody thinks about that anymore. It\'s been slang for so long the original meaning is irrelevant.',
      category: 'slang',
    },
    {
      phrase: 'Mola (mucho)',
      pronunciation: 'moh-lah (moo-choh)',
      meaning: 'That\'s cool / I love it (so much)',
      context: 'Spanish/Catalan crossover slang that Barcelona uses heavily. "Mola este barrio" (this neighbourhood is cool), "mola mucho" (I really love it). A simple, high-impact approval.',
      category: 'slang',
    },
    {
      phrase: 'Ostres!',
      pronunciation: 'oss-tres',
      meaning: 'Wow / Oh wow / Gosh (Catalan)',
      context: 'Catalan exclamation of surprise or delight. Literally means "oysters" — a polite substitute for a stronger word. Using Catalan phrases in Barcelona is deeply appreciated; it shows you\'ve done your homework.',
      funFact: 'Catalans are proud of their language and culture. Even one Catalan word signals respect for their distinct identity from Spain.',
      category: 'expression',
    },
    {
      phrase: 'Gràcies (not gracias)',
      pronunciation: 'gra-see-ehs',
      meaning: 'Thank you (Catalan)',
      context: 'In Barcelona, use Catalan "gràcies" over Spanish "gracias" whenever possible. It signals that you know Catalonia has its own culture, not just a Spanish variant.',
      category: 'expression',
    },
    {
      phrase: 'Posa\'m un tallat',
      pronunciation: 'poh-sah mohn tah-yat',
      meaning: 'Give me a cortado (espresso with a little milk)',
      context: 'The Barcelona café order of choice — half espresso, half foamed milk, in a small glass. Ordering a cortado in Catalan ("tallat") at any neighbourhood café will earn you a nod of approval.',
      category: 'food-order',
    },
    {
      phrase: 'Quin xou!',
      pronunciation: 'keen show',
      meaning: 'What a show / What a scene (Catalan)',
      context: 'Use it for anything dramatic or spectacular — a street performer, a stunning view, a chaotic football match result. Catalans love it when tourists attempt their language.',
      category: 'compliment',
    },
  ],

  seoul: [
    {
      phrase: '대박 (Daebak)',
      pronunciation: 'deh-bak',
      meaning: 'Jackpot / Amazing / That\'s insane (good way)',
      context: 'The all-purpose Korean exclamation of amazement. Drop it when food arrives, when someone shows you something cool, or when anything exceeds expectations. Koreans under 40 will laugh and appreciate it immediately.',
      funFact: 'Literally means "jackpot" as in winning big. It crossed over from gambling slang to everyday speech and never looked back.',
      category: 'slang',
    },
    {
      phrase: '파이팅! (Paiting!)',
      pronunciation: 'pie-ting (not "fighting")',
      meaning: 'You can do it! / Let\'s go! / Come on!',
      context: 'Korea\'s motivational cheer — say it with a fist pump at any challenge or before any effort. Someone about to eat a scary-spicy dish? "Paiting!" Someone worried about a hike? "Paiting!" It\'s pure positive energy.',
      funFact: 'Borrowed from English "fighting" but the pronunciation shifted. Koreans sometimes spell it "hwaiting" to reflect how they say it.',
      category: 'expression',
    },
    {
      phrase: '맛있다 (Masitda)',
      pronunciation: 'mah-sit-dah',
      meaning: 'It\'s delicious',
      context: 'Say it after your first bite of anything. Korean food culture puts enormous pride in cooking, and a sincere "masitda" from a foreigner is one of the best compliments you can give.',
      category: 'compliment',
    },
    {
      phrase: '진짜? (Jinjja?)',
      pronunciation: 'jin-jjah?',
      meaning: 'Really? / Seriously? / For real?',
      context: 'The Korean "no way." Rising intonation turns it into a question, flat intonation makes it a statement of disbelief. Extremely versatile — use in any conversation when something surprises you.',
      category: 'slang',
    },
    {
      phrase: '한 잔 더 (Han jan deo)',
      pronunciation: 'han jan duh',
      meaning: 'One more glass',
      context: 'Essential at any Korean dinner or pojangmacha (street bar). Koreans pour for each other — never for themselves — so offering to pour "one more glass" while saying this phrase is proper form.',
      funFact: 'In Korean drinking culture, letting someone\'s glass sit empty is considered bad hosting. Always watch your neighbour\'s glass.',
      category: 'food-order',
    },
    {
      phrase: '어디 가세요? (Eodi gaseyo?)',
      pronunciation: 'uh-dee gah-seh-yo?',
      meaning: 'Where are you going? (also a greeting)',
      context: 'A classic Korean greeting that isn\'t actually asking where you\'re going — it\'s just a warm check-in. The correct response is simply "I\'m just going out" or a vague direction. Koreans use it like "how are you?"',
      category: 'expression',
    },
  ],

  london: [
    {
      phrase: 'Cheers',
      pronunciation: 'cheerz',
      meaning: 'Thanks / You\'re welcome / Goodbye (NOT a toast)',
      context: 'In London, "cheers" replaces "thank you" in almost every casual interaction. Barista hands you a coffee — "cheers." Someone holds a door — "cheers." It is NOT primarily a drinking toast here. Use it constantly.',
      funFact: 'Americans using "cheers" as a toast in London pubs always confuse locals, who have already moved on to using it as a casual sign-off for everything.',
      category: 'expression',
    },
    {
      phrase: 'Proper',
      pronunciation: 'prop-uh',
      meaning: 'Really / Genuinely / Very (intensifier)',
      context: 'Drop "proper" before anything you want to emphasise. "That\'s proper good," "it was proper busy," "a proper dodgy area." Using it correctly will earn you instant credibility.',
      category: 'slang',
    },
    {
      phrase: 'Alright?',
      pronunciation: 'aw-right? (fast, almost "awright?")',
      meaning: 'Hey / How are you? (not actually asking)',
      context: 'The standard London greeting — "alright?" — does not require a detailed answer. "Yeah, alright" is the correct response, not a breakdown of your day. It\'s a handshake in word form.',
      funFact: 'Answering "alright?" with an actual assessment of your wellbeing is a social faux pas that marks you immediately as non-local.',
      category: 'expression',
    },
    {
      phrase: 'Sorted',
      pronunciation: 'saw-tid',
      meaning: 'Done / Fixed / All good',
      context: 'When something is arranged, solved, or handled — it\'s "sorted." Hotel booking confirmed? Sorted. Taxi booked? Sorted. Problem resolved? Sorted. It\'s the satisfying full stop on any logistical moment.',
      category: 'slang',
    },
    {
      phrase: 'Brilliant',
      pronunciation: 'brill-yant',
      meaning: 'Great / Excellent / Wonderful',
      context: 'Where Americans say "awesome" or "amazing," Londoners often say "brilliant." The bar for "brilliant" is actually lower than it sounds — it\'s warm, everyday approval rather than over-the-top praise.',
      category: 'compliment',
    },
    {
      phrase: 'Fancy a pint?',
      pronunciation: 'fan-see uh pynt?',
      meaning: 'Do you want to go for a beer?',
      context: 'The cultural invitation. Accepting it means you are going to a pub, you will probably stay longer than you planned, and you will have a good time. Declining with "I don\'t drink" is fine — just say "fancy a drink?" instead.',
      category: 'expression',
    },
  ],

  bali: [
    {
      phrase: 'Sudah makan?',
      pronunciation: 'soo-dah mah-kan',
      meaning: 'Have you eaten?',
      context: 'The Indonesian greeting that isn\'t actually asking about food — it\'s expressing genuine care about your wellbeing, the way "how are you?" does in English. Answer "sudah" (yes) or "belum" (not yet).',
      funFact: 'Food is so central to Indonesian culture that checking if someone has eaten became the primary way of asking "are you okay?" This phrase connects you immediately to that warmth.',
      category: 'expression',
    },
    {
      phrase: 'Enak banget',
      pronunciation: 'eh-nak bang-et',
      meaning: 'So delicious / Really tasty',
      context: 'Say it at any warung after your first bite. Balinese and Indonesian cooks put deep pride into their food, and a foreigner pulling out "enak banget" without being prompted is one of the best compliments you can offer.',
      category: 'compliment',
    },
    {
      phrase: 'Santai aja',
      pronunciation: 'san-tie ah-jah',
      meaning: 'Just relax / Take it easy / No rush',
      context: 'Bali\'s philosophy in two words. When traffic is bad, when things are slow, when you\'re on Bali time — "santai aja." It signals you\'ve accepted the pace of the island rather than fighting it.',
      funFact: '"Santai" (relax) is one of the first Indonesian words visitors learn and one of the last they forget.',
      category: 'slang',
    },
    {
      phrase: 'Satu lagi',
      pronunciation: 'sah-too lah-gee',
      meaning: 'One more',
      context: 'Point at your empty Bintang and say "satu lagi" to the warung owner. Works for food, drinks, or anything you want repeated. Instantly understood everywhere in Indonesia.',
      category: 'food-order',
    },
    {
      phrase: 'Bagus sekali',
      pronunciation: 'bah-goos seh-kah-lee',
      meaning: 'Very good / Excellent',
      context: 'The formal-ish version of a compliment — use it for genuinely impressive things. A beautifully carved temple gate, a stunning rice terrace view, or exceptional craftsmanship at a market. More weight than "bagus" alone.',
      category: 'compliment',
    },
    {
      phrase: 'Pelan-pelan',
      pronunciation: 'peh-lan peh-lan',
      meaning: 'Slowly, slowly',
      context: 'Say this to any driver who is going faster than you\'d like, or to yourself as a reminder that Bali operates on its own timeline. Locals say it affectionately when foreigners rush around needlessly.',
      funFact: 'The repetition is Indonesian grammar for emphasis — "pelan" means slow, and doubling it means "really slow down." It\'s also how you\'d ask a child to be careful.',
      category: 'expression',
    },
  ],
};

// ---------------------------------------------------------------------------
// Public API
// ---------------------------------------------------------------------------

export function getLocalSlang(destination: string): readonly LocalPhrase[] {
  const key = destination.toLowerCase().trim();
  return SLANG[key] ?? [];
}

export function getSlangByCategory(
  destination: string,
  category: LocalPhrase['category']
): readonly LocalPhrase[] {
  return getLocalSlang(destination).filter((p) => p.category === category);
}

export function hasLocalSlang(destination: string): boolean {
  return getLocalSlang(destination).length > 0;
}

export const SLANG_CATEGORY_LABELS: Record<LocalPhrase['category'], string> = {
  slang: 'Slang',
  gesture: 'Gesture',
  expression: 'Expression',
  'food-order': 'Order like a local',
  compliment: 'Compliment',
} as const;

export const SLANG_CATEGORY_ICONS: Record<LocalPhrase['category'], string> = {
  slang: 'MessageCircle',
  gesture: 'Hand',
  expression: 'Smile',
  'food-order': 'UtensilsCrossed',
  compliment: 'Heart',
} as const;
