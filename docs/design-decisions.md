# 設計判断の記録（Design Decisions）

このファイルは shotflow の設計上の決定事項とその根拠を記録するものです。
変更する場合は新しいエントリを追記し、過去の判断とその理由を残します。

最終更新: 2026-04-26（v0.1 設計確定時点）

---

## 論点1: レイアウトアルゴリズム

### 決定

**ハイブリッド方式（B 案）**

- グループ間配置はユーザー宣言（`layout.direction` + `layout.groups`）
- グループ内配置は dagre 自動（遷移エッジから推論）
- 個別オーバーライドは `screen.position: { x, y }` で可能（v0.2 以降）

### YAML 例

```yaml
layout:
  direction: horizontal     # or vertical
  groups: [admin, buyer]    # 並び順
  spacing:
    group: 200
    node: 80

groups:
  admin:
    label: 管理側
    color: "#2563eb"
    # グループ内レイアウトは dagre 自動（指定不要）
    screens: [...]
```

### 根拠

- `shotflow` の主用途は「業務システムの管理側 vs ユーザー側」のような **意味のある区分け** を表現すること
- 完全自動（dagre のみ）では「左 = 管理、右 = バイヤー」のような明示的意味が出ない
- 完全手動座標は画面が増えるたびに手直しが必要でツール価値が半減する
- グループ配置だけ宣言的に書ける方式が業務文書的に最も価値が出る

### サブ決定

- グループ配置方向は `horizontal | vertical` の **2 方向のみ**（v0.1）
- グループ内の折り返しは **非対応**（dagre に任せれば実質解決）

---

## 論点2: モーダル表現

### 決定

**独立ノード + `type: modal` による視覚区別**

`parent` フィールドは v0.1 では入れない（v0.2 以降に必要なら検討）。

### YAML 例

```yaml
groups:
  admin:
    screens:
      - id: admin_dashboard
        name: ダッシュボード
        image: ./images/admin/dashboard.png
      - id: invite_modal
        name: 招待モーダル
        image: ./images/admin/invite.png
        type: modal              # ノード見た目が変わる

transitions:
  - from: admin_dashboard
    to: invite_modal
    label: 招待ボタン
    type: modal                  # エッジが点線、矢じり特殊
```

### 視覚表現ルール

| 要素 | 通常画面 | モーダル |
|------|--------|--------|
| ノード枠 | 実線 | **点線** |
| ノードサイズ | 標準 | **やや小さく** |
| ノード形状 | 角丸長方形 | **より丸い角丸** |
| エッジ（→ modal） | 実線 | **点線 + 半透明** |

### 根拠

- モーダルから他画面への遷移が自然に書ける（招待モーダル → 招待メール → buyer_login など）
- transition だけで配置が決まる（dagre 任せ）、実装シンプル
- 親子方式は dagre と相性が悪く、transition と二重管理になる懸念

---

## 論点3: 矢印タイプの拡張性

### 決定

**段階拡張**：v0.1 はビルトイン固定で最小、v0.3 以降で `arrowStyles` 拡張機構を導入。

### バージョン計画

| version | サポート type | カスタム可否 | アイコンライブラリ |
|---------|------------|-----------|-----------------|
| v0.1 | `default`, `modal` | 不可 | lucide 固定 |
| v0.2 | `default`, `modal`, `email` | 不可 | lucide 固定 |
| v0.3+ | 上記 + `api`, `redirect` + ユーザー定義可能 | 可 | iconify 統合（prefix 形式） |

### 各 type の視覚仕様（v0.2 まで）

| type | 線 | 色 | 矢じり | 備考 |
|------|----|----|------|------|
| `default` | 実線 | #374151 (dark gray) | 標準 | 省略時のデフォルト |
| `modal` | 点線 | #6b7280 半透明 | 小さめ | 論点2 で確定 |
| `email` | 破線 | #0ea5e9 (cyan) | 標準 | ラベルに ✉ アイコン |

### v0.3+ のカスタム拡張 DSL（将来案）

```yaml
arrowStyles:
  webhook:
    line: dotted
    color: "#ff6b6b"
    icon: "phosphor:bell-ringing"   # iconify 形式（prefix:name）
    label_prefix: "Webhook: "

transitions:
  - from: x
    to: y
    type: webhook
```

### 根拠

- OSS 初期は「組み込みでよくあるケースをカバー」が価値、カスタマイズは pro user の要望が来てから
- アイコンライブラリは Lucide ISC が軽量で SVG を import できビルド時静的埋め込みに最適
- Iconify は強力だが依存サイズと選択肢の爆発が初期 OSS には重荷
- v0.3 で `icon: "lucide:mail"` (デフォ Lucide) → `icon: "phosphor:bell-ringing"` のように prefix 拡張すれば破壊的変更にならない

### 注意事項

- zod スキーマは v0.1 では `type: z.enum(["default", "modal"])` の literal union
- v0.3 で `type: z.union([z.enum([...builtins]), z.string()])` に拡張するときは builtins が優先解決される設計に

---

## 論点4: 画像のリサイズ戦略

### 決定

**2 段階埋め込み + WebP 変換 + CLI で調整可能**

### 戦略詳細

| 用途 | 解像度 | フォーマット | 品質 | 用途 |
|------|------|----------|----|------|
| サムネイル | max-width 600px | WebP | 80% | ノードに表示（常時表示） |
| 原寸 | max-width 2000px | WebP | 90% | クリックで拡大表示（lazy 表示） |

### 実装方針

- `sharp` で 2 回リサイズ → 両方 base64 埋め込み
- HTML 内で `<img src="thumb">` のサムネ表示
- 原寸データは `<script>` の JS オブジェクトで遅延管理（`ORIGINALS[id]`）
- ノードクリック時に lightbox に注入（外部ライブラリ不要、バニラ JS で実装）

### Lightbox 仕様

- 画面全体に半透明黒オーバーレイ
- 中央に原寸画像（max 90vw × 90vh、はみ出る場合スクロール）
- ESC / 背景クリック / × ボタンで閉じる

### CLI フラグ

```bash
shotflow build flow.yaml \
  --thumbnail-width 600 \
  --original-width 2000 \
  --quality 80 \
  --no-original \              # 原寸埋め込みスキップ（軽量化）
  --format webp                # webp | jpeg | png
```

### YAML 内設定（CLI より優先順位低）

```yaml
image:
  thumbnail_width: 800
  original_width: 1600
  quality: 85
  format: webp
```

### サイズ試算（100 画面想定）

| 戦略 | HTML サイズ |
|------|----------|
| 無変換（PNG 原寸） | 200〜300MB ❌ |
| WebP 原寸のみ | 30〜50MB △ |
| **WebP サムネ + 原寸（採用）** | **15〜25MB** ◯ |

### 根拠

- 単一 HTML 性を維持しつつ実用範囲のサイズに抑えられる
- 拡大時の UX を損なわない
- 軽量化したいユーザーは `--no-original` で対応可能

---

## 論点5: CLI vs ライブラリ

### 決定

**core 関数を export しておく（zero-cost で両対応）**

パッケージは **ESM のみ**。API は v1.0 まで **experimental（破壊的変更あり）**と明記。

### パブリック API 案（v0.1）

```ts
import { build, parseConfig, render } from 'shotflow';

// 高レベル: ファイル to ファイル
await build({
  configPath: './flow.yaml',
  outputPath: './output.html',
  options: { thumbnailWidth: 600, quality: 80 },
});

// 低レベル: オブジェクト to 文字列
const config = await parseConfig('./flow.yaml');
const html = await render(config, { quality: 80 });
await fs.writeFile('./output.html', html);

// インラインオブジェクトから
import { buildFromObject } from 'shotflow';
await buildFromObject({
  title: '...',
  groups: { admin: { /* ... */ } },
  transitions: [],
}, { outputPath: './output.html' });
```

### 想定ユースケース

| シナリオ | 例 |
|--------|----|
| CI/CD で自動生成 | GitHub Actions で `flow.yaml` 変更検知 → ビルド |
| 動的生成 | Storybook の story 一覧から自動で flow を組む |
| 別ツール連携 | Astro Integration として導入、ビルド時に図生成 |
| テスト | shotflow 自体のテスト（render 出力のスナップショット） |

### 根拠

- 内部実装上、CLI は `parse → layout → render` の 3 関数を呼ぶだけ
- これらを export するだけで programmatic API が成立 → 追加コストほぼゼロ
- 2026 年現在、新規 OSS で CJS のみ・両対応にする理由はほぼない
- 想定利用者（Astro Integration、CI/CD スクリプト）はモダン環境

---

## 論点6: 設定ファイル形式

### 決定

**v0.1 は YAML のみ → v0.3 で TypeScript 設定（`shotflow.config.ts`）追加**

### TS 設定の DSL 案（v0.3）

```ts
// shotflow.config.ts
import { defineConfig } from 'shotflow';
import { glob } from 'glob';

export default defineConfig({
  title: 'WEB受注システム 画面遷移図',
  groups: {
    admin: {
      label: '管理側',
      color: '#2563eb',
      screens: glob.sync('./images/admin/*.png').map((path) => ({
        id: path.split('/').pop()!.replace('.png', ''),
        name: path.split('/').pop()!.replace('.png', ''),
        image: path,
      })),
    },
  },
  transitions: [],
});
```

### 設定ファイル探索ルール（v0.3 以降）

`shotflow build` を引数なしで実行した場合、以下の順で探索：

1. `shotflow.config.ts`
2. `shotflow.config.mts`
3. `shotflow.config.js`
4. `shotflow.config.yaml`
5. `flow.yaml`（後方互換）

明示指定: `shotflow build ./custom-flow.yaml`

### 根拠

- shotflow のターゲット（業務エンジニア、PM、デザイナー）の大半は YAML で十分
- TS 設定の需要は「動的に画面リスト生成したい」高度ユーザー向け
- v0.1 から両対応するとスキーマ二重メンテ、優先順位ロジック等で複雑化
- 後から追加は破壊的変更にならない
- JSON サポートは入れない（YAML が JSON のスーパーセットなので冗長）

---

## 論点7: ライセンス・OSS 戦略

### 決定

- **ライセンス: MIT**
- **README: 日英並記**（`README.md` 英語 / `README.ja.md` 日本語）
- **告知**: 一旦無視（v0.1 リリース時点では能動告知しない）

### 根拠

- MIT は npm OSS の事実上の標準で、企業利用の障壁が最も低い
- 日英並記により海外ユーザーも初期から取り込める
- 告知は v0.1 では機能不足の可能性があり、品質が安定してから検討

---

## 論点8: リポジトリ名・npm パッケージ名

### 決定

**プロジェクト名: `shotflow`**（旧名 `flowshot` から変更）

| 項目 | 状況 |
|------|------|
| npm | ◯ `shotflow` 空き |
| GitHub | ◯ `kpab/shotflow` 空き |
| ドメイン | 未取得（`shotflow.dev` を v0.3 リリース時に検討） |

### 変更経緯

旧名 `flowshot` は npm に既存パッケージあり：

> `flowshot@0.7.4` — Flow-based visual regression dashboard for Playwright. メンテナ: thingnoy

主眼が visual regression（差分検出）と異なるが、コンセプトが近く検索性で不利のため別名を採用。

### 候補比較

| 候補 | 評価 | 採否 |
|------|------|------|
| `flowshot` | 既存被り | ❌ |
| `screenflow` | Telestream の有名 macOS 画面録画ソフトと同名 | ❌ |
| **`shotflow`** | npm/GitHub/商標すべてクリーン、語順入れ替えで意味継続 | ✓ 採用 |
| `flowmap` | 汎用、地図感 | △ 次点 |
| `viewflow` | Python/Django の workflow ライブラリと混同リスク | ❌ |

---

## 論点9: 画面上での微調整機能（v0.4 以降）

### 決定

**v0.4 で `shotflow dev` モードに編集機能 → v0.5 で静的 HTML にも拡張**

MVP（v0.1〜v0.3）対象外、ただし**設計時点で考慮**しておく。

### 想定 UX

```
shotflow dev flow.yaml
  ↓
ブラウザで開く（http://localhost:5173）
  ↓
ノードをドラッグで位置微調整
矢印経路を手動調整
  ↓
[💾 保存] ボタン
  ↓
flow.yaml に position が書き戻される
```

### 実装方針

| version | 内容 |
|---------|------|
| v0.4 | `shotflow dev` で起動した HTML に編集 UI を含める。WebSocket で YAML 書き戻し |
| v0.5 | 出力 HTML に `?edit=1` で編集モード。localStorage に保存 → YAML ダウンロード |
| v1.0+ | （オプション）独立の GUI ツール（Electron 等） |

### 既存決定との整合性

| 既存決定 | 画面編集との整合 |
|---------|---------------|
| 論点1: dagre 自動 + position オーバーライド可能 | ◯ 編集結果を `position: { x, y }` で書き戻すだけ |
| 論点5: core export | ◯ dev サーバーが core 関数を呼んで HTML 生成 |
| 論点6: YAML 設定 | ◯ ただし YAML 書き戻し時のコメント保持に注意 |

### 重要な技術選定への影響

YAML パーサに `js-yaml` ではなく **`yaml`（eemeli 製）** を採用する。
理由: `js-yaml` はコメント・フォーマットを保持しないため、編集機能実装時の YAML 書き戻しでユーザーのコメントが消失する。

→ v0.1 の段階から `yaml` を採用しておく（後から移行する破壊的変更を避けるため）。

---

## 論点10: v0.2 アイコン取り込み戦略

### 決定

**v0.2 では curated な小規模インライン catalog（12 アイコン）を同梱する。** `lucide-static` 等の外部依存は導入しない。

### 同梱アイコン（v0.2 時点）

`mail`, `bell`, `link`, `external-link`, `lock`, `user`, `check`, `x`,
`arrow-right`, `database`, `file`, `send`

実装は `packages/shotflow/src/core/icons.ts` に Lucide 互換の SVG パスを直書き。

### 根拠

- v0.3 で Iconify 統合（`set:name` prefix 形式）に切り替える予定があり、それまでの過渡的実装としては最小依存が望ましい
- `lucide-static` を入れて `require.resolve` で node_modules から SVG ファイルを読む形にすると、CLI バンドル時のパス解決が壊れやすい
- 業務文書で実際に使う頻度が高いアイコンは数十種程度に収まる（mail / bell / lock / user 等）。全 1500 種を引き込む価値が薄い
- Iconify 移行時は zod スキーマの `icon` フィールド形式を `"name"` → `"set:name"` のように拡張するだけで、curated catalog は内部的に `lucide:` prefix 付きで残せる

### 注意事項

- v0.2 で受け入れる `icon` 名は curated catalog の名前と一致する必要がある。未知の名前は無視（描画時に静かに省略）
- Iconify 移行時に `mail` のような prefix なし指定との互換は維持（暗黙 `lucide:` 扱いで解決）

---

## 履歴

| 日付 | 変更内容 |
|------|--------|
| 2026-04-26 | 論点1〜9 を初回確定 |
| 2026-04-26 | 論点10（v0.2 アイコン取り込み戦略）を追加 |
