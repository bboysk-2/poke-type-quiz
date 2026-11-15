// 「エラーメッセージのプロンプト化」: 検査結果を、エージェントが次の入力としてそのまま使える指示書に変換する。
import type { GateResult, Issue } from './checks/types'

interface Hint { fix: string; doc: string }

/** ルール ID（前方一致）→ 修正方針と規約へのリンク。新しいルールを足したらここにも足す */
const HINTS: [string, Hint][] = [
  ['no-restricted-imports', { fix: 'import の向きを依存ルールに合わせる。必要なら型を domain/ports.ts に移すか、上位レイヤーから props/引数で渡す。', doc: 'docs/architecture.md#依存ルール' }],
  ['no-restricted-syntax', { fix: 'メッセージ内の修正案に従う（名前付き export / Random の注入）。', doc: 'docs/conventions.md' }],
  ['max-lines', { fix: 'ファイルを責務ごとに分割する（UI なら下位の Atomic 階層へ切り出す）。', doc: 'docs/conventions.md#サイズ' }],
  ['complexity', { fix: '早期 return・小さな関数・データ駆動（テーブル）で分岐を減らす。', doc: 'docs/conventions.md#サイズ' }],
  ['@typescript-eslint/no-explicit-any', { fix: 'unknown で受けて型ガードで絞り込む。', doc: 'docs/conventions.md#型' }],
  ['@typescript-eslint/no-unsafe', { fix: '外部入力は unknown として扱い、型ガードで検証してから使う。', doc: 'docs/conventions.md#型' }],
  ['@typescript-eslint/no-unused-vars', { fix: '未使用の変数・引数・import を削除する。', doc: 'docs/entropy.md' }],
  ['@typescript-eslint/consistent-type-imports', { fix: '型だけの import は `import type` にする（`pnpm lint:fix` で自動修正可）。', doc: 'docs/conventions.md' }],
  ['TS2322', { fix: '代入元と代入先の型を確認。domain の型定義が正しいなら呼び出し側を直す。', doc: 'docs/conventions.md#型' }],
  ['TS2532', { fix: 'noUncheckedIndexedAccess により undefined の可能性がある。存在チェックか `?? 既定値` を入れる。', doc: 'docs/conventions.md#型' }],
  ['TS18048', { fix: 'undefined の可能性がある値。存在チェックを入れる。', doc: 'docs/conventions.md#型' }],
  ['TS2375', { fix: 'exactOptionalPropertyTypes: undefined を明示的に渡さず、プロパティごと省略する（スプレッドで条件付き付与）。', doc: 'docs/conventions.md#型' }],
  ['TS', { fix: '型エラーの指す行を読み、型を緩めるのではなく値の側を正しくする。`as` での回避は禁止。', doc: 'docs/conventions.md#型' }],
  ['test/failed', { fix: 'まず失敗したテストが受け入れ基準どおりかを確認。テストが正しければ実装を直す。テストを消す・skip するのは禁止。', doc: 'docs/anti-patterns.md' }],
  ['test/suite-error', { fix: 'テストファイルが読み込めていない（import エラー等）。メッセージのパスを確認する。', doc: 'docs/conventions.md#テスト' }],
  ['knip/files', { fix: 'どこからも使われていないファイル。不要なら削除、必要なら利用箇所から import する。', doc: 'docs/entropy.md' }],
  ['knip/exports', { fix: '使われていない export。削除するか export を外す。', doc: 'docs/entropy.md' }],
  ['knip/types', { fix: '使われていない型 export。削除するか export を外す。', doc: 'docs/entropy.md' }],
  ['knip/dependencies', { fix: 'package.json の未使用依存。`pnpm remove <name>`。', doc: 'docs/entropy.md' }],
  ['knip', { fix: 'knip の指摘に従って不要なコード/依存を削除する。', doc: 'docs/entropy.md' }],
  ['naming/', { fix: 'ファイル名を規約に合わせてリネームし、import を更新する。', doc: 'docs/conventions.md#命名' }],
  ['structure/', { fix: 'Atomic Design の階層ディレクトリに移動する。', doc: 'docs/architecture.md#atomic-design-の判断基準' }],
  ['suppression/', { fix: '抑制せず根本原因を直す。どうしても必要なら計画(todo.json)に理由を書き、人間の承認を得る。', doc: 'docs/anti-patterns.md' }],
]

export const hintFor = (rule: string): Hint =>
  HINTS.find(([prefix]) => rule.startsWith(prefix))?.[1] ?? { fix: 'メッセージを読み、規約に沿って修正する。', doc: 'AGENTS.md' }

const MAX_ISSUES = 25

const formatIssue = (issue: Issue, i: number): string => {
  const hint = hintFor(issue.rule)
  const loc = issue.line ? `${issue.file}:${issue.line}` : issue.file
  return [`### ${i + 1}. \`${loc}\` — ${issue.rule}`, '', `- 問題: ${issue.message.replace(/\n/g, '\n  ')}`, `- 修正案: ${hint.fix}`, `- 規約: ${hint.doc}`, ''].join('\n')
}

export const renderFeedback = (results: GateResult[]): string => {
  const failed = results.filter((r) => !r.ok)
  const summary = results.map((r) => `| ${r.gate} | ${r.ok ? '✅ pass' : `❌ ${r.issues.length || '?'} 件`} |`)
  if (failed.length === 0) {
    return ['# Verify: PASS', '', '| gate | 結果 |', '|---|---|', ...summary, '', '機械的チェックはすべて通過。次: verifier エージェントで受け入れ基準を確認 → `pnpm progress done <id>`', ''].join('\n')
  }
  const issues = failed.flatMap((r) => r.issues)
  const shown = issues.slice(0, MAX_ISSUES)
  return [
    '# Verify: FAIL — タスクはまだ完了できません',
    '',
    '| gate | 結果 |',
    '|---|---|',
    ...summary,
    '',
    '## 次にやること',
    '1. 下の指摘を上から順に直す（同じ原因の指摘はまとめて直す）',
    '2. `pnpm verify` を再実行する',
    '3. 3 回直しても同じ指摘が消えない場合は `pnpm progress block <id> "<理由>"` で人間に相談する',
    '',
    '## 指摘',
    '',
    ...shown.map(formatIssue),
    ...(issues.length > shown.length ? [`…ほか ${issues.length - shown.length} 件（まず上を直すと連鎖的に消えることが多い）`, ''] : []),
    ...failed.filter((r) => r.raw).map((r) => `## ${r.gate} の生出力（パース不能）\n\n\`\`\`\n${r.raw ?? ''}\n\`\`\`\n`),
  ].join('\n')
}
