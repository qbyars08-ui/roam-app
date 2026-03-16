// =============================================================================
// ROAM — German translations (Deutsch)
// Gen Z register: casual du-form, Denglish OK, zero corporate language
// DACH context: EUR for DE/AT, CHF for CH (handled in currency module)
// =============================================================================
import type { TranslationKeys } from './en';

const de: TranslationKeys = {
  // ---------------------------------------------------------------------------
  // Common / shared
  // ---------------------------------------------------------------------------
  common: {
    appName: 'ROAM',
    tryAgain: 'Nochmal versuchen',
    cancel: 'Abbrechen',
    save: 'Speichern',
    done: 'Fertig',
    close: 'Schlie\u00dfen',
    back: 'Zur\u00fcck',
    next: 'Weiter',
    skip: '\u00dcberspringen',
    continue: 'Weiter',
    loading: 'L\u00e4dt...',
    search: 'Suchen',
    share: 'Teilen',
    delete: 'L\u00f6schen',
    edit: 'Bearbeiten',
    confirm: 'Best\u00e4tigen',
    yes: 'Ja',
    no: 'Nein',
    ok: 'OK',
    error: 'Fehler',
    success: 'Geklappt',
    comingSoon: 'BALD VERF\u00dcGBAR',
    pro: 'PRO',
    free: 'KOSTENLOS',
    guest: 'Gast',
    viewAll: 'Alle anzeigen',
    seeMore: 'Mehr sehen',
    learnMore: 'Mehr erfahren',
    getStarted: 'Loslegen',
    days: '{{count}} Tag',
    days_other: '{{count}} Tage',
    perDay: '/Tag',
    offline: 'Du bist offline \u2014 gespeicherte Trips laufen noch',
  },

  // ---------------------------------------------------------------------------
  // Tab bar
  // ---------------------------------------------------------------------------
  tabs: {
    discover: 'Entdecken',
    generate: 'Planen',
    flights: 'Fl\u00fcge',
    stays: 'Unterk\u00fcnfte',
    food: 'Food',
    prep: 'Vorbereitung',
  },

  // ---------------------------------------------------------------------------
  // Error boundary
  // ---------------------------------------------------------------------------
  errorBoundary: {
    title: 'Na das h\u00e4tte nicht passieren d\u00fcrfen',
    subtitle: 'ROAM hat sich selbst aufgeh\u00e4ngt. Dr\u00fcck den Button \u2014 meistens haut das hin.',
    tryAgain: 'Nochmal versuchen',
  },

  // ---------------------------------------------------------------------------
  // Auth screens
  // ---------------------------------------------------------------------------
  auth: {
    signIn: 'Einloggen',
    signUp: 'Registrieren',
    logOut: 'Ausloggen',
    email: 'E-Mail',
    password: 'Passwort',
    forgotPassword: 'Passwort vergessen?',
    noAccount: 'Noch kein Account?',
    hasAccount: 'Schon einen Account?',
    continueWith: 'Weiter mit {{provider}}',
    continueAsGuest: 'Als Gast weitermachen',
    browseFirst: 'Erstmal st\u00f6bern',
    welcomeBack: 'Willkommen zur\u00fcck',
    createAccount: 'Account erstellen',
    orContinueWith: 'oder weiter mit',
    emailPlaceholder: 'deine@email.de',
    passwordPlaceholder: 'Dein Passwort',
    signInButton: 'Einloggen',
    signUpButton: 'Account erstellen',
    magicLink: 'Wir schicken dir einen Magic Link',
    checkEmail: 'Check deine Mails',
    checkEmailSub: 'Wir haben dir einen Login-Link an {{email}} geschickt. Einfach drauftippen.',
  },

  // ---------------------------------------------------------------------------
  // Onboarding
  // ---------------------------------------------------------------------------
  onboarding: {
    hookTitle: 'Deinen n\u00e4chsten Trip in 30 Sekunden planen',
    hookSubtitle: 'KI-Reisetipps, die tats\u00e4chlich Sinn ergeben.',
    valueTitle: 'Was du kriegst',
    valueItem1: 'Komplette Tages-Itineraries',
    valueItem2: 'Lokales Essen, Hidden Gems, echte Tipps',
    valueItem3: 'Wetter, Visum, Safety \u2014 alles drin',
    letsGo: "Let's go",
    whereFirst: 'Wohin zuerst?',
    howLong: 'Wie viele Tage?',
    whatBudget: 'Was ist dein Budget?',
    whatVibes: 'Welche Vibes?',
    pickAtLeast: 'Mindestens {{count}} ausw\u00e4hlen',
    generating: 'Dein Trip wird erstellt...',
  },

  // ---------------------------------------------------------------------------
  // Discover screen
  // ---------------------------------------------------------------------------
  discover: {
    searchPlaceholder: 'Reiseziele suchen...',
    trendingNow: 'Gerade angesagt',
    editorialHeaders: [
      'Reise, als w\u00fcrdest du dort jemanden kennen',
      'Such dir ein Ziel. Wir k\u00fcmmern uns um den Rest.',
      'Weniger planen. Mehr erleben.',
      '30 Sekunden bis zu deinem n\u00e4chsten Trip.',
      'Manche Trips planen sich von selbst. Dieser ist so einer.',
      'Sag uns wohin. Wir sagen dir alles.',
      'Das Schwere war die Wahl. Den Rest haben wir \u00fcbernommen.',
    ],
    bestIn: 'Am besten im {{month}}',
    dailyCost: '{{cost}}\u20ac/Tag',
    trending: 'trending',
  },

  // ---------------------------------------------------------------------------
  // Categories
  // ---------------------------------------------------------------------------
  categories: {
    all: 'Alles',
    beaches: 'Str\u00e4nde',
    mountains: 'Berge',
    cities: 'St\u00e4dte',
    food: 'Food',
    adventure: 'Abenteuer',
    budget: 'Budget',
    couples: 'P\u00e4rchen',
  },

  // ---------------------------------------------------------------------------
  // Budget tiers
  // ---------------------------------------------------------------------------
  budgets: {
    backpacker: 'G\u00fcnstig unterwegs',
    comfort: 'Komfortabel',
    treatYourself: 'G\u00f6nn dir was',
    noBudget: 'Ohne Limit',
    backpackerRange: '0\u201375\u20ac/Tag',
    comfortRange: '75\u2013200\u20ac/Tag',
    treatYourselfRange: '200\u2013500\u20ac/Tag',
    noBudgetRange: '500\u20ac+/Tag',
    backpackerVibe: 'Hostels, Streetfood und krasse Erinnerungen',
    comfortVibe: 'Coole Unterk\u00fcnfte ohne zu \u00fcbertreiben',
    treatYourselfVibe: 'Du verdienst es \u2014 machen wir es besonders',
    noBudgetVibe: 'Gib aus, was wirklich z\u00e4hlt',
  },

  // ---------------------------------------------------------------------------
  // Vibes
  // ---------------------------------------------------------------------------
  vibes: {
    localEats: 'Lokales Essen',
    hiddenGems: 'Hidden Gems',
    adrenaline: 'Adrenalin',
    sunsetChaser: 'Sunset Chaser',
    artDesign: 'Kunst & Design',
    nightOwl: 'Nachtmensch',
    slowMornings: 'Entspannte Morgen',
    deepHistory: 'Geschichte pur',
    beachVibes: 'Beach Vibes',
    marketHopper: 'Marktbummel',
    natureEscape: 'Raus in die Natur',
    soloFriendly: 'Solo reisen',
    dateNight: 'Date Night',
    photoWorthy: 'Instagrammable',
    wellness: 'Wellness',
    offTheGrid: 'Offline gehen',
  },

  // ---------------------------------------------------------------------------
  // Generate screen
  // ---------------------------------------------------------------------------
  generate: {
    title: 'Trip planen',
    quickMode: 'Schnell',
    conversationMode: 'Chat',
    quickModeDesc: 'Formular ausf\u00fcllen, kompletten Reiseplan kriegen',
    conversationModeDesc: 'Mit KI chatten und deinen Traumtrip planen',
    whereAreYouGoing: 'Wohin geht die Reise?',
    howManyDays: 'Wie viele Tage?',
    whatsYourBudget: 'Was ist dein Budget?',
    pickYourVibes: 'W\u00e4hl deine Vibes',
    generateTrip: 'Trip erstellen',
    generating: 'Wird erstellt...',
    generatingTrip: 'Dein Trip wird erstellt...',
    chatPlaceholder: 'Erz\u00e4hl mir von deinem Traumtrip...',
    chatStarters: [
      'Wo soll ich hinreisen?',
      'Was pack ich f\u00fcr Tokyo im April ein?',
      'Bestes Ramen in Tokyo unter 15\u20ac?',
      'Lohnt sich Bali gerade noch?',
      'Wie komme ich in Thailand an eine SIM-Karte?',
      'Was lohnt sich in Paris wirklich?',
      'Beste Viertel in Mexico City?',
    ],
  },

  // ---------------------------------------------------------------------------
  // Itinerary screen
  // ---------------------------------------------------------------------------
  itinerary: {
    dayN: 'Tag {{n}}',
    morning: 'Morgen',
    afternoon: 'Nachmittag',
    evening: 'Abend',
    packingList: 'Packliste',
    practicalInfo: 'Praktische Infos',
    weather: 'Wetter',
    visa: 'Visum',
    safety: 'Sicherheit',
    currency: 'W\u00e4hrung',
    saveTrip: 'Trip speichern',
    shareTrip: 'Trip teilen',
    tripSaved: 'Trip gespeichert!',
    tripShared: 'Trip geteilt!',
    noActivities: 'Noch keine Aktivit\u00e4ten',
    addActivity: 'Aktivit\u00e4t hinzuf\u00fcgen',
    editActivity: 'Aktivit\u00e4t bearbeiten',
    deleteActivity: 'Aktivit\u00e4t l\u00f6schen',
    whatToPack: 'Was einpacken',
    localTips: 'Lokale Tipps',
    gettingAround: 'So kommst du rum',
    whereToEat: 'Wo essen gehen',
    dontMiss: 'Unbedingt sehen',
  },

  // ---------------------------------------------------------------------------
  // Flights screen
  // ---------------------------------------------------------------------------
  flights: {
    title: 'Fl\u00fcge',
    searchFlights: 'Fl\u00fcge suchen',
    from: 'Von',
    to: 'Nach',
    departure: 'Abflug',
    return: 'R\u00fcckflug',
    oneWay: 'Nur Hinflug',
    roundTrip: 'Hin- und R\u00fcckflug',
    passengers: 'Passagiere',
    findFlights: 'Fl\u00fcge finden',
    cheapest: 'G\u00fcnstigste',
    fastest: 'Schnellste',
    bestValue: 'Bestes Preis-Leistungs-Verh\u00e4ltnis',
    noResults: 'Keine Fl\u00fcge gefunden',
    setHomeAirport: 'Heimatflughafen festlegen',
  },

  // ---------------------------------------------------------------------------
  // Stays screen
  // ---------------------------------------------------------------------------
  stays: {
    title: 'Unterk\u00fcnfte',
    searchStays: 'Unterk\u00fcnfte suchen',
    checkIn: 'Check-in',
    checkOut: 'Check-out',
    guests: 'G\u00e4ste',
    findStays: 'Unterk\u00fcnfte finden',
    hotels: 'Hotels',
    hostels: 'Hostels',
    apartments: 'Wohnungen',
    noResults: 'Keine Unterk\u00fcnfte gefunden',
  },

  // ---------------------------------------------------------------------------
  // Food screen
  // ---------------------------------------------------------------------------
  food: {
    title: 'Food',
    searchRestaurants: 'Restaurants suchen',
    nearMe: 'In meiner N\u00e4he',
    topRated: 'Top bewertet',
    bookmarked: 'Gespeichert',
    noResults: 'Keine Restaurants gefunden',
    priceRange: 'Preisklasse',
    cuisine: 'K\u00fcche',
    bookmark: 'Merken',
    unbookmark: 'Entfernen',
  },

  // ---------------------------------------------------------------------------
  // Prep screen
  // DE/AT: EUR (\u20ac) | CH: CHF (Fr.) — see currency module for runtime switching
  // ---------------------------------------------------------------------------
  prep: {
    title: 'Reisevorbereitung',
    packing: 'Packen',
    documents: 'Dokumente',
    health: 'Gesundheit',
    money: 'Geld',
    safety: 'Sicherheit',
    language: 'Sprache',
    weather: 'Wetter',
    visa: 'Visum',
    insurance: 'Versicherung',
    emergency: 'Notfall',
    checklist: 'Checkliste',
    allDone: 'Alles erledigt!',
    itemsLeft: '{{count}} Aufgabe \u00fcbrig',
    itemsLeft_other: '{{count}} Aufgaben \u00fcbrig',
  },

  // ---------------------------------------------------------------------------
  // Profile screen
  // ---------------------------------------------------------------------------
  profile: {
    title: 'Dein Profil',
    tripsBuilt: 'TRIPS ERSTELLT',
    thisMonth: 'DIESEN MONAT',
    createAccountUnlock: 'Account erstellen und freischalten',
    createAccountSub: 'Sync deine Trips, plan unbegrenzte Abenteuer und nutz alle Features.',
    planUnlimited: 'Unbegrenzte Trips planen',
    planUnlimitedSub: 'Keine Limits. Plan so viele Abenteuer wie du willst, wann immer die Inspiration kommt.',
    seeProPlans: 'Pro-Pl\u00e4ne ansehen',
    tripWrapped: 'Trip Wrapped',
    tripWrappedSub: 'Dein Jahr in Trips',
    travelAlterEgo: 'Reise-Alter-Ego-Quiz',
    tripDupeMode: 'Trip Dupe Mode',
    referFriends: 'Freunde einladen',
    exploreFeatures: 'Features entdecken',
    yourPlan: 'Dein Plan',
    emergencyContact: 'Notfallkontakt',
    emergencyContactTitle: 'Notfallkontakt',
    emergencyContactSub: 'Gib eine Telefonnummer f\u00fcr SOS-Alerts ein.',
    logOut: 'Ausloggen',
    logOutTitle: 'Schon weg?',
    logOutMessage: 'Du kannst jederzeit zur\u00fcckkommen.',
    thanksForRating: 'Danke f\u00fcrs Bewerten',
    devReset: 'Dev: Erstzustand zur\u00fccksetzen',
    language: 'Sprache',
    languageSub: 'W\u00e4hl deine bevorzugte Sprache',
  },

  // ---------------------------------------------------------------------------
  // Paywall / subscription
  // ---------------------------------------------------------------------------
  paywall: {
    title: 'Hol dir Pro',
    subtitle: 'Unbegrenzte Trips, null Limits',
    feature1: 'Unbegrenzte Trip-Erstellung',
    feature2: 'Komplette Tages-Itineraries',
    feature3: 'KI-Planung mit Priorit\u00e4t',
    feature4: 'Exklusive Destinationen',
    monthlyPlan: 'Monatlich',
    yearlyPlan: 'J\u00e4hrlich',
    perMonth: '/Monat',
    perYear: '/Jahr',
    bestValue: 'Bestes Angebot',
    subscribe: 'Abonnieren',
    restore: 'K\u00e4ufe wiederherstellen',
    terms: 'Nutzungsbedingungen',
    privacy: 'Datenschutzerkl\u00e4rung',
    trialInfo: '{{days}} Tage gratis testen, dann {{price}}/{{period}}',
    alreadyPro: 'Du bist schon Pro!',
    freeTripsUsed: 'Du hast deinen kostenlosen Trip diesen Monat genutzt',
    upgradeCTA: 'Upgrade f\u00fcr unbegrenzte Trips',
  },

  // ---------------------------------------------------------------------------
  // Saved trips
  // ---------------------------------------------------------------------------
  saved: {
    title: 'Gespeicherte Trips',
    noTrips: 'Noch keine gespeicherten Trips',
    noTripsSub: 'Erstell deinen ersten Trip und er taucht hier auf.',
    deleteTrip: 'Trip l\u00f6schen',
    deleteConfirm: 'Willst du diesen Trip wirklich l\u00f6schen?',
  },

  // ---------------------------------------------------------------------------
  // Passport / gamification
  // ---------------------------------------------------------------------------
  passport: {
    title: 'Dein Reisepass',
    countriesVisited: 'Besuchte L\u00e4nder',
    badges: 'Abzeichen',
    stamps: 'Stempel',
    level: 'Level {{n}}',
    xpToNext: '{{xp}} XP bis zum n\u00e4chsten Level',
    noBadges: 'Noch keine Abzeichen',
    noStamps: 'Noch keine Stempel',
    earnBadges: 'Verdien Abzeichen durchs Reisen und Erkunden!',
  },

  // ---------------------------------------------------------------------------
  // Group trips
  // ---------------------------------------------------------------------------
  groups: {
    title: 'Gruppenreise',
    createGroup: 'Gruppe erstellen',
    joinGroup: 'Gruppe beitreten',
    inviteCode: 'Einladungscode',
    enterCode: 'Einladungscode eingeben',
    join: 'Beitreten',
    members: 'Mitglieder',
    votes: 'Abstimmungen',
    expenses: 'Ausgaben',
    addExpense: 'Ausgabe hinzuf\u00fcgen',
    splitEvenly: 'Gleichm\u00e4\u00dfig aufteilen',
    youOwe: 'Du schuldest',
    owesYou: '{{name}} schuldet dir',
    settled: 'Ausgeglichen',
    inviteFriends: 'Freunde einladen',
    shareLink: 'Link teilen',
    leaveGroup: 'Gruppe verlassen',
  },

  // ---------------------------------------------------------------------------
  // Share card
  // ---------------------------------------------------------------------------
  shareCard: {
    title: 'Deinen Trip teilen',
    downloading: 'Share-Card wird erstellt...',
    shareNow: 'Jetzt teilen',
    copyLink: 'Link kopieren',
    linkCopied: 'Link kopiert!',
  },

  // ---------------------------------------------------------------------------
  // Weather
  // ---------------------------------------------------------------------------
  weather: {
    title: 'Wetter',
    feelsLike: 'Gef\u00fchlt',
    humidity: 'Luftfeuchtigkeit',
    wind: 'Wind',
    uvIndex: 'UV-Index',
    sunrise: 'Sonnenaufgang',
    sunset: 'Sonnenuntergang',
    forecast: '5-Tage-Vorhersage',
    packingTip: 'Packtipp',
    high: 'H',
    low: 'T',
  },

  // ---------------------------------------------------------------------------
  // Safety
  // ---------------------------------------------------------------------------
  safety: {
    title: 'Sicherheit',
    level1: 'Normale Vorsicht walten lassen',
    level2: 'Erh\u00f6hte Vorsicht',
    level3: 'Reise \u00fcberdenken',
    level4: 'Nicht reisen',
    source: 'Quelle: US State Department',
    neighborhoodSafety: 'Viertel-Sicherheit',
    emergencySOS: 'Notfall-SOS',
    sosActivated: 'SOS aktiviert',
    holdForSOS: 'Halten f\u00fcr SOS',
  },

  // ---------------------------------------------------------------------------
  // Currency
  // DE/AT: EUR | CH: CHF
  // ---------------------------------------------------------------------------
  currency: {
    title: 'W\u00e4hrung',
    exchangeRate: '1 {{from}} = {{rate}} {{to}}',
    lastUpdated: 'Aktualisiert {{time}}',
    convert: 'Umrechnen',
    homeCurrency: 'Heimw\u00e4hrung',
  },

  // ---------------------------------------------------------------------------
  // Language survival
  // ---------------------------------------------------------------------------
  languageSurvival: {
    title: 'Sprach\u00fcberlebenskit',
    essentialPhrases: 'Wichtige Phrasen',
    hello: 'Hallo',
    thankYou: 'Danke',
    please: 'Bitte',
    sorry: 'Entschuldigung',
    howMuch: 'Wie viel kostet das?',
    whereIs: 'Wo ist...?',
    help: 'Hilfe!',
    yes: 'Ja',
    no: 'Nein',
    tapToListen: 'Tippen zum Anh\u00f6ren',
  },

  // ---------------------------------------------------------------------------
  // Pets
  // ---------------------------------------------------------------------------
  pets: {
    title: 'Reisen mit Haustieren',
    addPet: 'Haustier hinzuf\u00fcgen',
    petName: 'Name des Haustieres',
    petType: 'Art des Haustieres',
    dog: 'Hund',
    cat: 'Katze',
    other: 'Anderes',
    petFriendly: 'Haustierfreundliche Reiseziele',
    petScore: 'Haustier-Score',
    reminders: 'Haustier-Erinnerungen',
  },

  // ---------------------------------------------------------------------------
  // Expense categories
  // ---------------------------------------------------------------------------
  expenses: {
    food: 'Essen',
    transport: 'Transport',
    accommodation: 'Unterkunft',
    activity: 'Aktivit\u00e4t',
    drinks: 'Getr\u00e4nke',
    other: 'Sonstiges',
  },

  // ---------------------------------------------------------------------------
  // Loading states
  // ---------------------------------------------------------------------------
  loadingStates: {
    generatingTrip: 'Dein Trip wird erstellt...',
    findingPlaces: 'Die besten Orte werden gefunden...',
    buildingItinerary: 'Dein Reiseplan wird zusammengestellt...',
    addingLocalTips: 'Lokale Tipps werden hinzugef\u00fcgt...',
    almostReady: 'Fast fertig...',
  },

  // ---------------------------------------------------------------------------
  // Settings / language selector
  // ---------------------------------------------------------------------------
  settings: {
    language: 'Sprache',
    selectLanguage: 'Sprache ausw\u00e4hlen',
    english: 'English',
    spanish: 'Espa\u00f1ol',
    french: 'Fran\u00e7ais',
    japanese: '\u65E5\u672C\u8A9E',
    korean: '\uD55C\uAD6D\uC5B4',
    portuguese: 'Portugu\u00EAs',
    german: 'Deutsch',
    languageChanged: 'Sprache ge\u00e4ndert',
    restartRequired: 'Manche \u00c4nderungen erfordern einen App-Neustart.',
  },

  // ---------------------------------------------------------------------------
  // Referral
  // ---------------------------------------------------------------------------
  referral: {
    title: 'Freunde einladen',
    subtitle: 'Gib einem Freund Pro gratis, kriege Pro selbst',
    yourCode: 'Dein Empfehlungscode',
    shareCode: 'Code teilen',
    copied: 'Kopiert!',
    howItWorks: 'So funktioniert es',
    step1: 'Teile deinen Code mit Freunden',
    step2: 'Die melden sich mit deinem Code an',
    step3: 'Ihr bekommt beide einen Monat Pro gratis',
  },

  // ---------------------------------------------------------------------------
  // Support / legal
  // ---------------------------------------------------------------------------
  legal: {
    privacyPolicy: 'Datenschutzerkl\u00e4rung',
    termsOfService: 'Nutzungsbedingungen',
    support: 'Support',
    contactUs: 'Kontakt',
    reportBug: 'Bug melden',
    featureRequest: 'Feature-Wunsch',
  },

  destination: {
    localTime: 'Ortszeit',
    rightNow: 'Jetzt gerade',
    airQuality: 'Luftqualit\u00e4t',
    safety: 'Sicherheit',
    weatherRainy: 'Regen',
    weatherHot: 'Hei\u00df',
    weatherWarm: 'Warm',
    weatherCool: 'K\u00fchl',
    rainChance: '{{pct}}% Regen',
    safetyVerySafe: 'Sehr sicher',
    safetySafe: 'Sicher',
    safetyModerate: 'M\u00e4\u00dfig',
    safetyUseCaution: 'Vorsicht',
    upcomingHolidays: 'Bevorstehende Feiertage',
    planTripCta: 'Trip nach {{destination}} planen',
    loadingLiveData: 'Live-Daten werden geladen\u2026',
  },

  dualClock: {
    title: 'Zeitzonen',
    here: 'Hier',
    recoveryDays: '~{{days}} Tage zur Einstellung',
    noJetLag: 'Kein nennenswerter Jetlag',
    jetLagSevere: 'Starker Jetlag',
    jetLagModerate: 'M\u00e4\u00dfiger Jetlag',
    jetLagMild: 'Leichter Jetlag',
  },

  goldenHour: {
    title: 'Goldene Stunde',
    morning: 'Morgen',
    evening: 'Abend',
    bestPhotoWindow: 'Bestes Fotofenster',
    bestPhotoTip: 'In der goldenen Stunde aufnehmen f\u00fcr warmes, weiches Licht das Landschaften und Portraits schmeichelt.',
  },

  costComparison: {
    title: 'Dein Dollar im Ausland',
    tierBudget: 'Budget',
    tierComfort: 'Komfort',
    tierLuxury: 'Luxus',
    dailyBudget: 'Tagesbudget',
    savingsText: '${{amount}}/Tag sparen durch {{destination}} ({{comparison}})',
    cheapestOption: 'g\u00fcnstigste Option',
    vsComparison: 'gg\u00fc. {{dest}}',
    detailStay: 'Unterkunft',
    detailMeal: 'Essen',
    detailTransport: 'Transport',
    perDay: '${{amount}}/Tag',
  },

  currencySparkline: {
    bestRate: 'BESTER KURS',
    trendLabel: '{{sign}}{{pct}}% (30 Tage)',
    inDestination: 'in {{destination}}',
  },

  crowdCalendar: {
    loadingCrowds: 'Besucherprognose wird analysiert\u2026',
    title: 'Besucherprognose',
    crowdLow: 'Wenig',
    crowdModerate: 'M\u00e4\u00dfig',
    crowdHigh: 'Viel',
    crowdExtreme: 'Sehr viel',
    pricesHigher: 'Preise ~{{pct}}% h\u00f6her als normal',
  },

  liveFeed: {
    tripPlanned: '{{name}} hat gerade {{detail}} geplant',
    flightSearched: '{{name}} hat {{detail}} gesucht',
    destinationTrending: '{{destination}} liegt im Trend',
    minutesAgo: 'vor {{minutes}} Min.',
  },

  // ---------------------------------------------------------------------------
  // Not found
  // ---------------------------------------------------------------------------
  notFound: {
    title: 'Seite nicht gefunden',
    subtitle: 'Diese Seite gibt es nicht.',
    goHome: 'Zur Startseite',
  },
};

export default de;
