import type { FC } from 'hono/jsx'
import { Logo } from '../atoms/Logo'

export const SiteHeader: FC = () => (
  <header class="site-header">
    <a href="/" class="site-header__home" aria-label="トップへ戻る">
      <Logo />
    </a>
  </header>
)
