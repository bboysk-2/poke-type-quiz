import type { FC } from 'hono/jsx'

export interface ScoreRingProps {
  /** 0〜100 */
  percent: number
}

/** conic-gradient で描く円形メーター */
export const ScoreRing: FC<ScoreRingProps> = ({ percent }) => (
  <div class="score-ring" style={`--percent: ${percent}`} role="img" aria-label={`正答率 ${percent}%`}>
    <span class="score-ring__value">
      {percent}
      <small>%</small>
    </span>
  </div>
)
