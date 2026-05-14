import { Metadata } from "next";
import Link from "next/link";
import SiteHeader from "@/components/SiteHeader";
import SiteFooter from "@/components/SiteFooter";
import { buildWhatsappLink } from "@/lib/config";

export const metadata: Metadata = {
  title: "About Weinly — The Story Behind the Platform",
  description: "Weinly was built by someone living in China who watched African fabric buyers get overcharged by middlemen for years. Here's why we built it and what we're trying to change.",
  openGraph: {
    title: "About Weinly — The Story Behind the Platform",
    description: "Built in China, for the world. Weinly connects international fabric buyers directly to verified Chinese manufacturers — no middlemen, no markups.",
    url: "https://weinlyhq.com/about",
    siteName: "Weinly",
    type: "website",
  },
  alternates: { canonical: "https://weinlyhq.com/about" },
};

const stats = [
  { value: "9", label: "Fabric categories" },
  { value: "70+", label: "Fabric types" },
  { value: "China", label: "Sourcing origin" },
  { value: "Global", label: "Buyers served" },
];

const values = [
  {
    icon: "🔍",
    title: "Radical transparency",
    desc: "You see price, MOQ and lead time before paying a single kobo. No hidden fees, no surprise markups. What you see is what you get.",
  },
  {
    icon: "🔗",
    title: "Direct access",
    desc: "We give you the supplier's phone number, WeChat and email. Once you have it, it's yours. We don't sit in the middle of every deal forever.",
  },
  {
    icon: "✓",
    title: "Verified trust",
    desc: "Every supplier on Weinly is manually reviewed. Verified suppliers carry a green badge earned through audit — not paid for.",
  },
  {
    icon: "🌍",
    title: "Built for the global south",
    desc: "Most sourcing platforms are built for Western buyers with Western budgets. Weinly is built for African, Middle Eastern and diaspora buyers — with pricing, currencies and support that actually fits.",
  },
];

const timeline = [
  {
    period: "The problem",
    title: "Watching buyers get burned from inside China",
    desc: "Living in China, it became impossible to ignore. Fabric buyers from Nigeria, Ghana, Kenya and across Africa were paying 3–5x factory price for the same fabric — funnelled through layers of agents, middlemen and WhatsApp resellers. The factories were right there. The buyers were ready to buy. Nobody was building the bridge.",
  },
  {
    period: "The insight",
    title: "The gap wasn't logistics — it was trust and access",
    desc: "Buyers didn't need someone to ship fabric for them. They needed to find the right supplier, verify they were legitimate, see real pricing, and get a direct line of communication. That's it. Everything else they could handle themselves — if someone just gave them access.",
  },
  {
    period: "The build",
    title: "Weinly starts with a simple idea",
    desc: "Submit what you need. Get quotes from verified suppliers. Pay once to unlock direct contact. No subscriptions required, no minimum spend, no agent sitting between you and the factory for every reorder forever. Just a clean, transparent bridge.",
  },
  {
    period: "Today",
    title: "Growing into global textile infrastructure",
    desc: "Weinly now covers 9 fabric categories and 70+ fabric types, connecting buyers worldwide to verified Chinese manufacturers. We're just getting started.",
  },
];

export default function AboutPage() {
  const whatsappLink = buildWhatsappLink("Hello Weinly, I'd like to learn more about the platform.");

  return (
    <main className="min-h-screen bg-[#0a0f1e] px-3 py-3 font-sans md:px-4 md:py-4">
      <div className="mx-auto flex max-w-4xl flex-col gap-4">
        <SiteHeader />

        {/* Breadcrumb */}
        <nav className="flex items-center gap-2 text-xs text-slate-600">
          <Link href="/" className="text-slate-600 no-underline hover:text-slate-400 transition-colors">Home</Link>
          <span>/</span>
          <span className="text-slate-400">About</span>
        </nav>

        {/* Hero */}
        <section className="relative overflow-hidden rounded-3xl border border-indigo-500/15 bg-gradient-to-br from-[#0f172a] via-[#1a1040] to-[#0c1a3a] p-6 md:p-14 shadow-2xl shadow-indigo-500/10">
          <div className="pointer-events-none absolute right-0 top-0 h-80 w-80 translate-x-1/3 -translate-y-1/3 rounded-full bg-indigo-500/10 blur-3xl" />
          <div className="pointer-events-none absolute bottom-0 left-0 h-64 w-64 -translate-x-1/3 translate-y-1/3 rounded-full bg-violet-500/8 blur-3xl" />
          <div className="relative z-10 max-w-2xl">
            <div className="mb-5 inline-flex items-center gap-2 rounded-full border border-indigo-500/25 bg-indigo-500/10 px-4 py-1.5">
              <span className="h-2 w-2 rounded-full bg-emerald-400" />
              <span className="text-xs font-semibold text-indigo-300">Built in China · For the world</span>
            </div>
            <h1 className="mb-4 text-3xl font-black leading-tight tracking-tight text-white md:text-5xl">
              We built the bridge{" "}
              <span className="bg-gradient-to-r from-indigo-400 via-sky-400 to-emerald-400 bg-clip-text text-transparent">
                nobody else would
              </span>
            </h1>
            <p className="mb-6 text-base leading-relaxed text-slate-400 md:text-lg">
              Weinly was built by someone living in China who watched African and international fabric buyers
              overpay for years — not because good factories didn't exist, but because nobody was connecting
              them directly. We decided to fix that.
            </p>
            <div className="flex flex-wrap gap-3">
              <Link href="/#main-tabs"
                className="inline-flex items-center rounded-xl bg-gradient-to-r from-indigo-500 to-indigo-700 px-6 py-3 text-sm font-bold text-white no-underline shadow-lg shadow-indigo-500/25">
                Start sourcing →
              </Link>
              <a href={whatsappLink} target="_blank" rel="noreferrer"
                className="inline-flex items-center rounded-xl border border-white/10 bg-white/6 px-6 py-3 text-sm font-semibold text-slate-300 no-underline transition-all hover:bg-white/10">
                Talk to us
              </a>
            </div>
          </div>
        </section>

        {/* Stats */}
        <div className="grid grid-cols-2 gap-3 md:grid-cols-4">
          {stats.map((s) => (
            <div key={s.label} className="rounded-2xl border border-white/7 bg-[#111827] p-5 text-center">
              <div className="text-3xl font-black text-white mb-1">{s.value}</div>
              <div className="text-xs text-slate-500 font-semibold">{s.label}</div>
            </div>
          ))}
        </div>

        {/* The story */}
        <section className="rounded-3xl border border-white/7 bg-[#111827] p-6 md:p-10">
          <span className="mb-3 inline-block rounded-full bg-indigo-500/12 px-3 py-1 text-xs font-bold uppercase tracking-widest text-indigo-400">
            Our story
          </span>
          <h2 className="mb-8 text-2xl font-black tracking-tight text-white md:text-3xl">
            How Weinly came to exist
          </h2>
          <div className="flex flex-col gap-0">
            {timeline.map((item, i) => (
              <div key={item.period} className="flex gap-5">
                {/* Timeline line */}
                <div className="flex flex-col items-center">
                  <div className="flex h-8 w-8 shrink-0 items-center justify-center rounded-full bg-gradient-to-br from-indigo-500 to-violet-600 text-xs font-black text-white shadow-lg shadow-indigo-500/30">
                    {i + 1}
                  </div>
                  {i < timeline.length - 1 && (
                    <div className="mt-2 w-px flex-1 bg-gradient-to-b from-indigo-500/30 to-transparent mb-2" />
                  )}
                </div>
                {/* Content */}
                <div className={`pb-8 ${i === timeline.length - 1 ? "pb-0" : ""}`}>
                  <div className="mb-1 text-xs font-bold uppercase tracking-widest text-indigo-400">{item.period}</div>
                  <h3 className="mb-2 text-base font-bold text-white md:text-lg">{item.title}</h3>
                  <p className="m-0 text-sm leading-relaxed text-slate-400">{item.desc}</p>
                </div>
              </div>
            ))}
          </div>
        </section>

        {/* The problem we solve */}
        <section className="rounded-3xl border border-white/7 bg-[#111827] p-6 md:p-10">
          <span className="mb-3 inline-block rounded-full bg-red-500/12 px-3 py-1 text-xs font-bold uppercase tracking-widest text-red-400">
            The problem
          </span>
          <h2 className="mb-4 text-2xl font-black tracking-tight text-white md:text-3xl">
            Fabric sourcing was broken
          </h2>
          <p className="mb-6 text-sm leading-relaxed text-slate-400 md:text-base max-w-2xl">
            Before Weinly, a fashion designer in Lagos trying to source Swiss lace from China had to go through:
          </p>
          <div className="mb-8 grid grid-cols-1 gap-3 md:grid-cols-2">
            {[
              { problem: "WhatsApp agents adding 40–80% margins on top of factory price", icon: "💸" },
              { problem: "No way to verify if a supplier was real before sending money", icon: "❓" },
              { problem: "Paying for fabric blind — no samples, no quality guarantee", icon: "🎲" },
              { problem: "Communication barriers with Chinese factories", icon: "🚧" },
              { problem: "No price transparency — every quote was a negotiation in the dark", icon: "🌑" },
              { problem: "Getting locked into one agent forever with no direct supplier access", icon: "🔒" },
            ].map((item) => (
              <div key={item.problem} className="flex items-start gap-3 rounded-xl border border-red-500/10 bg-red-500/5 p-4">
                <span className="text-lg shrink-0">{item.icon}</span>
                <span className="text-sm text-slate-400 leading-relaxed">{item.problem}</span>
              </div>
            ))}
          </div>
          <div className="rounded-2xl border border-emerald-500/20 bg-emerald-500/6 p-5">
            <div className="mb-2 text-sm font-bold text-emerald-300">How Weinly changes this</div>
            <p className="m-0 text-sm leading-relaxed text-slate-400">
              Submit what you need. See real quotes with real prices and MOQs from verified suppliers.
              Pay once to unlock direct contact — phone, WeChat, email. From that point, you own the
              relationship. No agent in the middle. No markup on every reorder. Just you and the factory.
            </p>
          </div>
        </section>

        {/* Values */}
        <section className="rounded-3xl border border-white/7 bg-[#111827] p-6 md:p-10">
          <span className="mb-3 inline-block rounded-full bg-amber-500/12 px-3 py-1 text-xs font-bold uppercase tracking-widest text-amber-400">
            What we stand for
          </span>
          <h2 className="mb-6 text-2xl font-black tracking-tight text-white md:text-3xl">
            Our values
          </h2>
          <div className="grid grid-cols-1 gap-4 md:grid-cols-2">
            {values.map((v) => (
              <div key={v.title} className="rounded-2xl border border-white/7 bg-white/4 p-5">
                <div className="mb-3 text-2xl">{v.icon}</div>
                <h3 className="mb-2 text-sm font-bold text-white">{v.title}</h3>
                <p className="m-0 text-sm leading-relaxed text-slate-400">{v.desc}</p>
              </div>
            ))}
          </div>
        </section>

        {/* Who we serve */}
        <section className="rounded-3xl border border-white/7 bg-[#111827] p-6 md:p-10">
          <span className="mb-3 inline-block rounded-full bg-sky-500/12 px-3 py-1 text-xs font-bold uppercase tracking-widest text-sky-400">
            Who we serve
          </span>
          <h2 className="mb-4 text-2xl font-black tracking-tight text-white md:text-3xl">
            Built for serious buyers worldwide
          </h2>
          <p className="mb-6 text-sm leading-relaxed text-slate-400 md:text-base max-w-2xl">
            Weinly is for anyone who buys fabric professionally — whether you're a boutique designer
            ordering 100 yards or a wholesale trader ordering containers.
          </p>
          <div className="grid grid-cols-2 gap-2 md:grid-cols-3 lg:grid-cols-4">
            {[
              "Fashion designers", "Fabric wholesalers", "Boutique owners",
              "Garment factories", "Event planners", "Asoebi suppliers",
              "Interior designers", "Sportswear brands", "Children's wear makers",
              "Hotel & hospitality", "Online fabric stores", "African diaspora buyers",
            ].map((buyer) => (
              <div key={buyer} className="rounded-xl border border-white/7 bg-white/4 px-3 py-2.5 text-xs font-semibold text-slate-400 text-center">
                {buyer}
              </div>
            ))}
          </div>
        </section>

        {/* Why China + Africa */}
        <section className="rounded-3xl border border-amber-500/15 bg-gradient-to-br from-[#1a0f00] to-[#0f0a00] p-6 md:p-10">
          <span className="mb-3 inline-block rounded-full bg-amber-500/15 px-3 py-1 text-xs font-bold uppercase tracking-widest text-amber-400">
            The advantage
          </span>
          <h2 className="mb-4 text-2xl font-black tracking-tight text-white md:text-3xl">
            Why being in China matters
          </h2>
          <p className="mb-6 text-sm leading-relaxed text-slate-400 md:text-base max-w-2xl">
            Most sourcing platforms are built by people who have never set foot inside a Chinese textile
            market. Weinly is built by someone who lives there — who has walked the fabric markets of
            Guangzhou, Keqiao and Hangzhou, spoken directly to factory owners, and understands exactly
            what buyers need to know before placing an order.
          </p>
          <div className="grid grid-cols-1 gap-3 md:grid-cols-3">
            {[
              { title: "On-the-ground presence", desc: "We know the real factories from the trading companies, the good markets from the risky ones." },
              { title: "Supplier relationships", desc: "Verified suppliers on Weinly are vetted personally — not just through a form on a website." },
              { title: "Market intelligence", desc: "We know current fabric pricing, seasonal availability and which suppliers are actually reliable." },
            ].map((item) => (
              <div key={item.title} className="rounded-2xl border border-amber-500/15 bg-amber-500/6 p-4">
                <h3 className="mb-2 text-sm font-bold text-amber-300">{item.title}</h3>
                <p className="m-0 text-xs leading-relaxed text-slate-400">{item.desc}</p>
              </div>
            ))}
          </div>
        </section>

        {/* CTA */}
        <section className="rounded-3xl border border-indigo-500/20 bg-gradient-to-br from-indigo-950 to-violet-950 p-6 md:p-10 text-center">
          <h2 className="mb-3 text-2xl font-black tracking-tight text-white md:text-3xl">
            Ready to source smarter?
          </h2>
          <p className="mb-6 text-sm leading-relaxed text-slate-400 max-w-lg mx-auto">
            Join buyers worldwide who use Weinly to source fabric directly from verified Chinese
            manufacturers — at factory prices, with no permanent middleman.
          </p>
          <div className="flex flex-wrap justify-center gap-3">
            <Link href="/#main-tabs"
              className="inline-flex items-center rounded-xl bg-gradient-to-r from-indigo-500 to-violet-600 px-8 py-3.5 text-sm font-bold text-white no-underline shadow-lg shadow-indigo-500/25">
              Submit your first request →
            </Link>
            <a href={whatsappLink} target="_blank" rel="noreferrer"
              className="inline-flex items-center rounded-xl border border-white/10 bg-white/6 px-8 py-3.5 text-sm font-semibold text-slate-300 no-underline hover:bg-white/10 transition-all">
              Talk to us on WhatsApp
            </a>
          </div>
        </section>

        <SiteFooter />
      </div>
    </main>
  );
}
