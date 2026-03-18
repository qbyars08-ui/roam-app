// =============================================================================
// EmergencySection — SOS button, emergency numbers, embassy card
// =============================================================================
import React, { useCallback, useRef } from 'react';
import {
  View,
  Text,
  Pressable,
  StyleSheet,
  Animated,
  Linking,
  TouchableOpacity,
  type ViewStyle,
  type TextStyle,
} from 'react-native';
import Svg, { Circle } from 'react-native-svg';
import { useTranslation } from 'react-i18next';
import { useRouter } from 'expo-router';
import {
  ShieldAlert,
  Shield,
  Truck,
  Flame,
  MapPin,
  Phone,
  Heart,
  ChevronRight,
  type LucideIcon,
} from 'lucide-react-native';
import * as Haptics from '../../lib/haptics';
import { COLORS, FONTS, SPACING, RADIUS } from '../../lib/constants';
import type { EmergencyData } from '../../lib/prep/emergency-data';
import { sharedStyles } from './prep-shared';

const AnimatedSvgCircle = Animated.createAnimatedComponent(Circle);
const SOS_HOLD_MS = 2000;

// ---------------------------------------------------------------------------
// SOS Button (2-second hold)
// ---------------------------------------------------------------------------
function SOSButton({
  onActivate,
  emergency: _emergency,
}: {
  onActivate: () => void;
  emergency: EmergencyData | null;
}) {
  const { t } = useTranslation();
  const progress = useRef(new Animated.Value(0)).current;
  const pulse = useRef(new Animated.Value(1)).current;
  const hasActivated = useRef(false);
  const circ = 2 * Math.PI * 76;

  const handlePressIn = useCallback(() => {
    if (hasActivated.current) return;
    Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Heavy);
    progress.setValue(0);
    Animated.timing(progress, {
      toValue: 1,
      duration: SOS_HOLD_MS,
      useNativeDriver: false,
    }).start(({ finished }) => {
      if (finished && !hasActivated.current) {
        hasActivated.current = true;
        Haptics.notificationAsync(Haptics.NotificationFeedbackType.Error);
        onActivate();
        Animated.loop(
          Animated.sequence([
            Animated.timing(pulse, {
              toValue: 0.7,
              duration: 400,
              useNativeDriver: true,
            }),
            Animated.timing(pulse, {
              toValue: 1,
              duration: 400,
              useNativeDriver: true,
            }),
          ])
        ).start();
      }
    });
  }, [onActivate, progress, pulse]);

  const handlePressOut = useCallback(() => {
    if (hasActivated.current) return;
    progress.stopAnimation();
    progress.setValue(0);
  }, [progress]);

  const strokeDashoffset = progress.interpolate({
    inputRange: [0, 1],
    outputRange: [circ, 0],
  });

  return (
    <View style={styles.sosWrap}>
      <Text style={styles.sosInstruction}>{t('prep.holdToActivate', { defaultValue: 'Hold 2 seconds to activate' })}</Text>
      <Pressable
        onPressIn={handlePressIn}
        onPressOut={handlePressOut}
        style={({ pressed }) => [styles.sosButton, pressed && { opacity: 0.9 }]}
        accessibilityLabel="SOS emergency button — hold for 2 seconds to activate"
        accessibilityRole="button"
        accessibilityHint="Hold for 2 seconds to call emergency services"
      >
        <Animated.View style={[styles.sosButtonInner, { opacity: pulse }]}>
          <ShieldAlert size={48} color={COLORS.bg} />
          <Text style={styles.sosButtonLabel}>{t('prep.holdForSOS', { defaultValue: 'Hold for SOS' })}</Text>
        </Animated.View>
        <View style={styles.sosProgressRing} pointerEvents="none">
          <Svg width={160} height={160}>
            <Circle
              cx={80}
              cy={80}
              r={76}
              stroke={COLORS.overlay}
              strokeWidth={6}
              fill="transparent"
            />
            <AnimatedSvgCircle
              cx={80}
              cy={80}
              r={76}
              stroke={COLORS.cream}
              strokeWidth={6}
              fill="transparent"
              strokeDasharray={circ}
              strokeDashoffset={strokeDashoffset}
              strokeLinecap="round"
              transform="rotate(-90 80 80)"
            />
          </Svg>
        </View>
      </Pressable>
    </View>
  );
}

// ---------------------------------------------------------------------------
// Emergency Numbers Strip
// ---------------------------------------------------------------------------
function EmergencyNumbers({ data }: { data: EmergencyData }) {
  const { t } = useTranslation();
  const openTel = useCallback((num: string) => {
    Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Heavy);
    Linking.openURL(`tel:${num.replace(/\s/g, '')}`).catch(() => {});
  }, []);

  const rows: Array<{ icon: LucideIcon; label: string; number: string }> = [
    { icon: Shield, label: t('prep.police', { defaultValue: 'Police' }), number: data.police },
    { icon: Truck, label: t('prep.ambulance', { defaultValue: 'Ambulance' }), number: data.ambulance },
    { icon: Flame, label: t('prep.fire', { defaultValue: 'Fire' }), number: data.fire },
  ];

  return (
    <View style={emergencyStripStyles.container}>
      <Text style={emergencyStripStyles.label}>{t('prep.emergencyLabel', { defaultValue: 'EMERGENCY' })}</Text>
      <View style={emergencyStripStyles.row}>
        {rows.map((r) => (
          <TouchableOpacity
            key={r.label}
            style={emergencyStripStyles.item}
            onPress={() => openTel(r.number)}
            activeOpacity={0.7}
            accessibilityLabel={`Call ${r.label}: ${r.number}`}
            accessibilityRole="button"
            accessibilityHint={`Dials ${r.number}`}
          >
            <r.icon size={16} color={COLORS.coral} />
            <Text style={emergencyStripStyles.itemLabel}>{r.label}</Text>
            <Text style={emergencyStripStyles.itemNumber}>{r.number}</Text>
          </TouchableOpacity>
        ))}
      </View>
    </View>
  );
}

const emergencyStripStyles = StyleSheet.create({
  container: {
    backgroundColor: COLORS.bgMagazine,
    borderLeftWidth: 3,
    borderLeftColor: COLORS.coral,
    borderRadius: RADIUS.lg,
    padding: SPACING.md,
    marginBottom: SPACING.lg,
  } as ViewStyle,
  label: {
    fontFamily: FONTS.mono,
    fontSize: 10,
    color: COLORS.coral,
    letterSpacing: 1.5,
    marginBottom: 12,
  } as TextStyle,
  row: {
    flexDirection: 'row',
    justifyContent: 'space-between',
  } as ViewStyle,
  item: {
    flex: 1,
    alignItems: 'center',
    gap: SPACING.xs,
  } as ViewStyle,
  itemLabel: {
    fontFamily: FONTS.body,
    fontSize: 12,
    color: COLORS.creamSoft,
  } as TextStyle,
  itemNumber: {
    fontFamily: FONTS.mono,
    fontSize: 18,
    color: COLORS.cream,
  } as TextStyle,
});

// ---------------------------------------------------------------------------
// Embassy Card
// ---------------------------------------------------------------------------
function EmbassyCard({ data }: { data: EmergencyData }) {
  const { t } = useTranslation();
  const openTel = useCallback(() => {
    Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Heavy);
    Linking.openURL(`tel:${data.usEmbassy.phone.replace(/\s/g, '')}`).catch(() => {});
  }, [data.usEmbassy.phone]);

  const openMap = useCallback(() => {
    Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
    const query = encodeURIComponent(`US Embassy ${data.usEmbassy.city} ${data.usEmbassy.address}`);
    Linking.openURL(`https://www.google.com/maps/search/${query}`).catch(() => {});
  }, [data.usEmbassy.city, data.usEmbassy.address]);

  return (
    <View style={styles.embassyCard}>
      <Text style={styles.embassyLabel}>{t('prep.nearestEmbassy', { defaultValue: 'Nearest Embassy' })}</Text>
      <Text style={styles.embassyName}>{`US Embassy — ${data.usEmbassy.city}`}</Text>
      <TouchableOpacity
        style={styles.embassyAddressRow}
        onPress={openMap}
        activeOpacity={0.7}
        accessibilityLabel={`Open map to US Embassy at ${data.usEmbassy.address}`}
        accessibilityRole="link"
      >
        <MapPin size={12} color={COLORS.sage} />
        <Text style={[styles.embassyAddress, { color: COLORS.sage }]}>{data.usEmbassy.address}</Text>
      </TouchableOpacity>
      <TouchableOpacity
        style={styles.embassyPhoneRow}
        onPress={openTel}
        activeOpacity={0.7}
        accessibilityLabel={`Call US Embassy: ${data.usEmbassy.phone}`}
        accessibilityRole="button"
        accessibilityHint={`Dials ${data.usEmbassy.phone}`}
      >
        <Text style={styles.embassyPhone}>{data.usEmbassy.phone}</Text>
        <Phone size={14} color={COLORS.sage} />
      </TouchableOpacity>
    </View>
  );
}

// ---------------------------------------------------------------------------
// Exported composite: EmergencySection
// ---------------------------------------------------------------------------
type Props = {
  emergency: EmergencyData | null;
  destination: string;
};

export default function EmergencySection({ emergency, destination }: Props) {
  const { t } = useTranslation();
  const router = useRouter();

  return (
    <View style={sharedStyles.tabContent}>
      <SOSButton onActivate={() => {}} emergency={emergency} />
      {emergency ? (
        <>
          <EmergencyNumbers data={emergency} />
          <EmbassyCard data={emergency} />
        </>
      ) : (
        <Text style={sharedStyles.noDataText}>
          {`Emergency numbers not available for ${destination}. Select another destination.`}
        </Text>
      )}

      {/* Emergency Medical Card CTA */}
      <Pressable
        onPress={() => {
          Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Medium);
          router.push({ pathname: '/emergency-card', params: { destination } } as never);
        }}
        style={({ pressed }) => [
          sharedStyles.bodyIntelCta,
          { borderLeftColor: COLORS.coral },
          pressed && { opacity: 0.7 },
        ]}
        accessibilityLabel="Open Emergency Medical Card — your allergies, meds and blood type in local language"
        accessibilityRole="button"
      >
        <Heart size={20} color={COLORS.coral} />
        <View style={{ flex: 1 }}>
          <Text style={[sharedStyles.bodyIntelCtaTitle, { color: COLORS.coral }]}>{t('prep.emergencyMedicalCard', { defaultValue: 'Emergency Medical Card' })}</Text>
          <Text style={sharedStyles.bodyIntelCtaSubtitle}>
            {t('prep.emergencyMedicalCardDesc', { defaultValue: 'One-tap card with your allergies, meds & blood type in local language' })}
          </Text>
        </View>
        <ChevronRight size={18} color={COLORS.creamMuted} />
      </Pressable>
    </View>
  );
}

const styles = StyleSheet.create({
  sosWrap: {
    alignItems: 'center',
    marginBottom: SPACING.xl,
  } as ViewStyle,
  sosInstruction: {
    fontFamily: FONTS.body,
    fontSize: 12,
    color: COLORS.creamMuted,
    marginBottom: SPACING.sm,
  } as TextStyle,
  sosButton: {
    width: 160,
    height: 160,
    borderRadius: RADIUS.pill,
    backgroundColor: COLORS.coral,
    alignItems: 'center',
    justifyContent: 'center',
  } as ViewStyle,
  sosButtonInner: {
    alignItems: 'center',
    justifyContent: 'center',
  } as ViewStyle,
  sosButtonLabel: {
    fontFamily: FONTS.body,
    fontSize: 12,
    color: COLORS.bg,
    marginTop: SPACING.xs,
  } as TextStyle,
  sosProgressRing: {
    position: 'absolute',
  } as ViewStyle,
  embassyCard: {
    backgroundColor: COLORS.bgMagazine,
    borderRadius: RADIUS.lg,
    borderLeftWidth: 3,
    borderLeftColor: COLORS.sage,
    padding: SPACING.md,
  } as ViewStyle,
  embassyLabel: {
    fontFamily: FONTS.mono,
    fontSize: 11,
    color: COLORS.sage,
    marginBottom: SPACING.xs,
  } as TextStyle,
  embassyName: {
    fontFamily: FONTS.header,
    fontSize: 18,
    color: COLORS.cream,
    marginBottom: SPACING.sm,
  } as TextStyle,
  embassyAddressRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: SPACING.sm,
    marginBottom: SPACING.xs,
  } as ViewStyle,
  embassyAddress: {
    fontFamily: FONTS.body,
    fontSize: 12,
    color: COLORS.creamMuted,
    flex: 1,
  } as TextStyle,
  embassyPhoneRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
  } as ViewStyle,
  embassyPhone: {
    fontFamily: FONTS.mono,
    fontSize: 14,
    color: COLORS.cream,
  } as TextStyle,
});
