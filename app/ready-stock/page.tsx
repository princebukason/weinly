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

type ReadyStockItem = {
  id: string;
  created_at: string;
  supplier_id: string;
  name: string;
  description: string | null;
  category: string;
  subcategory: string | null;
  price_per_unit: string;
  unit: string;
  moq: string;
  available_quantity: string | null;
  is_sold_out: boolean | null;
};

type SupplierMap = Record<string, { company_name: string; is_verified: boolean | null; region: string | null }>;

export default function ReadyStockPage() {
  const [items, setItems] = useState<ReadyStockItem[]>([]);
  const [supplierMap, setSupplierMap] = useState<SupplierMap>({});
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState("");
  const [categoryFilter, setCategoryFilter] = useState("all");
  const [inStockOnly, setInStockOnly] = useState(true);

  useEffect(() => {
    async function load() {
      const [stockRes, suppliersRes] = await Promise.all([
        supabase.from("ready_stock").select("*").eq("is_active", true).order("created_at", { ascending: false }),
        supabase.from("supplier_profiles").select("id, company_name, is_verified, region").eq("is_active", true),
      ]);
      setItems((stockRes.data || []) as ReadyStockItem[]);
      const map: SupplierMap = {};
      (suppliersRes.data || []).forEach((s: any) => { map[s.id] = { company_name: s.company_name, is_verified: s.is_verified, region: s.region }; });
      setSupplierMap(map);
      setLoading(false);
    }
    load();
  }, []);

  const filtered = useMemo(() => {
    const q = search.trim().toLowerCase();
    return items.filter((item) => {
      if (inStockOnly && item.is_sold_out) return false;
      if (categoryFilter !== "all" && item.category !== categoryFilter) return false;
      if (!q) return true;
      const supplier = supplierMap[item.supplier_id];
      return [item.name, item.description || "", getCategoryLabel(item.category), supplier?.company_name || ""].join(" ").toLowerCase().includes(q);
    });
  }, [items, search, categoryFilter, inStockOnly, supplierMap]);

  const categoriesInStock = useMemo(() => {
    const ids = new Set(items.map((i) => i.category));
    return FABRIC_CATEGORIES.filter((c) => ids.has(c.id));
  }, [items]);

  const availableCount = items.filter((i) => !i.is_sold_out).length;

  return (
    <main className="min-h-screen bg-[#0a0f1e] px-3 py-3 font-sans md:px-4 md:py-4">
      <div className="mx-auto flex max-w-6xl flex-col gap-3">
        <SiteHeader />

        {/* Hero */}
        <section className="relative overflow-hidden rounded-3xl border border-emerald-500/20 bg-gradient-to-br from-[#0a1a0f] via-[#0f1a10] to-[#0a0f1e] p-6 md:p-10 shadow-2xl shadow-emerald-500/8">
          <div className="pointer-events-none absolute right-0 top-0 h-72 w-72 translate-x-1/3 -translate-y-1/3 rounded-full bg-emerald-500/8 blur-3xl" />
          <div className="relative z-10">
            <div className="mb-4 inline-flex items-center gap-2 rounded-full border border-emerald-500/25 bg-emerald-500/10 px-4 py-1.5">
              <span className="h-2 w-2 animate-pulse rounded-full bg-emerald-400" />
              <span className="text-xs font-semibold text-emerald-300">In-stock · Ships fast</span>
            </div>
            <h1 className="mb-3 text-3xl font-black tracking-tight text-white md:text-5xl">
              Ready stock{" "}
              <span className="bg-gradient-to-r from-emerald-400 to-teal-400 bg-clip-text text-transparent">fabrics</span>
            </h1>
            <p className="mb-6 max-w-2xl text-sm leading-relaxed text-slate-400 md:text-base">
              Browse fabric that verified suppliers have available right now — no waiting for production. Smaller MOQs, faster delivery, immediate shipping.
            </p>
            <div className="flex flex-wrap gap-6">
              {[
                { v: String(availableCount), l: "Items available" },
                { v: String(new Set(items.map((i) => i.supplier_id)).size), l: "Suppliers" },
                { v: String(categoriesInStock.length), l: "Categories" },
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
        <section className="rounded-3xl border border-white/7 bg-[#111827] p-4 md:p-5">
          <div className="flex flex-col gap-3 md:flex-row md:items-center">
            <input
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              placeholder="Search fabric name, supplier or category..."
              className="flex-1 rounded-xl border border-white/10 bg-white/5 px-4 py-3 text-sm text-white outline-none transition-all placeholder:text-slate-600 focus:border-emerald-500"
            />
            <button
              onClick={() => setInStockOnly(!inStockOnly)}
              className={`shrink-0 rounded-xl border px-4 py-3 text-sm font-bold transition-all cursor-pointer ${inStockOnly ? "border-emerald-500/30 bg-emerald-500/10 text-emerald-400" : "border-white/10 bg-white/5 text-slate-400 hover:text-slate-300"}`}
            >
              In stock only
            </button>
          </div>
          <div className="mt-3 flex flex-wrap gap-2">
            <button
              onClick={() => setCategoryFilter("all")}
              className={`rounded-full border px-3 py-1.5 text-xs font-bold transition-all cursor-pointer ${categoryFilter === "all" ? "border-white/30 bg-white/15 text-white" : "border-white/10 bg-white/4 text-slate-500 hover:text-slate-300"}`}
            >
              All ({filtered.length})
            </button>
            {categoriesInStock.map((cat) => {
              const color = getCategoryColor(cat.id);
              const count = items.filter((i) => i.category === cat.id && (!inStockOnly || !i.is_sold_out)).length;
              return (
                <button key={cat.id} onClick={() => setCategoryFilter(cat.id)}
                  className={`rounded-full border px-3 py-1.5 text-xs font-bold transition-all cursor-pointer ${categoryFilter === cat.id ? `${color.bg} ${color.text} ${color.border}` : "border-white/10 bg-white/4 text-slate-500 hover:text-slate-300"}`}>
                  {cat.label} ({count})
                </button>
              );
            })}
          </div>
        </section>

        {/* Stock grid */}
        <section className="rounded-3xl border border-white/7 bg-[#111827] p-4 md:p-6">
          {loading ? (
            <div className="py-20 text-center text-sm text-slate-500">Loading ready stock...</div>
          ) : filtered.length === 0 ? (
            <div className="rounded-2xl border border-dashed border-white/10 p-12 text-center">
              <div className="mb-3 text-4xl">◎</div>
              <div className="mb-2 font-bold text-slate-400">No items found</div>
              <p className="m-0 text-sm text-slate-600">Try adjusting your filters or submit a custom sourcing request instead.</p>
              <a href="/#main-tabs" className="mt-4 inline-flex items-center rounded-xl bg-gradient-to-r from-indigo-500 to-indigo-700 px-6 py-3 text-sm font-bold text-white no-underline">
                Submit a custom request →
              </a>
            </div>
          ) : (
            <div className="grid grid-cols-1 gap-4 md:grid-cols-2 lg:grid-cols-3">
              {filtered.map((item) => {
                const supplier = supplierMap[item.supplier_id];
                const color = getCategoryColor(item.category);
                const enquiryLink = buildWhatsappLink(
                  `Hello Weinly, I'm interested in "${item.name}" from ${supplier?.company_name || "a supplier"} on the ready stock page. Can you help me proceed?`
                );
                return (
                  <div key={item.id} className={`flex flex-col gap-4 rounded-2xl border p-5 ${item.is_sold_out ? "opacity-60" : ""} ${color.border} ${color.bg}`}>
                    {/* Header */}
                    <div className="flex items-start justify-between gap-3">
                      <div>
                        <div className={`mb-1 text-base font-bold ${color.text}`}>{item.name}</div>
                        <div className="text-xs text-slate-500">
                          {getCategoryLabel(item.category)}{item.subcategory ? ` · ${item.subcategory}` : ""}
                        </div>
                      </div>
                      {item.is_sold_out ? (
                        <span className="shrink-0 rounded-full border border-red-500/25 bg-red-500/15 px-2.5 py-1 text-xs font-bold text-red-400">Sold out</span>
                      ) : (
                        <span className="shrink-0 rounded-full border border-emerald-500/25 bg-emerald-500/15 px-2.5 py-1 text-xs font-bold text-emerald-400">In stock</span>
                      )}
                    </div>

                    {/* Description */}
                    {item.description && (
                      <p className="m-0 text-xs leading-relaxed text-slate-400">{item.description}</p>
                    )}

                    {/* Pricing grid */}
                    <div className="grid grid-cols-3 gap-2">
                      {[
                        { label: "Price", value: `${item.price_per_unit}/${item.unit}` },
                        { label: "MOQ", value: item.moq },
                        { label: "Stock", value: item.available_quantity || "Limited" },
                      ].map((s) => (
                        <div key={s.label} className="rounded-xl border border-white/7 bg-black/20 p-2.5">
                          <div className="mb-0.5 text-xs font-bold uppercase tracking-wider text-slate-600">{s.label}</div>
                          <div className="text-sm font-semibold text-white">{s.value}</div>
                        </div>
                      ))}
                    </div>

                    {/* Supplier */}
                    {supplier && (
                      <div className="flex items-center justify-between gap-2 rounded-xl border border-white/7 bg-black/20 px-3 py-2">
                        <div className="text-xs text-slate-400">
                          <span className="font-semibold text-white">{supplier.company_name}</span>
                          {supplier.region && <span className="ml-1 text-slate-500">· {supplier.region}</span>}
                        </div>
                        {supplier.is_verified && (
                          <span className="shrink-0 rounded-full border border-emerald-500/30 bg-emerald-500/10 px-2 py-0.5 text-xs font-bold text-emerald-400">✓ Verified</span>
                        )}
                      </div>
                    )}

                    {/* CTA */}
                    {!item.is_sold_out ? (
                      <a href={enquiryLink} target="_blank" rel="noreferrer"
                        className="block rounded-xl bg-white/10 py-2.5 text-center text-sm font-bold text-white no-underline transition-all hover:bg-white/15">
                        Enquire on WhatsApp →
                      </a>
                    ) : (
                      <a href="/#main-tabs"
                        className="block rounded-xl border border-white/10 bg-transparent py-2.5 text-center text-sm font-semibold text-slate-400 no-underline transition-all hover:bg-white/5">
                        Submit custom request instead
                      </a>
                    )}
                  </div>
                );
              })}
            </div>
          )}
        </section>

        {/* Submit request CTA */}
        <section className="rounded-3xl border border-indigo-500/20 bg-gradient-to-br from-indigo-950 to-violet-950 p-6 md:p-8">
          <div className="grid grid-cols-1 gap-6 md:grid-cols-2 md:items-center">
            <div>
              <h2 className="mb-2 text-2xl font-black text-white">Can't find what you need?</h2>
              <p className="mb-5 text-sm leading-relaxed text-slate-400">Submit a custom sourcing request and we'll match you to verified suppliers who can produce exactly what you need.</p>
              <a href="/#main-tabs" className="inline-flex items-center rounded-xl bg-gradient-to-r from-indigo-500 to-violet-600 px-6 py-3 text-sm font-bold text-white no-underline shadow-lg shadow-indigo-500/20">
                Submit a sourcing request →
              </a>
            </div>
            <div className="flex flex-col gap-2">
              {["Custom fabric specifications", "Any quantity — even small MOQ", "Quote within 24 hours", "Verified supplier matching"].map((item) => (
                <div key={item} className="flex items-center gap-3 rounded-xl border border-white/7 bg-white/4 p-3">
                  <span className="text-emerald-400">✓</span>
                  <span className="text-sm text-slate-300">{item}</span>
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
