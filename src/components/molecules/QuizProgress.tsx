import type { FC } from 'hono/jsx'
import { ProgressBar } from '../atoms/ProgressBar'

export interface QuizProgressProps {
  /** 1 始まりの問題番号 */
  number: number
  total: number
  correct: number
}

export const QuizProgress: FC<QuizProgressProps> = ({ number, total, correct }) => (
  <div class="quiz-progress">
    <div class="quiz-progress__meta">
      <span class="quiz-progress__count">
        Q<strong>{number}</strong>
        <span class="quiz-progress__total">/ {total}</span>
      </span>
      <span class="quiz-progress__score">正解 {correct}</span>
    </div>
    <ProgressBar ratio={(number - 1) / total} label={`${total}問中${number}問目`} />
  </div>
)
