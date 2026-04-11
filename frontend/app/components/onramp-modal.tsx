import { useEffect, useId } from "react";
import { createPortal } from "react-dom";

type OnrampModalProps = {
  onrampUrl: string | null;
  onClose: () => void;
  /** Called after the user confirms (before tab opens). */
  onContinue?: () => void;
};

export function OnrampModal({ onrampUrl, onClose, onContinue }: OnrampModalProps) {
  const titleId = useId();
  const open = Boolean(onrampUrl);

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

  const handleContinue = () => {
    if (!onrampUrl) return;
    window.open(onrampUrl, "_blank", "noopener,noreferrer");
    onContinue?.();
    onClose();
  };

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
        className="relative z-10 w-full max-w-md rounded-2xl border border-neutral-200 bg-white p-6 shadow-xl"
      >
        <h2 id={titleId} className="font-sans text-lg font-semibold text-neutral-950">
          Fund with MoonPay
        </h2>
        <p className="mt-3 text-sm leading-relaxed text-neutral-600">
          This app opens MoonPay in a new tab using your publishable API key (same pattern as the
          Privy fiat on-ramp demo). Complete checkout there; assets settle to your embedded wallet
          address when MoonPay supports your chosen network and currency codes.
        </p>
        <div className="mt-6 flex flex-col-reverse gap-2 sm:flex-row sm:justify-end">
          <button
            type="button"
            onClick={onClose}
            className="rounded-full border border-neutral-200 bg-white px-4 py-2.5 text-sm font-semibold text-neutral-800 hover:bg-neutral-50"
          >
            Cancel
          </button>
          <button
            type="button"
            onClick={handleContinue}
            className="rounded-full bg-monad px-4 py-2.5 text-sm font-semibold text-white shadow-sm hover:bg-monad-hover"
          >
            Continue to MoonPay
          </button>
        </div>
      </div>
    </div>,
    document.body,
  );
}
