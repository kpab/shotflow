# shotflow

> Generate a single self-contained HTML flow diagram from screenshots and a YAML config.

**Status**: 🚧 WIP — pre-release. APIs and config schema may change without notice.

[日本語 README](./README.ja.md)

## Concept

`shotflow` turns a folder of screenshots + a YAML config into a single self-contained HTML file with:

- Pan / zoom navigation
- Click-to-zoom popup for full-resolution screenshots
- Color-coded groups (admin / user / mobile, etc.)
- Styled transition arrows (default, modal, email)
- Lucide icons embedded in arrow labels (mail / lock / bell, ...)
- Auto-generated legend panel
- Per-node manual coordinate override via `screen.position`

It's optimized for documenting **existing business systems** — where you want a real visual map of how screens connect, not abstract boxes.

## Why not draw.io / Mermaid / Figma?

| Tool | Weakness |
|------|----------|
| draw.io | Manual placement of every screenshot is tedious |
| Mermaid | Image node support is poor |
| Figma | Account required, heavy, not script-friendly |
| Excalidraw | Hand-drawn style is too informal for business docs |
| Whimsical | Paid, SaaS-locked |

`shotflow` specializes in **screenshot-based screen transition diagrams** as a single shippable HTML.

## Quickstart (v0.2)

```bash
npm install shotflow                                # not yet published
shotflow build flow.yaml -o out.html                # build single HTML
```

CLI flags:

```
-o, --output <path>          Output HTML path (default: ./flow.html)
    --thumbnail-width <n>    Thumbnail max width in px (default: 600)
    --original-width <n>     Original image max width in px (default: 2000)
    --quality <n>            Image quality 1-100 (default: 80)
    --format <fmt>           webp | jpeg | png (default: webp)
    --no-original            Skip embedding originals (no lightbox, smaller HTML)
```

## Sample YAML

```yaml
title: Order System Flow

groups:
  admin:
    label: Admin
    color: "#2563eb"
    screens:
      - id: admin_login
        name: Login
        image: ./images/admin/login.png
      - id: admin_dashboard
        name: Dashboard
        image: ./images/admin/dashboard.png

transitions:
  - from: admin_login
    to: admin_dashboard
    label: sign in
    icon: lock          # Lucide icon next to label (v0.2+)
  - from: admin_dashboard
    to: buyer_login
    label: invite email
    type: email         # dashed + cyan + ✉ icon (v0.2+)
```

See [`examples/flow.yaml`](./examples/flow.yaml) for a fuller sample, and [`docs/spec.md`](./docs/spec.md) for the full schema.

## Programmatic API

```ts
import { build, parseConfig, render } from "shotflow";

await build({
  configPath: "./flow.yaml",
  outputPath: "./out.html",
  options: { quality: 80 },
});

// Or low-level
const config = await parseConfig("./flow.yaml");
const html = await render(config, { baseDir: "./" });
```

> Public API is **experimental** until v1.0. Breaking changes may land in any minor release.

## Roadmap

See [docs/roadmap.md](./docs/roadmap.md). v0.2 expressivity features shipped; `init` and `dev` come in v0.3.

## License

MIT © 2026 kpab
