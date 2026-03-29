export const STROOPS_PER_XLM = 10_000_000;
export const DEFAULT_SWAP_FEE_BPS = 30;
export const PRICE_PRECISION = 1_000_000_000_000_000_000n;

export type TokenSymbol = "XLM" | "sXLM";

export interface PoolState {
  reserveXlm: number;
  reserveSxlm: number;
  feeBps?: number;
}

export interface OracleState {
  priceCumulativeXlm: bigint;
  priceCumulativeSxlm: bigint;
  timestampLast: number;
}

export interface QuoteRequest {
  tokenIn: TokenSymbol;
  amount: number;
  slippageBps?: number;
}

export interface QuoteResponse {
  tokenIn: TokenSymbol;
  tokenOut: TokenSymbol;
  amountIn: number;
  amountOut: number;
  minimumAmountOut: number;
  executionPrice: number;
  spotPrice: number;
  priceImpactBps: number;
  route: "sxlm-xlm-direct";
}

export interface TwapResponse {
  twapXlmPerSxlm: number;
  twapSxlmPerXlm: number;
  elapsedSeconds: number;
}

function toRaw(amount: number): bigint {
  return BigInt(Math.floor(amount * STROOPS_PER_XLM));
}

function toDisplay(amount: bigint): number {
  return Number(amount) / STROOPS_PER_XLM;
}

export function computeSpotPrice(pool: PoolState): number {
  if (pool.reserveSxlm <= 0) return 1;
  return pool.reserveXlm / pool.reserveSxlm;
}

export function quoteSwap(pool: PoolState, request: QuoteRequest): QuoteResponse {
  if (!Number.isFinite(request.amount) || request.amount <= 0) {
    throw new Error("Amount must be positive");
  }
  const feeBps = pool.feeBps ?? DEFAULT_SWAP_FEE_BPS;
  const tokenOut: TokenSymbol = request.tokenIn === "XLM" ? "sXLM" : "XLM";
  const reserveIn = request.tokenIn === "XLM" ? pool.reserveXlm : pool.reserveSxlm;
  const reserveOut = request.tokenIn === "XLM" ? pool.reserveSxlm : pool.reserveXlm;
  if (!Number.isFinite(reserveIn) || !Number.isFinite(reserveOut) || reserveIn <= 0 || reserveOut <= 0) {
    throw new Error("Pool has no liquidity");
  }
  const amountInRaw = toRaw(request.amount);
  const reserveInRaw = toRaw(reserveIn);
  const reserveOutRaw = toRaw(reserveOut);
  const amountAfterFee = (amountInRaw * BigInt(10_000 - feeBps)) / 10_000n;
  const amountOutRaw =
    reserveOutRaw - (reserveInRaw * reserveOutRaw) / (reserveInRaw + amountAfterFee);
  if (amountOutRaw <= 0n || amountOutRaw >= reserveOutRaw) {
    throw new Error("Pool has insufficient liquidity for this trade");
  }
  const amountOut = toDisplay(amountOutRaw);
  const minimumAmountOut =
    toDisplay((amountOutRaw * BigInt(10_000 - (request.slippageBps ?? 50))) / 10_000n);
  const spotPrice = computeSpotPrice(pool);
  const executionPrice =
    request.tokenIn === "XLM" ? request.amount / amountOut : amountOut / request.amount;
  const referencePrice = spotPrice;

  return {
    tokenIn: request.tokenIn,
    tokenOut,
    amountIn: request.amount,
    amountOut,
    minimumAmountOut,
    executionPrice,
    spotPrice,
    priceImpactBps: Math.abs((executionPrice - referencePrice) / referencePrice) * 10_000,
    route: "sxlm-xlm-direct",
  };
}

export function buildRouteManifest(pool: PoolState, request: QuoteRequest) {
  const quote = quoteSwap(pool, request);
  return {
    pair: "sXLM/XLM",
    venueCandidates: ["StellarX", "Lumenswap"],
    quote,
    steps: [
      {
        pool: "sXLM/XLM",
        tokenIn: quote.tokenIn,
        tokenOut: quote.tokenOut,
      },
    ],
  };
}
