// =============================================================================
// ROAM — Group Trip Screen
// 4 tabs: Itinerary voting, Expenses, Chat, Packing
// =============================================================================
import React, { useCallback, useEffect, useState } from 'react';
import {
  View,
  Text,
  ScrollView,
  Pressable,
  TextInput,
  StyleSheet,
  Share,
  ImageBackground,
  FlatList,
  type ViewStyle,
  type TextStyle,
} from 'react-native';
import { useLocalSearchParams, useRouter } from 'expo-router';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import * as Haptics from '../lib/haptics';
import { LinearGradient } from 'expo-linear-gradient';
import { ChevronLeft, Share2, MapPin, DollarSign, MessageCircle, Package } from 'lucide-react-native';

import { COLORS, FONTS, SPACING, RADIUS, EXPENSE_CATEGORIES } from '../lib/constants';
import { getDestinationPhoto } from '../lib/photos';
import { useAppStore } from '../lib/store';
import {
  getGroupDetails,
  getExpenses,
  getMessages,
  getPackingList,
  getVotes,
  castVote,
  addExpense,
  sendMessage,
  addPackingItem,
  togglePackedItem,
  calculateBalances,
  generateInviteLink,
  subscribeToMessages,
  type TripGroup,
  type GroupMember,
  type TripExpense,
  type GroupMessage,
  type PackingItem,
} from '../lib/group-trips';
import { parseItinerary, type Itinerary, type ItineraryDay } from '../lib/types/itinerary';
import Button from '../components/ui/Button';

type TabId = 'itinerary' | 'expenses' | 'chat' | 'packing';

// ---------------------------------------------------------------------------
// Main Screen
// ---------------------------------------------------------------------------
export default function GroupTripScreen() {
  const router = useRouter();
  const insets = useSafeAreaInsets();
  const params = useLocalSearchParams<{ groupId: string }>();
  const groupId = params.groupId ?? '';

  const [group, setGroup] = useState<TripGroup | null>(null);
  const [members, setMembers] = useState<GroupMember[]>([]);
  const [activeTab, setActiveTab] = useState<TabId>('itinerary');
  const [expenses, setExpenses] = useState<TripExpense[]>([]);
  const [messages, setMessages] = useState<GroupMessage[]>([]);
  const [packingItems, setPackingItems] = useState<PackingItem[]>([]);
  const [error, setError] = useState<string | null>(null);

  const loadDetails = useCallback(async () => {
    if (!groupId) return;
    try {
      const details = await getGroupDetails(groupId);
      const { members: m, ...g } = details;
      setGroup(g);
      setMembers(m);
    } catch {
      setError('Could not load group');
    }
  }, [groupId]);

  useEffect(() => {
    loadDetails();
  }, [loadDetails]);

  useEffect(() => {
    if (!groupId) return;
    getExpenses(groupId).then(setExpenses);
    getMessages(groupId).then(setMessages);
    getPackingList(groupId).then(setPackingItems);
  }, [groupId]);

  useEffect(() => {
    if (!groupId) return;
    const sub = subscribeToMessages(groupId, (msg) => setMessages((prev) => [...prev, msg]));
    return () => sub.unsubscribe();
  }, [groupId]);

  const handleShare = useCallback(async () => {
    if (!group) return;
    Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Medium);
    const url = generateInviteLink(group.inviteCode);
    await Share.share({ message: `Join my trip to ${group.destination} on ROAM: ${url}`, url });
  }, [group]);

  if (error) {
    return (
      <View style={[styles.container, { paddingTop: insets.top }]}>
        <Pressable onPress={() => router.back()} style={styles.backBtn}>
          <ChevronLeft size={24} color={COLORS.cream} strokeWidth={2} />
        </Pressable>
        <Text style={styles.errorText}>{error}</Text>
      </View>
    );
  }

  if (!group) {
    const { SkeletonCard } = require('../components/ui/Skeleton');
    return (
      <View style={[styles.container, { paddingTop: insets.top }]}>
        <Pressable onPress={() => router.back()} style={styles.backBtn}>
          <ChevronLeft size={24} color={COLORS.cream} strokeWidth={2} />
        </Pressable>
        <View style={styles.loadingSkeleton}>
          <SkeletonCard />
          <SkeletonCard style={{ marginTop: SPACING.lg }} />
        </View>
      </View>
    );
  }

  const dateRange =
    group.startDate && group.endDate
      ? `${group.startDate} - ${group.endDate}`
      : 'Dates TBD';

  const TABS: { id: TabId; label: string; icon: typeof MapPin }[] = [
    { id: 'itinerary', label: 'Itinerary', icon: MapPin },
    { id: 'expenses', label: 'Expenses', icon: DollarSign },
    { id: 'chat', label: 'Chat', icon: MessageCircle },
    { id: 'packing', label: 'Packing', icon: Package },
  ];

  return (
    <View style={[styles.container, { paddingTop: insets.top }]}>
      {/* Header */}
      <View style={styles.header}>
        <Pressable onPress={() => router.back()} style={styles.backBtn}>
          <ChevronLeft size={24} color={COLORS.cream} strokeWidth={2} />
        </Pressable>
        <View style={styles.headerCenter}>
          <Text style={styles.headerTitle}>{group.name}</Text>
          <Text style={styles.headerSub}>{group.destination} - {dateRange}</Text>
        </View>
        <Pressable onPress={handleShare} style={styles.shareBtn}>
          <Share2 size={20} color={COLORS.sage} strokeWidth={2} />
        </Pressable>
      </View>

      {/* Members */}
      <View style={styles.membersRow}>
        {members.slice(0, 6).map((m) => (
          <View key={m.id} style={styles.avatar}>
            <Text style={styles.avatarText}>
              {(m.displayName ?? '?').charAt(0).toUpperCase()}
            </Text>
          </View>
        ))}
        {members.length > 6 && (
          <Text style={styles.moreMembers}>+{members.length - 6}</Text>
        )}
      </View>

      {/* Tabs */}
      <View style={styles.tabs}>
        {TABS.map((t) => {
          const Icon = t.icon;
          const active = activeTab === t.id;
          return (
            <Pressable
              key={t.id}
              style={[styles.tab, active && styles.tabActive]}
              onPress={() => {
                Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
                setActiveTab(t.id);
              }}
            >
              <Icon size={16} color={active ? COLORS.sage : COLORS.creamMuted} strokeWidth={2} />
              <Text style={[styles.tabLabel, active && styles.tabLabelActive]}>{t.label}</Text>
            </Pressable>
          );
        })}
      </View>

      {/* Tab content */}
      <ScrollView
        style={styles.content}
        contentContainerStyle={styles.contentInner}
        showsVerticalScrollIndicator={false}
      >
        {activeTab === 'itinerary' && (
          <ItineraryTab group={group} members={members} />
        )}
        {activeTab === 'expenses' && (
          <ExpensesTab
            groupId={groupId}
            expenses={expenses}
            members={members}
            onRefresh={() => getExpenses(groupId).then(setExpenses)}
          />
        )}
        {activeTab === 'chat' && (
          <ChatTab groupId={groupId} messages={messages} members={members} />
        )}
        {activeTab === 'packing' && (
          <PackingTab
            groupId={groupId}
            items={packingItems}
            onRefresh={() => getPackingList(groupId).then(setPackingItems)}
          />
        )}
      </ScrollView>
    </View>
  );
}

// ---------------------------------------------------------------------------
// Itinerary Tab
// ---------------------------------------------------------------------------
function ItineraryTab({ group, members }: { group: TripGroup; members: GroupMember[] }) {
  const [itinerary, setItinerary] = useState<Itinerary | null>(null);

  useEffect(() => {
    if (group.itineraryJson) {
      try {
        const parsed = parseItinerary(JSON.stringify(group.itineraryJson));
        setItinerary(parsed);
      } catch {
        setItinerary(null);
      }
    }
  }, [group.itineraryJson]);

  if (!itinerary?.days?.length) {
    return (
      <View style={styles.card}>
        <Text style={styles.cardTitle}>Itinerary</Text>
        <Text style={styles.emptyText}>No itinerary yet. Add one from your trip.</Text>
      </View>
    );
  }

  return (
    <View style={styles.tabSection}>
      {itinerary.days.map((day) => (
        <DayVoteCard key={day.day} day={day} groupId={group.id} members={members} />
      ))}
    </View>
  );
}

function DayVoteCard({
  day,
  groupId,
  members,
}: {
  day: ItineraryDay;
  groupId: string;
  members: GroupMember[];
}) {
  const slots: ('morning' | 'afternoon' | 'evening')[] = ['morning', 'afternoon', 'evening'];

  return (
    <View style={styles.dayCard}>
      <Text style={styles.dayTitle}>Day {day.day}</Text>
      {slots.map((slot) => (
        <ActivityVoteRow
          key={slot}
          groupId={groupId}
          dayNumber={day.day}
          timeSlot={slot}
          activity={day[slot].activity}
          members={members}
        />
      ))}
    </View>
  );
}

function ActivityVoteRow({
  groupId,
  dayNumber,
  timeSlot,
  activity,
  members,
}: {
  groupId: string;
  dayNumber: number;
  timeSlot: 'morning' | 'afternoon' | 'evening';
  activity: string;
  members: GroupMember[];
}) {
  const session = useAppStore((s) => s.session);
  const [votes, setVotes] = useState<{ keep: number; swap: number }>({ keep: 0, swap: 0 });
  const [myVote, setMyVote] = useState<'keep' | 'swap' | null>(null);

  useEffect(() => {
    getVotes(groupId, dayNumber).then((v) => {
      const filtered = v.filter((x) => x.timeSlot === timeSlot);
      const keepCount = filtered.filter((x) => x.voteType === 'keep').length;
      const swapCount = filtered.filter((x) => x.voteType === 'swap').length;
      setVotes({ keep: keepCount, swap: swapCount });
      const mine = filtered.find((x) => x.userId === session?.user?.id);
      setMyVote(mine?.voteType === 'keep' || mine?.voteType === 'swap' ? mine.voteType : null);
    });
  }, [groupId, dayNumber, timeSlot, session?.user?.id]);

  const handleVote = useCallback(
    async (t: 'keep' | 'swap') => {
      Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
      const prevVote = myVote;
      setMyVote(t);
      setVotes((prev) => {
        let next = { ...prev, [t]: prev[t] + 1 };
        if (prevVote && prevVote !== t) next = { ...next, [prevVote]: Math.max(0, next[prevVote] - 1) };
        return next;
      });
      await castVote({ groupId, dayNumber, timeSlot, voteType: t });
    },
    [groupId, dayNumber, timeSlot, myVote]
  );

  const label = timeSlot.charAt(0).toUpperCase() + timeSlot.slice(1);
  return (
    <View style={styles.activityRow}>
      <Text style={styles.slotLabel}>{label}</Text>
      <Text style={styles.activityText}>{activity}</Text>
      <View style={styles.voteRow}>
        <Pressable
          style={[styles.voteBtn, myVote === 'keep' && styles.voteBtnActive]}
          onPress={() => handleVote('keep')}
        >
          <Text style={styles.voteBtnText}>Keep ({votes.keep})</Text>
        </Pressable>
        <Pressable
          style={[styles.voteBtn, myVote === 'swap' && styles.voteBtnActive]}
          onPress={() => handleVote('swap')}
        >
          <Text style={styles.voteBtnText}>Swap ({votes.swap})</Text>
        </Pressable>
      </View>
    </View>
  );
}

// ---------------------------------------------------------------------------
// Expenses Tab
// ---------------------------------------------------------------------------
function ExpensesTab({
  groupId,
  expenses,
  members,
  onRefresh,
}: {
  groupId: string;
  expenses: TripExpense[];
  members: GroupMember[];
  onRefresh: () => void;
}) {
  const [showAdd, setShowAdd] = useState(false);
  const [amount, setAmount] = useState('');
  const [category, setCategory] = useState<TripExpense['category']>('food');
  const [description, setDescription] = useState('');
  const [addError, setAddError] = useState<string | null>(null);
  const [adding, setAdding] = useState(false);

  const balances = calculateBalances(expenses, members);
  const session = useAppStore((s) => s.session);
  const myBalance = balances.find((b) => b.userId === session?.user?.id);

  const handleAdd = useCallback(async () => {
    const num = parseFloat(amount);
    if (!num || num <= 0 || !description.trim()) return;
    setAddError(null);
    setAdding(true);
    try {
      await addExpense({ groupId, amount: num, category, description });
      setAmount('');
      setDescription('');
      setShowAdd(false);
      onRefresh();
    } catch {
      setAddError('Could not add expense');
    } finally {
      setAdding(false);
    }
  }, [groupId, amount, category, description, onRefresh]);

  return (
    <View style={styles.tabSection}>
      {myBalance && (
        <View style={styles.balanceCard}>
          <Text style={styles.balanceTitle}>Your balance</Text>
          <Text style={[styles.balanceValue, myBalance.netBalance >= 0 ? styles.positive : styles.negative]}>
            {myBalance.netBalance >= 0 ? '+' : ''}${myBalance.netBalance.toFixed(0)}
          </Text>
          <Text style={styles.balanceSub}>
            Paid ${myBalance.totalPaid.toFixed(0)} / Owed ${myBalance.totalOwed.toFixed(0)}
          </Text>
        </View>
      )}

      <Pressable
        style={styles.addExpenseBtn}
        onPress={() => setShowAdd(true)}
      >
        <Text style={styles.addExpenseBtnText}>Add expense</Text>
      </Pressable>

      {expenses.map((e) => (
        <View key={e.id} style={styles.expenseRow}>
          <View>
            <Text style={styles.expenseDesc}>{e.description}</Text>
            <Text style={styles.expenseMeta}>
              ${e.amount.toFixed(0)} - {e.category}
            </Text>
          </View>
        </View>
      ))}

      {showAdd && (
        <View style={styles.modalCard}>
          <Text style={styles.modalTitle}>Add expense</Text>
          <TextInput
            style={styles.input}
            value={amount}
            onChangeText={setAmount}
            placeholder="Amount"
            placeholderTextColor={COLORS.creamMuted}
            keyboardType="decimal-pad"
          />
          <TextInput
            style={styles.input}
            value={description}
            onChangeText={setDescription}
            placeholder="Description"
            placeholderTextColor={COLORS.creamMuted}
          />
          <ScrollView horizontal showsHorizontalScrollIndicator={false} style={styles.catRow}>
            {EXPENSE_CATEGORIES.map((c) => (
              <Pressable
                key={c.id}
                style={[styles.catPill, category === c.id && styles.catPillActive]}
                onPress={() => setCategory(c.id as TripExpense['category'])}
              >
                <Text style={styles.catPillText}>{c.label}</Text>
              </Pressable>
            ))}
          </ScrollView>
          <View style={styles.modalActions}>
            <Pressable onPress={() => { setShowAdd(false); setAddError(null); }}>
              <Text style={styles.cancelText}>Cancel</Text>
            </Pressable>
            <Pressable style={styles.saveBtn} onPress={handleAdd} disabled={adding}>
              <Text style={styles.saveBtnText}>{adding ? 'Adding...' : 'Add'}</Text>
            </Pressable>
          </View>
        </View>
      )}
    </View>
  );
}

// ---------------------------------------------------------------------------
// Chat Tab
// ---------------------------------------------------------------------------
function ChatTab({
  groupId,
  messages,
  members,
}: {
  groupId: string;
  messages: GroupMessage[];
  members: GroupMember[];
}) {
  const [input, setInput] = useState('');
  const [sending, setSending] = useState(false);
  const session = useAppStore((s) => s.session);

  const handleSend = useCallback(async () => {
    const t = input.trim();
    if (!t || sending) return;
    setSending(true);
    setInput('');
    try {
      await sendMessage({ groupId, content: t });
    } finally {
      setSending(false);
    }
  }, [groupId, input, sending]);

  const getName = (userId: string) =>
    members.find((m) => m.userId === userId)?.displayName ?? 'Traveler';

  return (
    <View style={styles.chatSection}>
      <FlatList
        data={messages}
        keyExtractor={(m) => m.id}
        renderItem={({ item }) => (
          <View
            style={[
              styles.msgBubble,
              item.userId === session?.user?.id ? styles.msgBubbleMine : styles.msgBubbleOther,
            ]}
          >
            <Text style={styles.msgName}>{getName(item.userId)}</Text>
            <Text style={styles.msgContent}>{item.content}</Text>
          </View>
        )}
        ListEmptyComponent={
          <Text style={styles.emptyText}>No messages yet. Say something.</Text>
        }
        style={styles.msgList}
      />
      <View style={styles.chatInputRow}>
        <TextInput
          style={styles.chatInput}
          value={input}
          onChangeText={setInput}
          placeholder="Message..."
          placeholderTextColor={COLORS.creamMuted}
          onSubmitEditing={handleSend}
        />
        <Pressable style={styles.sendBtn} onPress={handleSend} disabled={sending}>
          <Text style={styles.sendBtnText}>{sending ? '...' : 'Send'}</Text>
        </Pressable>
      </View>
    </View>
  );
}

// ---------------------------------------------------------------------------
// Packing Tab
// ---------------------------------------------------------------------------
function PackingTab({
  groupId,
  items,
  onRefresh,
}: {
  groupId: string;
  items: PackingItem[];
  onRefresh: () => void;
}) {
  const [newItem, setNewItem] = useState('');
  const [addError, setAddError] = useState<string | null>(null);
  const [adding, setAdding] = useState(false);

  const handleAdd = useCallback(async () => {
    const t = newItem.trim();
    if (!t) return;
    setAddError(null);
    setAdding(true);
    try {
      await addPackingItem({ groupId, itemName: t });
      setNewItem('');
      onRefresh();
    } catch {
      setAddError('Could not add item');
    } finally {
      setAdding(false);
    }
  }, [groupId, newItem, onRefresh]);

  const handleToggle = useCallback(
    async (id: string) => {
      await togglePackedItem(id);
      onRefresh();
    },
    [onRefresh]
  );

  return (
    <View style={styles.tabSection}>
      <View style={styles.packingInputRow}>
        <TextInput
          style={styles.packingInput}
          value={newItem}
          onChangeText={(v) => { setNewItem(v); setAddError(null); }}
          placeholder="Add item..."
          placeholderTextColor={COLORS.creamMuted}
          onSubmitEditing={handleAdd}
          editable={!adding}
        />
        <Pressable style={styles.addPackingBtn} onPress={handleAdd} disabled={adding}>
          <Text style={styles.addPackingBtnText}>{adding ? '...' : 'Add'}</Text>
        </Pressable>
      </View>
      {addError ? <Text style={[styles.emptyText, { color: COLORS.coral }]}>{addError}</Text> : null}
      {items.map((item) => (
        <Pressable
          key={item.id}
          style={styles.packingRow}
          onPress={() => handleToggle(item.id)}
        >
          <View style={[styles.checkbox, item.packed && styles.checkboxChecked]} />
          <Text style={[styles.packingItemText, item.packed && styles.packingItemChecked]}>
            {item.itemName}
          </Text>
        </Pressable>
      ))}
      {items.length === 0 && (
        <Text style={styles.emptyText}>No items yet. Add something to bring.</Text>
      )}
    </View>
  );
}

// ---------------------------------------------------------------------------
// Styles
// ---------------------------------------------------------------------------
const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: COLORS.bg } as ViewStyle,
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: SPACING.md,
    paddingVertical: SPACING.sm,
    gap: SPACING.sm,
  } as ViewStyle,
  backBtn: { padding: SPACING.sm } as ViewStyle,
  headerCenter: { flex: 1 } as ViewStyle,
  headerTitle: {
    fontFamily: FONTS.header,
    fontSize: 20,
    color: COLORS.cream,
  } as TextStyle,
  headerSub: {
    fontFamily: FONTS.body,
    fontSize: 12,
    color: COLORS.creamMuted,
  } as TextStyle,
  shareBtn: { padding: SPACING.sm } as ViewStyle,
  membersRow: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: SPACING.lg,
    paddingBottom: SPACING.md,
    gap: SPACING.sm,
  } as ViewStyle,
  avatar: {
    width: 32,
    height: 32,
    borderRadius: 16,
    backgroundColor: COLORS.bgGlass,
    borderWidth: 1,
    borderColor: COLORS.border,
    alignItems: 'center',
    justifyContent: 'center',
  } as ViewStyle,
  avatarText: {
    fontFamily: FONTS.header,
    fontSize: 14,
    color: COLORS.sage,
  } as TextStyle,
  moreMembers: {
    fontFamily: FONTS.mono,
    fontSize: 12,
    color: COLORS.creamMuted,
  } as TextStyle,
  tabs: {
    flexDirection: 'row',
    paddingHorizontal: SPACING.md,
    paddingBottom: SPACING.md,
    gap: SPACING.sm,
  } as ViewStyle,
  tab: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: SPACING.xs,
    paddingVertical: SPACING.sm,
    paddingHorizontal: SPACING.md,
    borderRadius: RADIUS.md,
    backgroundColor: COLORS.bgGlass,
    borderWidth: 1,
    borderColor: COLORS.border,
  } as ViewStyle,
  tabActive: {
    borderColor: COLORS.sage,
    backgroundColor: COLORS.sageLight,
  } as ViewStyle,
  tabLabel: {
    fontFamily: FONTS.body,
    fontSize: 13,
    color: COLORS.creamMuted,
  } as TextStyle,
  tabLabelActive: {
    color: COLORS.sage,
    fontFamily: FONTS.bodyMedium,
  } as TextStyle,
  content: { flex: 1 } as ViewStyle,
  contentInner: { padding: SPACING.lg, paddingBottom: SPACING.xxxl } as ViewStyle,
  tabSection: { gap: SPACING.md } as ViewStyle,
  card: {
    backgroundColor: COLORS.bgGlass,
    borderRadius: RADIUS.lg,
    borderWidth: 1,
    borderColor: COLORS.border,
    padding: SPACING.lg,
  } as ViewStyle,
  cardTitle: {
    fontFamily: FONTS.header,
    fontSize: 18,
    color: COLORS.cream,
    marginBottom: SPACING.sm,
  } as TextStyle,
  emptyText: {
    fontFamily: FONTS.body,
    fontSize: 14,
    color: COLORS.creamMuted,
  } as TextStyle,
  loadingSkeleton: {
    padding: SPACING.lg,
  } as ViewStyle,
  errorText: {
    fontFamily: FONTS.body,
    fontSize: 16,
    color: COLORS.coral,
    textAlign: 'center',
    marginTop: SPACING.xl,
  } as TextStyle,
  dayCard: {
    backgroundColor: COLORS.bgGlass,
    borderRadius: RADIUS.lg,
    borderWidth: 1,
    borderColor: COLORS.border,
    padding: SPACING.lg,
    marginBottom: SPACING.md,
  } as ViewStyle,
  dayTitle: {
    fontFamily: FONTS.header,
    fontSize: 16,
    color: COLORS.sage,
    marginBottom: SPACING.md,
  } as TextStyle,
  activityRow: {
    marginBottom: SPACING.md,
  } as ViewStyle,
  slotLabel: {
    fontFamily: FONTS.mono,
    fontSize: 11,
    color: COLORS.creamMuted,
    marginBottom: 2,
  } as TextStyle,
  activityText: {
    fontFamily: FONTS.body,
    fontSize: 14,
    color: COLORS.cream,
    marginBottom: SPACING.sm,
  } as TextStyle,
  voteRow: { flexDirection: 'row', gap: SPACING.sm } as ViewStyle,
  voteBtn: {
    paddingVertical: SPACING.xs,
    paddingHorizontal: SPACING.md,
    borderRadius: RADIUS.sm,
    backgroundColor: COLORS.bgCard,
    borderWidth: 1,
    borderColor: COLORS.border,
  } as ViewStyle,
  voteBtnActive: {
    borderColor: COLORS.sage,
    backgroundColor: COLORS.sageLight,
  } as ViewStyle,
  voteBtnText: {
    fontFamily: FONTS.body,
    fontSize: 12,
    color: COLORS.cream,
  } as TextStyle,
  balanceCard: {
    backgroundColor: COLORS.bgGlass,
    borderRadius: RADIUS.lg,
    borderWidth: 1,
    borderColor: COLORS.border,
    padding: SPACING.lg,
  } as ViewStyle,
  balanceTitle: {
    fontFamily: FONTS.header,
    fontSize: 14,
    color: COLORS.creamMuted,
  } as TextStyle,
  balanceValue: {
    fontFamily: FONTS.header,
    fontSize: 28,
    marginVertical: SPACING.xs,
  } as TextStyle,
  positive: { color: COLORS.sage } as TextStyle,
  negative: { color: COLORS.coral } as TextStyle,
  balanceSub: {
    fontFamily: FONTS.body,
    fontSize: 12,
    color: COLORS.creamMuted,
  } as TextStyle,
  addExpenseBtn: {
    padding: SPACING.md,
    backgroundColor: COLORS.sageLight,
    borderRadius: RADIUS.md,
    borderWidth: 1,
    borderColor: COLORS.sage,
    alignItems: 'center',
  } as ViewStyle,
  addExpenseBtnText: {
    fontFamily: FONTS.bodyMedium,
    fontSize: 14,
    color: COLORS.sage,
  } as TextStyle,
  expenseRow: {
    padding: SPACING.md,
    marginBottom: SPACING.sm,
    backgroundColor: COLORS.bgGlass,
    borderRadius: RADIUS.md,
    borderWidth: 1,
    borderColor: COLORS.border,
  } as ViewStyle,
  expenseDesc: {
    fontFamily: FONTS.bodyMedium,
    fontSize: 14,
    color: COLORS.cream,
  } as TextStyle,
  expenseMeta: {
    fontFamily: FONTS.mono,
    fontSize: 12,
    color: COLORS.creamMuted,
  } as TextStyle,
  modalCard: {
    backgroundColor: COLORS.bgCard,
    borderRadius: RADIUS.lg,
    padding: SPACING.lg,
    borderWidth: 1,
    borderColor: COLORS.border,
  } as ViewStyle,
  modalTitle: {
    fontFamily: FONTS.header,
    fontSize: 18,
    color: COLORS.cream,
    marginBottom: SPACING.md,
  } as TextStyle,
  input: {
    fontFamily: FONTS.body,
    fontSize: 16,
    color: COLORS.cream,
    backgroundColor: COLORS.bg,
    borderRadius: RADIUS.md,
    borderWidth: 1,
    borderColor: COLORS.border,
    padding: SPACING.md,
    marginBottom: SPACING.md,
  } as TextStyle,
  catRow: { marginBottom: SPACING.md } as ViewStyle,
  catPill: {
    paddingVertical: SPACING.sm,
    paddingHorizontal: SPACING.md,
    borderRadius: RADIUS.full,
    backgroundColor: COLORS.bgGlass,
    marginRight: SPACING.sm,
  } as ViewStyle,
  catPillActive: {
    backgroundColor: COLORS.sageLight,
    borderWidth: 1,
    borderColor: COLORS.sage,
  } as ViewStyle,
  catPillText: {
    fontFamily: FONTS.body,
    fontSize: 12,
    color: COLORS.cream,
  } as TextStyle,
  modalActions: {
    flexDirection: 'row',
    justifyContent: 'flex-end',
    gap: SPACING.lg,
  } as ViewStyle,
  cancelText: {
    fontFamily: FONTS.body,
    fontSize: 14,
    color: COLORS.creamMuted,
  } as TextStyle,
  saveBtn: {
    paddingVertical: SPACING.sm,
    paddingHorizontal: SPACING.lg,
    backgroundColor: COLORS.sage,
    borderRadius: RADIUS.md,
  } as ViewStyle,
  saveBtnText: {
    fontFamily: FONTS.bodyMedium,
    fontSize: 14,
    color: COLORS.bg,
  } as TextStyle,
  chatSection: { flex: 1 } as ViewStyle,
  msgList: { maxHeight: 300 } as ViewStyle,
  msgBubble: {
    padding: SPACING.md,
    borderRadius: RADIUS.md,
    marginBottom: SPACING.sm,
    maxWidth: '80%',
  } as ViewStyle,
  msgBubbleMine: {
    alignSelf: 'flex-end',
    backgroundColor: COLORS.sageLight,
    borderWidth: 1,
    borderColor: COLORS.sage,
  } as ViewStyle,
  msgBubbleOther: {
    alignSelf: 'flex-start',
    backgroundColor: COLORS.bgGlass,
    borderWidth: 1,
    borderColor: COLORS.border,
  } as ViewStyle,
  msgName: {
    fontFamily: FONTS.mono,
    fontSize: 10,
    color: COLORS.creamMuted,
    marginBottom: 2,
  } as TextStyle,
  msgContent: {
    fontFamily: FONTS.body,
    fontSize: 14,
    color: COLORS.cream,
  } as TextStyle,
  chatInputRow: {
    flexDirection: 'row',
    gap: SPACING.sm,
    marginTop: SPACING.md,
  } as ViewStyle,
  chatInput: {
    flex: 1,
    fontFamily: FONTS.body,
    fontSize: 16,
    color: COLORS.cream,
    backgroundColor: COLORS.bgGlass,
    borderRadius: RADIUS.md,
    borderWidth: 1,
    borderColor: COLORS.border,
    padding: SPACING.md,
  } as TextStyle,
  sendBtn: {
    paddingVertical: SPACING.md,
    paddingHorizontal: SPACING.lg,
    backgroundColor: COLORS.sage,
    borderRadius: RADIUS.md,
    justifyContent: 'center',
  } as ViewStyle,
  sendBtnText: {
    fontFamily: FONTS.bodyMedium,
    fontSize: 14,
    color: COLORS.bg,
  } as TextStyle,
  packingInputRow: {
    flexDirection: 'row',
    gap: SPACING.sm,
    marginBottom: SPACING.md,
  } as ViewStyle,
  packingInput: {
    flex: 1,
    fontFamily: FONTS.body,
    fontSize: 16,
    color: COLORS.cream,
    backgroundColor: COLORS.bgGlass,
    borderRadius: RADIUS.md,
    borderWidth: 1,
    borderColor: COLORS.border,
    padding: SPACING.md,
  } as TextStyle,
  addPackingBtn: {
    paddingVertical: SPACING.md,
    paddingHorizontal: SPACING.lg,
    backgroundColor: COLORS.sage,
    borderRadius: RADIUS.md,
    justifyContent: 'center',
  } as ViewStyle,
  addPackingBtnText: {
    fontFamily: FONTS.bodyMedium,
    fontSize: 14,
    color: COLORS.bg,
  } as TextStyle,
  packingRow: {
    flexDirection: 'row',
    alignItems: 'center',
    padding: SPACING.md,
    backgroundColor: COLORS.bgGlass,
    borderRadius: RADIUS.md,
    marginBottom: SPACING.sm,
    gap: SPACING.md,
  } as ViewStyle,
  checkbox: {
    width: 22,
    height: 22,
    borderRadius: 6,
    borderWidth: 2,
    borderColor: COLORS.border,
  } as ViewStyle,
  checkboxChecked: {
    backgroundColor: COLORS.sage,
    borderColor: COLORS.sage,
  } as ViewStyle,
  packingItemText: {
    fontFamily: FONTS.body,
    fontSize: 15,
    color: COLORS.cream,
  } as TextStyle,
  packingItemChecked: {
    textDecorationLine: 'line-through',
    color: COLORS.creamMuted,
  } as TextStyle,
});
