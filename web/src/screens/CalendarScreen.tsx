import { useMemo, useRef, useState } from 'react'
import { formatDuration, formatWeight } from '../core/format'
import { addMonths, dayKey, monthGrid, sameDay, startOfDay, weekdaySymbols } from '../core/monthGrid'
import { workoutLogs, workoutSummary } from '../db/history'
import type { Workout } from '../db/model'
import { db, useApp, useData } from '../state'
import { dayTitle, monthTitle } from '../ui/dates'
import { useDialogs } from '../ui/dialogs'
import { ChevronLeft, ChevronRight, EllipsisIcon, GearIcon, PlusIcon } from '../ui/icons'
import { BarButton, Screen } from '../ui/kit'
import { useSheet } from '../ui/nav'
import { SettingsScreen } from './SettingsScreen'
import { WorkoutFlow, WorkoutSummaryScreen } from './WorkoutScreens'

export function CalendarScreen() {
  const app = useApp()
  const { t } = app
  const { workouts } = useData()
  const sheet = useSheet()
  const [selected, setSelected] = useState(() => startOfDay(new Date()))
  const days = useMemo(() => new Set(workouts.map((w) => dayKey(new Date(w.date)))), [workouts])
  const dayWorkouts = workouts.filter((w) => sameDay(new Date(w.date), selected))

  return (
    <Screen
      title={t('tabCalendar')}
      large
      trailing={<BarButton label={t('settings')} onClick={() => sheet.present(<SettingsScreen />)}><GearIcon width={22} height={22} /></BarButton>}
    >
      <MonthCalendar selected={selected} onSelect={setSelected} workoutDays={days} />
      <div style={{ padding: '24px 16px 0', display: 'grid', gap: 12 }}>
        <h2 style={{ margin: 0, fontSize: 20, fontWeight: 700 }}>{dayTitle(selected, app.locale)}</h2>
        {dayWorkouts.length === 0 && <p className="secondary" style={{ margin: 0 }}>{t('noWorkoutsDay')}</p>}
        {dayWorkouts.map((w) => <WorkoutCard key={w.id} workout={w} />)}
        <button className="primary-button" style={{ marginTop: 4 }} onClick={() => sheet.present(<WorkoutFlow day={selected} />, { full: true })}>
          <PlusIcon width={20} height={20} /> {t('logWorkout')}
        </button>
      </div>
    </Screen>
  )
}

function MonthCalendar({ selected, onSelect, workoutDays }: { selected: Date; onSelect: (d: Date) => void; workoutDays: Set<string> }) {
  const app = useApp()
  const [grid, setGrid] = useState(() => monthGrid(new Date()))
  const [direction, setDirection] = useState(1)
  const touch = useRef<number | null>(null)
  const today = new Date()

  const move = (by: number) => {
    setDirection(by)
    setGrid((g) => addMonths(g, by))
  }
  const goToday = () => {
    const now = monthGrid(today)
    setDirection(now.monthStart > grid.monthStart ? 1 : -1)
    setGrid(now)
    onSelect(startOfDay(today))
  }

  return (
    <div
      onTouchStart={(e) => { touch.current = e.touches[0].clientX }}
      onTouchEnd={(e) => {
        if (touch.current === null) return
        const dx = e.changedTouches[0].clientX - touch.current
        touch.current = null
        if (Math.abs(dx) > 50) move(dx < 0 ? 1 : -1)
      }}
      style={{ touchAction: 'pan-y' }}
    >
      <div className="month-header">
        <button className="icon-button" aria-label={app.t('previousMonth')} onClick={() => move(-1)}><ChevronLeft /></button>
        <button className="month-title" onClick={goToday} aria-label={`${monthTitle(grid.monthStart, app.locale)}. ${app.t('today')}`}>
          {monthTitle(grid.monthStart, app.locale)}
        </button>
        <button className="icon-button" aria-label={app.t('nextMonth')} onClick={() => move(1)}><ChevronRight /></button>
      </div>
      <div className="weekdays" aria-hidden>{weekdaySymbols(app.locale).map((s, i) => <span key={i}>{s}</span>)}</div>
      <div key={grid.monthStart.getTime()} className="days month-swap" style={{ ['--from' as string]: `${direction * 24}px` }}>
        {grid.days.map((d, i) =>
          d ? (
            <button
              key={i}
              className={`day${sameDay(d, today) ? ' today' : ''}${sameDay(d, selected) ? ' selected' : ''}${workoutDays.has(dayKey(d)) ? ' has-workout' : ''}`}
              aria-label={`${dayTitle(d, app.locale)}${workoutDays.has(dayKey(d)) ? `, ${app.t('withWorkout')}` : ''}`}
              aria-pressed={sameDay(d, selected)}
              onClick={() => onSelect(d)}
            >
              <span className="day-number">{d.getDate()}</span>
              <span className="dot" />
            </button>
          ) : (
            <span key={i} />
          ),
        )}
      </div>
    </div>
  )
}

function WorkoutCard({ workout }: { workout: Workout }) {
  const app = useApp()
  const { t } = app
  const { routines, exerciseMap } = useData()
  const sheet = useSheet()
  const dialogs = useDialogs()
  const title = routines.find((r) => r.id === workout.routineId)?.name || t('freeWorkout')
  const summary = workoutSummary(workout, exerciseMap)
  const parts = [t('exercisesCount', { n: workoutLogs(workout, exerciseMap).length }), t('setsCount', { n: summary.setCount })]
  if (summary.volume > 0) parts.push(formatWeight(summary.volume, app))
  if (summary.totalDuration > 0) parts.push(formatDuration(summary.totalDuration))

  return (
    <div className="card" style={{ display: 'flex', alignItems: 'center', gap: 8, padding: 0 }}>
      <button style={{ flex: 1, textAlign: 'left', padding: 16, minWidth: 0 }} onClick={() => sheet.present(<WorkoutFlow workoutId={workout.id} />, { full: true })}>
        <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
          <strong className="truncate" style={{ fontSize: 17 }}>{title}</strong>
          {!workout.finished && <span className="badge">{t('inProgress')}</span>}
        </div>
        <div className="secondary num" style={{ fontSize: 15, marginTop: 2 }}>{parts.join(' · ')}</div>
      </button>
      <button
        className="bar-button"
        aria-label={title}
        style={{ marginRight: 8 }}
        onClick={() =>
          dialogs.actions(title, [
            ...(workout.finished ? [{ label: t('viewComparison'), onSelect: () => sheet.present(<WorkoutSummaryScreen workoutId={workout.id} />) }] : []),
            {
              label: t('delete'),
              destructive: true,
              onSelect: () => dialogs.confirm(t('deleteWorkoutTitle'), t('delete'), () => void db.workouts.delete(workout.id), t('deleteWorkoutMessage')),
            },
          ])
        }
      >
        <EllipsisIcon width={24} height={24} />
      </button>
    </div>
  )
}
