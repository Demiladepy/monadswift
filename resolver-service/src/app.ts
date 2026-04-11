import { Hono } from "hono";
import { cors } from "hono/cors";
import { isAddress } from "viem";
import { PrivyClient } from "@privy-io/node";
import { lookupHandle, normalizeIdentifier, upsertHandle } from "./db.js";
import { getPrimaryEvmAddress, getUserById, primaryResolvableIdentifier } from "./privy-user.js";

const app = new Hono();

const corsOrigin = process.env.CORS_ORIGIN?.trim() || "*";
app.use(
  "*",
  cors({
    origin: corsOrigin === "*" ? "*" : corsOrigin.split(",").map((o) => o.trim()),
    allowMethods: ["GET", "POST", "OPTIONS"],
    allowHeaders: ["Authorization", "Content-Type"],
  }),
);

function getPrivy(): PrivyClient {
  const appId = process.env.PRIVY_APP_ID?.trim();
  const appSecret = process.env.PRIVY_APP_SECRET?.trim();
  if (!appId || !appSecret) {
    throw new Error("Set PRIVY_APP_ID and PRIVY_APP_SECRET (same app as the frontend)");
  }
  return new PrivyClient({ appId, appSecret });
}

app.get("/health", (c) => c.json({ ok: true }));

/** Public lookup — used by the wallet app (`VITE_RECIPIENT_RESOLVER_URL`). */
app.get("/resolve", async (c) => {
  const q = c.req.query("q")?.trim();
  if (!q) {
    return c.json({ message: "Missing q" }, 400);
  }
  try {
    const wallet = await lookupHandle(q);
    if (!wallet) {
      return c.json({ message: "Not found" }, 404);
    }
    return c.json({ address: wallet });
  } catch (e) {
    console.error(e);
    return c.json({ message: e instanceof Error ? e.message : "Lookup failed" }, 500);
  }
});

/**
 * Register this session's email / social handle → embedded wallet.
 * Requires `Authorization: Bearer <Privy access token>`.
 * Body: `{ "wallet": "0x..." }` must match the user's Privy embedded EVM wallet.
 */
app.post("/v1/register", async (c) => {
  const auth = c.req.header("Authorization") ?? "";
  const m = /^Bearer\s+(.+)$/i.exec(auth);
  if (!m) {
    return c.json({ message: "Missing Authorization: Bearer <access_token>" }, 401);
  }

  let body: { wallet?: string };
  try {
    body = await c.req.json();
  } catch {
    return c.json({ message: "Invalid JSON body" }, 400);
  }
  const wallet = body.wallet?.trim();
  if (!wallet || !isAddress(wallet)) {
    return c.json({ message: "Body must include wallet: 0x…" }, 400);
  }

  try {
    const privy = getPrivy();
    const claims = await privy.utils().auth().verifyAccessToken(m[1]);
    const fullUser = await getUserById(privy.users(), claims.user_id);
    const evm = getPrimaryEvmAddress(fullUser);
    if (!evm || evm.toLowerCase() !== wallet.toLowerCase()) {
      return c.json({ message: "Wallet does not match your Privy embedded address" }, 403);
    }
    const identifier = primaryResolvableIdentifier(fullUser);
    if (!identifier) {
      return c.json({
        message:
          "No email or social account linked in Privy — link email (or Twitter/Discord) to register for pay-by-handle",
      }, 400);
    }
    await upsertHandle(identifier, wallet);
    return c.json({ ok: true, identifier: normalizeIdentifier(identifier), wallet: evm });
  } catch (e) {
    console.error(e);
    const msg = e instanceof Error ? e.message : "Register failed";
    if (msg.includes("verify") || msg.includes("token") || msg.includes("Token")) {
      return c.json({ message: msg }, 401);
    }
    return c.json({ message: msg }, 500);
  }
});

export { app };
