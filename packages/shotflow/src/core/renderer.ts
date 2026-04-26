import type { Config, Group, Screen, Transition } from "./schema.js";

export function render(config: Config): string {
  const direction = config.layout.direction;
  const groupOrder = config.layout.groups ?? Object.keys(config.groups);

  const groupsHtml = groupOrder
    .map((id) => {
      const group = config.groups[id];
      if (!group) return "";
      return renderGroup(id, group);
    })
    .join("");

  const transitionsHtml = config.transitions
    .map((t) => renderTransition(t))
    .join("");

  return `<!DOCTYPE html>
<html lang="ja">
<head>
<meta charset="UTF-8">
<title>${escapeHtml(config.title)}</title>
<style>${baseStyles()}</style>
</head>
<body>
<header>
  <h1>${escapeHtml(config.title)}</h1>
  ${config.description ? `<p class="description">${escapeHtml(config.description)}</p>` : ""}
</header>
<main class="groups ${direction}">${groupsHtml}</main>
${
  config.transitions.length
    ? `<section class="transitions"><h2>Transitions</h2>${transitionsHtml}</section>`
    : ""
}
</body>
</html>`;
}

function renderGroup(id: string, group: Group): string {
  const color = group.color ?? "#6b7280";
  const screens = group.screens.map((s) => renderScreen(s)).join("");
  return `<div class="group" data-group-id="${escapeHtml(id)}">
  <div class="group-label" style="background-color:${escapeHtml(color)}">${escapeHtml(group.label)}</div>
  <div class="screens">${screens}</div>
</div>`;
}

function renderScreen(screen: Screen): string {
  return `<div class="screen ${screen.type}" data-screen-id="${escapeHtml(screen.id)}">
  <div class="screen-image-placeholder">[image]</div>
  <div class="screen-name">${escapeHtml(screen.name)}</div>
</div>`;
}

function renderTransition(t: Transition): string {
  const labelPart = t.label ? `: ${escapeHtml(t.label)}` : "";
  return `<div class="transition ${t.type}">${escapeHtml(t.from)} → ${escapeHtml(t.to)}${labelPart}</div>`;
}

function baseStyles(): string {
  return `
    * { box-sizing: border-box; }
    body { font-family: -apple-system, BlinkMacSystemFont, "Segoe UI", sans-serif; margin: 0; padding: 24px; background: #f9fafb; color: #111827; }
    header { margin-bottom: 24px; }
    h1 { margin: 0 0 4px; font-size: 24px; }
    .description { color: #6b7280; margin: 0; }
    .groups { display: flex; gap: 24px; align-items: flex-start; }
    .groups.vertical { flex-direction: column; }
    .group { background: white; border-radius: 8px; padding: 16px; min-width: 220px; box-shadow: 0 1px 3px rgba(0,0,0,0.08); }
    .group-label { font-weight: 600; padding: 4px 12px; border-radius: 4px; color: white; display: inline-block; margin-bottom: 12px; font-size: 13px; }
    .screens { display: flex; flex-direction: column; gap: 8px; }
    .screen { border: 1px solid #d1d5db; border-radius: 6px; padding: 12px; background: white; }
    .screen.modal { border-style: dashed; border-radius: 14px; background: #fafafa; }
    .screen-image-placeholder { width: 100%; height: 80px; background: #e5e7eb; border-radius: 4px; display: flex; align-items: center; justify-content: center; color: #9ca3af; font-size: 12px; margin-bottom: 8px; }
    .screen-name { font-size: 14px; font-weight: 500; }
    .transitions { margin-top: 32px; padding: 16px; background: white; border-radius: 8px; box-shadow: 0 1px 3px rgba(0,0,0,0.08); }
    .transitions h2 { font-size: 16px; margin: 0 0 8px; color: #374151; }
    .transition { font-size: 13px; color: #4b5563; padding: 4px 0; font-family: ui-monospace, monospace; }
    .transition.modal { color: #6b7280; font-style: italic; }
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
