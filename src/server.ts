import { serve } from '@hono/node-server'
import { serveStatic } from '@hono/node-server/serve-static'
import { createApp } from './app'

const app = createApp()
app.use('/static/*', serveStatic({ root: './public', rewriteRequestPath: (p) => p.replace(/^\/static/, '') }))

const port = Number(process.env['PORT'] ?? 3000)
serve({ fetch: app.fetch, port }, (info) => {
  console.log(`🎮 http://localhost:${info.port}`)
})
