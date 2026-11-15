// 検証ゲートの共通型と、外部コマンド実行のユーティリティ
import { spawnSync } from 'node:child_process'
import { join } from 'node:path'
import { ROOT } from '../todoStore'

export type Gate = 'structure' | 'lint' | 'typecheck' | 'test' | 'deadcode'

export interface Issue {
  gate: Gate
  file: string
  line?: number
  rule: string
  message: string
}

export interface GateResult {
  gate: Gate
  ok: boolean
  issues: Issue[]
  /** パースできなかった生出力（クラッシュ時など） */
  raw?: string
}

export const run = (bin: string, args: string[]) => {
  const res = spawnSync(join(ROOT, 'node_modules/.bin', bin), args, { cwd: ROOT, encoding: 'utf8', maxBuffer: 64 * 1024 * 1024 })
  return { status: res.status ?? 1, stdout: res.stdout, stderr: res.stderr }
}

export const relative = (file: string): string => (file.startsWith(ROOT) ? file.slice(ROOT.length + 1) : file)

export const result = (gate: Gate, issues: Issue[], status = issues.length > 0 ? 1 : 0, raw?: string): GateResult => ({
  gate,
  ok: status === 0 && issues.length === 0,
  issues,
  ...(status !== 0 && issues.length === 0 && raw ? { raw: raw.slice(-4000) } : {}),
})
