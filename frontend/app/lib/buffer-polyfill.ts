/**
 * Privy / some wallet code expects `Buffer` and `global` in the browser.
 * Use Node's `node:buffer` under SSR (external — no npm `buffer` / no `require`).
 * Vite resolves `node:buffer` → npm `buffer` only for the client bundle (see `vite.config.ts`).
 */
import { Buffer as BufferImpl } from "node:buffer";

const g = globalThis as typeof globalThis & {
  Buffer?: typeof BufferImpl;
  global?: typeof globalThis;
};

if (g.Buffer === undefined) {
  g.Buffer = BufferImpl;
}
if (g.global === undefined) {
  g.global = globalThis;
}
