"use client";

import { buildWhatsappLink, SUPPORT_EMAIL } from "@/lib/config";

export default function SiteFooter() {
  const genericSupportLink = buildWhatsappLink("Hello Weinly, I need help with fabric sourcing.");

  return (
    <footer className="bg-[#0d1424] border border-white/8 rounded-2xl p-6 mt-2">
      <div className="flex flex-col md:flex-row justify-between gap-8">

        {/* Brand */}
        <div className="max-w-xs">
          <div className="flex items-center gap-2 mb-3">
            <span className="w-8 h-8 rounded-full bg-gradient-to-br from-indigo-500 to-indigo-700 flex items-center justify-center text-white font-black text-xs">W</span>
            <span className="text-white font-black text-lg">Weinly</span>
          </div>
          <p className="text-slate-500 text-sm leading-relaxed">
            AI-powered fabric sourcing platform connecting buyers to verified Chinese suppliers.
          </p>
          <div className="flex items-center gap-2 mt-4">
            <span className="w-2 h-2 rounded-full bg-emerald-400 shadow-sm shadow-emerald-400/50" />
            <span className="text-emerald-400 text-xs font-semibold">Platform active</span>
          </div>
        </div>

        {/* Links */}
        <div className="grid grid-cols-2 md:grid-cols-3 gap-8">
          <div>
            <div className="text-slate-400 text-xs font-bold uppercase tracking-widest mb-3">Navigate</div>
            <div className="flex flex-col gap-2">
              <a href="/history" className="text-slate-500 hover:text-white text-sm font-medium transition-colors no-underline">History</a>
              <a href="/#pricing" className="text-slate-500 hover:text-white text-sm font-medium transition-colors no-underline">Pricing</a>
              <a href="/#how-it-works" className="text-slate-500 hover:text-white text-sm font-medium transition-colors no-underline">How it works</a>
            </div>
          </div>

          <div>
            <div className="text-slate-400 text-xs font-bold uppercase tracking-widest mb-3">Support</div>
            <div className="flex flex-col gap-2">
              <a href={genericSupportLink} target="_blank" rel="noreferrer" className="text-emerald-500 hover:text-emerald-400 text-sm font-medium transition-colors no-underline">WhatsApp</a>
              <a href={`mailto:${SUPPORT_EMAIL}`} className="text-slate-500 hover:text-white text-sm font-medium transition-colors no-underline">{SUPPORT_EMAIL}</a>
            </div>
          </div>

          <div>
            <div className="text-slate-400 text-xs font-bold uppercase tracking-widest mb-3">Platform</div>
            <div className="flex flex-col gap-2">
              <span className="text-slate-500 text-sm">China · Nigeria</span>
              <span className="text-slate-500 text-sm">Fabric sourcing</span>
              <span className="text-slate-500 text-sm">B2B marketplace</span>
            </div>
          </div>
        </div>
      </div>

      {/* Bottom bar */}
      <div className="mt-8 pt-6 border-t border-white/6 flex flex-col md:flex-row justify-between items-center gap-3">
        <p className="text-slate-600 text-xs">© 2025 Weinly. Built for fabric buyers sourcing from China.</p>
        <div className="flex items-center gap-4">
          <span className="text-slate-600 text-xs">Powered by AI</span>
          <span className="text-slate-600 text-xs">·</span>
          <span className="text-slate-600 text-xs">Secured by Paystack</span>
        </div>
      </div>
    </footer>
  );
}