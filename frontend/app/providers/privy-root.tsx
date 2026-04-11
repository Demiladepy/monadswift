import { PrivyProvider } from "@privy-io/react-auth";
import type { PrivyClientConfig } from "@privy-io/react-auth";
import type { ReactNode } from "react";
import { AuthModal } from "~/components/auth-modal";
import { AuthModalMissingEnv } from "~/components/auth-modal-missing-env";
import { AuthModalProvider } from "~/contexts/auth-modal";
import { getPrivyAppId } from "~/lib/privy-app-id";
import { monadMainnet } from "~/lib/monad-chain";

const privyConfig: PrivyClientConfig = {
  loginMethods: ["email", "google", "twitter"],
  appearance: {
    theme: "light",
    accentColor: "#7b52ff",
    landingHeader: "MonadSwift",
    loginMessage: "Nano-Bank on Monad — embedded wallet in seconds.",
  },
  supportedChains: [monadMainnet],
  defaultChain: monadMainnet,
  embeddedWallets: {
    ethereum: {
      createOnLogin: "users-without-wallets",
    },
  },
};

export function PrivyRoot({ children }: { children: ReactNode }) {
  const appId = getPrivyAppId();

  return (
    <AuthModalProvider>
      {appId ? (
        <PrivyProvider appId={appId} config={privyConfig}>
          {children}
          <AuthModal />
        </PrivyProvider>
      ) : (
        <>
          {children}
          <AuthModalMissingEnv />
        </>
      )}
    </AuthModalProvider>
  );
}
