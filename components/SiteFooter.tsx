"use client";

import { buildWhatsappLink, SUPPORT_EMAIL } from "@/lib/config";

export default function SiteFooter() {
  const genericSupportLink = buildWhatsappLink("Hello Weinly, I need help with fabric sourcing.");

  return (
    <footer className="bg-[#24483f] border border-[#24483f]/20 rounded-2xl p-6 mt-2">
      <div className="flex flex-col md:flex-row justify-between gap-8">

        {/* Brand */}
        <div className="max-w-xs">
          <div className="mb-3">
            <img src="/weinly-logo-light.svg" alt="Weinly" height="40" className="h-10 w-auto" />
          </div>
          <p className="text-[#e8dcc8] text-sm leading-relaxed">
            Global fabric sourcing platform connecting buyers worldwide to verified Chinese manufacturers.
          </p>
          <div className="flex items-center gap-2 mt-4">
            <span className="w-2 h-2 rounded-full bg-[#f59e0b]" />
            <span className="text-[#f59e0b] text-xs font-semibold">Platform active</span>
          </div>
        </div>

        {/* Links */}
        <div className="grid grid-cols-2 md:grid-cols-4 gap-8">

          <div>
            <div className="text-[#f59e0b] text-xs font-bold uppercase tracking-widest mb-3">Discover</div>
            <div className="flex flex-col gap-2">
              <a href="/fabrics" className="text-[#e8dcc8] hover:text-white text-sm font-medium transition-colors no-underline">All Fabrics</a>
              <a href="/suppliers" className="text-[#e8dcc8] hover:text-white text-sm font-medium transition-colors no-underline">Suppliers</a>
              <a href="/ready-stock" className="text-[#e8dcc8] hover:text-white text-sm font-medium transition-colors no-underline">Ready Stock</a>
              <a href="/about" className="text-[#e8dcc8] hover:text-white text-sm font-medium transition-colors no-underline">About</a>
            </div>
          </div>

          <div>
            <div className="text-[#f59e0b] text-xs font-bold uppercase tracking-widest mb-3">Navigate</div>
            <div className="flex flex-col gap-2">
              <a href="/#how-it-works" className="text-[#e8dcc8] hover:text-white text-sm font-medium transition-colors no-underline">How it works</a>
              <a href="/pricing" className="text-[#e8dcc8] hover:text-white text-sm font-medium transition-colors no-underline">Pricing</a>
              <a href="/#main-tabs" className="text-[#e8dcc8] hover:text-white text-sm font-medium transition-colors no-underline">My Requests</a>
              <a href="/history" className="text-[#e8dcc8] hover:text-white text-sm font-medium transition-colors no-underline">History</a>
            </div>
          </div>

          <div>
            <div className="text-[#f59e0b] text-xs font-bold uppercase tracking-widest mb-3">Support</div>
            <div className="flex flex-col gap-2">
              <a href={genericSupportLink} target="_blank" rel="noreferrer"
                className="text-white hover:text-[#e8dcc8] text-sm font-medium transition-colors no-underline">
                WhatsApp
              </a>
              <a href={`mailto:${SUPPORT_EMAIL}`}
                className="text-[#e8dcc8] hover:text-white text-sm font-medium transition-colors no-underline">
                {SUPPORT_EMAIL}
              </a>
              <a href="/supplier/auth"
                className="text-[#f59e0b] hover:text-white text-sm font-medium transition-colors no-underline">
                Supplier login
              </a>
            </div>
          </div>

          <div>
            <div className="text-[#f59e0b] text-xs font-bold uppercase tracking-widest mb-3">Platform</div>
            <div className="flex flex-col gap-2">
              <span className="text-[#e8dcc8] text-sm">China · Worldwide</span>
              <span className="text-[#e8dcc8] text-sm">18 fabric categories</span>
              <span className="text-[#e8dcc8] text-sm">500+ fabric types</span>
              <span className="text-[#e8dcc8] text-sm">B2B marketplace</span>
            </div>
          </div>

        </div>
      </div>

      {/* Bottom bar */}
      <div className="mt-8 pt-6 border-t border-white/10 flex flex-col md:flex-row justify-between items-center gap-3">
        <p className="text-[#e8dcc8]/60 text-xs">
          © {new Date().getFullYear()} Weinly. Built for fabric buyers sourcing from China.
        </p>
        <div className="flex items-center gap-4">
          <span className="text-[#e8dcc8]/60 text-xs">Powered by Weinly</span>
          <span className="text-[#e8dcc8]/60 text-xs">·</span>
          <span className="text-[#e8dcc8]/60 text-xs">Secured by Paystack</span>
        </div>
      </div>
    </footer>
  );
}
