// =============================================================================
// ROAM — Group Trip Types
// =============================================================================

export interface TripGroup {
  id: string;
  name: string;
  ownerId: string;
  tripId: string | null;
  inviteCode: string;
  destination: string;
  startDate: string | null;
  endDate: string | null;
  budgetTier: 'budget' | 'mid' | 'luxury';
  status: 'planning' | 'active' | 'completed';
  itineraryJson: Record<string, unknown> | null;
  createdAt: string;
  members?: GroupMember[];
}

export interface GroupMember {
  id: string;
  userId: string;
  displayName: string | null;
  avatarEmoji: string;
  role: 'owner' | 'admin' | 'member';
  status: 'invited' | 'active' | 'left';
  joinedAt: string;
}

export interface Vote {
  id: string;
  userId: string;
  dayNumber: number;
  timeSlot: 'morning' | 'afternoon' | 'evening';
  voteType: 'keep' | 'swap' | 'suggest';
  suggestion: string | null;
  createdAt: string;
}

export interface VoteResults {
  keep: number;
  swap: number;
  suggestions: string[];
  winner: 'keep' | 'swap';
}

export interface TripExpense {
  id: string;
  payerId: string;
  amount: number;
  currency: string;
  category: 'food' | 'transport' | 'accommodation' | 'activity' | 'drinks' | 'other';
  description: string;
  splitType: 'equal' | 'custom' | 'payer_only';
  dayNumber: number | null;
  createdAt: string;
  splits?: ExpenseSplit[];
}

export interface ExpenseSplit {
  id: string;
  userId: string;
  amount: number;
  settled: boolean;
}

export interface Balance {
  userId: string;
  displayName: string;
  avatarEmoji: string;
  totalPaid: number;
  totalOwed: number;
  netBalance: number;
  owes: { userId: string; displayName: string; amount: number }[];
}

export interface GroupMessage {
  id: string;
  userId: string;
  content: string;
  messageType: 'text' | 'expense' | 'vote' | 'activity_change' | 'system';
  metadata: Record<string, unknown> | null;
  createdAt: string;
}

export interface PackingItem {
  id: string;
  itemName: string;
  assignedTo: string | null;
  isShared: boolean;
  packed: boolean;
  category: string;
}
