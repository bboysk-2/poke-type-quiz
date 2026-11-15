import type { PokemonTypeId } from './pokemonType'

export interface Pokemon {
  id: number
  /** 日本語名（取得できなければ英語名） */
  name: string
  imageUrl: string
  /** 1〜2 個。順序は PokeAPI の slot 順 */
  types: PokemonTypeId[]
}

/** 全国図鑑の最大番号（第9世代まで） */
export const MAX_POKEDEX_ID = 1025
