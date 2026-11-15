// 外部ツール（eslint / tsc / vitest / knip）の出力を Issue[] に正規化する
import { existsSync, readFileSync, rmSync } from 'node:fs'
import { join } from 'node:path'
import { ROOT } from '../todoStore'
import { relative, result, run, type GateResult, type Issue } from './types'

const parseJson = (text: string): unknown => {
  try {
    return JSON.parse(text)
  } catch {
    return undefined
  }
}

interface EslintFile { filePath: string; messages: { ruleId: string | null; message: string; line: number }[] }

export const checkLint = (): GateResult => {
  const { status, stdout, stderr } = run('eslint', ['.', '--format', 'json'])
  const files = parseJson(stdout) as EslintFile[] | undefined
  if (!files) return result('lint', [], status || 1, stdout + stderr)
  const issues = files.flatMap((f) =>
    f.messages.map<Issue>((m) => ({ gate: 'lint', file: relative(f.filePath), line: m.line, rule: m.ruleId ?? 'eslint/parse', message: m.message })),
  )
  return result('lint', issues, status, stderr)
}

export const parseTsc = (output: string): Issue[] =>
  [...output.matchAll(/^(.+?)\((\d+),\d+\): error (TS\d+): (.+)$/gm)].map((m) => ({
    gate: 'typecheck', file: m[1] ?? '', line: Number(m[2]), rule: m[3] ?? 'TS', message: m[4] ?? '',
  }))

export const checkTypes = (): GateResult => {
  const { status, stdout, stderr } = run('tsc', ['--noEmit', '--pretty', 'false'])
  return result('typecheck', parseTsc(stdout), status, stdout + stderr)
}

interface VitestJson { testResults: { name: string; message?: string; assertionResults: { fullName: string; status: string; failureMessages: string[] }[] }[] }

export const checkTests = (): GateResult => {
  const out = join(ROOT, '.harness/vitest.json')
  const { status, stdout, stderr } = run('vitest', ['run', '--reporter=json', `--outputFile=${out}`])
  const report = existsSync(out) ? (parseJson(readFileSync(out, 'utf8')) as VitestJson | undefined) : undefined
  rmSync(out, { force: true })
  if (!report) return result('test', [], status || 1, stdout + stderr)
  const issues = report.testResults.flatMap((file) => [
    ...(file.message ? [{ gate: 'test' as const, file: relative(file.name), rule: 'test/suite-error', message: file.message }] : []),
    ...file.assertionResults
      .filter((a) => a.status === 'failed')
      .map<Issue>((a) => ({ gate: 'test', file: relative(file.name), rule: 'test/failed', message: `${a.fullName}\n${(a.failureMessages[0] ?? '').split('\n').slice(0, 6).join('\n')}` })),
  ])
  return result('test', issues, status, stdout + stderr)
}

type KnipList = { name: string; line?: number }[]
interface KnipJson { issues: (Record<string, KnipList | string> & { file: string })[] }

export const checkDeadCode = (): GateResult => {
  const { status, stdout, stderr } = run('knip', ['--reporter', 'json'])
  const report = parseJson(stdout) as KnipJson | undefined
  if (!report) return result('deadcode', [], status || 1, stdout + stderr)
  const issues = report.issues.flatMap((entry) =>
    Object.entries(entry).flatMap(([kind, list]) =>
      Array.isArray(list)
        ? list.map<Issue>((item) => ({ gate: 'deadcode', file: entry.file, rule: `knip/${kind}`, message: `未使用: ${item.name}`, ...(item.line ? { line: item.line } : {}) }))
        : [],
    ),
  )
  return result('deadcode', issues, status, stdout + stderr)
}
