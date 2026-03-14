// =============================================================================
// ROAM — Investor Dashboard
// Presentation-grade metrics, traction, and business model overview
// Designed for demo meetings and fundraising conversations
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
  Pressable,
} from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { useRouter } from 'expo-router';
import { COLORS, FONTS, SPACING, RADIUS } from '../lib/constants';
import { supabase } from '../lib/supabase';
import { useAppStore } from '../lib/store';
import { impactAsync, ImpactFeedbackStyle } from '../lib/haptics';

const INVESTOR_EMAILS = (process.env.EXPO_PUBLIC_INVESTOR_EMAILS ?? '')
  .split(',')
  .map((e) => e.trim().toLowerCase())
  .filter(Boolean);

// =============================================================================
// Types
// =============================================================================

interface LiveMetrics {
  totalUsers: number;
  proSubscribers: number;
  waitlistSignups: number;
  tripsGenerated: number;
  affiliateClicks: number;
  groupsCreated: number;
}

interface UnitEconomics {
  mrr: number;
  conversionRate: number;
  ltvProjection: number;
  estimatedCac: number;
  ltvCacRatio: number;
  churnRiskCount: number;
  arpu: number;
}

interface CostStructure {
  claudeCost: number;
  googlePlacesCost: number;
  totalApiCost: number;
  revenueMinusCost: number;
  grossMargin: number;
}

// =============================================================================
// Constants
// =============================================================================

const PRO_PRICE_MONTHLY = 6.99;
const CLAUDE_COST_PER_TRIP = 0.003;
const GOOGLE_PLACES_COST_PER_CALL = 0.017;
const AVG_LIFETIME_MONTHS = 12;
const ESTIMATED_CAC = 5;
const { width: SCREEN_WIDTH } = Dimensions.get('window');

const MARKET_DATA = {
  tam: '$11.1T',
  tamLabel: 'Global travel market',
  sam: '$2.8B',
  samLabel: 'Travel planning tools (14% YoY)',
  som: '50K-100K',
  somLabel: 'Year 1 target downloads',
  targetPaidUsers: '5K-10K',
  targetPaidLabel: 'Year 1 paid subscribers',
};

const REVENUE_STREAMS = [
  {
    name: 'Subscriptions',
    detail: '$6.99/mo or $49.99/yr',
    status: 'live',
    color: COLORS.sage,
  },
  {
    name: 'Affiliate Revenue',
    detail: 'Booking.com, GetYourGuide, Skyscanner',
    status: 'live',
    color: COLORS.accentGold,
  },
  {
    name: 'B2B White-Label',
    detail: 'Itinerary engine for agencies/airlines',
    status: 'future',
    color: COLORS.creamMuted,
  },
];

const COMPETITIVE_ADVANTAGES = [
  {
    title: 'Opinionated AI voice',
    body: 'Specific recs, not brochure copy. Names, prices, insider tips.',
  },
  {
    title: 'Viral by design',
    body: 'Shareable trip cards, quizzes, Spin the Globe built for TikTok.',
  },
  {
    title: 'Data flywheel',
    body: 'Every trip trains better recs. Behavior data enables personalization.',
  },
  {
    title: 'Low CAC channel',
    body: 'Travel content is inherently shareable. Features are content.',
  },
];

const TRACTION_HIGHLIGHTS = [
  { metric: 'Full-featured iOS app', detail: 'Ready for App Store' },
  { metric: '30+ curated destinations', detail: 'At launch' },
  { metric: 'AI itinerary generation', detail: 'Live and tested' },
  { metric: 'Group trips, referrals, gamification', detail: 'Built' },
  { metric: 'Viral mechanics', detail: 'Spin the Globe, Alter-Ego, Share Cards' },
  { metric: 'RevenueCat + Supabase', detail: 'Full monetization infra' },
];

const GROWTH_PROJECTIONS = [
  {
    period: 'Month 1',
    downloads: '1,000',
    trips: '500',
    revenue: '$200-500',
  },
  {
    period: 'Month 6',
    downloads: '10,000',
    trips: '5,000',
    revenue: '$3K-7K',
  },
  {
    period: 'Year 1',
    downloads: '100,000',
    trips: '50,000',
    revenue: '$60K-150K',
  },
];

// =============================================================================
// Helpers
// =============================================================================

function fmt(n: number): string {
  if (n >= 1_000_000) return (n / 1_000_000).toFixed(1).replace(/\.0$/, '') + 'M';
  if (n >= 1_000) return (n / 1_000).toFixed(1).replace(/\.0$/, '') + 'K';
  return n.toLocaleString('en-US');
}

function fmtCurrency(n: number): string {
  return '$' + n.toFixed(2).replace(/\B(?=(\d{3})+(?!\d))/g, ',');
}

function fmtPct(n: number): string {
  return n.toFixed(1) + '%';
}

// =============================================================================
// Skeleton Loader
// =============================================================================

function SkeletonBar({ width, height = 14 }: { width: number | string; height?: number }) {
  const pulseAnim = useRef(new Animated.Value(0.3)).current;

  useEffect(() => {
    const animation = Animated.loop(
      Animated.sequence([
        Animated.timing(pulseAnim, { toValue: 0.7, duration: 800, useNativeDriver: true }),
        Animated.timing(pulseAnim, { toValue: 0.3, duration: 800, useNativeDriver: true }),
      ]),
    );
    animation.start();
    return () => animation.stop();
  }, [pulseAnim]);

  return (
    <Animated.View
      style={[styles.skeletonBar, { width: width as number, height, opacity: pulseAnim }]}
    />
  );
}

// =============================================================================
// Section Components
// =============================================================================

function SectionHeader({ title, accent }: { title: string; accent?: string }) {
  return (
    <View style={styles.sectionHeaderRow}>
      <Text style={styles.sectionTitle}>{title}</Text>
      {accent ? <Text style={styles.sectionAccent}>{accent}</Text> : null}
    </View>
  );
}

function MetricCard({
  value,
  label,
  color = COLORS.cream,
}: {
  value: string;
  label: string;
  color?: string;
}) {
  return (
    <View style={styles.metricCard}>
      <Text style={[styles.metricValue, { color }]}>{value}</Text>
      <Text style={styles.metricLabel}>{label}</Text>
    </View>
  );
}

function StatusDot({ status }: { status: string }) {
  const color = status === 'live' ? COLORS.sage : COLORS.creamMuted;
  return <View style={[styles.statusDot, { backgroundColor: color }]} />;
}

function ProgressBar({
  value,
  maxValue,
  color = COLORS.sage,
}: {
  value: number;
  maxValue: number;
  color?: string;
}) {
  const pct = maxValue > 0 ? Math.min((value / maxValue) * 100, 100) : 0;
  return (
    <View style={styles.progressBg}>
      <View style={[styles.progressFill, { width: `${pct}%`, backgroundColor: color }]} />
    </View>
  );
}

// =============================================================================
// Data Fetching
// =============================================================================

async function safeCount(
  table: string,
  filter?: { column: string; value: unknown },
): Promise<number> {
  try {
    let query = supabase.from(table).select('*', { count: 'exact', head: true });
    if (filter) query = query.eq(filter.column, filter.value);
    const { count, error } = await query;
    if (error) return 0;
    return count ?? 0;
  } catch {
    return 0;
  }
}

async function fetchLiveMetrics(): Promise<LiveMetrics> {
  const [totalUsers, waitlistSignups, affiliateClicks, groupsCreated] = await Promise.all([
    safeCount('profiles'),
    safeCount('waitlist_emails'),
    safeCount('affiliate_clicks'),
    safeCount('trip_groups'),
  ]);

  let tripsGenerated = 0;
  try {
    const { data } = await supabase.from('profiles').select('trips_generated_this_month');
    if (data) {
      tripsGenerated = data.reduce(
        (acc: number, row: { trips_generated_this_month?: number }) =>
          acc + (row.trips_generated_this_month ?? 0),
        0,
      );
    }
  } catch {
    // no-op
  }

  let proSubscribers = 0;
  try {
    const { count } = await supabase
      .from('profiles')
      .select('*', { count: 'exact', head: true })
      .or('subscription_tier.eq.pro,pro_referral_expires_at.gt.' + new Date().toISOString());
    proSubscribers = count ?? 0;
  } catch {
    // no-op
  }

  return { totalUsers, proSubscribers, waitlistSignups, tripsGenerated, affiliateClicks, groupsCreated };
}

function computeUnitEconomics(metrics: LiveMetrics): UnitEconomics {
  const mrr = metrics.proSubscribers * PRO_PRICE_MONTHLY;
  const conversionRate = metrics.totalUsers > 0
    ? (metrics.proSubscribers / metrics.totalUsers) * 100
    : 0;
  const convFraction = metrics.totalUsers > 0
    ? metrics.proSubscribers / metrics.totalUsers
    : 0;
  const ltvProjection = convFraction * PRO_PRICE_MONTHLY * AVG_LIFETIME_MONTHS;
  const ltvCacRatio = ESTIMATED_CAC > 0 ? ltvProjection / ESTIMATED_CAC : 0;
  const arpu = metrics.totalUsers > 0 ? mrr / metrics.totalUsers : 0;

  const churnRiskCount = 0;
  // computed async below; placeholder
  return {
    mrr,
    conversionRate,
    ltvProjection,
    estimatedCac: ESTIMATED_CAC,
    ltvCacRatio,
    churnRiskCount,
    arpu,
  };
}

function computeCosts(tripsGenerated: number, mrr: number): CostStructure {
  const claudeCost = tripsGenerated * CLAUDE_COST_PER_TRIP;
  const enrichCalls = tripsGenerated * 2;
  const googlePlacesCost = enrichCalls * GOOGLE_PLACES_COST_PER_CALL;
  const totalApiCost = claudeCost + googlePlacesCost;
  const revenueMinusCost = mrr - totalApiCost;
  const grossMargin = mrr > 0 ? ((mrr - totalApiCost) / mrr) * 100 : 0;
  return { claudeCost, googlePlacesCost, totalApiCost, revenueMinusCost, grossMargin };
}

// =============================================================================
// Main Component
// =============================================================================

export default function InvestorDashboard() {
  const insets = useSafeAreaInsets();
  const router = useRouter();
  const session = useAppStore((s) => s.session);

  const [metrics, setMetrics] = useState<LiveMetrics | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [isRefreshing, setIsRefreshing] = useState(false);
  const [expandedSection, setExpandedSection] = useState<string | null>(null);

  useEffect(() => {
    if (!session?.user?.email) return;
    const email = session.user.email.toLowerCase();
    if (INVESTOR_EMAILS.length > 0 && !INVESTOR_EMAILS.includes(email)) {
      router.replace('/(tabs)');
    }
  }, [session, router]);

  const loadData = useCallback(async (manual = false) => {
    if (manual) setIsRefreshing(true);
    try {
      const fresh = await fetchLiveMetrics();
      setMetrics(fresh);
    } catch {
      // keep last data
    } finally {
      setIsLoading(false);
      setIsRefreshing(false);
    }
  }, []);

  useEffect(() => {
    loadData();
  }, [loadData]);

  const m = metrics ?? {
    totalUsers: 0,
    proSubscribers: 0,
    waitlistSignups: 0,
    tripsGenerated: 0,
    affiliateClicks: 0,
    groupsCreated: 0,
  };

  const unitEcon = computeUnitEconomics(m);
  const costs = computeCosts(m.tripsGenerated, unitEcon.mrr);

  const toggleSection = useCallback((id: string) => {
    impactAsync(ImpactFeedbackStyle.Light);
    setExpandedSection((prev) => (prev === id ? null : id));
  }, []);

  // =========================================================================
  // Render
  // =========================================================================

  return (
    <View style={[styles.container, { paddingTop: insets.top }]}>
      <ScrollView
        style={styles.scrollView}
        contentContainerStyle={[styles.scrollContent, { paddingBottom: insets.bottom + SPACING.xxl }]}
        showsVerticalScrollIndicator={false}
        refreshControl={
          <RefreshControl
            refreshing={isRefreshing}
            onRefresh={() => loadData(true)}
            tintColor={COLORS.accentGold}
          />
        }
      >
        {/* ================================================================ */}
        {/* HERO HEADER                                                      */}
        {/* ================================================================ */}
        <View style={styles.heroSection}>
          <Text style={styles.heroWordmark}>ROAM</Text>
          <Text style={styles.heroTagline}>
            The AI travel planner that sounds like your most well-traveled friend
          </Text>
          <View style={styles.heroPills}>
            <View style={[styles.pill, { backgroundColor: COLORS.sageSubtle }]}>
              <Text style={[styles.pillText, { color: COLORS.sage }]}>Pre-Seed</Text>
            </View>
            <View style={[styles.pill, { backgroundColor: COLORS.goldSoft }]}>
              <Text style={[styles.pillText, { color: COLORS.accentGold }]}>iOS + Web</Text>
            </View>
            <View style={[styles.pill, { backgroundColor: COLORS.coralSubtle }]}>
              <Text style={[styles.pillText, { color: COLORS.coral }]}>AI-Native</Text>
            </View>
          </View>
        </View>

        {/* ================================================================ */}
        {/* LIVE METRICS (2x3 Grid)                                          */}
        {/* ================================================================ */}
        <SectionHeader title="Live Metrics" accent="Real-time from Supabase" />

        {isLoading ? (
          <View style={styles.metricsGrid}>
            {Array.from({ length: 6 }).map((_, i) => (
              <View key={`skel-${i}`} style={styles.metricCard}>
                <SkeletonBar width={50} height={28} />
                <View style={{ height: SPACING.xs }} />
                <SkeletonBar width={70} height={10} />
              </View>
            ))}
          </View>
        ) : (
          <View style={styles.metricsGrid}>
            <MetricCard value={fmt(m.totalUsers)} label="Total Users" />
            <MetricCard value={fmt(m.proSubscribers)} label="Pro Subscribers" color={COLORS.sage} />
            <MetricCard value={fmt(m.waitlistSignups)} label="Waitlist Signups" />
            <MetricCard value={fmt(m.tripsGenerated)} label="Trips Generated" />
            <MetricCard value={fmt(m.affiliateClicks)} label="Affiliate Clicks" color={COLORS.accentGold} />
            <MetricCard value={fmt(m.groupsCreated)} label="Group Trips" />
          </View>
        )}

        {/* ================================================================ */}
        {/* UNIT ECONOMICS                                                   */}
        {/* ================================================================ */}
        <SectionHeader title="Unit Economics" />

        <View style={styles.card}>
          <View style={styles.econRow}>
            <Text style={styles.econLabel}>MRR</Text>
            <Text style={[styles.econValue, { color: COLORS.sage }]}>
              {fmtCurrency(unitEcon.mrr)}
            </Text>
          </View>
          <View style={styles.divider} />
          <View style={styles.econRow}>
            <Text style={styles.econLabel}>ARPU</Text>
            <Text style={styles.econValue}>{fmtCurrency(unitEcon.arpu)}</Text>
          </View>
          <View style={styles.divider} />
          <View style={styles.econRow}>
            <Text style={styles.econLabel}>Conversion (Free to Pro)</Text>
            <Text style={styles.econValue}>{fmtPct(unitEcon.conversionRate)}</Text>
          </View>
          <View style={styles.divider} />
          <View style={styles.econRow}>
            <Text style={styles.econLabel}>LTV Projection</Text>
            <Text style={styles.econValue}>{fmtCurrency(unitEcon.ltvProjection)}</Text>
          </View>
          <View style={styles.divider} />
          <View style={styles.econRow}>
            <Text style={styles.econLabel}>Target CAC</Text>
            <Text style={styles.econValue}>{fmtCurrency(unitEcon.estimatedCac)}</Text>
          </View>
          <View style={styles.divider} />
          <View style={styles.econRow}>
            <Text style={styles.econLabel}>LTV / CAC</Text>
            <Text style={[styles.econValue, { color: COLORS.accentGold }]}>
              {unitEcon.ltvCacRatio.toFixed(1)}x
            </Text>
          </View>

          <View style={styles.targetBar}>
            <Text style={styles.targetLabel}>Target conversion: 8-12%</Text>
            <ProgressBar value={unitEcon.conversionRate} maxValue={12} color={COLORS.sage} />
          </View>
        </View>

        {/* ================================================================ */}
        {/* COST STRUCTURE                                                   */}
        {/* ================================================================ */}
        <SectionHeader title="Cost Structure" accent="Per-trip API costs" />

        <View style={styles.card}>
          <View style={styles.econRow}>
            <View>
              <Text style={styles.econLabel}>Claude API</Text>
              <Text style={styles.econDetail}>
                {fmt(m.tripsGenerated)} trips x {fmtCurrency(CLAUDE_COST_PER_TRIP)}
              </Text>
            </View>
            <Text style={styles.econValue}>{fmtCurrency(costs.claudeCost)}</Text>
          </View>
          <View style={styles.divider} />
          <View style={styles.econRow}>
            <View>
              <Text style={styles.econLabel}>Google Places</Text>
              <Text style={styles.econDetail}>
                ~{fmt(m.tripsGenerated * 2)} calls x {fmtCurrency(GOOGLE_PLACES_COST_PER_CALL)}
              </Text>
            </View>
            <Text style={styles.econValue}>{fmtCurrency(costs.googlePlacesCost)}</Text>
          </View>
          <View style={styles.divider} />
          <View style={styles.econRow}>
            <View>
              <Text style={styles.econLabel}>Free APIs</Text>
              <Text style={styles.econDetail}>Weather, Safety, Visa, Holidays, Timezone</Text>
            </View>
            <Text style={[styles.econValue, { color: COLORS.sage }]}>{fmtCurrency(0)}</Text>
          </View>
          <View style={styles.costTotalDivider} />
          <View style={styles.econRow}>
            <Text style={styles.costTotalLabel}>Monthly API spend</Text>
            <Text style={styles.costTotalValue}>{fmtCurrency(costs.totalApiCost)}</Text>
          </View>
          <View style={styles.econRow}>
            <Text style={styles.costTotalLabel}>Gross margin</Text>
            <Text
              style={[
                styles.costTotalValue,
                { color: costs.grossMargin >= 70 ? COLORS.sage : COLORS.coral },
              ]}
            >
              {costs.grossMargin > 0 ? fmtPct(costs.grossMargin) : '--'}
            </Text>
          </View>
        </View>

        {/* ================================================================ */}
        {/* REVENUE MODEL                                                    */}
        {/* ================================================================ */}
        <SectionHeader title="Revenue Model" />

        <View style={styles.card}>
          {REVENUE_STREAMS.map((stream, i) => (
            <View key={stream.name}>
              <View style={styles.revenueStreamRow}>
                <View style={styles.revenueStreamInfo}>
                  <View style={styles.revenueStreamHeader}>
                    <StatusDot status={stream.status} />
                    <Text style={styles.revenueStreamName}>{stream.name}</Text>
                  </View>
                  <Text style={styles.revenueStreamDetail}>{stream.detail}</Text>
                </View>
                <View style={[styles.statusPill, { borderColor: stream.color }]}>
                  <Text style={[styles.statusPillText, { color: stream.color }]}>
                    {stream.status === 'live' ? 'LIVE' : 'PLANNED'}
                  </Text>
                </View>
              </View>
              {i < REVENUE_STREAMS.length - 1 && <View style={styles.divider} />}
            </View>
          ))}
        </View>

        {/* ================================================================ */}
        {/* MARKET OPPORTUNITY                                               */}
        {/* ================================================================ */}
        <SectionHeader title="Market Opportunity" />

        <View style={styles.metricsGrid}>
          <MetricCard value={MARKET_DATA.tam} label={MARKET_DATA.tamLabel} color={COLORS.accentGold} />
          <MetricCard value={MARKET_DATA.sam} label={MARKET_DATA.samLabel} color={COLORS.sage} />
          <MetricCard value={MARKET_DATA.som} label={MARKET_DATA.somLabel} />
          <MetricCard value={MARKET_DATA.targetPaidUsers} label={MARKET_DATA.targetPaidLabel} />
        </View>

        {/* ================================================================ */}
        {/* GROWTH PROJECTIONS                                               */}
        {/* ================================================================ */}
        <SectionHeader title="Growth Projections" />

        <View style={styles.card}>
          <View style={styles.projectionHeader}>
            <Text style={[styles.projColHead, { flex: 1 }]}>Period</Text>
            <Text style={[styles.projColHead, { flex: 1 }]}>Downloads</Text>
            <Text style={[styles.projColHead, { flex: 1 }]}>Trips</Text>
            <Text style={[styles.projColHead, { flex: 1 }]}>Revenue</Text>
          </View>
          {GROWTH_PROJECTIONS.map((row, i) => (
            <View key={row.period}>
              <View style={styles.projectionRow}>
                <Text style={[styles.projCell, { flex: 1 }]}>{row.period}</Text>
                <Text style={[styles.projCellMono, { flex: 1 }]}>{row.downloads}</Text>
                <Text style={[styles.projCellMono, { flex: 1 }]}>{row.trips}</Text>
                <Text style={[styles.projCellMono, { flex: 1, color: COLORS.sage }]}>
                  {row.revenue}
                </Text>
              </View>
              {i < GROWTH_PROJECTIONS.length - 1 && <View style={styles.divider} />}
            </View>
          ))}
        </View>

        {/* ================================================================ */}
        {/* COMPETITIVE ADVANTAGES                                           */}
        {/* ================================================================ */}
        <SectionHeader title="Competitive Moat" />

        {COMPETITIVE_ADVANTAGES.map((adv, i) => (
          <Pressable
            key={adv.title}
            style={[styles.advantageCard, i === 0 && { marginTop: 0 }]}
            onPress={() => toggleSection(adv.title)}
          >
            <View style={styles.advantageHeader}>
              <View style={styles.advantageNumberCircle}>
                <Text style={styles.advantageNumber}>{i + 1}</Text>
              </View>
              <Text style={styles.advantageTitle}>{adv.title}</Text>
            </View>
            {expandedSection === adv.title && (
              <Text style={styles.advantageBody}>{adv.body}</Text>
            )}
          </Pressable>
        ))}

        {/* ================================================================ */}
        {/* TRACTION                                                         */}
        {/* ================================================================ */}
        <SectionHeader title="Traction" accent="Pre-launch" />

        <View style={styles.card}>
          {TRACTION_HIGHLIGHTS.map((item, i) => (
            <View key={item.metric}>
              <View style={styles.tractionRow}>
                <View style={[styles.tractionDot, { backgroundColor: COLORS.sage }]} />
                <View style={styles.tractionInfo}>
                  <Text style={styles.tractionMetric}>{item.metric}</Text>
                  <Text style={styles.tractionDetail}>{item.detail}</Text>
                </View>
              </View>
              {i < TRACTION_HIGHLIGHTS.length - 1 && <View style={styles.divider} />}
            </View>
          ))}
        </View>

        {/* ================================================================ */}
        {/* TECH STACK                                                       */}
        {/* ================================================================ */}
        <SectionHeader title="Tech Stack" />

        <View style={styles.techGrid}>
          {[
            { name: 'React Native + Expo', role: 'Cross-platform (iOS, Web)' },
            { name: 'Supabase', role: 'Auth, DB, Edge Functions' },
            { name: 'Claude AI', role: 'Itinerary generation' },
            { name: 'RevenueCat', role: 'Subscription management' },
            { name: 'Zustand', role: 'State management' },
            { name: 'TypeScript', role: 'Full type safety' },
          ].map((tech) => (
            <View key={tech.name} style={styles.techChip}>
              <Text style={styles.techName}>{tech.name}</Text>
              <Text style={styles.techRole}>{tech.role}</Text>
            </View>
          ))}
        </View>

        {/* ================================================================ */}
        {/* THE ASK                                                          */}
        {/* ================================================================ */}
        <View style={styles.askSection}>
          <Text style={styles.askTitle}>The Ask</Text>
          <Text style={styles.askSubtitle}>Pre-Seed Round</Text>
          <View style={styles.askItems}>
            {[
              'App Store launch + initial marketing push',
              'First 10K users acquisition',
              'Android development',
              'Hire first engineer',
            ].map((item) => (
              <View key={item} style={styles.askItemRow}>
                <View style={[styles.tractionDot, { backgroundColor: COLORS.accentGold }]} />
                <Text style={styles.askItemText}>{item}</Text>
              </View>
            ))}
          </View>
        </View>

        {/* ================================================================ */}
        {/* FOOTER                                                           */}
        {/* ================================================================ */}
        <View style={styles.footer}>
          <Text style={styles.footerName}>Quinn Byars</Text>
          <Text style={styles.footerContact}>hello@roamtravel.app</Text>
          <Text style={styles.footerUrl}>roamtravel.app</Text>
        </View>

        <View style={{ height: SPACING.xxl }} />
      </ScrollView>
    </View>
  );
}

// =============================================================================
// Styles
// =============================================================================

const CARD_MIN_WIDTH = (SCREEN_WIDTH - SPACING.md * 2 - SPACING.sm) / 2 - 1;

const styles = StyleSheet.create({
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

  // Hero
  heroSection: {
    paddingTop: SPACING.xl,
    paddingBottom: SPACING.lg,
    borderBottomWidth: StyleSheet.hairlineWidth,
    borderBottomColor: COLORS.border,
    marginBottom: SPACING.lg,
    alignItems: 'center',
  },
  heroWordmark: {
    fontFamily: FONTS.header,
    fontSize: 42,
    color: COLORS.accentGold,
    letterSpacing: 8,
  },
  heroTagline: {
    fontFamily: FONTS.body,
    fontSize: 15,
    color: COLORS.creamMuted,
    textAlign: 'center',
    marginTop: SPACING.sm,
    maxWidth: 300,
    lineHeight: 22,
  },
  heroPills: {
    flexDirection: 'row',
    gap: SPACING.sm,
    marginTop: SPACING.md,
  },
  pill: {
    paddingHorizontal: SPACING.sm + 4,
    paddingVertical: SPACING.xs,
    borderRadius: RADIUS.full,
  },
  pillText: {
    fontFamily: FONTS.mono,
    fontSize: 10,
    letterSpacing: 1,
    textTransform: 'uppercase',
  },

  // Section headers
  sectionHeaderRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'baseline',
    marginTop: SPACING.xl,
    marginBottom: SPACING.sm,
  },
  sectionTitle: {
    fontFamily: FONTS.header,
    fontSize: 22,
    color: COLORS.cream,
  },
  sectionAccent: {
    fontFamily: FONTS.mono,
    fontSize: 10,
    color: COLORS.creamMuted,
    letterSpacing: 1,
    textTransform: 'uppercase',
  },

  // Metric cards grid
  metricsGrid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: SPACING.sm,
  },
  metricCard: {
    flex: 1,
    minWidth: CARD_MIN_WIDTH,
    backgroundColor: COLORS.bgCard,
    borderRadius: RADIUS.md,
    borderWidth: StyleSheet.hairlineWidth,
    borderColor: COLORS.border,
    padding: SPACING.md,
  },
  metricValue: {
    fontFamily: FONTS.header,
    fontSize: 28,
    color: COLORS.cream,
    lineHeight: 32,
  },
  metricLabel: {
    fontFamily: FONTS.mono,
    fontSize: 10,
    color: COLORS.creamMuted,
    letterSpacing: 1,
    textTransform: 'uppercase',
    marginTop: SPACING.xs,
  },

  // Card (generic)
  card: {
    backgroundColor: COLORS.bgCard,
    borderRadius: RADIUS.md,
    borderWidth: StyleSheet.hairlineWidth,
    borderColor: COLORS.border,
    padding: SPACING.md,
  },

  // Economics rows
  econRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingVertical: SPACING.sm,
  },
  econLabel: {
    fontFamily: FONTS.body,
    fontSize: 13,
    color: COLORS.cream,
    opacity: 0.7,
  },
  econValue: {
    fontFamily: FONTS.mono,
    fontSize: 14,
    color: COLORS.cream,
  },
  econDetail: {
    fontFamily: FONTS.mono,
    fontSize: 10,
    color: COLORS.creamMuted,
    marginTop: 2,
  },
  divider: {
    height: StyleSheet.hairlineWidth,
    backgroundColor: COLORS.border,
  },

  // Target bar
  targetBar: {
    marginTop: SPACING.md,
    paddingTop: SPACING.sm,
    borderTopWidth: StyleSheet.hairlineWidth,
    borderTopColor: COLORS.border,
  },
  targetLabel: {
    fontFamily: FONTS.mono,
    fontSize: 10,
    color: COLORS.creamMuted,
    letterSpacing: 1,
    marginBottom: SPACING.xs,
  },

  // Progress bar
  progressBg: {
    height: 6,
    backgroundColor: COLORS.border,
    borderRadius: 3,
    overflow: 'hidden',
  },
  progressFill: {
    height: '100%',
    borderRadius: 3,
    minWidth: 2,
  },

  // Cost totals
  costTotalDivider: {
    height: 1,
    backgroundColor: COLORS.sage,
    opacity: 0.3,
    marginTop: SPACING.xs,
  },
  costTotalLabel: {
    fontFamily: FONTS.bodySemiBold,
    fontSize: 13,
    color: COLORS.cream,
  },
  costTotalValue: {
    fontFamily: FONTS.mono,
    fontSize: 14,
    color: COLORS.accentGold,
  },

  // Revenue streams
  revenueStreamRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingVertical: SPACING.sm,
  },
  revenueStreamInfo: {
    flex: 1,
    marginRight: SPACING.sm,
  },
  revenueStreamHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: SPACING.sm,
  },
  revenueStreamName: {
    fontFamily: FONTS.body,
    fontSize: 14,
    color: COLORS.cream,
  },
  revenueStreamDetail: {
    fontFamily: FONTS.mono,
    fontSize: 11,
    color: COLORS.creamMuted,
    marginTop: 2,
    marginLeft: 16,
  },
  statusDot: {
    width: 8,
    height: 8,
    borderRadius: 4,
  },
  statusPill: {
    paddingHorizontal: SPACING.sm,
    paddingVertical: 3,
    borderRadius: RADIUS.full,
    borderWidth: 1,
  },
  statusPillText: {
    fontFamily: FONTS.mono,
    fontSize: 9,
    letterSpacing: 1.5,
  },

  // Growth projections table
  projectionHeader: {
    flexDirection: 'row',
    paddingBottom: SPACING.sm,
    borderBottomWidth: StyleSheet.hairlineWidth,
    borderBottomColor: COLORS.border,
  },
  projColHead: {
    fontFamily: FONTS.mono,
    fontSize: 10,
    color: COLORS.creamMuted,
    letterSpacing: 1,
    textTransform: 'uppercase',
  },
  projectionRow: {
    flexDirection: 'row',
    paddingVertical: SPACING.sm,
  },
  projCell: {
    fontFamily: FONTS.body,
    fontSize: 13,
    color: COLORS.cream,
  },
  projCellMono: {
    fontFamily: FONTS.mono,
    fontSize: 12,
    color: COLORS.cream,
    opacity: 0.8,
  },

  // Competitive advantages
  advantageCard: {
    backgroundColor: COLORS.bgCard,
    borderRadius: RADIUS.md,
    borderWidth: StyleSheet.hairlineWidth,
    borderColor: COLORS.border,
    padding: SPACING.md,
    marginTop: SPACING.sm,
  },
  advantageHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: SPACING.sm,
  },
  advantageNumberCircle: {
    width: 24,
    height: 24,
    borderRadius: 12,
    backgroundColor: COLORS.goldSoft,
    alignItems: 'center',
    justifyContent: 'center',
  },
  advantageNumber: {
    fontFamily: FONTS.mono,
    fontSize: 11,
    color: COLORS.accentGold,
  },
  advantageTitle: {
    fontFamily: FONTS.bodySemiBold,
    fontSize: 14,
    color: COLORS.cream,
  },
  advantageBody: {
    fontFamily: FONTS.body,
    fontSize: 13,
    color: COLORS.creamMuted,
    lineHeight: 20,
    marginTop: SPACING.sm,
    marginLeft: 32,
  },

  // Traction
  tractionRow: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingVertical: SPACING.sm,
    gap: SPACING.sm,
  },
  tractionDot: {
    width: 6,
    height: 6,
    borderRadius: 3,
  },
  tractionInfo: {
    flex: 1,
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
  },
  tractionMetric: {
    fontFamily: FONTS.body,
    fontSize: 13,
    color: COLORS.cream,
    flex: 1,
  },
  tractionDetail: {
    fontFamily: FONTS.mono,
    fontSize: 11,
    color: COLORS.creamMuted,
    textAlign: 'right',
  },

  // Tech stack
  techGrid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: SPACING.sm,
  },
  techChip: {
    backgroundColor: COLORS.bgCard,
    borderRadius: RADIUS.md,
    borderWidth: StyleSheet.hairlineWidth,
    borderColor: COLORS.border,
    paddingHorizontal: SPACING.md,
    paddingVertical: SPACING.sm,
    minWidth: CARD_MIN_WIDTH,
    flex: 1,
  },
  techName: {
    fontFamily: FONTS.bodySemiBold,
    fontSize: 12,
    color: COLORS.cream,
  },
  techRole: {
    fontFamily: FONTS.mono,
    fontSize: 10,
    color: COLORS.creamMuted,
    marginTop: 2,
  },

  // The Ask
  askSection: {
    marginTop: SPACING.xl,
    backgroundColor: COLORS.goldFaint,
    borderRadius: RADIUS.md,
    borderWidth: 1,
    borderColor: COLORS.goldBorder,
    padding: SPACING.lg,
  },
  askTitle: {
    fontFamily: FONTS.header,
    fontSize: 28,
    color: COLORS.accentGold,
  },
  askSubtitle: {
    fontFamily: FONTS.mono,
    fontSize: 11,
    color: COLORS.accentGold,
    letterSpacing: 2,
    textTransform: 'uppercase',
    marginTop: SPACING.xs,
    opacity: 0.7,
  },
  askItems: {
    marginTop: SPACING.md,
    gap: SPACING.sm,
  },
  askItemRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: SPACING.sm,
  },
  askItemText: {
    fontFamily: FONTS.body,
    fontSize: 14,
    color: COLORS.cream,
    lineHeight: 20,
  },

  // Footer
  footer: {
    marginTop: SPACING.xl,
    alignItems: 'center',
    paddingVertical: SPACING.lg,
    borderTopWidth: StyleSheet.hairlineWidth,
    borderTopColor: COLORS.border,
  },
  footerName: {
    fontFamily: FONTS.header,
    fontSize: 20,
    color: COLORS.cream,
  },
  footerContact: {
    fontFamily: FONTS.mono,
    fontSize: 12,
    color: COLORS.creamMuted,
    marginTop: SPACING.xs,
  },
  footerUrl: {
    fontFamily: FONTS.mono,
    fontSize: 12,
    color: COLORS.sage,
    marginTop: 2,
  },

  // Skeleton
  skeletonBar: {
    backgroundColor: COLORS.bgElevated,
    borderRadius: 4,
  },
});
