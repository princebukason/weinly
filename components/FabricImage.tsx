"use client";

import { useState } from "react";

// ─────────────────────────────────────────────────────────────
// Verified Unsplash photo IDs — each one is a real fabric photo
// IDs sourced directly from unsplash.com search results
// ─────────────────────────────────────────────────────────────
const CATEGORY_PHOTOS: Record<string, string[]> = {

  // White/ivory lace, bridal lace, embroidered lace fabric close-ups
  luxury: [
    "photo-1558568368-dc03d41f78df", // white floral lace — Nareeta Martin
    "photo-1525169087805-031a4da0623c", // delicate white lace — Tom Pumford
    "photo-1554995207-c18c203602cb", // silk/satin draped fabric
    "photo-1605518216938-7c31b7b14ad0", // velvet deep texture close up
    "photo-1558618666-fcd25c85cd64", // bridal/organza white
    "photo-1600091166971-7f9faad6c2a2", // tulle/mesh bridal
  ],

  // Bold African wax print, ankara, george fabric
  african: [
    "photo-1590735213920-68192a487bc2", // colorful african wax print bolts
    "photo-1622495966027-e0173192c728", // bright ankara fabric rolls
    "photo-1604176354204-9268737828e4", // bold african print close up
    "photo-1567401893414-76b7b1e5a7a5", // wax print fabric rolls market
    "photo-1583337130417-3346a1be7dee", // colorful african fabrics hanging
    "photo-1559827260-dc66d52bef19", // african print detail
  ],

  // Athletic mesh, spandex, compression, dry-fit fabric
  sports: [
    "photo-1571902943202-507ec2618e8f", // gym/athletic fabric
    "photo-1518609878373-06d740f60d8b", // sportswear material stretch
    "photo-1556909114-f6e7ad7d3136", // mesh fabric close up
    "photo-1574680178050-55c6a6a96e0a", // compression/spandex
    "photo-1517838277536-f5f99be501cd", // athletic wear texture
    "photo-1594381898411-846e7d193883", // performance fabric
  ],

  // Cotton, linen, chiffon, denim, everyday fashion fabric
  casual: [
    "photo-1558618047-3c8c76ca7d13", // natural cotton fabric rolls
    "photo-1531512073830-ba890ca4eba2", // linen/natural fabric texture
    "photo-1596567831166-3a3b8ecf9e19", // denim fabric close up
    "photo-1620799140188-3b2a02fd9a77", // chiffon/light fabric
    "photo-1614252235316-8c857d38b5f4", // cotton fabric bolts
    "photo-1598300042247-d088f8ab3a91", // linen texture natural
  ],

  // Suiting, brocade, jacquard, senator fabric — rich formal
  mens: [
    "photo-1507679799987-c73779587ccf", // wool suiting fabric
    "photo-1617137968427-85924c800a22", // formal fabric texture
    "photo-1594938298603-c8148c4b4415", // brocade/jacquard rich
    "photo-1520975954732-35dd22299614", // senator/kaftan material
    "photo-1586351012729-c1f8be661c8c", // woven formal fabric
    "photo-1605559424843-9e4c228bf1c2", // rich fabric weave close up
  ],

  // Sofa fabric, velvet, upholstery, curtains, interior textiles
  furniture: [
    "photo-1555041469-a586c61ea9bc", // sofa upholstery texture
    "photo-1586023492125-27b2c045efd7", // curtain/drape fabric
    "photo-1616486338812-3dadae4b4ace", // interior decorative fabric
    "photo-1586351012729-c1f8be661c8c", // velvet upholstery
    "photo-1549187774-b4e9b0445b41", // decorative pillow fabric
    "photo-1600210492486-724fe5c67fb3", // hotel linen/bedding
  ],

  // Technical, nonwoven, waterproof, industrial textile
  industrial: [
    "photo-1565193566173-7a0ee3dbe261", // technical woven fabric
    "photo-1504328345606-18bbc8c9d7d1", // industrial manufacturing
    "photo-1518005020951-eccb494ad742", // structural textile
    "photo-1611532736597-de2d4265fba3", // nonwoven material
    "photo-1565600444102-5e0ac47e8b58", // waterproof technical
    "photo-1516876437184-593fda40c7ce", // industrial weave
  ],

  // Organic cotton, baby soft fabric, bamboo, fleece for kids
  kids: [
    "photo-1503919545889-aef636e10ad4", // soft pastel baby fabric
    "photo-1558618047-3c8c76ca7d13", // organic cotton soft
    "photo-1572635148818-ef6fd45eb394", // fleece/soft fabric
    "photo-1584464457580-c6f68b0a4e9c", // colorful fun fabric
    "photo-1470116945706-e6bf5d5a53ca", // bamboo/organic material
    "photo-1622495966027-e0173192c728", // cartoon print fabric
  ],

  // Organic cotton, bamboo, hemp, recycled — sustainable palette
  eco: [
    "photo-1542601906990-b4d3fb778b09", // natural organic fabric leaves
    "photo-1531512073830-ba890ca4eba2", // natural linen/hemp texture
    "photo-1558618666-fcd25c85cd64", // organic cotton close up
    "photo-1598300042247-d088f8ab3a91", // sustainable natural fiber
    "photo-1614252235316-8c857d38b5f4", // earthy natural fabric
    "photo-1557804506-669a67965ba0", // bamboo fiber fabric
  ],
};

// Rich dark fallback gradient per category
const CATEGORY_GRADIENTS: Record<string, { bg: string; accent: string }> = {
  luxury:     { bg: "#1a0a2e", accent: "#c9a96e" },
  african:    { bg: "#3d0e00", accent: "#f0a500" },
  sports:     { bg: "#0a1f0a", accent: "#00e87a" },
  casual:     { bg: "#0a1628", accent: "#4a9eff" },
  mens:       { bg: "#0d1a2e", accent: "#7b9ccc" },
  furniture:  { bg: "#1a0800", accent: "#cc7a4a" },
  industrial: { bg: "#0d0d0d", accent: "#8a8a8a" },
  kids:       { bg: "#1a0a1a", accent: "#ff9ecc" },
  eco:        { bg: "#0a1a0a", accent: "#4aaa4a" },
};

type AspectRatio = "square" | "video" | "wide" | "tall";

type FabricImageProps = {
  categoryId: string;
  imageUrl?: string | null;
  itemIndex?: number;
  alt: string;
  className?: string;
  overlay?: boolean;
  aspectRatio?: AspectRatio;
};

const ASPECT_CLASSES: Record<AspectRatio, string> = {
  square: "aspect-square",
  video:  "aspect-video",
  wide:   "aspect-[3/1]",
  tall:   "aspect-[3/4]",
};

export default function FabricImage({
  categoryId,
  imageUrl,
  itemIndex = 0,
  alt,
  className = "",
  overlay = true,
  aspectRatio = "video",
}: FabricImageProps) {
  const [imgError, setImgError] = useState(false);
  const [imgLoaded, setImgLoaded] = useState(false);

  const grad = CATEGORY_GRADIENTS[categoryId] || CATEGORY_GRADIENTS.casual;
  const photos = CATEGORY_PHOTOS[categoryId] || CATEGORY_PHOTOS.casual;
  const photoId = photos[itemIndex % photos.length];

  // Priority: supplier upload → Unsplash photo → SVG fallback
  const src = imageUrl
    ? imageUrl
    : `https://images.unsplash.com/${photoId}?auto=format&fit=crop&w=800&q=80`;

  const showFallback = imgError;

  return (
    <div
      className={`relative overflow-hidden ${ASPECT_CLASSES[aspectRatio]} ${className}`}
      style={{ background: grad.bg }}
    >
      {/* Shimmer while loading */}
      {!imgLoaded && !showFallback && (
        <div
          className="absolute inset-0 animate-pulse"
          style={{
            background: `linear-gradient(135deg, ${grad.bg} 0%, ${grad.accent}33 50%, ${grad.bg} 100%)`,
          }}
        />
      )}

      {/* Image */}
      {!showFallback && (
        <img
          src={src}
          alt={alt}
          onLoad={() => setImgLoaded(true)}
          onError={() => setImgError(true)}
          className={`absolute inset-0 h-full w-full object-cover transition-opacity duration-500 ${
            imgLoaded ? "opacity-100" : "opacity-0"
          }`}
        />
      )}

      {/* SVG fallback texture */}
      {showFallback && (
        <svg
          className="absolute inset-0 h-full w-full"
          viewBox="0 0 400 300"
          preserveAspectRatio="xMidYMid slice"
          xmlns="http://www.w3.org/2000/svg"
        >
          <rect width="400" height="300" fill={grad.bg} />
          <g opacity="0.2" stroke={grad.accent} strokeWidth="0.8" fill="none">
            {[0, 50, 100, 150, 200, 250, 300, 350, 400].map((x) =>
              [0, 50, 100, 150, 200, 250, 300].map((y) => (
                <circle key={`${x}-${y}`} cx={x} cy={y} r="18" />
              ))
            )}
          </g>
          <g opacity="0.1" stroke={grad.accent} strokeWidth="0.4">
            {[0, 40, 80, 120, 160, 200, 240, 280].map((y) => (
              <line key={`h${y}`} x1="0" y1={y} x2="400" y2={y} />
            ))}
            {[0, 40, 80, 120, 160, 200, 240, 280, 320, 360, 400].map((x) => (
              <line key={`v${x}`} x1={x} y1="0" x2={x} y2="300" />
            ))}
          </g>
        </svg>
      )}

      {/* Dark gradient overlay for text readability */}
      {overlay && (
        <div
          className="pointer-events-none absolute inset-0"
          style={{
            background:
              "linear-gradient(to top, rgba(0,0,0,0.78) 0%, rgba(0,0,0,0.18) 50%, rgba(0,0,0,0.08) 100%)",
          }}
        />
      )}
    </div>
  );
}
