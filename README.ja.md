# shotflow

> スクリーンショットと YAML から、単一 HTML ファイルの画面遷移図を生成する CLI。

**ステータス**: 🚧 WIP — リリース前。API・設定スキーマは予告なく変更されることがあります。

[English README](./README.md)

## コンセプト

`shotflow` は「スクリーンショットのフォルダ + YAML 設定」を、以下を備えた**単一 HTML ファイル**に変換します：

- パン / ズームによる俯瞰・詳細閲覧
- クリックで原寸ポップアップ拡大
- グループ別の色分け（管理側 / ユーザー側 / モバイルなど）
- 矢印の種類分け（通常 / モーダル / メール経由など）

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

## クイックスタート（予定）

```bash
npx shotflow init                          # スターター flow.yaml を生成
npx shotflow build flow.yaml -o out.html   # 単一 HTML をビルド
npx shotflow dev   flow.yaml               # ライブリロード dev サーバー
```

## ロードマップ

[docs/roadmap.md](./docs/roadmap.md) を参照。

## ライセンス

MIT © 2026 [p4ni](https://p4ni.com)
