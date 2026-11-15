import type { FC } from 'hono/jsx'
import type { PokemonTypeId } from '../../domain/pokemonType'
import { PokemonImage } from '../atoms/PokemonImage'
import { TypeBadge } from '../atoms/TypeBadge'

export interface ResultRowProps {
  number: number
  name: string
  imageUrl: string
  types: PokemonTypeId[]
  answer: PokemonTypeId | null
  correct: boolean
}

export const ResultRow: FC<ResultRowProps> = ({ number, name, imageUrl, types, answer, correct }) => (
  <li class={`result-row result-row--${correct ? 'correct' : 'wrong'}`} style={`--delay: ${number * 50}ms`}>
    <span class="result-row__mark" aria-label={correct ? '正解' : '不正解'}>{correct ? '◯' : '✕'}</span>
    <PokemonImage src={imageUrl} alt={name} size="sm" />
    <span class="result-row__body">
      <span class="result-row__name">{name}</span>
      <span class="result-row__types">
        {types.map((t) => (
          <TypeBadge type={t} size="sm" />
        ))}
      </span>
    </span>
    {!correct && answer && (
      <span class="result-row__answer">
        回答
        <TypeBadge type={answer} size="sm" />
      </span>
    )}
  </li>
)
