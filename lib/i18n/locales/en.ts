// =============================================================================
// ROAM — English translations (base language)
// =============================================================================
const en = {
  // ---------------------------------------------------------------------------
  // Common / shared
  // ---------------------------------------------------------------------------
  common: {
    appName: 'ROAM',
    tryAgain: 'Try Again',
    cancel: 'Cancel',
    save: 'Save',
    done: 'Done',
    close: 'Close',
    back: 'Back',
    next: 'Next',
    skip: 'Skip',
    continue: 'Continue',
    loading: 'Loading...',
    search: 'Search',
    share: 'Share',
    delete: 'Delete',
    edit: 'Edit',
    confirm: 'Confirm',
    yes: 'Yes',
    no: 'No',
    ok: 'OK',
    error: 'Error',
    success: 'Success',
    comingSoon: 'COMING SOON',
    pro: 'PRO',
    free: 'FREE',
    guest: 'Guest',
    viewAll: 'View All',
    seeMore: 'See More',
    learnMore: 'Learn More',
    getStarted: 'Get Started',
    days: '{{count}} day',
    days_other: '{{count}} days',
    perDay: '/day',
    offline: "You're offline \u2014 saved trips still work",
  },

  // ---------------------------------------------------------------------------
  // Tab bar
  // ---------------------------------------------------------------------------
  tabs: {
    plan: 'Plan',
    discover: 'Discover',
    people: 'People',
    generate: 'Generate',
    flights: 'Flights',
    stays: 'Stays',
    food: 'Food',
    prep: 'Prep',
  },

  // ---------------------------------------------------------------------------
  // Error boundary
  // ---------------------------------------------------------------------------
  errorBoundary: {
    title: "Well, that wasn't supposed to happen",
    subtitle: "ROAM tripped over itself. Hit the button below \u2014 that usually fixes it.",
    tryAgain: 'Try Again',
  },

  // ---------------------------------------------------------------------------
  // Auth screens
  // ---------------------------------------------------------------------------
  auth: {
    signIn: 'Sign in',
    signUp: 'Sign up',
    logOut: 'Log out',
    email: 'Email',
    password: 'Password',
    forgotPassword: 'Forgot password?',
    noAccount: "Don't have an account?",
    hasAccount: 'Already have an account?',
    continueWith: 'Continue with {{provider}}',
    continueAsGuest: 'Continue as guest',
    browseFirst: 'Browse first',
    welcomeBack: 'Welcome back',
    createAccount: 'Create account',
    orContinueWith: 'or continue with',
    emailPlaceholder: 'your@email.com',
    passwordPlaceholder: 'Your password',
    signInButton: 'Sign in',
    signUpButton: 'Create account',
    magicLink: "We'll send you a magic link",
    checkEmail: 'Check your email',
    checkEmailSub: "We sent a sign-in link to {{email}}. Tap it to continue.",
  },

  // ---------------------------------------------------------------------------
  // Onboarding
  // ---------------------------------------------------------------------------
  onboarding: {
    hookTitle: 'Plan your next trip in 30 seconds',
    hookSubtitle: 'AI-powered itineraries that actually make sense.',
    valueTitle: 'What you get',
    valueItem1: 'Full day-by-day itineraries',
    valueItem2: 'Local food, hidden gems, real tips',
    valueItem3: 'Weather, visa, safety \u2014 all covered',
    letsGo: "Let's go",
    whereFirst: 'Where to first?',
    howLong: 'How many days?',
    whatBudget: "What's your budget?",
    whatVibes: 'What vibes?',
    pickAtLeast: 'Pick at least {{count}}',
    generating: 'Generating your trip...',
  },

  // ---------------------------------------------------------------------------
  // Discover screen
  // ---------------------------------------------------------------------------
  discover: {
    searchPlaceholder: 'Search destinations...',
    trendingNow: 'Trending Now',
    editorialHeaders: [
      'Travel like you know someone there',
      'Pick a place. We\u2019ll handle the rest.',
      'Plan less. Experience more.',
      '30 seconds to your next trip.',
      'Some trips plan themselves. This is one.',
      'Tell us where. We\u2019ll tell you everything.',
      'The hard part was picking. We did the rest.',
    ],
    bestIn: 'Best in {{month}}',
    dailyCost: '${{cost}}/day',
    trending: 'trending',
    perfectTiming: 'Perfect timing',
  },

  // ---------------------------------------------------------------------------
  // Categories
  // ---------------------------------------------------------------------------
  categories: {
    all: 'All',
    beaches: 'Beaches',
    mountains: 'Mountains',
    cities: 'Cities',
    food: 'Food',
    adventure: 'Adventure',
    budget: 'Budget',
    couples: 'Couples',
  },

  // ---------------------------------------------------------------------------
  // Budget tiers
  // ---------------------------------------------------------------------------
  budgets: {
    backpacker: 'Budget-friendly',
    comfort: 'Comfortable',
    treatYourself: 'Treat myself',
    noBudget: 'No limits',
    backpackerRange: '$0\u201375/day',
    comfortRange: '$75\u2013200/day',
    treatYourselfRange: '$200\u2013500/day',
    noBudgetRange: '$500+/day',
    backpackerVibe: 'Hostels, street food, and great memories',
    comfortVibe: 'Nice stays without overdoing it',
    treatYourselfVibe: "You deserve it \u2014 let's make it special",
    noBudgetVibe: 'Splurge on what matters most',
  },

  // ---------------------------------------------------------------------------
  // Vibes
  // ---------------------------------------------------------------------------
  vibes: {
    localEats: 'Local Eats',
    hiddenGems: 'Hidden Gems',
    adrenaline: 'Adrenaline',
    sunsetChaser: 'Sunset Chaser',
    artDesign: 'Art & Design',
    nightOwl: 'Night Owl',
    slowMornings: 'Slow Mornings',
    deepHistory: 'Deep History',
    beachVibes: 'Beach Vibes',
    marketHopper: 'Market Hopper',
    natureEscape: 'Nature Escape',
    soloFriendly: 'Solo Friendly',
    dateNight: 'Date Night',
    photoWorthy: 'Photo Worthy',
    wellness: 'Wellness',
    offTheGrid: 'Off the Grid',
  },

  // ---------------------------------------------------------------------------
  // Plan tab (unified trip planning)
  // ---------------------------------------------------------------------------
  plan: {
    title: 'Plan',
    yourTrips: 'Your trips',
    tripsPlanned: '{{count}} trip planned',
    tripsPlanned_other: '{{count}} trips planned',
    planNewTrip: 'Plan a new trip',
    backToTrips: 'Back to my trips',
    sectionYourTrips: 'YOUR TRIPS',
    latest: 'LATEST',
    findStays: 'Find stays',
    staysSub: 'Hotels, hostels, villas',
    findFood: 'Find food',
    foodSub: 'Restaurants, street food',
    bookFlights: 'Book flights',
    flightsSub: 'Compare prices',
    today: 'Today',
    yesterday: 'Yesterday',
    daysAgo: '{{count}} days ago',
    rateLimitTitle: 'You hit your free limit',
    rateLimitBody: 'Free accounts get {{count}} trip per month. Upgrade to Pro for unlimited trips and the full ROAM experience.',
    seeProPlans: 'See Pro Plans',
    maybeLater: 'Maybe later',
    dismiss: 'Dismiss',
  },

  // ---------------------------------------------------------------------------
  // People tab (social / traveler matching)
  // ---------------------------------------------------------------------------
  people: {
    title: 'People',
    headerSub: 'Find travelers going where you are going',
    heroTitle: 'Travel is better together',
    heroSub: 'We match you with travelers heading to the same place, at the same time, with the same energy.',
    activeTravelers: 'Active travelers',
    destinations: 'Destinations',
    groupsForming: 'Groups forming',
    openGroups: 'Open groups',
    openGroupsSub: 'Join a trip that is forming',
    matchedTravelers: 'Matched travelers',
    matchedTravelersSub: 'People heading to your destinations',
    connect: 'Connect',
    completeProfileCta: 'Complete your travel profile to get better matches',
    setUpProfile: 'Set up profile',
    going: '{{count}} going',
    countries: '{{count}} countries',
  },

  // ---------------------------------------------------------------------------
  // Generate screen
  // ---------------------------------------------------------------------------
  generate: {
    title: 'Plan a trip',
    quickMode: 'Quick',
    conversationMode: 'Chat',
    quickModeDesc: 'Fill out a form, get a full itinerary',
    conversationModeDesc: 'Chat with AI to plan your perfect trip',
    whereAreYouGoing: 'Where are you going?',
    howManyDays: 'How many days?',
    whatsYourBudget: "What's your budget?",
    pickYourVibes: 'Pick your vibes',
    generateTrip: 'Generate trip',
    generating: 'Generating...',
    generatingTrip: 'Generating your trip...',
    chatPlaceholder: 'Tell me about your dream trip...',
    chatStarters: [
      'Where should I go?',
      'What should I pack for Tokyo in April?',
      'Best ramen in Tokyo under $15?',
      'Is Bali worth it right now?',
      'How do I get a SIM in Thailand?',
      "What's actually worth seeing in Paris?",
      'Best neighborhoods in Mexico City?',
    ],
  },

  // ---------------------------------------------------------------------------
  // Itinerary screen
  // ---------------------------------------------------------------------------
  itinerary: {
    dayN: 'Day {{n}}',
    morning: 'Morning',
    afternoon: 'Afternoon',
    evening: 'Evening',
    packingList: 'Packing List',
    practicalInfo: 'Practical Info',
    weather: 'Weather',
    visa: 'Visa',
    safety: 'Safety',
    currency: 'Currency',
    saveTrip: 'Save trip',
    shareTrip: 'Share trip',
    tripSaved: 'Trip saved!',
    tripShared: 'Trip shared!',
    noActivities: 'No activities yet',
    addActivity: 'Add activity',
    editActivity: 'Edit activity',
    deleteActivity: 'Delete activity',
    whatToPack: 'What to pack',
    localTips: 'Local tips',
    gettingAround: 'Getting around',
    whereToEat: 'Where to eat',
    dontMiss: "Don't miss",
  },

  // ---------------------------------------------------------------------------
  // Flights screen
  // ---------------------------------------------------------------------------
  flights: {
    title: 'Flights',
    searchFlights: 'Search flights',
    from: 'From',
    to: 'To',
    departure: 'Departure',
    return: 'Return',
    oneWay: 'One way',
    roundTrip: 'Round trip',
    passengers: 'Passengers',
    findFlights: 'Find flights',
    cheapest: 'Cheapest',
    fastest: 'Fastest',
    bestValue: 'Best value',
    noResults: 'No flights found',
    setHomeAirport: 'Set your home airport',
    heroTitle: 'Find your flight.',
    heroSub: 'We search Skyscanner so you get the best price, every time.',
    fromPlaceholder: 'From (city or airport)',
    toPlaceholder: 'To (city or airport)',
    depart: 'DEPART',
    returnLabel: 'RETURN',
    searchSkyscanner: 'Search on Skyscanner',
    popularRoutes: 'Popular routes',
    popularRoutesSub: 'The flights everyone is booking right now',
    routeSearch: 'Search',
    routeLabel: '{{from}} to {{to}}',
    bestTimeToFly: 'Best time to fly',
    bestTimeSub: 'Peak season, lowest crowds, perfect weather',
    disclaimer: 'ROAM earns a small commission when you book through Skyscanner. This keeps the app free.',
  },

  // ---------------------------------------------------------------------------
  // Stays screen
  // ---------------------------------------------------------------------------
  stays: {
    title: 'Stays',
    searchStays: 'Search stays',
    checkIn: 'Check in',
    checkOut: 'Check out',
    guests: 'Guests',
    findStays: 'Find stays',
    hotels: 'Hotels',
    hostels: 'Hostels',
    apartments: 'Apartments',
    noResults: 'No stays found',
  },

  // ---------------------------------------------------------------------------
  // Food screen
  // ---------------------------------------------------------------------------
  food: {
    title: 'Food',
    searchRestaurants: 'Search restaurants',
    nearMe: 'Near me',
    topRated: 'Top rated',
    bookmarked: 'Bookmarked',
    noResults: 'No restaurants found',
    priceRange: 'Price range',
    cuisine: 'Cuisine',
    bookmark: 'Bookmark',
    unbookmark: 'Remove bookmark',
  },

  // ---------------------------------------------------------------------------
  // Prep screen
  // ---------------------------------------------------------------------------
  prep: {
    title: 'Trip Prep',
    packing: 'Packing',
    documents: 'Documents',
    health: 'Health',
    money: 'Money',
    safety: 'Safety',
    language: 'Language',
    weather: 'Weather',
    visa: 'Visa',
    insurance: 'Insurance',
    emergency: 'Emergency',
    checklist: 'Checklist',
    allDone: 'All done!',
    itemsLeft: '{{count}} item left',
    itemsLeft_other: '{{count}} items left',
    sectionSchedule: 'Schedule',
    sectionOverview: 'Overview',
    sectionCurrency: 'Currency',
    sectionCulture: 'Culture',
    sectionConnectivity: 'SIM & WiFi',
    scheduleEmpty: 'No schedule yet',
    scheduleEmptySub: 'Generate a trip in Plan to see your day-by-day schedule here.',
    nearestEmbassy: 'Nearest Embassy',
    usEmbassyLabel: 'US Embassy \u2014 {{city}}',
    hospitalsLabel: 'Hospitals',
    pharmacyLabel: 'Pharmacy',
    erCostLabel: 'ER visit without insurance: {{range}}',
    whereToGoLabel: 'Where to Go',
    travelAdvisory: 'Travel Advisory',
    tapWaterSafe: 'Safe to drink',
    tapWaterUnsafe: 'Do not drink',
    visaNotRequired: 'Visa Not Required',
    visaOnArrival: 'Visa on Arrival',
    visaRequired: 'Visa Required',
    stayUpTo: 'Stay up to {{count}} days',
    applicationFee: 'Application fee: ${{cost}}',
    policeLabel: 'Police',
    ambulanceLabel: 'Ambulance',
    fireLabel: 'Fire',
    otcAvailable: 'OTC available',
    rxRequired: 'Rx required',
    insuranceCritical: 'Critical',
    insuranceRecommended: 'Recommended',
    insuranceNiceToHave: 'Nice to have',
    insurancePrefix: 'Insurance:',
    crimeIndex: 'Crime Index',
    healthRisk: 'Health Risk',
    politicalStability: 'Political Stability',
    validPassport: 'Valid passport (6+ months)',
    returnTicket: 'Return ticket',
    proofAccommodation: 'Proof of accommodation',
    bankNotify: 'Notify your bank before traveling to avoid card blocks',
    carrySmallBills: 'Carry small bills for street vendors and taxis',
    noForeignFeeCards: 'Use no-foreign-fee cards when possible',
    localTime: 'Local time',
  },

  // ---------------------------------------------------------------------------
  // Profile screen
  // ---------------------------------------------------------------------------
  profile: {
    title: 'Your profile',
    tripsBuilt: 'TRIPS BUILT',
    thisMonth: 'THIS MONTH',
    createAccountUnlock: 'Create account to unlock',
    createAccountSub: 'Sync your trips, plan unlimited adventures, and access all features.',
    planUnlimited: 'Plan unlimited trips',
    planUnlimitedSub: 'Never hold back. Plan as many adventures as you want, whenever inspiration strikes.',
    seeProPlans: 'See Pro plans',
    tripWrapped: 'Trip Wrapped',
    tripWrappedSub: 'Your year in travel',
    travelAlterEgo: 'Travel Alter-Ego Quiz',
    tripDupeMode: 'Trip Dupe Mode',
    referFriends: 'Refer Friends',
    exploreFeatures: 'Explore Features',
    yourPlan: 'Your plan',
    emergencyContact: 'Emergency Contact',
    emergencyContactTitle: 'Emergency contact',
    emergencyContactSub: 'Enter a phone number for SOS alerts.',
    logOut: 'Log out',
    logOutTitle: 'Heading out?',
    logOutMessage: 'You can always come back.',
    thanksForRating: 'Thanks for rating',
    devReset: 'Dev: Reset first-time',
    language: 'Language',
    languageSub: 'Choose your preferred language',
  },

  // ---------------------------------------------------------------------------
  // Paywall / subscription
  // ---------------------------------------------------------------------------
  paywall: {
    title: 'Go Pro',
    subtitle: 'Unlimited trips, zero limits',
    feature1: 'Unlimited trip generation',
    feature2: 'Full day-by-day itineraries',
    feature3: 'Priority AI planning',
    feature4: 'Exclusive destinations',
    monthlyPlan: 'Monthly',
    yearlyPlan: 'Yearly',
    perMonth: '/mo',
    perYear: '/yr',
    bestValue: 'Best value',
    subscribe: 'Subscribe',
    restore: 'Restore purchases',
    terms: 'Terms of Service',
    privacy: 'Privacy Policy',
    trialInfo: '{{days}}-day free trial, then {{price}}/{{period}}',
    alreadyPro: "You're already Pro!",
    freeTripsUsed: "You've used your free trip this month",
    upgradeCTA: 'Upgrade for unlimited trips',
  },

  // ---------------------------------------------------------------------------
  // Saved trips
  // ---------------------------------------------------------------------------
  saved: {
    title: 'Saved Trips',
    noTrips: 'No saved trips yet',
    noTripsSub: 'Generate your first trip and it will appear here.',
    deleteTrip: 'Delete trip',
    deleteConfirm: 'Are you sure you want to delete this trip?',
  },

  // ---------------------------------------------------------------------------
  // Passport / gamification
  // ---------------------------------------------------------------------------
  passport: {
    title: 'Your Passport',
    countriesVisited: 'Countries visited',
    badges: 'Badges',
    stamps: 'Stamps',
    level: 'Level {{n}}',
    xpToNext: '{{xp}} XP to next level',
    noBadges: 'No badges yet',
    noStamps: 'No stamps yet',
    earnBadges: 'Earn badges by traveling and exploring!',
  },

  // ---------------------------------------------------------------------------
  // Group trips
  // ---------------------------------------------------------------------------
  groups: {
    title: 'Group Trip',
    createGroup: 'Create group',
    joinGroup: 'Join group',
    inviteCode: 'Invite code',
    enterCode: 'Enter invite code',
    join: 'Join',
    members: 'Members',
    votes: 'Votes',
    expenses: 'Expenses',
    addExpense: 'Add expense',
    splitEvenly: 'Split evenly',
    youOwe: 'You owe',
    owesYou: '{{name}} owes you',
    settled: 'Settled',
    inviteFriends: 'Invite friends',
    shareLink: 'Share link',
    leaveGroup: 'Leave group',
  },

  // ---------------------------------------------------------------------------
  // Share card
  // ---------------------------------------------------------------------------
  shareCard: {
    title: 'Share your trip',
    downloading: 'Creating share card...',
    shareNow: 'Share now',
    copyLink: 'Copy link',
    linkCopied: 'Link copied!',
  },

  // ---------------------------------------------------------------------------
  // Weather
  // ---------------------------------------------------------------------------
  weather: {
    title: 'Weather',
    feelsLike: 'Feels like',
    humidity: 'Humidity',
    wind: 'Wind',
    uvIndex: 'UV Index',
    sunrise: 'Sunrise',
    sunset: 'Sunset',
    forecast: '5-Day Forecast',
    packingTip: 'Packing tip',
    high: 'H',
    low: 'L',
  },

  // ---------------------------------------------------------------------------
  // Safety
  // ---------------------------------------------------------------------------
  safety: {
    title: 'Safety',
    level1: 'Exercise normal precautions',
    level2: 'Exercise increased caution',
    level3: 'Reconsider travel',
    level4: 'Do not travel',
    source: 'Source: US State Department',
    neighborhoodSafety: 'Neighborhood Safety',
    emergencySOS: 'Emergency SOS',
    sosActivated: 'SOS activated',
    holdForSOS: 'Hold for SOS',
  },

  // ---------------------------------------------------------------------------
  // Currency
  // ---------------------------------------------------------------------------
  currency: {
    title: 'Currency',
    exchangeRate: '1 {{from}} = {{rate}} {{to}}',
    lastUpdated: 'Updated {{time}}',
    convert: 'Convert',
    homeCurrency: 'Home currency',
  },

  // ---------------------------------------------------------------------------
  // Language survival
  // ---------------------------------------------------------------------------
  languageSurvival: {
    title: 'Language Survival Kit',
    essentialPhrases: 'Essential Phrases',
    hello: 'Hello',
    thankYou: 'Thank you',
    please: 'Please',
    sorry: 'Sorry',
    howMuch: 'How much?',
    whereIs: 'Where is...?',
    help: 'Help!',
    yes: 'Yes',
    no: 'No',
    tapToListen: 'Tap to listen',
  },

  // ---------------------------------------------------------------------------
  // Pets
  // ---------------------------------------------------------------------------
  pets: {
    title: 'Pet Travel',
    addPet: 'Add pet',
    petName: 'Pet name',
    petType: 'Pet type',
    dog: 'Dog',
    cat: 'Cat',
    other: 'Other',
    petFriendly: 'Pet-friendly destinations',
    petScore: 'Pet score',
    reminders: 'Pet reminders',
  },

  // ---------------------------------------------------------------------------
  // Expense categories
  // ---------------------------------------------------------------------------
  expenses: {
    food: 'Food',
    transport: 'Transport',
    accommodation: 'Accommodation',
    activity: 'Activity',
    drinks: 'Drinks',
    other: 'Other',
  },

  // ---------------------------------------------------------------------------
  // Loading states
  // ---------------------------------------------------------------------------
  loadingStates: {
    generatingTrip: 'Generating your trip...',
    findingPlaces: 'Finding the best places...',
    buildingItinerary: 'Building your itinerary...',
    addingLocalTips: 'Adding local tips...',
    almostReady: 'Almost ready...',
  },

  // ---------------------------------------------------------------------------
  // Settings / language selector
  // ---------------------------------------------------------------------------
  settings: {
    language: 'Language',
    selectLanguage: 'Select language',
    english: 'English',
    spanish: 'Espa\u00f1ol',
    french: 'Fran\u00e7ais',
    japanese: '\u65E5\u672C\u8A9E',
    korean: '\uD55C\uAD6D\uC5B4',
    portuguese: 'Portugu\u00EAs',
    german: 'Deutsch',
    languageChanged: 'Language changed',
    restartRequired: 'Some changes may require restarting the app.',
  },

  // ---------------------------------------------------------------------------
  // Referral
  // ---------------------------------------------------------------------------
  referral: {
    title: 'Refer Friends',
    subtitle: 'Give a friend free Pro, get Pro yourself',
    yourCode: 'Your referral code',
    shareCode: 'Share code',
    copied: 'Copied!',
    howItWorks: 'How it works',
    step1: 'Share your code with friends',
    step2: 'They sign up with your code',
    step3: 'You both get Pro free for a month',
  },

  // ---------------------------------------------------------------------------
  // Support / legal
  // ---------------------------------------------------------------------------
  legal: {
    privacyPolicy: 'Privacy Policy',
    termsOfService: 'Terms of Service',
    support: 'Support',
    contactUs: 'Contact us',
    reportBug: 'Report a bug',
    featureRequest: 'Feature request',
  },

  // ---------------------------------------------------------------------------
  // Destination intelligence dashboard
  // ---------------------------------------------------------------------------
  destination: {
    localTime: 'Local time',
    rightNow: 'Right now',
    airQuality: 'Air quality',
    safety: 'Safety',
    weatherRainy: 'Rainy',
    weatherHot: 'Hot',
    weatherWarm: 'Warm',
    weatherCool: 'Cool',
    rainChance: '{{pct}}% rain',
    safetyVerySafe: 'Very Safe',
    safetySafe: 'Safe',
    safetyModerate: 'Moderate',
    safetyUseCaution: 'Use Caution',
    upcomingHolidays: 'Upcoming holidays',
    planTripCta: 'Plan a trip to {{destination}}',
    loadingLiveData: 'Loading live data\u2026',
  },

  // ---------------------------------------------------------------------------
  // Dual clock + jet lag widget
  // ---------------------------------------------------------------------------
  dualClock: {
    title: 'Time zones',
    here: 'Here',
    recoveryDays: '~{{days}} days to adjust',
    noJetLag: 'No significant jet lag',
    jetLagSevere: 'Severe jet lag',
    jetLagModerate: 'Moderate jet lag',
    jetLagMild: 'Mild jet lag',
  },

  // ---------------------------------------------------------------------------
  // Golden hour photography card
  // ---------------------------------------------------------------------------
  goldenHour: {
    title: 'Golden Hour',
    morning: 'Morning',
    evening: 'Evening',
    bestPhotoWindow: 'Best Photo Window',
    bestPhotoTip: 'Shoot during golden hour for warm, soft light that flatters landscapes and portraits.',
  },

  // ---------------------------------------------------------------------------
  // Cost comparison widget
  // ---------------------------------------------------------------------------
  costComparison: {
    title: 'Your dollar abroad',
    tierBudget: 'Budget',
    tierComfort: 'Comfort',
    tierLuxury: 'Luxury',
    dailyBudget: 'Daily budget',
    savingsText: 'Save ${{amount}}/day by choosing {{destination}} ({{comparison}})',
    cheapestOption: 'cheapest option',
    vsComparison: 'vs {{dest}}',
    detailStay: 'Stay',
    detailMeal: 'Meal',
    detailTransport: 'Transport',
    perDay: '${{amount}}/day',
  },

  // ---------------------------------------------------------------------------
  // Currency sparkline
  // ---------------------------------------------------------------------------
  currencySparkline: {
    bestRate: 'BEST RATE',
    trendLabel: '{{sign}}{{pct}}% (30-day)',
    inDestination: 'in {{destination}}',
  },

  // ---------------------------------------------------------------------------
  // Crowd forecast calendar
  // ---------------------------------------------------------------------------
  crowdCalendar: {
    loadingCrowds: 'Analyzing crowd patterns\u2026',
    title: 'Crowd forecast',
    crowdLow: 'Low',
    crowdModerate: 'Moderate',
    crowdHigh: 'High',
    crowdExtreme: 'Extreme',
    pricesHigher: 'Prices ~{{pct}}% higher than normal',
  },

  // ---------------------------------------------------------------------------
  // Live feed ticker (social proof)
  // ---------------------------------------------------------------------------
  liveFeed: {
    tripPlanned: '{{name}} just planned {{detail}}',
    flightSearched: '{{name}} searched {{detail}}',
    destinationTrending: '{{destination}} is {{detail}}',
    minutesAgo: '{{minutes}}m ago',
  },

  // ---------------------------------------------------------------------------
  // Not found
  // ---------------------------------------------------------------------------
  notFound: {
    title: 'Page not found',
    subtitle: "This page doesn't exist.",
    goHome: 'Go home',
  },
};

export default en;

type DeepStringify<T> = {
  [K in keyof T]: T[K] extends string
    ? string
    : T[K] extends readonly string[]
      ? string[]
      : T[K] extends Record<string, unknown>
        ? DeepStringify<T[K]>
        : T[K];
};

export type TranslationKeys = DeepStringify<typeof en>;
