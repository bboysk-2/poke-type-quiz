import { describe, expect, it } from 'vitest'
import { checkFile } from './checks/structure'
import { parseTsc } from './checks/tools'
import { hintFor, renderFeedback } from './feedback'

describe('renderFeedback', () => {
  it('失敗時は場所・修正案・規約リンクを含む指示書を出す', () => {
    const md = renderFeedback([
      { gate: 'lint', ok: false, issues: [{ gate: 'lint', file: 'src/a.ts', line: 3, rule: 'no-restricted-imports', message: 'x' }] },
      { gate: 'test', ok: true, issues: [] },
    ])
    expect(md).toContain('FAIL')
    expect(md).toContain('`src/a.ts:3`')
    expect(md).toContain('修正案:')
    expect(md).toContain('docs/architecture.md')
    expect(md).toContain('次にやること')
  })
  it('全通過なら PASS と次の一手', () => {
    expect(renderFeedback([{ gate: 'lint', ok: true, issues: [] }])).toContain('Verify: PASS')
  })
  it('未知のルールは AGENTS.md へ誘導する', () => {
    expect(hintFor('something/unknown').doc).toBe('AGENTS.md')
  })
})

describe('parseTsc', () => {
  it('tsc の出力を Issue に変換する', () => {
    expect(parseTsc("src/a.ts(10,5): error TS2322: Type 'string' is not assignable to type 'number'.")).toEqual([
      { gate: 'typecheck', file: 'src/a.ts', line: 10, rule: 'TS2322', message: "Type 'string' is not assignable to type 'number'." },
    ])
  })
})

describe('checkFile (structure)', () => {
  const rules = (path: string, src: string) => checkFile(path, src).map((i) => i.rule)
  it('コンポーネントの命名・配置・export を検査する', () => {
    expect(rules('src/components/atoms/button.tsx', '')).toContain('naming/component-file')
    expect(rules('src/components/widgets/Foo.tsx', 'export const Foo = 1')).toContain('structure/atomic-layer')
    expect(rules('src/components/atoms/Foo.tsx', 'export const Bar = 1')).toContain('naming/component-export')
    expect(rules('src/components/atoms/Foo.tsx', 'export const Foo = 1')).toEqual([])
  })
  it('非コンポーネントは camelCase', () => {
    expect(rules('src/domain/QuizThing.ts', '')).toContain('naming/module-file')
  })
  it('抑制コメントや skip を検出する', () => {
    const banned = ['// eslint' + '-disable-next-line', '// @ts-' + 'ignore', "it." + "skip('x')"]
    for (const line of banned) expect(checkFile('src/domain/a.ts', line).length).toBe(1)
  })
})
