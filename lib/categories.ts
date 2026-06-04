export type FabricCategory = {
  id: string;
  label: string;
  subcategories: string[];
};

export const FABRIC_CATEGORIES: FabricCategory[] = [
  {
    id: "cotton",
    label: "Cotton Fabrics",
    subcategories: [
      "Calico", "Cambric", "Canvas / Duck Canvas", "Chambray", "Cheesecloth",
      "Chino", "Chintz", "Corduroy", "Cotton (General)", "Cotton Duck",
      "Cretonne", "Denim (incl. Selvage, Stretch)", "Dimity", "Dobby",
      "Drill", "Dungaree", "Flannel", "Flannelette", "Gingham",
      "Huckaback", "Khaki Drill", "Lawn Cloth", "Longcloth", "Madras",
      "Muslin", "Nainsook", "Nankeen", "Osnaburg", "Percale",
      "Piqué", "Plissé", "Poplin", "Quilting Fabric", "Seersucker",
      "Ticking", "Twill", "Velveteen", "Voile", "Waffle Fabric",
    ],
  },
  {
    id: "silk",
    label: "Silk Fabrics",
    subcategories: [
      "Almerían Silk", "Antique Satin", "Bengaline Silk", "Bizarre Silk",
      "Charmeuse", "China Silk", "Chiffon (Silk)", "Crêpe de Chine",
      "Dupioni Silk", "Foulard", "Georgette (Silk)", "Habutai",
      "Organza (Silk)", "Paduasoy", "Peau de Soie", "Rinzu",
      "Saga Nishiki", "Samite", "Sendal", "Shantung",
      "Shot Silk", "Silk Noil", "Surah", "Taffeta (Silk)",
      "Toile de Soie", "Charvet", "Gazar", "Grenadine",
    ],
  },
  {
    id: "linen",
    label: "Linen & Bast Fibre Fabrics",
    subcategories: [
      "Linen", "Irish Linen", "Cambric (Linen)", "Cheesecloth (Linen)",
      "Hessian / Burlap", "Holland Cloth", "Lawn (Linen)",
      "Osnaburg (Linen)", "Pleated Linen", "Scrim",
      "Hemp Fabric", "Jute Cloth", "Ramie Fabric",
      "Abacá Cloth", "Coir Fabric", "Batiste (Linen)",
    ],
  },
  {
    id: "wool",
    label: "Wool & Hair Fibre Fabrics",
    subcategories: [
      "Wool (General)", "Worsted Wool", "Boiled Wool", "Barathea",
      "Bouclé", "Broadcloth (Wool)", "Camel's Hair", "Cashmere",
      "Challis", "Donegal Tweed", "Drugget", "Flannel (Wool)",
      "Gabardine (Wool)", "Harris Tweed", "Herringbone",
      "Himroo / Himro", "Hodden", "Kerseymere", "Loden",
      "Mackinaw", "Melton", "Merino Wool", "Mohair",
      "Mouflon", "Serge", "Tartan", "Tweed", "Viyella",
      "Wadmal", "Whipcord", "Zibeline", "Alpaca Fabric",
      "Angora Fabric", "Pashmina", "Chiengora",
    ],
  },
  {
    id: "polyester",
    label: "Polyester Fabrics",
    subcategories: [
      "Polyester (General)", "Recycled Polyester (rPET)", "Polyester Chiffon",
      "Polyester Georgette", "Polyester Satin", "Polyester Taffeta",
      "Polyester Organza", "Microfiber (Polyester)", "Microfleece",
      "Polar Fleece", "Ripstop (Polyester)", "Vinyl Coated Polyester (PVC)",
      "Milliskin", "Coolmax", "Crimplene", "Darlexx",
      "Silnylon", "SympaTex", "Pongee (Polyester)", "Taslan",
    ],
  },
  {
    id: "nylon",
    label: "Nylon Fabrics",
    subcategories: [
      "Nylon (General)", "Ballistic Nylon", "Nylon Taffeta",
      "Nylon Chiffon", "Nylon Mesh", "Cordura",
      "Ripstop Nylon", "Silnylon", "Dyneema",
      "Ban-Lon", "Capilene", "Fishnet (Nylon)",
    ],
  },
  {
    id: "rayon",
    label: "Rayon, Viscose & Cellulosic Fabrics",
    subcategories: [
      "Rayon / Viscose (General)", "Modal", "Micro Modal",
      "Lyocell / TENCEL™", "Acetate", "Cupro",
      "Bamboo Fabric", "Challis (Rayon)", "Charmeuse (Rayon)",
      "Chiffon (Rayon)", "Crepe (Rayon)", "Jersey (Viscose)",
      "Georgette (Viscose)", "Satin (Acetate)", "Batiste (Rayon)",
    ],
  },
  {
    id: "spandex",
    label: "Stretch & Elastic Fabrics",
    subcategories: [
      "Spandex / Lycra / Elastane", "Stretch Denim", "Stretch Velvet",
      "Bengaline (Stretch)", "Four-Way Stretch Fabric", "Swim Fabric",
      "Jersey (Stretch)", "Double Knit (Stretch)", "Ponte",
      "Scuba Knit", "Compression Fabric", "Ribbing Knit",
      "Interlock (Stretch)", "Milliskin", "Power Net",
    ],
  },
  {
    id: "knit",
    label: "Knit Fabrics",
    subcategories: [
      "Jersey (Single Knit)", "Double Knit", "Rib Knit",
      "Interlock", "Jacquard Knit", "Warp Knit",
      "Tricot", "Velour (Knit)", "French Terry",
      "Terrycloth (Knit)", "Fleece Knit", "Mesh Knit",
      "Ponte", "Scuba Knit", "Sweatshirt Fleece",
      "Waffle Knit", "Thermal Knit", "Stockinette",
      "Stable Knit", "Boiled Wool Knit", "Intarsia",
    ],
  },
  {
    id: "woven-specialty",
    label: "Woven Specialty Fabrics",
    subcategories: [
      "Brocade", "Damask", "Jacquard (Woven)", "Lampas",
      "Tapestry", "Matelassé", "Dobby", "Cloqué",
      "Moire", "Grosgrain", "Ottoman", "Rep",
      "Faille", "Bengaline (Woven)", "Bedford Cord",
      "Houndstooth", "Herringbone (Woven)", "Tartan / Plaid",
      "Gingham", "Madras", "Seersucker", "Waffle (Woven)",
      "Piqué (Woven)", "Sateen", "Satin Weave",
    ],
  },
  {
    id: "velvet-pile",
    label: "Velvet & Pile Fabrics",
    subcategories: [
      "Velvet", "Velveteen", "Panné Velvet", "Velours du Kasaï",
      "Velour", "Corduroy", "Terry Velour", "Plush",
      "Chenille", "Mockado", "Moquette", "Faux Fur",
      "Fleece", "Sherpa", "Bouclé", "Baize",
      "Mohair Pile", "Cut Velvet",
    ],
  },
  {
    id: "lace-sheer",
    label: "Lace & Sheer Fabrics",
    subcategories: [
      "Lace (General)", "Chantilly Lace", "Alençon Lace",
      "Guipure Lace", "Venetian Lace", "Swiss Lace",
      "French Lace", "Beaded Lace", "Sequins Lace",
      "Broderie Anglaise", "Burano Lace", "Carrickmacross Lace",
      "Tambour Lace", "Teneriffe Lace", "Tulle Netting",
      "Bobbinet", "Organza", "Organdy", "Chiffon",
      "Voile", "Gauze", "Net", "Fishnet", "Georgette",
      "Grenadine", "Mousseline", "Bridal Mesh",
    ],
  },
  {
    id: "denim-canvas",
    label: "Denim, Canvas & Workwear Fabrics",
    subcategories: [
      "Denim (General)", "Selvage Denim", "Stretch Denim",
      "Canvas", "Cotton Duck", "Duck Canvas",
      "Drill", "Twill", "Chino", "Khaki Drill",
      "Dungaree", "Gabardine", "Cordura",
      "Burlap / Hessian", "Ripstop", "Sailcloth",
      "Osnaburg", "Byrd Cloth", "Grenfell Cloth",
      "Ventile", "Oilskin", "Waxed Cotton",
    ],
  },
  {
    id: "coating-technical",
    label: "Coated, Laminated & Technical Fabrics",
    subcategories: [
      "Gore-Tex", "PU-Coated Fabric", "PVC-Coated Fabric",
      "Vinyl Coated Polyester", "Waxed Cotton", "Oilskin",
      "Ripstop (Technical)", "Ballistic Nylon", "Kevlar Fabric",
      "Aramid Fabric", "Nomex", "Carbon Fiber Fabric",
      "Dyneema", "Conductive Textile / E-Textiles",
      "Gannex", "SympaTex", "Darlexx", "Coolmax",
      "Grenfell Cloth", "Ventile", "Geotextile",
      "Medical Textile", "Waterproof Fabric", "Fire Resistant Fabric",
      "Reflective Fabric", "Automotive Textile", "Air Filter Fabric",
    ],
  },
  {
    id: "nonwoven",
    label: "Nonwoven Fabrics",
    subcategories: [
      "Felt", "Spunbond Nonwoven", "Spunlace / Hydroentangled",
      "Meltblown Nonwoven", "Needle-Punch Nonwoven",
      "SMS Laminate", "Polypropylene Nonwoven",
      "Polyester Nonwoven", "Medical Nonwoven",
      "Agricultural Nonwoven", "Geotextile Nonwoven",
      "Interfacing / Interlining", "Cedar Bark Textile",
    ],
  },
  {
    id: "african-print",
    label: "African & Wax Print Fabrics",
    subcategories: [
      "Ankara / African Wax Print", "Kente Cloth (Ghana)",
      "Aso Oke (Nigeria)", "Aso Olona (Nigeria)",
      "George Fabric", "Senator Materials", "Atiku Fabrics",
      "Shweshwe (South Africa)", "Kanga / Kitenge (East Africa)",
      "Bogolan / Mud Cloth (Mali)", "Adire (Nigeria)",
      "Batik (West Africa)", "Hollandais Wax Print", "Java Print",
      "Real Wax Print", "Fancy Print", "Super Wax Print",
      "African Lace Fabric", "Ndop Cloth (Cameroon)",
      "Voile Lace", "Jacquard African Fabrics",
    ],
  },
  {
    id: "home-upholstery",
    label: "Home Textile & Upholstery Fabrics",
    subcategories: [
      "Percale", "Muslin", "Terrycloth", "Chintz",
      "Damask", "Matelassé", "Chenille", "Canvas (Home)",
      "Tapestry", "Brocade (Upholstery)", "Velvet (Upholstery)",
      "Moquette", "Cretonne", "Toile", "Ticking",
      "Monk's Cloth", "Holland Cloth", "Buckram",
      "Dimity", "Huckaback", "Scrim", "Sailcloth",
      "Jacquard (Home)", "Lampas", "Waffle Fabric",
      "Sofa Fabric", "Curtain Fabric", "Blackout Curtains",
      "Upholstery Fabric", "Decorative Velvet", "Hotel Linen Fabric",
    ],
  },
  {
    id: "sustainable",
    label: "Sustainable & Eco Fabrics",
    subcategories: [
      "Organic Cotton", "Recycled Polyester (rPET)", "TENCEL™ / Lyocell",
      "Bamboo Fabric", "Hemp Fabric", "Linen (Organic)",
      "Modal", "Micro Modal", "Piña (Pineapple Fibre)",
      "Sea Silk", "Coir", "Ramie",
      "Cupro", "Khādī", "Barkcloth",
      "Apple Leather", "Mushroom Leather / Mylo",
      "Corn Fibre Fabric", "Sustainable Denim", "Eco Viscose",
      "Baby Jersey", "Soft Fleece", "Hypoallergenic Fabrics",
    ],
  },
];

export const CATEGORY_COLORS: Record<string, { bg: string; text: string; border: string }> = {
  "cotton":           { bg: "bg-amber-50",   text: "text-amber-800",   border: "border-amber-200"   },
  "silk":             { bg: "bg-violet-50",  text: "text-violet-700",  border: "border-violet-200"  },
  "linen":            { bg: "bg-stone-100",  text: "text-stone-700",   border: "border-stone-300"   },
  "wool":             { bg: "bg-orange-50",  text: "text-orange-800",  border: "border-orange-200"  },
  "polyester":        { bg: "bg-blue-50",    text: "text-blue-700",    border: "border-blue-200"    },
  "nylon":            { bg: "bg-sky-50",     text: "text-sky-700",     border: "border-sky-200"     },
  "rayon":            { bg: "bg-teal-50",    text: "text-teal-700",    border: "border-teal-200"    },
  "spandex":          { bg: "bg-pink-50",    text: "text-pink-700",    border: "border-pink-200"    },
  "knit":             { bg: "bg-emerald-50", text: "text-emerald-700", border: "border-emerald-200" },
  "woven-specialty":  { bg: "bg-indigo-50",  text: "text-indigo-700",  border: "border-indigo-200"  },
  "velvet-pile":      { bg: "bg-purple-50",  text: "text-purple-700",  border: "border-purple-200"  },
  "lace-sheer":       { bg: "bg-rose-50",    text: "text-rose-700",    border: "border-rose-200"    },
  "denim-canvas":     { bg: "bg-blue-100",   text: "text-blue-800",    border: "border-blue-300"    },
  "coating-technical":{ bg: "bg-slate-100",  text: "text-slate-700",   border: "border-slate-300"   },
  "nonwoven":         { bg: "bg-gray-100",   text: "text-gray-700",    border: "border-gray-300"    },
  "african-print":    { bg: "bg-amber-100",  text: "text-amber-800",   border: "border-amber-300"   },
  "home-upholstery":  { bg: "bg-stone-50",   text: "text-stone-600",   border: "border-stone-200"   },
  "sustainable":      { bg: "bg-green-50",   text: "text-green-700",   border: "border-green-200"   },
};

export function getCategoryById(id: string): FabricCategory | undefined {
  return FABRIC_CATEGORIES.find((c) => c.id === id);
}

export function getCategoryLabel(id: string): string {
  return getCategoryById(id)?.label ?? id;
}

export function getCategoryColor(id: string) {
  return CATEGORY_COLORS[id] ?? { bg: "bg-stone-50", text: "text-stone-600", border: "border-stone-200" };
}
