import type { PrivyClient, User as PrivyUser } from "@privy-io/node";

/** Underlying REST client exposes `_get(userId)` (not in public TS surface). */
export function getUserById(
  privyUsers: ReturnType<PrivyClient["users"]>,
  userId: string,
): Promise<PrivyUser> {
  const api = privyUsers as { _get: (id: string) => Promise<PrivyUser> };
  return api._get(userId);
}

export function getPrimaryEvmAddress(user: PrivyUser): `0x${string}` | null {
  for (const a of user.linked_accounts) {
    if (a.type === "wallet" && "address" in a && a.chain_type === "ethereum") {
      return a.address as `0x${string}`;
    }
    if (a.type === "smart_wallet" && "address" in a) {
      return a.address as `0x${string}`;
    }
  }
  return null;
}

/** Email / @handle we index for resolution (first match wins). */
export function primaryResolvableIdentifier(user: PrivyUser): string | null {
  for (const a of user.linked_accounts) {
    if (a.type === "email" && "address" in a) {
      return a.address.trim().toLowerCase();
    }
  }
  for (const a of user.linked_accounts) {
    if (a.type === "google_oauth" && "email" in a && a.email) {
      return a.email.trim().toLowerCase();
    }
  }
  for (const a of user.linked_accounts) {
    if (a.type === "twitter_oauth" && "username" in a && a.username) {
      return `@${a.username.trim().toLowerCase()}`;
    }
  }
  for (const a of user.linked_accounts) {
    if (a.type === "discord_oauth" && a.username) {
      return `@${a.username.trim().toLowerCase()}`;
    }
  }
  return null;
}
