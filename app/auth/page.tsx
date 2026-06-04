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
  const [showPassword, setShowPassword] = useState(false);
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
              role: "buyer",
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
    <main className="min-h-screen bg-[#f5ecdc] flex items-center justify-center px-4 py-12 font-sans">
      <div className="w-full max-w-md flex flex-col gap-4">

        {/* Brand */}
        <div className="text-center mb-2">
          <a href="/" className="inline-flex items-center no-underline mb-4">
            <img src="/weinly-logo.svg" alt="Weinly" className="h-10 w-auto" />
          </a>
          <h1 className="text-2xl md:text-3xl font-black text-[#1f2933] tracking-tight mb-2">
            {mode === "login" ? "Welcome back" : "Create your account"}
          </h1>
          <p className="text-stone-500 text-sm leading-relaxed">
            {mode === "login"
              ? "Log in to track your fabric sourcing requests."
              : "Join Weinly to source premium fabrics from China."}
          </p>
        </div>

        {/* Card */}
        <div className="bg-white border border-stone-200 rounded-lg p-6 md:p-8 shadow-sm">

          {/* Tab toggle */}
          <div className="flex gap-2 mb-6 bg-stone-50 border border-stone-200 rounded-lg p-1.5">
            {(["login", "signup"] as const).map((tab) => (
              <button
                key={tab}
                type="button"
                onClick={() => { setMode(tab); setMessage(null); }}
                className={`flex-1 py-2.5 px-4 rounded-md text-sm font-bold border-0 cursor-pointer transition-all ${mode === tab ? "bg-gradient-to-r from-[#a75635] to-[#7b3525] text-white shadow-lg shadow-stone-900/10" : "text-stone-500 bg-transparent hover:text-stone-700"}`}>
                {tab === "login" ? "Log in" : "Sign up"}
              </button>
            ))}
          </div>

          {/* Message */}
          {message && (
            <div className={`rounded-lg p-4 mb-4 text-sm leading-relaxed ${message.type === "success" ? "bg-emerald-500/8 border border-emerald-500/20 text-[#2f7d57]" : "bg-red-500/8 border border-red-500/20 text-red-600"}`}>
              {message.text}
            </div>
          )}

          <form onSubmit={handleAuth} className="flex flex-col gap-4">
            {mode === "signup" && (
              <>
                <div className="flex flex-col gap-1.5">
                  <label className="text-stone-600 text-xs font-bold uppercase tracking-wider">Full name</label>
                  <input
                    value={name}
                    onChange={(e) => setName(e.target.value)}
                    placeholder="e.g. Amaka Obi"
                    required
                    className="w-full px-4 py-3 rounded-md bg-stone-50 border border-stone-200 text-[#1f2933] text-sm placeholder:text-stone-400 outline-none focus:border-amber-500 focus:bg-amber-500/5 transition-all"
                  />
                </div>
                <div className="flex flex-col gap-1.5">
                  <label className="text-stone-600 text-xs font-bold uppercase tracking-wider">WhatsApp / phone</label>
                  <input
                    value={phone}
                    onChange={(e) => setPhone(e.target.value)}
                    placeholder="+234 800 000 0000"
                    className="w-full px-4 py-3 rounded-md bg-stone-50 border border-stone-200 text-[#1f2933] text-sm placeholder:text-stone-400 outline-none focus:border-amber-500 focus:bg-amber-500/5 transition-all"
                  />
                </div>
              </>
            )}

            <div className="flex flex-col gap-1.5">
              <label className="text-stone-600 text-xs font-bold uppercase tracking-wider">Email address</label>
              <input
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                placeholder="you@example.com"
                type="email"
                required
                className="w-full px-4 py-3 rounded-md bg-stone-50 border border-stone-200 text-[#1f2933] text-sm placeholder:text-stone-400 outline-none focus:border-amber-500 focus:bg-amber-500/5 transition-all"
              />
            </div>

            <div className="flex flex-col gap-1.5">
              <div className="flex justify-between items-center">
                <label className="text-stone-600 text-xs font-bold uppercase tracking-wider">Password</label>
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
                    className="text-[#a75635] text-xs font-semibold bg-transparent border-0 cursor-pointer hover:text-[#7b3525] transition-colors p-0">
                    Forgot password?
                  </button>
                )}
              </div>
              <div className="relative">
                <input
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  placeholder={mode === "signup" ? "Min. 8 characters" : "Your password"}
                  type={showPassword ? "text" : "password"}
                  required
                  minLength={mode === "signup" ? 8 : undefined}
                  className="w-full px-4 py-3 pr-11 rounded-md bg-stone-50 border border-stone-200 text-[#1f2933] text-sm placeholder:text-stone-400 outline-none focus:border-[#24483f] focus:bg-[#24483f]/5 transition-all"
                />
                <button type="button" onClick={() => setShowPassword((v) => !v)}
                  className="absolute right-3 top-1/2 -translate-y-1/2 text-stone-400 hover:text-stone-600 transition-colors select-none bg-transparent border-0 cursor-pointer p-0"
                  aria-label={showPassword ? "Hide password" : "Show password"}>
                  {showPassword ? (
                    <svg xmlns="http://www.w3.org/2000/svg" width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                      <path d="M17.94 17.94A10.07 10.07 0 0 1 12 20c-7 0-11-8-11-8a18.45 18.45 0 0 1 5.06-5.94"/><path d="M9.9 4.24A9.12 9.12 0 0 1 12 4c7 0 11 8 11 8a18.5 18.5 0 0 1-2.16 3.19"/><line x1="1" y1="1" x2="23" y2="23"/>
                    </svg>
                  ) : (
                    <svg xmlns="http://www.w3.org/2000/svg" width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                      <path d="M1 12s4-8 11-8 11 8 11 8-4 8-11 8-11-8-11-8z"/><circle cx="12" cy="12" r="3"/>
                    </svg>
                  )}
                </button>
              </div>
            </div>

            <button
              type="submit"
              disabled={loading}
              className="w-full bg-gradient-to-r from-[#a75635] to-[#7b3525] text-white font-bold text-sm py-3.5 rounded-md shadow-lg shadow-stone-900/10 border-0 cursor-pointer disabled:opacity-60 disabled:cursor-not-allowed mt-1">
              {loading ? "Please wait..." : mode === "login" ? "Log in to Weinly" : "Create account"}
            </button>
          </form>
        </div>

        <p className="text-center text-stone-500 text-xs">
          By continuing you agree to Weinly's terms of service.{" "}
          <a href="/" className="text-[#a75635] no-underline hover:text-[#7b3525]">Back to home</a>
        </p>
      </div>
    </main>
  );
}
