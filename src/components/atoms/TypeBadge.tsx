import type { FC } from 'hono/jsx'
import { typeLabel, type PokemonTypeId } from '../../domain/pokemonType'

export interface TypeBadgeProps {
  type: PokemonTypeId
  size?: 'sm' | 'md'
}

export const TypeBadge: FC<TypeBadgeProps> = ({ type, size = 'md' }) => (
  <span class={`type-badge type-badge--${size}`} style={`--type-color: var(--type-${type})`}>
    {typeLabel(type)}
  </span>
)
