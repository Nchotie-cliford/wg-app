import sharp from "sharp";
import { mkdirSync } from "node:fs";
import { fileURLToPath } from "node:url";
import path from "node:path";

const publicDir = path.join(
  path.dirname(fileURLToPath(import.meta.url)),
  "..",
  "public"
);
mkdirSync(publicDir, { recursive: true });

const svg = `
<svg xmlns="http://www.w3.org/2000/svg" width="512" height="512" viewBox="0 0 512 512">
  <rect width="512" height="512" rx="110" fill="#FF6B6B"/>
  <rect x="24" y="24" width="464" height="464" rx="92" fill="none" stroke="#2D2A26" stroke-width="16"/>
  <g transform="translate(256 266)">
    <polygon points="-160,-10 0,-150 160,-10 160,150 70,150 70,30 -70,30 -70,150 -160,150"
      fill="#FFF8EC" stroke="#2D2A26" stroke-width="18" stroke-linejoin="round"/>
    <rect x="-30" y="30" width="60" height="120" fill="#4ECDC4" stroke="#2D2A26" stroke-width="14"/>
  </g>
</svg>`;

const targets = [
  { file: "icon-192.png", size: 192 },
  { file: "icon-512.png", size: 512 },
  { file: "apple-touch-icon.png", size: 180 },
];

for (const { file, size } of targets) {
  await sharp(Buffer.from(svg))
    .resize(size, size)
    .png()
    .toFile(path.join(publicDir, file));
  console.log(`wrote ${file}`);
}
