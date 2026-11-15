// PostToolUse(Edit|Write|MultiEdit): 編集直後のファイルだけを即座に lint し、
// 問題があればプロンプト化したフィードバックをエージェントに返す（最短のセンサーループ）。
import { relative } from 'node:path'
import { checkFile } from '../checks/structure'
import { run } from '../checks/types'
import { renderFeedback } from '../feedback'
import { ROOT } from '../todoStore'
import { readFileSync } from 'node:fs'
import { allow, block, readInput } from './hookIo'
import type { Issue } from '../checks/types'

const file = readInput().tool_input?.file_path ?? ''
const rel = relative(ROOT, file)
if (!/\.(ts|tsx)$/.test(rel) || rel.startsWith('..')) allow()

interface EslintFile { messages: { ruleId: string | null; message: string; line: number }[] }
const { stdout } = run('eslint', ['--format', 'json', file])
let lintIssues: Issue[] = []
try {
  lintIssues = (JSON.parse(stdout) as EslintFile[]).flatMap((f) =>
    f.messages.map<Issue>((m) => ({ gate: 'lint', file: rel, line: m.line, rule: m.ruleId ?? 'eslint/parse', message: m.message })),
  )
} catch {
  allow()
}
const structureIssues = rel.startsWith('src/') ? checkFile(file, readFileSync(file, 'utf8')) : []
const issues = [...lintIssues, ...structureIssues]
if (issues.length > 0) {
  block(renderFeedback([{ gate: 'lint', ok: false, issues }]).replace('# Verify: FAIL — タスクはまだ完了できません', `# 編集直後チェック: ${rel}`))
}
allow()
