// SessionStart: 新しい/クリア後/圧縮後のセッションに「状態」だけを注入する（stdout はコンテキストに追加される）
import { writeSummary } from '../compact'

console.log(['[harness] 前回までの状態です。詳細は AGENTS.md の地図から辿ってください。', '', writeSummary()].join('\n'))
