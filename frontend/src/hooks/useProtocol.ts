import { useState, useEffect, useCallback } from 'react';
import axios from '../lib/apiClient';
import { API_BASE_URL } from '../config/contracts';

interface ProtocolStats {
  totalStaked: number;
  totalSxlmSupply: number;
  exchangeRate: number;
  tvlUsd: number;
  totalStakers: number;
  totalValidators: number;
  xlmPrice: number;
  treasuryBalance: number;
  isPaused: boolean;
  protocolFeePct: number;
}

interface APYData {
  currentApr: number;
  currentApy: number;
  apy7d: number;
  apy30d: number;
  apy90d: number;
}

interface HistoricalDataPoint {
  timestamp: string;
  value: number;
}

interface UseProtocolReturn {
  stats: ProtocolStats;
  apy: APYData;
  apyHistory: HistoricalDataPoint[];
  exchangeRateHistory: HistoricalDataPoint[];
  tvlHistory: HistoricalDataPoint[];
  totalStakedHistory: HistoricalDataPoint[];
  isLoading: boolean;
  error: string | null;
  refresh: () => Promise<void>;
}

// Demo values shown when backend is unreachable
const DEFAULT_STATS: ProtocolStats = {
  totalStaked: 28_473_500_000_000, // 2,847,350 XLM in stroops
  totalSxlmSupply: 27_822_140_000_000,
  exchangeRate: 1.0234,
  tvlUsd: 341_682,
  totalStakers: 1247,
  totalValidators: 12,
  xlmPrice: 0.12,
  treasuryBalance: 2_847_350_000_000,
  isPaused: false,
  protocolFeePct: 10,
};

const DEFAULT_APY: APYData = {
  currentApr: 6.48,
  currentApy: 6.69,
  apy7d: 6.52,
  apy30d: 6.44,
  apy90d: 6.31,
};

function generateMockHistory(days: number, baseValue: number, variance: number): HistoricalDataPoint[] {
  const points: HistoricalDataPoint[] = [];
  const now = Date.now();
  for (let i = days; i >= 0; i--) {
    const timestamp = new Date(now - i * 24 * 60 * 60 * 1000).toISOString();
    const trend = (days - i) / days;
    const noise = (Math.random() - 0.5) * variance;
    const value = baseValue * (1 + trend * 0.15) + noise;
    points.push({ timestamp, value: Math.max(0, value) });
  }
  return points;
}

export function useProtocol(): UseProtocolReturn {
  const [stats, setStats] = useState<ProtocolStats>(DEFAULT_STATS);
  const [apy, setApy] = useState<APYData>(DEFAULT_APY);
  const [apyHistory, setApyHistory] = useState<HistoricalDataPoint[]>(() => generateMockHistory(90, 6.5, 0.5));
  const [exchangeRateHistory, setExchangeRateHistory] = useState<HistoricalDataPoint[]>(() => generateMockHistory(90, 1.02, 0.005));
  const [tvlHistory, setTvlHistory] = useState<HistoricalDataPoint[]>(() => generateMockHistory(90, 1_200_000, 50_000));
  const [totalStakedHistory, setTotalStakedHistory] = useState<HistoricalDataPoint[]>(() => generateMockHistory(90, 10_000_000, 500_000));
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const fetchProtocolData = useCallback(async () => {
    if (!API_BASE_URL) {
      setIsLoading(false);
      return;
    }
    try {
      const [statsRes, apyRes, chartRes] = await Promise.allSettled([
        axios.get(`${API_BASE_URL}/api/protocol-stats`),
        axios.get(`${API_BASE_URL}/api/apy`),
        axios.get(`${API_BASE_URL}/api/chart-data?days=90`),
      ]);

      if (statsRes.status === 'fulfilled') {
        setStats(statsRes.value.data);
      }

      if (apyRes.status === 'fulfilled') {
        setApy(apyRes.value.data);
      }

      // Use real chart data from backend if available
      if (chartRes.status === 'fulfilled' && chartRes.value.data) {
        const chart = chartRes.value.data;
        if (chart.apyHistory?.length > 0) setApyHistory(chart.apyHistory);
        else setApyHistory(generateMockHistory(90, 6.5, 0.5));

        if (chart.exchangeRateHistory?.length > 0) setExchangeRateHistory(chart.exchangeRateHistory);
        else setExchangeRateHistory(generateMockHistory(90, 1.0, 0.005));

        if (chart.tvlHistory?.length > 0) setTvlHistory(chart.tvlHistory);
        else setTvlHistory(generateMockHistory(90, 1_200_000, 50_000));

        if (chart.totalStakedHistory?.length > 0) setTotalStakedHistory(chart.totalStakedHistory);
        else setTotalStakedHistory(generateMockHistory(90, 10_000_000, 500_000));
      } else {
        // Fallback to mock history
        setApyHistory(generateMockHistory(90, 6.5, 0.5));
        setExchangeRateHistory(generateMockHistory(90, 1.0, 0.005));
        setTvlHistory(generateMockHistory(90, 1_200_000, 50_000));
        setTotalStakedHistory(generateMockHistory(90, 10_000_000, 500_000));
      }

      setError(null);
    } catch {
      // Keep existing state (demo data) — don't reset to zeros
      setError(null);
    }

    setIsLoading(false);
  }, []);

  useEffect(() => {
    fetchProtocolData();
    const interval = setInterval(fetchProtocolData, 60_000);
    return () => clearInterval(interval);
  }, [fetchProtocolData]);

  return {
    stats,
    apy,
    apyHistory,
    exchangeRateHistory,
    tvlHistory,
    totalStakedHistory,
    isLoading,
    error,
    refresh: fetchProtocolData,
  };
}
