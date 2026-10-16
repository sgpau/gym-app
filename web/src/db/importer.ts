// Importar y exportar el formato GymBackup (equivalente a GymApp/Models/DataImporter.swift).
import type { GymBackup } from '../core/backup'
import type { Lang } from '../i18n'
import { MUSCLE_GROUPS, newId, type Exercise, type GymDatabase, type MuscleGroup, type Routine, type Workout } from './model'
import { localizedName } from './seed'

export interface ImportResult {
  exercisesCreated: number
  routinesCreated: number
  workoutsImported: number
  setsImported: number
}

const key = (name: string) => name.trim().toLowerCase()

/**
 * Inserta el contenido de un backup. Ejercicios y rutinas existentes (mismo nombre, sin distinguir
 * mayúsculas) se reutilizan; los nombres conocidos se traducen al idioma activo.
 */
export async function importBackup(db: GymDatabase, backup: GymBackup, lang: Lang, options: { replace?: boolean } = {}): Promise<ImportResult> {
  return db.transaction('rw', db.exercises, db.routines, db.workouts, async () => {
    if (options.replace) await deleteWorkoutsAndRoutines(db)
    const result: ImportResult = { exercisesCreated: 0, routinesCreated: 0, workoutsImported: 0, setsImported: 0 }

    const exercises = new Map((await db.exercises.toArray()).map((e) => [key(e.name), e]))
    const info = new Map(backup.exercises.map((e) => [key(e.name), e]))
    const newExercises: Exercise[] = []
    const exerciseFor = (rawName: string, inferred: Exercise['trackingType']) => {
      const name = localizedName(rawName, lang)
      const existing = exercises.get(key(name))
      if (existing) return existing
      const meta = info.get(key(rawName))
      const group = MUSCLE_GROUPS.includes(meta?.muscleGroup as MuscleGroup) ? (meta!.muscleGroup as MuscleGroup) : 'other'
      const created: Exercise = { id: newId(), name, muscleGroup: group, trackingType: meta?.trackingType ?? inferred, notes: '', createdAt: Date.now() }
      exercises.set(key(name), created)
      newExercises.push(created)
      result.exercisesCreated += 1
      return created
    }
    for (const e of backup.exercises) exerciseFor(e.name, e.trackingType ?? 'reps')

    const routines = new Map((await db.routines.toArray()).map((r) => [key(r.name), r]))
    const newRoutines: Routine[] = []
    for (const r of backup.routines) {
      const name = localizedName(r.name, lang)
      if (routines.has(key(name))) continue
      const routine: Routine = {
        id: newId(),
        name,
        createdAt: Date.now() + newRoutines.length,
        items: r.items.map((item) => ({
          exerciseId: exerciseFor(item.exercise, item.duration !== undefined ? 'time' : 'reps').id,
          sets: item.sets ?? 3,
          reps: item.reps ?? 10,
          duration: item.duration ?? 60,
        })),
      }
      routines.set(key(name), routine)
      newRoutines.push(routine)
      result.routinesCreated += 1
    }

    const workouts: Workout[] = backup.workouts.map((w) => ({
      id: newId(),
      date: w.date.getTime(),
      routineId: w.routine ? routines.get(key(localizedName(w.routine, lang)))?.id ?? null : null,
      notes: w.notes ? localizedName(w.notes, lang) : '',
      finished: true,
      entries: w.exercises.map((e) => {
        const timed = e.sets.some((s) => s.duration !== undefined)
        result.setsImported += e.sets.length
        return {
          exerciseId: exerciseFor(e.exercise, timed ? 'time' : 'reps').id,
          sets: e.sets.map((s) => ({ reps: s.reps ?? null, duration: s.duration ?? null, weight: s.weight ?? null })),
        }
      }),
    }))
    result.workoutsImported = workouts.length

    await db.exercises.bulkAdd(newExercises)
    await db.routines.bulkAdd(newRoutines)
    await db.workouts.bulkAdd(workouts)
    return result
  })
}

/** Copia de seguridad completa en el mismo formato que se importa. */
export async function exportBackup(db: GymDatabase): Promise<GymBackup> {
  const [exercises, routines, workouts] = await Promise.all([db.exercises.toArray(), db.routines.toArray(), db.workouts.toArray()])
  const byId = new Map(exercises.map((e) => [e.id, e]))
  const routineName = new Map(routines.map((r) => [r.id, r.name]))
  const clean = <T extends object>(o: T) => Object.fromEntries(Object.entries(o).filter(([, v]) => v !== null && v !== undefined && v !== '')) as T
  return {
    version: 1,
    exercises: exercises.map((e) => ({ name: e.name, muscleGroup: e.muscleGroup, trackingType: e.trackingType })),
    routines: routines.map((r) => ({
      name: r.name,
      items: r.items.flatMap((item) => {
        const exercise = byId.get(item.exerciseId)
        if (!exercise) return []
        return [exercise.trackingType === 'time'
          ? { exercise: exercise.name, sets: item.sets, duration: item.duration }
          : { exercise: exercise.name, sets: item.sets, reps: item.reps }]
      }),
    })),
    workouts: workouts
      .filter((w) => w.finished)
      .sort((a, b) => a.date - b.date)
      .map((w) => clean({
        date: new Date(w.date),
        routine: w.routineId ? routineName.get(w.routineId) : undefined,
        notes: w.notes,
        exercises: w.entries.flatMap((e) => {
          const exercise = byId.get(e.exerciseId)
          return exercise
            ? [{
                exercise: exercise.name,
                sets: e.sets.map((s) => ({
                  ...(s.reps !== null ? { reps: s.reps } : {}),
                  ...(s.duration !== null ? { duration: s.duration } : {}),
                  ...(s.weight !== null ? { weight: s.weight } : {}),
                })),
              }]
            : []
        }),
      })),
  }
}

/** Borra entrenos y rutinas (los ejercicios se conservan). */
export async function deleteWorkoutsAndRoutines(db: GymDatabase) {
  await db.workouts.clear()
  await db.routines.clear()
}
