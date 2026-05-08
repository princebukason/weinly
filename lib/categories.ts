export type FabricCategory = {
  id: string;
  label: string;
  subcategories: string[];
};

export const FABRIC_CATEGORIES: FabricCategory[] = [
  {
    id: "luxury",
    label: "Luxury Fabrics",
    subcategories: [
      "Swiss Lace", "French Lace", "Beaded Lace", "Sequins Lace",
      "Velvet", "Silk", "Organza", "Satin", "Duchess Satin", "Tulle", "Bridal Mesh",
    ],
  },
  {
    id: "african",
    label: "African Fashion Fabrics",
    subcategories: [
      "Ankara / Wax Print", "Senator Materials", "George Fabric", "Voile Lace",
      "Atiku Fabrics", "Aso Oke", "Kente-inspired Fabrics",
      "African Print Cotton", "Jacquard African Fabrics",
    ],
  },
  {
    id: "sports",
    label: "Sports & Activewear Fabrics",
    subcategories: [
      "Dry-fit Fabric", "Lycra", "Spandex", "Mesh", "Compression Fabric",
      "Yoga Wear Fabric", "Gym Wear Fabric", "Swimwear Fabric",
      "Breathable Polyester", "Stretch Knit",
    ],
  },
  {
    id: "casual",
    label: "Casual & Everyday Fashion Fabrics",
    subcategories: [
      "Cotton", "Linen", "Rayon", "Polyester", "Chiffon",
      "Denim", "Crepe", "Poplin", "Jersey Knit", "Flannel",
    ],
  },
  {
    id: "mens",
    label: "Men's Traditional & Formal Wear Fabrics",
    subcategories: [
      "Senator Fabric", "Kaftan Material", "Suiting Fabrics", "Cashmere Blend",
      "Wool Blend", "Jacquard", "Brocade", "Cotton Silk Blend",
    ],
  },
  {
    id: "furniture",
    label: "Furniture & Interior Fabrics",
    subcategories: [
      "Sofa Fabric", "Curtain Fabric", "Blackout Curtains", "Upholstery Fabric",
      "Hotel Linen Fabric", "Decorative Velvet", "Wall Panel Fabric",
    ],
  },
  {
    id: "industrial",
    label: "Industrial & Technical Fabrics",
    subcategories: [
      "Medical Textile", "Nonwoven Fabric", "Waterproof Fabric", "Fire Resistant Fabric",
      "Reflective Fabric", "Automotive Textile", "Air Filter Fabric", "Packaging Textile",
    ],
  },
  {
    id: "kids",
    label: "Kids & Baby Fabrics",
    subcategories: [
      "Organic Cotton", "Baby Jersey", "Soft Fleece", "Cartoon Print Fabric",
      "Bamboo Fabric", "Hypoallergenic Fabrics",
    ],
  },
  {
    id: "eco",
    label: "Eco-Friendly & Sustainable Fabrics",
    subcategories: [
      "Recycled Polyester", "Organic Cotton", "Bamboo Fiber",
      "Hemp Fabric", "Sustainable Denim", "Eco Viscose",
    ],
  },
];

export const CATEGORY_COLORS: Record<string, { bg: string; text: string; border: string }> = {
  luxury:     { bg: "bg-violet-500/10", text: "text-violet-300", border: "border-violet-500/25" },
  african:    { bg: "bg-amber-500/10",  text: "text-amber-300",  border: "border-amber-500/25"  },
  sports:     { bg: "bg-emerald-500/10",text: "text-emerald-300",border: "border-emerald-500/25"},
  casual:     { bg: "bg-sky-500/10",    text: "text-sky-300",    border: "border-sky-500/25"    },
  mens:       { bg: "bg-indigo-500/10", text: "text-indigo-300", border: "border-indigo-500/25" },
  furniture:  { bg: "bg-rose-500/10",   text: "text-rose-300",   border: "border-rose-500/25"   },
  industrial: { bg: "bg-slate-500/10",  text: "text-slate-300",  border: "border-slate-500/25"  },
  kids:       { bg: "bg-pink-500/10",   text: "text-pink-300",   border: "border-pink-500/25"   },
  eco:        { bg: "bg-teal-500/10",   text: "text-teal-300",   border: "border-teal-500/25"   },
};

export function getCategoryById(id: string): FabricCategory | undefined {
  return FABRIC_CATEGORIES.find((c) => c.id === id);
}

export function getCategoryLabel(id: string): string {
  return getCategoryById(id)?.label ?? id;
}

export function getCategoryColor(id: string) {
  return CATEGORY_COLORS[id] ?? { bg: "bg-white/10", text: "text-slate-300", border: "border-white/20" };
}