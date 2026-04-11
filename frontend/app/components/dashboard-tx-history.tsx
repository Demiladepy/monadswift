import type { DashboardTxRow } from "~/hooks/use-monad-tx-history";
import { monadAppChain } from "~/lib/monad-chain";

function formatTime(ms: number): string {
  try {
    return new Intl.DateTimeFormat(undefined, {
      month: "short",
      day: "numeric",
      hour: "2-digit",
      minute: "2-digit",
    }).format(ms);
  } catch {
    return new Date(ms).toLocaleString();
  }
}

function shortHash(h: string): string {
  if (h.length < 14) return h;
  return `${h.slice(0, 8)}…${h.slice(-6)}`;
}

type Props = {
  rows: DashboardTxRow[];
  loading: boolean;
  error: string | null;
  onRefresh: () => void;
};

export function DashboardTxHistory({ rows, loading, error, onRefresh }: Props) {
  const explorer = monadAppChain.blockExplorers?.default?.url;

  return (
    <section className="rounded-2xl border border-neutral-200/90 bg-white p-5 shadow-sm sm:p-6">
      <div className="flex flex-wrap items-start justify-between gap-3">
        <div>
          <p className="text-xs font-semibold uppercase tracking-wider text-monad">Activity</p>
          <h2 className="mt-1 font-sans text-lg font-semibold text-neutral-950">Your transactions</h2>
          <p className="mt-1 max-w-xl text-[13px] leading-relaxed text-neutral-500">
            Recent on-chain txs (last ~64 blocks) plus sends/swaps done in this app. Open in{" "}
            {monadAppChain.blockExplorers?.default?.name ?? "explorer"} for full history.
          </p>
        </div>
        <button
          type="button"
          onClick={() => void onRefresh()}
          disabled={loading}
          className="shrink-0 rounded-full border border-neutral-200 bg-white px-3 py-1.5 text-xs font-semibold text-neutral-700 hover:bg-neutral-50 disabled:opacity-50"
        >
          {loading ? "Refreshing…" : "Refresh"}
        </button>
      </div>

      {error ? (
        <p className="mt-4 text-sm text-amber-800" role="alert">
          {error}
        </p>
      ) : null}

      {!loading && rows.length === 0 && !error ? (
        <p className="mt-4 text-sm text-neutral-500">
          No recent transactions in the scanned window. Send MON or swap — activity appears here.
        </p>
      ) : null}

      {rows.length > 0 ? (
        <div className="mt-4 overflow-x-auto rounded-xl border border-neutral-100">
          <table className="w-full min-w-[520px] text-left text-sm">
            <thead className="bg-neutral-50 text-xs font-semibold uppercase tracking-wide text-neutral-500">
              <tr>
                <th className="px-3 py-2">Time</th>
                <th className="px-3 py-2">Type</th>
                <th className="px-3 py-2">Value</th>
                <th className="px-3 py-2">Tx</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-neutral-100">
              {rows.map((row) => {
                const isStored = "kind" in row && row.kind === "stored";
                const hash = row.hash;
                const txUrl = explorer ? `${explorer}/tx/${hash}` : null;
                return (
                  <tr key={hash} className="tabular-nums text-neutral-800">
                    <td className="whitespace-nowrap px-3 py-2.5 text-[13px] text-neutral-600">
                      {formatTime(row.timestamp)}
                    </td>
                    <td className="px-3 py-2.5">
                      {isStored ? (
                        <span className="rounded-full bg-violet-100 px-2 py-0.5 text-[11px] font-semibold text-violet-900">
                          {row.source === "swap" ? "Swap" : row.source === "send" ? "Send" : "App"}
                        </span>
                      ) : (
                        <span
                          className={`rounded-full px-2 py-0.5 text-[11px] font-semibold ${
                            row.direction === "in"
                              ? "bg-emerald-100 text-emerald-900"
                              : row.direction === "out"
                                ? "bg-sky-100 text-sky-900"
                                : "bg-neutral-100 text-neutral-700"
                          }`}
                        >
                          {row.direction === "in" ? "In" : row.direction === "out" ? "Out" : "Self"}
                        </span>
                      )}
                    </td>
                    <td className="px-3 py-2.5 font-mono text-[13px] text-neutral-700">
                      {isStored ? "—" : row.valueLabel ?? "—"}
                    </td>
                    <td className="px-3 py-2.5">
                      {txUrl ? (
                        <a
                          href={txUrl}
                          target="_blank"
                          rel="noreferrer"
                          className="font-mono text-[12px] font-medium text-monad underline-offset-2 hover:underline"
                        >
                          {shortHash(hash)}
                        </a>
                      ) : (
                        <span className="font-mono text-[12px]">{shortHash(hash)}</span>
                      )}
                    </td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        </div>
      ) : null}
    </section>
  );
}
