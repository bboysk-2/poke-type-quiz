import type { QuizSessionStore } from '../domain/ports'
import type { QuizState } from '../domain/quiz'

/** プロセス内メモリのセッションストア。上限を超えたら古いものから捨てる */
export class MemoryQuizSessionStore implements QuizSessionStore {
  readonly #sessions = new Map<string, QuizState>()

  constructor(private readonly maxSessions = 1000) {}

  get(sessionId: string): QuizState | undefined {
    return this.#sessions.get(sessionId)
  }

  save(sessionId: string, state: QuizState): void {
    this.#sessions.delete(sessionId)
    this.#sessions.set(sessionId, state)
    while (this.#sessions.size > this.maxSessions) {
      const oldest = this.#sessions.keys().next().value
      if (oldest === undefined) break
      this.#sessions.delete(oldest)
    }
  }

  delete(sessionId: string): void {
    this.#sessions.delete(sessionId)
  }
}
