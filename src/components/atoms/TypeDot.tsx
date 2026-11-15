import type { FC } from 'hono/jsx'
import type { PokemonTypeId } from '../../domain/pokemonType'

export interface TypeDotProps {
  type: PokemonTypeId
}

/** タイプ色の丸アイコン（装飾） */
export const TypeDot: FC<TypeDotProps> = ({ type }) => (
  <span class="type-dot" style={`--type-color: var(--type-${type})`} aria-hidden="true" />
)
