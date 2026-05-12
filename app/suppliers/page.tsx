"use client";

import { useEffect, useState, useMemo } from "react";
import { createClient } from "@supabase/supabase-js";
import SiteHeader from "@/components/SiteHeader";
import SiteFooter from "@/components/SiteFooter";
import { FABRIC_CATEGORIES, getCategoryColor, getCategoryLabel } from "@/lib/categories";
import { buildWhatsappLink } from "@/lib/config";

const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL!,
  process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!
);

type Supplier = {
  id: string;
  company_name: string;
  contact_name: string | null;
  region: string | null;
  phone: string | null;
  wechat: string | null;
  email: string | null;
  is_active: boolean | null;
  is_verified: boolean | null;
  bio: string | null;
  categories: string[] | null;
  created_at: string;
};

type ReviewSummary = {
  supplier_id: string;
  avg_rating: number;
  count: number;
};

function VerifiedBadge() {
  return (
    <span className="inline-flex items-center gap-1 rounded-full border border-emerald-500/30 bg-emerald-500/10 px-2.5 py-1 text-xs font-bold text-emerald-400">
      <span className="text-emerald-400">✓</span> Verified
    </span>
  );
}

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
        supabase
          .from("supplier_profiles")
          .select("*")
          .eq("is_active", true)
          .order("is_verified", { ascending: false })
          .order("created_at", { ascending: false }),
        supabase
          .from("supplier_reviews")
          .select("supplier_id, rating"),
      ]);

      const supplierList = (suppliersRes.data || []) as Supplier[];
      setSuppliers(supplierList);

      // Aggregate reviews per supplier
      const reviewMap: Record<string, { total: number; count: number }> = {};
      (reviewsRes.data || []).forEach((r: any) => {
        if (!reviewMap[r.supplier_id]) reviewMap[r.supplier_id] = { total: 0, count: 0 };
        reviewMap[r.supplier_id].total += r.rating;
        reviewMap[r.supplier_id].count += 1;
      });
      setReviewSummaries(
        Object.entries(reviewMap).map(([supplier_id, { total, count }]) => ({
          supplier_id,
          avg_rating: total / count,
          count,
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
    <main className="min-h-screen bg-[#0a0f1e] px-3 py-3 font-sans md:px-4 md:py-4">
      <div className="mx-auto flex max-w-6xl flex-col gap-3">
        <SiteHeader />

        {/* Hero */}
        <section className="relative overflow-hidden rounded-3xl border border-indigo-500/15 bg-gradient-to-br from-[#0f172a] via-[#1a1040] to-[#0c1a3a] p-6 md:p-10 shadow-2xl shadow-indigo-500/10">
          <div className="pointer-events-none absolute right-0 top-0 h-72 w-72 translate-x-1/3 -translate-y-1/3 rounded-full bg-indigo-500/10 blur-3xl" />
          <div className="relative z-10">
            <div className="mb-4 inline-flex items-center gap-2 rounded-full border border-indigo-500/25 bg-indigo-500/10 px-4 py-1.5">
              <span className="h-2 w-2 rounded-full bg-emerald-400" />
              <span className="text-xs font-semibold text-indigo-300">Verified supplier network</span>
            </div>
            <h1 className="mb-3 text-3xl font-black tracking-tight text-white md:text-5xl">
              Browse{" "}
              <span className="bg-gradient-to-r from-indigo-400 via-sky-400 to-emerald-400 bg-clip-text text-transparent">
                verified suppliers
              </span>
            </h1>
            <p className="mb-6 max-w-2xl text-sm leading-relaxed text-slate-400 md:text-base">
              All suppliers on Weinly are vetted. Verified suppliers have been audited and confirmed by the Weinly team — they carry a green badge on all quotes.
            </p>
            <div className="flex flex-wrap gap-4">
              {[
                { v: String(suppliers.length), l: "Active suppliers" },
                { v: String(suppliers.filter((s) => s.is_verified).length), l: "Verified suppliers" },
                { v: String(new Set(suppliers.flatMap((s) => s.categories || [])).size), l: "Categories covered" },
              ].map((s) => (
                <div key={s.l} className="flex flex-col gap-0.5">
                  <span className="text-2xl font-black text-white">{s.v}</span>
                  <span className="text-xs text-slate-500">{s.l}</span>
                </div>
              ))}
            </div>
          </div>
        </section>

        {/* Filters */}
        <section className="rounded-3xl border border-white/7 bg-[#111827] p-4 md:p-6">
          <div className="flex flex-col gap-3 md:flex-row md:items-center">
            <input
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              placeholder="Search suppliers by name, region or specialty..."
              className="flex-1 rounded-xl border border-white/10 bg-white/5 px-4 py-3 text-sm text-white outline-none transition-all placeholder:text-slate-600 focus:border-indigo-500"
            />
            <button
              onClick={() => setVerifiedOnly(!verifiedOnly)}
              className={`shrink-0 rounded-xl border px-4 py-3 text-sm font-bold transition-all cursor-pointer ${verifiedOnly ? "border-emerald-500/30 bg-emerald-500/10 text-emerald-400" : "border-white/10 bg-white/5 text-slate-400 hover:text-slate-300"}`}
            >
              ✓ Verified only
            </button>
          </div>

          {/* Category filter */}
          <div className="mt-3 flex flex-wrap gap-2">
            <button
              onClick={() => setCategoryFilter("all")}
              className={`rounded-full border px-3 py-1.5 text-xs font-bold transition-all cursor-pointer ${categoryFilter === "all" ? "border-white/30 bg-white/15 text-white" : "border-white/10 bg-white/4 text-slate-500 hover:text-slate-300"}`}
            >
              All categories
            </button>
            {FABRIC_CATEGORIES.map((cat) => {
              const color = getCategoryColor(cat.id);
              const count = suppliers.filter((s) => (s.categories || []).includes(cat.id)).length;
              if (count === 0) return null;
              return (
                <button key={cat.id} onClick={() => setCategoryFilter(cat.id)}
                  className={`rounded-full border px-3 py-1.5 text-xs font-bold transition-all cursor-pointer ${categoryFilter === cat.id ? `${color.bg} ${color.text} ${color.border}` : "border-white/10 bg-white/4 text-slate-500 hover:text-slate-300"}`}>
                  {cat.label} ({count})
                </button>
              );
            })}
          </div>
        </section>

        {/* Supplier grid */}
        <section className="rounded-3xl border border-white/7 bg-[#111827] p-4 md:p-6">
          <div className="mb-4 flex items-center justify-between">
            <h2 className="text-lg font-black text-white">
              {filtered.length} supplier{filtered.length !== 1 ? "s" : ""}
              {categoryFilter !== "all" ? ` in ${getCategoryLabel(categoryFilter)}` : ""}
            </h2>
          </div>

          {loading ? (
            <div className="py-20 text-center text-sm text-slate-500">Loading suppliers...</div>
          ) : filtered.length === 0 ? (
            <div className="rounded-2xl border border-dashed border-white/10 p-12 text-center">
              <div className="mb-3 text-4xl">◎</div>
              <div className="mb-2 font-bold text-slate-400">No suppliers found</div>
              <p className="m-0 text-sm text-slate-600">Try adjusting your filters or search term.</p>
            </div>
          ) : (
            <div className="grid grid-cols-1 gap-4 md:grid-cols-2 lg:grid-cols-3">
              {filtered.map((supplier) => {
                const review = reviewMap[supplier.id];
                const cats = supplier.categories || [];
                return (
                  <a key={supplier.id} href={`/suppliers/${supplier.id}`}
                    className="flex flex-col gap-4 rounded-2xl border border-white/7 bg-white/3 p-5 no-underline transition-all hover:border-indigo-500/30 hover:bg-white/5">

                    {/* Header */}
                    <div className="flex items-start justify-between gap-3">
                      <div>
                        <div className="flex items-center gap-2 flex-wrap mb-1">
                          <span className="text-base font-bold text-white">{supplier.company_name}</span>
                          {supplier.is_verified && <VerifiedBadge />}
                        </div>
                        <div className="text-xs text-slate-500">{supplier.region || "China"}</div>
                      </div>
                      {review && (
                        <div className="shrink-0 text-right">
                          <div className="text-sm font-black text-amber-400">{review.avg_rating.toFixed(1)}★</div>
                          <div className="text-xs text-slate-600">{review.count} review{review.count !== 1 ? "s" : ""}</div>
                        </div>
                      )}
                    </div>

                    {/* Bio */}
                    {supplier.bio && (
                      <p className="m-0 text-xs leading-relaxed text-slate-400 line-clamp-2">{supplier.bio}</p>
                    )}

                    {/* Categories */}
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
                          <span className="rounded-full border border-white/10 bg-white/5 px-2 py-0.5 text-xs text-slate-500">+{cats.length - 3} more</span>
                        )}
                      </div>
                    )}

                    <div className="mt-auto flex items-center justify-between border-t border-white/6 pt-3">
                      <span className="text-xs text-slate-600">Member since {new Date(supplier.created_at).toLocaleDateString("en-US", { month: "short", year: "numeric" })}</span>
                      <span className="text-xs font-semibold text-indigo-400">View profile →</span>
                    </div>
                  </a>
                );
              })}
            </div>
          )}
        </section>

        {/* Become a supplier CTA */}
        <section className="rounded-3xl border border-amber-500/20 bg-gradient-to-br from-[#1a0f00] to-[#0f0a00] p-6 md:p-10">
          <div className="grid grid-cols-1 gap-6 md:grid-cols-2 md:items-center">
            <div>
              <span className="mb-3 inline-block rounded-full bg-amber-500/15 px-3 py-1 text-xs font-bold uppercase tracking-widest text-amber-400">For suppliers</span>
              <h2 className="mb-3 text-2xl font-black tracking-tight text-white md:text-3xl">Join Weinly as a verified supplier</h2>
              <p className="mb-5 text-sm leading-relaxed text-slate-400">Get your products in front of serious buyers from Africa, the Middle East and beyond. Weinly connects you directly to buyers who are ready to pay.</p>
              <div className="flex flex-wrap gap-3">
                <a href="/supplier/auth" className="inline-flex items-center rounded-xl bg-gradient-to-r from-amber-500 to-amber-700 px-6 py-3 text-sm font-bold text-white no-underline shadow-lg shadow-amber-500/20">
                  Apply as supplier →
                </a>
                <a href={supportLink} target="_blank" rel="noreferrer" className="inline-flex items-center rounded-xl border border-white/10 bg-white/6 px-6 py-3 text-sm font-semibold text-slate-300 no-underline hover:bg-white/10 transition-all">
                  WhatsApp us
                </a>
              </div>
            </div>
            <div className="flex flex-col gap-3">
              {[
                { icon: "✓", text: "Get in front of thousands of international buyers", color: "text-emerald-400" },
                { icon: "✓", text: "Buyers come to you — no cold outreach needed", color: "text-emerald-400" },
                { icon: "✓", text: "Earn a Verified badge after audit", color: "text-emerald-400" },
                { icon: "✓", text: "Post ready stock for instant sales", color: "text-emerald-400" },
              ].map((item) => (
                <div key={item.text} className="flex items-start gap-3 rounded-xl border border-white/7 bg-white/4 p-3">
                  <span className={`font-bold ${item.color}`}>{item.icon}</span>
                  <span className="text-sm text-slate-300">{item.text}</span>
                </div>
              ))}
            </div>
          </div>
        </section>

        <SiteFooter />
      </div>
    </main>
  );
}
