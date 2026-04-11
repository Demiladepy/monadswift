import { useCreateWallet, usePrivy, useSendTransaction } from "@privy-io/react-auth";
import { BigNumber } from "ethers";
import { useCallback, useEffect, useState } from "react";
import {
  KURU_TESTNET_SWAP_OUT,
  kuruEncodeTestnetMonToTokenSwap,
  kuruTestnetMarketFor,
  type KuruTestnetOutOption,
} from "~/lib/kuru-testnet-swap";
import { useKuruSwapBalances } from "~/hooks/use-kuru-swap-balances";
import { MONAD_APP_CHAIN_ID, monadAppChain } from "~/lib/monad-chain";
import { appendWalletTx } from "~/lib/wallet-tx-store";

type Props = {
  walletAddress: `0x${string}` | undefined;
  /** Lift receive token for market data below the card */
  receiveSymbol?: string;
  onReceiveSymbolChange?: (symbol: string) => void;
};

/** Formatted wallet balance; unknown / error → `0` (no em dash). */
function formatBalanceDisplay(raw: string | null, maxFrac = 6): string {
  if (raw === null || raw === "—" || raw.trim() === "") return "0";
  const n = Number.parseFloat(raw);
  if (!Number.isFinite(n)) return "0";
  return n.toLocaleString(undefined, { maximumFractionDigits: maxFrac });
}

function TokenBadge({ symbol, active }: { symbol: string; active?: boolean }) {
  const initial = symbol.slice(0, 3).toUpperCase();
  return (
    <span
      className={`flex h-9 w-9 shrink-0 items-center justify-center rounded-full text-[10px] font-bold uppercase tracking-tight ring-2 ${
        active
          ? "bg-monad/15 text-monad ring-monad/35"
          : "bg-neutral-100 text-neutral-700 ring-neutral-200"
      }`}
    >
      {initial}
    </span>
  );
}

export function KuruSdkSwapWidget({
  walletAddress,
  receiveSymbol: receiveSymbolControlled,
  onReceiveSymbolChange,
}: Props) {
  const { authenticated, login } = usePrivy();
  const { createWallet } = useCreateWallet();
  const { sendTransaction } = useSendTransaction();
  const { balanceForSymbol, loading: balanceLoading, refresh: refreshBalances } =
    useKuruSwapBalances(walletAddress);

  const [out, setOut] = useState<KuruTestnetOutOption>(KURU_TESTNET_SWAP_OUT[0]!);
  useEffect(() => {
    if (!receiveSymbolControlled) return;
    const match = KURU_TESTNET_SWAP_OUT.find((t) => t.symbol === receiveSymbolControlled);
    if (match) setOut(match);
  }, [receiveSymbolControlled]);

  const setReceive = useCallback(
    (next: KuruTestnetOutOption) => {
      setOut(next);
      onReceiveSymbolChange?.(next.symbol);
    },
    [onReceiveSymbolChange],
  );

  const [amountMon, setAmountMon] = useState("");
  const [busy, setBusy] = useState(false);
  const [err, setErr] = useState<string | null>(null);
  const [txHash, setTxHash] = useState<string | null>(null);
  const [copied, setCopied] = useState(false);
  const [tab, setTab] = useState<"market" | "limit" | "recurring">("market");
  const [flipped, setFlipped] = useState(false);
  const [pasteMsg, setPasteMsg] = useState<string | null>(null);
  const [ultra, setUltra] = useState(false);

  const market = kuruTestnetMarketFor(out.symbol);
  const sellMonNotToken = !flipped;

  const sellSymbol = sellMonNotToken ? "MON" : out.symbol;
  const buySymbol = sellMonNotToken ? out.symbol : "MON";

  const canSwap =
    !!walletAddress &&
    !!market &&
    sellMonNotToken &&
    amountMon.trim() !== "" &&
    Number.parseFloat(amountMon) > 0 &&
    !Number.isNaN(Number.parseFloat(amountMon));

  async function onSwap() {
    if (!walletAddress || !market || !canSwap) return;
    setBusy(true);
    setErr(null);
    setTxHash(null);
    try {
      const amt = Number.parseFloat(amountMon);
      const tx = kuruEncodeTestnetMonToTokenSwap({
        market,
        toToken: out.address,
        amountMon: amt,
        minAmountOut: BigNumber.from(0),
      });
      const { hash } = await sendTransaction({
        to: tx.to,
        data: tx.data,
        value: tx.value,
        chainId: MONAD_APP_CHAIN_ID,
      });
      setTxHash(hash);
      appendWalletTx(walletAddress, hash, "swap");
      void refreshBalances();
    } catch (e) {
      setErr(e instanceof Error ? e.message : "Swap failed");
    } finally {
      setBusy(false);
    }
  }

  const explorerTx =
    txHash && monadAppChain.blockExplorers?.default?.url
      ? `${monadAppChain.blockExplorers.default.url}/tx/${txHash}`
      : null;

  async function copyHash() {
    if (!txHash || !navigator.clipboard?.writeText) return;
    await navigator.clipboard.writeText(txHash);
    setCopied(true);
    window.setTimeout(() => setCopied(false), 2000);
  }

  async function onPasteCa() {
    setPasteMsg(null);
    try {
      const text = await navigator.clipboard.readText();
      const t = text.trim();
      if (/^0x[a-fA-F0-9]{40}$/.test(t)) {
        setPasteMsg(`Got CA ${t.slice(0, 6)}…${t.slice(-4)} (reference only)`);
        window.setTimeout(() => setPasteMsg(null), 4000);
      } else {
        setPasteMsg("Clipboard is not a 0x address");
        window.setTimeout(() => setPasteMsg(null), 3000);
      }
    } catch {
      setPasteMsg("Could not read clipboard");
      window.setTimeout(() => setPasteMsg(null), 3000);
    }
  }

  const needsWallet = !authenticated || !walletAddress;

  return (
    <div className="relative overflow-hidden rounded-[1.35rem] border border-neutral-200 bg-white shadow-[0_8px_40px_-12px_rgba(0,0,0,0.12)]">
      <div className="relative p-4 sm:p-5">
        <div className="flex items-start justify-between gap-3">
          <div className="flex flex-wrap gap-1.5">
            {(
              [
                { id: "market" as const, label: "Market" },
                { id: "limit" as const, label: "Limit" },
                { id: "recurring" as const, label: "Recurring" },
              ] as const
            ).map(({ id, label }) => (
              <button
                key={id}
                type="button"
                disabled={id !== "market"}
                onClick={() => setTab(id)}
                className={`rounded-full px-3.5 py-1.5 text-xs font-semibold transition-colors ${
                  tab === id
                    ? "bg-monad text-white shadow-sm"
                    : id === "market"
                      ? "text-neutral-500 hover:bg-neutral-100 hover:text-neutral-800"
                      : "cursor-not-allowed text-neutral-300"
                }`}
              >
                {label}
              </button>
            ))}
          </div>
          <div className="flex shrink-0 gap-1.5">
            <button
              type="button"
              onClick={() => void onPasteCa()}
              className="inline-flex items-center gap-1 rounded-full border border-neutral-200 bg-white px-2.5 py-1 text-[11px] font-semibold text-neutral-600 shadow-sm hover:border-neutral-300 hover:bg-neutral-50"
            >
              <span aria-hidden>📋</span>
              Paste CA
            </button>
            <button
              type="button"
              onClick={() => setUltra((u) => !u)}
              className={`inline-flex items-center gap-1 rounded-full border px-2.5 py-1 text-[11px] font-semibold transition-colors ${
                ultra
                  ? "border-monad/40 bg-monad/10 text-monad"
                  : "border-neutral-200 bg-white text-neutral-500 shadow-sm hover:bg-neutral-50"
              }`}
            >
              <span aria-hidden>✦</span>
              Ultra
            </button>
          </div>
        </div>
        {pasteMsg ? <p className="mt-2 text-center text-[11px] text-neutral-500">{pasteMsg}</p> : null}

        <div className="mt-5 space-y-0 rounded-2xl border border-neutral-200 bg-neutral-50/80">
          {/* Sell row */}
          <div className="p-4">
            <div className="flex items-center justify-between gap-2">
              <p className="text-[11px] font-medium uppercase tracking-wide text-neutral-500">Sell</p>
            </div>
            <div className="mt-2 flex items-center gap-3">
              <div className="flex min-w-0 flex-1 items-center gap-2 rounded-xl border border-neutral-200 bg-white py-1.5 pl-2 pr-2 shadow-sm">
                <TokenBadge symbol={sellMonNotToken ? "MON" : out.symbol} active={sellMonNotToken} />
                <div className="min-w-0 flex-1">
                  <span className="block truncate text-sm font-semibold text-neutral-900">
                    {sellMonNotToken ? "MON" : out.symbol}
                  </span>
                  {!sellMonNotToken ? (
                    <select
                      aria-label="Token to sell"
                      value={out.symbol}
                      onChange={(e) => {
                        const next = KURU_TESTNET_SWAP_OUT.find((t) => t.symbol === e.target.value);
                        if (next) setReceive(next);
                      }}
                      className="mt-0.5 w-full cursor-pointer bg-transparent text-[11px] text-neutral-500 outline-none"
                    >
                      {KURU_TESTNET_SWAP_OUT.map((t) => (
                        <option key={t.symbol} value={t.symbol}>
                          {t.symbol}
                        </option>
                      ))}
                    </select>
                  ) : (
                    <span className="text-[11px] text-neutral-500">Native</span>
                  )}
                </div>
                <span className="text-neutral-400">▾</span>
              </div>
              <div className="text-right">
                <label className="sr-only" htmlFor="kuru-sell-amount">
                  Amount
                </label>
                <input
                  id="kuru-sell-amount"
                  type="text"
                  inputMode="decimal"
                  disabled={!sellMonNotToken}
                  value={sellMonNotToken ? amountMon : ""}
                  onChange={(e) => {
                    setAmountMon(e.target.value);
                    setTxHash(null);
                  }}
                  placeholder="0.00"
                  className="w-28 bg-transparent text-right font-mono text-xl font-semibold tabular-nums text-neutral-900 outline-none placeholder:text-neutral-300 disabled:cursor-not-allowed disabled:opacity-40 sm:w-36"
                />
                {walletAddress ? (
                  <p className="text-[11px] text-neutral-500">
                    <span className="text-neutral-400">Balance </span>
                    <span className="font-mono font-semibold tabular-nums text-neutral-800">
                      {balanceLoading ? "…" : formatBalanceDisplay(balanceForSymbol(sellSymbol))}
                    </span>
                    <span className="text-neutral-500"> {sellSymbol}</span>
                  </p>
                ) : null}
              </div>
            </div>
          </div>

          <div className="relative flex justify-center py-1">
            <button
              type="button"
              onClick={() => {
                setFlipped((f) => !f);
                setErr(null);
                setTxHash(null);
              }}
              className="relative z-10 flex h-10 w-10 items-center justify-center rounded-full border border-neutral-200 bg-white text-neutral-600 shadow-md hover:border-monad/40 hover:text-monad"
              aria-label="Flip sell and buy"
            >
              <span className="text-lg leading-none">⇅</span>
            </button>
          </div>

          {/* Buy row */}
          <div className="border-t border-neutral-200 bg-white/60 p-4">
            <div className="flex items-center justify-between gap-2">
              <p className="text-[11px] font-medium uppercase tracking-wide text-neutral-500">Buy</p>
            </div>
            <div className="mt-2 flex items-center gap-3">
              <div className="flex min-w-0 flex-1 items-center gap-2 rounded-xl border border-neutral-200 bg-white py-1.5 pl-2 pr-2 shadow-sm">
                <TokenBadge symbol={sellMonNotToken ? out.symbol : "MON"} active={!sellMonNotToken} />
                <div className="min-w-0 flex-1">
                  <span className="block truncate text-sm font-semibold text-neutral-900">
                    {sellMonNotToken ? out.symbol : "MON"}
                  </span>
                  {sellMonNotToken ? (
                    <select
                      aria-label="Token to buy"
                      value={out.symbol}
                      onChange={(e) => {
                        const next = KURU_TESTNET_SWAP_OUT.find((t) => t.symbol === e.target.value);
                        if (next) setReceive(next);
                      }}
                      className="mt-0.5 w-full cursor-pointer bg-transparent text-[11px] text-neutral-500 outline-none"
                    >
                      {KURU_TESTNET_SWAP_OUT.map((t) => (
                        <option key={t.symbol} value={t.symbol}>
                          {t.symbol}
                        </option>
                      ))}
                    </select>
                  ) : (
                    <span className="text-[11px] text-neutral-500">Native</span>
                  )}
                </div>
                <span className="text-neutral-400">▾</span>
              </div>
              <div className="text-right">
                {walletAddress ? (
                  <>
                    <p className="font-mono text-xl font-semibold tabular-nums text-neutral-900">
                      {balanceLoading ? "…" : formatBalanceDisplay(balanceForSymbol(buySymbol))}
                    </p>
                    <p className="text-[11px] font-medium text-neutral-500">{buySymbol}</p>
                  </>
                ) : (
                  <>
                    <p className="font-mono text-xl font-semibold tabular-nums text-neutral-300">0</p>
                    <p className="text-[11px] text-neutral-400">Connect to see balance</p>
                  </>
                )}
              </div>
            </div>
          </div>
        </div>

        {!sellMonNotToken ? (
          <p className="mt-3 rounded-xl border border-amber-200 bg-amber-50 px-3 py-2 text-center text-xs text-amber-950">
            Testnet execution is <strong>MON → token</strong> only. Flip back to sell MON to swap.
          </p>
        ) : null}

        {!market && sellMonNotToken ? (
          <p className="mt-3 rounded-xl border border-amber-200 bg-amber-50 px-3 py-2 text-xs text-amber-950">
            Set <code className="font-mono text-[10px]">VITE_KURU_TESTNET_OB_{out.symbol}</code> for this
            pair&apos;s order book.
          </p>
        ) : null}

        {needsWallet ? (
          <button
            type="button"
            onClick={() => {
              if (!authenticated) void login();
              else void createWallet();
            }}
            className="mt-5 w-full rounded-full bg-monad py-3.5 text-sm font-bold text-white shadow-md hover:bg-monad-hover"
          >
            {!authenticated ? "Connect" : "Create embedded wallet"}
          </button>
        ) : (
          <button
            type="button"
            disabled={!canSwap || busy}
            onClick={() => void onSwap()}
            className="mt-5 w-full rounded-full bg-monad py-3.5 text-sm font-bold text-white shadow-md hover:bg-monad-hover disabled:cursor-not-allowed disabled:opacity-40"
          >
            {busy ? "Confirm in wallet…" : `Swap MON → ${out.symbol}`}
          </button>
        )}

        {ultra ? (
          <p className="mt-2 text-center text-[10px] text-neutral-400">Ultra: faster routing hint (UI only)</p>
        ) : null}

        {txHash ? (
          <div className="mt-4 rounded-xl border border-emerald-200 bg-emerald-50/90 px-3 py-3 text-sm text-emerald-950">
            <p className="font-semibold">Submitted</p>
            <p className="mt-1 break-all font-mono text-[11px] leading-snug">{txHash}</p>
            <div className="mt-2 flex flex-wrap gap-2">
              {explorerTx ? (
                <a
                  href={explorerTx}
                  target="_blank"
                  rel="noreferrer"
                  className="inline-flex rounded-lg bg-emerald-700 px-3 py-1.5 text-xs font-semibold text-white hover:bg-emerald-800"
                >
                  Explorer
                </a>
              ) : null}
              <button
                type="button"
                onClick={() => void copyHash()}
                className="inline-flex rounded-lg border border-emerald-300 bg-white px-3 py-1.5 text-xs font-semibold text-emerald-900 hover:bg-emerald-100/80"
              >
                {copied ? "Copied" : "Copy"}
              </button>
            </div>
          </div>
        ) : null}

        {err ? (
          <p className="mt-3 text-center text-sm text-red-700" role="alert">
            {err}
          </p>
        ) : null}

        <p className="mt-4 text-center text-[10px] leading-relaxed text-neutral-500">
          Kuru testnet · order book ·{" "}
          <a
            href="https://docs.kuru.io/contracts/Contract-addresses"
            className="font-medium text-monad underline-offset-2 hover:underline"
            target="_blank"
            rel="noreferrer"
          >
            Docs
          </a>
        </p>
      </div>
    </div>
  );
}
