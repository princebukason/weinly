import type { Metadata } from "next";

export const metadata: Metadata = {
  title: "Sign In or Create Account",
  description:
    "Log in or sign up to track your fabric sourcing requests, view supplier quotes, and manage your Weinly account.",
  alternates: { canonical: "https://weinlyhq.com/auth" },
  robots: { index: false, follow: false },
};

export default function AuthLayout({ children }: { children: React.ReactNode }) {
  return <>{children}</>;
}
