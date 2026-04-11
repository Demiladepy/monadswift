import type { Route } from "./+types/home";
import { useEffect } from "react";
import { Link, useSearchParams } from "react-router";
import { LandingHeader } from "~/components/landing-header";
import { WavyBackground } from "~/components/wavy-background";
import { useAuthModal } from "~/contexts/auth-modal";

export function meta({}: Route.MetaArgs) {
  return [
    { title: "MonadSwift — Nano-Bank on Monad" },
    {
      name: "description",
      content:
        "From email login to yield or tips in under a minute. Embedded wallets, 1s finality, built for Monad.",
    },
  ];
}

const features = [
  {
    title: "Social onboarding",
    body: "Sign in with Google or email. We provision a secure embedded wallet—no browser extension required.",
  },
  {
    title: "1s speedometer",
    body: "See confirmations land in real time. Monad finality feels as fast as a traditional banking app.",
  },
  {
    title: "Swift-Yield",
    body: "One tap to put MON to work in a yield vault—no DEX routing or jargon.",
  },
  {
    title: "Social tipping",
    body: "Tip hackathon projects by handle from a built-in leaderboard—powered on Monad.",
  },
];

export default function Home() {
  const { openModal } = useAuthModal();
  const [searchParams, setSearchParams] = useSearchParams();

  useEffect(() => {
    if (searchParams.get("auth") === "1") {
      openModal();
      setSearchParams({}, { replace: true });
    }
  }, [searchParams, setSearchParams, openModal]);

  return (
    <div className="relative min-h-screen bg-white text-neutral-900">
      <WavyBackground />
      <LandingHeader />

      <main>
        <section className="relative px-4 pb-20 pt-12 sm:px-6 sm:pb-28 sm:pt-16 lg:px-8 lg:pt-20">
          <div className="mx-auto max-w-3xl text-center">
            <h1 className="font-sans text-4xl font-semibold leading-[1.1] tracking-tight text-neutral-950 sm:text-5xl lg:text-6xl">
              Better banking on{" "}
              <span className="text-monad">one-second</span> finality
            </h1>
            <p className="mx-auto mt-5 max-w-xl text-base leading-relaxed text-neutral-600 sm:text-lg">
              MonadSwift abstracts the chain: sign in with email or socials, move
              funds like an app, earn yield or tip a team—without the wallet
              headache.
            </p>
            <div className="mt-10 flex flex-col items-stretch justify-center gap-3 sm:flex-row sm:items-center sm:gap-4">
              <a
                href="#features"
                className="rounded-full border border-neutral-200 bg-neutral-100/80 px-6 py-3.5 text-center text-sm font-semibold text-neutral-800 transition-colors hover:bg-neutral-200/80"
              >
                How it works
              </a>
              <button
                type="button"
                onClick={openModal}
                className="rounded-full bg-monad px-6 py-3.5 text-center text-sm font-semibold text-white shadow-sm transition-colors hover:bg-monad-hover"
              >
                Open account
              </button>
            </div>
          </div>

          <div
            id="how"
            className="mx-auto mt-20 max-w-4xl scroll-mt-28 rounded-2xl border border-neutral-200/80 bg-white/60 p-6 shadow-sm backdrop-blur-sm sm:p-10"
          >
            <p className="text-center text-sm font-medium uppercase tracking-wider text-monad">
              Under a minute
            </p>
            <p className="mt-2 text-center text-lg text-neutral-700">
              Email or Google → embedded wallet → deposit, yield, or tip—on Monad’s
              1-second finality.
            </p>
          </div>
        </section>

        <section
          id="features"
          className="scroll-mt-24 border-t border-neutral-100 bg-neutral-50/80 px-4 py-16 sm:px-6 lg:px-8"
        >
          <div className="mx-auto max-w-6xl">
            <h2 className="text-center font-sans text-2xl font-semibold text-neutral-950 sm:text-3xl">
              The magic, without the complexity
            </h2>
            <p className="mx-auto mt-3 max-w-2xl text-center text-neutral-600">
              Privy-powered onboarding, live speed feedback, one-click yield, and
              social tipping—coming together in one Nano-Bank experience.
            </p>
            <ul className="mt-12 grid gap-6 sm:grid-cols-2 lg:gap-8">
              {features.map((f) => (
                <li
                  key={f.title}
                  className="rounded-2xl border border-neutral-200/80 bg-white p-6 shadow-sm transition-shadow hover:shadow-md"
                >
                  <h3 className="font-sans text-lg font-semibold text-neutral-950">
                    {f.title}
                  </h3>
                  <p className="mt-2 text-sm leading-relaxed text-neutral-600">
                    {f.body}
                  </p>
                </li>
              ))}
            </ul>
            <div className="mt-14 flex justify-center">
              <button
                type="button"
                onClick={openModal}
                className="rounded-full bg-monad px-8 py-3.5 text-sm font-semibold text-white shadow-sm transition-colors hover:bg-monad-hover"
              >
                Get started
              </button>
            </div>
          </div>
        </section>

        <footer className="border-t border-neutral-200 bg-white px-4 py-10 sm:px-6 lg:px-8">
          <div className="mx-auto flex max-w-6xl flex-col items-center justify-between gap-4 sm:flex-row">
            <p className="text-sm text-neutral-500">
              © {new Date().getFullYear()} MonadSwift. Built for Monad.
            </p>
            <button
              type="button"
              onClick={openModal}
              className="text-sm font-medium text-monad hover:underline"
            >
              Sign in
            </button>
          </div>
        </footer>
      </main>
    </div>
  );
}
