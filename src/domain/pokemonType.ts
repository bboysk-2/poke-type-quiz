/** 18 タイプの定義。色は public/styles.css の --type-* と一致させる */
export const POKEMON_TYPES = [
  { id: 'normal', label: 'ノーマル' },
  { id: 'fire', label: 'ほのお' },
  { id: 'water', label: 'みず' },
  { id: 'electric', label: 'でんき' },
  { id: 'grass', label: 'くさ' },
  { id: 'ice', label: 'こおり' },
  { id: 'fighting', label: 'かくとう' },
  { id: 'poison', label: 'どく' },
  { id: 'ground', label: 'じめん' },
  { id: 'flying', label: 'ひこう' },
  { id: 'psychic', label: 'エスパー' },
  { id: 'bug', label: 'むし' },
  { id: 'rock', label: 'いわ' },
  { id: 'ghost', label: 'ゴースト' },
  { id: 'dragon', label: 'ドラゴン' },
  { id: 'dark', label: 'あく' },
  { id: 'steel', label: 'はがね' },
  { id: 'fairy', label: 'フェアリー' },
] as const

export type PokemonTypeId = (typeof POKEMON_TYPES)[number]['id']

const TYPE_IDS: readonly string[] = POKEMON_TYPES.map((t) => t.id)

export const isPokemonTypeId = (value: unknown): value is PokemonTypeId =>
  typeof value === 'string' && TYPE_IDS.includes(value)

export const typeLabel = (id: PokemonTypeId): string =>
  POKEMON_TYPES.find((t) => t.id === id)?.label ?? id
