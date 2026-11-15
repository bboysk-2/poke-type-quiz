// PreToolUse(Edit|Write|MultiEdit|Bash): PEV の Plan を物理的に強制する。
// - src/ public/ の編集は「承認済みで in_progress のタスク」があるときだけ許可
// - todo.json / progress.md の直接編集は禁止（pnpm progress 経由のみ）
// - 計画の承認は人間の仕事。自律モード(HARNESS_AUTONOMOUS=1)以外ではエージェントの approve を拒否
import { relative } from 'node:path'
import { currentTask, loadTodo, ROOT } from '../todoStore'
import { bashViolation } from './bashRules'
import { allow, block, readInput } from './hookIo'

const input = readInput()
if (input.tool_name === 'Bash') {
  const violation = bashViolation(input.tool_input?.command ?? '', process.env['HARNESS_AUTONOMOUS'] === '1')
  if (violation) block(violation)
  allow()
}

const file = input.tool_input?.file_path
if (!file) allow()
const rel = relative(ROOT, file ?? '')

if (rel === 'todo.json' || rel === 'progress.md') {
  block('todo.json / progress.md は直接編集できません。`pnpm progress <command>` を使ってください（使い方: harness/progress.ts 冒頭）。')
}

if (/^(src|public)\//.test(rel)) {
  const task = currentTask(loadTodo())
  if (task?.status !== 'in_progress') {
    block(
      [
        `承認済みの計画がないため ${rel} は編集できません（PEV: Plan が先）。`,
        task ? `現在のタスク ${task.id} の状態は ${task.status} です。` : '進行中のタスクがありません。',
        '手順: 1) pnpm progress add "<タイトル>"  2) pnpm progress plan <id> --step ... --criteria ...',
        '      3) 人間に計画の承認を依頼（承認後 pnpm progress start <id>）',
        '詳細: docs/workflow-pev.md',
      ].join('\n'),
    )
  }
}
allow()
