"use client";

import { useEffect, useMemo, useState } from "react";
import { createClient } from "@supabase/supabase-js";

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL!;
const supabaseAnonKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!;
const supabase = createClient(supabaseUrl, supabaseAnonKey);

const ADMIN_PASSWORD = process.env.NEXT_PUBLIC_ADMIN_PASSWORD || "weinlyadmin123";

type FabricRequest = {
  id: string;
  created_at: string;
  client_name: string | null;
  client_email: string | null;
  client_phone: string | null;
  user_input: string;
  ai_output: unknown;
  status: string | null;
  internal_note: string | null;
  buyer_requested_contact: boolean | null;
  contact_request_status: string | null;
  contact_access_fee: string | null;
  payment_status: string | null;
  payment_reference: string | null;
  paid_at: string | null;
};

type Quote = {
  id: string;
  request_id: string;
  supplier_name: string;
  price: string | null;
  moq: string | null;
  note: string | null;
  contact_name: string | null;
  contact_phone: string | null;
  contact_wechat: string | null;
  contact_email: string | null;
  supplier_region: string | null;
  lead_time: string | null;
  is_contact_released: boolean | null;
};

type SupplierProfile = {
  id: string;
  user_id: string;
  company_name: string;
  contact_name: string | null;
  email: string | null;
  phone: string | null;
  wechat: string | null;
  region: string | null;
  is_active: boolean | null;
  created_at: string;
};

type SupplierInvite = {
  id: string;
  code: string;
  email: string | null;
  used: boolean;
  used_at: string | null;
  created_at: string;
};

type NewQuoteForm = {
  supplier_name: string;
  price: string;
  moq: string;
  note: string;
  contact_name: string;
  contact_phone: string;
  contact_wechat: string;
  contact_email: string;
  supplier_region: string;
  lead_time: string;
};

const emptyQuoteForm: NewQuoteForm = {
  supplier_name: "", price: "", moq: "", note: "",
  contact_name: "", contact_phone: "", contact_wechat: "",
  contact_email: "", supplier_region: "", lead_time: "",
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
  if (request.contact_request_status === "approved") return { cls: "bg-emerald-900/60 text-emerald-300 border border-emerald-500/30", label: "Contact released" };
  if (request.payment_status === "paid" && request.contact_request_status === "pending") return { cls: "bg-violet-900/60 text-violet-300 border border-violet-500/30", label: "Paid — needs approval" };
  if (request.payment_status === "paid") return { cls: "bg-violet-900/60 text-violet-300 border border-violet-500/30", label: "Paid" };
  if (quoteCount > 0) return { cls: "bg-blue-900/60 text-blue-300 border border-blue-500/30", label: "Quotes ready" };
  return { cls: "bg-amber-900/60 text-amber-300 border border-amber-500/30", label: "In progress" };
}

async function sendPushNotification(buyerEmail: string, title: string, message: string, requestId: string) {
  try {
    await fetch("/api/push/notify-buyer", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ buyerEmail, title, message, requestId }),
    });
  } catch (e) {
    console.error("Push notification failed:", e);
  }
}

export default function AdminPage() {
  const [authenticated, setAuthenticated] = useState(false);
  const [password, setPassword] = useState("");
  const [loading, setLoading] = useState(true);
  const [activeTab, setActiveTab] = useState<"requests" | "suppliers" | "invites">("requests");

  const [requests, setRequests] = useState<FabricRequest[]>([]);
  const [quotesMap, setQuotesMap] = useState<Record<string, Quote[]>>({});
  const [suppliers, setSuppliers] = useState<SupplierProfile[]>([]);
  const [invites, setInvites] = useState<SupplierInvite[]>([]);
  const [search, setSearch] = useState("");
  const [newQuotes, setNewQuotes] = useState<Record<string, NewQuoteForm>>({});
  const [expandedId, setExpandedId] = useState<string | null>(null);

  const [newInviteCode, setNewInviteCode] = useState("");
  const [newInviteEmail, setNewInviteEmail] = useState("");
  const [creatingInvite, setCreatingInvite] = useState(false);

  useEffect(() => {
    const stored = localStorage.getItem("weinly_admin_auth");
    if (stored === "true") { setAuthenticated(true); fetchAll(); }
    else setLoading(false);
  }, []);

  async function fetchAll() {
    setLoading(true);
    try {
      const [reqRes, quotesRes, suppliersRes, invitesRes] = await Promise.all([
        supabase.from("fabric_requests").select("*").order("created_at", { ascending: false }),
        supabase.from("quotes").select("*").order("id", { ascending: false }),
        supabase.from("supplier_profiles").select("*").order("created_at", { ascending: false }),
        supabase.from("supplier_invites").select("*").order("created_at", { ascending: false }),
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
    } catch { alert("Failed to load admin data."); }
    finally { setLoading(false); }
  }

  function handleLogin() {
    if (password === ADMIN_PASSWORD) {
      setAuthenticated(true);
      localStorage.setItem("weinly_admin_auth", "true");
      fetchAll();
    } else {
      alert("Wrong password.");
    }
  }

  function handleLogout() {
    localStorage.removeItem("weinly_admin_auth");
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
        request_id: requestId,
        supplier_name: form.supplier_name.trim(),
        price: form.price || null,
        moq: form.moq || null,
        note: form.note || null,
        contact_name: form.contact_name || null,
        contact_phone: form.contact_phone || null,
        contact_wechat: form.contact_wechat || null,
        contact_email: form.contact_email || null,
        supplier_region: form.supplier_region || null,
        lead_time: form.lead_time || null,
        is_contact_released: false,
      }]);
      if (error) throw error;

      await supabase.from("fabric_requests").update({ status: "quoted" }).eq("id", requestId);

      // Notify buyer by email
      try {
        const request = requests.find((r) => r.id === requestId);
        if (request?.client_email) {
          await fetch("/api/email/notify-quotes", {
            method: "POST",
            headers: { "Content-Type": "application/json" },
            body: JSON.stringify({
              buyerEmail: request.client_email,
              buyerName: request.client_name,
              requestId,
              quoteCount: (quotesMap[requestId]?.length || 0) + 1,
            }),
          });
        }
      } catch (e) {
        console.error("Quote email notification failed:", e);
      }

      // Notify buyer by push notification
      try {
        const request = requests.find((r) => r.id === requestId);
        if (request?.client_email) {
          await sendPushNotification(
            request.client_email,
            "Your quotes are ready 🎉",
            "A verified supplier has responded to your fabric request. Tap to review.",
            requestId
          );
        }
      } catch (e) {
        console.error("Quote push notification failed:", e);
      }

      setNewQuotes((prev) => ({ ...prev, [requestId]: { ...emptyQuoteForm } }));
      await fetchAll();
      alert("Quote added and buyer notified.");
    } catch { alert("Failed to add quote."); }
  }

  async function updateRequestStatus(requestId: string, status: string) {
    try {
      await supabase.from("fabric_requests").update({ status }).eq("id", requestId);
      await fetchAll();
    } catch { alert("Failed to update status."); }
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
    try {
      await supabase.from("fabric_requests").update({ internal_note: note }).eq("id", requestId);
    } catch { alert("Failed to save note."); }
  }

  async function approveContactRelease(requestId: string, paymentStatus?: string | null) {
    if (paymentStatus !== "paid") {
      alert("Payment must be confirmed before releasing supplier contact.");
      return;
    }
    try {
      await supabase.from("fabric_requests").update({ contact_request_status: "approved" }).eq("id", requestId);
      await supabase.from("quotes").update({ is_contact_released: true }).eq("request_id", requestId);

      // Notify buyer by email
      try {
        const request = requests.find((r) => r.id === requestId);
        if (request?.client_email) {
          await fetch("/api/email/notify-contact-approved", {
            method: "POST",
            headers: { "Content-Type": "application/json" },
            body: JSON.stringify({
              buyerEmail: request.client_email,
              buyerName: request.client_name,
              requestId,
            }),
          });
        }
      } catch (e) {
        console.error("Contact approval email failed:", e);
      }

      // Notify buyer by push notification
      try {
        const request = requests.find((r) => r.id === requestId);
        if (request?.client_email) {
          await sendPushNotification(
            request.client_email,
            "Supplier contact approved ✓",
            "Your supplier contact details are now available. Tap to view.",
            requestId
          );
        }
      } catch (e) {
        console.error("Contact approval push notification failed:", e);
      }

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
    try {
      await supabase.from("supplier_profiles").update({ is_active: !current }).eq("id", supplierId);
      await fetchAll();
    } catch { alert("Failed to update supplier."); }
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
      setNewInviteCode("");
      setNewInviteEmail("");
      await fetchAll();
      alert("Invite code created.");
    } catch (err: any) {
      alert(err.message || "Failed to create invite.");
    } finally {
      setCreatingInvite(false);
    }
  }

  async function deleteInvite(inviteId: string) {
    if (!window.confirm("Delete this invite code?")) return;
    try {
      await supabase.from("supplier_invites").delete().eq("id", inviteId);
      await fetchAll();
    } catch { alert("Failed to delete invite."); }
  }

  const filteredRequests = useMemo(() => {
    const q = search.toLowerCase().trim();
    if (!q) return requests;
    return requests.filter((r) =>
      r.id.toLowerCase().includes(q) ||
      (r.client_name || "").toLowerCase().includes(q) ||
      (r.client_email || "").toLowerCase().includes(q) ||
      (r.client_phone || "").toLowerCase().includes(q) ||
      r.user_input.toLowerCase().includes(q)
    );
  }, [requests, search]);

  const stats = useMemo(() => ({
    total: requests.length,
    pendingApproval: requests.filter((r) => r.payment_status === "paid" && r.contact_request_status === "pending").length,
    released: requests.filter((r) => r.contact_request_status === "approved").length,
    totalRevenue: requests.filter((r) => r.payment_status === "paid").length * 10000,
    activeSuppliers: suppliers.filter((s) => s.is_active).length,
    unusedInvites: invites.filter((i) => !i.used).length,
  }), [requests, suppliers, invites]);

  if (loading) {
    return (
      <main className="min-h-screen bg-[#0a0f1e] flex items-center justify-center font-sans">
        <div className="text-slate-400 text-sm">Loading...</div>
      </main>
    );
  }

  if (!authenticated) {
    return (
      <main className="min-h-screen bg-[#0a0f1e] flex items-center justify-center px-4 font-sans">
        <div className="w-full max-w-sm bg-[#111827] border border-white/7 rounded-3xl p-8 shadow-xl">
          <div className="flex items-center gap-2 mb-6">
            <span className="w-9 h-9 rounded-full bg-gradient-to-br from-red-500 to-red-700 flex items-center justify-center text-white font-black text-sm">W</span>
            <span className="text-white font-black text-xl">Weinly Admin</span>
          </div>
          <p className="text-slate-500 text-sm mb-4">Enter admin password to continue.</p>
          <input
            type="password"
            value={password}
            onChange={(e) => setPassword(e.target.value)}
            onKeyDown={(e) => e.key === "Enter" && handleLogin()}
            placeholder="Admin password"
            className="w-full px-4 py-3 rounded-xl bg-white/5 border border-white/10 text-white text-sm placeholder:text-slate-600 outline-none focus:border-red-500 transition-all mb-3"
          />
          <button onClick={handleLogin} className="w-full bg-gradient-to-r from-red-500 to-red-700 text-white font-bold text-sm py-3 rounded-xl border-0 cursor-pointer shadow-lg shadow-red-500/25">
            Login to Admin
          </button>
        </div>
      </main>
    );
  }

  return (
    <main className="min-h-screen bg-[#0a0f1e] px-3 py-3 md:px-4 md:py-4 font-sans">
      <div className="max-w-6xl mx-auto flex flex-col gap-3">

        {/* Header */}
        <nav className="bg-[#0d1424] border border-white/8 rounded-2xl px-4 py-3 flex items-center justify-between gap-4">
          <div className="flex items-center gap-2">
            <span className="w-9 h-9 rounded-full bg-gradient-to-br from-red-500 to-red-700 flex items-center justify-center text-white font-black text-sm shadow-lg shadow-red-500/30">W</span>
            <div>
              <span className="text-white font-black text-lg">Weinly Admin</span>
              <span className="ml-2 bg-red-500/15 text-red-400 text-xs font-bold px-2 py-0.5 rounded-full border border-red-500/25">Admin</span>
            </div>
          </div>
          <div className="flex gap-2">
            <button onClick={fetchAll} className="bg-white/6 border border-white/10 text-slate-400 font-semibold text-xs px-4 py-2 rounded-xl cursor-pointer hover:bg-white/10 transition-all border-0">
              Refresh
            </button>
            <button onClick={handleLogout} className="bg-red-500/10 border border-red-500/20 text-red-400 font-semibold text-xs px-4 py-2 rounded-xl cursor-pointer hover:bg-red-500/15 transition-all border-0">
              Logout
            </button>
          </div>
        </nav>

        {/* Stats */}
        <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-6 gap-3">
          {[
            { label: "Total requests", value: String(stats.total), color: "text-indigo-400", bg: "bg-indigo-500/8 border-indigo-500/20" },
            { label: "Needs approval", value: String(stats.pendingApproval), color: "text-violet-400", bg: "bg-violet-500/8 border-violet-500/20" },
            { label: "Contacts released", value: String(stats.released), color: "text-emerald-400", bg: "bg-emerald-500/8 border-emerald-500/20" },
            { label: "Total revenue", value: `₦${stats.totalRevenue.toLocaleString()}`, color: "text-amber-400", bg: "bg-amber-500/8 border-amber-500/20" },
            { label: "Active suppliers", value: String(stats.activeSuppliers), color: "text-sky-400", bg: "bg-sky-500/8 border-sky-500/20" },
            { label: "Unused invites", value: String(stats.unusedInvites), color: "text-pink-400", bg: "bg-pink-500/8 border-pink-500/20" },
          ].map((stat) => (
            <div key={stat.label} className={`${stat.bg} border rounded-2xl p-3`}>
              <div className={`text-2xl font-black ${stat.color} mb-0.5`}>{stat.value}</div>
              <div className="text-slate-600 text-xs font-semibold">{stat.label}</div>
            </div>
          ))}
        </div>

        {/* Tabs */}
        <div className="bg-[#111827] border border-white/7 rounded-3xl p-4 md:p-6">
          <div className="flex gap-2 mb-6 bg-white/4 border border-white/7 rounded-2xl p-1.5">
            {(["requests", "suppliers", "invites"] as const).map((tab) => (
              <button key={tab} onClick={() => setActiveTab(tab)}
                className={`flex-1 py-2.5 px-3 rounded-xl text-xs md:text-sm font-bold border-0 cursor-pointer transition-all ${activeTab === tab ? "bg-gradient-to-r from-red-500 to-red-700 text-white shadow-lg shadow-red-500/25" : "text-slate-500 bg-transparent hover:text-slate-300"}`}>
                {tab === "requests" ? `Requests (${requests.length})` : tab === "suppliers" ? `Suppliers (${suppliers.length})` : `Invites (${invites.length})`}
              </button>
            ))}
          </div>

          {/* REQUESTS TAB */}
          {activeTab === "requests" && (
            <div className="flex flex-col gap-4">
              <input
                value={search}
                onChange={(e) => setSearch(e.target.value)}
                placeholder="Search by ID, name, email, phone or request text..."
                className="w-full px-4 py-3 rounded-xl bg-white/5 border border-white/10 text-white text-sm placeholder:text-slate-600 outline-none focus:border-red-500 transition-all"
              />

              {filteredRequests.length === 0 ? (
                <div className="border border-dashed border-white/10 rounded-2xl p-10 text-center text-slate-600 text-sm">No requests found.</div>
              ) : (
                filteredRequests.map((request) => {
                  const quotes = quotesMap[request.id] || [];
                  const pill = getStagePill(request, quotes.length);
                  const isExpanded = expandedId === request.id;

                  return (
                    <div key={request.id} className="bg-white/3 border border-white/7 rounded-2xl overflow-hidden">
                      <div className="p-4 flex justify-between gap-3 flex-wrap items-start cursor-pointer hover:bg-white/2 transition-all" onClick={() => setExpandedId(isExpanded ? null : request.id)}>
                        <div className="flex flex-col gap-1.5 min-w-0">
                          <div className="flex items-center gap-2 flex-wrap">
                            <span className="text-white font-bold text-sm">{request.client_name || "Unnamed buyer"}</span>
                            <span className={`text-xs font-bold px-2.5 py-1 rounded-full ${pill.cls}`}>{pill.label}</span>
                            {request.payment_status === "paid" && request.contact_request_status === "pending" && (
                              <span className="bg-red-500/15 text-red-400 border border-red-500/25 text-xs font-bold px-2.5 py-1 rounded-full animate-pulse">Action needed</span>
                            )}
                          </div>
                          <div className="text-slate-500 text-xs">{request.client_email || "—"} · {new Date(request.created_at).toLocaleDateString()}</div>
                          <div className="text-slate-600 text-xs font-mono">{request.id}</div>
                        </div>
                        <div className="flex items-center gap-3 shrink-0">
                          <div className="text-center">
                            <div className="text-white font-black text-lg">{quotes.length}</div>
                            <div className="text-slate-600 text-xs">quotes</div>
                          </div>
                          <span className={`text-slate-400 text-lg transition-transform duration-200 ${isExpanded ? "rotate-180" : ""}`}>↓</span>
                        </div>
                      </div>

                      {isExpanded && (
                        <div className="border-t border-white/6 p-4 flex flex-col gap-4">
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
                              <div key={info.label} className="bg-white/4 border border-white/7 rounded-xl p-3">
                                <div className="text-slate-600 text-xs font-bold uppercase tracking-wider mb-1">{info.label}</div>
                                <div className="text-slate-300 text-xs break-words">{info.value}</div>
                              </div>
                            ))}
                          </div>

                          <div className="bg-white/4 border border-white/7 rounded-xl p-4">
                            <div className="text-slate-500 text-xs font-bold uppercase tracking-widest mb-2">Fabric request</div>
                            <p className="text-slate-300 text-sm leading-relaxed m-0 whitespace-pre-wrap">{request.user_input}</p>
                          </div>

                          {request.ai_output != null && (
                            <div className="bg-white/4 border border-white/7 rounded-xl p-4">
                              <div className="text-slate-500 text-xs font-bold uppercase tracking-widest mb-2">AI sourcing spec</div>
                              <p className="text-slate-400 text-sm leading-relaxed m-0 whitespace-pre-wrap">{formatAiOutput(request.ai_output)}</p>
                            </div>
                          )}

                          <div className="flex flex-col gap-1.5">
                            <label className="text-slate-500 text-xs font-bold uppercase tracking-widest">Internal note</label>
                            <textarea
                              defaultValue={request.internal_note || ""}
                              onBlur={(e) => saveInternalNote(request.id, e.target.value)}
                              placeholder="Add internal notes here..."
                              rows={3}
                              className="w-full px-4 py-3 rounded-xl bg-white/5 border border-white/10 text-white text-sm placeholder:text-slate-600 outline-none focus:border-red-500 transition-all resize-none"
                            />
                          </div>

                          <div className="flex flex-col gap-3">
                            <div className="text-slate-500 text-xs font-bold uppercase tracking-widest">Request status</div>
                            <div className="flex gap-2 flex-wrap">
                              {["submitted", "quoted", "completed"].map((s) => (
                                <button key={s} onClick={() => updateRequestStatus(request.id, s)}
                                  className={`text-xs font-bold px-4 py-2 rounded-xl border-0 cursor-pointer transition-all ${request.status === s ? "bg-indigo-500/20 text-indigo-300 border border-indigo-500/30" : "bg-white/6 text-slate-400 hover:bg-white/10"}`}>
                                  {s.charAt(0).toUpperCase() + s.slice(1)}
                                </button>
                              ))}
                            </div>

                            <div className="text-slate-500 text-xs font-bold uppercase tracking-widest">Payment</div>
                            <div className="flex gap-2 flex-wrap">
                              <button onClick={() => updatePaymentStatus(request.id, "paid")} className="bg-emerald-500/10 border border-emerald-500/20 text-emerald-400 font-bold text-xs px-4 py-2 rounded-xl cursor-pointer hover:bg-emerald-500/15 transition-all border-0">
                                Mark paid
                              </button>
                              <button onClick={() => updatePaymentStatus(request.id, "unpaid")} className="bg-white/6 text-slate-400 font-bold text-xs px-4 py-2 rounded-xl cursor-pointer hover:bg-white/10 transition-all border-0">
                                Mark unpaid
                              </button>
                            </div>

                            <div className="text-slate-500 text-xs font-bold uppercase tracking-widest">Contact release</div>
                            <div className="flex gap-2 flex-wrap">
                              {request.contact_request_status === "pending" && (
                                <>
                                  <button onClick={() => approveContactRelease(request.id, request.payment_status)} className="bg-emerald-500/10 border border-emerald-500/20 text-emerald-400 font-bold text-xs px-4 py-2.5 rounded-xl cursor-pointer hover:bg-emerald-500/15 transition-all border-0 shadow-lg shadow-emerald-500/10">
                                    ✓ Approve & release contact
                                  </button>
                                  <button onClick={() => rejectContactRelease(request.id)} className="bg-red-500/10 border border-red-500/20 text-red-400 font-bold text-xs px-4 py-2.5 rounded-xl cursor-pointer hover:bg-red-500/15 transition-all border-0">
                                    ✕ Reject
                                  </button>
                                </>
                              )}
                              {request.contact_request_status === "approved" && (
                                <button onClick={() => revokeContactAccess(request.id)} className="bg-red-500/10 border border-red-500/20 text-red-400 font-bold text-xs px-4 py-2.5 rounded-xl cursor-pointer hover:bg-red-500/15 transition-all border-0">
                                  Revoke contact access
                                </button>
                              )}
                            </div>

                            <div className="pt-2 border-t border-white/6">
                              <button onClick={() => deleteRequest(request.id)} className="bg-red-500/8 border border-red-500/15 text-red-500 font-bold text-xs px-4 py-2 rounded-xl cursor-pointer hover:bg-red-500/15 transition-all border-0">
                                Delete request
                              </button>
                            </div>
                          </div>

                          {quotes.length > 0 && (
                            <div className="flex flex-col gap-3">
                              <div className="text-slate-500 text-xs font-bold uppercase tracking-widest">Existing quotes ({quotes.length})</div>
                              {quotes.map((quote) => (
                                <div key={quote.id} className="bg-white/4 border border-white/7 rounded-xl p-4 flex flex-col gap-3">
                                  <div className="flex justify-between gap-3 flex-wrap">
                                    <div className="text-white font-bold text-sm">{quote.supplier_name}</div>
                                    <span className={`text-xs font-bold px-3 py-1 rounded-full ${quote.is_contact_released ? "bg-emerald-900/60 text-emerald-300 border border-emerald-500/30" : "bg-blue-900/60 text-blue-300 border border-blue-500/30"}`}>
                                      {quote.is_contact_released ? "Released" : "Protected"}
                                    </span>
                                  </div>
                                  <div className="grid grid-cols-2 md:grid-cols-4 gap-2">
                                    {[
                                      { label: "Price", value: quote.price || "—" },
                                      { label: "MOQ", value: quote.moq || "—" },
                                      { label: "Lead time", value: quote.lead_time || "—" },
                                      { label: "Region", value: quote.supplier_region || "—" },
                                      { label: "Contact name", value: quote.contact_name || "—" },
                                      { label: "Phone", value: quote.contact_phone || "—" },
                                      { label: "WeChat", value: quote.contact_wechat || "—" },
                                      { label: "Email", value: quote.contact_email || "—" },
                                    ].map((s) => (
                                      <div key={s.label} className="bg-white/4 border border-white/7 rounded-lg p-2.5">
                                        <div className="text-slate-600 text-xs font-bold uppercase tracking-wider mb-0.5">{s.label}</div>
                                        <div className="text-slate-300 text-xs break-words">{s.value}</div>
                                      </div>
                                    ))}
                                  </div>
                                  {quote.note && (
                                    <div className="bg-white/4 border border-white/7 rounded-lg p-3">
                                      <div className="text-slate-600 text-xs font-bold uppercase tracking-widest mb-1">Note</div>
                                      <p className="text-slate-400 text-xs leading-relaxed m-0">{quote.note}</p>
                                    </div>
                                  )}
                                </div>
                              ))}
                            </div>
                          )}

                          <div className="bg-indigo-500/6 border border-indigo-500/20 rounded-2xl p-5 flex flex-col gap-4">
                            <div className="text-indigo-300 font-bold text-sm">Add new quote manually</div>
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
                                  <label className="text-slate-500 text-xs font-bold uppercase tracking-wider">{field.label}</label>
                                  <input
                                    value={newQuotes[request.id]?.[field.key as keyof NewQuoteForm] || ""}
                                    onChange={(e) => updateNewQuoteField(request.id, field.key as keyof NewQuoteForm, e.target.value)}
                                    placeholder={field.placeholder}
                                    className="w-full px-3 py-2.5 rounded-xl bg-white/5 border border-white/10 text-white text-sm placeholder:text-slate-600 outline-none focus:border-indigo-500 transition-all"
                                  />
                                </div>
                              ))}
                            </div>
                            <textarea
                              value={newQuotes[request.id]?.note || ""}
                              onChange={(e) => updateNewQuoteField(request.id, "note", e.target.value)}
                              placeholder="Supplier note..."
                              rows={3}
                              className="w-full px-4 py-3 rounded-xl bg-white/5 border border-white/10 text-white text-sm placeholder:text-slate-600 outline-none focus:border-indigo-500 transition-all resize-none"
                            />
                            <button onClick={() => addQuote(request.id)} className="self-start bg-gradient-to-r from-indigo-500 to-indigo-700 text-white font-bold text-sm px-6 py-3 rounded-xl border-0 cursor-pointer shadow-lg shadow-indigo-500/25">
                              Add quote & notify buyer →
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

          {/* SUPPLIERS TAB */}
          {activeTab === "suppliers" && (
            <div className="flex flex-col gap-4">
              <div>
                <h2 className="text-xl font-black text-white tracking-tight mb-1">Registered suppliers</h2>
                <p className="text-slate-500 text-sm m-0">{suppliers.length} supplier{suppliers.length === 1 ? "" : "s"} registered on the platform.</p>
              </div>

              {suppliers.length === 0 ? (
                <div className="border border-dashed border-white/10 rounded-2xl p-10 text-center text-slate-600 text-sm">No suppliers registered yet.</div>
              ) : (
                suppliers.map((supplier) => (
                  <div key={supplier.id} className="bg-white/3 border border-white/7 rounded-2xl p-5 flex flex-col gap-4">
                    <div className="flex justify-between gap-3 flex-wrap items-start">
                      <div>
                        <div className="text-white font-bold text-base mb-1">{supplier.company_name}</div>
                        <div className="text-slate-500 text-xs mb-0.5">{supplier.contact_name || "—"} · {supplier.email || "—"}</div>
                        <div className="text-slate-600 text-xs">{supplier.region || "Region not set"} · Joined {new Date(supplier.created_at).toLocaleDateString()}</div>
                      </div>
                      <div className="flex gap-2 items-center">
                        <span className={`text-xs font-bold px-3 py-1.5 rounded-full ${supplier.is_active ? "bg-emerald-900/60 text-emerald-300 border border-emerald-500/30" : "bg-red-900/60 text-red-300 border border-red-500/30"}`}>
                          {supplier.is_active ? "Active" : "Inactive"}
                        </span>
                        <button onClick={() => toggleSupplierActive(supplier.id, !!supplier.is_active)}
                          className={`text-xs font-bold px-3 py-1.5 rounded-xl border-0 cursor-pointer transition-all ${supplier.is_active ? "bg-red-500/10 text-red-400 hover:bg-red-500/15" : "bg-emerald-500/10 text-emerald-400 hover:bg-emerald-500/15"}`}>
                          {supplier.is_active ? "Deactivate" : "Activate"}
                        </button>
                      </div>
                    </div>
                    <div className="grid grid-cols-2 md:grid-cols-4 gap-2.5">
                      {[
                        { label: "Phone", value: supplier.phone || "—" },
                        { label: "WeChat", value: supplier.wechat || "—" },
                        { label: "Region", value: supplier.region || "—" },
                        { label: "Email", value: supplier.email || "—" },
                      ].map((info) => (
                        <div key={info.label} className="bg-white/4 border border-white/7 rounded-xl p-3">
                          <div className="text-slate-600 text-xs font-bold uppercase tracking-wider mb-1">{info.label}</div>
                          <div className="text-slate-300 text-xs break-words">{info.value}</div>
                        </div>
                      ))}
                    </div>
                  </div>
                ))
              )}
            </div>
          )}

          {/* INVITES TAB */}
          {activeTab === "invites" && (
            <div className="flex flex-col gap-4">
              <div>
                <h2 className="text-xl font-black text-white tracking-tight mb-1">Supplier invite codes</h2>
                <p className="text-slate-500 text-sm m-0">Generate and manage invite codes for new suppliers.</p>
              </div>

              <div className="bg-amber-500/6 border border-amber-500/20 rounded-2xl p-5 flex flex-col gap-4">
                <div className="text-amber-300 font-bold text-sm">Create new invite code</div>
                <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
                  <div className="flex flex-col gap-1.5">
                    <label className="text-slate-400 text-xs font-bold uppercase tracking-wider">Invite code *</label>
                    <input
                      value={newInviteCode}
                      onChange={(e) => setNewInviteCode(e.target.value.toUpperCase())}
                      placeholder="e.g. WEINLY-SUP-004"
                      className="w-full px-4 py-3 rounded-xl bg-white/5 border border-white/10 text-white text-sm placeholder:text-slate-600 outline-none focus:border-amber-500 transition-all"
                    />
                  </div>
                  <div className="flex flex-col gap-1.5">
                    <label className="text-slate-400 text-xs font-bold uppercase tracking-wider">Supplier email (optional)</label>
                    <input
                      value={newInviteEmail}
                      onChange={(e) => setNewInviteEmail(e.target.value)}
                      placeholder="supplier@company.com"
                      type="email"
                      className="w-full px-4 py-3 rounded-xl bg-white/5 border border-white/10 text-white text-sm placeholder:text-slate-600 outline-none focus:border-amber-500 transition-all"
                    />
                  </div>
                </div>
                <button onClick={createInvite} disabled={creatingInvite} className="self-start bg-gradient-to-r from-amber-500 to-amber-700 text-white font-bold text-sm px-6 py-3 rounded-xl border-0 cursor-pointer shadow-lg shadow-amber-500/25 disabled:opacity-60">
                  {creatingInvite ? "Creating..." : "Create invite code →"}
                </button>
              </div>

              {invites.length === 0 ? (
                <div className="border border-dashed border-white/10 rounded-2xl p-10 text-center text-slate-600 text-sm">No invite codes yet.</div>
              ) : (
                <div className="flex flex-col gap-3">
                  {invites.map((invite) => (
                    <div key={invite.id} className="bg-white/3 border border-white/7 rounded-2xl p-4 flex justify-between gap-3 flex-wrap items-center">
                      <div className="flex flex-col gap-1">
                        <div className="flex items-center gap-2">
                          <span className="text-white font-black text-base font-mono">{invite.code}</span>
                          <span className={`text-xs font-bold px-2.5 py-1 rounded-full ${invite.used ? "bg-slate-800 text-slate-400 border border-slate-600/30" : "bg-emerald-900/60 text-emerald-300 border border-emerald-500/30"}`}>
                            {invite.used ? "Used" : "Available"}
                          </span>
                        </div>
                        <div className="text-slate-500 text-xs">
                          {invite.email || "No email assigned"} · Created {new Date(invite.created_at).toLocaleDateString()}
                          {invite.used_at && ` · Used ${new Date(invite.used_at).toLocaleDateString()}`}
                        </div>
                      </div>
                      <div className="flex gap-2">
                        {!invite.used && (
                          <button onClick={() => navigator.clipboard.writeText(invite.code).then(() => alert("Code copied!"))}
                            className="bg-white/6 border border-white/10 text-slate-400 font-semibold text-xs px-4 py-2 rounded-xl cursor-pointer hover:bg-white/10 transition-all border-0">
                            Copy code
                          </button>
                        )}
                        <button onClick={() => deleteInvite(invite.id)} className="bg-red-500/8 border border-red-500/15 text-red-400 font-semibold text-xs px-4 py-2 rounded-xl cursor-pointer hover:bg-red-500/15 transition-all border-0">
                          Delete
                        </button>
                      </div>
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