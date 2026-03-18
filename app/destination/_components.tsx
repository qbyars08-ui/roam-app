// =============================================================================
// ROAM — Destination Page Section Components
// Extracted to keep [name].tsx under 800 lines
// =============================================================================
import React from 'react';
import { Pressable, StyleSheet, Text, View } from 'react-native';
import {
  Clock,
  Cloud,
  DollarSign,
  Droplets,
  MapPin,
  Plane,
  Shield,
  Star,
  Utensils,
} from 'lucide-react-native';
import { useTranslation } from 'react-i18next';

import { COLORS, FONTS, RADIUS, SPACING } from '../../lib/constants';
import type { CurrentWeather } from '../../lib/apis/openweather';
import type { RouteResult } from '../../lib/apis/rome2rio';
import type { CostOfLiving } from '../../lib/cost-of-living';
import type { TravelAdvisory } from '../../lib/travel-safety';
import { getVisaStatusDisplay, type VisaResult } from '../../lib/visa-requirements';
import type { TALocation } from '../../lib/apis/tripadvisor';
import type { FSQPlace } from '../../lib/apis/foursquare';

// ---------------------------------------------------------------------------
// Shared styles
// ---------------------------------------------------------------------------
const CARD_BASE = {
  backgroundColor: COLORS.surface1,
  borderWidth: 1,
  borderColor: COLORS.border,
  borderRadius: RADIUS.md,
  padding: SPACING.md,
} as const;

// ---------------------------------------------------------------------------
// Section Header
// ---------------------------------------------------------------------------
export function SectionHeader({
  title,
  badge,
}: {
  title: string;
  badge?: React.ReactNode;
}) {
  return (
    <View style={styles.sectionHeader}>
      <Text style={styles.sectionTitle}>{title}</Text>
      {badge}
    </View>
  );
}

// ---------------------------------------------------------------------------
// Skeleton
// ---------------------------------------------------------------------------
export function Skeleton({ height = 80 }: { height?: number }) {
  return <View style={[styles.skeleton, { height }]} />;
}

// ---------------------------------------------------------------------------
// 2. Right Now — weather + time
// ---------------------------------------------------------------------------
export function RightNowSection({
  localTime,
  weather,
}: {
  localTime: string | null;
  weather: CurrentWeather | null;
}) {
  const { t } = useTranslation();
  if (!localTime && !weather) return null;

  return (
    <View style={styles.section}>
      <SectionHeader
        title={t('destination.rightNow', { defaultValue: 'Right now' })}
      />
      <View style={[CARD_BASE, styles.rightNowCard]}>
        {localTime && (
          <View style={styles.rightNowRow}>
            <Clock size={16} color={COLORS.sage} strokeWidth={1.5} />
            <Text style={styles.rightNowValue}>{localTime}</Text>
          </View>
        )}
        {weather && (
          <>
            <View style={styles.rightNowRow}>
              <Cloud size={16} color={COLORS.sage} strokeWidth={1.5} />
              <Text style={styles.rightNowValue}>
                {weather.temp}° — {weather.condition}
              </Text>
            </View>
            <View style={styles.rightNowRow}>
              <Droplets size={16} color={COLORS.sage} strokeWidth={1.5} />
              <Text style={styles.rightNowValue}>
                {t('destination.humidity', {
                  defaultValue: `${weather.humidity}% humidity`,
                })}
              </Text>
            </View>
          </>
        )}
      </View>
    </View>
  );
}

// ---------------------------------------------------------------------------
// 4. How to get there — Rome2Rio routes
// ---------------------------------------------------------------------------
const MODE_ICONS: Record<string, React.ReactNode> = {
  flight: <Plane size={14} color={COLORS.sage} strokeWidth={1.5} />,
  train: <MapPin size={14} color={COLORS.sage} strokeWidth={1.5} />,
  bus: <MapPin size={14} color={COLORS.sage} strokeWidth={1.5} />,
  car: <MapPin size={14} color={COLORS.sage} strokeWidth={1.5} />,
  ferry: <MapPin size={14} color={COLORS.sage} strokeWidth={1.5} />,
  walk: <MapPin size={14} color={COLORS.sage} strokeWidth={1.5} />,
};

function formatDuration(minutes: number): string {
  const h = Math.floor(minutes / 60);
  const m = minutes % 60;
  if (h === 0) return `${m}m`;
  if (m === 0) return `${h}h`;
  return `${h}h ${m}m`;
}

export function RoutesSection({
  routes,
  loading,
  hasSession,
}: {
  routes: RouteResult[] | null;
  loading: boolean;
  hasSession: boolean | null;
}) {
  const { t } = useTranslation();

  return (
    <View style={styles.section}>
      <SectionHeader
        title={t('destination.howToGetThere', {
          defaultValue: 'How to get there',
        })}
      />
      {hasSession === false ? (
        <Text style={styles.empty}>
          {t('destination.signInForLiveData', { defaultValue: 'Sign in to see live route data.' })}
        </Text>
      ) : loading ? (
        <>
          <Skeleton />
          <Skeleton />
        </>
      ) : routes && routes.length > 0 ? (
        routes.slice(0, 4).map((route, i) => (
          <View key={i} style={[CARD_BASE, { marginBottom: SPACING.sm }]}>
            <View style={styles.routeRow}>
              {MODE_ICONS[route.mode] ?? (
                <MapPin size={14} color={COLORS.sage} strokeWidth={1.5} />
              )}
              <Text style={styles.routeName}>{route.name}</Text>
            </View>
            <View style={styles.routeMeta}>
              <Text style={styles.mono}>
                {formatDuration(route.duration)}
              </Text>
              {route.price && (
                <Text style={styles.mono}>
                  {route.price.currency} {route.price.low}–{route.price.high}
                </Text>
              )}
            </View>
          </View>
        ))
      ) : (
        <Text style={styles.empty}>
          {t('destination.noRoutes', {
            defaultValue: 'No route data available.',
          })}
        </Text>
      )}
    </View>
  );
}

// ---------------------------------------------------------------------------
// 5. What it costs — Cost of living
// ---------------------------------------------------------------------------
export function CostSection({
  data,
  onStartSaving,
}: {
  data: CostOfLiving | null;
  onStartSaving?: () => void;
}) {
  const { t } = useTranslation();
  if (!data) return null;

  const rows = [
    {
      label: t('destination.costMeal', { defaultValue: 'Meal' }),
      value: data.comfort.meal,
    },
    {
      label: t('destination.costTransport', { defaultValue: 'Transport' }),
      value: data.comfort.transport,
    },
    {
      label: t('destination.costAccommodation', {
        defaultValue: 'Accommodation',
      }),
      value: data.comfort.accommodation,
    },
    {
      label: t('destination.costDaily', { defaultValue: 'Daily total' }),
      value: data.comfort.dailyTotal,
    },
  ];

  return (
    <View style={styles.section}>
      <SectionHeader
        title={t('destination.whatItCosts', {
          defaultValue: 'What it costs',
        })}
      />
      <View style={CARD_BASE}>
        {rows.map((row, i) => (
          <View
            key={i}
            style={[
              styles.costRow,
              i < rows.length - 1 && styles.costRowBorder,
            ]}
          >
            <Text style={styles.costLabel}>{row.label}</Text>
            <Text style={styles.costValue}>{row.value}</Text>
          </View>
        ))}
        <Text style={[styles.mono, { marginTop: SPACING.sm }]}>
          {data.tipping}
        </Text>
        {onStartSaving && (
          <Pressable
            onPress={onStartSaving}
            style={({ pressed }) => [styles.startSavingBtn, { opacity: pressed ? 0.8 : 1 }]}
          >
            <DollarSign size={16} color={COLORS.bg} strokeWidth={1.5} />
            <Text style={styles.startSavingText}>
              {t('destination.startSaving', { defaultValue: 'Start saving' })}
            </Text>
          </Pressable>
        )}
      </View>
    </View>
  );
}

// ---------------------------------------------------------------------------
// 6. Safety
// ---------------------------------------------------------------------------
export function SafetySection({
  advisory,
  loading,
}: {
  advisory: TravelAdvisory | null;
  loading: boolean;
}) {
  const { t } = useTranslation();

  return (
    <View style={styles.section}>
      <SectionHeader
        title={t('destination.safety', { defaultValue: 'Safety' })}
      />
      {loading ? (
        <Skeleton />
      ) : advisory ? (
        <View style={CARD_BASE}>
          <View style={styles.safetyRow}>
            <Shield size={18} color={advisory.color} strokeWidth={1.5} />
            <Text style={[styles.safetyLabel, { color: advisory.color }]}>
              {advisory.label}
            </Text>
            <Text style={styles.mono}>
              {advisory.score.toFixed(1)} / 5.0
            </Text>
          </View>
          <Text style={styles.safetyAdvice}>{advisory.advice}</Text>
        </View>
      ) : (
        <Text style={styles.empty}>
          {t('destination.noSafety', {
            defaultValue: 'No safety data available.',
          })}
        </Text>
      )}
    </View>
  );
}

// ---------------------------------------------------------------------------
// 7. Visa
// ---------------------------------------------------------------------------
export function VisaSection({
  visa,
  loading,
}: {
  visa: VisaResult | null;
  loading: boolean;
}) {
  const { t } = useTranslation();
  const best = visa?.best ?? null;
  const display = best ? getVisaStatusDisplay(best.status) : null;

  return (
    <View style={styles.section}>
      <SectionHeader
        title={t('destination.visa', { defaultValue: 'Visa' })}
      />
      {loading ? (
        <Skeleton />
      ) : best && display ? (
        <View style={CARD_BASE}>
          <Text style={[styles.visaType, { color: display.color }]}>
            {display.label}
          </Text>
          {best.maxStay !== null && (
            <Text style={styles.mono}>
              {t('destination.maxStay', {
                defaultValue: `Up to ${best.maxStay}`,
              })}
            </Text>
          )}
          {best.notes && (
            <Text style={[styles.cardDetail, { marginTop: SPACING.xs }]}>
              {best.notes}
            </Text>
          )}
          {visa && visa.all.length > 1 && (
            <Text style={[styles.mono, { marginTop: SPACING.xs }]}>
              {t('destination.visaPassport', {
                defaultValue: `Best passport: ${best.passportCountry}`,
              })}
            </Text>
          )}
        </View>
      ) : (
        <Text style={styles.empty}>
          {t('destination.noVisa', {
            defaultValue: 'No visa data available.',
          })}
        </Text>
      )}
    </View>
  );
}

// ---------------------------------------------------------------------------
// 8. Things to do — TripAdvisor attractions
// ---------------------------------------------------------------------------
export function AttractionsSection({
  attractions,
  loading,
  hasSession,
}: {
  attractions: TALocation[] | null;
  loading: boolean;
  hasSession: boolean | null;
}) {
  const { t } = useTranslation();

  return (
    <View style={styles.section}>
      <SectionHeader
        title={t('destination.thingsToDo', {
          defaultValue: 'Things to do',
        })}
      />
      {hasSession === false ? (
        <Text style={styles.empty}>
          {t('destination.signInForLiveData', { defaultValue: 'Sign in to see top attractions.' })}
        </Text>
      ) : loading ? (
        <>
          <Skeleton />
          <Skeleton />
          <Skeleton />
        </>
      ) : attractions && attractions.length > 0 ? (
        attractions.slice(0, 5).map((a, i) => (
          <View
            key={a.locationId}
            style={[
              CARD_BASE,
              styles.attractionRow,
              { marginBottom: SPACING.sm },
            ]}
          >
            <Text style={styles.rankText}>
              {String(i + 1).padStart(2, '0')}
            </Text>
            <View style={{ flex: 1 }}>
              <Text style={styles.cardHeadline} numberOfLines={1}>
                {a.name}
              </Text>
              <Text style={styles.mono}>{a.category}</Text>
              {a.rating !== null && (
                <View style={[styles.ratingRow, { marginTop: 4 }]}>
                  {[1, 2, 3, 4, 5].map((star) => (
                    <Star
                      key={star}
                      size={10}
                      strokeWidth={1.5}
                      color={
                        star <= Math.round(a.rating ?? 0)
                          ? COLORS.gold
                          : COLORS.muted
                      }
                      fill={
                        star <= Math.round(a.rating ?? 0)
                          ? COLORS.gold
                          : 'transparent'
                      }
                    />
                  ))}
                  <Text style={[styles.mono, { marginLeft: 4 }]}>
                    {a.numReviews.toLocaleString()}
                  </Text>
                </View>
              )}
            </View>
          </View>
        ))
      ) : (
        <Text style={styles.empty}>
          {t('destination.noAttractions', {
            defaultValue: 'No attraction data available.',
          })}
        </Text>
      )}
    </View>
  );
}

// ---------------------------------------------------------------------------
// 9. Where to eat — Foursquare places
// ---------------------------------------------------------------------------
export function RestaurantsSection({
  venues,
  loading,
  hasSession,
}: {
  venues: FSQPlace[] | null;
  loading: boolean;
  hasSession: boolean | null;
}) {
  const { t } = useTranslation();

  return (
    <View style={styles.section}>
      <SectionHeader
        title={t('destination.whereToEat', {
          defaultValue: 'Where to eat',
        })}
      />
      {hasSession === false ? (
        <Text style={styles.empty}>
          {t('destination.signInForLiveData', { defaultValue: 'Sign in to see restaurant recommendations.' })}
        </Text>
      ) : loading ? (
        <>
          <Skeleton />
          <Skeleton />
        </>
      ) : venues && venues.length > 0 ? (
        <View style={styles.venueGrid}>
          {venues.map((v) => (
            <View key={v.fsqId} style={[CARD_BASE, styles.venueCard]}>
              <Utensils
                size={14}
                color={COLORS.sage}
                strokeWidth={1.5}
                style={{ marginBottom: SPACING.xs }}
              />
              <Text style={styles.cardHeadline} numberOfLines={1}>
                {v.name}
              </Text>
              <Text style={styles.mono}>{v.category}</Text>
              {v.rating !== null && (
                <View style={styles.ratingRow}>
                  <Star
                    size={11}
                    color={COLORS.gold}
                    strokeWidth={1.5}
                    fill={COLORS.gold}
                  />
                  <Text style={styles.goldMono}>
                    {v.rating.toFixed(1)}
                  </Text>
                </View>
              )}
            </View>
          ))}
        </View>
      ) : (
        <Text style={styles.empty}>
          {t('destination.noVenues', {
            defaultValue: 'No restaurant data available.',
          })}
        </Text>
      )}
    </View>
  );
}

// ---------------------------------------------------------------------------
// 10. Plan a trip here — CTA buttons
// ---------------------------------------------------------------------------
export function PlanTripSection({
  planningCount,
  destination,
  onQuickTrip,
  onPlanTogether,
}: {
  planningCount: number | null;
  destination: string;
  onQuickTrip: () => void;
  onPlanTogether: () => void;
}) {
  const { t } = useTranslation();

  return (
    <View style={styles.section}>
      <SectionHeader
        title={t('destination.planHere', {
          defaultValue: 'Plan a trip here',
        })}
      />
      {planningCount !== null && planningCount > 0 && (
        <View style={[styles.row, { marginBottom: SPACING.md, gap: 6 }]}>
          <DollarSign size={13} color={COLORS.sage} strokeWidth={1.5} />
          <Text style={[styles.mono, { color: COLORS.sage }]}>
            {t('destination.roamersPlanning', {
              defaultValue: `${planningCount} ROAMers planning ${destination} this month`,
            })}
          </Text>
        </View>
      )}
      <View style={styles.ctaRow}>
        <Pressable
          style={({ pressed }) => [
            styles.ctaSage,
            { transform: [{ scale: pressed ? 0.97 : 1 }] },
          ]}
          onPress={onQuickTrip}
        >
          <Plane size={16} color={COLORS.bg} strokeWidth={1.5} />
          <Text style={styles.ctaSageText}>
            {t('destination.quickTrip', { defaultValue: 'Quick Trip' })}
          </Text>
        </Pressable>
        <Pressable
          style={({ pressed }) => [
            styles.ctaGold,
            { transform: [{ scale: pressed ? 0.97 : 1 }] },
          ]}
          onPress={onPlanTogether}
        >
          <Text style={styles.ctaGoldText}>
            {t('destination.planTogether', {
              defaultValue: 'Plan Together',
            })}
          </Text>
        </Pressable>
      </View>
    </View>
  );
}

// ---------------------------------------------------------------------------
// Styles
// ---------------------------------------------------------------------------
const styles = StyleSheet.create({
  section: {
    paddingHorizontal: SPACING.lg,
    marginTop: SPACING.xl + SPACING.md,
  },
  sectionHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    marginBottom: SPACING.md,
  },
  sectionTitle: {
    fontFamily: FONTS.header,
    fontSize: 20,
    color: COLORS.cream,
    flex: 1,
    marginRight: SPACING.sm,
  },
  empty: {
    fontFamily: FONTS.body,
    fontSize: 13,
    color: COLORS.muted,
    fontStyle: 'italic',
  },
  skeleton: {
    backgroundColor: COLORS.surface2,
    borderRadius: RADIUS.md,
    marginBottom: SPACING.sm,
    opacity: 0.5,
  },
  row: { flexDirection: 'row', alignItems: 'center' },
  mono: {
    fontFamily: FONTS.mono,
    fontSize: 10,
    color: COLORS.muted,
    letterSpacing: 0.3,
  },
  cardHeadline: {
    fontFamily: FONTS.bodyMedium,
    fontSize: 14,
    color: COLORS.cream,
    lineHeight: 20,
  },
  cardDetail: {
    fontFamily: FONTS.body,
    fontSize: 12,
    color: COLORS.muted,
    marginTop: 4,
    lineHeight: 17,
  },
  ratingRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 3,
    marginTop: SPACING.xs,
  },
  goldMono: { fontFamily: FONTS.mono, fontSize: 11, color: COLORS.gold },
  rankText: {
    fontFamily: FONTS.mono,
    fontSize: 22,
    color: COLORS.sageMuted,
    lineHeight: 26,
    minWidth: 28,
  },
  // Right now
  rightNowCard: { gap: SPACING.sm },
  rightNowRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: SPACING.sm,
  },
  rightNowValue: {
    fontFamily: FONTS.bodyMedium,
    fontSize: 14,
    color: COLORS.cream,
  },
  // Routes
  routeRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: SPACING.sm,
  },
  routeName: {
    fontFamily: FONTS.bodyMedium,
    fontSize: 14,
    color: COLORS.cream,
    flex: 1,
  },
  routeMeta: {
    flexDirection: 'row',
    gap: SPACING.md,
    marginTop: SPACING.xs,
    marginLeft: 30,
  },
  // Cost
  costRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingVertical: SPACING.sm,
  },
  costRowBorder: {
    borderBottomWidth: 1,
    borderBottomColor: COLORS.border,
  },
  costLabel: {
    fontFamily: FONTS.body,
    fontSize: 13,
    color: COLORS.creamDim,
  },
  costValue: {
    fontFamily: FONTS.mono,
    fontSize: 13,
    color: COLORS.cream,
  },
  startSavingBtn: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: SPACING.xs,
    backgroundColor: COLORS.sage,
    borderRadius: RADIUS.pill,
    paddingVertical: SPACING.sm,
    marginTop: SPACING.md,
  },
  startSavingText: {
    fontFamily: FONTS.bodyMedium,
    fontSize: 14,
    color: COLORS.bg,
  },
  // Safety
  safetyRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: SPACING.sm,
    marginBottom: SPACING.sm,
  },
  safetyLabel: {
    fontFamily: FONTS.header,
    fontSize: 16,
    flex: 1,
  },
  safetyAdvice: {
    fontFamily: FONTS.body,
    fontSize: 13,
    color: COLORS.creamDim,
    lineHeight: 20,
  },
  // Visa
  visaType: {
    fontFamily: FONTS.header,
    fontSize: 16,
    color: COLORS.cream,
    marginBottom: SPACING.xs,
  },
  // Attractions
  attractionRow: {
    flexDirection: 'row',
    alignItems: 'flex-start',
    gap: SPACING.md,
  },
  // Venue grid
  venueGrid: { flexDirection: 'row', flexWrap: 'wrap', gap: SPACING.sm },
  venueCard: { width: '47%' },
  // CTA
  ctaRow: { flexDirection: 'row', gap: SPACING.sm },
  ctaSage: {
    flex: 1,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: SPACING.xs,
    backgroundColor: COLORS.sage,
    borderRadius: RADIUS.pill,
    paddingVertical: SPACING.md,
  },
  ctaSageText: { fontFamily: FONTS.header, fontSize: 16, color: COLORS.bg },
  ctaGold: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: COLORS.gold,
    borderRadius: RADIUS.pill,
    paddingVertical: SPACING.md,
  },
  ctaGoldText: { fontFamily: FONTS.header, fontSize: 16, color: COLORS.bg },
});
