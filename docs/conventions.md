# コーディング規約

## 命名
| 対象 | 規則 | 例 |
|---|---|---|
| コンポーネントファイル | PascalCase.tsx | `TypeBadge.tsx` |
| それ以外のファイル | camelCase.ts | `quizService.ts` |
| テスト | 対象と同名 + `.test.ts(x)`、同じディレクトリ | `quiz.test.ts` |
| 型・インターフェース | PascalCase、`I` 接頭辞なし | `PokemonRepository` |
| 定数配列 | UPPER_SNAKE_CASE | `POKEMON_TYPES` |
| Props 型 | `<Component>Props` | `TypeBadgeProps` |

ファイル名は `harness/checks/structure.ts` が検査する。

## export
- 名前付き export のみ（default export 禁止）。1 コンポーネント = 1 ファイル。

## 副作用の注入
- 乱数・時刻・ネットワーク・ストレージは**引数で受け取る**（`Random`, `PokemonRepository`, `QuizSessionStore`）。
- `Math.random()` を直接呼ばない（ESLint `[conv/random]`）。テストでは `seededRandom(seed)` を使う。

## 型
- `any` 禁止、`as` キャストは外部入力の境界（PokeAPI レスポンス）でのみ。境界では型ガードで検証する。
- `noUncheckedIndexedAccess` 有効。配列アクセス結果は undefined を考慮する。

## サイズ
- 1 ファイル 200 行まで、関数の循環的複雑度 10 まで（ESLint）。超えたら分割する。

## テスト
- domain と application は単体テスト必須。routes は `app.request()` で結合テスト。
- PokeAPI を実際に叩くテストは書かない（フェイクリポジトリを使う）。

## スタイル（CSS）
- `public/styles.css` に集約。クラス名は BEM 風 `block__element--modifier`。色はトークン（CSS 変数）経由 → [design.md](design.md)
