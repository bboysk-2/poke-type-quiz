import type { Child, FC } from 'hono/jsx'
import { SiteHeader } from '../organisms/SiteHeader'

export interface BaseLayoutProps {
  title: string
  children: Child
  /** body に付けるページ識別クラス */
  page: 'top' | 'quiz' | 'result' | 'error'
}

export const BaseLayout: FC<BaseLayoutProps> = ({ title, children, page }) => (
  <html lang="ja">
    <head>
      <meta charset="utf-8" />
      <meta name="viewport" content="width=device-width, initial-scale=1" />
      <meta name="color-scheme" content="light dark" />
      <title>{title} | タイプ当てクイズ</title>
      <link rel="preconnect" href="https://fonts.googleapis.com" />
      <link rel="preconnect" href="https://fonts.gstatic.com" crossorigin="anonymous" />
      <link rel="stylesheet" href="https://fonts.googleapis.com/css2?family=M+PLUS+Rounded+1c:wght@500;700;800&display=swap" />
      <link rel="stylesheet" href="/static/styles.css" />
      <script src="/static/app.js" defer />
    </head>
    <body class={`page page--${page}`}>
      <div class="backdrop" aria-hidden="true" />
      <SiteHeader />
      <main class="main">{children}</main>
      <footer class="site-footer">
        データ: <a href="https://pokeapi.co/">PokéAPI</a>（非公式ファンメイド）
      </footer>
    </body>
  </html>
)
