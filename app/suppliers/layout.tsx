import type { Metadata } from "next";

export const metadata: Metadata = {
  title: "Verified Fabric Suppliers from China",
  description:
    "Browse Weinly's directory of verified Chinese fabric manufacturers. Filter by category, see ready stock, reviews and request quotes directly.",
  alternates: { canonical: "https://weinlyhq.com/suppliers" },
  openGraph: {
    title: "Verified Fabric Suppliers from China | Weinly",
    description:
      "Browse verified Chinese fabric suppliers on Weinly. Filter by category, read reviews, and request quotes.",
    url: "https://weinlyhq.com/suppliers",
  },
};

export default function SuppliersLayout({ children }: { children: React.ReactNode }) {
  return <>{children}</>;
}
