// =============================================================================
// ROAM — Travel Meetups Screen
// Sonar-powered local meetup finder for solo travelers.
// =============================================================================
import React, { useCallback, useEffect, useMemo, useState } from 'react';
import {
  Linking,
  Pressable,
  ScrollView,
  StyleSheet,
  Text,
  View,
} from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { useRouter } from 'expo-router';
import { Calendar, ChevronDown, ExternalLink, Users } from 'lucide-react-native';
import { useTranslation } from 'react-i18next';
import { useAppStore } from '../lib/store';
import { useSonarQuery } from '../lib/sonar';
import * as Haptics from '../lib/haptics';
import { track } from '../lib/analytics';
import { searchEvents, type EventResult } from '../lib/apis/eventbrite';
import { searchActivities, type GYGActivity } from '../lib/apis/getyourguide';
import { COLORS, FONTS, MAGAZINE, RADIUS, SPACING } from '../lib/constants';
import LiveBadge from '../components/ui/LiveBadge';
import SourceCitation from '../components/ui/SourceCitation';
import { SkeletonCard } from '../components/premium/LoadingStates';

// ---------------------------------------------------------------------------
// Social event categories from Eventbrite
// ---------------------------------------------------------------------------
const SOCIAL_CATEGORIES = ['social', 'community', 'food', 'music', 'nightlife', 'travel'];

// ---------------------------------------------------------------------------
// GYG group activity categories
// ---------------------------------------------------------------------------
const GROUP_CATEGORIES = ['tours', 'activities', 'experiences'];

// ---------------------------------------------------------------------------
// EventCard
// ---------------------------------------------------------------------------

interface EventCardProps {
  name: string;
  date: string;
  price: string | null;
  url: string;
  isFree: boolean;
  source: 'eventbrite' | 'getyourguide';
}

function EventCard({ name, date, price, url, isFree, source }: EventCardProps) {
  const { t } = useTranslation();

  const handlePress = useCallback(async () => {
    await Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
    Linking.openURL(url).catch(() => {});
  }, [url]);

  const priceLabel = isFree
    ? t('travelMeetups.free', { defaultValue: 'Free' })
    : price ?? t('travelMeetups.seeDetails', { defaultValue: 'See details' });

  const sourceLabel =
    source === 'eventbrite'
      ? t('travelMeetups.sourceEventbrite', { defaultValue: 'Eventbrite' })
      : t('travelMeetups.sourceGYG', { defaultValue: 'GetYourGuide' });

  return (
    <Pressable
      onPress={handlePress}
      style={({ pressed }) => [styles.eventCard, pressed && styles.pressed]}
      accessibilityLabel={t('travelMeetups.joinEvent', {
        defaultValue: 'Join {{name}}',
        name,
      })}
      accessibilityRole="button"
    >
      <View style={styles.eventCardInner}>
        <View style={styles.eventInfo}>
          <Text style={styles.eventName} numberOfLines={2}>
            {name}
          </Text>
          <Text style={styles.eventDate}>{date}</Text>
          <View style={styles.eventMeta}>
            <View style={styles.priceChip}>
              <Text style={styles.priceText}>{priceLabel}</Text>
            </View>
            <Text style={styles.sourceLabel}>{sourceLabel}</Text>
          </View>
        </View>
        <View style={styles.joinBtn}>
          <ExternalLink size={14} color={COLORS.sage} strokeWidth={1.5} />
          <Text style={styles.joinBtnText}>
            {t('travelMeetups.join', { defaultValue: 'Join' })}
          </Text>
        </View>
      </View>
    </Pressable>
  );
}

// ---------------------------------------------------------------------------
// Main Screen
// ---------------------------------------------------------------------------

export default function TravelMeetupsScreen() {
  const { t } = useTranslation();
  const router = useRouter();
  const insets = useSafeAreaInsets();
  const trips = useAppStore((s) => s.trips);

  const destination = useMemo(
    () => (trips.length > 0 ? trips[0].destination : ''),
    [trips],
  );

  // Sonar meetups query
  const sonarMeetups = useSonarQuery(destination || undefined, 'meetups');

  // Eventbrite social events
  const [eventbriteEvents, setEventbriteEvents] = useState<EventResult[] | null>(null);
  const [eventbriteLoading, setEventbriteLoading] = useState(false);

  // GetYourGuide group activities
  const [gygActivities, setGygActivities] = useState<GYGActivity[] | null>(null);
  const [gygLoading, setGygLoading] = useState(false);

  useEffect(() => {
    track({ type: 'screen_view', screen: 'travel_meetups' }).catch(() => {});
  }, []);

  useEffect(() => {
    if (!destination) return;

    let cancelled = false;

    // Eventbrite: filter for social/community events
    setEventbriteLoading(true);
    searchEvents(destination, undefined, undefined, SOCIAL_CATEGORIES)
      .then((results) => {
        if (!cancelled) {
          const socialEvents = (results ?? []).filter(
            (e) =>
              SOCIAL_CATEGORIES.some((cat) =>
                e.category.toLowerCase().includes(cat),
              ),
          );
          setEventbriteEvents(socialEvents.slice(0, 6));
        }
      })
      .finally(() => {
        if (!cancelled) setEventbriteLoading(false);
      });

    // GetYourGuide: group activities
    setGygLoading(true);
    searchActivities(destination, undefined, 'tours')
      .then((results) => {
        if (!cancelled) {
          const groupActivities = (results ?? []).filter((a) =>
            GROUP_CATEGORIES.some((cat) => a.category.toLowerCase().includes(cat)),
          );
          setGygActivities(groupActivities.slice(0, 6));
        }
      })
      .finally(() => {
        if (!cancelled) setGygLoading(false);
      });

    return () => {
      cancelled = true;
    };
  }, [destination]);

  const hasSonarData =
    sonarMeetups.data?.answer && sonarMeetups.data.answer !== 'No results found.';
  const hasEventbriteData = eventbriteEvents && eventbriteEvents.length > 0;
  const hasGygData = gygActivities && gygActivities.length > 0;

  // ---------------------------------------------------------------------------
  // Render
  // ---------------------------------------------------------------------------
  return (
    <View style={[styles.container, { paddingTop: insets.top }]}>
      {/* Header */}
      <View style={styles.header}>
        <Pressable
          onPress={() => router.back()}
          style={({ pressed }) => [styles.backBtn, pressed && styles.pressed]}
          accessibilityLabel={t('common.back', { defaultValue: 'Back' })}
          accessibilityRole="button"
        >
          <ChevronDown size={20} color={COLORS.creamMuted} strokeWidth={1.5} />
        </Pressable>
        <View style={styles.heroIcon}>
          <Calendar size={28} color={COLORS.sage} strokeWidth={1.5} />
        </View>
        <Text style={styles.heroTitle}>
          {destination
            ? t('travelMeetups.heroTitle', {
                defaultValue: 'Meet people in {{destination}}',
                destination,
              })
            : t('travelMeetups.heroTitleGeneric', { defaultValue: 'Meet People' })}
        </Text>
        <Text style={styles.heroSubtitle}>
          {t('travelMeetups.heroSubtitle', {
            defaultValue: 'Events, tours, and meetups for solo travelers',
          })}
        </Text>
      </View>

      <ScrollView
        showsVerticalScrollIndicator={false}
        contentContainerStyle={styles.scrollContent}
      >
        {/* ── No trip state ── */}
        {!destination && (
          <View style={styles.emptyState}>
            <Users size={32} color={COLORS.creamMuted} strokeWidth={1.5} />
            <Text style={styles.emptyTitle}>
              {t('travelMeetups.noTripTitle', { defaultValue: 'No active trip' })}
            </Text>
            <Text style={styles.emptySubtitle}>
              {t('travelMeetups.noTripSubtitle', {
                defaultValue: 'Add a trip to see meetups in your destination.',
              })}
            </Text>
          </View>
        )}

        {/* ── Sonar live meetups ── */}
        {destination && (
          <View style={styles.section}>
            <View style={styles.sectionHeaderRow}>
              <Text style={styles.sectionTitle}>
                {t('travelMeetups.thiswWeekTitle', { defaultValue: 'This week' })}
              </Text>
              {sonarMeetups.isLive && <LiveBadge />}
            </View>

            {sonarMeetups.isLoading && (
              <>
                <SkeletonCard height={80} />
                <SkeletonCard height={80} />
              </>
            )}

            {!sonarMeetups.isLoading && hasSonarData && (
              <View style={styles.sonarCard}>
                <Text style={styles.sonarText}>{sonarMeetups.data!.answer}</Text>
                {sonarMeetups.citations.length > 0 && (
                  <View style={styles.citations}>
                    <SourceCitation citations={sonarMeetups.citations.slice(0, 3)} />
                  </View>
                )}
              </View>
            )}

            {!sonarMeetups.isLoading && !hasSonarData && !sonarMeetups.error && (
              <Text style={styles.emptySection}>
                {t('travelMeetups.noSonarResults', {
                  defaultValue: 'No live meetup data found.',
                })}
              </Text>
            )}

            {sonarMeetups.error && (
              <Text style={styles.errorText}>{sonarMeetups.error}</Text>
            )}
          </View>
        )}

        {/* ── Eventbrite social events ── */}
        {destination && (
          <View style={styles.section}>
            <Text style={styles.sectionTitle}>
              {t('travelMeetups.eventsTitle', { defaultValue: 'Events & Meetups' })}
            </Text>

            {eventbriteLoading && (
              <>
                <SkeletonCard height={90} />
                <SkeletonCard height={90} />
              </>
            )}

            {!eventbriteLoading && hasEventbriteData &&
              eventbriteEvents.map((ev) => (
                <EventCard
                  key={ev.id}
                  name={ev.name}
                  date={ev.date}
                  price={ev.price}
                  url={ev.url}
                  isFree={ev.isFree}
                  source="eventbrite"
                />
              ))}

            {!eventbriteLoading && !hasEventbriteData && (
              <Text style={styles.emptySection}>
                {t('travelMeetups.noEvents', {
                  defaultValue: 'No events found on Eventbrite.',
                })}
              </Text>
            )}
          </View>
        )}

        {/* ── GetYourGuide group activities ── */}
        {destination && (
          <View style={styles.section}>
            <Text style={styles.sectionTitle}>
              {t('travelMeetups.groupActivitiesTitle', { defaultValue: 'Group Activities' })}
            </Text>

            {gygLoading && (
              <>
                <SkeletonCard height={90} />
                <SkeletonCard height={90} />
              </>
            )}

            {!gygLoading && hasGygData &&
              gygActivities.map((act) => (
                <EventCard
                  key={act.id}
                  name={act.name}
                  date={act.duration}
                  price={
                    act.price > 0
                      ? `${act.currency} ${act.price}`
                      : null
                  }
                  url={act.bookingUrl}
                  isFree={act.price === 0}
                  source="getyourguide"
                />
              ))}

            {!gygLoading && !hasGygData && (
              <Text style={styles.emptySection}>
                {t('travelMeetups.noGroupActivities', {
                  defaultValue: 'No group activities found.',
                })}
              </Text>
            )}
          </View>
        )}
      </ScrollView>
    </View>
  );
}

// ---------------------------------------------------------------------------
// Styles
// ---------------------------------------------------------------------------
const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: COLORS.bg,
  },
  pressed: {
    opacity: 0.75,
  },

  // Header
  header: {
    paddingHorizontal: MAGAZINE.padding,
    paddingTop: SPACING.sm,
    paddingBottom: SPACING.lg,
    gap: SPACING.xs,
  },
  backBtn: {
    alignSelf: 'flex-start',
    marginBottom: SPACING.sm,
    padding: SPACING.xs,
  },
  heroIcon: {
    marginBottom: SPACING.xs,
  },
  heroTitle: {
    fontFamily: FONTS.header,
    fontSize: 28,
    color: COLORS.cream,
    letterSpacing: -0.5,
    lineHeight: 34,
  },
  heroSubtitle: {
    fontFamily: FONTS.body,
    fontSize: 14,
    color: COLORS.creamMuted,
    lineHeight: 20,
  },

  // Scroll
  scrollContent: {
    paddingHorizontal: MAGAZINE.padding,
    paddingBottom: SPACING.xxxl,
  },

  // Sections
  section: {
    marginBottom: SPACING.xl,
    gap: SPACING.sm,
  },
  sectionHeaderRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    marginBottom: SPACING.xs,
  },
  sectionTitle: {
    fontFamily: FONTS.header,
    fontSize: 18,
    color: COLORS.cream,
    letterSpacing: -0.2,
  },

  // Sonar card
  sonarCard: {
    backgroundColor: COLORS.surface1,
    borderRadius: RADIUS.md,
    padding: SPACING.md,
    borderWidth: 1,
    borderColor: COLORS.border,
    gap: SPACING.sm,
  },
  sonarText: {
    fontFamily: FONTS.body,
    fontSize: 14,
    color: COLORS.creamSoft,
    lineHeight: 22,
  },
  citations: {
    gap: 4,
  },

  // Event card
  eventCard: {
    backgroundColor: COLORS.surface1,
    borderRadius: RADIUS.md,
    padding: SPACING.md,
    borderWidth: 1,
    borderColor: COLORS.border,
  },
  eventCardInner: {
    flexDirection: 'row',
    alignItems: 'flex-start',
    gap: SPACING.sm,
  },
  eventInfo: {
    flex: 1,
    gap: SPACING.xs,
  },
  eventName: {
    fontFamily: FONTS.bodyMedium,
    fontSize: 15,
    color: COLORS.cream,
    lineHeight: 20,
  },
  eventDate: {
    fontFamily: FONTS.mono,
    fontSize: 12,
    color: COLORS.creamMuted,
    letterSpacing: 0.3,
  },
  eventMeta: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: SPACING.xs,
  },
  priceChip: {
    backgroundColor: COLORS.sageSubtle,
    borderRadius: RADIUS.pill,
    paddingHorizontal: SPACING.xs + 2,
    paddingVertical: 2,
    borderWidth: 1,
    borderColor: COLORS.sageBorder,
  },
  priceText: {
    fontFamily: FONTS.mono,
    fontSize: 10,
    color: COLORS.sage,
    letterSpacing: 0.3,
  },
  sourceLabel: {
    fontFamily: FONTS.mono,
    fontSize: 10,
    color: COLORS.creamMuted,
    letterSpacing: 0.3,
  },
  joinBtn: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
    paddingVertical: SPACING.xs,
    paddingHorizontal: SPACING.sm,
    borderRadius: RADIUS.pill,
    borderWidth: 1,
    borderColor: COLORS.sageBorder,
    flexShrink: 0,
  },
  joinBtnText: {
    fontFamily: FONTS.bodyMedium,
    fontSize: 12,
    color: COLORS.sage,
  },

  // Empty / error states
  emptyState: {
    alignItems: 'center',
    paddingTop: SPACING.xxl,
    gap: SPACING.sm,
  },
  emptyTitle: {
    fontFamily: FONTS.headerMedium,
    fontSize: 18,
    color: COLORS.cream,
    textAlign: 'center',
  },
  emptySubtitle: {
    fontFamily: FONTS.body,
    fontSize: 14,
    color: COLORS.creamMuted,
    textAlign: 'center',
  },
  emptySection: {
    fontFamily: FONTS.body,
    fontSize: 13,
    color: COLORS.creamMuted,
    fontStyle: 'italic',
  },
  errorText: {
    fontFamily: FONTS.mono,
    fontSize: 12,
    color: COLORS.coral,
    letterSpacing: 0.3,
  },
});
