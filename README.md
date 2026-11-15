# ポケモン タイプ当てクイズ

PokéAPI からランダムに 10 匹のポケモンを呼び出し、画像を見て 4 択でタイプを当てるクイズ。最後に正答率を表示します。
TypeScript + Hono（JSX による SSR）+ Atomic Design。JavaScript なしでも遊べます。

```
pnpm install
pnpm dev        # http://localhost:3000
pnpm verify     # 全ゲート（structure / lint / typecheck / test / deadcode）
```

エージェントで開発する場合は [AGENTS.md](AGENTS.md) から。ハーネスの全体像は [docs/harness.md](docs/harness.md)。

データ提供: [PokéAPI](https://pokeapi.co/)。非公式のファンメイド作品です。
