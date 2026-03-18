// =============================================================================
// ROAM — Printable Trip Summary
// Accessed via router.push('/print-trip?tripId=xxx')
// White-background, print-optimised layout. No dark mode.
// =============================================================================
import React, { useCallback, useEffect, useMemo, useState } from 'react';
import {
  Platform,
  Pressable,
  ScrollView,
  StyleSheet,
  Text,
  View,
} from 'react-native';
import { useLocalSearchParams, useRouter } from 'expo-router';
import { Printer, ArrowLeft, MapPin, Sun, Sunset, Moon, Building2, ShieldAlert, Globe, MessageCircle } from 'lucide-react-native';

import { useAppStore } from '../lib/store';
import { parseItinerary, type Itinerary, type ItineraryDay, type TimeSlotActivity } from '../lib/types/itinerary';
import { getEmergencyNumbers, type EmergencyNumbers } from '../lib/emergency-numbers';
import { getSimpleVisaInfo as getVisaInfo, type SimpleVisaInfo as VisaInfo, destinationToCountryCode } from '../lib/visa-intel';
import { getPhrasesForDestination, type SurvivalPhrase } from '../lib/survival-phrases';

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

const VISA_STATUS_LABELS: Record<string, string> = {
  'visa-free': 'Visa-Free',
  'visa-on-arrival': 'Visa on Arrival',
  'e-visa': 'E-Visa Required',
  'required': 'Visa Required',
};

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
    <View style={styles.dayBlock}>
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

// ---------------------------------------------------------------------------
// Main screen
// ---------------------------------------------------------------------------

export default function PrintTripScreen() {
  const router = useRouter();
  const { tripId } = useLocalSearchParams<{ tripId?: string }>();
  const trips = useAppStore((s) => s.trips);

  const [printData, setPrintData] = useState<PrintData | null>(null);
  const [error, setError] = useState<string | null>(null);

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

    // Emergency numbers — async
    const loadEmergency = async () => {
      let emergencyNumbers: EmergencyNumbers | null = null;
      if (countryCode) {
        try {
          emergencyNumbers = await getEmergencyNumbers(countryCode);
        } catch {
          emergencyNumbers = null;
        }
      }
      setPrintData({
        itinerary,
        emergencyNumbers,
        visaInfo,
        phrases: topPhrases,
        startDate: trip.startDate,
        days: trip.days,
      });
    };

    loadEmergency();
  }, [tripId, trips]);

  // ---------------------------------------------------------------------------
  // Print handler (web only)
  // ---------------------------------------------------------------------------
  const handlePrint = useCallback(() => {
    if (Platform.OS === 'web' && typeof window !== 'undefined') {
      window.print();
    }
  }, []);

  const handleBack = useCallback(() => {
    router.back();
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
        <Text style={styles.loadingText}>Preparing print pack…</Text>
      </View>
    );
  }

  const { itinerary, emergencyNumbers, visaInfo, phrases, startDate, days } = printData;
  const dateRange = formatDateRange(startDate, days);

  return (
    <ScrollView style={styles.page} contentContainerStyle={styles.pageContent}>
      {/* ── Toolbar (screen-only, hidden on print) ── */}
      <View style={styles.toolbar}>
        <Pressable
          onPress={handleBack}
          hitSlop={8}
          style={({ pressed }) => [styles.toolbarBtn, { opacity: pressed ? 0.6 : 1 }]}
          accessibilityLabel="Back"
        >
          <ArrowLeft size={20} color="#1a1a1a" strokeWidth={1.5} />
          <Text style={styles.toolbarBtnText}>Back</Text>
        </Pressable>

        {Platform.OS === 'web' && (
          <Pressable
            onPress={handlePrint}
            hitSlop={8}
            style={({ pressed }) => [styles.printBtn, { opacity: pressed ? 0.85 : 1 }]}
            accessibilityLabel="Print trip pack"
          >
            <Printer size={18} color="#ffffff" strokeWidth={1.5} />
            <Text style={styles.printBtnText}>Print / Save PDF</Text>
          </Pressable>
        )}
      </View>

      {/* ── Print body ── */}
      <View style={styles.printBody}>
        {/* Header */}
        <View style={styles.headerBlock}>
          <Text style={styles.destination}>{itinerary.destination}</Text>
          <Text style={styles.tagline}>{itinerary.tagline}</Text>
          <Text style={styles.meta}>{dateRange}  ·  {days} {days === 1 ? 'day' : 'days'}  ·  {itinerary.totalBudget}</Text>
        </View>

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

        {/* Packing essentials */}
        {itinerary.packingEssentials.length > 0 && (
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
        )}

        {/* Footer */}
        <View style={styles.footer}>
          <Text style={styles.footerText}>Generated by ROAM · roamapp.app</Text>
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
