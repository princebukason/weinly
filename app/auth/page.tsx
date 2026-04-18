"use client";

import { useState } from "react";
import { createClient } from "@/lib/supabase/client";
import { useRouter } from "next/navigation";

export default function AuthPage() {
  const [mode, setMode] = useState<"login" | "signup">("login");
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [name, setName] = useState("");
  const [phone, setPhone] = useState("");
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
        const { error } = await supabase.auth.signUp({
  email: email.trim(),
  password,
  options: {
    data: {
      role: "buyer",  // ← ADD THIS LINE
      full_name: name.trim(),
      phone: phone.trim(),
    },
  },
});

        if (error) throw error;

        setMessage({
          type: "success",
          text: "Account created! Check your email to confirm your account, then log in.",
        });
        setMode("login");
      } else {
        const { error } = await supabase.auth.signInWithPassword({
          email: email.trim(),
          password,
        });

        if (error) throw error;

        router.push("/dashboard");
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

        {/* Brand */}
        <div className="text-center mb-2">
          <a href="/" className="inline-flex items-center gap-2 no-underline mb-4">
            <span className="w-10 h-10 rounded-full bg-gradient-to-br from-indigo-500 to-indigo-700 flex items-center justify-center text-white font-black text-base shadow-lg shadow-indigo-500/30">W</span>
            <span className="text-white font-black text-2xl tracking-tight">Weinly</span>
          </a>
          <h1 className="text-2xl md:text-3xl font-black text-white tracking-tight mb-2">
            {mode === "login" ? "Welcome back" : "Create your account"}
          </h1>
          <p className="text-slate-500 text-sm leading-relaxed">
            {mode === "login"
              ? "Log in to track your fabric sourcing requests."
              : "Join Weinly to source premium fabrics from China."}
          </p>
        </div>

        {/* Card */}
        <div className="bg-[#111827] border border-white/7 rounded-3xl p-6 md:p-8 shadow-xl shadow-indigo-500/8">

          {/* Tab toggle */}
          <div className="flex gap-2 mb-6 bg-white/4 border border-white/7 rounded-2xl p-1.5">
            {(["login", "signup"] as const).map((tab) => (
              <button
                key={tab}
                type="button"
                onClick={() => { setMode(tab); setMessage(null); }}
                className={`flex-1 py-2.5 px-4 rounded-xl text-sm font-bold border-0 cursor-pointer transition-all ${mode === tab ? "bg-gradient-to-r from-indigo-500 to-indigo-700 text-white shadow-lg shadow-indigo-500/25" : "text-slate-500 bg-transparent hover:text-slate-300"}`}>
                {tab === "login" ? "Log in" : "Sign up"}
              </button>
            ))}
          </div>

          {/* Message */}
          {message && (
            <div className={`rounded-xl p-4 mb-4 text-sm leading-relaxed ${message.type === "success" ? "bg-emerald-500/8 border border-emerald-500/20 text-emerald-300" : "bg-red-500/8 border border-red-500/20 text-red-300"}`}>
              {message.text}
            </div>
          )}

          <form onSubmit={handleAuth} className="flex flex-col gap-4">
            {mode === "signup" && (
              <>
                <div className="flex flex-col gap-1.5">
                  <label className="text-slate-400 text-xs font-bold uppercase tracking-wider">Full name</label>
                  <input
                    value={name}
                    onChange={(e) => setName(e.target.value)}
                    placeholder="e.g. Amaka Obi"
                    required
                    className="w-full px-4 py-3 rounded-xl bg-white/5 border border-white/10 text-white text-sm placeholder:text-slate-600 outline-none focus:border-indigo-500 focus:bg-indigo-500/5 transition-all"
                  />
                </div>
                <div className="flex flex-col gap-1.5">
                  <label className="text-slate-400 text-xs font-bold uppercase tracking-wider">WhatsApp / phone</label>
                  <input
                    value={phone}
                    onChange={(e) => setPhone(e.target.value)}
                    placeholder="+234 800 000 0000"
                    className="w-full px-4 py-3 rounded-xl bg-white/5 border border-white/10 text-white text-sm placeholder:text-slate-600 outline-none focus:border-indigo-500 focus:bg-indigo-500/5 transition-all"
                  />
                </div>
              </>
            )}

            <div className="flex flex-col gap-1.5">
              <label className="text-slate-400 text-xs font-bold uppercase tracking-wider">Email address</label>
              <input
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                placeholder="you@example.com"
                type="email"
                required
                className="w-full px-4 py-3 rounded-xl bg-white/5 border border-white/10 text-white text-sm placeholder:text-slate-600 outline-none focus:border-indigo-500 focus:bg-indigo-500/5 transition-all"
              />
            </div>

            <div className="flex flex-col gap-1.5">
              <div className="flex justify-between items-center">
                <label className="text-slate-400 text-xs font-bold uppercase tracking-wider">Password</label>
                {mode === "login" && (
                  <button
                    type="button"
                    onClick={async () => {
                      if (!email.trim()) { setMessage({ type: "error", text: "Enter your email first." }); return; }
                      setLoading(true);
                      const { error } = await supabase.auth.resetPasswordForEmail(email.trim(), { redirectTo: `${window.location.origin}/auth/reset` });
                      setLoading(false);
                      setMessage(error ? { type: "error", text: error.message } : { type: "success", text: "Password reset email sent. Check your inbox." });
                    }}
                    className="text-indigo-400 text-xs font-semibold bg-transparent border-0 cursor-pointer hover:text-indigo-300 transition-colors p-0">
                    Forgot password?
                  </button>
                )}
              </div>
              <input
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                placeholder={mode === "signup" ? "Min. 8 characters" : "Your password"}
                type="password"
                required
                minLength={mode === "signup" ? 8 : undefined}
                className="w-full px-4 py-3 rounded-xl bg-white/5 border border-white/10 text-white text-sm placeholder:text-slate-600 outline-none focus:border-indigo-500 focus:bg-indigo-500/5 transition-all"
              />
            </div>

            <button
              type="submit"
              disabled={loading}
              className="w-full bg-gradient-to-r from-indigo-500 to-indigo-700 text-white font-bold text-sm py-3.5 rounded-xl shadow-lg shadow-indigo-500/25 border-0 cursor-pointer disabled:opacity-60 disabled:cursor-not-allowed mt-1">
              {loading ? "Please wait..." : mode === "login" ? "Log in to Weinly" : "Create account"}
            </button>
          </form>
        </div>

        <p className="text-center text-slate-600 text-xs">
          By continuing you agree to Weinly's terms of service.{" "}
          <a href="/" className="text-indigo-400 no-underline hover:text-indigo-300">Back to home</a>
        </p>
      </div>
    </main>
  );
}