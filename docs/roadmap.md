# Roadmap

shotflow のバージョンごとの機能計画。

最終更新: 2026-04-26

---

## v0.1.0 — MVP

最小機能でリリースし、業務でドッグフードする。

### 機能

- [ ] YAML 読み込み・バリデーション（zod）
- [ ] 画像のリサイズ（sharp、サムネ 600px + 原寸 2000px、WebP 80%）
- [ ] 画像の base64 埋め込み
- [ ] グループ分け配置（horizontal / vertical）
- [ ] グループ内 dagre 自動レイアウト
- [ ] 基本矢印描画（実線、`type: default`）
- [ ] モーダル矢印描画（点線、`type: modal`）
- [ ] 矢印ラベル
- [ ] 単一 HTML 出力
- [ ] パン・ズーム（svg-pan-zoom or Panzoom.js）
- [ ] クリックで lightbox ポップアップ拡大
- [ ] CLI: `shotflow build flow.yaml -o output.html`
- [ ] CLI フラグ: `--thumbnail-width`, `--original-width`, `--quality`, `--no-original`, `--format`
- [ ] core 関数を export（`build`, `parseConfig`, `render`, `buildFromObject`）

### 範囲外（v0.1 では入れない）

- email type 矢印（v0.2）
- アイコンライブラリ統合（v0.2 で email + lucide）
- グループ別カラーリング（v0.2）
- `shotflow init`（v0.3）
- `shotflow dev`（v0.3）
- TS 設定ファイル（v0.3）
- 画面上編集機能（v0.4〜v0.5）

---

## v0.2.0 — 業務文書機能拡張

業務利用でフィードバックを反映し、表現力を上げる。

### 機能

- [x] `type: email` 矢印（破線 + cyan + ✉ アイコン）
- [x] Lucide アイコンを矢印ラベルに表示（curated 12 種をインライン同梱）
- [x] グループ別カラーリングの強化（背景色、ラベル装飾、左サイドアクセント）
- [x] 凡例（legend）の自動生成（HTML パネル、トグル可）
- [x] `screen.position: { x, y }` による手動座標オーバーライド

---

## v0.3.0 — DX 強化

開発者体験を向上させる。

### 機能

- [x] `shotflow init` でテンプレ生成 (main 先行実装、未タグ)
- [ ] `shotflow dev` でファイル監視 + ライブリロード
- [ ] `shotflow.config.ts` サポート（`defineConfig` ヘルパー）
- [ ] 設定ファイル探索ルール（`.ts > .mts > .js > .yaml > flow.yaml`）
- [ ] `arrowStyles` でカスタム矢印スタイル定義
- [ ] Iconify 統合（`icon: "phosphor:bell-ringing"` 形式）
- [ ] ダークモード対応
- [ ] 印刷用 CSS

---

## v0.4.0 — 編集機能（dev モード）

`shotflow dev` 上で位置微調整して YAML に書き戻し。

### 機能

- [ ] dev モードでノードをドラッグして位置調整
- [ ] WebSocket で変更を YAML に書き戻し（コメント保持）
- [ ] 矢印経路の手動調整
- [ ] Undo / Redo

---

## v0.5.0 — 編集機能（静的 HTML）

出力 HTML 単体でも編集可能に。

### 機能

- [ ] 出力 HTML に `?edit=1` で編集モード
- [ ] localStorage に編集結果を保存
- [ ] YAML ダウンロードボタン

---

## v1.0.0 — 安定版

API ロック。プロダクション利用可能を宣言。

### 機能

- [ ] 自動レイアウトの改善（dagre のチューニング、グループ間衝突回避）
- [ ] PDF 出力サポート
- [ ] ドキュメントサイト（Astro 想定）
- [ ] サンプルギャラリー
- [ ] パブリック API のロック（experimental 解除）
- [ ] 英訳ドキュメント完備

---

## 開発スケジュール（目安）

| 期間 | マイルストーン |
|------|------------|
| Week 1 | プロジェクト雛形 + プロトタイプ（最小 YAML → HTML が動く） |
| Week 2-3 | v0.1.0 MVP 実装 |
| Week 4 | 業務投入 + フィードバック収集 |
| Week 5-6 | v0.2.0 機能追加 |
| Week 7-8 | v0.3.0 + ドキュメント整備 + npm 公開 + 軽い告知 |
