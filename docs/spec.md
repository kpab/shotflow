# YAML スキーマ仕様（v0.2）

shotflow が読み込む `flow.yaml` のスキーマ仕様。
zod での実装は `packages/shotflow/src/core/schema.ts` を参照。

最終更新: 2026-04-26（v0.2 機能追加時点）

---

## トップレベル

```yaml
title: string                # 必須。図のタイトル
description: string?         # 任意。図の説明
layout: LayoutConfig?        # 任意。レイアウト設定
image: ImageConfig?          # 任意。画像処理設定（CLI フラグの方が優先順位高）
groups: { [id: string]: Group }   # 必須。1 個以上
transitions: Transition[]     # 必須（空配列可）
```

---

## LayoutConfig

```yaml
layout:
  direction: "horizontal" | "vertical"   # デフォルト "horizontal"
  groups: string[]                        # グループ ID の並び順（省略時は groups の宣言順）
  spacing:
    group: number                         # グループ間の間隔 px。デフォルト 200
    node: number                          # ノード間の間隔 px。デフォルト 80
```

---

## ImageConfig

```yaml
image:
  thumbnail_width: number    # サムネ最大幅 px。デフォルト 600
  original_width: number     # 原寸最大幅 px。デフォルト 2000
  quality: number            # WebP/JPEG 品質（1-100）。デフォルト 80
  format: "webp" | "jpeg" | "png"   # デフォルト "webp"
```

CLI フラグが優先：

```bash
shotflow build flow.yaml \
  --thumbnail-width 800 \
  --original-width 1600 \
  --quality 85 \
  --format webp \
  --no-original    # 原寸埋め込みスキップ（軽量化、クリック拡大不可）
```

---

## Group

```yaml
groups:
  admin:                     # キーが ID（一意）
    label: string             # 必須。表示名
    color: string             # 任意。HEX カラー（例 "#2563eb"）。省略時は自動割り当て
    screens: Screen[]         # 必須。1 個以上
```

---

## Screen

```yaml
screens:
  - id: string                # 必須。グローバル一意（transition から参照される）
    name: string              # 必須。ノード上に表示される名前
    image: string             # 必須。画像ファイルパス（YAML からの相対 or 絶対）
    type: "default" | "modal" # 任意。デフォルト "default"
    description: string?      # 任意。ホバー時のツールチップ等で使用予定
    position: { x, y }?       # 任意（v0.2+）。dagre 自動配置を上書きする手動座標
```

### type: modal の視覚効果

| 要素 | default | modal |
|------|--------|------|
| ノード枠 | 実線 | 点線 |
| ノードサイズ | 標準 | やや小さく |
| ノード形状 | 角丸長方形 | より丸い角丸 |

---

## Transition

```yaml
transitions:
  - from: string                       # 必須。Screen.id を参照
    to: string                         # 必須。Screen.id を参照
    label: string?                     # 任意。矢印のラベル
    type: "default" | "modal" | "email" # 任意。デフォルト "default"
    icon: string?                      # 任意（v0.2+）。Lucide アイコン名
```

### type の視覚効果（v0.2）

| type | 線 | 色 | 矢じり | アイコン自動付与 |
|------|----|----|------|------|
| `default` | 実線 | #374151 (dark gray) | 標準 | なし |
| `modal` | 短破線 | #6b7280 半透明 | 小さめ | なし |
| `email` | 長破線 | #0ea5e9 (cyan) | 標準 | `mail` |

### 利用可能アイコン（v0.2 baseline）

`mail`, `bell`, `link`, `external-link`, `lock`, `user`, `check`, `x`,
`arrow-right`, `database`, `file`, `send`

未知のアイコン名は無視される（フォールバックなし）。v0.3 で Iconify 統合により拡張予定。

---

## v0.3 で追加予定

```yaml
# トップレベル
arrowStyles:                  # ユーザー定義の矢印スタイル
  webhook:
    line: "solid" | "dashed" | "dotted"
    color: string             # HEX
    icon: string              # Iconify 形式 "set:name"（例 "phosphor:bell-ringing"）
    label_prefix: string

# Transition
transitions:
  - type: "webhook"           # arrowStyles で定義した名前
```

---

## 完全な v0.1 サンプル

```yaml
title: WEB受注システム 画面遷移図
description: 管理側とバイヤー側の画面遷移を示す

layout:
  direction: horizontal
  groups: [admin, buyer]
  spacing:
    group: 200
    node: 80

image:
  thumbnail_width: 600
  original_width: 2000
  quality: 80
  format: webp

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
      - id: invite_modal
        name: 招待モーダル
        image: ./images/admin/invite.png
        type: modal

  buyer:
    label: バイヤー側
    color: "#16a34a"
    screens:
      - id: buyer_login
        name: 初回ログイン
        image: ./images/buyer/login.png

transitions:
  - from: admin_login
    to: admin_dashboard
    label: ログイン
  - from: admin_dashboard
    to: invite_modal
    label: 招待ボタン
    type: modal
  - from: invite_modal
    to: buyer_login
    label: 招待メール送信
```
