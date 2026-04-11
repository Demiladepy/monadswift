import {
  forwardRef,
  useCallback,
  useEffect,
  useImperativeHandle,
  useRef,
  useState,
} from "react";

export type MonadSpeedometerHandle = {
  /** Animate to a finality time (default ~0.82s for Monad mainnet feel). */
  trigger: (finalitySeconds?: number) => void;
};

type Props = {
  /** When true, always land on exactly 0.80s (hackathon pitch). */
  demoMode?: boolean;
  className?: string;
};

/**
 * Visual “proof” of fast finality: needle / readout settles near ~0.8s.
 */
export const MonadSpeedometer = forwardRef<MonadSpeedometerHandle, Props>(
  function MonadSpeedometer({ demoMode = false, className = "" }, ref) {
    const [phase, setPhase] = useState<"idle" | "running" | "done">("idle");
    const [displaySec, setDisplaySec] = useState(0);
    const rafRef = useRef<number | null>(null);

    const clearRaf = () => {
      if (rafRef.current != null) {
        cancelAnimationFrame(rafRef.current);
        rafRef.current = null;
      }
    };

    const trigger = useCallback(
      (finalitySeconds?: number) => {
        clearRaf();
        const target =
          finalitySeconds ??
          (demoMode ? 0.8 : 0.78 + Math.random() * 0.08);
        setDisplaySec(0);
        setPhase("running");
        const start = performance.now();
        const durationMs = 520;

        function tick(now: number) {
          const t = Math.min(1, (now - start) / durationMs);
          // Ease-out cubic
          const eased = 1 - (1 - t) ** 3;
          setDisplaySec(target * eased);
          if (t < 1) {
            rafRef.current = requestAnimationFrame(tick);
          } else {
            setDisplaySec(target);
            setPhase("done");
            window.setTimeout(() => setPhase("idle"), 2200);
          }
        }
        rafRef.current = requestAnimationFrame(tick);
      },
      [demoMode],
    );

    useImperativeHandle(ref, () => ({ trigger }), [trigger]);

    useEffect(() => () => clearRaf(), []);

    const pct = Math.min(100, (displaySec / 2) * 100);
    const label =
      phase === "idle" && displaySec === 0
        ? "Ready"
        : phase === "running"
          ? "Confirming…"
          : "Finalized";

    return (
      <section
        className={`rounded-2xl border border-neutral-200/90 bg-white p-5 shadow-sm sm:p-6 ${className}`}
      >
        <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
          <div>
            <p className="text-xs font-semibold uppercase tracking-wider text-monad">
              Monad finality
            </p>
            <h2 className="mt-1 font-sans text-lg font-semibold text-neutral-950">
              Speedometer
            </h2>
            <p className="mt-1 max-w-md text-sm text-neutral-600">
              Times each action end-to-end. On Monad, settlement should feel almost instant—typical
              display lands around{" "}
              <span className="font-medium text-neutral-800">~0.8s</span>.
            </p>
          </div>
          <div className="flex flex-col items-end gap-1">
            <span className="text-xs font-medium text-neutral-500">{label}</span>
            <p className="font-sans text-4xl font-semibold tabular-nums tracking-tight text-monad">
              {displaySec.toFixed(2)}
              <span className="text-lg font-semibold text-neutral-400">s</span>
            </p>
          </div>
        </div>
        <div className="mt-5">
          <div className="h-2.5 w-full overflow-hidden rounded-full bg-neutral-100">
            <div
              className="h-full rounded-full bg-gradient-to-r from-monad to-violet-400 transition-[width] duration-75 ease-out"
              style={{ width: `${pct}%` }}
            />
          </div>
          <div className="mt-1.5 flex justify-between text-[10px] font-medium text-neutral-400">
            <span>0s</span>
            <span>1s</span>
            <span>2s</span>
          </div>
        </div>
      </section>
    );
  },
);
