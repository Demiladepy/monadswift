/**
 * Kuru Flow API (quotes) — https://docs.kuru.io
 * POST https://ws.kuru.io/api/generate-token
 * POST https://ws.kuru.io/api/quote
 */

const FLOW_BASE = import.meta.env.VITE_KURU_FLOW_BASE ?? "https://ws.kuru.io/api";

export type KuruQuoteRequest = {
  userAddress: `0x${string}`;
  tokenIn: `0x${string}`;
  tokenOut: `0x${string}`;
  amount: string;
  slippageTolerance: number;
  autoSlippage: boolean;
};

export type KuruQuoteResponse = {
  type?: string;
  status: string;
  output?: string;
  message?: string;
  path?: unknown;
  buildResponse?: unknown;
  gasPrices?: unknown;
};

export async function kuruGenerateToken(userAddress: `0x${string}`): Promise<{
  token: string;
  expires_at: number;
}> {
  const res = await fetch(`${FLOW_BASE}/generate-token`, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ user_address: userAddress }),
  });
  if (!res.ok) {
    const text = await res.text();
    throw new Error(`Kuru token ${res.status}: ${text.slice(0, 200)}`);
  }
  return res.json() as Promise<{ token: string; expires_at: number }>;
}

export async function kuruFetchQuote(
  jwt: string,
  body: KuruQuoteRequest,
): Promise<KuruQuoteResponse> {
  const res = await fetch(`${FLOW_BASE}/quote`, {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
      Authorization: `Bearer ${jwt}`,
    },
    body: JSON.stringify(body),
  });
  const data = (await res.json()) as KuruQuoteResponse & { message?: string };
  if (!res.ok) {
    throw new Error(data.message ?? `Kuru quote ${res.status}`);
  }
  return data;
}

/** Try to turn Kuru `buildResponse` into a Privy-compatible tx request. */
export function parseBuildResponseToTx(
  buildResponse: unknown,
): { to: `0x${string}`; data: `0x${string}`; value?: bigint } | null {
  if (!buildResponse || typeof buildResponse !== "object") return null;
  const br = buildResponse as Record<string, unknown>;

  const nested =
    (br.transaction as Record<string, unknown> | undefined) ??
    (br.tx as Record<string, unknown> | undefined) ??
    (br.request as Record<string, unknown> | undefined);

  const src = nested ?? br;
  const to = src.to ?? src.target;
  const data = src.data ?? src.calldata;
  const valueRaw = src.value;

  if (typeof to !== "string" || !to.startsWith("0x")) return null;
  if (typeof data !== "string" || !data.startsWith("0x")) return null;

  let value: bigint | undefined;
  if (valueRaw !== undefined && valueRaw !== null) {
    if (typeof valueRaw === "bigint") value = valueRaw;
    else if (typeof valueRaw === "string") value = BigInt(valueRaw);
    else if (typeof valueRaw === "number") value = BigInt(valueRaw);
  }

  return {
    to: to as `0x${string}`,
    data: data as `0x${string}`,
    value,
  };
}
