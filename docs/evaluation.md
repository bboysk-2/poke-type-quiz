# 評価ハーネス（測定用）— エージェント・ハーネスと混同しない

| | エージェント・ハーネス（実行用） | 評価ハーネス（測定用） |
|---|---|---|
| 目的 | 1 つのエージェントに目的を達成させる | 複数のモデル/設定を公平に比較する |
| 場所 | `harness/`, `.claude/`, `AGENTS.md` | `eval/` |
| 入力 | 人間の要求 | 固定のタスク集合（`eval/tasks/<id>/task.json`） |
| 判定 | verify + verifier（エージェントにも見える） | verify + **エージェントに見えない隠しテスト** + タスク固有チェック |
| 副作用 | 作業ツリーを変更する | 使い捨ての git worktree 内だけ。本体は汚さない |
| 出力 | コード・progress.md | `eval/results/*.json`（成功率・所要時間・ゲート別結果） |

評価ハーネスは実行用ハーネスの `harness/verify.ts` を**判定器として再利用**するが、実行用ハーネスは評価ハーネスに依存しない。

## 使い方
```
pnpm eval --dry-run                    # タスク定義の健全性と「HEAD では未解決」であることを確認
pnpm eval --label opus   --agent 'claude -p --model claude-opus-5-5 --permission-mode acceptEdits "$EVAL_PROMPT"' --repeat 3
pnpm eval --label sonnet --agent 'claude -p --model claude-sonnet-5-5 --permission-mode acceptEdits "$EVAL_PROMPT"' --repeat 3
pnpm eval report                       # label × task の成功率・平均時間
```
- エージェントには `EVAL_PROMPT` と `HARNESS_AUTONOMOUS=1` が渡る（評価中は人間の承認を待てないため）。
- `--keep` で worktree を残して事後調査できる。`--task <id>` で 1 タスクだけ実行。
- 評価を始めるには最低 1 コミットが必要（worktree を HEAD から作るため）。

## タスクの追加
`eval/tasks/<id>/task.json` と `hidden/*.fixture`（隠しテスト。拡張子 .fixture で本体の型検査・テストから除外し、判定時だけ配置する）。
- 基本タスク（`eval/tasks/format-score`）: 指示どおり実装できるか
- 罠タスク（`eval/tasks/species-genus`）: 指示が規約違反を誘う（コンポーネントで fetch）。ハーネスに従い正しいレイヤーで実装できるかを測る
