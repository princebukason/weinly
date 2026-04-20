"use client";

import { useState } from "react";
import { createClient } from "@/lib/supabase/client";
import { useRouter } from "next/navigation";

export default function SupplierAuthPage() {
  const [mode, setMode] = useState<"login" | "signup">("login");
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
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

        const role = data.user?.user_metadata?.role;
        if (role !== "supplier") {
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

  return (
    <main className="min-h-screen bg-[#0a0f1e] flex items-center justify-center px-4 py-12 font-sans">
      <div className="w-full max-w-md flex flex-col gap-4">

        <div className="text-center mb-2">
          <a href="/" className="inline-flex items-center gap-2 no-underline mb-4">
            <span className="w-10 h-10 rounded-full bg-gradient-to-br from-amber-500 to-amber-700 flex items-center justify-center text-white font-black text-base shadow-lg shadow-amber-500/30">W</span>
            <span className="text-white font-black text-2xl tracking-tight">Weinly</span>
          </a>
          <div className="inline-flex items-center gap-2 bg-amber-500/10 border border-amber-500/25 rounded-full px-4 py-1.5 mb-3">
            <span className="w-2 h-2 rounded-full bg-amber-400" />
            <span className="text-amber-300 text-xs font-semibold">Supplier portal</span>
          </div>
          <h1 className="text-2xl md:text-3xl font-black text-white tracking-tight mb-2">
            {mode === "login" ? "Supplier login" : "Join as a supplier"}
          </h1>
          <p className="text-slate-500 text-sm leading-relaxed">
            {mode === "login"
              ? "Log in to view buyer requests and submit quotes."
              : "You need an invite code from Weinly to register as a supplier."}
          </p>
        </div>

        <div className="bg-[#111827] border border-white/7 rounded-3xl p-6 md:p-8 shadow-xl shadow-amber-500/5">
          <div className="flex gap-2 mb-6 bg-white/4 border border-white/7 rounded-2xl p-1.5">
            {(["login", "signup"] as const).map((tab) => (
              <button key={tab} type="button"
                onClick={() => { setMode(tab); setMessage(null); }}
                className={`flex-1 py-2.5 px-4 rounded-xl text-sm font-bold border-0 cursor-pointer transition-all ${mode === tab ? "bg-gradient-to-r from-amber-500 to-amber-700 text-white shadow-lg shadow-amber-500/25" : "text-slate-500 bg-transparent hover:text-slate-300"}`}>
                {tab === "login" ? "Log in" : "Register"}
              </button>
            ))}
          </div>

          {message && (
            <div className={`rounded-xl p-4 mb-4 text-sm leading-relaxed ${message.type === "success" ? "bg-emerald-500/8 border border-emerald-500/20 text-emerald-300" : "bg-red-500/8 border border-red-500/20 text-red-300"}`}>
              {message.text}
            </div>
          )}

          <form onSubmit={handleAuth} className="flex flex-col gap-4">
            {mode === "signup" && (
              <>
                <div className="bg-amber-500/6 border border-amber-500/20 rounded-xl p-4">
                  <p className="text-amber-300 text-xs leading-relaxed m-0">
                    <strong>Invite only.</strong> Weinly carefully vets all suppliers to protect buyer trust. Contact us on WhatsApp to request an invite code.
                  </p>
                </div>

                <div className="flex flex-col gap-1.5">
                  <label className="text-slate-400 text-xs font-bold uppercase tracking-wider">
                    Invite code <span className="text-amber-400">*</span>
                  </label>
                  <input
                    value={inviteCode}
                    onChange={(e) => setInviteCode(e.target.value)}
                    placeholder="e.g. WEINLY-SUP-2026"
                    required
                    className="w-full px-4 py-3 rounded-xl bg-white/5 border border-amber-500/20 text-white text-sm placeholder:text-slate-600 outline-none focus:border-amber-500 transition-all"
                  />
                </div>

                <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
                  <div className="flex flex-col gap-1.5">
                    <label className="text-slate-400 text-xs font-bold uppercase tracking-wider">
                      Company name <span className="text-amber-400">*</span>
                    </label>
                    <input
                      value={companyName}
                      onChange={(e) => setCompanyName(e.target.value)}
                      placeholder="e.g. Guangzhou Fabrics Co."
                      required
                      className="w-full px-4 py-3 rounded-xl bg-white/5 border border-white/10 text-white text-sm placeholder:text-slate-600 outline-none focus:border-amber-500 transition-all"
                    />
                  </div>
                  <div className="flex flex-col gap-1.5">
                    <label className="text-slate-400 text-xs font-bold uppercase tracking-wider">
                      Contact name <span className="text-amber-400">*</span>
                    </label>
                    <input
                      value={contactName}
                      onChange={(e) => setContactName(e.target.value)}
                      placeholder="e.g. Li Wei"
                      required
                      className="w-full px-4 py-3 rounded-xl bg-white/5 border border-white/10 text-white text-sm placeholder:text-slate-600 outline-none focus:border-amber-500 transition-all"
                    />
                  </div>
                </div>

                <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
                  <div className="flex flex-col gap-1.5">
                    <label className="text-slate-400 text-xs font-bold uppercase tracking-wider">Phone / WhatsApp</label>
                    <input
                      value={phone}
                      onChange={(e) => setPhone(e.target.value)}
                      placeholder="+86 138 0000 0000"
                      className="w-full px-4 py-3 rounded-xl bg-white/5 border border-white/10 text-white text-sm placeholder:text-slate-600 outline-none focus:border-amber-500 transition-all"
                    />
                  </div>
                  <div className="flex flex-col gap-1.5">
                    <label className="text-slate-400 text-xs font-bold uppercase tracking-wider">WeChat ID</label>
                    <input
                      value={wechat}
                      onChange={(e) => setWechat(e.target.value)}
                      placeholder="WeChat username"
                      className="w-full px-4 py-3 rounded-xl bg-white/5 border border-white/10 text-white text-sm placeholder:text-slate-600 outline-none focus:border-amber-500 transition-all"
                    />
                  </div>
                </div>

                <div className="flex flex-col gap-1.5">
                  <label className="text-slate-400 text-xs font-bold uppercase tracking-wider">Region / city</label>
                  <input
                    value={region}
                    onChange={(e) => setRegion(e.target.value)}
                    placeholder="e.g. Guangzhou, China"
                    className="w-full px-4 py-3 rounded-xl bg-white/5 border border-white/10 text-white text-sm placeholder:text-slate-600 outline-none focus:border-amber-500 transition-all"
                  />
                </div>
              </>
            )}

            <div className="flex flex-col gap-1.5">
              <label className="text-slate-400 text-xs font-bold uppercase tracking-wider">
                Email address <span className="text-amber-400">*</span>
              </label>
              <input
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                placeholder="you@company.com"
                type="email"
                required
                className="w-full px-4 py-3 rounded-xl bg-white/5 border border-white/10 text-white text-sm placeholder:text-slate-600 outline-none focus:border-amber-500 transition-all"
              />
            </div>

            <div className="flex flex-col gap-1.5">
              <label className="text-slate-400 text-xs font-bold uppercase tracking-wider">
                Password <span className="text-amber-400">*</span>
              </label>
              <input
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                placeholder={mode === "signup" ? "Min. 8 characters" : "Your password"}
                type="password"
                required
                minLength={mode === "signup" ? 8 : undefined}
                className="w-full px-4 py-3 rounded-xl bg-white/5 border border-white/10 text-white text-sm placeholder:text-slate-600 outline-none focus:border-amber-500 transition-all"
              />
            </div>

            <button
              type="submit"
              disabled={loading}
              className="w-full bg-gradient-to-r from-amber-500 to-amber-700 text-white font-bold text-sm py-3.5 rounded-xl shadow-lg shadow-amber-500/25 border-0 cursor-pointer disabled:opacity-60 disabled:cursor-not-allowed mt-1">
              {loading ? "Please wait..." : mode === "login" ? "Log in to supplier portal" : "Create supplier account"}
            </button>
          </form>
        </div>

        <p className="text-center text-slate-600 text-xs">
          Are you a buyer?{" "}
          <a href="/auth" className="text-indigo-400 no-underline hover:text-indigo-300">Log in here instead</a>
        </p>
      </div>
    </main>
  );
}