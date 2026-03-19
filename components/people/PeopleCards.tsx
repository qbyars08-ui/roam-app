// =============================================================================
// ROAM — People Tab Sub-Components
// Extracted from app/(tabs)/people.tsx for file size management.
// =============================================================================
import React, { useCallback, useEffect, useMemo, useRef } from 'react';
import {
  Animated,
  Pressable,
  Text,
  View,
} from 'react-native';
import { useRouter } from 'expo-router';
import { useTranslation } from 'react-i18next';
import {
  ArrowRight,
  Check,
  Globe,
  MapPin,
  UserPlus,
} from 'lucide-react-native';
import * as Haptics from '../../lib/haptics';
import { COLORS, FONTS, SPACING, RADIUS, MAGAZINE } from '../../lib/constants';
import { styles } from './people-styles';
import { type TravelStyleOption, TRAVEL_STYLES, type ConnectionStatus, type MockRoamer } from './people-data';


// =============================================================================
// SUB-COMPONENT: StepIndicator
// =============================================================================
export const StepIndicator = React.memo<{ current: number; total: number }>(({ current, total }) => (
  <View style={styles.stepRow}>
    {Array.from({ length: total }, (_, i) => (
      <View
        key={i}
        style={[
          styles.stepDot,
          i < current
            ? styles.stepDotComplete
            : i === current
              ? styles.stepDotActive
              : styles.stepDotInactive,
        ]}
      />
    ))}
  </View>
));
StepIndicator.displayName = 'StepIndicator';

// =============================================================================
// SUB-COMPONENT: TravelStyleCard
// =============================================================================
export const TravelStyleCard = React.memo<{
  item: TravelStyleOption;
  selected: boolean;
  onToggle: (id: string) => void;
}>(({ item, selected, onToggle }) => {
  const handlePress = useCallback(async () => {
    await Haptics.selectionAsync();
    onToggle(item.id);
  }, [item.id, onToggle]);

  return (
    <Pressable
      onPress={handlePress}
      accessibilityLabel={`${item.label} travel style${selected ? ', selected' : ''}`}
      style={[
        styles.styleCard,
        selected ? styles.styleCardSelected : styles.styleCardUnselected,
      ]}
    >
      <View style={styles.styleCardIcon}>{item.icon}</View>
      <Text
        style={[
          styles.styleCardLabel,
          selected ? styles.styleCardLabelSelected : styles.styleCardLabelUnselected,
        ]}
        numberOfLines={2}
      >
        {item.label}
      </Text>
      {selected && (
        <View style={styles.styleCardCheck}>
          <Check size={14} color={COLORS.sage} strokeWidth={1.5} />
        </View>
      )}
    </Pressable>
  );
});
TravelStyleCard.displayName = 'TravelStyleCard';

// =============================================================================
// SUB-COMPONENT: LanguageChip
// =============================================================================
export const LanguageChip = React.memo<{
  label: string;
  selected: boolean;
  onToggle: (lang: string) => void;
}>(({ label, selected, onToggle }) => {
  const handlePress = useCallback(async () => {
    await Haptics.selectionAsync();
    onToggle(label);
  }, [label, onToggle]);

  return (
    <Pressable
      onPress={handlePress}
      accessibilityLabel={`${label}${selected ? ', selected' : ''}`}
      style={[styles.langChip, selected ? styles.langChipSelected : styles.langChipUnselected]}
    >
      <Text
        style={[
          styles.langChipText,
          selected ? styles.langChipTextSelected : styles.langChipTextUnselected,
        ]}
      >
        {label}
      </Text>
    </Pressable>
  );
});
LanguageChip.displayName = 'LanguageChip';

// =============================================================================
// SUB-COMPONENT: DestinationChip (for "ROAM This Month")
// =============================================================================
export const DestinationChip = React.memo<{
  destination: string;
  count: number;
  onPress: (dest: string) => void;
}>(({ destination, count, onPress }) => {
  const handlePress = useCallback(async () => {
    await Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
    onPress(destination);
  }, [destination, onPress]);

  return (
    <Pressable
      onPress={handlePress}
      accessibilityLabel={`${destination}, ${count} ROAMers`}
      style={({ pressed }) => [styles.destChip, pressed && styles.pressed]}
    >
      <MapPin size={14} color={COLORS.sage} strokeWidth={1.5} />
      <Text style={styles.destChipText}>{destination}</Text>
      <Text style={styles.destChipCount}>{count}</Text>
    </Pressable>
  );
});
DestinationChip.displayName = 'DestinationChip';

// =============================================================================
// SUB-COMPONENT: RoamerProfileCard
// =============================================================================
export const DemoBadge = () => {
  const { t } = useTranslation();
  return (
    <View style={{ paddingHorizontal: SPACING.sm, paddingVertical: SPACING.xs, borderRadius: RADIUS.sm, backgroundColor: COLORS.bgElevated, borderWidth: 1, borderColor: COLORS.border }}>
      <Text style={{ fontFamily: FONTS.mono, fontSize: 9, color: COLORS.creamMuted, letterSpacing: 1, textTransform: 'uppercase' }}>{t('people.demo', { defaultValue: 'Demo' })}</Text>
    </View>
  );
};

export const RoamerProfileCard = React.memo<{
  roamer: MockRoamer;
  compatibilityScore: number;
  connectionStatus: ConnectionStatus;
  onConnect: (id: string) => void;
}>(({ roamer, compatibilityScore, connectionStatus, onConnect }) => {
  const { t } = useTranslation();
  const handleConnect = useCallback(async () => {
    await Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Medium);
    onConnect(roamer.id);
  }, [roamer.id, onConnect]);

  const buttonLabel = useMemo(() => {
    if (connectionStatus === 'connected') return t('people.connected', { defaultValue: 'Connected' });
    if (connectionStatus === 'requested') return t('people.requested', { defaultValue: 'Requested' });
    return t('people.connect', { defaultValue: 'Connect' });
  }, [connectionStatus, t]);

  const buttonStyle = useMemo(() => {
    if (connectionStatus === 'connected') return styles.connectBtnConnected;
    if (connectionStatus === 'requested') return styles.connectBtnRequested;
    return styles.connectBtnDefault;
  }, [connectionStatus]);

  const buttonTextStyle = useMemo(() => {
    if (connectionStatus === 'connected') return styles.connectBtnTextConnected;
    if (connectionStatus === 'requested') return styles.connectBtnTextRequested;
    return styles.connectBtnTextDefault;
  }, [connectionStatus]);

  return (
    <View style={styles.roamerCard}>
      <View style={styles.roamerCardHeader}>
        <View style={styles.roamerNameRow}>
          <Text style={styles.roamerName}>{roamer.name}</Text>
          {roamer.isDemo && <DemoBadge />}
          <Text style={styles.roamerScore}>{compatibilityScore}%</Text>
        </View>
        <View style={styles.roamerMeta}>
          <MapPin size={12} color={COLORS.creamMuted} strokeWidth={1.5} />
          <Text style={styles.roamerCity}>{roamer.homeCity}</Text>
          {roamer.languages.length > 0 && (
            <>
              <Globe size={12} color={COLORS.creamMuted} strokeWidth={1.5} />
              <Text style={styles.roamerLangs} numberOfLines={1}>
                {roamer.languages.slice(0, 2).join(', ')}
              </Text>
            </>
          )}
        </View>
      </View>
      <View style={styles.roamerTags}>
        {roamer.travelStyles.slice(0, 3).map((travelStyle) => (
          <View key={travelStyle} style={styles.roamerTag}>
            <Text style={styles.roamerTagText}>
              {TRAVEL_STYLES.find((ts) => ts.id === travelStyle)?.label ?? travelStyle}
            </Text>
          </View>
        ))}
      </View>
      <View style={styles.roamerFooter}>
        <Text style={styles.roamerBio} numberOfLines={1}>{roamer.bio}</Text>
        <Pressable
          onPress={handleConnect}
          accessibilityLabel={`${buttonLabel} with ${roamer.name}`}
          style={({ pressed }) => [styles.connectBtn, buttonStyle, pressed && styles.pressed]}
          disabled={connectionStatus === 'connected'}
        >
          {connectionStatus === 'none' && (
            <UserPlus size={14} color={COLORS.bg} strokeWidth={1.5} />
          )}
          <Text style={[styles.connectBtnText, buttonTextStyle]}>{buttonLabel}</Text>
        </Pressable>
      </View>
    </View>
  );
});
RoamerProfileCard.displayName = 'RoamerProfileCard';

// =============================================================================
// SUB-COMPONENT: EmptyMatchState — "You'd be the first ROAMer in [city]", animated pin, Add your trip CTA
// =============================================================================
export const EmptyMatchState = React.memo<{ destination: string }>(({ destination }) => {
  const { t } = useTranslation();
  const router = useRouter();
  const pinDrop = useRef(new Animated.Value(-72)).current;
  const pinBounce = useRef(new Animated.Value(1)).current;

  useEffect(() => {
    const drop = Animated.timing(pinDrop, {
      toValue: 0,
      duration: 1600,
      useNativeDriver: true,
    });
    const bounce = Animated.sequence([
      Animated.timing(pinBounce, { toValue: 1.15, duration: 100, useNativeDriver: true }),
      Animated.spring(pinBounce, { toValue: 1, tension: 160, friction: 10, useNativeDriver: true }),
    ]);
    Animated.sequence([drop, bounce]).start();
  }, [pinDrop, pinBounce]);

  const handleAddTrip = useCallback(() => {
    Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Medium);
    router.push('/(tabs)/plan' as never);
  }, [router]);

  return (
    <View style={styles.emptyState}>
      <Animated.View style={[styles.emptyStatePinWrap, { transform: [{ translateY: pinDrop }, { scale: pinBounce }] }]}>
        <MapPin size={48} color={COLORS.sage} strokeWidth={1.5} />
      </Animated.View>
      <Text style={styles.emptyText}>
        {t('people.firstRoamer', { destination, defaultValue: `You'd be the first ROAMer in ${destination}.` })}
      </Text>
      <Text style={styles.emptySubtext}>
        {t('people.firstRoamerSub', { defaultValue: 'Add your trip and someone will find you.' })}
      </Text>
      <Pressable
        onPress={handleAddTrip}
        accessibilityLabel={t('people.addYourTrip', { defaultValue: 'Add your trip' })}
        accessibilityRole="button"
        style={({ pressed }) => [styles.addTripCta, pressed && styles.pressed]}
      >
        <Text style={styles.addTripCtaText}>{t('people.addYourTrip', { defaultValue: 'Add your trip' })}</Text>
        <ArrowRight size={18} color={COLORS.bg} strokeWidth={1.5} />
      </Pressable>
    </View>
  );
});
EmptyMatchState.displayName = 'EmptyMatchState';

// =============================================================================
// MAIN COMPONENT
// =============================================================================
