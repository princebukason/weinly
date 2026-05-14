"use client";

import { useState } from "react";

// Verified Unsplash CDN photo IDs — fetched directly from unsplash.com photo pages.
// URL: https://images.unsplash.com/photo-{id}?auto=format&fit=crop&w={w}&q=80
const CATEGORY_PHOTOS: Record<string, string[]> = {
  luxury:     ["1619043519379-99df2736108d", "1617055407123-3d7130c1f940", "1591957974074-68daffbf8df8"],
  african:    ["1552710307-537199cd41c0",    "1593803926640-0c663fabfaf5"],
  sports:     ["1636716019138-750a1b011e3f", "1671530191715-b1019db3944a"],
  casual:     ["1645859610425-f0f4177df5f0", "1524404794194-16bae22718c0"],
  mens:       ["1705493253575-e911888621ff", "1532526674046-5b3f6d7d2ab1"],
  furniture:  ["1567016432779-094069958ea5", "1555041469-a586c61ea9bc"],
  industrial: ["1743142883555-b0beac669a51", "1741176507345-dd8587f1a175"],
  kids:       ["1640746942093-cec8e647596d", "1630920501459-f3e99320c4a5"],
  eco:        ["1703495330144-0ab603d059ef", "1554967651-3997ad1c43b0"],
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
  const photos = CATEGORY_PHOTOS[categoryId] || CATEGORY_PHOTOS.casual;
  const photoId = photos[itemIndex % photos.length];

  // Priority: supplier upload → verified Unsplash CDN photo → SVG fallback
  const unsplashSrc = `https://images.unsplash.com/photo-${photoId}?auto=format&fit=crop&w=${width}&q=80`;
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
