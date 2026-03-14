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
    discover: 'Discover',
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
    rightNow: 'Right Now',
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
  },

  // ---------------------------------------------------------------------------
  // Prep: Right Now (weather intel)
  // ---------------------------------------------------------------------------
  prepRightNow: {
    title: 'RIGHT NOW',
    packingTips: 'PACKING TIPS',
  },

  // ---------------------------------------------------------------------------
  // Useful Phrases
  // ---------------------------------------------------------------------------
  usefulPhrases: {
    title: 'USEFUL PHRASES',
    phrases: 'phrases',
    greetingsBasics: 'Greetings & Basics',
    foodDining: 'Food & Dining',
    directions: 'Directions',
    emergency: 'Emergency',
    gettingAround: 'Getting Around',
    shopping: 'Shopping',
    social: 'Social',
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
  // Not found
  // ---------------------------------------------------------------------------
  notFound: {
    title: 'Page not found',
    subtitle: "This page doesn't exist.",
    goHome: 'Go home',
  },

  // ---------------------------------------------------------------------------
  // Globe (Spin the Globe)
  // ---------------------------------------------------------------------------
  globe: {
    title: 'Spin the Globe',
    subtitle: 'One tap. One destination. Zero planning.',
    revealLabel: 'YOUR NEXT ADVENTURE',
    spinButton: 'Spin the Globe',
    buildTrip: 'Build this trip',
    spinAgain: 'Spin again',
    generatingSubtext: 'AI is crafting your trip',
    hint: 'Every spin is a surprise. No takebacks.',
    findingDestiny: 'Finding your destiny...',
  },

  // ---------------------------------------------------------------------------
  // Dream Vault
  // ---------------------------------------------------------------------------
  dreamVault: {
    title: 'Dream Trip Vault',
    savedCountAlert: "saved \u2014 we'll alert when prices drop",
    alertRemoveTitle: 'Remove from vault?',
    alertRemoveBody: 'Stop tracking',
    remove: 'Remove',
    pricesLow: 'Prices low',
    tapToSearchFlights: 'Tap to search flights',
    noDreamDestinations: 'No dream destinations yet',
    saveFromItineraries: 'Save destinations from itineraries to track flight prices',
    planATrip: 'Plan a trip',
  },

  // ---------------------------------------------------------------------------
  // Chaos Mode
  // ---------------------------------------------------------------------------
  chaosMode: {
    zeroDecisions: 'ZERO DECISIONS',
    title: 'Chaos Mode',
    idleTitle: 'One tap.\nWe pick everything for you.',
    idleSubtitle: 'Destination. Duration. Budget. Vibes.\nNo decisions. Just hit the button and pack your bags.',
    surpriseMe: 'SURPRISE ME',
    disclaimer: 'Warning: You might end up somewhere incredible.',
    errorMessage: "Chaos mode hit a wall. The universe is taking a break. Try again.",
    destination: 'Destination:',
    duration: 'Duration:',
    budget: 'Budget:',
    total: 'Total',
    style: 'Style',
    iDareYou: 'I dare you.',
    goSomewhereThatChangesYou: 'Go somewhere that changes you.',
    sendToGroupChat: 'Send to the Group Chat',
    dareYouToDoThis: 'Dare you to do this',
    seeFullTrip: 'See the full trip',
    seeTheReceipt: 'See The Receipt',
    tryAnotherSurprise: 'Try another surprise',
  },

  // ---------------------------------------------------------------------------
  // Chaos Dare
  // ---------------------------------------------------------------------------
  chaosDare: {
    dareNotFound: 'Dare not found',
    someoneDaredYou: 'SOMEONE DARED YOU',
    dareYouToDoThisTrip: 'Dare you to do this trip.',
    openRoamToClaim: 'Open ROAM to claim it',
  },

  // ---------------------------------------------------------------------------
  // Alter Ego
  // ---------------------------------------------------------------------------
  alterEgo: {
    analyzingTravelSoul: 'Analyzing your travel soul...',
    yourTravelAlterEgo: 'YOUR TRAVEL ALTER-EGO',
    idealDestinations: 'IDEAL DESTINATIONS',
    shareAlterEgo: 'Share Your Alter-Ego',
    retakeQuiz: 'Retake quiz',
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
    noShareData: 'No share data. Generate a trip first!',
    builtWithRoam: 'Built with ROAM',
    openImageInNewTab: 'Open image in new tab',
    screenshotHint: 'Screenshot or right-click to save',
  },

  // ---------------------------------------------------------------------------
  // Support
  // ---------------------------------------------------------------------------
  support: {
    title: 'Support',
    needHelp: 'Need help with ROAM?',
    weAreHere: "We're here for you.",
    frequentlyAsked: 'FREQUENTLY ASKED',
    contactUs: 'Contact us',
    responseWithin48Hours: 'Response within 48 hours',
  },

  // ---------------------------------------------------------------------------
  // Hype (countdown)
  // ---------------------------------------------------------------------------
  hype: {
    gettingHyped: 'Getting hyped...',
    invalidFormatTitle: 'Invalid format',
    invalidFormatBody: 'Please enter a date as YYYY-MM-DD',
    invalidDateTitle: 'Invalid date',
    invalidDateBody: 'That date does not appear to be valid',
    tripProgress: 'TRIP PROGRESS',
    shareCountdown: 'Share Countdown',
    changeDepartureDate: 'Change departure date',
    setDepartureDate: 'Set your departure date',
    startCountdownTo: 'Start the countdown to',
    departureDate: 'DEPARTURE DATE',
    updateDate: 'Update Date',
    startCountdown: 'Start Countdown',
  },

  // ---------------------------------------------------------------------------
  // People Met
  // ---------------------------------------------------------------------------
  peopleMet: {
    title: "People You've Met",
    nearYou: 'Near you',
    metIn: 'Met in',
    removeContact: 'Remove contact',
    editContact: 'Edit contact',
    addContact: 'Add contact',
    name: 'Name',
    whereYouMet: 'Where you met',
    destination: 'Destination',
    tripDates: 'Trip dates',
    photoUrl: 'Photo URL',
    instagram: 'Instagram',
    linkedin: 'LinkedIn',
    twitter: 'Twitter',
    theirCityProximity: 'Their city (proximity)',
  },

  // ---------------------------------------------------------------------------
  // Local Lens
  // ---------------------------------------------------------------------------
  localLens: {
    localLensLabel: 'Local lens',
    tagline: 'See this city through the eyes of people who actually live there.',
    localIntelComingSoon: 'Local intel coming soon',
    localRules: 'Local rules',
    thingsLocalsKnow: "Things locals know that tourists don't",
    neighborhoodsToVisit: 'Neighborhoods to visit',
    realSpotsNotTraps: 'The real spots, not the tourist traps',
    localFavorite: 'LOCAL FAVORITE',
    skipInstead: 'SKIP INSTEAD',
    theRealFood: 'The real food',
    whatLocalsEat: "What locals actually eat, not what's on TripAdvisor",
    scamsAndTraps: 'Scams & traps',
    whatToWatchOutFor: 'What to watch out for',
    howToAvoid: 'HOW TO AVOID',
    timeItRight: 'Time it right',
    bestTimesLocalsKnow: 'Best times locals know about',
    localPhraseBook: 'Local phrase book',
    essentialPhrases: 'Essential phrases beyond "hello" and "thank you"',
  },

  // ---------------------------------------------------------------------------
  // Honest Reviews
  // ---------------------------------------------------------------------------
  honestReviews: {
    title: 'Honest Reviews',
    noReviewsAvailable: 'No reviews available',
    tagline: "No sponsorships. No BS. Just what's actually worth your time.",
    noReviewsForDestination: "We don't have reviews for this destination yet",
    worthIt: 'WORTH IT',
    skipIt: 'SKIP IT',
    mixed: 'MIXED',
    sort: 'Sort:',
    bestFirst: 'Best First',
    worstFirst: 'Worst First',
    crowds: 'Crowds',
    cost: 'Cost',
    bestTime: 'Best time',
    doThisInstead: 'DO THIS INSTEAD',
    alternative: 'ALTERNATIVE',
    insiderTip: 'INSIDER TIP',
  },

  // ---------------------------------------------------------------------------
  // Anti-Itinerary
  // ---------------------------------------------------------------------------
  antiItinerary: {
    badge: 'ANTI-ITINERARY',
    title: 'One decision at a time',
    subtitle: 'No planning ahead. Spontaneous mode.',
    morning: 'Morning',
    afternoon: 'Afternoon',
    evening: 'Evening',
    hungry: 'Hungry',
    exploring: 'Exploring',
    resting: 'Resting',
    cheap: 'Cheap',
    mid: 'Mid',
    splurge: 'Splurge',
    indoors: 'Indoors',
    outdoors: 'Outdoors',
    solo: 'Solo',
    withPeople: 'With people',
  },

  // ---------------------------------------------------------------------------
  // Trip Collections
  // ---------------------------------------------------------------------------
  tripCollections: {
    title: 'Trip Collections',
    subtitle: 'Curated lists by vibe. Tap a destination to plan your own version.',
  },

  // ---------------------------------------------------------------------------
  // Trip Wrapped
  // ---------------------------------------------------------------------------
  tripWrapped: {
    wrappingYear: 'Wrapping your year in travel...',
    yourYearInTravel: 'YOUR YEAR IN TRAVEL',
    title: 'Trip Wrapped',
    nothingToWrap: 'Nothing to wrap yet',
    planAndComeBack: 'Plan some trips and come back at the end of the year.',
    tripsPlanned: 'Trips Planned',
    daysPlanned: 'Days Planned',
    byTheNumbers: 'By the Numbers',
    uniqueDestinations: 'Unique Destinations',
    avgTripLength: 'Avg Trip Length (days)',
    mostPlanned: 'Most Planned',
    yourTravelType: 'Your Travel Type',
    yourTopVibes: 'Your Top Vibes',
    noVibesRecorded: 'No vibes recorded yet. Plan more trips!',
    planNextTrip: 'Plan your next trip',
    shareThisCard: 'Share this card',
  },

  // ---------------------------------------------------------------------------
  // Trip Receipt
  // ---------------------------------------------------------------------------
  tripReceipt: {
    tripCostBreakdown: 'TRIP COST BREAKDOWN',
    title: 'The Receipt',
    noTripToReceiptify: 'No trip to receipt-ify',
    openTripFirst: 'Open one of your trips first, then come back to see what it costs.',
    dayByDay: 'DAY-BY-DAY',
    breakdown: 'BREAKDOWN',
    accommodation: 'Accommodation',
    activities: 'Activities',
    transportation: 'Transportation',
    misc: 'Misc',
    total: 'TOTAL',
    perDayAvg: '/day avg',
    theFinePrint: 'THE FINE PRINT',
    goSomewhereThatChangesYou: 'Go somewhere that changes you.',
    shareTheReceipt: 'Share the Receipt',
    howThisStacksUp: 'How this stacks up',
  },

  // ---------------------------------------------------------------------------
  // Trip Dupe
  // ---------------------------------------------------------------------------
  tripDupe: {
    title: 'Trip Dupe',
    subtitle: "Dream big, spend small. We'll find the budget alternative.",
    pickDreamDestination: 'PICK YOUR DREAM DESTINATION',
    findingDupe: 'Finding your dupe...',
    aiScouringWorld: 'AI is scouring the world for the perfect alternative',
    dream: 'DREAM',
    dupe: 'DUPE',
    vs: 'VS',
    whyItWorks: 'WHY IT WORKS',
    topPicks: 'TOP PICKS',
    bestTimeToGo: 'BEST TIME TO GO',
    buildThisTrip: 'Build this trip',
    tryAnother: 'Try another',
  },

  // ---------------------------------------------------------------------------
  // Trip Chemistry
  // ---------------------------------------------------------------------------
  tripChemistry: {
    title: 'Trip Chemistry',
    subtitle: 'How well will you travel together?',
    namePlaceholder: 'Name',
    pace: 'Pace',
    slowAndSteady: 'Slow & steady',
    speedRunner: 'Speed runner',
    backpacker: 'Backpacker',
    luxury: 'Luxury',
    avoid: 'Avoid',
    embrace: 'Embrace',
    familiar: 'Familiar',
    adventurous: 'Adventurous',
    addCompanion: 'Add companion',
    calculateChemistry: 'Calculate Chemistry',
    travelSoulmates: 'Travel Soulmates',
    greatMatch: 'Great Match',
    solidWithCompromises: 'Solid with Compromises',
    proceedWithCaution: 'Proceed with Caution',
    dangerZone: 'Danger Zone',
    compatibilityBreakdown: 'Compatibility Breakdown',
    potentialConflicts: 'Potential Conflicts',
    proTips: 'Pro Tips',
    bestDestinationType: 'Best Destination Type',
    shareResults: 'Share results',
    tryDifferentGroup: 'Try different group',
  },

  // ---------------------------------------------------------------------------
  // Trip Trading
  // ---------------------------------------------------------------------------
  tripTrading: {
    title: 'Trip Trading',
    subtitle: 'Browse trips others shared. One tap to claim.',
    noTripsForTrading: 'No trips for trading yet',
    claimThisTrip: 'Claim this trip',
    claimedTitle: 'Claimed!',
    claimedBody: 'Your trip is in your trips.',
  },

  // ---------------------------------------------------------------------------
  // Travel Twin
  // ---------------------------------------------------------------------------
  travelTwin: {
    emptyTitle: 'Discover Your Travel Twin',
    emptyBody: 'Complete your travel profile first and we will match you with your travel personality archetype.',
    buildProfile: 'Build Your Profile',
    labelYourTwin: 'Your travel twin',
    bestDestinations: 'Best destinations for you',
    packingMustHave: 'Packing must-have',
    yourMantra: 'Your travel mantra',
    youVibeWith: 'You vibe with',
    worstNightmare: 'Your worst nightmare',
    shareTwin: 'Share Your Twin',
    retakeProfile: 'Retake Profile',
  },

  // ---------------------------------------------------------------------------
  // Travel Profile
  // ---------------------------------------------------------------------------
  travelProfile: {
    headerTitle: 'How do you travel?',
    headerSubtitle: 'This makes every trip feel like it was built just for you.',
    howOften: 'How often do you travel?',
    selectAll: 'Select all that apply',
    pickOne: 'Pick one',
    passportLabel: 'Passport',
    paceLabel: 'Pace',
    budgetStyle: 'Budget Style',
    crowdTolerance: 'Crowd Tolerance',
    foodAdventurousness: 'Food Adventurousness',
    transport: 'Transport',
    accommodationLabel: 'Accommodation',
    whatDoYouTravelFor: 'What do you travel for?',
    saveButton: 'Save My Travel DNA',
    editLaterHint: 'You can always update this in your profile settings.',
  },

  // ---------------------------------------------------------------------------
  // Travel Persona
  // ---------------------------------------------------------------------------
  travelPersona: {
    loadingText: 'Analyzing your Travel DNA...',
    eyebrow: 'YOUR TRAVEL DNA',
    title: 'Travel Persona',
    statTrips: 'Trips',
    statPlaces: 'Places',
    statAvgLength: 'Avg Length',
    shareButton: 'Share your Travel DNA',
    whatThisMeans: 'What this means',
    signatureVibe: 'Your signature vibe',
  },

  // ---------------------------------------------------------------------------
  // Travel Time Machine
  // ---------------------------------------------------------------------------
  travelTimeMachine: {
    title: 'Travel Time Machine',
    labelNow: 'Now',
  },

  // ---------------------------------------------------------------------------
  // Main Character
  // ---------------------------------------------------------------------------
  mainCharacter: {
    headerTitle: 'Main Character',
    emptyTitle: 'No trip to direct',
    emptyBody: 'Plan a trip first, then come back to find your cinematic moments.',
    eyebrow: 'CINEMATIC MOMENTS',
    loadingText: 'Finding your cinematic moments...',
    theStory: 'THE STORY',
    shareButton: 'Share your Shot List',
    footerText: 'Go somewhere that changes you.',
  },

  // ---------------------------------------------------------------------------
  // Memory Lane
  // ---------------------------------------------------------------------------
  memoryLane: {
    title: 'Memory Lane',
    emptySubtitle: 'Your story starts with one trip.\nEvery journey becomes a memory.',
    planFirstTrip: 'Plan Your First Trip',
    screenSubtitle: 'Every trip tells a story',
    statTrips: 'Trips',
    statDays: 'Days',
    statPlaces: 'Places',
    statCountries: 'Countries',
    onThisDay: 'On This Day',
    passportStamps: 'Passport stamps',
    milestones: 'Milestones',
    yourJourney: 'Your journey',
    reliveTrip: 'Relive this trip',
  },

  // ---------------------------------------------------------------------------
  // Budget Guardian
  // ---------------------------------------------------------------------------
  budgetGuardian: {
    title: 'Budget Guardian',
    totalBudget: 'Total budget',
    spent: 'Spent',
    remaining: 'Remaining',
    dailyTarget: 'Daily Target',
    addExpense: 'Add expense',
    addButton: 'Add Expense',
    todaysSpending: "Today's spending",
    categoryBreakdown: 'Category breakdown',
    dailyTrend: 'Daily trend',
    smartAlerts: 'Smart alerts',
    currencyConverter: 'Currency converter',
  },

  // ---------------------------------------------------------------------------
  // Arrival Mode
  // ---------------------------------------------------------------------------
  arrivalMode: {
    label: 'Arrival mode',
    headerSub: "Your first 24 hours. Everything you need, nothing you don't.",
    bestRoute: 'Best route',
    cost: 'Cost',
    time: 'Time',
  },

  // ---------------------------------------------------------------------------
  // Airport Guide
  // ---------------------------------------------------------------------------
  airportGuide: {
    title: 'Airport Survival Guide',
    subtitle: 'Best food, lounges, security, sleep spots, SIM cards, and currency for every major hub.',
    bestFood: 'Best food',
    hiddenLounges: 'Hidden lounges (no membership)',
    fastestSecurity: 'Fastest security',
    sleepWork: 'Best spots to sleep / work',
    simCards: 'SIM cards',
    terminalTransfer: 'Terminal transfer',
  },

  // ---------------------------------------------------------------------------
  // Layover
  // ---------------------------------------------------------------------------
  layover: {
    title: 'Layover Optimizer',
    subtitle: "Tell us where you're flying and how long you have. We'll tell you exactly what to do.",
    departureLabel: 'Departure city',
    destinationLabel: 'Final destination',
    layoverCityLabel: 'Layover city',
    durationLabel: 'Layover duration (hours)',
    generateButton: 'Generate plan',
    inAirport: 'In the airport',
    inCity: 'In the city',
  },

  // ---------------------------------------------------------------------------
  // Dupe Finder
  // ---------------------------------------------------------------------------
  dupeFinder: {
    eyebrow: 'DESTINATION DUPES',
    title: 'Dupe Finder',
    searchLabel: 'Where do you dream of going?',
    findDupes: 'Find Dupes',
    loadingText: 'Scanning the globe for cheaper vibes...',
    yourDream: 'YOUR DREAM',
    vs: 'VS',
    shareButton: 'Share the Dupes',
    dailyCost: 'Daily Cost',
    youSave: 'You Save',
    vibeMatch: 'Vibe Match',
  },

  // ---------------------------------------------------------------------------
  // ROAM for Dates
  // ---------------------------------------------------------------------------
  roamForDates: {
    title: 'ROAM for Dates',
    subtitle: "Merge your travel styles. Find a trip you'll both love.",
    whereTo: 'Where to?',
    partnerStyle: "Partner's style (quick)",
    generating: 'Finding your perfect trip...',
    generateButton: 'Generate our trip',
    viewFullTrip: 'View full trip',
  },

  // ---------------------------------------------------------------------------
  // Visited Map
  // ---------------------------------------------------------------------------
  visitedMap: {
    title: 'Visited Map',
    places: 'Places',
    countries: 'Countries',
    continents: 'Continents',
    totalMiles: 'Total miles traveled',
    continentProgress: 'Continent progress',
    worldGrid: 'World grid',
    addPlace: 'Add a place',
    searchPlaceholder: 'Search destination...',
    syncFromTrips: 'Sync from trips',
    travelStats: 'Travel stats',
    bucketList: 'Bucket list',
    visited: 'Visited',
    allVisitedPlaces: 'All visited places',
  },

  // ---------------------------------------------------------------------------
  // Group Trip
  // ---------------------------------------------------------------------------
  groupTrip: {
    tabItinerary: 'Itinerary',
    tabExpenses: 'Expenses',
    tabChat: 'Chat',
    tabPacking: 'Packing',
    noItinerary: 'No itinerary yet. Add one from your trip.',
    keep: 'Keep',
    swap: 'Swap',
    yourBalance: 'Your balance',
    paid: 'Paid',
    owed: 'Owed',
    addExpense: 'Add expense',
    noMessages: 'No messages yet. Say something.',
    send: 'Send',
  },

  // ---------------------------------------------------------------------------
  // Create Group
  // ---------------------------------------------------------------------------
  createGroup: {
    title: 'Create group trip',
    emptyMessage: 'Plan a trip first, then come back to invite friends.',
    successTitle: 'Group created',
    successSub: 'Share the invite so friends can join',
    openGroup: 'Open group trip',
    groupNameLabel: 'Group name',
    createButton: 'Create group',
  },

  // ---------------------------------------------------------------------------
  // Join Group
  // ---------------------------------------------------------------------------
  joinGroup: {
    invalidLink: 'Invalid link',
    tripNotFound: 'Trip not found',
    youAreInvited: 'You are invited',
    joinButton: 'Join the trip',
    notNow: 'Not now',
  },

  // ---------------------------------------------------------------------------
  // Group tab
  // ---------------------------------------------------------------------------
  groupTab: {
    subtitle: 'Plan together. Split fairly.',
    inviteFriends: 'Invite friends',
    locationSharing: 'Location Sharing',
    shareLocation: 'Share Location',
    totalSpent: 'Total spent',
    tripBudget: 'Trip budget',
    remaining: 'Remaining',
    perDay: 'Per day',
    byCategory: 'By category',
    addExpense: 'Add Expense',
    noExpenses: 'No expenses yet',
    settleUp: 'Settle Up',
    allSettled: 'All settled up',
    noTripYet: 'No trip yet',
    generateFirst: 'Generate a trip first, then invite your crew.',
    generateTrip: 'Generate Trip',
    selectCurrency: 'Select currency',
    tripBudgetTitle: 'Trip Budget',
  },

  // ---------------------------------------------------------------------------
  // Onboard (auth flow)
  // ---------------------------------------------------------------------------
  onboard: {
    whereTo: 'Where to?',
    subtitle: "We'll build you a real trip in seconds",
    surpriseMe: 'Surprise me',
    realPlaces: 'Real places. Real tips. No filler.',
    continueApple: 'Continue with Apple',
    continueGoogle: 'Continue with Google',
    continueEmail: 'Continue with Email',
    viewTripFirst: 'View my trip first',
    saveLater: 'You can save it later',
  },

  // ---------------------------------------------------------------------------
  // Splash
  // ---------------------------------------------------------------------------
  splash: {
    tagline: 'Go somewhere that changes you.',
    browseFirst: 'Browse first',
  },

  // ---------------------------------------------------------------------------
  // Social proof
  // ---------------------------------------------------------------------------
  socialProof: {
    counterLabel: 'travelers joining daily',
    ctaButton: 'I want this',
  },

  // ---------------------------------------------------------------------------
  // Personalization
  // ---------------------------------------------------------------------------
  personalization: {
    eyebrow: 'PERSONALIZED AI',
    title: 'ROAM learns you',
    buildProfile: 'Build my profile',
  },

  // ---------------------------------------------------------------------------
  // Value Preview
  // ---------------------------------------------------------------------------
  valuePreview: {
    title: "Stop Googling.\nStart experiencing.",
    withoutRoam: 'WITHOUT ROAM',
    withRoam: 'WITH ROAM',
    ctaButton: "Let's go",
  },

  // ---------------------------------------------------------------------------
  // Trip detail (public sharing)
  // ---------------------------------------------------------------------------
  tripDetail: {
    invalidLink: 'Invalid link',
    tripNotFound: 'Trip not found',
    couldNotLoad: 'Could not load trip',
    stealTrip: 'Steal this trip',
    stealSub: 'Plan your own version in ROAM',
    copyLink: 'Copy link',
    copied: 'Copied to clipboard',
    openInApp: 'Open in ROAM app',
    footer: 'Shared with ROAM',
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
