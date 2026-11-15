import type { FC } from 'hono/jsx'

export const Logo: FC = () => (
  <span class="logo">
    <svg class="logo__mark" viewBox="0 0 32 32" aria-hidden="true">
      <circle cx="16" cy="16" r="14" fill="none" stroke="currentColor" stroke-width="3" />
      <path d="M2 16h9M21 16h9" stroke="currentColor" stroke-width="3" />
      <circle cx="16" cy="16" r="5" fill="none" stroke="currentColor" stroke-width="3" />
    </svg>
    <span class="logo__text">
      タイプ<em>当て</em>クイズ
    </span>
  </span>
)
