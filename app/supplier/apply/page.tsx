"use client";

import { useState } from "react";
import SiteHeader from "@/components/SiteHeader";
import SiteFooter from "@/components/SiteFooter";
import { FABRIC_CATEGORIES } from "@/lib/categories";

export default function SupplierApplyPage() {
  const [companyName, setCompanyName] = useState("");
  const [contactName, setContactName] = useState("");
  const [email, setEmail] = useState("");
  const [phone, setPhone] = useState("");
  const [wechat, setWechat] = useState("");
  const [region, setRegion] = useState("");
  const [selectedCategories, setSelectedCategories] = useState<string[]>([]);
  const [yearsInBusiness, setYearsInBusiness] = useState("");
  const [website, setWebsite] = useState("");
  const [loading, setLoading] = useState(false);
  const [submitted, setSubmitted] = useState(false);
  const [error, setError] = useState("");

  function toggleCategory(id: string) {
    setSelectedCategories((prev) =>
      prev.includes(id) ? prev.filter((c) => c !== id) : [...prev, id]
    );
  }

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    setError("");
    if (!companyName.trim() || !contactName.trim() || !email.trim() || !phone.trim() || !region.trim()) {
      setError("Please fill in all required fields.");
      return;
    }
    if (selectedCategories.length === 0) {
      setError("Please select at least one fabric category.");
      return;
    }
    setLoading(true);
    try {
      const res = await fetch("/api/supplier/apply", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          company_name: companyName.trim(),
          contact_name: contactName.trim(),
          email: email.trim(),
          phone: phone.trim(),
          wechat: wechat.trim() || null,
          region: region.trim(),
          categories: selectedCategories,
          years_in_business: yearsInBusiness.trim() || null,
          website: website.trim() || null,
        }),
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data.error || "Submission failed.");
      setSubmitted(true);
    } catch (err: any) {
      setError(err.message || "Something went wrong. Please try again.");
    } finally {
      setLoading(false);
    }
  }

  return (
    <main className="min-h-screen bg-[#f5ecdc] px-3 py-3 font-sans md:px-4 md:py-4">
      <div className="mx-auto flex max-w-2xl flex-col gap-4">
        <SiteHeader showSubmitButton={false} />

        {submitted ? (
          <div className="rounded-3xl border border-emerald-200 bg-emerald-50 p-8 text-center">
            <div className="mb-4 text-4xl">✓</div>
            <h1 className="mb-3 text-2xl font-black text-[#1f2933]">Application received</h1>
            <p className="mb-2 text-sm leading-relaxed text-stone-500">
              Thank you, <strong className="text-[#1f2933]">{contactName}</strong>. We'll review your application and send your invite code to <strong className="text-[#1f2933]">{email}</strong> within 24–48 hours.
            </p>
            <p className="text-xs text-stone-400">
              Once approved, you can create your supplier account and start receiving buyer quote requests.
            </p>
          </div>
        ) : (
          <>
            <div className="rounded-3xl border border-stone-200 bg-white p-6 md:p-8">
              <span className="mb-3 inline-block rounded-full bg-[#24483f]/10 px-3 py-1 text-xs font-bold uppercase tracking-widest text-[#24483f]">
                Supplier application
              </span>
              <h1 className="mb-2 text-2xl font-black tracking-tight text-[#1f2933] md:text-3xl">
                Apply to join Weinly as a supplier
              </h1>
              <p className="text-sm leading-relaxed text-stone-500">
                We connect your factory directly to verified African buyers sourcing fabric from China. Fill in your details below — we review every application and send an invite code within 24–48 hours.
              </p>
            </div>

            <form onSubmit={handleSubmit} className="flex flex-col gap-4">
              {/* Company info */}
              <div className="rounded-3xl border border-stone-200 bg-white p-5 md:p-6">
                <h2 className="mb-4 text-sm font-bold uppercase tracking-widest text-stone-600">Company details</h2>
                <div className="flex flex-col gap-3">
                  <div className="grid grid-cols-1 gap-3 md:grid-cols-2">
                    <div className="flex flex-col gap-1.5">
                      <label className="text-xs font-bold uppercase tracking-wider text-stone-600">Company name <span className="text-red-500">*</span></label>
                      <input value={companyName} onChange={(e) => setCompanyName(e.target.value)} placeholder="e.g. Guangzhou Textile Co." type="text"
                        className="w-full rounded-xl border border-stone-200 bg-stone-50 px-4 py-3 text-sm text-[#1f2933] outline-none placeholder:text-stone-400 focus:border-[#24483f] focus:bg-[#24483f]/5 transition-all" />
                    </div>
                    <div className="flex flex-col gap-1.5">
                      <label className="text-xs font-bold uppercase tracking-wider text-stone-600">Contact name <span className="text-red-500">*</span></label>
                      <input value={contactName} onChange={(e) => setContactName(e.target.value)} placeholder="Your full name" type="text"
                        className="w-full rounded-xl border border-stone-200 bg-stone-50 px-4 py-3 text-sm text-[#1f2933] outline-none placeholder:text-stone-400 focus:border-[#24483f] focus:bg-[#24483f]/5 transition-all" />
                    </div>
                  </div>
                  <div className="grid grid-cols-1 gap-3 md:grid-cols-2">
                    <div className="flex flex-col gap-1.5">
                      <label className="text-xs font-bold uppercase tracking-wider text-stone-600">Email address <span className="text-red-500">*</span></label>
                      <input value={email} onChange={(e) => setEmail(e.target.value)} placeholder="you@company.com" type="email"
                        className="w-full rounded-xl border border-stone-200 bg-stone-50 px-4 py-3 text-sm text-[#1f2933] outline-none placeholder:text-stone-400 focus:border-[#24483f] focus:bg-[#24483f]/5 transition-all" />
                    </div>
                    <div className="flex flex-col gap-1.5">
                      <label className="text-xs font-bold uppercase tracking-wider text-stone-600">Phone / WhatsApp <span className="text-red-500">*</span></label>
                      <input value={phone} onChange={(e) => setPhone(e.target.value)} placeholder="+86 138 0000 0000" type="text"
                        className="w-full rounded-xl border border-stone-200 bg-stone-50 px-4 py-3 text-sm text-[#1f2933] outline-none placeholder:text-stone-400 focus:border-[#24483f] focus:bg-[#24483f]/5 transition-all" />
                    </div>
                  </div>
                  <div className="grid grid-cols-1 gap-3 md:grid-cols-3">
                    <div className="flex flex-col gap-1.5">
                      <label className="text-xs font-bold uppercase tracking-wider text-stone-600">WeChat ID</label>
                      <input value={wechat} onChange={(e) => setWechat(e.target.value)} placeholder="WeChat username" type="text"
                        className="w-full rounded-xl border border-stone-200 bg-stone-50 px-4 py-3 text-sm text-[#1f2933] outline-none placeholder:text-stone-400 focus:border-[#24483f] focus:bg-[#24483f]/5 transition-all" />
                    </div>
                    <div className="flex flex-col gap-1.5">
                      <label className="text-xs font-bold uppercase tracking-wider text-stone-600">City / Region <span className="text-red-500">*</span></label>
                      <input value={region} onChange={(e) => setRegion(e.target.value)} placeholder="e.g. Guangzhou, Guangdong" type="text"
                        className="w-full rounded-xl border border-stone-200 bg-stone-50 px-4 py-3 text-sm text-[#1f2933] outline-none placeholder:text-stone-400 focus:border-[#24483f] focus:bg-[#24483f]/5 transition-all" />
                    </div>
                    <div className="flex flex-col gap-1.5">
                      <label className="text-xs font-bold uppercase tracking-wider text-stone-600">Years in business</label>
                      <input value={yearsInBusiness} onChange={(e) => setYearsInBusiness(e.target.value)} placeholder="e.g. 8 years" type="text"
                        className="w-full rounded-xl border border-stone-200 bg-stone-50 px-4 py-3 text-sm text-[#1f2933] outline-none placeholder:text-stone-400 focus:border-[#24483f] focus:bg-[#24483f]/5 transition-all" />
                    </div>
                  </div>
                  <div className="flex flex-col gap-1.5">
                    <label className="text-xs font-bold uppercase tracking-wider text-stone-600">Alibaba / website link</label>
                    <input value={website} onChange={(e) => setWebsite(e.target.value)} placeholder="https://your-alibaba-store.com or website" type="url"
                      className="w-full rounded-xl border border-stone-200 bg-stone-50 px-4 py-3 text-sm text-[#1f2933] outline-none placeholder:text-stone-400 focus:border-[#24483f] focus:bg-[#24483f]/5 transition-all" />
                  </div>
                </div>
              </div>

              {/* Fabric categories */}
              <div className="rounded-3xl border border-stone-200 bg-white p-5 md:p-6">
                <h2 className="mb-1 text-sm font-bold uppercase tracking-widest text-stone-600">Fabric categories you supply <span className="text-red-500">*</span></h2>
                <p className="mb-4 text-xs text-stone-500">Select all that apply — buyers will be matched to you based on these.</p>
                <div className="grid grid-cols-2 gap-2 md:grid-cols-3">
                  {FABRIC_CATEGORIES.map((cat) => {
                    const selected = selectedCategories.includes(cat.id);
                    return (
                      <button key={cat.id} type="button" onClick={() => toggleCategory(cat.id)}
                        className={`rounded-xl border px-4 py-3 text-left text-sm font-semibold transition-all ${
                          selected
                            ? "border-[#24483f] bg-[#24483f]/10 text-[#24483f]"
                            : "border-stone-200 bg-stone-50 text-stone-500 hover:border-stone-300 hover:text-stone-700"
                        }`}>
                        {cat.label}
                      </button>
                    );
                  })}
                </div>
              </div>

              {error && (
                <div className="rounded-2xl border border-red-200 bg-red-50 px-4 py-3 text-sm text-red-600">
                  {error}
                </div>
              )}

              <button type="submit" disabled={loading}
                className="w-full rounded-2xl bg-gradient-to-r from-[#a75635] to-[#7b3525] px-6 py-4 text-sm font-bold text-white shadow-lg transition-all hover:opacity-90 disabled:opacity-50">
                {loading ? "Submitting application…" : "Submit application →"}
              </button>

              <p className="text-center text-xs text-stone-500">
                Already have an invite code?{" "}
                <a href="/supplier/auth" className="text-[#24483f] no-underline hover:underline">
                  Create your account →
                </a>
              </p>
            </form>
          </>
        )}

        <SiteFooter />
      </div>
    </main>
  );
}
