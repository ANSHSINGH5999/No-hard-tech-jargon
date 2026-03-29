import { useState, useCallback, useEffect } from 'react';
import axios from '../lib/apiClient';
import { API_BASE_URL } from '../config/contracts';
import { useWallet } from './useWallet';

interface PoolStats {
  reserveXlm: number;
  reserveSxlm: number;
  totalLpSupply: number;
  price: number;
  feeBps: number;
  tvl: number;
  oracle?: OracleStats | null;
  activeLiquidityMiningPrograms?: number;
}

interface LpPosition {
  lpTokens: number;
  sharePercent: number;
  xlmShare: number;
  sxlmShare: number;
}

interface OracleStats {
  spotPrice: number;
  twapPrice: number;
  deviationBps: number;
  windowSeconds: number;
  sampleCount: number;
  confidence: 'low' | 'medium' | 'high';
  startTime: string;
  endTime: string;
}

interface LiquidityMiningProgram {
  programId: string;
  title: string;
  status: string;
  rewardAsset: string;
  rewardPerDay: number;
  rewardPerDayRaw: string;
  startAt: string;
  endAt: string;
}

interface LiquidityMiningPosition {
  eligiblePrograms: Array<{
    programId: string;
    title: string;
    rewardAsset: string;
    estimatedDailyRewards: number;
    estimatedDailyRewardsRaw: string;
    sharePercent: number;
    status: string;
  }>;
}

interface UseLiquidityReturn {
  pool: PoolStats;
  position: LpPosition;
  oracle: OracleStats | null;
  miningPrograms: LiquidityMiningProgram[];
  miningPosition: LiquidityMiningPosition;
  isLoading: boolean;
  isSubmitting: boolean;
  error: string | null;
  lastTxHash: string | null;
  addLiquidity: (xlmAmount: number, sxlmAmount: number) => Promise<boolean>;
  removeLiquidity: (lpAmount: number) => Promise<boolean>;
  swapXlmToSxlm: (amount: number) => Promise<boolean>;
  swapSxlmToXlm: (amount: number) => Promise<boolean>;
  clearError: () => void;
  refresh: () => Promise<void>;
}

const DEFAULT_POOL: PoolStats = {
  reserveXlm: 0,
  reserveSxlm: 0,
  totalLpSupply: 0,
  price: 1.0,
  feeBps: 30,
  tvl: 0,
};

const DEFAULT_POSITION: LpPosition = {
  lpTokens: 0,
  sharePercent: 0,
  xlmShare: 0,
  sxlmShare: 0,
};

const DEFAULT_MINING_POSITION: LiquidityMiningPosition = {
  eligiblePrograms: [],
};

export function useLiquidity(): UseLiquidityReturn {
  const { publicKey, isConnected, signTransaction, getAuthHeaders } = useWallet();
  const [pool, setPool] = useState<PoolStats>(DEFAULT_POOL);
  const [position, setPosition] = useState<LpPosition>(DEFAULT_POSITION);
  const [oracle, setOracle] = useState<OracleStats | null>(null);
  const [miningPrograms, setMiningPrograms] = useState<LiquidityMiningProgram[]>([]);
  const [miningPosition, setMiningPosition] = useState<LiquidityMiningPosition>(DEFAULT_MINING_POSITION);
  const [isLoading, setIsLoading] = useState(true);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [lastTxHash, setLastTxHash] = useState<string | null>(null);

  const clearError = useCallback(() => setError(null), []);

  const fetchData = useCallback(async () => {
    try {
      const [poolRes, posRes, programsRes, miningPositionRes] = await Promise.allSettled([
        axios.get(`${API_BASE_URL}/api/liquidity/pool-stats`),
        publicKey
          ? axios.get(`${API_BASE_URL}/api/liquidity/position/${publicKey}`)
          : Promise.resolve(null),
        axios.get(`${API_BASE_URL}/api/liquidity/mining/programs`),
        publicKey
          ? axios.get(`${API_BASE_URL}/api/liquidity/mining/position/${publicKey}`)
          : Promise.resolve(null),
      ]);

      if (poolRes.status === 'fulfilled' && poolRes.value) {
        setPool(poolRes.value.data);
        setOracle(poolRes.value.data.oracle ?? null);
      }
      if (posRes.status === 'fulfilled' && posRes.value?.data) {
        setPosition(posRes.value.data);
      }
      if (programsRes.status === 'fulfilled' && programsRes.value?.data) {
        setMiningPrograms(programsRes.value.data.programs || []);
      }
      if (miningPositionRes.status === 'fulfilled' && miningPositionRes.value?.data) {
        setMiningPosition(miningPositionRes.value.data);
      } else if (!publicKey) {
        setMiningPosition(DEFAULT_MINING_POSITION);
      }
    } catch {
      // Keep defaults
    }
    setIsLoading(false);
  }, [publicKey]);

  useEffect(() => {
    fetchData();
    const interval = setInterval(fetchData, 60_000);
    return () => clearInterval(interval);
  }, [fetchData]);

  const submitContractTx = useCallback(
    async (endpoint: string, payload: Record<string, unknown>): Promise<boolean> => {
      if (!isConnected || !publicKey) {
        setError('Please connect your wallet first');
        return false;
      }

      setIsSubmitting(true);
      setError(null);
      setLastTxHash(null);

      try {
        const { data: txData } = await axios.post(
          `${API_BASE_URL}/api/liquidity/${endpoint}`,
          { userAddress: publicKey, ...payload },
          { headers: getAuthHeaders() }
        );

        if (txData.xdr) {
          const signedXdr = await signTransaction(txData.xdr, txData.networkPassphrase);
          const { data: submitData } = await axios.post(
            `${API_BASE_URL}/api/staking/submit`,
            { signedXdr },
            { headers: getAuthHeaders() }
          );
          setLastTxHash(submitData.txHash);
        }

        await fetchData();
        setIsSubmitting(false);
        return true;
      } catch (err: unknown) {
        const message =
          axios.isAxiosError(err) && err.response?.data?.error
            ? err.response.data.error
            : err instanceof Error
              ? err.message
              : 'Transaction failed';
        setError(message);
        setIsSubmitting(false);
        return false;
      }
    },
    [isConnected, publicKey, signTransaction, getAuthHeaders, fetchData]
  );

  const addLiquidity = useCallback(
    (xlmAmount: number, sxlmAmount: number) =>
      submitContractTx('add', { xlmAmount, sxlmAmount }),
    [submitContractTx]
  );

  const removeLiquidity = useCallback(
    (lpAmount: number) => submitContractTx('remove', { lpAmount }),
    [submitContractTx]
  );

  const swapXlmToSxlm = useCallback(
    (amount: number) => submitContractTx('swap-xlm-to-sxlm', { amount }),
    [submitContractTx]
  );

  const swapSxlmToXlm = useCallback(
    (amount: number) => submitContractTx('swap-sxlm-to-xlm', { amount }),
    [submitContractTx]
  );

  return {
    pool,
    position,
    oracle,
    miningPrograms,
    miningPosition,
    isLoading,
    isSubmitting,
    error,
    lastTxHash,
    addLiquidity,
    removeLiquidity,
    swapXlmToSxlm,
    swapSxlmToXlm,
    clearError,
    refresh: fetchData,
  };
}
