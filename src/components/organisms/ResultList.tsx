import type { FC } from 'hono/jsx'
import { isCorrect, type Question } from '../../domain/quiz'
import { ResultRow } from '../molecules/ResultRow'

export interface ResultListProps {
  questions: Question[]
}

export const ResultList: FC<ResultListProps> = ({ questions }) => (
  <section class="result-list">
    <h2 class="result-list__title">ふりかえり</h2>
    <ol class="result-list__items">
      {questions.map((q, i) => (
        <ResultRow number={i + 1} name={q.pokemon.name} imageUrl={q.pokemon.imageUrl} types={q.pokemon.types} answer={q.answer} correct={isCorrect(q)} />
      ))}
    </ol>
  </section>
)
