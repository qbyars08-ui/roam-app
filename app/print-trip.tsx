// =============================================================================
// ROAM — Printable Trip Summary (Pro PDF Export)
// Accessed via router.push('/print-trip?tripId=xxx')
// White-background, print-optimised layout. No dark mode.
// =============================================================================
import React, { useCallback, useEffect, useMemo, useState } from 'react';
import {
  Linking,
  Platform,
  Pressable,
  ScrollView,
  StyleSheet,
  Text,
  View,
} from 'react-native';
import { useLocalSearchParams, useRouter } from 'expo-router';
import {
  Printer,
  ArrowLeft,
  Download,
  Share2,
  Lock,
  CloudRain,
  Thermometer,
  DollarSign,
  Luggage,
} from 'lucide-react-native';

import { useAppStore } from '../lib/store';
import { COLORS, RADIUS } from '../lib/constants';
import { parseItinerary, type Itinerary, type ItineraryDay, type TimeSlotActivity } from '../lib/types/itinerary';
import { getEmergencyNumbers, type EmergencyNumbers } from '../lib/emergency-numbers';
import { getSimpleVisaInfo as getVisaInfo, type SimpleVisaInfo as VisaInfo, destinationToCountryCode } from '../lib/visa-intel';
import { getPhrasesForDestination, type SurvivalPhrase } from '../lib/survival-phrases';
import { generatePackingList, type PackingItem, type PackingListResult } from '../lib/packing-list';
import { getExchangeRates, type ExchangeRateData } from '../lib/exchange-rates';
import { getCurrentWeather, getForecast, type CurrentWeather, type ForecastDay } from '../lib/apis/openweather';
import { getWeatherIntel } from '../lib/apis/openweather';
import { DESTINATIONS, HIDDEN_DESTINATIONS } from '../lib/constants';

// ---------------------------------------------------------------------------
// Types
// ---------------------------------------------------------------------------

interface PrintData {
  itinerary: Itinerary;
  emergencyNumbers: EmergencyNumbers | null;
  visaInfo: VisaInfo | null;
  phrases: SurvivalPhrase[];
  startDate: string | undefined;
  days: number;
  packingList: PackingListResult | null;
  exchangeRates: ExchangeRateData | null;
  currentWeather: CurrentWeather | null;
  forecast: ForecastDay[] | null;
  destinationCurrency: string | null;
}

// ---------------------------------------------------------------------------
// Helpers
// ---------------------------------------------------------------------------

function formatDate(isoDate: string | undefined, dayOffset: number): string {
  if (!isoDate) return `Day ${dayOffset + 1}`;
  try {
    const date = new Date(isoDate);
    date.setDate(date.getDate() + dayOffset);
    return date.toLocaleDateString('en-US', { weekday: 'short', month: 'short', day: 'numeric' });
  } catch {
    return `Day ${dayOffset + 1}`;
  }
}

function formatDateRange(startDate: string | undefined, numDays: number): string {
  if (!startDate) return `${numDays} days`;
  try {
    const start = new Date(startDate);
    const end = new Date(startDate);
    end.setDate(end.getDate() + numDays - 1);
    const startStr = start.toLocaleDateString('en-US', { month: 'long', day: 'numeric' });
    const endStr = end.toLocaleDateString('en-US', { month: 'long', day: 'numeric', year: 'numeric' });
    return `${startStr} – ${endStr}`;
  } catch {
    return `${numDays} days`;
  }
}

function findDestinationCurrency(destination: string): string | null {
  const all = [...DESTINATIONS, ...HIDDEN_DESTINATIONS];
  const match = all.find((d) => d.label.toLowerCase() === destination.toLowerCase());
  return match?.currencyCode ?? null;
}

const VISA_STATUS_LABELS: Record<string, string> = {
  'visa-free': 'Visa-Free',
  'visa-on-arrival': 'Visa on Arrival',
  'e-visa': 'E-Visa Required',
  'required': 'Visa Required',
};

// ---------------------------------------------------------------------------
// Print-only CSS (web)
// ---------------------------------------------------------------------------

function injectPrintStyles(): void {
  if (Platform.OS !== 'web' || typeof document === 'undefined') return;

  const PRINT_STYLE_ID = 'roam-print-styles';
  if (document.getElementById(PRINT_STYLE_ID)) return;

  const style = document.createElement('style');
  style.id = PRINT_STYLE_ID;
  style.textContent = `
    @media print {
      /* Hide the toolbar and any nav */
      [data-print-hide="true"] {
        display: none !important;
      }
      /* Reset body for clean print */
      body {
        background: #ffffff !important;
        -webkit-print-color-adjust: exact;
        print-color-adjust: exact;
      }
      /* Avoid page breaks inside day blocks */
      [data-print-block="day"] {
        break-inside: avoid;
        page-break-inside: avoid;
      }
      /* Avoid breaks inside sections */
      [data-print-block="section"] {
        break-inside: avoid;
        page-break-inside: avoid;
      }
      /* Force white bg on scroll container */
      [data-testid="print-scroll"] {
        background: #ffffff !important;
      }
    }
  `;
  document.head.appendChild(style);
}

// ---------------------------------------------------------------------------
// Sub-components
// ---------------------------------------------------------------------------

function SectionHeader({ title }: { title: string }) {
  return <Text style={styles.sectionHeader}>{title}</Text>;
}

function TimeSlotRow({
  label,
  slot,
}: {
  label: string;
  slot: TimeSlotActivity;
}) {
  return (
    <View style={styles.slotRow}>
      <View style={styles.slotLabelCol}>
        <Text style={styles.slotLabel}>{label}</Text>
        {slot.time ? <Text style={styles.slotTime}>{slot.time}</Text> : null}
      </View>
      <View style={styles.slotContent}>
        <Text style={styles.slotActivity}>{slot.activity}</Text>
        <Text style={styles.slotMeta}>
          {slot.location}{slot.cost ? `  ·  ${slot.cost}` : ''}
        </Text>
        {slot.tip ? <Text style={styles.slotTip}>{slot.tip}</Text> : null}
      </View>
    </View>
  );
}

function DayBlock({ day, startDate }: { day: ItineraryDay; startDate: string | undefined }) {
  const dateLabel = formatDate(startDate, day.day - 1);
  return (
    <View style={styles.dayBlock} {...(Platform.OS === 'web' ? { 'data-print-block': 'day' } as Record<string, string> : {})}>
      <View style={styles.dayHeader}>
        <Text style={styles.dayNumber}>Day {day.day}</Text>
        <Text style={styles.dayDate}>{dateLabel}</Text>
        <Text style={styles.dayTheme}>{day.theme}</Text>
      </View>
      <TimeSlotRow label="Morning" slot={day.morning} />
      <View style={styles.slotDivider} />
      <TimeSlotRow label="Afternoon" slot={day.afternoon} />
      <View style={styles.slotDivider} />
      <TimeSlotRow label="Evening" slot={day.evening} />
      <View style={styles.hotelRow}>
        <Text style={styles.hotelLabel}>Hotel</Text>
        <Text style={styles.hotelName}>
          {day.accommodation.name}
          {day.accommodation.neighborhood ? ` · ${day.accommodation.neighborhood}` : ''}
        </Text>
        <Text style={styles.hotelMeta}>
          {day.accommodation.type}  ·  {day.accommodation.pricePerNight}/night
        </Text>
      </View>
    </View>
  );
}

function ProPaywallNudge({ onUpgrade }: { onUpgrade: () => void }) {
  return (
    <View style={styles.paywallNudge}>
      <Lock size={20} color={COLORS.gold} strokeWidth={1.5} />
      <Text style={styles.paywallTitle}>Pro Feature</Text>
      <Text style={styles.paywallDescription}>
        Upgrade to Pro to export your trip as PDF
      </Text>
      <Pressable
        onPress={onUpgrade}
        style={({ pressed }) => [styles.paywallButton, { opacity: pressed ? 0.85 : 1 }]}
      >
        <Text style={styles.paywallButtonText}>Upgrade to Pro</Text>
      </Pressable>
    </View>
  );
}

function WeatherSection({ weather, forecast }: { weather: CurrentWeather | null; forecast: ForecastDay[] | null }) {
  if (!weather && (!forecast || forecast.length === 0)) return null;

  return (
    <View {...(Platform.OS === 'web' ? { 'data-print-block': 'section' } as Record<string, string> : {})}>
      <SectionHeader title="Weather Forecast" />
      {weather ? (
        <View style={styles.weatherCurrentBlock}>
          <View style={styles.weatherCurrentRow}>
            <Thermometer size={16} color={BASE.inkMuted} strokeWidth={1.5} />
            <Text style={styles.weatherTemp}>{weather.temp}°F</Text>
            <Text style={styles.weatherCondition}>{weather.condition}</Text>
          </View>
          <Text style={styles.weatherDetail}>
            Humidity: {weather.humidity}%  ·  Wind: {weather.windSpeed} km/h
          </Text>
        </View>
      ) : null}
      {forecast && forecast.length > 0 ? (
        <View style={styles.forecastGrid}>
          {forecast.slice(0, 7).map((day) => (
            <View key={day.date} style={styles.forecastDay}>
              <Text style={styles.forecastDate}>{day.date.slice(5)}</Text>
              <Text style={styles.forecastTemp}>
                {day.tempHigh}° / {day.tempLow}°
              </Text>
              <Text style={styles.forecastCondition}>{day.condition}</Text>
              {day.rainChance > 20 ? (
                <View style={styles.forecastRainRow}>
                  <CloudRain size={10} color={BASE.inkLight} strokeWidth={1.5} />
                  <Text style={styles.forecastRain}>{day.rainChance}%</Text>
                </View>
              ) : null}
            </View>
          ))}
        </View>
      ) : null}
    </View>
  );
}

function CurrencySection({
  rates,
  destinationCurrency,
}: {
  rates: ExchangeRateData | null;
  destinationCurrency: string | null;
}) {
  if (!rates) return null;

  const relevantCurrencies = useMemo(() => {
    const always = ['EUR', 'GBP', 'JPY'];
    const combined = destinationCurrency
      ? [destinationCurrency, ...always.filter((c) => c !== destinationCurrency)]
      : always;
    return combined.filter((c) => c !== rates.base && rates.rates[c] !== undefined).slice(0, 6);
  }, [rates, destinationCurrency]);

  if (relevantCurrencies.length === 0) return null;

  return (
    <View {...(Platform.OS === 'web' ? { 'data-print-block': 'section' } as Record<string, string> : {})}>
      <SectionHeader title="Currency Exchange Rates" />
      <View style={styles.currencyBlock}>
        <Text style={styles.currencyBase}>1 {rates.base} =</Text>
        <View style={styles.currencyGrid}>
          {relevantCurrencies.map((code) => (
            <View key={code} style={styles.currencyRow}>
              <Text style={styles.currencyCode}>{code}</Text>
              <Text style={styles.currencyRate}>{rates.rates[code].toFixed(2)}</Text>
            </View>
          ))}
        </View>
        <Text style={styles.currencyDate}>Rates as of {rates.date}</Text>
      </View>
    </View>
  );
}

function PackingSection({ packingList }: { packingList: PackingListResult | null }) {
  if (!packingList || packingList.items.length === 0) return null;

  const grouped = useMemo(() => {
    const map = new Map<string, readonly PackingItem[]>();
    const categories = ['clothing', 'toiletries', 'electronics', 'documents', 'health', 'misc'] as const;
    for (const cat of categories) {
      const items = packingList.items.filter((item) => item.category === cat);
      if (items.length > 0) {
        map.set(cat, items);
      }
    }
    return map;
  }, [packingList]);

  const categoryLabels: Record<string, string> = {
    clothing: 'Clothing',
    toiletries: 'Toiletries',
    electronics: 'Electronics',
    documents: 'Documents',
    health: 'Health',
    misc: 'Miscellaneous',
  };

  return (
    <View {...(Platform.OS === 'web' ? { 'data-print-block': 'section' } as Record<string, string> : {})}>
      <SectionHeader title="Packing Checklist" />
      {Array.from(grouped.entries()).map(([category, items]) => (
        <View key={category} style={styles.packingCategory}>
          <Text style={styles.packingCategoryLabel}>{categoryLabels[category] ?? category}</Text>
          <View style={styles.packingGrid}>
            {items.map((item) => (
              <View key={item.id} style={styles.packingItem}>
                <View style={styles.packingCheckbox} />
                <Text style={[styles.packingText, item.essential ? styles.packingEssential : undefined]}>
                  {item.name}
                </Text>
              </View>
            ))}
          </View>
        </View>
      ))}
      {packingList.proTips.length > 0 ? (
        <View style={styles.packingTips}>
          {packingList.proTips.slice(0, 3).map((tip, idx) => (
            <Text key={idx} style={styles.packingTipText}>• {tip}</Text>
          ))}
        </View>
      ) : null}
    </View>
  );
}

// ---------------------------------------------------------------------------
// Main screen
// ---------------------------------------------------------------------------

export default function PrintTripScreen() {
  const router = useRouter();
  const { tripId } = useLocalSearchParams<{ tripId?: string }>();
  const trips = useAppStore((s) => s.trips);
  const isPro = useAppStore((s) => s.isPro);

  const [printData, setPrintData] = useState<PrintData | null>(null);
  const [error, setError] = useState<string | null>(null);

  // Inject @media print styles on web
  useEffect(() => {
    injectPrintStyles();
  }, []);

  // ---------------------------------------------------------------------------
  // Load data
  // ---------------------------------------------------------------------------
  useEffect(() => {
    const trip = trips.find((t) => t.id === tripId) ?? trips[trips.length - 1] ?? null;
    if (!trip) {
      setError('Trip not found.');
      return;
    }

    let itinerary: Itinerary;
    try {
      itinerary = parseItinerary(trip.itinerary);
    } catch {
      setError('Could not parse itinerary data.');
      return;
    }

    const countryCode = destinationToCountryCode(itinerary.destination);
    const visaInfo = getVisaInfo(itinerary.destination);
    const { phrases } = getPhrasesForDestination(itinerary.destination);
    const topPhrases = phrases.slice(0, 6);
    const destinationCurrency = findDestinationCurrency(itinerary.destination);

    const loadAsyncData = async () => {
      // Load all async data in parallel
      const [emergencyNumbers, exchangeRates, currentWeather, forecast, weatherIntel] = await Promise.all([
        countryCode ? getEmergencyNumbers(countryCode).catch(() => null) : Promise.resolve(null),
        getExchangeRates('USD').catch(() => null),
        getCurrentWeather(itinerary.destination).catch(() => null),
        getForecast(itinerary.destination).catch(() => null),
        getWeatherIntel(itinerary.destination).catch(() => null),
      ]);

      // Generate packing list (sync, uses weather intel)
      const packingList = generatePackingList(
        itinerary.destination,
        trip.days,
        weatherIntel,
        trip.vibes,
        undefined,
        itinerary,
      );

      setPrintData({
        itinerary,
        emergencyNumbers,
        visaInfo,
        phrases: topPhrases,
        startDate: trip.startDate,
        days: trip.days,
        packingList,
        exchangeRates,
        currentWeather,
        forecast,
        destinationCurrency,
      });
    };

    loadAsyncData();
  }, [tripId, trips]);

  // ---------------------------------------------------------------------------
  // Handlers
  // ---------------------------------------------------------------------------
  const handlePrint = useCallback(() => {
    if (Platform.OS === 'web' && typeof window !== 'undefined') {
      window.print();
    }
  }, []);

  const handleBack = useCallback(() => {
    router.back();
  }, [router]);

  const handleShareLink = useCallback(() => {
    if (!tripId) return;
    const shareUrl = `https://roamapp.app/shared-trip/${tripId}`;
    if (Platform.OS === 'web' && typeof navigator !== 'undefined' && navigator.clipboard) {
      navigator.clipboard.writeText(shareUrl).catch(() => {
        // Fallback: do nothing, URL is displayed
      });
    } else {
      Linking.openURL(shareUrl).catch(() => {
        // Graceful fallback
      });
    }
  }, [tripId]);

  const handleUpgrade = useCallback(() => {
    router.push('/paywall');
  }, [router]);

  // ---------------------------------------------------------------------------
  // Render
  // ---------------------------------------------------------------------------

  if (error) {
    return (
      <View style={styles.errorContainer}>
        <Text style={styles.errorText}>{error}</Text>
        <Pressable onPress={handleBack} style={styles.backBtn}>
          <Text style={styles.backBtnText}>Go back</Text>
        </Pressable>
      </View>
    );
  }

  if (!printData) {
    return (
      <View style={styles.loadingContainer}>
        <Text style={styles.loadingText}>Preparing print pack...</Text>
      </View>
    );
  }

  const {
    itinerary,
    emergencyNumbers,
    visaInfo,
    phrases,
    startDate,
    days,
    packingList,
    exchangeRates,
    currentWeather,
    forecast,
    destinationCurrency,
  } = printData;
  const dateRange = formatDateRange(startDate, days);
  const shareUrl = tripId ? `https://roamapp.app/shared-trip/${tripId}` : null;

  return (
    <ScrollView
      style={styles.page}
      contentContainerStyle={styles.pageContent}
      {...(Platform.OS === 'web' ? { 'data-testid': 'print-scroll' } as Record<string, string> : {})}
    >
      {/* ── Toolbar (screen-only, hidden on print) ── */}
      <View
        style={styles.toolbar}
        {...(Platform.OS === 'web' ? { 'data-print-hide': 'true' } as Record<string, string> : {})}
      >
        <Pressable
          onPress={handleBack}
          hitSlop={8}
          style={({ pressed }) => [styles.toolbarBtn, { opacity: pressed ? 0.6 : 1 }]}
          accessibilityLabel="Back"
        >
          <ArrowLeft size={20} color="#1a1a1a" strokeWidth={1.5} />
          <Text style={styles.toolbarBtnText}>Back</Text>
        </Pressable>

        <View style={styles.toolbarActions}>
          {/* Share link button (always visible) */}
          {shareUrl ? (
            <Pressable
              onPress={handleShareLink}
              hitSlop={8}
              style={({ pressed }) => [styles.shareBtn, { opacity: pressed ? 0.85 : 1 }]}
              accessibilityLabel="Share trip link"
            >
              <Share2 size={16} color={BASE.ink} strokeWidth={1.5} />
              <Text style={styles.shareBtnText}>Share Link</Text>
            </Pressable>
          ) : null}

          {/* Download PDF button — Pro-gated, web only */}
          {Platform.OS === 'web' ? (
            isPro ? (
              <Pressable
                onPress={handlePrint}
                hitSlop={8}
                style={({ pressed }) => [styles.printBtn, { opacity: pressed ? 0.85 : 1 }]}
                accessibilityLabel="Download PDF"
              >
                <Download size={16} color="#ffffff" strokeWidth={1.5} />
                <Text style={styles.printBtnText}>Download PDF</Text>
              </Pressable>
            ) : (
              <Pressable
                onPress={handleUpgrade}
                hitSlop={8}
                style={({ pressed }) => [styles.proLockedBtn, { opacity: pressed ? 0.85 : 1 }]}
                accessibilityLabel="Upgrade to Pro for PDF export"
              >
                <Lock size={14} color={COLORS.gold} strokeWidth={1.5} />
                <Text style={styles.proLockedBtnText}>PDF Export</Text>
              </Pressable>
            )
          ) : null}
        </View>
      </View>

      {/* ── Pro paywall nudge (non-Pro users, web only) ── */}
      {Platform.OS === 'web' && !isPro ? (
        <View
          style={styles.paywallBanner}
          {...(Platform.OS === 'web' ? { 'data-print-hide': 'true' } as Record<string, string> : {})}
        >
          <ProPaywallNudge onUpgrade={handleUpgrade} />
        </View>
      ) : null}

      {/* ── Print body ── */}
      <View style={styles.printBody}>
        {/* Header */}
        <View style={styles.headerBlock}>
          <Text style={styles.destination}>{itinerary.destination}</Text>
          <Text style={styles.tagline}>{itinerary.tagline}</Text>
          <Text style={styles.meta}>{dateRange}  ·  {days} {days === 1 ? 'day' : 'days'}  ·  {itinerary.totalBudget}</Text>
        </View>

        {/* Share URL / QR placeholder */}
        {shareUrl ? (
          <View style={styles.shareUrlBlock}>
            <Text style={styles.shareUrlLabel}>Share this trip</Text>
            <Text style={styles.shareUrlText}>{shareUrl}</Text>
          </View>
        ) : null}

        {/* Weather forecast */}
        <WeatherSection weather={currentWeather} forecast={forecast} />

        {/* Day-by-day itinerary */}
        <SectionHeader title="Itinerary" />
        {itinerary.days.map((day) => (
          <DayBlock key={day.day} day={day} startDate={startDate} />
        ))}

        {/* Hotel summary */}
        <SectionHeader title="Accommodation" />
        <View style={styles.tableBlock}>
          {itinerary.days.map((day) => (
            <View key={day.day} style={styles.tableRow}>
              <Text style={styles.tableCell}>Night {day.day}</Text>
              <Text style={[styles.tableCell, styles.tableCellMain]}>{day.accommodation.name}</Text>
              <Text style={styles.tableCell}>{day.accommodation.pricePerNight}/night</Text>
            </View>
          ))}
        </View>

        {/* Budget breakdown */}
        <SectionHeader title="Budget Breakdown" />
        <View style={styles.budgetBlock}>
          <View style={styles.budgetRow}>
            <Text style={styles.budgetLabel}>Accommodation</Text>
            <Text style={styles.budgetValue}>{itinerary.budgetBreakdown.accommodation}</Text>
          </View>
          <View style={styles.budgetRow}>
            <Text style={styles.budgetLabel}>Food</Text>
            <Text style={styles.budgetValue}>{itinerary.budgetBreakdown.food}</Text>
          </View>
          <View style={styles.budgetRow}>
            <Text style={styles.budgetLabel}>Activities</Text>
            <Text style={styles.budgetValue}>{itinerary.budgetBreakdown.activities}</Text>
          </View>
          <View style={styles.budgetRow}>
            <Text style={styles.budgetLabel}>Transportation</Text>
            <Text style={styles.budgetValue}>{itinerary.budgetBreakdown.transportation}</Text>
          </View>
          <View style={styles.budgetRow}>
            <Text style={styles.budgetLabel}>Miscellaneous</Text>
            <Text style={styles.budgetValue}>{itinerary.budgetBreakdown.miscellaneous}</Text>
          </View>
          <View style={[styles.budgetRow, styles.budgetTotal]}>
            <Text style={styles.budgetTotalLabel}>Total</Text>
            <Text style={styles.budgetTotalValue}>{itinerary.totalBudget}</Text>
          </View>
        </View>

        {/* Currency exchange rates */}
        <CurrencySection rates={exchangeRates} destinationCurrency={destinationCurrency} />

        {/* Packing checklist (smart) */}
        <PackingSection packingList={packingList} />

        {/* Packing essentials from itinerary (fallback) */}
        {(!packingList || packingList.items.length === 0) && itinerary.packingEssentials.length > 0 ? (
          <>
            <SectionHeader title="Packing Essentials" />
            <View style={styles.packingGrid}>
              {itinerary.packingEssentials.map((item, idx) => (
                <View key={idx} style={styles.packingItem}>
                  <View style={styles.packingCheckbox} />
                  <Text style={styles.packingText}>{item}</Text>
                </View>
              ))}
            </View>
          </>
        ) : null}

        {/* Emergency numbers */}
        <SectionHeader title="Emergency Numbers" />
        <View style={styles.emergencyBlock}>
          {emergencyNumbers ? (
            <>
              {emergencyNumbers.police.length > 0 && (
                <View style={styles.emergencyRow}>
                  <Text style={styles.emergencyLabel}>Police</Text>
                  <Text style={styles.emergencyNumber}>{emergencyNumbers.police[0]}</Text>
                </View>
              )}
              {emergencyNumbers.ambulance.length > 0 && (
                <View style={styles.emergencyRow}>
                  <Text style={styles.emergencyLabel}>Ambulance</Text>
                  <Text style={styles.emergencyNumber}>{emergencyNumbers.ambulance[0]}</Text>
                </View>
              )}
              {emergencyNumbers.fire.length > 0 && (
                <View style={styles.emergencyRow}>
                  <Text style={styles.emergencyLabel}>Fire</Text>
                  <Text style={styles.emergencyNumber}>{emergencyNumbers.fire[0]}</Text>
                </View>
              )}
              {emergencyNumbers.isMember112 && (
                <View style={styles.emergencyRow}>
                  <Text style={styles.emergencyLabel}>EU Emergency</Text>
                  <Text style={styles.emergencyNumber}>112</Text>
                </View>
              )}
              {emergencyNumbers.dispatch.length > 0 && (
                <View style={styles.emergencyRow}>
                  <Text style={styles.emergencyLabel}>General Dispatch</Text>
                  <Text style={styles.emergencyNumber}>{emergencyNumbers.dispatch[0]}</Text>
                </View>
              )}
            </>
          ) : (
            <Text style={styles.fallbackText}>
              Dial 911 (US/Canada) · 999 (UK) · 112 (EU) · 000 (Australia)
            </Text>
          )}
        </View>

        {/* Visa requirements */}
        <SectionHeader title="Visa Requirements" />
        <View style={styles.visaBlock}>
          {visaInfo ? (
            <>
              <View style={styles.visaStatusRow}>
                <Text style={styles.visaStatusBadge}>
                  {VISA_STATUS_LABELS[visaInfo.status] ?? visaInfo.status}
                </Text>
                <Text style={styles.visaMaxStay}>Max stay: {visaInfo.maxStay} days</Text>
              </View>
              <Text style={styles.visaNotes}>{visaInfo.notes}</Text>
              {visaInfo.officialLink ? (
                <Text style={styles.visaLink}>{visaInfo.officialLink}</Text>
              ) : null}
            </>
          ) : (
            <Text style={styles.fallbackText}>
              Check the official embassy website for the most up-to-date visa requirements for your passport.
            </Text>
          )}
        </View>

        {/* Survival phrases */}
        {phrases.length > 0 && (
          <>
            <SectionHeader title="Useful Phrases" />
            <View style={styles.phrasesGrid}>
              {phrases.map((phrase) => (
                <View key={phrase.id} style={styles.phraseCard}>
                  <Text style={styles.phraseOriginal}>{phrase.original}</Text>
                  <Text style={styles.phraseTranslation}>{phrase.translation}</Text>
                  <Text style={styles.phrasePhonetic}>{phrase.phonetic}</Text>
                </View>
              ))}
            </View>
          </>
        )}

        {/* Pro tip */}
        {itinerary.proTip ? (
          <>
            <SectionHeader title="Pro Tip" />
            <View style={styles.proTipBlock}>
              <Text style={styles.proTipText}>{itinerary.proTip}</Text>
            </View>
          </>
        ) : null}

        {/* Footer */}
        <View style={styles.footer}>
          <Text style={styles.footerText}>Generated by ROAM · roamapp.app</Text>
          {shareUrl ? (
            <Text style={styles.footerUrl}>{shareUrl}</Text>
          ) : null}
        </View>
      </View>
    </ScrollView>
  );
}

// ---------------------------------------------------------------------------
// Styles — white background, print-optimised
// ---------------------------------------------------------------------------

const BASE = {
  black: '#000000',
  ink: '#1a1a1a',
  inkMuted: '#444444',
  inkLight: '#666666',
  border: '#cccccc',
  borderLight: '#e5e5e5',
  bg: '#ffffff',
  surface: '#f7f7f5',
  accent: '#1a1a1a',
};

const styles = StyleSheet.create({
  // Page
  page: {
    flex: 1,
    backgroundColor: BASE.bg,
  },
  pageContent: {
    paddingBottom: 60,
  },

  // Toolbar (screen-only)
  toolbar: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingHorizontal: 20,
    paddingVertical: 12,
    borderBottomWidth: 1,
    borderBottomColor: BASE.borderLight,
    backgroundColor: BASE.bg,
  },
  toolbarBtn: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
  },
  toolbarBtnText: {
    fontSize: 15,
    color: BASE.ink,
    fontFamily: 'System',
  },
  toolbarActions: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 10,
  },
  shareBtn: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
    borderWidth: 1.5,
    borderColor: BASE.border,
    paddingHorizontal: 14,
    paddingVertical: 8,
    borderRadius: 8,
  },
  shareBtnText: {
    fontSize: 13,
    fontWeight: '600',
    color: BASE.ink,
    fontFamily: 'System',
  },
  printBtn: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
    backgroundColor: BASE.ink,
    paddingHorizontal: 16,
    paddingVertical: 9,
    borderRadius: 8,
  },
  printBtnText: {
    fontSize: 14,
    fontWeight: '600',
    color: '#ffffff',
    fontFamily: 'System',
  },
  proLockedBtn: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
    borderWidth: 1.5,
    borderColor: COLORS.goldBorder,
    paddingHorizontal: 14,
    paddingVertical: 8,
    borderRadius: 8,
    backgroundColor: COLORS.goldFaint,
  },
  proLockedBtnText: {
    fontSize: 13,
    fontWeight: '600',
    color: COLORS.gold,
    fontFamily: 'System',
  },

  // Paywall nudge
  paywallBanner: {
    paddingHorizontal: 28,
    paddingTop: 16,
  },
  paywallNudge: {
    alignItems: 'center',
    paddingVertical: 20,
    paddingHorizontal: 24,
    backgroundColor: '#FFFBF0',
    borderWidth: 1,
    borderColor: '#E8D48B',
    borderRadius: 10,
    gap: 8,
  },
  paywallTitle: {
    fontSize: 16,
    fontWeight: '700',
    color: BASE.ink,
    fontFamily: 'System',
  },
  paywallDescription: {
    fontSize: 14,
    color: BASE.inkMuted,
    fontFamily: 'System',
    textAlign: 'center',
  },
  paywallButton: {
    marginTop: 4,
    backgroundColor: COLORS.gold,
    paddingHorizontal: 24,
    paddingVertical: 10,
    borderRadius: RADIUS.pill,
  },
  paywallButtonText: {
    fontSize: 14,
    fontWeight: '700',
    color: '#ffffff',
    fontFamily: 'System',
  },

  // Print body
  printBody: {
    paddingHorizontal: 28,
    paddingTop: 32,
  },

  // Header
  headerBlock: {
    marginBottom: 28,
    paddingBottom: 24,
    borderBottomWidth: 2,
    borderBottomColor: BASE.black,
  },
  destination: {
    fontSize: 40,
    fontWeight: '700',
    color: BASE.black,
    letterSpacing: -0.5,
    fontFamily: 'System',
    marginBottom: 4,
  },
  tagline: {
    fontSize: 17,
    color: BASE.inkMuted,
    fontFamily: 'System',
    marginBottom: 10,
  },
  meta: {
    fontSize: 13,
    color: BASE.inkLight,
    fontFamily: 'System',
    letterSpacing: 0.2,
  },

  // Share URL block
  shareUrlBlock: {
    marginBottom: 20,
    paddingVertical: 12,
    paddingHorizontal: 16,
    backgroundColor: BASE.surface,
    borderWidth: 1,
    borderColor: BASE.borderLight,
    borderRadius: 6,
  },
  shareUrlLabel: {
    fontSize: 10,
    fontWeight: '700',
    color: BASE.inkMuted,
    textTransform: 'uppercase',
    letterSpacing: 1,
    fontFamily: 'System',
    marginBottom: 4,
  },
  shareUrlText: {
    fontSize: 13,
    color: BASE.ink,
    fontFamily: 'System',
    textDecorationLine: 'underline',
  },

  // Section headers
  sectionHeader: {
    fontSize: 11,
    fontWeight: '700',
    color: BASE.inkMuted,
    letterSpacing: 1.5,
    textTransform: 'uppercase',
    fontFamily: 'System',
    marginTop: 28,
    marginBottom: 12,
    borderBottomWidth: 1,
    borderBottomColor: BASE.border,
    paddingBottom: 6,
  },

  // Day blocks
  dayBlock: {
    marginBottom: 20,
    borderWidth: 1,
    borderColor: BASE.borderLight,
    borderRadius: 6,
    overflow: 'hidden',
  },
  dayHeader: {
    flexDirection: 'row',
    alignItems: 'baseline',
    gap: 10,
    backgroundColor: BASE.surface,
    paddingHorizontal: 14,
    paddingVertical: 10,
    borderBottomWidth: 1,
    borderBottomColor: BASE.borderLight,
  },
  dayNumber: {
    fontSize: 14,
    fontWeight: '700',
    color: BASE.black,
    fontFamily: 'System',
  },
  dayDate: {
    fontSize: 12,
    color: BASE.inkLight,
    fontFamily: 'System',
  },
  dayTheme: {
    fontSize: 13,
    color: BASE.inkMuted,
    fontFamily: 'System',
    flex: 1,
  },

  // Time slots
  slotRow: {
    flexDirection: 'row',
    paddingHorizontal: 14,
    paddingVertical: 10,
  },
  slotLabelCol: {
    width: 80,
    paddingRight: 12,
  },
  slotLabel: {
    fontSize: 11,
    fontWeight: '700',
    color: BASE.inkMuted,
    textTransform: 'uppercase',
    letterSpacing: 0.8,
    fontFamily: 'System',
  },
  slotTime: {
    fontSize: 10,
    color: BASE.inkLight,
    fontFamily: 'System',
    marginTop: 2,
  },
  slotContent: {
    flex: 1,
  },
  slotActivity: {
    fontSize: 14,
    fontWeight: '600',
    color: BASE.ink,
    fontFamily: 'System',
    marginBottom: 2,
  },
  slotMeta: {
    fontSize: 12,
    color: BASE.inkMuted,
    fontFamily: 'System',
    marginBottom: 3,
  },
  slotTip: {
    fontSize: 11,
    color: BASE.inkLight,
    fontFamily: 'System',
    fontStyle: 'italic',
  },
  slotDivider: {
    height: 1,
    backgroundColor: BASE.borderLight,
    marginHorizontal: 14,
  },

  // Hotel row
  hotelRow: {
    backgroundColor: BASE.surface,
    paddingHorizontal: 14,
    paddingVertical: 8,
    borderTopWidth: 1,
    borderTopColor: BASE.borderLight,
  },
  hotelLabel: {
    fontSize: 10,
    fontWeight: '700',
    color: BASE.inkMuted,
    textTransform: 'uppercase',
    letterSpacing: 0.8,
    fontFamily: 'System',
    marginBottom: 2,
  },
  hotelName: {
    fontSize: 13,
    fontWeight: '600',
    color: BASE.ink,
    fontFamily: 'System',
  },
  hotelMeta: {
    fontSize: 11,
    color: BASE.inkLight,
    fontFamily: 'System',
    marginTop: 2,
  },

  // Accommodation table
  tableBlock: {
    borderWidth: 1,
    borderColor: BASE.border,
    borderRadius: 6,
    overflow: 'hidden',
  },
  tableRow: {
    flexDirection: 'row',
    paddingHorizontal: 14,
    paddingVertical: 8,
    borderBottomWidth: 1,
    borderBottomColor: BASE.borderLight,
  },
  tableCell: {
    fontSize: 13,
    color: BASE.inkMuted,
    fontFamily: 'System',
    width: 80,
  },
  tableCellMain: {
    flex: 1,
    color: BASE.ink,
    fontWeight: '500',
  },

  // Budget breakdown
  budgetBlock: {
    borderWidth: 1,
    borderColor: BASE.border,
    borderRadius: 6,
    overflow: 'hidden',
  },
  budgetRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingHorizontal: 14,
    paddingVertical: 8,
    borderBottomWidth: 1,
    borderBottomColor: BASE.borderLight,
  },
  budgetLabel: {
    fontSize: 13,
    color: BASE.inkMuted,
    fontFamily: 'System',
  },
  budgetValue: {
    fontSize: 13,
    fontWeight: '500',
    color: BASE.ink,
    fontFamily: 'System',
  },
  budgetTotal: {
    backgroundColor: BASE.surface,
    borderBottomWidth: 0,
  },
  budgetTotalLabel: {
    fontSize: 13,
    fontWeight: '700',
    color: BASE.black,
    fontFamily: 'System',
  },
  budgetTotalValue: {
    fontSize: 14,
    fontWeight: '700',
    color: BASE.black,
    fontFamily: 'System',
  },

  // Weather
  weatherCurrentBlock: {
    borderWidth: 1,
    borderColor: BASE.border,
    borderRadius: 6,
    padding: 14,
    marginBottom: 10,
  },
  weatherCurrentRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
    marginBottom: 4,
  },
  weatherTemp: {
    fontSize: 20,
    fontWeight: '700',
    color: BASE.black,
    fontFamily: 'System',
  },
  weatherCondition: {
    fontSize: 14,
    color: BASE.inkMuted,
    fontFamily: 'System',
  },
  weatherDetail: {
    fontSize: 12,
    color: BASE.inkLight,
    fontFamily: 'System',
  },
  forecastGrid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 8,
  },
  forecastDay: {
    width: '13%',
    minWidth: 70,
    borderWidth: 1,
    borderColor: BASE.borderLight,
    borderRadius: 6,
    padding: 8,
    alignItems: 'center',
  },
  forecastDate: {
    fontSize: 11,
    fontWeight: '600',
    color: BASE.ink,
    fontFamily: 'System',
    marginBottom: 4,
  },
  forecastTemp: {
    fontSize: 12,
    fontWeight: '500',
    color: BASE.black,
    fontFamily: 'System',
    marginBottom: 2,
  },
  forecastCondition: {
    fontSize: 10,
    color: BASE.inkLight,
    fontFamily: 'System',
    textAlign: 'center',
  },
  forecastRainRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 3,
    marginTop: 3,
  },
  forecastRain: {
    fontSize: 10,
    color: BASE.inkLight,
    fontFamily: 'System',
  },

  // Currency
  currencyBlock: {
    borderWidth: 1,
    borderColor: BASE.border,
    borderRadius: 6,
    padding: 14,
  },
  currencyBase: {
    fontSize: 14,
    fontWeight: '700',
    color: BASE.black,
    fontFamily: 'System',
    marginBottom: 10,
  },
  currencyGrid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 8,
  },
  currencyRow: {
    width: '30%',
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingVertical: 6,
    paddingHorizontal: 10,
    backgroundColor: BASE.surface,
    borderRadius: 4,
  },
  currencyCode: {
    fontSize: 12,
    fontWeight: '700',
    color: BASE.ink,
    fontFamily: 'System',
  },
  currencyRate: {
    fontSize: 13,
    color: BASE.black,
    fontFamily: 'System',
  },
  currencyDate: {
    fontSize: 10,
    color: BASE.inkLight,
    fontFamily: 'System',
    marginTop: 10,
  },

  // Emergency numbers
  emergencyBlock: {
    borderWidth: 1,
    borderColor: BASE.border,
    borderRadius: 6,
    overflow: 'hidden',
  },
  emergencyRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingHorizontal: 14,
    paddingVertical: 10,
    borderBottomWidth: 1,
    borderBottomColor: BASE.borderLight,
  },
  emergencyLabel: {
    fontSize: 13,
    color: BASE.inkMuted,
    fontFamily: 'System',
  },
  emergencyNumber: {
    fontSize: 20,
    fontWeight: '700',
    color: BASE.black,
    fontFamily: 'System',
    letterSpacing: 1,
  },

  // Visa
  visaBlock: {
    borderWidth: 1,
    borderColor: BASE.border,
    borderRadius: 6,
    padding: 14,
  },
  visaStatusRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 12,
    marginBottom: 8,
  },
  visaStatusBadge: {
    fontSize: 13,
    fontWeight: '700',
    color: BASE.black,
    fontFamily: 'System',
    borderWidth: 1.5,
    borderColor: BASE.black,
    paddingHorizontal: 8,
    paddingVertical: 3,
    borderRadius: 4,
  },
  visaMaxStay: {
    fontSize: 13,
    color: BASE.inkMuted,
    fontFamily: 'System',
  },
  visaNotes: {
    fontSize: 13,
    color: BASE.ink,
    fontFamily: 'System',
    lineHeight: 19,
  },
  visaLink: {
    fontSize: 11,
    color: BASE.inkLight,
    fontFamily: 'System',
    marginTop: 6,
    textDecorationLine: 'underline',
  },

  // Phrases
  phrasesGrid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 10,
  },
  phraseCard: {
    width: '31%',
    borderWidth: 1,
    borderColor: BASE.border,
    borderRadius: 6,
    padding: 10,
    backgroundColor: BASE.surface,
  },
  phraseOriginal: {
    fontSize: 11,
    color: BASE.inkLight,
    fontFamily: 'System',
    marginBottom: 2,
  },
  phraseTranslation: {
    fontSize: 14,
    fontWeight: '700',
    color: BASE.black,
    fontFamily: 'System',
    marginBottom: 3,
  },
  phrasePhonetic: {
    fontSize: 11,
    color: BASE.inkMuted,
    fontFamily: 'System',
    fontStyle: 'italic',
  },

  // Pro tip
  proTipBlock: {
    borderLeftWidth: 3,
    borderLeftColor: BASE.black,
    paddingLeft: 14,
    paddingVertical: 4,
  },
  proTipText: {
    fontSize: 14,
    color: BASE.ink,
    fontFamily: 'System',
    lineHeight: 20,
  },

  // Packing
  packingCategory: {
    marginBottom: 14,
  },
  packingCategoryLabel: {
    fontSize: 12,
    fontWeight: '700',
    color: BASE.inkMuted,
    fontFamily: 'System',
    marginBottom: 6,
    textTransform: 'uppercase',
    letterSpacing: 0.6,
  },
  packingGrid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 6,
  },
  packingItem: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
    width: '47%',
    paddingVertical: 4,
  },
  packingCheckbox: {
    width: 14,
    height: 14,
    borderWidth: 1.5,
    borderColor: BASE.border,
    borderRadius: 2,
    flexShrink: 0,
  },
  packingText: {
    fontSize: 13,
    color: BASE.ink,
    fontFamily: 'System',
  },
  packingEssential: {
    fontWeight: '600',
  },
  packingTips: {
    marginTop: 10,
    paddingTop: 10,
    borderTopWidth: 1,
    borderTopColor: BASE.borderLight,
  },
  packingTipText: {
    fontSize: 12,
    color: BASE.inkMuted,
    fontFamily: 'System',
    lineHeight: 18,
    marginBottom: 4,
  },

  // Footer
  footer: {
    marginTop: 40,
    paddingTop: 16,
    borderTopWidth: 1,
    borderTopColor: BASE.border,
    alignItems: 'center',
  },
  footerText: {
    fontSize: 11,
    color: BASE.inkLight,
    fontFamily: 'System',
    letterSpacing: 0.3,
  },
  footerUrl: {
    fontSize: 10,
    color: BASE.inkLight,
    fontFamily: 'System',
    marginTop: 4,
  },

  // Fallback / loading / error
  fallbackText: {
    fontSize: 13,
    color: BASE.inkMuted,
    fontFamily: 'System',
    lineHeight: 19,
    paddingVertical: 4,
  },
  loadingContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    backgroundColor: BASE.bg,
  },
  loadingText: {
    fontSize: 15,
    color: BASE.inkMuted,
    fontFamily: 'System',
  },
  errorContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    backgroundColor: BASE.bg,
    padding: 32,
  },
  errorText: {
    fontSize: 16,
    color: BASE.ink,
    fontFamily: 'System',
    textAlign: 'center',
    marginBottom: 20,
  },
  backBtn: {
    paddingHorizontal: 20,
    paddingVertical: 10,
    borderWidth: 1.5,
    borderColor: BASE.border,
    borderRadius: 8,
  },
  backBtnText: {
    fontSize: 14,
    color: BASE.ink,
    fontFamily: 'System',
  },
});
