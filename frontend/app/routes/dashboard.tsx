import { useCreateWallet, useFundWalletWithBankDeposit, usePrivy } from "@privy-io/react-auth";
import type { Route } from "./+types/dashboard";
import { useRef, useState } from "react";
import { Link, Navigate, useNavigate } from "react-router";
import { DemoFundModal } from "~/components/demo-fund-modal";
import type { DashboardNavId } from "~/components/dashboard-sidebar";
import { DashboardSidebar } from "~/components/dashboard-sidebar";
import { DashboardKuruPanel } from "~/components/dashboard-kuru-panel";
import { DashboardSocialSend } from "~/components/dashboard-social-send";
import { DashboardTransactions } from "~/components/dashboard-transactions";
import { DashboardYieldPanel } from "~/components/dashboard-yield-panel";
import { MonadSpeedometer, type MonadSpeedometerHandle } from "~/components/monad-speedometer";
import { OnrampModal } from "~/components/onramp-modal";
import { MonadLogo } from "~/components/monad-logo";
import { useDemoMode } from "~/hooks/use-demo-mode";
import { buildMoonpayBuyUrl } from "~/lib/moonpay-buy-url";
import { getMoonpayApiKey } from "~/lib/moonpay-config";
import { useMonadBalances } from "~/hooks/use-monad-balances";
import { getPrivyAppId } from "~/lib/privy-app-id";
import {
  MONAD_MAINNET_CHAIN_ID,
  MONAD_MAINNET_DOCS,
  MONAD_MAINNET_USDC,
  monadMainnet,
} from "~/lib/monad-chain";

type DepositAsset = "MON" | "USDC";

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
  const { ready, authenticated, logout } = usePrivy();
  const navigate = useNavigate();
  const { demoMode, setDemoMode } = useDemoMode();
  const speedRef = useRef<MonadSpeedometerHandle>(null);
  const [nav, setNav] = useState<DashboardNavId>("overview");

  const {
    walletAddress,
    balanceMon,
    balanceUsdc,
    error: balanceError,
    refreshing,
    refresh,
  } = useMonadBalances();

  const [depositAsset, setDepositAsset] = useState<DepositAsset>("MON");
  const { createWallet } = useCreateWallet({
    onSuccess: () => void refresh(),
  });

  const [onrampUrl, setOnrampUrl] = useState<string | null>(null);
  const [demoFundOpen, setDemoFundOpen] = useState(false);
  const [bankBusy, setBankBusy] = useState(false);
  const [depositError, setDepositError] = useState<string | null>(null);
  const [copied, setCopied] = useState(false);

  const { fund: fundWithBank } = useFundWalletWithBankDeposit();

  function handleMoonPayFund() {
    if (!walletAddress) return;
    if (demoMode) {
      setDepositError(null);
      setDemoFundOpen(true);
      return;
    }
    const apiKey = getMoonpayApiKey();
    if (!apiKey.trim()) {
      setDepositError(
        "Add your MoonPay publishable key to .env as VITE_MOONPAY_API_KEY (or PUBLIC_MOONPAY_API_KEY) and restart the dev server.",
      );
      return;
    }
    setDepositError(null);
    const url = buildMoonpayBuyUrl({
      walletAddress: walletAddress as `0x${string}`,
      apiKey: apiKey.trim(),
      asset: depositAsset,
    });
    setOnrampUrl(url);
  }

  function bridgeProvider(): "bridge" | "bridge-sandbox" {
    const v = import.meta.env.VITE_BRIDGE_PROVIDER;
    if (v === "sandbox" || v === "bridge-sandbox") return "bridge-sandbox";
    return "bridge";
  }

  async function handleBridgeBankDeposit() {
    if (!walletAddress || bankBusy) return;
    setBankBusy(true);
    setDepositError(null);
    try {
      await fundWithBank({
        source: {
          assets: ["usd", "eur", "gbp", "mxn", "brl"],
          defaultAsset: "usd",
        },
        destination: {
          asset: "usdc",
          chain: `eip155:${MONAD_MAINNET_CHAIN_ID}`,
          address: walletAddress,
        },
        provider: bridgeProvider(),
      });
      void refresh();
      speedRef.current?.trigger(demoMode ? 0.8 : undefined);
    } catch (e) {
      setDepositError(
        e instanceof Error
          ? e.message
          : "Could not start bank deposit. Finish Bridge setup in Privy (Account funding) and ensure this chain is supported.",
      );
    } finally {
      setBankBusy(false);
    }
  }

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
      <OnrampModal
        onrampUrl={onrampUrl}
        onClose={() => setOnrampUrl(null)}
        onContinue={() => {
          void refresh();
          speedRef.current?.trigger(demoMode ? 0.8 : undefined);
        }}
      />
      <DemoFundModal
        open={demoFundOpen}
        onClose={() => setDemoFundOpen(false)}
        onComplete={() => {
          speedRef.current?.trigger(0.8);
          void refresh();
        }}
        assetLabel={depositAsset === "MON" ? "MON" : "USDC"}
      />

      <div className="flex min-h-screen">
        <DashboardSidebar active={nav} onNavigate={setNav} />

        <div className="flex min-w-0 flex-1 flex-col">
          <header className="sticky top-0 z-40 border-b border-neutral-200/90 bg-white/95 backdrop-blur-md">
            <div className="flex flex-wrap items-center justify-between gap-3 px-4 py-3 sm:px-6 lg:px-8">
              <div className="flex min-w-0 items-center gap-2 lg:hidden">
                <MonadLogo size={28} />
                <span className="font-sans text-sm font-semibold">MonadSwift</span>
              </div>
              <div className="flex w-full flex-wrap items-center justify-end gap-2 sm:w-auto sm:gap-3">
                <label className="flex cursor-pointer items-center gap-2 rounded-full border border-amber-200 bg-amber-50 px-3 py-1.5 text-xs font-semibold text-amber-900">
                  <input
                    type="checkbox"
                    className="accent-amber-600"
                    checked={demoMode}
                    onChange={(e) => setDemoMode(e.target.checked)}
                  />
                  Demo mode
                </label>
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
                          <span className="font-medium text-neutral-700">{monadMainnet.name}</span>
                        </p>
                      </div>
                      <div className="flex flex-col items-end gap-2">
                        <span className="inline-flex items-center gap-1.5 rounded-full border border-neutral-200 bg-white px-3 py-1.5 text-xs font-semibold text-neutral-700">
                          <span className="h-2 w-2 rounded-full bg-monad" aria-hidden />
                          Monad
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
                      onClick={handleMoonPayFund}
                      disabled={!walletAddress}
                      className="flex flex-col items-center gap-2 rounded-2xl border border-neutral-200 bg-neutral-50/80 px-4 py-5 text-center transition-colors hover:border-monad/30 hover:bg-monad/5 disabled:cursor-not-allowed disabled:opacity-50"
                    >
                      <span className="flex h-10 w-10 items-center justify-center rounded-full bg-white text-xl font-light text-monad shadow-sm">
                        +
                      </span>
                      <span className="text-sm font-semibold text-neutral-900">Deposit</span>
                      <span className="text-[11px] text-neutral-500">
                        {demoMode ? "Demo onramp" : "MoonPay / card"}
                      </span>
                    </button>
                    <button
                      type="button"
                      onClick={() => setNav("send")}
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
                      onClick={() => setNav("swap")}
                      className="flex flex-col items-center gap-2 rounded-2xl border border-neutral-200 bg-neutral-50/80 px-4 py-5 text-center transition-colors hover:border-monad/30 hover:bg-monad/5"
                    >
                      <span className="flex h-10 w-10 items-center justify-center rounded-full bg-white text-lg shadow-sm">
                        ⇄
                      </span>
                      <span className="text-sm font-semibold text-neutral-900">Swap</span>
                      <span className="text-[11px] text-neutral-500">Kuru · MON / USDC</span>
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

                <MonadSpeedometer ref={speedRef} demoMode={demoMode} />

                <section className="rounded-2xl border border-neutral-200/90 bg-white p-5 shadow-sm sm:p-6">
                  <h2 className="font-sans text-lg font-semibold text-neutral-950">
                    Embedded wallet
                  </h2>
                  <p className="mt-1 text-sm text-neutral-600">
                    Privy creates a non-custodial wallet — no seed phrase in the happy path. Network:{" "}
                    <a
                      href={MONAD_MAINNET_DOCS}
                      target="_blank"
                      rel="noreferrer"
                      className="font-medium text-monad underline-offset-2 hover:underline"
                    >
                      Monad mainnet
                    </a>{" "}
                    ({MONAD_MAINNET_CHAIN_ID}).
                  </p>
                  {!walletAddress ? (
                    <button
                      type="button"
                      onClick={() => void createWallet()}
                      className="mt-4 rounded-full bg-monad px-5 py-2.5 text-sm font-semibold text-white shadow-sm hover:bg-monad-hover"
                    >
                      Create embedded wallet
                    </button>
                  ) : balanceError ? (
                    <p className="mt-4 text-sm text-red-600">{balanceError}</p>
                  ) : (
                    <dl className="mt-4 grid gap-2 text-sm text-neutral-700 sm:grid-cols-[auto_1fr] sm:gap-x-6">
                      <dt className="text-neutral-500">Address</dt>
                      <dd className="break-all font-mono text-xs text-neutral-900">{walletAddress}</dd>
                      <dt className="text-neutral-500">USDC</dt>
                      <dd className="break-all font-mono text-xs">{MONAD_MAINNET_USDC}</dd>
                    </dl>
                  )}

                  {walletAddress ? (
                    <div className="mt-6 space-y-4 border-t border-neutral-100 pt-6">
                      <div>
                        <p className="text-xs font-semibold text-neutral-800">MoonPay</p>
                        <p className="mt-1 text-[11px] leading-snug text-neutral-500">
                          {demoMode
                            ? "Demo mode skips the MoonPay tab — toggle off to use a real publishable key and checkout."
                            : "Opens MoonPay in a new tab. Configure currency/network codes to match your MoonPay dashboard."}
                        </p>
                        <button
                          type="button"
                          onClick={handleMoonPayFund}
                          className="mt-3 w-full rounded-full border border-monad/50 bg-white px-4 py-2.5 text-sm font-semibold text-monad shadow-sm hover:bg-monad/5 sm:w-auto"
                        >
                          {depositAsset === "MON" ? "Add MON (MoonPay)" : "Add USDC (MoonPay)"}
                        </button>
                      </div>
                      {depositAsset === "USDC" ? (
                        <div>
                          <p className="text-xs font-semibold text-neutral-800">
                            Bridge (bank transfer)
                          </p>
                          <button
                            type="button"
                            disabled={bankBusy}
                            onClick={() => void handleBridgeBankDeposit()}
                            className="mt-3 w-full rounded-full border border-neutral-300 bg-white px-4 py-2.5 text-sm font-semibold text-neutral-900 shadow-sm hover:bg-neutral-50 disabled:cursor-not-allowed disabled:opacity-60 sm:w-auto"
                          >
                            {bankBusy ? "Opening…" : "Deposit USDC via bank (Bridge)"}
                          </button>
                        </div>
                      ) : null}
                      {depositError ? (
                        <p className="text-xs text-red-600" role="alert">
                          {depositError}
                        </p>
                      ) : null}
                    </div>
                  ) : null}
                </section>

                <DashboardTransactions />
              </div>
            ) : null}

            {nav === "swap" ? <DashboardKuruPanel /> : null}
            {nav === "yield" ? <DashboardYieldPanel /> : null}
            {nav === "send" ? (
              <DashboardSocialSend
                walletAddress={walletAddress}
                onSimulatedSend={() => speedRef.current?.trigger(demoMode ? 0.8 : undefined)}
              />
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
