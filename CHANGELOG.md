# Changelog

このプロジェクトの変更履歴。フォーマットは [Keep a Changelog](https://keepachangelog.com/ja/1.1.0/) に準拠し、
バージョンは [Semantic Versioning](https://semver.org/lang/ja/) に従う。

パブリック API は v1.0 まで **experimental** であり、マイナーリリースで破壊的変更が入ることがある。

## [Unreleased]

### Added
- `shotflow init [dir]` コマンド (v0.3 機能の先行実装)
  - `flow.yaml` テンプレートと `images/` ディレクトリを生成
  - `--force` フラグで既存 `flow.yaml` 上書き対応
  - パブリック API: `init({ dir, force })` を export

### Fixed
- `VERSION` 定数を `package.json` の `version` と同期 (`0.0.0` → `0.2.0`)

## [0.2.0] — 2026-04-26

### Added
- `transitions[].type: "email"` を追加。長破線 + cyan (#0ea5e9) + ✉ アイコンで描画される。
- `transitions[].icon` を追加。Lucide 互換のアイコンをラベル横に表示できる。
  v0.2 baseline catalog: `mail`, `bell`, `link`, `external-link`, `lock`, `user`, `check`, `x`,
  `arrow-right`, `database`, `file`, `send`。未知のアイコン名は無視される。
- `screens[].position: { x, y }` を追加。dagre 自動配置を上書きする手動座標。
  オーバーライドが存在する場合、グループ bbox とエッジ端点を再計算する。
- 凡例（legend）の自動生成。HTML パネルとして diagram-container 右上に表示、トグルで折りたたみ可能。
- グループのビジュアル強化（左サイドアクセントバー、太枠、大きめラベル）。

### Changed
- `transitions[].type` の zod enum に `"email"` が追加された。既存設定は影響なし。
- レイアウト計算で `screen.position` が指定されたノードがある場合、そのグループの bbox とそのノードに接続するエッジが再計算される。
- ドキュメント (`docs/spec.md` / `README.md` / `README.ja.md`) を v0.2 に更新。

### Notes
- アイコンは外部依存ではなく `packages/shotflow/src/core/icons.ts` にインライン同梱。
  v0.3 で Iconify 統合（`set:name` prefix 形式）に拡張予定。詳細は `docs/design-decisions.md` 論点10。
- ユニットテストを 24 → 36 件に拡充（schema 6 / layout 3 / icons 4 件追加）。

## [0.1.0] — 2026-04-26

### Added
- 初回 MVP リリース。スクショ + YAML から単一 HTML 画面遷移図を生成する CLI。
- YAML 読み込み + zod バリデーション、duplicate id / unknown reference の検出。
- dagre 自動レイアウト（compound graph、グループ分け、horizontal / vertical）。
- sharp による画像リサイズ・WebP 変換・base64 埋め込み（サムネ + 原寸の 2 段階）。
- SVG 描画、svg-pan-zoom 統合、原寸 lightbox（クリックで拡大）。
- 矢印タイプ: `default`（実線）、`modal`（短破線 + 半透明）。
- screen タイプ: `default`、`modal`（点線枠 + やや小さい）。
- CLI: `shotflow build <config> -o <output>` と `--thumbnail-width`, `--original-width`,
  `--quality`, `--format`, `--no-original` フラグ。
- パブリック API: `build`, `parseConfig`, `render`, `buildFromObject`。
- ユニットテスト 24 件（schema / parser / layout）。

[Unreleased]: https://github.com/kpab/shotflow/compare/v0.2.0...HEAD
[0.2.0]: https://github.com/kpab/shotflow/compare/v0.1.0...v0.2.0
[0.1.0]: https://github.com/kpab/shotflow/releases/tag/v0.1.0
