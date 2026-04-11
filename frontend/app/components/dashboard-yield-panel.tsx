export function DashboardYieldPanel() {
  return (
    <section className="rounded-2xl border border-neutral-200/90 bg-white p-5 shadow-sm sm:p-6">
      <p className="text-xs font-semibold uppercase tracking-wider text-monad">Swift-Yield</p>
      <h2 className="mt-1 font-sans text-xl font-semibold text-neutral-950">One-tap vaults</h2>
      <p className="mt-2 max-w-2xl text-sm text-neutral-600">
        Deposit MON or stables into curated yield routes. Partner vaults (e.g. Kintsu, Magma on Monad)
        can be wired here via their SDKs or your router contract—no outbound links until you plug in
        live integrations.
      </p>
      <div className="mt-6 grid gap-4 sm:grid-cols-2">
        <div className="rounded-2xl border border-neutral-200 bg-gradient-to-br from-white to-violet-50/50 p-5">
          <p className="text-xs font-semibold uppercase tracking-wide text-monad">Partner slot</p>
          <h3 className="mt-2 font-sans text-lg font-semibold text-neutral-950">Kintsu</h3>
          <p className="mt-2 text-sm text-neutral-600">
            Liquid staking — connect vault SDK when you have a deployment URL and ABI.
          </p>
        </div>
        <div className="rounded-2xl border border-neutral-200 bg-gradient-to-br from-white to-orange-50/40 p-5">
          <p className="text-xs font-semibold uppercase tracking-wide text-amber-700">Partner slot</p>
          <h3 className="mt-2 font-sans text-lg font-semibold text-neutral-950">Magma</h3>
          <p className="mt-2 text-sm text-neutral-600">
            Monad-native yield — same pattern: add contract + transaction flow in-app.
          </p>
        </div>
      </div>
      <p className="mt-4 text-xs text-neutral-400">
        Wire “Deposit to vault” to your router or partner SDK when ready.
      </p>
    </section>
  );
}
