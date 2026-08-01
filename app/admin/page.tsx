"use client";

import { useEffect, useMemo, useState } from "react";
import { createClient } from "@supabase/supabase-js";
import { getCategoryColor, getCategoryLabel } from "@/lib/categories";

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL!;
const supabaseAnonKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!;
const supabase = createClient(supabaseUrl, supabaseAnonKey);

type FabricRequest = {
  id: string; created_at: string; client_name: string | null; client_email: string | null;
  client_phone: string | null; user_input: string; ai_output: unknown; status: string | null;
  internal_note: string | null; buyer_requested_contact: boolean | null;
  contact_request_status: string | null; contact_access_fee: string | null;
  payment_status: string | null; payment_reference: string | null; paid_at: string | null;
  category: string | null; subcategory: string | null;
};

type Quote = {
  id: string; request_id: string; supplier_name: string; price: string | null; moq: string | null;
  note: string | null; contact_name: string | null; contact_phone: string | null;
  contact_wechat: string | null; contact_email: string | null; supplier_region: string | null;
  lead_time: string | null; is_contact_released: boolean | null;
};

type SupplierProfile = {
  id: string; user_id: string; company_name: string; contact_name: string | null;
  email: string | null; phone: string | null; wechat: string | null; region: string | null;
  is_active: boolean | null; is_verified: boolean | null; verified_at: string | null;
  bio: string | null; categories: string[] | null; created_at: string;
};

type SupplierInvite = {
  id: string; code: string; email: string | null; used: boolean; used_at: string | null; created_at: string;
};

type SupplierApplication = {
  id: string; company_name: string; contact_name: string; email: string; phone: string;
  wechat: string | null; region: string; categories: string[] | null; years_in_business: string | null;
  website: string | null; status: string; created_at: string;
};

type SupplierReview = {
  id: string; request_id: string; supplier_id: string; quote_id: string;
  buyer_name: string | null; buyer_email: string | null; rating: number;
  comment: string | null; created_at: string;
};

type ReadyStockItem = {
  id: string; supplier_id: string; name: string; description: string | null;
  category: string; subcategory: string | null; price_per_unit: string; unit: string;
  moq: string; available_quantity: string | null; is_active: boolean | null; is_sold_out: boolean | null;
  created_at: string;
};

type NewQuoteForm = {
  supplier_name: string; price: string; moq: string; note: string; contact_name: string;
  contact_phone: string; contact_wechat: string; contact_email: string; supplier_region: string; lead_time: string;
};

const emptyQuoteForm: NewQuoteForm = {
  supplier_name: "", price: "", moq: "", note: "", contact_name: "",
  contact_phone: "", contact_wechat: "", contact_email: "", supplier_region: "", lead_time: "",
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

function getStagePill(request: FabricRequest, quoteCount: number) {
  if (request.contact_request_status === "approved") return { cls: "bg-emerald-100 text-[#2f7d57] border border-emerald-200", label: "Contact released" };
  if (request.payment_status === "paid" && request.contact_request_status === "pending") return { cls: "bg-violet-100 text-violet-700 border border-violet-200", label: "Paid — needs approval" };
  if (request.payment_status === "paid") return { cls: "bg-violet-100 text-violet-700 border border-violet-200", label: "Paid" };
  if (quoteCount > 0) return { cls: "bg-blue-100 text-blue-700 border border-blue-200", label: "Quotes ready" };
  return { cls: "bg-amber-100 text-amber-700 border border-amber-200", label: "In progress" };
}

function CategoryBadge({ categoryId, subcategory }: { categoryId: string; subcategory?: string | null }) {
  const color = getCategoryColor(categoryId);
  return (
    <span className={`inline-flex items-center rounded-full border px-2.5 py-1 text-xs font-semibold ${color.bg} ${color.text} ${color.border}`}>
      {getCategoryLabel(categoryId)}{subcategory ? ` · ${subcategory}` : ""}
    </span>
  );
}

function StarDisplay({ rating }: { rating: number }) {
  return <span className="text-amber-500">{"★".repeat(rating)}<span className="text-stone-300">{"★".repeat(5 - rating)}</span></span>;
}

async function sendPushNotification(requestId: string, title: string, message: string) {
  try {
    const token = sessionStorage.getItem("weinly_admin_token") || "";
    await fetch("/api/push/notify-buyer", {
      method: "POST",
      headers: { "Content-Type": "application/json", "X-Admin-Password": token },
      body: JSON.stringify({ requestId, title, message }),
    });
  } catch (e) { console.error("Push notification failed:", e); }
}

export default function AdminPage() {
  const [authenticated, setAuthenticated] = useState(false);
  const [password, setPassword] = useState("");
  const [showPassword, setShowPassword] = useState(false);
  const [loading, setLoading] = useState(true);
  const [activeTab, setActiveTab] = useState<"requests" | "suppliers" | "invites" | "reviews" | "stock" | "applications">("requests");

  const [requests, setRequests] = useState<FabricRequest[]>([]);
  const [quotesMap, setQuotesMap] = useState<Record<string, Quote[]>>({});
  const [suppliers, setSuppliers] = useState<SupplierProfile[]>([]);
  const [invites, setInvites] = useState<SupplierInvite[]>([]);
  const [applications, setApplications] = useState<SupplierApplication[]>([]);
  const [reviews, setReviews] = useState<SupplierReview[]>([]);
  const [readyStock, setReadyStock] = useState<ReadyStockItem[]>([]);
  const [search, setSearch] = useState("");
  const [categoryFilter, setCategoryFilter] = useState("all");
  const [newQuotes, setNewQuotes] = useState<Record<string, NewQuoteForm>>({});
  const [expandedId, setExpandedId] = useState<string | null>(null);
  const [expandedSupplierId, setExpandedSupplierId] = useState<string | null>(null);
  const [newInviteCode, setNewInviteCode] = useState("");
  const [newInviteEmail, setNewInviteEmail] = useState("");
  const [creatingInvite, setCreatingInvite] = useState(false);
  const [loginError, setLoginError] = useState("");

  useEffect(() => {
    const stored = localStorage.getItem("weinly_admin_auth");
    if (stored === "true") { setAuthenticated(true); fetchAll(); }
    else setLoading(false);
  }, []);

  async function fetchAll() {
    setLoading(true);
    try {
      const [reqRes, quotesRes, suppliersRes, invitesRes, reviewsRes, stockRes, appsRes] = await Promise.all([
        supabase.from("fabric_requests").select("*").order("created_at", { ascending: false }),
        supabase.from("quotes").select("*").order("id", { ascending: false }),
        supabase.from("supplier_profiles").select("*").order("created_at", { ascending: false }),
        supabase.from("supplier_invites").select("*").order("created_at", { ascending: false }),
        supabase.from("supplier_reviews").select("*").order("created_at", { ascending: false }),
        supabase.from("ready_stock").select("*").order("created_at", { ascending: false }),
        supabase.from("supplier_applications").select("*").order("created_at", { ascending: false }),
      ]);
      setRequests((reqRes.data || []) as FabricRequest[]);
      const grouped: Record<string, Quote[]> = {};
      (quotesRes.data || []).forEach((q) => {
        const quote = q as Quote;
        if (!grouped[quote.request_id]) grouped[quote.request_id] = [];
        grouped[quote.request_id].push(quote);
      });
      setQuotesMap(grouped);
      setSuppliers((suppliersRes.data || []) as SupplierProfile[]);
      setInvites((invitesRes.data || []) as SupplierInvite[]);
      setReviews((reviewsRes.data || []) as SupplierReview[]);
      setReadyStock((stockRes.data || []) as ReadyStockItem[]);
      setApplications((appsRes.data || []) as SupplierApplication[]);
    } catch { alert("Failed to load admin data."); }
    finally { setLoading(false); }
  }

  async function handleLogin() {
    try {
      const res = await fetch("/api/admin/verify", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ password }),
      });
      if (res.ok) {
        setAuthenticated(true);
        localStorage.setItem("weinly_admin_auth", "true");
        sessionStorage.setItem("weinly_admin_token", password);
        fetchAll();
      } else {
        const data = await res.json();
        setLoginError(data.error || "Wrong password.");
      }
    } catch { setLoginError("Failed to verify. Please try again."); }
  }

  async function handleLogout() {
    await fetch("/api/admin/logout", { method: "POST" });
    localStorage.removeItem("weinly_admin_auth");
    sessionStorage.removeItem("weinly_admin_token");
    setAuthenticated(false);
  }

  function updateNewQuoteField(requestId: string, field: keyof NewQuoteForm, value: string) {
    setNewQuotes((prev) => ({
      ...prev,
      [requestId]: { ...(prev[requestId] || { ...emptyQuoteForm }), [field]: value },
    }));
  }

  async function addQuote(requestId: string) {
    const form = newQuotes[requestId];
    if (!form?.supplier_name?.trim()) { alert("Supplier name is required."); return; }
    try {
      const { error } = await supabase.from("quotes").insert([{
        request_id: requestId, supplier_name: form.supplier_name.trim(),
        price: form.price || null, moq: form.moq || null, note: form.note || null,
        contact_name: form.contact_name || null, contact_phone: form.contact_phone || null,
        contact_wechat: form.contact_wechat || null, contact_email: form.contact_email || null,
        supplier_region: form.supplier_region || null, lead_time: form.lead_time || null,
        is_contact_released: false,
      }]);
      if (error) throw error;
      await supabase.from("fabric_requests").update({ status: "quoted" }).eq("id", requestId);
      try {
        const request = requests.find((r) => r.id === requestId);
        if (request?.client_email) {
          await fetch("/api/email/notify-quotes", {
            method: "POST", headers: { "Content-Type": "application/json" },
            body: JSON.stringify({ buyerEmail: request.client_email, buyerName: request.client_name, requestId, quoteCount: (quotesMap[requestId]?.length || 0) + 1 }),
          });
          await sendPushNotification(requestId, "Your quotes are ready 🎉", "A verified supplier has responded to your fabric request. Tap to review.");
        }
      } catch (e) { console.error("Notification failed:", e); }
      setNewQuotes((prev) => ({ ...prev, [requestId]: { ...emptyQuoteForm } }));
      await fetchAll();
      alert("Quote added and buyer notified.");
    } catch { alert("Failed to add quote."); }
  }

  async function updateRequestStatus(requestId: string, status: string) {
    try { await supabase.from("fabric_requests").update({ status }).eq("id", requestId); await fetchAll(); }
    catch { alert("Failed to update status."); }
  }

  async function updatePaymentStatus(requestId: string, paymentStatus: "paid" | "unpaid") {
    try {
      await supabase.from("fabric_requests").update(
        paymentStatus === "paid"
          ? { payment_status: "paid", paid_at: new Date().toISOString() }
          : { payment_status: "unpaid", paid_at: null }
      ).eq("id", requestId);
      await fetchAll();
      alert(`Payment marked as ${paymentStatus}.`);
    } catch { alert("Failed to update payment status."); }
  }

  async function saveInternalNote(requestId: string, note: string) {
    try { await supabase.from("fabric_requests").update({ internal_note: note }).eq("id", requestId); }
    catch { alert("Failed to save note."); }
  }

  async function approveContactRelease(requestId: string, paymentStatus?: string | null) {
    if (paymentStatus !== "paid") { alert("Payment must be confirmed before releasing supplier contact."); return; }
    try {
      await supabase.from("fabric_requests").update({ contact_request_status: "approved" }).eq("id", requestId);
      await supabase.from("quotes").update({ is_contact_released: true }).eq("request_id", requestId);
      try {
        const request = requests.find((r) => r.id === requestId);
        if (request?.client_email) {
          await fetch("/api/email/notify-contact-approved", {
            method: "POST", headers: { "Content-Type": "application/json" },
            body: JSON.stringify({ buyerEmail: request.client_email, buyerName: request.client_name, requestId }),
          });
          await sendPushNotification(requestId, "Supplier contact approved ✓", "Your supplier contact details are now available. Tap to view.");
        }
      } catch (e) { console.error("Notification failed:", e); }
      await fetchAll();
      alert("Supplier contact approved, released and buyer notified.");
    } catch { alert("Failed to approve contact release."); }
  }

  async function rejectContactRelease(requestId: string) {
    try {
      await supabase.from("fabric_requests").update({ contact_request_status: "rejected" }).eq("id", requestId);
      await supabase.from("quotes").update({ is_contact_released: false }).eq("request_id", requestId);
      await fetchAll();
      alert("Contact request rejected.");
    } catch { alert("Failed to reject."); }
  }

  async function revokeContactAccess(requestId: string) {
    try {
      await supabase.from("fabric_requests").update({ contact_request_status: "rejected" }).eq("id", requestId);
      await supabase.from("quotes").update({ is_contact_released: false }).eq("request_id", requestId);
      await fetchAll();
      alert("Contact access revoked.");
    } catch { alert("Failed to revoke."); }
  }

  async function deleteRequest(requestId: string) {
    if (!window.confirm("Delete this request and all related quotes?")) return;
    try {
      await supabase.from("quotes").delete().eq("request_id", requestId);
      await supabase.from("fabric_requests").delete().eq("id", requestId);
      await fetchAll();
    } catch { alert("Failed to delete request."); }
  }

  async function toggleSupplierActive(supplierId: string, current: boolean) {
    try { await supabase.from("supplier_profiles").update({ is_active: !current }).eq("id", supplierId); await fetchAll(); }
    catch { alert("Failed to update supplier."); }
  }

  async function toggleSupplierVerified(supplierId: string, current: boolean) {
    try {
      await supabase.from("supplier_profiles").update({
        is_verified: !current,
        verified_at: !current ? new Date().toISOString() : null,
      }).eq("id", supplierId);
      await fetchAll();
      alert(!current ? "Supplier verified successfully." : "Supplier verification removed.");
    } catch { alert("Failed to update verification."); }
  }

  async function deleteReview(reviewId: string) {
    if (!window.confirm("Delete this review?")) return;
    try { await supabase.from("supplier_reviews").delete().eq("id", reviewId); await fetchAll(); alert("Review deleted."); }
    catch { alert("Failed to delete review."); }
  }

  async function toggleStockActive(itemId: string, current: boolean | null) {
    try { await supabase.from("ready_stock").update({ is_active: !current }).eq("id", itemId); await fetchAll(); }
    catch { alert("Failed to update stock item."); }
  }

  async function createInvite() {
    if (!newInviteCode.trim()) { alert("Enter an invite code."); return; }
    setCreatingInvite(true);
    try {
      const { error } = await supabase.from("supplier_invites").insert([{
        code: newInviteCode.trim().toUpperCase(),
        email: newInviteEmail.trim() || null,
      }]);
      if (error) throw error;
      setNewInviteCode(""); setNewInviteEmail("");
      await fetchAll();
      alert("Invite code created.");
    } catch (err: any) { alert(err.message || "Failed to create invite."); }
    finally { setCreatingInvite(false); }
  }

  async function deleteInvite(inviteId: string) {
    if (!window.confirm("Delete this invite code?")) return;
    try { await supabase.from("supplier_invites").delete().eq("id", inviteId); await fetchAll(); }
    catch { alert("Failed to delete invite."); }
  }

  const categoryCounts = useMemo(() => {
    const counts: Record<string, number> = {};
    requests.forEach((r) => { if (r.category) counts[r.category] = (counts[r.category] || 0) + 1; });
    return counts;
  }, [requests]);

  const filteredRequests = useMemo(() => {
    const q = search.toLowerCase().trim();
    return requests.filter((r) => {
      if (categoryFilter !== "all" && r.category !== categoryFilter) return false;
      if (!q) return true;
      return (
        r.id.toLowerCase().includes(q) ||
        (r.client_name || "").toLowerCase().includes(q) ||
        (r.client_email || "").toLowerCase().includes(q) ||
        (r.client_phone || "").toLowerCase().includes(q) ||
        r.user_input.toLowerCase().includes(q)
      );
    });
  }, [requests, search, categoryFilter]);

  const reviewsBySupplier = useMemo(() => {
    const map: Record<string, SupplierReview[]> = {};
    reviews.forEach((r) => { if (!map[r.supplier_id]) map[r.supplier_id] = []; map[r.supplier_id].push(r); });
    return map;
  }, [reviews]);

  const stockBySupplier = useMemo(() => {
    const map: Record<string, ReadyStockItem[]> = {};
    readyStock.forEach((s) => { if (!map[s.supplier_id]) map[s.supplier_id] = []; map[s.supplier_id].push(s); });
    return map;
  }, [readyStock]);

  const activeCategoriesInRequests = useMemo(() => {
    const { FABRIC_CATEGORIES } = require("@/lib/categories");
    return FABRIC_CATEGORIES.filter((c: any) => categoryCounts[c.id] > 0);
  }, [categoryCounts]);

  const stats = useMemo(() => ({
    total: requests.length,
    pendingApproval: requests.filter((r) => r.payment_status === "paid" && r.contact_request_status === "pending").length,
    released: requests.filter((r) => r.contact_request_status === "approved").length,
    totalRevenue: requests.filter((r) => r.payment_status === "paid").length * 10000,
    activeSuppliers: suppliers.filter((s) => s.is_active).length,
    verifiedSuppliers: suppliers.filter((s) => s.is_verified).length,
    unusedInvites: invites.filter((i) => !i.used).length,
    totalReviews: reviews.length,
    avgRating: reviews.length > 0 ? (reviews.reduce((s, r) => s + r.rating, 0) / reviews.length).toFixed(1) : "—",
    activeStock: readyStock.filter((s) => s.is_active && !s.is_sold_out).length,
  }), [requests, suppliers, invites, reviews, readyStock]);

  if (loading) {
    return (
      <main className="min-h-screen bg-[#f5ecdc] flex items-center justify-center font-sans">
        <div className="text-stone-400 text-sm">Loading...</div>
      </main>
    );
  }

  if (!authenticated) {
    return (
      <main className="min-h-screen bg-[#f5ecdc] flex items-center justify-center px-4 font-sans">
        <div className="w-full max-w-sm bg-white border border-stone-200 rounded-2xl p-8 shadow-sm">
          <div className="flex items-center gap-3 mb-6">
            <img src="/weinly-logo.svg" alt="Weinly" height="36" className="h-9 w-auto" />
            <span className="rounded-full bg-red-100 border border-red-200 px-2.5 py-1 text-xs font-bold text-red-600">Admin</span>
          </div>
          <p className="text-stone-500 text-sm mb-4">Enter admin password to continue.</p>
          <div className="relative mb-3">
            <input type={showPassword ? "text" : "password"} value={password} onChange={(e) => { setPassword(e.target.value); setLoginError(""); }} onKeyDown={(e) => e.key === "Enter" && handleLogin()}
              placeholder="Admin password"
              className="w-full px-4 py-3 pr-11 rounded-lg bg-stone-50 border border-stone-200 text-[#1f2933] text-sm placeholder:text-stone-400 outline-none focus:border-[#24483f] transition-all" />
            <button type="button" onClick={() => setShowPassword((v) => !v)}
              className="absolute right-3 top-1/2 -translate-y-1/2 text-stone-400 hover:text-stone-600 transition-colors select-none"
              aria-label={showPassword ? "Hide password" : "Show password"}>
              {showPassword ? (
                <svg xmlns="http://www.w3.org/2000/svg" width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                  <path d="M17.94 17.94A10.07 10.07 0 0 1 12 20c-7 0-11-8-11-8a18.45 18.45 0 0 1 5.06-5.94"/>
                  <path d="M9.9 4.24A9.12 9.12 0 0 1 12 4c7 0 11 8 11 8a18.5 18.5 0 0 1-2.16 3.19"/>
                  <line x1="1" y1="1" x2="23" y2="23"/>
                </svg>
              ) : (
                <svg xmlns="http://www.w3.org/2000/svg" width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                  <path d="M1 12s4-8 11-8 11 8 11 8-4 8-11 8-11-8-11-8z"/>
                  <circle cx="12" cy="12" r="3"/>
                </svg>
              )}
            </button>
          </div>
          {loginError && (
            <div className="mb-3 flex items-center gap-2 rounded-lg border border-red-200 bg-red-50 px-4 py-3 text-sm text-red-600">
              <span>✕</span><span>{loginError}</span>
            </div>
          )}
          <button onClick={handleLogin} className="w-full bg-gradient-to-r from-[#24483f] to-[#1a3530] text-white font-bold text-sm py-3 rounded-lg border-0 cursor-pointer shadow-sm">
            Login to Admin
          </button>
        </div>
      </main>
    );
  }

  return (
    <main className="min-h-screen bg-[#f5ecdc] px-3 py-3 md:px-4 md:py-4 font-sans">
      <div className="max-w-6xl mx-auto flex flex-col gap-3">

        {/* Header */}
        <nav className="bg-white border border-stone-200 rounded-2xl px-4 py-3 flex items-center justify-between gap-4 shadow-sm">
          <div className="flex items-center gap-3">
            <img src="/weinly-logo.svg" alt="Weinly" height="36" className="h-9 w-auto" />
            <span className="rounded-full bg-red-100 border border-red-200 px-2.5 py-1 text-xs font-bold text-red-600">Admin</span>
          </div>
          <div className="flex gap-2">
            <button onClick={fetchAll} className="border border-stone-200 bg-stone-50 text-stone-500 font-semibold text-xs px-4 py-2 rounded-lg cursor-pointer hover:bg-stone-100 transition-all">Refresh</button>
            <button onClick={handleLogout} className="bg-red-50 border border-red-200 text-red-600 font-semibold text-xs px-4 py-2 rounded-lg cursor-pointer hover:bg-red-100 transition-all">Logout</button>
          </div>
        </nav>

        {/* Stats */}
        <div className="grid grid-cols-2 md:grid-cols-5 lg:grid-cols-10 gap-2">
          {[
            { label: "Requests",      value: String(stats.total),                                                   cls: "bg-blue-50 border-blue-200 text-blue-700" },
            { label: "Needs approval",value: String(stats.pendingApproval),                                          cls: "bg-violet-50 border-violet-200 text-violet-700" },
            { label: "Released",      value: String(stats.released),                                                 cls: "bg-emerald-50 border-emerald-200 text-[#2f7d57]" },
            { label: "Revenue",       value: `₦${stats.totalRevenue.toLocaleString()}`,                              cls: "bg-amber-50 border-amber-200 text-amber-700" },
            { label: "Suppliers",     value: String(stats.activeSuppliers),                                          cls: "bg-sky-50 border-sky-200 text-sky-700" },
            { label: "Verified",      value: String(stats.verifiedSuppliers),                                        cls: "bg-emerald-50 border-emerald-200 text-[#2f7d57]" },
            { label: "Invites left",  value: String(stats.unusedInvites),                                            cls: "bg-pink-50 border-pink-200 text-pink-700" },
            { label: "Reviews",       value: String(stats.totalReviews),                                             cls: "bg-amber-50 border-amber-200 text-amber-700" },
            { label: "Avg rating",    value: stats.avgRating === "—" ? "—" : `${stats.avgRating}★`,                 cls: "bg-amber-50 border-amber-200 text-amber-700" },
            { label: "Stock items",   value: String(stats.activeStock),                                              cls: "bg-teal-50 border-teal-200 text-teal-700" },
          ].map((stat) => (
            <div key={stat.label} className={`${stat.cls} border rounded-xl p-3`}>
              <div className="text-lg font-black mb-0.5">{stat.value}</div>
              <div className="text-xs font-semibold leading-tight opacity-70">{stat.label}</div>
            </div>
          ))}
        </div>

        {/* Tabs */}
        <div className="bg-white border border-stone-200 rounded-2xl p-4 md:p-6 shadow-sm">
          <div className="flex gap-2 mb-6 bg-stone-50 border border-stone-200 rounded-xl p-1.5 overflow-x-auto">
            {(["requests", "suppliers", "applications", "invites", "reviews", "stock"] as const).map((tab) => (
              <button key={tab} onClick={() => setActiveTab(tab)}
                className={`shrink-0 flex-1 py-2.5 px-3 rounded-lg text-xs md:text-sm font-bold border-0 cursor-pointer transition-all ${activeTab === tab ? "bg-gradient-to-r from-[#24483f] to-[#1a3530] text-white shadow-sm" : "text-stone-500 bg-transparent hover:text-stone-700"}`}>
                {tab === "requests" ? `Requests (${requests.length})`
                  : tab === "suppliers" ? `Suppliers (${suppliers.length})`
                  : tab === "applications" ? `Applications (${applications.filter((a) => a.status === "pending").length})`
                  : tab === "invites" ? `Invites (${invites.length})`
                  : tab === "reviews" ? `Reviews (${reviews.length})`
                  : `Stock (${readyStock.filter((s) => s.is_active).length})`}
              </button>
            ))}
          </div>

          {/* ── REQUESTS TAB ── */}
          {activeTab === "requests" && (
            <div className="flex flex-col gap-4">
              <div className="flex flex-col gap-3 md:flex-row md:items-center">
                <input value={search} onChange={(e) => setSearch(e.target.value)}
                  placeholder="Search by ID, name, email, phone or request text..."
                  className="flex-1 w-full px-4 py-3 rounded-lg bg-stone-50 border border-stone-200 text-[#1f2933] text-sm placeholder:text-stone-400 outline-none focus:border-[#24483f] transition-all" />
              </div>

              {activeCategoriesInRequests.length > 1 && (
                <div className="flex flex-wrap gap-2">
                  <button onClick={() => setCategoryFilter("all")}
                    className={`rounded-full border px-3 py-1.5 text-xs font-bold transition-all cursor-pointer ${categoryFilter === "all" ? "bg-[#24483f]/10 border-[#24483f]/30 text-[#24483f]" : "border-stone-200 bg-stone-50 text-stone-500 hover:text-stone-700"}`}>
                    All ({requests.length})
                  </button>
                  {activeCategoriesInRequests.map((cat: any) => {
                    const color = getCategoryColor(cat.id);
                    return (
                      <button key={cat.id} onClick={() => setCategoryFilter(cat.id)}
                        className={`rounded-full border px-3 py-1.5 text-xs font-bold transition-all cursor-pointer ${categoryFilter === cat.id ? `${color.bg} ${color.text} ${color.border}` : "border-stone-200 bg-stone-50 text-stone-500 hover:text-stone-700"}`}>
                        {cat.label} ({categoryCounts[cat.id] || 0})
                      </button>
                    );
                  })}
                </div>
              )}

              {filteredRequests.length === 0 ? (
                <div className="border border-dashed border-stone-300 rounded-xl p-10 text-center text-stone-400 text-sm">No requests found.</div>
              ) : (
                filteredRequests.map((request) => {
                  const quotes = quotesMap[request.id] || [];
                  const pill = getStagePill(request, quotes.length);
                  const isExpanded = expandedId === request.id;

                  return (
                    <div key={request.id} className="border border-stone-200 rounded-xl overflow-hidden bg-white">
                      <div className="p-4 flex justify-between gap-3 flex-wrap items-start cursor-pointer hover:bg-stone-50 transition-all"
                        onClick={() => setExpandedId(isExpanded ? null : request.id)}>
                        <div className="flex flex-col gap-1.5 min-w-0">
                          <div className="flex items-center gap-2 flex-wrap">
                            <span className="text-[#1f2933] font-bold text-sm">{request.client_name || "Unnamed buyer"}</span>
                            <span className={`text-xs font-bold px-2.5 py-1 rounded-full ${pill.cls}`}>{pill.label}</span>
                            {request.category && <CategoryBadge categoryId={request.category} subcategory={request.subcategory} />}
                            {request.payment_status === "paid" && request.contact_request_status === "pending" && (
                              <span className="bg-red-100 text-red-600 border border-red-200 text-xs font-bold px-2.5 py-1 rounded-full animate-pulse">Action needed</span>
                            )}
                          </div>
                          <div className="text-stone-400 text-xs">{request.client_email || "—"} · {new Date(request.created_at).toLocaleDateString()}</div>
                          <div className="text-stone-300 text-xs font-mono">{request.id}</div>
                        </div>
                        <div className="flex items-center gap-3 shrink-0">
                          <div className="text-center">
                            <div className="text-[#1f2933] font-black text-lg">{quotes.length}</div>
                            <div className="text-stone-400 text-xs">quotes</div>
                          </div>
                          <span className={`text-stone-400 text-lg transition-transform duration-200 ${isExpanded ? "rotate-180" : ""}`}>↓</span>
                        </div>
                      </div>

                      {isExpanded && (
                        <div className="border-t border-stone-100 p-4 flex flex-col gap-4 bg-stone-50/50">
                          <div className="grid grid-cols-2 md:grid-cols-4 gap-2.5">
                            {[
                              { label: "Email", value: request.client_email || "—" },
                              { label: "Phone", value: request.client_phone || "—" },
                              { label: "Status", value: request.status || "submitted" },
                              { label: "Payment", value: request.payment_status || "unpaid" },
                              { label: "Contact status", value: request.contact_request_status || "none" },
                              { label: "Access fee", value: request.contact_access_fee || "—" },
                              { label: "Reference", value: request.payment_reference || "—" },
                              { label: "Paid at", value: request.paid_at ? new Date(request.paid_at).toLocaleDateString() : "—" },
                            ].map((info) => (
                              <div key={info.label} className="bg-white border border-stone-200 rounded-lg p-3">
                                <div className="text-stone-400 text-xs font-bold uppercase tracking-wider mb-1">{info.label}</div>
                                <div className="text-[#1f2933] text-xs break-words">{info.value}</div>
                              </div>
                            ))}
                          </div>

                          <div className="bg-white border border-stone-200 rounded-lg p-4">
                            <div className="text-stone-400 text-xs font-bold uppercase tracking-widest mb-2">Fabric request</div>
                            <p className="text-stone-600 text-sm leading-relaxed m-0 whitespace-pre-wrap">{request.user_input}</p>
                          </div>

                          {request.ai_output != null && (
                            <div className="bg-white border border-stone-200 rounded-lg p-4">
                              <div className="text-stone-400 text-xs font-bold uppercase tracking-widest mb-2">AI sourcing spec</div>
                              <p className="text-stone-500 text-sm leading-relaxed m-0 whitespace-pre-wrap">{formatAiOutput(request.ai_output)}</p>
                            </div>
                          )}

                          <div className="flex flex-col gap-1.5">
                            <label className="text-stone-400 text-xs font-bold uppercase tracking-widest">Internal note</label>
                            <textarea defaultValue={request.internal_note || ""} onBlur={(e) => saveInternalNote(request.id, e.target.value)}
                              placeholder="Add internal notes here..." rows={3}
                              className="w-full px-4 py-3 rounded-lg bg-white border border-stone-200 text-[#1f2933] text-sm placeholder:text-stone-400 outline-none focus:border-[#24483f] transition-all resize-none" />
                          </div>

                          <div className="flex flex-col gap-3">
                            <div className="text-stone-400 text-xs font-bold uppercase tracking-widest">Request status</div>
                            <div className="flex gap-2 flex-wrap">
                              {["submitted", "quoted", "completed"].map((s) => (
                                <button key={s} onClick={() => updateRequestStatus(request.id, s)}
                                  className={`text-xs font-bold px-4 py-2 rounded-lg border cursor-pointer transition-all ${request.status === s ? "bg-[#24483f]/10 text-[#24483f] border-[#24483f]/30" : "bg-stone-50 text-stone-500 border-stone-200 hover:bg-stone-100"}`}>
                                  {s.charAt(0).toUpperCase() + s.slice(1)}
                                </button>
                              ))}
                            </div>

                            <div className="text-stone-400 text-xs font-bold uppercase tracking-widest">Payment</div>
                            <div className="flex gap-2 flex-wrap">
                              <button onClick={() => updatePaymentStatus(request.id, "paid")} className="bg-emerald-100 border border-emerald-200 text-[#2f7d57] font-bold text-xs px-4 py-2 rounded-lg cursor-pointer hover:bg-emerald-200 transition-all">Mark paid</button>
                              <button onClick={() => updatePaymentStatus(request.id, "unpaid")} className="bg-stone-50 text-stone-500 font-bold text-xs px-4 py-2 rounded-lg border border-stone-200 cursor-pointer hover:bg-stone-100 transition-all">Mark unpaid</button>
                            </div>

                            <div className="text-stone-400 text-xs font-bold uppercase tracking-widest">Contact release</div>
                            <div className="flex gap-2 flex-wrap">
                              {request.contact_request_status === "pending" && (
                                <>
                                  <button onClick={() => approveContactRelease(request.id, request.payment_status)} className="bg-emerald-100 border border-emerald-200 text-[#2f7d57] font-bold text-xs px-4 py-2.5 rounded-lg cursor-pointer hover:bg-emerald-200 transition-all">✓ Approve &amp; release</button>
                                  <button onClick={() => rejectContactRelease(request.id)} className="bg-red-50 border border-red-200 text-red-600 font-bold text-xs px-4 py-2.5 rounded-lg cursor-pointer hover:bg-red-100 transition-all">✕ Reject</button>
                                </>
                              )}
                              {request.contact_request_status === "approved" && (
                                <button onClick={() => revokeContactAccess(request.id)} className="bg-red-50 border border-red-200 text-red-600 font-bold text-xs px-4 py-2.5 rounded-lg cursor-pointer hover:bg-red-100 transition-all">Revoke access</button>
                              )}
                            </div>

                            <div className="pt-2 border-t border-stone-100">
                              <button onClick={() => deleteRequest(request.id)} className="bg-red-50 border border-red-200 text-red-600 font-bold text-xs px-4 py-2 rounded-lg cursor-pointer hover:bg-red-100 transition-all">Delete request</button>
                            </div>
                          </div>

                          {quotes.length > 0 && (
                            <div className="flex flex-col gap-3">
                              <div className="text-stone-400 text-xs font-bold uppercase tracking-widest">Existing quotes ({quotes.length})</div>
                              {quotes.map((quote) => (
                                <div key={quote.id} className="bg-white border border-stone-200 rounded-xl p-4 flex flex-col gap-3">
                                  <div className="flex justify-between gap-3 flex-wrap">
                                    <div className="text-[#1f2933] font-bold text-sm">{quote.supplier_name}</div>
                                    <span className={`text-xs font-bold px-3 py-1 rounded-full ${quote.is_contact_released ? "bg-emerald-100 text-[#2f7d57] border border-emerald-200" : "bg-blue-100 text-blue-700 border border-blue-200"}`}>
                                      {quote.is_contact_released ? "Released" : "Protected"}
                                    </span>
                                  </div>
                                  <div className="grid grid-cols-2 md:grid-cols-4 gap-2">
                                    {[
                                      { label: "Price", value: quote.price || "—" }, { label: "MOQ", value: quote.moq || "—" },
                                      { label: "Lead time", value: quote.lead_time || "—" }, { label: "Region", value: quote.supplier_region || "—" },
                                      { label: "Contact", value: quote.contact_name || "—" }, { label: "Phone", value: quote.contact_phone || "—" },
                                      { label: "WeChat", value: quote.contact_wechat || "—" }, { label: "Email", value: quote.contact_email || "—" },
                                    ].map((s) => (
                                      <div key={s.label} className="bg-stone-50 border border-stone-200 rounded-lg p-2.5">
                                        <div className="text-stone-400 text-xs font-bold uppercase tracking-wider mb-0.5">{s.label}</div>
                                        <div className="text-[#1f2933] text-xs break-words">{s.value}</div>
                                      </div>
                                    ))}
                                  </div>
                                  {quote.note && (
                                    <div className="bg-stone-50 border border-stone-200 rounded-lg p-3">
                                      <div className="text-stone-400 text-xs font-bold uppercase tracking-widest mb-1">Note</div>
                                      <p className="text-stone-600 text-xs leading-relaxed m-0">{quote.note}</p>
                                    </div>
                                  )}
                                </div>
                              ))}
                            </div>
                          )}

                          {/* Add quote */}
                          <div className="bg-[#24483f]/5 border border-[#24483f]/20 rounded-xl p-5 flex flex-col gap-4">
                            <div className="text-[#24483f] font-bold text-sm">Add new quote manually</div>
                            <div className="grid grid-cols-1 md:grid-cols-3 gap-3">
                              {[
                                { label: "Supplier name *", key: "supplier_name", placeholder: "Company name" },
                                { label: "Price", key: "price", placeholder: "e.g. $2.50/yard" },
                                { label: "MOQ", key: "moq", placeholder: "e.g. 500 yards" },
                                { label: "Lead time", key: "lead_time", placeholder: "e.g. 15-20 days" },
                                { label: "Supplier region", key: "supplier_region", placeholder: "e.g. Guangzhou" },
                                { label: "Contact name", key: "contact_name", placeholder: "Contact person" },
                                { label: "Contact phone", key: "contact_phone", placeholder: "Phone number" },
                                { label: "Contact WeChat", key: "contact_wechat", placeholder: "WeChat ID" },
                                { label: "Contact email", key: "contact_email", placeholder: "Email address" },
                              ].map((field) => (
                                <div key={field.key} className="flex flex-col gap-1.5">
                                  <label className="text-stone-500 text-xs font-bold uppercase tracking-wider">{field.label}</label>
                                  <input value={newQuotes[request.id]?.[field.key as keyof NewQuoteForm] || ""}
                                    onChange={(e) => updateNewQuoteField(request.id, field.key as keyof NewQuoteForm, e.target.value)}
                                    placeholder={field.placeholder}
                                    className="w-full px-3 py-2.5 rounded-lg bg-white border border-stone-200 text-[#1f2933] text-sm placeholder:text-stone-400 outline-none focus:border-[#24483f] transition-all" />
                                </div>
                              ))}
                            </div>
                            <textarea value={newQuotes[request.id]?.note || ""} onChange={(e) => updateNewQuoteField(request.id, "note", e.target.value)}
                              placeholder="Supplier note..." rows={3}
                              className="w-full px-4 py-3 rounded-lg bg-white border border-stone-200 text-[#1f2933] text-sm placeholder:text-stone-400 outline-none focus:border-[#24483f] transition-all resize-none" />
                            <button onClick={() => addQuote(request.id)} className="self-start bg-gradient-to-r from-[#24483f] to-[#1a3530] text-white font-bold text-sm px-6 py-3 rounded-lg border-0 cursor-pointer shadow-sm">
                              Add quote &amp; notify buyer →
                            </button>
                          </div>
                        </div>
                      )}
                    </div>
                  );
                })
              )}
            </div>
          )}

          {/* ── SUPPLIERS TAB ── */}
          {activeTab === "suppliers" && (
            <div className="flex flex-col gap-4">
              <div>
                <h2 className="text-xl font-black text-[#1f2933] tracking-tight mb-1">Registered suppliers</h2>
                <p className="text-stone-500 text-sm m-0">{suppliers.length} supplier{suppliers.length === 1 ? "" : "s"} · {stats.verifiedSuppliers} verified</p>
              </div>

              {suppliers.length === 0 ? (
                <div className="border border-dashed border-stone-300 rounded-xl p-10 text-center text-stone-400 text-sm">No suppliers registered yet.</div>
              ) : (
                suppliers.map((supplier) => {
                  const supplierReviews = reviewsBySupplier[supplier.id] || [];
                  const supplierStock = stockBySupplier[supplier.id] || [];
                  const avgRating = supplierReviews.length > 0
                    ? (supplierReviews.reduce((s, r) => s + r.rating, 0) / supplierReviews.length).toFixed(1)
                    : null;
                  const isExpanded = expandedSupplierId === supplier.id;
                  const supplierCategories: string[] = supplier.categories || [];

                  return (
                    <div key={supplier.id} className="bg-white border border-stone-200 rounded-xl p-5 flex flex-col gap-4">
                      <div className="flex justify-between gap-3 flex-wrap items-start">
                        <div>
                          <div className="flex items-center gap-2 flex-wrap mb-1">
                            <div className="text-[#1f2933] font-bold text-base">{supplier.company_name}</div>
                            {supplier.is_verified && (
                              <span className="inline-flex items-center gap-1 rounded-full border border-emerald-200 bg-emerald-100 px-2.5 py-1 text-xs font-bold text-[#2f7d57]">✓ Verified</span>
                            )}
                          </div>
                          <div className="text-stone-400 text-xs mb-0.5">{supplier.contact_name || "—"} · {supplier.email || "—"}</div>
                          <div className="text-stone-400 text-xs">{supplier.region || "Region not set"} · Joined {new Date(supplier.created_at).toLocaleDateString()}</div>
                          {supplier.bio && <p className="text-stone-500 text-xs mt-1 leading-relaxed max-w-lg">{supplier.bio}</p>}
                          {supplierCategories.length > 0 && (
                            <div className="mt-2 flex flex-wrap gap-1.5">
                              {supplierCategories.map((catId) => <CategoryBadge key={catId} categoryId={catId} />)}
                            </div>
                          )}
                        </div>

                        <div className="flex gap-2 items-center flex-wrap">
                          {avgRating && (
                            <span className="bg-amber-50 text-amber-700 border border-amber-200 text-xs font-bold px-3 py-1.5 rounded-full">
                              {avgRating}★ ({supplierReviews.length})
                            </span>
                          )}
                          {supplierStock.filter((s) => s.is_active && !s.is_sold_out).length > 0 && (
                            <span className="bg-teal-50 text-teal-700 border border-teal-200 text-xs font-bold px-3 py-1.5 rounded-full">
                              {supplierStock.filter((s) => s.is_active && !s.is_sold_out).length} in stock
                            </span>
                          )}
                          <span className={`text-xs font-bold px-3 py-1.5 rounded-full ${supplier.is_verified ? "bg-emerald-100 text-[#2f7d57] border border-emerald-200" : "bg-stone-100 text-stone-500 border border-stone-200"}`}>
                            {supplier.is_verified ? "✓ Verified" : "Unverified"}
                          </span>
                          <button onClick={() => toggleSupplierVerified(supplier.id, !!supplier.is_verified)}
                            className={`text-xs font-bold px-3 py-1.5 rounded-lg border cursor-pointer transition-all ${supplier.is_verified ? "bg-amber-50 text-amber-700 border-amber-200 hover:bg-amber-100" : "bg-emerald-100 text-[#2f7d57] border-emerald-200 hover:bg-emerald-200"}`}>
                            {supplier.is_verified ? "Unverify" : "Verify ✓"}
                          </button>
                          <span className={`text-xs font-bold px-3 py-1.5 rounded-full ${supplier.is_active ? "bg-emerald-100 text-[#2f7d57] border border-emerald-200" : "bg-red-100 text-red-600 border border-red-200"}`}>
                            {supplier.is_active ? "Active" : "Inactive"}
                          </span>
                          <button onClick={() => toggleSupplierActive(supplier.id, !!supplier.is_active)}
                            className={`text-xs font-bold px-3 py-1.5 rounded-lg border cursor-pointer transition-all ${supplier.is_active ? "bg-red-50 text-red-600 border-red-200 hover:bg-red-100" : "bg-emerald-100 text-[#2f7d57] border-emerald-200 hover:bg-emerald-200"}`}>
                            {supplier.is_active ? "Deactivate" : "Activate"}
                          </button>
                        </div>
                      </div>

                      <div className="grid grid-cols-2 md:grid-cols-4 gap-2.5">
                        {[
                          { label: "Phone", value: supplier.phone || "—" }, { label: "WeChat", value: supplier.wechat || "—" },
                          { label: "Region", value: supplier.region || "—" }, { label: "Email", value: supplier.email || "—" },
                        ].map((info) => (
                          <div key={info.label} className="bg-stone-50 border border-stone-200 rounded-lg p-3">
                            <div className="text-stone-400 text-xs font-bold uppercase tracking-wider mb-1">{info.label}</div>
                            <div className="text-[#1f2933] text-xs break-words">{info.value}</div>
                          </div>
                        ))}
                      </div>

                      {supplierReviews.length > 0 && (
                        <div>
                          <button onClick={() => setExpandedSupplierId(isExpanded ? null : supplier.id)}
                            className="text-xs font-semibold text-[#a75635] cursor-pointer bg-transparent border-0 p-0 hover:text-[#7b3525] transition-colors">
                            {isExpanded ? "Hide reviews ↑" : `View ${supplierReviews.length} review${supplierReviews.length > 1 ? "s" : ""} ↓`}
                          </button>
                          {isExpanded && (
                            <div className="mt-3 flex flex-col gap-2">
                              {supplierReviews.map((review) => (
                                <div key={review.id} className="bg-stone-50 border border-stone-200 rounded-lg p-3 flex flex-col gap-2">
                                  <div className="flex items-center justify-between gap-3 flex-wrap">
                                    <div className="flex items-center gap-2">
                                      <StarDisplay rating={review.rating} />
                                      <span className="text-xs text-stone-400">{review.buyer_name || "Verified buyer"} · {new Date(review.created_at).toLocaleDateString()}</span>
                                    </div>
                                    <button onClick={() => deleteReview(review.id)} className="text-xs text-red-500 cursor-pointer bg-transparent border-0 p-0 hover:text-red-700 transition-colors">Delete</button>
                                  </div>
                                  {review.comment && <p className="m-0 text-xs leading-relaxed text-stone-600">{review.comment}</p>}
                                </div>
                              ))}
                            </div>
                          )}
                        </div>
                      )}

                      <div className="flex gap-3">
                        <a href={`/suppliers/${supplier.id}`} target="_blank" rel="noreferrer"
                          className="text-xs font-semibold text-[#24483f] no-underline hover:text-[#1a3530] transition-colors">
                          View public profile →
                        </a>
                      </div>
                    </div>
                  );
                })
              )}
            </div>
          )}

          {/* ── INVITES TAB ── */}
          {activeTab === "invites" && (
            <div className="flex flex-col gap-4">
              <div>
                <h2 className="text-xl font-black text-[#1f2933] tracking-tight mb-1">Supplier invite codes</h2>
                <p className="text-stone-500 text-sm m-0">Generate and manage invite codes for new suppliers.</p>
              </div>

              <div className="bg-amber-50 border border-amber-200 rounded-xl p-5 flex flex-col gap-4">
                <div className="text-amber-700 font-bold text-sm">Create new invite code</div>
                <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
                  <div className="flex flex-col gap-1.5">
                    <label className="text-stone-500 text-xs font-bold uppercase tracking-wider">Invite code *</label>
                    <input value={newInviteCode} onChange={(e) => setNewInviteCode(e.target.value.toUpperCase())} placeholder="e.g. WEINLY-SUP-004"
                      className="w-full px-4 py-3 rounded-lg bg-white border border-stone-200 text-[#1f2933] text-sm placeholder:text-stone-400 outline-none focus:border-amber-500 transition-all" />
                  </div>
                  <div className="flex flex-col gap-1.5">
                    <label className="text-stone-500 text-xs font-bold uppercase tracking-wider">Supplier email (optional)</label>
                    <input value={newInviteEmail} onChange={(e) => setNewInviteEmail(e.target.value)} placeholder="supplier@company.com" type="email"
                      className="w-full px-4 py-3 rounded-lg bg-white border border-stone-200 text-[#1f2933] text-sm placeholder:text-stone-400 outline-none focus:border-amber-500 transition-all" />
                  </div>
                </div>
                <button onClick={createInvite} disabled={creatingInvite}
                  className="self-start bg-gradient-to-r from-[#a75635] to-[#7b3525] text-white font-bold text-sm px-6 py-3 rounded-lg border-0 cursor-pointer shadow-sm disabled:opacity-60">
                  {creatingInvite ? "Creating..." : "Create invite code →"}
                </button>
              </div>

              {invites.length === 0 ? (
                <div className="border border-dashed border-stone-300 rounded-xl p-10 text-center text-stone-400 text-sm">No invite codes yet.</div>
              ) : (
                <div className="flex flex-col gap-3">
                  {invites.map((invite) => (
                    <div key={invite.id} className="bg-white border border-stone-200 rounded-xl p-4 flex justify-between gap-3 flex-wrap items-center">
                      <div className="flex flex-col gap-1">
                        <div className="flex items-center gap-2">
                          <span className="text-[#1f2933] font-black text-base font-mono">{invite.code}</span>
                          <span className={`text-xs font-bold px-2.5 py-1 rounded-full ${invite.used ? "bg-stone-100 text-stone-500 border border-stone-200" : "bg-emerald-100 text-[#2f7d57] border border-emerald-200"}`}>
                            {invite.used ? "Used" : "Available"}
                          </span>
                        </div>
                        <div className="text-stone-400 text-xs">
                          {invite.email || "No email assigned"} · Created {new Date(invite.created_at).toLocaleDateString()}
                          {invite.used_at && ` · Used ${new Date(invite.used_at).toLocaleDateString()}`}
                        </div>
                      </div>
                      <div className="flex gap-2">
                        {!invite.used && (
                          <button onClick={() => navigator.clipboard.writeText(invite.code).then(() => alert("Code copied!"))}
                            className="bg-stone-50 border border-stone-200 text-stone-600 font-semibold text-xs px-4 py-2 rounded-lg cursor-pointer hover:bg-stone-100 transition-all">
                            Copy code
                          </button>
                        )}
                        <button onClick={() => deleteInvite(invite.id)}
                          className="bg-red-50 border border-red-200 text-red-600 font-semibold text-xs px-4 py-2 rounded-lg cursor-pointer hover:bg-red-100 transition-all">
                          Delete
                        </button>
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </div>
          )}

          {/* ── REVIEWS TAB ── */}
          {activeTab === "reviews" && (
            <div className="flex flex-col gap-4">
              <div>
                <h2 className="text-xl font-black text-[#1f2933] tracking-tight mb-1">All reviews</h2>
                <p className="text-stone-500 text-sm m-0">All buyer reviews across all suppliers. Delete any that violate guidelines.</p>
              </div>

              {reviews.length === 0 ? (
                <div className="border border-dashed border-stone-300 rounded-xl p-10 text-center text-stone-400 text-sm">No reviews yet.</div>
              ) : (
                <div className="flex flex-col gap-3">
                  {reviews.map((review) => {
                    const supplier = suppliers.find((s) => s.id === review.supplier_id);
                    return (
                      <div key={review.id} className="bg-white border border-stone-200 rounded-xl p-4 flex flex-col gap-3">
                        <div className="flex flex-wrap items-start justify-between gap-3">
                          <div>
                            <div className="mb-1 flex items-center gap-2 flex-wrap">
                              <span className="text-[#1f2933] font-bold text-sm">{supplier?.company_name || "Unknown supplier"}</span>
                              {supplier?.is_verified && <span className="text-xs font-bold text-[#2f7d57]">✓ Verified</span>}
                              <StarDisplay rating={review.rating} />
                            </div>
                            <div className="text-stone-400 text-xs">
                              by {review.buyer_name || "Verified buyer"} ({review.buyer_email || "—"}) · {new Date(review.created_at).toLocaleDateString()}
                            </div>
                            <div className="text-stone-300 text-xs font-mono mt-0.5">Request: {review.request_id.slice(0, 12)}...</div>
                          </div>
                          <button onClick={() => deleteReview(review.id)}
                            className="bg-red-50 border border-red-200 text-red-600 font-semibold text-xs px-4 py-2 rounded-lg cursor-pointer hover:bg-red-100 transition-all">
                            Delete
                          </button>
                        </div>
                        {review.comment && <p className="m-0 text-sm leading-relaxed text-stone-600">{review.comment}</p>}
                      </div>
                    );
                  })}
                </div>
              )}
            </div>
          )}

          {/* ── READY STOCK TAB ── */}
          {activeTab === "stock" && (
            <div className="flex flex-col gap-4">
              <div>
                <h2 className="text-xl font-black text-[#1f2933] tracking-tight mb-1">Ready stock listings</h2>
                <p className="text-stone-500 text-sm m-0">
                  {readyStock.filter((s) => s.is_active && !s.is_sold_out).length} items available ·
                  {" "}{readyStock.filter((s) => s.is_active && s.is_sold_out).length} sold out ·
                  {" "}{readyStock.filter((s) => !s.is_active).length} hidden
                </p>
              </div>

              {readyStock.length === 0 ? (
                <div className="border border-dashed border-stone-300 rounded-xl p-10 text-center text-stone-400 text-sm">No ready stock listings yet.</div>
              ) : (
                <div className="flex flex-col gap-3">
                  {readyStock.map((item) => {
                    const supplier = suppliers.find((s) => s.id === item.supplier_id);
                    const color = getCategoryColor(item.category);
                    return (
                      <div key={item.id} className={`bg-white border border-stone-200 rounded-xl p-4 flex flex-col gap-3 ${!item.is_active ? "opacity-50" : ""}`}>
                        <div className="flex flex-wrap items-start justify-between gap-3">
                          <div>
                            <div className="flex items-center gap-2 flex-wrap mb-1">
                              <span className={`text-sm font-bold ${color.text}`}>{item.name}</span>
                              <span className={`rounded-full border px-2 py-0.5 text-xs font-semibold ${color.bg} ${color.border} ${color.text}`}>
                                {getCategoryLabel(item.category)}{item.subcategory ? ` · ${item.subcategory}` : ""}
                              </span>
                              {item.is_sold_out ? (
                                <span className="rounded-full border border-red-200 bg-red-100 px-2.5 py-1 text-xs font-bold text-red-600">Sold out</span>
                              ) : item.is_active ? (
                                <span className="rounded-full border border-emerald-200 bg-emerald-100 px-2.5 py-1 text-xs font-bold text-[#2f7d57]">In stock</span>
                              ) : (
                                <span className="rounded-full border border-stone-200 bg-stone-100 px-2.5 py-1 text-xs font-bold text-stone-500">Hidden</span>
                              )}
                            </div>
                            <div className="text-stone-400 text-xs">
                              {supplier?.company_name || "Unknown supplier"}
                              {supplier?.is_verified && <span className="ml-1 text-[#2f7d57]">✓</span>}
                              {supplier?.region && ` · ${supplier.region}`}
                            </div>
                          </div>
                          <div className="flex gap-2">
                            <button onClick={() => toggleStockActive(item.id, item.is_active)}
                              className={`text-xs font-bold px-3 py-1.5 rounded-lg border cursor-pointer transition-all ${item.is_active ? "bg-stone-50 text-stone-600 border-stone-200 hover:bg-stone-100" : "bg-emerald-100 text-[#2f7d57] border-emerald-200 hover:bg-emerald-200"}`}>
                              {item.is_active ? "Hide" : "Show"}
                            </button>
                          </div>
                        </div>
                        {item.description && <p className="m-0 text-xs leading-relaxed text-stone-500">{item.description}</p>}
                        <div className="grid grid-cols-3 gap-2 md:grid-cols-4">
                          {[
                            { label: "Price", value: `${item.price_per_unit}/${item.unit}` },
                            { label: "MOQ", value: item.moq },
                            { label: "Available", value: item.available_quantity || "—" },
                            { label: "Added", value: new Date(item.created_at).toLocaleDateString() },
                          ].map((s) => (
                            <div key={s.label} className="bg-stone-50 border border-stone-200 rounded-lg p-2.5">
                              <div className="text-stone-400 text-xs font-bold uppercase tracking-wider mb-0.5">{s.label}</div>
                              <div className="text-[#1f2933] text-xs font-semibold">{s.value}</div>
                            </div>
                          ))}
                        </div>
                      </div>
                    );
                  })}
                </div>
              )}
            </div>
          )}

          {/* ── APPLICATIONS TAB ── */}
          {activeTab === "applications" && (
            <div className="flex flex-col gap-4">
              <div className="flex items-center justify-between">
                <div>
                  <h2 className="text-lg font-black text-[#1f2933]">Supplier applications</h2>
                  <p className="text-xs text-stone-500">{applications.filter((a) => a.status === "pending").length} pending · {applications.filter((a) => a.status === "approved").length} approved · {applications.filter((a) => a.status === "rejected").length} rejected</p>
                </div>
              </div>
              {applications.length === 0 ? (
                <div className="rounded-xl border border-dashed border-stone-300 bg-stone-50 p-8 text-center text-sm text-stone-400">No applications yet.</div>
              ) : (
                <div className="flex flex-col gap-3">
                  {applications.map((app) => (
                    <div key={app.id} className="rounded-xl border border-stone-200 bg-white p-4">
                      <div className="flex flex-wrap items-start justify-between gap-3 mb-3">
                        <div>
                          <div className="flex items-center gap-2 mb-0.5">
                            <span className="text-sm font-bold text-[#1f2933]">{app.company_name}</span>
                            <span className={`rounded-full px-2.5 py-0.5 text-xs font-bold border ${
                              app.status === "pending" ? "bg-amber-100 text-amber-700 border-amber-200" :
                              app.status === "approved" ? "bg-emerald-100 text-[#2f7d57] border-emerald-200" :
                              "bg-red-100 text-red-600 border-red-200"
                            }`}>{app.status}</span>
                          </div>
                          <div className="text-xs text-stone-400">{app.contact_name} · {app.email} · {app.phone}</div>
                          {app.wechat && <div className="text-xs text-stone-400">WeChat: {app.wechat}</div>}
                        </div>
                        <div className="text-xs text-stone-400">{new Date(app.created_at).toLocaleDateString()}</div>
                      </div>
                      <div className="grid grid-cols-2 gap-2 mb-3 md:grid-cols-3">
                        <div className="rounded-lg bg-stone-50 border border-stone-200 p-2.5">
                          <div className="text-xs font-bold uppercase tracking-wider text-stone-400 mb-0.5">Region</div>
                          <div className="text-xs text-[#1f2933]">{app.region}</div>
                        </div>
                        {app.years_in_business && (
                          <div className="rounded-lg bg-stone-50 border border-stone-200 p-2.5">
                            <div className="text-xs font-bold uppercase tracking-wider text-stone-400 mb-0.5">Experience</div>
                            <div className="text-xs text-[#1f2933]">{app.years_in_business}</div>
                          </div>
                        )}
                        {app.website && (
                          <div className="rounded-lg bg-stone-50 border border-stone-200 p-2.5">
                            <div className="text-xs font-bold uppercase tracking-wider text-stone-400 mb-0.5">Website</div>
                            <a href={app.website} target="_blank" rel="noreferrer" className="text-xs text-[#24483f] no-underline hover:underline break-all">{app.website}</a>
                          </div>
                        )}
                      </div>
                      {app.categories && app.categories.length > 0 && (
                        <div className="mb-3 flex flex-wrap gap-1.5">
                          {app.categories.map((cat) => (
                            <span key={cat} className="rounded-full bg-[#24483f]/10 border border-[#24483f]/20 px-2.5 py-0.5 text-xs font-semibold text-[#24483f]">{cat}</span>
                          ))}
                        </div>
                      )}
                      {app.status === "pending" && (
                        <div className="flex gap-2">
                          <button onClick={async () => {
                            if (!confirm(`Approve ${app.company_name} and send invite code to ${app.email}?`)) return;
                            const token = sessionStorage.getItem("weinly_admin_token") || "";
                            try {
                              const res = await fetch("/api/supplier/approve", {
                                method: "POST",
                                headers: { "Content-Type": "application/json", "X-Admin-Password": token },
                                body: JSON.stringify({ applicationId: app.id, action: "approve" }),
                              });
                              const data = await res.json();
                              if (!res.ok) throw new Error(data.error);
                              alert(`Approved! Invite code ${data.code} sent to ${app.email}`);
                              fetchAll();
                            } catch (e: any) { alert(e.message); }
                          }} className="rounded-lg bg-emerald-100 hover:bg-emerald-200 border border-emerald-200 px-4 py-2 text-xs font-bold text-[#2f7d57] cursor-pointer transition-all">
                            ✓ Approve &amp; send invite
                          </button>
                          <button onClick={async () => {
                            if (!confirm(`Reject application from ${app.company_name}?`)) return;
                            const token = sessionStorage.getItem("weinly_admin_token") || "";
                            try {
                              await fetch("/api/supplier/approve", {
                                method: "POST",
                                headers: { "Content-Type": "application/json", "X-Admin-Password": token },
                                body: JSON.stringify({ applicationId: app.id, action: "reject" }),
                              });
                              fetchAll();
                            } catch (e: any) { alert(e.message); }
                          }} className="rounded-lg bg-stone-50 hover:bg-stone-100 border border-stone-200 px-4 py-2 text-xs font-bold text-stone-500 cursor-pointer transition-all">
                            Reject
                          </button>
                        </div>
                      )}
                    </div>
                  ))}
                </div>
              )}
            </div>
          )}
        </div>
      </div>
    </main>
  );
}
