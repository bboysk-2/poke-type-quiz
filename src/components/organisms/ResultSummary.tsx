import type { FC } from 'hono/jsx'
import type { QuizResult } from '../../domain/quiz'
import { Button } from '../atoms/Button'
import { ScoreRing } from '../atoms/ScoreRing'
import { StatTile } from '../molecules/StatTile'

export interface ResultSummaryProps {
  result: QuizResult
}

export const ResultSummary: FC<ResultSummaryProps> = ({ result }) => (
  <section class="result-summary">
    <p class="result-summary__eyebrow">RESULT</p>
    <ScoreRing percent={result.accuracy} />
    <h1 class="result-summary__rank">{result.rank.title}</h1>
    <p class="result-summary__message">{result.rank.message}</p>
    <div class="result-summary__stats">
      <StatTile label="正答率" value={`${result.accuracy}%`} />
      <StatTile label="正解" value={`${result.correct} / ${result.total}`} />
      <StatTile label="不正解" value={String(result.total - result.correct)} />
    </div>
    <form method="post" action="/quiz/start">
      <Button size="lg" autofocus>
        もう一度あそぶ
      </Button>
    </form>
  </section>
)
