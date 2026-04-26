# shotflow

> スクリーンショットと YAML から、単一 HTML ファイルの画面遷移図を生成する CLI。

**ステータス**: 🚧 WIP — リリース前。API・設定スキーマは予告なく変更されることがあります。

[English README](./README.md)

## コンセプト

`shotflow` は「スクリーンショットのフォルダ + YAML 設定」を、以下を備えた**単一 HTML ファイル**に変換します：

- パン / ズームによる俯瞰・詳細閲覧
- クリックで原寸ポップアップ拡大
- グループ別の色分け（管理側 / ユーザー側 / モバイルなど）
- 矢印の種類分け（通常 / モーダル / メール経由）
- ラベルに Lucide アイコンを埋め込み（mail / lock / bell など）
- 凡例（legend）パネルの自動生成
- `screen.position` で個別ノードの手動座標調整

特に **既存の業務システム**を「画面同士がどう繋がっているか視覚的にドキュメント化」する用途に最適化されています。

## 既存ツールとの差別化

| ツール | 弱点 |
|------|------|
| draw.io | 高機能すぎ、画像配置が手動でだるい |
| Mermaid | 画像ノード対応が貧弱 |
| Figma | アカウント必要、重い、スクリプト連携しにくい |
| Excalidraw | 手書き風で業務文書には軽すぎる |
| Whimsical | 有料、SaaS依存 |

`shotflow` は「画像 + YAML → 単一 HTML」というニッチに振り切ります。

## クイックスタート（v0.2）

```bash
npm install shotflow                                # まだ npm 未公開
shotflow init my-flow                               # テンプレートを生成
cd my-flow && shotflow build flow.yaml -o out.html  # 単一 HTML をビルド
```

`shotflow init` は最小構成の `flow.yaml` と `images/` ディレクトリを生成します。
画像を `images/` に置いて、`flow.yaml` を編集すれば即動かせます。

CLI フラグ：

```
-o, --output <path>          出力パス（デフォルト: ./flow.html）
    --thumbnail-width <n>    サムネ最大幅 px（デフォルト: 600）
    --original-width <n>     原寸最大幅 px（デフォルト: 2000）
    --quality <n>            画質 1〜100（デフォルト: 80）
    --format <fmt>           webp | jpeg | png（デフォルト: webp）
    --no-original            原寸埋め込みをスキップ（lightbox 無効・出力軽量化）
```

## サンプル YAML

```yaml
title: 受注システム 画面遷移図

groups:
  admin:
    label: 管理側
    color: "#2563eb"
    screens:
      - id: admin_login
        name: ログイン
        image: ./images/admin/login.png
      - id: admin_dashboard
        name: ダッシュボード
        image: ./images/admin/dashboard.png

transitions:
  - from: admin_login
    to: admin_dashboard
    label: ログイン
    icon: lock          # Lucide アイコンをラベル横に表示（v0.2+）
  - from: admin_dashboard
    to: buyer_login
    label: 招待メール送信
    type: email         # 破線 + cyan + ✉ アイコン（v0.2+）
```

完全なサンプルは [`examples/flow.yaml`](./examples/flow.yaml)、フルスキーマは [`docs/spec.md`](./docs/spec.md) を参照。

## プログラマティック API

```ts
import { build, parseConfig, render } from "shotflow";

await build({
  configPath: "./flow.yaml",
  outputPath: "./out.html",
  options: { quality: 80 },
});

// 低レベル API
const config = await parseConfig("./flow.yaml");
const html = await render(config, { baseDir: "./" });
```

> パブリック API は v1.0 まで **experimental**。マイナーリリースで破壊的変更が入ることがあります。

## ロードマップ

[docs/roadmap.md](./docs/roadmap.md) を参照。v0.2 の表現力強化機能を完了。`init` / `dev` は v0.3 で追加予定。

## ライセンス

MIT © 2026 kpab
