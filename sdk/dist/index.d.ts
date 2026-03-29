export declare const STROOPS_PER_XLM = 10000000;
export declare const DEFAULT_SWAP_FEE_BPS = 30;
export declare const PRICE_PRECISION = 1000000000000000000n;
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
export declare function computeSpotPrice(pool: PoolState): number;
export declare function quoteSwap(pool: PoolState, request: QuoteRequest): QuoteResponse;
export declare function buildRouteManifest(pool: PoolState, request: QuoteRequest): {
    pair: string;
    venueCandidates: string[];
    quote: QuoteResponse;
    steps: {
        pool: string;
        tokenIn: TokenSymbol;
        tokenOut: TokenSymbol;
    }[];
};
