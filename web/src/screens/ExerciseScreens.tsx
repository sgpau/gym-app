import { useState } from 'react'
import type { TrackingType } from '../core/stats'
import { MUSCLE_GROUPS, newId, type Exercise, type MuscleGroup } from '../db/model'
import type { Key } from '../i18n'
import { db, useApp, useData } from '../state'
import { useDialogs } from '../ui/dialogs'
import { CheckCircle, Circle, DumbbellIcon, PlusIcon, SearchIcon, TimerIcon } from '../ui/icons'
import { BarButton, Empty, Row, Screen, Section, Segmented } from '../ui/kit'
import { useSheet } from '../ui/nav'

export const muscleKey = (g: MuscleGroup) => `mg_${g}` as Key

export function ExerciseLabel({ exercise }: { exercise: Exercise }) {
  const { t } = useApp()
  return (
    <span style={{ display: 'inline-flex', alignItems: 'center', gap: 6 }}>
      {exercise.name}
      {exercise.trackingType === 'time' && <TimerIcon width={15} height={15} className="tertiary" aria-label={t('byTime')} role="img" />}
    </span>
  )
}

function SearchField({ value, onChange }: { value: string; onChange: (v: string) => void }) {
  const { t } = useApp()
  return (
    <label className="search">
      <SearchIcon width={18} height={18} />
      <input type="search" placeholder={t('searchExercise')} value={value} onChange={(e) => onChange(e.target.value)} enterKeyHint="search" autoCorrect="off" />
    </label>
  )
}

const matches = (name: string, query: string) =>
  name.normalize('NFD').replace(/\p{M}/gu, '').toLowerCase().includes(query.normalize('NFD').replace(/\p{M}/gu, '').toLowerCase().trim())

function grouped(exercises: Exercise[], query: string) {
  const filtered = query ? exercises.filter((e) => matches(e.name, query)) : exercises
  return MUSCLE_GROUPS.map((g) => [g, filtered.filter((e) => e.muscleGroup === g)] as const).filter(([, list]) => list.length)
}

export function ExerciseListScreen() {
  const { t } = useApp()
  const { exercises, workouts, routines } = useData()
  const sheet = useSheet()
  const dialogs = useDialogs()
  const [query, setQuery] = useState('')
  const groups = grouped(exercises, query)

  const remove = (exercise: Exercise) => {
    const w = workouts.filter((x) => x.entries.some((e) => e.exerciseId === exercise.id)).length
    const r = routines.filter((x) => x.items.some((i) => i.exerciseId === exercise.id)).length
    const doDelete = () => db.transaction('rw', db.exercises, db.workouts, db.routines, async () => {
      await db.exercises.delete(exercise.id)
      for (const workout of workouts) {
        if (workout.entries.some((e) => e.exerciseId === exercise.id)) {
          await db.workouts.put({ ...workout, entries: workout.entries.filter((e) => e.exerciseId !== exercise.id) })
        }
      }
      for (const routine of routines) {
        if (routine.items.some((i) => i.exerciseId === exercise.id)) {
          await db.routines.put({ ...routine, items: routine.items.filter((i) => i.exerciseId !== exercise.id) })
        }
      }
    })
    if (!w && !r) return void doDelete()
    dialogs.confirm(t('deleteExerciseTitle'), t('deleteExerciseAction'), () => void doDelete(), t('deleteExerciseMessage', { w, r }))
  }

  return (
    <Screen
      title={t('tabExercises')}
      large
      trailing={<BarButton label={t('newExercise')} onClick={() => sheet.present(<ExerciseEditor />)}><PlusIcon width={22} height={22} /></BarButton>}
    >
      <SearchField value={query} onChange={setQuery} />
      {exercises.length === 0 && <Empty icon={<DumbbellIcon />} title={t('noExercisesTitle')} body={t('noExercisesBody')} />}
      {exercises.length > 0 && groups.length === 0 && <Empty icon={<SearchIcon />} title={t('noResults', { q: query })} />}
      {groups.map(([group, list]) => (
        <Section key={group} header={t(muscleKey(group))}>
          {list.map((exercise) => (
            <Row
              key={exercise.id}
              title={<ExerciseLabel exercise={exercise} />}
              chevron
              onClick={() =>
                dialogs.actions(exercise.name, [
                  { label: t('edit'), onSelect: () => sheet.present(<ExerciseEditor exercise={exercise} />) },
                  { label: t('delete'), destructive: true, onSelect: () => remove(exercise) },
                ])
              }
            />
          ))}
        </Section>
      ))}
    </Screen>
  )
}

export function ExerciseEditor({ exercise }: { exercise?: Exercise }) {
  const { t } = useApp()
  const { workouts } = useData()
  const sheet = useSheet()
  const [name, setName] = useState(exercise?.name ?? '')
  const [group, setGroup] = useState<MuscleGroup>(exercise?.muscleGroup ?? 'chest')
  const [type, setType] = useState<TrackingType>(exercise?.trackingType ?? 'reps')
  const [notes, setNotes] = useState(exercise?.notes ?? '')
  const hasHistory = !!exercise && workouts.some((w) => w.entries.some((e) => e.exerciseId === exercise.id))

  const save = async () => {
    const trimmed = name.trim()
    if (!trimmed) return
    await db.exercises.put({
      id: exercise?.id ?? newId(),
      name: trimmed,
      muscleGroup: group,
      trackingType: type,
      notes,
      createdAt: exercise?.createdAt ?? Date.now(),
    })
    sheet.dismiss()
  }

  return (
    <Screen
      title={exercise ? t('editExercise') : t('newExercise')}
      leading={<BarButton onClick={sheet.dismiss}>{t('cancel')}</BarButton>}
      trailing={<BarButton bold disabled={!name.trim()} onClick={save}>{t('save')}</BarButton>}
    >
      <div style={{ height: 16 }} />
      <Section>
        <Row>
          <input type="text" aria-label={t('exerciseName')} placeholder={t('exerciseName')} value={name} onChange={(e) => setName(e.target.value)} autoFocus={!exercise} enterKeyHint="done" style={{ fontWeight: 600 }} />
        </Row>
      </Section>
      <Section header={t('muscleGroup')}>
        <Row>
          <select aria-label={t('muscleGroup')} value={group} onChange={(e) => setGroup(e.target.value as MuscleGroup)} style={{ flex: 1, border: 0, background: 'transparent', color: 'var(--accent)', textAlign: 'right', direction: 'rtl' }}>
            {MUSCLE_GROUPS.map((g) => <option key={g} value={g}>{t(muscleKey(g))}</option>)}
          </select>
        </Row>
      </Section>
      <Section
        header={t('measuredBy')}
        footer={`${type === 'reps' ? t('footerReps') : t('footerTime')}${hasHistory && exercise!.trackingType !== type ? ` ${t('footerTypeChange')}` : ''}`}
        flush
      >
        <Segmented label={t('measuredBy')} value={type} onChange={setType} options={[{ value: 'reps', label: t('trackingReps') }, { value: 'time', label: t('trackingTime') }]} />
      </Section>
      <Section header={t('notes')}>
        <Row>
          <textarea rows={3} aria-label={t('notes')} placeholder={t('exerciseNotesPlaceholder')} value={notes} onChange={(e) => setNotes(e.target.value)} />
        </Row>
      </Section>
    </Screen>
  )
}

/** Selector con búsqueda; devuelve los elegidos en el orden en que se marcaron. */
export function ExercisePicker({ title, onPick }: { title: string; onPick: (ids: string[]) => void }) {
  const { t } = useApp()
  const { exercises } = useData()
  const sheet = useSheet()
  const [query, setQuery] = useState('')
  const [selection, setSelection] = useState<string[]>([])
  const toggle = (id: string) => setSelection((s) => (s.includes(id) ? s.filter((x) => x !== id) : [...s, id]))

  return (
    <Screen
      title={title}
      leading={<BarButton onClick={sheet.dismiss}>{t('cancel')}</BarButton>}
      trailing={
        <BarButton bold disabled={!selection.length} onClick={() => { onPick(selection); sheet.dismiss() }}>
          {selection.length ? t('addCount', { n: selection.length }) : t('add')}
        </BarButton>
      }
    >
      <div style={{ height: 8 }} />
      <SearchField value={query} onChange={setQuery} />
      {grouped(exercises, query).map(([group, list]) => (
        <Section key={group} header={t(muscleKey(group))}>
          {list.map((exercise) => {
            const selected = selection.includes(exercise.id)
            return (
              <Row
                key={exercise.id}
                title={<ExerciseLabel exercise={exercise} />}
                onClick={() => toggle(exercise.id)}
                trailing={selected ? <CheckCircle width={22} height={22} className="accent" /> : <Circle width={22} height={22} className="tertiary" />}
              />
            )
          })}
        </Section>
      ))}
    </Screen>
  )
}
