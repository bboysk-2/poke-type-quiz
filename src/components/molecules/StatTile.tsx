import type { FC } from 'hono/jsx'

export interface StatTileProps {
  label: string
  value: string
}

export const StatTile: FC<StatTileProps> = ({ label, value }) => (
  <div class="stat-tile">
    <span class="stat-tile__value">{value}</span>
    <span class="stat-tile__label">{label}</span>
  </div>
)
