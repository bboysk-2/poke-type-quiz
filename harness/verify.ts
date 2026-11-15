// 決定論的検証ゲート。ローカル・Stop フック・CI がすべてこれを呼ぶ（単一の真実）。
//   pnpm verify            全ゲート
//   pnpm verify --only lint,typecheck
//   pnpm verify --json     機械可読出力（評価ハーネス用）
// 結果は .harness/feedback.md にも書き出す。終了コード 0 = 全通過。
import { mkdirSync, writeFileSync } from 'node:fs'
import { join } from 'node:path'
import { checkStructure } from './checks/structure'
import { checkDeadCode, checkLint, checkTests, checkTypes } from './checks/tools'
import type { Gate, GateResult } from './checks/types'
import { renderFeedback } from './feedback'
import { ROOT } from './todoStore'

const GATES: Record<Gate, () => GateResult> = {
  structure: checkStructure,
  lint: checkLint,
  typecheck: checkTypes,
  test: checkTests,
  deadcode: checkDeadCode,
}

const args = process.argv.slice(2)
const onlyArg = args[args.indexOf('--only') + 1]
const selected = (args.includes('--only') && onlyArg ? onlyArg.split(',') : Object.keys(GATES)) as Gate[]

mkdirSync(join(ROOT, '.harness'), { recursive: true })
const results = selected.map((gate) => GATES[gate]())
const feedback = renderFeedback(results)
writeFileSync(join(ROOT, '.harness/feedback.md'), feedback)

if (args.includes('--json')) console.log(JSON.stringify({ ok: results.every((r) => r.ok), results }, null, 2))
else console.log(feedback)
process.exit(results.every((r) => r.ok) ? 0 : 1)
