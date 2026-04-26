# shotflow

> Generate a single self-contained HTML flow diagram from screenshots and a YAML config.

**Status**: 🚧 WIP — pre-release. APIs and config schema may change without notice.

[日本語 README](./README.ja.md)

## Concept

`shotflow` turns a folder of screenshots + a YAML config into a single self-contained HTML file with:

- Pan / zoom navigation
- Click-to-zoom popup for full-resolution screenshots
- Color-coded groups (admin / user / mobile, etc.)
- Styled transition arrows (default, modal, email, ...)

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

## Quickstart (planned)

```bash
npx shotflow init                          # create starter flow.yaml
npx shotflow build flow.yaml -o out.html   # build single HTML
npx shotflow dev   flow.yaml               # live-reload dev server
```

## Roadmap

See [docs/roadmap.md](./docs/roadmap.md).

## License

MIT © 2026 [p4ni](https://p4ni.com)
