import { createClient, type Client } from "@libsql/client";

let client: Client | null = null;

export function getDb(): Client {
  if (client) return client;
  const url = process.env.TURSO_DATABASE_URL?.trim();
  if (!url) {
    throw new Error("Set TURSO_DATABASE_URL (e.g. file:./data/resolver.db or your Turso URL)");
  }
  const authToken = process.env.TURSO_AUTH_TOKEN?.trim();
  client = createClient(
    authToken ? { url, authToken } : { url },
  );
  return client;
}

export async function ensureSchema(): Promise<void> {
  const db = getDb();
  await db.execute(`
    CREATE TABLE IF NOT EXISTS recipient_handles (
      identifier TEXT PRIMARY KEY,
      wallet TEXT NOT NULL,
      updated_at INTEGER NOT NULL
    );
  `);
}

export function normalizeIdentifier(raw: string): string {
  const t = raw.trim();
  if (t.startsWith("@")) return `@${t.slice(1).toLowerCase()}`;
  return t.toLowerCase();
}

export async function upsertHandle(identifier: string, wallet: string): Promise<void> {
  const db = getDb();
  const id = normalizeIdentifier(identifier);
  const now = Math.floor(Date.now() / 1000);
  await db.execute({
    sql: `INSERT INTO recipient_handles (identifier, wallet, updated_at)
          VALUES (?, ?, ?)
          ON CONFLICT(identifier) DO UPDATE SET wallet = excluded.wallet, updated_at = excluded.updated_at`,
    args: [id, wallet.toLowerCase(), now],
  });
}

export async function lookupHandle(identifier: string): Promise<string | null> {
  const db = getDb();
  const id = normalizeIdentifier(identifier);
  const row = await db.execute({
    sql: `SELECT wallet FROM recipient_handles WHERE identifier = ? LIMIT 1`,
    args: [id],
  });
  const r = row.rows[0];
  if (!r) return null;
  const rec = r as Record<string, unknown>;
  const w = rec.wallet;
  return typeof w === "string" ? w : null;
}
