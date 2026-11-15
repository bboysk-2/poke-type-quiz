# AGENTS.md — 地図（Map, Not Manual）

ポケモンのタイプ当てクイズ（TypeScript + Hono + Atomic Design）。
このファイルは**索引だけ**。詳細は必要になったときにリンク先を読むこと。

## 毎セッション最初に読む
1. `progress.md` — 現在地と次の一手（`pnpm progress show` でも可）
2. `todo.json` — タスクと受け入れ基準の正本（手で編集せず `pnpm progress` を使う）

## 鉄則（違反はハーネスが物理的にブロックする）
- **Plan → Execute → Verify**。承認済み計画なしに `src/` を編集しない → [docs/workflow-pev.md](docs/workflow-pev.md)
- **`pnpm verify` が通るまで完了宣言しない**（Stop フックと CI が強制）→ [docs/harness.md](docs/harness.md)
- 依存の向きは `routes → application → domain ← infrastructure`、UI は `pages → templates → organisms → molecules → atoms` → [docs/architecture.md](docs/architecture.md)

## どこに何があるか
| 知りたいこと | 読む場所 |
|---|---|
| ディレクトリ構成・依存ルール | [docs/architecture.md](docs/architecture.md) |
| 命名規則・コードスタイル | [docs/conventions.md](docs/conventions.md) |
| やってはいけないこと | [docs/anti-patterns.md](docs/anti-patterns.md) |
| 計画の書き方・受け入れ基準 | [docs/workflow-pev.md](docs/workflow-pev.md) |
| 検証ゲート・フック・エラーの読み方 | [docs/harness.md](docs/harness.md) |
| コンテキストの要約と再開 | [docs/compaction.md](docs/compaction.md) |
| 不要コード掃除（GC エージェント） | [docs/entropy.md](docs/entropy.md) |
| 評価ハーネス（実行用ハーネスとは別物） | [docs/evaluation.md](docs/evaluation.md) |
| UI デザイントークン | [docs/design.md](docs/design.md) |
| PokeAPI の使い方 | [docs/pokeapi.md](docs/pokeapi.md) |

## コマンド
`pnpm dev` 開発サーバー(:3000) / `pnpm verify` 全ゲート / `pnpm progress` 進捗 / `pnpm compact` 要約 / `pnpm entropy` 掃除レポート
