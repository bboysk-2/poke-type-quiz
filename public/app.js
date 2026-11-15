// プログレッシブエンハンスメント。JS がなくてもクイズは遊べる。
// 1) 送信中のボタンをローディング表示にして二重送信を防ぐ
// 2) 数字キー 1〜4 で選択肢を選べる
document.addEventListener('submit', (e) => {
  const button = e.submitter
  if (!(button instanceof HTMLButtonElement)) return
  if (button.closest('form')?.getAttribute('action') === '/quiz/start') {
    button.classList.add('is-loading')
    button.textContent = 'ポケモンを呼び出し中…'
  }
  // 送信値を保ったまま再クリックを防ぐ
  setTimeout(() => document.querySelectorAll('button').forEach((b) => (b.disabled = true)), 0)
})

document.addEventListener('keydown', (e) => {
  if (e.metaKey || e.ctrlKey || e.altKey) return
  const index = Number(e.key) - 1
  if (!(index >= 0 && index <= 3)) return
  const buttons = document.querySelectorAll('[data-quiz-choices] button:not(:disabled)')
  const target = buttons[index]
  if (target instanceof HTMLButtonElement) target.click()
})
