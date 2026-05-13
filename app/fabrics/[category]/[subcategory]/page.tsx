import { Metadata } from "next";
import { notFound } from "next/navigation";
import Link from "next/link";
import { FABRIC_CATEGORIES, getCategoryColor } from "@/lib/categories";
import { buildWhatsappLink } from "@/lib/config";
import SiteHeader from "@/components/SiteHeader";
import SiteFooter from "@/components/SiteFooter";

type Props = { params: { category: string; subcategory: string } };

function slugToLabel(slug: string): string {
  return slug.replace(/-/g, " ").replace(/\b\w/g, (c) => c.toUpperCase());
}

function labelToSlug(label: string): string {
  return label.toLowerCase().replace(/[^a-z0-9]+/g, "-").replace(/(^-|-$)/g, "");
}

export async function generateStaticParams() {
  const params: { category: string; subcategory: string }[] = [];
  FABRIC_CATEGORIES.forEach((cat) => {
    cat.subcategories.forEach((sub) => {
      params.push({ category: cat.id, subcategory: labelToSlug(sub) });
    });
  });
  return params;
}

export async function generateMetadata({ params }: Props): Promise<Metadata> {
  const cat = FABRIC_CATEGORIES.find((c) => c.id === params.category);
  if (!cat) return {};
  const subLabel = cat.subcategories.find((s) => labelToSlug(s) === params.subcategory);
  if (!subLabel) return {};

  const title = `Buy ${subLabel} from China — Verified Wholesale Suppliers | Weinly`;
  const description = `Source ${subLabel} directly from verified Chinese manufacturers. Get competitive quotes, compare prices, check MOQ and lead times — then connect directly with the right supplier. Shipping worldwide.`;

  return {
    title,
    description,
    keywords: [
      `${subLabel} wholesale`,
      `${subLabel} manufacturer China`,
      `buy ${subLabel} from China`,
      `${subLabel} fabric supplier`,
      `${subLabel} bulk order`,
      `${cat.label} supplier China`,
    ].join(", "),
    openGraph: {
      title,
      description,
      url: `https://weinlyhq.com/fabrics/${params.category}/${params.subcategory}`,
      siteName: "Weinly",
      type: "website",
    },
    twitter: {
      card: "summary_large_image",
      title,
      description,
    },
    alternates: {
      canonical: `https://weinlyhq.com/fabrics/${params.category}/${params.subcategory}`,
    },
  };
}

export default function SubcategorySEOPage({ params }: Props) {
  const cat = FABRIC_CATEGORIES.find((c) => c.id === params.category);
  if (!cat) notFound();

  const subLabel = cat.subcategories.find((s) => labelToSlug(s) === params.subcategory);
  if (!subLabel) notFound();

  const color = getCategoryColor(params.category);
  const whatsappLink = buildWhatsappLink(`Hello Weinly, I'm looking to source ${subLabel} from China. Can you help?`);

  const structuredData = {
    "@context": "https://schema.org",
    "@type": "Product",
    "name": subLabel,
    "description": `${subLabel} sourced directly from verified Chinese manufacturers. Competitive wholesale pricing, flexible MOQ, worldwide shipping.`,
    "brand": { "@type": "Organization", "name": "Weinly" },
    "offers": {
      "@type": "AggregateOffer",
      "priceCurrency": "USD",
      "availability": "https://schema.org/InStock",
      "seller": { "@type": "Organization", "name": "Weinly" },
    },
  };

  // Related subcategories (others in the same category)
  const relatedSubs = cat.subcategories.filter((s) => s !== subLabel).slice(0, 6);

  return (
    <>
      <script
        type="application/ld+json"
        dangerouslySetInnerHTML={{ __html: JSON.stringify(structuredData) }}
      />
      <main className="min-h-screen bg-[#0a0f1e] px-3 py-3 font-sans md:px-4 md:py-4">
        <div className="mx-auto flex max-w-5xl flex-col gap-4">
          <SiteHeader />

          {/* Breadcrumb */}
          <nav className="flex items-center gap-2 text-xs text-slate-600 flex-wrap">
            <Link href="/" className="text-slate-600 no-underline hover:text-slate-400 transition-colors">Home</Link>
            <span>/</span>
            <Link href="/fabrics" className="text-slate-600 no-underline hover:text-slate-400 transition-colors">Fabrics</Link>
            <span>/</span>
            <Link href={`/fabrics/${params.category}`} className={`no-underline hover:opacity-80 transition-opacity ${color.text}`}>{cat.label}</Link>
            <span>/</span>
            <span className="text-slate-400">{subLabel}</span>
          </nav>

          {/* Hero */}
          <section className={`relative overflow-hidden rounded-3xl border p-6 md:p-12 ${color.bg} ${color.border}`}>
            <div className="pointer-events-none absolute right-0 top-0 h-72 w-72 translate-x-1/3 -translate-y-1/3 rounded-full bg-white/5 blur-3xl" />
            <div className="relative z-10">
              <div className={`mb-3 inline-flex items-center gap-2 rounded-full border px-3 py-1 ${color.border} bg-black/20`}>
                <span className={`text-xs font-semibold ${color.text}`}>{cat.label}</span>
              </div>
              <h1 className="mb-3 text-3xl font-black tracking-tight text-white md:text-5xl leading-tight">
                Buy {subLabel} Direct from China
              </h1>
              <h2 className={`mb-4 text-base font-semibold md:text-lg ${color.text}`}>
                Verified wholesale suppliers · Competitive pricing · Ships worldwide
              </h2>
              <p className="mb-6 max-w-2xl text-sm leading-relaxed text-slate-300 md:text-base">
                Source {subLabel} directly from verified Chinese manufacturers. Submit a free request, receive competitive quotes with price and MOQ, then connect directly with the right supplier — no middlemen, no markups.
              </p>
              <div className="flex flex-wrap gap-3">
                <Link href={`/?category=${params.category}&subcategory=${params.subcategory}&scroll=main-tabs`}
                  className="inline-flex items-center rounded-xl bg-white px-6 py-3 text-sm font-bold text-slate-900 no-underline shadow-lg transition-all hover:bg-white/90">
                  Get free quotes →
                </Link>
                <a href={whatsappLink} target="_blank" rel="noreferrer"
                  className="inline-flex items-center rounded-xl border border-white/20 bg-white/10 px-6 py-3 text-sm font-semibold text-white no-underline transition-all hover:bg-white/15">
                  Chat on WhatsApp
                </a>
              </div>
            </div>
          </section>

          {/* What you get */}
          <section className="rounded-3xl border border-white/7 bg-[#111827] p-5 md:p-8">
            <h2 className="mb-5 text-xl font-black tracking-tight text-white md:text-2xl">
              How Weinly helps you source {subLabel}
            </h2>
            <div className="grid grid-cols-1 gap-4 md:grid-cols-3">
              {[
                {
                  icon: "📋",
                  title: "Submit your specs",
                  desc: `Describe the ${subLabel} you need — quantity, quality, color, GSM, end use. Our AI formats it into a professional sourcing spec.`,
                },
                {
                  icon: "💬",
                  title: "Receive verified quotes",
                  desc: `Verified ${subLabel} suppliers respond with price per unit, minimum order quantity, lead time and region. Review before paying anything.`,
                },
                {
                  icon: "🔗",
                  title: "Connect directly",
                  desc: `Pay once to unlock direct supplier contact — phone, WeChat and email. Negotiate, sample, and order on your own terms.`,
                },
              ].map((item) => (
                <div key={item.title} className="rounded-2xl border border-white/7 bg-white/4 p-5">
                  <div className="mb-3 text-2xl">{item.icon}</div>
                  <h3 className="mb-2 text-sm font-bold text-white">{item.title}</h3>
                  <p className="m-0 text-xs leading-relaxed text-slate-400">{item.desc}</p>
                </div>
              ))}
            </div>
          </section>

          {/* Key facts */}
          <section className="rounded-3xl border border-white/7 bg-[#111827] p-5 md:p-8">
            <h2 className="mb-5 text-xl font-black tracking-tight text-white md:text-2xl">
              Sourcing {subLabel} from China — what to know
            </h2>
            <div className="grid grid-cols-1 gap-3 md:grid-cols-2">
              {[
                { label: "Pricing", text: `${subLabel} prices from China vary by quality grade, GSM, construction and order volume. Factory-direct pricing through Weinly is typically 30–60% below retail distributor pricing.` },
                { label: "Minimum order quantity", text: `MOQ for ${subLabel} varies by supplier — from as low as 50 meters for stocked items to 500+ meters for custom specifications. Your supplier will confirm exact minimums.` },
                { label: "Lead time", text: `In-stock ${subLabel} typically ships within 3–7 days. Custom or made-to-order fabric takes 15–35 days depending on complexity and volume.` },
                { label: "Shipping options", text: `Air freight (5–10 days) and sea freight (25–40 days) are both available. Your supplier provides shipping quotes once specifications are confirmed.` },
                { label: "Quality verification", text: `Weinly connects you directly to verified suppliers. You can request fabric swatches and negotiate quality specifications before placing bulk orders.` },
                { label: "Payment terms", text: `Most suppliers accept T/T bank transfer, with 30% deposit and 70% before shipment as standard. Some offer PayPal or Alibaba trade assurance for new relationships.` },
              ].map((fact) => (
                <div key={fact.label} className="rounded-2xl border border-white/7 bg-white/4 p-4">
                  <div className={`mb-1.5 text-xs font-black uppercase tracking-widest ${color.text}`}>{fact.label}</div>
                  <p className="m-0 text-sm leading-relaxed text-slate-400">{fact.text}</p>
                </div>
              ))}
            </div>
          </section>

          {/* CTA */}
          <section className={`rounded-3xl border p-6 md:p-8 text-center ${color.bg} ${color.border}`}>
            <h2 className="mb-2 text-2xl font-black tracking-tight text-white md:text-3xl">
              Source {subLabel} today
            </h2>
            <p className="mb-6 text-sm leading-relaxed text-slate-300 max-w-lg mx-auto">
              Submit a free request and get quotes from verified {subLabel} suppliers in China within 24 hours.
            </p>
            <div className="flex flex-wrap justify-center gap-3">
              <Link href="/#main-tabs"
                className="inline-flex items-center rounded-xl bg-white px-8 py-3.5 text-sm font-bold text-slate-900 no-underline shadow-lg transition-all hover:bg-white/90">
                Submit free request →
              </Link>
              <a href={whatsappLink} target="_blank" rel="noreferrer"
                className="inline-flex items-center rounded-xl border border-white/20 bg-black/20 px-8 py-3.5 text-sm font-semibold text-white no-underline hover:bg-black/30 transition-all">
                Ask on WhatsApp
              </a>
            </div>
          </section>

          {/* Related subcategories */}
          {relatedSubs.length > 0 && (
            <section className="rounded-3xl border border-white/7 bg-[#111827] p-5 md:p-6">
              <h2 className="mb-4 text-lg font-black tracking-tight text-white">
                More {cat.label.toLowerCase()} fabrics
              </h2>
              <div className="grid grid-cols-2 gap-2 md:grid-cols-3">
                {relatedSubs.map((sub) => (
                  <Link key={sub} href={`/fabrics/${params.category}/${labelToSlug(sub)}`}
                    className={`rounded-xl border p-3 no-underline transition-all hover:scale-[1.02] ${color.bg} ${color.border}`}>
                    <div className={`text-xs font-bold ${color.text}`}>{sub}</div>
                    <div className="text-xs text-slate-500 mt-0.5">Source from China →</div>
                  </Link>
                ))}
              </div>
              <div className="mt-3">
                <Link href={`/fabrics/${params.category}`} className={`text-sm font-semibold no-underline hover:opacity-80 transition-opacity ${color.text}`}>
                  View all {cat.label.toLowerCase()} →
                </Link>
              </div>
            </section>
          )}

          {/* All categories */}
          <section className="rounded-3xl border border-white/7 bg-[#111827] p-5">
            <h2 className="mb-4 text-sm font-black uppercase tracking-widest text-slate-500">All fabric categories</h2>
            <div className="grid grid-cols-2 gap-2 md:grid-cols-4 lg:grid-cols-5">
              {FABRIC_CATEGORIES.map((c) => {
                const cc = getCategoryColor(c.id);
                return (
                  <Link key={c.id} href={`/fabrics/${c.id}`}
                    className={`rounded-xl border p-3 no-underline transition-all hover:scale-[1.02] ${c.id === params.category ? `${cc.bg} ${cc.border}` : "border-white/7 bg-white/4"}`}>
                    <span className={`text-xs font-bold ${c.id === params.category ? cc.text : "text-slate-400"}`}>{c.label}</span>
                  </Link>
                );
              })}
            </div>
          </section>

          <SiteFooter />
        </div>
      </main>
    </>
  );
}
