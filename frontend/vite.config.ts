import { reactRouter } from "@react-router/dev/vite";
import tailwindcss from "@tailwindcss/vite";
import { defineConfig, loadEnv } from "vite";

/** First non-empty value among keys (Vite `PUBLIC_*` / `NEXT_PUBLIC_*` aliases). */
function envFirst(e: Record<string, string>, keys: string[]): string {
  for (const k of keys) {
    const v = e[k];
    if (v != null && v !== "") return v;
  }
  return "";
}

function envAnyTrue(e: Record<string, string>, keys: string[]): boolean {
  return keys.some((k) => e[k] === "true");
}

export default defineConfig(({ mode }) => {
  const env = loadEnv(mode, process.cwd(), "");
  const privyAppId = env.VITE_PRIVY_APP_ID || env.PRIVY_APP_ID || "";
  const moonpayApiKey = envFirst(env, [
    "VITE_MOONPAY_API_KEY",
    "PUBLIC_MOONPAY_API_KEY",
    "NEXT_PUBLIC_MOONPAY_API_KEY",
  ]);

  const moonpaySandbox = envAnyTrue(env, [
    "VITE_MOONPAY_SANDBOX",
    "PUBLIC_MOONPAY_SANDBOX",
    "NEXT_PUBLIC_MOONPAY_SANDBOX",
  ])
    ? "true"
    : "";

  const moonpayNetworkCode =
    envFirst(env, [
      "VITE_MOONPAY_NETWORK_CODE",
      "PUBLIC_MOONPAY_NETWORK_CODE",
      "NEXT_PUBLIC_MOONPAY_NETWORK_CODE",
    ]) || "monad";

  const moonpayCurrencyMon =
    envFirst(env, [
      "VITE_MOONPAY_CURRENCY_MON",
      "PUBLIC_MOONPAY_CURRENCY_MON",
      "NEXT_PUBLIC_MOONPAY_CURRENCY_MON",
    ]) || "mon";

  const moonpayCurrencyUsdc =
    envFirst(env, [
      "VITE_MOONPAY_CURRENCY_USDC",
      "PUBLIC_MOONPAY_CURRENCY_USDC",
      "NEXT_PUBLIC_MOONPAY_CURRENCY_USDC",
    ]) || "usdc";

  const moonpayQuoteAmountMon =
    envFirst(env, [
      "VITE_MOONPAY_QUOTE_AMOUNT_MON",
      "PUBLIC_MOONPAY_QUOTE_AMOUNT_MON",
      "NEXT_PUBLIC_MOONPAY_QUOTE_AMOUNT_MON",
    ]) || "50";

  const moonpayQuoteAmountUsdc =
    envFirst(env, [
      "VITE_MOONPAY_QUOTE_AMOUNT_USDC",
      "PUBLIC_MOONPAY_QUOTE_AMOUNT_USDC",
      "NEXT_PUBLIC_MOONPAY_QUOTE_AMOUNT_USDC",
    ]) || "50";

  return {
    plugins: [tailwindcss(), reactRouter()],
    resolve: {
      tsconfigPaths: true,
    },
    define: {
      "import.meta.env.VITE_PRIVY_APP_ID": JSON.stringify(privyAppId),
      "import.meta.env.VITE_MOONPAY_API_KEY": JSON.stringify(moonpayApiKey),
      "import.meta.env.VITE_MOONPAY_SANDBOX": JSON.stringify(moonpaySandbox),
      "import.meta.env.VITE_MOONPAY_NETWORK_CODE": JSON.stringify(moonpayNetworkCode),
      "import.meta.env.VITE_MOONPAY_CURRENCY_MON": JSON.stringify(moonpayCurrencyMon),
      "import.meta.env.VITE_MOONPAY_CURRENCY_USDC": JSON.stringify(moonpayCurrencyUsdc),
      "import.meta.env.VITE_MOONPAY_QUOTE_AMOUNT_MON": JSON.stringify(moonpayQuoteAmountMon),
      "import.meta.env.VITE_MOONPAY_QUOTE_AMOUNT_USDC": JSON.stringify(moonpayQuoteAmountUsdc),
    },
  };
});
