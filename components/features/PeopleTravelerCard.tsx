// =============================================================================
// ROAM — People Tab Traveler Card
// Shows traveler profile with match score, Pro-gated Connect action.
// =============================================================================
import React from 'react';
import {
  Image,
  Pressable,
  StyleSheet,
  Text,
  View,
  type ImageStyle,
  type TextStyle,
  type ViewStyle,
} from 'react-native';
import { Globe, Heart, Lock, MapPin, MessageCircle, Zap } from 'lucide-react-native';
import * as Haptics from '../../lib/haptics';
import { COLORS, FONTS, SPACING, RADIUS } from '../../lib/constants';

export interface Traveler {
  id: string;
  name: string;
  age: number;
  avatar: string;
  destination: string;
  dates: string;
  vibes: string[];
  bio: string;
  countries: number;
  matchScore: number;
}

interface TravelerCardProps {
  traveler: Traveler;
  onPress: () => void;
  onConnect: () => void;
  isLocked?: boolean;
}

const PeopleTravelerCard = React.memo(function PeopleTravelerCard({
  traveler, onPress, onConnect, isLocked = false,
}: TravelerCardProps) {
  return (
    <Pressable
      onPress={() => {
        Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
        if (isLocked) { onConnect(); return; }
        onPress();
      }}
      style={({ pressed }) => [
        styles.card,
        isLocked && styles.cardLocked,
        { transform: [{ scale: pressed ? 0.97 : 1 }] },
      ]}
    >
      <View style={styles.header}>
        <Image source={{ uri: traveler.avatar }} style={styles.avatar} />
        <View style={styles.info}>
          <View style={styles.nameRow}>
            <Text style={styles.name}>{traveler.name}, {traveler.age}</Text>
            <View style={styles.matchBadge}>
              <Zap size={10} color={COLORS.bg} />
              <Text style={styles.matchText}>{traveler.matchScore}%</Text>
            </View>
          </View>
          <View style={styles.destRow}>
            <MapPin size={12} color={COLORS.sage} strokeWidth={2} />
            <Text style={styles.dest}>{traveler.destination}</Text>
            <Text style={styles.dates}>{traveler.dates}</Text>
          </View>
        </View>
      </View>

      <Text style={styles.bio}>{traveler.bio}</Text>

      <View style={styles.vibes}>
        {traveler.vibes.map((vibe) => (
          <View key={vibe} style={styles.vibePill}>
            <Text style={styles.vibePillText}>{vibe}</Text>
          </View>
        ))}
        <View style={styles.countriesPill}>
          <Globe size={11} color={COLORS.gold} strokeWidth={2} />
          <Text style={styles.countriesText}>{traveler.countries} countries</Text>
        </View>
      </View>

      <View style={styles.actions}>
        <Pressable
          style={({ pressed }) => [styles.actionBtn, styles.actionBtnPrimary, { opacity: pressed ? 0.85 : 1 }]}
          onPress={() => { Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Medium); onConnect(); }}
        >
          {isLocked
            ? <Lock size={14} color={COLORS.bg} strokeWidth={2} />
            : <MessageCircle size={16} color={COLORS.bg} strokeWidth={2} />}
          <Text style={styles.actionBtnPrimaryText}>{isLocked ? 'Pro' : 'Connect'}</Text>
        </Pressable>
        <Pressable
          style={({ pressed }) => [styles.actionBtn, styles.actionBtnSecondary, { opacity: pressed ? 0.85 : 1 }]}
          onPress={() => { Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light); }}
        >
          <Heart size={16} color={COLORS.cream} strokeWidth={2} />
        </Pressable>
      </View>
    </Pressable>
  );
});

export default PeopleTravelerCard;

const styles = StyleSheet.create({
  card: {
    marginHorizontal: SPACING.lg, marginBottom: SPACING.md,
    backgroundColor: COLORS.bgCard, borderRadius: RADIUS.xl,
    borderWidth: 1, borderColor: COLORS.border, padding: SPACING.md,
  } as ViewStyle,
  cardLocked: { opacity: 0.55 } as ViewStyle,
  header: { flexDirection: 'row', alignItems: 'center', gap: SPACING.md } as ViewStyle,
  avatar: { width: 52, height: 52, borderRadius: 26, borderWidth: 2, borderColor: COLORS.sageBorder } as ImageStyle,
  info: { flex: 1 } as ViewStyle,
  nameRow: { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between' } as ViewStyle,
  name: { fontFamily: FONTS.bodySemiBold, fontSize: 16, color: COLORS.cream } as TextStyle,
  matchBadge: { flexDirection: 'row', alignItems: 'center', gap: 3, backgroundColor: COLORS.sage, paddingHorizontal: 8, paddingVertical: 2, borderRadius: RADIUS.sm } as ViewStyle,
  matchText: { fontFamily: FONTS.mono, fontSize: 11, color: COLORS.bg } as TextStyle,
  destRow: { flexDirection: 'row', alignItems: 'center', gap: 4, marginTop: 4 } as ViewStyle,
  dest: { fontFamily: FONTS.bodyMedium, fontSize: 13, color: COLORS.sage } as TextStyle,
  dates: { fontFamily: FONTS.mono, fontSize: 12, color: COLORS.creamMuted, marginLeft: 4 } as TextStyle,
  bio: { fontFamily: FONTS.body, fontSize: 14, color: COLORS.creamSoft, lineHeight: 20, marginTop: SPACING.sm } as TextStyle,
  vibes: { flexDirection: 'row', flexWrap: 'wrap', gap: 6, marginTop: SPACING.sm } as ViewStyle,
  vibePill: { backgroundColor: COLORS.bgGlass, paddingHorizontal: 10, paddingVertical: 4, borderRadius: RADIUS.sm } as ViewStyle,
  vibePillText: { fontFamily: FONTS.mono, fontSize: 11, color: COLORS.creamMuted } as TextStyle,
  countriesPill: { flexDirection: 'row', alignItems: 'center', gap: 4, backgroundColor: COLORS.goldFaint, paddingHorizontal: 10, paddingVertical: 4, borderRadius: RADIUS.sm } as ViewStyle,
  countriesText: { fontFamily: FONTS.mono, fontSize: 11, color: COLORS.gold } as TextStyle,
  actions: { flexDirection: 'row', gap: SPACING.sm, marginTop: SPACING.md } as ViewStyle,
  actionBtn: { flexDirection: 'row', alignItems: 'center', justifyContent: 'center', gap: 6, paddingVertical: SPACING.sm, borderRadius: RADIUS.md } as ViewStyle,
  actionBtnPrimary: { flex: 1, backgroundColor: COLORS.sage } as ViewStyle,
  actionBtnPrimaryText: { fontFamily: FONTS.bodySemiBold, fontSize: 14, color: COLORS.bg } as TextStyle,
  actionBtnSecondary: { width: 44, backgroundColor: COLORS.bgGlass } as ViewStyle,
});
