# アーキテクチャ

## ディレクトリ
```
src/
  domain/          純粋なビジネスロジックと型。I/O・Hono 禁止
    pokemonType.ts   18タイプの定義（日本語名・色）
    quiz.ts          問題生成・採点・正答率（純粋関数）
    random.ts        Random ポート（乱数の注入口）
    ports.ts         PokemonRepository / QuizSessionStore のインターフェース
  infrastructure/  ポートの具象実装（外部 API・メモリストア）
    pokeApiRepository.ts
    memoryQuizSessionStore.ts
  application/     ユースケース。ポートを受け取り domain を呼ぶ
    quizService.ts
  routes/          Hono のルーティング。HTTP ↔ ユースケース ↔ pages
    quizRoutes.tsx
  components/      Atomic Design（表示専用、props のみ）
    atoms/ molecules/ organisms/ templates/ pages/
  app.ts           createApp(deps): 依存を組み立てる唯一の場所（Composition Root）
  server.ts        Node で起動するエントリ
public/            静的ファイル（styles.css）
```

## 依存ルール
```
routes ──▶ application ──▶ domain ◀── infrastructure
   │                          ▲
   └──▶ components ───────────┘ (型と純粋関数・定数のみ。I/O を持つものは不可)

pages ▶ templates ▶ organisms ▶ molecules ▶ atoms
```
- 矢印の逆向きの import は ESLint (`no-restricted-imports`, `[arch/*]`) がエラーにする。
- components が domain から import してよいのは型・純粋関数（`isCorrect`, `summarize`, `typeLabel`）・定数のみ。domain は I/O を持たないので ESLint では許可している。
- 同じ階層同士の import は可（例: organisms が別の organisms を使う）。ただし循環は禁止。
- `app.ts` だけが infrastructure の具象クラスを `new` してよい。

## Atomic Design の判断基準
| 階層 | 定義 | 例 |
|---|---|---|
| atoms | これ以上分解できない要素。状態を持たない | Button, TypeBadge, ProgressBar, ScoreRing, Verdict |
| molecules | atoms の小さな組み合わせ。1つの役割 | ChoiceButton, QuizProgress, StatTile, ResultRow |
| organisms | 画面の意味のある区画 | QuestionCard, AnswerFeedback, ResultSummary |
| templates | ページの骨組み。中身は children | BaseLayout |
| pages | template + organisms にデータを流し込む | TopPage, QuizPage, ResultPage |

迷ったら「その部品は単体で意味のある画面区画か？」→ Yes なら organisms。

## リクエストの流れ
`POST /quiz/start` → quizService.start（PokeAPI から10匹取得・問題生成）→ セッション保存 → `GET /quiz` → QuizPage 描画
→ `POST /quiz/answer` → 採点して保存 → `GET /quiz`（フィードバック表示）→ `POST /quiz/next` → … → `GET /result`
