// Composition Root: 具象実装を組み立てる唯一の場所。テストでは deps を差し替える。
import { createQuizService, type QuizServiceDeps } from './application/quizService'
import { MemoryQuizSessionStore } from './infrastructure/memoryQuizSessionStore'
import { PokeApiRepository } from './infrastructure/pokeApiRepository'
import { systemRandom } from './infrastructure/systemRandom'
import { quizRoutes } from './routes/quizRoutes'

export const createApp = (overrides: Partial<QuizServiceDeps> = {}) =>
  quizRoutes(
    createQuizService({
      repository: new PokeApiRepository(),
      store: new MemoryQuizSessionStore(),
      random: systemRandom,
      newSessionId: () => crypto.randomUUID(),
      ...overrides,
    }),
  )
