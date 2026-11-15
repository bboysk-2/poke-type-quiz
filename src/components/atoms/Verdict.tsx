import type { FC } from 'hono/jsx'

export interface VerdictProps {
  correct: boolean
}

export const Verdict: FC<VerdictProps> = ({ correct }) => (
  <p class={`verdict verdict--${correct ? 'correct' : 'wrong'}`} role="status">
    <span class="verdict__icon" aria-hidden="true">{correct ? '◯' : '✕'}</span>
    {correct ? 'せいかい！' : 'ざんねん…'}
  </p>
)
