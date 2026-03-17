// =============================================================================
// ROAM — Trip Soundtrack Card
// One tap opens Spotify with destination pre-filled
// =============================================================================
import React from 'react';
import { useTranslation } from 'react-i18next';
import { View, Text, Pressable, StyleSheet, type ViewStyle, type TextStyle } from 'react-native';
import { Music } from 'lucide-react-native';
import * as Haptics from '../../lib/haptics';
import { COLORS, FONTS, SPACING, RADIUS } from '../../lib/constants';
import { openSpotifySearch } from '../../lib/trip-soundtrack';

interface TripSoundtrackCardProps {
  destination: string;
}

export default function TripSoundtrackCard({ destination }: TripSoundtrackCardProps) {
  const { t } = useTranslation();
  return (
    <Pressable
      style={({ pressed }) => [styles.card, { opacity: pressed ? 0.9 : 1 }]}
      onPress={() => {
        Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Medium);
        openSpotifySearch(destination);
      }}
    >
      <Music size={24} color={COLORS.spotifyGreen} strokeWidth={1.5} />
      <View style={styles.content}>
        <Text style={styles.title}>{t('soundtrack.tripSoundtrack', { defaultValue: 'Trip Soundtrack' })}</Text>
        <Text style={styles.sub}>
          {destination} — {t('soundtrack.tapToFindPlaylists', { defaultValue: 'tap to find playlists on Spotify' })}
        </Text>
      </View>
    </Pressable>
  );
}

const styles = StyleSheet.create({
  card: {
    flexDirection: 'row',
    alignItems: 'center',
    padding: SPACING.md,
    backgroundColor: COLORS.bgGlass,
    borderRadius: RADIUS.lg,
    borderWidth: 1,
    borderColor: COLORS.border,
    gap: SPACING.md,
  } as ViewStyle,
  content: { flex: 1 },
  title: {
    fontFamily: FONTS.bodySemiBold,
    fontSize: 15,
    color: COLORS.cream,
  } as TextStyle,
  sub: {
    fontFamily: FONTS.body,
    fontSize: 13,
    color: COLORS.creamMuted,
    marginTop: 2,
  } as TextStyle,
});
