import { useCallback, useEffect, useMemo, useState } from "react";
import { createPublicClient, http } from "viem";
import { fetchRecentAddressTxs, type AddressTxRow } from "~/lib/monad-address-txs";
import { loadStoredWalletTxs, type StoredWalletTx } from "~/lib/wallet-tx-store";
import { monadAppChain } from "~/lib/monad-chain";

export type DashboardTxRow = AddressTxRow | {
  kind: "stored";
  hash: `0x${string}`;
  timestamp: number;
  source?: StoredWalletTx["source"];
};

export function useMonadTxHistory(walletAddress: string | null | undefined) {
  const [chainRows, setChainRows] = useState<AddressTxRow[]>([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const publicClient = useMemo(
    () =>
      createPublicClient({
        chain: monadAppChain,
        transport: http(monadAppChain.rpcUrls.default.http[0]),
      }),
    [],
  );

  const refresh = useCallback(async () => {
    if (!walletAddress) {
      setChainRows([]);
      return;
    }
    setLoading(true);
    setError(null);
    try {
      const rows = await fetchRecentAddressTxs(publicClient, walletAddress as `0x${string}`, 64);
      setChainRows(rows);
    } catch (e) {
      setError(e instanceof Error ? e.message : "Could not load recent transactions");
      setChainRows([]);
    } finally {
      setLoading(false);
    }
  }, [publicClient, walletAddress]);

  useEffect(() => {
    void refresh();
  }, [refresh]);

  const merged: DashboardTxRow[] = useMemo(() => {
    if (!walletAddress) return [];
    const stored = loadStoredWalletTxs(walletAddress);
    const chainHashes = new Set(chainRows.map((r) => r.hash.toLowerCase()));

    const extras: DashboardTxRow[] = stored
      .filter((s) => !chainHashes.has(s.hash.toLowerCase()))
      .map((s) => ({
        kind: "stored" as const,
        hash: s.hash,
        timestamp: s.savedAt,
        source: s.source,
      }));

    const fromChain: DashboardTxRow[] = chainRows.map((r) => r);

    const all = [...fromChain, ...extras];
    all.sort((a, b) => b.timestamp - a.timestamp);
    return all.slice(0, 40);
  }, [walletAddress, chainRows]);

  return { rows: merged, loading, error, refresh };
}
