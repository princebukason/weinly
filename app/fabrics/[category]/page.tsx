import { Metadata } from "next";
import { notFound } from "next/navigation";
import Link from "next/link";
import { FABRIC_CATEGORIES, getCategoryColor } from "@/lib/categories";
import { buildWhatsappLink } from "@/lib/config";
import SiteHeader from "@/components/SiteHeader";
import SiteFooter from "@/components/SiteFooter";
import FabricImage from "@/components/FabricImage";

type Props = { params: { category: string } };

// Map category IDs to rich SEO content
const CATEGORY_SEO: Record<string, {
  headline: string;
  subheadline: string;
  description: string;
  keywords: string[];
  buyerTypes: string[];
  whyChina: string[];
  faqs: { q: string; a: string }[];
}> = {
  luxury: {
    headline: "Source Luxury Fabrics Direct from China",
    subheadline: "Swiss Lace, French Lace, Silk, Velvet & Bridal Fabric Wholesale",
    description: "Connect with verified Chinese manufacturers supplying premium luxury fabrics worldwide. Swiss lace, French lace, beaded lace, silk, velvet, organza, duchess satin and bridal mesh — sourced at factory prices and shipped directly to your door.",
    keywords: ["luxury fabric from China", "buy swiss lace wholesale", "french lace fabric supplier", "bridal fabric manufacturer China", "silk fabric wholesale China", "velvet fabric supplier"],
    buyerTypes: ["Bridal boutiques", "Luxury fashion designers", "Asoebi suppliers", "Event planners", "High-end tailors"],
    whyChina: ["World's largest producer of Swiss and French lace", "Factory-direct pricing up to 60% below retail", "Custom colorways and GSM available", "MOQs as low as 10–50 yards for premium fabrics", "Established supply chains serving Africa, Europe and the USA"],
    faqs: [
      { q: "What is the minimum order quantity for luxury fabrics from China?", a: "Most verified suppliers on Weinly offer MOQs of 10–50 yards for premium lace and bridal fabrics, making it accessible for both small designers and large wholesale buyers." },
      { q: "How do I verify the quality of luxury fabric before ordering in bulk?", a: "Weinly connects you directly to verified manufacturers. You can request fabric swatches and samples before committing to a bulk order through your supplier contact." },
      { q: "Can Chinese suppliers match specific lace patterns or colors?", a: "Yes. Most manufacturers on our platform offer custom pattern weaving and dye-to-order color matching, especially for Swiss lace, French lace and beaded lace." },
      { q: "How long does shipping take from China for luxury fabrics?", a: "Air freight typically takes 5–10 business days. Sea freight takes 25–40 days but reduces cost significantly for large orders." },
    ],
  },
  african: {
    headline: "Source African Fashion Fabrics from China",
    subheadline: "Ankara, George, Senator, Aso Oke & Wax Print Wholesale Suppliers",
    description: "Find verified Chinese manufacturers producing authentic African fashion fabrics at factory prices. Ankara wax print, George fabric, senator materials, voile lace, aso oke, atiku fabrics and kente-inspired textiles — sourced directly and shipped worldwide.",
    keywords: ["ankara fabric wholesale China", "buy george fabric supplier", "senator material manufacturer", "wax print fabric wholesale", "african fabric from China", "voile lace supplier China"],
    buyerTypes: ["African fashion designers", "Fabric wholesalers", "Asoebi vendors", "Market traders", "Online fabric retailers"],
    whyChina: ["Largest global producer of wax print and ankara fabric", "Competitive pricing for bulk and small orders", "Wide range of prints, colors and fabric weights", "Ships directly to Nigeria, Ghana, Kenya, UK and worldwide", "Flexible MOQs for traders and boutique buyers"],
    faqs: [
      { q: "Is ankara fabric from China the same quality as Holland wax print?", a: "Chinese manufacturers produce a full range of quality grades — from standard market ankara to premium wax print that rivals Dutch and Ghanaian alternatives. Your supplier contact will guide you on quality grades." },
      { q: "What is the minimum order for ankara fabric wholesale?", a: "MOQs typically start at 100–500 yards for standard designs, but many suppliers offer lower minimums for mixed-design orders." },
      { q: "Can I get custom prints made in China?", a: "Yes — custom digital printing and screen printing for ankara, cotton prints and George fabrics is widely available with most suppliers requiring a minimum run of 500–1000 yards." },
      { q: "Do Chinese suppliers ship directly to African countries?", a: "Yes. Suppliers on Weinly regularly ship to Nigeria, Ghana, Kenya, South Africa, Cameroon and across the continent via air and sea freight." },
    ],
  },
  sports: {
    headline: "Source Sports & Activewear Fabric from China",
    subheadline: "Dry-Fit, Lycra, Spandex, Compression & Swimwear Fabric Wholesale",
    description: "Connect with verified Chinese manufacturers of high-performance activewear and sportswear fabrics. Dry-fit polyester, lycra, spandex, compression fabric, yoga wear fabric, swimwear fabric and breathable mesh — supplied at competitive factory prices globally.",
    keywords: ["sportswear fabric manufacturer China", "buy dry fit fabric wholesale", "lycra spandex fabric supplier", "compression fabric China", "activewear fabric wholesale", "yoga fabric supplier"],
    buyerTypes: ["Sportswear brands", "Gym wear manufacturers", "Team kit suppliers", "Athletic wear startups", "Private label clothing brands"],
    whyChina: ["Global leader in performance textile manufacturing", "Full range of moisture-wicking, anti-odor and UV-protective fabrics", "Custom GSM, stretch percentage and finish available", "Compliance with international sportswear fabric standards", "Fast lead times for seasonal collections"],
    faqs: [
      { q: "What GSM is best for gym wear and activewear fabric?", a: "For gym leggings and tight-fit activewear, 200–250 GSM four-way stretch fabric is most common. For jerseys and loose-fit sports tops, 150–180 GSM dry-fit works well." },
      { q: "Can Chinese suppliers produce fabric with moisture-wicking certification?", a: "Yes. Many manufacturers hold certifications for moisture management and can provide test reports. This is especially important for international sportswear brands." },
      { q: "What is the minimum order for activewear fabric from China?", a: "Most suppliers start at 300–500 meters per color. Some offer lower MOQs for established relationships or sample orders." },
      { q: "Do activewear fabric suppliers offer custom colors?", a: "Yes — Pantone color matching is widely available. Most suppliers require a minimum of 300–500 meters per custom colorway." },
    ],
  },
  casual: {
    headline: "Source Casual & Everyday Fashion Fabric from China",
    subheadline: "Cotton, Linen, Denim, Chiffon, Jersey & Polyester Wholesale Suppliers",
    description: "Find verified Chinese manufacturers of everyday fashion fabrics at factory prices. Cotton, linen, rayon, polyester, chiffon, denim, crepe, jersey knit, poplin and flannel — bulk supply available for fashion brands, garment factories and fabric traders worldwide.",
    keywords: ["cotton fabric wholesale China", "buy chiffon fabric supplier", "denim fabric manufacturer China", "jersey knit fabric wholesale", "linen fabric from China", "polyester fabric supplier"],
    buyerTypes: ["Fashion brands", "Garment factories", "Online clothing stores", "Fabric wholesalers", "Tailors and dressmakers"],
    whyChina: ["World's largest producer of cotton, polyester and blended fabrics", "Consistent quality and wide color ranges", "Low MOQs for mixed fabric orders", "Fast production turnaround for seasonal collections", "Competitive pricing for high-volume buyers"],
    faqs: [
      { q: "What types of cotton fabric are available from Chinese suppliers?", a: "Chinese manufacturers offer cotton poplin, cotton twill, cotton interlock, cotton jersey, organic cotton and cotton-blend fabrics in hundreds of weights and finishes." },
      { q: "What is the minimum order for casual fabric from China?", a: "MOQs vary by supplier and fabric type. Cotton and polyester fabrics typically start at 300–500 meters. Some suppliers offer mixed rolls at lower minimums." },
      { q: "Can I order fabric samples before buying in bulk?", a: "Yes. Through Weinly, you can request fabric swatches and physical samples directly from suppliers before committing to a bulk order." },
      { q: "How long does production take for custom casual fabric orders?", a: "In-stock fabrics can ship within 3–5 days. Custom dye and weave orders typically take 15–30 days depending on quantity." },
    ],
  },
  mens: {
    headline: "Source Men's Traditional & Formal Fabric from China",
    subheadline: "Senator, Kaftan, Suiting, Cashmere Blend & Brocade Wholesale",
    description: "Connect with verified Chinese manufacturers of men's traditional and formal wear fabrics. Senator fabric, kaftan material, suiting fabrics, cashmere blends, wool blends, jacquard, brocade and cotton silk blends — supplied at competitive prices for African, Middle Eastern and global markets.",
    keywords: ["senator fabric wholesale China", "kaftan material supplier", "suiting fabric manufacturer China", "brocade fabric wholesale", "men traditional fabric supplier", "jacquard fabric China"],
    buyerTypes: ["Men's fashion designers", "Traditional wear tailors", "Senator fabric traders", "Islamic clothing suppliers", "Formal wear manufacturers"],
    whyChina: ["Leading producer of jacquard, brocade and suiting fabric", "Wide range of weights and patterns for African and Middle Eastern markets", "Custom designs for traditional wear collections", "Competitive pricing for high-volume traders", "Ships to Nigeria, UAE, Saudi Arabia, UK and worldwide"],
    faqs: [
      { q: "What is the best fabric for senator suits from China?", a: "Premium senator suits use jacquard weave with silk or polyester blends. Chinese manufacturers offer both light-weight versions for warm climates and heavier options for formal occasions." },
      { q: "Can Chinese suppliers produce custom kaftan fabric designs?", a: "Yes. Custom jacquard weaving for kaftan and traditional wear fabric is a specialty of many Chinese textile mills, with MOQs typically starting at 500–1000 meters." },
      { q: "What is the minimum order for men's formal fabric from China?", a: "Suiting and brocade fabrics typically start at 200–500 meters. Senator and kaftan fabrics may have lower MOQs depending on design complexity." },
      { q: "Do Chinese fabric suppliers serve the Middle East market?", a: "Yes. Many manufacturers on Weinly have established supply relationships with UAE, Saudi Arabia, Qatar and other Gulf markets, with experience in local fabric preferences." },
    ],
  },
  furniture: {
    headline: "Source Furniture & Interior Fabric from China",
    subheadline: "Sofa Fabric, Upholstery, Curtain, Blackout & Hotel Linen Wholesale",
    description: "Find verified Chinese manufacturers supplying premium furniture and interior fabrics. Sofa fabric, curtain fabric, blackout curtains, upholstery fabric, hotel linen, decorative velvet and wall panel fabric — bulk supply at factory prices for interior designers, furniture makers and hospitality businesses.",
    keywords: ["sofa fabric wholesale China", "upholstery fabric manufacturer", "curtain fabric supplier China", "blackout fabric wholesale", "hotel linen supplier China", "decorative fabric manufacturer"],
    buyerTypes: ["Furniture manufacturers", "Interior designers", "Hotels and hospitality", "Curtain suppliers", "Home decor retailers"],
    whyChina: ["World leader in furniture and upholstery fabric production", "Wide range of textures, weights and fire-retardant options", "Custom colors and patterns for commercial projects", "Large-volume supply for hotels, offices and furniture factories", "Competitive pricing for both small and large orders"],
    faqs: [
      { q: "What fabric is best for sofa upholstery from China?", a: "Popular choices include microfiber suede (durable and easy to clean), linen blend (elegant and breathable), velvet (premium look) and technical fabrics with stain-resistant coatings." },
      { q: "Do Chinese suppliers offer fire-retardant upholstery fabric?", a: "Yes. Many manufacturers offer FR-certified fabric suitable for commercial use in hotels, offices and public spaces. Certification documents are available on request." },
      { q: "What is the minimum order for curtain fabric from China?", a: "Most suppliers start at 300–500 meters for standard curtain fabric. Blackout and thermal options may have slightly higher minimums due to production requirements." },
      { q: "Can Chinese suppliers produce custom hotel linen with specific thread counts?", a: "Yes. Thread count, width, weight and weave pattern are all customizable for hotel and hospitality linen orders, typically with minimum runs of 500–1000 meters." },
    ],
  },
  industrial: {
    headline: "Source Industrial & Technical Fabric from China",
    subheadline: "Medical Textile, Waterproof, Fire Resistant, Nonwoven & Automotive Fabric",
    description: "Connect with verified Chinese manufacturers of industrial and technical textiles. Medical textile, nonwoven fabric, waterproof fabric, fire resistant fabric, reflective fabric, automotive textile, air filter fabric and packaging textile — bulk supply for manufacturers, distributors and industrial buyers worldwide.",
    keywords: ["industrial fabric manufacturer China", "waterproof fabric supplier", "fire resistant fabric wholesale", "nonwoven fabric China", "medical textile manufacturer", "technical textile supplier China"],
    buyerTypes: ["Industrial manufacturers", "Medical supply companies", "Construction companies", "Automotive suppliers", "Safety equipment makers"],
    whyChina: ["Global leader in technical and industrial textile production", "Full compliance with international safety and performance standards", "Custom specifications for industrial applications", "Large-volume supply with consistent quality", "Experience serving industrial buyers in Europe, USA and Asia"],
    faqs: [
      { q: "Do Chinese industrial fabric suppliers provide certification documents?", a: "Yes. Reputable manufacturers provide test reports, compliance certificates and quality documentation for industrial fabrics including fire resistance, waterproofing and medical-grade specifications." },
      { q: "What is the minimum order for waterproof fabric from China?", a: "Waterproof and technical fabrics typically start at 500–1000 meters due to production setup requirements. Some suppliers offer smaller quantities for sampling." },
      { q: "Can Chinese suppliers produce custom nonwoven fabric specifications?", a: "Yes. GSM, width, fiber composition, bonding method and surface treatment are all customizable for nonwoven fabric orders." },
      { q: "How do I verify a Chinese industrial fabric supplier's certifications?", a: "Through Weinly, you can request copies of relevant certifications directly from verified suppliers before placing any order." },
    ],
  },
  kids: {
    headline: "Source Kids & Baby Fabric from China",
    subheadline: "Organic Cotton, Baby Jersey, Bamboo, Soft Fleece & Hypoallergenic Fabric Wholesale",
    description: "Find verified Chinese manufacturers of safe, soft and certified fabrics for children's and baby clothing. Organic cotton, baby jersey, soft fleece, cartoon print fabric, bamboo fabric and hypoallergenic textiles — supplied at factory prices for children's wear brands and manufacturers worldwide.",
    keywords: ["baby fabric manufacturer China", "organic cotton fabric wholesale", "kids fabric supplier", "bamboo fabric China", "hypoallergenic fabric supplier", "children fabric wholesale China"],
    buyerTypes: ["Children's clothing brands", "Baby wear manufacturers", "Organic clothing labels", "Kids boutiques", "Retail fabric suppliers"],
    whyChina: ["Major producer of OEKO-TEX certified organic and baby-safe fabrics", "Full range of soft, non-irritating fabrics for sensitive skin", "Cartoon print and character fabric available for children's wear", "Competitive pricing for baby and children's apparel manufacturers", "Ships to UK, USA, Europe, Africa and worldwide"],
    faqs: [
      { q: "Are Chinese baby fabrics safe and certified?", a: "Many manufacturers on Weinly hold OEKO-TEX Standard 100 certification, confirming fabrics are free from harmful substances. Always request certification documents from your supplier." },
      { q: "What fabric is best for newborn baby clothing from China?", a: "Organic cotton interlock, bamboo jersey and organic cotton terry are popular choices for newborn clothing due to their softness, breathability and hypoallergenic properties." },
      { q: "Can Chinese suppliers produce custom cartoon prints for children's fabric?", a: "Yes. Custom print-on-demand for children's fabric is widely available, with digital printing allowing small runs and screen printing for larger volumes." },
      { q: "What is the minimum order for organic cotton fabric from China?", a: "Certified organic cotton fabric typically starts at 300–500 meters per color. Some suppliers offer mixed-roll options for smaller buyers." },
    ],
  },
  eco: {
    headline: "Source Eco-Friendly & Sustainable Fabric from China",
    subheadline: "Recycled Polyester, Organic Cotton, Bamboo, Hemp & Sustainable Denim Wholesale",
    description: "Connect with verified Chinese manufacturers of sustainable and eco-friendly fabrics. Recycled polyester, organic cotton, bamboo fiber, hemp fabric, sustainable denim and eco viscose — certified sustainable supply at factory prices for ethical fashion brands and manufacturers worldwide.",
    keywords: ["sustainable fabric supplier China", "recycled polyester fabric wholesale", "organic cotton manufacturer China", "bamboo fabric supplier", "hemp fabric wholesale China", "eco friendly fabric manufacturer"],
    buyerTypes: ["Sustainable fashion brands", "Ethical clothing manufacturers", "B-corp certified companies", "Organic apparel labels", "Eco-conscious retailers"],
    whyChina: ["Growing leader in certified sustainable textile production", "GRS, GOTS and OEKO-TEX certified fabric available", "Competitive pricing making sustainability commercially viable", "Full range of recycled, organic and bio-based fabric types", "Experience supplying European and American sustainable fashion brands"],
    faqs: [
      { q: "Can Chinese suppliers provide GRS-certified recycled polyester fabric?", a: "Yes. Global Recycled Standard (GRS) certified recycled polyester is widely available from manufacturers on Weinly. Certification documents and chain-of-custody records are available on request." },
      { q: "Is organic cotton from China GOTS certified?", a: "Some manufacturers hold GOTS (Global Organic Textile Standard) certification. Always request specific certification documentation when sourcing organic fabric." },
      { q: "What is the price difference between sustainable and conventional fabric from China?", a: "Certified sustainable fabrics typically cost 15–40% more than conventional equivalents, depending on certification type and material. However, factory-direct pricing still offers significant savings versus buying from distributors." },
      { q: "What is the minimum order for sustainable fabric from China?", a: "MOQs vary by fabric type. Recycled polyester typically starts at 300–500 meters. Organic cotton and bamboo may have higher minimums due to certification requirements." },
    ],
  },
};

export async function generateStaticParams() {
  return FABRIC_CATEGORIES.map((cat) => ({ category: cat.id }));
}

export async function generateMetadata({ params }: Props): Promise<Metadata> {
  const cat = FABRIC_CATEGORIES.find((c) => c.id === params.category);
  if (!cat) return {};
  const seo = CATEGORY_SEO[params.category];
  return {
    title: `${seo.headline} | Weinly`,
    description: seo.description.slice(0, 160),
    keywords: seo.keywords.join(", "),
    openGraph: {
      title: seo.headline,
      description: seo.description.slice(0, 160),
      url: `https://weinlyhq.com/fabrics/${params.category}`,
      siteName: "Weinly",
      type: "website",
    },
    twitter: {
      card: "summary_large_image",
      title: seo.headline,
      description: seo.description.slice(0, 160),
    },
    alternates: {
      canonical: `https://weinlyhq.com/fabrics/${params.category}`,
    },
  };
}

export default function CategorySEOPage({ params }: Props) {
  const cat = FABRIC_CATEGORIES.find((c) => c.id === params.category);
  if (!cat) notFound();

  const seo = CATEGORY_SEO[params.category];
  const color = getCategoryColor(params.category);
  const whatsappLink = buildWhatsappLink(`Hello Weinly, I'm looking to source ${cat.label} from China.`);

  // Structured data for SEO
  const structuredData = {
    "@context": "https://schema.org",
    "@type": "Service",
    "name": seo.headline,
    "description": seo.description,
    "provider": {
      "@type": "Organization",
      "name": "Weinly",
      "url": "https://weinlyhq.com",
    },
    "areaServed": "Worldwide",
    "serviceType": "Fabric Sourcing",
  };

  return (
    <>
      <script
        type="application/ld+json"
        dangerouslySetInnerHTML={{ __html: JSON.stringify(structuredData) }}
      />
      <main className="min-h-screen bg-[#f0f2f0] px-3 py-3 font-sans md:px-4 md:py-4">
        <div className="mx-auto flex max-w-7xl flex-col gap-4">
          <SiteHeader />

          {/* Breadcrumb */}
          <nav className="flex items-center gap-2 text-xs text-stone-500">
            <Link href="/" className="text-stone-500 no-underline hover:text-stone-700 transition-colors">Home</Link>
            <span>/</span>
            <Link href="/fabrics" className="text-stone-500 no-underline hover:text-stone-700 transition-colors">Fabrics</Link>
            <span>/</span>
            <span className={color.text}>{cat.label}</span>
          </nav>

          {/* Hero */}
          <section className={`relative overflow-hidden rounded-3xl border p-4 md:p-12 ${color.bg} ${color.border}`}>
            <div className="pointer-events-none absolute right-0 top-0 h-72 w-72 translate-x-1/3 -translate-y-1/3 rounded-full bg-white/5 blur-3xl" />
            <div className="relative z-10 grid grid-cols-1 gap-6 md:grid-cols-2 md:gap-8 md:items-center">
              <div className="min-w-0">
                <div className={`mb-3 flex w-fit items-center gap-2 rounded-full border px-3 py-1.5 ${color.border} bg-black/20`}>
                  <span className={`h-2 w-2 shrink-0 rounded-full ${color.text === "text-emerald-300" ? "bg-emerald-400" : "bg-white/60"}`} />
                  <span className={`text-xs font-semibold ${color.text}`}>
                    <span className="sm:hidden">Verified suppliers</span>
                    <span className="hidden sm:inline">Verified supplier network · Ships worldwide</span>
                  </span>
                </div>
                <h1 className="mb-2 text-2xl font-black leading-tight tracking-tight text-white md:text-4xl lg:text-5xl">
                  {seo.headline}
                </h1>
                <h2 className={`mb-3 text-xs font-semibold leading-snug md:text-lg ${color.text}`}>
                  {seo.subheadline}
                </h2>
                <p className="mb-5 hidden text-sm leading-relaxed text-slate-300 md:block md:text-base max-w-lg">
                  {seo.description}
                </p>
                <div className="flex flex-wrap gap-2 md:gap-3">
                  <Link href="/#main-tabs"
                    className="inline-flex items-center rounded-xl bg-white px-5 py-2.5 text-sm font-bold text-slate-900 no-underline shadow-lg transition-all hover:bg-white/90 md:px-6 md:py-3">
                    Get free quotes →
                  </Link>
                  <a href={whatsappLink} target="_blank" rel="noreferrer"
                    className="inline-flex items-center rounded-xl border border-white/20 bg-white/10 px-5 py-2.5 text-sm font-semibold text-white no-underline transition-all hover:bg-white/15 md:px-6 md:py-3">
                    WhatsApp us
                  </a>
                </div>
              </div>
              <div className="flex flex-col gap-2 md:gap-3">
                {[
                  { label: "Submit request", desc: "Describe your fabric need in plain language", n: "01" },
                  { label: "Get verified quotes", desc: "Receive price, MOQ and lead time from suppliers", n: "02" },
                  { label: "Unlock & connect", desc: "Pay once to get direct supplier contact", n: "03" },
                ].map((step) => (
                  <div key={step.n} className="flex items-start gap-3 rounded-2xl border border-white/10 bg-black/20 p-3 md:gap-4 md:p-4">
                    <span className={`text-xs font-black uppercase tracking-widest ${color.text} shrink-0 mt-0.5`}>{step.n}</span>
                    <div>
                      <div className="text-sm font-bold text-white mb-0.5">{step.label}</div>
                      <div className="text-xs text-slate-400 leading-relaxed">{step.desc}</div>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          </section>

          {/* Fabric preview image */}
          <div className="overflow-hidden rounded-3xl">
            <FabricImage categoryId={params.category} alt={`${cat.label} fabric`} aspectRatio="wide" overlay={false} width={1200} height={400} />
          </div>

          {/* Subcategories */}
          <section className="rounded-3xl border border-stone-200 bg-white p-5 md:p-8">
            <h2 className="mb-2 text-xl font-black tracking-tight text-[#1f2933] md:text-2xl">
              {cat.label} we source
            </h2>
            <p className="mb-5 text-sm text-stone-500">
              Browse all {cat.subcategories.length} fabric types in this category. Click any to see detailed sourcing information.
            </p>
            <div className="grid grid-cols-2 gap-2 md:grid-cols-3 lg:grid-cols-4">
              {cat.subcategories.map((sub) => {
                const slug = sub.toLowerCase().replace(/[^a-z0-9]+/g, "-").replace(/(^-|-$)/g, "");
                return (
                  <Link key={sub} href={`/fabrics/${params.category}/${slug}`}
                    className={`flex flex-col gap-1 rounded-2xl border p-4 no-underline transition-all hover:scale-[1.02] ${color.bg} ${color.border}`}>
                    <span className={`text-sm font-bold ${color.text}`}>{sub}</span>
                    <span className="text-xs text-slate-500">Source from China →</span>
                  </Link>
                );
              })}
            </div>
          </section>

          {/* Why buyers use Weinly for this category */}
          <section className="rounded-3xl border border-stone-200 bg-white p-5 md:p-8">
            <h2 className="mb-5 text-xl font-black tracking-tight text-[#1f2933] md:text-2xl">
              Why source {cat.label.toLowerCase()} from China through Weinly
            </h2>
            <div className="grid grid-cols-1 gap-3 md:grid-cols-2 lg:grid-cols-3">
              {seo.whyChina.map((reason) => (
                <div key={reason} className="flex items-start gap-3 rounded-2xl border border-stone-200 bg-stone-50 p-4">
                  <span className="text-[#24483f] font-bold shrink-0">✓</span>
                  <span className="text-sm text-stone-600 leading-relaxed">{reason}</span>
                </div>
              ))}
            </div>
          </section>

          {/* Who buys this */}
          <section className="rounded-3xl border border-stone-200 bg-white p-5 md:p-8">
            <h2 className="mb-2 text-xl font-black tracking-tight text-[#1f2933] md:text-2xl">
              Who sources {cat.label.toLowerCase()} through Weinly
            </h2>
            <p className="mb-5 text-sm text-stone-500">
              Buyers from over 30 countries use Weinly to source {cat.label.toLowerCase()} directly from verified Chinese manufacturers.
            </p>
            <div className="flex flex-wrap gap-2">
              {seo.buyerTypes.map((type) => (
                <span key={type} className={`rounded-full border px-4 py-2 text-sm font-semibold ${color.bg} ${color.text} ${color.border}`}>
                  {type}
                </span>
              ))}
            </div>
          </section>

          {/* CTA */}
          <section className="rounded-3xl border border-[#24483f]/20 bg-[#24483f] p-6 md:p-10 text-center">
            <h2 className="mb-3 text-2xl font-black tracking-tight text-white md:text-3xl">
              Ready to source {cat.label.toLowerCase()}?
            </h2>
            <p className="mb-6 text-sm leading-relaxed text-[#e8dcc8] max-w-lg mx-auto">
              Submit a free sourcing request and get quotes from verified Chinese suppliers within 24 hours. No commitment required.
            </p>
            <div className="flex flex-wrap justify-center gap-3">
              <Link href="/#main-tabs"
                className="inline-flex items-center rounded-xl bg-[#f59e0b] text-[#1a2e1a] px-8 py-3.5 text-sm font-bold text-white no-underline shadow-lg">
                Submit free sourcing request →
              </Link>
              <a href={whatsappLink} target="_blank" rel="noreferrer"
                className="inline-flex items-center rounded-xl border border-white/20 bg-white/10 px-8 py-3.5 text-sm font-semibold text-white no-underline hover:bg-white/15 transition-all">
                Ask on WhatsApp
              </a>
            </div>
          </section>

          {/* FAQ */}
          <section className="rounded-3xl border border-stone-200 bg-white p-5 md:p-8">
            <h2 className="mb-5 text-xl font-black tracking-tight text-[#1f2933] md:text-2xl">
              Frequently asked questions
            </h2>
            <div className="flex flex-col gap-3">
              {seo.faqs.map((faq) => (
                <div key={faq.q} className="rounded-2xl border border-stone-200 bg-stone-50 p-5">
                  <h3 className="mb-2 text-sm font-bold text-[#1f2933]">{faq.q}</h3>
                  <p className="m-0 text-sm leading-relaxed text-stone-500">{faq.a}</p>
                </div>
              ))}
            </div>
          </section>

          {/* Internal links to other categories */}
          <section className="rounded-3xl border border-stone-200 bg-white p-5 md:p-8">
            <h2 className="mb-4 text-lg font-black tracking-tight text-[#1f2933]">
              Explore other fabric categories
            </h2>
            <div className="grid grid-cols-2 gap-2 md:grid-cols-4">
              {FABRIC_CATEGORIES.filter((c) => c.id !== params.category).map((c) => {
                const cc = getCategoryColor(c.id);
                return (
                  <Link key={c.id} href={`/fabrics/${c.id}`}
                    className={`rounded-xl border p-3 no-underline transition-all hover:scale-[1.02] ${cc.bg} ${cc.border}`}>
                    <span className={`text-xs font-bold ${cc.text}`}>{c.label}</span>
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
