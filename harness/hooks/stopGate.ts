// Stop: エージェントが「完了」して止まろうとした瞬間に検証ゲートを実行する。
// 失敗していれば停止をブロックし、プロンプト化したフィードバックを次の入力として返す。
import { execFileSync, spawnSync } from 'node:child_process'
import { existsSync, readFileSync, rmSync, statSync, writeFileSync } from 'node:fs'
import { join } from 'node:path'
import { currentTask, loadTodo, ROOT } from '../todoStore'
import { readInput } from './hookIo'

const MAX_CONSECUTIVE_BLOCKS = 6
const counterPath = join(ROOT, '.harness/stop-attempts')

const decide = (reason: string | null) => {
  if (reason === null) {
    rmSync(counterPath, { force: true })
    process.exit(0)
  }
  const attempts = (existsSync(counterPath) ? Number(readFileSync(counterPath, 'utf8')) : 0) + 1
  if (attempts > MAX_CONSECUTIVE_BLOCKS) {
    rmSync(counterPath, { force: true })
    console.log(JSON.stringify({ systemMessage: `[harness] verify が ${MAX_CONSECUTIVE_BLOCKS} 回連続で失敗したため停止を許可しました。人間の確認が必要です。` }))
    process.exit(0)
  }
  writeFileSync(counterPath, String(attempts))
  console.log(JSON.stringify({ decision: 'block', reason }))
  process.exit(0)
}

readInput()
const changed = (() => {
  try {
    return execFileSync('git', ['status', '--porcelain'], { cwd: ROOT, encoding: 'utf8' }).trim() !== ''
  } catch {
    return true
  }
})()
const task = currentTask(loadTodo())
if (!changed && task?.status !== 'in_progress') decide(null)

const verify = spawnSync(join(ROOT, 'node_modules/.bin/tsx'), [join(ROOT, 'harness/verify.ts')], { cwd: ROOT, encoding: 'utf8' })
if (verify.status !== 0) {
  decide(`[harness] 検証ゲートが失敗しているため、まだ完了できません。\n\n${verify.stdout}`)
}

// verify は通ったが、コードを変えたのに進捗ファイルが古い → 更新させる
const newestSrc = (() => {
  try {
    const files = execFileSync('git', ['ls-files', '-m', '-o', '--exclude-standard', 'src', 'public'], { cwd: ROOT, encoding: 'utf8' }).split('\n').filter(Boolean)
    return Math.max(0, ...files.filter((f) => existsSync(join(ROOT, f))).map((f) => statSync(join(ROOT, f)).mtimeMs))
  } catch {
    return 0
  }
})()
const todoMtime = existsSync(join(ROOT, 'todo.json')) ? statSync(join(ROOT, 'todo.json')).mtimeMs : 0
if (task?.status === 'in_progress' && newestSrc > todoMtime) {
  decide(`[harness] verify は通過しましたが、progress が最後のコード変更より古いです。\`pnpm progress step ${task.id} <番号>\` / \`pnpm progress note ${task.id} "..."\` で現在地を記録してから終了してください。受け入れ基準の確認がまだなら verifier エージェントを呼んでください。`)
}
decide(null)
