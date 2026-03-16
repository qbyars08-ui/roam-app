import React, { useCallback, useMemo, useState, useEffect } from 'react';
import { View, Text, ActivityIndicator } from 'react-native';
import { Svg, Path, Defs, LinearGradient, Stop } from 'react-native-svg';
import { TrendingUp, TrendingDown } from 'lucide-react-native';
import { COLORS, FONTS, SPACING, RADIUS } from '../../lib/constants';
import { getExchangeRates } from '../../lib/exchange-rates';

interface CurrencySparklineProps {
  baseCurrency: string;
  targetCurrency: string;
  destinationName: string;
}

export const CurrencySparkline: React.FC<CurrencySparklineProps> = ({
  baseCurrency,
  targetCurrency,
  destinationName,
}) => {
  const [currentRate, setCurrentRate] = useState<number | null>(null);
  const [sparklineData, setSparklineData] = useState<number[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(false);

  // Fetch current exchange rate and generate mock historical data
  useEffect(() => {
    const fetchData = async () => {
      try {
        setLoading(true);
        const ratesData = await getExchangeRates(baseCurrency);

        if (!ratesData || !ratesData.rates[targetCurrency]) {
          setError(true);
          return;
        }

        const rate = ratesData.rates[targetCurrency];
        setCurrentRate(rate);

        // TODO: Replace with getCurrencyHistory() when available
        // For now, generate mock 30-day sparkline with current rate +/- random variation
        const mockData: number[] = [];
        const variance = rate * 0.03; // 3% variance
        for (let i = 0; i < 30; i++) {
          const randomVariation = (Math.random() - 0.5) * variance * 2;
          mockData.push(Math.max(rate - variance, rate + randomVariation));
        }
        setSparklineData(mockData);
        setError(false);
      } catch {
        setError(true);
      } finally {
        setLoading(false);
      }
    };

    fetchData();
  }, [baseCurrency, targetCurrency]);

  // Calculate trend metrics
  const trendMetrics = useMemo(() => {
    if (sparklineData.length === 0 || currentRate === null) {
      return { percentChange: 0, is30DayHigh: false, trendColor: COLORS.sage };
    }

    const thirtyDayHigh = Math.max(...sparklineData);
    const thirtyDayLow = Math.min(...sparklineData);
    const oldestRate = sparklineData[0];

    const percentChange = ((currentRate - oldestRate) / oldestRate) * 100;
    const is30DayHigh = currentRate >= thirtyDayHigh * 0.98; // Within 2% of high
    const trendColor = percentChange >= 0 ? COLORS.sage : COLORS.coral;

    return { percentChange, is30DayHigh, trendColor, thirtyDayHigh };
  }, [sparklineData, currentRate]);

  // Generate SVG sparkline path
  const sparklinePathData = useMemo(() => {
    if (sparklineData.length < 2) return '';

    const width = 240;
    const height = 60;
    const padding = 8;
    const plotWidth = width - padding * 2;
    const plotHeight = height - padding * 2;

    const minValue = Math.min(...sparklineData);
    const maxValue = Math.max(...sparklineData);
    const range = maxValue - minValue || 1;

    const points = sparklineData.map((value, index) => {
      const x = (index / (sparklineData.length - 1)) * plotWidth + padding;
      const y = height - padding - ((value - minValue) / range) * plotHeight;
      return { x, y };
    });

    if (points.length === 0) return '';

    // Build path
    const pathParts = [
      `M ${points[0].x} ${points[0].y}`,
      ...points.slice(1).map((p) => `L ${p.x} ${p.y}`),
    ];

    return pathParts.join(' ');
  }, [sparklineData]);

  // Handle loading state
  if (loading) {
    return (
      <View
        style={{
          backgroundColor: COLORS.bgCard,
          borderColor: COLORS.border,
          borderWidth: 1,
          borderRadius: RADIUS.md,
          padding: SPACING.md,
          alignItems: 'center',
          justifyContent: 'center',
          minHeight: 140,
        }}
      >
        <ActivityIndicator size="small" color={COLORS.sage} />
      </View>
    );
  }

  // Handle error state - return null as per spec
  if (error || currentRate === null) {
    return null;
  }

  const { percentChange, is30DayHigh, trendColor } = trendMetrics;

  // Format current rate with appropriate decimal places
  const formattedRate = currentRate.toFixed(
    targetCurrency === 'JPY' || targetCurrency === 'KRW' ? 0 : 2,
  );

  const formattedTrend = percentChange.toFixed(2);
  const trendSign = percentChange >= 0 ? '+' : '';

  return (
    <View
      style={{
        backgroundColor: COLORS.bgCard,
        borderColor: COLORS.border,
        borderWidth: 1,
        borderRadius: RADIUS.md,
        padding: SPACING.md,
        gap: SPACING.sm,
      }}
    >
      {/* Header: Rate and badge */}
      <View style={{ flexDirection: 'row', justifyContent: 'space-between', alignItems: 'flex-start' }}>
        <View style={{ flex: 1, gap: SPACING.xs }}>
          <Text
            style={{
              fontSize: 12,
              color: COLORS.creamFaint,
              fontFamily: FONTS.mono,
              letterSpacing: 0.5,
            }}
          >
            {baseCurrency} TO {targetCurrency}
          </Text>
          <Text
            style={{
              fontSize: 24,
              fontWeight: 'bold',
              color: COLORS.cream,
              fontFamily: FONTS.header,
              lineHeight: 28,
            }}
          >
            1 {baseCurrency} = {formattedRate} {targetCurrency}
          </Text>
        </View>

        {/* Best rate badge */}
        {is30DayHigh && (
          <View
            style={{
              backgroundColor: COLORS.sageSubtle,
              borderColor: COLORS.sageBorder,
              borderWidth: 1,
              borderRadius: RADIUS.sm,
              paddingHorizontal: SPACING.sm,
              paddingVertical: SPACING.xs,
            }}
          >
            <Text
              style={{
                fontSize: 11,
                color: COLORS.sage,
                fontFamily: FONTS.mono,
                fontWeight: '600',
              }}
            >
              BEST RATE
            </Text>
          </View>
        )}
      </View>

      {/* Sparkline SVG */}
      <View style={{ marginVertical: SPACING.sm }}>
        <Svg width="100%" height={80} viewBox="0 0 240 80">
          <Defs>
            <LinearGradient id="sparklineGradient" x1="0%" y1="0%" x2="0%" y2="100%">
              <Stop offset="0%" stopColor={trendColor} stopOpacity="0.3" />
              <Stop offset="100%" stopColor={trendColor} stopOpacity="0.05" />
            </LinearGradient>
          </Defs>

          {/* Area fill */}
          {sparklinePathData && (
            <>
              <Path
                d={`${sparklinePathData} L 240 80 L 0 80 Z`}
                fill="url(#sparklineGradient)"
              />
              {/* Line stroke */}
              <Path d={sparklinePathData} stroke={trendColor} strokeWidth={2} fill="none" />
            </>
          )}
        </Svg>
      </View>

      {/* Trend info: percentage + color-coded icon */}
      <View style={{ flexDirection: 'row', alignItems: 'center', gap: SPACING.sm }}>
        <View style={{ flexDirection: 'row', alignItems: 'center', gap: SPACING.xs }}>
          {percentChange >= 0 ? (
            <TrendingUp size={16} color={COLORS.sage} strokeWidth={2} />
          ) : (
            <TrendingDown size={16} color={COLORS.coral} strokeWidth={2} />
          )}
        </View>

        <Text
          style={{
            fontSize: 13,
            color: trendColor,
            fontFamily: FONTS.mono,
            fontWeight: '600',
          }}
        >
          {trendSign}
          {formattedTrend}% (30-day)
        </Text>

        <Text
          style={{
            fontSize: 12,
            color: COLORS.creamFaint,
            fontFamily: FONTS.body,
            marginLeft: SPACING.sm,
          }}
        >
          in {destinationName}
        </Text>
      </View>
    </View>
  );
};
