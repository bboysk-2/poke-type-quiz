import type { FC } from 'hono/jsx'
import { Button } from '../atoms/Button'

export interface ErrorNoticeProps {
  title: string
  message: string
}

export const ErrorNotice: FC<ErrorNoticeProps> = ({ title, message }) => (
  <section class="error-notice" role="alert">
    <p class="error-notice__icon" aria-hidden="true">!</p>
    <h1 class="error-notice__title">{title}</h1>
    <p class="error-notice__message">{message}</p>
    <form method="post" action="/quiz/start">
      <Button>もう一度はじめる</Button>
    </form>
  </section>
)
