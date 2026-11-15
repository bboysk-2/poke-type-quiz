import type { FC } from 'hono/jsx'

export interface PokemonImageProps {
  src: string
  alt: string
  size?: 'sm' | 'lg'
}

export const PokemonImage: FC<PokemonImageProps> = ({ src, alt, size = 'lg' }) => (
  <img class={`pokemon-image pokemon-image--${size}`} src={src} alt={alt} width={size === 'lg' ? 280 : 56} height={size === 'lg' ? 280 : 56} loading={size === 'lg' ? 'eager' : 'lazy'} decoding="async" />
)
