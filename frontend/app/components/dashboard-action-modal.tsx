import { useEffect, useId } from "react";
import { createPortal } from "react-dom";

type Props = {
  open: boolean;
  onClose: () => void;
  title: string;
  subtitle?: string;
  children: React.ReactNode;
  /** Wider layout for swap / data-heavy content */
  size?: "md" | "lg";
};

/**
 * Full-screen overlay modal for quick actions (Deposit, Send, Swap).
 */
export function DashboardActionModal({
  open,
  onClose,
  title,
  subtitle,
  children,
  size = "md",
}: Props) {
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

  const maxW = size === "lg" ? "max-w-2xl" : "max-w-md";

  return createPortal(
    <div className="fixed inset-0 z-[95] flex items-end justify-center p-4 sm:items-center">
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
        className={`modal-scroll relative z-10 flex max-h-[min(90vh,720px)] w-full flex-col ${maxW} overflow-y-auto rounded-2xl border border-neutral-200 bg-white shadow-xl`}
      >
        <div className="sticky top-0 z-10 flex items-start justify-between gap-3 border-b border-neutral-100 bg-white px-5 py-4 sm:px-6">
          <div className="min-w-0">
            <h2 id={titleId} className="font-sans text-lg font-semibold text-neutral-950">
              {title}
            </h2>
            {subtitle ? (
              <p className="mt-1 text-sm text-neutral-500">{subtitle}</p>
            ) : null}
          </div>
          <button
            type="button"
            onClick={onClose}
            className="shrink-0 rounded-full border border-neutral-200 bg-white px-3 py-1.5 text-xs font-semibold text-neutral-600 hover:bg-neutral-50"
          >
            Close
          </button>
        </div>
        <div className="px-5 py-4 sm:px-6 sm:py-5">{children}</div>
      </div>
    </div>,
    document.body,
  );
}
