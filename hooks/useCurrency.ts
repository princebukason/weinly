import { useEffect, useState } from "react";

type Currency = "NGN" | "USD";

export type PriceSet = {
  currency: Currency;
  symbol: string;
  unlock: string;       // one-time contact unlock
  proMonthly: string;   // pro monthly
  proYearly: string;    // pro yearly
  unlockRaw: number;    // numeric, used for Paystack amount in kobo/cents
};

const NGN: PriceSet = {
  currency: "NGN",
  symbol: "₦",
  unlock: "₦10,000",
  proMonthly: "₦25,000",
  proYearly: "₦200,000",
  unlockRaw: 1000000, // kobo
};

const USD: PriceSet = {
  currency: "USD",
  symbol: "$",
  unlock: "$9",
  proMonthly: "$20",
  proYearly: "$130",
  unlockRaw: 900, // cents
};

function detectNigeria(): boolean {
  if (typeof navigator === "undefined") return true; // SSR default to NGN
  const locale = navigator.language || "";
  const tz = Intl.DateTimeFormat().resolvedOptions().timeZone || "";
  return (
    locale.toLowerCase().includes("ng") ||
    tz.toLowerCase().includes("lagos") ||
    tz.toLowerCase().includes("africa/lagos")
  );
}

export function useCurrency(): PriceSet {
  const [prices, setPrices] = useState<PriceSet>(NGN);

  useEffect(() => {
    setPrices(detectNigeria() ? NGN : USD);
  }, []);

  return prices;
}