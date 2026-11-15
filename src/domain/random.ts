/** [0, 1) の乱数を返す関数。副作用を注入可能にするためのポート */
export type Random = () => number

/** 再現可能な乱数（mulberry32）。テストで使う */
export const seededRandom = (seed: number): Random => {
  let a = seed >>> 0
  return () => {
    a = (a + 0x6d2b79f5) >>> 0
    let t = a
    t = Math.imul(t ^ (t >>> 15), t | 1)
    t ^= t + Math.imul(t ^ (t >>> 7), t | 61)
    return ((t ^ (t >>> 14)) >>> 0) / 4294967296
  }
}

export const randomInt = (random: Random, maxExclusive: number): number =>
  Math.floor(random() * maxExclusive)

/** Fisher–Yates。元の配列は変更しない */
export const shuffle = <T>(items: readonly T[], random: Random): T[] => {
  const result = [...items]
  for (let i = result.length - 1; i > 0; i--) {
    const j = randomInt(random, i + 1)
    const tmp = result[i] as T
    result[i] = result[j] as T
    result[j] = tmp
  }
  return result
}
