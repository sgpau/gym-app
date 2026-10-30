import { useEffect, useState } from 'react'
import { formatDuration } from '../core/format'
import { planProgress, type PlanProgress } from '../core/weeklyPlan'
import { makeWorkout } from '../db/factory'
import type { Routine } from '../db/model'
import { db, useApp, useData } from '../state'
import { shortDay } from '../ui/dates'
import { ArrowDown, ArrowUp, CheckCircle, Circle, ListIcon, PlayIcon, PlusIcon, TrashIcon } from '../ui/icons'
import { BarButton, Empty, Row, Screen, Section } from '../ui/kit'
import { useNav, useSheet } from '../ui/nav'
import { WorkoutFlow, WorkoutSummaryScreen } from './WorkoutScreens'

/** La fecha actual, que se actualiza al volver a la app y cada minuto (para cambiar de día a medianoche). */
function useNow() {
  const [now, setNow] = useState(() => new Date())
  useEffect(() => {
    const refresh = () => setNow(new Date())
    const id = setInterval(refresh, 60_000)
    document.addEventListener('visibilitychange', refresh)
    return () => { clearInterval(id); document.removeEventListener('visibilitychange', refresh) }
  }, [])
  return now
}

export function TodayScreen() {
  const { t, locale } = useApp()
  const { plan, routines, workouts, exerciseMap, loaded } = useData()
  const nav = useNav()
  const sheet = useSheet()
  const now = useNow()
  const routineById = new Map(routines.map((r) => [r.id, r]))
  const progress = planProgress(plan, workouts, now)
  const editPlan = () => nav.push(<PlanEditor />, t('tabToday'))

  const start = async (routine: Routine) => {
    const workout = makeWorkout(routine, now, workouts, exerciseMap)
    await db.workouts.add(workout)
    sheet.present(<WorkoutFlow workoutId={workout.id} isNew />, { full: true })
  }
  const open = (workoutId: string) => sheet.present(<WorkoutFlow workoutId={workoutId} />, { full: true })

  return (
    <Screen
      title={t('tabToday')}
      large
      trailing={plan.length > 0 ? <BarButton onClick={editPlan}>{t('edit')}</BarButton> : undefined}
    >
      {!loaded ? null : plan.length === 0 ? (
        <Empty
          icon={<ListIcon />}
          title={t('noPlan')}
          body={t('noPlanBody')}
          action={<button className="primary-button" style={{ width: 'auto', padding: '0 24px', marginTop: 12 }} onClick={editPlan}>{t('createPlan')}</button>}
        />
      ) : (
        <>
          <div style={{ padding: '0 16px 28px' }}>
            <TodayCard
              progress={progress}
              routineById={routineById}
              onStart={start}
              onOpen={open}
              onSummary={(id) => sheet.present(<WorkoutSummaryScreen workoutId={id} />)}
              onAnyway={() => sheet.present(<WorkoutFlow day={now} />, { full: true })}
            />
          </div>
          <Section header={t('thisWeek')} footer={t('planFooter')}>
            {progress.slots.map((slot, index) => {
              const routine = routineById.get(slot.routineId)
              const done = workouts.find((w) => w.id === slot.workoutId)
              return (
                <Row
                  key={index}
                  leading={done
                    ? <CheckCircle width={24} height={24} className="accent" />
                    : <Circle width={24} height={24} className={index === progress.next ? 'accent' : 'tertiary'} />}
                  title={<span style={index === progress.next ? { fontWeight: 600 } : undefined}>{routine?.name || t('unnamedRoutine')}</span>}
                  value={done ? shortDay(new Date(done.date), locale) : undefined}
                  onClick={done ? () => sheet.present(<WorkoutSummaryScreen workoutId={done.id} />) : undefined}
                />
              )
            })}
          </Section>
        </>
      )}
    </Screen>
  )
}

function TodayCard({ progress, routineById, onStart, onOpen, onSummary, onAnyway }: {
  progress: PlanProgress
  routineById: Map<string, Routine>
  onStart: (r: Routine) => void
  onOpen: (workoutId: string) => void
  onSummary: (workoutId: string) => void
  onAnyway: () => void
}) {
  const { t } = useApp()
  const { exerciseMap } = useData()
  const total = progress.slots.length
  const next = progress.next === null ? null : routineById.get(progress.slots[progress.next].routineId) ?? null

  if (progress.inProgress) {
    return (
      <div className="card" style={{ display: 'grid', gap: 12 }}>
        <span className="badge" style={{ justifySelf: 'start' }}>{t('inProgress')}</span>
        <button className="primary-button" onClick={() => onOpen(progress.inProgress!)}><PlayIcon width={18} height={18} /> {t('continueWorkout')}</button>
      </div>
    )
  }

  if (progress.doneToday) {
    return (
      <div className="card" style={{ display: 'grid', gap: 12 }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: 12 }}>
          <CheckCircle width={36} height={36} className="accent" style={{ flex: 'none' }} />
          <strong style={{ fontSize: 20 }}>{t('todayDone')}</strong>
        </div>
        <div className="secondary">{next ? t('tomorrow', { name: next.name || t('unnamedRoutine') }) : t('weekDoneAfterToday')}</div>
        <button className="primary-button" onClick={() => onSummary(progress.doneToday!)}>{t('viewSummary')}</button>
        {next && <button className="bar-button" style={{ justifySelf: 'center' }} onClick={() => onStart(next)}>{t('doAnyway')}</button>}
      </div>
    )
  }

  if (!next) {
    return (
      <div className="card" style={{ display: 'grid', gap: 12 }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: 12 }}>
          <CheckCircle width={36} height={36} className="accent" style={{ flex: 'none' }} />
          <strong style={{ fontSize: 20 }}>{t('weekDone')}</strong>
        </div>
        <div className="secondary">{t('weekDoneBody')}</div>
        <button className="bar-button" style={{ justifySelf: 'center' }} onClick={onAnyway}>{t('doAnyway')}</button>
      </div>
    )
  }

  return (
    <div className="card" style={{ display: 'grid', gap: 14 }}>
      <div>
        <div className="secondary" style={{ fontSize: 15, fontWeight: 600 }}>{t('workoutOfWeek', { i: progress.next! + 1, n: total })}</div>
        <h2 style={{ margin: '2px 0 0', fontSize: 28, fontWeight: 800 }}>{next.name || t('unnamedRoutine')}</h2>
      </div>
      <ul style={{ margin: 0, padding: 0, listStyle: 'none', display: 'grid', gap: 6 }}>
        {next.items.map((item, index) => {
          const exercise = exerciseMap.get(item.exerciseId)
          if (!exercise) return null
          const target = exercise.trackingType === 'time'
            ? t('targetReps', { sets: item.sets, reps: formatDuration(item.duration) })
            : t('targetReps', { sets: item.sets, reps: item.reps })
          return (
            <li key={index} style={{ display: 'flex', gap: 8 }}>
              <span className="truncate" style={{ flex: 1 }}>{exercise.name}</span>
              <span className="secondary num">{target}</span>
            </li>
          )
        })}
      </ul>
      <button className="primary-button" onClick={() => onStart(next)}><PlayIcon width={18} height={18} /> {t('startWorkout')}</button>
    </div>
  )
}

function PlanEditor() {
  const { t } = useApp()
  const { plan, routines } = useData()
  const sheet = useSheet()
  const routineById = new Map(routines.map((r) => [r.id, r]))
  const usable = routines.filter((r) => r.items.length > 0)
  const save = (routineIds: string[]) => db.plan.put({ id: 'week', routineIds })
  const move = (index: number, by: number) => {
    const ids = [...plan]
    const [id] = ids.splice(index, 1)
    ids.splice(index + by, 0, id)
    void save(ids)
  }

  return (
    <Screen title={t('weeklyPlan')}>
      <div style={{ height: 16 }} />
      <Section footer={usable.length ? t('planFooter') : t('planEmptyRoutines')}>
        {plan.map((id, index) => (
          <Row
            key={`${id}-${index}`}
            leading={<span className="num tertiary" style={{ width: 18, fontWeight: 600 }}>{index + 1}</span>}
            title={<strong style={{ fontWeight: 600 }} className="truncate">{routineById.get(id)?.name || t('unnamedRoutine')}</strong>}
            trailing={
              <span style={{ display: 'inline-flex', gap: 4 }}>
                <button className="bar-button" aria-label={t('moveUp')} disabled={index === 0} onClick={() => move(index, -1)}><ArrowUp width={18} height={18} /></button>
                <button className="bar-button" aria-label={t('moveDown')} disabled={index === plan.length - 1} onClick={() => move(index, 1)}><ArrowDown width={18} height={18} /></button>
                <button className="bar-button" style={{ color: 'var(--red)' }} aria-label={t('remove')} onClick={() => void save(plan.filter((_, i) => i !== index))}><TrashIcon width={18} height={18} /></button>
              </span>
            }
          />
        ))}
        {usable.length > 0 && (
          <Row
            className="action"
            leading={<PlusIcon width={20} height={20} />}
            title={t('addRoutine')}
            onClick={() => sheet.present(<RoutinePicker routines={usable} onPick={(id) => {
              // Se lee el plan guardado por si cambió mientras la hoja estaba abierta.
              void db.plan.get('week').then((current) => save([...(current?.routineIds ?? []).filter((r) => routineById.has(r)), id]))
            }} />)}
          />
        )}
      </Section>
    </Screen>
  )
}

function RoutinePicker({ routines, onPick }: { routines: Routine[]; onPick: (id: string) => void }) {
  const { t } = useApp()
  const sheet = useSheet()
  return (
    <Screen title={t('chooseRoutine')} leading={<BarButton onClick={sheet.dismiss}>{t('cancel')}</BarButton>}>
      <div style={{ height: 16 }} />
      <Section>
        {routines.map((routine) => (
          <Row
            key={routine.id}
            leading={<ListIcon width={26} height={26} className="accent" />}
            title={routine.name || t('unnamedRoutine')}
            subtitle={t('exercisesCount', { n: routine.items.length })}
            onClick={() => { onPick(routine.id); sheet.dismiss() }}
          />
        ))}
      </Section>
    </Screen>
  )
}
