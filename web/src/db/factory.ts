// Crea entrenos ya rellenados con los objetivos de la rutina y el peso de la última vez
// (equivalente a GymApp/Models/WorkoutFactory.swift).
import { lastLog, type ExerciseMap } from './history'
import { newId, type Exercise, type Routine, type Workout, type WorkoutEntry, type WorkoutSet } from './model'

/** Hoy usa la hora actual; otro día del calendario usa ese día a la hora actual. */
export function workoutDate(day: Date, now = new Date()): number {
  const d = new Date(day.getFullYear(), day.getMonth(), day.getDate(), now.getHours(), now.getMinutes(), now.getSeconds())
  return d.getTime()
}

export function makeEntry(
  exercise: Exercise,
  workout: Pick<Workout, 'date' | 'id'>,
  workouts: Workout[],
  exercises: ExerciseMap,
  target: { sets?: number; reps?: number; duration?: number } = {},
): WorkoutEntry {
  const last = lastLog(exercise.id, workouts, exercises, workout.date, workout.id)
  const lastWeight = last ? Math.max(0, ...last.sets.map((s) => s.weight)) : 0
  const lastBest = last?.sets.reduce((best, s) => (best === null || s.weight >= best.weight ? s : best), null as (typeof last.sets)[number] | null)
  const sets: WorkoutSet[] = Array.from({ length: Math.max(1, target.sets ?? 3) }, () => ({
    reps: exercise.trackingType === 'reps' ? target.reps ?? (lastBest?.kind === 'reps' ? lastBest.reps : null) : null,
    duration: exercise.trackingType === 'time' ? target.duration ?? (lastBest?.kind === 'time' ? lastBest.duration : null) : null,
    weight: lastWeight > 0 ? lastWeight : null,
  }))
  return { exerciseId: exercise.id, sets }
}

export function makeWorkout(routine: Routine | null, day: Date, workouts: Workout[], exercises: ExerciseMap): Workout {
  const workout: Workout = { id: newId(), date: workoutDate(day), routineId: routine?.id ?? null, notes: '', finished: false, entries: [] }
  for (const item of routine?.items ?? []) {
    const exercise = exercises.get(item.exerciseId)
    if (!exercise) continue
    workout.entries.push(makeEntry(exercise, workout, workouts, exercises, item))
  }
  return workout
}

/** Una serie nueva copia la anterior, que suele ser lo que se repite. */
export const nextSet = (entry: WorkoutEntry): WorkoutSet => {
  const previous = entry.sets.at(-1)
  return { reps: previous?.reps ?? null, duration: previous?.duration ?? null, weight: previous?.weight ?? null }
}
