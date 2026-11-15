// Bash コマンドに対するガード規則（純粋関数。harness/hooks/bashRules.test.ts でテスト）

/** ヒアドキュメントの本文を除去する。文書中の「言及」をコマンドと誤認しないため */
export const stripHeredocs = (command: string): string =>
  command.replace(/<<-?\s*['"]?(\w+)['"]?[^\n]*\n[\s\S]*?\n\s*\1(?=\n|$)/g, '<<HEREDOC')

/** コマンドを ; && || | 改行 で区切った各セグメント（先頭空白除去） */
const segments = (command: string): string[] =>
  stripHeredocs(command)
    .split(/\n|;|&&|\|\||\|/)
    .map((s) => s.trim())

const RULES: { test: (segment: string, autonomous: boolean) => boolean; message: string }[] = [
  {
    test: (s, autonomous) => !autonomous && /^(?:pnpm|npm|npx)\s+(?:-s\s+)?(?:run\s+)?progress\s+approve\b|harness\/progress\.ts\s+approve\b/.test(s),
    message: '計画の承認は人間が行います。計画内容と受け入れ基準を提示して承認を依頼し、待ってください（docs/workflow-pev.md#plan）。',
  },
  {
    test: (s) => /^git\s+(?:commit|push)\b.*\s--no-verify\b|^git\s+push\b.*\s(?:--force|-f)\b/.test(s),
    message: '--no-verify / force push はハーネスのゲートを迂回するため禁止です（docs/anti-patterns.md）。',
  },
  {
    test: (s) => /(?:>>?\s*|\btee\s+(?:-a\s+)?|\bsed\s+-i\b.*\s)\S*\b(?:todo\.json|progress\.md)\b/.test(s),
    message: 'todo.json / progress.md はシェルで書き換えず `pnpm progress <command>` を使ってください。',
  },
]

export const bashViolation = (command: string, autonomous: boolean): string | undefined => {
  for (const segment of segments(command)) {
    const rule = RULES.find((r) => r.test(segment, autonomous))
    if (rule) return rule.message
  }
  return undefined
}
