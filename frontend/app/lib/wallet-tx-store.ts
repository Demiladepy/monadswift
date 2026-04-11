const STORAGE_KEY = "monadswift_wallet_txs_v1";

export type StoredWalletTx = {
  hash: `0x${string}`;
  savedAt: number;
  source?: "send" | "swap";
};

type StoreShape = Record<string, StoredWalletTx[]>;

function readAll(): StoreShape {
  try {
    const raw = localStorage.getItem(STORAGE_KEY);
    if (!raw) return {};
    const o = JSON.parse(raw) as unknown;
    return o && typeof o === "object" ? (o as StoreShape) : {};
  } catch {
    return {};
  }
}

function writeAll(data: StoreShape) {
  try {
    localStorage.setItem(STORAGE_KEY, JSON.stringify(data));
  } catch {
    /* quota / private mode */
  }
}

export function loadStoredWalletTxs(address: string): StoredWalletTx[] {
  const k = address.trim().toLowerCase();
  if (!k) return [];
  return readAll()[k] ?? [];
}

/** Remember txs initiated from this app (explorer + recent scan may miss or lag). */
export function appendWalletTx(address: string, hash: `0x${string}`, source?: StoredWalletTx["source"]) {
  const k = address.trim().toLowerCase();
  if (!k || !hash.startsWith("0x")) return;
  const all = readAll();
  const list = all[k] ?? [];
  if (list.some((x) => x.hash.toLowerCase() === hash.toLowerCase())) return;
  list.unshift({ hash, savedAt: Date.now(), source });
  all[k] = list.slice(0, 80);
  writeAll(all);
}
