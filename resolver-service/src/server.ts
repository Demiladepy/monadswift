import "dotenv/config";
import fs from "node:fs";
import path from "node:path";
import { serve } from "@hono/node-server";
import { app } from "./app.js";
import { ensureSchema } from "./db.js";

const dbUrl = process.env.TURSO_DATABASE_URL?.trim() ?? "";
if (dbUrl.startsWith("file:")) {
  const raw = dbUrl.replace(/^file:/, "");
  const dir = path.dirname(path.isAbsolute(raw) ? raw : path.resolve(process.cwd(), raw));
  fs.mkdirSync(dir, { recursive: true });
}

const port = Number.parseInt(process.env.PORT ?? "8787", 10);

await ensureSchema().catch((e) => {
  console.error("DB init failed:", e);
  process.exit(1);
});

serve({ fetch: app.fetch, port }, (info) => {
  console.log(`resolver-service listening on http://localhost:${info.port}`);
  console.log(`  GET  /resolve?q=…`);
  console.log(`  POST /v1/register (Bearer + { wallet })`);
});
