import { ethers, BigNumber } from "ethers";
import { KURU_TESTNET, KURU_TESTNET_MARKET_ORDERBOOKS } from "~/lib/ecosystem-links";

/** Same as AgentKit: `0x000…000` = native MON for address resolution (not tx `to`). */
export const KURU_NATIVE_TOKEN = ethers.constants.AddressZero as `0x${string}`;

/** `placeAndExecuteMarket*` first arg is `uint96` on-chain. */
const MAX_U96 = BigNumber.from(2).pow(96).sub(1);

/**
 * Per-market order book (spender + `to` for the swap tx) — `MARKET_ADDRESSES[network][market_id]` in your Python app.
 *
 * Configure via `VITE_KURU_TESTNET_OB_<SYMBOL>` or `VITE_KURU_TESTNET_ORDERBOOKS` JSON.
 * Optional `VITE_KURU_TESTNET_OB_<SYMBOL>_SIDE=buy|sell` when the book’s convention differs.
 */
export type KuruTestnetMarketSpec = {
  orderbook: `0x${string}`;
  /** Force buy/sell encoding; default follows `is_buy = (to_token === native)`. */
  sideOverride?: "buy" | "sell";
};

function parseOrderbookEnvMap(): Partial<Record<string, `0x${string}`>> {
  const raw = import.meta.env.VITE_KURU_TESTNET_ORDERBOOKS?.trim();
  if (!raw) return {};
  try {
    const o = JSON.parse(raw) as Record<string, string>;
    const out: Partial<Record<string, `0x${string}`>> = {};
    for (const [k, v] of Object.entries(o)) {
      if (typeof v === "string" && /^0x[a-fA-F0-9]{40}$/.test(v)) {
        out[k.toUpperCase()] = v as `0x${string}`;
      }
    }
    return out;
  } catch {
    return {};
  }
}

function envOb(symbol: string): `0x${string}` | undefined {
  const key = `VITE_KURU_TESTNET_OB_${symbol}` as const;
  const v = (import.meta.env as Record<string, string | undefined>)[key]?.trim();
  if (v && /^0x[a-fA-F0-9]{40}$/.test(v)) return v as `0x${string}`;
  return undefined;
}

function defaultOrderbookForSymbol(
  u: string,
): { orderbook: `0x${string}`; monIsQuote: boolean } | undefined {
  const row = KURU_TESTNET_MARKET_ORDERBOOKS[u as keyof typeof KURU_TESTNET_MARKET_ORDERBOOKS];
  if (!row) return undefined;
  return { orderbook: row.orderbook as `0x${string}`, monIsQuote: row.monIsQuote };
}

/** `is_buy = (to_token_address == NATIVE_TOKEN_ADDRESS)` — same rule as KuruActionProvider.swap. */
export function kuruSwapIsBuy(toToken: `0x${string}`): boolean {
  return toToken.toLowerCase() === KURU_NATIVE_TOKEN.toLowerCase();
}

export function kuruTestnetMarketFor(symbol: string): KuruTestnetMarketSpec | null {
  const u = symbol.trim().toUpperCase();
  const fromJson = parseOrderbookEnvMap()[u];
  const defaults = defaultOrderbookForSymbol(u);
  const addr = fromJson ?? envOb(u) ?? defaults?.orderbook;
  if (!addr || addr === ethers.constants.AddressZero) return null;

  const envAll = import.meta.env as Record<string, string | undefined>;
  const sideRaw = envAll[`VITE_KURU_TESTNET_OB_${u}_SIDE`]?.trim()?.toLowerCase();
  let sideOverride: "buy" | "sell" | undefined =
    sideRaw === "buy" || sideRaw === "sell" ? sideRaw : undefined;
  if (!sideOverride && defaults) {
    sideOverride = defaults.monIsQuote ? "buy" : "sell";
  }

  return { orderbook: addr, sideOverride };
}

export type KuruTestnetOutOption = {
  symbol: string;
  address: `0x${string}`;
  decimals: number;
};

export const KURU_TESTNET_SWAP_OUT: KuruTestnetOutOption[] = [
  { symbol: "USDC", address: KURU_TESTNET.usdc as `0x${string}`, decimals: 6 },
  { symbol: "USDT", address: KURU_TESTNET.usdt as `0x${string}`, decimals: 6 },
  { symbol: "DAK", address: KURU_TESTNET.dak as `0x${string}`, decimals: 18 },
  { symbol: "CHOG", address: KURU_TESTNET.chog as `0x${string}`, decimals: 18 },
  { symbol: "YAKI", address: KURU_TESTNET.yaki as `0x${string}`, decimals: 18 },
];

/** Kuru REST `symbol` for ticker/depth (mainnet-oriented API), e.g. `MON_USDC`. */
export function kuruTestnetPairRestSymbol(quoteSymbol: string): string {
  return `MON_${quoteSymbol.trim().toUpperCase()}`;
}

/**
 * REST `symbol` aligned with market naming: `mon-usdc` → `MON_USDC`, `dak-mon` → `DAK_MON`, etc.
 * (Mainnet API may still 404 on testnet.)
 */
export function kuruTestnetRestSymbolForPair(quoteSymbol: string): string {
  const u = quoteSymbol.trim().toUpperCase();
  const def = defaultOrderbookForSymbol(u);
  if (def?.monIsQuote) return `${u}_MON`;
  return `MON_${u}`;
}

/** Matches Kuru order book JSON: `placeAndExecuteMarketBuy` / `placeAndExecuteMarketSell`. */
const ORDERBOOK_IFACE = new ethers.utils.Interface([
  "function placeAndExecuteMarketBuy(uint96 _quoteSize,uint256 _minAmountOut,bool _isMargin,bool _isFillOrKill) payable",
  "function placeAndExecuteMarketSell(uint96 _size,uint256 _minAmountOut,bool _isMargin,bool _isFillOrKill) payable",
]);

function toUint96(amountWei: BigNumber): BigNumber {
  if (amountWei.lt(0) || amountWei.gt(MAX_U96)) {
    throw new Error("Amount out of range for uint96 (Kuru market order size / quoteSize)");
  }
  return amountWei;
}

/**
 * Encode swap calldata for the **order book** at `market.orderbook` (not router).
 * Constants match your agent: `_isMargin = false`, `_isFillOrKill = true`.
 *
 * Side: **Buy** → `placeAndExecuteMarketBuy`; **Sell** → `placeAndExecuteMarketSell`, where
 * `is_buy = (to_token === native)` unless `market.sideOverride` is set.
 *
 * **Native MON in:** `fromToken === zero` — no ERC-20 approve; attach MON as `msg.value` when the book expects native pay-in (sell base or buy with native quote). For **ERC-20 from**, approve `market.orderbook` first, then call with `value: 0`.
 */
export function kuruEncodeTestnetOrderbookSwap(params: {
  market: KuruTestnetMarketSpec;
  /** `0x000…000` = native MON. */
  fromToken: `0x${string}`;
  /** Output token (e.g. USDC). If this is native, the book side is **buy**. */
  toToken: `0x${string}`;
  /** Input amount in wei — for MON, 18 decimals (same spirit as `Web3.to_wei(..., 'ether')`). */
  amountInWei: BigNumber;
  minAmountOut: BigNumber;
}): { to: `0x${string}`; data: `0x${string}`; value: bigint } {
  const { market, fromToken, toToken, amountInWei, minAmountOut } = params;

  const fromNative = fromToken.toLowerCase() === KURU_NATIVE_TOKEN.toLowerCase();
  const isBuy =
    market.sideOverride === "buy" ? true : market.sideOverride === "sell" ? false : kuruSwapIsBuy(toToken);

  const sizeU96 = toUint96(amountInWei);
  const isMargin = false;
  const isFillOrKill = true;

  let data: string;
  if (isBuy) {
    data = ORDERBOOK_IFACE.encodeFunctionData("placeAndExecuteMarketBuy", [
      sizeU96,
      minAmountOut,
      isMargin,
      isFillOrKill,
    ]);
  } else {
    data = ORDERBOOK_IFACE.encodeFunctionData("placeAndExecuteMarketSell", [
      sizeU96,
      minAmountOut,
      isMargin,
      isFillOrKill,
    ]);
  }

  /** Native pay-in: attach MON for payable paths; ERC-20 `from` uses 0 and prior `approve(market, amount)`. */
  let value = 0n;
  if (fromNative) {
    value = BigInt(amountInWei.toString());
  }

  return {
    to: market.orderbook,
    data: data as `0x${string}`,
    value,
  };
}

/** MON → `toToken` (ERC-20): default side is **sell** (`is_buy` false). */
export function kuruEncodeTestnetMonToTokenSwap(params: {
  market: KuruTestnetMarketSpec;
  toToken: `0x${string}`;
  amountMon: number;
  minAmountOut: BigNumber;
}): ReturnType<typeof kuruEncodeTestnetOrderbookSwap> {
  const { market, toToken, amountMon, minAmountOut } = params;
  if (!Number.isFinite(amountMon) || amountMon <= 0) {
    throw new Error("Enter a positive MON amount");
  }
  const amountInWei = ethers.utils.parseUnits(amountMon.toString(), 18);
  return kuruEncodeTestnetOrderbookSwap({
    market,
    fromToken: KURU_NATIVE_TOKEN,
    toToken,
    amountInWei,
    minAmountOut,
  });
}

/** Minimal ERC-20 `approve` calldata — **spender = order book** (market), not router. */
export function kuruEncodeErc20Approve(
  token: `0x${string}`,
  spenderMarket: `0x${string}`,
  amount: BigNumber,
): { to: `0x${string}`; data: `0x${string}`; value: bigint } {
  const erc20 = new ethers.utils.Interface([
    "function approve(address spender,uint256 amount) returns (bool)",
  ]);
  return {
    to: token,
    data: erc20.encodeFunctionData("approve", [spenderMarket, amount]) as `0x${string}`,
    value: 0n,
  };
}
