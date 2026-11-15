import { describe, expect, it } from 'vitest'
import type { Pokemon } from './pokemon'
import { answer, createChoices, createQuiz, isCorrect, next, phaseOf, pickPokemonIds, summarize } from './quiz'
import { seededRandom } from './random'

const pikachu: Pokemon = { id: 25, name: 'ピカチュウ', imageUrl: 'x', types: ['electric'] }
const charizard: Pokemon = { id: 6, name: 'リザードン', imageUrl: 'x', types: ['fire', 'flying'] }

describe('createChoices', () => {
  it.each(Array.from({ length: 50 }, (_, seed) => seed))('正解をちょうど1つ含む4択を作る (seed=%i)', (seed) => {
    const choices = createChoices(charizard, seededRandom(seed))
    expect(choices).toHaveLength(4)
    expect(new Set(choices).size).toBe(4)
    expect(choices.filter((c) => charizard.types.includes(c))).toHaveLength(1)
  })
})

describe('pickPokemonIds', () => {
  it('範囲内の重複しない ID を返す', () => {
    const ids = pickPokemonIds(seededRandom(1), 10, 1025)
    expect(new Set(ids).size).toBe(10)
    expect(ids.every((id) => id >= 1 && id <= 1025)).toBe(true)
  })
  it('count > max はエラー', () => {
    expect(() => pickPokemonIds(seededRandom(1), 3, 2)).toThrow()
  })
})

describe('quiz progression', () => {
  const start = () => createQuiz([pikachu, charizard], seededRandom(42))

  it('回答 → 次へ → 終了 と遷移する', () => {
    let s = start()
    expect(phaseOf(s)).toBe('answering')
    expect(next(s)).toBe(s) // 未回答では進めない
    s = answer(s, 'electric')
    expect(phaseOf(s)).toBe('reviewing')
    expect(answer(s, 'water')).toBe(s) // 二重回答は無視
    s = next(s)
    const wrong = s.questions[1]?.choices.find((c) => !charizard.types.includes(c))
    if (!wrong) throw new Error('distractor missing')
    s = next(answer(s, wrong))
    expect(phaseOf(s)).toBe('finished')
    expect(s.questions.map(isCorrect)).toEqual([true, false])
  })

  it('選択肢にない回答は無視する', () => {
    const s = start()
    const outside = (['normal', 'fire', 'water', 'grass', 'ice'] as const).find((t) => !s.questions[0]?.choices.includes(t))
    if (!outside) throw new Error('no outside choice')
    expect(answer(s, outside)).toBe(s)
  })
})

describe('summarize', () => {
  it('正答率を四捨五入した整数で返す', () => {
    const s = createQuiz([pikachu, pikachu, charizard], seededRandom(3))
    const answered = { ...s, questions: s.questions.map((q, i) => ({ ...q, answer: i === 2 ? ('water' as const) : ('electric' as const) })) }
    expect(summarize(answered)).toMatchObject({ total: 3, correct: 2, accuracy: 67 })
  })
  it('満点ならタイプマスター', () => {
    const s = answer(createQuiz([pikachu], seededRandom(1)), 'electric')
    expect(summarize(s).rank.title).toBe('タイプマスター')
  })
})
