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
      <nav className="flex items-center justify-between gap-4 rounded-2xl border border-white/8 bg-[#0d1424] px-4 py-3 shadow-lg">

        {/* Logo */}
        <a href="/" className="flex shrink-0 items-center gap-2 no-underline">
          <span className="flex h-9 w-9 items-center justify-center rounded-full bg-gradient-to-br from-amber-400 to-amber-600 text-sm font-black text-white shadow-lg shadow-amber-500/30">
            W
          </span>
          <span className="text-xl font-black tracking-tight text-white">Weinly</span>
        </a>

        {/* Desktop nav links */}
        <div className="hidden items-center gap-5 md:flex">
          <a href="/" className="text-sm font-semibold text-slate-400 no-underline transition-colors hover:text-white">
            Home
          </a>
          <a href="/suppliers" className="text-sm font-semibold text-slate-400 no-underline transition-colors hover:text-white">
            Suppliers
          </a>
          <a href="/ready-stock" className="text-sm font-semibold text-slate-400 no-underline transition-colors hover:text-white">
            Ready Stock
          </a>
          <a href="/pricing" className="text-sm font-semibold text-slate-400 no-underline transition-colors hover:text-white">
            Pricing
          </a>
          <a href="/about" className="text-sm font-semibold text-slate-400 no-underline transition-colors hover:text-white">
            About
          </a>
          <a
            href={genericSupportLink}
            target="_blank"
            rel="noreferrer"
            className="text-sm font-semibold text-emerald-400 no-underline transition-colors hover:text-emerald-300"
          >
            WhatsApp
          </a>
        </div>

        {/* Desktop right CTAs */}
        <div className="hidden items-center gap-2 md:flex">
          <a
            href="/dashboard"
            className="rounded-xl border border-white/10 bg-white/6 px-4 py-2.5 text-sm font-semibold text-slate-300 no-underline transition-all hover:bg-white/10"
          >
            Dashboard
          </a>
          {showSubmitButton && (
            <a
              href="/#main-tabs"
              className="rounded-xl bg-gradient-to-r from-amber-500 to-amber-700 px-4 py-2.5 text-sm font-bold text-white no-underline transition-all hover:shadow-lg hover:shadow-amber-500/30"
            >
              Submit Request
            </a>
          )}
        </div>

        {/* Mobile hamburger button */}
        <button
          type="button"
          onClick={() => setMobileMenuOpen((prev) => !prev)}
          className="flex flex-col gap-1.5 rounded-lg border border-white/8 bg-white/5 p-2 md:hidden"
          aria-label="Toggle menu"
        >
          <span
            className={`block h-0.5 w-5 bg-slate-300 transition-all duration-300 ${
              mobileMenuOpen ? "translate-y-2 rotate-45" : ""
            }`}
          />
          <span
            className={`block h-0.5 w-5 bg-slate-300 transition-all duration-300 ${
              mobileMenuOpen ? "opacity-0" : ""
            }`}
          />
          <span
            className={`block h-0.5 w-5 bg-slate-300 transition-all duration-300 ${
              mobileMenuOpen ? "-translate-y-2 -rotate-45" : ""
            }`}
          />
        </button>
      </nav>

      {/* Mobile menu */}
      {mobileMenuOpen && (
        <div className="mt-2 flex flex-col gap-1 rounded-2xl border border-white/8 bg-[#0d1424] p-4 shadow-xl md:hidden">

          <div className="mb-1 px-4 pt-1 text-xs font-bold uppercase tracking-widest text-slate-600">
            Navigate
          </div>

          <a
            href="/"
            onClick={() => setMobileMenuOpen(false)}
            className="rounded-xl px-4 py-3 text-sm font-semibold text-slate-300 no-underline transition-all hover:bg-white/5 hover:text-white"
          >
            Home
          </a>
          <a
            href="/suppliers"
            onClick={() => setMobileMenuOpen(false)}
            className="rounded-xl px-4 py-3 text-sm font-semibold text-slate-300 no-underline transition-all hover:bg-white/5 hover:text-white"
          >
            Suppliers
          </a>
          <a
            href="/ready-stock"
            onClick={() => setMobileMenuOpen(false)}
            className="rounded-xl px-4 py-3 text-sm font-semibold text-slate-300 no-underline transition-all hover:bg-white/5 hover:text-white"
          >
            Ready Stock
          </a>
          <a
            href="/pricing"
            onClick={() => setMobileMenuOpen(false)}
            className="rounded-xl px-4 py-3 text-sm font-semibold text-slate-300 no-underline transition-all hover:bg-white/5 hover:text-white"
          >
            Pricing
          </a>
          <a
            href="/about"
            onClick={() => setMobileMenuOpen(false)}
            className="rounded-xl px-4 py-3 text-sm font-semibold text-slate-300 no-underline transition-all hover:bg-white/5 hover:text-white"
          >
            About
          </a>
          <a
            href="/dashboard"
            onClick={() => setMobileMenuOpen(false)}
            className="rounded-xl px-4 py-3 text-sm font-semibold text-slate-300 no-underline transition-all hover:bg-white/5 hover:text-white"
          >
            My Dashboard
          </a>
          <a
            href="/history"
            onClick={() => setMobileMenuOpen(false)}
            className="rounded-xl px-4 py-3 text-sm font-semibold text-slate-300 no-underline transition-all hover:bg-white/5 hover:text-white"
          >
            Request History
          </a>

          <div className="my-2 h-px bg-white/7" />

          <a
            href={genericSupportLink}
            target="_blank"
            rel="noreferrer"
            onClick={() => setMobileMenuOpen(false)}
            className="rounded-xl px-4 py-3 text-sm font-semibold text-emerald-400 no-underline transition-all hover:bg-white/5 hover:text-emerald-300"
          >
            💬 WhatsApp Support
          </a>

          {showSubmitButton && (
            <a
              href="/#main-tabs"
              onClick={() => setMobileMenuOpen(false)}
              className="mt-2 rounded-xl bg-gradient-to-r from-amber-500 to-amber-700 px-4 py-3 text-center text-sm font-bold text-white no-underline shadow-lg shadow-amber-500/20"
            >
              Submit Request →
            </a>
          )}
        </div>
      )}
    </header>
  );
}
