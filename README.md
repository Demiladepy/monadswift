# MonadSwift

Web app for **MonadSwift** — social onboarding, embedded wallets, and Monad-native flows (yield, tipping), built with [React Router](https://reactrouter.com/) and [Vite](https://vite.dev/).

## Requirements

- [Node.js](https://nodejs.org/) 22+ (see `frontend/package.json` engines if specified)
- [pnpm](https://pnpm.io/) (lockfile: `frontend/pnpm-lock.yaml`)

## Setup

1. **Install dependencies**

   ```bash
   cd frontend
   pnpm install
   ```

2. **Environment**

   Copy the example env file and fill in values from [Privy](https://dashboard.privy.io/) and [MoonPay](https://dashboard.moonpay.com/) (see comments in the example file):

   ```bash
   cp .env.example .env
   ```

   Do not commit `.env`; it is listed in `.gitignore`. Variable names and optional MoonPay tuning are documented in `frontend/.env.example` and `frontend/vite.config.ts`.

## Scripts

From `frontend/`:

| Command        | Description                          |
| -------------- | ------------------------------------ |
| `pnpm dev`     | Dev server (React Router + Vite)     |
| `pnpm build`   | Production build                     |
| `pnpm start`   | Serve production build locally       |
| `pnpm typecheck` | Route types + TypeScript check     |

## Project layout

- `frontend/` — React Router 7 application (routes, components, styles)
