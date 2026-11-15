import { describe, expect, it } from 'vitest'
import type { Pokemon } from '../domain/pokemon'
import type { PokemonRepository, QuizSessionStore } from '../domain/ports'
import { phaseOf, type QuizState } from '../domain/quiz'
import { seededRandom } from '../domain/random'
import { createQuizService } from './quizService'

const fakeRepo = (failIds: number[] = []): PokemonRepository => ({
  findById: (id) =>
    failIds.includes(id)
      ? Promise.reject(new Error('boom'))
      : Promise.resolve<Pokemon>({ id, name: `p${id}`, imageUrl: `${id}.png`, types: ['water'] }),
})

const setup = (repository = fakeRepo()) => {
  const map = new Map<string, QuizState>()
  const store: QuizSessionStore = { get: (k) => map.get(k), save: (k, v) => map.set(k, v), delete: (k) => map.delete(k) }
  let n = 0
  const service = createQuizService({ repository, store, random: seededRandom(7), newSessionId: () => `s${++n}`, maxPokemonId: 30 })
  return { service, store }
}

describe('quizService', () => {
  it('start で10問のクイズを作り保存する', async () => {
    const { service } = setup()
    const id = await service.start()
    const state = service.get(id)
    expect(state?.questions).toHaveLength(10)
    expect(new Set(state?.questions.map((q) => q.pokemon.id)).size).toBe(10)
  })

  it('取得に失敗した ID は別のポケモンで補充する', async () => {
    const { service } = setup(fakeRepo([1, 2, 3, 4, 5, 6, 7, 8]))
    const state = service.get(await service.start())
    expect(state?.questions).toHaveLength(10)
  })

  it('answer → next で状態が進む。未知のセッションは undefined', async () => {
    const { service } = setup()
    const id = await service.start()
    const choice = service.get(id)?.questions[0]?.choices[0]
    if (!choice) throw new Error('no choice')
    const answered = service.answer(id, choice)
    expect(answered && phaseOf(answered)).toBe('reviewing')
    expect(service.next(id)?.currentIndex).toBe(1)
    expect(service.answer('unknown', choice)).toBeUndefined()
  })
})
