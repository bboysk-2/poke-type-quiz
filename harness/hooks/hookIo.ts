// Claude Code フックの入出力ヘルパー。
// 終了コード 2 + stderr = ツール実行をブロックし、その理由をエージェントへの次の入力にする。
import { readFileSync } from 'node:fs'

export interface HookInput {
  hook_event_name?: string
  tool_name?: string
  tool_input?: { file_path?: string; command?: string }
  stop_hook_active?: boolean
  source?: string
}

export const readInput = (): HookInput => {
  try {
    return JSON.parse(readFileSync(0, 'utf8')) as HookInput
  } catch {
    return {}
  }
}

export const block = (message: string): never => {
  process.stderr.write(message + '\n')
  process.exit(2)
}

export const allow = (): never => process.exit(0)
