"use client";

import { useState } from "react";

// Curated Unsplash photo IDs per category — consistent, high quality fabric images
// Each category has 6 photos that rotate based on item index
const CATEGORY_PHOTOS: Record<string, string[]> = {
  luxury: [
    "photo-1558769132-cb1aea458c5e", // white lace detail
    "photo-1566193599756-12cbf6f4a74a", // ivory lace fabric
    "photo-1558618666-fcd25c85cd64", // silk fabric close up
    "photo-1515886657613-9f3515b0c78f", // bridal fabric
    "photo-1517940310602-26535839fe84", // velvet texture
    "photo-1594938298603-c8148c4b4415", // organza fabric
  ],
  african: [
    "photo-1590735213920-68192a487bc2", // ankara fabric
    "photo-1601924994987-69e26d50dc26", // wax print fabric
    "photo-1582719471384-894fbb16e074", // african print
    "photo-1607082348824-0a96f2a4b9da", // colorful fabric
    "photo-1597773150796-e5c14ebecbf5", // bold print fabric
    "photo-1619551734325-81176a0e2cf7", // african wax cloth
  ],
  sports: [
    "photo-1571902943202-507ec2618e8f", // sportswear fabric
    "photo-1517836357463-d25dfeac3438", // gym fabric texture
    "photo-1518609878373-06d740f60d8b", // activewear material
    "photo-1556909114-f6e7ad7d3136", // mesh fabric
    "photo-1544367567-0f2fcb009e0b", // yoga wear
    "photo-1594381898411-846e7d193883", // compression fabric
  ],
  casual: [
    "photo-1558618047-3c8c76ca7d13", // cotton fabric
    "photo-1558618666-fcd25c85cd64", // denim texture
    "photo-1531512073830-ba890ca4eba2", // linen fabric
    "photo-1620799140188-3b2a02fd9a77", // chiffon fabric
    "photo-1490481651871-ab68de25d43d", // jersey fabric
    "photo-1558769132-cb1aea458c5e", // casual fashion fabric
  ],
  mens: [
    "photo-1507679799987-c73779587ccf", // suiting fabric
    "photo-1617137968427-85924c800a22", // formal fabric
    "photo-1594938298603-c8148c4b4415", // brocade texture
    "photo-1520975954732-35dd22299614", // jacquard fabric
    "photo-1594926735945-84c4be82a0dc", // senator fabric
    "photo-1617137984095-74e4e5e3613f", // wool blend
  ],
  furniture: [
    "photo-1555041469-a586c61ea9bc", // sofa upholstery
    "photo-1586023492125-27b2c045efd7", // curtain fabric
    "photo-1616486338812-3dadae4b4ace", // interior fabric
    "photo-1507003211169-0a1dd7228f2d", // velvet upholstery
    "photo-1560448205-4d9b3e6bb6db", // decorative fabric
    "photo-1600210492486-724fe5c67fb3", // hotel linen
  ],
  industrial: [
    "photo-1565193566173-7a0ee3dbe261", // technical fabric
    "photo-1558618666-fcd25c85cd64", // industrial textile
    "photo-1558769132-cb1aea458c5e", // nonwoven fabric
    "photo-1531512073830-ba890ca4eba2", // waterproof material
    "photo-1559827260-dc66d52bef19", // reflective fabric
    "photo-1518005020951-eccb494ad742", // technical textile
  ],
  kids: [
    "photo-1503919545889-aef636e10ad4", // soft baby fabric
    "photo-1558618047-3c8c76ca7d13", // organic cotton
    "photo-1555252333-9f8e92e65df9", // kids print fabric
    "photo-1556909114-f6e7ad7d3136", // bamboo fabric
    "photo-1578662996442-48f60103fc96", // soft fleece
    "photo-1472162072942-cd5147eb3902", // baby jersey
  ],
  eco: [
    "photo-1542601906990-b4d3fb778b09", // organic fabric
    "photo-1531512073830-ba890ca4eba2", // bamboo fiber
    "photo-1558618666-fcd25c85cd64", // recycled fabric
    "photo-1558618047-3c8c76ca7d13", // sustainable cotton
    "photo-1594938298603-c8148c4b4415", // hemp fabric
    "photo-1490481651871-ab68de25d43d", // eco viscose
  ],
};

// Rich dark gradient backgrounds per category as fallback
const CATEGORY_GRADIENTS: Record<string, { bg: string; pattern: string }> = {
  luxury:     { bg: "#1a0a2e", pattern: "#c9a96e" },
  african:    { bg: "#3d0e00", pattern: "#f0a500" },
  sports:     { bg: "#0a1f0a", pattern: "#00e87a" },
  casual:     { bg: "#0a1628", pattern: "#4a9eff" },
  mens:       { bg: "#0d1a2e", pattern: "#7b9ccc" },
  furniture:  { bg: "#1a0800", pattern: "#cc7a4a" },
  industrial: { bg: "#0d0d0d", pattern: "#8a8a8a" },
  kids:       { bg: "#1a0a1a", pattern: "#ff9ecc" },
  eco:        { bg: "#0a1a0a", pattern: "#4aaa4a" },
};

type FabricImageProps = {
  categoryId: string;
  imageUrl?: string | null;       // supplier-uploaded image takes priority
  itemIndex?: number;             // rotates which Unsplash photo to use
  alt: string;
  className?: string;
  overlay?: boolean;
  aspectRatio?: "square" | "video" | "wide" | "tall";
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

  // Pick Unsplash photo
  const photos = CATEGORY_PHOTOS[categoryId] || CATEGORY_PHOTOS.casual;
  const photoId = photos[itemIndex % photos.length];
  const unsplashUrl = `https://images.unsplash.com/${photoId}?auto=format&fit=crop&w=800&q=80`;

  // Priority: supplier upload → Unsplash → gradient fallback
  const src = imageUrl || unsplashUrl;
  const showFallback = imgError || (!imageUrl && !photoId);

  const aspectClasses: Record<string, string> = {
    square: "aspect-square",
    video:  "aspect-video",
    wide:   "aspect-[3/1]",
    tall:   "aspect-[3/4]",
  };

  return (
    <div className={`relative overflow-hidden ${aspectClasses[aspectRatio]} ${className}`}
      style={{ background: grad.bg }}>

      {/* Loading shimmer */}
      {!imgLoaded && !showFallback && (
        <div className="absolute inset-0 animate-pulse"
          style={{ background: `linear-gradient(135deg, ${grad.bg} 0%, ${grad.pattern}22 50%, ${grad.bg} 100%)` }} />
      )}

      {/* Real image */}
      {!showFallback && (
        <img
          src={src}
          alt={alt}
          onLoad={() => setImgLoaded(true)}
          onError={() => setImgError(true)}
          className={`absolute inset-0 w-full h-full object-cover transition-opacity duration-500 ${imgLoaded ? "opacity-100" : "opacity-0"}`}
        />
      )}

      {/* Fallback — SVG pattern texture */}
      {showFallback && (
        <svg className="absolute inset-0 w-full h-full" viewBox="0 0 400 300"
          preserveAspectRatio="xMidYMid slice" xmlns="http://www.w3.org/2000/svg">
          <rect width="400" height="300" fill={grad.bg} />
          <g opacity="0.25" stroke={grad.pattern} strokeWidth="0.8" fill="none">
            {Array.from({ length: 8 }).map((_, i) =>
              Array.from({ length: 6 }).map((_, j) => (
                <circle key={`${i}-${j}`} cx={50 * i} cy={50 * j}
                  r="20" />
              ))
            )}
          </g>
          <g opacity="0.1" stroke={grad.pattern} strokeWidth="0.5">
            {Array.from({ length: 8 }).map((_, i) => (
              <line key={`h${i}`} x1="0" y1={i * 40} x2="400" y2={i * 40} />
            ))}
            {Array.from({ length: 11 }).map((_, i) => (
              <line key={`v${i}`} x1={i * 40} y1="0" x2={i * 40} y2="300" />
            ))}
          </g>
        </svg>
      )}

      {/* Gradient overlay for text readability */}
      {overlay && (
        <div className="absolute inset-0 pointer-events-none"
          style={{ background: "linear-gradient(to top, rgba(0,0,0,0.75) 0%, rgba(0,0,0,0.2) 50%, rgba(0,0,0,0.1) 100%)" }} />
      )}
    </div>
  );
}
