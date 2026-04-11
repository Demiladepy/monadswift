/** Derives `POST /v1/register` URL from `VITE_RECIPIENT_RESOLVER_URL` (`…/resolve` → `…/v1/register`). */
export function getResolverRegisterUrl(): string | undefined {
  const resolve = import.meta.env.VITE_RECIPIENT_RESOLVER_URL?.trim();
  if (!resolve) return undefined;
  try {
    const u = new URL(resolve);
    u.pathname = "/v1/register";
    return u.toString();
  } catch {
    return undefined;
  }
}
