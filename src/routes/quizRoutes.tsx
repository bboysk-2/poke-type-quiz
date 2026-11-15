import type { Context } from 'hono'
import { Hono } from 'hono'
import { getCookie, setCookie } from 'hono/cookie'
import { html } from 'hono/html'
import type { JSX } from 'hono/jsx/jsx-runtime'
import type { QuizService } from '../application/quizService'
import { ErrorPage } from '../components/pages/ErrorPage'
import { QuizPage } from '../components/pages/QuizPage'
import { ResultPage } from '../components/pages/ResultPage'
import { TopPage } from '../components/pages/TopPage'
import { isPokemonTypeId } from '../domain/pokemonType'
import { phaseOf } from '../domain/quiz'

export const SESSION_COOKIE = 'quiz_sid'

const render = (c: Context, node: JSX.Element, status: 200 | 404 | 502 = 200) =>
  c.html(html`<!DOCTYPE html>${node}`, status)

const sessionOf = (c: Context): string | undefined => getCookie(c, SESSION_COOKIE)

export const quizRoutes = (service: QuizService) => {
  const app = new Hono()

  app.get('/', (c) => render(c, <TopPage />))

  app.post('/quiz/start', async (c) => {
    try {
      const sessionId = await service.start()
      setCookie(c, SESSION_COOKIE, sessionId, { httpOnly: true, sameSite: 'Lax', path: '/' })
      return c.redirect('/quiz', 303)
    } catch {
      return render(c, <ErrorPage title="ポケモンを呼び出せませんでした" message="PokéAPI との通信に失敗しました。少し待ってからもう一度お試しください。" />, 502)
    }
  })

  app.get('/quiz', (c) => {
    const state = service.get(sessionOf(c) ?? '')
    if (!state) return c.redirect('/', 303)
    if (phaseOf(state) === 'finished') return c.redirect('/result', 303)
    return render(c, <QuizPage state={state} />)
  })

  app.post('/quiz/answer', async (c) => {
    const body = await c.req.parseBody()
    const choice = body['answer']
    if (isPokemonTypeId(choice)) service.answer(sessionOf(c) ?? '', choice)
    return c.redirect('/quiz', 303)
  })

  app.post('/quiz/next', (c) => {
    const state = service.next(sessionOf(c) ?? '')
    return c.redirect(state && phaseOf(state) === 'finished' ? '/result' : '/quiz', 303)
  })

  app.get('/result', (c) => {
    const state = service.get(sessionOf(c) ?? '')
    if (!state) return c.redirect('/', 303)
    if (phaseOf(state) !== 'finished') return c.redirect('/quiz', 303)
    return render(c, <ResultPage state={state} />)
  })

  app.notFound((c) => render(c, <ErrorPage title="ページが見つかりません" message="URL をご確認ください。" />, 404))

  return app
}
