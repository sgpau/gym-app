import { useState } from 'react'
import { formatDuration, formatMetricValue, formatSetSummary, formatWeight } from '../core/format'
import { availableMetrics, personalBests, progress, type ExerciseLog, type ProgressMetric } from '../core/stats'
import { exerciseLogs } from '../db/history'
import type { Exercise } from '../db/model'
import type { Key } from '../i18n'
import { useApp, useData } from '../state'
import { LineChart } from '../ui/charts'
import { longDayMaybeYear, shortDate, shortDay } from '../ui/dates'
import { DeltaBadge } from '../ui/DeltaBadge'
import { ChartIcon } from '../ui/icons'
import { Empty, Row, Screen, Section, Segmented } from '../ui/kit'
import { useNav } from '../ui/nav'
import { ExerciseLabel } from './ExerciseScreens'

type Range = '3M' | '6M' | '1Y' | 'all'
const rangeStart = (range: Range): Date | undefined => {
  const d = new Date()
  if (range === '3M') d.setMonth(d.getMonth() - 3)
  else if (range === '6M') d.setMonth(d.getMonth() - 6)
  else if (range === '1Y') d.setFullYear(d.getFullYear() - 1)
  else return undefined
  return d
}

export function ProgressListScreen() {
  const app = useApp()
  const { t } = app
  const { exercises, workouts, exerciseMap } = useData()
  const nav = useNav()
  const tracked = exercises
    .map((exercise) => ({ exercise, logs: exerciseLogs(exercise.id, workouts, exerciseMap) }))
    .filter((x) => x.logs.length > 0)
    .sort((a, b) => b.logs.at(-1)!.date.getTime() - a.logs.at(-1)!.date.getTime())

  return (
    <Screen title={t('tabProgress')} large>
      {tracked.length === 0 ? (
        <Empty icon={<ChartIcon />} title={t('noProgressTitle')} body={t('noProgressBody')} />
      ) : (
        <Section>
          {tracked.map(({ exercise, logs }) => {
            const last = logs.at(-1)!
            return (
              <Row
                key={exercise.id}
                title={<ExerciseLabel exercise={exercise} />}
                subtitle={<span className="num">{formatSetSummary(last.sets, app)} · {shortDay(last.date, app.locale)}</span>}
                caption={t('sessionsCount', { n: logs.length })}
                chevron
                onClick={() => nav.push(<ExerciseProgressScreen exercise={exercise} />, t('tabProgress'))}
              />
            )
          })}
        </Section>
      )}
    </Screen>
  )
}

function ExerciseProgressScreen({ exercise }: { exercise: Exercise }) {
  const app = useApp()
  const { t } = app
  const { workouts, exerciseMap } = useData()
  const logs = exerciseLogs(exercise.id, workouts, exerciseMap)
  const metrics = availableMetrics(exercise.trackingType, logs.some((l) => l.sets.some((s) => s.weight > 0)))
  const [selected, setSelected] = useState<ProgressMetric>(metrics[0])
  const [range, setRange] = useState<Range>('all')
  const metric = metrics.includes(selected) ? selected : metrics[0]
  const points = progress(logs, metric, rangeStart(range))
  const first = points[0]
  const last = points.at(-1)

  return (
    <Screen title={exercise.name}>
      <div style={{ padding: '12px 16px 0', display: 'grid', gap: 20 }}>
        <h1 style={{ margin: 0, fontSize: 28, fontWeight: 700 }}>{exercise.name}</h1>
        {metrics.length > 1 && (
          <Segmented label={t('metric')} value={metric} onChange={setSelected} options={metrics.map((m) => ({ value: m, label: t(`m_${m}` as Key) }))} />
        )}
        <div className="card" style={{ display: 'grid', gap: 14 }}>
          {first && last && points.length > 1 && (
            <div style={{ display: 'grid', gap: 4 }}>
              <span className="num" style={{ fontSize: 28, fontWeight: 700 }}>{formatMetricValue(last.value, metric, app)}</span>
              <DeltaBadge delta={{ current: last.value, previous: first.value }} metric={metric} showPercent />
              <span className="secondary" style={{ fontSize: 13 }}>{t('sinceDate', { date: longDayMaybeYear(first.date, app.locale) })}</span>
            </div>
          )}
          {points.length ? (
            <LineChart
              points={points}
              label={t('evolutionOf', { metric: t(`m_${metric}` as Key) })}
              formatY={(v) => (metric === 'maxDuration' || metric === 'totalDuration' ? formatDuration(v) : metric === 'totalReps' ? String(v) : formatWeight(v, app, 1))}
              formatX={(d) => shortDay(d, app.locale)}
            />
          ) : (
            <Empty icon={<ChartIcon />} title={t('noDataPeriod')} />
          )}
          <Segmented
            label={t('period')}
            value={range}
            onChange={setRange}
            options={[
              { value: '3M', label: t('range3M') },
              { value: '6M', label: t('range6M') },
              { value: '1Y', label: t('range1Y') },
              { value: 'all', label: t('rangeAll') },
            ]}
          />
        </div>
        <Records exercise={exercise} logs={logs} />
        <div>
          <div className="section-header" style={{ padding: '0 0 6px 16px' }}>{t('history')}</div>
          <div className="list">
            {[...logs].reverse().map((log, i) => (
              <Row key={i} title={<span className="secondary">{shortDate(log.date, app.locale)}</span>} value={<span className="num" style={{ color: 'var(--label)' }}>{formatSetSummary(log.sets, app)}</span>} />
            ))}
          </div>
        </div>
      </div>
    </Screen>
  )
}

function Records({ exercise, logs }: { exercise: Exercise; logs: ExerciseLog[] }) {
  const app = useApp()
  const { t } = app
  const bests = personalBests(logs)
  const cards: [string, string][] = []
  if (exercise.trackingType === 'reps') {
    if (bests.maxWeight > 0) {
      cards.push([t('bestWeight'), formatWeight(bests.maxWeight, app)])
      cards.push([t('estimated1RM'), formatWeight(bests.oneRepMax, app, 1)])
      cards.push([t('mostVolume'), formatWeight(bests.volume, app)])
    } else {
      cards.push([t('mostReps'), String(bests.maxReps)])
    }
  } else {
    cards.push([t('bestTime'), formatDuration(bests.maxDuration)])
    if (bests.maxWeight > 0) cards.push([t('bestWeight'), formatWeight(bests.maxWeight, app)])
  }
  cards.push([t('sessionsLabel'), String(bests.sessionCount)])
  return (
    <div>
      <div style={{ fontWeight: 600, fontSize: 20, marginBottom: 10 }}>{t('personalRecords')}</div>
      <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 12 }}>
        {cards.map(([label, value]) => (
          <div key={label} className="card glass" style={{ display: 'grid', gap: 4 }}>
            <span className="secondary" style={{ fontSize: 13 }}>{label}</span>
            <span className="num truncate" style={{ fontSize: 20, fontWeight: 700 }}>{value}</span>
          </div>
        ))}
      </div>
    </div>
  )
}
