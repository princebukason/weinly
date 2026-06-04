import type { Metadata } from "next";

export const metadata: Metadata = {
  title: "Pricing — Transparent Sourcing Fees",
  description:
    "Weinly charges a flat fee to unlock supplier contact details — no subscriptions, no hidden charges. Submit requests free, pay only when you find a supplier you want.",
  alternates: { canonical: "https://weinlyhq.com/pricing" },
  openGraph: {
    title: "Pricing — Transparent Sourcing Fees | Weinly",
    description:
      "Free to submit fabric requests. Pay a flat fee only when you're ready to contact a supplier. No subscriptions, no surprises.",
    url: "https://weinlyhq.com/pricing",
  },
};

export default function PricingLayout({ children }: { children: React.ReactNode }) {
  return <>{children}</>;
}
