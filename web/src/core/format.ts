// Textos de pesos, tiempos y series (port de GymApp/Core/Formatters.swift).
import type { I18n } from '../i18n'
import { deltaChange, type Delta } from './comparison'
import type { ProgressMetric, SetRecord } from './stats'

export function formatNumber(value: number, i: I18n, fractionDigits = 2): string {
  return new Intl.NumberFormat(i.locale, { maximumFractionDigits: fractionDigits }).format(value)
}

/** "62,5 kg" */
export const formatWeight = (kg: number, i: I18n, fractionDigits = 2) => `${formatNumber(kg, i, fractionDigits)} kg`

/** "1:05" o "1:02:05" */
export function formatDuration(seconds: number): string {
  const total = Math.max(0, Math.round(seconds))
  const h = Math.floor(total / 3600)
  const m = Math.floor((total % 3600) / 60)
  const s = total % 60
  const pad = (n: number) => String(n).padStart(2, '0')
  return h > 0 ? `${h}:${pad(m)}:${pad(s)}` : `${m}:${pad(s)}`
}

/** Una serie: "62,5 kg × 8", "12 reps", "1:00" o "0:45 · 10 kg". */
export function formatSet(set: SetRecord, i: I18n): string {
  if (set.kind === 'reps') {
    return set.weight > 0 ? `${formatWeight(set.weight, i)} × ${set.reps}` : i.t('repsCount', { n: set.reps })
  }
  return set.weight > 0 ? `${formatDuration(set.duration)} · ${formatWeight(set.weight, i)}` : formatDuration(set.duration)
}

/** "3×8 · 60 kg", "8, 8, 6 · 60 kg" o "3×1:00". */
export function formatSetSummary(sets: SetRecord[], i: I18n): string {
  if (!sets.length) return i.t('noSets')
  const values = sets.map((s) => (s.kind === 'reps' ? String(s.reps) : formatDuration(s.duration)))
  const counts = new Set(values).size === 1 ? `${sets.length}×${values[0]}` : values.join(', ')
  const maxWeight = Math.max(0, ...sets.map((s) => s.weight))
  return maxWeight > 0 ? `${counts} · ${formatWeight(maxWeight, i)}` : counts
}

export function formatMetricValue(value: number, metric: ProgressMetric, i: I18n): string {
  switch (metric) {
    case 'maxWeight':
    case 'volume':
      return formatWeight(value, i)
    case 'oneRepMax':
      return formatWeight(value, i, 1)
    case 'totalReps':
      return formatNumber(value, i, 0)
    case 'maxDuration':
    case 'totalDuration':
      return formatDuration(value)
  }
}

/** "+2,5 kg", "−0:15", "Igual" o "Nuevo". */
export function formatChange(delta: Delta, metric: ProgressMetric, i: I18n): string {
  const change = deltaChange(delta)
  if (change === null) return i.t('new')
  if (Math.abs(change) < 0.0001) return i.t('same')
  return (change > 0 ? '+' : '−') + formatMetricValue(Math.abs(change), metric, i)
}

/** "+6 %", "−3 %" o "0 %". */
export function formatPercent(fraction: number): string {
  const p = Math.round(fraction * 100)
  if (p > 0) return `+${p} %`
  if (p < 0) return `−${-p} %`
  return '0 %'
}
