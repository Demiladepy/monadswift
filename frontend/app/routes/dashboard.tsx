import { useCreateWallet, usePrivy } from "@privy-io/react-auth";
import type { Route } from "./+types/dashboard";
import { useRef, useState } from "react";
import { Link, Navigate, useNavigate } from "react-router";
import { DashboardActionModal } from "~/components/dashboard-action-modal";
import type { DashboardNavId } from "~/components/dashboard-sidebar";
import { DashboardSidebar } from "~/components/dashboard-sidebar";
import { DepositFundingBody, type DepositAsset } from "~/components/deposit-funding-body";
import { DashboardKuruPanel } from "~/components/dashboard-kuru-panel";
import { DashboardSocialSend } from "~/components/dashboard-social-send";
import { DashboardKuruActivity } from "~/components/dashboard-kuru-activity";
import { DashboardProfileSettings } from "~/components/dashboard-profile-settings";
import { DashboardYieldPanel } from "~/components/dashboard-yield-panel";
import { MonadSpeedometer, type MonadSpeedometerHandle } from "~/components/monad-speedometer";
import { MonadLogo } from "~/components/monad-logo";
import { useMonadBalances } from "~/hooks/use-monad-balances";
import { useMonadTxHistory } from "~/hooks/use-monad-tx-history";
import { DashboardTxHistory } from "~/components/dashboard-tx-history";
import { useRegisterResolverIdentity } from "~/hooks/use-register-resolver";
import { getPrivyAppId } from "~/lib/privy-app-id";
import { getUserDisplayEmail } from "~/lib/privy-user-display";
import { monadAppChain, monadAppNetwork } from "~/lib/monad-chain";

export function meta({}: Route.MetaArgs) {
  return [
    { title: "Dashboard — MonadSwift" },
    { name: "description", content: "Your MonadSwift Nano-Bank dashboard." },
  ];
}

function MobileBottomNav({
  active,
  onNavigate,
}: {
  active: DashboardNavId;
  onNavigate: (id: DashboardNavId) => void;
}) {
  const items: { id: DashboardNavId; label: string }[] = [
    { id: "overview", label: "Home" },
    { id: "swap", label: "Swap" },
    { id: "yield", label: "Yield" },
    { id: "send", label: "Send" },
    { id: "settings", label: "Profile" },
  ];
  return (
    <nav
      className="fixed bottom-0 left-0 right-0 z-30 border-t border-neutral-200 bg-white/95 px-2 py-2 backdrop-blur-md lg:hidden"
      aria-label="Mobile primary"
    >
      <div className="mx-auto flex max-w-lg justify-around">
        {items.map((item) => {
          const isActive = active === item.id;
          return (
            <button
              key={item.id}
              type="button"
              onClick={() => onNavigate(item.id)}
              className={`flex min-w-[3.5rem] flex-col items-center gap-0.5 rounded-lg px-2 py-1.5 text-[11px] font-semibold ${
                isActive ? "text-monad" : "text-neutral-400"
              }`}
            >
              <span
                className={`h-1.5 w-1.5 rounded-full ${isActive ? "bg-monad" : "bg-neutral-300"}`}
              />
              {item.label}
            </button>
          );
        })}
      </div>
    </nav>
  );
}

function DashboardWithPrivy() {
  const { ready, authenticated, logout, user } = usePrivy();
  const navigate = useNavigate();
  const speedRef = useRef<MonadSpeedometerHandle>(null);
  const [nav, setNav] = useState<DashboardNavId>("overview");
  const [quickAction, setQuickAction] = useState<"deposit" | "send" | "swap" | null>(null);

  const {
    walletAddress,
    balanceMon,
    balanceUsdc,
    error: balanceError,
    refreshing,
    refresh,
  } = useMonadBalances();

  const txHistory = useMonadTxHistory(walletAddress);

  function refreshBalancesAndActivity() {
    void refresh();
    void txHistory.refresh();
  }

  useRegisterResolverIdentity();

  const [depositAsset, setDepositAsset] = useState<DepositAsset>("MON");
  const { createWallet } = useCreateWallet({
    onSuccess: () => void refresh(),
  });

  const [copied, setCopied] = useState(false);

  async function copyAddress() {
    if (!walletAddress || !navigator.clipboard?.writeText) return;
    await navigator.clipboard.writeText(walletAddress);
    setCopied(true);
    window.setTimeout(() => setCopied(false), 2000);
  }

  if (!ready) {
    return (
      <div className="flex min-h-screen items-center justify-center bg-neutral-100 text-sm text-neutral-500">
        Loading wallet…
      </div>
    );
  }

  if (!authenticated) {
    return <Navigate to="/?auth=1" replace />;
  }

  async function onLogout() {
    await logout();
    navigate("/");
  }

  const displayEmail = getUserDisplayEmail(user);

  const primaryBalance =
    depositAsset === "MON"
      ? balanceMon !== null
        ? `${Number.parseFloat(balanceMon).toLocaleString(undefined, { maximumFractionDigits: 6 })} MON`
        : refreshing
          ? "…"
          : "—"
      : balanceUsdc !== null
        ? `${Number.parseFloat(balanceUsdc).toLocaleString(undefined, { maximumFractionDigits: 2 })} USDC`
        : refreshing
          ? "…"
          : "—";

  return (
    <div className="min-h-screen bg-neutral-100 text-neutral-900">
      <DashboardActionModal
        open={quickAction === "deposit"}
        onClose={() => setQuickAction(null)}
        title="Fund wallet"
        subtitle="Monad testnet"
      >
        <DepositFundingBody
          depositAsset={depositAsset}
          setDepositAsset={setDepositAsset}
          walletAddress={walletAddress}
          balanceError={balanceError}
          onCreateWallet={() => void createWallet()}
          onMoonpayDemoComplete={() => void refresh()}
        />
      </DashboardActionModal>

      <DashboardActionModal
        open={quickAction === "send"}
        onClose={() => setQuickAction(null)}
        title="Send"
        subtitle="Email, @handle, or 0x address"
      >
        <DashboardSocialSend
          variant="modal"
          walletAddress={walletAddress}
          balanceMon={balanceMon}
          onSent={refreshBalancesAndActivity}
          onConfirmSend={() => speedRef.current?.trigger()}
        />
      </DashboardActionModal>

      <DashboardActionModal
        open={quickAction === "swap"}
        onClose={() => setQuickAction(null)}
        title="Swap"
        subtitle="Kuru DEX"
        size="lg"
      >
        <DashboardKuruPanel
          variant="modal"
          walletAddress={walletAddress as `0x${string}` | undefined}
        />
      </DashboardActionModal>

      <div className="flex min-h-screen">
        <DashboardSidebar active={nav} onNavigate={setNav} />

        <div className="flex min-w-0 flex-1 flex-col">
          <header className="sticky top-0 z-40 border-b border-neutral-200/90 bg-white/95 backdrop-blur-md">
            <div className="flex w-full items-center gap-3 px-4 py-3 sm:px-6 lg:px-8">
              <div className="flex min-w-0 shrink-0 items-center gap-2 lg:hidden">
                <MonadLogo size={28} />
                <span className="font-sans text-sm font-semibold">MonadSwift</span>
              </div>
              <div className="ml-auto flex flex-wrap items-center justify-end gap-2 sm:gap-3">
                {balanceMon !== null ? (
                  <div className="hidden rounded-full bg-monad/10 px-3 py-1.5 text-xs font-semibold text-monad sm:inline-flex">
                    {Number.parseFloat(balanceMon).toLocaleString(undefined, {
                      maximumFractionDigits: 4,
                    })}{" "}
                    MON
                  </div>
                ) : null}
                {balanceUsdc !== null ? (
                  <div className="hidden rounded-full bg-emerald-50 px-3 py-1.5 text-xs font-semibold text-emerald-800 sm:inline-flex">
                    {Number.parseFloat(balanceUsdc).toLocaleString(undefined, {
                      maximumFractionDigits: 2,
                    })}{" "}
                    USDC
                  </div>
                ) : null}
                <button
                  type="button"
                  onClick={() => void onLogout()}
                  className="rounded-full border border-neutral-200 bg-white px-3 py-2 text-xs font-semibold text-neutral-700 hover:bg-neutral-50 sm:px-4 sm:text-sm"
                >
                  Log out
                </button>
              </div>
            </div>
          </header>

          <main className="mx-auto w-full max-w-5xl flex-1 px-4 py-6 sm:px-6 lg:px-10">
            {nav === "overview" ? (
              <div className="space-y-6">
                <section className="overflow-hidden rounded-2xl border border-neutral-200/90 bg-white shadow-sm">
                  <div className="border-b border-neutral-100 bg-gradient-to-br from-monad/[0.07] via-white to-white px-6 py-6 sm:px-8 sm:py-8">
                    <div className="flex flex-wrap items-start justify-between gap-4">
                      <div>
                        <p className="text-xs font-semibold uppercase tracking-wider text-neutral-500">
                          Overall balance
                        </p>
                        <p className="mt-2 font-sans text-4xl font-semibold tabular-nums tracking-tight text-neutral-950 sm:text-5xl">
                          {primaryBalance}
                        </p>
                        <p className="mt-2 text-sm text-neutral-500">
                          Balance on{" "}
                          <span className="font-medium text-neutral-700">{monadAppChain.name}</span>
                        </p>
                      </div>
                      <div className="flex flex-col items-end gap-2">
                        <span className="inline-flex items-center gap-1.5 rounded-full border border-neutral-200 bg-white px-3 py-1.5 text-xs font-semibold text-neutral-700">
                          <span className="h-2 w-2 rounded-full bg-monad" aria-hidden />
                          {monadAppNetwork === "testnet" ? "Monad testnet" : "Monad mainnet"}
                        </span>
                        <div
                          className="inline-flex rounded-full border border-neutral-200 bg-white p-1 shadow-sm"
                          role="group"
                          aria-label="Primary asset for hero display and deposit"
                        >
                          {(["MON", "USDC"] as const).map((a) => (
                            <button
                              key={a}
                              type="button"
                              onClick={() => setDepositAsset(a)}
                              className={`rounded-full px-3 py-1.5 text-xs font-semibold transition-colors ${
                                depositAsset === a
                                  ? "bg-monad text-white shadow-sm"
                                  : "text-neutral-600 hover:bg-neutral-50"
                              }`}
                            >
                              {a}
                            </button>
                          ))}
                        </div>
                      </div>
                    </div>
                  </div>

                  <div className="grid gap-3 p-4 sm:grid-cols-3 sm:p-6">
                    <button
                      type="button"
                      onClick={() => setQuickAction("deposit")}
                      className="flex flex-col items-center gap-2 rounded-2xl border border-neutral-200 bg-neutral-50/80 px-4 py-5 text-center transition-colors hover:border-monad/30 hover:bg-monad/5"
                    >
                      <span className="flex h-10 w-10 items-center justify-center rounded-full bg-white text-xl font-light text-monad shadow-sm">
                        +
                      </span>
                      <span className="text-sm font-semibold text-neutral-900">Deposit</span>
                      <span className="text-[11px] text-neutral-500">Testnet faucet</span>
                    </button>
                    <button
                      type="button"
                      onClick={() => setQuickAction("send")}
                      className="flex flex-col items-center gap-2 rounded-2xl border border-neutral-200 bg-neutral-50/80 px-4 py-5 text-center transition-colors hover:border-monad/30 hover:bg-monad/5"
                    >
                      <span className="flex h-10 w-10 items-center justify-center rounded-full bg-white text-lg shadow-sm">
                        ✈
                      </span>
                      <span className="text-sm font-semibold text-neutral-900">Send</span>
                      <span className="text-[11px] text-neutral-500">By email / @handle</span>
                    </button>
                    <button
                      type="button"
                      onClick={() => setQuickAction("swap")}
                      className="flex flex-col items-center gap-2 rounded-2xl border border-neutral-200 bg-neutral-50/80 px-4 py-5 text-center transition-colors hover:border-monad/30 hover:bg-monad/5"
                    >
                      <span className="flex h-10 w-10 items-center justify-center rounded-full bg-white text-lg shadow-sm">
                        ⇄
                      </span>
                      <span className="text-sm font-semibold text-neutral-900">Swap</span>
                      <span className="text-[11px] text-neutral-500">Kuru</span>
                    </button>
                  </div>

                  <div className="border-t border-neutral-100 px-4 pb-4 sm:px-6 sm:pb-6">
                    <button
                      type="button"
                      onClick={() => void copyAddress()}
                      disabled={!walletAddress}
                      className="flex w-full items-center justify-center gap-2 rounded-xl border border-dashed border-neutral-200 bg-white px-4 py-3 text-sm font-semibold text-neutral-800 hover:bg-neutral-50 disabled:cursor-not-allowed disabled:opacity-50"
                    >
                      {copied ? "Address copied" : "Copy wallet address"}
                    </button>
                  </div>
                </section>

                {walletAddress ? (
                  <DashboardTxHistory
                    rows={txHistory.rows}
                    loading={txHistory.loading}
                    error={txHistory.error}
                    onRefresh={txHistory.refresh}
                  />
                ) : null}

                <MonadSpeedometer ref={speedRef} />

                {!walletAddress ? (
                  <div className="rounded-2xl border border-monad/15 bg-white p-5 text-center shadow-sm sm:text-left">
                    <p className="text-sm text-neutral-600">
                      Create an embedded wallet on {monadAppChain.name} to see balances. Use{" "}
                      <span className="font-medium text-neutral-800">Deposit</span> for testnet
                      funding notes, or open it to create a wallet from there.
                    </p>
                    <button
                      type="button"
                      onClick={() => void createWallet()}
                      className="mt-4 rounded-full bg-monad px-5 py-2.5 text-sm font-semibold text-white shadow-sm hover:bg-monad-hover"
                    >
                      Create embedded wallet
                    </button>
                  </div>
                ) : null}

                {walletAddress && balanceError ? (
                  <div className="rounded-2xl border border-red-100 bg-red-50/90 px-4 py-3 text-sm text-red-800">
                    <p>{balanceError}</p>
                    <button
                      type="button"
                      onClick={refreshBalancesAndActivity}
                      className="mt-2 text-sm font-semibold text-monad hover:underline"
                    >
                      Retry
                    </button>
                  </div>
                ) : null}

                <DashboardKuruActivity />
              </div>
            ) : null}

            {nav === "swap" ? (
              <DashboardKuruPanel walletAddress={walletAddress as `0x${string}` | undefined} />
            ) : null}
            {nav === "yield" ? <DashboardYieldPanel /> : null}
            {nav === "send" ? (
              <DashboardSocialSend
                walletAddress={walletAddress}
                balanceMon={balanceMon}
                onSent={refreshBalancesAndActivity}
                onConfirmSend={() => speedRef.current?.trigger()}
              />
            ) : null}
            {nav === "settings" ? (
              <DashboardProfileSettings email={displayEmail} walletAddress={walletAddress} />
            ) : null}
          </main>
        </div>
      </div>

      <MobileBottomNav active={nav} onNavigate={setNav} />
      <div className="h-14 lg:hidden" aria-hidden />
    </div>
  );
}

export default function Dashboard() {
  const appId = getPrivyAppId();

  if (!appId) {
    return (
      <div className="flex min-h-screen flex-col items-center justify-center gap-4 bg-neutral-100 px-6 text-center">
        <p className="font-sans text-lg font-semibold text-neutral-900">Privy not configured</p>
        <p className="max-w-sm text-sm text-neutral-600">
          Add your Privy App ID to <code className="rounded bg-white px-1">.env</code> and restart the
          dev server.
        </p>
        <Link to="/" className="text-sm font-semibold text-monad hover:underline">
          Back home
        </Link>
      </div>
    );
  }

  return <DashboardWithPrivy />;
}
