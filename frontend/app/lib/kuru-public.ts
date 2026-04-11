/**
 * Public Kuru Exchange HTTP API (no auth) — see
 * https://docs.kuru.io/api-reference/market-data/get-24-hour-ticker
 */

const BASE = "https://exchange.kuru.io/api/v3";

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
  const url = `${BASE}/ticker/24hr?${new URLSearchParams({ symbol })}`;
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

export async function fetchKuruDepth(
  symbol: string,
  limit = 5,
): Promise<KuruDepth> {
  const params = new URLSearchParams({ symbol, limit: String(limit) });
  const res = await fetch(`${BASE}/depth?${params}`);
  if (!res.ok) {
    throw new Error(`Kuru depth ${res.status}`);
  }
  return res.json() as Promise<KuruDepth>;
}
