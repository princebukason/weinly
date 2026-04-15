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
    if (mobileMenuOpen) {
      document.body.style.overflow = "hidden";
    } else {
      document.body.style.overflow = "";
    }
    return () => { document.body.style.overflow = ""; };
  }, [mobileMenuOpen]);

  return (
    <header className="mb-3">
      <nav className="bg-[#0d1424] border border-white/8 rounded-2xl px-4 py-3 flex items-center justify-between gap-4 shadow-lg">

        {/* Brand */}
        <a href="/" className="flex items-center gap-2 no-underline shrink-0">
          <span className="w-9 h-9 rounded-full bg-gradient-to-br from-indigo-500 to-indigo-700 flex items-center justify-center text-white font-black text-sm shadow-lg shadow-indigo-500/30">W</span>
          <span className="text-white font-black text-xl tracking-tight">Weinly</span>
        </a>

        {/* Desktop nav */}
        <div className="hidden md:flex items-center gap-6">
          <a href="/" className="text-slate-400 hover:text-white text-sm font-semibold transition-colors">Home</a>
          <a href="/#how-it-works" className="text-slate-400 hover:text-white text-sm font-semibold transition-colors">How it works</a>
          <a href="/history" className="text-slate-400 hover:text-white text-sm font-semibold transition-colors">History</a>
          <a href="/#pricing" className="text-slate-400 hover:text-white text-sm font-semibold transition-colors">Pricing</a>
          <a href={genericSupportLink} target="_blank" rel="noreferrer" className="text-slate-400 hover:text-white text-sm font-semibold transition-colors">WhatsApp</a>
        </div>

        {/* Desktop CTA */}
        <div className="hidden md:flex items-center gap-3">
          {showSubmitButton && (
            <a href="/#main-tabs" className="bg-gradient-to-r from-indigo-500 to-indigo-700 text-white text-sm font-bold px-4 py-2.5 rounded-xl no-underline hover:shadow-lg hover:shadow-indigo-500/30 transition-all">
              Submit Request
            </a>
          )}
        </div>

        {/* Mobile menu button */}
        <button
          type="button"
          onClick={() => setMobileMenuOpen((prev) => !prev)}
          className="md:hidden flex flex-col gap-1.5 p-2 rounded-lg bg-white/5 border border-white/8"
          aria-label="Toggle menu">
          <span className={`block w-5 h-0.5 bg-slate-300 transition-all duration-300 ${mobileMenuOpen ? "rotate-45 translate-y-2" : ""}`} />
          <span className={`block w-5 h-0.5 bg-slate-300 transition-all duration-300 ${mobileMenuOpen ? "opacity-0" : ""}`} />
          <span className={`block w-5 h-0.5 bg-slate-300 transition-all duration-300 ${mobileMenuOpen ? "-rotate-45 -translate-y-2" : ""}`} />
        </button>
      </nav>

      {/* Mobile dropdown */}
      {mobileMenuOpen && (
        <div className="md:hidden mt-2 bg-[#0d1424] border border-white/8 rounded-2xl p-4 flex flex-col gap-1 shadow-xl">
          {[
            { href: "/", label: "Home" },
            { href: "/#how-it-works", label: "How it works" },
            { href: "/history", label: "History" },
            { href: "/#pricing", label: "Pricing" },
          ].map((link) => (
            <a key={link.href} href={link.href} onClick={() => setMobileMenuOpen(false)} className="text-slate-300 hover:text-white hover:bg-white/5 font-semibold text-sm px-4 py-3 rounded-xl transition-all no-underline">
              {link.label}
            </a>
          ))}
          <a href={genericSupportLink} target="_blank" rel="noreferrer" onClick={() => setMobileMenuOpen(false)} className="text-emerald-400 hover:text-emerald-300 hover:bg-white/5 font-semibold text-sm px-4 py-3 rounded-xl transition-all no-underline">
            WhatsApp Support
          </a>
          {showSubmitButton && (
            <a href="/#main-tabs" onClick={() => setMobileMenuOpen(false)} className="mt-2 bg-gradient-to-r from-indigo-500 to-indigo-700 text-white font-bold text-sm px-4 py-3 rounded-xl text-center no-underline shadow-lg shadow-indigo-500/20">
              Submit Request
            </a>
          )}
        </div>
      )}
    </header>
  );
}