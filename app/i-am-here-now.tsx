// =============================================================================
// ROAM — I Am Here Now
// The screen you open at 2AM in a foreign city when you need help.
// =============================================================================
import React, { useCallback, useEffect, useMemo, useRef, useState } from 'react';
import {
  Alert,
  Animated,
  Image,
  Linking,
  Modal,
  Pressable,
  ScrollView,
  StyleSheet,
  Text,
  TextInput,
  View,
  type ImageStyle,
  type TextStyle,
  type ViewStyle,
} from 'react-native';
import * as ImagePicker from 'expo-image-picker';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { useRouter } from 'expo-router';
import { useTranslation } from 'react-i18next';
import { Camera, ChevronLeft, Image as ImageIcon, Phone, X } from 'lucide-react-native';
import { COLORS, FONTS, RADIUS, SPACING } from '../lib/constants';
import { useAppStore, type Trip } from '../lib/store';
import * as Haptics from '../lib/haptics';
import { getCurrentWeather, type CurrentWeather } from '../lib/apis/openweather';
import { getEmergencyNumbers, type EmergencyNumbers } from '../lib/emergency-numbers';
import { getContextualMessage, getTimeOfDay, type HereNowContext } from '../lib/here-now-context';
import { getHotelForDriver } from '../lib/local-script';
import { useSonarQuery } from '../lib/sonar';
import { parseItinerary } from '../lib/types/itinerary';
import LiveBadge from '../components/ui/LiveBadge';
import SourceCitation from '../components/ui/SourceCitation';
import { supabase } from '../lib/supabase';

// ---------------------------------------------------------------------------
// Fallback emergency numbers when API unavailable
// ---------------------------------------------------------------------------
const FALLBACK_EMERGENCY = {
  police: ['112', '911'],
  fire: ['112'],
  ambulance: ['112'],
};

// ---------------------------------------------------------------------------
// Main Component
// ---------------------------------------------------------------------------
export default function IAmHereNow(): React.JSX.Element {
  const { t } = useTranslation();
  const insets = useSafeAreaInsets();
  const router = useRouter();
  const { session, trips, activeTripId } = useAppStore();

  const activeTrip: Trip | null = useMemo(
    () => trips.find((tr) => tr.id === activeTripId) ?? trips[0] ?? null,
    [trips, activeTripId],
  );
  const destination = activeTrip?.destination ?? '';

  const itinerary = useMemo(() => {
    if (!activeTrip?.itinerary) return null;
    try {
      return parseItinerary(activeTrip.itinerary);
    } catch {
      return null;
    }
  }, [activeTrip?.itinerary]);

  const currentDay = useMemo(() => {
    if (!activeTrip?.createdAt || !activeTrip?.days) return 0;
    const start = new Date(activeTrip.createdAt).setHours(0, 0, 0, 0);
    const today = new Date().setHours(0, 0, 0, 0);
    const elapsed = Math.floor((today - start) / 86400000);
    return Math.max(0, Math.min(elapsed, activeTrip.days - 1));
  }, [activeTrip?.createdAt, activeTrip?.days]);

  // Context state
  const [now] = useState(() => new Date());
  const [context, setContext] = useState<HereNowContext | null>(null);
  const [weather, setWeather] = useState<CurrentWeather | null>(null);
  const [emergencyNumbers, setEmergencyNumbers] = useState<EmergencyNumbers | null>(null);

  // Modal state
  const [hotelModalVisible, setHotelModalVisible] = useState(false);
  const [emergencyModalVisible, setEmergencyModalVisible] = useState(false);
  const [momentSheetVisible, setMomentSheetVisible] = useState(false);
  const [momentNote, setMomentNote] = useState('');
  const [selectedImageUri, setSelectedImageUri] = useState<string | null>(null);
  const [isSavingMoment, setIsSavingMoment] = useState(false);

  // Sonar "right now" pulse
  const { data: sonarData, isLoading: sonarLoading, error: sonarError } = useSonarQuery(destination, 'pulse');

  // ---------------------------------------------------------------------------
  // Load weather + emergency data
  // ---------------------------------------------------------------------------
  useEffect(() => {
    if (!destination) return;
    getCurrentWeather(destination)
      .then((w) => {
        setWeather(w);
        const ctx = getContextualMessage({
          destination,
          weather: w,
          hour: now.getHours(),
          itinerary,
          currentDay,
        });
        setContext(ctx);
      })
      .catch(() => {
        const ctx = getContextualMessage({
          destination,
          weather: null,
          hour: now.getHours(),
          itinerary,
          currentDay,
        });
        setContext(ctx);
      });
  }, [destination, now, itinerary, currentDay]);

  useEffect(() => {
    if (!destination) return;
    // Derive country code from destination for emergency numbers
    // Use a simple mapping; falls back to null → shows fallback numbers
    const countryGuess = guessCountryCode(destination);
    if (!countryGuess) return;
    getEmergencyNumbers(countryGuess)
      .then((nums) => setEmergencyNumbers(nums))
      .catch(() => {});
  }, [destination]);

  // Build context once even if weather is null (no destination case)
  useEffect(() => {
    if (destination) return; // handled above
    const ctx = getContextualMessage({
      destination: 'your location',
      weather: null,
      hour: now.getHours(),
      itinerary: null,
      currentDay: 0,
    });
    setContext(ctx);
  }, [destination, now]);

  // ---------------------------------------------------------------------------
  // Handlers
  // ---------------------------------------------------------------------------
  const handleBack = useCallback(() => {
    Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light).catch(() => {});
    router.back();
  }, [router]);

  const handleShowHotel = useCallback(() => {
    Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Medium).catch(() => {});
    setHotelModalVisible(true);
  }, []);

  const handleShowEmergency = useCallback(() => {
    Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Heavy).catch(() => {});
    setEmergencyModalVisible(true);
  }, []);

  const fabScale = useRef(new Animated.Value(1)).current;
  const handleOpenMomentSheet = useCallback(() => {
    Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light).catch(() => {});
    Animated.sequence([
      Animated.timing(fabScale, { toValue: 1.15, duration: 80, useNativeDriver: true }),
      Animated.spring(fabScale, { toValue: 1, tension: 200, friction: 12, useNativeDriver: true }),
    ]).start();
    setMomentSheetVisible(true);
  }, [fabScale]);

  const handleCloseMomentSheet = useCallback(() => {
    Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light).catch(() => {});
    setMomentSheetVisible(false);
    setMomentNote('');
    setSelectedImageUri(null);
  }, []);

  const handlePickImage = useCallback(async () => {
    Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light).catch(() => {});
    const { status } = await ImagePicker.requestMediaLibraryPermissionsAsync();
    if (status !== 'granted') {
      Alert.alert(
        t('hereNow.photoPermissionTitle', { defaultValue: 'Photo access needed' }),
        t('hereNow.photoPermissionBody', { defaultValue: 'Allow photo library access to attach photos to moments.' }),
      );
      return;
    }
    const result = await ImagePicker.launchImageLibraryAsync({
      mediaTypes: ImagePicker.MediaTypeOptions.Images,
      allowsEditing: false,
      quality: 0.8,
    });
    if (!result.canceled && result.assets.length > 0) {
      setSelectedImageUri(result.assets[0].uri);
    }
  }, [t]);

  const handleSaveMoment = useCallback(async () => {
    if (!momentNote.trim()) return;
    if (!session?.user?.id) {
      Alert.alert(
        t('hereNow.signInTitle', { defaultValue: 'Sign in to save moments' }),
        t('hereNow.signInBody', { defaultValue: 'Create an account to capture travel moments.' }),
      );
      return;
    }
    setIsSavingMoment(true);
    try {
      const timeOfDay = getTimeOfDay(now.getHours());
      const timeLabel = timeOfDay.charAt(0).toUpperCase() + timeOfDay.slice(1);
      const weatherLabel = weather
        ? `${Math.round(weather.temp)}°C, ${weather.condition}`
        : null;
      const metaPrefix = weatherLabel
        ? `[${timeLabel}, ${weatherLabel}]`
        : `[${timeLabel}]`;
      const enrichedNote = `${metaPrefix} ${momentNote.trim()}`;

      await supabase.from('trip_moments').insert({
        user_id: session.user.id,
        trip_id: activeTrip?.id ?? null,
        note: enrichedNote,
        photo_url: selectedImageUri ?? null,
        location: destination || null,
        destination: destination || null,
      });
      Haptics.notificationAsync(Haptics.NotificationFeedbackType.Success).catch(() => {});
      setMomentSheetVisible(false);
      setMomentNote('');
      setSelectedImageUri(null);
    } catch {
      Haptics.notificationAsync(Haptics.NotificationFeedbackType.Error).catch(() => {});
    } finally {
      setIsSavingMoment(false);
    }
  }, [momentNote, session, activeTrip, destination, now, weather, selectedImageUri, t]);

  const handleCall = useCallback((number: string) => {
    Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Heavy).catch(() => {});
    Linking.openURL(`tel:${number}`).catch(() => {});
  }, []);

  // ---------------------------------------------------------------------------
  // Derived emergency numbers (API or fallback)
  // ---------------------------------------------------------------------------
  const police = emergencyNumbers?.police?.[0] ?? FALLBACK_EMERGENCY.police[0];
  const ambulance = emergencyNumbers?.ambulance?.[0] ?? FALLBACK_EMERGENCY.ambulance[0];
  const fire = emergencyNumbers?.fire?.[0] ?? FALLBACK_EMERGENCY.fire[0];

  // ---------------------------------------------------------------------------
  // Hotel name and local-script phrase for driver modal
  // ---------------------------------------------------------------------------
  const hotelName: string = useMemo(() => {
    if (!activeTrip?.itinerary) return destination || t('hereNow.unknownHotel', { defaultValue: 'My Hotel' });
    const match = activeTrip.itinerary.match(/hotel[:\s]+([^\n,\.]+)/i);
    return match?.[1]?.trim() ?? destination ?? t('hereNow.unknownHotel', { defaultValue: 'My Hotel' });
  }, [activeTrip, destination, t]);

  const hotelForDriver = useMemo(
    () => getHotelForDriver(destination || 'Unknown', hotelName),
    [destination, hotelName],
  );

  const cardEntrance = useRef(new Animated.Value(0)).current;
  useEffect(() => {
    Animated.spring(cardEntrance, {
      toValue: 1,
      tension: 65,
      friction: 10,
      useNativeDriver: true,
    }).start();
  }, [cardEntrance]);

  const contextOverlay = useMemo(() => {
    if (!context) return COLORS.transparent;
    if (context.weatherOverride && context.weatherOverride.toLowerCase().includes('rain')) return COLORS.blueAccent;
    if (context.mood === 'adventurous') return COLORS.goldMuted;
    return COLORS.transparent;
  }, [context]);

  // ---------------------------------------------------------------------------
  // Render
  // ---------------------------------------------------------------------------
  return (
    <View style={[styles.container, { paddingTop: insets.top }]}>
      {contextOverlay !== COLORS.transparent ? (
        <View
          pointerEvents="none"
          style={[StyleSheet.absoluteFill, { backgroundColor: contextOverlay, opacity: 0.06 }]}
        />
      ) : null}
      {/* Header */}
      <View style={styles.header}>
        <Pressable
          style={styles.backButton}
          onPress={handleBack}
          hitSlop={12}
        >
          <ChevronLeft size={24} color={COLORS.accent} strokeWidth={1.5} />
        </Pressable>
        <Text style={styles.headerLabel}>
          {t('hereNow.title', { defaultValue: 'I Am Here Now' })}
        </Text>
        <View style={styles.headerSpacer} />
      </View>

      <ScrollView
        style={styles.scroll}
        contentContainerStyle={[styles.scrollContent, { paddingBottom: insets.bottom + 100 }]}
        showsVerticalScrollIndicator={false}
      >
        {/* Greeting — spring on appear */}
        <Animated.View
          style={[
            styles.greetingSection,
            {
              opacity: cardEntrance,
              transform: [
                {
                  translateY: cardEntrance.interpolate({ inputRange: [0, 1], outputRange: [12, 0] }),
                },
              ],
            },
          ]}
        >
          <Text style={styles.greeting}>
            {context?.greeting ?? t('hereNow.defaultGreeting', { defaultValue: 'You are here.' })}
          </Text>
          <Text style={styles.timeInfo}>
            {context?.timeInfo ?? ''}
          </Text>
          {context?.suggestion ? (
            <Text style={styles.suggestion}>{context.suggestion}</Text>
          ) : null}
          {context?.weatherOverride ? (
            <View style={styles.weatherAlert}>
              <Text style={styles.weatherAlertText}>{context.weatherOverride}</Text>
            </View>
          ) : null}
        </Animated.View>

        {/* Weather row */}
        {weather ? (
          <View style={styles.weatherRow}>
            <WeatherPill weather={weather} />
          </View>
        ) : destination ? (
          <View style={styles.fallbackContainer}>
            <Text style={styles.fallbackText}>Weather data unavailable</Text>
          </View>
        ) : null}

        {/* Primary action buttons */}
        <View style={styles.buttonsSection}>
          <Pressable
            style={[styles.actionButton, styles.sageButton]}
            onPress={handleShowHotel}
          >
            <Text style={styles.actionButtonText}>
              {t('hereNow.showDriver', { defaultValue: 'Show driver my hotel' })}
            </Text>
          </Pressable>

          <Pressable
            style={[styles.actionButton, styles.coralButton]}
            onPress={handleShowEmergency}
          >
            <Text style={styles.actionButtonText}>
              {t('hereNow.emergency', { defaultValue: 'Emergency' })}
            </Text>
          </Pressable>
        </View>

        {/* Sonar "right now" section */}
        {destination ? (
          <View style={styles.sonarSection}>
            <View style={styles.sonarHeader}>
              <Text style={styles.sonarTitle}>
                {t('hereNow.rightNow', { defaultValue: 'Right now in' })} {destination}
              </Text>
              {sonarData?.isLive && <LiveBadge size="sm" />}
            </View>
            {sonarLoading && !sonarData && !sonarError ? (
              <Text style={styles.sonarLoading}>
                {t('hereNow.fetchingPulse', { defaultValue: 'Reading the city...' })}
              </Text>
            ) : sonarData?.answer ? (
              <>
                <Text style={styles.sonarAnswer}>{sonarData.answer}</Text>
                {sonarData.citations.length > 0 ? (
                  <SourceCitation citations={sonarData.citations} max={3} />
                ) : null}
              </>
            ) : sonarError ? (
              <Text style={styles.sonarLoading}>
                {t('hereNow.liveUnavailable', { defaultValue: 'Live data unavailable' })}
              </Text>
            ) : null}
          </View>
        ) : null}
      </ScrollView>

      {/* Floating moment capture button — haptic + brief glow on press */}
      <Pressable
        style={[styles.fabWrap, { bottom: insets.bottom + SPACING.lg }]}
        onPress={handleOpenMomentSheet}
      >
        <Animated.View style={[styles.fab, { transform: [{ scale: fabScale }] }]}>
          <Camera size={22} color={COLORS.bg} strokeWidth={1.5} />
        </Animated.View>
      </Pressable>

      {/* Hotel Driver Modal */}
      <Modal
        visible={hotelModalVisible}
        animationType="fade"
        transparent={false}
        onRequestClose={() => setHotelModalVisible(false)}
      >
        <View style={styles.hotelModal}>
          <Pressable
            style={[styles.modalCloseTop, { top: insets.top + SPACING.md }]}
            onPress={() => {
              Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light).catch(() => {});
              setHotelModalVisible(false);
            }}
            hitSlop={12}
          >
            <X size={28} color={COLORS.muted} strokeWidth={1.5} />
          </Pressable>
          <Text style={styles.hotelPhrase}>{hotelForDriver.phrase}</Text>
          <Text style={styles.hotelName}>{hotelForDriver.placeName}</Text>
          {hotelForDriver.secondary ? (
            <Text style={styles.hotelSecondary}>{hotelForDriver.secondary}</Text>
          ) : null}
        </View>
      </Modal>

      {/* Emergency Modal */}
      <Modal
        visible={emergencyModalVisible}
        animationType="slide"
        transparent
        onRequestClose={() => setEmergencyModalVisible(false)}
      >
        <View style={styles.modalOverlay}>
          <View style={[styles.emergencySheet, { paddingBottom: insets.bottom + SPACING.lg }]}>
            <View style={styles.sheetHandle} />
            <View style={styles.sheetTitleRow}>
              <Text style={styles.emergencyTitle}>
                {t('hereNow.emergencyNumbers', { defaultValue: 'Emergency Numbers' })}
              </Text>
              <Pressable
                onPress={() => {
                  Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light).catch(() => {});
                  setEmergencyModalVisible(false);
                }}
                hitSlop={12}
              >
                <X size={22} color={COLORS.muted} strokeWidth={1.5} />
              </Pressable>
            </View>

            {destination ? (
              <Text style={styles.emergencyLocation}>{destination}</Text>
            ) : null}

            <EmergencyRow
              label={t('hereNow.police', { defaultValue: 'Police' })}
              number={police}
              onCall={handleCall}
            />
            <EmergencyRow
              label={t('hereNow.ambulance', { defaultValue: 'Ambulance' })}
              number={ambulance}
              onCall={handleCall}
            />
            <EmergencyRow
              label={t('hereNow.fire', { defaultValue: 'Fire' })}
              number={fire}
              onCall={handleCall}
            />

            <Text style={styles.emergencyNote}>
              {t('hereNow.emergencyNote', { defaultValue: '112 works in most countries. 911 in North America.' })}
            </Text>
          </View>
        </View>
      </Modal>

      {/* Moment Capture Sheet */}
      <Modal
        visible={momentSheetVisible}
        animationType="slide"
        transparent
        onRequestClose={handleCloseMomentSheet}
      >
        <View style={styles.modalOverlay}>
          <View style={[styles.momentSheet, { paddingBottom: insets.bottom + SPACING.lg }]}>
            <View style={styles.sheetHandle} />
            <View style={styles.sheetTitleRow}>
              <Text style={styles.momentTitle}>
                {t('hereNow.whatsHappening', { defaultValue: "What's happening?" })}
              </Text>
              <Pressable onPress={handleCloseMomentSheet} hitSlop={12}>
                <X size={22} color={COLORS.muted} strokeWidth={1.5} />
              </Pressable>
            </View>

            <TextInput
              style={styles.momentInput}
              value={momentNote}
              onChangeText={setMomentNote}
              placeholder={t('hereNow.momentPlaceholder', { defaultValue: 'Note this moment...' })}
              placeholderTextColor={COLORS.muted}
              multiline
              autoFocus
              maxLength={500}
            />

            <View style={styles.momentPhotoRow}>
              <Pressable style={styles.photoPickerButton} onPress={handlePickImage} hitSlop={8}>
                <ImageIcon size={18} color={COLORS.sage} strokeWidth={1.5} />
              </Pressable>
              {selectedImageUri ? (
                <View style={styles.photoThumbnailWrap}>
                  <Image
                    source={{ uri: selectedImageUri }}
                    style={styles.photoThumbnail}
                  />
                  <Pressable
                    style={styles.photoThumbnailRemove}
                    onPress={() => setSelectedImageUri(null)}
                    hitSlop={6}
                  >
                    <X size={12} color={COLORS.bg} strokeWidth={2} />
                  </Pressable>
                </View>
              ) : null}
            </View>

            <Pressable
              style={[
                styles.saveMomentButton,
                (!momentNote.trim() || isSavingMoment) && styles.saveMomentButtonDisabled,
              ]}
              onPress={handleSaveMoment}
              disabled={!momentNote.trim() || isSavingMoment}
            >
              <Text style={styles.saveMomentText}>
                {isSavingMoment
                  ? t('hereNow.saving', { defaultValue: 'Saving...' })
                  : t('hereNow.saveMemory', { defaultValue: 'Save Memory' })}
              </Text>
            </Pressable>
          </View>
        </View>
      </Modal>
    </View>
  );
}

// ---------------------------------------------------------------------------
// Sub-components
// ---------------------------------------------------------------------------

interface WeatherPillProps {
  weather: CurrentWeather;
}
function WeatherPill({ weather }: WeatherPillProps): React.JSX.Element {
  return (
    <View style={styles.weatherPill}>
      <Text style={styles.weatherTemp}>{Math.round(weather.temp)}°C</Text>
      <View style={styles.weatherDivider} />
      <Text style={styles.weatherCondition}>{weather.condition}</Text>
      <View style={styles.weatherDivider} />
      <Text style={styles.weatherHumidity}>{weather.humidity}% humidity</Text>
    </View>
  );
}

interface EmergencyRowProps {
  label: string;
  number: string;
  onCall: (number: string) => void;
}
function EmergencyRow({ label, number, onCall }: EmergencyRowProps): React.JSX.Element {
  return (
    <View style={styles.emergencyRow}>
      <View style={styles.emergencyRowLeft}>
        <Text style={styles.emergencyRowLabel}>{label}</Text>
        <Text style={styles.emergencyRowNumber}>{number}</Text>
      </View>
      <Pressable
        style={styles.callButton}
        onPress={() => onCall(number)}
      >
        <Phone size={16} color={COLORS.bg} strokeWidth={1.5} />
        <Text style={styles.callButtonText}>Call</Text>
      </Pressable>
    </View>
  );
}

// ---------------------------------------------------------------------------
// Country code guesser (destination label → ISO 2-letter)
// ---------------------------------------------------------------------------
function guessCountryCode(destination: string): string | null {
  const map: Record<string, string> = {
    Tokyo: 'JP', Kyoto: 'JP', Osaka: 'JP',
    Paris: 'FR',
    London: 'GB',
    Barcelona: 'ES', Madrid: 'ES',
    Rome: 'IT', Milan: 'IT', Florence: 'IT',
    Bangkok: 'TH', 'Chiang Mai': 'TH',
    Bali: 'ID',
    Seoul: 'KR',
    'New York': 'US', 'Los Angeles': 'US',
    'Mexico City': 'MX', Oaxaca: 'MX',
    'Buenos Aires': 'AR',
    Istanbul: 'TR',
    Marrakech: 'MA',
    'Cape Town': 'ZA',
    Dubai: 'AE',
    Sydney: 'AU',
    Reykjavik: 'IS',
    Lisbon: 'PT', Porto: 'PT',
    Amsterdam: 'NL',
    'Hoi An': 'VN', Hanoi: 'VN',
    Cartagena: 'CO', Medellín: 'CO',
    Jaipur: 'IN', Mumbai: 'IN', Delhi: 'IN',
    Tbilisi: 'GE',
    Budapest: 'HU',
    Dubrovnik: 'HR',
  };
  return map[destination] ?? null;
}

// ---------------------------------------------------------------------------
// Styles
// ---------------------------------------------------------------------------
const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: COLORS.bg,
  } as ViewStyle,

  header: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: SPACING.md,
    paddingVertical: SPACING.sm,
  } as ViewStyle,

  backButton: {
    width: 40,
    height: 40,
    alignItems: 'center',
    justifyContent: 'center',
  } as ViewStyle,

  headerLabel: {
    flex: 1,
    textAlign: 'center',
    fontFamily: FONTS.mono,
    fontSize: 12,
    color: COLORS.muted,
    letterSpacing: 1,
    textTransform: 'uppercase',
  } as TextStyle,

  headerSpacer: {
    width: 40,
  } as ViewStyle,

  scroll: {
    flex: 1,
  } as ViewStyle,

  scrollContent: {
    paddingHorizontal: SPACING.md,
    paddingTop: SPACING.lg,
  } as ViewStyle,

  greetingSection: {
    marginBottom: SPACING.lg,
  } as ViewStyle,

  greeting: {
    fontFamily: FONTS.header,
    fontSize: 28,
    color: COLORS.accent,
    lineHeight: 36,
    marginBottom: SPACING.sm,
  } as TextStyle,

  timeInfo: {
    fontFamily: FONTS.mono,
    fontSize: 13,
    color: COLORS.muted,
    marginBottom: SPACING.sm,
  } as TextStyle,

  suggestion: {
    fontFamily: FONTS.body,
    fontSize: 15,
    color: COLORS.creamDim,
    lineHeight: 22,
  } as TextStyle,

  weatherAlert: {
    marginTop: SPACING.md,
    backgroundColor: COLORS.coralSubtle,
    borderWidth: 1,
    borderColor: COLORS.coralBorder,
    borderRadius: RADIUS.md,
    padding: SPACING.md,
  } as ViewStyle,

  weatherAlertText: {
    fontFamily: FONTS.body,
    fontSize: 13,
    color: COLORS.coral,
    lineHeight: 20,
  } as TextStyle,

  weatherRow: {
    marginBottom: SPACING.lg,
  } as ViewStyle,

  weatherPill: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: COLORS.surface1,
    borderWidth: 1,
    borderColor: COLORS.border,
    borderRadius: RADIUS.pill,
    paddingHorizontal: SPACING.md,
    paddingVertical: SPACING.sm,
    alignSelf: 'flex-start',
    gap: SPACING.sm,
  } as ViewStyle,

  weatherTemp: {
    fontFamily: FONTS.mono,
    fontSize: 13,
    color: COLORS.accent,
  } as TextStyle,

  weatherDivider: {
    width: 1,
    height: 12,
    backgroundColor: COLORS.border,
  } as ViewStyle,

  weatherCondition: {
    fontFamily: FONTS.mono,
    fontSize: 12,
    color: COLORS.muted,
  } as TextStyle,

  weatherHumidity: {
    fontFamily: FONTS.mono,
    fontSize: 12,
    color: COLORS.muted,
  } as TextStyle,

  buttonsSection: {
    gap: SPACING.sm,
    marginBottom: SPACING.xl,
  } as ViewStyle,

  actionButton: {
    height: 56,
    borderRadius: RADIUS.pill,
    alignItems: 'center',
    justifyContent: 'center',
  } as ViewStyle,

  sageButton: {
    backgroundColor: COLORS.sage,
  } as ViewStyle,

  coralButton: {
    backgroundColor: COLORS.coral,
  } as ViewStyle,

  actionButtonText: {
    fontFamily: FONTS.bodyMedium,
    fontSize: 16,
    color: COLORS.bg,
  } as TextStyle,

  sonarSection: {
    backgroundColor: COLORS.surface1,
    borderWidth: 1,
    borderColor: COLORS.border,
    borderRadius: RADIUS.lg,
    padding: SPACING.md,
    gap: SPACING.sm,
  } as ViewStyle,

  sonarHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: SPACING.sm,
  } as ViewStyle,

  sonarTitle: {
    fontFamily: FONTS.bodyMedium,
    fontSize: 13,
    color: COLORS.creamDim,
  } as TextStyle,

  sonarLoading: {
    fontFamily: FONTS.mono,
    fontSize: 12,
    color: COLORS.muted,
  } as TextStyle,

  sonarAnswer: {
    fontFamily: FONTS.body,
    fontSize: 14,
    color: COLORS.creamDim,
    lineHeight: 22,
  } as TextStyle,

  fabWrap: {
    position: 'absolute',
    right: SPACING.lg,
    width: 52,
    height: 52,
    alignItems: 'center',
    justifyContent: 'center',
  } as ViewStyle,
  fab: {
    width: 52,
    height: 52,
    borderRadius: RADIUS.pill,
    backgroundColor: COLORS.sage,
    alignItems: 'center',
    justifyContent: 'center',
    shadowColor: COLORS.sage,
    shadowOffset: { width: 0, height: 0 },
    shadowOpacity: 0.5,
    shadowRadius: 12,
    elevation: 6,
  } as ViewStyle,

  // Hotel modal
  hotelModal: {
    flex: 1,
    backgroundColor: COLORS.black,
    alignItems: 'center',
    justifyContent: 'center',
    paddingHorizontal: SPACING.xl,
  } as ViewStyle,

  modalCloseTop: {
    position: 'absolute',
    right: SPACING.lg,
  } as ViewStyle,

  hotelPhrase: {
    fontFamily: FONTS.mono,
    fontSize: 16,
    color: COLORS.sage,
    marginBottom: SPACING.sm,
    letterSpacing: 0.5,
    textAlign: 'center',
  } as TextStyle,

  hotelName: {
    fontFamily: FONTS.header,
    fontSize: 42,
    color: COLORS.white,
    textAlign: 'center',
    lineHeight: 52,
  } as TextStyle,

  hotelSecondary: {
    fontFamily: FONTS.body,
    fontSize: 18,
    color: COLORS.creamMuted,
    textAlign: 'center',
    marginTop: SPACING.md,
  } as TextStyle,

  // Shared modal styles
  modalOverlay: {
    flex: 1,
    backgroundColor: COLORS.overlayDark,
    justifyContent: 'flex-end',
  } as ViewStyle,

  sheetHandle: {
    width: 36,
    height: 4,
    borderRadius: RADIUS.pill,
    backgroundColor: COLORS.border,
    alignSelf: 'center',
    marginBottom: SPACING.md,
  } as ViewStyle,

  sheetTitleRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    marginBottom: SPACING.md,
  } as ViewStyle,

  // Emergency sheet
  emergencySheet: {
    backgroundColor: COLORS.surface1,
    borderTopLeftRadius: RADIUS.xl,
    borderTopRightRadius: RADIUS.xl,
    padding: SPACING.lg,
    paddingTop: SPACING.md,
  } as ViewStyle,

  emergencyTitle: {
    fontFamily: FONTS.header,
    fontSize: 20,
    color: COLORS.accent,
  } as TextStyle,

  emergencyLocation: {
    fontFamily: FONTS.mono,
    fontSize: 12,
    color: COLORS.muted,
    marginBottom: SPACING.md,
    textTransform: 'uppercase',
    letterSpacing: 1,
  } as TextStyle,

  emergencyRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingVertical: SPACING.md,
    borderBottomWidth: 1,
    borderBottomColor: COLORS.border,
  } as ViewStyle,

  emergencyRowLeft: {
    gap: 2,
  } as ViewStyle,

  emergencyRowLabel: {
    fontFamily: FONTS.mono,
    fontSize: 11,
    color: COLORS.muted,
    textTransform: 'uppercase',
    letterSpacing: 0.5,
  } as TextStyle,

  emergencyRowNumber: {
    fontFamily: FONTS.header,
    fontSize: 28,
    color: COLORS.coral,
  } as TextStyle,

  callButton: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
    backgroundColor: COLORS.coral,
    borderRadius: RADIUS.pill,
    paddingHorizontal: SPACING.md,
    paddingVertical: SPACING.sm,
  } as ViewStyle,

  callButtonText: {
    fontFamily: FONTS.bodyMedium,
    fontSize: 14,
    color: COLORS.bg,
  } as TextStyle,

  emergencyNote: {
    fontFamily: FONTS.mono,
    fontSize: 11,
    color: COLORS.muted,
    marginTop: SPACING.md,
    lineHeight: 17,
  } as TextStyle,

  // Moment sheet
  momentSheet: {
    backgroundColor: COLORS.surface1,
    borderTopLeftRadius: RADIUS.xl,
    borderTopRightRadius: RADIUS.xl,
    padding: SPACING.lg,
    paddingTop: SPACING.md,
  } as ViewStyle,

  momentTitle: {
    fontFamily: FONTS.header,
    fontSize: 20,
    color: COLORS.accent,
  } as TextStyle,

  momentInput: {
    backgroundColor: COLORS.bgElevated,
    borderWidth: 1,
    borderColor: COLORS.border,
    borderRadius: RADIUS.md,
    padding: SPACING.md,
    fontFamily: FONTS.body,
    fontSize: 16,
    color: COLORS.accent,
    minHeight: 120,
    textAlignVertical: 'top',
    marginBottom: SPACING.md,
  } as TextStyle,

  saveMomentButton: {
    height: 52,
    borderRadius: RADIUS.pill,
    backgroundColor: COLORS.sage,
    alignItems: 'center',
    justifyContent: 'center',
  } as ViewStyle,

  saveMomentButtonDisabled: {
    opacity: 0.4,
  } as ViewStyle,

  saveMomentText: {
    fontFamily: FONTS.bodyMedium,
    fontSize: 15,
    color: COLORS.bg,
  } as TextStyle,

  momentPhotoRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: SPACING.sm,
    marginBottom: SPACING.md,
  } as ViewStyle,

  photoPickerButton: {
    width: 36,
    height: 36,
    borderRadius: RADIUS.md,
    borderWidth: 1,
    borderColor: COLORS.sage,
    alignItems: 'center',
    justifyContent: 'center',
  } as ViewStyle,

  photoThumbnailWrap: {
    width: 48,
    height: 48,
    position: 'relative',
  } as ViewStyle,

  photoThumbnail: {
    width: 48,
    height: 48,
    borderRadius: RADIUS.sm,
  } as ImageStyle,

  photoThumbnailRemove: {
    position: 'absolute',
    top: -6,
    right: -6,
    width: 18,
    height: 18,
    borderRadius: 9,
    backgroundColor: COLORS.muted,
    alignItems: 'center',
    justifyContent: 'center',
  } as ViewStyle,
  fallbackContainer: { paddingVertical: SPACING.md, alignItems: 'center' } as ViewStyle,
  fallbackText: { color: COLORS.muted, fontSize: 14, fontFamily: FONTS.body } as TextStyle,
});
