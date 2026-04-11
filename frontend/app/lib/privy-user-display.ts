import type { User } from "@privy-io/react-auth";

/** Best-effort email for UI: email login, Google, Apple, or linked accounts. */
export function getUserDisplayEmail(user: User | null | undefined): string | null {
  if (!user) return null;
  if (user.email?.address) return user.email.address;
  if (user.google?.email) return user.google.email;
  if (user.apple?.email) return user.apple.email;
  if (user.discord?.email) return user.discord.email;
  if (user.github?.email) return user.github.email;
  if (user.spotify?.email) return user.spotify.email;
  if (user.line?.email) return user.line.email;
  if (user.linkedin?.email) return user.linkedin.email;

  for (const a of user.linkedAccounts ?? []) {
    if (a.type === "email" && "address" in a && typeof a.address === "string") {
      return a.address;
    }
    if (a.type === "google_oauth" && "email" in a && typeof (a as { email?: string }).email === "string") {
      const e = (a as { email: string }).email;
      if (e) return e;
    }
    if (a.type === "apple_oauth" && "email" in a && typeof (a as { email?: string }).email === "string") {
      const e = (a as { email: string }).email;
      if (e) return e;
    }
  }
  return null;
}
