"use client";

import { useEffect, useMemo, useState } from "react";
import { createClient } from "@/lib/supabase/client";
import { useRouter } from "next/navigation";
import SiteFooter from "@/components/SiteFooter";

type User = { id: string; email: string; name: string | null; };
type Profile = { company_name: string; contact_name: string | null; region: string | null; phone: string | null; wechat: string | null; } | null;
type FabricRequest = { id: string; created_at: string; client_name: string | null; client_email: string | null; user_input: string; ai_output: unknown; status: string | null; };
type Quote = { id: string; request_id: string; supplier_name: string; price: string | null; moq: string | null; note: string | null; lead_time: string | null; supplier_region: string | null; is_contact_released: boolean | null; };
type Review = { id: string; request_id: string; quote_id: string; buyer_name: string | null; buyer_email: string | null; rating: number; comment: string | null; created_at: string; };

type Props = { user: User; profile: Profile; requests: FabricRequest[]; myQuotes: Quote[]; };

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

function getRequestAge(createdAt: string) {
  const diffMs = Date.now() - new Date(createdAt).getTime();
  const hours = Math.floor(diffMs / (1000 * 60 * 60));
  const days = Math.floor(diffMs / (1000 * 60 * 60 * 24));
  if (hours < 1) return "Just now";
  if (hours < 24) return `${hours}h ago`;
  if (days < 7) return `${days}d ago`;
  return new Date(createdAt).toLocaleDateString();
}

function getIntentLevel(request: FabricRequest) {
  const text = request.user_input.toLowerCase();
  let score = 0;
  if (text.length > 80) score++;
  if (text.includes("qty") || text.includes("quantity") || text.includes("yards") || text.includes("packs") || text.includes("moq") || text.includes("meters")) score++;
  if (text.includes("urgent") || text.includes("asap") || text.includes("immediately") || text.includes("fast")) score++;
  if (text.includes("premium") || text.includes("high quality") || text.includes("high-end") || text.includes("export")) score++;
  if (score >= 3) return { label: "High intent", cls: "bg-emerald-900/60 text-emerald-300 border border-emerald-500/30", score };
  if (score >= 2) return { label: "Warm buyer", cls: "bg-blue-900/60 text-blue-300 border border-blue-500/30", score };
  return { label: "General inquiry", cls: "bg-slate-800/80 text-slate-300 border border-slate-600/30", score };
}

function getUrgencyLevel(createdAt: string) {
  const hours = (Date.now() - new Date(createdAt).getTime()) / (1000 * 60 * 60);
  if (hours <= 24) return { label: "Fresh lead", cls: "bg-amber-900/60 text-amber-300 border border-amber-500/30", priority: 3 };
  if (hours <= 72) return { label: "Recent", cls: "bg-indigo-900/60 text-indigo-300 border border-indigo-500/30", priority: 2 };
  return { label: "Older lead", cls: "bg-slate-800/80 text-slate-300 border border-slate-600/30", priority: 1 };
}

function getRequestPriority(request: FabricRequest) {
  return getIntentLevel(request).score * 10 + getUrgencyLevel(request.created_at).priority;
}

function getCompetitionLabel(priority: number) {
  if (priority >= 30) return { label: "Worth quoting", cls: "text-emerald-400" };
  if (priority >= 20) return { label: "Good opportunity", cls: "text-sky-400" };
  return { label: "Optional", cls: "text-slate-500" };
}

function StarDisplay({ rating, size = "sm" }: { rating: number; size?: "sm" | "lg" }) {
  const sz = size === "lg" ? "text-xl" : "text-sm";
  return (
    <div className="flex gap-0.5">
      {[1, 2, 3, 4, 5].map((star) => (
        <span key={star} className={`${sz} ${star <= rating ? "text-amber-400" : "text-slate-700"}`}>★</span>
      ))}
    </div>
  );
}

export default function SupplierDashboardClient({ user, profile, requests, myQuotes }: Props) {
  const [activeTab, setActiveTab] = useState<"requests" | "quotes" | "reviews" | "profile">("requests");
  const [loggingOut, setLoggingOut] = useState(false);
  const [search, setSearch] = useState("");
  const [quoteForm, setQuoteForm] = useState<{ requestId: string; open: boolean }>({ requestId: "", open: false });
  const [editingQuoteId, setEditingQuoteId] = useState<string | null>(null);
  const [formData, setFormData] = useState({ price: "", moq: "", lead_time: "", note: "", supplier_region: profile?.region || "" });
  const [submitting, setSubmitting] = useState(false);
  const [successMessage, setSuccessMessage] = useState<string | null>(null);
  const [editProfile, setEditProfile] = useState(false);
  const [profileForm, setProfileForm] = useState({
    company_name: profile?.company_name || "",
    contact_name: profile?.contact_name || "",
    phone: profile?.phone || "",
    wechat: profile?.wechat || "",
    region: profile?.region || "",
  });
  const [savingProfile, setSavingProfile] = useState(false);
  const [profileMsg, setProfileMsg] = useState<string | null>(null);
  const [deletingQuoteId, setDeletingQuoteId] = useState<string | null>(null);
  const [reviews, setReviews] = useState<Review[]>([]);
  const [reviewsLoading, setReviewsLoading] = useState(false);

  const router = useRouter();
  const supabase = createClient();

  const profileComplete = Boolean(
    profile?.company_name?.trim() && profile?.contact_name?.trim() &&
    profile?.phone?.trim() && profile?.wechat?.trim() && profile?.region?.trim()
  );

  useEffect(() => {
    if (!profileComplete) { setActiveTab("profile"); setEditProfile(true); }
  }, [profileComplete]);

  // Load reviews when Reviews tab is opened
  useEffect(() => {
    if (activeTab !== "reviews") return;
    setReviewsLoading(true);
    async function loadReviews() {
      try {
        // Get all quote IDs belonging to this supplier
        const quoteIds = myQuotes.map((q) => q.id);
        if (quoteIds.length === 0) { setReviews([]); return; }

        const { data } = await supabase
          .from("supplier_reviews")
          .select("*")
          .in("quote_id", quoteIds)
          .order("created_at", { ascending: false });

        setReviews((data || []) as Review[]);
      } finally {
        setReviewsLoading(false);
      }
    }
    loadReviews();
  }, [activeTab, myQuotes]);

  const quotedRequestIds = new Set(myQuotes.map((q) => q.request_id));
  const pendingRequests = requests.filter((r) => !quotedRequestIds.has(r.id));

  const filteredRequests = useMemo(() => {
    const q = search.trim().toLowerCase();
    return [...pendingRequests]
      .filter((r) => {
        if (!q) return true;
        return [r.id, r.user_input, r.client_name || "", typeof r.ai_output === "string" ? r.ai_output : ""].join(" ").toLowerCase().includes(q);
      })
      .sort((a, b) => getRequestPriority(b) - getRequestPriority(a));
  }, [pendingRequests, search]);

  const filteredQuotes = useMemo(() => {
    const q = search.trim().toLowerCase();
    return myQuotes.filter((quote) => {
      if (!q) return true;
      return [quote.request_id, quote.supplier_name, quote.price || "", quote.moq || "", quote.note || "", quote.supplier_region || ""].join(" ").toLowerCase().includes(q);
    });
  }, [myQuotes, search]);

  const closedDeals = myQuotes.filter((q) => q.is_contact_released).length;
  const winRate = myQuotes.length > 0 ? Math.round((closedDeals / myQuotes.length) * 100) : 0;

  const avgRating = reviews.length > 0
    ? (reviews.reduce((sum, r) => sum + r.rating, 0) / reviews.length).toFixed(1)
    : null;

  const ratingDistribution = [5, 4, 3, 2, 1].map((star) => ({
    star,
    count: reviews.filter((r) => r.rating === star).length,
    pct: reviews.length > 0 ? Math.round((reviews.filter((r) => r.rating === star).length / reviews.length) * 100) : 0,
  }));

  async function handleLogout() {
    setLoggingOut(true);
    await supabase.auth.signOut();
    router.push("/supplier/auth");
    router.refresh();
  }

  function resetQuoteForm() {
    setQuoteForm({ requestId: "", open: false });
    setEditingQuoteId(null);
    setFormData({ price: "", moq: "", lead_time: "", note: "", supplier_region: profile?.region || "" });
  }

  function openNewQuote(requestId: string) {
    setEditingQuoteId(null);
    setQuoteForm({ requestId, open: true });
    setFormData({ price: "", moq: "", lead_time: "", note: "", supplier_region: profile?.region || "" });
    setSuccessMessage(null);
  }

  function openEditQuote(quote: Quote) {
    setActiveTab("quotes");
    setEditingQuoteId(quote.id);
    setQuoteForm({ requestId: quote.request_id, open: true });
    setFormData({ price: quote.price || "", moq: quote.moq || "", lead_time: quote.lead_time || "", note: quote.note || "", supplier_region: quote.supplier_region || profile?.region || "" });
    setSuccessMessage(null);
  }

  async function submitQuote(e: React.FormEvent) {
    e.preventDefault();
    if (!formData.price.trim() || !formData.moq.trim()) { alert("Price and MOQ are required."); return; }
    if (!profileComplete) { setActiveTab("profile"); setEditProfile(true); alert("Please complete your supplier profile first."); return; }
    setSubmitting(true);
    setSuccessMessage(null);
    try {
      if (editingQuoteId) {
        const { error } = await supabase.from("quotes").update({
          price: formData.price.trim(),
          moq: formData.moq.trim(),
          lead_time: formData.lead_time.trim() || null,
          note: formData.note.trim() || null,
          supplier_region: formData.supplier_region.trim() || null,
        }).eq("id", editingQuoteId);
        if (error) throw error;
        setSuccessMessage("Quote updated successfully.");
      } else {
        const { error } = await supabase.from("quotes").insert([{
          request_id: quoteForm.requestId,
          supplier_user_id: user.id,
          supplier_name: profile?.company_name || user.name || "Supplier",
          price: formData.price.trim(),
          moq: formData.moq.trim(),
          lead_time: formData.lead_time.trim() || null,
          note: formData.note.trim() || null,
          supplier_region: formData.supplier_region.trim() || null,
          is_contact_released: false,
        }]);
        if (error) throw error;

        try {
          const { data: requestData } = await supabase.from("fabric_requests").select("client_email, client_name, id").eq("id", quoteForm.requestId).single();
          if (requestData?.client_email) {
            await fetch("/api/email/notify-quotes", { method: "POST", headers: { "Content-Type": "application/json" }, body: JSON.stringify({ buyerEmail: requestData.client_email, buyerName: requestData.client_name, requestId: requestData.id, quoteCount: 1 }) });
          }
        } catch (e) { console.error("Quote email notification failed:", e); }

        await supabase.from("fabric_requests").update({ status: "quoted" }).eq("id", quoteForm.requestId);
        setSuccessMessage("Quote submitted and buyer notified successfully.");
      }
      resetQuoteForm();
      router.refresh();
    } catch (err: any) {
      alert(err.message || "Failed to submit quote.");
    } finally {
      setSubmitting(false);
    }
  }

  async function deleteQuote(quoteId: string) {
    if (!window.confirm("Delete this quote?")) return;
    setDeletingQuoteId(quoteId);
    try {
      const { error } = await supabase.from("quotes").delete().eq("id", quoteId);
      if (error) throw error;
      if (editingQuoteId === quoteId) resetQuoteForm();
      setSuccessMessage("Quote deleted successfully.");
      router.refresh();
    } catch (err: any) {
      alert(err.message || "Failed to delete quote.");
    } finally {
      setDeletingQuoteId(null);
    }
  }

  async function saveProfile(e: React.FormEvent) {
    e.preventDefault();
    setSavingProfile(true);
    setProfileMsg(null);
    try {
      const { error } = await supabase.from("supplier_profiles").update({
        company_name: profileForm.company_name.trim(),
        contact_name: profileForm.contact_name.trim() || null,
        phone: profileForm.phone.trim() || null,
        wechat: profileForm.wechat.trim() || null,
        region: profileForm.region.trim() || null,
      }).eq("user_id", user.id);
      if (error) throw error;
      setProfileMsg("Profile updated successfully.");
      setEditProfile(false);
      router.refresh();
    } catch (err: any) {
      setProfileMsg(err.message || "Failed to update profile.");
    } finally {
      setSavingProfile(false);
    }
  }

  const stats = [
    { value: String(filteredRequests.length), label: "Open requests", color: "text-amber-400" },
    { value: String(myQuotes.length), label: "Quotes sent", color: "text-sky-400" },
    { value: String(closedDeals), label: "Deals closed", color: "text-emerald-400" },
    { value: `${winRate}%`, label: "Win rate", color: "text-violet-400" },
    ...(avgRating ? [{ value: `${avgRating}★`, label: "Avg rating", color: "text-amber-300" }] : []),
  ];

  const quoteFormFields = [
    { label: "Price per yard/piece *", key: "price", placeholder: "e.g. $2.50/yard" },
    { label: "Minimum order qty *", key: "moq", placeholder: "e.g. 500 yards" },
    { label: "Lead time", key: "lead_time", placeholder: "e.g. 15-20 days" },
    { label: "Your region", key: "supplier_region", placeholder: "e.g. Guangzhou, China" },
  ];

  const profileFields = [
    { label: "Company name", key: "company_name", placeholder: "Your company name" },
    { label: "Contact name", key: "contact_name", placeholder: "Your name" },
    { label: "Phone / WhatsApp", key: "phone", placeholder: "+86 138 0000 0000" },
    { label: "WeChat ID", key: "wechat", placeholder: "WeChat username" },
    { label: "Region / city", key: "region", placeholder: "e.g. Guangzhou, China" },
  ];

  return (
    <main className="min-h-screen bg-[#0a0f1e] px-3 py-3 font-sans md:px-4 md:py-4">
      <div className="mx-auto flex max-w-5xl flex-col gap-3">

        {/* Nav */}
        <nav className="flex items-center justify-between gap-4 rounded-2xl border border-white/8 bg-[#0d1424] px-4 py-3">
          <a href="/" className="flex shrink-0 items-center gap-2 no-underline">
            <span className="flex h-9 w-9 items-center justify-center rounded-full bg-gradient-to-br from-amber-500 to-amber-700 text-sm font-black text-white shadow-lg shadow-amber-500/30">W</span>
            <span className="text-xl font-black tracking-tight text-white">Weinly</span>
          </a>
          <div className="flex items-center gap-3">
            <span className="hidden text-sm text-slate-500 md:block">{user.email}</span>
            <button onClick={handleLogout} disabled={loggingOut}
              className="cursor-pointer rounded-xl border border-white/10 bg-white/6 px-4 py-2 text-sm font-semibold text-slate-400 transition-all hover:bg-white/10 disabled:opacity-60">
              {loggingOut ? "..." : "Log out"}
            </button>
          </div>
        </nav>

        {/* Header */}
        <section className="relative overflow-hidden rounded-3xl border border-amber-500/15 bg-gradient-to-br from-[#1a0f00] via-[#1a1200] to-[#0f0a00] p-6 shadow-2xl shadow-amber-500/8 md:p-8">
          <div className="pointer-events-none absolute right-0 top-0 h-64 w-64 translate-x-1/2 -translate-y-1/2 rounded-full bg-amber-500/8 blur-3xl" />
          <div className="relative z-10 flex flex-col items-start justify-between gap-4 md:flex-row md:items-center">
            <div>
              <div className="mb-3 inline-flex items-center gap-2 rounded-full border border-amber-500/25 bg-amber-500/10 px-4 py-1.5">
                <span className="h-2 w-2 rounded-full bg-amber-400" />
                <span className="text-xs font-semibold text-amber-300">Supplier portal</span>
              </div>
              <h1 className="mb-1 text-2xl font-black tracking-tight text-white md:text-3xl">
                {profile?.company_name || user.name || "Supplier dashboard"}
              </h1>
              <p className="m-0 text-sm text-slate-400">{profile?.region || user.email}</p>
              {!profileComplete && (
                <div className="mt-3 inline-flex items-center gap-2 rounded-full border border-red-500/20 bg-red-500/10 px-3 py-1">
                  <span className="text-xs font-bold text-red-300">Complete your profile to receive buyer contact releases</span>
                </div>
              )}
            </div>
            <div className="grid grid-cols-2 gap-3 md:grid-cols-5">
              {stats.map((s) => (
                <div key={s.label} className="rounded-2xl border border-white/8 bg-white/5 p-3 text-center">
                  <div className={`text-2xl font-black ${s.color}`}>{s.value}</div>
                  <div className="mt-0.5 text-xs text-slate-600">{s.label}</div>
                </div>
              ))}
            </div>
          </div>
        </section>

        {successMessage && (
          <div className="rounded-2xl border border-emerald-500/20 bg-emerald-500/8 p-4 text-sm text-emerald-300">{successMessage}</div>
        )}

        <section className="rounded-3xl border border-white/7 bg-[#111827] p-4 md:p-6">
          <div className="mb-4 flex flex-col gap-3 md:flex-row md:items-center md:justify-between">
            <div className="flex gap-1.5 rounded-2xl border border-white/7 bg-white/4 p-1.5 overflow-x-auto">
              {(["requests", "quotes", "reviews", "profile"] as const).map((tab) => (
                <button key={tab} onClick={() => setActiveTab(tab)}
                  className={`shrink-0 cursor-pointer rounded-xl px-3 py-2.5 text-xs font-bold transition-all md:text-sm ${activeTab === tab ? "bg-gradient-to-r from-amber-500 to-amber-700 text-white shadow-lg shadow-amber-500/25" : "bg-transparent text-slate-500 hover:text-slate-300"}`}>
                  {tab === "requests" ? `Open requests (${filteredRequests.length})`
                    : tab === "quotes" ? `My quotes (${myQuotes.length})`
                    : tab === "reviews" ? `Reviews (${reviews.length})`
                    : "Profile"}
                </button>
              ))}
            </div>
            <input value={search} onChange={(e) => setSearch(e.target.value)} placeholder="Search requests or quotes"
              className="w-full rounded-xl border border-white/10 bg-white/5 px-4 py-3 text-sm text-white outline-none transition-all placeholder:text-slate-600 focus:border-amber-500 md:max-w-sm" />
          </div>

          {/* REQUESTS TAB */}
          {activeTab === "requests" && (
            <div className="flex flex-col gap-4">
              <div>
                <h2 className="mb-1 text-xl font-black tracking-tight text-white">Open buyer requests</h2>
                <p className="m-0 text-sm text-slate-500">These are buyers actively looking for fabric suppliers. Higher intent requests appear first.</p>
              </div>
              <div className="rounded-2xl border border-indigo-500/20 bg-indigo-500/6 p-4 text-xs leading-relaxed text-indigo-300">
                Tip: Fast response, clear MOQ, and competitive pricing improve your win rate.
              </div>
              {filteredRequests.length === 0 ? (
                <div className="rounded-2xl border border-dashed border-white/10 bg-white/2 p-10 text-center">
                  <div className="mb-3 text-4xl">◎</div>
                  <div className="mb-2 font-bold text-slate-400">No new requests right now</div>
                  <p className="m-0 text-sm text-slate-600">New buyer requests will appear here. Check back soon.</p>
                </div>
              ) : (
                filteredRequests.map((request) => {
                  const intent = getIntentLevel(request);
                  const urgency = getUrgencyLevel(request.created_at);
                  const competition = getCompetitionLabel(getRequestPriority(request));
                  return (
                    <div key={request.id} className="flex flex-col gap-4 rounded-2xl border border-white/7 bg-white/3 p-5">
                      <div className="flex flex-wrap items-start justify-between gap-3">
                        <div>
                          <div className="mb-1 text-xs font-bold uppercase tracking-widest text-slate-500">Request ID</div>
                          <div className="mb-2 font-mono text-xs text-slate-400">{request.id}</div>
                          <div className="text-xs text-slate-500">{getRequestAge(request.created_at)}</div>
                        </div>
                        <div className="flex flex-wrap gap-2">
                          <span className={`rounded-full px-3 py-1.5 text-xs font-bold ${intent.cls}`}>{intent.label}</span>
                          <span className={`rounded-full px-3 py-1.5 text-xs font-bold ${urgency.cls}`}>{urgency.label}</span>
                        </div>
                      </div>
                      <div className="flex flex-wrap items-center gap-3 text-xs">
                        <span className={`font-semibold ${competition.cls}`}>{competition.label}</span>
                        <span className="text-slate-600">Buyer active</span>
                      </div>
                      <div className="rounded-xl border border-white/7 bg-white/4 p-4">
                        <div className="mb-2 text-xs font-bold uppercase tracking-widest text-slate-500">Buyer request</div>
                        <p className="m-0 text-sm leading-relaxed text-slate-300">{request.user_input}</p>
                      </div>
                      {request.ai_output != null && (
                        <div className="rounded-xl border border-white/7 bg-white/4 p-4">
                          <div className="mb-2 text-xs font-bold uppercase tracking-widest text-slate-500">AI sourcing spec</div>
                          <p className="m-0 whitespace-pre-wrap text-sm leading-relaxed text-slate-400">{formatAiOutput(request.ai_output)}</p>
                        </div>
                      )}
                      {quoteForm.open && quoteForm.requestId === request.id ? (
                        <form onSubmit={submitQuote} className="flex flex-col gap-4 rounded-2xl border border-amber-500/20 bg-amber-500/6 p-5">
                          <h4 className="m-0 text-base font-bold text-white">Submit your quote</h4>
                          <div className="grid grid-cols-1 gap-3 md:grid-cols-2">
                            {quoteFormFields.map((field) => (
                              <div key={field.key} className="flex flex-col gap-1.5">
                                <label className="text-xs font-bold uppercase tracking-wider text-slate-400">{field.label}</label>
                                <input value={formData[field.key as keyof typeof formData]} onChange={(e) => setFormData({ ...formData, [field.key]: e.target.value })} placeholder={field.placeholder}
                                  className="w-full rounded-xl border border-white/10 bg-white/5 px-4 py-3 text-sm text-white outline-none transition-all placeholder:text-slate-600 focus:border-amber-500" />
                              </div>
                            ))}
                          </div>
                          <div className="flex flex-col gap-1.5">
                            <label className="text-xs font-bold uppercase tracking-wider text-slate-400">Additional note</label>
                            <textarea value={formData.note} onChange={(e) => setFormData({ ...formData, note: e.target.value })} placeholder="Any additional details about your product, certifications, samples, etc." rows={3}
                              className="w-full resize-none rounded-xl border border-white/10 bg-white/5 px-4 py-3 text-sm text-white outline-none transition-all placeholder:text-slate-600 focus:border-amber-500" />
                          </div>
                          <div className="flex flex-wrap gap-3">
                            <button type="submit" disabled={submitting}
                              className="cursor-pointer rounded-xl border-0 bg-gradient-to-r from-amber-500 to-amber-700 px-6 py-3 text-sm font-bold text-white shadow-lg shadow-amber-500/25 disabled:opacity-60">
                              {submitting ? "Submitting..." : "Submit quote & notify buyer →"}
                            </button>
                            <button type="button" onClick={resetQuoteForm}
                              className="cursor-pointer rounded-xl border border-white/10 bg-white/6 px-6 py-3 text-sm font-semibold text-slate-400 transition-all hover:bg-white/10">
                              Cancel
                            </button>
                          </div>
                        </form>
                      ) : (
                        <button onClick={() => openNewQuote(request.id)}
                          className="cursor-pointer self-start rounded-xl border-0 bg-gradient-to-r from-amber-500 to-amber-700 px-6 py-3 text-sm font-bold text-white shadow-lg shadow-amber-500/20">
                          Submit a quote →
                        </button>
                      )}
                    </div>
                  );
                })
              )}
            </div>
          )}

          {/* QUOTES TAB */}
          {activeTab === "quotes" && (
            <div className="flex flex-col gap-4">
              <div>
                <h2 className="mb-1 text-xl font-black tracking-tight text-white">My submitted quotes</h2>
                <p className="m-0 text-sm text-slate-500">Track your quotes, update them, or remove them if needed.</p>
              </div>
              {filteredQuotes.length === 0 ? (
                <div className="rounded-2xl border border-dashed border-white/10 bg-white/2 p-10 text-center">
                  <div className="mb-3 text-4xl">◎</div>
                  <div className="mb-2 font-bold text-slate-400">No quotes yet</div>
                  <p className="m-0 text-sm text-slate-600">Go to open requests and submit your first quote.</p>
                </div>
              ) : (
                filteredQuotes.map((quote) => (
                  <div key={quote.id} className="flex flex-col gap-3 rounded-2xl border border-white/7 bg-white/3 p-5">
                    <div className="flex flex-wrap items-start justify-between gap-3">
                      <div>
                        <div className="mb-1 text-xs font-bold uppercase tracking-widest text-slate-500">Request ID</div>
                        <div className="font-mono text-xs text-slate-400">{quote.request_id}</div>
                      </div>
                      <span className={`rounded-full px-3 py-1.5 text-xs font-bold ${quote.is_contact_released ? "border border-emerald-500/30 bg-emerald-900/60 text-emerald-300" : "border border-blue-500/30 bg-blue-900/60 text-blue-300"}`}>
                        {quote.is_contact_released ? "Deal closed ✓" : "Awaiting buyer"}
                      </span>
                    </div>
                    <div className="grid grid-cols-2 gap-2.5 md:grid-cols-4">
                      {[
                        { label: "Price", value: quote.price || "—" },
                        { label: "MOQ", value: quote.moq || "—" },
                        { label: "Lead time", value: quote.lead_time || "—" },
                        { label: "Region", value: quote.supplier_region || "—" },
                      ].map((s) => (
                        <div key={s.label} className="rounded-xl border border-white/7 bg-white/4 p-3">
                          <div className="mb-1 text-xs font-bold uppercase tracking-wider text-slate-600">{s.label}</div>
                          <div className="text-sm font-semibold text-white">{s.value}</div>
                        </div>
                      ))}
                    </div>
                    {quote.note && (
                      <div className="rounded-xl border border-white/7 bg-white/4 p-3">
                        <div className="mb-1.5 text-xs font-bold uppercase tracking-widest text-slate-500">Your note</div>
                        <p className="m-0 text-sm leading-relaxed text-slate-400">{quote.note}</p>
                      </div>
                    )}
                    {quote.is_contact_released && (
                      <div className="rounded-xl border border-emerald-500/20 bg-emerald-500/6 p-3 text-sm leading-relaxed text-emerald-300">
                        <strong>Buyer has unlocked your contact.</strong> They may reach out directly via the contact details on your profile.
                      </div>
                    )}
                    <div className="flex flex-wrap gap-3 pt-1">
                      <button onClick={() => openEditQuote(quote)}
                        className="cursor-pointer rounded-xl border border-amber-500/20 bg-amber-500/10 px-4 py-2.5 text-sm font-bold text-amber-400 transition-all hover:bg-amber-500/15">
                        Edit quote
                      </button>
                      <button onClick={() => deleteQuote(quote.id)} disabled={deletingQuoteId === quote.id}
                        className="cursor-pointer rounded-xl border border-red-500/20 bg-red-500/8 px-4 py-2.5 text-sm font-bold text-red-400 transition-all hover:bg-red-500/12 disabled:opacity-60">
                        {deletingQuoteId === quote.id ? "Deleting..." : "Delete quote"}
                      </button>
                    </div>
                  </div>
                ))
              )}
              {quoteForm.open && editingQuoteId && (
                <form onSubmit={submitQuote} className="flex flex-col gap-4 rounded-2xl border border-amber-500/20 bg-amber-500/6 p-5">
                  <h4 className="m-0 text-base font-bold text-white">Edit quote</h4>
                  <div className="grid grid-cols-1 gap-3 md:grid-cols-2">
                    {quoteFormFields.map((field) => (
                      <div key={field.key} className="flex flex-col gap-1.5">
                        <label className="text-xs font-bold uppercase tracking-wider text-slate-400">{field.label}</label>
                        <input value={formData[field.key as keyof typeof formData]} onChange={(e) => setFormData({ ...formData, [field.key]: e.target.value })} placeholder={field.placeholder}
                          className="w-full rounded-xl border border-white/10 bg-white/5 px-4 py-3 text-sm text-white outline-none transition-all placeholder:text-slate-600 focus:border-amber-500" />
                      </div>
                    ))}
                  </div>
                  <div className="flex flex-col gap-1.5">
                    <label className="text-xs font-bold uppercase tracking-wider text-slate-400">Additional note</label>
                    <textarea value={formData.note} onChange={(e) => setFormData({ ...formData, note: e.target.value })} placeholder="Any additional details..." rows={3}
                      className="w-full resize-none rounded-xl border border-white/10 bg-white/5 px-4 py-3 text-sm text-white outline-none transition-all placeholder:text-slate-600 focus:border-amber-500" />
                  </div>
                  <div className="flex flex-wrap gap-3">
                    <button type="submit" disabled={submitting}
                      className="cursor-pointer rounded-xl border-0 bg-gradient-to-r from-amber-500 to-amber-700 px-6 py-3 text-sm font-bold text-white shadow-lg shadow-amber-500/25 disabled:opacity-60">
                      {submitting ? "Updating..." : "Update quote →"}
                    </button>
                    <button type="button" onClick={resetQuoteForm}
                      className="cursor-pointer rounded-xl border border-white/10 bg-white/6 px-6 py-3 text-sm font-semibold text-slate-400 transition-all hover:bg-white/10">Cancel</button>
                  </div>
                </form>
              )}
            </div>
          )}

          {/* REVIEWS TAB */}
          {activeTab === "reviews" && (
            <div className="flex flex-col gap-4">
              <div>
                <h2 className="mb-1 text-xl font-black tracking-tight text-white">Your reviews</h2>
                <p className="m-0 text-sm text-slate-500">Reviews left by buyers after unlocking your contact details.</p>
              </div>

              {reviewsLoading ? (
                <div className="rounded-2xl border border-white/7 bg-white/3 p-10 text-center text-sm text-slate-500">Loading reviews...</div>
              ) : reviews.length === 0 ? (
                <div className="rounded-2xl border border-dashed border-white/10 bg-white/2 p-10 text-center">
                  <div className="mb-3 text-4xl">★</div>
                  <div className="mb-2 font-bold text-slate-400">No reviews yet</div>
                  <p className="m-0 text-sm text-slate-600">Reviews appear here after buyers unlock your contact and leave feedback.</p>
                </div>
              ) : (
                <>
                  {/* Rating summary */}
                  <div className="rounded-2xl border border-amber-500/20 bg-amber-500/6 p-5">
                    <div className="flex flex-wrap items-center justify-between gap-6">
                      <div className="flex flex-col items-center gap-1">
                        <div className="text-5xl font-black text-white">{avgRating}</div>
                        <StarDisplay rating={Math.round(Number(avgRating))} size="lg" />
                        <div className="text-xs text-slate-500">{reviews.length} {reviews.length === 1 ? "review" : "reviews"}</div>
                      </div>
                      <div className="flex flex-1 flex-col gap-2 min-w-[160px]">
                        {ratingDistribution.map(({ star, count, pct }) => (
                          <div key={star} className="flex items-center gap-2">
                            <span className="w-4 text-xs text-slate-500">{star}★</span>
                            <div className="flex-1 rounded-full bg-white/10 h-2 overflow-hidden">
                              <div className="h-full rounded-full bg-amber-400 transition-all" style={{ width: `${pct}%` }} />
                            </div>
                            <span className="w-6 text-right text-xs text-slate-500">{count}</span>
                          </div>
                        ))}
                      </div>
                    </div>
                  </div>

                  {/* Individual reviews */}
                  <div className="flex flex-col gap-3">
                    {reviews.map((review) => (
                      <div key={review.id} className="flex flex-col gap-3 rounded-2xl border border-white/7 bg-white/3 p-5">
                        <div className="flex flex-wrap items-start justify-between gap-3">
                          <div>
                            <div className="mb-0.5 text-sm font-bold text-white">
                              {review.buyer_name || "Verified buyer"}
                            </div>
                            <div className="text-xs text-slate-500">
                              {new Date(review.created_at).toLocaleDateString()} · Request {review.request_id.slice(0, 8)}...
                            </div>
                          </div>
                          <StarDisplay rating={review.rating} size="sm" />
                        </div>
                        {review.comment && (
                          <p className="m-0 text-sm leading-relaxed text-slate-400">{review.comment}</p>
                        )}
                      </div>
                    ))}
                  </div>
                </>
              )}
            </div>
          )}

          {/* PROFILE TAB */}
          {activeTab === "profile" && (
            <div className="flex flex-col gap-4">
              <div className="flex flex-wrap items-center justify-between gap-3">
                <div>
                  <h2 className="mb-1 text-xl font-black tracking-tight text-white">Supplier profile</h2>
                  <p className="m-0 text-sm text-slate-500">This information is shown to buyers when your contact is released.</p>
                </div>
                <button onClick={() => setEditProfile(!editProfile)}
                  className="cursor-pointer rounded-xl border border-amber-500/20 bg-amber-500/10 px-5 py-2.5 text-sm font-bold text-amber-400 transition-all hover:bg-amber-500/15">
                  {editProfile ? "Cancel" : "Edit profile"}
                </button>
              </div>
              {profileMsg && (
                <div className="rounded-xl border border-emerald-500/20 bg-emerald-500/8 p-4 text-sm text-emerald-300">{profileMsg}</div>
              )}
              {!profileComplete && (
                <div className="rounded-2xl border border-red-500/20 bg-red-500/8 p-4 text-sm text-red-300">
                  Complete your profile fully. Buyers will only trust and contact suppliers with complete details.
                </div>
              )}
              {editProfile ? (
                <form onSubmit={saveProfile} className="flex flex-col gap-4">
                  <div className="grid grid-cols-1 gap-3 md:grid-cols-2">
                    {profileFields.map((field) => (
                      <div key={field.key} className="flex flex-col gap-1.5">
                        <label className="text-xs font-bold uppercase tracking-wider text-slate-400">{field.label}</label>
                        <input value={profileForm[field.key as keyof typeof profileForm]} onChange={(e) => setProfileForm({ ...profileForm, [field.key]: e.target.value })} placeholder={field.placeholder}
                          className="w-full rounded-xl border border-white/10 bg-white/5 px-4 py-3 text-sm text-white outline-none transition-all placeholder:text-slate-600 focus:border-amber-500" />
                      </div>
                    ))}
                  </div>
                  <button type="submit" disabled={savingProfile}
                    className="self-start rounded-xl border-0 bg-gradient-to-r from-amber-500 to-amber-700 px-6 py-3 text-sm font-bold text-white shadow-lg shadow-amber-500/25 disabled:opacity-60">
                    {savingProfile ? "Saving..." : "Save profile →"}
                  </button>
                </form>
              ) : (
                <div className="grid grid-cols-1 gap-3 md:grid-cols-2">
                  {[
                    { label: "Company name", value: profile?.company_name || "—" },
                    { label: "Contact name", value: profile?.contact_name || "Not set" },
                    { label: "Phone / WhatsApp", value: profile?.phone || "Not set" },
                    { label: "WeChat ID", value: profile?.wechat || "Not set" },
                    { label: "Region", value: profile?.region || "Not set" },
                    { label: "Email", value: user.email },
                  ].map((info) => (
                    <div key={info.label} className="rounded-xl border border-white/7 bg-white/4 p-4">
                      <div className="mb-1 text-xs font-bold uppercase tracking-widest text-slate-500">{info.label}</div>
                      <div className="break-words text-sm font-semibold text-white">{info.value}</div>
                    </div>
                  ))}
                </div>
              )}
              <div className="mt-2 rounded-2xl border border-amber-500/20 bg-amber-500/6 p-5">
                <h3 className="m-0 mb-2 text-sm font-bold text-amber-300">Important — keep your contact details updated</h3>
                <p className="m-0 text-xs leading-relaxed text-slate-500">
                  When a buyer unlocks your contact, Weinly releases your phone number, WeChat and email directly to them. Make sure these are always accurate so buyers can reach you.
                </p>
              </div>
            </div>
          )}
        </section>

        <SiteFooter />
      </div>
    </main>
  );
}
