# PEV ワークフロー（Plan → Execute → Verify）

```
 Plan ──(人間が承認)──▶ Execute ──▶ Verify ──PASS──▶ done
  ▲                                   │
  └────────── FAIL / 計画の誤り ◀──────┘
```
状態は `todo.json` が正本。遷移は `pnpm progress` だけが行い、`harness/todoStore.ts` の `transition()` が不正な遷移を拒否する。

## Plan
- `planner` サブエージェントを使うか、自分で以下を行う:
  ```
  pnpm progress add "<タイトル>"
  pnpm progress plan T2 --step "domain: ..." --step "components/atoms: ..." --criteria "..." --criteria "pnpm verify がすべて成功する"
  ```
- **受け入れ基準の書き方**: 観測可能で、機械か第三者が判定できる文。
  - 良い: 「結果画面に `正答率 70%` が表示されるテストがある」
  - 悪い: 「結果画面をいい感じにする」
- ステップは内側から外側へ: domain → infrastructure → application → components(atoms→pages) → routes。
- **承認は人間**: 計画を提示して待つ。人間がターミナルで `pnpm progress approve T2 --by <名前>` を実行する。
  エージェントによる approve は `planGate` フックが拒否する（自律モード `HARNESS_AUTONOMOUS=1` を除く。その場合も planner とは別のエージェントがレビューすること）。

## Execute
- `pnpm progress start T2` で src/ public/ の編集が解禁される（それまでは `planGate` フックがブロック）。
- 1 ステップずつ進め、終わるたびに `pnpm progress step T2 <番号>`。決定事項やハマりどころは `pnpm progress note T2 "..."`。
- 編集直後に `lintOnEdit` フックがそのファイルを検査し、問題があれば修正指示が返ってくる。
- 計画にない作業が必要になったら、勝手に広げず `pnpm progress plan` で計画を更新 → 再承認。

## Verify
1. `pnpm verify` — 機械的ゲート（structure / lint / typecheck / test / deadcode）。失敗時は `.harness/feedback.md` を読む。
2. `verifier` サブエージェント — 実装者と独立した文脈で受け入れ基準を 1 つずつ証拠付きで確認し、`pnpm progress check` する。
3. `pnpm progress done T2` — verify 再実行 + 全手順・全基準チェック済みのときだけ成功する。

停止しようとすると `stopGate` フックが verify を走らせ、失敗なら停止をブロックしてフィードバックを返す。
