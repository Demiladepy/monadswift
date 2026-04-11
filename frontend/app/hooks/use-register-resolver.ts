import { usePrivy } from "@privy-io/react-auth";
import { useEffect, useRef } from "react";
import { getResolverRegisterUrl } from "~/lib/resolver-register-url";
import { getUserEvmAddress } from "~/lib/user-wallet";

/**
 * After login, registers this user's email → embedded wallet when `VITE_RECIPIENT_RESOLVER_URL`
 * points at a backend that exposes `POST /v1/register`. No-op if unset (static map only).
 */
export function useRegisterResolverIdentity() {
  const { ready, authenticated, user, getAccessToken } = usePrivy();
  const attemptedForUserId = useRef<string | null>(null);

  useEffect(() => {
    if (!ready || !authenticated || !user?.id) return;

    const registerUrl = getResolverRegisterUrl();
    if (!registerUrl) return;

    const wallet = getUserEvmAddress(user);
    if (!wallet) return;

    if (attemptedForUserId.current === user.id) return;
    attemptedForUserId.current = user.id;

    void (async () => {
      try {
        const token = await getAccessToken();
        if (!token) {
          attemptedForUserId.current = null;
          return;
        }
        const res = await fetch(registerUrl, {
          method: "POST",
          headers: {
            Authorization: `Bearer ${token}`,
            "Content-Type": "application/json",
          },
          body: JSON.stringify({ wallet }),
        });
        if (!res.ok) {
          const text = await res.text();
          let msg = text;
          try {
            const j = JSON.parse(text) as { message?: string };
            if (j.message) msg = j.message;
          } catch {
            /* ignore */
          }
          console.warn("[resolver] register:", res.status, msg);
        }
      } catch (e) {
        console.warn("[resolver] register failed:", e);
        attemptedForUserId.current = null;
      }
    })();
  }, [ready, authenticated, user, getAccessToken]);
}
