import { useEffect, useRef, useState } from 'react'
import type { Delta, ExerciseComparison } from '../core/comparison'
import { formatDuration, formatMetricValue, formatSet, formatSetSummary, formatWeight } from '../core/format'
import type { ProgressMetric } from '../core/stats'
import { makeEntry, makeWorkout, nextSet } from '../db/factory'
import { lastLog, workoutComparison, workoutLogs } from '../db/history'
import type { Exercise, Routine, Workout, WorkoutEntry, WorkoutSet } from '../db/model'
import type { Key } from '../i18n'
import { db, useApp, useData } from '../state'
import { PairedBars } from '../ui/charts'
import { dayTitle, longDay, shortDay, toLocalInput } from '../ui/dates'
import { DeltaBadge } from '../ui/DeltaBadge'
import { useDialogs } from '../ui/dialogs'
import { BoltIcon, EllipsisIcon, ListIcon, PlayIcon, PlusIcon, StopIcon, TrashIcon, TrophyIcon } from '../ui/icons'
import { BarButton, Empty, NumberField, Row, Screen, Section } from '../ui/kit'
import { useNav, useSheet } from '../ui/nav'
import { ExercisePicker } from './ExerciseScreens'

/** Hoja a pantalla completa: elegir rutina → registrar → finalizar → resumen. */
export function WorkoutFlow({ day, workoutId }: { day?: Date; workoutId?: string }) {
  return workoutId ? <WorkoutEditor workoutId={workoutId} isNew={false} /> : <StartWorkout day={day ?? new Date()} />
}

function StartWorkout({ day }: { day: Date }) {
  const app = useApp()
  const { t } = app
  const { routines, workouts, exerciseMap } = useData()
  const nav = useNav()
  const sheet = useSheet()
  const usable = routines.filter((r) => r.items.length > 0)

  const start = async (routine: Routine | null) => {
    const workout = makeWorkout(routine, day, workouts, exerciseMap)
    await db.workouts.add(workout)
    nav.push(<WorkoutEditor workoutId={workout.id} isNew />)
  }
  const lastDone = (routine: Routine) => {
    const dates = workouts.filter((w) => w.finished && w.routineId === routine.id).map((w) => w.date)
    return dates.length ? Math.max(...dates) : null
  }

  return (
    <Screen title={t('newWorkout')} leading={<BarButton onClick={sheet.dismiss}>{t('cancel')}</BarButton>}>
      <div style={{ height: 16 }} />
      <Section footer={dayTitle(day, app.locale)}>
        <Row
          leading={<BoltIcon width={26} height={26} className="accent" />}
          title={t('freeWorkout')}
          subtitle={t('freeWorkoutSubtitle')}
          chevron
          onClick={() => start(null)}
        />
      </Section>
      {usable.length > 0 ? (
        <Section header={t('routines')}>
          {usable.map((routine) => {
            const last = lastDone(routine)
            const count = t('exercisesCount', { n: routine.items.length })
            return (
              <Row
                key={routine.id}
                leading={<ListIcon width={26} height={26} className="accent" />}
                title={routine.name || t('unnamedRoutine')}
                subtitle={last ? t('lastTimeRoutine', { count, date: shortDay(new Date(last), app.locale) }) : count}
                chevron
                onClick={() => start(routine)}
              />
            )
          })}
        </Section>
      ) : (
        <Empty icon={<ListIcon />} title={t('noRoutinesYet')} body={t('noRoutinesYetBody')} />
      )}
    </Screen>
  )
}

function WorkoutEditor({ workoutId, isNew }: { workoutId: string; isNew: boolean }) {
  const app = useApp()
  const { t } = app
  const { workouts, routines, exerciseMap } = useData()
  const sheet = useSheet()
  const nav = useNav()
  const dialogs = useDialogs()
  const workout = workouts.find((w) => w.id === workoutId)
  if (!workout) return <Screen title="">{null}</Screen>

  const title = routines.find((r) => r.id === workout.routineId)?.name || t('freeWorkout')
  const save = (patch: Partial<Workout>) => db.workouts.update(workout.id, patch)
  const setEntries = (entries: WorkoutEntry[]) => save({ entries })
  const updateEntry = (index: number, entry: WorkoutEntry) => setEntries(workout.entries.map((e, i) => (i === index ? entry : e)))
  const hasData = workoutLogs(workout, exerciseMap).length > 0

  const cancel = () => {
    if (!isNew) return sheet.dismiss()
    const discard = async () => { sheet.dismiss(); await db.workouts.delete(workout.id) }
    if (workout.entries.length === 0) return void discard()
    dialogs.confirm(t('discardWorkoutTitle'), t('discard'), () => void discard(), t('discardWorkoutMessage'))
  }
  const finish = async () => {
    ;(document.activeElement as HTMLElement | null)?.blur()
    await save({ finished: true })
    nav.push(<WorkoutSummaryScreen workoutId={workout.id} onDone={sheet.dismiss} />)
  }

  return (
    <Screen
      title={title}
      solidBar
      leading={<BarButton onClick={cancel}>{isNew ? t('cancel') : t('close')}</BarButton>}
      trailing={<BarButton prominent disabled={!hasData} onClick={finish}>{workout.finished ? t('save') : t('finish')}</BarButton>}
    >
      <div style={{ height: 16 }} />
      <Section>
        <Row title={t('date')} trailing={
          <input
            type="datetime-local"
            aria-label={t('date')}
            value={toLocalInput(workout.date)}
            onChange={(e) => { const ms = new Date(e.target.value).getTime(); if (!Number.isNaN(ms)) void save({ date: ms }) }}
            style={{ border: 0, background: 'var(--fill)', borderRadius: 8, padding: '6px 8px', fontSize: 16 }}
          />
        } />
        <Row>
          <NotesField value={workout.notes} placeholder={t('notes')} onChange={(notes) => save({ notes })} />
        </Row>
      </Section>

      {workout.entries.map((entry, index) => {
        const exercise = exerciseMap.get(entry.exerciseId)
        if (!exercise) return null
        return (
          <EntrySection
            key={`${entry.exerciseId}-${index}`}
            entry={entry}
            exercise={exercise}
            workout={workout}
            workouts={workouts}
            onChange={(e) => updateEntry(index, e)}
            onRemove={() =>
              dialogs.actions(exercise.name, [{
                label: t('removeExercise'),
                destructive: true,
                onSelect: () => setEntries(workout.entries.filter((_, i) => i !== index)),
              }])
            }
          />
        )
      })}

      <Section>
        <Row
          className="action"
          leading={<PlusIcon width={20} height={20} />}
          title={t('addExercise')}
          onClick={() =>
            sheet.present(
              <ExercisePicker
                title={t('addExercise')}
                onPick={async (ids) => {
                  const current = await db.workouts.get(workout.id)
                  if (!current) return
                  const added = ids.flatMap((id) => {
                    const exercise = exerciseMap.get(id)
                    return exercise ? [makeEntry(exercise, current, workouts, exerciseMap)] : []
                  })
                  await db.workouts.update(current.id, { entries: [...current.entries, ...added] })
                }}
              />,
            )
          }
        />
      </Section>
    </Screen>
  )
}

function NotesField({ value, placeholder, onChange }: { value: string; placeholder: string; onChange: (v: string) => void }) {
  const [text, setText] = useState(value)
  return <textarea rows={1} aria-label={placeholder} placeholder={placeholder} value={text} onChange={(e) => { setText(e.target.value); onChange(e.target.value) }} />
}

function EntrySection({ entry, exercise, workout, workouts, onChange, onRemove }: {
  entry: WorkoutEntry; exercise: Exercise; workout: Workout; workouts: Workout[]; onChange: (e: WorkoutEntry) => void; onRemove: () => void
}) {
  const app = useApp()
  const { t } = app
  const { exerciseMap } = useData()
  const last = lastLog(exercise.id, workouts, exerciseMap, workout.date, workout.id)
  const setAt = (index: number, set: WorkoutSet) => onChange({ ...entry, sets: entry.sets.map((s, i) => (i === index ? set : s)) })

  return (
    <section className="section">
      <div className="section-header" style={{ display: 'flex', alignItems: 'flex-end', gap: 8, textTransform: 'none' }}>
        <div style={{ flex: 1, minWidth: 0 }}>
          <div style={{ fontSize: 17, fontWeight: 600, color: 'var(--label)' }}>{exercise.name}</div>
          {last && (
            <div className="num" style={{ fontSize: 13 }}>
              {t('lastTime', { date: shortDay(last.date, app.locale), summary: formatSetSummary(last.sets, app) })}
            </div>
          )}
        </div>
        <button className="bar-button" style={{ minHeight: 32 }} aria-label={t('removeExercise')} onClick={onRemove}><EllipsisIcon width={24} height={24} /></button>
      </div>
      <div className="list">
        {entry.sets.map((set, index) => (
          <SetRow
            key={index}
            number={index + 1}
            set={set}
            timed={exercise.trackingType === 'time'}
            onChange={(s) => setAt(index, s)}
            onDelete={() => onChange({ ...entry, sets: entry.sets.filter((_, i) => i !== index) })}
          />
        ))}
        <Row className="action" leading={<PlusIcon width={18} height={18} />} title={t('addSet')} onClick={() => onChange({ ...entry, sets: [...entry.sets, nextSet(entry)] })} />
      </div>
    </section>
  )
}

function SetRow({ number, set, timed, onChange, onDelete }: {
  number: number; set: WorkoutSet; timed: boolean; onChange: (s: WorkoutSet) => void; onDelete: () => void
}) {
  const { t } = useApp()
  return (
    <div className="row" style={{ gap: 10, paddingRight: 8 }}>
      <span className="num tertiary" style={{ width: 18, fontWeight: 600 }} aria-label={t('setNumber', { n: number })}>{number}</span>
      {timed ? (
        <DurationControl value={set.duration} onChange={(duration) => onChange({ ...set, duration })} />
      ) : (
        <span style={{ display: 'inline-flex', alignItems: 'center', gap: 6 }}>
          <NumberField label={`${t('setNumber', { n: number })}, ${t('repsUnit')}`} placeholder="0" value={set.reps} onChange={(reps) => onChange({ ...set, reps })} width={56} />
          <span className="unit">{t('repsUnit')}</span>
        </span>
      )}
      <span style={{ flex: 1 }} />
      <span style={{ display: 'inline-flex', alignItems: 'center', gap: 6 }}>
        <NumberField decimal label={`${t('setNumber', { n: number })}, kg`} value={set.weight} onChange={(weight) => onChange({ ...set, weight })} width={64} />
        <span className="unit">kg</span>
      </span>
      <button className="bar-button" style={{ minWidth: 32, padding: 0, color: 'var(--label-3)' }} aria-label={t('deleteSet')} onClick={onDelete}>
        <TrashIcon width={18} height={18} />
      </button>
    </div>
  )
}

/** Duración en min:seg: se elige con una rueda o se cronometra con ▶︎. */
function DurationControl({ value, onChange }: { value: number | null; onChange: (v: number) => void }) {
  const { t } = useApp()
  const sheet = useSheet()
  const [start, setStart] = useState<number | null>(null)
  const [, tick] = useState(0)
  useEffect(() => {
    if (start === null) return
    const id = setInterval(() => tick((n) => n + 1), 250)
    return () => clearInterval(id)
  }, [start])

  if (start !== null) {
    return (
      <span style={{ display: 'inline-flex', alignItems: 'center', gap: 8 }}>
        <span className="pill-button glass num" style={{ fontWeight: 600, color: 'var(--red)' }} aria-live="off">{formatDuration((Date.now() - start) / 1000)}</span>
        <button className="icon-button" aria-label={t('stopTimer')} onClick={() => { onChange(Math.round((Date.now() - start) / 1000)); setStart(null) }}><StopIcon /></button>
      </span>
    )
  }
  return (
    <span style={{ display: 'inline-flex', alignItems: 'center', gap: 8 }}>
      <button className="pill-button" aria-label={`${t('duration')} ${value ? formatDuration(value) : ''}`} onClick={() => sheet.present(<DurationPicker value={value ?? 0} onChange={onChange} />)}>
        {value ? formatDuration(value) : '0:00'}
      </button>
      <button className="icon-button" aria-label={t('startTimer')} onClick={() => setStart(Date.now())}><PlayIcon /></button>
    </span>
  )
}

function DurationPicker({ value, onChange }: { value: number; onChange: (v: number) => void }) {
  const { t } = useApp()
  const sheet = useSheet()
  const [minutes, setMinutes] = useState(Math.min(120, Math.floor(value / 60)))
  const [seconds, setSeconds] = useState(Math.round(value % 60))
  return (
    <Screen
      title={t('duration')}
      leading={<BarButton onClick={sheet.dismiss}>{t('cancel')}</BarButton>}
      trailing={<BarButton bold onClick={() => { onChange(minutes * 60 + seconds); sheet.dismiss() }}>{t('ok')}</BarButton>}
    >
      <div className="wheel-row">
        <Wheel label={t('minutes')} count={121} value={minutes} onChange={setMinutes} suffix="min" />
        <Wheel label={t('seconds')} count={60} value={seconds} onChange={setSeconds} suffix="s" />
      </div>
    </Screen>
  )
}

function Wheel({ label, count, value, onChange, suffix }: { label: string; count: number; value: number; onChange: (v: number) => void; suffix: string }) {
  const ref = useRef<HTMLDivElement>(null)
  useEffect(() => { ref.current?.scrollTo({ top: value * 40 }) }, []) // eslint-disable-line react-hooks/exhaustive-deps
  return (
    <div
      className="wheel"
      ref={ref}
      role="listbox"
      aria-label={label}
      onScroll={(e) => {
        const index = Math.round(e.currentTarget.scrollTop / 40)
        if (index !== value && index >= 0 && index < count) onChange(index)
      }}
    >
      <div className="pad" />
      {Array.from({ length: count }, (_, i) => (
        <button key={i} role="option" aria-selected={i === value} aria-pressed={i === value} onClick={() => { onChange(i); ref.current?.scrollTo({ top: i * 40, behavior: 'smooth' }) }}>
          {i} {suffix}
        </button>
      ))}
      <div className="pad" />
    </div>
  )
}

// ---------- Resumen comparativo ----------

export function WorkoutSummaryScreen({ workoutId, onDone }: { workoutId: string; onDone?: () => void }) {
  const app = useApp()
  const { t } = app
  const { workouts, routines, exerciseMap } = useData()
  const sheet = useSheet()
  const workout = workouts.find((w) => w.id === workoutId)
  if (!workout) return <Screen title={t('summary')}>{null}</Screen>

  const title = routines.find((r) => r.id === workout.routineId)?.name || t('freeWorkout')
  const comparison = workoutComparison(workout, workouts, exerciseMap)
  const date = new Date(workout.date)
  const caption = comparison.previousDate
    ? t('comparedWith', { date: longDay(comparison.previousDate, app.locale) })
    : workout.routineId ? t('firstTimeRoutine') : t('comparedEach')
  const volumeRows = comparison.exercises.filter((e) => e.current.volume > 0 || (e.previous?.volume ?? 0) > 0)

  return (
    <Screen
      title={t('summary')}
      leading={onDone ? <span /> : undefined}
      trailing={<BarButton prominent onClick={onDone ?? sheet.dismiss}>{t('done')}</BarButton>}
    >
      <div style={{ padding: '8px 16px 0', display: 'grid', gap: 20 }}>
        <header>
          <h1 style={{ margin: 0, fontSize: 30, fontWeight: 800, letterSpacing: 0.3 }}>{onDone ? t('workoutCompleted') : title}</h1>
          <div className="secondary" style={{ fontWeight: 600, marginTop: 4 }}>{onDone ? `${title} · ${dayTitle(date, app.locale)}` : dayTitle(date, app.locale)}</div>
          <div className="secondary" style={{ fontSize: 15, marginTop: 4 }}>{caption}</div>
        </header>

        <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 12 }}>
          {(comparison.volume.current > 0 || (comparison.volume.previous ?? 0) > 0) && <TotalTile title={t('volume')} delta={comparison.volume} metric="volume" />}
          <TotalTile title={t('sets')} delta={comparison.sets} metric="totalReps" />
          {comparison.reps.current > 0 && <TotalTile title={t('reps')} delta={comparison.reps} metric="totalReps" />}
          {comparison.duration.current > 0 && <TotalTile title={t('time')} delta={comparison.duration} metric="totalDuration" />}
        </div>

        {comparison.newRecordCount > 0 && (
          <div className="card glass" style={{ display: 'flex', gap: 14, alignItems: 'center', background: 'color-mix(in srgb, var(--gold) 16%, var(--card))' }}>
            <TrophyIcon width={34} height={34} style={{ color: 'var(--gold)', flex: 'none' }} className="trophy-pop" />
            <div>
              <div style={{ fontWeight: 700 }}>{comparison.newRecordCount === 1 ? t('newRecord') : t('newRecords', { n: comparison.newRecordCount })}</div>
              <div className="secondary" style={{ fontSize: 15 }}>{t('beatBest')}</div>
            </div>
          </div>
        )}

        {volumeRows.length > 0 && (
          <div className="card">
            <div style={{ fontWeight: 600, marginBottom: 12 }}>{t('volumeByExercise')}</div>
            <PairedBars
              label={t('volumeByExercise')}
              todayLabel={t('today')}
              previousLabel={t('previous')}
              formatValue={(v) => formatWeight(v, app, 0)}
              rows={volumeRows.map((e) => ({ name: e.name, today: e.current.volume, previous: e.previous ? e.previous.volume : null }))}
            />
          </div>
        )}

        {comparison.exercises.map((e) => <ComparisonCard key={e.exerciseId} comparison={e} />)}
      </div>
    </Screen>
  )
}

function TotalTile({ title, delta, metric }: { title: string; delta: Delta; metric: ProgressMetric }) {
  const app = useApp()
  return (
    <div className="card" style={{ display: 'grid', gap: 4 }}>
      <span className="secondary" style={{ fontSize: 15 }}>{title}</span>
      <span className="num" style={{ fontSize: 24, fontWeight: 700 }}>{formatMetricValue(delta.current, metric, app)}</span>
      <DeltaBadge delta={delta} metric={metric} showPercent />
    </div>
  )
}

function ComparisonCard({ comparison }: { comparison: ExerciseComparison }) {
  const app = useApp()
  const { t } = app
  const firstTime = comparison.previous === null
  return (
    <div className="card" style={{ display: 'grid', gap: 12 }}>
      <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
        <strong style={{ flex: 1, fontSize: 17 }}>{comparison.name}</strong>
        {firstTime && <span className="badge">{t('firstTime')}</span>}
        {comparison.newRecords.length > 0 && (
          <span className="badge" style={{ background: 'color-mix(in srgb, var(--gold) 20%, transparent)', color: 'var(--orange)' }}>
            <TrophyIcon width={12} height={12} /> {t('record')}
          </span>
        )}
      </div>
      {comparison.current.bestSet && (
        <div className="num" style={{ fontSize: 15 }}>
          <div style={{ fontWeight: 500 }}>{t('todayValue', { v: formatSet(comparison.current.bestSet, app) })}</div>
          {comparison.previous?.bestSet && comparison.previousDate && (
            <div className="secondary">{shortDay(comparison.previousDate, app.locale)}: {formatSet(comparison.previous.bestSet, app)}</div>
          )}
        </div>
      )}
      <div style={{ display: 'grid', gridTemplateColumns: `repeat(${comparison.metrics.length}, 1fr)`, gap: 12 }}>
        {comparison.metrics.map((m) => (
          <div key={m.metric} style={{ display: 'grid', gap: 3, minWidth: 0 }}>
            <span className="secondary" style={{ fontSize: 13 }}>{t(`m_${m.metric}` as Key)}</span>
            <span className="num truncate" style={{ fontWeight: 600, fontSize: 15 }}>{formatMetricValue(m.delta.current, m.metric, app)}</span>
            {!firstTime && <DeltaBadge delta={m.delta} metric={m.metric} />}
          </div>
        ))}
      </div>
      {comparison.newRecords.length > 0 && (
        <div style={{ fontSize: 13, fontWeight: 500, color: 'var(--orange)' }}>
          {comparison.newRecords.map((r) => t(`rec_${r}` as Key)).join(' · ')}
        </div>
      )}
    </div>
  )
}
