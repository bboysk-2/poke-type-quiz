// @ts-check
// ESLint はハーネスの「センサー」。ここのメッセージはそのままエージェントへのプロンプトになるので、
// 「何が駄目か」「どう直すか」「どの規約か（docs/ のパス）」を必ず書く。
import js from '@eslint/js'
import tseslint from 'typescript-eslint'
import globals from 'globals'

/** レイヤー間の依存ルール。docs/architecture.md と一致させること。 */
const layer = (name, forbidden, fix) => ({
  regex: `(^|/)(${forbidden.join('|')})(/|$)`,
  message: `[arch/${name}] ${name} から ${forbidden.join(' / ')} への依存は禁止。修正案: ${fix} 規約: docs/architecture.md#依存ルール`,
})

const componentBoundary = layer(
  'components',
  ['infrastructure', 'application', 'routes'],
  'コンポーネントは props だけを受け取る表示専用。データ取得は routes で行い props で渡す。',
)

const restrict = (files, patterns) => ({
  files,
  rules: { 'no-restricted-imports': ['error', { patterns }] },
})

export default tseslint.config(
  { ignores: ['node_modules/**', 'eval/.work/**', 'eval/results/**'] },
  js.configs.recommended,
  ...tseslint.configs.strictTypeChecked,
  {
    languageOptions: {
      globals: { ...globals.node },
      parserOptions: { projectService: true, tsconfigRootDir: import.meta.dirname },
    },
    rules: {
      'no-restricted-syntax': [
        'error',
        {
          selector: 'ExportDefaultDeclaration',
          message:
            '[conv/named-export] default export は禁止。修正案: `export const Foo = ...` の名前付き export にする。規約: docs/conventions.md#export',
        },
        {
          selector: "CallExpression[callee.object.name='Math'][callee.property.name='random']",
          message:
            '[conv/random] Math.random の直接呼び出しは禁止（テスト不能になる）。修正案: 引数で `Random` (src/domain/random.ts) を受け取る。規約: docs/conventions.md#副作用の注入',
        },
      ],
      '@typescript-eslint/consistent-type-imports': 'error',
      '@typescript-eslint/no-explicit-any': 'error',
      '@typescript-eslint/restrict-template-expressions': ['error', { allowNumber: true }],
      'max-lines': ['error', { max: 200, skipBlankLines: true, skipComments: true }],
      complexity: ['error', 10],
      'no-console': 'error',
    },
  },
  // ---- アーキテクチャ境界（docs/architecture.md） ----
  restrict(['src/domain/**'], [
    layer('domain', ['infrastructure', 'application', 'routes', 'components'], 'ドメインは純粋関数と型のみ。I/O は infrastructure に置き、ポート(interface)経由で受け取る。'),
    { group: ['hono', 'hono/*', '@hono/*'], message: '[arch/domain] domain は Hono に依存できない。修正案: HTTP の関心事は src/routes へ。規約: docs/architecture.md#依存ルール' },
  ]),
  restrict(['src/infrastructure/**'], [
    layer('infrastructure', ['application', 'routes', 'components'], 'infrastructure は domain のポートを実装するだけ。'),
  ]),
  restrict(['src/application/**'], [
    layer('application', ['infrastructure', 'routes', 'components'], '具象実装ではなく domain のポート型に依存し、createApp で注入する。'),
  ]),
  // flat config では後勝ちで rule が上書きされるため、components 共通ルールを各階層に合成する
  ...[
    ['atoms', ['molecules', 'organisms', 'templates', 'pages'], 'atoms は最小単位。合成が必要なら molecules に移す。'],
    ['molecules', ['organisms', 'templates', 'pages'], 'molecules は atoms のみを組み合わせる。'],
    ['organisms', ['templates', 'pages'], 'organisms は atoms / molecules を組み合わせる。'],
    ['templates', ['pages'], 'templates はレイアウトの枠のみ。中身は children で受け取る。'],
    ['pages', [], ''],
  ].map(([name, forbidden, fix]) =>
    restrict([`src/components/${name}/**`], [
      componentBoundary,
      ...(forbidden.length > 0 ? [layer(name, forbidden, fix)] : []),
    ]),
  ),
  // ---- 例外 ----
  { files: ['src/server.ts', 'harness/**', 'eval/**'], rules: { 'no-console': 'off' } },
  { files: ['**/*.test.ts', '**/*.test.tsx'], rules: { 'max-lines': 'off' } },
  {
    files: ['*.config.{js,ts}', 'eslint.config.js'],
    rules: { 'no-restricted-syntax': 'off' },
  },
  { files: ['**/*.js'], ...tseslint.configs.disableTypeChecked },
  { files: ['public/**/*.js'], languageOptions: { globals: { ...globals.browser } } },
)
