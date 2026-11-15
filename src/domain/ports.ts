import type { Pokemon } from './pokemon'
import type { QuizState } from './quiz'

export interface PokemonRepository {
  findById(id: number): Promise<Pokemon>
}

export interface QuizSessionStore {
  get(sessionId: string): QuizState | undefined
  save(sessionId: string, state: QuizState): void
  delete(sessionId: string): void
}
