import { Metadata } from "next";
import Link from "next/link";
import { FABRIC_CATEGORIES, getCategoryColor } from "@/lib/categories";
import FabricImage from "@/components/FabricImage";
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

        {/* Hero — full bleed image strip */}
        <section className="relative overflow-hidden rounded-3xl">
          <div className="grid grid-cols-5 h-56 md:h-72">
            {FABRIC_CATEGORIES.slice(0, 5).map((cat, i) => (
              <FabricImage key={cat.id} categoryId={cat.id} itemIndex={i + 3}
                alt={cat.label} aspectRatio="square" className="h-full" />
            ))}
          </div>
          <div className="absolute inset-0 flex flex-col justify-end p-6 md:p-10"
            style={{ background: "linear-gradient(to top, rgba(10,15,30,0.97) 0%, rgba(10,15,30,0.5) 55%, rgba(10,15,30,0.1) 100%)" }}>
            <div className="mb-3 inline-flex w-fit items-center gap-2 rounded-full border border-indigo-500/25 bg-indigo-500/10 px-4 py-1.5">
              <span className="h-2 w-2 rounded-full bg-emerald-400" />
              <span className="text-xs font-semibold text-indigo-300">Verified supplier network · Ships worldwide</span>
            </div>
            <h1 className="mb-2 text-3xl font-black tracking-tight text-white md:text-5xl">
              Source fabric direct from{" "}
              <span className="bg-gradient-to-r from-indigo-400 via-sky-400 to-emerald-400 bg-clip-text text-transparent">China</span>
            </h1>
            <p className="mb-4 max-w-2xl text-sm leading-relaxed text-slate-300 md:text-base">
              Browse {FABRIC_CATEGORIES.length} fabric categories and {totalSubcategories}+ fabric types from verified manufacturers.
            </p>
            <div className="flex flex-wrap gap-5">
              {[
                { v: String(FABRIC_CATEGORIES.length), l: "Categories" },
                { v: `${totalSubcategories}+`, l: "Fabric types" },
                { v: "500+", l: "Verified suppliers" },
                { v: "30+", l: "Countries served" },
              ].map((s) => (
                <div key={s.l} className="flex flex-col gap-0.5">
                  <span className="text-xl font-black text-white">{s.v}</span>
                  <span className="text-xs text-slate-400">{s.l}</span>
                </div>
              ))}
            </div>
          </div>
        </section>

        {/* Category grid — with images */}
        <section className="rounded-3xl border border-white/7 bg-[#111827] p-5 md:p-8">
          <h2 className="mb-2 text-2xl font-black tracking-tight text-white">All fabric categories</h2>
          <p className="mb-6 text-sm text-slate-500">Click any category to see all fabric types, pricing guidance and sourcing tips.</p>
          <div className="grid grid-cols-1 gap-4 md:grid-cols-2 lg:grid-cols-3">
            {FABRIC_CATEGORIES.map((cat, i) => {
              const color = getCategoryColor(cat.id);
              return (
                <Link key={cat.id} href={`/fabrics/${cat.id}`}
                  className="flex flex-col rounded-2xl border border-white/7 overflow-hidden no-underline transition-all hover:border-white/20 hover:scale-[1.01]">

                  {/* Fabric image */}
                  <FabricImage categoryId={cat.id} itemIndex={i + 1}
                    alt={cat.label} aspectRatio="video" />

                  {/* Card content */}
                  <div className={`flex flex-col gap-2 p-4 ${color.bg}`}>
                    <h3 className={`text-sm font-black ${color.text}`}>{cat.label}</h3>
                    <p className="m-0 text-xs text-slate-500 leading-relaxed line-clamp-1">
                      {cat.subcategories.slice(0, 3).join(" · ")}
                      {cat.subcategories.length > 3 && ` +${cat.subcategories.length - 3} more`}
                    </p>
                    <div className="flex items-center justify-between mt-1">
                      <span className="text-xs text-slate-600">{cat.subcategories.length} fabric types</span>
                      <span className={`text-xs font-bold ${color.text}`}>Browse →</span>
                    </div>
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
              { icon: "✓", title: "Verified suppliers", desc: "Every supplier is vetted. Verified suppliers carry a green badge." },
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
