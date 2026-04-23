"use client";

import { useEffect, useState } from "react";
import { buildWhatsappLink } from "@/lib/config";

type SiteHeaderProps = {
  showSubmitButton?: boolean;
};

export default function SiteHeader({
  showSubmitButton = true,
}: SiteHeaderProps) {
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);
  const genericSupportLink = buildWhatsappLink(
    "Hello Weinly, I need help with fabric sourcing."
  );

  useEffect(() => {
    if (mobileMenuOpen) {
      document.body.style.overflow = "hidden";
    } else {
      document.body.style.overflow = "";
    }

    return () => {
      document.body.style.overflow = "";
    };
  }, [mobileMenuOpen]);

  const mobileLinks = [
    { href: "/", label: "Home" },
    { href: "/#how-it-works", label: "How it works" },
    { href: "/history", label: "History" },
    { href: "/pricing", label: "Pricing" },
    { href: "/dashboard", label: "Dashboard" },
  ];

  return (
    <header className="mb-3">
      <nav className="flex items-center justify-between gap-4 rounded-2xl border border-white/8 bg-[#0d1424] px-4 py-3 shadow-lg">
        <a href="/" className="flex shrink-0 items-center gap-2 no-underline">
          <span className="flex h-9 w-9 items-center justify-center rounded-full bg-gradient-to-br from-indigo-500 to-indigo-700 text-sm font-black text-white shadow-lg shadow-indigo-500/30">
            W
          </span>
          <span className="text-xl font-black tracking-tight text-white">
            Weinly
          </span>
        </a>

        <div className="hidden items-center gap-6 md:flex">
          <a
            href="/"
            className="text-sm font-semibold text-slate-400 transition-colors hover:text-white"
          >
            Home
          </a>
          <a
            href="/#how-it-works"
            className="text-sm font-semibold text-slate-400 transition-colors hover:text-white"
          >
            How it works
          </a>
          <a
            href="/history"
            className="text-sm font-semibold text-slate-400 transition-colors hover:text-white"
          >
            History
          </a>
          <a
            href="/pricing"
            className="text-sm font-semibold text-slate-400 transition-colors hover:text-white"
          >
            Pricing
          </a>
          <a
            href={genericSupportLink}
            target="_blank"
            rel="noreferrer"
            className="text-sm font-semibold text-slate-400 transition-colors hover:text-white"
          >
            WhatsApp
          </a>
          <a
            href="/dashboard"
            className="text-sm font-semibold text-slate-400 transition-colors hover:text-white"
          >
            Dashboard
          </a>
        </div>

        <div className="hidden items-center gap-3 md:flex">
          {showSubmitButton && (
            <a
              href="/#main-tabs"
              className="rounded-xl bg-gradient-to-r from-indigo-500 to-indigo-700 px-4 py-2.5 text-sm font-bold text-white no-underline transition-all hover:shadow-lg hover:shadow-indigo-500/30"
            >
              Submit Request
            </a>
          )}
        </div>

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

      {mobileMenuOpen && (
        <div className="mt-2 flex flex-col gap-1 rounded-2xl border border-white/8 bg-[#0d1424] p-4 shadow-xl md:hidden">
          {mobileLinks.map((link) => (
            <a
              key={link.href}
              href={link.href}
              onClick={() => setMobileMenuOpen(false)}
              className="rounded-xl px-4 py-3 text-sm font-semibold text-slate-300 no-underline transition-all hover:bg-white/5 hover:text-white"
            >
              {link.label}
            </a>
          ))}

          <a
            href={genericSupportLink}
            target="_blank"
            rel="noreferrer"
            onClick={() => setMobileMenuOpen(false)}
            className="rounded-xl px-4 py-3 text-sm font-semibold text-emerald-400 no-underline transition-all hover:bg-white/5 hover:text-emerald-300"
          >
            WhatsApp Support
          </a>

          {showSubmitButton && (
            <a
              href="/#main-tabs"
              onClick={() => setMobileMenuOpen(false)}
              className="mt-2 rounded-xl bg-gradient-to-r from-indigo-500 to-indigo-700 px-4 py-3 text-center text-sm font-bold text-white no-underline shadow-lg shadow-indigo-500/20"
            >
              Submit Request
            </a>
          )}
        </div>
      )}
    </header>
  );
}