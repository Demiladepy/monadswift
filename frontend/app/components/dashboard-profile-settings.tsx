import { useState } from "react";
import { MONAD_APP_CHAIN_ID, MONAD_APP_USDC, monadAppChain } from "~/lib/monad-chain";

type Props = {
  email: string | null;
  walletAddress: string | null | undefined;
};

export function DashboardProfileSettings({ email, walletAddress }: Props) {
  const [copiedField, setCopiedField] = useState<"address" | "usdc" | null>(null);

  async function copy(text: string, field: "address" | "usdc") {
    if (!navigator.clipboard?.writeText) return;
    await navigator.clipboard.writeText(text);
    setCopiedField(field);
    window.setTimeout(() => setCopiedField(null), 2000);
  }

  return (
    <section className="rounded-2xl border border-neutral-200/90 bg-white p-5 shadow-sm sm:p-6">
      <h2 className="font-sans text-lg font-semibold text-neutral-950">Profile &amp; settings</h2>
      <p className="mt-1 text-sm text-neutral-600">
        Your Privy login and embedded wallet on{" "}
        <span className="font-medium text-monad">{monadAppChain.name}</span> (chain {MONAD_APP_CHAIN_ID}
        ).
      </p>

      <dl className="mt-6 space-y-5 border-t border-neutral-100 pt-6">
        <div>
          <dt className="text-xs font-semibold uppercase tracking-wide text-neutral-500">
            Connected email
          </dt>
          <dd className="mt-1.5 break-all text-sm font-medium text-neutral-900">
            {email ?? (
              <span className="font-normal text-neutral-500">
                No email on this account (e.g. wallet-only login).
              </span>
            )}
          </dd>
        </div>

        <div>
          <dt className="text-xs font-semibold uppercase tracking-wide text-neutral-500">
            Generated address
          </dt>
          <dd className="mt-1.5 flex flex-col gap-2 sm:flex-row sm:items-start sm:justify-between">
            <span className="break-all font-mono text-sm text-neutral-900">
              {walletAddress ?? (
                <span className="font-sans font-normal text-neutral-500">
                  No embedded wallet yet — create one from the dashboard home.
                </span>
              )}
            </span>
            {walletAddress ? (
              <button
                type="button"
                onClick={() => void copy(walletAddress, "address")}
                className="shrink-0 rounded-full border border-neutral-200 bg-white px-3 py-1.5 text-xs font-semibold text-neutral-800 hover:bg-neutral-50"
              >
                {copiedField === "address" ? "Copied" : "Copy"}
              </button>
            ) : null}
          </dd>
        </div>

        <div>
          <dt className="text-xs font-semibold uppercase tracking-wide text-neutral-500">
            USDC (ERC-20) on this network
          </dt>
          <dd className="mt-1.5 flex flex-col gap-2 sm:flex-row sm:items-start sm:justify-between">
            <span className="break-all font-mono text-xs text-neutral-800">{MONAD_APP_USDC}</span>
            <button
              type="button"
              onClick={() => void copy(MONAD_APP_USDC, "usdc")}
              className="shrink-0 rounded-full border border-neutral-200 bg-white px-3 py-1.5 text-xs font-semibold text-neutral-800 hover:bg-neutral-50"
            >
              {copiedField === "usdc" ? "Copied" : "Copy"}
            </button>
          </dd>
        </div>
      </dl>
    </section>
  );
}
