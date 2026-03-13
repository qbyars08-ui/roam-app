// =============================================================================
// ROAM — SVG World Map
// Visited countries in sage; tap country for trip details.
// Data from lib/passport.ts stamps.
// =============================================================================
import React, { useCallback, useEffect, useState } from 'react';
import {
  Modal,
  Pressable,
  ScrollView,
  StyleSheet,
  Text,
  View,
  type ViewStyle,
  type TextStyle,
} from 'react-native';
import Svg, { Circle } from 'react-native-svg';
import * as Haptics from '../../lib/haptics';

import { COLORS, FONTS, SPACING, RADIUS } from '../../lib/constants';
import { getStats, type PassportStamp } from '../../lib/passport';
import { COUNTRY_COORDS, project } from '../../lib/world-map-coords';

const MAP_WIDTH = 320;
const MAP_HEIGHT = 160;
const DOT_R = 4;
const DOT_R_VISITED = 5;

/** ISO code -> country name for display */
const COUNTRY_NAMES: Record<string, string> = {
  JP: 'Japan', ID: 'Indonesia', TH: 'Thailand', KR: 'South Korea', VN: 'Vietnam',
  KH: 'Cambodia', IN: 'India', AE: 'UAE', GE: 'Georgia', FR: 'France', ES: 'Spain',
  IT: 'Italy', GB: 'United Kingdom', NL: 'Netherlands', PT: 'Portugal', IS: 'Iceland',
  TR: 'Turkey', HR: 'Croatia', HU: 'Hungary', SI: 'Slovenia', GR: 'Greece',
  DE: 'Germany', AT: 'Austria', CH: 'Switzerland', CZ: 'Czech Republic',
  US: 'United States', MX: 'Mexico', CA: 'Canada', AR: 'Argentina', CO: 'Colombia',
  BR: 'Brazil', PE: 'Peru', CL: 'Chile', MA: 'Morocco', ZA: 'South Africa',
  EG: 'Egypt', AU: 'Australia', NZ: 'New Zealand', SG: 'Singapore', MY: 'Malaysia',
  PH: 'Philippines', CN: 'China',
};

interface WorldMapProps {
  onCountryPress?: (countryCode: string, stamps: PassportStamp[]) => void;
  /** Optional: pass stamps to control data (e.g. from parent that refetches) */
  stamps?: PassportStamp[];
}

export default function WorldMap({ onCountryPress, stamps: stampsProp }: WorldMapProps) {
  const [stamps, setStamps] = useState<PassportStamp[]>([]);
  const [selectedCountry, setSelectedCountry] = useState<string | null>(null);
  const [modalVisible, setModalVisible] = useState(false);

  useEffect(() => {
    if (Array.isArray(stampsProp)) {
      setStamps(stampsProp);
    } else {
      getStats().then((stats) => setStamps(stats.stamps));
    }
  }, [stampsProp]);

  const visitedCodes = new Set(stamps.map((s) => s.country));
  const stampsByCountry = React.useMemo(() => {
    const map = new Map<string, PassportStamp[]>();
    for (const s of stamps) {
      const list = map.get(s.country) ?? [];
      list.push(s);
      map.set(s.country, list);
    }
    return map;
  }, [stamps]);
  const totalCountries = visitedCodes.size;

  const handleCountryPress = useCallback(
    (code: string) => {
      Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
      const stamps = stampsByCountry.get(code) ?? [];
      if (onCountryPress) {
        onCountryPress(code, stamps);
      } else {
        setSelectedCountry(code);
        setModalVisible(true);
      }
    },
    [stampsByCountry, onCountryPress]
  );

  const selectedStamps = selectedCountry ? (stampsByCountry.get(selectedCountry) ?? []) : [];

  return (
    <View style={styles.container}>
      {/* Stats overlay */}
      <View style={styles.statsOverlay}>
        <Text style={styles.statsValue}>{totalCountries}</Text>
        <Text style={styles.statsLabel}>countries visited</Text>
      </View>

      {/* SVG map */}
      <View style={[styles.mapWrap, { width: MAP_WIDTH, height: MAP_HEIGHT }]}>
        <Svg width={MAP_WIDTH} height={MAP_HEIGHT} style={StyleSheet.absoluteFill}>
          {Object.entries(COUNTRY_COORDS).map(([code, [lat, lng]]) => {
            const [xNorm, yNorm] = project(lat, lng);
            const x = xNorm * MAP_WIDTH;
            const y = yNorm * MAP_HEIGHT;
            const visited = visitedCodes.has(code);
            const r = visited ? DOT_R_VISITED : DOT_R;

            return (
              <Circle
                key={code}
                cx={x}
                cy={y}
                r={r}
                fill={visited ? COLORS.sage : 'rgba(255,255,255,0.08)'}
                stroke={visited ? COLORS.sage : 'transparent'}
                strokeWidth={1}
              />
            );
          })}
        </Svg>
        {Object.entries(COUNTRY_COORDS).map(([code, [lat, lng]]) => {
          const [xNorm, yNorm] = project(lat, lng);
          const x = xNorm * MAP_WIDTH;
          const y = yNorm * MAP_HEIGHT;
          const r = visitedCodes.has(code) ? DOT_R_VISITED : DOT_R;
          const size = r * 2 + 16;

          return (
            <Pressable
              key={code}
              style={[
                styles.countryTouch,
                {
                  left: x - size / 2,
                  top: y - size / 2,
                  width: size,
                  height: size,
                },
              ]}
              onPress={() => handleCountryPress(code)}
            />
          );
        })}
      </View>

      {/* Tap hint */}
      {totalCountries > 0 && (
        <Text style={styles.hint}>Tap a country to see your trips</Text>
      )}

      {/* Country detail modal */}
      <Modal
        visible={modalVisible}
        transparent
        animationType="fade"
        onRequestClose={() => setModalVisible(false)}
      >
        <Pressable
          style={styles.modalOverlay}
          onPress={() => setModalVisible(false)}
        >
          <Pressable style={styles.modalContent} onPress={(e) => e.stopPropagation()}>
            {selectedCountry && (
              <>
                <Text style={styles.modalTitle}>
                  {COUNTRY_NAMES[selectedCountry] ?? selectedCountry}
                </Text>
                <ScrollView style={styles.stampList} showsVerticalScrollIndicator={false}>
                  {selectedStamps.map((s) => (
                    <View key={s.tripId} style={styles.stampRow}>
                      <Text style={styles.stampDest}>{s.destination}</Text>
                      <Text style={styles.stampDate}>
                        {new Date(s.stampedAt).toLocaleDateString()}
                      </Text>
                    </View>
                  ))}
                  {selectedStamps.length === 0 && (
                    <Text style={styles.noStamps}>No trips yet</Text>
                  )}
                </ScrollView>
                <Pressable
                  style={styles.closeBtn}
                  onPress={() => setModalVisible(false)}
                >
                  <Text style={styles.closeBtnText}>Close</Text>
                </Pressable>
              </>
            )}
          </Pressable>
        </Pressable>
      </Modal>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    backgroundColor: COLORS.bgCard,
    borderRadius: RADIUS.lg,
    borderWidth: 1,
    borderColor: COLORS.border,
    padding: SPACING.md,
  } as ViewStyle,
  statsOverlay: {
    flexDirection: 'row',
    alignItems: 'baseline',
    gap: SPACING.xs,
    marginBottom: SPACING.sm,
  } as ViewStyle,
  statsValue: {
    fontFamily: FONTS.header,
    fontSize: 28,
    color: COLORS.sage,
  } as TextStyle,
  statsLabel: {
    fontFamily: FONTS.body,
    fontSize: 14,
    color: COLORS.creamMuted,
  } as TextStyle,
  mapWrap: {
    borderRadius: RADIUS.md,
    overflow: 'hidden',
    position: 'relative',
  } as ViewStyle,
  countryTouch: {
    position: 'absolute',
  } as ViewStyle,
  hint: {
    fontFamily: FONTS.mono,
    fontSize: 10,
    color: COLORS.creamMuted,
    marginTop: SPACING.sm,
  } as TextStyle,
  modalOverlay: {
    flex: 1,
    backgroundColor: 'rgba(0,0,0,0.6)',
    justifyContent: 'center',
    alignItems: 'center',
  } as ViewStyle,
  modalContent: {
    backgroundColor: COLORS.bg,
    borderRadius: RADIUS.lg,
    padding: SPACING.lg,
    width: '85%',
    maxHeight: '50%',
  } as ViewStyle,
  modalTitle: {
    fontFamily: FONTS.header,
    fontSize: 22,
    color: COLORS.cream,
    marginBottom: SPACING.md,
  } as TextStyle,
  stampList: {
    maxHeight: 200,
    marginBottom: SPACING.md,
  } as ViewStyle,
  stampRow: {
    paddingVertical: SPACING.sm,
    borderBottomWidth: 1,
    borderBottomColor: COLORS.border,
  } as ViewStyle,
  stampDest: {
    fontFamily: FONTS.bodySemiBold,
    fontSize: 14,
    color: COLORS.cream,
  } as TextStyle,
  stampDate: {
    fontFamily: FONTS.mono,
    fontSize: 11,
    color: COLORS.creamMuted,
    marginTop: 2,
  } as TextStyle,
  noStamps: {
    fontFamily: FONTS.body,
    fontSize: 13,
    color: COLORS.creamMuted,
  } as TextStyle,
  closeBtn: {
    alignSelf: 'flex-end',
    paddingVertical: SPACING.sm,
    paddingHorizontal: SPACING.md,
  } as ViewStyle,
  closeBtnText: {
    fontFamily: FONTS.bodySemiBold,
    fontSize: 14,
    color: COLORS.sage,
  } as TextStyle,
});
