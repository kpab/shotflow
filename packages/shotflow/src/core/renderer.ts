import { readFile } from "node:fs/promises";
import { createRequire } from "node:module";
import type { Config } from "./schema.js";
import {
  computeLayout,
  type Layout,
  type LayoutEdge,
  type LayoutGroup,
  type LayoutNode,
} from "./layout.js";
import { embedImagePair, type ImageFormat } from "../utils/image.js";
import { hasIcon, renderIconSvg } from "./icons.js";

const require = createRequire(import.meta.url);

const SVG_PADDING = 60;

export interface RenderOptions {
  baseDir: string;
  thumbnailWidth?: number;
  originalWidth?: number;
  quality?: number;
  format?: ImageFormat;
  embedOriginal?: boolean;
}

export async function render(
  config: Config,
  options: RenderOptions,
): Promise<string> {
  const format = options.format ?? config.image.format;
  const quality = options.quality ?? config.image.quality;
  const thumbnailWidth = options.thumbnailWidth ?? config.image.thumbnail_width;
  const originalWidth = options.originalWidth ?? config.image.original_width;
  const embedOriginal = options.embedOriginal !== false;

  const thumbOpts = { thumbnailWidth, quality, format };
  const originalOpts = embedOriginal
    ? {
        thumbnailWidth: originalWidth,
        quality: Math.min(quality + 10, 100),
        format,
      }
    : null;

  const screens = Object.values(config.groups).flatMap((g) => g.screens);
  const imageEntries = await Promise.all(
    screens.map(async (s) => {
      const pair = await embedImagePair(
        s.image,
        options.baseDir,
        thumbOpts,
        originalOpts,
      );
      return [s.id, pair] as const;
    }),
  );
  const imagesByScreen = new Map(imageEntries);

  const originals: Record<string, string> = {};
  for (const [id, { original }] of imagesByScreen.entries()) {
    if (original) originals[id] = original;
  }

  const layout = computeLayout(config);
  const W = layout.width + SVG_PADDING * 2;
  const H = layout.height + SVG_PADDING * 2;

  const svgPanZoomScript = await readFile(
    require.resolve("svg-pan-zoom"),
    "utf-8",
  );

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
<div class="diagram-container">
${renderLegend(layout)}
<svg id="diagram" viewBox="0 0 ${W} ${H}" width="100%" height="100%" xmlns="http://www.w3.org/2000/svg">
<defs>
  <marker id="arrow-default" viewBox="0 0 10 10" refX="9" refY="5" markerWidth="8" markerHeight="8" orient="auto-start-reverse">
    <path d="M0,0 L10,5 L0,10 Z" fill="#374151"/>
  </marker>
  <marker id="arrow-modal" viewBox="0 0 10 10" refX="9" refY="5" markerWidth="6" markerHeight="6" orient="auto-start-reverse">
    <path d="M0,0 L10,5 L0,10 Z" fill="#6b7280" fill-opacity="0.6"/>
  </marker>
  <marker id="arrow-email" viewBox="0 0 10 10" refX="9" refY="5" markerWidth="8" markerHeight="8" orient="auto-start-reverse">
    <path d="M0,0 L10,5 L0,10 Z" fill="#0ea5e9"/>
  </marker>
</defs>
<g transform="translate(${SVG_PADDING}, ${SVG_PADDING})">
${layout.groups.map(renderGroup).join("\n")}
${layout.edges.map(renderEdge).join("\n")}
${layout.nodes.map((n) => renderNode(n, imagesByScreen.get(n.id)?.thumb ?? "")).join("\n")}
</g>
</svg>
</div>
</main>
<div id="lightbox" class="lightbox" role="dialog" aria-modal="true" aria-hidden="true">
  <button class="lightbox-close" aria-label="Close">&times;</button>
  <img class="lightbox-img" alt="">
</div>
<script>${svgPanZoomScript}</script>
<script>window.SHOTFLOW_ORIGINALS=${jsonInScript(originals)};
${runtimeScript()}
</script>
</body>
</html>`;
}

function renderLegend(layout: Layout): string {
  const usedTypes = new Set<LayoutEdge["type"]>();
  for (const e of layout.edges) usedTypes.add(e.type);

  const groupRows = layout.groups
    .map(
      (g) =>
        `<li><span class="legend-swatch" style="background:${g.color}"></span><span>${escapeHtml(g.label)}</span></li>`,
    )
    .join("");

  const transitionDefs: { type: LayoutEdge["type"]; label: string }[] = [
    { type: "default", label: "通常" },
    { type: "modal", label: "モーダル" },
    { type: "email", label: "メール" },
  ];
  const transitionRows = transitionDefs
    .filter((t) => usedTypes.has(t.type))
    .map((t) => {
      const { stroke, dash } = edgeStyle(t.type);
      const dashAttr = dash || "";
      const iconHtml =
        t.type === "email"
          ? `<svg class="legend-icon" viewBox="0 0 24 24" fill="none" stroke="${stroke}" stroke-width="2" stroke-linecap="round" stroke-linejoin="round" width="12" height="12"><rect width="20" height="16" x="2" y="4" rx="2"/><path d="m22 7-8.991 5.727a2 2 0 0 1-2.018 0L2 7"/></svg>`
          : "";
      return `<li><svg class="legend-line" viewBox="0 0 32 8" width="32" height="8"><line x1="1" y1="4" x2="31" y2="4" stroke="${stroke}" stroke-width="2"${dashAttr}/></svg>${iconHtml}<span>${t.label}</span></li>`;
    })
    .join("");

  if (groupRows.length === 0 && transitionRows.length === 0) return "";

  return `<aside class="legend" data-collapsed="false">
  <button class="legend-toggle" aria-label="Toggle legend" type="button">×</button>
  ${layout.groups.length > 0 ? `<section><h3>グループ</h3><ul>${groupRows}</ul></section>` : ""}
  ${transitionRows ? `<section><h3>遷移タイプ</h3><ul>${transitionRows}</ul></section>` : ""}
</aside>`;
}

function renderGroup(group: LayoutGroup): string {
  const labelW = group.label.length * 15 + 24;
  const labelH = 26;
  const labelY = group.y - labelH - 6;
  return `<g class="group" data-group-id="${escapeHtml(group.id)}">
  <rect x="${group.x}" y="${group.y}" width="${group.width}" height="${group.height}" fill="${group.color}" fill-opacity="0.07" stroke="${group.color}" stroke-opacity="0.55" stroke-width="1.5" rx="10"/>
  <rect x="${group.x}" y="${group.y}" width="4" height="${group.height}" fill="${group.color}" rx="2"/>
  <rect x="${group.x}" y="${labelY}" rx="4" ry="4" width="${labelW}" height="${labelH}" fill="${group.color}"/>
  <text x="${group.x + 12}" y="${labelY + 18}" fill="#fff" font-size="13" font-weight="700" letter-spacing="0.3">${escapeHtml(group.label)}</text>
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

function edgeStyle(type: LayoutEdge["type"]): {
  stroke: string;
  opacity: string;
  dash: string;
  marker: string;
} {
  if (type === "email") {
    return {
      stroke: "#0ea5e9",
      opacity: "1",
      dash: ` stroke-dasharray="10 5"`,
      marker: "url(#arrow-email)",
    };
  }
  if (type === "modal") {
    return {
      stroke: "#6b7280",
      opacity: "0.6",
      dash: ` stroke-dasharray="5 4"`,
      marker: "url(#arrow-modal)",
    };
  }
  return {
    stroke: "#374151",
    opacity: "1",
    dash: "",
    marker: "url(#arrow-default)",
  };
}

function renderEdge(edge: LayoutEdge): string {
  if (edge.points.length < 2) return "";
  const { stroke, opacity, dash, marker } = edgeStyle(edge.type);

  const d = edge.points
    .map((p, i) => `${i === 0 ? "M" : "L"} ${p.x.toFixed(2)} ${p.y.toFixed(2)}`)
    .join(" ");

  const explicitIcon = edge.icon && hasIcon(edge.icon) ? edge.icon : undefined;
  const iconName =
    explicitIcon ?? (edge.type === "email" ? "mail" : undefined);

  let labelEl = "";
  if (edge.label || iconName) {
    const mid = edge.points[Math.floor(edge.points.length / 2)];
    if (mid) {
      const iconSize = 12;
      const padX = 6;
      const labelText = edge.label ?? "";
      const textW = labelText.length * 11;
      const iconGap = iconName && labelText ? 4 : 0;
      const innerW = (iconName ? iconSize : 0) + iconGap + textW;
      const labelW = innerW + padX * 2;
      const rectX = mid.x - labelW / 2;
      const rectY = mid.y - 9;

      const iconColor = stroke;
      const iconX = rectX + padX;
      const iconY = rectY + (16 - iconSize) / 2;
      const iconEl = iconName
        ? renderIconSvg(iconName, iconX, iconY, iconSize, iconColor)
        : "";

      const textCenterX = iconName
        ? rectX + padX + iconSize + iconGap + textW / 2
        : mid.x;
      const textEl = labelText
        ? `<text x="${textCenterX}" y="${mid.y + 3}" text-anchor="middle" font-size="11" fill="#4b5563">${escapeHtml(labelText)}</text>`
        : "";

      labelEl = `<g class="edge-label">
  <rect x="${rectX}" y="${rectY}" width="${labelW}" height="16" fill="white" fill-opacity="0.92" rx="2"/>
  ${iconEl}
  ${textEl}
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
    header { margin-bottom: 16px; }
    h1 { margin: 0 0 4px; font-size: 22px; }
    .description { color: #6b7280; margin: 0; font-size: 14px; }
    main { padding: 0; }
    .diagram-container { position: relative; width: 100%; height: calc(100vh - 140px); min-height: 480px; border: 1px solid #e5e7eb; border-radius: 8px; background: white; overflow: hidden; }
    .diagram-container svg#diagram { display: block; width: 100%; height: 100%; }
    .legend { position: absolute; top: 12px; right: 12px; z-index: 10; background: rgba(255,255,255,0.96); border: 1px solid #e5e7eb; border-radius: 8px; padding: 12px 14px; box-shadow: 0 2px 8px rgba(0,0,0,0.06); font-size: 12px; max-width: 220px; }
    .legend[data-collapsed="true"] section { display: none; }
    .legend[data-collapsed="true"] { padding: 6px 8px; }
    .legend[data-collapsed="true"] .legend-toggle::before { content: "≡"; }
    .legend[data-collapsed="true"] .legend-toggle { position: static; }
    .legend section + section { margin-top: 10px; }
    .legend h3 { margin: 0 0 6px; font-size: 11px; font-weight: 600; color: #6b7280; text-transform: uppercase; letter-spacing: 0.05em; }
    .legend ul { list-style: none; margin: 0; padding: 0; }
    .legend li { display: flex; align-items: center; gap: 8px; padding: 3px 0; color: #374151; }
    .legend-swatch { display: inline-block; width: 14px; height: 14px; border-radius: 3px; flex-shrink: 0; }
    .legend-line { flex-shrink: 0; }
    .legend-icon { flex-shrink: 0; }
    .legend-toggle { position: absolute; top: 4px; right: 6px; background: transparent; border: 0; font-size: 16px; line-height: 1; color: #9ca3af; cursor: pointer; padding: 2px 6px; }
    .legend-toggle:hover { color: #111827; }
    .legend-toggle::before { content: ""; }
    .screen { cursor: pointer; }
    .screen:hover > rect:first-child { stroke: #2563eb; stroke-width: 1.5; }
    .lightbox { display: none; position: fixed; inset: 0; background: rgba(0,0,0,0.85); z-index: 1000; align-items: center; justify-content: center; padding: 24px; }
    .lightbox.open { display: flex; }
    .lightbox-img { max-width: 90vw; max-height: 90vh; object-fit: contain; box-shadow: 0 20px 60px rgba(0,0,0,0.5); }
    .lightbox-close { position: absolute; top: 16px; right: 16px; background: white; border: 0; width: 36px; height: 36px; border-radius: 50%; font-size: 22px; cursor: pointer; line-height: 1; display: flex; align-items: center; justify-content: center; }
    .lightbox-close:hover { background: #f3f4f6; }
  `;
}

function jsonInScript(obj: unknown): string {
  return JSON.stringify(obj).replace(/</g, "\\u003c");
}

function runtimeScript(): string {
  return `
(function () {
  if (typeof svgPanZoom !== 'undefined') {
    var svg = document.getElementById('diagram');
    if (svg) {
      svgPanZoom(svg, { zoomEnabled: true, controlIconsEnabled: true, fit: true, center: true, minZoom: 0.2, maxZoom: 5 });
    }
  }
  var lightbox = document.getElementById('lightbox');
  var lightboxImg = lightbox.querySelector('.lightbox-img');
  var lightboxClose = lightbox.querySelector('.lightbox-close');
  function openLightbox(src) { lightboxImg.src = src; lightbox.classList.add('open'); lightbox.setAttribute('aria-hidden', 'false'); }
  function closeLightbox() { lightbox.classList.remove('open'); lightboxImg.src = ''; lightbox.setAttribute('aria-hidden', 'true'); }
  document.querySelectorAll('.screen').forEach(function (el) {
    el.addEventListener('click', function (e) {
      e.stopPropagation();
      var id = el.dataset.screenId;
      var src = (window.SHOTFLOW_ORIGINALS || {})[id];
      if (src) openLightbox(src);
    });
  });
  lightbox.addEventListener('click', function (e) {
    if (e.target === lightbox || e.target === lightboxClose) closeLightbox();
  });
  document.addEventListener('keydown', function (e) { if (e.key === 'Escape') closeLightbox(); });
  var legend = document.querySelector('.legend');
  var legendToggle = legend && legend.querySelector('.legend-toggle');
  if (legendToggle) {
    legendToggle.addEventListener('click', function () {
      var collapsed = legend.getAttribute('data-collapsed') === 'true';
      legend.setAttribute('data-collapsed', collapsed ? 'false' : 'true');
    });
  }
})();
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
