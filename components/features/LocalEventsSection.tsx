// =============================================================================
// ROAM — "What's happening while you're there" (Local Events)
// =============================================================================
import React, { useEffect, useState } from 'react';
import {
  View,
  Text,
  ScrollView,
  Pressable,
  Image,
  StyleSheet,
  Linking,
  type ViewStyle,
  type TextStyle,
} from 'react-native';
import { useTranslation } from 'react-i18next';
import { Calendar } from 'lucide-react-native';
import { COLORS, FONTS, SPACING, RADIUS } from '../../lib/constants';
import { getLocalEvents, type LocalEvent, type EventCategory } from '../../lib/local-events';

interface LocalEventsSectionProps {
  city: string;
  startDate: string;  // YYYY-MM-DD
  endDate: string;
}

const CAT_LABELS: Record<EventCategory, string> = {
  music: 'Music',
  food: 'Food',
  culture: 'Culture',
  sports: 'Sports',
  nightlife: 'Nightlife',
};

export default function LocalEventsSection({
  city,
  startDate,
  endDate,
}: LocalEventsSectionProps) {
  const { t } = useTranslation();
  const [events, setEvents] = useState<LocalEvent[]>([]);

  useEffect(() => {
    getLocalEvents(city, startDate, endDate).then(setEvents);
  }, [city, startDate, endDate]);

  if (events.length === 0) return null;

  return (
    <View style={styles.section}>
      <Text style={styles.title}>{t('events.whatsHappening', { defaultValue: "What's happening while you're there" })}</Text>
      <ScrollView horizontal showsHorizontalScrollIndicator={false}>
        {events.map((e) => (
          <Pressable
            key={e.id}
            style={({ pressed }) => [styles.card, { opacity: pressed ? 0.9 : 1 }]}
            onPress={() => e.url && Linking.openURL(e.url)}
          >
            {e.imageUrl && (
              <Image source={{ uri: e.imageUrl }} style={styles.image} />
            )}
            <View style={styles.cardContent}>
              <Text style={styles.cat}>{CAT_LABELS[e.category]}</Text>
              <Text style={styles.name} numberOfLines={2}>{e.name}</Text>
              {e.venue && <Text style={styles.venue} numberOfLines={1}>{e.venue}</Text>}
              <Text style={styles.date}>{e.date}</Text>
            </View>
          </Pressable>
        ))}
      </ScrollView>
    </View>
  );
}

const styles = StyleSheet.create({
  section: { marginBottom: SPACING.lg },
  title: {
    fontFamily: FONTS.mono,
    fontSize: 11,
    color: COLORS.sage,
    letterSpacing: 1.5,
    marginBottom: SPACING.sm,
    paddingHorizontal: SPACING.lg,
  } as TextStyle,
  card: {
    width: 160,
    marginLeft: SPACING.lg,
    borderRadius: RADIUS.md,
    overflow: 'hidden',
    backgroundColor: COLORS.bgCard,
    borderWidth: 1,
    borderColor: COLORS.border,
  } as ViewStyle,
  image: {
    width: '100%',
    height: 80,
    backgroundColor: COLORS.bgGlass,
  },
  cardContent: {
    padding: SPACING.sm,
  },
  cat: {
    fontFamily: FONTS.mono,
    fontSize: 10,
    color: COLORS.sage,
    marginBottom: 4,
  } as TextStyle,
  name: {
    fontFamily: FONTS.bodySemiBold,
    fontSize: 13,
    color: COLORS.cream,
  } as TextStyle,
  venue: {
    fontFamily: FONTS.body,
    fontSize: 11,
    color: COLORS.creamMuted,
    marginTop: 2,
  } as TextStyle,
  date: {
    fontFamily: FONTS.mono,
    fontSize: 10,
    color: COLORS.creamMuted,
    marginTop: 4,
  } as TextStyle,
});
