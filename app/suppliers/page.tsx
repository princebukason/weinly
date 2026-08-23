"use client";

import { useEffect, useState, useMemo } from "react";
import { createClient, SupabaseClient } from "@supabase/supabase-js";

import SiteHeader from "@/components/SiteHeader";
import SiteFooter from "@/components/SiteFooter";
import FabricImage from "@/components/FabricImage";
import { FABRIC_CATEGORIES, getCategoryColor, getCategoryLabel } from "@/lib/categories";
import { buildWhatsappLink } from "@/lib/config";

let _sb: SupabaseClient | null = null;
function getSupabase() {
  if (!_sb) _sb = createClient(process.env.NEXT_PUBLIC_SUPABASE_URL ?? "", process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY ?? "");
  return _sb;
}



type Supplier = {
  id: string; company_name: string; contact_name: string | null;
  region: string | null; phone: string | null; wechat: string | null;
  email: string | null; is_active: boolean | null; is_verified: boolean | null;
  bio: string | null; categories: string[] | null; created_at: string;
};

type ReviewSummary = { supplier_id: string; avg_rating: number; count: number; };

export default function SuppliersPage() {
  const [suppliers, setSuppliers] = useState<Supplier[]>([]);
  const [reviewSummaries, setReviewSummaries] = useState<ReviewSummary[]>([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState("");
  const [categoryFilter, setCategoryFilter] = useState("all");
  const [verifiedOnly, setVerifiedOnly] = useState(false);

  useEffect(() => {
    async function load() {
      const [suppliersRes, reviewsRes] = await Promise.all([
        getSupabase().from("supplier_profiles").select("*").eq("is_active", true)
          .order("is_verified", { ascending: false })
          .order("created_at", { ascending: false }),
        getSupabase().from("supplier_reviews").select("supplier_id, rating"),
      ]);
      setSuppliers((suppliersRes.data || []) as Supplier[]);
      const reviewMap: Record<string, { total: number; count: number }> = {};
      (reviewsRes.data || []).forEach((r: any) => {
        if (!reviewMap[r.supplier_id]) reviewMap[r.supplier_id] = { total: 0, count: 0 };
        reviewMap[r.supplier_id].total += r.rating;
        reviewMap[r.supplier_id].count += 1;
      });
      setReviewSummaries(
        Object.entries(reviewMap).map(([supplier_id, { total, count }]) => ({
          supplier_id, avg_rating: total / count, count,
        }))
      );
      setLoading(false);
    }
    load();
  }, []);

  const reviewMap = useMemo(() => {
    const map: Record<string, ReviewSummary> = {};
    reviewSummaries.forEach((r) => { map[r.supplier_id] = r; });
    return map;
  }, [reviewSummaries]);

  const filtered = useMemo(() => {
    const q = search.trim().toLowerCase();
    return suppliers.filter((s) => {
      if (verifiedOnly && !s.is_verified) return false;
      if (categoryFilter !== "all" && !(s.categories || []).includes(categoryFilter)) return false;
      if (!q) return true;
      return [s.company_name, s.region || "", s.bio || ""].join(" ").toLowerCase().includes(q);
    });
  }, [suppliers, search, categoryFilter, verifiedOnly]);

  const supportLink = buildWhatsappLink("Hello Weinly, I want to become a verified supplier.");

  return (
    <main className="min-h-screen bg-[#f5ecdc] font-sans">
      <div className="flex w-full flex-col gap-0">
        <SiteHeader />

        <div className="mx-auto flex w-full max-w-7xl flex-col gap-4 px-4 py-4">

          {/* Hero — fabric image collage */}
          <section className="relative overflow-hidden rounded-lg">
            <div className="grid grid-cols-3 grid-rows-2 h-72 md:h-96">
              {FABRIC_CATEGORIES.slice(0, 6).map((cat, i) => (
                <FabricImage key={cat.id} categoryId={cat.id} itemIndex={i + 2}
                  alt={cat.label} aspectRatio="square" className="h-full" />
              ))}
            </div>
            <div className="absolute inset-0 flex flex-col justify-end p-6 md:p-10"
              style={{ background: "linear-gradient(to top, rgba(36,72,63,0.95) 0%, rgba(36,72,63,0.5) 55%, rgba(36,72,63,0.1) 100%)" }}>
              <div className="mb-4 inline-flex w-fit items-center gap-2 rounded-full border border-white/20 bg-white/10 px-4 py-1.5">
                <span className="h-2 w-2 rounded-full bg-[#c9935b]" />
                <span className="text-xs font-semibold text-[#f8efe2]">Verified supplier network</span>
              </div>
              <h1 className="mb-2 text-3xl font-black tracking-tight text-white md:text-5xl">
                Browse verified suppliers
              </h1>
              <p className="mb-4 max-w-xl text-sm leading-relaxed text-[#e8dcc8] md:text-base">
                Every supplier is vetted. Verified suppliers carry a green badge earned through audit — not paid for.
              </p>
              <div className="flex flex-wrap gap-6">
                {[
                  { v: String(suppliers.length), l: "Active suppliers" },
                  { v: String(suppliers.filter((s) => s.is_verified).length), l: "Verified" },
                  { v: String(new Set(suppliers.flatMap((s) => s.categories || [])).size), l: "Categories covered" },
                ].map((s) => (
                  <div key={s.l} className="flex flex-col gap-0.5">
                    <span className="text-2xl font-black text-white">{s.v}</span>
                    <span className="text-xs text-[#e8dcc8]">{s.l}</span>
                  </div>
                ))}
              </div>
            </div>
          </section>

          {/* Filters */}
          <section className="rounded-lg border border-stone-200 bg-white p-4 md:p-5">
            <div className="flex flex-col gap-3 md:flex-row md:items-center">
              <input value={search} onChange={(e) => setSearch(e.target.value)}
                placeholder="Search suppliers by name, region or specialty..."
                className="flex-1 rounded-md border border-stone-200 bg-stone-50 px-4 py-3 text-sm text-[#1f2933] outline-none transition-all placeholder:text-stone-400 focus:border-amber-500" />
              <button onClick={() => setVerifiedOnly(!verifiedOnly)}
                className={`shrink-0 rounded-md border px-4 py-3 text-sm font-bold transition-all cursor-pointer ${verifiedOnly ? "border-emerald-500/30 bg-emerald-500/10 text-[#2f7d57]" : "border-stone-200 bg-stone-50 text-stone-500 hover:text-stone-700"}`}>
                ✓ Verified only
              </button>
            </div>
            <div className="mt-3 flex flex-wrap gap-2">
              <button onClick={() => setCategoryFilter("all")}
                className={`rounded-full border px-3 py-1.5 text-xs font-bold transition-all cursor-pointer ${categoryFilter === "all" ? "border-[#24483f]/30 bg-[#24483f]/10 text-[#24483f]" : "border-stone-200 bg-stone-50 text-stone-500 hover:text-stone-700"}`}>
                All categories
              </button>
              {FABRIC_CATEGORIES.map((cat) => {
                const color = getCategoryColor(cat.id);
                const count = suppliers.filter((s) => (s.categories || []).includes(cat.id)).length;
                if (count === 0) return null;
                return (
                  <button key={cat.id} onClick={() => setCategoryFilter(cat.id)}
                    className={`rounded-full border px-3 py-1.5 text-xs font-bold transition-all cursor-pointer ${categoryFilter === cat.id ? `${color.bg} ${color.text} ${color.border}` : "border-stone-200 bg-stone-50 text-stone-500 hover:text-stone-700"}`}>
                    {cat.label} ({count})
                  </button>
                );
              })}
            </div>
          </section>

          {/* Supplier grid */}
          <section className="rounded-lg border border-stone-200 bg-white p-4 md:p-6">
            <div className="mb-4 flex items-center justify-between">
              <h2 className="text-lg font-black text-[#1f2933]">
                {filtered.length} supplier{filtered.length !== 1 ? "s" : ""}
                {categoryFilter !== "all" ? ` in ${getCategoryLabel(categoryFilter)}` : ""}
              </h2>
            </div>

            {loading ? (
              <div className="grid grid-cols-1 gap-4 md:grid-cols-2 lg:grid-cols-3">
                {Array.from({ length: 6 }).map((_, i) => (
                  <div key={i} className="rounded-lg border border-stone-200 bg-stone-50 overflow-hidden animate-pulse">
                    <div className="h-32 bg-stone-200" />
                    <div className="p-4 flex flex-col gap-2">
                      <div className="h-4 bg-stone-200 rounded w-2/3" />
                      <div className="h-3 bg-stone-200 rounded w-1/2" />
                      <div className="h-3 bg-stone-200 rounded w-3/4" />
                    </div>
                  </div>
                ))}
              </div>
            ) : filtered.length === 0 ? (
              <div className="rounded-lg border border-dashed border-stone-300 p-12 text-center">
                <div className="mb-3 text-4xl">◎</div>
                <div className="mb-2 font-bold text-stone-500">No suppliers found</div>
                <p className="m-0 text-sm text-stone-400">Try adjusting your filters or search term.</p>
              </div>
            ) : (
              <div className="grid grid-cols-1 gap-4 md:grid-cols-2 lg:grid-cols-3">
                {filtered.map((supplier, idx) => {
                  const review = reviewMap[supplier.id];
                  const cats = supplier.categories || [];
                  const primaryCat = cats[0] || "luxury";

                  return (
                    <a key={supplier.id} href={`/suppliers/${supplier.id}`}
                      className="flex flex-col rounded-lg border border-stone-200 overflow-hidden no-underline transition-all hover:border-[#24483f]/30 hover:scale-[1.01]">

                      <div className="relative">
                        <FabricImage
                          categoryId={primaryCat}
                          itemIndex={idx}
                          alt={`${supplier.company_name} fabric`}
                          aspectRatio="wide"
                        />
                        {supplier.is_verified && (
                          <div className="absolute top-3 right-3">
                            <span className="inline-flex items-center gap-1 rounded-full border border-emerald-500/30 bg-black/50 px-2.5 py-1 text-xs font-bold text-emerald-400 backdrop-blur-sm">
                              ✓ Verified
                            </span>
                          </div>
                        )}
                        {review && (
                          <div className="absolute bottom-3 right-3">
                            <span className="inline-flex items-center gap-1 rounded-full border border-amber-500/30 bg-black/50 px-2.5 py-1 text-xs font-bold text-amber-400 backdrop-blur-sm">
                              {review.avg_rating.toFixed(1)}★ ({review.count})
                            </span>
                          </div>
                        )}
                        <div className="absolute bottom-3 left-3">
                          <div className="flex h-10 w-10 items-center justify-center rounded-lg border-2 border-white/20 bg-black/60 text-sm font-black text-white backdrop-blur-sm">
                            {supplier.company_name.charAt(0).toUpperCase()}
                          </div>
                        </div>
                      </div>

                      <div className="flex flex-col gap-3 bg-white p-4 flex-1">
                        <div>
                          <div className="mb-0.5 text-base font-bold text-[#1f2933]">{supplier.company_name}</div>
                          <div className="text-xs text-stone-500">{supplier.region || "China"}</div>
                        </div>
                        {supplier.bio && (
                          <p className="m-0 text-xs leading-relaxed text-stone-500 line-clamp-2">{supplier.bio}</p>
                        )}
                        {cats.length > 0 && (
                          <div className="flex flex-wrap gap-1.5">
                            {cats.slice(0, 3).map((catId) => {
                              const color = getCategoryColor(catId);
                              return (
                                <span key={catId} className={`rounded-full border px-2 py-0.5 text-xs font-semibold ${color.bg} ${color.text} ${color.border}`}>
                                  {getCategoryLabel(catId)}
                                </span>
                              );
                            })}
                            {cats.length > 3 && (
                              <span className="rounded-full border border-stone-200 bg-stone-50 px-2 py-0.5 text-xs text-stone-400">
                                +{cats.length - 3} more
                              </span>
                            )}
                          </div>
                        )}
                        <div className="mt-auto flex items-center justify-between border-t border-stone-100 pt-3">
                          <span className="text-xs text-stone-400">
                            Since {new Date(supplier.created_at).toLocaleDateString("en-US", { month: "short", year: "numeric" })}
                          </span>
                          <span className="text-xs font-semibold text-[#a75635]">View profile →</span>
                        </div>
                      </div>
                    </a>
                  );
                })}
              </div>
            )}
          </section>

          {/* Become a supplier CTA */}
          <section className="rounded-lg border border-[#24483f]/20 bg-[#24483f] p-6 md:p-10">
            <div className="grid grid-cols-1 gap-6 md:grid-cols-2 md:items-center">
              <div>
                <span className="mb-3 inline-block rounded-full bg-white/15 px-3 py-1 text-xs font-bold uppercase tracking-widest text-[#f8efe2]">For suppliers</span>
                <h2 className="mb-3 text-2xl font-black tracking-tight text-white md:text-3xl">Join Weinly as a verified supplier</h2>
                <p className="mb-5 text-sm leading-relaxed text-[#e8dcc8]">Get your products in front of serious buyers from Africa, the Middle East and beyond.</p>
                <div className="flex flex-wrap gap-3">
                  <a href="/supplier/apply" className="inline-flex items-center rounded-md bg-gradient-to-r from-[#c9935b] to-[#a75635] px-6 py-3 text-sm font-bold text-white no-underline shadow-lg shadow-black/20">
                    Apply as supplier →
                  </a>
                  <a href={supportLink} target="_blank" rel="noreferrer" className="inline-flex items-center rounded-md border border-white/20 bg-white/10 px-6 py-3 text-sm font-semibold text-[#fffaf2] no-underline hover:bg-white/15 transition-all">
                    WhatsApp us
                  </a>
                </div>
              </div>
              <div className="flex flex-col gap-3">
                {[
                  "Get in front of thousands of international buyers",
                  "Buyers come to you — no cold outreach needed",
                  "Earn a Verified badge after audit",
                  "Post ready stock for instant sales",
                ].map((item) => (
                  <div key={item} className="flex items-start gap-3 rounded-lg border border-white/15 bg-white/10 p-3">
                    <span className="font-bold text-[#c9935b]">✓</span>
                    <span className="text-sm text-[#e8dcc8]">{item}</span>
                  </div>
                ))}
              </div>
            </div>
          </section>

        </div>
        <SiteFooter />
      </div>
    </main>
  );
}
