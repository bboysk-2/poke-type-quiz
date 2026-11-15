# UI デザイン

- コンセプト: 「図鑑をめくるワクワク感」。クリーム色の紙に水玉、丸ゴシック（M PLUS Rounded 1c）、タイプ色をアクセントに。
- ライト/ダークは `prefers-color-scheme` で自動切替。`prefers-reduced-motion` ではアニメーションを止める。
- JS なしで遊べる（全遷移が POST フォーム）。`public/app.js` は数字キー 1〜4 での回答と送信中表示だけを足す。

## トークン（`public/styles.css` の `:root`）
| トークン | 用途 |
|---|---|
| `--bg` `--surface` `--surface-2` | 背景 / カード / カード内の面 |
| `--ink` `--ink-2` `--ink-3` | 文字（主・副・補足） |
| `--brand` `--brand-shadow` | 主ボタン（押し込み影） |
| `--ok` `--ng` (+ `-soft`) | 正解・不正解 |
| `--type-<id>` | 18 タイプの色。`src/domain/pokemonType.ts` の id と一致 |
| `--radius` `--radius-lg` `--shadow` `--shadow-lg` | 形と奥行き |

コンポーネントは色を直書きせず、`style="--type-color: var(--type-fire)"` のようにトークンを渡す。

## モーション
`rise`（下からふわっと）/ `pop`（判定・バッジ）/ `appear` + `float`（ポケモン登場と浮遊）/ `shake`（不正解）/ `pulse`（正解）/ スコアリングの充填（`@property --shown`）。
