// =============================================================================
// VisaSection — visa requirements, Sherpa data, checklist
// =============================================================================
import React from 'react';
import { View, Text, TouchableOpacity, StyleSheet, Linking, type ViewStyle, type TextStyle } from 'react-native';
import { useTranslation } from 'react-i18next';
import { ExternalLink, CheckSquare } from 'lucide-react-native';
import * as Haptics from '../../lib/haptics';
import { COLORS, FONTS, SPACING, RADIUS } from '../../lib/constants';
import { getVisaInfo, destinationToCountryCode, type PassportNationality } from '../../lib/visa-intel';
import type { VisaResult } from '../../lib/apis/sherpa';
import type { GeoResult } from '../../lib/apis/mapbox';
import { sharedStyles, E_VISA_URLS } from './prep-shared';

type Props = {
  destination: string;
  passport: PassportNationality;
  visaReqs: VisaResult | null;
  geoCoords: GeoResult | null;
};

export default function VisaSection({ destination, passport, visaReqs, geoCoords }: Props) {
  const { t } = useTranslation();
  const visa = getVisaInfo(destination, passport);
  const countryCode = destinationToCountryCode(destination);
  const applyUrl = countryCode ? E_VISA_URLS[countryCode] : null;

  if (!visa) {
    return (
      <View style={sharedStyles.tabContent}>
        <Text style={sharedStyles.noDataText}>{t('prep.visaDataNotAvailable', { defaultValue: 'Visa data not available for this destination.' })}</Text>
        <Text style={styles.visaReminder}>
          {t('prep.visaIntelContact', { defaultValue: 'Contact your embassy for visa requirements.' })}
        </Text>
      </View>
    );
  }

  const { info } = visa;
  const isNotRequired = info.status === 'visa_free';
  const isOnArrival = info.status === 'visa_on_arrival';
  const isRequired = info.status === 'e_visa' || info.status === 'eta' || info.status === 'visa_required';

  const heroBg =
    isNotRequired
      ? COLORS.sage
      : isOnArrival
        ? COLORS.sage
        : COLORS.coral;

  return (
    <View style={sharedStyles.tabContent}>
      <Text style={styles.visaReminder}>{t('prep.visaIntel', { defaultValue: 'Visa intel — your passport, their rules' })}</Text>
      <View
        style={[
          styles.visaHeroCard,
          { borderLeftColor: heroBg },
        ]}
      >
        <Text
          style={[
            styles.visaHeroText,
            { color: heroBg },
            isRequired && info.status === 'visa_required' && styles.visaHeroBold,
          ]}
        >
          {isNotRequired
            ? t('prep.visaNotRequired', { defaultValue: 'Visa Not Required' })
            : isOnArrival
              ? t('prep.visaOnArrival', { defaultValue: 'Visa on Arrival' })
              : t('prep.visaRequired', { defaultValue: 'Visa Required' })}
        </Text>
      </View>

      {info.stayDays != null && info.stayDays < 999 && (
        <Text style={styles.visaDetail}>{`Stay up to ${info.stayDays} days`}</Text>
      )}
      {info.notes && (
        <Text style={styles.visaMeta}>{info.notes}</Text>
      )}
      {info.cost != null && (
        <Text style={styles.visaMeta}>{`Application fee: $${info.cost}`}</Text>
      )}

      {isRequired && applyUrl && (
        <TouchableOpacity
          style={styles.applyOnlineBtn}
          onPress={() => {
            Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
            Linking.openURL(applyUrl).catch(() => {});
          }}
          activeOpacity={0.7}
          accessibilityLabel="Apply for visa online — opens official government website"
          accessibilityRole="link"
        >
          <ExternalLink size={14} color={COLORS.sage} />
          <Text style={styles.applyOnlineText}>{t('prep.applyOnline', { defaultValue: 'Apply Online' })}</Text>
        </TouchableOpacity>
      )}

      <Text style={styles.visaChecklistLabel}>{t('prep.requirements', { defaultValue: 'Requirements' })}</Text>
      {[t('prep.validPassport', { defaultValue: 'Valid passport (6+ months)' }), t('prep.returnTicket', { defaultValue: 'Return ticket' }), t('prep.proofOfAccommodation', { defaultValue: 'Proof of accommodation' })].map((item, i) => (
        <View key={i} style={styles.visaChecklistRow}>
          <CheckSquare size={16} color={COLORS.sage} />
          <Text style={styles.visaChecklistText}>{item}</Text>
        </View>
      ))}

      {/* Sherpa granular visa requirements */}
      {visaReqs && (
        <View style={styles.sherpaVisaSection}>
          <Text style={styles.sherpaVisaHeading}>{t('prep.sherpaDetails', { defaultValue: 'Detailed Requirements (Sherpa)' })}</Text>
          {visaReqs.maxStay != null && (
            <Text style={styles.sherpaVisaDetail}>{`Max stay: ${visaReqs.maxStay} days`}</Text>
          )}
          {visaReqs.processingTime && (
            <Text style={styles.sherpaVisaDetail}>{`Processing: ${visaReqs.processingTime}`}</Text>
          )}
          {visaReqs.documentsNeeded.length > 0 && (
            <>
              <Text style={styles.sherpaVisaDocLabel}>{t('prep.documentsNeeded', { defaultValue: 'Documents needed' })}</Text>
              {visaReqs.documentsNeeded.map((doc, i) => (
                <View key={i} style={styles.visaChecklistRow}>
                  <CheckSquare size={14} color={COLORS.muted} />
                  <Text style={styles.visaChecklistText}>{doc}</Text>
                </View>
              ))}
            </>
          )}
          {visaReqs.notes && (
            <Text style={styles.sherpaVisaNote}>{visaReqs.notes}</Text>
          )}
          {visaReqs.officialLink && (
            <TouchableOpacity
              style={styles.applyOnlineBtn}
              onPress={() => Linking.openURL(visaReqs.officialLink!).catch(() => {})}
              activeOpacity={0.7}
              accessibilityLabel="Official visa info — opens government website"
              accessibilityRole="link"
            >
              <ExternalLink size={14} color={COLORS.sage} />
              <Text style={styles.applyOnlineText}>{t('prep.officialInfo', { defaultValue: 'Official Info' })}</Text>
            </TouchableOpacity>
          )}
        </View>
      )}

      {/* Mapbox coordinates */}
      {geoCoords && (
        <View style={styles.geoSection}>
          <Text style={styles.geoLabel}>{geoCoords.placeName}</Text>
          <Text style={styles.geoCoords}>{geoCoords.lat.toFixed(4)}, {geoCoords.lng.toFixed(4)}</Text>
        </View>
      )}
    </View>
  );
}

const styles = StyleSheet.create({
  visaReminder: {
    fontFamily: FONTS.mono,
    fontSize: 11,
    color: COLORS.sage,
    marginBottom: SPACING.sm,
  } as TextStyle,
  visaHeroCard: {
    backgroundColor: COLORS.bgMagazine,
    borderRadius: RADIUS.lg,
    borderLeftWidth: 3,
    padding: SPACING.lg,
    marginBottom: SPACING.md,
  } as ViewStyle,
  visaHeroText: {
    fontFamily: FONTS.header,
    fontSize: 22,
  } as TextStyle,
  visaHeroBold: {
    fontFamily: FONTS.bodySemiBold,
  } as TextStyle,
  visaDetail: {
    fontFamily: FONTS.mono,
    fontSize: 14,
    color: COLORS.cream,
    marginBottom: SPACING.xs,
  } as TextStyle,
  visaMeta: {
    fontFamily: FONTS.mono,
    fontSize: 13,
    color: COLORS.creamMuted,
    marginBottom: SPACING.xs,
  } as TextStyle,
  applyOnlineBtn: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: SPACING.sm,
    marginTop: SPACING.md,
    marginBottom: SPACING.lg,
  } as ViewStyle,
  applyOnlineText: {
    fontFamily: FONTS.body,
    fontSize: 14,
    color: COLORS.sage,
  } as TextStyle,
  visaChecklistLabel: {
    fontFamily: FONTS.mono,
    fontSize: 11,
    color: COLORS.sage,
    marginBottom: SPACING.sm,
  } as TextStyle,
  visaChecklistRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: SPACING.sm,
    marginBottom: SPACING.xs,
  } as ViewStyle,
  visaChecklistText: {
    fontFamily: FONTS.body,
    fontSize: 13,
    color: COLORS.cream,
  } as TextStyle,
  sherpaVisaSection: {
    marginTop: SPACING.md,
    paddingTop: SPACING.md,
    borderTopWidth: 1,
    borderTopColor: COLORS.border,
  } as ViewStyle,
  sherpaVisaHeading: {
    fontFamily: FONTS.mono,
    fontSize: 11,
    color: COLORS.muted,
    letterSpacing: 1,
    marginBottom: SPACING.sm,
  } as TextStyle,
  sherpaVisaDetail: {
    fontFamily: FONTS.body,
    fontSize: 14,
    color: COLORS.cream,
    marginBottom: 4,
  } as TextStyle,
  sherpaVisaDocLabel: {
    fontFamily: FONTS.bodyMedium,
    fontSize: 13,
    color: COLORS.muted,
    marginTop: SPACING.sm,
    marginBottom: SPACING.xs,
  } as TextStyle,
  sherpaVisaNote: {
    fontFamily: FONTS.body,
    fontSize: 13,
    color: COLORS.muted,
    marginTop: SPACING.sm,
    fontStyle: 'italic',
  } as TextStyle,
  geoSection: {
    marginTop: SPACING.md,
    paddingTop: SPACING.sm,
    borderTopWidth: 1,
    borderTopColor: COLORS.border,
  } as ViewStyle,
  geoLabel: {
    fontFamily: FONTS.bodyMedium,
    fontSize: 13,
    color: COLORS.cream,
  } as TextStyle,
  geoCoords: {
    fontFamily: FONTS.mono,
    fontSize: 12,
    color: COLORS.muted,
    marginTop: 2,
  } as TextStyle,
});
