import { useEffect, useState } from "react";
import { fetchKuruExchangeInfo, fetchKuruTrades, type KuruTrade } from "~/lib/kuru-public";

type Props = {
  /** When set, loads trades for this pair only. Otherwise uses first TRADING market from exchangeInfo. */
  symbol?: string;
  limit?: number;
};

/**
 * Live market trades from Kuru REST API (not an on-chain “your transactions” indexer).
 */
export function DashboardKuruActivity({ symbol: symbolProp, limit = 30 }: Props) {
  const [symbol, setSymbol] = useState<string | null>(symbolProp ?? null);
  const [trades, setTrades] = useState<KuruTrade[]>([]);
  const [error, setError] = useState<string | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (symbolProp) {
      setSymbol(symbolProp);
      return;
    }
    let cancelled = false;
    fetchKuruExchangeInfo()
      .then((info) => {
        if (cancelled) return;
        const first = info.symbols.find((s) => s.status === "TRADING");
        setSymbol(first?.symbol ?? "MON_USDC");
      })
      .catch(() => {
        if (!cancelled) setSymbol("MON_USDC");
      });
    return () => {
      cancelled = true;
    };
  }, [symbolProp]);

  useEffect(() => {
    if (!symbol) return;
    let cancelled = false;
    setLoading(true);
    setError(null);
    fetchKuruTrades(symbol, limit)
      .then((rows) => {
        if (!cancelled) setTrades(rows);
      })
      .catch((e: unknown) => {
        if (!cancelled) setError(e instanceof Error ? e.message : "Could not load trades");
      })
      .finally(() => {
        if (!cancelled) setLoading(false);
      });
    return () => {
      cancelled = true;
    };
  }, [symbol, limit]);

  return (
    <section className="rounded-2xl border border-neutral-200/90 bg-white p-5 shadow-sm sm:p-6">
      <div className="flex flex-col gap-1 sm:flex-row sm:items-baseline sm:justify-between">
        <h2 className="font-sans text-lg font-semibold text-neutral-950">Market activity</h2>
        {symbol ? (
          <span className="font-mono text-xs text-neutral-500">
            Kuru · {symbol} · recent trades
          </span>
        ) : null}
      </div>
      <p className="mt-1 text-sm text-neutral-600">
        Pulled from{" "}
        <code className="rounded bg-neutral-100 px-1 font-mono text-xs">GET /api/v3/trades</code> on
        the Kuru exchange API.
      </p>

      {loading ? (
        <p className="mt-6 text-sm text-neutral-500">Loading trades…</p>
      ) : error ? (
        <p className="mt-6 text-sm text-red-700" role="alert">
          {error}
        </p>
      ) : trades.length === 0 ? (
        <p className="mt-6 rounded-xl border border-dashed border-neutral-200 bg-neutral-50/80 px-4 py-8 text-center text-sm text-neutral-500">
          No trades returned for this market.
        </p>
      ) : (
        <ul className="mt-4 max-h-[min(360px,50vh)] divide-y divide-neutral-100 overflow-y-auto">
          {trades.map((t) => (
            <li
              key={`${t.id}-${t.time}`}
              className="flex flex-wrap items-center justify-between gap-2 py-2.5 text-sm"
            >
              <div>
                <span className="font-mono tabular-nums text-neutral-900">{t.price}</span>
                <span className="text-neutral-400"> × </span>
                <span className="font-mono tabular-nums text-neutral-700">{t.qty}</span>
              </div>
              <div className="text-right text-xs text-neutral-500">
                <span className={t.isBuyerMaker ? "text-emerald-700" : "text-red-700"}>
                  {t.isBuyerMaker ? "Buyer maker" : "Seller maker"}
                </span>
                <span className="ml-2 tabular-nums">
                  {new Date(t.time).toLocaleTimeString()}
                </span>
              </div>
            </li>
          ))}
        </ul>
      )}
    </section>
  );
}
