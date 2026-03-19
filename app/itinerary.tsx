// =============================================================================
// ROAM — Itinerary Screen (production)
// =============================================================================
import React, { useCallback, useEffect, useMemo, useRef, useState } from 'react';
import {
  Alert,
  Dimensions,
  ImageBackground,
  Linking,
  Modal,
  NativeSyntheticEvent,
  NativeScrollEvent,
  Platform,
  Pressable,
  ScrollView,
  StyleSheet,
  Text,
  View,
  type TextStyle,
  type ViewStyle,
  FlatList,
} from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { useLocalSearchParams, useRouter } from 'expo-router';
import { LinearGradient } from 'expo-linear-gradient';
// react-native-maps crashes on web — only import on native
const isWeb = Platform.OS === 'web';
const MapView = isWeb ? View : require('react-native-maps').default;
const Marker = isWeb ? View : require('react-native-maps').Marker;
const Polyline = isWeb ? View : require('react-native-maps').Polyline;
const Circle = isWeb ? View : require('react-native-maps').Circle;
const PROVIDER_GOOGLE = isWeb ? undefined : require('react-native-maps').PROVIDER_GOOGLE;
// DraggableFlatList crashes on web — lazy import on native only
type FlatListProps = React.ComponentProps<typeof FlatList>;
const DraggableFlatList = Platform.OS === 'web'
  ? ({ data, renderItem, keyExtractor, ...rest }: FlatListProps) => {
      return <FlatList data={data} renderItem={renderItem} keyExtractor={keyExtractor} {...rest} />;
    }
  : require('react-native-draggable-flatlist').default;
type RenderItemParams<T> = { item: T; drag: () => void; isActive: boolean };
import * as Haptics from '../lib/haptics';
import { useTranslation } from 'react-i18next';

import { COLORS, FONTS, SPACING, RADIUS, AFFILIATES } from '../lib/constants';
import { useDestinationTheme } from '../lib/useDestinationTheme';

const { width: SCREEN_WIDTH } = Dimensions.get('window');
import { useAppStore, type Trip } from '../lib/store';
import {
  parseItinerary,
  type Itinerary,
  type ItineraryDay,
  type TimeSlotActivity,
} from '../lib/types/itinerary';
import { getWeatherForecast, type WeatherForecast } from '../lib/weather';
import { generatePackingList } from '../lib/packing-ai';
import { enrichVenues, enrichVenuesViaPlacesProxy, getTodayHours, type EnrichedVenue } from '../lib/venues';
import { saveItineraryOffline } from '../lib/offline';
import {
  saveItineraryOffline as saveItineraryOfflineEnhanced,
  loadOfflineItinerary,
} from '../lib/offline-itinerary';
import { exportCalendar } from '../lib/calendar';
import { shareTrip, shareTripAsCard, copyShareableLink } from '../lib/sharing';
import { recordGrowthEvent } from '../lib/growth-hooks';
import { evaluateTrigger } from '../lib/smart-triggers';
import { buildDayNarration, narrateItinerary, type NarrationController } from '../lib/elevenlabs';
import WeatherCard from '../components/features/WeatherCard';
import FlightPriceCard from '../components/features/FlightPriceCard';
import WeatherDayStrip from '../components/features/WeatherDayStrip';
import RainAlternativesCard from '../components/features/RainAlternativesCard';
import VenueCard from '../components/features/VenueCard';
import VoiceGuide from '../components/features/VoiceGuide';
import PackingList from '../components/features/PackingList';
import ShareCard from '../components/features/ShareCard';
import BreathingLine from '../components/ui/BreathingLine';
import { SkeletonCard } from '../components/premium/LoadingStates';
import BudgetChart from '../components/features/BudgetChart';
import SafetyScoreCard from '../components/features/SafetyScoreCard';
import SafetyScoreBadge from '../components/features/SafetyScoreBadge';
import VisaChecker from '../components/features/VisaChecker';
import TripEventsCard from '../components/features/TripEventsCard';
import BookingCards from '../components/features/BookingCards';
import EmergencySOS from '../components/features/EmergencySOS';
import FlightCard from '../components/features/FlightCard';
import FlightDealCard from '../components/features/FlightDealCard';
import LocalEventsSection from '../components/features/LocalEventsSection';
import TripSoundtrackCard from '../components/features/TripSoundtrackCard';
import PostTripUpgradeNudge from '../components/monetization/PostTripUpgradeNudge';
import CarbonFootprintCard from '../components/features/CarbonFootprintCard';
import PriceOracleCard from '../components/features/PriceOracleCard';
import LanguageSurvivalSection from '../components/features/LanguageSurvivalSection';
import RoamersNearSection from '../components/features/RoamersNearSection';
import TripInsuranceCards from '../components/features/TripInsuranceCards';
import ReturnTripSection from '../components/features/ReturnTripSection';
import CurrencyToggle, { useCurrency } from '../components/features/CurrencyToggle';
import MapboxRouteMap from '../components/features/MapboxRouteMap';
import CollaboratorRow from '../components/features/CollaboratorRow';
import ActivityVoteButtons from '../components/features/ActivityVoteButtons';
import InviteSheet from '../components/features/InviteSheet';
import { useGroupTrip, type VoteDirection, type TimeSlot as GroupTimeSlot } from '../lib/group-trip';
import {
  buildSafetyZones,
  SAFETY_COLORS,
} from '../lib/neighborhood-safety';
import { formatDualPrice, formatLocalPrice, type ExchangeRates } from '../lib/currency';
import { AlertTriangle, X, Pencil, Calendar, Link2, Share2, MapPin, Map as LucideMap, Receipt, Film, Wallet, Train, CreditCard, Plane, Heart, ShieldCheck, Droplets, Globe, Sun, Wind, PartyPopper, Camera, Clock, ChevronRight, Printer, Users } from 'lucide-react-native';
import { getTransitGuide, type TransitGuide } from '../lib/transit-data';
import { getHomeAirport } from '../lib/flights';
import { getMedicalGuideByDestination, type MedicalGuide } from '../lib/medical-abroad';
import { getTimezoneByDestination, getTimezoneInfo, getTimeDifference, type TimezoneInfo } from '../lib/timezone';
import { getAirQuality, resolveDestinationCoords, type AirQuality } from '../lib/air-quality';
import { getSunTimes, type SunTimes } from '../lib/sun-times';
import { getCountryCode, getPublicHolidays, getHolidaysDuringTrip, type PublicHoliday } from '../lib/public-holidays';
import { getCostOfLiving, type CostOfLiving } from '../lib/cost-of-living';
import { getHeroPhotoUrl } from '../lib/heroPhotos';
import { trackItineraryView, maybePromptForReview } from '../lib/rating';
import { maybePromptNPS } from '../lib/nps';
import { trackEvent } from '../lib/analytics';
import { captureEvent } from '../lib/posthog';
import MockDataBadge from '../components/ui/MockDataBadge';
import ActivityEditModal from '../components/features/ActivityEditModal';
import RouteIntelCard from '../components/features/RouteIntelCard';
import SeasonalIntel from '../components/features/SeasonalIntel';
import AudioGuideBar from '../components/audio/AudioGuideBar';
import PocketConcierge from '../components/features/PocketConcierge';
import NarrationToggle from '../components/audio/NarrationToggle';
import { getPlaceTips, type FSQTip } from '../lib/apis/foursquare';
import { searchActivities, type GYGActivity } from '../lib/apis/getyourguide';
import { useTripSync } from '../lib/realtime-sync';
import SyncIndicator from '../components/ui/SyncIndicator';
import { styles } from '../components/itinerary/itinerary-styles';

// =============================================================================
// Component
// =============================================================================
export default function ItineraryScreen() {
  const insets = useSafeAreaInsets();
  const router = useRouter();
  const { t } = useTranslation();
  const params = useLocalSearchParams<{ data?: string; tripId?: string; map?: string }>();
  const trips = useAppStore((s) => s.trips);

  // ---------------------------------------------------------------------------
  // State
  // ---------------------------------------------------------------------------
  const [parsed, setParsed] = useState<Itinerary | null>(null);
  const [trip, setTrip] = useState<Trip | null>(null);
  const [weather, setWeather] = useState<WeatherForecast | null>(null);
  const [venueData, setVenueData] = useState<Map<string, EnrichedVenue>>(new Map<string, EnrichedVenue>([]));
  const transitGuide = useMemo(() => trip ? getTransitGuide(trip.destination) : null, [trip]);
  const medicalGuide = useMemo(() => trip ? getMedicalGuideByDestination(trip.destination) : null, [trip]);
  const costOfLiving = useMemo(() => trip ? getCostOfLiving(trip.destination) : null, [trip]);

  // Destination intel — async data
  const [timezoneInfo, setTimezoneInfo] = useState<TimezoneInfo | null>(null);
  const [airQuality, setAirQuality] = useState<AirQuality | null>(null);
  const [sunTimes, setSunTimes] = useState<SunTimes | null>(null);
  const [tripHolidays, setTripHolidays] = useState<PublicHoliday[]>([]);
  const [homeAirport, setHomeAirportLocal] = useState('JFK');

  const [activeDay, setActiveDay] = useState(0);
  const [viewMode, setViewMode] = useState<'list' | 'map'>(params.map === '1' ? 'map' : 'list');
  const [selectedPin, setSelectedPin] = useState<string | null>(null);
  const [safetyOverlay, setSafetyOverlay] = useState(false);
  const [editMode, setEditMode] = useState(false);
  const [shareVisible, setShareVisible] = useState(false);
  const [shareNudgeDismissed, setShareNudgeDismissed] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [editingActivity, setEditingActivity] = useState<{
    slot: 'morning' | 'afternoon' | 'evening';
    data: TimeSlotActivity;
  } | null>(null);
  const [narrationController, setNarrationController] = useState<NarrationController | null>(null);
  const [fsqTipsMap, setFsqTipsMap] = useState<Map<string, FSQTip[]>>(new Map<string, FSQTip[]>([]));
  const [gygActivities, setGygActivities] = useState<GYGActivity[] | null>(null);
  const mapRef = useRef<typeof MapView>(null);
  const dayPagerRef = useRef<ScrollView>(null);
  const updateTrip = useAppStore((s) => s.updateTrip);
  const addTrip = useAppStore((s) => s.addTrip);

  const isSharedTrip = trip?.id?.startsWith('shared-') ?? false;
  const packingTrackedRef = useRef(false);

  // Currency conversion hook — live exchange rates
  const { currency, rates } = useCurrency();

  // Destination color theme — shifts accent colors per destination
  const destTheme = useDestinationTheme(trip?.destination);

  // Realtime sync — keeps itinerary in sync with web edits and new moments
  const { isSynced, lastSyncedAt, syncError } = useTripSync(trip?.id ?? null);

  // Group trip — collaborators, votes, invite
  const {
    collaborators: groupCollaborators,
    votes: groupVotes,
    inviteLink: groupInviteLink,
    isGroupTrip,
    createInvite: createGroupInvite,
    vote: castGroupVote,
  } = useGroupTrip(trip?.id ?? null);
  const [inviteSheetVisible, setInviteSheetVisible] = useState(false);

  // ---------------------------------------------------------------------------
  // Resolve trip from params
  // ---------------------------------------------------------------------------
  useEffect(() => {
    let npsTimer: ReturnType<typeof setTimeout> | null = null;
    try {
      let resolved: Trip | null = null;

      if (params.data) {
        resolved = JSON.parse(params.data) as Trip;
      } else if (params.tripId) {
        resolved = trips.find((t) => t.id === params.tripId) ?? null;
      }

      if (!resolved) {
        setError('Couldn\u2019t find that trip. It may have been removed \u2014 head back and try again.');
        return;
      }

      setTrip(resolved);

      // Parse itinerary
      const itinerary = parseItinerary(resolved.itinerary);
      setParsed(itinerary);

      // Save offline (both legacy + enhanced with destination + emergency numbers)
      saveItineraryOffline(resolved.id, itinerary).catch(() => {});
      saveItineraryOfflineEnhanced(resolved.id, itinerary, resolved.destination).catch(() => {});

      // Track for rating prompt — ask after first itinerary
      trackItineraryView().then(() => {
        maybePromptForReview().catch(() => {});
      });

      recordGrowthEvent('itinerary_view').catch(() => {});
      evaluateTrigger('itinerary_view').catch(() => {});
      trackEvent('itinerary_viewed', {
        destination: resolved.destination,
        days: resolved.days,
        tripId: resolved.id,
      }).catch(() => {});

      // NPS survey — after 3rd trip, delayed so user sees itinerary first
      const tripCount = trips.length;
      if (tripCount >= 3) {
        npsTimer = setTimeout(() => {
          maybePromptNPS(tripCount, () => router.push('/referral')).catch(() => {});
        }, 8000);
      }

    } catch (err) {
      // Attempt offline fallback before showing error
      const offlineTripId = params.tripId ?? '';
      if (offlineTripId) {
        loadOfflineItinerary(offlineTripId).then((offlineData) => {
          if (offlineData) {
            setParsed(offlineData.itinerary);
            setTrip({
              id: offlineTripId,
              destination: offlineData.destination,
              days: offlineData.itinerary.days.length,
              budget: 'comfort',
              vibes: [],
              itinerary: JSON.stringify(offlineData.itinerary),
              createdAt: offlineData.savedAt,
            });
          } else {
            setError(
              err instanceof Error ? err.message : 'Something went sideways loading your trip. Give it another shot.'
            );
          }
        }).catch(() => {
          setError(
            err instanceof Error ? err.message : 'Something went sideways loading your trip. Give it another shot.'
          );
        });
      } else {
        setError(
          err instanceof Error ? err.message : 'Something went sideways loading your trip. Give it another shot.'
        );
      }
    }
    return () => { if (npsTimer) clearTimeout(npsTimer); };
    // eslint-disable-next-line react-hooks/exhaustive-deps -- trips intentionally excluded
  }, [params.data, params.tripId, trips.length, router]);

  // ---------------------------------------------------------------------------
  // Fetch weather (aligned to trip dates when available)
  // ---------------------------------------------------------------------------
  useEffect(() => {
    if (!trip) return;
    const startDate = trip.createdAt ? trip.createdAt.split('T')[0] : undefined;
    getWeatherForecast(trip.destination, {
      startDate,
      days: trip.days,
    })
      .then((forecast) => {
        setWeather(forecast);
        trackEvent('weather_check', { destination: trip.destination }).catch(() => {});
      })
      .catch(() => setWeather(null));
    // eslint-disable-next-line react-hooks/exhaustive-deps -- trip intentionally excluded
  }, [trip?.destination, trip?.createdAt, trip?.days]);

  // Load user's home airport preference
  useEffect(() => {
    getHomeAirport().then(setHomeAirportLocal).catch(() => {});
  }, []);

  // ---------------------------------------------------------------------------
  // Fetch destination intel (timezone, AQI, sun, holidays)
  // ---------------------------------------------------------------------------
  useEffect(() => {
    if (!trip || !parsed) return;
    const dest = trip.destination;

    // Timezone
    const tz = getTimezoneByDestination(dest);
    if (tz) {
      getTimezoneInfo(tz).then(setTimezoneInfo).catch(() => {});
    }

    // Air quality + sun times — resolve coords (offline + geocoding fallback)
    resolveDestinationCoords(dest).then((coords) => {
      if (!coords) return;
      getAirQuality(coords.lat, coords.lng).then(setAirQuality).catch(() => {});
      getSunTimes(coords.lat, coords.lng).then(setSunTimes).catch(() => {});
    }).catch(() => {});

    // Public holidays
    const cc = getCountryCode(dest);
    if (cc) {
      getPublicHolidays(cc).then((holidays) => {
        const startDate = trip.createdAt.split('T')[0];
        const overlap = getHolidaysDuringTrip(holidays, startDate, trip.days);
        setTripHolidays(overlap);
      }).catch(() => {});
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps -- trip intentionally excluded
  }, [trip?.destination, parsed]);

  // ---------------------------------------------------------------------------
  // Fetch venue enrichment data
  // ---------------------------------------------------------------------------
  useEffect(() => {
    if (!parsed || !trip) return;

    // Collect all unique activity + accommodation names
    const queries: Array<{ name: string; city: string; key: string }> = [];

    for (const day of parsed.days) {
      for (const slot of ['morning', 'afternoon', 'evening'] as const) {
        const activity = day[slot];
        queries.push({
          name: activity.activity,
          city: trip.destination,
          key: activity.activity,
        });
      }
      // Also enrich accommodation
      queries.push({
        name: day.accommodation.name,
        city: trip.destination,
        key: `accom::${day.accommodation.name}`,
      });
    }

    // Deduplicate by key
    const seen = new Set<string>();
    const unique = queries.filter((q) => {
      if (seen.has(q.key)) return false;
      seen.add(q.key);
      return true;
    });

    const destination = trip.destination;
    Promise.all([
      enrichVenues(unique.map((q) => ({ name: q.name, city: q.city }))),
      enrichVenuesViaPlacesProxy(destination, unique),
    ])
      .then(([results, placesMap]) => {
        const map = new Map<string, EnrichedVenue>([]);
        unique.forEach((q, i) => {
          const fromEnrich = results[i];
          const fromPlaces = placesMap.get(q.key);
          if (fromPlaces) {
            map.set(q.key, fromPlaces);
          } else if (fromEnrich) {
            map.set(q.key, fromEnrich);
          }
        });
        setVenueData(map);
      })
      .catch(() => setVenueData(new Map<string, EnrichedVenue>([])));
    // eslint-disable-next-line react-hooks/exhaustive-deps -- trip intentionally excluded
  }, [parsed, trip?.destination]);

  // ---------------------------------------------------------------------------
  // Derived data for the active day
  // ---------------------------------------------------------------------------
  const currentDay: ItineraryDay | undefined = parsed?.days[activeDay];

  // Packing AI — personalized list from weather + activities + trip length
  const packingResult = useMemo(() => {
    if (!parsed || !trip || !weather) return null;
    try {
      return generatePackingList({
        destination: trip.destination,
        days: trip.days,
        vibes: trip.vibes,
        budget: trip.budget,
        itinerary: parsed,
        weatherForecast: weather,
      });
    } catch {
      return null;
    }
  // eslint-disable-next-line react-hooks/exhaustive-deps -- trip destructured for stability
  }, [parsed, trip?.destination, trip?.days, trip?.vibes, trip?.budget, weather]);

  useEffect(() => {
    if (packingResult && trip && !packingTrackedRef.current) {
      packingTrackedRef.current = true;
      trackEvent('packing_list_generated', { destination: trip.destination }).catch(() => {});
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps -- trip intentionally excluded
  }, [packingResult, trip]);

  const narrationText = useMemo(() => {
    if (!currentDay || !trip) return '';
    return buildDayNarration({
      destination: trip.destination,
      dayNumber: currentDay.day,
      theme: currentDay.theme,
      morning: currentDay.morning,
      afternoon: currentDay.afternoon,
      evening: currentDay.evening,
    });
    // eslint-disable-next-line react-hooks/exhaustive-deps -- trip used for narration only
  }, [currentDay, trip]);

  // Full itinerary narration handler
  const handleStartFullNarration = useCallback(() => {
    if (!parsed) return;
    // Stop previous controller if exists
    if (narrationController?.isPlaying()) {
      narrationController.stop();
      setNarrationController(null);
      return;
    }
    const controller = narrateItinerary(parsed, {
      onDayChange: (day) => setActiveDay(day),
      onComplete: () => setNarrationController(null),
    });
    setNarrationController(controller);
    controller.play();
  }, [parsed, narrationController]);

  // Cleanup narration on unmount
  useEffect(() => {
    return () => {
      narrationController?.stop();
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  // GetYourGuide bookable experiences
  useEffect(() => {
    if (!trip?.destination) return;
    let cancelled = false;
    searchActivities(trip.destination).then((results) => {
      if (!cancelled) setGygActivities(results?.slice(0, 8) ?? null);
    });
    return () => { cancelled = true; };
  }, [trip?.destination]);

  // Foursquare tips for enriched venues
  useEffect(() => {
    if (!venueData || venueData.size === 0) return;
    let cancelled = false;
    const entries = Array.from(venueData.entries()).slice(0, 10);
    entries.forEach(([key, venue]) => {
      if (venue.place_id) {
        getPlaceTips(venue.place_id).then((tips) => {
          if (!cancelled && tips?.length) {
            setFsqTipsMap((prev) => {
              const next = new Map<string, FSQTip[]>(prev);
              next.set(key, tips.slice(0, 2));
              return next;
            });
          }
        });
      }
    });
    return () => { cancelled = true; };
  }, [venueData]);

  const fallbackNow = useMemo(
    () => Date.now(), // eslint-disable-line react-hooks/purity -- fallback when trip.createdAt missing
    []
  );
  const localEventsDates = useMemo(() => {
    if (!trip) return { startDate: '', endDate: '' };
    const startDate = trip.createdAt ? trip.createdAt.split('T')[0] : new Date(fallbackNow).toISOString().split('T')[0];
    const d = new Date(trip.createdAt || fallbackNow);
    d.setDate(d.getDate() + trip.days);
    const endDate = d.toISOString().split('T')[0];
    return { startDate, endDate };
  // eslint-disable-next-line react-hooks/exhaustive-deps -- trip intentionally excluded
  }, [fallbackNow, trip?.createdAt, trip?.days]);

  // ---------------------------------------------------------------------------
  // Map pins for the active day
  // ---------------------------------------------------------------------------
  const mapPins = useMemo(() => {
    if (!currentDay) return [];
    const slots = ['morning', 'afternoon', 'evening'] as const;
    const pins: Array<{
      key: string;
      label: string;
      index: number;
      slot: 'morning' | 'afternoon' | 'evening';
      lat: number;
      lng: number;
      venue: EnrichedVenue;
    }> = [];

    slots.forEach((slot, i) => {
      const activity = currentDay[slot];
      const venue = venueData.get(activity.activity);
      if (venue?.lat != null && venue?.lng != null) {
        pins.push({
          key: `${slot}-${activity.activity}`,
          label: slot.charAt(0).toUpperCase() + slot.slice(1),
          index: i + 1,
          slot,
          lat: venue.lat,
          lng: venue.lng,
          venue,
        });
      }
    });

    return pins;
  }, [currentDay, venueData]);

  const safetyZones = useMemo(() => {
    if (!safetyOverlay || mapPins.length === 0) return [];
    return buildSafetyZones(
      mapPins.map((p) => ({ lat: p.lat, lng: p.lng, slot: p.slot }))
    );
  }, [mapPins, safetyOverlay]);

  // Fit map to show all pins when pins change
  useEffect(() => {
    if (viewMode === 'map' && mapPins.length > 0 && mapRef.current) {
      const coords = mapPins.map((p) => ({
        latitude: p.lat,
        longitude: p.lng,
      }));
      mapRef.current.fitToCoordinates(coords, {
        edgePadding: { top: 80, right: 60, bottom: 300, left: 60 },
        animated: true,
      });
    }
  }, [mapPins, viewMode]);

  const totalBudgetNumeric = useMemo(() => {
    if (!parsed) return undefined;
    const num = parseFloat(parsed.totalBudget.replace(/[^0-9.]/g, ''));
    return isNaN(num) ? undefined : num;
  }, [parsed]);

  // ---------------------------------------------------------------------------
  // Draggable activities for current day
  // ---------------------------------------------------------------------------
  type DraggableActivity = {
    key: string;
    slot: 'morning' | 'afternoon' | 'evening';
    data: TimeSlotActivity;
  };

  const draggableActivities = useMemo<DraggableActivity[]>(() => {
    if (!currentDay) return [];
    return (['morning', 'afternoon', 'evening'] as const).map((slot) => ({
      key: `${activeDay}-${slot}`,
      slot,
      data: currentDay[slot],
    }));
  }, [currentDay, activeDay]);

  const handleReorder = useCallback(
    ({ data: reordered }: { data: DraggableActivity[] }) => {
      if (!parsed || !trip) return;

      Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Medium);

      // Build the updated day by assigning reordered activities to the 3 fixed slots
      const slots = ['morning', 'afternoon', 'evening'] as const;
      const updatedDay: ItineraryDay = { ...parsed.days[activeDay] };
      slots.forEach((slot, i) => {
        updatedDay[slot] = reordered[i].data;
      });

      const updatedDays = [...parsed.days];
      updatedDays[activeDay] = updatedDay;
      const updatedItinerary: Itinerary = { ...parsed, days: updatedDays };

      setParsed(updatedItinerary);

      // Persist to store + offline
      const updatedItineraryStr = JSON.stringify(updatedItinerary);
      updateTrip(trip.id, { itinerary: updatedItineraryStr });
      saveItineraryOffline(trip.id, updatedItinerary).catch(() => {});
    },
    [parsed, trip, activeDay, updateTrip]
  );

  // ---------------------------------------------------------------------------
  // Handlers
  // ---------------------------------------------------------------------------
  const handleClose = useCallback(() => {
    if (router.canGoBack()) {
      router.back();
    } else {
      router.replace('/(tabs)');
    }
  }, [router]);

  const openAffiliate = useCallback((url: string) => {
    Linking.openURL(url).catch(() =>
      Alert.alert('Hmm', 'Couldn\u2019t open that link. Try copying it manually or check your connection.')
    );
  }, []);

  const handleGetDirections = useCallback((placeId: string) => {
    const url = `https://www.google.com/maps/dir/?api=1&destination_place_id=${placeId}`;
    Linking.openURL(url).catch(() =>
      Alert.alert('Hmm', 'Couldn\u2019t open Maps. Make sure you have a maps app installed.')
    );
  }, []);

  const handleCalendarExport = useCallback(() => {
    if (!parsed) return;
    Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
    const startDate = trip?.createdAt ? new Date(trip.createdAt) : new Date();
    exportCalendar(parsed, startDate).catch(() =>
      Alert.alert('Export Failed', 'Couldn\u2019t add this to your calendar. Check that ROAM has calendar access in Settings.')
    );
  }, [parsed, trip]);

  const handleShareLink = useCallback(async () => {
    if (!trip) return;
    Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
    captureEvent('itinerary_shared', { destination: trip.destination, tripId: trip.id });
    recordGrowthEvent('trip_shared').catch(() => {});
    evaluateTrigger('post_share').catch(() => {});
    const shared = await shareTrip(trip);
    if (!shared) {
      const copied = await copyShareableLink(trip);
      if (copied) Alert.alert('Copied!', 'Share link copied to clipboard.');
    }
  }, [trip]);

  const handleShareAsCard = useCallback(async () => {
    if (!trip || !parsed) return;
    Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
    captureEvent('itinerary_shared', { destination: trip.destination, tripId: trip.id, method: 'card' });
    recordGrowthEvent('trip_shared').catch(() => {});
    try {
      await shareTripAsCard(trip, parsed);
    } catch {
      // user dismissed or share not available
    }
  }, [trip, parsed]);

  // ---------------------------------------------------------------------------
  // Activity edit — save handler
  // ---------------------------------------------------------------------------
  const handleActivitySave = useCallback(
    (updated: TimeSlotActivity) => {
      if (!parsed || !trip || !editingActivity) return;

      const updatedDay: ItineraryDay = { ...parsed.days[activeDay] };
      updatedDay[editingActivity.slot] = updated;

      const updatedDays = [...parsed.days];
      updatedDays[activeDay] = updatedDay;
      const updatedItinerary: Itinerary = { ...parsed, days: updatedDays };

      setParsed(updatedItinerary);
      updateTrip(trip.id, { itinerary: JSON.stringify(updatedItinerary) });
      saveItineraryOffline(trip.id, updatedItinerary).catch(() => {});

      setEditingActivity(null);
      Haptics.notificationAsync(Haptics.NotificationFeedbackType.Success);
    },
    [parsed, trip, activeDay, editingActivity, updateTrip]
  );

  // ---------------------------------------------------------------------------
  // Venue card renderer — enriched card when available, else tappable fallback (Maps / Booking.com)
  // ---------------------------------------------------------------------------
  const openMapsForPlace = useCallback((name: string, address?: string) => {
    const query = [name, address, trip?.destination].filter(Boolean).join(', ');
    if (!query.trim()) return;
    const url = `https://www.google.com/maps/search/?api=1&query=${encodeURIComponent(query)}`;
    Linking.openURL(url).catch(() => {});
  }, [trip?.destination]);

  const openBookingForHotel = useCallback((name: string) => {
    const query = [trip?.destination, name].filter(Boolean).join(' ');
    const url = `https://www.booking.com/searchresults.html?ss=${encodeURIComponent(query)}`;
    Linking.openURL(url).catch(() => {});
  }, [trip?.destination]);

  const renderVenueCard = (activityKey: string, options?: { isHotel?: boolean; location?: string; address?: string; name?: string }) => {
    const venue = venueData.get(activityKey);
    const isHotel = options?.isHotel ?? activityKey.startsWith('accom::');
    const fallbackName = options?.name ?? options?.location ?? (isHotel ? activityKey.replace(/^accom::/, '') : '');

    if (!venue) {
      if (!fallbackName?.trim()) return null;
      const onPress = isHotel
        ? () => { Haptics.selectionAsync(); openBookingForHotel(fallbackName); }
        : () => { Haptics.selectionAsync(); openMapsForPlace(options?.location ?? fallbackName, options?.address); };
      return (
        <View style={styles.section}>
          <Pressable onPress={onPress} style={styles.fallbackVenueCard} accessibilityRole="button" accessibilityLabel={isHotel ? `Find ${fallbackName} on Booking.com` : `Open ${fallbackName} in Maps`}>
            <MapPin size={20} color={COLORS.sage} strokeWidth={1.5} />
            <View style={styles.fallbackVenueContent}>
              <Text style={styles.fallbackVenueName} numberOfLines={2}>{fallbackName}</Text>
              <Text style={styles.fallbackVenueAction}>{isHotel ? 'Find on Booking.com' : 'Open in Maps'}</Text>
            </View>
            <ChevronRight size={18} color={COLORS.creamMuted} strokeWidth={1.5} />
          </Pressable>
        </View>
      );
    }

    const tips = fsqTipsMap.get(activityKey);
    const tapTarget = isHotel ? 'hotel' : 'activity';
    const poweredByGoogle = !!(venue.photo_url || (venue.rating != null));
    const gygMatch = gygActivities?.find(
      (a) => a.name && venue.name && (venue.name.toLowerCase().includes(a.name.toLowerCase()) || a.name.toLowerCase().includes(venue.name.toLowerCase()))
    );
    const bookingUrl = gygMatch?.bookingUrl ?? undefined;
    return (
      <View style={styles.section}>
        <VenueCard
          name={venue.name}
          photo_url={venue.photo_url}
          rating={venue.rating}
          reviews_count={venue.user_ratings_total}
          address={venue.formatted_address}
          open_now={venue.opening_hours?.open_now ?? null}
          hours_today={getTodayHours(venue.opening_hours?.weekday_text)}
          maps_url={venue.maps_url}
          booking_url={bookingUrl}
          city={trip?.destination}
          tapTarget={tapTarget}
          destination={trip?.destination}
          poweredByGoogle={poweredByGoogle}
        />
        {tips && tips.length > 0 && (
          <View style={styles.fsqTipsContainer}>
            {tips.map((tip, idx) => (
              <View key={idx} style={styles.fsqTipRow}>
                <Text style={styles.fsqTipText} numberOfLines={3}>{tip.text}</Text>
                {tip.agreeCount > 0 && (
                  <Text style={styles.fsqTipAgree}>{tip.agreeCount} agree</Text>
                )}
              </View>
            ))}
          </View>
        )}
      </View>
    );
  };

  // ---------------------------------------------------------------------------
  // Error state
  // ---------------------------------------------------------------------------
  if (error) {
    return (
      <View style={[styles.screen, { paddingTop: insets.top }]}>
        <View style={styles.errorContainer}>
          <View style={styles.errorIconWrap}><AlertTriangle size={48} color={COLORS.coral} strokeWidth={1.5} /></View>
          <Text style={styles.errorText}>{error}</Text>
          <Text style={styles.errorHint}>Head back and try building your trip again.</Text>
          <Pressable onPress={handleClose} style={styles.errorButton}>
            <Text style={styles.errorButtonText}>Go Back</Text>
          </Pressable>
        </View>
      </View>
    );
  }

  // ---------------------------------------------------------------------------
  // Loading state — skeleton matching itinerary layout
  // ---------------------------------------------------------------------------
  if (!parsed || !trip) {
    return (
      <View style={[styles.screen, { paddingTop: insets.top }]}>
        <View style={[styles.header, { paddingHorizontal: SPACING.lg }]}>
          <View style={[styles.headerLeft, { width: 44 }]}>
            <SkeletonCard width={44} height={44} borderRadius={RADIUS.md} />
          </View>
          <View style={{ flex: 1, marginHorizontal: SPACING.md }}>
            <SkeletonCard width="100%" height={20} borderRadius={RADIUS.md} />
          </View>
          <View style={[styles.headerRight, { width: 44 }]}>
            <SkeletonCard width={44} height={44} borderRadius={RADIUS.md} />
          </View>
        </View>
        <ScrollView horizontal showsHorizontalScrollIndicator={false} contentContainerStyle={{ paddingHorizontal: SPACING.lg, gap: SPACING.sm, paddingVertical: SPACING.md }}>
          {[1, 2, 3, 4, 5].map((i) => (
            <SkeletonCard key={i} width={72} height={40} borderRadius={RADIUS.full} />
          ))}
        </ScrollView>
        <ScrollView style={{ flex: 1 }} contentContainerStyle={{ padding: SPACING.lg, gap: SPACING.lg }}>
          <SkeletonCard width="100%" height={180} borderRadius={RADIUS.lg} />
          <SkeletonCard width="100%" height={120} borderRadius={RADIUS.lg} />
          <SkeletonCard width="100%" height={120} borderRadius={RADIUS.lg} />
          <SkeletonCard width="100%" height={120} borderRadius={RADIUS.lg} />
        </ScrollView>
        <View style={{ paddingBottom: insets.bottom + SPACING.md, alignItems: 'center' }}>
          <BreathingLine width={80} height={4} color={destTheme.primary} />
        </View>
      </View>
    );
  }

  // ---------------------------------------------------------------------------
  // Render
  // ---------------------------------------------------------------------------
  return (
    <View style={[styles.screen, { paddingTop: insets.top }]}>
      {/* ── Header ─────────────────────────────────────────────────────── */}
      <View style={styles.header}>
        <View style={styles.headerLeft}>
          <Pressable
            onPress={handleClose}
            hitSlop={12}
            style={({ pressed }) => [
              styles.headerBtn,
              { opacity: pressed ? 0.6 : 1 },
            ]}
          >
            <X size={22} color={COLORS.cream} strokeWidth={1.5} />
          </Pressable>
        </View>

        <Text style={styles.headerTitle} numberOfLines={1}>
          {parsed.destination}
        </Text>

        <View style={styles.headerRight}>
          {/* Realtime sync status */}
          <SyncIndicator isSynced={isSynced} lastSyncedAt={lastSyncedAt} syncError={syncError} />
          {/* Currency toggle — subtle pill, long press opens full converter */}
          <CurrencyToggle
            subtle
            onLongPress={() => {
              Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Medium);
              router.push({ pathname: '/currency-converter', params: { destination: parsed.destination } });
            }}
          />
          {/* Edit mode toggle */}
          {viewMode === 'list' && (
            <Pressable
              onPress={() => {
                Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
                setEditMode((prev) => !prev);
              }}
              hitSlop={8}
              style={({ pressed }) => [
                styles.headerBtn,
                editMode && styles.editBtnActive,
                { opacity: pressed ? 0.6 : 1 },
              ]}
            >
              <Pencil size={20} color={COLORS.cream} strokeWidth={1.5} />
            </Pressable>
          )}

          {/* Calendar export */}
          <Pressable
            onPress={handleCalendarExport}
            hitSlop={8}
            style={({ pressed }) => [
              styles.headerBtn,
              { opacity: pressed ? 0.6 : 1 },
            ]}
          >
            <Calendar size={20} color={COLORS.cream} strokeWidth={1.5} />
          </Pressable>

          {/* Itinerary map toggle — numbered pins + route line, tap pin for activity card */}
          <Pressable
            onPress={() => {
              Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
              setViewMode('map');
              setSelectedPin(null);
            }}
            hitSlop={8}
            style={({ pressed }) => [
              styles.headerBtn,
              { opacity: pressed ? 0.6 : 1 },
            ]}
          >
            <LucideMap size={20} color={viewMode === 'map' ? COLORS.sage : COLORS.cream} strokeWidth={1.5} />
          </Pressable>

          {/* Explore Map — full interactive map screen */}
          <Pressable
            onPress={() => {
              Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
              router.push(`/explore-map?tripId=${trip?.id}` as never);
            }}
            hitSlop={8}
            style={({ pressed }) => [
              styles.mapExploreBtn,
              { opacity: pressed ? 0.7 : 1 },
            ]}
          >
            <MapPin size={14} color={COLORS.sage} strokeWidth={1.5} />
            <Text style={styles.mapExploreBtnText}>MAP</Text>
          </Pressable>

          {/* Here Now — quick access to I Am Here Now screen */}
          <Pressable
            onPress={() => {
              Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
              router.push('/i-am-here-now' as never);
            }}
            hitSlop={8}
            style={({ pressed }) => [
              styles.hereNowPill,
              { opacity: pressed ? 0.7 : 1 },
            ]}
          >
            <MapPin size={12} color={COLORS.bg} strokeWidth={1.5} />
            <Text style={styles.hereNowPillText}>HERE NOW</Text>
          </Pressable>

          {/* List / Map toggle */}
          <View style={styles.viewToggle}>
            <Pressable
              onPress={() => setViewMode('list')}
              style={[
                styles.viewToggleBtn,
                viewMode === 'list' && styles.viewToggleBtnActive,
              ]}
            >
              <Text
                style={[
                  styles.viewToggleText,
                  viewMode === 'list' && styles.viewToggleTextActive,
                ]}
              >
                List
              </Text>
            </Pressable>
            <Pressable
              onPress={() => {
                setViewMode('map');
                setSelectedPin(null);
              }}
              style={[
                styles.viewToggleBtn,
                viewMode === 'map' && styles.viewToggleBtnActive,
              ]}
            >
              <Text
                style={[
                  styles.viewToggleText,
                  viewMode === 'map' && styles.viewToggleTextActive,
                ]}
              >
                Map
              </Text>
            </Pressable>
          </View>

          {/* Invite friends / group trip */}
          <Pressable
            onPress={() => {
              Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
              setInviteSheetVisible(true);
            }}
            hitSlop={8}
            style={({ pressed }) => [
              styles.headerBtn,
              { opacity: pressed ? 0.6 : 1 },
            ]}
            accessibilityLabel="Invite friends"
            accessibilityRole="button"
          >
            <Users size={20} color={COLORS.cream} strokeWidth={1.5} />
          </Pressable>

          {/* Share deep link */}
          <Pressable
            onPress={handleShareLink}
            hitSlop={8}
            style={({ pressed }) => [
              styles.headerBtn,
              { opacity: pressed ? 0.6 : 1 },
            ]}
          >
            <Link2 size={20} color={COLORS.cream} strokeWidth={1.5} />
          </Pressable>

          {/* Share card */}
          <Pressable
            onPress={() => setShareVisible(true)}
            hitSlop={12}
            accessibilityLabel="Share trip poster"
            accessibilityHint="Opens a 9:16 card you can save or share to Stories"
            style={({ pressed }) => [
              styles.headerBtn,
              { opacity: pressed ? 0.6 : 1 },
            ]}
          >
            <Share2 size={20} color={COLORS.cream} strokeWidth={1.5} />
          </Pressable>

          {/* Viral cards */}
          <Pressable
            onPress={() => {
              Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
              router.push({ pathname: '/viral-cards', params: { tripId: trip?.id } });
            }}
            hitSlop={12}
            style={({ pressed }) => [
              styles.headerBtn,
              { opacity: pressed ? 0.6 : 1 },
            ]}
          >
            <Text style={styles.headerBtnText}>Viral</Text>
          </Pressable>

          {/* Print trip pack */}
          <Pressable
            onPress={() => {
              Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
              router.push({ pathname: '/print-trip', params: { tripId: trip?.id } });
            }}
            hitSlop={12}
            accessibilityLabel="Print trip pack"
            accessibilityHint="Opens a printable summary of your trip"
            style={({ pressed }) => [
              styles.headerBtn,
              { opacity: pressed ? 0.6 : 1 },
            ]}
          >
            <Printer size={20} color={COLORS.cream} strokeWidth={1.5} />
          </Pressable>
        </View>
      </View>

      {/* ── Collaborator avatars row ── */}
      {groupCollaborators.length > 0 && (
        <CollaboratorRow collaborators={groupCollaborators} />
      )}

      {/* ── Invite sheet ── */}
      <InviteSheet
        visible={inviteSheetVisible}
        onClose={() => setInviteSheetVisible(false)}
        inviteLink={groupInviteLink}
        destination={parsed.destination}
        onCreateInvite={createGroupInvite}
      />

      {/* ── Share nudge — shown for trips created in the last 5 minutes ── */}
      {!shareNudgeDismissed && trip && parsed && (Date.now() - new Date(trip.createdAt).getTime() < 5 * 60 * 1000) && (
        <Pressable
          onPress={() => {
            Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Medium);
            setShareNudgeDismissed(true);
            handleShareAsCard();
          }}
          style={({ pressed }) => [
            styles.shareNudge,
            { opacity: pressed ? 0.9 : 1 },
          ]}
        >
          <View style={styles.shareNudgeInner}>
            <Share2 size={18} color={COLORS.sage} strokeWidth={1.5} />
            <View style={{ flex: 1 }}>
              <Text style={styles.shareNudgeTitle}>{t('itinerary.shareTrip', { defaultValue: 'Share this trip' })}</Text>
              <Text style={styles.shareNudgeSub}>{t('itinerary.shareNudgeSub', { defaultValue: 'Tap to open share sheet' })}</Text>
            </View>
            <ChevronRight size={18} color={COLORS.sage} strokeWidth={1.5} />
          </View>
        </Pressable>
      )}

      {/* ── Day tabs — themes as large editorial headlines ───────────────── */}
      <ScrollView
        ref={dayPagerRef}
        horizontal
        pagingEnabled
        decelerationRate="fast"
        showsHorizontalScrollIndicator={false}
        contentContainerStyle={styles.dayTabsContainer}
        style={styles.dayTabsScroll}
        onMomentumScrollEnd={(e: NativeSyntheticEvent<NativeScrollEvent>) => {
          const offset = e.nativeEvent.contentOffset.x;
          const page = Math.round(offset / SCREEN_WIDTH);
          if (page >= 0 && page < parsed.days.length && page !== activeDay) {
            Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
            setActiveDay(page);
            setSelectedPin(null);
          }
        }}
        scrollEventThrottle={16}
      >
        {parsed.days.map((d, i) => {
          const isActive = i === activeDay;
          return (
            <Pressable
              key={d.day}
              onPress={() => {
                dayPagerRef.current?.scrollTo({
                  x: i * SCREEN_WIDTH,
                  animated: true,
                });
                Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
                setActiveDay(i);
                setSelectedPin(null);
              }}
              style={[styles.dayTab, isActive && [styles.dayTabActive, { backgroundColor: `${destTheme.primary}1A`, borderColor: destTheme.primary }]]}
            >
              <Text
                style={[
                  styles.dayTabTheme,
                  isActive && styles.dayTabThemeActive,
                ]}
                numberOfLines={2}
              >
                {d.theme}
              </Text>
              <Text
                style={[
                  styles.dayTabNumber,
                  isActive && [styles.dayTabNumberActive, { color: destTheme.primary }],
                ]}
              >
                Day {d.day}
              </Text>
            </Pressable>
          );
        })}
      </ScrollView>

      {/* ── Map view ───────────────────────────────────────────────────── */}
      {viewMode === 'map' ? (
        <View style={styles.mapContainer}>
          <MapView
            ref={mapRef}
            style={styles.mapView}
            provider={Platform.OS === 'android' ? PROVIDER_GOOGLE : undefined}
            customMapStyle={darkMapStyle}
            initialRegion={{
              latitude: mapPins[0]?.lat ?? 0,
              longitude: mapPins[0]?.lng ?? 0,
              latitudeDelta: 0.05,
              longitudeDelta: 0.05,
            }}
          >
            {/* Numbered pins */}
            {mapPins.map((pin) => (
              <Marker
                key={pin.key}
                coordinate={{
                  latitude: pin.lat,
                  longitude: pin.lng,
                }}
                onPress={() => setSelectedPin(pin.key)}
              >
                <View style={styles.pinContainer}>
                  <View style={styles.pinCircle}>
                    <Text style={styles.pinNumber}>{pin.index}</Text>
                  </View>
                  <View style={styles.pinTail} />
                </View>
              </Marker>
            ))}

            {/* Safety overlay — color-coded circles by time of day */}
            {!isWeb &&
              safetyZones.map((zone, i) => (
                <Circle
                  key={`safety-${i}`}
                  center={{ latitude: zone.lat, longitude: zone.lng }}
                  radius={zone.radiusMeters}
                  fillColor={SAFETY_COLORS[zone.level]}
                  strokeColor={SAFETY_COLORS[zone.level].replace('0.25', '0.6').replace('0.2', '0.5')}
                  strokeWidth={1}
                />
              ))}

            {/* Route polyline */}
            {mapPins.length >= 2 && (
              <Polyline
                coordinates={mapPins.map((p) => ({
                  latitude: p.lat,
                  longitude: p.lng,
                }))}
                strokeColor={destTheme.primary}
                strokeWidth={3}
                lineDashPattern={[6, 4]}
              />
            )}
          </MapView>

          {/* Safety overlay toggle */}
          {mapPins.length > 0 && !isWeb && (
            <Pressable
              style={[styles.safetyToggle, safetyOverlay && styles.safetyToggleActive]}
              onPress={() => {
                Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
                setSafetyOverlay((v) => !v);
              }}
            >
              <Text style={styles.safetyToggleText}>
                {safetyOverlay ? t('itinerary.safetyOn', { defaultValue: 'Safety on' }) : t('itinerary.safety', { defaultValue: 'Safety' })}
              </Text>
              {safetyOverlay && (
                <View style={styles.safetyLegend}>
                  <View style={[styles.safetyDot, { backgroundColor: SAFETY_COLORS.safe }]} />
                  <Text style={styles.safetyLegendText}>{t('itinerary.am', { defaultValue: 'AM' })}</Text>
                  <View style={[styles.safetyDot, { backgroundColor: SAFETY_COLORS.moderate }]} />
                  <Text style={styles.safetyLegendText}>{t('itinerary.pm', { defaultValue: 'PM' })}</Text>
                  <View style={[styles.safetyDot, { backgroundColor: SAFETY_COLORS.caution }]} />
                  <Text style={styles.safetyLegendText}>{t('itinerary.eve', { defaultValue: 'Eve' })}</Text>
                </View>
              )}
            </Pressable>
          )}

          {/* No pins fallback */}
          {mapPins.length === 0 && (
            <View style={styles.mapEmptyOverlay}>
              <Text style={styles.mapEmptyText}>
                No location data for this day yet
              </Text>
            </View>
          )}

          {/* Bottom sheet on pin tap */}
          {selectedPin && (() => {
            const pin = mapPins.find((p) => p.key === selectedPin);
            if (!pin) return null;
            return (
              <View style={[styles.mapSheet, { paddingBottom: insets.bottom + SPACING.md }]}>
                <View style={styles.mapSheetHandle} />
                <VenueCard
                  name={pin.venue.name}
                  photo_url={pin.venue.photo_url}
                  rating={pin.venue.rating}
                  reviews_count={pin.venue.user_ratings_total}
                  address={pin.venue.formatted_address}
                  open_now={pin.venue.opening_hours?.open_now ?? null}
                  hours_today={getTodayHours(pin.venue.opening_hours?.weekday_text)}
                  maps_url={pin.venue.maps_url}
                  tapTarget="activity"
                  poweredByGoogle={!!(pin.venue.photo_url || pin.venue.rating != null)}
                />
                <Pressable
                  onPress={() => handleGetDirections(pin.venue.place_id)}
                  style={({ pressed }) => [
                    styles.directionsBtn,
                    { opacity: pressed ? 0.85 : 1 },
                  ]}
                >
                  <View style={styles.directionsBtnInner}>
                    <MapPin size={16} color={COLORS.bg} strokeWidth={1.5} />
                    <Text style={styles.directionsBtnText}>{t('itinerary.getDirections', { defaultValue: 'Get Directions' })}</Text>
                  </View>
                </Pressable>
              </View>
            );
          })()}
        </View>
      ) : (
        /* ── List view ──────────────────────────────────────────────────── */
        <ScrollView
          style={styles.scrollView}
          contentContainerStyle={[
            styles.scrollContent,
            { paddingBottom: insets.bottom + SPACING.xxl },
          ]}
          showsVerticalScrollIndicator={false}
          scrollEventThrottle={16}
          removeClippedSubviews={!isWeb}
        >
          {/* Hero — cinematic destination photo with tagline */}
          <View style={styles.heroWrapper}>
            <ImageBackground
              source={{ uri: getHeroPhotoUrl(parsed.destination) }}
              style={styles.heroImage}
              resizeMode="cover"
            >
              <LinearGradient
                colors={['transparent', COLORS.bgDark1515, COLORS.bgDark1515Deep]}
                locations={[0.2, 0.6, 1]}
                style={styles.heroGradient}
              >
                <Text style={styles.heroDestination}>{parsed.destination}</Text>
                <Text style={styles.heroTagline}>{parsed.tagline}</Text>
                <View style={[styles.heroMeta, { gap: SPACING.sm }]}>
                  <SafetyScoreBadge destination={trip?.destination ?? parsed.destination} variant="pill" />
                  <Text style={styles.heroMetaText}>
                    {parsed.days.length} days · {currency !== 'USD' && rates ? formatLocalPrice(parsed.totalBudget, currency, rates) : parsed.totalBudget}
                  </Text>
                </View>
                {__DEV__ && trip?.isMockData && (
                  <View style={styles.mockBadgeWrap}>
                    <MockDataBadge label="Using sample data" />
                  </View>
                )}
              </LinearGradient>
            </ImageBackground>
          </View>

          {/* Steal this trip — when viewing a shared link */}
          {isSharedTrip && trip && (
            <View style={[styles.section, { marginTop: -SPACING.lg }]}>
              <Pressable
                onPress={() => {
                  Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Medium);
                  const stolen: Trip = {
                    id: `stolen-${Date.now()}`,
                    destination: trip.destination,
                    days: trip.days,
                    budget: trip.budget,
                    vibes: trip.vibes,
                    itinerary: trip.itinerary,
                    createdAt: new Date().toISOString(),
                  };
                  addTrip(stolen);
                  router.replace('/saved');
                }}
                style={({ pressed }) => [
                  styles.stealCtaCard,
                  { opacity: pressed ? 0.9 : 1 },
                ]}
              >
                <LinearGradient
                  colors={[COLORS.sage, COLORS.sageDark]}
                  start={{ x: 0, y: 0 }}
                  end={{ x: 1, y: 1 }}
                  style={styles.stealCtaGradient}
                >
                  <Text style={styles.stealCtaTitle}>{t('itinerary.stealTrip', { defaultValue: 'Steal this trip' })}</Text>
                  <Text style={styles.stealCtaSub}>{t('itinerary.stealTripSub', { defaultValue: 'Add to your trips and make it yours' })}</Text>
                </LinearGradient>
              </Pressable>
            </View>
          )}

          {/* Share this trip — native share sheet with destination + top 3 + roamapp.app */}
          <View style={styles.section}>
            <Pressable
              onPress={() => {
                Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
                handleShareAsCard();
              }}
              style={({ pressed }) => [
                styles.shareCtaCard,
                { opacity: pressed ? 0.9 : 1 },
              ]}
            >
              <LinearGradient
                colors={[`${destTheme.primary}26`, `${destTheme.primary}0D`]}
                start={{ x: 0, y: 0 }}
                end={{ x: 1, y: 1 }}
                style={styles.shareCtaGradient}
              >
                <View style={styles.shareCtaIconWrap}><Share2 size={28} color={COLORS.accentGold} strokeWidth={1.5} /></View>
                <View style={styles.shareCtaContent}>
                <Text style={styles.shareCtaTitle}>{t('itinerary.shareTrip', { defaultValue: 'Share this trip' })}</Text>
                <Text style={styles.shareCtaSub}>{t('itinerary.shareTripSub', { defaultValue: 'Create 9:16 poster for Stories' })}</Text>
                </View>
                <Text style={styles.shareCtaArrow}>{'\u2192'}</Text>
              </LinearGradient>
            </Pressable>
          </View>

          {/* Trip Story + Photo Album */}
          <View style={styles.itineraryExtrasRow}>
            <Pressable
              onPress={() => {
                Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Medium);
                router.push({ pathname: '/trip-story', params: { tripId: trip.id } } as never);
              }}
              style={({ pressed }) => [
                styles.itineraryExtraCard,
                { opacity: pressed ? 0.9 : 1, flex: 1 },
              ]}
            >
              <LinearGradient
                colors={[destTheme.gradient[0], destTheme.gradient[1], destTheme.gradient[2]]}
                start={{ x: 0, y: 0 }}
                end={{ x: 1, y: 1 }}
                style={styles.itineraryExtraGradient}
              >
                <View style={styles.itineraryExtraIconWrap}><Film size={24} color={COLORS.cream} strokeWidth={1.5} /></View>
                <Text style={styles.itineraryExtraTitle}>{t('itinerary.tripStory', { defaultValue: 'Trip Story' })}</Text>
                <Text style={styles.itineraryExtraSub}>{t('itinerary.cinematicPreview', { defaultValue: 'Cinematic preview' })}</Text>
              </LinearGradient>
            </Pressable>
            <Pressable
              onPress={() => {
                Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Medium);
                router.push({ pathname: '/trip-album', params: { tripId: trip.id } } as never);
              }}
              style={({ pressed }) => [
                styles.itineraryExtraCard,
                { opacity: pressed ? 0.9 : 1, flex: 1 },
              ]}
            >
              <LinearGradient
                colors={[`${destTheme.primary}26`, `${destTheme.primary}0D`]}
                start={{ x: 0, y: 0 }}
                end={{ x: 1, y: 1 }}
                style={styles.itineraryExtraGradient}
              >
                <View style={styles.itineraryExtraIconWrap}><Camera size={24} color={COLORS.accentGold} strokeWidth={1.5} /></View>
                <Text style={styles.itineraryExtraTitle}>{t('itinerary.photoAlbum', { defaultValue: 'Photo Album' })}</Text>
                <Text style={styles.itineraryExtraSub}>{t('itinerary.addTripMemories', { defaultValue: 'Add trip memories' })}</Text>
              </LinearGradient>
            </Pressable>
          </View>

          {/* Trip Countdown — standalone card */}
          <Pressable
            onPress={() => {
              Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Medium);
              router.push({ pathname: '/trip-countdown', params: { tripId: trip.id } } as never);
            }}
            style={({ pressed }) => [
              styles.countdownBanner,
              { opacity: pressed ? 0.9 : 1 },
            ]}
          >
            <LinearGradient
              colors={[destTheme.gradient[0], destTheme.gradient[1]]}
              start={{ x: 0, y: 0 }}
              end={{ x: 1, y: 0 }}
              style={styles.countdownBannerInner}
            >
              <Clock size={20} color={COLORS.cream} strokeWidth={1.5} />
              <View style={{ flex: 1 }}>
                <Text style={styles.countdownBannerTitle}>{t('itinerary.tripCountdown', { defaultValue: 'Trip Countdown' })}</Text>
                <Text style={styles.countdownBannerSub}>{t('itinerary.liveTimerTips', { defaultValue: 'Live timer + daily tips' })}</Text>
              </View>
              <Text style={styles.countdownBannerArrow}>{'\u2192'}</Text>
            </LinearGradient>
          </Pressable>

          {/* Expense Tracker banner */}
          <Pressable
            onPress={() => {
              Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Medium);
              router.push({ pathname: '/expense-tracker', params: { tripId: trip.id } } as never);
            }}
            style={({ pressed }) => [
              styles.countdownBanner,
              { opacity: pressed ? 0.9 : 1 },
            ]}
          >
            <View style={[styles.countdownBannerInner, { backgroundColor: COLORS.bgCard, borderWidth: 1, borderColor: COLORS.border, borderRadius: RADIUS.lg }]}>
              <Wallet size={20} color={COLORS.gold} strokeWidth={1.5} />
              <View style={{ flex: 1 }}>
                <Text style={styles.countdownBannerTitle}>{t('itinerary.expenseTracker', { defaultValue: 'Expense Tracker' })}</Text>
                <Text style={styles.countdownBannerSub}>{t('itinerary.trackSpending', { defaultValue: 'Track spending vs AI estimate' })}</Text>
              </View>
              <Text style={[styles.countdownBannerArrow, { color: COLORS.gold }]}>{'\u2192'}</Text>
            </View>
          </Pressable>

          {/* Trip Journal banner */}
          <Pressable
            onPress={() => {
              Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Medium);
              router.push({ pathname: '/trip-journal', params: { tripId: trip.id, destination: trip.destination } } as never);
            }}
            style={({ pressed }) => [
              styles.countdownBanner,
              { opacity: pressed ? 0.9 : 1 },
            ]}
          >
            <View style={[styles.countdownBannerInner, { backgroundColor: COLORS.bgCard, borderWidth: 1, borderColor: COLORS.border, borderRadius: RADIUS.lg }]}>
              <Receipt size={20} color={COLORS.cream} strokeWidth={1.5} />
              <View style={{ flex: 1 }}>
                <Text style={styles.countdownBannerTitle}>{t('itinerary.tripJournal', { defaultValue: 'Trip Journal' })}</Text>
                <Text style={styles.countdownBannerSub}>{t('itinerary.dailyDiary', { defaultValue: 'Daily diary with mood + highlights' })}</Text>
              </View>
              <Text style={styles.countdownBannerArrow}>{'\u2192'}</Text>
            </View>
          </Pressable>

          {/* The Receipt + Main Character + Budget Guardian — trip extras */}
          <View style={styles.itineraryExtrasRow}>
            <Pressable
              onPress={() => {
                Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
                router.push({ pathname: '/trip-receipt', params: { tripId: trip.id } });
              }}
              style={({ pressed }) => [
                styles.itineraryExtraCard,
                { opacity: pressed ? 0.9 : 1, flex: 1 },
              ]}
            >
              <LinearGradient
                colors={[`${destTheme.primary}26`, `${destTheme.primary}0D`]}
                start={{ x: 0, y: 0 }}
                end={{ x: 1, y: 1 }}
                style={styles.itineraryExtraGradient}
              >
                <View style={styles.itineraryExtraIconWrap}><Receipt size={24} color={COLORS.accentGold} strokeWidth={1.5} /></View>
                <Text style={styles.itineraryExtraTitle}>{t('itinerary.theReceipt', { defaultValue: 'The Receipt' })}</Text>
                <Text style={styles.itineraryExtraSub}>{t('itinerary.costBreakdown', { defaultValue: 'Cost breakdown' })}</Text>
              </LinearGradient>
            </Pressable>
            <Pressable
              onPress={() => {
                Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
                router.push({ pathname: '/main-character', params: { tripId: trip.id } });
              }}
              style={({ pressed }) => [
                styles.itineraryExtraCard,
                { opacity: pressed ? 0.9 : 1, flex: 1 },
              ]}
            >
              <LinearGradient
                colors={[`${destTheme.primary}26`, `${destTheme.primary}0D`]}
                start={{ x: 0, y: 0 }}
                end={{ x: 1, y: 1 }}
                style={styles.itineraryExtraGradient}
              >
                <View style={styles.itineraryExtraIconWrap}><Film size={24} color={COLORS.accentGold} strokeWidth={1.5} /></View>
                <Text style={styles.itineraryExtraTitle}>{t('itinerary.mainCharacter', { defaultValue: 'Main Character' })}</Text>
                <Text style={styles.itineraryExtraSub}>{t('itinerary.tripAsStory', { defaultValue: 'Your trip as a story' })}</Text>
              </LinearGradient>
            </Pressable>
            <Pressable
              onPress={() => {
                Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
                router.push({ pathname: '/budget-guardian', params: { tripId: trip.id } });
              }}
              style={({ pressed }) => [
                styles.itineraryExtraCard,
                { opacity: pressed ? 0.9 : 1, flex: 1 },
              ]}
            >
              <LinearGradient
                colors={[`${destTheme.primary}26`, `${destTheme.primary}0D`]}
                start={{ x: 0, y: 0 }}
                end={{ x: 1, y: 1 }}
                style={styles.itineraryExtraGradient}
              >
                <View style={styles.itineraryExtraIconWrap}><Wallet size={24} color={COLORS.accentGold} strokeWidth={1.5} /></View>
                <Text style={styles.itineraryExtraTitle}>{t('itinerary.budgetGuardian', { defaultValue: 'Budget Guardian' })}</Text>
                <Text style={styles.itineraryExtraSub}>{t('itinerary.trackSpendingShort', { defaultValue: 'Track spending' })}</Text>
              </LinearGradient>
            </Pressable>
          </View>

          {/* Weather card */}
          {weather && (
            <View style={styles.section}>
              <WeatherCard forecast={weather} />
            </View>
          )}

          {/* Flight search — Skyscanner affiliate */}
          <View style={styles.section}>
            <FlightPriceCard destination={trip.destination} placement="itinerary" />
          </View>

          {/* City safety score (US State Dept) */}
          <View style={styles.section}>
            <SafetyScoreCard destination={trip.destination} />
          </View>

          {/* Return Trip — what's new since last visit (only if prior trip to same dest) */}
          {trips.some((t) => t.id !== trip.id && t.destination.toLowerCase().includes(trip.destination.toLowerCase())) && (
            <View style={styles.section}>
              <ReturnTripSection
                destination={trip.destination}
                trips={trips}
                currentTripId={trip.id}
              />
            </View>
          )}

          {/* Visa & entry requirements (multi-passport) */}
          <View style={styles.section}>
            <VisaChecker destination={trip.destination} variant="full" />
          </View>

          {/* Trip Insurance — Safetywing + World Nomads */}
          <View style={styles.section}>
            <TripInsuranceCards destination={trip.destination} />
          </View>

          {/* Price Oracle — what your budget buys */}
          {totalBudgetNumeric && trip.days && (
            <View style={styles.section}>
              <PriceOracleCard
                destination={trip.destination}
                dailyBudget={Math.round(totalBudgetNumeric / trip.days)}
              />
            </View>
          )}

          {/* Local events during trip dates */}
          <View style={styles.section}>
            <TripEventsCard
              destination={trip.destination}
              startDate={new Date(trip.createdAt)}
              endDate={new Date(new Date(trip.createdAt).getTime() + trip.days * 24 * 60 * 60 * 1000)}
            />
          </View>

          {/* Budget chart — visual breakdown */}
          <View style={[styles.glassCard, styles.section]}>
            <View style={styles.sectionLabelRow}>
              <Text style={styles.sectionLabel}>BUDGET BREAKDOWN</Text>
            </View>
            <BudgetChart
              breakdown={parsed.budgetBreakdown}
              totalBudget={parsed.totalBudget}
              currency={currency}
              rates={rates}
            />
            <View style={styles.budgetDivider} />
            <BudgetRow
              label="Total"
              value={
                currency !== 'USD' && rates
                  ? formatDualPrice(parsed.totalBudget, currency, rates)
                  : parsed.totalBudget
              }
              bold
            />
          </View>

          {/* Local events during trip dates */}
          <LocalEventsSection
            city={trip.destination}
            startDate={localEventsDates.startDate}
            endDate={localEventsDates.endDate}
          />

          {/* Flight search — Skyscanner affiliate */}
          <View style={styles.section}>
            <FlightCard destination={trip.destination} tripDays={trip.days} />
          </View>

          {/* Flight deal hunter — watch prices, get 20% drop alerts */}
          <View style={styles.section}>
            <FlightDealCard destination={trip.destination} />
          </View>

          {/* Current day theme — editorial headline + weather badge */}
          {currentDay && (
            <View style={styles.dayThemeHero}>
              <View style={styles.dayThemeHeaderRow}>
                <Text style={styles.dayThemeNumber}>DAY {currentDay.day}</Text>
                {weather?.days[activeDay] && (
                  <View style={styles.dayWeatherBadge}>
                    <Text style={styles.dayWeatherBadgeText}>
                      {Math.round(weather.days[activeDay].tempMax)}° · {weather.days[activeDay].description}
                    </Text>
                  </View>
                )}
              </View>
              <Text style={styles.dayThemeTitle}>{currentDay.theme}</Text>
            </View>
          )}

          {/* Weather strip for this day */}
          {currentDay && weather?.days[activeDay] && (
            <View style={styles.section}>
              <WeatherDayStrip
                day={weather.days[activeDay]}
                label={t('itinerary.dayN', { n: currentDay.day })}
                accentColor={destTheme.primary}
              />
              <View style={{ marginTop: SPACING.sm }}>
                <RainAlternativesCard
                  day={weather.days[activeDay]}
                  itineraryDay={currentDay}
                  destination={trip.destination}
                  accentColor={destTheme.primary}
                />
              </View>
            </View>
          )}

          {/* Mapbox dark-styled route map for the day */}
          {currentDay && (
            <View style={styles.section}>
              <MapboxRouteMap
                day={currentDay}
                city={trip.destination}
              />
            </View>
          )}

          {/* Current day content */}
          {currentDay && (
            <>
              {/* Time blocks with venue cards — draggable in edit mode */}
              {editMode ? (
                <View style={styles.draggableWrapper}>
                  <DraggableFlatList
                    data={draggableActivities}
                    keyExtractor={(item: DraggableActivity) => item.key}
                    onDragEnd={handleReorder}
                    scrollEnabled={false}
                    renderItem={({
                      item,
                      drag,
                      isActive: isDragging,
                    }: RenderItemParams<DraggableActivity>) => (
                      <Pressable
                        onLongPress={drag}
                        disabled={isDragging}
                        style={[
                          styles.draggableItem,
                          isDragging && styles.draggableItemActive,
                        ]}
                      >
                        <View style={styles.dragHandle}>
                          <Text style={styles.dragHandleText}>{'\u2801\u2801\u2801'}</Text>
                        </View>
                        <View style={styles.draggableContent}>
                          <TimeBlock slot={item.slot} data={item.data} currency={currency} rates={rates} />
                          {renderVenueCard(item.data.activity, { location: item.data.location, address: item.data.address, name: item.data.location })}
                        </View>
                      </Pressable>
                    )}
                  />
                </View>
              ) : (
                <>
                  <Pressable onPress={() => { Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light); setEditingActivity({ slot: 'morning', data: currentDay.morning }); }}>
                    <TimeBlock slot="morning" data={currentDay.morning} currency={currency} rates={rates} />
                  </Pressable>
                  {isGroupTrip && (
                    <ActivityVoteButtons dayIndex={activeDay} slot="morning" summary={groupVotes[`${activeDay}-morning`]} onVote={castGroupVote} />
                  )}
                  {renderVenueCard(currentDay.morning.activity, { location: currentDay.morning.location, address: currentDay.morning.address, name: currentDay.morning.location })}
                  <Pressable onPress={() => { Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light); setEditingActivity({ slot: 'afternoon', data: currentDay.afternoon }); }}>
                    <TimeBlock slot="afternoon" data={currentDay.afternoon} currency={currency} rates={rates} />
                  </Pressable>
                  {isGroupTrip && (
                    <ActivityVoteButtons dayIndex={activeDay} slot="afternoon" summary={groupVotes[`${activeDay}-afternoon`]} onVote={castGroupVote} />
                  )}
                  {renderVenueCard(currentDay.afternoon.activity, { location: currentDay.afternoon.location, address: currentDay.afternoon.address, name: currentDay.afternoon.location })}
                  <Pressable onPress={() => { Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light); setEditingActivity({ slot: 'evening', data: currentDay.evening }); }}>
                    <TimeBlock slot="evening" data={currentDay.evening} currency={currency} rates={rates} />
                  </Pressable>
                  {isGroupTrip && (
                    <ActivityVoteButtons dayIndex={activeDay} slot="evening" summary={groupVotes[`${activeDay}-evening`]} onVote={castGroupVote} />
                  )}
                  {renderVenueCard(currentDay.evening.activity, { location: currentDay.evening.location, address: currentDay.evening.address, name: currentDay.evening.location })}
                </>
              )}

              {/* Accommodation card */}
              <View style={[styles.glassCard, styles.section]}>
                <Text style={styles.sectionLabel}>ACCOMMODATION</Text>
                <Text style={styles.accommodationName}>
                  {currentDay.accommodation.name}
                </Text>
                <View style={styles.accommodationMeta}>
                  <Text style={styles.accommodationType}>
                    {currentDay.accommodation.type}
                  </Text>
                  <Text style={styles.accommodationPrice}>
                    {currency !== 'USD' && rates ? formatLocalPrice(currentDay.accommodation.pricePerNight, currency, rates) : currentDay.accommodation.pricePerNight}/night
                  </Text>
                </View>
              </View>
              {renderVenueCard(`accom::${currentDay.accommodation.name}`, { isHotel: true, name: currentDay.accommodation.name })}

              {/* Daily total */}
              <View style={[styles.glassCard, styles.section]}>
                <View style={styles.dailyTotalRow}>
                  <Text style={styles.dailyTotalLabel}>
                    Day {currentDay.day} Total
                  </Text>
                  <Text style={styles.dailyTotalValue}>
                    {currency !== 'USD' && rates ? formatLocalPrice(currentDay.dailyCost, currency, rates) : currentDay.dailyCost}
                  </Text>
                </View>
              </View>

              {/* Bookable experiences (GYG) */}
              {gygActivities && gygActivities.length > 0 && activeDay === 0 && (
                <View style={styles.gygSection}>
                  <Text style={styles.gygLabel}>BOOKABLE EXPERIENCES</Text>
                  <ScrollView horizontal showsHorizontalScrollIndicator={false} style={styles.gygScroll}>
                    {gygActivities.map((act) => (
                      <Pressable key={act.id} style={styles.gygCard} onPress={() => act.bookingUrl && Linking.openURL(act.bookingUrl)}>
                        <Text style={styles.gygTitle} numberOfLines={2}>{act.name}</Text>
                        {act.price != null && <Text style={styles.gygPrice}>From {act.currency} {act.price}</Text>}
                        {act.rating != null && <Text style={styles.gygRating}>{act.rating.toFixed(1)} ({act.reviewCount})</Text>}
                      </Pressable>
                    ))}
                  </ScrollView>
                </View>
              )}

              {/* Voice guide */}
              {narrationText.length > 0 && (
                <View style={styles.section}>
                  <View style={{ flexDirection: 'row', gap: SPACING.sm, flexWrap: 'wrap' }}>
                    <VoiceGuide
                      text={narrationText}
                      label={`Listen to Day ${currentDay.day}`}
                    />
                    {parsed && parsed.days.length > 1 && (
                      <NarrationToggle
                        itinerary={parsed}
                        onControllerReady={(ctrl) => setNarrationController(ctrl)}
                      />
                    )}
                  </View>
                </View>
              )}
            </>
          )}

          {/* Pro Tip card */}
          {parsed.proTip ? (
            <View style={[styles.glassCard, styles.section]}>
              <Text style={styles.proTipLabel}>LOCAL PRO TIP</Text>
              <Text style={styles.proTipText}>{parsed.proTip}</Text>
            </View>
          ) : null}

          {/* Visa Info card */}
          {parsed.visaInfo ? (
            <View style={[styles.glassCard, styles.section]}>
              <Text style={styles.visaLabel}>VISA INFO</Text>
              <Text style={styles.visaText}>{parsed.visaInfo}</Text>
            </View>
          ) : null}

          {/* Destination Intel — timezone, AQI, sun, holidays, cost */}
          {(timezoneInfo || airQuality || sunTimes || tripHolidays.length > 0 || costOfLiving) && (
            <DestinationIntelSection
              timezone={timezoneInfo}
              airQuality={airQuality}
              sunTimes={sunTimes}
              holidays={tripHolidays}
              costOfLiving={costOfLiving}
            />
          )}

          {/* Medical & Safety Abroad */}
          {medicalGuide && (
            <MedicalAbroadSection guide={medicalGuide} />
          )}

          {/* Body Intel — full health intelligence */}
          <Pressable
            onPress={() => {
              Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Medium);
              router.push({ pathname: '/body-intel', params: { destination: trip.destination } } as never);
            }}
            style={({ pressed }) => [
              styles.countdownBanner,
              { opacity: pressed ? 0.9 : 1 },
            ]}
          >
            <View style={[styles.countdownBannerInner, { backgroundColor: COLORS.bgCard, borderWidth: 1, borderColor: COLORS.sage + '30', borderRadius: RADIUS.lg }]}>
              <ShieldCheck size={20} color={COLORS.sage} strokeWidth={1.5} />
              <View style={{ flex: 1 }}>
                <Text style={styles.countdownBannerTitle}>Body Intel</Text>
                <Text style={styles.countdownBannerSub}>Symptom checker + health brief for {trip.destination}</Text>
              </View>
              <Text style={[styles.countdownBannerArrow, { color: COLORS.sage }]}>{'\u2192'}</Text>
            </View>
          </Pressable>

          {/* Route Intelligence — flight info for this destination */}
          <View style={styles.section}>
            <RouteIntelCard destination={trip.destination} compact />
          </View>

          {/* Seasonal Intelligence — why now is the right time */}
          <View style={styles.section}>
            <SeasonalIntel destination={trip.destination} />
          </View>

          {/* Getting Around — Transit intelligence */}
          {transitGuide && (
            <TransitSection guide={transitGuide} />
          )}

          {/* Before You Land — pre-departure briefing */}
          <Pressable
            onPress={() => {
              Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Medium);
              router.push({ pathname: '/before-you-land', params: { destination: trip.destination } } as never);
            }}
            style={({ pressed }) => [
              styles.countdownBanner,
              { opacity: pressed ? 0.9 : 1 },
            ]}
          >
            <View style={[styles.countdownBannerInner, { backgroundColor: COLORS.bgCard, borderWidth: 1, borderColor: COLORS.gold + '30', borderRadius: RADIUS.lg }]}>
              <Plane size={20} color={COLORS.gold} strokeWidth={1.5} />
              <View style={{ flex: 1 }}>
                <Text style={styles.countdownBannerTitle}>Before You Land</Text>
                <Text style={styles.countdownBannerSub}>Everything you need to know before you arrive</Text>
              </View>
              <Text style={[styles.countdownBannerArrow, { color: COLORS.gold }]}>{'\u2192'}</Text>
            </View>
          </Pressable>

          {/* Emergency Medical Card — bilingual health card */}
          <Pressable
            onPress={() => {
              Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Medium);
              router.push({ pathname: '/emergency-card', params: { destination: trip.destination } } as never);
            }}
            style={({ pressed }) => [
              styles.countdownBanner,
              { opacity: pressed ? 0.9 : 1 },
            ]}
          >
            <View style={[styles.countdownBannerInner, { backgroundColor: COLORS.bgCard, borderWidth: 1, borderColor: COLORS.coral + '30', borderRadius: RADIUS.lg }]}>
              <Heart size={20} color={COLORS.coral} strokeWidth={1.5} />
              <View style={{ flex: 1 }}>
                <Text style={styles.countdownBannerTitle}>Emergency Medical Card</Text>
                <Text style={styles.countdownBannerSub}>Your health info in the local language</Text>
              </View>
              <Text style={[styles.countdownBannerArrow, { color: COLORS.coral }]}>{'\u2192'}</Text>
            </View>
          </Pressable>

          {/* Affiliate cards */}
          <View style={styles.section}>
            <AffiliateCard
              title="Book your stay"
              subtitle="Find the best hotels on Booking.com"
              gradientColors={[COLORS.flightBlueStart, COLORS.flightBlueEnd]}
              onPress={() => openAffiliate(AFFILIATES.booking)}
            />
          </View>

          <View style={styles.section}>
            <AffiliateCard
              title="Book activities"
              subtitle="Tours & experiences on GetYourGuide"
              gradientColors={[COLORS.flightRedStart, COLORS.flightRedEnd]}
              onPress={() => openAffiliate(AFFILIATES.getyourguide)}
            />
          </View>

          <View style={styles.section}>
            <AffiliateCard
              title="Find flights"
              subtitle="Compare cheap flights on Skyscanner"
              gradientColors={[COLORS.flightUnitedStart, COLORS.flightUnitedEnd]}
              onPress={() => openAffiliate(AFFILIATES.skyscanner)}
            />
          </View>

          {/* Trip Soundtrack — one tap to Spotify */}
          <View style={styles.section}>
            <TripSoundtrackCard destination={trip.destination} />
          </View>

          {/* Carbon footprint — flight emissions + offset */}
          <View style={styles.section}>
            <CarbonFootprintCard
              origin={homeAirport}
              destination={trip.destination}
              roundTrip
            />
          </View>

          {/* Language Survival — 50 essential phrases, tap for TTS */}
          <View style={styles.section}>
            <LanguageSurvivalSection destination={trip.destination} />
            <RoamersNearSection destination={trip.destination} />
          </View>

          {/* Packing list — AI-personalized from weather + activities + trip length */}
          <View style={styles.section}>
            <PackingList
              essentials={parsed.packingEssentials}
              destination={trip.destination}
              weatherHint={weather?.packingHint}
              packingResult={packingResult ?? undefined}
              tripId={trip.id}
              skipList={packingResult?.skipList}
            />
          </View>

          {/* Affiliate booking cards */}
          <View style={styles.section}>
            <BookingCards
              destination={trip.destination}
              countryCode={trip.destination}
              days={trip.days}
              budget={trip.budget}
              tripId={trip.id}
            />
          </View>

          {/* Pro upgrade nudge for free users */}
          <PostTripUpgradeNudge destination={trip.destination} />

          {/* Love this trip? Save it — one tap to Trips */}
          <View style={styles.section}>
            <Pressable
              onPress={() => {
                Haptics.notificationAsync(Haptics.NotificationFeedbackType.Success);
                router.replace('/saved');
              }}
              style={({ pressed }) => [
                styles.saveTripCard,
                { opacity: pressed ? 0.9 : 1 },
              ]}
            >
              <LinearGradient
                colors={[`${destTheme.primary}33`, `${destTheme.primary}14`]}
                start={{ x: 0, y: 0 }}
                end={{ x: 1, y: 1 }}
                style={styles.saveTripGradient}
              >
                <View style={styles.saveTripContent}>
                  <Text style={styles.saveTripTitle}>Love this trip? Save it</Text>
                  <Text style={styles.saveTripSub}>One tap — saved to My Trips</Text>
                </View>
                <Text style={styles.saveTripCta}>View Trips</Text>
              </LinearGradient>
            </Pressable>
          </View>
        </ScrollView>
      )}

      {/* ── Emergency SOS ─────────────────────────────────────────────── */}
      <EmergencySOS />

      {/* ── Pocket Concierge — floating AI helper ──────────────── */}
      <PocketConcierge />

      {/* ── Audio Guide floating bar ──────────────────────────────── */}
      <AudioGuideBar
        controller={narrationController}
        destination={trip?.destination ?? ''}
        totalDays={parsed?.days.length ?? 0}
        onClose={() => {
          narrationController?.stop();
          setNarrationController(null);
        }}
      />

      {/* ── Share modal ────────────────────────────────────────────────── */}
      <Modal
        visible={shareVisible}
        transparent
        animationType="fade"
        onRequestClose={() => setShareVisible(false)}
      >
        <View style={styles.modalOverlay}>
          <View style={styles.modalContent}>
            <ShareCard
              trip={trip}
              totalBudget={totalBudgetNumeric}
              dailyBudget={
                totalBudgetNumeric && trip.days
                  ? Math.round(totalBudgetNumeric / trip.days)
                  : undefined
              }
              tagline={parsed.tagline}
              dayThemes={parsed.days.map((d) => d.theme)}
              onDismiss={() => setShareVisible(false)}
            />
          </View>
        </View>
      </Modal>

      {/* ── Activity Edit Modal ──────────────────────────────────────── */}
      {editingActivity && currentDay && (
        <ActivityEditModal
          visible={!!editingActivity}
          activity={editingActivity.data}
          slot={editingActivity.slot}
          dayNumber={currentDay.day}
          destination={trip.destination}
          onSave={handleActivitySave}
          onClose={() => setEditingActivity(null)}
        />
      )}
    </View>
  );
}

// =============================================================================
// Sub-components
// =============================================================================

// ── Activity card (venue, neighborhood, cost, tip) ──────────────────────────
const SLOT_DEFAULT_TIMES: Record<string, string> = {
  morning: '9:00 AM',
  afternoon: '2:00 PM',
  evening: '6:00 PM',
};

const TimeBlock = React.memo(function TimeBlock({
  slot,
  data,
  currency,
  rates,
}: {
  slot: 'morning' | 'afternoon' | 'evening';
  data: TimeSlotActivity;
  currency?: string;
  rates?: ExchangeRates | null;
}) {
  const timeDisplay = data.time ?? SLOT_DEFAULT_TIMES[slot];
  const costDisplay = currency && currency !== 'USD' && rates
    ? formatLocalPrice(data.cost, currency, rates)
    : data.cost;

  return (
    <View style={[styles.glassCard, styles.section]}>
      <Text style={styles.timeSlotLabel}>
        {timeDisplay}
      </Text>

      <Text style={styles.activityTitle}>{data.activity}</Text>

      <View style={styles.activityMeta}>
        <View style={styles.neighborhoodRow}>
          <Text style={styles.neighborhoodLabel}>Neighborhood</Text>
          <Text style={styles.neighborhoodValue}>{data.location}</Text>
        </View>
        <View style={styles.costBadge}>
          <Text style={styles.costText}>{costDisplay}</Text>
        </View>
      </View>

      {data.tip ? (
        <View style={styles.tipCard}>
          <Text style={styles.tipLabel}>Local tip</Text>
          <Text style={styles.tipText}>{data.tip}</Text>
        </View>
      ) : null}

      {data.transitToNext ? (
        <View style={styles.transitConnector}>
          <Train size={14} color={COLORS.sage} strokeWidth={1.5} />
          <Text style={styles.transitText}>{data.transitToNext}</Text>
        </View>
      ) : null}
    </View>
  );
});

// ── Budget row ──────────────────────────────────────────────────────────────
function BudgetRow({
  label,
  value,
  bold,
}: {
  label: string;
  value: string;
  bold?: boolean;
}) {
  return (
    <View style={styles.budgetRow}>
      <Text
        style={[
          styles.budgetRowLabel,
          bold && styles.budgetRowBold,
        ]}
      >
        {label}
      </Text>
      <Text
        style={[
          styles.budgetRowValue,
          bold && styles.budgetRowBold,
        ]}
      >
        {value}
      </Text>
    </View>
  );
}

// ── Affiliate card ──────────────────────────────────────────────────────────
function AffiliateCard({
  title,
  subtitle,
  gradientColors,
  onPress,
}: {
  title: string;
  subtitle: string;
  gradientColors: [string, string];
  onPress: () => void;
}) {
  return (
    <Pressable
      onPress={onPress}
      style={({ pressed }) => ({
        opacity: pressed ? 0.85 : 1,
        transform: [{ scale: pressed ? 0.98 : 1 }],
      })}
    >
      <LinearGradient
        colors={gradientColors}
        start={{ x: 0, y: 0 }}
        end={{ x: 1, y: 0 }}
        style={styles.affiliateGradient}
      >
        <View style={styles.affiliateContent}>
          <Text style={styles.affiliateTitle}>{title}</Text>
          <Text style={styles.affiliateSubtitle}>{subtitle}</Text>
        </View>
        <Text style={styles.affiliateArrow}>→</Text>
      </LinearGradient>
    </Pressable>
  );
}

// ── Transit Section — "Getting Around" guide ────────────────────────────────
// =============================================================================
// Destination Intel Section
// =============================================================================
interface DestinationIntelProps {
  timezone: TimezoneInfo | null;
  airQuality: AirQuality | null;
  sunTimes: SunTimes | null;
  holidays: PublicHoliday[];
  costOfLiving: CostOfLiving | null;
}

const DestinationIntelSection = React.memo(function DestinationIntelSection({
  timezone,
  airQuality,
  sunTimes,
  holidays,
  costOfLiving,
}: DestinationIntelProps) {
  const [expanded, setExpanded] = useState(false);

  return (
    <View style={[styles.glassCard, styles.section]}>
      <Pressable
        onPress={() => {
          Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
          setExpanded((prev) => !prev);
        }}
        style={styles.transitSectionHeader}
      >
        <View style={styles.transitSectionTitleRow}>
          <Globe size={18} color={COLORS.sage} strokeWidth={1.5} />
          <Text style={styles.sectionLabel}>DESTINATION INTEL</Text>
        </View>
        <Text style={styles.transitExpandArrow}>{expanded ? '▲' : '▼'}</Text>
      </Pressable>

      {/* Always-visible summary row */}
      <View style={styles.intelSummaryRow}>
        {timezone && (
          <View style={styles.intelChip}>
            <Text style={styles.intelChipLabel}>{timezone.abbreviation}</Text>
            <Text style={styles.intelChipValue}>{getTimeDifference(timezone.utcOffset)}</Text>
          </View>
        )}
        {airQuality && (
          <View style={styles.intelChip}>
            <Wind size={12} color={airQuality.color} strokeWidth={1.5} />
            <Text style={[styles.intelChipLabel, { color: airQuality.color }]}>AQI {airQuality.aqi}</Text>
          </View>
        )}
        {sunTimes && (
          <View style={styles.intelChip}>
            <Sun size={12} color={COLORS.gold} strokeWidth={1.5} />
            <Text style={styles.intelChipValue}>{sunTimes.dayLength}</Text>
          </View>
        )}
      </View>

      {expanded && (
        <View style={styles.transitExpanded}>
          {/* Timezone detail */}
          {timezone && (
            <View style={styles.transitBlock}>
              <Text style={styles.transitBlockTitle}>LOCAL TIME</Text>
              <Text style={styles.transitLateNight}>
                {timezone.currentTime} ({timezone.timezone})
              </Text>
              <Text style={styles.intelDetail}>
                {getTimeDifference(timezone.utcOffset)} · {timezone.isDst ? 'Daylight saving active' : 'Standard time'}
              </Text>
            </View>
          )}

          {/* Air quality */}
          {airQuality && (
            <View style={styles.transitBlock}>
              <View style={styles.transitBlockTitleRow}>
                <Wind size={14} color={airQuality.color} strokeWidth={1.5} />
                <Text style={styles.transitBlockTitle}>AIR QUALITY</Text>
              </View>
              <View style={[styles.intelAqiBadge, { borderColor: airQuality.color }]}>
                <Text style={[styles.intelAqiText, { color: airQuality.color }]}>
                  {airQuality.label.toUpperCase()} — AQI {airQuality.aqi}
                </Text>
              </View>
              <Text style={styles.transitLateNight}>{airQuality.advice}</Text>
            </View>
          )}

          {/* Sun times */}
          {sunTimes && (
            <View style={styles.transitBlock}>
              <View style={styles.transitBlockTitleRow}>
                <Sun size={14} color={COLORS.gold} strokeWidth={1.5} />
                <Text style={styles.transitBlockTitle}>DAYLIGHT</Text>
              </View>
              <View style={styles.intelSunRow}>
                <View style={styles.intelSunItem}>
                  <Text style={styles.intelSunLabel}>Sunrise</Text>
                  <Text style={styles.intelSunTime}>{sunTimes.sunrise}</Text>
                </View>
                <View style={styles.intelSunItem}>
                  <Text style={styles.intelSunLabel}>Sunset</Text>
                  <Text style={styles.intelSunTime}>{sunTimes.sunset}</Text>
                </View>
                <View style={styles.intelSunItem}>
                  <Text style={styles.intelSunLabel}>Golden Hour</Text>
                  <Text style={styles.intelSunTime}>{sunTimes.goldenHour}</Text>
                </View>
              </View>
              <Text style={styles.intelDetail}>{sunTimes.dayLength} of daylight</Text>
            </View>
          )}

          {/* Public holidays */}
          {holidays.length > 0 && (
            <View style={styles.transitBlock}>
              <View style={styles.transitBlockTitleRow}>
                <PartyPopper size={14} color={COLORS.coral} strokeWidth={1.5} />
                <Text style={styles.transitBlockTitle}>HOLIDAYS DURING YOUR TRIP</Text>
              </View>
              {holidays.map((h) => (
                <View key={h.date} style={styles.transitPaymentCard}>
                  <Text style={styles.transitPaymentMethod}>{h.name}</Text>
                  <Text style={styles.transitPaymentHow}>{h.localName} · {h.date}</Text>
                </View>
              ))}
              <Text style={styles.intelDetail}>
                Some attractions may be closed or extra crowded
              </Text>
            </View>
          )}

          {/* Cost of living */}
          {costOfLiving && (
            <View style={styles.transitBlock}>
              <View style={styles.transitBlockTitleRow}>
                <Wallet size={14} color={COLORS.gold} strokeWidth={1.5} />
                <Text style={styles.transitBlockTitle}>DAILY COSTS ({costOfLiving.currencySymbol})</Text>
              </View>
              <View style={styles.intelCostGrid}>
                <View style={styles.intelCostCol}>
                  <Text style={styles.intelCostTier}>BUDGET</Text>
                  <Text style={styles.intelCostTotal}>{costOfLiving.budget.dailyTotal}</Text>
                  <Text style={styles.intelDetail}>Meals: {costOfLiving.budget.meal}</Text>
                </View>
                <View style={styles.intelCostCol}>
                  <Text style={styles.intelCostTier}>COMFORT</Text>
                  <Text style={styles.intelCostTotal}>{costOfLiving.comfort.dailyTotal}</Text>
                  <Text style={styles.intelDetail}>Meals: {costOfLiving.comfort.meal}</Text>
                </View>
                <View style={styles.intelCostCol}>
                  <Text style={styles.intelCostTier}>LUXURY</Text>
                  <Text style={styles.intelCostTotal}>{costOfLiving.luxury.dailyTotal}</Text>
                  <Text style={styles.intelDetail}>Meals: {costOfLiving.luxury.meal}</Text>
                </View>
              </View>
              <Text style={styles.intelDetail}>{costOfLiving.tipping}</Text>
            </View>
          )}
        </View>
      )}
    </View>
  );
});

// =============================================================================
// Medical & Safety Abroad Section
// =============================================================================
const MedicalAbroadSection = React.memo(function MedicalAbroadSection({ guide }: { guide: MedicalGuide }) {
  const [expanded, setExpanded] = useState(false);

  const priorityColor = guide.insurancePriority === 'critical' ? COLORS.coral
    : guide.insurancePriority === 'recommended' ? COLORS.gold
    : COLORS.sage;

  return (
    <View style={[styles.glassCard, styles.section]}>
      <Pressable
        onPress={() => {
          Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
          setExpanded((prev) => !prev);
        }}
        style={styles.transitSectionHeader}
      >
        <View style={styles.transitSectionTitleRow}>
          <Heart size={18} color={COLORS.coral} strokeWidth={1.5} />
          <Text style={styles.sectionLabel}>HEALTH & SAFETY</Text>
        </View>
        <Text style={styles.transitExpandArrow}>{expanded ? '▲' : '▼'}</Text>
      </Pressable>

      {/* Always-visible emergency numbers */}
      <View style={styles.medicalEmergencyRow}>
        <View style={styles.medicalNumberCard}>
          <Text style={styles.medicalNumberLabel}>EMERGENCY</Text>
          <Text style={styles.medicalNumber}>{guide.emergencyNumber}</Text>
        </View>
        <View style={styles.medicalNumberCard}>
          <Text style={styles.medicalNumberLabel}>AMBULANCE</Text>
          <Text style={styles.medicalNumber}>{guide.ambulanceNumber}</Text>
        </View>
        <View style={styles.medicalNumberCard}>
          <Text style={styles.medicalNumberLabel}>POLICE</Text>
          <Text style={styles.medicalNumber}>{guide.policeNumber}</Text>
        </View>
      </View>

      {expanded && (
        <View style={styles.transitExpanded}>
          {/* English at ER */}
          <View style={styles.transitBlock}>
            <Text style={styles.transitBlockTitle}>ENGLISH AT HOSPITALS</Text>
            <Text style={styles.transitLateNight}>
              {guide.englishEmergency ? '✓ ' : '✕ '}{guide.englishNote}
            </Text>
          </View>

          {/* Hospital quality */}
          <View style={styles.transitBlock}>
            <View style={styles.transitBlockTitleRow}>
              <ShieldCheck size={14} color={COLORS.sage} strokeWidth={1.5} />
              <Text style={styles.transitBlockTitle}>HOSPITAL QUALITY</Text>
            </View>
            <Text style={styles.medicalQualityBadge}>
              {guide.hospitalQuality.toUpperCase()}
            </Text>
            <Text style={styles.transitLateNight}>{guide.hospitalNote}</Text>
            <Text style={styles.medicalCost}>ER visit: {guide.erCostRange}</Text>
          </View>

          {/* Pharmacy */}
          <View style={styles.transitBlock}>
            <Text style={styles.transitBlockTitle}>PHARMACY</Text>
            <Text style={styles.transitLateNight}>
              {guide.pharmacyOTC ? 'Many meds OTC · ' : 'Prescription required · '}{guide.pharmacyNote}
            </Text>
          </View>

          {/* Water */}
          <View style={styles.transitBlock}>
            <View style={styles.transitBlockTitleRow}>
              <Droplets size={14} color={guide.tapWaterSafe ? COLORS.sage : COLORS.coral} strokeWidth={1.5} />
              <Text style={styles.transitBlockTitle}>TAP WATER</Text>
            </View>
            <Text style={styles.transitLateNight}>
              {guide.tapWaterSafe ? '✓ Safe to drink' : '✕ Not safe — use bottled'} · {guide.waterNote}
            </Text>
          </View>

          {/* Insurance priority */}
          <View style={styles.transitBlock}>
            <Text style={styles.transitBlockTitle}>TRAVEL INSURANCE</Text>
            <View style={[styles.medicalPriorityBadge, { borderColor: priorityColor }]}>
              <Text style={[styles.medicalPriorityText, { color: priorityColor }]}>
                {guide.insurancePriority.toUpperCase()}
              </Text>
            </View>
            <Text style={styles.transitLateNight}>{guide.insuranceNote}</Text>
          </View>

          {/* Health risks */}
          {guide.healthRisks.length > 0 && (
            <View style={styles.transitBlock}>
              <Text style={styles.transitBlockTitle}>HEALTH RISKS</Text>
              {guide.healthRisks.map((risk, i) => (
                <View key={i} style={styles.transitMistakeRow}>
                  <Text style={styles.transitMistakeDot}>⚠</Text>
                  <Text style={styles.transitMistakeText}>{risk}</Text>
                </View>
              ))}
            </View>
          )}

          {/* Where to go */}
          <View style={styles.transitBlock}>
            <Text style={styles.transitBlockTitle}>WHERE TO GO</Text>
            {guide.whereToGo.map((w, i) => (
              <View key={i} style={styles.transitPaymentCard}>
                <Text style={styles.transitPaymentMethod}>{w.condition}</Text>
                <Text style={styles.transitPaymentHow}>{w.go}</Text>
              </View>
            ))}
          </View>
        </View>
      )}
    </View>
  );
});

const TransitSection = React.memo(function TransitSection({ guide }: { guide: TransitGuide }) {
  const [expanded, setExpanded] = useState(false);

  return (
    <View style={[styles.glassCard, styles.section]}>
      <Pressable
        onPress={() => {
          Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
          setExpanded((prev) => !prev);
        }}
        style={styles.transitSectionHeader}
      >
        <View style={styles.transitSectionTitleRow}>
          <Train size={18} color={COLORS.sage} strokeWidth={1.5} />
          <Text style={styles.sectionLabel}>GETTING AROUND</Text>
        </View>
        <Text style={styles.transitExpandArrow}>{expanded ? '▲' : '▼'}</Text>
      </Pressable>

      <Text style={styles.transitHeadline}>{guide.headline}</Text>

      {expanded && (
        <View style={styles.transitExpanded}>
          {/* Transit lines */}
          {guide.lines.length > 0 && (
            <View style={styles.transitBlock}>
              <Text style={styles.transitBlockTitle}>KEY LINES</Text>
              {guide.lines.map((line) => (
                <View key={line.name} style={styles.transitLineRow}>
                  <View style={[styles.transitLineDot, { backgroundColor: line.color }]} />
                  <View style={styles.transitLineInfo}>
                    <Text style={styles.transitLineName}>{line.name}</Text>
                    <Text style={styles.transitLineNote}>{line.usefulFor}</Text>
                  </View>
                </View>
              ))}
            </View>
          )}

          {/* Payment methods */}
          <View style={styles.transitBlock}>
            <View style={styles.transitBlockTitleRow}>
              <CreditCard size={14} color={COLORS.sage} strokeWidth={1.5} />
              <Text style={styles.transitBlockTitle}>HOW TO PAY</Text>
            </View>
            {guide.payment.map((p) => (
              <View key={p.method} style={styles.transitPaymentCard}>
                <Text style={styles.transitPaymentMethod}>{p.method}</Text>
                <Text style={styles.transitPaymentHow}>{p.howToGet}</Text>
                <Text style={styles.transitPaymentCost}>{p.cost}</Text>
                <Text style={styles.transitPaymentTip}>{p.tip}</Text>
              </View>
            ))}
          </View>

          {/* Airport transfers */}
          <View style={styles.transitBlock}>
            <View style={styles.transitBlockTitleRow}>
              <Plane size={14} color={COLORS.sage} strokeWidth={1.5} />
              <Text style={styles.transitBlockTitle}>FROM THE AIRPORT</Text>
            </View>
            {guide.airportTransfers.map((t) => (
              <View key={t.name} style={styles.transitTransferCard}>
                <View style={styles.transitTransferHeader}>
                  <Text style={styles.transitTransferName}>{t.name}</Text>
                  <Text style={styles.transitTransferCost}>{t.cost}</Text>
                </View>
                <Text style={styles.transitTransferDuration}>{t.duration} · {t.schedule}</Text>
                <Text style={styles.transitPaymentTip}>{t.tip}</Text>
              </View>
            ))}
          </View>

          {/* Late night */}
          <View style={styles.transitBlock}>
            <Text style={styles.transitBlockTitle}>AFTER MIDNIGHT</Text>
            <Text style={styles.transitLateNight}>{guide.lateNight}</Text>
          </View>

          {/* Common mistakes */}
          <View style={styles.transitBlock}>
            <Text style={styles.transitBlockTitle}>DON'T DO THIS</Text>
            {guide.mistakes.map((m, i) => (
              <View key={i} style={styles.transitMistakeRow}>
                <Text style={styles.transitMistakeDot}>✕</Text>
                <Text style={styles.transitMistakeText}>{m}</Text>
              </View>
            ))}
          </View>

          {/* Google Maps note */}
          <View style={styles.transitMapsNote}>
            <MapPin size={14} color={guide.googleMapsWorks ? COLORS.sage : COLORS.coral} strokeWidth={1.5} />
            <Text style={styles.transitMapsText}>
              Google Maps: {guide.googleMapsNote}
            </Text>
          </View>
        </View>
      )}
    </View>
  );
});

// =============================================================================
// Dark map style (matches ROAM dark UI)
// =============================================================================
const darkMapStyle = [
  { elementType: 'geometry', stylers: [{ color: COLORS.mapGeometry }] },
  { elementType: 'labels.text.fill', stylers: [{ color: COLORS.mapLabelFill }] },
  { elementType: 'labels.text.stroke', stylers: [{ color: COLORS.mapLabelStroke }] },
  {
    featureType: 'road',
    elementType: 'geometry',
    stylers: [{ color: COLORS.mapWater }],
  },
  {
    featureType: 'road',
    elementType: 'labels.text.fill',
    stylers: [{ color: COLORS.mapRoad }],
  },
  {
    featureType: 'water',
    elementType: 'geometry',
    stylers: [{ color: COLORS.mapLandscape }],
  },
  {
    featureType: 'poi',
    elementType: 'geometry',
    stylers: [{ color: COLORS.mapNatural }],
  },
  {
    featureType: 'poi',
    elementType: 'labels.text.fill',
    stylers: [{ color: COLORS.mapRoad }],
  },
  {
    featureType: 'transit',
    elementType: 'geometry',
    stylers: [{ color: COLORS.mapNatural }],
  },
];

// =============================================================================
// Styles

