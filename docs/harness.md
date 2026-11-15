# ハーネス（実行用）

エージェントを「規約に従わざるを得ない」状態に置くための仕組み。人間への説明ではなく**機械による強制**を優先する。

## 構成
| 部品 | 場所 | 役割 |
|---|---|---|
| 地図 | `AGENTS.md`（`CLAUDE.md` は参照のみ） | 最小の索引。詳細は docs/ |
| 検証ゲート | `harness/verify.ts`, `harness/checks/` | structure / lint / typecheck / test / deadcode を実行し Issue に正規化 |
| フィードバック | `harness/feedback.ts` | 指摘を「場所・問題・修正案・規約リンク・次にやること」に変換 → `.harness/feedback.md` |
| 進捗 | `harness/progress.ts`, `todo.json`, `progress.md` | PEV の状態機械。progress.md は自動生成ビュー |
| 要約 | `harness/compact.ts` | 状態だけの要約 → `.harness/session-summary.md` |
| フック | `.claude/settings.json`, `harness/hooks/` | 下表 |
| サブエージェント | `.claude/agents/` | planner / verifier / janitor |
| CI | `.github/workflows/ci.yml` | 同じ `pnpm verify` をハードゲートとして実行 |

## フック
| イベント | スクリプト | 強制すること |
|---|---|---|
| SessionStart | `sessionStart.ts` | 状態要約をコンテキストに注入（起動・/clear・圧縮後） |
| PreToolUse | `planGate.ts` (+ `bashRules.ts`) | 承認済み計画なしの src/ public/ 編集を拒否。todo.json 直接編集・エージェントによる承認・ゲート迂回を拒否 |
| PostToolUse | `lintOnEdit.ts` | 編集したファイルを即 lint + 構造検査し、指摘をエージェントに返す |
| Stop | `stopGate.ts` | verify 失敗なら停止をブロックしフィードバックを返す。進捗未更新でもブロック。6 連続で人間にエスカレーション |
| PreCompact | `preCompact.ts` | 圧縮前に状態要約を保存 |

フックは exit code 2 + stderr（または `{"decision":"block","reason":...}`）でエージェントへの次の入力を作る。

## センサー（決定論的チェック）
- **TypeScript strict**（`noUncheckedIndexedAccess`, `exactOptionalPropertyTypes`）— 最も安価で強いセンサー
- **ESLint** — `strictTypeChecked` + 依存方向（`[arch/*]`）+ 規約（`[conv/*]`）。メッセージ自体に修正案と規約リンクを埋め込む
- **structure** — ファイル名・Atomic 階層・抑制コメント・テストの skip/only
- **Vitest** — domain/application の単体、routes の結合、そして**ハーネス自身のテスト**（`harness/architecture.test.ts` が境界ルールの検出を保証）
- **knip** — 未使用ファイル・export・依存

## 新しいルールを足すとき
1. ESLint ルール or `harness/checks/structure.ts` に追加（メッセージに修正案と docs リンクを含める）
2. `harness/feedback.ts` の HINTS に修正方針を追加
3. 検出されることを `harness/*.test.ts` でテスト
4. docs/ の該当箇所を更新

## CI
- `ci.yml` の `verify` ジョブをブランチ保護の **Required status check** に設定する（GitHub: Settings → Branches → Branch protection rules → Require status checks → `verify`）。これで失敗した PR はマージ不可になる。
- 失敗時は feedback.md が PR コメントとして投稿され、PR を担当するエージェントの次の入力になる。
