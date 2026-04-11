import { useState } from "react";

type Props = {
  /** From Privy / `useMonadBalances` — may be `undefined` before a wallet exists. */
  walletAddress: string | null | undefined;
  onSimulatedSend?: () => void;
};

/**
 * UI + explanation for “send by email / @handle”.
 * Production: resolve handle → address via your Vault registry contract, then `eth_sendTransaction`.
 */
export function DashboardSocialSend({ walletAddress, onSimulatedSend }: Props) {
  const [handle, setHandle] = useState("");
  const [resolved, setResolved] = useState<string | null>(null);

  function mockResolve() {
    const h = handle.trim();
    if (!h) {
      setResolved(null);
      return;
    }
    // Demo only — replace with contract call.
    const mock = `0x${Array.from({ length: 40 }, () =>
      Math.floor(Math.random() * 16).toString(16),
    ).join("")}`;
    setResolved(mock);
  }

  return (
    <section className="rounded-2xl border border-neutral-200/90 bg-white p-5 shadow-sm sm:p-6">
      <p className="text-xs font-semibold uppercase tracking-wider text-monad">Social sending</p>
      <h2 className="mt-1 font-sans text-xl font-semibold text-neutral-950">Push-to-handle</h2>
      <p className="mt-2 max-w-2xl text-sm text-neutral-600">
        Users never paste a long hex: they enter an email or @username. Your{" "}
        <span className="font-medium text-neutral-800">Vault contract</span> keeps a mapping{" "}
        <code className="rounded bg-neutral-100 px-1 font-mono text-[11px]">handle → 0x address</code>
        . The app resolves the handle, then sends ERC-20 or native MON like any wallet transfer.
      </p>

      <div className="mt-6 rounded-xl border border-dashed border-monad/25 bg-monad/5 p-4">
        <label htmlFor="handle-input" className="text-xs font-semibold text-neutral-700">
          Email or @handle
        </label>
        <div className="mt-2 flex flex-col gap-2 sm:flex-row">
          <input
            id="handle-input"
            type="text"
            value={handle}
            onChange={(e) => {
              setHandle(e.target.value);
              setResolved(null);
            }}
            placeholder="alex@team.com or @alex"
            className="min-w-0 flex-1 rounded-xl border border-neutral-200 bg-white px-3 py-2.5 text-sm outline-none ring-monad/30 focus:ring-2"
          />
          <button
            type="button"
            onClick={mockResolve}
            className="rounded-xl bg-neutral-900 px-4 py-2.5 text-sm font-semibold text-white hover:bg-neutral-800"
          >
            Resolve
          </button>
        </div>
        {resolved ? (
          <p className="mt-3 break-all font-mono text-xs text-neutral-700">
            Resolved (demo): <span className="select-all">{resolved}</span>
          </p>
        ) : (
          <p className="mt-3 text-xs text-neutral-500">
            Hook <span className="font-mono">resolveHandle(bytes32)</span> on your registry instead of
            random bytes.
          </p>
        )}
        <button
          type="button"
          disabled={!walletAddress || !resolved}
          onClick={() => onSimulatedSend?.()}
          className="mt-4 w-full rounded-xl bg-monad px-4 py-3 text-sm font-semibold text-white shadow-sm hover:bg-monad-hover disabled:cursor-not-allowed disabled:opacity-50 sm:w-auto"
        >
          Send (demo)
        </button>
      </div>
    </section>
  );
}
