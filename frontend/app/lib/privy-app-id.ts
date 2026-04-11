/** Client-side Privy App ID (from Vite env; see vite.config.ts for PRIVY_APP_ID alias). */
export function getPrivyAppId(): string {
  return import.meta.env.VITE_PRIVY_APP_ID ?? "";
}
