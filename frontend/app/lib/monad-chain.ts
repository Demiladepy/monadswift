import { defineChain } from "viem";

/**
 * Target network for this app. Set `VITE_MONAD_NETWORK=mainnet` in `.env` to use mainnet.
 * Default is **testnet** for hackathon / dev.
 */
export type MonadAppNetwork = "mainnet" | "testnet";

export const monadAppNetwork: MonadAppNetwork =
  import.meta.env.VITE_MONAD_NETWORK === "mainnet" ? "mainnet" : "testnet";

/** Monad Mainnet — https://docs.monad.xyz/developer-essentials/network-information */
export const MONAD_MAINNET_CHAIN_ID = 143;

/** Circle USDC on Monad mainnet — https://developers.circle.com/stablecoins/usdc-contract-addresses */
export const MONAD_MAINNET_USDC = "0x754704Bc059F8C67012fEd69BC8A327a5aafb603" as const;

export const monadMainnet = defineChain({
  id: MONAD_MAINNET_CHAIN_ID,
  name: "Monad Mainnet",
  nativeCurrency: { name: "MON", symbol: "MON", decimals: 18 },
  rpcUrls: {
    default: { http: ["https://rpc.monad.xyz"] },
  },
  blockExplorers: {
    default: {
      name: "MonadVision",
      url: "https://monadvision.com",
    },
  },
});

export const MONAD_MAINNET_DOCS =
  "https://docs.monad.xyz/developer-essentials/network-information";

/** Optional: Monad testnet for future dev toggles */
export const MONAD_TESTNET_CHAIN_ID = 10143;

export const monadTestnet = defineChain({
  id: MONAD_TESTNET_CHAIN_ID,
  name: "Monad Testnet",
  nativeCurrency: { name: "MON", symbol: "MON", decimals: 18 },
  rpcUrls: {
    default: { http: ["https://testnet-rpc.monad.xyz"] },
  },
  blockExplorers: {
    default: {
      name: "MonadVision",
      url: "https://testnet.monadvision.com",
    },
  },
});

export const MONAD_TESTNET_DOCS =
  "https://docs.monad.xyz/developer-essentials/testnets";

/** Circle USDC on Monad testnet — https://developers.circle.com/stablecoins/usdc-contract-addresses */
export const MONAD_TESTNET_USDC =
  "0x534b2f3A21130d7a60830c2Df862319e593943A3" as const;

/** Active chain for Privy + viem (default: testnet). */
export const monadAppChain = monadAppNetwork === "mainnet" ? monadMainnet : monadTestnet;

export const MONAD_APP_CHAIN_ID = monadAppChain.id;

/** USDC for the active network (mainnet Circle address vs testnet). */
export const MONAD_APP_USDC =
  monadAppNetwork === "mainnet" ? MONAD_MAINNET_USDC : MONAD_TESTNET_USDC;

/** Fiat onramps (MoonPay / Bridge) are disabled while we focus on testnet + DEX flows. */
export const FIAT_ONRAMP_ENABLED = false;
