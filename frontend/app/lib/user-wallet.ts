import type { User } from "@privy-io/react-auth";

/** EVM address from Privy user (embedded / linked wallet), not dependent on `useWallets()` connectors. */
export function getUserEvmAddress(user: User | null): `0x${string}` | undefined {
  if (!user) return undefined;
  const top = user.wallet?.address;
  if (top) return top as `0x${string}`;

  for (const a of user.linkedAccounts ?? []) {
    if (a.type === "wallet" && "address" in a && typeof a.address === "string") {
      return a.address as `0x${string}`;
    }
    if (a.type === "smart_wallet" && "address" in a && typeof a.address === "string") {
      return a.address as `0x${string}`;
    }
  }
  return undefined;
}
