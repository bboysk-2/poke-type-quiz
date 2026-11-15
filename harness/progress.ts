// 進捗管理 CLI。エージェントは todo.json を直接編集せず、必ずこれを使う（PreToolUse フックが強制）。
//   pnpm progress show
//   pnpm progress goal "<ゴール>"
//   pnpm progress add "<タイトル>"
//   pnpm progress plan <id> --step "..." --criteria "..."   (繰り返し指定可)
//   pnpm progress approve <id> --by <承認者>                 (自律モード以外は人間のみ)
//   pnpm progress start <id>
//   pnpm progress step <id> <番号>       手順を完了にする
//   pnpm progress check <id> <番号>      受け入れ基準を確認済みにする（verifier が使う）
//   pnpm progress note <id> "<メモ>"
//   pnpm progress block <id> "<理由>"
//   pnpm progress done <id>              verify が通り、全手順・全基準が済んだときのみ成功
import { execFileSync } from 'node:child_process'
import { findTask, loadTodo, renderProgress, ROOT, saveTodo, transition } from './todoStore'

const [cmd = 'show', ...rest] = process.argv.slice(2)
const todo = loadTodo()

const flagValues = (name: string): string[] =>
  rest.flatMap((v, i) => (rest[i - 1] === name ? [v] : []))

const arg = (i: number, label: string): string => {
  const v = rest[i]
  if (v === undefined) throw new Error(`引数 <${label}> が必要です。使い方は harness/progress.ts の先頭コメント参照。`)
  return v
}

const markIndex = (list: { done: boolean }[], raw: string, label: string) => {
  const item = list[Number(raw) - 1]
  if (!item) throw new Error(`${label} ${raw} は存在しません（1〜${list.length}）。`)
  item.done = true
}

const commands: Record<string, () => string> = {
  show: () => renderProgress(todo),
  goal: () => {
    todo.goal = arg(0, 'ゴール')
    saveTodo(todo, `goal set`)
    return 'ゴールを設定しました'
  },
  add: () => {
    const id = `T${todo.tasks.length + 1}`
    todo.tasks.push({ id, title: arg(0, 'タイトル'), status: 'planned', steps: [], acceptanceCriteria: [], approvedBy: null, notes: [] })
    todo.currentTaskId ??= id
    saveTodo(todo, `${id} added`)
    return `${id} を作成。次: pnpm progress plan ${id} --step "..." --criteria "..."`
  },
  plan: () => {
    const task = findTask(todo, arg(0, 'id'))
    if (task.status !== 'planned') transition(task, 'planned')
    task.steps.push(...flagValues('--step').map((text) => ({ text, done: false })))
    task.acceptanceCriteria.push(...flagValues('--criteria').map((text) => ({ text, done: false })))
    saveTodo(todo, `${task.id} planned (${task.steps.length} steps, ${task.acceptanceCriteria.length} criteria)`)
    return `計画を更新。次: 計画の承認（docs/workflow-pev.md#plan）`
  },
  approve: () => {
    const task = findTask(todo, arg(0, 'id'))
    const by = flagValues('--by')[0]
    if (!by) throw new Error('--by <承認者> が必要です')
    transition(task, 'approved')
    task.approvedBy = by
    saveTodo(todo, `${task.id} approved by ${by}`)
    return `承認済み。次: pnpm progress start ${task.id}`
  },
  start: () => {
    const task = findTask(todo, arg(0, 'id'))
    transition(task, 'in_progress')
    todo.currentTaskId = task.id
    saveTodo(todo, `${task.id} started`)
    return `${task.id} を開始。src/ の編集が解禁されました`
  },
  step: () => {
    const task = findTask(todo, arg(0, 'id'))
    markIndex(task.steps, arg(1, '番号'), '手順')
    saveTodo(todo, `${task.id} step ${rest[1] ?? ''} done`)
    return renderProgress(todo)
  },
  check: () => {
    const task = findTask(todo, arg(0, 'id'))
    markIndex(task.acceptanceCriteria, arg(1, '番号'), '受け入れ基準')
    saveTodo(todo, `${task.id} criteria ${rest[1] ?? ''} verified`)
    return renderProgress(todo)
  },
  note: () => {
    const task = findTask(todo, arg(0, 'id'))
    task.notes.push(arg(1, 'メモ'))
    saveTodo(todo, `${task.id} note`)
    return 'メモを追加しました'
  },
  block: () => {
    const task = findTask(todo, arg(0, 'id'))
    transition(task, 'blocked')
    task.notes.push(`BLOCKED: ${arg(1, '理由')}`)
    saveTodo(todo, `${task.id} blocked`)
    return 'ブロック状態にしました。人間の判断を待ってください'
  },
  done: () => {
    const task = findTask(todo, arg(0, 'id'))
    const pending = [...task.steps, ...task.acceptanceCriteria].filter((c) => !c.done)
    if (pending.length > 0) {
      throw new Error(`未完了の手順/受け入れ基準があります:\n${pending.map((p) => `  - ${p.text}`).join('\n')}`)
    }
    try {
      execFileSync('pnpm', ['-s', 'verify'], { cwd: ROOT, stdio: 'inherit' })
    } catch {
      throw new Error('pnpm verify が失敗したため完了にできません。.harness/feedback.md を読んで修正してください。')
    }
    transition(task, 'done')
    todo.currentTaskId = todo.tasks.find((t) => t.status !== 'done')?.id ?? null
    saveTodo(todo, `${task.id} done`)
    return `${task.id} 完了`
  },
}

try {
  const run = commands[cmd]
  if (!run) throw new Error(`不明なコマンド: ${cmd}（${Object.keys(commands).join(', ')}）`)
  console.log(run())
} catch (e) {
  console.error(e instanceof Error ? e.message : String(e))
  process.exit(1)
}
