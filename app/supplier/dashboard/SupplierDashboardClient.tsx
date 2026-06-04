"use client";

import { useEffect, useMemo, useState } from "react";
import { createClient } from "@/lib/supabase/client";
import { useRouter } from "next/navigation";
import SiteFooter from "@/components/SiteFooter";
import { FABRIC_CATEGORIES, getCategoryColor, getCategoryLabel } from "@/lib/categories";

type User = { id: string; email: string; name: string | null; };
type Profile = {
  company_name: string; contact_name: string | null; region: string | null;
  phone: string | null; wechat: string | null; categories?: string[] | null;
  is_verified?: boolean | null; bio?: string | null;
} | null;
type FabricRequest = {
  id: string; created_at: string; client_name: string | null; client_email: string | null;
  user_input: string; ai_output: unknown; status: string | null;
  category: string | null; subcategory: string | null;
};
type Quote = {
  id: string; request_id: string; supplier_name: string; price: string | null;
  moq: string | null; note: string | null; lead_time: string | null;
  supplier_region: string | null; is_contact_released: boolean | null;
};
type Review = {
  id: string; request_id: string; quote_id: string; buyer_name: string | null;
  buyer_email: string | null; rating: number; comment: string | null; created_at: string;
};
type ReadyStockItem = {
  id: string; name: string; description: string | null; category: string;
  subcategory: string | null; price_per_unit: string; unit: string; moq: string;
  available_quantity: string | null; is_sold_out: boolean | null; is_active: boolean | null;
  images: string[] | null; video_url: string | null;
};
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

function getIntentScore(r: FabricRequest) {
  const t = r.user_input.toLowerCase();
  let s = 0;
  if (t.length > 80) s++;
  if (t.includes("qty") || t.includes("yards") || t.includes("packs") || t.includes("moq")) s++;
  if (t.includes("urgent") || t.includes("asap") || t.includes("fast")) s++;
  if (t.includes("premium") || t.includes("high quality") || t.includes("high-end")) s++;
  return s;
}

function getIntentLevel(r: FabricRequest) {
  const s = getIntentScore(r);
  if (s >= 3) return { label: "High intent", cls: "bg-emerald-100 text-[#2f7d57] border border-emerald-200" };
  if (s >= 2) return { label: "Warm buyer", cls: "bg-blue-100 text-blue-700 border border-blue-200" };
  return { label: "General inquiry", cls: "bg-stone-100 text-stone-600 border border-stone-200" };
}

function getUrgencyLevel(createdAt: string) {
  const hours = (Date.now() - new Date(createdAt).getTime()) / (1000 * 60 * 60);
  if (hours <= 24) return { label: "Fresh lead", cls: "bg-amber-100 text-amber-700 border border-amber-200", priority: 3 };
  if (hours <= 72) return { label: "Recent", cls: "bg-[#24483f]/10 text-[#24483f] border border-[#24483f]/20", priority: 2 };
  return { label: "Older lead", cls: "bg-stone-100 text-stone-500 border border-stone-200", priority: 1 };
}

function CategoryBadge({ categoryId, subcategory }: { categoryId: string; subcategory?: string | null }) {
  const c = getCategoryColor(categoryId);
  return (
    <span className={`inline-flex items-center gap-1 rounded-full border px-2.5 py-1 text-xs font-semibold ${c.bg} ${c.text} ${c.border}`}>
      {getCategoryLabel(categoryId)}{subcategory ? ` · ${subcategory}` : ""}
    </span>
  );
}

function StarDisplay({ rating, size = "sm" }: { rating: number; size?: "sm" | "lg" }) {
  const sz = size === "lg" ? "text-xl" : "text-sm";
  return (
    <div className="flex gap-0.5">
      {[1, 2, 3, 4, 5].map((s) => (
        <span key={s} className={`${sz} ${s <= rating ? "text-amber-500" : "text-stone-300"}`}>★</span>
      ))}
    </div>
  );
}

const emptyStockForm = { name: "", description: "", category: "", subcategory: "", price_per_unit: "", unit: "yard", moq: "", available_quantity: "", images: [] as string[], video_url: "" };

export default function SupplierDashboardClient({ user, profile, requests, myQuotes }: Props) {
  const [activeTab, setActiveTab] = useState<"requests" | "quotes" | "stock" | "reviews" | "profile">("requests");
  const [loggingOut, setLoggingOut] = useState(false);
  const [search, setSearch] = useState("");
  const [categoryFilter, setCategoryFilter] = useState("all");
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
    bio: profile?.bio || "",
    categories: profile?.categories || [],
  });
  const [savingProfile, setSavingProfile] = useState(false);
  const [profileMsg, setProfileMsg] = useState<string | null>(null);
  const [deletingQuoteId, setDeletingQuoteId] = useState<string | null>(null);
  const [reviews, setReviews] = useState<Review[]>([]);
  const [reviewsLoading, setReviewsLoading] = useState(false);

  // Ready stock state
  const [stock, setStock] = useState<ReadyStockItem[]>([]);
  const [stockLoading, setStockLoading] = useState(false);
  const [stockForm, setStockForm] = useState({ ...emptyStockForm });
  const [editingStockId, setEditingStockId] = useState<string | null>(null);
  const [showStockForm, setShowStockForm] = useState(false);
  const [savingStock, setSavingStock] = useState(false);
  const [uploadingMedia, setUploadingMedia] = useState(false);
  const [mediaError, setMediaError] = useState<string | null>(null);
  const [pendingImageFiles, setPendingImageFiles] = useState<FileList | null>(null);
  const [pendingVideoFile, setPendingVideoFile] = useState<FileList | null>(null);

  const router = useRouter();
  const supabase = createClient();

  const profileComplete = Boolean(
    profile?.company_name?.trim() && profile?.contact_name?.trim() &&
    profile?.phone?.trim() && profile?.wechat?.trim() && profile?.region?.trim()
  );
  const supplierCategories: string[] = profile?.categories || [];

  useEffect(() => {
    if (!profileComplete) { setActiveTab("profile"); setEditProfile(true); }
  }, [profileComplete]);

  useEffect(() => {
    if (activeTab === "reviews") loadReviews();
    if (activeTab === "stock") loadStock();
  }, [activeTab]);

  async function loadReviews() {
    setReviewsLoading(true);
    const quoteIds = myQuotes.map((q) => q.id);
    if (quoteIds.length === 0) { setReviews([]); setReviewsLoading(false); return; }
    const { data } = await supabase.from("supplier_reviews").select("*").in("quote_id", quoteIds).order("created_at", { ascending: false });
    setReviews((data || []) as Review[]);
    setReviewsLoading(false);
  }

  async function loadStock() {
    setStockLoading(true);
    const { data } = await supabase.from("ready_stock").select("*").eq("supplier_user_id", user.id).order("created_at", { ascending: false });
    setStock((data || []) as ReadyStockItem[]);
    setStockLoading(false);
  }

  async function saveStock(e: React.FormEvent) {
    e.preventDefault();
    if (!stockForm.name.trim() || !stockForm.category || !stockForm.price_per_unit.trim() || !stockForm.moq.trim()) {
      alert("Name, category, price and MOQ are required."); return;
    }
    setSavingStock(true);

    let finalImages = stockForm.images;
    let finalVideoUrl = stockForm.video_url;

    if (pendingImageFiles) {
      setUploadingMedia(true);
      try {
        const newUrls = await uploadMediaFiles(pendingImageFiles, "image");
        finalImages = [...finalImages, ...newUrls].slice(0, 4);
      } catch (err: any) {
        setMediaError(err.message || "Image upload failed.");
        setSavingStock(false);
        setUploadingMedia(false);
        return;
      }
      setUploadingMedia(false);
    }
    if (pendingVideoFile) {
      setUploadingMedia(true);
      try {
        const [url] = await uploadMediaFiles(pendingVideoFile, "video");
        finalVideoUrl = url;
      } catch (err: any) {
        setMediaError(err.message || "Video upload failed.");
        setSavingStock(false);
        setUploadingMedia(false);
        return;
      }
      setUploadingMedia(false);
    }

    try {
      if (editingStockId) {
        const { error } = await supabase.from("ready_stock").update({
          name: stockForm.name.trim(), description: stockForm.description.trim() || null,
          category: stockForm.category, subcategory: stockForm.subcategory || null,
          price_per_unit: stockForm.price_per_unit.trim(), unit: stockForm.unit,
          moq: stockForm.moq.trim(), available_quantity: stockForm.available_quantity.trim() || null,
          images: finalImages.length > 0 ? finalImages : null, video_url: finalVideoUrl || null,
        }).eq("id", editingStockId);
        if (error) throw error;
      } else {
        const { error } = await supabase.from("ready_stock").insert([{
          supplier_id: user.id, supplier_user_id: user.id,
          name: stockForm.name.trim(), description: stockForm.description.trim() || null,
          category: stockForm.category, subcategory: stockForm.subcategory || null,
          price_per_unit: stockForm.price_per_unit.trim(), unit: stockForm.unit,
          moq: stockForm.moq.trim(), available_quantity: stockForm.available_quantity.trim() || null,
          is_active: true, is_sold_out: false,
          images: finalImages.length > 0 ? finalImages : null, video_url: finalVideoUrl || null,
        }]);
        if (error) throw error;
      }
      setStockForm({ ...emptyStockForm });
      setEditingStockId(null);
      setShowStockForm(false);
      setPendingImageFiles(null);
      setPendingVideoFile(null);
      setMediaError(null);
      await loadStock();
      setSuccessMessage(editingStockId ? "Stock item updated." : "Stock item added to ready stock.");
    } catch (err: any) { alert(err.message || "Failed to save stock item."); }
    finally { setSavingStock(false); }
  }

  async function toggleSoldOut(item: ReadyStockItem) {
    await supabase.from("ready_stock").update({ is_sold_out: !item.is_sold_out }).eq("id", item.id);
    await loadStock();
  }

  async function deleteStockItem(id: string) {
    if (!window.confirm("Remove this item from ready stock?")) return;
    await supabase.from("ready_stock").update({ is_active: false }).eq("id", id);
    await loadStock();
  }

  const quotedRequestIds = new Set(myQuotes.map((q) => q.request_id));
  const pendingRequests = requests.filter((r) => !quotedRequestIds.has(r.id));

  const matchingRequests = useMemo(() => {
    if (supplierCategories.length === 0) return pendingRequests;
    return pendingRequests.filter((r) => !r.category || supplierCategories.includes(r.category));
  }, [pendingRequests, supplierCategories]);

  const availableCategories = useMemo(() => {
    const ids = new Set(matchingRequests.map((r) => r.category).filter(Boolean) as string[]);
    return FABRIC_CATEGORIES.filter((c) => ids.has(c.id));
  }, [matchingRequests]);

  const filteredRequests = useMemo(() => {
    const q = search.trim().toLowerCase();
    return matchingRequests
      .filter((r) => {
        if (categoryFilter !== "all" && r.category !== categoryFilter) return false;
        if (!q) return true;
        return [r.id, r.user_input, r.client_name || ""].join(" ").toLowerCase().includes(q);
      })
      .sort((a, b) => (getIntentScore(b) * 10 + getUrgencyLevel(b.created_at).priority) - (getIntentScore(a) * 10 + getUrgencyLevel(a.created_at).priority));
  }, [matchingRequests, search, categoryFilter]);

  const filteredQuotes = useMemo(() => {
    const q = search.trim().toLowerCase();
    if (!q) return myQuotes;
    return myQuotes.filter((qt) => [qt.request_id, qt.supplier_name, qt.price || "", qt.moq || ""].join(" ").toLowerCase().includes(q));
  }, [myQuotes, search]);

  const closedDeals = myQuotes.filter((q) => q.is_contact_released).length;
  const winRate = myQuotes.length > 0 ? Math.round((closedDeals / myQuotes.length) * 100) : 0;
  const avgRating = reviews.length > 0 ? (reviews.reduce((sum, r) => sum + r.rating, 0) / reviews.length).toFixed(1) : null;
  const ratingDistribution = [5, 4, 3, 2, 1].map((star) => ({
    star, count: reviews.filter((r) => r.rating === star).length,
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

  async function submitQuote(e: React.FormEvent) {
    e.preventDefault();
    if (!formData.price.trim() || !formData.moq.trim()) { alert("Price and MOQ are required."); return; }
    if (!profileComplete) { setActiveTab("profile"); setEditProfile(true); alert("Please complete your supplier profile first."); return; }
    setSubmitting(true);
    try {
      if (editingQuoteId) {
        const { error } = await supabase.from("quotes").update({ price: formData.price.trim(), moq: formData.moq.trim(), lead_time: formData.lead_time.trim() || null, note: formData.note.trim() || null, supplier_region: formData.supplier_region.trim() || null }).eq("id", editingQuoteId);
        if (error) throw error;
        setSuccessMessage("Quote updated successfully.");
      } else {
        const { error } = await supabase.from("quotes").insert([{ request_id: quoteForm.requestId, supplier_user_id: user.id, supplier_name: profile?.company_name || user.name || "Supplier", price: formData.price.trim(), moq: formData.moq.trim(), lead_time: formData.lead_time.trim() || null, note: formData.note.trim() || null, supplier_region: formData.supplier_region.trim() || null, is_contact_released: false }]);
        if (error) throw error;
        try {
          const { data: rd } = await supabase.from("fabric_requests").select("client_email, client_name, id").eq("id", quoteForm.requestId).single();
          if (rd?.client_email) await fetch("/api/email/notify-quotes", { method: "POST", headers: { "Content-Type": "application/json" }, body: JSON.stringify({ buyerEmail: rd.client_email, buyerName: rd.client_name, requestId: rd.id, quoteCount: 1 }) });
        } catch { }
        await supabase.from("fabric_requests").update({ status: "quoted" }).eq("id", quoteForm.requestId);
        setSuccessMessage("Quote submitted and buyer notified.");
      }
      resetQuoteForm();
      router.refresh();
    } catch (err: any) { alert(err.message || "Failed to submit quote."); }
    finally { setSubmitting(false); }
  }

  async function deleteQuote(quoteId: string) {
    if (!window.confirm("Delete this quote?")) return;
    setDeletingQuoteId(quoteId);
    try {
      await supabase.from("quotes").delete().eq("id", quoteId);
      if (editingQuoteId === quoteId) resetQuoteForm();
      setSuccessMessage("Quote deleted.");
      router.refresh();
    } catch (err: any) { alert(err.message || "Failed to delete quote."); }
    finally { setDeletingQuoteId(null); }
  }

  async function saveProfile(e: React.FormEvent) {
    e.preventDefault();
    setSavingProfile(true);
    try {
      const { error } = await supabase.from("supplier_profiles").update({
        company_name: profileForm.company_name.trim(), contact_name: profileForm.contact_name.trim() || null,
        phone: profileForm.phone.trim() || null, wechat: profileForm.wechat.trim() || null,
        region: profileForm.region.trim() || null, bio: profileForm.bio.trim() || null,
        categories: profileForm.categories,
      }).eq("user_id", user.id);
      if (error) throw error;
      setProfileMsg("Profile updated."); setEditProfile(false); router.refresh();
    } catch (err: any) { setProfileMsg(err.message || "Failed to update profile."); }
    finally { setSavingProfile(false); }
  }

  // NOTE: The 'fabric-media' Supabase Storage bucket must exist with public read access.
  async function uploadMediaFiles(files: FileList, type: "image" | "video"): Promise<string[]> {
    const urls: string[] = [];
    for (const file of Array.from(files)) {
      const ext = file.name.split(".").pop();
      const path = `ready-stock/${user.id}/${Date.now()}-${Math.random().toString(36).slice(2)}.${ext}`;
      const { error } = await supabase.storage.from("fabric-media").upload(path, file, { upsert: false, contentType: file.type });
      if (error) throw new Error(error.message);
      const { data: urlData } = supabase.storage.from("fabric-media").getPublicUrl(path);
      urls.push(urlData.publicUrl);
    }
    return urls;
  }

  const quoteFormFields = [
    { label: "Price per yard/piece *", key: "price", placeholder: "e.g. $2.50/yard" },
    { label: "Minimum order qty *", key: "moq", placeholder: "e.g. 500 yards" },
    { label: "Lead time", key: "lead_time", placeholder: "e.g. 15-20 days" },
    { label: "Your region", key: "supplier_region", placeholder: "e.g. Guangzhou, China" },
  ];

  const activeStockCategory = FABRIC_CATEGORIES.find((c) => c.id === stockForm.category);

  const stats = [
    { value: String(filteredRequests.length), label: "Matching requests", color: "text-[#24483f]" },
    { value: String(myQuotes.length), label: "Quotes sent", color: "text-[#24483f]" },
    { value: String(closedDeals), label: "Deals closed", color: "text-[#24483f]" },
    { value: `${winRate}%`, label: "Win rate", color: "text-[#a75635]" },
    ...(avgRating ? [{ value: `${avgRating}★`, label: "Avg rating", color: "text-amber-500" }] : []),
  ];

  return (
    <main className="min-h-screen bg-[#f5ecdc] px-3 py-3 font-sans md:px-4 md:py-4">
      <div className="mx-auto flex max-w-5xl flex-col gap-3">

        <nav className="flex items-center justify-between gap-4 rounded-2xl border border-stone-200 bg-white px-4 py-3">
          <a href="/" className="flex shrink-0 items-center gap-2 no-underline">
            <img src="/weinly-logo.svg" alt="Weinly" className="h-9 w-auto" />
          </a>
          <div className="flex items-center gap-3">
            <a href={`/suppliers/${user.id}`} className="hidden text-xs font-semibold text-[#24483f] no-underline hover:underline md:block">View public profile →</a>
            <span className="hidden text-sm text-stone-500 md:block">{user.email}</span>
            <button onClick={handleLogout} disabled={loggingOut} className="cursor-pointer rounded-xl border border-stone-200 bg-stone-50 px-4 py-2 text-sm font-semibold text-stone-600 transition-all hover:bg-stone-100 disabled:opacity-60">
              {loggingOut ? "..." : "Log out"}
            </button>
          </div>
        </nav>

        {/* Header */}
        <section className="relative overflow-hidden rounded-3xl border border-[#24483f]/20 bg-[#24483f] p-6 md:p-8">
          <div className="pointer-events-none absolute right-0 top-0 h-64 w-64 translate-x-1/2 -translate-y-1/2 rounded-full bg-white/5 blur-3xl" />
          <div className="relative z-10 flex flex-col items-start justify-between gap-4 md:flex-row md:items-start">
            <div>
              <div className="mb-3 flex flex-wrap items-center gap-2">
                <div className="inline-flex items-center gap-2 rounded-full border border-white/20 bg-white/10 px-4 py-1.5">
                  <span className="h-2 w-2 rounded-full bg-[#e8dcc8]" />
                  <span className="text-xs font-semibold text-[#e8dcc8]">Supplier portal</span>
                </div>
                {profile?.is_verified && (
                  <span className="inline-flex items-center gap-1 rounded-full border border-emerald-200 bg-emerald-50 px-3 py-1.5 text-xs font-bold text-[#2f7d57]">✓ Verified Supplier</span>
                )}
              </div>
              <h1 className="mb-1 text-2xl font-black tracking-tight text-white md:text-3xl">{profile?.company_name || user.name || "Supplier dashboard"}</h1>
              <p className="m-0 text-sm text-[#e8dcc8]">{profile?.region || user.email}</p>
              {supplierCategories.length > 0 && (
                <div className="mt-3 flex flex-wrap gap-1.5">
                  {supplierCategories.map((catId) => <CategoryBadge key={catId} categoryId={catId} />)}
                </div>
              )}
              {!profileComplete && (
                <div className="mt-3 inline-flex items-center gap-2 rounded-full border border-red-200 bg-red-100 px-3 py-1">
                  <span className="text-xs font-bold text-red-700">Complete your profile to receive buyer contact releases</span>
                </div>
              )}
            </div>
            <div className="grid grid-cols-2 gap-3 md:grid-cols-5">
              {stats.map((s) => (
                <div key={s.label} className="rounded-2xl border border-white/15 bg-white/10 p-3 text-center">
                  <div className={`text-2xl font-black ${s.color}`}>{s.value}</div>
                  <div className="mt-0.5 text-xs text-[#e8dcc8]/70">{s.label}</div>
                </div>
              ))}
            </div>
          </div>
        </section>

        {successMessage && (
          <div className="rounded-2xl border border-emerald-200 bg-emerald-50 p-4 text-sm text-[#2f7d57]">{successMessage}</div>
        )}

        <section className="rounded-3xl border border-stone-200 bg-white p-4 md:p-6">
          <div className="mb-4 flex flex-col gap-3 md:flex-row md:items-center md:justify-between">
            <div className="flex gap-1.5 overflow-x-auto rounded-2xl border border-stone-200 bg-stone-50 p-1.5">
              {(["requests", "quotes", "stock", "reviews", "profile"] as const).map((tab) => (
                <button key={tab} onClick={() => setActiveTab(tab)}
                  className={`shrink-0 cursor-pointer rounded-xl px-3 py-2.5 text-xs font-bold transition-all md:text-sm ${activeTab === tab ? "bg-gradient-to-r from-[#24483f] to-[#1a3530] text-white shadow-lg" : "bg-transparent text-stone-500 hover:text-stone-700"}`}>
                  {tab === "requests" ? `Requests (${filteredRequests.length})`
                    : tab === "quotes" ? `Quotes (${myQuotes.length})`
                    : tab === "stock" ? `Ready Stock (${stock.filter((s) => !s.is_sold_out && s.is_active !== false).length})`
                    : tab === "reviews" ? `Reviews (${reviews.length})`
                    : "Profile"}
                </button>
              ))}
            </div>
            {(activeTab === "requests" || activeTab === "quotes") && (
              <input value={search} onChange={(e) => setSearch(e.target.value)} placeholder="Search..."
                className="w-full rounded-xl border border-stone-200 bg-stone-50 px-4 py-3 text-sm text-[#1f2933] outline-none transition-all placeholder:text-stone-400 focus:border-[#24483f] focus:bg-[#24483f]/5 md:max-w-xs" />
            )}
          </div>

          {/* REQUESTS TAB */}
          {activeTab === "requests" && (
            <div className="flex flex-col gap-4">
              <div>
                <h2 className="mb-1 text-xl font-black tracking-tight text-[#1f2933]">Open buyer requests</h2>
                <p className="m-0 text-sm text-stone-500">{supplierCategories.length > 0 ? `Showing requests matching your ${supplierCategories.length} selected categories.` : "All buyer requests."}</p>
              </div>
              {availableCategories.length > 1 && (
                <div className="flex flex-wrap gap-2">
                  <button onClick={() => setCategoryFilter("all")} className={`rounded-full border px-3 py-1.5 text-xs font-bold transition-all cursor-pointer ${categoryFilter === "all" ? "border-[#24483f] bg-[#24483f]/10 text-[#24483f]" : "border-stone-200 bg-stone-50 text-stone-500 hover:border-stone-300 hover:text-stone-700"}`}>
                    All ({matchingRequests.length})
                  </button>
                  {availableCategories.map((cat) => {
                    const color = getCategoryColor(cat.id);
                    const count = matchingRequests.filter((r) => r.category === cat.id).length;
                    return (
                      <button key={cat.id} onClick={() => setCategoryFilter(cat.id)}
                        className={`rounded-full border px-3 py-1.5 text-xs font-bold transition-all cursor-pointer ${categoryFilter === cat.id ? `${color.bg} ${color.text} ${color.border}` : "border-stone-200 bg-stone-50 text-stone-500 hover:border-stone-300 hover:text-stone-700"}`}>
                        {cat.label} ({count})
                      </button>
                    );
                  })}
                </div>
              )}
              <div className="rounded-2xl border border-[#24483f]/15 bg-[#24483f]/5 p-4 text-xs leading-relaxed text-[#24483f]">
                Tip: Fast response, clear MOQ, and competitive pricing improve your win rate.
              </div>
              {filteredRequests.length === 0 ? (
                <div className="rounded-2xl border border-dashed border-stone-300 bg-stone-50 p-10 text-center">
                  <div className="mb-3 text-4xl">◎</div>
                  <div className="mb-2 font-bold text-stone-500">No matching requests</div>
                  <p className="m-0 text-sm text-stone-400">{supplierCategories.length > 0 ? "No new requests in your categories. Check back soon or update your categories in Profile." : "No new requests right now."}</p>
                </div>
              ) : (
                filteredRequests.map((request) => {
                  const intent = getIntentLevel(request);
                  const urgency = getUrgencyLevel(request.created_at);
                  return (
                    <div key={request.id} className="flex flex-col gap-4 rounded-2xl border border-stone-200 bg-stone-50 p-5">
                      <div className="flex flex-wrap items-start justify-between gap-3">
                        <div>
                          <div className="mb-1 text-xs font-bold uppercase tracking-widest text-stone-500">Request ID</div>
                          <div className="mb-2 font-mono text-xs text-stone-400">{request.id}</div>
                          <div className="text-xs text-stone-500">{getRequestAge(request.created_at)}</div>
                        </div>
                        <div className="flex flex-wrap gap-2">
                          {request.category && <CategoryBadge categoryId={request.category} subcategory={request.subcategory} />}
                          <span className={`rounded-full px-3 py-1.5 text-xs font-bold ${intent.cls}`}>{intent.label}</span>
                          <span className={`rounded-full px-3 py-1.5 text-xs font-bold ${urgency.cls}`}>{urgency.label}</span>
                        </div>
                      </div>
                      <div className="rounded-xl border border-stone-200 bg-white p-4">
                        <div className="mb-2 text-xs font-bold uppercase tracking-widest text-stone-500">Buyer request</div>
                        <p className="m-0 text-sm leading-relaxed text-stone-600">{request.user_input}</p>
                      </div>
                      {request.ai_output != null && (
                        <div className="rounded-xl border border-stone-200 bg-white p-4">
                          <div className="mb-2 text-xs font-bold uppercase tracking-widest text-stone-500">AI sourcing spec</div>
                          <p className="m-0 whitespace-pre-wrap text-sm leading-relaxed text-stone-500">{formatAiOutput(request.ai_output)}</p>
                        </div>
                      )}
                      {quoteForm.open && quoteForm.requestId === request.id ? (
                        <form onSubmit={submitQuote} className="flex flex-col gap-4 rounded-2xl border border-[#24483f]/20 bg-[#24483f]/5 p-5">
                          <h4 className="m-0 text-base font-bold text-[#1f2933]">Submit your quote</h4>
                          <div className="grid grid-cols-1 gap-3 md:grid-cols-2">
                            {quoteFormFields.map((field) => (
                              <div key={field.key} className="flex flex-col gap-1.5">
                                <label className="text-xs font-bold uppercase tracking-wider text-stone-600">{field.label}</label>
                                <input value={formData[field.key as keyof typeof formData]} onChange={(e) => setFormData({ ...formData, [field.key]: e.target.value })} placeholder={field.placeholder}
                                  className="w-full rounded-xl border border-stone-200 bg-stone-50 px-4 py-3 text-sm text-[#1f2933] outline-none transition-all placeholder:text-stone-400 focus:border-[#24483f] focus:bg-[#24483f]/5" />
                              </div>
                            ))}
                          </div>
                          <div className="flex flex-col gap-1.5">
                            <label className="text-xs font-bold uppercase tracking-wider text-stone-600">Additional note</label>
                            <textarea value={formData.note} onChange={(e) => setFormData({ ...formData, note: e.target.value })} rows={3}
                              placeholder="Any additional details about your product, certifications, samples, etc."
                              className="w-full resize-none rounded-xl border border-stone-200 bg-stone-50 px-4 py-3 text-sm text-[#1f2933] outline-none transition-all placeholder:text-stone-400 focus:border-[#24483f] focus:bg-[#24483f]/5" />
                          </div>
                          <div className="flex flex-wrap gap-3">
                            <button type="submit" disabled={submitting}
                              className="cursor-pointer rounded-xl border-0 bg-gradient-to-r from-[#24483f] to-[#1a3530] px-6 py-3 text-sm font-bold text-white shadow-lg disabled:opacity-60">
                              {submitting ? "Submitting..." : "Submit quote & notify buyer →"}
                            </button>
                            <button type="button" onClick={resetQuoteForm} className="cursor-pointer rounded-xl border border-stone-200 bg-stone-50 px-6 py-3 text-sm font-semibold text-stone-600 transition-all hover:bg-stone-100">Cancel</button>
                          </div>
                        </form>
                      ) : (
                        <button onClick={() => { setEditingQuoteId(null); setQuoteForm({ requestId: request.id, open: true }); setFormData({ price: "", moq: "", lead_time: "", note: "", supplier_region: profile?.region || "" }); setSuccessMessage(null); }}
                          className="cursor-pointer self-start rounded-xl border-0 bg-gradient-to-r from-[#24483f] to-[#1a3530] px-6 py-3 text-sm font-bold text-white shadow-lg">
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
                <h2 className="mb-1 text-xl font-black tracking-tight text-[#1f2933]">My submitted quotes</h2>
                <p className="m-0 text-sm text-stone-500">Track, update or remove your quotes.</p>
              </div>
              {filteredQuotes.length === 0 ? (
                <div className="rounded-2xl border border-dashed border-stone-300 bg-stone-50 p-10 text-center">
                  <div className="mb-3 text-4xl">◎</div>
                  <div className="mb-2 font-bold text-stone-500">No quotes yet</div>
                  <p className="m-0 text-sm text-stone-400">Go to open requests and submit your first quote.</p>
                </div>
              ) : (
                filteredQuotes.map((quote) => (
                  <div key={quote.id} className="flex flex-col gap-3 rounded-2xl border border-stone-200 bg-stone-50 p-5">
                    <div className="flex flex-wrap items-start justify-between gap-3">
                      <div>
                        <div className="mb-1 text-xs font-bold uppercase tracking-widest text-stone-500">Request ID</div>
                        <div className="font-mono text-xs text-stone-400">{quote.request_id}</div>
                      </div>
                      <span className={`rounded-full px-3 py-1.5 text-xs font-bold ${quote.is_contact_released ? "border border-emerald-200 bg-emerald-100 text-[#2f7d57]" : "border border-blue-200 bg-blue-100 text-blue-700"}`}>
                        {quote.is_contact_released ? "Deal closed ✓" : "Awaiting buyer"}
                      </span>
                    </div>
                    <div className="grid grid-cols-2 gap-2.5 md:grid-cols-4">
                      {[{ label: "Price", value: quote.price || "—" }, { label: "MOQ", value: quote.moq || "—" }, { label: "Lead time", value: quote.lead_time || "—" }, { label: "Region", value: quote.supplier_region || "—" }].map((s) => (
                        <div key={s.label} className="rounded-xl border border-stone-200 bg-white p-3">
                          <div className="mb-1 text-xs font-bold uppercase tracking-wider text-stone-600">{s.label}</div>
                          <div className="text-sm font-semibold text-[#1f2933]">{s.value}</div>
                        </div>
                      ))}
                    </div>
                    {quote.note && (
                      <div className="rounded-xl border border-stone-200 bg-white p-3">
                        <div className="mb-1.5 text-xs font-bold uppercase tracking-widest text-stone-500">Your note</div>
                        <p className="m-0 text-sm leading-relaxed text-stone-500">{quote.note}</p>
                      </div>
                    )}
                    {quote.is_contact_released && (
                      <div className="rounded-xl border border-emerald-200 bg-emerald-50 p-3 text-sm leading-relaxed text-[#2f7d57]">
                        <strong>Buyer has unlocked your contact.</strong> They may reach out directly.
                      </div>
                    )}
                    <div className="flex flex-wrap gap-3 pt-1">
                      <button onClick={() => { setActiveTab("quotes"); setEditingQuoteId(quote.id); setQuoteForm({ requestId: quote.request_id, open: true }); setFormData({ price: quote.price || "", moq: quote.moq || "", lead_time: quote.lead_time || "", note: quote.note || "", supplier_region: quote.supplier_region || profile?.region || "" }); setSuccessMessage(null); }}
                        className="cursor-pointer rounded-xl border border-emerald-200 bg-emerald-100 px-4 py-2.5 text-sm font-bold text-[#2f7d57] transition-all hover:bg-emerald-200">Edit quote</button>
                      <button onClick={() => deleteQuote(quote.id)} disabled={deletingQuoteId === quote.id}
                        className="cursor-pointer rounded-xl border border-red-200 bg-red-50 px-4 py-2.5 text-sm font-bold text-red-600 transition-all hover:bg-red-100 disabled:opacity-60">
                        {deletingQuoteId === quote.id ? "Deleting..." : "Delete"}
                      </button>
                    </div>
                  </div>
                ))
              )}
              {quoteForm.open && editingQuoteId && (
                <form onSubmit={submitQuote} className="flex flex-col gap-4 rounded-2xl border border-[#24483f]/20 bg-[#24483f]/5 p-5">
                  <h4 className="m-0 text-base font-bold text-[#1f2933]">Edit quote</h4>
                  <div className="grid grid-cols-1 gap-3 md:grid-cols-2">
                    {quoteFormFields.map((field) => (
                      <div key={field.key} className="flex flex-col gap-1.5">
                        <label className="text-xs font-bold uppercase tracking-wider text-stone-600">{field.label}</label>
                        <input value={formData[field.key as keyof typeof formData]} onChange={(e) => setFormData({ ...formData, [field.key]: e.target.value })} placeholder={field.placeholder}
                          className="w-full rounded-xl border border-stone-200 bg-stone-50 px-4 py-3 text-sm text-[#1f2933] outline-none transition-all placeholder:text-stone-400 focus:border-[#24483f] focus:bg-[#24483f]/5" />
                      </div>
                    ))}
                  </div>
                  <textarea value={formData.note} onChange={(e) => setFormData({ ...formData, note: e.target.value })} rows={3} placeholder="Additional note..."
                    className="w-full resize-none rounded-xl border border-stone-200 bg-stone-50 px-4 py-3 text-sm text-[#1f2933] outline-none transition-all placeholder:text-stone-400 focus:border-[#24483f] focus:bg-[#24483f]/5" />
                  <div className="flex flex-wrap gap-3">
                    <button type="submit" disabled={submitting} className="cursor-pointer rounded-xl border-0 bg-gradient-to-r from-[#24483f] to-[#1a3530] px-6 py-3 text-sm font-bold text-white shadow-lg disabled:opacity-60">
                      {submitting ? "Updating..." : "Update quote →"}
                    </button>
                    <button type="button" onClick={resetQuoteForm} className="cursor-pointer rounded-xl border border-stone-200 bg-stone-50 px-6 py-3 text-sm font-semibold text-stone-600 transition-all hover:bg-stone-100">Cancel</button>
                  </div>
                </form>
              )}
            </div>
          )}

          {/* READY STOCK TAB */}
          {activeTab === "stock" && (
            <div className="flex flex-col gap-4">
              <div className="flex flex-wrap items-center justify-between gap-3">
                <div>
                  <h2 className="mb-1 text-xl font-black tracking-tight text-[#1f2933]">Ready stock</h2>
                  <p className="m-0 text-sm text-stone-500">List fabric you have available right now. Buyers can browse and enquire directly.</p>
                </div>
                <button onClick={() => { setShowStockForm(true); setEditingStockId(null); setStockForm({ ...emptyStockForm }); }}
                  className="cursor-pointer rounded-xl border-0 bg-gradient-to-r from-emerald-500 to-emerald-700 px-5 py-2.5 text-sm font-bold text-white shadow-lg shadow-emerald-500/20">
                  + Add fabric
                </button>
              </div>

              {/* Add/edit form */}
              {showStockForm && (
                <form onSubmit={saveStock} className="flex flex-col gap-4 rounded-2xl border border-stone-200 bg-stone-50 p-5">
                  <h4 className="m-0 text-base font-bold text-[#1f2933]">{editingStockId ? "Edit stock item" : "Add fabric to ready stock"}</h4>
                  <div className="grid grid-cols-1 gap-3 md:grid-cols-2">
                    <div className="flex flex-col gap-1.5 md:col-span-2">
                      <label className="text-xs font-bold uppercase tracking-wider text-stone-600">Fabric name *</label>
                      <input value={stockForm.name} onChange={(e) => setStockForm({ ...stockForm, name: e.target.value })} placeholder="e.g. Premium Swiss Lace — Ivory"
                        className="w-full rounded-xl border border-stone-200 bg-white px-4 py-3 text-sm text-[#1f2933] outline-none transition-all placeholder:text-stone-400 focus:border-[#24483f] focus:bg-[#24483f]/5" />
                    </div>
                    <div className="flex flex-col gap-1.5">
                      <label className="text-xs font-bold uppercase tracking-wider text-stone-600">Category *</label>
                      <select value={stockForm.category} onChange={(e) => setStockForm({ ...stockForm, category: e.target.value, subcategory: "" })}
                        className="w-full rounded-xl border border-stone-200 bg-white px-4 py-3 text-sm text-[#1f2933] outline-none transition-all focus:border-[#24483f]">
                        <option value="">Select category</option>
                        {FABRIC_CATEGORIES.map((cat) => <option key={cat.id} value={cat.id}>{cat.label}</option>)}
                      </select>
                    </div>
                    {activeStockCategory && (
                      <div className="flex flex-col gap-1.5">
                        <label className="text-xs font-bold uppercase tracking-wider text-stone-600">Fabric type</label>
                        <select value={stockForm.subcategory} onChange={(e) => setStockForm({ ...stockForm, subcategory: e.target.value })}
                          className="w-full rounded-xl border border-stone-200 bg-white px-4 py-3 text-sm text-[#1f2933] outline-none transition-all focus:border-[#24483f]">
                          <option value="">Select type (optional)</option>
                          {activeStockCategory.subcategories.map((sub) => <option key={sub} value={sub}>{sub}</option>)}
                        </select>
                      </div>
                    )}
                    <div className="flex flex-col gap-1.5">
                      <label className="text-xs font-bold uppercase tracking-wider text-stone-600">Price per unit *</label>
                      <input value={stockForm.price_per_unit} onChange={(e) => setStockForm({ ...stockForm, price_per_unit: e.target.value })} placeholder="e.g. $4.50"
                        className="w-full rounded-xl border border-stone-200 bg-white px-4 py-3 text-sm text-[#1f2933] outline-none transition-all placeholder:text-stone-400 focus:border-[#24483f] focus:bg-[#24483f]/5" />
                    </div>
                    <div className="flex flex-col gap-1.5">
                      <label className="text-xs font-bold uppercase tracking-wider text-stone-600">Unit</label>
                      <select value={stockForm.unit} onChange={(e) => setStockForm({ ...stockForm, unit: e.target.value })}
                        className="w-full rounded-xl border border-stone-200 bg-white px-4 py-3 text-sm text-[#1f2933] outline-none transition-all focus:border-[#24483f]">
                        {["yard", "meter", "roll", "kg", "piece", "set"].map((u) => <option key={u} value={u}>{u}</option>)}
                      </select>
                    </div>
                    <div className="flex flex-col gap-1.5">
                      <label className="text-xs font-bold uppercase tracking-wider text-stone-600">MOQ *</label>
                      <input value={stockForm.moq} onChange={(e) => setStockForm({ ...stockForm, moq: e.target.value })} placeholder="e.g. 50 yards"
                        className="w-full rounded-xl border border-stone-200 bg-white px-4 py-3 text-sm text-[#1f2933] outline-none transition-all placeholder:text-stone-400 focus:border-[#24483f] focus:bg-[#24483f]/5" />
                    </div>
                    <div className="flex flex-col gap-1.5">
                      <label className="text-xs font-bold uppercase tracking-wider text-stone-600">Available quantity</label>
                      <input value={stockForm.available_quantity} onChange={(e) => setStockForm({ ...stockForm, available_quantity: e.target.value })} placeholder="e.g. 500 yards in stock"
                        className="w-full rounded-xl border border-stone-200 bg-white px-4 py-3 text-sm text-[#1f2933] outline-none transition-all placeholder:text-stone-400 focus:border-[#24483f] focus:bg-[#24483f]/5" />
                    </div>
                    <div className="flex flex-col gap-1.5 md:col-span-2">
                      <label className="text-xs font-bold uppercase tracking-wider text-stone-600">Description</label>
                      <textarea value={stockForm.description} onChange={(e) => setStockForm({ ...stockForm, description: e.target.value })} rows={3}
                        placeholder="Describe the fabric — GSM, width, color options, feel, usage..."
                        className="w-full resize-none rounded-xl border border-stone-200 bg-white px-4 py-3 text-sm text-[#1f2933] outline-none transition-all placeholder:text-stone-400 focus:border-[#24483f] focus:bg-[#24483f]/5" />
                    </div>

                    {/* Media upload */}
                    <div className="flex flex-col gap-3 md:col-span-2">
                      <div>
                        <label className="text-xs font-bold uppercase tracking-wider text-stone-600">Photos (up to 4)</label>
                        <p className="mt-0.5 text-xs text-stone-400">JPEG or PNG, max 5 MB each. High-quality photos help buyers trust your listing.</p>
                      </div>
                      {stockForm.images.length > 0 && (
                        <div className="flex flex-wrap gap-2">
                          {stockForm.images.map((url, i) => (
                            <div key={i} className="relative group">
                              <img src={url} alt={`Photo ${i + 1}`} className="h-20 w-20 rounded-lg object-cover border border-stone-200" />
                              <button type="button"
                                onClick={() => setStockForm((prev) => ({ ...prev, images: prev.images.filter((_, idx) => idx !== i) }))}
                                className="absolute -top-1.5 -right-1.5 flex h-5 w-5 items-center justify-center rounded-full bg-red-500 text-white text-xs font-bold opacity-0 group-hover:opacity-100 transition-opacity cursor-pointer border-0">
                                ×
                              </button>
                            </div>
                          ))}
                        </div>
                      )}
                      {stockForm.images.length < 4 && (
                        <label className="flex cursor-pointer items-center gap-3 rounded-xl border-2 border-dashed border-stone-200 bg-stone-50 px-4 py-4 hover:border-[#24483f]/40 hover:bg-[#24483f]/5 transition-all">
                          <span className="text-2xl">🖼️</span>
                          <div>
                            <div className="text-sm font-semibold text-stone-600">
                              {pendingImageFiles ? `${pendingImageFiles.length} photo(s) selected` : "Click to upload photos"}
                            </div>
                            <div className="text-xs text-stone-400">{4 - stockForm.images.length} slot(s) remaining</div>
                          </div>
                          <input type="file" accept="image/jpeg,image/png,image/webp" multiple className="hidden"
                            onChange={(e) => {
                              if (e.target.files) { setPendingImageFiles(e.target.files); setMediaError(null); }
                            }} />
                        </label>
                      )}
                    </div>

                    <div className="flex flex-col gap-3 md:col-span-2">
                      <div>
                        <label className="text-xs font-bold uppercase tracking-wider text-stone-600">Video (optional)</label>
                        <p className="mt-0.5 text-xs text-stone-400">MP4 or MOV, max 50 MB. Show the fabric texture, drape, and movement.</p>
                      </div>
                      {stockForm.video_url && (
                        <div className="flex items-center gap-3 rounded-xl border border-stone-200 bg-stone-50 p-3">
                          <span className="text-2xl">🎥</span>
                          <div className="flex-1 min-w-0">
                            <div className="text-sm font-semibold text-stone-700 truncate">Video uploaded</div>
                            <a href={stockForm.video_url} target="_blank" rel="noreferrer" className="text-xs text-[#24483f] no-underline hover:underline">Preview →</a>
                          </div>
                          <button type="button" onClick={() => setStockForm((prev) => ({ ...prev, video_url: "" }))}
                            className="text-xs font-bold text-red-500 hover:text-red-700 cursor-pointer bg-transparent border-0">Remove</button>
                        </div>
                      )}
                      {!stockForm.video_url && (
                        <label className="flex cursor-pointer items-center gap-3 rounded-xl border-2 border-dashed border-stone-200 bg-stone-50 px-4 py-4 hover:border-[#24483f]/40 hover:bg-[#24483f]/5 transition-all">
                          <span className="text-2xl">🎬</span>
                          <div>
                            <div className="text-sm font-semibold text-stone-600">
                              {pendingVideoFile ? `${pendingVideoFile[0]?.name}` : "Click to upload video"}
                            </div>
                            <div className="text-xs text-stone-400">MP4 or MOV, max 50 MB</div>
                          </div>
                          <input type="file" accept="video/mp4,video/quicktime,video/mov" className="hidden"
                            onChange={(e) => {
                              if (e.target.files) { setPendingVideoFile(e.target.files); setMediaError(null); }
                            }} />
                        </label>
                      )}
                    </div>

                    {mediaError && (
                      <div className="md:col-span-2 rounded-lg border border-red-200 bg-red-50 px-4 py-3 text-sm text-red-600">{mediaError}</div>
                    )}
                  </div>
                  <div className="flex flex-wrap gap-3">
                    <button type="submit" disabled={savingStock || uploadingMedia}
                      className="cursor-pointer rounded-xl border-0 bg-gradient-to-r from-emerald-500 to-emerald-700 px-6 py-3 text-sm font-bold text-white shadow-lg shadow-emerald-500/25 disabled:opacity-60">
                      {savingStock || uploadingMedia ? (uploadingMedia ? "Uploading media..." : "Saving...") : editingStockId ? "Update item →" : "Add to ready stock →"}
                    </button>
                    <button type="button" onClick={() => { setShowStockForm(false); setEditingStockId(null); setStockForm({ ...emptyStockForm }); setPendingImageFiles(null); setPendingVideoFile(null); setMediaError(null); }}
                      className="cursor-pointer rounded-xl border border-stone-200 bg-stone-50 px-6 py-3 text-sm font-semibold text-stone-600 transition-all hover:bg-stone-100">Cancel</button>
                  </div>
                </form>
              )}

              {stockLoading ? (
                <div className="py-10 text-center text-sm text-stone-500">Loading...</div>
              ) : stock.filter((s) => s.is_active !== false).length === 0 ? (
                <div className="rounded-2xl border border-dashed border-stone-300 bg-stone-50 p-10 text-center">
                  <div className="mb-3 text-4xl">◎</div>
                  <div className="mb-2 font-bold text-stone-500">No ready stock listed</div>
                  <p className="m-0 mb-4 text-sm text-stone-400">Add fabric you have in stock right now to attract buyers who need fast delivery.</p>
                  <button onClick={() => setShowStockForm(true)}
                    className="inline-flex cursor-pointer items-center rounded-xl border-0 bg-gradient-to-r from-emerald-500 to-emerald-700 px-6 py-3 text-sm font-bold text-white shadow-lg shadow-emerald-500/20">
                    Add your first fabric →
                  </button>
                </div>
              ) : (
                <div className="grid grid-cols-1 gap-3 md:grid-cols-2">
                  {stock.filter((s) => s.is_active !== false).map((item) => {
                    const color = getCategoryColor(item.category);
                    return (
                      <div key={item.id} className={`flex flex-col gap-3 rounded-2xl border p-4 ${item.is_sold_out ? "opacity-60" : ""} ${color.bg} ${color.border}`}>
                        <div className="flex items-start justify-between gap-3">
                          <div>
                            <div className={`text-sm font-bold ${color.text} mb-0.5`}>{item.name}</div>
                            <div className="text-xs text-stone-500">{getCategoryLabel(item.category)}{item.subcategory ? ` · ${item.subcategory}` : ""}</div>
                          </div>
                          <span className={`shrink-0 rounded-full border px-2.5 py-1 text-xs font-bold ${item.is_sold_out ? "border-red-200 bg-red-50 text-red-600" : "border-emerald-200 bg-emerald-50 text-[#2f7d57]"}`}>
                            {item.is_sold_out ? "Sold out" : "In stock"}
                          </span>
                        </div>
                        {item.description && <p className="m-0 text-xs leading-relaxed text-stone-500">{item.description}</p>}
                        {/* Images */}
                        {item.images && item.images.length > 0 && (
                          <div className="flex gap-2 overflow-x-auto pb-1">
                            {item.images.map((url, i) => (
                              <img key={i} src={url} alt={`${item.name} photo ${i + 1}`}
                                className="h-24 w-24 shrink-0 rounded-lg object-cover border border-stone-200" />
                            ))}
                          </div>
                        )}
                        {/* Video */}
                        {item.video_url && (
                          <div className="rounded-xl overflow-hidden border border-stone-200">
                            <video src={item.video_url} controls className="w-full max-h-48 object-contain bg-black" />
                          </div>
                        )}
                        <div className="grid grid-cols-3 gap-2">
                          {[
                            { label: "Price", value: `${item.price_per_unit}/${item.unit}` },
                            { label: "MOQ", value: item.moq },
                            { label: "Stock", value: item.available_quantity || "—" },
                          ].map((s) => (
                            <div key={s.label} className="rounded-xl border border-stone-200 bg-white p-2.5">
                              <div className="mb-0.5 text-xs font-bold uppercase tracking-wider text-stone-600">{s.label}</div>
                              <div className="text-sm font-semibold text-[#1f2933]">{s.value}</div>
                            </div>
                          ))}
                        </div>
                        <div className="flex flex-wrap gap-2">
                          <button onClick={() => toggleSoldOut(item)}
                            className={`cursor-pointer rounded-xl border px-3 py-2 text-xs font-bold transition-all ${item.is_sold_out ? "border-emerald-200 bg-emerald-50 text-[#2f7d57] hover:bg-emerald-100" : "border-stone-200 bg-stone-50 text-stone-600 hover:bg-stone-100"}`}>
                            {item.is_sold_out ? "Mark available" : "Mark sold out"}
                          </button>
                          <button onClick={() => { setEditingStockId(item.id); setStockForm({ name: item.name, description: item.description || "", category: item.category, subcategory: item.subcategory || "", price_per_unit: item.price_per_unit, unit: item.unit, moq: item.moq, available_quantity: item.available_quantity || "", images: item.images || [], video_url: item.video_url || "" }); setPendingImageFiles(null); setPendingVideoFile(null); setMediaError(null); setShowStockForm(true); }}
                            className="cursor-pointer rounded-xl border border-stone-200 bg-stone-50 px-3 py-2 text-xs font-bold text-stone-600 transition-all hover:bg-stone-100">Edit</button>
                          <button onClick={() => deleteStockItem(item.id)}
                            className="cursor-pointer rounded-xl border border-red-200 bg-red-50 px-3 py-2 text-xs font-bold text-red-600 transition-all hover:bg-red-100">Remove</button>
                        </div>
                      </div>
                    );
                  })}
                </div>
              )}
            </div>
          )}

          {/* REVIEWS TAB */}
          {activeTab === "reviews" && (
            <div className="flex flex-col gap-4">
              <div>
                <h2 className="mb-1 text-xl font-black tracking-tight text-[#1f2933]">Your reviews</h2>
                <p className="m-0 text-sm text-stone-500">Reviews left by buyers after unlocking your contact details.</p>
              </div>
              {reviewsLoading ? (
                <div className="py-10 text-center text-sm text-stone-500">Loading reviews...</div>
              ) : reviews.length === 0 ? (
                <div className="rounded-2xl border border-dashed border-stone-300 bg-stone-50 p-10 text-center">
                  <div className="mb-3 text-4xl">★</div>
                  <div className="mb-2 font-bold text-stone-500">No reviews yet</div>
                  <p className="m-0 text-sm text-stone-400">Reviews appear here after buyers unlock your contact and leave feedback.</p>
                </div>
              ) : (
                <>
                  <div className="rounded-2xl border border-amber-200 bg-amber-50 p-5">
                    <div className="flex flex-wrap items-center justify-between gap-6">
                      <div className="flex flex-col items-center gap-1">
                        <div className="text-5xl font-black text-[#1f2933]">{avgRating}</div>
                        <StarDisplay rating={Math.round(Number(avgRating))} size="lg" />
                        <div className="text-xs text-stone-500">{reviews.length} {reviews.length === 1 ? "review" : "reviews"}</div>
                      </div>
                      <div className="flex flex-1 flex-col gap-2 min-w-[160px]">
                        {ratingDistribution.map(({ star, count, pct }) => (
                          <div key={star} className="flex items-center gap-2">
                            <span className="w-4 text-xs text-stone-500">{star}★</span>
                            <div className="flex-1 h-2 rounded-full bg-stone-200 overflow-hidden">
                              <div className="h-full rounded-full bg-amber-500 transition-all" style={{ width: `${pct}%` }} />
                            </div>
                            <span className="w-6 text-right text-xs text-stone-500">{count}</span>
                          </div>
                        ))}
                      </div>
                    </div>
                  </div>
                  <div className="flex flex-col gap-3">
                    {reviews.map((review) => (
                      <div key={review.id} className="flex flex-col gap-3 rounded-2xl border border-stone-200 bg-stone-50 p-5">
                        <div className="flex flex-wrap items-start justify-between gap-3">
                          <div>
                            <div className="mb-0.5 text-sm font-bold text-[#1f2933]">{review.buyer_name || "Verified buyer"}</div>
                            <div className="text-xs text-stone-500">{new Date(review.created_at).toLocaleDateString()} · Request {review.request_id.slice(0, 8)}...</div>
                          </div>
                          <StarDisplay rating={review.rating} size="sm" />
                        </div>
                        {review.comment && <p className="m-0 text-sm leading-relaxed text-stone-500">{review.comment}</p>}
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
                  <h2 className="mb-1 text-xl font-black tracking-tight text-[#1f2933]">Supplier profile</h2>
                  <p className="m-0 text-sm text-stone-500">This information is shown to buyers when your contact is released.</p>
                </div>
                <button onClick={() => setEditProfile(!editProfile)}
                  className="cursor-pointer rounded-xl border border-[#24483f]/20 bg-[#24483f]/10 px-5 py-2.5 text-sm font-bold text-[#24483f] transition-all hover:bg-[#24483f]/15">
                  {editProfile ? "Cancel" : "Edit profile"}
                </button>
              </div>
              {profileMsg && <div className="rounded-xl border border-emerald-200 bg-emerald-50 p-4 text-sm text-[#2f7d57]">{profileMsg}</div>}
              {!profileComplete && <div className="rounded-2xl border border-red-200 bg-red-50 p-4 text-sm text-red-600">Complete your profile fully. Buyers will only trust and contact suppliers with complete details.</div>}
              {profile?.is_verified && (
                <div className="flex items-center gap-3 rounded-2xl border border-emerald-200 bg-emerald-50 p-4">
                  <span className="text-xl text-[#2f7d57]">✓</span>
                  <div>
                    <div className="text-sm font-bold text-[#2f7d57]">Verified Supplier</div>
                    <div className="text-xs text-stone-500">Your account has been verified by the Weinly team. This badge appears on all your quotes.</div>
                  </div>
                </div>
              )}
              {editProfile ? (
                <form onSubmit={saveProfile} className="flex flex-col gap-5">
                  <div className="grid grid-cols-1 gap-3 md:grid-cols-2">
                    {[
                      { label: "Company name", key: "company_name", placeholder: "Your company name" },
                      { label: "Contact name", key: "contact_name", placeholder: "Your name" },
                      { label: "Phone / WhatsApp", key: "phone", placeholder: "+86 138 0000 0000" },
                      { label: "WeChat ID", key: "wechat", placeholder: "WeChat username" },
                      { label: "Region / city", key: "region", placeholder: "e.g. Guangzhou, China" },
                    ].map((field) => (
                      <div key={field.key} className="flex flex-col gap-1.5">
                        <label className="text-xs font-bold uppercase tracking-wider text-stone-600">{field.label}</label>
                        <input value={profileForm[field.key as keyof typeof profileForm] as string} onChange={(e) => setProfileForm({ ...profileForm, [field.key]: e.target.value })} placeholder={field.placeholder}
                          className="w-full rounded-xl border border-stone-200 bg-stone-50 px-4 py-3 text-sm text-[#1f2933] outline-none transition-all placeholder:text-stone-400 focus:border-[#24483f] focus:bg-[#24483f]/5" />
                      </div>
                    ))}
                    <div className="flex flex-col gap-1.5 md:col-span-2">
                      <label className="text-xs font-bold uppercase tracking-wider text-stone-600">Bio / company description</label>
                      <textarea value={profileForm.bio} onChange={(e) => setProfileForm({ ...profileForm, bio: e.target.value })} rows={3}
                        placeholder="Describe your company, specialties, years of experience, export markets..."
                        className="w-full resize-none rounded-xl border border-stone-200 bg-stone-50 px-4 py-3 text-sm text-[#1f2933] outline-none transition-all placeholder:text-stone-400 focus:border-[#24483f] focus:bg-[#24483f]/5" />
                    </div>
                  </div>
                  <div className="flex flex-col gap-3">
                    <div>
                      <label className="text-xs font-bold uppercase tracking-wider text-stone-600">Fabric categories you supply</label>
                      <p className="mt-1 text-xs text-stone-500">Select all categories you can fulfil. You'll only see matching buyer requests.</p>
                    </div>
                    <div className="grid grid-cols-1 gap-2 md:grid-cols-2 lg:grid-cols-3">
                      {FABRIC_CATEGORIES.map((cat) => {
                        const color = getCategoryColor(cat.id);
                        const isSelected = profileForm.categories.includes(cat.id);
                        return (
                          <button key={cat.id} type="button" onClick={() => setProfileForm((prev) => ({ ...prev, categories: isSelected ? prev.categories.filter((c) => c !== cat.id) : [...prev.categories, cat.id] }))}
                            className={`flex items-center justify-between gap-2 rounded-xl border px-4 py-3 text-left text-sm font-semibold transition-all cursor-pointer ${isSelected ? `${color.bg} ${color.text} ${color.border}` : "border-stone-200 bg-stone-50 text-stone-500 hover:border-stone-300 hover:text-stone-700"}`}>
                            <span>{cat.label}</span>
                            {isSelected && <span className="text-xs">✓</span>}
                          </button>
                        );
                      })}
                    </div>
                    {profileForm.categories.length > 0 && (
                      <p className="text-xs text-stone-500">{profileForm.categories.length} {profileForm.categories.length === 1 ? "category" : "categories"} selected</p>
                    )}
                  </div>
                  <button type="submit" disabled={savingProfile}
                    className="self-start rounded-xl border-0 bg-gradient-to-r from-[#24483f] to-[#1a3530] px-6 py-3 text-sm font-bold text-white shadow-lg disabled:opacity-60">
                    {savingProfile ? "Saving..." : "Save profile →"}
                  </button>
                </form>
              ) : (
                <div className="flex flex-col gap-4">
                  <div className="grid grid-cols-1 gap-3 md:grid-cols-2">
                    {[
                      { label: "Company name", value: profile?.company_name || "—" },
                      { label: "Contact name", value: profile?.contact_name || "Not set" },
                      { label: "Phone / WhatsApp", value: profile?.phone || "Not set" },
                      { label: "WeChat ID", value: profile?.wechat || "Not set" },
                      { label: "Region", value: profile?.region || "Not set" },
                      { label: "Email", value: user.email },
                    ].map((info) => (
                      <div key={info.label} className="rounded-xl border border-stone-200 bg-stone-50 p-4">
                        <div className="mb-1 text-xs font-bold uppercase tracking-widest text-stone-500">{info.label}</div>
                        <div className="break-words text-sm font-semibold text-[#1f2933]">{info.value}</div>
                      </div>
                    ))}
                  </div>
                  {profile?.bio && (
                    <div className="rounded-xl border border-stone-200 bg-stone-50 p-4">
                      <div className="mb-1 text-xs font-bold uppercase tracking-widest text-stone-500">Bio</div>
                      <p className="m-0 text-sm leading-relaxed text-[#1f2933]">{profile.bio}</p>
                    </div>
                  )}
                  <div className="rounded-xl border border-stone-200 bg-stone-50 p-4">
                    <div className="mb-2 text-xs font-bold uppercase tracking-widest text-stone-500">Fabric categories</div>
                    {supplierCategories.length > 0 ? (
                      <div className="flex flex-wrap gap-2">{supplierCategories.map((catId) => <CategoryBadge key={catId} categoryId={catId} />)}</div>
                    ) : (
                      <p className="m-0 text-sm text-stone-400">No categories set. Edit your profile to select the categories you supply.</p>
                    )}
                  </div>
                </div>
              )}
              <div className="mt-2 rounded-2xl border border-amber-200 bg-amber-50 p-5">
                <h3 className="m-0 mb-2 text-sm font-bold text-amber-800">Important — keep your contact details updated</h3>
                <p className="m-0 text-xs leading-relaxed text-amber-800/70">When a buyer unlocks your contact, Weinly releases your phone, WeChat and email directly to them. Make sure these are always accurate.</p>
              </div>
            </div>
          )}
        </section>
        <SiteFooter />
      </div>
    </main>
  );
}
