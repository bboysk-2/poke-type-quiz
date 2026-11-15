import type { FC } from 'hono/jsx'
import type { Question } from '../../domain/quiz'
import { ChoiceButton, type ChoiceState } from '../molecules/ChoiceButton'

export interface ChoiceGridProps {
  question: Question
}

const stateOf = (question: Question, choice: Question['choices'][number]): ChoiceState => {
  if (question.answer === null) return 'idle'
  if (question.pokemon.types.includes(choice)) return 'correct'
  return choice === question.answer ? 'wrong' : 'dimmed'
}

export const ChoiceGrid: FC<ChoiceGridProps> = ({ question }) => (
  <form method="post" action="/quiz/answer" class="choice-grid" data-quiz-choices>
    <p class="choice-grid__prompt">このポケモンのタイプは？</p>
    <div class="choice-grid__options">
      {question.choices.map((choice, i) => (
        <ChoiceButton type={choice} index={i} state={stateOf(question, choice)} />
      ))}
    </div>
  </form>
)
