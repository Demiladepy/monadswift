import { useState } from "react";
import { Link } from "react-router";
import { useAuthModal } from "~/contexts/auth-modal";
import { MonadLogo } from "./monad-logo";

const navLinks = [
  { label: "Features", href: "#features" },
  { label: "How it works", href: "#how" },
];

export function LandingHeader() {
  const [open, setOpen] = useState(false);
  const { openModal } = useAuthModal();

  return (
    <header className="sticky top-0 z-50 border-b border-neutral-200/80 bg-white/90 backdrop-blur-md">
      <div className="mx-auto flex max-w-6xl items-center justify-between gap-4 px-4 py-3 sm:px-6 lg:px-8">
        <Link
          to="/"
          className="flex items-center gap-2.5 text-neutral-900"
          onClick={() => setOpen(false)}
        >
          <MonadLogo size={34} />
          <span className="font-sans text-lg font-semibold tracking-tight">
            MonadSwift
          </span>
        </Link>

        <nav className="hidden items-center gap-8 md:flex" aria-label="Main">
          {navLinks.map((l) => (
            <a
              key={l.href}
              href={l.href}
              className="text-sm font-medium text-neutral-600 transition-colors hover:text-neutral-900"
            >
              {l.label}
            </a>
          ))}
        </nav>

        <div className="hidden items-center gap-3 md:flex">
          <button
            type="button"
            onClick={openModal}
            className="text-sm font-medium text-neutral-700 transition-colors hover:text-neutral-900"
          >
            Log in
          </button>
          <button
            type="button"
            onClick={openModal}
            className="rounded-full bg-monad px-5 py-2.5 text-sm font-semibold text-white shadow-sm transition-colors hover:bg-monad-hover"
          >
            Open account
          </button>
        </div>

        <button
          type="button"
          className="inline-flex items-center justify-center rounded-lg p-2 text-neutral-700 md:hidden"
          aria-expanded={open}
          aria-controls="mobile-menu"
          onClick={() => setOpen((v) => !v)}
        >
          <span className="sr-only">Menu</span>
          {open ? (
            <svg className="h-6 w-6" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
            </svg>
          ) : (
            <svg className="h-6 w-6" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 6h16M4 12h16M4 18h16" />
            </svg>
          )}
        </button>
      </div>

      {open ? (
        <div
          id="mobile-menu"
          className="border-t border-neutral-100 bg-white px-4 py-4 md:hidden"
        >
          <nav className="flex flex-col gap-3" aria-label="Mobile">
            {navLinks.map((l) => (
              <a
                key={l.href}
                href={l.href}
                className="text-base font-medium text-neutral-700"
                onClick={() => setOpen(false)}
              >
                {l.label}
              </a>
            ))}
            <button
              type="button"
              className="w-full text-left text-base font-medium text-neutral-700"
              onClick={() => {
                setOpen(false);
                openModal();
              }}
            >
              Log in
            </button>
            <button
              type="button"
              className="mt-1 w-full rounded-full bg-monad py-3 text-center text-base font-semibold text-white"
              onClick={() => {
                setOpen(false);
                openModal();
              }}
            >
              Open account
            </button>
          </nav>
        </div>
      ) : null}
    </header>
  );
}
