// =============================================================================
// ROAM — Visa Requirement Card
// Rich destination visa card: traffic light, requirements list, pro tip.
// Uses curated RichVisaRequirement data from lib/visa-intel.ts.
// US passport holders only. Always verify before travel.
// =============================================================================
import React, { useMemo } from 'react';
import {
  View,
  Text,
  StyleSheet,
  type ViewStyle,
  type TextStyle,
} from 'react-native';
import { CheckCircle2, AlertCircle, XCircle, Clock, DollarSign, FileText, type LucideIcon } from 'lucide-react-native';
import { useTranslation } from 'react-i18next';
import { COLORS, FONTS, SPACING, RADIUS } from '../../lib/constants';
import {
  getVisaRequirement,
  getVisaComplexity,
  getVisaBadgeLabel,
  RICH_VISA_STATUS_COLORS,
  VISA_TYPE_LABELS,
  type RichVisaRequirement,
  type VisaComplexity,
} from '../../lib/visa-intel';

// ---------------------------------------------------------------------------
// Props
// ---------------------------------------------------------------------------
interface VisaRequirementCardProps {
  destination: string;
}

// ---------------------------------------------------------------------------
// Traffic light config
// ---------------------------------------------------------------------------
const COMPLEXITY_CONFIG: Record<VisaComplexity, {
  color: string;
  bg: string;
  border: string;
  IconComponent: LucideIcon;
  label: string;
}> = {
  easy: {
    color: RICH_VISA_STATUS_COLORS.easy,
    bg: 'rgba(74,222,128,0.08)',
    border: 'rgba(74,222,128,0.25)',
    IconComponent: CheckCircle2,
    label: 'Easy Entry',
  },
  moderate: {
    color: RICH_VISA_STATUS_COLORS.moderate,
    bg: 'rgba(245,158,11,0.08)',
    border: 'rgba(245,158,11,0.25)',
    IconComponent: AlertCircle,
    label: 'Some Process Required',
  },
  complex: {
    color: RICH_VISA_STATUS_COLORS.complex,
    bg: 'rgba(232,97,74,0.08)',
    border: 'rgba(232,97,74,0.25)',
    IconComponent: XCircle,
    label: 'Advance Visa Required',
  },
};

// ---------------------------------------------------------------------------
// Sub-components
// ---------------------------------------------------------------------------
function StatusBadge({ label, color, bg }: { label: string; color: string; bg: string }) {
  return (
    <View style={[styles.badge, { backgroundColor: bg }]}>
      <Text style={[styles.badgeText, { color }]}>{label}</Text>
    </View>
  );
}

function RequirementRow({ text }: { text: string }) {
  return (
    <View style={styles.requirementRow}>
      <CheckCircle2 size={13} color={COLORS.sage} strokeWidth={1.5} />
      <Text style={styles.requirementText}>{text}</Text>
    </View>
  );
}

function MetaRow({
  icon,
  label,
  value,
}: {
  icon: React.ReactNode;
  label: string;
  value: string;
}) {
  return (
    <View style={styles.metaRow}>
      <View style={styles.metaIcon}>{icon}</View>
      <Text style={styles.metaLabel}>{label}</Text>
      <Text style={styles.metaValue}>{value}</Text>
    </View>
  );
}

// ---------------------------------------------------------------------------
// Main component
// ---------------------------------------------------------------------------
export default function VisaRequirementCard({ destination }: VisaRequirementCardProps) {
  const { t } = useTranslation();

  const req: RichVisaRequirement | null = useMemo(
    () => getVisaRequirement(destination),
    [destination]
  );

  const complexity = useMemo(() => getVisaComplexity(destination), [destination]);
  const badgeLabel = useMemo(() => getVisaBadgeLabel(destination), [destination]);

  if (!req) return null;

  const config = COMPLEXITY_CONFIG[complexity];
  const { IconComponent } = config;
  const proTip = req.tips[0] ?? null;

  return (
    <View style={styles.card}>
      {/* Header row */}
      <View style={styles.header}>
        <Text style={styles.sectionLabel}>
          {t('visa.headerLabel', { defaultValue: 'VISA & ENTRY' })}
        </Text>
        <StatusBadge label={badgeLabel} color={config.color} bg={config.bg} />
      </View>

      {/* Traffic light + title */}
      <View style={[styles.statusRow, { backgroundColor: config.bg, borderColor: config.border }]}>
        <IconComponent size={20} color={config.color} strokeWidth={1.5} />
        <View style={styles.statusText}>
          <Text style={[styles.visaTypeLabel, { color: config.color }]}>
            {VISA_TYPE_LABELS[req.visaType]}
          </Text>
          <Text style={styles.stayDuration}>
            {t('visa.upToDays', {
              defaultValue: `Up to ${req.maxStayDays} days`,
            })}
          </Text>
        </View>
      </View>

      {/* Cost + processing time */}
      <View style={styles.metaSection}>
        <MetaRow
          icon={<DollarSign size={13} color={COLORS.muted} strokeWidth={1.5} />}
          label={t('visa.cost', { defaultValue: 'Cost' })}
          value={req.cost}
        />
        <MetaRow
          icon={<Clock size={13} color={COLORS.muted} strokeWidth={1.5} />}
          label={t('visa.processing', { defaultValue: 'Processing' })}
          value={req.processingTime}
        />
      </View>

      {/* Divider */}
      <View style={styles.divider} />

      {/* Requirements */}
      <View style={styles.requirementsSection}>
        <View style={styles.requirementsHeader}>
          <FileText size={12} color={COLORS.muted} strokeWidth={1.5} />
          <Text style={styles.requirementsTitle}>
            {t('visa.requirements', { defaultValue: 'Requirements' })}
          </Text>
        </View>
        {req.requirements.map((item, index) => (
          <RequirementRow key={index} text={item} />
        ))}
      </View>

      {/* Pro tip */}
      {proTip !== null && (
        <View style={styles.tipContainer}>
          <Text style={styles.tipLabel}>
            {t('visa.proTip', { defaultValue: 'PRO TIP' })}
          </Text>
          <Text style={styles.tipText}>{proTip}</Text>
        </View>
      )}

      {/* Footer disclaimer */}
      <Text style={styles.disclaimer}>
        {t('visa.disclaimer', {
          defaultValue: `Last updated: ${req.lastUpdated} · US passport holders · Verify at travel.state.gov`,
        })}
      </Text>
    </View>
  );
}

// ---------------------------------------------------------------------------
// Styles
// ---------------------------------------------------------------------------
const styles = StyleSheet.create({
  card: {
    backgroundColor: COLORS.surface1,
    borderRadius: RADIUS.lg,
    borderWidth: 1,
    borderColor: COLORS.border,
    padding: SPACING.md,
    gap: SPACING.sm,
  } as ViewStyle,

  header: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
  } as ViewStyle,

  sectionLabel: {
    fontFamily: FONTS.mono,
    fontSize: 10,
    color: COLORS.sage,
    letterSpacing: 1.5,
  } as TextStyle,

  badge: {
    paddingHorizontal: SPACING.sm,
    paddingVertical: 3,
    borderRadius: RADIUS.pill,
  } as ViewStyle,

  badgeText: {
    fontFamily: FONTS.mono,
    fontSize: 9,
    letterSpacing: 1,
  } as TextStyle,

  statusRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: SPACING.sm,
    paddingHorizontal: SPACING.sm,
    paddingVertical: 10,
    borderRadius: RADIUS.md,
    borderWidth: 1,
  } as ViewStyle,

  statusText: {
    flex: 1,
  } as ViewStyle,

  visaTypeLabel: {
    fontFamily: FONTS.bodySemiBold,
    fontSize: 16,
    lineHeight: 20,
  } as TextStyle,

  stayDuration: {
    fontFamily: FONTS.body,
    fontSize: 12,
    color: COLORS.muted,
    marginTop: 1,
  } as TextStyle,

  metaSection: {
    gap: 6,
  } as ViewStyle,

  metaRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
  } as ViewStyle,

  metaIcon: {
    width: 16,
    alignItems: 'center',
  } as ViewStyle,

  metaLabel: {
    fontFamily: FONTS.body,
    fontSize: 12,
    color: COLORS.muted,
    width: 80,
  } as TextStyle,

  metaValue: {
    fontFamily: FONTS.bodyMedium,
    fontSize: 12,
    color: COLORS.creamBright,
    flex: 1,
  } as TextStyle,

  divider: {
    height: 1,
    backgroundColor: COLORS.border,
  } as ViewStyle,

  requirementsSection: {
    gap: 6,
  } as ViewStyle,

  requirementsHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 5,
    marginBottom: 2,
  } as ViewStyle,

  requirementsTitle: {
    fontFamily: FONTS.mono,
    fontSize: 10,
    color: COLORS.muted,
    letterSpacing: 0.8,
  } as TextStyle,

  requirementRow: {
    flexDirection: 'row',
    alignItems: 'flex-start',
    gap: 7,
  } as ViewStyle,

  requirementText: {
    fontFamily: FONTS.body,
    fontSize: 12,
    color: COLORS.creamDim,
    flex: 1,
    lineHeight: 18,
  } as TextStyle,

  tipContainer: {
    backgroundColor: COLORS.sageVeryFaint,
    borderLeftWidth: 2,
    borderLeftColor: COLORS.sage,
    paddingVertical: 8,
    paddingHorizontal: SPACING.sm,
    borderRadius: 4,
  } as ViewStyle,

  tipLabel: {
    fontFamily: FONTS.mono,
    fontSize: 9,
    color: COLORS.sage,
    letterSpacing: 1,
    marginBottom: 3,
  } as TextStyle,

  tipText: {
    fontFamily: FONTS.mono,
    fontSize: 10,
    color: COLORS.creamDim,
    lineHeight: 15,
  } as TextStyle,

  disclaimer: {
    fontFamily: FONTS.mono,
    fontSize: 9,
    color: COLORS.muted,
    lineHeight: 13,
  } as TextStyle,
});
