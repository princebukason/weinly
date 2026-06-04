import type { Metadata } from "next";

export const metadata: Metadata = {
  title: "Supplier Login",
  description: "Log in to your Weinly supplier account to view buyer requests and submit quotes.",
  alternates: { canonical: "https://weinlyhq.com/supplier/auth" },
  robots: { index: false, follow: false },
};

export default function SupplierAuthLayout({ children }: { children: React.ReactNode }) {
  return <>{children}</>;
}
