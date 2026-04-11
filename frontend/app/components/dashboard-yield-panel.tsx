import { ECOSYSTEM } from "~/lib/ecosystem-links";

export function DashboardYieldPanel() {
  return (
    <section className="rounded-2xl border border-neutral-200/90 bg-white p-5 shadow-sm sm:p-6">
      <p className="text-xs font-semibold uppercase tracking-wider text-monad">Swift-Yield</p>
      <h2 className="mt-1 font-sans text-xl font-semibold text-neutral-950">One-tap vaults</h2>
      <p className="mt-2 max-w-2xl text-sm text-neutral-600">
        Deposit MON or stables into curated yield routes. The Nano-Bank UI abstracts routing; under
        the hood, partners like Kintsu and Magma handle staking and vault logic on Monad.
      </p>
      <div className="mt-6 grid gap-4 sm:grid-cols-2">
        <a
          href={ECOSYSTEM.kintsu.url}
          target="_blank"
          rel="noreferrer"
          className="group rounded-2xl border border-neutral-200 bg-gradient-to-br from-white to-violet-50/50 p-5 transition-shadow hover:shadow-md"
        >
          <p className="text-xs font-semibold uppercase tracking-wide text-monad">Partner</p>
          <h3 className="mt-2 font-sans text-lg font-semibold text-neutral-950">
            {ECOSYSTEM.kintsu.name}
          </h3>
          <p className="mt-2 text-sm text-neutral-600">{ECOSYSTEM.kintsu.description}</p>
          <span className="mt-4 inline-flex items-center text-sm font-semibold text-monad group-hover:underline">
            Open app →
          </span>
        </a>
        <a
          href={ECOSYSTEM.magma.url}
          target="_blank"
          rel="noreferrer"
          className="group rounded-2xl border border-neutral-200 bg-gradient-to-br from-white to-orange-50/40 p-5 transition-shadow hover:shadow-md"
        >
          <p className="text-xs font-semibold uppercase tracking-wide text-amber-700">Partner</p>
          <h3 className="mt-2 font-sans text-lg font-semibold text-neutral-950">
            {ECOSYSTEM.magma.name}
          </h3>
          <p className="mt-2 text-sm text-neutral-600">{ECOSYSTEM.magma.description}</p>
          <span className="mt-4 inline-flex items-center text-sm font-semibold text-monad group-hover:underline">
            Open app →
          </span>
        </a>
      </div>
      <p className="mt-4 text-xs text-neutral-400">
        Wire “Deposit to vault” buttons to your router contract or partner SDK when ready.
      </p>
    </section>
  );
}
