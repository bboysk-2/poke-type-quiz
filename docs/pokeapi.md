# PokeAPI の使い方

- ベース: https://pokeapi.co/api/v2 、認証不要、GET のみ。結果はキャッシュする（公式のお願い）。
- 実装: `src/infrastructure/pokeApiRepository.ts`（ID 単位でプロセス内キャッシュ、8 秒タイムアウト、失敗はキャッシュしない）

| 使うエンドポイント | 取り出す値 |
|---|---|
| /pokemon/{id} | id, name(英語), types[].type.name, sprites.other.official-artwork.front_default（なければ sprites.front_default） |
| /pokemon-species/{id} | names[] の language.name === 'ja'（なければ ja-hrkt）→ 日本語名 |

- 図鑑番号は 1〜1025（`MAX_POKEDEX_ID`）。取得に失敗した ID は別の ID で補充する（`src/application/quizService.ts`）。
- レスポンスは unknown として受け、型ガードで検証して domain の `Pokemon` に変換する（`toPokemon`）。
