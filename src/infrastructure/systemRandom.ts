import type { Random } from '../domain/random'

/** 本番用の乱数。Math.random は lint で禁止しているため crypto を使う */
export const systemRandom: Random = () => (crypto.getRandomValues(new Uint32Array(1))[0] ?? 0) / 4294967296
