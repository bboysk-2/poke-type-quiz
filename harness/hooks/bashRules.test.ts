import { describe, expect, it } from 'vitest'
import { bashViolation, stripHeredocs } from './bashRules'

const APPROVE = ['pnpm progress', 'approve T2 --by me'].join(' ')

describe('bashViolation', () => {
  it.each([
    [APPROVE],
    [`cd x && ${APPROVE}`],
    ['git commit -m x --no-verify'],
    ['git push origin main --force'],
    ['echo {} > todo.json'],
    ['sed -i "" s/a/b/ progress.md'],
  ])('ブロックする: %s', (cmd) => {
    expect(bashViolation(cmd, false)).toBeDefined()
  })

  it.each([
    ['pnpm progress show'],
    ['git commit -m "fix"'],
    ['cat todo.json'],
    [`cat > docs/x.md <<'EOF'\n人間が \`${APPROVE}\` を実行し、\`--no-verify\` は禁止\nEOF\necho ok`],
  ])('許可する: %s', (cmd) => {
    expect(bashViolation(cmd, false)).toBeUndefined()
  })

  it('自律モードではエージェントの承認を許可する', () => {
    expect(bashViolation(APPROVE, true)).toBeUndefined()
  })
})

describe('stripHeredocs', () => {
  it('本文だけを除去する', () => {
    expect(stripHeredocs("cat > a <<'EOF'\nsecret\nEOF\nls")).toBe('cat > a <<HEREDOC\nls')
  })
})
