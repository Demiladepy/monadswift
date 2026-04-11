import { MonadLogo } from "~/components/monad-logo";

export type DashboardNavId = "overview" | "swap" | "yield" | "send";

const items: { id: DashboardNavId; label: string; badge?: string }[] = [
  { id: "overview", label: "Dashboard" },
  { id: "swap", label: "Swap" },
  { id: "yield", label: "Swift-Yield" },
  { id: "send", label: "Send" },
];

type Props = {
  active: DashboardNavId;
  onNavigate: (id: DashboardNavId) => void;
};

export function DashboardSidebar({ active, onNavigate }: Props) {
  return (
    <aside className="hidden w-56 shrink-0 flex-col border-r border-neutral-200/90 bg-white lg:flex">
      <div className="flex items-center gap-2 border-b border-neutral-100 px-5 py-4">
        <MonadLogo size={28} />
        <span className="font-sans text-sm font-semibold tracking-tight text-neutral-950">
          MonadSwift
        </span>
      </div>
      <nav className="flex flex-1 flex-col gap-0.5 p-3" aria-label="Primary">
        {items.map((item) => {
          const isActive = active === item.id;
          return (
            <button
              key={item.id}
              type="button"
              onClick={() => onNavigate(item.id)}
              className={`flex w-full items-center justify-between rounded-xl px-3 py-2.5 text-left text-sm font-medium transition-colors ${
                isActive
                  ? "bg-monad/10 text-monad"
                  : "text-neutral-600 hover:bg-neutral-50 hover:text-neutral-900"
              }`}
            >
              <span>{item.label}</span>
              {item.badge ? (
                <span className="rounded-full bg-emerald-100 px-1.5 py-0.5 text-[10px] font-semibold uppercase text-emerald-800">
                  {item.badge}
                </span>
              ) : null}
            </button>
          );
        })}
      </nav>
      <div className="border-t border-neutral-100 p-4">
        <p className="text-[11px] leading-snug text-neutral-500">
          Embedded wallet via Privy · Onramp via MoonPay · DEX data via{" "}
          <a
            href="https://docs.kuru.io"
            target="_blank"
            rel="noreferrer"
            className="font-medium text-monad underline-offset-2 hover:underline"
          >
            Kuru
          </a>
        </p>
      </div>
    </aside>
  );
}
