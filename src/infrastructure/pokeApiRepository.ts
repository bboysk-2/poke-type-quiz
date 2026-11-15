// PokeAPI (https://pokeapi.co) の PokemonRepository 実装。
// 外部入力は信用しない: unknown で受けて型ガードで検証してから domain 型に変換する。
import type { Pokemon } from '../domain/pokemon'
import { isPokemonTypeId, type PokemonTypeId } from '../domain/pokemonType'
import type { PokemonRepository } from '../domain/ports'

type Fetch = (url: string, init?: RequestInit) => Promise<Response>

export interface PokeApiOptions {
  fetch?: Fetch
  baseUrl?: string
  timeoutMs?: number
}

type Json = Record<string, unknown>
const isObject = (v: unknown): v is Json => typeof v === 'object' && v !== null
const prop = (v: unknown, key: string): unknown => (isObject(v) ? v[key] : undefined)
const asArray = (v: unknown): unknown[] => (Array.isArray(v) ? (v as unknown[]) : [])

const parseTypes = (raw: unknown): PokemonTypeId[] =>
  asArray(prop(raw, 'types'))
    .map((t) => prop(prop(t, 'type'), 'name'))
    .filter(isPokemonTypeId)

const parseImage = (raw: unknown): string | undefined => {
  const sprites = prop(raw, 'sprites')
  const artwork: unknown = prop(prop(prop(sprites, 'other'), 'official-artwork'), 'front_default')
  const fallback: unknown = prop(sprites, 'front_default')
  if (typeof artwork === 'string') return artwork
  return typeof fallback === 'string' ? fallback : undefined
}

const parseJapaneseName = (species: unknown): string | undefined => {
  const names = asArray(prop(species, 'names'))
  for (const lang of ['ja', 'ja-hrkt']) {
    const found = names.find((n) => prop(prop(n, 'language'), 'name') === lang)
    const name = prop(found, 'name')
    if (typeof name === 'string') return name
  }
  return undefined
}

/** テスト用に export。PokeAPI の生 JSON を domain の Pokemon に変換する */
export const toPokemon = (pokemon: unknown, species: unknown): Pokemon => {
  const id = prop(pokemon, 'id')
  const englishName = prop(pokemon, 'name')
  const types = parseTypes(pokemon)
  const imageUrl = parseImage(pokemon)
  if (typeof id !== 'number' || typeof englishName !== 'string' || types.length === 0 || !imageUrl) {
    throw new Error(`PokeAPI response is missing required fields (id=${String(id)})`)
  }
  return { id, name: parseJapaneseName(species) ?? englishName, imageUrl, types }
}

export class PokeApiRepository implements PokemonRepository {
  readonly #fetch: Fetch
  readonly #baseUrl: string
  readonly #timeoutMs: number
  readonly #cache = new Map<number, Promise<Pokemon>>()

  constructor(options: PokeApiOptions = {}) {
    this.#fetch = options.fetch ?? ((url, init) => fetch(url, init))
    this.#baseUrl = options.baseUrl ?? 'https://pokeapi.co/api/v2'
    this.#timeoutMs = options.timeoutMs ?? 8000
  }

  findById(id: number): Promise<Pokemon> {
    const cached = this.#cache.get(id)
    if (cached) return cached
    const pending = this.#load(id)
    this.#cache.set(id, pending)
    pending.catch(() => this.#cache.delete(id)) // 失敗はキャッシュしない
    return pending
  }

  async #load(id: number): Promise<Pokemon> {
    const [pokemon, species] = await Promise.all([this.#get(`/pokemon/${id}`), this.#get(`/pokemon-species/${id}`)])
    return toPokemon(pokemon, species)
  }

  async #get(path: string): Promise<unknown> {
    const res = await this.#fetch(`${this.#baseUrl}${path}`, { signal: AbortSignal.timeout(this.#timeoutMs) })
    if (!res.ok) throw new Error(`PokeAPI ${path} responded ${res.status}`)
    return res.json()
  }
}
