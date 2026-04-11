/// <reference types="vite/client" />

interface ImportMetaEnv {
  readonly VITE_MONAD_NETWORK?: string;
  readonly VITE_KURU_REST_BASE?: string;
  readonly VITE_KURU_FLOW_BASE?: string;
  /** Origin for Kuru pool REST (`POST /api/v1/markets/filtered`). Default `https://exchange.kuru.io`. */
  readonly VITE_KURU_POOL_API_BASE?: string;
  /** JSON map of symbol → order book address for testnet direct swaps, e.g. `{"USDC":"0x..."}`. */
  readonly VITE_KURU_TESTNET_ORDERBOOKS?: string;
  /** Per-token order book for MON→`SYMBOL` testnet swap (`VITE_KURU_TESTNET_OB_USDC`, etc.). */
  readonly VITE_KURU_TESTNET_OB_USDC?: string;
  readonly VITE_KURU_TESTNET_OB_USDT?: string;
  readonly VITE_KURU_TESTNET_OB_DAK?: string;
  readonly VITE_KURU_TESTNET_OB_CHOG?: string;
  readonly VITE_KURU_TESTNET_OB_YAKI?: string;
  /** Optional: `buy` if this pair uses `placeAndExecuteMarketBuy` for spending MON as quote (default `sell`). */
  readonly VITE_KURU_TESTNET_OB_USDC_SIDE?: string;
  readonly VITE_KURU_TESTNET_OB_USDT_SIDE?: string;
  readonly VITE_KURU_TESTNET_OB_DAK_SIDE?: string;
  readonly VITE_KURU_TESTNET_OB_CHOG_SIDE?: string;
  readonly VITE_KURU_TESTNET_OB_YAKI_SIDE?: string;
  /** GET base URL — append `?q=` with email or @handle; JSON `{ "address": "0x..." }`. */
  readonly VITE_RECIPIENT_RESOLVER_URL?: string;
  /** On-chain registry with `resolve(string) → address` (zero = unset). */
  readonly VITE_RECIPIENT_REGISTRY_ADDRESS?: string;
  /**
   * Static JSON map for demos: `{"you@mail.com":"0x...","@handle":"0x..."}`.
   * Checked first (no server). Keys match case-insensitively.
   */
  readonly VITE_RECIPIENT_RESOLVER_MAP?: string;
}

interface ImportMeta {
  readonly env: ImportMetaEnv;
}
