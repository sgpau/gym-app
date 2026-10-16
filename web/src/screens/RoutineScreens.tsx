import { useEffect, useRef, useState } from 'react'
import { formatDuration } from '../core/format'
import { newId, type Routine, type RoutineItem } from '../db/model'
import { db, useApp, useData } from '../state'
import { useDialogs } from '../ui/dialogs'
import { ArrowDown, ArrowUp, ListIcon, PlusIcon, TrashIcon } from '../ui/icons'
import { BarButton, Empty, Row, Screen, Section, Stepper } from '../ui/kit'
import { useNav, useSheet } from '../ui/nav'
import { ExercisePicker } from './ExerciseScreens'

export function RoutineListScreen() {
  const { t } = useApp()
  const { routines, exerciseMap } = useData()
  const nav = useNav()

  const create = async () => {
    const routine: Routine = { id: newId(), name: '', createdAt: Date.now(), items: [] }
    await db.routines.add(routine)
    nav.push(<RoutineEditor routineId={routine.id} isNew />, t('tabRoutines'))
  }

  return (
    <Screen title={t('tabRoutines')} large trailing={<BarButton label={t('newRoutine')} onClick={create}><PlusIcon width={22} height={22} /></BarButton>}>
      {routines.length === 0 ? (
        <Empty
          icon={<ListIcon />}
          title={t('noRoutines')}
          body={t('noRoutinesBody')}
          action={<button className="primary-button" style={{ width: 'auto', padding: '0 24px', marginTop: 12 }} onClick={create}>{t('createRoutine')}</button>}
        />
      ) : (
        <Section>
          {routines.map((routine) => {
            const names = routine.items.map((i) => exerciseMap.get(i.exerciseId)?.name).filter(Boolean)
            return (
              <Row
                key={routine.id}
                title={routine.name || t('unnamedRoutine')}
                subtitle={<span style={{ display: '-webkit-box', WebkitLineClamp: 2, WebkitBoxOrient: 'vertical', overflow: 'hidden' }}>{names.length ? names.join(' · ') : t('noExercises')}</span>}
                chevron
                onClick={() => nav.push(<RoutineEditor routineId={routine.id} />, t('tabRoutines'))}
              />
            )
          })}
        </Section>
      )}
    </Screen>
  )
}

function RoutineEditor({ routineId, isNew = false }: { routineId: string; isNew?: boolean }) {
  const { t } = useApp()
  const { routines, exerciseMap } = useData()
  const nav = useNav()
  const sheet = useSheet()
  const dialogs = useDialogs()
  const routine = routines.find((r) => r.id === routineId)
  const latest = useRef(routine)
  latest.current = routine

  // Al salir: una rutina nueva vacía se descarta; una sin nombre recibe uno.
  useEffect(() => () => {
    const current = latest.current
    if (!current) return
    if (!current.name.trim() && !current.items.length) void db.routines.delete(current.id)
    else if (!current.name.trim()) void db.routines.update(current.id, { name: t('unnamedRoutine') })
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [])

  if (!routine) return <Screen title={t('newRoutine')}>{null}</Screen>
  const save = (patch: Partial<Routine>) => db.routines.update(routine.id, patch)
  const setItems = (items: RoutineItem[]) => save({ items })
  const updateItem = (index: number, patch: Partial<RoutineItem>) => setItems(routine.items.map((item, i) => (i === index ? { ...item, ...patch } : item)))
  const move = (index: number, by: number) => {
    const items = [...routine.items]
    const [item] = items.splice(index, 1)
    items.splice(index + by, 0, item)
    setItems(items)
  }

  return (
    <Screen
      title={routine.name || t('newRoutine')}
      trailing={routine.items.length > 0 ? (
        <BarButton
          label={t('delete')}
          onClick={() => dialogs.confirm(t('deleteRoutineTitle'), t('delete'), async () => { nav.pop(); await db.routines.delete(routine.id) }, t('deleteRoutineMessage'))}
        >
          <TrashIcon width={20} height={20} />
        </BarButton>
      ) : undefined}
    >
      <div style={{ height: 16 }} />
      <Section header={t('name')}>
        <Row>
          <NameField value={routine.name} placeholder={t('routineNamePlaceholder')} onChange={(name) => save({ name })} autoFocus={isNew} />
        </Row>
      </Section>
      <Section header={t('exercises')}>
        {routine.items.map((item, index) => {
          const exercise = exerciseMap.get(item.exerciseId)
          if (!exercise) return null
          return (
            <div className="row" key={`${item.exerciseId}-${index}`} style={{ flexDirection: 'column', alignItems: 'stretch', gap: 8 }}>
              <div style={{ display: 'flex', alignItems: 'center', gap: 4 }}>
                <strong style={{ flex: 1, fontWeight: 600 }} className="truncate">{exercise.name}</strong>
                <button className="bar-button" aria-label={t('moveUp')} disabled={index === 0} onClick={() => move(index, -1)}><ArrowUp width={18} height={18} /></button>
                <button className="bar-button" aria-label={t('moveDown')} disabled={index === routine.items.length - 1} onClick={() => move(index, 1)}><ArrowDown width={18} height={18} /></button>
                <button className="bar-button" style={{ color: 'var(--red)' }} aria-label={t('remove')} onClick={() => setItems(routine.items.filter((_, i) => i !== index))}><TrashIcon width={18} height={18} /></button>
              </div>
              <StepperRow label={t('setsCount', { n: item.sets })} value={item.sets} min={1} max={20} onChange={(sets) => updateItem(index, { sets })} />
              {exercise.trackingType === 'time' ? (
                <StepperRow label={t('perSet', { v: formatDuration(item.duration) })} value={item.duration} min={5} max={3600} step={15} onChange={(duration) => updateItem(index, { duration })} />
              ) : (
                <StepperRow label={t('repetitionsCount', { n: item.reps })} value={item.reps} min={1} max={100} onChange={(reps) => updateItem(index, { reps })} />
              )}
            </div>
          )
        })}
        <Row
          className="action"
          leading={<PlusIcon width={20} height={20} />}
          title={t('addExercises')}
          onClick={() =>
            sheet.present(
              <ExercisePicker
                title={t('addExercises')}
                onPick={(ids) => {
                  const current = latest.current ?? routine
                  void setItems([...current.items, ...ids.map((exerciseId) => ({ exerciseId, sets: 3, reps: 10, duration: 60 }))])
                }}
              />,
            )
          }
        />
      </Section>
    </Screen>
  )
}

function StepperRow({ label, ...props }: { label: string; value: number; min: number; max: number; step?: number; onChange: (v: number) => void }) {
  return (
    <div style={{ display: 'flex', alignItems: 'center', gap: 12 }}>
      <span className="num" style={{ flex: 1 }}>{label}</span>
      <Stepper label={label} {...props} />
    </div>
  )
}

/** Campo de texto que guarda al escribir sin perder el cursor por las actualizaciones de la base de datos. */
export function NameField({ value, onChange, placeholder, autoFocus }: { value: string; onChange: (v: string) => void; placeholder: string; autoFocus?: boolean }) {
  const [text, setText] = useState(value)
  return (
    <input
      type="text"
      aria-label={placeholder}
      placeholder={placeholder}
      value={text}
      autoFocus={autoFocus}
      enterKeyHint="done"
      style={{ fontWeight: 600 }}
      onChange={(e) => { setText(e.target.value); onChange(e.target.value) }}
      onKeyDown={(e) => { if (e.key === 'Enter') e.currentTarget.blur() }}
    />
  )
}
