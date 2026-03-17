// =============================================================================
// ROAM — Centralized AsyncStorage key constants
// Single source of truth for all storage keys
// =============================================================================

// ---------------------------------------------------------------------------
// Trips & chat
// ---------------------------------------------------------------------------
export const TRIPS = 'roam_trips';
export const TRIPS_THIS_MONTH = 'roam_trips_this_month';
export const CHAT_MESSAGES = 'roam_chat_messages';

// ---------------------------------------------------------------------------
// Pets
// ---------------------------------------------------------------------------
export const PETS = 'roam_pets';
export const PET_REMINDERS = 'roam_pet_reminders';

// ---------------------------------------------------------------------------
// Travel profile & persona
// ---------------------------------------------------------------------------
export const TRAVEL_PROFILE = 'roam_travel_profile';
export const PROFILE_COMPLETED = 'roam_profile_completed';
export const TRAVEL_PERSONA = 'roam_travel_persona';

// ---------------------------------------------------------------------------
// Onboarding
// ---------------------------------------------------------------------------
export const ONBOARDING_COMPLETE = '@roam/onboarding_complete';
export const ONBOARDING_ANSWERS = '@roam/onboarding_answers';

// ---------------------------------------------------------------------------
// Guest mode
// ---------------------------------------------------------------------------
export const GUEST_MODE = '@roam/guest_mode';
export const GUEST_ID = '@roam/guest_id';

// ---------------------------------------------------------------------------
// Home airport & currency
// ---------------------------------------------------------------------------
export const HOME_AIRPORT = 'roam_home_airport';
export const HOME_CURRENCY = 'roam_home_currency';

// ---------------------------------------------------------------------------
// Offline / sync
// ---------------------------------------------------------------------------
export const OFFLINE_TRIPS = '@roam/trips';
export const OFFLINE_ITINERARY_PREFIX = '@roam/itinerary/';
export const OFFLINE_LAST_SYNC = '@roam/lastSync';

// ---------------------------------------------------------------------------
// Caches (prefixes)
// ---------------------------------------------------------------------------
export const CACHE_EXCHANGE_RATES = 'roam_exchange_rates';
export const CACHE_LANGUAGE = 'roam_language_pack_cache';
export const CACHE_TRAVEL_ADVISORIES = 'roam_travel_advisories';
export const CACHE_WEATHER_PREFIX = 'roam_weather_';
export const CACHE_VISA_PREFIX = 'roam_visa_';
export const CACHE_EVENTS_PREFIX = 'roam_events_';
export const CACHE_SONAR_PREFIX = 'roam_sonar_';

// ---------------------------------------------------------------------------
// Feature-specific
// ---------------------------------------------------------------------------
export const FLIGHT_DEALS = 'roam_flight_deals';
export const SHARE_CARD = 'roam_share_card';
export const EMERGENCY_CONTACT = '@roam/emergency_contact';
export const PEOPLE_MET = 'roam_people_met';
export const ERROR_COUNTS = '@roam/error_counts';
export const HYPE_TRIPS = '@roam/hype_trips';
export const REFERRAL_DATA = '@roam/referral_data';
export const REFERRAL_REF = '@roam/referral_ref';
export const PASSPORT_STAMPS = '@roam/passport_stamps';
export const VISITED_PLACES = '@roam/visited_places';
export const BUCKET_LIST = '@roam/bucket_list';
export const USER_PREFS = '@roam/user_prefs';
export const RATING_STATE = '@roam/rating_state';
export const RATED_BADGE = '@roam/rated_badge';
export const NPS_LAST_PROMPT = '@roam/nps_last_prompt';
export const NPS_DISMISSED = '@roam/nps_dismissed';
export const NPS_TRIP_COUNT_SHOWN = '@roam/nps_trip_count_shown';
export const AB_SESSION_ID = '@roam/ab_session_id';
export const AB_VARIANT = '@roam/ab_variant';
export const LAST_OPEN_AT = '@roam/last_open_at';
export const STREAK_LAST_OPEN = '@roam/streak_last_open_date';
export const STREAK_DAILY_OPENS = '@roam/streak_daily_opens';
export const STREAK_REMINDER = '@roam/streak_reminder_scheduled';
export const USER_PASSPORTS = 'roam_user_passports';

// ---------------------------------------------------------------------------
// Prefixes (for keys with dynamic suffixes)
// ---------------------------------------------------------------------------
export const PACKING_PREFIX = 'roam_packing_';
export const PUSH_PREFIX = 'roam_push_';
export const PREP_PREFIX = '@roam/prep/';

// ---------------------------------------------------------------------------
// App version (storage-version)
// ---------------------------------------------------------------------------
export const APP_VERSION = '@roam/app_version';

// ---------------------------------------------------------------------------
// Language survival
// ---------------------------------------------------------------------------
export const LANGUAGE_SURVIVAL_CACHE = '@roam/language-survival-cache';

// ---------------------------------------------------------------------------
// Locale / i18n
// ---------------------------------------------------------------------------
export const LOCALE = '@roam/locale';
