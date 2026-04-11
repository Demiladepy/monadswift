/**
 * Kuru Exchange REST API — override with `VITE_KURU_REST_BASE` if you use a different host.
 * In dev, default uses the Vite proxy (`/kuru-api` → `exchange.kuru.io`) to avoid browser CORS.
 * @see https://docs.kuru.io/api-reference/market-data/get-orderbook-depth
 */
function kuruRestBase(): string {
  const fromEnv = import.meta.env.VITE_KURU_REST_BASE?.trim();
  if (fromEnv) return fromEnv;
  if (import.meta.env.DEV) return "/kuru-api/api/v3";
  return "https://exchange.kuru.io/api/v3";
}

export type Kuru24hrTicker = {
  symbol: string;
  priceChange: string;
  priceChangePercent: string;
  lastPrice: string;
  bidPrice: string;
  askPrice: string;
  openPrice: string;
  highPrice: string;
  lowPrice: string;
  volume: string;
  quoteVolume: string;
  openTime: number;
  closeTime: number;
  count: number;
};

export async function fetchKuru24hrTicker(symbol: string): Promise<Kuru24hrTicker> {
  const url = `${kuruRestBase()}/ticker/24hr?${new URLSearchParams({ symbol })}`;
  const res = await fetch(url);
  if (!res.ok) {
    throw new Error(`Kuru ticker ${res.status}`);
  }
  return res.json() as Promise<Kuru24hrTicker>;
}

export type KuruDepth = {
  lastUpdateId: number;
  E: number;
  T: number;
  bids: [string, string][];
  asks: [string, string][];
};

/**
 * Order book depth. **`symbol` is required** (e.g. `MON_USDC`). Without it the API returns 400.
 *
 * @example
 * ```ts
 * await fetchKuruDepth("MON_USDC", 100, "committed");
 * // GET /api/v3/depth?symbol=MON_USDC&limit=100&state=committed
 * ```
 * @see https://docs.kuru.io/api-reference/market-data/get-orderbook-depth
 */
export async function fetchKuruDepth(
  symbol: string,
  limit = 5,
  state: "proposed" | "voted" | "finalized" | "committed" = "committed",
): Promise<KuruDepth> {
  const sym = symbol.trim();
  if (!sym) {
    throw new Error(
      "Kuru depth: `symbol` is required (e.g. MON_USDC). Add ?symbol=MON_USDC to the request.",
    );
  }
  const params = new URLSearchParams({
    symbol: sym,
    limit: String(Math.min(5000, Math.max(1, limit))),
    state,
  });
  const res = await fetch(`${kuruRestBase()}/depth?${params}`);
  if (!res.ok) {
    const hint = res.status === 400 ? " — check `symbol` (required) and range 1≤limit≤5000" : "";
    throw new Error(`Kuru depth ${res.status}${hint}`);
  }
  return res.json() as Promise<KuruDepth>;
}

export type KuruSymbolInfo = {
  symbol: string;
  status: string;
  baseAsset: string;
  quoteAsset: string;
  baseAssetPrecision: number;
  quoteAssetPrecision: number;
};

export type KuruExchangeInfo = {
  timezone: string;
  serverTime: number;
  E: number;
  T: number;
  symbols: KuruSymbolInfo[];
};

export async function fetchKuruExchangeInfo(): Promise<KuruExchangeInfo> {
  const res = await fetch(`${kuruRestBase()}/exchangeInfo`);
  if (!res.ok) {
    throw new Error(`Kuru exchangeInfo ${res.status}`);
  }
  return res.json() as Promise<KuruExchangeInfo>;
}

export type KuruTrade = {
  id: number;
  price: string;
  qty: string;
  time: number;
  isBuyerMaker: boolean;
};

export async function fetchKuruTrades(symbol: string, limit = 50): Promise<KuruTrade[]> {
  const params = new URLSearchParams({ symbol, limit: String(Math.min(1000, Math.max(1, limit))) });
  const res = await fetch(`${kuruRestBase()}/trades?${params}`);
  if (!res.ok) {
    throw new Error(`Kuru trades ${res.status}`);
  }
  return res.json() as Promise<KuruTrade[]>;
}
