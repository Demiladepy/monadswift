import { useSendTransaction } from "@privy-io/react-auth";
import { useState } from "react";
import { parseUnits } from "viem";
import {
  kuruFetchQuote,
  kuruGenerateToken,
  parseBuildResponseToTx,
  type KuruQuoteResponse,
} from "~/lib/kuru-flow";
import { kuruAssetToAddress, decimalsForAsset } from "~/lib/kuru-tokens";
import type { KuruSymbolInfo } from "~/lib/kuru-public";
import { MONAD_APP_CHAIN_ID } from "~/lib/monad-chain";

type Props = {
  walletAddress: `0x${string}` | undefined;
  symbolRow: KuruSymbolInfo;
};

export function KuruSwapForm({ walletAddress, symbolRow }: Props) {
  const { sendTransaction } = useSendTransaction();
  const [direction, setDirection] = useState<"sell-base" | "buy-base">("sell-base");
  const [amountIn, setAmountIn] = useState("");
  const [quote, setQuote] = useState<KuruQuoteResponse | null>(null);
  const [quoteError, setQuoteError] = useState<string | null>(null);
  const [busy, setBusy] = useState<"quote" | "exec" | null>(null);

  const payAsset =
    direction === "sell-base" ? symbolRow.baseAsset : symbolRow.quoteAsset;
  const receiveAsset =
    direction === "sell-base" ? symbolRow.quoteAsset : symbolRow.baseAsset;
  const payDecimals =
    direction === "sell-base" ? symbolRow.baseAssetPrecision : symbolRow.quoteAssetPrecision;

  const tokenIn = kuruAssetToAddress(payAsset);
  const tokenOut = kuruAssetToAddress(receiveAsset);

  const canQuote =
    walletAddress &&
    tokenIn &&
    tokenOut &&
    symbolRow.status === "TRADING" &&
    amountIn.trim() !== "" &&
    Number.parseFloat(amountIn) > 0;

  async function onGetQuote() {
    if (!walletAddress || !tokenIn || !tokenOut || !canQuote) return;
    setBusy("quote");
    setQuoteError(null);
    setQuote(null);
    try {
      const { token } = await kuruGenerateToken(walletAddress);
      const amountWei = parseUnits(amountIn.trim(), payDecimals).toString();
      const res = await kuruFetchQuote(token, {
        userAddress: walletAddress,
        tokenIn,
        tokenOut,
        amount: amountWei,
        slippageTolerance: 50,
        autoSlippage: true,
      });
      if (res.status !== "success") {
        setQuoteError(res.message ?? "Quote failed");
        return;
      }
      setQuote(res);
    } catch (e) {
      setQuoteError(e instanceof Error ? e.message : "Quote failed");
    } finally {
      setBusy(null);
    }
  }

  async function onExecute() {
    if (!walletAddress || !quote?.buildResponse) return;
    const parsed = parseBuildResponseToTx(quote.buildResponse);
    if (!parsed) {
      setQuoteError(
        "Quote did not include a raw transaction. Check buildResponse in the response (Kuru may return calldata in a nested shape).",
      );
      return;
    }
    setBusy("exec");
    setQuoteError(null);
    try {
      await sendTransaction({
        to: parsed.to,
        data: parsed.data,
        ...(parsed.value !== undefined && parsed.value > 0n ? { value: parsed.value } : {}),
        chainId: MONAD_APP_CHAIN_ID,
      });
    } catch (e) {
      setQuoteError(e instanceof Error ? e.message : "Transaction failed");
    } finally {
      setBusy(null);
    }
  }

  if (!walletAddress) {
    return (
      <p className="rounded-xl border border-amber-100 bg-amber-50 px-3 py-2 text-sm text-amber-900">
        Connect an embedded wallet to get quotes and swap.
      </p>
    );
  }

  if (!tokenIn || !tokenOut) {
    return (
      <p className="rounded-xl border border-neutral-200 bg-neutral-50 px-3 py-2 text-sm text-neutral-700">
        This pair includes assets we don’t have Monad addresses for yet ({symbolRow.baseAsset}/
        {symbolRow.quoteAsset}). Extend <code className="font-mono text-xs">kuru-tokens.ts</code>.
      </p>
    );
  }

  return (
    <div className="space-y-4 rounded-xl border border-monad/20 bg-monad/[0.03] p-4">
      <div className="flex flex-wrap items-center gap-2">
        <span className="text-xs font-semibold uppercase tracking-wide text-neutral-500">Direction</span>
        <div className="inline-flex rounded-full border border-neutral-200 bg-white p-1">
          <button
            type="button"
            onClick={() => {
              setDirection("sell-base");
              setQuote(null);
            }}
            className={`rounded-full px-3 py-1.5 text-xs font-semibold ${
              direction === "sell-base" ? "bg-monad text-white" : "text-neutral-600"
            }`}
          >
            Sell {symbolRow.baseAsset} → {symbolRow.quoteAsset}
          </button>
          <button
            type="button"
            onClick={() => {
              setDirection("buy-base");
              setQuote(null);
            }}
            className={`rounded-full px-3 py-1.5 text-xs font-semibold ${
              direction === "buy-base" ? "bg-monad text-white" : "text-neutral-600"
            }`}
          >
            Buy {symbolRow.baseAsset} with {symbolRow.quoteAsset}
          </button>
        </div>
      </div>

      <div>
        <label htmlFor="swap-amount" className="text-xs font-semibold text-neutral-700">
          Amount ({payAsset})
        </label>
        <input
          id="swap-amount"
          type="text"
          inputMode="decimal"
          value={amountIn}
          onChange={(e) => {
            setAmountIn(e.target.value);
            setQuote(null);
          }}
          placeholder={`0.0 (${payDecimals} dp)`}
          className="mt-1.5 w-full rounded-xl border border-neutral-200 bg-white px-3 py-2.5 font-mono text-sm outline-none ring-monad/25 focus:ring-2"
        />
        <p className="mt-1 text-[11px] text-neutral-500">
          Decimals: {payDecimals} · You pay {payAsset}, receive {receiveAsset}
        </p>
      </div>

      <div className="flex flex-wrap gap-2">
        <button
          type="button"
          disabled={!canQuote || busy !== null}
          onClick={() => void onGetQuote()}
          className="rounded-full bg-monad px-4 py-2.5 text-sm font-semibold text-white hover:bg-monad-hover disabled:cursor-not-allowed disabled:opacity-50"
        >
          {busy === "quote" ? "Getting quote…" : "Get quote"}
        </button>
        {quote?.output ? (
          <div className="flex flex-1 flex-col justify-center text-sm text-neutral-800">
            <span className="text-xs text-neutral-500">Expected out ({receiveAsset})</span>
            <span className="font-mono font-semibold tabular-nums">
              {formatOut(quote.output, receiveAsset)}
            </span>
          </div>
        ) : null}
      </div>

      {quote && quote.status === "success" ? (
        <button
          type="button"
          disabled={busy !== null || !quote.buildResponse}
          onClick={() => void onExecute()}
          className="w-full rounded-full border border-neutral-900 bg-neutral-900 px-4 py-2.5 text-sm font-semibold text-white hover:bg-neutral-800 disabled:cursor-not-allowed disabled:opacity-50"
        >
          {busy === "exec" ? "Confirm in wallet…" : "Execute swap"}
        </button>
      ) : null}

      {quoteError ? (
        <p className="text-sm text-red-700" role="alert">
          {quoteError}
        </p>
      ) : null}
    </div>
  );
}

function formatOut(raw: string, receiveAsset: string): string {
  try {
    const d = decimalsForAsset(receiveAsset);
    const n = BigInt(raw);
    const whole = n / 10n ** BigInt(d);
    const frac = n % 10n ** BigInt(d);
    if (frac === 0n) return `${whole}`;
    const fracStr = frac.toString().padStart(d, "0").replace(/0+$/, "");
    return `${whole}.${fracStr}`;
  } catch {
    return raw;
  }
}
