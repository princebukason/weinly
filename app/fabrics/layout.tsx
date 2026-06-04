import type { Metadata } from "next";

export const metadata: Metadata = {
  title: "All Fabric Categories from China",
  description:
    "Explore 18 fabric categories and 500+ fabric types available from verified Chinese manufacturers on Weinly — lace, cotton, ankara, silk, denim, velvet, sustainable fabrics and more.",
  alternates: { canonical: "https://weinlyhq.com/fabrics" },
  openGraph: {
    title: "All Fabric Categories from China | Weinly",
    description:
      "18 categories, 500+ fabric types. Source any fabric directly from verified Chinese manufacturers through Weinly.",
    url: "https://weinlyhq.com/fabrics",
  },
};

export default function FabricsLayout({ children }: { children: React.ReactNode }) {
  return <>{children}</>;
}
