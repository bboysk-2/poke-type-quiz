import type { FC } from 'hono/jsx'
import { QUESTION_COUNT } from '../../domain/quiz'
import { Hero } from '../organisms/Hero'
import { BaseLayout } from '../templates/BaseLayout'

export const TopPage: FC = () => (
  <BaseLayout title="スタート" page="top">
    <Hero questionCount={QUESTION_COUNT} />
  </BaseLayout>
)
