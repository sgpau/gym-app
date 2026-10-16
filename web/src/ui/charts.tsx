// Gráficas SVG sencillas: una serie en línea (evolución) y barras agrupadas (hoy frente al anterior).
import { useId } from 'react'

function niceTicks(min: number, max: number, count = 4): number[] {
  if (min === max) {
    const pad = Math.abs(min) * 0.1 || 1
    min -= pad
    max += pad
  }
  const raw = (max - min) / count
  const magnitude = 10 ** Math.floor(Math.log10(raw))
  const step = [1, 2, 2.5, 5, 10].map((m) => m * magnitude).find((s) => s >= raw) ?? raw
  const start = Math.floor(min / step) * step
  const ticks: number[] = []
  for (let v = start; v <= max + step * 0.001; v += step) ticks.push(Math.round(v * 1000) / 1000)
  if (ticks[ticks.length - 1] < max) ticks.push(ticks[ticks.length - 1] + step)
  return ticks
}

export function LineChart({ points, formatY, formatX, label, height = 220 }: {
  points: { date: Date; value: number }[]
  formatY: (v: number) => string
  formatX: (d: Date) => string
  label: string
  height?: number
}) {
  const id = useId()
  const width = 340
  const pad = { top: 12, right: 12, bottom: 24, left: 52 }
  const values = points.map((p) => p.value)
  const ticks = niceTicks(Math.min(...values), Math.max(...values))
  const yMin = ticks[0]
  const yMax = ticks[ticks.length - 1]
  const t0 = points[0].date.getTime()
  const t1 = points[points.length - 1].date.getTime()
  const x = (d: Date) => pad.left + (t1 === t0 ? (width - pad.left - pad.right) / 2 : ((d.getTime() - t0) / (t1 - t0)) * (width - pad.left - pad.right))
  const y = (v: number) => pad.top + (1 - (v - yMin) / (yMax - yMin || 1)) * (height - pad.top - pad.bottom)
  const line = points.map((p, i) => `${i ? 'L' : 'M'}${x(p.date).toFixed(1)},${y(p.value).toFixed(1)}`).join('')
  const area = `${line}L${x(points[points.length - 1].date).toFixed(1)},${height - pad.bottom}L${x(points[0].date).toFixed(1)},${height - pad.bottom}Z`
  const xLabels = points.length > 1 ? [points[0], points[Math.floor((points.length - 1) / 2)], points[points.length - 1]] : [points[0]]
  return (
    <svg className="chart" viewBox={`0 0 ${width} ${height}`} width="100%" role="img" aria-label={label}>
      <defs>
        <linearGradient id={`${id}-fill`} x1="0" x2="0" y1="0" y2="1">
          <stop offset="0" stopColor="var(--accent)" stopOpacity="0.25" />
          <stop offset="1" stopColor="var(--accent)" stopOpacity="0" />
        </linearGradient>
      </defs>
      {ticks.map((tick) => (
        <g key={tick}>
          <line className="grid" x1={pad.left} x2={width - pad.right} y1={y(tick)} y2={y(tick)} />
          <text x={pad.left - 6} y={y(tick) + 4} textAnchor="end">{formatY(tick)}</text>
        </g>
      ))}
      {xLabels.map((p, i) => (
        <text key={i} x={x(p.date)} y={height - 6} textAnchor={i === 0 && xLabels.length > 1 ? 'start' : i === xLabels.length - 1 && xLabels.length > 1 ? 'end' : 'middle'}>
          {formatX(p.date)}
        </text>
      ))}
      <path d={area} fill={`url(#${id}-fill)`} />
      <path d={line} fill="none" stroke="var(--accent)" strokeWidth={2.5} strokeLinejoin="round" strokeLinecap="round" />
      {points.length <= 60 && points.map((p, i) => (
        <circle key={i} cx={x(p.date)} cy={y(p.value)} r={i === points.length - 1 ? 4.5 : 3} fill="var(--accent)" stroke="var(--card)" strokeWidth={1.5} />
      ))}
    </svg>
  )
}

/** Barras horizontales: por cada fila, hoy (color principal) y anterior (gris). */
export function PairedBars({ rows, formatValue, todayLabel, previousLabel, label }: {
  rows: { name: string; today: number; previous: number | null }[]
  formatValue: (v: number) => string
  todayLabel: string
  previousLabel: string
  label: string
}) {
  const max = Math.max(1, ...rows.flatMap((r) => [r.today, r.previous ?? 0]))
  return (
    <div role="img" aria-label={label}>
      <div style={{ display: 'flex', gap: 16, fontSize: 13, marginBottom: 12 }} className="secondary">
        <Legend color="var(--accent)" text={todayLabel} />
        <Legend color="var(--fill-2)" text={previousLabel} />
      </div>
      <div style={{ display: 'grid', gap: 14 }}>
        {rows.map((row) => (
          <div key={row.name}>
            <div className="truncate" style={{ fontSize: 15, marginBottom: 4 }}>{row.name}</div>
            <Bar value={row.today} max={max} color="var(--accent)" text={formatValue(row.today)} />
            {row.previous !== null && <Bar value={row.previous} max={max} color="var(--fill-2)" text={formatValue(row.previous)} />}
          </div>
        ))}
      </div>
    </div>
  )
}

function Bar({ value, max, color, text }: { value: number; max: number; color: string; text: string }) {
  return (
    <div style={{ display: 'flex', alignItems: 'center', gap: 8, marginTop: 3 }}>
      <div style={{ height: 10, borderRadius: 5, background: color, width: `${Math.max(2, (value / max) * 75)}%`, transition: 'width 400ms var(--ease-out)' }} />
      <span className="num secondary" style={{ fontSize: 12, whiteSpace: 'nowrap' }}>{text}</span>
    </div>
  )
}

function Legend({ color, text }: { color: string; text: string }) {
  return (
    <span style={{ display: 'inline-flex', alignItems: 'center', gap: 6 }}>
      <span style={{ width: 10, height: 10, borderRadius: 3, background: color }} />
      {text}
    </span>
  )
}
