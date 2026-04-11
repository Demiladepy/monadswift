/** External ecosystem apps — update URLs if teams ship new hosts. */
export const ECOSYSTEM = {
  kintsu: {
    name: "Kintsu",
    description: "Liquid staking on Monad — abstracted validator exposure.",
    url: "https://kintsu.xyz",
  },
  magma: {
    name: "Magma",
    description: "Monad-native yield and staking — update this URL to your live vault link.",
    url: "https://magmastaking.io",
  },
  kuruDocs: "https://docs.kuru.io",
  kuruExchange: "https://exchange.kuru.io",
  monadVision: "https://monadvision.com",
} as const;

/** Kuru [mainnet contract addresses](https://docs.kuru.io/contracts/Contract-addresses) */
export const KURU_MAINNET = {
  kuruFlowRouter: "0x0d3a1BE29E9dEd63c7a5678b31e847D68F71FFa2",
  usdc: "0x754704Bc059F8C67012fEd69BC8A327a5aafb603",
  wmon: "0x3bd359C1119dA7Da1D913D1C4D2B7c461115433A",
  monUsdcMarket: "0x065C9d28E428A0db40191a54d33d5b7c71a9C394",
} as const;
