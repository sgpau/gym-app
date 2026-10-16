// Comparación de un entreno con el anterior (port de GymApp/Core/WorkoutComparison.swift).
import {
  availableMetrics, metricValue, summarize,
  type ExerciseLog, type PersonalBests, type ProgressMetric, type SessionSummary, type TrackingType,
} from './stats'

export type Trend = 'up' | 'down' | 'same' | 'new'

export interface Delta {
  current: number
  previous: number | null
}

export const deltaChange = (d: Delta): number | null => (d.previous === null ? null : d.current - d.previous)

/** Cambio relativo (0.06 = +6 %); null si no hay anterior o era 0. */
export function deltaPercent(d: Delta): number | null {
  if (d.previous === null || d.previous === 0) return null
  return (d.current - d.previous) / d.previous
}

export function trendOf(d: Delta): Trend {
  const change = deltaChange(d)
  if (change === null) return 'new'
  if (Math.abs(change) < 0.0001) return 'same'
  return change > 0 ? 'up' : 'down'
}

export type RecordKind = 'maxWeight' | 'oneRepMax' | 'maxReps' | 'maxDuration'

export interface MetricDelta {
  metric: ProgressMetric
  delta: Delta
}

export interface ExerciseComparison {
  exerciseId: string
  name: string
  trackingType: TrackingType
  current: SessionSummary
  previous: SessionSummary | null
  previousDate: Date | null
  metrics: MetricDelta[]
  newRecords: RecordKind[]
}

export interface PreviousWorkout {
  date: Date
  logs: ExerciseLog[]
}

export interface WorkoutComparison {
  exercises: ExerciseComparison[]
  previousDate: Date | null
  volume: Delta
  sets: Delta
  reps: Delta
  duration: Delta
  newRecordCount: number
}

/**
 * @param current  ejercicios del entreno de hoy
 * @param previous entreno anterior de la misma rutina (null en libres o si es el primero)
 * @param lastLogs última vez de cada ejercicio, para los que no estaban en `previous`
 * @param bests    mejores marcas de cada ejercicio antes de hoy, para detectar récords
 */
export function compareWorkout(
  current: ExerciseLog[],
  previous: PreviousWorkout | null,
  lastLogs: Record<string, ExerciseLog | undefined> = {},
  bests: Record<string, PersonalBests | undefined> = {},
): WorkoutComparison {
  const logs = current.filter((l) => l.sets.length > 0)
  const exercises = logs.map((log) => {
    const previousLog =
      previous?.logs.find((p) => p.exerciseId === log.exerciseId && p.sets.length > 0) ?? lastLogs[log.exerciseId] ?? null
    return compareExercise(log, previousLog, bests[log.exerciseId] ?? null)
  })
  const today = summarize(logs.flatMap((l) => l.sets))
  const before = previous ? summarize(previous.logs.flatMap((l) => l.sets)) : null
  return {
    exercises,
    previousDate: previous?.date ?? null,
    volume: { current: today.volume, previous: before?.volume ?? null },
    sets: { current: today.setCount, previous: before?.setCount ?? null },
    reps: { current: today.totalReps, previous: before?.totalReps ?? null },
    duration: { current: today.totalDuration, previous: before?.totalDuration ?? null },
    newRecordCount: exercises.reduce((a, e) => a + e.newRecords.length, 0),
  }
}

export function compareExercise(log: ExerciseLog, previousLog: ExerciseLog | null, best: PersonalBests | null): ExerciseComparison {
  const current = summarize(log.sets)
  const previous = previousLog ? summarize(previousLog.sets) : null
  const usesWeight = current.maxWeight > 0 || (previous?.maxWeight ?? 0) > 0
  const metrics = availableMetrics(log.trackingType, usesWeight).map((metric) => ({
    metric,
    delta: {
      current: metricValue(current, metric) ?? 0,
      previous: previous ? metricValue(previous, metric) ?? 0 : null,
    },
  }))
  return {
    exerciseId: log.exerciseId,
    name: log.name,
    trackingType: log.trackingType,
    current,
    previous,
    previousDate: previousLog?.date ?? null,
    metrics,
    newRecords: newRecords(current, log.trackingType, best),
  }
}

/** Récords respecto a todo el historial. La primera vez que se hace un ejercicio no cuenta. */
export function newRecords(summary: SessionSummary, type: TrackingType, best: PersonalBests | null): RecordKind[] {
  if (!best || best.sessionCount === 0) return []
  const records: RecordKind[] = []
  if (type === 'reps') {
    if (summary.maxWeight > 0) {
      if (summary.maxWeight > best.maxWeight) records.push('maxWeight')
      if (summary.bestOneRepMax !== null && summary.bestOneRepMax > best.oneRepMax) records.push('oneRepMax')
    } else if (summary.maxReps > best.maxReps) {
      records.push('maxReps')
    }
  } else if (summary.maxDuration > best.maxDuration) {
    records.push('maxDuration')
  }
  return records
}
