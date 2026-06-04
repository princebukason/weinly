import "./globals.css";
import Script from "next/script";
import type { Metadata } from "next";

export const metadata: Metadata = {
  metadataBase: new URL("https://weinlyhq.com"),
  title: {
    default: "Weinly — Fabric Sourcing from China to the World",
    template: "%s | Weinly",
  },
  description:
    "Weinly connects fabric buyers worldwide to verified Chinese manufacturers. Submit a sourcing request, get quotes within 24 hours, and source premium fabrics at factory prices.",
  keywords: [
    "fabric sourcing", "Chinese fabric suppliers", "buy fabric from China",
    "wholesale fabric", "lace fabric China", "ankara fabric wholesale",
    "fabric manufacturer China", "B2B fabric marketplace", "Weinly",
  ],
  authors: [{ name: "Weinly", url: "https://weinlyhq.com" }],
  creator: "Weinly",
  openGraph: {
    type: "website",
    siteName: "Weinly",
    title: "Weinly — Fabric Sourcing from China to the World",
    description:
      "Submit a fabric request and get quotes from verified Chinese suppliers within 24 hours. No middlemen. Factory prices.",
    url: "https://weinlyhq.com",
    images: [
      {
        url: "/weinly-social-card.png",
        width: 1200,
        height: 630,
        alt: "Weinly — Fabric Sourcing from China to the World",
      },
    ],
  },
  twitter: {
    card: "summary_large_image",
    title: "Weinly — Fabric Sourcing from China to the World",
    description:
      "Submit a fabric request and get quotes from verified Chinese suppliers within 24 hours.",
    images: ["/weinly-social-card.png"],
  },
  alternates: {
    canonical: "https://weinlyhq.com",
  },
  robots: {
    index: true,
    follow: true,
    googleBot: { index: true, follow: true },
  },
};

export default function RootLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  const gaId = "G-XXXXXXXXXX"; // replace with your real Google Analytics ID

  return (
    <html lang="en">
      <body>
        {children}

        <Script
          src={`https://www.googletagmanager.com/gtag/js?id=${gaId}`}
          strategy="afterInteractive"
        />
        <Script id="google-analytics" strategy="afterInteractive">
          {`
            window.dataLayer = window.dataLayer || [];
            function gtag(){window.dataLayer.push(arguments);}
            gtag('js', new Date());
            gtag('config', '${gaId}');
          `}
        </Script>
      </body>
    </html>
  );
}
