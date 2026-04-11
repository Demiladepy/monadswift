import { useEffect, useId } from "react";
import { createPortal } from "react-dom";

type Props = {
  open: boolean;
  onClose: () => void;
  /** After user acknowledges the simulated deposit. */
  onComplete: () => void;
  assetLabel: string;
};

/**
 * Simulated onramp success — no KYC, no external tab (hackathon demo).
 */
export function DemoFundModal({ open, onClose, onComplete, assetLabel }: Props) {
  const titleId = useId();

  useEffect(() => {
    if (!open) return;
    const prev = document.body.style.overflow;
    document.body.style.overflow = "hidden";
    return () => {
      document.body.style.overflow = prev;
    };
  }, [open]);

  useEffect(() => {
    if (!open) return;
    function onKey(e: KeyboardEvent) {
      if (e.key === "Escape") onClose();
    }
    document.addEventListener("keydown", onKey);
    return () => document.removeEventListener("keydown", onKey);
  }, [open, onClose]);

  if (!open || typeof document === "undefined") return null;

  return createPortal(
    <div className="fixed inset-0 z-[100] flex items-end justify-center p-4 sm:items-center">
      <button
        type="button"
        className="absolute inset-0 bg-neutral-900/40 backdrop-blur-[2px]"
        aria-label="Close"
        onClick={onClose}
      />
      <div
        role="dialog"
        aria-modal="true"
        aria-labelledby={titleId}
        className="relative z-10 w-full max-w-md rounded-2xl border border-emerald-200 bg-white p-6 shadow-xl"
      >
        <div className="flex h-12 w-12 items-center justify-center rounded-full bg-emerald-100 text-2xl">
          ✓
        </div>
        <h2 id={titleId} className="mt-4 font-sans text-lg font-semibold text-neutral-950">
          Demo deposit complete
        </h2>
        <p className="mt-2 text-sm leading-relaxed text-neutral-600">
          In <span className="font-medium text-neutral-800">demo mode</span>, we skip MoonPay and
          KYC. Your pitch can show balances and flows without waiting on a card checkout.
        </p>
        <p className="mt-3 rounded-xl bg-neutral-50 px-3 py-2 text-xs text-neutral-600">
          Simulated asset:{" "}
          <span className="font-semibold text-neutral-800">{assetLabel}</span> to your embedded
          wallet.
        </p>
        <div className="mt-6 flex flex-col-reverse gap-2 sm:flex-row sm:justify-end">
          <button
            type="button"
            onClick={onClose}
            className="rounded-full border border-neutral-200 bg-white px-4 py-2.5 text-sm font-semibold text-neutral-800 hover:bg-neutral-50"
          >
            Close
          </button>
          <button
            type="button"
            onClick={() => {
              onComplete();
              onClose();
            }}
            className="rounded-full bg-monad px-4 py-2.5 text-sm font-semibold text-white shadow-sm hover:bg-monad-hover"
          >
            Continue
          </button>
        </div>
      </div>
    </div>,
    document.body,
  );
}
