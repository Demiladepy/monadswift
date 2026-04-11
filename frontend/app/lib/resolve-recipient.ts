import { createPublicClient, http, isAddress, isAddressEqual, zeroAddress } from "viem";
import { monadAppChain } from "~/lib/monad-chain";

/** Minimal registry: `resolve(string) → address` (zero = unset). */
const registryResolveAbi = [
  {
    name: "resolve",
    type: "function",
    stateMutability: "view",
    inputs: [{ name: "identifier", type: "string" }],
    outputs: [{ type: "address", name: "" }],
  },
] as const;

/** Loose check for email or @handle. */
export function looksLikeSocial(raw: string): boolean {
  const t = raw.trim();
  if (t.startsWith("@") && t.length > 1) return true;
  return /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(t);
}

export type ClassifiedRecipient =
  | { kind: "address"; to: `0x${string}` }
  | { kind: "social"; label: string }
  | { kind: "empty" }
  | { kind: "invalid" };

export function classifyRecipient(raw: string): ClassifiedRecipient {
  const t = raw.trim();
  if (t === "") return { kind: "empty" };
  if (isAddress(t)) return { kind: "address", to: t };
  if (looksLikeSocial(t)) return { kind: "social", label: t };
  return { kind: "invalid" };
}

function resolverHttpBase(): string | undefined {
  const v = import.meta.env.VITE_RECIPIENT_RESOLVER_URL?.trim();
  return v || undefined;
}

function registryAddress(): `0x${string}` | undefined {
  const v = import.meta.env.VITE_RECIPIENT_REGISTRY_ADDRESS?.trim();
  if (v && isAddress(v)) return v;
  return undefined;
}

/** Inline demo / staging map from env — no HTTP or contract needed. */
function lookupStaticResolverMap(label: string): `0x${string}` | null {
  const raw = import.meta.env.VITE_RECIPIENT_RESOLVER_MAP?.trim();
  if (!raw) return null;
  try {
    const o = JSON.parse(raw) as Record<string, unknown>;
    const lower = label.trim().toLowerCase();
    for (const [k, val] of Object.entries(o)) {
      if (k.trim().toLowerCase() !== lower) continue;
      if (typeof val !== "string" || !isAddress(val)) return null;
      if (isAddressEqual(val, zeroAddress)) return null;
      return val;
    }
  } catch {
    return null;
  }
  return null;
}

function staticMapConfigured(): boolean {
  const raw = import.meta.env.VITE_RECIPIENT_RESOLVER_MAP?.trim();
  if (!raw) return false;
  try {
    const o = JSON.parse(raw) as Record<string, unknown>;
    return typeof o === "object" && o !== null && Object.keys(o).length > 0;
  } catch {
    return false;
  }
}

/**
 * Map email / @handle → `0x` via optional HTTP resolver and/or on-chain registry.
 *
 * **HTTP:** `GET {VITE_RECIPIENT_RESOLVER_URL}?q={encodeURIComponent(identifier)}`
 * JSON body: `{ "address": "0x..." }` (also accepts `wallet` or `to`).
 *
 * **On-chain:** `readContract` on `VITE_RECIPIENT_REGISTRY_ADDRESS` using `resolve(string)`.
 *
 * **Static map:** `VITE_RECIPIENT_RESOLVER_MAP` JSON — checked first (fastest for demos).
 */
export async function resolveSocialRecipient(
  label: string,
): Promise<{ ok: true; to: `0x${string}` } | { ok: false; error: string }> {
  const trimmed = label.trim();
  if (!looksLikeSocial(trimmed)) {
    return { ok: false, error: "Not an email or @handle" };
  }

  const fromMap = lookupStaticResolverMap(trimmed);
  if (fromMap) {
    return { ok: true, to: fromMap };
  }

  const httpBase = resolverHttpBase();
  if (httpBase) {
    try {
      let u: URL;
      try {
        u = new URL(httpBase);
      } catch {
        return { ok: false, error: "Invalid VITE_RECIPIENT_RESOLVER_URL" };
      }
      u.searchParams.set("q", trimmed);
      const res = await fetch(u.toString(), {
        method: "GET",
        headers: { Accept: "application/json" },
      });
      const j: unknown = await res.json().catch(() => null);
      if (!res.ok) {
        const msg =
          j && typeof j === "object" && "message" in j && typeof (j as { message: unknown }).message === "string"
            ? (j as { message: string }).message
            : `Resolver HTTP ${res.status}`;
        return { ok: false, error: msg };
      }
      if (!j || typeof j !== "object") {
        return { ok: false, error: "Invalid JSON from resolver" };
      }
      const o = j as Record<string, unknown>;
      const raw = o.address ?? o.wallet ?? o.to;
      if (typeof raw !== "string" || !isAddress(raw)) {
        return { ok: false, error: "Resolver did not return a valid address" };
      }
      if (isAddressEqual(raw, zeroAddress)) {
        return { ok: false, error: "No wallet linked to this identifier" };
      }
      return { ok: true, to: raw };
    } catch (e) {
      return { ok: false, error: e instanceof Error ? e.message : "Resolver request failed" };
    }
  }

  const reg = registryAddress();
  if (reg) {
    try {
      const client = createPublicClient({
        chain: monadAppChain,
        transport: http(monadAppChain.rpcUrls.default.http[0]),
      });
      const addr = await client.readContract({
        address: reg,
        abi: registryResolveAbi,
        functionName: "resolve",
        args: [trimmed],
      });
      if (isAddressEqual(addr, zeroAddress)) {
        return { ok: false, error: "No wallet linked to this identifier" };
      }
      return { ok: true, to: addr };
    } catch (e) {
      return {
        ok: false,
        error:
          e instanceof Error
            ? e.message
            : "Registry read failed — check `resolve(string)` on your contract",
      };
    }
  }

  return {
    ok: false,
    error:
      "No match in VITE_RECIPIENT_RESOLVER_MAP, and no HTTP URL / registry. Add a map entry, VITE_RECIPIENT_RESOLVER_URL, or VITE_RECIPIENT_REGISTRY_ADDRESS in .env",
  };
}

export function resolutionConfigured(): boolean {
  return Boolean(staticMapConfigured() || resolverHttpBase() || registryAddress());
}
