import { usePrivy } from "@privy-io/react-auth";
import { createPublicClient, formatEther, formatUnits, http } from "viem";
import { useCallback, useEffect, useMemo, useState } from "react";
import { MONAD_APP_USDC, monadAppChain } from "~/lib/monad-chain";
import { getUserEvmAddress } from "~/lib/user-wallet";

const erc20BalanceAbi = [
  {
    name: "balanceOf",
    type: "function",
    stateMutability: "view",
    inputs: [{ name: "account", type: "address" }],
    outputs: [{ name: "balance", type: "uint256" }],
  },
] as const;

export function useMonadBalances() {
  const { user, ready } = usePrivy();
  const walletAddress = useMemo(() => getUserEvmAddress(user), [user]);

  const publicClient = useMemo(
    () =>
      createPublicClient({
        chain: monadAppChain,
        transport: http(monadAppChain.rpcUrls.default.http[0]),
      }),
    [],
  );

  const [balanceMon, setBalanceMon] = useState<string | null>(null);
  const [balanceUsdc, setBalanceUsdc] = useState<string | null>(null);
  /** Only set when the USDC `balanceOf` call fails (native MON may still load). */
  const [usdcError, setUsdcError] = useState<string | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [refreshing, setRefreshing] = useState(false);

  const refresh = useCallback(async () => {
    if (!walletAddress) {
      setBalanceMon(null);
      setBalanceUsdc(null);
      setUsdcError(null);
      return;
    }
    setRefreshing(true);
    setError(null);
    setUsdcError(null);
    try {
      try {
        const wei = await publicClient.getBalance({ address: walletAddress });
        setBalanceMon(formatEther(wei));
      } catch (e) {
        setError(e instanceof Error ? e.message : "Could not load MON balance");
        setBalanceMon(null);
      }

      try {
        const usdcRaw = await publicClient.readContract({
          address: MONAD_APP_USDC,
          abi: erc20BalanceAbi,
          functionName: "balanceOf",
          args: [walletAddress],
        });
        setBalanceUsdc(formatUnits(usdcRaw, 6));
      } catch (e) {
        const msg = e instanceof Error ? e.message : "Could not load USDC balance";
        setUsdcError(msg);
        setBalanceUsdc(null);
      }
    } finally {
      setRefreshing(false);
    }
  }, [walletAddress, publicClient]);

  useEffect(() => {
    if (!ready || !walletAddress) return;
    void refresh();
    const t = window.setInterval(() => void refresh(), 14_000);
    return () => window.clearInterval(t);
  }, [ready, walletAddress, refresh]);

  return {
    walletAddress,
    balanceMon,
    balanceUsdc,
    error,
    usdcError,
    refreshing,
    refresh,
  };
}
