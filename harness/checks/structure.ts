// ESLint では表現しづらい構造規約の検査（docs/conventions.md#命名, docs/anti-patterns.md）
import { readdirSync, readFileSync, statSync } from 'node:fs'
import { basename, join } from 'node:path'
import { ROOT } from '../todoStore'
import { relative, result, type GateResult, type Issue } from './types'

const ATOMIC_LAYERS = ['atoms', 'molecules', 'organisms', 'templates', 'pages']
const SUPPRESSIONS: [RegExp, string][] = [
  [/eslint-disable/, 'suppression/eslint-disable'],
  [/@ts-(ignore|expect-error|nocheck)/, 'suppression/ts-ignore'],
  [/\b(it|test|describe)\.(skip|only)\(/, 'suppression/test-skip'],
]

const walk = (dir: string): string[] =>
  readdirSync(dir).flatMap((name) => {
    const full = join(dir, name)
    return statSync(full).isDirectory() ? walk(full) : [full]
  })

/** ファイル1つ分の検査。テストしやすいよう純粋関数にしている */
export const checkFile = (path: string, source: string): Issue[] => {
  const issues: Issue[] = []
  const file = relative(path)
  const name = basename(file).replace(/\.test(?=\.tsx?$)/, '')
  const push = (rule: string, message: string, line?: number) =>
    issues.push({ gate: 'structure', file, rule, message, ...(line ? { line } : {}) })

  if (file.startsWith('src/components/')) {
    const layer = file.split('/')[2] ?? ''
    if (!ATOMIC_LAYERS.includes(layer)) push('structure/atomic-layer', `components 直下は ${ATOMIC_LAYERS.join('/')} のいずれかに置く（現在: ${layer}）`)
    if (!/^[A-Z][A-Za-z0-9]*\.tsx$/.test(name)) push('naming/component-file', `コンポーネントファイル名は PascalCase.tsx（現在: ${name}）`)
    const component = name.replace(/\.tsx$/, '')
    if (!file.endsWith('.test.tsx') && !new RegExp(`export const ${component}\\b`).test(source)) {
      push('naming/component-export', `ファイル名と同名のコンポーネント \`export const ${component}\` が必要`)
    }
  } else if (file.startsWith('src/') && !/^[a-z][A-Za-z0-9]*\.tsx?$/.test(name)) {
    push('naming/module-file', `components 以外のファイル名は camelCase.ts（現在: ${name}）`)
  }

  source.split('\n').forEach((text, i) => {
    for (const [pattern, rule] of SUPPRESSIONS) if (pattern.test(text)) push(rule, `抑制コメント/スキップを検出: \`${text.trim()}\``, i + 1)
  })
  return issues
}

export const checkStructure = (): GateResult => {
  const files = walk(join(ROOT, 'src')).filter((f) => /\.tsx?$/.test(f))
  return result('structure', files.flatMap((f) => checkFile(f, readFileSync(f, 'utf8'))))
}
