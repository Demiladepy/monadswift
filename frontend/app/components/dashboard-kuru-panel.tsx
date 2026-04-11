import { useEffect, useState } from "react";
import {
  fetchKuru24hrTicker,
  fetchKuruDepth,
  type Kuru24hrTicker,
  type KuruDepth,
} from "~/lib/kuru-public";
import { ECOSYSTEM, KURU_MAINNET } from "~/lib/ecosystem-links";

const DEFAULT_SYMBOL = "MON_USDC";

export function DashboardKuruPanel() {
  const [ticker, setTicker] = useState<Kuru24hrTicker | null>(null);
  const [depth, setDepth] = useState<KuruDepth | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    let cancelled = false;
    setLoading(true);
    setError(null);
    Promise.all([fetchKuru24hrTicker(DEFAULT_SYMBOL), fetchKuruDepth(DEFAULT_SYMBOL, 5)])
      .then(([t, d]) => {
        if (!cancelled) {
          setTicker(t);
          setDepth(d);
        }
      })
      .catch((e: unknown) => {
        if (!cancelled) {
          setError(e instanceof Error ? e.message : "Could not load Kuru");
        }
      })
      .finally(() => {
        if (!cancelled) setLoading(false);
      });
    return () => {
      cancelled = true;
    };
  }, []);

  return (
    <div className="space-y-6">
      <section className="rounded-2xl border border-neutral-200/90 bg-white p-5 shadow-sm sm:p-6">
        <p className="text-xs font-semibold uppercase tracking-wider text-monad">Atomic swaps</p>
        <h2 className="mt-1 font-sans text-xl font-semibold text-neutral-950">
          Trade on Kuru
        </h2>
        <p className="mt-2 max-w-2xl text-sm text-neutral-600">
          Simple MON ↔ stablecoin view powered by public market data. Full routing uses Kuru Flow (
          <a
            href={`${ECOSYSTEM.kuruDocs}/api-reference/generate-jwt-token`}
            className="font-medium text-monad underline-offset-2 hover:underline"
            target="_blank"
            rel="noreferrer"
          >
            JWT
          </a>{" "}
          +{" "}
          <a
            href={`${ECOSYSTEM.kuruDocs}/api-reference/calculate-best-path-quote`}
            className="font-medium text-monad underline-offset-2 hover:underline"
            target="_blank"
            rel="noreferrer"
          >
            quote
          </a>
          ) — best proxied from your backend in production to avoid CORS limits.
        </p>

        <div className="mt-6 grid gap-4 lg:grid-cols-2">
          <div className="rounded-xl border border-neutral-100 bg-neutral-50/80 p-4">
            <h3 className="text-xs font-semibold uppercase tracking-wide text-neutral-500">
              Pair
            </h3>
            <p className="mt-1 font-mono text-sm font-semibold text-neutral-900">{DEFAULT_SYMBOL}</p>
            <p className="mt-3 text-xs text-neutral-500">
              Official MON–USDC market on mainnet:{" "}
              <span className="break-all font-mono text-[11px] text-neutral-700">
                {KURU_MAINNET.monUsdcMarket}
              </span>
            </p>
          </div>
          <div className="rounded-xl border border-neutral-100 bg-neutral-50/80 p-4">
            <h3 className="text-xs font-semibold uppercase tracking-wide text-neutral-500">
              Tokens you can route
            </h3>
            <ul className="mt-2 space-y-1.5 text-sm text-neutral-700">
              <li>
                <span className="font-medium">WMON</span>{" "}
                <span className="break-all font-mono text-xs text-neutral-500">
                  {KURU_MAINNET.wmon}
                </span>
              </li>
              <li>
                <span className="font-medium">USDC</span>{" "}
                <span className="break-all font-mono text-xs text-neutral-500">
                  {KURU_MAINNET.usdc}
                </span>
              </li>
              <li className="text-xs text-neutral-500">
                More pairs and AUSD as listed in{" "}
                <a
                  href="https://docs.kuru.io/contracts/Contract-addresses"
                  target="_blank"
                  rel="noreferrer"
                  className="font-medium text-monad underline-offset-2 hover:underline"
                >
                  Kuru contract addresses
                </a>
                .
              </li>
            </ul>
          </div>
        </div>

        {loading ? (
          <p className="mt-6 text-sm text-neutral-500">Loading market data…</p>
        ) : error ? (
          <p className="mt-6 text-sm text-amber-700" role="alert">
            {error} — check ad-blockers or try again; CORS may block some networks.
          </p>
        ) : ticker ? (
          <dl className="mt-6 grid gap-3 sm:grid-cols-2 lg:grid-cols-4">
            <div className="rounded-xl border border-monad/15 bg-monad/5 px-4 py-3">
              <dt className="text-xs font-medium text-neutral-500">Last price</dt>
              <dd className="mt-1 font-sans text-xl font-semibold tabular-nums text-neutral-950">
                {ticker.lastPrice}
              </dd>
            </div>
            <div className="rounded-xl border border-neutral-100 bg-white px-4 py-3">
              <dt className="text-xs font-medium text-neutral-500">24h change</dt>
              <dd className="mt-1 font-semibold tabular-nums text-neutral-900">
                {ticker.priceChange} ({ticker.priceChangePercent}%)
              </dd>
            </div>
            <div className="rounded-xl border border-neutral-100 bg-white px-4 py-3">
              <dt className="text-xs font-medium text-neutral-500">Best bid / ask</dt>
              <dd className="mt-1 font-semibold tabular-nums text-neutral-900">
                {ticker.bidPrice} / {ticker.askPrice}
              </dd>
            </div>
            <div className="rounded-xl border border-neutral-100 bg-white px-4 py-3">
              <dt className="text-xs font-medium text-neutral-500">24h volume</dt>
              <dd className="mt-1 font-semibold tabular-nums text-neutral-900">{ticker.volume}</dd>
            </div>
          </dl>
        ) : null}

        {depth && !error ? (
          <div className="mt-6 overflow-x-auto rounded-xl border border-neutral-100">
            <table className="w-full min-w-[280px] text-left text-sm">
              <thead className="bg-neutral-50 text-xs font-semibold uppercase tracking-wide text-neutral-500">
                <tr>
                  <th className="px-4 py-2">Bid price</th>
                  <th className="px-4 py-2">Bid size</th>
                  <th className="px-4 py-2">Ask price</th>
                  <th className="px-4 py-2">Ask size</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-neutral-100">
                {depth.bids.slice(0, 4).map((b, i) => {
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
    </div>
  );
}
