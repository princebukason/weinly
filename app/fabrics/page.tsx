import { Metadata } from "next";
import Link from "next/link";
import { FABRIC_CATEGORIES, getCategoryColor } from "@/lib/categories";
import SiteHeader from "@/components/SiteHeader";
import SiteFooter from "@/components/SiteFooter";

export const metadata: Metadata = {
  title: "Source Fabrics from China — All Categories | Weinly",
  description: "Browse all fabric categories available through Weinly's verified Chinese supplier network. Luxury, African fashion, sports, casual, men's traditional, furniture, industrial, kids and eco-friendly fabrics — wholesale pricing, worldwide shipping.",
  keywords: "fabric from China, wholesale fabric supplier, Chinese fabric manufacturer, source fabric China, fabric wholesale worldwide",
  openGraph: {
    title: "Source Fabrics from China — All Categories | Weinly",
    description: "Browse all fabric categories on Weinly. Connect with verified Chinese manufacturers for wholesale fabric sourcing worldwide.",
    url: "https://weinlyhq.com/fabrics",
    siteName: "Weinly",
    type: "website",
  },
  alternates: { canonical: "https://weinlyhq.com/fabrics" },
};

export default function FabricsIndexPage() {
  const totalSubcategories = FABRIC_CATEGORIES.reduce((sum, c) => sum + c.subcategories.length, 0);

  return (
    <main className="min-h-screen bg-[#0a0f1e] px-3 py-3 font-sans md:px-4 md:py-4">
      <div className="mx-auto flex max-w-5xl flex-col gap-4">
        <SiteHeader />

        {/* Breadcrumb */}
        <nav className="flex items-center gap-2 text-xs text-slate-600">
          <Link href="/" className="text-slate-600 no-underline hover:text-slate-400 transition-colors">Home</Link>
          <span>/</span>
          <span className="text-slate-400">Fabrics</span>
        </nav>

        {/* Hero */}
        <section className="relative overflow-hidden rounded-3xl border border-indigo-500/15 bg-gradient-to-br from-[#0f172a] via-[#1a1040] to-[#0c1a3a] p-6 md:p-12 shadow-2xl shadow-indigo-500/10">
          <div className="pointer-events-none absolute right-0 top-0 h-72 w-72 translate-x-1/3 -translate-y-1/3 rounded-full bg-indigo-500/10 blur-3xl" />
          <div className="relative z-10">
            <div className="mb-4 inline-flex items-center gap-2 rounded-full border border-indigo-500/25 bg-indigo-500/10 px-4 py-1.5">
              <span className="h-2 w-2 rounded-full bg-emerald-400" />
              <span className="text-xs font-semibold text-indigo-300">Verified supplier network · Ships worldwide</span>
            </div>
            <h1 className="mb-3 text-3xl font-black tracking-tight text-white md:text-5xl">
              Source fabric direct from{" "}
              <span className="bg-gradient-to-r from-indigo-400 via-sky-400 to-emerald-400 bg-clip-text text-transparent">
                China
              </span>
            </h1>
            <p className="mb-4 max-w-2xl text-sm leading-relaxed text-slate-400 md:text-base">
              Weinly connects international buyers directly to verified Chinese fabric manufacturers.
              Browse {FABRIC_CATEGORIES.length} fabric categories and {totalSubcategories}+ fabric types.
              Get competitive quotes, compare suppliers, and source with confidence.
            </p>
            <div className="flex flex-wrap gap-5 mb-6">
              {[
                { v: `${FABRIC_CATEGORIES.length}`, l: "Categories" },
                { v: `${totalSubcategories}+`, l: "Fabric types" },
                { v: "500+", l: "Verified suppliers" },
                { v: "30+", l: "Countries served" },
              ].map((s) => (
                <div key={s.l} className="flex flex-col gap-0.5">
                  <span className="text-2xl font-black text-white">{s.v}</span>
                  <span className="text-xs text-slate-500">{s.l}</span>
                </div>
              ))}
            </div>
            <Link href="/#main-tabs"
              className="inline-flex items-center rounded-xl bg-gradient-to-r from-indigo-500 to-indigo-700 px-6 py-3 text-sm font-bold text-white no-underline shadow-lg shadow-indigo-500/25">
              Submit sourcing request →
            </Link>
          </div>
        </section>

        {/* All categories grid */}
        <section className="rounded-3xl border border-white/7 bg-[#111827] p-5 md:p-8">
          <h2 className="mb-2 text-2xl font-black tracking-tight text-white">All fabric categories</h2>
          <p className="mb-6 text-sm text-slate-500">
            Click any category to see all fabric types, supplier information, pricing guidance and sourcing tips.
          </p>
          <div className="grid grid-cols-1 gap-4 md:grid-cols-2 lg:grid-cols-3">
            {FABRIC_CATEGORIES.map((cat) => {
              const color = getCategoryColor(cat.id);
              return (
                <Link key={cat.id} href={`/fabrics/${cat.id}`}
                  className={`flex flex-col gap-4 rounded-2xl border p-5 no-underline transition-all hover:scale-[1.01] ${color.bg} ${color.border}`}>
                  <div>
                    <h3 className={`mb-1 text-base font-black ${color.text}`}>{cat.label}</h3>
                    <p className="m-0 text-xs text-slate-500">{cat.subcategories.length} fabric types</p>
                  </div>
                  <div className="flex flex-wrap gap-1.5">
                    {cat.subcategories.slice(0, 4).map((sub) => (
                      <span key={sub} className={`rounded-full border px-2 py-0.5 text-xs font-semibold ${color.bg} ${color.text} ${color.border} bg-black/20`}>
                        {sub}
                      </span>
                    ))}
                    {cat.subcategories.length > 4 && (
                      <span className="rounded-full border border-white/10 bg-white/5 px-2 py-0.5 text-xs text-slate-500">
                        +{cat.subcategories.length - 4} more
                      </span>
                    )}
                  </div>
                  <div className="flex items-center justify-between">
                    <span className="text-xs text-slate-600">China · Ships worldwide</span>
                    <span className={`text-xs font-bold ${color.text}`}>Browse →</span>
                  </div>
                </Link>
              );
            })}
          </div>
        </section>

        {/* Why Weinly */}
        <section className="rounded-3xl border border-white/7 bg-[#111827] p-5 md:p-8">
          <h2 className="mb-5 text-xl font-black tracking-tight text-white">Why source fabric through Weinly</h2>
          <div className="grid grid-cols-1 gap-3 md:grid-cols-2 lg:grid-cols-4">
            {[
              { icon: "🔍", title: "See quotes first", desc: "Review price, MOQ and lead time before spending anything." },
              { icon: "✓", title: "Verified suppliers", desc: "Every supplier on Weinly is vetted. Verified suppliers carry a green badge." },
              { icon: "🌍", title: "Ships worldwide", desc: "Suppliers ship to Nigeria, Ghana, UK, USA, UAE and 30+ countries." },
              { icon: "💬", title: "Direct contact", desc: "Unlock the supplier's phone, WeChat and email — no permanent middleman." },
            ].map((item) => (
              <div key={item.title} className="rounded-2xl border border-white/7 bg-white/4 p-4">
                <div className="mb-2 text-xl">{item.icon}</div>
                <h3 className="mb-1 text-sm font-bold text-white">{item.title}</h3>
                <p className="m-0 text-xs leading-relaxed text-slate-500">{item.desc}</p>
              </div>
            ))}
          </div>
        </section>

        <SiteFooter />
      </div>
    </main>
  );
}
