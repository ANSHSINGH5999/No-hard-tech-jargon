/**
 * Dashboard — sXLM Protocol landing page
 * Premium DeFi UI · Stellar brand palette
 * No admin content in main panel
 */

import { useState, useRef, useEffect, type CSSProperties } from 'react';
import { Link } from 'react-router-dom';
import { useProtocol } from '../hooks/useProtocol';

/* ── Palette ──────────────────────────────────────────────────────────────── */
const Y   = '#F5CF00';
const YD  = '#D4A800';
const B   = '#000000';
const S   = '#0d0d0d';
const BR  = '#1e1e1e';
const BR2 = '#252525';
const W   = '#ffffff';
const T2  = '#a3a3a3';
const T3  = '#525252';

/* ── Animated counter ─────────────────────────────────────────────────────── */
function useCountUp(target: number, duration = 1800) {
  const [val, setVal] = useState(0);
  const done = useRef(false);
  useEffect(() => {
    if (target === 0 || done.current) return;
    done.current = true;
    const t0 = performance.now();
    const tick = (now: number) => {
      const p = Math.min((now - t0) / duration, 1);
      setVal(target * (1 - Math.pow(1 - p, 4)));
      if (p < 1) requestAnimationFrame(tick);
      else setVal(target);
    };
    requestAnimationFrame(tick);
  }, [target, duration]);
  return val;
}

function fmt(n: number, dec = 2) {
  if (n >= 1e9) return `${(n / 1e9).toFixed(dec)}B`;
  if (n >= 1e6) return `${(n / 1e6).toFixed(dec)}M`;
  if (n >= 1e3) return `${(n / 1e3).toFixed(dec)}K`;
  return n.toFixed(dec);
}

/* ── Stellar SVG mark ─────────────────────────────────────────────────────── */
function StellarMark({ size = 28, color = W }: { size?: number; color?: string }) {
  return (
    <svg width={size} height={size} viewBox="0 0 32 32" fill="none">
      <path
        d="M24.7 10.56l-1.57.78-13.42 6.68a6.4 6.4 0 01-.07-1 6.5 6.5 0 019.65-5.68l1.75-.87.34-.17A8 8 0 008 16a8.1 8.1 0 00.1 1.25L5.3 18.7v1.74l3.43-1.71a8 8 0 0015.12-2.48L26.7 15v-1.74l-2.56 1.27A8.07 8.07 0 0024.2 13l2.5-1.25v-1.73zM16 22.5a6.5 6.5 0 01-6-3.99l13.5-6.72A6.5 6.5 0 0116 22.5z"
        fill={color}
      />
    </svg>
  );
}

/* ── Hero visual ──────────────────────────────────────────────────────────── */
function HeroVisual({ aprVal, tvlVal, erVal }: { aprVal: string; tvlVal: string; erVal: string }) {
  return (
    <div style={{ position: 'relative', display: 'flex', flexDirection: 'column', alignItems: 'center' }}>
      {/* Glow halo */}
      <div style={{
        position: 'absolute', top: '20%', left: '50%',
        transform: 'translateX(-50%)',
        width: 280, height: 280,
        background: `radial-gradient(circle, ${Y}18 0%, transparent 70%)`,
        filter: 'blur(40px)',
        pointerEvents: 'none', zIndex: 0,
      }} />

      {/* Mascot */}
      <img
        src="/mascot.jpeg"
        alt="Stello"
        style={{
          height: 360, width: 'auto', objectFit: 'contain',
          animation: 'stellar-float 4s ease-in-out infinite',
          position: 'relative', zIndex: 1,
          mixBlendMode: 'screen',
        }}
      />

      {/* Live stat card below mascot */}
      <div style={{
        width: '100%',
        background: 'rgba(8,8,8,0.95)',
        backdropFilter: 'blur(20px)',
        border: `1px solid ${BR2}`,
        borderRadius: 14,
        overflow: 'hidden',
        marginTop: 12,
        position: 'relative', zIndex: 2,
      }}>
        {/* Yellow top line */}
        <div style={{ height: 2, background: `linear-gradient(90deg, transparent, ${Y}80, transparent)` }} />
        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(3, 1fr)' }}>
          {[
            { label: 'APR', value: aprVal, accent: true },
            { label: 'Network', value: 'Stellar', accent: false },
            { label: 'Rate', value: erVal, accent: false },
          ].map((s, i) => (
            <div key={s.label} style={{
              padding: '18px 16px', textAlign: 'center',
              borderRight: i < 2 ? `1px solid ${BR}` : 'none',
            }}>
              <p style={{ fontSize: 17, fontWeight: 700, color: s.accent ? Y : W, lineHeight: 1, marginBottom: 5 }}>
                {s.value}
              </p>
              <p style={{ fontSize: 10, color: T3, textTransform: 'uppercase', letterSpacing: '0.1em' }}>
                {s.label}
              </p>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}

/* ── Stat strip cell ──────────────────────────────────────────────────────── */
function StatCell({ label, val, sub, isLast = false }: {
  label: string; val: string; sub?: string; isLast?: boolean;
}) {
  return (
    <div style={{
      flex: 1, padding: '28px 32px',
      borderRight: isLast ? 'none' : `1px solid ${BR}`,
    }}>
      <p style={{ fontSize: 28, fontWeight: 700, color: W, lineHeight: 1, marginBottom: 6 }}>
        {val}
      </p>
      {sub && <p style={{ fontSize: 11, color: T3, fontFamily: 'monospace', marginBottom: 5 }}>{sub}</p>}
      <p style={{ fontSize: 11, color: T3, textTransform: 'uppercase', letterSpacing: '0.1em' }}>
        {label}
      </p>
    </div>
  );
}

/* ── Numbered feature block ───────────────────────────────────────────────── */
function FeatureRow({ num, title, desc, tag, delay = 0, isLast = false }: {
  num: string; title: string; desc: string; tag?: string; delay?: number; isLast?: boolean;
}) {
  return (
    <div
      className="lido-reveal"
      style={{
        animationDelay: `${delay}ms`,
        display: 'grid', gridTemplateColumns: '72px 1fr',
        gap: '0 28px', padding: '36px 0',
        borderBottom: isLast ? 'none' : `1px solid ${BR}`,
        alignItems: 'start',
      }}
    >
      <div style={{
        fontSize: 38, fontWeight: 800, lineHeight: 1,
        color: 'rgba(255,255,255,0.05)',
        letterSpacing: '-2px', paddingTop: 4,
        fontVariantNumeric: 'tabular-nums',
      }}>
        {num}
      </div>
      <div>
        <div style={{ display: 'flex', alignItems: 'center', gap: 10, marginBottom: 8 }}>
          <h3 style={{ fontSize: 15, fontWeight: 600, color: W, letterSpacing: '-0.2px' }}>{title}</h3>
          {tag && (
            <span style={{
              fontSize: 9, color: Y, border: `1px solid ${Y}30`,
              borderRadius: 3, padding: '2px 7px',
              letterSpacing: '0.06em', fontWeight: 600, textTransform: 'uppercase',
            }}>
              {tag}
            </span>
          )}
        </div>
        <p style={{ fontSize: 13, color: T2, lineHeight: 1.8 }}>{desc}</p>
      </div>
    </div>
  );
}

/* ── Product card ─────────────────────────────────────────────────────────── */
function ProductCard({ icon, title, stat, statLabel, desc, href, delay = 0 }: {
  icon: string; title: string; stat?: string; statLabel?: string;
  desc: string; href: string; delay?: number;
}) {
  const [hov, setHov] = useState(false);
  return (
    <Link
      to={href}
      className="lido-reveal"
      onMouseEnter={() => setHov(true)}
      onMouseLeave={() => setHov(false)}
      style={{
        animationDelay: `${delay}ms`,
        display: 'block', textDecoration: 'none',
        background: hov ? '#131313' : S,
        borderTop: `1px solid ${BR}`,
        borderBottom: `1px solid ${BR}`,
        borderRight: `1px solid ${BR}`,
        padding: '28px 22px',
        transition: 'background 0.2s',
        position: 'relative', overflow: 'hidden',
      }}
    >
      {hov && (
        <div style={{
          position: 'absolute', top: 0, left: 0, right: 0, height: 1,
          background: `linear-gradient(90deg, transparent, ${Y}40, transparent)`,
        }} />
      )}
      <div style={{
        width: 42, height: 42, borderRadius: 10, marginBottom: 20,
        background: hov ? `${Y}20` : `${Y}12`,
        border: `1px solid ${hov ? Y + '35' : Y + '20'}`,
        display: 'flex', alignItems: 'center', justifyContent: 'center',
        fontSize: 19, transition: 'all 0.2s',
      }}>
        {icon}
      </div>
      <h4 style={{ fontSize: 14, fontWeight: 600, color: W, marginBottom: 6, letterSpacing: '-0.1px' }}>
        {title}
      </h4>
      {stat && (
        <div style={{ marginBottom: 10 }}>
          <span style={{ fontSize: 22, fontWeight: 700, color: hov ? Y : W, transition: 'color 0.2s' }}>{stat}</span>
          {statLabel && <span style={{ fontSize: 11, color: T3, marginLeft: 5 }}>{statLabel}</span>}
        </div>
      )}
      <p style={{ fontSize: 12, color: T2, lineHeight: 1.75, marginBottom: 20 }}>{desc}</p>
      <div style={{
        display: 'inline-flex', alignItems: 'center', gap: 5,
        fontSize: 11, fontWeight: 500,
        color: hov ? Y : T3,
        transition: 'color 0.2s',
      }}>
        Open <span style={{ fontSize: 13 }}>→</span>
      </div>
    </Link>
  );
}

/* ── Mini stat box ────────────────────────────────────────────────────────── */
function MiniStat({ label, val, sub, isLastCol, isLastRow }: {
  label: string; val: string; sub?: string;
  isLastCol?: boolean; isLastRow?: boolean;
}) {
  const [hov, setHov] = useState(false);
  return (
    <div
      onMouseEnter={() => setHov(true)}
      onMouseLeave={() => setHov(false)}
      style={{
        padding: '24px 22px',
        borderRight: isLastCol ? 'none' : `1px solid ${BR}`,
        borderBottom: isLastRow ? 'none' : `1px solid ${BR}`,
        background: hov ? 'rgba(13,13,13,0.9)' : 'transparent',
        transition: 'background 0.15s',
      }}
    >
      <p style={{ fontSize: 22, fontWeight: 700, color: W, marginBottom: 3, lineHeight: 1 }}>{val}</p>
      {sub && <p style={{ fontSize: 10, color: T3, fontFamily: 'monospace', marginBottom: 6 }}>{sub}</p>}
      <p style={{ fontSize: 10, color: T3, textTransform: 'uppercase', letterSpacing: '0.09em' }}>{label}</p>
    </div>
  );
}

/* ── Dashboard ────────────────────────────────────────────────────────────── */
export default function Dashboard() {
  const { stats, apy, isLoading } = useProtocol();

  const tvlXlm = stats.totalStaked / 1e7;
  const apr    = apy.currentApy > 0 ? apy.currentApy : (apy.apy30d > 0 ? apy.apy30d : 0);
  const er     = stats.exchangeRate;

  const aniApr = useCountUp(apr);
  const aniTvl = useCountUp(tvlXlm);
  const aniEr  = useCountUp(er);

  const aprDisplay = isLoading ? '—' : apr > 0 ? `${aniApr.toFixed(2)}%` : '—';
  const tvlDisplay = isLoading ? '—' : `${fmt(aniTvl, 0)} XLM`;
  const erDisplay  = isLoading ? '—' : aniEr.toFixed(4);

  const wrap  = (maxW = 1100): CSSProperties => ({ maxWidth: maxW, margin: '0 auto', padding: '0 24px' });
  const sp    = (py = 80): CSSProperties => ({ padding: `${py}px 0` });
  const bdr: CSSProperties = { borderTop: `1px solid ${BR}` };
  const yl: CSSProperties  = {
    fontSize: 11, textTransform: 'uppercase' as const,
    letterSpacing: '0.13em', color: Y, marginBottom: 14, fontWeight: 600,
  };
  const sh: CSSProperties  = {
    fontSize: 'clamp(1.75rem,3.2vw,2.5rem)', fontWeight: 700,
    color: W, lineHeight: 1.12, letterSpacing: '-0.4px',
  };

  return (
    <div style={{ background: 'transparent', color: W, minHeight: '100vh' }}>

      {/* ══ HERO ══════════════════════════════════════════════════════════ */}
      <section style={{ ...sp(80), borderBottom: `1px solid ${BR}` }}>
        <div style={wrap()}>
          <div className="lido-hero-grid">

            {/* Left */}
            <div>
              {/* Badge */}
              <div className="lido-fade" style={{
                display: 'inline-flex', alignItems: 'center', gap: 8,
                padding: '5px 14px', borderRadius: 6,
                border: `1px solid ${BR2}`,
                background: 'rgba(13,13,13,0.8)',
                fontSize: 11, color: T2, marginBottom: 32,
                letterSpacing: '0.03em',
              }}>
                <StellarMark size={13} color={Y} />
                Stellar · Soroban Smart Contracts
                <span style={{
                  background: '#181818', border: `1px solid ${BR2}`,
                  borderRadius: 3, padding: '1px 7px',
                  fontSize: 10, color: T3,
                }}>Testnet</span>
              </div>

              <h1
                className="lido-reveal"
                style={{
                  fontSize: 'clamp(2.8rem,5.5vw,4.6rem)',
                  fontWeight: 700, lineHeight: 1.05,
                  color: W, marginBottom: 22,
                  animationDelay: '50ms', letterSpacing: '-1.5px',
                }}
              >
                Liquid Staking<br />
                <span style={{
                  color: Y,
                  textShadow: `0 0 40px ${Y}50`,
                }}>for Stellar</span>
              </h1>

              <p
                className="lido-reveal"
                style={{
                  fontSize: 16, color: T2, lineHeight: 1.8,
                  marginBottom: 40, maxWidth: 460,
                  animationDelay: '120ms',
                }}
              >
                Stake XLM · receive <strong style={{ color: W, fontWeight: 600 }}>sXLM</strong> — a
                yield-bearing token that appreciates automatically as validator rewards accrue.
              </p>

              <div className="lido-reveal" style={{ display: 'flex', gap: 12, flexWrap: 'wrap', animationDelay: '190ms' }}>
                <Link
                  to="/stake"
                  style={{
                    background: Y, color: B,
                    padding: '13px 30px', borderRadius: 7,
                    fontSize: 14, fontWeight: 700, textDecoration: 'none',
                    display: 'inline-block', letterSpacing: '0.01em',
                    boxShadow: `0 0 0 0 ${Y}00`,
                    transition: 'background 0.15s, transform 0.15s, box-shadow 0.2s',
                  }}
                  onMouseEnter={(e) => {
                    e.currentTarget.style.background = YD;
                    e.currentTarget.style.transform = 'translateY(-2px)';
                    e.currentTarget.style.boxShadow = `0 8px 24px ${Y}30`;
                  }}
                  onMouseLeave={(e) => {
                    e.currentTarget.style.background = Y;
                    e.currentTarget.style.transform = 'none';
                    e.currentTarget.style.boxShadow = 'none';
                  }}
                >
                  Stake XLM
                </Link>
                <Link
                  to="/withdraw"
                  style={{
                    background: 'transparent', color: T2,
                    padding: '13px 30px', borderRadius: 7,
                    border: `1px solid ${BR2}`,
                    fontSize: 14, fontWeight: 500, textDecoration: 'none',
                    display: 'inline-block',
                    transition: 'border-color 0.15s, color 0.15s',
                  }}
                  onMouseEnter={(e) => {
                    e.currentTarget.style.borderColor = '#444';
                    e.currentTarget.style.color = W;
                  }}
                  onMouseLeave={(e) => {
                    e.currentTarget.style.borderColor = BR2;
                    e.currentTarget.style.color = T2;
                  }}
                >
                  Withdraw
                </Link>
              </div>

              {/* Trust signals */}
              <div
                className="lido-reveal"
                style={{
                  display: 'flex', alignItems: 'center', gap: 20,
                  marginTop: 44, animationDelay: '260ms',
                }}
              >
                {[
                  { label: 'Non-custodial' },
                  { label: 'Permissionless' },
                  { label: 'Open source' },
                ].map((t, i) => (
                  <div key={t.label} style={{ display: 'flex', alignItems: 'center', gap: 6 }}>
                    {i > 0 && <div style={{ width: 1, height: 12, background: BR2, marginRight: 14 }} />}
                    <span style={{
                      width: 5, height: 5, borderRadius: '50%',
                      background: Y, flexShrink: 0,
                      boxShadow: `0 0 6px ${Y}80`,
                    }} />
                    <span style={{ fontSize: 12, color: T3 }}>{t.label}</span>
                  </div>
                ))}
              </div>
            </div>

            {/* Right — live stats visual */}
            <div className="lido-fade" style={{ animationDelay: '240ms' }}>
              <HeroVisual aprVal={aprDisplay} tvlVal={tvlDisplay} erVal={erDisplay} />
            </div>
          </div>
        </div>
      </section>

      {/* ══ STATS STRIP ═══════════════════════════════════════════════════ */}
      <section style={{ background: 'rgba(8,8,8,0.9)', borderBottom: `1px solid ${BR}` }}>
        <div style={{ ...wrap(), padding: '0 24px' }}>
          <div className="lido-stat-strip">
            <StatCell label="Total XLM Staked" val={tvlDisplay}
              sub={stats.tvlUsd > 0 ? `≈ $${fmt(stats.tvlUsd)}` : undefined} />
            <StatCell label="Current APR" val={aprDisplay}
              sub={apy.apy30d > 0 ? `30d avg: ${apy.apy30d.toFixed(2)}%` : undefined} />
            <StatCell label="Exchange Rate" val={erDisplay} sub="1 sXLM → XLM" isLast />
          </div>
        </div>
      </section>

      {/* ══ WHAT IS sXLM ══════════════════════════════════════════════════ */}
      <section style={{ ...sp(), ...bdr }}>
        <div style={wrap()}>
          <div className="lido-two-col">

            {/* Left */}
            <div className="lido-reveal">
              <p style={yl}>The Protocol</p>
              <h2 style={{ ...sh, marginBottom: 20 }}>
                Native XLM<br />
                <span style={{ color: Y }}>Liquid Restaking</span>
              </h2>
              <div style={{ width: 36, height: 2, background: `linear-gradient(90deg, ${Y}, ${Y}00)`, marginBottom: 22 }} />
              <p style={{ fontSize: 14, color: T2, lineHeight: 1.85, marginBottom: 16 }}>
                Deposit XLM into the Staking Pool Contract on Soroban. Receive{' '}
                <strong style={{ color: W }}>sXLM</strong> — a yield-bearing token that
                automatically appreciates as validator rewards accrue.
              </p>
              <p style={{ fontSize: 14, color: T2, lineHeight: 1.85 }}>
                No lockups. No manual reward claims. The exchange rate rises every epoch —
                your sXLM is worth more XLM over time.
              </p>
            </div>

            {/* Right — formula */}
            <div
              className="lido-reveal"
              style={{
                animationDelay: '100ms',
                background: 'rgba(10,10,10,0.9)',
                border: `1px solid ${BR2}`,
                borderRadius: 12, padding: 28,
                position: 'relative', overflow: 'hidden',
              }}
            >
              <div style={{
                position: 'absolute', top: 0, left: 0, right: 0, height: 1,
                background: `linear-gradient(90deg, transparent, ${Y}30, transparent)`,
              }} />
              <p style={{ fontSize: 10, color: T3, textTransform: 'uppercase', letterSpacing: '0.13em', marginBottom: 20 }}>
                Exchange Rate Model
              </p>
              <div style={{ fontFamily: 'monospace', fontSize: 12 }}>
                <div style={{
                  display: 'grid', gridTemplateColumns: 'auto 1fr',
                  gap: '8px 20px', marginBottom: 20, color: T2,
                }}>
                  <span style={{ color: T3 }}>T_xlm</span>  <span>Total XLM staked</span>
                  <span style={{ color: T3 }}>T_sxlm</span> <span>Total sXLM supply</span>
                </div>
                <div style={{ borderTop: `1px solid ${BR}`, paddingTop: 18, marginBottom: 18 }}>
                  <p style={{ fontSize: 19, fontWeight: 700, color: W, marginBottom: 6 }}>
                    ER = T_xlm / T_sxlm
                  </p>
                  <p style={{ color: T3, fontSize: 11 }}>Rewards ↑ T_xlm · Supply fixed → ER rises</p>
                </div>
                <div style={{ borderTop: `1px solid ${BR}`, paddingTop: 18, marginBottom: er > 1 ? 18 : 0 }}>
                  <p style={{ color: T2, marginBottom: 4 }}>APY = (ER₁/ER₀)^(1/Δt) − 1</p>
                  <p style={{ color: T3, fontSize: 11 }}>Compound growth, epoch-based</p>
                </div>
                {er > 1 && (
                  <div style={{ borderTop: `1px solid ${BR}`, paddingTop: 18 }}>
                    <p style={{ color: T3, fontSize: 11, marginBottom: 6 }}>Live exchange rate</p>
                    <p style={{ fontSize: 24, fontWeight: 700, color: Y, textShadow: `0 0 20px ${Y}40` }}>
                      {er.toFixed(7)}
                    </p>
                  </div>
                )}
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* ══ PROTOCOL FEATURES ═════════════════════════════════════════════ */}
      <section style={{ ...sp(), background: 'rgba(8,8,8,0.85)', ...bdr, borderBottom: `1px solid ${BR}` }}>
        <div style={wrap()}>
          <p style={yl}>5 Milestones · Fully built</p>
          <h2 style={{ ...sh, marginBottom: 44 }}>Protocol Features</h2>

          <div style={{ borderTop: `1px solid ${BR}` }}>
            {([
              { n: '01', title: 'Liquid Staking MVP',   desc: 'Deposit XLM → mint sXLM. The exchange rate automatically rises as validator rewards accrue. No manual claiming. sXLM = XLM / ER on mint, XLM = sXLM × ER on burn.', tag: 'M1' },
              { n: '02', title: 'Exchange Rate Engine',  desc: 'APR/APY derived purely from on-chain exchange rate history. No hardcoded yields — what you see is what the protocol actually earns from lending interest.', tag: 'M2' },
              { n: '03', title: 'Withdrawal Queue',     desc: 'Instant redemption via the liquidity buffer (D × α safety factor). Delayed queue with ~24h cooldown. Slashing-aware accounting throughout the entire withdrawal flow.', tag: 'M3' },
              { n: '04', title: 'Risk Engine',          desc: 'Slashing impact model: T_xlm,new = T_xlm,old × (1 − s). Emergency pause logic for protocol safety. Withdrawal queue recalculation after slashing events.', tag: 'M4' },
              { n: '05', title: 'Capital Efficiency',   desc: 'Use sXLM as collateral in the lending protocol. AMM liquidity pool (sXLM/XLM). Leverage loop up to 3.33× with Net Yield = (L×r) − ((L−1)×b). Governance DAO.', tag: 'M5' },
            ] as const).map((f, i, arr) => (
              <FeatureRow
                key={i} num={f.n} title={f.title} desc={f.desc} tag={f.tag}
                delay={i * 50} isLast={i === arr.length - 1}
              />
            ))}
          </div>
        </div>
      </section>

      {/* ══ DeFi ECOSYSTEM ════════════════════════════════════════════════ */}
      <section style={{ ...sp(), ...bdr }}>
        <div style={wrap()}>
          <div style={{
            display: 'flex', justifyContent: 'space-between',
            alignItems: 'flex-end', marginBottom: 36,
            flexWrap: 'wrap', gap: 16,
          }}>
            <div>
              <p style={yl}>Full DeFi Composability</p>
              <h2 style={sh}>
                sXLM is a<br />
                <span style={{ color: Y }}>base yield asset</span>
              </h2>
            </div>
            <p style={{ fontSize: 13, color: T2, maxWidth: 300, lineHeight: 1.75 }}>
              Use sXLM across the protocol ecosystem.
              Every product amplifies your staking yield.
            </p>
          </div>

          {/* Product cards */}
          <div style={{ border: `1px solid ${BR}`, borderRadius: 10, overflow: 'hidden' }}>
            <div className="lido-four-cards" style={{ background: BR }}>
              <ProductCard icon="🏦" title="Lending"    href="/lending"    stat="70%"   statLabel="max LTV"   desc="Deposit sXLM as collateral. Borrow XLM at 70% LTV. Health factor monitored on-chain." delay={0} />
              <ProductCard icon="💧" title="Liquidity"  href="/liquidity"  stat="0.3%"  statLabel="swap fee"  desc="Provide sXLM/XLM liquidity to the AMM pool. Earn swap fees on top of staking yield." delay={60} />
              <ProductCard icon="⚡" title="Leverage"   href="/leverage"   stat="3.33×" statLabel="max"       desc="Stake → collateral → borrow → restake. Up to 3.33× with live net yield calculator." delay={120} />
              <ProductCard icon="🗳" title="Governance" href="/governance"             desc="Vote on protocol parameters using sXLM balance. Create and execute on-chain proposals." delay={180} />
            </div>

            {/* Minting example */}
            <div style={{
              display: 'grid', gridTemplateColumns: 'repeat(4, 1fr)',
              borderTop: `1px solid ${BR}`, background: 'rgba(8,8,8,0.7)',
            }}>
              {[
                { label: 'You deposit',   val: '120 XLM' },
                { label: 'Exchange rate', val: '1.2000' },
                { label: 'sXLM received', val: '100 sXLM' },
                { label: 'After 1 year',  val: '100 sXLM + yield' },
              ].map((item, i) => (
                <div key={i} style={{
                  padding: '18px 20px', textAlign: 'center',
                  borderRight: i < 3 ? `1px solid ${BR}` : 'none',
                }}>
                  <p style={{ fontSize: 10, color: T3, textTransform: 'uppercase', letterSpacing: '0.1em', marginBottom: 7 }}>
                    {item.label}
                  </p>
                  <p style={{ fontSize: 14, fontWeight: 600, color: W }}>{item.val}</p>
                </div>
              ))}
            </div>
          </div>
        </div>
      </section>

      {/* ══ LIVE STATS ════════════════════════════════════════════════════ */}
      <section style={{ ...sp(), ...bdr }}>
        <div style={wrap()}>
          <p style={yl}>On-chain · Real-time</p>
          <h2 style={{ ...sh, marginBottom: 36 }}>Protocol Statistics</h2>

          <div style={{ border: `1px solid ${BR}`, borderRadius: 10, overflow: 'hidden' }}>
            <div style={{ display: 'grid', gridTemplateColumns: 'repeat(4, 1fr)' }}>
              {([
                { label: 'Total XLM Staked', val: isLoading ? '—' : `${fmt(tvlXlm)} XLM`, sub: stats.tvlUsd > 0 ? `$${fmt(stats.tvlUsd)}` : undefined },
                { label: 'Current APR',       val: isLoading ? '—' : apr > 0 ? `${apr.toFixed(2)}%` : '—', sub: apy.apy30d > 0 ? `30d: ${apy.apy30d.toFixed(2)}%` : undefined },
                { label: 'Exchange Rate',     val: isLoading ? '—' : er.toFixed(4), sub: '1 sXLM = ER × XLM' },
                { label: 'Protocol Fee',      val: `${stats.protocolFeePct}%`, sub: 'on rewards' },
                { label: 'Stakers',           val: isLoading ? '—' : stats.totalStakers > 0 ? fmt(stats.totalStakers, 0) : '—', sub: 'unique wallets' },
                { label: 'Withdrawal',        val: '~24h', sub: 'delayed queue' },
                { label: 'Treasury',          val: isLoading ? '—' : `${fmt(stats.treasuryBalance / 1e7)} XLM`, sub: 'collected fees' },
              ] as const).map((s, i) => (
                <MiniStat
                  key={s.label}
                  label={s.label} val={s.val} sub={s.sub}
                  isLastCol={(i + 1) % 4 === 0}
                  isLastRow={i >= 4}
                />
              ))}
            </div>
          </div>
        </div>
      </section>

      {/* ══ CTA ═══════════════════════════════════════════════════════════ */}
      <section style={{ ...sp(100), background: 'rgba(8,8,8,0.9)', ...bdr, borderBottom: `1px solid ${BR}` }}>
        <div style={{ ...wrap(600), textAlign: 'center' }}>
          <div style={{ display: 'flex', justifyContent: 'center', marginBottom: 28 }}>
            <div style={{
              width: 60, height: 60, borderRadius: '50%',
              background: `${Y}12`, border: `1px solid ${Y}25`,
              display: 'flex', alignItems: 'center', justifyContent: 'center',
              boxShadow: `0 0 32px ${Y}15`,
            }}>
              <StellarMark size={30} color={Y} />
            </div>
          </div>
          <h2 style={{ ...sh, fontSize: 'clamp(1.9rem,4vw,3.1rem)', marginBottom: 18 }}>
            Start earning on<br />
            <span style={{ color: Y, textShadow: `0 0 40px ${Y}40` }}>your XLM today</span>
          </h2>
          <p style={{ fontSize: 15, color: T2, marginBottom: 44, lineHeight: 1.8 }}>
            Join the Native XLM Liquid Restaking Protocol.<br />
            Non-custodial. Permissionless. Built on Stellar.
          </p>
          <div style={{ display: 'flex', justifyContent: 'center', gap: 12, flexWrap: 'wrap' }}>
            <Link
              to="/stake"
              style={{
                background: Y, color: B,
                padding: '14px 40px', borderRadius: 7,
                fontSize: 15, fontWeight: 700, textDecoration: 'none',
                transition: 'background 0.15s, box-shadow 0.2s, transform 0.15s',
              }}
              onMouseEnter={(e) => {
                e.currentTarget.style.background = YD;
                e.currentTarget.style.boxShadow = `0 8px 28px ${Y}35`;
                e.currentTarget.style.transform = 'translateY(-2px)';
              }}
              onMouseLeave={(e) => {
                e.currentTarget.style.background = Y;
                e.currentTarget.style.boxShadow = 'none';
                e.currentTarget.style.transform = 'none';
              }}
            >
              Stake XLM
            </Link>
            <Link
              to="/analytics"
              style={{
                background: 'transparent', color: T2,
                padding: '14px 40px', borderRadius: 7,
                border: `1px solid ${BR2}`,
                fontSize: 15, fontWeight: 500, textDecoration: 'none',
                transition: 'border-color 0.15s, color 0.15s',
              }}
              onMouseEnter={(e) => {
                e.currentTarget.style.borderColor = '#444';
                e.currentTarget.style.color = W;
              }}
              onMouseLeave={(e) => {
                e.currentTarget.style.borderColor = BR2;
                e.currentTarget.style.color = T2;
              }}
            >
              View Analytics
            </Link>
          </div>
        </div>
      </section>

      {/* ══ FOOTER ════════════════════════════════════════════════════════ */}
      <footer style={{ borderTop: `1px solid ${BR}`, padding: '52px 0 40px', background: 'rgba(0,0,0,0.95)' }}>
        <div style={wrap()}>
          <div style={{ display: 'grid', gridTemplateColumns: '2fr 1fr 1fr 1fr', gap: 48, marginBottom: 44 }}>
            <div>
              <div style={{ display: 'flex', alignItems: 'center', gap: 9, marginBottom: 16 }}>
                <StellarMark size={22} color={Y} />
                <span style={{ fontWeight: 700, fontSize: 14, color: W, letterSpacing: '0.02em' }}>sXLM Protocol</span>
              </div>
              <p style={{ fontSize: 12, color: T3, lineHeight: 1.8, maxWidth: 220 }}>
                Native XLM Liquid Restaking<br />on Stellar · Soroban Smart Contracts
              </p>
            </div>
            {[
              { heading: 'Protocol',   links: [['Stake', '/stake'], ['Withdraw', '/withdraw'], ['Analytics', '/analytics']] as [string, string][] },
              { heading: 'DeFi',       links: [['Lending', '/lending'], ['Liquidity', '/liquidity'], ['Leverage', '/leverage'], ['Restaking', '/restaking']] as [string, string][] },
              { heading: 'Governance', links: [['Governance', '/governance']] as [string, string][] },
            ].map((col) => (
              <div key={col.heading}>
                <p style={{ fontSize: 10, color: T3, textTransform: 'uppercase', letterSpacing: '0.14em', marginBottom: 18, fontWeight: 600 }}>
                  {col.heading}
                </p>
                {col.links.map(([label, href]) => (
                  <Link
                    key={href} to={href}
                    style={{
                      display: 'block', fontSize: 13, color: T3,
                      marginBottom: 11, textDecoration: 'none',
                      transition: 'color 0.15s',
                    }}
                    onMouseEnter={(e) => (e.currentTarget.style.color = W)}
                    onMouseLeave={(e) => (e.currentTarget.style.color = T3)}
                  >
                    {label}
                  </Link>
                ))}
              </div>
            ))}
          </div>

          <div style={{
            borderTop: `1px solid ${BR}`, paddingTop: 28,
            display: 'flex', justifyContent: 'space-between',
            alignItems: 'center', flexWrap: 'wrap', gap: 12,
          }}>
            <p style={{ fontSize: 12, color: T3 }}>
              © 2025 sXLM Protocol · Native XLM Liquid Restaking
            </p>
            <span style={{
              fontSize: 10, border: `1px solid ${BR2}`, color: T3,
              padding: '3px 12px', borderRadius: 4, letterSpacing: '0.05em',
            }}>
              Stellar Testnet
            </span>
          </div>
        </div>
      </footer>
    </div>
  );
}
