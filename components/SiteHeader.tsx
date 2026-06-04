"use client";

import { useEffect, useState } from "react";
import { buildWhatsappLink } from "@/lib/config";

type SiteHeaderProps = {
  showSubmitButton?: boolean;
};

export default function SiteHeader({ showSubmitButton = true }: SiteHeaderProps) {
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);
  const genericSupportLink = buildWhatsappLink("Hello Weinly, I need help with fabric sourcing.");

  useEffect(() => {
    document.body.style.overflow = mobileMenuOpen ? "hidden" : "";
    return () => {
      document.body.style.overflow = "";
    };
  }, [mobileMenuOpen]);

  return (
    <header className="mb-3">
      <nav className="flex items-center justify-between gap-4 rounded-2xl border border-gray-200 bg-white px-4 py-3 shadow-sm">

        {/* Logo */}
        <a href="/" className="flex shrink-0 items-center no-underline">
          <img src="/weinly-logo.svg" alt="Weinly" height="40" className="h-10 w-auto" />
        </a>

        {/* Desktop nav links */}
        <div className="hidden items-center gap-5 md:flex">
          <a href="/" className="text-sm font-semibold text-gray-500 no-underline transition-colors hover:text-gray-900">
            Home
          </a>
          <a href="/suppliers" className="text-sm font-semibold text-gray-500 no-underline transition-colors hover:text-gray-900">
            Suppliers
          </a>
          <a href="/ready-stock" className="text-sm font-semibold text-gray-500 no-underline transition-colors hover:text-gray-900">
            Ready Stock
          </a>
          <a href="/pricing" className="text-sm font-semibold text-gray-500 no-underline transition-colors hover:text-gray-900">
            Pricing
          </a>
          <a href="/about" className="text-sm font-semibold text-gray-500 no-underline transition-colors hover:text-gray-900">
            About
          </a>
          <a
            href={genericSupportLink}
            target="_blank"
            rel="noreferrer"
            className="text-sm font-semibold text-emerald-600 no-underline transition-colors hover:text-emerald-700"
          >
            WhatsApp
          </a>
        </div>

        {/* Desktop right CTAs */}
        <div className="hidden items-center gap-2 md:flex">
          <a
            href="/dashboard"
            className="rounded-xl border border-gray-200 bg-gray-50 px-4 py-2.5 text-sm font-semibold text-gray-600 no-underline transition-all hover:bg-gray-100"
          >
            Dashboard
          </a>
          {showSubmitButton && (
            <a
              href="/#main-tabs"
              className="rounded-xl bg-gradient-to-r from-[#a75635] to-[#7b3525] px-4 py-2.5 text-sm font-bold text-white no-underline transition-all hover:shadow-md"
            >
              Submit Request
            </a>
          )}
        </div>

        {/* Mobile hamburger button */}
        <button
          type="button"
          onClick={() => setMobileMenuOpen((prev) => !prev)}
          className="flex flex-col gap-1.5 rounded-lg border border-gray-200 bg-gray-50 p-2 md:hidden"
          aria-label="Toggle menu"
        >
          <span className={`block h-0.5 w-5 bg-gray-600 transition-all duration-300 ${mobileMenuOpen ? "translate-y-2 rotate-45" : ""}`} />
          <span className={`block h-0.5 w-5 bg-gray-600 transition-all duration-300 ${mobileMenuOpen ? "opacity-0" : ""}`} />
          <span className={`block h-0.5 w-5 bg-gray-600 transition-all duration-300 ${mobileMenuOpen ? "-translate-y-2 -rotate-45" : ""}`} />
        </button>
      </nav>

      {/* Mobile menu */}
      {mobileMenuOpen && (
        <div className="mt-2 flex flex-col gap-1 rounded-2xl border border-gray-200 bg-white p-4 shadow-xl md:hidden">

          <div className="mb-1 px-4 pt-1 text-xs font-bold uppercase tracking-widest text-gray-400">
            Navigate
          </div>

          {[
            { href: "/", label: "Home" },
            { href: "/suppliers", label: "Suppliers" },
            { href: "/ready-stock", label: "Ready Stock" },
            { href: "/pricing", label: "Pricing" },
            { href: "/about", label: "About" },
            { href: "/dashboard", label: "My Dashboard" },
            { href: "/history", label: "Request History" },
          ].map((link) => (
            <a
              key={link.href}
              href={link.href}
              onClick={() => setMobileMenuOpen(false)}
              className="rounded-xl px-4 py-3 text-sm font-semibold text-gray-600 no-underline transition-all hover:bg-gray-50 hover:text-gray-900"
            >
              {link.label}
            </a>
          ))}

          <div className="my-2 h-px bg-gray-100" />

          <a
            href={genericSupportLink}
            target="_blank"
            rel="noreferrer"
            onClick={() => setMobileMenuOpen(false)}
            className="rounded-xl px-4 py-3 text-sm font-semibold text-emerald-600 no-underline transition-all hover:bg-gray-50 hover:text-emerald-700"
          >
            💬 WhatsApp Support
          </a>

          {showSubmitButton && (
            <a
              href="/#main-tabs"
              onClick={() => setMobileMenuOpen(false)}
              className="mt-2 rounded-xl bg-gradient-to-r from-[#a75635] to-[#7b3525] px-4 py-3 text-center text-sm font-bold text-white no-underline shadow-sm"
            >
              Submit Request →
            </a>
          )}
        </div>
      )}
    </header>
  );
}
