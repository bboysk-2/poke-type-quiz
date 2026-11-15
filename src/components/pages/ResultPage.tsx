import type { FC } from 'hono/jsx'
import { summarize, type QuizState } from '../../domain/quiz'
import { ResultList } from '../organisms/ResultList'
import { ResultSummary } from '../organisms/ResultSummary'
import { BaseLayout } from '../templates/BaseLayout'

export interface ResultPageProps {
  state: QuizState
}

export const ResultPage: FC<ResultPageProps> = ({ state }) => (
  <BaseLayout title="結果" page="result">
    <div class="result">
      <ResultSummary result={summarize(state)} />
      <ResultList questions={state.questions} />
    </div>
  </BaseLayout>
)
