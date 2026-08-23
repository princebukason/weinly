import sharp from "sharp";
import { readFileSync, mkdirSync } from "fs";
import { join, dirname } from "path";
import { fileURLToPath } from "url";

const __dirname = dirname(fileURLToPath(import.meta.url));
const outDir = join(__dirname, "logo-exports");
mkdirSync(outDir, { recursive: true });

// ── Inline SVGs (no external font dependency) ────────────────────────────────

// Icon only — square, works as profile picture
const iconSvg = `<svg width="512" height="512" viewBox="0 0 512 512" fill="none" xmlns="http://www.w3.org/2000/svg">
  <rect width="512" height="512" rx="110" fill="#24483f"/>
  <path d="M90 128 L166 374 L256 201 L346 374 L422 128"
    stroke="white" stroke-width="32" stroke-linecap="round" stroke-linejoin="round" fill="none"/>
  <circle cx="256" cy="201" r="36" fill="#c9935b"/>
  <circle cx="247" cy="192" r="14" fill="white" opacity="0.3"/>
</svg>`;

// Icon on cream background — social card / OG image
const socialCardSvg = `<svg width="1200" height="630" viewBox="0 0 1200 630" fill="none" xmlns="http://www.w3.org/2000/svg">
  <rect width="1200" height="630" fill="#f5ecdc"/>
  <!-- Icon block -->
  <rect x="80" y="215" width="200" height="200" rx="46" fill="#24483f"/>
  <path d="M116 256 L150 376 L200 287 L250 376 L284 256"
    stroke="white" stroke-width="13" stroke-linecap="round" stroke-linejoin="round" fill="none"/>
  <circle cx="200" cy="287" r="16" fill="#c9935b"/>
  <circle cx="196" cy="283" r="6" fill="white" opacity="0.3"/>
  <!-- Wordmark -->
  <text x="308" y="338"
    font-family="Georgia, 'Times New Roman', serif"
    font-size="120" font-weight="700"
    fill="#1f2933" letter-spacing="-4">weinly</text>
  <!-- Terracotta dot -->
  <circle cx="1107" cy="325" r="14" fill="#c9935b"/>
  <!-- Tagline -->
  <text x="308" y="390"
    font-family="Arial, Helvetica, sans-serif"
    font-size="28" font-weight="400"
    fill="#6b7280" letter-spacing="2">FABRIC SOURCING · CHINA TO THE WORLD</text>
  <!-- Bottom accent line -->
  <rect x="80" y="570" width="200" height="3" rx="2" fill="#c9935b" opacity="0.6"/>
</svg>`;

// Square social card (Instagram / Facebook profile cover / LinkedIn)
const squareCardSvg = `<svg width="1080" height="1080" viewBox="0 0 1080 1080" fill="none" xmlns="http://www.w3.org/2000/svg">
  <rect width="1080" height="1080" fill="#24483f"/>
  <!-- Subtle texture lines -->
  <line x1="0" y1="540" x2="1080" y2="540" stroke="white" stroke-width="1" opacity="0.05"/>
  <line x1="540" y1="0" x2="540" y2="1080" stroke="white" stroke-width="1" opacity="0.05"/>
  <!-- Large W mark, centred -->
  <path d="M270 320 L400 760 L540 480 L680 760 L810 320"
    stroke="white" stroke-width="44" stroke-linecap="round" stroke-linejoin="round" fill="none"/>
  <circle cx="540" cy="480" r="52" fill="#c9935b"/>
  <circle cx="526" cy="466" r="20" fill="white" opacity="0.25"/>
  <!-- Wordmark below -->
  <text x="540" y="920"
    font-family="Georgia, 'Times New Roman', serif"
    font-size="112" font-weight="700"
    fill="white" letter-spacing="-3"
    text-anchor="middle">weinly</text>
  <!-- Tagline -->
  <text x="540" y="968"
    font-family="Arial, Helvetica, sans-serif"
    font-size="26" font-weight="400"
    fill="#c9935b" letter-spacing="5"
    text-anchor="middle">FABRIC SOURCING</text>
</svg>`;

// Profile picture — circular-friendly square (no rounded corners, crop handles it)
const profileSvg = `<svg width="800" height="800" viewBox="0 0 800 800" fill="none" xmlns="http://www.w3.org/2000/svg">
  <rect width="800" height="800" fill="#24483f"/>
  <path d="M140 200 L260 600 L400 300 L540 600 L660 200"
    stroke="white" stroke-width="42" stroke-linecap="round" stroke-linejoin="round" fill="none"/>
  <circle cx="400" cy="300" r="46" fill="#c9935b"/>
  <circle cx="388" cy="288" r="17" fill="white" opacity="0.28"/>
</svg>`;

const exports = [
  { name: "weinly-icon-512.png",        svg: iconSvg,       w: 512,  h: 512  },
  { name: "weinly-icon-1024.png",       svg: iconSvg,       w: 1024, h: 1024 },
  { name: "weinly-profile.png",         svg: profileSvg,    w: 800,  h: 800  },
  { name: "weinly-social-card.png",     svg: socialCardSvg, w: 1200, h: 630  },
  { name: "weinly-square-post.png",     svg: squareCardSvg, w: 1080, h: 1080 },
];

for (const { name, svg, w, h } of exports) {
  const buf = Buffer.from(svg);
  await sharp(buf, { density: 144 })
    .resize(w, h)
    .png({ quality: 100 })
    .toFile(join(outDir, name));
  console.log(`✓ ${name}  (${w}×${h})`);
}

console.log(`\nAll exports saved to: ${outDir}`);
