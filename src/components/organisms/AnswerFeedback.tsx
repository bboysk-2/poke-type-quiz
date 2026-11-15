import type { FC } from 'hono/jsx'
import type { PokemonTypeId } from '../../domain/pokemonType'
import { Button } from '../atoms/Button'
import { TypeBadge } from '../atoms/TypeBadge'
import { Verdict } from '../atoms/Verdict'

export interface AnswerFeedbackProps {
  correct: boolean
  pokemonName: string
  types: PokemonTypeId[]
  isLast: boolean
}

export const AnswerFeedback: FC<AnswerFeedbackProps> = ({ correct, pokemonName, types, isLast }) => (
  <section class="answer-feedback" aria-live="polite">
    <Verdict correct={correct} />
    <p class="answer-feedback__text">
      <strong>{pokemonName}</strong> は
      {types.map((t) => (
        <TypeBadge type={t} size="sm" />
      ))}
      タイプ{types.length > 1 ? '（どちらを選んでも正解）' : ''}
    </p>
    <form method="post" action="/quiz/next">
      <Button autofocus>{isLast ? '結果を見る' : '次の問題へ'} →</Button>
    </form>
  </section>
)
