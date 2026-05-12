"use client";

import { useEffect, useState } from "react";
import { useParams } from "next/navigation";
import { createClient } from "@supabase/supabase-js";
import SiteHeader from "@/components/SiteHeader";
import SiteFooter from "@/components/SiteFooter";
import { getCategoryColor, getCategoryLabel } from "@/lib/categories";
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
  is_active: boolean | null;
  is_verified: boolean | null;
  bio: string | null;
  categories: string[] | null;
  created_at: string;
};

type Review = {
  id: string;
  buyer_name: string | null;
  rating: number;
  comment: string | null;
  created_at: string;
};

type ReadyStock = {
  id: string;
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

function StarDisplay({ rating }: { rating: number }) {
  return (
    <span>
      {[1, 2, 3, 4, 5].map((s) => (
        <span key={s} className={s <= rating ? "text-amber-400" : "text-slate-700"}>★</span>
      ))}
    </span>
  );
}

function VerifiedBadge() {
  return (
    <span className="inline-flex items-center gap-1.5 rounded-full border border-emerald-500/30 bg-emerald-500/10 px-3 py-1.5 text-sm font-bold text-emerald-400">
      <span>✓</span> Verified Supplier
    </span>
  );
}

export default function SupplierProfilePage() {
  const params = useParams();
  const id = params?.id as string;

  const [supplier, setSupplier] = useState<Supplier | null>(null);
  const [reviews, setReviews] = useState<Review[]>([]);
  const [stock, setStock] = useState<ReadyStock[]>([]);
  const [loading, setLoading] = useState(true);
  const [notFound, setNotFound] = useState(false);

  useEffect(() => {
    if (!id) return;
    async function load() {
      const [supplierRes, reviewsRes, stockRes] = await Promise.all([
        supabase.from("supplier_profiles").select("*").eq("id", id).eq("is_active", true).single(),
        supabase.from("supplier_reviews").select("id, buyer_name, rating, comment, created_at").eq("supplier_id", id).order("created_at", { ascending: false }),
        supabase.from("ready_stock").select("*").eq("supplier_id", id).eq("is_active", true).order("created_at", { ascending: false }),
      ]);
      if (supplierRes.error || !supplierRes.data) { setNotFound(true); setLoading(false); return; }
      setSupplier(supplierRes.data as Supplier);
      setReviews((reviewsRes.data || []) as Review[]);
      setStock((stockRes.data || []) as ReadyStock[]);
      setLoading(false);
    }
    load();
  }, [id]);

  if (loading) {
    return (
      <main className="min-h-screen bg-[#0a0f1e] flex items-center justify-center font-sans">
        <div className="text-slate-400 text-sm">Loading supplier profile...</div>
      </main>
    );
  }

  if (notFound || !supplier) {
    return (
      <main className="min-h-screen bg-[#0a0f1e] px-3 py-3 font-sans">
        <div className="mx-auto max-w-5xl">
          <SiteHeader />
          <div className="mt-4 rounded-3xl border border-white/7 bg-[#111827] p-12 text-center">
            <div className="mb-3 text-5xl">◎</div>
            <div className="mb-2 text-xl font-black text-white">Supplier not found</div>
            <p className="mb-6 text-sm text-slate-500">This supplier may have been removed or the link is incorrect.</p>
            <a href="/suppliers" className="inline-flex items-center rounded-xl bg-gradient-to-r from-indigo-500 to-indigo-700 px-6 py-3 text-sm font-bold text-white no-underline">Browse suppliers →</a>
          </div>
        </div>
      </main>
    );
  }

  const avgRating = reviews.length > 0
    ? (reviews.reduce((sum, r) => sum + r.rating, 0) / reviews.length).toFixed(1)
    : null;

  const cats = supplier.categories || [];
  const supportLink = buildWhatsappLink(`Hello Weinly, I want to get a quote from ${supplier.company_name}.`);

  return (
    <main className="min-h-screen bg-[#0a0f1e] px-3 py-3 font-sans md:px-4 md:py-4">
      <div className="mx-auto flex max-w-5xl flex-col gap-3">
        <SiteHeader />

        {/* Back */}
        <div>
          <a href="/suppliers" className="text-sm font-semibold text-slate-500 no-underline hover:text-slate-300 transition-colors">← Back to suppliers</a>
        </div>

        {/* Profile hero */}
        <section className="relative overflow-hidden rounded-3xl border border-indigo-500/15 bg-gradient-to-br from-[#0f172a] via-[#1a1040] to-[#0c1a3a] p-6 md:p-10 shadow-2xl shadow-indigo-500/10">
          <div className="pointer-events-none absolute right-0 top-0 h-64 w-64 translate-x-1/3 -translate-y-1/3 rounded-full bg-indigo-500/10 blur-3xl" />
          <div className="relative z-10 flex flex-col gap-5 md:flex-row md:items-start md:justify-between">
            <div className="flex flex-col gap-3">
              {/* Company name + verified */}
              <div className="flex flex-wrap items-center gap-3">
                <div className="flex h-14 w-14 items-center justify-center rounded-2xl bg-gradient-to-br from-indigo-500 to-violet-600 text-2xl font-black text-white shadow-lg shadow-indigo-500/30">
                  {supplier.company_name.charAt(0).toUpperCase()}
                </div>
                <div>
                  <h1 className="text-2xl font-black tracking-tight text-white md:text-3xl">{supplier.company_name}</h1>
                  <div className="text-sm text-slate-400">{supplier.region || "China"}</div>
                </div>
              </div>

              {supplier.is_verified && <VerifiedBadge />}

              {supplier.bio && (
                <p className="max-w-xl text-sm leading-relaxed text-slate-400">{supplier.bio}</p>
              )}

              {/* Stats row */}
              <div className="flex flex-wrap gap-5">
                {avgRating && (
                  <div className="flex flex-col gap-0.5">
                    <span className="text-2xl font-black text-amber-400">{avgRating}★</span>
                    <span className="text-xs text-slate-500">{reviews.length} review{reviews.length !== 1 ? "s" : ""}</span>
                  </div>
                )}
                {cats.length > 0 && (
                  <div className="flex flex-col gap-0.5">
                    <span className="text-2xl font-black text-white">{cats.length}</span>
                    <span className="text-xs text-slate-500">{cats.length === 1 ? "category" : "categories"}</span>
                  </div>
                )}
                {stock.length > 0 && (
                  <div className="flex flex-col gap-0.5">
                    <span className="text-2xl font-black text-emerald-400">{stock.filter((s) => !s.is_sold_out).length}</span>
                    <span className="text-xs text-slate-500">items in stock</span>
                  </div>
                )}
                <div className="flex flex-col gap-0.5">
                  <span className="text-2xl font-black text-white">{new Date(supplier.created_at).getFullYear()}</span>
                  <span className="text-xs text-slate-500">joined Weinly</span>
                </div>
              </div>
            </div>

            {/* CTA */}
            <div className="flex shrink-0 flex-col gap-2 md:items-end">
              <a href={`/?category=&scroll=main-tabs`} onClick={() => { sessionStorage.setItem("prefill_supplier", supplier.company_name); }}
                className="inline-flex items-center rounded-xl bg-gradient-to-r from-indigo-500 to-indigo-700 px-6 py-3 text-sm font-bold text-white no-underline shadow-lg shadow-indigo-500/25">
                Request a quote →
              </a>
              <a href={supportLink} target="_blank" rel="noreferrer"
                className="inline-flex items-center rounded-xl border border-emerald-500/20 bg-emerald-500/10 px-6 py-3 text-sm font-bold text-emerald-400 no-underline transition-all hover:bg-emerald-500/15">
                Chat on WhatsApp
              </a>
            </div>
          </div>
        </section>

        {/* Categories */}
        {cats.length > 0 && (
          <section className="rounded-3xl border border-white/7 bg-[#111827] p-5 md:p-6">
            <h2 className="mb-4 text-lg font-black text-white">Fabric categories</h2>
            <div className="grid grid-cols-2 gap-2 md:grid-cols-3 lg:grid-cols-4">
              {cats.map((catId) => {
                const color = getCategoryColor(catId);
                return (
                  <div key={catId} className={`rounded-xl border p-3 ${color.bg} ${color.border}`}>
                    <span className={`text-sm font-semibold ${color.text}`}>{getCategoryLabel(catId)}</span>
                  </div>
                );
              })}
            </div>
          </section>
        )}

        {/* Ready stock */}
        {stock.length > 0 && (
          <section className="rounded-3xl border border-white/7 bg-[#111827] p-5 md:p-6">
            <div className="mb-4 flex items-center justify-between">
              <h2 className="text-lg font-black text-white">Ready stock</h2>
              <span className="rounded-full bg-emerald-500/15 px-3 py-1 text-xs font-bold text-emerald-400">
                {stock.filter((s) => !s.is_sold_out).length} available
              </span>
            </div>
            <div className="grid grid-cols-1 gap-3 md:grid-cols-2">
              {stock.map((item) => {
                const color = getCategoryColor(item.category);
                return (
                  <div key={item.id} className={`rounded-2xl border p-4 flex flex-col gap-3 ${item.is_sold_out ? "opacity-50" : ""} ${color.bg} ${color.border}`}>
                    <div className="flex items-start justify-between gap-3">
                      <div>
                        <div className={`text-sm font-bold ${color.text} mb-0.5`}>{item.name}</div>
                        <div className="text-xs text-slate-500">{getCategoryLabel(item.category)}{item.subcategory ? ` · ${item.subcategory}` : ""}</div>
                      </div>
                      {item.is_sold_out ? (
                        <span className="rounded-full bg-red-500/15 border border-red-500/25 px-2.5 py-1 text-xs font-bold text-red-400">Sold out</span>
                      ) : (
                        <span className="rounded-full bg-emerald-500/15 border border-emerald-500/25 px-2.5 py-1 text-xs font-bold text-emerald-400">In stock</span>
                      )}
                    </div>
                    {item.description && (
                      <p className="m-0 text-xs leading-relaxed text-slate-400">{item.description}</p>
                    )}
                    <div className="grid grid-cols-3 gap-2">
                      {[
                        { label: "Price", value: `${item.price_per_unit}/${item.unit}` },
                        { label: "MOQ", value: item.moq },
                        { label: "Available", value: item.available_quantity || "Ask" },
                      ].map((s) => (
                        <div key={s.label} className="rounded-xl border border-white/7 bg-white/5 p-2.5">
                          <div className="mb-0.5 text-xs font-bold uppercase tracking-wider text-slate-600">{s.label}</div>
                          <div className="text-sm font-semibold text-white">{s.value}</div>
                        </div>
                      ))}
                    </div>
                    {!item.is_sold_out && (
                      <a href={buildWhatsappLink(`Hello Weinly, I'm interested in ${item.name} from ${supplier.company_name}. Can you help me get a quote?`)}
                        target="_blank" rel="noreferrer"
                        className="block rounded-xl bg-white/10 py-2.5 text-center text-sm font-bold text-white no-underline transition-all hover:bg-white/15">
                        Enquire about this fabric →
                      </a>
                    )}
                  </div>
                );
              })}
            </div>
          </section>
        )}

        {/* Reviews */}
        <section className="rounded-3xl border border-white/7 bg-[#111827] p-5 md:p-6">
          <div className="mb-4 flex items-center justify-between">
            <h2 className="text-lg font-black text-white">Buyer reviews</h2>
            {avgRating && (
              <div className="flex items-center gap-2">
                <span className="text-2xl font-black text-amber-400">{avgRating}</span>
                <StarDisplay rating={Math.round(Number(avgRating))} />
                <span className="text-xs text-slate-500">({reviews.length})</span>
              </div>
            )}
          </div>
          {reviews.length === 0 ? (
            <div className="rounded-2xl border border-dashed border-white/10 p-8 text-center">
              <p className="m-0 text-sm text-slate-600">No reviews yet. Be the first to review this supplier after unlocking their contact.</p>
            </div>
          ) : (
            <div className="flex flex-col gap-3">
              {reviews.map((review) => (
                <div key={review.id} className="rounded-2xl border border-white/7 bg-white/3 p-4 flex flex-col gap-2">
                  <div className="flex items-center justify-between gap-3">
                    <div>
                      <span className="text-sm font-bold text-white">{review.buyer_name || "Verified buyer"}</span>
                      <span className="ml-2 text-xs text-slate-500">{new Date(review.created_at).toLocaleDateString()}</span>
                    </div>
                    <StarDisplay rating={review.rating} />
                  </div>
                  {review.comment && <p className="m-0 text-sm leading-relaxed text-slate-400">{review.comment}</p>}
                </div>
              ))}
            </div>
          )}
        </section>

        {/* Bottom CTA */}
        <section className="rounded-3xl border border-indigo-500/20 bg-gradient-to-br from-indigo-950 to-violet-950 p-6 md:p-8 text-center">
          <h2 className="mb-2 text-2xl font-black text-white">Ready to source from {supplier.company_name}?</h2>
          <p className="mb-6 text-sm text-slate-400">Submit a fabric request and get a quote from this supplier within 24 hours.</p>
          <div className="flex flex-wrap justify-center gap-3">
            <a href="/#main-tabs" className="inline-flex items-center rounded-xl bg-gradient-to-r from-indigo-500 to-violet-600 px-8 py-3.5 text-sm font-bold text-white no-underline shadow-lg shadow-indigo-500/25">
              Submit a request →
            </a>
            <a href={supportLink} target="_blank" rel="noreferrer"
              className="inline-flex items-center rounded-xl border border-white/10 bg-white/6 px-8 py-3.5 text-sm font-semibold text-slate-300 no-underline hover:bg-white/10 transition-all">
              Ask on WhatsApp
            </a>
          </div>
        </section>

        <SiteFooter />
      </div>
    </main>
  );
}
