import { useEffect, useState } from "react";
import { FIAT_ONRAMP_ENABLED, MONAD_TESTNET_DOCS } from "~/lib/monad-chain";

export type DepositAsset = "MON" | "USDC";

type FundingSource = "faucet" | "moonpay_mock";

type Props = {
  depositAsset: DepositAsset;
  setDepositAsset: (a: DepositAsset) => void;
  walletAddress: string | null | undefined;
  balanceError: string | null;
  onCreateWallet: () => void;
  /** After the simulated MoonPay flow completes (e.g. refresh balances). */
  onMoonpayDemoComplete?: () => void;
};

const MOCK_CHECKOUT_MS = 2000;

export function DepositFundingBody({
  depositAsset,
  setDepositAsset,
  walletAddress,
  balanceError,
  onCreateWallet,
  onMoonpayDemoComplete,
}: Props) {
  const [fundingSource, setFundingSource] = useState<FundingSource>("faucet");
  const [usdAmount, setUsdAmount] = useState("50");
  const [moonpayPhase, setMoonpayPhase] = useState<"idle" | "processing" | "done">("idle");

  useEffect(() => {
    setMoonpayPhase("idle");
  }, [fundingSource]);

  function truncateAddr(a: string) {
    if (a.length < 12) return a;
    return `${a.slice(0, 6)}…${a.slice(-4)}`;
  }

  async function runMoonpayDemo() {
    if (!walletAddress || moonpayPhase === "processing") return;
    setMoonpayPhase("processing");
    await new Promise((r) => setTimeout(r, MOCK_CHECKOUT_MS));
    setMoonpayPhase("done");
    onMoonpayDemoComplete?.();
  }

  return (
    <div className="space-y-5">
      <div
        className="inline-flex rounded-full border border-neutral-200 bg-neutral-50 p-1"
        role="group"
        aria-label="Asset to display"
      >
        {(["MON", "USDC"] as const).map((a) => (
          <button
            key={a}
            type="button"
            onClick={() => setDepositAsset(a)}
            className={`rounded-full px-4 py-2 text-xs font-semibold transition-colors ${
              depositAsset === a ? "bg-monad text-white shadow-sm" : "text-neutral-600 hover:bg-white"
            }`}
          >
            {a}
          </button>
        ))}
      </div>

      {!walletAddress ? (
        <div>
          <p className="text-sm text-neutral-600">Create an embedded wallet to receive funds.</p>
          <button
            type="button"
            onClick={onCreateWallet}
            className="mt-3 rounded-full bg-monad px-5 py-2.5 text-sm font-semibold text-white shadow-sm hover:bg-monad-hover"
          >
            Create embedded wallet
          </button>
        </div>
      ) : balanceError ? (
        <p className="text-sm text-red-600">{balanceError}</p>
      ) : null}

      {walletAddress ? (
        <div className="space-y-3 border-t border-neutral-100 pt-4">
          <p className="text-xs font-semibold text-neutral-800">How to fund</p>
          <div
            className="inline-flex flex-wrap gap-2 rounded-xl border border-neutral-200 bg-neutral-50 p-1"
            role="group"
            aria-label="Funding method"
          >
            <button
              type="button"
              onClick={() => setFundingSource("faucet")}
              className={`rounded-lg px-3 py-2 text-xs font-semibold transition-colors ${
                fundingSource === "faucet"
                  ? "bg-white text-neutral-900 shadow-sm"
                  : "text-neutral-600 hover:bg-white/80"
              }`}
            >
              Testnet faucet
            </button>
            <button
              type="button"
              onClick={() => setFundingSource("moonpay_mock")}
              className={`rounded-lg px-3 py-2 text-xs font-semibold transition-colors ${
                fundingSource === "moonpay_mock"
                  ? "bg-white text-neutral-900 shadow-sm"
                  : "text-neutral-600 hover:bg-white/80"
              }`}
            >
              Card / MoonPay (demo)
            </button>
          </div>
        </div>
      ) : null}

      {walletAddress && fundingSource === "faucet" && !FIAT_ONRAMP_ENABLED ? (
        <div className="space-y-3">
          <p className="text-[13px] leading-relaxed text-neutral-600">
            Get native MON from the official Monad testnet faucet, then acquire test USDC from your
            team&apos;s deploy or a test tap.
          </p>
          <a
            href={MONAD_TESTNET_DOCS}
            target="_blank"
            rel="noreferrer"
            className="inline-flex text-sm font-semibold text-monad underline-offset-2 hover:underline"
          >
            Monad testnet documentation →
          </a>
        </div>
      ) : null}

      {walletAddress && fundingSource === "moonpay_mock" ? (
        <div className="space-y-4 rounded-2xl border border-violet-200/80 bg-linear-to-br from-violet-50/90 to-white p-4 shadow-sm">
          <div className="flex items-start justify-between gap-2">
            <div>
              <p className="text-xs font-bold uppercase tracking-wide text-violet-900/80">MoonPay-style checkout</p>
              <p className="mt-1 text-[13px] leading-relaxed text-neutral-600">
                Hackathon demo only — no card charge, no on-chain transfer. Simulates the post-payment
                screen you&apos;d see after MoonPay authorizes.
              </p>
            </div>
          </div>

          <div>
            <label htmlFor="moonpay-mock-usd" className="text-xs font-semibold text-neutral-700">
              Amount (USD)
            </label>
            <input
              id="moonpay-mock-usd"
              type="text"
              inputMode="decimal"
              value={usdAmount}
              onChange={(e) => setUsdAmount(e.target.value)}
              disabled={moonpayPhase === "processing"}
              className="mt-1.5 w-full rounded-xl border border-violet-100 bg-white px-3 py-2.5 font-mono text-sm outline-none ring-violet-300/30 focus:ring-2 disabled:opacity-60"
            />
          </div>

          <div className="rounded-xl border border-neutral-100 bg-white/80 px-3 py-2 text-[13px] text-neutral-700">
            <span className="text-neutral-500">Receive approx. </span>
            <span className="font-semibold tabular-nums text-neutral-900">
              {usdAmount || "0"} {depositAsset}
            </span>
            <span className="text-neutral-500"> · demo quote</span>
          </div>

          {moonpayPhase === "idle" || moonpayPhase === "processing" ? (
            <button
              type="button"
              disabled={moonpayPhase === "processing"}
              onClick={() => void runMoonpayDemo()}
              className="w-full rounded-full bg-violet-600 px-4 py-3 text-sm font-semibold text-white shadow-sm hover:bg-violet-700 disabled:cursor-wait disabled:opacity-90"
            >
              {moonpayPhase === "processing" ? "Processing with MoonPay…" : "Pay with card (simulated)"}
            </button>
          ) : null}

          {moonpayPhase === "processing" ? (
            <p className="text-center text-xs text-neutral-500">Opening secure checkout…</p>
          ) : null}

          {moonpayPhase === "done" ? (
            <div className="space-y-3 rounded-xl border border-emerald-200 bg-emerald-50/80 px-4 py-3 text-sm text-emerald-950">
              <p className="font-semibold">Payment authorized (demo)</p>
              <p className="text-[13px] leading-relaxed text-emerald-900/90">
                In production, MoonPay would settle crypto to your embedded wallet{" "}
                <span className="font-mono font-medium">{truncateAddr(walletAddress)}</span> on{" "}
                {depositAsset === "USDC" ? "the selected network" : "Monad"}.
              </p>
              <button
                type="button"
                onClick={() => setMoonpayPhase("idle")}
                className="text-sm font-semibold text-emerald-800 underline-offset-2 hover:underline"
              >
                Run demo again
              </button>
            </div>
          ) : null}
        </div>
      ) : null}

      {walletAddress && FIAT_ONRAMP_ENABLED ? (
        <p className="text-sm text-neutral-500">
          Fiat onramp UI is available when <code className="font-mono text-xs">FIAT_ONRAMP_ENABLED</code>{" "}
          is enabled in code.
        </p>
      ) : null}

    </div>
  );
}
