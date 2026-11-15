import type { FC } from 'hono/jsx'
import { isCorrect, type QuizState } from '../../domain/quiz'
import { QuizProgress } from '../molecules/QuizProgress'
import { AnswerFeedback } from '../organisms/AnswerFeedback'
import { ChoiceGrid } from '../organisms/ChoiceGrid'
import { QuestionCard } from '../organisms/QuestionCard'
import { BaseLayout } from '../templates/BaseLayout'

export interface QuizPageProps {
  state: QuizState
}

export const QuizPage: FC<QuizPageProps> = ({ state }) => {
  const question = state.questions[state.currentIndex]
  if (!question) return null
  const total = state.questions.length
  const answered = question.answer !== null
  const correct = isCorrect(question)
  const correctSoFar = state.questions.slice(0, state.currentIndex + (answered ? 1 : 0)).filter(isCorrect).length

  return (
    <BaseLayout title={`第${state.currentIndex + 1}問`} page="quiz">
      <div class="quiz">
        <QuizProgress number={state.currentIndex + 1} total={total} correct={correctSoFar} />
        <div class="quiz__body">
          <QuestionCard pokemon={question.pokemon} revealed={answered} {...(answered ? { result: correct ? 'correct' : 'wrong' } : {})} />
          <div class="quiz__panel">
            <ChoiceGrid question={question} />
            {answered && <AnswerFeedback correct={correct} pokemonName={question.pokemon.name} types={question.pokemon.types} isLast={state.currentIndex === total - 1} />}
          </div>
        </div>
      </div>
    </BaseLayout>
  )
}
