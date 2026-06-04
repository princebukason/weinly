"use client";

import { useState, useRef, useEffect } from "react";

// Curated Unsplash images per category — served via Unsplash CDN, no API key needed.
// Format: https://images.unsplash.com/photo-{ID}?auto=format&fit=crop&w=800&q=80
const CATEGORY_IMAGE: Record<string, string> = {
  // New 18 categories
  "cotton":            "https://images.unsplash.com/photo-1558769132-cb1aea458c5e?auto=format&fit=crop&w=800&q=80",
  "silk":              "https://images.unsplash.com/photo-1558618666-fcd25c85cd64?auto=format&fit=crop&w=800&q=80",
  "linen":             "https://images.unsplash.com/photo-1586023492125-27b2c045efd7?auto=format&fit=crop&w=800&q=80",
  "wool":              "https://images.unsplash.com/photo-1512436991641-6745cdb1723f?auto=format&fit=crop&w=800&q=80",
  "polyester":         "https://images.unsplash.com/photo-1605518216938-7c31b7b14ad0?auto=format&fit=crop&w=800&q=80",
  "nylon":             "https://images.unsplash.com/photo-1523381294911-8d3cead13475?auto=format&fit=crop&w=800&q=80",
  "rayon":             "https://images.unsplash.com/photo-1594938298603-c8148c4b4e06?auto=format&fit=crop&w=800&q=80",
  "spandex":           "https://images.unsplash.com/photo-1571019613454-1cb2f99b2d8b?auto=format&fit=crop&w=800&q=80",
  "knit":              "https://images.unsplash.com/photo-1604176424472-17cd740f74e7?auto=format&fit=crop&w=800&q=80",
  "woven-specialty":   "https://images.unsplash.com/photo-1558618047-3c8c76ca7d13?auto=format&fit=crop&w=800&q=80",
  "velvet-pile":       "https://images.unsplash.com/photo-1557318041-1ce374d55ebf?auto=format&fit=crop&w=800&q=80",
  "lace-sheer":        "https://images.unsplash.com/photo-1518611012118-696072aa579a?auto=format&fit=crop&w=800&q=80",
  "denim-canvas":      "https://images.unsplash.com/photo-1542291026-7eec264c27ff?auto=format&fit=crop&w=800&q=80",
  "coating-technical": "https://images.unsplash.com/photo-1519337265831-281ec6cc8514?auto=format&fit=crop&w=800&q=80",
  "nonwoven":          "https://images.unsplash.com/photo-1558618666-fcd25c85cd64?auto=format&fit=crop&w=800&q=80",
  "african-print":     "https://images.unsplash.com/photo-1574180045827-681f8a1a9622?auto=format&fit=crop&w=800&q=80",
  "home-upholstery":   "https://images.unsplash.com/photo-1555041469-a586c61ea9bc?auto=format&fit=crop&w=800&q=80",
  "sustainable":       "https://images.unsplash.com/photo-1600080972464-8e5f35f63d08?auto=format&fit=crop&w=800&q=80",

  // Legacy category IDs (kept for backward compat)
  "luxury":     "/images/categories/luxury.jpg",
  "african":    "/images/categories/african.jpg",
  "sports":     "/images/categories/sports.jpg",
  "casual":     "/images/categories/casual.jpg",
  "mens":       "/images/categories/mens.jpg",
  "furniture":  "/images/categories/furniture.jpg",
  "industrial": "/images/categories/industrial.jpg",
  "kids":       "/images/categories/kids.jpg",
  "eco":        "/images/categories/eco.jpg",
};

// Gradient shown while image loads (and as fallback if image fails)
const CATEGORY_GRADIENTS: Record<string, { bg: string; accent: string }> = {
  "cotton":            { bg: "#2a1f0a", accent: "#d4a853" },
  "silk":              { bg: "#1a0a2e", accent: "#c9a96e" },
  "linen":             { bg: "#1e1810", accent: "#b8a99a" },
  "wool":              { bg: "#1a1208", accent: "#9e8a78" },
  "polyester":         { bg: "#0a1628", accent: "#6b8fa3" },
  "nylon":             { bg: "#08121e", accent: "#5a7a8c" },
  "rayon":             { bg: "#0a1a10", accent: "#7a9e7e" },
  "spandex":           { bg: "#1a0820", accent: "#8b6bae" },
  "knit":              { bg: "#1a0e08", accent: "#c07e5a" },
  "woven-specialty":   { bg: "#0d0a1e", accent: "#a0855b" },
  "velvet-pile":       { bg: "#14082a", accent: "#7b5ea7" },
  "lace-sheer":        { bg: "#1a1018", accent: "#c4a882" },
  "denim-canvas":      { bg: "#080e1a", accent: "#3d5a73" },
  "coating-technical": { bg: "#0a0f0a", accent: "#4a6741" },
  "nonwoven":          { bg: "#0f0f0f", accent: "#6e7c6a" },
  "african-print":     { bg: "#3d0e00", accent: "#c4612a" },
  "home-upholstery":   { bg: "#1a1008", accent: "#8b7355" },
  "sustainable":       { bg: "#081a08", accent: "#5a8a5a" },

  // Legacy
  "luxury":     { bg: "#1a0a2e", accent: "#c9a96e" },
  "african":    { bg: "#3d0e00", accent: "#f0a500" },
  "sports":     { bg: "#0a1f0a", accent: "#00e87a" },
  "casual":     { bg: "#0a1628", accent: "#4a9eff" },
  "mens":       { bg: "#0d1a2e", accent: "#7b9ccc" },
  "furniture":  { bg: "#1a0800", accent: "#cc7a4a" },
  "industrial": { bg: "#0d0d0d", accent: "#8a8a8a" },
  "kids":       { bg: "#1a0a1a", accent: "#ff9ecc" },
  "eco":        { bg: "#0a1a0a", accent: "#4aaa4a" },
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
  itemIndex?: number;
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
  const imgRef = useRef<HTMLImageElement>(null);

  const grad = CATEGORY_GRADIENTS[categoryId] || CATEGORY_GRADIENTS["cotton"];
  const localSrc = CATEGORY_IMAGE[categoryId] || CATEGORY_IMAGE["cotton"];

  // Priority: supplier upload → category image → SVG fallback
  const src = imageUrl || localSrc;

  useEffect(() => {
    setImgError(false);
    setImgLoaded(false);
  }, [src]);

  useEffect(() => {
    if (imgRef.current?.complete && !imgRef.current.naturalWidth) {
      setImgError(true);
    } else if (imgRef.current?.complete) {
      setImgLoaded(true);
    }
  }, [src]);

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
          ref={imgRef}
          src={src}
          alt={alt}
          onLoad={() => setImgLoaded(true)}
          onError={() => setImgError(true)}
          className={`absolute inset-0 h-full w-full object-cover transition-opacity duration-300 ${
            imgLoaded ? "opacity-100" : "opacity-0"
          }`}
        />
      )}

      {/* SVG woven-pattern fallback — only if image completely fails */}
      {imgError && (
        <svg
          className="absolute inset-0 h-full w-full"
          viewBox="0 0 400 300"
          preserveAspectRatio="xMidYMid slice"
          xmlns="http://www.w3.org/2000/svg"
        >
          <rect width="400" height="300" fill={grad.bg} />
          <g opacity="0.15" stroke={grad.accent} strokeWidth="0.6" fill="none">
            {Array.from({ length: 11 }).map((_, i) => (
              <line key={`h${i}`} x1="0" y1={i * 30} x2="400" y2={i * 30} />
            ))}
            {Array.from({ length: 14 }).map((_, i) => (
              <line key={`v${i}`} x1={i * 30} y1="0" x2={i * 30} y2="300" />
            ))}
          </g>
          <g opacity="0.12" stroke={grad.accent} strokeWidth="0.8" fill="none">
            {Array.from({ length: 7 }).map((_, i) =>
              Array.from({ length: 6 }).map((_, j) => (
                <circle key={`c${i}${j}`} cx={30 + i * 60} cy={30 + j * 50} r="20" />
              ))
            )}
          </g>
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
