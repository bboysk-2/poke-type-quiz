import { describe, expect, it, vi } from 'vitest'
import { PokeApiRepository, toPokemon } from './pokeApiRepository'

const pokemonJson = {
  id: 6,
  name: 'charizard',
  types: [{ slot: 1, type: { name: 'fire' } }, { slot: 2, type: { name: 'flying' } }],
  sprites: { front_default: 'front.png', other: { 'official-artwork': { front_default: 'art.png' } } },
}
const speciesJson = { names: [{ name: 'Charizard', language: { name: 'en' } }, { name: 'リザードン', language: { name: 'ja' } }] }

describe('toPokemon', () => {
  it('日本語名・公式アートワーク・タイプを取り出す', () => {
    expect(toPokemon(pokemonJson, speciesJson)).toEqual({ id: 6, name: 'リザードン', imageUrl: 'art.png', types: ['fire', 'flying'] })
  })
  it('日本語名がなければ英語名、アートワークがなければ front_default', () => {
    const noArt = { ...pokemonJson, sprites: { front_default: 'front.png' } }
    expect(toPokemon(noArt, {})).toMatchObject({ name: 'charizard', imageUrl: 'front.png' })
  })
  it('必須項目が欠けていればエラー', () => {
    expect(() => toPokemon({ id: 1, name: 'x', types: [] }, {})).toThrow(/missing/)
  })
})

describe('PokeApiRepository', () => {
  const okFetch = () =>
    vi.fn((url: string) =>
      Promise.resolve(new Response(JSON.stringify(url.includes('species') ? speciesJson : pokemonJson))),
    )

  it('pokemon と species を取得し、2回目はキャッシュを使う', async () => {
    const fetch = okFetch()
    const repo = new PokeApiRepository({ fetch, baseUrl: 'http://api' })
    await repo.findById(6)
    await repo.findById(6)
    expect(fetch).toHaveBeenCalledTimes(2)
    expect(fetch.mock.calls.map((c) => c[0]).sort()).toEqual(['http://api/pokemon-species/6', 'http://api/pokemon/6'])
  })

  it('HTTP エラーは reject し、キャッシュしない', async () => {
    const fetch = vi.fn(() => Promise.resolve(new Response('', { status: 500 })))
    const repo = new PokeApiRepository({ fetch })
    await expect(repo.findById(1)).rejects.toThrow(/500/)
    await expect(repo.findById(1)).rejects.toThrow()
    expect(fetch).toHaveBeenCalledTimes(4)
  })
})
