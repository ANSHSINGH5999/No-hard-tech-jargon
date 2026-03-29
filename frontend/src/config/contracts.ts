export const NETWORK = {
  name: import.meta.env.VITE_NETWORK_NAME || 'TESTNET',
  networkPassphrase: import.meta.env.VITE_NETWORK_PASSPHRASE || 'Test SDF Network ; September 2015',
  horizonUrl: import.meta.env.VITE_HORIZON_URL || 'https://horizon-testnet.stellar.org',
  sorobanRpcUrl: import.meta.env.VITE_SOROBAN_RPC_URL || 'https://soroban-testnet.stellar.org',
  friendbotUrl: 'https://friendbot.stellar.org',
} as const;

export const CONTRACTS = {
  // Redeployed to testnet ✅ 2026-03-29
  sxlmToken:  import.meta.env.VITE_SXLM_TOKEN_CONTRACT_ID || 'CDY6NCE2ETTCB5C7MISY34E6O23IHSO7WJAKVWFZ466GGMIEERSNGFO4',
  staking:    import.meta.env.VITE_STAKING_CONTRACT_ID    || 'CDKAF62SP27TBHMSTIWEHBCO3YDQCC6VSVNDEOECCLAA64DQNRN5UXNU',
  lending:    import.meta.env.VITE_LENDING_CONTRACT_ID    || 'CALSZHYYBZJYU6G5E7ATCXNX677WSKF72EOLUFLKGPF2DI5PFYXTOVCU',
  lpPool:     import.meta.env.VITE_LP_POOL_CONTRACT_ID    || 'CAUTHT6HQN2DFDIY4DGQNBQ3BD4ZRNUU5SNLRCJ6CBIVGWXANUP7URVC',
  governance: import.meta.env.VITE_GOVERNANCE_CONTRACT_ID || 'CD3FIVCAROAK4OFD4KWQYGXIOU3QPBGCFCJTMG2O7ZLN36O426LBCANX',
} as const;

export const API_BASE_URL = import.meta.env.VITE_API_URL || (import.meta.env.DEV ? 'http://localhost:3001' : '');

export const PROTOCOL_CONFIG = {
  minStakeAmount: 1,
  maxStakeAmount: 1_000_000,
  unbondingPeriodDays: 21,
  instantWithdrawFeePercent: 0.5,
  decimals: 7,
  xlmDecimals: 7,
  tokenSymbol: 'sXLM',
  nativeSymbol: 'XLM',
} as const;
