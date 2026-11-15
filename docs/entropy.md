# エントロピー管理（ガベージコレクション・エージェント）

エージェントが大量にコードを書くと、使われないコード・重複・古いドキュメントが溜まる（AI Slop）。
これを**継続的に・小さく**掃除する。

## 計測: `pnpm entropy`
`.harness/entropy-report.md` に出力。
| 項目 | 検出方法 |
|---|---|
| 未使用コード | knip（ファイル・export・型・依存） |
| 重複ロジック | 正規化した 6 行ウィンドウのハッシュ一致（`harness/entropy.ts`） |
| 古いドキュメント | AGENTS.md と docs/ のリンク・パス参照が実在するか |
| 肥大ファイル | 150 行超（上限 200 行の手前で警告） |
| TODO/FIXME | 残置コメント |
| 地図の百科事典化 | AGENTS.md が 60 行超 |

## 掃除: janitor サブエージェント
`.claude/agents/janitor.md`。1 回最大 3 件、振る舞いを変えない（既存テストを無変更で通す）ことが受け入れ基準。

## 定期実行
`.github/workflows/entropy.yml` が週次で計測し、指摘があれば janitor に掃除 PR を作らせる（`ANTHROPIC_API_KEY` secret が必要）。
その PR も ci.yml のハードゲートを通らなければマージできない。

## 普段から
- 未使用の export は verify の deadcode ゲートで即失敗する（溜めない）。
- 機能を削除したら関連する docs/ も同じ PR で直す。
