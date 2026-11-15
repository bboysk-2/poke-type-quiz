import type { FC } from 'hono/jsx'
import { typeLabel, type PokemonTypeId } from '../../domain/pokemonType'
import { TypeDot } from '../atoms/TypeDot'

export type ChoiceState = 'idle' | 'correct' | 'wrong' | 'dimmed'

export interface ChoiceButtonProps {
  type: PokemonTypeId
  index: number
  state: ChoiceState
}

/** 4 択の 1 つ。idle のときだけ押せる（name="answer" で送信） */
export const ChoiceButton: FC<ChoiceButtonProps> = ({ type, index, state }) => (
  <button
    type="submit"
    name="answer"
    value={type}
    class={`choice choice--${state}`}
    style={`--type-color: var(--type-${type}); --delay: ${index * 60}ms`}
    disabled={state !== 'idle'}
    aria-keyshortcuts={String(index + 1)}
  >
    <span class="choice__key" aria-hidden="true">{index + 1}</span>
    <TypeDot type={type} />
    <span class="choice__label">{typeLabel(type)}</span>
    {state === 'correct' && <span class="choice__mark" aria-label="正解">◯</span>}
    {state === 'wrong' && <span class="choice__mark" aria-label="あなたの回答">✕</span>}
  </button>
)
