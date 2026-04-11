import { useMemo, useState } from "react";

export type TxFilter = "all" | "deposit" | "transfer" | "onramp" | "swap";

type Row = {
  id: string;
  type: TxFilter;
  title: string;
  detail: string;
  amount: string;
  status: "completed" | "pending" | "canceled";
};

const MOCK: Row[] = [
  {
    id: "1",
    type: "transfer",
    title: "Send",
    detail: "To @alex · 0x07F4…c2a1",
    amount: "12,812 MON",
    status: "completed",
  },
  {
    id: "2",
    type: "onramp",
    title: "Onramp",
    detail: "MoonPay · card",
    amount: "+ 50 USDC",
    status: "completed",
  },
  {
    id: "3",
    type: "swap",
    title: "Swap",
    detail: "MON → USDC · Kuru",
    amount: "100 MON",
    status: "completed",
  },
  {
    id: "4",
    type: "deposit",
    title: "Deposit",
    detail: "Bridge · USD",
    amount: "+ 25 USDC",
    status: "pending",
  },
];

const filters: { id: TxFilter; label: string }[] = [
  { id: "all", label: "All" },
  { id: "deposit", label: "Deposit" },
  { id: "transfer", label: "Transfer" },
  { id: "onramp", label: "Onramp" },
  { id: "swap", label: "Swap" },
];

export function DashboardTransactions() {
  const [filter, setFilter] = useState<TxFilter>("all");

  const rows = useMemo(() => {
    if (filter === "all") return MOCK;
    return MOCK.filter((r) => r.type === filter);
  }, [filter]);

  return (
    <section className="rounded-2xl border border-neutral-200/90 bg-white p-5 shadow-sm sm:p-6">
      <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
        <h2 className="font-sans text-lg font-semibold text-neutral-950">Your transactions</h2>
        <div
          className="flex flex-wrap gap-1.5 overflow-x-auto pb-1 sm:pb-0"
          role="tablist"
          aria-label="Filter transactions"
        >
          {filters.map((f) => (
            <button
              key={f.id}
              type="button"
              role="tab"
              aria-selected={filter === f.id}
              onClick={() => setFilter(f.id)}
              className={`shrink-0 rounded-full px-3 py-1.5 text-xs font-semibold transition-colors ${
                filter === f.id
                  ? "bg-neutral-900 text-white"
                  : "bg-neutral-100 text-neutral-600 hover:bg-neutral-200"
              }`}
            >
              {f.label}
            </button>
          ))}
        </div>
      </div>
      <ul className="mt-4 divide-y divide-neutral-100">
        {rows.map((r) => (
          <li key={r.id} className="flex flex-wrap items-center justify-between gap-2 py-3 first:pt-0">
            <div className="min-w-0">
              <p className="text-sm font-semibold text-neutral-900">{r.title}</p>
              <p className="truncate text-xs text-neutral-500">{r.detail}</p>
            </div>
            <div className="text-right">
              <p className="text-sm font-semibold tabular-nums text-neutral-900">{r.amount}</p>
              <p
                className={`text-xs font-medium capitalize ${
                  r.status === "completed"
                    ? "text-emerald-600"
                    : r.status === "pending"
                      ? "text-amber-600"
                      : "text-neutral-400"
                }`}
              >
                {r.status}
              </p>
            </div>
          </li>
        ))}
      </ul>
      <p className="mt-3 text-[11px] text-neutral-400">
        Mock history for UI — wire to indexer / RPC in production.
      </p>
    </section>
  );
}
