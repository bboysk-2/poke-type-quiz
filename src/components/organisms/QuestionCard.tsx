import type { FC } from 'hono/jsx'
import type { Pokemon } from '../../domain/pokemon'
import { PokemonImage } from '../atoms/PokemonImage'
import { TypeBadge } from '../atoms/TypeBadge'

export interface QuestionCardProps {
  pokemon: Pokemon
  revealed: boolean
  result?: 'correct' | 'wrong'
}

export const QuestionCard: FC<QuestionCardProps> = ({ pokemon, revealed, result }) => (
  <figure class={`question-card${result ? ` question-card--${result}` : ''}`}>
    <div class="question-card__stage">
      <PokemonImage src={pokemon.imageUrl} alt={revealed ? pokemon.name : 'なぞのポケモン'} />
    </div>
    <figcaption class="question-card__caption">
      <span class="question-card__dex">No.{String(pokemon.id).padStart(4, '0')}</span>
      <span class="question-card__name">{revealed ? pokemon.name : '？？？'}</span>
      {revealed && (
        <span class="question-card__types">
          {pokemon.types.map((t) => (
            <TypeBadge type={t} />
          ))}
        </span>
      )}
    </figcaption>
  </figure>
)
