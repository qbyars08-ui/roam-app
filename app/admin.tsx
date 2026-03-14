// =============================================================================
// ROAM Admin Analytics Dashboard
// Internal metrics, revenue tracking, and API cost estimation
// =============================================================================

import React, { useEffect, useState, useCallback, useRef } from 'react';
import {
  View,
  Text,
  ScrollView,
  StyleSheet,
  RefreshControl,
  Animated,
  Dimensions,
} from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { COLORS, FONTS, SPACING, RADIUS } from '../lib/constants';
import { supabase } from '../lib/supabase';

// =============================================================================
// Types
// =============================================================================

interface KeyMetrics {
  totalUsers: number;
  tripsGenerated: number;
  waitlistSignups: number;
  proSubscribers: number;
}

interface FeatureUsageItem {
  name: string;
  count: number;
}

interface DestinationItem {
  destination: string;
  count: number;
}

interface GroupTripStats {
  totalGroups: number;
  avgMembers: number;
  totalExpenses: number;
  inviteConversion: number;
}

interface MonetizationAnalytics {
  rpu: number;
  conversionByOnboarding: { variant: string; total: number; pro: number }[];
  affiliateCtrByPartner: { partner: string; clicks: number }[];
}

interface ChurnLtv {
  churnRiskCount: number;
  ltvProjection: number;
}

interface DashboardData {
  metrics: KeyMetrics;
  featureUsage: FeatureUsageItem[];
  topDestinations: DestinationItem[];
  affiliateClicks: number;
  groupStats: GroupTripStats;
  monetization: MonetizationAnalytics;
  churnLtv: ChurnLtv;
  lastRefreshed: Date;
}

interface PreviousMetrics {
  totalUsers: number;
  tripsGenerated: number;
  waitlistSignups: number;
  proSubscribers: number;
}

// =============================================================================
// Constants
// =============================================================================

const REFRESH_INTERVAL_MS = 30_000;
const PRO_PRICE_MONTHLY = 4.99;
const CLAUDE_COST_PER_TRIP = 0.003;
const GOOGLE_PLACES_COST_PER_CALL = 0.017;
const { width: SCREEN_WIDTH } = Dimensions.get('window');

const FEATURE_LABELS: Record<string, string> = {
  itinerary_viewed: 'Itinerary views',
  share_card_generated: 'Share card generated',
  flight_search: 'Flight searches',
  weather_check: 'Weather checks',
  expense_added: 'Expense added',
  group_trip_created: 'Group trips created',
  voice_guide_played: 'Voice guide played',
  packing_list_generated: 'Packing list generated',
};

const FEATURE_EVENT_TYPES = Object.keys(FEATURE_LABELS);

// =============================================================================
// Helpers
// =============================================================================

function formatNumber(n: number): string {
  if (n >= 1_000_000) {
    return (n / 1_000_000).toFixed(1).replace(/\.0$/, '') + 'M';
  }
  return n.toLocaleString('en-US');
}

function formatCurrency(n: number): string {
  return '$' + n.toFixed(2).replace(/\B(?=(\d{3})+(?!\d))/g, ',');
}

function formatTimestamp(date: Date): string {
  const hours = date.getHours();
  const minutes = date.getMinutes().toString().padStart(2, '0');
  const seconds = date.getSeconds().toString().padStart(2, '0');
  const ampm = hours >= 12 ? 'PM' : 'AM';
  const displayHours = hours % 12 || 12;
  return `${displayHours}:${minutes}:${seconds} ${ampm}`;
}

function getTrendIndicator(
  current: number,
  previous: number,
): { label: string; color: string } {
  if (previous === 0 || current === previous) {
    return { label: '--', color: COLORS.cream };
  }
  if (current > previous) {
    return { label: 'UP', color: COLORS.sage };
  }
  return { label: 'DOWN', color: COLORS.coral };
}

// =============================================================================
// Skeleton Loader
// =============================================================================

function SkeletonBar({
  width,
  height = 14,
}: {
  width: number | string;
  height?: number;
}) {
  const pulseAnim = useRef(new Animated.Value(0.3)).current;

  useEffect(() => {
    const animation = Animated.loop(
      Animated.sequence([
        Animated.timing(pulseAnim, {
          toValue: 0.7,
          duration: 800,
          useNativeDriver: true,
        }),
        Animated.timing(pulseAnim, {
          toValue: 0.3,
          duration: 800,
          useNativeDriver: true,
        }),
      ]),
    );
    animation.start();
    return () => animation.stop();
  }, [pulseAnim]);

  return (
    <Animated.View
      style={[
        styles.skeletonBar,
        {
          width: width as number,
          height,
          opacity: pulseAnim,
        },
      ]}
    />
  );
}

function SkeletonCard() {
  return (
    <View style={styles.statCard}>
      <SkeletonBar width={60} height={28} />
      <View style={{ height: SPACING.xs }} />
      <SkeletonBar width={80} height={12} />
      <View style={{ height: SPACING.xs }} />
      <SkeletonBar width={40} height={10} />
    </View>
  );
}

// =============================================================================
// Section Components
// =============================================================================

function SectionHeader({ title }: { title: string }) {
  return <Text style={styles.sectionTitle}>{title}</Text>;
}

function StatCard({
  value,
  label,
  trend,
}: {
  value: string;
  label: string;
  trend: { label: string; color: string };
}) {
  return (
    <View style={styles.statCard}>
      <Text style={styles.statValue}>{value}</Text>
      <Text style={styles.statLabel}>{label}</Text>
      <Text style={[styles.trendText, { color: trend.color }]}>
        {trend.label}
      </Text>
    </View>
  );
}

function HorizontalBar({
  value,
  maxValue,
  color = COLORS.sage,
}: {
  value: number;
  maxValue: number;
  color?: string;
}) {
  const barWidth = maxValue > 0 ? (value / maxValue) * 100 : 0;
  return (
    <View style={styles.barBackground}>
      <View
        style={[
          styles.barFill,
          {
            width: `${Math.min(barWidth, 100)}%`,
            backgroundColor: color,
          },
        ]}
      />
    </View>
  );
}

// =============================================================================
// Data Fetching
// =============================================================================

async function fetchTripsGenerated(): Promise<number> {
  try {
    const { data, error } = await supabase
      .from('profiles')
      .select('trips_generated_this_month');
    if (error) return 0;
    const sum = (data ?? []).reduce((acc: number, row: { trips_generated_this_month?: number }) =>
      acc + (row.trips_generated_this_month ?? 0), 0);
    return sum;
  } catch {
    return 0;
  }
}

async function fetchProSubscribers(): Promise<number> {
  try {
    const { count } = await supabase
      .from('profiles')
      .select('*', { count: 'exact', head: true })
      .or('subscription_tier.eq.pro,pro_referral_expires_at.gt.' + new Date().toISOString());
    return count ?? 0;
  } catch {
    return 0;
  }
}

async function safeCount(
  table: string,
  filter?: { column: string; value: unknown },
): Promise<number> {
  try {
    let query = supabase
      .from(table)
      .select('*', { count: 'exact', head: true });
    if (filter) {
      query = query.eq(filter.column, filter.value);
    }
    const { count, error } = await query;
    if (error) return 0;
    return count ?? 0;
  } catch {
    return 0;
  }
}

async function fetchFeatureUsage(): Promise<FeatureUsageItem[]> {
  const results: FeatureUsageItem[] = [];

  for (const eventType of FEATURE_EVENT_TYPES) {
    try {
      const { count, error } = await supabase
        .from('analytics_events')
        .select('*', { count: 'exact', head: true })
        .eq('event_type', eventType);

      results.push({
        name: FEATURE_LABELS[eventType] ?? eventType,
        count: error ? 0 : (count ?? 0),
      });
    } catch {
      results.push({
        name: FEATURE_LABELS[eventType] ?? eventType,
        count: 0,
      });
    }
  }

  return results.sort((a, b) => b.count - a.count);
}

async function fetchTopDestinations(): Promise<DestinationItem[]> {
  try {
    const { data, error } = await supabase
      .from('analytics_events')
      .select('payload')
      .eq('event_type', 'trip_created');

    if (error || !data) return [];

    const counts: Record<string, number> = {};
    for (const row of data) {
      const meta = row.payload as Record<string, unknown> | null;
      const dest =
        (meta?.destination as string) ?? (meta?.city as string) ?? 'Unknown';
      if (typeof dest === 'string' && dest !== 'Unknown') {
        counts[dest] = (counts[dest] ?? 0) + 1;
      }
    }

    return Object.entries(counts)
      .map(([destination, count]) => ({ destination, count }))
      .sort((a, b) => b.count - a.count)
      .slice(0, 10);
  } catch {
    return [];
  }
}

async function fetchAffiliateClicks(): Promise<number> {
  return safeCount('affiliate_clicks');
}

async function fetchMonetization(): Promise<MonetizationAnalytics> {
  try {
    const [{ data: profiles }, { data: affiliateByPartner }] = await Promise.all([
      supabase.from('profiles').select('subscription_tier, pro_referral_expires_at, onboarding_variant'),
      supabase.from('affiliate_clicks').select('partner_id'),
    ]);
    const proCount = (profiles ?? []).filter((p: { subscription_tier?: string; pro_referral_expires_at?: string }) =>
      p.subscription_tier === 'pro' || (p.pro_referral_expires_at && new Date(p.pro_referral_expires_at) > new Date())).length;
    const totalUsers = (profiles ?? []).length;
    const rpu = totalUsers > 0 ? (proCount * PRO_PRICE_MONTHLY) / totalUsers : 0;
    const variantMap = new Map<string, { total: number; pro: number }>();
    for (const p of profiles ?? []) {
      const v = (p as { onboarding_variant?: string }).onboarding_variant ?? 'default';
      const cur = variantMap.get(v) ?? { total: 0, pro: 0 };
      cur.total++;
      if ((p as { subscription_tier?: string }).subscription_tier === 'pro' ||
          ((p as { pro_referral_expires_at?: string }).pro_referral_expires_at &&
           new Date((p as { pro_referral_expires_at: string }).pro_referral_expires_at) > new Date())) cur.pro++;
      variantMap.set(v, cur);
    }
    const conversionByOnboarding = Array.from(variantMap.entries())
      .map(([variant, x]) => ({ variant, total: x.total, pro: x.pro }));
    const partnerMap = new Map<string, number>();
    for (const r of affiliateByPartner ?? []) {
      const pid = (r as { partner_id?: string }).partner_id ?? 'unknown';
      partnerMap.set(pid, (partnerMap.get(pid) ?? 0) + 1);
    }
    const affiliateCtrByPartner = Array.from(partnerMap.entries())
      .map(([partner, clicks]) => ({ partner, clicks }))
      .sort((a, b) => b.clicks - a.clicks);
    return { rpu, conversionByOnboarding, affiliateCtrByPartner };
  } catch {
    return { rpu: 0, conversionByOnboarding: [], affiliateCtrByPartner: [] };
  }
}

async function fetchChurnLtv(totalUsers: number, proCount: number): Promise<ChurnLtv> {
  try {
    const cutoff = new Date();
    cutoff.setDate(cutoff.getDate() - 14);
    const { count: inactive } = await supabase
      .from('profiles')
      .select('*', { count: 'exact', head: true })
      .lt('updated_at', cutoff.toISOString());
    const churnRiskCount = inactive ?? 0;
    const conversionRate = totalUsers > 0 ? proCount / totalUsers : 0;
    const avgLifetimeMonths = 6;
    const ltvProjection = conversionRate * PRO_PRICE_MONTHLY * avgLifetimeMonths;
    return { churnRiskCount, ltvProjection };
  } catch {
    return { churnRiskCount: 0, ltvProjection: 0 };
  }
}

async function fetchGroupStats(): Promise<GroupTripStats> {
  try {
    const totalGroups = await safeCount('trip_groups');

    let avgMembers = 0;
    let totalExpenses = 0;
    const inviteConversion = 0;

    try {
      const { data: members } = await supabase
        .from('trip_group_members')
        .select('group_id');

      if (members && totalGroups > 0) {
        avgMembers = parseFloat((members.length / totalGroups).toFixed(1));
      }
    } catch {
      // table may not exist yet
    }

    try {
      const { data: expenses } = await supabase
        .from('trip_expenses')
        .select('amount');

      if (expenses) {
        totalExpenses = expenses.reduce(
          (sum: number, e: { amount: number | null }) =>
            sum + (e.amount ?? 0),
          0,
        );
      }
    } catch {
      // table may not exist yet
    }

    return { totalGroups, avgMembers, totalExpenses, inviteConversion };
  } catch {
    return {
      totalGroups: 0,
      avgMembers: 0,
      totalExpenses: 0,
      inviteConversion: 0,
    };
  }
}

async function fetchAllData(): Promise<DashboardData> {
  const [
    totalUsers,
    tripsGenerated,
    waitlistSignups,
    proSubscribers,
    featureUsage,
    topDestinations,
    affiliateClicks,
    groupStats,
    monetization,
  ] = await Promise.all([
    safeCount('profiles'),
    fetchTripsGenerated(),
    safeCount('waitlist_emails'),
    fetchProSubscribers(),
    fetchFeatureUsage(),
    fetchTopDestinations(),
    fetchAffiliateClicks(),
    fetchGroupStats(),
    fetchMonetization(),
  ]);

  const churnLtv = await fetchChurnLtv(totalUsers, proSubscribers);

  return {
    metrics: {
      totalUsers,
      tripsGenerated,
      waitlistSignups,
      proSubscribers,
    },
    featureUsage,
    topDestinations,
    affiliateClicks,
    groupStats,
    monetization,
    churnLtv,
    lastRefreshed: new Date(),
  };
}

// =============================================================================
// Main Component
// =============================================================================

export default function AdminDashboard() {
  const insets = useSafeAreaInsets();

  const [data, setData] = useState<DashboardData | null>(null);
  const [previousMetrics, setPreviousMetrics] =
    useState<PreviousMetrics | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [isRefreshing, setIsRefreshing] = useState(false);

  const loadData = useCallback(async (isManualRefresh = false) => {
    if (isManualRefresh) setIsRefreshing(true);

    try {
      const freshData = await fetchAllData();

      setData((prev) => {
        if (prev) {
          setPreviousMetrics({
            totalUsers: prev.metrics.totalUsers,
            tripsGenerated: prev.metrics.tripsGenerated,
            waitlistSignups: prev.metrics.waitlistSignups,
            proSubscribers: prev.metrics.proSubscribers,
          });
        }
        return freshData;
      });
    } catch {
      // Silently handle — dashboard shows last known data
    } finally {
      setIsLoading(false);
      setIsRefreshing(false);
    }
  }, []);

  // Initial load
  useEffect(() => {
    loadData();
  }, [loadData]);

  // Auto-refresh every 30 seconds
  useEffect(() => {
    const interval = setInterval(() => {
      loadData();
    }, REFRESH_INTERVAL_MS);
    return () => clearInterval(interval);
  }, [loadData]);

  // =========================================================================
  // Derived values
  // =========================================================================

  const metrics = data?.metrics ?? {
    totalUsers: 0,
    tripsGenerated: 0,
    waitlistSignups: 0,
    proSubscribers: 0,
  };

  const prev = previousMetrics ?? {
    totalUsers: 0,
    tripsGenerated: 0,
    waitlistSignups: 0,
    proSubscribers: 0,
  };

  const freeUsers = Math.max(metrics.totalUsers - metrics.proSubscribers, 0);
  const conversionRate =
    metrics.totalUsers > 0
      ? ((metrics.proSubscribers / metrics.totalUsers) * 100).toFixed(1)
      : '0.0';

  const subscriptionRevenue = metrics.proSubscribers * PRO_PRICE_MONTHLY;

  const featureUsage = data?.featureUsage ?? [];
  const maxFeatureCount = Math.max(
    ...featureUsage.map((f) => f.count),
    1,
  );

  const topDestinations = data?.topDestinations ?? [];
  const maxDestCount = Math.max(
    ...topDestinations.map((d) => d.count),
    1,
  );

  const claudeCost = metrics.tripsGenerated * CLAUDE_COST_PER_TRIP;
  const enrichmentEstimate = metrics.tripsGenerated * 2;
  const googlePlacesCost =
    enrichmentEstimate * GOOGLE_PLACES_COST_PER_CALL;
  const totalApiCost = claudeCost + googlePlacesCost;

  // =========================================================================
  // Render
  // =========================================================================

  return (
    <View style={[styles.container, { paddingTop: insets.top }]}>
      <ScrollView
        style={styles.scrollView}
        contentContainerStyle={[
          styles.scrollContent,
          { paddingBottom: insets.bottom + SPACING.xl },
        ]}
        showsVerticalScrollIndicator={false}
        refreshControl={
          <RefreshControl
            refreshing={isRefreshing}
            onRefresh={() => loadData(true)}
            tintColor={COLORS.sage}
          />
        }
      >
        {/* ============================================================== */}
        {/* HEADER                                                         */}
        {/* ============================================================== */}
        <View style={styles.header}>
          <Text style={styles.headerTitle}>ROAM ADMIN</Text>
          <Text style={styles.headerTimestamp}>
            {data
              ? `Last refreshed ${formatTimestamp(data.lastRefreshed)}`
              : 'Loading...'}
          </Text>
        </View>

        {/* ============================================================== */}
        {/* KEY METRICS (2x2 Grid)                                         */}
        {/* ============================================================== */}
        <SectionHeader title="Key Metrics" />

        {isLoading ? (
          <View style={styles.metricsGrid}>
            <SkeletonCard />
            <SkeletonCard />
            <SkeletonCard />
            <SkeletonCard />
          </View>
        ) : (
          <View style={styles.metricsGrid}>
            <StatCard
              value={formatNumber(metrics.totalUsers)}
              label="Total Users"
              trend={getTrendIndicator(metrics.totalUsers, prev.totalUsers)}
            />
            <StatCard
              value={formatNumber(metrics.tripsGenerated)}
              label="Trips Generated"
              trend={getTrendIndicator(
                metrics.tripsGenerated,
                prev.tripsGenerated,
              )}
            />
            <StatCard
              value={formatNumber(metrics.waitlistSignups)}
              label="Waitlist Signups"
              trend={getTrendIndicator(
                metrics.waitlistSignups,
                prev.waitlistSignups,
              )}
            />
            <StatCard
              value={formatNumber(metrics.proSubscribers)}
              label="Pro Subscribers"
              trend={getTrendIndicator(
                metrics.proSubscribers,
                prev.proSubscribers,
              )}
            />
          </View>
        )}

        {/* ============================================================== */}
        {/* CONVERSION FUNNEL                                              */}
        {/* ============================================================== */}
        <SectionHeader title="Conversion Funnel" />

        {isLoading ? (
          <View style={styles.card}>
            <SkeletonBar width="70%" height={16} />
            <View style={{ height: SPACING.sm }} />
            <SkeletonBar width="100%" height={20} />
          </View>
        ) : (
          <View style={styles.card}>
            <View style={styles.funnelHeader}>
              <Text style={styles.funnelLabel}>Free to Pro</Text>
              <Text style={styles.funnelPercentage}>
                {conversionRate}% conversion
              </Text>
            </View>
            <View style={styles.funnelDetail}>
              <Text style={styles.funnelDetailText}>
                {formatNumber(freeUsers)} free {'  /  '}
                {formatNumber(metrics.proSubscribers)} pro {'  /  '}
                {formatNumber(metrics.totalUsers)} total
              </Text>
            </View>
            <View style={styles.barBackground}>
              <View
                style={[
                  styles.barFill,
                  {
                    width: `${
                      metrics.totalUsers > 0
                        ? (metrics.proSubscribers / metrics.totalUsers) * 100
                        : 0
                    }%`,
                    backgroundColor: COLORS.sage,
                  },
                ]}
              />
            </View>
          </View>
        )}

        {/* ============================================================== */}
        {/* FEATURE USAGE BREAKDOWN                                        */}
        {/* ============================================================== */}
        <SectionHeader title="Feature Usage" />

        {isLoading ? (
          <View style={styles.card}>
            {Array.from({ length: 5 }).map((_, i) => (
              <View key={`feat-skel-${i}`} style={{ marginBottom: SPACING.md }}>
                <SkeletonBar width="60%" height={12} />
                <View style={{ height: SPACING.xs }} />
                <SkeletonBar width="100%" height={10} />
              </View>
            ))}
          </View>
        ) : (
          <View style={styles.card}>
            {featureUsage.map((feature, index) => (
              <View
                key={feature.name}
                style={[
                  styles.featureRow,
                  index < featureUsage.length - 1 && styles.featureRowBorder,
                ]}
              >
                <View style={styles.featureInfo}>
                  <Text style={styles.featureName}>{feature.name}</Text>
                  <Text style={styles.featureCount}>
                    {formatNumber(feature.count)}
                  </Text>
                </View>
                <HorizontalBar
                  value={feature.count}
                  maxValue={maxFeatureCount}
                />
              </View>
            ))}
            {featureUsage.length === 0 && (
              <Text style={styles.emptyText}>No events recorded yet</Text>
            )}
          </View>
        )}

        {/* ============================================================== */}
        {/* REVENUE TRACKER                                                */}
        {/* ============================================================== */}
        <SectionHeader title="Revenue Tracker" />

        {isLoading ? (
          <View style={styles.card}>
            <SkeletonBar width="50%" height={20} />
            <View style={{ height: SPACING.md }} />
            <SkeletonBar width="80%" height={14} />
            <View style={{ height: SPACING.sm }} />
            <SkeletonBar width="65%" height={14} />
          </View>
        ) : (
          <View style={styles.card}>
            <Text style={styles.revenueTotal}>
              {formatCurrency(subscriptionRevenue)}
              <Text style={styles.revenuePeriod}> / mo</Text>
            </Text>
            <View style={styles.revenueBreakdown}>
              <View style={styles.revenueRow}>
                <Text style={styles.revenueLabel}>Subscriptions</Text>
                <Text style={styles.revenueValue}>
                  {formatNumber(metrics.proSubscribers)} x{' '}
                  {formatCurrency(PRO_PRICE_MONTHLY)} ={' '}
                  {formatCurrency(subscriptionRevenue)}
                </Text>
              </View>
              <View style={styles.revenueDivider} />
              <View style={styles.revenueRow}>
                <Text style={styles.revenueLabel}>Affiliate clicks</Text>
                <Text style={styles.revenueValue}>
                  {formatNumber(data?.affiliateClicks ?? 0)} clicks
                </Text>
              </View>
              <View style={styles.revenueDivider} />
              <View style={styles.revenueRow}>
                <Text style={styles.revenueLabel}>Est. MRR</Text>
                <Text
                  style={[styles.revenueValue, { color: COLORS.sage }]}
                >
                  {formatCurrency(subscriptionRevenue)}
                </Text>
              </View>
            </View>
          </View>
        )}

        {/* ============================================================== */}
        {/* MOST POPULAR DESTINATIONS                                      */}
        {/* ============================================================== */}
        <SectionHeader title="Top Destinations" />

        {isLoading ? (
          <View style={styles.card}>
            {Array.from({ length: 5 }).map((_, i) => (
              <View key={`dest-skel-${i}`} style={{ marginBottom: SPACING.md }}>
                <SkeletonBar width={`${80 - i * 10}%`} height={12} />
                <View style={{ height: SPACING.xs }} />
                <SkeletonBar width="100%" height={10} />
              </View>
            ))}
          </View>
        ) : (
          <View style={styles.card}>
            {topDestinations.map((dest, index) => (
              <View
                key={dest.destination}
                style={[
                  styles.destinationRow,
                  index < topDestinations.length - 1 &&
                    styles.featureRowBorder,
                ]}
              >
                <View style={styles.destinationRank}>
                  <Text style={styles.rankNumber}>{index + 1}</Text>
                </View>
                <View style={styles.destinationInfo}>
                  <View style={styles.destinationHeader}>
                    <Text style={styles.destinationName}>
                      {dest.destination}
                    </Text>
                    <Text style={styles.destinationCount}>
                      {formatNumber(dest.count)} trips
                    </Text>
                  </View>
                  <HorizontalBar
                    value={dest.count}
                    maxValue={maxDestCount}
                    color={COLORS.accentGold}
                  />
                </View>
              </View>
            ))}
            {topDestinations.length === 0 && (
              <Text style={styles.emptyText}>No trip data available</Text>
            )}
          </View>
        )}

        {/* ============================================================== */}
        {/* API COST ESTIMATOR                                             */}
        {/* ============================================================== */}
        <SectionHeader title="API Cost Estimator" />

        {isLoading ? (
          <View style={styles.card}>
            {Array.from({ length: 4 }).map((_, i) => (
              <View key={`api-skel-${i}`} style={{ marginBottom: SPACING.md }}>
                <SkeletonBar width="70%" height={14} />
              </View>
            ))}
          </View>
        ) : (
          <View style={styles.card}>
            <View style={styles.apiCostRow}>
              <View style={styles.apiCostInfo}>
                <Text style={styles.apiCostName}>Claude API</Text>
                <Text style={styles.apiCostDetail}>
                  {formatNumber(metrics.tripsGenerated)} trips x{' '}
                  {formatCurrency(CLAUDE_COST_PER_TRIP)}
                </Text>
              </View>
              <Text style={styles.apiCostValue}>
                {formatCurrency(claudeCost)}
              </Text>
            </View>

            <View style={styles.apiCostDivider} />

            <View style={styles.apiCostRow}>
              <View style={styles.apiCostInfo}>
                <Text style={styles.apiCostName}>Google Places</Text>
                <Text style={styles.apiCostDetail}>
                  ~{formatNumber(enrichmentEstimate)} calls x{' '}
                  {formatCurrency(GOOGLE_PLACES_COST_PER_CALL)}
                </Text>
              </View>
              <Text style={styles.apiCostValue}>
                {formatCurrency(googlePlacesCost)}
              </Text>
            </View>

            <View style={styles.apiCostDivider} />

            <View style={styles.apiCostRow}>
              <View style={styles.apiCostInfo}>
                <Text style={styles.apiCostName}>Ticketmaster</Text>
                <Text style={styles.apiCostDetail}>Free tier</Text>
              </View>
              <Text style={[styles.apiCostValue, { color: COLORS.sage }]}>
                {formatCurrency(0)}
              </Text>
            </View>

            <View style={styles.apiCostDivider} />

            <View style={styles.apiCostRow}>
              <View style={styles.apiCostInfo}>
                <Text style={styles.apiCostName}>State Dept</Text>
                <Text style={styles.apiCostDetail}>Free, unlimited</Text>
              </View>
              <Text style={[styles.apiCostValue, { color: COLORS.sage }]}>
                {formatCurrency(0)}
              </Text>
            </View>

            <View style={styles.apiCostTotalDivider} />

            <View style={styles.apiCostRow}>
              <Text style={styles.apiCostTotalLabel}>
                Est. monthly total
              </Text>
              <Text style={styles.apiCostTotalValue}>
                {formatCurrency(totalApiCost)}
              </Text>
            </View>
          </View>
        )}

        {/* ============================================================== */}
        {/* MONETIZATION ANALYTICS                                         */}
        {/* ============================================================== */}
        <SectionHeader title="Monetization" />

        {isLoading ? (
          <View style={styles.card}>
            <SkeletonBar width="40%" height={16} />
          </View>
        ) : (
          <View style={styles.card}>
            <View style={styles.revenueRow}>
              <Text style={styles.revenueLabel}>RPU</Text>
              <Text style={styles.revenueValue}>
                {formatCurrency(data?.monetization.rpu ?? 0)} / user
              </Text>
            </View>
            <View style={styles.revenueRow}>
              <Text style={styles.revenueLabel}>LTV projection</Text>
              <Text style={styles.revenueValue}>
                {formatCurrency(data?.churnLtv.ltvProjection ?? 0)} / user
              </Text>
            </View>
            <View style={styles.revenueRow}>
              <Text style={styles.revenueLabel}>Churn risk (14d inactive)</Text>
              <Text style={styles.revenueValue}>
                {formatNumber(data?.churnLtv.churnRiskCount ?? 0)}
              </Text>
            </View>
            {(data?.monetization.conversionByOnboarding?.length ?? 0) > 0 && (
              <>
                <View style={styles.revenueDivider} />
                <Text style={styles.funnelLabel}>Conversion by onboarding</Text>
                {(data?.monetization.conversionByOnboarding ?? []).map((v) => (
                  <View key={v.variant} style={styles.revenueRow}>
                    <Text style={styles.revenueLabel}>{v.variant}</Text>
                    <Text style={styles.revenueValue}>
                      {v.pro}/{v.total} ({v.total > 0 ? ((v.pro / v.total) * 100).toFixed(1) : 0}%)
                    </Text>
                  </View>
                ))}
              </>
            )}
            {(data?.monetization.affiliateCtrByPartner?.length ?? 0) > 0 && (
              <>
                <View style={styles.revenueDivider} />
                <Text style={styles.funnelLabel}>Affiliate clicks by partner</Text>
                {(data?.monetization.affiliateCtrByPartner ?? []).map((p) => (
                  <View key={p.partner} style={styles.revenueRow}>
                    <Text style={styles.revenueLabel}>{p.partner}</Text>
                    <Text style={styles.revenueValue}>{formatNumber(p.clicks)}</Text>
                  </View>
                ))}
              </>
            )}
          </View>
        )}

        {/* ============================================================== */}
        {/* GROUP TRIP STATS                                               */}
        {/* ============================================================== */}
        <SectionHeader title="Group Trip Stats" />

        {isLoading ? (
          <View style={styles.metricsGrid}>
            <SkeletonCard />
            <SkeletonCard />
            <SkeletonCard />
            <SkeletonCard />
          </View>
        ) : (
          <View style={styles.metricsGrid}>
            <View style={styles.statCard}>
              <Text style={styles.statValue}>
                {formatNumber(data?.groupStats.totalGroups ?? 0)}
              </Text>
              <Text style={styles.statLabel}>Groups Created</Text>
            </View>
            <View style={styles.statCard}>
              <Text style={styles.statValue}>
                {data?.groupStats.avgMembers.toFixed(1) ?? '0.0'}
              </Text>
              <Text style={styles.statLabel}>Avg Members</Text>
            </View>
            <View style={styles.statCard}>
              <Text style={styles.statValue}>
                {formatCurrency(data?.groupStats.totalExpenses ?? 0)}
              </Text>
              <Text style={styles.statLabel}>Expenses Tracked</Text>
            </View>
            <View style={styles.statCard}>
              <Text style={styles.statValue}>
                {data?.groupStats.inviteConversion.toFixed(1) ?? '0.0'}%
              </Text>
              <Text style={styles.statLabel}>Invite Conversion</Text>
            </View>
          </View>
        )}

        {/* Footer spacer */}
        <View style={{ height: SPACING.xxl }} />
      </ScrollView>
    </View>
  );
}

// =============================================================================
// Styles
// =============================================================================

const styles = StyleSheet.create({
  // Layout
  container: {
    flex: 1,
    backgroundColor: COLORS.bg,
  },
  scrollView: {
    flex: 1,
  },
  scrollContent: {
    paddingHorizontal: SPACING.md,
  },

  // Header
  header: {
    paddingTop: SPACING.lg,
    paddingBottom: SPACING.md,
    borderBottomWidth: StyleSheet.hairlineWidth,
    borderBottomColor: COLORS.border,
    marginBottom: SPACING.lg,
  },
  headerTitle: {
    fontFamily: FONTS.mono,
    fontSize: 18,
    color: COLORS.sage,
    letterSpacing: 4,
  },
  headerTimestamp: {
    fontFamily: FONTS.mono,
    fontSize: 11,
    color: COLORS.cream,
    opacity: 0.4,
    marginTop: SPACING.xs,
  },

  // Section titles
  sectionTitle: {
    fontFamily: FONTS.header,
    fontSize: 22,
    color: COLORS.cream,
    marginBottom: SPACING.sm,
    marginTop: SPACING.lg,
  },

  // Metrics grid (2x2)
  metricsGrid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: SPACING.sm,
  },
  statCard: {
    flex: 1,
    minWidth:
      (SCREEN_WIDTH - SPACING.md * 2 - SPACING.sm) / 2 - 1,
    backgroundColor: COLORS.bgCard,
    borderRadius: RADIUS.md,
    borderWidth: StyleSheet.hairlineWidth,
    borderColor: COLORS.border,
    padding: SPACING.md,
  },
  statValue: {
    fontFamily: FONTS.header,
    fontSize: 28,
    color: COLORS.cream,
    lineHeight: 32,
  },
  statLabel: {
    fontFamily: FONTS.mono,
    fontSize: 10,
    color: COLORS.cream,
    opacity: 0.5,
    letterSpacing: 1,
    textTransform: 'uppercase',
    marginTop: SPACING.xs,
  },
  trendText: {
    fontFamily: FONTS.mono,
    fontSize: 10,
    letterSpacing: 1,
    marginTop: SPACING.xs,
  },

  // Card (generic section container)
  card: {
    backgroundColor: COLORS.bgCard,
    borderRadius: RADIUS.md,
    borderWidth: StyleSheet.hairlineWidth,
    borderColor: COLORS.border,
    padding: SPACING.md,
  },

  // Conversion funnel
  funnelHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: SPACING.xs,
  },
  funnelLabel: {
    fontFamily: FONTS.body,
    fontSize: 14,
    color: COLORS.cream,
    opacity: 0.7,
  },
  funnelPercentage: {
    fontFamily: FONTS.mono,
    fontSize: 14,
    color: COLORS.sage,
  },
  funnelDetail: {
    marginBottom: SPACING.sm,
  },
  funnelDetailText: {
    fontFamily: FONTS.mono,
    fontSize: 11,
    color: COLORS.cream,
    opacity: 0.4,
  },

  // Horizontal bar (shared)
  barBackground: {
    height: 6,
    backgroundColor: COLORS.border,
    borderRadius: 3,
    overflow: 'hidden',
    marginTop: SPACING.xs,
  },
  barFill: {
    height: '100%',
    borderRadius: 3,
    minWidth: 2,
  },

  // Feature usage
  featureRow: {
    paddingVertical: SPACING.sm,
  },
  featureRowBorder: {
    borderBottomWidth: StyleSheet.hairlineWidth,
    borderBottomColor: COLORS.border,
  },
  featureInfo: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
  },
  featureName: {
    fontFamily: FONTS.body,
    fontSize: 13,
    color: COLORS.cream,
    opacity: 0.8,
  },
  featureCount: {
    fontFamily: FONTS.mono,
    fontSize: 12,
    color: COLORS.cream,
    opacity: 0.5,
  },

  // Revenue
  revenueTotal: {
    fontFamily: FONTS.header,
    fontSize: 32,
    color: COLORS.sage,
    marginBottom: SPACING.md,
  },
  revenuePeriod: {
    fontFamily: FONTS.mono,
    fontSize: 14,
    color: COLORS.cream,
    opacity: 0.4,
  },
  revenueBreakdown: {},
  revenueRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingVertical: SPACING.sm,
  },
  revenueLabel: {
    fontFamily: FONTS.body,
    fontSize: 13,
    color: COLORS.cream,
    opacity: 0.6,
  },
  revenueValue: {
    fontFamily: FONTS.mono,
    fontSize: 13,
    color: COLORS.cream,
    opacity: 0.8,
  },
  revenueDivider: {
    height: StyleSheet.hairlineWidth,
    backgroundColor: COLORS.border,
  },

  // Top destinations
  destinationRow: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingVertical: SPACING.sm,
  },
  destinationRank: {
    width: 28,
    height: 28,
    borderRadius: 14,
    backgroundColor: COLORS.bgCard,
    alignItems: 'center',
    justifyContent: 'center',
    marginRight: SPACING.sm,
  },
  rankNumber: {
    fontFamily: FONTS.mono,
    fontSize: 11,
    color: COLORS.accentGold,
  },
  destinationInfo: {
    flex: 1,
  },
  destinationHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
  },
  destinationName: {
    fontFamily: FONTS.body,
    fontSize: 14,
    color: COLORS.cream,
  },
  destinationCount: {
    fontFamily: FONTS.mono,
    fontSize: 11,
    color: COLORS.cream,
    opacity: 0.4,
  },

  // API cost estimator
  apiCostRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingVertical: SPACING.sm,
  },
  apiCostInfo: {
    flex: 1,
  },
  apiCostName: {
    fontFamily: FONTS.body,
    fontSize: 14,
    color: COLORS.cream,
    opacity: 0.8,
  },
  apiCostDetail: {
    fontFamily: FONTS.mono,
    fontSize: 10,
    color: COLORS.cream,
    opacity: 0.35,
    marginTop: 2,
  },
  apiCostValue: {
    fontFamily: FONTS.mono,
    fontSize: 14,
    color: COLORS.cream,
    opacity: 0.7,
  },
  apiCostDivider: {
    height: StyleSheet.hairlineWidth,
    backgroundColor: COLORS.border,
  },
  apiCostTotalDivider: {
    height: 1,
    backgroundColor: COLORS.sage,
    opacity: 0.3,
    marginTop: SPACING.xs,
  },
  apiCostTotalLabel: {
    fontFamily: FONTS.bodySemiBold,
    fontSize: 14,
    color: COLORS.cream,
  },
  apiCostTotalValue: {
    fontFamily: FONTS.mono,
    fontSize: 16,
    color: COLORS.accentGold,
  },

  // Empty state
  emptyText: {
    fontFamily: FONTS.body,
    fontSize: 13,
    color: COLORS.cream,
    opacity: 0.3,
    textAlign: 'center',
    paddingVertical: SPACING.lg,
  },

  // Skeleton loader
  skeletonBar: {
    backgroundColor: COLORS.bgElevated,
    borderRadius: 4,
  },
});
