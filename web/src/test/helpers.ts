import { makeI18n } from '../i18n'
import type { ExerciseLog, SetRecord, TrackingType } from '../core/stats'

export const es = makeI18n('es')
export const ca = makeI18n('ca')

/** Fecha local a mediodía (evita saltos de día por zona horaria). */
export const day = (y: number, m: number, d: number) => new Date(y, m - 1, d, 12)

export const log = (id: string, date: Date, sets: SetRecord[], trackingType: TrackingType = 'reps'): ExerciseLog => ({
  exerciseId: id, name: id, trackingType, date, sets,
})

export const close = (a: number | null, b: number, tolerance = 0.001) => a !== null && Math.abs(a - b) < tolerance
