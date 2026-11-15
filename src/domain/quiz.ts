import type { Pokemon } from './pokemon'
import { POKEMON_TYPES, type PokemonTypeId } from './pokemonType'
import { randomInt, shuffle, type Random } from './random'

export const QUESTION_COUNT = 10
export const CHOICE_COUNT = 4

export interface Question {
  pokemon: Pokemon
  /** 正解（pokemon.types のいずれか）をちょうど1つ含む 4 択 */
  choices: PokemonTypeId[]
  answer: PokemonTypeId | null
}

export interface QuizState {
  questions: Question[]
  currentIndex: number
}

export type QuizPhase = 'answering' | 'reviewing' | 'finished'

/** 正解1つ + そのポケモンが持たないタイプ3つ をシャッフルした選択肢を作る */
export const createChoices = (pokemon: Pokemon, random: Random): PokemonTypeId[] => {
  const correct = pokemon.types[randomInt(random, pokemon.types.length)]
  if (correct === undefined) throw new Error(`Pokemon #${pokemon.id} has no types`)
  const distractors = shuffle(
    POKEMON_TYPES.map((t) => t.id).filter((id) => !pokemon.types.includes(id)),
    random,
  ).slice(0, CHOICE_COUNT - 1)
  return shuffle([correct, ...distractors], random)
}

export const createQuiz = (pokemons: readonly Pokemon[], random: Random): QuizState => ({
  questions: pokemons.map((pokemon) => ({ pokemon, choices: createChoices(pokemon, random), answer: null })),
  currentIndex: 0,
})

/** 1..max から重複なしで count 個 */
export const pickPokemonIds = (random: Random, count: number, max: number): number[] => {
  if (count > max) throw new Error(`count(${count}) must be <= max(${max})`)
  const ids = new Set<number>()
  while (ids.size < count) ids.add(randomInt(random, max) + 1)
  return [...ids]
}

export const isCorrect = (question: Question): boolean =>
  question.answer !== null && question.pokemon.types.includes(question.answer)

export const currentQuestion = (state: QuizState): Question | undefined =>
  state.questions[state.currentIndex]

export const phaseOf = (state: QuizState): QuizPhase => {
  const q = currentQuestion(state)
  if (!q) return 'finished'
  return q.answer === null ? 'answering' : 'reviewing'
}

/** 回答を記録する。回答済み・選択肢外の回答は無視（二重送信対策） */
export const answer = (state: QuizState, choice: PokemonTypeId): QuizState => {
  const q = currentQuestion(state)
  if (!q || q.answer !== null || !q.choices.includes(choice)) return state
  const questions = state.questions.map((item, i) => (i === state.currentIndex ? { ...item, answer: choice } : item))
  return { ...state, questions }
}

/** 回答済みのときだけ次の問題へ進む */
export const next = (state: QuizState): QuizState =>
  phaseOf(state) === 'reviewing' ? { ...state, currentIndex: state.currentIndex + 1 } : state

export interface QuizResult {
  total: number
  correct: number
  /** 0〜100 の整数（四捨五入） */
  accuracy: number
  rank: { title: string; message: string }
}

const RANKS: { min: number; title: string; message: string }[] = [
  { min: 100, title: 'タイプマスター', message: '全問正解！ タイプ相性の達人です。' },
  { min: 80, title: 'エリートトレーナー', message: 'あと一歩で満点。見事な観察眼です。' },
  { min: 50, title: 'ベテラントレーナー', message: 'なかなかの腕前。苦手なタイプを復習しよう。' },
  { min: 20, title: 'ルーキートレーナー', message: '伸びしろたっぷり。もう一度挑戦！' },
  { min: 0, title: 'たんけんか見習い', message: '見た目の色や形がヒントになるよ。' },
]

export const summarize = (state: QuizState): QuizResult => {
  const total = state.questions.length
  const correct = state.questions.filter(isCorrect).length
  const accuracy = total === 0 ? 0 : Math.round((correct / total) * 100)
  const rank = RANKS.find((r) => accuracy >= r.min) ?? RANKS[RANKS.length - 1]
  return { total, correct, accuracy, rank: { title: rank?.title ?? '', message: rank?.message ?? '' } }
}
