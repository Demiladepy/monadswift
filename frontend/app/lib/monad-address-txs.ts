import type { PublicClient } from "viem";
import { formatEther } from "viem";

export type AddressTxRow = {
  hash: `0x${string}`;
  blockNumber: bigint;
  /** ms */
  timestamp: number;
  from: `0x${string}`;
  to: `0x${string}` | null;
  /** Human-readable MON value when native transfer */
  valueLabel: string | null;
  direction: "in" | "out" | "self";
};

function classify(addr: string, from: string, to: string | null): AddressTxRow["direction"] {
  const a = addr.toLowerCase();
  const f = from.toLowerCase();
  const t = to?.toLowerCase() ?? "";
  if (f === a && t === a) return "self";
  if (f === a) return "out";
  return "in";
}

/**
 * Scan recent blocks for txs involving `address` (native + contract calls).
 * Depth trades RPC load vs coverage — default ~last minute at ~1s blocks.
 */
export async function fetchRecentAddressTxs(
  publicClient: PublicClient,
  address: `0x${string}`,
  maxBlocks = 64,
): Promise<AddressTxRow[]> {
  const latest = await publicClient.getBlockNumber();
  const start = latest >= BigInt(maxBlocks) ? latest - BigInt(maxBlocks) + 1n : 0n;
  const addr = address.toLowerCase();
  const rows: AddressTxRow[] = [];

  const blockNumbers: bigint[] = [];
  for (let n = latest; n >= start; n--) {
    blockNumbers.push(n);
  }

  const blocks = await Promise.all(
    blockNumbers.map((blockNumber) =>
      publicClient.getBlock({ blockNumber, includeTransactions: true }).catch(() => null),
    ),
  );

  for (const block of blocks) {
    if (!block?.transactions?.length) continue;
    const ts = Number(block.timestamp) * 1000;
    for (const tx of block.transactions) {
      if (typeof tx === "string") continue;
      const f = tx.from?.toLowerCase() ?? "";
      const t = tx.to?.toLowerCase() ?? null;
      if (f !== addr && t !== addr) continue;
      const valueLabel =
        tx.value !== undefined && tx.value > 0n ? `${formatEther(tx.value)} MON` : null;
      rows.push({
        hash: tx.hash,
        blockNumber: block.number!,
        timestamp: ts,
        from: tx.from,
        to: tx.to,
        valueLabel,
        direction: classify(addr, f, t),
      });
    }
  }

  rows.sort((a, b) => (a.blockNumber > b.blockNumber ? -1 : a.blockNumber < b.blockNumber ? 1 : 0));

  const seen = new Set<string>();
  const deduped: AddressTxRow[] = [];
  for (const r of rows) {
    const h = r.hash.toLowerCase();
    if (seen.has(h)) continue;
    seen.add(h);
    deduped.push(r);
  }
  return deduped;
}
