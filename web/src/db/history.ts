// Puente entre los datos guardados y la lógica pura de core/ (equivalente a GymApp/Models/History.swift).
import { compareWorkout, type WorkoutComparison } from '../core/comparison'
import { personalBests, summarize, type ExerciseLog, type PersonalBests, type SessionSummary, type SetRecord, type TrackingType } from '../core/stats'
import type { Exercise, Workout, WorkoutEntry, WorkoutSet } from './model'

export type ExerciseMap = Map<string, Exercise>

/** La serie como dato puro, o null si aún está vacía. */
export function setRecord(set: WorkoutSet, type: TrackingType): SetRecord | null {
  if (type === 'reps') {
    return set.reps && set.reps > 0 ? { kind: 'reps', reps: set.reps, weight: set.weight ?? 0 } : null
  }
  return set.duration && set.duration > 0 ? { kind: 'time', duration: set.duration, weight: set.weight ?? 0 } : null
}

export function entryLog(entry: WorkoutEntry, workout: Workout, exercises: ExerciseMap): ExerciseLog | null {
  const exercise = exercises.get(entry.exerciseId)
  if (!exercise) return null
  const sets = entry.sets.map((s) => setRecord(s, exercise.trackingType)).filter((s): s is SetRecord => s !== null)
  return { exerciseId: exercise.id, name: exercise.name, trackingType: exercise.trackingType, date: new Date(workout.date), sets }
}

/** Ejercicios del entreno con al menos una serie rellena. */
export function workoutLogs(workout: Workout, exercises: ExerciseMap): ExerciseLog[] {
  return workout.entries.map((e) => entryLog(e, workout, exercises)).filter((l): l is ExerciseLog => !!l && l.sets.length > 0)
}

export const workoutSummary = (workout: Workout, exercises: ExerciseMap): SessionSummary =>
  summarize(workoutLogs(workout, exercises).flatMap((l) => l.sets))

/** Historial de un ejercicio en entrenos finalizados, del más antiguo al más reciente. */
export function exerciseLogs(
  exerciseId: string,
  workouts: Workout[],
  exercises: ExerciseMap,
  options: { before?: number; excluding?: string } = {},
): ExerciseLog[] {
  const logs: ExerciseLog[] = []
  for (const workout of workouts) {
    if (!workout.finished || workout.id === options.excluding) continue
    if (options.before !== undefined && workout.date >= options.before) continue
    for (const entry of workout.entries) {
      if (entry.exerciseId !== exerciseId) continue
      const log = entryLog(entry, workout, exercises)
      if (log && log.sets.length) logs.push(log)
    }
  }
  return logs.sort((a, b) => a.date.getTime() - b.date.getTime())
}

export function lastLog(exerciseId: string, workouts: Workout[], exercises: ExerciseMap, before: number, excluding?: string) {
  return exerciseLogs(exerciseId, workouts, exercises, { before, excluding }).at(-1) ?? null
}

/** El último entreno finalizado de la misma rutina antes de este. */
export function previousWorkoutOfRoutine(workout: Workout, workouts: Workout[]): Workout | null {
  if (!workout.routineId) return null
  let best: Workout | null = null
  for (const w of workouts) {
    if (w.id === workout.id || !w.finished || w.routineId !== workout.routineId || w.date >= workout.date) continue
    if (!best || w.date > best.date) best = w
  }
  return best
}

/** Compara el entreno con el anterior de su rutina y con el historial de cada ejercicio. */
export function workoutComparison(workout: Workout, workouts: Workout[], exercises: ExerciseMap): WorkoutComparison {
  const previous = previousWorkoutOfRoutine(workout, workouts)
  const lastLogs: Record<string, ExerciseLog | undefined> = {}
  const bests: Record<string, PersonalBests | undefined> = {}
  for (const entry of workout.entries) {
    const history = exerciseLogs(entry.exerciseId, workouts, exercises, { before: workout.date, excluding: workout.id })
    lastLogs[entry.exerciseId] = history.at(-1)
    bests[entry.exerciseId] = personalBests(history)
  }
  return compareWorkout(
    workoutLogs(workout, exercises),
    previous ? { date: new Date(previous.date), logs: workoutLogs(previous, exercises) } : null,
    lastLogs,
    bests,
  )
}
