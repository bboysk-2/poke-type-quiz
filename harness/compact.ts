// セッションのコンパクション: 長い会話履歴を捨て、再開に必要な「状態」だけを要約する。
//   pnpm compact  → .harness/session-summary.md を生成し、/clear 後の SessionStart フックがこれを注入する
import { execFileSync } from 'node:child_process'
import { existsSync, mkdirSync, readFileSync, writeFileSync } from 'node:fs'
import { join } from 'node:path'
import { currentTask, loadTodo, ROOT } from './todoStore'

const sh = (cmd: string, args: string[]): string => {
  try {
    return execFileSync(cmd, args, { cwd: ROOT, encoding: 'utf8', stdio: ['ignore', 'pipe', 'ignore'] }).trim()
  } catch {
    return ''
  }
}

const SUMMARY_PATH = join(ROOT, '.harness/session-summary.md')

export const buildSummary = (): string => {
  const todo = loadTodo()
  const task = currentTask(todo)
  const feedbackPath = join(ROOT, '.harness/feedback.md')
  const lastVerify = existsSync(feedbackPath) ? (readFileSync(feedbackPath, 'utf8').split('\n')[0] ?? '') : '(未実行)'
  const failingIssues = existsSync(feedbackPath)
    ? readFileSync(feedbackPath, 'utf8').split('\n').filter((l) => l.startsWith('### ')).slice(0, 5)
    : []
  const lines = [
    '# セッション要約（自動生成・状態のみ）',
    '',
    `- ゴール: ${todo.goal}`,
    task
      ? `- 現在のタスク: ${task.id} ${task.title} (${task.status}) 承認者: ${task.approvedBy ?? '未承認'}`
      : '- 現在のタスク: なし',
    `- 直近の verify: ${lastVerify.replace(/^# /, '')}`,
    ...failingIssues.map((l) => `  - ${l.replace(/^### \d+\. /, '')}`),
  ]
  if (task) {
    lines.push('', '## 残りの手順', ...task.steps.filter((s) => !s.done).map((s) => `- [ ] ${s.text}`))
    lines.push('', '## 未確認の受け入れ基準', ...task.acceptanceCriteria.filter((c) => !c.done).map((c) => `- [ ] ${c.text}`))
    if (task.notes.length > 0) lines.push('', '## メモ（決定事項・ハマりどころ）', ...task.notes.slice(-8).map((n) => `- ${n}`))
  }
  const status = sh('git', ['status', '--short'])
  lines.push('', '## 作業ツリー', status ? '```\n' + status.split('\n').slice(0, 30).join('\n') + '\n```' : '(変更なし)')
  const log = sh('git', ['log', '--oneline', '-5'])
  if (log) lines.push('', '## 直近のコミット', '```\n' + log + '\n```')
  lines.push('', '## 再開手順', '1. AGENTS.md を読む（地図）', '2. 上の「残りの手順」の先頭から再開する', '3. 必要な docs/ だけを読む。過去の会話は参照できない前提で進める', '')
  return lines.join('\n')
}

export const writeSummary = (): string => {
  mkdirSync(join(ROOT, '.harness'), { recursive: true })
  const summary = buildSummary()
  writeFileSync(SUMMARY_PATH, summary)
  return summary
}

if (process.argv[1]?.endsWith('compact.ts')) {
  console.log(writeSummary())
  console.log('→ .harness/session-summary.md に保存しました。/clear で新しいコンテキストを開始すると SessionStart フックが自動で読み込みます。')
}
