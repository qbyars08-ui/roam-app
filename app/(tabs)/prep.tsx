// =============================================================================
// ROAM — PREP Tab
// Complete offline travel companion — language kit, emergency, cultural guide,
// packing list, and offline download manager
// =============================================================================
import React, { useCallback, useEffect, useMemo, useState } from 'react';
import {
  View,
  Text,
  ScrollView,
  Pressable,
  StyleSheet,
  Share,
  type ViewStyle,
  type TextStyle,
} from 'react-native';
import { useRouter } from 'expo-router';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { LinearGradient } from 'expo-linear-gradient';
import * as Haptics from '../../lib/haptics';
import {
  ChevronDown,
  ChevronRight,
  Phone,
  Globe,
  BookOpen,
  Luggage,
  MapPin,
  Building2,
  AlertCircle,
} from 'lucide-react-native';

import { COLORS, FONTS, SPACING, RADIUS, DESTINATIONS } from '../../lib/constants';
import { withComingSoon } from '../../lib/with-coming-soon';
import { useAppStore, type Trip } from '../../lib/store';
import {
  LANGUAGE_PACKS,
  getLanguagePackForDestination,
  PHRASE_CATEGORIES,
  type LanguagePack,
  type Phrase,
} from '../../lib/prep/language-data';
import {
  getEmergencyForDestination,
  type EmergencyData,
} from '../../lib/prep/emergency-data';
import {
  getCulturalGuideForDestination,
  type CulturalGuide,
} from '../../lib/prep/cultural-data';
import Button from '../../components/ui/Button';

// ---------------------------------------------------------------------------
// Collapsible section
// ---------------------------------------------------------------------------
function Section({
  icon,
  iconColor,
  title,
  subtitle,
  children,
  defaultOpen = false,
}: {
  icon: React.ReactNode;
  iconColor?: string;
  title: string;
  subtitle?: string;
  children: React.ReactNode;
  defaultOpen?: boolean;
}) {
  const [open, setOpen] = useState(defaultOpen);
  return (
    <View style={styles.section}>
      <Pressable
        onPress={() => {
          Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
          setOpen(!open);
        }}
        style={({ pressed }) => [
          styles.sectionHeader,
          { opacity: pressed ? 0.85 : 1 },
        ]}
      >
        <View style={[styles.sectionIconWrap, iconColor ? { backgroundColor: iconColor + '20' } : undefined]}>
          {icon}
        </View>
        <View style={styles.sectionTitleWrap}>
          <Text style={styles.sectionTitle}>{title}</Text>
          {subtitle ? <Text style={styles.sectionSubtitle}>{subtitle}</Text> : null}
        </View>
        {open ? (
          <ChevronDown size={18} color={COLORS.creamMuted} />
        ) : (
          <ChevronRight size={18} color={COLORS.creamMuted} />
        )}
      </Pressable>
      {open && <View style={styles.sectionBody}>{children}</View>}
    </View>
  );
}

// ---------------------------------------------------------------------------
// Phrase row
// ---------------------------------------------------------------------------
function PhraseRow({ phrase }: { phrase: Phrase }) {
  return (
    <View style={styles.phraseRow}>
      <Text style={styles.phraseEnglish}>{phrase.english}</Text>
      <Text style={styles.phraseLocal}>{phrase.local}</Text>
      <Text style={styles.phrasePhonetic}>{phrase.phonetic}</Text>
    </View>
  );
}

// ---------------------------------------------------------------------------
// Language Kit Section
// ---------------------------------------------------------------------------
function LanguageKitContent({ pack }: { pack: LanguagePack }) {
  const [activeCategory, setActiveCategory] = useState<string>('all');

  const filtered = useMemo(() => {
    if (activeCategory === 'all') return pack.phrases;
    return pack.phrases.filter((p) => p.category === activeCategory);
  }, [pack.phrases, activeCategory]);

  const categories = useMemo(() => {
    const cats = new Set(pack.phrases.map((p) => p.category));
    return ['all', ...Array.from(cats)];
  }, [pack.phrases]);

  return (
    <View style={styles.langContent}>
      <View style={styles.langHeader}>
        <Text style={styles.langFlag}>{pack.flag}</Text>
        <Text style={styles.langName}>{pack.language}</Text>
        <Text style={styles.langCount}>{pack.phrases.length} phrases</Text>
      </View>

      {/* Category chips */}
      <ScrollView horizontal showsHorizontalScrollIndicator={false} style={styles.chipScroll}>
        {categories.map((cat) => {
          const isActive = activeCategory === cat;
          const info = cat === 'all' ? { label: 'All', emoji: '' } : PHRASE_CATEGORIES[cat];
          return (
            <Pressable
              key={cat}
              onPress={() => setActiveCategory(cat)}
              style={[styles.chip, isActive && styles.chipActive]}
            >
              <Text style={[styles.chipText, isActive && styles.chipTextActive]}>
                {info?.label ?? cat}
              </Text>
            </Pressable>
          );
        })}
      </ScrollView>

      {/* Phrases */}
      {filtered.map((phrase, i) => (
        <PhraseRow key={`${phrase.english}-${i}`} phrase={phrase} />
      ))}
    </View>
  );
}

// ---------------------------------------------------------------------------
// Emergency Section
// ---------------------------------------------------------------------------
function EmergencyContent({ data }: { data: EmergencyData }) {
  return (
    <View style={styles.emergencyContent}>
      {/* Emergency numbers */}
      <View style={styles.emergencyNumbers}>
        <View style={styles.emergencyNumberCard}>
          <Text style={styles.emergencyLabel}>POLICE</Text>
          <Text style={styles.emergencyNumber}>{data.police}</Text>
        </View>
        <View style={styles.emergencyNumberCard}>
          <Text style={styles.emergencyLabel}>AMBULANCE</Text>
          <Text style={styles.emergencyNumber}>{data.ambulance}</Text>
        </View>
        <View style={styles.emergencyNumberCard}>
          <Text style={styles.emergencyLabel}>FIRE</Text>
          <Text style={styles.emergencyNumber}>{data.fire}</Text>
        </View>
      </View>

      {/* US Embassy */}
      <View style={styles.infoCard}>
        <Text style={styles.infoCardLabel}>US EMBASSY — {data.usEmbassy.city.toUpperCase()}</Text>
        <Text style={styles.infoCardValue}>{data.usEmbassy.phone}</Text>
        <Text style={styles.infoCardMeta}>{data.usEmbassy.address}</Text>
      </View>

      {/* Hospitals */}
      <Text style={styles.subLabel}>HOSPITALS WITH ENGLISH-SPEAKING STAFF</Text>
      {data.hospitals.map((h, i) => (
        <View key={i} style={styles.hospitalRow}>
          <Text style={styles.hospitalName}>{h.name}</Text>
          <Text style={styles.hospitalArea}>{h.area} — {h.note}</Text>
        </View>
      ))}

      {/* Safety tips */}
      <Text style={styles.subLabel}>SAFETY TIPS</Text>
      {data.tips.map((tip, i) => (
        <View key={i} style={styles.tipRow}>
          <Text style={styles.tipBullet}>{'\u2022'}</Text>
          <Text style={styles.tipText}>{tip}</Text>
        </View>
      ))}
    </View>
  );
}

// ---------------------------------------------------------------------------
// Cultural Guide Section
// ---------------------------------------------------------------------------
function CulturalContent({ guide }: { guide: CulturalGuide }) {
  return (
    <View style={styles.culturalContent}>
      {/* Etiquette */}
      <Text style={styles.subLabel}>ETIQUETTE</Text>
      {guide.etiquette.map((item, i) => (
        <View key={i} style={styles.etiquetteRow}>
          <View style={styles.etiquetteDo}>
            <Text style={styles.etiquetteIcon}>{'\u2714'}</Text>
            <Text style={styles.etiquetteText}>{item.do}</Text>
          </View>
          <View style={styles.etiquetteDont}>
            <Text style={styles.etiquetteIcon}>{'\u2718'}</Text>
            <Text style={styles.etiquetteText}>{item.dont}</Text>
          </View>
        </View>
      ))}

      {/* Tipping */}
      <View style={styles.infoCard}>
        <Text style={styles.infoCardLabel}>TIPPING</Text>
        <Text style={styles.infoCardBody}>{guide.tipping}</Text>
      </View>

      {/* Currency & SIM */}
      <View style={styles.twoCol}>
        <View style={[styles.infoCard, { flex: 1 }]}>
          <Text style={styles.infoCardLabel}>CURRENCY</Text>
          <Text style={styles.infoCardValue}>{guide.currency.symbol} {guide.currency.code}</Text>
          <Text style={styles.infoCardMeta}>{guide.currency.tip}</Text>
        </View>
        <View style={[styles.infoCard, { flex: 1 }]}>
          <Text style={styles.infoCardLabel}>SIM CARD</Text>
          <Text style={styles.infoCardValue}>{guide.simCard.cost}</Text>
          <Text style={styles.infoCardMeta}>{guide.simCard.provider}</Text>
        </View>
      </View>

      {/* Scams */}
      <Text style={styles.subLabel}>COMMON SCAMS</Text>
      {guide.commonScams.map((scam, i) => (
        <View key={i} style={styles.tipRow}>
          <Text style={[styles.tipBullet, { color: COLORS.coral }]}>{'\u26A0'}</Text>
          <Text style={styles.tipText}>{scam}</Text>
        </View>
      ))}

      {/* Dress code */}
      <Text style={styles.subLabel}>DRESS CODE</Text>
      {guide.dressCodes.map((code, i) => (
        <View key={i} style={styles.tipRow}>
          <Text style={styles.tipBullet}>{'\u2022'}</Text>
          <Text style={styles.tipText}>{code}</Text>
        </View>
      ))}

      {/* Plug type & Water */}
      <View style={styles.twoCol}>
        <View style={[styles.infoCard, { flex: 1 }]}>
          <Text style={styles.infoCardLabel}>PLUG TYPE</Text>
          <Text style={styles.infoCardBody}>{guide.plugType}</Text>
        </View>
        <View style={[styles.infoCard, { flex: 1 }]}>
          <Text style={styles.infoCardLabel}>TAP WATER</Text>
          <Text style={styles.infoCardValue}>
            {guide.waterSafety === 'tap_safe' ? 'Safe' : guide.waterSafety === 'bottled_only' ? 'Bottled only' : 'Mostly safe'}
          </Text>
        </View>
      </View>
    </View>
  );
}

// ---------------------------------------------------------------------------
// Destination picker (for browsing without a trip)
// ---------------------------------------------------------------------------
function DestinationPicker({
  selected,
  onSelect,
}: {
  selected: string;
  onSelect: (dest: string) => void;
}) {
  const popular = useMemo(
    () => DESTINATIONS.sort((a, b) => b.trendScore - a.trendScore).slice(0, 12),
    []
  );

  return (
    <View style={styles.pickerWrap}>
      <Text style={styles.pickerLabel}>PICK A DESTINATION</Text>
      <ScrollView horizontal showsHorizontalScrollIndicator={false} style={styles.pickerScroll}>
        {popular.map((dest) => {
          const isActive = selected === dest.label;
          return (
            <Pressable
              key={dest.label}
              onPress={() => onSelect(dest.label)}
              style={[styles.pickerChip, isActive && styles.pickerChipActive]}
            >
              <Text style={[styles.pickerText, isActive && styles.pickerTextActive]}>
                {dest.label}
              </Text>
            </Pressable>
          );
        })}
      </ScrollView>
    </View>
  );
}

// ---------------------------------------------------------------------------
// Main screen
// ---------------------------------------------------------------------------
function PrepScreen() {
  const router = useRouter();
  const insets = useSafeAreaInsets();
  const trips = useAppStore((s) => s.trips);
  const activeTripId = useAppStore((s) => s.activeTripId);
  const passportNationality = useAppStore((s) => s.travelProfile.passportNationality);

  const activeTrip: Trip | null =
    trips.find((t) => t.id === activeTripId) ?? trips[0] ?? null;

  const [selectedDest, setSelectedDest] = useState(
    activeTrip?.destination ?? 'Tokyo'
  );

  // When active trip changes, update selected destination
  useEffect(() => {
    if (activeTrip) setSelectedDest(activeTrip.destination);
  }, [activeTrip?.destination]);

  const langPack = getLanguagePackForDestination(selectedDest);
  const emergency = getEmergencyForDestination(selectedDest);
  const cultural = getCulturalGuideForDestination(selectedDest);

  const handleShareItinerary = useCallback(async () => {
    if (!activeTrip) return;
    Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
    try {
      await Share.share({
        message: `My ${activeTrip.destination} trip \u2014 ${activeTrip.days} days. Planned with ROAM.`,
        title: 'My ROAM trip',
      });
    } catch {}
  }, [activeTrip]);

  return (
    <ScrollView
      style={[styles.container, { paddingTop: insets.top }]}
      contentContainerStyle={styles.scrollContent}
      showsVerticalScrollIndicator={false}
    >
      {/* Header */}
      <View style={styles.header}>
        <Text style={styles.title}>Local intel before you land</Text>
        <Text style={styles.subtitle}>
          Language, safety, culture, packing. Everything you need, all in one place. Works offline.
        </Text>
      </View>

      {/* Passport warning — shown when user hasn't set their passport country */}
      {passportNationality === null && (
        <Pressable
          onPress={() => router.push('/travel-profile')}
          style={styles.passportWarning}
          accessibilityRole="button"
          accessibilityLabel="Set your passport country"
        >
          <AlertCircle size={16} color={COLORS.gold} strokeWidth={2} style={{ flexShrink: 0 }} />
          <Text style={styles.passportWarningText}>
            Set your passport country for accurate visa & entry info
          </Text>
          <ChevronRight size={14} color={COLORS.gold} strokeWidth={2} style={{ flexShrink: 0 }} />
        </Pressable>
      )}

      {/* Trip card (if active) */}
      {activeTrip && (
        <LinearGradient
          colors={[COLORS.sage + '15', COLORS.sage + '05']}
          style={styles.tripCard}
        >
          <View style={styles.tripCardInner}>
            <View>
              <Text style={styles.tripLabel}>ACTIVE TRIP</Text>
              <Text style={styles.tripDestination}>{activeTrip.destination}</Text>
              <Text style={styles.tripMeta}>{activeTrip.days} days</Text>
            </View>
            <Pressable
              onPress={handleShareItinerary}
              style={({ pressed }) => [
                styles.shareBtn,
                { opacity: pressed ? 0.7 : 1 },
              ]}
            >
              <Text style={styles.shareBtnText}>Share</Text>
            </Pressable>
          </View>
        </LinearGradient>
      )}

      {/* Destination picker */}
      <DestinationPicker selected={selectedDest} onSelect={setSelectedDest} />

      {/* Airport Survival Guide */}
      <Section
        icon={<Building2 size={20} color={COLORS.cream} />}
        iconColor={COLORS.gold}
        title="Airport Survival Guide"
        subtitle="JFK, LAX, LHR, CDG, DXB, NRT, SIN, BKK, BCN, FCO"
      >
        <View style={styles.offlineMapContent}>
          <Text style={styles.offlineMapText}>
            Best food by terminal, hidden lounges without membership, fastest security lanes, sleep spots, work spots, SIM cards, and currency tips for every major hub.
          </Text>
          <Button
            label="Browse airports"
            variant="sage"
            onPress={() => {
              Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
              router.push('/airport-guide');
            }}
          />
        </View>
      </Section>

      {/* Language Kit */}
      {langPack ? (
        <Section
          icon={<Globe size={20} color={COLORS.sage} />}
          iconColor={COLORS.sage}
          title="Language Kit"
          subtitle={`${langPack.flag} ${langPack.language} \u2022 ${langPack.phrases.length} phrases`}
          defaultOpen
        >
          <View>
            <LanguageKitContent pack={langPack} />
            <Button
              label="Language Survival — 50 phrases, tap to hear"
              variant="outline"
              onPress={() => {
                Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
                router.push({ pathname: '/language-survival', params: { destination: selectedDest } });
              }}
              style={{ marginTop: SPACING.md }}
            />
          </View>
        </Section>
      ) : (
        <Section
          icon={<Globe size={20} color={COLORS.creamMuted} />}
          title="Language Kit"
          subtitle="English widely spoken"
        >
          <View style={styles.emptySection}>
            <Text style={styles.emptySectionText}>
              English gets you far in {selectedDest}. A few local phrases never hurt though — people notice.
            </Text>
          </View>
        </Section>
      )}

      {/* Emergency Toolkit */}
      {emergency ? (
        <Section
          icon={<Phone size={20} color={COLORS.coral} />}
          iconColor={COLORS.coral}
          title="Emergency Info"
          subtitle={`${emergency.flag} ${emergency.country}`}
        >
          <EmergencyContent data={emergency} />
        </Section>
      ) : (
        <Section
          icon={<Phone size={20} color={COLORS.creamMuted} />}
          title="Emergency Info"
          subtitle="Select a destination above"
        >
          <View style={styles.emptySection}>
            <Text style={styles.emptySectionText}>
              We're still gathering emergency info for {selectedDest}. In the meantime: 112 works as a universal emergency number in most countries.
            </Text>
          </View>
        </Section>
      )}

      {/* Cultural Guide */}
      {cultural ? (
        <Section
          icon={<BookOpen size={20} color={COLORS.gold} />}
          iconColor={COLORS.gold}
          title="Know Before You Go"
          subtitle={`${cultural.flag} Etiquette, tipping, scams`}
        >
          <CulturalContent guide={cultural} />
        </Section>
      ) : (
        <Section
          icon={<BookOpen size={20} color={COLORS.creamMuted} />}
          title="Know Before You Go"
          subtitle="Select a destination above"
        >
          <View style={styles.emptySection}>
            <Text style={styles.emptySectionText}>
              Cultural guide for {selectedDest} is in the works. Ask the Concierge in the meantime — it knows things.
            </Text>
          </View>
        </Section>
      )}

      {/* Offline Map — links to itinerary map view */}
      <Section
        icon={<MapPin size={20} color={COLORS.accentGreen} />}
        iconColor={COLORS.accentGreen}
        title="Offline Map"
        subtitle={activeTrip ? 'Your trip pins' : 'Plan a trip to unlock'}
      >
        {activeTrip ? (
          <View style={styles.offlineMapContent}>
            <Text style={styles.offlineMapText}>
              Your {activeTrip.destination} trip stops are pinned on the map. Open to see morning, afternoon, and evening activities with directions.
            </Text>
            <Button
              label="Open map"
              variant="sage"
              onPress={() => {
                Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
                router.push({ pathname: '/itinerary', params: { tripId: activeTrip.id, map: '1' } });
              }}
            />
            <Text style={styles.offlineMapTip}>
              Download Google Maps offline for {activeTrip.destination} before you fly.
            </Text>
          </View>
        ) : (
          <View style={styles.emptySection}>
            <Text style={styles.emptySectionTitle}>Plan a trip first</Text>
            <Text style={styles.emptySectionText}>
              Your saved spots will show up here once you build a trip. The map shows all your stops with walking routes.
            </Text>
            <Button
              label="Plan a trip"
              variant="sage"
              onPress={() => router.push('/(tabs)/plan')}
              style={styles.offlineMapCta}
            />
          </View>
        )}
      </Section>

      {/* Packing list */}
      <Section
        icon={<Luggage size={20} color={COLORS.cream} />}
        title="Smart Packing List"
        subtitle="AI-generated for your trip"
      >
        <View style={styles.packingContent}>
          {activeTrip ? (
            <>
              <Text style={styles.subLabel}>ESSENTIALS FOR {activeTrip.destination.toUpperCase()}</Text>
              {[
                'Passport (+ photocopy in separate bag)',
                'Travel insurance docs (screenshot policy number)',
                'Universal power adapter',
                'Portable charger (10,000+ mAh)',
                'Reef-safe sunscreen',
                'Prescription medications (in original packaging)',
                'Comfortable walking shoes',
                'Light rain jacket',
                'Reusable water bottle',
                'Copies of booking confirmations',
              ].map((item, i) => (
                <View key={i} style={styles.packingRow}>
                  <View style={styles.packingCheckbox} />
                  <Text style={styles.packingText}>{item}</Text>
                </View>
              ))}
            </>
          ) : (
            <View style={styles.emptySection}>
              <Text style={styles.emptySectionText}>
                Plan a trip first — we'll build a custom packing list based on where you're going.
              </Text>
              <Button
                label="Plan a trip"
                variant="sage"
                onPress={() => router.push('/(tabs)/plan')}
              />
            </View>
          )}
        </View>
      </Section>

      {/* Browse all languages CTA */}
      <View style={styles.allLangsCta}>
        <Text style={styles.allLangsTitle}>{LANGUAGE_PACKS.length} Language Packs Available</Text>
        <Text style={styles.allLangsSubtitle}>
          {LANGUAGE_PACKS.map((p) => `${p.flag} ${p.language}`).join('  \u2022  ')}
        </Text>
      </View>

      <View style={{ height: insets.bottom + SPACING.xxxl }} />
    </ScrollView>
  );
}

// ---------------------------------------------------------------------------
// Styles
// ---------------------------------------------------------------------------
const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: COLORS.bg,
  } as ViewStyle,
  scrollContent: {
    paddingBottom: SPACING.xl,
  } as ViewStyle,

  // Header
  header: {
    paddingHorizontal: SPACING.lg,
    marginBottom: SPACING.md,
  } as ViewStyle,
  title: {
    fontFamily: FONTS.header,
    fontSize: 34,
    color: COLORS.cream,
    marginBottom: SPACING.xs,
  } as TextStyle,
  subtitle: {
    fontFamily: FONTS.body,
    fontSize: 15,
    color: COLORS.creamMuted,
    lineHeight: 22,
  } as TextStyle,

  // Passport warning banner
  passportWarning: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: SPACING.sm,
    marginHorizontal: SPACING.lg,
    marginBottom: SPACING.md,
    backgroundColor: COLORS.gold + '1A',
    borderLeftWidth: 3,
    borderLeftColor: COLORS.gold,
    borderRadius: RADIUS.sm,
    paddingVertical: SPACING.sm + 2,
    paddingHorizontal: SPACING.md,
  } as ViewStyle,
  passportWarningText: {
    flex: 1,
    fontFamily: FONTS.body,
    fontSize: 13,
    color: COLORS.cream,
    lineHeight: 18,
  } as TextStyle,

  // Trip card
  tripCard: {
    marginHorizontal: SPACING.lg,
    borderRadius: RADIUS.lg,
    borderWidth: 1,
    borderColor: COLORS.sage + '30',
    marginBottom: SPACING.lg,
  } as ViewStyle,
  tripCardInner: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    padding: SPACING.lg,
  } as ViewStyle,
  tripLabel: {
    fontFamily: FONTS.mono,
    fontSize: 10,
    color: COLORS.sage,
    letterSpacing: 1.5,
    marginBottom: 4,
  } as TextStyle,
  tripDestination: {
    fontFamily: FONTS.header,
    fontSize: 24,
    color: COLORS.cream,
  } as TextStyle,
  tripMeta: {
    fontFamily: FONTS.mono,
    fontSize: 12,
    color: COLORS.creamMuted,
    marginTop: 2,
  } as TextStyle,
  shareBtn: {
    backgroundColor: COLORS.bgElevated,
    borderRadius: RADIUS.md,
    paddingHorizontal: SPACING.md,
    paddingVertical: SPACING.sm,
    borderWidth: 1,
    borderColor: COLORS.border,
  } as ViewStyle,
  shareBtnText: {
    fontFamily: FONTS.bodyMedium,
    fontSize: 13,
    color: COLORS.cream,
  } as TextStyle,

  // Destination picker
  pickerWrap: {
    marginBottom: SPACING.lg,
  } as ViewStyle,
  pickerLabel: {
    fontFamily: FONTS.mono,
    fontSize: 10,
    color: COLORS.sage,
    letterSpacing: 1.5,
    paddingHorizontal: SPACING.lg,
    marginBottom: SPACING.sm,
  } as TextStyle,
  pickerScroll: {
    paddingHorizontal: SPACING.lg,
  } as ViewStyle,
  pickerChip: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
    backgroundColor: COLORS.bgCard,
    borderRadius: RADIUS.full,
    borderWidth: 1,
    borderColor: COLORS.border,
    paddingHorizontal: SPACING.md,
    paddingVertical: SPACING.sm,
    marginRight: SPACING.sm,
  } as ViewStyle,
  pickerChipActive: {
    backgroundColor: COLORS.sageLight,
    borderColor: COLORS.sage + '50',
  } as ViewStyle,
  pickerEmoji: {
    fontSize: 16,
  } as TextStyle,
  pickerText: {
    fontFamily: FONTS.bodyMedium,
    fontSize: 13,
    color: COLORS.creamMuted,
  } as TextStyle,
  pickerTextActive: {
    color: COLORS.cream,
  } as TextStyle,

  // Sections
  section: {
    marginHorizontal: SPACING.lg,
    marginBottom: SPACING.md,
    backgroundColor: COLORS.bgCard,
    borderRadius: RADIUS.lg,
    borderWidth: 1,
    borderColor: COLORS.border,
    overflow: 'hidden',
  } as ViewStyle,
  sectionHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    padding: SPACING.md,
    gap: SPACING.md,
  } as ViewStyle,
  sectionIconWrap: {
    width: 40,
    height: 40,
    borderRadius: 20,
    backgroundColor: COLORS.bgElevated,
    alignItems: 'center',
    justifyContent: 'center',
  } as ViewStyle,
  sectionTitleWrap: {
    flex: 1,
  } as ViewStyle,
  sectionTitle: {
    fontFamily: FONTS.bodySemiBold,
    fontSize: 16,
    color: COLORS.cream,
  } as TextStyle,
  sectionSubtitle: {
    fontFamily: FONTS.body,
    fontSize: 12,
    color: COLORS.creamMuted,
    marginTop: 2,
  } as TextStyle,
  sectionBody: {
    borderTopWidth: 1,
    borderTopColor: COLORS.border,
    padding: SPACING.md,
  } as ViewStyle,

  // Language content
  langContent: {
    gap: SPACING.sm,
  } as ViewStyle,
  langHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: SPACING.sm,
    marginBottom: SPACING.xs,
  } as ViewStyle,
  langFlag: {
    fontSize: 24,
  } as TextStyle,
  langName: {
    fontFamily: FONTS.bodySemiBold,
    fontSize: 18,
    color: COLORS.cream,
    flex: 1,
  } as TextStyle,
  langCount: {
    fontFamily: FONTS.mono,
    fontSize: 11,
    color: COLORS.creamMuted,
  } as TextStyle,
  chipScroll: {
    marginBottom: SPACING.sm,
  } as ViewStyle,
  chip: {
    backgroundColor: COLORS.bgElevated,
    borderRadius: RADIUS.full,
    paddingHorizontal: SPACING.md,
    paddingVertical: 6,
    marginRight: SPACING.xs,
    borderWidth: 1,
    borderColor: COLORS.border,
  } as ViewStyle,
  chipActive: {
    backgroundColor: COLORS.sageLight,
    borderColor: COLORS.sage + '50',
  } as ViewStyle,
  chipText: {
    fontFamily: FONTS.bodyMedium,
    fontSize: 12,
    color: COLORS.creamMuted,
  } as TextStyle,
  chipTextActive: {
    color: COLORS.cream,
  } as TextStyle,
  phraseRow: {
    backgroundColor: COLORS.bgElevated,
    borderRadius: RADIUS.md,
    padding: SPACING.sm + 4,
    marginBottom: SPACING.xs,
  } as ViewStyle,
  phraseEnglish: {
    fontFamily: FONTS.bodyMedium,
    fontSize: 14,
    color: COLORS.cream,
    marginBottom: 2,
  } as TextStyle,
  phraseLocal: {
    fontFamily: FONTS.bodySemiBold,
    fontSize: 18,
    color: COLORS.sage,
    marginBottom: 2,
  } as TextStyle,
  phrasePhonetic: {
    fontFamily: FONTS.mono,
    fontSize: 12,
    color: COLORS.creamMuted,
  } as TextStyle,

  // Emergency content
  emergencyContent: {
    gap: SPACING.md,
  } as ViewStyle,
  emergencyNumbers: {
    flexDirection: 'row',
    gap: SPACING.sm,
  } as ViewStyle,
  emergencyNumberCard: {
    flex: 1,
    backgroundColor: COLORS.coralLight,
    borderRadius: RADIUS.md,
    padding: SPACING.sm + 4,
    alignItems: 'center',
  } as ViewStyle,
  emergencyLabel: {
    fontFamily: FONTS.mono,
    fontSize: 9,
    color: COLORS.coral,
    letterSpacing: 1,
    marginBottom: 4,
  } as TextStyle,
  emergencyNumber: {
    fontFamily: FONTS.header,
    fontSize: 28,
    color: COLORS.cream,
  } as TextStyle,
  hospitalRow: {
    backgroundColor: COLORS.bgElevated,
    borderRadius: RADIUS.md,
    padding: SPACING.sm + 4,
    marginBottom: SPACING.xs,
  } as ViewStyle,
  hospitalName: {
    fontFamily: FONTS.bodySemiBold,
    fontSize: 14,
    color: COLORS.cream,
  } as TextStyle,
  hospitalArea: {
    fontFamily: FONTS.body,
    fontSize: 12,
    color: COLORS.creamMuted,
    marginTop: 2,
  } as TextStyle,

  // Cultural content
  culturalContent: {
    gap: SPACING.md,
  } as ViewStyle,
  etiquetteRow: {
    gap: SPACING.xs,
    marginBottom: SPACING.sm,
  } as ViewStyle,
  etiquetteDo: {
    flexDirection: 'row',
    gap: SPACING.sm,
    backgroundColor: COLORS.sageLight,
    borderRadius: RADIUS.md,
    padding: SPACING.sm + 2,
  } as ViewStyle,
  etiquetteDont: {
    flexDirection: 'row',
    gap: SPACING.sm,
    backgroundColor: COLORS.coralLight,
    borderRadius: RADIUS.md,
    padding: SPACING.sm + 2,
  } as ViewStyle,
  etiquetteIcon: {
    fontSize: 14,
    marginTop: 1,
  } as TextStyle,
  etiquetteText: {
    fontFamily: FONTS.body,
    fontSize: 13,
    color: COLORS.cream,
    flex: 1,
    lineHeight: 19,
  } as TextStyle,
  twoCol: {
    flexDirection: 'row',
    gap: SPACING.sm,
  } as ViewStyle,

  // Info cards
  infoCard: {
    backgroundColor: COLORS.bgElevated,
    borderRadius: RADIUS.md,
    padding: SPACING.md,
  } as ViewStyle,
  infoCardLabel: {
    fontFamily: FONTS.mono,
    fontSize: 9,
    color: COLORS.sage,
    letterSpacing: 1,
    marginBottom: 6,
  } as TextStyle,
  infoCardValue: {
    fontFamily: FONTS.bodySemiBold,
    fontSize: 16,
    color: COLORS.cream,
  } as TextStyle,
  infoCardBody: {
    fontFamily: FONTS.body,
    fontSize: 13,
    color: COLORS.cream,
    lineHeight: 19,
  } as TextStyle,
  infoCardMeta: {
    fontFamily: FONTS.body,
    fontSize: 11,
    color: COLORS.creamMuted,
    marginTop: 4,
    lineHeight: 16,
  } as TextStyle,

  // Shared sub-label and tips
  subLabel: {
    fontFamily: FONTS.mono,
    fontSize: 10,
    color: COLORS.sage,
    letterSpacing: 1.5,
    marginTop: SPACING.xs,
  } as TextStyle,
  tipRow: {
    flexDirection: 'row',
    gap: SPACING.sm,
    paddingVertical: 4,
  } as ViewStyle,
  tipBullet: {
    fontSize: 12,
    color: COLORS.creamMuted,
    marginTop: 2,
  } as TextStyle,
  tipText: {
    fontFamily: FONTS.body,
    fontSize: 13,
    color: COLORS.cream,
    flex: 1,
    lineHeight: 19,
  } as TextStyle,

  // Packing
  packingContent: {
    gap: SPACING.sm,
  } as ViewStyle,
  packingRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: SPACING.sm,
    paddingVertical: 6,
  } as ViewStyle,
  packingCheckbox: {
    width: 20,
    height: 20,
    borderRadius: 4,
    borderWidth: 2,
    borderColor: COLORS.border,
  } as ViewStyle,
  packingText: {
    fontFamily: FONTS.body,
    fontSize: 14,
    color: COLORS.cream,
    flex: 1,
  } as TextStyle,

  // Empty section
  emptySection: {
    alignItems: 'center',
    paddingVertical: SPACING.md,
    gap: SPACING.sm,
  } as ViewStyle,
  emptySectionEmoji: {
    fontSize: 40,
    opacity: 0.5,
  } as TextStyle,
  emptySectionTitle: {
    fontFamily: FONTS.bodySemiBold,
    fontSize: 16,
    color: COLORS.cream,
  } as TextStyle,
  emptySectionText: {
    fontFamily: FONTS.body,
    fontSize: 14,
    color: COLORS.creamMuted,
    textAlign: 'center',
    lineHeight: 20,
  } as TextStyle,
  emptySectionTip: {
    fontFamily: FONTS.mono,
    fontSize: 11,
    color: COLORS.sage,
    textAlign: 'center',
    marginTop: SPACING.xs,
  } as TextStyle,

  offlineMapContent: {
    paddingVertical: SPACING.sm,
    gap: SPACING.md,
  } as ViewStyle,
  offlineMapText: {
    fontFamily: FONTS.body,
    fontSize: 14,
    color: COLORS.creamMuted,
    lineHeight: 20,
  } as TextStyle,
  offlineMapTip: {
    fontFamily: FONTS.mono,
    fontSize: 11,
    color: COLORS.sage,
  } as TextStyle,
  offlineMapCta: {
    marginTop: SPACING.sm,
  } as ViewStyle,

  // All languages CTA
  allLangsCta: {
    marginHorizontal: SPACING.lg,
    marginTop: SPACING.md,
    backgroundColor: COLORS.bgCard,
    borderRadius: RADIUS.lg,
    borderWidth: 1,
    borderColor: COLORS.border,
    padding: SPACING.lg,
    alignItems: 'center',
  } as ViewStyle,
  allLangsTitle: {
    fontFamily: FONTS.bodySemiBold,
    fontSize: 16,
    color: COLORS.cream,
    marginBottom: SPACING.xs,
  } as TextStyle,
  allLangsSubtitle: {
    fontFamily: FONTS.body,
    fontSize: 12,
    color: COLORS.creamMuted,
    textAlign: 'center',
    lineHeight: 18,
  } as TextStyle,
});

export default withComingSoon(PrepScreen, { routeName: 'prep', title: 'Trip Prep' });
