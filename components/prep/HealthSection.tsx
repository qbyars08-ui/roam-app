// =============================================================================
// HealthSection — health tab: water, insurance, hospitals, vaccinations, risks
// =============================================================================
import React from 'react';
import { View, Text, Pressable, StyleSheet, type ViewStyle, type TextStyle } from 'react-native';
import { useTranslation } from 'react-i18next';
import { useRouter } from 'expo-router';
import {
  Droplets,
  AlertTriangle,
  Stethoscope,
  Pill,
  Heart,
  CheckCircle,
  ShieldCheck,
  ChevronRight,
} from 'lucide-react-native';
import * as Haptics from '../../lib/haptics';
import { COLORS, FONTS, SPACING, RADIUS } from '../../lib/constants';
import type { SafetyData } from '../../lib/prep/safety-data';
import type { MedicalGuide } from '../../lib/medical-abroad';
import { sharedStyles } from './prep-shared';

type Props = {
  safety: SafetyData;
  tapWaterFromCultural: boolean | null;
  medicalGuide: MedicalGuide | null;
  destination: string;
};

export default function HealthSection({ safety, tapWaterFromCultural, medicalGuide, destination }: Props) {
  const { t } = useTranslation();
  const router = useRouter();
  const tapSafe = safety.tapWaterSafe ?? tapWaterFromCultural ?? medicalGuide?.tapWaterSafe ?? false;

  const hospitalColor =
    medicalGuide?.hospitalQuality === 'excellent' ? COLORS.sage
    : medicalGuide?.hospitalQuality === 'good' ? COLORS.sage
    : medicalGuide?.hospitalQuality === 'mixed' ? COLORS.gold
    : COLORS.coral;

  const insuranceColor =
    medicalGuide?.insurancePriority === 'critical' ? COLORS.coral
    : medicalGuide?.insurancePriority === 'recommended' ? COLORS.gold
    : COLORS.sage;

  const requiredVaccines = safety.vaccinations.filter((v) => v.required);
  const recommendedVaccines = safety.vaccinations.filter((v) => !v.required);
  const healthRisks = medicalGuide?.healthRisks ?? safety.commonHealthRisks;

  return (
    <View style={sharedStyles.tabContent}>
      {/* 1. The Big Three: Water / Insurance / Hospital */}
      <View style={styles.healthQuickGlance}>
        <View style={[styles.healthQuickCard, {
          backgroundColor: COLORS.bgMagazine,
          borderLeftColor: tapSafe ? COLORS.sage : COLORS.coral,
        }]}>
          <Droplets size={28} color={tapSafe ? COLORS.sage : COLORS.coral} />
          <Text style={[styles.healthQuickValue, { color: tapSafe ? COLORS.sage : COLORS.coral }]}>
            {tapSafe ? t('prep.tapWaterSafe', { defaultValue: 'Tap water safe' }) : t('prep.dontDrinkTapWater', { defaultValue: "Don't drink tap water" })}
          </Text>
          {medicalGuide?.waterNote ? (
            <Text style={styles.healthQuickNote}>{medicalGuide.waterNote}</Text>
          ) : !tapSafe ? (
            <Text style={styles.healthQuickNote}>{t('prep.stickToBottledWater', { defaultValue: 'Stick to bottled or filtered water' })}</Text>
          ) : null}
        </View>

        <View style={styles.healthQuickRow}>
          <View style={[styles.healthQuickCardSmall, {
            backgroundColor: COLORS.bgMagazine,
            borderLeftColor: insuranceColor,
          }]}>
            <AlertTriangle size={20} color={insuranceColor} />
            <Text style={[styles.healthQuickSmallLabel, { color: insuranceColor }]}>
              {t('prep.insurance', { defaultValue: 'Insurance' })}
            </Text>
            <Text style={[styles.healthQuickSmallValue, { color: insuranceColor }]}>
              {medicalGuide?.insurancePriority === 'critical' ? t('prep.critical', { defaultValue: 'Critical' })
                : medicalGuide?.insurancePriority === 'recommended' ? t('prep.getIt', { defaultValue: 'Get it' })
                : medicalGuide ? t('prep.niceToHave', { defaultValue: 'Nice to have' }) : t('prep.recommended', { defaultValue: 'Recommended' })}
            </Text>
          </View>

          {medicalGuide ? (
            <View style={[styles.healthQuickCardSmall, {
              backgroundColor: COLORS.bgMagazine,
              borderLeftColor: hospitalColor,
            }]}>
              <Stethoscope size={20} color={hospitalColor} />
              <Text style={[styles.healthQuickSmallLabel, { color: hospitalColor }]}>
                {t('prep.hospitals', { defaultValue: 'Hospitals' })}
              </Text>
              <Text style={[styles.healthQuickSmallValue, { color: hospitalColor }]}>
                {medicalGuide.hospitalQuality.charAt(0).toUpperCase() + medicalGuide.hospitalQuality.slice(1)}
              </Text>
            </View>
          ) : (
            <View style={[styles.healthQuickCardSmall, {
              backgroundColor: COLORS.bgMagazine,
              borderLeftWidth: 3,
              borderLeftColor: COLORS.sage,
            }]}>
              <Stethoscope size={20} color={COLORS.creamMuted} />
              <Text style={styles.healthQuickSmallLabel}>{t('prep.hospitals', { defaultValue: 'Hospitals' })}</Text>
              <Text style={[styles.healthQuickSmallValue, { color: COLORS.creamMuted }]}>
                {t('prep.researchLocally', { defaultValue: 'Research locally' })}
              </Text>
            </View>
          )}
        </View>
      </View>

      {/* 2. Medical Details */}
      {medicalGuide && (
        <View style={styles.healthSection}>
          <Text style={styles.healthSectionTitle}>{t('prep.medicalDetails', { defaultValue: 'Medical Details' })}</Text>
          <View style={styles.healthDetailRow}>
            <Pill size={16} color={medicalGuide.pharmacyOTC ? COLORS.sage : COLORS.gold} />
            <View style={styles.healthDetailContent}>
              <Text style={styles.healthDetailLabel}>
                {t('prep.pharmacy', { defaultValue: 'Pharmacy' })}: {medicalGuide.pharmacyOTC ? t('prep.otcAvailable', { defaultValue: 'OTC meds available' }) : t('prep.prescriptionRequired', { defaultValue: 'Prescription required' })}
              </Text>
              <Text style={styles.healthDetailNote}>{medicalGuide.pharmacyNote}</Text>
            </View>
          </View>
          {medicalGuide.erCostRange && (
            <View style={styles.healthDetailRow}>
              <Heart size={16} color={COLORS.coral} />
              <View style={styles.healthDetailContent}>
                <Text style={styles.healthDetailLabel}>{t('prep.erVisitNoInsurance', { defaultValue: 'ER visit (no insurance)' })}</Text>
                <Text style={[styles.healthDetailNote, { color: COLORS.coral }]}>{medicalGuide.erCostRange}</Text>
              </View>
            </View>
          )}
          {medicalGuide.insuranceNote && (
            <View style={styles.healthDetailRow}>
              <AlertTriangle size={16} color={insuranceColor} />
              <View style={styles.healthDetailContent}>
                <Text style={styles.healthDetailNote}>{medicalGuide.insuranceNote}</Text>
              </View>
            </View>
          )}
          {medicalGuide.hospitalNote && (
            <View style={styles.healthDetailRow}>
              <Stethoscope size={16} color={hospitalColor} />
              <View style={styles.healthDetailContent}>
                <Text style={styles.healthDetailNote}>{medicalGuide.hospitalNote}</Text>
              </View>
            </View>
          )}
        </View>
      )}

      {/* 3. If You Get Sick */}
      {medicalGuide && medicalGuide.whereToGo.length > 0 && (
        <View style={styles.healthSection}>
          <Text style={styles.healthSectionTitle}>{t('prep.ifYouGetSick', { defaultValue: 'If You Get Sick' })}</Text>
          {medicalGuide.whereToGo.map((item, i) => (
            <View key={i} style={styles.whereToGoRow}>
              <Text style={styles.whereToGoCondition}>{item.condition}</Text>
              <Text style={styles.whereToGoGo}>{'\u2192'} {item.go}</Text>
            </View>
          ))}
        </View>
      )}

      {/* 4. Vaccinations */}
      <View style={styles.healthSection}>
        <Text style={styles.healthSectionTitle}>{t('prep.vaccinations', { defaultValue: 'Vaccinations' })}</Text>
        {requiredVaccines.length > 0 ? (
          <>
            <Text style={styles.healthSubLabel}>{t('prep.required', { defaultValue: 'REQUIRED' })}</Text>
            {requiredVaccines.map((v, i) => (
              <View key={i} style={styles.vaccineRow}>
                <AlertTriangle size={14} color={COLORS.coral} />
                <Text style={[styles.vaccineName, { color: COLORS.coral }]}>{v.name}</Text>
              </View>
            ))}
          </>
        ) : (
          <View style={styles.healthGoodNews}>
            <CheckCircle size={16} color={COLORS.sage} />
            <Text style={styles.healthGoodNewsText}>{t('prep.noRequiredVaccinations', { defaultValue: 'No required vaccinations' })}</Text>
          </View>
        )}
        {recommendedVaccines.length > 0 && (
          <>
            <Text style={[styles.healthSubLabel, { marginTop: SPACING.md }]}>{t('prep.recommendedLabel', { defaultValue: 'RECOMMENDED' })}</Text>
            {recommendedVaccines.map((v, i) => (
              <View key={i} style={styles.vaccineRow}>
                <CheckCircle size={14} color={COLORS.sage} />
                <Text style={styles.vaccineName}>{v.name}</Text>
              </View>
            ))}
          </>
        )}
      </View>

      {/* 5. Health Risks */}
      {healthRisks.length > 0 && (
        <View style={styles.healthSection}>
          <Text style={styles.healthSectionTitle}>{t('prep.watchOutFor', { defaultValue: 'Watch Out For' })}</Text>
          {healthRisks.map((risk, i) => (
            <View key={i} style={styles.healthRiskRow}>
              <View style={styles.healthRiskDot} />
              <Text style={styles.healthRiskText}>{risk}</Text>
            </View>
          ))}
        </View>
      )}

      {/* 6. Body Intel CTA */}
      <Pressable
        onPress={() => {
          Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Medium);
          router.push({ pathname: '/body-intel', params: { destination } } as never);
        }}
        style={({ pressed }) => [
          sharedStyles.bodyIntelCta,
          pressed && { opacity: 0.7 },
        ]}
        accessibilityLabel="Open Body Intel — symptom checker, emergency phrases and local medication"
        accessibilityRole="button"
      >
        <ShieldCheck size={20} color={COLORS.sage} />
        <View style={{ flex: 1 }}>
          <Text style={sharedStyles.bodyIntelCtaTitle}>{t('prep.bodyIntel', { defaultValue: 'Body Intel' })}</Text>
          <Text style={sharedStyles.bodyIntelCtaSubtitle}>
            {t('prep.bodyIntelDesc', { defaultValue: 'Symptom checker, emergency phrases & local medication' })}
          </Text>
        </View>
        <ChevronRight size={18} color={COLORS.creamMuted} />
      </Pressable>
    </View>
  );
}

const styles = StyleSheet.create({
  healthQuickGlance: { gap: SPACING.sm, marginBottom: SPACING.lg } as ViewStyle,
  healthQuickCard: { borderRadius: RADIUS.lg, borderLeftWidth: 3, padding: SPACING.lg, alignItems: 'center', gap: SPACING.sm } as ViewStyle,
  healthQuickValue: { fontFamily: FONTS.header, fontSize: 22, textAlign: 'center' } as TextStyle,
  healthQuickNote: { fontFamily: FONTS.body, fontSize: 12, color: COLORS.creamMuted, textAlign: 'center', lineHeight: 16 } as TextStyle,
  healthQuickRow: { flexDirection: 'row', gap: SPACING.sm } as ViewStyle,
  healthQuickCardSmall: { flex: 1, borderRadius: RADIUS.lg, borderLeftWidth: 3, padding: SPACING.md, alignItems: 'center', gap: SPACING.sm } as ViewStyle,
  healthQuickSmallLabel: { fontFamily: FONTS.mono, fontSize: 10, letterSpacing: 1, textTransform: 'uppercase', color: COLORS.creamMuted } as TextStyle,
  healthQuickSmallValue: { fontFamily: FONTS.bodySemiBold, fontSize: 14 } as TextStyle,
  healthSection: { marginBottom: SPACING.lg } as ViewStyle,
  healthSectionTitle: { fontFamily: FONTS.header, fontSize: 18, color: COLORS.cream, marginBottom: SPACING.md } as TextStyle,
  healthSubLabel: { fontFamily: FONTS.mono, fontSize: 10, color: COLORS.creamMuted, letterSpacing: 1.5, marginBottom: SPACING.xs } as TextStyle,
  healthDetailRow: { flexDirection: 'row', alignItems: 'flex-start', gap: SPACING.sm, marginBottom: SPACING.sm, paddingVertical: SPACING.xs } as ViewStyle,
  healthDetailContent: { flex: 1 } as ViewStyle,
  healthDetailLabel: { fontFamily: FONTS.body, fontSize: 14, color: COLORS.cream, marginBottom: 2 } as TextStyle,
  healthDetailNote: { fontFamily: FONTS.body, fontSize: 12, color: COLORS.creamMuted, lineHeight: 16 } as TextStyle,
  healthGoodNews: { flexDirection: 'row', alignItems: 'center', gap: SPACING.sm, paddingVertical: SPACING.xs } as ViewStyle,
  healthGoodNewsText: { fontFamily: FONTS.body, fontSize: 14, color: COLORS.sage } as TextStyle,
  vaccineRow: { flexDirection: 'row', alignItems: 'center', gap: SPACING.sm, marginBottom: SPACING.xs } as ViewStyle,
  vaccineName: { fontFamily: FONTS.body, fontSize: 13, color: COLORS.cream } as TextStyle,
  healthRiskRow: { flexDirection: 'row', alignItems: 'center', gap: SPACING.sm, marginBottom: SPACING.xs } as ViewStyle,
  healthRiskDot: { width: 6, height: 6, borderRadius: RADIUS.sm, backgroundColor: COLORS.coral } as ViewStyle,
  healthRiskText: { fontFamily: FONTS.body, fontSize: 13, color: COLORS.cream } as TextStyle,
  whereToGoRow: { backgroundColor: COLORS.bgMagazine, borderRadius: RADIUS.md, borderLeftWidth: 3, borderLeftColor: COLORS.sage, padding: SPACING.md, marginBottom: SPACING.xs } as ViewStyle,
  whereToGoCondition: { fontFamily: FONTS.bodySemiBold, fontSize: 13, color: COLORS.cream, marginBottom: 2 } as TextStyle,
  whereToGoGo: { fontFamily: FONTS.body, fontSize: 12, color: COLORS.creamMuted, lineHeight: 16 } as TextStyle,
});
