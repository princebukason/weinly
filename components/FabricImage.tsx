"use client";

import { useState } from "react";

// ─────────────────────────────────────────────────────────────
// Uses Unsplash Source API with specific fabric keywords.
// Format: https://source.unsplash.com/featured/?{keywords}
// Unsplash picks the best matching photo — no guessing IDs.
// Each category has a primary keyword + fallback keywords.
// ─────────────────────────────────────────────────────────────

const CATEGORY_KEYWORDS: Record<string, string[]> = {
  luxury: [
    "lace+fabric+textile",
    "white+lace+fabric",
    "bridal+lace+fabric",
    "silk+fabric+textile",
    "velvet+fabric+close+up",
    "organza+fabric",
  ],
  african: [
    "ankara+fabric+wax+print",
    "african+wax+print+fabric",
    "kente+cloth+fabric",
    "african+print+textile",
    "wax+print+fabric+colorful",
    "african+fabric+colorful",
  ],
  sports: [
    "sportswear+fabric+textile",
    "mesh+fabric+close+up",
    "spandex+lycra+fabric",
    "athletic+fabric+textile",
    "polyester+fabric+texture",
    "compression+fabric",
  ],
  casual: [
    "cotton+fabric+textile",
    "linen+fabric+close+up",
    "denim+fabric+texture",
    "chiffon+fabric+textile",
    "jersey+fabric+knit",
    "cotton+linen+natural+fabric",
  ],
  mens: [
    "suiting+fabric+wool",
    "brocade+fabric+textile",
    "jacquard+fabric+weave",
    "wool+fabric+close+up",
    "formal+fabric+textile",
    "woven+fabric+pattern",
  ],
  furniture: [
    "upholstery+fabric+sofa",
    "velvet+upholstery+fabric",
    "curtain+fabric+textile",
    "sofa+fabric+texture",
    "interior+fabric+textile",
    "decorative+fabric+home",
  ],
  industrial: [
    "technical+textile+fabric",
    "nonwoven+fabric+industrial",
    "woven+textile+industrial",
    "technical+fabric+material",
    "industrial+textile+weave",
    "waterproof+fabric+material",
  ],
  kids: [
    "soft+cotton+baby+fabric",
    "organic+cotton+fabric+soft",
    "fleece+fabric+soft",
    "bamboo+fabric+textile",
    "kids+fabric+colorful+cotton",
    "baby+fabric+organic",
  ],
  eco: [
    "organic+cotton+fabric+natural",
    "hemp+fabric+natural+textile",
    "bamboo+fiber+fabric",
    "sustainable+fabric+natural",
    "natural+linen+organic+fabric",
    "recycled+fabric+eco+textile",
  ],
};

// Rich dark gradient fallback per category — shows while image loads
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

const ASPECT_CLASSES: Record<AspectRatio, string> = {
  square: "aspect-square",
  video:  "aspect-video",
  wide:   "aspect-[3/1]",
  tall:   "aspect-[3/4]",
};

type FabricImageProps = {
  categoryId: string;
  imageUrl?: string | null;   // supplier-uploaded photo takes priority
  itemIndex?: number;         // rotates which keyword set to use
  alt: string;
  className?: string;
  overlay?: boolean;
  aspectRatio?: AspectRatio;
  width?: number;
  height?: number;
};

export default function FabricImage({
  categoryId,
  imageUrl,
  itemIndex = 0,
  alt,
  className = "",
  overlay = true,
  aspectRatio = "video",
  width = 800,
  height = 600,
}: FabricImageProps) {
  const [imgError, setImgError] = useState(false);
  const [imgLoaded, setImgLoaded] = useState(false);

  const grad = CATEGORY_GRADIENTS[categoryId] || CATEGORY_GRADIENTS.casual;
  const keywords = CATEGORY_KEYWORDS[categoryId] || CATEGORY_KEYWORDS.casual;
  const keyword = keywords[itemIndex % keywords.length];

  // Priority: supplier upload → Unsplash keyword search → SVG fallback
  const unsplashSrc = `https://source.unsplash.com/featured/${width}x${height}/?${keyword}`;
  const src = imageUrl || unsplashSrc;

  return (
    <div
      className={`relative overflow-hidden ${ASPECT_CLASSES[aspectRatio]} ${className}`}
      style={{ background: grad.bg }}
    >
      {/* Shimmer placeholder while loading */}
      {!imgLoaded && !imgError && (
        <div
          className="absolute inset-0 animate-pulse"
          style={{
            background: `linear-gradient(135deg, ${grad.bg} 0%, ${grad.accent}33 50%, ${grad.bg} 100%)`,
          }}
        />
      )}

      {/* Main image */}
      {!imgError && (
        <img
          src={src}
          alt={alt}
          onLoad={() => setImgLoaded(true)}
          onError={() => setImgError(true)}
          className={`absolute inset-0 h-full w-full object-cover transition-opacity duration-700 ${
            imgLoaded ? "opacity-100" : "opacity-0"
          }`}
        />
      )}

      {/* SVG fallback — only if image completely fails */}
      {imgError && (
        <svg
          className="absolute inset-0 h-full w-full"
          viewBox="0 0 400 300"
          preserveAspectRatio="xMidYMid slice"
          xmlns="http://www.w3.org/2000/svg"
        >
          <rect width="400" height="300" fill={grad.bg} />
          {/* Woven grid pattern */}
          <g opacity="0.15" stroke={grad.accent} strokeWidth="0.6" fill="none">
            {Array.from({ length: 11 }).map((_, i) => (
              <line key={`h${i}`} x1="0" y1={i * 30} x2="400" y2={i * 30} />
            ))}
            {Array.from({ length: 14 }).map((_, i) => (
              <line key={`v${i}`} x1={i * 30} y1="0" x2={i * 30} y2="300" />
            ))}
          </g>
          {/* Circle weave pattern */}
          <g opacity="0.12" stroke={grad.accent} strokeWidth="0.8" fill="none">
            {Array.from({ length: 7 }).map((_, i) =>
              Array.from({ length: 6 }).map((_, j) => (
                <circle key={`c${i}${j}`} cx={30 + i * 60} cy={30 + j * 50} r="20" />
              ))
            )}
          </g>
          {/* Diagonal weave */}
          <g opacity="0.08" stroke={grad.accent} strokeWidth="0.5">
            {Array.from({ length: 20 }).map((_, i) => (
              <line key={`d${i}`} x1={i * 30 - 100} y1="0" x2={i * 30 + 200} y2="300" />
            ))}
          </g>
        </svg>
      )}

      {/* Gradient overlay for text legibility */}
      {overlay && (
        <div
          className="pointer-events-none absolute inset-0"
          style={{
            background:
              "linear-gradient(to top, rgba(0,0,0,0.82) 0%, rgba(0,0,0,0.2) 50%, rgba(0,0,0,0.05) 100%)",
          }}
        />
      )}
    </div>
  );
}
