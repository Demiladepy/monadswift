/** External ecosystem apps — update URLs if teams ship new hosts. */
export const ECOSYSTEM = {
  kintsu: {
    name: "Kintsu",
    description: "Liquid staking on Monad — abstracted validator exposure.",
    url: "https://kintsu.xyz",
  },
  magma: {
    name: "Magma",
    description: "Monad-native yield and staking — update this URL to your live vault link.",
    url: "https://magmastaking.io",
  },
  kuruDocs: "https://docs.kuru.io",
  kuruExchange: "https://exchange.kuru.io",
  monadVision: "https://monadvision.com",
} as const;

/** Kuru [mainnet contract addresses](https://docs.kuru.io/contracts/Contract-addresses) */
export const KURU_MAINNET = {
  kuruFlowRouter: "0x0d3a1BE29E9dEd63c7a5678b31e847D68F71FFa2",
  usdc: "0x754704Bc059F8C67012fEd69BC8A327a5aafb603",
  wmon: "0x3bd359C1119dA7Da1D913D1C4D2B7c461115433A",
  monUsdcMarket: "0x065C9d28E428A0db40191a54d33d5b7c71a9C394",
} as const;

/**
 * Kuru [testnet contract addresses](https://docs.kuru.io/contracts/Contract-addresses).
 * `usdc` / `usdt` / … are Kuru-listed tokens (used by PoolFetcher + router); Circle test USDC for balances stays in `monad-chain`.
 */
export const KURU_TESTNET = {
  router: "0x1f5A250c4A506DA4cE584173c6ed1890B1bf7187",
  marginAccount: "0xdDDaBd30785bA8b45e434a1f134BDf304d6125d9",
  kuruForwarder: "0xa21ca7b4e308e9E2dC4C60620572792634EA21a0",
  kuruDeployer: "0x1D90616Ad479c3D814021b1f4C43b1a2fFf87626",
  kuruUtils: "0xDdAEdbc015fEe6BE50c69Fbf5d771A4563C996B3",
  /** WMON used by Kuru SDK pool indexer on testnet */
  wmon: "0x760AfE86e5de5fa0Ee542fc7B7B713e1c5425701",
  usdc: "0xf817257fed379853cDe0fa4F97AB987181B1E5Ea",
  usdt: "0x88b8E2161DEDC77EF4ab7585569D2415a1C1055D",
  dak: "0x0F0BDEbF0F83cD1EE3974779Bcb7315f9808c714",
  chog: "0xE0590015A873bF326bd645c3E1266d4db41C4E6B",
  yaki: "0xfe140e1dCe99Be9F4F15d657CD9b7BF622270C50",
} as const;

/**
 * Monad testnet (`monad-testnet`) per-market order book addresses (spender + swap `to`).
 * Source: internal market list — **not** Base Sepolia / Base mainnet.
 *
 * - **mon-usdc**: MON is base → native MON → USDC uses `placeAndExecuteMarketSell`.
 * - **\*-mon** (dak, chog, yaki): MON is quote → spend MON to buy base uses `placeAndExecuteMarketBuy`.
 *
 * Override any entry with `VITE_KURU_TESTNET_OB_<SYMBOL>` or `VITE_KURU_TESTNET_ORDERBOOKS` JSON.
 */
export const KURU_TESTNET_MARKET_ORDERBOOKS = {
  USDC: {
    orderbook: "0xd3af145f1aa1a471b5f0f62c52cf8fcdc9ab55d3" as const,
    /** MON base / USDC quote */
    monIsQuote: false,
  },
  DAK: {
    orderbook: "0x94b72620e65577de5fb2b8a8b93328caf6ca161b" as const,
    monIsQuote: true,
  },
  CHOG: {
    orderbook: "0x277bf4a0aac16f19d7bf592feffc8d2d9a890508" as const,
    monIsQuote: true,
  },
  YAKI: {
    orderbook: "0xd5c1dc181c359f0199c83045a85cd2556b325de0" as const,
    monIsQuote: true,
  },
} as const;
