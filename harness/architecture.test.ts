// センサーのテスト: 依存ルール違反が本当に ESLint で検出されることを保証する（ハーネス自体の回帰防止）
import { ESLint } from 'eslint'
import tseslint from 'typescript-eslint'
import { describe, expect, it } from 'vitest'
import { ROOT } from './todoStore'

const eslint = new ESLint({ cwd: ROOT, overrideConfig: [{ ...tseslint.configs.disableTypeChecked, files: ['**/*.ts', '**/*.tsx'] }] })

const restrictedMessages = async (filePath: string, code: string) => {
  const [res] = await eslint.lintText(code, { filePath })
  return (res?.messages ?? []).filter((m) => m.ruleId === 'no-restricted-imports').map((m) => m.message)
}

describe('アーキテクチャ境界', () => {
  it.each([
    ['src/components/atoms/Fake.tsx', "import { X } from '../molecules/X'", 'arch/atoms'],
    ['src/components/molecules/Fake.tsx', "import { X } from '../organisms/X'", 'arch/molecules'],
    ['src/components/organisms/Fake.tsx', "import { X } from '../pages/X'", 'arch/organisms'],
    ['src/components/atoms/Fake.tsx', "import { X } from '../../infrastructure/x'", 'arch/components'],
    ['src/domain/fake.ts', "import { X } from '../infrastructure/x'", 'arch/domain'],
    ['src/domain/fake.ts', "import { Hono } from 'hono'", 'arch/domain'],
    ['src/application/fake.ts', "import { X } from '../routes/x'", 'arch/application'],
    ['src/infrastructure/fake.ts', "import { X } from '../application/x'", 'arch/infrastructure'],
  ])('%s: %s を禁止する', async (file, code, tag) => {
    const messages = await restrictedMessages(file, `${code}\nexport const y = X\n`)
    expect(messages.join('\n')).toContain(`[${tag}]`)
    expect(messages.join('\n')).toContain('docs/architecture.md')
  })

  it.each([
    ['src/components/organisms/Fake.tsx', "import { X } from '../molecules/X'"],
    ['src/components/pages/Fake.tsx', "import { X } from '../templates/X'"],
    ['src/routes/fake.ts', "import { X } from '../infrastructure/x'"],
    ['src/infrastructure/fake.ts', "import { X } from '../domain/x'"],
  ])('%s: %s は許可する', async (file, code) => {
    expect(await restrictedMessages(file, `${code}\nexport const y = X\n`)).toEqual([])
  })
})
