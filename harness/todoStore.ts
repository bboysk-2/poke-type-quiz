// todo.json（正本）と progress.md（人間/エージェント向けビュー）の読み書き。
// 状態遷移のルールはここに集約し、CLI・フック・compact が共有する。
import { existsSync, readFileSync, writeFileSync } from 'node:fs'
import { join } from 'node:path'

export const TASK_STATUSES = ['planned', 'approved', 'in_progress', 'done', 'blocked'] as const
export type TaskStatus = (typeof TASK_STATUSES)[number]

export interface Check {
  text: string
  done: boolean
}

export interface Task {
  id: string
  title: string
  status: TaskStatus
  steps: Check[]
  acceptanceCriteria: Check[]
  approvedBy: string | null
  notes: string[]
}

export interface TodoFile {
  version: 1
  goal: string
  currentTaskId: string | null
  tasks: Task[]
  log: { at: string; event: string }[]
}

export const ROOT = join(import.meta.dirname, '..')
const TODO_PATH = join(ROOT, 'todo.json')
const PROGRESS_PATH = join(ROOT, 'progress.md')

export const emptyTodo = (goal = ''): TodoFile => ({
  version: 1,
  goal,
  currentTaskId: null,
  tasks: [],
  log: [],
})

export const loadTodo = (path = TODO_PATH): TodoFile =>
  existsSync(path) ? (JSON.parse(readFileSync(path, 'utf8')) as TodoFile) : emptyTodo()

export const currentTask = (todo: TodoFile): Task | undefined =>
  todo.tasks.find((t) => t.id === todo.currentTaskId)

export const findTask = (todo: TodoFile, id: string): Task => {
  const task = todo.tasks.find((t) => t.id === id)
  if (!task) throw new Error(`タスク ${id} が存在しません。\`pnpm progress show\` で ID を確認してください。`)
  return task
}

/** 状態遷移の検証。違反時はエージェントがそのまま次の行動に使える日本語メッセージで throw する */
export const transition = (task: Task, to: TaskStatus): void => {
  const allowed: Record<TaskStatus, TaskStatus[]> = {
    planned: ['approved', 'blocked'],
    approved: ['in_progress', 'planned', 'blocked'],
    in_progress: ['done', 'planned', 'blocked'],
    blocked: ['planned', 'in_progress'],
    done: [],
  }
  if (!allowed[task.status].includes(to)) {
    throw new Error(
      `${task.id} は ${task.status} から ${to} へは遷移できません（許可: ${allowed[task.status].join(', ') || 'なし'}）。手順: docs/workflow-pev.md`,
    )
  }
  if (to === 'approved' && (task.steps.length === 0 || task.acceptanceCriteria.length === 0)) {
    throw new Error(
      `${task.id} の計画に steps と acceptanceCriteria が両方必要です。\`pnpm progress plan ${task.id} --step "..." --criteria "..."\``,
    )
  }
  task.status = to
}

const box = (c: Check) => (c.done ? '[x]' : '[ ]')

export const renderProgress = (todo: TodoFile): string => {
  const cur = currentTask(todo)
  const lines = [
    '# progress.md',
    '',
    '> 自動生成ファイル。編集は `pnpm progress <command>` で行う（正本は todo.json）。',
    '',
    `**ゴール:** ${todo.goal || '(未設定)'}`,
    '',
    '## 現在地',
  ]
  if (cur) {
    const nextStep = cur.steps.find((s) => !s.done)
    lines.push(
      `- タスク: **${cur.id} ${cur.title}** (${cur.status})`,
      `- 次の一手: ${nextStep ? nextStep.text : cur.status === 'in_progress' ? '`pnpm verify` → verifier エージェントで受け入れ基準を確認 → `pnpm progress done ' + cur.id + '`' : '計画の承認待ち'}`,
      '',
      '### 手順',
      ...cur.steps.map((s, i) => `${i + 1}. ${box(s)} ${s.text}`),
      '',
      '### 受け入れ基準',
      ...cur.acceptanceCriteria.map((c, i) => `${i + 1}. ${box(c)} ${c.text}`),
    )
  } else {
    lines.push('- 進行中のタスクなし。次: `pnpm progress add "<タイトル>"` で計画を立てる')
  }
  lines.push('', '## タスク一覧', '| ID | 状態 | タイトル |', '|---|---|---|')
  lines.push(...todo.tasks.map((t) => `| ${t.id} | ${t.status} | ${t.title} |`))
  lines.push('', '## 最近のログ', ...todo.log.slice(-8).map((l) => `- ${l.at} ${l.event}`), '')
  return lines.join('\n')
}

export const saveTodo = (todo: TodoFile, event?: string): void => {
  if (event) todo.log.push({ at: new Date().toISOString(), event })
  writeFileSync(TODO_PATH, JSON.stringify(todo, null, 2) + '\n')
  writeFileSync(PROGRESS_PATH, renderProgress(todo))
}
