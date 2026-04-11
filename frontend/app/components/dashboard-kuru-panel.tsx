import { useEffect, useMemo, useState } from "react";
import {
  fetchKuruExchangeInfo,
  fetchKuru24hrTicker,
  fetchKuruDepth,
  type Kuru24hrTicker,
  type KuruDepth,
  type KuruSymbolInfo,
} from "~/lib/kuru-public";
import { KuruSwapForm } from "~/components/kuru-swap-form";
import { KuruSdkSwapWidget } from "~/components/kuru-sdk-swap-widget";
import { kuruTestnetRestSymbolForPair } from "~/lib/kuru-testnet-swap";
import { monadAppChain, monadAppNetwork } from "~/lib/monad-chain";

type PanelProps = {
  variant?: "page" | "modal";
  walletAddress?: `0x${string}` | undefined;
};

/** Mainnet REST ticker + depth for the pair selected in the swap widget (beneath the card). */
function KuruSwapMarketBelow({ restPairSymbol }: { restPairSymbol: string }) {
  const [ticker, setTicker] = useState<Kuru24hrTicker | null>(null);
  const [depth, setDepth] = useState<KuruDepth | null>(null);
  const [err, setErr] = useState<string | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    let cancelled = false;
    setLoading(true);
    setErr(null);
    setTicker(null);
    setDepth(null);
    Promise.all([fetchKuru24hrTicker(restPairSymbol), fetchKuruDepth(restPairSymbol, 8)])
      .then(([t, d]) => {
        if (!cancelled) {
          setTicker(t);
          setDepth(d);
        }
      })
      .catch((e: unknown) => {
        if (!cancelled) setErr(e instanceof Error ? e.message : "Market data failed");
      })
      .finally(() => {
        if (!cancelled) setLoading(false);
      });
    return () => {
      cancelled = true;
    };
  }, [restPairSymbol]);

  return (
    <section className="mt-5 overflow-hidden rounded-[1.25rem] border border-neutral-200 bg-white shadow-[0_4px_24px_-8px_rgba(0,0,0,0.08)]">
      <div className="border-b border-neutral-200 bg-neutral-50/90 px-4 py-3">
        <h3 className="text-xs font-semibold uppercase tracking-wide text-neutral-500">Market data</h3>
        <p className="mt-0.5 font-mono text-sm font-semibold text-monad">{restPairSymbol}</p>
        <p className="mt-1 text-[11px] text-neutral-500">
          Kuru REST (mainnet-oriented). Testnet on-chain swap may still work when this shows 404.
        </p>
      </div>
      <div className="p-4">
        {loading ? (
          <p className="text-sm text-neutral-500">Loading…</p>
        ) : err ? (
          <p className="text-sm text-amber-800" role="alert">
            {err}
          </p>
        ) : ticker ? (
          <dl className="grid gap-3 sm:grid-cols-2 lg:grid-cols-4">
            <div className="rounded-xl border border-neutral-200 bg-white px-3 py-2.5 shadow-sm">
              <dt className="text-[10px] font-medium uppercase tracking-wide text-neutral-500">Last</dt>
              <dd className="mt-1 font-sans text-lg font-semibold tabular-nums text-neutral-900">{ticker.lastPrice}</dd>
            </div>
            <div className="rounded-xl border border-neutral-200 bg-white px-3 py-2.5 shadow-sm">
              <dt className="text-[10px] font-medium uppercase tracking-wide text-neutral-500">24h Δ</dt>
              <dd className="mt-1 font-semibold tabular-nums text-neutral-800">
                {ticker.priceChange} ({ticker.priceChangePercent}%)
              </dd>
            </div>
            <div className="rounded-xl border border-neutral-200 bg-white px-3 py-2.5 shadow-sm">
              <dt className="text-[10px] font-medium uppercase tracking-wide text-neutral-500">Bid / ask</dt>
              <dd className="mt-1 font-semibold tabular-nums text-neutral-800">
                {ticker.bidPrice} / {ticker.askPrice}
              </dd>
            </div>
            <div className="rounded-xl border border-neutral-200 bg-white px-3 py-2.5 shadow-sm">
              <dt className="text-[10px] font-medium uppercase tracking-wide text-neutral-500">Volume</dt>
              <dd className="mt-1 font-semibold tabular-nums text-neutral-800">{ticker.volume}</dd>
            </div>
          </dl>
        ) : null}

        {depth && !err ? (
          <div className="mt-4 overflow-x-auto rounded-xl border border-neutral-200 bg-neutral-50/50">
            <table className="w-full min-w-[280px] text-left text-sm">
              <thead className="bg-neutral-100 text-[10px] font-semibold uppercase tracking-wide text-neutral-500">
                <tr>
                  <th className="px-3 py-2">Bid</th>
                  <th className="px-3 py-2">Size</th>
                  <th className="px-3 py-2">Ask</th>
                  <th className="px-3 py-2">Size</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-neutral-200 text-neutral-700">
                {depth.bids.slice(0, 6).map((b, i) => {
                  const a = depth.asks[i];
                  return (
                    <tr key={i} className="tabular-nums">
                      <td className="px-3 py-1.5 text-emerald-700">{b[0]}</td>
                      <td className="px-3 py-1.5 text-neutral-600">{b[1]}</td>
                      <td className="px-3 py-1.5 text-red-700">{a?.[0] ?? "—"}</td>
                      <td className="px-3 py-1.5 text-neutral-600">{a?.[1] ?? "—"}</td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
        ) : null}
      </div>
    </section>
  );
}

export function DashboardKuruPanel({ variant = "page", walletAddress }: PanelProps) {
  const isModal = variant === "modal";
  const [swapReceiveSymbol, setSwapReceiveSymbol] = useState("USDC");

  const [symbols, setSymbols] = useState<KuruSymbolInfo[]>([]);
  const [selectedSymbol, setSelectedSymbol] = useState<string>("");
  const [infoError, setInfoError] = useState<string | null>(null);

  const [ticker, setTicker] = useState<Kuru24hrTicker | null>(null);
  const [depth, setDepth] = useState<KuruDepth | null>(null);
  const [marketError, setMarketError] = useState<string | null>(null);
  const [loadingMarket, setLoadingMarket] = useState(false);

  useEffect(() => {
    let cancelled = false;
    setInfoError(null);
    fetchKuruExchangeInfo()
      .then((info) => {
        if (cancelled) return;
        const trading = info.symbols.filter((s) => s.status === "TRADING");
        setSymbols(trading);
        if (trading.length > 0) {
          setSelectedSymbol((prev) => prev && trading.some((s) => s.symbol === prev) ? prev : trading[0].symbol);
        }
      })
      .catch((e: unknown) => {
        if (!cancelled) setInfoError(e instanceof Error ? e.message : "exchangeInfo failed");
      });
    return () => {
      cancelled = true;
    };
  }, []);

  const selectedRow = useMemo(
    () => symbols.find((s) => s.symbol === selectedSymbol) ?? null,
    [symbols, selectedSymbol],
  );

  useEffect(() => {
    if (monadAppNetwork === "testnet" || !selectedSymbol) return;
    let cancelled = false;
    setLoadingMarket(true);
    setMarketError(null);
    Promise.all([fetchKuru24hrTicker(selectedSymbol), fetchKuruDepth(selectedSymbol, 8)])
      .then(([t, d]) => {
        if (!cancelled) {
          setTicker(t);
          setDepth(d);
        }
      })
      .catch((e: unknown) => {
        if (!cancelled) setMarketError(e instanceof Error ? e.message : "Market data failed");
      })
      .finally(() => {
        if (!cancelled) setLoadingMarket(false);
      });
    return () => {
      cancelled = true;
    };
  }, [selectedSymbol, monadAppNetwork]);

  return (
    <div className="space-y-6">
      <section
        className={
          isModal
            ? "space-y-6"
            : "rounded-2xl border border-neutral-200/90 bg-white p-5 shadow-sm sm:p-6"
        }
      >
        {!isModal ? (
          <>
            <p className="text-xs font-semibold uppercase tracking-wider text-monad">Swap</p>
            <h2 className="mt-1 font-sans text-xl font-semibold text-neutral-950">Kuru on Monad</h2>
          </>
        ) : null}

        <p className={`max-w-2xl text-sm text-neutral-600 ${isModal ? "" : "mt-2"}`}>
          Embedded wallet: <span className="font-medium text-neutral-800">{monadAppChain.name}</span>{" "}
          ({monadAppNetwork}).
          {monadAppNetwork === "testnet" ? (
            <>
              {" "}
              <strong className="font-medium text-neutral-800">Testnet:</strong> use the swap below (MON →
              USDC &amp; other{" "}
              <a
                href="https://docs.kuru.io/contracts/Contract-addresses"
                className="font-medium text-monad underline-offset-2 hover:underline"
                target="_blank"
                rel="noreferrer"
              >
                Kuru-listed tokens
              </a>
              ). Dev server proxies REST to avoid CORS.
            </>
          ) : (
            <>
              {" "}
              Market data from the Kuru REST API. Pick a pair, get a Flow quote, then confirm.
            </>
          )}
        </p>

        {monadAppNetwork === "testnet" ? (
          <div className={isModal ? "mt-4 space-y-0" : "mt-6 space-y-0"}>
            <KuruSdkSwapWidget
              walletAddress={walletAddress}
              receiveSymbol={swapReceiveSymbol}
              onReceiveSymbolChange={setSwapReceiveSymbol}
            />
            <KuruSwapMarketBelow restPairSymbol={kuruTestnetRestSymbolForPair(swapReceiveSymbol)} />
          </div>
        ) : null}

        {infoError ? (
          <p className="mt-4 text-sm text-red-700" role="alert">
            {infoError}
          </p>
        ) : null}

        {symbols.length > 0 ? (
          <div className="mt-6">
            <h3 className="text-xs font-semibold uppercase tracking-wide text-neutral-500">
              Markets (TRADING)
            </h3>
            <div className="mt-2 flex flex-wrap gap-2">
              {symbols.map((s) => (
                <button
                  key={s.symbol}
                  type="button"
                  onClick={() => setSelectedSymbol(s.symbol)}
                  className={`rounded-xl border px-3 py-2 text-left text-sm font-medium transition-colors ${
                    selectedSymbol === s.symbol
                      ? "border-monad bg-monad/10 text-monad"
                      : "border-neutral-200 bg-white text-neutral-800 hover:border-monad/40"
                  }`}
                >
                  <span className="block font-mono text-xs">{s.symbol}</span>
                  <span className="block text-[11px] font-normal text-neutral-500">
                    {s.baseAsset}/{s.quoteAsset}
                  </span>
                </button>
              ))}
            </div>
          </div>
        ) : !infoError ? (
          <p className="mt-4 text-sm text-neutral-500">Loading markets…</p>
        ) : null}

        {selectedRow && selectedRow.status === "TRADING" ? (
          <div className="mt-6">
            {monadAppNetwork === "testnet" ? (
              <details className="rounded-2xl border border-neutral-200 bg-neutral-50/80 p-4 open:bg-white">
                <summary className="cursor-pointer list-none text-sm font-semibold text-neutral-900 [&::-webkit-details-marker]:hidden">
                  <span className="inline-flex items-center gap-2">
                    <span className="rounded-full bg-neutral-200/80 px-2 py-0.5 text-[11px] font-bold uppercase tracking-wide text-neutral-700">
                      Advanced
                    </span>
                    Flow API quote (JWT) — pick market pair
                  </span>
                </summary>
                <p className="mt-2 text-xs text-neutral-500">
                  Alternative path using Kuru Flow + embedded wallet; requires Flow endpoints.
                </p>
                <div className="mt-4">
                  <KuruSwapForm walletAddress={walletAddress} symbolRow={selectedRow} />
                </div>
              </details>
            ) : (
              <>
                <h3 className="text-xs font-semibold uppercase tracking-wide text-neutral-500">Swap</h3>
                <div className="mt-2">
                  <KuruSwapForm walletAddress={walletAddress} symbolRow={selectedRow} />
                </div>
              </>
            )}
          </div>
        ) : null}
      </section>

      {selectedRow && monadAppNetwork === "mainnet" ? (
        <section className="rounded-2xl border border-neutral-200/90 bg-white p-5 shadow-sm sm:p-6">
          <h3 className="text-sm font-semibold text-neutral-950">24h ticker · {selectedSymbol}</h3>
          {loadingMarket ? (
            <p className="mt-4 text-sm text-neutral-500">Loading…</p>
          ) : marketError ? (
            <p className="mt-4 text-sm text-amber-800" role="alert">
              {marketError}
            </p>
          ) : ticker ? (
            <dl className="mt-4 grid gap-3 sm:grid-cols-2 lg:grid-cols-4">
              <div className="rounded-xl border border-monad/15 bg-monad/5 px-4 py-3">
                <dt className="text-xs font-medium text-neutral-500">Last</dt>
                <dd className="mt-1 font-sans text-xl font-semibold tabular-nums">{ticker.lastPrice}</dd>
              </div>
              <div className="rounded-xl border border-neutral-100 bg-white px-4 py-3">
                <dt className="text-xs font-medium text-neutral-500">24h Δ</dt>
                <dd className="mt-1 font-semibold tabular-nums">
                  {ticker.priceChange} ({ticker.priceChangePercent}%)
                </dd>
              </div>
              <div className="rounded-xl border border-neutral-100 bg-white px-4 py-3">
                <dt className="text-xs font-medium text-neutral-500">Bid / ask</dt>
                <dd className="mt-1 font-semibold tabular-nums">
                  {ticker.bidPrice} / {ticker.askPrice}
                </dd>
              </div>
              <div className="rounded-xl border border-neutral-100 bg-white px-4 py-3">
                <dt className="text-xs font-medium text-neutral-500">Volume</dt>
                <dd className="mt-1 font-semibold tabular-nums">{ticker.volume}</dd>
              </div>
            </dl>
          ) : null}

          {depth && !marketError ? (
            <div className="mt-6 overflow-x-auto rounded-xl border border-neutral-100">
              <table className="w-full min-w-[280px] text-left text-sm">
                <thead className="bg-neutral-50 text-xs font-semibold uppercase tracking-wide text-neutral-500">
                  <tr>
                    <th className="px-4 py-2">Bid</th>
                    <th className="px-4 py-2">Size</th>
                    <th className="px-4 py-2">Ask</th>
                    <th className="px-4 py-2">Size</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-neutral-100">
                  {depth.bids.slice(0, 6).map((b, i) => {
                    const a = depth.asks[i];
                    return (
                      <tr key={i} className="tabular-nums">
                        <td className="px-4 py-2 text-emerald-700">{b[0]}</td>
                        <td className="px-4 py-2 text-neutral-600">{b[1]}</td>
                        <td className="px-4 py-2 text-red-700">{a?.[0] ?? "—"}</td>
                        <td className="px-4 py-2 text-neutral-600">{a?.[1] ?? "—"}</td>
                      </tr>
                    );
                  })}
                </tbody>
              </table>
            </div>
          ) : null}
        </section>
      ) : null}
    </div>
  );
}
