// PreCompact: 自動/手動圧縮の直前に状態要約を保存する。圧縮後の SessionStart(compact) で再注入される
import { writeSummary } from '../compact'

writeSummary()
