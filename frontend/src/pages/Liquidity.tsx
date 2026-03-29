import { useState } from 'react';
import { Droplets, ArrowLeftRight, TrendingUp } from 'lucide-react';
import { useWallet } from '../hooks/useWallet';
import { useLiquidity } from '../hooks/useLiquidity';
import { formatXLM } from '../utils/stellar';

export default function Liquidity() {
  const { isConnected, connect } = useWallet();
  const {
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
  } = useLiquidity();

  const [activeTab, setActiveTab] = useState<'add' | 'remove' | 'swap'>('add');
  const [xlmAmount, setXlmAmount] = useState('');
  const [sxlmAmount, setSxlmAmount] = useState('');
  const [swapDirection, setSwapDirection] = useState<'xlm-to-sxlm' | 'sxlm-to-xlm'>('xlm-to-sxlm');

  const handleSubmit = async () => {
    clearError();
    let success = false;

    if (activeTab === 'add') {
      const xlm = parseFloat(xlmAmount);
      const sxlm = parseFloat(sxlmAmount);
      if (!xlm || !sxlm || xlm <= 0 || sxlm <= 0) return;
      success = await addLiquidity(xlm, sxlm);
    } else if (activeTab === 'remove') {
      const lp = parseFloat(xlmAmount);
      if (!lp || lp <= 0) return;
      success = await removeLiquidity(lp);
    } else {
      const amt = parseFloat(xlmAmount);
      if (!amt || amt <= 0) return;
      if (swapDirection === 'xlm-to-sxlm') {
        success = await swapXlmToSxlm(amt);
      } else {
        success = await swapSxlmToXlm(amt);
      }
    }

    if (success) {
      setXlmAmount('');
      setSxlmAmount('');
    }
  };

  // Estimate swap output using constant product formula
  const estimateSwapOutput = (inputAmount: number, inputIsXlm: boolean): number => {
    if (!inputAmount || pool.reserveXlm <= 0 || pool.reserveSxlm <= 0) return 0;
    const fee = 1 - pool.feeBps / 10000;
    const amountAfterFee = inputAmount * fee;

    if (inputIsXlm) {
      return pool.reserveSxlm - (pool.reserveXlm * pool.reserveSxlm) / (pool.reserveXlm + amountAfterFee);
    } else {
      return pool.reserveXlm - (pool.reserveXlm * pool.reserveSxlm) / (pool.reserveSxlm + amountAfterFee);
    }
  };

  return (
    <div className="max-w-4xl mx-auto px-4 space-y-6">
      <div className="text-center">
        <h1 className="text-3xl font-bold text-white mb-2">Liquidity Pool</h1>
        <p className="text-gray-400">Provide sXLM/XLM liquidity and earn swap fees</p>
      </div>

      {/* Pool Stats */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
        {[
          { label: 'XLM Reserve', value: formatXLM(pool.reserveXlm) },
          { label: 'sXLM Reserve', value: formatXLM(pool.reserveSxlm) },
          { label: 'Spot Price', value: pool.price.toFixed(4) + ' XLM' },
          { label: 'Swap Fee', value: (pool.feeBps / 100).toFixed(1) + '%' },
        ].map((stat) => (
          <div key={stat.label} className="glass rounded-xl p-4 text-center">
            <p className="text-xs text-gray-400">{stat.label}</p>
            <p className="text-lg font-bold text-white mt-1">{isLoading ? '...' : stat.value}</p>
          </div>
        ))}
      </div>

      <div className="grid md:grid-cols-3 gap-4">
        <div className="glass rounded-xl p-4">
          <p className="text-xs text-gray-400">15m TWAP Oracle</p>
          <p className="text-lg font-bold text-white mt-1">
            {isLoading || !oracle ? '...' : `${oracle.twapPrice.toFixed(4)} XLM`}
          </p>
          <p className="text-xs text-gray-500 mt-2">
            {oracle ? `${(oracle.deviationBps / 100).toFixed(2)}% deviation from spot` : 'Waiting for oracle samples'}
          </p>
        </div>
        <div className="glass rounded-xl p-4">
          <p className="text-xs text-gray-400">Oracle Confidence</p>
          <p className="text-lg font-bold text-white mt-1 capitalize">
            {isLoading || !oracle ? '...' : oracle.confidence}
          </p>
          <p className="text-xs text-gray-500 mt-2">
            {oracle ? `${oracle.sampleCount} observations in window` : 'No window yet'}
          </p>
        </div>
        <div className="glass rounded-xl p-4">
          <p className="text-xs text-gray-400">Active Farming Programs</p>
          <p className="text-lg font-bold text-white mt-1">
            {isLoading ? '...' : miningPrograms.filter((program) => program.status === 'active').length}
          </p>
          <p className="text-xs text-gray-500 mt-2">Governance-funded rewards for partner DEX routing</p>
        </div>
      </div>

      <div className="grid md:grid-cols-2 gap-6">
        {/* User Position */}
        <div className="glass rounded-2xl p-6 space-y-4">
          <div className="flex items-center gap-2">
            <Droplets className="w-5 h-5 text-yellow-400" />
            <h3 className="text-sm font-semibold text-white">Your LP Position</h3>
          </div>
          <div className="space-y-3">
            <div className="flex justify-between text-sm">
              <span className="text-gray-400">LP Tokens</span>
              <span className="text-white">{formatXLM(position.lpTokens)}</span>
            </div>
            <div className="flex justify-between text-sm">
              <span className="text-gray-400">Pool Share</span>
              <span className="text-white">{position.sharePercent.toFixed(2)}%</span>
            </div>
            <div className="flex justify-between text-sm">
              <span className="text-gray-400">XLM Share</span>
              <span className="text-white">{formatXLM(position.xlmShare)} XLM</span>
            </div>
            <div className="flex justify-between text-sm">
              <span className="text-gray-400">sXLM Share</span>
              <span className="text-white">{formatXLM(position.sxlmShare)} sXLM</span>
            </div>
          </div>
        </div>

        {/* Action Card */}
        <div className="glass rounded-2xl p-6 space-y-4">
          <div className="flex gap-1 bg-white/5 rounded-lg p-1">
            {(['add', 'remove', 'swap'] as const).map((tab) => (
              <button
                key={tab}
                onClick={() => { setActiveTab(tab); setXlmAmount(''); setSxlmAmount(''); clearError(); }}
                className={`flex-1 py-2 rounded-md text-sm font-medium transition-all ${
                  activeTab === tab
                    ? 'bg-yellow-400/10 text-white border border-yellow-400/20'
                    : 'text-gray-400 hover:text-white'
                }`}
              >
                {tab === 'add' ? 'Add' : tab === 'remove' ? 'Remove' : 'Swap'}
              </button>
            ))}
          </div>

          {activeTab === 'swap' ? (
            <div className="space-y-3">
              <div className="flex justify-end">
                <button
                  onClick={() => setSwapDirection(d => d === 'xlm-to-sxlm' ? 'sxlm-to-xlm' : 'xlm-to-sxlm')}
                  className="text-xs text-yellow-400 hover:text-yellow-300 transition-colors"
                >
                  Switch direction
                </button>
              </div>
              <div>
                <label className="text-xs text-gray-400 mb-1 block">
                  You Pay ({swapDirection === 'xlm-to-sxlm' ? 'XLM' : 'sXLM'})
                </label>
                <input
                  type="number"
                  value={xlmAmount}
                  onChange={(e) => setXlmAmount(e.target.value)}
                  placeholder="0.00"
                  className="w-full bg-white/5 border border-white/10 rounded-xl px-4 py-3 text-white placeholder-gray-500 focus:outline-none focus:border-primary-500/50"
                />
              </div>
              <div className="flex justify-center">
                <ArrowLeftRight className="w-5 h-5 text-gray-500" />
              </div>
              <div>
                <label className="text-xs text-gray-400 mb-1 block">
                  You Receive ({swapDirection === 'xlm-to-sxlm' ? 'sXLM' : 'XLM'})
                </label>
                <input
                  type="number"
                  value={xlmAmount ? estimateSwapOutput(
                    parseFloat(xlmAmount),
                    swapDirection === 'xlm-to-sxlm'
                  ).toFixed(4) : ''}
                  disabled
                  className="w-full bg-white/5 border border-white/10 rounded-xl px-4 py-3 text-gray-400"
                />
              </div>
            </div>
          ) : activeTab === 'add' ? (
            <div className="space-y-3">
              <div>
                <label className="text-xs text-gray-400 mb-1 block">XLM Amount</label>
                <input
                  type="number"
                  value={xlmAmount}
                  onChange={(e) => {
                    setXlmAmount(e.target.value);
                    if (e.target.value && pool.price > 0) {
                      setSxlmAmount((parseFloat(e.target.value) / pool.price).toFixed(4));
                    } else {
                      setSxlmAmount('');
                    }
                  }}
                  placeholder="0.00"
                  className="w-full bg-white/5 border border-white/10 rounded-xl px-4 py-3 text-white placeholder-gray-500 focus:outline-none focus:border-primary-500/50"
                />
              </div>
              <div>
                <label className="text-xs text-gray-400 mb-1 block">sXLM Amount</label>
                <input
                  type="number"
                  value={sxlmAmount}
                  onChange={(e) => {
                    setSxlmAmount(e.target.value);
                    if (e.target.value && pool.price > 0) {
                      setXlmAmount((parseFloat(e.target.value) * pool.price).toFixed(4));
                    } else {
                      setXlmAmount('');
                    }
                  }}
                  placeholder="0.00"
                  className="w-full bg-white/5 border border-white/10 rounded-xl px-4 py-3 text-white placeholder-gray-500 focus:outline-none focus:border-primary-500/50"
                />
              </div>
            </div>
          ) : (
            <div>
              <label className="text-xs text-gray-400 mb-1 block">LP Tokens to Remove</label>
              <input
                type="number"
                value={xlmAmount}
                onChange={(e) => setXlmAmount(e.target.value)}
                placeholder="0.00"
                max={position.lpTokens}
                className="w-full bg-white/5 border border-white/10 rounded-xl px-4 py-3 text-white placeholder-gray-500 focus:outline-none focus:border-primary-500/50"
              />
              {position.lpTokens > 0 && (
                <p className="text-xs text-gray-500 mt-1">Available: {formatXLM(position.lpTokens)} LP</p>
              )}
            </div>
          )}

          {error && (
            <div className="bg-red-500/10 border border-red-500/20 rounded-lg p-3">
              <p className="text-xs text-red-400">{error}</p>
            </div>
          )}

          {lastTxHash && (
            <div className="bg-green-500/10 border border-green-500/20 rounded-lg p-3">
              <p className="text-xs text-green-400">Transaction successful!</p>
            </div>
          )}

          {isConnected ? (
            <button
              onClick={handleSubmit}
              disabled={isSubmitting || !xlmAmount || parseFloat(xlmAmount) <= 0}
              className="w-full py-3 rounded-xl bg-gradient-to-r from-primary-500 to-accent-500 text-white font-semibold hover:opacity-90 transition-opacity disabled:opacity-40"
            >
              {isSubmitting ? 'Processing...' :
               activeTab === 'add' ? 'Add Liquidity' :
               activeTab === 'remove' ? 'Remove Liquidity' : 'Swap'}
            </button>
          ) : (
            <button
              onClick={connect}
              className="w-full py-3 rounded-xl bg-gradient-to-r from-primary-500 to-accent-500 text-white font-semibold"
            >
              Connect Wallet
            </button>
          )}
        </div>
      </div>

      {/* AMM Info */}
      <div className="glass rounded-2xl p-6 space-y-4">
        <div className="flex items-center gap-2">
          <TrendingUp className="w-5 h-5 text-yellow-400" />
          <h3 className="text-sm font-semibold text-white">About the Pool</h3>
        </div>
        <div className="space-y-2 text-sm text-gray-400">
          <p>This is a constant-product (x*y=k) AMM for sXLM/XLM liquidity.</p>
          <p>Liquidity providers earn {(pool.feeBps / 100).toFixed(1)}% on every swap proportional to their pool share.</p>
          <p>LP tokens represent your share of the pool and can be redeemed at any time.</p>
          <p>The DEX API exports a 15-minute TWAP oracle so external venues can list the pair with a smoother reference price.</p>
        </div>
      </div>

      <div className="grid md:grid-cols-2 gap-6">
        <div className="glass rounded-2xl p-6 space-y-4">
          <h3 className="text-sm font-semibold text-white">Liquidity Mining Programs</h3>
          {miningPrograms.length === 0 ? (
            <p className="text-sm text-gray-400">No governance-funded programs configured yet.</p>
          ) : (
            <div className="space-y-3">
              {miningPrograms.slice(0, 3).map((program) => (
                <div key={program.programId} className="rounded-xl bg-white/5 p-4">
                  <div className="flex items-center justify-between gap-3">
                    <p className="text-sm font-medium text-white">{program.title}</p>
                    <span className="rounded-full border border-yellow-400/20 bg-yellow-400/10 px-2 py-1 text-xs text-yellow-300 capitalize">
                      {program.status}
                    </span>
                  </div>
                  <p className="text-xs text-gray-400 mt-2">
                    {program.rewardPerDay.toFixed(2)} {program.rewardAsset} per day
                  </p>
                </div>
              ))}
            </div>
          )}
        </div>

        <div className="glass rounded-2xl p-6 space-y-4">
          <h3 className="text-sm font-semibold text-white">Your Farming Estimate</h3>
          {miningPosition.eligiblePrograms.length === 0 ? (
            <p className="text-sm text-gray-400">No active reward stream applies to your current LP balance.</p>
          ) : (
            <div className="space-y-3">
              {miningPosition.eligiblePrograms.map((program) => (
                <div key={program.programId} className="rounded-xl bg-white/5 p-4">
                  <p className="text-sm font-medium text-white">{program.title}</p>
                  <p className="text-xs text-gray-400 mt-2">
                    Estimated rewards: {program.estimatedDailyRewards.toFixed(4)} {program.rewardAsset} / day
                  </p>
                  <p className="text-xs text-gray-500 mt-1">Pool share used: {program.sharePercent.toFixed(2)}%</p>
                </div>
              ))}
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
