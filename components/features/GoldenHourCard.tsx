import React, { useCallback, useEffect, useMemo, useState } from 'react';
import { ActivityIndicator, View, Text } from 'react-native';
import { Sunrise, Sunset, Sun } from 'lucide-react-native';
import { COLORS, FONTS, SPACING, RADIUS } from '../../lib/constants';

interface GoldenHourCardProps {
  lat: number;
  lng: number;
}

interface GoldenHourData {
  sunriseTime: Date;
  sunsetTime: Date;
  morningGoldenStart: Date;
  morningGoldenEnd: Date;
  eveningGoldenStart: Date;
  eveningGoldenEnd: Date;
}

const formatTime = (date: Date): string => {
  return date.toLocaleTimeString('en-US', {
    hour: 'numeric',
    minute: '2-digit',
    hour12: true,
  });
};

const calculateGoldenHours = (data: {
  sunrise: string;
  sunset: string;
}): GoldenHourData => {
  const sunriseTime = new Date(data.sunrise);
  const sunsetTime = new Date(data.sunset);

  // Golden hour = 30 minutes before/after sunrise/sunset
  const morningGoldenStart = new Date(sunriseTime.getTime() - 30 * 60000);
  const morningGoldenEnd = sunriseTime;
  const eveningGoldenStart = sunsetTime;
  const eveningGoldenEnd = new Date(sunsetTime.getTime() + 30 * 60000);

  return {
    sunriseTime,
    sunsetTime,
    morningGoldenStart,
    morningGoldenEnd,
    eveningGoldenStart,
    eveningGoldenEnd,
  };
};

const fetchGoldenHourData = async (lat: number, lng: number): Promise<GoldenHourData | null> => {
  try {
    const response = await fetch(
      `https://api.sunrise-sunset.org/json?lat=${lat}&lng=${lng}&formatted=0`
    );
    const json = await response.json();

    if (json.status !== 'OK' || !json.results) {
      return null;
    }

    return calculateGoldenHours({
      sunrise: json.results.sunrise,
      sunset: json.results.sunset,
    });
  } catch {
    return null;
  }
};

export const GoldenHourCard: React.FC<GoldenHourCardProps> = ({ lat, lng }) => {
  const [data, setData] = useState<GoldenHourData | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(false);

  useEffect(() => {
    const loadGoldenHourData = async () => {
      setLoading(true);
      setError(false);
      const result = await fetchGoldenHourData(lat, lng);
      if (result) {
        setData(result);
      } else {
        setError(true);
      }
      setLoading(false);
    };

    loadGoldenHourData();
  }, [lat, lng]);

  const bestPhotoWindow = useMemo(() => {
    if (!data) return null;

    const morning = `${formatTime(data.morningGoldenStart)} – ${formatTime(data.morningGoldenEnd)}`;
    const evening = `${formatTime(data.eveningGoldenStart)} – ${formatTime(data.eveningGoldenEnd)}`;

    return { morning, evening };
  }, [data]);

  if (loading) {
    return (
      <View
        style={{
          backgroundColor: COLORS.bgCard,
          borderRadius: RADIUS.lg,
          borderWidth: 1,
          borderColor: COLORS.border,
          padding: SPACING.lg,
          justifyContent: 'center',
          alignItems: 'center',
          height: 200,
        }}
      >
        <ActivityIndicator color={COLORS.sage} size="small" />
      </View>
    );
  }

  if (error || !data || !bestPhotoWindow) {
    return null;
  }

  return (
    <View
      style={{
        backgroundColor: COLORS.bgCard,
        borderRadius: RADIUS.lg,
        borderWidth: 1,
        borderColor: COLORS.border,
        padding: SPACING.lg,
        gap: SPACING.md,
      }}
    >
      {/* Header */}
      <View style={{ flexDirection: 'row', alignItems: 'center', gap: SPACING.sm }}>
        <Sun width={24} height={24} color={COLORS.cream} strokeWidth={2} />
        <Text
          style={{
            fontFamily: FONTS.header,
            fontSize: 20,
            fontWeight: '700',
            color: COLORS.cream,
          }}
        >
          Golden Hour
        </Text>
      </View>

      {/* Morning Golden Hour */}
      <View style={{ gap: SPACING.xs }}>
        <View style={{ flexDirection: 'row', alignItems: 'center', gap: SPACING.sm }}>
          <Sunrise width={18} height={18} color={COLORS.sage} strokeWidth={2} />
          <Text
            style={{
              fontFamily: FONTS.body,
              fontSize: 14,
              color: COLORS.creamMuted,
            }}
          >
            Morning
          </Text>
        </View>
        <Text
          style={{
            fontFamily: FONTS.mono,
            fontSize: 14,
            fontWeight: '500',
            color: COLORS.cream,
            marginLeft: 26,
          }}
        >
          {bestPhotoWindow.morning}
        </Text>
      </View>

      {/* Evening Golden Hour */}
      <View style={{ gap: SPACING.xs }}>
        <View style={{ flexDirection: 'row', alignItems: 'center', gap: SPACING.sm }}>
          <Sunset width={18} height={18} color={COLORS.sage} strokeWidth={2} />
          <Text
            style={{
              fontFamily: FONTS.body,
              fontSize: 14,
              color: COLORS.creamMuted,
            }}
          >
            Evening
          </Text>
        </View>
        <Text
          style={{
            fontFamily: FONTS.mono,
            fontSize: 14,
            fontWeight: '500',
            color: COLORS.cream,
            marginLeft: 26,
          }}
        >
          {bestPhotoWindow.evening}
        </Text>
      </View>

      {/* Best Photo Window Highlight */}
      <View
        style={{
          backgroundColor: `${COLORS.gold}15`,
          borderRadius: RADIUS.md,
          borderWidth: 1,
          borderColor: `${COLORS.gold}40`,
          padding: SPACING.md,
          marginTop: SPACING.sm,
        }}
      >
        <Text
          style={{
            fontFamily: FONTS.body,
            fontSize: 12,
            fontWeight: '600',
            color: COLORS.gold,
            marginBottom: SPACING.xs,
          }}
        >
          Best Photo Window
        </Text>
        <Text
          style={{
            fontFamily: FONTS.body,
            fontSize: 12,
            color: COLORS.creamMuted,
            lineHeight: 18,
          }}
        >
          Shoot during golden hour for warm, soft light that flatters landscapes and portraits.
        </Text>
      </View>
    </View>
  );
};
