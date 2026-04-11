import { defineChain } from "viem";

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
