/** Publishable MoonPay API key (set in Vite env; see `vite.config.ts` for aliases). */
export function getMoonpayApiKey(): string {
  return import.meta.env.VITE_MOONPAY_API_KEY ?? "";
}

export function moonpayUseSandbox(): boolean {
  return import.meta.env.VITE_MOONPAY_SANDBOX === "true";
}

/** MoonPay network identifier — must match what your MoonPay dashboard lists for Monad. */
export function getMoonpayNetworkCode(): string {
  return import.meta.env.VITE_MOONPAY_NETWORK_CODE ?? "monad";
}

export function getMoonpayCurrencyCodeMon(): string {
  return import.meta.env.VITE_MOONPAY_CURRENCY_MON ?? "mon";
}

export function getMoonpayCurrencyCodeUsdc(): string {
  return import.meta.env.VITE_MOONPAY_CURRENCY_USDC ?? "usdc";
}

export function getMoonpayQuoteAmountMon(): string {
  return import.meta.env.VITE_MOONPAY_QUOTE_AMOUNT_MON ?? "50";
}

export function getMoonpayQuoteAmountUsdc(): string {
  return import.meta.env.VITE_MOONPAY_QUOTE_AMOUNT_USDC ?? "50";
}
