"use client";

import { useEffect, useMemo, useState, useCallback } from "react";
import { createClient, SupabaseClient } from "@supabase/supabase-js";
import SiteHeader from "@/components/SiteHeader";
import SiteFooter from "@/components/SiteFooter";
import { buildWhatsappLink } from "@/lib/config";
import { useCurrency } from "@/hooks/useCurrency";
import { FABRIC_CATEGORIES, getCategoryById, getCategoryColor, getCategoryLabel } from "@/lib/categories";
import FabricImage from "@/components/FabricImage";

let PaystackPop: any = null;

let _supabase: SupabaseClient | null = null;
function getSupabase() {
  if (!_supabase) _supabase = createClient(process.env.NEXT_PUBLIC_SUPABASE_URL ?? "", process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY ?? "");
  return _supabase;
}
const PAYSTACK_PUBLIC_KEY = process.env.NEXT_PUBLIC_PAYSTACK_PUBLIC_KEY || "";

type FabricRequest = {
  id: string; created_at: string; client_name: string | null; client_email: string | null;
  client_phone: string | null; user_input: string; ai_output: unknown; status: string | null;
  internal_note: string | null; buyer_requested_contact: boolean | null;
  contact_request_status: string | null; contact_access_fee: string | null;
  payment_status: string | null; payment_reference: string | null; paid_at: string | null;
  category: string | null; subcategory: string | null;
};

type Quote = {
  id: string; request_id: string; supplier_name: string; supplier_id?: string | null;
  price: string | null; moq: string | null; note: string | null; contact_name: string | null;
  contact_phone: string | null; contact_wechat: string | null; contact_email: string | null;
  supplier_region: string | null; lead_time: string | null; is_contact_released: boolean | null;
};

type Review = {
  id: string; request_id: string; supplier_id: string; quote_id: string;
  buyer_email: string | null; buyer_name: string | null; rating: number;
  comment: string | null; created_at: string;
};

type PublicReview = {
  id: string; supplier_name: string; rating: number; comment: string | null;
  buyer_name: string | null; created_at: string;
};

function formatAiOutput(aiOutput: unknown) {
  if (!aiOutput) return "—";
  if (typeof aiOutput === "string") return aiOutput;
  if (typeof aiOutput === "object") {
    return Object.entries(aiOutput as Record<string, unknown>)
      .map(([key, value]) => `${key.replace(/_/g, " ")}: ${String(value ?? "")}`)
      .join("\n");
  }
  return String(aiOutput);
}

function getStageLabel(request: FabricRequest, quoteCount: number) {
  if (request.contact_request_status === "approved") return "Supplier contact released";
  if (request.payment_status === "paid") return "Payment received — pending approval";
  if (quoteCount > 0) return "Quotes available";
  if (request.status === "completed") return "Completed";
  return "Submitted — being processed";
}

function getStagePill(request: FabricRequest, quoteCount: number) {
  if (request.contact_request_status === "approved")
    return { bg: "bg-emerald-100 text-[#2f7d57] border border-emerald-200", label: "Access unlocked" };
  if (request.payment_status === "paid")
    return { bg: "bg-violet-100 text-violet-700 border border-violet-200", label: "Paid — awaiting approval" };
  if (quoteCount > 0)
    return { bg: "bg-blue-100 text-blue-700 border border-blue-200", label: "Quotes ready" };
  return { bg: "bg-amber-100 text-amber-700 border border-amber-200", label: "In progress" };
}

function CategoryBadge({ categoryId, subcategory }: { categoryId: string; subcategory?: string | null }) {
  const color = getCategoryColor(categoryId);
  return (
    <span className={`inline-flex items-center gap-1.5 rounded-full border px-3 py-1 text-xs font-semibold ${color.bg} ${color.text} ${color.border}`}>
      {getCategoryLabel(categoryId)}{subcategory ? ` · ${subcategory}` : ""}
    </span>
  );
}

function StarRating({ value, onChange, size = "lg" }: { value: number; onChange?: (v: number) => void; size?: "sm" | "lg" }) {
  const [hovered, setHovered] = useState(0);
  const active = hovered || value;
  const sz = size === "lg" ? "text-2xl" : "text-base";
  return (
    <div className="flex gap-1">
      {[1, 2, 3, 4, 5].map((star) => (
        <button key={star} type="button" onClick={() => onChange?.(star)}
          onMouseEnter={() => onChange && setHovered(star)} onMouseLeave={() => onChange && setHovered(0)}
          className={`${sz} border-0 bg-transparent p-0 leading-none transition-all ${onChange ? "cursor-pointer" : "cursor-default"} ${star <= active ? "text-amber-500" : "text-stone-300"}`}>
          ★
        </button>
      ))}
    </div>
  );
}

function ReviewForm({ request, quote, onSubmitted }: { request: FabricRequest; quote: Quote; onSubmitted: () => void }) {
  const [rating, setRating] = useState(0);
  const [comment, setComment] = useState("");
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState("");
  const labels = ["", "Poor", "Fair", "Good", "Very good", "Excellent"];

  async function submit(e: React.FormEvent) {
    e.preventDefault();
    if (rating === 0) { setError("Please select a star rating."); return; }
    setSubmitting(true); setError("");
    try {
      const { error: insertError } = await getSupabase().from("supplier_reviews").insert([{
        request_id: request.id, supplier_id: quote.supplier_id || quote.id,
        quote_id: quote.id, buyer_email: request.client_email, buyer_name: request.client_name,
        rating, comment: comment.trim() || null,
      }]);
      if (insertError) {
        if (insertError.code === "23505") { setError("You've already reviewed this supplier."); }
        else throw insertError;
        return;
      }
      onSubmitted();
    } catch { setError("Failed to submit review. Please try again."); }
    finally { setSubmitting(false); }
  }

  return (
    <form onSubmit={submit} className="flex flex-col gap-4 rounded-xl border border-amber-200 bg-amber-50 p-5">
      <div>
        <h4 className="m-0 mb-1 text-base font-bold text-[#1f2933]">Rate this supplier</h4>
        <p className="m-0 text-xs leading-relaxed text-stone-500">Help other buyers by sharing your experience with {quote.supplier_name}.</p>
      </div>
      <div className="flex flex-col gap-1.5">
        <label className="text-xs font-bold uppercase tracking-wider text-stone-400">Your rating</label>
        <div className="flex items-center gap-3">
          <StarRating value={rating} onChange={setRating} />
          {rating > 0 && <span className="text-sm font-semibold text-amber-700">{labels[rating]}</span>}
        </div>
      </div>
      <div className="flex flex-col gap-1.5">
        <label className="text-xs font-bold uppercase tracking-wider text-stone-400">Comment <span className="text-stone-400 normal-case font-normal">(optional)</span></label>
        <textarea value={comment} onChange={(e) => setComment(e.target.value)}
          placeholder="How was the supplier's pricing, communication and product quality?" rows={3}
          className="w-full resize-none rounded-lg border border-stone-200 bg-white px-4 py-3 text-sm text-[#1f2933] outline-none transition-all placeholder:text-stone-400 focus:border-amber-500" />
      </div>
      {error && <div className="rounded-lg border border-red-200 bg-red-50 p-3 text-xs text-red-600">{error}</div>}
      <button type="submit" disabled={submitting || rating === 0}
        className="self-start cursor-pointer rounded-lg border-0 bg-[#f59e0b] px-6 py-3 text-sm font-bold text-[#1a2e1a] shadow-sm disabled:cursor-not-allowed disabled:opacity-60">
        {submitting ? "Submitting..." : "Submit review →"}
      </button>
    </form>
  );
}

export default function HomePage() {
  const prices = useCurrency();

  const [description, setDescription] = useState("");
  const [clientName, setClientName] = useState("");
  const [clientEmail, setClientEmail] = useState("");
  const [clientPhone, setClientPhone] = useState("");
  const [selectedCategory, setSelectedCategory] = useState("");
  const [selectedSubcategory, setSelectedSubcategory] = useState("");
  const [loading, setLoading] = useState(false);
  const [lookupLoading, setLookupLoading] = useState(false);
  const [paymentLoading, setPaymentLoading] = useState(false);
  const [requestId, setRequestId] = useState("");
  const [lookupId, setLookupId] = useState("");
  const [submittedRequest, setSubmittedRequest] = useState<FabricRequest | null>(null);
  const [submittedQuotes, setSubmittedQuotes] = useState<Quote[]>([]);
  const [lookupRequest, setLookupRequest] = useState<FabricRequest | null>(null);
  const [lookupQuotes, setLookupQuotes] = useState<Quote[]>([]);
  const [activeTab, setActiveTab] = useState<"submit" | "track">("submit");
  const [isLive, setIsLive] = useState(false);
  const [lastUpdated, setLastUpdated] = useState<Date | null>(null);
  const [realtimeFlash, setRealtimeFlash] = useState(false);
  const [submittedReviews, setSubmittedReviews] = useState<Set<string>>(new Set());
  const [existingReviews, setExistingReviews] = useState<Review[]>([]);
  const [publicReviews, setPublicReviews] = useState<PublicReview[]>([]);
  const [reviewsLoaded, setReviewsLoaded] = useState(false);
  const [toast, setToast] = useState<{ msg: string; type: "error" | "success" | "info" } | null>(null);
  const [formError, setFormError] = useState("");
  const [lookupError, setLookupError] = useState("");
  const [copiedId, setCopiedId] = useState(false);
  const [findByEmail, setFindByEmail] = useState("");
  const [findByEmailLoading, setFindByEmailLoading] = useState(false);
  const [findByEmailResults, setFindByEmailResults] = useState<any[] | null>(null);
  const [findByEmailError, setFindByEmailError] = useState("");
  const [showProUnlock, setShowProUnlock] = useState(false);
  const [proUnlockEmail, setProUnlockEmail] = useState("");
  const [proUnlockName, setProUnlockName] = useState("");
  const [proUnlockLoading, setProUnlockLoading] = useState(false);

  function showToast(msg: string, type: "error" | "success" | "info" = "info") {
    setToast({ msg, type });
    setTimeout(() => setToast(null), 4000);
  }

  async function handleFindByEmail() {
    setFindByEmailError("");
    setFindByEmailResults(null);
    if (!findByEmail.trim()) { setFindByEmailError("Please enter your email address."); return; }
    setFindByEmailLoading(true);
    try {
      const res = await fetch("/api/buyer/requests", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ email: findByEmail.trim() }),
      });
      const data = await res.json();
      if (!res.ok) { setFindByEmailError(data.error || "Failed to find requests."); return; }
      setFindByEmailResults(data.requests || []);
    } catch { setFindByEmailError("Something went wrong. Please try again."); }
    finally { setFindByEmailLoading(false); }
  }

  function copyRequestId(id: string) {
    navigator.clipboard.writeText(id).then(() => {
      setCopiedId(true);
      setTimeout(() => setCopiedId(false), 2000);
    });
  }

  const activeCategory = useMemo(() => getCategoryById(selectedCategory), [selectedCategory]);

  useEffect(() => {
    async function loadPublicReviews() {
      const { data } = await getSupabase().from("supplier_reviews").select("id, rating, comment, buyer_name, created_at, supplier_id").order("created_at", { ascending: false }).limit(20);
      if (!data) return;
      const supplierIds = [...new Set(data.map((r: any) => r.supplier_id))];
      const { data: profiles } = await getSupabase().from("supplier_profiles").select("id, company_name").in("id", supplierIds);
      const nameMap: Record<string, string> = {};
      (profiles || []).forEach((p: any) => { nameMap[p.id] = p.company_name; });
      setPublicReviews(data.map((r: any) => ({ id: r.id, supplier_name: nameMap[r.supplier_id] || "Verified Supplier", rating: r.rating, comment: r.comment, buyer_name: r.buyer_name, created_at: r.created_at })));
      setReviewsLoaded(true);
    }
    loadPublicReviews();
  }, []);

  async function generateAISpec(userInput: string) {
    try {
      const res = await fetch("/api/spec", { method: "POST", headers: { "Content-Type": "application/json" }, body: JSON.stringify({ input: userInput }) });
      if (!res.ok) return null;
      const data = await res.json();
      return data?.output || null;
    } catch { return null; }
  }

  async function fetchQuotes(id: string) {
    const { data, error } = await getSupabase().from("quotes").select("*").eq("request_id", id).order("id", { ascending: false });
    if (error) return [];
    return (data || []) as Quote[];
  }

  async function fetchRequest(id: string) {
    const { data, error } = await getSupabase().from("fabric_requests").select("*").eq("id", id).single();
    if (error) return null;
    return data as FabricRequest;
  }

  async function fetchReviewsForRequest(id: string) {
    const { data } = await getSupabase().from("supplier_reviews").select("*").eq("request_id", id);
    if (data) {
      setExistingReviews(data as Review[]);
      setSubmittedReviews(new Set(data.map((r: Review) => r.quote_id)));
    }
  }

  const syncState = useCallback(async (id: string, flash = false) => {
    const request = await fetchRequest(id);
    const quotes = await fetchQuotes(id);
    setLookupRequest(request);
    setLookupQuotes(quotes);
    setLookupId(id);
    setLastUpdated(new Date());
    if (submittedRequest?.id === id) { setSubmittedRequest(request); setSubmittedQuotes(quotes); }
    if (flash) { setRealtimeFlash(true); setTimeout(() => setRealtimeFlash(false), 1500); }
    await fetchReviewsForRequest(id);
  }, [submittedRequest]);

  useEffect(() => {
    const activeId = lookupId || requestId;
    if (!activeId) return;
    setIsLive(false);
    const channel = getSupabase().channel(`tracker-${activeId}`)
      .on("postgres_changes", { event: "*", schema: "public", table: "fabric_requests", filter: `id=eq.${activeId}` }, async () => { await syncState(activeId, true); })
      .on("postgres_changes", { event: "*", schema: "public", table: "quotes", filter: `request_id=eq.${activeId}` }, async () => { await syncState(activeId, true); })
      .subscribe((status) => { setIsLive(status === "SUBSCRIBED"); });
    return () => { getSupabase().removeChannel(channel); setIsLive(false); };
  }, [lookupId, requestId, syncState]);

  useEffect(() => {
    if (typeof window === "undefined") return;
    const requestIdFromUrl = new URLSearchParams(window.location.search).get("requestId");
    if (!requestIdFromUrl) return;
    setLookupId(requestIdFromUrl);
    setActiveTab("track");
    async function load() {
      const request = await fetchRequest(requestIdFromUrl!);
      if (!request) return;
      const quotes = await fetchQuotes(requestIdFromUrl!);
      setLookupRequest(request);
      setLookupQuotes(quotes);
      setLastUpdated(new Date());
      await fetchReviewsForRequest(requestIdFromUrl!);
    }
    load();
  }, []);

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    setFormError("");
    if (!description.trim()) { setFormError("Please describe the fabric you need."); return; }
    if (!selectedCategory) { setFormError("Please select a fabric category."); return; }
    setLoading(true);
    try {
      const aiOutput = await generateAISpec(description.trim());
      const { data, error } = await getSupabase().from("fabric_requests").insert([{
        client_name: clientName || null, client_email: clientEmail || null,
        client_phone: clientPhone || null, user_input: description.trim(),
        ai_output: aiOutput, status: "submitted", buyer_requested_contact: false,
        contact_request_status: "none", payment_status: "unpaid",
        category: selectedCategory, subcategory: selectedSubcategory || null,
      }]).select().single();
      if (error) throw error;
      setSubmittedRequest(data as FabricRequest);
      setSubmittedQuotes([]);
      setRequestId(data.id);
      setLookupId(data.id);
      setActiveTab("track");
      setLastUpdated(new Date());
      setTimeout(() => { document.getElementById("request-result")?.scrollIntoView({ behavior: "smooth" }); }, 100);
      if (clientEmail) {
        fetch("/api/email/notify-request-submitted", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ buyerEmail: clientEmail, buyerName: clientName || "", requestId: data.id, fabricDescription: description.trim() }),
        }).catch(() => {});
      }
      // Notify matching suppliers about the new request
      fetch("/api/email/notify-suppliers", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ requestId: data.id }),
      }).catch(() => {});
    } catch { showToast("Something went wrong. Please try again.", "error"); }
    finally { setLoading(false); }
  }

  async function handleLookup(id?: string) {
    const cleanId = (id ?? lookupId).trim();
    setLookupError("");
    if (!cleanId) { setLookupError("Please paste a request ID."); return; }
    setLookupLoading(true);
    setLookupRequest(null);
    setLookupQuotes([]);
    try {
      const request = await fetchRequest(cleanId);
      if (!request) { setLookupError("No request found with that ID. Please check and try again."); return; }
      const quotes = await fetchQuotes(cleanId);
      setLookupRequest(request);
      setLookupQuotes(quotes);
      setLookupId(cleanId);
      setLastUpdated(new Date());
      await fetchReviewsForRequest(cleanId);
      setTimeout(() => { document.getElementById("request-tracker")?.scrollIntoView({ behavior: "smooth" }); }, 100);
    } catch { setLookupError("Failed to fetch request. Please try again."); }
    finally { setLookupLoading(false); }
  }

  async function requestContact(reqId: string) {
    try {
      const { error } = await getSupabase().from("fabric_requests").update({ buyer_requested_contact: true, contact_request_status: "pending", payment_status: "unpaid", contact_access_fee: 10000 }).eq("id", reqId);
      if (error) throw error;
      await syncState(reqId);
    } catch { showToast("Failed to request supplier contact. Please try again.", "error"); }
  }

  async function startPayment(request: FabricRequest) {
    if (!request.client_email) { showToast("Your email is required to proceed with payment.", "error"); return; }
    if (!PAYSTACK_PUBLIC_KEY) { showToast("Payment configuration missing. Please contact support.", "error"); return; }
    setPaymentLoading(true);
    try {
      const initRes = await fetch("/api/paystack/initialize", { method: "POST", headers: { "Content-Type": "application/json" }, body: JSON.stringify({ email: request.client_email, amount: prices.unlockRaw, requestId: request.id, name: request.client_name, phone: request.client_phone, currency: prices.currency }) });
      const initData = await initRes.json();
      if (!initRes.ok || !initData?.access_code) { showToast(initData?.error || "Failed to initialize payment.", "error"); setPaymentLoading(false); return; }
      if (!PaystackPop) { const m = await import("@paystack/inline-js"); PaystackPop = m.default; }
      const popup = new PaystackPop();
      popup.resumeTransaction(initData.access_code, {
        onSuccess: async (transaction: { reference: string }) => {
          try {
            const verifyRes = await fetch("/api/paystack/verify", { method: "POST", headers: { "Content-Type": "application/json" }, body: JSON.stringify({ reference: transaction.reference, requestId: request.id, expectedAmount: prices.unlockRaw }) });
            const verifyData = await verifyRes.json();
            if (!verifyRes.ok) { showToast(verifyData?.error || "Verification failed.", "error"); return; }
            await syncState(request.id);
            showToast("Payment confirmed! Supplier contacts are now unlocked.", "success");
            await new Promise((r) => setTimeout(r, 1500));
            if (activeRequest?.id) await fetchRequest(activeRequest.id);
          } catch { showToast("Payment verification failed. Please contact support.", "error"); }
          finally { setPaymentLoading(false); }
        },
        onCancel: () => setPaymentLoading(false),
      });
    } catch { setPaymentLoading(false); showToast("Failed to launch payment. Please try again.", "error"); }
  }

  async function handleProUnlock(request: FabricRequest) {
    const email = proUnlockEmail.trim() || request.client_email || "";
    if (!email || !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email)) {
      showToast("Please enter a valid email address.", "error"); return;
    }
    setProUnlockLoading(true);
    try {
      const initRes = await fetch("/api/paystack/subscribe", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ email, name: proUnlockName || request.client_name || "", plan: "pro_monthly", currency: prices.currency }),
      });
      const initData = await initRes.json();
      if (!initRes.ok || !initData?.access_code) { showToast(initData?.error || "Failed to initialize Pro payment.", "error"); setProUnlockLoading(false); return; }
      if (!PaystackPop) { const m = await import("@paystack/inline-js"); PaystackPop = m.default; }
      const popup = new PaystackPop();
      popup.resumeTransaction(initData.access_code, {
        onSuccess: async (transaction: { reference: string }) => {
          try {
            // Save Pro subscription
            await fetch("/api/paystack/verify-subscription", {
              method: "POST",
              headers: { "Content-Type": "application/json" },
              body: JSON.stringify({ reference: transaction.reference, email }),
            });
            // Immediately release contacts for this request using Pro credit
            const releaseRes = await fetch("/api/paystack/pro-release", {
              method: "POST",
              headers: { "Content-Type": "application/json" },
              body: JSON.stringify({ requestId: request.id, email }),
            });
            if (!releaseRes.ok) {
              showToast("Pro activated! Contact our team on WhatsApp to unlock this request.", "info");
            } else {
              showToast("Pro activated! Supplier contacts are now unlocked.", "success");
            }
            setShowProUnlock(false);
            await syncState(request.id);
          } catch { showToast("Payment received — contact support to activate your Pro unlock.", "error"); }
          finally { setProUnlockLoading(false); }
        },
        onCancel: () => setProUnlockLoading(false),
      });
    } catch { showToast("Failed to launch Pro payment. Please try again.", "error"); setProUnlockLoading(false); }
  }

  const activeRequest = useMemo(() => lookupRequest || submittedRequest, [lookupRequest, submittedRequest]);
  const activeQuotes = useMemo(() => (lookupRequest ? lookupQuotes : submittedQuotes), [lookupRequest, lookupQuotes, submittedQuotes]);
  const stagePill = useMemo(() => (activeRequest ? getStagePill(activeRequest, activeQuotes.length) : null), [activeRequest, activeQuotes.length]);
  const genericSupportLink = buildWhatsappLink("Hello Weinly, I need help with fabric sourcing.");
  const proSupportLink = buildWhatsappLink("Hello Weinly, I want to upgrade to Weinly Pro.");
  const avgRating = publicReviews.length > 0 ? (publicReviews.reduce((sum, r) => sum + r.rating, 0) / publicReviews.length).toFixed(1) : null;

  return (
    <main className="min-h-screen bg-[#f0f2f0] px-3 py-3 font-sans md:px-4 md:py-4">
      {/* Toast */}
      {toast && (
        <div className={`fixed bottom-6 left-1/2 z-50 -translate-x-1/2 flex items-center gap-3 rounded-xl border px-5 py-3.5 text-sm font-semibold shadow-xl transition-all ${
          toast.type === "error" ? "border-red-200 bg-red-50 text-red-700" :
          toast.type === "success" ? "border-emerald-200 bg-emerald-50 text-emerald-700" :
          "border-amber-200 bg-amber-50 text-amber-700"
        }`}>
          <span>{toast.type === "error" ? "✕" : "✓"}</span>
          <span>{toast.msg}</span>
          <button type="button" onClick={() => setToast(null)} className="ml-2 cursor-pointer bg-transparent border-0 text-current opacity-60 hover:opacity-100">✕</button>
        </div>
      )}

      <div className="mx-auto flex max-w-7xl flex-col gap-3">
        <SiteHeader />

        {/* ── HERO ── */}
        <section className="relative overflow-hidden rounded-2xl bg-[#24483f] p-6 md:p-12">
          <div className="pointer-events-none absolute right-0 top-0 h-80 w-80 translate-x-1/3 -translate-y-1/3 rounded-full bg-white/5 blur-3xl" />
          <div className="pointer-events-none absolute bottom-0 left-0 h-64 w-64 -translate-x-1/3 translate-y-1/3 rounded-full bg-[#f59e0b]/10 blur-3xl" />
          <div className="relative z-10 grid grid-cols-1 items-center gap-8 lg:grid-cols-2 lg:gap-12">
            <div className="flex flex-col gap-5">
              <div className="inline-flex w-fit items-center gap-2 rounded-full border border-white/20 bg-white/10 px-4 py-1.5">
                <span className="h-2 w-2 rounded-full bg-[#f59e0b] shadow-sm" />
                <span className="text-xs font-semibold text-[#f8efe2]">Fabric sourcing platform</span>
              </div>
              <h1 className="text-4xl font-black leading-[1.05] tracking-tight text-white md:text-5xl lg:text-6xl">
                Source premium fabrics{" "}
                <span className="text-[#f59e0b]">directly from China</span>
              </h1>
              <p className="max-w-lg text-base leading-relaxed text-[#e8dcc8] md:text-lg">Describe what you need. Weinly finds verified Chinese suppliers, negotiates the price, inspects quality and coordinates shipping — end to end.</p>
              <div className="flex flex-wrap gap-6">
                {[
                  { v: String(FABRIC_CATEGORIES.length), l: "Fabric categories" },
                  { v: "500+", l: "Fabric types" },
                  { v: prices.unlock, l: "Contact unlock" },
                  ...(avgRating ? [{ v: `${avgRating}★`, l: "Avg supplier rating" }] : []),
                ].map((s) => (
                  <div key={s.l} className="flex flex-col gap-0.5">
                    <span className="text-2xl font-black text-white">{s.v}</span>
                    <span className="text-xs font-medium text-[#e8dcc8]">{s.l}</span>
                  </div>
                ))}
              </div>
              <div className="flex flex-wrap gap-3">
                <button onClick={() => { setActiveTab("submit"); document.getElementById("main-tabs")?.scrollIntoView({ behavior: "smooth" }); }}
                  className="cursor-pointer rounded-lg border-0 bg-[#f59e0b] px-6 py-3 text-sm font-bold text-[#1a2e1a] shadow-lg shadow-amber-500/25 transition-all hover:bg-[#f0950a] hover:shadow-xl">
                  Start sourcing →
                </button>
                <a href={genericSupportLink} target="_blank" rel="noreferrer" className="flex items-center rounded-lg border border-white/20 bg-white/10 px-6 py-3 text-sm font-semibold text-[#f8efe2] no-underline transition-all hover:bg-white/15">WhatsApp us</a>
              </div>
            </div>
            <div className="flex flex-col gap-2">
              <p className="text-xs font-bold uppercase tracking-widest text-[#f59e0b] mb-1">Browse by category — click to source</p>
              <div className="grid grid-cols-3 gap-2">
                {FABRIC_CATEGORIES.slice(0, 6).map((cat) => (
                  <button
                    key={cat.id}
                    type="button"
                    onClick={() => { setSelectedCategory(cat.id); setSelectedSubcategory(""); setActiveTab("submit"); document.getElementById("main-tabs")?.scrollIntoView({ behavior: "smooth" }); }}
                    className="group relative overflow-hidden rounded-xl border border-white/15 cursor-pointer transition-all hover:scale-[1.04] hover:border-white/30 p-0 bg-transparent"
                  >
                    <FabricImage categoryId={cat.id} alt={cat.label} aspectRatio="square" overlay className="w-full" />
                    <div className="absolute inset-x-0 bottom-0 p-2">
                      <div className="text-xs font-bold text-white leading-tight drop-shadow">{cat.label}</div>
                    </div>
                  </button>
                ))}
              </div>
              <button
                type="button"
                onClick={() => { setActiveTab("submit"); document.getElementById("main-tabs")?.scrollIntoView({ behavior: "smooth" }); }}
                className="mt-1 w-full cursor-pointer rounded-xl border border-white/15 bg-white/8 py-2.5 text-center text-xs font-semibold text-[#e8dcc8] transition-all hover:bg-white/15"
              >
                + {FABRIC_CATEGORIES.length - 6} more categories →
              </button>
            </div>
          </div>
        </section>

        {/* ── CATEGORIES SHOWCASE ── */}
        <section className="rounded-2xl border border-stone-200 bg-white p-6 md:p-8">
          <span className="mb-3 inline-block rounded-full bg-[#24483f]/10 px-3 py-1 text-xs font-bold uppercase tracking-widest text-[#24483f]">What we source</span>
          <h2 className="mb-6 text-2xl font-black tracking-tight text-[#1f2933] md:text-3xl">{FABRIC_CATEGORIES.length} fabric categories</h2>
          <div className="grid grid-cols-2 gap-2.5 md:grid-cols-3 lg:grid-cols-4 xl:grid-cols-5">
            {FABRIC_CATEGORIES.map((cat) => {
              const color = getCategoryColor(cat.id);
              return (
                <button key={cat.id} onClick={() => { setSelectedCategory(cat.id); setSelectedSubcategory(""); setActiveTab("submit"); document.getElementById("main-tabs")?.scrollIntoView({ behavior: "smooth" }); }}
                  className={`flex flex-col overflow-hidden rounded-xl border text-left transition-all cursor-pointer hover:scale-[1.02] hover:shadow-md ${color.bg} ${color.border}`}>
                  <FabricImage categoryId={cat.id} alt={cat.label} aspectRatio="video" overlay className="w-full" />
                  <div className="flex flex-col gap-0.5 p-3">
                    <span className={`text-sm font-bold ${color.text}`}>{cat.label}</span>
                    <span className="text-xs text-stone-500">{cat.subcategories.length} types</span>
                  </div>
                </button>
              );
            })}
          </div>
        </section>

        {/* ── READY STOCK FAST-TRACK ── */}
        <section className="rounded-2xl border border-[#f59e0b]/40 bg-gradient-to-r from-[#fffbeb] to-[#fef3c7] p-6 md:p-8">
          <div className="flex flex-col gap-4 md:flex-row md:items-center md:justify-between">
            <div className="flex items-start gap-4">
              <div className="flex h-12 w-12 shrink-0 items-center justify-center rounded-xl bg-[#f59e0b] text-2xl shadow-md shadow-amber-500/20">⚡</div>
              <div>
                <div className="mb-1 inline-flex items-center gap-2 rounded-full bg-[#f59e0b]/20 px-3 py-0.5">
                  <span className="h-1.5 w-1.5 rounded-full bg-[#f59e0b]" />
                  <span className="text-xs font-bold text-[#92400e]">No waiting — available now</span>
                </div>
                <h2 className="mb-1 text-xl font-black tracking-tight text-[#1f2933] md:text-2xl">Ready Stock — browse fabrics in stock today</h2>
                <p className="text-sm leading-relaxed text-stone-600">Suppliers have listed fabrics they have available right now. Browse, find what you need, unlock contact and buy — no quote request needed.</p>
              </div>
            </div>
            <a href="/ready-stock" className="inline-flex shrink-0 items-center gap-2 rounded-xl bg-[#f59e0b] px-6 py-3.5 text-sm font-bold text-[#1a2e1a] no-underline shadow-md shadow-amber-500/20 transition-all hover:bg-[#f0950a]">
              Browse Ready Stock →
            </a>
          </div>
        </section>

        {/* ── HOW IT WORKS ── */}
        <section id="how-it-works" className="rounded-2xl border border-stone-200 bg-white p-6 md:p-10">
          <span className="mb-3 inline-block rounded-full bg-[#24483f]/10 px-3 py-1 text-xs font-bold uppercase tracking-widest text-[#24483f]">How it works</span>
          <div className="mb-6 flex flex-col gap-1 md:flex-row md:items-end md:justify-between">
            <h2 className="m-0 text-2xl font-black tracking-tight text-[#1f2933] md:text-3xl">Three steps to your supplier</h2>
            <a href="/ready-stock" className="text-sm font-semibold text-[#f59e0b] no-underline hover:underline">⚡ Need it now? Browse Ready Stock →</a>
          </div>
          <div className="grid grid-cols-1 gap-4 md:grid-cols-3">
            {[
              { n: "01", title: "Submit your request", text: "Choose a fabric category, describe what you need. AI formats it into a professional sourcing spec.", color: "from-[#a75635] to-[#c9935b]", textColor: "text-[#f59e0b]" },
              { n: "02", title: "Review supplier quotes", text: "We match you to verified Chinese suppliers in your category. See price, MOQ and lead time first.", color: "from-[#24483f] to-[#2f7d57]", textColor: "text-[#24483f]" },
              { n: "03", title: "Weinly handles the rest", text: "We coordinate supplier via WeChat, inspect quality before shipment, and manage delivery. You pay 4% on order completion.", color: "from-[#a75635] to-[#c9935b]", textColor: "text-[#f59e0b]" },
            ].map((step) => (
              <div key={step.n} className="rounded-xl border border-stone-200 bg-stone-50 p-6">
                <div className={`mb-3 text-xs font-black uppercase tracking-widest ${step.textColor}`}>{step.n}</div>
                <div className={`mb-4 h-1 w-10 rounded-full bg-gradient-to-r ${step.color}`} />
                <h3 className="mb-2 text-base font-bold text-[#1f2933]">{step.title}</h3>
                <p className="m-0 text-sm leading-relaxed text-stone-500">{step.text}</p>
              </div>
            ))}
          </div>
        </section>

        {/* ── MAIN TABS ── */}
        <section id="main-tabs" className="rounded-2xl border border-stone-200 bg-white p-4 md:p-8">
          <div className="mb-6 flex gap-2 rounded-xl border border-stone-200 bg-stone-50 p-1.5">
            {(["submit", "track"] as const).map((tab) => (
              <button key={tab} onClick={() => setActiveTab(tab)}
                className={`flex-1 cursor-pointer rounded-lg border-0 px-4 py-3 text-sm font-bold transition-all ${activeTab === tab ? "bg-[#f59e0b] text-[#1a2e1a] shadow-sm" : "bg-transparent text-stone-500 hover:text-stone-700"}`}>
                {tab === "submit" ? "Get quotes" : "Track order"}
              </button>
            ))}
          </div>

          {activeTab === "submit" && (
            <div className="flex flex-col gap-5">
              <div>
                <h2 className="mb-1 text-xl font-black tracking-tight text-[#1f2933] md:text-2xl">Tell us what you need</h2>
                <p className="m-0 text-sm leading-relaxed text-stone-500">Select a fabric category, then describe your requirement in detail.</p>
              </div>

              <form onSubmit={handleSubmit} className="flex flex-col gap-5">
                {/* Contact fields */}
                <div className="grid grid-cols-1 gap-3 md:grid-cols-3">
                  {[
                    { label: "Your name", value: clientName, setter: setClientName, placeholder: "e.g. Amaka Obi", type: "text" },
                    { label: "Email address", value: clientEmail, setter: setClientEmail, placeholder: "you@example.com", type: "email" },
                    { label: "WhatsApp / phone", value: clientPhone, setter: setClientPhone, placeholder: "+234 800 000 0000", type: "text" },
                  ].map((field) => (
                    <div key={field.label} className="flex flex-col gap-1.5">
                      <label className="text-xs font-bold uppercase tracking-wider text-stone-400">{field.label}</label>
                      <input value={field.value} onChange={(e) => field.setter(e.target.value)} placeholder={field.placeholder} type={field.type}
                        className="w-full rounded-lg border border-stone-200 bg-stone-50 px-4 py-3 text-sm text-[#1f2933] outline-none transition-all placeholder:text-stone-400 focus:border-amber-500 focus:bg-white" />
                    </div>
                  ))}
                </div>

                {/* Category selection */}
                <div className="flex flex-col gap-3">
                  <div>
                    <label className="text-xs font-bold uppercase tracking-wider text-stone-400">Fabric category <span className="text-red-500">*</span></label>
                    <p className="mt-1 text-xs text-stone-400">Select the category that best matches your fabric need.</p>
                  </div>
                  <div className="grid grid-cols-2 gap-2 md:grid-cols-3 lg:grid-cols-5">
                    {FABRIC_CATEGORIES.map((cat) => {
                      const color = getCategoryColor(cat.id);
                      const isSelected = selectedCategory === cat.id;
                      return (
                        <button key={cat.id} type="button" onClick={() => { setSelectedCategory(cat.id); setSelectedSubcategory(""); }}
                          className={`rounded-lg border px-3 py-2.5 text-left text-xs font-bold transition-all cursor-pointer ${isSelected ? `${color.bg} ${color.text} ${color.border}` : "border-stone-200 bg-stone-50 text-stone-500 hover:border-stone-300 hover:text-stone-700"}`}>
                          {cat.label}
                        </button>
                      );
                    })}
                  </div>
                </div>

                {/* Subcategory selection */}
                {activeCategory && (
                  <div className="flex flex-col gap-2">
                    <label className="text-xs font-bold uppercase tracking-wider text-stone-400">Fabric type <span className="text-stone-400 normal-case font-normal">(optional — be more specific)</span></label>
                    <div className="flex flex-wrap gap-2">
                      {activeCategory.subcategories.map((sub) => {
                        const color = getCategoryColor(activeCategory.id);
                        const isSelected = selectedSubcategory === sub;
                        return (
                          <button key={sub} type="button" onClick={() => setSelectedSubcategory(isSelected ? "" : sub)}
                            className={`rounded-full border px-3 py-1.5 text-xs font-semibold transition-all cursor-pointer ${isSelected ? `${color.bg} ${color.text} ${color.border}` : "border-stone-200 bg-stone-50 text-stone-500 hover:text-stone-700"}`}>
                            {sub}
                          </button>
                        );
                      })}
                    </div>
                  </div>
                )}

                {/* Description */}
                <div className="flex flex-col gap-1.5">
                  <label className="text-xs font-bold uppercase tracking-wider text-stone-400">Fabric description <span className="text-red-500">*</span></label>
                  <textarea value={description} onChange={(e) => setDescription(e.target.value)}
                    placeholder={
                      selectedCategory === "luxury" ? "Example: Swiss lace for bridal asoebi, ivory/cream, intricate floral pattern, soft handfeel, 5-yard packs, need 50+ packs..."
                      : selectedCategory === "african" ? "Example: Ankara wax print, vibrant geometric patterns, 6-yard bolt, 100% cotton, minimum 100 bolts..."
                      : selectedCategory === "sports" ? "Example: Dry-fit fabric for football jerseys, moisture-wicking, polyester blend, various colors, MOQ 500 meters..."
                      : "Describe the fabric type, color, quantity, quality and intended use..."
                    }
                    rows={5} className="w-full resize-y rounded-lg border border-stone-200 bg-stone-50 px-4 py-3 text-sm text-[#1f2933] outline-none transition-all placeholder:text-stone-400 focus:border-amber-500 focus:bg-white" />
                  <p className="m-0 text-xs text-stone-400">Include: fabric type · color · quantity · quality level · intended use</p>
                </div>

                {/* Selected category preview */}
                {selectedCategory && (
                  <div className="flex items-center gap-2 rounded-lg border border-stone-200 bg-stone-50 px-4 py-3">
                    <span className="text-xs text-stone-500">Your request:</span>
                    <CategoryBadge categoryId={selectedCategory} subcategory={selectedSubcategory} />
                  </div>
                )}

                {formError && (
                  <div className="flex items-center gap-2 rounded-lg border border-red-200 bg-red-50 px-4 py-3 text-sm text-red-600">
                    <span>✕</span><span>{formError}</span>
                  </div>
                )}
                <div className="flex flex-wrap gap-3">
                  <button type="submit" disabled={loading || !selectedCategory}
                    className="cursor-pointer rounded-lg border-0 bg-[#f59e0b] px-6 py-3 text-sm font-bold text-[#1a2e1a] shadow-sm disabled:cursor-not-allowed disabled:opacity-60">
                    {loading ? "Processing..." : "Get supplier quotes →"}
                  </button>
                  <a href={genericSupportLink} target="_blank" rel="noreferrer"
                    className="flex items-center rounded-lg border border-emerald-200 bg-emerald-50 px-6 py-3 text-sm font-bold text-[#2f7d57] no-underline transition-all hover:bg-emerald-100">Need help?</a>
                </div>
              </form>
            </div>
          )}

          {activeTab === "track" && (
            <div className="flex flex-col gap-5">
              <div>
                <h2 className="mb-1 text-xl font-black tracking-tight text-[#1f2933] md:text-2xl">Track your request</h2>
                <p className="m-0 text-sm leading-relaxed text-stone-500">Paste your request ID to see quotes, payment status and supplier contact.</p>
              </div>
              <div className="flex flex-wrap gap-3">
                <input value={lookupId} onChange={(e) => { setLookupId(e.target.value); setLookupError(""); }} placeholder="Paste your request ID here"
                  className="min-w-0 flex-1 rounded-lg border border-stone-200 bg-stone-50 px-4 py-3 text-sm text-[#1f2933] outline-none transition-all placeholder:text-stone-400 focus:border-amber-500 focus:bg-white" />
                <button onClick={() => handleLookup()} disabled={lookupLoading}
                  className="shrink-0 cursor-pointer rounded-lg border-0 bg-[#f59e0b] px-6 py-3 text-sm font-bold text-[#1a2e1a] disabled:opacity-60">
                  {lookupLoading ? "Loading..." : "Track →"}
                </button>
              </div>
              {lookupError && (
                <div className="flex items-center gap-2 rounded-lg border border-red-200 bg-red-50 px-4 py-3 text-sm text-red-600">
                  <span>✕</span><span>{lookupError}</span>
                </div>
              )}

              {/* Find by email */}
              <div className="rounded-xl border border-stone-200 bg-stone-50 p-4">
                <p className="mb-3 text-sm font-semibold text-stone-600">Don't have your request ID? Find all your requests by email.</p>
                <div className="flex flex-wrap gap-3">
                  <input type="email" value={findByEmail} onChange={(e) => { setFindByEmail(e.target.value); setFindByEmailError(""); setFindByEmailResults(null); }}
                    placeholder="Enter the email you used when submitting"
                    className="min-w-0 flex-1 rounded-lg border border-stone-200 bg-white px-4 py-3 text-sm text-[#1f2933] outline-none transition-all placeholder:text-stone-400 focus:border-amber-500" />
                  <button onClick={handleFindByEmail} disabled={findByEmailLoading}
                    className="shrink-0 cursor-pointer rounded-lg border-0 bg-[#24483f] px-5 py-3 text-sm font-bold text-white disabled:opacity-60">
                    {findByEmailLoading ? "Searching..." : "Find requests"}
                  </button>
                </div>
                {findByEmailError && <p className="mt-2 text-sm text-red-500">{findByEmailError}</p>}
                {findByEmailResults !== null && (
                  findByEmailResults.length === 0 ? (
                    <p className="mt-3 text-sm text-stone-400">No requests found for this email.</p>
                  ) : (
                    <div className="mt-3 flex flex-col gap-2">
                      {findByEmailResults.map((r: any) => (
                        <button key={r.id} onClick={() => { handleLookup(r.id); setFindByEmailResults(null); setFindByEmail(""); }}
                          className="flex cursor-pointer items-center justify-between rounded-lg border border-stone-200 bg-white px-4 py-3 text-left transition-all hover:border-amber-400 hover:bg-amber-50">
                          <div>
                            <div className="text-xs font-semibold text-stone-500">{new Date(r.created_at).toLocaleDateString()}</div>
                            <div className="text-sm font-bold text-[#1f2933] line-clamp-1">{r.user_input?.slice(0, 60) || r.category}</div>
                          </div>
                          <span className="ml-3 shrink-0 text-xs font-bold text-[#24483f]">View →</span>
                        </button>
                      ))}
                    </div>
                  )
                )}
              </div>

              <div className="flex flex-wrap gap-5">
                <a href="/history" className="text-sm font-semibold text-[#f59e0b] no-underline transition-colors hover:text-[#24483f]">View all history →</a>
                <a href={genericSupportLink} target="_blank" rel="noreferrer" className="text-sm font-semibold text-[#2f7d57] no-underline transition-colors hover:text-[#24483f]">Chat support →</a>
              </div>
              {submittedRequest && (
                <div id="request-result" className="flex flex-col gap-4 rounded-xl border border-emerald-200 bg-emerald-50 p-5">
                  <div className="flex items-center gap-4">
                    <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-full bg-[#2f7d57] text-base font-black text-white shadow-sm">✓</div>
                    <div>
                      <div className="text-base font-bold text-[#1f2933]">Request submitted!</div>
                      <div className="text-sm text-stone-500">Save your ID to track quotes</div>
                    </div>
                  </div>
                  {submittedRequest.category && (
                    <div className="flex items-center gap-2">
                      <span className="text-xs text-stone-500">Category:</span>
                      <CategoryBadge categoryId={submittedRequest.category} subcategory={submittedRequest.subcategory} />
                    </div>
                  )}
                  <div className="rounded-lg border border-emerald-200 bg-white p-4">
                    <div className="mb-2 text-xs font-bold uppercase tracking-widest text-[#2f7d57]">Request ID — save this</div>
                    <div className="flex items-center gap-3">
                      <div className="break-all text-sm font-semibold text-[#24483f] flex-1">{submittedRequest.id}</div>
                      <button type="button" onClick={() => copyRequestId(submittedRequest.id)}
                        className="shrink-0 cursor-pointer rounded-lg border border-emerald-200 bg-emerald-100 px-3 py-1.5 text-xs font-bold text-[#2f7d57] transition-all hover:bg-emerald-200">
                        {copiedId ? "Copied ✓" : "Copy"}
                      </button>
                    </div>
                  </div>
                  {submittedRequest.ai_output != null && (
                    <div className="rounded-lg border border-stone-200 bg-white p-4">
                      <div className="mb-2 text-xs font-bold uppercase tracking-widest text-stone-400">AI sourcing spec</div>
                      <p className="m-0 whitespace-pre-wrap text-sm leading-relaxed text-stone-600">{formatAiOutput(submittedRequest.ai_output)}</p>
                    </div>
                  )}
                  <div className="rounded-lg border border-amber-200 bg-amber-50 p-4">
                    <p className="m-0 text-sm leading-relaxed text-stone-600">
                      <strong className="text-[#f59e0b]">⚠ Save your Request ID.</strong> You will need it to track your quotes. Copy it above or bookmark this page — we cannot recover it for you if lost.
                    </p>
                  </div>
                  <div className="rounded-lg border border-stone-200 bg-white p-4">
                    <p className="m-0 text-sm leading-relaxed text-stone-600">
                      <strong className="text-[#1f2933]">What happens next?</strong> We are matching your request to verified suppliers. Quotes appear within 24 hours.
                    </p>
                  </div>
                </div>
              )}
            </div>
          )}
        </section>

        {/* ── TRACKER ── */}
        {activeRequest && stagePill && (
          <section id="request-tracker"
            className={`flex flex-col gap-5 rounded-2xl border p-5 shadow-sm md:p-8 transition-all duration-500 ${realtimeFlash ? "border-emerald-300 bg-emerald-50" : "border-stone-200 bg-white"}`}>
            <div className="flex flex-wrap items-start justify-between gap-4">
              <div>
                <h2 className="mb-1 flex items-center gap-2 text-xl font-black tracking-tight text-[#1f2933] md:text-2xl">
                  Request tracker
                  <span className={`inline-flex items-center gap-1.5 rounded-full border px-2.5 py-1 text-xs font-semibold transition-all ${isLive ? "border-emerald-200 bg-emerald-100 text-[#2f7d57]" : "border-stone-200 bg-stone-100 text-stone-400"}`}>
                    <span className={`h-1.5 w-1.5 rounded-full ${isLive ? "animate-pulse bg-[#2f7d57]" : "bg-stone-400"}`} />
                    {isLive ? "Live" : "Connecting..."}
                  </span>
                </h2>
                <p className="m-0 text-sm text-stone-500">
                  Follow quotes, pay and unlock supplier contact
                  {lastUpdated && <span className="ml-2 text-xs text-stone-400">· Updated {lastUpdated.toLocaleTimeString()}</span>}
                </p>
              </div>
              <div className="flex flex-wrap items-center gap-2">
                {activeRequest.category && <CategoryBadge categoryId={activeRequest.category} subcategory={activeRequest.subcategory} />}
                <span className={`rounded-full px-4 py-2 text-xs font-bold ${stagePill.bg}`}>{stagePill.label}</span>
              </div>
            </div>

            {realtimeFlash && (
              <div className="flex items-center gap-2 rounded-lg border border-emerald-200 bg-emerald-100 px-4 py-3 text-sm font-semibold text-[#2f7d57]">
                <span className="h-2 w-2 animate-ping rounded-full bg-[#2f7d57]" />
                Tracker updated in real time
              </div>
            )}

            <div className="rounded-lg border border-stone-200 bg-stone-50 p-4">
              <div className="mb-2 text-base font-bold text-[#1f2933]">{getStageLabel(activeRequest, activeQuotes.length)}</div>
              <p className="m-0 text-sm leading-relaxed text-stone-500">
                {activeRequest.contact_request_status === "approved" ? "Supplier contact approved — direct details visible below."
                  : activeRequest.payment_status === "paid" ? "Payment received. Admin is reviewing — contact will be released shortly."
                  : activeQuotes.length > 0 ? "Quote preview ready. Review below then proceed to unlock supplier contact."
                  : "Request received and being matched to verified suppliers."}
              </p>
            </div>

            <div className="grid grid-cols-2 gap-2.5 md:grid-cols-4">
              {[
                { label: "Request ID", value: activeRequest.id },
                { label: "Buyer", value: activeRequest.client_name || "—" },
                { label: "Status", value: activeRequest.status || "submitted" },
                { label: "Payment", value: activeRequest.payment_status || "unpaid" },
                { label: "Contact status", value: activeRequest.contact_request_status || "none" },
                { label: "Access fee", value: activeRequest.contact_access_fee || "—" },
                { label: "Reference", value: activeRequest.payment_reference || "—" },
                { label: "Paid at", value: activeRequest.paid_at ? new Date(activeRequest.paid_at).toLocaleString() : "—" },
              ].map((info) => (
                <div key={info.label} className="rounded-lg border border-stone-200 bg-stone-50 p-3">
                  <div className="mb-1 text-xs font-bold uppercase tracking-wider text-stone-400">{info.label}</div>
                  <div className="break-words text-xs leading-relaxed text-[#1f2933]">{info.value}</div>
                </div>
              ))}
            </div>

            <div className="rounded-lg border border-stone-200 bg-stone-50 p-4">
              <div className="mb-2 text-xs font-bold uppercase tracking-widest text-stone-400">Fabric request</div>
              <p className="m-0 whitespace-pre-wrap text-sm leading-relaxed text-stone-600">{activeRequest.user_input}</p>
            </div>

            {activeRequest.ai_output != null && (
              <div className="rounded-lg border border-stone-200 bg-stone-50 p-4">
                <div className="mb-2 text-xs font-bold uppercase tracking-widest text-stone-400">AI sourcing spec</div>
                <p className="m-0 whitespace-pre-wrap text-sm leading-relaxed text-stone-600">{formatAiOutput(activeRequest.ai_output)}</p>
              </div>
            )}

            {/* QUOTES */}
            <div className="flex flex-col gap-4">
              <div className="flex items-center justify-between">
                <h3 className="m-0 text-lg font-bold text-[#1f2933]">Supplier quotes</h3>
                <span className="rounded-full bg-[#24483f]/10 px-3 py-1.5 text-xs font-bold text-[#24483f]">
                  {activeQuotes.length} {activeQuotes.length === 1 ? "quote" : "quotes"}
                </span>
              </div>
              {activeQuotes.length === 0 ? (
                <div className="rounded-xl border border-dashed border-stone-300 bg-stone-50 p-10 text-center">
                  <div className="mb-3 text-4xl">◎</div>
                  <div className="mb-2 font-bold text-stone-500">Sourcing in progress</div>
                  <p className="m-0 text-sm leading-relaxed text-stone-400">Matching your request to verified suppliers. Quotes appear here shortly.</p>
                  {isLive && <p className="m-0 mt-2 text-xs text-[#2f7d57]">This page will update automatically when quotes arrive.</p>}
                </div>
              ) : (
                activeQuotes.map((quote) => {
                  const isReleased = !!quote.is_contact_released;
                  const contactStatus = activeRequest.contact_request_status || "none";
                  const paymentStatus = activeRequest.payment_status || "unpaid";
                  const supportLink = buildWhatsappLink(`Hello Weinly, I need help with request ID: ${activeRequest.id}`);
                  const alreadyReviewed = submittedReviews.has(quote.id);
                  const existingReview = existingReviews.find((r) => r.quote_id === quote.id);

                  return (
                    <div key={quote.id} className="flex flex-col gap-4 rounded-xl border border-stone-200 bg-white p-5">
                      <div className="flex flex-wrap items-start justify-between gap-3">
                        <div>
                          <div className="mb-1 text-lg font-bold text-[#1f2933]">{quote.supplier_name || "Verified Supplier"}</div>
                          <div className="text-xs text-stone-500">{quote.supplier_region || "China"} · Verified partner</div>
                        </div>
                        <span className={`rounded-full px-3 py-1.5 text-xs font-bold ${isReleased ? "border border-emerald-200 bg-emerald-100 text-[#2f7d57]" : "border border-blue-200 bg-blue-100 text-blue-700"}`}>
                          {isReleased ? "Contact released" : "Protected"}
                        </span>
                      </div>
                      <div className="grid grid-cols-2 gap-2.5 md:grid-cols-4">
                        {[
                          { label: "Price", value: quote.price || "Pending" },
                          { label: "MOQ", value: quote.moq || "Pending" },
                          { label: "Lead time", value: quote.lead_time || "—" },
                          { label: "Region", value: quote.supplier_region || "—" },
                        ].map((s) => (
                          <div key={s.label} className="rounded-lg border border-stone-200 bg-stone-50 p-3">
                            <div className="mb-1 text-xs font-bold uppercase tracking-wider text-stone-400">{s.label}</div>
                            <div className="text-sm font-semibold text-[#1f2933]">{s.value}</div>
                          </div>
                        ))}
                      </div>
                      {quote.note && (
                        <div className="rounded-lg border border-stone-200 bg-stone-50 p-4">
                          <div className="mb-2 text-xs font-bold uppercase tracking-widest text-stone-400">Supplier note</div>
                          <p className="m-0 whitespace-pre-wrap text-sm leading-relaxed text-stone-600">{quote.note}</p>
                        </div>
                      )}
                      {!isReleased && (contactStatus === "none" || contactStatus === "pending") && (
                        <div className="rounded-xl border border-[#24483f]/20 bg-[#24483f] p-5">
                          <div className="mb-4">
                            <h4 className="m-0 text-base font-bold text-white">Weinly manages this order</h4>
                            <p className="m-0 mt-1 text-sm leading-relaxed text-[#c9e0d0]">We coordinate supplier, QC and shipping end-to-end. You pay a 4% service fee on the final order value — nothing upfront.</p>
                          </div>
                          <div className="mb-4 flex flex-col gap-2">
                            {[
                              "Weinly negotiates the best factory price",
                              "We inspect quality before shipment",
                              "You deal with Weinly, not the factory",
                              "WeChat-based supplier coordination handled for you",
                            ].map((item) => (
                              <div key={item} className="flex items-center gap-2 text-sm text-[#c9e0d0]">
                                <span className="font-bold text-[#f59e0b]">✓</span> {item}
                              </div>
                            ))}
                          </div>
                          <a
                            href={buildWhatsappLink(`Hello Weinly, I want you to manage my order for request ID: ${activeRequest.id}. My requirement: ${typeof activeRequest.user_input === "string" ? activeRequest.user_input.slice(0, 200) : ""}`)}
                            target="_blank" rel="noreferrer"
                            className="block w-full rounded-lg bg-[#f59e0b] py-3.5 text-center text-sm font-bold text-[#1a2e1a] no-underline transition-all hover:bg-[#f0950a]">
                            Start managed order →
                          </a>
                          <p className="m-0 mt-3 text-center text-xs text-[#c9e0d0]">4% service fee · paid on order completion · no upfront cost</p>
                        </div>
                      )}
                      {!isReleased && contactStatus === "approved" && (
                        <div className="rounded-lg border border-emerald-200 bg-emerald-50 p-4 text-sm leading-relaxed text-[#2f7d57]">
                          <strong>Order confirmed!</strong> Your Weinly team is coordinating with the supplier — we'll update you on WhatsApp shortly.
                        </div>
                      )}
                      {!isReleased && contactStatus === "rejected" && (
                        <div className="rounded-lg border border-red-200 bg-red-50 p-4 text-sm leading-relaxed text-red-600">Contact release was not approved. Please contact support on WhatsApp.</div>
                      )}
                      {isReleased && (
                        <>
                          <div className="rounded-xl border border-emerald-200 bg-emerald-50 p-5">
                            <div className="mb-4 flex items-center gap-3">
                              <span className="flex h-7 w-7 items-center justify-center rounded-full bg-[#2f7d57] text-sm font-black text-white">✓</span>
                              <h4 className="m-0 text-base font-bold text-[#24483f]">Supplier contact details</h4>
                            </div>
                            <div className="grid grid-cols-2 gap-2.5 md:grid-cols-4">
                              {[
                                { label: "Contact name", value: quote.contact_name || "—" },
                                { label: "Phone", value: quote.contact_phone || "—" },
                                { label: "WeChat", value: quote.contact_wechat || "—" },
                                { label: "Email", value: quote.contact_email || "—" },
                              ].map((c) => (
                                <div key={c.label} className="rounded-lg border border-emerald-200 bg-white p-3">
                                  <div className="mb-1 text-xs font-bold uppercase tracking-wider text-[#2f7d57]">{c.label}</div>
                                  <div className="break-words text-sm font-semibold text-[#24483f]">{c.value}</div>
                                </div>
                              ))}
                            </div>
                          </div>
                          {alreadyReviewed && existingReview ? (
                            <div className="rounded-xl border border-amber-200 bg-amber-50 p-5">
                              <div className="mb-3 flex items-center gap-2">
                                <span className="text-sm font-bold text-[#f59e0b]">Your review</span>
                                <StarRating value={existingReview.rating} size="sm" />
                              </div>
                              {existingReview.comment && <p className="m-0 text-sm leading-relaxed text-stone-600">{existingReview.comment}</p>}
                            </div>
                          ) : (
                            <ReviewForm request={activeRequest} quote={quote} onSubmitted={() => { setSubmittedReviews((prev) => new Set([...prev, quote.id])); syncState(activeRequest.id); }} />
                          )}
                        </>
                      )}
                    </div>
                  );
                })
              )}
            </div>

            <div className="flex flex-col items-start justify-between gap-4 rounded-xl border border-stone-200 bg-stone-50 p-5 md:flex-row md:items-center">
              <div>
                <div className="mb-1 font-bold text-[#1f2933]">Need help with this request?</div>
                <p className="m-0 text-sm text-stone-500">Our team is on WhatsApp for quotes, payment and contact release help.</p>
              </div>
              <div className="flex shrink-0 flex-wrap gap-3">
                <a href={buildWhatsappLink(`Hello Weinly, I need help with request ID: ${activeRequest.id}`)} target="_blank" rel="noreferrer"
                  className="flex items-center rounded-lg border border-emerald-200 bg-emerald-100 px-5 py-2.5 text-sm font-bold text-[#2f7d57] no-underline transition-all hover:bg-emerald-200">Chat on WhatsApp</a>
                <a href="/history" className="flex items-center rounded-lg border border-stone-200 bg-white px-5 py-2.5 text-sm font-semibold text-stone-600 no-underline transition-all hover:bg-stone-100">View history</a>
              </div>
            </div>
          </section>
        )}

        {/* ── PUBLIC REVIEWS ── */}
        {reviewsLoaded && publicReviews.length > 0 && (
          <section className="rounded-2xl border border-stone-200 bg-white p-6 md:p-10">
            <div className="mb-6 flex flex-wrap items-end justify-between gap-4">
              <div>
                <span className="mb-3 inline-block rounded-full bg-[#24483f]/10 px-3 py-1 text-xs font-bold uppercase tracking-widest text-[#24483f]">Buyer reviews</span>
                <h2 className="mb-1 text-2xl font-black tracking-tight text-[#1f2933] md:text-3xl">What buyers say about our suppliers</h2>
                <p className="m-0 text-sm text-stone-500">Real reviews from verified buyers who unlocked supplier contact through Weinly.</p>
              </div>
              {avgRating && (
                <div className="flex flex-col items-end gap-1">
                  <div className="flex items-center gap-2">
                    <span className="text-4xl font-black text-[#1f2933]">{avgRating}</span>
                    <StarRating value={Math.round(Number(avgRating))} size="lg" />
                  </div>
                  <span className="text-xs text-stone-500">{publicReviews.length} verified {publicReviews.length === 1 ? "review" : "reviews"}</span>
                </div>
              )}
            </div>
            <div className="grid grid-cols-1 gap-4 md:grid-cols-2 lg:grid-cols-3">
              {publicReviews.slice(0, 6).map((review) => (
                <div key={review.id} className="flex flex-col gap-3 rounded-xl border border-stone-200 bg-stone-50 p-5">
                  <div className="flex items-start justify-between gap-3">
                    <div>
                      <div className="mb-0.5 text-sm font-bold text-[#1f2933]">{review.supplier_name}</div>
                      <div className="text-xs text-stone-500">{review.buyer_name ? `by ${review.buyer_name}` : "Verified buyer"} · {new Date(review.created_at).toLocaleDateString()}</div>
                    </div>
                    <StarRating value={review.rating} size="sm" />
                  </div>
                  {review.comment && <p className="m-0 text-sm leading-relaxed text-stone-600">{review.comment}</p>}
                </div>
              ))}
            </div>
          </section>
        )}

        {/* ── TRUST ── */}
        <section className="rounded-2xl border border-stone-200 bg-white p-6 md:p-8">
          <div className="mb-6 flex flex-wrap items-center justify-between gap-3">
            <h2 className="m-0 text-xl font-black tracking-tight text-[#1f2933] md:text-2xl">Why buyers trust Weinly</h2>
            <a href="/pricing" className="text-sm font-semibold text-[#24483f] no-underline hover:underline">See pricing →</a>
          </div>
          <div className="grid grid-cols-1 gap-3 md:grid-cols-2 lg:grid-cols-4">
            {[
              { icon: "👁", title: "See quotes before paying", text: "Review price, MOQ and lead time before spending anything." },
              { icon: "🔒", title: "Protected supplier details", text: "Contacts are only released after payment — keeping the process serious." },
              { icon: "🇨🇳", title: "China sourcing expertise", text: "Built for buyers sourcing fabrics from China for the African market." },
              { icon: "💬", title: "WhatsApp support", text: "Real human support throughout your entire sourcing journey." },
            ].map((t) => (
              <div key={t.title} className="rounded-xl border border-stone-200 bg-stone-50 p-5">
                <div className="mb-3 text-2xl">{t.icon}</div>
                <h3 className="m-0 mb-1 text-sm font-bold text-[#1f2933]">{t.title}</h3>
                <p className="m-0 text-xs leading-relaxed text-stone-500">{t.text}</p>
              </div>
            ))}
          </div>
        </section>

        <SiteFooter />
      </div>
    </main>
  );
}
