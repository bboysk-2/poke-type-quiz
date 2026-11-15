// 評価ハーネス（測定用）。エージェント・ハーネス（実行用）とは目的もディレクトリも分ける。
// 同じタスク集合・同じ隠しテスト・同じ判定で、複数のモデル/エージェント設定を公平に比較する。
//
//   pnpm eval --dry-run                                     タスク定義の検証とベースライン（未解決であること）の確認
//   pnpm eval --label opus --agent 'claude -p --permission-mode acceptEdits "$EVAL_PROMPT"'
//   pnpm eval --label sonnet --agent '...' --task format-score --repeat 3
//   pnpm eval report                                        eval/results の集計表
//
// 各試行は HEAD から作った使い捨ての git worktree で実行するため、作業ツリーを汚さない。
import { execSync, spawnSync } from 'node:child_process'
import { copyFileSync, existsSync, mkdirSync, readdirSync, readFileSync, rmSync, symlinkSync, writeFileSync } from 'node:fs'
import { dirname, join } from 'node:path'

const ROOT = join(import.meta.dirname, '..')
const TASKS_DIR = join(ROOT, 'eval/tasks')
const RESULTS_DIR = join(ROOT, 'eval/results')

interface EvalTask {
  id: string
  title: string
  prompt: string
  hidden: { from: string; to: string }[]
  checks: { name: string; cmd: string }[]
  timeoutSec: number
}

interface TrialResult {
  label: string
  task: string
  trial: number
  success: boolean
  durationSec: number
  agentExit: number | null
  gates: Record<string, boolean>
  checks: Record<string, boolean>
  diff: string
}

const args = process.argv.slice(2)
const flag = (name: string): string | undefined => (args.includes(name) ? args[args.indexOf(name) + 1] : undefined)
const has = (name: string) => args.includes(name)

const loadTasks = (): EvalTask[] => {
  const tasks = readdirSync(TASKS_DIR)
    .filter((d) => existsSync(join(TASKS_DIR, d, 'task.json')))
    .map((d) => JSON.parse(readFileSync(join(TASKS_DIR, d, 'task.json'), 'utf8')) as EvalTask)
    .filter((t) => !flag('--task') || t.id === flag('--task'))
  if (tasks.length === 0) throw new Error(`評価タスクが 0 件です（--task ${flag('--task') ?? ''} を確認）`)
  return tasks
}

const sh = (cmd: string, cwd: string, env: NodeJS.ProcessEnv = {}, timeoutSec = 600) =>
  spawnSync('bash', ['-c', cmd], { cwd, env: { ...process.env, ...env }, encoding: 'utf8', timeout: timeoutSec * 1000 })

const prepareWorktree = (dir: string) => {
  rmSync(dir, { recursive: true, force: true })
  mkdirSync(dirname(dir), { recursive: true })
  execSync(`git worktree add --detach "${dir}" HEAD`, { cwd: ROOT, stdio: 'ignore' })
  if (!existsSync(join(dir, 'node_modules'))) symlinkSync(join(ROOT, 'node_modules'), join(dir, 'node_modules'))
}

const removeWorktree = (dir: string) => {
  spawnSync('git', ['worktree', 'remove', '--force', dir], { cwd: ROOT })
}

const parseGates = (stdout: string): Record<string, boolean> => {
  try {
    const parsed = JSON.parse(stdout) as { results: { gate: string; ok: boolean }[] }
    return Object.fromEntries(parsed.results.map((r) => [r.gate, r.ok]))
  } catch {
    return { verify: false }
  }
}

/** 判定: 隠しテストを配置 → 実行ハーネスと同じ verify → タスク固有チェック */
const judge = (task: EvalTask, dir: string) => {
  for (const h of task.hidden) {
    mkdirSync(dirname(join(dir, h.to)), { recursive: true })
    copyFileSync(join(TASKS_DIR, task.id, h.from), join(dir, h.to))
  }
  const gates = parseGates(sh('node_modules/.bin/tsx harness/verify.ts --json', dir).stdout)
  const checks = Object.fromEntries(task.checks.map((c) => [c.name, sh(c.cmd, dir).status === 0]))
  return { gates, checks }
}

const runTrial = (task: EvalTask, label: string, agent: string | undefined, trial: number): TrialResult => {
  const dir = join(ROOT, 'eval/.work', `${label}-${task.id}-${trial}`)
  prepareWorktree(dir)
  const started = Date.now()
  const agentRun = agent && !has('--dry-run') ? sh(agent, dir, { EVAL_PROMPT: task.prompt, HARNESS_AUTONOMOUS: '1' }, task.timeoutSec) : null
  const durationSec = Math.round((Date.now() - started) / 1000)
  const diff = sh('git diff --shortstat HEAD', dir).stdout.trim()
  const { gates, checks } = judge(task, dir)
  if (!has('--keep')) removeWorktree(dir)
  const success = Object.values(gates).every(Boolean) && Object.values(checks).every(Boolean)
  return { label, task: task.id, trial, success, durationSec, agentExit: agentRun?.status ?? null, gates, checks, diff }
}

const report = () => {
  const rows = existsSync(RESULTS_DIR)
    ? readdirSync(RESULTS_DIR).flatMap((f) => JSON.parse(readFileSync(join(RESULTS_DIR, f), 'utf8')) as TrialResult[])
    : []
  const groups = new Map<string, TrialResult[]>()
  for (const r of rows) groups.set(`${r.label}\t${r.task}`, [...(groups.get(`${r.label}\t${r.task}`) ?? []), r])
  console.log('| label | task | 成功率 | 平均秒 | 試行 |\n|---|---|---|---|---|')
  for (const [key, list] of groups) {
    const [label, task] = key.split('\t')
    const rate = Math.round((list.filter((r) => r.success).length / list.length) * 100)
    const avg = Math.round(list.reduce((s, r) => s + r.durationSec, 0) / list.length)
    console.log(`| ${label ?? ''} | ${task ?? ''} | ${rate}% | ${avg} | ${list.length} |`)
  }
}

const printAndSave = (results: TrialResult[], dry: boolean, label: string) => {
  for (const r of results) console.log(`${r.success ? '✅' : '❌'} ${r.label} ${r.task}#${r.trial} ${r.durationSec}s gates=${JSON.stringify(r.gates)} checks=${JSON.stringify(r.checks)}`)
  if (dry) {
    const solved = results.filter((r) => r.success)
    console.log(solved.length === 0 ? 'ベースライン OK: どのタスクも HEAD では未解決です。' : `⚠ HEAD で既に解けているタスク: ${solved.map((r) => r.task).join(', ')}`)
    process.exit(solved.length === 0 ? 0 : 1)
  }
  mkdirSync(RESULTS_DIR, { recursive: true })
  writeFileSync(join(RESULTS_DIR, `${new Date().toISOString().replace(/[:.]/g, '-')}-${label}.json`), JSON.stringify(results, null, 2))
}

const main = () => {
  if (args[0] === 'report') {
    report()
    return
  }
  const dry = has('--dry-run')
  const agent = flag('--agent')
  if (!dry && !agent) throw new Error('--agent "<コマンド>" か --dry-run が必要です（プロンプトは $EVAL_PROMPT で渡されます）')
  const label = dry ? 'baseline' : (flag('--label') ?? 'unnamed')
  const repeat = Number(flag('--repeat') ?? 1)
  const results = loadTasks().flatMap((task) => Array.from({ length: repeat }, (_, i) => runTrial(task, label, agent, i + 1)))
  printAndSave(results, dry, label)
}

main()
