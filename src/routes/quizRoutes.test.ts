import { describe, expect, it } from 'vitest'
import { createApp } from '../app'
import type { Pokemon } from '../domain/pokemon'
import type { PokemonRepository } from '../domain/ports'
import { seededRandom } from '../domain/random'
import { MemoryQuizSessionStore } from '../infrastructure/memoryQuizSessionStore'

const repository: PokemonRepository = {
  findById: (id) => Promise.resolve<Pokemon>({ id, name: `ポケ${id}`, imageUrl: `https://img/${id}.png`, types: ['grass', 'poison'] }),
}

const setup = (repo = repository) => {
  const store = new MemoryQuizSessionStore()
  const app = createApp({ repository: repo, store, random: seededRandom(1), newSessionId: () => 'sid' })
  const cookie = 'quiz_sid=sid'
  const post = (path: string, form: Record<string, string> = {}) =>
    app.request(path, { method: 'POST', body: new URLSearchParams(form), headers: { cookie } })
  const get = (path: string) => app.request(path, { headers: { cookie } })
  return { app, store, post, get }
}

const choicesIn = (html: string) => [...html.matchAll(/name="answer" value="([a-z]+)"/g)].map((m) => m[1] ?? '')

describe('quiz routes', () => {
  it('トップページにスタートボタンがある', async () => {
    const res = await setup().app.request('/')
    const html = await res.text()
    expect(html.startsWith('<!DOCTYPE html>')).toBe(true)
    expect(html).toContain('action="/quiz/start"')
  })

  it('10問遊ぶと正答率が表示される（受け入れ基準 1〜4）', async () => {
    const { post, get } = setup()
    const start = await post('/quiz/start')
    expect(start.status).toBe(303)
    expect(start.headers.get('set-cookie')).toContain('quiz_sid=sid')

    for (let i = 0; i < 10; i++) {
      const html = await (await get('/quiz')).text()
      expect(html).toContain('https://img/')
      const choices = choicesIn(html)
      expect(choices).toHaveLength(4)
      expect(choices.filter((c) => c === 'grass' || c === 'poison')).toHaveLength(1)
      // 偶数問は正解、奇数問は不正解を選ぶ
      const pick = choices.find((c) => (i % 2 === 0) === (c === 'grass' || c === 'poison')) ?? ''
      await post('/quiz/answer', { answer: pick })
      const reviewed = await (await get('/quiz')).text()
      expect(reviewed).toContain(i % 2 === 0 ? 'せいかい！' : 'ざんねん…')
      expect(reviewed).toMatch(/ポケ\d+/)
      const next = await post('/quiz/next')
      expect(next.headers.get('location')).toBe(i === 9 ? '/result' : '/quiz')
    }

    const result = await (await get('/result')).text()
    expect(result).toContain('正答率 50%')
    expect(result.match(/class="result-row /g)).toHaveLength(10)
  })

  it('不正な回答値は無視される', async () => {
    const { post, get } = setup()
    await post('/quiz/start')
    await post('/quiz/answer', { answer: '<script>' })
    expect(await (await get('/quiz')).text()).not.toContain('せいかい')
  })

  it('セッションがなければトップへ、未完了で /result はクイズへ戻す', async () => {
    const { app, post, get } = setup()
    expect((await app.request('/quiz')).headers.get('location')).toBe('/')
    await post('/quiz/start')
    expect((await get('/result')).headers.get('location')).toBe('/quiz')
  })

  it('PokeAPI が落ちていたら 502 のエラーページ', async () => {
    const { post } = setup({ findById: () => Promise.reject(new Error('down')) })
    const res = await post('/quiz/start')
    expect(res.status).toBe(502)
    expect(await res.text()).toContain('role="alert"')
  })

  it('存在しないパスは 404', async () => {
    expect((await setup().app.request('/nope')).status).toBe(404)
  })
})
