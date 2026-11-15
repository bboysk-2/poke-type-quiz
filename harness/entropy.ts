// エントロピー計測（GC エージェントの入力）。振る舞いは変えず「汚れ」だけを列挙する。
//   pnpm entropy            → .harness/entropy-report.md を出力（常に exit 0）
//   pnpm entropy --strict   → 指摘があれば exit 1（CI のスケジュール実行で使う）
import { existsSync, mkdirSync, readdirSync, readFileSync, statSync, writeFileSync } from 'node:fs'
import { createHash } from 'node:crypto'
import { dirname, join, resolve } from 'node:path'
import { checkDeadCode } from './checks/tools'
import { ROOT } from './todoStore'

const walk = (dir: string, ext: RegExp): string[] =>
  readdirSync(dir).flatMap((name) => {
    const full = join(dir, name)
    if (name === 'node_modules' || name.startsWith('.')) return []
    return statSync(full).isDirectory() ? walk(full, ext) : ext.test(name) ? [full] : []
  })
const rel = (p: string) => p.slice(ROOT.length + 1)

/** 正規化した 6 行ウィンドウのハッシュが複数ファイルに現れたら重複候補 */
export const findDuplicates = (files: { path: string; text: string }[], window = 6): string[] => {
  const seen = new Map<string, string>()
  const found = new Set<string>()
  for (const { path, text } of files) {
    const lines = text.split('\n').map((l) => l.trim()).filter((l) => l.length > 3 && !l.startsWith('import ') && !l.startsWith('//'))
    for (let i = 0; i + window <= lines.length; i++) {
      const hash = createHash('sha1').update(lines.slice(i, i + window).join('\n')).digest('hex')
      const other = seen.get(hash)
      if (other && other !== path) found.add(`${other} ⇄ ${path}`)
      else seen.set(hash, path)
    }
  }
  return [...found]
}

/** Markdown のリンクとバッククォート内のパスが実在するか */
export const findBrokenDocRefs = (docPath: string, text: string): string[] => {
  const refs = [
    ...[...text.matchAll(/\]\(([^)#\s]+)(?:#[^)]*)?\)/g)].map((m) => m[1] ?? ''),
    ...[...text.matchAll(/`((?:src|docs|harness|eval|public)\/[\w./-]+)`/g)].map((m) => m[1] ?? ''),
  ].filter((r) => r && !/^https?:/.test(r))
  return refs
    .filter((r) => !existsSync(r.startsWith('src/') || r.startsWith('harness/') || r.startsWith('eval/') || r.startsWith('public/') || r.startsWith('docs/') ? join(ROOT, r) : resolve(dirname(docPath), r)))
    .map((r) => `${rel(docPath)} → ${r}`)
}

const main = () => {
  const code = walk(join(ROOT, 'src'), /\.tsx?$/).filter((f) => !f.includes('.test.'))
  const sources = code.map((path) => ({ path: rel(path), text: readFileSync(path, 'utf8') }))
  const docs = [join(ROOT, 'AGENTS.md'), ...walk(join(ROOT, 'docs'), /\.md$/)]

  const sections: [string, string[]][] = [
    ['未使用コード（knip）', checkDeadCode().issues.map((i) => `${i.file}${i.line ? `:${i.line}` : ''} ${i.rule} ${i.message}`)],
    ['重複ロジック候補', findDuplicates(sources)],
    ['壊れたドキュメント参照', docs.flatMap((d) => findBrokenDocRefs(d, readFileSync(d, 'utf8')))],
    ['肥大化しつつあるファイル（150 行超）', sources.filter((s) => s.text.split('\n').length > 150).map((s) => `${s.path} (${s.text.split('\n').length} 行)`)],
    ['TODO/FIXME', sources.flatMap((s) => s.text.split('\n').flatMap((l, i) => (/\b(TODO|FIXME|HACK)\b/.test(l) ? [`${s.path}:${i + 1} ${l.trim()}`] : [])))],
    ['AGENTS.md の肥大（60 行超は地図ではなく百科事典化の兆候）', readFileSync(join(ROOT, 'AGENTS.md'), 'utf8').split('\n').length > 60 ? ['AGENTS.md'] : []],
  ]
  const total = sections.reduce((n, [, items]) => n + items.length, 0)
  const report = [
    `# Entropy report — ${new Date().toISOString().slice(0, 10)}`,
    '',
    `指摘 ${total} 件。janitor エージェントが上から最大 3 件ずつ処理する（.claude/agents/janitor.md）。`,
    '',
    ...sections.flatMap(([title, items]) => [`## ${title} (${items.length})`, ...(items.length ? items.map((i) => `- ${i}`) : ['- なし']), '']),
  ].join('\n')
  mkdirSync(join(ROOT, '.harness'), { recursive: true })
  writeFileSync(join(ROOT, '.harness/entropy-report.md'), report)
  console.log(report)
  if (process.argv.includes('--strict') && total > 0) process.exit(1)
}

if (process.argv[1]?.endsWith('entropy.ts')) main()
