import { MAX_POKEDEX_ID, type Pokemon } from '../domain/pokemon'
import type { PokemonTypeId } from '../domain/pokemonType'
import type { PokemonRepository, QuizSessionStore } from '../domain/ports'
import { answer, createQuiz, next, pickPokemonIds, QUESTION_COUNT, type QuizState } from '../domain/quiz'
import type { Random } from '../domain/random'

export interface QuizServiceDeps {
  repository: PokemonRepository
  store: QuizSessionStore
  random: Random
  newSessionId: () => string
  questionCount?: number
  maxPokemonId?: number
}

/** 取得失敗したポケモンは未試行の別 ID で補充する。3 ラウンドで足りなければエラー */
const fetchPokemons = async (deps: QuizServiceDeps, count: number, max: number): Promise<Pokemon[]> => {
  const queue = pickPokemonIds(deps.random, Math.min(max, count * 4), max)
  const result: Pokemon[] = []
  for (let round = 0; round < 3 && result.length < count && queue.length > 0; round++) {
    const batch = queue.splice(0, count - result.length)
    const settled = await Promise.allSettled(batch.map((id) => deps.repository.findById(id)))
    for (const s of settled) if (s.status === 'fulfilled') result.push(s.value)
  }
  if (result.length < count) throw new Error('ポケモンの取得に失敗しました。時間をおいて再度お試しください。')
  return result
}

export const createQuizService = (deps: QuizServiceDeps) => {
  const count = deps.questionCount ?? QUESTION_COUNT
  const max = deps.maxPokemonId ?? MAX_POKEDEX_ID

  const update = (sessionId: string, fn: (s: QuizState) => QuizState): QuizState | undefined => {
    const state = deps.store.get(sessionId)
    if (!state) return undefined
    const updated = fn(state)
    deps.store.save(sessionId, updated)
    return updated
  }

  return {
    async start(): Promise<string> {
      const pokemons = await fetchPokemons(deps, count, max)
      const sessionId = deps.newSessionId()
      deps.store.save(sessionId, createQuiz(pokemons, deps.random))
      return sessionId
    },
    get: (sessionId: string) => deps.store.get(sessionId),
    answer: (sessionId: string, choice: PokemonTypeId) => update(sessionId, (s) => answer(s, choice)),
    next: (sessionId: string) => update(sessionId, next),
  }
}

export type QuizService = ReturnType<typeof createQuizService>
