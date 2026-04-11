import { useCallback, useEffect, useState } from "react";
import { createPublicClient, formatEther, formatUnits, http, type Address } from "viem";
import { KURU_TESTNET_SWAP_OUT } from "~/lib/kuru-testnet-swap";
import { monadAppChain } from "~/lib/monad-chain";

const erc20BalanceAbi = [
  {
    name: "balanceOf",
    type: "function",
    stateMutability: "view",
    inputs: [{ name: "account", type: "address" }],
    outputs: [{ name: "balance", type: "uint256" }],
  },
] as const;

/**
 * Native MON + Kuru testnet token balances for the swap widget (addresses from `KURU_TESTNET_SWAP_OUT`).
 */
export function useKuruSwapBalances(walletAddress: `0x${string}` | undefined) {
  const [mon, setMon] = useState<string | null>(null);
  const [erc20, setErc20] = useState<Partial<Record<string, string>>>({});
  const [loading, setLoading] = useState(false);

  const refresh = useCallback(async () => {
    if (!walletAddress) {
      setMon(null);
      setErc20({});
      return;
    }
    const client = createPublicClient({
      chain: monadAppChain,
      transport: http(monadAppChain.rpcUrls.default.http[0]),
    });
    setLoading(true);
    try {
      const wei = await client.getBalance({ address: walletAddress });
      setMon(formatEther(wei));

      const next: Partial<Record<string, string>> = {};
      await Promise.all(
        KURU_TESTNET_SWAP_OUT.map(async (t) => {
          try {
            const raw = await client.readContract({
              address: t.address as Address,
              abi: erc20BalanceAbi,
              functionName: "balanceOf",
              args: [walletAddress],
            });
            next[t.address.toLowerCase()] = formatUnits(raw, t.decimals);
          } catch {
            next[t.address.toLowerCase()] = "0";
          }
        }),
      );
      setErc20(next);
    } finally {
      setLoading(false);
    }
  }, [walletAddress]);

  useEffect(() => {
    void refresh();
    if (!walletAddress) return;
    const t = window.setInterval(() => void refresh(), 14_000);
    return () => window.clearInterval(t);
  }, [refresh, walletAddress]);

  function balanceForSymbol(symbol: string): string | null {
    if (symbol === "MON") return mon;
    const row = KURU_TESTNET_SWAP_OUT.find((t) => t.symbol === symbol);
    if (!row) return null;
    return erc20[row.address.toLowerCase()] ?? null;
  }

  return { mon, erc20, loading, refresh, balanceForSymbol };
}
