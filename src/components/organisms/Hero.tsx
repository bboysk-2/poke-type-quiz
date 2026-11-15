import type { FC } from 'hono/jsx'
import { POKEMON_TYPES } from '../../domain/pokemonType'
import { Button } from '../atoms/Button'
import { TypeBadge } from '../atoms/TypeBadge'

export interface HeroProps {
  questionCount: number
}

export const Hero: FC<HeroProps> = ({ questionCount }) => (
  <section class="hero">
    <p class="hero__eyebrow">POKEAPI TYPE QUIZ</p>
    <h1 class="hero__title">
      このポケモンの
      <br />
      <span class="hero__accent">タイプ</span>はどれ？
    </h1>
    <p class="hero__lead">
      ランダムに現れるポケモンを見て、4つの選択肢から正しいタイプを1つ選ぼう。全{questionCount}問、最後に正答率を発表します。
    </p>
    <form method="post" action="/quiz/start" class="hero__action">
      <Button size="lg" autofocus>
        クイズをはじめる
      </Button>
    </form>
    <ul class="hero__types" aria-label="登場するタイプ">
      {POKEMON_TYPES.map((t) => (
        <li>
          <TypeBadge type={t.id} size="sm" />
        </li>
      ))}
    </ul>
  </section>
)
