// =============================================================================
// ROAM — I Am Here Now
// The lifeline card. Emergency numbers as real tap-to-call buttons.
// Hotel address in local script with "Show to driver" full-screen mode.
// This is the screen someone opens when they're scared and lost.
// It needs to work instantly. No loading. No network.
// =============================================================================

import React, { useCallback, useMemo, useState } from 'react';
import {
  View,
  Text,
  Pressable,
  StyleSheet,
  Linking,
  Modal,
  type ViewStyle,
  type TextStyle,
} from 'react-native';
import {
  Phone,
  Shield,
  Truck,
  Flame,
  MapPin,
  Maximize2,
  X,
  Navigation,
} from 'lucide-react-native';
import * as Haptics from '../../lib/haptics';
import { COLORS, FONTS, SPACING, RADIUS } from '../../lib/constants';
import {
  getEmergencyForDestination,
  type EmergencyData,
} from '../../lib/prep/emergency-data';

// ---------------------------------------------------------------------------
// Types
// ---------------------------------------------------------------------------
interface IAmHereNowProps {
  destination: string;
  /** Hotel/accommodation address (from itinerary or user input) */
  hotelAddress?: string;
  /** Hotel name */
  hotelName?: string;
  /** Address in local script (for showing to drivers) */
  localScriptAddress?: string;
}

// ---------------------------------------------------------------------------
// Component
// ---------------------------------------------------------------------------
export default function IAmHereNow({
  destination,
  hotelAddress,
  hotelName,
  localScriptAddress,
}: IAmHereNowProps) {
  const [showDriverMode, setShowDriverMode] = useState(false);
  const emergency = useMemo(
    () => getEmergencyForDestination(destination),
    [destination]
  );

  const callNumber = useCallback((number: string) => {
    Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Heavy);
    Linking.openURL(`tel:${number.replace(/\s/g, '')}`).catch(() => {});
  }, []);

  const openMaps = useCallback(() => {
    Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Medium);
    const address = hotelAddress ?? hotelName ?? destination;
    const query = encodeURIComponent(address);
    Linking.openURL(`https://www.google.com/maps/search/${query}`).catch(() => {});
  }, [hotelAddress, hotelName, destination]);

  const handleShowDriver = useCallback(() => {
    Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Medium);
    setShowDriverMode(true);
  }, []);

  if (!emergency) return null;

  const emergencyRows = [
    { icon: Shield, label: 'Police', number: emergency.police, color: COLORS.sage },
    { icon: Truck, label: 'Ambulance', number: emergency.ambulance, color: COLORS.coral },
    { icon: Flame, label: 'Fire', number: emergency.fire, color: COLORS.gold },
  ];

  const displayAddress = localScriptAddress ?? hotelAddress ?? hotelName;

  return (
    <>
      <View style={styles.container}>
        {/* Header */}
        <View style={styles.header}>
          <Text style={styles.headerLabel}>I AM HERE NOW</Text>
          <Text style={styles.headerDest}>{destination}</Text>
        </View>

        {/* Emergency call buttons — big, obvious, tap-to-call */}
        <View style={styles.callGrid}>
          {emergencyRows.map((row) => (
            <Pressable
              key={row.label}
              onPress={() => callNumber(row.number)}
              style={({ pressed }) => [
                styles.callButton,
                { borderColor: row.color },
                pressed && { opacity: 0.8, transform: [{ scale: 0.97 }] },
              ]}
            >
              <View style={[styles.callIconWrap, { backgroundColor: row.color + '20' }]}>
                <row.icon size={20} color={row.color} strokeWidth={2} />
              </View>
              <Text style={styles.callLabel}>{row.label}</Text>
              <View style={styles.callNumberRow}>
                <Phone size={14} color={COLORS.cream} strokeWidth={2} />
                <Text style={styles.callNumber}>{row.number}</Text>
              </View>
            </Pressable>
          ))}
        </View>

        {/* Hotel / accommodation address */}
        {displayAddress && (
          <View style={styles.addressSection}>
            <View style={styles.addressHeader}>
              <MapPin size={16} color={COLORS.sage} strokeWidth={2} />
              <Text style={styles.addressLabel}>
                {hotelName ?? 'Your accommodation'}
              </Text>
            </View>

            <Text style={styles.addressText}>
              {displayAddress}
            </Text>

            <View style={styles.addressActions}>
              {/* Navigate button */}
              <Pressable
                onPress={openMaps}
                style={({ pressed }) => [
                  styles.addressBtn,
                  pressed && { opacity: 0.8 },
                ]}
              >
                <Navigation size={14} color={COLORS.sage} strokeWidth={2} />
                <Text style={styles.addressBtnText}>Navigate</Text>
              </Pressable>

              {/* Show to driver button */}
              <Pressable
                onPress={handleShowDriver}
                style={({ pressed }) => [
                  styles.showDriverBtn,
                  pressed && { opacity: 0.8 },
                ]}
              >
                <Maximize2 size={14} color={COLORS.bg} strokeWidth={2} />
                <Text style={styles.showDriverBtnText}>Show to driver</Text>
              </Pressable>
            </View>
          </View>
        )}

        {/* US Embassy quick call */}
        {emergency.usEmbassy && (
          <Pressable
            onPress={() => callNumber(emergency.usEmbassy.phone)}
            style={({ pressed }) => [
              styles.embassyRow,
              pressed && { opacity: 0.8 },
            ]}
          >
            <Shield size={16} color={COLORS.creamMuted} strokeWidth={2} />
            <View style={{ flex: 1 }}>
              <Text style={styles.embassyLabel}>US Embassy — {emergency.usEmbassy.city}</Text>
              <Text style={styles.embassyPhone}>{emergency.usEmbassy.phone}</Text>
            </View>
            <Phone size={16} color={COLORS.sage} strokeWidth={2} />
          </Pressable>
        )}
      </View>

      {/* Full-screen "Show to driver" modal */}
      <Modal
        visible={showDriverMode}
        animationType="fade"
        presentationStyle="fullScreen"
        statusBarTranslucent
      >
        <Pressable
          style={styles.driverModal}
          onPress={() => setShowDriverMode(false)}
        >
          {/* Close button */}
          <Pressable
            onPress={() => setShowDriverMode(false)}
            style={styles.driverClose}
          >
            <X size={24} color={COLORS.creamDim} strokeWidth={2} />
          </Pressable>

          {/* Address in large text */}
          <View style={styles.driverContent}>
            <Text style={styles.driverLabel}>
              {hotelName ? hotelName.toUpperCase() : 'ACCOMMODATION'}
            </Text>
            <Text style={styles.driverAddress}>
              {displayAddress}
            </Text>
            {localScriptAddress && hotelAddress && localScriptAddress !== hotelAddress && (
              <Text style={styles.driverAddressLocal}>
                {hotelAddress}
              </Text>
            )}
            <Text style={styles.driverTapHint}>Tap anywhere to close</Text>
          </View>
        </Pressable>
      </Modal>
    </>
  );
}

// ---------------------------------------------------------------------------
// Styles
// ---------------------------------------------------------------------------
const styles = StyleSheet.create({
  container: {
    marginHorizontal: SPACING.md,
    marginBottom: SPACING.lg,
    backgroundColor: COLORS.bgCard,
    borderRadius: RADIUS.lg,
    borderWidth: 1,
    borderColor: COLORS.border,
    overflow: 'hidden',
  } as ViewStyle,

  // Header
  header: {
    padding: SPACING.md,
    borderBottomWidth: 1,
    borderBottomColor: COLORS.border,
  } as ViewStyle,
  headerLabel: {
    fontFamily: FONTS.mono,
    fontSize: 10,
    color: COLORS.sage,
    letterSpacing: 2,
    marginBottom: 4,
  } as TextStyle,
  headerDest: {
    fontFamily: FONTS.header,
    fontSize: 24,
    color: COLORS.cream,
  } as TextStyle,

  // Emergency call buttons
  callGrid: {
    flexDirection: 'row',
    padding: SPACING.md,
    gap: SPACING.sm,
  } as ViewStyle,
  callButton: {
    flex: 1,
    backgroundColor: COLORS.bgElevated,
    borderRadius: RADIUS.md,
    borderWidth: 1,
    padding: SPACING.sm,
    alignItems: 'center',
    gap: 6,
    minHeight: 90,
    justifyContent: 'center',
  } as ViewStyle,
  callIconWrap: {
    width: 36,
    height: 36,
    borderRadius: 18,
    alignItems: 'center',
    justifyContent: 'center',
  } as ViewStyle,
  callLabel: {
    fontFamily: FONTS.mono,
    fontSize: 10,
    color: COLORS.creamMuted,
    letterSpacing: 1,
    textTransform: 'uppercase',
  } as TextStyle,
  callNumberRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
  } as ViewStyle,
  callNumber: {
    fontFamily: FONTS.bodySemiBold,
    fontSize: 16,
    color: COLORS.cream,
  } as TextStyle,

  // Address section
  addressSection: {
    padding: SPACING.md,
    borderTopWidth: 1,
    borderTopColor: COLORS.border,
  } as ViewStyle,
  addressHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
    marginBottom: SPACING.sm,
  } as ViewStyle,
  addressLabel: {
    fontFamily: FONTS.bodySemiBold,
    fontSize: 14,
    color: COLORS.cream,
  } as TextStyle,
  addressText: {
    fontFamily: FONTS.body,
    fontSize: 15,
    color: COLORS.creamBright,
    lineHeight: 22,
    marginBottom: SPACING.md,
  } as TextStyle,
  addressActions: {
    flexDirection: 'row',
    gap: SPACING.sm,
  } as ViewStyle,
  addressBtn: {
    flex: 1,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 6,
    backgroundColor: COLORS.bgElevated,
    borderRadius: RADIUS.md,
    borderWidth: 1,
    borderColor: COLORS.sageBorder,
    paddingVertical: 10,
  } as ViewStyle,
  addressBtnText: {
    fontFamily: FONTS.bodySemiBold,
    fontSize: 13,
    color: COLORS.sage,
  } as TextStyle,
  showDriverBtn: {
    flex: 1,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 6,
    backgroundColor: COLORS.sage,
    borderRadius: RADIUS.md,
    paddingVertical: 10,
  } as ViewStyle,
  showDriverBtnText: {
    fontFamily: FONTS.bodySemiBold,
    fontSize: 13,
    color: COLORS.bg,
  } as TextStyle,

  // Embassy row
  embassyRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: SPACING.sm,
    padding: SPACING.md,
    borderTopWidth: 1,
    borderTopColor: COLORS.border,
  } as ViewStyle,
  embassyLabel: {
    fontFamily: FONTS.body,
    fontSize: 13,
    color: COLORS.creamMuted,
  } as TextStyle,
  embassyPhone: {
    fontFamily: FONTS.mono,
    fontSize: 12,
    color: COLORS.cream,
    marginTop: 2,
  } as TextStyle,

  // Driver mode modal
  driverModal: {
    flex: 1,
    backgroundColor: COLORS.bg,
    justifyContent: 'center',
    alignItems: 'center',
    padding: SPACING.xl,
  } as ViewStyle,
  driverClose: {
    position: 'absolute',
    top: 60,
    right: SPACING.lg,
    width: 44,
    height: 44,
    alignItems: 'center',
    justifyContent: 'center',
  } as ViewStyle,
  driverContent: {
    alignItems: 'center',
    maxWidth: '90%',
  } as ViewStyle,
  driverLabel: {
    fontFamily: FONTS.mono,
    fontSize: 12,
    color: COLORS.sage,
    letterSpacing: 3,
    marginBottom: SPACING.lg,
  } as TextStyle,
  driverAddress: {
    fontFamily: FONTS.header,
    fontSize: 36,
    color: COLORS.cream,
    textAlign: 'center',
    lineHeight: 46,
    marginBottom: SPACING.md,
  } as TextStyle,
  driverAddressLocal: {
    fontFamily: FONTS.body,
    fontSize: 18,
    color: COLORS.creamMuted,
    textAlign: 'center',
    lineHeight: 26,
    marginBottom: SPACING.lg,
  } as TextStyle,
  driverTapHint: {
    fontFamily: FONTS.mono,
    fontSize: 11,
    color: COLORS.creamDim,
    marginTop: SPACING.xxl,
  } as TextStyle,
});
