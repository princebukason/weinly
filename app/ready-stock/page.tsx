"use client";

import { useEffect, useState, useMemo } from "react";
import { createClient } from "@supabase/supabase-js";
import SiteHeader from "@/components/SiteHeader";
import SiteFooter from "@/components/SiteFooter";
import FabricImage from "@/components/FabricImage";
import { FABRIC_CATEGORIES, getCategoryColor, getCategoryLabel } from "@/lib/categories";
import { buildWhatsappLink } from "@/lib/config";

const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL!,
  process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!
);

type ReadyStockItem = {
  id: string; created_at: string; supplier_id: string;
  name: string; description: string | null; category: string;
  subcategory: string | null; price_per_unit: string; unit: string;
  moq: string; available_quantity: string | null;
  is_sold_out: boolean | null; image_url?: string | null;
};

type SupplierMap = Record<string, {
  company_name: string; is_verified: boolean | null; region: string | null;
}>;

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
      (suppliersRes.data || []).forEach((s: any) => {
        map[s.id] = { company_name: s.company_name, is_verified: s.is_verified, region: s.region };
      });
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

        {/* Hero — full-width fabric image mosaic */}
        <section className="relative overflow-hidden rounded-3xl">
          {/* Background image mosaic */}
          <div className="grid grid-cols-4 grid-rows-1 h-64 md:h-80">
            {FABRIC_CATEGORIES.slice(0, 4).map((cat, i) => (
              <FabricImage
                key={cat.id}
                categoryId={cat.id}
                itemIndex={i}
                alt={cat.label}
                aspectRatio="square"
                className="h-full"
              />
            ))}
          </div>

          {/* Overlay content */}
          <div className="absolute inset-0 flex flex-col justify-end p-6 md:p-10"
            style={{ background: "linear-gradient(to top, rgba(10,15,30,0.97) 0%, rgba(10,15,30,0.6) 50%, rgba(10,15,30,0.2) 100%)" }}>
            <div className="mb-4 inline-flex w-fit items-center gap-2 rounded-full border border-emerald-500/25 bg-emerald-500/10 px-4 py-1.5">
              <span className="h-2 w-2 animate-pulse rounded-full bg-emerald-400" />
              <span className="text-xs font-semibold text-emerald-300">In stock · Ships fast</span>
            </div>
            <h1 className="mb-2 text-3xl font-black tracking-tight text-white md:text-5xl">
              Ready stock fabrics
            </h1>
            <p className="mb-4 max-w-xl text-sm leading-relaxed text-slate-300 md:text-base">
              Fabric available right now from verified suppliers. No production wait — pack and ship within days.
            </p>
            <div className="flex flex-wrap gap-6">
              {[
                { v: String(availableCount), l: "Items available" },
                { v: String(new Set(items.map((i) => i.supplier_id)).size), l: "Suppliers" },
                { v: String(categoriesInStock.length), l: "Categories" },
              ].map((s) => (
                <div key={s.l} className="flex flex-col gap-0.5">
                  <span className="text-2xl font-black text-white">{s.v}</span>
                  <span className="text-xs text-slate-400">{s.l}</span>
                </div>
              ))}
            </div>
          </div>
        </section>

        {/* Filters */}
        <section className="rounded-3xl border border-white/7 bg-[#111827] p-4 md:p-5">
          <div className="flex flex-col gap-3 md:flex-row md:items-center">
            <input value={search} onChange={(e) => setSearch(e.target.value)}
              placeholder="Search fabric name, supplier or category..."
              className="flex-1 rounded-xl border border-white/10 bg-white/5 px-4 py-3 text-sm text-white outline-none transition-all placeholder:text-slate-600 focus:border-emerald-500" />
            <button onClick={() => setInStockOnly(!inStockOnly)}
              className={`shrink-0 rounded-xl border px-4 py-3 text-sm font-bold transition-all cursor-pointer ${inStockOnly ? "border-emerald-500/30 bg-emerald-500/10 text-emerald-400" : "border-white/10 bg-white/5 text-slate-400 hover:text-slate-300"}`}>
              In stock only
            </button>
          </div>
          <div className="mt-3 flex flex-wrap gap-2">
            <button onClick={() => setCategoryFilter("all")}
              className={`rounded-full border px-3 py-1.5 text-xs font-bold transition-all cursor-pointer ${categoryFilter === "all" ? "border-white/30 bg-white/15 text-white" : "border-white/10 bg-white/4 text-slate-500 hover:text-slate-300"}`}>
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
            /* Loading skeleton */
            <div className="grid grid-cols-1 gap-4 md:grid-cols-2 lg:grid-cols-3">
              {Array.from({ length: 6 }).map((_, i) => (
                <div key={i} className="rounded-2xl border border-white/7 bg-white/3 overflow-hidden animate-pulse">
                  <div className="aspect-video bg-white/8" />
                  <div className="p-4 flex flex-col gap-2">
                    <div className="h-3 bg-white/8 rounded w-16" />
                    <div className="h-4 bg-white/8 rounded w-3/4" />
                    <div className="h-3 bg-white/8 rounded w-1/2" />
                  </div>
                </div>
              ))}
            </div>
          ) : filtered.length === 0 ? (
            <div className="rounded-2xl border border-dashed border-white/10 p-12 text-center">
              <div className="mb-3 text-4xl">◎</div>
              <div className="mb-2 font-bold text-slate-400">No items found</div>
              <p className="m-0 mb-5 text-sm text-slate-600">Try adjusting your filters or submit a custom sourcing request instead.</p>
              <a href="/#main-tabs" className="inline-flex items-center rounded-xl bg-gradient-to-r from-indigo-500 to-indigo-700 px-6 py-3 text-sm font-bold text-white no-underline">
                Submit a custom request →
              </a>
            </div>
          ) : (
            <div className="grid grid-cols-1 gap-4 md:grid-cols-2 lg:grid-cols-3">
              {filtered.map((item, idx) => {
                const supplier = supplierMap[item.supplier_id];
                const color = getCategoryColor(item.category);
                const enquiryLink = buildWhatsappLink(
                  `Hello Weinly, I'm interested in "${item.name}" from ${supplier?.company_name || "a supplier"} on the ready stock page. Can you help me proceed?`
                );

                return (
                  <div key={item.id}
                    className={`flex flex-col rounded-2xl border border-white/7 overflow-hidden transition-all hover:border-white/15 hover:scale-[1.01] ${item.is_sold_out ? "opacity-60" : ""}`}>

                    {/* Fabric image */}
                    <div className="relative">
                      <FabricImage
                        categoryId={item.category}
                        imageUrl={item.image_url}
                        itemIndex={idx}
                        alt={item.name}
                        aspectRatio="video"
                      />

                      {/* Status badge */}
                      <div className="absolute top-3 left-3">
                        {item.is_sold_out ? (
                          <span className="rounded-full border border-red-500/30 bg-red-500/20 px-3 py-1 text-xs font-bold text-red-300 backdrop-blur-sm">
                            Sold out
                          </span>
                        ) : (
                          <span className="rounded-full border border-emerald-500/30 bg-emerald-500/20 px-3 py-1 text-xs font-bold text-emerald-300 backdrop-blur-sm">
                            In stock
                          </span>
                        )}
                      </div>

                      {/* Category badge */}
                      <div className="absolute top-3 right-3">
                        <span className={`rounded-full border px-2.5 py-1 text-xs font-bold backdrop-blur-sm ${color.bg} ${color.text} ${color.border}`}>
                          {item.subcategory || getCategoryLabel(item.category)}
                        </span>
                      </div>

                      {/* Supplier badge */}
                      {supplier && (
                        <div className="absolute bottom-3 left-3 flex items-center gap-1.5">
                          <div className="flex items-center gap-1.5 rounded-full border border-white/15 bg-black/50 px-2.5 py-1 backdrop-blur-sm">
                            <span className="text-xs font-semibold text-white">{supplier.company_name}</span>
                            {supplier.is_verified && (
                              <span className="text-xs font-bold text-emerald-400">✓</span>
                            )}
                          </div>
                        </div>
                      )}
                    </div>

                    {/* Card body */}
                    <div className="flex flex-col gap-3 bg-[#111827] p-4 flex-1">
                      <div>
                        <h3 className="text-sm font-bold text-white mb-0.5">{item.name}</h3>
                        {item.description && (
                          <p className="text-xs leading-relaxed text-slate-400 line-clamp-2">{item.description}</p>
                        )}
                      </div>

                      {/* Pricing grid */}
                      <div className="grid grid-cols-3 gap-2">
                        {[
                          { label: "Price", value: `${item.price_per_unit}/${item.unit}` },
                          { label: "MOQ", value: item.moq },
                          { label: "Stock", value: item.available_quantity || "Limited" },
                        ].map((s) => (
                          <div key={s.label} className="rounded-xl border border-white/7 bg-white/4 p-2.5">
                            <div className="mb-0.5 text-xs font-bold uppercase tracking-wider text-slate-600">{s.label}</div>
                            <div className="text-xs font-semibold text-white">{s.value}</div>
                          </div>
                        ))}
                      </div>

                      {/* CTA */}
                      {!item.is_sold_out ? (
                        <a href={enquiryLink} target="_blank" rel="noreferrer"
                          className="mt-auto block rounded-xl bg-gradient-to-r from-emerald-600 to-emerald-800 py-2.5 text-center text-sm font-bold text-white no-underline transition-all hover:shadow-lg hover:shadow-emerald-500/20">
                          Enquire on WhatsApp →
                        </a>
                      ) : (
                        <a href="/#main-tabs"
                          className="mt-auto block rounded-xl border border-white/10 bg-white/4 py-2.5 text-center text-sm font-semibold text-slate-400 no-underline transition-all hover:bg-white/8">
                          Submit custom request instead
                        </a>
                      )}
                    </div>
                  </div>
                );
              })}
            </div>
          )}
        </section>

        {/* Bottom CTA */}
        <section className="rounded-3xl border border-indigo-500/20 bg-gradient-to-br from-indigo-950 to-violet-950 p-6 md:p-8">
          <div className="grid grid-cols-1 gap-6 md:grid-cols-2 md:items-center">
            <div>
              <h2 className="mb-2 text-2xl font-black text-white">Can't find what you need?</h2>
              <p className="mb-5 text-sm leading-relaxed text-slate-400">Submit a custom sourcing request and we'll match you to verified suppliers who can produce exactly what you need.</p>
              <a href="/#main-tabs" className="inline-flex items-center rounded-xl bg-gradient-to-r from-indigo-500 to-violet-600 px-6 py-3 text-sm font-bold text-white no-underline shadow-lg shadow-indigo-500/20">
                Submit sourcing request →
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
