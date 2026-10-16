import { deltaPercent, trendOf, type Delta } from '../core/comparison'
import { formatChange, formatPercent } from '../core/format'
import type { ProgressMetric } from '../core/stats'
import { useApp } from '../state'
import { EqualIcon, SparkleIcon, TriangleDown, TriangleUp } from './icons'

/** ▲ verde si mejora, ▼ rojo si empeora, = gris si igual. El icono y la etiqueta no dependen solo del color. */
export function DeltaBadge({ delta, metric, showPercent = false }: { delta: Delta; metric: ProgressMetric; showPercent?: boolean }) {
  const app = useApp()
  const trend = trendOf(delta)
  const change = formatChange(delta, metric, app)
  const percent = deltaPercent(delta)
  const text = showPercent && percent !== null && trend !== 'same' ? `${change} (${formatPercent(percent)})` : change
  const Icon = { up: TriangleUp, down: TriangleDown, same: EqualIcon, new: SparkleIcon }[trend]
  const label = {
    up: app.t('upBy', { v: change }),
    down: app.t('downBy', { v: change }),
    same: app.t('sameAsBefore'),
    new: app.t('noPreviousData'),
  }[trend]
  return (
    <span className={`delta ${trend}`} role="img" aria-label={label}>
      <Icon />
      <span aria-hidden>{text}</span>
    </span>
  )
}
