"use client";

import { useState } from "react";
import { createClient } from "@/lib/supabase/client";
import { useRouter } from "next/navigation";
import SiteFooter from "@/components/SiteFooter";

type User = { id: string; email: string; name: string | null; };
type Profile = { company_name: string; contact_name: string | null; region: string | null; phone: string | null; wechat: string | null; } | null;
type FabricRequest = { id: string; created_at: string; client_name: string | null; client_email: string | null; user_input: string; ai_output: unknown; status: string | null; };
type Quote = { id: string; request_id: string; supplier_name: string; price: string | null; moq: string | null; note: string | null; lead_time: string | null; supplier_region: string | null; is_contact_released: boolean | null; };

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

export default function SupplierDashboardClient({ user, profile, requests, myQuotes }: Props) {
  const [activeTab, setActiveTab] = useState<"requests" | "quotes" | "profile">("requests");
  const [loggingOut, setLoggingOut] = useState(false);
  const [quoteForm, setQuoteForm] = useState<{ requestId: string; open: boolean }>({ requestId: "", open: false });
  const [formData, setFormData] = useState({ price: "", moq: "", lead_time: "", note: "", supplier_region: profile?.region || "" });
  const [submitting, setSubmitting] = useState(false);
  const [successId, setSuccessId] = useState<string | null>(null);
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

  const router = useRouter();
  const supabase = createClient();

  const quotedRequestIds = new Set(myQuotes.map((q) => q.request_id));
  const pendingRequests = requests.filter((r) => !quotedRequestIds.has(r.id));

  async function handleLogout() {
    setLoggingOut(true);
    await supabase.auth.signOut();
    router.push("/supplier/auth");
    router.refresh();
  }

  async function submitQuote(e: React.FormEvent) {
    e.preventDefault();
    if (!formData.price.trim() || !formData.moq.trim()) { alert("Price and MOQ are required."); return; }
    setSubmitting(true);
    try {
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

      // Notify buyer that quotes are ready
      try {
        const { data: requestData } = await supabase
          .from("fabric_requests")
          .select("client_email, client_name, id")
          .eq("id", quoteForm.requestId)
          .single();

        if (requestData?.client_email) {
          await fetch("/api/email/notify-quotes", {
            method: "POST",
            headers: { "Content-Type": "application/json" },
            body: JSON.stringify({
              buyerEmail: requestData.client_email,
              buyerName: requestData.client_name,
              requestId: requestData.id,
              quoteCount: 1,
            }),
          });
        }
      } catch (emailErr) {
        console.error("Quote notification email failed:", emailErr);
      }

      // Update request status to quoted
      await supabase
        .from("fabric_requests")
        .update({ status: "quoted" })
        .eq("id", quoteForm.requestId);

      setSuccessId(quoteForm.requestId);
      setQuoteForm({ requestId: "", open: false });
      setFormData({ price: "", moq: "", lead_time: "", note: "", supplier_region: profile?.region || "" });
      router.refresh();
    } catch (err: any) {
      alert(err.message || "Failed to submit quote.");
    } finally {
      setSubmitting(false);
    }
  }

  async function saveProfile(e: React.FormEvent) {
    e.preventDefault();
    setSavingProfile(true);
    setProfileMsg(null);
    try {
      const { error } = await supabase.from("supplier_profiles")
        .update({
          company_name: profileForm.company_name.trim(),
          contact_name: profileForm.contact_name.trim(),
          phone: profileForm.phone.trim(),
          wechat: profileForm.wechat.trim(),
          region: profileForm.region.trim(),
        })
        .eq("user_id", user.id);
      if (error) throw error;
      setProfileMsg("Profile updated successfully.");
      setEditProfile(false);
    } catch (err: any) {
      setProfileMsg(err.message || "Failed to update profile.");
    } finally {
      setSavingProfile(false);
    }
  }

  return (
    <main className="min-h-screen bg-[#0a0f1e] px-3 py-3 md:px-4 md:py-4 font-sans">
      <div className="max-w-5xl mx-auto flex flex-col gap-3">

        {/* Header */}
        <nav className="bg-[#0d1424] border border-white/8 rounded-2xl px-4 py-3 flex items-center justify-between gap-4">
          <a href="/" className="flex items-center gap-2 no-underline shrink-0">
            <span className="w-9 h-9 rounded-full bg-gradient-to-br from-amber-500 to-amber-700 flex items-center justify-center text-white font-black text-sm shadow-lg shadow-amber-500/30">W</span>
            <span className="text-white font-black text-xl tracking-tight">Weinly</span>
          </a>
          <div className="flex items-center gap-3">
            <span className="hidden md:block text-slate-500 text-sm">{user.email}</span>
            <button onClick={handleLogout} disabled={loggingOut} className="bg-white/6 border border-white/10 text-slate-400 font-semibold text-sm px-4 py-2 rounded-xl cursor-pointer hover:bg-white/10 transition-all disabled:opacity-60 border-0">
              {loggingOut ? "..." : "Log out"}
            </button>
          </div>
        </nav>

        {/* Welcome banner */}
        <section className="relative overflow-hidden bg-gradient-to-br from-[#1a0f00] via-[#1a1200] to-[#0f0a00] border border-amber-500/15 rounded-3xl p-6 md:p-8 shadow-2xl shadow-amber-500/8">
          <div className="absolute top-0 right-0 w-64 h-64 bg-amber-500/8 rounded-full blur-3xl -translate-y-1/2 translate-x-1/2 pointer-events-none" />
          <div className="relative z-10 flex flex-col md:flex-row justify-between gap-4 items-start md:items-center">
            <div>
              <div className="inline-flex items-center gap-2 bg-amber-500/10 border border-amber-500/25 rounded-full px-4 py-1.5 mb-3">
                <span className="w-2 h-2 rounded-full bg-amber-400" />
                <span className="text-amber-300 text-xs font-semibold">Supplier portal</span>
              </div>
              <h1 className="text-2xl md:text-3xl font-black text-white tracking-tight mb-1">
                {profile?.company_name || user.name || "Supplier dashboard"}
              </h1>
              <p className="text-slate-400 text-sm m-0">{profile?.region || user.email}</p>
            </div>
            <div className="grid grid-cols-3 gap-3">
              {[
                { value: String(pendingRequests.length), label: "New requests", color: "text-amber-400" },
                { value: String(myQuotes.length), label: "Quotes sent", color: "text-sky-400" },
                { value: String(myQuotes.filter(q => q.is_contact_released).length), label: "Deals closed", color: "text-emerald-400" },
              ].map((s) => (
                <div key={s.label} className="bg-white/5 border border-white/8 rounded-2xl p-3 text-center">
                  <div className={`text-2xl font-black ${s.color}`}>{s.value}</div>
                  <div className="text-slate-600 text-xs mt-0.5">{s.label}</div>
                </div>
              ))}
            </div>
          </div>
        </section>

        {/* Tabs */}
        <section className="bg-[#111827] border border-white/7 rounded-3xl p-4 md:p-6">
          <div className="flex gap-2 mb-6 bg-white/4 border border-white/7 rounded-2xl p-1.5">
            {(["requests", "quotes", "profile"] as const).map((tab) => (
              <button key={tab} onClick={() => setActiveTab(tab)}
                className={`flex-1 py-2.5 px-3 rounded-xl text-xs md:text-sm font-bold border-0 cursor-pointer transition-all ${activeTab === tab ? "bg-gradient-to-r from-amber-500 to-amber-700 text-white shadow-lg shadow-amber-500/25" : "text-slate-500 bg-transparent hover:text-slate-300"}`}>
                {tab === "requests" ? `Open requests (${pendingRequests.length})` : tab === "quotes" ? `My quotes (${myQuotes.length})` : "Profile"}
              </button>
            ))}
          </div>

          {/* OPEN REQUESTS TAB */}
          {activeTab === "requests" && (
            <div className="flex flex-col gap-4">
              <div>
                <h2 className="text-xl font-black text-white tracking-tight mb-1">Open buyer requests</h2>
                <p className="text-slate-500 text-sm m-0">These are buyers actively looking for fabric suppliers. Submit a quote to get matched.</p>
              </div>

              {pendingRequests.length === 0 ? (
                <div className="border border-dashed border-white/10 bg-white/2 rounded-2xl p-10 text-center">
                  <div className="text-4xl mb-3">◎</div>
                  <div className="text-slate-400 font-bold mb-2">No new requests right now</div>
                  <p className="text-slate-600 text-sm m-0">New buyer requests will appear here. Check back soon.</p>
                </div>
              ) : (
                pendingRequests.map((request) => (
                  <div key={request.id} className="bg-white/3 border border-white/7 rounded-2xl p-5 flex flex-col gap-4">
                    <div className="flex justify-between gap-3 flex-wrap items-start">
                      <div>
                        <div className="text-slate-500 text-xs font-bold uppercase tracking-widest mb-1">Request ID</div>
                        <div className="text-slate-400 text-xs font-mono mb-2">{request.id}</div>
                        <div className="text-slate-500 text-xs">{new Date(request.created_at).toLocaleDateString()}</div>
                      </div>
                      {successId === request.id && (
                        <span className="bg-emerald-900/60 text-emerald-300 border border-emerald-500/30 text-xs font-bold px-3 py-1.5 rounded-full">Quote submitted ✓</span>
                      )}
                    </div>

                    <div className="bg-white/4 border border-white/7 rounded-xl p-4">
                      <div className="text-slate-500 text-xs font-bold uppercase tracking-widest mb-2">Buyer request</div>
                      <p className="text-slate-300 text-sm leading-relaxed m-0">{request.user_input}</p>
                    </div>

                    {request.ai_output != null && (
                      <div className="bg-white/4 border border-white/7 rounded-xl p-4">
                        <div className="text-slate-500 text-xs font-bold uppercase tracking-widest mb-2">AI sourcing spec</div>
                        <p className="text-slate-400 text-sm leading-relaxed m-0 whitespace-pre-wrap">{formatAiOutput(request.ai_output)}</p>
                      </div>
                    )}

                    {/* Quote form */}
                    {quoteForm.open && quoteForm.requestId === request.id ? (
                      <form onSubmit={submitQuote} className="bg-amber-500/6 border border-amber-500/20 rounded-2xl p-5 flex flex-col gap-4">
                        <h4 className="text-white font-bold text-base m-0">Submit your quote</h4>
                        <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
                          {[
                            { label: "Price per yard/piece *", key: "price", placeholder: "e.g. $2.50/yard" },
                            { label: "Minimum order qty *", key: "moq", placeholder: "e.g. 500 yards" },
                            { label: "Lead time", key: "lead_time", placeholder: "e.g. 15-20 days" },
                            { label: "Your region", key: "supplier_region", placeholder: "e.g. Guangzhou, China" },
                          ].map((field) => (
                            <div key={field.key} className="flex flex-col gap-1.5">
                              <label className="text-slate-400 text-xs font-bold uppercase tracking-wider">{field.label}</label>
                              <input
                                value={formData[field.key as keyof typeof formData]}
                                onChange={(e) => setFormData({ ...formData, [field.key]: e.target.value })}
                                placeholder={field.placeholder}
                                className="w-full px-4 py-3 rounded-xl bg-white/5 border border-white/10 text-white text-sm placeholder:text-slate-600 outline-none focus:border-amber-500 transition-all"
                              />
                            </div>
                          ))}
                        </div>
                        <div className="flex flex-col gap-1.5">
                          <label className="text-slate-400 text-xs font-bold uppercase tracking-wider">Additional note</label>
                          <textarea
                            value={formData.note}
                            onChange={(e) => setFormData({ ...formData, note: e.target.value })}
                            placeholder="Any additional details about your product, certifications, samples, etc."
                            rows={3}
                            className="w-full px-4 py-3 rounded-xl bg-white/5 border border-white/10 text-white text-sm placeholder:text-slate-600 outline-none focus:border-amber-500 transition-all resize-none"
                          />
                        </div>
                        <div className="flex gap-3 flex-wrap">
                          <button type="submit" disabled={submitting} className="bg-gradient-to-r from-amber-500 to-amber-700 text-white font-bold text-sm px-6 py-3 rounded-xl border-0 cursor-pointer shadow-lg shadow-amber-500/25 disabled:opacity-60">
                            {submitting ? "Submitting..." : "Submit quote & notify buyer →"}
                          </button>
                          <button type="button" onClick={() => setQuoteForm({ requestId: "", open: false })} className="bg-white/6 border border-white/10 text-slate-400 font-semibold text-sm px-6 py-3 rounded-xl cursor-pointer hover:bg-white/10 transition-all border-0">
                            Cancel
                          </button>
                        </div>
                      </form>
                    ) : (
                      successId !== request.id && (
                        <button
                          onClick={() => setQuoteForm({ requestId: request.id, open: true })}
                          className="self-start bg-gradient-to-r from-amber-500 to-amber-700 text-white font-bold text-sm px-6 py-3 rounded-xl border-0 cursor-pointer shadow-lg shadow-amber-500/20">
                          Submit a quote →
                        </button>
                      )
                    )}
                  </div>
                ))
              )}
            </div>
          )}

          {/* MY QUOTES TAB */}
          {activeTab === "quotes" && (
            <div className="flex flex-col gap-4">
              <div>
                <h2 className="text-xl font-black text-white tracking-tight mb-1">My submitted quotes</h2>
                <p className="text-slate-500 text-sm m-0">All quotes you have submitted to buyers.</p>
              </div>

              {myQuotes.length === 0 ? (
                <div className="border border-dashed border-white/10 bg-white/2 rounded-2xl p-10 text-center">
                  <div className="text-4xl mb-3">◎</div>
                  <div className="text-slate-400 font-bold mb-2">No quotes yet</div>
                  <p className="text-slate-600 text-sm m-0">Go to open requests and submit your first quote.</p>
                </div>
              ) : (
                myQuotes.map((quote) => (
                  <div key={quote.id} className="bg-white/3 border border-white/7 rounded-2xl p-5 flex flex-col gap-3">
                    <div className="flex justify-between gap-3 flex-wrap items-start">
                      <div>
                        <div className="text-slate-500 text-xs font-bold uppercase tracking-widest mb-1">Request ID</div>
                        <div className="text-slate-400 text-xs font-mono">{quote.request_id}</div>
                      </div>
                      <span className={`text-xs font-bold px-3 py-1.5 rounded-full ${quote.is_contact_released ? "bg-emerald-900/60 text-emerald-300 border border-emerald-500/30" : "bg-blue-900/60 text-blue-300 border border-blue-500/30"}`}>
                        {quote.is_contact_released ? "Deal closed ✓" : "Awaiting buyer"}
                      </span>
                    </div>
                    <div className="grid grid-cols-2 md:grid-cols-4 gap-2.5">
                      {[
                        { label: "Price", value: quote.price || "—" },
                        { label: "MOQ", value: quote.moq || "—" },
                        { label: "Lead time", value: quote.lead_time || "—" },
                        { label: "Region", value: quote.supplier_region || "—" },
                      ].map((s) => (
                        <div key={s.label} className="bg-white/4 border border-white/7 rounded-xl p-3">
                          <div className="text-slate-600 text-xs font-bold uppercase tracking-wider mb-1">{s.label}</div>
                          <div className="text-white font-semibold text-sm">{s.value}</div>
                        </div>
                      ))}
                    </div>
                    {quote.note && (
                      <div className="bg-white/4 border border-white/7 rounded-xl p-3">
                        <div className="text-slate-500 text-xs font-bold uppercase tracking-widest mb-1.5">Your note</div>
                        <p className="text-slate-400 text-sm leading-relaxed m-0">{quote.note}</p>
                      </div>
                    )}
                    {quote.is_contact_released && (
                      <div className="bg-emerald-500/6 border border-emerald-500/20 rounded-xl p-3 text-emerald-300 text-sm leading-relaxed">
                        <strong>Buyer has unlocked your contact.</strong> They may reach out directly via the contact details on your profile.
                      </div>
                    )}
                  </div>
                ))
              )}
            </div>
          )}

          {/* PROFILE TAB */}
          {activeTab === "profile" && (
            <div className="flex flex-col gap-4">
              <div className="flex justify-between items-center gap-3 flex-wrap">
                <div>
                  <h2 className="text-xl font-black text-white tracking-tight mb-1">Supplier profile</h2>
                  <p className="text-slate-500 text-sm m-0">This information is shown to buyers when your contact is released.</p>
                </div>
                <button onClick={() => setEditProfile(!editProfile)} className="bg-amber-500/10 border border-amber-500/20 text-amber-400 font-bold text-sm px-5 py-2.5 rounded-xl cursor-pointer hover:bg-amber-500/15 transition-all border-0">
                  {editProfile ? "Cancel" : "Edit profile"}
                </button>
              </div>

              {profileMsg && (
                <div className="bg-emerald-500/8 border border-emerald-500/20 rounded-xl p-4 text-emerald-300 text-sm">{profileMsg}</div>
              )}

              {editProfile ? (
                <form onSubmit={saveProfile} className="flex flex-col gap-4">
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
                    {[
                      { label: "Company name", key: "company_name", placeholder: "Your company name" },
                      { label: "Contact name", key: "contact_name", placeholder: "Your name" },
                      { label: "Phone / WhatsApp", key: "phone", placeholder: "+86 138 0000 0000" },
                      { label: "WeChat ID", key: "wechat", placeholder: "WeChat username" },
                      { label: "Region / city", key: "region", placeholder: "e.g. Guangzhou, China" },
                    ].map((field) => (
                      <div key={field.key} className="flex flex-col gap-1.5">
                        <label className="text-slate-400 text-xs font-bold uppercase tracking-wider">{field.label}</label>
                        <input
                          value={profileForm[field.key as keyof typeof profileForm]}
                          onChange={(e) => setProfileForm({ ...profileForm, [field.key]: e.target.value })}
                          placeholder={field.placeholder}
                          className="w-full px-4 py-3 rounded-xl bg-white/5 border border-white/10 text-white text-sm placeholder:text-slate-600 outline-none focus:border-amber-500 transition-all"
                        />
                      </div>
                    ))}
                  </div>
                  <button type="submit" disabled={savingProfile} className="self-start bg-gradient-to-r from-amber-500 to-amber-700 text-white font-bold text-sm px-6 py-3 rounded-xl border-0 cursor-pointer shadow-lg shadow-amber-500/25 disabled:opacity-60">
                    {savingProfile ? "Saving..." : "Save profile →"}
                  </button>
                </form>
              ) : (
                <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
                  {[
                    { label: "Company name", value: profile?.company_name || "—" },
                    { label: "Contact name", value: profile?.contact_name || "—" },
                    { label: "Phone / WhatsApp", value: profile?.phone || "Not set" },
                    { label: "WeChat ID", value: profile?.wechat || "Not set" },
                    { label: "Region", value: profile?.region || "Not set" },
                    { label: "Email", value: user.email },
                  ].map((info) => (
                    <div key={info.label} className="bg-white/4 border border-white/7 rounded-xl p-4">
                      <div className="text-slate-500 text-xs font-bold uppercase tracking-widest mb-1">{info.label}</div>
                      <div className="text-white text-sm font-semibold break-words">{info.value}</div>
                    </div>
                  ))}
                </div>
              )}

              <div className="bg-amber-500/6 border border-amber-500/20 rounded-2xl p-5 mt-2">
                <h3 className="text-amber-300 font-bold text-sm mb-2 m-0">Important — keep your contact details updated</h3>
                <p className="text-slate-500 text-xs leading-relaxed m-0">When a buyer unlocks your contact, Weinly releases your phone number, WeChat and email directly to them. Make sure these are always accurate so buyers can reach you.</p>
              </div>
            </div>
          )}
        </section>

        <SiteFooter />
      </div>
    </main>
  );
}