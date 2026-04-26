import type { Config } from "./schema.js";
import {
  computeLayout,
  type LayoutEdge,
  type LayoutGroup,
  type LayoutNode,
} from "./layout.js";
import { embedImage, type ImageFormat } from "../utils/image.js";

const SVG_PADDING = 60;

export interface RenderOptions {
  baseDir: string;
  thumbnailWidth?: number;
  quality?: number;
  format?: ImageFormat;
}

export async function render(
  config: Config,
  options: RenderOptions,
): Promise<string> {
  const imageOpts = {
    thumbnailWidth: options.thumbnailWidth ?? config.image.thumbnail_width,
    quality: options.quality ?? config.image.quality,
    format: options.format ?? config.image.format,
  };

  const screens = Object.values(config.groups).flatMap((g) => g.screens);
  const imageEntries = await Promise.all(
    screens.map(async (s) => {
      const dataUrl = await embedImage(s.image, options.baseDir, imageOpts);
      return [s.id, dataUrl] as const;
    }),
  );
  const imagesByScreen = new Map<string, string>(imageEntries);

  const layout = computeLayout(config);
  const W = layout.width + SVG_PADDING * 2;
  const H = layout.height + SVG_PADDING * 2;

  return `<!DOCTYPE html>
<html lang="ja">
<head>
<meta charset="UTF-8">
<title>${escapeHtml(config.title)}</title>
<style>${styles()}</style>
</head>
<body>
<header>
  <h1>${escapeHtml(config.title)}</h1>
  ${config.description ? `<p class="description">${escapeHtml(config.description)}</p>` : ""}
</header>
<main>
<svg viewBox="0 0 ${W} ${H}" width="${W}" height="${H}" xmlns="http://www.w3.org/2000/svg">
<defs>
  <marker id="arrow-default" viewBox="0 0 10 10" refX="9" refY="5" markerWidth="8" markerHeight="8" orient="auto-start-reverse">
    <path d="M0,0 L10,5 L0,10 Z" fill="#374151"/>
  </marker>
  <marker id="arrow-modal" viewBox="0 0 10 10" refX="9" refY="5" markerWidth="6" markerHeight="6" orient="auto-start-reverse">
    <path d="M0,0 L10,5 L0,10 Z" fill="#6b7280" fill-opacity="0.6"/>
  </marker>
</defs>
<g transform="translate(${SVG_PADDING}, ${SVG_PADDING})">
${layout.groups.map(renderGroup).join("\n")}
${layout.edges.map(renderEdge).join("\n")}
${layout.nodes.map((n) => renderNode(n, imagesByScreen.get(n.id) ?? "")).join("\n")}
</g>
</svg>
</main>
</body>
</html>`;
}

function renderGroup(group: LayoutGroup): string {
  const labelW = group.label.length * 14 + 16;
  const labelH = 22;
  const labelY = group.y - labelH - 4;
  return `<g class="group" data-group-id="${escapeHtml(group.id)}">
  <rect x="${group.x}" y="${group.y}" width="${group.width}" height="${group.height}" fill="${group.color}" fill-opacity="0.05" stroke="${group.color}" stroke-opacity="0.4" rx="8"/>
  <rect x="${group.x}" y="${labelY}" rx="3" ry="3" width="${labelW}" height="${labelH}" fill="${group.color}"/>
  <text x="${group.x + 8}" y="${labelY + 16}" fill="#fff" font-size="12" font-weight="600">${escapeHtml(group.label)}</text>
</g>`;
}

function renderNode(node: LayoutNode, imageDataUrl: string): string {
  const isModal = node.type === "modal";
  const rx = isModal ? 14 : 6;
  const dash = isModal ? ` stroke-dasharray="6 4"` : "";
  const imgH = node.height - 32;
  const imgW = node.width - 16;
  const imgInner = imageDataUrl
    ? `<image href="${imageDataUrl}" x="8" y="8" width="${imgW}" height="${imgH - 8}" preserveAspectRatio="xMidYMid meet"/>`
    : `<rect x="8" y="8" width="${imgW}" height="${imgH - 8}" fill="#e5e7eb" rx="4"/>`;
  return `<g class="screen ${node.type}" data-screen-id="${escapeHtml(node.id)}" transform="translate(${node.x}, ${node.y})">
  <rect width="${node.width}" height="${node.height}" rx="${rx}" fill="white" stroke="#d1d5db" stroke-width="1"${dash}/>
  ${imgInner}
  <text x="${node.width / 2}" y="${node.height - 10}" text-anchor="middle" font-size="13" font-weight="500" fill="#111827">${escapeHtml(node.name)}</text>
</g>`;
}

function renderEdge(edge: LayoutEdge): string {
  if (edge.points.length < 2) return "";
  const isModal = edge.type === "modal";
  const stroke = isModal ? "#6b7280" : "#374151";
  const opacity = isModal ? "0.6" : "1";
  const dash = isModal ? ` stroke-dasharray="5 4"` : "";
  const marker = isModal ? "url(#arrow-modal)" : "url(#arrow-default)";

  const d = edge.points
    .map((p, i) => `${i === 0 ? "M" : "L"} ${p.x.toFixed(2)} ${p.y.toFixed(2)}`)
    .join(" ");

  let labelEl = "";
  if (edge.label) {
    const mid = edge.points[Math.floor(edge.points.length / 2)];
    if (mid) {
      const labelW = edge.label.length * 11 + 12;
      labelEl = `<g class="edge-label">
  <rect x="${mid.x - labelW / 2}" y="${mid.y - 9}" width="${labelW}" height="16" fill="white" fill-opacity="0.92" rx="2"/>
  <text x="${mid.x}" y="${mid.y + 3}" text-anchor="middle" font-size="11" fill="#4b5563">${escapeHtml(edge.label)}</text>
</g>`;
    }
  }

  return `<g class="transition ${edge.type}">
  <path d="${d}" fill="none" stroke="${stroke}" stroke-width="1.5" stroke-opacity="${opacity}"${dash} marker-end="${marker}"/>
  ${labelEl}
</g>`;
}

function styles(): string {
  return `
    * { box-sizing: border-box; }
    body { font-family: -apple-system, BlinkMacSystemFont, "Segoe UI", sans-serif; margin: 0; padding: 24px; background: #f9fafb; color: #111827; }
    header { margin-bottom: 24px; }
    h1 { margin: 0 0 4px; font-size: 24px; }
    .description { color: #6b7280; margin: 0; }
    main { background: white; border-radius: 8px; padding: 24px; box-shadow: 0 1px 3px rgba(0,0,0,0.08); overflow: auto; }
    svg { display: block; max-width: 100%; height: auto; }
  `;
}

function escapeHtml(s: string): string {
  return s
    .replace(/&/g, "&amp;")
    .replace(/</g, "&lt;")
    .replace(/>/g, "&gt;")
    .replace(/"/g, "&quot;")
    .replace(/'/g, "&#39;");
}
