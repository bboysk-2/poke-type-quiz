import type { FC } from 'hono/jsx'

export interface ProgressBarProps {
  /** 0〜1 */
  ratio: number
  label: string
}

export const ProgressBar: FC<ProgressBarProps> = ({ ratio, label }) => {
  const percent = Math.round(Math.min(1, Math.max(0, ratio)) * 100)
  return (
    <div class="progress-bar" role="progressbar" aria-label={label} aria-valuenow={percent} aria-valuemin={0} aria-valuemax={100}>
      <div class="progress-bar__fill" style={`width: ${percent}%`} />
    </div>
  )
}
