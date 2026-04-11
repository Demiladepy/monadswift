import { useSendTransaction } from "@privy-io/react-auth";
import { useEffect, useMemo, useState } from "react";
import { parseUnits } from "viem";
import { MONAD_APP_CHAIN_ID, monadAppChain } from "~/lib/monad-chain";
import {
  classifyRecipient,
  resolutionConfigured,
  resolveSocialRecipient,
} from "~/lib/resolve-recipient";
import { appendWalletTx } from "~/lib/wallet-tx-store";

type Props = {
  /** From Privy / `useMonadBalances` — may be `undefined` before a wallet exists. */
  walletAddress: string | null | undefined;
  /** Use inside `DashboardActionModal` — no outer card chrome. */
  variant?: "page" | "modal";
  /** Optional MON balance hint (e.g. from `useMonadBalances`). */
  balanceMon?: string | null;
  /** After a successful on-chain send (native MON). */
  onSent?: () => void;
  /** Extra feedback when a send is confirmed (e.g. speedometer). */
  onConfirmSend?: (to: `0x${string}`) => void;
};

export function DashboardSocialSend({
  walletAddress,
  variant = "page",
  balanceMon,
  onSent,
  onConfirmSend,
}: Props) {
  const { sendTransaction } = useSendTransaction();
  const isModal = variant === "modal";
  const Outer = isModal ? "div" : "section";
  const outerClass = isModal
    ? "space-y-4"
    : "rounded-2xl border border-neutral-200/90 bg-white p-5 shadow-sm sm:p-6";

  const [input, setInput] = useState("");
  const [amount, setAmount] = useState("");
  const parsed = useMemo(() => classifyRecipient(input), [input]);

  /** When user resolved a social id, remember until the label changes. */
  const [resolvedTo, setResolvedTo] = useState<`0x${string}` | null>(null);
  const [resolvedLabel, setResolvedLabel] = useState<string | null>(null);

  const [resolving, setResolving] = useState(false);
  const [resolveError, setResolveError] = useState<string | null>(null);
  const [txBusy, setTxBusy] = useState(false);
  const [txError, setTxError] = useState<string | null>(null);
  const [sentTxHash, setSentTxHash] = useState<string | null>(null);
  const [copiedHash, setCopiedHash] = useState(false);

  const configOk = resolutionConfigured();

  useEffect(() => {
    const p = classifyRecipient(input);
    if (p.kind !== "social") {
      setResolvedTo(null);
      setResolvedLabel(null);
      return;
    }
    if (resolvedLabel !== null && p.label !== resolvedLabel) {
      setResolvedTo(null);
      setResolvedLabel(null);
    }
  }, [input, resolvedLabel]);

  const effectiveTo: `0x${string}` | null =
    parsed.kind === "address"
      ? parsed.to
      : parsed.kind === "social" && resolvedTo && resolvedLabel === parsed.label
        ? resolvedTo
        : null;

  const amountOk = (() => {
    const n = Number.parseFloat(amount.trim());
    return Number.isFinite(n) && n > 0;
  })();

  const canSend =
    Boolean(walletAddress && effectiveTo && amountOk && !resolving && !txBusy);

  async function onResolve() {
    if (parsed.kind !== "social") return;
    setResolveError(null);
    setResolving(true);
    try {
      const r = await resolveSocialRecipient(parsed.label);
      if (!r.ok) {
        setResolveError(r.error);
        setResolvedTo(null);
        setResolvedLabel(null);
        return;
      }
      setResolvedTo(r.to);
      setResolvedLabel(parsed.label);
    } finally {
      setResolving(false);
    }
  }

  async function handleSend() {
    setTxError(null);
    setSentTxHash(null);
    if (!walletAddress || !amountOk) return;

    let to: `0x${string}` | null = null;
    if (parsed.kind === "address") {
      to = parsed.to;
    } else if (parsed.kind === "social") {
      if (resolvedTo && resolvedLabel === parsed.label) {
        to = resolvedTo;
      } else {
        setResolving(true);
        try {
          const r = await resolveSocialRecipient(parsed.label);
          if (!r.ok) {
            setResolveError(r.error);
            return;
          }
          to = r.to;
          setResolvedTo(r.to);
          setResolvedLabel(parsed.label);
        } finally {
          setResolving(false);
        }
      }
    } else {
      return;
    }

    if (!to) return;

    let wei: bigint;
    try {
      wei = parseUnits(amount.trim(), 18);
    } catch {
      setTxError("Enter a valid MON amount");
      return;
    }

    setTxBusy(true);
    try {
      const { hash } = await sendTransaction({
        to,
        value: wei,
        chainId: MONAD_APP_CHAIN_ID,
      });
      setSentTxHash(hash);
      setCopiedHash(false);
      if (walletAddress) appendWalletTx(walletAddress, hash, "send");
      onConfirmSend?.(to);
      onSent?.();
    } catch (e) {
      setTxError(e instanceof Error ? e.message : "Transaction failed");
    } finally {
      setTxBusy(false);
    }
  }

  const explorerTxUrl =
    sentTxHash && monadAppChain.blockExplorers?.default?.url
      ? `${monadAppChain.blockExplorers.default.url}/tx/${sentTxHash}`
      : null;

  async function copyTxHash() {
    if (!sentTxHash || !navigator.clipboard?.writeText) return;
    await navigator.clipboard.writeText(sentTxHash);
    setCopiedHash(true);
    window.setTimeout(() => setCopiedHash(false), 2000);
  }

  return (
    <Outer className={outerClass}>
      {!isModal ? (
        <>
          <p className="text-xs font-semibold uppercase tracking-wider text-monad">Social sending</p>
          <h2 className="mt-1 font-sans text-xl font-semibold text-neutral-950">Push-to-handle</h2>
        </>
      ) : null}

      <div
        className={`space-y-4 rounded-xl border border-dashed border-neutral-200 bg-neutral-50/80 p-4 ${isModal ? "mt-0" : "mt-6"}`}
      >
        <div>
          <label htmlFor="recipient-input" className="text-xs font-semibold text-neutral-700">
            Recipient
          </label>
          <input
            id="recipient-input"
            type="text"
            value={input}
            onChange={(e) => {
              setInput(e.target.value);
              setResolveError(null);
              setTxError(null);
              setSentTxHash(null);
            }}
            placeholder="0x… or you@email.com or @alice"
            autoComplete="off"
            className="mt-2 w-full rounded-xl border border-neutral-200 bg-white px-3 py-2.5 font-mono text-sm text-neutral-900 outline-none ring-monad/25 placeholder:text-neutral-400 placeholder:font-sans focus:border-monad/40 focus:ring-2"
          />
        </div>

        {parsed.kind === "invalid" ? (
          <p className="text-xs text-red-600" role="alert">
            Use a valid 0x address (42 chars), an email, or an @handle.
          </p>
        ) : null}

        {parsed.kind === "social" ? (
          <div className="space-y-2">
            {!configOk ? (
              <p className="text-xs text-amber-800">
                Add resolver env vars to enable email / @handle lookup.
              </p>
            ) : null}
            {resolveError ? (
              <p className="text-xs text-red-600" role="alert">
                {resolveError}
              </p>
            ) : null}
            <div className="flex flex-wrap items-center gap-2">
              <button
                type="button"
                disabled={!walletAddress || !configOk || resolving}
                onClick={() => void onResolve()}
                className="rounded-xl border border-monad/30 bg-white px-4 py-2 text-sm font-semibold text-monad hover:bg-monad/5 disabled:cursor-not-allowed disabled:opacity-50"
              >
                {resolving ? "Looking up…" : "Look up recipient"}
              </button>
              {resolvedTo && resolvedLabel === parsed.label ? (
                <span className="text-xs text-emerald-800">
                  → <span className="font-mono">{resolvedTo}</span>
                </span>
              ) : null}
            </div>
          </div>
        ) : null}

        {parsed.kind === "address" ? (
          <p className="text-xs text-emerald-800">Valid address — enter an amount and send.</p>
        ) : null}

        <div>
          <label htmlFor="send-amount" className="text-xs font-semibold text-neutral-700">
            Amount (MON)
          </label>
          <input
            id="send-amount"
            type="text"
            inputMode="decimal"
            value={amount}
            onChange={(e) => {
              setAmount(e.target.value);
              setTxError(null);
              setSentTxHash(null);
            }}
            placeholder="0.0"
            className="mt-2 w-full rounded-xl border border-neutral-200 bg-white px-3 py-2.5 font-mono text-sm text-neutral-900 outline-none ring-monad/25 focus:border-monad/40 focus:ring-2"
          />
          {balanceMon !== null && balanceMon !== undefined ? (
            <p className="mt-1 text-xs text-neutral-500">
              Available:{" "}
              {Number.parseFloat(balanceMon).toLocaleString(undefined, { maximumFractionDigits: 6 })} MON
            </p>
          ) : null}
        </div>

        {txError ? (
          <p className="text-xs text-red-600" role="alert">
            {txError}
          </p>
        ) : null}

        {sentTxHash ? (
          <div className="rounded-xl border border-emerald-200 bg-emerald-50/90 px-3 py-3 text-sm text-emerald-950">
            <p className="font-semibold text-emerald-900">Transaction sent</p>
            <p className="mt-1 break-all font-mono text-[13px] leading-snug text-emerald-950/95">{sentTxHash}</p>
            <div className="mt-2 flex flex-wrap gap-2">
              {explorerTxUrl ? (
                <a
                  href={explorerTxUrl}
                  target="_blank"
                  rel="noreferrer"
                  className="inline-flex rounded-lg bg-emerald-700 px-3 py-1.5 text-xs font-semibold text-white hover:bg-emerald-800"
                >
                  View on {monadAppChain.blockExplorers?.default?.name ?? "explorer"}
                </a>
              ) : null}
              <button
                type="button"
                onClick={() => void copyTxHash()}
                className="inline-flex rounded-lg border border-emerald-300 bg-white px-3 py-1.5 text-xs font-semibold text-emerald-900 hover:bg-emerald-100/80"
              >
                {copiedHash ? "Copied" : "Copy hash"}
              </button>
            </div>
          </div>
        ) : null}

        <button
          type="button"
          disabled={!canSend}
          onClick={() => void handleSend()}
          className="w-full rounded-xl bg-monad px-4 py-3 text-sm font-semibold text-white shadow-sm hover:bg-monad-hover disabled:cursor-not-allowed disabled:bg-neutral-200 disabled:text-neutral-500 sm:w-auto"
        >
          {txBusy ? "Sending…" : "Send MON"}
        </button>
        {!walletAddress ? (
          <p className="text-xs text-amber-700">Create an embedded wallet first.</p>
        ) : null}
      </div>
    </Outer>
  );
}
