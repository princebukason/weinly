import type { Metadata } from "next";

export const metadata: Metadata = {
  title: "Apply to Join as a Supplier",
  description:
    "Apply to become a verified supplier on Weinly. Reach international fabric buyers sourcing from China. Invite-only — we review every application within 24–48 hours.",
  alternates: { canonical: "https://weinlyhq.com/supplier/apply" },
  openGraph: {
    title: "Apply to Join Weinly as a Fabric Supplier",
    description:
      "Reach international buyers sourcing fabric from China. Apply to become a verified Weinly supplier and start receiving quote requests.",
    url: "https://weinlyhq.com/supplier/apply",
  },
};

export default function SupplierApplyLayout({ children }: { children: React.ReactNode }) {
  return <>{children}</>;
}
