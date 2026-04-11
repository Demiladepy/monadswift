import {
  getMoonpayCurrencyCodeMon,
  getMoonpayCurrencyCodeUsdc,
  getMoonpayNetworkCode,
  getMoonpayQuoteAmountMon,
  getMoonpayQuoteAmountUsdc,
  moonpayUseSandbox,
} from "./moonpay-config";

const MOONPAY_BUY_SANDBOX = "https://buy-sandbox.moonpay.com";
const MOONPAY_BUY_PROD = "https://buy.moonpay.com";

export type MoonpayDepositAsset = "MON" | "USDC";

/**
 * Build a MoonPay buy URL (same pattern as Privy’s fiat-onramp demo):
 * direct widget + publishable `apiKey`, no Privy “Account funding” onramp config.
 *
 * Currency / network codes must match your MoonPay dashboard; use env overrides if MoonPay
 * uses different codes for Monad MON / USDC.
 */
export function buildMoonpayBuyUrl(opts: {
  walletAddress: `0x${string}`;
  apiKey: string;
  asset: MoonpayDepositAsset;
  sandbox?: boolean;
}): string {
  const useSandbox = opts.sandbox ?? moonpayUseSandbox();
  const base = useSandbox ? MOONPAY_BUY_SANDBOX : MOONPAY_BUY_PROD;
  const params = new URLSearchParams();
  params.set("apiKey", opts.apiKey);
  params.set("walletAddress", opts.walletAddress);
  const currencyCode =
    opts.asset === "MON"
      ? getMoonpayCurrencyCodeMon()
      : getMoonpayCurrencyCodeUsdc();
  params.set("currencyCode", currencyCode.toLowerCase());
  params.set("networkCode", getMoonpayNetworkCode().toLowerCase());
  const quote =
    opts.asset === "MON" ? getMoonpayQuoteAmountMon() : getMoonpayQuoteAmountUsdc();
  params.set("quoteCurrencyAmount", quote);
  params.set("defaultPaymentMethod", "card");
  return `${base}/?${params.toString()}`;
}
