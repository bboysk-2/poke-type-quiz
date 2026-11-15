import type { FC } from 'hono/jsx'
import { ErrorNotice } from '../organisms/ErrorNotice'
import { BaseLayout } from '../templates/BaseLayout'

export interface ErrorPageProps {
  title: string
  message: string
}

export const ErrorPage: FC<ErrorPageProps> = ({ title, message }) => (
  <BaseLayout title={title} page="error">
    <ErrorNotice title={title} message={message} />
  </BaseLayout>
)
