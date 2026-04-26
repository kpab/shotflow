# CLAUDE.md

このファイルは Claude Code がこのリポジトリで作業するときの指針です。

## プロジェクト概要

**shotflow** — スクリーンショットと YAML から、ブラウザで動く単一 HTML の画面遷移図を生成する CLI ツール。

業務システムの仕様書、レガシーシステムのドキュメント整備、社内向け画面遷移説明資料を主用途とする。

詳細なコンセプトは `README.ja.md` を参照。

## ターゲットユーザー

- 業務システムの仕様書を作るエンジニア
- 既存システムをドキュメント化したい人
- B2B SaaS の社内ドキュメント担当
- スクショベースで画面遷移を説明したい PM/デザイナー

## 技術スタック

- **言語**: TypeScript (strict)
- **ランタイム**: Node.js 22+
- **モジュール**: ESM のみ（CJS 非対応）
- **パッケージ管理**: pnpm workspace（モノレポ構成）
- **ビルド**: tsup
- **テスト**: vitest
- **CLI**: commander or cac（実装時に最終選定）
- **スキーマ**: zod
- **YAML**: `yaml`（eemeli 製、コメント保持対応 / `js-yaml` ではない理由は v0.4 の編集機能でコメント保持が必要なため）
- **画像処理**: sharp
- **レイアウト**: dagre
- **アイコン**: lucide（v0.3 で iconify 拡張）
- **パンズーム**: svg-pan-zoom or Panzoom.js（実装時に最終選定）

## ディレクトリ構成（予定）

```
shotflow/
├── packages/
│   └── shotflow/             # メインパッケージ（npm: shotflow）
│       ├── src/
│       │   ├── cli.ts        # CLI エントリポイント
│       │   ├── index.ts      # ライブラリ用エントリ（core export）
│       │   ├── commands/
│       │   │   ├── build.ts
│       │   │   ├── dev.ts
│       │   │   └── init.ts
│       │   ├── core/
│       │   │   ├── parser.ts # YAML → 内部モデル
│       │   │   ├── schema.ts # zod スキーマ
│       │   │   ├── layout.ts # dagre による自動レイアウト
│       │   │   └── renderer.ts # HTML 生成
│       │   ├── templates/
│       │   │   ├── base.html
│       │   │   ├── styles.css
│       │   │   └── runtime.ts # クライアントサイド JS（パンズーム + lightbox）
│       │   └── utils/
│       │       └── image.ts  # sharp によるリサイズ・WebP 変換・base64 化
│       ├── tests/
│       ├── package.json
│       └── tsconfig.json
├── examples/                 # サンプル YAML + ダミー画像
├── docs/                     # 設計ドキュメント
│   ├── design-decisions.md
│   ├── roadmap.md
│   └── spec.md
├── README.md                 # 英語
├── README.ja.md              # 日本語
├── LICENSE                   # MIT
├── pnpm-workspace.yaml
└── package.json              # workspace root
```

## コーディング規約

- TypeScript strict、ESM のみ
- コメントは原則書かない（WHY が非自明な場合のみ最小限・1 行）
- 関数名・変数名で意図を表現する
- パブリック API は v1.0 まで experimental（破壊的変更あり）と明記
- zod スキーマの変更は破壊的変更扱い、CHANGELOG.md に必ず記載

## 開発フロー

1. 設計判断は `docs/design-decisions.md` に追記してから実装
2. zod スキーマの変更は spec.md と同期
3. 実装完了後は examples/ を更新して動作確認
4. CHANGELOG.md にユーザー影響をまとめる

## 禁止コマンド（ユーザー個人ルール）

明示指示がない限り以下を **絶対に実行しない**：

- `pnpm test`, `pnpm build`, `pnpm dev`, `pnpm lint`
- `npm test`, `npm run build`, `npm run dev`
- `vitest`, `tsup`
- フォーマット書き換え系（`prettier --write` 等）

許可されるコマンド：
- `git status`, `git log`, `git diff`
- `ls`, `cat`, `grep`, `find`
- `pnpm install`, `npm install`（依存追加時のみ、ユーザー確認のうえ）
- `node --version`, `pnpm --version`（環境確認）

違反した場合は即座に謝罪し、再発防止を約束する。

## Git コミットメッセージ

- **`Co-Authored-By: Claude` トレーラーは付けない**（ユーザー個人ルール）
- 件名 50 字以内、本文との間に空行
- conventional commits 風プレフィックス推奨：`feat:`, `fix:`, `docs:`, `refactor:`, `chore:`, `test:`
- 件名は英語・日本語どちらでも可

## 言語ルール

- ユーザーへのレスポンスは **日本語**
- README は **日英並記**（`README.md` / `README.ja.md`）
- 設計ドキュメント（`docs/`）は **日本語ベース**、英訳は v0.2 以降に検討
- コード内識別子・コメントは **英語**

## 設計判断の参照先

新しい設計判断をするときは必ず以下を参照する：

- `docs/design-decisions.md` — 論点1〜9 の決定事項とその根拠
- `docs/roadmap.md` — バージョンごとの機能計画
- `docs/spec.md` — YAML スキーマ仕様（v0.1 時点）

決定事項を変更する場合は、design-decisions.md に追記して履歴を残す。
