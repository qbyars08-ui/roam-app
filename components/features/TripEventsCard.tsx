// =============================================================================
// ROAM — Trip Events: concerts & experiences during your dates
// =============================================================================
import React, { useEffect, useState } from 'react';
import { useTranslation } from 'react-i18next';
import {
  View,
  Text,
  Pressable,
  ScrollView,
  StyleSheet,
  Linking,
  ImageBackground,
  type ViewStyle,
  type TextStyle,
  type ImageStyle,
} from 'react-native';
import * as Haptics from '../../lib/haptics';
import { COLORS, FONTS, SPACING, RADIUS } from '../../lib/constants';
import { fetchTripEvents, type TripEvent } from '../../lib/ticketmaster';

interface TripEventsCardProps {
  destination: string;
  startDate: Date;
  endDate: Date;
}

const TYPE_LABELS: Record<TripEvent['type'], string> = {
  concert: 'Concert',
  festival: 'Festival',
  sports: 'Sports',
  arts: 'Arts',
  family: 'Family',
  other: 'Event',
};

function formatDate(iso: string): string {
  const d = new Date(iso);
  return d.toLocaleDateString('en-US', {
    month: 'short',
    day: 'numeric',
  });
}

export default function TripEventsCard({
  destination,
  startDate,
  endDate,
}: TripEventsCardProps) {
  const { t } = useTranslation();
  const [events, setEvents] = useState<TripEvent[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    let cancelled = false;
    // eslint-disable-next-line react-hooks/set-state-in-effect -- async data load
    setLoading(true);
    fetchTripEvents(destination, startDate, endDate).then((list) => {
      if (!cancelled) {
        // eslint-disable-next-line react-hooks/set-state-in-effect -- async data load
        setEvents(list);
        // eslint-disable-next-line react-hooks/set-state-in-effect -- async data load
        setLoading(false);
      }
    });
    return () => { cancelled = true; };
  }, [destination, startDate, endDate]);

  if (loading) return null;
  if (events.length === 0) return null;

  return (
    <View style={styles.card}>
      <Text style={styles.label}>{t('tripEvents.happeningDuringTrip', { defaultValue: 'HAPPENING DURING YOUR TRIP' })}</Text>
      <Text style={styles.sub}>{t('tripEvents.concertsShowsExperiences', { defaultValue: 'Concerts, shows & experiences' })}</Text>
      <ScrollView
        horizontal
        showsHorizontalScrollIndicator={false}
        contentContainerStyle={styles.row}
      >
        {events.map((ev) => (
          <Pressable
            key={ev.id}
            style={({ pressed }) => [
              styles.eventCard,
              { opacity: pressed ? 0.9 : 1 },
            ]}
            onPress={() => {
              Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
              Linking.openURL(ev.url).catch(() => {});
            }}
          >
            {ev.imageUrl ? (
              <ImageBackground
                source={{ uri: ev.imageUrl }}
                style={styles.eventImage}
                imageStyle={{ borderRadius: RADIUS.md } as ImageStyle}
              >
                <View style={styles.eventOverlay} />
                <View style={styles.eventBadge}>
                  <Text style={styles.eventType}>
                    {TYPE_LABELS[ev.type]}
                  </Text>
                </View>
                <View style={styles.eventBottom}>
                  <Text style={styles.eventName} numberOfLines={2}>
                    {ev.name}
                  </Text>
                  <Text style={styles.eventMeta}>
                    {formatDate(ev.date)}{ev.time ? ` ${ev.time}` : ''}
                    {ev.venue ? ` · ${ev.venue}` : ''}
                  </Text>
                  {ev.priceRange && (
                    <Text style={styles.eventPrice}>{ev.priceRange}</Text>
                  )}
                </View>
              </ImageBackground>
            ) : (
              <View style={styles.eventPlaceholder}>
                <Text style={styles.eventName} numberOfLines={2}>
                  {ev.name}
                </Text>
                <Text style={styles.eventMeta}>
                  {formatDate(ev.date)}{ev.time ? ` ${ev.time}` : ''}
                  {ev.venue ? ` · ${ev.venue}` : ''}
                </Text>
                <Text style={styles.eventTypeText}>{TYPE_LABELS[ev.type]}</Text>
              </View>
            )}
          </Pressable>
        ))}
      </ScrollView>
    </View>
  );
}

const styles = StyleSheet.create({
  card: {
    marginBottom: SPACING.md,
  } as ViewStyle,
  label: {
    fontFamily: FONTS.mono,
    fontSize: 10,
    color: COLORS.sage,
    letterSpacing: 1.5,
    marginBottom: 2,
  } as TextStyle,
  sub: {
    fontFamily: FONTS.body,
    fontSize: 12,
    color: COLORS.creamMuted,
    marginBottom: SPACING.sm,
  } as TextStyle,
  row: {
    gap: SPACING.sm,
  } as ViewStyle,
  eventCard: {
    width: 160,
    height: 140,
    borderRadius: RADIUS.md,
    overflow: 'hidden',
  } as ViewStyle,
  eventImage: {
    flex: 1,
    justifyContent: 'flex-end',
  } as ViewStyle,
  eventImageInner: {
    borderRadius: RADIUS.md,
  } as ImageStyle,
  eventOverlay: {
    ...StyleSheet.absoluteFillObject,
    backgroundColor: COLORS.overlayLight,
  } as ViewStyle,
  eventBadge: {
    position: 'absolute',
    top: SPACING.sm,
    left: SPACING.sm,
    backgroundColor: COLORS.sage,
    paddingHorizontal: 6,
    paddingVertical: 2,
    borderRadius: RADIUS.sm,
  } as ViewStyle,
  eventType: {
    fontFamily: FONTS.mono,
    fontSize: 9,
    color: COLORS.bg,
    letterSpacing: 0.5,
  } as TextStyle,
  eventBottom: {
    padding: SPACING.sm,
  } as ViewStyle,
  eventName: {
    fontFamily: FONTS.bodySemiBold,
    fontSize: 13,
    color: COLORS.cream,
  } as TextStyle,
  eventMeta: {
    fontFamily: FONTS.mono,
    fontSize: 10,
    color: COLORS.creamMuted,
    marginTop: 2,
  } as TextStyle,
  eventPlaceholder: {
    flex: 1,
    backgroundColor: COLORS.bgGlass,
    padding: SPACING.sm,
    justifyContent: 'space-between',
  } as ViewStyle,
  eventPrice: {
    fontFamily: FONTS.mono,
    fontSize: 9,
    color: COLORS.sage,
    marginTop: 2,
  } as TextStyle,
  eventTypeText: {
    fontFamily: FONTS.mono,
    fontSize: 9,
    color: COLORS.sage,
  } as TextStyle,
});
