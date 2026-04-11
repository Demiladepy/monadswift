import { KURU_MAINNET } from "~/lib/ecosystem-links";
import { MONAD_APP_USDC, monadAppNetwork } from "~/lib/monad-chain";

/** Native MON placeholder per Kuru Flow quote examples (ETH-style). */
export const KURU_NATIVE = "0x0000000000000000000000000000000000000000" as const;

/** Map exchange `baseAsset` / `quoteAsset` symbols to on-chain addresses for the active network. */
export function kuruAssetToAddress(asset: string): `0x${string}` | null {
  const u = asset.trim().toUpperCase();
  switch (u) {
    case "MON":
      return KURU_NATIVE;
    case "WMON":
      return monadAppNetwork === "mainnet" ? KURU_MAINNET.wmon : null;
    case "USDC":
      return MONAD_APP_USDC as `0x${string}`;
    case "AUSD":
      return monadAppNetwork === "mainnet"
        ? ("0x00000000eFE302BEAA2b3e6e1b18d08D69a9012a" as `0x${string}`)
        : null;
    default:
      return null;
  }
}

export function decimalsForAsset(asset: string): number {
  const u = asset.trim().toUpperCase();
  if (u === "USDC" || u === "AUSD") return 6;
  return 18;
}
