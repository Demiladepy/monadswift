import { useEffect } from "react";
import { createPortal } from "react-dom";
import { useAuthModal } from "~/contexts/auth-modal";
import { MonadLogo } from "./monad-logo";

/** Shown when `PRIVY_APP_ID` is not set — same open/close UX as the real auth modal. */
export function AuthModalMissingEnv() {
  const { open, closeModal } = useAuthModal();

  useEffect(() => {
    if (!open) return;
    function onKey(e: KeyboardEvent) {
      if (e.key === "Escape") closeModal();
    }
    document.addEventListener("keydown", onKey);
    return () => document.removeEventListener("keydown", onKey);
  }, [open, closeModal]);

  useEffect(() => {
    if (!open) return;
    const prev = document.body.style.overflow;
    document.body.style.overflow = "hidden";
    return () => {
      document.body.style.overflow = prev;
    };
  }, [open]);

  if (typeof document === "undefined" || !open) return null;

  return createPortal(
    <div className="fixed inset-0 z-[200] flex items-end justify-center sm:items-center sm:p-4 sm:py-6">
      <button
        type="button"
        className="absolute inset-0 bg-neutral-950/45 backdrop-blur-[2px]"
        aria-label="Close"
        onClick={closeModal}
      />
      <div
        role="dialog"
        aria-modal="true"
        aria-labelledby="auth-missing-title"
        className="relative z-[201] w-full max-w-[440px] px-3 pb-[max(0.75rem,env(safe-area-inset-bottom))] motion-safe:animate-[modal-in_0.2s_ease-out] sm:px-0 sm:pb-0"
      >
        <div className="relative overflow-hidden rounded-t-[1.35rem] border border-neutral-200/90 bg-white shadow-2xl sm:rounded-3xl">
          <button
            type="button"
            onClick={closeModal}
            className="absolute right-2 top-2 z-10 rounded-full p-2 text-neutral-500 transition-colors hover:bg-neutral-100 hover:text-neutral-900"
            aria-label="Close"
          >
            <svg className="h-5 w-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
            </svg>
          </button>

          <div className="px-5 pb-6 pt-12 sm:px-8 sm:pb-8 sm:pt-14">
            <div className="flex flex-col items-center text-center">
              <MonadLogo size={48} />
              <h2
                id="auth-missing-title"
                className="mt-4 font-sans text-xl font-semibold text-neutral-950"
              >
                Configure Privy
              </h2>
              <p className="mt-2 text-sm text-neutral-600">
                Add <code className="rounded bg-neutral-100 px-1">PRIVY_APP_ID</code> or{" "}
                <code className="rounded bg-neutral-100 px-1">VITE_PRIVY_APP_ID</code> to{" "}
                <code className="rounded bg-neutral-100 px-1">.env</code>, then restart the dev server.
              </p>
              <button
                type="button"
                onClick={closeModal}
                className="mt-6 w-full rounded-full bg-monad py-3 text-sm font-semibold text-white hover:bg-monad-hover"
              >
                OK
              </button>
            </div>
          </div>
        </div>
      </div>
    </div>,
    document.body,
  );
}
