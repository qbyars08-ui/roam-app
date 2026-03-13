// =============================================================================
// ROAM — Balance Card for Group Trips
// Shows who owes whom with settle-up actions.
// =============================================================================
import React from 'react';
import {
  View,
  Text,
  Pressable,
  StyleSheet,
  type ViewStyle,
  type TextStyle,
} from 'react-native';
import * as Haptics from '../../lib/haptics';
import { COLORS, FONTS, SPACING, RADIUS } from '../../lib/constants';
import { Check, ArrowRight } from 'lucide-react-native';
import type { Balance } from '../../lib/types/group';

interface BalanceCardProps {
  balances: Balance[];
  currentUserId: string;
  onSettle?: (fromUserId: string, toUserId: string) => void;
}

// Generate color from userId hash for member pills
function memberColor(userId: string): string {
  const colors = ['#7CAF8A', '#C9A84C', '#6FA8DC', '#E87C7C', '#B488D9', '#F0A05E'];
  let hash = 0;
  for (let i = 0; i < userId.length; i++) {
    hash = userId.charCodeAt(i) + ((hash << 5) - hash);
  }
  return colors[Math.abs(hash) % colors.length];
}

function getInitials(name: string): string {
  return name
    .split(' ')
    .map((w) => w[0])
    .join('')
    .toUpperCase()
    .slice(0, 2);
}

export default function BalanceCard({
  balances,
  currentUserId,
  onSettle,
}: BalanceCardProps) {
  const myBalance = balances.find((b) => b.userId === currentUserId);
  if (!myBalance) return null;

  const hasDebts = myBalance.owes.length > 0 || balances.some((b) =>
    b.owes.some((o) => o.userId === currentUserId && o.amount > 0)
  );

  // People who owe me
  const owedToMe = balances
    .filter((b) => b.owes.some((o) => o.userId === currentUserId && o.amount > 0))
    .map((b) => {
      const debt = b.owes.find((o) => o.userId === currentUserId)!;
      return { userId: b.userId, name: b.displayName, amount: debt.amount };
    });

  // People I owe
  const iOwe = myBalance.owes.filter((o) => o.amount > 0);

  return (
    <View style={styles.card}>
      <Text style={styles.sectionLabel}>GROUP BALANCE</Text>

      {/* My summary */}
      <View style={styles.summaryRow}>
        <View style={styles.summaryItem}>
          <Text style={styles.summaryLabel}>You paid</Text>
          <Text style={styles.summaryValue}>${myBalance.totalPaid.toFixed(2)}</Text>
        </View>
        <View style={styles.summaryDivider} />
        <View style={styles.summaryItem}>
          <Text style={styles.summaryLabel}>Your share</Text>
          <Text style={styles.summaryValue}>${myBalance.totalOwed.toFixed(2)}</Text>
        </View>
        <View style={styles.summaryDivider} />
        <View style={styles.summaryItem}>
          <Text style={styles.summaryLabel}>Net</Text>
          <Text
            style={[
              styles.summaryValueNet,
              {
                color:
                  myBalance.netBalance > 0
                    ? COLORS.sage
                    : myBalance.netBalance < 0
                    ? '#E87C7C'
                    : COLORS.cream,
              },
            ]}
          >
            {myBalance.netBalance >= 0 ? '+' : ''}${myBalance.netBalance.toFixed(2)}
          </Text>
        </View>
      </View>

      {!hasDebts && (
        <View style={styles.evenRow}>
          <Check size={16} color={COLORS.sage} strokeWidth={2} />
          <Text style={styles.evenText}>All settled up</Text>
        </View>
      )}

      {/* People who owe me */}
      {owedToMe.map((person) => (
        <View key={person.userId} style={styles.debtRow}>
          <View style={[styles.avatar, { backgroundColor: `${memberColor(person.userId)}20` }]}>
            <Text style={[styles.avatarText, { color: memberColor(person.userId) }]}>
              {getInitials(person.name)}
            </Text>
          </View>
          <View style={styles.debtInfo}>
            <Text style={styles.debtName}>{person.name} owes you</Text>
            <Text style={[styles.debtAmount, { color: COLORS.sage }]}>
              ${person.amount.toFixed(2)}
            </Text>
          </View>
          {onSettle && (
            <Pressable
              onPress={() => {
                Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
                onSettle(person.userId, currentUserId);
              }}
              style={({ pressed }) => [
                styles.settleBtn,
                { opacity: pressed ? 0.85 : 1 },
              ]}
            >
              <Text style={styles.settleBtnText}>Settle</Text>
            </Pressable>
          )}
        </View>
      ))}

      {/* People I owe */}
      {iOwe.map((debt) => (
        <View key={debt.userId} style={styles.debtRow}>
          <View style={[styles.avatar, { backgroundColor: `${memberColor(debt.userId)}20` }]}>
            <Text style={[styles.avatarText, { color: memberColor(debt.userId) }]}>
              {getInitials(debt.displayName)}
            </Text>
          </View>
          <View style={styles.debtInfo}>
            <Text style={styles.debtName}>You owe {debt.displayName}</Text>
            <Text style={[styles.debtAmount, { color: '#E87C7C' }]}>
              ${debt.amount.toFixed(2)}
            </Text>
          </View>
          {onSettle && (
            <Pressable
              onPress={() => {
                Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
                onSettle(currentUserId, debt.userId);
              }}
              style={({ pressed }) => [
                styles.settleBtn,
                { opacity: pressed ? 0.85 : 1 },
              ]}
            >
              <Text style={styles.settleBtnText}>Pay</Text>
              <ArrowRight size={12} color={COLORS.sage} strokeWidth={2} />
            </Pressable>
          )}
        </View>
      ))}
    </View>
  );
}

const styles = StyleSheet.create({
  card: {
    backgroundColor: COLORS.bgCard,
    borderRadius: RADIUS.lg,
    borderWidth: 1,
    borderColor: COLORS.border,
    padding: SPACING.md,
  } as ViewStyle,
  sectionLabel: {
    fontFamily: FONTS.mono,
    fontSize: 10,
    color: COLORS.sage,
    letterSpacing: 1.5,
    marginBottom: SPACING.md,
  } as TextStyle,
  summaryRow: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: SPACING.md,
  } as ViewStyle,
  summaryItem: {
    flex: 1,
    alignItems: 'center',
  } as ViewStyle,
  summaryDivider: {
    width: 1,
    height: 28,
    backgroundColor: COLORS.border,
  } as ViewStyle,
  summaryLabel: {
    fontFamily: FONTS.mono,
    fontSize: 9,
    color: COLORS.creamDim,
    letterSpacing: 0.5,
    marginBottom: 2,
  } as TextStyle,
  summaryValue: {
    fontFamily: FONTS.bodySemiBold,
    fontSize: 15,
    color: COLORS.cream,
  } as TextStyle,
  summaryValueNet: {
    fontFamily: FONTS.bodySemiBold,
    fontSize: 15,
  } as TextStyle,
  evenRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 6,
    paddingVertical: SPACING.sm,
  } as ViewStyle,
  evenText: {
    fontFamily: FONTS.body,
    fontSize: 14,
    color: COLORS.sage,
  } as TextStyle,
  debtRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: SPACING.sm,
    paddingVertical: SPACING.sm,
    borderTopWidth: 1,
    borderTopColor: 'rgba(255,255,255,0.04)',
  } as ViewStyle,
  avatar: {
    width: 32,
    height: 32,
    borderRadius: 16,
    alignItems: 'center',
    justifyContent: 'center',
  } as ViewStyle,
  avatarText: {
    fontFamily: FONTS.mono,
    fontSize: 11,
    fontWeight: '600',
  } as TextStyle,
  debtInfo: {
    flex: 1,
  } as ViewStyle,
  debtName: {
    fontFamily: FONTS.body,
    fontSize: 13,
    color: COLORS.cream,
  } as TextStyle,
  debtAmount: {
    fontFamily: FONTS.monoMedium,
    fontSize: 12,
    marginTop: 1,
  } as TextStyle,
  settleBtn: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
    paddingHorizontal: SPACING.sm + 2,
    paddingVertical: SPACING.xs + 2,
    borderRadius: RADIUS.sm,
    backgroundColor: COLORS.sageLight,
    borderWidth: 1,
    borderColor: COLORS.sageStrong,
  } as ViewStyle,
  settleBtnText: {
    fontFamily: FONTS.mono,
    fontSize: 11,
    color: COLORS.sage,
    letterSpacing: 0.5,
  } as TextStyle,
});
