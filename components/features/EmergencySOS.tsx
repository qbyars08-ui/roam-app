// =============================================================================
// ROAM — Emergency SOS Component
// Long-press floating button → sends SMS with current location
// =============================================================================
import React, { useCallback, useEffect, useRef, useState } from 'react';
import {
  Alert,
  Animated,
  Linking,
  Pressable,
  StyleSheet,
  Text,
  TextInput,
  View,
  type TextStyle,
  type ViewStyle,
} from 'react-native';
import * as Location from 'expo-location';
import * as Haptics from '../../lib/haptics';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { COLORS, FONTS, SPACING, RADIUS } from '../../lib/constants';
import { Shield, Phone, X } from 'lucide-react-native';

// ---------------------------------------------------------------------------
// Constants
// ---------------------------------------------------------------------------
const STORAGE_KEY = '@roam/emergency_contact';
const LONG_PRESS_DURATION = 1500; // ms

// Emergency numbers by country code (ISO 3166-1 alpha-2)
const EMERGENCY_NUMBERS: Record<string, string> = {
  US: '911',
  CA: '911',
  GB: '999',
  AU: '000',
  NZ: '111',
  EU: '112',
  JP: '110',
  KR: '112',
  IN: '112',
  CN: '110',
  BR: '190',
  MX: '911',
  ZA: '10111',
  DEFAULT: '112',
};

// ---------------------------------------------------------------------------
// Component
// ---------------------------------------------------------------------------
interface EmergencySSOProps {
  /** Two-letter country code for the trip destination */
  countryCode?: string;
}

export default function EmergencySOS({ countryCode }: EmergencySSOProps) {
  const [expanded, setExpanded] = useState(false);
  const [emergencyContact, setEmergencyContact] = useState('');
  const [editingContact, setEditingContact] = useState(false);
  const [contactInput, setContactInput] = useState('');
  const pulseAnim = useRef(new Animated.Value(1)).current;

  // Load saved emergency contact
  useEffect(() => {
    AsyncStorage.getItem(STORAGE_KEY).then((val) => {
      if (val) setEmergencyContact(val);
    });
  }, []);

  // Pulse animation
  useEffect(() => {
    if (!expanded) return;
    const anim = Animated.loop(
      Animated.sequence([
        Animated.timing(pulseAnim, {
          toValue: 1.08,
          duration: 800,
          useNativeDriver: true,
        }),
        Animated.timing(pulseAnim, {
          toValue: 1,
          duration: 800,
          useNativeDriver: true,
        }),
      ])
    );
    anim.start();
    return () => anim.stop();
  }, [expanded, pulseAnim]);

  const saveContact = useCallback(async () => {
    const cleaned = contactInput.trim();
    if (!cleaned) return;
    await AsyncStorage.setItem(STORAGE_KEY, cleaned);
    setEmergencyContact(cleaned);
    setEditingContact(false);
    setContactInput('');
  }, [contactInput]);

  const getLocationAndSend = useCallback(
    async (phoneNumber: string) => {
      Haptics.notificationAsync(Haptics.NotificationFeedbackType.Warning);

      try {
        const { status } = await Location.requestForegroundPermissionsAsync();
        if (status !== 'granted') {
          // Send SMS without location
          const smsUrl = `sms:${phoneNumber}?body=${encodeURIComponent(
            'EMERGENCY — I need help. Sent from ROAM travel app.'
          )}`;
          await Linking.openURL(smsUrl);
          return;
        }

        const loc = await Location.getCurrentPositionAsync({
          accuracy: Location.Accuracy.High,
        });

        const mapsLink = `https://maps.google.com/?q=${loc.coords.latitude},${loc.coords.longitude}`;
        const body = `EMERGENCY — I need help!\n\nMy location: ${mapsLink}\n\nSent from ROAM travel app.`;

        const smsUrl = `sms:${phoneNumber}?body=${encodeURIComponent(body)}`;
        await Linking.openURL(smsUrl);
      } catch {
        // Fallback — open SMS without location
        const smsUrl = `sms:${phoneNumber}?body=${encodeURIComponent(
          'EMERGENCY — I need help. Sent from ROAM travel app.'
        )}`;
        Linking.openURL(smsUrl).catch(() => {});
      }
    },
    []
  );

  const handleSOSLongPress = useCallback(() => {
    if (!emergencyContact) {
      Alert.alert(
        'No Emergency Contact',
        'Set an emergency contact number first.',
        [
          { text: 'Cancel', style: 'cancel' },
          {
            text: 'Set Contact',
            onPress: () => {
              setExpanded(true);
              setEditingContact(true);
            },
          },
        ]
      );
      return;
    }

    getLocationAndSend(emergencyContact);
  }, [emergencyContact, getLocationAndSend]);

  const handleCallEmergency = useCallback(() => {
    const code = countryCode?.toUpperCase() ?? 'DEFAULT';
    const number = EMERGENCY_NUMBERS[code] ?? EMERGENCY_NUMBERS.DEFAULT;

    Alert.alert(
      `Call ${number}?`,
      `This will call the local emergency number for ${code}.`,
      [
        { text: 'Cancel', style: 'cancel' },
        {
          text: 'Call Now',
          style: 'destructive',
          onPress: () => {
            Linking.openURL(`tel:${number}`).catch(() =>
              Alert.alert('Call Failed', 'Couldn\u2019t connect the call. Try dialing the number directly.')
            );
          },
        },
      ]
    );
  }, [countryCode]);

  if (!expanded) {
    return (
      <Pressable
        onLongPress={handleSOSLongPress}
        delayLongPress={LONG_PRESS_DURATION}
        onPress={() => {
          Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Medium);
          setExpanded(true);
        }}
        style={({ pressed }) => [
          styles.floatingButton,
          { opacity: pressed ? 0.9 : 1, transform: [{ scale: pressed ? 0.95 : 1 }] },
        ]}
      >
        <Shield size={28} color={COLORS.cream} strokeWidth={2} />
      </Pressable>
    );
  }

  return (
    <View style={styles.expandedContainer}>
      {/* Header */}
      <View style={styles.expandedHeader}>
        <View style={{ flexDirection: 'row', alignItems: 'center', gap: SPACING.sm }}>
            <Shield size={22} color={COLORS.coral} strokeWidth={2} />
            <Text style={styles.expandedTitle}>Emergency SOS</Text>
          </View>
        <Pressable
          onPress={() => {
            setExpanded(false);
            setEditingContact(false);
          }}
          hitSlop={8}
        >
          <X size={20} color={COLORS.cream} strokeWidth={2} />
        </Pressable>
      </View>

      {/* SOS Button */}
      <Animated.View style={{ transform: [{ scale: pulseAnim }] }}>
        <Pressable
          onLongPress={handleSOSLongPress}
          delayLongPress={LONG_PRESS_DURATION}
          style={({ pressed }) => [
            styles.sosButton,
            { opacity: pressed ? 0.85 : 1 },
          ]}
        >
          <Text style={styles.sosButtonText}>SOS</Text>
          <Text style={styles.sosHint}>Hold to send location</Text>
        </Pressable>
      </Animated.View>

      {/* Emergency contact */}
      <View style={styles.contactSection}>
        <Text style={styles.contactLabel}>EMERGENCY CONTACT</Text>
        {editingContact ? (
          <View style={styles.contactEditRow}>
            <TextInput
              style={styles.contactInput}
              value={contactInput}
              onChangeText={setContactInput}
              placeholder="Phone number"
              placeholderTextColor={COLORS.creamMuted}
              keyboardType="phone-pad"
              autoFocus
            />
            <Pressable onPress={saveContact} style={styles.saveBtn}>
              <Text style={styles.saveBtnText}>Save</Text>
            </Pressable>
          </View>
        ) : (
          <Pressable
            onPress={() => {
              setEditingContact(true);
              setContactInput(emergencyContact);
            }}
          >
            <Text style={styles.contactValue}>
              {emergencyContact || 'Tap to set'}
            </Text>
          </Pressable>
        )}
      </View>

      {/* Call local emergency */}
      <Pressable
        onPress={handleCallEmergency}
        style={({ pressed }) => [
          styles.callButton,
          { opacity: pressed ? 0.85 : 1 },
        ]}
      >
        <View style={{ flexDirection: 'row', alignItems: 'center', gap: SPACING.sm }}>
          <Phone size={18} color={COLORS.cream} strokeWidth={2} />
          <Text style={styles.callButtonText}>
          Call Local Emergency (
          {EMERGENCY_NUMBERS[countryCode?.toUpperCase() ?? 'DEFAULT'] ??
            EMERGENCY_NUMBERS.DEFAULT}
          )
          </Text>
        </View>
      </Pressable>
    </View>
  );
}

// ---------------------------------------------------------------------------
// Styles
// ---------------------------------------------------------------------------
const styles = StyleSheet.create({
  floatingButton: {
    position: 'absolute',
    bottom: 100,
    right: SPACING.md,
    width: 52,
    height: 52,
    borderRadius: 26,
    backgroundColor: '#B91C1C',
    alignItems: 'center',
    justifyContent: 'center',
    zIndex: 999,
  } as ViewStyle,
  floatingButtonText: {
    fontSize: 24,
  } as TextStyle,

  expandedContainer: {
    position: 'absolute',
    bottom: 90,
    right: SPACING.md,
    left: SPACING.md,
    backgroundColor: COLORS.bgCard,
    borderRadius: RADIUS.lg,
    borderWidth: 1,
    borderColor: '#B91C1C',
    padding: SPACING.md,
    zIndex: 999,
  } as ViewStyle,
  expandedHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: SPACING.md,
  } as ViewStyle,
  expandedTitle: {
    fontFamily: FONTS.bodySemiBold,
    fontSize: 16,
    color: COLORS.cream,
  } as TextStyle,
  closeText: {
    fontSize: 16,
    color: COLORS.creamMuted,
  } as TextStyle,

  sosButton: {
    backgroundColor: '#B91C1C',
    borderRadius: RADIUS.lg,
    paddingVertical: SPACING.lg,
    alignItems: 'center',
    justifyContent: 'center',
    marginBottom: SPACING.md,
  } as ViewStyle,
  sosButtonText: {
    fontFamily: FONTS.header,
    fontSize: 36,
    color: COLORS.white,
    letterSpacing: 6,
  } as TextStyle,
  sosHint: {
    fontFamily: FONTS.mono,
    fontSize: 11,
    color: 'rgba(255,255,255,0.6)',
    marginTop: SPACING.xs,
    letterSpacing: 0.5,
  } as TextStyle,

  contactSection: {
    marginBottom: SPACING.md,
  } as ViewStyle,
  contactLabel: {
    fontFamily: FONTS.mono,
    fontSize: 10,
    color: COLORS.sage,
    letterSpacing: 1.5,
    textTransform: 'uppercase',
    marginBottom: SPACING.xs,
  } as TextStyle,
  contactValue: {
    fontFamily: FONTS.body,
    fontSize: 15,
    color: COLORS.cream,
    paddingVertical: SPACING.xs,
  } as TextStyle,
  contactEditRow: {
    flexDirection: 'row',
    gap: SPACING.sm,
    alignItems: 'center',
  } as ViewStyle,
  contactInput: {
    flex: 1,
    fontFamily: FONTS.body,
    fontSize: 15,
    color: COLORS.cream,
    backgroundColor: COLORS.bgGlass,
    borderRadius: RADIUS.sm,
    paddingHorizontal: SPACING.sm + 2,
    paddingVertical: SPACING.sm,
    borderWidth: 1,
    borderColor: COLORS.border,
  } as TextStyle,
  saveBtn: {
    backgroundColor: COLORS.sage,
    borderRadius: RADIUS.sm,
    paddingHorizontal: SPACING.md,
    paddingVertical: SPACING.sm,
  } as ViewStyle,
  saveBtnText: {
    fontFamily: FONTS.bodySemiBold,
    fontSize: 13,
    color: COLORS.bg,
  } as TextStyle,

  callButton: {
    backgroundColor: COLORS.bgGlass,
    borderRadius: RADIUS.md,
    borderWidth: 1,
    borderColor: COLORS.border,
    paddingVertical: SPACING.sm + 2,
    alignItems: 'center',
  } as ViewStyle,
  callButtonText: {
    fontFamily: FONTS.bodyMedium,
    fontSize: 14,
    color: COLORS.cream,
  } as TextStyle,
});
