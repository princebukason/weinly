import type { Metadata } from "next";

export const metadata: Metadata = {
  title: "Ready Stock Fabric — Fast Delivery from China",
  description:
    "Browse fabric that's already in stock and available for immediate shipment. Lace, cotton, ankara, chiffon and more — direct from Chinese suppliers.",
  alternates: { canonical: "https://weinlyhq.com/ready-stock" },
  openGraph: {
    title: "Ready Stock Fabric — Fast Delivery from China | Weinly",
    description:
      "Fabric already in stock, ready for immediate shipment. Browse ready-stock listings from verified Chinese suppliers on Weinly.",
    url: "https://weinlyhq.com/ready-stock",
  },
};

export default function ReadyStockLayout({ children }: { children: React.ReactNode }) {
  return <>{children}</>;
}
