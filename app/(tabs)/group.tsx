// =============================================================================
// ROAM — Group + Currency screen
// Group: shared trip planning + expense splitting
// Currency: live exchange rates + offline fallback + budget tracker
// =============================================================================
import React, { useCallback, useEffect, useMemo, useRef, useState } from 'react';
import { useTranslation } from 'react-i18next';
import {
  ActivityIndicator,
  Animated,
  Modal,
  Pressable,
  ScrollView,
  StyleSheet,
  Text,
  TextInput,
  View,
  type TextStyle,
  type ViewStyle,
} from 'react-native';
import NetInfo from '@react-native-community/netinfo';
import { useRouter } from 'expo-router';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import {
  AlertTriangle,
  ArrowUpDown,
  Bed,
  Clock,
  Coffee,
  MapPin,
  MoreHorizontal,
  Navigation,
  Plane,
  Plus,
  Shield,
  ShoppingBag,
  UserPlus,
  Utensils,
  Users,
  Wallet,
  WifiOff,
} from 'lucide-react-native';

import { COLORS, FONTS, SPACING, RADIUS } from '../../lib/constants';
import { useAppStore, getActiveTrip } from '../../lib/store';
import { getCurrencySymbol } from '../../lib/currency';
import {
  type SharingDuration,
  type MemberLocation,
  SHARING_DURATION_OPTIONS,
  requestLocationPermission,
  startLocationWatch,
  stopLocationWatch,
  subscribeToLocationUpdates,
  unsubscribeFromLocationUpdates,
  getExpiresAt,
  getRemainingTime,
  getLastUpdatedLabel,
  isLocationExpired,
  hasNotMovedRecently,
} from '../../lib/location-sharing';

// ---------------------------------------------------------------------------
// Types
// ---------------------------------------------------------------------------
interface GroupMember {
  id: string;
  name: string;
  initials: string;
}

type ExpenseCategory = 'food' | 'accommodation' | 'flights' | 'cafe' | 'shopping' | 'other';

interface Expense {
  id: string;
  description: string;
  amount: number;
  currency: string;
  paidBy: string;
  splitBetween: string[];
  category: ExpenseCategory;
  createdAt: Date;
  day?: number;
}

interface Balance {
  fromMember: string;
  toMember: string;
  amount: number;
  currency: string;
}

interface ExchangeRatesState {
  base: string;
  rates: Record<string, number>;
  lastUpdated: Date;
  isLive: boolean;
}

interface CurrencyInfo {
  code: string;
  name: string;
  countryCode: string;
}

// ---------------------------------------------------------------------------
// FALLBACK_RATES — offline / API failure
// ---------------------------------------------------------------------------
const FALLBACK_RATES: Record<string, number> = {
  EUR: 0.92,
  GBP: 0.79,
  JPY: 149.5,
  AUD: 1.53,
  CAD: 1.36,
  CHF: 0.89,
  CNY: 7.24,
  INR: 83.12,
  MXN: 17.05,
  BRL: 4.97,
  KRW: 1325.0,
  SGD: 1.34,
  THB: 35.2,
  VND: 24500,
  IDR: 15600,
  PHP: 56.8,
  MYR: 4.72,
  HKD: 7.82,
  NZD: 1.63,
  ZAR: 18.75,
  AED: 3.67,
  TRY: 32.1,
  PLN: 4.02,
  SEK: 10.42,
  NOK: 10.68,
  DKK: 6.89,
  CZK: 23.1,
  HUF: 355.0,
  RON: 4.67,
  CLP: 950.0,
};

// ---------------------------------------------------------------------------
// Mock data
// ---------------------------------------------------------------------------
const MOCK_MEMBERS: GroupMember[] = [
  { id: '1', name: 'Alex', initials: 'AX' },
  { id: '2', name: 'Jordan', initials: 'JR' },
  { id: '3', name: 'Sam', initials: 'SM' },
  { id: '4', name: 'You', initials: 'YO' },
];

const MOCK_EXPENSES: Expense[] = [
  {
    id: 'e1',
    description: 'Dinner at Nobu',
    amount: 148,
    currency: 'USD',
    paidBy: 'Alex',
    splitBetween: ['Alex', 'Jordan', 'Sam', 'You'],
    category: 'food',
    createdAt: new Date(),
    day: 1,
  },
  {
    id: 'e2',
    description: 'Hostel Night 2',
    amount: 72,
    currency: 'USD',
    paidBy: 'Jordan',
    splitBetween: ['Alex', 'Jordan', 'Sam', 'You'],
    category: 'accommodation',
    createdAt: new Date(),
    day: 2,
  },
  {
    id: 'e3',
    description: 'Airport taxi',
    amount: 38.5,
    currency: 'USD',
    paidBy: 'You',
    splitBetween: ['Alex', 'Jordan', 'Sam', 'You'],
    category: 'flights',
    createdAt: new Date(),
    day: 1,
  },
  {
    id: 'e4',
    description: 'Lunch at market',
    amount: 3500,
    currency: 'JPY',
    paidBy: 'Sam',
    splitBetween: ['Alex', 'Jordan', 'Sam', 'You'],
    category: 'food',
    createdAt: new Date(),
    day: 2,
  },
];

const MOCK_BALANCES: Balance[] = [
  { fromMember: 'Alex', toMember: 'You', amount: 18.25, currency: 'USD' },
  { fromMember: 'Sam', toMember: 'Jordan', amount: 12, currency: 'USD' },
];

const POPULAR_PAIRS: [string, string][] = [
  ['USD', 'EUR'],
  ['USD', 'GBP'],
  ['USD', 'JPY'],
  ['USD', 'AUD'],
  ['USD', 'CAD'],
  ['USD', 'MXN'],
];

const CURRENCY_LIST: CurrencyInfo[] = [
  { code: 'USD', name: 'US Dollar', countryCode: 'US' },
  { code: 'EUR', name: 'Euro', countryCode: 'EU' },
  { code: 'GBP', name: 'British Pound', countryCode: 'GB' },
  { code: 'JPY', name: 'Japanese Yen', countryCode: 'JP' },
  { code: 'AUD', name: 'Australian Dollar', countryCode: 'AU' },
  { code: 'CAD', name: 'Canadian Dollar', countryCode: 'CA' },
  { code: 'CHF', name: 'Swiss Franc', countryCode: 'CH' },
  { code: 'CNY', name: 'Chinese Yuan', countryCode: 'CN' },
  { code: 'INR', name: 'Indian Rupee', countryCode: 'IN' },
  { code: 'MXN', name: 'Mexican Peso', countryCode: 'MX' },
  { code: 'BRL', name: 'Brazilian Real', countryCode: 'BR' },
  { code: 'KRW', name: 'South Korean Won', countryCode: 'KR' },
  { code: 'SGD', name: 'Singapore Dollar', countryCode: 'SG' },
  { code: 'THB', name: 'Thai Baht', countryCode: 'TH' },
  { code: 'HKD', name: 'Hong Kong Dollar', countryCode: 'HK' },
  { code: 'NZD', name: 'New Zealand Dollar', countryCode: 'NZ' },
  { code: 'ZAR', name: 'South African Rand', countryCode: 'ZA' },
  { code: 'TRY', name: 'Turkish Lira', countryCode: 'TR' },
  { code: 'SEK', name: 'Swedish Krona', countryCode: 'SE' },
  { code: 'NOK', name: 'Norwegian Krone', countryCode: 'NO' },
  { code: 'DKK', name: 'Danish Krone', countryCode: 'DK' },
  { code: 'PLN', name: 'Polish Zloty', countryCode: 'PL' },
  { code: 'CZK', name: 'Czech Koruna', countryCode: 'CZ' },
  { code: 'HUF', name: 'Hungarian Forint', countryCode: 'HU' },
  { code: 'PHP', name: 'Philippine Peso', countryCode: 'PH' },
  { code: 'MYR', name: 'Malaysian Ringgit', countryCode: 'MY' },
  { code: 'IDR', name: 'Indonesian Rupiah', countryCode: 'ID' },
  { code: 'VND', name: 'Vietnamese Dong', countryCode: 'VN' },
  { code: 'AED', name: 'UAE Dirham', countryCode: 'AE' },
  { code: 'CLP', name: 'Chilean Peso', countryCode: 'CL' },
  { code: 'ARS', name: 'Argentine Peso', countryCode: 'AR' },
  { code: 'COP', name: 'Colombian Peso', countryCode: 'CO' },
  { code: 'RON', name: 'Romanian Leu', countryCode: 'RO' },
];

function convertToHome(
  amount: number,
  fromCurrency: string,
  homeCurrency: string,
  rates: Record<string, number>
): number {
  const fromRate = rates[fromCurrency] ?? 1;
  const homeRate = rates[homeCurrency] ?? 1;
  return (amount / fromRate) * homeRate;
}

function formatExpenseAmount(amount: number, currency: string): string {
  if (currency === 'JPY' || currency === 'KRW' || currency === 'VND' || currency === 'IDR') {
    return amount.toLocaleString('en-US', { maximumFractionDigits: 0 });
  }
  return amount.toFixed(2);
}

function BudgetTrackerCard({
  expenses,
  dailyBudget,
  homeCurrency,
  rates,
  tripDays: tripDaysProp,
}: {
  expenses: Expense[];
  dailyBudget: number;
  homeCurrency: string;
  rates: Record<string, number>;
  tripDays: number;
}) {
  const { t } = useTranslation();
  const totalSpent = expenses.reduce(
    (sum, e) => sum + convertToHome(e.amount, e.currency, homeCurrency, rates),
    0
  );
  const tripDays = tripDaysProp > 0 ? tripDaysProp : Math.max(...expenses.map((e) => e.day ?? 1), 1);
  const tripBudget = dailyBudget * tripDays;
  const remaining = Math.max(0, tripBudget - totalSpent);

  const byDay = expenses.reduce<Record<number, number>>((acc, e) => {
    const d = e.day ?? 1;
    acc[d] = (acc[d] ?? 0) + convertToHome(e.amount, e.currency, homeCurrency, rates);
    return acc;
  }, {});

  const byCategory = expenses.reduce<Record<ExpenseCategory, number>>(
    (acc, e) => {
      const amt = convertToHome(e.amount, e.currency, homeCurrency, rates);
      acc[e.category] = (acc[e.category] ?? 0) + amt;
      return acc;
    },
    {} as Record<ExpenseCategory, number>
  );

  const catLabels: Record<ExpenseCategory, string> = {
    food: 'Food',
    accommodation: 'Accommodation',
    flights: 'Flights',
    cafe: 'Cafe',
    shopping: 'Shopping',
    other: 'Other',
  };

  return (
    <View style={styles.budgetTrackerCard}>
      <View style={styles.budgetTrackerRow}>
        <Text style={styles.budgetTrackerLabel}>{t('groupTab.totalSpent')}</Text>
        <Text style={styles.budgetTrackerValue}>
          {getCurrencySymbol(homeCurrency)}
          {totalSpent.toFixed(2)}
        </Text>
      </View>
      <View style={styles.budgetTrackerRow}>
        <Text style={styles.budgetTrackerLabel}>{t('groupTab.tripBudget')}</Text>
        <Text style={styles.budgetTrackerValue}>
          {getCurrencySymbol(homeCurrency)}
          {tripBudget.toFixed(0)}
        </Text>
      </View>
      <View style={styles.budgetTrackerRow}>
        <Text style={[styles.budgetTrackerLabel, { color: COLORS.sage }]}>
          {t('groupTab.remaining')}
        </Text>
        <Text style={[styles.budgetTrackerValue, { color: COLORS.sage }]}>
          {getCurrencySymbol(homeCurrency)}
          {remaining.toFixed(2)}
        </Text>
      </View>
      <View style={styles.budgetProgressTrack}>
        <View
          style={[
            styles.budgetProgressFill,
            {
              width: `${Math.min(100, (totalSpent / tripBudget) * 100)}%`,
              backgroundColor: totalSpent > tripBudget ? COLORS.coral : COLORS.sage,
            },
          ]}
        />
      </View>
      <Text style={styles.budgetSubsection}>{t('groupTab.perDay')}</Text>
      {Object.entries(byDay)
        .sort(([a], [b]) => Number(a) - Number(b))
        .map(([day, amt]) => (
          <View key={day} style={styles.budgetTrackerRow}>
            <Text style={styles.budgetTrackerMeta}>Day {day}</Text>
            <Text style={styles.budgetTrackerMeta}>
              {getCurrencySymbol(homeCurrency)}
              {amt.toFixed(2)}
            </Text>
          </View>
        ))}
      <Text style={styles.budgetSubsection}>{t('groupTab.byCategory')}</Text>
      {Object.entries(byCategory).map(([cat, amt]) => (
        <View key={cat} style={styles.budgetTrackerRow}>
          <Text style={styles.budgetTrackerMeta}>
            {catLabels[cat as ExpenseCategory]}
          </Text>
          <Text style={styles.budgetTrackerMeta}>
            {getCurrencySymbol(homeCurrency)}
            {amt.toFixed(2)}
          </Text>
        </View>
      ))}
    </View>
  );
}

function getCategoryIcon(cat: ExpenseCategory) {
  switch (cat) {
    case 'food':
      return Utensils;
    case 'accommodation':
      return Bed;
    case 'flights':
      return Plane;
    case 'cafe':
      return Coffee;
    case 'shopping':
      return ShoppingBag;
    default:
      return MoreHorizontal;
  }
}

// ---------------------------------------------------------------------------
// Location Sharing Components
// ---------------------------------------------------------------------------
function PrivacyBanner() {
  return (
    <View style={locationStyles.privacyBanner}>
      <Shield size={14} color={COLORS.sage} strokeWidth={2} />
      <Text style={locationStyles.privacyText}>Only visible to your trip group</Text>
    </View>
  );
}

function LocationSharingCard({
  member,
  isCurrentUser,
  isSharingLocation,
  sharingExpiresAt,
  onToggleSharing,
  memberLocation,
}: {
  member: GroupMember;
  isCurrentUser: boolean;
  isSharingLocation: boolean;
  sharingExpiresAt: string | null;
  onToggleSharing: () => void;
  memberLocation: MemberLocation | null;
}) {
  const pulseAnim = useRef(new Animated.Value(1)).current;

  useEffect(() => {
    if ((isCurrentUser && isSharingLocation) || (!isCurrentUser && memberLocation?.isSharing)) {
      const animation = Animated.loop(
        Animated.sequence([
          Animated.timing(pulseAnim, { toValue: 0.4, duration: 800, useNativeDriver: true }),
          Animated.timing(pulseAnim, { toValue: 1, duration: 800, useNativeDriver: true }),
        ])
      );
      animation.start();
      return () => animation.stop();
    }
    pulseAnim.setValue(1);
  }, [isCurrentUser, isSharingLocation, memberLocation?.isSharing, pulseAnim]);

  const isActive = isCurrentUser ? isSharingLocation : (memberLocation?.isSharing ?? false);
  const showStaleAlert = memberLocation && isActive && hasNotMovedRecently(memberLocation);

  return (
    <View style={locationStyles.memberCard}>
      <View style={locationStyles.memberRow}>
        <View style={locationStyles.memberAvatarWrap}>
          <View style={[locationStyles.memberAvatar, { backgroundColor: isCurrentUser ? COLORS.sage : COLORS.gold }]}>
            <Text style={locationStyles.memberAvatarText}>{member.initials}</Text>
          </View>
          {isActive && (
            <Animated.View style={[locationStyles.pulseDot, { opacity: pulseAnim }]} />
          )}
        </View>
        <View style={locationStyles.memberInfo}>
          <Text style={locationStyles.memberName}>
            {member.name}{isCurrentUser ? ' (You)' : ''}
          </Text>
          {isActive && memberLocation && (
            <Text style={locationStyles.memberLastSeen}>
              {getLastUpdatedLabel(memberLocation.updatedAt)}
            </Text>
          )}
          {isActive && isCurrentUser && sharingExpiresAt && (
            <Text style={locationStyles.memberCountdown}>
              {getRemainingTime(sharingExpiresAt)}
            </Text>
          )}
          {!isActive && !isCurrentUser && (
            <Text style={locationStyles.memberOffline}>Location off</Text>
          )}
        </View>
        {isCurrentUser && (
          <Pressable
            style={[
              locationStyles.shareToggle,
              isActive && locationStyles.shareToggleActive,
            ]}
            onPress={onToggleSharing}
          >
            <Navigation
              size={16}
              color={isActive ? COLORS.bg : COLORS.creamMuted}
              strokeWidth={2}
            />
            <Text style={[
              locationStyles.shareToggleText,
              isActive && locationStyles.shareToggleTextActive,
            ]}>
              {isActive ? 'Sharing' : 'Share'}
            </Text>
          </Pressable>
        )}
      </View>
      {showStaleAlert && (
        <View style={locationStyles.staleAlert}>
          <AlertTriangle size={14} color={COLORS.gold} strokeWidth={2} />
          <Text style={locationStyles.staleAlertText}>
            {member.name} hasn't moved in 30+ min
          </Text>
        </View>
      )}
    </View>
  );
}

function DurationPickerModal({
  visible,
  onSelect,
  onClose,
}: {
  visible: boolean;
  onSelect: (duration: SharingDuration) => void;
  onClose: () => void;
}) {
  const { t } = useTranslation();
  return (
    <Modal visible={visible} transparent animationType="slide" onRequestClose={onClose}>
      <View style={locationStyles.durationOverlay}>
        <View style={locationStyles.durationSheet}>
          <Text style={locationStyles.durationTitle}>{t('groupTab.shareLocation')}</Text>
          <Text style={locationStyles.durationSubtitle}>
            Your location is only visible to trip members and auto-expires.
          </Text>
          {SHARING_DURATION_OPTIONS.map((opt) => (
            <Pressable
              key={opt.value}
              style={({ pressed }) => [
                locationStyles.durationOption,
                pressed && { opacity: 0.7 },
              ]}
              onPress={() => onSelect(opt.value)}
            >
              <View style={locationStyles.durationOptionLeft}>
                <Clock size={18} color={opt.value === 'off' ? COLORS.coral : COLORS.sage} strokeWidth={2} />
                <View>
                  <Text style={locationStyles.durationOptionLabel}>{opt.label}</Text>
                  <Text style={locationStyles.durationOptionDesc}>{opt.description}</Text>
                </View>
              </View>
            </Pressable>
          ))}
          <Pressable style={locationStyles.durationCancel} onPress={onClose}>
            <Text style={locationStyles.durationCancelText}>Cancel</Text>
          </Pressable>
        </View>
      </View>
    </Modal>
  );
}

function LocationMapPlaceholder({
  memberLocations,
}: {
  memberLocations: MemberLocation[];
}) {
  const activeMembers = memberLocations.filter((m) => m.isSharing && !isLocationExpired(m.expiresAt));

  if (activeMembers.length === 0) {
    return (
      <View style={locationStyles.mapPlaceholder}>
        <MapPin size={32} color={COLORS.creamMuted} strokeWidth={1.5} />
        <Text style={locationStyles.mapPlaceholderText}>
          No one is sharing their location yet
        </Text>
      </View>
    );
  }

  return (
    <View style={locationStyles.mapContainer}>
      <View style={locationStyles.mapGradient}>
        {activeMembers.map((m) => {
          const isStale = hasNotMovedRecently(m);
          return (
            <View key={m.memberId} style={locationStyles.mapPin}>
              <View style={[
                locationStyles.mapPinDot,
                { backgroundColor: isStale ? COLORS.gold : COLORS.sage },
              ]}>
                <Text style={locationStyles.mapPinInitials}>{m.memberInitials}</Text>
              </View>
              <Text style={locationStyles.mapPinLabel}>
                {getLastUpdatedLabel(m.updatedAt)}
              </Text>
            </View>
          );
        })}
      </View>
      <Text style={locationStyles.mapNote}>
        Full map view coming soon
      </Text>
    </View>
  );
}

const locationStyles = StyleSheet.create({
  privacyBanner: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
    backgroundColor: COLORS.sageSubtle,
    borderRadius: RADIUS.sm,
    paddingVertical: 8,
    paddingHorizontal: 12,
    marginBottom: SPACING.md,
  } as ViewStyle,
  privacyText: {
    fontFamily: FONTS.body,
    fontSize: 12,
    color: COLORS.sage,
  } as TextStyle,
  memberCard: {
    backgroundColor: COLORS.bgCard,
    borderRadius: RADIUS.md,
    padding: SPACING.md,
    marginBottom: SPACING.sm,
  } as ViewStyle,
  memberRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: SPACING.md,
  } as ViewStyle,
  memberAvatarWrap: {
    position: 'relative',
  } as ViewStyle,
  memberAvatar: {
    width: 40,
    height: 40,
    borderRadius: 20,
    alignItems: 'center',
    justifyContent: 'center',
  } as ViewStyle,
  memberAvatarText: {
    fontFamily: FONTS.bodySemiBold,
    fontSize: 12,
    color: COLORS.bg,
  } as TextStyle,
  pulseDot: {
    position: 'absolute',
    bottom: 0,
    right: 0,
    width: 12,
    height: 12,
    borderRadius: 6,
    backgroundColor: COLORS.sage,
    borderWidth: 2,
    borderColor: COLORS.bg,
  } as ViewStyle,
  memberInfo: {
    flex: 1,
  } as ViewStyle,
  memberName: {
    fontFamily: FONTS.bodySemiBold,
    fontSize: 14,
    color: COLORS.cream,
  } as TextStyle,
  memberLastSeen: {
    fontFamily: FONTS.mono,
    fontSize: 11,
    color: COLORS.sage,
    marginTop: 2,
  } as TextStyle,
  memberCountdown: {
    fontFamily: FONTS.mono,
    fontSize: 11,
    color: COLORS.gold,
    marginTop: 2,
  } as TextStyle,
  memberOffline: {
    fontFamily: FONTS.mono,
    fontSize: 11,
    color: COLORS.creamMuted,
    marginTop: 2,
  } as TextStyle,
  shareToggle: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
    paddingHorizontal: 12,
    paddingVertical: 8,
    borderRadius: RADIUS.full,
    borderWidth: 1,
    borderColor: COLORS.creamMuted,
  } as ViewStyle,
  shareToggleActive: {
    backgroundColor: COLORS.sage,
    borderColor: COLORS.sage,
  } as ViewStyle,
  shareToggleText: {
    fontFamily: FONTS.body,
    fontSize: 13,
    color: COLORS.creamMuted,
  } as TextStyle,
  shareToggleTextActive: {
    color: COLORS.bg,
  } as TextStyle,
  staleAlert: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
    backgroundColor: COLORS.goldSoft,
    borderRadius: RADIUS.sm,
    paddingVertical: 6,
    paddingHorizontal: 10,
    marginTop: SPACING.sm,
  } as ViewStyle,
  staleAlertText: {
    fontFamily: FONTS.body,
    fontSize: 12,
    color: COLORS.gold,
  } as TextStyle,
  durationOverlay: {
    flex: 1,
    backgroundColor: COLORS.overlay,
    justifyContent: 'flex-end',
  } as ViewStyle,
  durationSheet: {
    backgroundColor: COLORS.bg,
    borderTopLeftRadius: 20,
    borderTopRightRadius: 20,
    padding: SPACING.lg,
    paddingBottom: SPACING.xxl,
  } as ViewStyle,
  durationTitle: {
    fontFamily: FONTS.header,
    fontSize: 22,
    color: COLORS.cream,
    marginBottom: 4,
  } as TextStyle,
  durationSubtitle: {
    fontFamily: FONTS.body,
    fontSize: 13,
    color: COLORS.creamMuted,
    marginBottom: SPACING.lg,
  } as TextStyle,
  durationOption: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingVertical: SPACING.md,
    borderBottomWidth: 1,
    borderBottomColor: COLORS.border,
  } as ViewStyle,
  durationOptionLeft: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: SPACING.md,
  } as ViewStyle,
  durationOptionLabel: {
    fontFamily: FONTS.bodySemiBold,
    fontSize: 15,
    color: COLORS.cream,
  } as TextStyle,
  durationOptionDesc: {
    fontFamily: FONTS.body,
    fontSize: 12,
    color: COLORS.creamMuted,
    marginTop: 2,
  } as TextStyle,
  durationCancel: {
    marginTop: SPACING.lg,
    paddingVertical: SPACING.md,
    alignItems: 'center',
  } as ViewStyle,
  durationCancelText: {
    fontFamily: FONTS.bodyMedium,
    fontSize: 14,
    color: COLORS.creamMuted,
  } as TextStyle,
  mapPlaceholder: {
    backgroundColor: COLORS.bgCard,
    borderRadius: RADIUS.md,
    padding: SPACING.xl,
    alignItems: 'center',
    gap: SPACING.sm,
    marginBottom: SPACING.lg,
  } as ViewStyle,
  mapPlaceholderText: {
    fontFamily: FONTS.body,
    fontSize: 13,
    color: COLORS.creamMuted,
    textAlign: 'center',
  } as TextStyle,
  mapContainer: {
    backgroundColor: COLORS.bgCard,
    borderRadius: RADIUS.md,
    overflow: 'hidden',
    marginBottom: SPACING.lg,
  } as ViewStyle,
  mapGradient: {
    height: 160,
    backgroundColor: COLORS.gradientForest,
    padding: SPACING.lg,
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: SPACING.lg,
    justifyContent: 'center',
    alignItems: 'center',
  } as ViewStyle,
  mapPin: {
    alignItems: 'center',
    gap: 4,
  } as ViewStyle,
  mapPinDot: {
    width: 36,
    height: 36,
    borderRadius: 18,
    alignItems: 'center',
    justifyContent: 'center',
    borderWidth: 2,
    borderColor: COLORS.bg,
  } as ViewStyle,
  mapPinInitials: {
    fontFamily: FONTS.bodySemiBold,
    fontSize: 11,
    color: COLORS.bg,
  } as TextStyle,
  mapPinLabel: {
    fontFamily: FONTS.mono,
    fontSize: 10,
    color: COLORS.creamMuted,
  } as TextStyle,
  mapNote: {
    fontFamily: FONTS.mono,
    fontSize: 11,
    color: COLORS.creamDim,
    textAlign: 'center',
    paddingVertical: SPACING.sm,
  } as TextStyle,
});

// ---------------------------------------------------------------------------
// Component
// ---------------------------------------------------------------------------
export default function GroupScreen() {
  const { t } = useTranslation();
  const insets = useSafeAreaInsets();
  const router = useRouter();
  const activeTrip = getActiveTrip();
  const homeCurrency = useAppStore((s) => s.homeCurrency);

  const [mode, setMode] = useState<'group' | 'currency'>('group');
  const [isOffline, setIsOffline] = useState(false);
  const [ratesLoading, setRatesLoading] = useState(true);
  const [rates, setRates] = useState<ExchangeRatesState | null>(null);
  const [fromAmount, setFromAmount] = useState('100');
  const [fromCurrency, setFromCurrency] = useState('USD');
  const [toCurrency, setToCurrency] = useState('EUR');
  const [addExpenseVisible, setAddExpenseVisible] = useState(false);
  const [currencyPickerFrom, setCurrencyPickerFrom] = useState<'from' | 'to' | null>(null);
  const [dailyBudget, setDailyBudget] = useState('150');
  const [spentToday, setSpentToday] = useState(85);
  const [expenses, setExpenses] = useState<Expense[]>(MOCK_EXPENSES);
  const [durationPickerVisible, setDurationPickerVisible] = useState(false);
  const swapRotation = useRef(new Animated.Value(0)).current;

  // Location sharing state
  const locationSharing = useAppStore((s) => s.locationSharing);
  const setLocationSharing = useAppStore((s) => s.setLocationSharing);
  const updateMemberLocation = useAppStore((s) => s.updateMemberLocation);
  const session = useAppStore((s) => s.session);

  const userId = session?.user?.id ?? 'mock-user';
  const userName = 'You';
  const userInitials = 'YO';

  // Auto-expire check
  useEffect(() => {
    if (!locationSharing.isSharingLocation || !locationSharing.sharingExpiresAt) return;
    const interval = setInterval(() => {
      if (isLocationExpired(locationSharing.sharingExpiresAt!)) {
        handleStopSharing();
      }
    }, 10000);
    return () => clearInterval(interval);
  }, [locationSharing.isSharingLocation, locationSharing.sharingExpiresAt]);

  // Subscribe to realtime location updates when trip is active
  useEffect(() => {
    if (!activeTrip) return;
    const channel = subscribeToLocationUpdates(
      activeTrip.id,
      (loc) => updateMemberLocation(loc),
    );
    setLocationSharing({ channel });
    return () => {
      unsubscribeFromLocationUpdates(channel);
      setLocationSharing({ channel: null });
    };
  }, [activeTrip?.id]);

  // Derive daily budget from active trip's itinerary when available
  useEffect(() => {
    if (!activeTrip?.itinerary) return;
    try {
      const parsed = JSON.parse(activeTrip.itinerary);
      if (parsed?.days?.length > 0) {
        // Average daily cost from itinerary
        const costs = parsed.days.map((d: { dailyCost?: string }) => {
          const cleaned = (d.dailyCost ?? '').replace(/[^0-9.]/g, '');
          return parseFloat(cleaned) || 0;
        });
        const avg = costs.reduce((a: number, b: number) => a + b, 0) / costs.length;
        if (avg > 0) {
          setDailyBudget(Math.round(avg).toString());
        }
      }
    } catch {
      // Keep default daily budget if parsing fails
    }
  }, [activeTrip?.itinerary]);

  const handleStartSharing = useCallback(async (duration: SharingDuration) => {
    setDurationPickerVisible(false);
    if (duration === 'off') {
      handleStopSharing();
      return;
    }

    const hasPermission = await requestLocationPermission();
    if (!hasPermission) {
      setLocationSharing({ hasLocationPermission: false });
      return;
    }

    const tripEndDate = activeTrip
      ? new Date(new Date(activeTrip.createdAt).getTime() + activeTrip.days * 24 * 60 * 60 * 1000)
      : undefined;
    const expiresAt = getExpiresAt(duration, tripEndDate);

    setLocationSharing({
      isSharingLocation: true,
      sharingExpiresAt: expiresAt.toISOString(),
      sharingDuration: duration,
      hasLocationPermission: true,
    });

    const tripId = activeTrip?.id ?? 'mock-trip';
    const sub = await startLocationWatch(
      tripId,
      userId,
      userName,
      userInitials,
      (loc) => updateMemberLocation(loc),
    );
    setLocationSharing({ watchId: sub });
  }, [activeTrip, userId]);

  const handleStopSharing = useCallback(() => {
    stopLocationWatch(locationSharing.watchId);
    setLocationSharing({
      isSharingLocation: false,
      sharingExpiresAt: null,
      sharingDuration: 'off',
      watchId: null,
    });
  }, [locationSharing.watchId]);

  const handleToggleSharing = useCallback(() => {
    if (locationSharing.isSharingLocation) {
      handleStopSharing();
    } else {
      setDurationPickerVisible(true);
    }
  }, [locationSharing.isSharingLocation]);

  useEffect(() => {
    const unsub = NetInfo.addEventListener((state) => {
      setIsOffline(!(state.isConnected ?? true));
    });
    return () => unsub();
  }, []);

  useEffect(() => {
    let cancelled = false;
    const load = async () => {
      setRatesLoading(true);
      try {
        const res = await fetch('https://api.exchangerate-api.com/v4/latest/USD');
        if (!res.ok) throw new Error('Fetch failed');
        const data = (await res.json()) as { base?: string; rates?: Record<string, number> };
        const r = data.rates ?? {};
        r.USD = 1;
        if (!cancelled) {
          setRates({
            base: data.base ?? 'USD',
            rates: r,
            lastUpdated: new Date(),
            isLive: true,
          });
        }
      } catch {
        if (!cancelled) {
          setRates({
            base: 'USD',
            rates: { USD: 1, ...FALLBACK_RATES },
            lastUpdated: new Date(),
            isLive: false,
          });
        }
      } finally {
        if (!cancelled) setRatesLoading(false);
      }
    };
    load();
    return () => { cancelled = true; };
  }, []);

  const effectiveRates = rates?.rates ?? { USD: 1, ...FALLBACK_RATES };

  const toAmount = useMemo(() => {
    const num = parseFloat(fromAmount) || 0;
    const fromRate = effectiveRates[fromCurrency] ?? 1;
    const toRate = effectiveRates[toCurrency] ?? 1;
    return (num / fromRate) * toRate;
  }, [fromAmount, fromCurrency, toCurrency, effectiveRates]);

  const handleSwap = useCallback(() => {
    setFromCurrency(toCurrency);
    setToCurrency(fromCurrency);
    swapRotation.setValue(0);
    Animated.timing(swapRotation, {
      toValue: 1,
      duration: 300,
      useNativeDriver: true,
    }).start();
  }, [fromCurrency, toCurrency, swapRotation]);

  const rateDisplay = useMemo(() => {
    const toR = effectiveRates[toCurrency] ?? 1;
    const fromR = effectiveRates[fromCurrency] ?? 1;
    const oneToTarget = toR / fromR;
    return `1 ${fromCurrency} = ${oneToTarget.toFixed(4)} ${toCurrency}`;
  }, [fromCurrency, toCurrency, effectiveRates]);

  const swapInterpolate = swapRotation.interpolate({
    inputRange: [0, 1],
    outputRange: ['0deg', '180deg'],
  });

  const dailyBudgetNum = parseFloat(dailyBudget) || 0;
  const remaining = Math.max(0, dailyBudgetNum - spentToday);
  const progressPct = dailyBudgetNum > 0 ? spentToday / dailyBudgetNum : 0;

  const hasTrip = Boolean(activeTrip);

  return (
    <View style={[styles.screen, { paddingTop: insets.top }]}>
      <ScrollView
        style={styles.scrollView}
        contentContainerStyle={[styles.scrollContent, { paddingBottom: insets.bottom + SPACING.xl }]}
        showsVerticalScrollIndicator={false}
      >
        {/* Segmented control */}
        <View style={styles.segmented}>
          <Pressable
            onPress={() => setMode('group')}
            style={[styles.segItem, mode === 'group' && styles.segItemActive]}
          >
            <Text style={[styles.segText, mode === 'group' && styles.segTextActive]}>
              Group
            </Text>
          </Pressable>
          <Pressable
            onPress={() => setMode('currency')}
            style={[styles.segItem, mode === 'currency' && styles.segItemActive]}
          >
            <Text style={[styles.segText, mode === 'currency' && styles.segTextActive]}>
              Currency
            </Text>
          </Pressable>
        </View>

        {mode === 'group' ? (
          <>
            <Text style={styles.title}>Group</Text>
            <Text style={styles.subtitle}>{t('groupTab.subtitle')}</Text>

            {hasTrip ? (
              <>
                <View style={styles.tripCard}>
                  <Text style={styles.tripDest}>{activeTrip?.destination}</Text>
                  <Text style={styles.tripMeta}>
                    {activeTrip?.days} days · 4 members
                  </Text>
                  <Pressable style={styles.inviteBtn}>
                    <UserPlus size={16} color={COLORS.sage} strokeWidth={2} />
                    <Text style={styles.inviteBtnText}>{t('groupTab.inviteFriends')}</Text>
                  </Pressable>
                </View>

                <View style={styles.avatarRow}>
                  {MOCK_MEMBERS.map((m, i) => (
                    <View
                      key={m.id}
                      style={[
                        styles.avatar,
                        {
                          backgroundColor: [COLORS.sage, COLORS.coral, COLORS.gold][i % 3],
                        },
                      ]}
                    >
                      <Text style={styles.avatarText}>{m.initials}</Text>
                    </View>
                  ))}
                  <Pressable style={styles.avatarAdd}>
                    <Plus size={20} color={COLORS.creamMuted} strokeWidth={2} />
                  </Pressable>
                </View>

                <Text style={styles.sectionTitle}>{t('groupTab.locationSharing')}</Text>
                <PrivacyBanner />
                <LocationMapPlaceholder memberLocations={locationSharing.memberLocations} />
                {MOCK_MEMBERS.map((m) => {
                  const isCurrentUser = m.name === 'You';
                  const memberLoc = locationSharing.memberLocations.find(
                    (ml) => ml.memberId === (isCurrentUser ? userId : m.id)
                  ) ?? null;
                  return (
                    <LocationSharingCard
                      key={m.id}
                      member={m}
                      isCurrentUser={isCurrentUser}
                      isSharingLocation={locationSharing.isSharingLocation}
                      sharingExpiresAt={locationSharing.sharingExpiresAt}
                      onToggleSharing={handleToggleSharing}
                      memberLocation={memberLoc}
                    />
                  );
                })}

                <Text style={styles.sectionTitle}>Budget Tracker</Text>
                <BudgetTrackerCard
                  expenses={expenses}
                  dailyBudget={dailyBudgetNum}
                  homeCurrency={homeCurrency}
                  rates={effectiveRates}
                  tripDays={activeTrip?.days ?? 4}
                />

                <Text style={styles.sectionTitle}>Expenses</Text>
                <Pressable
                  onPress={() => setAddExpenseVisible(true)}
                  style={styles.addExpenseBtn}
                >
                  <Plus size={20} color={COLORS.bg} strokeWidth={2.5} />
                  <Text style={styles.addExpenseBtnText}>{t('groupTab.addExpense')}</Text>
                </Pressable>

                {expenses.length === 0 ? (
                  <View style={styles.listEmpty}>
                    <Wallet size={32} color={COLORS.creamDim} strokeWidth={1.5} />
                    <Text style={styles.listEmptyText}>{t('groupTab.noExpenses')}</Text>
                    <Text style={styles.listEmptySub}>Add one to start tracking</Text>
                  </View>
                ) : expenses.map((e) => {
                  const Icon = getCategoryIcon(e.category);
                  const inHome = convertToHome(e.amount, e.currency, homeCurrency, effectiveRates);
                  const showConversion = e.currency !== homeCurrency;
                  return (
                    <View key={e.id} style={styles.expenseRow}>
                      <Icon size={20} color={COLORS.creamMuted} strokeWidth={2} />
                      <View style={styles.expenseContent}>
                        <Text style={styles.expenseDesc}>{e.description}</Text>
                        <Text style={styles.expenseMeta}>
                          {getCurrencySymbol(e.currency)}
                          {formatExpenseAmount(e.amount, e.currency)}
                          {showConversion
                            ? ` ≈ ${getCurrencySymbol(homeCurrency)}${inHome.toFixed(2)}`
                            : ''}{' '}
                          · Day {e.day ?? '—'} · {e.paidBy} · split {e.splitBetween.length} ways
                        </Text>
                      </View>
                    </View>
                  );
                })}

                <Text style={styles.sectionTitle}>Balances</Text>
                {MOCK_BALANCES.length === 0 ? (
                  <View style={styles.listEmpty}>
                    <Users size={32} color={COLORS.creamDim} strokeWidth={1.5} />
                    <Text style={styles.listEmptyText}>{t('groupTab.allSettled')}</Text>
                    <Text style={styles.listEmptySub}>No outstanding balances</Text>
                  </View>
                ) : MOCK_BALANCES.map((b, i) => (
                  <View key={i} style={styles.balanceRow}>
                    <Text style={styles.balanceText}>
                      {b.fromMember} owes {b.toMember}
                    </Text>
                    <Text style={styles.balanceAmount}>
                      {getCurrencySymbol(b.currency)}
                      {b.amount.toFixed(2)}
                    </Text>
                    <Pressable style={styles.settleBtn}>
                      <Text style={styles.settleBtnText}>{t('groupTab.settleUp')}</Text>
                    </Pressable>
                  </View>
                ))}
              </>
            ) : (
              <View style={styles.emptyState}>
                <Users size={56} color={COLORS.sage} strokeWidth={1.5} />
                <Text style={styles.emptyTitle}>{t('groupTab.noTripYet')}</Text>
                <Text style={styles.emptyBody}>
                  {t('groupTab.generateFirst')}
                </Text>
                <Pressable
                  onPress={() => router.push('/(tabs)/generate')}
                  style={styles.emptyCta}
                >
                  <Text style={styles.emptyCtaText}>{t('groupTab.generateTrip')}</Text>
                </Pressable>
              </View>
            )}
          </>
        ) : (
          <>
            <View style={styles.currencyHeader}>
              <Text style={styles.title}>Currency</Text>
              {isOffline && (
                <View style={styles.offlineBadge}>
                  <WifiOff size={12} color={COLORS.bg} strokeWidth={2} />
                  <Text style={styles.offlineText}>Offline rates</Text>
                </View>
              )}
            </View>

            <View style={styles.converter}>
              <View style={styles.converterField}>
                <TextInput
                  style={styles.converterInput}
                  value={fromAmount}
                  onChangeText={setFromAmount}
                  keyboardType="decimal-pad"
                  placeholder="0"
                  placeholderTextColor={COLORS.creamMuted}
                />
                <Pressable
                  onPress={() => setCurrencyPickerFrom('from')}
                  style={styles.currencyPill}
                >
                  <Text style={styles.currencyPillCode}>
                    {fromCurrency.slice(0, 2)} {fromCurrency}
                  </Text>
                </Pressable>
              </View>
              <Pressable onPress={handleSwap} style={styles.swapBtn}>
                <Animated.View style={{ transform: [{ rotate: swapInterpolate }] }}>
                  <ArrowUpDown size={24} color={COLORS.bg} strokeWidth={2} />
                </Animated.View>
              </Pressable>
              <View style={styles.converterField}>
                <Text style={[styles.converterInput, styles.converterInputReadonly]}>
                  {toAmount.toFixed(2)}
                </Text>
                <Pressable
                  onPress={() => setCurrencyPickerFrom('to')}
                  style={styles.currencyPill}
                >
                  <Text style={styles.currencyPillCode}>
                    {toCurrency.slice(0, 2)} {toCurrency}
                  </Text>
                </Pressable>
              </View>
            </View>

            {ratesLoading ? (
              <View style={styles.ratesLoadingWrap}>
                <ActivityIndicator size="small" color={COLORS.sage} />
                <Text style={styles.ratesLoadingText}>Loading exchange rates…</Text>
              </View>
            ) : (
              <>
            <Text style={styles.rateDisplay}>{rateDisplay}</Text>
            <Text style={styles.rateMeta}>
              Last updated: {rates?.lastUpdated.toLocaleTimeString() ?? '—'} ·{' '}
              {rates?.isLive ? 'Live rate' : 'Cached rate'}
            </Text>

            <Text style={styles.popularLabel}>Popular pairs</Text>
            <View style={styles.popularGrid}>
              {POPULAR_PAIRS.map(([from, to]) => {
                const r = (effectiveRates[to] ?? 1) / (effectiveRates[from] ?? 1);
                return (
                  <View key={`${from}-${to}`} style={styles.popularCard}>
                    <Text style={styles.popularPair}>
                      {from}/{to}
                    </Text>
                    <Text style={styles.popularRate}>{r.toFixed(4)}</Text>
                  </View>
                );
              })}
            </View>

            <View style={styles.budgetSection}>
              <View style={styles.budgetHeader}>
                <Wallet size={20} color={COLORS.sage} strokeWidth={2} />
                <Text style={styles.budgetTitle}>{t('groupTab.tripBudgetTitle')}</Text>
              </View>
              <TextInput
                style={styles.budgetInput}
                value={dailyBudget}
                onChangeText={setDailyBudget}
                keyboardType="decimal-pad"
                placeholder="Daily budget"
                placeholderTextColor={COLORS.creamMuted}
              />
              <View style={styles.budgetRow}>
                <Text style={styles.budgetLabel}>Spent today</Text>
                <Text style={styles.budgetValue}>
                  {getCurrencySymbol(homeCurrency)}
                  {spentToday.toFixed(0)}
                </Text>
              </View>
              <View style={styles.budgetRow}>
                <Text style={styles.budgetLabel}>Remaining</Text>
                <Text style={[styles.budgetValue, { color: COLORS.sage }]}>
                  {getCurrencySymbol(homeCurrency)}
                  {remaining.toFixed(0)}
                </Text>
              </View>
              <View style={styles.progressTrack}>
                <View
                  style={[
                    styles.progressFill,
                    {
                      width: `${Math.min(100, progressPct * 100)}%`,
                      backgroundColor: progressPct > 0.8 ? COLORS.coral : COLORS.sage,
                    },
                  ]}
                />
              </View>
            </View>
              </>
            )}
          </>
        )}
      </ScrollView>

      {/* Add Expense Modal */}
      <Modal
        visible={addExpenseVisible}
        transparent
        animationType="slide"
        onRequestClose={() => setAddExpenseVisible(false)}
      >
        <View style={styles.modalOverlay}>
          <View style={[styles.modalSheet, { paddingBottom: insets.bottom + SPACING.lg }]}>
            <Text style={styles.modalTitle}>{t('groupTab.addExpense')}</Text>
            <TextInput
              style={styles.modalInput}
              placeholder="Amount"
              placeholderTextColor={COLORS.creamMuted}
              keyboardType="decimal-pad"
            />
            <TextInput
              style={styles.modalInput}
              placeholder="Description"
              placeholderTextColor={COLORS.creamMuted}
            />
            <Pressable
              onPress={() => setAddExpenseVisible(false)}
              style={styles.modalConfirm}
            >
              <Text style={styles.modalConfirmText}>Confirm</Text>
            </Pressable>
          </View>
        </View>
      </Modal>

      {/* Currency picker modal */}
      <Modal
        visible={currencyPickerFrom !== null}
        transparent
        animationType="slide"
        onRequestClose={() => setCurrencyPickerFrom(null)}
      >
        <View style={styles.modalOverlay}>
          <View style={[styles.modalSheet, { paddingBottom: insets.bottom + SPACING.lg }]}>
            <Text style={styles.modalTitle}>{t('groupTab.selectCurrency')}</Text>
            <ScrollView style={styles.currencyListScroll}>
              {CURRENCY_LIST.map((c) => (
                <Pressable
                  key={c.code}
                  onPress={() => {
                    if (currencyPickerFrom === 'from') setFromCurrency(c.code);
                    else setToCurrency(c.code);
                    setCurrencyPickerFrom(null);
                  }}
                  style={styles.currencyListItem}
                >
                  <Text style={styles.currencyListCode}>
                    {c.countryCode} {c.code}
                  </Text>
                  <Text style={styles.currencyListName}>{c.name}</Text>
                </Pressable>
              ))}
            </ScrollView>
          </View>
        </View>
      </Modal>

      {/* Location sharing duration picker */}
      <DurationPickerModal
        visible={durationPickerVisible}
        onSelect={handleStartSharing}
        onClose={() => setDurationPickerVisible(false)}
      />
    </View>
  );
}

// ---------------------------------------------------------------------------
// Styles
// ---------------------------------------------------------------------------
const styles = StyleSheet.create({
  screen: {
    flex: 1,
    backgroundColor: COLORS.bg,
  } as ViewStyle,
  scrollView: { flex: 1 } as ViewStyle,
  scrollContent: {
    paddingHorizontal: SPACING.lg,
  } as ViewStyle,
  segmented: {
    flexDirection: 'row',
    backgroundColor: COLORS.bgCard,
    borderRadius: RADIUS.md,
    padding: 4,
    marginBottom: SPACING.lg,
  } as ViewStyle,
  segItem: {
    flex: 1,
    paddingVertical: 10,
    alignItems: 'center',
    borderRadius: RADIUS.sm,
  } as ViewStyle,
  segItemActive: {
    backgroundColor: COLORS.sage,
  } as ViewStyle,
  segText: {
    fontFamily: FONTS.body,
    fontSize: 14,
    color: COLORS.creamMuted,
  } as TextStyle,
  segTextActive: {
    color: COLORS.bg,
    fontFamily: FONTS.bodySemiBold,
  } as TextStyle,
  title: {
    fontFamily: FONTS.header,
    fontSize: 28,
    color: COLORS.cream,
    marginBottom: 4,
  } as TextStyle,
  subtitle: {
    fontFamily: FONTS.body,
    fontSize: 14,
    color: COLORS.sage,
    marginBottom: SPACING.lg,
  } as TextStyle,
  tripCard: {
    backgroundColor: COLORS.bgCard,
    borderRadius: RADIUS.md,
    padding: SPACING.lg,
    marginBottom: SPACING.lg,
    borderLeftWidth: 3,
    borderLeftColor: COLORS.sage,
    position: 'relative',
  } as ViewStyle,
  tripDest: {
    fontFamily: FONTS.header,
    fontSize: 20,
    color: COLORS.cream,
  } as TextStyle,
  tripMeta: {
    fontFamily: FONTS.body,
    fontSize: 13,
    color: COLORS.creamMuted,
    marginTop: 4,
    marginBottom: SPACING.md,
  } as TextStyle,
  inviteBtn: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
    paddingVertical: 8,
    paddingHorizontal: 12,
    borderWidth: 1,
    borderColor: COLORS.sage,
    borderRadius: RADIUS.sm,
    alignSelf: 'flex-start',
  } as ViewStyle,
  inviteBtnText: {
    fontFamily: FONTS.body,
    fontSize: 14,
    color: COLORS.sage,
  } as TextStyle,
  avatarRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: SPACING.sm,
    marginBottom: SPACING.xl,
  } as ViewStyle,
  avatar: {
    width: 40,
    height: 40,
    borderRadius: 20,
    alignItems: 'center',
    justifyContent: 'center',
  } as ViewStyle,
  avatarText: {
    fontFamily: FONTS.bodySemiBold,
    fontSize: 12,
    color: COLORS.bg,
  } as TextStyle,
  avatarAdd: {
    width: 40,
    height: 40,
    borderRadius: 20,
    borderWidth: 2,
    borderStyle: 'dashed',
    borderColor: COLORS.creamDim,
    alignItems: 'center',
    justifyContent: 'center',
  } as ViewStyle,
  sectionTitle: {
    fontFamily: FONTS.header,
    fontSize: 20,
    color: COLORS.cream,
    marginBottom: SPACING.md,
  } as TextStyle,
  addExpenseBtn: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 8,
    backgroundColor: COLORS.sage,
    paddingVertical: 14,
    borderRadius: RADIUS.md,
    marginBottom: SPACING.lg,
  } as ViewStyle,
  addExpenseBtnText: {
    fontFamily: FONTS.bodySemiBold,
    fontSize: 16,
    color: COLORS.bg,
  } as TextStyle,
  expenseRow: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingVertical: SPACING.md,
    borderBottomWidth: 1,
    borderBottomColor: COLORS.border,
    gap: SPACING.md,
  } as ViewStyle,
  expenseContent: { flex: 1 } as ViewStyle,
  expenseDesc: {
    fontFamily: FONTS.bodySemiBold,
    fontSize: 15,
    color: COLORS.cream,
  } as TextStyle,
  expenseMeta: {
    fontFamily: FONTS.mono,
    fontSize: 12,
    color: COLORS.creamMuted,
    marginTop: 2,
  } as TextStyle,
  balanceRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingVertical: SPACING.sm,
    flexWrap: 'wrap',
    gap: 8,
  } as ViewStyle,
  balanceText: {
    fontFamily: FONTS.body,
    fontSize: 14,
    color: COLORS.cream,
  } as TextStyle,
  balanceAmount: {
    fontFamily: FONTS.mono,
    fontSize: 14,
    color: COLORS.sage,
  } as TextStyle,
  settleBtn: {
    paddingVertical: 4,
    paddingHorizontal: 8,
  } as ViewStyle,
  settleBtnText: {
    fontFamily: FONTS.mono,
    fontSize: 12,
    color: COLORS.creamMuted,
    textDecorationLine: 'underline',
  } as TextStyle,
  emptyState: {
    alignItems: 'center',
    paddingVertical: SPACING.xxl,
  } as ViewStyle,
  emptyTitle: {
    fontFamily: FONTS.header,
    fontSize: 22,
    color: COLORS.cream,
    marginTop: SPACING.lg,
  } as TextStyle,
  emptyBody: {
    fontFamily: FONTS.body,
    fontSize: 14,
    color: COLORS.creamMuted,
    marginTop: SPACING.sm,
    textAlign: 'center',
  } as TextStyle,
  emptyCta: {
    marginTop: SPACING.lg,
    backgroundColor: COLORS.sage,
    paddingVertical: 12,
    paddingHorizontal: SPACING.lg,
    borderRadius: RADIUS.md,
  } as ViewStyle,
  listEmpty: {
    alignItems: 'center',
    paddingVertical: SPACING.xl,
    marginBottom: SPACING.md,
  } as ViewStyle,
  listEmptyText: {
    fontFamily: FONTS.body,
    fontSize: 14,
    color: COLORS.creamMuted,
    marginTop: SPACING.sm,
  } as TextStyle,
  listEmptySub: {
    fontFamily: FONTS.body,
    fontSize: 12,
    color: COLORS.creamDim,
    marginTop: SPACING.xs,
  } as TextStyle,
  emptyCtaText: {
    fontFamily: FONTS.bodySemiBold,
    fontSize: 15,
    color: COLORS.bg,
  } as TextStyle,
  currencyHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: SPACING.sm,
    marginBottom: SPACING.lg,
  } as ViewStyle,
  offlineBadge: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
    backgroundColor: COLORS.gold,
    paddingHorizontal: 10,
    paddingVertical: 4,
    borderRadius: RADIUS.full,
  } as ViewStyle,
  offlineText: {
    fontFamily: FONTS.mono,
    fontSize: 11,
    color: COLORS.bg,
  } as TextStyle,
  converter: {
    backgroundColor: COLORS.bgCard,
    borderRadius: RADIUS.lg,
    padding: SPACING.lg,
    marginBottom: SPACING.md,
  } as ViewStyle,
  converterField: {
    marginBottom: SPACING.md,
  } as ViewStyle,
  converterInput: {
    fontFamily: FONTS.mono,
    fontSize: 32,
    color: COLORS.cream,
    paddingVertical: SPACING.sm,
  } as TextStyle,
  converterInputReadonly: {
    opacity: 0.9,
  } as TextStyle,
  currencyPill: {
    alignSelf: 'flex-start',
    paddingHorizontal: 12,
    paddingVertical: 6,
    borderRadius: RADIUS.full,
    backgroundColor: COLORS.bgGlass,
  } as ViewStyle,
  currencyPillCode: {
    fontFamily: FONTS.mono,
    fontSize: 13,
    color: COLORS.cream,
  } as TextStyle,
  swapBtn: {
    width: 44,
    height: 44,
    borderRadius: 22,
    backgroundColor: COLORS.sage,
    alignItems: 'center',
    justifyContent: 'center',
    alignSelf: 'center',
    marginVertical: 4,
  } as ViewStyle,
  ratesLoadingWrap: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: SPACING.sm,
    marginBottom: SPACING.xl,
  } as ViewStyle,
  ratesLoadingText: {
    fontFamily: FONTS.body,
    fontSize: 14,
    color: COLORS.creamMuted,
  } as TextStyle,
  rateDisplay: {
    fontFamily: FONTS.mono,
    fontSize: 14,
    color: COLORS.creamSoft,
    marginBottom: 4,
  } as TextStyle,
  rateMeta: {
    fontFamily: FONTS.body,
    fontSize: 12,
    color: COLORS.creamDim,
    marginBottom: SPACING.xl,
  } as TextStyle,
  popularLabel: {
    fontFamily: FONTS.body,
    fontSize: 13,
    color: COLORS.creamMuted,
    marginBottom: SPACING.md,
  } as TextStyle,
  popularGrid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: SPACING.md,
    marginBottom: SPACING.xl,
  } as ViewStyle,
  popularCard: {
    width: '47%',
    backgroundColor: COLORS.bgCard,
    borderRadius: RADIUS.md,
    padding: SPACING.md,
  } as ViewStyle,
  popularPair: {
    fontFamily: FONTS.mono,
    fontSize: 12,
    color: COLORS.cream,
  } as TextStyle,
  popularRate: {
    fontFamily: FONTS.mono,
    fontSize: 14,
    color: COLORS.sage,
    marginTop: 4,
  } as TextStyle,
  budgetSection: {
    backgroundColor: COLORS.bgCard,
    borderRadius: RADIUS.lg,
    padding: SPACING.lg,
  } as ViewStyle,
  budgetHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
    marginBottom: SPACING.md,
  } as ViewStyle,
  budgetTitle: {
    fontFamily: FONTS.header,
    fontSize: 18,
    color: COLORS.cream,
  } as TextStyle,
  budgetInput: {
    fontFamily: FONTS.mono,
    fontSize: 24,
    color: COLORS.cream,
    paddingVertical: SPACING.sm,
    marginBottom: SPACING.md,
  } as TextStyle,
  budgetRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    marginBottom: SPACING.xs,
  } as ViewStyle,
  budgetLabel: {
    fontFamily: FONTS.body,
    fontSize: 14,
    color: COLORS.creamMuted,
  } as TextStyle,
  budgetValue: {
    fontFamily: FONTS.mono,
    fontSize: 14,
    color: COLORS.cream,
  } as TextStyle,
  progressTrack: {
    height: 6,
    backgroundColor: COLORS.bgGlass,
    borderRadius: 3,
    marginTop: SPACING.md,
    overflow: 'hidden',
  } as ViewStyle,
  progressFill: {
    height: '100%',
    borderRadius: 3,
  } as ViewStyle,
  budgetTrackerCard: {
    backgroundColor: COLORS.bgCard,
    borderRadius: RADIUS.md,
    padding: SPACING.lg,
    marginBottom: SPACING.lg,
  } as ViewStyle,
  budgetTrackerRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    marginBottom: SPACING.xs,
  } as ViewStyle,
  budgetTrackerLabel: {
    fontFamily: FONTS.body,
    fontSize: 13,
    color: COLORS.creamMuted,
  } as TextStyle,
  budgetTrackerValue: {
    fontFamily: FONTS.mono,
    fontSize: 14,
    color: COLORS.cream,
  } as TextStyle,
  budgetTrackerMeta: {
    fontFamily: FONTS.body,
    fontSize: 12,
    color: COLORS.creamDim,
  } as TextStyle,
  budgetProgressTrack: {
    height: 6,
    backgroundColor: COLORS.bgGlass,
    borderRadius: 3,
    marginVertical: SPACING.md,
    overflow: 'hidden',
  } as ViewStyle,
  budgetProgressFill: {
    height: '100%',
    borderRadius: 3,
  } as ViewStyle,
  budgetSubsection: {
    fontFamily: FONTS.mono,
    fontSize: 11,
    color: COLORS.sage,
    marginTop: SPACING.sm,
    marginBottom: SPACING.xs,
  } as TextStyle,
  modalOverlay: {
    flex: 1,
    backgroundColor: COLORS.overlay,
    justifyContent: 'flex-end',
  } as ViewStyle,
  modalSheet: {
    backgroundColor: COLORS.bg,
    borderTopLeftRadius: 20,
    borderTopRightRadius: 20,
    padding: SPACING.lg,
    maxHeight: '70%',
  } as ViewStyle,
  modalTitle: {
    fontFamily: FONTS.header,
    fontSize: 22,
    color: COLORS.cream,
    marginBottom: SPACING.lg,
  } as TextStyle,
  modalInput: {
    fontFamily: FONTS.mono,
    fontSize: 18,
    color: COLORS.cream,
    paddingVertical: SPACING.md,
    borderBottomWidth: 1,
    borderBottomColor: COLORS.border,
    marginBottom: SPACING.md,
  } as TextStyle,
  modalConfirm: {
    backgroundColor: COLORS.sage,
    paddingVertical: 14,
    borderRadius: RADIUS.md,
    alignItems: 'center',
    marginTop: SPACING.md,
  } as ViewStyle,
  modalConfirmText: {
    fontFamily: FONTS.bodySemiBold,
    fontSize: 16,
    color: COLORS.bg,
  } as TextStyle,
  currencyListScroll: {
    maxHeight: 300,
  } as ViewStyle,
  currencyListItem: {
    paddingVertical: SPACING.md,
    borderBottomWidth: 1,
    borderBottomColor: COLORS.border,
  } as ViewStyle,
  currencyListCode: {
    fontFamily: FONTS.mono,
    fontSize: 14,
    color: COLORS.cream,
  } as TextStyle,
  currencyListName: {
    fontFamily: FONTS.body,
    fontSize: 12,
    color: COLORS.creamMuted,
    marginTop: 2,
  } as TextStyle,
});
