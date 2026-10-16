// Lógica pura de series y estadísticas (port de GymApp/Core/SetRecord.swift y ExerciseStats.swift).

export type TrackingType = 'reps' | 'time'

/** Una serie realizada. El peso está en kg; 0 = peso corporal. */
export type SetRecord =
  | { kind: 'reps'; reps: number; weight: number }
  | { kind: 'time'; duration: number; weight: number }

export const repsSet = (reps: number, weight = 0): SetRecord => ({ kind: 'reps', reps, weight })
export const timeSet = (duration: number, weight = 0): SetRecord => ({ kind: 'time', duration, weight })

/** Kilos movidos (reps × peso). Las series por tiempo no suman volumen. */
export function volumeOf(set: SetRecord): number {
  return set.kind === 'reps' ? set.reps * set.weight : 0
}

/** 1RM estimado con la fórmula de Epley; null sin peso o sin reps. */
export function oneRepMaxOf(set: SetRecord): number | null {
  if (set.kind !== 'reps' || set.reps <= 0 || set.weight <= 0) return null
  return set.reps === 1 ? set.weight : set.weight * (1 + set.reps / 30)
}

/** Todas las series de un ejercicio dentro de un entreno. */
export interface ExerciseLog {
  exerciseId: string
  name: string
  trackingType: TrackingType
  date: Date
  sets: SetRecord[]
}

export type ProgressMetric = 'maxWeight' | 'oneRepMax' | 'volume' | 'totalReps' | 'maxDuration' | 'totalDuration'

/** Métricas con sentido para un tipo de ejercicio. Sin peso, los ejercicios por reps se siguen por repeticiones. */
export function availableMetrics(type: TrackingType, usesWeight: boolean): ProgressMetric[] {
  if (type === 'reps') return usesWeight ? ['maxWeight', 'oneRepMax', 'volume'] : ['totalReps']
  return usesWeight ? ['maxDuration', 'totalDuration', 'maxWeight'] : ['maxDuration', 'totalDuration']
}

export interface SessionSummary {
  setCount: number
  totalReps: number
  maxReps: number
  maxWeight: number
  bestOneRepMax: number | null
  volume: number
  maxDuration: number
  totalDuration: number
  bestSet: SetRecord | null
}

export function summarize(sets: SetRecord[]): SessionSummary {
  const reps = sets.flatMap((s) => (s.kind === 'reps' ? [s.reps] : []))
  const durations = sets.flatMap((s) => (s.kind === 'time' ? [s.duration] : []))
  const orms = sets.map(oneRepMaxOf).filter((v): v is number => v !== null)
  return {
    setCount: sets.length,
    totalReps: reps.reduce((a, b) => a + b, 0),
    maxReps: Math.max(0, ...reps),
    maxWeight: Math.max(0, ...sets.map((s) => s.weight)),
    bestOneRepMax: orms.length ? Math.max(...orms) : null,
    volume: sets.reduce((a, s) => a + volumeOf(s), 0),
    maxDuration: Math.max(0, ...durations),
    totalDuration: durations.reduce((a, b) => a + b, 0),
    bestSet: bestSet(sets),
  }
}

export function metricValue(summary: SessionSummary, metric: ProgressMetric): number | null {
  switch (metric) {
    case 'maxWeight': return summary.maxWeight
    case 'oneRepMax': return summary.bestOneRepMax
    case 'volume': return summary.volume
    case 'totalReps': return summary.totalReps
    case 'maxDuration': return summary.maxDuration
    case 'totalDuration': return summary.totalDuration
  }
}

/** Por reps: la de más peso (a igual peso, más reps). Por tiempo: la más larga (a igual tiempo, más peso). */
export function bestSet(sets: SetRecord[]): SetRecord | null {
  const rank = (s: SetRecord): [number, number] => (s.kind === 'reps' ? [s.weight, s.reps] : [s.duration, s.weight])
  let best: SetRecord | null = null
  for (const set of sets) {
    if (!best) { best = set; continue }
    const [a1, a2] = rank(set)
    const [b1, b2] = rank(best)
    if (a1 > b1 || (a1 === b1 && a2 > b2)) best = set
  }
  return best
}

export interface PersonalBests {
  sessionCount: number
  maxWeight: number
  oneRepMax: number
  maxReps: number
  volume: number
  maxDuration: number
}

export function personalBests(logs: ExerciseLog[]): PersonalBests {
  const bests: PersonalBests = { sessionCount: 0, maxWeight: 0, oneRepMax: 0, maxReps: 0, volume: 0, maxDuration: 0 }
  for (const log of logs) {
    if (!log.sets.length) continue
    const s = summarize(log.sets)
    bests.sessionCount += 1
    bests.maxWeight = Math.max(bests.maxWeight, s.maxWeight)
    bests.oneRepMax = Math.max(bests.oneRepMax, s.bestOneRepMax ?? 0)
    bests.maxReps = Math.max(bests.maxReps, s.maxReps)
    bests.volume = Math.max(bests.volume, s.volume)
    bests.maxDuration = Math.max(bests.maxDuration, s.maxDuration)
  }
  return bests
}

export interface ProgressPoint {
  date: Date
  value: number
}

/** Un punto por entreno, en orden cronológico, desde `since` (o todo el historial). */
export function progress(logs: ExerciseLog[], metric: ProgressMetric, since?: Date): ProgressPoint[] {
  return logs
    .filter((l) => !since || l.date >= since)
    .filter((l) => l.sets.length > 0)
    .sort((a, b) => a.date.getTime() - b.date.getTime())
    .flatMap((l) => {
      const value = metricValue(summarize(l.sets), metric)
      return value === null ? [] : [{ date: l.date, value }]
    })
}
