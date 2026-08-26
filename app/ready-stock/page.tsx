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



type ReadyStockItem = {
  id: string; created_at: string; supplier_id: string;
  name: string; description: string | null; category: string;
  subcategory: string | null; price_per_unit: string; unit: string;
  moq: string; available_quantity: string | null;
  is_sold_out: boolean | null; images: string[] | null; video_url: string | null;
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
        getSupabase().from("ready_stock").select("*").eq("is_active", true).order("created_at", { ascending: false }),
        getSupabase().from("supplier_profiles").select("id, company_name, is_verified, region").eq("is_active", true),
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
    <main className="min-h-screen bg-[#f0f2f0] font-sans">
      <div className="flex w-full flex-col gap-0">
        <SiteHeader />

        <div className="mx-auto flex w-full max-w-7xl flex-col gap-4 px-4 py-4">

          {/* Hero — fabric image mosaic */}
          <section className="relative overflow-hidden rounded-lg">
            <div className="grid grid-cols-4 grid-rows-1 h-64 md:h-80">
              {FABRIC_CATEGORIES.slice(0, 4).map((cat, i) => (
                <FabricImage key={cat.id} categoryId={cat.id} itemIndex={i}
                  alt={cat.label} aspectRatio="square" className="h-full" />
              ))}
            </div>
            <div className="absolute inset-0 flex flex-col justify-end p-6 md:p-10"
              style={{ background: "linear-gradient(to top, rgba(36,72,63,0.95) 0%, rgba(36,72,63,0.6) 50%, rgba(36,72,63,0.1) 100%)" }}>
              <div className="mb-4 inline-flex w-fit items-center gap-2 rounded-full border border-white/20 bg-white/10 px-4 py-1.5">
                <span className="h-2 w-2 animate-pulse rounded-full bg-[#f59e0b]" />
                <span className="text-xs font-semibold text-[#f8efe2]">In stock · Ships fast</span>
              </div>
              <h1 className="mb-2 text-3xl font-black tracking-tight text-white md:text-5xl">
                Ready stock fabrics
              </h1>
              <p className="mb-4 max-w-xl text-sm leading-relaxed text-[#e8dcc8] md:text-base">
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
                placeholder="Search fabric name, supplier or category..."
                className="flex-1 rounded-md border border-stone-200 bg-stone-50 px-4 py-3 text-sm text-[#1f2933] outline-none transition-all placeholder:text-stone-400 focus:border-amber-500" />
              <button onClick={() => setInStockOnly(!inStockOnly)}
                className={`shrink-0 rounded-md border px-4 py-3 text-sm font-bold transition-all cursor-pointer ${inStockOnly ? "border-emerald-500/30 bg-emerald-500/10 text-[#2f7d57]" : "border-stone-200 bg-stone-50 text-stone-500 hover:text-stone-700"}`}>
                In stock only
              </button>
            </div>
            <div className="mt-3 flex flex-wrap gap-2">
              <button onClick={() => setCategoryFilter("all")}
                className={`rounded-full border px-3 py-1.5 text-xs font-bold transition-all cursor-pointer ${categoryFilter === "all" ? "border-[#24483f]/30 bg-[#24483f]/10 text-[#24483f]" : "border-stone-200 bg-stone-50 text-stone-500 hover:text-stone-700"}`}>
                All ({filtered.length})
              </button>
              {categoriesInStock.map((cat) => {
                const color = getCategoryColor(cat.id);
                const count = items.filter((i) => i.category === cat.id && (!inStockOnly || !i.is_sold_out)).length;
                return (
                  <button key={cat.id} onClick={() => setCategoryFilter(cat.id)}
                    className={`rounded-full border px-3 py-1.5 text-xs font-bold transition-all cursor-pointer ${categoryFilter === cat.id ? `${color.bg} ${color.text} ${color.border}` : "border-stone-200 bg-stone-50 text-stone-500 hover:text-stone-700"}`}>
                    {cat.label} ({count})
                  </button>
                );
              })}
            </div>
          </section>

          {/* Stock grid */}
          <section className="rounded-lg border border-stone-200 bg-white p-4 md:p-6">
            {loading ? (
              <div className="grid grid-cols-1 gap-4 md:grid-cols-2 lg:grid-cols-3">
                {Array.from({ length: 6 }).map((_, i) => (
                  <div key={i} className="rounded-lg border border-stone-200 bg-stone-50 overflow-hidden animate-pulse">
                    <div className="aspect-video bg-stone-200" />
                    <div className="p-4 flex flex-col gap-2">
                      <div className="h-3 bg-stone-200 rounded w-16" />
                      <div className="h-4 bg-stone-200 rounded w-3/4" />
                      <div className="h-3 bg-stone-200 rounded w-1/2" />
                    </div>
                  </div>
                ))}
              </div>
            ) : filtered.length === 0 ? (
              items.length === 0 ? (
                /* No stock at all — suppliers haven't listed yet */
                <div className="rounded-xl border border-dashed border-amber-300 bg-amber-50 p-12 text-center">
                  <div className="mb-3 text-5xl">📦</div>
                  <div className="mb-2 text-lg font-black text-[#1f2933]">Suppliers are adding stock soon</div>
                  <p className="m-0 mb-2 text-sm leading-relaxed text-stone-500 max-w-md mx-auto">
                    Our verified suppliers are currently uploading their available fabric inventory. Check back shortly — new listings are added regularly.
                  </p>
                  <p className="m-0 mb-6 text-sm text-stone-400">
                    In the meantime, submit a custom sourcing request and we'll match you to the right supplier directly.
                  </p>
                  <a href="/#main-tabs" className="inline-flex items-center rounded-lg bg-[#f59e0b] px-6 py-3 text-sm font-bold text-[#1a2e1a] no-underline shadow-md">
                    Submit a sourcing request →
                  </a>
                </div>
              ) : (
                /* Stock exists but filters returned nothing */
                <div className="rounded-lg border border-dashed border-stone-300 p-12 text-center">
                  <div className="mb-3 text-4xl">◎</div>
                  <div className="mb-2 font-bold text-stone-500">No items match your filters</div>
                  <p className="m-0 mb-5 text-sm text-stone-400">Try clearing your search or changing the category filter.</p>
                  <a href="/#main-tabs" className="inline-flex items-center rounded-lg bg-[#f59e0b] px-6 py-3 text-sm font-bold text-[#1a2e1a] no-underline">
                    Submit a custom request →
                  </a>
                </div>
              )
            ) : (
              <div className="grid grid-cols-1 gap-4 md:grid-cols-2 lg:grid-cols-3">
                {filtered.map((item, idx) => {
                  const supplier = supplierMap[item.supplier_id];
                  const color = getCategoryColor(item.category);
                  const enquiryLink = buildWhatsappLink(
                    `Hello Weinly, I'm interested in "${item.name}" from ${supplier?.company_name || "a supplier"} on the ready stock page. Can you help me proceed?`
                  );
                  const managedOrderLink = buildWhatsappLink(
                    `Hello Weinly, I want you to manage my order for "${item.name}" (${item.price_per_unit}/${item.unit}, MOQ: ${item.moq}) from ${supplier?.company_name || "a supplier"}. Please coordinate supplier, QC and shipping — I understand there is a 4% service fee.`
                  );

                  return (
                    <div key={item.id}
                      className={`flex flex-col rounded-lg border border-stone-200 overflow-hidden transition-all hover:border-[#24483f]/30 hover:scale-[1.01] ${item.is_sold_out ? "opacity-60" : ""}`}>

                      <div className="relative">
                        {item.images && item.images.length > 0 ? (
                          <div className="relative overflow-hidden rounded-xl">
                            <img src={item.images[0]} alt={item.name}
                              className="w-full h-48 object-cover" />
                            {item.images.length > 1 && (
                              <span className="absolute bottom-2 right-2 rounded-full bg-black/60 px-2 py-0.5 text-xs font-bold text-white">
                                +{item.images.length - 1} more
                              </span>
                            )}
                          </div>
                        ) : (
                          <FabricImage
                            categoryId={item.category}
                            itemIndex={idx}
                            alt={item.name}
                            aspectRatio="video"
                          />
                        )}
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
                        <div className="absolute top-3 right-3">
                          <span className={`rounded-full border px-2.5 py-1 text-xs font-bold backdrop-blur-sm ${color.bg} ${color.text} ${color.border}`}>
                            {item.subcategory || getCategoryLabel(item.category)}
                          </span>
                        </div>
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

                      <div className="flex flex-col gap-3 bg-white p-4 flex-1">
                        <div>
                          <h3 className="text-sm font-bold text-[#1f2933] mb-0.5">{item.name}</h3>
                          {item.description && (
                            <p className="text-xs leading-relaxed text-stone-500 line-clamp-2">{item.description}</p>
                          )}
                        </div>
                        <div className="grid grid-cols-3 gap-2">
                          {[
                            { label: "Price", value: `${item.price_per_unit}/${item.unit}` },
                            { label: "MOQ", value: item.moq },
                            { label: "Stock", value: item.available_quantity || "Limited" },
                          ].map((s) => (
                            <div key={s.label} className="rounded-md border border-stone-200 bg-stone-50 p-2.5">
                              <div className="mb-0.5 text-xs font-bold uppercase tracking-wider text-stone-400">{s.label}</div>
                              <div className="text-xs font-semibold text-[#1f2933]">{s.value}</div>
                            </div>
                          ))}
                        </div>
                        {!item.is_sold_out ? (
                          <div className="mt-auto flex flex-col gap-2">
                            <a href={managedOrderLink} target="_blank" rel="noreferrer"
                              className="block rounded-md bg-[#24483f] py-2.5 text-center text-sm font-bold text-white no-underline transition-all hover:bg-[#1a3530]">
                              Weinly manages this order <span className="ml-1 rounded-full bg-white/15 px-1.5 py-0.5 text-xs font-normal">4% fee</span>
                            </a>
                            <a href={enquiryLink} target="_blank" rel="noreferrer"
                              className="block rounded-md border border-stone-200 py-2 text-center text-xs font-semibold text-stone-500 no-underline transition-all hover:bg-stone-50">
                              Just enquire →
                            </a>
                          </div>
                        ) : (
                          <a href="/#main-tabs"
                            className="mt-auto block rounded-md border border-stone-200 bg-stone-50 py-2.5 text-center text-sm font-semibold text-stone-500 no-underline transition-all hover:bg-stone-100">
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
          <section className="rounded-lg border border-[#24483f]/20 bg-[#24483f] p-6 md:p-8">
            <div className="grid grid-cols-1 gap-6 md:grid-cols-2 md:items-center">
              <div>
                <h2 className="mb-2 text-2xl font-black text-white">Can't find what you need?</h2>
                <p className="mb-5 text-sm leading-relaxed text-[#e8dcc8]">Submit a custom sourcing request and we'll match you to verified suppliers who can produce exactly what you need.</p>
                <a href="/#main-tabs" className="inline-flex items-center rounded-md bg-[#f59e0b] text-[#1a2e1a] px-6 py-3 text-sm font-bold text-white no-underline shadow-lg shadow-black/20">
                  Submit sourcing request →
                </a>
              </div>
              <div className="flex flex-col gap-2">
                {["Custom fabric specifications", "Any quantity — even small MOQ", "Quote within 24 hours", "Verified supplier matching"].map((item) => (
                  <div key={item} className="flex items-center gap-3 rounded-lg border border-white/15 bg-white/10 p-3">
                    <span className="text-[#f59e0b]">✓</span>
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
