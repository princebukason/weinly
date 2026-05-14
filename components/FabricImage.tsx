"use client";

import { useState } from "react";

// Keyword sets per category for loremflickr.com — keyword-based Flickr image search.
// URL: https://loremflickr.com/{w}/{h}/{keywords}?lock={n}
// lock= makes it deterministic; different numbers give different photos per slot.
const CATEGORY_KEYWORDS: Record<string, { terms: string; locks: number[] }> = {
  luxury:     { terms: "silk,lace,fabric",           locks: [1, 11, 21, 31, 41] },
  african:    { terms: "ankara,wax,textile",          locks: [2, 12, 22, 32, 42] },
  sports:     { terms: "sportswear,activewear,mesh",  locks: [3, 13, 23, 33, 43] },
  casual:     { terms: "denim,cotton,fabric",         locks: [4, 14, 24, 34, 44] },
  mens:       { terms: "suiting,wool,fabric",         locks: [5, 15, 25, 35, 45] },
  furniture:  { terms: "upholstery,sofa,velvet",      locks: [6, 16, 26, 36, 46] },
  industrial: { terms: "textile,industrial,weave",    locks: [7, 17, 27, 37, 47] },
  kids:       { terms: "cotton,children,colorful",    locks: [8, 18, 28, 38, 48] },
  eco:        { terms: "organic,linen,natural",       locks: [9, 19, 29, 39, 49] },
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
  const kw = CATEGORY_KEYWORDS[categoryId] || CATEGORY_KEYWORDS.casual;
  const lock = kw.locks[itemIndex % kw.locks.length];

  // Priority: supplier upload → loremflickr keyword search → SVG fallback
  const flickrSrc = `https://loremflickr.com/${width}/${height}/${kw.terms}?lock=${lock}`;
  const src = imageUrl || flickrSrc;

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
