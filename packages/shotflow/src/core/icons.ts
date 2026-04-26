interface IconDef {
  body: string;
  viewBox: string;
}

const VB = "0 0 24 24";

export const ICONS: Record<string, IconDef> = {
  mail: {
    viewBox: VB,
    body: '<rect width="20" height="16" x="2" y="4" rx="2"/><path d="m22 7-8.991 5.727a2 2 0 0 1-2.018 0L2 7"/>',
  },
  bell: {
    viewBox: VB,
    body: '<path d="M6 8a6 6 0 0 1 12 0c0 7 3 9 3 9H3s3-2 3-9"/><path d="M10.3 21a1.94 1.94 0 0 0 3.4 0"/>',
  },
  link: {
    viewBox: VB,
    body: '<path d="M10 13a5 5 0 0 0 7.54.54l3-3a5 5 0 0 0-7.07-7.07l-1.72 1.71"/><path d="M14 11a5 5 0 0 0-7.54-.54l-3 3a5 5 0 0 0 7.07 7.07l1.71-1.71"/>',
  },
  "external-link": {
    viewBox: VB,
    body: '<path d="M15 3h6v6"/><path d="M10 14 21 3"/><path d="M18 13v6a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2V8a2 2 0 0 1 2-2h6"/>',
  },
  lock: {
    viewBox: VB,
    body: '<rect width="18" height="11" x="3" y="11" rx="2" ry="2"/><path d="M7 11V7a5 5 0 0 1 10 0v4"/>',
  },
  user: {
    viewBox: VB,
    body: '<path d="M19 21v-2a4 4 0 0 0-4-4H9a4 4 0 0 0-4 4v2"/><circle cx="12" cy="7" r="4"/>',
  },
  check: {
    viewBox: VB,
    body: '<path d="M20 6 9 17l-5-5"/>',
  },
  x: {
    viewBox: VB,
    body: '<path d="M18 6 6 18"/><path d="m6 6 12 12"/>',
  },
  "arrow-right": {
    viewBox: VB,
    body: '<path d="M5 12h14"/><path d="m12 5 7 7-7 7"/>',
  },
  database: {
    viewBox: VB,
    body: '<ellipse cx="12" cy="5" rx="9" ry="3"/><path d="M3 5v14a9 3 0 0 0 18 0V5"/><path d="M3 12a9 3 0 0 0 18 0"/>',
  },
  file: {
    viewBox: VB,
    body: '<path d="M14.5 2H6a2 2 0 0 0-2 2v16a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V7.5L14.5 2z"/><polyline points="14 2 14 8 20 8"/>',
  },
  send: {
    viewBox: VB,
    body: '<path d="m22 2-7 20-4-9-9-4Z"/><path d="M22 2 11 13"/>',
  },
};

export function hasIcon(name: string): boolean {
  return name in ICONS;
}

export function renderIconSvg(
  name: string,
  x: number,
  y: number,
  size: number,
  color: string,
): string {
  const icon = ICONS[name];
  if (!icon) return "";
  return `<svg x="${x}" y="${y}" width="${size}" height="${size}" viewBox="${icon.viewBox}" fill="none" stroke="${color}" stroke-width="2" stroke-linecap="round" stroke-linejoin="round">${icon.body}</svg>`;
}

export function listIconNames(): string[] {
  return Object.keys(ICONS);
}
