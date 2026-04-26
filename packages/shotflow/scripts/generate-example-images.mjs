import sharp from "sharp";
import { mkdir } from "node:fs/promises";
import { dirname, resolve } from "node:path";
import { fileURLToPath } from "node:url";

const here = dirname(fileURLToPath(import.meta.url));
const imagesDir = resolve(here, "..", "..", "..", "examples", "images");

const images = [
  { sub: "admin", file: "login.png", label: "Admin Login", color: "#2563eb" },
  { sub: "admin", file: "dashboard.png", label: "Admin Dashboard", color: "#3b82f6" },
  { sub: "admin", file: "invite.png", label: "Invite Modal", color: "#60a5fa" },
  { sub: "buyer", file: "login.png", label: "Buyer Login", color: "#16a34a" },
];

for (const img of images) {
  const dir = resolve(imagesDir, img.sub);
  await mkdir(dir, { recursive: true });
  const out = resolve(dir, img.file);

  const svg = Buffer.from(
    `<svg xmlns="http://www.w3.org/2000/svg" width="800" height="600">
  <rect width="800" height="600" fill="${img.color}"/>
  <text x="400" y="320" text-anchor="middle" font-size="56" font-family="sans-serif" fill="white" font-weight="700">${img.label}</text>
</svg>`,
  );

  await sharp(svg).png().toFile(out);
  console.log(`Wrote ${out}`);
}
