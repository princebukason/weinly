"use client";

import { useState } from "react";
import { createClient } from "@/lib/supabase/client";
import { useRouter } from "next/navigation";

function EyeIcon() {
  return (
    <svg xmlns="http://www.w3.org/2000/svg" width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
      <path d="M1 12s4-8 11-8 11 8 11 8-4 8-11 8-11-8-11-8z"/><circle cx="12" cy="12" r="3"/>
    </svg>
  );
}

function EyeOffIcon() {
  return (
    <svg xmlns="http://www.w3.org/2000/svg" width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
      <path d="M17.94 17.94A10.07 10.07 0 0 1 12 20c-7 0-11-8-11-8a18.45 18.45 0 0 1 5.06-5.94"/><path d="M9.9 4.24A9.12 9.12 0 0 1 12 4c7 0 11 8 11 8a18.5 18.5 0 0 1-2.16 3.19"/><line x1="1" y1="1" x2="23" y2="23"/>
    </svg>
  );
}

export default function SupplierAuthPage() {
  const [mode, setMode] = useState<"login" | "signup">("login");
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [showPassword, setShowPassword] = useState(false);
  const [companyName, setCompanyName] = useState("");
  const [contactName, setContactName] = useState("");
  const [phone, setPhone] = useState("");
  const [wechat, setWechat] = useState("");
  const [region, setRegion] = useState("");
  const [inviteCode, setInviteCode] = useState("");
  const [loading, setLoading] = useState(false);
  const [message, setMessage] = useState<{ type: "success" | "error"; text: string } | null>(null);

  const router = useRouter();
  const supabase = createClient();

  async function handleAuth(e: React.FormEvent) {
    e.preventDefault();
    setLoading(true);
    setMessage(null);

    try {
      if (mode === "signup") {
        const { data: invite, error: inviteError } = await supabase
          .from("supplier_invites")
          .select("*")
          .eq("code", inviteCode.trim().toUpperCase())
          .eq("used", false)
          .single();

        if (inviteError || !invite) {
          setMessage({ type: "error", text: "Invalid or already used invite code. Contact Weinly to get one." });
          setLoading(false);
          return;
        }

        const { data: authData, error: signUpError } = await supabase.auth.signUp({
          email: email.trim(),
          password,
          options: {
            data: {
              role: "supplier",
              company_name: companyName.trim(),
              contact_name: contactName.trim(),
            },
          },
        });

        if (signUpError) throw signUpError;

        if (authData.user) {
          const { error: profileError } = await supabase
            .from("supplier_profiles")
            .insert([{
              user_id: authData.user.id,
              company_name: companyName.trim(),
              contact_name: contactName.trim(),
              email: email.trim(),
              phone: phone.trim(),
              wechat: wechat.trim(),
              region: region.trim(),
              invite_code: inviteCode.trim().toUpperCase(),
              is_active: true,
            }]);

          if (profileError) {
            console.error("Profile insert failed:", profileError);
          }

          await supabase
            .from("supplier_invites")
            .update({ used: true, used_at: new Date().toISOString() })
            .eq("code", inviteCode.trim().toUpperCase());
        }

        setMessage({ type: "success", text: "Account created! Check your email to confirm, then log in." });
        setMode("login");
      } else {
        const { data, error } = await supabase.auth.signInWithPassword({
          email: email.trim(),
          password,
        });

        if (error) throw error;

        const { data: profile } = await supabase
          .from("supplier_profiles")
          .select("id")
          .eq("user_id", data.user.id)
          .maybeSingle();

        if (!profile) {
          await supabase.auth.signOut();
          setMessage({ type: "error", text: "This login is for suppliers only. Buyers should use the main login page." });
          setLoading(false);
          return;
        }

        router.push("/supplier/dashboard");
        router.refresh();
      }
    } catch (err: any) {
      setMessage({ type: "error", text: err.message || "Something went wrong." });
    } finally {
      setLoading(false);
    }
  }

  const inputClass = "w-full px-4 py-3 rounded-lg bg-stone-50 border border-stone-200 text-[#1f2933] text-sm placeholder:text-stone-400 outline-none focus:border-[#24483f] focus:bg-[#24483f]/5 transition-all";
  const labelClass = "text-stone-600 text-xs font-bold uppercase tracking-wider";

  return (
    <main className="min-h-screen bg-[#f5ecdc] flex items-center justify-center px-4 py-12 font-sans">
      <div className="w-full max-w-md flex flex-col gap-4">

        {/* Brand */}
        <div className="text-center mb-2">
          <a href="/" className="inline-flex items-center no-underline mb-4">
            <img src="/weinly-logo.svg" alt="Weinly" className="h-10 w-auto" />
          </a>
          <div className="inline-flex items-center gap-2 bg-[#24483f]/8 border border-[#24483f]/20 rounded-full px-4 py-1.5 mb-3">
            <span className="w-2 h-2 rounded-full bg-[#24483f]" />
            <span className="text-[#24483f] text-xs font-semibold">Supplier portal</span>
          </div>
          <h1 className="text-2xl md:text-3xl font-black text-[#1f2933] tracking-tight mb-2">
            {mode === "login" ? "Supplier login" : "Join as a supplier"}
          </h1>
          <p className="text-stone-500 text-sm leading-relaxed">
            {mode === "login"
              ? "Log in to view buyer requests and submit quotes."
              : "You need an invite code from Weinly to register as a supplier."}
          </p>
        </div>

        {/* Card */}
        <div className="bg-white border border-stone-200 rounded-2xl p-6 md:p-8 shadow-sm">

          {/* Tab toggle */}
          <div className="flex gap-2 mb-6 bg-stone-50 border border-stone-200 rounded-lg p-1.5">
            {(["login", "signup"] as const).map((tab) => (
              <button key={tab} type="button"
                onClick={() => { setMode(tab); setMessage(null); }}
                className={`flex-1 py-2.5 px-4 rounded-md text-sm font-bold border-0 cursor-pointer transition-all ${mode === tab ? "bg-gradient-to-r from-[#24483f] to-[#1a3530] text-white shadow-lg shadow-stone-900/10" : "text-stone-500 bg-transparent hover:text-stone-700"}`}>
                {tab === "login" ? "Log in" : "Register"}
              </button>
            ))}
          </div>

          {/* Message */}
          {message && (
            <div className={`rounded-lg p-4 mb-4 text-sm leading-relaxed ${message.type === "success" ? "bg-emerald-50 border border-emerald-200 text-[#2f7d57]" : "bg-red-50 border border-red-200 text-red-600"}`}>
              {message.text}
            </div>
          )}

          <form onSubmit={handleAuth} className="flex flex-col gap-4">
            {mode === "signup" && (
              <>
                <div className="bg-[#24483f]/5 border border-[#24483f]/15 rounded-lg p-4">
                  <p className="text-[#24483f] text-xs leading-relaxed m-0">
                    <strong>Invite only.</strong> Weinly carefully vets all suppliers to protect buyer trust. Contact us on WhatsApp to request an invite code.
                  </p>
                </div>

                <div className="flex flex-col gap-1.5">
                  <label className={labelClass}>Invite code <span className="text-[#a75635]">*</span></label>
                  <input value={inviteCode} onChange={(e) => setInviteCode(e.target.value)} placeholder="e.g. WEINLY-SUP-2026" required className={inputClass} />
                </div>

                <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
                  <div className="flex flex-col gap-1.5">
                    <label className={labelClass}>Company name <span className="text-[#a75635]">*</span></label>
                    <input value={companyName} onChange={(e) => setCompanyName(e.target.value)} placeholder="e.g. Guangzhou Fabrics Co." required className={inputClass} />
                  </div>
                  <div className="flex flex-col gap-1.5">
                    <label className={labelClass}>Contact name <span className="text-[#a75635]">*</span></label>
                    <input value={contactName} onChange={(e) => setContactName(e.target.value)} placeholder="e.g. Li Wei" required className={inputClass} />
                  </div>
                </div>

                <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
                  <div className="flex flex-col gap-1.5">
                    <label className={labelClass}>Phone / WhatsApp</label>
                    <input value={phone} onChange={(e) => setPhone(e.target.value)} placeholder="+86 138 0000 0000" className={inputClass} />
                  </div>
                  <div className="flex flex-col gap-1.5">
                    <label className={labelClass}>WeChat ID</label>
                    <input value={wechat} onChange={(e) => setWechat(e.target.value)} placeholder="WeChat username" className={inputClass} />
                  </div>
                </div>

                <div className="flex flex-col gap-1.5">
                  <label className={labelClass}>Region / city</label>
                  <input value={region} onChange={(e) => setRegion(e.target.value)} placeholder="e.g. Guangzhou, China" className={inputClass} />
                </div>
              </>
            )}

            <div className="flex flex-col gap-1.5">
              <label className={labelClass}>Email address <span className="text-[#a75635]">*</span></label>
              <input value={email} onChange={(e) => setEmail(e.target.value)} placeholder="you@company.com" type="email" required className={inputClass} />
            </div>

            <div className="flex flex-col gap-1.5">
              <label className={labelClass}>Password <span className="text-[#a75635]">*</span></label>
              <div className="relative">
                <input
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  placeholder={mode === "signup" ? "Min. 8 characters" : "Your password"}
                  type={showPassword ? "text" : "password"}
                  required
                  minLength={mode === "signup" ? 8 : undefined}
                  className="w-full px-4 py-3 pr-11 rounded-lg bg-stone-50 border border-stone-200 text-[#1f2933] text-sm placeholder:text-stone-400 outline-none focus:border-[#24483f] focus:bg-[#24483f]/5 transition-all"
                />
                <button type="button" onClick={() => setShowPassword((v) => !v)}
                  className="absolute right-3 top-1/2 -translate-y-1/2 text-stone-400 hover:text-stone-600 transition-colors select-none bg-transparent border-0 cursor-pointer p-0"
                  aria-label={showPassword ? "Hide password" : "Show password"}>
                  {showPassword ? <EyeOffIcon /> : <EyeIcon />}
                </button>
              </div>
            </div>

            <button
              type="submit"
              disabled={loading}
              className="w-full bg-gradient-to-r from-[#24483f] to-[#1a3530] text-white font-bold text-sm py-3.5 rounded-lg shadow-lg shadow-stone-900/10 border-0 cursor-pointer disabled:opacity-60 disabled:cursor-not-allowed mt-1">
              {loading ? "Please wait..." : mode === "login" ? "Log in to supplier portal" : "Create supplier account"}
            </button>
          </form>
        </div>

        <p className="text-center text-stone-500 text-xs">
          Are you a buyer?{" "}
          <a href="/auth" className="text-[#a75635] no-underline hover:text-[#7b3525]">Log in here instead</a>
        </p>
      </div>
    </main>
  );
}
